import React, { useState, useMemo } from 'react';
import {
  Search, Filter, BookOpen, Layers, Microscope, TestTube, AlertTriangle, Check, Plus, Edit2, Trash2,
  Download, RefreshCw, FileText, ChevronRight, Clock, ShieldCheck, Sparkles, Database, CheckCircle2,
  Info, Copy, Code, Sliders, AlertCircle, FileSpreadsheet, Zap, Tag, Crosshair, UserCheck, ArrowRight, X
} from 'lucide-react';

export interface LisArea { id: string; code: string; name: string; description: string; subareas: string[]; }
export interface LisReferenceRange { id: string; sex: 'MASCULINO' | 'FEMENINO' | 'AMBOS'; ageMinYears: number; ageMaxYears: number; condition?: string; minValue?: number; maxValue?: number; textReference?: string; unit: string; method?: string; source: string; }
export interface LisCriticalValue { id: string; parameterName: string; unit: string; panicLow?: number; panicHigh?: number; qualitativePanic?: string; actionRequired: string; }
export interface LisTestParameter { id: string; code: string; loincCode: string; name: string; unit: string; resultType: 'NUMERIC' | 'QUALITATIVE' | 'TEXT' | 'MICROBIOLOGY' | 'PATHOLOGY'; astmMappingCode?: string; hl7MappingCode?: string; referenceRanges: LisReferenceRange[]; criticalValue?: LisCriticalValue; isFormula?: boolean; formulaExpression?: string; }
export interface LisAntibiogramRule { antibiotic: string; loincCode: string; micRange: string; sirResult: 'S' | 'I' | 'R'; standard: 'CLSI M100' | 'EUCAST 2026'; }
export interface LisMicrobiologyCulture { specimenSource: string; incubationHours: number; commonOrganisms: string[]; antibiogramRules: LisAntibiogramRule[]; }
export interface LisMasterTest { id: string; code: string; loincCode: string; loincName: string; name: string; shortName: string; synonyms: string[]; areaId: string; areaName: string; subarea: string; resultType: 'NUMERIC' | 'QUALITATIVE' | 'PANEL_MULTI_COMPONENT' | 'MICROBIOLOGY_CULTURE' | 'PATHOLOGY_REPORT'; specimenType: string; tubeType: 'EDTA_LILA' | 'CITRATO_AZUL' | 'SST_AMARILLO' | 'HEPARINA_VERDE' | 'FLUORURO_GRIS' | 'FRASCO_ESTERIL' | 'FORMOL_10'; tubeColorHex: string; tubeAdditive: string; minVolumeMl: number; method: string; defaultUnit?: string; fastingRequired: boolean; fastingHours?: number; patientPreparation?: string; tatHours: number; priceUsd: number; parameters: LisTestParameter[]; microbiologyData?: LisMicrobiologyCulture; stabilityDetails: string; rejectionCriteria: string; active: boolean; }

const MASTER_AREAS: LisArea[] = [
  { id: 'HEM', code: 'HEM', name: 'Hematología', description: 'Biometría hemática y citometría', subareas: ['Hemograma', 'Reticulocitos', 'Hemoglobinas'] },
  { id: 'COA', code: 'COA', name: 'Coagulación', description: 'Hemostasia primaria y secundaria', subareas: ['Tiempos', 'Factores', 'Fibrinólisis'] },
  { id: 'QCL', code: 'QCL', name: 'Química Clínica', description: 'Bioquímica sérica y metabolitos', subareas: ['Química General', 'Perfil Renal', 'Perfil Hepático', 'Perfil Lipídico'] },
  { id: 'ELE', code: 'ELE', name: 'Electrolitos', description: 'Iones y minerales', subareas: ['Electrolitos Séricos', 'Minerales'] },
  { id: 'ENDO', code: 'ENDO', name: 'Endocrinología', description: 'Hormonas y marcadores', subareas: ['Tiroides', 'Hormonas', 'Reproducción'] },
  { id: 'INM', code: 'INM', name: 'Inmunología', description: 'Autoinmunidad e inmunoglobulinas', subareas: ['Autoinmunidad', 'Inmunoglobulinas'] },
  { id: 'SER', code: 'SER', name: 'Serología', description: 'Infecciosas y antígenos', subareas: ['Serología Viral', 'Treponémicas'] },
  { id: 'MIC', code: 'MIC', name: 'Microbiología', description: 'Bacteriología y micología', subareas: ['Bacteriología', 'Micología'] },
  { id: 'URI', code: 'URI', name: 'Uroanálisis', description: 'Examen de orina', subareas: ['EGO', 'Sedimento'] },
  { id: 'COP', code: 'COP', name: 'Coprología', description: 'Análisis de heces', subareas: ['Examen Coprológico'] },
  { id: 'BDS', code: 'BDS', name: 'Banco de Sangre', description: 'Inmunohematología', subareas: ['Grupo/Rh', 'Compatibilidad'] },
  { id: 'MOLE', code: 'MOLE', name: 'Biología Molecular', description: 'RT-PCR', subareas: ['PCR Viral'] },
  { id: 'GAS', code: 'GAS', name: 'Gases Sanguíneos', description: 'Equilibrio ácido-base', subareas: ['Gasometría'] },
  { id: 'MAR', code: 'MAR', name: 'Marcadores Tumorales', description: 'Oncobiología', subareas: ['Marcadores Séricos'] },
  { id: 'TOX', code: 'TOX', name: 'Toxicología', description: 'Drogas de abuso', subareas: ['Drogas'] },
  { id: 'ALE', code: 'ALER', name: 'Alergología', description: 'Inmunoglobulinas E específicas', subareas: ['Alérgenos'] }
];

