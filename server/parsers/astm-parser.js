/**
 * ASTM E1381 / E1394 Frame Parser — AbregoTech LIS Middleware Bridge
 * 
 * Parses raw ASTM frames into structured clinical data.
 * Supports record types: H (Header), P (Patient), O (Order), R (Result), C (Comment), L (Terminator)
 * 
 * Reference: CLSI LIS01-A2 / ASTM E1394-97
 */

// ASTM Control Characters
const STX = 0x02;  // Start of Text
const ETX = 0x03;  // End of Text
const EOT = 0x04;  // End of Transmission
const ENQ = 0x05;  // Enquiry
const ACK = 0x06;  // Acknowledge
const NAK = 0x15;  // Negative Acknowledge
const CR  = 0x0D;  // Carriage Return
const LF  = 0x0A;  // Line Feed

/**
 * Validates the ASTM checksum of a frame.
 * Checksum = sum of all bytes between STX (exclusive) and ETX (inclusive), mod 256, as 2-char uppercase hex.
 */
function validateChecksum(frameBuffer) {
  const stxIdx = frameBuffer.indexOf(STX);
  const etxIdx = frameBuffer.indexOf(ETX);
  
  if (stxIdx === -1 || etxIdx === -1 || etxIdx <= stxIdx) {
    return { valid: false, expected: '??', computed: '??' };
  }

  let sum = 0;
  for (let i = stxIdx + 1; i <= etxIdx; i++) {
    sum += frameBuffer[i];
  }
  const computed = (sum % 256).toString(16).toUpperCase().padStart(2, '0');

  const c1 = etxIdx + 1 < frameBuffer.length ? String.fromCharCode(frameBuffer[etxIdx + 1]) : '?';
  const c2 = etxIdx + 2 < frameBuffer.length ? String.fromCharCode(frameBuffer[etxIdx + 2]) : '?';
  const expected = (c1 + c2).toUpperCase();

  return { valid: computed === expected, expected, computed };
}

/**
 * Extracts the text content from a raw ASTM frame buffer.
 */
function extractFrameText(frameBuffer) {
  const stxIdx = frameBuffer.indexOf(STX);
  const etxIdx = frameBuffer.indexOf(ETX);
  
  if (stxIdx === -1 || etxIdx === -1) {
    return frameBuffer.toString('utf8').trim();
  }

  const content = frameBuffer.slice(stxIdx + 1, etxIdx).toString('utf8');
  return content.replace(/^[1-7]/, '');
}

function parseHeaderRecord(fields) {
  return {
    recordType: 'H',
    delimiter: fields[1] || '\\^&',
    senderId: fields[4] || '',
    senderModel: fields[4] ? fields[4].split('^')[1] || fields[4] : '',
    processingId: fields[11] || 'P',
    versionNumber: fields[12] || '1',
    timestamp: fields[13] || ''
  };
}

function parsePatientRecord(fields) {
  const nameField = fields[5] || '';
  const nameParts = nameField.split('^');
  return {
    recordType: 'P',
    sequenceNumber: fields[1] || '1',
    practicePatientId: fields[2] || '',
    labPatientId: fields[3] || '',
    patientName: nameParts.length >= 2 ? `${nameParts[1]} ${nameParts[0]}` : nameField,
    lastName: nameParts[0] || '',
    firstName: nameParts[1] || '',
    dob: fields[7] || '',
    gender: fields[8] || ''
  };
}

function parseOrderRecord(fields) {
  const testField = fields[4] || '';
  const testCodeMatch = testField.match(/\^{2,3}(\w+)/);
  return {
    recordType: 'O',
    sequenceNumber: fields[1] || '1',
    specimenId: fields[2] || '',
    instrumentSpecimenId: fields[3] || '',
    testCode: testCodeMatch ? testCodeMatch[1] : testField,
    rawTestField: testField,
    priority: fields[5] || 'R',
    requestedTimestamp: fields[6] || '',
    collectionTimestamp: fields[7] || '',
    actionCode: fields[11] || ''
  };
}

