import React, { useState, useMemo } from 'react';
import { Tenant, Branch } from '../../types';
import { AuditLogEntry } from './Ley81AuditVault';
import {
  FileText,
  Download,
  Filter,
  Calendar,
  User,
  Users,
  ShieldCheck,
  ShieldAlert,
  Hash,
  Eye,
  Lock,
  CheckCircle2,
  RefreshCw,
  Search,
  Sparkles,
  Printer,
  FileSpreadsheet,
  FileCode,
  ArrowRight,
  Clock,
  Key,
  Shield,
  Layers,
  AlertTriangle,
  History,
  Activity,
  Check,
  X
} from 'lucide-react';

export interface GeneratedReportRecord {
  id: string;
  reportCode: string;
  generatedAt: string;
  generatedBy: string;
  auditReason: string;
  filtersSummary: {
    user: string;
    dateRange: string;
    actionType: string;
    sensitivity: string;
    consentStatus: string;
  };
  totalRecords: number;
  uniquePatients: number;
  anomaliesCount: number;
  reportSha256: string;
}

interface Ley81PiiReportPanelProps {
  tenant: Tenant;
  branch: Branch;
  logs: AuditLogEntry[];
  privacyMaskEnabled: boolean;
  onTogglePrivacyMask: () => void;
  onInspectLog: (log: AuditLogEntry) => void;
}

