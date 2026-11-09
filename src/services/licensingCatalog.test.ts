import { describe, it, expect } from 'vitest';
import {
  SYSTEM_MODULES_CATALOG,
  getPlanPresetConfig,
  evaluateLicenseStatus,
  validateModuleDependencies,
  ensureBranchesHaveLicenses,
  createDefaultFullSuiteLicense,
  canAccessSystemWithLicense,
  canAccessSubmoduleWithLicense,
  canAccessTabWithLicense
} from './licensingCatalog';
import { BranchLicense } from '../types/licensing';
import { evaluateBackendAccess } from './backendLicenseMiddleware';

describe('Sistema de Licenciamiento y Entitlements por Módulo - Fase 1', () => {
  it('debe contener los 5 sistemas clínicos principales en el catálogo', () => {
    const systemIds = SYSTEM_MODULES_CATALOG.map(s => s.id);
    expect(systemIds).toContain('LIS');
    expect(systemIds).toContain('HIS');
    expect(systemIds).toContain('BANCO_SANGRE');
    expect(systemIds).toContain('GESTION_CALIDAD');
    expect(systemIds).toContain('OTROS');
  });

  describe('Presets Comerciales de Licenciamiento', () => {
    it('SOLO_LIS debe habilitar únicamente LIS y Calidad, bloqueando HIS y Banco de Sangre', () => {
      const { enabledSystems, enabledSubmodules } = getPlanPresetConfig('SOLO_LIS');
      expect(enabledSystems.LIS).toBe(true);
      expect(enabledSystems.HIS).toBe(false);
      expect(enabledSystems.BANCO_SANGRE).toBe(false);
      expect(enabledSubmodules['admision_pos']).toBe(true);
      expect(enabledSubmodules['validacion']).toBe(true);
      expect(enabledSubmodules['urgencias_triage']).toBe(false);
      expect(enabledSubmodules['donantes']).toBe(false);
    });

    it('SOLO_HIS debe habilitar únicamente HIS, bloqueando LIS y Banco de Sangre', () => {
      const { enabledSystems, enabledSubmodules } = getPlanPresetConfig('SOLO_HIS');
      expect(enabledSystems.HIS).toBe(true);
      expect(enabledSystems.LIS).toBe(false);
      expect(enabledSystems.BANCO_SANGRE).toBe(false);
      expect(enabledSubmodules['command_his']).toBe(true);
      expect(enabledSubmodules['urgencias_triage']).toBe(true);
      expect(enabledSubmodules['admision_pos']).toBe(false);
    });

    it('SUITE_COMPLETA debe habilitar todos los sistemas y submódulos', () => {
      const { enabledSystems, enabledSubmodules } = getPlanPresetConfig('SUITE_COMPLETA');
      expect(enabledSystems.LIS).toBe(true);
      expect(enabledSystems.HIS).toBe(true);
      expect(enabledSystems.BANCO_SANGRE).toBe(true);
      expect(enabledSystems.GESTION_CALIDAD).toBe(true);
      expect(enabledSystems.OTROS).toBe(true);
      expect(Object.values(enabledSubmodules).every(val => val === true)).toBe(true);
    });
  });

  describe('Evaluación Clínica de Estados de Licencia y Modo Solo Lectura', () => {
    it('sede sin licencia previa debe recibir fallback activo sin vencimiento para proteger producción', () => {
      const evaluation = evaluateLicenseStatus(null);
      expect(evaluation.status).toBe('activa');
      expect(evaluation.isEffectiveActive).toBe(true);
      expect(evaluation.isReadOnly).toBe(false);
      expect(evaluation.canCreateOrders).toBe(true);
      expect(evaluation.canValidateResults).toBe(true);
      expect(evaluation.daysRemaining).toBeNull();
    });

    it('debe detectar licencia por vencer cuando faltan 30 días o menos', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 15);

      const license: BranchLicense = {
        ...createDefaultFullSuiteLicense('tenant-test', 'branch-test'),
        expirationDate: futureDate.toISOString().split('T')[0]
      };

      const evaluation = evaluateLicenseStatus(license);
      expect(evaluation.status).toBe('por_vencer');
      expect(evaluation.isEffectiveActive).toBe(true);
      expect(evaluation.isReadOnly).toBe(false);
      expect(evaluation.daysRemaining).toBeLessThanOrEqual(30);
      expect(evaluation.daysRemaining).toBeGreaterThan(0);
    });

    it('periodo de gracia: debe permitir operar con normalidad cuando la licencia expiró hace menos de 15 días', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 5); // Expiró hace 5 días

      const license: BranchLicense = {
        ...createDefaultFullSuiteLicense('tenant-test', 'branch-test'),
        expirationDate: pastDate.toISOString().split('T')[0],
        gracePeriodDays: 15
      };

      const evaluation = evaluateLicenseStatus(license);
      expect(evaluation.status).toBe('en_gracia');
      expect(evaluation.isGracePeriod).toBe(true);
      expect(evaluation.isEffectiveActive).toBe(true);
      expect(evaluation.isReadOnly).toBe(false);
      expect(evaluation.canCreateOrders).toBe(true);
      expect(evaluation.canValidateResults).toBe(true);
    });

    it('vencida fuera de gracia: debe activar MODO SOLO LECTURA sin bloquear resultados ni pánicos', () => {
      const longExpiredDate = new Date();
      longExpiredDate.setDate(longExpiredDate.getDate() - 25); // Expiró hace 25 días (> 15 días de gracia)

      const license: BranchLicense = {
        ...createDefaultFullSuiteLicense('tenant-test', 'branch-test'),
        expirationDate: longExpiredDate.toISOString().split('T')[0],
        gracePeriodDays: 15
      };

      const evaluation = evaluateLicenseStatus(license);
      expect(evaluation.status).toBe('vencida');
      expect(evaluation.isReadOnly).toBe(true);
      expect(evaluation.isEffectiveActive).toBe(false);
      expect(evaluation.canCreateOrders).toBe(false);    // Bloqueado crear órdenes
      expect(evaluation.canValidateResults).toBe(false); // Bloqueado validar
      expect(evaluation.canViewResults).toBe(true);      // PERMITIDO ver histórico
      expect(evaluation.canViewPanics).toBe(true);       // PERMITIDO ver pánicos vitales
    });

    it('suspendida administrativamente: activa modo solo lectura de inmediato', () => {
      const license: BranchLicense = {
        ...createDefaultFullSuiteLicense('tenant-test', 'branch-test'),
        status: 'suspendida'
      };

      const evaluation = evaluateLicenseStatus(license);
      expect(evaluation.status).toBe('suspendida');
      expect(evaluation.isReadOnly).toBe(true);
      expect(evaluation.canCreateOrders).toBe(false);
      expect(evaluation.canViewResults).toBe(true);
      expect(evaluation.canViewPanics).toBe(true);
    });
  });

  describe('Reglas de Dependencia Inter-módulo', () => {
    it('debe alertar si se activa un submódulo sin sus dependencias requeridas', () => {
      const { enabledSystems, enabledSubmodules } = getPlanPresetConfig('SOLO_BANCO');
      // Forzar Tamizaje Infeccioso sin LIS validación
      enabledSubmodules['serologia_inmuno'] = true;
      enabledSystems.LIS = false;
      enabledSubmodules['validacion'] = false;

      const violations = validateModuleDependencies(enabledSystems, enabledSubmodules);
      expect(violations.length).toBeGreaterThan(0);
      expect(violations.some(v => v.dependentModuleId === 'serologia_inmuno')).toBe(true);
    });
  });

  describe('Migración Idempotente para Producción', () => {
    it('debe inyectar licencia Suite Completa a sedes sin licencia sin modificar las que ya tienen', () => {
      const legacyTenants = [
        {
          id: 'lab-san-jose',
          name: 'Laboratorio San José',
          branches: [
            { id: 'b-1', name: 'Sede 1' }, // Sin licencia
            {
              id: 'b-2',
              name: 'Sede 2',
              license: {
                id: 'lic-custom',
                planPreset: 'SOLO_LIS'
              }
            } // Ya con licencia
          ]
        }
      ];

      const { tenants, migratedCount } = ensureBranchesHaveLicenses(legacyTenants);
      expect(migratedCount).toBe(1);
      expect(tenants[0].branches[0].license).toBeDefined();
      expect(tenants[0].branches[0].license.planPreset).toBe('SUITE_COMPLETA');
      expect(tenants[0].branches[1].license.planPreset).toBe('SOLO_LIS');
    });
  });

  describe('Evaluación de Permisos can() y canAccessTab() (Fase 2)', () => {
    const soloLisConfig = getPlanPresetConfig('SOLO_LIS');
    const soloLisLicense: BranchLicense = {
      id: 'lic-solo-lis',
      tenantId: 'lab-corp',
      branchId: 'b-lis',
      planPreset: 'SOLO_LIS',
      status: 'activa',
      startDate: '2026-01-01',
      expirationDate: null,
      gracePeriodDays: 15,
      maxUsers: 10,
      enabledSystems: soloLisConfig.enabledSystems,
      enabledSubmodules: soloLisConfig.enabledSubmodules,
      lastUpdated: new Date().toISOString()
    };

    const suiteLicense = createDefaultFullSuiteLicense('lab-corp', 'b-suite');

    it('debe permitir LIS y bloquear HIS y Banco de Sangre con licencia SOLO_LIS', () => {
      // Sistema
      expect(canAccessSystemWithLicense(soloLisLicense, 'LIS')).toBe(true);
      expect(canAccessSystemWithLicense(soloLisLicense, 'HIS')).toBe(false);
      expect(canAccessSystemWithLicense(soloLisLicense, 'BANCO_SANGRE')).toBe(false);

      // Submódulos
      expect(canAccessSubmoduleWithLicense(soloLisLicense, 'LIS', 'admision_pos')).toBe(true);
      expect(canAccessSubmoduleWithLicense(soloLisLicense, 'LIS', 'validacion')).toBe(true);
      expect(canAccessSubmoduleWithLicense(soloLisLicense, 'HIS', 'urgencias_triage')).toBe(false);
      expect(canAccessSubmoduleWithLicense(soloLisLicense, 'BANCO_SANGRE', 'donantes')).toBe(false);

      // Pestañas mapeadas
      expect(canAccessTabWithLicense(soloLisLicense, 'reception')).toBe(true);
      expect(canAccessTabWithLicense(soloLisLicense, 'validation')).toBe(true);
      expect(canAccessTabWithLicense(soloLisLicense, 'his_triage')).toBe(false);
      expect(canAccessTabWithLicense(soloLisLicense, 'his_beds')).toBe(false);
      expect(canAccessTabWithLicense(soloLisLicense, 'bloodbank')).toBe(false);
      expect(canAccessTabWithLicense(soloLisLicense, 'dashboard')).toBe(true); // Exento
    });

    it('debe permitir todo con licencia SUITE_COMPLETA', () => {
      expect(canAccessSystemWithLicense(suiteLicense, 'LIS')).toBe(true);
      expect(canAccessSystemWithLicense(suiteLicense, 'HIS')).toBe(true);
      expect(canAccessSystemWithLicense(suiteLicense, 'BANCO_SANGRE')).toBe(true);
      expect(canAccessTabWithLicense(suiteLicense, 'reception')).toBe(true);
      expect(canAccessTabWithLicense(suiteLicense, 'his_triage')).toBe(true);
      expect(canAccessTabWithLicense(suiteLicense, 'bloodbank')).toBe(true);
    });

    it('sede suspendida debe bloquear todo acceso a módulos', () => {
      const suspendedLicense: BranchLicense = {
        ...suiteLicense,
        status: 'suspendida'
      };

      expect(canAccessSystemWithLicense(suspendedLicense, 'LIS')).toBe(false);
      expect(canAccessSystemWithLicense(suspendedLicense, 'HIS')).toBe(false);
      expect(canAccessTabWithLicense(suspendedLicense, 'reception')).toBe(false);
    });
  });

  describe('Backend Express Security Middleware & Guards - Fase 5', () => {
    const activeLicense = createDefaultFullSuiteLicense('tenant-test', 'branch-test');

    it('licencia suspendida: bloquea mutaciones (POST, PUT, DELETE) con LICENSE_SUSPENDED (403)', () => {
      const suspendedLicense: BranchLicense = {
        ...activeLicense,
        status: 'suspendida'
      };

      const postResult = evaluateBackendAccess('POST', suspendedLicense, { requiredSystem: 'LIS' });
      expect(postResult.authorized).toBe(false);
      expect(postResult.status).toBe(403);
      expect(postResult.code).toBe('LICENSE_SUSPENDED');
      expect(postResult.isReadOnly).toBe(true);

      const putResult = evaluateBackendAccess('PUT', suspendedLicense);
      expect(putResult.authorized).toBe(false);
      expect(putResult.code).toBe('LICENSE_SUSPENDED');
    });

    it('licencia suspendida: PERMITE consultas GET (modo solo lectura seguro para resultados)', () => {
      const suspendedLicense: BranchLicense = {
        ...activeLicense,
        status: 'suspendida'
      };

      const getResult = evaluateBackendAccess('GET', suspendedLicense, { requiredSystem: 'LIS' });
      expect(getResult.authorized).toBe(true);
      expect(getResult.status).toBe(200);
      expect(getResult.isReadOnly).toBe(true);
    });

    it('licencia en gracia: permite mutaciones y consultas normales', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 3);

      const graceLicense: BranchLicense = {
        ...activeLicense,
        expirationDate: pastDate.toISOString().split('T')[0],
        gracePeriodDays: 15
      };

      const postResult = evaluateBackendAccess('POST', graceLicense, { requiredSystem: 'LIS' });
      expect(postResult.authorized).toBe(true);
      expect(postResult.isReadOnly).toBe(false);
    });

    it('licencia vencida fuera de gracia: bloquea mutaciones con LICENSE_EXPIRED (403)', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 25);

      const expiredLicense: BranchLicense = {
        ...activeLicense,
        expirationDate: pastDate.toISOString().split('T')[0],
        gracePeriodDays: 15
      };

      const postResult = evaluateBackendAccess('POST', expiredLicense, { requiredSystem: 'LIS' });
      expect(postResult.authorized).toBe(false);
      expect(postResult.status).toBe(403);
      expect(postResult.code).toBe('LICENSE_EXPIRED');
      expect(postResult.isReadOnly).toBe(true);

      // GET de resultados sigue habilitado por seguridad clínica
      const getResult = evaluateBackendAccess('GET', expiredLicense);
      expect(getResult.authorized).toBe(true);
      expect(getResult.isReadOnly).toBe(true);
    });

    it('sistema no contratado: bloquea acceso con LICENSE_NOT_ACTIVE (403)', () => {
      const soloLisLicense: BranchLicense = {
        ...activeLicense,
        enabledSystems: { LIS: true, HIS: false, BANCO_SANGRE: false, GESTION_CALIDAD: true, OTROS: false }
      };

      const hisResult = evaluateBackendAccess('GET', soloLisLicense, { requiredSystem: 'HIS' });
      expect(hisResult.authorized).toBe(false);
      expect(hisResult.status).toBe(403);
      expect(hisResult.code).toBe('LICENSE_NOT_ACTIVE');
    });

    it('submódulo no contratado: bloquea acceso con SUBMODULE_NOT_CONTRACTED (403)', () => {
      const licenseWithSubmodules: BranchLicense = {
        ...activeLicense,
        enabledSystems: { LIS: true, HIS: true, BANCO_SANGRE: true, GESTION_CALIDAD: true, OTROS: true },
        enabledSubmodules: {
          admision_pos: true,
          telemetria: false
        }
      };

      const allowedResult = evaluateBackendAccess('GET', licenseWithSubmodules, {
        requiredSystem: 'LIS',
        requiredSubmodule: 'admision_pos'
      });
      expect(allowedResult.authorized).toBe(true);

      const blockedResult = evaluateBackendAccess('GET', licenseWithSubmodules, {
        requiredSystem: 'LIS',
        requiredSubmodule: 'telemetria'
      });
      expect(blockedResult.authorized).toBe(false);
      expect(blockedResult.status).toBe(403);
      expect(blockedResult.code).toBe('SUBMODULE_NOT_CONTRACTED');
    });

    it('control de límite de usuarios: bloquea alta con USER_LIMIT_REACHED (403)', () => {
      const limitedLicense: BranchLicense = {
        ...activeLicense,
        maxUsers: 5
      };

      const underLimitResult = evaluateBackendAccess('POST', limitedLicense, {
        checkUserLimit: true,
        currentUserCount: 4
      });
      expect(underLimitResult.authorized).toBe(true);

      const atLimitResult = evaluateBackendAccess('POST', limitedLicense, {
        checkUserLimit: true,
        currentUserCount: 5
      });
      expect(atLimitResult.authorized).toBe(false);
      expect(atLimitResult.status).toBe(403);
      expect(atLimitResult.code).toBe('USER_LIMIT_REACHED');
    });
  });
});
