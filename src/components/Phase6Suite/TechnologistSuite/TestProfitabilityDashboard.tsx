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
  DollarSign,
  Activity,
  FlaskConical,
  AlertCircle,
  ChevronRight,
  RefreshCw,
  Zap,
  Target,
  ArrowUpRight,
  Calculator
} from 'lucide-react';
import { SupabaseService } from '../../../services/SupabaseService';

const TestProfitabilityDashboard: React.FC = () => {
  const [stats, setStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await SupabaseService.profitability.getProfitabilityStats();
      setStats(data);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const topTests = stats.slice(0, 5);
  const totalNetProfit = stats.reduce((acc, s) => acc + parseFloat(s.net_profit), 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Financial Intel Header */}
      <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <Calculator className="text-teal-400" size={32} />
            <h1 className="text-3xl font-black tracking-tight uppercase italic text-white">Rentabilidad por Prueba & Margen Bruto</h1>
          </div>
          <p className="text-slate-400 font-medium leading-relaxed max-w-xl">
             Inteligencia de costos analíticos. Identificación automática de pruebas con mayor margen de beneficio neto (Revenue - COGS).
          </p>
        </div>
        <div className="flex gap-4">
           <div className="bg-emerald-500/10 border border-emerald-500/20 px-8 py-6 rounded-3xl backdrop-blur-md text-center">
              <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Margen Neto Total</p>
              <h4 className="text-2xl font-black text-white">${totalNetProfit.toLocaleString()}</h4>
           </div>
        </div>
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-teal-500/5 rounded-full blur-[80px]"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Profitability Chart */}
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8 flex flex-col">
           <div className="flex justify-between items-center mb-8">
              <h3 className="text-lg font-black text-slate-800 flex items-center gap-2 uppercase tracking-tight">
                 <TrendingUp className="text-blue-500" size={20} />
                 Top 10 Pruebas Más Rentables
              </h3>
              <button onClick={fetchStats} className="p-2 bg-slate-50 text-slate-400 hover:text-teal-600 rounded-xl transition-all border border-slate-100"><RefreshCw size={18} /></button>
           </div>

           <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={stats.slice(0, 10)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                    <XAxis type="number" hide />
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
                    <Bar dataKey="net_profit" radius={[0, 8, 8, 0]} barSize={24} name="Ganancia Neta ($)">
                       {stats.map((entry, index) => (
                          <Cell key={index} fill={parseFloat(entry.net_profit) > 1000 ? '#10b981' : '#0f172a'} />
                       ))}
                    </Bar>
                 </BarChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* Actionable Insights */}
        <div className="space-y-6">
           <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
              <h3 className="font-black text-slate-800 text-[10px] uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                 <Target className="text-rose-500" size={16} />
                 Impacto en la Estrategia
              </h3>
              <div className="space-y-4">
                 {topTests.map((test, idx) => (
                    <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-teal-400 transition-all flex items-center justify-between">
                       <div>
                          <p className="font-black text-slate-800 text-xs uppercase tracking-tight">{test.test_code}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Volumen: {test.volume}</p>
                       </div>
                       <div className="text-right">
                          <p className="text-sm font-black text-emerald-600">${parseFloat(test.net_profit).toLocaleString()}</p>
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Net Profit</p>
                       </div>
                    </div>
                 ))}
              </div>
           </div>

           <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
              <Zap className="text-yellow-400 mb-4" size={32} />
              <h4 className="font-black text-sm uppercase tracking-widest">Optimización de Menú</h4>
              <p className="text-slate-400 text-[10px] leading-relaxed mt-3 font-medium text-justify">
                 "Se recomienda promocionar el panel de <span className="text-white">Electrolitos</span> debido a que su margen de beneficio es un 25% superior al promedio actual del laboratorio."
              </p>
              <button className="w-full mt-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">Ver Menú de Pruebas</button>
           </div>
        </div>

      </div>
    </div>
  );
};

export default TestProfitabilityDashboard;
