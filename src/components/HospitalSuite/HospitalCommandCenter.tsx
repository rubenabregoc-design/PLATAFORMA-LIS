import React from 'react';
import {
  Building2,
  BedDouble,
  HeartPulse,
  Activity,
  Microscope,
  Pill,
  Clock,
  AlertOctagon,
  CheckCircle2,
  TrendingUp,
  ShieldCheck,
  ArrowUpRight,
  Users,
  Flame
} from 'lucide-react';
import { useHisStore } from '../../store/useHisStore';
import { useLisStore } from '../../store/useLisStore';

interface CommandCenterProps {
  onNavigateTab: (tab: string) => void;
}

export const HospitalCommandCenter: React.FC<CommandCenterProps> = ({ onNavigateTab }) => {
  const hisStore = useHisStore();
  const lisStore = useLisStore();

  const beds = hisStore?.beds || [];
  const admissions = hisStore?.admissions || [];
  const triageRecords = hisStore?.triageRecords || [];
  const orders = lisStore?.orders || [];
  const results = lisStore?.results || [];

  const totalBeds = Math.max(1, beds.length);
  const occupiedBeds = beds.filter((b) => b?.status === 'OCUPADA').length;
  const availableBeds = beds.filter((b) => b?.status === 'DISPONIBLE').length;
  const disinfectionBeds = beds.filter((b) => b?.status === 'DESINFECCION').length;
  const occupancyRate = Math.round((occupiedBeds / totalBeds) * 100);

  const criticalTriage = triageRecords.filter((t) => t.priority === 'NIVEL_1_ROJO' || t.priority === 'NIVEL_2_NARANJA');
  const statLabOrders = orders.filter((o) => o.priority === 'STAT');
  const panicResults = results.filter((r) => r.flag === 'CRITICO_ALTO' || r.flag === 'CRITICO_BAJO');

  // Wards occupancy calculation
  const wards = ['URGENCIAS', 'HOSPITALIZACION', 'UCI', 'CIRUGIA', 'PEDIATRIA'] as const;
  const wardStats = wards.map((w) => {
    const wardBeds = beds.filter((b) => b.ward === w);
    const wardOccupied = wardBeds.filter((b) => b.status === 'OCUPADA').length;
    const rate = wardBeds.length > 0 ? Math.round((wardOccupied / wardBeds.length) * 100) : 0;
    return { ward: w, total: wardBeds.length, occupied: wardOccupied, rate };
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-indigo-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center space-x-2 text-indigo-400 text-xs font-black uppercase tracking-widest mb-1.5">
              <Building2 className="w-4 h-4" />
              <span>Centro de Mando Hospitalario • HIS-Core Operations</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Hospital Command Center & Vigilancia Clínica
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
              Panel integrado de gestión de capacidad hospitalaria, flujo de pacientes en Urgencias e interoperabilidad en tiempo real con el LIS.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onNavigateTab('his_triage')}
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 shadow-lg shadow-rose-600/20"
            >
              <HeartPulse className="w-4 h-4" />
              <span>Triage Urgencias</span>
            </button>
            <button
              onClick={() => onNavigateTab('his_beds')}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 shadow-lg shadow-indigo-600/20"
            >
              <BedDouble className="w-4 h-4" />
              <span>Censo de Camas</span>
            </button>
            <button
              onClick={() => onNavigateTab('his_ehr')}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition cursor-pointer flex items-center space-x-1.5"
            >
              <Activity className="w-4 h-4" />
              <span>Expediente EHR</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Main KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* KPI 1: Occupancy */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
            <span>Ocupación Hospitalaria</span>
            <BedDouble className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-black text-white">{occupancyRate}%</span>
            <span className="text-xs text-slate-400">({occupiedBeds}/{totalBeds} camas)</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                occupancyRate > 85 ? 'bg-rose-500' : occupancyRate > 65 ? 'bg-amber-400' : 'bg-indigo-500'
              }`}
              style={{ width: `${occupancyRate}%` }}
            />
          </div>
        </div>

        {/* KPI 2: Emergency Triage */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
            <span>Pacientes en Urgencias</span>
            <HeartPulse className="w-4 h-4 text-rose-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-black text-rose-400">{criticalTriage.length}</span>
            <span className="text-xs text-slate-400">Prioridad Roja / Naranja</span>
          </div>
          <p className="text-[11px] text-slate-500">
            {triageRecords.length} evaluaciones registradas en las últimas 24h
          </p>
        </div>

        {/* KPI 3: STAT Lab Requests */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
            <span>Órdenes STAT al LIS</span>
            <Microscope className="w-4 h-4 text-teal-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-black text-teal-300">{statLabOrders.length}</span>
            <span className="text-xs text-slate-400">Exámenes urgentes</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Enlace bidireccional LIS activo • TAT medio: 35 min
          </p>
        </div>

        {/* KPI 4: Panic Lab Values */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
            <span>Valores de Pánico LIS</span>
            <AlertOctagon className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-black text-amber-300">{panicResults.length}</span>
            <span className="text-xs text-slate-400">Alertas críticas activas</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Notificación automática a médico de cabecera enviada
          </p>
        </div>
      </div>

      {/* Ward Breakdown and Active Admissions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Ward Capacity Progress */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-white text-base flex items-center space-x-2">
              <Building2 className="w-4 h-4 text-indigo-400" />
              <span>Capacidad por Sala Hospitalaria</span>
            </h3>
            <span className="text-xs text-slate-400 font-bold uppercase">Censo Actual</span>
          </div>

          <div className="space-y-4 pt-1">
            {wardStats.map((item) => (
              <div key={item.ward} className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-300">{item.ward}</span>
                  <span className="font-mono text-slate-400">
                    <strong className="text-white">{item.occupied}</strong> de {item.total} camas ({item.rate}%)
                  </span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      item.rate > 80 ? 'bg-rose-500' : item.rate > 50 ? 'bg-indigo-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${item.rate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Hospital Inpatients Feed */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-white text-base flex items-center space-x-2">
              <Users className="w-4 h-4 text-teal-400" />
              <span>Pacientes Hospitalizados Activos ({admissions.filter((a) => a.status === 'ACTIVA').length})</span>
            </h3>
            <button
              onClick={() => onNavigateTab('his_ehr')}
              className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
            >
              <span>Ver Todos en EHR</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
            {admissions
              .filter((a) => a.status === 'ACTIVA')
              .map((adm) => {
                const bed = beds.find((b) => b.id === adm.bedId);
                return (
                  <div
                    key={adm.id}
                    onClick={() => onNavigateTab('his_ehr')}
                    className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-2xl flex items-center justify-between gap-3 text-xs hover:border-slate-700 transition cursor-pointer"
                  >
                    <div>
                      <div className="font-bold text-white text-sm">{adm.patientName}</div>
                      <div className="text-[11px] text-indigo-300 font-mono">
                        {adm.ward} • Cama {bed?.bedNumber || 'S/A'}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        DX: {adm.primaryDiagnosisIcd10}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        {adm.status}
                      </span>
                      <div className="text-[10px] text-slate-500 mt-1">
                        {new Date(adm.admissionDate).toLocaleDateString('es-PA')}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
};
