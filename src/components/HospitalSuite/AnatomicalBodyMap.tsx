import React, { useState, useEffect, useMemo } from 'react';
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
  ShieldAlert,
  Search,
  Crosshair,
  Eye,
  Sliders,
  Maximize2
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
  onInsertIntoSoap?: (text: string, navigateToSoap?: boolean) => void;
}

interface RegionDefinition {
  id: string;
  name: string;
  category: 'Cabeza y Cuello' | 'Tórax y Cardíaco' | 'Abdomen y Pelvis' | 'Extremidades' | 'Columna y Dorso';
  view: 'anterior' | 'posterior';
  x: number; // ViewBox coordinates (0-200)
  y: number; // ViewBox coordinates (0-400)
  icon: string;
  quickOptions: string[];
}

const BODY_REGIONS: RegionDefinition[] = [
  // ==========================================
  // --- VISTA ANTERIOR (FRONTAL) ---
  // ==========================================
  {
    id: 'cabeza_cara',
    name: 'Cabeza, Cráneo y Rostro',
    category: 'Cabeza y Cuello',
    view: 'anterior',
    x: 100,
    y: 34,
    icon: '🧠',
    quickOptions: [
      'Normocéfalo, sin hematomas ni lesiones visibles',
      'Pupilas isocóricas, normorreactivas a la luz',
      'Facies álgica / Expresión de dolor agudo',
      'Mucosas orales húmedas y normocoloreadas',
      'Escleras anictéricas, sin conjuntivitis'
    ]
  },
  {
    id: 'cuello',
    name: 'Cuello & Glándula Tiroides',
    category: 'Cabeza y Cuello',
    view: 'anterior',
    x: 100,
    y: 62,
    icon: '🧣',
    quickOptions: [
      'Cuello móvil, simétrico, sin adenopatías palpables',
      'Ingurgitación yugular ausente a 45°',
      'Tiroides no palpable, sin bocio ni nódulos',
      'Pulsos carotídeos simétricos sin soplos audibles',
      'Rigidez de nuca ausente (Signos meníngeos negativos)'
    ]
  },
  {
    id: 'torax_pulmones',
    name: 'Tórax & Campos Pulmonares',
    category: 'Tórax y Cardíaco',
    view: 'anterior',
    x: 88,
    y: 92,
    icon: '🫁',
    quickOptions: [
      'Murmullo vesicular bilateralmente conservado',
      'Sin ruidos adventicios, sibilancias ni crepitantes',
      'Sibilancias espiratorias bilaterales difusas',
      'Crepitantes basales bilaterales sugestivos de congestión',
      'Tórax simétrico, adecuada expansibilidad inspiratoria'
    ]
  },
  {
    id: 'precordio_cardiaco',
    name: 'Área Precordial / Cardíaca',
    category: 'Tórax y Cardíaco',
    view: 'anterior',
    x: 114,
    y: 104,
    icon: '❤️',
    quickOptions: [
      'Ruidos cardíacos rítmicos normofonéticos sin soplos',
      'Sin soplos, galope ni frote pericárdico',
      'Soplo sistólico grado II/VI en foco aórtico',
      'Taquicardia rítmica regular de reposo',
      'Latido de punta localizado en 5to espacio intercostal'
    ]
  },
  {
    id: 'epigastrio_superior',
    name: 'Epigastrio & Hipocondrio Derecho',
    category: 'Abdomen y Pelvis',
    view: 'anterior',
    x: 100,
    y: 130,
    icon: '🥩',
    quickOptions: [
      'Epigastrio blando, depresible, no doloroso',
      'Dolor urente epigástrico con acidez gástrica',
      'Signo de Murphy NEGATIVO (sin inflamación vesicular)',
      'Signo de Murphy POSITIVO en hipocondrio derecho',
      'Hepatomegalia ausente, borde hepático liso'
    ]
  },
  {
    id: 'fosa_iliaca_derecha',
    name: 'Fosa Ilíaca Derecha (FID / Apéndice)',
    category: 'Abdomen y Pelvis',
    view: 'anterior',
    x: 84,
    y: 158,
    icon: '⚠️',
    quickOptions: [
      'Signo de McBurney POSITIVO (dolor agudo en FID)',
      'Signo de Blumberg (+) / Rebote positivo peritoneal',
      'Defensa muscular involuntaria en cuadrante inferior',
      'Signo de Rovsing positivo',
      'FID libre, blanda, depresible sin dolor a la palpación'
    ]
  },
  {
    id: 'mesogastrio_fii',
    name: 'Mesogastrio, Flancos y FII',
    category: 'Abdomen y Pelvis',
    view: 'anterior',
    x: 118,
    y: 158,
    icon: '🌀',
    quickOptions: [
      'Ruidos hidroaéreos (RHA) presentes y normoactivos',
      'RHA disminuidos / Silencio abdominal relativo',
      'Abdomen distendido, timpánico en marco colónico',
      'Dolor cólico difuso sin irritación peritoneal',
      'Fosa ilíaca izquierda blanda y depresible'
    ]
  },
  {
    id: 'pelvis_hipogastrio',
    name: 'Hipogastrio, Pelvis & Región Inguinal',
    category: 'Abdomen y Pelvis',
    view: 'anterior',
    x: 100,
    y: 180,
    icon: '🩲',
    quickOptions: [
      'Hipogastrio blando, sin globo vesical palpable',
      'Dolor suprapúbico leve a la palpación profunda',
      'Orificios herniarios inguinales libres sin masas',
      'Puntos ureterales inferiores negativos',
      'Piel suprapúbica íntegra sin lesiones'
    ]
  },
  {
    id: 'hombro_brazo_derecho',
    name: 'Hombro & Brazo Derecho',
    category: 'Extremidades',
    view: 'anterior',
    x: 48,
    y: 92,
    icon: '💪',
    quickOptions: [
      'Pulsos braquial y radial palpables y simétricos',
      'Llenado capilar distal menor a 2 segundos',
      'Movilidad articular y fuerza muscular 5/5',
      'Catéter venoso periférico permeable sin flebitis',
      'Sin edemas, eritema ni limitación funcional'
    ]
  },
  {
    id: 'hombro_brazo_izquierdo',
    name: 'Hombro & Brazo Izquierdo',
    category: 'Extremidades',
    view: 'anterior',
    x: 152,
    y: 92,
    icon: '💪',
    quickOptions: [
      'Pulsos distales conservados y simétricos',
      'Llenado capilar menor a 2 segundos',
      'Fuerza muscular conservada en todo el arco de movimiento',
      'Sin lesiones dérmicas ni deformidades',
      'Eutrófico, sensibilidad táctil íntegra'
    ]
  },
  {
    id: 'mano_derecha',
    name: 'Muñeca y Mano Derecha',
    category: 'Extremidades',
    view: 'anterior',
    x: 34,
    y: 194,
    icon: '✋',
    quickOptions: [
      'Sin deformidades articulares, prensión palmar fuerte',
      'Pulsos radial y cubital simétricos',
      'Signo de Tinel y Phalen negativos',
      'Uñas rosadas sin acropaquia ni cianosis'
    ]
  },
  {
    id: 'mano_izquierda',
    name: 'Muñeca y Mano Izquierda',
    category: 'Extremidades',
    view: 'anterior',
    x: 166,
    y: 194,
    icon: '✋',
    quickOptions: [
      'Prensión simétrica y sensibilidad distal conservada',
      'Sin signos de artritis ni inflamación interfalángica',
      'Llenado capilar lecho ungueal < 2s'
    ]
  },
  {
    id: 'muslo_rodilla_derecha',
    name: 'Muslo y Rodilla Derecha',
    category: 'Extremidades',
    view: 'anterior',
    x: 82,
    y: 260,
    icon: '🦵',
    quickOptions: [
      'Sin derrame articular ni choque rotuliano en rodilla',
      'Fuerza cuadricipital conservada (5/5)',
      'Reflejo rotuliano normorreflexico (+2/4)',
      'Sin dolor a la flexoextensión de rodilla',
      'Sin edemas pretibiales ni hematomas'
    ]
  },
  {
    id: 'muslo_rodilla_izquierda',
    name: 'Muslo y Rodilla Izquierda',
    category: 'Extremidades',
    view: 'anterior',
    x: 118,
    y: 260,
    icon: '🦵',
    quickOptions: [
      'Articulación de rodilla estable, sin crepitación',
      'Fuerza muscular simétrica con miembro contralateral',
      'Reflejo patelar conservado',
      'Piel íntegra sin lesiones eritematosas'
    ]
  },
  {
    id: 'pie_tobillo_derecho',
    name: 'Tobillo y Pie Derecho',
    category: 'Extremidades',
    view: 'anterior',
    x: 82,
    y: 366,
    icon: '🦶',
    quickOptions: [
      'Pulsos pedio y tibial posterior palpables y rítmicos',
      'Edema con fóvea ausente (Grado 0)',
      'Edema periférico pretibial Grado I-II (+/++++)',
      'Signo de Homans negativo (descarta TVP distal)',
      'Marcha y apoyo plantar estable'
    ]
  },
  {
    id: 'pie_tobillo_izquierdo',
    name: 'Tobillo y Pie Izquierdo',
    category: 'Extremidades',
    view: 'anterior',
    x: 118,
    y: 366,
    icon: '🦶',
    quickOptions: [
      'Pulsos distales palpables, temperatura simétrica',
      'Sin edema ni cianosis periférica',
      'Sensibilidad vibratoria y monofilamento conservada',
      'Sin úlceras plantares ni lesiones dérmicas'
    ]
  },

  // ==========================================
  // --- VISTA POSTERIOR (DORSAL) ---
  // ==========================================
  {
    id: 'columna_cervical_nuca',
    name: 'Nuca y Columna Cervical',
    category: 'Columna y Dorso',
    view: 'posterior',
    x: 100,
    y: 52,
    icon: '🦴',
    quickOptions: [
      'Columna cervical no dolorosa a la palpación de apófisis',
      'Arcos de movilidad (flexión, extensión, rotación) libres',
      'Contractura paravertebral cervical bilateral leve',
      'Sin dolor radicular en miembros superiores',
      'Puntos de Arnold no dolorosos'
    ]
  },
  {
    id: 'espalda_toracica',
    name: 'Dorso & Campos Pulmonares Posteriores',
    category: 'Columna y Dorso',
    view: 'posterior',
    x: 100,
    y: 100,
    icon: '🫁',
    quickOptions: [
      'Murmullo vesicular bilateralmente conservado en bases',
      'Vibraciones vocales transmitidas simétricamente',
      'Dolor paravertebral interescapular a la digitopresión',
      'Escápulas simétricas sin discinesia escapulotorácica',
      'Sin dolor a la percusión torácica posterior'
    ]
  },
  {
    id: 'fosas_renales_lumbar',
    name: 'Región Lumbar & Fosas Renales',
    category: 'Columna y Dorso',
    view: 'posterior',
    x: 100,
    y: 142,
    icon: '🫘',
    quickOptions: [
      'Puño-percusión lumbar de Giordano NEGATIVA bilateral',
      'Giordano POSITIVO franco en fosa renal derecha',
      'Giordano POSITIVO franco en fosa renal izquierda',
      'Contractura paravertebral lumbar por esfuerzo',
      'Maniobra de Lasègue negativa (sin ciatalgia)'
    ]
  },
  {
    id: 'gluteos_sacro',
    name: 'Región Sacroilíaca y Glúteos',
    category: 'Columna y Dorso',
    view: 'posterior',
    x: 100,
    y: 178,
    icon: '🩹',
    quickOptions: [
      'Piel sacra íntegra, sin úlceras por presión (UPP Grado 0)',
      'Eritema no blanqueable en sacro (UPP Grado I incipiente)',
      'Articulaciones sacroilíacas indoloras a la compresión',
      'Masa muscular glútea simétrica y eutrófica',
      'Sin hematomas en zonas de punción intramuscular'
    ]
  },
  {
    id: 'extremidades_posteriores',
    name: 'Huecos Poplíteos & Pantorrillas',
    category: 'Extremidades',
    view: 'posterior',
    x: 100,
    y: 290,
    icon: '👟',
    quickOptions: [
      'Tendones de Aquiles íntegros, indoloros a la palpación',
      'Pantorrillas blandas, depresibles, no dolorosas',
      'Empastamiento gemelar ausente (descarta TVP posterior)',
      'Sin cordones venosos varicosos palpables ni flebitis',
      'Pulsos poplíteos palpables bilaterales'
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
  const [isSavedRecently, setIsSavedRecently] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('TODAS');
  const [showSkeletonLayer, setShowSkeletonLayer] = useState<boolean>(true);
  const [hoveredRegionId, setHoveredRegionId] = useState<string | null>(null);

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
        notes: 'Dolor agudo a la palpación en punto de McBurney. Signo de rebote peritoneal (Blumberg) positivo. Ruidos hidroaéreos disminuidos en cuadrante inferior derecho.',
        quickTags: ['Signo de McBurney POSITIVO', 'Signo de Blumberg (+)'],
        updatedAt: new Date().toISOString()
      },
      torax_pulmones: {
        regionId: 'torax_pulmones',
        regionName: 'Tórax & Campos Pulmonares',
        view: 'anterior',
        status: 'normal',
        notes: 'Murmullo vesicular conservado bilateralmente sin sobreagregados. Buena expansibilidad torácica.',
        quickTags: ['Murmullo vesicular bilateralmente conservado'],
        updatedAt: new Date().toISOString()
      },
      precordio_cardiaco: {
        regionId: 'precordio_cardiaco',
        regionName: 'Área Precordial / Cardíaca',
        view: 'anterior',
        status: 'normal',
        notes: 'Ruidos cardíacos rítmicos normofonéticos. Sin soplos ni galope.',
        quickTags: ['Ruidos cardíacos rítmicos normofonéticos sin soplos'],
        updatedAt: new Date().toISOString()
      }
    };

    setFindings(initialData);
  }, [patientId, storageKey]);

  const saveFindings = (updated: Record<string, AnatomicalFinding>) => {
    setFindings(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const selectedRegion = useMemo(() => {
    return BODY_REGIONS.find((r) => r.id === selectedRegionId) || BODY_REGIONS[0];
  }, [selectedRegionId]);

  // Form states for the selected region
  const [formStatus, setFormStatus] = useState<AnatomicalFinding['status']>('normal');
  const [formNotes, setFormNotes] = useState<string>('');
  const [formTags, setFormTags] = useState<string[]>([]);

  useEffect(() => {
    const existing = findings[selectedRegion.id];
    if (existing) {
      setFormStatus(existing.status);
      setFormNotes(existing.notes);
      setFormTags(existing.quickTags || []);
    } else {
      setFormStatus('normal');
      setFormNotes('');
      setFormTags([]);
    }
  }, [selectedRegion.id, findings]);

  const generateSoapObjectiveSummary = (customFindings?: Record<string, AnatomicalFinding>) => {
    const findingList = Object.values(customFindings || findings) as AnatomicalFinding[];
    if (findingList.length === 0) {
      return '[HALLAZGOS DEL MAPA CORPORAL ANATÓMICO]:\nExamen físico topográfico: Sin hallazgos anatómicos específicos registrados.';
    }

    const lines: string[] = ['[HALLAZGOS DEL MAPA CORPORAL ANATÓMICO]:'];
    findingList.forEach((item) => {
      const statusIcon = item.status === 'pathological' ? '🚨 [PATOLÓGICO]' : item.status === 'observation' ? '⚠️ [EN OBSERVACIÓN]' : '✅ [NORMAL]';
      lines.push(`• ${item.regionName} ${statusIcon}: ${item.notes || 'Evaluado sin alteraciones reportadas.'}`);
    });

    return lines.join('\n');
  };

  const handleSaveCurrentFinding = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const updated: Record<string, AnatomicalFinding> = {
      ...findings,
      [selectedRegion.id]: {
        regionId: selectedRegion.id,
        regionName: selectedRegion.name,
        view: selectedRegion.view,
        status: formStatus,
        notes: formNotes.trim() || 'Evaluado dentro de límites anatómicos normales.',
        quickTags: formTags,
        updatedAt: new Date().toISOString()
      }
    };

    saveFindings(updated);
    setIsSavedRecently(true);
    setTimeout(() => setIsSavedRecently(false), 3000);

    // Sincronizar automáticamente con el expediente SOAP (sin forzar cambio de pestaña)
    if (onInsertIntoSoap) {
      const summary = generateSoapObjectiveSummary(updated);
      onInsertIntoSoap(summary, false);
    }

    window.dispatchEvent(
      new CustomEvent('lis-global-toast', {
        detail: {
          title: 'Exploración Guardada',
          message: `${selectedRegion.name}: Marcado como ${formStatus.toUpperCase()} y sincronizado con Historia Clínica.`,
          type: formStatus === 'pathological' ? 'warning' : 'success'
        }
      })
    );
  };

  const handleSaveAndTransferToSoap = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const updated: Record<string, AnatomicalFinding> = {
      ...findings,
      [selectedRegion.id]: {
        regionId: selectedRegion.id,
        regionName: selectedRegion.name,
        view: selectedRegion.view,
        status: formStatus,
        notes: formNotes.trim() || 'Evaluado dentro de límites anatómicos normales.',
        quickTags: formTags,
        updatedAt: new Date().toISOString()
      }
    };

    saveFindings(updated);
    setIsSavedRecently(true);
    setTimeout(() => setIsSavedRecently(false), 3000);

    // Sincronizar y navegar a la pestaña SOAP
    if (onInsertIntoSoap) {
      const summary = generateSoapObjectiveSummary(updated);
      onInsertIntoSoap(summary, true);
      setIsCopiedToSoap(true);
      setTimeout(() => setIsCopiedToSoap(false), 3000);
      window.dispatchEvent(
        new CustomEvent('lis-global-toast', {
          detail: {
            title: 'Guardado y Transferido a SOAP',
            message: `Hallazgo de ${selectedRegion.name} insertado en el campo Objetivo [O] de la nota SOAP.`,
            type: 'success'
          }
        })
      );
    }
  };

  const handleClearFinding = (regionId: string) => {
    const updated = { ...findings };
    delete updated[regionId];
    saveFindings(updated);
    setFormNotes('');
    setFormTags([]);
    setFormStatus('normal');

    if (onInsertIntoSoap) {
      const summary = generateSoapObjectiveSummary(updated);
      onInsertIntoSoap(summary, false);
    }
  };

  const handleAddQuickOption = (opt: string) => {
    if (!formTags.includes(opt)) {
      setFormTags([...formTags, opt]);
    }
    setFormNotes((prev) => (prev ? `${prev}. ${opt}` : opt));
  };

  const handleTransferToSoap = () => {
    const summary = generateSoapObjectiveSummary();
    if (onInsertIntoSoap) {
      onInsertIntoSoap(summary, true);
      setIsCopiedToSoap(true);
      setTimeout(() => setIsCopiedToSoap(false), 3000);
      window.dispatchEvent(
        new CustomEvent('lis-global-toast', {
          detail: {
            title: 'Transferido al Expediente',
            message: 'Hallazgos anatómicos insertados en el campo Objetivo [O] de la nota SOAP.',
            type: 'success'
          }
        })
      );
    }
  };

  // Filter visible regions for current view
  const currentViewRegions = useMemo(() => {
    return BODY_REGIONS.filter((r) => {
      if (r.view !== activeView) return false;
      if (selectedCategoryFilter !== 'TODAS' && r.category !== selectedCategoryFilter) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        return r.name.toLowerCase().includes(q) || r.category.toLowerCase().includes(q);
      }
      return true;
    });
  }, [activeView, selectedCategoryFilter, searchTerm]);

  // Statistics
  const recordedCount = Object.keys(findings).length;
  const pathologicalCount = (Object.values(findings) as AnatomicalFinding[]).filter((f) => f.status === 'pathological').length;
  const observationCount = (Object.values(findings) as AnatomicalFinding[]).filter((f) => f.status === 'observation').length;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-6">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-inner">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                Mapa Corporal Anatómico Digital
              </h2>
              <span className="text-[10px] bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 px-2.5 py-0.5 rounded-full font-bold">
                Exploración Física Topográfica
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Inspección anatómica interactiva para <strong className="text-white">{patientName}</strong>. Registro focalizado de signos físicos e inserción directa a la evolución clínica.
            </p>
          </div>
        </div>

        {/* View Switcher: Anterior vs Posterior */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="bg-slate-950 p-1 rounded-2xl border border-slate-800 flex items-center">
            <button
              type="button"
              onClick={() => setActiveView('anterior')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 ${
                activeView === 'anterior'
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30 font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Vista Anterior (Frontal)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveView('posterior')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 ${
                activeView === 'posterior'
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30 font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Vista Posterior (Dorsal)</span>
            </button>
          </div>

          {/* Transfer button to SOAP */}
          <button
            type="button"
            onClick={handleTransferToSoap}
            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black rounded-xl shadow-lg shadow-teal-500/20 transition cursor-pointer flex items-center space-x-1.5 uppercase tracking-wider"
            title="Copiar todos los hallazgos al campo Objetivo de la Nota SOAP"
          >
            {isCopiedToSoap ? <Check className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
            <span>{isCopiedToSoap ? '¡Insertado en SOAP!' : 'Insertar en Objetivo SOAP'}</span>
          </button>
        </div>
      </div>

      {/* Clinical Status Stats Pill */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-bold text-slate-400">Resumen Clínico:</span>
          <span className="bg-slate-900 text-slate-300 border border-slate-700 px-2.5 py-1 rounded-xl font-mono text-[11px]">
            Regiones Evaluadas: <strong className="text-white">{recordedCount}</strong> / {BODY_REGIONS.length}
          </span>
          {pathologicalCount > 0 && (
            <span className="bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2.5 py-1 rounded-xl font-black text-[11px] flex items-center space-x-1.5 animate-pulse">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>{pathologicalCount} Focos Patológicos Activos</span>
            </span>
          )}
          {observationCount > 0 && (
            <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-1 rounded-xl font-bold text-[11px] flex items-center space-x-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{observationCount} en Observación</span>
            </span>
          )}
        </div>

        {/* Capas y Guías Clínicas */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setShowSkeletonLayer(!showSkeletonLayer)}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition flex items-center space-x-1 cursor-pointer ${
              showSkeletonLayer
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                : 'bg-slate-900 text-slate-500 border-slate-800'
            }`}
          >
            <Layers className="w-3 h-3" />
            <span>{showSkeletonLayer ? 'Guías Anatómicas Activas' : 'Guías Ocultas'}</span>
          </button>
        </div>
      </div>

      {/* Grid: Left is Medical Vector Anatomy Figure, Right is Inspection Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Professional Vector Silhouette & Hotspot Nodes */}
        <div className="lg:col-span-6 bg-gradient-to-b from-slate-950 via-[#071322] to-slate-950 border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col items-center justify-center relative min-h-[580px] overflow-hidden">
          {/* Subtle medical scanning grid backdrop */}
          <div className="absolute inset-0 bg-[radial-gradient(#0284c7_1px,transparent_1px)] [background-size:16px_16px] opacity-15 pointer-events-none" />

          {/* Topographical HUD Title */}
          <div className="absolute top-4 left-4 z-10 flex items-center space-x-2 text-xs font-black text-cyan-400">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            <span className="uppercase tracking-widest font-mono text-[11px]">
              {activeView === 'anterior' ? 'TOPOGRAFÍA ANTERIOR (NORMA FRONTALIS)' : 'TOPOGRAFÍA POSTERIOR (NORMA DORSALIS)'}
            </span>
          </div>

          <div className="absolute top-4 right-4 z-10 flex items-center space-x-1 text-[10px] text-slate-400 bg-slate-950/80 px-2 py-1 rounded-lg border border-slate-800 font-mono">
            <Crosshair className="w-3 h-3 text-cyan-400" />
            <span>CALIBRACIÓN 1:1</span>
          </div>

          {/* HIGH-FIDELITY MEDICAL ANATOMICAL VECTOR */}
          <div className="relative w-full max-w-[340px] aspect-[1/2] select-none my-3 z-10">
            <svg
              viewBox="0 0 200 400"
              className="w-full h-full filter drop-shadow-[0_0_25px_rgba(6,182,212,0.2)]"
            >
              <defs>
                {/* Body Depth Gradient */}
                <linearGradient id="medBodyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#1e293b" />
                  <stop offset="40%" stopColor="#0f172a" />
                  <stop offset="100%" stopColor="#070c14" />
                </linearGradient>

                {/* Accent Rim Light */}
                <linearGradient id="bodyRimLight" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
                  <stop offset="50%" stopColor="#1e293b" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.8" />
                </linearGradient>

                {/* Pathological Pulse */}
                <radialGradient id="pathoGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* ======================================================= */}
              {/* VISTA ANTERIOR: SILUETA ANATÓMICA ORGÁNICA DE ALTA DEFINICIÓN */}
              {/* ======================================================= */}
              {activeView === 'anterior' ? (
                <g id="anterior_anatomy_group">
                  {/* Calibrated Anatomical Baseline Contour */}
                  <path
                    d="
                      M 100 12
                      C 86 12 76 22 76 34
                      C 76 44 82 52 88 56
                      C 89 60 88 64 88 68
                      C 80 72 68 76 56 82
                      C 50 86 46 94 44 104
                      L 38 144
                      C 36 156 34 170 32 186
                      C 30 196 32 206 38 208
                      C 42 208 44 200 46 190
                      L 52 152
                      C 56 136 60 126 62 118
                      C 62 128 66 142 70 156
                      C 74 168 76 178 78 186
                      C 78 190 76 194 74 200
                      L 68 250
                      C 66 266 66 280 68 300
                      C 70 324 72 348 72 366
                      C 72 374 74 382 78 386
                      C 84 388 90 388 92 384
                      C 94 378 94 366 92 352
                      L 90 310
                      C 88 284 88 264 92 248
                      L 96 208
                      C 98 198 100 194 100 190
                      C 100 194 102 198 104 208
                      L 108 248
                      C 112 264 112 284 110 310
                      L 108 352
                      C 106 366 106 378 108 384
                      C 110 388 116 388 122 386
                      C 126 382 128 374 128 366
                      C 128 348 130 324 132 300
                      C 134 280 134 266 132 250
                      L 126 200
                      C 124 194 122 190 122 186
                      C 124 178 126 168 130 156
                      C 134 142 138 128 138 118
                      C 140 126 144 136 148 152
                      L 154 190
                      C 156 200 158 208 162 208
                      C 168 206 170 196 168 186
                      C 166 170 164 156 162 144
                      L 156 104
                      C 154 94 150 86 144 82
                      C 132 76 120 72 112 68
                      C 112 64 111 60 112 56
                      C 118 52 124 44 124 34
                      C 124 22 114 12 100 12
                      Z
                    "
                    fill="url(#medBodyGradient)"
                    stroke="#0284c7"
                    strokeWidth="1.2"
                    className="transition-all duration-300"
                  />

                  {/* Anatomical Structure & Bone Landmarks (High-Tech Clinical Overlay) */}
                  {showSkeletonLayer && (
                    <g id="anterior_skeleton_guides" stroke="#38bdf8" strokeWidth="0.8" fill="none" opacity="0.35">
                      {/* Clavicles */}
                      <path d="M 100 68 C 90 68 76 72 64 74" strokeDasharray="2,2" />
                      <path d="M 100 68 C 110 68 124 72 136 74" strokeDasharray="2,2" />

                      {/* Sternum Line */}
                      <line x1="100" y1="68" x2="100" y2="120" strokeWidth="1" />

                      {/* Pectoral Curves */}
                      <path d="M 72 100 C 82 106 94 104 100 96" />
                      <path d="M 128 100 C 118 106 106 104 100 96" />

                      {/* Costal Margins (Arco Costal) */}
                      <path d="M 100 120 C 88 128 78 140 74 150" strokeDasharray="3,3" />
                      <path d="M 100 120 C 112 128 122 140 126 150" strokeDasharray="3,3" />

                      {/* Umbilicus (Ombligo) */}
                      <circle cx="100" cy="154" r="1.5" fill="#38bdf8" opacity="0.6" />

                      {/* Inguinal Ligaments */}
                      <path d="M 76 174 C 86 182 96 188 100 190" strokeDasharray="2,2" />
                      <path d="M 124 174 C 114 182 104 188 100 190" strokeDasharray="2,2" />

                      {/* Patellae (Rótulas) */}
                      <ellipse cx="82" cy="260" rx="4" ry="5" strokeDasharray="2,1" />
                      <ellipse cx="118" cy="260" rx="4" ry="5" strokeDasharray="2,1" />
                    </g>
                  )}
                </g>
              ) : (
                /* ======================================================= */
                /* VISTA POSTERIOR: SILUETA DORSAL CON COLUMNA Y ESCÁPULAS */
                /* ======================================================= */
                <g id="posterior_anatomy_group">
                  <path
                    d="
                      M 100 12
                      C 86 12 76 22 76 34
                      C 76 44 82 52 88 56
                      C 89 60 88 64 88 68
                      C 80 72 68 76 56 82
                      C 50 86 46 94 44 104
                      L 38 144
                      C 36 156 34 170 32 186
                      C 30 196 32 206 38 208
                      C 42 208 44 200 46 190
                      L 52 152
                      C 56 136 60 126 62 118
                      C 62 128 66 142 70 156
                      C 74 168 76 178 78 186
                      C 78 190 76 194 74 200
                      L 68 250
                      C 66 266 66 280 68 300
                      C 70 324 72 348 72 366
                      C 72 374 74 382 78 386
                      C 84 388 90 388 92 384
                      C 94 378 94 366 92 352
                      L 90 310
                      C 88 284 88 264 92 248
                      L 96 208
                      C 98 198 100 194 100 190
                      C 100 194 102 198 104 208
                      L 108 248
                      C 112 264 112 284 110 310
                      L 108 352
                      C 106 366 106 378 108 384
                      C 110 388 116 388 122 386
                      C 126 382 128 374 128 366
                      C 128 348 130 324 132 300
                      C 134 280 134 266 132 250
                      L 126 200
                      C 124 194 122 190 122 186
                      C 124 178 126 168 130 156
                      C 134 142 138 128 138 118
                      C 140 126 144 136 148 152
                      L 154 190
                      C 156 200 158 208 162 208
                      C 168 206 170 196 168 186
                      C 166 170 164 156 162 144
                      L 156 104
                      C 154 94 150 86 144 82
                      C 132 76 120 72 112 68
                      C 112 64 111 60 112 56
                      C 118 52 124 44 124 34
                      C 124 22 114 12 100 12
                      Z
                    "
                    fill="url(#medBodyGradient)"
                    stroke="#0284c7"
                    strokeWidth="1.2"
                  />

                  {/* Posterior Skeletal: Vertebral Column & Scapulae */}
                  {showSkeletonLayer && (
                    <g id="posterior_skeleton_guides" stroke="#38bdf8" strokeWidth="0.8" fill="none" opacity="0.4">
                      {/* Spine (Columna Vertebral Completa) */}
                      <line x1="100" y1="52" x2="100" y2="182" strokeWidth="1.2" strokeDasharray="3,1.5" />

                      {/* Scapulae (Escápulas / Omóplatos) */}
                      <path d="M 76 86 L 68 112 L 86 110 Z" strokeDasharray="2,2" />
                      <path d="M 124 86 L 132 112 L 114 110 Z" strokeDasharray="2,2" />

                      {/* Gluteal Cleft & Curves */}
                      <path d="M 100 182 L 100 206" strokeWidth="1" />
                      <path d="M 78 186 C 88 196 96 202 100 206" />
                      <path d="M 122 186 C 112 196 104 202 100 206" />

                      {/* Popliteal Fossa (Hueco Poplíteo) */}
                      <path d="M 76 262 C 82 266 88 266 94 262" strokeDasharray="2,2" />
                      <path d="M 106 262 C 112 266 118 266 124 262" strokeDasharray="2,2" />
                    </g>
                  )}
                </g>
              )}

              {/* ======================================================= */}
              {/* MEDICAL TARGET HOTSPOTS: PRECISION COMPACT BEACONS     */}
              {/* ======================================================= */}
              {currentViewRegions.map((region) => {
                const finding = findings[region.id];
                const isSelected = selectedRegionId === region.id;
                const isHovered = hoveredRegionId === region.id;

                // Color based on status
                let coreColor = '#38bdf8';
                let ringColor = 'rgba(56, 189, 248, 0.4)';
                let isCritical = false;

                if (finding) {
                  if (finding.status === 'pathological') {
                    coreColor = '#ef4444';
                    ringColor = 'rgba(239, 68, 68, 0.5)';
                    isCritical = true;
                  } else if (finding.status === 'observation') {
                    coreColor = '#f59e0b';
                    ringColor = 'rgba(245, 158, 11, 0.5)';
                  } else {
                    coreColor = '#10b981';
                    ringColor = 'rgba(16, 185, 129, 0.4)';
                  }
                }

                if (isSelected) {
                  ringColor = '#38bdf8';
                }

                return (
                  <g
                    key={region.id}
                    onClick={() => setSelectedRegionId(region.id)}
                    onMouseEnter={() => setHoveredRegionId(region.id)}
                    onMouseLeave={() => setHoveredRegionId(null)}
                    className="cursor-pointer group"
                  >
                    {/* Animated Ripple for Pathological or Selected Node */}
                    {(isSelected || isCritical) && (
                      <circle
                        cx={region.x}
                        cy={region.y}
                        r={isSelected ? 10 : 8}
                        fill="none"
                        stroke={isCritical ? '#ef4444' : '#38bdf8'}
                        strokeWidth="1"
                        className="animate-ping opacity-60"
                      />
                    )}

                    {/* Outer Focus Micro-Ring */}
                    <circle
                      cx={region.x}
                      cy={region.y}
                      r={isSelected || isHovered ? 7.5 : 5.5}
                      fill="rgba(15, 23, 42, 0.85)"
                      stroke={isSelected ? '#38bdf8' : ringColor}
                      strokeWidth={isSelected ? 1.5 : 1}
                      className="transition-all duration-200"
                    />

                    {/* Core Precision Illuminated Pin */}
                    <circle
                      cx={region.x}
                      cy={region.y}
                      r={isSelected || isHovered ? 3.5 : 2.5}
                      fill={coreColor}
                      className="transition-all duration-200"
                    />

                    {/* Active Selected Leader Callout HUD */}
                    {isSelected && (
                      <g className="animate-in fade-in duration-150">
                        <line
                          x1={region.x}
                          y1={region.y}
                          x2={region.x > 100 ? region.x + 22 : region.x - 22}
                          y2={region.y - 12}
                          stroke="#38bdf8"
                          strokeWidth="1"
                          strokeDasharray="2,2"
                        />
                        <rect
                          x={region.x > 100 ? region.x + 22 : region.x - 74}
                          y={region.y - 20}
                          width="52"
                          height="14"
                          rx="4"
                          fill="#0f172a"
                          stroke="#38bdf8"
                          strokeWidth="0.8"
                        />
                        <text
                          x={region.x > 100 ? region.x + 48 : region.x - 48}
                          y={region.y - 10}
                          textAnchor="middle"
                          fill="#38bdf8"
                          fontSize="6"
                          fontWeight="bold"
                          fontFamily="sans-serif"
                        >
                          {finding ? finding.status.toUpperCase() : 'SELECCIONADO'}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Quick HUD Legend */}
          <div className="flex flex-wrap items-center justify-center gap-3 text-[10px] text-slate-300 mt-1 bg-slate-950/90 px-4 py-2 rounded-2xl border border-slate-800 z-10">
            <span className="flex items-center space-x-1.5 font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span>Normal</span>
            </span>
            <span className="flex items-center space-x-1.5 font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span>Observación</span>
            </span>
            <span className="flex items-center space-x-1.5 font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
              <span>Foco Patológico</span>
            </span>
            <span className="flex items-center space-x-1.5 font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 border border-slate-800" />
              <span>Sin Evaluar</span>
            </span>
          </div>
        </div>

        {/* Right: Detailed Finding Editor & Clinical Assessment Workspace */}
        <div className="lg:col-span-6 space-y-4">
          {/* Anatomical Region Selector Filter Bar */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-3 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[10px] uppercase font-bold text-slate-400">Filtrar por Aparato / Sistema:</span>
              <div className="relative w-44">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-500" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar órgano..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-2 py-1 text-[11px] text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-1">
              {['TODAS', 'Cabeza y Cuello', 'Tórax y Cardíaco', 'Abdomen y Pelvis', 'Extremidades', 'Columna y Dorso'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategoryFilter(cat)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                    selectedCategoryFilter === cat
                      ? 'bg-cyan-600 text-white font-black shadow-sm'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Region Card Inspector */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
            {/* Header of selected region */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-3">
                <span className="text-3xl p-2 bg-slate-900 border border-slate-800 rounded-2xl shadow-inner">
                  {selectedRegion.icon}
                </span>
                <div>
                  <span className="text-[10px] text-cyan-400 uppercase font-black tracking-wider block font-mono">
                    {selectedRegion.category} • {selectedRegion.view === 'anterior' ? 'VISTA ANTERIOR' : 'VISTA POSTERIOR'}
                  </span>
                  <h3 className="text-base sm:text-lg font-black text-white">
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
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-300 block uppercase tracking-wide">
                Calificación Clínica del Hallazgo Físico:
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setFormStatus('normal')}
                  className={`py-2.5 px-3 rounded-2xl border text-xs font-black transition cursor-pointer flex items-center justify-center space-x-2 ${
                    formStatus === 'normal'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500 shadow-md shadow-emerald-500/10 ring-1 ring-emerald-500/50'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Normal / Sano</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormStatus('observation')}
                  className={`py-2.5 px-3 rounded-2xl border text-xs font-black transition cursor-pointer flex items-center justify-center space-x-2 ${
                    formStatus === 'observation'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500 shadow-md shadow-amber-500/10 ring-1 ring-amber-500/50'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>En Observación</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormStatus('pathological')}
                  className={`py-2.5 px-3 rounded-2xl border text-xs font-black transition cursor-pointer flex items-center justify-center space-x-2 ${
                    formStatus === 'pathological'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500 shadow-md shadow-rose-500/10 ring-1 ring-rose-500/50'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  <span>Patológico</span>
                </button>
              </div>
            </div>

            {/* Quick Phrase Chips tailored to this anatomical zone */}
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                ⚡ Frases Clínicas Sugeridas (1-Click):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {selectedRegion.quickOptions.map((opt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleAddQuickOption(opt)}
                    className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 border border-slate-800 hover:border-cyan-500/40 rounded-xl text-[11px] transition cursor-pointer text-left font-medium"
                  >
                    + {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Clinical Notes Field */}
            <form onSubmit={handleSaveCurrentFinding} className="space-y-3 pt-1">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300 block">
                  Descripción Detallada / Hallazgo de la Exploración:
                </label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder={`Describa inspección, palpación, percusión o auscultación para ${selectedRegion.name}...`}
                  rows={3}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-normal leading-relaxed resize-y min-h-[80px]"
                />
              </div>

              {/* Alerta Visual de Éxito al Guardar */}
              {isSavedRecently && (
                <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 text-xs font-semibold flex items-center justify-between shadow-lg shadow-emerald-500/10 animate-pulse">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <span>¡Hallazgo guardado correctamente y sincronizado en tiempo real con el Expediente SOAP!</span>
                  </div>
                  <span className="text-[10px] bg-emerald-500/30 px-2 py-0.5 rounded-full text-emerald-200 font-mono font-bold">GUARDADO</span>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
                <div className="flex items-center space-x-2 text-[11px]">
                  {isSavedRecently ? (
                    <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Registrado exitosamente</span>
                    </span>
                  ) : findings[selectedRegion.id] ? (
                    <span className="text-cyan-400 font-medium flex items-center gap-1.5 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                      <Check className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Guardado en mapa</span>
                      <span className="text-slate-500 font-mono">({new Date(findings[selectedRegion.id].updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})</span>
                    </span>
                  ) : (
                    <span className="text-slate-500 italic">Sin registro guardado aún para este órgano</span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => handleSaveCurrentFinding(e)}
                    className={`px-4 py-2.5 rounded-xl text-xs font-black flex items-center space-x-2 transition duration-200 shadow-lg cursor-pointer uppercase tracking-wider ${
                      isSavedRecently
                        ? 'bg-emerald-600 text-white shadow-emerald-600/40 ring-4 ring-emerald-500/50 scale-[1.02]'
                        : 'bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white shadow-cyan-600/25 active:scale-95'
                    }`}
                  >
                    {isSavedRecently ? <CheckCircle2 className="w-4 h-4 animate-bounce" /> : <Save className="w-4 h-4" />}
                    <span>{isSavedRecently ? '¡Guardado con Éxito!' : 'Guardar Hallazgo en este Órgano'}</span>
                  </button>

                  {onInsertIntoSoap && (
                    <button
                      type="button"
                      onClick={(e) => handleSaveAndTransferToSoap(e)}
                      className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black rounded-xl text-xs flex items-center space-x-2 transition shadow-lg shadow-emerald-600/25 cursor-pointer uppercase tracking-wider active:scale-95"
                      title="Guardar este hallazgo y transferir todo el examen físico al campo Objetivo [O] de la nota SOAP"
                    >
                      <Sparkles className="w-4 h-4 text-emerald-200" />
                      <span>Guardar y Ver en SOAP</span>
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
