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
  STX, ETX, EOT, ENQ, ACK, NAK, ETB, CR, LF,
  computeAstmChecksum,
  validateChecksum,
  extractFrameText,
  formatAstmFrame,
  buildAstmOrderLines,
  parseAstmMessage,
  generateHexDump
} from './parsers/astm-parser.js';
import {
  VT, FS,
  extractFromMllp,
  wrapInMllp,
  parseHl7Message,
  generateMllpAck,
  generateHl7OrderResponse,
  generateMllpOrderResponse
} from './parsers/hl7-parser.js';
import { getAnalyzerDriver, listAvailableDrivers, saveDriverCassette } from './drivers/index.js';

// ──────────────────────────────────────────────────────────────────────────────
// Configuration & Hybrid Sync (Local On-Prem + Cloud Supabase)
// ──────────────────────────────────────────────────────────────────────────────

import dotenv from 'dotenv';
dotenv.config();

const POSTGREST_URL = process.env.MIDDLEWARE_POSTGREST_URL || process.env.VITE_SUPABASE_LOCAL_URL || 'http://localhost:8000';
const CLOUD_URL = process.env.VITE_SUPABASE_CLOUD_URL || process.env.SUPABASE_CLOUD_URL;
const CLOUD_KEY = process.env.VITE_SUPABASE_CLOUD_ANON_KEY || process.env.SUPABASE_CLOUD_ANON_KEY;
const WS_PORT = parseInt(process.env.MIDDLEWARE_BRIDGE_PORT || '8765', 10);
const TENANT_ID = process.env.MIDDLEWARE_TENANT_ID || 'lab-san-jose';

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const configPath = path.join(__dirname, 'analyzers-config.json');

// Local On-Premise Spool (Zero Data Loss on Internet / Cloud Outages)
// Non-blocking FIFO Queue with fs.promises
const SPOOL_DIR = path.join(__dirname, 'spool');
if (!fs.existsSync(SPOOL_DIR)) {
  fs.mkdirSync(SPOOL_DIR, { recursive: true });
}

const spoolQueue = [];
let isSpoolWorkerActive = false;

async function processSpoolQueue() {
  if (isSpoolWorkerActive || spoolQueue.length === 0) return;
  isSpoolWorkerActive = true;
  while (spoolQueue.length > 0) {
    const item = spoolQueue.shift();
    try {
      const targetPath = path.join(SPOOL_DIR, item.filename);
      await fs.promises.appendFile(targetPath, item.content, 'utf8');
    } catch (err) {
      console.error(`[SPOOL] Error asíncrono en disco: ${err.message}`);
    }
  }
  isSpoolWorkerActive = false;
}

function appendToLocalSpool(filename, record) {
  const line = JSON.stringify(record) + '\n';
  spoolQueue.push({ filename, content: line });
  processSpoolQueue().catch(() => {});
}

// ──────────────────────────────────────────────────────────────────────────────
// Commercial Test Homologation Dictionary & Normalization Engine
// ──────────────────────────────────────────────────────────────────────────────
const CLINICAL_TEST_HOMOLOGATION = {
  // Hematology (Sysmex, Mindray, Pentra, Cell-Dyn, Coulter)
  'WBC': { name: 'Leucocitos', unit: '10^3/uL', refMin: 4.5, refMax: 11.0 },
  'RBC': { name: 'Eritrocitos', unit: '10^6/uL', refMin: 4.2, refMax: 5.9 },
  'HGB': { name: 'Hemoglobina', unit: 'g/dL', refMin: 12.0, refMax: 17.5 },
  'HCT': { name: 'Hematocrito', unit: '%', refMin: 37.0, refMax: 50.0 },
  'PLT': { name: 'Plaquetas', unit: '10^3/uL', refMin: 150, refMax: 450 },
  'MCV': { name: 'VCM', unit: 'fL', refMin: 80, refMax: 100 },
  'MCH': { name: 'HCM', unit: 'pg', refMin: 27, refMax: 33 },
  'MCHC': { name: 'CHCM', unit: 'g/dL', refMin: 32, refMax: 36 },
  'RDW-CV': { name: 'RDW-CV', unit: '%', refMin: 11.5, refMax: 14.5 },
  'LYMPH%': { name: 'Linfocitos %', unit: '%', refMin: 20, refMax: 45 },
  'NEUT%': { name: 'Neutrófilos %', unit: '%', refMin: 40, refMax: 75 },
  'MONO%': { name: 'Monocitos %', unit: '%', refMin: 2, refMax: 10 },
  'EO%': { name: 'Eosinófilos %', unit: '%', refMin: 1, refMax: 4 },
  'BASO%': { name: 'Basófilos %', unit: '%', refMin: 0, refMax: 2 },
  
  // Chemistry (Cobas, Vitros, Alinity, Dimension, Architect)
  'GLU': { name: 'Glucosa Basal', unit: 'mg/dL', refMin: 70, refMax: 100 },
  'GLUC': { name: 'Glucosa Basal', unit: 'mg/dL', refMin: 70, refMax: 100 },
  'GLUC3': { name: 'Glucosa Basal', unit: 'mg/dL', refMin: 70, refMax: 100 },
  '001': { name: 'Glucosa Basal', unit: 'mg/dL', refMin: 70, refMax: 100 },
  'BUN': { name: 'Nitrógeno Ureico (BUN)', unit: 'mg/dL', refMin: 7, refMax: 20 },
  'UREA': { name: 'Urea', unit: 'mg/dL', refMin: 15, refMax: 45 },
  'CREA': { name: 'Creatinina Sérica', unit: 'mg/dL', refMin: 0.6, refMax: 1.3 },
  'CREAT': { name: 'Creatinina Sérica', unit: 'mg/dL', refMin: 0.6, refMax: 1.3 },
  'CHOL': { name: 'Colesterol Total', unit: 'mg/dL', refMin: 0, refMax: 200 },
  'TRIG': { name: 'Triglicéridos', unit: 'mg/dL', refMin: 0, refMax: 150 },
  'HDL': { name: 'Colesterol HDL', unit: 'mg/dL', refMin: 40, refMax: 60 },
  'LDL': { name: 'Colesterol LDL', unit: 'mg/dL', refMin: 0, refMax: 100 },
  'AST': { name: 'Aspartato Aminotransferasa (AST/GOT)', unit: 'U/L', refMin: 10, refMax: 40 },
  'ALT': { name: 'Alanina Aminotransferasa (ALT/GPT)', unit: 'U/L', refMin: 7, refMax: 56 },
  'ALP': { name: 'Fosfatasa Alcalina', unit: 'U/L', refMin: 44, refMax: 147 },
  'GGT': { name: 'Gamma Glutamil Transferasa', unit: 'U/L', refMin: 9, refMax: 48 },
  'TBIL': { name: 'Bilirrubina Total', unit: 'mg/dL', refMin: 0.2, refMax: 1.2 },
  'DBIL': { name: 'Bilirrubina Directa', unit: 'mg/dL', refMin: 0.0, refMax: 0.3 },
  'NA': { name: 'Sodio (Na)', unit: 'mEq/L', refMin: 135, refMax: 145 },
  'K': { name: 'Potasio (K)', unit: 'mEq/L', refMin: 3.5, refMax: 5.1 },
  'CL': { name: 'Cloro (Cl)', unit: 'mEq/L', refMin: 98, refMax: 107 },
  'CA': { name: 'Calcio Total', unit: 'mg/dL', refMin: 8.5, refMax: 10.5 },
  'TP': { name: 'Proteínas Totales', unit: 'g/dL', refMin: 6.0, refMax: 8.3 },
  'ALB': { name: 'Albúmina', unit: 'g/dL', refMin: 3.5, refMax: 5.0 },
  'UA': { name: 'Ácido Úrico', unit: 'mg/dL', refMin: 3.5, refMax: 7.2 },
  
  // Coagulation (Stago STA, Sysmex CS, ACL TOP)
  'PT': { name: 'Tiempo de Protrombina (TP)', unit: 'seg', refMin: 11.0, refMax: 13.5 },
  'INR': { name: 'INR (Protrombina)', unit: '', refMin: 0.8, refMax: 1.2 },
  'APTT': { name: 'Tiempo de Tromboplastina (TTPa)', unit: 'seg', refMin: 25.0, refMax: 35.0 },
  'FIB': { name: 'Fibrinógeno', unit: 'mg/dL', refMin: 200, refMax: 400 },
  
  // Immunology & Hormones (Alinity, Cobas e411, Vitros ECi)
  'HBA1C': { name: 'Hemoglobina Glicosilada A1c', unit: '%', refMin: 4.0, refMax: 5.6 },
  'TSH': { name: 'Hormona Estimulante de Tiroides (TSH)', unit: 'uIU/mL', refMin: 0.4, refMax: 4.0 },
  'FT4': { name: 'T4 Libre', unit: 'ng/dL', refMin: 0.8, refMax: 1.8 }
};

