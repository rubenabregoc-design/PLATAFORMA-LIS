import React, { useState, useEffect } from 'react';
import {
  Users,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  Clock,
  Search,
  ArrowRight,
  ShieldCheck,
  Briefcase,
  Zap,
  FileText
} from 'lucide-react';
import { SupabaseService } from '../../../services/SupabaseService';
import PayrollPayslip from './PayrollPayslip';

const PayrollManager: React.FC = () => {
  const [production, setProduction] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewDate] = useState(new Date());
  const [selectedForPayslip, setSelectedForPayslip] = useState<any | null>(null);

  useEffect(() => {
    fetchProduction();
  }, []);

  const fetchProduction = async () => {
    try {
      const data = await SupabaseService.payroll.getTechnologistProduction(
        viewDate.getMonth() + 1,
        viewDate.getFullYear()
      );
      setProduction(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalPay = (p: any) => {
    return parseFloat(p.base_salary) + (p.tests_processed * parseFloat(p.commission));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Briefcase className="text-teal-400" size={32} />
              <h1 className="text-3xl font-black tracking-tight">Liquidación de Nómina Técnica</h1>
            </div>
            <p className="text-slate-400 font-medium leading-relaxed max-w-xl">
              Cálculo automatizado de honorarios basado en producción analítica y validación técnica (ISO 15189 compliance).
            </p>
          </div>
          <div className="bg-white/5 border border-white/10 px-8 py-6 rounded-3xl backdrop-blur-md text-center">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Periodo Actual</p>
            <h4 className="text-2xl font-black">{viewDate.toLocaleString('es-PA', { month: 'long' }).toUpperCase()} {viewDate.getFullYear()}</h4>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="text-lg font-black text-slate-800">Panel de Producción Individual</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input placeholder="Buscar tecnólogo..." className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs w-64" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                  <th className="px-6 py-4">Tecnólogo Médico</th>
                  <th className="px-6 py-4 text-center">Pruebas Validadas</th>
                  <th className="px-6 py-4">Salario Base</th>
                  <th className="px-6 py-4">Incentivos</th>
                  <th className="px-6 py-4 text-right">Total a Pagar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {production.map(p => (
                  <tr key={p.profile_id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-black text-slate-500 text-[10px]">{p.name.charAt(0)}</div>
                        <span className="font-black text-slate-800 text-sm">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="bg-teal-50 text-teal-700 px-3 py-1 rounded-full font-black text-xs">{p.tests_processed}</span>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-600">${parseFloat(p.base_salary).toFixed(2)}</td>
                    <td className="px-6 py-4 text-xs font-bold text-blue-600">${(p.tests_processed * p.commission).toFixed(2)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <span className="font-black text-slate-900 text-sm">${calculateTotalPay(p).toFixed(2)}</span>
                        <button
                          onClick={() => setSelectedForPayslip(p)}
                          className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-all"
                          title="Ver Volante de Pago"
                        >
                          <FileText size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
            <h3 className="font-black text-slate-800 text-xs uppercase tracking-widest mb-6">Acciones de Nómina</h3>
            <div className="space-y-4">
              <button className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
                <ShieldCheck size={18} />
                APROBAR Y LIQUIDAR MES
              </button>
              <button className="w-full py-4 bg-white text-slate-600 border border-slate-200 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all">
                DESCARGAR PRE-NOMINA (XLS)
              </button>
            </div>

            <div className="mt-8 pt-8 border-t border-slate-100">
              <div className="flex items-center gap-2 text-amber-600 mb-2">
                <Clock size={16} />
                <span className="text-[10px] font-black uppercase">Próximo Cierre</span>
              </div>
              <p className="text-xl font-black text-slate-800">25 de Agosto, 2026</p>
              <p className="text-xs text-slate-400 mt-1">Faltan 4 días para el corte de producción.</p>
            </div>
          </div>

          <div className="bg-emerald-500 rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden">
            <Zap className="text-white/20 absolute -right-4 -bottom-4 w-32 h-32" />
            <h4 className="text-xl font-black tracking-tight relative z-10">Eficiencia Analítica</h4>
            <p className="text-emerald-100 text-xs mt-3 leading-relaxed relative z-10">
              El costo laboral por prueba validada este mes es de <span className="font-black">$2.14</span>, un <span className="font-black">12%</span> más bajo que el promedio histórico.
            </p>
          </div>
        </div>
      </div>

      {selectedForPayslip && (
        <PayrollPayslip
          data={selectedForPayslip}
          onClose={() => setSelectedForPayslip(null)}
        />
      )}
    </div>
  );
};

export default PayrollManager;
