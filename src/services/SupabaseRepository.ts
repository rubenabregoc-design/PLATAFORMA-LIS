/**
 * @deprecated Use SupabaseService.ts instead.
 * Wrapper legacy — mantiene compatibilidad con useLisStore.ts.
 */
import SupabaseService from './SupabaseService';
import type { DbTestResultUpdate } from '../database.types';

export class SupabaseRepository {
  /** @deprecated Use SupabaseService.patients.getAll() */
  static async getPatients() {
    return SupabaseService.patients.getAll();
  }

  /** @deprecated Use SupabaseService.orders.getAll() */
  static async getOrdersWithDetails() {
    return SupabaseService.orders.getAll();
  }

  /** @deprecated Use SupabaseService.results.update() */
  static async updateTestResult(
    resultId: string,
    updates: {
      value?: string;
      numericValue?: number;
      flag?: any;
      interpretation?: string;
      status?: DbTestResultUpdate['status'];
      version?: number;
    },
    auditLog: {
      action: string;
      author: string;
      previousValue?: string;
      newValue?: string;
      reason?: string;
    }
  ) {
    return SupabaseService.results.update(
      resultId,
      {
        value: updates.value,
        numeric_value: updates.numericValue,
        interpretation: updates.interpretation,
        status: updates.status,
      },
      auditLog.reason
    );
  }

  /** @deprecated Use SupabaseService.results.subscribeToAll() */
  static subscribeToResults(callback: (payload: any) => void) {
    return SupabaseService.results.subscribeToAll(callback);
  }
}
