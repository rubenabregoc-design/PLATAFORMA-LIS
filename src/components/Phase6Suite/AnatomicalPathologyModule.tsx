import React, { useState } from 'react';
import {
  Microscope,
  FileSpreadsheet,
  Layers,
  Award,
  CheckCircle2,
  AlertCircle,
  Plus,
  RotateCw,
  Search,
  Filter,
  FileText,
  Eye,
  Camera,
  ShieldCheck,
  User,
  Calendar,
  Sparkles,
  PenTool,
  Printer
} from 'lucide-react';

export interface PathologyCase {
  id: string;
  caseNumber: string; // e.g. "PAT-2026-0412"
  patientName: string;
  patientAge: number;
  sampleType: 'BIOPSIA' | 'CITOLOGIA_PAP' | 'PIEZA_QUIRURGICA' | 'PAAF';
  organ: string; // e.g. "Mama Izquierda", "Cérvix", "Piel Espalda"
  cassetteCount: number;
  slideCount: number;
  stains: string[]; // e.g. ["H&E", "Inmunohistoquímica HER2", "Ki-67"]
  pathologist: string;
  macroscopicDesc: string;
  microscopicDesc: string;
  diagnosis: string;
  status: 'INGRESO_MUESTRA' | 'EN_CORTE' | 'LECTURA_PATOLOGO' | 'FIRMADO_VALIDADO';
  receivedDate: string;
}

const INITIAL_CASES: PathologyCase[] = [
  {
    id: 'pat-101',
    caseNumber: 'PAT-2026-0412',
    patientName: 'Sra. Elena de Icaza',
    patientAge: 52,
    sampleType: 'BIOPSIA',
    organ: 'Mama Izquierda (Cuadrante Superior Externo)',
    cassetteCount: 3,
    slideCount: 6,
    stains: ['H&E', 'Her2/neu', 'Receptores Estrógeno (ER)'],
    pathologist: 'Dra. María Elena Abrego (Patóloga)',
    macroscopicDesc: 'Tres fragmentos irregulares de tejido fibroglandular que miden en conjunto 1.8 x 1.2 x 0.5 cm, de consistencia firme y color blanquecino.',
    microscopicDesc: 'Los cortes histológicos muestran proliferación epitelial atípica dispuesta en nidos y cordones infiltrantes en estroma desmoplásico.',
    diagnosis: 'CARCINOMA DUCTAL INFILTRANTE GRADO II (SBR 7/9). Márgenes de resección libres de neoplasia.',
    status: 'FIRMADO_VALIDADO',
    receivedDate: '2026-08-05'
  },
  {
    id: 'pat-102',
    caseNumber: 'PAT-2026-0415',
    patientName: 'Lic. Ana Lucía Morales',
    patientAge: 38,
    sampleType: 'CITOLOGIA_PAP',
    organ: 'Cérvix Uterino (Exocérvix & Endocérvix)',
    cassetteCount: 0,
    slideCount: 2,
    stains: ['Papanicolaou Modificado'],
    pathologist: 'Dr. Carlos Mendoza (Patólogo)',
    macroscopicDesc: 'Frotis cito-ginecológico extendido en dos láminas portaobjetos en fijador citológico.',
    microscopicDesc: 'Células superficiales e intermedias sin atipias nucleares. Escasa reacción inflamatoria leucocitaria. Microbiota bacilar normal.',
    diagnosis: 'NEGATIVO PARA LESIÓN INTRAEPITELIAL O MALIGNIDAD (NILM). Categoría Bethesda 2014.',
    status: 'FIRMADO_VALIDADO',
    receivedDate: '2026-08-08'
  },
  {
    id: 'pat-103',
    caseNumber: 'PAT-2026-0420',
    patientName: 'Sr. Roberto Guardia',
    patientAge: 61,
    sampleType: 'PIEZA_QUIRURGICA',
    organ: 'Vesícula Biliar (Colecistectomía)',
    cassetteCount: 2,
    slideCount: 4,
    stains: ['H&E'],
    pathologist: 'Dra. María Elena Abrego (Patóloga)',
    macroscopicDesc: 'Pieza quirúrgica vesicular de 8.5 x 3.0 cm con presencia de múltiples litos facetados amarillentos en luz.',
    microscopicDesc: 'Pared vesicular engrosada con infiltrado inflamatorio mononuclear en lámina propia y senos de Rokitansky-Aschoff.',
    diagnosis: 'COLECISTITIS CRÓNICA COLELITIÁSICA.',
    status: 'LECTURA_PATOLOGO',
    receivedDate: '2026-08-11'
  }
];

