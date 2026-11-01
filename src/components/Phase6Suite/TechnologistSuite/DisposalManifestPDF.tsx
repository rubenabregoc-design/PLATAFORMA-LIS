import React from 'react';
import { createPortal } from 'react-dom';
import { Printer, X, ShieldCheck, Truck, Scale, AlertTriangle } from 'lucide-react';
import { buildPrintFileName, printDocument } from '../../../utils/printDocument';

interface DisposalManifestPDFProps {
  pickup?: any;
  onClose?: () => void;
}

const DEFAULT_PICKUP = {
  manifest_number: 'MAN-2026-0042',
  pickup_date: new Date().toISOString(),
  total_weight_kg: 24.5,
  company_name: 'SERVICIOS ECOLÓGICOS Y AMBIENTALES DE PANAMÁ, S.A.',
  transport_company_ruc: '155234-1-849102 DV 40',
  vehicle_plate: 'PA-94821',
  driver_name: 'Carlos Mendoza (Lic. Profesional Tipo F)',
  disposal_method: 'INCINERACION_TERMICA'
};

const DisposalManifestPDF: React.FC<DisposalManifestPDFProps> = ({ 
  pickup = DEFAULT_PICKUP, 
  onClose = () => {} 
}) => {
  const activePickup = pickup || DEFAULT_PICKUP;
  const now = new Date();

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div id="printable-disposal-manifest-modal" data-printable-portal="true" className="printable-modal-overlay fixed inset-0 bg-slate-900/70 backdrop-blur-md flex items-center justify-center z-[200] p-0 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-none sm:rounded-2xl shadow-2xl max-w-4xl w-full min-h-screen sm:min-h-0 sm:max-h-[95vh] overflow-y-auto flex flex-col print:max-h-none print:overflow-visible print:shadow-none print:rounded-none print:w-full">
        {/* Header Controls */}
        <div className="no-print p-3 sm:p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 print:hidden">
          <div className="flex items-center gap-2">
            <Truck className="text-blue-600" size={18} />
            <span className="font-bold text-slate-800 text-xs sm:text-sm uppercase">Manifiesto de Transporte de Residuos Peligrosos</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => printDocument(buildPrintFileName('Manifiesto de Residuos', activePickup?.manifest_number, activePickup?.company_name))}
              className="flex items-center gap-1.5 bg-slate-900 text-white px-3.5 py-1.5 rounded-lg text-xs font-black hover:bg-slate-800 transition-all cursor-pointer"
            >
              <Printer size={15} />
              IMPRIMIR MANIFIESTO
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* PDF Content Area */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-6 bg-slate-200/30 flex justify-center print:bg-white print:p-0 print:overflow-visible">
          <div id="printable-disposal-manifest" data-printable="true" className="w-full max-w-[8.5in] bg-white shadow-xl p-4 sm:p-6 print:p-0 font-serif text-black border border-slate-100 print:shadow-none print:border-none print:w-full single-page-letter">

            {/* Header */}
            <div className="text-center border-b-2 border-black pb-2 mb-3">
              <h1 className="text-base font-bold uppercase leading-tight">República de Panamá</h1>
              <h2 className="text-xs font-bold uppercase mt-0.5 text-slate-700">Ministerio de Ambiente / Ministerio de Salud</h2>
              <h3 className="text-xs font-black mt-2 underline uppercase tracking-tight">Manifiesto de Entrega, Transporte y Disposición Final de Residuos Bio-Peligrosos</h3>
            </div>

            <div className="flex justify-between mb-3 text-[10px] font-bold">
              <span>MANIFIESTO N°: {activePickup.manifest_number}</span>
              <span>FECHA DE RETIRO: {new Date(activePickup.pickup_date).toLocaleDateString()}</span>
            </div>

            {/* Section 1: Generator */}
            <div className="mb-2.5 avoid-break">
              <h4 className="bg-slate-100 p-1 text-[10px] font-black border border-black uppercase mb-1.5">I. Datos del Generador (Laboratorio)</h4>
              <div className="grid grid-cols-2 gap-y-1 text-[9.5px]">
                <div><span className="font-bold">RAZÓN SOCIAL:</span> PLATAFORMA-LIS CENTRAL</div>
                <div><span className="font-bold">RUC:</span> 155620-1-658245 DV 22</div>
                <div><span className="font-bold">UBICACIÓN:</span> CIUDAD DE PANAMÁ, VÍA ESPAÑA</div>
                <div><span className="font-bold">TELÉFONO:</span> +507 882-3101</div>
              </div>
            </div>

            {/* Section 2: Waste Description */}
            <div className="mb-2.5 avoid-break">
              <h4 className="bg-slate-100 p-1 text-[10px] font-black border border-black uppercase mb-1.5">II. Descripción de los Residuos</h4>
              <table className="w-full border-collapse border border-black text-[9.5px]">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="border border-black p-1 text-left">TIPO DE RESIDUO</th>
                    <th className="border border-black p-1 text-center">EMPAQUE</th>
                    <th className="border border-black p-1 text-center">PESO (KG)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-black p-1 font-bold">BIOLÓGICO-INFECCIOSO (SANGRE / FLUIDOS)</td>
                    <td className="border border-black p-1 text-center">BOLSA ROJA</td>
                    <td className="border border-black p-1 text-center font-bold">{activePickup.total_weight_kg}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 font-black">
                    <td className="border border-black p-1 text-right" colSpan={2}>PESO TOTAL DEL MANIFIESTO:</td>
                    <td className="border border-black p-1 text-center">{activePickup.total_weight_kg} KG</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Section 3: Transporter */}
            <div className="mb-2.5 avoid-break">
              <h4 className="bg-slate-100 p-1 text-[10px] font-black border border-black uppercase mb-1.5">III. Datos del Transportista Autorizado</h4>
              <div className="grid grid-cols-2 gap-y-1 text-[9.5px]">
                <div><span className="font-bold">EMPRESA:</span> {activePickup.company_name}</div>
                <div><span className="font-bold">RUC:</span> {activePickup.transport_company_ruc || '---'}</div>
                <div><span className="font-bold">VEHÍCULO (PLACA):</span> {activePickup.vehicle_plate || '---'}</div>
                <div><span className="font-bold">CONDUCTOR:</span> {activePickup.driver_name || '---'}</div>
              </div>
            </div>

            {/* Section 4: Disposal Method */}
            <div className="mb-2.5 avoid-break">
              <h4 className="bg-slate-100 p-1 text-[10px] font-black border border-black uppercase mb-1.5">IV. Método de Disposición Final</h4>
              <div className="p-2 border border-black flex items-center gap-3">
                <div className="w-3.5 h-3.5 border-2 border-black bg-black"></div>
                <span className="text-[10px] font-bold uppercase">{activePickup.disposal_method?.replace('_', ' + ')}</span>
              </div>
            </div>

            {/* Legal Text */}
            <p className="text-[8.5px] text-justify leading-snug mb-3 italic avoid-break">
              El generador certifica que el contenido de esta carga está debidamente clasificado, empacado y rotulado conforme a las Normas Técnicas del Ministerio de Salud de Panamá. El transportista asume la custodia legal para el traslado seguro a la planta de tratamiento autorizada.
            </p>

            {/* Signatures */}
            <div className="avoid-break signature-block mt-4 flex justify-between px-6">
              <div className="text-center border-t border-black pt-1 w-48">
                <div className="text-[8.5px] font-bold uppercase">Firma Generador (LIS)</div>
                <div className="text-[7.5px] mt-0.5">Sello del Laboratorio</div>
              </div>
              <div className="text-center border-t border-black pt-1 w-48">
                <div className="text-[8.5px] font-bold uppercase">Firma Transportista</div>
                <div className="text-[7.5px] mt-0.5">Empresa de Descarte</div>
              </div>
            </div>

            <div className="mt-3 pt-2 text-[7.5px] text-center opacity-40 uppercase tracking-widest border-t border-slate-100 avoid-break font-sans">
              PLATAFORMA-LIS Environmental Compliance Engine • Panama Regulatory Format
            </div>
          </div>
        </div>

        {/* Footer Guidance */}
        <div className="no-print p-4 bg-slate-900 text-white flex justify-between items-center print:hidden">
          <div className="flex items-center gap-2 text-xs font-medium text-amber-400">
            <AlertTriangle size={16} />
            Conserve este manifiesto por al menos 5 años para auditorías de MiAmbiente.
          </div>
          <button
            onClick={onClose}
            className="bg-blue-600 text-white px-6 py-1.5 rounded-xl font-black text-xs hover:bg-blue-500 transition-all shadow-xl shadow-blue-900/20 cursor-pointer"
          >
            CERRAR VISTA PREVIA
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default DisposalManifestPDF;
