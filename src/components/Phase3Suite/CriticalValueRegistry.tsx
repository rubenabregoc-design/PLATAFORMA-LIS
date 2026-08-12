import React, { useState, useMemo } from 'react';
import {
  FileCheck2,
  ShieldAlert,
  Clock,
  User,
  PhoneCall,
  CheckCircle2,
  AlertTriangle,
  Search,
  Filter,
  Download,
  Printer,
  FileSpreadsheet,
  Award,
  Sparkles,
  Info,
  Building,
  Calendar,
  CheckSquare,
  XCircle,
  TrendingUp,
  FileText,
  UserCheck,
  Send,
  Plus
} from 'lucide-react';

export interface CriticalValueLogEntry {
  id: string;
  orderNumber: string;
  patientName: string;
  patientNationalId: string;
  testName: string;
  criticalValue: string;
  unit: string;
  referenceRange: string;
  alertType: 'CRITICO_ALTO' | 'CRITICO_BAJO' | 'DELTA_CHECK_SEVERO';
  detectedAt: string;
  acknowledged: boolean;
  acknowledgedByDoctor: string;
  doctorPhone: string;
  acknowledgedAt?: string;
  acknowledgedByTech: string;
  techLicenseNumber: string;
  communicationMethod: 'LLAMADA_READBACK' | 'PORTAL_MEDICO_ACK' | 'WHATSAPP_CONFIRMADO' | 'TELEFONO_URGENCIAS';
  readbackConfirmed: boolean;
  turnaroundTimeMinutes: number; // ISO 15189 SLA target < 15 min
  slaStatus: 'CUMPLIDO' | 'EXCEDIDO';
  isoAuditNotes: string;
  isoComplianceCode: string;
}

interface CriticalValueRegistryProps {
  initialEntries?: CriticalValueLogEntry[];
  onAcknowledgeNew?: (entry: CriticalValueLogEntry) => void;
}

