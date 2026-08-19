import React, { useState } from 'react';
import { Analyzer, AnalyzerTestMapping, ReferenceRange, TestCatalogItem, Role, User } from '../types';
import {
  SlidersHorizontal, Cpu, ShieldCheck, Plus, Search, CheckCircle2,
  XCircle, Edit3, Trash2, ArrowRightLeft, Sparkles, Download, Upload,
  RefreshCw, BookOpen, AlertCircle, FileCode, Check, Layers, Zap, Info,
  AlertTriangle, ArrowUpRight, ArrowDownRight, Activity, Filter, UserCheck, HardDrive
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
  onAddAnalyzer?: (analyzer: Analyzer) => void;
  onUpdateAnalyzer?: (analyzer: Analyzer) => void;
  onDeleteAnalyzer?: (id: string) => void;
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
  onAddAnalyzer,
  onUpdateAnalyzer,
  onDeleteAnalyzer,
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

  const [testAstmCode, setTestAstmCode] = useState<string>('Glu-Hexo-123');
  const [testRawValue, setTestRawValue] = useState<string>('125.0');
  const [patientGender, setPatientGender] = useState<'Masculino' | 'Femenino'>('Masculino');
  const [patientAge, setPatientAge] = useState<number>(35);
  const [simulationResult, setSimulationResult] = useState<any | null>(null);

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
      `echo [SOCKET] ${a.name} -> ${a.connectionType === 'TCP_IP' ? a.ipAddress : (a.comPort || 'SERIAL')} [VINCULADO]`
    ).join('\n');

    const scriptContent = `@echo off\ncolor 0A\ntitle AbregoBridge v2.0 - Sincronizador de Sede\necho Sincronizando Mapeos con LIS-Core Cloud...\necho Sucursal: Sede Vía España\necho -----------------------------------------------\n${analyzerLines}\necho -----------------------------------------------\necho Status: ESCUCHANDO TRAMAS\npause`;
    const blob = new Blob([scriptContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Activar_AbregoBridge_Win64.bat';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    alert('🚀 Script Multi-Equipo descargado. Se vincularán todos los analizadores de la sede.');
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
    const match = currentAnalyzerMappings.find(m => m.astmAnalyzerCode.toLowerCase() === testAstmCode.trim().toLowerCase());
    if (!match) { setSimulationResult({ success: false, message: 'Código no homologado.' }); return; }
    const val = parseFloat(testRawValue) || 0;
    setSimulationResult({ success: true, match, convertedValue: val * match.multiplierFactor, statusLabel: 'PROCESADO OK', flagColorClass: 'text-emerald-400' });
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2"><SlidersHorizontal className="w-6 h-6 text-teal-400" /> Infraestructura Analítica</h2>
          <p className="text-xs text-slate-400">Mapeo de códigos ASTM/HL7 y rangos de referencia.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={handleDownloadBridge} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl text-xs flex items-center gap-2 border border-indigo-400/30 animate-pulse"><HardDrive className="w-4 h-4" /> Obtener Bridge</button>
          <button onClick={() => setIsAnalyzerModalOpen(true)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs border border-slate-700 flex items-center gap-1.5"><Cpu className="w-4 h-4 text-teal-400" /> Registrar Equipo</button>
          <button onClick={handleOpenAddModal} className="px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5"><Plus className="w-4 h-4 stroke-[3]" /> Nueva Homologación</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {analyzers.map((an) => (
          <div key={an.id} onClick={() => setSelectedAnalyzerId(an.id)} className={`p-4 rounded-2xl border transition-all cursor-pointer relative ${an.id === selectedAnalyzerId ? 'bg-slate-900 border-teal-400 ring-2 ring-teal-500/20' : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'}`}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${an.id === selectedAnalyzerId ? 'bg-teal-500/20 border-teal-400 text-teal-300' : 'bg-slate-950 border-slate-800 text-slate-400'}`}><Cpu className="w-5 h-5" /></div>
                <div><div className="font-bold text-sm text-white">{an.name}</div><div className="text-[10px] text-slate-500 font-mono">{an.model}</div></div>
              </div>
              <div className="flex items-center gap-1">
                {isAdmin && <button onClick={(e) => { e.stopPropagation(); setEditingAnalyzer(an); setAnalyzerFormData({ ...an, ipAddress: an.ipAddress || '', port: an.port || 5000, comPort: an.comPort || 'COM1' }); setIsAnalyzerModalOpen(true); }} className="p-1.5 hover:bg-white/10 rounded-lg text-slate-500 hover:text-teal-400"><Edit3 className="w-3.5 h-3.5" /></button>}
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${an.status === 'ONLINE' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                  {an.status === 'ONLINE' ? 'EN LÍNEA' : an.status === 'OFFLINE' ? 'DESCONECTADO' : 'PROCESANDO'}
                </span>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-800/80 flex justify-between text-[10px] text-slate-500 font-mono">
              <span>{mappings.filter(m => m.analyzerId === an.id).length} Pruebas</span>
              <span>{an.connectionType === 'TCP_IP' ? an.ipAddress : an.comPort}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
            <Search className="w-4 h-4 text-slate-500" />
            <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Buscar mapeo..." className="bg-transparent border-none text-xs text-white focus:ring-0 flex-1" />
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-500 font-mono uppercase text-[10px] border-b border-slate-800">
                <tr><th className="p-4">Prueba LIS</th><th className="p-4">ASTM Code</th><th className="p-4">Rangos</th><th className="p-4 text-right">Acciones</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredMappings.map(m => (
                  <tr key={m.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-4">
                      <div className="font-bold text-white flex items-center gap-2"><span className="px-1.5 py-0.5 bg-teal-500/10 text-teal-400 rounded text-[10px] font-mono">{m.lisTestCode}</span>{m.lisTestName}</div>
                    </td>
                    <td className="p-4 font-mono text-amber-400">{m.astmAnalyzerCode}</td>
                    <td className="p-4">
                      <button onClick={() => handleOpenRangeManager(m)} className="text-[10px] font-bold text-teal-500 hover:underline">Configurar Rangos ({m.referenceRanges?.length || 0})</button>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-1"><button onClick={() => handleOpenEditModal(m)} className="p-1.5 hover:bg-slate-800 text-slate-400 rounded-lg"><Edit3 className="w-4 h-4" /></button><button onClick={() => onDeleteMapping(m.id)} className="p-1.5 hover:bg-slate-800 text-rose-400 rounded-lg"><Trash2 className="w-4 h-4" /></button></div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-4">
           <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
              <h3 className="font-bold text-sm text-white flex items-center gap-2"><Sparkles className="w-4 h-4 text-teal-400" /> Probador LIS</h3>
              <div className="space-y-2 text-xs">
                 <input type="text" value={testAstmCode} onChange={e => setTestAstmCode(e.target.value)} placeholder="ASTM Code" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-amber-400 font-mono" />
                 <input type="text" value={testRawValue} onChange={e => setTestRawValue(e.target.value)} placeholder="Valor RAW" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white font-mono" />
                 <button onClick={handleSimulateTranslation} className="w-full py-2 bg-teal-500 text-slate-950 font-black rounded-xl text-[10px] uppercase">Simular Clasificación</button>
              </div>
              {simulationResult && (
                <div className={`p-3 rounded-xl border text-[10px] ${simulationResult.success ? 'bg-slate-950 border-teal-500/30' : 'bg-rose-500/10 border-rose-500/20'}`}>
                   {simulationResult.success ? <div className="space-y-1"><div className="flex justify-between"><span>Prueba:</span><span className="font-bold">{simulationResult.match.lisTestName}</span></div><div className="flex justify-between"><span>Convertido:</span><span className="text-emerald-400 font-bold">{simulationResult.convertedValue} {simulationResult.match.unit}</span></div></div> : <p>{simulationResult.message}</p>}
                </div>
              )}
           </div>
        </div>
      </div>

      {/* MODALS: ANALYZER & MAPPING */}
      {isAnalyzerModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 sticky top-0 bg-slate-900 z-10">
              <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">{editingAnalyzer ? 'Configurar Equipo' : 'Nuevo Analizador'}</h3>
              <button onClick={() => setIsAnalyzerModalOpen(false)} className="text-slate-500 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1"><label className="font-black text-slate-500 uppercase tracking-widest ml-1">Nombre:</label><input type="text" value={analyzerFormData.name} onChange={e => setAnalyzerFormData({...analyzerFormData, name: e.target.value})} className="w-full bg-slate-950 border border-white/5 rounded-2xl px-5 py-3 text-white font-bold focus:border-teal-500 outline-none" /></div>
                <div className="space-y-1"><label className="font-black text-slate-500 uppercase tracking-widest ml-1">Modelo:</label><input type="text" value={analyzerFormData.model} onChange={e => setAnalyzerFormData({...analyzerFormData, model: e.target.value})} className="w-full bg-slate-950 border border-white/5 rounded-2xl px-5 py-3 text-white font-mono focus:border-teal-500 outline-none" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-black text-slate-500 uppercase tracking-widest ml-1">Conexión:</label>
                  <select value={analyzerFormData.connectionType} onChange={e => setAnalyzerFormData({...analyzerFormData, connectionType: e.target.value as any})} className="w-full bg-slate-950 border border-white/5 rounded-2xl px-5 py-3 text-white font-bold outline-none">
                    <option value="TCP_IP">TCP/IP Ethernet</option>
                    <option value="RS232_SERIAL">RS-232 Serial (Bridge)</option>
                    <option value="WEB_SERIAL">Web Serial API (Chrome)</option>
                    <option value="NETWORK_FOLDER">Hot Folder (LAN)</option>
                  </select>
                </div>
                <div className="space-y-1"><label className="font-black text-slate-500 uppercase tracking-widest ml-1">Protocolo:</label><select value={analyzerFormData.protocol} onChange={e => setAnalyzerFormData({...analyzerFormData, protocol: e.target.value as any})} className="w-full bg-slate-950 border border-white/5 rounded-2xl px-5 py-3 text-teal-400 font-black outline-none"><option value="ASTM_E1381">ASTM E1381/E1394</option><option value="HL7_V2">HL7 v2.x Standard</option></select></div>
              </div>
              <div className="pt-4 flex gap-3"><button onClick={() => setIsAnalyzerModalOpen(false)} className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-white font-black rounded-2xl text-[10px] uppercase transition-all">Cancelar</button><button onClick={() => {
                const anData: Analyzer = { id: editingAnalyzer?.id || `an-${Date.now()}`, tenantId: currentUser.tenantId, branchId: currentUser.branchId || 'main', ...analyzerFormData, status: editingAnalyzer?.status || 'ONLINE', lastPing: new Date().toISOString() };
                if (editingAnalyzer) onUpdateAnalyzer?.(anData); else onAddAnalyzer?.(anData);
                setIsAnalyzerModalOpen(false);
              }} className="flex-1 py-4 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black rounded-2xl text-[10px] uppercase shadow-xl transition-all active:scale-95">{editingAnalyzer ? 'Guardar' : 'Activar Analizador'}</button></div>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-8 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 sticky top-0 bg-slate-900 z-20">
               <h3 className="font-bold text-base text-white">{editingMapping ? 'Editar Homologación' : 'Nueva Homologación'}</h3>
               <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-white font-bold text-sm cursor-pointer p-1">✕</button>
            </div>
            <form onSubmit={handleSaveMapping} className="space-y-4 text-xs">
              <div className="space-y-1"><label className="font-bold text-slate-300">Prueba LIS:</label><select value={formData.lisTestCode} onChange={e => setFormData({...formData, lisTestCode: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-teal-300 font-bold outline-none cursor-pointer">{testCatalog.map(t => t.parameters.map(p => <option key={p.id} value={p.astmParamCode} className="bg-slate-900 text-white">{p.astmParamCode} — {p.name}</option>))}</select></div>
              <div className="space-y-1"><label className="font-bold text-slate-300">Código Manual ASTM/HL7:</label><input type="text" required value={formData.astmAnalyzerCode} onChange={e => setFormData({ ...formData, astmAnalyzerCode: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-amber-300 font-mono font-bold outline-none focus:border-teal-400" /></div>
              <div className="grid grid-cols-2 gap-3"><div className="space-y-1"><label className="font-bold text-slate-300">Tipo Muestra:</label><select value={formData.sampleType} onChange={e => setFormData({ ...formData, sampleType: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none"><option value="Suero">Suero</option><option value="Sangre Total EDTA">Sangre Total EDTA</option></select></div><div className="space-y-1"><label className="font-bold text-slate-300">Factor:</label><input type="number" step="0.01" value={formData.multiplierFactor} onChange={e => setFormData({ ...formData, multiplierFactor: parseFloat(e.target.value) || 1.0 })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono outline-none" /></div></div>
              <div className="pt-2 flex justify-end gap-2 border-t border-slate-800"><button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold transition">Cancelar</button><button type="submit" className="px-5 py-2 bg-teal-500 text-slate-950 font-black rounded-xl transition shadow-lg">Guardar</button></div>
            </form>
          </div>
        </div>
      )}

      {isRangeModalOpen && rangeManagerMapping && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-8 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 sticky top-0 bg-slate-900 z-10"><h3 className="font-bold text-base text-white">Rangos: {rangeManagerMapping.lisTestName}</h3><button onClick={() => setIsRangeModalOpen(false)} className="text-slate-500 hover:text-white font-bold text-sm">✕</button></div>
            <div className="space-y-4">
              <div className="space-y-2 max-h-48 overflow-y-auto">{rangeManagerMapping.referenceRanges?.map(rr => <div key={rr.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs"><div className="text-slate-300"><span className="font-bold text-teal-400">[{rr.gender}]</span> {rr.minValue} - {rr.maxValue} {rr.unit}</div></div>)}</div>
              <form onSubmit={handleAddRangeRule} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3 text-xs"><div className="grid grid-cols-3 gap-3"><div><label className="text-slate-400 block mb-1">Sexo:</label><select value={rangeForm.gender} onChange={e => setRangeForm({ ...rangeForm, gender: e.target.value as any })} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-white outline-none"><option value="Ambos">Ambos</option><option value="Masculino">Masculino</option><option value="Femenino">Femenino</option></select></div><div><label className="text-slate-400 block mb-1">Mín:</label><input type="number" step="0.01" value={rangeForm.minValue} onChange={e => setRangeForm({ ...rangeForm, minValue: parseFloat(e.target.value) })} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-emerald-400 font-mono outline-none" /></div><div><label className="text-slate-400 block mb-1">Máx:</label><input type="number" step="0.01" value={rangeForm.maxValue} onChange={e => setRangeForm({ ...rangeForm, maxValue: parseFloat(e.target.value) })} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-emerald-400 font-mono outline-none" /></div></div><div className="pt-2 flex justify-end"><button type="submit" className="px-4 py-2 bg-teal-500 text-slate-950 font-black rounded-xl">+ Guardar</button></div></form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
