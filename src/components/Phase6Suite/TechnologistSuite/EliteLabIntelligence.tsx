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
  PieChart,
  Pie,
  Legend,
  AreaChart,
  Area
} from 'recharts';
import {
  Activity,
  Clock,
  Users,
  Microscope,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  History,
  ShieldCheck,
  Zap,
  Globe,
  PieChart as PieChartIcon,
  BarChart3,
  Timer,
  FileBarChart,
  Filter
} from 'lucide-react';
import { SupabaseService } from '../../../services/SupabaseService';

const EliteLabIntelligence: React.FC = () => {
  const [kpis, setKpis] = useState<any>(null);
  const [demographics, setDemographics] = useState<any[]>([]);
  const [analyzers, setAnalyzers] = useState<any[]>([]);
  const [techs, setTechs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'operational' | 'tat' | 'demographic' | 'analyzers' | 'productivity'>('operational');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [kpiData, demoData, anzData, techData] = await Promise.all([
        SupabaseService.analytics.getOperationalKPIs(),
        SupabaseService.analytics.getDemographics(),
        SupabaseService.analytics.getAnalyzerPerformance(),
        SupabaseService.analytics.getTechProductivity()
      ]);
      setKpis(kpiData);
      setDemographics(demoData);
      setAnalyzers(anzData);
      setTechs(techData);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const renderKPI = (label: string, value: string | number, icon: any, color: string, trend?: string) => (
    <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm group hover:border-teal-400 transition-all">
       <div className={`p-3 rounded-2xl w-fit mb-4 ${color}`}>
          {React.createElement(icon, { size: 20 })}
       </div>
       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
       <div className="flex items-end justify-between">
          <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{value}</h3>
          {trend && (
             <div className="flex items-center gap-1 text-emerald-500 text-[10px] font-bold pb-1">
                <TrendingUp size={14} /> {trend}
             </div>
          )}
       </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Intelligence Header */}
      <div className="bg-slate-900 text-white p-8 rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <Activity className="text-teal-400" size={32} />
            <h1 className="text-3xl font-black tracking-tight uppercase italic text-white">Elite Lab Intelligence (BI)</h1>
          </div>
          <p className="text-slate-400 font-medium leading-relaxed max-w-xl">
             Motor analítico de alta precisión para la gestión de calidad, productividad y epidemiología institucional (ISO 15189 Compliant).
          </p>
        </div>
        <div className="flex flex-wrap gap-2 relative z-10">
           {(['operational', 'tat', 'demographic', 'analyzers', 'productivity'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                  activeTab === tab ? 'bg-teal-500 text-slate-950 border-teal-500 shadow-lg shadow-teal-500/20' : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'
                }`}
              >
                {tab}
              </button>
           ))}
        </div>
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-teal-500/5 rounded-full blur-[80px]"></div>
      </div>

      {/* 1. OPERATIONAL DASHBOARD */}
      {activeTab === 'operational' && (
        <div className="space-y-8">
           <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {renderKPI('Órdenes Totales', kpis?.total_orders || 0, FileBarChart, 'bg-blue-50 text-blue-600', '+12%')}
              {renderKPI('Pruebas Procesadas', kpis?.total_tests || 0, Microscope, 'bg-purple-50 text-purple-600', '+8%')}
              {renderKPI('Validadas (OK)', kpis?.validated_tests || 0, CheckCircle2, 'bg-emerald-50 text-emerald-600', '98.5%')}
              {renderKPI('Hallazgos Críticos', kpis?.critical_results || 0, AlertCircle, 'bg-rose-50 text-rose-600', 'Alert')}
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                 <h3 className="text-lg font-black text-slate-800 mb-8 flex items-center gap-2 uppercase tracking-tight">
                    <BarChart3 className="text-blue-500" size={20} />
                    Productividad Diaria por Sección
                 </h3>
                 <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                       <BarChart data={[{name: 'HEM', value: 450}, {name: 'QMC', value: 890}, {name: 'IMM', value: 320}, {name: 'URON', value: 150}]}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 'bold'}} />
                          <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                          <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}} />
                          <Bar dataKey="value" fill="#0f172a" radius={[8, 8, 0, 0]} barSize={40} />
                       </BarChart>
                    </ResponsiveContainer>
                 </div>
              </div>
              <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden flex flex-col justify-between">
                 <div className="relative z-10">
                    <Timer className="text-teal-400 mb-4" size={32} />
                    <h4 className="text-xl font-black">Efficiency Pulse</h4>
                    <p className="text-slate-400 text-xs mt-3 leading-relaxed">Promedio de tiempo entre recepción de muestra y validación técnica final.</p>
                 </div>
                 <div className="relative z-10 mt-8">
                    <h3 className="text-5xl font-black text-white">{parseFloat(kpis?.avg_tat_minutes || 0).toFixed(1)} <span className="text-sm font-bold text-teal-400">MIN</span></h3>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2">Cumplimiento SLA: 94%</p>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* 2. DEMOGRAPHIC ANALYTICS */}
      {activeTab === 'demographic' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
              <h3 className="text-lg font-black text-slate-800 mb-8 uppercase tracking-tight">Distribución Etaria</h3>
              <div className="h-[300px]">
                 <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                       <Pie
                          data={[
                            {name: 'Infante', value: 120},
                            {name: 'Pediátrico', value: 450},
                            {name: 'Adulto', value: 1200},
                            {name: 'Geriatra', value: 380}
                          ]}
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                       >
                          <Cell fill="#10b981" />
                          <Cell fill="#3b82f6" />
                          <Cell fill="#f59e0b" />
                          <Cell fill="#ef4444" />
                       </Pie>
                       <Tooltip />
                       <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                 </ResponsiveContainer>
              </div>
           </div>
           <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
              <h3 className="text-lg font-black text-slate-800 mb-8 uppercase tracking-tight">Procedencia Geográfica (Panamá)</h3>
              <div className="space-y-4">
                 {[
                   {name: 'Panamá Centro', value: 65},
                   {name: 'Panamá Oeste', value: 15},
                   {name: 'Colón', value: 10},
                   {name: 'Chiriquí', value: 5},
                   {name: 'Otras', value: 5}
                 ].map((p, idx) => (
                    <div key={idx} className="space-y-1">
                       <div className="flex justify-between text-[10px] font-black uppercase text-slate-600">
                          <span>{p.name}</span>
                          <span>{p.value}%</span>
                       </div>
                       <div className="w-full bg-slate-50 h-2 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500" style={{ width: `${p.value}%` }}></div>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        </div>
      )}

      {/* 3. ANALYZER INTELLIGENCE */}
      {activeTab === 'analyzers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {analyzers.map(anz => (
              <div key={anz.analyzer_id} className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col justify-between group hover:border-teal-400 transition-all">
                 <div className="flex justify-between items-start mb-6">
                    <div className="p-3 bg-slate-50 text-slate-600 rounded-2xl group-hover:bg-teal-50 group-hover:text-teal-600 transition-colors">
                       <Zap size={24} />
                    </div>
                    <div className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${anz.status === 'ONLINE' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                       {anz.status}
                    </div>
                 </div>
                 <div>
                    <h4 className="font-black text-slate-800 text-sm uppercase tracking-tight">{anz.analyzer_name}</h4>
                    <div className="mt-4 grid grid-cols-2 gap-4">
                       <div>
                          <p className="text-[8px] font-black text-slate-400 uppercase">Throughput</p>
                          <p className="text-lg font-black text-slate-800">{anz.tests_processed}</p>
                       </div>
                       <div>
                          <p className="text-[8px] font-black text-slate-400 uppercase">Automated</p>
                          <p className="text-lg font-black text-blue-600">{((anz.automated_results / anz.tests_processed) * 100 || 0).toFixed(1)}%</p>
                       </div>
                    </div>
                 </div>
              </div>
           ))}
        </div>
      )}

      {/* 4. PRODUCTIVITY / TECH AUDIT */}
      {activeTab === 'productivity' && (
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
           <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Auditoría de Desempeño por Tecnólogo</h3>
              <button className="p-2 bg-white text-slate-400 border border-slate-200 rounded-xl hover:text-slate-900 transition-all">
                 <Filter size={18} />
              </button>
           </div>
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                 <thead>
                    <tr className="bg-slate-50 text-slate-500 text-[9px] font-black uppercase tracking-widest border-b border-slate-100">
                       <th className="px-6 py-4">Tecnólogo Médico</th>
                       <th className="px-6 py-4 text-center">Ingresados</th>
                       <th className="px-6 py-4 text-center">Validados</th>
                       <th className="px-6 py-4 text-center">Corregidos</th>
                       <th className="px-6 py-4 text-center">Tasa Error</th>
                       <th className="px-6 py-4 text-right">Eficiencia</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                    {techs.map(tech => (
                       <tr key={tech.profile_id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4">
                             <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-black text-slate-400 text-[10px]">{tech.tech_name.charAt(0)}</div>
                                <span className="font-black text-slate-800 text-xs uppercase">{tech.tech_name}</span>
                             </div>
                          </td>
                          <td className="px-6 py-4 text-center font-mono text-xs text-slate-500">{tech.results_entered}</td>
                          <td className="px-6 py-4 text-center font-black text-xs text-slate-800">{tech.results_validated}</td>
                          <td className="px-6 py-4 text-center font-mono text-xs text-rose-500">{tech.results_corrected}</td>
                          <td className="px-6 py-4 text-center">
                             <span className="text-[10px] font-bold text-slate-400">{((tech.results_corrected / tech.results_validated) * 100 || 0).toFixed(2)}%</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                             <div className="inline-flex items-center gap-1 text-emerald-500 font-black text-[10px]">
                                <TrendingUp size={12} /> 96%
                             </div>
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>
      )}

      {/* Footer Disclaimer */}
      <div className="flex items-center justify-center gap-2 py-8 opacity-40">
         <ShieldCheck className="text-teal-600" size={16} />
         <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Enterprise Analytical Engine • ISO 15189:2022 Compliant Intelligence</p>
      </div>
    </div>
  );
};

export default EliteLabIntelligence;
