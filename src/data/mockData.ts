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
  },
  {
    id: 'lab-biomedica',
    name: 'Red Biomédica Panamá',
    ruc: '890212-2-2021',
    dv: '15',
    plan: 'Enterprise',
    branches: [
      {
        id: 'branch-costa-del-este',
        tenantId: 'lab-biomedica',
        name: 'Sede Costa del Este',
        code: 'CDE-01',
        address: 'Town Center Costa del Este, Torre Médica II',
        phone: '+507 302-8800'
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
    id: 'usr-chief-1',
    tenantId: 'lab-san-jose',
    branchId: 'branch-via-espana',
    name: 'Lic. Carlos Castillo',
    email: 'carlos.castillo@labsanjose.com',
    role: 'lab_chief',
    licenseNumber: 'TM-3109-PA',
    password: '123456',
    pinCode: '3109',
    twoFactorEnabled: true
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
  },
  {
    id: 'usr-tech-lab-1',
    tenantId: 'lab-san-jose',
    branchId: 'branch-via-espana',
    name: 'Téc. Jorge Valdés',
    email: 'jorge.valdes@labsanjose.com',
    role: 'lab_tech',
    password: '123456',
    pinCode: '1234',
    twoFactorEnabled: false
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
    id: 'usr-doctor-ext-1',
    tenantId: 'lab-san-jose',
    name: 'Dr. Roberto Icaza',
    email: 'dr.icaza@consultoriospaitilla.com',
    role: 'ext_doctor',
    licenseNumber: 'MED-10492-PA',
    password: '123456',
    pinCode: '1049',
    twoFactorEnabled: true
  },
  {
    id: 'usr-patient-1',
    tenantId: 'lab-san-jose',
    name: 'Gabriela Pinzón',
    email: 'gaby.pinzon@gmail.com',
    role: 'patient',
    password: '123456',
    pinCode: '0000',
    twoFactorEnabled: false
  },
  {
    id: 'usr-superadmin',
    tenantId: 'lab-san-jose',
    name: 'Súper Admin AbregoTech',
    email: 'admin@abregotech.com',
    role: 'abregotech_admin',
    password: 'admin123',
    pinCode: '9999',
    twoFactorEnabled: true
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
  },
  {
    id: 'pat-002',
    tenantId: 'lab-san-jose',
    nationalId: '4-722-1920',
    idType: 'CEDULA',
    firstName: 'Ricardo Javier',
    lastName: 'Arosemena Ríos',
    dob: '1984-11-20',
    gender: 'M',
    phone: '+507 6450-1122',
    email: 'ricardo.arosemena@hotmail.com',
    address: 'David, Chiriquí, Barrio Bolívar',
    dataConsentLey81: true,
    consentDate: '2026-02-01'
  },
  {
    id: 'pat-003',
    tenantId: 'lab-san-jose',
    nationalId: 'PA-9920144',
    idType: 'PASAPORTE',
    firstName: 'John Anthony',
    lastName: 'Smith',
    dob: '1978-03-08',
    gender: 'M',
    phone: '+507 6901-3321',
    email: 'jsmith.panama@gmail.com',
    address: 'Bella Vista, Panamá',
    dataConsentLey81: true,
    consentDate: '2026-03-12'
  }
];

export const MOCK_TEST_CATALOG: TestCatalogItem[] = [
  {
    id: 'test-hemograma',
    tenantId: 'lab-san-jose',
    code: 'HEM-01',
    name: 'Hemograma Completo (CBC + Plaquetas)',
    category: 'HEMATOLOGIA',
    tubeType: 'EDTA_MORADO',
    price: 18.50,
    specimenType: 'Sangre Total con EDTA',
    tatHours: 2,
    astmMappingCode: 'SYSMEX_CBC',
    hl7MappingCode: 'CBC_PANEL',
    parameters: [
      { id: 'p-wbc', testId: 'test-hemograma', name: 'Leucocitos (WBC)', unit: 'x10^3/µL', astmParamCode: 'WBC', refMinMale: 4.5, refMaxMale: 11.0, refMinFemale: 4.5, refMaxFemale: 11.0, criticalMin: 2.0, criticalMax: 25.0 },
      { id: 'p-rbc', testId: 'test-hemograma', name: 'Eritrocitos (RBC)', unit: 'x10^6/µL', astmParamCode: 'RBC', refMinMale: 4.5, refMaxMale: 5.9, refMinFemale: 4.1, refMaxFemale: 5.1, criticalMin: 2.5, criticalMax: 6.5 },
      { id: 'p-hgb', testId: 'test-hemograma', name: 'Hemoglobina (HGB)', unit: 'g/dL', astmParamCode: 'HGB', refMinMale: 13.5, refMaxMale: 17.5, refMinFemale: 12.0, refMaxFemale: 15.5, criticalMin: 7.0, criticalMax: 20.0 },
      { id: 'p-hct', testId: 'test-hemograma', name: 'Hematocrito (HCT)', unit: '%', astmParamCode: 'HCT', refMinMale: 41.0, refMaxMale: 50.0, refMinFemale: 36.0, refMaxFemale: 46.0, criticalMin: 20.0, criticalMax: 60.0 },
      { id: 'p-plt', testId: 'test-hemograma', name: 'Plaquetas (PLT)', unit: 'x10^3/µL', astmParamCode: 'PLT', refMinMale: 150, refMaxMale: 450, refMinFemale: 150, refMaxFemale: 450, criticalMin: 50, criticalMax: 1000 }
    ]
  },
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
    astmMappingCode: 'GLU_101',
    hl7MappingCode: 'GLU_FAST',
    parameters: [
      { id: 'p-glu', testId: 'test-glucosa', name: 'Glucosa Basal', unit: 'mg/dL', astmParamCode: 'GLU', refMinMale: 70, refMaxMale: 99, refMinFemale: 70, refMaxFemale: 99, criticalMin: 40, criticalMax: 300 }
    ]
  },
  {
    id: 'test-lipidico',
    tenantId: 'lab-san-jose',
    code: 'QUI-02',
    name: 'Perfil Lipídico Completo',
    category: 'QUIMICA',
    tubeType: 'SUERO_ROJO',
    price: 32.00,
    specimenType: 'Suero',
    tatHours: 3,
    astmMappingCode: 'VITROS_LIPID',
    parameters: [
      { id: 'p-col', testId: 'test-lipidico', name: 'Colesterol Total', unit: 'mg/dL', astmParamCode: 'CHOL', refMinMale: 0, refMaxMale: 200, refMinFemale: 0, refMaxFemale: 200 },
      { id: 'p-trig', testId: 'test-lipidico', name: 'Triglicéridos', unit: 'mg/dL', astmParamCode: 'TRIG', refMinMale: 0, refMaxMale: 150, refMinFemale: 0, refMaxFemale: 150, criticalMax: 500 },
      { id: 'p-hdl', testId: 'test-lipidico', name: 'Colesterol HDL (Bueno)', unit: 'mg/dL', astmParamCode: 'HDL', refMinMale: 40, refMaxMale: 80, refMinFemale: 50, refMaxFemale: 80 },
      { id: 'p-ldl', testId: 'test-lipidico', name: 'Colesterol LDL (Malo)', unit: 'mg/dL', astmParamCode: 'LDL', refMinMale: 0, refMaxMale: 100, refMinFemale: 0, refMaxFemale: 100 }
    ]
  },
  {
    id: 'test-tsh',
    tenantId: 'lab-san-jose',
    code: 'INM-01',
    name: 'Hormona Estimulante de Tiroides (TSH Ultra)',
    category: 'INMUNOLOGIA',
    tubeType: 'SUERO_ROJO',
    price: 25.00,
    specimenType: 'Suero',
    tatHours: 4,
    astmMappingCode: 'TSH_IMMUNO',
    parameters: [
      { id: 'p-tsh', testId: 'test-tsh', name: 'TSH Ultrasensible', unit: 'µIU/mL', astmParamCode: 'TSH', refMinMale: 0.45, refMaxMale: 4.5, refMinFemale: 0.45, refMaxFemale: 4.5 }
    ]
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
    doctorId: 'usr-doctor-ext-1',
    doctorName: 'Dr. Roberto Icaza',
    priority: 'RUTINA',
    status: 'VALIDADA_MED',
    createdAt: '2026-08-10T07:30:00Z',
    totalAmount: 50.50,
    paymentStatus: 'PAGADO',
    insuranceName: 'ASSA Cía de Seguros',
    specimens: [
      { id: 'sp-01', orderId: 'ord-1001', barcode: 'BC-882001', tubeType: 'EDTA_MORADO', collectedAt: '2026-08-10T07:45:00Z', collectedBy: 'Jorge Valdés', status: 'EN_ANALIZADOR' },
      { id: 'sp-02', orderId: 'ord-1001', barcode: 'BC-882002', tubeType: 'SUERO_ROJO', collectedAt: '2026-08-10T07:45:00Z', collectedBy: 'Jorge Valdés', status: 'EN_ANALIZADOR' }
    ],
    testIds: ['test-hemograma', 'test-lipidico']
  },
  {
    id: 'ord-1002',
    tenantId: 'lab-san-jose',
    branchId: 'branch-via-espana',
    orderNumber: 'ORD-2026-00102',
    patientId: 'pat-002',
    patientName: 'Ricardo Javier Arosemena Ríos',
    patientNationalId: '4-722-1920',
    patientGender: 'M',
    patientAge: 41,
    priority: 'STAT',
    status: 'EN_PROCESO',
    createdAt: '2026-08-10T09:15:00Z',
    totalAmount: 26.50,
    paymentStatus: 'PAGADO',
    specimens: [
      { id: 'sp-03', orderId: 'ord-1002', barcode: 'BC-882003', tubeType: 'EDTA_MORADO', collectedAt: '2026-08-10T09:20:00Z', collectedBy: 'Jorge Valdés', status: 'EN_ANALIZADOR' },
      { id: 'sp-04', orderId: 'ord-1002', barcode: 'BC-882004', tubeType: 'SUERO_ROJO', collectedAt: '2026-08-10T09:20:00Z', collectedBy: 'Jorge Valdés', status: 'EN_ANALIZADOR' }
    ],
    testIds: ['test-hemograma', 'test-glucosa']
  }
];

