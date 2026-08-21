import { supabase } from '../lib/supabaseClient';
import { Patient, Order, TestResult, Analyzer } from '../types';

/**
 * SERVICIO DE DATOS CLÍNICOS REALES (Supabase PostgreSQL)
 * Reemplaza la persistencia en memoria/mock por base de datos estricta.
 */
export const LISDataService = {
  // --- PACIENTES ---
  async getPatients() {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error obteniendo pacientes:', error.message);
      return [];
    }
    return data;
  },

  async createPatient(patient: Omit<Patient, 'id'>) {
    const { data, error } = await supabase
      .from('patients')
      .insert([{
        national_id: patient.nationalId,
        first_name: patient.firstName,
        last_name: patient.lastName,
        gender: patient.gender,
        birth_date: patient.dob,
        phone: patient.phone,
        email: patient.email
      }])
      .select()
      .single();

    if (error) throw new Error(`Error creando paciente: ${error.message}`);
    return data;
  },

  // --- ORDENES ---
  async getOrders() {
    const { data, error } = await supabase
      .from('orders')
      .select('*, patients(*)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error obteniendo órdenes:', error.message);
      return [];
    }
    return data;
  },

  async createOrder(orderNumber: string, patientId: string, sampleBarcode: string) {
    const { data, error } = await supabase
      .from('orders')
      .insert([{
        order_number: orderNumber,
        patient_id: patientId,
        sample_barcode: sampleBarcode,
        status: 'INGRESADA'
      }])
      .select()
      .single();

    if (error) throw new Error(`Error creando orden: ${error.message}`);
    return data;
  },

  // --- RESULTADOS DE EXÁMENES ---
  async saveTestResult(result: {
    orderId: string;
    analyzerId?: string;
    parameterCode: string;
    parameterName: string;
    rawValue: string;
    numericValue?: number;
    unit?: string;
    referenceRange?: string;
    flag?: string;
  }) {
    const { data, error } = await supabase
      .from('test_results')
      .insert([{
        order_id: result.orderId,
        analyzer_id: result.analyzerId,
        parameter_code: result.parameterCode,
        parameter_name: result.parameterName,
        raw_value: result.rawValue,
        numeric_value: result.numericValue,
        unit: result.unit,
        reference_range: result.referenceRange,
        flag: result.flag || 'NORMAL',
        status: 'PENDIENTE_VALIDACION'
      }])
      .select()
      .single();

    if (error) throw new Error(`Error guardando resultado clínico: ${error.message}`);
    return data;
  },

  // --- SUSCRIPCIÓN EN TIEMPO REAL (WEBSOCKETS) ---
  subscribeToLiveResults(onNewResult: (result: any) => void) {
    return supabase
      .channel('realtime_results')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'test_results' },
        (payload) => {
          console.log('⚡ Nuevo resultado recibido en tiempo real:', payload.new);
          onNewResult(payload.new);
        }
      )
      .subscribe();
  }
};
