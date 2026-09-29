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
  // ⚙️ Programador Senior & Súper Admin Principal (AbregoTech Systems)
  {
    id: 'usr-rabrego-1',
    tenantId: 'lab-san-jose',
    branchId: 'branch-via-espana',
    name: 'Ing. Rubén Ábrego',
    username: 'rabrego',
    email: 'rabrego@abregotech.com',
    role: 'abregotech_admin',
    licenseNumber: 'DEV-SR-2429',
    password: 'Manzana2429@@',
    pinCode: '2429',
    twoFactorEnabled: true
  },
  {
    id: 'usr-developer-1',
    tenantId: 'lab-san-jose',
    branchId: 'branch-via-espana',
    name: 'Equipo de Desarrollo / Lead Dev',
    username: 'developer',
    email: 'developer@abregotech.com',
    role: 'abregotech_admin',
    licenseNumber: 'DEV-LEAD-2026',
    password: 'DevLead2026!#',
    pinCode: '7391',
    twoFactorEnabled: true
  },
  {
    id: 'usr-admin-1',
    tenantId: 'lab-san-jose',
    branchId: 'branch-via-espana',
    name: 'Ing. Gabriel Abrego (AbregoTech Systems)',
    username: 'admin',
    email: 'admin@abregotech.com',
    role: 'abregotech_admin',
    password: 'AdminSys2026!#',
    pinCode: '8420',
    twoFactorEnabled: true
  },
  // 🔬 Jefe de Laboratorio / Director Médico
  {
    id: 'usr-chief-1',
    tenantId: 'lab-san-jose',
    branchId: 'branch-via-espana',
    name: 'Dr. Roberto Icaza Villalaz',
    username: 'ricaza',
    email: 'roberto.icaza@labsanjose.com',
    role: 'lab_chief',
    licenseNumber: 'TM-1840-PA',
    password: '123456',
    pinCode: '1840',
    twoFactorEnabled: true
  },
  // 🔬 Tecnólogos Médicos
  {
    id: 'usr-tech-med-1',
    tenantId: 'lab-san-jose',
    branchId: 'branch-via-espana',
    name: 'Lic. Sofía Guardia Franco',
    username: 'sguardia',
    email: 'sofia.guardia@labsanjose.com',
    role: 'tech_med',
    licenseNumber: 'TM-5920-PA',
    password: '123456',
    pinCode: '5920',
    twoFactorEnabled: false
  },
  {
    id: 'usr-tech-med-2',
    tenantId: 'lab-san-jose',
    branchId: 'branch-david',
    name: 'Lic. Carlos E. Mendoza',
    username: 'cmendoza',
    email: 'carlos.mendoza@labsanjose.com',
    role: 'tech_med',
    licenseNumber: 'TM-6140-PA',
    password: '123456',
    pinCode: '6140',
    twoFactorEnabled: false
  },
  // 🧪 Técnicos de Laboratorio / Flebotomistas
  {
    id: 'usr-lab-tech-1',
    tenantId: 'lab-san-jose',
    branchId: 'branch-via-espana',
    name: 'Téc. Pedro Luis Navarro',
    username: 'pnavarro',
    email: 'pedro.navarro@labsanjose.com',
    role: 'lab_tech',
    licenseNumber: 'TEC-3310-MINSA',
    password: '123456',
    pinCode: '3310',
    twoFactorEnabled: false
  },
  {
    id: 'usr-lab-tech-2',
    tenantId: 'lab-san-jose',
    branchId: 'branch-david',
    name: 'Téc. Carmen Rosa Castillo',
    username: 'ccastillo',
    email: 'carmen.castillo@labsanjose.com',
    role: 'lab_tech',
    licenseNumber: 'TEC-4180-MINSA',
    password: '123456',
    pinCode: '4180',
    twoFactorEnabled: false
  },
  // 💼 Dueño / Gerencia
  {
    id: 'usr-owner-1',
    tenantId: 'lab-san-jose',
    branchId: 'branch-via-espana',
    name: 'Dra. María Elena Abrego',
    username: 'mabrego',
    email: 'maria.abrego@labsanjose.com',
    role: 'owner',
    licenseNumber: 'TM-4821-PA',
    password: '123456',
    pinCode: '4821',
    twoFactorEnabled: true
  },
  // 💼 Recepcionista / Admisión POS
  {
    id: 'usr-reception-1',
    tenantId: 'lab-san-jose',
    branchId: 'branch-via-espana',
    name: 'Licda. Ana Lucía Morales',
    username: 'amorales',
    email: 'ana.morales@labsanjose.com',
    role: 'receptionist',
    password: 'ClaveClinica2026!',
    pinCode: '7182',
    twoFactorEnabled: false
  },
  // 🩺 Médico Referente
  {
    id: 'usr-ext-doctor-1',
    tenantId: 'lab-san-jose',
    branchId: 'branch-via-espana',
    name: 'Dr. Fernando Arosemena Boyd',
    username: 'farosemena',
    email: 'dr.arosemena@hospitalclinico.pa',
    role: 'ext_doctor',
    licenseNumber: 'M-9812-MINSA',
    password: '123456',
    pinCode: '9812',
    twoFactorEnabled: false
  },
  // 👤 Paciente
  {
    id: 'usr-patient-1',
    tenantId: 'lab-san-jose',
    branchId: 'branch-via-espana',
    name: 'Sr. Gonzalo A. Ríos',
    username: 'grios',
    email: 'gonzalo.rios@gmail.com',
    role: 'patient',
    password: '123456',
    pinCode: '4432',
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
  },
  {
    id: 'pat-002',
    tenantId: 'lab-san-jose',
    nationalId: '8-745-1290',
    idType: 'CEDULA',
    firstName: 'Ricardo',
    lastName: 'Arosemena Boyd',
    dob: '1984-11-22',
    gender: 'M',
    phone: '+507 6789-2211',
    email: 'ricardo.arosemena@hotmail.com',
    address: 'Costa del Este, Av. Centenario, PH Titanium',
    dataConsentLey81: true,
    consentDate: '2026-02-15'
  },
  {
    id: 'pat-003',
    tenantId: 'lab-san-jose',
    nationalId: '4-721-9088',
    idType: 'CEDULA',
    firstName: 'Esteban',
    lastName: 'Castillo Vega',
    dob: '1980-03-12',
    gender: 'M',
    phone: '+507 6554-3322',
    email: 'ecastillo.chiriqui@gmail.com',
    address: 'David, Chiriquí, Calle 4ta',
    dataConsentLey81: true,
    consentDate: '2026-03-01'
  },
  {
    id: 'pat-004',
    tenantId: 'lab-san-jose',
    nationalId: '8-910-3341',
    idType: 'CEDULA',
    firstName: 'Valeria',
    lastName: 'Morales Rios',
    dob: '1996-08-30',
    gender: 'F',
    phone: '+507 6223-1100',
    email: 'valeria.morales.r@outlook.com',
    address: 'El Cangrejo, Calle Eusebio Morales',
    dataConsentLey81: true,
    consentDate: '2026-04-12'
  },
  {
    id: 'pat-005',
    tenantId: 'lab-san-jose',
    nationalId: '3-709-1823',
    idType: 'CEDULA',
    firstName: 'Dionisio',
    lastName: 'Herrera Batista',
    dob: '1968-12-05',
    gender: 'M',
    phone: '+507 6901-4477',
    email: 'dionisio.herrera@gmail.com',
    address: 'Colón, Zona Libre, Calle 11',
    dataConsentLey81: true,
    consentDate: '2026-05-18'
  },
  {
    id: 'pat-006',
    tenantId: 'lab-san-jose',
    nationalId: '8-888-5120',
    idType: 'CEDULA',
    firstName: 'Lucía',
    lastName: 'Santana De León',
    dob: '1999-04-18',
    gender: 'F',
    phone: '+507 6332-9900',
    email: 'lucia.santana.dl@gmail.com',
    address: 'Clayton, Ciudad del Saber, Apto 402',
    dataConsentLey81: false, // For testing consent block
    consentDate: undefined
  },
  {
    id: 'pat-007',
    tenantId: 'lab-san-jose',
    nationalId: 'PE-982103',
    idType: 'PASAPORTE',
    firstName: 'Alejandro',
    lastName: 'Mendoza Silva',
    dob: '1975-09-09',
    gender: 'M',
    phone: '+507 6443-8811',
    email: 'alejandro.mendoza@latam.corp',
    address: 'Punta Pacífica, Calle Isaac Hanono',
    dataConsentLey81: true,
    consentDate: '2026-06-20'
  },
  {
    id: 'pat-008',
    tenantId: 'lab-san-jose',
    nationalId: '8-800-4491',
    idType: 'CEDULA',
    firstName: 'Mariana',
    lastName: 'Navarro Lasso',
    dob: '1990-02-14',
    gender: 'F',
    phone: '+507 6112-7766',
    email: 'mariana.navarro@gmail.com',
    address: 'Bella Vista, Av. Balboa, PH Yoo',
    dataConsentLey81: true,
    consentDate: '2026-07-01'
  },
  {
    id: 'pat-009',
    tenantId: 'lab-san-jose',
    nationalId: '8-720-1980',
    idType: 'CEDULA',
    firstName: 'Gonzalo A.',
    lastName: 'Ríos',
    dob: '1980-06-15',
    gender: 'M',
    phone: '+507 6555-1234',
    email: 'gonzalo.rios@gmail.com',
    address: 'San Francisco, Vía España, PH Royal Plaza',
    dataConsentLey81: true,
    consentDate: '2026-08-01'
  }
];

