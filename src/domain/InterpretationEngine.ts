import { TestResult, Patient } from '../types';

/**
 * Domain Service: InterpretationEngine
 * Generates automated clinical interpretations based on rules.
 */
export class InterpretationEngine {
  static getInterpretation(result: TestResult, patient: Patient): string {
    const name = result.parameterName.toLowerCase();
    const val = result.numericValue || 0;
    const gender = patient.gender;

    // 1. Glucose Rules
    if (name.includes('glucosa')) {
      if (val >= 126) return 'Nivel compatible con criterios diagnósticos de Diabetes Mellitus (ADA). Se sugiere HbA1c.';
      if (val >= 100) return 'Prediabetes: Niveles de glucosa en ayunas alterados.';
      if (val < 70) return 'Hipoglucemia: Se requiere correlación clínica inmediata.';
    }

    // 2. WBC Rules
    if (name.includes('leucocitos') || name.includes('wbc')) {
      if (val > 11) return 'Leucocitosis: Posible proceso infeccioso o inflamatorio agudo.';
      if (val < 4) return 'Leucopenia: Se sugiere revisión de frotis periférico.';
    }

    // 3. Creatinine (Renal function)
    if (name.includes('creatinina')) {
      const threshold = gender === 'M' ? 1.2 : 1.0;
      if (val > threshold) return 'Elevación de creatinina: Sugiere disminución de la Tasa de Filtración Glomerular.';
    }

    // 4. Lipid Profile
    if (name.includes('colesterol total')) {
      if (val >= 240) return 'Hipercolesterolemia Severa: Alto riesgo cardiovascular.';
      if (val >= 200) return 'Hipercolesterolemia Moderada: Se sugiere control dietético.';
    }

    // Default: Empty or standard out of range
    if (result.flag?.includes('CRITICO')) return '¡VALOR CRÍTICO! Notificado al médico tratante según protocolo ISO 15189.';

    return result.interpretation || '';
  }
}
