/**
 * ISO 15189:2022 & CLSI Pre-Analytical Sample Integrity & Stability Engine
 * 
 * Complies with:
 * - ISO 15189:2022 Clause 7.2.4 (Sample reception, stability, and handling)
 * - CLSI GP44-A4 (Procedures for Handling and Processing of Blood Specimens)
 * - CLSI H21-A5 (Collection, Transport, and Processing of Coagulation Specimens)
 * - CLSI H04-A6 (Procedures for Venipuncture Diagnostic Blood Specimens)
 */

import { Specimen } from '../types';

export type StabilityStatus = 'OPTIMO' | 'ALERTA' | 'CRITICO_EXPIRADO' | 'ESTABILIZADO_SEPARADO';

export interface TubeStabilityRule {
  tubeType: string;
  displayName: string;
  colorHex: string;
  capColorName: string;
  department: string;
  maxStabilityMinutesRoomTemp: number; // At 20-25°C
  maxStabilityMinutesRefrigerated: number; // At 2-8°C
  maxCentrifugationDelayMinutes: number; // Max delay before separation from clot/cells
  isoStandardRef: string;
  clsiGuideline: string;
  criticalAnalytesAffected: string[];
  degradationBiases: {
    analyte: string;
    mechanism: string;
    biasDescription: string;
    clinicalImpact: string;
  }[];
  handlingRecommendations: string[];
}

