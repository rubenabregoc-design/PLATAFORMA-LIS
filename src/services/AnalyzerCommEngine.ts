/**
 * ============================================================================
 * AbregoTech — Analyzer Communication Engine (ACE)
 * ============================================================================
 * Motor profesional de comunicación bidireccional con analizadores clínicos.
 * Soporta protocolos ASTM E1381/E1394, HL7 v2.x, y parsers propietarios.
 * 
 * Arquitectura:
 *   Analizador → [TCP/Serial/WebSerial] → ACE → Parser → LIS Core
 *   LIS Core → ACE → [Host Query] → Analizador
 * 
 * @version 2.0.0
 * @license AbregoTech Proprietary
 */

// ── Control Characters (ASTM E1381) ──────────────────────────────────────
export const ASTM_CHARS = {
  ENQ: '\x05',   // Enquiry - Solicitud de transmisión
  ACK: '\x06',   // Acknowledge - Bloque recibido OK
  NAK: '\x15',   // Negative Acknowledge - Error en bloque
  STX: '\x02',   // Start of Text
  ETX: '\x03',   // End of Text  
  ETB: '\x17',   // End of Transmission Block
  EOT: '\x04',   // End of Transmission
  CR:  '\x0D',   // Carriage Return
  LF:  '\x0A',   // Line Feed
} as const;

// ── Types ────────────────────────────────────────────────────────────────
export type ConnectionState = 'DISCONNECTED' | 'CONNECTING' | 'LISTENING' | 'RECEIVING' | 'TRANSMITTING' | 'ERROR' | 'IDLE';
export type ProtocolPhase = 'IDLE' | 'ENQ_RECEIVED' | 'ACK_SENT' | 'DATA_TRANSFER' | 'EOT_RECEIVED' | 'PROCESSING' | 'COMPLETE' | 'ERROR';

export interface CommEvent {
  id: string;
  timestamp: string;
  type: 'CONTROL' | 'DATA' | 'SYSTEM' | 'ERROR' | 'HANDSHAKE' | 'PARSE';
  direction: 'IN' | 'OUT' | 'INTERNAL';
  source: string;
  message: string;
  rawHex?: string;
  protocol?: string;
  latencyMs?: number;
}

export interface AnalyzerSession {
  sessionId: string;
  analyzerId: string;
  analyzerName: string;
  startedAt: string;
  endedAt?: string;
  state: ConnectionState;
  protocolPhase: ProtocolPhase;
  framesReceived: number;
  bytesTransferred: number;
  events: CommEvent[];
  parsedRecords: ParsedASTMRecord[];
  errors: string[];
  checksumValid: boolean;
}

export interface ParsedASTMRecord {
  type: 'H' | 'P' | 'O' | 'R' | 'L' | 'C' | 'Q' | 'M' | 'S';
  sequenceNumber: number;
  fields: string[];
  raw: string;
}

export interface ASTMFrame {
  header: { senderId: string; senderModel: string; version: string; timestamp: string };
  patient: { id: string; name: string; dob?: string; gender?: string };
  order: { sampleId: string; testCodes: string[]; priority: string; timestamp: string };
  results: { code: string; value: string; unit: string; refRange: string; flag: string; status: string }[];
  terminator: { sequenceNumber: number; terminationCode: string };
}

// ── ASTM Frame Parser ────────────────────────────────────────────────────
export function parseASTMFrame(rawPayload: string): ASTMFrame | null {
  try {
    const lines = rawPayload.split(/[\n\r]+/).filter(l => l.trim());
    const frame: ASTMFrame = {
      header: { senderId: '', senderModel: '', version: '', timestamp: '' },
      patient: { id: '', name: '' },
      order: { sampleId: '', testCodes: [], priority: '', timestamp: '' },
      results: [],
      terminator: { sequenceNumber: 0, terminationCode: 'N' }
    };

    for (const line of lines) {
      const recordType = line.charAt(0);
      const fields = line.split('|');

      switch (recordType) {
        case 'H': {
          const senderInfo = (fields[4] || '').split('^');
          frame.header.senderId = senderInfo[0] || '';
          frame.header.senderModel = senderInfo[1] || '';
          frame.header.version = fields[12] || '1';
          frame.header.timestamp = fields[13] || '';
          break;
        }
        case 'P': {
          frame.patient.id = fields[3] || '';
          const nameField = (fields[4] || fields[3] || '').split('^');
          frame.patient.name = nameField.join(' ');
          break;
        }
        case 'O': {
          frame.order.sampleId = fields[2] || fields[3] || '';
          const testField = (fields[4] || '').replace(/\^{3}/g, '');
          frame.order.testCodes = [testField];
          frame.order.priority = fields[5] || 'R';
          frame.order.timestamp = fields[7] || '';
          break;
        }
        case 'R': {
          const testCode = (fields[2] || '').replace(/\^{3}/g, '');
          frame.results.push({
            code: testCode,
            value: fields[3] || '',
            unit: fields[4] || '',
            refRange: fields[5] || '',
            flag: fields[6] || 'N',
            status: fields[8] || 'F'
          });
          break;
        }
        case 'L': {
          frame.terminator.sequenceNumber = parseInt(fields[1]) || 1;
          frame.terminator.terminationCode = fields[2] || 'N';
          break;
        }
      }
    }
    return frame;
  } catch {
    return null;
  }
}

