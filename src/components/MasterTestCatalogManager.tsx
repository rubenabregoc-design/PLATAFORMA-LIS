import React, { useState } from 'react';
import {
  Search,
  Filter,
  BookOpen,
  Layers,
  Microscope,
  TestTube,
  AlertTriangle,
  Check,
  Plus,
  Edit2,
  Trash2,
  Download,
  RefreshCw,
  FileText,
  ChevronRight,
  Clock,
  ShieldCheck,
  Sparkles,
  Database,
  CheckCircle2,
  Info,
  Copy,
  Code,
  Sliders,
  AlertCircle,
  FileSpreadsheet,
  Zap,
  Tag,
  Crosshair,
  UserCheck,
  ArrowRight
} from 'lucide-react';

// --- Interfaces for LIS Master Test Catalog ---
export interface LisArea {
  id: string;
  code: string;
  name: string;
  description: string;
  subareas: string[];
}

export interface LisReferenceRange {
  id: string;
  sex: 'MASCULINO' | 'FEMENINO' | 'AMBOS';
  ageMinYears: number;
  ageMaxYears: number;
  condition?: string; // e.g. "Embarazo T1", "Ayuno", "Fase Folicular"
  minValue?: number;
  maxValue?: number;
  textReference?: string; // e.g. "NO REACTIVO", "NEGATIVO", "< 5.7%"
  unit: string;
  method?: string;
  source: string; // e.g. "CLSI EP28 / Insert Package 2026"
}

export interface LisCriticalValue {
  id: string;
  parameterName: string;
  unit: string;
  panicLow?: number;
  panicHigh?: number;
  qualitativePanic?: string; // e.g. "REACTIVO", "POSITIVO"
  actionRequired: string; // e.g. "Llamada inmediata a médico tratante + Repetición por duplicado"
}

export interface LisTestParameter {
  id: string;
  code: string;
  loincCode: string;
  name: string;
  unit: string;
  resultType: 'NUMERIC' | 'QUALITATIVE' | 'TEXT' | 'MICROBIOLOGY' | 'PATHOLOGY';
  astmMappingCode?: string;
  hl7MappingCode?: string;
  referenceRanges: LisReferenceRange[];
  criticalValue?: LisCriticalValue;
}

export interface LisAntibiogramRule {
  antibiotic: string;
  loincCode: string;
  micRange: string;
  sirResult: 'S' | 'I' | 'R';
  standard: 'CLSI M100' | 'EUCAST 2026';
}

export interface LisMicrobiologyCulture {
  specimenSource: string;
  incubationHours: number;
  commonOrganisms: string[];
  antibiogramRules: LisAntibiogramRule[];
}

export interface LisMasterTest {
  id: string;
  code: string; // e.g. "HEM-001"
  loincCode: string; // e.g. "57021-8"
  loincName: string;
  name: string;
  shortName: string;
  synonyms: string[];
  areaId: string;
  areaName: string;
  subarea: string;
  resultType: 'NUMERIC' | 'QUALITATIVE' | 'PANEL_MULTI_COMPONENT' | 'MICROBIOLOGY_CULTURE' | 'PATHOLOGY_REPORT';
  specimenType: string; // e.g. "Sangre Total", "Suero", "Orina Chorro Medio"
  tubeType: 'EDTA_LILA' | 'CITRATO_AZUL' | 'SST_AMARILLO' | 'HEPARINA_VERDE' | 'FLUORURO_GRIS' | 'FRASCO_ESTERIL' | 'FORMOL_10';
  tubeColorHex: string;
  tubeAdditive: string;
  minVolumeMl: number;
  method: string;
  defaultUnit?: string;
  fastingRequired: boolean;
  fastingHours?: number;
  patientPreparation?: string;
  tatHours: number; // Turnaround time in hours
  priceUsd: number;
  parameters: LisTestParameter[];
  microbiologyData?: LisMicrobiologyCulture;
  stabilityDetails: string;
  rejectionCriteria: string;
  active: boolean;
}

// --- MASTER DATA SEEDING (ISO 15189 & LOINC 2.82 COMPLIANT) ---
export const MASTER_AREAS: LisArea[] = [
  { id: 'HEM', code: 'HEM', name: 'Hematología', description: 'Biometría hemática, coagulación y citometría', subareas: ['Hemograma', 'Coagulación', 'Reticulocitos', 'Hemoglobinas'] },
  { id: 'COA', code: 'COA', name: 'Coagulación', description: 'Pruebas de hemostasia primaria y secundaria', subareas: ['Tiempos de Coagulación', 'Factores', 'Fibrinólisis'] },
  { id: 'QCL', code: 'QCL', name: 'Química Clínica', description: 'Bioquímica sérica, metabolitos y enzimas', subareas: ['Glucosa & Metabolismo', 'Función Renal', 'Perfil Hepático', 'Perfil Lipídico'] },
  { id: 'ELE', code: 'ELE', name: 'Electrolitos', description: 'Iones, electrolitos y minerales', subareas: ['Electrolitos Séricos', 'Minerales'] },
  { id: 'ENDO', code: 'ENDO', name: 'Endocrinología', description: 'Hormonas tiroideas, sexuales y adrenales', subareas: ['Perfil Tiroideo', 'Hormonas Reproductivas', 'Eje Adrenal'] },
  { id: 'INM', code: 'INM', name: 'Inmunología', description: 'Autoinmunidad, inmunoglobulinas y complemento', subareas: ['Autoinmunidad', 'Inmunoglobulinas', 'Complemento'] },
  { id: 'SER', code: 'SER', name: 'Serología', description: 'Infecciosas, antígenos, anticuerpos y floculación', subareas: ['Serología Viral', 'Enfermedades Infecciosas', 'Treponémicas'] },
  { id: 'URI', code: 'URI', name: 'Uroanálisis', description: 'Examen físico, químico y microscópico de orina', subareas: ['EGO', 'Sedimento Urinario', 'Química en Orina'] },
  { id: 'COP', code: 'COP', name: 'Coprología', description: 'Análisis coprológico, parásitos y sangre oculta', subareas: ['Examen Coprológico', 'Parasitología', 'Inmunoquímica en Heces'] },
  { id: 'MIC', code: 'MIC', name: 'Microbiología', description: 'Cultivos bacteriológicos, micología y antibiogramas', subareas: ['Bacteriología', 'Micología', 'Antibiograma CLSI/EUCAST'] },
  { id: 'BDS', code: 'BDS', name: 'Banco de Sangre', description: 'Inmunohematología, grupos y compatibilidad', subareas: ['Grupo ABO/Rh', 'Pruebas Cruzadas', 'Coombs'] },
  { id: 'MOLE', code: 'MOLE', name: 'Biología Molecular', description: 'RT-PCR, cargas virales y genotipificación', subareas: ['RT-PCR Viral', 'Cargas Virales', 'Genotipificación'] },
  { id: 'GAS', code: 'GAS', name: 'Gases Sanguíneos', description: 'Gasometría arterial/venosa y equilibrio ácido-base', subareas: ['Gasometría Arterial', 'Gasometría Venosa'] },
  { id: 'MAR', code: 'MAR', name: 'Marcadores Tumorales', description: 'Antígenos tumorales oncobiológicos', subareas: ['Marcadores Séricos', 'Proteínas Oncológicas'] },
  { id: 'TOX', code: 'TOX', name: 'Toxicología', description: 'Drogas de abuso y monitoreo de fármacos', subareas: ['Drogas de Abuso', 'Niveles Terapéuticos'] },
  { id: 'AP', code: 'AP', name: 'Anatomía Patológica', description: 'Biopsias, histopatología e inmunohistoquímica', subareas: ['Histopatología', 'Biopsias Quirúrgicas'] },
  { id: 'CIT', code: 'CIT', name: 'Citología', description: 'Papanicolaou y citología de líquidos', subareas: ['Citología Cervicovaginal', 'Citología de Líquidos'] }
];

