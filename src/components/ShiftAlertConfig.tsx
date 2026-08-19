import React, { useState } from 'react';
import { StaffMember, WorkShift } from './ShiftManagementModule';
import {
  Bell,
  Mail,
  Smartphone,
  ShieldAlert,
  Clock,
  Send,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Sparkles,
  Users,
  Building2,
  Settings,
  RefreshCw,
  Info,
  ShieldCheck,
  Check,
  Zap,
  ArrowRight,
  Flame,
  Volume2,
  PhoneCall,
  UserCheck
} from 'lucide-react';

export interface ShiftAlertRule {
  id: string;
  name: string;
  branchId: string; // 'TODAS' or specific branch
  branchName: string;
  section: string; // 'TODAS' or specific section
  gracePeriodMinutes: number; // 5, 10, 15, 30 min
  enablePush: boolean;
  enableEmail: boolean;
  enableWhatsApp: boolean;
  enableAudioAlarm: boolean;
  supervisorEmails: string[];
  autoActivateOnCallStaff: boolean;
  onCallBackupStaffId?: string;
  escalationLevels: {
    level1Minutes: number; // e.g. 5 min -> notify tech
    level2Minutes: number; // e.g. 15 min -> notify supervisor
    level3Minutes: number; // e.g. 30 min -> emergency alert & trigger on-call
  };
  emailSubjectTemplate: string;
  emailBodyTemplate: string;
  pushBodyTemplate: string;
  active: boolean;
}

export interface ShiftAlertIncidentLog {
  id: string;
  timestamp: string;
  staffName: string;
  staffRole: string;
  branchName: string;
  section: string;
  shiftTypeName: string;
  scheduledStart: string;
  minutesLate: number;
  channelsDispatched: ('PUSH' | 'EMAIL' | 'WHATSAPP' | 'ON_CALL')[];
  escalationState: 'NIVEL_1_RECORDATORIO' | 'NIVEL_2_SUPERVISOR' | 'NIVEL_3_ON_CALL_ACTIVADO' | 'RESUELTO';
  resolvedAt?: string;
}

interface ShiftAlertConfigProps {
  staffList: StaffMember[];
  shifts: WorkShift[];
  onTriggerOnCallSwap?: (shiftId: string, backupStaffId: string) => void;
}

const DEFAULT_ALERT_RULES: ShiftAlertRule[] = [
  {
    id: 'rule-urgencias-01',
    name: 'Guardia de Urgencias & Analizadores Críticos (24h)',
    branchId: 'TODAS',
    branchName: 'Todas las Sedes',
    section: 'Guardia Urgencias 24h',
    gracePeriodMinutes: 10,
    enablePush: true,
    enableEmail: true,
    enableWhatsApp: true,
    enableAudioAlarm: true,
    supervisorEmails: ['jefatura.laboratorio@labsanjose.com', 'dra.maria.abrego@labsanjose.com'],
    autoActivateOnCallStaff: true,
    onCallBackupStaffId: 'st-03',
    escalationLevels: {
      level1Minutes: 5,
      level2Minutes: 10,
      level3Minutes: 20
    },
    emailSubjectTemplate: '[URGENTE - LIS] Alerta de Continuidad Operativa: Tecnólogo no ha marcado entrada en {sede}',
    emailBodyTemplate: 'Estimado Supervisor,\n\nSe detecta ausencia en el inicio de turno:\n- Colaborador: {tecnico_nombre} ({tecnico_rol})\n- Sede: {sede}\n- Sección Crítica: {seccion}\n- Horario Programado: {hora_inicio}\n- Demora Actual: {minutos_demora} minutos\n\nProtocolo de Continuidad Operativa activado. Se ha notificado al personal On-Call de respaldo ({tecnico_oncall_respaldo}).',
    pushBodyTemplate: '⚠️ AUSENCIA DETECTADA: {tecnico_nombre} no ha iniciado turno en {seccion} ({sede}). Demora: {minutos_demora}m.',
    active: true
  },
  {
    id: 'rule-hematologia-02',
    name: 'Área Técnica Hematología & Química (Sede Vía España)',
    branchId: 'branch-via-espana',
    branchName: 'Sede Vía España',
    section: 'Hematología & Química',
    gracePeriodMinutes: 15,
    enablePush: true,
    enableEmail: true,
    enableWhatsApp: false,
    enableAudioAlarm: false,
    supervisorEmails: ['coordinacion.tecnica@labsanjose.com'],
    autoActivateOnCallStaff: false,
    onCallBackupStaffId: 'st-02',
    escalationLevels: {
      level1Minutes: 5,
      level2Minutes: 15,
      level3Minutes: 30
    },
    emailSubjectTemplate: '[ALERTA LIS] Retraso de Marcaje en Sede Vía España - {tecnico_nombre}',
    emailBodyTemplate: 'Se informa que {tecnico_nombre} presenta {minutos_demora} minutos de demora para el turno {turno} en {seccion}.',
    pushBodyTemplate: '⏰ Retraso de marcaje: {tecnico_nombre} ({minutos_demora} min de retraso en {seccion}).',
    active: true
  }
];

