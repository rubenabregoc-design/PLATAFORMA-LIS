import { TestResult, TestCatalogItem } from '../types';
import { MOCK_TEST_CATALOG } from '../data/mockData';

export interface ClinicalAreaMeta {
  id: string;
  name: string;
  shortName: string;
  order: number;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  keywords: string[];
}

export const CLINICAL_AREAS: Record<string, ClinicalAreaMeta> = {
  HEMATOLOGIA: {
    id: 'HEMATOLOGIA',
    name: 'HEMATOLOGÍA CLÍNICA',
    shortName: 'Hematología',
    order: 1,
    badgeBg: 'bg-rose-500/20',
    badgeText: 'text-rose-300',
    badgeBorder: 'border-rose-500/40',
    keywords: [
      'leucocito', 'wbc', 'hemoglobina', 'hgb', 'hematocrito', 'hct', 'plaqueta', 'plt',
      'vcm', 'hcm', 'chcm', 'rdw', 'neutrofilo', 'linfocito', 'monocito', 'eosinofilo',
      'basofilo', 'vsg', 'reticulocito', 'frotis', 'eritrocito', 'falcemia', 'drepanocito'
    ]
  },
  COAGULACION: {
    id: 'COAGULACION',
    name: 'COAGULACIÓN Y HEMOSTASIA',
    shortName: 'Coagulación',
    order: 2,
    badgeBg: 'bg-sky-500/20',
    badgeText: 'text-sky-300',
    badgeBorder: 'border-sky-500/40',
    keywords: [
      'tiempo de protrombina', 'pt', 'tp', 'ttpa', 'ttp', 'inr', 'fibrinogeno',
      'dimero d', 'tiempo de trombina', 'coagulacion'
    ]
  },
  QUIMICA: {
    id: 'QUIMICA',
    name: 'QUÍMICA CLÍNICA Y ENZIMAS',
    shortName: 'Química',
    order: 3,
    badgeBg: 'bg-emerald-500/20',
    badgeText: 'text-emerald-300',
    badgeBorder: 'border-emerald-500/40',
    keywords: [
      'glucosa', 'creatinina', 'urea', 'bun', 'acido urico', 'colesterol', 'triglicerido',
      'hdl', 'ldl', 'vldl', 'lipidico', 'ast', 'got', 'alt', 'gpt', 'fosfatasa', 'ggt',
      'bilirrubina', 'amilasa', 'lipasa', 'ldh', 'proteinas totales', 'albumina', 'globulina',
      'pcr', 'ferritina', 'hierro'
    ]
  },
  ELECTROLITOS: {
    id: 'ELECTROLITOS',
    name: 'ELECTROLITOS Y GASOMETRÍA',
    shortName: 'Electrolitos',
    order: 4,
    badgeBg: 'bg-cyan-500/20',
    badgeText: 'text-cyan-300',
    badgeBorder: 'border-cyan-500/40',
    keywords: [
      'sodio', 'potasio', 'cloro', 'calcio', 'fosforo', 'magnesio', 'gasometria',
      'ph', 'pco2', 'po2', 'bicarbonato', 'lactato'
    ]
  },
  GASOMETRIA_STAT: {
    id: 'GASOMETRIA_STAT',
    name: 'MARCADORES CARDIACOS Y PRUEBAS STAT',
    shortName: 'Pruebas STAT',
    order: 5,
    badgeBg: 'bg-red-500/20',
    badgeText: 'text-red-300',
    badgeBorder: 'border-red-500/40',
    keywords: [
      'troponina', 'ctni', 'hs-ctni', 'cpk', 'ck-mb', 'mioglobina', 'bnp', 'pro-bnp', 'stat'
    ]
  },
  ENDOCRINOLOGIA: {
    id: 'ENDOCRINOLOGIA',
    name: 'ENDOCRINOLOGÍA Y HORMONAS',
    shortName: 'Endocrinología',
    order: 6,
    badgeBg: 'bg-indigo-500/20',
    badgeText: 'text-indigo-300',
    badgeBorder: 'border-indigo-500/40',
    keywords: [
      'tsh', 't3', 't4', 'tiroides', 'cortisol', 'insulina', 'prolactina', 'fsh',
      'lh', 'estradiol', 'testosterona', 'progesterona', 'hcg', 'embarazo', 'hgh', 'acth'
    ]
  },
  MARCADORES_TUMORALES: {
    id: 'MARCADORES_TUMORALES',
    name: 'MARCADORES TUMORALES Y ONCOLOGÍA',
    shortName: 'Marcadores',
    order: 7,
    badgeBg: 'bg-purple-500/20',
    badgeText: 'text-purple-300',
    badgeBorder: 'border-purple-500/40',
    keywords: [
      'psa', 'cea', 'ca 125', 'ca 19-9', 'ca 15-3', 'alfafetoproteina', 'afp'
    ]
  },
  URINALISIS: {
    id: 'URINALISIS',
    name: 'URIANÁLISIS Y LÍQUIDOS BIOLÓGICOS',
    shortName: 'Urianálisis',
    order: 8,
    badgeBg: 'bg-amber-500/20',
    badgeText: 'text-amber-300',
    badgeBorder: 'border-amber-500/40',
    keywords: [
      'orina', 'urinalisis', 'sedimento', 'densidad', 'urobilinogeno', 'proteinuria',
      'microalbumina', 'depuracion'
    ]
  },
  COPROLOGIA: {
    id: 'COPROLOGIA',
    name: 'COPROLOGÍA Y PARASITOLOGÍA',
    shortName: 'Coprología',
    order: 9,
    badgeBg: 'bg-orange-500/20',
    badgeText: 'text-orange-300',
    badgeBorder: 'border-orange-500/40',
    keywords: [
      'heces', 'coprologico', 'parasito', 'sangre oculta', 'fit', 'ameba', 'giardia', 'ritchie'
    ]
  },
  INMUNOLOGIA: {
    id: 'INMUNOLOGIA',
    name: 'INMUNOLOGÍA Y SEROLOGÍA',
    shortName: 'Inmunología',
    order: 10,
    badgeBg: 'bg-teal-500/20',
    badgeText: 'text-teal-300',
    badgeBorder: 'border-teal-500/40',
    keywords: [
      'vih', 'hiv', 'vdrl', 'rpr', 'sifilis', 'hepatitis', 'hbsag', 'anti-hcv',
      'dengue', 'toxoplasma', 'rubeola', 'citomegalovirus', 'ana', 'factor reumatoideo', 'aso'
    ]
  },
  SEROLOGIA: {
    id: 'SEROLOGIA',
    name: 'INMUNOLOGÍA Y SEROLOGÍA',
    shortName: 'Serología',
    order: 10,
    badgeBg: 'bg-teal-500/20',
    badgeText: 'text-teal-300',
    badgeBorder: 'border-teal-500/40',
    keywords: ['serologia', 'vdrl', 'rpr', 'treponema', 'chagas']
  },
  MICROBIOLOGIA: {
    id: 'MICROBIOLOGIA',
    name: 'MICROBIOLOGÍA Y CULTIVOS',
    shortName: 'Microbiología',
    order: 11,
    badgeBg: 'bg-violet-500/20',
    badgeText: 'text-violet-300',
    badgeBorder: 'border-violet-500/40',
    keywords: ['cultivo', 'antibiograma', 'gram', 'baciloscopia', 'ziehl', 'koh', 'hongo', 'agar']
  },
  BANCO_SANGRE: {
    id: 'BANCO_SANGRE',
    name: 'INMUNOHEMATOLOGÍA Y BANCO DE SANGRE',
    shortName: 'Banco de Sangre',
    order: 12,
    badgeBg: 'bg-rose-600/20',
    badgeText: 'text-rose-400',
    badgeBorder: 'border-rose-600/40',
    keywords: ['rh', 'grupo sanguineo', 'coombs', 'donante', 'anticuerpo irregular']
  },
  GENERAL: {
    id: 'GENERAL',
    name: 'ANÁLISIS CLÍNICO GENERAL',
    shortName: 'General',
    order: 99,
    badgeBg: 'bg-slate-800',
    badgeText: 'text-slate-300',
    badgeBorder: 'border-slate-700',
    keywords: []
  }
};