const DEFAULT_CRITICAL_LOGS: CriticalValueLogEntry[] = [
  {
    id: 'iso-log-101',
    orderNumber: 'ORD-2026-0892',
    patientName: 'Juan Carlos Pérez',
    patientNationalId: '8-765-4321',
    testName: 'Potasio en Suero (K+)',
    criticalValue: '6.4',
    unit: 'mmol/L',
    referenceRange: '3.5 - 5.1 mmol/L',
    alertType: 'CRITICO_ALTO',
    detectedAt: '2026-08-12 08:15:00',
    acknowledged: true,
    acknowledgedByDoctor: 'Dr. Roberto Icaza',
    doctorPhone: '+507 6612-9900',
    acknowledgedAt: '2026-08-12 08:22:15',
    acknowledgedByTech: 'Lic. Sofía Guardia',
    techLicenseNumber: 'TM-3109',
    communicationMethod: 'LLAMADA_READBACK',
    readbackConfirmed: true,
    turnaroundTimeMinutes: 7,
    slaStatus: 'CUMPLIDO',
    isoAuditNotes: 'Lectura de retorno verbal (Read-Back) confirmada telefónicamente por el Dr. Icaza. Paciente derivado a EKG de urgencia.',
    isoComplianceCode: 'ISO15189-CRIT-2026-0892'
  },
  {
    id: 'iso-log-102',
    orderNumber: 'ORD-2026-0895',
    patientName: 'María Elena González',
    patientNationalId: '8-812-4432',
    testName: 'Plaquetas en Sangre Total',
    criticalValue: '18,000',
    unit: '10^3/uL',
    referenceRange: '150,000 - 450,000 /uL',
    alertType: 'CRITICO_BAJO',
    detectedAt: '2026-08-12 09:30:00',
    acknowledged: true,
    acknowledgedByDoctor: 'Dra. Carmen Rivera',
    doctorPhone: '+507 6788-1234',
    acknowledgedAt: '2026-08-12 09:39:40',
    acknowledgedByTech: 'Lic. Carlos Castillo',
    techLicenseNumber: 'TM-2840',
    communicationMethod: 'LLAMADA_READBACK',
    readbackConfirmed: true,
    turnaroundTimeMinutes: 9,
    slaStatus: 'CUMPLIDO',
    isoAuditNotes: 'Se realiza verificación previa en frotis sanguíneo para descartar pseudotrombocitopenia. Notificado y confirmado por Dra. Rivera.',
    isoComplianceCode: 'ISO15189-CRIT-2026-0895'
  },
  {
    id: 'iso-log-103',
    orderNumber: 'ORD-2026-0890',
    patientName: 'Carlos Alberto Rodríguez',
    patientNationalId: '4-721-9981',
    testName: 'Glucosa en Ayunas',
    criticalValue: '38',
    unit: 'mg/dL',
    referenceRange: '70 - 99 mg/dL',
    alertType: 'CRITICO_BAJO',
    detectedAt: '2026-08-12 07:45:00',
    acknowledged: true,
    acknowledgedByDoctor: 'Dr. Fernando Guardia',
    doctorPhone: '+507 6555-4321',
    acknowledgedAt: '2026-08-12 07:51:10',
    acknowledgedByTech: 'Lic. Sofía Guardia',
    techLicenseNumber: 'TM-3109',
    communicationMethod: 'PORTAL_MEDICO_ACK',
    readbackConfirmed: true,
    turnaroundTimeMinutes: 6,
    slaStatus: 'CUMPLIDO',
    isoAuditNotes: 'Notificación urgente emitida al portal médico y respuesta con acuse digital inmediato.',
    isoComplianceCode: 'ISO15189-CRIT-2026-0890'
  },
  {
    id: 'iso-log-104',
    orderNumber: 'ORD-2026-0901',
    patientName: 'Ana Patricia Morales',
    patientNationalId: '8-901-2345',
    testName: 'Troponina I de Alta Sensibilidad',
    criticalValue: '2.84',
    unit: 'ng/mL',
    referenceRange: '< 0.04 ng/mL',
    alertType: 'CRITICO_ALTO',
    detectedAt: '2026-08-12 10:05:00',
    acknowledged: true,
    acknowledgedByDoctor: 'Dr. Alejandro Méndez',
    doctorPhone: '+507 6222-1100',
    acknowledgedAt: '2026-08-12 10:18:20',
    acknowledgedByTech: 'Lic. Miguel Ángel Torres',
    techLicenseNumber: 'TM-1955',
    communicationMethod: 'TELEFONO_URGENCIAS',
    readbackConfirmed: true,
    turnaroundTimeMinutes: 13,
    slaStatus: 'CUMPLIDO',
    isoAuditNotes: 'Síndrome coronario agudo. Llamada directa a central de urgencias hospitalarias.',
    isoComplianceCode: 'ISO15189-CRIT-2026-0901'
  },
  {
    id: 'iso-log-105',
    orderNumber: 'ORD-2026-0914',
    patientName: 'Roberto José Díaz',
    patientNationalId: '3-456-7890',
    testName: 'Sodio en Suero (Na+)',
    criticalValue: '118',
    unit: 'mmol/L',
    referenceRange: '135 - 145 mmol/L',
    alertType: 'CRITICO_BAJO',
    detectedAt: '2026-08-12 10:40:00',
    acknowledged: false,
    acknowledgedByDoctor: 'Dr. Ernesto Samudio',
    doctorPhone: '+507 6890-5544',
    acknowledgedByTech: 'Lic. Sofía Guardia',
    techLicenseNumber: 'TM-3109',
    communicationMethod: 'LLAMADA_READBACK',
    readbackConfirmed: false,
    turnaroundTimeMinutes: 22,
    slaStatus: 'EXCEDIDO',
    isoAuditNotes: 'Primer intento telefónico sin respuesta. Dejado mensaje de texto de alta prioridad. Reintento en curso.',
    isoComplianceCode: 'ISO15189-CRIT-2026-0914'
  }
];

