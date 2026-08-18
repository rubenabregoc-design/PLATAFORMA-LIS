import { Tenant, User, Patient, Doctor, TestCatalogItem, Order, TestResult, Analyzer, MiddlewareMessageLog, WestgardQCControl, ReagentInventory, AnalyzerTestMapping, TestPackage } from '../types';

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
  },
  {
    id: 'usr-admin-1',
    tenantId: 'abregotech',
    name: 'Ing. Abrego (Súper-Admin)',
    email: 'admin@abregotech.com',
    role: 'abregotech_admin',
    password: 'admin',
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
    parameters: [
      { id: 'p-hem-wbc', testId: 'test-hemograma', code: 'WBC', name: 'Leucocitos (WBC)', unit: 'x10³/µL', astmParamCode: 'WBC' },
      { id: 'p-hem-rbc', testId: 'test-hemograma', code: 'RBC', name: 'Eritrocitos (RBC)', unit: 'x10⁶/µL', astmParamCode: 'RBC' },
      { id: 'p-hem-hgb', testId: 'test-hemograma', code: 'HGB', name: 'Hemoglobina (HGB)', unit: 'g/dL', astmParamCode: 'HGB' },
      { id: 'p-hem-hct', testId: 'test-hemograma', code: 'HCT', name: 'Hematocrito (HCT)', unit: '%', astmParamCode: 'HCT' },
      { id: 'p-hem-mcv', testId: 'test-hemograma', code: 'VCM', name: 'VCM', unit: 'fL', astmParamCode: 'MCV' },
      { id: 'p-hem-mch', testId: 'test-hemograma', code: 'HCM', name: 'HCM', unit: 'pg', astmParamCode: 'MCH' },
      { id: 'p-hem-mchc', testId: 'test-hemograma', code: 'MCHC', name: 'CHCM', unit: 'g/dL', astmParamCode: 'MCHC' },
      { id: 'p-hem-plt', testId: 'test-hemograma', code: 'PLT', name: 'Plaquetas (PLT)', unit: 'x10³/µL', astmParamCode: 'PLT' }
    ]
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
    parameters: [
      { id: 'p-grp-abo', testId: 'test-grupo', name: 'Grupo ABO', unit: '', astmParamCode: 'GRP_ABO' },
      { id: 'p-grp-rh', testId: 'test-grupo', name: 'Factor Rh', unit: '', astmParamCode: 'GRP_RH' }
    ]
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
    parameters: [
      { id: 'p-glu', testId: 'test-glucosa', code: '4531', name: 'Glucosa en Ayunas', unit: 'mg/dL', astmParamCode: 'GLU' }
    ]
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
    parameters: [
      { id: 'p-crea', testId: 'test-creatinina', code: '4612', name: 'Creatinina Sérica', unit: 'mg/dL', astmParamCode: 'CREA' }
    ]
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
    parameters: [
      { id: 'p-col', testId: 'test-lipidico', code: '4657', name: 'Colesterol Total', unit: 'mg/dL', astmParamCode: 'COL' },
      { id: 'p-hdl', testId: 'test-lipidico', code: '4658', name: 'HDL Colesterol', unit: 'mg/dL', astmParamCode: 'HDL' },
      { id: 'p-ldl', testId: 'test-lipidico', code: '4659', name: 'LDL Colesterol', unit: 'mg/dL', astmParamCode: 'LDL' },
      { id: 'p-tri', testId: 'test-lipidico', code: '4660', name: 'Triglicéridos', unit: 'mg/dL', astmParamCode: 'TRI' }
    ]
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
    parameters: [
      { id: 'p-uri-color', testId: 'test-uri', code: 'COL', name: 'Color', unit: '', astmParamCode: 'COLOR' },
      { id: 'p-uri-aspecto', testId: 'test-uri', code: 'ASP', name: 'Aspecto', unit: '', astmParamCode: 'ASPECTO' },
      { id: 'p-uri-densidad', testId: 'test-uri', code: 'DEN', name: 'Densidad', unit: '', astmParamCode: 'DENSITY' },
      { id: 'p-uri-ph', testId: 'test-uri', code: 'PH', name: 'pH', unit: '', astmParamCode: 'PH' },
      { id: 'p-uri-glucosa', testId: 'test-uri', code: 'GLU', name: 'Glucosa', unit: 'mg/dL', astmParamCode: 'GLU' },
      { id: 'p-uri-proteinas', testId: 'test-uri', code: 'PRO', name: 'Proteínas', unit: 'mg/dL', astmParamCode: 'PRO' },
      { id: 'p-uri-cetonas', testId: 'test-uri', code: 'KET', name: 'Cetonas', unit: 'mg/dL', astmParamCode: 'KET' },
      { id: 'p-uri-bilirrubina', testId: 'test-uri', code: 'BIL', name: 'Bilirrubina', unit: 'mg/dL', astmParamCode: 'BIL' },
      { id: 'p-uri-sangre', testId: 'test-uri', code: 'SAN', name: 'Sangre Oculta', unit: '', astmParamCode: 'BLO' },
      { id: 'p-uri-leucocitos', testId: 'test-uri', code: 'LEU', name: 'Esterasa Leucocitaria', unit: 'leu/uL', astmParamCode: 'LEU' },
      { id: 'p-uri-nitritos', testId: 'test-uri', code: 'NIT', name: 'Nitritos', unit: '', astmParamCode: 'NIT' }
    ]
  },

  // 5. COPROLOGÍA (HECES)
  {
    id: 'test-heces',
    tenantId: 'lab-san-jose',
    code: 'COP-01',
    name: 'Examen General de Heces',
    category: 'URINALISIS', // Reutilizando para el demo
    tubeType: 'ORINA', // Asumiendo contenedor estéril
    price: 10.00,
    specimenType: 'Heces',
    tatHours: 2,
    parameters: []
  },

  // 6. COAGULACIÓN
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

