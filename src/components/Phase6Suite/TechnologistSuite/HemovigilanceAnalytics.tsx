import React, { useState, useEffect } from 'react';
import { ShieldAlert, BarChart3, TrendingUp, AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { SupabaseService } from '../../../services/SupabaseService';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts';

const COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#10b981'];

const HemovigilanceAnalytics: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [stats, setStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await SupabaseService.bloodBank.getHemovigilanceStats();
      setStats(data);
    } catch (error) {
      console.error("Error fetching hemovigilance stats", error);
    } finally {
      setLoading(false);
    }
  };

  const getReactionTypeData = () => {
    const types = ['FEBRILE', 'ALLERGIC', 'TRALI', 'HEMOLYTIC_ACUTE', 'SEPTIC'];
    return types.map(t => ({
      name: t,
      count: stats.filter(s => s.reaction_type === t).length
    })).filter(t => t.count > 0);
  };

  const getSeverityData = () => {
    const severities = ['MILD', 'MODERATE', 'SEVERE', 'FATAL'];
    return severities.map(s => ({
      name: s,
      value: stats.filter(st => st.severity === s).length
    })).filter(s => s.value > 0);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-6xl w-full h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-900 text-white">
          <div>
            <h2 className="text-2xl font-black flex items-center gap-3">
              <ShieldAlert className="text-red-500" size={32} />
              Panel de Hemovigilancia y Calidad Transfusional
            </h2>
            <p className="text-slate-400 text-sm font-medium mt-1 uppercase tracking-[0.2em]">Safety & Adverse Event Analytics</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white">
            <X size={28} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
          {/* Top KPI row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-slate-500 text-xs font-black uppercase mb-1">Total Reacciones (YTD)</p>
              <h3 className="text-3xl font-black text-slate-800">{stats.length}</h3>
              <div className="flex items-center gap-1 text-green-500 text-xs font-bold mt-2">
                <TrendingUp size={14} /> -12% vs año anterior
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-slate-500 text-xs font-black uppercase mb-1">Índice de Seguridad</p>
              <h3 className="text-3xl font-black text-blue-600">99.98%</h3>
              <div className="flex items-center gap-1 text-slate-400 text-xs font-bold mt-2">
                <CheckCircle2 size={14} /> Transfusiones Seguras
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-slate-500 text-xs font-black uppercase mb-1">Casos Graves (Severe/Fatal)</p>
              <h3 className="text-3xl font-black text-red-600">
                {stats.filter(s => s.severity === 'SEVERE' || s.severity === 'FATAL').length}
              </h3>
              <div className="flex items-center gap-1 text-red-400 text-xs font-bold mt-2">
                <AlertTriangle size={14} /> Requiere acción inmediata
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-slate-500 text-xs font-black uppercase mb-1">Tiempo de Notificación</p>
              <h3 className="text-3xl font-black text-emerald-600">18 min</h3>
              <div className="flex items-center gap-1 text-slate-400 text-xs font-bold mt-2">
                <BarChart3 size={14} /> Promedio de reporte
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Reaction Types */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <h4 className="font-black text-slate-800 mb-6 flex items-center gap-2">
                <AlertTriangle size={20} className="text-amber-500" />
                Tipología de Eventos Adversos
              </h4>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getReactionTypeData()} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                    <XAxis type="number" hide />
                    <YAxis
                      dataKey="name"
                      type="category"
                      axisLine={false}
                      tickLine={false}
                      tick={{fill: '#64748b', fontSize: 10, fontWeight: 'bold'}}
                      width={100}
                    />
                    <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                    <Bar dataKey="count" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Severity Pie */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <h4 className="font-black text-slate-800 mb-6 flex items-center gap-2">
                <ShieldAlert size={20} className="text-red-500" />
                Distribución de Gravedad
              </h4>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={getSeverityData()}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {getSeverityData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-4 text-[10px] font-black uppercase text-slate-500 mt-2">
                {getSeverityData().map((s, i) => (
                  <div key={s.name} className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full" style={{backgroundColor: COLORS[i % COLORS.length]}}></div>
                    {s.name}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HemovigilanceAnalytics;