export const MOCK_TEST_CATALOG: TestCatalogItem[] = [
  // =========================================================================
  // 1. ÁREA DE HEMATOLOGÍA & CITOLOGÍA HEMÁTICA (LIS / HIS)
  // =========================================================================
  {
    id: 'test-hemograma',
    tenantId: 'lab-san-jose',
    code: '1001',
    name: 'Hemograma Completo (5-Part Diff + Plaquetas)',
    category: 'HEMATOLOGIA',
    tubeType: 'EDTA_MORADO',
    price: 18.50,
    specimenType: 'Sangre Total EDTA',
    tatHours: 2,
    astmMappingCode: 'CBC_5DIFF',
    parameters: [
      { id: 'p-wbc', name: 'Leucocitos Totales (WBC)', unit: 'x10^3/µL', astmParamCode: 'WBC', referenceRanges: [{ id: 'rr-wbc', gender: 'TODOS', minValue: 4.5, maxValue: 11.0, unit: 'x10^3/µL' }] },
      { id: 'p-rbc', name: 'Eritrocitos (RBC)', unit: 'x10^6/µL', astmParamCode: 'RBC', referenceRanges: [{ id: 'rr-rbc', gender: 'TODOS', minValue: 4.2, maxValue: 5.8, unit: 'x10^6/µL' }] },
      { id: 'p-hgb', name: 'Hemoglobina (HGB)', unit: 'g/dL', astmParamCode: 'HGB', referenceRanges: [{ id: 'rr-hgb-m', gender: 'M', minValue: 13.5, maxValue: 17.5, unit: 'g/dL' }, { id: 'rr-hgb-f', gender: 'F', minValue: 12.0, maxValue: 15.5, unit: 'g/dL' }] },
      { id: 'p-hct', name: 'Hematocrito (HCT)', unit: '%', astmParamCode: 'HCT', referenceRanges: [{ id: 'rr-hct-m', gender: 'M', minValue: 40.0, maxValue: 52.0, unit: '%' }, { id: 'rr-hct-f', gender: 'F', minValue: 36.0, maxValue: 47.0, unit: '%' }] },
      { id: 'p-vcm', name: 'Volumen Corpuscular Medio (VCM)', unit: 'fL', astmParamCode: 'MCV', referenceRanges: [{ id: 'rr-vcm', gender: 'TODOS', minValue: 80.0, maxValue: 98.0, unit: 'fL' }] },
      { id: 'p-hcm', name: 'Hemoglobina Corpuscular Media (HCM)', unit: 'pg', astmParamCode: 'MCH', referenceRanges: [{ id: 'rr-hcm', gender: 'TODOS', minValue: 27.0, maxValue: 33.0, unit: 'pg' }] },
      { id: 'p-chcm', name: 'Conc. Corpuscular Media de Hgb (CHCM)', unit: 'g/dL', astmParamCode: 'MCHC', referenceRanges: [{ id: 'rr-chcm', gender: 'TODOS', minValue: 32.0, maxValue: 36.0, unit: 'g/dL' }] },
      { id: 'p-rdw', name: 'Ancho de Distribución Eritrocitaria (RDW)', unit: '%', astmParamCode: 'RDW', referenceRanges: [{ id: 'rr-rdw', gender: 'TODOS', minValue: 11.5, maxValue: 14.5, unit: '%' }] },
      { id: 'p-plt', name: 'Recuento de Plaquetas (PLT)', unit: 'x10^3/µL', astmParamCode: 'PLT', referenceRanges: [{ id: 'rr-plt', gender: 'TODOS', minValue: 150, maxValue: 450, unit: 'x10^3/µL' }] },
      { id: 'p-mpv', name: 'Volumen Plaquetario Medio (VPM)', unit: 'fL', astmParamCode: 'MPV', referenceRanges: [{ id: 'rr-mpv', gender: 'TODOS', minValue: 7.0, maxValue: 11.0, unit: 'fL' }] },
      { id: 'p-neu', name: 'Neutrófilos Segmentados (%)', unit: '%', astmParamCode: 'NEU%', referenceRanges: [{ id: 'rr-neu', gender: 'TODOS', minValue: 40.0, maxValue: 70.0, unit: '%' }] },
      { id: 'p-lin', name: 'Linfocitos (%)', unit: '%', astmParamCode: 'LYM%', referenceRanges: [{ id: 'rr-lin', gender: 'TODOS', minValue: 20.0, maxValue: 45.0, unit: '%' }] },
      { id: 'p-mon', name: 'Monocitos (%)', unit: '%', astmParamCode: 'MON%', referenceRanges: [{ id: 'rr-mon', gender: 'TODOS', minValue: 2.0, maxValue: 10.0, unit: '%' }] },
      { id: 'p-eos', name: 'Eosinófilos (%)', unit: '%', astmParamCode: 'EOS%', referenceRanges: [{ id: 'rr-eos', gender: 'TODOS', minValue: 1.0, maxValue: 5.0, unit: '%' }] },
      { id: 'p-bas', name: 'Basófilos (%)', unit: '%', astmParamCode: 'BAS%', referenceRanges: [{ id: 'rr-bas', gender: 'TODOS', minValue: 0.0, maxValue: 2.0, unit: '%' }] }
    ]
  },
  {
    id: 'test-vsg',
    tenantId: 'lab-san-jose',
    code: '1002',
    name: 'VSG (Velocidad de Sedimentación Globular)',
    category: 'HEMATOLOGIA',
    tubeType: 'EDTA_MORADO',
    price: 6.00,
    specimenType: 'Sangre Total',
    tatHours: 1,
    astmMappingCode: 'VSG_WEST',
    parameters: [
      { id: 'p-vsg', name: 'Velocidad de Sedimentación (Westergren)', unit: 'mm/h', astmParamCode: 'VSG', referenceRanges: [{ id: 'rr-vsg-m', gender: 'M', minValue: 0, maxValue: 15, unit: 'mm/h' }, { id: 'rr-vsg-f', gender: 'F', minValue: 0, maxValue: 20, unit: 'mm/h' }] }
    ]
  },
  {
    id: 'test-retis',
    tenantId: 'lab-san-jose',
    code: '1003',
    name: 'Recuento de Reticulocitos (Absolutos y Relativos)',
    category: 'HEMATOLOGIA',
    tubeType: 'EDTA_MORADO',
    price: 14.00,
    specimenType: 'Sangre Total',
    tatHours: 3,
    astmMappingCode: 'RETIC_AUTO',
    parameters: [
      { id: 'p-retis-rel', name: 'Reticulocitos Porcentual', unit: '%', astmParamCode: 'RET%', referenceRanges: [{ id: 'rr-ret-rel', gender: 'TODOS', minValue: 0.5, maxValue: 2.5, unit: '%' }] },
      { id: 'p-retis-abs', name: 'Reticulocitos Absolutos', unit: 'x10^3/µL', astmParamCode: 'RET#', referenceRanges: [{ id: 'rr-ret-abs', gender: 'TODOS', minValue: 25, maxValue: 110, unit: 'x10^3/µL' }] }
    ]
  },
  {
    id: 'test-falcemia',
    tenantId: 'lab-san-jose',
    code: '1005',
    name: 'Prueba de Falcemia / Drepanocitos (Sickling)',
    category: 'HEMATOLOGIA',
    tubeType: 'EDTA_MORADO',
    price: 10.00,
    specimenType: 'Sangre Total',
    tatHours: 2,
    parameters: [
      { id: 'p-falcemia', name: 'Búsqueda de Células Falciformes', unit: 'Cualitativo', astmParamCode: 'SICKLE', referenceRanges: [] }
    ]
  },
  {
    id: 'test-frotis',
    tenantId: 'lab-san-jose',
    code: '1006',
    name: 'Frotis de Sangre Periférica (Morfología Manual)',
    category: 'HEMATOLOGIA',
    tubeType: 'EDTA_MORADO',
    price: 15.00,
    specimenType: 'Extensión Sanguínea',
    tatHours: 4,
    parameters: [
      { id: 'p-frotis-s-roja', name: 'Serie Roja (Morfología)', unit: 'Texto', astmParamCode: 'S_ROJA', referenceRanges: [] },
      { id: 'p-frotis-s-blanca', name: 'Serie Blanca (Morfología)', unit: 'Texto', astmParamCode: 'S_BLANCA', referenceRanges: [] },
      { id: 'p-frotis-s-plaquetar', name: 'Serie Plaquetaria (Morfología)', unit: 'Texto', astmParamCode: 'S_PLAQ', referenceRanges: [] }
    ]
  },
  {
    id: 'test-fragilidad',
    tenantId: 'lab-san-jose',
    code: '1007',
    name: 'Fragilidad Osmótica Eritrocitaria',
    category: 'HEMATOLOGIA',
    tubeType: 'EDTA_MORADO',
    price: 28.00,
    specimenType: 'Sangre Total Heparinizada',
    tatHours: 24,
    parameters: [
      { id: 'p-frag-inicial', name: 'Hemólisis Inicial (NaCl %)', unit: '%', astmParamCode: 'FRAG_INI', referenceRanges: [{ id: 'rr-frag-ini', gender: 'TODOS', minValue: 0.45, maxValue: 0.50, unit: '%' }] },
      { id: 'p-frag-total', name: 'Hemólisis Completa (NaCl %)', unit: '%', astmParamCode: 'FRAG_TOT', referenceRanges: [{ id: 'rr-frag-tot', gender: 'TODOS', minValue: 0.30, maxValue: 0.35, unit: '%' }] }
    ]
  },

  // =========================================================================
  // 2. ÁREA DE COAGULACIÓN & HEMOSTASIA (LIS / HIS / QUIRÓFANO)
  // =========================================================================
  {
    id: 'test-pt',
    tenantId: 'lab-san-jose',
    code: '4001',
    name: 'Tiempo de Protrombina (TP) + INR',
    category: 'COAGULACION',
    tubeType: 'CITRATO_AZUL',
    price: 15.00,
    specimenType: 'Plasma Citratado',
    tatHours: 1,
    astmMappingCode: 'PT_INR',
    parameters: [
      { id: 'p-tp', name: 'Tiempo de Protrombina (TP)', unit: 'segundos', astmParamCode: 'TP', referenceRanges: [{ id: 'rr-tp', gender: 'TODOS', minValue: 11.0, maxValue: 13.5, unit: 'seg' }] },
      { id: 'p-inr', name: 'INR (Razón Internacional Normalizada)', unit: 'Ratio', astmParamCode: 'INR', referenceRanges: [{ id: 'rr-inr', gender: 'TODOS', minValue: 0.85, maxValue: 1.15, unit: '' }] },
      { id: 'p-act-pt', name: 'Actividad de Protrombina', unit: '%', astmParamCode: 'PT_ACT', referenceRanges: [{ id: 'rr-pt-act', gender: 'TODOS', minValue: 70, maxValue: 120, unit: '%' }] }
    ]
  },
  {
    id: 'test-ptt',
    tenantId: 'lab-san-jose',
    code: '4002',
    name: 'Tiempo de Tromboplastina Parcial Activada (TTPa)',
    category: 'COAGULACION',
    tubeType: 'CITRATO_AZUL',
    price: 15.00,
    specimenType: 'Plasma Citratado',
    tatHours: 1,
    astmMappingCode: 'APTT',
    parameters: [
      { id: 'p-ttpa', name: 'TTPa Cuantitativo', unit: 'segundos', astmParamCode: 'TTPA', referenceRanges: [{ id: 'rr-ttpa', gender: 'TODOS', minValue: 25.0, maxValue: 36.0, unit: 'seg' }] }
    ]
  },
  {
    id: 'test-fibrinogeno',
    tenantId: 'lab-san-jose',
    code: '4003',
    name: 'Fibrinógeno Cuantitativo (Método Clauss)',
    category: 'COAGULACION',
    tubeType: 'CITRATO_AZUL',
    price: 22.00,
    specimenType: 'Plasma Citratado',
    tatHours: 2,
    astmMappingCode: 'FIB_CLAUSS',
    parameters: [
      { id: 'p-fib', name: 'Fibrinógeno Plasmático', unit: 'mg/dL', astmParamCode: 'FIB', referenceRanges: [{ id: 'rr-fib', gender: 'TODOS', minValue: 200, maxValue: 400, unit: 'mg/dL' }] }
    ]
  },
  {
    id: 'test-tt',
    tenantId: 'lab-san-jose',
    code: '4004',
    name: 'Tiempo de Trombina (TT)',
    category: 'COAGULACION',
    tubeType: 'CITRATO_AZUL',
    price: 18.00,
    specimenType: 'Plasma Citratado',
    tatHours: 1,
    astmMappingCode: 'TT_COAG',
    parameters: [
      { id: 'p-tt', name: 'Tiempo de Trombina', unit: 'segundos', astmParamCode: 'TT', referenceRanges: [{ id: 'rr-tt', gender: 'TODOS', minValue: 14.0, maxValue: 19.0, unit: 'seg' }] }
    ]
  },
  {
    id: 'test-dimero-d',
    tenantId: 'lab-san-jose',
    code: '4005',
    name: 'Dímero D Cuantitativo hs (hs-D-Dimer)',
    category: 'COAGULACION',
    tubeType: 'CITRATO_AZUL',
    price: 38.00,
    specimenType: 'Plasma Citratado',
    tatHours: 1,
    astmMappingCode: 'DDIMER',
    parameters: [
      { id: 'p-dimero-d', name: 'Dímero D Cuantitativo', unit: 'ng/mL DDU', astmParamCode: 'DDIMER', referenceRanges: [{ id: 'rr-ddimer', gender: 'TODOS', minValue: 0, maxValue: 500, unit: 'ng/mL' }] }
    ]
  },

  // =========================================================================
  // 3. ÁREA DE QUÍMICA CLÍNICA & BIOQUÍMICA (LIS / HIS)
  // =========================================================================
  {
    id: 'test-glucosa',
    tenantId: 'lab-san-jose',
    code: '3453',
    name: 'Glucosa Basal en Ayunas',
    category: 'QUIMICA',
    tubeType: 'SUERO_ROJO',
    price: 8.00,
    specimenType: 'Suero / Plasma',
    tatHours: 1,
    astmMappingCode: 'GLU_101',
    parameters: [
      { id: 'p-glu', name: 'Glucosa Basal', unit: 'mg/dL', astmParamCode: 'GLU', referenceRanges: [{ id: 'rr-glu', gender: 'TODOS', minValue: 70, maxValue: 99, unit: 'mg/dL' }] }
    ]
  },
  {
    id: 'test-hba1c',
    tenantId: 'lab-san-jose',
    code: '3460',
    name: 'Hemoglobina Glicosilada (HbA1c por HPLC)',
    category: 'QUIMICA',
    tubeType: 'EDTA_MORADO',
    price: 24.00,
    specimenType: 'Sangre Total EDTA',
    tatHours: 3,
    astmMappingCode: 'HBA1C_HPLC',
    parameters: [
      { id: 'p-hba1c', name: 'HbA1c NGSP/IFCC', unit: '%', astmParamCode: 'HBA1C', referenceRanges: [{ id: 'rr-hba1c', gender: 'TODOS', minValue: 4.0, maxValue: 5.6, unit: '%' }] },
      { id: 'p-eag', name: 'Glucosa Promedio Estimada (eAG)', unit: 'mg/dL', astmParamCode: 'EAG', referenceRanges: [{ id: 'rr-eag', gender: 'TODOS', minValue: 70, maxValue: 114, unit: 'mg/dL' }] }
    ]
  },
  {
    id: 'test-creatinina',
    tenantId: 'lab-san-jose',
    code: '3454',
    name: 'Creatinina Sérica',
    category: 'QUIMICA',
    tubeType: 'SUERO_ROJO',
    price: 8.50,
    specimenType: 'Suero',
    tatHours: 1,
    astmMappingCode: 'CREA_ENZ',
    parameters: [
      { id: 'p-crea', name: 'Creatinina Sérica', unit: 'mg/dL', astmParamCode: 'CREA', referenceRanges: [{ id: 'rr-crea-m', gender: 'M', minValue: 0.70, maxValue: 1.30, unit: 'mg/dL' }, { id: 'rr-crea-f', gender: 'F', minValue: 0.55, maxValue: 1.05, unit: 'mg/dL' }] }
    ]
  },
  {
    id: 'test-urea',
    tenantId: 'lab-san-jose',
    code: '3456',
    name: 'Nitrógeno de Urea (BUN) y Urea',
    category: 'QUIMICA',
    tubeType: 'SUERO_ROJO',
    price: 8.00,
    specimenType: 'Suero',
    tatHours: 1,
    astmMappingCode: 'BUN_UREA',
    parameters: [
      { id: 'p-bun', name: 'Nitrógeno de Urea (BUN)', unit: 'mg/dL', astmParamCode: 'BUN', referenceRanges: [{ id: 'rr-bun', gender: 'TODOS', minValue: 7, maxValue: 20, unit: 'mg/dL' }] },
      { id: 'p-urea', name: 'Urea Sérica Calculada', unit: 'mg/dL', astmParamCode: 'UREA', referenceRanges: [{ id: 'rr-urea', gender: 'TODOS', minValue: 15, maxValue: 43, unit: 'mg/dL' }] }
    ]
  },
  {
    id: 'test-acido-urico',
    tenantId: 'lab-san-jose',
    code: '3457',
    name: 'Ácido Úrico Sérico',
    category: 'QUIMICA',
    tubeType: 'SUERO_ROJO',
    price: 8.00,
    specimenType: 'Suero',
    tatHours: 1,
    astmMappingCode: 'URIC_ACID',
    parameters: [
      { id: 'p-auric', name: 'Ácido Úrico', unit: 'mg/dL', astmParamCode: 'URIC', referenceRanges: [{ id: 'rr-auric-m', gender: 'M', minValue: 3.5, maxValue: 7.2, unit: 'mg/dL' }, { id: 'rr-auric-f', gender: 'F', minValue: 2.6, maxValue: 6.0, unit: 'mg/dL' }] }
    ]
  },
  {
    id: 'test-lipidico',
    tenantId: 'lab-san-jose',
    code: '3455',
    name: 'Perfil Lipídico Integral',
    category: 'QUIMICA',
    tubeType: 'SUERO_ROJO',
    price: 35.00,
    specimenType: 'Suero',
    tatHours: 3,
    astmMappingCode: 'LIPID_PANEL',
    parameters: [
      { id: 'p-chol', name: 'Colesterol Total', unit: 'mg/dL', astmParamCode: 'CHOL', referenceRanges: [{ id: 'rr-chol', gender: 'TODOS', minValue: 100, maxValue: 199, unit: 'mg/dL' }] },
      { id: 'p-trig', name: 'Triglicéridos', unit: 'mg/dL', astmParamCode: 'TRIG', referenceRanges: [{ id: 'rr-trig', gender: 'TODOS', minValue: 10, maxValue: 149, unit: 'mg/dL' }] },
      { id: 'p-hdl', name: 'Colesterol HDL (Bueno)', unit: 'mg/dL', astmParamCode: 'HDL', referenceRanges: [{ id: 'rr-hdl-m', gender: 'M', minValue: 40, maxValue: 80, unit: 'mg/dL' }, { id: 'rr-hdl-f', gender: 'F', minValue: 50, maxValue: 90, unit: 'mg/dL' }] },
      { id: 'p-ldl', name: 'Colesterol LDL (Malo)', unit: 'mg/dL', astmParamCode: 'LDL', referenceRanges: [{ id: 'rr-ldl', gender: 'TODOS', minValue: 0, maxValue: 99, unit: 'mg/dL' }] },
      { id: 'p-vldl', name: 'Colesterol VLDL', unit: 'mg/dL', astmParamCode: 'VLDL', referenceRanges: [{ id: 'rr-vldl', gender: 'TODOS', minValue: 5, maxValue: 30, unit: 'mg/dL' }] },
      { id: 'p-rel-chol-hdl', name: 'Índice Castelli (Col/HDL)', unit: 'Ratio', astmParamCode: 'CASTELLI', referenceRanges: [{ id: 'rr-castelli', gender: 'TODOS', minValue: 1.0, maxValue: 4.5, unit: '' }] }
    ]
  },
  {
    id: 'test-hepatico',
    tenantId: 'lab-san-jose',
    code: '3458',
    name: 'Perfil Hepático Completo',
    category: 'QUIMICA',
    tubeType: 'SUERO_ROJO',
    price: 45.00,
    specimenType: 'Suero',
    tatHours: 3,
    astmMappingCode: 'LIVER_PANEL',
    parameters: [
      { id: 'p-ast', name: 'TGO / AST', unit: 'U/L', astmParamCode: 'AST', referenceRanges: [{ id: 'rr-ast', gender: 'TODOS', minValue: 10, maxValue: 40, unit: 'U/L' }] },
      { id: 'p-alt', name: 'TGP / ALT', unit: 'U/L', astmParamCode: 'ALT', referenceRanges: [{ id: 'rr-alt', gender: 'TODOS', minValue: 7, maxValue: 56, unit: 'U/L' }] },
      { id: 'p-ggt', name: 'Gamma Glutamil Transferasa (GGT)', unit: 'U/L', astmParamCode: 'GGT', referenceRanges: [{ id: 'rr-ggt-m', gender: 'M', minValue: 11, maxValue: 61, unit: 'U/L' }, { id: 'rr-ggt-f', gender: 'F', minValue: 9, maxValue: 39, unit: 'U/L' }] },
      { id: 'p-alp', name: 'Fosfatasa Alcalina (ALP)', unit: 'U/L', astmParamCode: 'ALP', referenceRanges: [{ id: 'rr-alp', gender: 'TODOS', minValue: 44, maxValue: 147, unit: 'U/L' }] },
      { id: 'p-tbil', name: 'Bilirrubina Total', unit: 'mg/dL', astmParamCode: 'TBIL', referenceRanges: [{ id: 'rr-tbil', gender: 'TODOS', minValue: 0.2, maxValue: 1.2, unit: 'mg/dL' }] },
      { id: 'p-dbil', name: 'Bilirrubina Directa', unit: 'mg/dL', astmParamCode: 'DBIL', referenceRanges: [{ id: 'rr-dbil', gender: 'TODOS', minValue: 0.0, maxValue: 0.3, unit: 'mg/dL' }] },
      { id: 'p-ibil', name: 'Bilirrubina Indirecta', unit: 'mg/dL', astmParamCode: 'IBIL', referenceRanges: [{ id: 'rr-ibil', gender: 'TODOS', minValue: 0.2, maxValue: 0.9, unit: 'mg/dL' }] },
      { id: 'p-alb', name: 'Albúmina Sérica', unit: 'g/dL', astmParamCode: 'ALB', referenceRanges: [{ id: 'rr-alb', gender: 'TODOS', minValue: 3.5, maxValue: 5.2, unit: 'g/dL' }] },
      { id: 'p-prot-tot', name: 'Proteínas Totales', unit: 'g/dL', astmParamCode: 'TP', referenceRanges: [{ id: 'rr-tp', gender: 'TODOS', minValue: 6.4, maxValue: 8.3, unit: 'g/dL' }] }
    ]
  },
  {
    id: 'test-electrolitos',
    tenantId: 'lab-san-jose',
    code: '3459',
    name: 'Electrolitos Séricos (Na, K, Cl, Ca, P, Mg)',
    category: 'QUIMICA',
    tubeType: 'SUERO_ROJO',
    price: 32.00,
    specimenType: 'Suero',
    tatHours: 1,
    astmMappingCode: 'LYTES_6',
    parameters: [
      { id: 'p-na', name: 'Sodio Sérico (Na+)', unit: 'mEq/L', astmParamCode: 'NA', referenceRanges: [{ id: 'rr-na', gender: 'TODOS', minValue: 136, maxValue: 145, unit: 'mEq/L' }] },
      { id: 'p-k', name: 'Potasio Sérico (K+)', unit: 'mEq/L', astmParamCode: 'K', referenceRanges: [{ id: 'rr-k', gender: 'TODOS', minValue: 3.5, maxValue: 5.1, unit: 'mEq/L' }] },
      { id: 'p-cl', name: 'Cloro Sérico (Cl-)', unit: 'mEq/L', astmParamCode: 'CL', referenceRanges: [{ id: 'rr-cl', gender: 'TODOS', minValue: 98, maxValue: 107, unit: 'mEq/L' }] },
      { id: 'p-ca', name: 'Calcio Total Sérico', unit: 'mg/dL', astmParamCode: 'CA', referenceRanges: [{ id: 'rr-ca', gender: 'TODOS', minValue: 8.5, maxValue: 10.5, unit: 'mg/dL' }] },
      { id: 'p-phos', name: 'Fósforo Inorgánico', unit: 'mg/dL', astmParamCode: 'PHOS', referenceRanges: [{ id: 'rr-phos', gender: 'TODOS', minValue: 2.5, maxValue: 4.5, unit: 'mg/dL' }] },
      { id: 'p-mg', name: 'Magnesio Sérico', unit: 'mg/dL', astmParamCode: 'MG', referenceRanges: [{ id: 'rr-mg', gender: 'TODOS', minValue: 1.7, maxValue: 2.4, unit: 'mg/dL' }] }
    ]
  },
  {
    id: 'test-amilasa',
    tenantId: 'lab-san-jose',
    code: '3461',
    name: 'Amilasa Sérica',
    category: 'QUIMICA',
    tubeType: 'SUERO_ROJO',
    price: 16.00,
    specimenType: 'Suero',
    tatHours: 1,
    astmMappingCode: 'AMYL',
    parameters: [
      { id: 'p-amyl', name: 'Amilasa Pancreática', unit: 'U/L', astmParamCode: 'AMYL', referenceRanges: [{ id: 'rr-amyl', gender: 'TODOS', minValue: 28, maxValue: 100, unit: 'U/L' }] }
    ]
  },
  {
    id: 'test-lipasa',
    tenantId: 'lab-san-jose',
    code: '3462',
    name: 'Lipasa Sérica',
    category: 'QUIMICA',
    tubeType: 'SUERO_ROJO',
    price: 20.00,
    specimenType: 'Suero',
    tatHours: 1,
    astmMappingCode: 'LIPA',
    parameters: [
      { id: 'p-lipa', name: 'Lipasa Específica', unit: 'U/L', astmParamCode: 'LIPA', referenceRanges: [{ id: 'rr-lipa', gender: 'TODOS', minValue: 13, maxValue: 60, unit: 'U/L' }] }
    ]
  },
  {
    id: 'test-ldh',
    tenantId: 'lab-san-jose',
    code: '3463',
    name: 'Lactato Deshidrogenasa (LDH)',
    category: 'QUIMICA',
    tubeType: 'SUERO_ROJO',
    price: 14.00,
    specimenType: 'Suero',
    tatHours: 1,
    astmMappingCode: 'LDH_ENZ',
    parameters: [
      { id: 'p-ldh', name: 'LDH Total', unit: 'U/L', astmParamCode: 'LDH', referenceRanges: [{ id: 'rr-ldh', gender: 'TODOS', minValue: 140, maxValue: 280, unit: 'U/L' }] }
    ]
  },
  {
    id: 'test-pcr-us',
    tenantId: 'lab-san-jose',
    code: '3464',
    name: 'Proteína C Reactiva Ultrasensible (PCR-us)',
    category: 'QUIMICA',
    tubeType: 'SUERO_ROJO',
    price: 22.00,
    specimenType: 'Suero',
    tatHours: 2,
    astmMappingCode: 'HS_CRP',
    parameters: [
      { id: 'p-crp', name: 'PCR Ultrasensible', unit: 'mg/L', astmParamCode: 'HSCRP', referenceRanges: [{ id: 'rr-crp', gender: 'TODOS', minValue: 0.0, maxValue: 3.0, unit: 'mg/L' }] }
    ]
  },

  // =========================================================================
  // 4. ÁREA DE UROANÁLISIS / URINALISIS (LIS / HIS)
  // =========================================================================
  {
    id: 'test-uri',
    tenantId: 'lab-san-jose',
    code: '2001',
    name: 'Urianálisis Completo (Físico, Químico y Sedimento Automatizado)',
    category: 'URINALISIS',
    tubeType: 'ORINA',
    price: 12.00,
    specimenType: 'Orina Espontánea',
    tatHours: 1,
    astmMappingCode: 'URI_PANEL',
    parameters: [
      { id: 'p-uri-color', name: 'Color Urinario', unit: 'Texto', astmParamCode: 'U-COL', referenceRanges: [] },
      { id: 'p-uri-asp', name: 'Aspecto', unit: 'Texto', astmParamCode: 'U-ASP', referenceRanges: [] },
      { id: 'p-uri-sg', name: 'Densidad Específica', unit: 'Ratio', astmParamCode: 'U-SG', referenceRanges: [{ id: 'rr-usg', gender: 'TODOS', minValue: 1.005, maxValue: 1.030, unit: '' }] },
      { id: 'p-uri-ph', name: 'pH Urinario', unit: 'pH', astmParamCode: 'U-PH', referenceRanges: [{ id: 'rr-uph', gender: 'TODOS', minValue: 5.0, maxValue: 7.5, unit: 'pH' }] },
      { id: 'p-uri-leu-est', name: 'Leucocitos Esterasa', unit: 'Cualitativo', astmParamCode: 'U-LEU-EST', referenceRanges: [] },
      { id: 'p-uri-nit', name: 'Nitritos', unit: 'Cualitativo', astmParamCode: 'U-NIT', referenceRanges: [] },
      { id: 'p-uri-pro', name: 'Proteínas Urinarias', unit: 'mg/dL', astmParamCode: 'U-PRO', referenceRanges: [] },
      { id: 'p-uri-glu', name: 'Glucosa Urinaria', unit: 'mg/dL', astmParamCode: 'U-GLU', referenceRanges: [] },
      { id: 'p-uri-cet', name: 'Cuerpos Cetónicos', unit: 'mg/dL', astmParamCode: 'U-CET', referenceRanges: [] },
      { id: 'p-uri-uro', name: 'Urobilinógeno', unit: 'mg/dL', astmParamCode: 'U-URO', referenceRanges: [] },
      { id: 'p-uri-bil', name: 'Bilirrubina Urinaria', unit: 'mg/dL', astmParamCode: 'U-BIL', referenceRanges: [] },
      { id: 'p-uri-hgb', name: 'Hemoglobina Libre', unit: 'Cualitativo', astmParamCode: 'U-HGB', referenceRanges: [] },
      { id: 'p-uri-sed-leu', name: 'Leucocitos Sedimento', unit: '/campo', astmParamCode: 'U-SED-LEU', referenceRanges: [{ id: 'rr-uleu', gender: 'TODOS', minValue: 0, maxValue: 5, unit: '/campo' }] },
      { id: 'p-uri-sed-rbc', name: 'Hematíes Sedimento', unit: '/campo', astmParamCode: 'U-SED-RBC', referenceRanges: [{ id: 'rr-urbc', gender: 'TODOS', minValue: 0, maxValue: 3, unit: '/campo' }] },
      { id: 'p-uri-sed-epi', name: 'Células Epiteliales', unit: '/campo', astmParamCode: 'U-SED-EPI', referenceRanges: [] },
      { id: 'p-uri-sed-bac', name: 'Bacterias en Sedimento', unit: 'Cualitativo', astmParamCode: 'U-SED-BAC', referenceRanges: [] },
      { id: 'p-uri-sed-cris', name: 'Cristales', unit: 'Texto', astmParamCode: 'U-SED-CRIS', referenceRanges: [] },
      { id: 'p-uri-sed-cil', name: 'Cilindros', unit: 'Texto', astmParamCode: 'U-SED-CIL', referenceRanges: [] }
    ]
  },
  {
    id: 'test-depuracion-creatinina',
    tenantId: 'lab-san-jose',
    code: '2002',
    name: 'Depuración de Creatinina (Clearance en Orina de 24 Horas)',
    category: 'URINALISIS',
    tubeType: 'ORINA',
    price: 25.00,
    specimenType: 'Orina 24 Horas + Suero',
    tatHours: 4,
    astmMappingCode: 'CREA_CLEAR',
    parameters: [
      { id: 'p-clearance', name: 'Depuración Corregida', unit: 'mL/min/1.73m2', astmParamCode: 'CL_CREA', referenceRanges: [{ id: 'rr-cl-m', gender: 'M', minValue: 90, maxValue: 140, unit: 'mL/min' }, { id: 'rr-cl-f', gender: 'F', minValue: 80, maxValue: 125, unit: 'mL/min' }] },
      { id: 'p-vol-24h', name: 'Volumen Urinario 24h', unit: 'mL/24h', astmParamCode: 'VOL_24H', referenceRanges: [{ id: 'rr-vol24', gender: 'TODOS', minValue: 800, maxValue: 2000, unit: 'mL' }] },
      { id: 'p-crea-u24', name: 'Creatinina en Orina', unit: 'mg/dL', astmParamCode: 'CREA_U', referenceRanges: [] }
    ]
  },
  {
    id: 'test-proteinas-24h',
    tenantId: 'lab-san-jose',
    code: '2003',
    name: 'Proteínas Totales en Orina de 24 Horas',
    category: 'URINALISIS',
    tubeType: 'ORINA',
    price: 18.00,
    specimenType: 'Orina 24 Horas',
    tatHours: 4,
    astmMappingCode: 'PROT_24H',
    parameters: [
      { id: 'p-prot-24h', name: 'Proteínas Totales 24h', unit: 'mg/24h', astmParamCode: 'PROT24', referenceRanges: [{ id: 'rr-pro24', gender: 'TODOS', minValue: 0, maxValue: 150, unit: 'mg/24h' }] }
    ]
  },
  {
    id: 'test-microalbumina',
    tenantId: 'lab-san-jose',
    code: '2004',
    name: 'Microalbuminuria Cuantitativa y Relación RAC',
    category: 'URINALISIS',
    tubeType: 'ORINA',
    price: 24.00,
    specimenType: 'Orina Aislada / Primera Mañana',
    tatHours: 2,
    astmMappingCode: 'MICRO_ALB',
    parameters: [
      { id: 'p-micro-alb', name: 'Microalbúmina Urinaria', unit: 'mg/L', astmParamCode: 'MALB', referenceRanges: [{ id: 'rr-malb', gender: 'TODOS', minValue: 0, maxValue: 20, unit: 'mg/L' }] },
      { id: 'p-rac', name: 'Relación Albúmina/Creatinina (RAC)', unit: 'mg/g', astmParamCode: 'RAC', referenceRanges: [{ id: 'rr-rac', gender: 'TODOS', minValue: 0, maxValue: 30, unit: 'mg/g' }] }
    ]
  },

  // =========================================================================
  // 5. ÁREA DE COPROLOGÍA & PARASITOLOGÍA (LIS / HIS)
  // =========================================================================
  {
    id: 'test-coprologico',
    tenantId: 'lab-san-jose',
    code: '2101',
    name: 'Examen Coprológico General (Fresco y Concentración)',
    category: 'COPROLOGIA',
    tubeType: 'HECES',
    price: 10.00,
    specimenType: 'Heces Frecas',
    tatHours: 2,
    parameters: [
      { id: 'p-cop-color', name: 'Color Fecal', unit: 'Texto', astmParamCode: 'C_COL', referenceRanges: [] },
      { id: 'p-cop-cons', name: 'Consistencia', unit: 'Texto', astmParamCode: 'C_CONS', referenceRanges: [] },
      { id: 'p-cop-moco', name: 'Moco Fecal', unit: 'Cualitativo', astmParamCode: 'C_MOCO', referenceRanges: [] },
      { id: 'p-cop-ph', name: 'pH Fecal', unit: 'pH', astmParamCode: 'C_PH', referenceRanges: [{ id: 'rr-cph', gender: 'TODOS', minValue: 6.8, maxValue: 7.5, unit: 'pH' }] },
      { id: 'p-cop-leu', name: 'Leucocitos Fecales', unit: '/campo', astmParamCode: 'C_LEU', referenceRanges: [{ id: 'rr-cleu', gender: 'TODOS', minValue: 0, maxValue: 2, unit: '/campo' }] },
      { id: 'p-cop-rbc', name: 'Hematíes Fecales', unit: '/campo', astmParamCode: 'C_RBC', referenceRanges: [{ id: 'rr-crbc', gender: 'TODOS', minValue: 0, maxValue: 0, unit: '/campo' }] },
      { id: 'p-cop-parasitos', name: 'Parásitos (Protozoarios y Helmintos)', unit: 'Texto', astmParamCode: 'C_PARAS', referenceRanges: [] }
    ]
  },
  {
    id: 'test-sangre-oculta',
    tenantId: 'lab-san-jose',
    code: '2102',
    name: 'Sangre Oculta en Heces (FIT Inmunoquímica Fecal)',
    category: 'COPROLOGIA',
    tubeType: 'HECES',
    price: 14.00,
    specimenType: 'Muestra Fecal',
    tatHours: 1,
    parameters: [
      { id: 'p-fit', name: 'Hemoglobina Humana en Heces', unit: 'Cualitativo', astmParamCode: 'FIT_HGB', referenceRanges: [] }
    ]
  },
  {
    id: 'test-copro-concentracion',
    tenantId: 'lab-san-jose',
    code: '2103',
    name: 'Coproparasitoscópico Seriado (Concentración Ritchie)',
    category: 'COPROLOGIA',
    tubeType: 'HECES',
    price: 22.00,
    specimenType: 'Heces Conservadas Formol-Éter',
    tatHours: 4,
    parameters: [
      { id: 'p-ritchie-1', name: 'Muestra 1 (Ritchie)', unit: 'Texto', astmParamCode: 'RITCH_1', referenceRanges: [] },
      { id: 'p-ritchie-2', name: 'Muestra 2 (Ritchie)', unit: 'Texto', astmParamCode: 'RITCH_2', referenceRanges: [] },
      { id: 'p-ritchie-3', name: 'Muestra 3 (Ritchie)', unit: 'Texto', astmParamCode: 'RITCH_3', referenceRanges: [] }
    ]
  },
  {
    id: 'test-rotavirus-adenovirus',
    tenantId: 'lab-san-jose',
    code: '2104',
    name: 'Rotavirus y Adenovirus en Heces (Antígeno Rápido)',
    category: 'COPROLOGIA',
    tubeType: 'HECES',
    price: 25.00,
    specimenType: 'Muestra Fecal Diarreica',
    tatHours: 1,
    parameters: [
      { id: 'p-rotavirus', name: 'Antígeno de Rotavirus', unit: 'Cualitativo', astmParamCode: 'ROTA_AG', referenceRanges: [] },
      { id: 'p-adenovirus', name: 'Antígeno de Adenovirus Entérico', unit: 'Cualitativo', astmParamCode: 'ADENO_AG', referenceRanges: [] }
    ]
  },

  // =========================================================================
  // 6. ÁREA DE SEROLOGÍA & ENFERMEDADES INFECCIOSAS (LIS / HIS / MINSA)
  // =========================================================================
  {
    id: 'test-hiv',
    tenantId: 'lab-san-jose',
    code: '5002',
    name: 'VIH 1/2 Ag p24 y Anticuerpos (4ta Generación Quimioluminiscencia)',
    category: 'SEROLOGIA',
    tubeType: 'SUERO_ROJO',
    price: 32.00,
    specimenType: 'Suero',
    tatHours: 2,
    astmMappingCode: 'HIV_4GEN',
    parameters: [
      { id: 'p-hiv', name: 'VIH 1/2 Ag p24 / Ac Totales', unit: 'Ratio S/CO', astmParamCode: 'HIV', referenceRanges: [{ id: 'rr-hiv', gender: 'TODOS', minValue: 0.0, maxValue: 0.99, unit: 'Ratio' }] }
    ]
  },
  {
    id: 'test-vdrl',
    tenantId: 'lab-san-jose',
    code: '5003',
    name: 'VDRL / RPR Cuantitativo (Tamizaje de Sífilis)',
    category: 'SEROLOGIA',
    tubeType: 'SUERO_ROJO',
    price: 8.00,
    specimenType: 'Suero',
    tatHours: 1,
    astmMappingCode: 'VDRL_TITRE',
    parameters: [
      { id: 'p-vdrl', name: 'VDRL Cualitativo y Título', unit: 'Dilución', astmParamCode: 'VDRL', referenceRanges: [] }
    ]
  },
  {
    id: 'test-treponema-ac',
    tenantId: 'lab-san-jose',
    code: '5005',
    name: 'Treponema pallidum Anticuerpos Totales (Prueba Treponémica)',
    category: 'SEROLOGIA',
    tubeType: 'SUERO_ROJO',
    price: 22.00,
    specimenType: 'Suero',
    tatHours: 2,
    astmMappingCode: 'TREP_TOT',
    parameters: [
      { id: 'p-trep-ac', name: 'Anticuerpos Anti-Treponema', unit: 'Index', astmParamCode: 'TREP', referenceRanges: [{ id: 'rr-trep', gender: 'TODOS', minValue: 0, maxValue: 0.99, unit: 'Index' }] }
    ]
  },
  {
    id: 'test-hbsag',
    tenantId: 'lab-san-jose',
    code: '5006',
    name: 'Hepatitis B - Antígeno de Superficie (HBsAg)',
    category: 'SEROLOGIA',
    tubeType: 'SUERO_ROJO',
    price: 24.00,
    specimenType: 'Suero',
    tatHours: 2,
    astmMappingCode: 'HBSAG',
    parameters: [
      { id: 'p-hbsag', name: 'HBsAg Antígeno Australiano', unit: 'Index S/CO', astmParamCode: 'HBSAG', referenceRanges: [{ id: 'rr-hbsag', gender: 'TODOS', minValue: 0, maxValue: 0.99, unit: 'Index' }] }
    ]
  },
  {
    id: 'test-antihbc',
    tenantId: 'lab-san-jose',
    code: '5007',
    name: 'Hepatitis B - Anticuerpos Totales contra el Core (Anti-HBc Total)',
    category: 'SEROLOGIA',
    tubeType: 'SUERO_ROJO',
    price: 26.00,
    specimenType: 'Suero',
    tatHours: 2,
    astmMappingCode: 'ANTI_HBC',
    parameters: [
      { id: 'p-antihbc', name: 'Anti-HBc Total', unit: 'Index S/CO', astmParamCode: 'HBCTOT', referenceRanges: [{ id: 'rr-antihbc', gender: 'TODOS', minValue: 0, maxValue: 0.99, unit: 'Index' }] }
    ]
  },
  {
    id: 'test-hcv',
    tenantId: 'lab-san-jose',
    code: '5008',
    name: 'Hepatitis C - Anticuerpos Totales (Anti-HCV)',
    category: 'SEROLOGIA',
    tubeType: 'SUERO_ROJO',
    price: 30.00,
    specimenType: 'Suero',
    tatHours: 2,
    astmMappingCode: 'ANTI_HCV',
    parameters: [
      { id: 'p-hcv', name: 'Anticuerpos Anti-HCV', unit: 'Index S/CO', astmParamCode: 'HCV', referenceRanges: [{ id: 'rr-hcv', gender: 'TODOS', minValue: 0, maxValue: 0.99, unit: 'Index' }] }
    ]
  },
  {
    id: 'test-chagas',
    tenantId: 'lab-san-jose',
    code: '5009',
    name: 'Chagas - Anticuerpos Anti-Trypanosoma cruzi IgG/IgM (MINSA)',
    category: 'SEROLOGIA',
    tubeType: 'SUERO_ROJO',
    price: 28.00,
    specimenType: 'Suero',
    tatHours: 3,
    astmMappingCode: 'CHAGAS_CMIA',
    parameters: [
      { id: 'p-chagas', name: 'Anticuerpos T. cruzi Chagas', unit: 'Index S/CO', astmParamCode: 'CHAGAS', referenceRanges: [{ id: 'rr-chagas', gender: 'TODOS', minValue: 0, maxValue: 0.99, unit: 'Index' }] }
    ]
  },
  {
    id: 'test-htlv',
    tenantId: 'lab-san-jose',
    code: '5010',
    name: 'HTLV I/II Anticuerpos (Virus Linfotrópico T Humano)',
    category: 'SEROLOGIA',
    tubeType: 'SUERO_ROJO',
    price: 34.00,
    specimenType: 'Suero',
    tatHours: 4,
    astmMappingCode: 'HTLV_1_2',
    parameters: [
      { id: 'p-htlv', name: 'Anticuerpos Anti-HTLV I/II', unit: 'Index S/CO', astmParamCode: 'HTLV', referenceRanges: [{ id: 'rr-htlv', gender: 'TODOS', minValue: 0, maxValue: 0.99, unit: 'Index' }] }
    ]
  },
  {
    id: 'test-dengue',
    tenantId: 'lab-san-jose',
    code: '5011',
    name: 'Dengue Dúo (Antígeno NS1 + Anticuerpos IgM e IgG)',
    category: 'SEROLOGIA',
    tubeType: 'SUERO_ROJO',
    price: 35.00,
    specimenType: 'Suero',
    tatHours: 1,
    astmMappingCode: 'DENGUE_DUO',
    parameters: [
      { id: 'p-dengue-ns1', name: 'Antígeno NS1 (Fase Temprana)', unit: 'Cualitativo', astmParamCode: 'DEN_NS1', referenceRanges: [] },
      { id: 'p-dengue-igm', name: 'Anticuerpos Dengue IgM', unit: 'Cualitativo', astmParamCode: 'DEN_IGM', referenceRanges: [] },
      { id: 'p-dengue-igg', name: 'Anticuerpos Dengue IgG', unit: 'Cualitativo', astmParamCode: 'DEN_IGG', referenceRanges: [] }
    ]
  },
  {
    id: 'test-toxoplasma',
    tenantId: 'lab-san-jose',
    code: '5012',
    name: 'Toxoplasmosis IgG e IgM Cuantitativo',
    category: 'SEROLOGIA',
    tubeType: 'SUERO_ROJO',
    price: 36.00,
    specimenType: 'Suero',
    tatHours: 3,
    astmMappingCode: 'TOXO_PANEL',
    parameters: [
      { id: 'p-toxo-igg', name: 'Toxoplasma Gondii IgG', unit: 'IU/mL', astmParamCode: 'TOXO_G', referenceRanges: [{ id: 'rr-toxog', gender: 'TODOS', minValue: 0, maxValue: 9.9, unit: 'IU/mL' }] },
      { id: 'p-toxo-igm', name: 'Toxoplasma Gondii IgM', unit: 'Index', astmParamCode: 'TOXO_M', referenceRanges: [{ id: 'rr-toxom', gender: 'TODOS', minValue: 0, maxValue: 0.79, unit: 'Index' }] }
    ]
  },
  {
    id: 'test-mononucleosis',
    tenantId: 'lab-san-jose',
    code: '5013',
    name: 'Mononucleosis Infecciosa (Anticuerpos Heterófilos)',
    category: 'SEROLOGIA',
    tubeType: 'SUERO_ROJO',
    price: 16.00,
    specimenType: 'Suero',
    tatHours: 1,
    parameters: [
      { id: 'p-monospot', name: 'Monospot Heterófilos', unit: 'Cualitativo', astmParamCode: 'MONOSPOT', referenceRanges: [] }
    ]
  },
  {
    id: 'test-respiratorio',
    tenantId: 'lab-san-jose',
    code: '5014',
    name: 'Panel Rápido Respiratorio Ag (COVID-19 Ag + Influenza A/B)',
    category: 'SEROLOGIA',
    tubeType: 'HISOPADO_MEDIO',
    price: 30.00,
    specimenType: 'Hisopado Nasofaríngeo',
    tatHours: 1,
    parameters: [
      { id: 'p-covid-ag', name: 'SARS-CoV-2 Antígeno', unit: 'Cualitativo', astmParamCode: 'COV_AG', referenceRanges: [] },
      { id: 'p-flu-a', name: 'Influenza Tipo A Antígeno', unit: 'Cualitativo', astmParamCode: 'FLU_A', referenceRanges: [] },
      { id: 'p-flu-b', name: 'Influenza Tipo B Antígeno', unit: 'Cualitativo', astmParamCode: 'FLU_B', referenceRanges: [] }
    ]
  },
  {
    id: 'test-factor-reumatoideo',
    tenantId: 'lab-san-jose',
    code: '5015',
    name: 'Factor Reumatoideo Cuantitativo (FR)',
    category: 'SEROLOGIA',
    tubeType: 'SUERO_ROJO',
    price: 15.00,
    specimenType: 'Suero',
    tatHours: 2,
    astmMappingCode: 'FR_QUANT',
    parameters: [
      { id: 'p-fr', name: 'Factor Reumatoideo', unit: 'IU/mL', astmParamCode: 'FR', referenceRanges: [{ id: 'rr-fr', gender: 'TODOS', minValue: 0, maxValue: 14, unit: 'IU/mL' }] }
    ]
  },
  {
    id: 'test-asto',
    tenantId: 'lab-san-jose',
    code: '5016',
    name: 'Antiestreptolisina O Cuantitativa (ASTO)',
    category: 'SEROLOGIA',
    tubeType: 'SUERO_ROJO',
    price: 16.00,
    specimenType: 'Suero',
    tatHours: 2,
    astmMappingCode: 'ASTO_QUANT',
    parameters: [
      { id: 'p-asto', name: 'Título ASTO', unit: 'IU/mL', astmParamCode: 'ASTO', referenceRanges: [{ id: 'rr-asto', gender: 'TODOS', minValue: 0, maxValue: 200, unit: 'IU/mL' }] }
    ]
  },

  // =========================================================================
  // 7. ÁREA DE INMUNOLOGÍA ESPECIAL & HORMONAS (LIS / HIS)
  // =========================================================================
  {
    id: 'test-tsh',
    tenantId: 'lab-san-jose',
    code: '5001',
    name: 'TSH Ultrasensible (Hormona Tiroestimulante)',
    category: 'INMUNOLOGIA',
    tubeType: 'SUERO_ROJO',
    price: 25.00,
    specimenType: 'Suero',
    tatHours: 3,
    astmMappingCode: 'TSH_3GEN',
    parameters: [
      { id: 'p-tsh', name: 'TSH Ultrasensible', unit: 'µIU/mL', astmParamCode: 'TSH', referenceRanges: [{ id: 'rr-tsh', gender: 'TODOS', minValue: 0.40, maxValue: 4.20, unit: 'µIU/mL' }] }
    ]
  },
  {
    id: 'test-t3-libre',
    tenantId: 'lab-san-jose',
    code: '5017',
    name: 'T3 Libre (Triyodotironina Libre)',
    category: 'INMUNOLOGIA',
    tubeType: 'SUERO_ROJO',
    price: 24.00,
    specimenType: 'Suero',
    tatHours: 3,
    astmMappingCode: 'FT3',
    parameters: [
      { id: 'p-ft3', name: 'T3 Libre', unit: 'pg/mL', astmParamCode: 'FT3', referenceRanges: [{ id: 'rr-ft3', gender: 'TODOS', minValue: 2.0, maxValue: 4.4, unit: 'pg/mL' }] }
    ]
  },
  {
    id: 'test-t4-libre',
    tenantId: 'lab-san-jose',
    code: '5018',
    name: 'T4 Libre (Tiroxina Libre)',
    category: 'INMUNOLOGIA',
    tubeType: 'SUERO_ROJO',
    price: 24.00,
    specimenType: 'Suero',
    tatHours: 3,
    astmMappingCode: 'FT4',
    parameters: [
      { id: 'p-ft4', name: 'T4 Libre', unit: 'ng/dL', astmParamCode: 'FT4', referenceRanges: [{ id: 'rr-ft4', gender: 'TODOS', minValue: 0.82, maxValue: 1.77, unit: 'ng/dL' }] }
    ]
  },
  {
    id: 'test-hcg',
    tenantId: 'lab-san-jose',
    code: '5004',
    name: 'Subunidad Beta HCG Cuantitativa (Prueba de Embarazo)',
    category: 'INMUNOLOGIA',
    tubeType: 'SUERO_ROJO',
    price: 20.00,
    specimenType: 'Suero',
    tatHours: 1,
    astmMappingCode: 'BHCG_QUANT',
    parameters: [
      { id: 'p-hcg', name: 'HCG Subunidad Beta Total', unit: 'mIU/mL', astmParamCode: 'BHCG', referenceRanges: [{ id: 'rr-hcg', gender: 'TODOS', minValue: 0, maxValue: 5.0, unit: 'mIU/mL' }] }
    ]
  },
  {
    id: 'test-psa',
    tenantId: 'lab-san-jose',
    code: '5019',
    name: 'Antígeno Prostático Específico (PSA Total y Libre)',
    category: 'INMUNOLOGIA',
    tubeType: 'SUERO_ROJO',
    price: 36.00,
    specimenType: 'Suero',
    tatHours: 3,
    astmMappingCode: 'PSA_PANEL',
    parameters: [
      { id: 'p-psa-tot', name: 'PSA Total', unit: 'ng/mL', astmParamCode: 'PSATOT', referenceRanges: [{ id: 'rr-psatot', gender: 'M', minValue: 0.0, maxValue: 4.0, unit: 'ng/mL' }] },
      { id: 'p-psa-libre', name: 'PSA Libre', unit: 'ng/mL', astmParamCode: 'PSAFREE', referenceRanges: [] },
      { id: 'p-psa-rel', name: 'Relación PSA Libre/Total', unit: '%', astmParamCode: 'PSAREL', referenceRanges: [{ id: 'rr-psarel', gender: 'M', minValue: 15.0, maxValue: 100.0, unit: '%' }] }
    ]
  },
  {
    id: 'test-vitamina-d',
    tenantId: 'lab-san-jose',
    code: '5020',
    name: '25-Hidroxi Vitamina D Total (D2 + D3)',
    category: 'INMUNOLOGIA',
    tubeType: 'SUERO_ROJO',
    price: 42.00,
    specimenType: 'Suero',
    tatHours: 4,
    astmMappingCode: 'VIT_D_TOT',
    parameters: [
      { id: 'p-vitd', name: '25-OH Vitamina D', unit: 'ng/mL', astmParamCode: 'VITD', referenceRanges: [{ id: 'rr-vitd', gender: 'TODOS', minValue: 30.0, maxValue: 100.0, unit: 'ng/mL' }] }
    ]
  },
  {
    id: 'test-ferritina',
    tenantId: 'lab-san-jose',
    code: '5021',
    name: 'Ferritina Sérica',
    category: 'INMUNOLOGIA',
    tubeType: 'SUERO_ROJO',
    price: 24.00,
    specimenType: 'Suero',
    tatHours: 2,
    astmMappingCode: 'FERRITIN',
    parameters: [
      { id: 'p-ferr', name: 'Ferritina', unit: 'ng/mL', astmParamCode: 'FERR', referenceRanges: [{ id: 'rr-ferr-m', gender: 'M', minValue: 30, maxValue: 400, unit: 'ng/mL' }, { id: 'rr-ferr-f', gender: 'F', minValue: 15, maxValue: 150, unit: 'ng/mL' }] }
    ]
  },

  // =========================================================================
  // 8. ÁREA DE MICROBIOLOGÍA CLÍNICA (LIS / HIS)
  // =========================================================================
  {
    id: 'test-urocultivo',
    tenantId: 'lab-san-jose',
    code: '6001',
    name: 'Urocultivo con Identificación y Antibiograma Automatizado',
    category: 'MICROBIOLOGIA',
    tubeType: 'ORINA',
    price: 32.00,
    specimenType: 'Orina Frasco Estéril',
    tatHours: 48,
    astmMappingCode: 'UROCULTIVO',
    parameters: [
      { id: 'p-uro-ufc', name: 'Recuento de Colonias', unit: 'UFC/mL', astmParamCode: 'UFC_ML', referenceRanges: [] },
      { id: 'p-uro-germen', name: 'Microorganismo Aislado', unit: 'Texto', astmParamCode: 'GERMEN_ID', referenceRanges: [] },
      { id: 'p-uro-antibiograma', name: 'Perfil Antibiograma (MIC CLSI/EUCAST)', unit: 'Texto', astmParamCode: 'ANTIBIOG', referenceRanges: [] }
    ]
  },
  {
    id: 'test-coprocultivo',
    tenantId: 'lab-san-jose',
    code: '6002',
    name: 'Coprocultivo para Patógenos Entéricos (Salmonella, Shigella, Campy)',
    category: 'MICROBIOLOGIA',
    tubeType: 'HECES',
    price: 35.00,
    specimenType: 'Heces Medio Cary-Blair',
    tatHours: 48,
    parameters: [
      { id: 'p-copro-aislamiento', name: 'Aislamiento Patógeno Fecal', unit: 'Texto', astmParamCode: 'COPRO_ISO', referenceRanges: [] }
    ]
  },
  {
    id: 'test-hemocultivo',
    tenantId: 'lab-san-jose',
    code: '6003',
    name: 'Hemocultivo Automatizado Frasco Aerobio y Anaerobio',
    category: 'MICROBIOLOGIA',
    tubeType: 'FRASCO_HEMOCULTIVO',
    price: 45.00,
    specimenType: 'Sangre Total Frasco Hemocultivo',
    tatHours: 72,
    astmMappingCode: 'BLOOD_CULT',
    parameters: [
      { id: 'p-hemo-aerobio', name: 'Frasco Aerobio (Monitoreo CO2)', unit: 'Texto', astmParamCode: 'HEMO_AERO', referenceRanges: [] },
      { id: 'p-hemo-anaerobio', name: 'Frasco Anaerobio (Monitoreo CO2)', unit: 'Texto', astmParamCode: 'HEMO_ANAERO', referenceRanges: [] },
      { id: 'p-hemo-germen', name: 'Identificación y Resistencia Bacteriana', unit: 'Texto', astmParamCode: 'HEMO_RES', referenceRanges: [] }
    ]
  },
  {
    id: 'test-cultivo-secreciones',
    tenantId: 'lab-san-jose',
    code: '6004',
    name: 'Cultivo de Secreción / Exudado con Antibiograma',
    category: 'MICROBIOLOGIA',
    tubeType: 'HISOPADO_MEDIO',
    price: 32.00,
    specimenType: 'Hisopado con Medio Stuart',
    tatHours: 48,
    parameters: [
      { id: 'p-sec-germen', name: 'Germen Aislado', unit: 'Texto', astmParamCode: 'SEC_GERM', referenceRanges: [] },
      { id: 'p-sec-anti', name: 'Antibiograma Cuantitativo', unit: 'Texto', astmParamCode: 'SEC_ANTI', referenceRanges: [] }
    ]
  },
  {
    id: 'test-gram',
    tenantId: 'lab-san-jose',
    code: '6005',
    name: 'Tinción de Gram Directa',
    category: 'MICROBIOLOGIA',
    tubeType: 'HISOPADO_MEDIO',
    price: 10.00,
    specimenType: 'Muestra Biológica en Lámina',
    tatHours: 1,
    parameters: [
      { id: 'p-gram-obs', name: 'Morfología Bacteriana Gram', unit: 'Texto', astmParamCode: 'GRAM_OBS', referenceRanges: [] },
      { id: 'p-gram-leu', name: 'Reacción Leucocitaria Inflamatoria', unit: 'Texto', astmParamCode: 'GRAM_LEU', referenceRanges: [] }
    ]
  },
  {
    id: 'test-baar',
    tenantId: 'lab-san-jose',
    code: '6006',
    name: 'Baciloscopía / Tinción Ziehl-Neelsen para BAAR (MINSA Tuberculosis)',
    category: 'MICROBIOLOGIA',
    tubeType: 'HISOPADO_MEDIO',
    price: 12.00,
    specimenType: 'Esputo / Muestra Clínica',
    tatHours: 4,
    parameters: [
      { id: 'p-baar', name: 'Recuento de Bacilos Ácido-Alcohol Resistentes', unit: 'Cruces/Texto', astmParamCode: 'BAAR_RES', referenceRanges: [] }
    ]
  },

  // =========================================================================
  // 9. ÁREA DE BANCO DE SANGRE & INMUNOHEMATOLOGÍA (MEDICINA TRANSFUSIONAL)
  // =========================================================================
  {
    id: 'test-grupo',
    tenantId: 'lab-san-jose',
    code: '7001',
    name: 'Tipificación ABO y Factor Rh (Doble Directa e Inversa + Du)',
    category: 'BANCO_SANGRE',
    tubeType: 'EDTA_MORADO',
    price: 12.00,
    specimenType: 'Sangre Total EDTA',
    tatHours: 1,
    astmMappingCode: 'ABO_RH_DU',
    parameters: [
      { id: 'p-grupo-dir', name: 'Tipificación Celular Directa (Anti-A, Anti-B, Anti-D)', unit: 'Texto', astmParamCode: 'ABO_DIR', referenceRanges: [] },
      { id: 'p-grupo-inv', name: 'Tipificación Sérica Inversa (Células A1 y B)', unit: 'Texto', astmParamCode: 'ABO_INV', referenceRanges: [] },
      { id: 'p-grupo-final', name: 'Grupo Sanguíneo ABO Confirmado', unit: 'Texto', astmParamCode: 'ABO_FINAL', referenceRanges: [] },
      { id: 'p-rh-final', name: 'Factor Rh (D)', unit: 'Texto', astmParamCode: 'RH_FINAL', referenceRanges: [] },
      { id: 'p-variante-du', name: 'Prueba de Du (D Débil)', unit: 'Texto', astmParamCode: 'DU_TEST', referenceRanges: [] }
    ]
  },
  {
    id: 'test-rai',
    tenantId: 'lab-san-jose',
    code: '7002',
    name: 'Rastreo de Anticuerpos Irregulares (RAI / Coombs Indirecto 3 Células)',
    category: 'BANCO_SANGRE',
    tubeType: 'SUERO_ROJO',
    price: 24.00,
    specimenType: 'Suero / Plasma',
    tatHours: 2,
    astmMappingCode: 'RAI_COOMBS_IND',
    parameters: [
      { id: 'p-rai-cel1', name: 'Célula I (Fenotipo Rh/Kell)', unit: 'Aglutinación', astmParamCode: 'RAI_C1', referenceRanges: [] },
      { id: 'p-rai-cel2', name: 'Célula II (Fenotipo Duffy/Kidd)', unit: 'Aglutinación', astmParamCode: 'RAI_C2', referenceRanges: [] },
      { id: 'p-rai-cel3', name: 'Célula III (Fenotipo MNS/Lewis)', unit: 'Aglutinación', astmParamCode: 'RAI_C3', referenceRanges: [] },
      { id: 'p-rai-resultado', name: 'Interpretación Rastreo de Anticuerpos', unit: 'Texto', astmParamCode: 'RAI_INTERP', referenceRanges: [] }
    ]
  },
  {
    id: 'test-coombs-directo',
    tenantId: 'lab-san-jose',
    code: '7003',
    name: 'Prueba de Antiglobulina Directa (Coombs Directo / TAD Poliespecífico)',
    category: 'BANCO_SANGRE',
    tubeType: 'EDTA_MORADO',
    price: 16.00,
    specimenType: 'Sangre Total EDTA',
    tatHours: 1,
    astmMappingCode: 'DAT_COOMBS_DIR',
    parameters: [
      { id: 'p-tad-poli', name: 'TAD Poliespecífico (Anti-IgG + Anti-C3d)', unit: 'Aglutinación', astmParamCode: 'TAD_POLI', referenceRanges: [] },
      { id: 'p-tad-igg', name: 'TAD Monoespecífico IgG', unit: 'Aglutinación', astmParamCode: 'TAD_IGG', referenceRanges: [] },
      { id: 'p-tad-c3d', name: 'TAD Monoespecífico C3d', unit: 'Aglutinación', astmParamCode: 'TAD_C3D', referenceRanges: [] }
    ]
  },
  {
    id: 'test-pruebas-cruzadas',
    tenantId: 'lab-san-jose',
    code: '7004',
    name: 'Pruebas Cruzadas de Compatibilidad Transfusional (Mayor y Menor)',
    category: 'BANCO_SANGRE',
    tubeType: 'SUERO_ROJO',
    price: 28.00,
    specimenType: 'Suero Receptor + Hematíes Donante',
    tatHours: 2,
    astmMappingCode: 'CROSSMATCH',
    parameters: [
      { id: 'p-cross-mayor', name: 'Prueba Mayor (Suero Receptor + Glóbulos Donante)', unit: 'Texto', astmParamCode: 'XM_MAYOR', referenceRanges: [] },
      { id: 'p-cross-menor', name: 'Prueba Menor (Plasma Donante + Glóbulos Receptor)', unit: 'Texto', astmParamCode: 'XM_MENOR', referenceRanges: [] },
      { id: 'p-cross-autocontrol', name: 'Autocontrol del Paciente Receptor', unit: 'Texto', astmParamCode: 'XM_AUTO', referenceRanges: [] },
      { id: 'p-cross-veredicto', name: 'Compatibilidad Transfusional Final', unit: 'Texto', astmParamCode: 'XM_VEREDICTO', referenceRanges: [] }
    ]
  },
  {
    id: 'test-tamizaje-donante',
    tenantId: 'lab-san-jose',
    code: '7005',
    name: 'Tamizaje Serológico Obligatorio Donantes de Sangre (MINSA Panamá)',
    category: 'BANCO_SANGRE',
    tubeType: 'SUERO_ROJO',
    price: 65.00,
    specimenType: 'Suero Donante',
    tatHours: 4,
    astmMappingCode: 'DONOR_PANEL_MINSA',
    parameters: [
      { id: 'p-don-hiv', name: '1. VIH 1/2 Ag p24 y Anticuerpos', unit: 'Index', astmParamCode: 'D_HIV', referenceRanges: [{ id: 'rr-dhiv', gender: 'TODOS', minValue: 0, maxValue: 0.99, unit: 'Index' }] },
      { id: 'p-don-hbsag', name: '2. Hepatitis B - HBsAg', unit: 'Index', astmParamCode: 'D_HBSAG', referenceRanges: [{ id: 'rr-dhbsag', gender: 'TODOS', minValue: 0, maxValue: 0.99, unit: 'Index' }] },
      { id: 'p-don-antihbc', name: '3. Hepatitis B - Anti-HBc Total', unit: 'Index', astmParamCode: 'D_HBCTOT', referenceRanges: [{ id: 'rr-dhbc', gender: 'TODOS', minValue: 0, maxValue: 0.99, unit: 'Index' }] },
      { id: 'p-don-hcv', name: '4. Hepatitis C - Anti-HCV', unit: 'Index', astmParamCode: 'D_HCV', referenceRanges: [{ id: 'rr-dhcv', gender: 'TODOS', minValue: 0, maxValue: 0.99, unit: 'Index' }] },
      { id: 'p-don-chagas', name: '5. Chagas - T. cruzi IgG/IgM', unit: 'Index', astmParamCode: 'D_CHAGAS', referenceRanges: [{ id: 'rr-dchagas', gender: 'TODOS', minValue: 0, maxValue: 0.99, unit: 'Index' }] },
      { id: 'p-don-sifilis', name: '6. Sífilis - Treponema pallidum / VDRL', unit: 'Index', astmParamCode: 'D_SIFILIS', referenceRanges: [{ id: 'rr-dsif', gender: 'TODOS', minValue: 0, maxValue: 0.99, unit: 'Index' }] },
      { id: 'p-don-htlv', name: '7. HTLV I/II Anticuerpos', unit: 'Index', astmParamCode: 'D_HTLV', referenceRanges: [{ id: 'rr-dhtlv', gender: 'TODOS', minValue: 0, maxValue: 0.99, unit: 'Index' }] }
    ]
  },
  {
    id: 'test-isoaglutininas',
    tenantId: 'lab-san-jose',
    code: '7006',
    name: 'Titulación de Isoaglutininas Anti-A y Anti-B',
    category: 'BANCO_SANGRE',
    tubeType: 'SUERO_ROJO',
    price: 26.00,
    specimenType: 'Suero',
    tatHours: 3,
    parameters: [
      { id: 'p-titer-anti-a', name: 'Título Anti-A (Fase Salina & Antiglobulina)', unit: 'Título', astmParamCode: 'TIT_A', referenceRanges: [] },
      { id: 'p-titer-anti-b', name: 'Título Anti-B (Fase Salina & Antiglobulina)', unit: 'Título', astmParamCode: 'TIT_B', referenceRanges: [] }
    ]
  },

  // =========================================================================
  // 10. ÁREA DE HIS & URGENCIAS / CUIDADOS CRÍTICOS / STAT
  // =========================================================================
  {
    id: 'test-troponina',
    tenantId: 'lab-san-jose',
    code: '8001',
    name: 'Troponina I de Alta Sensibilidad STAT (hs-cTnI)',
    category: 'GASOMETRIA_STAT',
    tubeType: 'SUERO_ROJO',
    price: 45.00,
    specimenType: 'Suero / Plasma Heparinizado',
    tatHours: 1,
    astmMappingCode: 'HS_TROP_I',
    parameters: [
      { id: 'p-trop-i', name: 'Troponina I hs', unit: 'ng/L (pg/mL)', astmParamCode: 'TROP_I', referenceRanges: [{ id: 'rr-trop-m', gender: 'M', minValue: 0.0, maxValue: 34.0, unit: 'ng/L' }, { id: 'rr-trop-f', gender: 'F', minValue: 0.0, maxValue: 16.0, unit: 'ng/L' }] }
    ]
  },
  {
    id: 'test-procalcitonina',
    tenantId: 'lab-san-jose',
    code: '8002',
    name: 'Procalcitonina Cuantitativa STAT (PCT Biomarcador Sepsis)',
    category: 'GASOMETRIA_STAT',
    tubeType: 'SUERO_ROJO',
    price: 48.00,
    specimenType: 'Suero',
    tatHours: 1,
    astmMappingCode: 'PCT_SEPSIS',
    parameters: [
      { id: 'p-pct', name: 'Procalcitonina (PCT)', unit: 'ng/mL', astmParamCode: 'PCT', referenceRanges: [{ id: 'rr-pct', gender: 'TODOS', minValue: 0.0, maxValue: 0.50, unit: 'ng/mL' }] }
    ]
  },
  {
    id: 'test-gasometria',
    tenantId: 'lab-san-jose',
    code: '8003',
    name: 'Gasometría Arterial STAT con Lactato & Calcio Iónico',
    category: 'GASOMETRIA_STAT',
    tubeType: 'HEPARINA_VERDE',
    price: 42.00,
    specimenType: 'Sangre Arterial Heparinizada',
    tatHours: 0.5,
    astmMappingCode: 'ABG_STAT',
    parameters: [
      { id: 'p-gas-ph', name: 'pH Arterial', unit: 'pH', astmParamCode: 'ABG_PH', referenceRanges: [{ id: 'rr-abg-ph', gender: 'TODOS', minValue: 7.35, maxValue: 7.45, unit: 'pH' }] },
      { id: 'p-gas-pco2', name: 'Presión Parcial de CO2 (pCO2)', unit: 'mmHg', astmParamCode: 'ABG_PCO2', referenceRanges: [{ id: 'rr-abg-pco2', gender: 'TODOS', minValue: 35.0, maxValue: 45.0, unit: 'mmHg' }] },
      { id: 'p-gas-po2', name: 'Presión Parcial de O2 (pO2)', unit: 'mmHg', astmParamCode: 'ABG_PO2', referenceRanges: [{ id: 'rr-abg-po2', gender: 'TODOS', minValue: 80.0, maxValue: 100.0, unit: 'mmHg' }] },
      { id: 'p-gas-hco3', name: 'Bicarbonato Real (HCO3-)', unit: 'mEq/L', astmParamCode: 'ABG_HCO3', referenceRanges: [{ id: 'rr-abg-hco3', gender: 'TODOS', minValue: 22.0, maxValue: 26.0, unit: 'mEq/L' }] },
      { id: 'p-gas-be', name: 'Exceso de Base (BE)', unit: 'mEq/L', astmParamCode: 'ABG_BE', referenceRanges: [{ id: 'rr-abg-be', gender: 'TODOS', minValue: -2.0, maxValue: 2.0, unit: 'mEq/L' }] },
      { id: 'p-gas-sato2', name: 'Saturación de Oxígeno (SatO2)', unit: '%', astmParamCode: 'ABG_SATO2', referenceRanges: [{ id: 'rr-abg-sat', gender: 'TODOS', minValue: 95.0, maxValue: 99.0, unit: '%' }] },
      { id: 'p-gas-lac', name: 'Lactato Sérico Arterial', unit: 'mmol/L', astmParamCode: 'ABG_LAC', referenceRanges: [{ id: 'rr-abg-lac', gender: 'TODOS', minValue: 0.5, maxValue: 1.6, unit: 'mmol/L' }] },
      { id: 'p-gas-ica', name: 'Calcio Iónico (iCa)', unit: 'mmol/L', astmParamCode: 'ABG_ICA', referenceRanges: [{ id: 'rr-abg-ica', gender: 'TODOS', minValue: 1.15, maxValue: 1.33, unit: 'mmol/L' }] }
    ]
  },
  {
    id: 'test-probnp',
    tenantId: 'lab-san-jose',
    code: '8004',
    name: 'Péptido Natriurético Cerebral (NT-proBNP STAT)',
    category: 'GASOMETRIA_STAT',
    tubeType: 'SUERO_ROJO',
    price: 55.00,
    specimenType: 'Suero',
    tatHours: 1,
    astmMappingCode: 'NT_PROBNP',
    parameters: [
      { id: 'p-probnp', name: 'NT-proBNP Cuantitativo', unit: 'pg/mL', astmParamCode: 'PROBNP', referenceRanges: [{ id: 'rr-bnp', gender: 'TODOS', minValue: 0, maxValue: 125, unit: 'pg/mL' }] }
    ]
  },
  // =========================================================================
  // 11. ÁREA DE BIOLOGÍA MOLECULAR Y GENÉTICA
  // =========================================================================
  {
    id: 'test-pcr-respiratorio',
    tenantId: 'lab-san-jose',
    code: '9001',
    name: 'Panel Respiratorio Multiplex RT-PCR (SARS-CoV-2 / Flu A/B / VRS)',
    category: 'BIOLOGIA_MOLECULAR',
    tubeType: 'HISOPADO_MEDIO',
    price: 95.00,
    specimenType: 'Hisopado Nasofaríngeo en Medio Viral',
    tatHours: 4,
    astmMappingCode: 'RT_PCR_RESP',
    parameters: [
      { id: 'p-pcr-sars', name: 'SARS-CoV-2 RNA', unit: 'Cualitativo', astmParamCode: 'SARS_RNA', referenceRanges: [{ id: 'rr-sars', gender: 'TODOS', minValue: 0, maxValue: 0, unit: 'Cualitativo' }] },
      { id: 'p-pcr-flua', name: 'Influenza A RNA', unit: 'Cualitativo', astmParamCode: 'FLUA_RNA', referenceRanges: [{ id: 'rr-flua', gender: 'TODOS', minValue: 0, maxValue: 0, unit: 'Cualitativo' }] },
      { id: 'p-pcr-flub', name: 'Influenza B RNA', unit: 'Cualitativo', astmParamCode: 'FLUB_RNA', referenceRanges: [{ id: 'rr-flub', gender: 'TODOS', minValue: 0, maxValue: 0, unit: 'Cualitativo' }] },
      { id: 'p-pcr-vrs', name: 'Virus Sincitial Respiratorio (VRS)', unit: 'Cualitativo', astmParamCode: 'VRS_RNA', referenceRanges: [{ id: 'rr-vrs', gender: 'TODOS', minValue: 0, maxValue: 0, unit: 'Cualitativo' }] }
    ]
  },
  {
    id: 'test-carga-viral-hiv',
    tenantId: 'lab-san-jose',
    code: '9002',
    name: 'Carga Viral VIH-1 por RT-qPCR Cuantitativo (copias/mL)',
    category: 'BIOLOGIA_MOLECULAR',
    tubeType: 'EDTA_MORADO',
    price: 130.00,
    specimenType: 'Plasma EDTA',
    tatHours: 24,
    astmMappingCode: 'HIV_VL_PCR',
    parameters: [
      { id: 'p-hiv-vl-copies', name: 'VIH-1 ARN (Copias/mL)', unit: 'copias/mL', astmParamCode: 'HIV_COPIES', referenceRanges: [{ id: 'rr-hiv-cp', gender: 'TODOS', minValue: 0, maxValue: 40, unit: 'copias/mL' }] },
      { id: 'p-hiv-vl-log', name: 'VIH-1 ARN Log10', unit: 'Log10 copias/mL', astmParamCode: 'HIV_LOG', referenceRanges: [{ id: 'rr-hiv-log', gender: 'TODOS', minValue: 0, maxValue: 1.6, unit: 'Log10' }] }
    ]
  },
  {
    id: 'test-pcr-vph',
    tenantId: 'lab-san-jose',
    code: '9003',
    name: 'Tipificación de VPH Alto Riesgo por RT-PCR en Tiempo Real',
    category: 'BIOLOGIA_MOLECULAR',
    tubeType: 'HISOPADO_MEDIO',
    price: 85.00,
    specimenType: 'Cepillado Cervical en PreservCyt',
    tatHours: 24,
    astmMappingCode: 'HPV_HR_PCR',
    parameters: [
      { id: 'p-vph-16', name: 'VPH Genotipo 16', unit: 'Cualitativo', astmParamCode: 'HPV16', referenceRanges: [] },
      { id: 'p-vph-18', name: 'VPH Genotipo 18', unit: 'Cualitativo', astmParamCode: 'HPV18', referenceRanges: [] },
      { id: 'p-vph-otros', name: 'Panel Otros Alto Riesgo (31, 33, 45, 52, 58)', unit: 'Cualitativo', astmParamCode: 'HPV_OTHER_HR', referenceRanges: [] }
    ]
  },
  // =========================================================================
  // 12. ÁREA DE TOXICOLOGÍA & MONITOREO DE FÁRMACOS
  // =========================================================================
  {
    id: 'test-drogas-abuso',
    tenantId: 'lab-san-jose',
    code: '9101',
    name: 'Panel Toxicológico de Drogas de Abuso en Orina (10 Paneles)',
    category: 'TOXICOLOGIA',
    tubeType: 'ORINA',
    price: 45.00,
    specimenType: 'Orina Espontánea con Cadena de Custodia',
    tatHours: 2,
    astmMappingCode: 'TOX_10_PANEL',
    parameters: [
      { id: 'p-tox-thc', name: 'Canabinoides (THC/Marihuana)', unit: 'ng/mL', astmParamCode: 'TOX_THC', referenceRanges: [{ id: 'rr-thc', gender: 'TODOS', minValue: 0, maxValue: 50, unit: 'ng/mL' }] },
      { id: 'p-tox-coc', name: 'Cocaína (Benzoilecgonina)', unit: 'ng/mL', astmParamCode: 'TOX_COC', referenceRanges: [{ id: 'rr-coc', gender: 'TODOS', minValue: 0, maxValue: 150, unit: 'ng/mL' }] },
      { id: 'p-tox-amp', name: 'Anfetaminas (AMP)', unit: 'ng/mL', astmParamCode: 'TOX_AMP', referenceRanges: [{ id: 'rr-amp', gender: 'TODOS', minValue: 0, maxValue: 500, unit: 'ng/mL' }] },
      { id: 'p-tox-opi', name: 'Opiáceos (Morfina / Heroína)', unit: 'ng/mL', astmParamCode: 'TOX_OPI', referenceRanges: [{ id: 'rr-opi', gender: 'TODOS', minValue: 0, maxValue: 300, unit: 'ng/mL' }] },
      { id: 'p-tox-bzd', name: 'Benzodiacepinas (BZD)', unit: 'ng/mL', astmParamCode: 'TOX_BZD', referenceRanges: [{ id: 'rr-bzd', gender: 'TODOS', minValue: 0, maxValue: 200, unit: 'ng/mL' }] }
    ]
  },
  {
    id: 'test-alcohol-sangre',
    tenantId: 'lab-san-jose',
    code: '9102',
    name: 'Alcoholemia Cuantitativa en Sangre Total (Etanol Enzimático)',
    category: 'TOXICOLOGIA',
    tubeType: 'SUERO_ROJO',
    price: 32.00,
    specimenType: 'Sangre Total Fluoruro de Sodio / Suero',
    tatHours: 1,
    astmMappingCode: 'ETHANOL_STAT',
    parameters: [
      { id: 'p-etanol', name: 'Etanol / Alcohol Etílico', unit: 'mg/dL', astmParamCode: 'ALC_ETOH', referenceRanges: [{ id: 'rr-etoh', gender: 'TODOS', minValue: 0, maxValue: 10, unit: 'mg/dL' }] }
    ]
  },
  // =========================================================================
  // 13. ÁREA DE ANATOMÍA PATOLÓGICA & HISTOPATOLOGÍA
  // =========================================================================
  {
    id: 'test-biopsia-quirurgica',
    tenantId: 'lab-san-jose',
    code: '9201',
    name: 'Estudio Histopatológico de Biopsia Quirúrgica / Pieza Operatoria',
    category: 'ANATOMIA_PATOLOGICA',
    tubeType: 'FORMOL_10',
    price: 75.00,
    specimenType: 'Tejido Fijado en Formalina al 10% Tamponada',
    tatHours: 72,
    astmMappingCode: 'HISTOPATH_BIOPSY',
    parameters: [
      { id: 'p-ap-macro', name: 'Descripción Macroscópica', unit: 'Texto Descriptivo', astmParamCode: 'AP_MACRO', referenceRanges: [] },
      { id: 'p-ap-micro', name: 'Descripción Microscópica', unit: 'Texto Descriptivo', astmParamCode: 'AP_MICRO', referenceRanges: [] },
      { id: 'p-ap-diag', name: 'Diagnóstico Histopatológico Definitivo', unit: 'Diagnóstico Patólogo', astmParamCode: 'AP_DIAG', referenceRanges: [] }
    ]
  },
  // =========================================================================
  // 14. ÁREA DE CITOLOGÍA CERVICOVAGINAL & LÍQUIDOS
  // =========================================================================
  {
    id: 'test-papanicolau',
    tenantId: 'lab-san-jose',
    code: '9301',
    name: 'Citología Cervicovaginal en Base Líquida (Papanicolaou Bethesda)',
    category: 'CITOLOGIA',
    tubeType: 'FRASCO_ESTERIL',
    price: 30.00,
    specimenType: 'Muestra Citológica Exocérvix y Endocérvix en PreservCyt',
    tatHours: 48,
    astmMappingCode: 'PAP_BETHESDA',
    parameters: [
      { id: 'p-pap-calidad', name: 'Calidad de la Muestra', unit: 'Criterio Bethesda', astmParamCode: 'PAP_QUAL', referenceRanges: [] },
      { id: 'p-pap-diag', name: 'Categoría General / Diagnóstico Citológico', unit: 'Criterio Bethesda', astmParamCode: 'PAP_DIAG', referenceRanges: [] }
    ]
  }
,
  {
    id: "test-cortisol-am",
    tenantId: "lab-san-jose",
    code: "3101",
    name: "Cortisol Sérico Matutino (AM - 8:00 AM)",
    category: "ENDOCRINOLOGIA",
    tubeType: "SUERO_ROJO",
    price: 24,
    specimenType: "Suero",
    tatHours: 4,
    astmMappingCode: "CORT_AM",
    parameters: [
      {
        id: "p-cort-am",
        name: "Cortisol AM",
        unit: "µg/dL",
        astmParamCode: "CORT_AM",
        referenceRanges: [
          {
            id: "rr-cort-am",
            gender: "TODOS",
            minValue: 4.5,
            maxValue: 22,
            unit: "µg/dL"
          }
        ]
      }
    ]
  },
  {
    id: "test-cortisol-pm",
    tenantId: "lab-san-jose",
    code: "3102",
    name: "Cortisol Sérico Vespertino (PM - 4:00 PM)",
    category: "ENDOCRINOLOGIA",
    tubeType: "SUERO_ROJO",
    price: 24,
    specimenType: "Suero",
    tatHours: 4,
    astmMappingCode: "CORT_PM",
    parameters: [
      {
        id: "p-cort-pm",
        name: "Cortisol PM",
        unit: "µg/dL",
        astmParamCode: "CORT_PM",
        referenceRanges: [
          {
            id: "rr-cort-pm",
            gender: "TODOS",
            minValue: 3,
            maxValue: 10,
            unit: "µg/dL"
          }
        ]
      }
    ]
  },
  {
    id: "test-acth",
    tenantId: "lab-san-jose",
    code: "3103",
    name: "Hormona Adrenocorticotropa (ACTH Plasmática)",
    category: "ENDOCRINOLOGIA",
    tubeType: "EDTA_MORADO",
    price: 38,
    specimenType: "Plasma EDTA Congelado",
    tatHours: 24,
    astmMappingCode: "ACTH_PLAS",
    parameters: [
      {
        id: "p-acth",
        name: "ACTH Plasmática",
        unit: "pg/mL",
        astmParamCode: "ACTH",
        referenceRanges: [
          {
            id: "rr-acth",
            gender: "TODOS",
            minValue: 7.2,
            maxValue: 63.3,
            unit: "pg/mL"
          }
        ]
      }
    ]
  },
  {
    id: "test-prolactina",
    tenantId: "lab-san-jose",
    code: "3104",
    name: "Prolactina Sérica",
    category: "ENDOCRINOLOGIA",
    tubeType: "SUERO_ROJO",
    price: 22,
    specimenType: "Suero",
    tatHours: 4,
    astmMappingCode: "PRL",
    parameters: [
      {
        id: "p-prl",
        name: "Prolactina",
        unit: "ng/mL",
        astmParamCode: "PRL",
        referenceRanges: [
          {
            id: "rr-prl-m",
            gender: "M",
            minValue: 2,
            maxValue: 18,
            unit: "ng/mL"
          },
          {
            id: "rr-prl-f",
            gender: "F",
            minValue: 3,
            maxValue: 25,
            unit: "ng/mL"
          }
        ]
      }
    ]
  },
  {
    id: "test-fsh",
    tenantId: "lab-san-jose",
    code: "3105",
    name: "Hormona Foliculoestimulante (FSH)",
    category: "ENDOCRINOLOGIA",
    tubeType: "SUERO_ROJO",
    price: 22,
    specimenType: "Suero",
    tatHours: 4,
    astmMappingCode: "FSH",
    parameters: [
      {
        id: "p-fsh",
        name: "FSH",
        unit: "mIU/mL",
        astmParamCode: "FSH",
        referenceRanges: [
          {
            id: "rr-fsh",
            gender: "TODOS",
            minValue: 1.5,
            maxValue: 12.4,
            unit: "mIU/mL"
          }
        ]
      }
    ]
  },
  {
    id: "test-lh",
    tenantId: "lab-san-jose",
    code: "3106",
    name: "Hormona Luteinizante (LH)",
    category: "ENDOCRINOLOGIA",
    tubeType: "SUERO_ROJO",
    price: 22,
    specimenType: "Suero",
    tatHours: 4,
    astmMappingCode: "LH",
    parameters: [
      {
        id: "p-lh",
        name: "LH",
        unit: "mIU/mL",
        astmParamCode: "LH",
        referenceRanges: [
          {
            id: "rr-lh",
            gender: "TODOS",
            minValue: 1.7,
            maxValue: 8.6,
            unit: "mIU/mL"
          }
        ]
      }
    ]
  },
  {
    id: "test-estradiol",
    tenantId: "lab-san-jose",
    code: "3107",
    name: "Estradiol Sérico (E2)",
    category: "ENDOCRINOLOGIA",
    tubeType: "SUERO_ROJO",
    price: 25,
    specimenType: "Suero",
    tatHours: 4,
    astmMappingCode: "E2_ESTRA",
    parameters: [
      {
        id: "p-e2",
        name: "Estradiol (E2)",
        unit: "pg/mL",
        astmParamCode: "E2",
        referenceRanges: [
          {
            id: "rr-e2",
            gender: "TODOS",
            minValue: 15,
            maxValue: 350,
            unit: "pg/mL"
          }
        ]
      }
    ]
  },
  {
    id: "test-progesterona",
    tenantId: "lab-san-jose",
    code: "3108",
    name: "Progesterona Sérica",
    category: "ENDOCRINOLOGIA",
    tubeType: "SUERO_ROJO",
    price: 24,
    specimenType: "Suero",
    tatHours: 4,
    astmMappingCode: "PROG",
    parameters: [
      {
        id: "p-prog",
        name: "Progesterona",
        unit: "ng/mL",
        astmParamCode: "PROG",
        referenceRanges: [
          {
            id: "rr-prog",
            gender: "TODOS",
            minValue: 0.2,
            maxValue: 25,
            unit: "ng/mL"
          }
        ]
      }
    ]
  },
  {
    id: "test-testosterona-total",
    tenantId: "lab-san-jose",
    code: "3109",
    name: "Testosterona Total",
    category: "ENDOCRINOLOGIA",
    tubeType: "SUERO_ROJO",
    price: 25,
    specimenType: "Suero",
    tatHours: 4,
    astmMappingCode: "TESTO_TOT",
    parameters: [
      {
        id: "p-testo-tot",
        name: "Testosterona Total",
        unit: "ng/dL",
        astmParamCode: "TESTO",
        referenceRanges: [
          {
            id: "rr-testo-m",
            gender: "M",
            minValue: 280,
            maxValue: 1100,
            unit: "ng/dL"
          },
          {
            id: "rr-testo-f",
            gender: "F",
            minValue: 15,
            maxValue: 70,
            unit: "ng/dL"
          }
        ]
      }
    ]
  },
  {
    id: "test-testosterona-libre",
    tenantId: "lab-san-jose",
    code: "3110",
    name: "Testosterona Libre Calculada / Diálisis",
    category: "ENDOCRINOLOGIA",
    tubeType: "SUERO_ROJO",
    price: 36,
    specimenType: "Suero",
    tatHours: 24,
    astmMappingCode: "TESTO_FREE",
    parameters: [
      {
        id: "p-testo-free",
        name: "Testosterona Libre",
        unit: "pg/mL",
        astmParamCode: "TESTO_F",
        referenceRanges: [
          {
            id: "rr-testo-free",
            gender: "TODOS",
            minValue: 4.5,
            maxValue: 25,
            unit: "pg/mL"
          }
        ]
      }
    ]
  },
  {
    id: "test-dhea-so4",
    tenantId: "lab-san-jose",
    code: "3111",
    name: "DHEA-SO4 (Dehidroepiandrosterona Sulfato)",
    category: "ENDOCRINOLOGIA",
    tubeType: "SUERO_ROJO",
    price: 28,
    specimenType: "Suero",
    tatHours: 4,
    astmMappingCode: "DHEAS",
    parameters: [
      {
        id: "p-dheas",
        name: "DHEA-SO4",
        unit: "µg/dL",
        astmParamCode: "DHEAS",
        referenceRanges: [
          {
            id: "rr-dheas",
            gender: "TODOS",
            minValue: 35,
            maxValue: 430,
            unit: "µg/dL"
          }
        ]
      }
    ]
  },
  {
    id: "test-17-oh-prog",
    tenantId: "lab-san-jose",
    code: "3112",
    name: "17-Hidroxiprogesterona (17-OHP)",
    category: "ENDOCRINOLOGIA",
    tubeType: "SUERO_ROJO",
    price: 32,
    specimenType: "Suero",
    tatHours: 24,
    astmMappingCode: "17_OHP",
    parameters: [
      {
        id: "p-17ohp",
        name: "17-OH Progesterona",
        unit: "ng/mL",
        astmParamCode: "17OHP",
        referenceRanges: [
          {
            id: "rr-17ohp",
            gender: "TODOS",
            minValue: 0.2,
            maxValue: 2.3,
            unit: "ng/mL"
          }
        ]
      }
    ]
  },
  {
    id: "test-insulina",
    tenantId: "lab-san-jose",
    code: "3113",
    name: "Insulina Basal en Ayunas",
    category: "ENDOCRINOLOGIA",
    tubeType: "SUERO_ROJO",
    price: 24,
    specimenType: "Suero",
    tatHours: 4,
    astmMappingCode: "INSULIN",
    parameters: [
      {
        id: "p-ins",
        name: "Insulina Basal",
        unit: "µIU/mL",
        astmParamCode: "INS",
        referenceRanges: [
          {
            id: "rr-ins",
            gender: "TODOS",
            minValue: 2.6,
            maxValue: 24.9,
            unit: "µIU/mL"
          }
        ]
      }
    ]
  },
  {
    id: "test-homa-ir",
    tenantId: "lab-san-jose",
    code: "3114",
    name: "Índice HOMA-IR (Resistencia a la Insulina)",
    category: "ENDOCRINOLOGIA",
    tubeType: "SUERO_ROJO",
    price: 30,
    specimenType: "Suero (Glucosa + Insulina)",
    tatHours: 4,
    astmMappingCode: "HOMA_IR",
    parameters: [
      {
        id: "p-homa",
        name: "Índice HOMA-IR",
        unit: "Índice",
        astmParamCode: "HOMA",
        referenceRanges: [
          {
            id: "rr-homa",
            gender: "TODOS",
            minValue: 0.5,
            maxValue: 2.5,
            unit: "Índice"
          }
        ]
      }
    ]
  },
  {
    id: "test-peptido-c",
    tenantId: "lab-san-jose",
    code: "3115",
    name: "Péptido C Cuantitativo",
    category: "ENDOCRINOLOGIA",
    tubeType: "SUERO_ROJO",
    price: 28,
    specimenType: "Suero",
    tatHours: 4,
    astmMappingCode: "C_PEPTIDE",
    parameters: [
      {
        id: "p-cpep",
        name: "Péptido C",
        unit: "ng/mL",
        astmParamCode: "CPEP",
        referenceRanges: [
          {
            id: "rr-cpep",
            gender: "TODOS",
            minValue: 1.1,
            maxValue: 4.4,
            unit: "ng/mL"
          }
        ]
      }
    ]
  },
  {
    id: "test-pth",
    tenantId: "lab-san-jose",
    code: "3116",
    name: "Paratohormona Intacta (PTH)",
    category: "ENDOCRINOLOGIA",
    tubeType: "EDTA_MORADO",
    price: 35,
    specimenType: "Plasma EDTA",
    tatHours: 4,
    astmMappingCode: "PTH_INTACT",
    parameters: [
      {
        id: "p-pth",
        name: "PTH Intacta",
        unit: "pg/mL",
        astmParamCode: "PTH",
        referenceRanges: [
          {
            id: "rr-pth",
            gender: "TODOS",
            minValue: 15,
            maxValue: 65,
            unit: "pg/mL"
          }
        ]
      }
    ]
  },
  {
    id: "test-gh",
    tenantId: "lab-san-jose",
    code: "3117",
    name: "Hormona del Crecimiento (GH / Somatotropina)",
    category: "ENDOCRINOLOGIA",
    tubeType: "SUERO_ROJO",
    price: 26,
    specimenType: "Suero",
    tatHours: 4,
    astmMappingCode: "GH_HORM",
    parameters: [
      {
        id: "p-gh",
        name: "Hormona de Crecimiento",
        unit: "ng/mL",
        astmParamCode: "GH",
        referenceRanges: [
          {
            id: "rr-gh",
            gender: "TODOS",
            minValue: 0.05,
            maxValue: 5,
            unit: "ng/mL"
          }
        ]
      }
    ]
  },
  {
    id: "test-igf1",
    tenantId: "lab-san-jose",
    code: "3118",
    name: "Factor de Crecimiento Insulínico tipo 1 (IGF-1 / Somatomedina C)",
    category: "ENDOCRINOLOGIA",
    tubeType: "SUERO_ROJO",
    price: 36,
    specimenType: "Suero",
    tatHours: 24,
    astmMappingCode: "IGF1_SOM",
    parameters: [
      {
        id: "p-igf1",
        name: "IGF-1",
        unit: "ng/mL",
        astmParamCode: "IGF1",
        referenceRanges: [
          {
            id: "rr-igf1",
            gender: "TODOS",
            minValue: 115,
            maxValue: 307,
            unit: "ng/mL"
          }
        ]
      }
    ]
  },
  {
    id: "test-cea",
    tenantId: "lab-san-jose",
    code: "3201",
    name: "Antígeno Carcinoembrionario (CEA)",
    category: "MARCADORES_TUMORALES",
    tubeType: "SUERO_ROJO",
    price: 28,
    specimenType: "Suero",
    tatHours: 4,
    astmMappingCode: "CEA_TUMOR",
    parameters: [
      {
        id: "p-cea",
        name: "CEA",
        unit: "ng/mL",
        astmParamCode: "CEA",
        referenceRanges: [
          {
            id: "rr-cea-nf",
            gender: "TODOS",
            minValue: 0,
            maxValue: 3,
            unit: "ng/mL"
          }
        ]
      }
    ]
  },
  {
    id: "test-afp",
    tenantId: "lab-san-jose",
    code: "3202",
    name: "Alfa-Fetoproteína (AFP)",
    category: "MARCADORES_TUMORALES",
    tubeType: "SUERO_ROJO",
    price: 28,
    specimenType: "Suero",
    tatHours: 4,
    astmMappingCode: "AFP_TUMOR",
    parameters: [
      {
        id: "p-afp",
        name: "Alfa-Fetoproteína",
        unit: "ng/mL",
        astmParamCode: "AFP",
        referenceRanges: [
          {
            id: "rr-afp",
            gender: "TODOS",
            minValue: 0,
            maxValue: 8,
            unit: "ng/mL"
          }
        ]
      }
    ]
  },
  {
    id: "test-ca125",
    tenantId: "lab-san-jose",
    code: "3203",
    name: "Antígeno CA 125 (Marcador Ovárico)",
    category: "MARCADORES_TUMORALES",
    tubeType: "SUERO_ROJO",
    price: 32,
    specimenType: "Suero",
    tatHours: 4,
    astmMappingCode: "CA_125",
    parameters: [
      {
        id: "p-ca125",
        name: "CA 125",
        unit: "U/mL",
        astmParamCode: "CA125",
        referenceRanges: [
          {
            id: "rr-ca125",
            gender: "TODOS",
            minValue: 0,
            maxValue: 35,
            unit: "U/mL"
          }
        ]
      }
    ]
  },
  {
    id: "test-ca19-9",
    tenantId: "lab-san-jose",
    code: "3204",
    name: "Antígeno CA 19-9 (Marcador Gastrointestinal / Pancreático)",
    category: "MARCADORES_TUMORALES",
    tubeType: "SUERO_ROJO",
    price: 34,
    specimenType: "Suero",
    tatHours: 4,
    astmMappingCode: "CA_19_9",
    parameters: [
      {
        id: "p-ca199",
        name: "CA 19-9",
        unit: "U/mL",
        astmParamCode: "CA199",
        referenceRanges: [
          {
            id: "rr-ca199",
            gender: "TODOS",
            minValue: 0,
            maxValue: 37,
            unit: "U/mL"
          }
        ]
      }
    ]
  },
  {
    id: "test-ca15-3",
    tenantId: "lab-san-jose",
    code: "3205",
    name: "Antígeno CA 15-3 (Marcador Mamario)",
    category: "MARCADORES_TUMORALES",
    tubeType: "SUERO_ROJO",
    price: 32,
    specimenType: "Suero",
    tatHours: 4,
    astmMappingCode: "CA_15_3",
    parameters: [
      {
        id: "p-ca153",
        name: "CA 15-3",
        unit: "U/mL",
        astmParamCode: "CA153",
        referenceRanges: [
          {
            id: "rr-ca153",
            gender: "TODOS",
            minValue: 0,
            maxValue: 31,
            unit: "U/mL"
          }
        ]
      }
    ]
  },
  {
    id: "test-tiroglobulina",
    tenantId: "lab-san-jose",
    code: "3206",
    name: "Tiroglobulina Sérica Cuantitativa",
    category: "MARCADORES_TUMORALES",
    tubeType: "SUERO_ROJO",
    price: 34,
    specimenType: "Suero",
    tatHours: 4,
    astmMappingCode: "TG_SERUM",
    parameters: [
      {
        id: "p-tg",
        name: "Tiroglobulina",
        unit: "ng/mL",
        astmParamCode: "TG",
        referenceRanges: [
          {
            id: "rr-tg",
            gender: "TODOS",
            minValue: 1.4,
            maxValue: 78,
            unit: "ng/mL"
          }
        ]
      }
    ]
  },
  {
    id: "test-beta2-micro",
    tenantId: "lab-san-jose",
    code: "3207",
    name: "Beta-2 Microglobulina Sérica",
    category: "MARCADORES_TUMORALES",
    tubeType: "SUERO_ROJO",
    price: 28,
    specimenType: "Suero",
    tatHours: 4,
    astmMappingCode: "B2_MICRO",
    parameters: [
      {
        id: "p-b2m",
        name: "Beta-2 Microglobulina",
        unit: "mg/L",
        astmParamCode: "B2M",
        referenceRanges: [
          {
            id: "rr-b2m",
            gender: "TODOS",
            minValue: 0.8,
            maxValue: 2.2,
            unit: "mg/L"
          }
        ]
      }
    ]
  },
  {
    id: "test-vitamina-b12",
    tenantId: "lab-san-jose",
    code: "3301",
    name: "Vitamina B12 (Cianocobalamina)",
    category: "INMUNOLOGIA",
    tubeType: "SUERO_ROJO",
    price: 26,
    specimenType: "Suero",
    tatHours: 4,
    astmMappingCode: "VIT_B12",
    parameters: [
      {
        id: "p-b12",
        name: "Vitamina B12",
        unit: "pg/mL",
        astmParamCode: "B12",
        referenceRanges: [
          {
            id: "rr-b12",
            gender: "TODOS",
            minValue: 200,
            maxValue: 900,
            unit: "pg/mL"
          }
        ]
      }
    ]
  },
  {
    id: "test-acido-folico",
    tenantId: "lab-san-jose",
    code: "3302",
    name: "Ácido Fólico Sérico (Folato)",
    category: "INMUNOLOGIA",
    tubeType: "SUERO_ROJO",
    price: 24,
    specimenType: "Suero",
    tatHours: 4,
    astmMappingCode: "FOLATE",
    parameters: [
      {
        id: "p-fol",
        name: "Ácido Fólico",
        unit: "ng/mL",
        astmParamCode: "FOL",
        referenceRanges: [
          {
            id: "rr-fol",
            gender: "TODOS",
            minValue: 3.1,
            maxValue: 17.5,
            unit: "ng/mL"
          }
        ]
      }
    ]
  },
  {
    id: "test-iga",
    tenantId: "lab-san-jose",
    code: "3303",
    name: "Inmunoglobulina A (IgA Cuantitativa)",
    category: "INMUNOLOGIA",
    tubeType: "SUERO_ROJO",
    price: 22,
    specimenType: "Suero",
    tatHours: 4,
    astmMappingCode: "IGA_QUANT",
    parameters: [
      {
        id: "p-iga",
        name: "IgA",
        unit: "mg/dL",
        astmParamCode: "IGA",
        referenceRanges: [
          {
            id: "rr-iga",
            gender: "TODOS",
            minValue: 70,
            maxValue: 400,
            unit: "mg/dL"
          }
        ]
      }
    ]
  },
  {
    id: "test-igg",
    tenantId: "lab-san-jose",
    code: "3304",
    name: "Inmunoglobulina G (IgG Cuantitativa)",
    category: "INMUNOLOGIA",
    tubeType: "SUERO_ROJO",
    price: 22,
    specimenType: "Suero",
    tatHours: 4,
    astmMappingCode: "IGG_QUANT",
    parameters: [
      {
        id: "p-igg",
        name: "IgG",
        unit: "mg/dL",
        astmParamCode: "IGG",
        referenceRanges: [
          {
            id: "rr-igg",
            gender: "TODOS",
            minValue: 700,
            maxValue: 1600,
            unit: "mg/dL"
          }
        ]
      }
    ]
  },
  {
    id: "test-igm",
    tenantId: "lab-san-jose",
    code: "3305",
    name: "Inmunoglobulina M (IgM Cuantitativa)",
    category: "INMUNOLOGIA",
    tubeType: "SUERO_ROJO",
    price: 22,
    specimenType: "Suero",
    tatHours: 4,
    astmMappingCode: "IGM_QUANT",
    parameters: [
      {
        id: "p-igm",
        name: "IgM",
        unit: "mg/dL",
        astmParamCode: "IGM",
        referenceRanges: [
          {
            id: "rr-igm",
            gender: "TODOS",
            minValue: 40,
            maxValue: 230,
            unit: "mg/dL"
          }
        ]
      }
    ]
  },
  {
    id: "test-ige-total",
    tenantId: "lab-san-jose",
    code: "3306",
    name: "Inmunoglobulina E Total (IgE Alergia)",
    category: "INMUNOLOGIA",
    tubeType: "SUERO_ROJO",
    price: 25,
    specimenType: "Suero",
    tatHours: 4,
    astmMappingCode: "IGE_TOTAL",
    parameters: [
      {
        id: "p-ige",
        name: "IgE Total",
        unit: "IU/mL",
        astmParamCode: "IGE",
        referenceRanges: [
          {
            id: "rr-ige",
            gender: "TODOS",
            minValue: 0,
            maxValue: 100,
            unit: "IU/mL"
          }
        ]
      }
    ]
  },
  {
    id: "test-c3",
    tenantId: "lab-san-jose",
    code: "3307",
    name: "Complemento C3",
    category: "INMUNOLOGIA",
    tubeType: "SUERO_ROJO",
    price: 24,
    specimenType: "Suero",
    tatHours: 4,
    astmMappingCode: "COMP_C3",
    parameters: [
      {
        id: "p-c3",
        name: "Complemento C3",
        unit: "mg/dL",
        astmParamCode: "C3",
        referenceRanges: [
          {
            id: "rr-c3",
            gender: "TODOS",
            minValue: 90,
            maxValue: 180,
            unit: "mg/dL"
          }
        ]
      }
    ]
  },
  {
    id: "test-c4",
    tenantId: "lab-san-jose",
    code: "3308",
    name: "Complemento C4",
    category: "INMUNOLOGIA",
    tubeType: "SUERO_ROJO",
    price: 24,
    specimenType: "Suero",
    tatHours: 4,
    astmMappingCode: "COMP_C4",
    parameters: [
      {
        id: "p-c4",
        name: "Complemento C4",
        unit: "mg/dL",
        astmParamCode: "C4",
        referenceRanges: [
          {
            id: "rr-c4",
            gender: "TODOS",
            minValue: 10,
            maxValue: 40,
            unit: "mg/dL"
          }
        ]
      }
    ]
  },
  {
    id: "test-ana",
    tenantId: "lab-san-jose",
    code: "3309",
    name: "Anticuerpos Antinucleares (ANA Hep-2 por IFI)",
    category: "INMUNOLOGIA",
    tubeType: "SUERO_ROJO",
    price: 35,
    specimenType: "Suero",
    tatHours: 24,
    astmMappingCode: "ANA_IFI",
    parameters: [
      {
        id: "p-ana-res",
        name: "Resultado ANA",
        unit: "Cualitativo",
        astmParamCode: "ANA_RES",
        referenceRanges: []
      },
      {
        id: "p-ana-tit",
        name: "Título y Patrón IFI",
        unit: "Título/Patrón",
        astmParamCode: "ANA_TIT",
        referenceRanges: []
      }
    ]
  },
  {
    id: "test-anti-dna",
    tenantId: "lab-san-jose",
    code: "3310",
    name: "Anticuerpos Anti-DNA Doble Cadena (dsDNA Cuantitativo)",
    category: "INMUNOLOGIA",
    tubeType: "SUERO_ROJO",
    price: 34,
    specimenType: "Suero",
    tatHours: 24,
    astmMappingCode: "ANTI_DSDNA",
    parameters: [
      {
        id: "p-dsdna",
        name: "Anti-dsDNA",
        unit: "IU/mL",
        astmParamCode: "DSDNA",
        referenceRanges: [
          {
            id: "rr-dsdna",
            gender: "TODOS",
            minValue: 0,
            maxValue: 20,
            unit: "IU/mL"
          }
        ]
      }
    ]
  },
  {
    id: "test-anti-ccp",
    tenantId: "lab-san-jose",
    code: "3311",
    name: "Anticuerpos Anti-Péptido Cíclico Citrulinado (Anti-CCP Artritis)",
    category: "INMUNOLOGIA",
    tubeType: "SUERO_ROJO",
    price: 36,
    specimenType: "Suero",
    tatHours: 24,
    astmMappingCode: "ANTI_CCP",
    parameters: [
      {
        id: "p-ccp",
        name: "Anti-CCP",
        unit: "U/mL",
        astmParamCode: "CCP",
        referenceRanges: [
          {
            id: "rr-ccp",
            gender: "TODOS",
            minValue: 0,
            maxValue: 17,
            unit: "U/mL"
          }
        ]
      }
    ]
  },
  {
    id: "test-anti-tpo",
    tenantId: "lab-san-jose",
    code: "3312",
    name: "Anticuerpos Anti-Tiroperoxidasa (Anti-TPO Tiroides)",
    category: "INMUNOLOGIA",
    tubeType: "SUERO_ROJO",
    price: 28,
    specimenType: "Suero",
    tatHours: 4,
    astmMappingCode: "ANTI_TPO",
    parameters: [
      {
        id: "p-tpo",
        name: "Anti-TPO",
        unit: "IU/mL",
        astmParamCode: "TPO",
        referenceRanges: [
          {
            id: "rr-tpo",
            gender: "TODOS",
            minValue: 0,
            maxValue: 34,
            unit: "IU/mL"
          }
        ]
      }
    ]
  },
  {
    id: "test-anti-tg",
    tenantId: "lab-san-jose",
    code: "3313",
    name: "Anticuerpos Anti-Tiroglobulina (Anti-TG)",
    category: "INMUNOLOGIA",
    tubeType: "SUERO_ROJO",
    price: 28,
    specimenType: "Suero",
    tatHours: 4,
    astmMappingCode: "ANTI_TG",
    parameters: [
      {
        id: "p-anti-tg",
        name: "Anti-Tiroglobulina",
        unit: "IU/mL",
        astmParamCode: "ANTITG",
        referenceRanges: [
          {
            id: "rr-antitg",
            gender: "TODOS",
            minValue: 0,
            maxValue: 115,
            unit: "IU/mL"
          }
        ]
      }
    ]
  },
  {
    id: "test-anti-transglutaminasa",
    tenantId: "lab-san-jose",
    code: "3314",
    name: "Anticuerpos Anti-Transglutaminasa Tisular IgA (Enfermedad Celíaca)",
    category: "INMUNOLOGIA",
    tubeType: "SUERO_ROJO",
    price: 36,
    specimenType: "Suero",
    tatHours: 24,
    astmMappingCode: "TTG_IGA",
    parameters: [
      {
        id: "p-ttg-iga",
        name: "Anti-tTG IgA",
        unit: "U/mL",
        astmParamCode: "TTG",
        referenceRanges: [
          {
            id: "rr-ttg",
            gender: "TODOS",
            minValue: 0,
            maxValue: 10,
            unit: "U/mL"
          }
        ]
      }
    ]
  },
  {
    id: "test-sodio",
    tenantId: "lab-san-jose",
    code: "3401",
    name: "Sodio Sérico (Na+)",
    category: "ELECTROLITOS",
    tubeType: "SUERO_ROJO",
    price: 9,
    specimenType: "Suero",
    tatHours: 1,
    astmMappingCode: "NA_ISE",
    parameters: [
      {
        id: "p-na-ind",
        name: "Sodio Sérico",
        unit: "mEq/L",
        astmParamCode: "NA",
        referenceRanges: [
          {
            id: "rr-na",
            gender: "TODOS",
            minValue: 135,
            maxValue: 145,
            unit: "mEq/L"
          }
        ]
      }
    ]
  },
  {
    id: "test-potasio",
    tenantId: "lab-san-jose",
    code: "3402",
    name: "Potasio Sérico (K+)",
    category: "ELECTROLITOS",
    tubeType: "SUERO_ROJO",
    price: 9,
    specimenType: "Suero",
    tatHours: 1,
    astmMappingCode: "K_ISE",
    parameters: [
      {
        id: "p-k-ind",
        name: "Potasio Sérico",
        unit: "mEq/L",
        astmParamCode: "K",
        referenceRanges: [
          {
            id: "rr-k",
            gender: "TODOS",
            minValue: 3.5,
            maxValue: 5.1,
            unit: "mEq/L"
          }
        ]
      }
    ]
  },
  {
    id: "test-cloro",
    tenantId: "lab-san-jose",
    code: "3403",
    name: "Cloro Sérico (Cl-)",
    category: "ELECTROLITOS",
    tubeType: "SUERO_ROJO",
    price: 9,
    specimenType: "Suero",
    tatHours: 1,
    astmMappingCode: "CL_ISE",
    parameters: [
      {
        id: "p-cl-ind",
        name: "Cloro Sérico",
        unit: "mEq/L",
        astmParamCode: "CL",
        referenceRanges: [
          {
            id: "rr-cl",
            gender: "TODOS",
            minValue: 98,
            maxValue: 107,
            unit: "mEq/L"
          }
        ]
      }
    ]
  },
  {
    id: "test-bicarbonato",
    tenantId: "lab-san-jose",
    code: "3404",
    name: "Bicarbonato Sérico / CO2 Total",
    category: "ELECTROLITOS",
    tubeType: "SUERO_ROJO",
    price: 12,
    specimenType: "Suero",
    tatHours: 1,
    astmMappingCode: "CO2_BICARB",
    parameters: [
      {
        id: "p-co2",
        name: "CO2 Total (Bicarbonato)",
        unit: "mEq/L",
        astmParamCode: "CO2",
        referenceRanges: [
          {
            id: "rr-co2",
            gender: "TODOS",
            minValue: 22,
            maxValue: 29,
            unit: "mEq/L"
          }
        ]
      }
    ]
  },
  {
    id: "test-osmolalidad",
    tenantId: "lab-san-jose",
    code: "3405",
    name: "Osmolalidad Sérica",
    category: "ELECTROLITOS",
    tubeType: "SUERO_ROJO",
    price: 18,
    specimenType: "Suero",
    tatHours: 2,
    astmMappingCode: "OSMOL_SERUM",
    parameters: [
      {
        id: "p-osmol",
        name: "Osmolalidad Sérica",
        unit: "mOsm/kg",
        astmParamCode: "OSMOL",
        referenceRanges: [
          {
            id: "rr-osmol",
            gender: "TODOS",
            minValue: 275,
            maxValue: 295,
            unit: "mOsm/kg"
          }
        ]
      }
    ]
  },
  {
    id: "test-antitrombina-3",
    tenantId: "lab-san-jose",
    code: "4101",
    name: "Antitrombina III Funcional (Cromogénica)",
    category: "COAGULACION",
    tubeType: "CITRATO_AZUL",
    price: 38,
    specimenType: "Plasma Citratado",
    tatHours: 4,
    astmMappingCode: "AT_III",
    parameters: [
      {
        id: "p-at3",
        name: "Antitrombina III",
        unit: "%",
        astmParamCode: "AT3",
        referenceRanges: [
          {
            id: "rr-at3",
            gender: "TODOS",
            minValue: 80,
            maxValue: 120,
            unit: "%"
          }
        ]
      }
    ]
  },
  {
    id: "test-proteina-c",
    tenantId: "lab-san-jose",
    code: "4102",
    name: "Proteína C de la Coagulación (Actividad)",
    category: "COAGULACION",
    tubeType: "CITRATO_AZUL",
    price: 42,
    specimenType: "Plasma Citratado",
    tatHours: 24,
    astmMappingCode: "PROT_C",
    parameters: [
      {
        id: "p-prot-c",
        name: "Proteína C Actividad",
        unit: "%",
        astmParamCode: "PROTC",
        referenceRanges: [
          {
            id: "rr-protc",
            gender: "TODOS",
            minValue: 70,
            maxValue: 140,
            unit: "%"
          }
        ]
      }
    ]
  },
  {
    id: "test-proteina-s",
    tenantId: "lab-san-jose",
    code: "4103",
    name: "Proteína S Libre Funcional",
    category: "COAGULACION",
    tubeType: "CITRATO_AZUL",
    price: 42,
    specimenType: "Plasma Citratado",
    tatHours: 24,
    astmMappingCode: "PROT_S",
    parameters: [
      {
        id: "p-prot-s",
        name: "Proteína S Libre",
        unit: "%",
        astmParamCode: "PROTS",
        referenceRanges: [
          {
            id: "rr-prots",
            gender: "TODOS",
            minValue: 60,
            maxValue: 130,
            unit: "%"
          }
        ]
      }
    ]
  },
  {
    id: "test-anticoagulante-lupico",
    tenantId: "lab-san-jose",
    code: "4104",
    name: "Anticoagulante Lúpico (dRVVT Pantalla / Confirmación)",
    category: "COAGULACION",
    tubeType: "CITRATO_AZUL",
    price: 48,
    specimenType: "Plasma Citratado Doble Centrifugado",
    tatHours: 24,
    astmMappingCode: "DRVVT_LAC",
    parameters: [
      {
        id: "p-lac-screen",
        name: "dRVVT Pantalla",
        unit: "Segundos",
        astmParamCode: "LAC_SCR",
        referenceRanges: [
          {
            id: "rr-lac-scr",
            gender: "TODOS",
            minValue: 30,
            maxValue: 45,
            unit: "seg"
          }
        ]
      },
      {
        id: "p-lac-ratio",
        name: "Ratio Normalizado",
        unit: "Ratio",
        astmParamCode: "LAC_RAT",
        referenceRanges: [
          {
            id: "rr-lac-rat",
            gender: "TODOS",
            minValue: 0.8,
            maxValue: 1.2,
            unit: "Ratio"
          }
        ]
      }
    ]
  },
  {
    id: "test-factor-8",
    tenantId: "lab-san-jose",
    code: "4105",
    name: "Factor VIII Coagulante (Actividad)",
    category: "COAGULACION",
    tubeType: "CITRATO_AZUL",
    price: 45,
    specimenType: "Plasma Citratado Congelado",
    tatHours: 24,
    astmMappingCode: "FACTOR_VIII",
    parameters: [
      {
        id: "p-f8",
        name: "Factor VIII",
        unit: "%",
        astmParamCode: "FVIII",
        referenceRanges: [
          {
            id: "rr-f8",
            gender: "TODOS",
            minValue: 50,
            maxValue: 150,
            unit: "%"
          }
        ]
      }
    ]
  },
  {
    id: "test-von-willebrand",
    tenantId: "lab-san-jose",
    code: "4106",
    name: "Factor von Willebrand (Antígeno vWF:Ag)",
    category: "COAGULACION",
    tubeType: "CITRATO_AZUL",
    price: 48,
    specimenType: "Plasma Citratado Congelado",
    tatHours: 24,
    astmMappingCode: "VWF_AG",
    parameters: [
      {
        id: "p-vwf",
        name: "vWF Antígeno",
        unit: "%",
        astmParamCode: "VWF",
        referenceRanges: [
          {
            id: "rr-vwf",
            gender: "TODOS",
            minValue: 50,
            maxValue: 150,
            unit: "%"
          }
        ]
      }
    ]
  },
  {
    id: "test-citoquimico-lcr",
    tenantId: "lab-san-jose",
    code: "4201",
    name: "Citoquímico y Cuentas Celulares de Líquido Cefalorraquídeo (LCR)",
    category: "ESPECIALES",
    tubeType: "LCR",
    price: 45,
    specimenType: "Líquido Cefalorraquídeo (LCR)",
    tatHours: 1,
    astmMappingCode: "CSF_ANALYSIS",
    parameters: [
      {
        id: "p-lcr-leu",
        name: "Leucocitos en LCR",
        unit: "/µL",
        astmParamCode: "CSF_WBC",
        referenceRanges: [
          {
            id: "rr-lcr-wbc",
            gender: "TODOS",
            minValue: 0,
            maxValue: 5,
            unit: "/µL"
          }
        ]
      },
      {
        id: "p-lcr-glu",
        name: "Glucosa en LCR",
        unit: "mg/dL",
        astmParamCode: "CSF_GLU",
        referenceRanges: [
          {
            id: "rr-lcr-glu",
            gender: "TODOS",
            minValue: 40,
            maxValue: 70,
            unit: "mg/dL"
          }
        ]
      },
      {
        id: "p-lcr-prot",
        name: "Proteínas Totales en LCR",
        unit: "mg/dL",
        astmParamCode: "CSF_PROT",
        referenceRanges: [
          {
            id: "rr-lcr-prot",
            gender: "TODOS",
            minValue: 15,
            maxValue: 45,
            unit: "mg/dL"
          }
        ]
      }
    ]
  },
  {
    id: "test-citoquimico-pleural",
    tenantId: "lab-san-jose",
    code: "4202",
    name: "Citoquímico de Líquido Pleural (Criterios de Light)",
    category: "ESPECIALES",
    tubeType: "LCR",
    price: 40,
    specimenType: "Líquido Pleural",
    tatHours: 2,
    astmMappingCode: "PLEURAL_FLUID",
    parameters: [
      {
        id: "p-pleur-ldh",
        name: "LDH Líquido Pleural",
        unit: "U/L",
        astmParamCode: "PL_LDH",
        referenceRanges: []
      },
      {
        id: "p-pleur-prot",
        name: "Proteínas Líquido Pleural",
        unit: "g/dL",
        astmParamCode: "PL_PROT",
        referenceRanges: []
      },
      {
        id: "p-pleur-clasif",
        name: "Clasificación (Trasudado vs Exudado)",
        unit: "Criterio",
        astmParamCode: "PL_CLAS",
        referenceRanges: []
      }
    ]
  },
  {
    id: "test-espermograma",
    tenantId: "lab-san-jose",
    code: "4203",
    name: "Espermograma Completo (Análisis Seminal según Criterios OMS / Kruger)",
    category: "ESPECIALES",
    tubeType: "FRASCO_ESTERIL",
    price: 45,
    specimenType: "Semen Recién Emitido por Masturbación tras 3-5 días abstinencia",
    tatHours: 4,
    astmMappingCode: "SEMEN_ANALYSIS",
    parameters: [
      {
        id: "p-spm-vol",
        name: "Volumen",
        unit: "mL",
        astmParamCode: "SPM_VOL",
        referenceRanges: [
          {
            id: "rr-spm-vol",
            gender: "M",
            minValue: 1.5,
            maxValue: 6,
            unit: "mL"
          }
        ]
      },
      {
        id: "p-spm-conc",
        name: "Concentración Espermática",
        unit: "x10^6/mL",
        astmParamCode: "SPM_CONC",
        referenceRanges: [
          {
            id: "rr-spm-conc",
            gender: "M",
            minValue: 15,
            maxValue: 250,
            unit: "x10^6/mL"
          }
        ]
      },
      {
        id: "p-spm-mot",
        name: "Movilidad Progresiva (PR)",
        unit: "%",
        astmParamCode: "SPM_MOT",
        referenceRanges: [
          {
            id: "rr-spm-mot",
            gender: "M",
            minValue: 32,
            maxValue: 100,
            unit: "%"
          }
        ]
      },
      {
        id: "p-spm-morf",
        name: "Morfología Normal (Criterio Kruger)",
        unit: "%",
        astmParamCode: "SPM_MORF",
        referenceRanges: [
          {
            id: "rr-spm-morf",
            gender: "M",
            minValue: 4,
            maxValue: 100,
            unit: "%"
          }
        ]
      }
    ]
  },
  {
    id: "test-valproico",
    tenantId: "lab-san-jose",
    code: "4301",
    name: "Nivel Sérico de Ácido Valproico (Depakene)",
    category: "TOXICOLOGIA",
    tubeType: "SUERO_ROJO",
    price: 28,
    specimenType: "Suero (Antes de la siguiente dosis)",
    tatHours: 4,
    astmMappingCode: "VALPROIC_ACID",
    parameters: [
      {
        id: "p-valp",
        name: "Ácido Valproico",
        unit: "µg/mL",
        astmParamCode: "VALP",
        referenceRanges: [
          {
            id: "rr-valp",
            gender: "TODOS",
            minValue: 50,
            maxValue: 100,
            unit: "µg/mL"
          }
        ]
      }
    ]
  },
  {
    id: "test-carbamazepina",
    tenantId: "lab-san-jose",
    code: "4302",
    name: "Nivel Sérico de Carbamazepina (Tegretol)",
    category: "TOXICOLOGIA",
    tubeType: "SUERO_ROJO",
    price: 28,
    specimenType: "Suero",
    tatHours: 4,
    astmMappingCode: "CARBAMAZEPINE",
    parameters: [
      {
        id: "p-carb",
        name: "Carbamazepina",
        unit: "µg/mL",
        astmParamCode: "CARB",
        referenceRanges: [
          {
            id: "rr-carb",
            gender: "TODOS",
            minValue: 4,
            maxValue: 12,
            unit: "µg/mL"
          }
        ]
      }
    ]
  },
  {
    id: "test-fenitoina",
    tenantId: "lab-san-jose",
    code: "4303",
    name: "Nivel Sérico de Fenitoína (Difenilhidantoína / Epamin)",
    category: "TOXICOLOGIA",
    tubeType: "SUERO_ROJO",
    price: 28,
    specimenType: "Suero",
    tatHours: 4,
    astmMappingCode: "PHENYTOIN",
    parameters: [
      {
        id: "p-fen",
        name: "Fenitoína Total",
        unit: "µg/mL",
        astmParamCode: "FEN",
        referenceRanges: [
          {
            id: "rr-fen",
            gender: "TODOS",
            minValue: 10,
            maxValue: 20,
            unit: "µg/mL"
          }
        ]
      }
    ]
  },
  {
    id: "test-litio",
    tenantId: "lab-san-jose",
    code: "4304",
    name: "Nivel Sérico de Litio",
    category: "TOXICOLOGIA",
    tubeType: "SUERO_ROJO",
    price: 22,
    specimenType: "Suero (Tubo sin gel)",
    tatHours: 4,
    astmMappingCode: "LITHIUM",
    parameters: [
      {
        id: "p-lit",
        name: "Litio Sérico",
        unit: "mEq/L",
        astmParamCode: "LIT",
        referenceRanges: [
          {
            id: "rr-lit",
            gender: "TODOS",
            minValue: 0.6,
            maxValue: 1.2,
            unit: "mEq/L"
          }
        ]
      }
    ]
  },
  {
    id: "test-digoxina",
    tenantId: "lab-san-jose",
    code: "4305",
    name: "Nivel Sérico de Digoxina",
    category: "TOXICOLOGIA",
    tubeType: "SUERO_ROJO",
    price: 26,
    specimenType: "Suero (6-8h post-dosis)",
    tatHours: 4,
    astmMappingCode: "DIGOXIN",
    parameters: [
      {
        id: "p-dig",
        name: "Digoxina",
        unit: "ng/mL",
        astmParamCode: "DIG",
        referenceRanges: [
          {
            id: "rr-dig",
            gender: "TODOS",
            minValue: 0.8,
            maxValue: 2,
            unit: "ng/mL"
          }
        ]
      }
    ]
  },
  {
    id: "test-vancomicina",
    tenantId: "lab-san-jose",
    code: "4306",
    name: "Nivel Sérico de Vancomicina (Nivel Valle)",
    category: "TOXICOLOGIA",
    tubeType: "SUERO_ROJO",
    price: 32,
    specimenType: "Suero (30 min antes de la dosis)",
    tatHours: 4,
    astmMappingCode: "VANCOMYCIN",
    parameters: [
      {
        id: "p-vanc",
        name: "Vancomicina Valle",
        unit: "µg/mL",
        astmParamCode: "VANC",
        referenceRanges: [
          {
            id: "rr-vanc",
            gender: "TODOS",
            minValue: 10,
            maxValue: 20,
            unit: "µg/mL"
          }
        ]
      }
    ]
  }
,
  {
    id: "test-colesterol-total",
    tenantId: "lab-san-jose",
    code: "3011",
    name: "Colesterol Total",
    category: "QUIMICA",
    tubeType: "SUERO_ROJO",
    price: 10,
    specimenType: "Suero",
    tatHours: 2,
    astmMappingCode: "CHOL_TOT",
    parameters: [
      {
        id: "p-chol",
        name: "Colesterol Total",
        unit: "mg/dL",
        astmParamCode: "CHOL",
        referenceRanges: [
          {
            id: "rr-chol",
            gender: "TODOS",
            minValue: 100,
            maxValue: 200,
            unit: "mg/dL"
          }
        ]
      }
    ]
  },
  {
    id: "test-colesterol-hdl",
    tenantId: "lab-san-jose",
    code: "3012",
    name: "Colesterol HDL (Lipoproteínas de Alta Densidad)",
    category: "QUIMICA",
    tubeType: "SUERO_ROJO",
    price: 12,
    specimenType: "Suero",
    tatHours: 2,
    astmMappingCode: "HDL_DIR",
    parameters: [
      {
        id: "p-hdl",
        name: "Colesterol HDL",
        unit: "mg/dL",
        astmParamCode: "HDL",
        referenceRanges: [
          {
            id: "rr-hdl-m",
            gender: "M",
            minValue: 40,
            maxValue: 90,
            unit: "mg/dL"
          },
          {
            id: "rr-hdl-f",
            gender: "F",
            minValue: 50,
            maxValue: 100,
            unit: "mg/dL"
          }
        ]
      }
    ]
  },
  {
    id: "test-colesterol-ldl",
    tenantId: "lab-san-jose",
    code: "3013",
    name: "Colesterol LDL Directo",
    category: "QUIMICA",
    tubeType: "SUERO_ROJO",
    price: 14,
    specimenType: "Suero",
    tatHours: 2,
    astmMappingCode: "LDL_DIR",
    parameters: [
      {
        id: "p-ldl",
        name: "Colesterol LDL Directo",
        unit: "mg/dL",
        astmParamCode: "LDL",
        referenceRanges: [
          {
            id: "rr-ldl",
            gender: "TODOS",
            minValue: 0,
            maxValue: 100,
            unit: "mg/dL"
          }
        ]
      }
    ]
  },
  {
    id: "test-trigliceridos",
    tenantId: "lab-san-jose",
    code: "3014",
    name: "Triglicéridos Séricos",
    category: "QUIMICA",
    tubeType: "SUERO_ROJO",
    price: 10,
    specimenType: "Suero (Ayuno 12h)",
    tatHours: 2,
    astmMappingCode: "TRIG_SER",
    parameters: [
      {
        id: "p-trig",
        name: "Triglicéridos",
        unit: "mg/dL",
        astmParamCode: "TRIG",
        referenceRanges: [
          {
            id: "rr-trig",
            gender: "TODOS",
            minValue: 0,
            maxValue: 150,
            unit: "mg/dL"
          }
        ]
      }
    ]
  },
  {
    id: "test-bilirrubinas",
    tenantId: "lab-san-jose",
    code: "3015",
    name: "Bilirrubinas Total, Directa e Indirecta",
    category: "QUIMICA",
    tubeType: "SUERO_ROJO",
    price: 14,
    specimenType: "Suero Protegido de la Luz",
    tatHours: 2,
    astmMappingCode: "BILI_PANEL",
    parameters: [
      {
        id: "p-tbili",
        name: "Bilirrubina Total",
        unit: "mg/dL",
        astmParamCode: "TBIL",
        referenceRanges: [
          {
            id: "rr-tbili",
            gender: "TODOS",
            minValue: 0.2,
            maxValue: 1.2,
            unit: "mg/dL"
          }
        ]
      },
      {
        id: "p-dbili",
        name: "Bilirrubina Directa",
        unit: "mg/dL",
        astmParamCode: "DBIL",
        referenceRanges: [
          {
            id: "rr-dbili",
            gender: "TODOS",
            minValue: 0,
            maxValue: 0.3,
            unit: "mg/dL"
          }
        ]
      },
      {
        id: "p-ibili",
        name: "Bilirrubina Indirecta",
        unit: "mg/dL",
        astmParamCode: "IBIL",
        referenceRanges: [
          {
            id: "rr-ibili",
            gender: "TODOS",
            minValue: 0.2,
            maxValue: 0.9,
            unit: "mg/dL"
          }
        ]
      }
    ]
  },
  {
    id: "test-ast-tgo",
    tenantId: "lab-san-jose",
    code: "3016",
    name: "Transaminasa Glutámico Oxalacética (AST / TGO)",
    category: "QUIMICA",
    tubeType: "SUERO_ROJO",
    price: 10,
    specimenType: "Suero",
    tatHours: 2,
    astmMappingCode: "AST_TGO",
    parameters: [
      {
        id: "p-ast",
        name: "AST / TGO",
        unit: "U/L",
        astmParamCode: "AST",
        referenceRanges: [
          {
            id: "rr-ast",
            gender: "TODOS",
            minValue: 10,
            maxValue: 40,
            unit: "U/L"
          }
        ]
      }
    ]
  },
  {
    id: "test-alt-tgp",
    tenantId: "lab-san-jose",
    code: "3017",
    name: "Transaminasa Glutámico Pirúvica (ALT / TGP)",
    category: "QUIMICA",
    tubeType: "SUERO_ROJO",
    price: 10,
    specimenType: "Suero",
    tatHours: 2,
    astmMappingCode: "ALT_TGP",
    parameters: [
      {
        id: "p-alt-ind",
        name: "ALT / TGP",
        unit: "U/L",
        astmParamCode: "ALT",
        referenceRanges: [
          {
            id: "rr-alt",
            gender: "TODOS",
            minValue: 10,
            maxValue: 45,
            unit: "U/L"
          }
        ]
      }
    ]
  },
  {
    id: "test-fosfatasa-alcalina",
    tenantId: "lab-san-jose",
    code: "3018",
    name: "Fosfatasa Alcalina (ALP)",
    category: "QUIMICA",
    tubeType: "SUERO_ROJO",
    price: 12,
    specimenType: "Suero",
    tatHours: 2,
    astmMappingCode: "ALP_SER",
    parameters: [
      {
        id: "p-alp",
        name: "Fosfatasa Alcalina",
        unit: "U/L",
        astmParamCode: "ALP",
        referenceRanges: [
          {
            id: "rr-alp",
            gender: "TODOS",
            minValue: 40,
            maxValue: 130,
            unit: "U/L"
          }
        ]
      }
    ]
  },
  {
    id: "test-ggt",
    tenantId: "lab-san-jose",
    code: "3019",
    name: "Gamma Glutamil Transferasa (GGT)",
    category: "QUIMICA",
    tubeType: "SUERO_ROJO",
    price: 12,
    specimenType: "Suero",
    tatHours: 2,
    astmMappingCode: "GGT_SER",
    parameters: [
      {
        id: "p-ggt",
        name: "GGT",
        unit: "U/L",
        astmParamCode: "GGT",
        referenceRanges: [
          {
            id: "rr-ggt-m",
            gender: "M",
            minValue: 11,
            maxValue: 50,
            unit: "U/L"
          },
          {
            id: "rr-ggt-f",
            gender: "F",
            minValue: 7,
            maxValue: 32,
            unit: "U/L"
          }
        ]
      }
    ]
  },
  {
    id: "test-proteinas-totales",
    tenantId: "lab-san-jose",
    code: "3020",
    name: "Proteínas Totales y Relación Albúmina/Globulina (A/G)",
    category: "QUIMICA",
    tubeType: "SUERO_ROJO",
    price: 12,
    specimenType: "Suero",
    tatHours: 2,
    astmMappingCode: "PROT_TOT_AG",
    parameters: [
      {
        id: "p-pt",
        name: "Proteínas Totales",
        unit: "g/dL",
        astmParamCode: "TP",
        referenceRanges: [
          {
            id: "rr-pt",
            gender: "TODOS",
            minValue: 6.4,
            maxValue: 8.3,
            unit: "g/dL"
          }
        ]
      },
      {
        id: "p-alb",
        name: "Albúmina Sérica",
        unit: "g/dL",
        astmParamCode: "ALB",
        referenceRanges: [
          {
            id: "rr-alb",
            gender: "TODOS",
            minValue: 3.5,
            maxValue: 5.2,
            unit: "g/dL"
          }
        ]
      },
      {
        id: "p-glob",
        name: "Globulinas",
        unit: "g/dL",
        astmParamCode: "GLOB",
        referenceRanges: [
          {
            id: "rr-glob",
            gender: "TODOS",
            minValue: 2.3,
            maxValue: 3.5,
            unit: "g/dL"
          }
        ]
      },
      {
        id: "p-ag-ratio",
        name: "Relación A/G",
        unit: "Ratio",
        astmParamCode: "AG_RATIO",
        referenceRanges: [
          {
            id: "rr-ag",
            gender: "TODOS",
            minValue: 1.2,
            maxValue: 2.2,
            unit: "Ratio"
          }
        ]
      }
    ]
  },
  {
    id: "test-ck-total",
    tenantId: "lab-san-jose",
    code: "3021",
    name: "Creatina Quinasa Total (CK / CPK)",
    category: "QUIMICA",
    tubeType: "SUERO_ROJO",
    price: 14,
    specimenType: "Suero",
    tatHours: 2,
    astmMappingCode: "CK_TOTAL",
    parameters: [
      {
        id: "p-ck-tot",
        name: "Creatina Quinasa Total",
        unit: "U/L",
        astmParamCode: "CK",
        referenceRanges: [
          {
            id: "rr-ck-m",
            gender: "M",
            minValue: 39,
            maxValue: 308,
            unit: "U/L"
          },
          {
            id: "rr-ck-f",
            gender: "F",
            minValue: 26,
            maxValue: 192,
            unit: "U/L"
          }
        ]
      }
    ]
  },
  {
    id: "test-ck-mb",
    tenantId: "lab-san-jose",
    code: "3022",
    name: "Creatina Quinasa Fracción MB (CK-MB Masa)",
    category: "QUIMICA",
    tubeType: "SUERO_ROJO",
    price: 20,
    specimenType: "Suero",
    tatHours: 1,
    astmMappingCode: "CK_MB_MASS",
    parameters: [
      {
        id: "p-ckmb",
        name: "CK-MB Masa",
        unit: "ng/mL",
        astmParamCode: "CKMB",
        referenceRanges: [
          {
            id: "rr-ckmb",
            gender: "TODOS",
            minValue: 0,
            maxValue: 5,
            unit: "ng/mL"
          }
        ]
      }
    ]
  },
  {
    id: "test-calcio-total",
    tenantId: "lab-san-jose",
    code: "3023",
    name: "Calcio Sérico Total",
    category: "QUIMICA",
    tubeType: "SUERO_ROJO",
    price: 9,
    specimenType: "Suero",
    tatHours: 2,
    astmMappingCode: "CA_TOTAL",
    parameters: [
      {
        id: "p-ca-tot",
        name: "Calcio Total",
        unit: "mg/dL",
        astmParamCode: "CA",
        referenceRanges: [
          {
            id: "rr-ca",
            gender: "TODOS",
            minValue: 8.5,
            maxValue: 10.2,
            unit: "mg/dL"
          }
        ]
      }
    ]
  },
  {
    id: "test-fosforo",
    tenantId: "lab-san-jose",
    code: "3024",
    name: "Fósforo Sérico Inorgánico",
    category: "QUIMICA",
    tubeType: "SUERO_ROJO",
    price: 9,
    specimenType: "Suero",
    tatHours: 2,
    astmMappingCode: "PHOS_SER",
    parameters: [
      {
        id: "p-phos",
        name: "Fósforo Sérico",
        unit: "mg/dL",
        astmParamCode: "PHOS",
        referenceRanges: [
          {
            id: "rr-phos",
            gender: "TODOS",
            minValue: 2.5,
            maxValue: 4.5,
            unit: "mg/dL"
          }
        ]
      }
    ]
  },
  {
    id: "test-magnesio",
    tenantId: "lab-san-jose",
    code: "3025",
    name: "Magnesio Sérico",
    category: "QUIMICA",
    tubeType: "SUERO_ROJO",
    price: 10,
    specimenType: "Suero",
    tatHours: 2,
    astmMappingCode: "MG_SER",
    parameters: [
      {
        id: "p-mg",
        name: "Magnesio Sérico",
        unit: "mg/dL",
        astmParamCode: "MG",
        referenceRanges: [
          {
            id: "rr-mg",
            gender: "TODOS",
            minValue: 1.6,
            maxValue: 2.6,
            unit: "mg/dL"
          }
        ]
      }
    ]
  },
  {
    id: "test-hierro-tibc",
    tenantId: "lab-san-jose",
    code: "3026",
    name: "Hierro Sérico y Capacidad Total de Fijación (TIBC)",
    category: "QUIMICA",
    tubeType: "SUERO_ROJO",
    price: 24,
    specimenType: "Suero",
    tatHours: 4,
    astmMappingCode: "IRON_TIBC",
    parameters: [
      {
        id: "p-fe",
        name: "Hierro Sérico",
        unit: "µg/dL",
        astmParamCode: "FE",
        referenceRanges: [
          {
            id: "rr-fe",
            gender: "TODOS",
            minValue: 60,
            maxValue: 170,
            unit: "µg/dL"
          }
        ]
      },
      {
        id: "p-tibc",
        name: "TIBC (Capacidad Total de Fijación)",
        unit: "µg/dL",
        astmParamCode: "TIBC",
        referenceRanges: [
          {
            id: "rr-tibc",
            gender: "TODOS",
            minValue: 240,
            maxValue: 450,
            unit: "µg/dL"
          }
        ]
      },
      {
        id: "p-sat-fe",
        name: "% Saturación de Transferrina",
        unit: "%",
        astmParamCode: "FE_SAT",
        referenceRanges: [
          {
            id: "rr-fe-sat",
            gender: "TODOS",
            minValue: 20,
            maxValue: 50,
            unit: "%"
          }
        ]
      }
    ]
  },
  {
    id: "test-cultivo-faringeo",
    tenantId: "lab-san-jose",
    code: "6101",
    name: "Cultivo de Exudado Faríngeo + Antibiograma",
    category: "MICROBIOLOGIA",
    tubeType: "HISOPADO_MEDIO",
    price: 28,
    specimenType: "Hisopado Faríngeo en Medio Stuart / Amies",
    tatHours: 48,
    astmMappingCode: "THROAT_CULTURE",
    parameters: [
      {
        id: "p-cul-far",
        name: "Aislamiento e Identificación",
        unit: "Descriptivo",
        astmParamCode: "THROAT_ID",
        referenceRanges: []
      }
    ]
  },
  {
    id: "test-cultivo-vaginal",
    tenantId: "lab-san-jose",
    code: "6102",
    name: "Cultivo de Secreción Vaginal + Examen al Fresco y Antibiograma",
    category: "MICROBIOLOGIA",
    tubeType: "HISOPADO_MEDIO",
    price: 32,
    specimenType: "Flujo Vaginal / Cervical",
    tatHours: 48,
    astmMappingCode: "VAG_CULTURE",
    parameters: [
      {
        id: "p-cul-vag-fresco",
        name: "Examen al Fresco (Levaduras/Trichomonas)",
        unit: "Cualitativo",
        astmParamCode: "VAG_WET",
        referenceRanges: []
      },
      {
        id: "p-cul-vag-bact",
        name: "Flora Bacteriana / Patógeno Aislado",
        unit: "Descriptivo",
        astmParamCode: "VAG_BACT",
        referenceRanges: []
      }
    ]
  },
  {
    id: "test-cultivo-hongos",
    tenantId: "lab-san-jose",
    code: "6103",
    name: "Cultivo Micológico para Hongos y Levaduras + Examen KOH",
    category: "MICROBIOLOGIA",
    tubeType: "FRASCO_ESTERIL",
    price: 35,
    specimenType: "Raspado de Uña / Piel / Escamas / Cabello",
    tatHours: 336,
    astmMappingCode: "MYCOLOGY_CULT",
    parameters: [
      {
        id: "p-koh-directo",
        name: "Examen Directo con KOH al 10%",
        unit: "Cualitativo",
        astmParamCode: "KOH_DIR",
        referenceRanges: []
      },
      {
        id: "p-cult-hongo",
        name: "Cultivo en Agar Sabouraud Dextrosa",
        unit: "Descriptivo",
        astmParamCode: "FUNG_ID",
        referenceRanges: []
      }
    ]
  },
  {
    id: "test-cultivo-esputo",
    tenantId: "lab-san-jose",
    code: "6104",
    name: "Cultivo de Esputo con Antibiograma Automatizado",
    category: "MICROBIOLOGIA",
    tubeType: "FRASCO_ESTERIL",
    price: 36,
    specimenType: "Esputo Espontáneo Matutino (Criterio de Murray-Washington)",
    tatHours: 48,
    astmMappingCode: "SPUTUM_CULT",
    parameters: [
      {
        id: "p-esputo-qual",
        name: "Calidad Citológica (Murray-Washington)",
        unit: "Criterio",
        astmParamCode: "SPUT_QUAL",
        referenceRanges: []
      },
      {
        id: "p-esputo-micro",
        name: "Aislamiento Bacteriano & CMI",
        unit: "Descriptivo",
        astmParamCode: "SPUT_ID",
        referenceRanges: []
      }
    ]
  },
  {
    id: "test-antihbs",
    tenantId: "lab-san-jose",
    code: "5101",
    name: "Hepatitis B - Anticuerpos contra el Antígeno de Superficie (Anti-HBs Cuantitativo)",
    category: "SEROLOGIA",
    tubeType: "SUERO_ROJO",
    price: 24,
    specimenType: "Suero",
    tatHours: 4,
    astmMappingCode: "ANTI_HBS",
    parameters: [
      {
        id: "p-ahbs",
        name: "Anti-HBs Cuantitativo",
        unit: "mIU/mL",
        astmParamCode: "AHBS",
        referenceRanges: [
          {
            id: "rr-ahbs",
            gender: "TODOS",
            minValue: 10,
            maxValue: 1000,
            unit: "mIU/mL"
          }
        ]
      }
    ]
  },
  {
    id: "test-antihbc-igm",
    tenantId: "lab-san-jose",
    code: "5102",
    name: "Hepatitis B - Anticuerpos IgM contra el Core (Anti-HBc IgM Infección Aguda)",
    category: "SEROLOGIA",
    tubeType: "SUERO_ROJO",
    price: 26,
    specimenType: "Suero",
    tatHours: 4,
    astmMappingCode: "HBCORE_IGM",
    parameters: [
      {
        id: "p-hbc-igm",
        name: "Anti-HBc IgM",
        unit: "Index S/CO",
        astmParamCode: "HBCIGM",
        referenceRanges: [
          {
            id: "rr-hbcigm",
            gender: "TODOS",
            minValue: 0,
            maxValue: 0.99,
            unit: "Index"
          }
        ]
      }
    ]
  },
  {
    id: "test-cmv",
    tenantId: "lab-san-jose",
    code: "5103",
    name: "Citomegalovirus (CMV) Anticuerpos IgG e IgM",
    category: "SEROLOGIA",
    tubeType: "SUERO_ROJO",
    price: 36,
    specimenType: "Suero",
    tatHours: 4,
    astmMappingCode: "CMV_PANEL",
    parameters: [
      {
        id: "p-cmv-igg",
        name: "CMV IgG",
        unit: "IU/mL",
        astmParamCode: "CMV_IGG",
        referenceRanges: []
      },
      {
        id: "p-cmv-igm",
        name: "CMV IgM",
        unit: "Index S/CO",
        astmParamCode: "CMV_IGM",
        referenceRanges: [
          {
            id: "rr-cmv-igm",
            gender: "TODOS",
            minValue: 0,
            maxValue: 0.99,
            unit: "Index"
          }
        ]
      }
    ]
  },
  {
    id: "test-ebv",
    tenantId: "lab-san-jose",
    code: "5104",
    name: "Virus Epstein-Barr (EBV VCA IgG, IgM y EBNA)",
    category: "SEROLOGIA",
    tubeType: "SUERO_ROJO",
    price: 38,
    specimenType: "Suero",
    tatHours: 4,
    astmMappingCode: "EBV_PANEL",
    parameters: [
      {
        id: "p-ebv-vca-igg",
        name: "EBV VCA IgG",
        unit: "U/mL",
        astmParamCode: "EBV_IGG",
        referenceRanges: []
      },
      {
        id: "p-ebv-vca-igm",
        name: "EBV VCA IgM",
        unit: "Index",
        astmParamCode: "EBV_IGM",
        referenceRanges: []
      },
      {
        id: "p-ebv-ebna",
        name: "EBV EBNA IgG",
        unit: "U/mL",
        astmParamCode: "EBNA",
        referenceRanges: []
      }
    ]
  },
  {
    id: "test-rubeola",
    tenantId: "lab-san-jose",
    code: "5105",
    name: "Rubeola Anticuerpos IgG e IgM",
    category: "SEROLOGIA",
    tubeType: "SUERO_ROJO",
    price: 32,
    specimenType: "Suero",
    tatHours: 4,
    astmMappingCode: "RUBELLA_PANEL",
    parameters: [
      {
        id: "p-rub-igg",
        name: "Rubeola IgG",
        unit: "IU/mL",
        astmParamCode: "RUB_IGG",
        referenceRanges: [
          {
            id: "rr-rub-igg",
            gender: "TODOS",
            minValue: 10,
            maxValue: 500,
            unit: "IU/mL"
          }
        ]
      },
      {
        id: "p-rub-igm",
        name: "Rubeola IgM",
        unit: "Index S/CO",
        astmParamCode: "RUB_IGM",
        referenceRanges: [
          {
            id: "rr-rub-igm",
            gender: "TODOS",
            minValue: 0,
            maxValue: 0.99,
            unit: "Index"
          }
        ]
      }
    ]
  },
  {
    id: "test-herpes",
    tenantId: "lab-san-jose",
    code: "5106",
    name: "Herpes Simplex Virus 1 y 2 (HSV-1 / HSV-2 IgG e IgM)",
    category: "SEROLOGIA",
    tubeType: "SUERO_ROJO",
    price: 38,
    specimenType: "Suero",
    tatHours: 4,
    astmMappingCode: "HSV_PANEL",
    parameters: [
      {
        id: "p-hsv1-igg",
        name: "HSV-1 IgG",
        unit: "Index",
        astmParamCode: "HSV1_G",
        referenceRanges: []
      },
      {
        id: "p-hsv2-igg",
        name: "HSV-2 IgG",
        unit: "Index",
        astmParamCode: "HSV2_G",
        referenceRanges: []
      },
      {
        id: "p-hsv-igm",
        name: "HSV 1/2 IgM",
        unit: "Index",
        astmParamCode: "HSV_M",
        referenceRanges: []
      }
    ]
  },
  {
    id: "test-hpylori-heces",
    tenantId: "lab-san-jose",
    code: "5107",
    name: "Helicobacter pylori en Heces (Antígeno Monoclonal Rápido)",
    category: "SEROLOGIA",
    tubeType: "HECES",
    price: 28,
    specimenType: "Heces Frescas",
    tatHours: 2,
    astmMappingCode: "HPYLORI_STOOL",
    parameters: [
      {
        id: "p-hp-stool",
        name: "Antígeno H. pylori en Heces",
        unit: "Cualitativo",
        astmParamCode: "HP_STOOL",
        referenceRanges: []
      }
    ]
  },
  {
    id: "test-strep-a",
    tenantId: "lab-san-jose",
    code: "5108",
    name: "Streptococcus pyogenes Ag Rápido en Faringe (Strep A STAT)",
    category: "SEROLOGIA",
    tubeType: "HISOPADO_MEDIO",
    price: 20,
    specimenType: "Hisopado Faríngeo Seco",
    tatHours: 0.5,
    astmMappingCode: "STREP_A_STAT",
    parameters: [
      {
        id: "p-strep-a",
        name: "Antígeno Strep A",
        unit: "Cualitativo",
        astmParamCode: "STREP_A",
        referenceRanges: []
      }
    ]
  },
  {
    id: "test-pcr-hbv",
    tenantId: "lab-san-jose",
    code: "9004",
    name: "Carga Viral Hepatitis B (HBV DNA Cuantitativo por RT-PCR)",
    category: "BIOLOGIA_MOLECULAR",
    tubeType: "EDTA_MORADO",
    price: 140,
    specimenType: "Plasma EDTA",
    tatHours: 48,
    astmMappingCode: "HBV_DNA_PCR",
    parameters: [
      {
        id: "p-hbv-dna-iu",
        name: "HBV DNA (IU/mL)",
        unit: "IU/mL",
        astmParamCode: "HBV_IU",
        referenceRanges: [
          {
            id: "rr-hbv-iu",
            gender: "TODOS",
            minValue: 0,
            maxValue: 10,
            unit: "IU/mL"
          }
        ]
      },
      {
        id: "p-hbv-dna-log",
        name: "HBV DNA Log10",
        unit: "Log10 IU/mL",
        astmParamCode: "HBV_LOG",
        referenceRanges: [
          {
            id: "rr-hbv-log",
            gender: "TODOS",
            minValue: 0,
            maxValue: 1,
            unit: "Log10"
          }
        ]
      }
    ]
  },
  {
    id: "test-pcr-hcv",
    tenantId: "lab-san-jose",
    code: "9005",
    name: "Carga Viral Hepatitis C (HCV RNA Cuantitativo por RT-PCR)",
    category: "BIOLOGIA_MOLECULAR",
    tubeType: "EDTA_MORADO",
    price: 140,
    specimenType: "Plasma EDTA",
    tatHours: 48,
    astmMappingCode: "HCV_RNA_PCR",
    parameters: [
      {
        id: "p-hcv-rna-iu",
        name: "HCV RNA (IU/mL)",
        unit: "IU/mL",
        astmParamCode: "HCV_IU",
        referenceRanges: [
          {
            id: "rr-hcv-iu",
            gender: "TODOS",
            minValue: 0,
            maxValue: 15,
            unit: "IU/mL"
          }
        ]
      },
      {
        id: "p-hcv-rna-log",
        name: "HCV RNA Log10",
        unit: "Log10 IU/mL",
        astmParamCode: "HCV_LOG",
        referenceRanges: [
          {
            id: "rr-hcv-log",
            gender: "TODOS",
            minValue: 0,
            maxValue: 1.18,
            unit: "Log10"
          }
        ]
      }
    ]
  },
  {
    id: "test-pcr-std",
    tenantId: "lab-san-jose",
    code: "9006",
    name: "Detección Molecular de Chlamydia trachomatis & Neisseria gonorrhoeae (CT/NG PCR)",
    category: "BIOLOGIA_MOLECULAR",
    tubeType: "HISOPADO_MEDIO",
    price: 75,
    specimenType: "Hisopado Endocervical / Uretral / Primera Fracción de Orina",
    tatHours: 24,
    astmMappingCode: "CT_NG_PCR",
    parameters: [
      {
        id: "p-ct-pcr",
        name: "Chlamydia trachomatis ADN",
        unit: "Cualitativo",
        astmParamCode: "CT_DNA",
        referenceRanges: []
      },
      {
        id: "p-ng-pcr",
        name: "Neisseria gonorrhoeae ADN",
        unit: "Cualitativo",
        astmParamCode: "NG_DNA",
        referenceRanges: []
      }
    ]
  },
  {
    id: "test-pcr-tb",
    tenantId: "lab-san-jose",
    code: "9007",
    name: "Detección Molecular de M. tuberculosis y Resistencia a Rifampicina (GeneXpert MTB/RIF)",
    category: "BIOLOGIA_MOLECULAR",
    tubeType: "FRASCO_ESTERIL",
    price: 85,
    specimenType: "Esputo / Lavado Broncoalveolar",
    tatHours: 4,
    astmMappingCode: "MTB_RIF_XPERT",
    parameters: [
      {
        id: "p-mtb-dna",
        name: "Mycobacterium tuberculosis ADN",
        unit: "Cualitativo",
        astmParamCode: "MTB_DNA",
        referenceRanges: []
      },
      {
        id: "p-rif-res",
        name: "Resistencia a Rifampicina",
        unit: "Cualitativo",
        astmParamCode: "RIF_RES",
        referenceRanges: []
      }
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
    doctorName: 'Dr. Roberto Eisenmann (Medicina Interna)',
    priority: 'RUTINA',
    status: 'VALIDADA_MED',
    createdAt: '2026-08-18T07:30:00Z',
    totalAmount: 53.50,
    paymentStatus: 'PAGADO',
    specimens: [
      { id: 'sp-1001-a', orderId: 'ord-1001', barcode: 'BC-1001-LILA', tubeType: 'EDTA_MORADO', collectedAt: '2026-08-18T07:40:00Z', status: 'EN_ANALIZADOR', phlebotomyTime: '2026-08-18T07:40:00Z', sampleVolumeMl: 4.0 },
      { id: 'sp-1001-b', orderId: 'ord-1001', barcode: 'BC-1001-ROJO', tubeType: 'SUERO_ROJO', collectedAt: '2026-08-18T07:40:00Z', status: 'EN_ANALIZADOR', phlebotomyTime: '2026-08-18T07:40:00Z', sampleVolumeMl: 5.0, isSeparated: true }
    ],
    testIds: ['test-hemograma', 'test-lipidico']
  },
  {
    id: 'ord-1002',
    tenantId: 'lab-san-jose',
    branchId: 'branch-via-espana',
    orderNumber: 'ORD-2026-00102',
    patientId: 'pat-002',
    patientName: 'Ricardo Arosemena Boyd',
    patientNationalId: '8-745-1290',
    patientGender: 'M',
    patientAge: 41,
    doctorName: 'Dra. Carmen Boyd (Endocrinología)',
    priority: 'STAT',
    status: 'VALIDADA_MED',
    createdAt: '2026-08-18T08:15:00Z',
    totalAmount: 68.00,
    paymentStatus: 'PAGADO',
    specimens: [
      { id: 'sp-1002-a', orderId: 'ord-1002', barcode: 'BC-1002-ROJO', tubeType: 'SUERO_ROJO', collectedAt: '2026-08-18T08:20:00Z', status: 'EN_ANALIZADOR', phlebotomyTime: '2026-08-18T08:20:00Z', sampleVolumeMl: 6.0, isSeparated: true }
    ],
    testIds: ['test-glucosa', 'test-tsh', 'test-creatinina']
  },
  {
    id: 'ord-1003',
    tenantId: 'lab-san-jose',
    branchId: 'branch-david',
    orderNumber: 'ORD-2026-00103',
    patientId: 'pat-003',
    patientName: 'Esteban Castillo Vega',
    patientNationalId: '4-721-9088',
    patientGender: 'M',
    patientAge: 46,
    doctorName: 'Dr. Franklin Castillo (Cardiología)',
    priority: 'RUTINA',
    status: 'VALIDADA_MED',
    createdAt: '2026-08-19T09:00:00Z',
    totalAmount: 70.00,
    paymentStatus: 'PAGADO',
    specimens: [
      { id: 'sp-1003-a', orderId: 'ord-1003', barcode: 'BC-1003-ROJO', tubeType: 'SUERO_ROJO', collectedAt: '2026-08-19T09:05:00Z', status: 'EN_ANALIZADOR', phlebotomyTime: '2026-08-19T09:05:00Z', sampleVolumeMl: 5.0, isSeparated: true },
      { id: 'sp-1003-b', orderId: 'ord-1003', barcode: 'BC-1003-AZUL', tubeType: 'CITRATO_AZUL', collectedAt: '2026-08-19T09:05:00Z', status: 'EN_ANALIZADOR', phlebotomyTime: '2026-08-19T09:05:00Z', sampleVolumeMl: 3.0 }
    ],
    testIds: ['test-lipidico', 'test-creatinina', 'test-pt']
  },
  {
    id: 'ord-1004',
    tenantId: 'lab-san-jose',
    branchId: 'branch-via-espana',
    orderNumber: 'ORD-2026-00104',
    patientId: 'pat-004',
    patientName: 'Valeria Morales Rios',
    patientNationalId: '8-910-3341',
    patientGender: 'F',
    patientAge: 29,
    doctorName: 'Dra. Patricia Rios (Ginecología)',
    priority: 'RUTINA',
    status: 'VALIDADA_MED',
    createdAt: '2026-08-19T10:20:00Z',
    totalAmount: 48.50,
    paymentStatus: 'PAGADO',
    specimens: [
      { id: 'sp-1004-a', orderId: 'ord-1004', barcode: 'BC-1004-LILA', tubeType: 'EDTA_MORADO', collectedAt: '2026-08-19T10:25:00Z', status: 'EN_ANALIZADOR', phlebotomyTime: '2026-08-19T10:25:00Z', sampleVolumeMl: 4.0 },
      { id: 'sp-1004-b', orderId: 'ord-1004', barcode: 'BC-1004-ROJO', tubeType: 'SUERO_ROJO', collectedAt: '2026-08-19T10:25:00Z', status: 'EN_ANALIZADOR', phlebotomyTime: '2026-08-19T10:25:00Z', sampleVolumeMl: 4.0 },
      { id: 'sp-1004-c', orderId: 'ord-1004', barcode: 'BC-1004-ORINA', tubeType: 'ORINA', collectedAt: '2026-08-19T10:25:00Z', status: 'EN_ANALIZADOR', phlebotomyTime: '2026-08-19T10:25:00Z', sampleVolumeMl: 40.0 }
    ],
    testIds: ['test-hemograma', 'test-hcg', 'test-uri']
  },
  {
    id: 'ord-1005',
    tenantId: 'lab-san-jose',
    branchId: 'branch-via-espana',
    orderNumber: 'ORD-2026-00105',
    patientId: 'pat-005',
    patientName: 'Dionisio Herrera Batista',
    patientNationalId: '3-709-1823',
    patientGender: 'M',
    patientAge: 57,
    doctorName: 'Dr. Alberto Herrera (Urología)',
    priority: 'RUTINA',
    status: 'VALIDADA_MED',
    createdAt: '2026-08-19T11:45:00Z',
    totalAmount: 85.00,
    paymentStatus: 'PAGADO',
    specimens: [
      { id: 'sp-1005-a', orderId: 'ord-1005', barcode: 'BC-1005-ROJO', tubeType: 'SUERO_ROJO', collectedAt: '2026-08-19T11:50:00Z', status: 'EN_ANALIZADOR', phlebotomyTime: '2026-08-19T11:50:00Z', sampleVolumeMl: 6.0, isSeparated: true }
    ],
    testIds: ['test-hepatico', 'test-electrolitos']
  },
  {
    id: 'ord-1006',
    tenantId: 'lab-san-jose',
    branchId: 'branch-via-espana',
    orderNumber: 'ORD-2026-00106',
    patientId: 'pat-006',
    patientName: 'Lucía Santana De León',
    patientNationalId: '8-888-5120',
    patientGender: 'F',
    patientAge: 27,
    doctorName: 'Particular',
    priority: 'RUTINA',
    status: 'VALIDADA_MED',
    createdAt: '2026-08-20T07:15:00Z',
    totalAmount: 33.50,
    paymentStatus: 'PAGADO',
    specimens: [
      { id: 'sp-1006-a', orderId: 'ord-1006', barcode: 'BC-1006-LILA', tubeType: 'EDTA_MORADO', collectedAt: '2026-08-20T07:20:00Z', status: 'EN_ANALIZADOR', phlebotomyTime: '2026-08-20T07:20:00Z', sampleVolumeMl: 4.0 },
      { id: 'sp-1006-b', orderId: 'ord-1006', barcode: 'BC-1006-ROJO', tubeType: 'SUERO_ROJO', collectedAt: '2026-08-20T07:20:00Z', status: 'EN_ANALIZADOR', phlebotomyTime: '2026-08-20T07:20:00Z', sampleVolumeMl: 4.0 }
    ],
    testIds: ['test-hemograma', 'test-vdrl']
  },
  {
    id: 'ord-1007',
    tenantId: 'lab-san-jose',
    branchId: 'branch-via-espana',
    orderNumber: 'ORD-2026-00107',
    patientId: 'pat-007',
    patientName: 'Alejandro Mendoza Silva',
    patientNationalId: 'PE-982103',
    patientGender: 'M',
    patientAge: 50,
    doctorName: 'Dr. Jorge Mendoza (Salud Ocupacional)',
    priority: 'STAT',
    status: 'VALIDADA_MED',
    createdAt: '2026-08-20T08:30:00Z',
    totalAmount: 92.00,
    paymentStatus: 'PAGADO',
    specimens: [
      { id: 'sp-1007-a', orderId: 'ord-1007', barcode: 'BC-1007-LILA', tubeType: 'EDTA_MORADO', collectedAt: '2026-08-20T08:35:00Z', status: 'EN_ANALIZADOR', phlebotomyTime: '2026-08-20T08:35:00Z', sampleVolumeMl: 4.0 },
      { id: 'sp-1007-b', orderId: 'ord-1007', barcode: 'BC-1007-ROJO', tubeType: 'SUERO_ROJO', collectedAt: '2026-08-20T08:35:00Z', status: 'EN_ANALIZADOR', phlebotomyTime: '2026-08-20T08:35:00Z', sampleVolumeMl: 6.0, isSeparated: true }
    ],
    testIds: ['test-hemograma', 'test-lipidico', 'test-glucosa', 'test-hiv']
  },
  {
    id: 'ord-1008',
    tenantId: 'lab-san-jose',
    branchId: 'branch-david',
    orderNumber: 'ORD-2026-00108',
    patientId: 'pat-008',
    patientName: 'Mariana Navarro Lasso',
    patientNationalId: '8-800-4491',
    patientGender: 'F',
    patientAge: 36,
    doctorName: 'Dra. Julia Lasso (Reumatología)',
    priority: 'RUTINA',
    status: 'VALIDADA_MED',
    createdAt: '2026-08-20T09:10:00Z',
    totalAmount: 50.50,
    paymentStatus: 'PAGADO',
    specimens: [
      { id: 'sp-1008-a', orderId: 'ord-1008', barcode: 'BC-1008-LILA', tubeType: 'EDTA_MORADO', collectedAt: '2026-08-20T09:15:00Z', status: 'EN_ANALIZADOR', phlebotomyTime: '2026-08-20T09:15:00Z', sampleVolumeMl: 4.0 },
      { id: 'sp-1008-b', orderId: 'ord-1008', barcode: 'BC-1008-ROJO', tubeType: 'SUERO_ROJO', collectedAt: '2026-08-20T09:15:00Z', status: 'EN_ANALIZADOR', phlebotomyTime: '2026-08-20T09:15:00Z', sampleVolumeMl: 4.0 }
    ],
    testIds: ['test-hemograma', 'test-vsg', 'test-tsh']
  },
  {
    id: 'ord-1009',
    tenantId: 'lab-san-jose',
    branchId: 'branch-via-espana',
    orderNumber: 'ORD-2026-00109',
    patientId: 'pat-009',
    patientName: 'Gonzalo A. Ríos',
    patientNationalId: '8-720-1980',
    patientGender: 'M',
    patientAge: 46,
    doctorName: 'Dr. Roberto Icaza (Médico Referente Especialista)',
    priority: 'STAT',
    status: 'LIBERADA',
    createdAt: '2026-08-20T10:00:00Z',
    totalAmount: 48.00,
    paymentStatus: 'PAGADO',
    specimens: [
      { id: 'sp-1009-a', orderId: 'ord-1009', barcode: 'BC-1009-LILA', tubeType: 'EDTA_MORADO', collectedAt: '2026-08-20T10:05:00Z', status: 'EN_ANALIZADOR', phlebotomyTime: '2026-08-20T10:05:00Z', sampleVolumeMl: 4.0 },
      { id: 'sp-1009-b', orderId: 'ord-1009', barcode: 'BC-1009-ROJO', tubeType: 'SUERO_ROJO', collectedAt: '2026-08-20T10:05:00Z', status: 'EN_ANALIZADOR', phlebotomyTime: '2026-08-20T10:05:00Z', sampleVolumeMl: 5.0, isSeparated: true }
    ],
    testIds: ['test-hemograma', 'test-lipidico']
  }
];

export const MOCK_RESULTS: TestResult[] = [
  // ORD 1001 (Gabriela Pinzón)
  { id: 'res-1', tenantId: 'lab-san-jose', orderId: 'ord-1001', testId: 'test-hemograma', parameterId: 'p-wbc', parameterName: 'Leucocitos (WBC)', unit: 'x10^3/µL', value: '7.2', numericValue: 7.2, flag: 'NORMAL', refRangeText: '4.5 - 11.0', source: 'MIDDLEWARE_ASTM', status: 'VALIDADO', version: 1, history: [], specimenType: 'Sangre Total', interpretation: 'Valores dentro de la normalidad clínica.' },
  { id: 'res-2', tenantId: 'lab-san-jose', orderId: 'ord-1001', testId: 'test-hemograma', parameterId: 'p-hgb', parameterName: 'Hemoglobina (HGB)', unit: 'g/dL', value: '13.8', numericValue: 13.8, flag: 'NORMAL', refRangeText: '12.0 - 15.5', source: 'MIDDLEWARE_ASTM', status: 'VALIDADO', version: 1, history: [], specimenType: 'Sangre Total' },
  { id: 'res-3', tenantId: 'lab-san-jose', orderId: 'ord-1001', testId: 'test-lipidico', parameterId: 'p-col', parameterName: 'Colesterol Total', unit: 'mg/dL', value: '235', numericValue: 235, flag: 'ALTO', refRangeText: '< 200', source: 'MIDDLEWARE_ASTM', status: 'VALIDADO', version: 1, history: [], specimenType: 'Suero', interpretation: 'Hipercolesterolemia leve detectada. Se sugiere control dietético.' },
  { id: 'res-4', tenantId: 'lab-san-jose', orderId: 'ord-1001', testId: 'test-lipidico', parameterId: 'p-trig', parameterName: 'Triglicéridos', unit: 'mg/dL', value: '145', numericValue: 145, flag: 'NORMAL', refRangeText: '< 150', source: 'MIDDLEWARE_ASTM', status: 'VALIDADO', version: 1, history: [], specimenType: 'Suero' },

  // ORD 1002 (Ricardo Arosemena)
  { id: 'res-5', tenantId: 'lab-san-jose', orderId: 'ord-1002', testId: 'test-glucosa', parameterId: 'p-glu', parameterName: 'Glucosa en Ayunas', unit: 'mg/dL', value: '340', numericValue: 340, flag: 'CRITICO_ALTO', refRangeText: '70 - 99', source: 'MIDDLEWARE_ASTM', status: 'VALIDADO', version: 1, history: [], specimenType: 'Suero', interpretation: 'VALOR DE PÁNICO NOTIFICADO AL MÉDICO TRATANTE.' },
  { id: 'res-6', tenantId: 'lab-san-jose', orderId: 'ord-1002', testId: 'test-tsh', parameterId: 'p-tsh', parameterName: 'TSH Ultrasensible', unit: 'uIU/mL', value: '2.45', numericValue: 2.45, flag: 'NORMAL', refRangeText: '0.40 - 4.50', source: 'MIDDLEWARE_ASTM', status: 'VALIDADO', version: 1, history: [], specimenType: 'Suero' },
  { id: 'res-7', tenantId: 'lab-san-jose', orderId: 'ord-1002', testId: 'test-creatinina', parameterId: 'p-crea', parameterName: 'Creatinina Sérica', unit: 'mg/dL', value: '1.05', numericValue: 1.05, flag: 'NORMAL', refRangeText: '0.70 - 1.30', source: 'MIDDLEWARE_ASTM', status: 'VALIDADO', version: 1, history: [], specimenType: 'Suero' },

  // ORD 1003 (Esteban Castillo)
  { id: 'res-8', tenantId: 'lab-san-jose', orderId: 'ord-1003', testId: 'test-lipidico', parameterId: 'p-col-3', parameterName: 'Colesterol Total', unit: 'mg/dL', value: '188', numericValue: 188, flag: 'NORMAL', refRangeText: '< 200', source: 'MIDDLEWARE_ASTM', status: 'VALIDADO', version: 1, history: [], specimenType: 'Suero' },
  { id: 'res-9', tenantId: 'lab-san-jose', orderId: 'ord-1003', testId: 'test-creatinina', parameterId: 'p-crea-3', parameterName: 'Creatinina Sérica', unit: 'mg/dL', value: '0.95', numericValue: 0.95, flag: 'NORMAL', refRangeText: '0.70 - 1.30', source: 'MIDDLEWARE_ASTM', status: 'VALIDADO', version: 1, history: [], specimenType: 'Suero' },
  { id: 'res-10', tenantId: 'lab-san-jose', orderId: 'ord-1003', testId: 'test-pt', parameterId: 'p-pt', parameterName: 'Tiempo de Protrombina (PT)', unit: 'Segundos', value: '12.4', numericValue: 12.4, flag: 'NORMAL', refRangeText: '11.0 - 13.5', source: 'MIDDLEWARE_ASTM', status: 'VALIDADO', version: 1, history: [], specimenType: 'Plasma Citratado' },

  // ORD 1004 (Valeria Morales)
  { id: 'res-11', tenantId: 'lab-san-jose', orderId: 'ord-1004', testId: 'test-hemograma', parameterId: 'p-wbc-4', parameterName: 'Leucocitos (WBC)', unit: 'x10^3/µL', value: '6.8', numericValue: 6.8, flag: 'NORMAL', refRangeText: '4.5 - 11.0', source: 'MIDDLEWARE_ASTM', status: 'VALIDADO', version: 1, history: [], specimenType: 'Sangre Total' },
  { id: 'res-12', tenantId: 'lab-san-jose', orderId: 'ord-1004', testId: 'test-hcg', parameterId: 'p-hcg', parameterName: 'hCG Cualitativa (Embarazo)', unit: 'Cualitativo', value: 'NEGATIVO', flag: 'NORMAL', refRangeText: 'Negativo', source: 'MANUAL', status: 'VALIDADO', version: 1, history: [], specimenType: 'Suero' },
  { id: 'res-13', tenantId: 'lab-san-jose', orderId: 'ord-1004', testId: 'test-uri', parameterId: 'p-uri', parameterName: 'Urianálisis Físico-Químico', unit: 'Panel', value: 'Normal / Límpido', flag: 'NORMAL', refRangeText: 'Normal', source: 'MIDDLEWARE_ASTM', status: 'VALIDADO', version: 1, history: [], specimenType: 'Orina' },

  // ORD 1005 (Dionisio Herrera)
  { id: 'res-14', tenantId: 'lab-san-jose', orderId: 'ord-1005', testId: 'test-hepatico', parameterId: 'p-alt', parameterName: 'TGP / ALT', unit: 'U/L', value: '68', numericValue: 68, flag: 'ALTO', refRangeText: '10 - 45', source: 'MIDDLEWARE_ASTM', status: 'VALIDADO', version: 1, history: [], specimenType: 'Suero', interpretation: 'Elevación moderada de enzimas hepáticas.' },
  { id: 'res-15', tenantId: 'lab-san-jose', orderId: 'ord-1005', testId: 'test-electrolitos', parameterId: 'p-na', parameterName: 'Sodio (Na)', unit: 'mEq/L', value: '141', numericValue: 141, flag: 'NORMAL', refRangeText: '135 - 145', source: 'MIDDLEWARE_ASTM', status: 'VALIDADO', version: 1, history: [], specimenType: 'Suero' },

  // ORD 1006 (Lucía Santana)
  { id: 'res-16', tenantId: 'lab-san-jose', orderId: 'ord-1006', testId: 'test-hemograma', parameterId: 'p-hgb-6', parameterName: 'Hemoglobina (HGB)', unit: 'g/dL', value: '12.2', numericValue: 12.2, flag: 'NORMAL', refRangeText: '12.0 - 15.5', source: 'MIDDLEWARE_ASTM', status: 'VALIDADO', version: 1, history: [], specimenType: 'Sangre Total' },
  { id: 'res-17', tenantId: 'lab-san-jose', orderId: 'ord-1006', testId: 'test-vdrl', parameterId: 'p-vdrl', parameterName: 'VDRL / RPR', unit: 'Cualitativo', value: 'NO REACTIVO', flag: 'NORMAL', refRangeText: 'No Reactivo', source: 'MANUAL', status: 'VALIDADO', version: 1, history: [], specimenType: 'Suero' },

  // ORD 1007 (Alejandro Mendoza)
  { id: 'res-18', tenantId: 'lab-san-jose', orderId: 'ord-1007', testId: 'test-glucosa', parameterId: 'p-glu-7', parameterName: 'Glucosa en Ayunas', unit: 'mg/dL', value: '92', numericValue: 92, flag: 'NORMAL', refRangeText: '70 - 99', source: 'MIDDLEWARE_ASTM', status: 'VALIDADO', version: 1, history: [], specimenType: 'Suero' },
  { id: 'res-19', tenantId: 'lab-san-jose', orderId: 'ord-1007', testId: 'test-hiv', parameterId: 'p-hiv', parameterName: 'HIV 1/2 Ag/Ab 4ta Generación', unit: 'Cualitativo', value: 'NO REACTIVO', flag: 'NORMAL', refRangeText: 'No Reactivo', source: 'MIDDLEWARE_ASTM', status: 'VALIDADO', version: 1, history: [], specimenType: 'Suero', interpretation: 'Prueba de tamizaje no reactiva.' },

  // ORD 1008 (Mariana Navarro)
  { id: 'res-20', tenantId: 'lab-san-jose', orderId: 'ord-1008', testId: 'test-vsg', parameterId: 'p-vsg-8', parameterName: 'VSG (Eritrosedimentación)', unit: 'mm/h', value: '38', numericValue: 38, flag: 'ALTO', refRangeText: '0 - 20', source: 'MIDDLEWARE_ASTM', status: 'VALIDADO', version: 1, history: [], specimenType: 'Sangre Total', interpretation: 'Velocidad de sedimentación acelerada.' },
  { id: 'res-21', tenantId: 'lab-san-jose', orderId: 'ord-1008', testId: 'test-tsh', parameterId: 'p-tsh-8', parameterName: 'TSH Ultrasensible', unit: 'uIU/mL', value: '1.92', numericValue: 1.92, flag: 'NORMAL', refRangeText: '0.40 - 4.50', source: 'MIDDLEWARE_ASTM', status: 'VALIDADO', version: 1, history: [], specimenType: 'Suero' },

  // ORD 1009 (Gonzalo A. Ríos) — Resultados Liberados
  { id: 'res-22', tenantId: 'lab-san-jose', orderId: 'ord-1009', testId: 'test-hemograma', parameterId: 'p-wbc-9', parameterName: 'Leucocitos (WBC)', unit: 'x10^3/µL', value: '7.8', numericValue: 7.8, flag: 'NORMAL', refRangeText: '4.5 - 11.0', source: 'MIDDLEWARE_ASTM', status: 'LIBERADO', version: 1, history: [], specimenType: 'Sangre Total', interpretation: 'Recuento leucocitario dentro de parámetros normales.' },
  { id: 'res-23', tenantId: 'lab-san-jose', orderId: 'ord-1009', testId: 'test-hemograma', parameterId: 'p-hgb-9', parameterName: 'Hemoglobina (HGB)', unit: 'g/dL', value: '15.1', numericValue: 15.1, flag: 'NORMAL', refRangeText: '13.5 - 17.5', source: 'MIDDLEWARE_ASTM', status: 'LIBERADO', version: 1, history: [], specimenType: 'Sangre Total' },
  { id: 'res-24', tenantId: 'lab-san-jose', orderId: 'ord-1009', testId: 'test-lipidico', parameterId: 'p-col-9', parameterName: 'Colesterol Total', unit: 'mg/dL', value: '185', numericValue: 185, flag: 'NORMAL', refRangeText: '< 200', source: 'MIDDLEWARE_ASTM', status: 'LIBERADO', version: 1, history: [], specimenType: 'Suero', interpretation: 'Perfil lipídico dentro del rango deseable.' },
  { id: 'res-25', tenantId: 'lab-san-jose', orderId: 'ord-1009', testId: 'test-lipidico', parameterId: 'p-trig-9', parameterName: 'Triglicéridos', unit: 'mg/dL', value: '132', numericValue: 132, flag: 'NORMAL', refRangeText: '< 150', source: 'MIDDLEWARE_ASTM', status: 'LIBERADO', version: 1, history: [], specimenType: 'Suero' }
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
export const MOCK_WESTGARD_QC: WestgardQCControl[] = [
  {
    id: 'qc-glu-n1',
    tenantId: 'tenant-01',
    analyzerId: 'cobas-c311',
    testName: 'Glucosa en Suero (Nivel 1 - Normal)',
    lotNumber: 'GLU-QC-N1-2026',
    targetMean: 95.0,
    standardDeviation: 2.5,
    runs: [
      { id: 'run-01', date: '2026-08-01', value: 95.2, status: 'PASS' },
      { id: 'run-02', date: '2026-08-02', value: 94.8, status: 'PASS' },
      { id: 'run-03', date: '2026-08-03', value: 96.1, status: 'PASS' },
      { id: 'run-04', date: '2026-08-04', value: 93.9, status: 'PASS' },
      { id: 'run-05', date: '2026-08-05', value: 95.0, status: 'PASS' },
      { id: 'run-06', date: '2026-08-06', value: 97.4, status: 'PASS' },
      { id: 'run-07', date: '2026-08-07', value: 100.2, violation: '1-2s', status: 'WARN' },
      { id: 'run-08', date: '2026-08-08', value: 95.8, status: 'PASS' },
      { id: 'run-09', date: '2026-08-09', value: 94.4, status: 'PASS' },
      { id: 'run-10', date: '2026-08-10', value: 96.5, status: 'PASS' },
      { id: 'run-11', date: '2026-08-11', value: 95.3, status: 'PASS' },
      { id: 'run-12', date: '2026-08-12', value: 94.7, status: 'PASS' },
      { id: 'run-13', date: '2026-08-13', value: 95.9, status: 'PASS' },
      { id: 'run-14', date: '2026-08-14', value: 96.8, status: 'PASS' },
      { id: 'run-15', date: '2026-08-15', value: 93.5, status: 'PASS' },
      { id: 'run-16', date: '2026-08-16', value: 95.1, status: 'PASS' },
      { id: 'run-17', date: '2026-08-17', value: 96.0, status: 'PASS' },
      { id: 'run-18', date: '2026-08-18', value: 95.4, status: 'PASS' }
    ]
  },
  {
    id: 'qc-glu-n2',
    tenantId: 'tenant-01',
    analyzerId: 'cobas-c311',
    testName: 'Glucosa en Suero (Nivel 2 - Patológico)',
    lotNumber: 'GLU-QC-N2-2026',
    targetMean: 240.0,
    standardDeviation: 6.0,
    runs: [
      { id: 'run-201', date: '2026-08-01', value: 239.5, status: 'PASS' },
      { id: 'run-202', date: '2026-08-02', value: 241.2, status: 'PASS' },
      { id: 'run-203', date: '2026-08-03', value: 238.4, status: 'PASS' },
      { id: 'run-204', date: '2026-08-04', value: 243.0, status: 'PASS' },
      { id: 'run-205', date: '2026-08-05', value: 239.8, status: 'PASS' },
      { id: 'run-206', date: '2026-08-06', value: 245.5, status: 'PASS' },
      { id: 'run-207', date: '2026-08-07', value: 253.0, violation: '2-2s', status: 'WARN' },
      { id: 'run-208', date: '2026-08-08', value: 242.0, status: 'PASS' },
      { id: 'run-209', date: '2026-08-09', value: 239.0, status: 'PASS' },
      { id: 'run-210', date: '2026-08-10', value: 241.5, status: 'PASS' },
      { id: 'run-211', date: '2026-08-11', value: 240.2, status: 'PASS' },
      { id: 'run-212', date: '2026-08-12', value: 238.9, status: 'PASS' },
      { id: 'run-213', date: '2026-08-13', value: 240.8, status: 'PASS' },
      { id: 'run-214', date: '2026-08-14', value: 242.3, status: 'PASS' },
      { id: 'run-215', date: '2026-08-15', value: 237.5, status: 'PASS' },
      { id: 'run-216', date: '2026-08-16', value: 240.1, status: 'PASS' },
      { id: 'run-217', date: '2026-08-17', value: 241.0, status: 'PASS' },
      { id: 'run-218', date: '2026-08-18', value: 239.8, status: 'PASS' }
    ]
  },
  {
    id: 'qc-hb-norm',
    tenantId: 'tenant-01',
    analyzerId: 'sysmex-xn550',
    testName: 'Hemoglobina (Sysmex XN-550)',
    lotNumber: 'CBC-NORM-881',
    targetMean: 13.8,
    standardDeviation: 0.35,
    runs: [
      { id: 'run-301', date: '2026-08-01', value: 13.75, status: 'PASS' },
      { id: 'run-302', date: '2026-08-02', value: 13.82, status: 'PASS' },
      { id: 'run-303', date: '2026-08-03', value: 13.90, status: 'PASS' },
      { id: 'run-304', date: '2026-08-04', value: 13.68, status: 'PASS' },
      { id: 'run-305', date: '2026-08-05', value: 13.80, status: 'PASS' },
      { id: 'run-306', date: '2026-08-06', value: 13.85, status: 'PASS' },
      { id: 'run-307', date: '2026-08-07', value: 14.15, status: 'PASS' },
      { id: 'run-308', date: '2026-08-08', value: 14.55, violation: '1-2s', status: 'WARN' },
      { id: 'run-309', date: '2026-08-09', value: 13.78, status: 'PASS' },
      { id: 'run-310', date: '2026-08-10', value: 13.84, status: 'PASS' },
      { id: 'run-311', date: '2026-08-11', value: 13.79, status: 'PASS' },
      { id: 'run-312', date: '2026-08-12', value: 13.81, status: 'PASS' },
      { id: 'run-313', date: '2026-08-13', value: 13.76, status: 'PASS' },
      { id: 'run-314', date: '2026-08-14', value: 13.88, status: 'PASS' },
      { id: 'run-315', date: '2026-08-15', value: 13.83, status: 'PASS' },
      { id: 'run-316', date: '2026-08-16', value: 13.77, status: 'PASS' },
      { id: 'run-317', date: '2026-08-17', value: 13.85, status: 'PASS' },
      { id: 'run-318', date: '2026-08-18', value: 13.80, status: 'PASS' }
    ]
  },
  {
    id: 'qc-col-n1',
    tenantId: 'tenant-01',
    analyzerId: 'cobas-c311',
    testName: 'Colesterol Total (Nivel Normal)',
    lotNumber: 'LIP-QC-N1-2026',
    targetMean: 180.0,
    standardDeviation: 4.5,
    runs: [
      { id: 'run-401', date: '2026-08-01', value: 179.2, status: 'PASS' },
      { id: 'run-402', date: '2026-08-02', value: 181.0, status: 'PASS' },
      { id: 'run-403', date: '2026-08-03', value: 178.5, status: 'PASS' },
      { id: 'run-404', date: '2026-08-04', value: 182.4, status: 'PASS' },
      { id: 'run-405', date: '2026-08-05', value: 180.0, status: 'PASS' },
      { id: 'run-406', date: '2026-08-06', value: 179.8, status: 'PASS' },
      { id: 'run-407', date: '2026-08-07', value: 183.1, status: 'PASS' },
      { id: 'run-408', date: '2026-08-08', value: 177.6, status: 'PASS' },
      { id: 'run-409', date: '2026-08-09', value: 180.5, status: 'PASS' },
      { id: 'run-410', date: '2026-08-10', value: 181.2, status: 'PASS' },
      { id: 'run-411', date: '2026-08-11', value: 179.9, status: 'PASS' },
      { id: 'run-412', date: '2026-08-12', value: 180.4, status: 'PASS' },
      { id: 'run-413', date: '2026-08-13', value: 180.1, status: 'PASS' },
      { id: 'run-414', date: '2026-08-14', value: 178.9, status: 'PASS' },
      { id: 'run-415', date: '2026-08-15', value: 181.8, status: 'PASS' },
      { id: 'run-416', date: '2026-08-16', value: 180.2, status: 'PASS' },
      { id: 'run-417', date: '2026-08-17', value: 179.5, status: 'PASS' },
      { id: 'run-418', date: '2026-08-18', value: 180.3, status: 'PASS' }
    ]
  }
];

export const MOCK_REAGENTS: ReagentInventory[] = [
  {
    id: 'reag-01',
    tenantId: 'tenant-01',
    name: 'Kit de Glucosa HK (Roche Vitros 5600)',
    code: 'REA-GLU-001',
    lotNumber: 'LOT-2026-9901',
    expirationDate: '2026-11-15',
    quantityRemaining: 450,
    unit: 'Determinaciones',
    testsPerUnit: 500,
    minAlertThreshold: 100,
    associatedTest: 'Química — Glucosa',
    manufacturer: 'Roche Diagnostics',
    storageTemp: '2°C - 8°C'
  },
  {
    id: 'reag-02',
    tenantId: 'tenant-01',
    name: 'Reactivo Hemograma Sysmex Cellpack DCL',
    code: 'REA-HEM-002',
    lotNumber: 'LOT-2026-4412',
    expirationDate: '2026-08-28',
    quantityRemaining: 80,
    unit: 'Litros',
    testsPerUnit: 1000,
    minAlertThreshold: 150,
    associatedTest: 'Hemograma Completo',
    manufacturer: 'Sysmex Corporation',
    storageTemp: '15°C - 25°C'
  }
];

export const MOCK_ANALYZER_MAPPINGS: AnalyzerTestMapping[] = [
  {
    id: 'map-01',
    tenantId: 'tenant-01',
    analyzerId: 'cobas-c311',
    analyzerName: 'Roche Cobas c311',
    lisTestCode: 'GLU',
    lisTestName: 'Glucosa en Suero',
    astmAnalyzerCode: 'GLU-HEX',
    sampleType: 'Suero Sérico',
    multiplierFactor: 1.0,
    unit: 'mg/dL',
    isActive: true,
    updatedAt: '2026-08-18T10:00:00Z',
    updatedBy: 'Lic. Sofía Guardia'
  },
  {
    id: 'map-02',
    tenantId: 'tenant-01',
    analyzerId: 'sysmex-xn550',
    analyzerName: 'Sysmex XN-550',
    lisTestCode: 'HGB',
    lisTestName: 'Hemoglobina',
    astmAnalyzerCode: 'HGB',
    sampleType: 'Sangre Total EDTA',
    multiplierFactor: 1.0,
    unit: 'g/dL',
    isActive: true,
    updatedAt: '2026-08-18T10:00:00Z',
    updatedBy: 'Lic. Sofía Guardia'
  }
];