/**
 * Classifies any TestResult into its clinical laboratory area.
 */
export function getClinicalAreaForResult(
  res: TestResult,
  catalog: TestCatalogItem[] = MOCK_TEST_CATALOG
): ClinicalAreaMeta {
  // 1. Direct match by testId or testCode in catalog
  if (res.testId || res.testCode) {
    const test = catalog.find((t) => t.id === res.testId || t.code === res.testCode);
    if (test && test.category && CLINICAL_AREAS[test.category]) {
      return CLINICAL_AREAS[test.category];
    }
  }

  // 2. Match by parameter in catalog
  if (res.parameterId || res.parameterCode || res.parameterName) {
    const testWithParam = catalog.find((t) =>
      t.parameters?.some(
        (p) =>
          (res.parameterId && p.id === res.parameterId) ||
          (res.parameterCode && p.code === res.parameterCode) ||
          (res.parameterName && p.name.trim().toLowerCase() === res.parameterName.trim().toLowerCase())
      )
    );
    if (testWithParam && testWithParam.category && CLINICAL_AREAS[testWithParam.category]) {
      return CLINICAL_AREAS[testWithParam.category];
    }
  }

  // 3. Keyword heuristic on parameterName / parameterCode / testId
  const searchStr = `${res.parameterName || ''} ${res.parameterCode || ''} ${res.testId || ''} ${res.specimenType || ''}`.toLowerCase();
  
  // Specific check for Troponin / Cardiac STAT
  if (searchStr.includes('troponina') || searchStr.includes('ctni') || searchStr.includes('ck-mb')) {
    return CLINICAL_AREAS['GASOMETRIA_STAT'];
  }

  for (const area of Object.values(CLINICAL_AREAS)) {
    if (area.id === 'GENERAL') continue;
    if (area.keywords.some((kw) => searchStr.includes(kw))) {
      return area;
    }
  }

  return CLINICAL_AREAS['GENERAL'];
}

export interface GroupedClinicalSection {
  area: ClinicalAreaMeta;
  results: TestResult[];
}

/**
 * Groups a collection of TestResult objects by clinical area, sorted by standard clinical presentation order.
 */
export function groupResultsByClinicalArea(
  results: TestResult[],
  catalog: TestCatalogItem[] = MOCK_TEST_CATALOG
): GroupedClinicalSection[] {
  const map = new Map<string, GroupedClinicalSection>();

  results.forEach((res) => {
    const area = getClinicalAreaForResult(res, catalog);
    if (!map.has(area.id)) {
      map.set(area.id, { area, results: [] });
    }
    map.get(area.id)!.results.push(res);
  });

  return Array.from(map.values()).sort((a, b) => a.area.order - b.area.order);
}
