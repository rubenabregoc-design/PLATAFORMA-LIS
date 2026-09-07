import React from 'react';
import { Printer, X, FileText, ShieldCheck, AlertCircle } from 'lucide-react';

interface EpidemiologicalReportModalProps {
  unit: any;
  onClose: () => void;
}

const EpidemiologicalReportModal: React.FC<EpidemiologicalReportModalProps> = ({ unit, onClose }) => {
  const reactiveMarkers = [];
  if (unit.marker_hiv) reactiveMarkers.push('VIH 1/2');
  if (unit.marker_hbv) reactiveMarkers.push('Hepatitis B (HBsAg)');
  if (unit.marker_hcv) reactiveMarkers.push('Hepatitis C');
  if (unit.marker_syphilis) reactiveMarkers.push('Sífilis (VDRL/TPHA)');
  if (unit.marker_chagas) reactiveMarkers.push('Enfermedad de Chagas (T. cruzi)');
  if (unit.marker_htlv) reactiveMarkers.push('HTLV I/II');

  const now = new Date();
  const reportNumber = `MINSA-BB-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full h-[90vh] overflow-hidden flex flex-col">
        {/* Header Controls */}
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-2">
            <FileText className="text-red-600" size={20} />
            <span className="font-bold text-slate-800">Formulario de Notificación Epidemiológica Obligatoria</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-slate-700 transition-colors"
            >
              <Printer size={16} />
              Imprimir Reporte
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* PDF Content Area */}
        <div className="flex-1 overflow-y-auto p-12 bg-slate-200/30 flex justify-center print:bg-white print:p-0">
          <div className="w-[210mm] min-h-[297mm] bg-white shadow-xl p-[20mm] font-serif text-black print:shadow-none print:w-full">

            {/* MINSA Header */}
            <div className="text-center mb-8">
              <h1 className="text-lg font-bold uppercase underline">República de Panamá</h1>
              <h2 className="text-md font-bold uppercase">Ministerio de Salud</h2>
              <h3 className="text-sm font-bold uppercase">Dirección General de Salud Pública</h3>
              <h4 className="text-xs font-bold uppercase mt-2">Departamento de Epidemiología - Notificación de Marcadores en Bancos de Sangre</h4>
            </div>

            <div className="flex justify-between mb-8 text-xs font-bold">
              <span>N° Reporte: {reportNumber}</span>
              <span>Fecha: {now.toLocaleDateString()}</span>
            </div>

            {/* Section 1: Facility Info */}
            <div className="mb-6">
              <h5 className="bg-slate-100 p-1 text-xs font-bold border border-black uppercase mb-2">I. Datos de la Instalación Notificante</h5>
              <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-xs">
                <div><span className="font-bold">Nombre del Banco:</span> PLATAFORMA-LIS CENTRAL</div>
                <div><span className="font-bold">RUC:</span> 155620-1-658245 DV 22</div>
                <div><span className="font-bold">Región de Salud:</span> PANAMÁ METRO</div>
                <div><span className="font-bold">Director Técnico:</span> DR. RUBÉN ABREGO</div>
              </div>
            </div>

            {/* Section 2: Donor Info */}
            <div className="mb-6">
              <h5 className="bg-slate-100 p-1 text-xs font-bold border border-black uppercase mb-2">II. Información del Donante (Confidencial - Ley 81)</h5>
              <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-xs">
                <div><span className="font-bold">Nombre Completo:</span> [CONFIDENCIAL - VER SISTEMA]</div>
                <div><span className="font-bold">Cédula / ID:</span> [CEDULA_PROTEGIDA]</div>
                <div><span className="font-bold">Género:</span> MASCULINO</div>
                <div><span className="font-bold">Fecha de Nacimiento:</span> 12/05/1988</div>
                <div><span className="font-bold">Dirección Residencial:</span> CIUDAD DE PANAMÁ, VÍA ESPAÑA</div>
                <div><span className="font-bold">Teléfono de Contacto:</span> +507 6XXX-XXXX</div>
              </div>
            </div>

            {/* Section 3: Unit Info */}
            <div className="mb-6">
              <h5 className="bg-slate-100 p-1 text-xs font-bold border border-black uppercase mb-2">III. Datos de la Unidad Reactiva</h5>
              <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-xs">
                <div><span className="font-bold">N° de Unidad (DIN):</span> {unit.unit_number}</div>
                <div><span className="font-bold">Fecha de Extracción:</span> {new Date(unit.collection_date).toLocaleDateString()}</div>
                <div><span className="font-bold">Tipo de Sangre:</span> {unit.blood_type}{unit.rh_factor === 'POS' ? '+' : '-'}</div>
                <div><span className="font-bold">Volumen:</span> {unit.volume_ml} mL</div>
              </div>
            </div>

            {/* Section 4: Results */}
            <div className="mb-8">
              <h5 className="bg-slate-100 p-1 text-xs font-bold border border-black uppercase mb-2">IV. Resultados de Laboratorio (Marcadores Reactivos)</h5>
              <p className="text-[10px] mb-4 italic">Se ha detectado reactividad en las pruebas de tamizaje obligatorio para los siguientes patógenos:</p>

              <div className="border border-black p-4 bg-red-50">
                <ul className="list-disc list-inside space-y-2">
                  {reactiveMarkers.map(m => (
                    <li key={m} className="text-sm font-black text-red-700 uppercase tracking-wider">{m} - REACTIVO</li>
                  ))}
                </ul>
              </div>

              <div className="mt-4 text-[9px] text-justify leading-relaxed">
                <p><strong>Nota Técnica:</strong> La unidad ha sido segregada inmediatamente y trasladada al área de descarte bio-peligroso conforme al protocolo nacional. Se ha procedido a la citación del donante para la toma de muestra confirmatoria en el Laboratorio Central de Referencia en Salud Pública (LCRSP).</p>
              </div>
            </div>

            {/* Signature Section */}
            <div className="mt-20 flex justify-between px-10">
              <div className="text-center border-t border-black pt-2 w-64">
                <div className="text-[10px] font-bold">Firma del Tecnólogo Médico</div>
                <div className="text-[9px]">IDONEIDAD N°: 8823-TECH</div>
              </div>
              <div className="text-center border-t border-black pt-2 w-64">
                <div className="text-[10px] font-bold">Sello de la Institución</div>
              </div>
            </div>

            <div className="mt-auto pt-10 text-[8px] text-slate-400 text-center uppercase tracking-widest border-t border-slate-100">
              Documento Generado por PLATAFORMA-LIS • Sistema de Gestión de Medicina Transfusional
            </div>
          </div>
        </div>

        {/* Footer Guidance */}
        <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
          <div className="flex items-center gap-3 text-sm font-medium text-red-400">
            <AlertCircle size={20} />
            Este documento contiene información PII protegida por la Ley 81 de Panamá.
          </div>
          <div className="flex gap-4">
            <button
              onClick={onClose}
              className="px-6 py-2 text-slate-400 font-bold hover:text-white transition-colors"
            >
              Cerrar Vista Previa
            </button>
            <button
              onClick={() => {
                alert("Reporte Certificado y Guardado en Historial MINSA.");
                onClose();
              }}
              className="flex items-center gap-2 bg-red-600 text-white px-8 py-2 rounded-lg font-bold hover:bg-red-700 transition-all shadow-xl shadow-red-900/20"
            >
              <ShieldCheck size={18} />
              Certificar y Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EpidemiologicalReportModal;