function homologateTest(testCode, rawUnit, rawRefRange) {
  const cleanCode = (testCode || '').trim().toUpperCase();
  const match = CLINICAL_TEST_HOMOLOGATION[cleanCode];
  if (match) {
    return {
      parameterName: match.name,
      unit: rawUnit || match.unit,
      refRange: rawRefRange || `${match.refMin} - ${match.refMax}`,
      refMin: match.refMin,
      refMax: match.refMax
    };
  }
  return {
    parameterName: testCode,
    unit: rawUnit || '',
    refRange: rawRefRange || '',
    refMin: null,
    refMax: null
  };
}

function evaluateClinicalFlag(numericVal, refMin, refMax, rawFlag) {
  if (rawFlag && ['HH', 'LL', 'PH', 'PL', 'CRITICO_ALTO', 'CRITICO_BAJO'].includes(rawFlag)) {
    return rawFlag.includes('H') ? 'CRITICO_ALTO' : 'CRITICO_BAJO';
  }
  if (numericVal !== null && refMin !== null && refMax !== null) {
    const rangeSpan = Math.abs(refMax - refMin);
    if (numericVal < refMin - (rangeSpan * 0.4)) return 'CRITICO_BAJO';
    if (numericVal > refMax + (rangeSpan * 0.4)) return 'CRITICO_ALTO';
    if (numericVal < refMin) return 'BAJO';
    if (numericVal > refMax) return 'ALTO';
    return 'NORMAL';
  }
  return rawFlag || 'NORMAL';
}

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
  let list = DEFAULT_ANALYZERS;
  if (fs.existsSync(configPath)) {
    try {
      const data = fs.readFileSync(configPath, 'utf8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        list = parsed;
      }
    } catch (e) {
      console.error(`[CONFIG] Error leyendo ${configPath}:`, e.message);
    }
  }
  // Automatically bind and enrich with modular driver profile
  return list.map(item => getAnalyzerDriver(item));
}

const ANALYZER_PORTS = loadAnalyzerConfig();

// ──────────────────────────────────────────────────────────────────────────────
// WebSocket & HTTP Server — Serves status HTML to browsers & WebSocket to LIS
// ──────────────────────────────────────────────────────────────────────────────

