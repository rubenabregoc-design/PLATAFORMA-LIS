import { Role, Permission, User, Order, LaboratoryPolicy } from '../types';

/**
 * Senior Domain Service: PermissionManager
 * Centralized RBAC Matrix for PLATAFORMA-LIS conforming to Panama LIS/HIS Specification
 */
export class PermissionManager {
  private static readonly ROLE_PERMISSIONS: Record<Role, Permission[]> = {
    // DU - Dueño (owner): Acceso total, sin restricciones
    owner: [
      'RESULT_ENTRY', 'RESULT_VALIDATE_TECH', 'RESULT_VALIDATE_MED', 'RESULT_UNVALIDATE',
      'RESULT_RELEASE', 'RESULT_HISTORY_VIEW', 'ORDER_CREATE', 'ORDER_CANCEL',
      'CATALOG_MANAGE', 'INVENTORY_MANAGE', 'USER_MANAGE', 'FINANCIAL_VIEW', 'AUDIT_LOG_VIEW'
    ],

    // AD - Administrador del sistema (abregotech_admin): Acceso total a nivel de plataforma
    abregotech_admin: [
      'RESULT_ENTRY', 'RESULT_VALIDATE_TECH', 'RESULT_VALIDATE_MED', 'RESULT_UNVALIDATE',
      'RESULT_RELEASE', 'RESULT_HISTORY_VIEW', 'ORDER_CREATE', 'ORDER_CANCEL',
      'CATALOG_MANAGE', 'INVENTORY_MANAGE', 'USER_MANAGE', 'FINANCIAL_VIEW',
      'BRIDGE_CONTROL', 'AUDIT_LOG_VIEW'
    ],

    // JL - Jefe de Laboratorio (lab_chief): Supervisa todo el proceso clínico, sin restricción de propiedad; crea usuarios
    lab_chief: [
      'RESULT_ENTRY', 'RESULT_VALIDATE_TECH', 'RESULT_VALIDATE_MED', 'RESULT_UNVALIDATE',
      'RESULT_RELEASE', 'RESULT_HISTORY_VIEW', 'ORDER_CREATE', 'CATALOG_MANAGE',
      'INVENTORY_MANAGE', 'USER_MANAGE', 'AUDIT_LOG_VIEW'
    ],

    // TM - Tecnólogo Médico (tech_med): Procesa en equipo, genera resultado, valida/desvalida sus propias órdenes
    tech_med: [
      'RESULT_ENTRY', 'RESULT_VALIDATE_TECH', 'RESULT_UNVALIDATE', 'RESULT_HISTORY_VIEW'
    ],

    // TC - Técnico / Auxiliar de Laboratorio (lab_tech): Toma muestra, registra datos, traslada, crea órdenes
    lab_tech: [
      'ORDER_CREATE'
    ],

    // RC - Recepcionista (receptionist): Registro administrativo, citas, cobro, órdenes
    receptionist: [
      'ORDER_CREATE', 'ORDER_CANCEL', 'FINANCIAL_VIEW'
    ],

    // ME - Médico Externo (ext_doctor): Origina orden desde su portal, consulta resultados liberados
    ext_doctor: [
      'ORDER_CREATE', 'RESULT_HISTORY_VIEW'
    ],

    // PA - Paciente (patient): Solo ve su propia información liberada
    patient: [
      'RESULT_HISTORY_VIEW'
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

  /**
   * Regla de propiedad para el TM:
   * - Puede ver las órdenes y resultados de cualquier tecnólogo médico, no solo los suyos.
   * - Puede validar únicamente las órdenes que le fueron asignadas a él (o no asignadas).
   * - El JL, Dueño y Admin no tienen restricción de propiedad.
   */
  static canValidateOrder(user: User, order: Order, _policy?: LaboratoryPolicy): boolean {
    if (!user) return false;
    // JL, Dueño, Admin tienen autoridad de supervisión total sin restricción de propiedad
    if (user.role === 'lab_chief' || user.role === 'owner' || user.role === 'abregotech_admin') {
      return true;
    }
    // TM solo puede validar órdenes asignadas a él (o sin asignar donde toma posesión)
    if (user.role === 'tech_med') {
      if (!order.assignedTechMedId) return true;
      return order.assignedTechMedId === user.id || order.assignedTechMedId === user.username;
    }
    return false;
  }

  /**
   * Regla de desvalidación:
   * - Validado → Pendiente (desvalidar): el TM dueño de la orden, o el JL (sin restricción de propiedad).
   * - Un resultado ya validado que pertenece a otro TM queda protegido: nadie más que su dueño (o el JL) puede desvalidarlo.
   */
  static canUnvalidateOrder(user: User, order: Order): boolean {
    if (!user) return false;
    if (user.role === 'lab_chief' || user.role === 'owner' || user.role === 'abregotech_admin') {
      return true;
    }
    if (user.role === 'tech_med') {
      if (!order.assignedTechMedId) return true;
      return order.assignedTechMedId === user.id || order.assignedTechMedId === user.username;
    }
    return false;
  }

  /**
   * Regla de liberación:
   * - Validado → Liberado: el JL siempre puede. El TM puede si la política del laboratorio se lo permite.
   */
  static canReleaseOrder(user: User, order: Order, policy?: LaboratoryPolicy): boolean {
    if (!user) return false;
    if (user.role === 'lab_chief' || user.role === 'owner' || user.role === 'abregotech_admin') {
      return true;
    }
    if (user.role === 'tech_med') {
      const allowedByPolicy = policy?.canTmRelease ?? false;
      const isOwner = !order.assignedTechMedId || order.assignedTechMedId === user.id || order.assignedTechMedId === user.username;
      return allowedByPolicy && isOwner;
    }
    return false;
  }

  /**
   * Regla de impresión:
   * - RC, TC y TM pueden imprimir el resultado; ME y PA solo consultan (no imprimen desde el sistema interno).
   */
  static canPrintResult(role: Role): boolean {
    return ['owner', 'abregotech_admin', 'lab_chief', 'tech_med', 'lab_tech', 'receptionist'].includes(role);
  }
}