export const MASTER_TESTS: LisMasterTest[] = [
  // 1. HEMATOLOGÍA - Hemograma Completo (Panel Multi-componente)
  {
    id: 'test-hem-001',
    code: 'HEM-001',
    loincCode: '57021-8',
    loincName: 'CBC W Differential panel - Blood',
    name: 'Hemograma Completo con Diferencial Automatizado',
    shortName: 'Hemograma Completo',
    synonyms: ['CBC', 'Biometría Hemática', 'Citometría Hémica', 'Conteo Sanguíneo'],
    areaId: 'HEM',
    areaName: 'Hematología',
    subarea: 'Hemograma',
    resultType: 'PANEL_MULTI_COMPONENT',
    specimenType: 'Sangre Total en Anticoagulante',
    tubeType: 'EDTA_LILA',
    tubeColorHex: '#a855f7',
    tubeAdditive: 'K2-EDTA 1.8 mg/mL',
    minVolumeMl: 3.0,
    method: 'Impedancia Eléctrica / Citometría de Flujo Óptica / Fotometría',
    defaultUnit: '—',
    fastingRequired: false,
    tatHours: 2,
    priceUsd: 18.50,
    stabilityDetails: '24 horas a 2°C–8°C. Mezclar por inversión 8–10 veces inmediatamente tras punción.',
    rejectionCriteria: 'Muestra coagulada, hemolizada grave, volumen < 1.0 mL o tubo con anticoagulante incorrecto.',
    active: true,
    parameters: [
      {
        id: 'p-hb',
        code: 'HB',
        loincCode: '718-7',
        name: 'Hemoglobina (Hb)',
        unit: 'g/dL',
        resultType: 'NUMERIC',
        astmMappingCode: 'HGB',
        referenceRanges: [
          { id: 'ref-hb-m', sex: 'MASCULINO', ageMinYears: 18, ageMaxYears: 99, minValue: 13.5, maxValue: 17.5, unit: 'g/dL', source: 'CLSI EP28-A3' },
          { id: 'ref-hb-f', sex: 'FEMENINO', ageMinYears: 18, ageMaxYears: 99, minValue: 12.0, maxValue: 15.5, unit: 'g/dL', source: 'CLSI EP28-A3' },
          { id: 'ref-hb-f-emb', sex: 'FEMENINO', ageMinYears: 18, ageMaxYears: 45, condition: 'Embarazo T1/T3', minValue: 11.0, maxValue: 14.0, unit: 'g/dL', source: 'ACOG Guidelines' }
        ],
        criticalValue: { id: 'crit-hb', parameterName: 'Hemoglobina', unit: 'g/dL', panicLow: 6.0, panicHigh: 20.0, actionRequired: 'Notificar inmediatamente a médico o enfermería + Repetición por duplicado' }
      },
      {
        id: 'p-hto',
        code: 'HTO',
        loincCode: '4544-3',
        name: 'Hematocrito (Hto)',
        unit: '%',
        resultType: 'NUMERIC',
        astmMappingCode: 'HCT',
        referenceRanges: [
          { id: 'ref-hto-m', sex: 'MASCULINO', ageMinYears: 18, ageMaxYears: 99, minValue: 38.8, maxValue: 50.0, unit: '%', source: 'CLSI EP28-A3' },
          { id: 'ref-hto-f', sex: 'FEMENINO', ageMinYears: 18, ageMaxYears: 99, minValue: 34.9, maxValue: 44.5, unit: '%', source: 'CLSI EP28-A3' }
        ],
        criticalValue: { id: 'crit-hto', parameterName: 'Hematocrito', unit: '%', panicLow: 18.0, panicHigh: 60.0, actionRequired: 'Llamada crítica urgente + Confirmación visual de paquete celular' }
      },
      {
        id: 'p-wbc',
        code: 'WBC',
        loincCode: '6690-2',
        name: 'Leucocitos Totales (WBC)',
        unit: 'x10³/µL',
        resultType: 'NUMERIC',
        astmMappingCode: 'WBC',
        referenceRanges: [
          { id: 'ref-wbc-a', sex: 'AMBOS', ageMinYears: 18, ageMaxYears: 99, minValue: 4.5, maxValue: 11.0, unit: 'x10³/µL', source: 'CLSI EP28-A3' }
        ],
        criticalValue: { id: 'crit-wbc', parameterName: 'Leucocitos Totales', unit: 'x10³/µL', panicLow: 1.5, panicHigh: 30.0, actionRequired: 'Frotis urgente por Tecnólogo Médico para blastos o neutropenia febril' }
      },
      {
        id: 'p-plt',
        code: 'PLT',
        loincCode: '777-3',
        name: 'Plaquetas (PLT)',
        unit: 'x10³/µL',
        resultType: 'NUMERIC',
        astmMappingCode: 'PLT',
        referenceRanges: [
          { id: 'ref-plt-a', sex: 'AMBOS', ageMinYears: 18, ageMaxYears: 99, minValue: 150, maxValue: 450, unit: 'x10³/µL', source: 'CLSI EP28-A3' }
        ],
        criticalValue: { id: 'crit-plt', parameterName: 'Plaquetas', unit: 'x10³/µL', panicLow: 20, panicHigh: 1000, actionRequired: 'Descarte de pseudotrombocitopenia por EDTA en frotis + Notificación inmediata' }
      },
      {
        id: 'p-neu',
        code: 'NEU_PCT',
        loincCode: '3705-7',
        name: 'Neutrófilos %',
        unit: '%',
        resultType: 'NUMERIC',
        astmMappingCode: 'NEU%',
        referenceRanges: [
          { id: 'ref-neu-a', sex: 'AMBOS', ageMinYears: 18, ageMaxYears: 99, minValue: 40.0, maxValue: 70.0, unit: '%', source: 'CLSI EP28-A3' }
        ]
      },
      {
        id: 'p-lym',
        code: 'LYM_PCT',
        loincCode: '3703-2',
        name: 'Linfocitos %',
        unit: '%',
        resultType: 'NUMERIC',
        astmMappingCode: 'LYM%',
        referenceRanges: [
          { id: 'ref-lym-a', sex: 'AMBOS', ageMinYears: 18, ageMaxYears: 99, minValue: 20.0, maxValue: 45.0, unit: '%', source: 'CLSI EP28-A3' }
        ]
      }
    ]
  },

  // 2. QUÍMICA CLÍNICA - Glucosa en Ayunas
  {
    id: 'test-qcl-001',
    code: 'QCL-001',
    loincCode: '2345-7',
    loincName: 'Glucose [Mass/volume] in Serum or Plasma',
    name: 'Glucosa Básica en Ayunas',
    shortName: 'Glucosa en Ayunas',
    synonyms: ['Glicemia', 'Glucosa Basal', 'Glicemia en Ayunas'],
    areaId: 'QCL',
    areaName: 'Química Clínica',
    subarea: 'Glucosa & Metabolismo',
    resultType: 'NUMERIC',
    specimenType: 'Suero o Plasma Fluorurado',
    tubeType: 'SST_AMARILLO',
    tubeColorHex: '#eab308',
    tubeAdditive: 'Gel Separador y Activador de Coágulo / Fluoruro de Sodio',
    minVolumeMl: 4.0,
    method: 'Enzimático Colorimétrico Hexoquinasa / GOD-POD',
    defaultUnit: 'mg/dL',
    fastingRequired: true,
    fastingHours: 8,
    patientPreparation: 'Ayuno estricto de 8 a 12 horas. Permitido ingerir únicamente agua pura.',
    tatHours: 2,
    priceUsd: 8.00,
    stabilityDetails: 'Suero separado estable 48 horas a 2°C–8°C, o 30 días a -20°C.',
    rejectionCriteria: 'Hemólisis grave (+++), lipemia intensa sin clarificar, o muestra sin centrifugar > 2h.',
    active: true,
    parameters: [
      {
        id: 'p-glu',
        code: 'GLU',
        loincCode: '2345-7',
        name: 'Glucosa Sérica',
        unit: 'mg/dL',
        resultType: 'NUMERIC',
        astmMappingCode: 'GLU',
        referenceRanges: [
          { id: 'ref-glu-norm', sex: 'AMBOS', ageMinYears: 18, ageMaxYears: 99, condition: 'Normoglicemia en Ayunas', minValue: 70, maxValue: 99, unit: 'mg/dL', source: 'ADA Standards of Care 2026' },
          { id: 'ref-glu-pred', sex: 'AMBOS', ageMinYears: 18, ageMaxYears: 99, condition: 'Prediabetes (Alterada)', minValue: 100, maxValue: 125, unit: 'mg/dL', source: 'ADA Standards of Care 2026' },
          { id: 'ref-glu-diab', sex: 'AMBOS', ageMinYears: 18, ageMaxYears: 99, condition: 'Criterio Diagnóstico Diabetes', minValue: 126, maxValue: 500, unit: 'mg/dL', source: 'ADA Standards of Care 2026' }
        ],
        criticalValue: { id: 'crit-glu', parameterName: 'Glucosa Sérica', unit: 'mg/dL', panicLow: 50, panicHigh: 400, actionRequired: 'ALERTA DE HIPOGLICEMIA / HIPERGLICEMIA CRÍTICA: Comunicación directa inmediata a médico' }
      }
    ]
  },

  // 3. QUÍMICA CLÍNICA - Hemoglobina Glicada HbA1c
  {
    id: 'test-qcl-002',
    code: 'QCL-002',
    loincCode: '4548-4',
    loincName: 'Hemoglobin A1c/Hemoglobin.total in Blood',
    name: 'Hemoglobina A1c (HbA1c) por HPLC',
    shortName: 'HbA1c',
    synonyms: ['A1c', 'Hemoglobina Glicosilada', 'Hb Glycated'],
    areaId: 'QCL',
    areaName: 'Química Clínica',
    subarea: 'Glucosa & Metabolismo',
    resultType: 'NUMERIC',
    specimenType: 'Sangre Total en Anticoagulante',
    tubeType: 'EDTA_LILA',
    tubeColorHex: '#a855f7',
    tubeAdditive: 'K2-EDTA 1.8 mg/mL',
    minVolumeMl: 2.0,
    method: 'Cromatografía Líquida de Alta Eficiencia (HPLC) Estandarizada NGSP / IFCC',
    defaultUnit: '%',
    fastingRequired: false,
    tatHours: 4,
    priceUsd: 22.00,
    stabilityDetails: '7 días a 2°C–8°C. No congelar sangre total.',
    rejectionCriteria: 'Hemoglobinopatías severas (HbS/HbC homo), muestra coagulada o tubo incorrecto.',
    active: true,
    parameters: [
      {
        id: 'p-hba1c',
        code: 'HBA1C',
        loincCode: '4548-4',
        name: 'Hemoglobina A1c',
        unit: '%',
        resultType: 'NUMERIC',
        astmMappingCode: 'A1C',
        referenceRanges: [
          { id: 'ref-a1c-norm', sex: 'AMBOS', ageMinYears: 18, ageMaxYears: 99, condition: 'Normal', minValue: 4.0, maxValue: 5.6, unit: '%', source: 'NGSP / ADA 2026' },
          { id: 'ref-a1c-pred', sex: 'AMBOS', ageMinYears: 18, ageMaxYears: 99, condition: 'Prediabetes', minValue: 5.7, maxValue: 6.4, unit: '%', source: 'NGSP / ADA 2026' },
          { id: 'ref-a1c-diab', sex: 'AMBOS', ageMinYears: 18, ageMaxYears: 99, condition: 'Diabetes Controlada / Diagnóstico', minValue: 6.5, maxValue: 14.0, unit: '%', source: 'NGSP / ADA 2026' }
        ],
        criticalValue: { id: 'crit-a1c', parameterName: 'Hemoglobina A1c', unit: '%', panicHigh: 13.0, actionRequired: 'Notificar valor descompensado a endocrinología/médico de cabecera' }
      }
    ]
  },

  // 4. COAGULACIÓN - Tiempo de Protrombina (TP / INR)
  {
    id: 'test-coa-001',
    code: 'COA-001',
    loincCode: '5902-2',
    loincName: 'Prothrombin time (PT) in Plasma by Coagulation assay',
    name: 'Tiempo de Protrombina (TP) con INR e Actividad',
    shortName: 'TP e INR',
    synonyms: ['Prothrombin Time', 'INR', 'Tiempo de Quick'],
    areaId: 'COA',
    areaName: 'Coagulación',
    subarea: 'Tiempos de Coagulación',
    resultType: 'PANEL_MULTI_COMPONENT',
    specimenType: 'Plasma Citratado Pobre en Plaquetas',
    tubeType: 'CITRATO_AZUL',
    tubeColorHex: '#3b82f6',
    tubeAdditive: 'Citrato de Sodio 3.2% (Relación exacta 1:9)',
    minVolumeMl: 2.7,
    method: 'Coagulométrico Foto-Óptico Electromecánico con Tromboplastina Recombinante',
    defaultUnit: 'seg',
    fastingRequired: false,
    tatHours: 2,
    priceUsd: 14.00,
    stabilityDetails: '24 horas a temperatura ambiente (15°C–25°C) con tubo cerrado. No refrigerar sin separar.',
    rejectionCriteria: 'Tubo subllenado (<90% de marca), presencia de microcoágulos, o plasma hemolizado.',
    active: true,
    parameters: [
      {
        id: 'p-tp-sec',
        code: 'TP_SEC',
        loincCode: '5902-2',
        name: 'Tiempo de Protrombina (Segundos)',
        unit: 'segundos',
        resultType: 'NUMERIC',
        astmMappingCode: 'PT_SEC',
        referenceRanges: [
          { id: 'ref-tp-sec', sex: 'AMBOS', ageMinYears: 18, ageMaxYears: 99, minValue: 11.0, maxValue: 13.5, unit: 'segundos', source: 'CLSI H21-A5' }
        ]
      },
      {
        id: 'p-inr',
        code: 'INR',
        loincCode: '6301-6',
        name: 'INR (International Normalized Ratio)',
        unit: 'ratio',
        resultType: 'NUMERIC',
        astmMappingCode: 'INR',
        referenceRanges: [
          { id: 'ref-inr-norm', sex: 'AMBOS', ageMinYears: 18, ageMaxYears: 99, condition: 'Sin Anticoagulación Oral', minValue: 0.8, maxValue: 1.2, unit: 'ratio', source: 'ACCP Guidelines' },
          { id: 'ref-inr-anti', sex: 'AMBOS', ageMinYears: 18, ageMaxYears: 99, condition: 'Rango Terapéutico Warfarina/Acenocumarol', minValue: 2.0, maxValue: 3.0, unit: 'ratio', source: 'ACCP Guidelines' }
        ],
        criticalValue: { id: 'crit-inr', parameterName: 'INR', unit: 'ratio', panicHigh: 5.0, actionRequired: 'ALERTA RIESGO DE HEMORRAGIA GRAVE: Notificar inmediatamente para ajuste de Warfarina/Vitamina K' }
      }
    ]
  },

  // 5. ELECTROLITOS - Potasio Sérico
  {
    id: 'test-ele-002',
    code: 'ELE-002',
    loincCode: '2823-3',
    loincName: 'Potassium [Moles/volume] in Serum or Plasma',
    name: 'Potasio en Suero (K+)',
    shortName: 'Potasio (K+)',
    synonyms: ['Kalemia', 'Potasio Sérico', 'K+'],
    areaId: 'ELE',
    areaName: 'Electrolitos',
    subarea: 'Electrolitos Séricos',
    resultType: 'NUMERIC',
    specimenType: 'Suero o Plasma Heparinizado',
    tubeType: 'SST_AMARILLO',
    tubeColorHex: '#eab308',
    tubeAdditive: 'Gel Separador / Heparina de Litio',
    minVolumeMl: 3.0,
    method: 'Potenciometría Directa con Electrodo de Ion Selectivo (ISE)',
    defaultUnit: 'mmol/L',
    fastingRequired: false,
    tatHours: 1,
    priceUsd: 9.50,
    stabilityDetails: 'Separar del paquete globular antes de 1 hora para evitar pseudohiperkalemia por hemólisis.',
    rejectionCriteria: 'Hemólisis visible (+, ++, +++), muestra mantenida sobre paquete celular > 2 horas.',
    active: true,
    parameters: [
      {
        id: 'p-k',
        code: 'K',
        loincCode: '2823-3',
        name: 'Potasio Sérico (K+)',
        unit: 'mmol/L',
        resultType: 'NUMERIC',
        astmMappingCode: 'K',
        referenceRanges: [
          { id: 'ref-k-a', sex: 'AMBOS', ageMinYears: 18, ageMaxYears: 99, minValue: 3.5, maxValue: 5.1, unit: 'mmol/L', source: 'CLSI EP28-A3' }
        ],
        criticalValue: { id: 'crit-k', parameterName: 'Potasio Sérico', unit: 'mmol/L', panicLow: 2.8, panicHigh: 6.2, actionRequired: 'RITMO CARDÍACO EN RIESGO: Repetir muestra de inmediato sin torniquete prolongado y llamar a médico' }
      }
    ]
  },

  // 6. UROANÁLISIS - Examen General de Orina (EGO)
  {
    id: 'test-uri-001',
    code: 'URI-001',
    loincCode: '58410-2',
    loincName: 'Urinalysis complete panel - Urine',
    name: 'Examen General de Orina (EGO) Físico-Químico y Sedimento',
    shortName: 'Examen General de Orina',
    synonyms: ['EGO', 'Citoquímico de Orina', 'Parcial de Orina', 'Urinalysis'],
    areaId: 'URI',
    areaName: 'Uroanálisis',
    subarea: 'EGO',
    resultType: 'PANEL_MULTI_COMPONENT',
    specimenType: 'Orina de Primera Mañana o Muestra Reciente',
    tubeType: 'FRASCO_ESTERIL',
    tubeColorHex: '#06b6d4',
    tubeAdditive: 'Ninguno (Frasco Hermético de Boca Ancha)',
    minVolumeMl: 15.0,
    method: 'Reflectancia en Tira Reactiva Seca + Microscopía Automatizada / Foco de Contraste',
    defaultUnit: '—',
    fastingRequired: false,
    patientPreparation: 'Aseo previo de zona genital externa. Descartar el primer chorro e recolectar el chorro medio.',
    tatHours: 2,
    priceUsd: 10.00,
    stabilityDetails: 'Procesar dentro de 2 horas tras recolección o mantener refrigerado a 2°C–8°C por máximo 6 horas.',
    rejectionCriteria: 'Frasco derramado, orina congelada, o muestra mantenida a temperatura ambiente > 4 horas.',
    active: true,
    parameters: [
      { id: 'p-color', code: 'COLOR', loincCode: '5778-6', name: 'Color', unit: 'text', resultType: 'QUALITATIVE', referenceRanges: [{ id: 'r-col', sex: 'AMBOS', ageMinYears: 0, ageMaxYears: 99, textReference: 'AMARILLO PAJA / AMARILLO AMBAR', unit: 'text', source: 'Manual EGO' }] },
      { id: 'p-asp', code: 'ASPECTO', loincCode: '5770-3', name: 'Aspecto', unit: 'text', resultType: 'QUALITATIVE', referenceRanges: [{ id: 'r-asp', sex: 'AMBOS', ageMinYears: 0, ageMaxYears: 99, textReference: 'LIMPIDO / TRANSPARENTE', unit: 'text', source: 'Manual EGO' }] },
      { id: 'p-ph', code: 'PH_UR', loincCode: '5803-2', name: 'pH Urinario', unit: 'pH', resultType: 'NUMERIC', referenceRanges: [{ id: 'r-ph', sex: 'AMBOS', ageMinYears: 0, ageMaxYears: 99, minValue: 5.0, maxValue: 8.0, unit: 'pH', source: 'CLSI GP16' }] },
      { id: 'p-den', code: 'DENSIDAD', loincCode: '5811-5', name: 'Densidad Específica', unit: 'g/mL', resultType: 'NUMERIC', referenceRanges: [{ id: 'r-den', sex: 'AMBOS', ageMinYears: 0, ageMaxYears: 99, minValue: 1.005, maxValue: 1.030, unit: 'g/mL', source: 'CLSI GP16' }] },
      { id: 'p-prot', code: 'PROT_UR', loincCode: '5804-0', name: 'Proteínas Urinarias', unit: 'mg/dL', resultType: 'QUALITATIVE', referenceRanges: [{ id: 'r-prot', sex: 'AMBOS', ageMinYears: 0, ageMaxYears: 99, textReference: 'NEGATIVO (< 15 mg/dL)', unit: 'mg/dL', source: 'CLSI GP16' }] },
      { id: 'p-glur', code: 'GLU_UR', loincCode: '5792-7', name: 'Glucosa Urinaria', unit: 'mg/dL', resultType: 'QUALITATIVE', referenceRanges: [{ id: 'r-glur', sex: 'AMBOS', ageMinYears: 0, ageMaxYears: 99, textReference: 'NEGATIVO', unit: 'mg/dL', source: 'CLSI GP16' }] },
      { id: 'p-nitr', code: 'NITRITOS', loincCode: '5802-4', name: 'Nitritos Bacterianos', unit: 'text', resultType: 'QUALITATIVE', referenceRanges: [{ id: 'r-nit', sex: 'AMBOS', ageMinYears: 0, ageMaxYears: 99, textReference: 'NEGATIVO', unit: 'text', source: 'CLSI GP16' }] },
      { id: 'p-leu-sed', code: 'LEU_CAMPO', loincCode: '20429-7', name: 'Leucocitos (Sedimento)', unit: '/campo 40x', resultType: 'NUMERIC', referenceRanges: [{ id: 'r-leu-c', sex: 'AMBOS', ageMinYears: 0, ageMaxYears: 99, minValue: 0, maxValue: 5, unit: '/campo 40x', source: 'Microscopía Urinaria' }] }
    ]
  },

  // 7. MICROBIOLOGÍA - Urocultivo e Identificación de Germen
  {
    id: 'test-mic-001',
    code: 'MIC-001',
    loincCode: '630-4',
    loincName: 'Bacteria identified in Urine by Culture',
    name: 'Urocultivo Automatizado con Aislamiento, CMI y Antibiograma',
    shortName: 'Urocultivo y Antibiograma',
    synonyms: ['Cultivo de Orina', 'Urocultivo CMI', 'Urine Culture'],
    areaId: 'MIC',
    areaName: 'Microbiología',
    subarea: 'Bacteriología',
    resultType: 'MICROBIOLOGY_CULTURE',
    specimenType: 'Orina de Chorro Medio / Cateterismo / Punción Suprapúbica',
    tubeType: 'FRASCO_ESTERIL',
    tubeColorHex: '#06b6d4',
    tubeAdditive: 'Frasco Estéril con Preservante Ácido Bórico (Opcional)',
    minVolumeMl: 20.0,
    method: 'Siembra en Agar CLED / MacConkey + Identificación Espectrometría MALDI-TOF / Vitek2',
    defaultUnit: 'UFC/mL',
    fastingRequired: false,
    patientPreparation: 'Aseo genital estricto con agua y jabón sin antisépticos. Recoger antes de iniciar tratamiento antibiótico.',
    tatHours: 48,
    priceUsd: 32.00,
    stabilityDetails: 'Refrigerado 2°C–8°C máximo 24 horas si no tiene conservante borado.',
    rejectionCriteria: 'Frasco derramado o no estéril, orina con contaminación fecal, muestra > 24h sin refrigerar.',
    active: true,
    parameters: [],
    microbiologyData: {
      specimenSource: 'Orina Chorro Medio',
      incubationHours: 24,
      commonOrganisms: ['Escherichia coli', 'Klebsiella pneumoniae', 'Proteus mirabilis', 'Enterococcus faecalis', 'Pseudomonas aeruginosa'],
      antibiogramRules: [
        { antibiotic: 'Amoxicilina / Ac. Clavulánico', loincCode: '18862-3', micRange: '<= 8/4', sirResult: 'S', standard: 'CLSI M100' },
        { antibiotic: 'Ciprofloxacino', loincCode: '18906-8', micRange: '<= 0.25', sirResult: 'S', standard: 'CLSI M100' },
        { antibiotic: 'Ceftriaxona', loincCode: '18886-2', micRange: '<= 1.0', sirResult: 'S', standard: 'CLSI M100' },
        { antibiotic: 'Trimetoprim / Sulfametoxazol', loincCode: '18998-5', micRange: '>= 320', sirResult: 'R', standard: 'CLSI M100' },
        { antibiotic: 'Nitrofurantoína', loincCode: '18953-0', micRange: '<= 32', sirResult: 'S', standard: 'CLSI M100' },
        { antibiotic: 'Gentamicina', loincCode: '18928-2', micRange: '<= 2.0', sirResult: 'S', standard: 'CLSI M100' }
      ]
    }
  },

  // 8. SEROLOGÍA - VIH 1/2 Ag/Ac 4ta Generación
  {
    id: 'test-ser-001',
    code: 'SER-001',
    loincCode: '56888-1',
    loincName: 'HIV 1 and 2 Ag and Ab panel - Serum or Plasma',
    name: 'VIH-1/2 Antígeno p24 y Anticuerpos Totales (4ta Generación)',
    shortName: 'VIH 1/2 4ta Gen',
    synonyms: ['VIH Ag/Ac', 'Prueba de VIH', 'Detección VIH Combo'],
    areaId: 'SER',
    areaName: 'Serología',
    subarea: 'Serología Viral',
    resultType: 'QUALITATIVE',
    specimenType: 'Suero o Plasma',
    tubeType: 'SST_AMARILLO',
    tubeColorHex: '#eab308',
    tubeAdditive: 'Gel Separador / Activador de Coágulo',
    minVolumeMl: 4.0,
    method: 'Quimioluminiscencia de Micropartículas (CMIA) / ECLIA 4ta Gen',
    defaultUnit: 'S/CO',
    fastingRequired: false,
    tatHours: 4,
    priceUsd: 25.00,
    stabilityDetails: '7 días a 2°C–8°C. Muestra protegida de la luz.',
    rejectionCriteria: 'Hemólisis intensa o lipemia extrema sin tratar.',
    active: true,
    parameters: [
      {
        id: 'p-vih-res',
        code: 'VIH_RES',
        loincCode: '56888-1',
        name: 'Resultado VIH 1/2 Combo',
        unit: 'Cualitativo',
        resultType: 'QUALITATIVE',
        referenceRanges: [
          { id: 'ref-vih-neg', sex: 'AMBOS', ageMinYears: 0, ageMaxYears: 99, textReference: 'NO REACTIVO (Index < 1.00 S/CO)', unit: 'S/CO', source: 'CDC / MINSA Panamá' }
        ],
        criticalValue: { id: 'crit-vih', parameterName: 'Resultado VIH Combo', unit: 'Cualitativo', qualitativePanic: 'REACTIVO', actionRequired: 'ALERTA DE SEGURIDAD / LEY 81: Repetición obligatoria por duplicado + Protocolo Algoritmo Confirmatorio de Salud Pública' }
      }
    ]
  }
];