const httpServer = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  const analyzersListHtml = ANALYZER_PORTS.map(a => `
    <div style="background:#0b1329; border:1px solid #1e293b; border-radius:12px; padding:12px 16px; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
      <div>
        <strong style="color:#f8fafc; font-size:14px;">${a.name}</strong>
        <div style="color:#64748b; font-size:11px; font-family:monospace; margin-top:2px;">Protocolo: ${a.protocol} &bull; Puerto TCP: :${a.port} &bull; Driver: ${a.driverId || a.id || 'estándar'}</div>
      </div>
      <span style="background:rgba(16,185,129,0.15); color:#34d399; border:1px solid rgba(16,185,129,0.3); font-size:11px; font-weight:800; padding:4px 10px; border-radius:9999px;">
        ESCUCHANDO TCP :${a.port}
      </span>
    </div>
  `).join('');

  res.end(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>AbregoTech LIS — Middleware Bridge :8765</title>
  <style>
    body { margin:0; font-family:system-ui,-apple-system,sans-serif; background:#020617; color:#f8fafc; display:flex; align-items:center; justify-content:center; min-height:100vh; padding:20px; box-sizing:border-box; }
    .card { max-width:640px; width:100%; background:#0f172a; border:1px solid #1e293b; border-radius:24px; padding:32px; box-shadow:0 25px 50px -12px rgba(0,0,0,0.5); }
    .badge { background:rgba(34,211,238,0.15); color:#22d3ee; border:1px solid rgba(34,211,238,0.3); font-size:11px; font-weight:800; padding:4px 12px; border-radius:9999px; text-transform:uppercase; font-family:monospace; }
    .btn { display:inline-block; margin-top:16px; padding:12px 24px; background:linear-gradient(135deg, #06b6d4, #10b981); color:#020617; text-decoration:none; font-weight:900; font-size:13px; border-radius:12px; text-transform:uppercase; letter-spacing:0.5px; transition:transform 0.1s; }
    .btn:hover { transform:scale(1.02); }
  </style>
</head>
<body>
  <div class="card">
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
      <span class="badge">WebSocket Bridge Activo :8765</span>
      <span style="color:#10b981; font-size:12px; font-weight:bold;">● EN LÍNEA</span>
    </div>
    <h1 style="margin:0 0 8px 0; font-size:22px; font-weight:900; color:#fff;">Motor de Integración & Ingestión ASTM/HL7</h1>
    <p style="color:#94a3b8; font-size:13px; line-height:1.5; margin:0 0 20px 0;">
      Este puerto (<strong>:8765</strong>) es el canal WebSocket de baja latencia para los analizadores clínicos. Para acceder a la aplicación clínica LIS, ingresa en el puerto principal <strong>:3000</strong>.
    </p>

    <div style="background:#020617; border:1px solid #1e293b; border-radius:16px; padding:16px; margin-bottom:20px;">
      <div style="font-size:11px; font-weight:bold; color:#64748b; text-transform:uppercase; margin-bottom:12px; letter-spacing:0.5px;">
        Puertos TCP de Analizadores Conectados (${ANALYZER_PORTS.length})
      </div>
      ${analyzersListHtml}
    </div>

    <div style="text-align:center;">
      <a href="http://localhost:3000" class="btn">Abrir Plataforma LIS (http://localhost:3000) &rarr;</a>
    </div>
  </div>
</body>
</html>`);
});

const wsServer = new WebSocketServer({ server: httpServer });
const wsClients = new Set();

httpServer.listen(WS_PORT, '0.0.0.0', () => {
  log('WS', `Servidor HTTP y WebSocket Bridge escuchando en http://0.0.0.0:${WS_PORT}`);
});

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
    case 'print_zpl':
      // Direct raw TCP socket printing to Zebra / thermal printers on port 9100
      if (cmd.ip && cmd.zpl) {
        const port = cmd.port || 9100;
        log('PRINT', `Enviando comando ZPL directo vía TCP a ${cmd.ip}:${port}`);
        const printSocket = new net.Socket();
        printSocket.setTimeout(3500);
        printSocket.connect(port, cmd.ip, () => {
          printSocket.write(cmd.zpl, 'utf8', () => {
            printSocket.end();
            log('PRINT', `✓ Trama ZPL enviada con éxito al cabezal térmico ${cmd.ip}:${port}`);
            try {
              ws.send(JSON.stringify({
                type: 'print_result',
                success: true,
                message: `Impresión ZPL despachada a ${cmd.ip}:${port}`
              }));
            } catch (_) {}
          });
        });
        printSocket.on('error', (err) => {
          log('PRINT', `Error al comunicar con impresora ${cmd.ip}:${port}: ${err.message}`);
          try {
            ws.send(JSON.stringify({
              type: 'print_result',
              success: false,
              message: `No se pudo conectar a la impresora ${cmd.ip}:${port} (${err.message})`
            }));
          } catch (_) {}
        });
        printSocket.on('timeout', () => {
          printSocket.destroy();
          log('PRINT', `Timeout al conectar con impresora ${cmd.ip}:${port}`);
        });
      }
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
            processAstmData(analyzerConfig, null, buffer);
          } else {
            processHl7Data(analyzerConfig, null, buffer);
          }
        }
      }
      break;
    case 'save_analyzer_config':
      if (cmd.analyzer) {
        addOrUpdateAnalyzerConfig(cmd.analyzer);
        ws.send(JSON.stringify({
          type: 'analyzer_config_saved',
          data: { analyzerId: cmd.analyzer.id, status: 'SUCCESS' },
          timestamp: new Date().toISOString()
        }));
      }
      break;
    case 'delete_analyzer_config':
      if (cmd.analyzerId) {
        removeAnalyzerConfig(cmd.analyzerId);
        ws.send(JSON.stringify({
          type: 'analyzer_config_deleted',
          data: { analyzerId: cmd.analyzerId, status: 'SUCCESS' },
          timestamp: new Date().toISOString()
        }));
      }
      break;
    case 'get_driver_catalog':
      ws.send(JSON.stringify({
        type: 'driver_catalog',
        data: listAvailableDrivers(),
        timestamp: new Date().toISOString()
      }));
      break;
    case 'sync_mappings':
      if (Array.isArray(cmd.mappings)) {
        try {
          const cachePath = path.resolve(__dirname, 'mappings-cache.json');
          fs.writeFileSync(cachePath, JSON.stringify(cmd.mappings, null, 2), 'utf8');
          log('HOMOLOGATION', `✓ Sync Engine: ${cmd.mappings.length} mapeos de analitos sincronizados en caliente en el Middleware`);
          ws.send(JSON.stringify({
            type: 'mappings_synced',
            count: cmd.mappings.length,
            timestamp: new Date().toISOString()
          }));
        } catch (e) {
          log('HOMOLOGATION', `Error guardando mappings-cache.json: ${e.message}`);
        }
      }
      break;
    case 'install_driver_cassette':
      if (cmd.cassette) {
        try {
          const installed = saveDriverCassette(cmd.cassette);
          log('CASSETTE', `✓ Cassette instalado exitosamente: ${installed.name}`);
          ws.send(JSON.stringify({
            type: 'cassette_installed',
            data: installed,
            timestamp: new Date().toISOString()
          }));
          broadcast({
            type: 'driver_catalog',
            data: listAvailableDrivers(),
            timestamp: new Date().toISOString()
          });
        } catch (err) {
          log('CASSETTE', `Error instalando cassette: ${err.message}`);
          ws.send(JSON.stringify({
            type: 'cassette_error',
            error: err.message,
            timestamp: new Date().toISOString()
          }));
        }
      }
      break;
    case 'test_tcp_connection': {
      const host = cmd.host || '127.0.0.1';
      const port = parseInt(cmd.port, 10);
      const startTime = Date.now();
      const testSocket = new net.Socket();
      let finished = false;

      testSocket.setTimeout(2500);

      testSocket.connect(port, host, () => {
        if (finished) return;
        finished = true;
        const latency = Date.now() - startTime;
        testSocket.destroy();
        ws.send(JSON.stringify({
          type: 'test_tcp_connection_result',
          data: {
            success: true,
            host,
            port,
            latency,
            message: `✓ SOCKET TCP CONECTADO REAL (IP ${host}:${port}) — Latencia verificada: ${latency} ms. Host activo y respondiendo.`
          },
          timestamp: new Date().toISOString()
        }));
      });

      testSocket.on('timeout', () => {
        if (finished) return;
        finished = true;
        testSocket.destroy();
        ws.send(JSON.stringify({
          type: 'test_tcp_connection_result',
          data: {
            success: false,
            host,
            port,
            message: `❌ Host inalcanzable (Timeout 2.5s en ${host}:${port}). No se detectó analizador respondiendo en esa IP física en la red.`
          },
          timestamp: new Date().toISOString()
        }));
      });

      testSocket.on('error', (err) => {
        if (finished) return;
        finished = true;
        testSocket.destroy();
        ws.send(JSON.stringify({
          type: 'test_tcp_connection_result',
          data: {
            success: false,
            host,
            port,
            message: `❌ Conexión rechazada (${err.code || err.message}) en ${host}:${port}. Verifique la configuración de red del analizador.`
          },
          timestamp: new Date().toISOString()
        }));
      });
      break;
    }
    case 'run_sample_transmission': {
      const targetAnalyzer = cmd.analyzerId 
        ? ANALYZER_PORTS.find(a => a.id === cmd.analyzerId) 
        : ANALYZER_PORTS[0];

      if (targetAnalyzer && tcpServers.has(targetAnalyzer.id)) {
        log('SAMPLE_TEST', `Disparando transmisión TCP real hacia ${targetAnalyzer.name} (puerto ${targetAnalyzer.port})...`);
        const senderSocket = new net.Socket();
        senderSocket.connect(targetAnalyzer.port, '127.0.0.1', () => {
          if (targetAnalyzer.protocol === 'HL7_V2') {
            const hl7Msg = 
              `MSH|^~\\&|${targetAnalyzer.name.replace(/\\s+/g, '_')}|LAB|LIS|ABREGOTECH|${new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14)}||ORU^R01|MSG-${Date.now().toString().slice(-5)}|P|2.5\r` +
              `PID|1||8-812-4432||Navarro^Javier||19850412|M\r` +
              `OBR|1||BC-${Math.floor(100000 + Math.random() * 900000)}|^^^HEMOGRAMA_COMPLETO\r` +
              `OBX|1|NM|WBC^Leucocitos|1|7.85|10^3/uL|4.5-11.0|N|||F\r` +
              `OBX|2|NM|HGB^Hemoglobina|1|15.2|g/dL|13.5-17.5|N|||F\r` +
              `OBX|3|NM|PLT^Plaquetas|1|260|10^3/uL|150-450|N|||F\r`;
            const mllpPacket = Buffer.concat([Buffer.from([0x0B]), Buffer.from(hl7Msg, 'utf8'), Buffer.from([0x1C, 0x0D])]);
            senderSocket.write(mllpPacket);
            senderSocket.on('data', () => {
              senderSocket.end();
            });
          } else {
            senderSocket.write(Buffer.from([0x05]));
            let step = 0;
            const barcode = `BC-${Math.floor(100000 + Math.random() * 900000)}`;
            const makeFrame = (num, txt) => {
              const body = `${num}${txt}`;
              const inner = Buffer.concat([Buffer.from(body, 'utf8'), Buffer.from([0x03])]);
              let sum = 0;
              for (const b of inner) sum += b;
              const cs = (sum % 256).toString(16).toUpperCase().padStart(2, '0');
              return Buffer.concat([Buffer.from([0x02]), inner, Buffer.from(`${cs}\r\n`, 'ascii')]);
            };
            const frames = [
              makeFrame(1, `H|\\^&|||${targetAnalyzer.name}|||||||P|1`),
              makeFrame(2, 'P|1||8-897-180||Navarro^Javier||19880720|M'),
              makeFrame(3, `O|1|${barcode}||^^^PERFIL_GENERAL|R`),
              makeFrame(4, 'R|1|^^^GLU|94.0|mg/dL|70-99|N||F'),
              makeFrame(5, 'R|2|^^^CREA|0.92|mg/dL|0.6-1.3|N||F'),
              makeFrame(6, 'L|1|N')
            ];
            senderSocket.on('data', (d) => {
              if (d[0] === 0x06) {
                if (step < frames.length) {
                  senderSocket.write(frames[step]);
                  step++;
                } else {
                  senderSocket.write(Buffer.from([0x04]));
                  setTimeout(() => senderSocket.end(), 200);
                }
              }
            });
          }
        });
        senderSocket.on('error', (err) => {
          log('SAMPLE_TEST', `Error en prueba TCP: ${err.message}`);
        });
      }
      break;
    }
  }
}

