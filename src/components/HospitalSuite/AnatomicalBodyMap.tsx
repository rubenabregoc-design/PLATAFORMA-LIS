import React, { useState, useEffect } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Plus,
  Trash2,
  Save,
  RotateCw,
  Info,
  X,
  Check,
  Stethoscope,
  HeartPulse,
  Sparkles,
  Layers,
  ShieldAlert
} from 'lucide-react';

export interface AnatomicalFinding {
  regionId: string;
  regionName: string;
  view: 'anterior' | 'posterior';
  status: 'normal' | 'observation' | 'pathological';
  notes: string;
  quickTags: string[];
  updatedAt: string;
}

interface AnatomicalBodyMapProps {
  patientId: string;
  patientName: string;
  onInsertIntoSoap?: (text: string) => void;
}

interface RegionDefinition {
  id: string;
  name: string;
  category: string;
  view: 'anterior' | 'posterior';
  x: number; // SVG percentage x (0-100)
  y: number; // SVG percentage y (0-100)
  radius: number;
  quickOptions: string[];
  icon: string;
}

const BODY_REGIONS: RegionDefinition[] = [
  // --- ANTERIOR ---
  {
    id: 'cabeza_cara',
    name: 'Cabeza, Cráneo y Rostro',
    category: 'Neurológico / Otorrino',
    view: 'anterior',
    x: 50,
    y: 10,
    radius: 7,
    icon: '🧠',
    quickOptions: [
      'Normocéfalo, sin hematomas ni lesiones',
      'Pupilas isocóricas y fotorreactivas',
      'Facies álgica / Dolor agudo',
      'Mucosas orales húmedas y normocoloreadas',
      'Escleras anictéricas, conjuntivas normocoloreadas'
    ]
  },
  {
    id: 'cuello',
    name: 'Cuello y Región Tiroidea',
    category: 'Vascular / Endocrino',
    view: 'anterior',
    x: 50,
    y: 19,
    radius: 5,
    icon: '🧣',
    quickOptions: [
      'Cuello móvil, no doloroso, sin adenopatías',
      'Ingurgitación yugular ausente',
      'Tiroides no palpable, sin bocio',
      'Pulsos carotídeos simétricos sin soplos',
      'Rigidez de nuca ausente'
    ]
  },
  {
    id: 'torax_pulmones',
    name: 'Tórax y Campos Pulmonares',
    category: 'Respiratorio',
    view: 'anterior',
    x: 50,
    y: 28,
    radius: 9,
    icon: '🫁',
    quickOptions: [
      'Murmullo vesicular bilateral conservado',
      'Sin ruidos adventicios ni sobreagregados',
      'Sibilancias espiratorias bilaterales',
      'Crepitantes en bases pulmonares',
      'Dolor pleurítico a la inspiración profunda',
      'Tórax simétrico, adecuada expansibilidad'
    ]
  },
  {
    id: 'precordio_cardiaco',
    name: 'Área Precordial / Cardíaca',
    category: 'Cardiovascular',
    view: 'anterior',
    x: 44,
    y: 33,
    radius: 6,
    icon: '❤️',
    quickOptions: [
      'Ruidos cardíacos rítmicos normofonéticos',
      'Sin soplos, galope ni frote pericárdico',
      'Soplo sistólico grado II/VI en foco aórtico',
      'Taquicardia rítmica de reposo',
      'Latido de punta en 5to espacio intercostal'
    ]
  },
  {
    id: 'epigastrio_superior',
    name: 'Abdomen Superior / Epigastrio e Hipocondrios',
    category: 'Gastrointestinal',
    view: 'anterior',
    x: 50,
    y: 41,
    radius: 7,
    icon: '🥩',
    quickOptions: [
      'Epigastrio blando, no doloroso a la palpación',
      'Dolor epigástrico urente con irradiación',
      'Signo de Murphy negativo (sin colecistitis)',
      'Signo de Murphy positivo (foco vesicular)',
      'Hepatomegalia no palpable, sin esplenomegalia'
    ]
  },
  {
    id: 'fosa_iliaca_derecha',
    name: 'Fosa Ilíaca Derecha (FID / Apéndice)',
    category: 'Quirúrgico / Apendicular',
    view: 'anterior',
    x: 40,
    y: 50,
    radius: 6,
    icon: '⚠️',
    quickOptions: [
      'Signo de McBurney POSITIVO (dolor en FID)',
      'Signo de Blumberg (+) / Rebote positivo',
      'Defensa muscular involuntaria en FID',
      'Signo de Rovsing positivo',
      'FID libre, blanda, sin dolor a la palpación'
    ]
  },
  {
    id: 'mesogastrio_fii',
    name: 'Mesogastrio, Flancos y FII',
    category: 'Gastrointestinal / Renal',
    view: 'anterior',
    x: 58,
    y: 50,
    radius: 6,
    icon: '🌀',
    quickOptions: [
      'Ruidos hidroaéreos (RHA) presentes y normoactivos',
      'RHA disminuidos / Íleo adinámico',
      'Abdomen distendido timpánico',
      'Dolor cólico difuso en marco colónico',
      'Sin signos de irritación peritoneal'
    ]
  },
  {
    id: 'pelvis_hipogastrio',
    name: 'Hipogastrio, Pelvis y Región Inguinal',
    category: 'Urológico / Ginecológico',
    view: 'anterior',
    x: 50,
    y: 58,
    radius: 6,
    icon: '🩲',
    quickOptions: [
      'Hipogastrio blando, globo vesical ausente',
      'Dolor suprapúbico a la palpación profunda',
      'Orificios herniarios inguinales libres',
      'Puntos ureterales inferiores negativos',
      'Herida quirúrgica gineco-obstétrica limpia'
    ]
  },
  {
    id: 'brazo_derecho',
    name: 'Miembro Superior Derecho',
    category: 'Osteomuscular / Vascular',
    view: 'anterior',
    x: 23,
    y: 36,
    radius: 7,
    icon: '💪',
    quickOptions: [
      'Pulsos radial y braquial palpables simétricos',
      'Llenado capilar < 2 segundos',
      'Movilidad articular y fuerza muscular 5/5',
      'Vía periférica permeable sin flebitis',
      'Sin edemas ni equimosis'
    ]
  },
  {
    id: 'brazo_izquierdo',
    name: 'Miembro Superior Izquierdo',
    category: 'Osteomuscular / Vascular',
    view: 'anterior',
    x: 77,
    y: 36,
    radius: 7,
    icon: '💪',
    quickOptions: [
      'Pulsos radial y braquial conservados',
      'Llenado capilar < 2 segundos',
      'Fuerza muscular conservada simétrica',
      'Sin eritema ni limitación al movimiento',
      'Edema distal ausente'
    ]
  },
  {
    id: 'pierna_derecha',
    name: 'Miembro Inferior Derecho (Muslo, Rodilla, Pie)',
    category: 'Osteomuscular / Vascular',
    view: 'anterior',
    x: 37,
    y: 75,
    radius: 8,
    icon: '🦵',
    quickOptions: [
      'Pulsos pedio y tibial posterior palpables',
      'Sin edema en miembros inferiores (Fóvea 0)',
      'Edema con fóvea grado I-II pretibial',
      'Signo de Homans negativo (sin TVP)',
      'Marcha y bipedestación conservada'
    ]
  },
  {
    id: 'pierna_izquierda',
    name: 'Miembro Inferior Izquierdo (Muslo, Rodilla, Pie)',
    category: 'Osteomuscular / Vascular',
    view: 'anterior',
    x: 63,
    y: 75,
    radius: 8,
    icon: '🦵',
    quickOptions: [
      'Pulsos distales palpables y simétricos',
      'Sin edema periférico, temperatura normal',
      'Fuerza motora conservada en ambas piernas',
      'Sin lesiones dérmicas ni úlceras por presión',
      'Reflejo rotuliano normorreflexico'
    ]
  },

  // --- POSTERIOR ---
  {
    id: 'columna_cervical_nuca',
    name: 'Nuca y Columna Cervical',
    category: 'Columna / Neurológico',
    view: 'posterior',
    x: 50,
    y: 16,
    radius: 6,
    icon: '🦴',
    quickOptions: [
      'Columna cervical no dolorosa a la palpación',
      'Movimientos de flexión y rotación libres',
      'Contractura paravertebral cervical leve',
      'Sin deformidades ni dolor óseo localizado'
    ]
  },
  {
    id: 'espalda_toracica',
    name: 'Dorso y Campos Pulmonares Posteriores',
    category: 'Respiratorio / Columna',
    view: 'posterior',
    x: 50,
    y: 30,
    radius: 9,
    icon: '🫁',
    quickOptions: [
      'Auscultación posterior con murmullo simétrico',
      'Vibraciones vocales conservadas bilateral',
      'Dolor paravertebral dorsal a la digitopresión',
      'Escápulas simétricas sin alteraciones'
    ]
  },
  {
    id: 'fosas_renales_lumbar',
    name: 'Región Lumbar y Fosas Renales',
    category: 'Nefrológico / Urológico',
    view: 'posterior',
    x: 50,
    y: 45,
    radius: 8,
    icon: '🫘',
    quickOptions: [
      'Puño-percusión lumbar de Giordano NEGATIVA bilateral',
      'Giordano POSITIVO en fosa renal derecha',
      'Giordano POSITIVO en fosa renal izquierda',
      'Contractura muscular lumbar bilateral',
      'Sin dolor radicular a la maniobra de Lasègue'
    ]
  },
  {
    id: 'gluteos_sacro',
    name: 'Región Sacroilíaca y Glúteos',
    category: 'Tegumentario / Articular',
    view: 'posterior',
    x: 50,
    y: 57,
    radius: 7,
    icon: '🩹',
    quickOptions: [
      'Piel sacra íntegra, sin úlceras por presión (UPP)',
      'Eritema blanqueable no ulcerado en sacro (Grado I)',
      'Articulaciones sacroilíacas indoloras',
      'Sitios de inyección intramuscular sin hematomas'
    ]
  },
  {
    id: 'extremidades_posteriores',
    name: 'Tendones de Aquiles y Pantorrillas Posteriores',
    category: 'Vascular / Músculo',
    view: 'posterior',
    x: 50,
    y: 78,
    radius: 9,
    icon: '👟',
    quickOptions: [
      'Tendones de Aquiles íntegros e indoloros',
      'Pantorrillas blandas, depresibles, no dolorosas',
      'Empastamiento gemelar ausente (descarta TVP)',
      'Sin várices tortuosas ni cambios de coloración'
    ]
  }
];

