/**
 * AbregoTech LIS — Driver: Sysmex XN Series (XN-1000, XN-2000, XN-350, XS-1000i)
 * Protocol: ASTM E1381 / E1394
 */

export const sysmexXnDriver = {
  id: 'sysmex-xn',
  name: 'Sysmex XN Series Driver',
  modelMatch: 'Sysmex',
  manufacturer: 'Sysmex Corporation',
  protocol: 'ASTM_E1381',
  category: 'HEMATOLOGIA',
  defaultPort: 5100,
  ackDelayMs: 0, // Sysmex prefers instant ACK (<10ms)

  // Outbound Order Strategy (Host Query)
  // Sysmex prefers requesting the battery profile (e.g. CBC+DIFF or 0000000000000001)
  orderStrategy: 'PROFILE_ONLY',
  profileCode: 'CBC+DIFF',
  testPrefix: '^^^',
  barcodePrefix: '^',
  repeatDelimiter: '\\',

  // Raw parameter code translation to LIS standardized names
  testMapping: {
    'WBC': 'Leucocitos',
    'RBC': 'Eritrocitos',
    'HGB': 'Hemoglobina',
    'HCT': 'Hematocrito',
    'MCV': 'VCM',
    'MCH': 'HCM',
    'MCHC': 'CHCM',
    'PLT': 'Plaquetas',
    'RDW-SD': 'RDW-SD',
    'RDW-CV': 'RDW-CV',
    'NEUT#': 'Neutrófilos Absolutos',
    'NEUT%': 'Neutrófilos %',
    'LYMPH#': 'Linfocitos Absolutos',
    'LYMPH%': 'Linfocitos %',
    'MONO#': 'Monocitos Absolutos',
    'MONO%': 'Monocitos %',
    'EO#': 'Eosinófilos Absolutos',
    'EO%': 'Eosinófilos %',
    'BASO#': 'Basófilos Absolutos',
    'BASO%': 'Basófilos %'
  },

  // Sysmex-specific flag translation
  flagMapping: {
    '@': 'FUERA_DE_LINEALIDAD',
    '*': 'DUDOSO_REVISAR_FROTIS',
    '+': 'ALTO',
    '-': 'BAJO',
    'N': 'NORMAL'
  }
};
