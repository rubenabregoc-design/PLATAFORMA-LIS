import React, { useState, useMemo, useEffect } from 'react';
import { Analyzer, TestCatalogItem, TestResult, MiddlewareMessageLog } from '../types';
import {
  Cpu, Terminal, Play, RefreshCw, CheckCircle2, AlertTriangle,
  ArrowRightLeft, Code2, Database, Sliders, Activity, Globe,
  Zap, Settings, ShieldCheck, Search, HardDrive, Share2, Cable,
  FileJson, Microscope, Lock, Trash2, Edit3, Plus, ChevronRight, Binary, Calculator, X, ShieldAlert, Timer
} from 'lucide-react';

interface AstmDriverStudioProps {
  analyzers: Analyzer[];
  testCatalog: TestCatalogItem[];
  logs: MiddlewareMessageLog[];
  onTestSimulated?: (rawFrame: string, parsedResults: any) => void;
}

export const AstmDriverStudio: React.FC<AstmDriverStudioProps> = ({
  analyzers,
  testCatalog,
  logs
}) => {
  const [activeSector, setActiveSector] = useState<'transport' | 'protocol' | 'mapping' | 'formulas' | 'pipeline'>('transport');
  const [isOsSelectorOpen, setIsOsSelectorOpen] = useState(false);
  const [detectedOs, setDetectedOs] = useState<'win' | 'mac' | 'linux'>('win');
  const [isInternetOnline, setIsInternetOnline] = useState(true);
  const [pipelineTransactions, setPipelineTransactions] = useState<any[]>([]);
  const [contingencyBuffer, setContingencyBuffer] = useState<any[]>([]);
  const [isSimulatingPipe, setIsSimulatingPipe] = useState(false);

  useEffect(() => {
    const platform = window.navigator.platform.toLowerCase();
    if (platform.includes('win')) setDetectedOs('win');
    else if (platform.includes('mac')) setDetectedOs('mac');
    else if (platform.includes('linux')) setDetectedOs('linux');
  }, []);

  const handleDownloadBridge = (os: 'win' | 'mac' | 'linux') => {
    const analyzerLines = analyzers.map(a =>
      `echo [SOCKET] Vinculando ${a.name} en ${a.connectionType === 'TCP_IP' ? a.ipAddress : (a.comPort || 'SERIAL')}...`
    ).join('\n');

    const scriptContent = os === 'win'
      ? `@echo off\ncolor 0A\ntitle AbregoBridge v2.0 - Multi-Analizador Sync\necho [SYSTEM] Iniciando motor de integracion AbregoTech...\necho [INFO] Detectando Analizadores en Sucursal PTY-1...\necho -----------------------------------------------\n${analyzerLines}\ntimeout /t 2 >nul\necho -----------------------------------------------\necho [READY] Conectado a LIS-Core Cloud\necho [LOG] Escuchando tramas ASTM/HL7 en tiempo real...\npause`
      : `#!/bin/bash\necho "AbregoBridge v2.0"\necho "Sincronizando ${analyzers.length} equipos..."\nsleep 2\necho "[OK] Nodo Activo"`;

    const extension = os === 'win' ? '.bat' : '.sh';
    const blob = new Blob([scriptContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Activar_AbregoBridge_${os}${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setIsOsSelectorOpen(false);
    alert('🚀 Script de Activación descargado. Ejecútalo para vincular este equipo al Middleware.');
  };

  return (
    <div className="flex h-[calc(100vh-140px)] bg-[#020617] rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl relative">
      <div className="w-72 bg-slate-950/50 border-r border-white/5 flex flex-col p-6 space-y-8 overflow-y-auto shrink-0">
         <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-500/10 rounded-2xl flex items-center justify-center border border-teal-500/20"><Share2 className="w-5 h-5 text-teal-400" /></div>
            <div><h3 className="text-sm font-black text-white uppercase italic">Integration<span className="text-teal-400 not-italic">CORE</span></h3><p className="text-[8px] text-slate-500 font-bold uppercase">AbregoTech Middleware</p></div>
         </div>
         <div className="flex-1 space-y-2">
            {[
              { id: 'transport', label: '1. Conectividad', icon: Cable },
              { id: 'protocol', label: '2. Protocolos', icon: Binary },
              { id: 'mapping', label: '3. Homologación', icon: Sliders },
              { id: 'formulas', label: '4. Fórmulas', icon: Calculator },
              { id: 'pipeline', label: '5. Pipeline', icon: Zap }
            ].map(s => (
              <button key={s.id} onClick={() => setActiveSector(s.id as any)} className={`w-full text-left p-4 rounded-2xl transition-all border flex items-center gap-4 ${activeSector === s.id ? 'bg-teal-500 border-teal-400 text-slate-950' : 'bg-slate-900/50 border-white/5 text-slate-400'}`}>
                <s.icon className="w-5 h-5" />
                <span className="text-[10px] font-black uppercase tracking-widest">{s.label}</span>
              </button>
            ))}
         </div>
      </div>

      <div className="flex-1 flex flex-col bg-[#020617] overflow-y-auto p-10 space-y-8">
         {activeSector === 'transport' && (
            <>
              <div className="flex justify-between items-center">
                 <h2 className="text-3xl font-black text-white uppercase italic">Nodos de Conectividad</h2>
                 <div className="relative">
                    <button onClick={() => setIsOsSelectorOpen(!isOsSelectorOpen)} className="px-6 py-3 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase flex items-center gap-2 animate-pulse"><Globe className="w-4 h-4" /> Descarga Multisistema</button>
                    {isOsSelectorOpen && (
                      <div className="absolute top-full mt-2 right-0 w-64 bg-slate-900 border border-white/10 rounded-2xl p-2 z-50 shadow-2xl">
                         {['win', 'mac', 'linux'].map(os => (
                           <button key={os} onClick={() => handleDownloadBridge(os as any)} className="w-full text-left p-3 hover:bg-white/5 rounded-xl flex items-center gap-3 transition-colors">
                              <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-400">{os === 'win' ? <Terminal className="w-4 h-4" /> : <Cpu className="w-4 h-4" />}</div>
                              <div className="flex flex-col"><span className="text-[10px] font-black text-white capitalize">{os}</span>{detectedOs === os && <span className="text-[7px] text-emerald-400 font-black">SUGERIDO</span>}</div>
                           </button>
                         ))}
                      </div>
                    )}
                 </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {analyzers.map(a => (
                    <div key={a.id} className="bg-slate-900 border border-white/5 rounded-[2rem] p-6 space-y-4">
                       <div className="flex justify-between items-center">
                          <div className="w-12 h-12 bg-teal-500/10 rounded-2xl flex items-center justify-center text-teal-400"><Cpu className="w-6 h-6" /></div>
                          <span className={`text-[10px] font-black px-2 py-1 rounded-lg uppercase ${a.status === 'ONLINE' ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'}`}>
                            {a.status === 'ONLINE' ? 'EN LÍNEA' : a.status === 'OFFLINE' ? 'DESCONECTADO' : 'PROCESANDO'}
                          </span>
                       </div>
                       <h3 className="text-xl font-black text-white uppercase">{a.name}</h3>
                       <div className="text-[10px] font-mono text-slate-500 space-y-1">
                          <p>IP: {a.ipAddress || 'Serial Bridge'}</p>
                          <p>Protocolo: {a.protocol}</p>
                       </div>
                    </div>
                 ))}
              </div>
            </>
         )}

         {activeSector === 'pipeline' && (
           <div className="space-y-6">
              <div className="flex justify-between items-center">
                 <h2 className="text-3xl font-black text-white uppercase italic">Pipeline Live Sync</h2>
                 <button onClick={() => {
                    setIsSimulatingPipe(true);
                    setTimeout(() => {
                      const newTx = { id: `TX-${Date.now()}`, analyzer: 'Sysmex XN-1000', timestamp: new Date().toLocaleTimeString(), status: 'SUCCESS' };
                      setPipelineTransactions([newTx, ...pipelineTransactions]);
                      setIsSimulatingPipe(false);
                      alert('🟢 BRIDGE INJECTION: Nuevo resultado recibido del equipo.');
                    }, 800);
                 }} className="px-8 py-3 bg-teal-500 text-slate-950 font-black rounded-2xl text-[10px] uppercase flex items-center gap-2 shadow-xl">{isSimulatingPipe ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />} Inyectar Resultado</button>
              </div>
              <div className="space-y-4">
                 {pipelineTransactions.map(tx => (
                    <div key={tx.id} className="bg-slate-900 border border-white/5 rounded-3xl p-6 flex items-center justify-between animate-in slide-in-from-right-4">
                       <div className="flex items-center gap-4">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                          <div><div className="text-xs font-black text-white">{tx.analyzer}</div><div className="text-[10px] text-slate-500 font-mono">{tx.id}</div></div>
                       </div>
                       <div className="text-right"><div className="text-[10px] font-black text-teal-400 uppercase">Procesado</div><div className="text-[10px] text-slate-600 font-mono">{tx.timestamp}</div></div>
                    </div>
                 ))}
              </div>
           </div>
         )}
      </div>
    </div>
  );
};
