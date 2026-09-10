import React, { useState } from 'react';
import {
  Activity,
  Droplets,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Search,
  Filter,
  Sparkles,
  User,
  FlaskConical,
  Zap,
  Thermometer,
  Heart,
  Scale,
  FileText,
  Layers,
  Settings,
  Cpu,
  Check,
  X,
  Printer,
  TrendingUp,
  Clock,
  UserCheck,
  Syringe,
  ChevronRight,
  Info
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart as RechartsPie,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { ISBT128 } from '../../../utils/isbt128Generator';

export interface ApheresisProcedure {
  id: string;
  din: string;
  donorName: string;
  nationalId: string;
  bloodGroup: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  procedureType: 'PLAQUETAS_SINGLE' | 'PLAQUETAS_DOUBLE' | 'PLASMA_ALTO_VOLUMEN' | 'MULTICOMPONENTE';
  machineModel: 'Trima Accel (Terumo BCT)' | 'Amicus (Fresenius Kabi)' | 'MCS+ (Haemonetics)';
  kitLot: string;
  prePlateletCount: number; // x10^3 / uL
  preHb: number; // g/dL
  processedVolumeMl: number;
  acdVolumeInfusedMl: number;
  yieldPlatelets: number; // x10^11 total
  plasmaVolumeMl: number;
  residualWbcCount: number; // x10^6
  durationMinutes: number;
  citrateToxicityStatus: 'NINGUNA' | 'LEVE_PARESTESIA' | 'MODERADA_TRATADA';
  calciumAdministered: boolean;
  status: 'COMPLETADO' | 'EN_PROCESO' | 'CANCELADO_TECNICO';
  date: string;
  technologist: string;
}

const INITIAL_PROCEDURES: ApheresisProcedure[] = [
  {
    id: 'aph-2026-001',
    din: 'E88232600101',
    donorName: 'Carlos Eduardo Mendoza',
    nationalId: '8-762-1092',
    bloodGroup: 'O+',
    procedureType: 'PLAQUETAS_DOUBLE',
    machineModel: 'Trima Accel (Terumo BCT)',
    kitLot: 'LOT-TRM-8821',
    prePlateletCount: 285,
    preHb: 15.2,
    processedVolumeMl: 3450,
    acdVolumeInfusedMl: 310,
    yieldPlatelets: 6.2, // 6.2 x 10^11 (Apto para split P1/P2)
    plasmaVolumeMl: 220,
    residualWbcCount: 0.15, // < 1.0 x 10^6
    durationMinutes: 68,
    citrateToxicityStatus: 'LEVE_PARESTESIA',
    calciumAdministered: true,
    status: 'COMPLETADO',
    date: '2026-08-20 09:30',
    technologist: 'Lic. Maria Torres'
  },
  {
    id: 'aph-2026-002',
    din: 'E88232600102',
    donorName: 'Ana Sofia Villarreal',
    nationalId: '4-811-0421',
    bloodGroup: 'A+',
    procedureType: 'MULTICOMPONENTE',
    machineModel: 'Amicus (Fresenius Kabi)',
    kitLot: 'LOT-AMC-9904',
    prePlateletCount: 240,
    preHb: 13.8,
    processedVolumeMl: 2900,
    acdVolumeInfusedMl: 260,
    yieldPlatelets: 3.4,
    plasmaVolumeMl: 450,
    residualWbcCount: 0.08,
    durationMinutes: 58,
    citrateToxicityStatus: 'NINGUNA',
    calciumAdministered: false,
    status: 'COMPLETADO',
    date: '2026-08-20 11:15',
    technologist: 'Lic. Roberto Castillo'
  },
  {
    id: 'aph-2026-003',
    din: 'E88232600103',
    donorName: 'Jorge Luis Batista',
    nationalId: '8-902-1188',
    bloodGroup: 'B+',
    procedureType: 'PLASMA_ALTO_VOLUMEN',
    machineModel: 'MCS+ (Haemonetics)',
    kitLot: 'LOT-HAE-4412',
    prePlateletCount: 190,
    preHb: 14.5,
    processedVolumeMl: 2400,
    acdVolumeInfusedMl: 210,
    yieldPlatelets: 0,
    plasmaVolumeMl: 680,
    residualWbcCount: 0.02,
    durationMinutes: 45,
    citrateToxicityStatus: 'NINGUNA',
    calciumAdministered: false,
    status: 'COMPLETADO',
    date: '2026-08-19 14:00',
    technologist: 'Lic. Maria Torres'
  },
  {
    id: 'aph-2026-004',
    din: 'E88232600104',
    donorName: 'Gabriela Isabel Ríos',
    nationalId: '9-741-2033',
    bloodGroup: 'O-',
    procedureType: 'PLAQUETAS_SINGLE',
    machineModel: 'Trima Accel (Terumo BCT)',
    kitLot: 'LOT-TRM-8821',
    prePlateletCount: 210,
    preHb: 12.9,
    processedVolumeMl: 2800,
    acdVolumeInfusedMl: 240,
    yieldPlatelets: 3.8,
    plasmaVolumeMl: 180,
    residualWbcCount: 0.11,
    durationMinutes: 52,
    citrateToxicityStatus: 'LEVE_PARESTESIA',
    calciumAdministered: true,
    status: 'COMPLETADO',
    date: '2026-08-19 16:20',
    technologist: 'Lic. Roberto Castillo'
  }
];

const PROCEDURE_TYPE_LABELS = {
  PLAQUETAS_SINGLE: 'Plaquetoféresis Sencilla (1 Unidad)',
  PLAQUETAS_DOUBLE: 'Plaquetoféresis Doble (Split P1/P2)',
  PLASMA_ALTO_VOLUMEN: 'Plasmaféresis de Alto Volumen',
  MULTICOMPONENTE: 'Multicomponente (Plaquetas + Plasma)'
};

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

export const ApheresisDonationModule: React.FC = () => {
  const [procedures, setProcedures] = useState<ApheresisProcedure[]>(INITIAL_PROCEDURES);
  const [activeTab, setActiveTab] = useState<'overview' | 'new_procedure' | 'quality_control' | 'history'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [selectedProcedure, setSelectedProcedure] = useState<ApheresisProcedure | null>(null);

  // New Procedure Wizard State
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4>(1);
  const [formData, setFormData] = useState({
    donorName: '',
    nationalId: '',
    bloodGroup: 'O+' as any,
    prePlateletCount: 260,
    preHb: 14.2,
    weightKg: 72,
    heightCm: 175,
    gender: 'M' as 'M' | 'F',
    procedureType: 'PLAQUETAS_DOUBLE' as any,
    machineModel: 'Trima Accel (Terumo BCT)' as any,
    kitLot: 'LOT-TRM-2026-X',
    acdRatio: '1:11',
    targetYield: 6.0,
    targetPlasmaMl: 200,
    citrateToxicitySymptoms: false,
    calciumAdministered: false,
    technologistNotes: ''
  });

  // Calculate Nadler's Estimated Total Blood Volume (TBV in mL)
  const calculateTBV = () => {
    const { weightKg, heightCm, gender } = formData;
    if (!weightKg || !heightCm) return 4500;
    const hM = heightCm / 100;
    if (gender === 'M') {
      return Math.round((0.3669 * Math.pow(hM, 3) + 0.03219 * weightKg + 0.6041) * 1000);
    } else {
      return Math.round((0.3561 * Math.pow(hM, 3) + 0.03308 * weightKg + 0.1833) * 1000);
    }
  };

  const tbvMl = calculateTBV();
  const maxSafeACDLimit = Math.round(tbvMl * 0.15); // Max 15% safe extracorporeal volume

  // Donor Eligibility Verification for Apheresis
  const isPlateletCountValid = formData.prePlateletCount >= 150;
  const isHbValid = formData.preHb >= 12.5;
  const isWeightValid = formData.weightKg >= 50;
  const isDonorEligible = isPlateletCountValid && isHbValid && isWeightValid;

  const handleCreateProcedure = () => {
    const generatedDin = ISBT128.generateDIN('E8823', Math.floor(Math.random() * 900000 + 100000));
    const isDouble = formData.procedureType === 'PLAQUETAS_DOUBLE';

    const newProc: ApheresisProcedure = {
      id: `aph-${Date.now()}`,
      din: generatedDin,
      donorName: formData.donorName || 'Donante Voluntario',
      nationalId: formData.nationalId || '8-800-9911',
      bloodGroup: formData.bloodGroup,
      procedureType: formData.procedureType,
      machineModel: formData.machineModel,
      kitLot: formData.kitLot,
      prePlateletCount: formData.prePlateletCount,
      preHb: formData.preHb,
      processedVolumeMl: Math.round(tbvMl * 0.65),
      acdVolumeInfusedMl: Math.round(tbvMl * 0.06),
      yieldPlatelets: isDouble ? 6.1 : 3.5,
      plasmaVolumeMl: formData.procedureType === 'PLASMA_ALTO_VOLUMEN' ? 650 : 200,
      residualWbcCount: 0.09,
      durationMinutes: isDouble ? 65 : 50,
      citrateToxicityStatus: formData.citrateToxicitySymptoms ? 'LEVE_PARESTESIA' : 'NINGUNA',
      calciumAdministered: formData.calciumAdministered,
      status: 'COMPLETADO',
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      technologist: 'Lic. Especialista en Aféresis'
    };

    setProcedures([newProc, ...procedures]);
    setActiveTab('history');
    setWizardStep(1);
  };

  // Aggregated Metrics
  const totalProcedures = procedures.length;
  const totalPlateletUnits = procedures.reduce((acc, p) => {
    if (p.procedureType === 'PLAQUETAS_DOUBLE') return acc + 2;
    if (p.procedureType === 'PLAQUETAS_SINGLE' || p.procedureType === 'MULTICOMPONENTE') return acc + 1;
    return acc;
  }, 0);
  const totalPlasmaLiters = (procedures.reduce((acc, p) => acc + p.plasmaVolumeMl, 0) / 1000).toFixed(1);
  const totalPlateletYield = procedures.reduce((acc, p) => acc + p.yieldPlatelets, 0).toFixed(1);
  const leucoreductionCompliance = (
    (procedures.filter(p => p.residualWbcCount < 1.0).length / (totalProcedures || 1)) * 100
  ).toFixed(1);

  // Chart Data
  const typeDistributionData = [
    { name: 'Plaquetoféresis Doble', value: procedures.filter(p => p.procedureType === 'PLAQUETAS_DOUBLE').length },
    { name: 'Plaquetoféresis Sencilla', value: procedures.filter(p => p.procedureType === 'PLAQUETAS_SINGLE').length },
    { name: 'Multicomponente', value: procedures.filter(p => p.procedureType === 'MULTICOMPONENTE').length },
    { name: 'Plasmaféresis', value: procedures.filter(p => p.procedureType === 'PLASMA_ALTO_VOLUMEN').length }
  ];

  const machineUsageData = [
    { name: 'Trima Accel', procs: procedures.filter(p => p.machineModel.includes('Trima')).length },
    { name: 'Amicus Kabi', procs: procedures.filter(p => p.machineModel.includes('Amicus')).length },
    { name: 'Haemonetics MCS+', procs: procedures.filter(p => p.machineModel.includes('MCS+')).length }
  ];

  const filteredProcedures = procedures.filter(p => {
    const matchesSearch =
      p.donorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.nationalId.includes(searchTerm) ||
      p.din.includes(searchTerm);
    const matchesType = filterType === 'ALL' || p.procedureType === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6 p-6 bg-slate-900/95 text-slate-100 min-h-screen rounded-3xl font-sans border border-slate-800 shadow-2xl">
      {/* HEADER BANNER */}
      <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-indigo-950 p-6 rounded-2xl border border-rose-900/40 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-rose-600/20 text-rose-400 rounded-xl border border-rose-500/30">
              <Syringe className="h-7 w-7 animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                Módulo de Gestión de Donaciones por Aféresis
                <span className="text-xs bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  Plaquetas & Plasma
                </span>
              </h1>
              <p className="text-xs text-slate-400 font-medium">
                Separación Celular Automatizada • Control de Citrato & Calcemia • Fraccionamiento ISBT-128
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setActiveTab('new_procedure');
              setWizardStep(1);
            }}
            className="flex items-center gap-2 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-rose-900/30 transition-all cursor-pointer"
          >
            <Plus size={16} />
            Nueva Donación por Aféresis
          </button>
        </div>
      </div>

      {/* KPI METRICS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex items-center gap-3 shadow-lg">
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl">
            <Activity size={22} />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Total Procedimientos</p>
            <p className="text-xl font-black text-white">{totalProcedures}</p>
            <p className="text-[10px] text-blue-400 font-semibold mt-0.5">100% Exitosos</p>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex items-center gap-3 shadow-lg">
          <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl">
            <Droplets size={22} />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Unidades Plaquetas</p>
            <p className="text-xl font-black text-white">{totalPlateletUnits} <span className="text-xs font-normal text-slate-400">Dosis</span></p>
            <p className="text-[10px] text-rose-400 font-semibold mt-0.5">{totalPlateletYield} ×10¹¹ PLT colectadas</p>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex items-center gap-3 shadow-lg">
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
            <FlaskConical size={22} />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Plasma de Aféresis</p>
            <p className="text-xl font-black text-white">{totalPlasmaLiters} <span className="text-xs font-normal text-slate-400">Litros</span></p>
            <p className="text-[10px] text-amber-400 font-semibold mt-0.5">Plasma Libre de Células</p>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex items-center gap-3 shadow-lg">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <ShieldCheck size={22} />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Leucoreducción</p>
            <p className="text-xl font-black text-white">{leucoreductionCompliance}%</p>
            <p className="text-[10px] text-emerald-400 font-semibold mt-0.5">&lt; 1.0 × 10⁶ WBC/unidad</p>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex items-center gap-3 shadow-lg">
          <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl">
            <Heart size={22} />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Seguridad Donante</p>
            <p className="text-xl font-black text-white">98.8%</p>
            <p className="text-[10px] text-purple-400 font-semibold mt-0.5">Baja reacción a citrato</p>
          </div>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex border-b border-slate-800 gap-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'overview'
              ? 'border-rose-500 text-rose-400 bg-rose-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <TrendingUp size={16} />
          Panel General & Análisis
        </button>

        <button
          onClick={() => {
            setActiveTab('new_procedure');
            setWizardStep(1);
          }}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'new_procedure'
              ? 'border-rose-500 text-rose-400 bg-rose-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Plus size={16} />
          Asistente de Procedimiento
        </button>

        <button
          onClick={() => setActiveTab('quality_control')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'quality_control'
              ? 'border-rose-500 text-rose-400 bg-rose-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldCheck size={16} />
          Control de Calidad & Leucoreducción
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'history'
              ? 'border-rose-500 text-rose-400 bg-rose-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers size={16} />
          Registro Histórico de Aféresis ({procedures.length})
        </button>
      </div>

      {/* TAB 1: OVERVIEW & ANALYTICS */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-300">
          {/* Distribution by Procedure Type */}
          <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-1">
                <Layers className="text-rose-400" size={18} />
                Distribución por Tipo de Procedimiento
              </h3>
              <p className="text-xs text-slate-400">Plaquetoféresis (Sencilla/Doble), Plasmaféresis y Multicomponente</p>
            </div>
            <div className="h-64 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPie>
                  <Pie
                    data={typeDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {typeDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                  />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px', color: '#cbd5e1' }} />
                </RechartsPie>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Machine Usage */}
          <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-1">
                <Cpu className="text-blue-400" size={18} />
                Utilización de Separadores Celulares (Equipos de Aféresis)
              </h3>
              <p className="text-xs text-slate-400">Rendimiento por plataforma de centrifugación automatizada</p>
            </div>
            <div className="h-64 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={machineUsageData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                  />
                  <Bar dataKey="procs" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Procedimientos Colectados" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Apheresis Clinical Guidelines & Safety Box */}
          <div className="lg:col-span-2 bg-gradient-to-r from-slate-900 via-rose-950/20 to-slate-900 border border-rose-900/30 p-6 rounded-2xl">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
                <AlertTriangle size={24} />
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                  Estándares AABB & MINSA para Aféresis de Plaquetas y Plasma
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-300">
                  <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                    <p className="font-bold text-rose-400 mb-1">Criterio de Recuento de Plaquetas</p>
                    <p className="text-[11px] leading-relaxed text-slate-400">
                      El donante debe poseer un recuento inicial ≥ 150,000 / µL para plaquetoféresis sencilla y ≥ 230,000 / µL para doble dosis (Split).
                    </p>
                  </div>

                  <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                    <p className="font-bold text-amber-400 mb-1">Manejo de Citrato (ACD-A)</p>
                    <p className="text-[11px] leading-relaxed text-slate-400">
                      Monitorear parestesias peribucales. Disponer de Gluconato de Calcio efervescente de 1g para administración inmediata si la infusión provoca hipocalcemia.
                    </p>
                  </div>

                  <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                    <p className="font-bold text-emerald-400 mb-1">Dosis Terapéutica Mínima</p>
                    <p className="text-[11px] leading-relaxed text-slate-400">
                      Un concentrado plaquetario de aféresis debe contener ≥ 3.0 × 10¹¹ plaquetas y un recuento de leucocitos residuales &lt; 1.0 × 10⁶.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: NEW PROCEDURE WIZARD */}
      {activeTab === 'new_procedure' && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-6 max-w-4xl mx-auto shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
          {/* Wizard Steps Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${wizardStep >= 1 ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-400'}`}>1</span>
              <span className="text-xs font-bold text-slate-300">Evaluación Donante</span>
              <ChevronRight size={14} className="text-slate-600" />

              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${wizardStep >= 2 ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-400'}`}>2</span>
              <span className="text-xs font-bold text-slate-300">Configuración Equipo</span>
              <ChevronRight size={14} className="text-slate-600" />

              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${wizardStep >= 3 ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-400'}`}>3</span>
              <span className="text-xs font-bold text-slate-300">Monitoreo & Seguridad</span>
              <ChevronRight size={14} className="text-slate-600" />

              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${wizardStep === 4 ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'}`}>4</span>
              <span className="text-xs font-bold text-slate-300">Finalización ISBT-128</span>
            </div>
          </div>

          {/* STEP 1: DONOR ELIGIBILITY */}
          {wizardStep === 1 && (
            <div className="space-y-6">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <UserCheck className="text-rose-400" size={18} />
                Paso 1: Datos del Donante & Criterios Hematológicos
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Nombre Completo del Donante</label>
                  <input
                    type="text"
                    value={formData.donorName}
                    onChange={e => setFormData({ ...formData, donorName: e.target.value })}
                    placeholder="Ej. Juan Carlos Pérez"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-rose-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">Cédula / Documento de Identidad</label>
                  <input
                    type="text"
                    value={formData.nationalId}
                    onChange={e => setFormData({ ...formData, nationalId: e.target.value })}
                    placeholder="Ej. 8-821-4402"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-rose-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">Grupo Sanguíneo / Rh</label>
                  <select
                    value={formData.bloodGroup}
                    onChange={e => setFormData({ ...formData, bloodGroup: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-rose-500 outline-none"
                  >
                    <option value="O+">O Positivo (O+)</option>
                    <option value="O-">O Negativo (O-)</option>
                    <option value="A+">A Positivo (A+)</option>
                    <option value="A-">A Negativo (A-)</option>
                    <option value="B+">B Positivo (B+)</option>
                    <option value="B-">B Negativo (B-)</option>
                    <option value="AB+">AB Positivo (AB+)</option>
                    <option value="AB-">AB Negativo (AB-)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">Género Biológico</label>
                  <select
                    value={formData.gender}
                    onChange={e => setFormData({ ...formData, gender: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-rose-500 outline-none"
                  >
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">Peso (kg) [Min 50 kg]</label>
                  <input
                    type="number"
                    value={formData.weightKg}
                    onChange={e => setFormData({ ...formData, weightKg: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-rose-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">Estatura (cm)</label>
                  <input
                    type="number"
                    value={formData.heightCm}
                    onChange={e => setFormData({ ...formData, heightCm: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-rose-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">Conteo de Plaquetas Pre-Donación (×10³/µL)</label>
                  <input
                    type="number"
                    value={formData.prePlateletCount}
                    onChange={e => setFormData({ ...formData, prePlateletCount: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-rose-500 outline-none font-mono font-bold text-rose-400"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">Hemoglobina (g/dL) [Min 12.5]</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.preHb}
                    onChange={e => setFormData({ ...formData, preHb: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-rose-500 outline-none font-mono font-bold text-blue-400"
                  />
                </div>
              </div>

              {/* Calculated Nadler TBV & Validation Bar */}
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400">Volumen Sanguíneo Total Calculado (Nadler): </span>
                  <span className="font-bold text-white font-mono text-sm">{tbvMl} mL</span>
                  <span className="text-slate-500 ml-2">(Límite ACD-A seguro: {maxSafeACDLimit} mL)</span>
                </div>

                <div className="flex items-center gap-2">
                  {isDonorEligible ? (
                    <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full font-bold flex items-center gap-1">
                      <CheckCircle2 size={14} /> Donante Apto para Aféresis
                    </span>
                  ) : (
                    <span className="bg-rose-500/20 text-rose-400 border border-rose-500/30 px-3 py-1 rounded-full font-bold flex items-center gap-1">
                      <AlertTriangle size={14} /> Criterios Insuficientes
                    </span>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  onClick={() => setWizardStep(2)}
                  disabled={!isDonorEligible}
                  className="bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2"
                >
                  Continuar a Configuración
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: MACHINE CONFIGURATION */}
          {wizardStep === 2 && (
            <div className="space-y-6">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Cpu className="text-blue-400" size={18} />
                Paso 2: Tipo de Procedimiento y Parámetros del Separador Celular
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="md:col-span-2">
                  <label className="block font-medium text-slate-300 mb-2">Tipo de Colecta de Aféresis</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      {
                        key: 'PLAQUETAS_DOUBLE',
                        title: 'Plaquetoféresis Doble (Split P1/P2)',
                        desc: 'Meta: ≥ 6.0 × 10¹¹ plaquetas (Rinde 2 unidades independientes)'
                      },
                      {
                        key: 'PLAQUETAS_SINGLE',
                        title: 'Plaquetoféresis Sencilla',
                        desc: 'Meta: ≥ 3.0 × 10¹¹ plaquetas (Rinde 1 unidad terapéutica)'
                      },
                      {
                        key: 'MULTICOMPONENTE',
                        title: 'Multicomponente (Plaquetas + Plasma)',
                        desc: '1 Unidad de Plaquetas (3.0×10¹¹) + 400 mL Plasma Fresco'
                      },
                      {
                        key: 'PLASMA_ALTO_VOLUMEN',
                        title: 'Plasmaféresis de Alto Volumen',
                        desc: 'Colecta de 600 - 800 mL de Plasma Libre de Células'
                      }
                    ].map(type => (
                      <div
                        key={type.key}
                        onClick={() => setFormData({ ...formData, procedureType: type.key as any })}
                        className={`p-4 rounded-xl border cursor-pointer transition-all ${
                          formData.procedureType === type.key
                            ? 'bg-rose-950/40 border-rose-500/60 shadow-lg'
                            : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <p className="font-bold text-white mb-1">{type.title}</p>
                        <p className="text-[11px] text-slate-400">{type.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">Modelo de Máquina de Aféresis</label>
                  <select
                    value={formData.machineModel}
                    onChange={e => setFormData({ ...formData, machineModel: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-rose-500 outline-none"
                  >
                    <option value="Trima Accel (Terumo BCT)">Trima Accel® (Terumo BCT)</option>
                    <option value="Amicus (Fresenius Kabi)">Amicus® (Fresenius Kabi)</option>
                    <option value="MCS+ (Haemonetics)">MCS+® (Haemonetics)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">Lote del Kit Centrifugador / Casete</label>
                  <input
                    type="text"
                    value={formData.kitLot}
                    onChange={e => setFormData({ ...formData, kitLot: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-rose-500 outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">Proporción Anticoagulante ACD-A</label>
                  <select
                    value={formData.acdRatio}
                    onChange={e => setFormData({ ...formData, acdRatio: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-rose-500 outline-none"
                  >
                    <option value="1:10">1:10 (Estándar Plasma)</option>
                    <option value="1:11">1:11 (Estándar Plaquetas)</option>
                    <option value="1:12">1:12 (Sensibilidad a Citrato)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">Tiempo Estimado de Corrida (Minutos)</label>
                  <input
                    type="number"
                    value={formData.procedureType === 'PLAQUETAS_DOUBLE' ? 68 : 50}
                    disabled
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-slate-400 outline-none font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t border-slate-800">
                <button
                  onClick={() => setWizardStep(1)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs px-5 py-2.5 rounded-xl cursor-pointer"
                >
                  Atrás
                </button>
                <button
                  onClick={() => setWizardStep(3)}
                  className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs px-6 py-2.5 rounded-xl cursor-pointer flex items-center gap-2"
                >
                  Continuar a Monitoreo
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: MONITORING & CITRATE TOXICITY */}
          {wizardStep === 3 && (
            <div className="space-y-6">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Heart className="text-rose-400" size={18} />
                Paso 3: Monitoreo Intra-Procedimiento & Control de Citrato
              </h3>

              <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-4">
                <p className="text-xs font-bold text-slate-300">Sintomatología de Toxicidad por Citrato (Hipocalcemia Aguda)</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <label className="flex items-center gap-3 bg-slate-900 p-3 rounded-xl border border-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.citrateToxicitySymptoms}
                      onChange={e => setFormData({ ...formData, citrateToxicitySymptoms: e.target.checked })}
                      className="w-4 h-4 accent-rose-500 rounded"
                    />
                    <span className="text-slate-300">Parestesias peribucales / Hormigueo en labios o manos</span>
                  </label>

                  <label className="flex items-center gap-3 bg-slate-900 p-3 rounded-xl border border-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.calciumAdministered}
                      onChange={e => setFormData({ ...formData, calciumAdministered: e.target.checked })}
                      className="w-4 h-4 accent-emerald-500 rounded"
                    />
                    <span className="text-slate-300">Administración Preventiva de Gluconato de Calcio Oral</span>
                  </label>
                </div>

                {formData.citrateToxicitySymptoms && (
                  <div className="bg-rose-950/40 border border-rose-500/40 p-3 rounded-xl text-xs text-rose-300 flex items-center gap-3">
                    <AlertTriangle size={18} className="shrink-0 text-rose-400" />
                    <span>
                      Acción recomendada: Reducir la tasa de infusión de la bomba de ACD-A a 1:12 y administrar tabletas efervescentes de Calcio (1g).
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Notas Clínicas del Tecnólogo</label>
                <textarea
                  rows={3}
                  value={formData.technologistNotes}
                  onChange={e => setFormData({ ...formData, technologistNotes: e.target.value })}
                  placeholder="Observaciones de acceso venoso, comportamiento del separador celular, tolerancia del donante..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:border-rose-500 outline-none"
                />
              </div>

              <div className="flex justify-between pt-4 border-t border-slate-800">
                <button
                  onClick={() => setWizardStep(2)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs px-5 py-2.5 rounded-xl cursor-pointer"
                >
                  Atrás
                </button>
                <button
                  onClick={() => setWizardStep(4)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-6 py-2.5 rounded-xl cursor-pointer flex items-center gap-2"
                >
                  Finalizar Procedimiento
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: SUMMARY & ISBT-128 GENERATION */}
          {wizardStep === 4 && (
            <div className="space-y-6 text-center py-4">
              <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30">
                <CheckCircle2 size={36} />
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-black text-white">¡Procedimiento de Aféresis Listo para Finalizar!</h3>
                <p className="text-xs text-slate-400">Se registrarán los componentes en el Banco de Sangre con etiquetado ISBT-128</p>
              </div>

              <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl text-left text-xs space-y-2 max-w-lg mx-auto">
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Donante:</span>
                  <span className="font-bold text-white">{formData.donorName || 'Donante Aféresis'} ({formData.nationalId})</span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Tipo de Producto:</span>
                  <span className="font-bold text-rose-400">{PROCEDURE_TYPE_LABELS[formData.procedureType as keyof typeof PROCEDURE_TYPE_LABELS]}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Rendimiento Estimado:</span>
                  <span className="font-bold text-emerald-400 font-mono">
                    {formData.procedureType === 'PLAQUETAS_DOUBLE' ? '6.1 ×10¹¹ PLT (Split P1 / P2)' : '3.5 ×10¹¹ PLT'}
                  </span>
                </div>

                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Código ISBT-128 de Componente:</span>
                  <span className="font-bold text-blue-400 font-mono">E0534 / E3078</span>
                </div>
              </div>

              <div className="flex justify-center gap-4 pt-4">
                <button
                  onClick={() => setWizardStep(3)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs px-6 py-2.5 rounded-xl cursor-pointer"
                >
                  Regresar
                </button>
                <button
                  onClick={handleCreateProcedure}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs px-8 py-2.5 rounded-xl shadow-lg shadow-emerald-900/30 cursor-pointer flex items-center gap-2"
                >
                  <Printer size={16} />
                  Guardar & Imprimir Etiqueta ISBT-128
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: QUALITY CONTROL & LEUCOREDUCTION */}
      {activeTab === 'quality_control' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-2">
              <ShieldCheck className="text-emerald-400" size={18} />
              Verificación de Leucoreducción y Calidad de Plaquetas (AABB / ISO 15189)
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Parámetros de aceptación para concentrados de plaquetas obtenidos por aféresis
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">Recuento de Plaquetas por Bolsa</span>
                  <span className="text-emerald-400 font-mono font-bold">≥ 3.0 × 10¹¹</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Asegura una dosis terapéutica efectiva para prevenir o tratar episodios de hemorragia.
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">Leucocitos Residuales (WBC)</span>
                  <span className="text-emerald-400 font-mono font-bold">&lt; 1.0 × 10⁶</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Previene la aloinmunización HLA y reacciones febriles no hemolíticas post-transfusión.
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">pH Mínimo al Vencimiento</span>
                  <span className="text-emerald-400 font-mono font-bold">≥ 6.2 (a 22°C)</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Garantiza viabilidad metabólica de las plaquetas almacenadas en agitación continua.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: HISTORICAL REGISTRY */}
      {activeTab === 'history' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          {/* SEARCH & FILTERS */}
          <div className="flex flex-col md:flex-row gap-3 justify-between items-center bg-slate-900 border border-slate-800 p-4 rounded-2xl">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
              <input
                type="text"
                placeholder="Buscar por donante, cédula o DIN ISBT-128..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:border-rose-500 outline-none"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <Filter className="text-slate-500" size={16} />
              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 px-3 py-2 outline-none focus:border-rose-500"
              >
                <option value="ALL">Todos los Tipos de Aféresis</option>
                <option value="PLAQUETAS_DOUBLE">Plaquetoféresis Doble</option>
                <option value="PLAQUETAS_SINGLE">Plaquetoféresis Sencilla</option>
                <option value="MULTICOMPONENTE">Multicomponente</option>
                <option value="PLASMA_ALTO_VOLUMEN">Plasmaféresis</option>
              </select>
            </div>
          </div>

          {/* TABLE OF PROCEDURES */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800 uppercase tracking-wider text-[10px]">
                  <th className="p-4">DIN ISBT-128</th>
                  <th className="p-4">Donante / Cédula</th>
                  <th className="p-4">Tipo Procedimiento</th>
                  <th className="p-4">Separador Celular</th>
                  <th className="p-4 text-center">Rendimiento (PLT)</th>
                  <th className="p-4 text-center">Vol. Plasma</th>
                  <th className="p-4 text-center">Citrato / Calcio</th>
                  <th className="p-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredProcedures.map(p => (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 font-mono font-bold text-rose-400">{p.din}</td>
                    <td className="p-4">
                      <p className="font-bold text-white">{p.donorName}</p>
                      <p className="text-[11px] text-slate-500">{p.nationalId} • Grupo {p.bloodGroup}</p>
                    </td>
                    <td className="p-4">
                      <span className="inline-block bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-lg font-semibold text-slate-300">
                        {PROCEDURE_TYPE_LABELS[p.procedureType]}
                      </span>
                    </td>
                    <td className="p-4 text-slate-300">{p.machineModel}</td>
                    <td className="p-4 text-center font-mono font-bold text-emerald-400">
                      {p.yieldPlatelets > 0 ? `${p.yieldPlatelets} ×10¹¹` : 'N/A'}
                    </td>
                    <td className="p-4 text-center font-mono text-amber-400 font-bold">
                      {p.plasmaVolumeMl} mL
                    </td>
                    <td className="p-4 text-center">
                      {p.calciumAdministered ? (
                        <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full text-[10px] font-bold">
                          Calcio Admin
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[10px]">Sin Reacción</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => setSelectedProcedure(p)}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer"
                      >
                        Ver Detalle
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: PROCEDURE DETAIL */}
      {selectedProcedure && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Syringe className="text-rose-400" size={18} />
                Detalle del Procedimiento por Aféresis
              </h3>
              <button onClick={() => setSelectedProcedure(null)} className="text-slate-400 hover:text-white cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">DIN ISBT-128:</span>
                <span className="font-mono font-bold text-rose-400">{selectedProcedure.din}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Donante:</span>
                <span className="font-bold text-white">{selectedProcedure.donorName} ({selectedProcedure.nationalId})</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Grupo Sanguíneo:</span>
                <span className="font-bold text-emerald-400">{selectedProcedure.bloodGroup}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Plataforma / Máquina:</span>
                <span className="text-slate-200">{selectedProcedure.machineModel}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Rendimiento de Plaquetas:</span>
                <span className="font-mono font-bold text-emerald-400">{selectedProcedure.yieldPlatelets} ×10¹¹ PLT</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Leucocitos Residuales:</span>
                <span className="font-mono text-slate-300">{selectedProcedure.residualWbcCount} ×10⁶ WBC</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Tecnólogo Responsable:</span>
                <span className="text-slate-300">{selectedProcedure.technologist}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedProcedure(null)}
                className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-5 py-2 rounded-xl cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApheresisDonationModule;
