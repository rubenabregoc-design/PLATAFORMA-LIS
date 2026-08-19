import { Tenant, User, Patient, Doctor, TestCatalogItem, Order, TestResult, Analyzer, MiddlewareMessageLog, WestgardQCControl, ReagentInventory, AnalyzerTestMapping } from '../types';

export const MOCK_TENANTS: Tenant[] = [
  {
    id: 'lab-san-jose',
    name: 'Laboratorio Clínico San José',
    ruc: '1556983-1-82001',
    dv: '42',
    plan: 'Pro',
    branches: [
      {
        id: 'branch-via-espana',
        tenantId: 'lab-san-jose',
        name: 'Sede Vía España',
        code: 'VE-01',
        address: 'Edificio Galerías Vía España, Planta Baja',
        phone: '+507 264-5500'
      },
      {
        id: 'branch-david',
        tenantId: 'lab-san-jose',
        name: 'Sede Chiriquí (David)',
        code: 'CH-02',
        address: 'Calle 3ra Este, Frente a Plaza Terronal',
        phone: '+507 775-1290'
      }
    ]
  }
];

export const MOCK_USERS: User[] = [
  {
    id: 'usr-owner-1',
    tenantId: 'lab-san-jose',
    branchId: 'branch-via-espana',
    name: 'Dra. María Elena Abrego',
    email: 'maria.abrego@labsanjose.com',
    role: 'owner',
    licenseNumber: 'TM-4821-PA',
    password: '123456',
    pinCode: '4821',
    twoFactorEnabled: true
  },
  {
    id: 'usr-reception-1',
    tenantId: 'lab-san-jose',
    branchId: 'branch-via-espana',
    name: 'Ana Lucía Morales',
    email: 'ana.morales@labsanjose.com',
    role: 'receptionist',
    password: '123456',
    pinCode: '1234',
    twoFactorEnabled: false
  },
  {
    id: 'usr-tech-med-1',
    tenantId: 'lab-san-jose',
    branchId: 'branch-via-espana',
    name: 'Lic. Sofía Guardia',
    email: 'sofia.guardia@labsanjose.com',
    role: 'tech_med',
    licenseNumber: 'TM-5920-PA',
    password: '123456',
    pinCode: '5920',
    twoFactorEnabled: false
  }
];

export const MOCK_PATIENTS: Patient[] = [
  {
    id: 'pat-001',
    tenantId: 'lab-san-jose',
    nationalId: '8-812-4432',
    idType: 'CEDULA',
    firstName: 'Gabriela',
    lastName: 'Pinzón Varela',
    dob: '1992-05-14',
    gender: 'F',
    phone: '+507 6612-9988',
    email: 'gaby.pinzon@gmail.com',
    address: 'San Francisco, Calle 50, Edif. Torre Vega',
    dataConsentLey81: true,
    consentDate: '2026-01-10'
  }
];

