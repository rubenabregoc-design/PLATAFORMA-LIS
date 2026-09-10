/**
 * resultNormalizer.ts — Motor de Normalización de Valores de Analizadores Clínicos
 * AbregoTech LIS • Convierte valores crudos ASTM/HL7 en inglés o abreviados
 * a su equivalente en español para visualización clínica en Panamá.
 */

export type AnalyzerProtocol = 'ASTM_E1381' | 'HL7_V2' | 'SERIAL_RS232' | 'GENERIC';

export interface NormalizedResult {
  rawValue: string;
  displayValue: string;
  flag: 'NORMAL' | 'ALTO' | 'BAJO' | 'CRITICO_ALTO' | 'CRITICO_BAJO' | 'ANORMAL' | 'INDETERMINADO';
  numericValue?: number;
  wasNormalized: boolean;
}

const VALUE_DICTIONARY: Record<string, { display: string; flag: NormalizedResult['flag'] }> = {
  'negative':         { display: 'Negativo',                 flag: 'NORMAL'        },
  'neg':              { display: 'Negativo',                 flag: 'NORMAL'        },
  'neg.':             { display: 'Negativo',                 flag: 'NORMAL'        },
  'positive':         { display: 'Positivo',                 flag: 'ANORMAL'       },
  'pos':              { display: 'Positivo',                 flag: 'ANORMAL'       },
  'pos.':             { display: 'Positivo',                 flag: 'ANORMAL'       },
  'reactive':         { display: 'Reactivo',                 flag: 'ANORMAL'       },
  'react':            { display: 'Reactivo',                 flag: 'ANORMAL'       },
  'non reactive':     { display: 'No Reactivo',              flag: 'NORMAL'        },
  'non-reactive':     { display: 'No Reactivo',              flag: 'NORMAL'        },
  'nonreactive':      { display: 'No Reactivo',              flag: 'NORMAL'        },
  'not reactive':     { display: 'No Reactivo',              flag: 'NORMAL'        },
  'detected':         { display: 'Detectado',                flag: 'ANORMAL'       },
  'not detected':     { display: 'No Detectado',             flag: 'NORMAL'        },
  'not detect':       { display: 'No Detectado',             flag: 'NORMAL'        },
  'undetected':       { display: 'No Detectado',             flag: 'NORMAL'        },
  'indeterminate':    { display: 'Indeterminado',            flag: 'INDETERMINADO' },
  'equivocal':        { display: 'Equivoco',                 flag: 'INDETERMINADO' },
  'invalid':          { display: 'Invalido',                 flag: 'INDETERMINADO' },
  'error':            { display: 'Error de Instrumento',     flag: 'INDETERMINADO' },
  'err':              { display: 'Error de Instrumento',     flag: 'INDETERMINADO' },
  'n':                { display: 'Normal',                   flag: 'NORMAL'        },
  'normal':           { display: 'Normal',                   flag: 'NORMAL'        },
  'h':                { display: 'ALTO',                     flag: 'ALTO'          },
  'high':             { display: 'ALTO',                     flag: 'ALTO'          },
  'hi':               { display: 'ALTO',                     flag: 'ALTO'          },
  'l':                { display: 'BAJO',                     flag: 'BAJO'          },
  'low':              { display: 'BAJO',                     flag: 'BAJO'          },
  'lo':               { display: 'BAJO',                     flag: 'BAJO'          },
  'hh':               { display: 'CRITICO ALTO',             flag: 'CRITICO_ALTO'  },
  'critical high':    { display: 'CRITICO ALTO',             flag: 'CRITICO_ALTO'  },
  'panic high':       { display: 'PANICO ALTO',              flag: 'CRITICO_ALTO'  },
  'll':               { display: 'CRITICO BAJO',             flag: 'CRITICO_BAJO'  },
  'critical low':     { display: 'CRITICO BAJO',             flag: 'CRITICO_BAJO'  },
  'panic low':        { display: 'PANICO BAJO',              flag: 'CRITICO_BAJO'  },
  'a':                { display: 'Anormal',                  flag: 'ANORMAL'       },
  'abnormal':         { display: 'Anormal',                  flag: 'ANORMAL'       },
  'no growth':        { display: 'Sin Crecimiento',          flag: 'NORMAL'        },
  'growth detected':  { display: 'Crecimiento Detectado',    flag: 'ANORMAL'       },
  'resistant':        { display: 'Resistente',               flag: 'ANORMAL'       },
  'sensitive':        { display: 'Sensible',                 flag: 'NORMAL'        },
  'intermediate':     { display: 'Intermedio',               flag: 'INDETERMINADO' },
  'trace':            { display: 'Trazas',                   flag: 'ANORMAL'       },
  '1+':               { display: '1+ (Leve)',                flag: 'ANORMAL'       },
  '2+':               { display: '2+ (Moderado)',            flag: 'ANORMAL'       },
  '3+':               { display: '3+ (Marcado)',             flag: 'ANORMAL'       },
  '4+':               { display: '4+ (Masivo)',              flag: 'ANORMAL'       },
  'absent':           { display: 'Ausente',                  flag: 'NORMAL'        },
  'present':          { display: 'Presente',                 flag: 'ANORMAL'       },
  'none':             { display: 'Ninguno',                  flag: 'NORMAL'        },
  'few':              { display: 'Escasos',                  flag: 'ANORMAL'       },
  'moderate':         { display: 'Moderados',                flag: 'ANORMAL'       },
  'many':             { display: 'Numerosos',                flag: 'ANORMAL'       },
  'large':            { display: 'Abundantes',               flag: 'ANORMAL'       },
  'qns':              { display: 'Muestra Insuficiente',     flag: 'INDETERMINADO' },
  'insufficient':     { display: 'Muestra Insuficiente',     flag: 'INDETERMINADO' },
  'hemolyzed':        { display: 'Muestra Hemolizada',       flag: 'INDETERMINADO' },
  'lipemic':          { display: 'Muestra Lipemica',         flag: 'INDETERMINADO' },
  'icteric':          { display: 'Muestra Ictérica',         flag: 'INDETERMINADO' },
  'clotted':          { display: 'Muestra Coagulada',        flag: 'INDETERMINADO' },
  'canceled':         { display: 'Cancelado',                flag: 'INDETERMINADO' },
  'cancelled':        { display: 'Cancelado',                flag: 'INDETERMINADO' },
  'pending':          { display: 'Pendiente',                flag: 'INDETERMINADO' },
  'repeat':           { display: 'Repetir Muestra',          flag: 'INDETERMINADO' },
  'blasts':           { display: 'Blastos Presentes',        flag: 'CRITICO_ALTO'  },
};

