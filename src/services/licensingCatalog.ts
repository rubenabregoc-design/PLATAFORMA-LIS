/**
 * Catálogo Maestro de Sistemas, Submódulos y Reglas de Licenciamiento
 * LIS-Core PRO - AbregoTech Solutions S.A.
 */

import {
  SystemModuleDefinition,
  SystemModuleId,
  PlanPresetId,
  BranchLicense,
  LicenseEvaluationResult
} from '../types/licensing';

export const SYSTEM_MODULES_CATALOG: SystemModuleDefinition[] = [
  {
    id: 'LIS',
    name: 'Laboratorio LIS',
    tagline: 'Laboratorio de Análisis Clínico Automatizado',
    description: 'Gestión completa preanalítica, analítica y postanalítica con interfaz ASTM/HL7, validación técnica/médica e informes.',
    iconName: 'FlaskConical',
    color: 'text-cyan-400',
    borderColor: 'border-cyan-500/40',
    bgGlow: 'bg-cyan-500/10',
    submodules: [
      {
        id: 'admision_pos',
        name: 'Admisión POS & Registro de Órdenes',
        description: 'Ingreso de pacientes, cotización, facturación ambulatoria e impresión de etiquetas de código de barras.',
        systemId: 'LIS',
        relatedTabs: ['reception', 'billing'],
        isCore: true
      },
      {
        id: 'validacion',
        name: 'Resultados & Validación Clínica',
        description: 'Bandeja técnica y médica con semáforo de referencia, cálculo automático y firma electrónica calificada.',
        systemId: 'LIS',
        relatedTabs: ['validation', 'patient_results', 'lis_workstation'],
        isCore: true
      },
      {
        id: 'bandeja_ordenes',
        name: 'Bandeja Operativa de Tecnólogos (TM)',
        description: 'Flujo de trabajo central para tecnólogos médicos con filtro por analizador y estado de procesamiento.',
        systemId: 'LIS',
        relatedTabs: ['tm_workbench']
      },
      {
        id: 'alertas_panicos',
        name: 'Centro de Alertas & Límites de Pánico',
        description: 'Notificación de valores críticos, delta check, repeticiones obligatorias y registro de llamadas al médico.',
        systemId: 'LIS',
        relatedTabs: ['lis_panic', 'lis_alerts_center', 'delta']
      },
      {
        id: 'calculadoras',
        name: 'Calculadoras Clínicas Automatizadas',
        description: 'MDRD-4, CKD-EPI, Osmolaridad Sérica, Déficit de Agua, Fracción Excretada de Sodio y Fórmulas LIS.',
        systemId: 'LIS',
        relatedTabs: ['lis_calculators']
      },
      {
        id: 'telemetria',
        name: 'Telemetría de Analizadores en Vivo',
        description: 'Monitoreo de estado de conexión, puertos TCP/Serial, reactivos a bordo y volumen de pruebas procesadas.',
        systemId: 'LIS',
        relatedTabs: ['lis_telemetry']
      },
      {
        id: 'trazabilidad',
        name: 'Trazabilidad y Cadena de Custodia',
        description: 'Auditoría inmutable de eventos por muestra: quién admitió, procesó, validó, imprimió y modificó resultados.',
        systemId: 'LIS',
        relatedTabs: ['routing']
      },
      {
        id: 'informe_carta',
        name: 'Generador de Informe Carta / PDF',
        description: 'Emisión e impresión de resultados oficiales con QR criptográfico, logo institucional y membrete.',
        systemId: 'LIS',
        relatedTabs: ['batch_reporting']
      },
      {
        id: 'catalogo_pruebas',
        name: 'Catálogo Maestro & LOINC 2.82',
        description: 'Definición de exámenes, perfiles, rangos multidemográficos CLSI EP28-A3, tubos y códigos ASTM.',
        systemId: 'LIS',
        relatedTabs: ['test_catalog']
      },
      {
        id: 'middleware',
        name: 'Conectividad Middleware ASTM/HL7',
        description: 'Integración bidireccional con analizadores Sysmex, Roche, Abbott, Mindray, Ortho y bioMérieux.',
        systemId: 'LIS',
        relatedTabs: ['middleware', 'homologation', 'drivers']
      },
      {
        id: 'flebotomia',
        name: 'Flebotomía & Fase Preanalítica',
        description: 'Control de tubos, alícuotas, criterios de rechazo (hemólisis, lipemia, coágulo) y registro de toma.',
        systemId: 'LIS',
        relatedTabs: ['phlebotomy', 'label_studio', 'lis_hil']
      },
      {
        id: 'intercom',
        name: 'Intercomunicador Seguro Clínico',
        description: 'Mensajería interna de voz y texto entre tecnólogos, recepción y médicos tratantes con acuse de recibo.',
        systemId: 'LIS',
        relatedTabs: ['intercom']
      }
    ]
  },
  {
    id: 'HIS',
    name: 'Hospital HIS',
    tagline: 'Gestión Hospitalaria & Expediente Clínico',
    description: 'Gestión integral de camas, urgencias, triage Manchester, consulta médica y expediente electrónico unificado.',
    iconName: 'Building2',
    color: 'text-indigo-400',
    borderColor: 'border-indigo-500/40',
    bgGlow: 'bg-indigo-500/10',
    submodules: [
      {
        id: 'command_his',
        name: 'Command Center Hospitalario',
        description: 'Tablero gerencial en tiempo real de ocupación de camas, tiempos de espera en urgencias y censo diario.',
        systemId: 'HIS',
        relatedTabs: ['his_console'],
        isCore: true
      },
      {
        id: 'urgencias_triage',
        name: 'Urgencias & Triage Manchester/ESI',
        description: 'Clasificación por colores (Rojo, Naranja, Amarillo, Verde, Azul) y flujo rápido a choque/observación.',
        systemId: 'HIS',
        relatedTabs: ['his_triage']
      },
      {
        id: 'mapa_camas',
        name: 'Censo ADT & Mapa Gráfico de Camas',
        description: 'Gestión visual de camas: ocupadas, libres, en desinfección, reservadas y traslados de piso.',
        systemId: 'HIS',
        relatedTabs: ['his_beds']
      },
      {
        id: 'historia_clinica_ehr',
        name: 'Expediente Electrónico Unificado (EHR)',
        description: 'Notas de evolución SOAP, órdenes médicas, recetas farmacológicas y consolidación con laboratorio e imagen.',
        systemId: 'HIS',
        relatedTabs: ['his_ehr'],
        isCore: true
      },
      {
        id: 'agenda_turnos',
        name: 'Agenda Médica & Turnos Hospitalarios',
        description: 'Programación de citas para consulta externa, turnos médicos de guardia y disponibilidad por consultorio.',
        systemId: 'HIS',
        relatedTabs: ['shifts']
      },
      {
        id: 'ris_pacs',
        name: 'Imagenología RIS & Visor DICOM',
        description: 'Órdenes de rayos X, ultrasonidos, TAC y resonancias integradas al visor médico DICOM Web.',
        systemId: 'HIS',
        relatedTabs: ['his_ris_pacs']
      }
    ]
  },
  {
    id: 'BANCO_SANGRE',
    name: 'Banco de Sangre',
    tagline: 'Medicina Transfusional & Hemocomponentes',
    description: 'Cadena completa de sangre: selección de donantes, serología obligatoria, fraccionamiento y compatibilidad transfusional.',
    iconName: 'Droplets',
    color: 'text-rose-400',
    borderColor: 'border-rose-500/40',
    bgGlow: 'bg-rose-500/10',
    submodules: [
      {
        id: 'donantes',
        name: 'Captación & Calificación de Donantes',
        description: 'Cuestionario de autoexclusión confidencial, signos vitales, hematocrito previo y registro de colecta.',
        systemId: 'BANCO_SANGRE',
        relatedTabs: ['blood_donors', 'blood_deferral', 'blood_drives'],
        isCore: true
      },
      {
        id: 'aferesis',
        name: 'Aféresis Terapéutica & Productiva',
        description: 'Plaquetoféresis y plasmaféresis automatizada con registro de kits, volumen y recuentos post-donación.',
        systemId: 'BANCO_SANGRE',
        relatedTabs: ['blood_apheresis']
      },
      {
        id: 'fraccionamiento',
        name: 'Fraccionamiento de Hemocomponentes',
        description: 'Separación en Glóbulos Rojos Empacados, Plasma Fresco Congelado, Plaquetas y Crioprecipitados.',
        systemId: 'BANCO_SANGRE',
        relatedTabs: ['blood_fractionation'],
        isCore: true
      },
      {
        id: 'serologia_inmuno',
        name: 'Tamizaje Infeccioso Obligatorio MINSA',
        description: 'Validación serológica 100% obligatoria: VIH, VHB, VHC, Chagas, Sífilis, HTLV-I/II y Malaria.',
        systemId: 'BANCO_SANGRE',
        relatedTabs: ['bloodbank'],
        isCore: true
      },
      {
        id: 'pruebas_cruzadas',
        name: 'Pruebas Cruzadas & Compatibilidad',
        description: 'Tipificación ABO/Rh inversa y directa, Coombs directo/indirecto, rastreo de anticuerpos y cruce mayor.',
        systemId: 'BANCO_SANGRE',
        relatedTabs: ['blood_crossmatch']
      },
      {
        id: 'cadena_frio',
        name: 'Cadena de Frío IoT & Almacenamiento',
        description: 'Monitoreo de congeladores -30°C, refrigeradores 4°C y agitadores de plaquetas 22°C con alarmas.',
        systemId: 'BANCO_SANGRE',
        relatedTabs: ['blood_cold_chain', 'blood_evolution']
      },
      {
        id: 'hemovigilancia',
        name: 'Hemovigilancia & Despacho Transfusional',
        description: 'Liberación de unidades a quirófano/UCI, trazabilidad vena a vena y registro de reacciones adversas.',
        systemId: 'BANCO_SANGRE',
        relatedTabs: ['blood_hemovigilance', 'blood_manifest', 'blood_waste', 'blood_chemical_waste']
      }
    ]
  },
  {
    id: 'GESTION_CALIDAD',
    name: 'Gestión & Calidad',
    tagline: 'Garantía Analítica, Acreditación & Mantenimiento',
    description: 'Control de calidad interno y externo, reactivos, acreditación ISO 15189, epidemiología y cumplimiento legal.',
    iconName: 'ShieldCheck',
    color: 'text-emerald-400',
    borderColor: 'border-emerald-500/40',
    bgGlow: 'bg-emerald-500/10',
    submodules: [
      {
        id: 'westgard_qc',
        name: 'Control de Calidad QC & Westgard',
        description: 'Evaluación automática de reglas Westgard (1-3s, 2-2s, R-4s, 4-1s, 10x), Levey-Jennings y CV%.',
        systemId: 'GESTION_CALIDAD',
        relatedTabs: ['qc'],
        isCore: true
      },
      {
        id: 'acreditacion_iso15189',
        name: 'Auditoría & Acreditación ISO 15189',
        description: 'Matriz de competencias del personal, control documental, indicadores analíticos de calidad y no conformidades.',
        systemId: 'GESTION_CALIDAD',
        relatedTabs: ['accreditation']
      },
      {
        id: 'inventario_reactivos',
        name: 'Inventario de Reactivos & Caducidades',
        description: 'Trazabilidad de números de lote, fechas de vencimiento, alertas de stock mínimo y órdenes de compra.',
        systemId: 'GESTION_CALIDAD',
        relatedTabs: ['inventory', 'purchasing']
      },
      {
        id: 'epidemiologia_minsa',
        name: 'Vigilancia Epidemiológica MINSA',
        description: 'Consolidación automática y exportación de notificación obligatoria de enfermedades transmisibles en Panamá.',
        systemId: 'GESTION_CALIDAD',
        relatedTabs: ['minsa']
      },
      {
        id: 'auditoria_ley81',
        name: 'Bóveda de Privacidad (Ley 81 de Panamá)',
        description: 'Consentimiento informado digital del paciente, logs de accesos a datos sensibles y revocación.',
        systemId: 'GESTION_CALIDAD',
        relatedTabs: ['auditoria_ley81']
      },
      {
        id: 'cmms_mantenimiento',
        name: 'Mantenimiento de Equipos CMMS / EQA',
        description: 'Cronograma de calibraciones preventivas, bitácora de servicios técnicos de analizadores y control externo EQA.',
        systemId: 'GESTION_CALIDAD',
        relatedTabs: ['cmms', 'eqa']
      }
    ]
  },
  {
    id: 'OTROS',
    name: 'Servicios Adicionales',
    tagline: 'Comunicaciones, Fiscal y Analítica',
    description: 'Módulos complementarios de entrega de resultados, facturación fiscal y paneles ejecutivos.',
    iconName: 'Sparkles',
    color: 'text-amber-400',
    borderColor: 'border-amber-500/40',
    bgGlow: 'bg-amber-500/10',
    submodules: [
      {
        id: 'whatsapp_notificaciones',
        name: 'Notificaciones WhatsApp Automatizadas',
        description: 'Envío de enlace con token cifrado y PIN al paciente apenas los resultados son validados médicamente.',
        systemId: 'OTROS',
        relatedTabs: ['whatsapp']
      },
      {
        id: 'facturacion_fiscal',
        name: 'Facturación POS & PAC / DGI Panamá',
        description: 'Emisión de comprobantes fiscales, caja diaria, desglose por aseguradoras y métodos de pago.',
        systemId: 'OTROS',
        relatedTabs: ['billing']
      },
      {
        id: 'analitica_gerencial',
        name: 'Analítica Ejecutiva & Business Intelligence',
        description: 'Rentabilidad por analito, tiempos de respuesta (TAT), médicos referentes con mayor volumen y proyecciones.',
        systemId: 'OTROS',
        relatedTabs: ['executive']
      }
    ]
  }
];

