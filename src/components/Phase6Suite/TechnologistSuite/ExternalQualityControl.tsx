import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Activity,
  FileText,
  TrendingUp,
  AlertCircle,
  ChevronRight,
  Upload,
  Globe,
  Database,
  BarChart3,
  CheckCircle2
} from 'lucide-react';
import { SupabaseService } from '../../../services/SupabaseService';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from 'recharts';

const ExternalQualityControl: React.FC = () => {
  const [eqaData, setEqaData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEQA();
  }, []);

  const fetchEQA = async () => {
    try {
      const data = await SupabaseService.externalQC.getAll();
      setEqaData(data);
    } catch (error) {
      console.error("Error fetching EQA", error);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    total: eqaData.length,
    passed: eqaData.filter(d => d.status === 'EVALUATED_PASS').length,
    failed: eqaData.filter(d => d.status === 'EVALUATED_FAIL').length,
    pending: eqaData.filter(d => d.status === 'PENDING' || d.status === 'REPORTED').length
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Hero */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="max-w-xl">
            <div className="flex items-center gap-3 mb-4">
              <Globe className="text-blue-400" size={32} />
              <h1 className="text-3xl font-black tracking-tight">External Quality Assurance (EQA)</h1>
            </div>
            <p className="text-slate-400 font-medium leading-relaxed">
              Gestión de Programas de Comparación Interlaboratorial (PT). Monitoreo de Exactitud y Sesgo conforme a ISO 15189:2022.
            </p>
            <div className="flex gap-4 mt-8">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-black text-sm flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20">
                <Upload size={18} />
                REGISTRAR RESULTADOS
              </button>
              <button className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-6 py-3 rounded-2xl font-black text-sm flex items-center gap-2 transition-all">
                <Database size={18} />
                CATÁLOGO DE MUESTRAS
              </button>
            </div>
          </div>

          {/* Circular Stats */}
          <div className="flex gap-6">
            <div className="text-center p-6 bg-white/5 rounded-[2rem] border border-white/10 backdrop-blur-md">
              <h4 className="text-4xl font-black text-blue-400">{stats.passed}</h4>
              <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mt-1">Conformes</p>
            </div>
            <div className="text-center p-6 bg-white/5 rounded-[2rem] border border-white/10 backdrop-blur-md">
              <h4 className="text-4xl font-black text-red-400">{stats.failed}</h4>
              <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mt-1">Fuera Rango</p>
            </div>
          </div>
        </div>

        {/* Abstract background element */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-blue-500/10 rounded-full blur-[100px]"></div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Active Programs List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-2 mb-2">
            <h3 className="font-black text-slate-800 uppercase text-xs tracking-[0.2em]">Ciclos de Control Activos</h3>
            <button className="text-xs font-bold text-blue-600 hover:underline">Ver Historial Completo</button>
          </div>

          {eqaData.map((item) => (
            <div key={item.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:border-slate-300 transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                    item.status === 'EVALUATED_PASS' ? 'bg-green-50 text-green-600' :
                    item.status === 'EVALUATED_FAIL' ? 'bg-red-50 text-red-600' :
                    'bg-slate-100 text-slate-500'
                  }`}>
                    <Activity size={24} />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-800 text-lg leading-tight">{item.test_name}</h4>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wide">
                      {item.provider_name} • Muestra: {item.sample_id}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                    item.status === 'EVALUATED_PASS' ? 'bg-green-100 text-green-700' :
                    item.status === 'EVALUATED_FAIL' ? 'bg-red-100 text-red-700' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {item.status.replace('EVALUATED_', '')}
                  </span>
                  <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase">{new Date(item.created_at).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                <div className="text-center border-r border-slate-200">
                  <p className="text-[9px] text-slate-400 font-black uppercase">Reportado</p>
                  <p className="text-sm font-black text-slate-800">{item.reported_value || '--'}</p>
                </div>
                <div className="text-center border-r border-slate-200">
                  <p className="text-[9px] text-slate-400 font-black uppercase">Diana (Target)</p>
                  <p className="text-sm font-black text-slate-800">{item.target_value || '--'}</p>
                </div>
                <div className="text-center border-r border-slate-200">
                  <p className="text-[9px] text-slate-400 font-black uppercase">SDI Score</p>
                  <p className={`text-sm font-black ${Math.abs(item.sdi_score || 0) > 2 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {item.sdi_score ? item.sdi_score.toFixed(2) : '--'}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-[9px] text-slate-400 font-black uppercase">Sesgo (Bias%)</p>
                  <p className="text-sm font-black text-slate-800">{item.bias_percent ? `${item.bias_percent}%` : '--'}</p>
                </div>
              </div>
            </div>
          ))}

          {eqaData.length === 0 && (
            <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-slate-200">
              <FileText className="mx-auto text-slate-200 mb-4" size={48} />
              <p className="text-slate-400 font-bold uppercase text-xs">No hay datos de EQA registrados para el ciclo actual.</p>
            </div>
          )}
        </div>

        {/* Sidebar: Performance Metrics */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="font-black text-slate-800 mb-6 flex items-center gap-2">
              <TrendingUp size={20} className="text-blue-500" />
              Tendencia Z-Score
            </h3>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={eqaData.filter(d => d.sdi_score !== null).slice(-5)}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis hide />
                  <YAxis hide domain={[-3, 3]} />
                  <Tooltip />
                  <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" />
                  <ReferenceLine y={2} stroke="#f59e0b" strokeDasharray="3 3" label={{ position: 'right', value: '+2s', fill: '#f59e0b', fontSize: 10 }} />
                  <ReferenceLine y={-2} stroke="#f59e0b" strokeDasharray="3 3" label={{ position: 'right', value: '-2s', fill: '#f59e0b', fontSize: 10 }} />
                  <Line type="monotone" dataKey="sdi_score" stroke="#3b82f6" strokeWidth={3} dot={{ r: 6, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[10px] text-slate-400 mt-4 italic">El Z-Score óptimo debe mantenerse entre -1.0 y +1.0.</p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="font-black text-slate-800 mb-4 flex items-center gap-2">
              <AlertCircle size={20} className="text-amber-500" />
              Acciones Correctivas
            </h3>
            <div className="space-y-3">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                <p className="text-[10px] font-black text-amber-800 uppercase">Aviso de Sesgo (Dímero D)</p>
                <p className="text-xs text-amber-700 mt-1">Se detectó sesgo positivo persistente en los últimos 2 ciclos (Bias &gt; 15%).</p>
              </div>
              <div className="p-3 bg-red-50 rounded-xl border border-red-100">
                <p className="text-[10px] font-black text-red-800 uppercase">Alerta Crítica (Troponina)</p>
                <p className="text-xs text-red-700 mt-1">Último reporte RIQAS fallido (SDI &gt; 3.0). Requiere re-calibración.</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ExternalQualityControl;
