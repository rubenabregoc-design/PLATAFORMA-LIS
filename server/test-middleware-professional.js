import assert from 'assert';
import {
  STX, ETX, EOT, ENQ, ACK, NAK, ETB, CR, LF,
  computeAstmChecksum,
  validateChecksum,
  extractFrameText,
  formatAstmFrame,
  buildAstmOrderLines,
  parseAstmMessage,
  parseQueryRecord
} from './parsers/astm-parser.js';
import {
  VT, FS,
  extractFromMllp,
  wrapInMllp,
  parseHl7Message,
  generateAck,
  generateMllpAck,
  generateHl7OrderResponse,
  generateMllpOrderResponse
} from './parsers/hl7-parser.js';

console.log('🧪 Iniciando verificación de especificación ASTM E1381/E1394 y HL7 v2.5...\n');

// 1. ASTM Frame Checksum & Format Validation
const payload1 = '1H|\\^&|||Sysmex^XN-1000|||||||P|1';
const innerBuf = Buffer.concat([Buffer.from(payload1, 'utf8'), Buffer.from([ETX])]);
const expectedCs = computeAstmChecksum(innerBuf);
const frameBuf = Buffer.concat([
  Buffer.from([STX]),
  innerBuf,
  Buffer.from(`${expectedCs}\r\n`, 'ascii')
]);

const check1 = validateChecksum(frameBuf);
assert.strictEqual(check1.valid, true, 'Checksum ETX debe ser válido');
assert.strictEqual(check1.delimiter, 'ETX', 'Debe reconocer delimitador ETX');
console.log('✓ 1. ASTM ETX Checksum validado correctamente.');

// 2. ASTM Multi-Frame (ETB) Checksum Validation
const multiFramePayload = '2R|1|^^^WBC|7.40|10^3/uL|4.5-11.0|N||F|ALARM_MORE_DATA_CONTINUES...';
const etbInnerBuf = Buffer.concat([Buffer.from(multiFramePayload, 'utf8'), Buffer.from([ETB])]);
const etbCs = computeAstmChecksum(etbInnerBuf);
const etbFrameBuf = Buffer.concat([
  Buffer.from([STX]),
  etbInnerBuf,
  Buffer.from(`${etbCs}\r\n`, 'ascii')
]);

const check2 = validateChecksum(etbFrameBuf);
assert.strictEqual(check2.valid, true, 'Checksum ETB debe ser válido');
assert.strictEqual(check2.delimiter, 'ETB', 'Debe reconocer delimitador ETB');
assert.strictEqual(check2.isIntermediate, true, 'Debe marcarse como frame intermedio');

const extracted2 = extractFrameText(etbFrameBuf);
assert.strictEqual(extracted2.isIntermediate, true, 'ExtractFrameText debe marcar isIntermediate');
assert.strictEqual(extracted2.frameNumber, 2, 'Frame number debe ser 2');
console.log('✓ 2. ASTM Multi-Frame (ETB) validado con éxito.');

// 3. ASTM Host Query (Q Record) Parsing
const queryMessage = 
  'H|\\^&|||Cobas^6000|||||||P|1\r\n' +
  'Q|1|^BC-990012||ALL||||||||O\r\n' +
  'L|1|N\r\n';

const parsedQuery = parseAstmMessage(queryMessage);
assert.strictEqual(parsedQuery.queries.length, 1, 'Debe parsear 1 query');
assert.strictEqual(parsedQuery.queries[0].sampleBarcode, 'BC-990012', 'Barcode debe ser BC-990012');
assert.strictEqual(parsedQuery.queries[0].universalTestId, 'ALL', 'Test ID debe ser ALL');
console.log('✓ 3. ASTM Host Query (Q Record) parseado correctamente.');

// 4. ASTM Order Generation (Host Query Response)
const orderLines = buildAstmOrderLines({
  senderId: 'AbregoTech LIS',
  patient: { name: 'Carlos Abrego', dob: '1985-04-12', gender: 'M' },
  order: { barcode: 'BC-990012', priority: 'STAT', order_number: 'ORD-2026-001' },
  tests: ['GLUCOSA', 'CREATININA', 'HEMOGRAMA']
});

assert.strictEqual(orderLines.length, 4, 'Debe generar 4 líneas ASTM (H, P, O, L)');
assert.ok(orderLines[0].startsWith('H|\\^&'), 'Header correcto');
assert.ok(orderLines[1].includes('Carlos Abrego'), 'Patient correcto');
assert.ok(orderLines[2].includes('^^^GLUCOSA\\^^^CREATININA\\^^^HEMOGRAMA'), 'Tests O-record correctos');
console.log('✓ 4. Generación de órdenes ASTM E1394 validada.');

// 5. HL7 Query (QBP^Q11) Parsing and Response (RSP^K11)
const hl7Query = 
  'MSH|^~\\&|COBAS|ROCHE|LIS|LAB|20261115120000||QBP^Q11|MSG-1002|P|2.5\r' +
  'QPD|INQ_001^Query Order|QRY-01|BC-990012^TUB01\r' +
  'RCP|I|10^RD\r';

const parsedHl7Query = parseHl7Message(hl7Query);
assert.strictEqual(parsedHl7Query.messageCode, 'QBP', 'Debe ser QBP');
assert.ok(parsedHl7Query.qpd, 'Debe parsear segmento QPD');
assert.strictEqual(parsedHl7Query.qpd.sampleBarcode, 'BC-990012', 'Debe extraer código de barra BC-990012');

const hl7Rsp = generateHl7OrderResponse(
  parsedHl7Query,
  { name: 'Elena Gomez', dob: '19900215', gender: 'F' },
  { order_number: 'ORD-8877', barcode: 'BC-990012' },
  ['GLU', 'BUN', 'CREA']
);

assert.ok(hl7Rsp.includes('RSP^K11'), 'Debe responder con RSP^K11');
assert.ok(hl7Rsp.includes('MSA|AA|MSG-1002'), 'Debe incluir MSA con ACK de la query');
assert.ok(hl7Rsp.includes('PID|1||1||Elena Gomez'), 'Debe incluir paciente');
assert.ok(hl7Rsp.includes('GLU~BUN~CREA'), 'Debe incluir baterías solicitadas');
console.log('✓ 5. HL7 Host Query (QBP^Q11 -> RSP^K11) validado.');

console.log('\n🎉 ¡TODOS LOS TESTS DE ESPECIFICACIÓN COMERCIAL PASARON AL 100%!');