// Reglas de Dependencia entre Módulos
export interface DependencyRule {
  dependentModuleId: string;
  dependentName: string;
  requiredSystemId: SystemModuleId;
  requiredSubmoduleId?: string;
  requiredName: string;
  reason: string;
}

export const MODULE_DEPENDENCIES: DependencyRule[] = [
  {
    dependentModuleId: 'serologia_inmuno',
    dependentName: 'Tamizaje Infeccioso (Banco de Sangre)',
    requiredSystemId: 'LIS',
    requiredSubmoduleId: 'validacion',
    requiredName: 'Validación Clínica LIS',
    reason: 'El Banco de Sangre requiere el motor analítico de validación técnica de pruebas infecciosas.'
  },
  {
    dependentModuleId: 'urgencias_triage',
    dependentName: 'Urgencias & Triage (HIS)',
    requiredSystemId: 'HIS',
    requiredSubmoduleId: 'historia_clinica_ehr',
    requiredName: 'Expediente EHR (HIS)',
    reason: 'El triage hospitalario requiere registrar los antecedentes y evoluciones en el expediente del paciente.'
  },
  {
    dependentModuleId: 'mapa_camas',
    dependentName: 'Mapa de Camas (HIS)',
    requiredSystemId: 'HIS',
    requiredSubmoduleId: 'command_his',
    requiredName: 'Command Center HIS',
    reason: 'El censo ADT reporta las métricas de ocupación directamente a la consola de mando.'
  },
  {
    dependentModuleId: 'hemovigilancia',
    dependentName: 'Hemovigilancia Transfusional',
    requiredSystemId: 'BANCO_SANGRE',
    requiredSubmoduleId: 'pruebas_cruzadas',
    requiredName: 'Pruebas Cruzadas de Compatibilidad',
    reason: 'No se puede transfundir ni registrar hemovigilancia sin compatibilidad serológica previa.'
  }
];