const INITIAL_INCIDENTS: ShiftAlertIncidentLog[] = [
  {
    id: 'inc-01',
    timestamp: '2026-08-18 07:15:22',
    staffName: 'Lic. Roberto Abrego',
    staffRole: 'Tecnólogo Médico',
    branchName: 'Sede Vía España',
    section: 'Hematología & Química',
    shiftTypeName: 'Mañana (07:00 - 15:00)',
    scheduledStart: '07:00',
    minutesLate: 15,
    channelsDispatched: ['PUSH', 'EMAIL'],
    escalationState: 'NIVEL_2_SUPERVISOR',
    resolvedAt: '2026-08-18 07:22 (Entrada marcada con huella)'
  },
  {
    id: 'inc-02',
    timestamp: '2026-08-17 23:12:05',
    staffName: 'Lic. Manuel Rodríguez',
    staffRole: 'Tecnólogo Médico',
    branchName: 'Sede Chiriquí (David)',
    section: 'Guardia Urgencias 24h',
    shiftTypeName: 'Noche / Guardia (23:00 - 07:00)',
    scheduledStart: '23:00',
    minutesLate: 12,
    channelsDispatched: ['PUSH', 'EMAIL', 'WHATSAPP', 'ON_CALL'],
    escalationState: 'NIVEL_3_ON_CALL_ACTIVADO',
    resolvedAt: '2026-08-17 23:25 (Reemplazado por Lic. Yarisel Castillo)'
  }
];

