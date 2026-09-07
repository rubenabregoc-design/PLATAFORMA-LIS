import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Search,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Zap,
  TrendingUp,
  History,
  Settings,
  Scale,
  X,
  Target
} from 'lucide-react';
import { SupabaseService } from '../../../services/SupabaseService';

const RiskManagementDashboard: React.FC = () => {
  const [risks, setRisks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRisks();
  }, []);

  const fetchRisks = async () => {
    try {
      const data = await SupabaseService.risks.getRisks();
      setRisks(data);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const getScoreColor = (score: number) => {
    if (score >= 15) return 'bg-red-500 text-white shadow-red-500/30';
    if (score >= 8) return 'bg-orange-500 text-white shadow-orange-500/30';
    if (score >= 4) return 'bg-yellow-400 text-slate-900 shadow-yellow-500/20';
    return 'bg-emerald-500 text-white shadow-emerald-500/20';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <ShieldAlert className="text-rose-500" size={32} />
            <h1 className="text-3xl font-black tracking-tight uppercase italic">Matriz de Riesgos de Calidad</h1>
          </div>
          <p className="text-slate-400 font-medium leading-relaxed max-w-xl">
             Identificación, evaluación y mitigación de riesgos analíticos y operativos conforme a ISO 15189 §8.5.
          </p>
        </div>
        <button className="bg-rose-500 hover:bg-rose-400 text-white px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-rose-500/20">
          <Plus size={18} className="inline mr-2" /> Identificar Nuevo Riesgo
        </button>
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-rose-500/5 rounded-full blur-[80px]"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Risk Registry Table */}
        <div className="lg:col-span-2 bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="text-lg font-black text-slate-800">Registro de Riesgos Identificados</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input placeholder="Buscar por proceso..." className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] w-64" />
            </div>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-[9px] font-black uppercase tracking-widest border-b border-slate-100">
                  <th className="px-6 py-4">Área / Proceso</th>
                  <th className="px-6 py-4">Descripción del Riesgo</th>
                  <th className="px-6 py-4 text-center">Score (L x S)</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4 text-right">Plan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {risks.map(risk => (
                  <tr key={risk.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                       <span className="text-[10px] font-black bg-slate-900 text-white px-2 py-1 rounded uppercase tracking-wider">{risk.process_area}</span>
                    </td>
                    <td className="px-6 py-4">
                       <p className="text-[10px] font-bold text-slate-700 leading-tight italic">"{risk.risk_description}"</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                       <div className={`inline-flex items-center justify-center w-8 h-8 rounded-lg font-black text-xs ${getScoreColor(risk.risk_score)}`}>
                          {risk.risk_score}
                       </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase border ${
                        risk.status === 'MITIGATED' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {risk.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <button className="p-2 text-slate-400 hover:text-rose-500 transition-all">
                          <History size={18} />
                       </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Risk Matrix Visualization Sidebar */}
        <div className="space-y-6">
           <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
              <h3 className="font-black text-slate-800 text-xs uppercase tracking-widest mb-6 text-center">Mapa de Calor Institucional</h3>
              {/* Simplified Risk Matrix Grid */}
              <div className="grid grid-cols-5 gap-1 mb-4">
                 {Array.from({length: 25}).map((_, i) => {
                    const row = 5 - Math.floor(i / 5);
                    const col = (i % 5) + 1;
                    const score = row * col;
                    return (
                       <div key={i} className={`aspect-square rounded flex items-center justify-center text-[8px] font-black ${
                          score >= 15 ? 'bg-red-500/20 text-red-700' :
                          score >= 8 ? 'bg-orange-500/20 text-orange-700' :
                          score >= 4 ? 'bg-yellow-400/20 text-yellow-700' :
                          'bg-emerald-500/20 text-emerald-700'
                       }`}>
                          {risks.filter(r => r.likelihood === col && r.severity === row).length || ''}
                       </div>
                    );
                 })}
              </div>
              <div className="flex justify-between text-[8px] font-black text-slate-400 uppercase tracking-tighter">
                 <span>Baja Probabilidad</span>
                 <span>Alta Probabilidad</span>
              </div>
           </div>

           <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
              <Target className="text-teal-400 mb-4" size={32} />
              <h4 className="font-black text-sm uppercase tracking-widest">Estrategia de Mitigación</h4>
              <p className="text-slate-400 text-[10px] leading-relaxed mt-3 font-medium">
                 El sistema prioriza automáticamente los riesgos con score <span className="text-white font-black">{'>'} 15</span> para el Plan de Auditoría Anual de Calidad.
              </p>
              <button className="w-full mt-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">Generar Registro ISO</button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default RiskManagementDashboard;
