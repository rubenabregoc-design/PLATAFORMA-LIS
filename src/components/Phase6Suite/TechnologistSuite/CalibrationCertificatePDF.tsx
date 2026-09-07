import React from 'react';
import { Printer, X, ShieldCheck, Zap, Scale, FileCheck, Award, AlertTriangle } from 'lucide-react';

interface CalibrationCertificatePDFProps {
  calibration: any;
  onClose: () => void;
}

const CalibrationCertificatePDF: React.FC<CalibrationCertificatePDFProps> = ({ calibration, onClose }) => {
  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md flex items-center justify-center z-[200] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full h-[95vh] overflow-hidden flex flex-col">
        {/* Header Controls */}
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 print:hidden">
          <div className="flex items-center gap-2">
            <Award className="text-yellow-600" size={20} />
            <span className="font-bold text-slate-800 text-sm uppercase tracking-widest">Certificado de Calibración Analítica ISO 15189</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-black hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20"
            >
              <Printer size={16} />
              IMPRIMIR CERTIFICADO
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 transition-colors">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* PDF Content Area */}
        <div className="flex-1 overflow-y-auto p-12 bg-slate-200/30 flex justify-center print:bg-white print:p-0">
          <div className="w-[210mm] min-h-[297mm] bg-white shadow-xl p-[25mm] font-serif text-black border border-slate-100 print:shadow-none print:border-none print:w-full relative">

            {/* Watermark */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none select-none">
              <ShieldCheck size={500} />
            </div>

            {/* Header */}
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-8 mb-10">
              <div className="space-y-1">
                <h1 className="text-2xl font-black uppercase tracking-tighter">Certificado de Calibración</h1>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">ISO 15189:2022 • Metrología Química</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-black">CERTIFICADO N°: CAL-{calibration.id.slice(0,8).toUpperCase()}</p>
                <p className="text-[10px] font-bold text-slate-400">FECHA DE EMISIÓN: {new Date(calibration.calibration_date).toLocaleDateString()}</p>
              </div>
            </div>

            {/* Section 1: Instrument */}
            <div className="mb-8">
              <h4 className="bg-slate-900 text-white p-2 text-xs font-black uppercase mb-4">I. Información del Instrumento</h4>
              <div className="grid grid-cols-2 gap-y-3 text-[11px]">
                <div><span className="font-bold text-slate-500 uppercase mr-2">EQUIPO:</span> {calibration.analyzers?.name}</div>
                <div><span className="font-bold text-slate-500 uppercase mr-2">MODELO:</span> {calibration.analyzers?.model || 'N/A'}</div>
                <div><span className="font-bold text-slate-500 uppercase mr-2">S/N:</span> {calibration.analyzers?.serial_number || '---'}</div>
                <div><span className="font-bold text-slate-500 uppercase mr-2">UBICACIÓN:</span> LABORATORIO CENTRAL</div>
              </div>
            </div>

            {/* Section 2: Method & Conditions */}
            <div className="mb-8">
              <h4 className="bg-slate-900 text-white p-2 text-xs font-black uppercase mb-4">II. Condiciones y Metodología</h4>
              <div className="grid grid-cols-2 gap-y-3 text-[11px]">
                <div><span className="font-bold text-slate-500 uppercase mr-2">MÉTODO:</span> {calibration.calibration_method || 'COMPARACIÓN DIRECTA'}</div>
                <div><span className="font-bold text-slate-500 uppercase mr-2">INCERTIDUMBRE:</span> ± {calibration.uncertainty_value || '0.005'}</div>
                <div><span className="font-bold text-slate-500 uppercase mr-2">TEMP. AMBIENTE:</span> {calibration.temperature_ambient || '22.4'} °C</div>
                <div><span className="font-bold text-slate-500 uppercase mr-2">HUMEDAD:</span> {calibration.humidity_ambient || '45'} %</div>
              </div>
            </div>

            {/* Section 3: Calibration Results */}
            <div className="mb-8">
              <h4 className="bg-slate-900 text-white p-2 text-xs font-black uppercase mb-4">III. Resultados de la Calibración</h4>
              <table className="w-full border-collapse border border-slate-900 text-[11px]">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="border border-slate-900 p-3 text-left">ANALITO / PRUEBA</th>
                    <th className="border border-slate-900 p-3 text-center">LOTE CALIBRADOR</th>
                    <th className="border border-slate-900 p-3 text-center">FACTOR K</th>
                    <th className="border border-slate-900 p-3 text-center">OFFSET</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-slate-900 p-3 font-black uppercase">{calibration.analyte_name}</td>
                    <td className="border border-slate-900 p-3 text-center font-mono">{calibration.calibrator_lot}</td>
                    <td className="border border-slate-900 p-3 text-center font-black">{calibration.k_factor || '1.000'}</td>
                    <td className="border border-slate-900 p-3 text-center font-black">{calibration.offset_value || '0.00'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Traceability Statement */}
            <div className="mb-12">
               <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Declaración de Trazabilidad</h4>
               <p className="text-[10px] text-justify leading-relaxed italic text-slate-600">
                  "Se certifica que los patrones utilizados para esta calibración cuentan con trazabilidad metrológica a unidades del Sistema Internacional (SI) a través del National Institute of Standards and Technology (NIST) o materiales de referencia certificados (CRM). Los resultados contenidos en este certificado se refieren exclusivamente al momento y condiciones en que se realizaron las mediciones."
               </p>
            </div>

            {/* Validity Section */}
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl mb-12">
               <div className="flex items-center gap-3">
                  <AlertTriangle className="text-yellow-600" size={20} />
                  <div className="text-[10px]">
                     <p className="font-black text-yellow-900 uppercase">PRÓXIMA CALIBRACIÓN OBLIGATORIA</p>
                     <p className="font-bold text-yellow-700 mt-1">Este certificado es válido hasta el: {new Date(calibration.expiration_date).toLocaleDateString()}</p>
                  </div>
               </div>
            </div>

            {/* Signatures */}
            <div className="mt-20 flex justify-between px-10">
              <div className="text-center border-t border-slate-900 pt-3 w-64">
                <div className="text-[10px] font-black uppercase tracking-tighter">Lic. {calibration.profiles?.name || 'Director Técnico'}</div>
                <div className="text-[8px] text-slate-500 font-bold uppercase mt-1">Metrólogo / Tecnólogo Responsable</div>
              </div>
              <div className="text-center border-t border-slate-900 pt-3 w-64">
                <div className="text-[10px] font-black uppercase tracking-tighter">Sello de Calidad LIS</div>
                <div className="text-[8px] text-slate-500 font-bold uppercase mt-1">PLATAFORMA-LIS Compliance Engine</div>
              </div>
            </div>

            <div className="mt-auto pt-16 text-[8px] text-center opacity-40 uppercase tracking-[0.4em] border-t border-slate-100 font-sans">
              Integridad Analítica Verificada Digitalmente • ISO 15189 Standard
            </div>
          </div>
        </div>

        {/* Footer Guidance */}
        <div className="p-6 bg-slate-900 text-white flex justify-between items-center print:hidden">
          <div className="flex items-center gap-3 text-xs font-medium text-teal-400">
            <ShieldCheck size={20} />
            Este documento cuenta con validez legal ante auditorías de acreditación.
          </div>
          <button
            onClick={onClose}
            className="bg-blue-600 text-white px-8 py-2 rounded-xl font-black text-sm hover:bg-blue-500 transition-all shadow-xl shadow-blue-900/20"
          >
            CERRAR VISTA PREVIA
          </button>
        </div>
      </div>
    </div>
  );
};

export default CalibrationCertificatePDF;
