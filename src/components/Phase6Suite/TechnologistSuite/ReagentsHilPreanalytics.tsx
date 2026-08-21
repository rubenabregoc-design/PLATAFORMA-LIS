import React, { useState } from 'react';
import {
  Barcode,
  FlaskConical,
  XCircle,
  AlertTriangle,
  Layers,
  CheckCircle2,
  Search,
  RotateCcw,
  Sparkles,
  Calendar,
  Check,
  Filter,
  Eye,
  Camera,
  Info,
  Clock
} from 'lucide-react';

interface ReagentLotItem {
  id: string;
  reagentName: string;
  analyzer: string;
  catalogNumber: string;
  lotNumber: string;
  expirationDate: string;
  onBoardDaysRemaining: number;
  testsRemaining: number;
  maxTests: number;
  status: 'OPTIMO' | 'POR_VENCER' | 'AGOTADO';
}

const INITIAL_REAGENT_LOTS: ReagentLotItem[] = [
  {
    id: 'rg-1',
    reagentName: 'Glucosa HK Gen.3',
    analyzer: 'Cobas 6000 c501',
    catalogNumber: '04404483190',
    lotNumber: 'GLU-LOT-7811',
    expirationDate: '15/12/2026',
    onBoardDaysRemaining: 24,
    testsRemaining: 480,
    maxTests: 800,
    status: 'OPTIMO'
  },
  {
    id: 'rg-2',
    reagentName: 'Troponina I hs STAT',
    analyzer: 'Cobas e601 Inmuno',
    catalogNumber: '05092728190',
    lotNumber: 'TROP-LOT-9044',
    expirationDate: '10/09/2026',
    onBoardDaysRemaining: 4,
    testsRemaining: 35,
    maxTests: 200,
    status: 'POR_VENCER'
  },
  {
    id: 'rg-3',
    reagentName: 'Cellpack DCL Diluent',
    analyzer: 'Sysmex XN-1000',
    catalogNumber: 'CPD-901A',
    lotNumber: 'CPD-2026-88',
    expirationDate: '28/02/2027',
    onBoardDaysRemaining: 45,
    testsRemaining: 1850,
    maxTests: 2500,
    status: 'OPTIMO'
  },
  {
    id: 'rg-4',
    reagentName: 'Dade Actin FS TTPa',
    analyzer: 'Sysmex CS-2500',
    catalogNumber: 'B4218-1',
    lotNumber: 'TTP-LOT-4412',
    expirationDate: '01/10/2026',
    onBoardDaysRemaining: 7,
    testsRemaining: 80,
    maxTests: 500,
    status: 'OPTIMO'
  }
];

