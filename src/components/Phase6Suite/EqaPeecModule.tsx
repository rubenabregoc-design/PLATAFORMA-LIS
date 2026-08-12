import React, { useState } from 'react';
import {
  Award,
  Target,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  Plus,
  RefreshCw,
  Search,
  Filter,
  Info,
  ShieldCheck,
  Send,
  Download,
  Calendar,
  Sparkles,
  ChevronRight,
  Layers
} from 'lucide-react';
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ReferenceLine } from 'recharts';

export interface EqaSample {
  id: string;
  program: 'RIQAS' | 'CAP' | 'PEEC_MINSA' | 'BIORAD_EQAS';
  cycle: string; // e.g. "2026-Q3"
  analyte: string;
  unit: string;
  analyzer: string;
  targetMean: number;
  peerGroupSD: number;
  reportedResult: number;
  zScore: number;
  sdi: number;
  biasPercent: number;
  evaluation: 'SATISFACTORIO' | 'ALERTA' | 'INACEPTABLE';
  submissionDate: string;
  evaluatedDate: string;
}

const INITIAL_EQA_SAMPLES: EqaSample[] = [
  {
    id: 'eq-101',
    program: 'RIQAS',
    cycle: '2026-Ciclo 3',
    analyte: 'Glucosa en Suero',
    unit: 'mg/dL',
    analyzer: 'Vitros 4600 Bioquímica',
    targetMean: 98.4,
    peerGroupSD: 2.1,
    reportedResult: 99.2,
    zScore: 0.38,
    sdi: 0.38,
    biasPercent: 0.81,
    evaluation: 'SATISFACTORIO',
    submissionDate: '2026-07-15',
    evaluatedDate: '2026-07-28'
  },
  {
    id: 'eq-102',
    program: 'RIQAS',
    cycle: '2026-Ciclo 3',
    analyte: 'Hemoglobina',
    unit: 'g/dL',
    analyzer: 'Sysmex XN-1000',
    targetMean: 13.8,
    peerGroupSD: 0.25,
    reportedResult: 13.9,
    zScore: 0.40,
    sdi: 0.40,
    biasPercent: 0.72,
    evaluation: 'SATISFACTORIO',
    submissionDate: '2026-07-15',
    evaluatedDate: '2026-07-28'
  },
  {
    id: 'eq-103',
    program: 'PEEC_MINSA',
    cycle: '2026-Eval 2',
    analyte: 'Creatinina',
    unit: 'mg/dL',
    analyzer: 'Vitros 4600 Bioquímica',
    targetMean: 1.10,
    peerGroupSD: 0.05,
    reportedResult: 1.22,
    zScore: 2.40,
    sdi: 2.40,
    biasPercent: 10.9,
    evaluation: 'ALERTA',
    submissionDate: '2026-06-10',
    evaluatedDate: '2026-06-25'
  },
  {
    id: 'eq-104',
    program: 'CAP',
    cycle: '2026-CAP-B',
    analyte: 'TSH Ultrasensible',
    unit: 'µIU/mL',
    analyzer: 'Mindray CL-1200i',
    targetMean: 2.45,
    peerGroupSD: 0.12,
    reportedResult: 2.48,
    zScore: 0.25,
    sdi: 0.25,
    biasPercent: 1.22,
    evaluation: 'SATISFACTORIO',
    submissionDate: '2026-08-01',
    evaluatedDate: '2026-08-10'
  },
  {
    id: 'eq-105',
    program: 'BIORAD_EQAS',
    cycle: '2026-Módulo 8',
    analyte: 'Colesterol Total',
    unit: 'mg/dL',
    analyzer: 'Vitros 4600 Bioquímica',
    targetMean: 210.0,
    peerGroupSD: 5.2,
    reportedResult: 228.5,
    zScore: 3.56,
    sdi: 3.56,
    biasPercent: 8.8,
    evaluation: 'INACEPTABLE',
    submissionDate: '2026-05-12',
    evaluatedDate: '2026-05-28'
  }
];

