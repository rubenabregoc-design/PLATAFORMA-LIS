import React, { useState } from 'react';
import {
  FileText,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Printer,
  ShieldCheck,
  Eye,
  Activity,
  Layers,
  Sparkles,
  Download,
  X,
  Maximize2,
  RotateCw,
  Sun,
  Contrast,
  ZoomIn,
  Zap,
  Sliders
} from 'lucide-react';

export interface RadiologyWorklistItem {
  id: string;
  accessionNumber: string; // e.g. "RAD-2026-9901"
  patientName: string;
  nationalId: string;
  modality: 'RX_TORAX' | 'TAC_CRANEO' | 'RMN_CEREBRAL' | 'ULTRASONIDO_ABDOMINAL' | 'MAMOGRAFIA';
  modalityName: string;
  orderingDoctor: string;
  studyDate: string;
  urgency: 'STAT' | 'RUTINA';
  status: 'PENDIENTE' | 'EN_PROCESO_DICOM' | 'INFORMADO';
  radiologistName?: string;
  findingsReport?: string;
  dicomSeriesCount: number;
}

const INITIAL_WORKLIST: RadiologyWorklistItem[] = [
  {
    id: 'rad-101',
    accessionNumber: 'RAD-2026-0812',
    patientName: 'Ríos, Gonzalo A.',
    nationalId: '8-745-1290',
    modality: 'RX_TORAX',
    modalityName: 'Radiografía de Tórax PA y Lateral',
    orderingDoctor: 'Dr. Roberto Eisenmann (Medicina Interna)',
    studyDate: '2026-08-21 09:30',
    urgency: 'STAT',
    status: 'INFORMADO',
    radiologistName: 'Dr. Fernando Arango (Radiólogo - Reg. R-4410)',
    findingsReport: 'Campos pulmonares claros sin infiltrados ni consolidaciones activas. Silueta cardiaca de tamaño y configuración normal. Ángulos costofrénicos libres. Conclusión: Estudio de Tórax sin hallazgos pleuropulmonares agudos.',
    dicomSeriesCount: 2
  },
  {
    id: 'rad-102',
    accessionNumber: 'RAD-2026-0815',
    patientName: 'Pinzón Varela, Gabriela',
    nationalId: '8-812-4432',
    modality: 'TAC_CRANEO',
    modalityName: 'Tomografía Axial Computarizada de Cráneo Simple',
    orderingDoctor: 'Dra. Carmen Boyd (Urgencias)',
    studyDate: '2026-08-21 10:15',
    urgency: 'STAT',
    status: 'EN_PROCESO_DICOM',
    dicomSeriesCount: 120
  },
  {
    id: 'rad-103',
    accessionNumber: 'RAD-2026-0818',
    patientName: 'Mendoza, Alejandro',
    nationalId: 'PE-982103',
    modality: 'ULTRASONIDO_ABDOMINAL',
    modalityName: 'Ultrasonido Abdominal Superior e Inferior',
    orderingDoctor: 'Dr. Roberto Icaza (Gastroenterología)',
    studyDate: '2026-08-20 14:00',
    urgency: 'RUTINA',
    status: 'INFORMADO',
    radiologistName: 'Dra. Patricia Villarreal (Radiología - Reg. R-2011)',
    findingsReport: 'Hígado de ecogenicidad normal, tamaño conservado sin lesiones focales. Vesícula biliar de paredes delgadas sin litiasis visible. Vía biliar de calibre conservado. Riñones de morfología y tamaño normal.',
    dicomSeriesCount: 35
  }
];

