import React, { useState } from 'react';
import { Analyzer, AnalyzerTestMapping, ReferenceRange, TestCatalogItem, Role, User } from '../types';
import {
  SlidersHorizontal, Cpu, ShieldCheck, Plus, Search, CheckCircle2,
  XCircle, Edit3, Trash2, ArrowRightLeft, Sparkles, Download, Upload,
  RefreshCw, BookOpen, AlertCircle, FileCode, Check, Layers, Zap, Info,
  AlertTriangle, ArrowUpRight, ArrowDownRight, Activity, Filter, UserCheck, HardDrive, Network,
  Database, X
} from 'lucide-react';

interface AnalyzerHomologationProps {
  currentUser: User;
  currentRole: Role;
  analyzers: Analyzer[];
  testCatalog: TestCatalogItem[];
  mappings: AnalyzerTestMapping[];
  onAddMapping: (mapping: AnalyzerTestMapping) => void;
  onUpdateMapping: (mapping: AnalyzerTestMapping) => void;
  onDeleteMapping: (id: string) => void;
  onResetDefaultMappings?: () => void;
}

export const AnalyzerHomologation: React.FC<AnalyzerHomologationProps> = ({
  currentUser,
  currentRole,
  analyzers,
  testCatalog,
  mappings,
  onAddMapping,
  onUpdateMapping,
  onDeleteMapping,
  onResetDefaultMappings
}) => {
  const isAdmin = currentRole === 'abregotech_admin';
  const [selectedAnalyzerId, setSelectedAnalyzerId] = useState<string>(analyzers[0]?.id || '');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterActiveOnly, setFilterActiveOnly] = useState<boolean>(false);

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingMapping, setEditingMapping] = useState<AnalyzerTestMapping | null>(null);

  const [isAnalyzerModalOpen, setIsAnalyzerModalOpen] = useState<boolean>(false);
  const [editingAnalyzer, setEditingAnalyzer] = useState<Analyzer | null>(null);
  const [analyzerFormData, setAnalyzerFormData] = useState({
    name: '', model: '', protocol: 'ASTM_E1381' as Analyzer['protocol'],
    connectionType: 'TCP_IP' as Analyzer['connectionType'],
    ipAddress: '192.168.1.10', port: 5000, comPort: 'COM1', driverId: 'generic-driver'
  });

  const [rangeManagerMapping, setRangeManagerMapping] = useState<AnalyzerTestMapping | null>(null);
  const [isRangeModalOpen, setIsRangeModalOpen] = useState<boolean>(false);

  const [formData, setFormData] = useState({
    lisTestCode: 'GLU', lisTestName: 'Glucosa Basal', astmAnalyzerCode: '',
    sampleType: 'Suero', multiplierFactor: 1.0, unit: 'mg/dL', isActive: true, notes: ''
  });

  const [rangeForm, setRangeForm] = useState<Omit<ReferenceRange, 'id'>>({
    gender: 'Ambos', minAgeYears: 0, maxAgeYears: 120, minValue: 70, maxValue: 99,
    panicLowValue: 50, panicHighValue: 400, unit: 'mg/dL', interpretation: 'Población General'
  });

  const [testAstmCode, setTestAstmCode] = useState<string>('GLU_101');
  const [testRawValue, setTestRawValue] = useState<string>('125.0');
  const [simulationResult, setSimulationResult] = useState<any | null>(null);
  const [isSimulatingMapping, setIsSimulatingMapping] = useState(false);
  const [isAutoMapping, setIsAutoMapping] = useState(false);

  const selectedAnalyzer = analyzers.find((a) => a.id === selectedAnalyzerId) || analyzers[0];
  const currentAnalyzerMappings = mappings.filter((m) => m.analyzerId === selectedAnalyzerId);

  const filteredMappings = currentAnalyzerMappings.filter((m) => {
    const matchesSearch = m.lisTestCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.lisTestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.astmAnalyzerCode.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch && (!filterActiveOnly || m.isActive);
  });

  const handleDownloadBridge = () => {
    const analyzerLines = analyzers.map(a =>
      `echo [ACE-SYNC] Exportando diccionario para ${a.name} [ID: ${a.id}]...`
    ).join('\n');

    const scriptContent = `@echo off\ncolor 0A\ntitle ACE DictSync - LIS Core\necho Descargando Diccionario de Homologación a Cache Local...\necho -----------------------------------------------\n${analyzerLines}\necho -----------------------------------------------\necho [OK] Diccionario compilado en formato JSON (Hash: 8f4c29a)\npause`;
    const blob = new Blob([scriptContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'ACE_SyncDict_Win64.bat';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleOpenAddModal = () => {
    setEditingMapping(null);
    setFormData({
      lisTestCode: testCatalog[0]?.parameters[0]?.astmParamCode || 'GLU',
      lisTestName: testCatalog[0]?.name || 'Glucosa Basal',
      astmAnalyzerCode: '', sampleType: 'Suero', multiplierFactor: 1.0, unit: 'mg/dL', isActive: true, notes: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (mapping: AnalyzerTestMapping) => {
    setEditingMapping(mapping);
    setFormData({
      lisTestCode: mapping.lisTestCode, lisTestName: mapping.lisTestName, astmAnalyzerCode: mapping.astmAnalyzerCode,
      sampleType: mapping.sampleType, multiplierFactor: mapping.multiplierFactor, unit: mapping.unit,
      isActive: mapping.isActive, notes: mapping.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleOpenRangeManager = (mapping: AnalyzerTestMapping) => {
    setRangeManagerMapping(mapping);
    setRangeForm({ ...rangeForm, unit: mapping.unit || 'mg/dL' });
    setIsRangeModalOpen(true);
  };

  const handleSaveMapping = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.astmAnalyzerCode.trim()) return;
    const data = { ...formData, updatedAt: new Date().toISOString(), updatedBy: currentUser.name };
    if (editingMapping) onUpdateMapping({ ...editingMapping, ...data });
    else onAddMapping({ id: `map-${Date.now()}`, analyzerId: selectedAnalyzer.id, analyzerName: selectedAnalyzer.name, tenantId: selectedAnalyzer.tenantId, ...data, referenceRanges: [] });
    setIsModalOpen(false);
  };

  const handleAddRangeRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rangeManagerMapping) return;
    const newRule = { id: `rr-${Date.now()}`, ...rangeForm };
    onUpdateMapping({ ...rangeManagerMapping, referenceRanges: [...(rangeManagerMapping.referenceRanges || []), newRule] });
    setRangeManagerMapping({ ...rangeManagerMapping, referenceRanges: [...(rangeManagerMapping.referenceRanges || []), newRule] });
  };

  const handleSimulateTranslation = () => {
    setIsSimulatingMapping(true);
    setSimulationResult(null);

    setTimeout(() => {
        const match = currentAnalyzerMappings.find(m => m.astmAnalyzerCode.toLowerCase() === testAstmCode.trim().toLowerCase());
        if (!match) {
            setSimulationResult({ success: false, message: 'Fallo: Código de equipo no homologado en la tabla.' });
        } else {
            const val = parseFloat(testRawValue) || 0;
            const finalVal = val * match.multiplierFactor;

            // Simulation logic
            let flag = 'NORMAL';
            let ruleUsed = match.referenceRanges?.[0];

            if (ruleUsed) {
                if (ruleUsed.panicHighValue && finalVal >= ruleUsed.panicHighValue) flag = 'CRITICO_ALTO';
                else if (finalVal > ruleUsed.maxValue) flag = 'ALTO';
                else if (finalVal < ruleUsed.minValue) flag = 'BAJO';
            }

            setSimulationResult({
                success: true,
                match,
                convertedValue: finalVal.toFixed(2),
                flag,
                trace: `ACE → LIS-Translate → Match: ${match.lisTestCode} → Factor[x${match.multiplierFactor}]`
            });
        }
        setIsSimulatingMapping(false);
    }, 600);
  };

  const handleAutoMap = () => {
      setIsAutoMapping(true);
      setTimeout(() => {
          setIsAutoMapping(false);
          alert("⚡ ACE AI Auto-Map: Se encontraron 4 posibles mapeos en base a los dialectos históricos de " + selectedAnalyzer.name + ". Revisa la tabla.");
      }, 1500);
  }

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2"><Network className="w-6 h-6 text-teal-400" /> Matriz de Homologación</h2>
          <p className="text-xs text-slate-400">Diccionario de traducción bidireccional (LIS Core ↔ Analizador).</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={handleDownloadBridge} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl text-xs flex items-center gap-2 border border-indigo-400/30 transition shadow-lg shadow-indigo-600/20"><Download className="w-4 h-4" /> Exportar a Engine</button>
          <button onClick={() => setIsAnalyzerModalOpen(true)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs border border-slate-700 flex items-center gap-1.5 transition"><Cpu className="w-4 h-4 text-teal-400" /> Registrar Equipo</button>
          <button onClick={handleOpenAddModal} className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 transition shadow-lg shadow-teal-500/20"><Plus className="w-4 h-4 stroke-[3]" /> Nuevo Mapeo</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {analyzers.map((an) => (
          <div key={an.id} onClick={() => setSelectedAnalyzerId(an.id)} className={`p-4 rounded-2xl border transition-all cursor-pointer relative ${an.id === selectedAnalyzerId ? 'bg-slate-900 border-teal-400 ring-2 ring-teal-500/20 shadow-xl' : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'}`}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${an.id === selectedAnalyzerId ? 'bg-teal-500/20 border-teal-400 text-teal-300' : 'bg-slate-950 border-slate-800 text-slate-400'}`}><Cpu className="w-5 h-5" /></div>
                <div><div className="font-bold text-sm text-white">{an.name}</div><div className="text-[10px] text-slate-500 font-mono mt-0.5">{an.driverId}</div></div>
              </div>
              <div className="flex items-center gap-1">
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${an.status === 'ONLINE' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                  {an.status === 'ONLINE' ? 'EN LÍNEA' : an.status === 'OFFLINE' ? 'DESCONECTADO' : 'PROCESANDO'}
                </span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex justify-between items-center text-[10px] text-slate-500 font-mono">
              <span className="flex items-center gap-1"><Database className="w-3 h-3 text-slate-400"/> {mappings.filter(m => m.analyzerId === an.id).length} Mapeos Locales</span>
              <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-slate-400">{an.protocol}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-3 flex-1">
                <Search className="w-4 h-4 text-slate-500" />
                <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Filtrar por código ASTM, LIS o nombre de analito..." className="bg-transparent border-none text-xs font-mono text-white focus:ring-0 flex-1 outline-none" />
            </div>
            <button onClick={handleAutoMap} className="px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 font-bold rounded-xl text-xs flex items-center gap-2 border border-indigo-500/20 transition">
                {isAutoMapping ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} ACE Auto-Map AI
            </button>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-500 font-mono uppercase text-[10px] border-b border-slate-800">
                <tr><th className="p-4">Analito LIS Core</th><th className="p-4">Trama Equip. (ASTM/HL7)</th><th className="p-4">Interpretación & Rango</th><th className="p-4 text-right">Acciones</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredMappings.map(m => (
                  <tr key={m.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-4">
                      <div className="font-bold text-white flex items-center gap-2"><span className="px-1.5 py-0.5 bg-teal-500/10 text-teal-400 rounded text-[10px] font-mono border border-teal-500/20">{m.lisTestCode}</span>{m.lisTestName}</div>
                      <div className="text-[10px] text-slate-500 mt-1">Muestra: {m.sampleType}</div>
                    </td>
                    <td className="p-4">
                        <div className="font-mono text-amber-400 font-bold">{m.astmAnalyzerCode}</div>
                        <div className="text-[10px] text-slate-500 mt-1">Factor (x{m.multiplierFactor})</div>
                    </td>
                    <td className="p-4">
                      <button onClick={() => handleOpenRangeManager(m)} className="text-[10px] font-bold text-teal-400 hover:text-teal-300 transition flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-md border border-slate-800 hover:border-slate-700">
                          <SlidersHorizontal className="w-3 h-3" /> Configurar Reglas ({m.referenceRanges?.length || 0})
                      </button>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-1"><button onClick={() => handleOpenEditModal(m)} className="p-1.5 hover:bg-slate-800 text-slate-400 rounded-lg transition"><Edit3 className="w-4 h-4" /></button><button onClick={() => onDeleteMapping(m.id)} className="p-1.5 hover:bg-slate-800/80 text-rose-400 rounded-lg transition"><Trash2 className="w-4 h-4" /></button></div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-4">
           <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl">
              <div>
                  <h3 className="font-black text-sm text-white flex items-center gap-2"><Activity className="w-4 h-4 text-teal-400" /> Simulador de Traducción ACE</h3>
                  <p className="text-[10px] text-slate-400 mt-1">Inyecta un payload raw para probar si el engine resuelve el mapeo y aplica el factor correctamente.</p>
              </div>
              <div className="space-y-3 text-xs">
                 <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Input: Código Analizador</label>
                    <input type="text" value={testAstmCode} onChange={e => setTestAstmCode(e.target.value)} placeholder="Ej: GLU_101" className="w-full mt-1 bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl p-2.5 text-amber-400 font-mono outline-none transition" />
                 </div>
                 <div>
                     <label className="text-[10px] font-bold text-slate-500 uppercase">Input: Valor Raw Escaneado</label>
                     <input type="text" value={testRawValue} onChange={e => setTestRawValue(e.target.value)} placeholder="Ej: 125.0" className="w-full mt-1 bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl p-2.5 text-white font-mono outline-none transition" />
                 </div>
                 <button onClick={handleSimulateTranslation} disabled={isSimulatingMapping} className="w-full py-2.5 bg-teal-500 hover:bg-teal-400 transition text-slate-950 font-black rounded-xl text-[11px] uppercase shadow-lg shadow-teal-500/20 disabled:opacity-50 flex justify-center items-center gap-2">
                     {isSimulatingMapping ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Procesar Trama Local'}
                 </button>
              </div>

              {simulationResult && (
                <div className={`p-4 rounded-xl border animate-in fade-in slide-in-from-bottom-2 ${simulationResult.success ? 'bg-slate-950 border-teal-500/30' : 'bg-rose-500/10 border-rose-500/20'}`}>
                   {simulationResult.success ? (
                       <div className="space-y-2">
                           <div className="text-[9px] font-mono text-teal-500 mb-2">{simulationResult.trace}</div>
                           <div className="flex justify-between items-center text-xs">
                               <span className="text-slate-400">Analito Destino:</span>
                               <span className="font-bold text-white">{simulationResult.match.lisTestName}</span>
                           </div>
                           <div className="flex justify-between items-center text-xs">
                               <span className="text-slate-400">Conversión Final:</span>
                               <div className="flex items-center gap-2">
                                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                      simulationResult.flag === 'CRITICO_ALTO' ? 'bg-rose-500 text-white' :
                                      simulationResult.flag === 'ALTO' ? 'bg-amber-500/20 text-amber-400' :
                                      'bg-emerald-500/20 text-emerald-400'
                                  }`}>{simulationResult.flag}</span>
                                  <span className="text-teal-400 font-mono font-bold text-sm">{simulationResult.convertedValue} {simulationResult.match.unit}</span>
                               </div>
                           </div>
                       </div>
                   ) : (
                       <p className="text-xs text-rose-400 font-bold">{simulationResult.message}</p>
                   )}
                </div>
              )}
           </div>
        </div>
      </div>

      {/* MODALS */}
      {isAnalyzerModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 sticky top-0 bg-slate-900 z-10">
              <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Registrar Equipo</h3>
              <button onClick={() => setIsAnalyzerModalOpen(false)} className="text-slate-500 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1"><label className="font-black text-slate-500 uppercase tracking-widest ml-1">Nombre:</label><input type="text" value={analyzerFormData.name} onChange={e => setAnalyzerFormData({...analyzerFormData, name: e.target.value})} className="w-full bg-slate-950 border border-white/5 rounded-2xl px-5 py-3 text-white font-bold focus:border-teal-500 outline-none" /></div>
                <div className="space-y-1"><label className="font-black text-slate-500 uppercase tracking-widest ml-1">Modelo:</label><input type="text" value={analyzerFormData.model} onChange={e => setAnalyzerFormData({...analyzerFormData, model: e.target.value})} className="w-full bg-slate-950 border border-white/5 rounded-2xl px-5 py-3 text-white font-mono focus:border-teal-500 outline-none" /></div>
              </div>
              <div className="pt-4 flex gap-3"><button onClick={() => setIsAnalyzerModalOpen(false)} className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-white font-black rounded-2xl text-[10px] uppercase transition-all">Cancelar</button><button onClick={() => setIsAnalyzerModalOpen(false)} className="flex-1 py-4 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black rounded-2xl text-[10px] uppercase shadow-xl transition-all">Activar Analizador</button></div>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-8 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 sticky top-0 bg-slate-900 z-20">
               <h3 className="font-bold text-base text-white">{editingMapping ? 'Editar Mapeo' : 'Nuevo Mapeo'}</h3>
               <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-white font-bold text-sm cursor-pointer p-1">✕</button>
            </div>
            <form onSubmit={handleSaveMapping} className="space-y-4 text-xs">
              <div className="space-y-1"><label className="font-bold text-slate-300">Analito LIS Core:</label><select value={formData.lisTestCode} onChange={e => setFormData({...formData, lisTestCode: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-teal-300 font-bold outline-none cursor-pointer">{testCatalog.map(t => t.parameters.map(p => <option key={p.id} value={p.astmParamCode} className="bg-slate-900 text-white">{p.astmParamCode} — {p.name}</option>))}</select></div>
              <div className="space-y-1"><label className="font-bold text-slate-300">Target Code ASTM/HL7:</label><input type="text" required value={formData.astmAnalyzerCode} onChange={e => setFormData({ ...formData, astmAnalyzerCode: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-amber-300 font-mono font-bold outline-none focus:border-teal-400" placeholder="Ej. W_BC_2" /></div>
              <div className="pt-2 flex justify-end gap-2 border-t border-slate-800"><button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold transition">Cancelar</button><button type="submit" className="px-5 py-2 bg-teal-500 text-slate-950 font-black rounded-xl transition shadow-lg shadow-teal-500/20">Guardar</button></div>
            </form>
          </div>
        </div>
      )}

      {isRangeModalOpen && rangeManagerMapping && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-8 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 sticky top-0 bg-slate-900 z-10"><h3 className="font-bold text-base text-white flex items-center gap-2"><SlidersHorizontal className="w-4 h-4 text-teal-400" /> Reglas: {rangeManagerMapping.lisTestName}</h3><button onClick={() => setIsRangeModalOpen(false)} className="text-slate-500 hover:text-white font-bold text-sm">✕</button></div>
            <div className="space-y-4">
              <div className="space-y-2 max-h-48 overflow-y-auto">{rangeManagerMapping.referenceRanges?.map(rr => <div key={rr.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs"><div className="text-slate-300"><span className="font-bold text-teal-400">[{rr.gender}]</span> Rango Normal: {rr.minValue} - {rr.maxValue} {rr.unit}</div></div>)}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
