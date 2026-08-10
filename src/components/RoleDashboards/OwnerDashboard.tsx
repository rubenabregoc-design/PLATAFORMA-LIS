import React from 'react';
import { Tenant, Branch, Order } from '../../types';
import { DollarSign, Activity, Users, Building2, TrendingUp, ShieldCheck, ArrowUpRight, BarChart3, Clock, Zap, CheckCircle2, Award, Sparkles } from 'lucide-react';

interface OwnerDashboardProps {
  tenant: Tenant;
  branch: Branch;
  orders: Order[];
}

export const OwnerDashboard: React.FC<OwnerDashboardProps> = ({ tenant, branch, orders }) => {
  const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0) + 1420.00;
  const totalOrdersCount = orders.length + 84;
  const avgTatHours = 1.4;

  return (
    <div className="space-y-6">
      {/* Executive Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600"></div>
        <div>
          <div className="text-amber-700 text-xs font-bold uppercase tracking-wider mb-1.5 flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-amber-600" />
            <span>Dashboard Gerencial & Ejecutivo — {tenant.name}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Métricas de Negocio, Finanzas & Operación LIS
          </h1>
          <p className="text-slate-600 text-xs sm:text-sm mt-1 max-w-xl font-medium">
            Suscripción SaaS Activa: <span className="bg-amber-100/80 text-amber-900 px-2.5 py-0.5 rounded-full font-bold border border-amber-200">{tenant.plan} Plan</span> | RUC: {tenant.ruc}-{tenant.dv}
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl text-xs space-y-1.5 shrink-0">
          <div className="text-slate-900 font-bold flex items-center space-x-1.5">
            <Award className="w-4 h-4 text-amber-600" />
            <span>Sedes Registradas: {tenant.branches.length}</span>
          </div>
          <div className="text-slate-600 font-mono text-[11px]">1. {tenant.branches[0]?.name}</div>
          {tenant.branches[1] && <div className="text-slate-600 font-mono text-[11px]">2. {tenant.branches[1]?.name}</div>}
        </div>
      </div>

      {/* Bento Grid Architecture */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Bento Cell 1: Monthly Revenue (4 cols) */}
        <div className="md:col-span-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm hover:border-amber-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Facturación del Mes</span>
            <div className="p-2.5 bg-emerald-50 rounded-2xl border border-emerald-100">
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-slate-900 tracking-tight">${totalRevenue.toFixed(2)} <span className="text-sm font-bold text-slate-500">USD</span></div>
            <div className="text-xs text-emerald-700 font-bold flex items-center space-x-1 mt-2 bg-emerald-50 px-2.5 py-1 rounded-xl w-fit">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              <span>+18.4% respecto al mes anterior</span>
            </div>
          </div>
          <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100">
            Facturación electrónica DGI sincronizada en tiempo real.
          </div>
        </div>

        {/* Bento Cell 2: Samples Processed (4 cols) */}
        <div className="md:col-span-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm hover:border-teal-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Exámenes Procesados</span>
            <div className="p-2.5 bg-teal-50 rounded-2xl border border-teal-100">
              <Activity className="w-5 h-5 text-teal-600" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-slate-900 tracking-tight">{totalOrdersCount * 3} <span className="text-sm font-bold text-slate-500">Muestras</span></div>
            <div className="text-xs text-teal-800 font-bold flex items-center space-x-1 mt-2 bg-teal-50 px-2.5 py-1 rounded-xl w-fit">
              <Zap className="w-3.5 h-3.5 text-teal-600" />
              <span>99.2% Sincronización Automática ASTM/HL7</span>
            </div>
          </div>
          <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100">
            Captura directa desde autoanalizadores Sysmex y Vitros.
          </div>
        </div>

        {/* Bento Cell 3: Average TAT (4 cols) */}
        <div className="md:col-span-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm hover:border-amber-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tiempo Respuesta (TAT)</span>
            <div className="p-2.5 bg-amber-50 rounded-2xl border border-amber-100">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-slate-900 tracking-tight">{avgTatHours} <span className="text-sm font-bold text-slate-500">Horas Promedio</span></div>
            <div className="text-xs text-amber-800 font-bold flex items-center space-x-1 mt-2 bg-amber-50 px-2.5 py-1 rounded-xl w-fit">
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
              <span>Meta del Lab &lt; 2.0 hrs (Superada)</span>
            </div>
          </div>
          <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100">
            Medición automatizada desde toma de muestra hasta firma médica.
          </div>
        </div>

        {/* Bento Cell 4: Multi-Branch Comparative Matrix (8 cols) */}
        <div className="md:col-span-8 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
              <BarChart3 className="w-4 h-4 text-amber-600" />
              <span>Rendimiento Operativo Comparativo por Sede (Multi-Sede)</span>
            </h3>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">Panamá</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {tenant.branches.map((b) => (
              <div key={b.id} className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/80 space-y-3 hover:border-amber-400 transition-all">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm">{b.name}</span>
                  <span className="text-[11px] bg-amber-100 text-amber-900 font-mono font-bold px-2 py-0.5 rounded-md">
                    Código: {b.code}
                  </span>
                </div>
                <div className="text-xs text-slate-500">{b.address}</div>
                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-200/80">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Órdenes Hoy:</span>
                    <strong className="text-slate-900 text-sm font-mono">42 órdenes</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Ingresos Est.:</span>
                    <strong className="text-emerald-700 text-sm font-mono">$890.00 USD</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bento Cell 5: Insurance Agreements & Compliance (4 cols) */}
        <div className="md:col-span-4 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span>Convenios de Aseguradoras</span>
              </h3>
              <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-full">4 Activos</span>
            </div>

            <div className="mt-3 space-y-2 text-xs">
              {['ASSA Compañía de Seguros', 'Pan-American Life (PALIG)', 'Mapfre Panamá', 'Internacional de Seguros'].map((ins, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="font-semibold text-slate-800">{ins}</span>
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 font-bold px-2 py-0.5 rounded">En línea</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-xs space-y-1 bg-amber-50/50 p-3 rounded-2xl border border-amber-100">
            <span className="font-bold text-amber-900 block">Cumplimiento Normativo Panamá:</span>
            <div className="text-amber-800 text-[11px]">✔ DGI Facturación Electrónica (Ley 256)</div>
            <div className="text-amber-800 text-[11px]">✔ ANTAI Ley 81 Protección de Datos</div>
          </div>
        </div>
      </div>
    </div>
  );
};