export const MOCK_TEST_PACKAGES: TestPackage[] = [
  {
    id: 'pkg-prenatal-01',
    tenantId: 'lab-san-jose',
    code: 'PKG-PRE-01',
    name: 'Perfil Prenatal Básico',
    description: 'Control inicial de embarazo: Hemograma, Glucosa, VDRL, HIV, Grupo y Factor.',
    testIds: ['test-hemograma', 'test-glucosa', 'test-vdrl', 'test-hiv', 'test-grupo'],
    price: 85.00,
    category: 'PRENATAL'
  },
  {
    id: 'pkg-lipidos-01',
    tenantId: 'lab-san-jose',
    code: 'PERF-LIP',
    name: 'Perfil de Lípidos',
    description: 'Colesterol Total, HDL, LDL, VLDL y Triglicéridos.',
    testIds: ['test-lipidico'],
    price: 35.00,
    category: 'PERFIL'
  },
  {
    id: 'pkg-ejecutivo-01',
    tenantId: 'lab-san-jose',
    code: 'PKG-EXE-01',
    name: 'Chequeo Ejecutivo Hombre',
    description: 'Hemograma, Perfil Lipídico, Hepático, Creatinina, Ácido Úrico, Glucosa.',
    testIds: ['test-hemograma', 'test-lipidico', 'test-hepatico', 'test-creatinina', 'test-acido-urico', 'test-glucosa'],
    price: 120.00,
    category: 'CHECKUP'
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
    testIds: ['test-hemograma', 'test-lipidico'],
    expandedTestIds: ['test-hemograma', 'test-lipidico']
  },
  {
    id: 'ord-1003',
    tenantId: 'lab-san-jose',
    branchId: 'branch-via-espana',
    orderNumber: 'ORD-2026-00105',
    patientId: 'pat-002',
    patientName: 'Ríos, Gonzalo A.',
    patientNationalId: '4-772-1102',
    patientGender: 'M',
    patientAge: 45,
    priority: 'URGENTE',
    status: 'TOMADA',
    createdAt: new Date().toISOString(),
    totalAmount: 25.00,
    paymentStatus: 'PAGADO',
    specimens: [],
    testIds: ['test-glucosa', 'test-creatinina'],
    expandedTestIds: ['test-glucosa', 'test-creatinina']
  },
  {
    id: 'ord-1004',
    tenantId: 'lab-san-jose',
    branchId: 'branch-via-espana',
    orderNumber: 'ORD-2026-00108',
    patientId: 'pat-003',
    patientName: 'Vega, Lucía',
    patientNationalId: 'PE-102-990',
    patientGender: 'F',
    patientAge: 28,
    priority: 'STAT',
    status: 'EN_PROCESO',
    createdAt: new Date().toISOString(),
    totalAmount: 45.00,
    paymentStatus: 'PAGADO',
    specimens: [],
    testIds: ['test-hemograma'],
    expandedTestIds: ['test-hemograma']
  },
  {
    id: 'ord-1002',
    tenantId: 'lab-san-jose',
    branchId: 'branch-via-espana',
    orderNumber: 'ORD-2026-00050',
    patientId: 'pat-001',
    patientName: 'Gabriela Pinzón Varela',
    patientNationalId: '8-812-4432',
    patientGender: 'F',
    patientAge: 33,
    priority: 'RUTINA',
    status: 'COMPLETADA',
    createdAt: '2026-07-10T07:30:00Z',
    totalAmount: 18.50,
    paymentStatus: 'PAGADO',
    specimens: [],
    testIds: ['test-hemograma'],
    expandedTestIds: ['test-hemograma']
  }
];