/**
 * Genera la configuración de sistemas y submódulos según un plan comercial predefinido
 */
export function getPlanPresetConfig(preset: PlanPresetId): {
  enabledSystems: Record<SystemModuleId, boolean>;
  enabledSubmodules: Record<string, boolean>;
} {
  const enabledSystems: Record<SystemModuleId, boolean> = {
    LIS: false,
    HIS: false,
    BANCO_SANGRE: false,
    GESTION_CALIDAD: false,
    OTROS: false
  };

  const enabledSubmodules: Record<string, boolean> = {};

  // Inicializar todos los submódulos en false
  SYSTEM_MODULES_CATALOG.forEach(sys => {
    sys.submodules.forEach(sub => {
      enabledSubmodules[sub.id] = false;
    });
  });

  switch (preset) {
    case 'SOLO_LIS':
      enabledSystems.LIS = true;
      enabledSystems.GESTION_CALIDAD = true;
      SYSTEM_MODULES_CATALOG.find(s => s.id === 'LIS')?.submodules.forEach(sub => {
        enabledSubmodules[sub.id] = true;
      });
      // Submódulos esenciales de calidad para LIS
      ['westgard_qc', 'inventario_reactivos', 'acreditacion_iso15189'].forEach(id => {
        enabledSubmodules[id] = true;
      });
      break;

    case 'SOLO_HIS':
      enabledSystems.HIS = true;
      SYSTEM_MODULES_CATALOG.find(s => s.id === 'HIS')?.submodules.forEach(sub => {
        enabledSubmodules[sub.id] = true;
      });
      break;

    case 'SOLO_BANCO':
      enabledSystems.BANCO_SANGRE = true;
      enabledSystems.GESTION_CALIDAD = true;
      SYSTEM_MODULES_CATALOG.find(s => s.id === 'BANCO_SANGRE')?.submodules.forEach(sub => {
        enabledSubmodules[sub.id] = true;
      });
      ['westgard_qc', 'inventario_reactivos', 'auditoria_ley81'].forEach(id => {
        enabledSubmodules[id] = true;
      });
      break;

    case 'LIS_HIS':
      enabledSystems.LIS = true;
      enabledSystems.HIS = true;
      enabledSystems.GESTION_CALIDAD = true;
      enabledSystems.OTROS = true;
      SYSTEM_MODULES_CATALOG.filter(s => ['LIS', 'HIS', 'GESTION_CALIDAD', 'OTROS'].includes(s.id)).forEach(sys => {
        sys.submodules.forEach(sub => {
          enabledSubmodules[sub.id] = true;
        });
      });
      break;

    case 'SUITE_COMPLETA':
      Object.keys(enabledSystems).forEach(k => {
        enabledSystems[k as SystemModuleId] = true;
      });
      Object.keys(enabledSubmodules).forEach(k => {
        enabledSubmodules[k] = true;
      });
      break;

    case 'PERSONALIZADO':
    default:
      // Conserva el estado actual o inicia con LIS básico
      enabledSystems.LIS = true;
      ['admision_pos', 'validacion', 'bandeja_ordenes', 'alertas_panicos', 'informe_carta'].forEach(id => {
        enabledSubmodules[id] = true;
      });
      break;
  }

  return { enabledSystems, enabledSubmodules };
}