export const MOCK_RESULTS: TestResult[] = [
  // Ord 1001 Results
  { id: 'res-1', tenantId: 'lab-san-jose', orderId: 'ord-1001', testId: 'test-hemograma', parameterId: 'p-wbc', parameterName: 'Leucocitos (WBC)', unit: 'x10^3/µL', value: '7.2', numericValue: 7.2, flag: 'NORMAL', refRangeText: '4.5 - 11.0', source: 'MIDDLEWARE_ASTM', analyzerName: 'Sysmex XN-1000', technicalValidatedBy: 'Lic. Sofía Guardia', technicalValidatedAt: '2026-08-10T08:30:00Z', medicalValidatedBy: 'Lic. Carlos Castillo', medicalValidatedAt: '2026-08-10T08:45:00Z', status: 'VALIDADO_MED' },
  { id: 'res-2', tenantId: 'lab-san-jose', orderId: 'ord-1001', testId: 'test-hemograma', parameterId: 'p-hgb', parameterName: 'Hemoglobina (HGB)', unit: 'g/dL', value: '13.8', numericValue: 13.8, flag: 'NORMAL', refRangeText: '12.0 - 15.5', source: 'MIDDLEWARE_ASTM', analyzerName: 'Sysmex XN-1000', technicalValidatedBy: 'Lic. Sofía Guardia', technicalValidatedAt: '2026-08-10T08:30:00Z', medicalValidatedBy: 'Lic. Carlos Castillo', medicalValidatedAt: '2026-08-10T08:45:00Z', status: 'VALIDADO_MED' },
  { id: 'res-3', tenantId: 'lab-san-jose', orderId: 'ord-1001', testId: 'test-lipidico', parameterId: 'p-col', parameterName: 'Colesterol Total', unit: 'mg/dL', value: '235', numericValue: 235, flag: 'ALTO', refRangeText: '< 200', source: 'MIDDLEWARE_ASTM', analyzerName: 'Ortho Vitros 4600', technicalValidatedBy: 'Lic. Sofía Guardia', technicalValidatedAt: '2026-08-10T08:32:00Z', medicalValidatedBy: 'Lic. Carlos Castillo', medicalValidatedAt: '2026-08-10T08:45:00Z', status: 'VALIDADO_MED' },

  // Ord 1002 Results (STAT - In Progress)
  { id: 'res-4', tenantId: 'lab-san-jose', orderId: 'ord-1002', testId: 'test-glucosa', parameterId: 'p-glu', parameterName: 'Glucosa Basal', unit: 'mg/dL', value: '340', numericValue: 340, flag: 'CRITICO_ALTO', refRangeText: '70 - 99', source: 'MIDDLEWARE_ASTM', analyzerName: 'Ortho Vitros 4600', technicalValidatedBy: 'Lic. Sofía Guardia', technicalValidatedAt: '2026-08-10T09:35:00Z', status: 'VALIDADO_TEC' }
];