export const MOCK_TEST_CATALOG: TestCatalogItem[] = [
  // 1. HEMATOLOGÍA
  {
    id: 'test-hemograma',
    tenantId: 'lab-san-jose',
    code: 'HEM-01',
    name: 'Hemograma Completo',
    category: 'HEMATOLOGIA',
    tubeType: 'EDTA_MORADO',
    price: 18.50,
    specimenType: 'Sangre Total',
    tatHours: 2,
    parameters: []
  },
  {
    id: 'test-vsg',
    tenantId: 'lab-san-jose',
    code: 'HEM-02',
    name: 'VSG (Eritrosedimentación)',
    category: 'HEMATOLOGIA',
    tubeType: 'EDTA_MORADO',
    price: 5.00,
    specimenType: 'Sangre Total',
    tatHours: 1,
    parameters: []
  },
  {
    id: 'test-retis',
    tenantId: 'lab-san-jose',
    code: 'HEM-03',
    name: 'Recuento de Reticulocitos',
    category: 'HEMATOLOGIA',
    tubeType: 'EDTA_MORADO',
    price: 12.00,
    specimenType: 'Sangre Total',
    tatHours: 4,
    parameters: []
  },
  {
    id: 'test-grupo',
    tenantId: 'lab-san-jose',
    code: 'HEM-04',
    name: 'Grupo Sanguíneo y Factor Rh',
    category: 'HEMATOLOGIA',
    tubeType: 'EDTA_MORADO',
    price: 10.00,
    specimenType: 'Sangre Total',
    tatHours: 1,
    parameters: []
  },

  // 2. QUÍMICA CLÍNICA
  {
    id: 'test-glucosa',
    tenantId: 'lab-san-jose',
    code: 'QUI-01',
    name: 'Glucosa en Ayunas',
    category: 'QUIMICA',
    tubeType: 'SUERO_ROJO',
    price: 8.00,
    specimenType: 'Suero',
    tatHours: 1,
    parameters: []
  },
  {
    id: 'test-creatinina',
    tenantId: 'lab-san-jose',
    code: 'QUI-02',
    name: 'Creatinina Sérica',
    category: 'QUIMICA',
    tubeType: 'SUERO_ROJO',
    price: 8.50,
    specimenType: 'Suero',
    tatHours: 1,
    parameters: []
  },
  {
    id: 'test-lipidico',
    tenantId: 'lab-san-jose',
    code: 'QUI-03',
    name: 'Perfil Lipídico Completo',
    category: 'QUIMICA',
    tubeType: 'SUERO_ROJO',
    price: 35.00,
    specimenType: 'Suero',
    tatHours: 3,
    parameters: []
  },
  {
    id: 'test-urea',
    tenantId: 'lab-san-jose',
    code: 'QUI-04',
    name: 'Nitrógeno de Urea (BUN)',
    category: 'QUIMICA',
    tubeType: 'SUERO_ROJO',
    price: 8.00,
    specimenType: 'Suero',
    tatHours: 1,
    parameters: []
  },
  {
    id: 'test-acido-urico',
    tenantId: 'lab-san-jose',
    code: 'QUI-05',
    name: 'Ácido Úrico',
    category: 'QUIMICA',
    tubeType: 'SUERO_ROJO',
    price: 8.00,
    specimenType: 'Suero',
    tatHours: 1,
    parameters: []
  },
  {
    id: 'test-hepatico',
    tenantId: 'lab-san-jose',
    code: 'QUI-06',
    name: 'Perfil Hepático',
    category: 'QUIMICA',
    tubeType: 'SUERO_ROJO',
    price: 45.00,
    specimenType: 'Suero',
    tatHours: 3,
    parameters: []
  },
  {
    id: 'test-electrolitos',
    tenantId: 'lab-san-jose',
    code: 'QUI-07',
    name: 'Electrolitos (Na, K, Cl)',
    category: 'QUIMICA',
    tubeType: 'SUERO_ROJO',
    price: 25.00,
    specimenType: 'Suero',
    tatHours: 1,
    parameters: []
  },

  // 3. INMUNOLOGÍA / ESPECIALES
  {
    id: 'test-tsh',
    tenantId: 'lab-san-jose',
    code: 'INM-01',
    name: 'TSH Ultrasensible',
    category: 'INMUNOLOGIA',
    tubeType: 'SUERO_ROJO',
    price: 25.00,
    specimenType: 'Suero',
    tatHours: 4,
    parameters: []
  },
  {
    id: 'test-hiv',
    tenantId: 'lab-san-jose',
    code: 'INM-02',
    name: 'HIV 1/2 Ag/Ab (4ta Gen)',
    category: 'INMUNOLOGIA',
    tubeType: 'SUERO_ROJO',
    price: 35.00,
    specimenType: 'Suero',
    tatHours: 4,
    parameters: []
  },
  {
    id: 'test-vdrl',
    tenantId: 'lab-san-jose',
    code: 'INM-03',
    name: 'VDRL / RPR (Sífilis)',
    category: 'INMUNOLOGIA',
    tubeType: 'SUERO_ROJO',
    price: 8.00,
    specimenType: 'Suero',
    tatHours: 2,
    parameters: []
  },
  {
    id: 'test-hcg',
    tenantId: 'lab-san-jose',
    code: 'INM-04',
    name: 'Prueba de Embarazo (hCG)',
    category: 'INMUNOLOGIA',
    tubeType: 'SUERO_ROJO',
    price: 15.00,
    specimenType: 'Suero/Orina',
    tatHours: 1,
    parameters: []
  },

  // 4. URANÁLISIS
  {
    id: 'test-uri',
    tenantId: 'lab-san-jose',
    code: 'URA-01',
    name: 'Urianálisis Completo',
    category: 'URINALISIS',
    tubeType: 'ORINA',
    price: 12.00,
    specimenType: 'Orina',
    tatHours: 2,
    parameters: []
  },

  // 5. COAGULACIÓN
  {
    id: 'test-pt',
    tenantId: 'lab-san-jose',
    code: 'COA-01',
    name: 'Tiempo de Protrombina (PT)',
    category: 'COAGULACION',
    tubeType: 'CITRATO_AZUL',
    price: 15.00,
    specimenType: 'Plasma Citratado',
    tatHours: 1,
    parameters: []
  },
  {
    id: 'test-ptt',
    tenantId: 'lab-san-jose',
    code: 'COA-02',
    name: 'Tiempo de Tromboplastina (PTT)',
    category: 'COAGULACION',
    tubeType: 'CITRATO_AZUL',
    price: 15.00,
    specimenType: 'Plasma Citratado',
    tatHours: 1,
    parameters: []
  },
  {
    id: 'test-fibrinogeno',
    tenantId: 'lab-san-jose',
    code: 'COA-03',
    name: 'Fibrinógeno',
    category: 'COAGULACION',
    tubeType: 'CITRATO_AZUL',
    price: 20.00,
    specimenType: 'Plasma Citratado',
    tatHours: 2,
    parameters: []
  }
];

