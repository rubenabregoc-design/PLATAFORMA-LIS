import { TestResult, Patient } from '../types';
import { MASTER_TESTS, LisMasterTest, LisTestParameter, LisReferenceRange } from '../components/MasterTestCatalogManager';

export interface ReferenceRangeEvaluation {
  isOutOfRange: boolean;
  severity: 'NORMAL' | 'LOW' | 'HIGH' | 'CRITICAL_LOW' | 'CRITICAL_HIGH';
  flag: 'NORMAL' | 'BAJO' | 'ALTO' | 'CRITICO_BAJO' | 'CRITICO_ALTO';
  numericValue: number | null;
  minValue?: number;
  maxValue?: number;
  criticalMin?: number;
  criticalMax?: number;
  cueText: string;
  badgeLabel: string;
  alertDetail: string;
  catalogRefRangeText: string;
  isCritical: boolean;
}

/**
 * Parses standard LIS reference range strings such as:
 * - "70 - 99" -> min: 70, max: 99
 * - "< 200" -> max: 200
 * - "< 14.0" -> max: 14.0
 * - "> 50" -> min: 50
 * - "12.0 - 15.5" -> min: 12.0, max: 15.5
 * - "135 - 145" -> min: 135, max: 145
 */
export function parseRefRangeText(refText?: string): { min?: number; max?: number } {
  if (!refText) return {};

  const clean = refText.replace(/[a-zA-Z%µ/³]/g, '').trim();

  // Pattern "min - max" or "min – max"
  const rangeMatch = clean.match(/([\d.]+)\s*[-–—]\s*([\d.]+)/);
  if (rangeMatch) {
    const min = parseFloat(rangeMatch[1]);
    const max = parseFloat(rangeMatch[2]);
    if (!isNaN(min) && !isNaN(max)) return { min, max };
  }

  // Pattern "< max" or "<= max"
  const maxMatch = clean.match(/[<≤]\s*([\d.]+)/);
  if (maxMatch) {
    const max = parseFloat(maxMatch[1]);
    if (!isNaN(max)) return { max };
  }

  // Pattern "> min" or ">= min"
  const minMatch = clean.match(/[>≥]\s*([\d.]+)/);
  if (minMatch) {
    const min = parseFloat(minMatch[1]);
    if (!isNaN(min)) return { min };
  }

  return {};
}

/**
 * Normalizes test / parameter names for fuzzy lookup against Master Test Catalog.
 */
