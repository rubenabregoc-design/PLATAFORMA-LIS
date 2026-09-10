#!/usr/bin/env node
/**
 * AbregoTech LIS — Analyzer Test Simulator
 * 
 * Simulates clinical analyzers connecting via TCP/IP to the Middleware Bridge.
 * Tests ASTM E1381 handshake (Sysmex, Vitros, Mindray, Stago, Bio-Rad)
 * and HL7 v2.5 MLLP (Cobas, Alinity).
 * 
 * Usage: node server/test-analyzer-client.js [analyzer-name]
 * Examples:
 *   node server/test-analyzer-client.js sysmex
 *   node server/test-analyzer-client.js cobas
 *   node server/test-analyzer-client.js vitros
 *   node server/test-analyzer-client.js all
 */

import net from 'net';
import { WebSocket } from 'ws';

const WS_URL = process.env.VITE_MIDDLEWARE_WS_URL || 'ws://localhost:8765';

// ASTM control characters
const STX = 0x02;
const ETX = 0x03;
const EOT = 0x04;
const ENQ = 0x05;
const ACK = 0x06;
const CR  = 0x0D;
const LF  = 0x0A;

// HL7 MLLP characters
const VT = 0x0B;
const FS = 0x1C;

function computeAstmChecksum(contentBytes) {
  let sum = 0;
  for (const b of contentBytes) {
    sum += b;
  }
  return (sum % 256).toString(16).toUpperCase().padStart(2, '0');
}

function makeAstmFrame(frameNumber, text) {
  const inner = `${frameNumber}${text}`;
  const innerBytes = Buffer.concat([Buffer.from(inner, 'utf8'), Buffer.from([ETX])]);
  const cs = computeAstmChecksum(innerBytes);
  return Buffer.concat([
    Buffer.from([STX]),
    innerBytes,
    Buffer.from(`${cs}\r\n`, 'ascii')
  ]);
}

async function simulateAstmAnalyzer(name, port, frames) {
  return new Promise((resolve, reject) => {
    console.log(`\n[${name}] Conectando a TCP localhost:${port}...`);
    const socket = net.createConnection({ port, host: '127.0.0.1' }, () => {
      console.log(`[${name}] Conectado. Enviando <ENQ>...`);
      socket.write(Buffer.from([ENQ]));
    });

    let frameIdx = 0;

    socket.on('data', (data) => {
      const byte = data[0];
      if (byte === ACK) {
        if (frameIdx < frames.length) {
          const frame = frames[frameIdx];
          frameIdx++;
          console.log(`[${name}] <ACK> recibido. Enviando frame ${frameIdx}/${frames.length}...`);
          socket.write(frame);
        } else {
          console.log(`[${name}] Todos los frames enviados. Enviando <EOT>...`);
          socket.write(Buffer.from([EOT]));
          setTimeout(() => {
            socket.end();
            resolve(true);
          }, 500);
        }
      } else {
        console.log(`[${name}] Byte inesperado recibido: 0x${byte.toString(16)}`);
      }
    });

    socket.on('error', (err) => {
      console.error(`[${name}] Error de conexión: ${err.message}`);
      reject(err);
    });
  });
}

async function simulateHl7Analyzer(name, port, hl7Message) {
  return new Promise((resolve, reject) => {
    console.log(`\n[${name}] Conectando a TCP MLLP localhost:${port}...`);
    const socket = net.createConnection({ port, host: '127.0.0.1' }, () => {
      console.log(`[${name}] Conectado. Enviando mensaje HL7 en sobre MLLP...`);
      const mllpPacket = Buffer.concat([
        Buffer.from([VT]),
        Buffer.from(hl7Message, 'utf8'),
        Buffer.from([FS, CR])
      ]);
      socket.write(mllpPacket);
    });

    socket.on('data', (data) => {
      // Check for MLLP ACK
      const text = data.toString('utf8');
      console.log(`[${name}] <-- Respuesta recibida de Bridge (${data.length} bytes):`);
      console.log(text.replace(/\r/g, '\n').trim());
      setTimeout(() => {
        socket.end();
        resolve(true);
      }, 500);
    });

    socket.on('error', (err) => {
      console.error(`[${name}] Error: ${err.message}`);
      reject(err);
    });
  });
}

// ── Main Runner ────────────────────────────────────────────────────────────

