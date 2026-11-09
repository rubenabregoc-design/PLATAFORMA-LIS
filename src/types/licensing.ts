/**
 * LIS-Core PRO - Sistema de Licenciamiento y Entitlements por Módulos
 * AbregoTech Solutions S.A.
 * Estándar para laboratorios clínicos y centros hospitalarios
 */

export type SystemModuleId = 'LIS' | 'HIS' | 'BANCO_SANGRE' | 'GESTION_CALIDAD' | 'OTROS';

export type LicenseStatus = 'activa' | 'por_vencer' | 'en_gracia' | 'vencida' | 'suspendida';

export type PlanPresetId = 
  | 'SOLO_LIS' 
  | 'SOLO_HIS' 
  | 'SOLO_BANCO' 
  | 'LIS_HIS' 
  | 'SUITE_COMPLETA' 
  | 'PERSONALIZADO';

export interface SubmoduleDefinition {
  id: string;
  name: string;
  description: string;
  systemId: SystemModuleId;
  relatedTabs: string[];
  requiredSubmodules?: string[];
  isCore?: boolean;
}

export interface SystemModuleDefinition {
  id: SystemModuleId;
  name: string;
  tagline: string;
  description: string;
  iconName: string;
  color: string;
  borderColor: string;
  bgGlow: string;
  submodules: SubmoduleDefinition[];
}

export interface BranchLicense {
  id: string;
  tenantId: string;
  branchId: string;
  planPreset: PlanPresetId;
  status: LicenseStatus;
  startDate: string; // ISO date string (YYYY-MM-DD)
  expirationDate: string | null; // null = Licencia continua / perpetua
  gracePeriodDays: number; // Por defecto 15 días post-vencimiento
  maxUsers: number; // Límite concurrente o nominal de usuarios
  enabledSystems: Record<SystemModuleId, boolean>;
  enabledSubmodules: Record<string, boolean>;
  notes?: string;
  lastUpdated: string;
  updatedBy?: string;
}

export interface LicenseAuditLog {
  id: string;
  timestamp: string;
  actorUserId: string;
  actorUserName: string;
  tenantId: string;
  branchId: string;
  branchName: string;
  action: 
    | 'CREACION' 
    | 'CAMBIO_PLAN' 
    | 'ACTIVACION_MODULO' 
    | 'DESACTIVACION_MODULO' 
    | 'RENOVACION' 
    | 'SUSPENSION' 
    | 'REACTIVACION' 
    | 'CAMBIO_LIMITE_USUARIOS';
  details: string;
  previousValue?: unknown;
  newValue?: unknown;
}

export interface LicenseEvaluationResult {
  status: LicenseStatus;
  isEffectiveActive: boolean;
  isReadOnly: boolean;
  daysRemaining: number | null;
  isGracePeriod: boolean;
  canCreateOrders: boolean;
  canValidateResults: boolean;
  canViewResults: boolean;
  canViewPanics: boolean;
  statusMessage: string;
  statusBadge: string;
  statusColor: string;
}