export const MOCK_ANALYZERS: Analyzer[] = [
  {
    id: 'an-sysmex-01',
    tenantId: 'lab-san-jose',
    branchId: 'branch-via-espana',
    name: 'Sysmex XN-1000',
    model: 'XN-1000 Hematology System',
    protocol: 'ASTM_E1381',
    connectionType: 'RS232_SERIAL',
    comPort: 'COM1 / ttyS0',
    status: 'ONLINE',
    lastPing: '2026-08-10T10:25:00Z',
    driverId: 'sysmex-xn'
  },
  {
    id: 'an-vitros-01',
    tenantId: 'lab-san-jose',
    branchId: 'branch-via-espana',
    name: 'Ortho Vitros 4600',
    model: 'Vitros 4600 Chemistry System',
    protocol: 'ASTM_E1381',
    connectionType: 'TCP_IP',
    ipAddress: '192.168.10.45',
    port: 5100,
    status: 'ONLINE',
    lastPing: '2026-08-10T10:27:10Z',
    driverId: 'ortho-vitros'
  },
  {
    id: 'an-mindray-01',
    tenantId: 'lab-san-jose',
    branchId: 'branch-via-espana',
    name: 'Mindray BC-5000',
    model: 'BC-5000 Auto Hematology Analyzer',
    protocol: 'HL7_V2',
    connectionType: 'TCP_IP',
    ipAddress: '192.168.10.48',
    port: 6000,
    status: 'ONLINE',
    lastPing: '2026-08-10T10:26:40Z',
    driverId: 'mindray-hl7'
  }
];