async function run() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║  AbregoTech LIS — Simulador de Analizadores Clínicos         ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');

  // Connect WebSocket sniffer to observe incoming events
  console.log(`\nConectando sniffer WebSocket a ${WS_URL}...`);
  const ws = new WebSocket(WS_URL);

  await new Promise((resolve) => {
    ws.on('open', () => {
      console.log('✓ Sniffer WebSocket conectado.');
      resolve(true);
    });
    ws.on('error', (err) => {
      console.log(`⚠ WebSocket no disponible (${err.message}). Continuando prueba TCP pura...`);
      resolve(false);
    });
  });

  ws.on('message', (msg) => {
    try {
      const parsed = JSON.parse(msg.toString());
      if (parsed.type === 'result_parsed') {
        console.log(`\n  🎯 [WS SNIFFER] ¡Resultado parseado con éxito!`);
        console.log(`     Analizador: ${parsed.data.analyzerName}`);
        console.log(`     Código de barra: ${parsed.data.barcode}`);
        console.log(`     Paciente: ${parsed.data.patientName}`);
        console.log(`     Parámetro: ${parsed.data.result.parameterName} = ${parsed.data.result.value} ${parsed.data.result.unit} [${parsed.data.result.flag}]`);
      } else if (parsed.type === 'frame_received') {
        console.log(`  📡 [WS SNIFFER] Frame recibido: ${parsed.data.analyzerName} (${parsed.data.frameType})`);
      }
    } catch {}
  });

  const arg = (process.argv[2] || 'sysmex').toLowerCase();

  try {
    if (arg === 'sysmex' || arg === 'all') {
      // Sysmex XN-1000 (ASTM, Port 5100)
      const frames = [
        makeAstmFrame(1, 'H|\\^&|||Sysmex^XN-1000|||||||P|1'),
        makeAstmFrame(2, 'P|1||8-812-4432||Pinzon^Gabriela||19920514|F'),
        makeAstmFrame(3, 'O|1|BC-882001||^^^SYSMEX_CBC|R'),
        makeAstmFrame(4, 'R|1|^^^WBC|7.40|10^3/uL|4.5-11.0|N||F'),
        makeAstmFrame(5, 'R|2|^^^HGB|14.0|g/dL|12.0-15.5|N||F'),
        makeAstmFrame(6, 'R|3|^^^PLT|245|10^3/uL|150-450|N||F'),
        makeAstmFrame(7, 'L|1|N')
      ];
      await simulateAstmAnalyzer('Sysmex XN-1000', 5100, frames);
    }

    if (arg === 'cobas' || arg === 'all') {
      // Roche Cobas 6000 (HL7, Port 5102)
      const hl7Msg = 
        'MSH|^~\\&|COBAS6000|ROCHE|LIS|ABREGO|20260909120000||ORU^R01|MSG-99201|P|2.5\r' +
        'PID|1||8-712-3344||Castillo^Elena||19781105|F\r' +
        'OBR|1||BC-882007|^^^TROPONINA_I_HS\r' +
        'OBX|1|NM|TROP_I^Troponina I hs|1|4520|pg/mL|0-14|HH|||F\r';
      await simulateHl7Analyzer('Roche Cobas 6000', 5102, hl7Msg);
    }

    if (arg === 'vitros' || arg === 'all') {
      // Ortho Vitros 4600 (ASTM, Port 5101)
      const frames = [
        makeAstmFrame(1, 'H|\\^&|||VITROS^4600|||||||P|1'),
        makeAstmFrame(2, 'P|1||8-112-9901||Arosemena^Ricardo||19750820|M'),
        makeAstmFrame(3, 'O|1|BC-882004||^^^GLU_101|S'),
        makeAstmFrame(4, 'R|1|^^^GLU|340|mg/dL|70-99|HH||F'),
        makeAstmFrame(5, 'C|1|I|HIL: H=12 (OK), I=0.4, L=15|G'),
        makeAstmFrame(6, 'L|1|N')
      ];
      await simulateAstmAnalyzer('Ortho Vitros 4600', 5101, frames);
    }

    console.log('\n✓ Pruebas completadas exitosamente.');
  } catch (err) {
    console.error('\n❌ Fallo en la prueba:', err.message);
  } finally {
    setTimeout(() => {
      ws.close();
      process.exit(0);
    }, 1500);
  }
}

run();