export const MOCK_RESULTS: TestResult[] = [
  { id: 'res-old-1', tenantId: 'lab-san-jose', orderId: 'ord-1002', testId: 'test-hemograma', parameterId: 'p-wbc', parameterCode: 'HEM-01', parameterName: 'Leucocitos (WBC)', unit: 'x10^3/µL', value: '14.5', numericValue: 14.5, flag: 'ALTO', refRangeText: '4.5 - 11.0', source: 'MIDDLEWARE_ASTM', status: 'VALIDADO_MED', specimenType: 'Sangre Total' },
  { id: 'res-4', tenantId: 'lab-san-jose', orderId: 'ord-1003', testId: 'test-glucosa', parameterId: 'p-glu', parameterCode: 'QUI-01', parameterName: 'Glucosa en Ayunas', unit: 'mg/dL', value: '112', numericValue: 112, flag: 'ALTO', refRangeText: '70 - 100', source: 'MIDDLEWARE_ASTM', status: 'INGRESADO', specimenType: 'Suero' },
  { id: 'res-5', tenantId: 'lab-san-jose', orderId: 'ord-1004', testId: 'test-hemograma', parameterId: 'p-wbc', parameterCode: 'HEM-01', parameterName: 'Leucocitos (WBC)', unit: 'x10^3/µL', value: '12.8', numericValue: 12.8, flag: 'ALTO', refRangeText: '4.5 - 11.0', source: 'MIDDLEWARE_ASTM', status: 'PRELIMINAR', specimenType: 'Sangre Total' },
  { id: 'res-1', tenantId: 'lab-san-jose', orderId: 'ord-1001', testId: 'test-hemograma', parameterId: 'p-wbc', parameterCode: 'HEM-01', parameterName: 'Leucocitos (WBC)', unit: 'x10^3/µL', value: '7.2', numericValue: 7.2, flag: 'NORMAL', refRangeText: '4.5 - 11.0', source: 'MIDDLEWARE_ASTM', status: 'VALIDADO_MED', specimenType: 'Sangre Total', interpretation: 'Valores dentro de la normalidad clínica.' },
  { id: 'res-2', tenantId: 'lab-san-jose', orderId: 'ord-1001', testId: 'test-hemograma', parameterId: 'p-hgb', parameterCode: 'HEM-01', parameterName: 'Hemoglobina (HGB)', unit: 'g/dL', value: '13.8', numericValue: 13.8, flag: 'NORMAL', refRangeText: '12.0 - 15.5', source: 'MIDDLEWARE_ASTM', status: 'VALIDADO_MED', specimenType: 'Sangre Total' },
  { id: 'res-3', tenantId: 'lab-san-jose', orderId: 'ord-1001', testId: 'test-lipidico', parameterId: 'p-col', parameterCode: 'QUI-03', parameterName: 'Colesterol Total', unit: 'mg/dL', value: '235', numericValue: 235, flag: 'ALTO', refRangeText: '< 200', source: 'MIDDLEWARE_ASTM', status: 'VALIDADO_MED', specimenType: 'Suero', interpretation: 'Hipercolesterolemia leve detectada. Se sugiere control dietético.' }
];