export const MOCK_MIDDLEWARE_LOGS: MiddlewareMessageLog[] = [
  {
    id: 'msg-001',
    tenantId: 'lab-san-jose',
    analyzerId: 'an-sysmex-01',
    analyzerName: 'Sysmex XN-1000',
    protocol: 'ASTM E1381 / E1394',
    direction: 'INBOUND',
    rawPayload: `H|\\^&|||Sysmex^XN-1000|||||||P|1|20260810092500\nP|1||||Arosemena^Ricardo||19841120|M\nO|1|BC-882003||^^^SYSMEX_CBC|R||20260810092200|||||N\nR|1|^^^WBC|8.4|10^3/uL|4.5-11.0|N||F||||20260810092400\nR|2|^^^HGB|14.2|g/dL|13.5-17.5|N||F||||20260810092400\nL|1|N`,
    parsedData: { sampleBarcode: 'BC-882003', orderMatched: 'ORD-2026-00102', parametersCount: 2 },
    status: 'PROCESADO',
    timestamp: '2026-08-10T09:25:05Z'
  },
  {
    id: 'msg-002',
    tenantId: 'lab-san-jose',
    analyzerId: 'an-vitros-01',
    analyzerName: 'Ortho Vitros 4600',
    protocol: 'ASTM E1381',
    direction: 'INBOUND',
    rawPayload: `H|\\^&|||VITROS^4600|||||||P|1|20260810093400\nP|1||||Arosemena^Ricardo\nO|1|BC-882004||^^^GLU_101|R||20260810093000\nR|1|^^^GLU|340|mg/dL|70-99|HH||F||||20260810093400\nL|1|N`,
    parsedData: { sampleBarcode: 'BC-882004', orderMatched: 'ORD-2026-00102', test: 'Glucosa', value: 340, criticalFlag: 'CRITICO_ALTO' },
    status: 'PROCESADO',
    timestamp: '2026-08-10T09:34:12Z'
  }
];