export const MOCK_ORDERS: Order[] = [
  {
    id: 'ord-1001',
    tenantId: 'lab-san-jose',
    branchId: 'branch-via-espana',
    orderNumber: 'ORD-2026-00101',
    patientId: 'pat-001',
    patientName: 'Gabriela Pinzón Varela',
    patientNationalId: '8-812-4432',
    patientGender: 'F',
    patientAge: 33,
    priority: 'RUTINA',
    status: 'VALIDADA_MED',
    createdAt: '2026-08-10T07:30:00Z',
    totalAmount: 53.50,
    paymentStatus: 'PAGADO',
    specimens: [],
    testIds: ['test-hemograma', 'test-lipidico']
  }
];

export const MOCK_RESULTS: TestResult[] = [
  { id: 'res-1', tenantId: 'lab-san-jose', orderId: 'ord-1001', testId: 'test-hemograma', parameterId: 'p-wbc', parameterName: 'Leucocitos (WBC)', unit: 'x10^3/µL', value: '7.2', numericValue: 7.2, flag: 'NORMAL', refRangeText: '4.5 - 11.0', source: 'MIDDLEWARE_ASTM', status: 'VALIDADO_MED', specimenType: 'Sangre Total', interpretation: 'Valores dentro de la normalidad clínica.' },
  { id: 'res-2', tenantId: 'lab-san-jose', orderId: 'ord-1001', testId: 'test-hemograma', parameterId: 'p-hgb', parameterName: 'Hemoglobina (HGB)', unit: 'g/dL', value: '13.8', numericValue: 13.8, flag: 'NORMAL', refRangeText: '12.0 - 15.5', source: 'MIDDLEWARE_ASTM', status: 'VALIDADO_MED', specimenType: 'Sangre Total' },
  { id: 'res-3', tenantId: 'lab-san-jose', orderId: 'ord-1001', testId: 'test-lipidico', parameterId: 'p-col', parameterName: 'Colesterol Total', unit: 'mg/dL', value: '235', numericValue: 235, flag: 'ALTO', refRangeText: '< 200', source: 'MIDDLEWARE_ASTM', status: 'VALIDADO_MED', specimenType: 'Suero', interpretation: 'Hipercolesterolemia leve detectada. Se sugiere control dietético.' }
];

