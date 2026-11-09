/**
 * AbregoTech Solutions S.A. - LIS-Core PRO
 * Middleware de Seguridad de Licenciamiento y Entitlements para Backend Express
 *
 * Valida de forma estricta en el servidor:
 * 1. Existencia y vigencia de licencia por Sede.
 * 2. Comportamiento Clínico Seguro ante vencimiento:
 *    - Periodo de gracia configurable (ej. 15 días) con operación normal y advertencia.
 *    - Posterior Modo Solo Lectura: permite consultas GET de pacientes, pánicos y resultados;
 *      bloquea mutaciones (POST, PUT, DELETE) con códigos específicos:
 *      LICENSE_NOT_ACTIVE, LICENSE_EXPIRED, LICENSE_SUSPENDED, USER_LIMIT_REACHED.
 * 3. Auditoría de bloqueos de seguridad.
 */

import { SystemModuleId, BranchLicense, LicenseAuditLog } from '../types/licensing';
import { evaluateLicenseStatus, recordLicenseAuditLog } from './licensingCatalog';

export interface LicenseGuardOptions {
  requiredSystem?: SystemModuleId;
  requiredSubmodule?: string;
  checkUserLimit?: boolean;
  currentUserCount?: number;
  licenseResolver?: (branchId: string, tenantId?: string) => BranchLicense | null | undefined;
}

export interface LicenseValidationResult {
  authorized: boolean;
  status: number;
  code?: 'LICENSE_NOT_ACTIVE' | 'LICENSE_EXPIRED' | 'LICENSE_SUSPENDED' | 'USER_LIMIT_REACHED' | 'SUBMODULE_NOT_CONTRACTED';
  message?: string;
  isReadOnly?: boolean;
}

/**
 * Función pura que evalúa el acceso de una petición HTTP en backend
 */
export function evaluateBackendAccess(
  method: string,
  branchLicense: BranchLicense | null | undefined,
  options: LicenseGuardOptions = {}
): LicenseValidationResult {
  const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase());
  const evaluation = evaluateLicenseStatus(branchLicense);

  // 1. Licencia Suspendida
  if (evaluation.status === 'suspendida') {
    if (isMutation) {
      return {
        authorized: false,
        status: 403,
        code: 'LICENSE_SUSPENDED',
        message: 'Licencia suspendida por AbregoTech Solutions. Modo Solo Lectura activo para seguridad del paciente.',
        isReadOnly: true
      };
    }
    // GET permitido para consulta de resultados y pánicos
    return { authorized: true, status: 200, isReadOnly: true };
  }

  // 2. Licencia Vencida (fuera del periodo de gracia)
  if (evaluation.status === 'vencida') {
    if (isMutation) {
      return {
        authorized: false,
        status: 403,
        code: 'LICENSE_EXPIRED',
        message: 'Licencia vencida y periodo de gracia expirado. Modo Solo Lectura activo: no se permite crear órdenes ni validar.',
        isReadOnly: true
      };
    }
    // GET permitido para consulta de resultados y pánicos
    return { authorized: true, status: 200, isReadOnly: true };
  }

  // 3. Validación de Sistema Contratado (ej. LIS, HIS, BANCO_SANGRE)
  if (options.requiredSystem) {
    if (!branchLicense || !branchLicense.enabledSystems || !branchLicense.enabledSystems[options.requiredSystem]) {
      return {
        authorized: false,
        status: 403,
        code: 'LICENSE_NOT_ACTIVE',
        message: `El sistema clínico "${options.requiredSystem}" no ha sido contratado para esta sede.`
      };
    }
  }

  // 4. Validación de Submódulo Contratado (ej. 'telemetria', 'urgencias_triage')
  if (options.requiredSubmodule) {
    if (
      !branchLicense ||
      !branchLicense.enabledSubmodules ||
      branchLicense.enabledSubmodules[options.requiredSubmodule] !== true
    ) {
      return {
        authorized: false,
        status: 403,
        code: 'SUBMODULE_NOT_CONTRACTED',
        message: `El submódulo "${options.requiredSubmodule}" no está incluido en la licencia contratada para esta sede.`
      };
    }
  }

  // 5. Control de Límite de Usuarios
  if (options.checkUserLimit && options.currentUserCount !== undefined && branchLicense) {
    const maxUsers = branchLicense.maxUsers ?? 50;
    if (options.currentUserCount >= maxUsers) {
      return {
        authorized: false,
        status: 403,
        code: 'USER_LIMIT_REACHED',
        message: `Límite de usuarios alcanzado (${options.currentUserCount}/${maxUsers}) para la sede contratada.`
      };
    }
  }

  return { authorized: true, status: 200, isReadOnly: evaluation.isReadOnly };
}

/**
 * Fábrica de middleware estándar de Express
 */
export function createLicenseMiddleware(options: LicenseGuardOptions) {
  return (req: any, res: any, next: any) => {
    // Extraer sede desde headers, auth o query
    const branchId =
      req.headers['x-branch-id'] ||
      req.headers['x-lis-branch'] ||
      req.query?.branchId ||
      req.user?.branchId ||
      'branch-via-espana';

    const tenantId =
      req.headers['x-tenant-id'] ||
      req.query?.tenantId ||
      req.user?.tenantId ||
      'lab-san-jose';

    let license: BranchLicense | null | undefined = null;
    if (options.licenseResolver) {
      license = options.licenseResolver(branchId, tenantId);
    } else if (req.branchLicense) {
      license = req.branchLicense;
    }

    const result = evaluateBackendAccess(req.method, license, options);

    if (!result.authorized) {
      // Registrar auditoría de intento bloqueado
      recordLicenseAuditLog({
        branchId: String(branchId),
        tenantId: String(tenantId),
        userId: req.user?.id || 'anonymous_api',
        userName: req.user?.name || 'API Client',
        action: 'api_access_blocked',
        details: `Acceso bloqueado en endpoint [${req.method}] ${req.path || req.originalUrl}: ${result.code} - ${result.message}`,
        ipAddress: req.ip || req.connection?.remoteAddress
      });

      return res.status(result.status).json({
        success: false,
        error: result.code,
        message: result.message,
        isReadOnly: result.isReadOnly || false,
        timestamp: new Date().toISOString()
      });
    }

    if (result.isReadOnly) {
      res.setHeader('X-LIS-License-Mode', 'READ_ONLY');
    }

    next();
  };
}
