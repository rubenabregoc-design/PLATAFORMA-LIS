import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Flame,
  Calculator,
  History,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  RotateCcw,
  FileCheck,
  Zap,
  Info,
  Check,
  Filter,
  Search,
  Eye,
  Plus
} from 'lucide-react';

interface BatchTestItem {
  id: string;
  orderNumber: string;
  sampleBarcode: string;
  patientName: string;
  patientAge: number;
  patientGender: 'M' | 'F';
  patientNationalId: string;
  analyte: string;
  category: 'Bioquímica' | 'Hematología' | 'Electrolitos' | 'Coagulación' | 'Inmunología';
  resultValue: number;
  unit: string;
  referenceRange: string;
  minNormal: number;
  maxNormal: number;
  criticalLow?: number;
  criticalHigh?: number;
  previousValue?: number;
  previousDate?: string;
  deltaPercent?: number;
  deltaFlag?: 'DELTA_NORMAL' | 'DELTA_ALERT' | 'DELTA_CRITICAL';
  status: 'PENDIENTE' | 'VALIDADO_TECNICO' | 'RECHAZADO';
  analyzerName: string;
  transmissionTime: string;
  hilStatus: 'NORMAL' | 'HEMOLISIS_LIGERA' | 'ICTERICIA' | 'LIPEMIA';
}

