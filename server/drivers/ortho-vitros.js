/**
 * AbregoTech LIS — Driver: Ortho Clinical Diagnostics Vitros Series (4600, 5600, 350, ECi)
 * Protocol: ASTM E1381 / E1394
 */

export const orthoVitrosDriver = {
  id: 'ortho-vitros',
  name: 'Ortho Vitros Series Driver',
  modelMatch: 'Vitros',
  manufacturer: 'Ortho Clinical Diagnostics',
  protocol: 'ASTM_E1381',
  category: 'QUIMICA',
  defaultPort: 5101,
  ackDelayMs: 20,

  // Outbound Order Strategy
  // Vitros accepts standard ASTM single O-record with repeat delimiter
  orderStrategy: 'SINGLE_O_REPEAT',
  testPrefix: '^^^',
  barcodePrefix: '^',
  repeatDelimiter: '\\',

  testMapping: {
    'GLU': 'GLUCOSA',
    'BUN': 'BUN',
    'CREA': 'CREATININA',
    'NA': 'SODIO',
    'K': 'POTASIO',
    'CL': 'CLORO',
    'CA': 'CALCIO',
    'ALB': 'ALBUMINA',
    'TP': 'PROTEINAS_TOTALES',
    'CHOL': 'COLESTEROL_TOTAL',
    'TRIG': 'TRIGLICERIDOS'
  },

  flagMapping: {
    'HH': 'CRITICO_ALTO',
    'LL': 'CRITICO_BAJO',
    'H': 'ALTO',
    'L': 'BAJO',
    'HIL': 'INTERFERENCIA_HEMOLISIS_ICTERICIA_LIPEMIA'
  }
};
