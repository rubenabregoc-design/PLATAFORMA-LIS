import React, { useState, useEffect } from 'react';
import { Tenant, Analyzer, MiddlewareMessageLog, User, Role, Branch } from '../../types';
import { useLisStore } from '../../store/useLisStore';
import { MOCK_USERS, MOCK_TEST_CATALOG } from '../../data/mockData';
import {
  Shield, Building2, Cpu, Activity, Plus, Server, CheckCircle2,
  AlertTriangle, Layers, Award, Globe, ExternalLink, Copy, Check, QrCode,
  Stethoscope, Users, UserPlus, Key, Lock, Mail, ShieldCheck, Database,
  CheckCheck, Trash2, Edit3, HeartPulse, Droplets, Thermometer, TestTube,
  Microscope, Sliders, Settings, Filter, Search, RefreshCw, Radio, Phone,
  MapPin, Clock, ArrowRight, Sparkles, FileText, ChevronRight, X
} from 'lucide-react';

interface SuperAdminDashboardProps {
  tenants: Tenant[];
  analyzers: Analyzer[];
  logs: MiddlewareMessageLog[];
  onProvisionTenant: (name: string, ruc: string, dv: string, plan: Tenant['plan']) => void;
  onUpdateTenants?: (tenants: Tenant[]) => void;
}

// Interfaces para Configuración Integral LIS, HIS y Banco de Sangre
interface CustomReferenceTest {
  id: string;
  code: string;
  loincCode: string;
  name: string;
  department: string;
  unit: string;
  tubeType: string;
  minMale: number;
  maxMale: number;
  minFemale: number;
  maxFemale: number;
  minGeneral?: number;
  maxGeneral?: number;
  panicLow?: number;
  panicHigh?: number;
  panicAction?: string;
}

interface HisBedItem {
  id: string;
  code: string;
  roomNumber: string;
  department: 'Urgencias' | 'UCI Adultos' | 'UCI Pediátrica' | 'Cirugía' | 'Maternidad' | 'Hospitalización';
  bedType: string;
  floor: string;
  status: 'DISPONIBLE' | 'OCUPADA' | 'DESINFECCION' | 'MANTENIMIENTO';
  patientName?: string;
}

interface BloodComponentRule {
  id: string;
  name: string;
  code: string;
  shelfLifeDays: number;
  tempRange: string;
  minStockThreshold: number;
  currentStock: number;
  agitationRequired: boolean;
}

interface BloodIotFreezer {
  id: string;
  name: string;
  serialNumber: string;
  currentTemp: number;
  setpointTemp: number;
  minAlarmTemp: number;
  maxAlarmTemp: number;
  status: 'NORMAL' | 'ALERTA' | 'CRITICO';
}

const DEFAULT_REFERENCE_TESTS: CustomReferenceTest[] = [
  {
    id: 'test-glu',
    code: 'GLU-001',
    loincCode: '1558-6',
    name: 'Glucosa Sérica en Ayunas',
    department: 'Química Clínica',
    unit: 'mg/dL',
    tubeType: 'Suero Gel Oro / SST Amarillo',
    minMale: 70,
    maxMale: 99,
    minFemale: 70,
    maxFemale: 99,
    panicLow: 45,
    panicHigh: 400,
    panicAction: 'Aviso inmediato a médico en < 5 min + Repetición por duplicado'
  },
  {
    id: 'test-hb',
    code: 'HEM-001-HB',
    loincCode: '718-7',
    name: 'Hemoglobina (Hb)',
    department: 'Hematología',
    unit: 'g/dL',
    tubeType: 'Tubo Lila K2-EDTA',
    minMale: 13.5,
    maxMale: 17.5,
    minFemale: 12.0,
    maxFemale: 15.5,
    panicLow: 6.5,
    panicHigh: 20.0,
    panicAction: 'Notificación de urgencia crítica + Verificación de coágulo en tubo'
  },
  {
    id: 'test-k',
    code: 'ELE-002-K',
    loincCode: '2823-3',
    name: 'Potasio Sérico (K+)',
    department: 'Electrolitos',
    unit: 'mmol/L',
    tubeType: 'Suero Libre de Hemólisis',
    minMale: 3.5,
    maxMale: 5.1,
    minFemale: 3.5,
    maxFemale: 5.1,
    panicLow: 2.8,
    panicHigh: 6.2,
    panicAction: 'Riesgo inminente de arritmia cardíaca. Llamar a estación médica'
  },
  {
    id: 'test-crea',
    code: 'QCL-003-CREA',
    loincCode: '2160-0',
    name: 'Creatinina Sérica (Jaffé)',
    department: 'Química Clínica',
    unit: 'mg/dL',
    tubeType: 'Suero Gel Oro / Heparina',
    minMale: 0.7,
    maxMale: 1.3,
    minFemale: 0.5,
    maxFemale: 1.1,
    panicLow: 0.3,
    panicHigh: 5.0,
    panicAction: 'Alerta de falla renal aguda. Verificar cálculo de filtrado eGFR'
  },
  {
    id: 'test-leuco',
    code: 'HEM-001-WBC',
    loincCode: '6690-2',
    name: 'Leucocitos Totales (WBC)',
    department: 'Hematología',
    unit: 'x10³/µL',
    tubeType: 'Tubo Lila K2-EDTA',
    minMale: 4.5,
    maxMale: 11.0,
    minFemale: 4.5,
    maxFemale: 11.0,
    panicLow: 2.0,
    panicHigh: 30.0,
    panicAction: 'Alerta de neutropenia febril o reacción leucemoide'
  },
  {
    id: 'test-plaq',
    code: 'HEM-001-PLT',
    loincCode: '777-3',
    name: 'Recuento de Plaquetas (PLT)',
    department: 'Hematología',
    unit: 'x10³/µL',
    tubeType: 'Tubo Lila K2-EDTA',
    minMale: 150,
    maxMale: 450,
    minFemale: 150,
    maxFemale: 450,
    panicLow: 20,
    panicHigh: 1000,
    panicAction: 'Riesgo inminente de hemorragia espontánea. Notificar a banco de sangre'
  },
  {
    id: 'test-tsh',
    code: 'ENDO-001-TSH',
    loincCode: '3016-3',
    name: 'TSH Ultrasensible 3ra Gen',
    department: 'Endocrinología',
    unit: 'µUI/mL',
    tubeType: 'Suero Gel Oro / SST Amarillo',
    minMale: 0.4,
    maxMale: 4.2,
    minFemale: 0.4,
    maxFemale: 4.2,
    panicLow: 0.01,
    panicHigh: 20.0,
    panicAction: 'Sospecha de tormenta tiroidea o coma mixedematoso'
  },
  {
    id: 'test-troponin',
    code: 'CARD-001-TNI',
    loincCode: '42757-5',
    name: 'Troponina I de Alta Sensibilidad',
    department: 'Marcadores Cardíacos',
    unit: 'ng/L',
    tubeType: 'Plasma Heparina / Suero',
    minMale: 0,
    maxMale: 34,
    minFemale: 0,
    maxFemale: 16,
    panicLow: 0,
    panicHigh: 100,
    panicAction: 'PROTOCOLO CÓDIGO INFARTO: Notificación prioritaria a cardiología / urgencias'
  }
];

const DEFAULT_HIS_BEDS: HisBedItem[] = [
  { id: 'bed-1', code: 'UCI-101', roomNumber: '101', department: 'UCI Adultos', bedType: 'Cama Crítica con Monitor Mindray & Ventilador', floor: 'Piso 1', status: 'OCUPADA', patientName: 'Carlos M. Mendoza (Céd. 8-712-991)' },
  { id: 'bed-2', code: 'UCI-102', roomNumber: '102', department: 'UCI Adultos', bedType: 'Cama Crítica con Monitor Mindray & Ventilador', floor: 'Piso 1', status: 'DISPONIBLE' },
  { id: 'bed-3', code: 'URG-CAM-01', roomNumber: 'Sala Trauma', department: 'Urgencias', bedType: 'Camilla Trauma Shock Hill-Rom', floor: 'Planta Baja', status: 'DISPONIBLE' },
  { id: 'bed-4', code: 'URG-CAM-02', roomNumber: 'Observación A', department: 'Urgencias', bedType: 'Camilla de Observación Clínica', floor: 'Planta Baja', status: 'OCUPADA', patientName: 'Elena Ramos (Céd. 4-118-241)' },
  { id: 'bed-5', code: 'CIR-QUI-01', roomNumber: 'Quirófano Central 1', department: 'Cirugía', bedType: 'Mesa Quirúrgica Universal LED', floor: 'Piso 2', status: 'DESINFECCION' },
  { id: 'bed-6', code: 'MAT-HAB-201', roomNumber: 'Habitación 201', department: 'Maternidad', bedType: 'Cama Obstétrica LDR + Cuna Neonatal', floor: 'Piso 2', status: 'DISPONIBLE' },
  { id: 'bed-7', code: 'HOSP-HAB-301', roomNumber: 'Habitación 301-A', department: 'Hospitalización', bedType: 'Cama Eléctrica Hospitalaria 4 Mov.', floor: 'Piso 3', status: 'DISPONIBLE' },
  { id: 'bed-8', code: 'HOSP-HAB-302', roomNumber: 'Habitación 302-B', department: 'Hospitalización', bedType: 'Cama Eléctrica Hospitalaria 4 Mov.', floor: 'Piso 3', status: 'MANTENIMIENTO' }
];

