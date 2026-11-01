import React from 'react';
import { createPortal } from 'react-dom';
import { Printer, X, FileText, ShieldCheck, AlertCircle } from 'lucide-react';
import { buildPrintFileName, printDocument } from '../../../utils/printDocument';

interface EpidemiologicalReportModalProps {
  unit: any;
  onClose: () => void;
}

const EpidemiologicalReportModal: React.FC<EpidemiologicalReportModalProps> = ({ unit, onClose }) => {
  const reactiveMarkers = [];
  if (unit?.marker_hiv) reactiveMarkers.push('VIH 1/2');
  if (unit?.marker_hbv) reactiveMarkers.push('Hepatitis B (HBsAg)');
  if (unit?.marker_hcv) reactiveMarkers.push('Hepatitis C');
  if (unit?.marker_syphilis) reactiveMarkers.push('Sífilis (VDRL/TPHA)');
  if (unit?.marker_chagas) reactiveMarkers.push('Enfermedad de Chagas (T. cruzi)');
  if (unit?.marker_htlv) reactiveMarkers.push('HTLV I/II');

  const now = new Date();
  const reportNumber = `MINSA-BB-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div id="printable-epidemio-modal" data-printable-portal="true" className="printable-modal-overlay fixed inset-0 bg-slate-900/70 backdrop-blur-md flex items-center justify-center z-[200] p-0 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-none sm:rounded-2xl shadow-2xl max-w-4xl w-full min-h-screen sm:min-h-0 sm:max-h-[95vh] overflow-y-auto flex flex-col print:max-h-none print:overflow-visible print:shadow-none print:rounded-none print:w-full">
        {/* Header Controls */}
        <div className="no-print p-3 sm:p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="text-red-600" size={18} />
            <span className="font-bold text-slate-800 text-xs sm:text-sm">Formulario de Notificación Epidemiológica Obligatoria</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => printDocument(buildPrintFileName('Notificacion Epidemiologica', reportNumber, unit?.unit_number))}
              className="flex items-center gap-1.5 bg-slate-800 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <Printer size={15} />
              Imprimir Reporte
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* PDF Content Area */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-6 bg-slate-200/30 flex justify-center print:bg-white print:p-0 print:overflow-visible">
          <div id="printable-epidemio-report" data-printable="true" className="w-full max-w-[8.5in] bg-white shadow-xl p-4 sm:p-6 font-serif text-black print:shadow-none print:w-full single-page-letter print:p-0">

            {/* MINSA Header */}
            <div className="text-center mb-3">
              <h1 className="text-base font-bold uppercase underline leading-tight">República de Panamá</h1>
              <h2 className="text-xs font-bold uppercase text-slate-800">Ministerio de Salud</h2>
              <h3 className="text-[11px] font-bold uppercase text-slate-700">Dirección General de Salud Pública</h3>
              <h4 className="text-[10px] font-bold uppercase mt-1 text-red-900">Departamento de Epidemiología - Notificación de Marcadores en Bancos de Sangre</h4>
            </div>

            <div className="flex justify-between mb-2.5 text-[10px] font-bold">
              <span>N° Reporte: {reportNumber}</span>
              <span>Fecha: {now.toLocaleDateString()}</span>
            </div>

            {/* Section 1: Facility Info */}
            <div className="mb-2.5 avoid-break">
              <h5 className="bg-slate-100 p-1 text-[10px] font-bold border border-black uppercase mb-1">I. Datos de la Instalación Notificante</h5>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-[9.5px]">
                <div><span className="font-bold">Nombre del Banco:</span> PLATAFORMA-LIS CENTRAL</div>
                <div><span className="font-bold">RUC:</span> 155620-1-658245 DV 22</div>
                <div><span className="font-bold">Región de Salud:</span> PANAMÁ METRO</div>
                <div><span className="font-bold">Director Técnico:</span> DR. RUBÉN ABREGO</div>
              </div>
            </div>

            {/* Section 2: Donor Info */}
            <div className="mb-2.5 avoid-break">
              <h5 className="bg-slate-100 p-1 text-[10px] font-bold border border-black uppercase mb-1">II. Información del Donante (Confidencial - Ley 81)</h5>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-[9.5px]">
                <div><span className="font-bold">Nombre Completo:</span> [CONFIDENCIAL - VER SISTEMA]</div>
                <div><span className="font-bold">Cédula / ID:</span> [CEDULA_PROTEGIDA]</div>
                <div><span className="font-bold">Género:</span> MASCULINO</div>
                <div><span className="font-bold">Fecha de Nacimiento:</span> 12/05/1988</div>
                <div><span className="font-bold">Dirección Residencial:</span> CIUDAD DE PANAMÁ, VÍA ESPAÑA</div>
                <div><span className="font-bold">Teléfono de Contacto:</span> +507 6XXX-XXXX</div>
              </div>
            </div>

            {/* Section 3: Unit Info */}
            <div className="mb-2.5 avoid-break">
              <h5 className="bg-slate-100 p-1 text-[10px] font-bold border border-black uppercase mb-1">III. Datos de la Unidad Reactiva</h5>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-[9.5px]">
                <div><span className="font-bold">N° de Unidad (DIN):</span> {unit?.unit_number || 'N/A'}</div>
                <div><span className="font-bold">Fecha de Extracción:</span> {unit?.collection_date ? new Date(unit.collection_date).toLocaleDateString() : 'N/A'}</div>
                <div><span className="font-bold">Tipo de Sangre:</span> {unit?.blood_type || 'O'}{unit?.rh_factor === 'POS' ? '+' : '-'}</div>
                <div><span className="font-bold">Volumen:</span> {unit?.volume_ml || 450} mL</div>
              </div>
            </div>

            {/* Section 4: Results */}
            <div className="mb-2.5 avoid-break">
              <h5 className="bg-slate-100 p-1 text-[10px] font-bold border border-black uppercase mb-1">IV. Resultados de Laboratorio (Marcadores Reactivos)</h5>
              <p className="text-[9px] mb-2 italic">Se ha detectado reactividad en las pruebas de tamizaje obligatorio para los siguientes patógenos:</p>

              <div className="border border-black p-2 bg-red-50">
                <ul className="list-disc list-inside space-y-1">
                  {reactiveMarkers.map(m => (
                    <li key={m} className="text-xs font-black text-red-700 uppercase tracking-wider">{m} - REACTIVO</li>
                  ))}
                  {reactiveMarkers.length === 0 && (
                    <li className="text-xs font-bold text-slate-700 uppercase">NINGÚN MARCADOR REACTIVO REPORTADO</li>
                  )}
                </ul>
              </div>

              <div className="mt-2 text-[8px] text-justify leading-snug">
                <p><strong>Nota Técnica:</strong> La unidad ha sido segregada inmediatamente y trasladada al área de descarte bio-peligroso conforme al protocolo nacional. Se ha procedido a la citación del donante para la toma de muestra confirmatoria en el Laboratorio Central de Referencia en Salud Pública (LCRSP).</p>
              </div>
            </div>

            {/* Signature Section */}
            <div className="avoid-break signature-block mt-4 flex justify-between px-6">
              <div className="text-center border-t border-black pt-1 w-52">
                <div className="text-[9px] font-bold">Firma del Tecnólogo Médico</div>
                <div className="text-[8px]">IDONEIDAD N°: 8823-TECH</div>
              </div>
              <div className="text-center border-t border-black pt-1 w-52">
                <div className="text-[9px] font-bold">Sello de la Institución</div>
                <div className="text-[8px]">BANCO DE SANGRE OFICIAL</div>
              </div>
            </div>

            <div className="mt-3 pt-2 text-[7.5px] text-slate-400 text-center uppercase tracking-widest border-t border-slate-100 avoid-break font-sans">
              Documento Generado por PLATAFORMA-LIS • Sistema de Gestión de Medicina Transfusional
            </div>
          </div>
        </div>

        {/* Footer Guidance */}
        <div className="no-print p-4 bg-slate-900 text-white flex justify-between items-center print:hidden">
          <div className="flex items-center gap-2 text-xs font-medium text-red-400">
            <AlertCircle size={16} />
            Este documento contiene información PII protegida por la Ley 81 de Panamá.
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-5 py-1.5 text-slate-400 font-bold hover:text-white transition-colors cursor-pointer text-xs"
            >
              Cerrar Vista Previa
            </button>
            <button
              onClick={() => {
                alert("Reporte Certificado y Guardado en Historial MINSA.");
                onClose();
              }}
              className="flex items-center gap-1.5 bg-red-600 text-white px-6 py-1.5 rounded-lg font-bold hover:bg-red-700 transition-all shadow-xl shadow-red-900/20 cursor-pointer text-xs"
            >
              <ShieldCheck size={16} />
              Certificar y Guardar
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default EpidemiologicalReportModal;