export const MOCK_ANALYZERS: Analyzer[] = [
  { id: 'an-sysmex-01', tenantId: 'lab-san-jose', branchId: 'branch-via-espana', name: 'Sysmex XN-1000', model: 'XN-1000', protocol: 'ASTM_E1381', connectionType: 'RS232_SERIAL', status: 'ONLINE', lastPing: new Date().toISOString(), driverId: 'sysmex-xn' },
  { id: 'an-vitros-01', tenantId: 'lab-san-jose', branchId: 'branch-via-espana', name: 'Ortho Vitros 4600', model: 'Vitros 4600', protocol: 'ASTM_E1381', connectionType: 'TCP_IP', ipAddress: '192.168.10.45', port: 5100, status: 'ONLINE', lastPing: new Date().toISOString(), driverId: 'ortho-vitros' },
  { id: 'an-mindray-01', tenantId: 'lab-san-jose', branchId: 'branch-david', name: 'Mindray BC-5000', model: 'BC-5000', protocol: 'HL7_V2', connectionType: 'TCP_IP', ipAddress: '192.168.11.22', port: 6000, status: 'OFFLINE', lastPing: '2026-08-10T22:00:00Z', driverId: 'mindray-bc5k' }
];

export const MOCK_DOCTORS: Doctor[] = [
  {
    id: 'doc-001',
    tenantId: 'lab-san-jose',
    name: 'Dr. Roberto Arango',
    specialty: 'Medicina General',
    licenseNumber: '7821-PA',
    clinic: 'Clínica San Fernando',
    email: 'r.arango@clinica.com'
  },
  {
    id: 'doc-002',
    tenantId: 'lab-san-jose',
    name: 'Dra. Liseth Moreno',
    specialty: 'Ginecología',
    licenseNumber: '4490-PA',
    clinic: 'Centro Médico Paitilla',
    email: 'l.moreno@paitilla.com'
  },
  {
    id: 'doc-003',
    tenantId: 'lab-san-jose',
    name: 'Dr. Jaime Solís',
    specialty: 'Endocrinología',
    licenseNumber: '1102-PA',
    clinic: 'Hospital Punta Pacífica',
    email: 'j.solis@hospitals.com'
  }
];

