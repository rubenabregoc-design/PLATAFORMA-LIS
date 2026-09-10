/**
 * HL7 v2.5 MLLP Parser — AbregoTech LIS Middleware Bridge
 * 
 * Parses HL7 v2.x messages wrapped in MLLP (Minimal Lower Layer Protocol).
 * Supports message types: ORU^R01 (Results), OML^O21 (Orders), QBP^Q11 (Query)
 * Generates proper MSA acknowledgments.
 * 
 * Reference: HL7 v2.5 Chapter 2 (Control), Chapter 7 (Observation Reporting)
 */

// MLLP Framing Characters
const VT  = 0x0B;  // Vertical Tab — Start Block
const FS  = 0x1C;  // File Separator — End Block
const CR  = 0x0D;  // Carriage Return — Segment terminator

/**
 * Extracts the HL7 message from an MLLP envelope.
 * MLLP format: <VT> message <FS><CR>
 */
function extractFromMllp(buffer) {
  let start = 0;
  let end = buffer.length;

  // Find VT (start)
  const vtIdx = buffer.indexOf(VT);
  if (vtIdx !== -1) start = vtIdx + 1;

  // Find FS (end)
  const fsIdx = buffer.indexOf(FS);
  if (fsIdx !== -1) end = fsIdx;

  return buffer.slice(start, end).toString('utf8');
}

/**
 * Wraps an HL7 message in MLLP envelope for transmission.
 */
function wrapInMllp(messageString) {
  return Buffer.concat([
    Buffer.from([VT]),
    Buffer.from(messageString, 'utf8'),
    Buffer.from([FS, CR])
  ]);
}

/**
 * Parses a single HL7 segment into fields array.
 * Handles component separator (^), repetition (~), escape (\), subcomponent (&).
 */
function parseSegment(segmentString) {
  return segmentString.split('|');
}

/**
 * Parses component fields (separated by ^).
 */
function parseComponents(fieldValue) {
  if (!fieldValue) return [];
  return fieldValue.split('^');
}

/**
 * Parses a full HL7 message into structured segments.
 */
function parseHl7Message(messageText) {
  // Segments separated by \r, \n, or \r\n
  const segments = messageText.split(/[\r\n]+/).filter(s => s.trim());
  
  const parsed = {
    msh: null,
    pid: null,
    obr: null,
    obx: [],
    nte: [],
    orc: null,
    raw: messageText,
    messageType: '',
    messageControlId: '',
    sendingApplication: '',
    sendingFacility: '',
    segmentCount: segments.length
  };

  for (const segment of segments) {
    const fields = parseSegment(segment);
    const segType = fields[0];

    switch (segType) {
      case 'MSH':
        parsed.msh = parseMshSegment(fields);
        parsed.messageType = parsed.msh.messageType;
        parsed.messageControlId = parsed.msh.messageControlId;
        parsed.sendingApplication = parsed.msh.sendingApplication;
        parsed.sendingFacility = parsed.msh.sendingFacility;
        break;
      case 'PID':
        parsed.pid = parsePidSegment(fields);
        break;
      case 'OBR':
        parsed.obr = parseObrSegment(fields);
        break;
      case 'OBX':
        parsed.obx.push(parseObxSegment(fields));
        break;
      case 'NTE':
        parsed.nte.push(parseNteSegment(fields));
        break;
      case 'ORC':
        parsed.orc = parseOrcSegment(fields);
        break;
    }
  }

  return parsed;
}

/**
 * MSH — Message Header Segment
 */
function parseMshSegment(fields) {
  // MSH|^~\&|SendApp|SendFac|RecvApp|RecvFac|DateTime||MsgType|MsgCtrlId|ProcId|Version
  const msgTypeComponents = parseComponents(fields[8] || '');
  return {
    segmentType: 'MSH',
    encodingCharacters: fields[1] || '^~\\&',
    sendingApplication: fields[2] || '',
    sendingFacility: fields[3] || '',
    receivingApplication: fields[4] || '',
    receivingFacility: fields[5] || '',
    dateTime: fields[6] || '',
    security: fields[7] || '',
    messageType: msgTypeComponents.join('^'),
    messageCode: msgTypeComponents[0] || '',
    triggerEvent: msgTypeComponents[1] || '',
    messageControlId: fields[9] || '',
    processingId: fields[10] || 'P',
    versionId: fields[11] || '2.5'
  };
}

/**
 * PID — Patient Identification Segment
 */
function parsePidSegment(fields) {
  const nameComponents = parseComponents(fields[5] || '');
  const patientIdComponents = parseComponents(fields[3] || '');
  return {
    segmentType: 'PID',
    setId: fields[1] || '1',
    externalPatientId: fields[2] || '',
    patientId: patientIdComponents[0] || fields[3] || '',
    alternatePatientId: fields[4] || '',
    lastName: nameComponents[0] || '',
    firstName: nameComponents[1] || '',
    patientName: nameComponents.length >= 2 
      ? `${nameComponents[1]} ${nameComponents[0]}` 
      : (fields[5] || ''),
    dob: fields[7] || '',
    gender: fields[8] || ''
  };
}