export const ReagentsHilPreanalytics: React.FC = () => {
  // Tube scanner state
  const [scannedBarcode, setScannedBarcode] = useState<string>('745009041');
  const [tubeVerified, setTubeVerified] = useState<boolean>(true);

  // HIL indices interactive selector
  const [hemolysisGrade, setHemolysisGrade] = useState<'0' | '1+' | '2+' | '3+' | '4+'>('2+');
  const [icterusGrade, setIcterusGrade] = useState<'0' | '1+' | '2+' | '3+' | '4+'>('0');
  const [lipemiaGrade, setLipemiaGrade] = useState<'0' | '1+' | '2+' | '3+' | '4+'>('1+');

  // Sample Rejection Wizard State
  const [isRejectModalOpen, setIsRejectModalOpen] = useState<boolean>(false);
  const [rejectReason, setRejectReason] = useState<string>('MUESTRA_COAGULADA');
  const [rejectNotes, setRejectNotes] = useState<string>('Presencia de microcoágulo visible en tubo con EDTA. Recuento plaquetario y leucocitario no viable.');
  const [requestResampling, setRequestResampling] = useState<boolean>(true);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [reagents, setReagents] = useState<ReagentLotItem[]>(INITIAL_REAGENT_LOTS);

  // Impact Matrix based on selected HIL
  const getHilImpacts = () => {
    const impacts: { analyte: string; effect: string; recommendation: string; severity: 'ALTO' | 'MODERADO' | 'LEVE' }[] = [];

    if (hemolysisGrade === '2+' || hemolysisGrade === '3+' || hemolysisGrade === '4+') {
      impacts.push({
        analyte: 'Potasio Sérico (K+)',
        effect: `Falso incremento severo por liberación de K+ intraeritrocitario (Hemólisis ${hemolysisGrade}).`,
        recommendation: 'Rechazar analito y solicitar nuevo tubo sin torniquete prolongado.',
        severity: 'ALTO'
      });
      impacts.push({
        analyte: 'Lactato Deshidrogenasa (LDH)',
        effect: 'Aumento falso de hasta 200% por contenido eritrocitario.',
        recommendation: 'No reportar valor cuantitativo.',
        severity: 'ALTO'
      });
      impacts.push({
        analyte: 'AST / GOT & Fósforo',
        effect: 'Elevación artefactual moderada.',
        recommendation: 'Adjuntar nota técnica de interferencia.',
        severity: 'MODERADO'
      });
    }

    if (lipemiaGrade === '2+' || lipemiaGrade === '3+' || lipemiaGrade === '4+') {
      impacts.push({
        analyte: 'Hemoglobina (Hb) en Analizador',
        effect: 'Falsa turbidez espectrofotométrica a 540nm.',
        recommendation: 'Reemplazo de plasma por solución salina o centrifugación a alta velocidad.',
        severity: 'ALTO'
      });
      impacts.push({
        analyte: 'Sodio y Cloro por ISE Indirecto',
        effect: 'Pseudohiponatremia por exclusión de volumen plasmático.',
        recommendation: 'Medir en analizador de gases con ISE directo.',
        severity: 'MODERADO'
      });
    }

    if (icterusGrade === '3+' || icterusGrade === '4+') {
      impacts.push({
        analyte: 'Creatinina (Método de Jaffé)',
        effect: 'Interferencia negativa por consumo de picrato alcalino.',
        recommendation: 'Utilizar método enzimático de Creatinina.',
        severity: 'MODERADO'
      });
    }

    return impacts;
  };

  const handleConfirmRejection = () => {
    setIsRejectModalOpen(false);
    setToastMsg(`✓ Muestra #${scannedBarcode} rechazada formalmente conforme a ISO 15189. Solicitud de re-toma STAT emitida.`);
    setTimeout(() => setToastMsg(null), 5000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500" id="reagents-hil-container">
      {/* Title Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="flex items-center space-x-4 relative z-10">
          <div className="w-14 h-14 bg-gradient-to-tr from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20">
            <FlaskConical className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl sm:text-2xl font-black text-white">Gestión de Reactivos, Lotes & Rechazo Preanalítico</h2>
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Módulo 5
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Matriz de interferencia HIL, estabilidad de reactivos a bordo y asistente de no conformidad preanalítica.
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center space-x-3 relative z-10">
          <button
            onClick={() => setIsRejectModalOpen(true)}
            className="px-5 py-2.5 bg-rose-500 hover:bg-rose-400 text-slate-950 font-black text-xs rounded-xl transition shadow-lg shadow-rose-500/20 flex items-center space-x-2 cursor-pointer"
          >
            <XCircle className="w-4 h-4" />
            <span>Rechazar Muestra No Conforme</span>
          </button>
        </div>
      </div>

      {toastMsg && (
        <div className="bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center justify-between text-xs font-bold animate-in fade-in border border-emerald-400/50">
          <div className="flex items-center space-x-2">
            <Check className="w-4 h-4" />
            <span>{toastMsg}</span>
          </div>
          <button onClick={() => setToastMsg(null)} className="text-emerald-200 hover:text-white font-bold cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* SECTION 1: TUBE SCANNER & HIL INTERFERENCE MATRIX */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* HIL Selector (1 Col) */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
            <Barcode className="w-5 h-5 text-teal-400" />
            <h3 className="text-sm font-black text-white uppercase tracking-wider">
              Verificador de Muestra & Índices HIL
            </h3>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Código de Tubo Primario</label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={scannedBarcode}
                  onChange={e => setScannedBarcode(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl font-mono text-teal-300 font-bold focus:outline-none focus:border-teal-500"
                />
                <button
                  onClick={() => setTubeVerified(true)}
                  className="px-3 py-2 bg-teal-500 text-slate-950 font-bold rounded-xl shrink-0 cursor-pointer"
                >
                  Verificar
                </button>
              </div>
            </div>

            {/* HIL Grades */}
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <div>
                <div className="flex justify-between text-[11px] font-bold text-rose-400 mb-1">
                  <span>Hemólisis (H):</span>
                  <span className="font-mono">{hemolysisGrade}</span>
                </div>
                <div className="grid grid-cols-5 gap-1">
                  {(['0', '1+', '2+', '3+', '4+'] as const).map(g => (
                    <button
                      key={g}
                      onClick={() => setHemolysisGrade(g)}
                      className={`py-1 rounded-lg font-mono font-bold text-xs transition cursor-pointer ${
                        hemolysisGrade === g ? 'bg-rose-500 text-white font-black' : 'bg-slate-950 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-bold text-amber-400 mb-1">
                  <span>Ictericia / Bilirrubina (I):</span>
                  <span className="font-mono">{icterusGrade}</span>
                </div>
                <div className="grid grid-cols-5 gap-1">
                  {(['0', '1+', '2+', '3+', '4+'] as const).map(g => (
                    <button
                      key={g}
                      onClick={() => setIcterusGrade(g)}
                      className={`py-1 rounded-lg font-mono font-bold text-xs transition cursor-pointer ${
                        icterusGrade === g ? 'bg-amber-500 text-slate-950 font-black' : 'bg-slate-950 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-bold text-slate-300 mb-1">
                  <span>Lipemia / Turbidez (L):</span>
                  <span className="font-mono">{lipemiaGrade}</span>
                </div>
                <div className="grid grid-cols-5 gap-1">
                  {(['0', '1+', '2+', '3+', '4+'] as const).map(g => (
                    <button
                      key={g}
                      onClick={() => setLipemiaGrade(g)}
                      className={`py-1 rounded-lg font-mono font-bold text-xs transition cursor-pointer ${
                        lipemiaGrade === g ? 'bg-slate-300 text-slate-950 font-black' : 'bg-slate-950 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* HIL Impact Assessment Matrix (2 Cols) */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-black text-white uppercase tracking-wider">
              Matriz de Impacto en Analitos (Guía CLSI EP07)
            </h3>
            <span className="text-[10px] bg-slate-950 text-amber-400 border border-amber-500/30 px-2.5 py-1 rounded-full font-mono">
              Evaluación Preanalítica
            </span>
          </div>

          {getHilImpacts().length > 0 ? (
            <div className="space-y-3">
              {getHilImpacts().map((imp, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    imp.severity === 'ALTO'
                      ? 'bg-rose-950/20 border-rose-500/40 text-rose-200'
                      : 'bg-amber-950/20 border-amber-500/40 text-amber-200'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-black text-sm text-white">{imp.analyte}</span>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                        imp.severity === 'ALTO' ? 'bg-rose-500 text-slate-950' : 'bg-amber-500 text-slate-950'
                      }`}>
                        Interferencia {imp.severity}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">{imp.effect}</p>
                    <p className="text-[11px] text-teal-300 font-bold">💡 Conducta: {imp.recommendation}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-950 rounded-2xl border border-slate-800 text-emerald-400 text-xs space-y-2">
              <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-400" />
              <div className="font-bold">Muestra con Índices HIL Óptimos (Sin Interferencia Significativa)</div>
              <p className="text-slate-400 text-[11px]">Todos los analitos pueden ser procesados e informados sin sesgo espectrofotométrico o celular.</p>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 2: REAGENT LOT & ON-BOARD STABILITY TRACKER */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
          <div className="p-3 bg-teal-500/10 text-teal-400 rounded-2xl border border-teal-500/20">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-black text-white">Control de Lotes & Estabilidad a Bordo en Analizadores</h3>
            <p className="text-xs text-slate-400">Seguimiento de determinaciones restantes y fechas límite de estabilidad a bordo (On-Board).</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {reagents.map(rg => {
            const percentRemaining = Math.round((rg.testsRemaining / rg.maxTests) * 100);

            return (
              <div key={rg.id} className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-teal-400 font-bold">{rg.analyzer}</span>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                      rg.status === 'POR_VENCER'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                        : 'bg-emerald-500/20 text-emerald-300'
                    }`}>
                      {rg.status === 'POR_VENCER' ? 'POR VENCER' : 'ACTIVO'}
                    </span>
                  </div>

                  <h4 className="text-xs font-black text-white mt-1">{rg.reagentName}</h4>
                  <div className="text-[10px] text-slate-400 font-mono">Lote: {rg.lotNumber}</div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>{rg.testsRemaining} / {rg.maxTests} Tests</span>
                    <span>{percentRemaining}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${percentRemaining < 25 ? 'bg-amber-500' : 'bg-teal-500'}`}
                      style={{ width: `${percentRemaining}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-1">
                    Estabilidad a bordo: <strong className="text-slate-300">{rg.onBoardDaysRemaining} días</strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL: SAMPLE REJECTION WIZARD */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 animate-in fade-in">
            <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
              <div className="p-3 bg-rose-500/20 text-rose-400 rounded-2xl">
                <XCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">Rechazo Preanalítico de Muestra (ISO 15189)</h3>
                <p className="text-xs text-slate-400">Tubo #{scannedBarcode} • Registro de No Conformidad</p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Causal Estandarizada de Rechazo</label>
                <select
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold focus:outline-none focus:border-rose-500"
                >
                  <option value="MUESTRA_COAGULADA">Muestra Coagulada (Microcoágulo en Tubo Hematológico)</option>
                  <option value="VOLUMEN_INSUFICIENTE">Volumen Insuficiente (QNS - Ratio Anticoagulante Alterado)</option>
                  <option value="HEMOLISIS_SEVERA">Hemólisis Severa (Grado 4+ / Suero Rojo Oscuro)</option>
                  <option value="TUBO_INADECUADO">Tubo o Anticoagulante Inadecuado</option>
                  <option value="ROTULACION_ERRONEA">Discrepancia en Rotulación / Datos Incompletos</option>
                  <option value="CADENA_FRIO">Quiebre de Cadena de Frío / Transporte Excesivo</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Detalle Técnico de la No Conformidad</label>
                <textarea
                  rows={3}
                  value={rejectNotes}
                  onChange={e => setRejectNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="chk-resample"
                  checked={requestResampling}
                  onChange={e => setRequestResampling(e.target.checked)}
                  className="w-4 h-4 text-teal-500 rounded border-slate-700 bg-slate-900"
                />
                <label htmlFor="chk-resample" className="text-xs text-slate-200 font-bold cursor-pointer">
                  Generar Orden Automática de Re-Toma de Muestra STAT a Flebotomía / Enfermería
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
              <button
                onClick={() => setIsRejectModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmRejection}
                className="px-5 py-2 bg-rose-500 hover:bg-rose-400 text-slate-950 font-black rounded-xl text-xs shadow-lg shadow-rose-500/20 cursor-pointer flex items-center space-x-1.5"
              >
                <XCircle className="w-4 h-4" />
                <span>Emitir Acta de Rechazo Preanalítico</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