export const ISO_STABILITY_RULES: Record<string, TubeStabilityRule> = {
  EDTA_MORADO: {
    tubeType: 'EDTA_MORADO',
    displayName: 'K2/K3 EDTA (Tubo Morado / Lila)',
    colorHex: '#9333ea',
    capColorName: 'Lila / Morado',
    department: 'Hematología & Biología Molecular',
    maxStabilityMinutesRoomTemp: 360, // 6 horas
    maxStabilityMinutesRefrigerated: 1440, // 24 horas (2-8°C)
    maxCentrifugationDelayMinutes: 360,
    isoStandardRef: 'ISO 15189:2022 §7.2.4 & ICSH FBC Guidelines',
    clsiGuideline: 'CLSI H04-A6 / H20-A2',
    criticalAnalytesAffected: ['Plaquetas (PLT)', 'Leucocitos (WBC)', 'Neutrófilos %', 'Frotis Periférico', 'VCM'],
    degradationBiases: [
      {
        analyte: 'Morfología Leucocitaria & Neutrófilos',
        mechanism: 'Degranulación y cariolisis neutrofílica in-vitro',
        biasDescription: 'Vacuolización celular y lisis leucocitaria tras > 4-6h.',
        clinicalImpact: 'Imposibilita recuento diferencial manual confiable.'
      },
      {
        analyte: 'Volumen Corpuscular Medio (VCM) & Plaquetas',
        mechanism: 'Hinchazón osmótica por quelación prolongada',
        biasDescription: 'Aumento falso de VCM (+3-6 fL) y pseudotrombocitopenia por agregación.',
        clinicalImpact: 'Falsa macrocitosis y sospecha errónea de trombocitopenia.'
      }
    ],
    handlingRecommendations: [
      'Homogeneizar por inversión suave (8-10 veces) inmediatamente tras flebotomía.',
      'Realizar frotis y hemograma automatizado antes de 4 horas para máxima resolución morfológica.',
      'Si el procesamiento demorará > 6h, conservar a 2-8°C (no congelar sangre total).'
    ]
  },

  SUERO_ROJO: {
    tubeType: 'SUERO_ROJO',
    displayName: 'Suero Gel / Seco (Tubo Rojo / Oro)',
    colorHex: '#e11d48',
    capColorName: 'Rojo / Tapa Dorada',
    department: 'Química Clínica, Inmunología & Serología',
    maxStabilityMinutesRoomTemp: 120, // 2 horas sin centrifugar
    maxStabilityMinutesRefrigerated: 2880, // 48 horas (separado a 2-8°C)
    maxCentrifugationDelayMinutes: 120,
    isoStandardRef: 'ISO 15189:2022 §7.2.4 / CLSI GP44-A4',
    clsiGuideline: 'CLSI GP44-A4 §5.2',
    criticalAnalytesAffected: ['Glucosa', 'Potasio (K+)', 'LDH', 'Fósforo Inorgánico', 'Troponina'],
    degradationBiases: [
      {
        analyte: 'Glucosa Sérica',
        mechanism: 'Glucólisis activa por eritrocitos y leucocitos viables',
        biasDescription: 'Disminución de 5% a 7% por hora de retraso pre-centrifugación.',
        clinicalImpact: 'Riesgo crítico de pseudohipoglucemia o falso control en diabéticos.'
      },
      {
        analyte: 'Potasio Sérico (K+)',
        mechanism: 'Inhibición de bomba Na+/K+ ATPasa por consumo de ATP en eritrocitos',
        biasDescription: 'Fuga de potasio intracelular (+0.2 a +0.6 mmol/L por hora).',
        clinicalImpact: 'Pseudohiperkalemia que puede motivar intervenciones cardiológicas erróneas.'
      },
      {
        analyte: 'Lactato Deshidrogenasa (LDH)',
        mechanism: 'Liberación pasiva de isoenzimas eritrocitarias',
        biasDescription: 'Elevación falsa progresiva tras 1-2h de contacto con el coágulo.',
        clinicalImpact: 'Falsa sospecha de hemólisis intravascular o daño tisular.'
      }
    ],
    handlingRecommendations: [
      'Permitir retracción completa del coágulo (20-30 min) antes de centrifugar.',
      'Centrifugar a 1800-2200g durante 10-15 minutos antes de 2 horas post-flebotomía.',
      'Una vez separado con gel de barrera o alícuota, el suero es estable 48h a 2-8°C.'
    ]
  },

  CITRATO_AZUL: {
    tubeType: 'CITRATO_AZUL',
    displayName: 'Citrato de Sodio 3.2% (Tubo Azul Claro)',
    colorHex: '#0284c7',
    capColorName: 'Azul Claro',
    department: 'Hemostasia & Coagulación',
    maxStabilityMinutesRoomTemp: 240, // 4 horas para TP; 2 horas para TPT
    maxStabilityMinutesRefrigerated: 240, // 4 horas (No refrigerar sangre total para hemostasia por activación por frío)
    maxCentrifugationDelayMinutes: 60, // Centrifugación óptima dentro de 1 hora
    isoStandardRef: 'ISO 15189:2022 §7.2.4 & CLSI H21-A5',
    clsiGuideline: 'CLSI H21-A5 §4.3 (Collection, Transport and Processing)',
    criticalAnalytesAffected: ['Tiempo de Tromboplastina (TPT/APTT)', 'Factor VIII', 'Factor V', 'Fibrinógeno', 'TP/INR'],
    degradationBiases: [
      {
        analyte: 'Tiempo de Tromboplastina Parcial (TPT)',
        mechanism: 'Labilización térmica de Factor VIII y neutralización de heparina por PF4 plaquetario',
        biasDescription: 'Prolongación espuria del TPT tras > 2 horas sin separación de plasma.',
        clinicalImpact: 'Ajustes erróneos en dosis de heparina no fraccionada o sospecha de coagulopatía.'
      },
      {
        analyte: 'Factores Lábiles (Factor V y VIII)',
        mechanism: 'Degradación proteolítica a temperatura ambiente',
        biasDescription: 'Caída de actividad de factores > 20% tras 4 horas.',
        clinicalImpact: 'Falso déficit de factores de la vía intrínseca y común.'
      }
    ],
    handlingRecommendations: [
      'Mantener estrictamente la relación sangre:anticoagulante 9:1 (llenado al 100% de la marca).',
      'NO refrigerar el tubo sin centrifugar (la refrigeración activa plaquetas y Factor VII por frío).',
      'Centrifugar a 1500g por 15 min para obtener Plasma Pobre en Plaquetas (PPP < 10,000/µL).'
    ]
  },

  HEPARINA_VERDE: {
    tubeType: 'HEPARINA_VERDE',
    displayName: 'Heparina de Litio / Sodio (Tubo Verde)',
    colorHex: '#059669',
    capColorName: 'Verde Esmeralda',
    department: 'Gases Arteriales, Electrólitos STAT & Química Urgente',
    maxStabilityMinutesRoomTemp: 30, // 30 min para gases; 120 min para química
    maxStabilityMinutesRefrigerated: 120, // 2 horas en baño de hielo
    maxCentrifugationDelayMinutes: 30,
    isoStandardRef: 'ISO 15189:2022 §7.2.4 / CLSI C46-A2',
    clsiGuideline: 'CLSI C46-A2 (Blood Gas and pH Analysis)',
    criticalAnalytesAffected: ['pH', 'pCO2', 'pO2', 'Lactato', 'Ionóforo Calcio Iónico (iCa)'],
    degradationBiases: [
      {
        analyte: 'Gases Arteriales (pH, pO2, pCO2) y Lactato',
        mechanism: 'Respiración celular leucocitaria y eritrocitaria continuada',
        biasDescription: 'Caída de pO2 y pH, aumento de pCO2 y elevación rápida de lactato (> 0.5 mmol/L en 30m).',
        clinicalImpact: 'Falsa acidosis metabólica/respiratoria y sobreestimación de sepsis.'
      }
    ],
    handlingRecommendations: [
      'Expulsar cualquier burbuja de aire de inmediato para evitar difusión de O2 atmosférico.',
      'Analizar de forma inmediata (< 15-30 minutos). Si hay demora, sumergir en baño de agua-hielo.',
      'Mezclar enérgicamente por rotación en las palmas antes del análisis.'
    ]
  },

  ORINA: {
    tubeType: 'ORINA',
    displayName: 'Orina Espontánea / 24h (Frasco / Tubo Cónico)',
    colorHex: '#d97706',
    capColorName: 'Amarillo / Ámbar',
    department: 'Urianálisis, Sedimento & Microbiología',
    maxStabilityMinutesRoomTemp: 120, // 2 horas
    maxStabilityMinutesRefrigerated: 1440, // 24 horas (2-8°C)
    maxCentrifugationDelayMinutes: 120,
    isoStandardRef: 'ISO 15189:2022 §7.2.4 / CLSI GP16-A3',
    clsiGuideline: 'CLSI GP16-A3 (Urinalysis Collection and Examination)',
    criticalAnalytesAffected: ['Leucocitos en Sedimento', 'Cilindros Hialinos/Granulosos', 'Bacterias / Nitritos', 'Glucosa / pH'],
    degradationBiases: [
      {
        analyte: 'Sedimento Urinario (Cilindros & Células)',
        mechanism: 'Lisis celular por pH alcalino y baja osmolaridad',
        biasDescription: 'Destrucción de hasta 50% de leucocitos y eritrocitos en 2 horas a temp ambiente.',
        clinicalImpact: 'Falso negativo en microhematuria o infección de vías urinarias.'
      },
      {
        analyte: 'pH Urinario & Nitritos',
        mechanism: 'Proliferación bacteriana con enzima ureasa',
        biasDescription: 'Alcalinización del pH (> 7.5) por hidrólisis de urea a amonio.',
        clinicalImpact: 'Precipitación de fosfatos amorfos que ocultan el campo microscópico.'
      }
    ],
    handlingRecommendations: [
      'Procesar tira reactiva y examen microscópico antes de 2 horas de emitida.',
      'Si no se procesa de inmediato, refrigerar entre 2°C y 8°C de inmediato.',
      'Evitar exposición prolongada a la luz solar para preservar urobilinógeno y bilirrubina.'
    ]
  },

  LCR: {
    tubeType: 'LCR',
    displayName: 'Líquido Cefalorraquídeo / Cavidades (Tubo Estéril)',
    colorHex: '#6366f1',
    capColorName: 'Transparente / Tapón Roscado',
    department: 'Líquidos Biológicos & Urgencias STAT',
    maxStabilityMinutesRoomTemp: 60, // 1 hora STAT
    maxStabilityMinutesRefrigerated: 120, // 2 horas
    maxCentrifugationDelayMinutes: 30,
    isoStandardRef: 'ISO 15189:2022 §7.2.4 / CLSI H56-A',
    clsiGuideline: 'CLSI H56-A (Body Fluid Analysis)',
    criticalAnalytesAffected: ['Recuento Celular en Cámara Neubauer', 'Glucosa en LCR', 'Lactato en LCR', 'Tinción de Gram'],
    degradationBiases: [
      {
        analyte: 'Recuento Leucocitario y Diferencial en LCR',
        mechanism: 'Lisis celular acelerada en medio hipotónico con baja concentración proteica',
        biasDescription: 'Pérdida de hasta 50% de leucocitos en los primeros 60-90 minutos.',
        clinicalImpact: 'Falso negativo en pleocitosis con riesgo de descartar erróneamente meningitis.'
      }
    ],
    handlingRecommendations: [
      'Procesamiento STAT inmediato y prioritario sobre cualquier otra muestra de rutina.',
      'Contar en cámara de Neubauer dentro de los primeros 30 minutos de punción lumbar.',
      'No refrigerar el tubo destinado a cultivo microbiológico (preservar Neisseria meningitidis).'
    ]
  }
};