function addOrUpdateAnalyzerConfig(config) {
  const enriched = getAnalyzerDriver(config);
  
  if (tcpServers.has(enriched.id)) {
    try {
      tcpServers.get(enriched.id).close();
      tcpServers.delete(enriched.id);
    } catch (_) {}
  }

  const idx = ANALYZER_PORTS.findIndex(a => a.id === enriched.id);
  if (idx !== -1) {
    ANALYZER_PORTS[idx] = enriched;
  } else {
    ANALYZER_PORTS.push(enriched);
  }

  try {
    fs.writeFileSync(configPath, JSON.stringify(ANALYZER_PORTS, null, 2), 'utf8');
    log('CONFIG', `✓ Configuración actualizada en analyzers-config.json: ${enriched.name} (Puerto ${enriched.port})`);
  } catch (err) {
    log('CONFIG', `Error escribiendo ${configPath}: ${err.message}`);
  }

  createTcpListener(enriched);

  broadcast({
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
  });
}

function removeAnalyzerConfig(analyzerId) {
  if (tcpServers.has(analyzerId)) {
    try {
      tcpServers.get(analyzerId).close();
      tcpServers.delete(analyzerId);
    } catch (_) {}
  }
  const idx = ANALYZER_PORTS.findIndex(a => a.id === analyzerId);
  if (idx !== -1) {
    const removed = ANALYZER_PORTS.splice(idx, 1)[0];
    try {
      fs.writeFileSync(configPath, JSON.stringify(ANALYZER_PORTS, null, 2), 'utf8');
      log('CONFIG', `✓ Analizador eliminado de configuración: ${removed.name}`);
    } catch (err) {
      log('CONFIG', `Error escribiendo ${configPath}: ${err.message}`);
    }
  }
  broadcast({
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
  });
}

// ──────────────────────────────────────────────────────────────────────────────
// TCP Listeners — One per analyzer
// ──────────────────────────────────────────────────────────────────────────────

const tcpServers = new Map();       // analyzerId -> net.Server
const analyzerSockets = new Map();  // analyzerId -> net.Socket or SerialPort
const astmBuffers = new Map();      // analyzerId -> { state, frameBuffer, messageBuffer }
const activeSerialPorts = new Map();// analyzerId -> SerialPort (Opción A: 24/7 background serial)

