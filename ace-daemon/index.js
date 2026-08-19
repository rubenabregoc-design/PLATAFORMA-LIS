require('dotenv').config();
const net = require('net');
const { SerialPort } = require('serialport');
const axios = require('axios');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

// ============================================================================
// AbregoTech ACE Daemon + Local GUI Dashboard (Bidirectional)
// ============================================================================

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

// URL del Webhook y API LIS Core (Apuntando a nuestro simulador en la nube)
const LIS_API_URL = process.env.LIS_API_URL || 'http://localhost:4000/v1/analyzer';
const GUI_PORT = process.env.GUI_PORT || 5050;

const ASTM = { ENQ: '\x05', ACK: '\x06', NAK: '\x15', STX: '\x02', ETX: '\x03', EOT: '\x04', CR: '\x0D', LF: '\x0A' };

function logEvent(type, analyzer, message, isData = false) {
    const timestamp = new Date().toLocaleTimeString();
    const log = `[${timestamp}] [${analyzer}] ${message}`;
    console.log(log);
    io.emit('terminal_log', { type, analyzer, message, timestamp, isData });
}

// --- SIMULADOR DE PROTOCOLO ASTM BIDIRECCIONAL ------------------------------
async function handleAstmStream(socketOrPort, dataBuffer, name) {
    const rawStr = dataBuffer.toString();
    
    // 1. Handshake inicial
    if (rawStr.includes(ASTM.ENQ)) {
        logEvent('INBOUND', name, '<ENQ> (Solicitud de transmisión)');
        socketOrPort.write(ASTM.ACK);
        logEvent('OUTBOUND', name, '<ACK> (Host listo)');
    }
    
    // 2. Recepción de Bloques (Puede ser R de Resultado o Q de Query)
    if (rawStr.includes(ASTM.STX)) {
        logEvent('INBOUND', name, 'Bloque de datos ASTM recibido', true);
        socketOrPort.write(ASTM.ACK);

        // EXTRA: Detectar Host Query (Consulta de tubo)
        // Ejemplo Trama: STX 1Q|1|^102455||ALL||||||||O CR ETX
        if (rawStr.includes('Q|')) {
            const match = rawStr.match(/Q\|\d+\|\^([a-zA-Z0-9_-]+)/);
            if (match && match[1]) {
                const barcode = match[1];
                logEvent('SYSTEM', name, `⚠️ Host Query detectado. Consultando órdenes para tubo: ${barcode}`);
                await handleHostQuery(socketOrPort, name, barcode);
            }
        }
    }

    // 3. Fin de transmisión de Resultados
    if (rawStr.includes(ASTM.EOT) || rawStr.includes('L|1|N')) {
        logEvent('INBOUND', name, '<EOT> (Fin de transmisión)');
        // Si no fue un Query, asumimos que fue envío de resultados
        if (!rawStr.includes('Q|')) {
            sendResultsToCloud(name, rawStr, 'ASTM_E1381');
        }
    }
}

// --- LÓGICA DE HOST QUERY (DESCARGA DE ÓRDENES) -----------------------------
async function handleHostQuery(socketOrPort, analyzerName, barcode) {
    try {
        logEvent('SYSTEM', 'ACE-GATEWAY', `Descargando orden ${barcode} desde la Nube LIS...`);
        
        // Petición al API Backend LIS
        const response = await axios.get(`${LIS_API_URL}/orders/${barcode}`);
        const orderData = response.data;
        
        logEvent('SUCCESS', 'ACE-GATEWAY', `Orden ${barcode} encontrada: ${orderData.patientName} (${orderData.tests.join(',')})`);

        // Construir trama ASTM de respuesta (Envío de Orden al Analizador)
        const astmOrder = 
            `H|\\^&|||LIS_CORE|||||||P|1${ASTM.CR}${ASTM.LF}` +
            `P|1|||${orderData.patientName}||${orderData.dob}|${orderData.gender}${ASTM.CR}${ASTM.LF}` +
            `O|1|${barcode}||^^^${orderData.tests.join('^')}|R||20260818103000${ASTM.CR}${ASTM.LF}` +
            `L|1|N${ASTM.CR}${ASTM.LF}`;

        logEvent('SYSTEM', analyzerName, 'Iniciando transmisión (ENQ) hacia el equipo...');
        socketOrPort.write(ASTM.ENQ);
        
        // Simulamos la respuesta rápida enviando la trama
        setTimeout(() => {
            logEvent('OUTBOUND', analyzerName, 'Trama de Ordenes enviada', true);
            socketOrPort.write(astmOrder + ASTM.EOT);
        }, 500);

    } catch (error) {
        logEvent('ERROR', 'ACE-GATEWAY', `Orden no encontrada o error API: ${error.message}`);
    }
}

// --- ENVÍO DE RESULTADOS A LA NUBE (WEBHOOK) --------------------------------
async function sendResultsToCloud(analyzerName, rawPayload, protocol) {
    logEvent('SYSTEM', 'ACE-GATEWAY', `Subiendo resultados de ${analyzerName} a la Nube...`);
    try {
        const response = await axios.post(`${LIS_API_URL}/webhook`, {
            analyzerName: analyzerName,
            protocol: protocol,
            rawPayload: rawPayload,
            timestamp: new Date().toISOString()
        });
        
        logEvent('SUCCESS', 'ACE-GATEWAY', `✅ HTTP 200 OK. LIS Core Procesó el Webhook.`);
        io.emit('tx_success', { analyzerName });
    } catch (error) {
        logEvent('ERROR', 'ACE-GATEWAY', `❌ Error conectando a LIS Core: ${error.message}`);
    }
}

// ============================================================================
// SERVIDORES DE PUERTOS FÍSICOS (SIMULADOS COMO TCP PARA EL EJEMPLO)
// ============================================================================
function startTcpServer(port, analyzerName) {
    const srv = net.createServer((socket) => {
        logEvent('SYSTEM', analyzerName, `🟢 Conectado (${socket.remoteAddress})`);
        io.emit('analyzer_status', { name: analyzerName, status: 'ONLINE', port });
        
        socket.on('data', (data) => handleAstmStream(socket, data, analyzerName));
        socket.on('close', () => {
            logEvent('ERROR', analyzerName, `🔴 Desconectado.`);
            io.emit('analyzer_status', { name: analyzerName, status: 'OFFLINE', port });
        });
        socket.on('error', (err) => logEvent('ERROR', analyzerName, err.message));
    });

    srv.listen(port, '0.0.0.0', () => {
        logEvent('SYSTEM', 'ACE-CORE', `TCP Puerto ${port} -> ${analyzerName}`);
        io.emit('analyzer_status', { name: analyzerName, status: 'LISTENING', port });
    });
}

server.listen(GUI_PORT, () => {
    console.log(`🚀 ACE Daemon GUI: http://localhost:${GUI_PORT}`);
    setTimeout(() => {
        startTcpServer(5100, 'Sysmex XN-1000');
        startTcpServer(6000, 'Roche Cobas c311');
    }, 1500);
});
