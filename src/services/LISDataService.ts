/**
 * @deprecated Use SupabaseService.ts instead.
 * Este archivo se mantiene por compatibilidad con imports legacy.
 * Todos los métodos ahora delegan a SupabaseService.
 */
import SupabaseService from './SupabaseService';
import type { DbPatientInsert } from '../database.types';

export const LISDataService = {
  /** @deprecated Use SupabaseService.patients.getAll() */
  async getPatients() {
    return SupabaseService.patients.getAll();
  },

  /** @deprecated Use SupabaseService.patients.create() */
  async createPatient(patient: {
    nationalId: string;
    idType: string;
    firstName: string;
    lastName: string;
    gender: 'M' | 'F';
    dob: string;
    phone?: string;
    email?: string;
    address?: string;
    data_consent?: boolean;
  }) {
    const insert: any = {
      national_id: patient.nationalId,
      id_type: patient.idType as DbPatientInsert['id_type'],
      first_name: patient.firstName,
      last_name: patient.lastName,
      gender: patient.gender,
      dob: patient.dob,
      phone: patient.phone ?? null,
      email: patient.email ?? null,
      address: patient.address ?? null,
      data_consent: patient.data_consent ?? false,
      consent_date: null,
    };
    return SupabaseService.patients.create(insert);
  },

  /** @deprecated Use SupabaseService.orders.getAll() */
  async getOrders() {
    return SupabaseService.orders.getAll();
  },

  /** @deprecated Use SupabaseService.orders.create() */
  async createOrder(orderNumber: string, patientId: string, branchId: string) {
    return SupabaseService.orders.create({
      order_number: orderNumber,
      patient_id: patientId,
      branch_id: branchId,
      priority: 'RUTINA',
      status: 'REGISTRADA',
      payment_status: 'PENDIENTE',
    });
  },

  /** @deprecated Use SupabaseService.results.create() */
  async saveTestResult(result: {
    orderId: string;
    analyzerId?: string;
    testCode: string;
    parameterName: string;
    value?: string;
    numericValue?: number;
    unit?: string;
  }) {
    return SupabaseService.results.create({
      order_id: result.orderId,
      analyzer_id: result.analyzerId ?? null,
      test_code: result.testCode,
      parameter_name: result.parameterName,
      value: result.value ?? null,
      numeric_value: result.numericValue ?? null,
      unit: result.unit ?? null,
      status: 'PENDIENTE',
      analyzer_name: null,
      interpretation: null,
    });
  },

  /** @deprecated Use SupabaseService.results.subscribeToAll() */
  subscribeToLiveResults(onNewResult: (result: any) => void) {
    return SupabaseService.results.subscribeToAll(onNewResult);
  },
};
