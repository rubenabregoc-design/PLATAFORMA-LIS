import React from 'react';
import { createPortal } from 'react-dom';
import { Printer, X, ShieldCheck, Briefcase, FileText, CheckCircle2 } from 'lucide-react';
import { buildPrintFileName, printDocument } from '../../../utils/printDocument';

interface PayrollPayslipProps {
  data: any;
  onClose: () => void;
}

const PayrollPayslip: React.FC<PayrollPayslipProps> = ({ data, onClose }) => {
  const now = new Date();

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div id="printable-payroll-payslip-modal" data-printable-portal="true" className="printable-modal-overlay fixed inset-0 bg-slate-900/70 backdrop-blur-md flex items-center justify-center z-[200] p-0 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-none sm:rounded-2xl shadow-2xl max-w-2xl w-full min-h-screen sm:min-h-0 sm:max-h-[95vh] overflow-y-auto flex flex-col print:max-h-none print:overflow-visible print:shadow-none print:rounded-none print:w-full">
        {/* Header Controls */}
        <div className="no-print p-3 sm:p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 print:hidden">
          <div className="flex items-center gap-2">
            <Briefcase className="text-teal-600" size={18} />
            <span className="font-bold text-slate-800 text-xs sm:text-sm">Volante de Pago de Honorarios</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => printDocument(buildPrintFileName('Volante de Pago', data?.name, data?.profile_id ? String(data.profile_id).slice(0, 8) : undefined))}
              className="flex items-center gap-1.5 bg-slate-900 text-white px-3.5 py-1.5 rounded-lg text-xs font-black hover:bg-slate-800 transition-all cursor-pointer"
            >
              <Printer size={15} />
              IMPRIMIR VOLANTE
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Payslip Content */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-6 bg-slate-200/20 flex justify-center print:bg-white print:p-0 print:overflow-visible">
          <div id="printable-payroll-payslip" data-printable="true" className="w-[180mm] max-w-full bg-white shadow-xl p-4 sm:p-6 font-mono text-black border border-slate-100 print:shadow-none print:border-none print:w-full single-page-letter">

            {/* Header */}
            <div className="flex justify-between items-start border-b-2 border-black pb-2 mb-3">
              <div>
                <h1 className="text-base font-black uppercase leading-tight">PLATAFORMA-LIS S.A.</h1>
                <p className="text-[9px] font-bold">RUC: 155620-1-658245 DV 22</p>
                <p className="text-[9px] text-slate-600">RECURSOS HUMANOS / CONTABILIDAD</p>
              </div>
              <div className="text-right">
                <div className="bg-slate-100 px-2.5 py-0.5 text-[10px] font-black border border-black mb-1">COMPROBANTE DE PAGO</div>
                <p className="text-[9px] text-slate-600">Fecha: {now.toLocaleDateString()}</p>
              </div>
            </div>

            {/* Technologist Info */}
            <div className="grid grid-cols-2 gap-y-2 text-[10px] mb-3 bg-slate-50 p-3 border border-slate-200 rounded-lg avoid-break">
              <div><span className="text-slate-500 font-bold block text-[9px]">COLABORADOR:</span><span className="text-xs font-black">{data.name?.toUpperCase() || 'COLABORADOR'}</span></div>
              <div><span className="text-slate-500 font-bold block text-[9px]">ID / IDONEIDAD:</span><span className="text-xs font-black">TM-8823-PAN</span></div>
              <div><span className="text-slate-500 font-bold block text-[9px]">CARGO:</span><span className="text-xs font-black uppercase">Tecnólogo Médico</span></div>
              <div><span className="text-slate-500 font-bold block text-[9px]">PERIODO:</span><span className="text-xs font-black uppercase">AGOSTO 2026</span></div>
            </div>

            {/* Earnings Breakdown */}
            <div className="mb-3 avoid-break">
              <h2 className="text-[10px] font-black text-center mb-2 bg-black text-white py-0.5 tracking-[0.2em]">DESGLOSE DE HABERES</h2>
              <table className="w-full text-[10px] border-collapse">
                <thead>
                  <tr className="border-b-2 border-black">
                    <th className="text-left py-1">DESCRIPCIÓN</th>
                    <th className="text-center py-1">CANT / UNID</th>
                    <th className="text-right py-1">MONTO ($)</th>
                  </tr>
                </thead>
                <tbody className="divide-y border-slate-100">
                  <tr>
                    <td className="py-1.5 font-bold">Salario Base Mensual</td>
                    <td className="text-center">1.00</td>
                    <td className="text-right">${(parseFloat(data.base_salary) || 0).toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td className="py-1.5">
                      <span className="font-bold">Incentivo por Producción Analítica</span><br/>
                      <span className="text-[8px] text-slate-500 font-normal">Validación de resultados (ISO 15189)</span>
                    </td>
                    <td className="text-center">{data.tests_processed || 0}</td>
                    <td className="text-right">${((data.tests_processed || 0) * (data.commission || 0)).toFixed(2)}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-black font-black bg-slate-50">
                    <td className="py-2 px-2" colSpan={2}>TOTAL BRUTO A LIQUIDAR</td>
                    <td className="text-right py-2 px-2">${((parseFloat(data.base_salary) || 0) + ((data.tests_processed || 0) * (data.commission || 0))).toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Audit & Legal */}
            <div className="mt-2.5 p-2.5 border border-dashed border-slate-300 rounded-lg avoid-break">
              <p className="text-[8.5px] leading-snug text-justify italic">
                <strong>Nota:</strong> Este pago incluye los incentivos por el procesamiento de {data.tests_processed || 0} muestras clínicas debidamente validadas en el middleware del sistema. El colaborador certifica que todos los resultados cumplen con los criterios de calidad interna establecidos en el manual operativo.
              </p>
            </div>

            {/* Signatures */}
            <div className="avoid-break signature-block mt-4 flex justify-between px-6">
              <div className="text-center border-t border-black pt-1 w-48">
                <div className="text-[8.5px] font-bold">RECIBIDO CONFORME</div>
                <div className="text-[8px] mt-0.5">{data.name}</div>
              </div>
              <div className="text-center border-t border-black pt-1 w-48">
                <div className="text-[8.5px] font-bold">AUTORIZADO POR</div>
                <div className="text-[8px] mt-0.5">DPTO. CONTABILIDAD</div>
              </div>
            </div>

            <div className="mt-3 text-[7px] text-center opacity-40 uppercase tracking-widest avoid-break">
              Generado electrónicamente por PLATAFORMA-LIS Intelligence • Hash: payslip-{data.profile_id?.slice(0,8) || '001'}-202608
            </div>
          </div>
        </div>

        {/* Footer Guidance */}
        <div className="no-print p-4 bg-slate-900 text-white flex justify-between items-center print:hidden">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
            <ShieldCheck size={16} className="text-teal-400" />
            Registro de producción certificado por el sistema de auditoría forense.
          </div>
          <button
            onClick={onClose}
            className="bg-teal-600 text-white px-6 py-1.5 rounded-xl font-black text-xs hover:bg-teal-500 transition-all shadow-xl shadow-teal-900/20 cursor-pointer"
          >
            CERRAR VISTA PREVIA
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default PayrollPayslip;
