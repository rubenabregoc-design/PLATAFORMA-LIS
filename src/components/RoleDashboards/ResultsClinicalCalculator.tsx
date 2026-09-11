import React, { useState, useEffect } from 'react';
import { Order, Patient, TestResult } from '../../types';
import {
  Calculator,
  Zap,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Activity,
  Layers,
  FileSpreadsheet,
  PlusCircle,
  HelpCircle,
  Info
} from 'lucide-react';

interface ResultsClinicalCalculatorProps {
  order: Order;
  patient: Patient;
  results: TestResult[];
  onAddCalculatedResult?: (paramName: string, value: string, unit: string, refRange: string) => void;
}

export const ResultsClinicalCalculator: React.FC<ResultsClinicalCalculatorProps> = ({
  order,
  patient,
  results,
  onAddCalculatedResult
}) => {
  const [activeFormula, setActiveFormula] = useState<'ckd' | 'anion' | 'osm' | 'homa' | 'bili'>('ckd');
  const [copiedNote, setCopiedNote] = useState<string | null>(null);

  // Auto-fill from existing test results if found
  const findResultVal = (query: string): number => {
    const found = results.find(r =>
      (r.parameterName || '').toLowerCase().includes(query.toLowerCase()) ||
      (r.parameterCode || '').toLowerCase().includes(query.toLowerCase())
    );
    if (found && found.numericValue !== undefined) {
      return found.numericValue;
    }
    if (found && !isNaN(parseFloat(found.value))) {
      return parseFloat(found.value);
    }
    return 0;
  };

  // 1. CKD-EPI 2021 Variables
  const initialCreatinine = findResultVal('creatina') || findResultVal('crea') || 1.05;
  const [creatinine, setCreatinine] = useState(initialCreatinine.toString());
  const age = patient.dob
    ? Math.max(18, Math.floor((Date.now() - new Date(patient.dob).getTime()) / (365.25 * 24 * 3600 * 1000)))
    : 38;
  const gender = patient.gender || 'F';

  // Calculate CKD-EPI 2021
  const calculateCKDEPI = (): { egfr: number; stage: string } => {
    const scr = parseFloat(creatinine) || 1.0;
    const isFemale = gender === 'F';
    const kappa = isFemale ? 0.7 : 0.9;
    const alpha = isFemale ? -0.241 : -0.302;
    const genderFactor = isFemale ? 1.012 : 1.0;

    const minPart = Math.min(scr / kappa, 1);
    const maxPart = Math.max(scr / kappa, 1);

    const egfr = 142 * Math.pow(minPart, alpha) * Math.pow(maxPart, -1.200) * Math.pow(0.9938, age) * genderFactor;
    const rounded = Math.round(egfr * 10) / 10;

    let stage = 'G1 (Normal o Elevado)';
    if (rounded < 15) stage = 'G5 (Falla Renal Terminal)';
    else if (rounded < 30) stage = 'G4 (Severamente Disminuido)';
    else if (rounded < 45) stage = 'G3b (Moderada a Severamente Disminuido)';
    else if (rounded < 60) stage = 'G3a (Leve a Moderadamente Disminuido)';
    else if (rounded < 90) stage = 'G2 (Levemente Disminuido)';

    return { egfr: rounded, stage };
  };

  // 2. Anion Gap Variables
  const [naVal, setNaVal] = useState((findResultVal('sodio') || findResultVal('na') || 141).toString());
  const [clVal, setClVal] = useState((findResultVal('cloro') || findResultVal('cl') || 102).toString());
  const [hco3Val, setHco3Val] = useState((findResultVal('bicarbonato') || findResultVal('co2') || 24).toString());

  const calculateAnionGap = (): { gap: number; interp: string } => {
    const na = parseFloat(naVal) || 140;
    const cl = parseFloat(clVal) || 102;
    const hco3 = parseFloat(hco3Val) || 24;
    const gap = Math.round((na - (cl + hco3)) * 10) / 10;

    let interp = 'Normal (8.0 - 16.0 mEq/L)';
    if (gap > 16) interp = 'Brecha Aniónica Elevada (Posible acidosis metabólica)';
    else if (gap < 8) interp = 'Brecha Aniónica Disminuida (Hipoalbuminemia o error analítico)';

    return { gap, interp };
  };

  // 3. Osmolarity Variables
  const [gluVal, setGluVal] = useState((findResultVal('glucosa') || findResultVal('glu') || 95).toString());
  const [bunVal, setBunVal] = useState((findResultVal('urea') || findResultVal('bun') || 14).toString());

  const calculateOsmolarity = (): { osm: number; interp: string } => {
    const na = parseFloat(naVal) || 140;
    const glu = parseFloat(gluVal) || 90;
    const bun = parseFloat(bunVal) || 15;
    const osm = Math.round((2 * na + glu / 18 + bun / 2.8) * 10) / 10;

    let interp = 'Normal (275 - 295 mOsm/kg)';
    if (osm > 295) interp = 'Hiperosmolaridad plasmática';
    else if (osm < 275) interp = 'Hipoosmolaridad plasmática';

    return { osm, interp };
  };

  // 4. HOMA-IR Variables
  const [insVal, setInsVal] = useState('12.5');
  const calculateHOMA = (): { homa: number; interp: string } => {
    const glu = parseFloat(gluVal) || 90;
    const ins = parseFloat(insVal) || 10;
    const homa = Math.round(((glu * ins) / 405) * 100) / 100;

    let interp = 'Sensibilidad a la Insulina Normal (< 2.5)';
    if (homa >= 2.5) interp = 'Resistencia a la Insulina Significativa (≥ 2.5)';

    return { homa, interp };
  };

  // 5. Bilirrubinas Variables
  const [btVal, setBtVal] = useState('1.80');
  const [bdVal, setBdVal] = useState('0.40');
  const calculateBili = (): { bi: number; interp: string } => {
    const bt = parseFloat(btVal) || 0;
    const bd = parseFloat(bdVal) || 0;
    const bi = Math.max(0, Math.round((bt - bd) * 100) / 100);
    return { bi, interp: 'Bilirrubina Indirecta Calculada (BT - BD)' };
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedNote(text);
    setTimeout(() => setCopiedNote(null), 3000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="p-6 bg-gradient-to-r from-teal-950/40 via-slate-900 to-cyan-950/30 border border-teal-500/30 rounded-3xl shadow-2xl backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-teal-500/20 border border-teal-500/40 text-teal-300 text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
              <Calculator className="w-3.5 h-3.5" /> SUITE DE FÓRMULAS CLÍNICAS LIS
            </span>
            <span className="text-xs text-slate-400 font-mono">Cálculo instantáneo para el tecnólogo</span>
          </div>
          <h2 className="text-xl font-black text-white uppercase italic mt-1">
            Calculadora y Parámetros Derivados
          </h2>
          <p className="text-xs text-slate-400">
            Valores precargados automáticamente desde la orden analítica de <strong className="text-white">{patient.firstName} {patient.lastName}</strong>.
          </p>
        </div>

        {/* Formula selector tabs */}
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'ckd', label: 'eGFR CKD-EPI' },
            { id: 'anion', label: 'Anion Gap' },
            { id: 'osm', label: 'Osmolaridad' },
            { id: 'homa', label: 'HOMA-IR' },
            { id: 'bili', label: 'Bilirrubina Ind.' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setActiveFormula(f.id as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                activeFormula === f.id
                  ? 'bg-teal-500 text-slate-950 shadow-lg shadow-teal-500/20 scale-105'
                  : 'bg-slate-900 border border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Calculation Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Inputs */}
        <div className="lg:col-span-7 bg-slate-950/80 border border-teal-500/20 rounded-3xl p-6 shadow-2xl space-y-6">
          {activeFormula === 'ckd' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">
                    Filtrado Glomerular Estimado (CKD-EPI 2021)
                  </h3>
                  <span className="text-[10px] text-teal-400 font-mono">Ecuación recomendada por KDIGO (Sin variable de raza)</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                    Creatinina Sérica (mg/dL)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={creatinine}
                    onChange={(e) => setCreatinine(e.target.value)}
                    className="w-full p-3 bg-slate-900 border border-teal-500/40 rounded-xl text-teal-300 font-mono font-black text-base outline-none focus:border-teal-400"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                    Edad del Paciente
                  </label>
                  <div className="w-full p-3 bg-slate-900/60 border border-white/10 rounded-xl text-white font-mono font-bold text-base">
                    {age} años
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                    Sexo Biológico
                  </label>
                  <div className="w-full p-3 bg-slate-900/60 border border-white/10 rounded-xl text-white font-mono font-bold text-base">
                    {gender === 'F' ? 'Femenino' : 'Masculino'}
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-900/40 border border-white/5 rounded-2xl text-[11px] text-slate-400 space-y-1">
                <span className="font-bold text-white block">Formula Aplicada:</span>
                <code className="text-teal-400 text-[10px]">
                  eGFR = 142 × min(Scr/κ, 1)^α × max(Scr/κ, 1)^-1.200 × 0.9938^Edad × {gender === 'F' ? '1.012' : '1.0'}
                </code>
              </div>
            </div>
          )}

          {activeFormula === 'anion' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">
                    Brecha Aniónica (Anion Gap)
                  </h3>
                  <span className="text-[10px] text-teal-400 font-mono">Evaluación del balance ácido-base electrolítico</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Sodio Na+ (mEq/L)</label>
                  <input
                    type="number"
                    value={naVal}
                    onChange={(e) => setNaVal(e.target.value)}
                    className="w-full p-3 bg-slate-900 border border-teal-500/40 rounded-xl text-teal-300 font-mono font-black text-base outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Cloro Cl- (mEq/L)</label>
                  <input
                    type="number"
                    value={clVal}
                    onChange={(e) => setClVal(e.target.value)}
                    className="w-full p-3 bg-slate-900 border border-teal-500/40 rounded-xl text-teal-300 font-mono font-black text-base outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Bicarbonato HCO3- (mEq/L)</label>
                  <input
                    type="number"
                    value={hco3Val}
                    onChange={(e) => setHco3Val(e.target.value)}
                    className="w-full p-3 bg-slate-900 border border-teal-500/40 rounded-xl text-teal-300 font-mono font-black text-base outline-none"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-900/40 border border-white/5 rounded-2xl text-[11px] text-slate-400 space-y-1">
                <span className="font-bold text-white block">Formula Aplicada:</span>
                <code className="text-teal-400 text-[10px]">Anion Gap = Na+ - (Cl- + HCO3-)</code>
              </div>
            </div>
          )}

          {activeFormula === 'osm' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">
                    Osmolaridad Plasmática Calculada
                  </h3>
                  <span className="text-[10px] text-teal-400 font-mono">Detección de estados hiperosmolares y brecha osmolar</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Sodio Na+ (mEq/L)</label>
                  <input
                    type="number"
                    value={naVal}
                    onChange={(e) => setNaVal(e.target.value)}
                    className="w-full p-3 bg-slate-900 border border-teal-500/40 rounded-xl text-teal-300 font-mono font-black text-base outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Glucosa (mg/dL)</label>
                  <input
                    type="number"
                    value={gluVal}
                    onChange={(e) => setGluVal(e.target.value)}
                    className="w-full p-3 bg-slate-900 border border-teal-500/40 rounded-xl text-teal-300 font-mono font-black text-base outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">BUN (mg/dL)</label>
                  <input
                    type="number"
                    value={bunVal}
                    onChange={(e) => setBunVal(e.target.value)}
                    className="w-full p-3 bg-slate-900 border border-teal-500/40 rounded-xl text-teal-300 font-mono font-black text-base outline-none"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-900/40 border border-white/5 rounded-2xl text-[11px] text-slate-400 space-y-1">
                <span className="font-bold text-white block">Formula Aplicada:</span>
                <code className="text-teal-400 text-[10px]">Osmolaridad = 2 × Na + (Glucosa / 18) + (BUN / 2.8)</code>
              </div>
            </div>
          )}

          {activeFormula === 'homa' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">
                    Índice HOMA-IR (Homeostatic Model Assessment)
                  </h3>
                  <span className="text-[10px] text-teal-400 font-mono">Estimación de resistencia a la insulina</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Glucosa en Ayunas (mg/dL)</label>
                  <input
                    type="number"
                    value={gluVal}
                    onChange={(e) => setGluVal(e.target.value)}
                    className="w-full p-3 bg-slate-900 border border-teal-500/40 rounded-xl text-teal-300 font-mono font-black text-base outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Insulina Basal (µUI/mL)</label>
                  <input
                    type="number"
                    value={insVal}
                    onChange={(e) => setInsVal(e.target.value)}
                    className="w-full p-3 bg-slate-900 border border-teal-500/40 rounded-xl text-teal-300 font-mono font-black text-base outline-none"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-900/40 border border-white/5 rounded-2xl text-[11px] text-slate-400 space-y-1">
                <span className="font-bold text-white block">Formula Aplicada:</span>
                <code className="text-teal-400 text-[10px]">HOMA-IR = (Glucosa × Insulina) / 405</code>
              </div>
            </div>
          )}

          {activeFormula === 'bili' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">
                    Bilirrubina Indirecta (No Conjugada)
                  </h3>
                  <span className="text-[10px] text-teal-400 font-mono">Cálculo por sustracción espectrofotométrica</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Bilirrubina Total (mg/dL)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={btVal}
                    onChange={(e) => setBtVal(e.target.value)}
                    className="w-full p-3 bg-slate-900 border border-teal-500/40 rounded-xl text-teal-300 font-mono font-black text-base outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Bilirrubina Directa (mg/dL)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={bdVal}
                    onChange={(e) => setBdVal(e.target.value)}
                    className="w-full p-3 bg-slate-900 border border-teal-500/40 rounded-xl text-teal-300 font-mono font-black text-base outline-none"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-900/40 border border-white/5 rounded-2xl text-[11px] text-slate-400 space-y-1">
                <span className="font-bold text-white block">Formula Aplicada:</span>
                <code className="text-teal-400 text-[10px]">Bilirrubina Indirecta = Bilirrubina Total - Bilirrubina Directa</code>
              </div>
            </div>
          )}
        </div>

        {/* Right Output & Action Card */}
        <div className="lg:col-span-5 bg-slate-950/80 border border-cyan-500/20 rounded-3xl p-6 shadow-2xl flex flex-col justify-between space-y-4">
          <div>
            <span className="text-[9px] font-black uppercase tracking-widest text-cyan-400 block">
              RESULTADO COMPUTADO LIS
            </span>

            {/* Dynamic Computation Summary */}
            {activeFormula === 'ckd' && (() => {
              const { egfr, stage } = calculateCKDEPI();
              return (
                <div className="space-y-4 mt-2">
                  <div className="p-5 rounded-2xl bg-slate-900/90 border border-teal-500/30">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">eGFR CKD-EPI</span>
                    <div className="text-4xl font-black font-mono text-cyan-300 mt-1">
                      {egfr} <span className="text-sm font-sans font-bold text-slate-400">mL/min/1.73m²</span>
                    </div>
                    <div className="mt-3 inline-block px-3 py-1 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-black uppercase">
                      {stage}
                    </div>
                  </div>

                  <div className="space-y-2 text-xs text-slate-400">
                    <div className="flex justify-between">
                      <span>Rango Normal:</span>
                      <strong className="text-white">&gt; 90 mL/min/1.73m²</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Validación Técnica:</span>
                      <span className="text-emerald-400 font-bold">Fórmula validada KDIGO</span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {activeFormula === 'anion' && (() => {
              const { gap, interp } = calculateAnionGap();
              return (
                <div className="space-y-4 mt-2">
                  <div className="p-5 rounded-2xl bg-slate-900/90 border border-teal-500/30">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Brecha Aniónica</span>
                    <div className="text-4xl font-black font-mono text-cyan-300 mt-1">
                      {gap} <span className="text-sm font-sans font-bold text-slate-400">mEq/L</span>
                    </div>
                    <div className="mt-3 inline-block px-3 py-1 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-black uppercase">
                      {interp}
                    </div>
                  </div>
                  <div className="text-xs text-slate-400">
                    Rango de Referencia Estándar: <strong className="text-white">8.0 - 16.0 mEq/L</strong>
                  </div>
                </div>
              );
            })()}

            {activeFormula === 'osm' && (() => {
              const { osm, interp } = calculateOsmolarity();
              return (
                <div className="space-y-4 mt-2">
                  <div className="p-5 rounded-2xl bg-slate-900/90 border border-teal-500/30">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Osmolaridad Calculada</span>
                    <div className="text-4xl font-black font-mono text-cyan-300 mt-1">
                      {osm} <span className="text-sm font-sans font-bold text-slate-400">mOsm/kg</span>
                    </div>
                    <div className="mt-3 inline-block px-3 py-1 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-black uppercase">
                      {interp}
                    </div>
                  </div>
                  <div className="text-xs text-slate-400">
                    Rango de Referencia Estándar: <strong className="text-white">275 - 295 mOsm/kg</strong>
                  </div>
                </div>
              );
            })()}

            {activeFormula === 'homa' && (() => {
              const { homa, interp } = calculateHOMA();
              return (
                <div className="space-y-4 mt-2">
                  <div className="p-5 rounded-2xl bg-slate-900/90 border border-teal-500/30">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Índice HOMA-IR</span>
                    <div className="text-4xl font-black font-mono text-cyan-300 mt-1">
                      {homa} <span className="text-sm font-sans font-bold text-slate-400">Índice</span>
                    </div>
                    <div className="mt-3 inline-block px-3 py-1 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-black uppercase">
                      {interp}
                    </div>
                  </div>
                  <div className="text-xs text-slate-400">
                    Corte Clínico: <strong className="text-white">&lt; 2.5 Normal</strong>
                  </div>
                </div>
              );
            })()}

            {activeFormula === 'bili' && (() => {
              const { bi, interp } = calculateBili();
              return (
                <div className="space-y-4 mt-2">
                  <div className="p-5 rounded-2xl bg-slate-900/90 border border-teal-500/30">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Bilirrubina Indirecta</span>
                    <div className="text-4xl font-black font-mono text-cyan-300 mt-1">
                      {bi} <span className="text-sm font-sans font-bold text-slate-400">mg/dL</span>
                    </div>
                    <div className="mt-3 inline-block px-3 py-1 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-black uppercase">
                      {interp}
                    </div>
                  </div>
                  <div className="text-xs text-slate-400">
                    Rango de Referencia Estándar: <strong className="text-white">0.20 - 0.80 mg/dL</strong>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-4 border-t border-white/10">
            <button
              onClick={() => {
                if (activeFormula === 'ckd') {
                  const { egfr, stage } = calculateCKDEPI();
                  onAddCalculatedResult?.(
                    'Filtrado Glomerular (CKD-EPI 2021)',
                    egfr.toString(),
                    'mL/min/1.73m²',
                    '> 90'
                  );
                } else if (activeFormula === 'anion') {
                  const { gap } = calculateAnionGap();
                  onAddCalculatedResult?.('Brecha Aniónica (Anion Gap)', gap.toString(), 'mEq/L', '8.0 - 16.0');
                } else if (activeFormula === 'osm') {
                  const { osm } = calculateOsmolarity();
                  onAddCalculatedResult?.('Osmolaridad Calculada', osm.toString(), 'mOsm/kg', '275 - 295');
                } else if (activeFormula === 'homa') {
                  const { homa } = calculateHOMA();
                  onAddCalculatedResult?.('Índice HOMA-IR', homa.toString(), 'Índice', '< 2.5');
                } else if (activeFormula === 'bili') {
                  const { bi } = calculateBili();
                  onAddCalculatedResult?.('Bilirrubina Indirecta', bi.toString(), 'mg/dL', '0.20 - 0.80');
                }
              }}
              className="w-full py-3.5 bg-gradient-to-r from-teal-400 to-cyan-400 text-slate-950 font-black rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20 hover:brightness-110 transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Inyectar como Analito a la Orden</span>
            </button>

            <button
              onClick={() => {
                let note = '';
                if (activeFormula === 'ckd') {
                  const { egfr, stage } = calculateCKDEPI();
                  note = `Nota Técnica LIS: eGFR (CKD-EPI 2021) = ${egfr} mL/min/1.73m² [${stage}].`;
                } else if (activeFormula === 'anion') {
                  const { gap, interp } = calculateAnionGap();
                  note = `Nota Técnica LIS: Anion Gap = ${gap} mEq/L [${interp}].`;
                } else if (activeFormula === 'osm') {
                  const { osm, interp } = calculateOsmolarity();
                  note = `Nota Técnica LIS: Osmolaridad = ${osm} mOsm/kg [${interp}].`;
                } else if (activeFormula === 'homa') {
                  const { homa, interp } = calculateHOMA();
                  note = `Nota Técnica LIS: HOMA-IR = ${homa} [${interp}].`;
                } else if (activeFormula === 'bili') {
                  const { bi } = calculateBili();
                  note = `Nota Técnica LIS: Bilirrubina Indirecta = ${bi} mg/dL.`;
                }
                copyToClipboard(note);
              }}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold rounded-2xl text-xs uppercase border border-white/5 transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{copiedNote ? '✓ Copiado al portapapeles' : 'Copiar Comentario Clínico'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