const INITIAL_BATCH_RESULTS: BatchTestItem[] = [
  {
    id: 'res-101',
    orderNumber: 'ORD-2026-8801',
    sampleBarcode: '745009101',
    patientName: 'Castillo, Sofía Elena',
    patientAge: 48,
    patientGender: 'F',
    patientNationalId: '8-745-1290',
    analyte: 'Glucosa Basal',
    category: 'Bioquímica',
    resultValue: 92,
    unit: 'mg/dL',
    referenceRange: '70 - 99 mg/dL',
    minNormal: 70,
    maxNormal: 99,
    criticalLow: 45,
    criticalHigh: 450,
    previousValue: 95,
    previousDate: '15/07/2026',
    deltaPercent: -3.1,
    deltaFlag: 'DELTA_NORMAL',
    status: 'PENDIENTE',
    analyzerName: 'Cobas 6000 c501',
    transmissionTime: '10:14 AM',
    hilStatus: 'NORMAL'
  },
  {
    id: 'res-102',
    orderNumber: 'ORD-2026-8802',
    sampleBarcode: '745009102',
    patientName: 'Morales, Carlos Andrés',
    patientAge: 62,
    patientGender: 'M',
    patientNationalId: '4-129-8831',
    analyte: 'Creatinina Sérica',
    category: 'Bioquímica',
    resultValue: 2.85,
    unit: 'mg/dL',
    referenceRange: '0.70 - 1.30 mg/dL',
    minNormal: 0.70,
    maxNormal: 1.30,
    criticalHigh: 5.0,
    previousValue: 1.15,
    previousDate: '18/08/2026',
    deltaPercent: 147.8,
    deltaFlag: 'DELTA_CRITICAL',
    status: 'PENDIENTE',
    analyzerName: 'Cobas 6000 c501',
    transmissionTime: '10:18 AM',
    hilStatus: 'NORMAL'
  },
  {
    id: 'res-103',
    orderNumber: 'ORD-2026-8803',
    sampleBarcode: '745009103',
    patientName: 'Pinzón, Mariana Lucía',
    patientAge: 34,
    patientGender: 'F',
    patientNationalId: '8-882-9912',
    analyte: 'Hemoglobina (Hb)',
    category: 'Hematología',
    resultValue: 6.8,
    unit: 'g/dL',
    referenceRange: '12.0 - 15.5 g/dL',
    minNormal: 12.0,
    maxNormal: 15.5,
    criticalLow: 7.0,
    previousValue: 12.4,
    previousDate: '12/08/2026',
    deltaPercent: -45.1,
    deltaFlag: 'DELTA_CRITICAL',
    status: 'PENDIENTE',
    analyzerName: 'Sysmex XN-1000',
    transmissionTime: '10:22 AM',
    hilStatus: 'NORMAL'
  },
  {
    id: 'res-104',
    orderNumber: 'ORD-2026-8804',
    sampleBarcode: '745009104',
    patientName: 'Arosemena, Ricardo J.',
    patientAge: 55,
    patientGender: 'M',
    patientNationalId: '8-410-3321',
    analyte: 'Colesterol Total',
    category: 'Bioquímica',
    resultValue: 178,
    unit: 'mg/dL',
    referenceRange: '120 - 200 mg/dL',
    minNormal: 120,
    maxNormal: 200,
    previousValue: 182,
    previousDate: '05/06/2026',
    deltaPercent: -2.2,
    deltaFlag: 'DELTA_NORMAL',
    status: 'PENDIENTE',
    analyzerName: 'Cobas 6000 c501',
    transmissionTime: '10:25 AM',
    hilStatus: 'NORMAL'
  },
  {
    id: 'res-105',
    orderNumber: 'ORD-2026-8805',
    sampleBarcode: '745009105',
    patientName: 'Herrera, Beatriz A.',
    patientAge: 29,
    patientGender: 'F',
    patientNationalId: '8-901-4412',
    analyte: 'Potasio Sérico (K+)',
    category: 'Electrolitos',
    resultValue: 6.35,
    unit: 'mmol/L',
    referenceRange: '3.50 - 5.10 mmol/L',
    minNormal: 3.50,
    maxNormal: 5.10,
    criticalLow: 2.80,
    criticalHigh: 6.00,
    previousValue: 4.20,
    previousDate: '20/07/2026',
    deltaPercent: 51.2,
    deltaFlag: 'DELTA_ALERT',
    status: 'PENDIENTE',
    analyzerName: 'Cobas ISE 900',
    transmissionTime: '10:28 AM',
    hilStatus: 'HEMOLISIS_LIGERA'
  },
  {
    id: 'res-106',
    orderNumber: 'ORD-2026-8806',
    sampleBarcode: '745009106',
    patientName: 'Sánchez, Gabriel O.',
    patientAge: 41,
    patientGender: 'M',
    patientNationalId: '7-104-5519',
    analyte: 'Ácido Úrico',
    category: 'Bioquímica',
    resultValue: 5.4,
    unit: 'mg/dL',
    referenceRange: '3.5 - 7.2 mg/dL',
    minNormal: 3.5,
    maxNormal: 7.2,
    previousValue: 5.6,
    previousDate: '10/05/2026',
    deltaPercent: -3.5,
    deltaFlag: 'DELTA_NORMAL',
    status: 'PENDIENTE',
    analyzerName: 'Cobas 6000 c501',
    transmissionTime: '10:30 AM',
    hilStatus: 'NORMAL'
  },
  {
    id: 'res-107',
    orderNumber: 'ORD-2026-8807',
    sampleBarcode: '745009107',
    patientName: 'Villarreal, Diana P.',
    patientAge: 38,
    patientGender: 'F',
    patientNationalId: '8-802-1188',
    analyte: 'TTPa (Tiempo Tromboplastina)',
    category: 'Coagulación',
    resultValue: 31.2,
    unit: 'segundos',
    referenceRange: '25.0 - 36.0 seg',
    minNormal: 25.0,
    maxNormal: 36.0,
    previousValue: 30.5,
    previousDate: '14/06/2026',
    deltaPercent: 2.3,
    deltaFlag: 'DELTA_NORMAL',
    status: 'PENDIENTE',
    analyzerName: 'Sysmex CS-2500',
    transmissionTime: '10:32 AM',
    hilStatus: 'NORMAL'
  }
];