// ── HL7 v2.x Parser ─────────────────────────────────────────────────────
export interface HL7Message {
  messageType: string;
  sendingApp: string;
  sendingFacility: string;
  receivingApp: string;
  timestamp: string;
  messageId: string;
  version: string;
  patientId: string;
  patientName: string;
  observations: { code: string; name: string; value: string; unit: string; refRange: string; flag: string }[];
}

export function parseHL7Message(rawPayload: string): HL7Message | null {
  try {
    const segments = rawPayload.split(/[\n\r]+/).filter(s => s.trim());
    const msg: HL7Message = {
      messageType: '', sendingApp: '', sendingFacility: '',
      receivingApp: '', timestamp: '', messageId: '', version: '',
      patientId: '', patientName: '', observations: []
    };

    for (const seg of segments) {
      const fields = seg.split('|');
      const segType = fields[0];

      switch (segType) {
        case 'MSH':
          msg.sendingApp = fields[2] || '';
          msg.sendingFacility = fields[3] || '';
          msg.receivingApp = fields[4] || '';
          msg.timestamp = fields[6] || '';
          msg.messageType = fields[8] || '';
          msg.messageId = fields[9] || '';
          msg.version = fields[11] || '';
          break;
        case 'PID':
          msg.patientId = fields[3] || '';
          msg.patientName = (fields[5] || '').replace('^', ' ');
          break;
        case 'OBX': {
          const codeField = (fields[3] || '').split('^');
          msg.observations.push({
            code: codeField[0] || '',
            name: codeField[1] || codeField[0] || '',
            value: fields[5] || '',
            unit: fields[6] || '',
            refRange: fields[7] || '',
            flag: fields[8] || 'N'
          });
          break;
        }
      }
    }
    return msg;
  } catch {
    return null;
  }
}

// ── Checksum Calculator (ASTM E1381) ─────────────────────────────────────
export function calculateASTMChecksum(data: string): string {
  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    sum += data.charCodeAt(i);
  }
  return (sum % 256).toString(16).toUpperCase().padStart(2, '0');
}

// ── Hex Dump Utility ─────────────────────────────────────────────────────
export function toHexDump(data: string, bytesPerLine = 16): string {
  const lines: string[] = [];
  for (let i = 0; i < data.length; i += bytesPerLine) {
    const chunk = data.slice(i, i + bytesPerLine);
    const hex = Array.from(chunk).map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join(' ');
    const ascii = Array.from(chunk).map(c => (c.charCodeAt(0) >= 32 && c.charCodeAt(0) < 127) ? c : '.').join('');
    lines.push(`${i.toString(16).padStart(4, '0')}  ${hex.padEnd(bytesPerLine * 3)}  ${ascii}`);
  }
  return lines.join('\n');
}

// ── Session Factory ──────────────────────────────────────────────────────
export function createSession(analyzerId: string, analyzerName: string): AnalyzerSession {
  return {
    sessionId: `SES-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
    analyzerId,
    analyzerName,
    startedAt: new Date().toISOString(),
    state: 'CONNECTING',
    protocolPhase: 'IDLE',
    framesReceived: 0,
    bytesTransferred: 0,
    events: [],
    parsedRecords: [],
    errors: [],
    checksumValid: true
  };
}

export function createCommEvent(
  type: CommEvent['type'],
  direction: CommEvent['direction'],
  source: string,
  message: string,
  extra?: Partial<CommEvent>
): CommEvent {
  return {
    id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    timestamp: new Date().toISOString(),
    type, direction, source, message,
    ...extra
  };
}