export const EqaPeecModule: React.FC = () => {
  const [samples, setSamples] = useState<EqaSample[]>(INITIAL_EQA_SAMPLES);
  const [selectedProgram, setSelectedProgram] = useState<string>('TODOS');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Form State for new EQA Result Entry
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [formProgram, setFormProgram] = useState<'RIQAS' | 'CAP' | 'PEEC_MINSA' | 'BIORAD_EQAS'>('RIQAS');
  const [formCycle, setFormCycle] = useState<string>('2026-Ciclo 4');
  const [formAnalyte, setFormAnalyte] = useState<string>('HbA1c Hemoglobina Glicada');
  const [formUnit, setFormUnit] = useState<string>('%');
  const [formAnalyzer, setFormAnalyzer] = useState<string>('Sysmex XN-1000 / HPLC');
  const [formTargetMean, setFormTargetMean] = useState<number>(6.5);
  const [formPeerSD, setFormPeerSD] = useState<number>(0.15);
  const [formReported, setFormReported] = useState<number>(6.55);

  const filteredSamples = samples.filter(s => {
    if (selectedProgram !== 'TODOS' && s.program !== selectedProgram) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return s.analyte.toLowerCase().includes(term) || s.analyzer.toLowerCase().includes(term);
    }
    return true;
  });

  // Calculate Z-Score: (Reported - Target) / SD
  const handleSaveSample = (e: React.FormEvent) => {
    e.preventDefault();
    const zScore = (formReported - formTargetMean) / (formPeerSD || 1);
    const biasPercent = ((formReported - formTargetMean) / formTargetMean) * 100;
    
    let evaluation: 'SATISFACTORIO' | 'ALERTA' | 'INACEPTABLE' = 'SATISFACTORIO';
    if (Math.abs(zScore) > 3) evaluation = 'INACEPTABLE';
    else if (Math.abs(zScore) > 2) evaluation = 'ALERTA';

    const newSample: EqaSample = {
      id: `eq-${Date.now()}`,
      program: formProgram,
      cycle: formCycle,
      analyte: formAnalyte,
      unit: formUnit,
      analyzer: formAnalyzer,
      targetMean: formTargetMean,
      peerGroupSD: formPeerSD,
      reportedResult: formReported,
      zScore: Number(zScore.toFixed(2)),
      sdi: Number(zScore.toFixed(2)),
      biasPercent: Number(biasPercent.toFixed(2)),
      evaluation,
      submissionDate: new Date().toISOString().split('T')[0],
      evaluatedDate: new Date().toISOString().split('T')[0]
    };

    setSamples(prev => [newSample, ...prev]);
    setIsModalOpen(false);
    alert('¡Resultado de Control Externo de Calidad registrado y evaluado con éxito!');
  };

  // Data for Youden Plot / Z-Score Scatter
  const scatterData = filteredSamples.map(s => ({
    x: s.zScore,
    y: s.biasPercent,
    name: s.analyte,
    program: s.program,
    eval: s.evaluation
  }));

  const satisfactoryCount = samples.filter(s => s.evaluation === 'SATISFACTORIO').length;
  const alertCount = samples.filter(s => s.evaluation === 'ALERTA').length;
  const unacceptableCount = samples.filter(s => s.evaluation === 'INACEPTABLE').length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-950 border border-teal-500/30 p-6 sm:p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden backdrop-blur-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="text-teal-400 text-xs font-black uppercase tracking-[0.2em] mb-2 flex items-center space-x-2">
              <Award className="w-4 h-4 text-teal-400 animate-pulse" />
              <span>Evaluación Externa de Calidad (PEEC / EQA) • ISO 15189:2022</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Control de Calidad Interlaboratorio & Z-Score
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-2 max-w-2xl leading-relaxed">
              Comparación del desempeño analítico del laboratorio con grupos pares globales (RIQAS, CAP, PEEC-MINSA), índices de desviación estándar (SDI) y gráfico de Youden.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-black px-5 py-3 rounded-2xl text-xs transition shadow-xl flex items-center space-x-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Registrar Muestra Ciega PEEC</span>
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-white/10">
          <div className="bg-slate-950/60 border border-white/5 p-4 rounded-2xl space-y-1">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ensayos Evaluados</div>
            <div className="text-2xl font-black font-mono text-white">{samples.length}</div>
            <div className="text-[10px] text-teal-400 font-bold">Programas Activos</div>
          </div>

          <div className="bg-slate-950/60 border border-white/5 p-4 rounded-2xl space-y-1">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Satisfactorios (|Z| ≤ 2.0)</div>
            <div className="text-2xl font-black font-mono text-emerald-400">{satisfactoryCount}</div>
            <div className="text-[10px] text-emerald-400 font-bold">Cumplimiento {((satisfactoryCount / samples.length) * 100).toFixed(1)}%</div>
          </div>

          <div className="bg-slate-950/60 border border-white/5 p-4 rounded-2xl space-y-1">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">En Advertencia (2.0 &lt; |Z| ≤ 3.0)</div>
            <div className="text-2xl font-black font-mono text-amber-400">{alertCount}</div>
            <div className="text-[10px] text-amber-400 font-bold">Requieren Revisión Técnica</div>
          </div>

          <div className="bg-slate-950/60 border border-white/5 p-4 rounded-2xl space-y-1">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Inaceptables (|Z| &gt; 3.0)</div>
            <div className="text-2xl font-black font-mono text-rose-400">{unacceptableCount}</div>
            <div className="text-[10px] text-rose-400 font-bold">Acción Correctiva Obligatoria</div>
          </div>
        </div>
      </div>

      {/* Main Grid: Youden Plot + Filter Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Youden Plot / Z-Score Chart */}
        <div className="lg:col-span-1 bg-slate-900/90 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-sm flex items-center space-x-2">
              <Target className="w-4 h-4 text-teal-400" />
              <span>Distribución de Z-Score vs Sesgo %</span>
            </h3>
            <span className="text-[10px] bg-slate-800 text-slate-300 font-mono px-2 py-0.5 rounded-lg">
              Límite Z ±2.0
            </span>
          </div>

          <p className="text-xs text-slate-400">
            Los puntos dentro de la franja central (|Z| ≤ 2.0) certifican exactitud analítica frente a pares internacionales.
          </p>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis type="number" dataKey="x" name="Z-Score" domain={[-4, 4]} stroke="#64748b" fontSize={10} />
                <YAxis type="number" dataKey="y" name="Sesgo %" domain={[-15, 15]} stroke="#64748b" fontSize={10} />
                <ReferenceLine x={2} stroke="#f59e0b" strokeDasharray="3 3" />
                <ReferenceLine x={-2} stroke="#f59e0b" strokeDasharray="3 3" />
                <ReferenceLine x={0} stroke="#2dd4bf" />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-xs space-y-1 shadow-2xl">
                          <div className="font-bold text-teal-300">{data.name}</div>
                          <div className="text-[10px] text-slate-400">{data.program}</div>
                          <div className="font-mono text-white">Z-Score: <strong>{data.x}</strong></div>
                          <div className="font-mono text-slate-300">Sesgo: <strong>{data.y}%</strong></div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Scatter data={scatterData}>
                  {scatterData.map((entry, index) => {
                    let color = '#34d399'; // green
                    if (entry.eval === 'ALERTA') color = '#fbbf24'; // amber
                    if (entry.eval === 'INACEPTABLE') color = '#f87171'; // red
                    return <Cell key={`cell-${index}`} fill={color} />;
                  })}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-around text-[10px] pt-2 border-t border-slate-800 text-slate-400">
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              <span>Conforme (|Z| ≤ 2.0)</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
              <span>Alerta (2 &lt; |Z| ≤ 3)</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span>
              <span>No Conforme (|Z| &gt; 3)</span>
            </span>
          </div>
        </div>

        {/* EQA Samples Table */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="font-bold text-white text-base flex items-center space-x-2">
              <FileSpreadsheet className="w-5 h-5 text-teal-400" />
              <span>Bitácora de Resultados EQA / PEEC Registrados</span>
            </h3>

            <div className="flex items-center space-x-2">
              <select
                value={selectedProgram}
                onChange={(e) => setSelectedProgram(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-xs font-bold text-slate-200 rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-teal-500"
              >
                <option value="TODOS">Todos los Programas</option>
                <option value="RIQAS">RIQAS (Randox)</option>
                <option value="CAP">CAP (College of American Pathologists)</option>
                <option value="PEEC_MINSA">PEEC MINSA Panamá</option>
                <option value="BIORAD_EQAS">Bio-Rad EQAS</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 text-[10px] font-black uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3">Programa / Ciclo</th>
                  <th className="p-3">Analito / Equipo</th>
                  <th className="p-3 text-right">Target (Media Par)</th>
                  <th className="p-3 text-right">Reportado</th>
                  <th className="p-3 text-right">Z-Score (SDI)</th>
                  <th className="p-3 text-right">Sesgo %</th>
                  <th className="p-3 text-center">Dictamen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {filteredSamples.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-3">
                      <div className="font-bold text-white">{s.program}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{s.cycle}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-teal-300">{s.analyte}</div>
                      <div className="text-[10px] text-slate-400">{s.analyzer}</div>
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-slate-300">
                      {s.targetMean} <span className="text-[9px] text-slate-500">{s.unit}</span>
                    </td>
                    <td className="p-3 text-right font-mono font-black text-white">
                      {s.reportedResult} <span className="text-[9px] text-slate-500">{s.unit}</span>
                    </td>
                    <td className="p-3 text-right font-mono font-bold">
                      <span className={`px-2 py-0.5 rounded-md ${
                        Math.abs(s.zScore) <= 2
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : Math.abs(s.zScore) <= 3
                          ? 'bg-amber-500/10 text-amber-400'
                          : 'bg-rose-500/10 text-rose-400'
                      }`}>
                        {s.zScore > 0 ? `+${s.zScore}` : s.zScore}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono text-slate-300">
                      {s.biasPercent}%
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${
                        s.evaluation === 'SATISFACTORIO'
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                          : s.evaluation === 'ALERTA'
                          ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                          : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                      }`}>
                        {s.evaluation}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal for New EQA Sample Entry */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="font-black text-white text-lg flex items-center space-x-2">
                <Award className="w-5 h-5 text-teal-400" />
                <span>Registrar Muestra de Control Ciego (PEEC / EQA)</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white text-xl font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSample} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Programa PEEC:</label>
                  <select
                    value={formProgram}
                    onChange={(e) => setFormProgram(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-bold"
                  >
                    <option value="RIQAS">RIQAS (Randox)</option>
                    <option value="CAP">CAP College of American Pathologists</option>
                    <option value="PEEC_MINSA">PEEC MINSA Panamá</option>
                    <option value="BIORAD_EQAS">Bio-Rad EQAS</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Ciclo / Edición:</label>
                  <input
                    type="text"
                    value={formCycle}
                    onChange={(e) => setFormCycle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Analito Evaluado:</label>
                <input
                  type="text"
                  value={formAnalyte}
                  onChange={(e) => setFormAnalyte(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Unidad de Medida:</label>
                  <input
                    type="text"
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Analizador:</label>
                  <input
                    type="text"
                    value={formAnalyzer}
                    onChange={(e) => setFormAnalyzer(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 bg-slate-950 p-3 rounded-2xl border border-slate-800">
                <div>
                  <label className="font-bold text-slate-400 block mb-1">Media Par Target:</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formTargetMean}
                    onChange={(e) => setFormTargetMean(parseFloat(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-teal-300 font-mono font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-400 block mb-1">DE Par (SD):</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formPeerSD}
                    onChange={(e) => setFormPeerSD(parseFloat(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-teal-300 font-mono font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-400 block mb-1">Valor Reportado:</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formReported}
                    onChange={(e) => setFormReported(parseFloat(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-white font-mono font-bold"
                    required
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black"
                >
                  Calcular Z-Score y Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