/**
 * Evalúa el estado clínico y vigencia de una licencia de sede
 */
export function evaluateLicenseStatus(license?: BranchLicense | null): LicenseEvaluationResult {
  if (!license) {
    // Si no tiene licencia configurada, entra en fallback Suite Completa sin vencimiento (modo compatibilidad)
    return {
      status: 'activa',
      isEffectiveActive: true,
      isReadOnly: false,
      daysRemaining: null,
      isGracePeriod: false,
      canCreateOrders: true,
      canValidateResults: true,
      canViewResults: true,
      canViewPanics: true,
      statusMessage: 'Licencia Continua Enterprise (Sin Vencimiento)',
      statusBadge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      statusColor: '#10b981'
    };
  }

  if (license.status === 'suspendida') {
    return {
      status: 'suspendida',
      isEffectiveActive: false,
      isReadOnly: true,
      daysRemaining: 0,
      isGracePeriod: false,
      canCreateOrders: false,
      canValidateResults: false,
      canViewResults: true, // Seguridad clínica: jamás ocultar historial a médicos
      canViewPanics: true,  // Los pánicos siempre son visibles por riesgo vital
      statusMessage: 'Licencia Administrativamente Suspendida (Modo Solo Lectura)',
      statusBadge: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
      statusColor: '#f43f5e'
    };
  }

  // Licencia perpetua sin fecha de vencimiento
  if (!license.expirationDate) {
    return {
      status: 'activa',
      isEffectiveActive: true,
      isReadOnly: false,
      daysRemaining: null,
      isGracePeriod: false,
      canCreateOrders: true,
      canValidateResults: true,
      canViewResults: true,
      canViewPanics: true,
      statusMessage: 'Licencia Activa Indefinida',
      statusBadge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      statusColor: '#10b981'
    };
  }

  const now = new Date();
  const expDate = new Date(license.expirationDate);
  const diffMs = expDate.getTime() - now.getTime();
  const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const graceDays = license.gracePeriodDays ?? 15;

  // 1. Activa con vigencia cómoda (> 30 días)
  if (daysRemaining > 30) {
    return {
      status: 'activa',
      isEffectiveActive: true,
      isReadOnly: false,
      daysRemaining,
      isGracePeriod: false,
      canCreateOrders: true,
      canValidateResults: true,
      canViewResults: true,
      canViewPanics: true,
      statusMessage: `Licencia Vigente (${daysRemaining} días restantes)`,
      statusBadge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      statusColor: '#10b981'
    };
  }

  // 2. Por Vencer (1 a 30 días restantes)
  if (daysRemaining > 0 && daysRemaining <= 30) {
    return {
      status: 'por_vencer',
      isEffectiveActive: true,
      isReadOnly: false,
      daysRemaining,
      isGracePeriod: false,
      canCreateOrders: true,
      canValidateResults: true,
      canViewResults: true,
      canViewPanics: true,
      statusMessage: `Licencia por Vencer: Faltan ${daysRemaining} días para la renovación`,
      statusBadge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      statusColor: '#f59e0b'
    };
  }

  // 3. En Periodo de Gracia Asistencial (0 a -graceDays)
  const overdueDays = Math.abs(daysRemaining);
  if (overdueDays <= graceDays) {
    const remainingGrace = graceDays - overdueDays;
    return {
      status: 'en_gracia',
      isEffectiveActive: true,
      isReadOnly: false,
      daysRemaining: 0,
      isGracePeriod: true,
      canCreateOrders: true, // Funcionalidad completa durante periodo de gracia
      canValidateResults: true,
      canViewResults: true,
      canViewPanics: true,
      statusMessage: `Periodo de Gracia Clínico: ${remainingGrace} días restantes antes de modo Solo Lectura`,
      statusBadge: 'bg-orange-500/20 text-orange-300 border-orange-500/30 animate-pulse',
      statusColor: '#f97316'
    };
  }

  // 4. Vencida (fuera del periodo de gracia -> Modo SOLO LECTURA estricto)
  return {
    status: 'vencida',
    isEffectiveActive: false,
    isReadOnly: true,
    daysRemaining: 0,
    isGracePeriod: false,
    canCreateOrders: false,    // Bloqueado
    canValidateResults: false, // Bloqueado
    canViewResults: true,      // Permitido para auditoría médica
    canViewPanics: true,       // Permitido por seguridad del paciente
    statusMessage: 'Licencia Expirada: Sistema en Modo Solo Lectura (Contacte a AbregoTech)',
    statusBadge: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    statusColor: '#f43f5e'
  };
}

