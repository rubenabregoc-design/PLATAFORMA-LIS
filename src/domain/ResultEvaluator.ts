import { TestResult, Patient, ReferenceRange } from '../types';
import { parseRefRangeText, findCatalogParameter, ReferenceRangeEvaluation } from '../utils/referenceRangeEvaluator';

/**
 * Senior Domain Service: ResultEvaluator
 * Responsible for the "Brain" of the LIS regarding clinical values.
 */
export class ResultEvaluator {
  /**
   * Evaluates a result and returns a complete clinical context (Flags, Alarms, Severity).
   */
  static evaluate(result: TestResult, patient: Patient): ReferenceRangeEvaluation {
    const patientGender = patient.gender || 'M';
    const patientAge = this.calculateAge(patient.dob);

    // 1. Extract numeric value with high precision
    const numericVal = this.toNumeric(result.value, result.numericValue);

    // 2. Resolve reference ranges from Master Catalog (ISO 15189 compliance)
    const catalogData = findCatalogParameter(result.parameterName, (result as any).testCode, result.testId);

    // Default values if catalog is missing
    let min = 0, max = 100, pLow = undefined, pHigh = undefined;
    let rangeText = result.refRangeText;

    if (catalogData?.param?.referenceRanges) {
      const sexFilter = patientGender === 'F' ? 'FEMENINO' : 'MASCULINO';
      const match = catalogData.param.referenceRanges.find(
        r => (r.sex === sexFilter || r.sex === 'AMBOS') &&
             patientAge >= r.ageMinYears && patientAge <= r.ageMaxYears
      );
      if (match) {
        min = match.minValue;
        max = match.maxValue;
        rangeText = match.textReference || `${min} - ${max} ${result.unit}`;
      }
      if (catalogData.param.criticalValue) {
        pLow = catalogData.param.criticalValue.panicLow;
        pHigh = catalogData.param.criticalValue.panicHigh;
      }
    } else {
      // Fallback to manual string parsing
      const parsed = parseRefRangeText(result.refRangeText);
      min = parsed.min ?? 0;
      max = parsed.max ?? 99999;
    }

    // 3. Logic for intelligent flagging
    if (numericVal === null) return this.handleQualitative(result, rangeText);

    return this.calculateFlags(numericVal, min, max, pLow, pHigh, result.unit, rangeText);
  }

  private static calculateAge(dob: string): number {
    const birth = new Date(dob);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
    return age;
  }

  private static toNumeric(valStr: string, existingNum?: number): number | null {
    if (typeof existingNum === 'number' && !isNaN(existingNum)) return existingNum;
    const parsed = parseFloat(valStr.replace(',', '.').replace(/[^0-9.-]/g, ''));
    return isNaN(parsed) ? null : parsed;
  }

  private static handleQualitative(res: TestResult, refText: string): ReferenceRangeEvaluation {
    const isAbnormal = ['POSITIVO', 'DETECTADO', 'REACCIONAL', 'ALTO', 'BAJO'].includes(res.value.toUpperCase());
    return {
      isOutOfRange: isAbnormal,
      severity: isAbnormal ? 'HIGH' : 'NORMAL',
      flag: isAbnormal ? 'ALTO' : 'NORMAL',
      numericValue: null,
      cueText: isAbnormal ? '⚠️ ANORMAL' : 'NORMAL',
      badgeLabel: isAbnormal ? 'FUERA DE RANGO' : 'NORMAL',
      alertDetail: isAbnormal ? 'Valor cualitativo fuera de referencia' : 'Normal',
      catalogRefRangeText: refText,
      isCritical: false
    };
  }

  private static calculateFlags(val: number, min: number, max: number, pLow?: number, pHigh?: number, unit?: string, refText?: string): ReferenceRangeEvaluation {
    let severity: ReferenceRangeEvaluation['severity'] = 'NORMAL';
    let flag: ReferenceRangeEvaluation['flag'] = 'NORMAL';
    let isCritical = false;

    if (pHigh !== undefined && val >= pHigh) {
      severity = 'CRITICAL_HIGH';
      flag = 'CRITICO_ALTO';
      isCritical = true;
    } else if (pLow !== undefined && val <= pLow) {
      severity = 'CRITICAL_LOW';
      flag = 'CRITICO_BAJO';
      isCritical = true;
    } else if (val > max) {
      severity = 'HIGH';
      flag = 'ALTO';
    } else if (val < min) {
      severity = 'LOW';
      flag = 'BAJO';
    }

    return {
      isOutOfRange: severity !== 'NORMAL',
      severity,
      flag,
      numericValue: val,
      minValue: min,
      maxValue: max,
      criticalMin: pLow,
      criticalMax: pHigh,
      isCritical,
      cueText: flag.replace('_', ' '),
      badgeLabel: flag.replace('_', ' '),
      alertDetail: severity !== 'NORMAL' ? `Valor ${val} ${unit} fuera de límites (${min}-${max})` : 'Normal',
      catalogRefRangeText: refText || `${min}-${max}`
    };
  }
}
