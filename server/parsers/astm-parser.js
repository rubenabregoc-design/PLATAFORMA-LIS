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
const ETX = 0x03;  // End of Text (Final block)
const EOT = 0x04;  // End of Transmission
const ENQ = 0x05;  // Enquiry
const ACK = 0x06;  // Acknowledge
const NAK = 0x15;  // Negative Acknowledge
const ETB = 0x17;  // End of Transmission Block (Intermediate block in multi-frame)
const CR  = 0x0D;  // Carriage Return
const LF  = 0x0A;  // Line Feed

/**
 * Computes ASTM checksum for any buffer slice (sum mod 256 as 2 hex digits).
 */
function computeAstmChecksum(contentBytes) {
  let sum = 0;
  for (let i = 0; i < contentBytes.length; i++) {
    sum += contentBytes[i];
  }
  return (sum % 256).toString(16).toUpperCase().padStart(2, '0');
}

/**
 * Validates the ASTM checksum of a frame.
 * Supports both ETX (final frame) and ETB (intermediate frame in multi-frame transmissions).
 * Checksum = sum of all bytes between STX (exclusive) and ETX/ETB (inclusive), mod 256, as 2-char uppercase hex.
 */
function validateChecksum(frameBuffer) {
  const stxIdx = frameBuffer.indexOf(STX);
  if (stxIdx === -1) {
    return { valid: false, expected: '??', computed: '??', delimiter: null, endIdx: -1 };
  }

  // Find either ETX or ETB
  const etxIdx = frameBuffer.indexOf(ETX, stxIdx + 1);
  const etbIdx = frameBuffer.indexOf(ETB, stxIdx + 1);

  let endIdx = -1;
  let delimiter = null;

  if (etxIdx !== -1 && etbIdx !== -1) {
    endIdx = Math.min(etxIdx, etbIdx);
    delimiter = endIdx === etxIdx ? 'ETX' : 'ETB';
  } else if (etxIdx !== -1) {
    endIdx = etxIdx;
    delimiter = 'ETX';
  } else if (etbIdx !== -1) {
    endIdx = etbIdx;
    delimiter = 'ETB';
  } else {
    return { valid: false, expected: '??', computed: '??', delimiter: null, endIdx: -1 };
  }

  let sum = 0;
  for (let i = stxIdx + 1; i <= endIdx; i++) {
    sum += frameBuffer[i];
  }
  const computed = (sum % 256).toString(16).toUpperCase().padStart(2, '0');

  const c1 = endIdx + 1 < frameBuffer.length ? String.fromCharCode(frameBuffer[endIdx + 1]) : '?';
  const c2 = endIdx + 2 < frameBuffer.length ? String.fromCharCode(frameBuffer[endIdx + 2]) : '?';
  const expected = (c1 + c2).toUpperCase();

  return {
    valid: computed === expected,
    expected,
    computed,
    delimiter,
    isIntermediate: delimiter === 'ETB',
    endIdx
  };
}

/**
 * Extracts the text content and frame metadata from a raw ASTM frame buffer.
 */