const DEFAULT_BLOOD_RULES: BloodComponentRule[] = [
  { id: 'cgr', name: 'Concentrado de Glóbulos Rojos (CGR)', code: 'E0001V00', shelfLifeDays: 42, tempRange: '2°C a 6°C', minStockThreshold: 15, currentStock: 28, agitationRequired: false },
  { id: 'pfc', name: 'Plasma Fresco Congelado (PFC)', code: 'E0002V00', shelfLifeDays: 365, tempRange: '≤ -18°C', minStockThreshold: 10, currentStock: 19, agitationRequired: false },
  { id: 'cp', name: 'Concentrado de Plaquetas (Pool / Aféresis)', code: 'E0003V00', shelfLifeDays: 5, tempRange: '20°C a 24°C', minStockThreshold: 8, currentStock: 12, agitationRequired: true },
  { id: 'crio', name: 'Crioprecipitado Factor VIII / Fibrinógeno', code: 'E0004V00', shelfLifeDays: 365, tempRange: '≤ -18°C', minStockThreshold: 6, currentStock: 9, agitationRequired: false },
  { id: 'st', name: 'Sangre Total Reconstituida', code: 'E0005V00', shelfLifeDays: 21, tempRange: '2°C a 6°C', minStockThreshold: 4, currentStock: 5, agitationRequired: false }
];