export const MasterTestCatalogManager: React.FC = () => {
  const [areas] = useState<LisArea[]>(MASTER_AREAS);
  const [tests, setTests] = useState<LisMasterTest[]>(MASTER_TESTS);
  const [selectedTest, setSelectedTest] = useState<LisMasterTest>(MASTER_TESTS[0]);
  const [activeTab, setActiveTab] = useState<'EXPLORER' | 'PANEL_INSPECTOR' | 'REFERENCE_RANGES' | 'CRITICAL_LIMITS' | 'CONTAINERS_TUBES' | 'SEED_EXPORT'>('EXPLORER');
  
  // Filtering states
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedAreaFilter, setSelectedAreaFilter] = useState<string>('TODAS');
  const [selectedTubeFilter, setSelectedTubeFilter] = useState<string>('TODOS');
  
  // Modal for New Test Creation
  const [isNewTestModalOpen, setIsNewTestModalOpen] = useState<boolean>(false);
  const [formCode, setFormCode] = useState<string>('QCL-020');
  const [formLoinc, setFormLoinc] = useState<string>('24325-3');
  const [formName, setFormName] = useState<string>('Perfil Hepático Completo');
  const [formShortName, setFormShortName] = useState<string>('Perfil Hepático');
  const [formArea, setFormArea] = useState<string>('QCL');
  const [formSpecimen, setFormSpecimen] = useState<string>('Suero Sérico');
  const [formMethod, setFormMethod] = useState<string>('Cinético UV Enzymatic');
  const [formPrice, setFormPrice] = useState<number>(35.00);

  // Filtered tests list
  const filteredTests = tests.filter(t => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.loincCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.synonyms.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesArea = selectedAreaFilter === 'TODAS' || t.areaId === selectedAreaFilter;
    const matchesTube = selectedTubeFilter === 'TODOS' || t.tubeType === selectedTubeFilter;

    return matchesSearch && matchesArea && matchesTube;
  });

  const handleCreateNewTest = (e: React.FormEvent) => {
    e.preventDefault();
    const areaObj = areas.find(a => a.id === formArea);
    const newTest: LisMasterTest = {
      id: `test-${Date.now()}`,
      code: formCode,
      loincCode: formLoinc,
      loincName: `${formName} LOINC Term`,
      name: formName,
      shortName: formShortName,
      synonyms: [formShortName, formName],
      areaId: formArea,
      areaName: areaObj ? areaObj.name : 'Química Clínica',
      subarea: areaObj ? areaObj.subareas[0] : 'General',
      resultType: 'PANEL_MULTI_COMPONENT',
      specimenType: formSpecimen,
      tubeType: 'SST_AMARILLO',
      tubeColorHex: '#eab308',
      tubeAdditive: 'Gel Separador / Activador de Coágulo',
      minVolumeMl: 4.0,
      method: formMethod,
      defaultUnit: 'mg/dL',
      fastingRequired: true,
      fastingHours: 8,
      tatHours: 3,
      priceUsd: formPrice,
      stabilityDetails: '48 horas refrigerado a 2°C–8°C.',
      rejectionCriteria: 'Muestra con hemólisis ++ o suero lipémico.',
      active: true,
      parameters: []
    };

    setTests([newTest, ...tests]);
    setSelectedTest(newTest);
    setIsNewTestModalOpen(false);
    alert(`¡Examen ${formName} (${formCode}) registrado con éxito en el Catálogo Maestro LIS!`);
  };

  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(tests, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `LIS_MASTER_TEST_CATALOG_LOINC_2.82_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      {/* Top Title Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-950 border border-teal-500/30 p-6 sm:p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden backdrop-blur-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="text-teal-400 text-xs font-black uppercase tracking-[0.2em] mb-2 flex items-center space-x-2">
              <BookOpen className="w-4 h-4 text-teal-400 animate-pulse" />
              <span>Estructura Oficial de Pruebas LIS • Mapeo LOINC v2.82 & ISO 15189</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Catálogo Maestro de Pruebas LIS
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-2 max-w-3xl leading-relaxed">
              Gestión centralizada de exámenes, subáreas, especímenes, recipientes con aditivos, metodologías analíticas, unidades UCUM, intervalos de referencia multidemográficos y límites críticos de pánico.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsNewTestModalOpen(true)}
              className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-black px-4 py-2.5 rounded-2xl text-xs transition shadow-xl flex items-center space-x-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Registrar Nueva Prueba</span>
            </button>
            <button
              onClick={handleExportJson}
              className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-4 py-2.5 rounded-2xl text-xs transition shadow-xl flex items-center space-x-2 cursor-pointer border border-slate-700"
            >
              <Download className="w-4 h-4 text-teal-400" />
              <span>Exportar Semilla JSON</span>
            </button>
          </div>
        </div>

        {/* Dynamic Metric Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-white/10">
          <div className="bg-slate-950/60 border border-white/5 p-4 rounded-2xl space-y-1">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total de Áreas LIS</div>
            <div className="text-2xl font-black font-mono text-teal-300">{areas.length} Especialidades</div>
            <div className="text-[10px] text-teal-400 font-bold">Hematología hasta Patología</div>
          </div>

          <div className="bg-slate-950/60 border border-white/5 p-4 rounded-2xl space-y-1">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Exámenes Configurados</div>
            <div className="text-2xl font-black font-mono text-indigo-300">{tests.length} Pruebas / Paneles</div>
            <div className="text-[10px] text-indigo-400 font-bold">Codificación LOINC Oficial</div>
          </div>

          <div className="bg-slate-950/60 border border-white/5 p-4 rounded-2xl space-y-1">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Intervalos de Referencia</div>
            <div className="text-2xl font-black font-mono text-emerald-400">CLSI EP28-A3</div>
            <div className="text-[10px] text-emerald-400 font-bold">Multidemográficos por Sexo/Edad</div>
          </div>

          <div className="bg-slate-950/60 border border-white/5 p-4 rounded-2xl space-y-1">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Estándar de Mapeo</div>
            <div className="text-2xl font-black font-mono text-amber-300">LOINC 2.82</div>
            <div className="text-[10px] text-amber-400 font-bold">Publicado Feb 2026 (109,325 Términos)</div>
          </div>
        </div>
      </div>

      {/* Module Inner Tab Navigation */}
      <div className="flex items-center space-x-2 bg-slate-900/90 p-2 rounded-2xl border border-slate-800 overflow-x-auto">
        <button
          onClick={() => setActiveTab('EXPLORER')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'EXPLORER' ? 'bg-teal-500 text-slate-950 font-black shadow-lg' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Search className="w-4 h-4" />
          <span>🔍 Explorador de Exámenes ({filteredTests.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('PANEL_INSPECTOR')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'PANEL_INSPECTOR' ? 'bg-teal-500 text-slate-950 font-black shadow-lg' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>🔬 Estructura de Paneles & Componentes</span>
        </button>

        <button
          onClick={() => setActiveTab('REFERENCE_RANGES')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'REFERENCE_RANGES' ? 'bg-teal-500 text-slate-950 font-black shadow-lg' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>📊 Intervalos de Referencia & Demografía</span>
        </button>

        <button
          onClick={() => setActiveTab('CRITICAL_LIMITS')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'CRITICAL_LIMITS' ? 'bg-teal-500 text-slate-950 font-black shadow-lg' : 'text-slate-400 hover:text-white'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>🚨 Matriz de Valores Críticos (Pánico)</span>
        </button>

        <button
          onClick={() => setActiveTab('CONTAINERS_TUBES')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'CONTAINERS_TUBES' ? 'bg-teal-500 text-slate-950 font-black shadow-lg' : 'text-slate-400 hover:text-white'
          }`}
        >
          <TestTube className="w-4 h-4" />
          <span>🧪 Recipientes, Tubos & Muestras</span>
        </button>

        <button
          onClick={() => setActiveTab('SEED_EXPORT')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'SEED_EXPORT' ? 'bg-teal-500 text-slate-950 font-black shadow-lg' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>⚡ Exportador / Estructura BD</span>
        </button>
      </div>

      {/* TAB 1: MASTER TEST CATALOG EXPLORER */}
      {activeTab === 'EXPLORER' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Filterable Master List */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Buscar por nombre, código o LOINC (ej. 57021-8)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Filtrar por Área:</label>
                  <select
                    value={selectedAreaFilter}
                    onChange={(e) => setSelectedAreaFilter(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs font-bold text-slate-200"
                  >
                    <option value="TODAS">Todas las Áreas ({areas.length})</option>
                    {areas.map(a => (
                      <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Filtrar por Tubo/Muestra:</label>
                  <select
                    value={selectedTubeFilter}
                    onChange={(e) => setSelectedTubeFilter(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs font-bold text-slate-200"
                  >
                    <option value="TODOS">Todos los Tubos</option>
                    <option value="EDTA_LILA">EDTA Lila</option>
                    <option value="SST_AMARILLO">SST Amarillo/Rojo</option>
                    <option value="CITRATO_AZUL">Citrato Azul</option>
                    <option value="FRASCO_ESTERIL">Frasco Estéril</option>
                  </select>
                </div>
              </div>
            </div>

            {/* List of Filtered Tests */}
            <div className="space-y-2.5 max-h-[620px] overflow-y-auto pr-1">
              {filteredTests.map((test) => {
                const isSelected = selectedTest.id === test.id;
                return (
                  <div
                    key={test.id}
                    onClick={() => setSelectedTest(test)}
                    className={`p-4 rounded-2xl border transition cursor-pointer space-y-2 ${
                      isSelected
                        ? 'bg-slate-950 border-teal-500 ring-2 ring-teal-500/20 shadow-xl'
                        : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-extrabold text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">
                          {test.code}
                        </span>
                        <span className="font-mono text-[10px] text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 font-bold">
                          LOINC {test.loincCode}
                        </span>
                      </div>
                      <span className="font-mono text-xs font-black text-emerald-400">
                        ${test.priceUsd.toFixed(2)} USD
                      </span>
                    </div>

                    <div className="font-bold text-white text-xs leading-snug">
                      {test.name}
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/60">
                      <div className="flex items-center space-x-1.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: test.tubeColorHex }}></span>
                        <span>{test.specimenType}</span>
                      </div>
                      <span className="text-slate-500 font-mono">TAT: {test.tatHours} hrs</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Selected Test Comprehensive Sheet */}
          <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 p-6 rounded-3xl space-y-6 shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-xs font-mono font-black text-teal-400 bg-teal-500/10 px-2.5 py-1 rounded-lg border border-teal-500/30">
                    CÓDIGO LIS: {selectedTest.code}
                  </span>
                  <span className="text-xs font-mono font-black text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/30">
                    LOINC 2.82: {selectedTest.loincCode}
                  </span>
                </div>
                <h2 className="text-xl font-black text-white">{selectedTest.name}</h2>
                <p className="text-xs text-slate-400 mt-1">Área: <strong className="text-slate-200">{selectedTest.areaName}</strong> • Subárea: <strong className="text-slate-200">{selectedTest.subarea}</strong></p>
              </div>

              <div className="text-right space-y-1">
                <span className="text-2xl font-black font-mono text-emerald-400">${selectedTest.priceUsd.toFixed(2)}</span>
                <div className="text-[10px] text-slate-400 uppercase font-bold">Precio Catálogo LIS</div>
              </div>
            </div>

            {/* Quick Badges & Attributes */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Muestra / Espécimen</span>
                <span className="font-bold text-white flex items-center space-x-1.5">
                  <TestTube className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                  <span className="truncate">{selectedTest.specimenType}</span>
                </span>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Contenedor / Tubo</span>
                <span className="font-bold text-white flex items-center space-x-1.5">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: selectedTest.tubeColorHex }}></span>
                  <span className="truncate">{selectedTest.tubeType.replace('_', ' ')}</span>
                </span>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Tiempo de Entrega (TAT)</span>
                <span className="font-bold text-amber-300 font-mono flex items-center space-x-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>{selectedTest.tatHours} Horas</span>
                </span>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Ayuno Paciente</span>
                <span className={`font-bold ${selectedTest.fastingRequired ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {selectedTest.fastingRequired ? `SÍ (${selectedTest.fastingHours} hrs)` : 'NO Requerido'}
                </span>
              </div>
            </div>

            {/* Detailed Metadata Grid */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3 text-xs">
              <h3 className="font-bold text-white flex items-center space-x-2 border-b border-slate-800 pb-2">
                <Info className="w-4 h-4 text-teal-400" />
                <span>Especificaciones Técnicas & Preparación del Paciente</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Metodología Analítica:</span>
                  <span className="text-slate-200 font-medium leading-relaxed">{selectedTest.method}</span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Aditivo & Anticoagulante:</span>
                  <span className="text-slate-200 font-medium leading-relaxed">{selectedTest.tubeAdditive} (Vol. Mín: {selectedTest.minVolumeMl} mL)</span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Estabilidad de la Muestra:</span>
                  <span className="text-slate-300">{selectedTest.stabilityDetails}</span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Criterios de Rechazo ISO 15189:</span>
                  <span className="text-rose-300 font-medium">{selectedTest.rejectionCriteria}</span>
                </div>
              </div>
            </div>

            {/* Parameters & Reference Ranges associated */}
            <div className="space-y-3">
              <h3 className="font-bold text-white text-sm flex items-center justify-between">
                <span className="flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-teal-400" />
                  <span>Componentes Analíticos & Mapeo ASTM/HL7 ({selectedTest.parameters.length})</span>
                </span>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                  Tipo: {selectedTest.resultType}
                </span>
              </h3>

              {selectedTest.parameters.length > 0 ? (
                <div className="space-y-2">
                  {selectedTest.parameters.map((param) => (
                    <div key={param.id} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-white">{param.name}</span>
                          <span className="font-mono text-[10px] text-teal-400 bg-teal-500/10 px-1.5 py-0.5 rounded">
                            ASTM: {param.astmMappingCode || 'N/A'}
                          </span>
                        </div>
                        <span className="font-mono text-xs font-bold text-amber-300">Unidad: {param.unit}</span>
                      </div>

                      {/* Reference range table */}
                      {param.referenceRanges.length > 0 && (
                        <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800/80 space-y-1 text-[11px]">
                          <div className="text-[10px] font-bold uppercase text-slate-500">Valores de Referencia Multidemográficos:</div>
                          {param.referenceRanges.map((ref) => (
                            <div key={ref.id} className="flex justify-between text-slate-300 font-mono">
                              <span>• {ref.sex} ({ref.ageMinYears}-{ref.ageMaxYears} años) {ref.condition ? `[${ref.condition}]` : ''}:</span>
                              <span className="text-emerald-400 font-bold">
                                {ref.minValue !== undefined ? `${ref.minValue} - ${ref.maxValue} ${ref.unit}` : ref.textReference}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : selectedTest.microbiologyData ? (
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 text-xs">
                  <div className="font-bold text-teal-400 flex items-center space-x-2">
                    <Microscope className="w-4 h-4" />
                    <span>Módulo Microbiológico de Antibiograma & CMI (CLSI M100 / EUCAST)</span>
                  </div>
                  <p className="text-slate-300 text-[11px]">
                    Soporta aislamientos bacterianos con determinación de Concentración Mínima Inhibitoria (CMI) e interpretación automatizada S/I/R.
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                    {selectedTest.microbiologyData.antibiogramRules.map((rule, idx) => (
                      <div key={idx} className="bg-slate-900 p-2 rounded border border-slate-800 flex justify-between">
                        <span className="text-slate-200">{rule.antibiotic}:</span>
                        <span className="text-emerald-400 font-bold">CMI {rule.micRange} ({rule.sirResult})</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-slate-950 rounded-xl text-center text-slate-500 text-xs italic">
                  Examen monoparito simple. Mapeado directamente a la variable global de ingreso de resultados.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PANEL & COMPONENT INSPECTOR */}
      {activeTab === 'PANEL_INSPECTOR' && (
        <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl space-y-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-black text-white flex items-center space-x-2">
                <Layers className="w-5 h-5 text-teal-400" />
                <span>Inspector de Jerarquía de Paneles y Componentes LIS</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Desglose estructural de exámenes agrupados en perfiles clínicos (Hemogramas, Perfiles Lipídicos, EGO, Urocultivo)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tests.filter(t => t.resultType === 'PANEL_MULTI_COMPONENT' || t.resultType === 'MICROBIOLOGY_CULTURE').map((panel) => (
              <div key={panel.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <span className="font-mono text-xs font-bold text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20 mr-2">
                      {panel.code}
                    </span>
                    <span className="font-mono text-xs font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      LOINC {panel.loincCode}
                    </span>
                    <h3 className="text-sm font-black text-white mt-1">{panel.name}</h3>
                  </div>

                  <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                    {panel.parameters.length || (panel.microbiologyData ? panel.microbiologyData.antibiogramRules.length : 0)} Componentes
                  </span>
                </div>

                {/* Component List */}
                <div className="space-y-2">
                  {panel.parameters.map((param, index) => (
                    <div key={param.id} className="bg-slate-900/90 p-3 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-[10px] text-slate-500 font-bold">#{index + 1}</span>
                        <div>
                          <div className="font-bold text-white">{param.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">LOINC: {param.loincCode} | ASTM: {param.astmMappingCode || 'N/A'}</div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-mono text-xs text-amber-300 font-bold">{param.unit}</span>
                      </div>
                    </div>
                  ))}

                  {panel.microbiologyData && (
                    <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800/80 space-y-2 text-xs">
                      <div className="font-bold text-teal-300">Reglas de Antibiograma para {panel.microbiologyData.specimenSource}:</div>
                      <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                        {panel.microbiologyData.antibiogramRules.map((r, i) => (
                          <div key={i} className="bg-slate-950 p-2 rounded border border-slate-800">
                            <span className="text-slate-300">{r.antibiotic}:</span> <span className="text-emerald-400 font-bold">{r.sirResult} ({r.micRange})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: REFERENCE RANGES & DEMOGRAPHICS */}
      {activeTab === 'REFERENCE_RANGES' && (
        <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl space-y-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-black text-white flex items-center space-x-2">
                <Sliders className="w-5 h-5 text-teal-400" />
                <span>Motor de Intervalos de Referencia Multidemográficos</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Rangos de laboratorio versionados según norma CLSI EP28-A3 ajustados por sexo, grupo etario (0 a 99 años), condición clínica e instrumental.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {tests.flatMap(t => t.parameters).filter(p => p.referenceRanges.length > 0).map((param) => (
              <div key={param.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-white text-sm">{param.name}</span>
                    <span className="font-mono text-xs text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      Unidad: {param.unit}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">LOINC: {param.loincCode}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {param.referenceRanges.map((ref) => (
                    <div key={ref.id} className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-teal-300">{ref.sex} ({ref.ageMinYears}-{ref.ageMaxYears} AÑOS)</span>
                        {ref.condition && <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded font-bold">{ref.condition}</span>}
                      </div>

                      <div className="text-base font-black font-mono text-emerald-400">
                        {ref.minValue !== undefined ? `${ref.minValue} - ${ref.maxValue} ${ref.unit}` : ref.textReference}
                      </div>

                      <div className="text-[10px] text-slate-500 italic">Fuente: {ref.source}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: CRITICAL PANIC LIMITS */}
      {activeTab === 'CRITICAL_LIMITS' && (
        <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl space-y-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-black text-white flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-rose-400 animate-pulse" />
                <span>Matriz de Valores Críticos (Valores de Pánico LIS)</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Límites biológicos de pánico que disparan alertas médicas urgentes y llamadas obligatorias al profesional tratante.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tests.flatMap(t => t.parameters).filter(p => p.criticalValue).map((param) => {
              const crit = param.criticalValue!;
              return (
                <div key={crit.id} className="bg-slate-950 border border-rose-500/30 rounded-2xl p-5 space-y-3 shadow-lg relative overflow-hidden">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="font-black text-white text-sm">{param.name}</span>
                    <span className="font-mono text-xs text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/30 font-bold">
                      ALERTA PÁNICO
                    </span>
                  </div>

                  <div className="flex items-center space-x-4 text-xs">
                    {crit.panicLow !== undefined && (
                      <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 space-y-0.5">
                        <span className="text-[10px] text-slate-500 font-bold uppercase block">Pánico Bajo:</span>
                        <span className="text-rose-400 font-black font-mono text-sm">&lt; {crit.panicLow} {crit.unit}</span>
                      </div>
                    )}

                    {crit.panicHigh !== undefined && (
                      <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 space-y-0.5">
                        <span className="text-[10px] text-slate-500 font-bold uppercase block">Pánico Alto:</span>
                        <span className="text-rose-400 font-black font-mono text-sm">&gt; {crit.panicHigh} {crit.unit}</span>
                      </div>
                    )}

                    {crit.qualitativePanic && (
                      <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 space-y-0.5">
                        <span className="text-[10px] text-slate-500 font-bold uppercase block">Pánico Cualitativo:</span>
                        <span className="text-rose-400 font-black text-sm">{crit.qualitativePanic}</span>
                      </div>
                    )}
                  </div>

                  <div className="bg-rose-950/30 border border-rose-500/20 p-3 rounded-xl text-xs text-rose-200 flex items-start space-x-2">
                    <ShieldCheck className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <span><strong>Protocolo Obligatorio:</strong> {crit.actionRequired}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 5: CONTAINERS & TUBE MATRIX */}
      {activeTab === 'CONTAINERS_TUBES' && (
        <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl space-y-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-black text-white flex items-center space-x-2">
                <TestTube className="w-5 h-5 text-teal-400" />
                <span>Matriz de Recipientes, Tubos & Muestras LIS</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Guía de anticoagulantes, volumen mínimo de llenado, orden de extracción de tubos y criterios de rechazo analítico
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-950 border border-purple-500/30 p-5 rounded-2xl space-y-3">
              <div className="flex items-center space-x-2">
                <span className="w-4 h-4 rounded-full bg-purple-500"></span>
                <span className="font-black text-white text-sm">Tubo EDTA (Tapón Morado/Lila)</span>
              </div>
              <p className="text-xs text-slate-300"><strong>Aditivo:</strong> K2-EDTA (Etilendiaminotetraacetato) 1.8 mg/mL.</p>
              <p className="text-xs text-slate-300"><strong>Áreas:</strong> Hematología, HbA1c, Cargas Virales RT-PCR.</p>
              <div className="text-[10px] text-purple-300 bg-purple-500/10 p-2 rounded border border-purple-500/20">
                Invertir suavemente 8 a 10 veces para prevenir microcoágulos.
              </div>
            </div>

            <div className="bg-slate-950 border border-yellow-500/30 p-5 rounded-2xl space-y-3">
              <div className="flex items-center space-x-2">
                <span className="w-4 h-4 rounded-full bg-yellow-500"></span>
                <span className="font-black text-white text-sm">Tubo SST (Tapón Amarillo / Gel)</span>
              </div>
              <p className="text-xs text-slate-300"><strong>Aditivo:</strong> Activador de Coágulo y Gel Polímero Separador.</p>
              <p className="text-xs text-slate-300"><strong>Áreas:</strong> Química Clínica, Endocrinología, Serología, Inmunología.</p>
              <div className="text-[10px] text-yellow-300 bg-yellow-500/10 p-2 rounded border border-yellow-500/20">
                Dejar retraer coágulo 30 min antes de centrifugar a 3500 RPM por 10 min.
              </div>
            </div>

            <div className="bg-slate-950 border border-blue-500/30 p-5 rounded-2xl space-y-3">
              <div className="flex items-center space-x-2">
                <span className="w-4 h-4 rounded-full bg-blue-500"></span>
                <span className="font-black text-white text-sm">Tubo Citrato (Tapón Azul Claro)</span>
              </div>
              <p className="text-xs text-slate-300"><strong>Aditivo:</strong> Citrato de Sodio al 3.2% (0.109 M) en proporción 1:9.</p>
              <p className="text-xs text-slate-300"><strong>Áreas:</strong> Pruebas de Coagulación (TP, INR, TTPa, Fibrinógeno, Dímero D).</p>
              <div className="text-[10px] text-blue-300 bg-blue-500/10 p-2 rounded border border-blue-500/20">
                Llenar estrictamente hasta la marca indicadora (error &lt; 10%).
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: SEEDING & DB SCHEMA */}
      {activeTab === 'SEED_EXPORT' && (
        <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl space-y-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-black text-white flex items-center space-x-2">
                <Database className="w-5 h-5 text-teal-400" />
                <span>Estructura de Base de Datos Relacional / Firestore para LIS</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Representación de esquema normalizado para Firestore / PostgreSQL con soporte multi-sucursal y versionado.
              </p>
            </div>

            <button
              onClick={handleExportJson}
              className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-black px-4 py-2 rounded-xl text-xs transition cursor-pointer"
            >
              Descargar JSON Maestro
            </button>
          </div>

          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
            <div className="text-xs font-mono text-teal-300 font-bold flex items-center space-x-2">
              <Code className="w-4 h-4" />
              <span>Esquema Recomendado Firestore / SQL:</span>
            </div>
            <pre className="text-[11px] font-mono text-slate-300 overflow-x-auto bg-slate-900 p-4 rounded-xl border border-slate-800 leading-relaxed">
{`AREAS (id, codigo, nombre, subareas[])
 └── PRUEBAS (id, codigo_interno, codigo_loinc, nombre, area_id, subarea, tipo_resultado, precio)
       ├── COMPONENTES (id, prueba_id, nombre, unidad, astm_code, loinc_code)
       ├── VALORES_REFERENCIA (id, componente_id, sexo, edad_min, edad_max, condicion, val_min, val_max, fuente)
       ├── VALORES_CRITICOS (id, componente_id, panico_bajo, panico_alto, accion_requerida)
       └── RECIPIENTES_MUESTRAS (id, tubo_tipo, aditivo, vol_min, estabilidad, criterios_rechazo)`}
            </pre>
          </div>
        </div>
      )}

      {/* MODAL TO REGISTER NEW TEST */}
      {isNewTestModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="font-black text-white text-lg flex items-center space-x-2">
                <Plus className="w-5 h-5 text-teal-400" />
                <span>Registrar Examen en Catálogo LIS</span>
              </h3>
              <button onClick={() => setIsNewTestModalOpen(false)} className="text-slate-400 hover:text-white text-xl font-bold p-1 cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleCreateNewTest} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Código LIS Interno:</label>
                  <input
                    type="text"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Código LOINC 2.82:</label>
                  <input
                    type="text"
                    value={formLoinc}
                    onChange={(e) => setFormLoinc(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Nombre Completo del Examen:</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Área LIS:</label>
                  <select
                    value={formArea}
                    onChange={(e) => setFormArea(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-bold"
                  >
                    {areas.map(a => (
                      <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Precio Catálogo (USD):</label>
                  <input
                    type="number"
                    step="0.50"
                    value={formPrice}
                    onChange={(e) => setFormPrice(parseFloat(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Muestra / Espécimen:</label>
                <input
                  type="text"
                  value={formSpecimen}
                  onChange={(e) => setFormSpecimen(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Metodología Analítica:</label>
                <input
                  type="text"
                  value={formMethod}
                  onChange={(e) => setFormMethod(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                  required
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end space-x-3">
                <button type="button" onClick={() => setIsNewTestModalOpen(false)} className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold cursor-pointer">Cancelar</button>
                <button type="submit" className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black cursor-pointer">Guardar en Catálogo</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
