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
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import {
  TrendingUp,
  MapPin,
  DollarSign,
  Briefcase,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Calendar,
  Building2,
  Zap
} from 'lucide-react';
import { SupabaseService } from '../../../services/SupabaseService';

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'];

const BranchSalesDashboard: React.FC = () => {
  const [trends, setTrends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrends();
  }, []);

  const fetchTrends = async () => {
    try {
      const data = await SupabaseService.sales.getBranchTrends();
      setTrends(data);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const totalRevenue = trends.reduce((acc, t) => acc + parseFloat(t.daily_revenue), 0);

  // Aggregate by branch for the summary
  const branchSummary = trends.reduce((acc: any, t) => {
    if (!acc[t.branch_name]) acc[t.branch_name] = 0;
    acc[t.branch_name] += parseFloat(t.daily_revenue);
    return acc;
  }, {});

  const branchData = Object.keys(branchSummary).map(name => ({
    name,
    value: branchSummary[name]
  }));

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <Building2 className="text-blue-400" size={32} />
            <h1 className="text-3xl font-black tracking-tight uppercase italic text-white">Ventas por Sucursal & Tendencias</h1>
          </div>
          <p className="text-slate-400 font-medium leading-relaxed max-w-xl">
             Análisis geográfico de ingresos. Monitoreo de productividad financiera por sede del laboratorio.
          </p>
        </div>
        <div className="flex gap-4">
           <div className="bg-white/5 border border-white/10 px-8 py-6 rounded-3xl backdrop-blur-md text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ingresos Acumulados</p>
              <h4 className="text-2xl font-black text-emerald-400">${totalRevenue.toLocaleString()}</h4>
           </div>
        </div>
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-blue-500/5 rounded-full blur-[80px]"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Sales Trend Graph */}
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8">
           <div className="flex justify-between items-center mb-8">
              <h3 className="text-lg font-black text-slate-800 flex items-center gap-2 uppercase tracking-tight">
                 <TrendingUp className="text-blue-500" size={20} />
                 Histórico de Facturación Diaria
              </h3>
              <button onClick={fetchTrends} className="p-2 bg-slate-50 text-slate-400 hover:text-teal-600 rounded-xl transition-all border border-slate-100"><RefreshCw size={18} /></button>
           </div>

           <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={trends}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="sale_date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 'bold'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                    <Tooltip
                       contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}}
                    />
                    <Area type="monotone" dataKey="daily_revenue" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" name="Ventas ($)" />
                 </AreaChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* Branch Summary Sidebar */}
        <div className="space-y-6">
           <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col h-full">
              <h3 className="font-black text-slate-800 text-[10px] uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                 <MapPin className="text-rose-500" size={16} />
                 Ventas por Sede
              </h3>
              <div className="space-y-6">
                 {branchData.map((branch, idx) => (
                    <div key={idx} className="space-y-2 group cursor-pointer">
                       <div className="flex justify-between text-xs font-black uppercase tracking-tight">
                          <span className="text-slate-700 group-hover:text-blue-600 transition-colors">{branch.name}</span>
                          <span className="text-slate-400 font-mono">${branch.value.toLocaleString()}</span>
                       </div>
                       <div className="w-full bg-slate-50 h-2 rounded-full overflow-hidden">
                          <div
                             className="h-full bg-blue-500 group-hover:bg-teal-400 transition-all"
                             style={{ width: `${(branch.value / totalRevenue) * 100}%` }}
                          ></div>
                       </div>
                    </div>
                 ))}
                 {branchData.length === 0 && (
                    <div className="py-10 text-center text-slate-300 font-bold uppercase text-[10px]">Sin datos por sucursal</div>
                 )}
              </div>

              <div className="mt-auto pt-8 border-t border-slate-50">
                 <div className="bg-slate-900 p-6 rounded-3xl text-white relative overflow-hidden">
                    <Zap className="text-yellow-400 mb-2" size={24} />
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sucursal Destacada</p>
                    <h5 className="text-lg font-black mt-1 uppercase">Sede Vía España</h5>
                    <p className="text-[9px] text-teal-400 font-bold mt-2">+12.5% Productividad</p>
                 </div>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
};

export default BranchSalesDashboard;