/**
 * Genera una licencia predeterminada con Suite Completa para una sede existente
 */
export function createDefaultFullSuiteLicense(tenantId: string, branchId: string): BranchLicense {
  const { enabledSystems, enabledSubmodules } = getPlanPresetConfig('SUITE_COMPLETA');
  return {
    id: `lic-${tenantId}-${branchId}`,
    tenantId,
    branchId,
    planPreset: 'SUITE_COMPLETA',
    status: 'activa',
    startDate: new Date().toISOString().split('T')[0],
    expirationDate: null, // Indefinida / Sin vencimiento
    gracePeriodDays: 15,
    maxUsers: 999, // Sin restricción restrictiva para no romper producción
    enabledSystems,
    enabledSubmodules,
    notes: 'Licencia base autogenerada para producción (Suite Completa Indefinida)',
    lastUpdated: new Date().toISOString(),
    updatedBy: 'Sistema de Migración AbregoTech'
  };
}

/**
 * Valida dependencias entre submódulos activados
 * Retorna lista de dependencias no satisfechas
 */
export function validateModuleDependencies(
  enabledSystems: Record<SystemModuleId, boolean>,
  enabledSubmodules: Record<string, boolean>
): DependencyRule[] {
  const violations: DependencyRule[] = [];

  for (const rule of MODULE_DEPENDENCIES) {
    const isDependentActive = enabledSubmodules[rule.dependentModuleId];
    if (isDependentActive) {
      const isSystemActive = enabledSystems[rule.requiredSystemId];
      const isSubmoduleActive = rule.requiredSubmoduleId 
        ? enabledSubmodules[rule.requiredSubmoduleId] 
        : true;

      if (!isSystemActive || !isSubmoduleActive) {
        violations.push(rule);
      }
    }
  }

  return violations;
}

