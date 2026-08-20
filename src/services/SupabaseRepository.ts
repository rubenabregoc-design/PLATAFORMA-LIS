import { supabase } from '../lib/supabaseClient';
import { Order, TestResult, Patient } from '../types';

/**
 * Senior Repository Pattern: SupabaseRepository
 * Abstracts Supabase complexity from the rest of the application.
 */
export class SupabaseRepository {

  // --- Patients ---
  static async getPatients() {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .order('last_name', { ascending: true });

    if (error) throw error;
    return data;
  }

  // --- Orders ---
  static async getOrdersWithDetails() {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        patients (*),
        test_results (*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  // --- Results & Audit ---
  static async updateTestResult(resultId: string, updates: Partial<TestResult>, auditLog: any) {
    // 1. Transactional update: Result + Audit Log
    const { data: result, error: resError } = await supabase
      .from('test_results')
      .update({
        value: updates.value,
        numeric_value: updates.numericValue,
        flag: updates.flag,
        interpretation: updates.interpretation,
        status: updates.status,
        version: updates.version,
        updated_at: new Date().toISOString()
      })
      .eq('id', resultId)
      .select()
      .single();

    if (resError) throw resError;

    // 2. Insert Audit Entry
    const { error: auditError } = await supabase
      .from('result_audit_logs')
      .insert({
        result_id: resultId,
        action: auditLog.action,
        author: auditLog.author,
        previous_value: auditLog.previousValue,
        new_value: auditLog.newValue,
        reason: auditLog.reason
      });

    if (auditError) console.error('[Supabase] Failed to write audit log:', auditError);

    return result;
  }

  /**
   * Realtime Subscription Helper
   */
  static subscribeToResults(callback: (payload: any) => void) {
    return supabase
      .channel('schema-db-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'test_results' },
        callback
      )
      .subscribe();
  }
}
