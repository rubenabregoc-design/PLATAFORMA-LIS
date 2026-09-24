/**
 * LISCORE Enterprise i18n Translation Engine (ES / EN)
 * Sistema Bilingüe Hospitalario y de Laboratorio Clínico
 */

import { Role } from '../types';

export type Language = 'ES' | 'EN';

export const ROLE_LABELS_MAP: Record<Language, Record<Role, { title: string; color: string; desc: string }>> = {
  ES: {
    owner: { title: 'Dueño / Gerente', color: 'bg-amber-500/15 text-amber-300 border-amber-500/30', desc: 'Finanzas, métricas, gerencia' },
    lab_chief: { title: 'Jefe de Laboratorio', color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30', desc: 'Validación médica final, QC' },
    tech_med: { title: 'Tecnólogo Médico', color: 'bg-blue-500/15 text-blue-300 border-blue-500/30', desc: 'Validación técnica, analizadores' },
    lab_tech: { title: 'Técnico de Lab', color: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30', desc: 'Recepción, código de barras' },
    receptionist: { title: 'Recepcionista', color: 'bg-purple-500/15 text-purple-300 border-purple-500/30', desc: 'Registro, órdenes, cobros' },
    ext_doctor: { title: 'Médico Referente', color: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30', desc: 'Portal médico externo' },
    patient: { title: 'Paciente / Cliente', color: 'bg-rose-500/15 text-rose-300 border-rose-500/30', desc: 'Portal personal' },
    abregotech_admin: {
      title: 'Senior Dev & Admin',
      color: 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border-cyan-500/40',
      desc: 'Programador Senior & Súper-Admin SaaS'
    }
  },
  EN: {
    owner: { title: 'Owner / Executive Director', color: 'bg-amber-500/15 text-amber-300 border-amber-500/30', desc: 'Finance, KPIs & Executive Management' },
    lab_chief: { title: 'Laboratory Chief / Medical Director', color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30', desc: 'Final Medical Validation & QC' },
    tech_med: { title: 'Medical Technologist', color: 'bg-blue-500/15 text-blue-300 border-blue-500/30', desc: 'Technical Validation & Analyzers' },
    lab_tech: { title: 'Laboratory Technician', color: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30', desc: 'Sample Intake & Barcoding' },
    receptionist: { title: 'Receptionist / Admission POS', color: 'bg-purple-500/15 text-purple-300 border-purple-500/30', desc: 'Patient Intake, Orders & Billing' },
    ext_doctor: { title: 'Referring Physician', color: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30', desc: 'External Physician Portal' },
    patient: { title: 'Patient / Client', color: 'bg-rose-500/15 text-rose-300 border-rose-500/30', desc: 'Personal Health Portal' },
    abregotech_admin: {
      title: 'Senior Dev & Admin',
      color: 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border-cyan-500/40',
      desc: 'Senior Software Architect & SaaS Super-Admin'
    }
  }
};

export const getRoleLabel = (role: Role = 'lab_tech', lang: Language = 'ES') => {
  return ROLE_LABELS_MAP[lang]?.[role] || ROLE_LABELS_MAP.ES[role] || ROLE_LABELS_MAP.ES.lab_tech;
};

export const TAB_LABELS_EN: Record<string, string> = {
  dashboard: 'Main Dashboard',
  reception: 'Patient Admission & Reception',
  validation: 'Results & Validation',
  tm_workbench: 'Technical Workbench (Bench)',
  lis_workstation: '3D Validation Workstation',
  patient_results: 'Patient Results & Samples',
  test_catalog: 'LIS Test Catalog',
  qc: 'Quality Control QC',
  middleware: 'ASTM Middleware',
  homologation: 'Analyzer Mappings',
  drivers: 'ASTM / HL7 Drivers',
  phlebotomy: 'GPS Phlebotomy',
  pathology: 'Anatomical Pathology',
  batch_reporting: 'Batch PDF Reporting',
  lis_hil: 'HIL Preanalytics',
  lis_panic: 'Critical Values Registry',
  lis_alerts_center: 'Alerts & Panic Center',
  lis_calculators: 'Clinical Calculators',
  lis_telemetry: 'Analyzer Telemetry',
  delta: 'Delta Check & Panics',
  lis_referrals: 'Sample Referral & Transfers',
  his_command: 'Hospital Command Center',
  his_triage: 'Emergency & Triage',
  his_beds: 'Bed Census & Map (ADT)',
  his_ehr: 'EHR Electronic Health Record',
  his_cpoe: 'CPOE & CDS Medical Orders',
  his_kardex: 'eMAR Nursing Kardex',
  his_icu: 'ICU / Critical Care',
  his_operating: 'Operating Rooms AIMS',
  his_maternity: 'Maternity & Neonatal',
  his_ris_pacs: 'Radiology RIS / PACS',
  his_pharmacy: 'Hospital Pharmacy Dispensing',
  his_discharge: 'Discharge & Exit Management',
  his_console: 'HL7 / FHIR Integration Console',
  shifts: 'Shifts & Appointments',
  bloodbank: 'Blood Bank Center',
  blood_donors: 'Donor Screening Form',
  blood_deferral: 'Deferral & Ineligibility',
  blood_apheresis: 'Apheresis & Extraction',
  blood_drives: 'Extramural Blood Drives',
  blood_fractionation: 'Component Processing',
  blood_serology: 'Serology & NAT Screening',
  blood_cold_chain: 'IoT Cold Chain Monitor',
  blood_logistics: 'Hemocomponent Logistics',
  blood_crossmatch: 'Immuno & Crossmatch',
  blood_bedside: 'Smart Bedside Transfusion',
  blood_hemovigilance: 'Hemovigilance Analytics',
  blood_waste: 'Biohazard Waste',
  blood_chemical_waste: 'Chemical Waste',
  blood_manifest: 'Disposal Manifest PDF',
  label_studio: 'ISBT 128 Label Studio',
  routing: 'Inter-Branch Logistics',
  billing: 'POS & Tax Invoicing',
  inventory: 'FEFO Reagent Inventory',
  executive: 'Executive BI Analytics',
  productivity: 'Productivity & TAT Metrics',
  minsa: 'Epidemiology Reports',
  audit: 'Data Privacy Audit (Law 81)',
  cmms: 'CMMS Equipment Maintenance',
  eqa: 'EQA / PEEC Quality Control',
  whatsapp: 'WhatsApp LIS Engine',
  fhir: 'FHIR Interoperability',
  ha_dr: 'HA/DR High Availability',
  accreditation: 'ISO 15189 Accreditation',
  schema: 'Database E-R Schema',
  superadmin: 'Super-Admin Console',
  punch_clock: 'Shift Clock In/Out'
};

export const TAB_DESCRIPTIONS_EN: Record<string, string> = {
  dashboard: 'Executive overview and real-time operational clinical metrics.',
  reception: 'Patient admission module, patient intake, order entry and barcoding.',
  validation: 'Clinical entry console and technologist/medical electronic signing.',
  tm_workbench: 'Technical analytical bench workstation for medical technologists.',
  lis_workstation: '3D clinical validation workstation for specimens.',
  patient_results: 'Complete sample history, patient electronic archives and orders.',
  test_catalog: 'Test definitions, diagnostic profiles, reference ranges and tube types.',
  qc: 'Levey-Jennings charts and automated Westgard multirules.',
  middleware: 'Bidirectional ASTM E1381/E1394 clinical messaging console.',
  homologation: 'Mapping analyzer test codes to the unified LIS catalog.',
  drivers: 'TCP/IP and RS232 network drivers for clinical laboratory analyzers.',
  phlebotomy: 'Real-time GPS routing and at-home mobile phlebotomy collection.',
  pathology: 'Biopsy tracking, surgical cytology and histopathology management.',
  batch_reporting: 'Mass bulk generation and digital delivery of certified PDF reports.',
  lis_hil: 'Pre-analytical index assessment for Hemolysis, Icterus and Lipemia.',
  lis_panic: 'Mandatory clinical log for panic critical value immediate notifications.',
  lis_alerts_center: 'Unified ISO 15189 panic management and clinical alert console.',
  lis_calculators: 'Calculators for eGFR, Martin-Hopkins LDL, HOMA-IR and De Ritis index.',
  lis_telemetry: 'Real-time telemetry monitoring and trend analytics for analyzers.',
  delta: 'Delta Check clinical significance monitoring and historical variation alert.',
  lis_referrals: 'Outsourced referrals, thermal bags and reference lab routing.',
  his_command: 'Hospital command center, bed occupancy, throughput and emergency alerts.',
  his_triage: 'Emergency triage categorization under Manchester / ESI protocols.',
  his_beds: 'Visual bed census management, bed tracking, admissions and transfers.',
  his_ehr: 'Unified electronic health record and clinical chart vault.',
  his_cpoe: 'Computerized physician order entry with clinical decision support (CDS).',
  his_kardex: 'Electronic medication administration record (eMAR) and vital sign sheet.',
  his_icu: 'Hemodynamic monitoring, mechanical ventilation and RASS/Glasgow scores.',
  his_operating: 'Surgical schedule, ASA physical status risk and PACU recovery.',
  his_maternity: 'Obstetric monitoring, delivery records and neonatal screening.',
  his_ris_pacs: 'DICOM web viewer and imaging modalities integration.',
  his_pharmacy: 'Unit-dose hospital drug dispensing and pharmaceutical inventory.',
  his_discharge: 'Clinical discharge planning, medical summary and work disability records.',
  his_console: 'HL7 v2.x / v3 / FHIR R4 clinical messaging gateway.',
  shifts: 'Medical scheduling, appointment books and patient queue flow.',
  bloodbank: 'Transfusion medicine central station and immunohematology panel.',
  blood_donors: 'Donor interview, vital sign qualification and questionnaire.',
  blood_deferral: 'Temporary and permanent donor deferral registry.',
  blood_apheresis: 'Plateletpheresis and whole blood extraction protocols.',
  blood_drives: 'Mobile blood drive logistics and extramural blood campaigns.',
  blood_fractionation: 'Component separation: Red Blood Cells, Plasma and Platelets.',
  blood_serology: 'Infectious disease screening (HIV, HBV, HCV, NAT) with 0ms lock.',
  blood_cold_chain: 'IoT real-time temperature tracking for blood freezers.',
  blood_logistics: 'Hemocomponent dispatch, cold chain logistics and receiving.',
  blood_crossmatch: 'Crossmatching, Direct/Indirect Coombs and antibody screen.',
  blood_bedside: 'Triple QR scan bedside patient-unit transfusion verification.',
  blood_hemovigilance: 'Transfusion adverse reaction tracking and safety notifications.',
  blood_waste: 'Safe biohazard disposal of reactive or expired units.',
  blood_chemical_waste: 'Effluent treatment and hazardous reagent disposal.',
  blood_manifest: 'Official health authority disposal manifest generation.',
  label_studio: 'Compliant ISBT 128 barcode label generation and studio printing.',
  routing: 'Sample referral, thermal carrier logistics and inter-branch routing.',
  billing: 'POS point of sale, electronic invoicing and tax authority DGI integration.',
  inventory: 'FEFO stock management with expiration date color coding and lot control.',
  executive: 'Executive BI dashboards, cost-per-test analytics and financial metrics.',
  productivity: 'Turnaround time (TAT) tracking and section workload metrics.',
  minsa: 'Mandatory epidemiology bulletin export and regulatory reports.',
  audit: 'Immutable audit trail and personal data protection (Law 81).',
  cmms: 'Preventive and corrective biomedical equipment maintenance.',
  eqa: 'External quality assessment and interlaboratory peer comparisons.',
  whatsapp: 'Automated WhatsApp PDF report delivery engine.',
  fhir: 'FHIR REST API server for seamless healthcare interoperability.',
  ha_dr: 'Active-passive cluster and contingency replication telemetry.',
  accreditation: 'Document management and evidence registry for ISO 15189.',
  schema: 'PostgreSQL relational schema and entity-relationship model viewer.',
  superadmin: 'Master control for tenants, branches, LIS catalog, HIS and blood bank.',
  punch_clock: 'Digital biometric/PIN shift clock in and clock out.'
};

export const TAB_EXAMPLES_EN: Record<string, string> = {
  validation: 'Law 81 Digital Signature',
  lis_hil: 'e.g.: Lipemic Sample 2+',
  lis_panic: 'e.g.: Notified to Doctor',
  delta: 'e.g.: Delta Variation > 20%',
  lis_referrals: 'e.g.: Referrals / Reference Lab',
  routing: 'e.g.: Transfers / Logistics',
  superadmin: 'e.g.: Superadmin / AbregoTech'
};

export const getTabLabel = (tabId: string, fallbackLabel: string, lang: Language = 'ES'): string => {
  if (lang === 'EN') {
    return TAB_LABELS_EN[tabId] || fallbackLabel;
  }
  return fallbackLabel;
};

export const getTabDescription = (tabId: string, fallbackDesc: string, lang: Language = 'ES'): string => {
  if (lang === 'EN') {
    return TAB_DESCRIPTIONS_EN[tabId] || fallbackDesc;
  }
  return fallbackDesc;
};

export const getTabExample = (tabId: string, fallbackExample?: string, lang: Language = 'ES'): string | undefined => {
  if (!fallbackExample) return undefined;
  if (lang === 'EN') {
    return TAB_EXAMPLES_EN[tabId] || fallbackExample;
  }
  return fallbackExample;
};

export const getBranchName = (rawName?: string, lang: Language = 'ES'): string => {
  if (!rawName) return lang === 'EN' ? 'Via España Branch' : 'Sede Vía España';
  if (lang === 'EN') {
    return rawName
      .replace('Sede Vía España', 'Via España Branch')
      .replace('Sede Chiriquí (David)', 'Chiriquí Branch (David)')
      .replace('Sede Principal', 'Main Branch')
      .replace('Sede Central', 'Central Branch')
      .replace('Sede Costa del Este', 'Costa del Este Branch')
      .replace('Sede San Francisco', 'San Francisco Branch');
  }
  return rawName;
};

export const TRANSLATIONS: Record<Language, Record<string, string>> = {
  ES: {
    // Sistema & Encabezado
    systemTitle: 'AbregoTech LIS / HIS Enterprise',
    systemSubtitle: 'Sistema Hospitalario y de Laboratorio Clínico',
    welcomeMorning: '¡Buenos días',
    welcomeAfternoon: '¡Buenas tardes',
    welcomeEvening: '¡Buenas noches',
    secureStation: 'Estación Segura',
    loginTitle: 'Iniciar Sesión en Estación',
    loginSubtitle: 'Ingrese sus credenciales para acceder a la plataforma LIS/HIS.',
    sede: 'Sede / Centro Clínico',
    user: 'Usuario / Identificador',
    userPlaceholder: 'ej. rabrego',
    password: 'Contraseña',
    passwordPlaceholder: 'Mín. 5 car.',
    pin: 'PIN Firma (4D)',
    pinPlaceholder: '••••',
    loginBtn: 'INGRESAR A LA PLATAFORMA',
    authenticating: 'Verificando Credenciales...',
    protectLaw81: 'Protegido bajo la Ley 81 de Protección de Datos de Panamá.',
    auditedAccess: 'Acceso auditado con registro inalterable de firma electrónica.',
    enterpriseVersion: 'AbregoTech Solutions S.A. • LIS/HIS v2.6 Enterprise • ISO 15189',

    // Navegación y Categorías
    catalog: '❖ Catálogo',
    allModules: 'Todos los Módulos',
    all: 'Todos',
    modulesCount: 'Módulos',
    searchModulePlaceholder: 'Buscar módulo (ej. HIL, Pánicos, EHR)...',
    searchTooltip: 'Presione Ctrl+K para buscar en cualquier momento',
    closeMenu: 'Cerrar (Esc)',
    clearSearch: 'Limpiar búsqueda',
    noModulesFound: 'No se encontraron módulos con',
    directAccessDesc: 'Acceso directo a módulos hospitalarios, analíticos y administrativos',
    unifiedCatalogTitle: 'Catálogo Clínico Unificado LIS-CORE',
    
    // Categorías del Menú
    lisCategory: 'Laboratorio LIS',
    hisCategory: 'Hospital HIS',
    bloodbankCategory: 'Banco Sangre',
    biCategory: 'Gestión & BI',
    
    // Roles Clínicos
    roleOwner: 'Dueño / Gerente',
    roleLabChief: 'Jefe de Laboratorio / Director Médico',
    roleTechMed: 'Tecnólogo Médico',
    roleLabTech: 'Técnico de Laboratorio',
    roleReceptionist: 'Recepcionista / Admisión POS',
    roleExtDoctor: 'Médico Referente',
    rolePatient: 'Paciente / Cliente',
    roleAdmin: 'Súper-Admin AbregoTech',

    // Acciones y Botones
    shiftPunchClock: 'Marcaje Turno',
    shiftPunchClockTooltip: 'Marcaje Digital de Entrada y Salida de Turno (Biométrico / PIN)',
    clockIn: 'INICIAR JORNADA (ENTRADA)',
    clockOut: 'REGISTRAR SALIDA DE TURNO',
    switchBranchTooltip: 'Click para cambiar de Sede / Sucursal',
    lockSession: 'Bloquear Estación',
    lockSessionTooltip: 'Bloquear Estación Manualmente',
    logout: 'Cerrar Sesión',
    logoutTooltip: 'Cerrar Sesión Segura',
    sync: 'Sincronizado',
    syncing: 'Sincronizando...',
    offlineMode: 'Modo Local Offline',
    online: 'En Línea',
    serverOnline: 'SERVIDOR: ONLINE',
    serverOffline: 'SERVIDOR: OFFLINE',
    demoMode: 'MODO DEMO',
    productionReal: 'PRODUCCIÓN (REAL)',
    quickAccess: '⭐ ACCESOS RÁPIDOS:',
    posAdmission: '🔬 Admisión POS',
    validation: '🧪 Validación',
    hisCommand: '🏥 Command HIS',
    erTriage: '🫀 Urgencias',
    beds: '🛏️ Camas',
    ehr: '📋 EHR',
    bloodBank: '🩸 Banco Sangre',

    // Estados Clínicos & Analitos
    urgent: 'URGENTE',
    stat: 'STAT / CRÍTICO',
    routine: 'RUTINA',
    normal: 'NORMAL',
    critical: 'VALOR CRÍTICO PÁNICO',
    pending: 'PENDIENTE',
    entered: 'INGRESADO',
    validatedTech: 'VAL. TÉCNICO',
    validatedMed: 'VAL. MÉDICO',
    signed: 'FIRMADO',
    delivered: 'ENTREGADO',
    validateBtn: 'Validar Resultados',
    printBtn: 'Imprimir Reporte',
    exportPdfBtn: 'Exportar PDF Oficial',

    // Filtros Demográficos
    female: 'Femenino',
    male: 'Masculino',
    age: 'Edad',
    years: 'años'
  },
  EN: {
    // System & Header
    systemTitle: 'AbregoTech LIS / HIS Enterprise',
    systemSubtitle: 'Hospital & Clinical Laboratory System',
    welcomeMorning: 'Good morning',
    welcomeAfternoon: 'Good afternoon',
    welcomeEvening: 'Good evening',
    secureStation: 'Secure Clinical Station',
    loginTitle: 'Sign In to Clinical Station',
    loginSubtitle: 'Enter your clinical credentials to access the LIS/HIS platform.',
    sede: 'Clinical Facility / Site',
    user: 'User / Clinical Identifier',
    userPlaceholder: 'e.g. rabrego',
    password: 'Password',
    passwordPlaceholder: 'Min. 5 chars',
    pin: 'Signature PIN (4D)',
    pinPlaceholder: '••••',
    loginBtn: 'SIGN IN TO PLATFORM',
    authenticating: 'Verifying Credentials...',
    protectLaw81: 'Protected under Panama Data Protection Law 81.',
    auditedAccess: 'Audited access with immutable electronic signature record.',
    enterpriseVersion: 'AbregoTech Solutions S.A. • LIS/HIS v2.6 Enterprise • ISO 15189',

    // Navigation & Categories
    catalog: '❖ CATALOG',
    allModules: 'All Modules',
    all: 'All',
    modulesCount: 'Modules',
    searchModulePlaceholder: 'Search module (e.g. HIL, Panics, EHR)...',
    searchTooltip: 'Press Ctrl+K to search anytime',
    closeMenu: 'Close (Esc)',
    clearSearch: 'Clear search',
    noModulesFound: 'No modules found matching',
    directAccessDesc: 'Direct access to hospital, analytical and administrative modules',
    unifiedCatalogTitle: 'LIS-CORE Unified Clinical Catalog',

    // Menu Categories
    lisCategory: 'LIS Laboratory',
    hisCategory: 'HIS Hospital',
    bloodbankCategory: 'Blood Bank',
    biCategory: 'BI & Management',

    // Clinical Roles
    roleOwner: 'Owner / Executive Director',
    roleLabChief: 'Laboratory Chief / Medical Director',
    roleTechMed: 'Medical Technologist',
    roleLabTech: 'Laboratory Technician',
    roleReceptionist: 'Receptionist / Admission POS',
    roleExtDoctor: 'Referring Physician',
    rolePatient: 'Patient / Client',
    roleAdmin: 'AbregoTech Super-Admin',

    // Actions & Buttons
    shiftPunchClock: 'Clock In/Out',
    shiftPunchClockTooltip: 'Digital Shift Clock In & Out (Biometric / PIN)',
    clockIn: 'CLOCK IN (START SHIFT)',
    clockOut: 'CLOCK OUT (END SHIFT)',
    switchBranchTooltip: 'Click to switch Clinical Facility / Branch',
    lockSession: 'Lock Station',
    lockSessionTooltip: 'Lock Station Manually',
    logout: 'Sign Out',
    logoutTooltip: 'Secure Sign Out',
    sync: 'Synchronized',
    syncing: 'Synchronizing...',
    offlineMode: 'Local Offline Mode',
    online: 'Online',
    serverOnline: 'SERVER: ONLINE',
    serverOffline: 'SERVER: OFFLINE',
    demoMode: 'DEMO MODE',
    productionReal: 'PRODUCTION (REAL)',
    quickAccess: '⭐ QUICK ACCESS:',
    posAdmission: '🔬 POS Admission',
    validation: '🧪 Validation',
    hisCommand: '🏥 HIS Command',
    erTriage: '🫀 ER / Triage',
    beds: '🛏️ Beds',
    ehr: '📋 EHR',
    bloodBank: '🩸 Blood Bank',

    // Clinical Status & Analytes
    urgent: 'URGENT',
    stat: 'STAT / CRITICAL',
    routine: 'ROUTINE',
    normal: 'NORMAL',
    critical: 'CRITICAL PANIC VALUE',
    pending: 'PENDING',
    entered: 'ENTERED',
    validatedTech: 'TECH VALIDATED',
    validatedMed: 'MED VALIDATED',
    signed: 'SIGNED',
    delivered: 'DELIVERED',
    validateBtn: 'Validate Results',
    printBtn: 'Print Report',
    exportPdfBtn: 'Export Official PDF',

    // Demographic Filters
    female: 'Female',
    male: 'Male',
    age: 'Age',
    years: 'years'
  }
};

export const t = (key: string, lang: Language = 'ES'): string => {
  return TRANSLATIONS[lang]?.[key] || TRANSLATIONS['ES']?.[key] || key;
};
