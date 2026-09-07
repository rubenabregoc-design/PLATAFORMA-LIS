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
  TrendingDown,
  DollarSign,
  Target,
  Briefcase,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Info,
  Edit3
} from 'lucide-react';
import { SupabaseService } from '../../../services/SupabaseService';
import EditBudgetModal from './EditBudgetModal';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

const MonthlyFinancialDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [budget, setBudget] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [viewDate, setViewDate] = useState(new Date());
  const [showEditBudget, setShowEditBudget] = useState(false);

  useEffect(() => {
    fetchFinancialData();
  }, [viewDate]);

  const fetchFinancialData = async () => {
    setLoading(true);
    try {
      const month = viewDate.getMonth() + 1;
      const year = viewDate.getFullYear();

      const [totals, budgetData] = await Promise.all([
        SupabaseService.billing.getDailyTotals(), // Mocking monthly for now based on current day
        SupabaseService.billing.getBudget(month, year)
      ]);

      setData(totals);
      setBudget(budgetData || { projected_revenue: 0, projected_expenses: 0 });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="h-96 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
    </div>
  );

  const revenuePerformance = budget.projected_revenue > 0
    ? (data.total / budget.projected_revenue) * 100
    : 0;

  const chartData = [
    { name: 'Real', revenue: data.total, expenses: 8400 }, // Mock expenses
    { name: 'Proyectado', revenue: budget.projected_revenue, expenses: budget.projected_expenses }
  ];

  const methodData = [
    { name: 'Yappy', value: data.yappy },
    { name: 'Tarjetas', value: data.card },
    { name: 'Efectivo', value: data.cash },
    { name: 'Seguros', value: data.insurance }
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* View Controls */}
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-slate-950 text-white rounded-2xl">
            <TrendingUp size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">Performance Financiero Mensual</h2>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Presupuesto vs. Realidad • {viewDate.toLocaleString('es-PA', { month: 'long', year: 'numeric' }).toUpperCase()}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-100">
          <button className="p-2 hover:bg-white rounded-xl transition-all"><ChevronLeft size={20} /></button>
          <div className="px-4 text-sm font-black text-slate-700">AGOSTO 2026</div>
          <button className="p-2 hover:bg-white rounded-xl transition-all"><ChevronRight size={20} /></button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Main Performance Charts */}
        <div className="lg:col-span-2 space-y-8">

          {/* Revenue vs Budget Bar Chart */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <Target className="text-blue-500" size={20} />
                Cumplimiento de Metas de Ingresos
              </h3>
              <button
                onClick={() => setShowEditBudget(true)}
                className="flex items-center gap-2 bg-slate-100 text-slate-500 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all border border-slate-200 shadow-sm"
              >
                <Edit3 size={14} />
                AJUSTAR METAS
              </button>
            </div>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barGap={12}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{fill: '#64748b', fontSize: 12, fontWeight: 'bold'}}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{fill: '#64748b', fontSize: 10}}
                    tickFormatter={(val) => `$${val/1000}k`}
                  />
                  <Tooltip
                    cursor={{fill: '#f8fafc'}}
                    contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}}
                  />
                  <Bar dataKey="revenue" fill="#0f172a" radius={[12, 12, 0, 0]} barSize={60} name="Ingresos ($)" />
                  <Bar dataKey="expenses" fill="#94a3b8" radius={[12, 12, 0, 0]} barSize={60} name="Gastos ($)" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="absolute top-8 right-8 text-right">
              <div className={`text-4xl font-black ${revenuePerformance >= 100 ? 'text-emerald-500' : 'text-amber-500'}`}>
                {revenuePerformance.toFixed(1)}%
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Progreso Meta Mensual</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8">
            {/* Payment Methods Breakdown */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
              <h3 className="text-lg font-black text-slate-800 mb-6">Mezcla de Cobros</h3>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={methodData}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {methodData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Quick Insights */}
            <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white flex flex-col justify-between">
              <Zap className="text-yellow-400 mb-4" size={32} />
              <div>
                <h4 className="text-xl font-black leading-tight">Insight Estratégico</h4>
                <p className="text-slate-400 text-xs mt-3 leading-relaxed">
                  El ticket promedio ha subido un <span className="text-emerald-400 font-bold">+8%</span> este mes debido al aumento en perfiles preventivos. Se recomienda fortalecer campaña de "Salud Masculina" para el próximo ciclo.
                </p>
              </div>
              <button className="mt-8 py-3 bg-white/10 hover:bg-white/20 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">Ver Análisis Detallado</button>
            </div>
          </div>
        </div>

        {/* Financial KPIs Sidebar */}
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
            <h3 className="font-black text-slate-800 text-xs uppercase tracking-[0.2em] border-b border-slate-100 pb-4">Financial Scorecard</h3>

            <div className="space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase">Margen Operativo</p>
                  <h4 className="text-2xl font-black text-slate-800">32.4%</h4>
                </div>
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <ArrowUpRight size={18} />
                </div>
              </div>

              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase">Costo por Prueba</p>
                  <h4 className="text-2xl font-black text-slate-800">$4.12</h4>
                </div>
                <div className="p-2 bg-red-50 text-red-600 rounded-xl">
                  <ArrowDownRight size={18} />
                </div>
              </div>

              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase">Días Cuentas x Cobrar</p>
                  <h4 className="text-2xl font-black text-slate-800">42 Días</h4>
                </div>
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <Calendar size={18} />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100">
              <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex gap-3 text-amber-900 text-[10px] leading-relaxed">
                <Info size={20} className="shrink-0 text-amber-500" />
                <p><strong>RECOMENDACIÓN:</strong> Liquidar glosa pendiente de Aseguradora Palig para mejorar el flujo de caja del Q3.</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
            <Briefcase size={32} className="mb-4 opacity-50" />
            <h4 className="text-xl font-black tracking-tight">Proyección Anual 2026</h4>
            <div className="mt-4 space-y-4">
              <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-400 w-[68%]"></div>
              </div>
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                <span>Alcanzado: $184k</span>
                <span>Meta: $250k</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {showEditBudget && (
        <EditBudgetModal
          month={viewDate.getMonth() + 1}
          year={viewDate.getFullYear()}
          initialBudget={budget}
          onClose={() => setShowEditBudget(false)}
          onComplete={() => {
            setShowEditBudget(false);
            fetchFinancialData();
          }}
        />
      )}
    </div>
  );
};

export default MonthlyFinancialDashboard;