const ANALYZER_VALUE_DICTIONARY = {
  'NEGATIVE': { display: 'Negativo', flag: 'NORMAL' },
  'NEG': { display: 'Negativo', flag: 'NORMAL' },
  'NEG.': { display: 'Negativo', flag: 'NORMAL' },
  'POSITIVE': { display: 'Positivo', flag: 'ALTO' },
  'POS': { display: 'Positivo', flag: 'ALTO' },
  'POS.': { display: 'Positivo', flag: 'ALTO' },
  'REACTIVE': { display: 'Reactivo', flag: 'ALTO' },
  'REACT': { display: 'Reactivo', flag: 'ALTO' },
  'NON REACTIVE': { display: 'No Reactivo', flag: 'NORMAL' },
  'NON-REACTIVE': { display: 'No Reactivo', flag: 'NORMAL' },
  'NONREACTIVE': { display: 'No Reactivo', flag: 'NORMAL' },
  'NOT REACTIVE': { display: 'No Reactivo', flag: 'NORMAL' },
  'DETECTED': { display: 'Detectado', flag: 'ALTO' },
  'NOT DETECTED': { display: 'No Detectado', flag: 'NORMAL' },
  'UNDETECTED': { display: 'No Detectado', flag: 'NORMAL' },
  'INDETERMINATE': { display: 'Indeterminado', flag: 'NORMAL' },
  'EQUIVOCAL': { display: 'Equívoco', flag: 'NORMAL' },
  'NORMAL': { display: 'Normal', flag: 'NORMAL' },
  'ABNORMAL': { display: 'Anormal', flag: 'ALTO' },
  'NO GROWTH': { display: 'Sin Crecimiento', flag: 'NORMAL' },
  'TRACE': { display: 'Trazas', flag: 'ALTO' },
  'CLEAR': { display: 'Claro', flag: 'NORMAL' },
  'TURBID': { display: 'Turbio', flag: 'ALTO' },
  'CLOUDY': { display: 'Turbio', flag: 'ALTO' },
  'YELLOW': { display: 'Amarillo', flag: 'NORMAL' }
};

function parseResultRecord(fields) {
  const testField = fields[2] || '';
  const testCodeMatch = testField.match(/\^{2,3}(\w+)/);
  const refField = fields[5] || '';
  
  let refMin = null, refMax = null;
  const rangeMatch = refField.match(/([\d.]+)\s*-\s*([\d.]+)/);
  if (rangeMatch) {
    refMin = parseFloat(rangeMatch[1]);
    refMax = parseFloat(rangeMatch[2]);
  }

  const rawFlag = (fields[6] || '').trim();
  let flag = 'NORMAL';
  if (rawFlag === 'HH') flag = 'CRITICO_ALTO';
  else if (rawFlag === 'LL') flag = 'CRITICO_BAJO';
  else if (rawFlag === 'H') flag = 'ALTO';
  else if (rawFlag === 'L') flag = 'BAJO';

  const rawValue = fields[3] || '';
  const trimmedUpper = rawValue.trim().toUpperCase();
  let displayValue = rawValue;

  if (ANALYZER_VALUE_DICTIONARY[trimmedUpper]) {
    displayValue = ANALYZER_VALUE_DICTIONARY[trimmedUpper].display;
    if (flag === 'NORMAL' && ANALYZER_VALUE_DICTIONARY[trimmedUpper].flag !== 'NORMAL') {
      flag = ANALYZER_VALUE_DICTIONARY[trimmedUpper].flag;
    }
  }

  return {
    recordType: 'R',
    sequenceNumber: fields[1] || '1',
    testCode: testCodeMatch ? testCodeMatch[1] : testField,
    rawTestField: testField,
    value: displayValue,
    rawValue: rawValue,
    numericValue: parseFloat(rawValue) || null,
    unit: fields[4] || '',
    referenceRange: refField,
    refMin,
    refMax,
    rawFlag,
    flag,
    resultStatus: fields[8] || 'F',
    timestamp: fields[12] || ''
  };
}

function parseCommentRecord(fields) {
  return {
    recordType: 'C',
    sequenceNumber: fields[1] || '1',
    commentSource: fields[2] || 'I',
    commentText: fields[3] || '',
    commentType: fields[4] || 'G'
  };
}

/**
 * Parses a complete ASTM message (multiple records concatenated).
 */
function parseAstmMessage(messageText) {
  const lines = messageText.split(/[\r\n]+/).filter(l => l.trim());
  
  const parsed = {
    header: null,
    patient: null,
    order: null,
    results: [],
    comments: [],
    hasTerminator: false,
    raw: messageText,
    recordCount: lines.length
  };

  for (const line of lines) {
    const cleanLine = line.replace(/^\d+/, '');
    const fields = cleanLine.split('|');
    const recordType = fields[0];

    switch (recordType) {
      case 'H': parsed.header = parseHeaderRecord(fields); break;
      case 'P': parsed.patient = parsePatientRecord(fields); break;
      case 'O': parsed.order = parseOrderRecord(fields); break;
      case 'R': parsed.results.push(parseResultRecord(fields)); break;
      case 'C': parsed.comments.push(parseCommentRecord(fields)); break;
      case 'L': parsed.hasTerminator = true; break;
    }
  }

  return parsed;
}

function generateHexDump(buffer, maxBytes = 64) {
  const slice = buffer.slice(0, maxBytes);
  return Array.from(slice).map(b => b.toString(16).toUpperCase().padStart(2, '0')).join(' ');
}

export {
  STX, ETX, EOT, ENQ, ACK, NAK, CR, LF,
  validateChecksum,
  extractFrameText,
  parseAstmMessage,
  parseHeaderRecord,
  parsePatientRecord,
  parseOrderRecord,
  parseResultRecord,
  parseCommentRecord,
  generateHexDump
};