// Caché para mapeo de pestañas de navegación a Sistema y Submódulo
export const TAB_TO_MODULE_MAP: Record<string, { systemId: SystemModuleId; submoduleId: string }> = {};

SYSTEM_MODULES_CATALOG.forEach((system) => {
  system.submodules.forEach((submodule) => {
    submodule.relatedTabs.forEach((tab) => {
      TAB_TO_MODULE_MAP[tab] = {
        systemId: system.id,
        submoduleId: submodule.id
      };
    });
  });
});

export const EXEMPT_TABS = new Set<string>([
  'dashboard',
  'superadmin',
  'schema'
]);

/**
 * Valida si una licencia tiene acceso a un sistema clínico completo
 */
export function canAccessSystemWithLicense(
  license: BranchLicense | null | undefined,
  systemId: SystemModuleId
): boolean {
  if (!license) return true; // Fallback suite completa
  if (license.status === 'suspendida') return false;
  return !!license.enabledSystems?.[systemId];
}

/**
 * Valida si una licencia tiene acceso a un sistema y submódulo específico
 */
export function canAccessSubmoduleWithLicense(
  license: BranchLicense | null | undefined,
  systemId: SystemModuleId,
  submoduleId?: string
): boolean {
  if (!license) return true;
  if (license.status === 'suspendida') return false;
  if (!license.enabledSystems?.[systemId]) return false;
  if (!submoduleId) return true;
  return !!license.enabledSubmodules?.[submoduleId];
}