function normalizeName(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Looks up a parameter in the Master Test Catalog (MASTER_TESTS) by parameter name, code or testId.
 */
export function findCatalogParameter(
  parameterName: string,
  testCode?: string,
  testId?: string
): { test?: LisMasterTest; param?: LisTestParameter } | null {
  const normTarget = normalizeName(parameterName);

  for (const test of MASTER_TESTS) {
    for (const param of test.parameters) {
      const normParamName = normalizeName(param.name);
      const normParamCode = normalizeName(param.code);
      const normAstm = param.astmMappingCode ? normalizeName(param.astmMappingCode) : '';

      if (
        normTarget === normParamName ||
        normTarget === normParamCode ||
        (normAstm && normTarget === normAstm) ||
        normTarget.includes(normParamName) ||
        normParamName.includes(normTarget)
      ) {
        return { test, param };
      }
    }

    // Direct test name matching for single-parameter tests
    const normTestName = normalizeName(test.name);
    const normTestShort = normalizeName(test.shortName);
    if (normTarget === normTestName || normTarget === normTestShort || (testCode && test.code === testCode)) {
      if (test.parameters.length > 0) {
        return { test, param: test.parameters[0] };
      }
    }
  }

  return null;
}

/**
 * Evaluates whether a result value falls outside the Master Test Catalog reference ranges.
 * If out of range, provides structured alerts and high/low cues.
 */
export function evaluateTestResult(
  result: TestResult,
  patient?: { gender?: 'M' | 'F'; age?: number; dob?: string } | Patient
): ReferenceRangeEvaluation {
  const patientGender = patient?.gender || 'M';
  
  // Calculate patient age
  let patientAge = 30;
  if (patient && 'age' in patient && typeof (patient as any).age === 'number') {
    patientAge = (patient as any).age;
  } else if (patient && 'dob' in patient && patient.dob) {
    const birthYear = new Date(patient.dob).getFullYear();
    const currentYear = new Date().getFullYear();
    if (!isNaN(birthYear) && birthYear > 1900) {
      patientAge = Math.max(0, currentYear - birthYear);
    }
  } else if (patient && (patient as any).patientAge) {
    patientAge = Number((patient as any).patientAge) || 30;
  }

  // 1. Extract numeric value
  let numericVal: number | null = null;
  if (typeof result.numericValue === 'number' && !isNaN(result.numericValue)) {
    numericVal = result.numericValue;
  } else if (result.value) {
    const parsed = parseFloat(result.value.replace(',', '.').replace(/[^0-9.-]/g, ''));
    if (!isNaN(parsed)) {
      numericVal = parsed;
    }
  }

  // 2. Search Master Test Catalog
  const testCode = (result as any).testCode || (result as any).code;
  const catalogMatch = findCatalogParameter(result.parameterName, testCode, result.testId);

  let minValue: number | undefined;
  let maxValue: number | undefined;
  let criticalMin: number | undefined;
  let criticalMax: number | undefined;
  let catalogRefRangeText: string = result.refRangeText || '';

  if (catalogMatch?.param) {
    const param = catalogMatch.param;
    if (param.criticalValue) {
      criticalMin = param.criticalValue.panicLow;
      criticalMax = param.criticalValue.panicHigh;
    }

    // Pick reference range based on sex and age
    let matchedRange: LisReferenceRange | undefined;
    if (param.referenceRanges && param.referenceRanges.length > 0) {
      // Look for sex-specific range
      const sexFilter = patientGender === 'F' ? 'FEMENINO' : 'MASCULINO';
      matchedRange = param.referenceRanges.find(
        r => (r.sex === sexFilter || r.sex === 'AMBOS') &&
             (!r.condition || !r.condition.includes('Embarazo')) &&
             patientAge >= r.ageMinYears && patientAge <= r.ageMaxYears
      ) || param.referenceRanges.find(r => r.sex === 'AMBOS') || param.referenceRanges[0];

      if (matchedRange) {
        if (typeof matchedRange.minValue === 'number') minValue = matchedRange.minValue;
        if (typeof matchedRange.maxValue === 'number') maxValue = matchedRange.maxValue;
        if (matchedRange.textReference) {
          catalogRefRangeText = matchedRange.textReference;
        } else if (minValue !== undefined && maxValue !== undefined) {
          catalogRefRangeText = `${minValue} - ${maxValue} ${matchedRange.unit || result.unit}`;
        }
      }
    }
  }

  // Fallback to parsing result.refRangeText if catalog match wasn't definitive
  if (minValue === undefined && maxValue === undefined && result.refRangeText) {
    const parsed = parseRefRangeText(result.refRangeText);
    minValue = parsed.min;
    maxValue = parsed.max;
  }

  // Fallback for well-known standard reference ranges if still undefined
  if (minValue === undefined && maxValue === undefined) {
    const norm = normalizeName(result.parameterName);
    if (norm.includes('hemoglobina') || norm === 'hgb' || norm === 'hb') {
      minValue = patientGender === 'F' ? 12.0 : 13.5;
      maxValue = patientGender === 'F' ? 15.5 : 17.5;
      criticalMin = 6.0;
      criticalMax = 20.0;
    } else if (norm.includes('hematocrito') || norm === 'hct' || norm === 'hto') {
      minValue = patientGender === 'F' ? 34.9 : 38.8;
      maxValue = patientGender === 'F' ? 44.5 : 50.0;
      criticalMin = 18.0;
      criticalMax = 60.0;
    } else if (norm.includes('colesteroltotal') || norm === 'colesterol') {
      maxValue = 200;
      criticalMax = 300;
    } else if (norm.includes('trigliceridos')) {
      maxValue = 150;
      criticalMax = 500;
    } else if (norm.includes('glucosa') || norm === 'glicemia') {
      minValue = 70;
      maxValue = 99;
      criticalMin = 50;
      criticalMax = 400;
    } else if (norm.includes('creatinina')) {
      minValue = patientGender === 'F' ? 0.5 : 0.7;
      maxValue = patientGender === 'F' ? 1.0 : 1.2;
      criticalMax = 4.0;
    } else if (norm.includes('potasio') || norm === 'k') {
      minValue = 3.5;
      maxValue = 5.1;
      criticalMin = 2.8;
      criticalMax = 6.2;
    } else if (norm.includes('leucocitos') || norm === 'wbc') {
      minValue = 4.5;
      maxValue = 11.0;
      criticalMin = 1.5;
      criticalMax = 30.0;
    } else if (norm.includes('plaquetas') || norm === 'plt') {
      minValue = 150;
      maxValue = 450;
      criticalMin = 20;
      criticalMax = 1000;
    }
  }

  // 3. Evaluation logic
  if (numericVal === null) {
    // Non-numeric result
    const isQualitativeFlag = result.flag === 'ALTO' || result.flag === 'BAJO' || result.flag?.includes('CRITICO');
    return {
      isOutOfRange: isQualitativeFlag,
      severity: isQualitativeFlag ? 'HIGH' : 'NORMAL',
      flag: result.flag || 'NORMAL',
      numericValue: null,
      minValue,
      maxValue,
      criticalMin,
      criticalMax,
      cueText: isQualitativeFlag ? '⚠️ ALERTA' : 'NORMAL',
      badgeLabel: isQualitativeFlag ? 'FUERA DE RANGO' : 'NORMAL',
      alertDetail: isQualitativeFlag ? 'Resultado cualitativo fuera de referencia' : 'En rango normal',
      catalogRefRangeText: catalogRefRangeText || result.refRangeText || 'Normal',
      isCritical: !!result.flag?.includes('CRITICO')
    };
  }

  let isCriticalLow = false;
  let isCriticalHigh = false;
  let isLow = false;
  let isHigh = false;

  // Critical checks
  if (criticalMin !== undefined && numericVal <= criticalMin) {
    isCriticalLow = true;
  }
  if (criticalMax !== undefined && numericVal >= criticalMax) {
    isCriticalHigh = true;
  }

  // Standard range checks
  if (minValue !== undefined && numericVal < minValue) {
    isLow = true;
  }
  if (maxValue !== undefined && numericVal > maxValue) {
    isHigh = true;
  }

  // Also check if result has existing flag
  if (result.flag === 'ALTO' && !isHigh && !isCriticalHigh) isHigh = true;
  if (result.flag === 'BAJO' && !isLow && !isCriticalLow) isLow = true;
  if (result.flag === 'CRITICO_ALTO') isCriticalHigh = true;
  if (result.flag === 'CRITICO_BAJO') isCriticalLow = true;

  const isOutOfRange = isCriticalLow || isCriticalHigh || isLow || isHigh;

  let severity: 'NORMAL' | 'LOW' | 'HIGH' | 'CRITICAL_LOW' | 'CRITICAL_HIGH' = 'NORMAL';
  let flag: 'NORMAL' | 'BAJO' | 'ALTO' | 'CRITICO_BAJO' | 'CRITICO_ALTO' = 'NORMAL';
  let cueText = 'NORMAL';
  let badgeLabel = 'NORMAL';
  let alertDetail = 'Dentro del rango de referencia del catálogo.';

  if (isCriticalHigh) {
    severity = 'CRITICAL_HIGH';
    flag = 'CRITICO_ALTO';
    cueText = '🚨 CRÍTICO ALTO';
    badgeLabel = '▲ CRÍTICO ALTO';
    alertDetail = criticalMax !== undefined
      ? `Valor ${numericVal} ${result.unit} excede el Límite de Pánico (${criticalMax} ${result.unit})`
      : `Valor ${numericVal} ${result.unit} supera el umbral crítico superior (${maxValue} ${result.unit})`;
  } else if (isCriticalLow) {
    severity = 'CRITICAL_LOW';
    flag = 'CRITICO_BAJO';
    cueText = '🚨 CRÍTICO BAJO';
    badgeLabel = '▼ CRÍTICO BAJO';
    alertDetail = criticalMin !== undefined
      ? `Valor ${numericVal} ${result.unit} por debajo del Límite de Pánico (${criticalMin} ${result.unit})`
      : `Valor ${numericVal} ${result.unit} inferior al umbral crítico (${minValue} ${result.unit})`;
  } else if (isHigh) {
    severity = 'HIGH';
    flag = 'ALTO';
    cueText = '▲ ALTO';
    badgeLabel = '▲ ALTO';
    alertDetail = maxValue !== undefined
      ? `Valor ${numericVal} ${result.unit} > Límite Máximo (${maxValue} ${result.unit})`
      : `Valor ${numericVal} ${result.unit} fuera de rango superior`;
  } else if (isLow) {
    severity = 'LOW';
    flag = 'BAJO';
    cueText = '▼ BAJO';
    badgeLabel = '▼ BAJO';
    alertDetail = minValue !== undefined
      ? `Valor ${numericVal} ${result.unit} < Límite Mínimo (${minValue} ${result.unit})`
      : `Valor ${numericVal} ${result.unit} fuera de rango inferior`;
  }

  return {
    isOutOfRange,
    severity,
    flag,
    numericValue: numericVal,
    minValue,
    maxValue,
    criticalMin,
    criticalMax,
    cueText,
    badgeLabel,
    alertDetail,
    catalogRefRangeText: catalogRefRangeText || result.refRangeText || `${minValue ?? ''} - ${maxValue ?? ''}`,
    isCritical: isCriticalLow || isCriticalHigh
  };
}