export const MOCK_MIDDLEWARE_LOGS: MiddlewareMessageLog[] = [
  {
    id: 'msg-h-1',
    tenantId: 'lab-san-jose',
    analyzerId: 'an-sysmex-01',
    analyzerName: 'Sysmex XN-1000',
    protocol: 'ASTM E1381',
    direction: 'INBOUND',
    rawPayload: `H|\\^&|||Sysmex^XN-1000|||||||P|1\nP|1|||Pinzon^Gabriela\nO|1|BC-882001||^^^HEM|R||20260810103000\nR|1|^^^WBC|7.2|10^3/uL|4.5-11.0|N||F\nR|2|^^^HGB|13.8|g/dL|12.0-15.5|N||F\nL|1|N`,
    parsedData: { wbc: 7.2, hgb: 13.8, order: 'ORD-2026-00101' },
    status: 'PROCESADO',
    timestamp: '2026-08-10T10:30:15Z'
  },
  {
    id: 'msg-h-2',
    tenantId: 'lab-san-jose',
    analyzerId: 'an-vitros-01',
    analyzerName: 'Ortho Vitros 4600',
    protocol: 'ASTM E1394',
    direction: 'INBOUND',
    rawPayload: `H|\\^&|||VITROS^4600|||||||P|1\nP|1|||Arosemena^Ricardo\nO|1|BC-882004||^^^4531|R||20260810103500\nR|1|^^^4531|340|mg/dL|70-99|HH||F\nL|1|N`,
    parsedData: { glu: 340, order: 'ORD-2026-00102' },
    status: 'PROCESADO',
    timestamp: '2026-08-10T10:35:45Z'
  },
  {
    id: 'msg-h-3',
    tenantId: 'lab-san-jose',
    analyzerId: 'an-mindray-01',
    analyzerName: 'Mindray BC-5000',
    protocol: 'HL7 v2.3',
    direction: 'INBOUND',
    rawPayload: `MSH|^~\\&|MINDRAY|LAB01|LIS|ABREGOTECH|202608101100||ORU^R01|MSG001|P|2.3\nPID|1||8-812-4432||Pinzon^Gabriela\nOBR|1|ORD-001|BC-882001|HEM01\nOBX|1|NM|PLT^Plaquetas||240|10^3/uL|150-450|N|||F`,
    parsedData: { plt: 240 },
    status: 'ERROR_PARSER',
    errorMessage: 'Segment mismatch in OBX-5',
    timestamp: '2026-08-10T11:00:10Z'
  }
];
export const MOCK_WESTGARD_QC: WestgardQCControl[] = [
  {
    id: 'qc-gluc-1',
    tenantId: 'lab-san-jose',
    analyzerId: 'an-vitros-01',
    testName: 'Glucosa HK (Suero)',
    lotNumber: 'L-GLU2026-X',
    targetMean: 95.0,
    standardDeviation: 2.5,
    runs: [
      { id: 'r1', date: '01/08', value: 94.2, status: 'PASS' },
      { id: 'r2', date: '02/08', value: 96.8, status: 'PASS' },
      { id: 'r3', date: '03/08', value: 93.5, status: 'PASS' },
      { id: 'r4', date: '04/08', value: 101.5, violation: '1-2s', status: 'WARN' },
      { id: 'r5', date: '05/08', value: 94.8, status: 'PASS' },
      { id: 'r6', date: '06/08', value: 87.2, violation: '1-3s', status: 'FAIL' },
      { id: 'r7', date: '07/08', value: 95.2, status: 'PASS' },
      { id: 'r8', date: '08/08', value: 94.1, status: 'PASS' },
    ]
  },
  {
    id: 'qc-hem-1',
    tenantId: 'lab-san-jose',
    analyzerId: 'an-sysmex-01',
    testName: 'Hemoglobina (Level 2)',
    lotNumber: 'L-HGB88-B',
    targetMean: 13.5,
    standardDeviation: 0.3,
    runs: [
      { id: 'h1', date: '05/08', value: 13.4, status: 'PASS' },
      { id: 'h2', date: '06/08', value: 13.6, status: 'PASS' },
      { id: 'h3', date: '07/08', value: 13.8, violation: '1-2s', status: 'WARN' },
      { id: 'h4', date: '08/08', value: 13.5, status: 'PASS' },
    ]
  }
];

export const MOCK_REAGENTS: ReagentInventory[] = [
  { id: 're-1', tenantId: 'lab-san-jose', name: 'Glucosa HK Vitros', code: 'GLU-HK', lotNumber: 'LT992', expirationDate: '2026-12-01', quantityRemaining: 450, unit: 'Tests', testsPerUnit: 1, minAlertThreshold: 50, associatedTest: 'Glucosa en Ayunas' },
  { id: 're-2', tenantId: 'lab-san-jose', name: 'Diluente Sysmex', code: 'DIL-SYS', lotNumber: 'LT112', expirationDate: '2027-05-15', quantityRemaining: 15, unit: 'Litros', testsPerUnit: 50, minAlertThreshold: 20, associatedTest: 'Hemograma Completo' },
];

export const MOCK_ANALYZER_MAPPINGS: AnalyzerTestMapping[] = [];