export const CriticalValueRegistry: React.FC<CriticalValueRegistryProps> = ({
  initialEntries = DEFAULT_CRITICAL_LOGS
}) => {
  const [logs, setLogs] = useState<CriticalValueLogEntry[]>(initialEntries);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACKNOWLEDGED' | 'PENDING' | 'SLA_EXCEEDED'>('ALL');
  const [selectedLogForDetail, setSelectedLogForDetail] = useState<CriticalValueLogEntry | null>(null);

  // New Acknowledgment Log Modal State
  const [showLogModal, setShowLogModal] = useState(false);
  const [newOrder, setNewOrder] = useState('ORD-2026-0920');
  const [newPatient, setNewPatient] = useState('Dora Isabel Lasso');
  const [newPatientId, setNewPatientId] = useState('8-334-1122');
  const [newTest, setNewTest] = useState('Hemoglobina (Hb)');
  const [newValue, setNewValue] = useState('6.2');
  const [newUnit, setNewUnit] = useState('g/dL');
  const [newDoctor, setNewDoctor] = useState('Dr. Jaime Montenegro');
  const [newDoctorPhone, setNewDoctorPhone] = useState('+507 6444-8899');
  const [newTech, setNewTech] = useState('Lic. Sofía Guardia');
  const [newTechLic, setNewTechLic] = useState('TM-3109');
  const [newMethod, setNewMethod] = useState<'LLAMADA_READBACK' | 'PORTAL_MEDICO_ACK' | 'WHATSAPP_CONFIRMADO' | 'TELEFONO_URGENCIAS'>('LLAMADA_READBACK');
  const [newReadback, setNewReadback] = useState(true);
  const [newNotes, setNewNotes] = useState('Verificación telefónica realizada de inmediato. Se leyó el valor 6.2 g/dL y el Dr. Montenegro confirmó la lectura verbalmente (Read-Back ISO 15189).');

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (statusFilter === 'ACKNOWLEDGED' && !log.acknowledged) return false;
      if (statusFilter === 'PENDING' && log.acknowledged) return false;
      if (statusFilter === 'SLA_EXCEEDED' && log.slaStatus !== 'EXCEDIDO') return false;

      if (searchTerm.trim() !== '') {
        const q = searchTerm.toLowerCase();
        const matchPatient = log.patientName.toLowerCase().includes(q);
        const matchOrder = log.orderNumber.toLowerCase().includes(q);
        const matchTest = log.testName.toLowerCase().includes(q);
        const matchDoctor = log.acknowledgedByDoctor.toLowerCase().includes(q);
        const matchTech = log.acknowledgedByTech.toLowerCase().includes(q);
        const matchCode = log.isoComplianceCode.toLowerCase().includes(q);
        return matchPatient || matchOrder || matchTest || matchDoctor || matchTech || matchCode;
      }
      return true;
    });
  }, [logs, statusFilter, searchTerm]);

  // Aggregate Metrics for ISO 15189 Quality Control
  const metrics = useMemo(() => {
    const total = logs.length;
    const acked = logs.filter((l) => l.acknowledged).length;
    const pending = total - acked;
    const slaCompliant = logs.filter((l) => l.slaStatus === 'CUMPLIDO').length;
    const complianceRate = total > 0 ? Math.round((slaCompliant / total) * 100) : 100;
    const avgTat = total > 0 ? Math.round(logs.reduce((acc, l) => acc + l.turnaroundTimeMinutes, 0) / total) : 0;

    return { total, acked, pending, complianceRate, avgTat };
  }, [logs]);

  // Handle Log Acknowledgment Registration
  const handleCreateAckLog = (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date();
    const formattedNow = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    const newLogEntry: CriticalValueLogEntry = {
      id: `iso-log-${Date.now()}`,
      orderNumber: newOrder,
      patientName: newPatient,
      patientNationalId: newPatientId,
      testName: newTest,
      criticalValue: newValue,
      unit: newUnit,
      referenceRange: '12.0 - 16.0 g/dL',
      alertType: 'CRITICO_BAJO',
      detectedAt: formattedNow,
      acknowledged: true,
      acknowledgedByDoctor: newDoctor,
      doctorPhone: newDoctorPhone,
      acknowledgedAt: formattedNow,
      acknowledgedByTech: newTech,
      techLicenseNumber: newTechLic,
      communicationMethod: newMethod,
      readbackConfirmed: newReadback,
      turnaroundTimeMinutes: 5,
      slaStatus: 'CUMPLIDO',
      isoAuditNotes: newNotes,
      isoComplianceCode: `ISO15189-CRIT-${Math.floor(1000 + Math.random() * 9000)}`
    };

    setLogs([newLogEntry, ...logs]);
    setShowLogModal(false);
  };

  // Quick Acknowledge Pending Entry
  const handleQuickAcknowledge = (id: string) => {
    const now = new Date();
    const formattedNow = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    setLogs((prev) =>
      prev.map((l) =>
        l.id === id
          ? {
              ...l,
              acknowledged: true,
              acknowledgedAt: formattedNow,
              readbackConfirmed: true,
              slaStatus: 'CUMPLIDO',
              turnaroundTimeMinutes: 12,
              isoAuditNotes: 'Llamada telefónica reintentada con éxito. Lectura verbal repetida por el médico (Read-Back OK).'
            }
          : l
      )
    );
  };

  // CSV Export for ISO Audits
  const handleExportCSV = () => {
    const headers = [
      'Codigo_Auditoria_ISO',
      'Orden',
      'Paciente',
      'Cedula',
      'Prueba_Critica',
      'Valor_Critico',
      'Unidad',
      'Fecha_Deteccion',
      'Estado_Notificacion',
      'Medico_Notificado',
      'Telefono_Medico',
      'Fecha_Notificacion',
      'Tecnologo_Responsable',
      'Licencia_TM',
      'Metodo_Comunicacion',
      'ReadBack_Verbal',
      'TAT_Minutos',
      'Cumplimiento_SLA_15Min',
      'Notas_Auditoria'
    ];

    const rows = logs.map((l) => [
      l.isoComplianceCode,
      l.orderNumber,
      `"${l.patientName}"`,
      l.patientNationalId,
      `"${l.testName}"`,
      l.criticalValue,
      l.unit,
      l.detectedAt,
      l.acknowledged ? 'NOTIFICADO' : 'PENDIENTE',
      `"${l.acknowledgedByDoctor}"`,
      l.doctorPhone,
      l.acknowledgedAt || 'N/A',
      `"${l.acknowledgedByTech}"`,
      l.techLicenseNumber,
      l.communicationMethod,
      l.readbackConfirmed ? 'SI' : 'NO',
      l.turnaroundTimeMinutes,
      l.slaStatus,
      `"${l.isoAuditNotes.replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ISO15189_Registro_Valores_Criticos_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* ISO 15189 Header Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-red-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-2xl border border-red-800/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-red-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="text-red-400 text-xs font-black uppercase tracking-widest mb-1.5 flex items-center space-x-2">
              <Award className="w-4 h-4 text-amber-400" />
              <span>Norma ISO 15189:2022 — Sección 7.4.1.5 Notificación de Resultados Críticos</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center space-x-3">
              <span>Bitácora Auditable de Valores Críticos (Panic Registry)</span>
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl">
              Registro inalterable de comunicación efectiva con el médico tratante, hora exacta de notificación, confirmación verbal de lectura de retorno (Read-Back) y trazabilidad del tecnólogo médico.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => setShowLogModal(true)}
              className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-extrabold px-4 py-2.5 rounded-2xl text-xs transition shadow-lg shadow-red-600/30 flex items-center space-x-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Notificación Manual</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="bg-slate-900/90 border border-slate-700 hover:border-slate-500 text-slate-200 font-bold px-4 py-2.5 rounded-2xl text-xs transition flex items-center space-x-2 cursor-pointer"
              title="Descargar reporte auditable para inspección MINSA / ISO"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Exportar Reporte ISO (CSV)</span>
            </button>
          </div>
        </div>

        {/* Quality Metrics Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-5 border-t border-red-900/50 text-xs">
          <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
            <span className="text-slate-400 font-medium block">Cumplimiento ISO 15189</span>
            <strong className="text-lg font-black text-emerald-400 font-mono">{metrics.complianceRate}% SLA</strong>
            <span className="text-[10px] text-slate-400 block mt-0.5">Meta: Notificación &lt; 15 mins</span>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
            <span className="text-slate-400 font-medium block">Total Alertas Auditadas</span>
            <strong className="text-lg font-black text-white font-mono">{metrics.total} casos</strong>
            <span className="text-[10px] text-emerald-400 block mt-0.5">✓ {metrics.acked} confirmados</span>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
            <span className="text-slate-400 font-medium block">Pendientes de Confirmación</span>
            <strong className={`text-lg font-black font-mono ${metrics.pending > 0 ? 'text-rose-400 animate-pulse' : 'text-slate-300'}`}>
              {metrics.pending} pendientes
            </strong>
            <span className="text-[10px] text-slate-400 block mt-0.5">Requerimiento urgente</span>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
            <span className="text-slate-400 font-medium block">Promedio TAT Notificación</span>
            <strong className="text-lg font-black text-cyan-300 font-mono">{metrics.avgTat} min</strong>
            <span className="text-[10px] text-slate-400 block mt-0.5">Detección a confirmación</span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por paciente, cédula, código ISO, médico, tecnólogo o examen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs font-medium focus:outline-none focus:border-red-500 focus:bg-white transition"
          />
        </div>

        {/* Tab Filters */}
        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              statusFilter === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Todos ({metrics.total})
          </button>

          <button
            onClick={() => setStatusFilter('ACKNOWLEDGED')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center space-x-1 ${
              statusFilter === 'ACKNOWLEDGED'
                ? 'bg-emerald-600 text-white font-extrabold shadow-sm'
                : 'text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Confirmados ({metrics.acked})</span>
          </button>

          <button
            onClick={() => setStatusFilter('PENDING')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center space-x-1 ${
              statusFilter === 'PENDING'
                ? 'bg-rose-600 text-white font-extrabold shadow-sm'
                : 'text-rose-700 hover:bg-rose-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pendientes ({metrics.pending})</span>
          </button>

          <button
            onClick={() => setStatusFilter('SLA_EXCEEDED')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              statusFilter === 'SLA_EXCEEDED' ? 'bg-amber-600 text-white shadow-sm' : 'text-amber-800 hover:bg-amber-100'
            }`}
          >
            SLA Excedido
          </button>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-300 uppercase text-[10px] font-black tracking-wider">
              <tr>
                <th className="p-3.5 pl-5">Código ISO / Orden</th>
                <th className="p-3.5">Paciente & Cédula</th>
                <th className="p-3.5">Prueba Crítica</th>
                <th className="p-3.5 text-center">Valor Obtenido</th>
                <th className="p-3.5">Médico Notificado</th>
                <th className="p-3.5">Tecnólogo Médico</th>
                <th className="p-3.5 text-center">Read-Back</th>
                <th className="p-3.5 text-center">TAT (Min)</th>
                <th className="p-3.5 text-center">Estado ISO</th>
                <th className="p-3.5 text-right pr-5">Acción</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-500 font-bold">
                    No hay registros de valores críticos con los criterios seleccionados.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const isPending = !log.acknowledged;
                  return (
                    <tr
                      key={log.id}
                      className={`hover:bg-slate-50/80 transition ${
                        isPending ? 'bg-rose-50/50' : log.slaStatus === 'EXCEDIDO' ? 'bg-amber-50/40' : ''
                      }`}
                    >
                      {/* Code & Order */}
                      <td className="p-3.5 pl-5">
                        <div className="font-mono font-black text-slate-900 text-[11px]">
                          {log.isoComplianceCode}
                        </div>
                        <div className="text-[10px] font-mono text-slate-500">{log.orderNumber}</div>
                      </td>

                      {/* Patient */}
                      <td className="p-3.5">
                        <div className="font-extrabold text-slate-900">{log.patientName}</div>
                        <div className="text-[10px] font-mono text-slate-500">{log.patientNationalId}</div>
                      </td>

                      {/* Test */}
                      <td className="p-3.5">
                        <div className="font-bold text-slate-800">{log.testName}</div>
                        <div className="text-[10px] text-slate-500">Ref: {log.referenceRange}</div>
                      </td>

                      {/* Critical Value */}
                      <td className="p-3.5 text-center">
                        <span className="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-900 font-mono font-black border border-rose-300 inline-block shadow-sm">
                          {log.criticalValue} <span className="text-[10px]">{log.unit}</span>
                        </span>
                      </td>

                      {/* Doctor */}
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900">{log.acknowledgedByDoctor}</div>
                        <div className="text-[10px] font-mono text-emerald-700 flex items-center space-x-1">
                          <PhoneCall className="w-3 h-3 text-emerald-600 inline mr-0.5" />
                          <span>{log.doctorPhone}</span>
                        </div>
                      </td>

                      {/* Tech */}
                      <td className="p-3.5">
                        <div className="font-semibold text-slate-800">{log.acknowledgedByTech}</div>
                        <div className="text-[10px] font-mono text-slate-500">Lic. {log.techLicenseNumber}</div>
                      </td>

                      {/* Read-Back Confirmed */}
                      <td className="p-3.5 text-center">
                        {log.readbackConfirmed ? (
                          <span className="inline-flex items-center space-x-1 bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-full text-[10px] border border-emerald-300">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Confirmado</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 bg-rose-100 text-rose-800 font-extrabold px-2 py-0.5 rounded-full text-[10px] border border-rose-300">
                            <XCircle className="w-3 h-3 text-rose-600" />
                            <span>Pendiente</span>
                          </span>
                        )}
                      </td>

                      {/* TAT */}
                      <td className="p-3.5 text-center font-mono font-extrabold text-slate-800">
                        {log.turnaroundTimeMinutes} min
                      </td>

                      {/* SLA Status */}
                      <td className="p-3.5 text-center">
                        {log.acknowledged ? (
                          <span className="bg-emerald-100 text-emerald-800 font-black px-2.5 py-1 rounded-full text-[10px] border border-emerald-300 uppercase">
                            ISO COMPLIANT
                          </span>
                        ) : (
                          <span className="bg-rose-600 text-white font-black px-2.5 py-1 rounded-full text-[10px] shadow animate-pulse uppercase">
                            REQUERIDO
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-right pr-5">
                        <div className="flex items-center justify-end space-x-2">
                          {isPending && (
                            <button
                              onClick={() => handleQuickAcknowledge(log.id)}
                              className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white font-extrabold text-[10px] rounded-lg transition shadow cursor-pointer"
                              title="Registrar llamada y Read-Back"
                            >
                              Confirmar
                            </button>
                          )}

                          <button
                            onClick={() => setSelectedLogForDetail(log)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition cursor-pointer"
                            title="Ver detalle completo de auditoría"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Register Manual Acknowledgment */}
      {showLogModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2.5 bg-red-100 text-red-600 rounded-2xl">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">Registro de Notificación ISO 15189</h3>
                  <p className="text-slate-500 text-xs">Acreditación de lectura verbal de valor de pánico (Read-Back)</p>
                </div>
              </div>
              <button onClick={() => setShowLogModal(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAckLog} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-slate-700">Número de Orden</label>
                  <input
                    type="text"
                    required
                    value={newOrder}
                    onChange={(e) => setNewOrder(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-slate-700">Paciente & Cédula</label>
                  <input
                    type="text"
                    required
                    value={newPatient}
                    onChange={(e) => setNewPatient(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-slate-700">Examen Crítico</label>
                  <input
                    type="text"
                    required
                    value={newTest}
                    onChange={(e) => setNewTest(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-slate-700">Valor Obtenido</label>
                  <input
                    type="text"
                    required
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-black text-red-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-slate-700">Unidad</label>
                  <input
                    type="text"
                    required
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-slate-700">Médico Tratante Notificado</label>
                  <input
                    type="text"
                    required
                    value={newDoctor}
                    onChange={(e) => setNewDoctor(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-slate-700">Teléfono Contacto Médico</label>
                  <input
                    type="text"
                    required
                    value={newDoctorPhone}
                    onChange={(e) => setNewDoctorPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-slate-700">Tecnólogo Médico Responsable</label>
                  <input
                    type="text"
                    required
                    value={newTech}
                    onChange={(e) => setNewTech(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-slate-700">N° de Licencia TM</label>
                  <input
                    type="text"
                    required
                    value={newTechLic}
                    onChange={(e) => setNewTechLic(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-extrabold text-slate-700">Método de Comunicación</label>
                <select
                  value={newMethod}
                  onChange={(e: any) => setNewMethod(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold"
                >
                  <option value="LLAMADA_READBACK">Llamada Telefónica con Lectura de Retorno (Read-Back)</option>
                  <option value="PORTAL_MEDICO_ACK">Portal Médico con Acuse Digital</option>
                  <option value="WHATSAPP_CONFIRMADO">WhatsApp Oficial con Confirmación</option>
                  <option value="TELEFONO_URGENCIAS">Llamada Directa a Central de Urgencias Hospitalarias</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-extrabold text-slate-700">Bitácora / Notas de Auditoría ISO 15189</label>
                <textarea
                  rows={3}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-sans"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-xl shadow cursor-pointer"
                >
                  Guardar en Bitácora Auditable
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Detailed View for Inspection */}
      {selectedLogForDetail && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-black font-mono text-red-600 uppercase tracking-widest block">
                  {selectedLogForDetail.isoComplianceCode}
                </span>
                <h3 className="font-black text-slate-900 text-lg">Hoja de Registro de Valor Crítico ISO 15189</h3>
              </div>
              <button onClick={() => setSelectedLogForDetail(null)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 border-b border-slate-200 pb-2">
                <div>Paciente: <strong className="text-slate-900 block">{selectedLogForDetail.patientName}</strong></div>
                <div>Cédula: <strong className="text-slate-900 block font-mono">{selectedLogForDetail.patientNationalId}</strong></div>
              </div>

              <div className="grid grid-cols-2 gap-2 border-b border-slate-200 pb-2">
                <div>Examen: <strong className="text-slate-900 block">{selectedLogForDetail.testName}</strong></div>
                <div>Resultado: <strong className="text-red-600 text-sm font-mono block font-black">{selectedLogForDetail.criticalValue} {selectedLogForDetail.unit}</strong></div>
              </div>

              <div className="grid grid-cols-2 gap-2 border-b border-slate-200 pb-2">
                <div>Médico Notificado: <strong className="text-slate-900 block">{selectedLogForDetail.acknowledgedByDoctor}</strong></div>
                <div>Teléfono: <strong className="text-emerald-700 block font-mono">{selectedLogForDetail.doctorPhone}</strong></div>
              </div>

              <div className="grid grid-cols-2 gap-2 border-b border-slate-200 pb-2">
                <div>Tecnólogo Responsable: <strong className="text-slate-900 block">{selectedLogForDetail.acknowledgedByTech}</strong></div>
                <div>Licencia TM: <strong className="text-slate-900 block font-mono">{selectedLogForDetail.techLicenseNumber}</strong></div>
              </div>

              <div className="grid grid-cols-2 gap-2 border-b border-slate-200 pb-2">
                <div>Fecha Detección: <span className="text-slate-800 font-mono block font-semibold">{selectedLogForDetail.detectedAt}</span></div>
                <div>Fecha Notificación: <span className="text-emerald-700 font-mono block font-bold">{selectedLogForDetail.acknowledgedAt || 'Pendiente'}</span></div>
              </div>

              <div>
                <span className="font-extrabold text-slate-700 block mb-1">Notas del Protocolo Read-Back:</span>
                <p className="bg-white p-3 rounded-xl border border-slate-200 text-slate-800 font-medium leading-relaxed">
                  {selectedLogForDetail.isoAuditNotes}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
              <span className="font-mono">Cumplimiento ISO 15189 §7.4.1.5</span>
              <button
                onClick={() => setSelectedLogForDetail(null)}
                className="px-5 py-2 bg-slate-900 text-white font-extrabold rounded-xl"
              >
                Cerrar Hoja de Auditoría
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