// ──────────────────────────────────────────────────────────────────────────────
// Native RS-232 / COM Port Listener (Opción A: 24/7 en segundo plano sin Chrome)
// ──────────────────────────────────────────────────────────────────────────────
async function createSerialListener(analyzerConfig) {
  const { id, name, comPort, baudRate = 9600, protocol = 'ASTM_E1381' } = analyzerConfig;
  if (!comPort) return;

  try {
    const { SerialPort } = await import('serialport');
    
    // Check available physical ports in Windows
    const available = await SerialPort.list().catch(() => []);
    const portUpper = comPort.toUpperCase();
    const portFound = available.some(p => p.path?.toUpperCase() === portUpper);

    if (!portFound) {
      log(name, `[SERIAL 24/7] Puerto ${comPort} no detectado físicamente en Windows (Standby). Reintentando en 15s...`);
      setTimeout(() => createSerialListener(analyzerConfig), 15000);
      return;
    }

    log(name, `[SERIAL 24/7] Abriendo puerto ${comPort} a ${baudRate} 8-N-1 (Servicio en segundo plano)...`);

    const serialPort = new SerialPort({
      path: comPort,
      baudRate: parseInt(baudRate, 10) || 9600,
      dataBits: 8,
      stopBits: 1,
      parity: 'none',
      autoOpen: false
    });

    serialPort.remoteAddr = `SERIAL:${comPort}@${baudRate}`;

    if (protocol === 'ASTM_E1381' && !astmBuffers.has(id)) {
      astmBuffers.set(id, {
        state: 'IDLE',
        frameBuffer: Buffer.alloc(0),
        messageText: '',
        currentRecordText: '',
        frameCount: 0,
        lastActivity: Date.now(),
        isTransmittingToAnalyzer: false,
        onTransmissionData: null
      });
    }

    serialPort.open((err) => {
      if (err) {
        log(name, `[SERIAL 24/7] ⚠ No se pudo abrir ${comPort}: ${err.message}. Reintentando en 15s...`);
        setTimeout(() => createSerialListener(analyzerConfig), 15000);
        return;
      }

      log(name, `[SERIAL 24/7] ✓ ${name} CONECTADO físicamente en ${comPort} (Escuchando 24/7 sin navegador)`);
      activeSerialPorts.set(id, serialPort);
      analyzerSockets.set(id, serialPort);

      broadcast({
        type: 'analyzer_connected',
        data: { analyzerId: id, analyzerName: name, remoteAddr: `SERIAL:${comPort}` },
        timestamp: new Date().toISOString()
      });
    });

    serialPort.on('data', (data) => {
      const hexPreview = generateHexDump(data, 32);
      log(name, `<-- [SERIAL ${comPort}] ${data.length} bytes: ${hexPreview}`);

      if (protocol === 'ASTM_E1381') {
        handleAstmData(analyzerConfig, serialPort, data);
      } else if (protocol === 'HL7_V2') {
        handleHl7Data(analyzerConfig, serialPort, data);
      }
    });

    serialPort.on('error', (err) => {
      log(name, `[SERIAL 24/7] Error en puerto ${comPort}: ${err.message}`);
    });

    serialPort.on('close', () => {
      log(name, `[SERIAL 24/7] Puerto ${comPort} desconectado. Reintentando en 10s...`);
      activeSerialPorts.delete(id);
      analyzerSockets.delete(id);
      setTimeout(() => createSerialListener(analyzerConfig), 10000);
    });

  } catch (err) {
    log(name, `[SERIAL 24/7] Módulo serialport: ${err.message}`);
  }
}