const FLAG_TRANSLATE: Record<string, NormalizedResult['flag']> = {
  'H': 'ALTO', 'HH': 'CRITICO_ALTO', 'PH': 'CRITICO_ALTO',
  'L': 'BAJO', 'LL': 'CRITICO_BAJO', 'PL': 'CRITICO_BAJO',
  'A': 'ANORMAL', 'N': 'NORMAL', 'I': 'INDETERMINADO',
};

export function normalizeAnalyzerValue(
  rawValue: string | null | undefined,
  flagCode?: string | null,
  _protocol?: AnalyzerProtocol
): NormalizedResult {
  if (rawValue == null || rawValue === '') {
    return { rawValue: '', displayValue: '', flag: 'INDETERMINADO', wasNormalized: false };
  }

  const raw = rawValue.trim();
  const key = raw.toLowerCase();

  if (VALUE_DICTIONARY[key]) {
    const entry = VALUE_DICTIONARY[key];
    return { rawValue: raw, displayValue: entry.display, flag: entry.flag, wasNormalized: entry.display !== raw };
  }

  const numeric = parseFloat(raw.replace(',', '.'));
  if (!isNaN(numeric)) {
    let flag: NormalizedResult['flag'] = 'NORMAL';
    if (flagCode && FLAG_TRANSLATE[flagCode.toUpperCase()]) {
      flag = FLAG_TRANSLATE[flagCode.toUpperCase()];
    }
    return { rawValue: raw, displayValue: raw, flag, numericValue: numeric, wasNormalized: false };
  }

  for (const [pattern, entry] of Object.entries(VALUE_DICTIONARY)) {
    if (key.includes(pattern) && pattern.length > 2) {
      return { rawValue: raw, displayValue: entry.display, flag: entry.flag, wasNormalized: true };
    }
  }

  let flag: NormalizedResult['flag'] = 'INDETERMINADO';
  if (flagCode && FLAG_TRANSLATE[flagCode.toUpperCase()]) {
    flag = FLAG_TRANSLATE[flagCode.toUpperCase()];
  }
  return { rawValue: raw, displayValue: raw, flag, wasNormalized: false };
}

export function normalizeAnalyzerBatch(
  records: Array<{ value: string; flag?: string | null; protocol?: AnalyzerProtocol }>
): NormalizedResult[] {
  return records.map((r) => normalizeAnalyzerValue(r.value, r.flag, r.protocol));
}

export function getFlagColor(flag: NormalizedResult['flag']): string {
  switch (flag) {
    case 'NORMAL':        return 'text-emerald-400';
    case 'ALTO':          return 'text-amber-400';
    case 'BAJO':          return 'text-blue-400';
    case 'CRITICO_ALTO':  return 'text-rose-500 font-bold';
    case 'CRITICO_BAJO':  return 'text-rose-500 font-bold';
    case 'ANORMAL':       return 'text-orange-400';
    case 'INDETERMINADO': return 'text-slate-400';
    default:              return 'text-slate-300';
  }
}

export function getFlagBadgeClass(flag: NormalizedResult['flag']): string {
  switch (flag) {
    case 'NORMAL':        return 'bg-emerald-950 text-emerald-300 border border-emerald-800';
    case 'ALTO':          return 'bg-amber-950 text-amber-300 border border-amber-800';
    case 'BAJO':          return 'bg-blue-950 text-blue-300 border border-blue-800';
    case 'CRITICO_ALTO':  return 'bg-rose-950 text-rose-300 border border-rose-700';
    case 'CRITICO_BAJO':  return 'bg-rose-950 text-rose-300 border border-rose-700';
    case 'ANORMAL':       return 'bg-orange-950 text-orange-300 border border-orange-800';
    case 'INDETERMINADO': return 'bg-slate-800 text-slate-400 border border-slate-700';
    default:              return 'bg-slate-900 text-slate-400 border border-slate-800';
  }
}
