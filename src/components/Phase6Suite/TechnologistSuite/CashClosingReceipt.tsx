import React from 'react';
import { Printer, X, ShieldCheck, DollarSign, Smartphone, CreditCard, History } from 'lucide-react';

interface CashClosingReceiptProps {
  closing: any;
  onClose: () => void;
}

const CashClosingReceipt: React.FC<CashClosingReceiptProps> = ({ closing, onClose }) => {
  const now = new Date();

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md flex items-center justify-center z-[200] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Actions Header */}
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 print:hidden">
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-emerald-600" size={20} />
            <span className="font-bold text-slate-800 text-sm">Comprobante de Cierre de Caja</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-black hover:bg-slate-800 transition-all"
            >
              <Printer size={16} />
              IMPRIMIR RECIBO
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Receipt Content - Thermal Printer / Half Letter Style */}
        <div className="flex-1 overflow-y-auto p-12 bg-slate-200/20 flex justify-center print:bg-white print:p-0">
          <div className="w-[140mm] bg-white shadow-xl p-10 font-mono text-black border border-slate-100 print:shadow-none print:border-none print:w-full">

            {/* Header */}
            <div className="text-center border-b-2 border-black pb-4 mb-6">
              <h1 className="text-lg font-black uppercase">PLATAFORMA-LIS CENTRAL</h1>
              <p className="text-[10px] font-bold">RUC: 155620-1-658245 DV 22</p>
              <p className="text-[10px]">Ciudad de Panamá, Vía España</p>
              <div className="mt-4 bg-black text-white py-1 px-3 inline-block text-xs font-black">
                ARQUEO DE CAJA DIARIO
              </div>
            </div>

            {/* Info Section */}
            <div className="grid grid-cols-2 gap-y-2 text-[11px] mb-6">
              <div><span className="font-bold">FECHA:</span> {now.toLocaleDateString()}</div>
              <div><span className="font-bold">HORA:</span> {now.toLocaleTimeString()}</div>
              <div><span className="font-bold">CAJERO:</span> SISTEMA_ADMIN</div>
              <div><span className="font-bold">SUCURSAL:</span> SEDE_01</div>
            </div>

            {/* Financial Breakdown */}
            <div className="border-t border-b border-black py-4 mb-6 space-y-3">
              <h2 className="text-xs font-black text-center mb-2 underline tracking-widest">DESGLOSE DE INGRESOS</h2>

              <div className="flex justify-between text-xs">
                <span>VENTAS EN EFECTIVO:</span>
                <span className="font-bold">${closing.cash_amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>PAGOS POR YAPPY:</span>
                <span className="font-bold">${closing.yappy_amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>PAGOS CON TARJETA:</span>
                <span className="font-bold">${closing.card_amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>ASEGURADORAS / CUENTAS:</span>
                <span className="font-bold">${closing.insurance_amount.toFixed(2)}</span>
              </div>

              <div className="pt-2 border-t border-black/10 flex justify-between font-black text-sm">
                <span>TOTAL ESPERADO:</span>
                <span>${closing.total_expected.toFixed(2)}</span>
              </div>
            </div>

            {/* Reconciliation */}
            <div className="bg-slate-50 p-4 border border-black mb-6">
              <div className="flex justify-between text-xs font-black mb-1">
                <span>TOTAL RECAUDADO (ACTUAL):</span>
                <span>${closing.total_actual.toFixed(2)}</span>
              </div>
              <div className={`flex justify-between text-[10px] font-bold ${closing.difference !== 0 ? 'text-red-600' : 'text-slate-600'}`}>
                <span>DIFERENCIA / DESCUADRE:</span>
                <span>${closing.difference.toFixed(2)}</span>
              </div>
            </div>

            {/* Notes */}
            {closing.notes && (
              <div className="mb-8">
                <p className="text-[10px] font-bold mb-1">OBSERVACIONES:</p>
                <p className="text-[10px] italic border-l-2 border-black pl-2">{closing.notes}</p>
              </div>
            )}

            {/* Signatures */}
            <div className="mt-16 flex flex-col items-center gap-12">
              <div className="w-48 border-t border-black text-center pt-1 text-[9px] font-bold">
                FIRMA CAJERO RESPONSABLE
              </div>
              <div className="w-48 border-t border-black text-center pt-1 text-[9px] font-bold">
                RECIBIDO CONFORME (GERENCIA)
              </div>
            </div>

            <div className="mt-12 text-[8px] text-center opacity-50 uppercase tracking-tighter">
              ID CIERRE: {closing.id?.slice(0, 8)} • SOFTWARE: PLATAFORMA-LIS CORE • PANAMA
            </div>
          </div>
        </div>

        {/* Footer Guidance */}
        <div className="p-6 bg-slate-900 text-white flex justify-between items-center print:hidden">
          <div className="flex items-center gap-3 text-xs font-medium text-slate-400">
            <History size={18} className="text-teal-400" />
            Cierre certificado y guardado en historial financiero.
          </div>
          <button
            onClick={onClose}
            className="bg-emerald-600 text-white px-8 py-2 rounded-xl font-black text-sm hover:bg-emerald-500 transition-all shadow-xl shadow-emerald-900/20"
          >
            FINALIZAR Y CERRAR
          </button>
        </div>
      </div>
    </div>
  );
};

export default CashClosingReceipt;
