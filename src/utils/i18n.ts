/**
 * LISCORE Enterprise i18n Translation Engine (ES / EN)
 * Sistema Bilingüe Hospitalario y de Laboratorio Clínico
 */

export type Language = 'ES' | 'EN';

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
