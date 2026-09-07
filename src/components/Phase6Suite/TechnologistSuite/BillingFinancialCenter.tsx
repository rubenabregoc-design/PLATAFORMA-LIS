import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  CreditCard,
  ShieldCheck,
  FileText,
  TrendingUp,
  Clock,
  ArrowUpRight,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  ClipboardCheck,
  Zap
} from 'lucide-react';
import { SupabaseService } from '../../../services/SupabaseService';
import DailyCashClosingModal from './DailyCashClosingModal';
import CashClosingReceipt from './CashClosingReceipt';
import MonthlyFinancialDashboard from './MonthlyFinancialDashboard';
import { PanamaDiscountRules } from '../../../utils/panamaDiscountRules';

const BillingFinancialCenter: React.FC = () => {
  const [activeView, setActiveTab] = useState<'invoices' | 'dashboard'>('invoices');
  const [invoices, setInvoices] = useState<any[]>([]);
  const [insurances, setInsurances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showClosingModal, setShowClosingModal] = useState(false);
  const [completedClosing, setCompletedClosing] = useState<any | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [invData, insData] = await Promise.all([
        SupabaseService.billing.getInvoices(),
        SupabaseService.billing.getInsuranceProviders()
      ]);
      setInvoices(invData);
      setInsurances(insData);
    } catch (error) {
      console.error("Error fetching financial data", error);
    } finally {
      setLoading(false);
    }
  };

  const totalRevenue = invoices.reduce((acc, inv) => acc + parseFloat(inv.total), 0);
  const totalTax = invoices.reduce((acc, inv) => acc + parseFloat(inv.tax_itbms), 0);

  return (
    <div className="space-y-6">
      {/* Top View Selector */}
      <div className="flex gap-2 bg-white p-2 rounded-2xl border border-slate-200 w-fit">
        <button
          onClick={() => setActiveTab('invoices')}
          className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${
            activeView === 'invoices' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          REGISTRO DE VENTAS
        </button>
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${
            activeView === 'dashboard' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          PERFORMANCE MENSUAL
        </button>
      </div>

      {activeView === 'dashboard' ? (
        <MonthlyFinancialDashboard />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl border border-slate-800">
              <p className="text-slate-400 text-xs font-black uppercase mb-1">Ingresos Totales (Mes)</p>
              <h3 className="text-3xl font-black tracking-tighter">${totalRevenue.toLocaleString()}</h3>
              <div className="mt-4 flex items-center gap-1 text-emerald-400 text-[10px] font-bold">
                Incluye ITBMS (7%): ${totalTax.toLocaleString()}
              </div>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <p className="text-slate-500 text-xs font-black uppercase mb-1">Facturas Emitidas</p>
              <h3 className="text-3xl font-black text-slate-800">{invoices.length}</h3>
              <p className="text-slate-400 text-[10px] mt-2 font-bold">98% con validez fiscal</p>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <p className="text-slate-500 text-xs font-black uppercase mb-1">Por Liquidar (Seguros)</p>
              <h3 className="text-3xl font-black text-blue-600">$4,250</h3>
              <p className="text-slate-400 text-[10px] mt-2 font-bold">Pendiente cobro aseguradora</p>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <p className="text-slate-500 text-xs font-black uppercase mb-1">DGI Compliance</p>
              <h3 className="text-3xl font-black text-emerald-600">ACTIVE</h3>
              <p className="text-slate-400 text-[10px] mt-2 font-bold">Firma electrónica DGI OK</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                  <FileText size={20} className="text-slate-400" />
                  Registro de Facturación Fiscal
                </h3>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      placeholder="Buscar factura..."
                      className="pl-9 pr-4 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <button
                    onClick={() => setShowClosingModal(true)}
                    className="bg-emerald-600 text-white px-4 py-1.5 rounded-lg text-xs font-black flex items-center gap-2"
                  >
                    <ClipboardCheck size={14} />
                    CIERRE DE CAJA
                  </button>
                  <button className="bg-slate-900 text-white px-4 py-1.5 rounded-lg text-xs font-black">NUEVA VENTA</button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                      <th className="px-6 py-4">N° Factura</th>
                      <th className="px-6 py-4">Fecha</th>
                      <th className="px-6 py-4">Metodo</th>
                      <th className="px-6 py-4 text-right">Total</th>
                      <th className="px-6 py-4 text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {invoices.map(inv => (
                      <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-mono font-bold text-xs text-slate-700">{inv.invoice_number || 'PEND-DGI'}</td>
                        <td className="px-6 py-4 text-xs text-slate-500">{new Date(inv.created_at).toLocaleDateString()}</td>
                        <td className="px-6 py-4 text-xs font-bold text-slate-600">{inv.payment_method}</td>
                        <td className="px-6 py-4 text-right font-black text-slate-800">${parseFloat(inv.total).toFixed(2)}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                            inv.fiscal_status === 'ISSUED' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {inv.fiscal_status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {invoices.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-10 text-center text-slate-400 italic">No hay facturas registradas en este periodo.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <h3 className="font-black text-slate-800 text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
                  <ShieldCheck className="text-blue-500" size={18} />
                  Aseguradoras en Convenio
                </h3>
                <div className="space-y-3">
                  {insurances.map(ins => (
                    <div key={ins.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50 flex items-center justify-between">
                      <div>
                        <p className="font-black text-slate-800 text-sm leading-none">{ins.name}</p>
                        <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold">{ins.plan_details}</p>
                      </div>
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    </div>
                  ))}
                  <button className="w-full py-2 bg-slate-100 text-slate-500 rounded-xl text-xs font-bold border border-slate-200">GESTIONAR CONVENIOS</button>
                </div>
              </div>

              <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-6 rounded-[2.5rem] text-white shadow-xl">
                <Zap className="mb-4 text-yellow-400" size={32} />
                <h4 className="font-black text-lg leading-tight">Yappy & Digital Payments Bridge</h4>
                <p className="text-blue-100 text-[11px] mt-2 leading-relaxed">Conecta tu cuenta de empresa para conciliación automática de pagos digitales.</p>
                <button className="w-full mt-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-xs font-black transition-all border border-white/20 backdrop-blur-md uppercase tracking-widest">Configurar API</button>
              </div>
            </div>
          </div>
        </>
      )}

      {showClosingModal && (
        <DailyCashClosingModal
          onClose={() => setShowClosingModal(false)}
          onComplete={(closingData) => {
            setShowClosingModal(false);
            setCompletedClosing(closingData);
            fetchData();
          }}
        />
      )}

      {completedClosing && (
        <CashClosingReceipt
          closing={completedClosing}
          onClose={() => setCompletedClosing(null)}
        />
      )}
    </div>
  );
};

export default BillingFinancialCenter;
