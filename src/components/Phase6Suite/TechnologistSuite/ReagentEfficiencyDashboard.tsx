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
  TrendingUp,
  FlaskConical,
  Activity,
  AlertTriangle,
  ChevronRight,
  RefreshCw,
  Zap,
  Target,
  ArrowUpRight,
  Scale,
  Gauge
} from 'lucide-react';
import { SupabaseService } from '../../../services/SupabaseService';

const ReagentEfficiencyDashboard: React.FC = () => {
  const [stats, setStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await SupabaseService.profitability.getReagentEfficiency();
      setStats(data);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const avgEfficiency = stats.length > 0
    ? stats.reduce((acc, s) => acc + parseFloat(s.efficiency_percentage), 0) / stats.length
    : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Efficiency Header */}
      <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <Gauge className="text-teal-400" size={32} />
            <h1 className="text-3xl font-black tracking-tight uppercase italic text-white">Eficiencia de Reactivos (Rendimiento Analítico)</h1>
          </div>
          <p className="text-slate-400 font-medium leading-relaxed max-w-xl">
             Análisis de desperdicio: Relación entre pruebas de pacientes vs. consumo en Calibración y Controles de Calidad (QC).
          </p>
        </div>
        <div className="flex gap-4">
           <div className="bg-teal-500/10 border border-teal-500/20 px-8 py-6 rounded-3xl backdrop-blur-md text-center">
              <p className="text-[10px] font-black text-teal-400 uppercase tracking-widest mb-1">Eficiencia Promedio</p>
              <h4 className="text-2xl font-black text-white">{avgEfficiency.toFixed(1)}%</h4>
           </div>
        </div>
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-teal-500/5 rounded-full blur-[80px]"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Efficiency Chart */}
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8 flex flex-col">
           <div className="flex justify-between items-center mb-8">
              <h3 className="text-lg font-black text-slate-800 flex items-center gap-2 uppercase tracking-tight">
                 <Activity className="text-blue-500" size={20} />
                 Rendimiento por Analito
              </h3>
              <button onClick={fetchStats} className="p-2 bg-slate-50 text-slate-400 hover:text-teal-600 rounded-xl transition-all border border-slate-100"><RefreshCw size={18} /></button>
           </div>

           <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={stats.slice(0, 15)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                    <XAxis type="number" domain={[0, 100]} hide />
                    <YAxis
                       dataKey="test_code"
                       type="category"
                       axisLine={false}
                       tickLine={false}
                       tick={{fill: '#64748b', fontSize: 10, fontWeight: 'bold'}}
                       width={80}
                    />
                    <Tooltip
                       cursor={{fill: '#f8fafc'}}
                       contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}}
                    />
                    <Bar dataKey="efficiency_percentage" radius={[0, 8, 8, 0]} barSize={24} name="Eficiencia (%)">
                       {stats.map((entry, index) => (
                          <Cell key={index} fill={entry.efficiency_percentage > 85 ? '#10b981' : entry.efficiency_percentage < 60 ? '#ef4444' : '#0f172a'} />
                       ))}
                    </Bar>
                 </BarChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* Actionable Insights */}
        <div className="space-y-6">
           <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
              <h3 className="font-black text-slate-800 text-[10px] uppercase tracking-widest mb-6 flex items-center gap-2">
                 <AlertTriangle className="text-amber-500" size={16} />
                 Alertas de Desperdicio
              </h3>
              <div className="space-y-4">
                 {stats.filter(s => s.efficiency_percentage < 50).map((test, idx) => (
                    <div key={idx} className="p-4 bg-rose-50 rounded-2xl border border-rose-100 group hover:border-rose-400 transition-all">
                       <div className="flex justify-between items-start">
                          <div>
                             <p className="font-black text-rose-800 text-xs uppercase tracking-tight">{test.test_code}</p>
                             <p className="text-[10px] text-rose-600 font-bold uppercase mt-0.5">Bajo Rendimiento</p>
                          </div>
                          <span className="text-sm font-black text-rose-700">{test.efficiency_percentage.toFixed(1)}%</span>
                       </div>
                       <p className="text-[9px] text-rose-500 mt-3 font-medium leading-relaxed">
                          Se están realizando demasiadas calibraciones/controles para el volumen de pacientes procesados. Revisar estabilidad del reactivo.
                       </p>
                    </div>
                 ))}
                 {stats.filter(s => s.efficiency_percentage < 50).length === 0 && (
                    <div className="py-10 text-center opacity-30 italic">No hay alertas críticas de eficiencia.</div>
                 )}
              </div>
           </div>

           <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
              <Zap className="text-yellow-400 mb-4" size={32} />
              <h4 className="font-black text-sm uppercase tracking-widest">Tasa de Impuesto Analítico</h4>
              <p className="text-slate-400 text-[10px] leading-relaxed mt-3 font-medium text-justify">
                 "El promedio de consumo de reactivo para mantenimiento de la calidad (QC/Cal) es del <span className="text-white">{(100 - avgEfficiency).toFixed(1)}%</span>. Una reducción al 10% representaría un ahorro de <span className="text-teal-400">$1,200/mes</span>."
              </p>
              <button className="w-full mt-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">Optimizar Protocolo QC</button>
           </div>
        </div>

      </div>
    </div>
  );
};

export default ReagentEfficiencyDashboard;
