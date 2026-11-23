/**
 * AbregoTech LIS — Driver: Roche Cobas Series (Cobas 6000, 8000, c311, e411, pure)
 * Protocol: HL7 v2.5 MLLP / ASTM E1381 (Hitachi Standard)
 */

export const rocheCobasDriver = {
  id: 'roche-cobas',
  name: 'Roche Cobas Series Driver',
  modelMatch: 'Cobas',
  manufacturer: 'Roche Diagnostics',
  protocol: 'HL7_V2', // Can also operate in ASTM mode for c311/e411
  category: 'QUIMICA',
  defaultPort: 5102,
  ackDelayMs: 10,

  // Outbound Order Strategy (When in ASTM mode)
  // CRITICAL: Roche Cobas ASTM requires MULTI_O_RECORDS (one O-record per test).
  // It does NOT support test repetition slash (\) in a single O record.
  orderStrategy: 'MULTI_O_RECORDS',
  testPrefix: '^^^',
  barcodePrefix: '',
  repeatDelimiter: '~', // In HL7 MLLP mode, repeat is tilde (~)

  // Channel numbers used in Roche application sheets mapped to LIS tests
  testMapping: {
    '001': 'GLUCOSA',
    'GLUC3': 'GLUCOSA',
    'GLU': 'GLUCOSA',
    '014': 'UREA',
    'UREA': 'UREA',
    '015': 'BUN',
    'BUN': 'BUN',
    '022': 'CREATININA',
    'CREA2': 'CREATININA',
    'CREA': 'CREATININA',
    '030': 'COLESTEROL_TOTAL',
    'CHOL2': 'COLESTEROL_TOTAL',
    '031': 'TRIGLICERIDOS',
    'TRIGL': 'TRIGLICERIDOS',
    '040': 'AST_GOT',
    'ASTL': 'AST_GOT',
    '041': 'ALT_GPT',
    'ALTL': 'ALT_GPT',
    '101': 'TSH',
    'TSH3': 'TSH',
    '102': 'FT4',
    'FT4_2': 'FT4',
    '105': 'TROPONINA_I',
    'TNONI': 'TROPONINA_I'
  },

  flagMapping: {
    'HH': 'CRITICO_ALTO',
    'LL': 'CRITICO_BAJO',
    'H': 'ALTO',
    'L': 'BAJO',
    '>': 'SOBRE_RANGO_ANALITICO',
    '<': 'BAJO_RANGO_ANALITICO'
  }
};
