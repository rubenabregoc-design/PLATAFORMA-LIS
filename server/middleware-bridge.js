#!/usr/bin/env node
/**
 * AbregoTech LIS — Middleware Bridge Server
 * 
 * Real TCP server that listens on configured ports for clinical analyzers,
 * implements ASTM E1381 and HL7 MLLP protocol handshakes, parses incoming
 * frames, persists results to PostgreSQL via PostgREST, and broadcasts
 * all activity to connected frontend clients via WebSocket.
 * 
 * Usage: node server/middleware-bridge.js
 * 
 * Architecture:
 *   [Analyzer] --TCP--> [Bridge TCP Listener] --parse--> [PostgREST DB]
 *                                                    \--> [WebSocket] --> [React Frontend]
 */

import net from 'net';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import {
  STX, ETX, EOT, ENQ, ACK, NAK, CR, LF,
  validateChecksum,
  extractFrameText,
  parseAstmMessage,
  generateHexDump
} from './parsers/astm-parser.js';
import {
  VT, FS,
  extractFromMllp,
  parseHl7Message,
  generateMllpAck
} from './parsers/hl7-parser.js';

// ──────────────────────────────────────────────────────────────────────────────
// Configuration
// ──────────────────────────────────────────────────────────────────────────────

const POSTGREST_URL = process.env.MIDDLEWARE_POSTGREST_URL || 'http://localhost:8000';
const WS_PORT = parseInt(process.env.MIDDLEWARE_BRIDGE_PORT || '8765', 10);
const TENANT_ID = process.env.MIDDLEWARE_TENANT_ID || 'lab-san-jose';

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const configPath = path.join(__dirname, 'analyzers-config.json');

// Default Analyzers
const DEFAULT_ANALYZERS = [
  {
    id: 'an-sysmex-01',
    name: 'Sysmex XN-1000',
    port: 5100,
    protocol: 'ASTM_E1381',
    category: 'HEMATOLOGIA',
    ackDelayMs: 0
  },
  {
    id: 'an-vitros-01',
    name: 'Ortho Vitros 4600',
    port: 5101,
    protocol: 'ASTM_E1381',
    category: 'QUIMICA',
    ackDelayMs: 20
  },
  {
    id: 'an-cobas-01',
    name: 'Roche Cobas 6000',
    port: 5102,
    protocol: 'HL7_V2',
    category: 'QUIMICA',
    ackDelayMs: 10
  },
  {
    id: 'an-alinity-01',
    name: 'Abbott Alinity ci',
    port: 5103,
    protocol: 'HL7_V2',
    category: 'INMUNOLOGIA',
    ackDelayMs: 15
  },
  {
    id: 'an-mindray-01',
    name: 'Mindray BC-5390',
    port: 5104,
    protocol: 'ASTM_E1381',
    category: 'HEMATOLOGIA',
    ackDelayMs: 5
  },
  {
    id: 'an-stago-01',
    name: 'Stago STA Compact Max',
    port: 5105,
    protocol: 'ASTM_E1381',
    category: 'COAGULACION',
    ackDelayMs: 50
  },
  {
    id: 'an-biorad-01',
    name: 'Bio-Rad D-100',
    port: 5106,
    protocol: 'ASTM_E1381',
    category: 'ESPECIALES',
    ackDelayMs: 10
  }
];

function loadAnalyzerConfig() {
  if (fs.existsSync(configPath)) {
    try {
      const data = fs.readFileSync(configPath, 'utf8');
      const list = JSON.parse(data);
      if (Array.isArray(list) && list.length > 0) {
        return list;
      }
    } catch (e) {
      console.error(`[CONFIG] Error leyendo ${configPath}:`, e.message);
    }
  }
  return DEFAULT_ANALYZERS;
}

const ANALYZER_PORTS = loadAnalyzerConfig();

// ──────────────────────────────────────────────────────────────────────────────
// WebSocket Server — broadcasts to all connected frontends
// ──────────────────────────────────────────────────────────────────────────────

const wsServer = new WebSocketServer({ port: WS_PORT });
const wsClients = new Set();

