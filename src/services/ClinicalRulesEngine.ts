import { AnalyzerTestMapping, ReferenceRange, TestResult } from '../types';

/**
 * ============================================================================
 * AbregoTech Clinical Rules Engine
 * ============================================================================
 * Motor de reglas médicas que se encarga de separar la lógica clínica (Cálculos,
 * Flags y Reglas de Pánico) de la interfaz gráfica (React).
 * Esto permite pruebas unitarias (Unit Tests) y cumple con normativas ISO-15189.
 */

export class ClinicalRulesEngine {
  /**
   * Evalúa un valor crudo del analizador contra su diccionario de homologación
   * para generar el TestResult final y calcular los Flags.
   */
  static processAnalyzerResult(
    rawAnalyzerValue: number,
    mapping: AnalyzerTestMapping,
    patientDetails: { age: number; gender: 'Masculino' | 'Femenino' | 'Ambos' }
  ): Partial<TestResult> {
    // 1. Aplicar Factor de Conversión
    const numericValue = rawAnalyzerValue * mapping.multiplierFactor;
    const valueStr = numericValue.toFixed(2);

    // 2. Buscar Rango de Referencia Aplicable (Demografía)
    const applicableRange = this.findApplicableRange(mapping.referenceRanges || [], patientDetails);

    // 3. Evaluar Bandera Clínica (Flag)
    let flag: TestResult['flag'] = 'NORMAL';
    let refRangeText = applicableRange ? `${applicableRange.minValue} - ${applicableRange.maxValue}` : 'N/A';

    if (applicableRange) {
      if (applicableRange.panicHighValue && numericValue >= applicableRange.panicHighValue) {
        flag = 'CRITICO_ALTO';
      } else if (applicableRange.panicLowValue && numericValue <= applicableRange.panicLowValue) {
        flag = 'CRITICO_BAJO';
      } else if (numericValue > applicableRange.maxValue) {
        flag = 'ALTO';
      } else if (numericValue < applicableRange.minValue) {
        flag = 'BAJO';
      }
    }

    return {
      parameterCode: mapping.lisTestCode,
      parameterName: mapping.lisTestName,
      unit: mapping.unit,
      value: valueStr,
      numericValue,
      flag,
      refRangeText
    };
  }

  /**
   * Encuentra el rango de referencia exacto basado en la edad y género del paciente.
   */
  private static findApplicableRange(
    ranges: ReferenceRange[],
    patient: { age: number; gender: string }
  ): ReferenceRange | null {
    if (ranges.length === 0) return null;

    // Buscar coincidencia exacta
    const exactMatch = ranges.find(r => 
      (r.gender === patient.gender || r.gender === 'Ambos') &&
      patient.age >= r.minAgeYears && 
      patient.age <= r.maxAgeYears
    );

    if (exactMatch) return exactMatch;

    // Si no hay coincidencia exacta (ej. faltan reglas demográficas), retorna la primera genérica o null
    return ranges.find(r => r.gender === 'Ambos') || ranges[0] || null;
  }
}