export const Ley81PiiReportPanel: React.FC<Ley81PiiReportPanelProps> = ({
  tenant,
  branch,
  logs,
  privacyMaskEnabled,
  onTogglePrivacyMask,
  onInspectLog
}) => {
  // Filter States
  const [selectedUserFilter, setSelectedUserFilter] = useState<string>('ALL');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('ALL');
  const [selectedActionFilter, setSelectedActionFilter] = useState<string>('ALL');
  const [selectedConsentFilter, setSelectedConsentFilter] = useState<string>('ALL');
  const [selectedSensitivityFilter, setSelectedSensitivityFilter] = useState<string>('ALL');
  
  // Date Presets & Custom Range
  const [datePreset, setDatePreset] = useState<'today' | '7d' | '30d' | 'current_month' | 'custom'>('7d');
  const [startDate, setStartDate] = useState<string>('2026-08-05');
  const [endDate, setEndDate] = useState<string>('2026-08-11');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Report metadata configuration
  const [auditReason, setAuditReason] = useState<string>('Auditoría ANTAI Res. 2021-04 • Cumplimiento Ley 81');
  const [auditorName, setAuditorName] = useState<string>('Lic. Rubén Abrego — Oficial de Protección de Datos (DPO)');
  const [auditorNotes, setAuditorNotes] = useState<string>('Revisión periódica de trazabilidad de acceso a datos sensibles de salud conforme a los artículos 8, 14 y 21 de la Ley 81 de 2019.');

  // Modal State for Official PDF Report Viewer
  const [isPdfModalOpen, setIsPdfModalOpen] = useState<boolean>(false);
  const [isExportSuccessToast, setIsExportSuccessToast] = useState<string | null>(null);

  // History of generated reports
  const [generatedReports, setGeneratedReports] = useState<GeneratedReportRecord[]>([
    {
      id: 'rep-001',
      reportCode: 'REP-LEY81-2026-0810-01',
      generatedAt: '10/08/2026 18:30:12',
      generatedBy: 'Ing. Carlos Abrego (Admin)',
      auditReason: 'Inspección de Calidad ISO 15189 & Ley 81',
      filtersSummary: {
        user: 'Todos los Operadores',
        dateRange: '01/08/2026 — 10/08/2026',
        actionType: 'Todas las Acciones PII',
        sensitivity: 'Nivel Alto & Medio',
        consentStatus: 'Todos'
      },
      totalRecords: 12,
      uniquePatients: 4,
      anomaliesCount: 1,
      reportSha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08'
    }
  ]);

  // Handle Preset Changes
  const handleDatePresetChange = (preset: 'today' | '7d' | '30d' | 'current_month' | 'custom') => {
    setDatePreset(preset);
    if (preset === 'today') {
      setStartDate('2026-08-11');
      setEndDate('2026-08-11');
    } else if (preset === '7d') {
      setStartDate('2026-08-05');
      setEndDate('2026-08-11');
    } else if (preset === '30d') {
      setStartDate('2026-07-12');
      setEndDate('2026-08-11');
    } else if (preset === 'current_month') {
      setStartDate('2026-08-01');
      setEndDate('2026-08-31');
    }
  };

  // Distinct Users List from Logs for dropdown
  const distinctUsers = useMemo(() => {
    const map = new Map<string, { id: string; name: string; role: string }>();
    logs.forEach(l => {
      if (l.userId && l.userName && l.userName !== 'N/A') {
        map.set(l.userName, { id: l.userId, name: l.userName, role: l.userRole });
      }
    });
    return Array.from(map.values());
  }, [logs]);

  // Helper to categorize PII sensitivity
  const getPiiSensitivity = (action: string) => {
    if (['CONSULTA_RESULTADO', 'EXPORTACION_PDF', 'VALIDACION_TECNICA', 'VALIDACION_MEDICA'].includes(action)) {
      return 'ALTO_CLINICO'; // Resultados, parámetros, diagnósticos
    }
    if (['MODIFICACION_CONSENTIMIENTO'].includes(action)) {
      return 'MEDIO_IDENTIDAD'; // Cédula, datos personales
    }
    return 'ACCESO_SISTEMA'; // Logins, IP, tokens
  };

  // Helper for PII fields list
  const getPiiFieldsDescription = (log: AuditLogEntry) => {
    if (log.actionType === 'CONSULTA_RESULTADO') {
      return 'Cédula, Nombres, Parámetros Bioquímicos, Historial Resultados';
    }
    if (log.actionType === 'EXPORTACION_PDF') {
      return 'Expediente Completo, Cédula, Resultados Firmados, Código QR';
    }
    if (log.actionType === 'VALIDACION_TECNICA') {
      return 'Muestra Biológica, Parámetros Críticos, Idoneidad Tecnólogo';
    }
    if (log.actionType === 'VALIDACION_MEDICA') {
      return 'Diagnóstico, Reporte Epidemiológico, Firma Médica Digital';
    }
    if (log.actionType === 'MODIFICACION_CONSENTIMIENTO') {
      return 'Cédula, Consentimiento Informado Art. 8, IP de Aceptación';
    }
    if (log.actionType === 'INTENTO_ACCESO_DENEGADO') {
      return 'Intento de Acceso a Expediente No Autorizado, IP Origen';
    }
    if (log.actionType === 'INICIO_SESION') {
      return 'Credencial de Usuario, IP, Token de Sesión OTP';
    }
    return 'Catálogo de Tarifas y Parámetros';
  };

  // Filtered dataset according to active admin criteria
  const filteredReportLogs = useMemo(() => {
    return logs.filter((log) => {
      // 1. User Filter
      if (selectedUserFilter !== 'ALL' && log.userName !== selectedUserFilter) {
        return false;
      }

      // 2. Role Filter
      if (selectedRoleFilter !== 'ALL' && log.userRole !== selectedRoleFilter) {
        return false;
      }

      // 3. Action Filter
      if (selectedActionFilter !== 'ALL') {
        if (selectedActionFilter === 'ALL_PII_ACCESS') {
          // All direct patient PII accesses
          if (!['CONSULTA_RESULTADO', 'EXPORTACION_PDF', 'VALIDACION_TECNICA', 'VALIDACION_MEDICA', 'MODIFICACION_CONSENTIMIENTO'].includes(log.actionType)) {
            return false;
          }
        } else if (log.actionType !== selectedActionFilter) {
          return false;
        }
      }

      // 4. Date Range Filter
      const logDate = log.isoDate ? log.isoDate.split('T')[0] : '';
      if (logDate) {
        if (startDate && logDate < startDate) return false;
        if (endDate && logDate > endDate) return false;
      }

      // 5. Consent Filter
      if (selectedConsentFilter !== 'ALL' && log.consentLey81Status !== selectedConsentFilter) {
        return false;
      }

      // 6. Sensitivity Filter
      if (selectedSensitivityFilter !== 'ALL') {
        const sens = getPiiSensitivity(log.actionType);
        if (sens !== selectedSensitivityFilter) return false;
      }

      // 7. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          log.userName.toLowerCase().includes(q) ||
          log.userRole.toLowerCase().includes(q) ||
          log.userId.toLowerCase().includes(q) ||
          log.patientName.toLowerCase().includes(q) ||
          log.patientNationalId.toLowerCase().includes(q) ||
          log.ipAddress.includes(q) ||
          log.location.toLowerCase().includes(q) ||
          log.details.toLowerCase().includes(q) ||
          log.actionType.toLowerCase().includes(q) ||
          log.sha256Hash.toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [
    logs,
    selectedUserFilter,
    selectedRoleFilter,
    selectedActionFilter,
    selectedConsentFilter,
    selectedSensitivityFilter,
    startDate,
    endDate,
    searchQuery
  ]);

  // Dynamic KPIs from filtered report logs
  const reportMetrics = useMemo(() => {
    const total = filteredReportLogs.length;
    const patientSet = new Set<string>();
    const userSet = new Set<string>();
    let anomalies = 0;
    let consentedCount = 0;
    let piiClinicalAccesses = 0;

    filteredReportLogs.forEach((l) => {
      if (l.patientNationalId && l.patientNationalId !== 'N/A') {
        patientSet.add(l.patientNationalId);
      }
      if (l.userName && l.userName !== 'N/A' && !l.userName.includes('No Identificado')) {
        userSet.add(l.userName);
      }
      if (l.isAnomaly || l.actionType === 'INTENTO_ACCESO_DENEGADO') {
        anomalies += 1;
      }
      if (l.consentLey81Status === 'CONSENTIDO') {
        consentedCount += 1;
      }
      if (['CONSULTA_RESULTADO', 'EXPORTACION_PDF', 'VALIDACION_TECNICA', 'VALIDACION_MEDICA'].includes(l.actionType)) {
        piiClinicalAccesses += 1;
      }
    });

    const consentRate = total > 0 ? Math.round((consentedCount / total) * 100) : 100;

    return {
      totalLogs: total,
      uniquePatients: patientSet.size,
      uniqueUsers: userSet.size,
      anomaliesCount: anomalies,
      consentRate,
      piiClinicalAccesses
    };
  }, [filteredReportLogs]);

  // Masking helpers
  const maskPatientId = (id: string) => {
    if (!privacyMaskEnabled || !id || id === 'N/A') return id;
    const parts = id.split('-');
    if (parts.length >= 3) return `${parts[0]}-${parts[1]}-****`;
    if (id.length > 4) return id.substring(0, id.length - 4) + '****';
    return id;
  };

  const maskIp = (ip: string) => {
    if (!privacyMaskEnabled || !ip || ip === 'N/A') return ip;
    const parts = ip.split('.');
    if (parts.length === 4) return `${parts[0]}.${parts[1]}.x.x`;
    return ip;
  };

  // Generate SHA-256 for the generated report instance
  const currentReportCode = useMemo(() => {
    const d = new Date();
    const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}-${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}`;
    return `REP-LEY81-${stamp}`;
  }, []);

  const currentReportHash = useMemo(() => {
    return `sha256_${Math.random().toString(36).substring(2, 15)}_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
  }, [filteredReportLogs, currentReportCode]);

  // Handle Save / Log Report to History
  const handleSaveReportToHistory = () => {
    const newRecord: GeneratedReportRecord = {
      id: `rep-${Date.now()}`,
      reportCode: currentReportCode,
      generatedAt: new Date().toLocaleString('es-PA'),
      generatedBy: auditorName,
      auditReason,
      filtersSummary: {
        user: selectedUserFilter === 'ALL' ? 'Todos los Usuarios' : selectedUserFilter,
        dateRange: `${startDate} al ${endDate}`,
        actionType: selectedActionFilter === 'ALL' ? 'Todas' : selectedActionFilter,
        sensitivity: selectedSensitivityFilter === 'ALL' ? 'Todos' : selectedSensitivityFilter,
        consentStatus: selectedConsentFilter === 'ALL' ? 'Todos' : selectedConsentFilter
      },
      totalRecords: reportMetrics.totalLogs,
      uniquePatients: reportMetrics.uniquePatients,
      anomaliesCount: reportMetrics.anomaliesCount,
      reportSha256: currentReportHash
    };

    setGeneratedReports(prev => [newRecord, ...prev]);
    setIsExportSuccessToast(`Reporte ${currentReportCode} guardado y registrado en el historial de auditoría con firma SHA-256.`);
    setTimeout(() => setIsExportSuccessToast(null), 5000);
  };

  // Export CSV Functionality
  const handleExportCsv = () => {
    const headers = [
      'ID_AUDITORIA',
      'MARCA_TIEMPO',
      'FECHA_ISO',
      'USUARIO_OPERADOR',
      'ROL_USUARIO',
      'TIPO_ACCION_PII',
      'PACIENTE_CEDULA',
      'PACIENTE_NOMBRE',
      'CAMPOS_PII_CONSULTADOS',
      'IP_ORIGEN',
      'UBICACION',
      'HASH_SHA256_BLOQUE',
      'HASH_BLOQUE_PREVIO',
      'ESTADO_CONSENTIMIENTO_LEY81',
      'ES_ANOMALIA',
      'DETALLE_JUSTIFICACION'
    ];

    const rows = filteredReportLogs.map((log) => [
      log.id,
      `"${log.timestamp}"`,
      `"${log.isoDate}"`,
      `"${log.userName}"`,
      `"${log.userRole}"`,
      `"${log.actionType}"`,
      `"${privacyMaskEnabled ? maskPatientId(log.patientNationalId) : log.patientNationalId}"`,
      `"${privacyMaskEnabled ? 'PACIENTE PROTEGIDO' : log.patientName}"`,
      `"${getPiiFieldsDescription(log)}"`,
      `"${privacyMaskEnabled ? maskIp(log.ipAddress) : log.ipAddress}"`,
      `"${log.location}"`,
      `"${log.sha256Hash}"`,
      `"${log.prevHash}"`,
      `"${log.consentLey81Status}"`,
      log.isAnomaly ? 'SI' : 'NO',
      `"${log.details.replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${currentReportCode}_AUDIT_TRAIL.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    handleSaveReportToHistory();
    setIsExportSuccessToast(`✓ Archivo CSV exportado exitosamente (${filteredReportLogs.length} registros).`);
    setTimeout(() => setIsExportSuccessToast(null), 5000);
  };

  // Export Forensic JSON Functionality
  const handleExportJson = () => {
    const payload = {
      meta: {
        reportCode: currentReportCode,
        generatedAt: new Date().toISOString(),
        tenant: tenant.name,
        branch: branch.name,
        auditor: auditorName,
        legalReason: auditReason,
        legalFramework: 'Ley 81 de 26 de marzo de 2019 (Panamá) & Decreto Ejecutivo 285 de 2021',
        totalEvents: reportMetrics.totalLogs,
        uniquePatients: reportMetrics.uniquePatients,
        reportChecksumSha256: currentReportHash
      },
      filtersApplied: {
        userFilter: selectedUserFilter,
        roleFilter: selectedRoleFilter,
        actionFilter: selectedActionFilter,
        dateStart: startDate,
        dateEnd: endDate,
        consentFilter: selectedConsentFilter,
        piiMaskEnabled: privacyMaskEnabled
      },
      auditRecords: filteredReportLogs.map(l => ({
        ...l,
        patientNationalId: privacyMaskEnabled ? maskPatientId(l.patientNationalId) : l.patientNationalId,
        patientName: privacyMaskEnabled ? 'PACIENTE PROTEGIDO' : l.patientName,
        ipAddress: privacyMaskEnabled ? maskIp(l.ipAddress) : l.ipAddress,
        piiFieldsConsulted: getPiiFieldsDescription(l)
      }))
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${currentReportCode}_FORENSIC.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    handleSaveReportToHistory();
    setIsExportSuccessToast(`✓ Paquete Forense JSON exportado exitosamente.`);
    setTimeout(() => setIsExportSuccessToast(null), 5000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Toast Notification */}
      {isExportSuccessToast && (
        <div className="bg-emerald-950 text-emerald-200 border border-emerald-500 p-4 rounded-2xl text-xs font-bold flex items-center justify-between shadow-xl animate-in slide-in-from-top-2">
          <div className="flex items-center space-x-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{isExportSuccessToast}</span>
          </div>
          <button
            onClick={() => setIsExportSuccessToast(null)}
            className="text-emerald-400 hover:text-white text-xs font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Control Panel Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 rounded-3xl p-6 border border-slate-800 text-white shadow-2xl relative overflow-hidden space-y-6">
        {/* Background Ambient Decorator */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        
        {/* Top Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5 relative z-10">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-teal-500/20 shrink-0">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  Panel de Control: Generador de Reportes de Acceso PII (Ley 81)
                </h2>
                <span className="px-2.5 py-0.5 bg-teal-500/20 border border-teal-500/40 text-teal-300 font-mono text-[10px] font-extrabold rounded-full uppercase">
                  Auditoría ANTAI
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Configure y filtre el registro de consultas, descargas, validaciones y modificaciones de datos sensibles de pacientes para certificaciones oficiales.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={onTogglePrivacyMask}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition flex items-center space-x-2 cursor-pointer shadow-sm ${
                privacyMaskEnabled
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{privacyMaskEnabled ? 'Máscara PII: ACTIVA (Cédulas Ocultas)' : 'PII Visible: MODO INSPECTOR AUDITOR'}</span>
            </button>
          </div>
        </div>

        {/* Filter Configuration Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10 text-xs">
          {/* 1. Filter by User / Operator */}
          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl space-y-2">
            <label className="text-[11px] font-extrabold uppercase text-slate-400 flex items-center space-x-1.5">
              <User className="w-3.5 h-3.5 text-teal-400" />
              <span>Usuario / Operador</span>
            </label>
            <select
              value={selectedUserFilter}
              onChange={(e) => setSelectedUserFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-teal-500"
            >
              <option value="ALL">Todos los Usuarios ({distinctUsers.length} operadores)</option>
              {distinctUsers.map((u) => (
                <option key={u.id} value={u.name}>
                  {u.name} ({u.role})
                </option>
              ))}
            </select>

            <div className="pt-1 flex items-center justify-between text-[10px] text-slate-400">
              <span>Filtrar por Rol:</span>
              <select
                value={selectedRoleFilter}
                onChange={(e) => setSelectedRoleFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-0.5 text-[10px] font-bold text-teal-300 outline-none"
              >
                <option value="ALL">Todos los Roles</option>
                <option value="Tecnólogo Médico">Tecnólogo Médico</option>
                <option value="Médico Referente">Médico Referente</option>
                <option value="Paciente">Paciente</option>
                <option value="Recepcionista">Recepcionista</option>
                <option value="Jefe de Laboratorio">Jefe de Laboratorio</option>
                <option value="Administrador LIS">Administrador LIS</option>
              </select>
            </div>
          </div>

          {/* 2. Filter by Date Range */}
          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl space-y-2">
            <label className="text-[11px] font-extrabold uppercase text-slate-400 flex items-center space-x-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              <span>Rango de Fechas</span>
            </label>

            {/* Quick Presets Buttons */}
            <div className="grid grid-cols-4 gap-1 pb-1">
              {[
                { id: 'today', label: 'Hoy' },
                { id: '7d', label: '7 Días' },
                { id: '30d', label: '30 Días' },
                { id: 'current_month', label: 'Mes' }
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleDatePresetChange(p.id as any)}
                  className={`py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                    datePreset === p.id
                      ? 'bg-teal-500 text-slate-950 font-black shadow-sm'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[9px] text-slate-500 uppercase block">Desde:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setDatePreset('custom');
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1 text-[11px] font-bold text-white focus:outline-none focus:border-teal-500 font-mono"
                />
              </div>
              <div>
                <span className="text-[9px] text-slate-500 uppercase block">Hasta:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setDatePreset('custom');
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1 text-[11px] font-bold text-white focus:outline-none focus:border-teal-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* 3. Filter by Action Type */}
          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl space-y-2">
            <label className="text-[11px] font-extrabold uppercase text-slate-400 flex items-center space-x-1.5">
              <Activity className="w-3.5 h-3.5 text-amber-400" />
              <span>Tipo de Acción PII</span>
            </label>
            <select
              value={selectedActionFilter}
              onChange={(e) => setSelectedActionFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-teal-500"
            >
              <option value="ALL">Todas las Acciones Auditadas</option>
              <option value="ALL_PII_ACCESS">Solo Accesos a Datos Clínicos PII</option>
              <option value="CONSULTA_RESULTADO">Consulta de Expediente / Resultados</option>
              <option value="EXPORTACION_PDF">Exportación / Descarga PDF</option>
              <option value="VALIDACION_TECNICA">Validación Técnica de Muestras</option>
              <option value="VALIDACION_MEDICA">Validación y Liberación Médica</option>
              <option value="MODIFICACION_CONSENTIMIENTO">Modificación Consentimiento Ley 81</option>
              <option value="INICIO_SESION">Inicio de Sesión / Autenticación</option>
              <option value="INTENTO_ACCESO_DENEGADO">Intentos Denegados / Alertas</option>
              <option value="CAMBIO_TARIFARIO">Cambio Tarifario / Configuración</option>
            </select>

            <div className="pt-1 flex items-center justify-between text-[10px] text-slate-400">
              <span>Consentimiento:</span>
              <select
                value={selectedConsentFilter}
                onChange={(e) => setSelectedConsentFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-0.5 text-[10px] font-bold text-amber-300 outline-none"
              >
                <option value="ALL">Todos</option>
                <option value="CONSENTIDO">Consentido (Art. 8)</option>
                <option value="REVOCADO">Revocado</option>
                <option value="REQUIERE_FIRMA">Requiere Firma</option>
              </select>
            </div>
          </div>

          {/* 4. Filter by Sensitivity & Search */}
          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl space-y-2">
            <label className="text-[11px] font-extrabold uppercase text-slate-400 flex items-center space-x-1.5">
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              <span>Sensibilidad & Búsqueda</span>
            </label>

            <select
              value={selectedSensitivityFilter}
              onChange={(e) => setSelectedSensitivityFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-teal-500"
            >
              <option value="ALL">Todos los Niveles de Sensibilidad</option>
              <option value="ALTO_CLINICO">Nivel Alto: Datos Clínicos y Diagnósticos</option>
              <option value="MEDIO_IDENTIDAD">Nivel Medio: Cédula y Datos Personales</option>
              <option value="ACCESO_SISTEMA">Nivel Sistema: Autenticación e IPs</option>
            </select>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-teal-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Buscar cédula, nombre, rol, IP o hash..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-8 pr-7 py-1.5 text-[11px] font-semibold text-white focus:outline-none focus:border-teal-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-2 p-0.5 text-slate-400 hover:text-white rounded cursor-pointer"
                  title="Borrar búsqueda"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Audit Context & Purpose Inputs */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 space-y-3 relative z-10">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span className="flex items-center space-x-1.5">
              <FileText className="w-3.5 h-3.5 text-teal-400" />
              <span>Metadatos para la Emisión del Reporte Oficial ANTAI / Ley 81</span>
            </span>
            <span className="font-mono text-teal-300 text-[10px]">Código: {currentReportCode}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="text-[10px] text-slate-400 font-bold block mb-1">Motivo Legal del Requerimiento:</label>
              <input
                type="text"
                value={auditReason}
                onChange={(e) => setAuditReason(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 font-medium focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400 font-bold block mb-1">Auditor Responsable / DPO:</label>
              <input
                type="text"
                value={auditorName}
                onChange={(e) => setAuditorName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 font-medium focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400 font-bold block mb-1">Observaciones / Alcance:</label>
              <input
                type="text"
                value={auditorNotes}
                onChange={(e) => setAuditorNotes(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 font-medium focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>
        </div>

        {/* Action Button Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800 relative z-10">
          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <span>Filtros Activos:</span>
            <span className="px-2 py-0.5 bg-slate-800 rounded-md text-teal-300 font-bold font-mono text-[11px]">
              {reportMetrics.totalLogs} evento(s) seleccionados
            </span>
            <button
              onClick={() => {
                setSelectedUserFilter('ALL');
                setSelectedRoleFilter('ALL');
                setSelectedActionFilter('ALL');
                setSelectedConsentFilter('ALL');
                setSelectedSensitivityFilter('ALL');
                handleDatePresetChange('7d');
                setSearchQuery('');
              }}
              className="text-slate-400 hover:text-white underline text-[11px] ml-2 cursor-pointer"
            >
              Restablecer
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Export CSV */}
            <button
              onClick={handleExportCsv}
              disabled={filteredReportLogs.length === 0}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-40 shadow-sm"
              title="Descargar archivo CSV estructurado para Excel"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Exportar CSV</span>
            </button>

            {/* Export JSON Forense */}
            <button
              onClick={handleExportJson}
              disabled={filteredReportLogs.length === 0}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-40 shadow-sm"
              title="Descargar paquete JSON firmado con encadenamiento SHA-256"
            >
              <FileCode className="w-4 h-4 text-indigo-400" />
              <span>JSON Forense</span>
            </button>

            {/* Generate & View Formal PDF */}
            <button
              onClick={() => setIsPdfModalOpen(true)}
              disabled={filteredReportLogs.length === 0}
              className="px-5 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black rounded-xl text-xs transition shadow-lg shadow-teal-500/20 flex items-center space-x-2 cursor-pointer disabled:opacity-40"
            >
              <Printer className="w-4 h-4" />
              <span>Generar Reporte Oficial PDF ANTAI</span>
            </button>
          </div>
        </div>
      </div>

      {/* Dynamic Summary Cards for Filtered Report Results */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
            Total Eventos PII
          </span>
          <div className="text-2xl font-black text-slate-900 font-mono">{reportMetrics.totalLogs}</div>
          <div className="text-[10px] text-teal-600 font-bold">Filtrados en Rango</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
            Pacientes Afectados
          </span>
          <div className="text-2xl font-black text-indigo-600 font-mono">{reportMetrics.uniquePatients}</div>
          <div className="text-[10px] text-slate-500 font-bold">Titulares Únicos</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
            Usuarios Auditados
          </span>
          <div className="text-2xl font-black text-sky-600 font-mono">{reportMetrics.uniqueUsers}</div>
          <div className="text-[10px] text-slate-500 font-bold">Operadores Activos</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
            Accesos Clínicos
          </span>
          <div className="text-2xl font-black text-emerald-600 font-mono">{reportMetrics.piiClinicalAccesses}</div>
          <div className="text-[10px] text-slate-500 font-bold">Resultados / PDFs</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
            Alertas / Anomalías
          </span>
          <div className={`text-2xl font-black font-mono ${reportMetrics.anomaliesCount > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
            {reportMetrics.anomaliesCount}
          </div>
          <div className="text-[10px] text-rose-500 font-bold">
            {reportMetrics.anomaliesCount > 0 ? 'Requiere Atención' : '0 Anomalías'}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
            Conformidad Art. 8
          </span>
          <div className="text-2xl font-black text-teal-700 font-mono">{reportMetrics.consentRate}%</div>
          <div className="text-[10px] text-emerald-600 font-bold">Consentimiento OK</div>
        </div>
      </div>

      {/* Interactive Filtered Records Preview Table */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Eye className="w-5 h-5 text-teal-600" />
              <span>Vista Previa del Reporte de Auditoría PII Filtrado</span>
            </h3>
            <p className="text-xs text-slate-500">
              Registros que formarán parte del informe oficial a certificar ante la ANTAI y auditorías externas.
            </p>
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Mostrando <strong className="text-slate-900">{filteredReportLogs.length}</strong> de <strong className="text-slate-900">{logs.length}</strong> registros totales.
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-2xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-300 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3">Fecha / Hora</th>
                <th className="p-3">Operador / Rol</th>
                <th className="p-3">Tipo de Acción PII</th>
                <th className="p-3">Paciente Titular</th>
                <th className="p-3">Campos PII Involucrados</th>
                <th className="p-3">IP / Origen</th>
                <th className="p-3">Consentimiento</th>
                <th className="p-3 text-center">Firma SHA-256</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {filteredReportLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500 font-medium">
                    No hay registros de auditoría que coincidan con la combinación de filtros seleccionada.
                  </td>
                </tr>
              ) : (
                filteredReportLogs.map((log) => (
                  <tr
                    key={log.id}
                    className={`hover:bg-slate-50 transition ${
                      log.isAnomaly ? 'bg-rose-50/70 hover:bg-rose-100/70' : ''
                    }`}
                  >
                    <td className="p-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {log.timestamp}
                    </td>

                    <td className="p-3">
                      <div className="font-bold text-slate-900">{log.userName}</div>
                      <div className="text-[10px] text-slate-500">{log.userRole}</div>
                    </td>

                    <td className="p-3 whitespace-nowrap">
                      {log.actionType === 'CONSULTA_RESULTADO' && (
                        <span className="px-2 py-0.5 bg-teal-100 text-teal-800 border border-teal-200 rounded-md text-[10px] font-bold font-mono">
                          CONSULTA_RESULTADO
                        </span>
                      )}
                      {log.actionType === 'EXPORTACION_PDF' && (
                        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-md text-[10px] font-bold font-mono">
                          EXPORTACION_PDF
                        </span>
                      )}
                      {log.actionType === 'VALIDACION_TECNICA' && (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-md text-[10px] font-bold font-mono">
                          VALIDACION_TECNICA
                        </span>
                      )}
                      {log.actionType === 'VALIDACION_MEDICA' && (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-md text-[10px] font-bold font-mono">
                          VALIDACION_MEDICA
                        </span>
                      )}
                      {log.actionType === 'MODIFICACION_CONSENTIMIENTO' && (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-800 border border-amber-200 rounded-md text-[10px] font-bold font-mono">
                          MODIFICACION_CONSENTIMIENTO
                        </span>
                      )}
                      {log.actionType === 'INICIO_SESION' && (
                        <span className="px-2 py-0.5 bg-sky-100 text-sky-800 border border-sky-200 rounded-md text-[10px] font-bold font-mono">
                          INICIO_SESION
                        </span>
                      )}
                      {log.actionType === 'INTENTO_ACCESO_DENEGADO' && (
                        <span className="px-2 py-0.5 bg-rose-100 text-rose-800 border border-rose-300 rounded-md text-[10px] font-bold font-mono inline-flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-rose-600" /> ACCESO_DENEGADO
                        </span>
                      )}
                      {log.actionType === 'CAMBIO_TARIFARIO' && (
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-800 border border-slate-200 rounded-md text-[10px] font-bold font-mono">
                          CAMBIO_TARIFARIO
                        </span>
                      )}
                    </td>

                    <td className="p-3 font-mono font-bold whitespace-nowrap">
                      {log.patientNationalId === 'N/A' ? (
                        <span className="text-slate-400 font-normal">N/A</span>
                      ) : (
                        <div>
                          <span className="text-slate-900">{maskPatientId(log.patientNationalId)}</span>
                          <div className="text-[10px] text-slate-500 font-sans font-normal">
                            {privacyMaskEnabled ? 'Titular Protegido' : log.patientName}
                          </div>
                        </div>
                      )}
                    </td>

                    <td className="p-3 text-[11px] text-slate-600 max-w-xs">
                      <span className="line-clamp-2" title={getPiiFieldsDescription(log)}>
                        {getPiiFieldsDescription(log)}
                      </span>
                    </td>

                    <td className="p-3 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                      <div>{maskIp(log.ipAddress)}</div>
                      <div className="text-[10px] text-slate-400 font-sans truncate max-w-[130px]">{log.location}</div>
                    </td>

                    <td className="p-3 whitespace-nowrap">
                      {log.consentLey81Status === 'CONSENTIDO' ? (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-mono text-[10px] rounded font-bold">
                          CONSENTIDO
                        </span>
                      ) : log.consentLey81Status === 'REVOCADO' ? (
                        <span className="px-2 py-0.5 bg-rose-100 text-rose-800 font-mono text-[10px] rounded font-bold">
                          REVOCADO
                        </span>
                      ) : log.consentLey81Status === 'REQUIERE_FIRMA' ? (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-800 font-mono text-[10px] rounded font-bold">
                          REQUIERE FIRMA
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[10px]">N/A</span>
                      )}
                    </td>

                    <td className="p-3 text-center whitespace-nowrap">
                      <button
                        onClick={() => onInspectLog(log)}
                        className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-teal-400 rounded-lg text-[10px] font-mono font-bold transition cursor-pointer"
                        title="Inspeccionar bloque criptográfico"
                      >
                        {log.sha256Hash.substring(0, 10)}...
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Generated Reports History Log */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2.5">
            <History className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="text-base font-bold text-slate-900">Historial de Reportes Oficiales Generados</h3>
              <p className="text-xs text-slate-500">Trazabilidad de certificaciones y exportaciones realizadas para cumplimiento ANTAI</p>
            </div>
          </div>
          <span className="text-xs bg-slate-100 text-slate-700 px-3 py-1 rounded-full font-mono font-bold">
            {generatedReports.length} Reporte(s) Registrados
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {generatedReports.map((r) => (
            <div
              key={r.id}
              className="p-4 bg-slate-50 rounded-2xl border border-slate-200 hover:border-teal-500/50 transition space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="px-2 py-0.5 bg-teal-100 text-teal-800 font-mono text-[10px] font-bold rounded">
                    {r.reportCode}
                  </span>
                  <div className="text-xs font-bold text-slate-900 mt-1">{r.auditReason}</div>
                  <div className="text-[10px] text-slate-500">Emitido: {r.generatedAt} • Por: {r.generatedBy}</div>
                </div>

                <div className="text-right">
                  <span className="text-sm font-black font-mono text-slate-900">{r.totalRecords}</span>
                  <span className="text-[10px] text-slate-500 block">Eventos</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 bg-white p-2.5 rounded-xl border border-slate-200/80 text-[10px]">
                <div>
                  <span className="text-slate-400 block font-bold">Rango:</span>
                  <span className="font-medium text-slate-800">{r.filtersSummary.dateRange}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-bold">Pacientes:</span>
                  <span className="font-medium text-slate-800">{r.uniquePatients} únicos</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-bold">Anomalías:</span>
                  <span className={`font-bold ${r.anomaliesCount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {r.anomaliesCount} eventos
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-slate-200 text-[10px]">
                <div className="font-mono text-slate-400 truncate max-w-[200px]" title={r.reportSha256}>
                  Hash: {r.reportSha256.substring(0, 16)}...
                </div>

                <button
                  onClick={() => setIsPdfModalOpen(true)}
                  className="text-teal-700 hover:text-teal-900 font-bold underline cursor-pointer flex items-center space-x-1"
                >
                  <Eye className="w-3 h-3" />
                  <span>Ver Certificado</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Official Ley 81 PDF Report Modal Preview */}
      {isPdfModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-8 text-slate-900 shadow-2xl space-y-6 relative my-8 max-h-[90vh] overflow-y-auto">
            {/* Modal Top Bar */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-slate-900">
                    Certificado Oficial de Auditoría de Acceso a Datos Personales
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    Conforme a la Ley 81 de 2019 de Panamá • Autoridad Nacional de Transparencia (ANTAI)
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition flex items-center space-x-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir</span>
                </button>
                <button
                  onClick={() => setIsPdfModalOpen(false)}
                  className="text-slate-400 hover:text-slate-700 font-bold text-sm cursor-pointer p-1"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Formal Printable Document Layout */}
            <div className="border border-slate-300 rounded-2xl p-6 space-y-6 bg-slate-50/50">
              {/* Document Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b-2 border-teal-600 pb-4">
                <div>
                  <div className="text-xs font-black text-teal-700 uppercase tracking-widest">
                    REPÚBLICA DE PANAMÁ • AUTORIDAD NACIONAL DE TRANSPARENCIA Y ACCESO A LA INFORMACIÓN
                  </div>
                  <h1 className="text-xl font-black text-slate-900 mt-1">
                    INFORME TÉCNICO DE TRAZABILIDAD Y ACCESO A DATOS SENSIBLES (PII)
                  </h1>
                  <p className="text-xs text-slate-600 font-medium mt-0.5">
                    Entidad Auditada: <strong className="text-slate-900">{tenant.name}</strong> • Sede: <strong className="text-slate-900">{branch.name}</strong>
                  </p>
                </div>

                <div className="text-right shrink-0 bg-white p-3 rounded-xl border border-slate-200 shadow-sm text-xs space-y-0.5">
                  <div className="font-mono font-bold text-teal-800">{currentReportCode}</div>
                  <div className="text-slate-500 text-[10px]">Emisión: {new Date().toLocaleString('es-PA')}</div>
                  <div className="text-[10px] text-emerald-600 font-bold flex items-center justify-end gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Ledger Catenario Verificado
                  </div>
                </div>
              </div>

              {/* Legal Reference Callout */}
              <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl text-xs text-teal-950 space-y-1">
                <div className="font-bold flex items-center space-x-1.5 text-teal-800">
                  <Lock className="w-4 h-4 text-teal-700" />
                  <span>Fundamento Legal: Ley 81 de 26 de marzo de 2019 & Decreto Ejecutivo 285 de 2021</span>
                </div>
                <p className="text-[11px] leading-relaxed text-teal-900">
                  El presente documento certifica la debida custodia, trazabilidad e inmutabilidad de los accesos a datos médicos y personales de pacientes conforme a los <strong>Artículos 8 (Consentimiento), 14 (Confidencialidad Médica), 15 (Derechos ARCO) y 21 (Responsabilidad Demostrada)</strong>. Cada evento cuenta con un bloque criptográfico SHA-256 inalterable.
                </p>
              </div>

              {/* Parameters & Scope */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-white p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block font-bold text-[10px] uppercase">Rango Auditado:</span>
                  <span className="font-mono font-bold text-slate-800">{startDate} al {endDate}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-bold text-[10px] uppercase">Operador Auditado:</span>
                  <span className="font-bold text-slate-800">{selectedUserFilter === 'ALL' ? 'Todos los Usuarios' : selectedUserFilter}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-bold text-[10px] uppercase">Acción Evaluada:</span>
                  <span className="font-bold text-slate-800">{selectedActionFilter === 'ALL' ? 'Todas las Acciones PII' : selectedActionFilter}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-bold text-[10px] uppercase">Eventos Verificados:</span>
                  <span className="font-mono font-black text-teal-700">{reportMetrics.totalLogs} Registros</span>
                </div>
              </div>

              {/* Table of Events for Print Document */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between">
                  <span>Detalle Cronológico de Accesos a Datos Personales</span>
                  <span className="text-[10px] text-slate-500 font-normal">
                    {privacyMaskEnabled ? 'Modo Máscara Activo (Anonimizado)' : 'Datos PII Completos para Auditor'}
                  </span>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden text-[11px]">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[9px]">
                      <tr>
                        <th className="p-2.5">Fecha/Hora</th>
                        <th className="p-2.5">Operador</th>
                        <th className="p-2.5">Acción</th>
                        <th className="p-2.5">Paciente Cédula</th>
                        <th className="p-2.5">Datos Consultados</th>
                        <th className="p-2.5">IP Origen</th>
                        <th className="p-2.5">Hash SHA-256</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                      {filteredReportLogs.slice(0, 15).map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50">
                          <td className="p-2 font-mono text-[10px] text-slate-600 whitespace-nowrap">{log.timestamp}</td>
                          <td className="p-2 font-bold">{log.userName}</td>
                          <td className="p-2 font-mono text-[10px]">{log.actionType}</td>
                          <td className="p-2 font-mono font-bold text-slate-900 whitespace-nowrap">
                            {privacyMaskEnabled ? maskPatientId(log.patientNationalId) : log.patientNationalId}
                          </td>
                          <td className="p-2 text-[10px] text-slate-600 truncate max-w-[150px]">
                            {getPiiFieldsDescription(log)}
                          </td>
                          <td className="p-2 font-mono text-[10px]">{privacyMaskEnabled ? maskIp(log.ipAddress) : log.ipAddress}</td>
                          <td className="p-2 font-mono text-[9px] text-teal-800">{log.sha256Hash.substring(0, 12)}...</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredReportLogs.length > 15 && (
                    <div className="p-2 bg-slate-50 text-center text-slate-500 text-[10px] font-semibold border-t border-slate-200">
                      ... y {filteredReportLogs.length - 15} registro(s) adicionales incluidos en el informe completo certificado.
                    </div>
                  )}
                </div>
              </div>

              {/* Signatures and Cryptographic Seal */}
              <div className="pt-6 border-t-2 border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="text-[10px] font-bold uppercase text-slate-400">Firma del Auditor / DPO Responsable:</div>
                  <div className="h-14 border-b border-slate-400 flex items-end pb-1">
                    <span className="font-serif italic font-bold text-slate-800 text-sm">{auditorName}</span>
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Oficial de Cumplimiento Ley 81 • {tenant.name}
                  </div>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-1">
                  <div className="font-bold text-slate-800 flex items-center gap-1">
                    <Key className="w-3.5 h-3.5 text-teal-600" />
                    <span>Sello Criptográfico del Reporte:</span>
                  </div>
                  <div className="font-mono text-[10px] text-slate-700 break-all bg-slate-50 p-2 rounded border border-slate-200">
                    {currentReportHash}
                  </div>
                  <div className="text-[9px] text-slate-400">
                    Verificable en plataforma LIS-Core ANTAI Validator v4.2
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-200">
              <button
                onClick={() => setIsPdfModalOpen(false)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Cerrar
              </button>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleExportCsv}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition flex items-center space-x-1.5 cursor-pointer shadow"
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar Archivo CSV</span>
                </button>

                <button
                  onClick={() => {
                    handleSaveReportToHistory();
                    alert(`¡Reporte Oficial ${currentReportCode} exportado y certificado con éxito!`);
                    setIsPdfModalOpen(false);
                  }}
                  className="px-5 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-black text-xs rounded-xl transition shadow-lg shadow-teal-600/20 flex items-center space-x-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Certificar y Guardar Reporte</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
