import { describe, it, expect } from 'vitest';
import { ResultEvaluator } from './ResultEvaluator';
import { TestResult, Patient } from '../types';

describe('ResultEvaluator Unit Tests (ISO 15189 Logic)', () => {
  const mockPatient: Patient = {
    id: 'p1',
    tenantId: 't1',
    nationalId: '8-812',
    idType: 'CEDULA',
    firstName: 'Test',
    lastName: 'Patient',
    dob: '1990-01-01', // 36 years approx
    gender: 'M',
    phone: '',
    email: '',
    address: '',
    dataConsentLey81: true
  };

  it('should flag a normal glucose value correctly', () => {
    const result: TestResult = {
      id: 'r1',
      tenantId: 't1',
      orderId: 'o1',
      testId: 't1',
      parameterId: 'p1',
      parameterName: 'Glucosa en Ayunas',
      unit: 'mg/dL',
      value: '85',
      refRangeText: '70 - 99',
      source: 'MANUAL',
      status: 'INGRESADO',
      version: 1,
      history: []
    };

    const evaluation = ResultEvaluator.evaluate(result, mockPatient);
    expect(evaluation.flag).toBe('NORMAL');
    expect(evaluation.isOutOfRange).toBe(false);
  });

  it('should flag high glucose as ALTO', () => {
    const result: TestResult = {
      id: 'r2',
      parameterName: 'Glucosa',
      value: '110',
      refRangeText: '70 - 99',
      unit: 'mg/dL',
    } as TestResult;

    const evaluation = ResultEvaluator.evaluate(result, mockPatient);
    expect(evaluation.flag).toBe('ALTO');
    expect(evaluation.severity).toBe('HIGH');
  });

  it('should detect critical pánico (HH) correctly', () => {
    const result: TestResult = {
      id: 'r3',
      parameterName: 'Glucosa',
      value: '450',
      refRangeText: '70 - 99',
      unit: 'mg/dL',
    } as TestResult;

    // Based on hardcoded fallback in evaluator for 'glucosa': criticalMax = 400
    const evaluation = ResultEvaluator.evaluate(result, mockPatient);
    expect(evaluation.flag).toBe('CRITICO_ALTO');
    expect(evaluation.isCritical).toBe(true);
  });

  it('should handle qualitative abnormal values', () => {
    const result: TestResult = {
      id: 'r4',
      parameterName: 'HIV',
      value: 'POSITIVO',
      refRangeText: 'NEGATIVO',
      unit: 'N/A',
    } as TestResult;

    const evaluation = ResultEvaluator.evaluate(result, mockPatient);
    expect(evaluation.isOutOfRange).toBe(true);
    expect(evaluation.flag).toBe('ALTO');
  });
});
