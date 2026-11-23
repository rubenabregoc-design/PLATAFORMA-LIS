/**
 * 🧪 Test Moxa / TCP Hardware Relay Client
 * AbregoTech LIS — Simula el tráfico de una cajita Moxa NPort o analizador TCP hacia el Middleware
 *
 * Uso:
 *   node server/test-moxa-relay.js 5109 sysmex
 *   node server/test-moxa-relay.js 5105 stago
 */

import net from 'net';

const port = parseInt(process.argv[2] || '5109', 10);
const target = process.argv[3] || 'sysmex';

console.log(`\n🔌 Iniciando simulación de transmisión Moxa NPort -> TCP localhost:${port} (${target})...\n`);

const client = new net.Socket();

client.connect(port, '127.0.0.1', () => {
  console.log(`✓ Conectado a socket TCP :${port} del Middleware LIS.`);
  
  // ASTM handshake: Send <ENQ>
  console.log('--> Enviando <ENQ> (0x05)...');
  client.write(Buffer.from([0x05]));
});

client.on('data', (data) => {
  if (data[0] === 0x06) {
    console.log('<-- <ACK> recibido del Middleware LIS.');
    
    // Prepare ASTM Frame
    const now = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
    const barcode = `BC-${Math.floor(100000 + Math.random() * 900000)}`;
    
    const lines = [
      `1H|\\^&|||${target.toUpperCase()}^LAB|||||||P|1|${now}`,
      `2P|1||||Muestra^Automatizada||19880512|M`,
      `3O|1|${barcode}||^^^HEMOGRAMA_COMPLETO|R||${now}`,
      `4R|1|^^^WBC|7.45|10^3/uL|4.5-11.0|N||F||||${now}`,
      `5R|2|^^^HGB|14.8|g/dL|13.0-17.0|N||F||||${now}`,
      `6R|3|^^^PLT|245|10^3/uL|150-450|N||F||||${now}`,
      `7L|1|N`
    ];
    
    console.log(`--> Transmitiendo ${lines.length} registros ASTM para tubo ${barcode}...`);
    
    let idx = 0;
    const sendNext = () => {
      if (idx >= lines.length) {
        console.log('--> Enviando <EOT> (0x04) Fin de transmisión.');
        client.write(Buffer.from([0x04]));
        setTimeout(() => {
          client.end();
          console.log('\n✓ Transmisión completada exitosamente.\n');
          process.exit(0);
        }, 500);
        return;
      }
      
      const line = lines[idx++];
      // Compute ASTM Checksum
      let sum = 0;
      for (let i = 0; i < line.length; i++) sum += line.charCodeAt(i);
      sum += 0x0D + 0x03; // CR + ETX
      const cs = (sum % 256).toString(16).toUpperCase().padStart(2, '0');
      
      const frame = Buffer.concat([
        Buffer.from([0x02]), // STX
        Buffer.from(line),
        Buffer.from([0x0D, 0x03]), // CR, ETX
        Buffer.from(cs, 'ascii'),
        Buffer.from([0x0D, 0x0A]) // CR, LF
      ]);
      
      client.write(frame);
    };
    
    sendNext();
  }
});

client.on('error', (err) => {
  console.error(`❌ Error en socket: ${err.message}`);
  process.exit(1);
});