/**
 * Valida si una licencia tiene contratada una pestaña de la interfaz
 */
export function canAccessTabWithLicense(
  license: BranchLicense | null | undefined,
  tabId: string
): boolean {
  if (EXEMPT_TABS.has(tabId)) return true;
  const mapping = TAB_TO_MODULE_MAP[tabId];
  if (!mapping) return true;
  return canAccessSubmoduleWithLicense(license, mapping.systemId, mapping.submoduleId);
}


/**
 * Migración idempotente para asegurar que todas las sedes de los tenants tengan una licencia válida.
 * Si una sede no tiene licencia, le asigna SUITE_COMPLETA indefinida para no romper producción.
 */
export function ensureBranchesHaveLicenses(tenants: any[]): { tenants: any[]; migratedCount: number } {
  let migratedCount = 0;
  const updatedTenants = tenants.map((tenant) => {
    let tenantChanged = false;
    const updatedBranches = (tenant.branches || []).map((branch: any) => {
      if (!branch.license) {
        migratedCount++;
        tenantChanged = true;
        return {
          ...branch,
          license: createDefaultFullSuiteLicense(tenant.id, branch.id)
        };
      }
      return branch;
    });

    if (tenantChanged) {
      return {
        ...tenant,
        branches: updatedBranches
      };
    }
    return tenant;
  });

  return { tenants: updatedTenants, migratedCount };
}

const AUDIT_STORAGE_KEY = 'lis_license_audit_logs';

/**
 * Registra un evento de auditoría de licencias
 */
export function recordLicenseAuditLog(
  entry: Omit<import('../types/licensing').LicenseAuditLog, 'id' | 'timestamp'>
): import('../types/licensing').LicenseAuditLog {
  const fullLog: import('../types/licensing').LicenseAuditLog = {
    ...entry,
    id: `log-lic-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString()
  };

  if (typeof window !== 'undefined') {
    try {
      const existing = localStorage.getItem(AUDIT_STORAGE_KEY);
      const parsed: import('../types/licensing').LicenseAuditLog[] = existing ? JSON.parse(existing) : [];
      const updated = [fullLog, ...parsed].slice(0, 500); // Mantener últimos 500 registros
      localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Error guardando log de auditoría de licencia:', e);
    }
  }

  return fullLog;
}

/**
 * Obtiene los registros de auditoría de licencias con filtros opcionales
 */
export function getLicenseAuditLogs(tenantId?: string, branchId?: string): import('../types/licensing').LicenseAuditLog[] {
  if (typeof window === 'undefined') return [];
  try {
    const existing = localStorage.getItem(AUDIT_STORAGE_KEY);
    if (!existing) return [];
    const parsed: import('../types/licensing').LicenseAuditLog[] = JSON.parse(existing);
    return parsed.filter(l => {
      if (tenantId && l.tenantId !== tenantId) return false;
      if (branchId && l.branchId !== branchId) return false;
      return true;
    });
  } catch (e) {
    console.error('Error recuperando logs de auditoría de licencia:', e);
    return [];
  }
}

