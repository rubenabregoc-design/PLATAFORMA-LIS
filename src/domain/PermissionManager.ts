import { Role, Permission } from '../types';

/**
 * Senior Domain Service: PermissionManager
 * Centralized RBAC Matrix for PLATAFORMA-LIS
 */
export class PermissionManager {
  private static readonly ROLE_PERMISSIONS: Record<Role, Permission[]> = {
    owner: [
      'RESULT_ENTRY', 'RESULT_VALIDATE_TECH', 'RESULT_VALIDATE_MED', 'RESULT_UNVALIDATE',
      'RESULT_HISTORY_VIEW', 'ORDER_CREATE', 'ORDER_CANCEL', 'CATALOG_MANAGE',
      'INVENTORY_MANAGE', 'USER_MANAGE', 'FINANCIAL_VIEW', 'AUDIT_LOG_VIEW'
    ],
    lab_chief: [
      'RESULT_ENTRY', 'RESULT_VALIDATE_TECH', 'RESULT_VALIDATE_MED', 'RESULT_UNVALIDATE',
      'RESULT_HISTORY_VIEW', 'ORDER_CREATE', 'CATALOG_MANAGE', 'INVENTORY_MANAGE',
      'AUDIT_LOG_VIEW'
    ],
    tech_med: [
      'RESULT_ENTRY', 'RESULT_VALIDATE_TECH', 'RESULT_HISTORY_VIEW', 'ORDER_CREATE',
      'INVENTORY_MANAGE'
    ],
    lab_tech: [
      'RESULT_ENTRY', 'ORDER_CREATE', 'INVENTORY_MANAGE'
    ],
    receptionist: [
      'ORDER_CREATE', 'ORDER_CANCEL', 'FINANCIAL_VIEW'
    ],
    ext_doctor: [
      'RESULT_HISTORY_VIEW'
    ],
    patient: [
      'RESULT_HISTORY_VIEW'
    ],
    abregotech_admin: [
      'RESULT_ENTRY', 'RESULT_VALIDATE_TECH', 'RESULT_VALIDATE_MED', 'RESULT_UNVALIDATE',
      'RESULT_HISTORY_VIEW', 'ORDER_CREATE', 'ORDER_CANCEL', 'CATALOG_MANAGE',
      'INVENTORY_MANAGE', 'USER_MANAGE', 'FINANCIAL_VIEW', 'BRIDGE_CONTROL', 'AUDIT_LOG_VIEW'
    ]
  };

  /**
   * Checks if a specific role has permission to perform an action.
   */
  static hasPermission(role: Role, permission: Permission): boolean {
    const permissions = this.ROLE_PERMISSIONS[role] || [];
    return permissions.includes(permission);
  }

  /**
   * Gets all permissions for a specific role (useful for UI rendering).
   */
  static getPermissionsForRole(role: Role): Permission[] {
    return this.ROLE_PERMISSIONS[role] || [];
  }
}
