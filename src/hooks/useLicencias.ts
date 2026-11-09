/**
 * Hook Central de Licenciamiento y Entitlements por Sede
 * LIS-Core PRO - AbregoTech Solutions S.A.
 * 
 * Fuente única de verdad para el control de módulos contratados,
 * vigencias, modo solo lectura asistencial y límites de usuarios.
 */

import { useMemo, useCallback } from 'react';
import { useLisStore } from '../store/useLisStore';
import {
  SystemModuleId,
  BranchLicense,
  LicenseEvaluationResult,
  LicenseStatus
} from '../types/licensing';
import {
  evaluateLicenseStatus,
  createDefaultFullSuiteLicense,
  canAccessSystemWithLicense,
  canAccessSubmoduleWithLicense,
  canAccessTabWithLicense
} from '../services/licensingCatalog';
import { MOCK_USERS } from '../data/mockData';

export interface UseLicenciasReturn {
  // Entitlements y Permisos de Módulos
  can: (systemId: SystemModuleId, submoduleId?: string) => boolean;
  canAccessTab: (tabId: string) => boolean;
  canAccessSystem: (systemId: SystemModuleId) => boolean;

  // Estado de la Licencia de la Sede Activa
  license: BranchLicense;
  licenseEvaluation: LicenseEvaluationResult;
  status: LicenseStatus;

  // Banderas Clínicas y Asistenciales
  isEffectiveActive: boolean;
  isReadOnly: boolean;
  isGracePeriod: boolean;
  daysRemaining: number | null;
  canCreateOrders: boolean;
  canValidateResults: boolean;
  canViewResults: boolean;
  canViewPanics: boolean;

  // Control de Límite de Usuarios
  maxUsers: number;
  currentUsersCount: number;
  isUserLimitReached: boolean;
  canCreateUser: boolean;

  // Metadatos de la Sede y Plan
  currentBranchId: string;
  currentBranchName: string;
  currentTenantId: string;
  currentTenantName: string;
  planPreset: string;
}

export function useLicencias(): UseLicenciasReturn {
  const currentBranch = useLisStore((state) => state.currentBranch);
  const currentTenant = useLisStore((state) => state.currentTenant);

  // Obtener o resolver la licencia de la sede activa
  const license: BranchLicense = useMemo(() => {
    const tenantId = currentTenant?.id || 'lab-san-jose';
    const branchId = currentBranch?.id || 'branch-via-espana';

    // 1. Intentar leer licencia directa de la sede en memoria
    if (currentBranch?.license) {
      return currentBranch.license;
    }

    // 2. Intentar buscar la sede dentro del tenant actual
    if (currentTenant?.branches) {
      const match = currentTenant.branches.find((b) => b.id === branchId);
      if (match?.license) {
        return match.license;
      }
    }

    // 3. Fallback: Suite Completa Indefinida para no romper producción
    return createDefaultFullSuiteLicense(tenantId, branchId);
  }, [currentBranch, currentTenant]);

  // Evaluación de vigencia y modo solo lectura
  const licenseEvaluation: LicenseEvaluationResult = useMemo(() => {
    return evaluateLicenseStatus(license);
  }, [license]);

  // Verificar si un sistema y submódulo específico están contratados y habilitados
  const can = useCallback(
    (systemId: SystemModuleId, submoduleId?: string): boolean => {
      return canAccessSubmoduleWithLicense(license, systemId, submoduleId);
    },
    [license]
  );

  // Verificar si se puede acceder a un sistema completo
  const canAccessSystem = useCallback(
    (systemId: SystemModuleId): boolean => {
      return canAccessSystemWithLicense(license, systemId);
    },
    [license]
  );

  // Verificar si una pestaña de la navegación está contratada para la sede
  const canAccessTab = useCallback(
    (tabId: string): boolean => {
      return canAccessTabWithLicense(license, tabId);
    },
    [license]
  );

  // Conteo de usuarios asignados a la sede / tenant
  const { currentUsersCount, maxUsers, isUserLimitReached, canCreateUser } = useMemo(() => {
    let allUsers = MOCK_USERS;
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('lis_users');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            allUsers = parsed;
          }
        }
      } catch (e) {
        console.error('Error cargando usuarios para límite de licencia:', e);
      }
    }

    const tenantId = currentTenant?.id || 'lab-san-jose';
    const branchId = currentBranch?.id || 'branch-via-espana';

    // Filtrar usuarios activos de este tenant y sede (o del tenant si no tienen sede fijada)
    const activeUsersInBranch = allUsers.filter((u) => {
      if (u.tenantId !== tenantId) return false;
      if (u.branchId && u.branchId !== branchId) return false;
      return true;
    });

    const userCount = activeUsersInBranch.length;
    const limit = license.maxUsers || 999;
    const limitReached = userCount >= limit;

    return {
      currentUsersCount: userCount,
      maxUsers: limit,
      isUserLimitReached: limitReached,
      canCreateUser: !limitReached && license.status !== 'suspendida'
    };
  }, [currentBranch, currentTenant, license]);

  return {
    can,
    canAccessTab,
    canAccessSystem,
    license,
    licenseEvaluation,
    status: license.status,
    isEffectiveActive: licenseEvaluation.isEffectiveActive,
    isReadOnly: licenseEvaluation.isReadOnly,
    isGracePeriod: licenseEvaluation.isGracePeriod,
    daysRemaining: licenseEvaluation.daysRemaining,
    canCreateOrders: licenseEvaluation.canCreateOrders,
    canValidateResults: licenseEvaluation.canValidateResults,
    canViewResults: licenseEvaluation.canViewResults,
    canViewPanics: licenseEvaluation.canViewPanics,
    maxUsers,
    currentUsersCount,
    isUserLimitReached,
    canCreateUser,
    currentBranchId: currentBranch?.id || 'branch-via-espana',
    currentBranchName: currentBranch?.name || 'Sede Principal',
    currentTenantId: currentTenant?.id || 'lab-san-jose',
    currentTenantName: currentTenant?.name || 'Laboratorio Clínico San José',
    planPreset: license.planPreset
  };
}
