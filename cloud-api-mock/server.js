const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 4000;

// ============================================================================
// LIS Core - Backend Mock API (Controlador de Webhooks y Órdenes)
// ============================================================================

console.log("====================================================");
console.log(" ☁️  LIS Core Cloud API Simulador Iniciando...");
console.log("====================================================");

// --- 1. ENDPOINT: HOST QUERY (Petición de Órdenes) ---
app.get('/v1/analyzer/orders/:barcode', (req, res) => {
    const barcode = req.params.barcode;
    console.log(`\n[API LIS] 🔍 Solicitud Host Query recibida para tubo: ${barcode}`);

    // Simulación de Base de Datos
    const mockDb = {
        '102455': { patientName: 'Arosemena^Ricardo', dob: '19800512', gender: 'M', tests: ['GLU', 'CHOL', 'TRIG'] },
        '882004': { patientName: 'Pinzon^Gabriela', dob: '19920822', gender: 'F', tests: ['WBC', 'RBC', 'PLT'] }
    };

    const order = mockDb[barcode];
    if (order) {
        console.log(`[API LIS] ✅ Orden encontrada, devolviendo pruebas: ${order.tests.join(', ')}`);
        res.json(order);
    } else {
        console.log(`[API LIS] ⚠️ Orden no encontrada para código: ${barcode}`);
        // Simulamos un paciente por defecto para que la prueba visual funcione
        res.json({ patientName: 'Paciente^Desconocido', dob: '19000101', gender: 'U', tests: ['TEST1'] });
    }
});

// --- 2. ENDPOINT: WEBHOOK RECEIVER (Llegada de Resultados) ---
app.post('/v1/analyzer/webhook', (req, res) => {
    const { analyzerName, protocol, rawPayload, timestamp } = req.body;
    console.log(`\n[API LIS] 📥 Webhook Recibido desde ${analyzerName} vía ACE Daemon`);
    console.log(`[API LIS] ⚙️  Procesando trama de ${rawPayload.length} bytes...`);

    // 3. MÓDULO DE REGLAS DE NEGOCIO Y ALERTAS PÁNICO (SIMULACIÓN)
    // El motor real llamaría a AnalyzerCommEngine para traducir la trama a JSON.
    // Aquí simulamos que después del parseo, encontramos una bandera HH (Crítico Alto)
    if (rawPayload.includes('HH|') || rawPayload.includes('CRITICO') || rawPayload.includes('340|mg/dL')) {
        console.log(`[API LIS] 🚨 ¡VALOR DE PÁNICO DETECTADO POR EL MOTOR DE REGLAS!`);
        triggerPanicAlert('Glucosa 340 mg/dL', 'Arosemena Ricardo');
    }

    console.log(`[API LIS] 💾 Resultado insertado exitosamente en Base de Datos PostgreSQL/Firebase.`);
    res.status(200).json({ success: true, message: 'Webhook procesado y almacenado' });
});

// --- LÓGICA DE ALERTAS (SMS / WHATSAPP) ---
function triggerPanicAlert(finding, patient) {
    console.log(`[API LIS - NOTIFICACIÓN] 📲 Llamando API de Twilio/WhatsApp...`);
    setTimeout(() => {
        console.log(`====================================================`);
        console.log(`🔔 SMS ENVIADO AL DR. TRATANTE / JEFE DE LABORATORIO`);
        console.log(`Mensaje: "⚠️ Alerta LIS: Paciente ${patient} reporta valor de pánico: ${finding}. Favor verificar Bandeja de Resultados."`);
        console.log(`====================================================`);
    }, 1000);
}

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`\n[API LIS] 🎧 Escuchando Webhooks y Consultas en puerto ${PORT}`);
});