export const MOCK_WESTGARD_QC: WestgardQCControl[] = [
  {
    id: 'qc-glu-lvl1',
    tenantId: 'lab-san-jose',
    analyzerId: 'an-vitros-01',
    testName: 'Glucosa Control Nivel 1 (Normal)',
    lotNumber: 'LOT-GLU-2026A',
    targetMean: 95,
    standardDeviation: 3,
    runs: [
      { id: 'r-1', date: '08-01', value: 94.5, status: 'PASS' },
      { id: 'r-2', date: '08-02', value: 96.0, status: 'PASS' },
      { id: 'r-3', date: '08-03', value: 95.2, status: 'PASS' },
      { id: 'r-4', date: '08-04', value: 92.0, status: 'PASS' },
      { id: 'r-5', date: '08-05', value: 98.2, status: 'PASS' },
      { id: 'r-6', date: '08-06', value: 101.8, violation: '1-2s (Advertencia +2SD)', status: 'WARN' },
      { id: 'r-7', date: '08-07', value: 94.8, status: 'PASS' },
      { id: 'r-8', date: '08-08', value: 95.1, status: 'PASS' },
      { id: 'r-9', date: '08-09', value: 105.2, violation: '1-3s (RECHAZO ALARMA >3SD)', status: 'FAIL' },
      { id: 'r-10', date: '08-10', value: 95.0, status: 'PASS' }
    ]
  }
];

export const MOCK_REAGENTS: ReagentInventory[] = [
  {
    id: 'reag-01',
    tenantId: 'lab-san-jose',
    name: 'Sysmex Cellpack DCL Diluent',
    code: 'SYS-DCL-20L',
    lotNumber: 'L2026-0881',
    expirationDate: '2026-12-31',
    quantityRemaining: 18,
    unit: 'Bidones (20L)',
    testsPerUnit: 500,
    minAlertThreshold: 5,
    associatedTest: 'Hemograma Completo'
  },
  {
    id: 'reag-02',
    tenantId: 'lab-san-jose',
    name: 'Vitros MicroSlide Glucose GLU',
    code: 'VIT-GLU-600',
    lotNumber: 'V99120-X',
    expirationDate: '2026-09-15',
    quantityRemaining: 4,
    unit: 'Cajas (600 slides)',
    testsPerUnit: 600,
    minAlertThreshold: 6,
    associatedTest: 'Glucosa en Ayunas'
  }
];

