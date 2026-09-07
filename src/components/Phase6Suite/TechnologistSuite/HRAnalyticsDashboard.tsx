import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend
} from 'recharts';
import {
  Users,
  Clock,
  AlertTriangle,
  TrendingUp,
  UserX,
  Zap,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Briefcase
} from 'lucide-react';
import { SupabaseService } from '../../../services/SupabaseService';

const COLORS = ['#10b981', '#ef4444', '#3b82f6', '#f59e0b'];

const HRAnalyticsDashboard: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewDate] = useState(new Date());

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const stats = await SupabaseService.shifts.getAttendanceAnalytics(
        viewDate.getMonth() + 1,
        viewDate.getFullYear()
      );
      setData(stats);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const totalOvertime = data.reduce((acc, d) => acc + parseFloat(d.estimated_overtime || 0), 0);
  const totalAbsences = data.reduce((acc, d) => acc + parseInt(d.total_absences || 0), 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
         <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl border border-slate-800">
            <p className="text-slate-400 text-[10px] font-black uppercase mb-1">Horas Extras Totales</p>
            <h3 className="text-3xl font-black tracking-tighter text-teal-400">{totalOvertime.toFixed(1)} <span className="text-xs text-white">Hrs</span></h3>
            <div className="mt-4 flex items-center gap-1 text-teal-500 text-[10px] font-bold">
               <TrendingUp size={14} /> +12% vs mes anterior
            </div>
         </div>
         <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm border-l-4 border-l-rose-500">
            <p className="text-slate-500 text-[10px] font-black uppercase mb-1">Índice de Ausentismo</p>
            <h3 className="text-3xl font-black text-slate-800">{totalAbsences} <span className="text-xs text-slate-400">Eventos</span></h3>
            <p className="text-[9px] text-slate-400 font-bold uppercase mt-2">Impacto en TAT: MODERADO</p>
         </div>
         <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <p className="text-slate-500 text-[10px] font-black uppercase mb-1">Puntualidad Global</p>
            <h3 className="text-3xl font-black text-emerald-600">96.4%</h3>
            <p className="text-[9px] text-slate-400 font-bold uppercase mt-2">Average Shift Start Delay: 4m</p>
         </div>
         <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <p className="text-slate-500 text-[10px] font-black uppercase mb-1">Staff Activo</p>
            <h3 className="text-3xl font-black text-slate-800">{data.length} <span className="text-xs text-slate-400">FTEs</span></h3>
            <p className="text-[9px] text-slate-400 font-bold uppercase mt-2">Personal Técnico Validado</p>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Overtime by Staff Chart */}
         <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
            <h3 className="text-lg font-black text-slate-800 mb-8 flex items-center gap-2 uppercase tracking-tight">
               <Clock className="text-blue-500" size={20} />
               Distribución de Horas Extras por Colaborador
            </h3>
            <div className="h-[350px]">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                     <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 'bold'}} />
                     <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                     <Tooltip
                        cursor={{fill: '#f8fafc'}}
                        contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}}
                     />
                     <Bar dataKey="estimated_overtime" fill="#0f172a" radius={[8, 8, 0, 0]} barSize={40} name="Hrs Extras" />
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </div>

         {/* HR Insights */}
         <div className="space-y-6">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
               <h3 className="font-black text-slate-800 text-xs uppercase tracking-widest mb-6">Staff Performance</h3>
               <div className="space-y-6">
                  {data.map(d => (
                     <div key={d.profile_id} className="space-y-2">
                        <div className="flex justify-between text-xs font-black uppercase tracking-tight">
                           <span className="text-slate-700">{d.name}</span>
                           <span className="text-slate-400">{d.total_hours_worked.toFixed(1)}h</span>
                        </div>
                        <div className="w-full bg-slate-50 h-2 rounded-full overflow-hidden">
                           <div className="h-full bg-teal-500" style={{ width: `${Math.min(100, (d.total_hours_worked/160)*100)}%` }}></div>
                        </div>
                     </div>
                  ))}
               </div>
            </div>

            <div className="bg-amber-50 p-8 rounded-[2.5rem] border border-amber-200 relative overflow-hidden">
               <AlertTriangle className="text-amber-500 mb-4" size={32} />
               <h4 className="font-black text-amber-900 text-lg">Alerta de Fatiga Laboral</h4>
               <p className="text-amber-800 text-[10px] mt-2 leading-relaxed font-medium">
                  Se detecta que 2 tecnólogos médicos han superado las 12 horas extras esta semana. Se recomienda revisar el rol de guardia para prevenir errores analíticos por agotamiento.
               </p>
            </div>
         </div>
      </div>
    </div>
  );
};

export default HRAnalyticsDashboard;
