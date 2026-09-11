import React, { useState } from 'react';
import {
  Activity, HeartPulse, Flame, AlertTriangle, ShieldCheck, Thermometer,
  Zap, Clock, FileText, CheckCircle2, ChevronRight, Wind, Droplets, RefreshCw
} from 'lucide-react';
import { useHisStore } from '../../store/useHisStore';

export const IcuCriticalCareModule: React.FC = () => {
  const { beds, admissions } = useHisStore();

  const icuBeds = beds.filter((b) => b.ward === 'UCI' || b.ward === 'URGENCIAS');

  const [selectedIcuBedId, setSelectedIcuBedId] = useState(icuBeds[0]?.id || 'bed-uci-01');

  const [mechanicalVentilator, setMechanicalVentilator] = useState({
    mode: 'PRVC / VCV',
    fio2: 45, // %
    peep: 8, // cmH2O
    respRate: 16, // bpm
    tidalVolume: 420 // mL
  });

  const [vasopressors, setVasopressors] = useState([
    { name: 'Norepinefrina', rate: '0.08 mcg/kg/min', status: 'INFUNDIENDO' },
    { name: 'Sedación Propofol 1%', rate: '25 mg/h', status: 'INFUNDIENDO' }
  ]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-slate-100">

      {/* Title Header */}
      <div className="bg-slate-900/90 border border-rose-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 bg-gradient-to-tr from-rose-600 to-amber-500 rounded-2xl flex items-center justify-center text-slate-950 font-black shadow-lg shadow-rose-600/30">
            <Activity className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl sm:text-2xl font-black text-white">Unidad de Cuidados Intensivos (UCI / ICU)</h2>
              <span className="bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                Monitorización Crítica ISO
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Monitoreo hemodinámico en tiempo real, ventilación mecánica, perfusión de vasopresores, escala Glasgow/RASS y balance hídrico continuo.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 bg-slate-950 px-4 py-2.5 rounded-2xl border border-rose-500/30 text-xs font-mono font-bold text-rose-300">
          <Flame className="w-4 h-4 text-rose-400 animate-pulse" />
          <span>4 Camas UCI Activas</span>
        </div>
      </div>

      {/* Bed Selector Bar */}
      <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
        {icuBeds.map((bed) => {
          const isSelected = selectedIcuBedId === bed.id;
          return (
            <button
              key={bed.id}
              onClick={() => setSelectedIcuBedId(bed.id)}
              className={`p-4 rounded-3xl border transition text-left cursor-pointer flex items-center space-x-3 shrink-0 ${
                isSelected
                  ? 'bg-gradient-to-r from-rose-950/80 via-slate-900 to-slate-900 border-rose-500 shadow-xl shadow-rose-600/20'
                  : 'bg-slate-900/90 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <div className={`w-3.5 h-3.5 rounded-full ${bed.status === 'OCUPADA' ? 'bg-rose-500 animate-ping' : 'bg-emerald-400'}`} />
              <div>
                <div className="text-xs font-black text-white">{bed.id}</div>
                <div className="text-[10px] text-slate-400 font-mono">{bed.currentPatientName || 'Cama Disponible'}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* 📊 ICU Vital Parameters & Mechanical Ventilator Grid (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">

        {/* LEFT 2-COLUMNS: Hemodynamic & Ventilator Workstation */}
        <div className="lg:col-span-2 space-y-6">

          {/* Hemodynamic Telemetry Gauges */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
                <HeartPulse className="w-5 h-5 text-rose-400 animate-pulse" />
                <span>Telemetría Hemodinámica Continuada</span>
              </h3>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                124 bpm • Sin arritmia
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-center">
              <div className="bg-slate-950 p-4 rounded-2xl border border-rose-500/30 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Presión Arterial (PAM)</span>
                <strong className="text-2xl font-black text-rose-400 block">115/70 <span className="text-xs text-slate-400 font-normal">(85)</span></strong>
                <span className="text-[9px] text-emerald-400 block">Normotenso</span>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-cyan-500/30 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Saturación SpO2</span>
                <strong className="text-2xl font-black text-cyan-300 block">97%</strong>
                <span className="text-[9px] text-cyan-400 block">FiO2 45% PRVC</span>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-indigo-500/30 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Escala Glasgow / RASS</span>
                <strong className="text-2xl font-black text-indigo-300 block">GCS 10t / -2</strong>
                <span className="text-[9px] text-slate-400 block">Sedación Moderada</span>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-amber-500/30 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Temperatura Central</span>
                <strong className="text-2xl font-black text-amber-300 block">37.2 °C</strong>
                <span className="text-[9px] text-emerald-400 block">Afebril</span>
              </div>
            </div>
          </div>

          {/* Mechanical Ventilation Control Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Wind className="w-5 h-5 text-cyan-400" />
                <h4 className="text-xs font-black uppercase tracking-wider text-white">
                  Parámetros de Ventilación Mecánica Asistida
                </h4>
              </div>
              <span className="text-[10px] font-mono bg-cyan-500/20 text-cyan-300 px-2.5 py-0.5 rounded-full font-bold">
                Modo: {mechanicalVentilator.mode}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase block">FiO2 Ajustado</span>
                <strong className="text-lg font-black text-cyan-300">{mechanicalVentilator.fio2}%</strong>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase block">PEEP</span>
                <strong className="text-lg font-black text-indigo-300">{mechanicalVentilator.peep} cmH2O</strong>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase block">Volumen Corriente (Vt)</span>
                <strong className="text-lg font-black text-emerald-400">{mechanicalVentilator.tidalVolume} mL</strong>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase block">Frecuencia Resp.</span>
                <strong className="text-lg font-black text-amber-300">{mechanicalVentilator.respRate} rpm</strong>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT 1-COLUMN: Vasopressors & Fluid Balance */}
        <div className="space-y-6">

          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
            <div className="flex items-center space-x-2 text-xs font-black uppercase tracking-wider text-white border-b border-slate-800 pb-3">
              <Droplets className="w-4 h-4 text-purple-400" />
              <span>Vasopresores & Perfusiones Continuas</span>
            </div>

            <div className="space-y-3">
              {vasopressors.map((vaso, i) => (
                <div key={i} className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1">
                  <div className="flex justify-between items-center text-xs font-bold text-white">
                    <span>{vaso.name}</span>
                    <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.2 rounded border border-emerald-500/30">
                      {vaso.status}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-cyan-300 font-extrabold">{vaso.rate}</div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