export const ShiftAlertConfig: React.FC<ShiftAlertConfigProps> = ({
  staffList,
  shifts,
  onTriggerOnCallSwap
}) => {
  const [rules, setRules] = useState<ShiftAlertRule[]>(DEFAULT_ALERT_RULES);
  const [selectedRuleId, setSelectedRuleId] = useState<string>(DEFAULT_ALERT_RULES[0].id);
  const [incidents, setIncidents] = useState<ShiftAlertIncidentLog[]>(INITIAL_INCIDENTS);

  // Active Rule Form State
  const activeRule = rules.find((r) => r.id === selectedRuleId) || rules[0];

  // Test Simulator State
  const [testStaffId, setTestStaffId] = useState<string>(staffList[1]?.id || 'st-02');
  const [testMinutesLate, setTestMinutesLate] = useState<number>(15);
  const [isSimulatingAlert, setIsSimulatingAlert] = useState<boolean>(false);
  const [simulationResult, setSimulationResult] = useState<any | null>(null);

  // Success Notification state
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const handleUpdateActiveRule = (updates: Partial<ShiftAlertRule>) => {
    setRules((prev) =>
      prev.map((r) => (r.id === selectedRuleId ? { ...r, ...updates } : r))
    );
  };

  const handleSaveConfig = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleRunSimulation = () => {
    setIsSimulatingAlert(true);
    setSimulationResult(null);

    const targetStaff = staffList.find((s) => s.id === testStaffId) || staffList[0];
    const backupStaff = staffList.find((s) => s.id === activeRule.onCallBackupStaffId) || staffList[2];

    setTimeout(() => {
      const isLevel3 = testMinutesLate >= activeRule.escalationLevels.level3Minutes;
      const isLevel2 = testMinutesLate >= activeRule.escalationLevels.level2Minutes;

      const channels: ('PUSH' | 'EMAIL' | 'WHATSAPP' | 'ON_CALL')[] = [];
      if (activeRule.enablePush) channels.push('PUSH');
      if (activeRule.enableEmail) channels.push('EMAIL');
      if (activeRule.enableWhatsApp && isLevel2) channels.push('WHATSAPP');
      if (activeRule.autoActivateOnCallStaff && isLevel3) channels.push('ON_CALL');

      const simLog: ShiftAlertIncidentLog = {
        id: `inc-${Date.now()}`,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        staffName: targetStaff.name,
        staffRole: targetStaff.roleTitle,
        branchName: activeRule.branchName === 'TODAS' ? targetStaff.branchName : activeRule.branchName,
        section: activeRule.section,
        shiftTypeName: 'Mañana (07:00 - 15:00)',
        scheduledStart: '07:00',
        minutesLate: testMinutesLate,
        channelsDispatched: channels,
        escalationState: isLevel3
          ? 'NIVEL_3_ON_CALL_ACTIVADO'
          : isLevel2
          ? 'NIVEL_2_SUPERVISOR'
          : 'NIVEL_1_RECORDATORIO'
      };

      setIncidents((prev) => [simLog, ...prev]);

      const formattedEmail = activeRule.emailBodyTemplate
        .replace('{tecnico_nombre}', targetStaff.name)
        .replace('{tecnico_rol}', targetStaff.roleTitle)
        .replace('{sede}', simLog.branchName)
        .replace('{seccion}', activeRule.section)
        .replace('{hora_inicio}', '07:00 AM')
        .replace('{minutos_demora}', String(testMinutesLate))
        .replace('{tecnico_oncall_respaldo}', backupStaff?.name || 'Lic. Roberto Abrego');

      const formattedPush = activeRule.pushBodyTemplate
        .replace('{tecnico_nombre}', targetStaff.name)
        .replace('{seccion}', activeRule.section)
        .replace('{sede}', simLog.branchName)
        .replace('{minutos_demora}', String(testMinutesLate));

      setSimulationResult({
        success: true,
        dispatchedChannels: channels,
        escalationLevel: simLog.escalationState,
        formattedEmail,
        formattedPush,
        backupStaffName: backupStaff?.name,
        supervisorEmails: activeRule.supervisorEmails,
        timestamp: simLog.timestamp
      });

      setIsSimulatingAlert(false);
    }, 900);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="bg-slate-950 text-white p-6 rounded-3xl shadow-2xl border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center space-x-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[11px] font-mono px-3 py-1 rounded-full uppercase tracking-wider font-bold">
            <ShieldAlert className="w-3.5 h-3.5 animate-pulse text-amber-400" />
            <span>Continuidad Operativa • ISO 15189 Cláusula 5.1 & MINSA Roster Control</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center space-x-3">
            <span>Configuración de Alertas de Marcaje & Turnos</span>
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm max-w-2xl leading-relaxed">
            Configure disparadores automáticos de notificaciones <strong className="text-teal-300">Push</strong> y <strong className="text-amber-300">Correo Electrónico</strong> cuando un técnico no marca entrada dentro del margen de tolerancia, activando la cadena de escalado y cobertura On-Call de respaldo.
          </p>
        </div>

        {/* Rule Selector Header */}
        <div className="relative z-10 bg-slate-900/90 border border-slate-800 p-4 rounded-2xl text-xs space-y-2 min-w-[280px] shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="font-bold text-[11px] uppercase tracking-wider text-amber-400">Regla de Alerta Activa:</span>
            <span className={`inline-flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
              activeRule.active ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-slate-400 bg-slate-800 border-slate-700'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${activeRule.active ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
              <span>{activeRule.active ? 'ACTIVA' : 'PAUSADA'}</span>
            </span>
          </div>
          <select
            value={selectedRuleId}
            onChange={(e) => setSelectedRuleId(e.target.value)}
            className="w-full bg-slate-950 text-white font-bold text-xs p-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            {rules.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1 border-t border-slate-800">
            <span>Tolerancia Gracia: <strong className="text-amber-300">{activeRule.gracePeriodMinutes} min</strong></span>
            <span>Canales: <strong className="text-teal-300">{[activeRule.enablePush && 'Push', activeRule.enableEmail && 'Email', activeRule.enableWhatsApp && 'WA'].filter(Boolean).join('+')}</strong></span>
          </div>
        </div>
      </div>

      {/* Main Grid Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Columns: Rule Parameters & Multi-Level Escalation */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6 text-white">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <div className="text-amber-400 font-mono text-[10px] uppercase font-bold tracking-wider flex items-center space-x-1.5">
                <Settings className="w-3.5 h-3.5" />
                <span>Parámetros de Detección & Notificación</span>
              </div>
              <h3 className="font-black text-base text-white">{activeRule.name}</h3>
            </div>

            <button
              onClick={() => handleUpdateActiveRule({ active: !activeRule.active })}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                activeRule.active
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                  : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{activeRule.active ? 'Regla Habilitada' : 'Regla Deshabilitada'}</span>
            </button>
          </div>

          {/* Section 1: Target Scope & Grace Tolerance */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="text-slate-300 font-bold block mb-1">Sede de Aplicación:</label>
              <select
                value={activeRule.branchId}
                onChange={(e) => {
                  const branchName = e.target.value === 'TODAS' ? 'Todas las Sedes' : e.target.selectedOptions[0].text;
                  handleUpdateActiveRule({ branchId: e.target.value, branchName });
                }}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-amber-500"
              >
                <option value="TODAS">Todas las Sedes (Central + Sucursales)</option>
                <option value="branch-via-espana">Sede Vía España</option>
                <option value="branch-david">Sede Chiriquí (David)</option>
                <option value="branch-costa-este">Sede Costa del Este</option>
                <option value="branch-transistmica">Sede Transístmica</option>
              </select>
            </div>

            <div>
              <label className="text-slate-300 font-bold block mb-1">Sección / Área Crítica:</label>
              <select
                value={activeRule.section}
                onChange={(e) => handleUpdateActiveRule({ section: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-amber-500"
              >
                <option value="Guardia Urgencias 24h">Guardia Urgencias 24h (Máxima Prioridad)</option>
                <option value="Hematología & Química">Hematología & Química Clínica</option>
                <option value="Procesamiento General">Procesamiento General</option>
                <option value="Microbiología & Inmuno">Microbiología & Inmuno</option>
                <option value="Recepción & Muestras">Recepción & Toma de Muestras</option>
              </select>
            </div>

            <div>
              <label className="text-slate-300 font-bold block mb-1">Tolerancia de Gracia (Entrada):</label>
              <select
                value={activeRule.gracePeriodMinutes}
                onChange={(e) => handleUpdateActiveRule({ gracePeriodMinutes: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-amber-300 font-mono font-bold focus:outline-none focus:border-amber-500"
              >
                <option value={5}>5 minutos (Estricto Urgencias)</option>
                <option value={10}>10 minutos (Recomendado)</option>
                <option value={15}>15 minutos (Estándar)</option>
                <option value={30}>30 minutos (Turnos Regulares)</option>
              </select>
            </div>
          </div>

          {/* Section 2: Channels Toggles */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-2">
              <Radio className="w-4 h-4 text-teal-400" />
              <span>Canales de Despacho de Notificaciones</span>
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <button
                type="button"
                onClick={() => handleUpdateActiveRule({ enablePush: !activeRule.enablePush })}
                className={`p-3 rounded-2xl border transition flex flex-col items-center justify-center space-y-2 cursor-pointer ${
                  activeRule.enablePush
                    ? 'bg-teal-500/20 border-teal-500/50 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'
                }`}
              >
                <Smartphone className={`w-5 h-5 ${activeRule.enablePush ? 'text-teal-400' : 'text-slate-600'}`} />
                <span className="font-bold text-[11px]">Push Web/Móvil</span>
                <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full ${activeRule.enablePush ? 'bg-teal-500/20 text-teal-300' : 'bg-slate-800 text-slate-500'}`}>
                  {activeRule.enablePush ? 'ACTIVO' : 'INACTIVO'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleUpdateActiveRule({ enableEmail: !activeRule.enableEmail })}
                className={`p-3 rounded-2xl border transition flex flex-col items-center justify-center space-y-2 cursor-pointer ${
                  activeRule.enableEmail
                    ? 'bg-amber-500/20 border-amber-500/50 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'
                }`}
              >
                <Mail className={`w-5 h-5 ${activeRule.enableEmail ? 'text-amber-400' : 'text-slate-600'}`} />
                <span className="font-bold text-[11px]">Correo Electrónico</span>
                <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full ${activeRule.enableEmail ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-500'}`}>
                  {activeRule.enableEmail ? 'ACTIVO' : 'INACTIVO'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleUpdateActiveRule({ enableWhatsApp: !activeRule.enableWhatsApp })}
                className={`p-3 rounded-2xl border transition flex flex-col items-center justify-center space-y-2 cursor-pointer ${
                  activeRule.enableWhatsApp
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'
                }`}
              >
                <PhoneCall className={`w-5 h-5 ${activeRule.enableWhatsApp ? 'text-emerald-400' : 'text-slate-600'}`} />
                <span className="font-bold text-[11px]">WhatsApp Urgente</span>
                <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full ${activeRule.enableWhatsApp ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-500'}`}>
                  {activeRule.enableWhatsApp ? 'ACTIVO' : 'INACTIVO'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleUpdateActiveRule({ enableAudioAlarm: !activeRule.enableAudioAlarm })}
                className={`p-3 rounded-2xl border transition flex flex-col items-center justify-center space-y-2 cursor-pointer ${
                  activeRule.enableAudioAlarm
                    ? 'bg-rose-500/20 border-rose-500/50 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'
                }`}
              >
                <Volume2 className={`w-5 h-5 ${activeRule.enableAudioAlarm ? 'text-rose-400' : 'text-slate-600'}`} />
                <span className="font-bold text-[11px]">Alarma Sonora LIS</span>
                <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full ${activeRule.enableAudioAlarm ? 'bg-rose-500/20 text-rose-300' : 'bg-slate-800 text-slate-500'}`}>
                  {activeRule.enableAudioAlarm ? 'ACTIVO' : 'INACTIVO'}
                </span>
              </button>
            </div>
          </div>

          {/* Section 3: Escalation Ladder (Cadena de Continuidad) */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Cadena de Escalado de Continuidad Operativa</span>
              </span>
              <span className="text-[10px] text-teal-400 font-mono font-normal">ISO 15189: Cobertura Ininterrumpida</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2 relative overflow-hidden">
                <div className="text-[10px] font-mono text-teal-400 font-bold">NIVEL 1 • T+{activeRule.escalationLevels.level1Minutes} MIN</div>
                <div className="font-bold text-white text-xs">Recordatorio al Colaborador</div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Envía notificación Push directa al móvil del técnico programado solicitando registrar asistencia mediante PIN o huella.
                </p>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2 relative overflow-hidden">
                <div className="text-[10px] font-mono text-amber-400 font-bold">NIVEL 2 • T+{activeRule.escalationLevels.level2Minutes} MIN</div>
                <div className="font-bold text-white text-xs">Alerta a Supervisión / Jefatura</div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Despacha Email y alerta push urgente a la Jefatura de Turno y Supervisor de Sede informando el retraso.
                </p>
              </div>

              <div className="bg-slate-950 border border-rose-500/30 bg-rose-950/10 rounded-2xl p-4 space-y-2 relative overflow-hidden">
                <div className="text-[10px] font-mono text-rose-400 font-bold flex items-center space-x-1">
                  <Flame className="w-3 h-3 text-rose-400" />
                  <span>NIVEL 3 • T+{activeRule.escalationLevels.level3Minutes} MIN</span>
                </div>
                <div className="font-bold text-white text-xs">Incidente & Activación On-Call</div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Notifica al Director Médico y activa automáticamente el protocolo de reemplazo con el Tecnólogo de Guardia Pasiva.
                </p>
              </div>
            </div>
          </div>

          {/* Section 4: On-Call Backup Staff Assignment */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-200 flex items-center space-x-2">
                <Users className="w-4 h-4 text-indigo-400" />
                <span>Tecnólogo de Guardia Pasiva (On-Call de Respaldo):</span>
              </label>
              <label className="flex items-center space-x-2 text-[11px] text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={activeRule.autoActivateOnCallStaff}
                  onChange={(e) => handleUpdateActiveRule({ autoActivateOnCallStaff: e.target.checked })}
                  className="rounded text-amber-500 focus:ring-amber-500 bg-slate-900 border-slate-700"
                />
                <span>Auto-asignar reemplazo en Nivel 3</span>
              </label>
            </div>

            <select
              value={activeRule.onCallBackupStaffId}
              onChange={(e) => handleUpdateActiveRule({ onCallBackupStaffId: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-bold focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              {staffList.filter(s => s.role === 'tech_med' && s.status === 'ACTIVO').map((tech) => (
                <option key={tech.id} value={tech.id}>
                  {tech.name} • {tech.roleTitle} ({tech.licenseNumber || 'TM Idóneo'}) — Sede: {tech.branchName}
                </option>
              ))}
            </select>
          </div>

          {/* Save Action */}
          <div className="flex items-center justify-between pt-2">
            {savedSuccess ? (
              <span className="text-emerald-400 text-xs font-bold flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>¡Configuración de alertas guardada exitosamente en el LIS!</span>
              </span>
            ) : (
              <span className="text-slate-500 text-xs">Los cambios toman efecto inmediato en el scheduler de turnos.</span>
            )}

            <button
              onClick={handleSaveConfig}
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs transition shadow-lg shadow-amber-500/20 flex items-center space-x-2 cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Guardar Reglas de Continuidad</span>
            </button>
          </div>
        </div>

        {/* Right 5 Columns: Live Alert Simulator & Recent Operational Incident Logs */}
        <div className="lg:col-span-5 space-y-6">
          {/* Live Simulator Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5 text-white">
            <div className="space-y-1 border-b border-slate-800 pb-4">
              <div className="text-teal-400 font-mono text-[10px] uppercase font-bold tracking-wider flex items-center space-x-1.5">
                <Zap className="w-3.5 h-3.5" />
                <span>Simulador de Detección en Tiempo Real</span>
              </div>
              <h3 className="font-black text-base text-white">Probar Disparo de Alerta</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Simule la ausencia de marcaje de un técnico para validar el contenido del Push, Email y la respuesta del protocolo de respaldo.
              </p>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1">Técnico Médico Evaluado:</label>
                <select
                  value={testStaffId}
                  onChange={(e) => setTestStaffId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-teal-500"
                >
                  {staffList.filter(s => s.role === 'tech_med').map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} — {st.branchName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">
                  Minutos de Retraso Transcurridos desde Inicio del Turno:
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="range"
                    min={5}
                    max={45}
                    step={5}
                    value={testMinutesLate}
                    onChange={(e) => setTestMinutesLate(Number(e.target.value))}
                    className="flex-1 accent-amber-500 cursor-pointer"
                  />
                  <span className="font-mono font-black text-amber-400 text-sm w-16 text-right">
                    +{testMinutesLate} min
                  </span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 font-mono pt-1">
                  <span>5m (Aviso)</span>
                  <span>15m (Supervisor)</span>
                  <span>30m+ (On-Call)</span>
                </div>
              </div>

              <button
                onClick={handleRunSimulation}
                disabled={isSimulatingAlert}
                className="w-full py-3 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black rounded-2xl text-xs transition flex items-center justify-center space-x-2 shadow-lg shadow-teal-500/20 cursor-pointer disabled:opacity-50"
              >
                {isSimulatingAlert ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Evaluando Tolerancia & Disparando...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Simular Ausencia & Despachar Alerta</span>
                  </>
                )}
              </button>
            </div>

            {/* Simulation Preview Output */}
            {simulationResult && (
              <div className="bg-slate-950 border border-teal-500/30 rounded-2xl p-4 space-y-3 text-xs animate-fadeIn">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-teal-300 font-bold flex items-center space-x-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Alerta Generada Exitosamente</span>
                  </span>
                  <span className="text-[10px] font-mono text-amber-400 font-bold">
                    {simulationResult.escalationLevel}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl space-y-1">
                    <div className="text-[10px] font-mono text-slate-400 uppercase font-bold flex items-center space-x-1">
                      <Smartphone className="w-3 h-3 text-teal-400" />
                      <span>Vista Previa Notificación Push (Móvil LIS):</span>
                    </div>
                    <p className="text-[11px] text-teal-200 font-medium">
                      {simulationResult.formattedPush}
                    </p>
                  </div>

                  <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl space-y-1">
                    <div className="text-[10px] font-mono text-slate-400 uppercase font-bold flex items-center space-x-1">
                      <Mail className="w-3 h-3 text-amber-400" />
                      <span>Email Despachado a Supervisión:</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      Para: {simulationResult.supervisorEmails.join(', ')}
                    </div>
                    <pre className="text-[10px] text-slate-300 whitespace-pre-wrap font-sans bg-slate-950 p-2 rounded-lg border border-slate-800/80">
                      {simulationResult.formattedEmail}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Incident Audit Log */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4 text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-white flex items-center space-x-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Registro Reciente de Alertas de Marcaje</span>
              </h3>
              <span className="text-[10px] font-mono bg-slate-950 px-2 py-0.5 rounded text-slate-400">
                {incidents.length} Eventos
              </span>
            </div>

            <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
              {incidents.map((inc) => (
                <div
                  key={inc.id}
                  className="bg-slate-950 border border-slate-800/80 p-3 rounded-2xl space-y-1.5 text-xs hover:border-slate-700 transition"
                >
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-bold text-white">{inc.staffName}</span>
                    <span className="text-slate-500 font-mono">{inc.timestamp.slice(11)}</span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {inc.branchName} • <span className="text-amber-400 font-mono">+{inc.minutesLate}m tarde</span> ({inc.shiftTypeName.split(' ')[0]})
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[10px] font-mono">
                    <span className="text-teal-400">Canales: {inc.channelsDispatched.join(', ')}</span>
                    <span className="text-emerald-400">{inc.escalationState}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