wsServer.on('connection', (ws, req) => {
  wsClients.add(ws);
  const clientIp = req.socket.remoteAddress;
  log('WS', `Frontend conectado desde ${clientIp} (${wsClients.size} clientes)`);

  // Send current analyzer statuses on connect
  ws.send(JSON.stringify({
    type: 'bridge_status',
    data: {
      analyzers: ANALYZER_PORTS.map(a => ({
        id: a.id,
        name: a.name,
        port: a.port,
        protocol: a.protocol,
        status: tcpServers.get(a.id) ? 'LISTENING' : 'OFFLINE'
      })),
      connectedClients: wsClients.size,
      uptime: process.uptime()
    },
    timestamp: new Date().toISOString()
  }));

  ws.on('message', (message) => {
    try {
      const cmd = JSON.parse(message.toString());
      handleWsCommand(cmd, ws);
    } catch (e) {
      log('WS', `Error parseando comando: ${e.message}`);
    }
  });

  ws.on('close', () => {
    wsClients.delete(ws);
    log('WS', `Frontend desconectado (${wsClients.size} clientes)`);
  });
});

function broadcast(event) {
  const payload = JSON.stringify(event);
  for (const client of wsClients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
}

function handleWsCommand(cmd, ws) {
  switch (cmd.type) {
    case 'ping':
      ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
      break;
    case 'get_status':
      ws.send(JSON.stringify({
        type: 'bridge_status',
        data: {
          analyzers: ANALYZER_PORTS.map(a => ({
            id: a.id,
            name: a.name,
            port: a.port,
            protocol: a.protocol,
            status: tcpServers.get(a.id) ? 'LISTENING' : 'OFFLINE',
            connectedSocket: analyzerSockets.has(a.id)
          })),
          connectedClients: wsClients.size,
          uptime: process.uptime()
        },
        timestamp: new Date().toISOString()
      }));
      break;
    case 'inject_test_frame':
      // Allow injecting test frames from the frontend for testing
      if (cmd.analyzerId && cmd.rawFrame) {
        const analyzerConfig = ANALYZER_PORTS.find(a => a.id === cmd.analyzerId);
        if (analyzerConfig) {
          log('INJECT', `Frame de prueba inyectado para ${analyzerConfig.name}`);
          const buffer = Buffer.from(cmd.rawFrame, 'utf8');
          if (analyzerConfig.protocol === 'ASTM_E1381') {
            processAstmData(analyzerConfig, buffer);
          } else {
            processHl7Data(analyzerConfig, buffer);
          }
        }
      }
      break;
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// TCP Listeners — One per analyzer
// ──────────────────────────────────────────────────────────────────────────────

const tcpServers = new Map();       // analyzerId -> net.Server
const analyzerSockets = new Map();  // analyzerId -> net.Socket
const astmBuffers = new Map();      // analyzerId -> { state, frameBuffer, messageBuffer }

function createTcpListener(analyzerConfig) {
  const { id, name, port, protocol, ackDelayMs } = analyzerConfig;

  const server = net.createServer((socket) => {
    const remoteAddr = `${socket.remoteAddress}:${socket.remotePort}`;
    log(name, `Analizador conectado desde ${remoteAddr}`);
    analyzerSockets.set(id, socket);

    // Initialize ASTM state machine
    if (protocol === 'ASTM_E1381') {
      astmBuffers.set(id, {
        state: 'IDLE',        // IDLE -> WAIT_STX -> ACCUMULATE -> WAIT_EOT
        frameBuffer: Buffer.alloc(0),
        messageText: '',
        frameCount: 0,
        lastActivity: Date.now()
      });
    }

    broadcast({
      type: 'analyzer_connected',
      data: { analyzerId: id, analyzerName: name, remoteAddr },
      timestamp: new Date().toISOString()
    });

    socket.on('data', (data) => {
      const hexPreview = generateHexDump(data, 32);
      log(name, `<-- ${data.length} bytes: ${hexPreview}`);

      if (protocol === 'ASTM_E1381') {
        handleAstmData(analyzerConfig, socket, data);
      } else if (protocol === 'HL7_V2') {
        handleHl7Data(analyzerConfig, socket, data);
      }
    });

    socket.on('close', () => {
      log(name, `Analizador desconectado (${remoteAddr})`);
      analyzerSockets.delete(id);
      astmBuffers.delete(id);
      broadcast({
        type: 'analyzer_disconnected',
        data: { analyzerId: id, analyzerName: name },
        timestamp: new Date().toISOString()
      });
    });

    socket.on('error', (err) => {
      log(name, `Error de socket: ${err.message}`);
      analyzerSockets.delete(id);
      broadcast({
        type: 'analyzer_error',
        data: { analyzerId: id, analyzerName: name, error: err.message },
        timestamp: new Date().toISOString()
      });
    });

    // Inactivity timeout (60 seconds)
    socket.setTimeout(60000, () => {
      log(name, `Timeout de inactividad — cerrando conexión`);
      socket.end();
    });
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      log(name, `⚠ Puerto ${port} ya en uso — reintentando en 5s...`);
      setTimeout(() => {
        server.close();
        server.listen(port, '0.0.0.0');
      }, 5000);
    } else {
      log(name, `Error de servidor TCP: ${err.message}`);
    }
  });

  server.listen(port, '0.0.0.0', () => {
    log(name, `✓ Escuchando en puerto ${port} (${protocol})`);
  });

  tcpServers.set(id, server);
  return server;
}

// ──────────────────────────────────────────────────────────────────────────────
// ASTM E1381 State Machine
// ──────────────────────────────────────────────────────────────────────────────

function handleAstmData(analyzerConfig, socket, data) {
  const { id, name, ackDelayMs } = analyzerConfig;
  let state = astmBuffers.get(id);
  if (!state) return;

  for (let i = 0; i < data.length; i++) {
    const byte = data[i];
    state.lastActivity = Date.now();

    switch (state.state) {
      case 'IDLE':
        if (byte === ENQ) {
          // Analyzer wants to send — respond with ACK
          log(name, `<ENQ> recibido — respondiendo <ACK> (delay: ${ackDelayMs}ms)`);
          broadcast({
            type: 'frame_received',
            data: {
              analyzerId: id,
              analyzerName: name,
              frameType: 'ENQ',
              direction: 'INBOUND',
              rawHex: '05',
              protocol: 'ASTM E1381'
            },
            timestamp: new Date().toISOString()
          });
          
          if (ackDelayMs > 0) {
            setTimeout(() => sendAck(socket, name), ackDelayMs);
          } else {
            sendAck(socket, name);
          }
          state.state = 'WAIT_STX';
          state.messageText = '';
          state.frameCount = 0;
        }
        break;

      case 'WAIT_STX':
        if (byte === STX) {
          state.state = 'ACCUMULATE';
          state.frameBuffer = Buffer.from([STX]);
        } else if (byte === EOT) {
          // Transmission complete
          log(name, `<EOT> recibido — fin de transmisión (${state.frameCount} frames)`);
          if (state.messageText) {
            processAstmData(analyzerConfig, Buffer.from(state.messageText, 'utf8'));
          }
          state.state = 'IDLE';
          state.messageText = '';
          state.frameCount = 0;

          broadcast({
            type: 'frame_received',
            data: {
              analyzerId: id,
              analyzerName: name,
              frameType: 'EOT',
              direction: 'INBOUND',
              rawHex: '04',
              protocol: 'ASTM E1381'
            },
            timestamp: new Date().toISOString()
          });
        }
        break;

      case 'ACCUMULATE':
        state.frameBuffer = Buffer.concat([state.frameBuffer, Buffer.from([byte])]);

        if (byte === LF) {
          // Frame complete: <STX>...<ETX><C1><C2><CR><LF>
          const checkResult = validateChecksum(state.frameBuffer);
          const frameText = extractFrameText(state.frameBuffer);
          const hexDump = generateHexDump(state.frameBuffer);
          state.frameCount++;

          log(name, `Frame #${state.frameCount}: checksum=${checkResult.valid ? 'OK' : 'FAIL'} "${frameText.substring(0, 60)}..."`);

          broadcast({
            type: 'frame_received',
            data: {
              analyzerId: id,
              analyzerName: name,
              frameType: 'STX_RECORD',
              direction: 'INBOUND',
              rawPayload: frameText,
              rawHex: hexDump,
              checksumValid: checkResult.valid,
              checksumExpected: checkResult.expected,
              checksumComputed: checkResult.computed,
              frameNumber: state.frameCount,
              protocol: 'ASTM E1381'
            },
            timestamp: new Date().toISOString()
          });

          if (checkResult.valid) {
            state.messageText += frameText + '\n';
            if (ackDelayMs > 0) {
              setTimeout(() => sendAck(socket, name), ackDelayMs);
            } else {
              sendAck(socket, name);
            }
          } else {
            log(name, `✗ Checksum inválido (esperado: ${checkResult.expected}, calculado: ${checkResult.computed}) — enviando <NAK>`);
            socket.write(Buffer.from([NAK]));
          }

          state.frameBuffer = Buffer.alloc(0);
          state.state = 'WAIT_STX';
        }
        break;
    }
  }

  astmBuffers.set(id, state);
}

function sendAck(socket, analyzerName) {
  try {
    socket.write(Buffer.from([ACK]));
    log(analyzerName, `--> <ACK> enviado`);
  } catch (e) {
    log(analyzerName, `Error enviando ACK: ${e.message}`);
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// HL7 MLLP Handler
// ──────────────────────────────────────────────────────────────────────────────

function handleHl7Data(analyzerConfig, socket, data) {
  const { id, name, ackDelayMs } = analyzerConfig;
  
  // Check for MLLP framing
  const hasVt = data.indexOf(VT) !== -1;
  const hasFs = data.indexOf(FS) !== -1;

  if (!hasVt && !hasFs) {
    // Possibly a partial message or raw text — try to parse anyway
    log(name, `Datos sin encapsulación MLLP — intentando parsear como texto plano`);
    processHl7Data(analyzerConfig, data);
    return;
  }

  const messageText = extractFromMllp(data);
  const hexDump = generateHexDump(data, 48);

  log(name, `HL7 MLLP recibido: ${messageText.substring(0, 80)}...`);

  broadcast({
    type: 'frame_received',
    data: {
      analyzerId: id,
      analyzerName: name,
      frameType: 'MLLP_ORU',
      direction: 'INBOUND',
      rawPayload: messageText,
      rawHex: hexDump,
      protocol: 'HL7 v2.5 MLLP'
    },
    timestamp: new Date().toISOString()
  });

  // Parse and process
  processHl7Data(analyzerConfig, Buffer.from(messageText, 'utf8'));

  // Send MLLP ACK
  const parsed = parseHl7Message(messageText);
  const ackBuffer = generateMllpAck(parsed, 'AA', 'Mensaje procesado por AbregoTech LIS');
  
  if (ackDelayMs > 0) {
    setTimeout(() => {
      try {
        socket.write(ackBuffer);
        log(name, `--> ACK MLLP enviado (MSA|AA|${parsed.messageControlId})`);
      } catch (e) {
        log(name, `Error enviando ACK MLLP: ${e.message}`);
      }
    }, ackDelayMs);
  } else {
    try {
      socket.write(ackBuffer);
      log(name, `--> ACK MLLP enviado (MSA|AA|${parsed.messageControlId})`);
    } catch (e) {
      log(name, `Error enviando ACK MLLP: ${e.message}`);
    }
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Result Processing Pipeline
// ──────────────────────────────────────────────────────────────────────────────

async function processAstmData(analyzerConfig, dataBuffer) {
  const { id, name } = analyzerConfig;
  const messageText = dataBuffer.toString('utf8');
  
  try {
    const parsed = parseAstmMessage(messageText);
    const barcode = parsed.order?.specimenId || '';
    const patientName = parsed.patient?.patientName || 'Desconocido';

    log(name, `Mensaje ASTM parseado: barcode=${barcode}, paciente=${patientName}, ${parsed.results.length} resultado(s)`);

    // Query PostgREST for matching order
    let matchedOrder = null;
    if (barcode) {
      matchedOrder = await queryOrderByBarcode(barcode);
    }

    // Process each result
    for (const result of parsed.results) {
      const resultRecord = {
        id: `res-bridge-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        tenantId: TENANT_ID,
        orderId: matchedOrder?.id || '',
        testId: '',
        parameterId: '',
        parameterName: result.testCode,
        unit: result.unit,
        value: result.value,
        numericValue: result.numericValue,
        flag: result.flag,
        refRangeText: result.referenceRange,
        source: 'MIDDLEWARE_ASTM',
        analyzerName: name,
        status: 'PENDIENTE',
        specimenType: '',
        version: 1
      };

      // Persist to database
      await persistResult(resultRecord, barcode, patientName);

      // Broadcast to frontend
      broadcast({
        type: 'result_parsed',
        data: {
          analyzerId: id,
          analyzerName: name,
          protocol: 'ASTM',
          barcode,
          patientName,
          matchedOrderCode: matchedOrder?.order_number || null,
          result: resultRecord,
          parsedFrame: {
            header: parsed.header,
            patient: parsed.patient,
            order: parsed.order,
            resultRecord: result,
            comments: parsed.comments
          }
        },
        timestamp: new Date().toISOString()
      });
    }

    // Build middleware log entry
    const logEntry = {
      analyzerId: id,
      analyzerName: name,
      protocol: 'ASTM E1381 / E1394',
      direction: 'INBOUND',
      frameType: 'STX_RECORD',
      checksumValid: true,
      sampleBarcode: barcode,
      patientName,
      matchedOrderCode: matchedOrder?.order_number || null,
      autoValidated: false,
      rawPayload: messageText,
      parsedData: {
        sampleBarcode: barcode,
        orderMatched: matchedOrder?.order_number || null,
        resultCount: parsed.results.length,
        results: parsed.results.map(r => ({
          testCode: r.testCode,
          value: r.value,
          unit: r.unit,
          flag: r.flag
        }))
      },
      status: matchedOrder ? 'PROCESADO' : 'ORDEN_NO_ENCONTRADA'
    };

    broadcast({
      type: 'middleware_log',
      data: logEntry,
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    log(name, `Error procesando ASTM: ${err.message}`);
    broadcast({
      type: 'middleware_log',
      data: {
        analyzerId: id,
        analyzerName: name,
        protocol: 'ASTM E1381',
        direction: 'INBOUND',
        status: 'ERROR_PARSER',
        errorMessage: err.message,
        rawPayload: messageText
      },
      timestamp: new Date().toISOString()
    });
  }
}

async function processHl7Data(analyzerConfig, dataBuffer) {
  const { id, name } = analyzerConfig;
  const messageText = dataBuffer.toString('utf8');

  try {
    const parsed = parseHl7Message(messageText);
    const barcode = parsed.obr?.fillerOrderNumber || parsed.obr?.placerOrderNumber || '';
    const patientName = parsed.pid?.patientName || 'Desconocido';

    log(name, `Mensaje HL7 parseado: type=${parsed.messageType}, barcode=${barcode}, paciente=${patientName}, ${parsed.obx.length} OBX(s)`);

    let matchedOrder = null;
    if (barcode) {
      matchedOrder = await queryOrderByBarcode(barcode);
    }

    for (const obx of parsed.obx) {
      const resultRecord = {
        id: `res-bridge-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        tenantId: TENANT_ID,
        orderId: matchedOrder?.id || '',
        testId: '',
        parameterId: '',
        parameterName: obx.testName || obx.testCode,
        unit: obx.unit,
        value: obx.value,
        numericValue: obx.numericValue,
        flag: obx.flag,
        refRangeText: obx.referenceRange,
        source: 'MIDDLEWARE_HL7',
        analyzerName: name,
        status: 'PENDIENTE',
        specimenType: '',
        version: 1
      };

      await persistResult(resultRecord, barcode, patientName);

      broadcast({
        type: 'result_parsed',
        data: {
          analyzerId: id,
          analyzerName: name,
          protocol: 'HL7',
          barcode,
          patientName,
          matchedOrderCode: matchedOrder?.order_number || null,
          result: resultRecord,
          parsedFrame: {
            msh: parsed.msh,
            pid: parsed.pid,
            obr: parsed.obr,
            obx,
            notes: parsed.nte
          }
        },
        timestamp: new Date().toISOString()
      });
    }

    broadcast({
      type: 'middleware_log',
      data: {
        analyzerId: id,
        analyzerName: name,
        protocol: `HL7 v2.5 (${parsed.messageType} MLLP)`,
        direction: 'INBOUND',
        frameType: 'MLLP_ORU',
        checksumValid: true,
        sampleBarcode: barcode,
        patientName,
        matchedOrderCode: matchedOrder?.order_number || null,
        autoValidated: false,
        rawPayload: messageText,
        parsedData: {
          sampleBarcode: barcode,
          orderMatched: matchedOrder?.order_number || null,
          messageType: parsed.messageType,
          resultCount: parsed.obx.length,
          results: parsed.obx.map(o => ({
            testCode: o.testCode,
            testName: o.testName,
            value: o.value,
            unit: o.unit,
            flag: o.flag
          }))
        },
        status: matchedOrder ? 'PROCESADO' : 'ORDEN_NO_ENCONTRADA'
      },
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    log(name, `Error procesando HL7: ${err.message}`);
    broadcast({
      type: 'middleware_log',
      data: {
        analyzerId: id,
        analyzerName: name,
        protocol: 'HL7 v2.5 MLLP',
        direction: 'INBOUND',
        status: 'ERROR_PARSER',
        errorMessage: err.message,
        rawPayload: messageText
      },
      timestamp: new Date().toISOString()
    });
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// PostgREST Integration
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Query PostgREST for an order matching a specimen barcode.
 */
async function queryOrderByBarcode(barcode) {
  try {
    const url = `${POSTGREST_URL}/specimens?barcode=eq.${encodeURIComponent(barcode)}&select=*,order:orders(*)`;
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' }
    });
    
    if (!response.ok) {
      log('DB', `PostgREST query fallida (${response.status}) para barcode: ${barcode}`);
      return null;
    }

    const data = await response.json();
    if (data.length > 0 && data[0].order) {
      log('DB', `Orden encontrada: ${data[0].order.order_number} para barcode ${barcode}`);
      return data[0].order;
    }

    // Fallback: try direct order number match
    const url2 = `${POSTGREST_URL}/orders?order_number=eq.${encodeURIComponent(barcode)}&limit=1`;
    const response2 = await fetch(url2, {
      headers: { 'Accept': 'application/json' }
    });
    
    if (response2.ok) {
      const data2 = await response2.json();
      if (data2.length > 0) {
        log('DB', `Orden encontrada por order_number: ${data2[0].order_number}`);
        return data2[0];
      }
    }

    log('DB', `No se encontró orden para barcode: ${barcode}`);
    return null;
  } catch (err) {
    log('DB', `Error consultando PostgREST: ${err.message}`);
    return null;
  }
}

/**
 * Persist a result to the database via PostgREST.
 */
async function persistResult(result, barcode, patientName) {
  try {
    const payload = {
      id: result.id,
      tenant_id: result.tenantId,
      order_id: result.orderId || null,
      test_id: result.testId || null,
      parameter_id: result.parameterId || null,
      parameter_name: result.parameterName,
      unit: result.unit,
      value: result.value,
      numeric_value: result.numericValue,
      flag: result.flag,
      ref_range_text: result.refRangeText,
      source: result.source,
      analyzer_name: result.analyzerName,
      status: result.status,
      specimen_type: result.specimenType || null,
      version: result.version || 1,
      sample_barcode: barcode,
      patient_name: patientName,
      created_at: new Date().toISOString()
    };

    const response = await fetch(`${POSTGREST_URL}/results`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(payload)
    });

    if (response.ok || response.status === 201) {
      log('DB', `✓ Resultado persistido: ${result.parameterName}=${result.value} ${result.unit} (${barcode})`);
    } else {
      const errText = await response.text();
      log('DB', `⚠ Error persistiendo resultado (${response.status}): ${errText}`);
    }
  } catch (err) {
    log('DB', `Error de conexión con PostgREST: ${err.message} — resultado almacenado solo en WebSocket`);
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Logging
// ──────────────────────────────────────────────────────────────────────────────

function log(source, message) {
  const timestamp = new Date().toISOString().replace('T', ' ').replace('Z', '');
  console.log(`[${timestamp}] [${source}] ${message}`);
}

// ──────────────────────────────────────────────────────────────────────────────
// Startup
// ──────────────────────────────────────────────────────────────────────────────

function startBridge() {
  console.log('');
  console.log('  ╔══════════════════════════════════════════════════════════════╗');
  console.log('  ║  AbregoTech LIS — Middleware Bridge Server                  ║');
  console.log('  ║  TCP/ASTM/HL7 → WebSocket Real-Time Bridge                 ║');
  console.log('  ╚══════════════════════════════════════════════════════════════╝');
  console.log('');

  log('BRIDGE', `WebSocket server en ws://localhost:${WS_PORT}`);
  log('BRIDGE', `PostgREST API en ${POSTGREST_URL}`);
  log('BRIDGE', `Tenant ID: ${TENANT_ID}`);
  console.log('');

  // Create TCP listeners for each analyzer
  for (const analyzer of ANALYZER_PORTS) {
    createTcpListener(analyzer);
  }

  console.log('');
  log('BRIDGE', '═══ Middleware Bridge listo. Esperando conexiones de analizadores... ═══');
  console.log('');
}

// Graceful shutdown
process.on('SIGINT', () => {
  log('BRIDGE', 'Cerrando bridge...');
  
  for (const [id, server] of tcpServers) {
    server.close();
  }
  for (const [id, socket] of analyzerSockets) {
    socket.destroy();
  }
  wsServer.close();
  
  log('BRIDGE', 'Bridge cerrado correctamente.');
  process.exit(0);
});

process.on('SIGTERM', () => process.emit('SIGINT'));

// Start
startBridge();