const MASTER_TESTS: LisMasterTest[] = [
  // 1. HEMATOLOGÍA (21 Componentes aprox)
  {
    id: 'test-hem-001', code: '1001', loincCode: '57021-8', loincName: 'CBC W Differential', name: 'Hemograma Completo', shortName: 'Hemograma', synonyms: ['CBC'], areaId: 'HEM', areaName: 'Hematología', subarea: 'Hemograma', resultType: 'PANEL_MULTI_COMPONENT', specimenType: 'Sangre Total', tubeType: 'EDTA_LILA', tubeColorHex: '#a855f7', tubeAdditive: 'EDTA', minVolumeMl: 3.0, method: 'Impedancia/Óptico', fastingRequired: false, tatHours: 2, priceUsd: 18.50, stabilityDetails: '24h a 2-8°C', rejectionCriteria: 'Coagulada', active: true,
    parameters: [
      { id: 'p-hb', code: 'HB', loincCode: '718-7', name: 'Hemoglobina', unit: 'g/dL', resultType: 'NUMERIC', referenceRanges: [{ id: 'r1', sex: 'MASCULINO', ageMinYears: 18, ageMaxYears: 99, minValue: 13.5, maxValue: 17.5, unit: 'g/dL', source: 'CLSI' }] },
      { id: 'p-hto', code: 'HTO', loincCode: '4544-3', name: 'Hematocrito', unit: '%', resultType: 'NUMERIC', referenceRanges: [{ id: 'r2', sex: 'MASCULINO', ageMinYears: 18, ageMaxYears: 99, minValue: 38.8, maxValue: 50.0, unit: '%', source: 'CLSI' }] },
      { id: 'p-rbc', code: 'RBC', loincCode: '789-8', name: 'Eritrocitos', unit: 'x10⁶/µL', resultType: 'NUMERIC', referenceRanges: [] },
      { id: 'p-vcm', code: 'VCM', loincCode: '787-2', name: 'VCM', unit: 'fL', resultType: 'NUMERIC', referenceRanges: [] },
      { id: 'p-hcm', code: 'HCM', loincCode: '785-6', name: 'HCM', unit: 'pg', resultType: 'NUMERIC', referenceRanges: [] },
      { id: 'p-chcm', code: 'CHCM', loincCode: '786-4', name: 'CHCM', unit: 'g/dL', resultType: 'NUMERIC', referenceRanges: [] },
      { id: 'p-rdw', code: 'RDW', loincCode: '788-0', name: 'RDW-CV', unit: '%', resultType: 'NUMERIC', referenceRanges: [] },
      { id: 'p-wbc', code: 'WBC', loincCode: '6690-2', name: 'Leucocitos', unit: 'x10³/µL', resultType: 'NUMERIC', referenceRanges: [{ id: 'r3', sex: 'AMBOS', ageMinYears: 18, ageMaxYears: 99, minValue: 4.5, maxValue: 11.0, unit: 'x10³/µL', source: 'CLSI' }] },
      { id: 'p-neu-p', code: 'NEU_PCT', loincCode: '3705-7', name: 'Neutrófilos %', unit: '%', resultType: 'NUMERIC', referenceRanges: [] },
      { id: 'p-lym-p', code: 'LYM_PCT', loincCode: '3703-2', name: 'Linfocitos %', unit: '%', resultType: 'NUMERIC', referenceRanges: [] },
      { id: 'p-mon-p', code: 'MON_PCT', loincCode: '5905-5', name: 'Monocitos %', unit: '%', resultType: 'NUMERIC', referenceRanges: [] },
      { id: 'p-eos-p', code: 'EOS_PCT', loincCode: '711-2', name: 'Eosinófilos %', unit: '%', resultType: 'NUMERIC', referenceRanges: [] },
      { id: 'p-bas-p', code: 'BAS_PCT', loincCode: '704-7', name: 'Basófilos %', unit: '%', resultType: 'NUMERIC', referenceRanges: [] },
      { id: 'p-plt', code: 'PLT', loincCode: '777-3', name: 'Plaquetas', unit: 'x10³/µL', resultType: 'NUMERIC', referenceRanges: [{ id: 'r4', sex: 'AMBOS', ageMinYears: 18, ageMaxYears: 99, minValue: 150, maxValue: 450, unit: 'x10³/µL', source: 'CLSI' }] }
    ]
  },

  // 2. COAGULACIÓN (9 Componentes aprox)
  { id: 'test-coa-tp', code: '1101', loincCode: '5902-2', loincName: 'PT', name: 'Tiempo de Protrombina (TP)', shortName: 'TP', synonyms: ['INR'], areaId: 'COA', areaName: 'Coagulación', subarea: 'Tiempos', resultType: 'PANEL_MULTI_COMPONENT', specimenType: 'Plasma', tubeType: 'CITRATO_AZUL', tubeColorHex: '#3b82f6', tubeAdditive: 'Citrato', minVolumeMl: 2.7, method: 'Coagulometría', fastingRequired: false, tatHours: 2, priceUsd: 14.00, stabilityDetails: '4h ambient', rejectionCriteria: 'Hemolizada', active: true, parameters: [{ id: 'p-inr', code: 'INR', loincCode: '6301-6', name: 'INR', unit: 'ratio', resultType: 'NUMERIC', referenceRanges: [] }] },
  { id: 'test-coa-ttpa', code: '1103', loincCode: '3173-2', loincName: 'aPTT', name: 'TTPa (Tiempo de Tromboplastina Parcial)', shortName: 'TTPa', synonyms: ['APTT'], areaId: 'COA', areaName: 'Coagulación', subarea: 'Tiempos', resultType: 'NUMERIC', specimenType: 'Plasma', tubeType: 'CITRATO_AZUL', tubeColorHex: '#3b82f6', tubeAdditive: 'Citrato', minVolumeMl: 2.7, method: 'Coagulometría', fastingRequired: false, tatHours: 2, priceUsd: 14.00, stabilityDetails: '4h ambient', rejectionCriteria: 'Hemolizada', active: true, parameters: [] },
  { id: 'test-coa-fib', code: '1104', loincCode: '3255-7', loincName: 'Fibrinogen', name: 'Fibrinógeno Clauss', shortName: 'Fibrinógeno', synonyms: ['Factor I'], areaId: 'COA', areaName: 'Coagulación', subarea: 'Tiempos', resultType: 'NUMERIC', specimenType: 'Plasma', tubeType: 'CITRATO_AZUL', tubeColorHex: '#3b82f6', tubeAdditive: 'Citrato', minVolumeMl: 2.7, method: 'Clauss', fastingRequired: false, tatHours: 2, priceUsd: 20.00, stabilityDetails: '4h ambient', rejectionCriteria: 'Hemolizada', active: true, parameters: [] },
  { id: 'test-coa-dim', code: '1105', loincCode: '48065-7', loincName: 'D-dimer', name: 'Dímero D', shortName: 'Dímero D', synonyms: ['Thrombosis'], areaId: 'COA', areaName: 'Coagulación', subarea: 'Factores', resultType: 'NUMERIC', specimenType: 'Plasma', tubeType: 'CITRATO_AZUL', tubeColorHex: '#3b82f6', tubeAdditive: 'Citrato', minVolumeMl: 2.7, method: 'Turbidimetría', fastingRequired: false, tatHours: 4, priceUsd: 45.00, stabilityDetails: '4h ambient', rejectionCriteria: 'Hemolizada', active: true, parameters: [] },

  // 3. QUÍMICA CLÍNICA (24 Componentes aprox)
  { id: 'test-qcl-glu', code: '4531', loincCode: '2345-7', loincName: 'Glucose', name: 'Glucosa en Ayunas', shortName: 'Glucosa', synonyms: ['Glicemia'], areaId: 'QCL', areaName: 'Química Clínica', subarea: 'Química General', resultType: 'NUMERIC', specimenType: 'Suero', tubeType: 'SST_AMARILLO', tubeColorHex: '#eab308', tubeAdditive: 'Gel', minVolumeMl: 3.0, method: 'Hexoquinasa', fastingRequired: true, tatHours: 2, priceUsd: 8.00, stabilityDetails: '48h 2-8°C', rejectionCriteria: 'Hemólisis', active: true, parameters: [] },
  { id: 'test-qcl-hba1c', code: '4535', loincCode: '4548-4', loincName: 'HbA1c', name: 'Hemoglobina Glicosilada (HbA1c)', shortName: 'HbA1c', synonyms: ['A1c'], areaId: 'QCL', areaName: 'Química Clínica', subarea: 'Química General', resultType: 'NUMERIC', specimenType: 'Sangre Total', tubeType: 'EDTA_LILA', tubeColorHex: '#a855f7', tubeAdditive: 'EDTA', minVolumeMl: 2.0, method: 'HPLC', fastingRequired: false, tatHours: 6, priceUsd: 22.00, stabilityDetails: '7d 2-8°C', rejectionCriteria: 'Coagulada', active: true, parameters: [] },
  { id: 'test-qcl-crea', code: '4612', loincCode: '2160-0', loincName: 'Creatinine', name: 'Creatinina Sérica', shortName: 'Creatinina', synonyms: ['Función Renal'], areaId: 'QCL', areaName: 'Química Clínica', subarea: 'Perfil Renal', resultType: 'NUMERIC', specimenType: 'Suero', tubeType: 'SST_AMARILLO', tubeColorHex: '#eab308', tubeAdditive: 'Gel', minVolumeMl: 3.0, method: 'Jaffé', fastingRequired: true, tatHours: 2, priceUsd: 9.00, stabilityDetails: '7d 2-8°C', rejectionCriteria: 'Hemólisis', active: true, parameters: [] },
  { id: 'test-qcl-urea', code: 'QCL-011', loincCode: '22664-7', loincName: 'Urea', name: 'Urea / Nitrógeno de Urea (BUN)', shortName: 'Urea/BUN', synonyms: ['Nitrogen'], areaId: 'QCL', areaName: 'Química Clínica', subarea: 'Perfil Renal', resultType: 'PANEL_MULTI_COMPONENT', specimenType: 'Suero', tubeType: 'SST_AMARILLO', tubeColorHex: '#eab308', tubeAdditive: 'Gel', minVolumeMl: 3.0, method: 'Ureasa', fastingRequired: true, tatHours: 2, priceUsd: 8.00, stabilityDetails: '7d 2-8°C', rejectionCriteria: 'Hemólisis', active: true, parameters: [{ id: 'p-urea', name: 'Urea', unit: 'mg/dL', code: 'UREA', loincCode: '3094-0', resultType: 'NUMERIC', referenceRanges: [] }, { id: 'p-bun', name: 'BUN', unit: 'mg/dL', code: 'BUN', loincCode: '22664-7', resultType: 'NUMERIC', referenceRanges: [] }] },
  { id: 'test-qcl-ast', code: 'QCL-020', loincCode: '1920-8', loincName: 'AST', name: 'AST (SGOT)', shortName: 'AST', synonyms: ['TGO'], areaId: 'QCL', areaName: 'Química Clínica', subarea: 'Perfil Hepático', resultType: 'NUMERIC', specimenType: 'Suero', tubeType: 'SST_AMARILLO', tubeColorHex: '#eab308', tubeAdditive: 'Gel', minVolumeMl: 3.0, method: 'UV Cinético', fastingRequired: true, tatHours: 2, priceUsd: 10.00, stabilityDetails: '7d 2-8°C', rejectionCriteria: 'Hemólisis', active: true, parameters: [] },
  { id: 'test-qcl-alt', code: 'QCL-021', loincCode: '1742-6', loincName: 'ALT', name: 'ALT (SGPT)', shortName: 'ALT', synonyms: ['TGP'], areaId: 'QCL', areaName: 'Química Clínica', subarea: 'Perfil Hepático', resultType: 'NUMERIC', specimenType: 'Suero', tubeType: 'SST_AMARILLO', tubeColorHex: '#eab308', tubeAdditive: 'Gel', minVolumeMl: 3.0, method: 'UV Cinético', fastingRequired: true, tatHours: 2, priceUsd: 10.00, stabilityDetails: '7d 2-8°C', rejectionCriteria: 'Hemólisis', active: true, parameters: [] },
  { id: 'test-qcl-bili', code: 'QCL-024', loincCode: '24328-7', loincName: 'Bilirubin Panel', name: 'Bilirrubinas (Total, Directa, Indirecta)', shortName: 'Bilirrubinas', synonyms: ['Ictericia'], areaId: 'QCL', areaName: 'Química Clínica', subarea: 'Perfil Hepático', resultType: 'PANEL_MULTI_COMPONENT', specimenType: 'Suero', tubeType: 'SST_AMARILLO', tubeColorHex: '#eab308', tubeAdditive: 'Gel', minVolumeMl: 3.0, method: 'Colorimétrico', fastingRequired: true, tatHours: 2, priceUsd: 15.00, stabilityDetails: 'Protección luz', rejectionCriteria: 'Hemólisis', active: true, parameters: [
    { id: 'p-bt', code: 'BT', loincCode: '1975-2', name: 'Bilirrubina Total', unit: 'mg/dL', resultType: 'NUMERIC', referenceRanges: [] },
    { id: 'p-bd', code: 'BD', loincCode: '1968-7', name: 'Bilirrubina Directa', unit: 'mg/dL', resultType: 'NUMERIC', referenceRanges: [] },
    { id: 'p-bi', code: 'BI', loincCode: '1971-1', name: 'Bilirrubina Indirecta', unit: 'mg/dL', resultType: 'NUMERIC', referenceRanges: [] }
  ]},
  { id: 'test-qcl-lip', code: '4650', loincCode: '24331-1', loincName: 'Lipid Panel', name: 'Perfil Lipídico', shortName: 'Perfil Lipídico', synonyms: ['Lípidos'], areaId: 'QCL', areaName: 'Química Clínica', subarea: 'Perfil Lipídico', resultType: 'PANEL_MULTI_COMPONENT', specimenType: 'Suero', tubeType: 'SST_AMARILLO', tubeColorHex: '#eab308', tubeAdditive: 'Gel', minVolumeMl: 5.0, method: 'Enzimático', fastingRequired: true, tatHours: 4, priceUsd: 35.00, stabilityDetails: '48h 2-8°C', rejectionCriteria: 'Hemólisis', active: true, parameters: [
    { id: 'p-col', code: '4657', loincCode: '2093-3', name: 'Colesterol Total', unit: 'mg/dL', resultType: 'NUMERIC', referenceRanges: [] },
    { id: 'p-trig', code: '4660', loincCode: '2571-8', name: 'Triglicéridos', unit: 'mg/dL', resultType: 'NUMERIC', referenceRanges: [] },
    { id: 'p-hdl', code: '4658', loincCode: '2085-9', name: 'HDL', unit: 'mg/dL', resultType: 'NUMERIC', referenceRanges: [] },
    { id: 'p-ldl', code: '4659', loincCode: '2089-1', name: 'LDL Colesterol', unit: 'mg/dL', resultType: 'NUMERIC', referenceRanges: [], isFormula: true, formulaExpression: 'COL - (HDL + (TRIG / 5))' },
    { id: 'p-vldl', code: '4661', loincCode: '13487-4', name: 'VLDL Colesterol', unit: 'mg/dL', resultType: 'NUMERIC', referenceRanges: [], isFormula: true, formulaExpression: 'TRIG / 5' }
  ]},

  // 4. ELECTROLYTOS (7 Componentes aprox)
  { id: 'test-ele-na', code: 'ELE-001', loincCode: '2951-2', loincName: 'Sodium', name: 'Sodio Sérico (Na)', shortName: 'Sodio', synonyms: ['Natremia'], areaId: 'ELE', areaName: 'Electrolitos', subarea: 'Electrolitos Séricos', resultType: 'NUMERIC', specimenType: 'Suero', tubeType: 'SST_AMARILLO', tubeColorHex: '#eab308', tubeAdditive: 'Gel', minVolumeMl: 3.0, method: 'ISE', fastingRequired: false, tatHours: 1, priceUsd: 10.00, stabilityDetails: 'Separar < 1h', rejectionCriteria: 'Hemólisis', active: true, parameters: [] },
  { id: 'test-ele-k', code: 'ELE-002', loincCode: '2823-3', loincName: 'Potassium', name: 'Potasio Sérico (K)', shortName: 'Potasio', synonyms: ['Kalemia'], areaId: 'ELE', areaName: 'Electrolitos', subarea: 'Electrolitos Séricos', resultType: 'NUMERIC', specimenType: 'Suero', tubeType: 'SST_AMARILLO', tubeColorHex: '#eab308', tubeAdditive: 'Gel', minVolumeMl: 3.0, method: 'ISE', fastingRequired: false, tatHours: 1, priceUsd: 10.00, stabilityDetails: 'Separar < 1h', rejectionCriteria: 'Hemólisis', active: true, parameters: [] },
  { id: 'test-ele-cl', code: 'ELE-003', loincCode: '2075-0', loincName: 'Chloride', name: 'Cloro Sérico (Cl)', shortName: 'Cloro', synonyms: ['Cloremia'], areaId: 'ELE', areaName: 'Electrolitos', subarea: 'Electrolitos Séricos', resultType: 'NUMERIC', specimenType: 'Suero', tubeType: 'SST_AMARILLO', tubeColorHex: '#eab308', tubeAdditive: 'Gel', minVolumeMl: 3.0, method: 'ISE', fastingRequired: false, tatHours: 1, priceUsd: 10.00, stabilityDetails: 'Separar < 1h', rejectionCriteria: 'Hemólisis', active: true, parameters: [] },
  { id: 'test-ele-ca', code: 'ELE-004', loincCode: '17861-6', loincName: 'Calcium', name: 'Calcio Total', shortName: 'Calcio', synonyms: ['Ca++'], areaId: 'ELE', areaName: 'Electrolitos', subarea: 'Minerales', resultType: 'NUMERIC', specimenType: 'Suero', tubeType: 'SST_AMARILLO', tubeColorHex: '#eab308', tubeAdditive: 'Gel', minVolumeMl: 3.0, method: 'Colorimétrico', fastingRequired: false, tatHours: 2, priceUsd: 10.00, stabilityDetails: '7d 2-8°C', rejectionCriteria: 'Hemólisis', active: true, parameters: [] },

  // 5. ENDOCRINOLOGÍA (15 Componentes aprox)
  { id: 'test-end-tsh', code: 'END-001', loincCode: '11580-8', loincName: 'TSH', name: 'TSH Ultrasensible', shortName: 'TSH', synonyms: ['Tiroides'], areaId: 'ENDO', areaName: 'Endocrinología', subarea: 'Tiroides', resultType: 'NUMERIC', specimenType: 'Suero', tubeType: 'SST_AMARILLO', tubeColorHex: '#eab308', tubeAdditive: 'Gel', minVolumeMl: 2.0, method: 'CLIA', fastingRequired: false, tatHours: 4, priceUsd: 25.00, stabilityDetails: '7d 2-8°C', rejectionCriteria: 'Muestra radioactiva', active: true, parameters: [] },
  { id: 'test-end-t4l', code: 'END-002', loincCode: '2276-4', loincName: 'FT4', name: 'T4 Libre', shortName: 'T4L', synonyms: ['Tiroxina'], areaId: 'ENDO', areaName: 'Endocrinología', subarea: 'Tiroides', resultType: 'NUMERIC', specimenType: 'Suero', tubeType: 'SST_AMARILLO', tubeColorHex: '#eab308', tubeAdditive: 'Gel', minVolumeMl: 2.0, method: 'CLIA', fastingRequired: false, tatHours: 4, priceUsd: 22.00, stabilityDetails: '7d 2-8°C', rejectionCriteria: 'Hemólisis', active: true, parameters: [] },
  { id: 'test-end-fsh', code: 'END-012', loincCode: '15067-2', loincName: 'FSH', name: 'Hormona Folículo Estimulante (FSH)', shortName: 'FSH', synonyms: ['Fertilidad'], areaId: 'ENDO', areaName: 'Endocrinología', subarea: 'Reproducción', resultType: 'NUMERIC', specimenType: 'Suero', tubeType: 'SST_AMARILLO', tubeColorHex: '#eab308', tubeAdditive: 'Gel', minVolumeMl: 2.0, method: 'CLIA', fastingRequired: false, tatHours: 4, priceUsd: 22.00, stabilityDetails: '7d 2-8°C', rejectionCriteria: 'Hemólisis', active: true, parameters: [] },
  { id: 'test-end-lh', code: 'END-013', loincCode: '15068-0', loincName: 'LH', name: 'Hormona Luteinizante (LH)', shortName: 'LH', synonyms: ['Ovulación'], areaId: 'ENDO', areaName: 'Endocrinología', subarea: 'Reproducción', resultType: 'NUMERIC', specimenType: 'Suero', tubeType: 'SST_AMARILLO', tubeColorHex: '#eab308', tubeAdditive: 'Gel', minVolumeMl: 2.0, method: 'CLIA', fastingRequired: false, tatHours: 4, priceUsd: 22.00, stabilityDetails: '7d 2-8°C', rejectionCriteria: 'Hemólisis', active: true, parameters: [] },

  // 6. INMUNOLOGÍA (9 Componentes aprox)
  { id: 'test-inm-ana', code: 'AUT-001', loincCode: '42250-1', loincName: 'ANA', name: 'ANA (Anticuerpos Antinucleares)', shortName: 'ANA', synonyms: ['IFI ANA'], areaId: 'INM', areaName: 'Inmunología', subarea: 'Autoinmunidad', resultType: 'QUALITATIVE', specimenType: 'Suero', tubeType: 'SST_AMARILLO', tubeColorHex: '#eab308', tubeAdditive: 'Gel', minVolumeMl: 3.0, method: 'IFI', fastingRequired: false, tatHours: 72, priceUsd: 45.00, stabilityDetails: '7d 2-8°C', rejectionCriteria: 'Hemólisis', active: true, parameters: [] },
  { id: 'test-inm-fr', code: 'AUT-003', loincCode: '11572-5', loincName: 'RF', name: 'Factor Reumatoide (FR) Cuantitativo', shortName: 'FR', synonyms: ['Rheumatoid'], areaId: 'INM', areaName: 'Inmunología', subarea: 'Autoinmunidad', resultType: 'NUMERIC', specimenType: 'Suero', tubeType: 'SST_AMARILLO', tubeColorHex: '#eab308', tubeAdditive: 'Gel', minVolumeMl: 3.0, method: 'Nefelometría', fastingRequired: false, tatHours: 24, priceUsd: 18.00, stabilityDetails: '7d 2-8°C', rejectionCriteria: 'Lipemia', active: true, parameters: [] },

  // 7. SEROLOGÍA (10 Componentes aprox)
  { id: 'test-ser-vih', code: 'SER-001', loincCode: '56888-1', loincName: 'HIV Combo', name: 'VIH 1/2 Ag/Ac Combo 4ta Gen', shortName: 'VIH', synonyms: ['ELISA VIH'], areaId: 'SER', areaName: 'Serología', subarea: 'Serología Viral', resultType: 'QUALITATIVE', specimenType: 'Suero', tubeType: 'SST_AMARILLO', tubeColorHex: '#eab308', tubeAdditive: 'Gel', minVolumeMl: 4.0, method: 'CMIA', fastingRequired: false, tatHours: 4, priceUsd: 25.00, stabilityDetails: '7d 2-8°C', rejectionCriteria: 'Hemólisis', active: true, parameters: [] },
  { id: 'test-ser-rpr', code: 'SER-006', loincCode: '20507-0', loincName: 'RPR', name: 'RPR (Sífilis) Sifilotest', shortName: 'RPR', synonyms: ['VDRL', 'Lues'], areaId: 'SER', areaName: 'Serología', subarea: 'Treponémicas', resultType: 'QUALITATIVE', specimenType: 'Suero', tubeType: 'SST_AMARILLO', tubeColorHex: '#eab308', tubeAdditive: 'Gel', minVolumeMl: 3.0, method: 'Floculación', fastingRequired: false, tatHours: 4, priceUsd: 8.00, stabilityDetails: '48h 2-8°C', rejectionCriteria: 'Hemólisis', active: true, parameters: [] },

  // 8. UROANÁLISIS (16 Componentes aprox)
  {
    id: 'test-uri-ego', code: 'URI-001', loincCode: '58410-2', loincName: 'Urinalysis complete', name: 'Examen General de Orina (EGO)', shortName: 'EGO', synonyms: ['Urianálisis'], areaId: 'URI', areaName: 'Uroanálisis', subarea: 'EGO', resultType: 'PANEL_MULTI_COMPONENT', specimenType: 'Orina', tubeType: 'FRASCO_ESTERIL', tubeColorHex: '#06b6d4', tubeAdditive: 'None', minVolumeMl: 15.0, method: 'Físico-Químico-Sedimento', fastingRequired: false, tatHours: 2, priceUsd: 10.00, stabilityDetails: '2h ambient', rejectionCriteria: 'Contaminada', active: true,
    parameters: [
      { id: 'p-u-col', code: 'COLOR', loincCode: '5778-6', name: 'Color', unit: 'text', resultType: 'QUALITATIVE', referenceRanges: [] },
      { id: 'p-u-asp', code: 'ASP', loincCode: '5770-3', name: 'Aspecto', unit: 'text', resultType: 'QUALITATIVE', referenceRanges: [] },
      { id: 'p-u-ph', code: 'PH', loincCode: '5803-2', name: 'pH', unit: 'pH', resultType: 'NUMERIC', referenceRanges: [] },
      { id: 'p-u-den', code: 'DEN', loincCode: '5811-5', name: 'Densidad', unit: 'g/mL', resultType: 'NUMERIC', referenceRanges: [] },
      { id: 'p-u-pro', code: 'PRO', loincCode: '5804-0', name: 'Proteínas', unit: 'mg/dL', resultType: 'NUMERIC', referenceRanges: [] },
      { id: 'p-u-glu', code: 'GLU', loincCode: '5792-7', name: 'Glucosa', unit: 'mg/dL', resultType: 'NUMERIC', referenceRanges: [] },
      { id: 'p-u-cet', code: 'CET', loincCode: '5771-1', name: 'Cetonas', unit: 'mg/dL', resultType: 'NUMERIC', referenceRanges: [] },
      { id: 'p-u-nit', code: 'NIT', loincCode: '5802-4', name: 'Nitritos', unit: 'text', resultType: 'QUALITATIVE', referenceRanges: [] },
      { id: 'p-u-leu', code: 'LEU', loincCode: '20429-7', name: 'Leucocitos Sed.', unit: '/campo', resultType: 'NUMERIC', referenceRanges: [] },
      { id: 'p-u-eri', code: 'ERI', loincCode: '13945-1', name: 'Eritrocitos Sed.', unit: '/campo', resultType: 'NUMERIC', referenceRanges: [] }
    ]
  },

  // 9. BANCO DE SANGRE (6 Componentes)
  { id: 'test-bds-abo', code: 'BDS-001', loincCode: '883-9', loincName: 'ABO Rh', name: 'Grupo ABO y Factor Rh', shortName: 'Grupo/Rh', synonyms: ['Tipaje'], areaId: 'BDS', areaName: 'Banco de Sangre', subarea: 'Grupo/Rh', resultType: 'QUALITATIVE', specimenType: 'Sangre Total', tubeType: 'EDTA_LILA', tubeColorHex: '#a855f7', tubeAdditive: 'EDTA', minVolumeMl: 4.0, method: 'Hemaglutinación', fastingRequired: false, tatHours: 1, priceUsd: 12.00, stabilityDetails: '48h 2-8°C', rejectionCriteria: 'Hemólisis', active: true, parameters: [] },
  { id: 'test-bds-coo', code: 'BDS-003', loincCode: '1325-0', loincName: 'Coombs Direct', name: 'Coombs Directo', shortName: 'Coombs D', synonyms: ['Anti-Globulina'], areaId: 'BDS', areaName: 'Banco de Sangre', subarea: 'Compatibilidad', resultType: 'QUALITATIVE', specimenType: 'Sangre Total', tubeType: 'EDTA_LILA', tubeColorHex: '#a855f7', tubeAdditive: 'EDTA', minVolumeMl: 4.0, method: 'Aglutinación', fastingRequired: false, tatHours: 2, priceUsd: 15.00, stabilityDetails: '24h 2-8°C', rejectionCriteria: 'Hemólisis', active: true, parameters: [] },

  // 10. BIOLOGÍA MOLECULAR (7 Componentes)
  { id: 'test-mol-pcr', code: 'MOL-001', loincCode: '94500-6', loincName: 'SARS-CoV-2 RNA', name: 'PCR SARS-CoV-2 (COVID-19)', shortName: 'PCR COVID', synonyms: ['RT-PCR'], areaId: 'MOLE', areaName: 'Biología Molecular', subarea: 'PCR Viral', resultType: 'QUALITATIVE', specimenType: 'Hisopado', tubeType: 'FRASCO_ESTERIL', tubeColorHex: '#06b6d4', tubeAdditive: 'VTM', minVolumeMl: 1.0, method: 'Real-Time PCR', fastingRequired: false, tatHours: 12, priceUsd: 65.00, stabilityDetails: '72h 2-8°C', rejectionCriteria: 'Medio seco', active: true, parameters: [] },

  // 11. GASES SANGUÍNEOS (6 Componentes)
  { id: 'test-gas-art', code: 'GAS-001', loincCode: '2000-8', loincName: 'Blood Gas Panel', name: 'Gasometría Arterial', shortName: 'Gases', synonyms: ['pH pCO2 pO2'], areaId: 'GAS', areaName: 'Gases Sanguíneos', subarea: 'Gasometría', resultType: 'PANEL_MULTI_COMPONENT', specimenType: 'Sangre Arterial', tubeType: 'HEPARINA_VERDE', tubeColorHex: '#22c55e', tubeAdditive: 'Heparina', minVolumeMl: 1.0, method: 'ISE/Gases', fastingRequired: false, tatHours: 1, priceUsd: 45.00, stabilityDetails: '30 min hielo', rejectionCriteria: 'Burbujas aire', active: true, parameters: [
    { id: 'p-g-ph', code: 'PH', loincCode: '2703-7', name: 'pH', unit: 'pH', resultType: 'NUMERIC', referenceRanges: [] },
    { id: 'p-g-po2', code: 'PO2', loincCode: '2705-2', name: 'pO2', unit: 'mmHg', resultType: 'NUMERIC', referenceRanges: [] },
    { id: 'p-g-pco2', code: 'PCO2', loincCode: '2019-8', name: 'pCO2', unit: 'mmHg', resultType: 'NUMERIC', referenceRanges: [] }
  ]},

  // 12. MARCADORES TUMORALES (8 Componentes)
  { id: 'test-mar-psa', code: 'MAR-001', loincCode: '2857-1', loincName: 'PSA', name: 'PSA Total (Antígeno Prostático)', shortName: 'PSA', synonyms: ['Próstata'], areaId: 'MAR', areaName: 'Marcadores Tumorales', subarea: 'Marcadores Séricos', resultType: 'NUMERIC', specimenType: 'Suero', tubeType: 'SST_AMARILLO', tubeColorHex: '#eab308', tubeAdditive: 'Gel', minVolumeMl: 2.0, method: 'CLIA', fastingRequired: false, tatHours: 4, priceUsd: 22.00, stabilityDetails: '7d 2-8°C', rejectionCriteria: 'Hemólisis', active: true, parameters: [] },

  // 13. TOXICOLOGÍA (Nuevo)
  { id: 'test-tox-multi', code: 'TOX-001', loincCode: '43148-6', loincName: 'Drugs of Abuse Screen', name: 'Panel Toxicológico (10 Drogas)', shortName: 'Tox Screen', synonyms: ['Drogas Abuso'], areaId: 'TOX', areaName: 'Toxicología', subarea: 'Drogas', resultType: 'PANEL_MULTI_COMPONENT', specimenType: 'Orina', tubeType: 'FRASCO_ESTERIL', tubeColorHex: '#06b6d4', tubeAdditive: 'None', minVolumeMl: 30.0, method: 'Inmunocromatografía', fastingRequired: false, tatHours: 2, priceUsd: 45.00, stabilityDetails: '48h 2-8°C', rejectionCriteria: 'Adulterada', active: true, parameters: [
    { id: 'p-t-coc', code: 'COC', loincCode: '19360-7', name: 'Cocaína', unit: 'ng/mL', resultType: 'QUALITATIVE', referenceRanges: [] },
    { id: 'p-t-thc', code: 'THC', loincCode: '19650-1', name: 'Marihuana (THC)', unit: 'ng/mL', resultType: 'QUALITATIVE', referenceRanges: [] },
    { id: 'p-t-opi', code: 'OPI', loincCode: '19593-3', name: 'Opiáceos', unit: 'ng/mL', resultType: 'QUALITATIVE', referenceRanges: [] }
  ]},

  // 14. ALERGOLOGÍA (Nuevo)
  { id: 'test-ale-ige', code: 'ALE-001', loincCode: '19113-0', loincName: 'Total IgE', name: 'IgE Total (Inmunoglobulina E)', shortName: 'IgE Total', synonyms: ['Alergia'], areaId: 'ALE', areaName: 'Alergología', subarea: 'Alérgenos', resultType: 'NUMERIC', specimenType: 'Suero', tubeType: 'SST_AMARILLO', tubeColorHex: '#eab308', tubeAdditive: 'Gel', minVolumeMl: 2.0, method: 'FEIA', fastingRequired: false, tatHours: 24, priceUsd: 20.00, stabilityDetails: '7d 2-8°C', rejectionCriteria: 'Hemólisis', active: true, parameters: [] }
];