export const AnatomicalBodyMap: React.FC<AnatomicalBodyMapProps> = ({
  patientId,
  patientName,
  onInsertIntoSoap
}) => {
  const [activeView, setActiveView] = useState<'anterior' | 'posterior'>('anterior');
  const [selectedRegionId, setSelectedRegionId] = useState<string>('fosa_iliaca_derecha');
  const [findings, setFindings] = useState<Record<string, AnatomicalFinding>>({});
  const [isCopiedToSoap, setIsCopiedToSoap] = useState<boolean>(false);

  // Storage key per patient
  const storageKey = `lis_ehr_anatomical_findings_${patientId}`;

  // Load findings from localStorage or init with realistic clinical sample
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setFindings(JSON.parse(saved));
        return;
      }
    } catch (e) {
      console.error(e);
    }

    // Default sample for active admission:
    const initialData: Record<string, AnatomicalFinding> = {
      fosa_iliaca_derecha: {
        regionId: 'fosa_iliaca_derecha',
        regionName: 'Fosa Ilíaca Derecha (FID / Apéndice)',
        view: 'anterior',
        status: 'pathological',
        notes: 'Dolor agudo a la palpación superficial y profunda en punto de McBurney. Rebote (Blumberg) positivo. Ruidos hidroaéreos disminuidos en cuadrante inferior derecho.',
        quickTags: ['Signo de McBurney POSITIVO', 'Signo de Blumberg (+)'],
        updatedAt: new Date().toISOString()
      },
      torax_pulmones: {
        regionId: 'torax_pulmones',
        regionName: 'Tórax y Campos Pulmonares',
        view: 'anterior',
        status: 'normal',
        notes: 'Tórax normoexpansible. Murmullo vesicular audible en ambos campos pulmonares sin sobreagregados.',
        quickTags: ['Murmullo vesicular bilateral conservado', 'Sin ruidos adventicios'],
        updatedAt: new Date().toISOString()
      },
      precordio_cardiaco: {
        regionId: 'precordio_cardiaco',
        regionName: 'Área Precordial / Cardíaca',
        view: 'anterior',
        status: 'normal',
        notes: 'Ruidos cardíacos rítmicos normofonéticos. Sin soplos audibles en focos precordiales.',
        quickTags: ['Ruidos cardíacos rítmicos normofonéticos'],
        updatedAt: new Date().toISOString()
      }
    };
    setFindings(initialData);
  }, [storageKey]);

  // Current selected region definition
  const selectedRegion = BODY_REGIONS.find((r) => r.id === selectedRegionId) || BODY_REGIONS[0];
  const currentFinding = findings[selectedRegionId] || {
    regionId: selectedRegion.id,
    regionName: selectedRegion.name,
    view: selectedRegion.view,
    status: 'normal',
    notes: '',
    quickTags: [],
    updatedAt: new Date().toISOString()
  };

  const [formStatus, setFormStatus] = useState<'normal' | 'observation' | 'pathological'>(currentFinding.status);
  const [formNotes, setFormNotes] = useState<string>(currentFinding.notes);

  // Sync form when selected region changes
  useEffect(() => {
    if (findings[selectedRegionId]) {
      setFormStatus(findings[selectedRegionId].status);
      setFormNotes(findings[selectedRegionId].notes);
    } else {
      setFormStatus('normal');
      setFormNotes('');
    }
  }, [selectedRegionId, findings]);

  const handleSaveFinding = () => {
    const updatedFinding: AnatomicalFinding = {
      regionId: selectedRegion.id,
      regionName: selectedRegion.name,
      view: selectedRegion.view,
      status: formStatus,
      notes: formNotes,
      quickTags: currentFinding.quickTags || [],
      updatedAt: new Date().toISOString()
    };

    const newFindings = {
      ...findings,
      [selectedRegion.id]: updatedFinding
    };

    setFindings(newFindings);
    try {
      localStorage.setItem(storageKey, JSON.stringify(newFindings));
    } catch (e) {
      console.error(e);
    }

    window.dispatchEvent(
      new CustomEvent('lis-global-toast', {
        detail: {
          message: `Hallazgo guardado para: ${selectedRegion.name}`,
          type: 'success'
        }
      })
    );
  };

  const handleClearFinding = (regionId: string) => {
    const newFindings = { ...findings };
    delete newFindings[regionId];
    setFindings(newFindings);
    try {
      localStorage.setItem(storageKey, JSON.stringify(newFindings));
    } catch (e) {
      console.error(e);
    }
    setFormNotes('');
    setFormStatus('normal');
    window.dispatchEvent(
      new CustomEvent('lis-global-toast', {
        detail: {
          message: `Hallazgo eliminado de esta región.`,
          type: 'info'
        }
      })
    );
  };

  const handleAddQuickOption = (option: string) => {
    setFormNotes((prev) => {
      if (!prev) return option;
      return `${prev}. ${option}`;
    });
  };

  // Compile all evaluated regions into a structured text for SOAP [O] Objetivo
  const generateSoapObjectiveSummary = () => {
    const items = Object.values(findings);
    if (items.length === 0) return 'Sin hallazgos regionales registrados en mapa corporal.';

    const lines: string[] = ['EXAMEN FÍSICO POR REGIONES ANATÓMICAS:'];
    
    // Sort pathological first, then observation, then normal
    const sorted = [...items].sort((a, b) => {
      const weight = { pathological: 3, observation: 2, normal: 1 };
      return weight[b.status] - weight[a.status];
    });

    sorted.forEach((item) => {
      const statusIcon = item.status === 'pathological' ? '🚨 [PATOLÓGICO]' : item.status === 'observation' ? '⚠️ [EN OBSERVACIÓN]' : '✅ [NORMAL]';
      lines.push(`• ${item.regionName} ${statusIcon}: ${item.notes || 'Evaluado sin alteraciones reportadas.'}`);
    });

    return lines.join('\n');
  };

  const handleTransferToSoap = () => {
    const summary = generateSoapObjectiveSummary();
    if (onInsertIntoSoap) {
      onInsertIntoSoap(summary);
      setIsCopiedToSoap(true);
      setTimeout(() => setIsCopiedToSoap(false), 3000);
      window.dispatchEvent(
        new CustomEvent('lis-global-toast', {
          detail: {
            message: '✨ Hallazgos anatómicos transferidos al Objetivo [O] de la nota SOAP.',
            type: 'success'
          }
        })
      );
    }
  };

  // Filter visible regions for current view
  const currentViewRegions = BODY_REGIONS.filter((r) => r.view === activeView);

  // Statistics
  const recordedCount = Object.keys(findings).length;
  const pathologicalCount = Object.values(findings).filter((f) => f.status === 'pathological').length;
  const observationCount = Object.values(findings).filter((f) => f.status === 'observation').length;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-6">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-inner">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                Mapa Corporal Anatómico Interactivo
              </h2>
              <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-full font-bold">
                Toca cualquier zona para registrar notas
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Evaluación topográfica física para <strong className="text-white">{patientName}</strong>. Guarda hallazgos específicos por órgano y transfiérelos a la nota SOAP.
            </p>
          </div>
        </div>

        {/* View Switcher: Anterior vs Posterior */}
        <div className="flex items-center gap-2">
          <div className="bg-slate-950 p-1 rounded-2xl border border-slate-800 flex items-center">
            <button
              type="button"
              onClick={() => setActiveView('anterior')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 ${
                activeView === 'anterior'
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Vista Anterior (Frontal)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveView('posterior')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 ${
                activeView === 'posterior'
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Vista Posterior (Espalda)</span>
            </button>
          </div>

          {/* Transfer button to SOAP */}
          <button
            type="button"
            onClick={handleTransferToSoap}
            className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-teal-500/20 transition cursor-pointer flex items-center space-x-1.5"
            title="Copiar todos los hallazgos al campo Objetivo de la Nota SOAP"
          >
            {isCopiedToSoap ? <Check className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
            <span>{isCopiedToSoap ? '¡Insertado en SOAP!' : 'Insertar en Objetivo SOAP'}</span>
          </button>
        </div>
      </div>

      {/* Body Stats Pill */}
      <div className="flex flex-wrap items-center gap-3 text-xs bg-slate-950/70 p-3 rounded-2xl border border-slate-800">
        <span className="font-bold text-slate-400">Resumen Clínico Corporal:</span>
        <span className="bg-slate-900 text-slate-300 border border-slate-700 px-2.5 py-1 rounded-xl font-mono">
          Zonas Evaluadas: <strong className="text-white">{recordedCount}</strong>
        </span>
        {pathologicalCount > 0 && (
          <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2.5 py-1 rounded-xl font-bold flex items-center space-x-1">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>{pathologicalCount} Patológicas / Foco Activo</span>
          </span>
        )}
        {observationCount > 0 && (
          <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-xl font-bold flex items-center space-x-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{observationCount} en Observación</span>
          </span>
        )}
        <span className="text-[11px] text-slate-500 ml-auto hidden sm:inline">
          💡 Haz clic en cualquier círculo del cuerpo para inspeccionar o editar la nota.
        </span>
      </div>

      {/* Grid: Left is Interactive Body Silhouette, Right is Region Detail Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Interactive Human Silhouette SVG */}
        <div className="lg:col-span-5 bg-gradient-to-b from-slate-950 via-[#071322] to-slate-950 border border-slate-800 rounded-3xl p-5 shadow-inner flex flex-col items-center justify-center relative min-h-[500px]">
          {/* Anatomical Title */}
          <div className="absolute top-4 left-4 z-10 flex items-center space-x-1.5 text-xs font-black text-cyan-400">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span className="uppercase tracking-wider">
              {activeView === 'anterior' ? 'Topografía Anterior' : 'Topografía Posterior'}
            </span>
          </div>

          {/* Silhouette SVG with Hotspots */}
          <div className="relative w-full max-w-[320px] aspect-[1/2] select-none my-2">
            <svg
              viewBox="0 0 100 200"
              className="w-full h-full filter drop-shadow-[0_0_15px_rgba(6,182,212,0.15)]"
            >
              {/* Human Silhouette Outline - High Quality Medical Vector */}
              <defs>
                <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#1e293b" />
                  <stop offset="50%" stopColor="#0f172a" />
                  <stop offset="100%" stopColor="#090d16" />
                </linearGradient>
                <linearGradient id="pulseGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#06b6d4" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
              </defs>

              {/* Head & Neck */}
              <ellipse cx="50" cy="18" rx="10" ry="12" fill="url(#bodyGrad)" stroke="#334155" strokeWidth="1" />
              <rect x="46" y="28" width="8" height="8" rx="2" fill="url(#bodyGrad)" stroke="#334155" strokeWidth="0.8" />

              {/* Torso */}
              <path
                d="M 36 36 Q 50 34 64 36 L 62 85 Q 50 87 38 85 Z"
                fill="url(#bodyGrad)"
                stroke="#334155"
                strokeWidth="1"
              />

              {/* Pelvis & Hips */}
              <path
                d="M 38 85 Q 50 87 62 85 L 65 110 L 50 115 L 35 110 Z"
                fill="url(#bodyGrad)"
                stroke="#334155"
                strokeWidth="1"
              />

              {/* Right Arm */}
              <path
                d="M 36 36 L 24 65 L 20 95 L 24 96 L 28 68 L 38 42 Z"
                fill="url(#bodyGrad)"
                stroke="#334155"
                strokeWidth="0.8"
              />

              {/* Left Arm */}
              <path
                d="M 64 36 L 76 65 L 80 95 L 76 96 L 72 68 L 62 42 Z"
                fill="url(#bodyGrad)"
                stroke="#334155"
                strokeWidth="0.8"
              />

              {/* Right Leg */}
              <path
                d="M 37 110 L 36 150 L 35 185 L 42 185 L 45 150 L 48 114 Z"
                fill="url(#bodyGrad)"
                stroke="#334155"
                strokeWidth="0.8"
              />

              {/* Left Leg */}
              <path
                d="M 63 110 L 64 150 L 65 185 L 58 185 L 55 150 L 52 114 Z"
                fill="url(#bodyGrad)"
                stroke="#334155"
                strokeWidth="0.8"
              />

              {/* Anatomical Grid lines for medical look */}
              <line x1="50" y1="6" x2="50" y2="194" stroke="#1e293b" strokeDasharray="2,2" strokeWidth="0.5" />
              <line x1="20" y1="56" x2="80" y2="56" stroke="#1e293b" strokeDasharray="2,2" strokeWidth="0.5" />
              <line x1="25" y1="100" x2="75" y2="100" stroke="#1e293b" strokeDasharray="2,2" strokeWidth="0.5" />

              {/* Interactive Hotspots for Current View */}
              {currentViewRegions.map((region) => {
                const finding = findings[region.id];
                const isSelected = selectedRegionId === region.id;
                
                // Color based on status
                let fillColor = 'rgba(30, 41, 59, 0.7)';
                let strokeColor = '#475569';
                let glowColor = 'rgba(71, 85, 105, 0.4)';

                if (finding) {
                  if (finding.status === 'pathological') {
                    fillColor = 'rgba(239, 68, 68, 0.75)';
                    strokeColor = '#f87171';
                    glowColor = 'rgba(239, 68, 68, 0.6)';
                  } else if (finding.status === 'observation') {
                    fillColor = 'rgba(245, 158, 11, 0.75)';
                    strokeColor = '#fbbf24';
                    glowColor = 'rgba(245, 158, 11, 0.6)';
                  } else {
                    fillColor = 'rgba(16, 185, 129, 0.75)';
                    strokeColor = '#34d399';
                    glowColor = 'rgba(16, 185, 129, 0.5)';
                  }
                }

                if (isSelected) {
                  strokeColor = '#38bdf8';
                  glowColor = 'rgba(56, 189, 248, 0.9)';
                }

                return (
                  <g
                    key={region.id}
                    onClick={() => setSelectedRegionId(region.id)}
                    className="cursor-pointer group"
                  >
                    {/* Pulsing ring if selected or pathological */}
                    {(isSelected || (finding && finding.status === 'pathological')) && (
                      <circle
                        cx={region.x}
                        cy={region.y}
                        r={region.radius + 3}
                        fill="none"
                        stroke={isSelected ? '#38bdf8' : '#ef4444'}
                        strokeWidth="1.5"
                        className="animate-ping opacity-75"
                      />
                    )}

                    {/* Outer glow ring */}
                    <circle
                      cx={region.x}
                      cy={region.y}
                      r={region.radius + 1.5}
                      fill="none"
                      stroke={strokeColor}
                      strokeWidth={isSelected ? '2' : '1'}
                      className="transition-all duration-200"
                    />

                    {/* Main region circle */}
                    <circle
                      cx={region.x}
                      cy={region.y}
                      r={region.radius}
                      fill={fillColor}
                      stroke={strokeColor}
                      strokeWidth="1"
                      className="group-hover:scale-110 transition-transform"
                    />

                    {/* Center marker text or dot */}
                    <circle
                      cx={region.x}
                      cy={region.y}
                      r={isSelected ? 3 : 2}
                      fill={isSelected ? '#ffffff' : strokeColor}
                    />
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Quick Legend at bottom */}
          <div className="flex flex-wrap items-center justify-center gap-3 text-[10px] text-slate-400 mt-2 bg-slate-900/80 px-3 py-1.5 rounded-full border border-slate-800">
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Normal</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>Observación</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span>Patológico</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-700" />
              <span>No evaluado</span>
            </span>
          </div>
        </div>

        {/* Right: Detailed Finding Editor for Selected Region */}
        <div className="lg:col-span-7 bg-slate-950/80 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-5">
          {/* Header of selected region */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{selectedRegion.icon}</span>
              <div>
                <span className="text-[10px] text-cyan-400 uppercase font-black tracking-wider block">
                  Región Seleccionada • {selectedRegion.category}
                </span>
                <h3 className="text-lg font-black text-white">
                  {selectedRegion.name}
                </h3>
              </div>
            </div>

            {findings[selectedRegion.id] && (
              <button
                type="button"
                onClick={() => handleClearFinding(selectedRegion.id)}
                className="px-2.5 py-1 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-slate-800 hover:border-rose-500/30 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center space-x-1"
                title="Eliminar registro de esta zona"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Borrar Registro</span>
              </button>
            )}
          </div>

          {/* Finding Severity Radio Selector */}
          <div>
            <label className="text-[11px] font-bold text-slate-300 block mb-2 uppercase tracking-wide">
              Estado Clínico del Área:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setFormStatus('normal')}
                className={`py-2 px-3 rounded-2xl border text-xs font-black transition cursor-pointer flex items-center justify-center space-x-2 ${
                  formStatus === 'normal'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500 shadow-md shadow-emerald-500/10'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Normal / Sano</span>
              </button>

              <button
                type="button"
                onClick={() => setFormStatus('observation')}
                className={`py-2 px-3 rounded-2xl border text-xs font-black transition cursor-pointer flex items-center justify-center space-x-2 ${
                  formStatus === 'observation'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500 shadow-md shadow-amber-500/10'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Observación / Leve</span>
              </button>

              <button
                type="button"
                onClick={() => setFormStatus('pathological')}
                className={`py-2 px-3 rounded-2xl border text-xs font-black transition cursor-pointer flex items-center justify-center space-x-2 ${
                  formStatus === 'pathological'
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500 shadow-md shadow-rose-500/10'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <span>Patológico / Foco</span>
              </button>
            </div>
          </div>

          {/* Quick Phrase Chips tailored to this anatomical zone */}
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              ⚡ Frases Rápidas Sugeridas para {selectedRegion.name}:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {selectedRegion.quickOptions.map((opt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleAddQuickOption(opt)}
                  className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 border border-slate-800 hover:border-cyan-500/40 rounded-xl text-xs transition cursor-pointer text-left"
                >
                  + {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Notes Textarea (Unlimited paragraphs!) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <label className="font-bold text-slate-200">
                Detalles Clínicos & Hallazgos Específicos:
              </label>
              <span className="text-slate-500 font-mono text-[10px]">
                Sin límite de texto • Presione Enter para nuevos párrafos
              </span>
            </div>
            <textarea
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              placeholder={`Describa hallazgos a la inspección, palpación, percusión o auscultación en ${selectedRegion.name}...`}
              rows={4}
              className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-500 rounded-2xl p-3 text-white text-xs leading-relaxed focus:outline-none transition resize-y min-h-[90px]"
            />
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="text-[11px] text-slate-400">
              {findings[selectedRegion.id] ? (
                <span>Última actualización: <strong className="text-slate-300">{new Date(findings[selectedRegion.id].updatedAt).toLocaleTimeString('es-PA')}</strong></span>
              ) : (
                <span>Sin guardar aún para esta zona</span>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleSaveFinding}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-black rounded-xl text-xs shadow-lg shadow-cyan-600/20 transition cursor-pointer flex items-center space-x-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Guardar Hallazgo en esta Zona</span>
              </button>
            </div>
          </div>

          {/* All recorded regions summary list */}
          {recordedCount > 0 && (
            <div className="pt-3 border-t border-slate-900 space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                📋 Registro Activo en este Paciente ({recordedCount} zonas documentadas):
              </span>
              <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                {Object.values(findings).map((f) => (
                  <div
                    key={f.regionId}
                    onClick={() => {
                      setSelectedRegionId(f.regionId);
                      setActiveView(f.view);
                    }}
                    className={`p-2 rounded-xl border text-xs cursor-pointer transition flex items-center justify-between ${
                      selectedRegionId === f.regionId
                        ? 'bg-slate-900 border-cyan-500/50 text-white'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center space-x-2 truncate">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${
                        f.status === 'pathological' ? 'bg-rose-500' : f.status === 'observation' ? 'bg-amber-500' : 'bg-emerald-500'
                      }`} />
                      <span className="font-bold text-slate-200 truncate">{f.regionName}</span>
                      <span className="text-[10px] text-slate-500 truncate hidden sm:inline">
                        — {f.notes.slice(0, 45)}...
                      </span>
                    </div>
                    <span className="text-[10px] text-cyan-400 font-mono shrink-0 ml-2">
                      Ver / Editar →
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