const DEFAULT_BLOOD_FREEZERS: BloodIotFreezer[] = [
  { id: 'f-1', name: 'Refrigerador de Sangre #1 (Hematología)', serialNumber: 'THERMO-REVCO-8812', currentTemp: 4.1, setpointTemp: 4.0, minAlarmTemp: 2.0, maxAlarmTemp: 6.0, status: 'NORMAL' },
  { id: 'f-2', name: 'Ultra-Congelador Plasma -80°C #1', serialNumber: 'PANASONIC-VIP-PLUS-900', currentTemp: -78.6, setpointTemp: -80.0, minAlarmTemp: -85.0, maxAlarmTemp: -70.0, status: 'NORMAL' },
  { id: 'f-3', name: 'Congelador de Plasma Clínico #2', serialNumber: 'FORMA-SCIENTIFIC-402', currentTemp: -24.2, setpointTemp: -25.0, minAlarmTemp: -30.0, maxAlarmTemp: -18.0, status: 'NORMAL' },
  { id: 'f-4', name: 'Incubador y Agitador de Plaquetas #1', serialNumber: 'HELMER-PC100-AGIT', currentTemp: 22.3, setpointTemp: 22.0, minAlarmTemp: 20.0, maxAlarmTemp: 24.0, status: 'NORMAL' }
];

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({
  tenants,
  analyzers,
  logs,
  onProvisionTenant,
  onUpdateTenants
}) => {
  const { setActiveTab, language } = useLisStore();

  // Sub-pestaña de la Consola Súper-Admin
  const [adminTab, setAdminTab] = useState<'TENANTS_BRANCHES' | 'LIS_CATALOG' | 'HIS_BEDS' | 'BLOOD_BANK' | 'USERS' | 'PORTS'>('TENANTS_BRANCHES');

  // Multi-Tenant & Multisede State
  const [selectedTenantId, setSelectedTenantId] = useState<string>(tenants[0]?.id || 'lab-san-jose');
  const [newLabName, setNewLabName] = useState<string>('');
  const [newRuc, setNewRuc] = useState<string>('');
  const [newDv, setNewDv] = useState<string>('');
  const [newPlan, setNewPlan] = useState<Tenant['plan']>('Pro');
  const [initialBranchName, setInitialBranchName] = useState<string>('Sede Principal');
  const [initialBranchCode, setInitialBranchCode] = useState<string>('SP-01');

  // Formulario para Agregar Nueva Sede al Cliente Seleccionado
  const [newBranchName, setNewBranchName] = useState<string>('');
  const [newBranchCode, setNewBranchCode] = useState<string>('');
  const [newBranchAddress, setNewBranchAddress] = useState<string>('');
  const [newBranchPhone, setNewBranchPhone] = useState<string>('+507 ');
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);

  // Catálogo LIS & Valores de Referencia State
  const [customTests, setCustomTests] = useState<CustomReferenceTest[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('lis_custom_test_ranges');
        if (stored) return JSON.parse(stored);
      } catch (e) {}
    }
    return DEFAULT_REFERENCE_TESTS;
  });
  const [testSearch, setTestSearch] = useState<string>('');
  const [testDeptFilter, setTestDeptFilter] = useState<string>('TODOS');
  const [editingTest, setEditingTest] = useState<CustomReferenceTest | null>(null);

  // Formulario de Nueva Prueba
  const [newTestCode, setNewTestCode] = useState<string>('');
  const [newTestLoinc, setNewTestLoinc] = useState<string>('');
  const [newTestName, setNewTestName] = useState<string>('');
  const [newTestDept, setNewTestDept] = useState<string>('Química Clínica');
  const [newTestUnit, setNewTestUnit] = useState<string>('mg/dL');
  const [newTestTube, setNewTestTube] = useState<string>('Suero Gel Oro / SST Amarillo');
  const [newTestMinM, setNewTestMinM] = useState<number>(70);
  const [newTestMaxM, setNewTestMaxM] = useState<number>(100);
  const [newTestMinF, setNewTestMinF] = useState<number>(70);
  const [newTestMaxF, setNewTestMaxF] = useState<number>(100);
  const [newTestPanicL, setNewTestPanicL] = useState<number>(40);
  const [newTestPanicH, setNewTestPanicH] = useState<number>(400);
  const [newTestPanicAction, setNewTestPanicAction] = useState<string>('Llamada inmediata a médico + Repetición por duplicado');
  const [isCreatingTest, setIsCreatingTest] = useState<boolean>(false);

  // Configuración Suite Hospitalaria HIS (Camas)
  const [hisBeds, setHisBeds] = useState<HisBedItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('lis_his_beds');
        if (stored) return JSON.parse(stored);
      } catch (e) {}
    }
    return DEFAULT_HIS_BEDS;
  });
  const [bedDeptFilter, setBedDeptFilter] = useState<string>('TODOS');
  const [newBedCode, setNewBedCode] = useState<string>('');
  const [newBedRoom, setNewBedRoom] = useState<string>('');
  const [newBedDept, setNewBedDept] = useState<HisBedItem['department']>('Urgencias');
  const [newBedType, setNewBedType] = useState<string>('Camilla de Observación Clínica');
  const [newBedFloor, setNewBedFloor] = useState<string>('Planta Baja');

  // Configuración Banco de Sangre
  const [bloodRules, setBloodRules] = useState<BloodComponentRule[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('lis_blood_rules');
        if (stored) return JSON.parse(stored);
      } catch (e) {}
    }
    return DEFAULT_BLOOD_RULES;
  });
  const [bloodFreezers, setBloodFreezers] = useState<BloodIotFreezer[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('lis_blood_freezers');
        if (stored) return JSON.parse(stored);
      } catch (e) {}
    }
    return DEFAULT_BLOOD_FREEZERS;
  });
  const [mandatorySerology, setMandatorySerology] = useState<Record<string, boolean>>({
    hiv: true,
    hbv: true,
    hcv: true,
    chagas: true,
    syphilis: true,
    htlv: true,
    malaria: true,
    natRequired: true
  });

  // Usuarios Reales State
  const [realUsers, setRealUsers] = useState<User[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('lis_real_users');
        if (stored) return JSON.parse(stored);
      } catch (e) {}
    }
    return MOCK_USERS;
  });
  const [newUserName, setNewUserName] = useState<string>('');
  const [newUserEmail, setNewUserEmail] = useState<string>('');
  const [newUserPassword, setNewUserPassword] = useState<string>('');
  const [newUserRole, setNewUserRole] = useState<Role>('tech_med');
  const [newUserLicense, setNewUserLicense] = useState<string>('');
  const [newUserPin, setNewUserPin] = useState<string>('1234');
  const [newUserTenant, setNewUserTenant] = useState<string>(tenants[0]?.id || 'lab-san-jose');
  const [userCreatedSuccess, setUserCreatedSuccess] = useState<string | null>(null);

  // Puertos y Copiado
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  const activeTenant = tenants.find((t) => t.id === selectedTenantId) || tenants[0];

  // Helper para persistir Tenants
  const saveTenants = (updated: Tenant[]) => {
    if (onUpdateTenants) {
      onUpdateTenants(updated);
    } else {
      try {
        localStorage.setItem('lis_tenants', JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent('lis_tenants_updated'));
      } catch (e) {}
    }
  };

  // 1. Crear nuevo Tenant
  const handleCreateTenant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabName.trim() || !newRuc.trim()) {
      window.dispatchEvent(
        new CustomEvent('lis-global-toast', {
          detail: { message: 'Por favor complete el Nombre del Laboratorio y el RUC.', type: 'warning' }
        })
      );
      return;
    }

    const newId = `lab-${Date.now()}`;
    const initialBranch: Branch = {
      id: `br-${Date.now()}-1`,
      tenantId: newId,
      name: initialBranchName.trim() || 'Sede Principal',
      code: initialBranchCode.trim() || 'SP-01',
      address: 'Ciudad de Panamá',
      phone: '+507 200-0000'
    };

    const newTenant: Tenant = {
      id: newId,
      name: newLabName.trim(),
      ruc: newRuc.trim(),
      dv: newDv.trim() || '00',
      plan: newPlan,
      branches: [initialBranch]
    };

    const updated = [...tenants, newTenant];
    saveTenants(updated);
    setSelectedTenantId(newId);

    setNewLabName('');
    setNewRuc('');
    setNewDv('');
    setInitialBranchName('Sede Principal');
    setInitialBranchCode('SP-01');

    window.dispatchEvent(
      new CustomEvent('lis-global-toast', {
        detail: {
          message: `¡Cliente "${newTenant.name}" creado con éxito con su sede inicial "${initialBranch.name}"!`,
          type: 'success'
        }
      })
    );
  };

  // 2. Agregar Sede a un Tenant
  const handleAddBranchToTenant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranchName.trim() || !newBranchCode.trim()) {
      window.dispatchEvent(
        new CustomEvent('lis-global-toast', {
          detail: { message: 'Ingrese el nombre y código de la nueva sede.', type: 'warning' }
        })
      );
      return;
    }

    const newBranch: Branch = {
      id: `branch-${Date.now()}`,
      tenantId: activeTenant.id,
      name: newBranchName.trim(),
      code: newBranchCode.trim().toUpperCase(),
      address: newBranchAddress.trim() || 'Panamá',
      phone: newBranchPhone.trim() || '+507 200-0000'
    };

    const updatedTenants = tenants.map((t) => {
      if (t.id === activeTenant.id) {
        return {
          ...t,
          branches: [...t.branches, newBranch]
        };
      }
      return t;
    });

    saveTenants(updatedTenants);

    setNewBranchName('');
    setNewBranchCode('');
    setNewBranchAddress('');
    setNewBranchPhone('+507 ');

    window.dispatchEvent(
      new CustomEvent('lis-global-toast', {
        detail: {
          message: `¡Sede "${newBranch.name}" agregada con éxito a ${activeTenant.name}! Ya está disponible en el Login.`,
          type: 'success'
        }
      })
    );
  };

  // 3. Editar Sede
  const handleUpdateBranch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBranch) return;

    const updatedTenants = tenants.map((t) => {
      if (t.id === editingBranch.tenantId) {
        return {
          ...t,
          branches: t.branches.map((b) => (b.id === editingBranch.id ? editingBranch : b))
        };
      }
      return t;
    });

    saveTenants(updatedTenants);
    setEditingBranch(null);

    window.dispatchEvent(
      new CustomEvent('lis-global-toast', {
        detail: { message: `Sede "${editingBranch.name}" actualizada con éxito.`, type: 'success' }
      })
    );
  };

  // 4. Eliminar Sede
  const handleDeleteBranch = (tenantId: string, branchId: string) => {
    const targetTenant = tenants.find((t) => t.id === tenantId);
    if (!targetTenant) return;

    if (targetTenant.branches.length <= 1) {
      window.dispatchEvent(
        new CustomEvent('lis-global-toast', {
          detail: { message: 'No puede eliminar la única sede del cliente. Debe tener al menos una.', type: 'error' }
        })
      );
      return;
    }

    const updatedTenants = tenants.map((t) => {
      if (t.id === tenantId) {
        return {
          ...t,
          branches: t.branches.filter((b) => b.id !== branchId)
        };
      }
      return t;
    });

    saveTenants(updatedTenants);

    window.dispatchEvent(
      new CustomEvent('lis-global-toast', {
        detail: { message: 'Sede eliminada del sistema.', type: 'info' }
      })
    );
  };

  // 5. Guardar Modificación de Valores de Referencia LIS
  const handleSaveReferenceTest = (test: CustomReferenceTest) => {
    const updated = customTests.map((t) => (t.id === test.id ? test : t));
    setCustomTests(updated);
    try {
      localStorage.setItem('lis_custom_test_ranges', JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('lis_catalog_updated'));
    } catch (e) {}

    setEditingTest(null);
    window.dispatchEvent(
      new CustomEvent('lis-global-toast', {
        detail: { message: `Valores de referencia de "${test.name}" actualizados y vigentes.`, type: 'success' }
      })
    );
  };

  // 6. Crear Nueva Prueba LIS en Catálogo
  const handleCreateNewTest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTestCode.trim() || !newTestName.trim()) {
      window.dispatchEvent(
        new CustomEvent('lis-global-toast', {
          detail: { message: 'Ingrese el código y nombre del examen.', type: 'warning' }
        })
      );
      return;
    }

    const newTest: CustomReferenceTest = {
      id: `test-custom-${Date.now()}`,
      code: newTestCode.trim().toUpperCase(),
      loincCode: newTestLoinc.trim() || '99999-0',
      name: newTestName.trim(),
      department: newTestDept,
      unit: newTestUnit.trim(),
      tubeType: newTestTube,
      minMale: Number(newTestMinM),
      maxMale: Number(newTestMaxM),
      minFemale: Number(newTestMinF),
      maxFemale: Number(newTestMaxF),
      panicLow: newTestPanicL ? Number(newTestPanicL) : undefined,
      panicHigh: newTestPanicH ? Number(newTestPanicH) : undefined,
      panicAction: newTestPanicAction.trim()
    };

    const updated = [newTest, ...customTests];
    setCustomTests(updated);
    try {
      localStorage.setItem('lis_custom_test_ranges', JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('lis_catalog_updated'));
    } catch (e) {}

    setIsCreatingTest(false);
    setNewTestCode('');
    setNewTestLoinc('');
    setNewTestName('');

    window.dispatchEvent(
      new CustomEvent('lis-global-toast', {
        detail: { message: `¡Examen "${newTest.name}" incorporado al catálogo LIS!`, type: 'success' }
      })
    );
  };

  // 7. Configuración HIS - Camas
  const handleAddBed = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBedCode.trim() || !newBedRoom.trim()) {
      window.dispatchEvent(
        new CustomEvent('lis-global-toast', {
          detail: { message: 'Ingrese el código de cama y la sala.', type: 'warning' }
        })
      );
      return;
    }

    const newBed: HisBedItem = {
      id: `bed-${Date.now()}`,
      code: newBedCode.trim().toUpperCase(),
      roomNumber: newBedRoom.trim(),
      department: newBedDept,
      bedType: newBedType.trim(),
      floor: newBedFloor.trim(),
      status: 'DISPONIBLE'
    };

    const updated = [...hisBeds, newBed];
    setHisBeds(updated);
    try {
      localStorage.setItem('lis_his_beds', JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('lis_his_beds_updated'));
    } catch (e) {}

    setNewBedCode('');
    setNewBedRoom('');

    window.dispatchEvent(
      new CustomEvent('lis-global-toast', {
        detail: { message: `Cama "${newBed.code}" registrada en ${newBed.department}.`, type: 'success' }
      })
    );
  };

  const handleToggleBedStatus = (bedId: string) => {
    const nextStatusMap: Record<HisBedItem['status'], HisBedItem['status']> = {
      DISPONIBLE: 'OCUPADA',
      OCUPADA: 'DESINFECCION',
      DESINFECCION: 'MANTENIMIENTO',
      MANTENIMIENTO: 'DISPONIBLE'
    };

    const updated = hisBeds.map((b) => {
      if (b.id === bedId) {
        return {
          ...b,
          status: nextStatusMap[b.status]
        };
      }
      return b;
    });

    setHisBeds(updated);
    try {
      localStorage.setItem('lis_his_beds', JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('lis_his_beds_updated'));
    } catch (e) {}
  };

  const handleDeleteBed = (bedId: string) => {
    const updated = hisBeds.filter((b) => b.id !== bedId);
    setHisBeds(updated);
    try {
      localStorage.setItem('lis_his_beds', JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('lis_his_beds_updated'));
    } catch (e) {}
  };

  // 8. Banco de Sangre Rules
  const handleUpdateBloodRule = (ruleId: string, days: number, stock: number) => {
    const updated = bloodRules.map((r) => (r.id === ruleId ? { ...r, shelfLifeDays: days, minStockThreshold: stock } : r));
    setBloodRules(updated);
    try {
      localStorage.setItem('lis_blood_rules', JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('lis_blood_rules_updated'));
    } catch (e) {}
    window.dispatchEvent(
      new CustomEvent('lis-global-toast', {
        detail: { message: 'Regla de hemocomponente actualizada.', type: 'info' }
      })
    );
  };

  // 9. Crear Usuario Real
  const handleCreateRealUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim() || !newUserPassword.trim()) {
      window.dispatchEvent(
        new CustomEvent('lis-global-toast', {
          detail: { message: 'Complete nombre, correo y contraseña del usuario.', type: 'warning' }
        })
      );
      return;
    }

    const targetTenant = tenants.find((t) => t.id === newUserTenant) || tenants[0];
    const targetBranch = targetTenant.branches[0]?.id || 'branch-via-espana';

    const newUser: User = {
      id: `usr-${Date.now()}`,
      tenantId: newUserTenant,
      branchId: targetBranch,
      name: newUserName.trim(),
      email: newUserEmail.trim(),
      role: newUserRole,
      password: newUserPassword.trim(),
      pinCode: newUserPin.trim() || '1234',
      licenseNumber: newUserLicense.trim() || undefined,
      twoFactorEnabled: Boolean(newUserPin.trim())
    };

    const updated = [newUser, ...realUsers];
    setRealUsers(updated);
    try {
      localStorage.setItem('lis_real_users', JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('lis_users_updated'));
    } catch (e) {
      console.error(e);
    }

    setUserCreatedSuccess(`Usuario "${newUser.name}" registrado exitosamente.`);
    setTimeout(() => setUserCreatedSuccess(null), 4000);

    setNewUserName('');
    setNewUserEmail('');
    setNewUserPassword('');
    setNewUserLicense('');
    setNewUserPin('1234');

    window.dispatchEvent(
      new CustomEvent('lis-global-toast', {
        detail: { message: `¡Usuario real creado! Ya puede ingresar con ${newUser.email}.`, type: 'success' }
      })
    );
  };

  const handleDeleteRealUser = (userId: string) => {
    const updated = realUsers.filter((u) => u.id !== userId);
    setRealUsers(updated);
    try {
      localStorage.setItem('lis_real_users', JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('lis_users_updated'));
    } catch (e) {}

    window.dispatchEvent(
      new CustomEvent('lis-global-toast', {
        detail: { message: 'Usuario eliminado.', type: 'info' }
      })
    );
  };

  const handleCopyLink = (url: string, name: string) => {
    navigator.clipboard.writeText(url);
    setCopiedLink(name);
    setTimeout(() => setCopiedLink(null), 2000);
    window.dispatchEvent(
      new CustomEvent('lis-global-toast', {
        detail: { message: `Enlace de ${name} copiado: ${url}`, type: 'info' }
      })
    );
  };

  const currentHost = typeof window !== 'undefined' && window.location.hostname ? window.location.hostname : 'localhost';
  const patientPortalUrl = `http://${currentHost}:3001`;
  const doctorPortalUrl = `http://${currentHost}:3002`;
  const superAdminUrl = `http://${currentHost}:3003`;

  const filteredTests = customTests.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(testSearch.toLowerCase()) ||
      t.code.toLowerCase().includes(testSearch.toLowerCase()) ||
      t.loincCode.toLowerCase().includes(testSearch.toLowerCase());
    const matchesDept = testDeptFilter === 'TODOS' || t.department === testDeptFilter;
    return matchesSearch && matchesDept;
  });

  const filteredBeds = hisBeds.filter((b) => bedDeptFilter === 'TODOS' || b.department === bedDeptFilter);

  const totalBranches = tenants.reduce((acc, t) => acc + t.branches.length, 0);

  return (
    <div className="space-y-6 text-slate-100 animate-in fade-in duration-500 max-w-7xl mx-auto pb-12">

      {/* Encabezado Ejecutivo LISCORE Theme */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 rounded-3xl p-6 sm:p-8 border border-cyan-500/40 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-400 via-cyan-500 to-blue-500"></div>
        <div>
          <div className="text-cyan-400 text-xs font-black uppercase tracking-widest mb-1.5 flex items-center space-x-2">
            <Shield className="w-4 h-4 text-cyan-400" />
            <span>Plataforma Súper-Admin Maestro — Ing. Rubén Abrego / AbregoTech Systems</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Control Maestro de Clientes, Multisede, LIS, HIS & Banco de Sangre
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl font-medium leading-relaxed">
            Consola central de gobernanza médica y tecnológica: creación y modificación de clientes hospitalarios, sucursales en tiempo real, catálogo analítico con valores de referencia y límites de pánico, camas HIS y hemovigilancia.
          </p>
        </div>

        {/* Métricas Rápidas en Tiempo Real */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-950/80 border border-cyan-500/30 p-3.5 rounded-2xl text-xs shrink-0">
          <div className="space-y-0.5">
            <span className="text-[10px] text-slate-400 uppercase font-black">Clientes / Labs</span>
            <div className="text-base font-black text-white">{tenants.length}</div>
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] text-cyan-400 uppercase font-black">Sedes Activas</span>
            <div className="text-base font-black text-cyan-300">{totalBranches}</div>
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] text-emerald-400 uppercase font-black">Pruebas LIS</span>
            <div className="text-base font-black text-emerald-300">{customTests.length}</div>
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] text-amber-400 uppercase font-black">Camas HIS</span>
            <div className="text-base font-black text-amber-300">{hisBeds.length}</div>
          </div>
        </div>
      </div>

      {/* Barra de Pestañas de Control Maestro */}
      <div className="flex items-center space-x-2 bg-slate-950/90 p-2 rounded-2xl border border-slate-800 overflow-x-auto shadow-xl">
        <button
          onClick={() => setAdminTab('TENANTS_BRANCHES')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-black transition cursor-pointer whitespace-nowrap ${
            adminTab === 'TENANTS_BRANCHES'
              ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>🏢 Clientes & Multisede ({totalBranches} Sedes)</span>
        </button>

        <button
          onClick={() => setAdminTab('LIS_CATALOG')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-black transition cursor-pointer whitespace-nowrap ${
            adminTab === 'LIS_CATALOG'
              ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <TestTube className="w-4 h-4" />
          <span>🧪 Catálogo LIS & Valores de Referencia</span>
        </button>

        <button
          onClick={() => setAdminTab('HIS_BEDS')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-black transition cursor-pointer whitespace-nowrap ${
            adminTab === 'HIS_BEDS'
              ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <HeartPulse className="w-4 h-4" />
          <span>🏥 Suite Hospitalaria HIS & Camas</span>
        </button>

        <button
          onClick={() => setAdminTab('BLOOD_BANK')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-black transition cursor-pointer whitespace-nowrap ${
            adminTab === 'BLOOD_BANK'
              ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Droplets className="w-4 h-4" />
          <span>🩸 Configuración Banco de Sangre</span>
        </button>

        <button
          onClick={() => setAdminTab('USERS')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-black transition cursor-pointer whitespace-nowrap ${
            adminTab === 'USERS'
              ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>👥 Usuarios & Seguridad ({realUsers.length})</span>
        </button>

        <button
          onClick={() => setAdminTab('PORTS')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-black transition cursor-pointer whitespace-nowrap ${
            adminTab === 'PORTS'
              ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>🌐 Puertos & Red Dedicada</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 🏢 TAB 1: CLIENTES & MULTISEDE                                            */}
      {/* ========================================================================= */}
      {adminTab === 'TENANTS_BRANCHES' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* Formulario 1A: Crear Nuevo Cliente / Hospital */}
            <form onSubmit={handleCreateTenant} className="lg:col-span-4 bg-slate-900/90 p-6 rounded-3xl border border-slate-800 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-extrabold text-white text-xs uppercase tracking-wider flex items-center space-x-2">
                  <Plus className="w-4 h-4 text-cyan-400" />
                  <span>Aprovisionar Nuevo Cliente</span>
                </h3>
                <span className="text-[10px] bg-cyan-500/20 text-cyan-300 font-mono font-bold px-2 py-0.5 rounded-full">
                  Nuevo Tenant
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300 block">Razón Social / Nombre del Hospital o Lab:</label>
                  <input
                    type="text"
                    placeholder="Ej. Centro Médico Punta Pacífica"
                    value={newLabName}
                    onChange={(e) => setNewLabName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-bold focus:outline-none focus:border-cyan-400"
                    required
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2 space-y-1">
                    <label className="font-bold text-slate-300 block">RUC Panameño:</label>
                    <input
                      type="text"
                      placeholder="1556983-1-82001"
                      value={newRuc}
                      onChange={(e) => setNewRuc(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono font-bold focus:outline-none focus:border-cyan-400"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-300 block">DV:</label>
                    <input
                      type="text"
                      placeholder="42"
                      value={newDv}
                      onChange={(e) => setNewDv(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono font-bold focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300 block">Plan de Suscripción LIS:</label>
                  <select
                    value={newPlan}
                    onChange={(e) => setNewPlan(e.target.value as Tenant['plan'])}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-cyan-400"
                  >
                    <option value="Basic">Plan Básico ($150/mes)</option>
                    <option value="Pro">Plan Pro Multisede ($350/mes)</option>
                    <option value="Enterprise">Plan Enterprise Hospitalario ($750/mes)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-300 block">Sede Inicial:</label>
                    <input
                      type="text"
                      value={initialBranchName}
                      onChange={(e) => setInitialBranchName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-300 block">Código Sede:</label>
                    <input
                      type="text"
                      value={initialBranchCode}
                      onChange={(e) => setInitialBranchCode(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-cyan-300 font-mono font-bold"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black rounded-xl text-xs transition cursor-pointer flex items-center justify-center space-x-2 shadow-lg shadow-cyan-500/20"
              >
                <Building2 className="w-4 h-4" />
                <span>Crear Cliente & Aprovisionar</span>
              </button>
            </form>

            {/* Formulario 1B & Gestión de Sedes del Cliente Seleccionado */}
            <div className="lg:col-span-8 space-y-6">

              {/* Selector del Cliente a Administrar */}
              <div className="bg-slate-900/90 p-5 rounded-3xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400 flex items-center space-x-1.5">
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Seleccionar Cliente para Administrar Sedes:</span>
                  </span>
                  <select
                    value={selectedTenantId}
                    onChange={(e) => setSelectedTenantId(e.target.value)}
                    className="bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white font-black focus:outline-none focus:border-cyan-400 cursor-pointer"
                  >
                    {tenants.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} — RUC: {t.ruc}-{t.dv} ({t.branches.length} sedes)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30 font-bold">
                    ✓ Multisede Activa en Login
                  </span>
                </div>
              </div>

              {/* Formulario para Agregar Sede */}
              <form onSubmit={handleAddBranchToTenant} className="bg-slate-900/90 p-6 rounded-3xl border border-slate-800 space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h4 className="font-black text-white text-xs uppercase tracking-wider flex items-center space-x-2">
                    <Plus className="w-4 h-4 text-emerald-400" />
                    <span>Agregar Nueva Sede / Sucursal a "{activeTenant.name}"</span>
                  </h4>
                  <span className="text-[10px] text-cyan-300 font-mono">Alta en 0ms</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-300 block">Nombre de la Sede:</label>
                    <input
                      type="text"
                      placeholder="Ej. Sede Costa del Este"
                      value={newBranchName}
                      onChange={(e) => setNewBranchName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-cyan-400"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-300 block">Código Sede:</label>
                    <input
                      type="text"
                      placeholder="Ej. CE-03"
                      value={newBranchCode}
                      onChange={(e) => setNewBranchCode(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-cyan-300 font-mono font-bold focus:outline-none focus:border-cyan-400"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-300 block">Dirección:</label>
                    <input
                      type="text"
                      placeholder="Ej. Av. Balboa, Plaza Real"
                      value={newBranchAddress}
                      onChange={(e) => setNewBranchAddress(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-medium focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-300 block">Teléfono:</label>
                    <input
                      type="text"
                      placeholder="+507 264-0000"
                      value={newBranchPhone}
                      onChange={(e) => setNewBranchPhone(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-amber-300 font-mono font-bold focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="py-2.5 px-6 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs transition cursor-pointer flex items-center space-x-2 shadow-md shadow-emerald-500/20"
                >
                  <Plus className="w-4 h-4" />
                  <span>Guardar Sede y Desplegar en Login</span>
                </button>
              </form>

              {/* Lista de Sedes Existentes del Cliente */}
              <div className="bg-slate-900/90 p-6 rounded-3xl border border-slate-800 space-y-4 shadow-xl">
                <h4 className="font-black text-white text-xs uppercase tracking-wider flex items-center space-x-2 border-b border-slate-800 pb-3">
                  <MapPin className="w-4 h-4 text-cyan-400" />
                  <span>Sedes Operativas de "{activeTenant.name}" ({activeTenant.branches.length})</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeTenant.branches.map((branch) => (
                    <div
                      key={branch.id}
                      className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-cyan-500/50 transition-all space-y-2.5 shadow-md"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 min-w-0">
                          <span className="text-cyan-400 font-mono font-bold text-xs bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                            {branch.code}
                          </span>
                          <span className="font-black text-white text-sm truncate">{branch.name}</span>
                        </div>

                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => setEditingBranch(branch)}
                            className="p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/10 rounded-lg transition cursor-pointer"
                            title="Editar Sede"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteBranch(activeTenant.id, branch.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition cursor-pointer"
                            title="Eliminar Sede"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="text-xs text-slate-300 flex items-start space-x-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                        <span className="leading-snug">{branch.address}</span>
                      </div>

                      <div className="text-xs text-amber-300 font-mono flex items-center space-x-2">
                        <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>{branch.phone}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>

          {/* Modal para Editar Sede */}
          {editingBranch && (
            <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
              <form
                onSubmit={handleUpdateBranch}
                className="bg-slate-900 border border-cyan-500/40 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="font-black text-white text-sm flex items-center space-x-2">
                    <Edit3 className="w-4 h-4 text-cyan-400" />
                    <span>Modificar Datos de la Sede</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setEditingBranch(null)}
                    className="text-slate-400 hover:text-white p-1"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-300 block">Nombre de la Sede:</label>
                    <input
                      type="text"
                      value={editingBranch.name}
                      onChange={(e) => setEditingBranch({ ...editingBranch, name: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-bold"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-300 block">Código:</label>
                    <input
                      type="text"
                      value={editingBranch.code}
                      onChange={(e) => setEditingBranch({ ...editingBranch, code: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-cyan-300 font-mono font-bold"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-300 block">Dirección:</label>
                    <input
                      type="text"
                      value={editingBranch.address}
                      onChange={(e) => setEditingBranch({ ...editingBranch, address: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-300 block">Teléfono:</label>
                    <input
                      type="text"
                      value={editingBranch.phone}
                      onChange={(e) => setEditingBranch({ ...editingBranch, phone: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-amber-300 font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setEditingBranch(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-cyan-500 text-slate-950 text-xs font-black"
                  >
                    Guardar Cambios
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🧪 TAB 2: CATÁLOGO LIS & VALORES DE REFERENCIA                             */}
      {/* ========================================================================= */}
      {adminTab === 'LIS_CATALOG' && (
        <div className="space-y-6">

          {/* Banner de Acceso al Catálogo Extendido LOINC 2.82 */}
          <div className="bg-gradient-to-r from-teal-950/80 via-slate-900 to-slate-950 p-6 rounded-3xl border border-teal-500/40 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-teal-400 font-mono text-xs font-black uppercase flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-teal-400" />
                <span>Motor de Mapeo Clínico • Estándar CLSI EP28-A3 & LOINC 2.82</span>
              </div>
              <h3 className="text-xl font-black text-white">Catálogo de Pruebas, Analitos & Valores de Referencia</h3>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                Configure los rangos de referencia normales para hombres y mujeres, unidades de reporte UCUM, tubos y recipientes, y límites de pánico que disparan alertas críticas al médico.
              </p>
            </div>

            <div className="flex items-center space-x-3 shrink-0">
              <button
                onClick={() => setIsCreatingTest(true)}
                className="px-4 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black rounded-xl text-xs transition cursor-pointer flex items-center space-x-2 shadow-lg shadow-teal-500/20"
              >
                <Plus className="w-4 h-4" />
                <span>Crear Nueva Prueba</span>
              </button>
              <button
                onClick={() => setActiveTab('test_catalog')}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition cursor-pointer flex items-center space-x-2 border border-slate-700"
              >
                <span>Abrir Catálogo Maestro Completo (1,420 Líneas)</span>
                <ChevronRight className="w-4 h-4 text-teal-400" />
              </button>
            </div>
          </div>

          {/* Buscador y Filtros */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/90 p-4 rounded-2xl border border-slate-800">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Buscar por código, LOINC o examen..."
                value={testSearch}
                onChange={(e) => setTestSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-slate-400 shrink-0" />
              <select
                value={testDeptFilter}
                onChange={(e) => setTestDeptFilter(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-cyan-400 cursor-pointer"
              >
                <option value="TODOS">Todas las Especialidades ({customTests.length})</option>
                <option value="Química Clínica">Química Clínica</option>
                <option value="Hematología">Hematología</option>
                <option value="Electrolitos">Electrolitos</option>
                <option value="Endocrinología">Endocrinología</option>
                <option value="Marcadores Cardíacos">Marcadores Cardíacos</option>
              </select>
            </div>
          </div>

          {/* Tabla Interactiva de Pruebas y Rangos */}
          <div className="bg-slate-900/90 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 font-mono text-[10px] uppercase border-b border-slate-800">
                  <tr>
                    <th className="p-4">Código / LOINC</th>
                    <th className="p-4">Nombre del Examen</th>
                    <th className="p-4">Especialidad</th>
                    <th className="p-4">Unidad</th>
                    <th className="p-4">Rango Hombres (M)</th>
                    <th className="p-4">Rango Mujeres (F)</th>
                    <th className="p-4">Límites Pánico (Crítico)</th>
                    <th className="p-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filteredTests.map((test) => (
                    <tr key={test.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-4 font-mono font-bold">
                        <span className="text-cyan-300 block">{test.code}</span>
                        <span className="text-[10px] text-slate-500">{test.loincCode}</span>
                      </td>
                      <td className="p-4">
                        <div className="font-black text-white">{test.name}</div>
                        <div className="text-[10px] text-slate-400">{test.tubeType}</div>
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                          {test.department}
                        </span>
                      </td>
                      <td className="p-4 font-mono font-bold text-amber-300">{test.unit}</td>
                      <td className="p-4 font-mono">
                        <span className="text-cyan-400 font-bold">{test.minMale} - {test.maxMale}</span>
                      </td>
                      <td className="p-4 font-mono">
                        <span className="text-pink-400 font-bold">{test.minFemale} - {test.maxFemale}</span>
                      </td>
                      <td className="p-4 font-mono text-[11px]">
                        {test.panicLow !== undefined && test.panicHigh !== undefined ? (
                          <div className="text-rose-400 font-bold flex items-center space-x-1">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                            <span>&lt; {test.panicLow} / &gt; {test.panicHigh}</span>
                          </div>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => setEditingTest(test)}
                          className="px-3 py-1.5 rounded-xl bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500 hover:text-slate-950 font-bold text-xs transition cursor-pointer border border-cyan-500/30"
                        >
                          Editar Valores
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Modal para Editar Prueba / Valores de Referencia */}
          {editingTest && (
            <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-cyan-500/40 rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="font-black text-white text-sm flex items-center space-x-2">
                    <Edit3 className="w-4 h-4 text-cyan-400" />
                    <span>Valores de Referencia: {editingTest.name}</span>
                  </h3>
                  <button onClick={() => setEditingTest(null)} className="text-slate-400 hover:text-white p-1">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="col-span-2 space-y-1">
                    <label className="font-bold text-slate-300 block">Nombre del Examen:</label>
                    <input
                      type="text"
                      value={editingTest.name}
                      onChange={(e) => setEditingTest({ ...editingTest, name: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-300 block">Unidad de Medida (UCUM):</label>
                    <input
                      type="text"
                      value={editingTest.unit}
                      onChange={(e) => setEditingTest({ ...editingTest, unit: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-amber-300 font-mono font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-300 block">Tubo / Recipiente:</label>
                    <input
                      type="text"
                      value={editingTest.tubeType}
                      onChange={(e) => setEditingTest({ ...editingTest, tubeType: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium"
                    />
                  </div>

                  {/* Rangos Hombres */}
                  <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/20 space-y-2">
                    <div className="font-bold text-cyan-300">Rango Hombres (M):</div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[10px] text-slate-400">Mínimo:</span>
                        <input
                          type="number"
                          step="any"
                          value={editingTest.minMale}
                          onChange={(e) => setEditingTest({ ...editingTest, minMale: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-cyan-300 font-mono"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400">Máximo:</span>
                        <input
                          type="number"
                          step="any"
                          value={editingTest.maxMale}
                          onChange={(e) => setEditingTest({ ...editingTest, maxMale: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-cyan-300 font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Rangos Mujeres */}
                  <div className="p-3 rounded-xl bg-pink-950/30 border border-pink-500/20 space-y-2">
                    <div className="font-bold text-pink-300">Rango Mujeres (F):</div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[10px] text-slate-400">Mínimo:</span>
                        <input
                          type="number"
                          step="any"
                          value={editingTest.minFemale}
                          onChange={(e) => setEditingTest({ ...editingTest, minFemale: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-pink-300 font-mono"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400">Máximo:</span>
                        <input
                          type="number"
                          step="any"
                          value={editingTest.maxFemale}
                          onChange={(e) => setEditingTest({ ...editingTest, maxFemale: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-pink-300 font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Límites Críticos de Pánico */}
                  <div className="col-span-2 p-3 rounded-xl bg-rose-950/30 border border-rose-500/20 space-y-2">
                    <div className="font-bold text-rose-300 flex items-center space-x-1.5">
                      <AlertTriangle className="w-4 h-4 text-rose-400" />
                      <span>Límites de Alerta de Pánico (Disparo de Alarma Inmediata):</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[10px] text-slate-400">Pánico Bajo (&lt;):</span>
                        <input
                          type="number"
                          step="any"
                          value={editingTest.panicLow ?? ''}
                          onChange={(e) => setEditingTest({ ...editingTest, panicLow: e.target.value ? parseFloat(e.target.value) : undefined })}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-rose-300 font-mono"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400">Pánico Alto (&gt;):</span>
                        <input
                          type="number"
                          step="any"
                          value={editingTest.panicHigh ?? ''}
                          onChange={(e) => setEditingTest({ ...editingTest, panicHigh: e.target.value ? parseFloat(e.target.value) : undefined })}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-rose-300 font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
                  <button onClick={() => setEditingTest(null)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold">
                    Cancelar
                  </button>
                  <button onClick={() => handleSaveReferenceTest(editingTest)} className="px-5 py-2 rounded-xl bg-teal-500 text-slate-950 text-xs font-black">
                    Guardar Valores
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal para Crear Nueva Prueba */}
          {isCreatingTest && (
            <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
              <form onSubmit={handleCreateNewTest} className="bg-slate-900 border border-teal-500/40 rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="font-black text-white text-sm flex items-center space-x-2">
                    <Plus className="w-4 h-4 text-teal-400" />
                    <span>Incorporar Nuevo Examen al Catálogo</span>
                  </h3>
                  <button type="button" onClick={() => setIsCreatingTest(false)} className="text-slate-400 hover:text-white p-1">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-300 block">Código Interno:</label>
                    <input
                      type="text"
                      placeholder="Ej. QCL-050"
                      value={newTestCode}
                      onChange={(e) => setNewTestCode(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-cyan-300 font-mono font-bold"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-300 block">Código LOINC:</label>
                    <input
                      type="text"
                      placeholder="Ej. 1751-7"
                      value={newTestLoinc}
                      onChange={(e) => setNewTestLoinc(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono font-bold"
                    />
                  </div>

                  <div className="col-span-2 space-y-1">
                    <label className="font-bold text-slate-300 block">Nombre Completo del Examen:</label>
                    <input
                      type="text"
                      placeholder="Ej. Albúmina Sérica"
                      value={newTestName}
                      onChange={(e) => setNewTestName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-bold"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-300 block">Especialidad / Sección:</label>
                    <select
                      value={newTestDept}
                      onChange={(e) => setNewTestDept(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-bold"
                    >
                      <option value="Química Clínica">Química Clínica</option>
                      <option value="Hematología">Hematología</option>
                      <option value="Electrolitos">Electrolitos</option>
                      <option value="Endocrinología">Endocrinología</option>
                      <option value="Inmunología">Inmunología</option>
                      <option value="Marcadores Cardíacos">Marcadores Cardíacos</option>
                      <option value="Uroanálisis">Uroanálisis</option>
                      <option value="Microbiología">Microbiología</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-300 block">Unidad (UCUM):</label>
                    <input
                      type="text"
                      placeholder="Ej. g/dL"
                      value={newTestUnit}
                      onChange={(e) => setNewTestUnit(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-amber-300 font-mono font-bold"
                      required
                    />
                  </div>

                  <div className="col-span-2 space-y-1">
                    <label className="font-bold text-slate-300 block">Tubo / Anticoagulante:</label>
                    <input
                      type="text"
                      value={newTestTube}
                      onChange={(e) => setNewTestTube(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                    />
                  </div>

                  {/* Rangos Hombres */}
                  <div className="space-y-1">
                    <label className="font-bold text-cyan-300 block">Hombres (Mín - Máx):</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input type="number" step="any" value={newTestMinM} onChange={(e) => setNewTestMinM(parseFloat(e.target.value))} className="bg-slate-950 border border-slate-700 rounded-lg p-2 text-cyan-300 font-mono" />
                      <input type="number" step="any" value={newTestMaxM} onChange={(e) => setNewTestMaxM(parseFloat(e.target.value))} className="bg-slate-950 border border-slate-700 rounded-lg p-2 text-cyan-300 font-mono" />
                    </div>
                  </div>

                  {/* Rangos Mujeres */}
                  <div className="space-y-1">
                    <label className="font-bold text-pink-300 block">Mujeres (Mín - Máx):</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input type="number" step="any" value={newTestMinF} onChange={(e) => setNewTestMinF(parseFloat(e.target.value))} className="bg-slate-950 border border-slate-700 rounded-lg p-2 text-pink-300 font-mono" />
                      <input type="number" step="any" value={newTestMaxF} onChange={(e) => setNewTestMaxF(parseFloat(e.target.value))} className="bg-slate-950 border border-slate-700 rounded-lg p-2 text-pink-300 font-mono" />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
                  <button type="button" onClick={() => setIsCreatingTest(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold">
                    Cancelar
                  </button>
                  <button type="submit" className="px-5 py-2.5 rounded-xl bg-teal-500 text-slate-950 text-xs font-black">
                    Registrar Examen
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* 🏥 TAB 3: SUITE HOSPITALARIA HIS & CENSO DE CAMAS                         */}
      {/* ========================================================================= */}
      {adminTab === 'HIS_BEDS' && (
        <div className="space-y-6">

          {/* Formulario de Alta de Camas Hospitalarias */}
          <form onSubmit={handleAddBed} className="bg-slate-900/90 p-6 rounded-3xl border border-slate-800 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-black text-white text-xs uppercase tracking-wider flex items-center space-x-2">
                <HeartPulse className="w-4 h-4 text-cyan-400" />
                <span>Gestor Maestro de Camas & Habitaciones Hospitalarias (ADT)</span>
              </h3>
              <span className="text-[10px] text-cyan-300 font-mono">Censo Dinámico HL7 ADT-A01</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-300 block">Código de Cama:</label>
                <input
                  type="text"
                  placeholder="Ej. UCI-103"
                  value={newBedCode}
                  onChange={(e) => setNewBedCode(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300 block">Sala / Habitación:</label>
                <input
                  type="text"
                  placeholder="Ej. Habitación 103"
                  value={newBedRoom}
                  onChange={(e) => setNewBedRoom(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300 block">Servicio / Ward:</label>
                <select
                  value={newBedDept}
                  onChange={(e) => setNewBedDept(e.target.value as HisBedItem['department'])}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                >
                  <option value="Urgencias">Urgencias</option>
                  <option value="UCI Adultos">UCI Adultos</option>
                  <option value="UCI Pediátrica">UCI Pediátrica</option>
                  <option value="Cirugía">Cirugía</option>
                  <option value="Maternidad">Maternidad</option>
                  <option value="Hospitalización">Hospitalización</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300 block">Piso / Ubicación:</label>
                <input
                  type="text"
                  placeholder="Ej. Piso 2"
                  value={newBedFloor}
                  onChange={(e) => setNewBedFloor(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300 block">Tipo de Cama:</label>
                <input
                  type="text"
                  value={newBedType}
                  onChange={(e) => setNewBedType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              className="py-2.5 px-6 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black rounded-xl text-xs transition cursor-pointer flex items-center space-x-2 shadow-md shadow-cyan-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>Agregar Cama al Censo Hospitalario</span>
            </button>
          </form>

          {/* Filtro y Lista de Camas */}
          <div className="bg-slate-900/90 p-6 rounded-3xl border border-slate-800 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-3">
              <h4 className="font-black text-white text-xs uppercase tracking-wider flex items-center space-x-2">
                <Building2 className="w-4 h-4 text-cyan-400" />
                <span>Censo Hospitalario Activo ({filteredBeds.length} Camas)</span>
              </h4>

              <div className="flex items-center space-x-2">
                <span className="text-xs text-slate-400">Filtrar Servicio:</span>
                <select
                  value={bedDeptFilter}
                  onChange={(e) => setBedDeptFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-bold cursor-pointer"
                >
                  <option value="TODOS">Todos los Servicios</option>
                  <option value="Urgencias">Urgencias</option>
                  <option value="UCI Adultos">UCI Adultos</option>
                  <option value="Cirugía">Cirugía</option>
                  <option value="Maternidad">Maternidad</option>
                  <option value="Hospitalización">Hospitalización</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {filteredBeds.map((bed) => {
                const statusStyles = {
                  DISPONIBLE: 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300',
                  OCUPADA: 'bg-blue-500/10 border-blue-500/40 text-blue-300',
                  DESINFECCION: 'bg-amber-500/10 border-amber-500/40 text-amber-300',
                  MANTENIMIENTO: 'bg-rose-500/10 border-rose-500/40 text-rose-300'
                };

                return (
                  <div
                    key={bed.id}
                    className="bg-slate-950 p-4 rounded-2xl border border-slate-800 hover:border-cyan-500/40 transition space-y-3 shadow-md flex flex-col justify-between"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-black text-white text-sm">{bed.code}</span>
                        <button
                          onClick={() => handleToggleBedStatus(bed.id)}
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wider cursor-pointer ${statusStyles[bed.status]}`}
                          title="Click para alternar estado"
                        >
                          {bed.status}
                        </button>
                      </div>

                      <div className="text-xs font-bold text-cyan-300">{bed.department} • {bed.floor}</div>
                      <div className="text-[11px] text-slate-400">{bed.roomNumber}</div>
                      <div className="text-[10px] text-slate-500 leading-snug">{bed.bedType}</div>

                      {bed.patientName && (
                        <div className="mt-2 p-2 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-white font-medium">
                          👤 {bed.patientName}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-900">
                      <span className="text-[10px] text-slate-500">Click estado para rotar</span>
                      <button
                        onClick={() => handleDeleteBed(bed.id)}
                        className="p-1 text-slate-500 hover:text-rose-400 transition cursor-pointer"
                        title="Eliminar Cama"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 🩸 TAB 4: CONFIGURACIÓN BANCO DE SANGRE                                   */}
      {/* ========================================================================= */}
      {adminTab === 'BLOOD_BANK' && (
        <div className="space-y-6">

          {/* Reglas de Hemocomponentes */}
          <div className="bg-slate-900/90 p-6 rounded-3xl border border-slate-800 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-black text-white text-xs uppercase tracking-wider flex items-center space-x-2">
                <Droplets className="w-4 h-4 text-rose-400" />
                <span>Vida Media, Conservación & Parámetros ISBT 128 de Hemocomponentes</span>
              </h3>
              <span className="text-[10px] font-mono text-rose-300 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/30">
                Reglamentación MINSA Panamá
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {bloodRules.map((comp) => (
                <div key={comp.id} className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3 shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-white text-xs truncate max-w-[180px]">{comp.name}</span>
                    <span className="font-mono text-[10px] text-cyan-300 bg-cyan-500/20 px-2 py-0.5 rounded">
                      {comp.code}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Vida Media (Caducidad):</span>
                      <div className="flex items-center space-x-1">
                        <input
                          type="number"
                          value={comp.shelfLifeDays}
                          onChange={(e) => handleUpdateBloodRule(comp.id, parseInt(e.target.value) || 0, comp.minStockThreshold)}
                          className="w-16 bg-slate-900 border border-slate-700 rounded-lg p-1 text-center font-mono font-bold text-white text-xs"
                        />
                        <span className="text-slate-400">días</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Temperatura Exigida:</span>
                      <span className="font-mono font-bold text-cyan-300">{comp.tempRange}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Umbral Stock Mínimo:</span>
                      <input
                        type="number"
                        value={comp.minStockThreshold}
                        onChange={(e) => handleUpdateBloodRule(comp.id, comp.shelfLifeDays, parseInt(e.target.value) || 0)}
                        className="w-16 bg-slate-900 border border-slate-700 rounded-lg p-1 text-center font-mono font-bold text-amber-300 text-xs"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Protocolo de Tamizaje Serológico Obligatorio MINSA */}
          <div className="bg-slate-900/90 p-6 rounded-3xl border border-slate-800 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="font-black text-white text-xs uppercase tracking-wider flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Panel de Serología Obligatoria y Tamizaje Infeccioso (Bloqueo Inmediato 0ms)</span>
              </h4>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                Ley Nacional de Sangre
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              {[
                { id: 'hiv', label: 'VIH-1/2 (Ag p24 + Ac)', desc: 'Tamizaje Combo 4ta Gen' },
                { id: 'hbv', label: 'Hepatitis B (HBsAg + Anti-HBc)', desc: 'Core + Superficie' },
                { id: 'hcv', label: 'Hepatitis C (Anti-HCV)', desc: 'Anticuerpos Totales' },
                { id: 'chagas', label: 'Chagas (T. cruzi)', desc: 'Antígenos Recombinantes' },
                { id: 'syphilis', label: 'Sífilis (Treponema / VDRL)', desc: 'Reagínica & Treponémica' },
                { id: 'htlv', label: 'HTLV-I/II', desc: 'Virus Linfotrópico' },
                { id: 'malaria', label: 'Malária (Plasmodium)', desc: 'Frotis / Inmunoensayo' },
                { id: 'natRequired', label: 'NAT (PCR Ácidos Nucleicos)', desc: 'Obligatorio en Unidades' }
              ].map((marker) => (
                <div
                  key={marker.id}
                  onClick={() => setMandatorySerology({ ...mandatorySerology, [marker.id]: !mandatorySerology[marker.id] })}
                  className={`p-3.5 rounded-2xl border transition cursor-pointer space-y-1 ${
                    mandatorySerology[marker.id]
                      ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs">{marker.label}</span>
                    <span className={`w-2.5 h-2.5 rounded-full ${mandatorySerology[marker.id] ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`}></span>
                  </div>
                  <div className="text-[10px] text-slate-400">{marker.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Cadena de Frío IoT y Sensores */}
          <div className="bg-slate-900/90 p-6 rounded-3xl border border-slate-800 space-y-4 shadow-xl">
            <h4 className="font-black text-white text-xs uppercase tracking-wider flex items-center space-x-2 border-b border-slate-800 pb-3">
              <Thermometer className="w-4 h-4 text-cyan-400" />
              <span>Monitoreo Térmico IoT de Congeladores & Agitadores</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {bloodFreezers.map((freezer) => (
                <div key={freezer.id} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs truncate max-w-[170px]">{freezer.name}</span>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded">
                      {freezer.status}
                    </span>
                  </div>
                  <div className="text-2xl font-mono font-black text-cyan-300">{freezer.currentTemp.toFixed(1)}°C</div>
                  <div className="text-[11px] text-slate-400 space-y-1 font-mono">
                    <div>Setpoint: <strong className="text-white">{freezer.setpointTemp}°C</strong></div>
                    <div>Alarma: <strong className="text-amber-300">{freezer.minAlarmTemp}°C a {freezer.maxAlarmTemp}°C</strong></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 👥 TAB 5: USUARIOS & SEGURIDAD SUPABASE                                   */}
      {/* ========================================================================= */}
      {adminTab === 'USERS' && (
        <div className="space-y-6">
          {userCreatedSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center space-x-2">
              <CheckCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>{userCreatedSuccess}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* Formulario de Creación de Usuario */}
            <form onSubmit={handleCreateRealUser} className="lg:col-span-5 bg-slate-900/90 p-6 rounded-3xl border border-slate-800 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center space-x-2">
                  <UserPlus className="w-4 h-4 text-cyan-400" />
                  <span>Nuevo Usuario Clínico</span>
                </h4>
                <span className="text-[10px] font-mono text-cyan-300 bg-cyan-500/20 px-2 py-0.5 rounded border border-cyan-500/30">
                  Alta Inmediata
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300 block">Nombre Completo del Profesional:</label>
                  <input
                    type="text"
                    placeholder="ej. Lic. Andrea Villalobos"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-bold focus:outline-none focus:border-cyan-400"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300 block">Correo Electrónico Real:</label>
                  <input
                    type="email"
                    placeholder="andrea.villalobos@labsanjose.com"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-bold focus:outline-none focus:border-cyan-400"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-300 block">Contraseña:</label>
                    <input
                      type="password"
                      placeholder="Mínimo 5 caracteres"
                      value={newUserPassword}
                      onChange={(e) => setNewUserPassword(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono font-bold focus:outline-none focus:border-cyan-400"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-300 block">PIN Firma (4D):</label>
                    <input
                      type="password"
                      maxLength={4}
                      placeholder="ej. 8821"
                      value={newUserPin}
                      onChange={(e) => setNewUserPin(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-amber-300 font-mono font-black text-center focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-300 block">Rol Clínico:</label>
                    <select
                      value={newUserRole}
                      onChange={(e) => setNewUserRole(e.target.value as Role)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-cyan-400"
                    >
                      <option value="owner">Directora / Gerencia</option>
                      <option value="lab_chief">Jefe de Laboratorio</option>
                      <option value="tech_med">Tecnólogo Médico</option>
                      <option value="lab_tech">Técnico / Flebotomía</option>
                      <option value="receptionist">Recepción & Admisión</option>
                      <option value="ext_doctor">Médico Externo</option>
                      <option value="abregotech_admin">Programador Senior / Súper-Admin (Acceso Total)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-300 block">Idoneidad MINSA:</label>
                    <input
                      type="text"
                      placeholder="TM-7214-PA"
                      value={newUserLicense}
                      onChange={(e) => setNewUserLicense(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-amber-300 font-mono font-bold focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300 block">Laboratorio / Sede:</label>
                  <select
                    value={newUserTenant}
                    onChange={(e) => setNewUserTenant(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-cyan-400"
                  >
                    {tenants.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black rounded-xl text-xs transition cursor-pointer flex items-center justify-center space-x-2 shadow-lg shadow-cyan-500/20"
              >
                <UserPlus className="w-4 h-4" />
                <span>Registrar Usuario Clínico</span>
              </button>
            </form>

            {/* Lista de Usuarios Registrados */}
            <div className="lg:col-span-7 bg-slate-900/90 p-6 rounded-3xl border border-slate-800 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center space-x-2">
                  <Users className="w-4 h-4 text-cyan-400" />
                  <span>Usuarios Activos en la Base de Datos ({realUsers.length})</span>
                </h4>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                  Cifrado SHA-256 / JWT
                </span>
              </div>

              <div className="max-h-[460px] overflow-y-auto space-y-2 pr-1">
                {realUsers.map((u) => (
                  <div
                    key={u.id}
                    className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-cyan-500/40 transition flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="font-black text-white truncate">{u.name}</span>
                        <span className="text-[10px] font-mono bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded font-bold">
                          {u.role}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono truncate">{u.email}</div>
                      <div className="text-[10px] text-amber-300 font-mono flex items-center space-x-3">
                        {u.licenseNumber && <span>Idoneidad: {u.licenseNumber}</span>}
                        <span>PIN: {u.pinCode || '1234'}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteRealUser(u.id)}
                      className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition cursor-pointer"
                      title="Eliminar usuario"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🌐 TAB 6: PUERTOS & ENRUTADOR DEDICADO                                    */}
      {/* ========================================================================= */}
      {adminTab === 'PORTS' && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">
                    Portales Públicos con Puerto Dedicado Independiente
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Cada portal cuenta con su puerto de red específico para acceso público, intranet o redirección de firewall
                  </p>
                </div>
              </div>

              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full font-bold">
                ✓ Enrutador Multi-Puerto Activo (3000, 3001, 3002, 3003)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Puerto 3001: Pacientes */}
              <div className="bg-slate-950 p-5 rounded-2xl border border-cyan-500/30 hover:border-cyan-400 space-y-4 transition flex flex-col justify-between shadow-xl">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      <Users className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-mono font-black bg-cyan-500/20 text-cyan-300 px-2.5 py-1 rounded-lg border border-cyan-500/40">
                      PUERTO 3001
                    </span>
                  </div>
                  <h4 className="text-xs font-black text-white uppercase tracking-wider">Portal Público de Pacientes</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Descarga de resultados en PDF con firma digital Ley 81, consulta por Cédula/Orden y envío a WhatsApp.
                  </p>
                  <div className="bg-slate-900 p-2.5 rounded-xl font-mono text-[11px] text-cyan-300 break-all border border-slate-800 flex items-center justify-between">
                    <span>{patientPortalUrl}</span>
                    <button
                      onClick={() => handleCopyLink(patientPortalUrl, 'Portal de Pacientes')}
                      className="p-1 text-slate-400 hover:text-white cursor-pointer ml-1"
                    >
                      {copiedLink === 'Portal de Pacientes' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <a
                    href={patientPortalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs rounded-xl transition cursor-pointer flex items-center justify-center space-x-2 shadow-md shadow-cyan-500/20"
                  >
                    <span>Puerto 3001 (Dedicado)</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Puerto 3002: Médicos */}
              <div className="bg-slate-950 p-5 rounded-2xl border border-indigo-500/30 hover:border-indigo-400 space-y-4 transition flex flex-col justify-between shadow-xl">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      <Stethoscope className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-mono font-black bg-indigo-500/20 text-indigo-300 px-2.5 py-1 rounded-lg border border-indigo-500/40">
                      PUERTO 3002
                    </span>
                  </div>
                  <h4 className="text-xs font-black text-white uppercase tracking-wider">Portal de Médicos Referentes</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Expedientes de pacientes remitidos, firma electrónica médica, descarga masiva y trazabilidad acumulativa.
                  </p>
                  <div className="bg-slate-900 p-2.5 rounded-xl font-mono text-[11px] text-indigo-300 break-all border border-slate-800 flex items-center justify-between">
                    <span>{doctorPortalUrl}</span>
                    <button
                      onClick={() => handleCopyLink(doctorPortalUrl, 'Portal de Médicos')}
                      className="p-1 text-slate-400 hover:text-white cursor-pointer ml-1"
                    >
                      {copiedLink === 'Portal de Médicos' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <a
                    href={doctorPortalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs rounded-xl transition cursor-pointer flex items-center justify-center space-x-2 shadow-md shadow-indigo-600/20"
                  >
                    <span>Puerto 3002 (Dedicado)</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Puerto 3003: Súper Admin */}
              <div className="bg-slate-950 p-5 rounded-2xl border border-emerald-500/30 hover:border-emerald-400 space-y-4 transition flex flex-col justify-between shadow-xl">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      <Shield className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-mono font-black bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-lg border border-emerald-500/40">
                      PUERTO 3003
                    </span>
                  </div>
                  <h4 className="text-xs font-black text-white uppercase tracking-wider">Consola Súper-Admin SaaS</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Gestión de laboratorios clientes, multisede, catálogo LIS, valores de referencia, HIS y banco de sangre.
                  </p>
                  <div className="bg-slate-900 p-2.5 rounded-xl font-mono text-[11px] text-emerald-300 break-all border border-slate-800 flex items-center justify-between">
                    <span>{superAdminUrl}</span>
                    <button
                      onClick={() => handleCopyLink(superAdminUrl, 'Consola SuperAdmin')}
                      className="p-1 text-slate-400 hover:text-white cursor-pointer ml-1"
                    >
                      {copiedLink === 'Consola SuperAdmin' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <a
                    href={superAdminUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl transition cursor-pointer flex items-center justify-center space-x-2 shadow-md shadow-emerald-500/20"
                  >
                    <span>Puerto 3003 (Dedicado)</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
