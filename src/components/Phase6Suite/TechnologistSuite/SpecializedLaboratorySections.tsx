import React, { useState, useEffect } from 'react';
import {
  Microscope,
  FlaskConical,
  Droplet,
  Volume2,
  VolumeX,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Plus,
  Trash2,
  Info,
  Layers,
  Sparkles,
  ShieldCheck,
  Biohazard,
  Search
} from 'lucide-react';

interface LeukocyteDiff {
  segmented: number;
  lymphocytes: number;
  monocytes: number;
  eosinophils: number;
  basophils: number;
  bandCells: number;
  blasts: number;
  metamyelocytes: number;
  myelocytes: number;
  nrbc: number; // Nucleated RBCs
}

interface AntibioticSensitivity {
  id: string;
  name: string;
  family: string;
  zoneMm?: number;
  mic?: number;
  unit: 'mm' | 'µg/mL';
  interpretation: 'SENSIBLE' | 'INTERMEDIO' | 'RESISTENTE';
  clsiBreakpoint: string;
}

export const SpecializedLaboratorySections: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'hematology' | 'microbiology' | 'urinalysis'>('hematology');

  // --- 1. HEMATOLOGY DIFFERENTIAL STATE ---
  const [totalWbc, setTotalWbc] = useState<number>(8.5); // x10^3 / µL
  const [diff, setDiff] = useState<LeukocyteDiff>({
    segmented: 60,
    lymphocytes: 28,
    monocytes: 7,
    eosinophils: 3,
    basophils: 1,
    bandCells: 1,
    blasts: 0,
    metamyelocytes: 0,
    myelocytes: 0,
    nrbc: 0
  });

  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [poikilocytes, setPoikilocytes] = useState<{ [key: string]: 'AUSENTE' | '1+' | '2+' | '3+' | '4+' }>({
    drepanocytes: 'AUSENTE',
    schistocytes: '1+',
    dacrocytes: 'AUSENTE',
    targetCells: '2+',
    acanthocytes: 'AUSENTE',
    anisocytosis: '2+',
    microcytosis: '2+',
    macrocytosis: 'AUSENTE',
    hypochromia: '2+',
    howellJolly: 'AUSENTE',
    basophilicStippling: '1+',
    toxicGranulations: '2+',
    dohleBodies: 'AUSENTE',
    giantPlatelets: '1+'
  });

  const totalCounted = diff.segmented + diff.lymphocytes + diff.monocytes + diff.eosinophils + diff.basophils + diff.bandCells + diff.blasts + diff.metamyelocytes + diff.myelocytes;

  // Sound beeper
  const playBeep = (is100: boolean) => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(is100 ? 880 : 520, ctx.currentTime);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + (is100 ? 0.25 : 0.08));
    } catch {
      // Audio fallback
    }
  };

  const handleIncrement = (field: keyof LeukocyteDiff) => {
    const nextTotal = totalCounted + (field !== 'nrbc' ? 1 : 0);
    playBeep(nextTotal === 100);
    setDiff(prev => ({
      ...prev,
      [field]: prev[field] + 1
    }));
  };

  // Keyboard shortcut listener for differential counter
  useEffect(() => {
    if (activeSection !== 'hematology') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture when typing in inputs
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) return;

      switch (e.key) {
        case '1': handleIncrement('segmented'); break;
        case '2': handleIncrement('lymphocytes'); break;
        case '3': handleIncrement('monocytes'); break;
        case '4': handleIncrement('eosinophils'); break;
        case '5': handleIncrement('basophils'); break;
        case '6': handleIncrement('bandCells'); break;
        case '7': handleIncrement('blasts'); break;
        case '8': handleIncrement('metamyelocytes'); break;
        case '9': handleIncrement('myelocytes'); break;
        case '0': handleIncrement('nrbc'); break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeSection, totalCounted, soundEnabled]);

  const handleResetDiff = () => {
    setDiff({
      segmented: 0,
      lymphocytes: 0,
      monocytes: 0,
      eosinophils: 0,
      basophils: 0,
      bandCells: 0,
      blasts: 0,
      metamyelocytes: 0,
      myelocytes: 0,
      nrbc: 0
    });
  };

  // Absolute calculation
  const getAbsolute = (count: number) => {
    if (totalCounted === 0) return '0.00';
    const percent = (count / totalCounted) * 100;
    const abs = (percent / 100) * totalWbc;
    return abs.toFixed(2);
  };

  const getPercent = (count: number) => {
    if (totalCounted === 0) return '0%';
    return `${Math.round((count / totalCounted) * 100)}%`;
  };

  // --- 2. MICROBIOLOGY STATE ---
  const [sampleType, setSampleType] = useState<string>('Urocultivo (Chorro Medio)');
  const [gramStain, setGramStain] = useState<string>('Bacilos Gram Negativos abundantes (>25 por campo x1000)');
  const [isolatedOrganism, setIsolatedOrganism] = useState<string>('Escherichia coli (Productora de BLEE)');
  const [colonyCount, setColonyCount] = useState<string>('> 100,000 UFC/mL (Crecimiento Significativo)');
  const [hasEsbl, setHasEsbl] = useState<boolean>(true);
  const [hasMrsa, setHasMrsa] = useState<boolean>(false);
  const [hasCarbapenemase, setHasCarbapenemase] = useState<boolean>(false);

  const [antibiogram, setAntibiogram] = useState<AntibioticSensitivity[]>([
    { id: 'ab-1', name: 'Ampicilina / Sulbactam', family: 'Penicilinas + Inhibidor', mic: 32, unit: 'µg/mL', interpretation: 'RESISTENTE', clsiBreakpoint: 'R >= 32' },
    { id: 'ab-2', name: 'Ceftriaxona', family: 'Cefalosporinas 3ra Gen', mic: 16, unit: 'µg/mL', interpretation: 'RESISTENTE', clsiBreakpoint: 'R >= 4' },
    { id: 'ab-3', name: 'Cefepima', family: 'Cefalosporinas 4ta Gen', mic: 8, unit: 'µg/mL', interpretation: 'RESISTENTE', clsiBreakpoint: 'R >= 16' },
    { id: 'ab-4', name: 'Meropenem', family: 'Carbapenémicos', mic: 0.25, unit: 'µg/mL', interpretation: 'SENSIBLE', clsiBreakpoint: 'S <= 1' },
    { id: 'ab-5', name: 'Amikacina', family: 'Aminoglucósidos', zoneMm: 22, unit: 'mm', interpretation: 'SENSIBLE', clsiBreakpoint: 'S >= 17' },
    { id: 'ab-6', name: 'Ciprofloxacino', family: 'Fluoroquinolonas', mic: 4, unit: 'µg/mL', interpretation: 'RESISTENTE', clsiBreakpoint: 'R >= 1' },
    { id: 'ab-7', name: 'Nitrofurantoína', family: 'Nitrofurantoinas', mic: 16, unit: 'µg/mL', interpretation: 'SENSIBLE', clsiBreakpoint: 'S <= 32' }
  ]);

  // --- 3. URINALYSIS STATE ---
  const [uriColor, setUriColor] = useState<string>('Amarillo Turbio');
  const [uriAspect, setUriAspect] = useState<string>('Turbio (3+)');
  const [uriDensity, setUriDensity] = useState<string>('1.025');
  const [uriPh, setUriPh] = useState<string>('6.0');
  const [uriProtein, setUriProtein] = useState<string>('100 mg/dL (2+)');
  const [uriGlucose, setUriGlucose] = useState<string>('Negativo');
  const [uriKetones, setUriKetones] = useState<string>('Negativo');
  const [uriNitrites, setUriNitrites] = useState<string>('Positivo (++)');
  const [uriLeukocytes, setUriLeukocytes] = useState<string>('500 Leu/µL (3+)');
  const [uriBlood, setUriBlood] = useState<string>('50 Ery/µL (2+)');

  // Microscopic sediment
  const [sedLeukocytes, setSedLeukocytes] = useState<string>('30 - 40 por campo (Agrupados)');
  const [sedErythrocytes, setSedErythrocytes] = useState<string>('8 - 12 por campo (Eumórficos)');
  const [sedEpithelial, setSedEpithelial] = useState<string>('Moderadas células descamativas');
  const [sedBacteria, setSedBacteria] = useState<string>('Abundantes (4+)');
  const [sedMucus, setSedMucus] = useState<string>('Moderado (2+)');
  const [sedCasts, setSedCasts] = useState<string>('1 - 2 Cilindros Hialinos por campo');
  const [sedCrystals, setSedCrystals] = useState<string>('Escasos cristales de Oxalato de Calcio Dihidratado');

  return (
    <div className="space-y-8 animate-in fade-in duration-500" id="specialized-sections-container">
      {/* Title Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="flex items-center space-x-4 relative z-10">
          <div className="w-14 h-14 bg-gradient-to-tr from-purple-500 to-indigo-500 rounded-2xl flex items-center justify-center text-white font-black shadow-lg shadow-purple-500/20">
            <Microscope className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl sm:text-2xl font-black text-white">Módulos Especializados por Sección</h2>
              <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Módulo 4
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Contador hematológico con atajos numéricos, microbiología CLSI y urianálisis completo.
            </p>
          </div>
        </div>

        {/* Section Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 relative z-10">
          <button
            onClick={() => setActiveSection('hematology')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center space-x-2 ${
              activeSection === 'hematology'
                ? 'bg-teal-500 text-slate-950 shadow-lg shadow-teal-500/20'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Microscope className="w-4 h-4" />
            <span>Hematología & Frotis</span>
          </button>

          <button
            onClick={() => setActiveSection('microbiology')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center space-x-2 ${
              activeSection === 'microbiology'
                ? 'bg-teal-500 text-slate-950 shadow-lg shadow-teal-500/20'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <FlaskConical className="w-4 h-4" />
            <span>Microbiología & Antibiograma</span>
          </button>

          <button
            onClick={() => setActiveSection('urinalysis')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center space-x-2 ${
              activeSection === 'urinalysis'
                ? 'bg-teal-500 text-slate-950 shadow-lg shadow-teal-500/20'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Droplet className="w-4 h-4" />
            <span>Urianálisis & Sedimento</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: HEMATOLOGY */}
      {activeSection === 'hematology' && (
        <div className="space-y-8 animate-in fade-in">
          {/* Top Bar with Total Count and WBC */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Células Contadas</div>
                <div className={`text-3xl font-black font-mono mt-0.5 ${totalCounted >= 100 ? 'text-teal-400' : 'text-amber-400'}`}>
                  {totalCounted} <span className="text-xs text-slate-500 font-normal">/ 100</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Leucocitos Totales (x10³/µL)</label>
                <input
                  type="number"
                  step="0.1"
                  value={totalWbc}
                  onChange={e => setTotalWbc(parseFloat(e.target.value) || 0)}
                  className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-bold text-white w-32 focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-2.5 rounded-xl border transition cursor-pointer ${
                  soundEnabled ? 'bg-teal-500/20 border-teal-500/40 text-teal-300' : 'bg-slate-950 border-slate-800 text-slate-500'
                }`}
                title={soundEnabled ? 'Silenciar Beep' : 'Activar Sonido'}
              >
                {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </button>

              <button
                onClick={handleResetDiff}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition flex items-center space-x-1.5 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reiniciar Conteo (0)</span>
              </button>
            </div>
          </div>

          {/* Differential Keypad Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {[
              { key: '1', field: 'segmented' as const, label: 'Segmentados', count: diff.segmented, color: 'from-blue-500/20 to-indigo-500/20' },
              { key: '2', field: 'lymphocytes' as const, label: 'Linfocitos', count: diff.lymphocytes, color: 'from-teal-500/20 to-emerald-500/20' },
              { key: '3', field: 'monocytes' as const, label: 'Monocitos', count: diff.monocytes, color: 'from-purple-500/20 to-pink-500/20' },
              { key: '4', field: 'eosinophils' as const, label: 'Eosinófilos', count: diff.eosinophils, color: 'from-amber-500/20 to-orange-500/20' },
              { key: '5', field: 'basophils' as const, label: 'Basófilos', count: diff.basophils, color: 'from-rose-500/20 to-red-500/20' },
              { key: '6', field: 'bandCells' as const, label: 'Abastonados / Bandas', count: diff.bandCells, color: 'from-cyan-500/20 to-blue-500/20' },
              { key: '7', field: 'blasts' as const, label: 'Blastos / Inmaduros', count: diff.blasts, color: 'from-red-600/30 to-rose-600/30' },
              { key: '8', field: 'metamyelocytes' as const, label: 'Metamielocitos', count: diff.metamyelocytes, color: 'from-slate-800 to-slate-900' },
              { key: '9', field: 'myelocytes' as const, label: 'Mielocitos', count: diff.myelocytes, color: 'from-slate-800 to-slate-900' },
              { key: '0', field: 'nrbc' as const, label: 'Eritroblastos / 100 Leu', count: diff.nrbc, color: 'from-emerald-600/20 to-teal-600/20' }
            ].map(cell => (
              <button
                key={cell.key}
                onClick={() => handleIncrement(cell.field)}
                className={`p-4 rounded-2xl border border-slate-800 bg-slate-900/90 hover:border-teal-400 hover:bg-slate-800 transition-all text-left flex flex-col justify-between space-y-3 cursor-pointer shadow-lg active:scale-95`}
              >
                <div className="flex items-center justify-between">
                  <span className="w-6 h-6 rounded-lg bg-slate-950 border border-slate-700 text-teal-400 font-mono font-black text-xs flex items-center justify-center">
                    {cell.key}
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-400">
                    {getPercent(cell.count)}
                  </span>
                </div>

                <div>
                  <div className="text-xs font-bold text-slate-200">{cell.label}</div>
                  <div className="text-2xl font-black text-white font-mono mt-0.5">{cell.count}</div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    Abs: {getAbsolute(cell.count)} x10³/µL
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Morphological Abnormalities Checklist */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-teal-400" />
              <span>Checklist de Morfología Eritrocitaria & Plaquetaria (Frotis Sanguíneo)</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 text-xs">
              {[
                { id: 'anisocytosis', label: 'Anisocitosis' },
                { id: 'microcytosis', label: 'Microcitosis' },
                { id: 'hypochromia', label: 'Hipocromía' },
                { id: 'targetCells', label: 'Dianocitos (Target)' },
                { id: 'schistocytes', label: 'Esquistocitos' },
                { id: 'drepanocytes', label: 'Drepanocitos (Falciformes)' },
                { id: 'basophilicStippling', label: 'Punteado Basófilo' },
                { id: 'toxicGranulations', label: 'Granulaciones Tóxicas' },
                { id: 'giantPlatelets', label: 'Plaquetas Gigantes' }
              ].map(item => (
                <div key={item.id} className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-1.5">
                  <div className="font-bold text-slate-200">{item.label}</div>
                  <select
                    value={poikilocytes[item.id] || 'AUSENTE'}
                    onChange={e => setPoikilocytes({ ...poikilocytes, [item.id]: e.target.value as 'AUSENTE' | '1+' | '2+' | '3+' | '4+' })}
                    className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs font-bold text-teal-300 focus:outline-none"
                  >
                    <option value="AUSENTE">Ausente</option>
                    <option value="1+">1+ (Ligero)</option>
                    <option value="2+">2+ (Moderado)</option>
                    <option value="3+">3+ (Marcado)</option>
                    <option value="4+">4+ (Severo)</option>
                  </select>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: MICROBIOLOGY */}
      {activeSection === 'microbiology' && (
        <div className="space-y-8 animate-in fade-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Identificación Bacteriana</h3>
              
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Muestra / Origen</label>
                  <input
                    type="text"
                    value={sampleType}
                    onChange={e => setSampleType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Tinción de Gram Inicial</label>
                  <input
                    type="text"
                    value={gramStain}
                    onChange={e => setGramStain(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Microorganismo Aislado</label>
                  <input
                    type="text"
                    value={isolatedOrganism}
                    onChange={e => setIsolatedOrganism(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-teal-400 font-black"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Recuento Cuantitativo de Colonias</label>
                  <input
                    type="text"
                    value={colonyCount}
                    onChange={e => setColonyCount(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold"
                  />
                </div>

                {/* Resistance Mechanisms Alert */}
                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Mecanismos de Resistencia Crítica</div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="chk-esbl"
                      checked={hasEsbl}
                      onChange={e => setHasEsbl(e.target.checked)}
                      className="w-4 h-4 text-rose-500 rounded border-slate-700 bg-slate-900"
                    />
                    <label htmlFor="chk-esbl" className="text-xs text-rose-300 font-bold">BLEE+ (Betalactamasas de Espectro Extendido)</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="chk-carb"
                      checked={hasCarbapenemase}
                      onChange={e => setHasCarbapenemase(e.target.checked)}
                      className="w-4 h-4 text-rose-500 rounded border-slate-700 bg-slate-900"
                    />
                    <label htmlFor="chk-carb" className="text-xs text-rose-300 font-bold">Carbapenemasas (KPC / NDM / OXA-48)</label>
                  </div>
                </div>
              </div>
            </div>

            {/* Antibiogram Table (2 Cols) */}
            <div className="md:col-span-2 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-black text-white uppercase tracking-wider">
                  Tabla de Antibiograma (CLSI / EUCAST 2025)
                </h3>
                <span className="text-[10px] bg-slate-950 text-teal-400 border border-teal-500/30 px-2.5 py-1 rounded-full font-mono font-bold">
                  7 Fármacos Evaluados
                </span>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase font-bold border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Antibiótico</th>
                      <th className="py-2.5 px-3">Familia</th>
                      <th className="py-2.5 px-3">CIM / Halo</th>
                      <th className="py-2.5 px-3">Punto de Corte CLSI</th>
                      <th className="py-2.5 px-3 text-center">Interpretación</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {antibiogram.map(ab => (
                      <tr key={ab.id} className="hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 font-bold text-white">{ab.name}</td>
                        <td className="py-2.5 px-3 text-slate-400 text-[11px] font-sans">{ab.family}</td>
                        <td className="py-2.5 px-3 text-teal-300 font-bold">
                          {ab.mic ? `${ab.mic} µg/mL` : `${ab.zoneMm} mm`}
                        </td>
                        <td className="py-2.5 px-3 text-slate-400 text-[11px]">{ab.clsiBreakpoint}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                            ab.interpretation === 'SENSIBLE'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : ab.interpretation === 'INTERMEDIO'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          }`}>
                            {ab.interpretation}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: URINALYSIS */}
      {activeSection === 'urinalysis' && (
        <div className="space-y-8 animate-in fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Physical & Chemical Strip */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                Examen Físico-Químico (Tira Reactiva 10 Parámetros)
              </h3>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">Color</label>
                  <input type="text" value={uriColor} onChange={e => setUriColor(e.target.value)} className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">Aspecto</label>
                  <input type="text" value={uriAspect} onChange={e => setUriAspect(e.target.value)} className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">Densidad Específica</label>
                  <input type="text" value={uriDensity} onChange={e => setUriDensity(e.target.value)} className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono font-bold" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">pH Urinario</label>
                  <input type="text" value={uriPh} onChange={e => setUriPh(e.target.value)} className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono font-bold" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">Proteínas</label>
                  <input type="text" value={uriProtein} onChange={e => setUriProtein(e.target.value)} className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-teal-300 font-bold" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">Nitritos</label>
                  <input type="text" value={uriNitrites} onChange={e => setUriNitrites(e.target.value)} className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-rose-400 font-bold" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">Esterasa Leucocitaria</label>
                  <input type="text" value={uriLeukocytes} onChange={e => setUriLeukocytes(e.target.value)} className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-rose-400 font-bold" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">Hemoglobina / Sangre</label>
                  <input type="text" value={uriBlood} onChange={e => setUriBlood(e.target.value)} className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-rose-400 font-bold" />
                </div>
              </div>
            </div>

            {/* Microscopic Sediment */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                Sedimento Microscópico (x400 Campo de Mayor Aumento)
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">Leucocitos por Campo</label>
                  <input type="text" value={sedLeukocytes} onChange={e => setSedLeukocytes(e.target.value)} className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold" />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">Hematíes por Campo</label>
                  <input type="text" value={sedErythrocytes} onChange={e => setSedErythrocytes(e.target.value)} className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold" />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">Bacterias / Flora</label>
                  <input type="text" value={sedBacteria} onChange={e => setSedBacteria(e.target.value)} className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold" />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">Cilindros</label>
                  <input type="text" value={sedCasts} onChange={e => setSedCasts(e.target.value)} className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold" />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">Cristales</label>
                  <input type="text" value={sedCrystals} onChange={e => setSedCrystals(e.target.value)} className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