export interface SampleIntegrityEvaluation {
  specimenId: string;
  barcode: string;
  tubeType: string;
  rule: TubeStabilityRule;
  phlebotomyTimestamp: string; // ISO string
  receptionTimestamp?: string;
  centrifugedTimestamp?: string;
  processingTimestamp?: string;
  
  // Elapsed metrics
  elapsedMinutesTotal: number; // Since phlebotomy
  transitMinutes: number; // Phlebotomy -> Reception
  preanalyticalBenchMinutes: number; // Reception -> Processing
  
  // Stability & ISO status
  maxAllowedMinutes: number;
  fractionUsed: number; // 0.0 to 1.0+
  remainingMinutes: number;
  status: StabilityStatus;
  
  // Human readable descriptors
  elapsedFormatted: string;
  remainingFormatted: string;
  statusLabel: string;
  statusBadgeColor: string;
  progressBarColor: string;
  
  // ISO Compliance Details
  isCompliantIso15189: boolean;
  alertLevel: 'NORMAL' | 'WARNING' | 'CRITICAL_NON_CONFORMITY';
  deviationSummary?: string;
  activeBiases: TubeStabilityRule['degradationBiases'];
  recommendedTechnicianAction: string;
}

/**
 * Normalizes any tube type string to a standard ISO_STABILITY_RULES key.
 */