function createTcpListener(analyzerConfig) {
  const { id, name, port, protocol, ackDelayMs } = analyzerConfig;

  const server = net.createServer((socket) => {
    const remoteAddr = `${socket.remoteAddress}:${socket.remotePort}`;
    log(name, `Analizador conectado desde ${remoteAddr}`);
    analyzerSockets.set(id, socket);

    // Socket low-level performance & heartbeat optimizations
    socket.setKeepAlive(true, 10000); // 10s TCP keep-alive to catch dead/disconnected cables
    socket.setNoDelay(true);          // Disable Nagle algorithm for immediate frame transmission

    // Initialize ASTM state machine with multi-frame ETB & bidirectional transmission support
    if (protocol === 'ASTM_E1381') {
      astmBuffers.set(id, {
        state: 'IDLE',        // IDLE -> WAIT_STX -> ACCUMULATE -> WAIT_EOT
        frameBuffer: Buffer.alloc(0),
        messageText: '',
        currentRecordText: '', // for ETB continuation frames
        frameCount: 0,
        lastActivity: Date.now(),
        isTransmittingToAnalyzer: false,
        onTransmissionData: null
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

  // If host is currently sending Host Query response, route incoming bytes (ACK/NAK) to transmission handler
  if (state.isTransmittingToAnalyzer && typeof state.onTransmissionData === 'function') {
    state.onTransmissionData(data);
    return;
  }

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
          state.currentRecordText = '';
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
            processAstmData(analyzerConfig, socket, Buffer.from(state.messageText, 'utf8'));
          }
          state.state = 'IDLE';
          state.messageText = '';
          state.currentRecordText = '';
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
          // Frame complete: <STX>...<ETX or ETB><C1><C2><CR><LF>
          const checkResult = validateChecksum(state.frameBuffer);
          const frameInfo = extractFrameText(state.frameBuffer);
          const frameText = typeof frameInfo === 'object' ? frameInfo.text : frameInfo;
          const isIntermediate = typeof frameInfo === 'object' ? frameInfo.isIntermediate : false;
          const delimiter = typeof frameInfo === 'object' ? frameInfo.delimiter : (checkResult.delimiter || 'ETX');
          const hexDump = generateHexDump(state.frameBuffer);
          state.frameCount++;

          log(name, `Frame #${state.frameCount} (${delimiter}): checksum=${checkResult.valid ? 'OK' : 'FAIL'} "${frameText.substring(0, 60)}..."`);

          broadcast({
            type: 'frame_received',
            data: {
              analyzerId: id,
              analyzerName: name,
              frameType: isIntermediate ? 'STX_RECORD_ETB' : 'STX_RECORD_ETX',
              direction: 'INBOUND',
              rawPayload: frameText,
              rawHex: hexDump,
              checksumValid: checkResult.valid,
              checksumExpected: checkResult.expected,
              checksumComputed: checkResult.computed,
              frameNumber: state.frameCount,
              isIntermediate,
              delimiter,
              protocol: 'ASTM E1381'
            },
            timestamp: new Date().toISOString()
          });

          persistRawFrame({
            id: `frm-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            tenantId: TENANT_ID,
            analyzerId: id,
            analyzerName: name,
            protocol: 'ASTM_E1381',
            direction: 'INBOUND',
            rawPayload: frameText,
            timestamp: new Date().toISOString()
          });

          if (checkResult.valid) {
            if (isIntermediate) {
              // ETB: intermediate frame in multi-frame message — concatenate without extra newline
              state.currentRecordText = (state.currentRecordText || '') + frameText;
            } else {
              // ETX: final frame of logical record — commit line
              state.messageText += (state.currentRecordText || '') + frameText + '\n';
              state.currentRecordText = '';
            }

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

/**
 * ASTM Host Query Response (Bidirectional Workflow)
 * Sends patient and order tests to the analyzer in response to a Q record.
 */
async function sendAstmHostQueryResponse(analyzerConfig, socket, order, barcode) {
  const { id, name } = analyzerConfig;
  const state = astmBuffers.get(id);
  if (!state || !socket || socket.destroyed) return;

  log(name, `Iniciando sesión Host Query para descargar orden de muestra ${barcode}...`);
  state.isTransmittingToAnalyzer = true;

  let lines;
  if (order) {
    const tests = order.tests || order.order_items || ['ALL'];
    lines = buildAstmOrderLines({
      senderId: 'AbregoTech LIS',
      patient: order.patient || { name: order.patient_name || 'Paciente' },
      order: { barcode, priority: order.priority || 'R', order_number: order.order_number },
      tests,
      driverProfile: analyzerConfig.driverProfile || analyzerConfig
    });
    log(name, `Orden ${order.order_number} preparada con ${lines.length} líneas ASTM (estrategia: ${analyzerConfig.orderStrategy || 'SINGLE_O_REPEAT'})`);
  } else {
    // CLSI standard: if specimen not found, respond with termination or Q cancellation
    const now = new Date();
    const timestamp = now.toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
    lines = [
      `H|\\^&|||AbregoTech LIS|||||||P|1|${timestamp}`,
      `Q|1|^${barcode}||ALL||||||||X`,
      `L|1|N`
    ];
    log(name, `Muestra ${barcode} no encontrada — enviando trama ASTM de no-solicitud (Q|...|X)`);
  }

  return new Promise((resolve) => {
    let frameIdx = 0;
    let timer = null;

    const cleanup = (success) => {
      if (timer) clearTimeout(timer);
      state.isTransmittingToAnalyzer = false;
      state.onTransmissionData = null;
      state.state = 'IDLE';
      resolve(success);
    };

    const sendNextFrame = () => {
      if (frameIdx >= lines.length) {
        log(name, `--> <EOT> enviado (Descarga de orden completada)`);
        try { socket.write(Buffer.from([EOT])); } catch (_) {}
        broadcast({
          type: 'host_query_processed',
          data: {
            analyzerId: id,
            analyzerName: name,
            barcode,
            orderMatched: order ? order.order_number : null,
            status: order ? 'ORDEN_ENVIADA' : 'ORDEN_NO_EXISTE',
            linesCount: lines.length
          },
          timestamp: new Date().toISOString()
        });
        cleanup(true);
        return;
      }

      const fn = (frameIdx + 1) % 8;
      const line = lines[frameIdx];
      frameIdx++;

      const frameBuf = formatAstmFrame(fn, line, true);
      log(name, `--> Enviando Frame #${fn}: "${line.substring(0, 50)}..."`);
      try { socket.write(frameBuf); } catch (err) {
        log(name, `Error enviando frame a socket: ${err.message}`);
        cleanup(false);
        return;
      }

      broadcast({
        type: 'frame_received',
        data: {
          analyzerId: id,
          analyzerName: name,
          frameType: 'HOST_QUERY_OUT',
          direction: 'OUTBOUND',
          rawPayload: line,
          frameNumber: fn,
          protocol: 'ASTM E1381'
        },
        timestamp: new Date().toISOString()
      });

      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        log(name, `⚠ Timeout esperando ACK para frame #${fn} — cerrando sesión`);
        try { socket.write(Buffer.from([EOT])); } catch (_) {}
        cleanup(false);
      }, 5000);
    };

    state.onTransmissionData = (chunk) => {
      for (let i = 0; i < chunk.length; i++) {
        const byte = chunk[i];
        if (byte === ACK) {
          log(name, `<-- <ACK> recibido del analizador`);
          if (timer) clearTimeout(timer);
          setTimeout(sendNextFrame, 20);
          return;
        } else if (byte === NAK) {
          log(name, `✗ <NAK> recibido del analizador — abortando transmisión`);
          try { socket.write(Buffer.from([EOT])); } catch (_) {}
          cleanup(false);
          return;
        }
      }
    };

    // Step 1: Send ENQ to acquire line
    log(name, `--> <ENQ> enviado para iniciar sesión de descarga`);
    try { socket.write(Buffer.from([ENQ])); } catch (_) {}

    timer = setTimeout(() => {
      log(name, `⚠ Timeout esperando ACK a <ENQ>`);
      cleanup(false);
    }, 5000);
  });
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
    processHl7Data(analyzerConfig, socket, data);
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

  const parsed = parseHl7Message(messageText);

  // Check if it's an HL7 Query (QBP^Q11 or QRY^Q02)
  if (parsed.messageCode === 'QBP' || parsed.messageCode === 'QRY' || parsed.qpd || parsed.qrd) {
    const queryBarcode = parsed.qpd?.sampleBarcode || parsed.qrd?.sampleBarcode || '';
    log(name, `⚠️ HL7 Host Query detectado para código de barras: "${queryBarcode}"`);
    (async () => {
      let matchedOrder = null;
      if (queryBarcode) {
        matchedOrder = await queryOrderByBarcode(queryBarcode);
      }
      const tests = matchedOrder?.tests || matchedOrder?.order_items || ['ALL'];
      const responsePacket = generateMllpOrderResponse(parsed, matchedOrder?.patient, matchedOrder, tests);
      try {
        socket.write(responsePacket);
        log(name, `--> Respuesta HL7 enviada (RSP^K11) para muestra ${queryBarcode}`);
        broadcast({
          type: 'host_query_processed',
          data: {
            analyzerId: id,
            analyzerName: name,
            barcode: queryBarcode,
            orderMatched: matchedOrder ? matchedOrder.order_number : null,
            status: matchedOrder ? 'ORDEN_ENVIADA_HL7' : 'ORDEN_NO_EXISTE_HL7'
          },
          timestamp: new Date().toISOString()
        });
      } catch (err) {
        log(name, `Error enviando respuesta HL7: ${err.message}`);
      }
    })();
    return;
  }

  // Parse and process clinical results
  processHl7Data(analyzerConfig, socket, Buffer.from(messageText, 'utf8'));

  // Send MLLP ACK
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

async function processAstmData(analyzerConfig, socket, dataBuffer) {
  const { id, name } = analyzerConfig;
  const messageText = dataBuffer.toString('utf8');
  
  try {
    const parsed = parseAstmMessage(messageText);
    const barcode = parsed.order?.specimenId || parsed.queries?.[0]?.sampleBarcode || '';
    const patientName = parsed.patient?.patientName || 'Desconocido';

    log(name, `Mensaje ASTM parseado: barcode=${barcode}, paciente=${patientName}, ${parsed.results.length} resultado(s), ${parsed.queries?.length || 0} query(s)`);

    // 1. Process Host Queries (if analyzer requested orders for a tube)
    if (parsed.queries && parsed.queries.length > 0 && socket) {
      for (const query of parsed.queries) {
        const queryBarcode = query.sampleBarcode;
        log(name, `⚠️ Procesando Host Query para tubo: ${queryBarcode}`);
        let matchedOrder = null;
        if (queryBarcode) {
          matchedOrder = await queryOrderByBarcode(queryBarcode);
        }
        await sendAstmHostQueryResponse(analyzerConfig, socket, matchedOrder, queryBarcode);
      }
    }

    // 2. Query PostgREST for matching order if results are present (unless it's a Quality Control run)
    const isQcSample = /^(QC|CTRL|CONTROL|CAL|STD|NIVEL|PATRON|LEVEL)/i.test(barcode) || parsed.order?.actionCode === 'Q';
    let matchedOrder = null;
    if (barcode && parsed.results.length > 0 && !isQcSample) {
      matchedOrder = await queryOrderByBarcode(barcode);
    }

    // 3. Process each clinical result with homologation & critical checks
    for (const result of parsed.results) {
      const homologated = homologateTest(result.testCode, result.unit, result.referenceRange);
      const evaluatedFlag = evaluateClinicalFlag(
        result.numericValue,
        homologated.refMin,
        homologated.refMax,
        result.flag
      );

      const resultRecord = {
        id: `res-bridge-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        tenantId: TENANT_ID,
        orderId: matchedOrder?.id || '',
        testId: '',
        parameterId: '',
        parameterName: homologated.parameterName,
        unit: homologated.unit,
        value: result.value,
        numericValue: result.numericValue,
        flag: evaluatedFlag,
        refRangeText: homologated.refRange,
        source: 'MIDDLEWARE_ASTM',
        analyzerName: name,
        status: isQcSample ? 'CONTROL_CALIDAD' : (evaluatedFlag.startsWith('CRITICO') ? 'PANICO_DETECTADO' : 'PENDIENTE'),
        specimenType: isQcSample ? 'CONTROL_CALIDAD' : (result.specimenType || 'SUERO'),
        version: 1
      };

      // Persist to database
      await persistResult(resultRecord, barcode, patientName);

      // Emit critical panic value alert to frontend if abnormal
      if (evaluatedFlag === 'CRITICO_ALTO' || evaluatedFlag === 'CRITICO_BAJO') {
        broadcast({
          type: 'clinical_alert',
          data: {
            severity: 'CRITICAL',
            title: `VALOR DE PÁNICO DETECTADO (${name})`,
            analyte: homologated.parameterName,
            value: result.value,
            unit: homologated.unit,
            flag: evaluatedFlag,
            barcode,
            patientName,
            orderNumber: matchedOrder?.order_number || null,
            timestamp: new Date().toISOString()
          },
          timestamp: new Date().toISOString()
        });
      }

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

    persistRawFrame({
      id: `frm-hl7-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      tenantId: TENANT_ID,
      analyzerId: id,
      analyzerName: name,
      protocol: 'HL7_V2',
      direction: 'INBOUND',
      rawPayload: messageText,
      timestamp: new Date().toISOString()
    });

    const isQcSample = /^(QC|CTRL|CONTROL|CAL|STD|NIVEL|PATRON|LEVEL)/i.test(barcode);
    let matchedOrder = null;
    if (barcode && !isQcSample) {
      matchedOrder = await queryOrderByBarcode(barcode);
    }

    for (const obx of parsed.obx) {
      const homologated = homologateTest(obx.testCode || obx.testName, obx.unit, obx.referenceRange);
      const evaluatedFlag = evaluateClinicalFlag(
        obx.numericValue,
        homologated.refMin,
        homologated.refMax,
        obx.flag
      );

      const resultRecord = {
        id: `res-bridge-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        tenantId: TENANT_ID,
        orderId: matchedOrder?.id || '',
        testId: '',
        parameterId: '',
        parameterName: homologated.parameterName,
        unit: homologated.unit,
        value: obx.value,
        numericValue: obx.numericValue,
        flag: evaluatedFlag,
        refRangeText: homologated.refRange,
        source: 'MIDDLEWARE_HL7',
        analyzerName: name,
        status: isQcSample ? 'CONTROL_CALIDAD' : (evaluatedFlag.startsWith('CRITICO') ? 'PANICO_DETECTADO' : 'PENDIENTE'),
        specimenType: isQcSample ? 'CONTROL_CALIDAD' : 'SUERO',
        version: 1
      };

      await persistResult(resultRecord, barcode, patientName);

      // Emit critical panic value alert to frontend if abnormal
      if (evaluatedFlag === 'CRITICO_ALTO' || evaluatedFlag === 'CRITICO_BAJO') {
        broadcast({
          type: 'clinical_alert',
          data: {
            severity: 'CRITICAL',
            title: `VALOR DE PÁNICO DETECTADO (${name})`,
            analyte: homologated.parameterName,
            value: obx.value,
            unit: homologated.unit,
            flag: evaluatedFlag,
            barcode,
            patientName,
            orderNumber: matchedOrder?.order_number || null,
            timestamp: new Date().toISOString()
          },
          timestamp: new Date().toISOString()
        });
      }

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
 * Persist raw frame to local disk spool and database via PostgREST.
 */
async function persistRawFrame(frameRecord) {
  // 1. Inmediato en Disco Local (On-Premise Spool - Cero Pérdida ante cortes de internet)
  const dateStr = new Date().toISOString().slice(0, 10);
  appendToLocalSpool(`raw_frames_${dateStr}.jsonl`, {
    ...frameRecord,
    savedLocallyAt: new Date().toISOString()
  });

  // 2. Persistir a PostgREST Local
  try {
    const response = await fetch(`${POSTGREST_URL}/middleware_raw_frames`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        id: frameRecord.id,
        tenant_id: frameRecord.tenantId,
        analyzer_id: frameRecord.analyzerId,
        protocol: frameRecord.protocol,
        direction: frameRecord.direction,
        raw_payload: frameRecord.rawPayload,
        processed: true,
        created_at: frameRecord.timestamp
      })
    });

    if (response.ok || response.status === 201) {
      log('DB', `✓ Trama cruda guardada en PostgreSQL Local (${frameRecord.analyzerName})`);
    } else {
      appendToLocalSpool('pending_sync_frames.jsonl', frameRecord);
    }
  } catch (err) {
    log('DB', `PostgreSQL Local no disponible (${err.message}) — Trama en spool local.`);
    appendToLocalSpool('pending_sync_frames.jsonl', frameRecord);
  }

  // 3. Replicar a Supabase Cloud (si está configurado)
  if (CLOUD_URL && CLOUD_KEY && !CLOUD_URL.includes('localhost') && CLOUD_URL !== POSTGREST_URL) {
    try {
      const cloudRes = await fetch(`${CLOUD_URL}/rest/v1/middleware_raw_frames`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': CLOUD_KEY,
          'Authorization': `Bearer ${CLOUD_KEY}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          id: frameRecord.id,
          tenant_id: frameRecord.tenantId,
          analyzer_id: frameRecord.analyzerId,
          protocol: frameRecord.protocol,
          direction: frameRecord.direction,
          raw_payload: frameRecord.rawPayload,
          processed: true,
          created_at: frameRecord.timestamp
        })
      });
      if (cloudRes.ok || cloudRes.status === 201) {
        log('CLOUD', `☁ Trama replicada en Supabase Cloud`);
      }
    } catch (err) {
      log('CLOUD', `Supabase Cloud offline o sin internet (${err.message}) — queda en cola.`);
    }
  }
}