export const MOCK_ANALYZERS: Analyzer[] = [
  {
    id: 'an-sysmex-01',
    tenantId: 'lab-san-jose',
    branchId: 'branch-via-espana',
    name: 'Sysmex XN-1000',
    model: 'XN-1000 (5-Part Diff + Retics)',
    manufacturer: 'Sysmex Corporation',
    category: 'HEMATOLOGIA',
    protocol: 'ASTM_E1381',
    dialectName: 'ASTM E1394-97 / CLSI LIS01-A2',
    connectionType: 'RS232_SERIAL',
    comPort: 'COM1 (/dev/ttyUSB0)',
    baudRate: 9600,
    parity: 'None',
    dataBits: 8,
    stopBits: 1,
    flowControl: 'Hardware (RTS/CTS)',
    status: 'ONLINE',
    lastPing: '2026-08-18T20:40:00Z',
    pingLatencyMs: 4,
    driverId: 'sysmex-xn-series',
    totalProcessedToday: 142,
    errorCount: 0,
    bufferQueueCount: 0,
    autoValidationEnabled: true,
    hilInterferenceCheck: false,
    reflexRulesActive: 3
  },
  {
    id: 'an-vitros-01',
    tenantId: 'lab-san-jose',
    branchId: 'branch-via-espana',
    name: 'Ortho Vitros 4600',
    model: 'Vitros 4600 MicroSlide Chemistry',
    manufacturer: 'Ortho Clinical Diagnostics (QuidelOrtho)',
    category: 'QUIMICA',
    protocol: 'ASTM_E1381',
    dialectName: 'ASTM E1381-02 Host-Query TCP',
    connectionType: 'TCP_IP',
    ipAddress: '192.168.10.45',
    port: 5100,
    status: 'ONLINE',
    lastPing: '2026-08-18T20:41:15Z',
    pingLatencyMs: 8,
    driverId: 'ortho-vitros-4600',
    totalProcessedToday: 218,
    errorCount: 1,
    bufferQueueCount: 0,
    autoValidationEnabled: true,
    hilInterferenceCheck: true,
    reflexRulesActive: 5
  },
  {
    id: 'an-cobas-01',
    tenantId: 'lab-san-jose',
    branchId: 'branch-via-espana',
    name: 'Roche Cobas 6000 (c501/e601)',
    model: 'Cobas 6000 Clinical Chemistry & ECLIA',
    manufacturer: 'Roche Diagnostics',
    category: 'QUIMICA',
    protocol: 'HL7_V2',
    dialectName: 'HL7 v2.5 MLLP (ORU^R01 / OML^O21)',
    connectionType: 'TCP_IP',
    ipAddress: '192.168.10.50',
    port: 5200,
    status: 'ONLINE',
    lastPing: '2026-08-18T20:42:00Z',
    pingLatencyMs: 12,
    driverId: 'roche-cobas-6000',
    totalProcessedToday: 310,
    errorCount: 0,
    bufferQueueCount: 0,
    autoValidationEnabled: true,
    hilInterferenceCheck: true,
    reflexRulesActive: 7
  },
  {
    id: 'an-alinity-01',
    tenantId: 'lab-san-jose',
    branchId: 'branch-via-espana',
    name: 'Abbott Alinity ci-series',
    model: 'Alinity c (Chem) + Alinity i (Immuno)',
    manufacturer: 'Abbott Laboratories',
    category: 'INMUNOLOGIA',
    protocol: 'HL7_V2',
    dialectName: 'HL7 v2.5.1 MLLP Bidirectional Host-Query',
    connectionType: 'TCP_IP',
    ipAddress: '192.168.10.60',
    port: 2575,
    status: 'ONLINE',
    lastPing: '2026-08-18T20:39:45Z',
    pingLatencyMs: 15,
    driverId: 'abbott-alinity-ci',
    totalProcessedToday: 185,
    errorCount: 0,
    bufferQueueCount: 0,
    autoValidationEnabled: true,
    hilInterferenceCheck: true,
    reflexRulesActive: 4
  },
  {
    id: 'an-mindray-01',
    tenantId: 'lab-san-jose',
    branchId: 'branch-costa-del-este',
    name: 'Mindray BC-6800Plus',
    model: 'BC-6800Plus Auto Hematology Analyzer',
    manufacturer: 'Mindray Medical International',
    category: 'HEMATOLOGIA',
    protocol: 'HL7_V2',
    dialectName: 'HL7 v2.3.1 (ORU^R01 / QBP^Q11)',
    connectionType: 'TCP_IP',
    ipAddress: '192.168.10.70',
    port: 5300,
    status: 'ONLINE',
    lastPing: '2026-08-18T20:38:30Z',
    pingLatencyMs: 9,
    driverId: 'mindray-bc6800',
    totalProcessedToday: 96,
    errorCount: 0,
    bufferQueueCount: 0,
    autoValidationEnabled: true,
    hilInterferenceCheck: false,
    reflexRulesActive: 2
  },
  {
    id: 'an-stago-01',
    tenantId: 'lab-san-jose',
    branchId: 'branch-via-espana',
    name: 'Stago STA Compact Max',
    model: 'STA Compact Max Hemostasis Coagulation',
    manufacturer: 'Diagnostica Stago',
    category: 'COAGULACION',
    protocol: 'ASTM_E1381',
    dialectName: 'ASTM E1394-97 (PT/INR/APTT/Fibrinogen)',
    connectionType: 'RS232_SERIAL',
    comPort: 'COM3 (/dev/ttyUSB1)',
    baudRate: 19200,
    parity: 'None',
    dataBits: 8,
    stopBits: 1,
    flowControl: 'Hardware (RTS/CTS)',
    status: 'ONLINE',
    lastPing: '2026-08-18T20:41:00Z',
    pingLatencyMs: 5,
    driverId: 'stago-sta-compact',
    totalProcessedToday: 64,
    errorCount: 0,
    bufferQueueCount: 0,
    autoValidationEnabled: true,
    hilInterferenceCheck: true,
    reflexRulesActive: 2
  },
  {
    id: 'an-biorad-01',
    tenantId: 'lab-san-jose',
    branchId: 'branch-via-espana',
    name: 'Bio-Rad D-10 HPLC',
    model: 'D-10 Dual Program HPLC HbA1c',
    manufacturer: 'Bio-Rad Laboratories',
    category: 'ESPECIALES',
    protocol: 'ASTM_E1381',
    dialectName: 'ASTM E1381 HPLC Chromatogram Profile',
    connectionType: 'RS232_SERIAL',
    comPort: 'COM4 (/dev/ttyUSB2)',
    baudRate: 9600,
    parity: 'None',
    dataBits: 8,
    stopBits: 1,
    flowControl: 'None',
    status: 'ONLINE',
    lastPing: '2026-08-18T20:35:10Z',
    pingLatencyMs: 6,
    driverId: 'biorad-d10-hplc',
    totalProcessedToday: 42,
    errorCount: 0,
    bufferQueueCount: 0,
    autoValidationEnabled: true,
    hilInterferenceCheck: false,
    reflexRulesActive: 1
  }
];

