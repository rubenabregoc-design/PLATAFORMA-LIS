/**
 * AbregoTech LIS — Driver: Abbott Alinity & Architect Series (Alinity ci, Architect c8000, i2000SR)
 * Protocol: HL7 v2.5 MLLP
 */

export const abbottAlinityDriver = {
  id: 'abbott-alinity',
  name: 'Abbott Alinity/Architect Driver',
  modelMatch: 'Alinity',
  manufacturer: 'Abbott Diagnostics',
  protocol: 'HL7_V2',
  category: 'INMUNOLOGIA',
  defaultPort: 5103,
  ackDelayMs: 15,

  orderStrategy: 'SINGLE_O_REPEAT',
  testPrefix: '',
  barcodePrefix: '',
  repeatDelimiter: '~',

  testMapping: {
    'GLU': 'GLUCOSA',
    'CREA': 'CREATININA',
    'TSH': 'TSH',
    'FT4': 'T4_LIBRE',
    'HIV_AGAB': 'VIH_1_2_COMBO',
    'HBSAG': 'HEPATITIS_B_SUPERFICIE',
    'HCV': 'HEPATITIS_C_ANTICUERPOS',
    'TROP_I': 'TROPONINA_I_HS'
  },

  flagMapping: {
    'HH': 'CRITICO_ALTO',
    'LL': 'CRITICO_BAJO',
    'H': 'ALTO',
    'L': 'BAJO',
    'REACT': 'REACTIVO',
    'NON-REACT': 'NO_REACTIVO'
  }
};
