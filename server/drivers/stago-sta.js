/**
 * AbregoTech LIS — Driver: Stago STA Series (STA Compact, Max, Satellite)
 * Protocol: ASTM E1381 / E1394
 */

export const stagoStaDriver = {
  id: 'stago-sta',
  name: 'Stago STA Coagulation Driver',
  modelMatch: 'Stago',
  manufacturer: 'Diagnostica Stago',
  protocol: 'ASTM_E1381',
  category: 'COAGULACION',
  defaultPort: 5105,
  ackDelayMs: 50, // Stago internal microprocessor is timing-sensitive; requires 50ms ACK delay

  // Outbound Order Strategy
  // Stago does NOT use carets (^^^). It expects direct test acronyms.
  orderStrategy: 'MULTI_O_RECORDS',
  testPrefix: '', // No carets!
  barcodePrefix: '',
  repeatDelimiter: '\\',

  // Stago internal test code mapping to LIS
  testMapping: {
    'PT': 'TIEMPO_PROTROMBINA_TP',
    'TP': 'TIEMPO_PROTROMBINA_TP',
    'INR': 'INR',
    'APTT': 'TIEMPO_TROMBOPLASTINA_TTPA',
    'TTP': 'TIEMPO_TROMBOPLASTINA_TTPA',
    'FIB': 'FIBRINOGENO',
    'TT': 'TIEMPO_TROMBINA',
    'DD': 'DIMERO_D'
  },

  flagMapping: {
    'HH': 'CRITICO_ALTO',
    'LL': 'CRITICO_BAJO',
    'H': 'ALTO',
    'L': 'BAJO',
    'CLOT_ERROR': 'ERROR_COAGULO',
    'NO_COAG': 'NO_COAGULA'
  }
};
