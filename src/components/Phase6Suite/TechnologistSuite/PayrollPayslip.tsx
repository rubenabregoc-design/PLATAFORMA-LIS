import React from 'react';
import { Printer, X, ShieldCheck, Briefcase, FileText, CheckCircle2 } from 'lucide-react';

interface PayrollPayslipProps {
  data: any;
  onClose: () => void;
}

const PayrollPayslip: React.FC<PayrollPayslipProps> = ({ data, onClose }) => {
  const now = new Date();

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md flex items-center justify-center z-[200] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full h-[90vh] overflow-hidden flex flex-col">
        {/* Header Controls */}
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 print:hidden">
          <div className="flex items-center gap-2">
            <Briefcase className="text-teal-600" size={20} />
            <span className="font-bold text-slate-800 text-sm">Volante de Pago de Honorarios</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-black hover:bg-slate-800 transition-all"
            >
              <Printer size={16} />
              IMPRIMIR VOLANTE
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Payslip Content */}
        <div className="flex-1 overflow-y-auto p-12 bg-slate-200/20 flex justify-center print:bg-white print:p-0">
          <div className="w-[180mm] bg-white shadow-xl p-12 font-mono text-black border border-slate-100 print:shadow-none print:border-none print:w-full">

            {/* Header */}
            <div className="flex justify-between items-start border-b-2 border-black pb-6 mb-8">
              <div>
                <h1 className="text-xl font-black uppercase">PLATAFORMA-LIS S.A.</h1>
                <p className="text-[10px] font-bold">RUC: 155620-1-658245 DV 22</p>
                <p className="text-[10px]">RECURSOS HUMANOS / CONTABILIDAD</p>
              </div>
              <div className="text-right">
                <div className="bg-slate-100 px-3 py-1 text-xs font-black border border-black mb-2">COMPROBANTE DE PAGO</div>
                <p className="text-[10px]">Fecha: {now.toLocaleDateString()}</p>
              </div>
            </div>

            {/* Technologist Info */}
            <div className="grid grid-cols-2 gap-y-4 text-[11px] mb-8 bg-slate-50 p-6 border border-slate-200 rounded-xl">
              <div><span className="text-slate-500 font-bold">COLABORADOR:</span><br/><span className="text-sm font-black">{data.name.toUpperCase()}</span></div>
              <div><span className="text-slate-500 font-bold">ID / IDONEIDAD:</span><br/><span className="text-sm font-black">TM-8823-PAN</span></div>
              <div><span className="text-slate-500 font-bold">CARGO:</span><br/><span className="text-sm font-black uppercase">Tecnólogo Médico</span></div>
              <div><span className="text-slate-500 font-bold">PERIODO:</span><br/><span className="text-sm font-black uppercase">AGOSTO 2026</span></div>
            </div>

            {/* Earnings Breakdown */}
            <div className="mb-10">
              <h2 className="text-xs font-black text-center mb-4 bg-black text-white py-1 tracking-[0.3em]">DESGLOSE DE HABERES</h2>
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b-2 border-black">
                    <th className="text-left py-2">DESCRIPCIÓN</th>
                    <th className="text-center py-2">CANT / UNID</th>
                    <th className="text-right py-2">MONTO ($)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-3 font-bold">Salario Base Mensual</td>
                    <td className="text-center">1.00</td>
                    <td className="text-right">${data.base_salary.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td className="py-3">
                      <span className="font-bold">Incentivo por Producción Analítica</span><br/>
                      <span className="text-[9px] text-slate-500 font-normal">Validación de resultados (ISO 15189)</span>
                    </td>
                    <td className="text-center">{data.tests_processed}</td>
                    <td className="text-right">${(data.tests_processed * data.commission).toFixed(2)}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-black font-black bg-slate-50">
                    <td className="py-4 px-2" colSpan={2}>TOTAL BRUTO A LIQUIDAR</td>
                    <td className="text-right py-4 px-2">${(parseFloat(data.base_salary) + (data.tests_processed * data.commission)).toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Audit & Legal */}
            <div className="mt-12 p-4 border border-dashed border-slate-300 rounded-lg">
              <p className="text-[9px] leading-relaxed text-justify italic">
                <strong>Nota:</strong> Este pago incluye los incentivos por el procesamiento de {data.tests_processed} muestras clínicas debidamente validadas en el middleware del sistema. El colaborador certifica que todos los resultados cumplen con los criterios de calidad interna establecidos en el manual operativo.
              </p>
            </div>

            {/* Signatures */}
            <div className="mt-20 flex justify-between px-10">
              <div className="text-center border-t border-black pt-2 w-56">
                <div className="text-[9px] font-bold">RECIBIDO CONFORME</div>
                <div className="text-[8px] mt-1">{data.name}</div>
              </div>
              <div className="text-center border-t border-black pt-2 w-56">
                <div className="text-[9px] font-bold">AUTORIZADO POR</div>
                <div className="text-[8px] mt-1">DPTO. CONTABILIDAD</div>
              </div>
            </div>

            <div className="mt-12 text-[7px] text-center opacity-40 uppercase tracking-widest">
              Generado electrónicamente por PLATAFORMA-LIS Intelligence • Hash: payslip-{data.profile_id?.slice(0,8)}-202608
            </div>
          </div>
        </div>

        {/* Footer Guidance */}
        <div className="p-6 bg-slate-900 text-white flex justify-between items-center print:hidden">
          <div className="flex items-center gap-3 text-xs font-medium text-slate-400">
            <ShieldCheck size={18} className="text-teal-400" />
            Registro de producción certificado por el sistema de auditoría forense.
          </div>
          <button
            onClick={onClose}
            className="bg-teal-600 text-white px-8 py-2 rounded-xl font-black text-sm hover:bg-teal-500 transition-all shadow-xl shadow-teal-900/20"
          >
            CERRAR VISTA PREVIA
          </button>
        </div>
      </div>
    </div>
  );
};

export default PayrollPayslip;
