import React from 'react';
import { Printer, X, ShieldCheck, Truck, Scale, AlertTriangle } from 'lucide-react';

interface DisposalManifestPDFProps {
  pickup: any;
  onClose: () => void;
}

const DisposalManifestPDF: React.FC<DisposalManifestPDFProps> = ({ pickup, onClose }) => {
  const now = new Date();

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md flex items-center justify-center z-[200] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full h-[95vh] overflow-hidden flex flex-col">
        {/* Header Controls */}
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 print:hidden">
          <div className="flex items-center gap-2">
            <Truck className="text-blue-600" size={20} />
            <span className="font-bold text-slate-800 text-sm uppercase">Manifiesto de Transporte de Residuos Peligrosos</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-black hover:bg-slate-800 transition-all"
            >
              <Printer size={16} />
              IMPRIMIR MANIFIESTO
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* PDF Content Area */}
        <div className="flex-1 overflow-y-auto p-12 bg-slate-200/30 flex justify-center print:bg-white print:p-0">
          <div className="w-[210mm] min-h-[297mm] bg-white shadow-xl p-[20mm] font-serif text-black border border-slate-100 print:shadow-none print:border-none print:w-full">

            {/* Header */}
            <div className="text-center border-b-2 border-black pb-6 mb-8">
              <h1 className="text-xl font-bold uppercase">República de Panamá</h1>
              <h2 className="text-md font-bold uppercase mt-1">Ministerio de Ambiente / Ministerio de Salud</h2>
              <h3 className="text-sm font-black mt-4 underline uppercase">Manifiesto de Entrega, Transporte y Disposición Final de Residuos Bio-Peligrosos</h3>
            </div>

            <div className="flex justify-between mb-8 text-[11px] font-bold">
              <span>MANIFIESTO N°: {pickup.manifest_number}</span>
              <span>FECHA DE RETIRO: {new Date(pickup.pickup_date).toLocaleDateString()}</span>
            </div>

            {/* Section 1: Generator */}
            <div className="mb-6">
              <h4 className="bg-slate-100 p-1 text-xs font-black border border-black uppercase mb-3">I. Datos del Generador (Laboratorio)</h4>
              <div className="grid grid-cols-2 gap-y-2 text-[10px]">
                <div><span className="font-bold">RAZÓN SOCIAL:</span> PLATAFORMA-LIS CENTRAL</div>
                <div><span className="font-bold">RUC:</span> 155620-1-658245 DV 22</div>
                <div><span className="font-bold">UBICACIÓN:</span> CIUDAD DE PANAMÁ, VÍA ESPAÑA</div>
                <div><span className="font-bold">TELÉFONO:</span> +507 882-3101</div>
              </div>
            </div>

            {/* Section 2: Waste Description */}
            <div className="mb-6">
              <h4 className="bg-slate-100 p-1 text-xs font-black border border-black uppercase mb-3">II. Descripción de los Residuos</h4>
              <table className="w-full border-collapse border border-black text-[10px]">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="border border-black p-2 text-left">TIPO DE RESIDUO</th>
                    <th className="border border-black p-2 text-center">EMPAQUE</th>
                    <th className="border border-black p-2 text-center">PESO (KG)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-black p-2 font-bold">BIOLÓGICO-INFECCIOSO (SANGRE / FLUIDOS)</td>
                    <td className="border border-black p-2 text-center">BOLSA ROJA</td>
                    <td className="border border-black p-2 text-center">{pickup.total_weight_kg}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 font-black">
                    <td className="border border-black p-2 text-right" colSpan={2}>PESO TOTAL DEL MANIFIESTO:</td>
                    <td className="border border-black p-2 text-center">{pickup.total_weight_kg} KG</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Section 3: Transporter */}
            <div className="mb-6">
              <h4 className="bg-slate-100 p-1 text-xs font-black border border-black uppercase mb-3">III. Datos del Transportista Autorizado</h4>
              <div className="grid grid-cols-2 gap-y-2 text-[10px]">
                <div><span className="font-bold">EMPRESA:</span> {pickup.company_name}</div>
                <div><span className="font-bold">RUC:</span> {pickup.transport_company_ruc || '---'}</div>
                <div><span className="font-bold">VEHÍCULO (PLACA):</span> {pickup.vehicle_plate || '---'}</div>
                <div><span className="font-bold">CONDUCTOR:</span> {pickup.driver_name || '---'}</div>
              </div>
            </div>

            {/* Section 4: Disposal Method */}
            <div className="mb-10">
              <h4 className="bg-slate-100 p-1 text-xs font-black border border-black uppercase mb-3">IV. Método de Disposición Final</h4>
              <div className="p-3 border border-black flex items-center gap-4">
                <div className="w-4 h-4 border-2 border-black bg-black"></div>
                <span className="text-xs font-bold uppercase">{pickup.disposal_method?.replace('_', ' + ')}</span>
              </div>
            </div>

            {/* Legal Text */}
            <p className="text-[9px] text-justify leading-relaxed mb-12 italic">
              El generador certifica que el contenido de esta carga está debidamente clasificado, empacado y rotulado conforme a las Normas Técnicas del Ministerio de Salud de Panamá. El transportista asume la custodia legal para el traslado seguro a la planta de tratamiento autorizada.
            </p>

            {/* Signatures */}
            <div className="mt-20 flex justify-between px-10">
              <div className="text-center border-t border-black pt-2 w-56">
                <div className="text-[9px] font-bold uppercase">Firma Generador (LIS)</div>
                <div className="text-[8px] mt-1">Sello del Laboratorio</div>
              </div>
              <div className="text-center border-t border-black pt-2 w-56">
                <div className="text-[9px] font-bold uppercase">Firma Transportista</div>
                <div className="text-[8px] mt-1">Empresa de Descarte</div>
              </div>
            </div>

            <div className="mt-auto pt-10 text-[8px] text-center opacity-40 uppercase tracking-widest border-t border-slate-100">
              PLATAFORMA-LIS Environmental Compliance Engine • Panama Regulatory Format
            </div>
          </div>
        </div>

        {/* Footer Guidance */}
        <div className="p-6 bg-slate-900 text-white flex justify-between items-center print:hidden">
          <div className="flex items-center gap-3 text-xs font-medium text-amber-400">
            <AlertTriangle size={20} />
            Conserve este manifiesto por al menos 5 años para auditorías de MiAmbiente.
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

export default DisposalManifestPDF;
