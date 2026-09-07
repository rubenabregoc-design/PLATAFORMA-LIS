import React, { useState, useEffect } from 'react';
import {
  Clock,
  Lock,
  ShieldCheck,
  MapPin,
  ArrowRight,
  CheckCircle2,
  LogOut,
  Fingerprint,
  Timer,
  AlertTriangle,
  User,
  Activity
} from 'lucide-react';
import { SupabaseService } from '../../../services/SupabaseService';
import SecurityPinModal from './SecurityPinModal';

const StaffPunchClock: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeShift, setActiveShift] = useState<any>(null);
  const [pendingShift, setPendingShift] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showPinModal, setShowPinModal] = useState<{ active: boolean, action: 'IN' | 'OUT' }>({ active: false, action: 'IN' });

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    fetchCurrentShiftStatus();
    return () => clearInterval(timer);
  }, []);

  const fetchCurrentShiftStatus = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await SupabaseService.auth.getCurrentUser() as any;
      const today = new Date().toISOString().split('T')[0];

      const schedules = await SupabaseService.shifts.getSchedules(today, today);
      const mySchedule = schedules.find(s => s.profile_id === user?.id);

      if (mySchedule) {
        if (mySchedule.status === 'CLOCKED_IN') {
          setActiveShift(mySchedule);
        } else if (mySchedule.status === 'SCHEDULED') {
          setPendingShift(mySchedule);
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePunchAction = async () => {
    try {
      if (showPinModal.action === 'IN' && pendingShift) {
        await SupabaseService.shifts.clockIn(pendingShift.id);
      } else if (showPinModal.action === 'OUT' && activeShift) {
        await SupabaseService.shifts.clockOut(activeShift.id);
      }

      setShowPinModal({ active: false, action: 'IN' });
      setPendingShift(null);
      setActiveShift(null);
      fetchCurrentShiftStatus();
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Big Digital Clock Display */}
      <div className="text-center space-y-2">
        <h1 className="text-7xl font-black text-slate-900 tracking-tighter font-mono">
          {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
        </h1>
        <p className="text-sm font-black text-slate-400 uppercase tracking-[0.3em]">
          {currentTime.toLocaleDateString('es-PA', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

        {/* Left: Punch Card */}
        <div className="bg-white rounded-[3rem] p-10 shadow-2xl border border-slate-100 flex flex-col items-center justify-between text-center relative overflow-hidden">
           <div className="relative z-10">
              <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-xl ${
                activeShift ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
              }`}>
                 {activeShift ? <LogOut size={40} /> : <Fingerprint size={40} />}
              </div>

              {activeShift ? (
                <div className="space-y-2">
                   <h2 className="text-2xl font-black text-slate-800">Turno en Progreso</h2>
                   <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Iniciado a las {new Date(activeShift.start_actual).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p>
                   <div className="mt-8 pt-8 border-t border-slate-50">
                      <button
                        onClick={() => setShowPinModal({ active: true, action: 'OUT' })}
                        className="bg-slate-900 text-white px-10 py-5 rounded-[2rem] font-black text-sm uppercase tracking-widest hover:bg-slate-800 transition-all shadow-2xl shadow-slate-200"
                      >
                         REGISTRAR SALIDA
                      </button>
                   </div>
                </div>
              ) : pendingShift ? (
                <div className="space-y-2">
                   <h2 className="text-2xl font-black text-slate-800">¡Bienvenido!</h2>
                   <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Turno Programado: {pendingShift.shift_templates?.name}</p>
                   <div className="mt-8 pt-8 border-t border-slate-50">
                      <button
                        onClick={() => setShowPinModal({ active: true, action: 'IN' })}
                        className="bg-emerald-600 text-white px-10 py-5 rounded-[2rem] font-black text-sm uppercase tracking-widest hover:bg-emerald-500 transition-all shadow-2xl shadow-emerald-900/20"
                      >
                         INICIAR JORNADA
                      </button>
                   </div>
                </div>
              ) : (
                <div className="space-y-2 opacity-50 grayscale">
                   <h2 className="text-xl font-black text-slate-400 uppercase tracking-tighter">Sin Turno Asignado</h2>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Consulte con su supervisor el rol de guardia.</p>
                </div>
              )}
           </div>

           {/* Visual decoration */}
           <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-slate-50 rounded-full"></div>
        </div>

        {/* Right: Info & Status */}
        <div className="space-y-6">
           <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden">
              <div className="relative z-10">
                 <div className="flex items-center gap-3 mb-6">
                    <ShieldCheck className="text-teal-400" size={24} />
                    <h4 className="font-black text-sm uppercase tracking-widest">Identidad Verificada</h4>
                 </div>
                 <div className="space-y-4">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-black text-xs text-teal-400">TM</div>
                       <div>
                          <p className="text-xs font-black uppercase">Usuario Activo</p>
                          <p className="text-[10px] text-slate-400 font-medium">Tecnólogo Médico Senior</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-4">
                       <MapPin className="text-slate-500" size={20} />
                       <div>
                          <p className="text-xs font-black uppercase">Sede Actual</p>
                          <p className="text-[10px] text-slate-400 font-medium">Laboratorio Central • Vía España</p>
                       </div>
                    </div>
                 </div>
              </div>
           </div>

           <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
              <h3 className="font-black text-slate-800 text-[10px] uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                 <Activity className="text-blue-500" size={16} />
                 Resumen Semanal
              </h3>
              <div className="grid grid-cols-2 gap-4">
                 <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase">Horas Laboradas</p>
                    <h5 className="text-xl font-black text-slate-800">32.5 <span className="text-[10px]">h</span></h5>
                 </div>
                 <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase">Eficiencia</p>
                    <h5 className="text-xl font-black text-emerald-600">98%</h5>
                 </div>
              </div>
           </div>

           <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3 text-amber-900 text-[10px] font-medium leading-relaxed italic">
              <AlertTriangle size={18} className="shrink-0 text-amber-500" />
              <p>Nota: Toda marcación fuera del rango de 15 minutos del horario programado generará una alerta automática en el dashboard de supervisión.</p>
           </div>
        </div>

      </div>

      {showPinModal.active && (
        <SecurityPinModal
          actionTitle={showPinModal.action === 'IN' ? 'Confirmar Inicio de Turno' : 'Confirmar Salida de Turno'}
          onSuccess={handlePunchAction}
          onCancel={() => setShowPinModal({ active: false, action: 'IN' })}
        />
      )}
    </div>
  );
};

export default StaffPunchClock;