export const MOCK_MIDDLEWARE_LOGS: MiddlewareMessageLog[] = [
  {
    id: 'msg-101',
    tenantId: 'lab-san-jose',
    analyzerId: 'an-vitros-01',
    analyzerName: 'Ortho Vitros 4600',
    protocol: 'ASTM E1381 / E1394',
    direction: 'INBOUND',
    frameType: 'STX_RECORD',
    checksumValid: true,
    executionTimeMs: 14,
    sampleBarcode: 'BC-882004',
    patientName: 'Arosemena, Ricardo',
    matchedOrderCode: 'ORD-2026-00102',
    autoValidated: false,
    hilFlags: ['HIL_OK (H: 12 mg/dL)'],
    rawPayload: '1H|\\^&|||VITROS^4600|||||||P|1|20260818203000\n2P|1||||Arosemena^Ricardo\n3O|1|BC-882004||^^^GLU_101|R||20260818202800\n4R|1|^^^GLU|340|mg/dL|70-99|HH||F||||20260818203000\n5L|1|N',
    hexDump: '02 31 48 7C 5C 5E 26 7C 7C 7C 56 49 54 52 4F 53 0D 03 44 32 0D 0A',
    parsedData: {
      sampleBarcode: 'BC-882004',
      orderMatched: 'ORD-2026-00102',
      testCode: 'GLU',
      value: 340,
      unit: 'mg/dL',
      flag: 'CRITICO_ALTO',
      interpretation: 'Glucosa crítica 340 mg/dL transmitida vía TCP 5100.'
    },
    status: 'PROCESADO',
    timestamp: '2026-08-18T20:30:00Z'
  },
  {
    id: 'msg-102',
    tenantId: 'lab-san-jose',
    analyzerId: 'an-sysmex-01',
    analyzerName: 'Sysmex XN-1000',
    protocol: 'ASTM E1381 / E1394',
    direction: 'INBOUND',
    frameType: 'STX_RECORD',
    checksumValid: true,
    executionTimeMs: 11,
    sampleBarcode: 'BC-882001',
    patientName: 'Pinzón, Gabriela',
    matchedOrderCode: 'ORD-2026-00101',
    autoValidated: true,
    rawPayload: '1H|\\^&|||Sysmex^XN-1000|||||||P|1|20260818203200\n2P|1||||Pinzon^Gabriela\n3O|1|BC-882001||^^^SYSMEX_CBC|R||20260818203100\n4R|1|^^^WBC|7.4|10^3/uL|4.5-11.0|N||F||||20260818203200\n5R|2|^^^HGB|14.0|g/dL|12.0-15.5|N||F||||20260818203200\n6L|1|N',
    hexDump: '02 31 48 7C 5C 5E 26 7C 7C 7C 53 79 73 6D 65 78 0D 03 37 45 0D 0A',
    parsedData: {
      sampleBarcode: 'BC-882001',
      orderMatched: 'ORD-2026-00101',
      wbc: 7.4,
      hgb: 14.0,
      status: 'Auto-verificado por reglas Westgard / Delta'
    },
    status: 'AUTO_VALIDADO',
    timestamp: '2026-08-18T20:32:00Z'
  },
  {
    id: 'msg-103',
    tenantId: 'lab-san-jose',
    analyzerId: 'an-cobas-01',
    analyzerName: 'Roche Cobas 6000',
    protocol: 'HL7 v2.5 (ORU^R01)',
    direction: 'INBOUND',
    frameType: 'MLLP_ORU',
    checksumValid: true,
    executionTimeMs: 18,
    sampleBarcode: 'BC-882005',
    patientName: 'Castillo, Esteban',
    matchedOrderCode: 'ORD-2026-00103',
    autoValidated: false,
    reflexTriggered: 'Reflex T4 Libre por TSH > 10.0 uIU/mL',
    rawPayload: 'MSH|^~\\&|COBAS_6000|ROCHE_LAB|LIS_CORE|ABREGOTECH|20260818203500||ORU^R01|MSG-9941|P|2.5\nPID|1||8-765-4321||Castillo^Esteban||19800312|M\nOBR|1|ORD-2026-00103|BC-882005|TSH_ECLIA^TSH Ultrasensible|||20260818203300\nOBX|1|NM|TSH^TSH Ultrasensible||14.8|uIU/mL|0.4-4.5|HH|||F\nNTE|1|L|Reflex de T4 Libre ordenado automáticamente por LIS-Core.',
    hexDump: '0B 4D 53 48 7C 5E 7E 5C 26 7C 43 4F 42 41 53 5F 36 30 30 30 1C 0D',
    parsedData: {
      sampleBarcode: 'BC-882005',
      orderMatched: 'ORD-2026-00103',
      tsh: 14.8,
      flag: 'CRITICO_ALTO',
      reflex: 'T4L_AUTO_ORDERED'
    },
    status: 'PROCESADO',
    timestamp: '2026-08-18T20:35:00Z'
  }
];
export const MOCK_WESTGARD_QC: WestgardQCControl[] = [];
export const MOCK_REAGENTS: ReagentInventory[] = [];
export const MOCK_ANALYZER_MAPPINGS: AnalyzerTestMapping[] = [];
