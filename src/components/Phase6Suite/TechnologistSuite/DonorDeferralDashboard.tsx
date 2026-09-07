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
  UserX,
  Search,
  Filter,
  TrendingUp,
  AlertTriangle,
  Info,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  Zap,
  Activity,
  Heart
} from 'lucide-react';
import { SupabaseService } from '../../../services/SupabaseService';

const COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#10b981'];

const DonorDeferralDashboard: React.FC = () => {
  const [stats, setStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await SupabaseService.bloodLogistics.getDeferralStats();
      setStats(data);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const totalDeferrals = stats.reduce((acc, s) => acc + s.total_cases, 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Deferral Header */}
      <div className="bg-slate-900 text-white p-8 rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <UserX className="text-rose-500" size={32} />
            <h1 className="text-3xl font-black tracking-tight uppercase italic text-white">Análisis de Diferimiento de Donantes</h1>
          </div>
          <p className="text-slate-400 font-medium leading-relaxed max-w-xl">
             Inteligencia de captación: Causas principales de rechazo temporal y permanente de donantes en Panamá.
          </p>
        </div>
        <div className="flex gap-4">
           <div className="bg-rose-500/10 border border-rose-500/20 px-8 py-6 rounded-3xl backdrop-blur-md text-center">
              <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1">Total Diferidos</p>
              <h4 className="text-2xl font-black text-white">{totalDeferrals} <span className="text-xs uppercase">Casos</span></h4>
           </div>
        </div>
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-rose-500/5 rounded-full blur-[80px]"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Main Reasons Chart */}
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8 flex flex-col">
           <div className="flex justify-between items-center mb-8">
              <h3 className="text-lg font-black text-slate-800 flex items-center gap-2 uppercase tracking-tight">
                 <Activity className="text-blue-500" size={20} />
                 Principales Causas de Rechazo
              </h3>
              <button onClick={fetchStats} className="p-2 bg-slate-50 text-slate-400 hover:text-teal-600 rounded-xl transition-all border border-slate-100"><RefreshCw size={18} /></button>
           </div>

           <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                    <Pie
                       data={stats}
                       cx="50%"
                       cy="50%"
                       innerRadius={80}
                       outerRadius={120}
                       paddingAngle={5}
                       dataKey="total_cases"
                       nameKey="reason"
                    >
                       {stats.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                       ))}
                    </Pie>
                    <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}} />
                    <Legend verticalAlign="bottom" height={36}/>
                 </PieChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* Detailed List Sidebar */}
        <div className="space-y-6">
           <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
              <h3 className="font-black text-slate-800 text-[10px] uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                 <TrendingUp className="text-emerald-500" size={16} />
                 Frecuencia por Motivo
              </h3>
              <div className="space-y-6">
                 {stats.map((item, idx) => (
                    <div key={idx} className="space-y-2 group cursor-pointer">
                       <div className="flex justify-between text-[10px] font-black uppercase tracking-tight">
                          <span className="text-slate-700 group-hover:text-rose-600 transition-colors">{item.reason}</span>
                          <span className="text-slate-400 font-mono">{item.percentage}%</span>
                       </div>
                       <div className="w-full bg-slate-50 h-2 rounded-full overflow-hidden">
                          <div
                             className="h-full bg-rose-500 group-hover:bg-rose-400 transition-all"
                             style={{ width: `${item.percentage}%` }}
                          ></div>
                       </div>
                    </div>
                 ))}
                 {stats.length === 0 && (
                    <div className="py-10 text-center opacity-30 italic uppercase text-[10px] font-black">Sin datos de diferimiento</div>
                 )}
              </div>
           </div>

           <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
              <Zap className="text-yellow-400 mb-4" size={32} />
              <h4 className="font-black text-sm uppercase tracking-widest">Educación Proactiva</h4>
              <p className="text-slate-400 text-[10px] leading-relaxed mt-3 font-medium text-justify">
                 "El <span className="text-white font-black">65%</span> de los diferimientos son por <span className="text-teal-400">Hemoglobina Baja</span>. Se recomienda enviar guías nutricionales automáticas vía WhatsApp a estos pacientes para su recuperación."
              </p>
              <button className="w-full mt-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">Configurar Campaña</button>
           </div>
        </div>

      </div>
    </div>
  );
};

export default DonorDeferralDashboard;
