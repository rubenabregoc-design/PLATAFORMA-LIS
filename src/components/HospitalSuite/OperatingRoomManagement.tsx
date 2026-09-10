import React, { useState } from 'react';
import {
  Scissors,
  Clock,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  UserCheck,
  BedDouble,
  Search,
  Filter,
  Activity,
  Layers,
  Sparkles,
  HeartPulse,
  Award,
  Calendar,
  FileText
} from 'lucide-react';

export interface SurgerySchedule {
  id: string;
  surgeryNumber: string; // e.g. "OR-2026-0041"
  patientName: string;
  patientNationalId: string;
  procedureName: string;
  operatingRoom: string; // e.g. "Quirófano 2 (Cirugía Mayor)"
  surgeonName: string;
  anesthesiologistName: string;
  scheduledTime: string;
  status: 'PROGRAMADA' | 'EN_CIRUGIA' | 'RECUPERACION_PACU' | 'COMPLETADA';
  asaClass: string; // ASA I, ASA II, ASA III
  whoChecklistVerified: boolean;
}

const INITIAL_SURGERIES: SurgerySchedule[] = [
  {
    id: 'or-101',
    surgeryNumber: 'OR-2026-0812',
    patientName: 'Ríos, Gonzalo A.',
    patientNationalId: '8-745-1290',
    procedureName: 'Apendicectomía Laparoscópica de Urgencia',
    operatingRoom: 'Quirófano 1 (Emergencias)',
    surgeonName: 'Dr. Alejandro Icaza (Cirugía General)',
    anesthesiologistName: 'Dra. Carmen Boyd (Anestesiología)',
    scheduledTime: '2026-08-21 11:00 AM',
    status: 'EN_CIRUGIA',
    asaClass: 'ASA II E',
    whoChecklistVerified: true
  },
  {
    id: 'or-102',
    surgeryNumber: 'OR-2026-0815',
    patientName: 'Castillo, Sofía Elena',
    patientNationalId: '8-901-4412',
    procedureName: 'Colecistectomía Programada por Laparoscopia',
    operatingRoom: 'Quirófano 2 (Electiva)',
    surgeonName: 'Dr. Jorge Mendoza',
    anesthesiologistName: 'Dr. Fernando Arango',
    scheduledTime: '2026-08-21 13:30 PM',
    status: 'PROGRAMADA',
    asaClass: 'ASA I',
    whoChecklistVerified: true
  },
  {
    id: 'or-103',
    surgeryNumber: 'OR-2026-0818',
    patientName: 'Mendoza, Alejandro',
    patientNationalId: 'PE-982103',
    procedureName: 'Reemplazo Total de Cadera Izquierda',
    operatingRoom: 'Quirófano 3 (Ortopedia)',
    surgeonName: 'Dr. Roberto Eisenmann',
    anesthesiologistName: 'Dra. Carmen Boyd',
    scheduledTime: '2026-08-21 08:00 AM',
    status: 'RECUPERACION_PACU',
    asaClass: 'ASA II',
    whoChecklistVerified: true
  }
];

export const OperatingRoomManagement: React.FC = () => {
  const [surgeries, setSurgeries] = useState<SurgerySchedule[]>(INITIAL_SURGERIES);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');

  const filteredSurgeries = surgeries.filter(item => {
    const matchesSearch =
      item.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.patientNationalId.includes(searchTerm) ||
      item.procedureName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatusFilter === 'ALL' || item.status === selectedStatusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 font-sans">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-rose-950/40 to-slate-900 border border-rose-800/40 p-6 sm:p-8 rounded-3xl text-white shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center space-x-2 text-xs font-bold text-rose-400 bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20 mb-2">
            <Scissors className="w-3.5 h-3.5" />
            <span>HIS • Quirófano, Cirugía & Anestesiología (OR Management)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Gestión Quirúrgica & Cirugía Segura OMS
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            Programación de salas de operaciones, evaluación anestésica preoperatoria, verificación de lista OMS y sala de recuperación post-anestésica (PACU).
          </p>
        </div>

        <div className="flex items-center space-x-3 bg-slate-950/80 border border-slate-800 p-4 rounded-2xl text-xs">
          <ShieldCheck className="w-8 h-8 text-emerald-400 shrink-0" />
          <div>
            <div className="font-bold text-white">Checklist OMS Verificado</div>
            <div className="text-slate-400 text-[11px]">Entrada, Pausa Quirúrgica y Salida</div>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar procedimiento, cirujano o paciente..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:border-rose-500 outline-none font-sans"
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto overflow-x-auto pb-1">
          <Filter className="w-4 h-4 text-slate-500 shrink-0" />
          {['ALL', 'PROGRAMADA', 'EN_CIRUGIA', 'RECUPERACION_PACU'].map(st => (
            <button
              key={st}
              onClick={() => setSelectedStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase transition cursor-pointer whitespace-nowrap ${
                selectedStatusFilter === st
                  ? 'bg-rose-600 text-white shadow'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {st === 'ALL' ? 'Todas las Cirugías' : st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Surgery Schedule Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800 uppercase text-[10px] tracking-wider">
              <th className="p-4">N° Cirugía</th>
              <th className="p-4">Paciente / Cédula</th>
              <th className="p-4">Procedimiento Quirúrgico</th>
              <th className="p-4">Quirófano / Horario</th>
              <th className="p-4 text-center">Riesgo ASA</th>
              <th className="p-4 text-center">Checklist OMS</th>
              <th className="p-4 text-center">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {filteredSurgeries.map(item => (
              <tr key={item.id} className="hover:bg-slate-800/40 transition">
                <td className="p-4 font-mono font-bold text-rose-400">{item.surgeryNumber}</td>
                <td className="p-4">
                  <p className="font-bold text-white">{item.patientName}</p>
                  <p className="text-[11px] text-slate-400 font-mono">{item.patientNationalId}</p>
                </td>
                <td className="p-4">
                  <p className="font-bold text-slate-200">{item.procedureName}</p>
                  <p className="text-[10px] text-slate-500">Cirujano: {item.surgeonName}</p>
                </td>
                <td className="p-4 text-slate-300">
                  <p className="font-bold text-teal-300">{item.operatingRoom}</p>
                  <p className="text-[10px] text-slate-400 font-mono">{item.scheduledTime}</p>
                </td>
                <td className="p-4 text-center font-mono font-bold text-amber-400">
                  {item.asaClass}
                </td>
                <td className="p-4 text-center">
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-lg text-[10px]">
                    <CheckCircle2 size={12} /> Verificado
                  </span>
                </td>
                <td className="p-4 text-center">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                    item.status === 'EN_CIRUGIA'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse'
                      : item.status === 'RECUPERACION_PACU'
                      ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}>
                    {item.status.replace('_', ' ')}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OperatingRoomManagement;