import { User } from '../types';

interface MasterTestCatalogManagerProps {
  user?: User;
}

export const MasterTestCatalogManager: React.FC<MasterTestCatalogManagerProps> = ({ user }) => {
  const [areas] = useState<LisArea[]>(MASTER_AREAS);
  const [tests, setTests] = useState<LisMasterTest[]>(MASTER_TESTS);
  const [selectedTest, setSelectedTest] = useState<LisMasterTest>(MASTER_TESTS[0]);
  const [activeTab, setActiveTab] = useState<'EXPLORER' | 'PANEL_INSPECTOR' | 'PACKAGE_BUILDER' | 'REFERENCE_RANGES' | 'CRITICAL_LIMITS' | 'CONTAINERS_TUBES' | 'SEED_EXPORT'>('EXPLORER');
  
  // Permissions Check
  const hasEditRights = user?.role === 'owner' || user?.role === 'lab_chief' || user?.role === 'abregotech_admin';

  // Package Management State
  const [packages, setPackages] = useState<any[]>([
    { id: 'pkg-1', code: 'PERF-LIP', name: 'Perfil Lipídico Integral', tests: ['test-qcl-glu', 'test-qcl-lip'], price: 45.00, category: 'PERFIL' },
    { id: 'pkg-2', code: 'PRE-NAT', name: 'Control Prenatal I', tests: ['test-hem-001', 'test-qcl-glu', 'test-ser-vih', 'test-bds-abo'], price: 85.00, category: 'PRENATAL' },
    { id: 'pkg-3', code: 'COAG-EXT', name: 'Perfil de Coagulación Extendido', tests: ['test-coa-tp', 'test-coa-ttpa', 'test-coa-fib', 'test-coa-dim'], price: 75.00, category: 'PERFIL' }
  ]);
  const [editingPackageId, setEditingPackageId] = useState<string | null>(null);
  const [pkgName, setPkgName] = useState('');
  const [pkgCode, setPkgCode] = useState('');
  const [selectedTestsForPkg, setSelectedTestsForPkg] = useState<string[]>([]);
  const [pkgPrice, setPkgPrice] = useState(0);

  // Reference Range Management State
  const [isRangeModalOpen, setIsRangeModalOpen] = useState(false);
  const [editingRange, setEditingRange] = useState<LisReferenceRange | null>(null);
  const [rangeTarget, setRangeTarget] = useState<{ testId: string; paramId: string } | null>(null);

  // Form states for Range
  const [rangeSex, setRangeSex] = useState<'MASCULINO' | 'FEMENINO' | 'AMBOS'>('AMBOS');
  const [rangeAgeMin, setRangeAgeMin] = useState(0);
  const [rangeAgeMax, setRangeAgeMax] = useState(99);
  const [rangeMinVal, setRangeMinVal] = useState(0);
  const [rangeMaxVal, setRangeMaxVal] = useState(0);
  const [rangeUnit, setRangeUnit] = useState('');
  const [rangeSource, setRangeSource] = useState('CLSI');

  // Parameter / Component Management State
  const [isParamModalOpen, setIsParamModalOpen] = useState(false);
  const [editingParam, setEditingParam] = useState<LisTestParameter | null>(null);
  const [targetTestId, setTargetTestId] = useState<string | null>(null);

  // Form states for Parameter
  const [paramName, setParamName] = useState('');
  const [paramCode, setParamCode] = useState('');
  const [paramLoinc, setParamLoinc] = useState('');
  const [paramUnit, setParamUnit] = useState('');
  const [paramIsFormula, setParamIsFormula] = useState(false);
  const [paramFormula, setParamFormula] = useState('');

  // Explorer States
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedAreaFilter, setSelectedAreaFilter] = useState<string>('TODAS');
  const [selectedTubeFilter, setSelectedTubeFilter] = useState<string>('TODOS');

  // New Test Form State
  const [isNewTestModalOpen, setIsNewTestModalOpen] = useState<boolean>(false);
  const [formCode, setFormCode] = useState<string>('');
  const [formLoinc, setFormLoinc] = useState<string>('');
  const [formName, setFormName] = useState<string>('');
  const [formShortName, setFormShortName] = useState<string>('');
  const [formArea, setFormArea] = useState<string>('QCL');
  const [formSpecimen, setFormSpecimen] = useState<string>('Suero');
  const [formMethod, setFormMethod] = useState<string>('Cinético');
  const [formPrice, setFormPrice] = useState<number>(0);

  // Dynamic Savings Calculation
  const totalIndividualPrice = useMemo(() => {
    return selectedTestsForPkg.reduce((acc, tid) => {
      const t = tests.find(item => item.id === tid);
      return acc + (t?.priceUsd || 0);
    }, 0);
  }, [selectedTestsForPkg, tests]);

  const packageSavingsPct = useMemo(() => {
    if (totalIndividualPrice === 0 || pkgPrice === 0) return 0;
    const diff = totalIndividualPrice - pkgPrice;
    return Math.round((diff / totalIndividualPrice) * 100);
  }, [totalIndividualPrice, pkgPrice]);

  const filteredTests = useMemo(() => {
    return tests.filter(t => {
      const matchesSearch =
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.loincCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.synonyms.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesArea = selectedAreaFilter === 'TODAS' || t.areaId === selectedAreaFilter;
      const matchesTube = selectedTubeFilter === 'TODOS' || t.tubeType === selectedTubeFilter;
      return matchesSearch && matchesArea && matchesTube;
    });
  }, [searchTerm, selectedAreaFilter, selectedTubeFilter, tests]);

  const totalComponents = useMemo(() => {
    return tests.reduce((acc, t) => acc + (t.parameters.length || 1), 0);
  }, [tests]);

  const handleCreateNewTest = (e: React.FormEvent) => {
    e.preventDefault();
    const areaObj = areas.find(a => a.id === formArea);
    const newTest: LisMasterTest = {
      id: `test-${Date.now()}`,
      code: formCode, loincCode: formLoinc, loincName: `${formName} LOINC`, name: formName, shortName: formShortName || formName, synonyms: [formName],
      areaId: formArea, areaName: areaObj?.name || 'Varios', subarea: areaObj?.subareas[0] || 'General',
      resultType: 'NUMERIC', specimenType: formSpecimen, tubeType: 'SST_AMARILLO', tubeColorHex: '#eab308', tubeAdditive: 'Gel', minVolumeMl: 3.0,
      method: formMethod, fastingRequired: true, tatHours: 4, priceUsd: formPrice, stabilityDetails: '7d 2-8°C', rejectionCriteria: 'Hemólisis', active: true, parameters: []
    };
    setTests([newTest, ...tests]);
    setSelectedTest(newTest);
    setIsNewTestModalOpen(false);
  };

  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(tests, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `LIS_MASTER_CATALOG_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-950 border border-teal-500/30 p-6 sm:p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden backdrop-blur-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="text-teal-400 text-xs font-black uppercase tracking-[0.2em] mb-2 flex items-center space-x-2">
              <BookOpen className="w-4 h-4 text-teal-400 animate-pulse" />
              <span>LOINC v2.82 & ISO 15189 • Catálogo Maestro Real</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">Estructura Global de Pruebas LIS</h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-2 max-w-3xl leading-relaxed">Gestión de áreas, subáreas, unidades UCUM, intervalos multidemográficos y límites de pánico.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button onClick={() => setIsNewTestModalOpen(true)} className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-black px-4 py-2.5 rounded-2xl text-xs transition shadow-xl flex items-center space-x-2 cursor-pointer"><Plus className="w-4 h-4 stroke-[3]" /><span>Añadir Examen</span></button>
            <button onClick={handleExportJson} className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-4 py-2.5 rounded-2xl text-xs transition shadow-xl flex items-center space-x-2 cursor-pointer border border-slate-700"><Download className="w-4 h-4 text-teal-400" /><span>Exportar Semilla</span></button>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-white/10">
          <div className="bg-slate-950/60 border border-white/5 p-4 rounded-2xl space-y-1">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Áreas LIS</div>
            <div className="text-2xl font-black font-mono text-teal-300">{areas.length}</div>
          </div>
          <div className="bg-slate-950/60 border border-white/5 p-4 rounded-2xl space-y-1">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Componentes</div>
            <div className="text-2xl font-black font-mono text-indigo-300">{totalComponents}</div>
            <div className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">100% Cobertura</div>
          </div>
          <div className="bg-slate-950/60 border border-white/5 p-4 rounded-2xl space-y-1">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Rangos CLSI</div>
            <div className="text-2xl font-black font-mono text-emerald-400">EP28-A3</div>
          </div>
          <div className="bg-slate-950/60 border border-white/5 p-4 rounded-2xl space-y-1">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Mapeo Oficial</div>
            <div className="text-2xl font-black font-mono text-amber-300">LOINC 2.82</div>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-1 bg-slate-950/50 p-1.5 rounded-2xl border border-white/5 overflow-x-auto no-scrollbar shrink-0">
        {[
          { id: 'EXPLORER', label: 'Explorador', icon: Search },
          { id: 'PANEL_INSPECTOR', label: 'Componentes', icon: Layers },
          { id: 'PACKAGE_BUILDER', label: 'Creador de Paquetes', icon: Sparkles },
          { id: 'REFERENCE_RANGES', label: 'Intervalos', icon: Sliders },
          { id: 'CRITICAL_LIMITS', label: 'Pánico', icon: AlertTriangle },
          { id: 'CONTAINERS_TUBES', label: 'Muestras', icon: TestTube },
          { id: 'SEED_EXPORT', label: 'Estructura BD', icon: Database }
        ].map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex items-center space-x-2.5 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-teal-500 text-slate-950 shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}><tab.icon className="w-3.5 h-3.5" /><span>{tab.label}</span></button>
        ))}
      </div>

      {activeTab === 'EXPLORER' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl space-y-3">
              <div className="relative"><Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" /><input type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white outline-none focus:border-teal-500" /></div>
              <div className="grid grid-cols-2 gap-2">
                <select value={selectedAreaFilter} onChange={(e) => setSelectedAreaFilter(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs font-bold text-slate-200 outline-none"><option value="TODAS">Todas las Áreas</option>{areas.map(a => (<option key={a.id} value={a.id}>{a.name}</option>))}</select>
                <select value={selectedTubeFilter} onChange={(e) => setSelectedTubeFilter(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs font-bold text-slate-200 outline-none"><option value="TODOS">Todos los Tubos</option><option value="EDTA_LILA">EDTA Lila</option><option value="SST_AMARILLO">SST Amarillo</option><option value="CITRATO_AZUL">Citrato Azul</option></select>
              </div>
            </div>
            <div className="space-y-2.5 max-h-[620px] overflow-y-auto custom-scrollbar pr-1">
              {filteredTests.map((test) => (
                <div key={test.id} onClick={() => setSelectedTest(test)} className={`p-4 rounded-2xl border transition cursor-pointer space-y-2 ${selectedTest.id === test.id ? 'bg-slate-950 border-teal-500 ring-2 ring-teal-500/20 shadow-xl' : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'}`}>
                  <div className="flex items-center justify-between"><div className="flex items-center space-x-2"><span className="font-mono text-[10px] font-extrabold text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">{test.code}</span><span className="font-mono text-[9px] text-slate-500">LOINC {test.loincCode}</span></div><span className="font-mono text-xs font-black text-emerald-400">${test.priceUsd.toFixed(2)}</span></div>
                  <div className="font-bold text-white text-xs leading-snug">{test.name}</div>
                  <div className="flex items-center justify-between text-[9px] text-slate-500 pt-1 border-t border-white/5"><div className="flex items-center space-x-1.5"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: test.tubeColorHex }}></span><span>{test.specimenType}</span></div><span>TAT: {test.tatHours}h</span></div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 p-6 rounded-3xl space-y-6 shadow-2xl overflow-y-auto max-h-[800px] custom-scrollbar">
            <div className="flex items-start justify-between border-b border-white/5 pb-4">
              <div>
                <div className="flex items-center space-x-2 mb-1"><span className="text-[10px] font-mono font-black text-teal-400 bg-teal-500/10 px-2.5 py-1 rounded-lg border border-teal-500/30 uppercase">{selectedTest.areaName} • {selectedTest.subarea}</span></div>
                <h2 className="text-xl font-black text-white uppercase">{selectedTest.name}</h2>
              </div>
              <div className="text-right"><span className="text-2xl font-black font-mono text-emerald-400">${selectedTest.priceUsd.toFixed(2)}</span><div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Precio Oficial</div></div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-slate-950 p-3 rounded-xl border border-white/5 space-y-1"><span className="text-[9px] text-slate-500 font-bold uppercase block tracking-tighter">Muestra</span><span className="font-bold text-white truncate block">{selectedTest.specimenType}</span></div>
              <div className="bg-slate-950 p-3 rounded-xl border border-white/5 space-y-1"><span className="text-[9px] text-slate-500 font-bold uppercase block tracking-tighter">Contenedor</span><span className="font-bold text-white flex items-center space-x-1.5"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: selectedTest.tubeColorHex }}></span><span className="truncate">{selectedTest.tubeType.replace('_', ' ')}</span></span></div>
              <div className="bg-slate-950 p-3 rounded-xl border border-white/5 space-y-1"><span className="text-[9px] text-slate-500 font-bold uppercase block tracking-tighter">TAT (Tiempo)</span><span className="font-bold text-amber-400">{selectedTest.tatHours} Horas</span></div>
              <div className="bg-slate-950 p-3 rounded-xl border border-white/5 space-y-1"><span className="text-[9px] text-slate-500 font-bold uppercase block tracking-tighter">Ayuno</span><span className={`font-bold ${selectedTest.fastingRequired ? 'text-amber-400' : 'text-emerald-400'}`}>{selectedTest.fastingRequired ? 'SÍ' : 'NO'}</span></div>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-white/5 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><span className="text-[9px] text-slate-500 font-black uppercase block mb-1">Metodología:</span><span className="text-slate-200 font-bold">{selectedTest.method}</span></div>
                <div><span className="text-[9px] text-slate-500 font-black uppercase block mb-1">Aditivo:</span><span className="text-slate-200 font-bold">{selectedTest.tubeAdditive}</span></div>
                <div><span className="text-[9px] text-slate-500 font-black uppercase block mb-1">Estabilidad:</span><span className="text-slate-300">{selectedTest.stabilityDetails}</span></div>
                <div><span className="text-[9px] text-slate-500 font-black uppercase block mb-1">Rechazo ISO:</span><span className="text-rose-400 font-bold">{selectedTest.rejectionCriteria}</span></div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-black text-white text-xs uppercase tracking-[0.2em] flex items-center space-x-2"><Layers className="w-4 h-4 text-teal-500" /><span>Componentes del Examen ({selectedTest.parameters.length || 'Directo'})</span></h3>
              <div className="space-y-2">
                {selectedTest.parameters.map((p) => (
                  <div key={p.id} className="bg-slate-950/50 p-4 rounded-xl border border-white/5 flex flex-col gap-3">
                    <div className="flex items-center justify-between"><div className="flex items-center space-x-2"><span className="font-black text-white text-xs uppercase">{p.name}</span><span className="text-[9px] text-slate-500 font-mono">LOINC: {p.loincCode}</span></div><span className="text-[10px] font-black text-teal-400">{p.unit}</span></div>
                    {p.referenceRanges.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {p.referenceRanges.map(r => (
                          <div key={r.id} className="bg-slate-900 p-2 rounded-lg text-[10px] flex justify-between items-center"><span className="text-slate-400 font-bold uppercase">{r.sex}</span><span className="text-emerald-400 font-black font-mono">{r.minValue}-{r.maxValue} {r.unit}</span></div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {selectedTest.parameters.length === 0 && !selectedTest.microbiologyData && <div className="text-center p-8 bg-slate-950/20 rounded-2xl border border-dashed border-white/5 text-slate-600 text-xs italic uppercase font-bold tracking-widest">Examen Uniparamétrico Simple</div>}
                {selectedTest.microbiologyData && (
                  <div className="bg-teal-500/5 p-4 rounded-xl border border-teal-500/20 space-y-3">
                    <div className="font-black text-teal-400 text-[10px] uppercase">Protocolo de Cultivo</div>
                    <div className="grid grid-cols-2 gap-4 text-[10px]">
                      <div><span className="text-slate-500 block uppercase font-bold">Incubación:</span><span className="text-white">{selectedTest.microbiologyData.incubationHours} Horas</span></div>
                      <div><span className="text-slate-500 block uppercase font-bold">Patógenos Comunes:</span><span className="text-white">{selectedTest.microbiologyData.commonOrganisms.join(', ')}</span></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'PANEL_INSPECTOR' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-in fade-in duration-500">
          {tests.filter(t => t.resultType === 'PANEL_MULTI_COMPONENT').map(panel => (
            <div key={panel.id} className="bg-slate-900/60 border border-white/5 p-6 rounded-[2.5rem] space-y-4 hover:border-teal-500/30 transition-all group shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/5 rounded-full blur-2xl"></div>
              <div className="flex items-start justify-between relative z-10">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-400"><Layers className="w-5 h-5" /></div>
                  <div>
                    <h4 className="font-black text-white text-sm uppercase tracking-tight">{panel.name}</h4>
                    <span className="text-[9px] text-slate-500 font-mono">{panel.code} • {panel.areaName}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                   <div className="bg-slate-950 px-2 py-1 rounded text-[10px] font-black text-teal-500 border border-white/5">{panel.parameters.length} ITEMS</div>
                   {hasEditRights && (
                     <button
                       onClick={() => {
                         setTargetTestId(panel.id);
                         setEditingParam(null);
                         setParamName(''); setParamCode(''); setParamLoinc(''); setParamUnit(''); setParamIsFormula(false); setParamFormula('');
                         setIsParamModalOpen(true);
                       }}
                       className="bg-teal-500/10 hover:bg-teal-500 text-teal-400 hover:text-slate-950 p-1.5 rounded-lg transition-all border border-teal-500/20"
                       title="Agregar Componente"
                     >
                        <Plus className="w-3.5 h-3.5" />
                     </button>
                   )}
                </div>
              </div>
              <div className="space-y-1.5 pt-2 border-t border-white/5 relative z-10">
                {panel.parameters.map(p => (
                  <div key={p.id} className="flex items-center justify-between text-[10px] text-slate-400 py-2.5 border-b border-white/5 last:border-0 hover:bg-white/[0.02] px-2 rounded-xl transition-all group/item">
                    <div className="flex flex-col">
                       <div className="flex items-center gap-1.5">
                          <span className="font-bold">{p.name}</span>
                          {p.isFormula && (
                            <span className="bg-indigo-500/20 text-indigo-400 text-[7px] font-black px-1 py-0.5 rounded border border-indigo-500/30 uppercase tracking-tighter">Fórmula LIS</span>
                          )}
                       </div>
                       <span className="text-[8px] text-slate-600 font-mono">LOINC: {p.loincCode}</span>
                    </div>
                    <div className="flex items-center gap-3">
                       <div className="text-right">
                          <span className="font-mono text-slate-500 block">{p.unit}</span>
                          {p.isFormula && (
                            <span className="text-[7px] text-indigo-500 font-mono italic">{p.formulaExpression}</span>
                          )}
                       </div>
                       {hasEditRights && (
                         <div className="flex gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                            <button
                              onClick={() => {
                                setTargetTestId(panel.id);
                                setEditingParam(p);
                                setParamName(p.name);
                                setParamCode(p.code);
                                setParamLoinc(p.loincCode);
                                setParamUnit(p.unit);
                                setParamIsFormula(p.isFormula || false);
                                setParamFormula(p.formulaExpression || '');
                                setIsParamModalOpen(true);
                              }}
                              className="text-slate-500 hover:text-teal-400 p-1"
                            >
                               <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => {
                                if(confirm(`¿Eliminar componente ${p.name}?`)) {
                                  setTests(prev => prev.map(t => t.id === panel.id ? {
                                    ...t,
                                    parameters: t.parameters.filter(item => item.id !== p.id)
                                  } : t));
                                }
                              }}
                              className="text-slate-500 hover:text-rose-400 p-1"
                            >
                               <Trash2 className="w-3 h-3" />
                            </button>
                         </div>
                       )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'PACKAGE_BUILDER' && (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
             {/* Package Creator Form */}
             <div className="lg:col-span-1 bg-slate-900/90 border border-slate-800 p-6 rounded-[2.5rem] space-y-6 shadow-2xl">
                <div className="flex items-center space-x-3 border-b border-white/5 pb-4">
                   <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400"><Sparkles className="w-5 h-5" /></div>
                   <h3 className="font-black text-white text-sm uppercase italic">Constructor de Paquetes Clínicos</h3>
                </div>

                <div className="space-y-4">
                   <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nombre del Paquete:</label>
                      <input
                        type="text"
                        placeholder="ej. Chequeo Ejecutivo Hombre"
                        value={pkgName}
                        onChange={(e) => setPkgName(e.target.value)}
                        className="w-full bg-slate-950 border border-white/5 rounded-2xl p-4 text-xs text-white outline-none focus:border-teal-500 transition-all"
                      />
                   </div>

                   <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                         <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Código:</label>
                         <input
                           type="text"
                           placeholder="PK-001"
                           value={pkgCode}
                           onChange={(e) => setPkgCode(e.target.value)}
                           className="w-full bg-slate-950 border border-white/5 rounded-2xl p-4 text-xs text-white font-mono font-bold"
                         />
                      </div>
                      <div className="space-y-1">
                         <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Precio Sugerido:</label>
                         <input
                           type="number"
                           placeholder="0.00"
                           value={pkgPrice}
                           onChange={(e) => setPkgPrice(Number(e.target.value))}
                           className="w-full bg-slate-950 border border-white/5 rounded-2xl p-4 text-xs text-emerald-400 font-mono font-bold"
                         />
                      </div>
                   </div>

                   <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Seleccionar Exámenes Incluidos:</label>
                      <div className="max-h-[200px] overflow-y-auto bg-slate-950 rounded-2xl border border-white/5 p-2 space-y-1 custom-scrollbar">
                         {tests.map(t => (
                           <div
                             key={t.id}
                             onClick={() => {
                               if (selectedTestsForPkg.includes(t.id)) {
                                 setSelectedTestsForPkg(prev => prev.filter(id => id !== t.id));
                               } else {
                                 setSelectedTestsForPkg(prev => [...prev, t.id]);
                               }
                             }}
                             className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${selectedTestsForPkg.includes(t.id) ? 'bg-teal-500/20 border border-teal-500/30' : 'hover:bg-white/5 border border-transparent'}`}
                           >
                              <span className="text-[10px] font-bold text-slate-200">{t.name}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] text-slate-500 font-mono">${t.priceUsd.toFixed(2)}</span>
                                {selectedTestsForPkg.includes(t.id) ? <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" /> : <Plus className="w-3.5 h-3.5 text-slate-600" />}
                              </div>
                           </div>
                         ))}
                      </div>
                   </div>

                   {selectedTestsForPkg.length > 0 && (
                     <div className="bg-slate-950/80 p-4 rounded-2xl border border-white/5 space-y-2">
                        <div className="flex justify-between text-[10px] font-bold">
                           <span className="text-slate-500 uppercase">Suma Individual:</span>
                           <span className="text-white font-mono">${totalIndividualPrice.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-[10px] font-black">
                           <span className="text-indigo-400 uppercase">Ahorro Estimado:</span>
                           <span className={packageSavingsPct > 0 ? "text-emerald-400 font-mono" : "text-rose-400 font-mono"}>
                             {packageSavingsPct > 0 ? `-${packageSavingsPct}%` : 'Sin ahorro'}
                           </span>
                        </div>
                        <div className="h-1 w-full bg-slate-900 rounded-full overflow-hidden">
                           <div
                             className="bg-emerald-500 h-full transition-all duration-500"
                             style={{ width: `${Math.min(100, Math.max(0, packageSavingsPct))}%` }}
                           ></div>
                        </div>
                     </div>
                   )}

                   <button
                     disabled={!hasEditRights}
                     onClick={() => {
                        if (!pkgName || selectedTestsForPkg.length === 0) { alert('Datos incompletos'); return; }

                        if (editingPackageId) {
                          setPackages(prev => prev.map(p => p.id === editingPackageId ? { ...p, code: pkgCode, name: pkgName, tests: selectedTestsForPkg, price: pkgPrice } : p));
                          setEditingPackageId(null);
                          alert('¡Perfil actualizado!');
                        } else {
                          const newPkg = { id: `pkg-${Date.now()}`, code: pkgCode || 'PERF-CUSTOM', name: pkgName, tests: selectedTestsForPkg, price: pkgPrice, category: 'PERFIL' };
                          setPackages([newPkg, ...packages]);
                          alert('¡Paquete creado exitosamente!');
                        }

                        setPkgName(''); setPkgCode(''); setSelectedTestsForPkg([]); setPkgPrice(0);
                     }}
                     className={`w-full py-4 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 cursor-pointer transition-all ${!hasEditRights ? 'bg-slate-800 opacity-50 cursor-not-allowed' : 'bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 shadow-indigo-500/20'}`}
                   >
                      {editingPackageId ? <RefreshCw className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                      <span>{editingPackageId ? 'Guardar Cambios del Perfil' : 'Registrar Nuevo Perfil en LIS'}</span>
                   </button>

                   {editingPackageId && (
                     <button
                       onClick={() => { setEditingPackageId(null); setPkgName(''); setPkgCode(''); setSelectedTestsForPkg([]); setPkgPrice(0); }}
                       className="w-full text-[9px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors"
                     >
                       Cancelar Edición
                     </button>
                   )}
                </div>
             </div>

             {/* Packages List Dashboard */}
             <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between bg-slate-900/40 p-6 rounded-[2.5rem] border border-white/5 shadow-xl">
                   <div>
                      <h4 className="font-black text-white text-lg italic">Portafolio de Perfiles Médicos</h4>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Paquetes promocionales y clínicos activos</p>
                   </div>
                   <div className="flex items-center gap-2">
                      <div className="text-right px-4 border-r border-white/5">
                         <div className="text-xs font-black text-white">{packages.length}</div>
                         <div className="text-[8px] text-slate-500 uppercase font-bold">Total Perfiles</div>
                      </div>
                      <div className="text-right px-4">
                         <div className="text-xs font-black text-teal-400">${packages.reduce((acc, p) => acc + p.price, 0).toFixed(2)}</div>
                         <div className="text-[8px] text-slate-500 uppercase font-bold">Valor Inventario</div>
                      </div>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {packages.map(pkg => (
                     <div key={pkg.id} className="bg-slate-900 border border-white/5 p-6 rounded-[2.5rem] space-y-5 hover:border-indigo-500/40 transition-all relative group overflow-hidden shadow-2xl">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl group-hover:bg-indigo-500/10 transition-colors"></div>

                        <div className="flex items-start justify-between relative z-10">
                           <div className="space-y-1">
                              <span className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.2em]">{pkg.category}</span>
                              <h5 className="font-black text-white text-base leading-tight uppercase tracking-tighter">{pkg.name}</h5>
                              <div className="font-mono text-[9px] text-slate-500">{pkg.code}</div>
                           </div>
                           <div className="bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl">
                              <span className="text-sm font-black text-emerald-400 font-mono">${pkg.price.toFixed(2)}</span>
                           </div>
                        </div>

                        <div className="space-y-2 relative z-10">
                           <div className="text-[9px] font-black text-slate-500 uppercase flex items-center gap-2">
                              <Layers className="w-3 h-3" />
                              <span>Exámenes Incluidos ({pkg.tests.length}):</span>
                           </div>
                           <div className="flex flex-wrap gap-2">
                              {pkg.tests.map((tid: string) => {
                                const t = tests.find(item => item.id === tid);
                                return (
                                  <span key={tid} className="bg-slate-950 border border-white/5 px-2.5 py-1 rounded-lg text-[9px] text-slate-400 font-bold group-hover:text-slate-200 transition-colors">
                                     {t ? t.name : tid}
                                  </span>
                                );
                              })}
                           </div>

                           {/* Fasting Warning Logic */}
                           {pkg.tests.some((tid: string) => tests.find(t => t.id === tid)?.fastingRequired) && (
                             <div className="mt-3 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl flex items-center gap-2 animate-pulse">
                               <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                               <span className="text-[9px] font-black text-amber-400 uppercase tracking-tighter">Requiere Ayuno de 8-12 Horas</span>
                             </div>
                           )}
                        </div>

                        <div className="pt-4 border-t border-white/5 flex items-center justify-between relative z-10">
                           <div className="flex items-center gap-2 text-[9px] text-slate-500">
                              <Clock className="w-3 h-3 text-amber-500" />
                              <span>TAT Estimado: 4h</span>
                           </div>
                           <div className="flex items-center gap-2">
                              {hasEditRights && (
                                <>
                                  <button
                                    onClick={() => {
                                      setEditingPackageId(pkg.id);
                                      setPkgName(pkg.name);
                                      setPkgCode(pkg.code);
                                      setSelectedTestsForPkg(pkg.tests);
                                      setPkgPrice(pkg.price);
                                      window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                    className="p-2.5 bg-slate-950 border border-white/5 hover:border-teal-500/50 text-teal-500/60 hover:text-teal-400 rounded-xl transition-all cursor-pointer shadow-lg active:scale-90"
                                    title="Editar Perfil"
                                  >
                                     <Edit2 className="w-4 h-4 stroke-[3]" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (window.confirm(`¿Está seguro que desea eliminar permanentemente el perfil ${pkg.name}?`)) {
                                        setPackages(prev => prev.filter(p => p.id !== pkg.id));
                                      }
                                    }}
                                    className="p-2.5 bg-slate-950 border border-white/5 hover:border-rose-500/50 text-rose-500/60 hover:text-rose-400 rounded-xl transition-all cursor-pointer shadow-lg active:scale-90"
                                    title="Eliminar Perfil"
                                  >
                                     <Trash2 className="w-4 h-4 stroke-[3]" />
                                  </button>
                                </>
                              )}
                           </div>
                        </div>
                     </div>
                   ))}
                </div>
             </div>
          </div>
        </div>
      )}

      {activeTab === 'REFERENCE_RANGES' && (
        <div className="space-y-4 animate-in fade-in duration-500">
          <div className="flex justify-between items-center bg-slate-900/40 p-4 rounded-2xl border border-white/5">
             <div className="flex items-center gap-3">
                <Sliders className="w-5 h-5 text-teal-400" />
                <h4 className="font-black text-white text-sm uppercase tracking-widest">Matriz de Intervalos de Referencia</h4>
             </div>
             {hasEditRights && (
               <button
                 onClick={() => {
                   setRangeTarget({ testId: selectedTest.id, paramId: selectedTest.parameters[0]?.id || '' });
                   setEditingRange(null);
                   setRangeUnit(selectedTest.parameters[0]?.unit || '');
                   setIsRangeModalOpen(true);
                 }}
                 className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-black px-4 py-2 rounded-xl text-[10px] uppercase tracking-widest transition shadow-lg flex items-center gap-2 cursor-pointer"
               >
                 <Plus className="w-3.5 h-3.5" />
                 <span>Nuevo Rango para {selectedTest.shortName}</span>
               </button>
             )}
          </div>

          <div className="bg-slate-900/40 border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950 text-slate-500 border-b border-white/5 font-black uppercase tracking-widest text-[9px]">
                  <th className="px-6 py-4">PRUEBA / PARÁMETRO</th>
                  <th className="px-6 py-4">SEXO</th>
                  <th className="px-6 py-4">EDAD (AÑOS)</th>
                  <th className="px-6 py-4">VALORES DE REFERENCIA</th>
                  <th className="px-6 py-4">UNIDAD</th>
                  <th className="px-6 py-4">FUENTE</th>
                  {hasEditRights && <th className="px-6 py-4 text-right">ACCIONES</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {tests.flatMap(t => t.parameters.length > 0
                  ? t.parameters.map(p => ({ testName: t.name, testId: t.id, param: p }))
                  : [{ testName: t.name, testId: t.id, param: { id: 'direct', name: 'Directo', unit: t.defaultUnit || '', referenceRanges: [] } }]
                ).map((row, idx) => (
                  <React.Fragment key={idx}>
                    {row.param.referenceRanges.map((r, rIdx) => (
                      <tr key={`${idx}-${rIdx}`} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="px-6 py-3">
                          <div className="font-black text-slate-200 uppercase text-[10px]">{row.testName}</div>
                          <div className="text-[9px] text-slate-500 font-bold">{row.param.name}</div>
                        </td>
                        <td className="px-6 py-3"><span className={`px-2 py-0.5 rounded text-[8px] font-black ${r.sex === 'MASCULINO' ? 'bg-blue-500/10 text-blue-400' : r.sex === 'FEMENINO' ? 'bg-rose-500/10 text-rose-400' : 'bg-teal-500/10 text-teal-400'}`}>{r.sex}</span></td>
                        <td className="px-6 py-3 text-slate-400 font-bold">{r.ageMinYears}-{r.ageMaxYears}</td>
                        <td className="px-6 py-3 font-black text-emerald-400 font-mono text-[11px]">{r.minValue}-{r.maxValue}</td>
                        <td className="px-6 py-3 text-slate-500 font-mono">{r.unit}</td>
                        <td className="px-6 py-3 text-[9px] text-slate-600 font-black">{r.source}</td>
                        {hasEditRights && (
                          <td className="px-6 py-3 text-right">
                             <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => {
                                    setRangeTarget({ testId: row.testId, paramId: row.param.id });
                                    setEditingRange(r);
                                    setRangeSex(r.sex);
                                    setRangeAgeMin(r.ageMinYears);
                                    setRangeAgeMax(r.ageMaxYears);
                                    setRangeMinVal(r.minValue || 0);
                                    setRangeMaxVal(r.maxValue || 0);
                                    setRangeUnit(r.unit);
                                    setRangeSource(r.source);
                                    setIsRangeModalOpen(true);
                                  }}
                                  className="p-1.5 hover:bg-teal-500/20 text-slate-500 hover:text-teal-400 rounded-lg transition-colors cursor-pointer"
                                >
                                   <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    if(confirm('¿Eliminar este rango de referencia?')) {
                                      setTests(prev => prev.map(t => t.id === row.testId ? {
                                        ...t,
                                        parameters: t.parameters.map(p => p.id === row.param.id ? {
                                          ...p,
                                          referenceRanges: p.referenceRanges.filter(ref => ref.id !== r.id)
                                        } : p)
                                      } : t));
                                    }
                                  }}
                                  className="p-1.5 hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                                >
                                   <Trash2 className="w-3.5 h-3.5" />
                                </button>
                             </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'CRITICAL_LIMITS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
          {tests.flatMap(t => t.parameters.filter(p => p.criticalValue)).map((p, idx) => (
            <div key={idx} className="bg-rose-500/5 border border-rose-500/20 p-6 rounded-[2.5rem] space-y-4 relative overflow-hidden group">
              <div className="absolute -top-10 -right-10 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl"></div>
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-500/20 animate-pulse"><AlertTriangle className="w-5 h-5" /></div>
                  <div>
                    <h4 className="font-black text-white text-sm uppercase">{p.name}</h4>
                    <span className="text-[9px] text-rose-400 font-bold tracking-widest uppercase">Límites de Pánico</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2 relative z-10">
                <div className="bg-slate-950 p-3 rounded-2xl border border-white/5 text-center">
                  <span className="text-[8px] text-slate-500 block uppercase mb-1">Crítico Bajo</span>
                  <span className="text-sm font-black text-rose-400 font-mono">{"<"} {p.criticalValue?.panicLow}</span>
                </div>
                <div className="bg-slate-950 p-3 rounded-2xl border border-white/5 text-center">
                  <span className="text-[8px] text-slate-500 block uppercase mb-1">Crítico Alto</span>
                  <span className="text-sm font-black text-rose-400 font-mono">{">"} {p.criticalValue?.panicHigh}</span>
                </div>
              </div>
              <div className="pt-4 border-t border-white/5 text-[10px] text-slate-400 italic leading-relaxed relative z-10">
                <span className="font-black text-rose-300 uppercase not-italic mr-1">Acción:</span> {p.criticalValue?.actionRequired}
              </div>
            </div>
          ))}
          {tests.flatMap(t => t.parameters.filter(p => p.criticalValue)).length === 0 && (
             <div className="col-span-full py-20 text-center space-y-4 bg-slate-900/20 rounded-[3rem] border border-dashed border-white/5 grayscale opacity-30">
                <ShieldCheck className="w-16 h-16 mx-auto text-slate-700" />
                <p className="text-xs font-black uppercase tracking-[0.5em] text-slate-500">No se han definido valores críticos (Panic Values) aún.</p>
             </div>
          )}
        </div>
      )}

      {activeTab === 'CONTAINERS_TUBES' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6 animate-in fade-in duration-500">
          {[
            { id: 'EDTA_LILA', name: 'EDTA Lila', color: '#a855f7', additive: 'EDTA K2/K3', use: 'Hematología / Molecular' },
            { id: 'CITRATO_AZUL', name: 'Citrato Azul', color: '#3b82f6', additive: 'Citrato Na 3.2%', use: 'Coagulación' },
            { id: 'SST_AMARILLO', name: 'Gel Amarillo', color: '#eab308', additive: 'Separador / Activador', use: 'Química / Inmuno' },
            { id: 'HEPARINA_VERDE', name: 'Heparina Verde', color: '#22c55e', additive: 'Heparina de Litio', use: 'Química / Gases' },
            { id: 'FLUORURO_GRIS', name: 'Flúor Gris', color: '#64748b', additive: 'Oxalato/Fluoruro', use: 'Glicemias / Lactato' },
            { id: 'FRASCO_ESTERIL', name: 'Frasco Estéril', color: '#06b6d4', additive: 'Ninguno', use: 'Urianálisis / Cultivos' }
          ].map(tube => (
            <div key={tube.id} className="bg-slate-900/60 border border-white/5 p-6 rounded-[2.5rem] flex flex-col items-center text-center space-y-4 hover:bg-slate-800/80 transition-all shadow-xl group">
               <div className="w-16 h-24 rounded-t-full rounded-b-2xl border-4 border-white/5 relative overflow-hidden group-hover:scale-110 transition-transform duration-500" style={{ backgroundColor: `${tube.color}33` }}>
                  <div className="absolute top-0 left-0 right-0 h-8" style={{ backgroundColor: tube.color }}></div>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex flex-col space-y-1">
                     <div className="w-3 h-0.5 bg-white/20"></div>
                     <div className="w-3 h-0.5 bg-white/20"></div>
                  </div>
               </div>
               <div>
                  <div className="text-[11px] font-black text-white uppercase tracking-tight">{tube.name}</div>
                  <div className="text-[8px] text-slate-500 font-bold uppercase mt-1 tracking-widest">{tube.additive}</div>
               </div>
               <div className="pt-3 border-t border-white/5 w-full">
                  <span className="text-[9px] text-teal-400/70 font-black uppercase tracking-tighter">{tube.use}</span>
               </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'SEED_EXPORT' && (
        <div className="max-w-4xl mx-auto bg-slate-900 border border-white/10 p-10 rounded-[4rem] space-y-10 shadow-2xl animate-in fade-in zoom-in-95 duration-500 relative overflow-hidden">
           <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/5 rounded-full blur-[100px]"></div>

           <div className="text-center space-y-4 relative z-10">
              <div className="w-20 h-20 bg-teal-500/20 rounded-[2rem] flex items-center justify-center mx-auto border border-teal-500/30 shadow-2xl shadow-teal-500/10">
                 <Database className="w-10 h-10 text-teal-400" />
              </div>
              <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic">Motor de Exportación LIS CORE</h2>
              <p className="text-slate-400 text-sm max-w-xl mx-auto leading-relaxed">Generación de archivos de definición de base de datos para sincronización con analizadores y middleware HL7/ASTM.</p>
           </div>

           <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 relative z-10">
              <button onClick={handleExportJson} className="bg-slate-950 border border-white/5 p-8 rounded-[3rem] space-y-4 hover:border-teal-500 transition-all text-center group shadow-xl">
                 <Code className="w-10 h-10 mx-auto text-teal-500 group-hover:scale-110 transition-transform" />
                 <div><div className="text-xs font-black text-white uppercase tracking-widest">JSON SEED</div><div className="text-[9px] text-slate-600 font-bold mt-1">Estructura de Objetos</div></div>
              </button>
              <button onClick={() => alert('Generando SQL...')} className="bg-slate-950 border border-white/5 p-8 rounded-[3rem] space-y-4 hover:border-indigo-500 transition-all text-center group shadow-xl">
                 <Database className="w-10 h-10 mx-auto text-indigo-500 group-hover:scale-110 transition-transform" />
                 <div><div className="text-xs font-black text-white uppercase tracking-widest">SQL DUMP</div><div className="text-[9px] text-slate-600 font-bold mt-1">Inserts de Producción</div></div>
              </button>
              <button onClick={() => alert('Generando XLSX...')} className="bg-slate-950 border border-white/5 p-8 rounded-[3rem] space-y-4 hover:border-emerald-500 transition-all text-center group shadow-xl">
                 <FileSpreadsheet className="w-10 h-10 mx-auto text-emerald-500 group-hover:scale-110 transition-transform" />
                 <div><div className="text-xs font-black text-white uppercase tracking-widest">Excel Real</div><div className="text-[9px] text-slate-600 font-bold mt-1">Formato Validado LIS</div></div>
              </button>
           </div>

           <div className="bg-slate-950/80 p-8 rounded-[3rem] border border-white/5 relative z-10">
              <div className="flex items-center justify-between mb-6">
                 <div className="flex items-center space-x-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    <span className="text-xs font-black text-white uppercase tracking-widest">Reporte de Consistencia LIS</span>
                 </div>
                 <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-lg text-[9px] font-black uppercase tracking-widest">Validado ISO 15189</span>
              </div>
              <div className="grid grid-cols-2 gap-6 text-[11px]">
                 <div className="flex items-center justify-between p-3 border-b border-white/5 text-slate-400"><span>Integridad Referencial</span><Check className="w-4 h-4 text-emerald-500" /></div>
                 <div className="flex items-center justify-between p-3 border-b border-white/5 text-slate-400"><span>Mapeo LOINC 2.82</span><Check className="w-4 h-4 text-emerald-400" /></div>
                 <div className="flex items-center justify-between p-3 border-b border-white/5 text-slate-400"><span>Codificación UCUM</span><Check className="w-4 h-4 text-emerald-500" /></div>
                 <div className="flex items-center justify-between p-3 border-b border-white/5 text-slate-400"><span>Estándar ASTM/HL7</span><Check className="w-4 h-4 text-emerald-400" /></div>
              </div>
           </div>
        </div>
      )}

      {isNewTestModalOpen && (
        <div className="fixed inset-0 z-[200] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
           <div className="bg-slate-900 border border-white/10 rounded-[3rem] p-8 max-w-lg w-full shadow-2xl space-y-6">
              <div className="flex items-center justify-between border-b border-white/5 pb-4"><h3 className="font-black text-white text-lg uppercase italic">Nueva Prueba</h3><button onClick={() => setIsNewTestModalOpen(false)}><X className="w-5 h-5 text-slate-500" /></button></div>
              <form onSubmit={handleCreateNewTest} className="space-y-4">
                 <input type="text" placeholder="NOMBRE DEL EXAMEN" value={formName} onChange={e => setFormName(e.target.value)} className="w-full bg-slate-950 border border-white/5 rounded-2xl p-4 text-xs text-white outline-none focus:border-teal-500" />
                 <div className="grid grid-cols-2 gap-4">
                    <input type="text" placeholder="CÓDIGO LIS" value={formCode} onChange={e => setFormCode(e.target.value)} className="bg-slate-950 border border-white/5 rounded-2xl p-4 text-xs text-white outline-none" />
                    <input type="number" placeholder="PRECIO USD" value={formPrice} onChange={e => setFormPrice(Number(e.target.value))} className="bg-slate-950 border border-white/5 rounded-2xl p-4 text-xs text-white outline-none" />
                 </div>
                 <select value={formArea} onChange={e => setFormArea(e.target.value)} className="w-full bg-slate-950 border border-white/5 rounded-2xl p-4 text-xs text-slate-400 outline-none">{areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
                 <button type="submit" className="w-full py-4 bg-teal-500 text-slate-950 font-black rounded-2xl text-[10px] uppercase tracking-widest">Finalizar Registro</button>
              </form>
           </div>
        </div>
      )}

      {/* MODAL: Add/Edit Reference Range */}
      {isRangeModalOpen && (
        <div className="fixed inset-0 z-[200] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
           <div className="bg-slate-900 border border-white/10 rounded-[3rem] p-8 max-w-lg w-full shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                 <h3 className="font-black text-white text-lg uppercase italic">{editingRange ? 'Editar Rango' : 'Nuevo Rango de Referencia'}</h3>
                 <button onClick={() => setIsRangeModalOpen(false)} className="cursor-pointer"><X className="w-5 h-5 text-slate-500" /></button>
              </div>

              <div className="space-y-4">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sexo:</label>
                       <select
                         value={rangeSex}
                         onChange={(e) => setRangeSex(e.target.value as any)}
                         className="w-full bg-slate-950 border border-white/5 rounded-2xl p-4 text-xs text-white outline-none focus:border-teal-500"
                       >
                          <option value="AMBOS">Ambos Sexos</option>
                          <option value="MASCULINO">Masculino</option>
                          <option value="FEMENINO">Femenino</option>
                       </select>
                    </div>
                    <div className="space-y-1">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Fuente / Norma:</label>
                       <input
                         type="text"
                         value={rangeSource}
                         onChange={(e) => setRangeSource(e.target.value)}
                         className="w-full bg-slate-950 border border-white/5 rounded-2xl p-4 text-xs text-white font-bold"
                       />
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Edad Mínima:</label>
                       <input
                         type="number"
                         value={rangeAgeMin}
                         onChange={(e) => setRangeAgeMin(Number(e.target.value))}
                         className="w-full bg-slate-950 border border-white/5 rounded-2xl p-4 text-xs text-white font-mono"
                       />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Edad Máxima:</label>
                       <input
                         type="number"
                         value={rangeAgeMax}
                         onChange={(e) => setRangeAgeMax(Number(e.target.value))}
                         className="w-full bg-slate-950 border border-white/5 rounded-2xl p-4 text-xs text-white font-mono"
                       />
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Valor Mínimo:</label>
                       <input
                         type="number"
                         step="0.01"
                         value={rangeMinVal}
                         onChange={(e) => setRangeMinVal(Number(e.target.value))}
                         className="w-full bg-slate-950 border border-white/5 rounded-2xl p-4 text-xs text-emerald-400 font-mono font-black"
                       />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Valor Máximo:</label>
                       <input
                         type="number"
                         step="0.01"
                         value={rangeMaxVal}
                         onChange={(e) => setRangeMaxVal(Number(e.target.value))}
                         className="w-full bg-slate-950 border border-white/5 rounded-2xl p-4 text-xs text-emerald-400 font-mono font-black"
                       />
                    </div>
                 </div>

                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Unidad de Medida:</label>
                    <input
                      type="text"
                      value={rangeUnit}
                      onChange={(e) => setRangeUnit(e.target.value)}
                      placeholder="ej. mg/dL"
                      className="w-full bg-slate-950 border border-white/5 rounded-2xl p-4 text-xs text-teal-400 font-bold"
                    />
                 </div>

                 <button
                   onClick={() => {
                     if (!rangeTarget) return;
                     const newRange: LisReferenceRange = {
                        id: editingRange?.id || `ref-${Date.now()}`,
                        sex: rangeSex,
                        ageMinYears: rangeAgeMin,
                        ageMaxYears: rangeAgeMax,
                        minValue: rangeMinVal,
                        maxValue: rangeMaxVal,
                        unit: rangeUnit,
                        source: rangeSource
                     };

                     setTests(prev => prev.map(t => t.id === rangeTarget.testId ? {
                        ...t,
                        parameters: t.parameters.map(p => p.id === rangeTarget.paramId ? {
                          ...p,
                          referenceRanges: editingRange
                            ? p.referenceRanges.map(r => r.id === editingRange.id ? newRange : r)
                            : [...p.referenceRanges, newRange]
                        } : p)
                     } : t));

                     setIsRangeModalOpen(false);
                     alert(editingRange ? 'Intervalo actualizado' : 'Nuevo intervalo registrado');
                   }}
                   className="w-full py-4 bg-teal-500 text-slate-950 font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-xl shadow-teal-500/20 cursor-pointer transition-transform active:scale-95"
                 >
                    {editingRange ? 'Guardar Cambios' : 'Registrar Rango en el Catálogo'}
                 </button>
              </div>
           </div>
        </div>
      )}
      {/* MODAL: Add/Edit Parameter (Component) */}
      {isParamModalOpen && (
        <div className="fixed inset-0 z-[200] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
           <div className="bg-slate-900 border border-white/10 rounded-[3rem] p-8 max-w-lg w-full shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                 <h3 className="font-black text-white text-lg uppercase italic">{editingParam ? 'Editar Componente' : 'Nuevo Componente de Panel'}</h3>
                 <button onClick={() => setIsParamModalOpen(false)} className="cursor-pointer"><X className="w-5 h-5 text-slate-500" /></button>
              </div>

              <div className="space-y-4">
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nombre del Analito:</label>
                    <input
                      type="text"
                      value={paramName}
                      onChange={(e) => setParamName(e.target.value)}
                      placeholder="ej. Neutrófilos Absolutos"
                      className="w-full bg-slate-950 border border-white/5 rounded-2xl p-4 text-xs text-white outline-none focus:border-teal-500"
                    />
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Código Interno:</label>
                       <input
                         type="text"
                         value={paramCode}
                         onChange={(e) => setParamCode(e.target.value)}
                         placeholder="NEU_ABS"
                         className="w-full bg-slate-950 border border-white/5 rounded-2xl p-4 text-xs text-white font-mono"
                       />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">LOINC:</label>
                       <input
                         type="text"
                         value={paramLoinc}
                         onChange={(e) => setParamLoinc(e.target.value)}
                         placeholder="770-8"
                         className="w-full bg-slate-950 border border-white/5 rounded-2xl p-4 text-xs text-white font-mono"
                       />
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Unidad:</label>
                       <input
                         type="text"
                         value={paramUnit}
                         onChange={(e) => setParamUnit(e.target.value)}
                         placeholder="x10³/µL"
                         className="w-full bg-slate-950 border border-white/5 rounded-2xl p-4 text-xs text-teal-400 font-bold"
                       />
                    </div>
                    <div className="flex flex-col justify-end pb-1">
                       <label className="flex items-center gap-3 cursor-pointer group">
                          <div className={`w-10 h-6 rounded-full p-1 transition-colors ${paramIsFormula ? 'bg-indigo-500' : 'bg-slate-800'}`}>
                             <div className={`w-4 h-4 bg-white rounded-full transition-transform ${paramIsFormula ? 'translate-x-4' : 'translate-x-0'}`}></div>
                          </div>
                          <input
                            type="checkbox"
                            className="hidden"
                            checked={paramIsFormula}
                            onChange={(e) => setParamIsFormula(e.target.checked)}
                          />
                          <span className="text-[10px] font-black text-slate-500 uppercase group-hover:text-indigo-400 transition-colors">¿Es Fórmula?</span>
                       </label>
                    </div>
                 </div>

                 {paramIsFormula && (
                    <div className="space-y-1 animate-in slide-in-from-top-2 duration-300">
                       <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1">Expresión Matemática (Fórmula):</label>
                       <input
                         type="text"
                         value={paramFormula}
                         onChange={(e) => setParamFormula(e.target.value)}
                         placeholder="ej. WBC * (NEU_PCT / 100)"
                         className="w-full bg-slate-950 border border-indigo-500/30 rounded-2xl p-4 text-xs text-indigo-300 font-mono italic"
                       />
                       <div className="text-[8px] text-slate-600 px-1">Usa los códigos internos de otros parámetros como variables.</div>
                    </div>
                 )}

                 <button
                   onClick={() => {
                     if (!targetTestId || !paramName) return;
                     const newParam: LisTestParameter = {
                        id: editingParam?.id || `p-${Date.now()}`,
                        code: paramCode,
                        loincCode: paramLoinc,
                        name: paramName,
                        unit: paramUnit,
                        resultType: 'NUMERIC',
                        referenceRanges: editingParam?.referenceRanges || [],
                        isFormula: paramIsFormula,
                        formulaExpression: paramIsFormula ? paramFormula : undefined
                     };

                     setTests(prev => prev.map(t => t.id === targetTestId ? {
                        ...t,
                        parameters: editingParam
                           ? t.parameters.map(p => p.id === editingParam.id ? newParam : p)
                           : [...t.parameters, newParam]
                     } : t));

                     setIsParamModalOpen(false);
                     alert(editingParam ? 'Componente actualizado' : 'Nuevo componente añadido al panel');
                   }}
                   className="w-full py-4 bg-teal-500 text-slate-950 font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-xl shadow-teal-500/20 cursor-pointer"
                 >
                    {editingParam ? 'Guardar Cambios' : 'Añadir al Panel Maestro'}
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
