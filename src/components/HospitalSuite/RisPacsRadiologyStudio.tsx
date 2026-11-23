import { DicomPacsStudioPro } from './DicomPacsStudioPro';
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
    patientName: 'Juan Carlos Samudio González',
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
    window.dispatchEvent(
      new CustomEvent('lis-global-toast', {
        detail: {
          title: 'Informe Radiológico Firmado',
          message: '¡Informe Radiológico guardado y firmado digitalmente en el Expediente EHR!',
          type: 'success'
        }
      })
    );
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
                  <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-[10px] font-bold uppercase whitespace-nowrap tracking-wider border ${
                    item.status === 'INFORMADO'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-xs'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-xs'
                  }`}>
                    {item.status === 'EN_PROCESO_DICOM' ? 'EN PROCESO DICOM' : item.status.replaceAll('_', ' ')}
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

      {/* ESTACIÓN PACS PRO MODAL / FULLSCREEN VIEWER */}
      {isDicomViewerOpen && selectedStudy && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-7xl max-h-[96vh] flex flex-col">
            <DicomPacsStudioPro
              accessionNumber={selectedStudy.accessionNumber}
              patientName={selectedStudy.patientName}
              patientNationalId={selectedStudy.nationalId}
              modalityName={selectedStudy.modalityName}
              totalSlices={selectedStudy.dicomSeriesCount}
              initialReport={selectedStudy.findingsReport}
              radiologistName={selectedStudy.radiologistName}
              onClose={() => setIsDicomViewerOpen(false)}
              onSaveReport={(reportText) => {
                setWorklist(prev =>
                  prev.map(item =>
                    item.id === selectedStudy.id
                      ? {
                          ...item,
                          status: 'INFORMADO',
                          radiologistName: 'Dr. Fernando Arango (Radiólogo Especialista • Reg. R-4410)',
                          findingsReport: reportText
                        }
                      : item
                  )
                );
                window.dispatchEvent(
                  new CustomEvent('lis-global-toast', {
                    detail: {
                      title: 'Informe Radiológico Certificado',
                      message: 'Informe del estudio ' + selectedStudy.accessionNumber + ' guardado y firmado en el Expediente EHR.',
                      type: 'success'
                    }
                  })
                );
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default RisPacsRadiologyStudio;
