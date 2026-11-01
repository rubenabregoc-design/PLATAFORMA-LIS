import React from 'react';
import { createPortal } from 'react-dom';
import { Printer, X, ShieldCheck, DollarSign, Smartphone, CreditCard, History } from 'lucide-react';
import { buildPrintFileName, printDocument } from '../../../utils/printDocument';

interface CashClosingReceiptProps {
  closing: any;
  onClose: () => void;
}

const CashClosingReceipt: React.FC<CashClosingReceiptProps> = ({ closing, onClose }) => {
  const now = new Date();

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div id="printable-cash-closing-modal" data-printable-portal="true" className="printable-modal-overlay fixed inset-0 bg-slate-900/70 backdrop-blur-md flex items-center justify-center z-[200] p-0 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-none sm:rounded-2xl shadow-2xl max-w-2xl w-full min-h-screen sm:min-h-0 sm:max-h-[95vh] overflow-y-auto flex flex-col print:max-h-none print:overflow-visible print:shadow-none print:rounded-none print:w-full">
        {/* Actions Header */}
        <div className="no-print p-3 sm:p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 print:hidden">
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-emerald-600" size={18} />
            <span className="font-bold text-slate-800 text-xs sm:text-sm">Comprobante de Cierre de Caja</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => printDocument(buildPrintFileName('Cierre de Caja', closing?.id ? String(closing.id).slice(0, 8) : undefined))}
              className="flex items-center gap-1.5 bg-slate-900 text-white px-3.5 py-1.5 rounded-lg text-xs font-black hover:bg-slate-800 transition-all cursor-pointer"
            >
              <Printer size={15} />
              IMPRIMIR RECIBO
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Receipt Content - Thermal Printer / Letter Friendly Style */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-6 bg-slate-200/20 flex justify-center print:bg-white print:p-0 print:overflow-visible">
          <div id="printable-cash-closing" data-printable="true" className="w-[140mm] max-w-full bg-white shadow-xl p-4 sm:p-6 print:p-0 font-mono text-black border border-slate-100 print:shadow-none print:border-none print:w-full single-page-letter">

            {/* Header */}
            <div className="text-center border-b-2 border-black pb-2 mb-3">
              <h1 className="text-base font-black uppercase">PLATAFORMA-LIS CENTRAL</h1>
              <p className="text-[9px] font-bold">RUC: 155620-1-658245 DV 22</p>
              <p className="text-[9px]">Ciudad de Panamá, Vía España</p>
              <div className="mt-2 bg-black text-white py-0.5 px-2.5 inline-block text-[11px] font-black">
                ARQUEO DE CAJA DIARIO
              </div>
            </div>

            {/* Info Section */}
            <div className="grid grid-cols-2 gap-y-1 text-[10px] mb-3">
              <div><span className="font-bold">FECHA:</span> {now.toLocaleDateString()}</div>
              <div><span className="font-bold">HORA:</span> {now.toLocaleTimeString()}</div>
              <div><span className="font-bold">CAJERO:</span> SISTEMA_ADMIN</div>
              <div><span className="font-bold">SUCURSAL:</span> SEDE_01</div>
            </div>

            {/* Financial Breakdown */}
            <div className="border-t border-b border-black py-2.5 mb-3 space-y-1.5 avoid-break">
              <h2 className="text-[11px] font-black text-center mb-1 underline tracking-wider">DESGLOSE DE INGRESOS</h2>

              <div className="flex justify-between text-[11px]">
                <span>VENTAS EN EFECTIVO:</span>
                <span className="font-bold">${(closing.cash_amount || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span>PAGOS POR YAPPY:</span>
                <span className="font-bold">${(closing.yappy_amount || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span>PAGOS CON TARJETA:</span>
                <span className="font-bold">${(closing.card_amount || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span>ASEGURADORAS / CUENTAS:</span>
                <span className="font-bold">${(closing.insurance_amount || 0).toFixed(2)}</span>
              </div>

              <div className="pt-1.5 border-t border-black/10 flex justify-between font-black text-xs">
                <span>TOTAL ESPERADO:</span>
                <span>${(closing.total_expected || 0).toFixed(2)}</span>
              </div>
            </div>

            {/* Reconciliation */}
            <div className="bg-slate-50 p-2.5 border border-black mb-3 avoid-break">
              <div className="flex justify-between text-xs font-black mb-0.5">
                <span>TOTAL RECAUDADO (ACTUAL):</span>
                <span>${(closing.total_actual || 0).toFixed(2)}</span>
              </div>
              <div className={`flex justify-between text-[9px] font-bold ${closing.difference !== 0 ? 'text-red-600' : 'text-slate-600'}`}>
                <span>DIFERENCIA / DESCUADRE:</span>
                <span>${(closing.difference || 0).toFixed(2)}</span>
              </div>
            </div>

            {/* Notes */}
            {closing.notes && (
              <div className="mb-3 avoid-break">
                <p className="text-[9px] font-bold mb-0.5">OBSERVACIONES:</p>
                <p className="text-[9px] italic border-l-2 border-black pl-2">{closing.notes}</p>
              </div>
            )}

            {/* Signatures */}
            <div className="avoid-break signature-block mt-6 flex justify-between items-center gap-4 px-2">
              <div className="w-40 border-t border-black text-center pt-1 text-[8.5px] font-bold">
                FIRMA CAJERO RESPONSABLE
              </div>
              <div className="w-40 border-t border-black text-center pt-1 text-[8.5px] font-bold">
                RECIBIDO CONFORME (GERENCIA)
              </div>
            </div>

            <div className="mt-4 pt-2 text-[8px] text-center opacity-50 uppercase tracking-tighter avoid-break border-t border-slate-100">
              ID CIERRE: {closing.id?.slice(0, 8) || '001'} • SOFTWARE: PLATAFORMA-LIS CORE • PANAMA
            </div>
          </div>
        </div>

        {/* Footer Guidance */}
        <div className="no-print p-4 bg-slate-900 text-white flex justify-between items-center print:hidden">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
            <History size={16} className="text-teal-400" />
            Cierre certificado y guardado en historial financiero.
          </div>
          <button
            onClick={onClose}
            className="bg-emerald-600 text-white px-6 py-1.5 rounded-xl font-black text-xs hover:bg-emerald-500 transition-all shadow-xl shadow-emerald-900/20 cursor-pointer"
          >
            FINALIZAR Y CERRAR
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default CashClosingReceipt;
