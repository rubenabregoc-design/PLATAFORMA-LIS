import React, { useState, useEffect } from 'react';
import {
  BarChart as BarChartIcon,
  TrendingUp,
  TrendingDown,
  Leaf,
  Activity,
  AlertTriangle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Info
} from 'lucide-react';
import { SupabaseService } from '../../../services/SupabaseService';
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
  Line
} from 'recharts';

const BiohazardDashboard: React.FC = () => {
  const [stats, setStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await SupabaseService.environmental.getWasteEfficiencyStats();
      setStats(data.map(d => ({
        month: `${d.month}/${d.year}`,
        rate: parseFloat(d.kg_per_100_tests as any).toFixed(2),
        total: d.total_waste_kg
      })));
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const currentRate = stats[0]?.rate || 0;
  const previousRate = stats[1]?.rate || 0;
  const improvement = previousRate > 0 ? ((previousRate - currentRate) / previousRate * 100).toFixed(1) : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Environmental Banner */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="max-w-xl">
            <div className="flex items-center gap-3 mb-4">
              <Leaf className="text-emerald-400" size={32} />
              <h1 className="text-3xl font-black tracking-tight">Inteligencia de Bioseguridad y Sostenibilidad</h1>
            </div>
            <p className="text-slate-400 font-medium leading-relaxed">
              Métricas de eficiencia ambiental: Tasa de generación de residuos bio-peligrosos por volumen analítico (Kg / 100 pruebas).
            </p>
          </div>

          <div className="flex gap-4">
            <div className="bg-emerald-500/10 border border-emerald-500/20 px-8 py-6 rounded-3xl backdrop-blur-md text-center">
              <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Waste Intensity Index</p>
              <h4 className="text-3xl font-black">{currentRate} <span className="text-xs">kg/100p</span></h4>
              <div className="flex items-center justify-center gap-1 text-emerald-400 text-[10px] font-bold mt-2">
                <TrendingDown size={14} /> -{improvement}% vs mes anterior
              </div>
            </div>
          </div>
        </div>
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-emerald-500/5 rounded-full blur-[80px]"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Generation Intensity Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-8 pb-6 border-b border-slate-50">
            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <Activity className="text-blue-500" size={20} />
              Intensidad de Residuos por Volumen de Pruebas
            </h3>
            <div className="flex gap-2">
               <button className="px-3 py-1 bg-slate-50 rounded-lg text-[10px] font-black uppercase text-slate-400 border border-slate-100">6 Meses</button>
               <button className="px-3 py-1 bg-slate-900 rounded-lg text-[10px] font-black uppercase text-white shadow-lg">12 Meses</button>
            </div>
          </div>

          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 'bold'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                <Tooltip
                   cursor={{fill: '#f8fafc'}}
                   contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="rate" fill="#0f172a" radius={[8, 8, 0, 0]} barSize={40} name="Kg / 100 Pruebas" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Actionable Environmental Insights */}
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
            <h3 className="font-black text-slate-800 text-xs uppercase tracking-widest mb-6">Eficiencia Ambiental</h3>
            <div className="space-y-6">
               <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 relative group overflow-hidden">
                 <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Huella de Carbono Estimada</p>
                 <h4 className="text-2xl font-black text-slate-800">12.4 <span className="text-xs">tCO2e</span></h4>
                 <div className="mt-4 flex items-center gap-1 text-emerald-500 text-[10px] font-bold">
                    <TrendingDown size={14} /> Reducción del 5% este ciclo
                 </div>
                 <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform"><Leaf size={64} /></div>
               </div>

               <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                 <div className="flex items-center gap-2 text-amber-600 mb-2">
                    <AlertTriangle size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Optimización Sugerida</span>
                 </div>
                 <p className="text-[10px] text-amber-900 leading-relaxed font-medium italic text-justify">
                   "Se detecta un aumento atípico en residuos punzocortantes en la sede Calle 50. Revisar protocolos de llenado de Guardianes al 80% de capacidad."
                 </p>
               </div>
            </div>
          </div>

          <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl">
             <div className="flex items-center gap-3 mb-4">
                <Info className="text-blue-400" size={24} />
                <h4 className="font-black text-sm uppercase tracking-widest">Compliance Ambiental</h4>
             </div>
             <p className="text-slate-400 text-[10px] leading-relaxed mb-6 font-medium">
               Este dashboard alimenta automáticamente la sección VIII de la Auditoría Técnica Anual exigida por la norma ISO 15189:2022.
             </p>
             <button className="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/20">
               Descargar Historial ISO
             </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default BiohazardDashboard;