export const RisPacsRadiologyStudio: React.FC = () => {
  const [worklist, setWorklist] = useState<RadiologyWorklistItem[]>(INITIAL_WORKLIST);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModalityFilter, setSelectedModalityFilter] = useState('ALL');
  const [selectedStudy, setSelectedProcedure] = useState<RadiologyWorklistItem | null>(null);
  const [isDicomViewerOpen, setIsDicomViewerOpen] = useState(false);
  const [reportText, setReportText] = useState('');

  const filteredWorklist = worklist.filter(item => {
    const matchesSearch =
      item.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.nationalId.includes(searchTerm) ||
      item.accessionNumber.includes(searchTerm);
    const matchesModality = selectedModalityFilter === 'ALL' || item.modality === selectedModalityFilter;
    return matchesSearch && matchesModality;
  });

  const handleSaveReport = () => {
    if (!selectedStudy || !reportText.trim()) return;
    setWorklist(prev =>
      prev.map(item =>
        item.id === selectedStudy.id
          ? {
              ...item,
              status: 'INFORMADO',
              radiologistName: 'Dr. Fernando Arango (Radiólogo Colegiado)',
              findingsReport: reportText
            }
          : item
      )
    );
    setSelectedProcedure(null);
    setReportText('');
    alert('¡Informe Radiológico guardado y firmado digitalmente en el Expediente EHR!');
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-800/40 p-6 sm:p-8 rounded-3xl text-white shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center space-x-2 text-xs font-bold text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20 mb-2">
            <Layers className="w-3.5 h-3.5" />
            <span>HIS • Radiología RIS & Visor PACS DICOM</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Estación de Imágenes Diagnósticas DICOM
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            Lista de trabajo radiológica (Worklist DICOM), visor de series tomográficas/rayos X e informes médicos enlazados al Expediente Clínico EHR.
          </p>
        </div>

        <div className="flex items-center space-x-3 bg-slate-950/80 border border-slate-800 p-4 rounded-2xl text-xs">
          <ShieldCheck className="w-8 h-8 text-emerald-400 shrink-0" />
          <div>
            <div className="font-bold text-white">DICOM 3.0 & HL7 Compliant</div>
            <div className="text-slate-400 text-[11px]">Integración PACS Hospitalaria</div>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar paciente, cédula o N° Accession DICOM..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:border-indigo-500 outline-none font-sans"
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto overflow-x-auto pb-1">
          <Filter className="w-4 h-4 text-slate-500 shrink-0" />
          {['ALL', 'RX_TORAX', 'TAC_CRANEO', 'ULTRASONIDO_ABDOMINAL'].map(mod => (
            <button
              key={mod}
              onClick={() => setSelectedModalityFilter(mod)}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase transition cursor-pointer whitespace-nowrap ${
                selectedModalityFilter === mod
                  ? 'bg-indigo-600 text-white shadow'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {mod === 'ALL' ? 'Todas las Modalidades' : mod.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Worklist Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800 uppercase text-[10px] tracking-wider">
              <th className="p-4">Accession DICOM</th>
              <th className="p-4">Paciente / Cédula</th>
              <th className="p-4">Estudio & Modalidad</th>
              <th className="p-4">Médico Solicitante</th>
              <th className="p-4 text-center">Imágenes DICOM</th>
              <th className="p-4 text-center">Estado</th>
              <th className="p-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {filteredWorklist.map(item => (
              <tr key={item.id} className="hover:bg-slate-800/40 transition">
                <td className="p-4 font-mono font-bold text-indigo-400">{item.accessionNumber}</td>
                <td className="p-4">
                  <p className="font-bold text-white">{item.patientName}</p>
                  <p className="text-[11px] text-slate-400 font-mono">{item.nationalId}</p>
                </td>
                <td className="p-4">
                  <p className="font-bold text-slate-200">{item.modalityName}</p>
                  <span className="text-[10px] text-slate-500 font-mono">{item.studyDate}</span>
                </td>
                <td className="p-4 text-slate-300">{item.orderingDoctor}</td>
                <td className="p-4 text-center font-mono text-slate-300">
                  <span className="bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-lg">
                    {item.dicomSeriesCount} Cortes
                  </span>
                </td>
                <td className="p-4 text-center">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                    item.status === 'INFORMADO'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    {item.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="p-4 text-right space-x-2">
                  <button
                    onClick={() => {
                      setSelectedProcedure(item);
                      setIsDicomViewerOpen(true);
                    }}
                    className="bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white px-3 py-1.5 rounded-lg font-bold text-xs transition cursor-pointer border border-indigo-500/30"
                  >
                    Visor DICOM PACS
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL: DICOM VIEWER & RADIOLOGY REPORT */}
      {isDicomViewerOpen && selectedStudy && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Header Bar */}
            <div className="bg-slate-950 p-4 border-b border-slate-800 flex justify-between items-center text-white">
              <div>
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <Layers className="text-indigo-400" size={18} />
                  Visor Radiológico DICOM 3.0 — {selectedStudy.modalityName}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Accession N°: <span className="font-mono text-indigo-300">{selectedStudy.accessionNumber}</span> • Paciente: <strong className="text-white">{selectedStudy.patientName}</strong> ({selectedStudy.nationalId})
                </p>
              </div>
              <button
                onClick={() => setIsDicomViewerOpen(false)}
                className="text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Viewer Body: DICOM Canvas Mockup (Left) + Report Editor (Right) */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 overflow-y-auto bg-slate-950">
              {/* Simulated DICOM Image Viewport */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden min-h-[350px]">
                <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-2">
                  <span>Serie 1 / 2 • Corte #12</span>
                  <div className="flex items-center gap-2">
                    <button className="p-1 hover:bg-slate-800 rounded text-indigo-300"><Sun size={14} /></button>
                    <button className="p-1 hover:bg-slate-800 rounded text-indigo-300"><Contrast size={14} /></button>
                    <button className="p-1 hover:bg-slate-800 rounded text-indigo-300"><ZoomIn size={14} /></button>
                  </div>
                </div>

                {/* DICOM Graphic Representation */}
                <div className="my-auto text-center space-y-3 py-8">
                  <div className="w-48 h-48 mx-auto bg-slate-950 rounded-2xl border border-indigo-500/30 flex items-center justify-center relative overflow-hidden shadow-2xl">
                    <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 via-transparent to-teal-500/10"></div>
                    <Layers className="w-20 h-20 text-indigo-500/40 animate-pulse" />
                    <span className="absolute bottom-2 text-[10px] font-mono text-indigo-300 bg-slate-950/80 px-2 py-0.5 rounded border border-indigo-500/30">
                      Corte Axial DICOM 512x512
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Visor compatible con estándares DICOM WADO / Web PACS
                  </p>
                </div>

                <div className="text-[10px] font-mono text-slate-500 flex justify-between border-t border-slate-800 pt-2">
                  <span>Matriz: 512x512</span>
                  <span>Grosor Corte: 2.5 mm</span>
                </div>
              </div>

              {/* Radiologist Report Form */}
              <div className="space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <FileText className="text-emerald-400" size={16} />
                    Informe Radiológico Diagnóstico
                  </h4>

                  {selectedStudy.findingsReport ? (
                    <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-2 text-xs">
                      <p className="font-bold text-emerald-400">Informe Registrado y Firmado:</p>
                      <p className="text-slate-300 leading-relaxed font-sans">{selectedStudy.findingsReport}</p>
                      <p className="text-[10px] text-slate-500 pt-2 border-t border-slate-800">
                        Radiólogo: <strong className="text-slate-300">{selectedStudy.radiologistName}</strong>
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 text-xs">
                      <label className="block text-slate-300 font-medium">Redactar Hallazgos & Conclusión Radiológica</label>
                      <textarea
                        rows={8}
                        value={reportText}
                        onChange={e => setReportText(e.target.value)}
                        placeholder="Describir estructura ósea, parénquima, silueta mediastínica/cardíaca o hallazgos tomográficos..."
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white focus:border-indigo-500 outline-none font-sans"
                      />
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    onClick={() => setIsDicomViewerOpen(false)}
                    className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Cerrar
                  </button>
                  {!selectedStudy.findingsReport && (
                    <button
                      onClick={handleSaveReport}
                      disabled={!reportText.trim()}
                      className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-lg shadow-emerald-900/30"
                    >
                      Guardar & Firmar Informe
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RisPacsRadiologyStudio;