export const MOCK_ANALYZER_MAPPINGS: AnalyzerTestMapping[] = [
  {
    id: 'map-01',
    tenantId: 'lab-san-jose',
    analyzerId: 'an-vitros-01',
    analyzerName: 'Ortho Vitros 4600',
    lisTestCode: 'GLU',
    lisTestName: 'Glucosa Basal',
    astmAnalyzerCode: 'Glu-Hexo-123',
    sampleType: 'Suero',
    multiplierFactor: 1.0,
    unit: 'mg/dL',
    referenceRanges: [
      { id: 'rr-glu-1', gender: 'Ambos', minAgeYears: 0, maxAgeYears: 12, minValue: 60, maxValue: 100, panicLowValue: 45, panicHighValue: 300, unit: 'mg/dL', interpretation: 'Pediátrico (0-12 años)' },
      { id: 'rr-glu-2', gender: 'Ambos', minAgeYears: 13, maxAgeYears: 120, minValue: 70, maxValue: 99, panicLowValue: 50, panicHighValue: 400, unit: 'mg/dL', interpretation: 'Adultos en Ayunas (Normoglicemia)' }
    ],
    isActive: true,
    notes: 'Homologado según Manual Ortho Vitros v4.2 - Método Hexoquinasa',
    updatedAt: '2026-08-10T11:00:00Z',
    updatedBy: 'Súper-Admin AbregoTech'
  },
  {
    id: 'map-02',
    tenantId: 'lab-san-jose',
    analyzerId: 'an-vitros-01',
    analyzerName: 'Ortho Vitros 4600',
    lisTestCode: 'CREA',
    lisTestName: 'Creatinina Sérica',
    astmAnalyzerCode: 'Crea-Jaffe-456',
    sampleType: 'Suero',
    multiplierFactor: 1.0,
    unit: 'mg/dL',
    referenceRanges: [
      { id: 'rr-crea-m', gender: 'Masculino', minAgeYears: 18, maxAgeYears: 120, minValue: 0.74, maxValue: 1.35, panicLowValue: 0.30, panicHighValue: 5.00, unit: 'mg/dL', interpretation: 'Adulto Masculino' },
      { id: 'rr-crea-f', gender: 'Femenino', minAgeYears: 18, maxAgeYears: 120, minValue: 0.59, maxValue: 1.04, panicLowValue: 0.30, panicHighValue: 4.50, unit: 'mg/dL', interpretation: 'Adulto Femenino' }
    ],
    isActive: true,
    notes: 'Homologación de Método Jaffé cinético',
    updatedAt: '2026-08-10T11:05:00Z',
    updatedBy: 'Súper-Admin AbregoTech'
  },
  {
    id: 'map-03',
    tenantId: 'lab-san-jose',
    analyzerId: 'an-vitros-01',
    analyzerName: 'Ortho Vitros 4600',
    lisTestCode: 'CHOL',
    lisTestName: 'Colesterol Total',
    astmAnalyzerCode: 'Chol-Enz-789',
    sampleType: 'Suero',
    multiplierFactor: 1.0,
    unit: 'mg/dL',
    referenceRanges: [
      { id: 'rr-chol-1', gender: 'Ambos', minAgeYears: 0, maxAgeYears: 120, minValue: 120, maxValue: 200, panicHighValue: 300, unit: 'mg/dL', interpretation: 'Deseable <200 mg/dL (NCEP ATPIII)' }
    ],
    isActive: true,
    notes: 'Prueba enzimatica CHOD-PAP',
    updatedAt: '2026-08-10T11:10:00Z',
    updatedBy: 'Súper-Admin AbregoTech'
  },
  {
    id: 'map-04',
    tenantId: 'lab-san-jose',
    analyzerId: 'an-sysmex-01',
    analyzerName: 'Sysmex XN-1000',
    lisTestCode: 'WBC',
    lisTestName: 'Leucocitos Totales',
    astmAnalyzerCode: 'Sys-WBC-001',
    sampleType: 'Sangre Total EDTA',
    multiplierFactor: 1.0,
    unit: 'x10^3/µL',
    referenceRanges: [
      { id: 'rr-wbc-1', gender: 'Ambos', minAgeYears: 0, maxAgeYears: 120, minValue: 4.5, maxValue: 11.0, panicLowValue: 2.0, panicHighValue: 30.0, unit: 'x10^3/µL', interpretation: 'Rango General Hematología' }
    ],
    isActive: true,
    notes: 'Manual Sysmex XN ASTM E1394 Sec. 4.1',
    updatedAt: '2026-08-10T10:30:00Z',
    updatedBy: 'Súper-Admin AbregoTech'
  },
  {
    id: 'map-05',
    tenantId: 'lab-san-jose',
    analyzerId: 'an-sysmex-01',
    analyzerName: 'Sysmex XN-1000',
    lisTestCode: 'HGB',
    lisTestName: 'Hemoglobina',
    astmAnalyzerCode: 'Sys-HGB-002',
    sampleType: 'Sangre Total EDTA',
    multiplierFactor: 1.0,
    unit: 'g/dL',
    referenceRanges: [
      { id: 'rr-hgb-m', gender: 'Masculino', minAgeYears: 18, maxAgeYears: 120, minValue: 13.8, maxValue: 17.2, panicLowValue: 7.0, panicHighValue: 20.0, unit: 'g/dL', interpretation: 'Varones Adultos' },
      { id: 'rr-hgb-f', gender: 'Femenino', minAgeYears: 18, maxAgeYears: 120, minValue: 12.1, maxValue: 15.1, panicLowValue: 7.0, panicHighValue: 19.0, unit: 'g/dL', interpretation: 'Mujeres Adultas' }
    ],
    isActive: true,
    notes: 'Método SLS-Hemoglobina sin cianuro',
    updatedAt: '2026-08-10T10:32:00Z',
    updatedBy: 'Súper-Admin AbregoTech'
  },
  {
    id: 'map-06',
    tenantId: 'lab-san-jose',
    analyzerId: 'an-mindray-01',
    analyzerName: 'Mindray BC-5000',
    lisTestCode: 'PLT',
    lisTestName: 'Plaquetas',
    astmAnalyzerCode: 'BC5000-PLT',
    sampleType: 'Sangre Total EDTA',
    multiplierFactor: 1.0,
    unit: 'x10^3/µL',
    referenceRanges: [
      { id: 'rr-plt-1', gender: 'Ambos', minAgeYears: 0, maxAgeYears: 120, minValue: 150, maxValue: 450, panicLowValue: 50, panicHighValue: 1000, unit: 'x10^3/µL', interpretation: 'Plaquetas Recuento Normal' }
    ],
    isActive: true,
    notes: 'Trama HL7 OBX-3 segmento PLT',
    updatedAt: '2026-08-10T11:20:00Z',
    updatedBy: 'Súper-Admin AbregoTech'
  }
];
