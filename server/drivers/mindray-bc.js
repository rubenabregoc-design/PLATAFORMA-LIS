/**
 * AbregoTech LIS — Driver: Mindray BC Series & BS Series
 * Protocol: ASTM E1381 / E1394
 */

export const mindrayBcDriver = {
  id: 'mindray-bc',
  name: 'Mindray BC/BS Series Driver',
  modelMatch: 'Mindray',
  manufacturer: 'Mindray Bio-Medical Electronics',
  protocol: 'ASTM_E1381',
  category: 'HEMATOLOGIA',
  defaultPort: 5104,
  ackDelayMs: 15, // Mindray buffers require ~15ms delay between ACK to avoid dropped packets

  // Outbound Order Strategy
  // Mindray chemistry and hematology accept MULTI_O_RECORDS cleanly without crash
  orderStrategy: 'MULTI_O_RECORDS',
  testPrefix: '^^^',
  barcodePrefix: '',
  repeatDelimiter: '\\',

  testMapping: {
    'WBC': 'Leucocitos',
    'RBC': 'Eritrocitos',
    'HGB': 'Hemoglobina',
    'HCT': 'Hematocrito',
    'MCV': 'VCM',
    'MCH': 'HCM',
    'MCHC': 'CHCM',
    'PLT': 'Plaquetas',
    'RDW-CV': 'RDW-CV',
    'RDW-SD': 'RDW-SD',
    'LYM%': 'Linfocitos %',
    'NEU%': 'Neutrófilos %',
    'MON%': 'Monocitos %',
    'EOS%': 'Eosinófilos %',
    'BAS%': 'Basófilos %'
  },

  flagMapping: {
    'H': 'ALTO',
    'L': 'BAJO',
    'R': 'SOSPECHOSO_ALARMA',
    '?': 'REVISAR_DILUCION'
  }
};