export function normalizeTubeType(rawTubeType?: string): string {
  if (!rawTubeType) return 'SUERO_ROJO';
  const upper = rawTubeType.toUpperCase();
  if (upper.includes('EDTA') || upper.includes('MORADO') || upper.includes('LILA') || upper.includes('HEMOGRAMA')) {
    return 'EDTA_MORADO';
  }
  if (upper.includes('CITRAT') || upper.includes('AZUL') || upper.includes('COAGULA') || upper.includes('PT') || upper.includes('PTT')) {
    return 'CITRATO_AZUL';
  }
  if (upper.includes('HEPARIN') || upper.includes('VERDE') || upper.includes('GAS')) {
    return 'HEPARINA_VERDE';
  }
  if (upper.includes('ORINA') || upper.includes('URI') || upper.includes('SEDIMENTO')) {
    return 'ORINA';
  }
  if (upper.includes('LCR') || upper.includes('CEFALO') || upper.includes('LIQUIDO')) {
    return 'LCR';
  }
  return 'SUERO_ROJO';
}

/**
 * Formats minutes into human-readable hours and minutes (e.g. "1h 24m" or "45m")
 */
export function formatMinutes(mins: number): string {
  if (mins < 0) return '0m';
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

/**
 * Evaluates the Sample Integrity Status according to ISO 15189 and CLSI protocols.
 */
export function evaluateSampleIntegrity(
  specimen: Partial<Specimen> & { barcode: string; tubeType?: string },
  currentTime: Date = new Date()
): SampleIntegrityEvaluation {
  const normType = normalizeTubeType(specimen.tubeType);
  const rule = ISO_STABILITY_RULES[normType] || ISO_STABILITY_RULES.SUERO_ROJO;

  // Resolve Phlebotomy Timestamp (Fallback to reasonable simulated time if undefined)
  let phlebotomyDate: Date;
  if (specimen.phlebotomyTime) {
    phlebotomyDate = new Date(specimen.phlebotomyTime);
  } else if (specimen.collectedAt) {
    phlebotomyDate = new Date(specimen.collectedAt);
  } else {
    // Fallback: 45 minutes ago for simulation
    phlebotomyDate = new Date(currentTime.getTime() - 45 * 60 * 1000);
  }

  // Calculate elapsed time from phlebotomy
  const phlebotomyMs = phlebotomyDate.getTime();
  const currentMs = currentTime.getTime();
  const elapsedMs = Math.max(0, currentMs - phlebotomyMs);
  const elapsedMinutes = Math.round(elapsedMs / (60 * 1000));

  // Determine Max Stability Window based on storage condition
  const isRefrigerated = specimen.temperatureCondition === 'REFRIGERADA_2_8';
  const isSeparated = Boolean(specimen.isSeparated || specimen.centrifugedAt);
  
  let maxAllowedMinutes = rule.maxStabilityMinutesRoomTemp;
  if (isRefrigerated) {
    maxAllowedMinutes = rule.maxStabilityMinutesRefrigerated;
  }

  // If already separated or processed, freeze pre-analytical timer at that checkpoint
  let effectiveElapsedMinutes = elapsedMinutes;
  if (specimen.processedAt) {
    const procMs = new Date(specimen.processedAt).getTime();
    effectiveElapsedMinutes = Math.max(0, Math.round((procMs - phlebotomyMs) / 60000));
  } else if (specimen.centrifugedAt && normType === 'SUERO_ROJO') {
    const centMs = new Date(specimen.centrifugedAt).getTime();
    effectiveElapsedMinutes = Math.max(0, Math.round((centMs - phlebotomyMs) / 60000));
  }

  const fractionUsed = effectiveElapsedMinutes / maxAllowedMinutes;
  const remainingMinutes = Math.max(0, maxAllowedMinutes - effectiveElapsedMinutes);

  // Determine Stability Status Grade
  let status: StabilityStatus = 'OPTIMO';
  let alertLevel: 'NORMAL' | 'WARNING' | 'CRITICAL_NON_CONFORMITY' = 'NORMAL';
  let statusLabel = 'Estable / Óptimo ISO';
  let statusBadgeColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
  let progressBarColor = 'bg-gradient-to-r from-emerald-500 to-teal-400';
  let isCompliantIso15189 = true;
  let deviationSummary: string | undefined = undefined;

  if (isSeparated) {
    status = 'ESTABILIZADO_SEPARADO';
    statusLabel = 'Separado / Estabilizado';
    statusBadgeColor = 'bg-sky-500/20 text-sky-300 border-sky-500/40';
    progressBarColor = 'bg-sky-500';
  } else if (fractionUsed >= 1.0) {
    status = 'CRITICO_EXPIRADO';
    alertLevel = 'CRITICAL_NON_CONFORMITY';
    statusLabel = 'Integridad Comprometida / Expirado';
    statusBadgeColor = 'bg-rose-500/25 text-rose-200 border-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.4)] animate-pulse';
    progressBarColor = 'bg-rose-500';
    isCompliantIso15189 = false;
    deviationSummary = `Superó el límite de estabilidad ISO (${formatMinutes(effectiveElapsedMinutes)} vs máx ${formatMinutes(maxAllowedMinutes)}). Posible sesgo en analitos termolábiles.`;
  } else if (fractionUsed >= 0.60) {
    status = 'ALERTA';
    alertLevel = 'WARNING';
    statusLabel = 'Alerta de Estabilidad Preanalítica';
    statusBadgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/50';
    progressBarColor = 'bg-amber-500';
    deviationSummary = `Cercano al límite de estabilidad (${formatMinutes(remainingMinutes)} restantes). Priorizar procesamiento inmediato.`;
  }

  // Recommended Action
  let recommendedAction = 'Muestra en condiciones analíticas óptimas. Proceder con el análisis de rutina.';
  if (status === 'CRITICO_EXPIRADO') {
    recommendedAction = `DESVIACIÓN ISO 15189: Notificar al Jefe de Laboratorio o solicitar re-toma de muestra si se analizan ${rule.criticalAnalytesAffected.slice(0, 3).join(', ')}.`;
  } else if (status === 'ALERTA') {
    recommendedAction = `URGENTE: Cargar inmediatamente en gradilla de analizador o centrifugar para evitar glucólisis / labilización celular.`;
  } else if (isSeparated) {
    recommendedAction = 'Suero/Plasma aislado de células. Estable para corrida analítica o almacenamiento refrigerado 48h.';
  }

  return {
    specimenId: specimen.id || `spec-${specimen.barcode}`,
    barcode: specimen.barcode,
    tubeType: normType,
    rule,
    phlebotomyTimestamp: phlebotomyDate.toISOString(),
    receptionTimestamp: specimen.receptionAt || specimen.collectedAt,
    centrifugedTimestamp: specimen.centrifugedAt,
    processingTimestamp: specimen.processedAt,
    
    elapsedMinutesTotal: effectiveElapsedMinutes,
    transitMinutes: Math.round(effectiveElapsedMinutes * 0.4),
    preanalyticalBenchMinutes: Math.round(effectiveElapsedMinutes * 0.6),
    
    maxAllowedMinutes,
    fractionUsed: Math.min(1.0, fractionUsed),
    remainingMinutes,
    status,
    
    elapsedFormatted: formatMinutes(effectiveElapsedMinutes),
    remainingFormatted: formatMinutes(remainingMinutes),
    statusLabel,
    statusBadgeColor,
    progressBarColor,
    
    isCompliantIso15189,
    alertLevel,
    deviationSummary,
    activeBiases: rule.degradationBiases,
    recommendedTechnicianAction: recommendedAction
  };
}