export const AnalyticalValidationWorkstation: React.FC = () => {
  const [items, setItems] = useState<BatchTestItem[]>(INITIAL_BATCH_RESULTS);
  const [filterType, setFilterType] = useState<'ALL' | 'NORMAL' | 'OUT_OF_RANGE' | 'CRITICAL'>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedItemForDelta, setSelectedItemForDelta] = useState<BatchTestItem | null>(INITIAL_BATCH_RESULTS[1]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // --- CALCULATOR STATES ---
  const [activeCalculator, setActiveCalculator] = useState<'egfr' | 'ldl' | 'homa' | 'deritis' | 'calcium' | 'osmolarity'>('egfr');

  // eGFR Form
  const [egfrAge, setEgfrAge] = useState<number>(62);
  const [egfrGender, setEgfrGender] = useState<'M' | 'F'>('M');
  const [egfrCreatinine, setEgfrCreatinine] = useState<number>(2.85);

  // LDL Martin-Hopkins Form
  const [cholTotal, setCholTotal] = useState<number>(240);
  const [cholHdl, setCholHdl] = useState<number>(42);
  const [triglycerides, setTriglycerides] = useState<number>(190);

  // HOMA-IR Form
  const [fastingGlucose, setFastingGlucose] = useState<number>(118);
  const [fastingInsulin, setFastingInsulin] = useState<number>(16.5);

  // AST / ALT Form
  const [valAst, setValAst] = useState<number>(88);
  const [valAlt, setValAlt] = useState<number>(45);

  // Calcium Albumin Form
  const [totalCalcium, setTotalCalcium] = useState<number>(7.6);
  const [serumAlbumin, setSerumAlbumin] = useState<number>(2.8);

  // Osmolarity Form
  const [serumSodium, setSerumSodium] = useState<number>(141);
  const [serumGlucose, setSerumGlucose] = useState<number>(115);
  const [serumBun, setSerumBun] = useState<number>(28);

  // --- CALCULATION LOGICS ---
  // CKD-EPI 2021 Ecuación
  const calculateCkdEpi2021 = (scr: number, age: number, gender: 'M' | 'F') => {
    if (scr <= 0 || age <= 0) return 0;
    const kappa = gender === 'F' ? 0.7 : 0.9;
    const alpha = gender === 'F' ? -0.241 : -0.302;
    const genderFactor = gender === 'F' ? 1.012 : 1.0;
    const scrOverKappa = scr / kappa;
    const minPart = Math.pow(Math.min(scrOverKappa, 1), alpha);
    const maxPart = Math.pow(Math.max(scrOverKappa, 1), -1.2);
    const agePart = Math.pow(0.9938, age);
    const egfr = 142 * minPart * maxPart * agePart * genderFactor;
    return Math.round(egfr * 10) / 10;
  };

  const currentEgfr = calculateCkdEpi2021(egfrCreatinine, egfrAge, egfrGender);
  const getKdigoStage = (egfr: number) => {
    if (egfr >= 90) return { stage: 'G1 (Normal / Elevado)', color: 'text-emerald-400', bg: 'bg-emerald-500/20' };
    if (egfr >= 60) return { stage: 'G2 (Descenso Ligero)', color: 'text-teal-400', bg: 'bg-teal-500/20' };
    if (egfr >= 45) return { stage: 'G3a (Descenso Ligero a Moderado)', color: 'text-amber-400', bg: 'bg-amber-500/20' };
    if (egfr >= 30) return { stage: 'G3b (Descenso Moderado a Severo)', color: 'text-orange-400', bg: 'bg-orange-500/20' };
    if (egfr >= 15) return { stage: 'G4 (Descenso Severo)', color: 'text-rose-400', bg: 'bg-rose-500/20' };
    return { stage: 'G5 (Falla Renal / Terminal)', color: 'text-red-500', bg: 'bg-red-500/20' };
  };

  // LDL Martin-Hopkins & Friedewald
  const nonHdlChol = cholTotal - cholHdl;
  const ldlFriedewald = Math.round((cholTotal - cholHdl - triglycerides / 5) * 10) / 10;
  const adjustableFactor = triglycerides < 100 ? 5.6 : triglycerides < 150 ? 5.2 : triglycerides < 200 ? 4.9 : 4.5;
  const ldlMartinHopkins = Math.round((cholTotal - cholHdl - triglycerides / adjustableFactor) * 10) / 10;

  // HOMA-IR: (Glucosa * Insulina) / 405 (glucosa en mg/dL)
  const homaIr = Math.round(((fastingGlucose * fastingInsulin) / 405) * 100) / 100;

  // AST / ALT
  const deRitisRatio = valAlt > 0 ? Math.round((valAst / valAlt) * 100) / 100 : 0;

  // Calcium Payne Correction
  const correctedCalcium = Math.round((totalCalcium + 0.8 * (4.0 - serumAlbumin)) * 100) / 100;

  // Calculated Osmolarity: 2 * Na + (Gluc / 18) + (BUN / 2.8)
  const calcOsmolarity = Math.round((2 * serumSodium + serumGlucose / 18 + serumBun / 2.8) * 10) / 10;

  // --- FILTERED BATCH ITEMS ---
  const isItemNormal = (item: BatchTestItem) => {
    const isValNormal = item.resultValue >= item.minNormal && item.resultValue <= item.maxNormal;
    const isDeltaOk = item.deltaFlag === 'DELTA_NORMAL';
    return isValNormal && isDeltaOk;
  };

  const isItemCritical = (item: BatchTestItem) => {
    if (item.criticalLow !== undefined && item.resultValue <= item.criticalLow) return true;
    if (item.criticalHigh !== undefined && item.resultValue >= item.criticalHigh) return true;
    if (item.deltaFlag === 'DELTA_CRITICAL') return true;
    return false;
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.analyte.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sampleBarcode.includes(searchTerm);

    if (!matchesSearch) return false;

    if (filterType === 'NORMAL') return isItemNormal(item);
    if (filterType === 'CRITICAL') return isItemCritical(item);
    if (filterType === 'OUT_OF_RANGE') return !isItemNormal(item) && !isItemCritical(item);
    return true;
  });

  // Batch 1-Click Validation for all Normal Pending Results
  const handleBatchValidateNormals = () => {
    const normalIds = items.filter(i => i.status === 'PENDIENTE' && isItemNormal(i)).map(i => i.id);
    if (normalIds.length === 0) {
      setToastMessage('No hay resultados normales pendientes por validar.');
      setTimeout(() => setToastMessage(null), 4000);
      return;
    }

    setItems(prev => prev.map(item => normalIds.includes(item.id) ? { ...item, status: 'VALIDADO_TECNICO' } : item));
    setToastMessage(`✓ ${normalIds.length} resultados normales validados exitosamente por lote.`);
    setTimeout(() => setToastMessage(null), 5000);
  };

  const handleValidateSingle = (id: string) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, status: item.status === 'VALIDADO_TECNICO' ? 'PENDIENTE' : 'VALIDADO_TECNICO' } : item));
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500" id="analytical-workstation-container">
      {/* Module Title Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="flex items-center space-x-4 relative z-10">
          <div className="w-14 h-14 bg-gradient-to-tr from-teal-500 to-emerald-400 rounded-2xl flex items-center justify-center text-slate-950 font-black shadow-lg shadow-teal-500/20">
            <Zap className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl sm:text-2xl font-black text-white">Estación Analítica & Validación Técnica</h2>
              <span className="bg-teal-500/20 text-teal-300 border border-teal-500/30 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Módulo 1
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Validación rápida por lotes, verificación de reglas Delta Check histórico y calculadoras clínicas integradas.
            </p>
          </div>
        </div>

        {/* Action Batch Validation Button */}
        <div className="flex flex-wrap items-center gap-3 relative z-10">
          <button
            onClick={handleBatchValidateNormals}
            className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-xl text-xs transition shadow-lg shadow-emerald-500/25 flex items-center space-x-2 cursor-pointer"
            id="btn-batch-validate-normals"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Validar Lote Normal (1-Click)</span>
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center justify-between text-xs font-bold animate-in fade-in slide-in-from-top-2 border border-emerald-400/50">
          <div className="flex items-center space-x-2">
            <Check className="w-4 h-4" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-emerald-200 hover:text-white font-bold cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* SECTION A: BATCH VALIDATION TRAY & DELTA CHECK */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Table Column (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <FileCheck className="w-5 h-5 text-teal-400" />
                <h3 className="text-sm font-black text-white uppercase tracking-wider">
                  Bandeja de Transmisión Analítica ({filteredItems.length} Registros)
                </h3>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  onClick={() => setFilterType('ALL')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${filterType === 'ALL' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  Todos ({items.length})
                </button>
                <button
                  onClick={() => setFilterType('NORMAL')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer flex items-center space-x-1 ${filterType === 'NORMAL' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'text-slate-400 hover:text-emerald-400'}`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Normales ({items.filter(isItemNormal).length})</span>
                </button>
                <button
                  onClick={() => setFilterType('OUT_OF_RANGE')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer flex items-center space-x-1 ${filterType === 'OUT_OF_RANGE' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-slate-400 hover:text-amber-400'}`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span>Desviados ({items.filter(i => !isItemNormal(i) && !isItemCritical(i)).length})</span>
                </button>
                <button
                  onClick={() => setFilterType('CRITICAL')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer flex items-center space-x-1 ${filterType === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse' : 'text-slate-400 hover:text-rose-400'}`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  <span>Críticos ({items.filter(isItemCritical).length})</span>
                </button>
              </div>
            </div>

            {/* Search Box */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
              <input
                type="text"
                placeholder="Buscar por paciente, analito, tubo o cédula..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
              />
            </div>

            {/* Results Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800 text-[10px] uppercase tracking-wider">
                    <th className="py-2.5 px-3">Paciente / Muestra</th>
                    <th className="py-2.5 px-3">Analito</th>
                    <th className="py-2.5 px-3">Resultado</th>
                    <th className="py-2.5 px-3">Rango Ref.</th>
                    <th className="py-2.5 px-3">Delta Check</th>
                    <th className="py-2.5 px-3 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredItems.map(item => {
                    const normal = isItemNormal(item);
                    const critical = isItemCritical(item);
                    const isSelected = selectedItemForDelta?.id === item.id;

                    return (
                      <tr
                        key={item.id}
                        onClick={() => setSelectedItemForDelta(item)}
                        className={`transition cursor-pointer ${
                          isSelected
                            ? 'bg-teal-500/15 border-l-4 border-l-teal-400'
                            : critical
                            ? 'bg-rose-950/20 hover:bg-rose-900/30'
                            : normal
                            ? 'bg-slate-900/40 hover:bg-slate-800/60'
                            : 'bg-amber-950/15 hover:bg-amber-900/20'
                        }`}
                      >
                        <td className="py-3 px-3">
                          <div className="font-bold text-white text-xs">{item.patientName}</div>
                          <div className="text-[10px] text-slate-400 font-mono flex items-center space-x-1.5 mt-0.5">
                            <span className="text-teal-400 font-bold">#{item.sampleBarcode}</span>
                            <span>•</span>
                            <span>{item.patientAge}a {item.patientGender}</span>
                            <span>•</span>
                            <span>{item.transmissionTime}</span>
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-200">{item.analyte}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{item.analyzerName}</div>
                        </td>

                        <td className="py-3 px-3">
                          <div className="flex items-center space-x-1.5">
                            <span className={`text-sm font-black font-mono ${
                              critical ? 'text-rose-400 animate-pulse' : normal ? 'text-emerald-400' : 'text-amber-400'
                            }`}>
                              {item.resultValue}
                            </span>
                            <span className="text-[10px] text-slate-400">{item.unit}</span>
                          </div>
                        </td>

                        <td className="py-3 px-3 font-mono text-[11px] text-slate-400">
                          {item.referenceRange}
                        </td>

                        <td className="py-3 px-3">
                          {item.previousValue !== undefined ? (
                            <div className="space-y-0.5">
                              <span className={`inline-flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                item.deltaFlag === 'DELTA_CRITICAL'
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                                  : item.deltaFlag === 'DELTA_ALERT'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                  : 'bg-emerald-500/20 text-emerald-300'
                              }`}>
                                {item.deltaPercent !== undefined && item.deltaPercent > 0 ? (
                                  <TrendingUp className="w-3 h-3" />
                                ) : (
                                  <TrendingDown className="w-3 h-3" />
                                )}
                                <span>{item.deltaPercent !== undefined ? `${item.deltaPercent > 0 ? '+' : ''}${item.deltaPercent}%` : 'N/A'}</span>
                              </span>
                              <div className="text-[9px] text-slate-500 font-mono">Previo: {item.previousValue} ({item.previousDate})</div>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-500 font-italic">Sin histórico</span>
                          )}
                        </td>

                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              handleValidateSingle(item.id);
                            }}
                            className={`px-3 py-1.5 rounded-xl font-bold text-[10px] transition cursor-pointer flex items-center space-x-1 mx-auto ${
                              item.status === 'VALIDADO_TECNICO'
                                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                                : 'bg-slate-800 hover:bg-teal-500 hover:text-slate-950 text-slate-300'
                            }`}
                          >
                            <Check className="w-3 h-3" />
                            <span>{item.status === 'VALIDADO_TECNICO' ? 'Validado' : 'Validar'}</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Delta Check Detail Panel (1 Col) */}
        <div className="space-y-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
              <History className="w-5 h-5 text-teal-400" />
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                Auditoría Delta Check del Paciente
              </h3>
            </div>

            {selectedItemForDelta ? (
              <div className="space-y-4 text-xs">
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                  <div className="font-black text-sm text-white">{selectedItemForDelta.patientName}</div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    Cédula: <span className="text-slate-200">{selectedItemForDelta.patientNationalId}</span> • Muestra: #{selectedItemForDelta.sampleBarcode}
                  </div>
                  <div className="text-[11px] text-teal-400 font-bold">
                    Analito: {selectedItemForDelta.analyte} ({selectedItemForDelta.analyzerName})
                  </div>
                </div>

                {/* Comparative Metric Card */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Resultado Actual</div>
                    <div className="text-xl font-black text-white font-mono mt-1">{selectedItemForDelta.resultValue} <span className="text-xs font-normal text-slate-400">{selectedItemForDelta.unit}</span></div>
                    <div className="text-[10px] text-emerald-400 font-mono mt-0.5">{selectedItemForDelta.transmissionTime} (Hoy)</div>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Resultado Previo</div>
                    <div className="text-xl font-black text-slate-300 font-mono mt-1">{selectedItemForDelta.previousValue ?? 'N/D'} <span className="text-xs font-normal text-slate-400">{selectedItemForDelta.unit}</span></div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">{selectedItemForDelta.previousDate ?? 'Sin fecha'}</div>
                  </div>
                </div>

                {/* Delta Check Verdict Box */}
                <div className={`p-4 rounded-2xl border ${
                  selectedItemForDelta.deltaFlag === 'DELTA_CRITICAL'
                    ? 'bg-rose-500/10 border-rose-500/40 text-rose-300'
                    : selectedItemForDelta.deltaFlag === 'DELTA_ALERT'
                    ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                    : 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                }`}>
                  <div className="flex items-center space-x-2 font-black text-xs">
                    {selectedItemForDelta.deltaFlag === 'DELTA_CRITICAL' ? (
                      <>
                        <Flame className="w-4 h-4 text-rose-400" />
                        <span>¡Violación Crítica de Delta Check!</span>
                      </>
                    ) : selectedItemForDelta.deltaFlag === 'DELTA_ALERT' ? (
                      <>
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                        <span>Alerta de Variación Significativa</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Delta Check Fisiológicamente Coherente</span>
                      </>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1.5 leading-relaxed">
                    {selectedItemForDelta.deltaFlag === 'DELTA_CRITICAL'
                      ? 'La variación supera el límite de cambio biológico agudo (>40%). Descartar contaminación por suero de infusión intravenosa, confusión de tubo o hemólisis in vitro antes de validar.'
                      : selectedItemForDelta.deltaFlag === 'DELTA_ALERT'
                      ? 'Variación moderada respecto al último registro. Verificar si el paciente tuvo ajuste farmacológico o transfusión.'
                      : 'El valor se encuentra dentro del rango de dispersión intraindividual esperado para este paciente.'}
                  </p>
                </div>

                {/* Preanalytical Clues Checklist */}
                <div className="space-y-1.5 pt-2 border-t border-slate-800">
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Verificación Preanalítica Sugerida</div>
                  <div className="flex items-center justify-between bg-slate-950 p-2 rounded-xl text-[11px]">
                    <span>Índice de Muestra:</span>
                    <span className="font-bold text-teal-400">{selectedItemForDelta.hilStatus.replace('_', ' ')}</span>
                  </div>
                  <div className="flex items-center justify-between bg-slate-950 p-2 rounded-xl text-[11px]">
                    <span>Alícuota Reenvasada:</span>
                    <span className="font-bold text-slate-300">No (Tubo Primario)</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500 text-xs">
                Seleccione un paciente de la tabla para auditar el Delta Check.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SECTION B: CLINICAL CALCULATORS SUITE */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-2xl border border-indigo-500/20">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Calculadoras Clínicas Integradas en Mesón</h3>
              <p className="text-xs text-slate-400">Ecuaciones validadas internacionalmente para emisión inmediata en el informe técnico.</p>
            </div>
          </div>

          {/* Calculator Selector Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'egfr', label: 'eGFR CKD-EPI 2021' },
              { id: 'ldl', label: 'LDL Martin-Hopkins' },
              { id: 'homa', label: 'HOMA-IR Insulina' },
              { id: 'deritis', label: 'Relación AST/ALT' },
              { id: 'calcium', label: 'Calcio Corregido' },
              { id: 'osmolarity', label: 'Osmolaridad Sérica' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveCalculator(tab.id as typeof activeCalculator)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  activeCalculator === tab.id
                    ? 'bg-teal-500 text-slate-950 font-black shadow-md shadow-teal-500/20'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* CALCULATOR 1: eGFR CKD-EPI 2021 */}
        {activeCalculator === 'egfr' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center animate-in fade-in">
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Creatinina Sérica (mg/dL)</label>
                <input
                  type="number"
                  step="0.01"
                  value={egfrCreatinine}
                  onChange={e => setEgfrCreatinine(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm font-bold text-white focus:outline-none focus:border-teal-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Edad (Años)</label>
                  <input
                    type="number"
                    value={egfrAge}
                    onChange={e => setEgfrAge(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm font-bold text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Sexo Biológico</label>
                  <select
                    value={egfrGender}
                    onChange={e => setEgfrGender(e.target.value as 'M' | 'F')}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-teal-500"
                  >
                    <option value="M">Masculino (M)</option>
                    <option value="F">Femenino (F)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Outcome Display */}
            <div className="md:col-span-2 bg-slate-950 p-6 rounded-3xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-center sm:text-left">
                <div className="text-xs text-slate-400 font-bold uppercase">Filtrado Glomerular Estimado (eGFR)</div>
                <div className="text-4xl font-black text-white font-mono">
                  {currentEgfr} <span className="text-base text-slate-400 font-normal">mL/min/1.73 m²</span>
                </div>
                <div className="flex items-center space-x-2 justify-center sm:justify-start">
                  <span className={`text-xs font-black px-3 py-1 rounded-full ${getKdigoStage(currentEgfr).bg} ${getKdigoStage(currentEgfr).color}`}>
                    Estadio {getKdigoStage(currentEgfr).stage}
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  setToastMessage(`✓ eGFR de ${currentEgfr} mL/min/1.73m² copiado para anexar al informe de creatinina.`);
                  setTimeout(() => setToastMessage(null), 4000);
                }}
                className="px-5 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black rounded-xl text-xs transition flex items-center space-x-1.5 cursor-pointer shadow-lg shadow-teal-500/20 shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Anexar al Informe LIS</span>
              </button>
            </div>
          </div>
        )}

        {/* CALCULATOR 2: LDL Martin-Hopkins & Friedewald */}
        {activeCalculator === 'ldl' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center animate-in fade-in">
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase">Colesterol Total (mg/dL)</label>
                <input
                  type="number"
                  value={cholTotal}
                  onChange={e => setCholTotal(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase">Colesterol HDL (mg/dL)</label>
                <input
                  type="number"
                  value={cholHdl}
                  onChange={e => setCholHdl(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase">Triglicéridos (mg/dL)</label>
                <input
                  type="number"
                  value={triglycerides}
                  onChange={e => setTriglycerides(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white"
                />
              </div>
            </div>

            <div className="md:col-span-2 bg-slate-950 p-6 rounded-3xl border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div className="bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
                <div className="text-[10px] text-teal-400 font-bold uppercase">LDL Martin-Hopkins</div>
                <div className="text-2xl font-black text-white font-mono mt-1">{ldlMartinHopkins} mg/dL</div>
                <div className="text-[9px] text-slate-400 mt-1">Recomendado ACC/AHA</div>
              </div>
              <div className="bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
                <div className="text-[10px] text-slate-400 font-bold uppercase">LDL Friedewald</div>
                <div className="text-2xl font-black text-slate-300 font-mono mt-1">{ldlFriedewald} mg/dL</div>
                <div className="text-[9px] text-slate-500 mt-1">Fórmula Clásica (TG/5)</div>
              </div>
              <div className="bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
                <div className="text-[10px] text-indigo-400 font-bold uppercase">Colesterol No-HDL</div>
                <div className="text-2xl font-black text-indigo-300 font-mono mt-1">{nonHdlChol} mg/dL</div>
                <div className="text-[9px] text-slate-400 mt-1">Total - HDL</div>
              </div>
            </div>
          </div>
        )}

        {/* CALCULATOR 3: HOMA-IR */}
        {activeCalculator === 'homa' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center animate-in fade-in">
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Glucosa en Ayunas (mg/dL)</label>
                <input
                  type="number"
                  value={fastingGlucose}
                  onChange={e => setFastingGlucose(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm font-bold text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Insulina Basal (µIU/mL)</label>
                <input
                  type="number"
                  value={fastingInsulin}
                  onChange={e => setFastingInsulin(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm font-bold text-white"
                />
              </div>
            </div>

            <div className="md:col-span-2 bg-slate-950 p-6 rounded-3xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-center sm:text-left">
                <div className="text-xs text-slate-400 font-bold uppercase">Índice HOMA-IR (Resistencia a la Insulina)</div>
                <div className="text-4xl font-black text-white font-mono">
                  {homaIr} <span className="text-xs text-slate-400 font-normal">Puntos</span>
                </div>
                <div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                    homaIr > 2.5 ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'
                  }`}>
                    {homaIr > 2.5 ? '⚠️ Resistencia a la Insulina Probable (>2.5)' : '✓ Sensibilidad a la Insulina Normal (<2.5)'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CALCULATOR 4: De Ritis AST/ALT */}
        {activeCalculator === 'deritis' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center animate-in fade-in">
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">AST / GOT (U/L)</label>
                <input
                  type="number"
                  value={valAst}
                  onChange={e => setValAst(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm font-bold text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">ALT / GPT (U/L)</label>
                <input
                  type="number"
                  value={valAlt}
                  onChange={e => setValAlt(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm font-bold text-white"
                />
              </div>
            </div>

            <div className="md:col-span-2 bg-slate-950 p-6 rounded-3xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-center sm:text-left">
                <div className="text-xs text-slate-400 font-bold uppercase">Cociente de De Ritis (AST / ALT)</div>
                <div className="text-4xl font-black text-white font-mono">
                  {deRitisRatio}
                </div>
                <div className="text-xs text-slate-300">
                  {deRitisRatio > 2.0 ? '🔴 Sugiere daño hepático alcohólico o cirrosis avanzada (>2.0)' : deRitisRatio < 1.0 ? '🟡 Típico de Esteatohepatitis no alcohólica (NASH) o hepatitis viral aguda (<1.0)' : '🟢 Rango estándar (1.0 - 2.0)'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CALCULATOR 5: Corrected Calcium */}
        {activeCalculator === 'calcium' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center animate-in fade-in">
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Calcio Total Medido (mg/dL)</label>
                <input
                  type="number"
                  step="0.1"
                  value={totalCalcium}
                  onChange={e => setTotalCalcium(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm font-bold text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Albúmina Sérica (g/dL)</label>
                <input
                  type="number"
                  step="0.1"
                  value={serumAlbumin}
                  onChange={e => setSerumAlbumin(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm font-bold text-white"
                />
              </div>
            </div>

            <div className="md:col-span-2 bg-slate-950 p-6 rounded-3xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-center sm:text-left">
                <div className="text-xs text-slate-400 font-bold uppercase">Calcio Corregido por Albúmina (Fórmula de Payne)</div>
                <div className="text-4xl font-black text-white font-mono">
                  {correctedCalcium} <span className="text-base text-slate-400 font-normal">mg/dL</span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  Fórmula: [Ca Total] + 0.8 * (4.0 - [Albúmina])
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CALCULATOR 6: Osmolarity */}
        {activeCalculator === 'osmolarity' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center animate-in fade-in">
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase">Sodio Na+ (mmol/L)</label>
                <input
                  type="number"
                  value={serumSodium}
                  onChange={e => setSerumSodium(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase">Glucosa (mg/dL)</label>
                <input
                  type="number"
                  value={serumGlucose}
                  onChange={e => setSerumGlucose(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase">BUN / Nitrógeno Ureico (mg/dL)</label>
                <input
                  type="number"
                  value={serumBun}
                  onChange={e => setSerumBun(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white"
                />
              </div>
            </div>

            <div className="md:col-span-2 bg-slate-950 p-6 rounded-3xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-center sm:text-left">
                <div className="text-xs text-slate-400 font-bold uppercase">Osmolaridad Plasmática Calculada</div>
                <div className="text-4xl font-black text-white font-mono">
                  {calcOsmolarity} <span className="text-base text-slate-400 font-normal">mOsm/kg</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Rango normal: 275 - 295 mOsm/kg
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
