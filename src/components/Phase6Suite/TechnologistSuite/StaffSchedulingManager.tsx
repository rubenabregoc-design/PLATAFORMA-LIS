import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Users,
  Plus,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Coffee,
  Moon,
  Sun,
  UserCheck,
  Search,
  Settings,
  MoreVertical,
  Filter
} from 'lucide-react';
import { SupabaseService } from '../../../services/SupabaseService';

const StaffSchedulingManager: React.FC = () => {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewDate] = useState(new Date());

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const today = new Date();
      const start = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
      const end = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString();

      const [schData, tmpData] = await Promise.all([
        SupabaseService.shifts.getSchedules(start, end),
        SupabaseService.shifts.getTemplates()
      ]);
      setSchedules(schData);
      setTemplates(tmpData);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const getShiftIcon = (name: string) => {
    if (name.includes('MATUTINO')) return <Sun size={18} className="text-amber-500" />;
    if (name.includes('VESPERTINO')) return <Coffee size={18} className="text-orange-500" />;
    return <Moon size={18} className="text-indigo-400" />;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Shift Banner */}
      <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <Users className="text-teal-400" size={32} />
            <h1 className="text-3xl font-black tracking-tight uppercase italic">Gestión de Turnos y Rol de Guardia</h1>
          </div>
          <p className="text-slate-400 font-medium leading-relaxed max-w-xl">
             Planificación de jornadas laborales para tecnólogos, recepcionistas y personal de apoyo. Control de asistencias y relevos.
          </p>
        </div>
        <div className="flex gap-4">
           <button className="bg-teal-500 hover:bg-teal-400 text-slate-950 px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-teal-500/20">
              <Plus size={18} className="inline mr-2" /> Nueva Asignación
           </button>
        </div>
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-teal-500/5 rounded-full blur-[80px]"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Templates Sidebar */}
        <div className="lg:col-span-1 space-y-4">
           <h3 className="font-black text-slate-800 text-xs uppercase tracking-widest px-2">Turnos Definidos</h3>
           {templates.map(tmp => (
              <div key={tmp.id} className="bg-white p-5 rounded-[2rem] border border-slate-200 shadow-sm group hover:border-teal-400 transition-all">
                 <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                       {getShiftIcon(tmp.name)}
                       <span className="font-black text-slate-800 text-xs uppercase">{tmp.name}</span>
                    </div>
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tmp.color_code }}></div>
                 </div>
                 <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase">
                    <Clock size={14} />
                    <span>{tmp.start_time.slice(0,5)} - {tmp.end_time.slice(0,5)}</span>
                 </div>
              </div>
           ))}
           <button className="w-full py-3 bg-slate-50 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-slate-100 hover:bg-white transition-all">
              <Settings size={14} className="inline mr-2" /> Configurar Horarios
           </button>
        </div>

        {/* Schedule Calendar Feed */}
        <div className="lg:col-span-3 bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
           <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
              <div className="flex items-center gap-4">
                 <h3 className="text-lg font-black text-slate-800">Cronograma de Guardia</h3>
                 <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200">
                    <button className="p-1 hover:bg-slate-50 rounded-lg transition-all"><ChevronLeft size={16} /></button>
                    <span className="text-[10px] font-black text-slate-700 px-2 uppercase">{viewDate.toLocaleString('es-PA', { month: 'long', year: 'numeric' })}</span>
                    <button className="p-1 hover:bg-slate-50 rounded-lg transition-all"><ChevronRight size={16} /></button>
                 </div>
              </div>
              <div className="flex gap-2">
                 <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input placeholder="Personal..." className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] w-48" />
                 </div>
                 <button className="p-2 bg-white text-slate-400 rounded-xl border border-slate-200"><Filter size={16} /></button>
              </div>
           </div>

           <div className="p-6 space-y-4 overflow-y-auto max-h-[600px]">
              {/* Group by date simulation */}
              {schedules.map(sch => (
                 <div key={sch.id} className="flex gap-6 items-start animate-in slide-in-from-left-4">
                    <div className="w-16 shrink-0 text-center">
                       <p className="text-xs font-black text-slate-400 uppercase">{new Date(sch.work_date).toLocaleString('es-PA', { weekday: 'short' })}</p>
                       <p className="text-2xl font-black text-slate-900 leading-none">{new Date(sch.work_date).getDate()}</p>
                    </div>
                    <div className="flex-1 bg-slate-50 border border-slate-100 p-5 rounded-[2rem] flex items-center justify-between group hover:bg-white hover:border-teal-400 hover:shadow-xl transition-all">
                       <div className="flex items-center gap-5">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-white shadow-sm border border-slate-100 group-hover:border-teal-200 transition-colors`}>
                             {getShiftIcon(sch.shift_templates?.name || '')}
                          </div>
                          <div>
                             <p className="font-black text-slate-800 text-sm uppercase tracking-tight">{sch.profiles?.name}</p>
                             <div className="flex items-center gap-3 mt-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{sch.profiles?.role}</span>
                                <span className="h-1 w-1 rounded-full bg-slate-300"></span>
                                <span className="text-[10px] font-black text-teal-600 uppercase">{sch.shift_templates?.name}</span>
                             </div>
                          </div>
                       </div>
                       <div className="flex items-center gap-4">
                          <div className="text-right hidden sm:block">
                             <p className="text-[10px] font-black text-slate-800">{sch.shift_templates?.start_time.slice(0,5)} - {sch.shift_templates?.end_time.slice(0,5)}</p>
                             <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{sch.status}</p>
                          </div>
                          <div className="h-10 w-px bg-slate-200 hidden sm:block"></div>
                          <button className="p-2 text-slate-300 hover:text-slate-900 transition-colors"><MoreVertical size={20} /></button>
                       </div>
                    </div>
                 </div>
              ))}

              {schedules.length === 0 && (
                 <div className="py-20 text-center bg-slate-50/50 rounded-[3rem] border border-dashed border-slate-200">
                    <Calendar className="mx-auto text-slate-200 mb-4" size={48} />
                    <p className="text-slate-300 font-black uppercase text-xs">No hay asignaciones para este periodo</p>
                 </div>
              )}
           </div>
        </div>
      </div>

      {/* Relevo Safety Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className="bg-emerald-500 rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden flex items-center justify-between">
            <div>
               <h4 className="text-xl font-black tracking-tight">Capacidad de Turno</h4>
               <p className="text-emerald-100 text-xs mt-2 font-medium">85% del personal operativo se encuentra activo y en sitio.</p>
            </div>
            <UserCheck size={48} className="text-white/20" />
         </div>
         <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex items-center gap-5">
            <div className="p-4 bg-amber-50 text-amber-600 rounded-3xl border border-amber-100 animate-pulse">
               <AlertCircle size={28} />
            </div>
            <div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocolo de Relevo</p>
               <p className="text-sm font-bold text-slate-800 leading-snug mt-1">
                  Asegurar la entrega de bitácora técnica y pendientes analíticos antes de realizar el Clock-Out.
               </p>
            </div>
         </div>
      </div>
    </div>
  );
};

export default StaffSchedulingManager;