/**
 * Persist a result to local disk spool and database via PostgREST and Supabase Cloud.
 */
async function persistResult(result, barcode, patientName) {
  const dateStr = new Date().toISOString().slice(0, 10);
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

  // 1. Respaldo local inmediato en disco (On-Premise Spool)
  appendToLocalSpool(`results_${dateStr}.jsonl`, {
    ...payload,
    savedLocallyAt: new Date().toISOString()
  });

  // 2. Persistir a PostgREST Local
  try {
    const response = await fetch(`${POSTGREST_URL}/results`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(payload)
    });

    if (response.ok || response.status === 201) {
      log('DB', `✓ Resultado guardado en PostgreSQL Local: ${result.parameterName}=${result.value} ${result.unit}`);
    } else {
      const errText = await response.text();
      log('DB', `⚠ Error en DB local (${response.status}): ${errText}`);
      appendToLocalSpool('pending_sync_results.jsonl', payload);
    }
  } catch (err) {
    log('DB', `Error conexión con DB local: ${err.message} — guardado en spool de disco.`);
    appendToLocalSpool('pending_sync_results.jsonl', payload);
  }

  // 3. Replicar a Supabase Cloud (Espejo 1:1)
  if (CLOUD_URL && CLOUD_KEY && !CLOUD_URL.includes('localhost') && CLOUD_URL !== POSTGREST_URL) {
    try {
      const cloudRes = await fetch(`${CLOUD_URL}/rest/v1/results`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': CLOUD_KEY,
          'Authorization': `Bearer ${CLOUD_KEY}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(payload)
      });
      if (cloudRes.ok || cloudRes.status === 201) {
        log('CLOUD', `☁ Resultado sincronizado a Supabase Cloud: ${result.parameterName} (${barcode})`);
      }
    } catch (err) {
      log('CLOUD', `Supabase Cloud inaccesible (${err.message}) — guardado en cola para auto-sincronización.`);
    }
  }
}

/**
 * Auto-drain and retry synchronizing pending offline frames and results to Supabase
 */
async function flushOfflineSpool() {
  const pendingFramesPath = path.join(SPOOL_DIR, 'pending_sync_frames.jsonl');
  if (fs.existsSync(pendingFramesPath)) {
    try {
      const content = fs.readFileSync(pendingFramesPath, 'utf8');
      const lines = content.trim().split('\n').filter(Boolean);
      if (lines.length > 0) {
        log('SYNC', `Reintentando sincronizar ${lines.length} tramas pendientes con Supabase...`);
        const remaining = [];
        for (const line of lines) {
          try {
            const frame = JSON.parse(line);
            const res = await fetch(`${POSTGREST_URL}/middleware_raw_frames`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
              body: JSON.stringify({
                id: frame.id,
                tenant_id: frame.tenantId,
                analyzer_id: frame.analyzerId,
                protocol: frame.protocol,
                direction: frame.direction,
                raw_payload: frame.rawPayload,
                processed: true,
                created_at: frame.timestamp
              })
            });
            if (!res.ok && res.status !== 201) remaining.push(line);
          } catch {
            remaining.push(line);
            break; // Stop on first network error to avoid hammering
          }
        }
        if (remaining.length > 0) {
          fs.writeFileSync(pendingFramesPath, remaining.join('\n') + '\n', 'utf8');
        } else {
          fs.unlinkSync(pendingFramesPath);
          log('SYNC', '✓ Todas las tramas del spool offline sincronizadas exitosamente.');
        }
      }
    } catch (err) {
      log('SYNC', `Error procesando spool offline de tramas: ${err.message}`);
    }
  }

  const pendingResultsPath = path.join(SPOOL_DIR, 'pending_sync_results.jsonl');
  if (fs.existsSync(pendingResultsPath)) {
    try {
      const content = fs.readFileSync(pendingResultsPath, 'utf8');
      const lines = content.trim().split('\n').filter(Boolean);
      if (lines.length > 0) {
        log('SYNC', `Reintentando sincronizar ${lines.length} resultados pendientes con Supabase...`);
        const remaining = [];
        for (const line of lines) {
          try {
            const payload = JSON.parse(line);
            const res = await fetch(`${POSTGREST_URL}/results`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
              body: JSON.stringify(payload)
            });
            if (!res.ok && res.status !== 201) remaining.push(line);
          } catch {
            remaining.push(line);
            break;
          }
        }
        if (remaining.length > 0) {
          fs.writeFileSync(pendingResultsPath, remaining.join('\n') + '\n', 'utf8');
        } else {
          fs.unlinkSync(pendingResultsPath);
          log('SYNC', '✓ Todos los resultados del spool offline sincronizados exitosamente.');
        }
      }
    } catch (err) {
      log('SYNC', `Error procesando spool offline de resultados: ${err.message}`);
    }
  }
}

// Start auto-drain worker every 30 seconds
setInterval(flushOfflineSpool, 30000);

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

  // Create TCP listeners for each analyzer (Soporta Red TCP directa y Moxa NPort / Lantronix)
  for (const analyzer of ANALYZER_PORTS) {
    createTcpListener(analyzer);
    // Opción A: Soporta cable serial RS-232 directo en segundo plano 24/7 sin Chrome
    if (analyzer.comPort) {
      createSerialListener(analyzer);
    }
  }

  console.log('');
  log('BRIDGE', '═══ Middleware Bridge listo (TCP + Serial 24/7 activo). Esperando conexiones... ═══');
  console.log('');
}

// Graceful shutdown
process.on('SIGINT', () => {
  log('BRIDGE', 'Cerrando bridge...');
  
  for (const [id, server] of tcpServers) {
    server.close();
  }
  for (const [id, port] of activeSerialPorts) {
    try { port.close(); } catch (_) {}
  }
  for (const [id, socket] of analyzerSockets) {
    try { socket.destroy?.(); } catch (_) {}
  }
  wsServer.close();
  
  log('BRIDGE', 'Bridge cerrado correctamente.');
  process.exit(0);
});

process.on('SIGTERM', () => process.emit('SIGINT'));

// Start
startBridge();