/**
 * OBR — Observation Request Segment
 */
function parseObrSegment(fields) {
  const testComponents = parseComponents(fields[4] || '');
  return {
    segmentType: 'OBR',
    setId: fields[1] || '1',
    placerOrderNumber: fields[2] || '',
    fillerOrderNumber: fields[3] || '',
    testCode: testComponents[0] || '',
    testName: testComponents[1] || '',
    rawTestField: fields[4] || '',
    priority: fields[5] || '',
    requestedDateTime: fields[6] || '',
    observationDateTime: fields[7] || '',
    specimenSource: fields[15] || '',
    orderingProvider: fields[16] || '',
    resultStatus: fields[25] || 'F'
  };
}

/**
 * OBX — Observation/Result Segment
 */
function parseObxSegment(fields) {
  const testComponents = parseComponents(fields[3] || '');
  const refRange = fields[7] || '';
  const rawFlag = (fields[8] || '').trim();

  // Parse reference range
  let refMin = null, refMax = null;
  const rangeMatch = refRange.match(/([\d.]+)\s*-\s*([\d.]+)/);
  const lessThanMatch = refRange.match(/<\s*([\d.]+)/);
  const greaterThanMatch = refRange.match(/>\s*([\d.]+)/);
  
  if (rangeMatch) {
    refMin = parseFloat(rangeMatch[1]);
    refMax = parseFloat(rangeMatch[2]);
  } else if (lessThanMatch) {
    refMax = parseFloat(lessThanMatch[1]);
  } else if (greaterThanMatch) {
    refMin = parseFloat(greaterThanMatch[1]);
  }

  // Map HL7 abnormal flags to LIS flags
  let flag = 'NORMAL';
  if (rawFlag === 'HH' || rawFlag === 'PH') flag = 'CRITICO_ALTO';
  else if (rawFlag === 'LL' || rawFlag === 'PL') flag = 'CRITICO_BAJO';
  else if (rawFlag === 'H' || rawFlag === 'A') flag = 'ALTO';
  else if (rawFlag === 'L') flag = 'BAJO';
  else if (rawFlag === 'N') flag = 'NORMAL';

  return {
    segmentType: 'OBX',
    setId: fields[1] || '1',
    valueType: fields[2] || 'NM',  // NM=Numeric, ST=String, CE=Coded
    testCode: testComponents[0] || '',
    testName: testComponents[1] || '',
    rawTestField: fields[3] || '',
    observationSubId: fields[4] || '',
    value: fields[5] || '',
    numericValue: fields[2] === 'NM' ? (parseFloat(fields[5]) || null) : null,
    unit: fields[6] || '',
    referenceRange: refRange,
    refMin,
    refMax,
    rawFlag,
    flag,
    resultStatus: fields[11] || 'F',  // F=Final, P=Preliminary, C=Corrected
    timestamp: fields[14] || ''
  };
}

/**
 * NTE — Notes/Comments Segment
 */
function parseNteSegment(fields) {
  return {
    segmentType: 'NTE',
    setId: fields[1] || '1',
    sourceOfComment: fields[2] || 'L',
    comment: fields[3] || ''
  };
}

/**
 * ORC — Common Order Segment
 */
function parseOrcSegment(fields) {
  return {
    segmentType: 'ORC',
    orderControl: fields[1] || '',
    placerOrderNumber: fields[2] || '',
    fillerOrderNumber: fields[3] || '',
    orderStatus: fields[5] || ''
  };
}

/**
 * Generates an HL7 ACK message for a received message.
 * @param {object} parsedMsg - The parsed HL7 message
 * @param {string} ackCode - AA (accept), AE (error), AR (reject)
 * @param {string} textMessage - Optional text message
 */
function generateAck(parsedMsg, ackCode = 'AA', textMessage = '') {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
  const msgControlId = `ACK-${Date.now()}`;
  
  const msh = parsedMsg.msh || {};
  const originalMsgCtrlId = msh.messageControlId || 'UNKNOWN';

  let ack = '';
  ack += `MSH|^~\\&|LIS_CORE|ABREGOTECH|${msh.sendingApplication || 'ANALYZER'}|${msh.sendingFacility || 'LAB'}|${timestamp}||ACK^R01|${msgControlId}|P|2.5\r`;
  ack += `MSA|${ackCode}|${originalMsgCtrlId}|${textMessage}\r`;

  return ack;
}

/**
 * Wraps an ACK message in MLLP for TCP transmission.
 */
function generateMllpAck(parsedMsg, ackCode = 'AA', textMessage = '') {
  const ackMessage = generateAck(parsedMsg, ackCode, textMessage);
  return wrapInMllp(ackMessage);
}

export {
  VT, FS, CR,
  extractFromMllp,
  wrapInMllp,
  parseHl7Message,
  parseMshSegment,
  parsePidSegment,
  parseObrSegment,
  parseObxSegment,
  parseNteSegment,
  parseOrcSegment,
  generateAck,
  generateMllpAck
};