function extractFrameText(frameBuffer) {
  const stxIdx = frameBuffer.indexOf(STX);
  if (stxIdx === -1) {
    return frameBuffer.toString('utf8').trim();
  }

  const etxIdx = frameBuffer.indexOf(ETX, stxIdx + 1);
  const etbIdx = frameBuffer.indexOf(ETB, stxIdx + 1);

  let endIdx = -1;
  let isIntermediate = false;

  if (etxIdx !== -1 && etbIdx !== -1) {
    endIdx = Math.min(etxIdx, etbIdx);
    isIntermediate = endIdx === etbIdx;
  } else if (etxIdx !== -1) {
    endIdx = etxIdx;
  } else if (etbIdx !== -1) {
    endIdx = etbIdx;
    isIntermediate = true;
  } else {
    return frameBuffer.toString('utf8').trim();
  }

  const rawPayload = frameBuffer.slice(stxIdx + 1, endIdx).toString('utf8');
  // First character of payload is the ASTM Frame Number (0 to 7)
  const frameNumberMatch = rawPayload.match(/^[0-7]/);
  const frameNumber = frameNumberMatch ? parseInt(frameNumberMatch[0], 10) : 1;
  const content = rawPayload.replace(/^[0-7]/, '');

  return {
    text: content,
    rawPayload,
    frameNumber,
    isIntermediate,
    delimiter: isIntermediate ? 'ETB' : 'ETX'
  };
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
 * Parses a Request Information / Host Query Record (Q record)
 * Format: Q|sequenceNumber|startingSpecimenId|endingSpecimenId|universalTestId|...
 * E.g.: Q|1|^102455||ALL||||||||O
 */
function parseQueryRecord(fields) {
  const specimenField = fields[2] || '';
  // Specimen ID can be formatted as ^barcode or ^^^barcode or plain barcode
  const barcodeMatch = specimenField.match(/\^{0,3}([a-zA-Z0-9_\-\.]+)/);
  const sampleBarcode = barcodeMatch ? barcodeMatch[1] : specimenField;

  return {
    recordType: 'Q',
    sequenceNumber: fields[1] || '1',
    startingSpecimenId: specimenField,
    sampleBarcode,
    endingSpecimenId: fields[3] || '',
    universalTestId: fields[4] || 'ALL',
    natureOfRequest: fields[5] || '',
    requestStatus: fields[12] || 'O' // 'O' = Requesting orders, 'A' = Abort, 'N' = No order found
  };
}

/**
 * Formats a single ASTM E1381 frame buffer with STX, frame number, payload, ETX/ETB, checksum, CR, LF.
 */
function formatAstmFrame(frameNumber, payload, isLast = true) {
  const fnChar = (frameNumber % 8).toString();
  const endByte = isLast ? ETX : ETB;
  const contentBuf = Buffer.concat([
    Buffer.from(fnChar + payload, 'utf8'),
    Buffer.from([endByte])
  ]);
  const checksum = computeAstmChecksum(contentBuf);

  return Buffer.concat([
    Buffer.from([STX]),
    contentBuf,
    Buffer.from(`${checksum}\r\n`, 'ascii')
  ]);
}

/**
 * Builds an ASTM E1394 message array of lines (H, P, O, L) for sending orders to an analyzer.
 * Supports configurable driver profiles for:
 * - orderStrategy: 'SINGLE_O_REPEAT' (default) | 'MULTI_O_RECORDS' (for Roche/Mindray) | 'PROFILE_ONLY' (hematology)
 * - repeatDelimiter: '\' (default) | '/' | '~' (for machines that don't accept backslash)
 * - testPrefix: '^^^' (default) | '' (for coagulometers like Stago)
 * - barcodePrefix: '' | '^'
 * - testMapping: dictionary of LIS test codes to analyzer channel codes
 */
function buildAstmOrderLines({
  senderId = 'AbregoTech LIS',
  patient,
  order,
  tests = [],
  driverProfile = {}
}) {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
  const patientName = patient?.name || `${patient?.first_name || ''} ${patient?.last_name || ''}`.trim() || 'Paciente';
  const patientId = patient?.id || patient?.document_number || '1';
  const dob = (patient?.dob || '').replace(/-/g, '');
  const gender = (patient?.gender || 'U').charAt(0).toUpperCase();
  const rawBarcode = order?.barcode || order?.order_number || '';
  const priority = order?.priority === 'STAT' || order?.priority === 'URGENTE' ? 'S' : 'R';

  // Driver options
  const orderStrategy = driverProfile.orderStrategy || 'SINGLE_O_REPEAT';
  const repeatDelim = driverProfile.repeatDelimiter || '\\';
  const testPrefix = driverProfile.testPrefix !== undefined ? driverProfile.testPrefix : '^^^';
  const barcodePrefix = driverProfile.barcodePrefix || '';
  const profileCode = driverProfile.profileCode || 'ALL';
  const testMapping = driverProfile.testMapping || {};

  const barcode = `${barcodePrefix}${rawBarcode}`;

  // Map tests to analyzer channel codes if mapping exists
  const mappedTests = tests.length > 0 
    ? tests.map(t => {
        const rawCode = typeof t === 'string' ? t : (t.code || t.name);
        return testMapping[rawCode] || testMapping[rawCode.toUpperCase()] || rawCode;
      })
    : [profileCode];

  const headerDelimiter = `\\^&`;
  const lines = [
    `H|${headerDelimiter}|||${senderId}|||||||P|1|${timestamp}`,
    `P|1|||${patientId}||${patientName}||${dob}|${gender}`
  ];

  if (orderStrategy === 'MULTI_O_RECORDS') {
    // One O-record per test: O|1|...|^^^GLU, O|2|...|^^^BUN (Solves the issue where machines can't read repeat slashes)
    mappedTests.forEach((testCode, idx) => {
      const seq = idx + 1;
      const testItem = `${testPrefix}${testCode}`;
      lines.push(`O|${seq}|${barcode}||${testItem}|${priority}|${timestamp}|||||A||||||||||||||O`);
    });
  } else if (orderStrategy === 'PROFILE_ONLY') {
    // Sends single battery code (e.g. ^^^CBC+DIFF or ^^^1 for Sysmex)
    lines.push(`O|1|${barcode}||${testPrefix}${profileCode}|${priority}|${timestamp}|||||A||||||||||||||O`);
  } else {
    // Single O-record with configurable repetition delimiter (\ or / or ~)
    const testItems = mappedTests.map(t => `${testPrefix}${t}`).join(repeatDelim);
    lines.push(`O|1|${barcode}||${testItems}|${priority}|${timestamp}|||||A||||||||||||||O`);
  }

  lines.push(`L|1|N`);
  return lines;
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
    queries: [],
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
      case 'Q': parsed.queries.push(parseQueryRecord(fields)); break;
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
  STX, ETX, EOT, ENQ, ACK, NAK, ETB, CR, LF,
  computeAstmChecksum,
  validateChecksum,
  extractFrameText,
  formatAstmFrame,
  buildAstmOrderLines,
  parseAstmMessage,
  parseHeaderRecord,
  parsePatientRecord,
  parseOrderRecord,
  parseResultRecord,
  parseCommentRecord,
  parseQueryRecord,
  generateHexDump
};
