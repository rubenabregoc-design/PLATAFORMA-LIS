import React, { useState, useEffect } from 'react';
import {
  Clock, Lock, ShieldCheck, MapPin, CheckCircle2, LogOut, Fingerprint,
  Timer, AlertTriangle, User, Activity, Sparkles, Building2
} from 'lucide-react';
import { useLisStore } from '../../../store/useLisStore';
import { ROLE_LABELS } from '../../Header';

export const StaffPunchClock: React.FC = () => {
  const { currentUser, currentBranch, currentRole } = useLisStore();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Shift Punch Clock State
  const [isClockedIn, setIsClockedIn] = useState<boolean>(false);
  const [clockInTime, setClockInTime] = useState<string | null>(null);
  const [hoursWorkedThisWeek, setHoursWorkedThisWeek] = useState<number>(36.5);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleClockIn = () => {
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setIsClockedIn(true);
    setClockInTime(nowStr);

    window.dispatchEvent(
      new CustomEvent('lis-global-toast', {
        detail: {
          message: `✓ ENTRADA REGISTRADA: ${currentUser?.name || 'Colaborador'} ha iniciado jornada laboral a las ${nowStr}.`,
          type: 'success',
          duration: 4000
        }
      })
    );
  };

  const handleClockOut = () => {
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setIsClockedIn(false);
    setHoursWorkedThisWeek((prev) => Math.round((prev + 8.0) * 10) / 10);

    window.dispatchEvent(
      new CustomEvent('lis-global-toast', {
        detail: {
          message: `✓ SALIDA REGISTRADA: ${currentUser?.name || 'Colaborador'} ha finalizado turno a las ${nowStr}. Horas consolidadas.`,
          type: 'info',
          duration: 4000
        }
      })
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 text-slate-100">

      {/* Big Digital Clock Display */}
      <div className="text-center space-y-2 bg-slate-900/90 border border-slate-800 p-6 rounded-3xl shadow-2xl">
        <div className="flex items-center justify-center space-x-2 text-cyan-400 font-mono text-xs uppercase font-black tracking-widest">
          <Clock className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span>Reloj Digital de Control Asistencia & Marcaje Biométrico</span>
        </div>

        <h1 className="text-5xl sm:text-7xl font-black text-white tracking-tighter font-mono drop-shadow-[0_0_20px_rgba(0,240,255,0.3)]">
          {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
        </h1>

        <p className="text-xs sm:text-sm font-bold text-slate-400 capitalize tracking-wider font-mono">
          {currentTime.toLocaleDateString('es-PA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Main Punch Clock Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">

        {/* Left: Interactive Punch Card */}
        <div className="bg-slate-900/90 rounded-3xl p-8 sm:p-10 shadow-2xl border border-slate-800 flex flex-col items-center justify-between text-center relative overflow-hidden">
          <div className="relative z-10 space-y-6 w-full">

            <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto shadow-2xl border transition-transform duration-300 hover:scale-105 ${
              isClockedIn ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
            }`}>
              {isClockedIn ? <LogOut className="w-10 h-10 text-amber-400" /> : <Fingerprint className="w-10 h-10 text-emerald-400" />}
            </div>

            {isClockedIn ? (
              <div className="space-y-3">
                <span className="px-3 py-1 rounded-full text-[10px] font-mono font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase tracking-widest animate-pulse">
                  TURNO EN PROGRESO
                </span>
                <h2 className="text-2xl font-black text-white">Jornada Laboral Activa</h2>
                <p className="text-xs font-mono font-bold text-slate-400">
                  Entrada registrada a las <strong className="text-emerald-400">{clockInTime}</strong>
                </p>

                <div className="pt-4 border-t border-slate-800">
                  <button
                    onClick={handleClockOut}
                    className="w-full py-4 bg-gradient-to-r from-amber-500 to-rose-500 hover:brightness-110 text-slate-950 font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-amber-500/20 cursor-pointer flex items-center justify-center space-x-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>REGISTRAR SALIDA DE TURNO</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <span className="px-3 py-1 rounded-full text-[10px] font-mono font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase tracking-widest">
                  LISTO PARA INICIAR
                </span>
                <h2 className="text-2xl font-black text-white">¡Bienvenido al Turno!</h2>
                <p className="text-xs font-mono font-bold text-slate-400">
                  Horario Programado: <strong className="text-cyan-300">Turno Rotativo / Asignado</strong>
                </p>

                <div className="pt-4 border-t border-slate-800">
                  <button
                    onClick={handleClockIn}
                    className="w-full py-4 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 hover:brightness-110 text-slate-950 font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-emerald-500/20 cursor-pointer flex items-center justify-center space-x-2"
                  >
                    <Fingerprint className="w-5 h-5 text-slate-950" />
                    <span>INICIAR JORNADA (ENTRADA)</span>
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Right: Staff Identity & Weekly Summary Card */}
        <div className="space-y-6">

          {/* Identity Verification Card */}
          <div className="bg-slate-900/90 text-white p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center space-x-2 text-cyan-400 font-black text-xs uppercase tracking-widest border-b border-slate-800 pb-3">
              <ShieldCheck className="w-5 h-5 text-cyan-400" />
              <span>Identidad Verificada por Firma Digital</span>
            </div>

            <div className="space-y-3 font-sans">
              <div className="flex items-center space-x-3 bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 flex items-center justify-center font-black text-sm shrink-0">
                  {currentUser?.name?.charAt(0) || 'C'}
                </div>
                <div>
                  <p className="text-xs font-extrabold text-white">{currentUser?.name || 'Lic. Sofía Guardia'}</p>
                  <p className="text-[10px] text-cyan-400 font-mono font-bold">{ROLE_LABELS[currentRole]?.title || 'Colaborador Institucional'}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                <MapPin className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <p className="text-xs font-extrabold text-white">Sede Operativa Registrada</p>
                  <p className="text-[10px] text-slate-400 font-mono">{currentBranch?.name || 'Sede Vía España'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Weekly Work Hours Summary Card */}
          <div className="bg-slate-900/90 p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4">
            <h3 className="font-black text-white text-xs uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
              <Activity className="w-4 h-4 text-blue-400" />
              <span>Resumen Semanal de Asistencia</span>
            </h3>

            <div className="grid grid-cols-2 gap-3 font-mono">
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1">
                <p className="text-[9px] font-bold text-slate-400 uppercase">Horas Cumplidas</p>
                <h5 className="text-2xl font-black text-white">{hoursWorkedThisWeek} <span className="text-xs text-slate-400 font-sans font-bold">hrs</span></h5>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1">
                <p className="text-[9px] font-bold text-slate-400 uppercase">Puntualidad</p>
                <h5 className="text-2xl font-black text-emerald-400">100%</h5>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default StaffPunchClock;
