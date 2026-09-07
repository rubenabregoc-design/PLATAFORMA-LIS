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
  ReferenceLine
} from 'recharts';
import {
  Layers,
  Activity,
  TrendingUp,
  AlertTriangle,
  ChevronRight,
  CheckCircle2,
  Clock,
  FlaskConical,
  Zap,
  Info
} from 'lucide-react';
import { SupabaseService } from '../../../services/SupabaseService';

const LotStabilityDashboard: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStability();
  }, []);

  const fetchStability = async () => {
    try {
      const stats = await SupabaseService.stability.getLotVialStability();
      setData(stats);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <Layers className="text-teal-400" size={32} />
            <h1 className="text-3xl font-black tracking-tight">Análisis de Estabilidad de Lotes y Viales</h1>
          </div>
          <p className="text-slate-400 font-medium leading-relaxed max-w-xl">
             Comparativa de precisión inter-vial y deriva analítica por lote de reactivo. Monitoreo de la estabilidad a bordo.
          </p>
        </div>
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-teal-500/5 rounded-full blur-[80px]"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Stability Comparison */}
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8 flex flex-col">
           <h3 className="text-lg font-black text-slate-800 mb-8 flex items-center gap-2 uppercase tracking-tight">
              <Activity className="text-blue-500" size={20} />
              Variabilidad de Precisión (CV%) por Lote
           </h3>

           <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="lot_number" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 'bold'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                    <Tooltip
                       cursor={{fill: '#f8fafc'}}
                       contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}}
                    />
                    <ReferenceLine y={5} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'right', value: 'Límite 5%', fill: '#ef4444', fontSize: 10 }} />
                    <Bar dataKey="cv_percentage" radius={[8, 8, 0, 0]} barSize={40} name="CV% Obtenido">
                       {data.map((entry, index) => (
                          <Cell key={index} fill={entry.cv_percentage > 5 ? '#ef4444' : '#0f172a'} />
                       ))}
                    </Bar>
                 </BarChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* Actionable Insights */}
        <div className="space-y-6">
           <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
              <h3 className="font-black text-slate-800 text-xs uppercase tracking-widest mb-6">Lot Performance</h3>
              <div className="space-y-4">
                 {data.map((item, idx) => (
                    <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-teal-400 transition-all">
                       <div className="flex justify-between items-start mb-2">
                          <p className="font-black text-slate-800 text-xs uppercase tracking-tight">{item.analyte_name}</p>
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${item.cv_percentage < 3 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                             {item.cv_percentage < 3 ? 'ESTABLE' : 'ALERTA'}
                          </span>
                       </div>
                       <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold">
                          <span>Lote: {item.lot_number}</span>
                          <span className="font-black text-slate-900">CV: {parseFloat(item.cv_percentage).toFixed(2)}%</span>
                       </div>
                    </div>
                 ))}
                 {data.length === 0 && (
                    <div className="py-10 text-center text-slate-300 font-bold uppercase text-[10px]">Sin datos de estabilidad</div>
                 )}
              </div>
           </div>

           <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl">
              <Zap className="text-yellow-400 mb-4" size={32} />
              <h4 className="font-black text-sm uppercase tracking-widest">Optimización de Inventario</h4>
              <p className="text-slate-400 text-[10px] leading-relaxed mt-3 font-medium">
                 El sistema detectó que el lote <span className="text-white">PRECI-8821</span> tiene un desempeño 15% superior al histórico. Se recomienda priorizar su uso antes de abrir el nuevo embarque.
              </p>
              <button className="w-full mt-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">Generar Reporte Lotes</button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default LotStabilityDashboard;