export const AnatomicalPathologyModule: React.FC = () => {
  const [cases, setCases] = useState<PathologyCase[]>(INITIAL_CASES);
  const [selectedCase, setSelectedCase] = useState<PathologyCase | null>(INITIAL_CASES[0]);
  const [isNewCaseModalOpen, setIsNewCaseModalOpen] = useState<boolean>(false);

  // Form Fields
  const [formPatientName, setFormPatientName] = useState<string>('Sr. Gustavo Varela');
  const [formAge, setFormAge] = useState<number>(48);
  const [formSampleType, setFormSampleType] = useState<'BIOPSIA' | 'CITOLOGIA_PAP' | 'PIEZA_QUIRURGICA' | 'PAAF'>('BIOPSIA');
  const [formOrgan, setFormOrgan] = useState<string>('Piel Espalda (Lesión Pigmentada)');
  const [formCassetteCount, setFormCassetteCount] = useState<number>(1);
  const [formStains, setFormStains] = useState<string>('H&E, Melan-A');
  const [formMacro, setFormMacro] = useState<string>('Elipse de piel de 1.2 x 0.8 cm con pápula hiperpigmentada central.');

  const handleCreateCase = (e: React.FormEvent) => {
    e.preventDefault();
    const newCase: PathologyCase = {
      id: `pat-${Date.now()}`,
      caseNumber: `PAT-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      patientName: formPatientName,
      patientAge: formAge,
      sampleType: formSampleType,
      organ: formOrgan,
      cassetteCount: formCassetteCount,
      slideCount: formCassetteCount * 2,
      stains: formStains.split(',').map(s => s.trim()),
      pathologist: 'Dra. María Elena Abrego (Patóloga)',
      macroscopicDesc: formMacro,
      microscopicDesc: 'En procesamiento histológico y tinción...',
      diagnosis: 'EN ESTUDIO HISTOPATOLÓGICO.',
      status: 'INGRESO_MUESTRA',
      receivedDate: new Date().toISOString().split('T')[0]
    };

    setCases(prev => [newCase, ...prev]);
    setSelectedCase(newCase);
    setIsNewCaseModalOpen(false);
    alert('¡Caso Histopatológico / Citológico ingresado en el LIS!');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-950 border border-indigo-500/30 p-6 sm:p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden backdrop-blur-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="text-teal-400 text-xs font-black uppercase tracking-[0.2em] mb-2 flex items-center space-x-2">
              <Microscope className="w-4 h-4 text-teal-400 animate-pulse" />
              <span>Anatomía Patológica, Citología e Histopatología LIS</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Gestión de Biopsias, Citologías & Diagnóstico Patológico
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-2 max-w-2xl leading-relaxed">
              Trazabilidad completa de casetes de parafina, láminas histológicas, panel de inmunohistoquímica, descripción macro/microscópica y dictamen diagnóstico firmado.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsNewCaseModalOpen(true)}
              className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-black px-5 py-3 rounded-2xl text-xs transition shadow-xl flex items-center space-x-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Ingresar Nuevo Caso Histológico</span>
            </button>
          </div>
        </div>

        {/* Counter KPI Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-white/10">
          <div className="bg-slate-950/60 border border-white/5 p-4 rounded-2xl space-y-1">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Casos del Mes</div>
            <div className="text-2xl font-black font-mono text-white">{cases.length} Casos</div>
            <div className="text-[10px] text-teal-400 font-bold">Biopsias & Citologías</div>
          </div>

          <div className="bg-slate-950/60 border border-white/5 p-4 rounded-2xl space-y-1">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Casetes de Parafina</div>
            <div className="text-2xl font-black font-mono text-indigo-300">
              {cases.reduce((acc, c) => acc + c.cassetteCount, 0)} Bloques
            </div>
            <div className="text-[10px] text-indigo-400 font-bold">Inclusión en Talla</div>
          </div>

          <div className="bg-slate-950/60 border border-white/5 p-4 rounded-2xl space-y-1">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">En Inmunohistoquímica</div>
            <div className="text-2xl font-black font-mono text-amber-400">2 Casos</div>
            <div className="text-[10px] text-amber-400 font-bold">HER2 / ER / Ki-67</div>
          </div>

          <div className="bg-slate-950/60 border border-white/5 p-4 rounded-2xl space-y-1">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Informes Firmados</div>
            <div className="text-2xl font-black font-mono text-emerald-400">
              {cases.filter(c => c.status === 'FIRMADO_VALIDADO').length} Informes
            </div>
            <div className="text-[10px] text-emerald-400 font-bold">Listos para Entrega</div>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Cases List Sidebar */}
        <div className="lg:col-span-1 bg-slate-900/90 border border-slate-800 p-5 rounded-3xl shadow-xl space-y-3">
          <h3 className="font-bold text-white text-sm flex items-center space-x-2 border-b border-slate-800 pb-3">
            <FileText className="w-4 h-4 text-teal-400" />
            <span>Casos en Proceso Histopatológico</span>
          </h3>

          <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
            {cases.map((c) => (
              <div
                key={c.id}
                onClick={() => setSelectedCase(c)}
                className={`p-4 rounded-2xl border transition cursor-pointer space-y-2 ${
                  selectedCase?.id === c.id
                    ? 'bg-slate-800 border-teal-500 shadow-lg ring-1 ring-teal-500/30'
                    : 'bg-slate-950/80 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-teal-300 font-extrabold text-xs">{c.caseNumber}</span>
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${
                    c.status === 'FIRMADO_VALIDADO'
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                      : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                  }`}>
                    {c.status}
                  </span>
                </div>

                <div className="font-bold text-white text-xs">{c.patientName} ({c.patientAge} a)</div>
                <div className="text-[11px] text-slate-400 font-medium truncate">{c.organ}</div>

                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-800/60 font-mono">
                  <span>📅 {c.receivedDate}</span>
                  <span>📦 {c.cassetteCount} Casetes</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pathology Detail & Report Preview Panel */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 p-6 sm:p-8 rounded-3xl shadow-xl space-y-6">
          {selectedCase ? (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                <div>
                  <div className="text-xs text-teal-400 font-mono font-bold flex items-center space-x-2">
                    <span>N° Registro: {selectedCase.caseNumber}</span>
                    <span>•</span>
                    <span>Tipo: {selectedCase.sampleType}</span>
                  </div>
                  <h2 className="text-xl font-black text-white mt-1">{selectedCase.patientName}</h2>
                  <div className="text-xs text-slate-400 font-medium">{selectedCase.organ}</div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => alert(`Imprimiendo Informe Diagnóstico Patológico N° ${selectedCase.caseNumber}...`)}
                    className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-black px-4 py-2 rounded-xl text-xs flex items-center space-x-2 shadow cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Imprimir Informe</span>
                  </button>
                </div>
              </div>

              {/* Sample Tracking Chips */}
              <div className="grid grid-cols-3 gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs">
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">Bloques de Parafina:</span>
                  <span className="font-mono text-white font-bold">{selectedCase.cassetteCount} Casetes</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">Láminas Histológicas:</span>
                  <span className="font-mono text-white font-bold">{selectedCase.slideCount} Láminas</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">Tinciones Solicitadas:</span>
                  <span className="font-bold text-teal-300">{selectedCase.stains.join(', ')}</span>
                </div>
              </div>

              {/* Macroscopic Description */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                  <Eye className="w-3.5 h-3.5 text-teal-400" />
                  <span>Descripción Macroscópica:</span>
                </h4>
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs text-slate-200 leading-relaxed font-sans">
                  {selectedCase.macroscopicDesc}
                </div>
              </div>

              {/* Microscopic Description */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                  <Microscope className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Descripción Microscópica:</span>
                </h4>
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs text-slate-200 leading-relaxed font-sans">
                  {selectedCase.microscopicDesc}
                </div>
              </div>

              {/* Diagnostic Conclusion */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-black uppercase tracking-wider text-teal-400 flex items-center space-x-1.5">
                  <Award className="w-3.5 h-3.5 text-teal-400" />
                  <span>DICTAMEN DIAGNÓSTICO ANATOMOPATOLÓGICO FINAL:</span>
                </h4>
                <div className="bg-teal-950/30 border border-teal-500/40 p-5 rounded-2xl text-sm font-extrabold text-teal-200 leading-relaxed">
                  {selectedCase.diagnosis}
                </div>
              </div>

              {/* Pathologist Signature Banner */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <div>
                  <span className="font-bold text-slate-200 block">{selectedCase.pathologist}</span>
                  <span className="text-[10px] text-slate-500">Especialista en Anatomía Patológica e Histología</span>
                </div>

                <div className="flex items-center space-x-1 text-emerald-400 font-black text-xs bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/30">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Firma Digital & QR ISO 15189</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-20 text-slate-500">Seleccione un caso para ver los detalles histopatológicos.</div>
          )}
        </div>
      </div>

      {/* New Case Modal */}
      {isNewCaseModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="font-black text-white text-lg flex items-center space-x-2">
                <Microscope className="w-5 h-5 text-teal-400" />
                <span>Ingresar Muestra Histopatológica</span>
              </h3>
              <button onClick={() => setIsNewCaseModalOpen(false)} className="text-slate-400 hover:text-white text-xl font-bold p-1 cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleCreateCase} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Nombre Paciente:</label>
                  <input
                    type="text"
                    value={formPatientName}
                    onChange={(e) => setFormPatientName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Edad:</label>
                  <input
                    type="number"
                    value={formAge}
                    onChange={(e) => setFormAge(parseInt(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Tipo de Estudio:</label>
                  <select
                    value={formSampleType}
                    onChange={(e) => setFormSampleType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-bold"
                  >
                    <option value="BIOPSIA">Biopsia de Tejido</option>
                    <option value="CITOLOGIA_PAP">Citología Papanicolaou</option>
                    <option value="PIEZA_QUIRURGICA">Pieza Quirúrgica Resecada</option>
                    <option value="PAAF">Aspiración con Aguja Fina (PAAF)</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-300 block mb-1">N° Casetes Bloques:</label>
                  <input
                    type="number"
                    value={formCassetteCount}
                    onChange={(e) => setFormCassetteCount(parseInt(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Órgano / Región Anatómica:</label>
                <input
                  type="text"
                  value={formOrgan}
                  onChange={(e) => setFormOrgan(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Tinciones Solicitadas:</label>
                <input
                  type="text"
                  value={formStains}
                  onChange={(e) => setFormStains(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Descripción Macroscópica Inicial:</label>
                <textarea
                  value={formMacro}
                  onChange={(e) => setFormMacro(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white h-20"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end space-x-3">
                <button type="button" onClick={() => setIsNewCaseModalOpen(false)} className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold">Cancelar</button>
                <button type="submit" className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black">Crear Registro Patológico</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
