import React, { useState, useEffect } from 'react';
import { Analyzer, TestCatalogItem, MiddlewareMessageLog } from '../types';
import {
  Cpu, Terminal, Play, RefreshCw, CheckCircle2, AlertTriangle,
  ArrowRightLeft, Code2, Database, Sliders, Activity, Globe,
  Zap, Settings, ShieldCheck, Search, HardDrive, Share2, Cable,
  FileJson, Microscope, Lock, Trash2, Edit3, Plus, ChevronRight, Binary, Calculator, X, ShieldAlert, Timer
} from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

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
  const [activeSector, setActiveSector] = useState<'transport' | 'protocol' | 'pipeline'>('transport');
  const [isOsSelectorOpen, setIsOsSelectorOpen] = useState(false);
  const [detectedOs, setDetectedOs] = useState<'win' | 'mac' | 'linux'>('win');
  const [pipelineTransactions, setPipelineTransactions] = useState<any[]>([]);
  const [isSimulatingPipe, setIsSimulatingPipe] = useState(false);
  const [selectedProtocolAnalyzer, setSelectedProtocolAnalyzer] = useState<Analyzer>(analyzers[0]);

  useEffect(() => {
    const platform = window.navigator.platform.toLowerCase();
    if (platform.includes('win')) setDetectedOs('win');
    else if (platform.includes('mac')) setDetectedOs('mac');
    else if (platform.includes('linux')) setDetectedOs('linux');
  }, []);

  const handleDownloadBridge = async (os: 'win' | 'mac' | 'linux') => {
    // Generar archivo ZIP usando jszip
    const zip = new JSZip();

    // 1. package.json
    zip.file("package.json", JSON.stringify({
      name: "ace-daemon",
      version: "1.0.0",
      description: "AbregoTech ACE Daemon",
      main: "index.js",
      scripts: { start: "node index.js" },
      dependencies: { axios: "^1.6.0", serialport: "^12.0.0", express: "^4.18.2", "socket.io": "^4.7.2" }
    }, null, 2));

    // 2. index.js (El motor Node.js)
    const indexJsCode = `const net = require('net');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { exec } = require('child_process');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
app.use(express.static(path.join(__dirname, 'public')));

const GUI_PORT = 5050;

function logEvent(type, analyzer, message, isData = false) {
    const timestamp = new Date().toLocaleTimeString();
    console.log(\`[\${timestamp}] [\${analyzer}] \${message}\`);
    io.emit('terminal_log', { type, analyzer, message, timestamp, isData });
}

server.listen(GUI_PORT, () => {
    console.log(\`🚀 ACE Daemon GUI disponible en: http://localhost:\${GUI_PORT}\`);
    const startCmd = process.platform === 'win32' ? 'start' : process.platform === 'darwin' ? 'open' : 'xdg-open';
    exec(\`\${startCmd} http://localhost:\${GUI_PORT}\`);

    // Iniciar puertos de simulación
    setTimeout(() => {
        logEvent('SYSTEM', 'ACE-CORE', 'Escuchando TCP Puerto 5100 -> Sysmex XN');
        io.emit('analyzer_status', { name: 'Sysmex XN', status: 'ONLINE', port: 5100 });
    }, 2000);
});`;
    zip.file("index.js", indexJsCode);

    // 3. START_ACE_DAEMON.bat (Lanzador para Windows)
    if (os === 'win') {
        const batCode = `@echo off
color 0B
title AbregoTech ACE Daemon
echo Instalando dependencias (esto toma 1 minuto la primera vez)...
call npm install --no-audit --no-fund
echo.
echo Iniciando Servidor...
call npm start
pause`;
        zip.file("START_ACE_DAEMON.bat", batCode);
    }

    // 4. public/index.html (Dashboard GUI)
    const htmlCode = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>ACE Daemon Dashboard</title>
<script src="https://cdn.tailwindcss.com"></script><script src="/socket.io/socket.io.js"></script></head>
<body class="bg-slate-950 text-white p-8"><h1 class="text-2xl text-teal-400 font-bold mb-4">ACE Local Daemon</h1>
<div id="terminal" class="bg-slate-900 p-4 font-mono text-xs rounded-xl h-96 overflow-y-auto"></div>
<script>
    const socket = io();
    socket.on('terminal_log', data => {
        document.getElementById('terminal').innerHTML += \`<div class="text-slate-400">[\${data.timestamp}] \${data.message}</div>\`;
    });
</script></body></html>`;
    zip.folder("public")?.file("index.html", htmlCode);

    // Generar y Descargar
    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, \`AbregoTech_ACE_Daemon_\${os.toUpperCase()}.zip\`);
    setIsOsSelectorOpen(false);
  };

  return (
    <div className="flex h-[calc(100vh-140px)] bg-[#020617] rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl relative">
      <div className="w-72 bg-slate-950/50 border-r border-white/5 flex flex-col p-6 space-y-8 overflow-y-auto shrink-0">
         <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-500/10 rounded-2xl flex items-center justify-center border border-teal-500/20"><Share2 className="w-5 h-5 text-teal-400" /></div>
            <div><h3 className="text-sm font-black text-white uppercase italic">Driver<span className="text-teal-400 not-italic">STUDIO</span></h3><p className="text-[8px] text-slate-500 font-bold uppercase">AbregoTech ACE Integrator</p></div>
         </div>
         <div className="flex-1 space-y-2">
            {[
              { id: 'transport', label: 'Capa de Transporte', icon: Cable },
              { id: 'protocol', label: 'Dialectos / Drivers', icon: Binary },
              { id: 'pipeline', label: 'Pipeline Gráfico', icon: Zap }
            ].map(s => (
              <button key={s.id} onClick={() => setActiveSector(s.id as any)} className={`w-full text-left p-4 rounded-2xl transition-all border flex items-center gap-4 ${activeSector === s.id ? 'bg-teal-500 border-teal-400 text-slate-950 shadow-lg shadow-teal-500/20' : 'bg-slate-900/50 border-white/5 text-slate-400 hover:bg-slate-800'}`}>
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
                 <div>
                    <h2 className="text-3xl font-black text-white uppercase italic">Nodos de Transporte (Daemons)</h2>
                    <p className="text-sm text-slate-400 mt-2">Agentes locales que conectan puertos COM y TCP locales al Engine Cloud.</p>
                 </div>
                 <div className="relative">
                    <button onClick={() => setIsOsSelectorOpen(!isOsSelectorOpen)} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 transition text-white rounded-2xl text-[10px] font-black uppercase flex items-center gap-2 shadow-lg shadow-indigo-600/30">
                       <Globe className="w-4 h-4" /> Generar Agente Daemon
                    </button>
                    {isOsSelectorOpen && (
                      <div className="absolute top-full mt-2 right-0 w-64 bg-slate-900 border border-slate-700 rounded-2xl p-2 z-50 shadow-2xl">
                         {['win', 'mac', 'linux'].map(os => (
                           <button key={os} onClick={() => handleDownloadBridge(os as any)} className="w-full text-left p-3 hover:bg-slate-800 rounded-xl flex items-center gap-3 transition-colors">
                              <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-400">{os === 'win' ? <Terminal className="w-4 h-4" /> : <Cpu className="w-4 h-4" />}</div>
                              <div className="flex flex-col"><span className="text-[10px] font-black text-white capitalize">{os === 'win' ? 'Windows Service (.bat)' : os === 'mac' ? 'macOS Daemon (.sh)' : 'Linux Systemd (.sh)'}</span>{detectedOs === os && <span className="text-[7px] text-emerald-400 font-black mt-1">SUGERIDO PARA TU PC</span>}</div>
                           </button>
                         ))}
                      </div>
                    )}
                 </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {analyzers.map(a => (
                    <div key={a.id} className="bg-slate-900 border border-slate-800 rounded-[2rem] p-6 space-y-4 hover:border-slate-700 transition">
                       <div className="flex justify-between items-center">
                          <div className="w-12 h-12 bg-teal-500/10 rounded-2xl flex items-center justify-center text-teal-400"><Cable className="w-6 h-6" /></div>
                          <span className={`text-[10px] font-black px-2 py-1 rounded-lg uppercase ${a.status === 'ONLINE' ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'}`}>
                            {a.status === 'ONLINE' ? 'SOCKET ACTIVO' : a.status === 'OFFLINE' ? 'SIN CONEXIÓN' : 'PROCESANDO'}
                          </span>
                       </div>
                       <h3 className="text-xl font-black text-white uppercase">{a.name}</h3>
                       <div className="text-[10px] font-mono text-slate-400 space-y-2 bg-slate-950 p-4 rounded-xl border border-slate-800">
                          <div className="flex justify-between"><span>Topología:</span> <span className="text-white">{a.connectionType === 'TCP_IP' ? 'Ethernet (LAN)' : 'RS-232 Serial'}</span></div>
                          <div className="flex justify-between"><span>Punto de Anclaje:</span> <span className="text-amber-400">{a.connectionType === 'TCP_IP' ? `${a.ipAddress}:${a.port}` : (a.comPort || 'COM1')}</span></div>
                          <div className="flex justify-between"><span>Estrategia de Trama:</span> <span className="text-teal-400">{a.protocol}</span></div>
                       </div>
                    </div>
                 ))}
              </div>
            </>
         )}

         {activeSector === 'protocol' && (
            <div className="flex gap-6 h-full">
                <div className="w-1/3 bg-slate-900 rounded-[2rem] border border-slate-800 p-4 space-y-2 overflow-y-auto">
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest px-2 mb-4">Librería de Parsers</h3>
                    {analyzers.map(a => (
                        <button key={a.id} onClick={() => setSelectedProtocolAnalyzer(a)} className={`w-full text-left p-4 rounded-2xl transition flex items-center justify-between ${selectedProtocolAnalyzer.id === a.id ? 'bg-slate-800 border-l-4 border-teal-500 text-white' : 'hover:bg-slate-800/50 text-slate-400 border-l-4 border-transparent'}`}>
                            <div className="flex flex-col">
                                <span className="text-xs font-bold">{a.name}</span>
                                <span className="text-[10px] font-mono mt-1 text-slate-500">{a.driverId}</span>
                            </div>
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    ))}
                </div>
                <div className="w-2/3 flex flex-col space-y-4">
                    <div className="bg-slate-900 p-6 rounded-[2rem] border border-slate-800 flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-black text-white">{selectedProtocolAnalyzer.driverId}.js</h2>
                            <p className="text-xs text-slate-400 mt-1">Configuración del Dialecto de Interfaz</p>
                        </div>
                        <div className="px-3 py-1 bg-teal-500/10 text-teal-400 rounded-lg text-xs font-bold border border-teal-500/20">{selectedProtocolAnalyzer.protocol}</div>
                    </div>
                    <div className="flex-1 bg-slate-950 rounded-[2rem] border border-slate-800 p-6 font-mono text-[11px] overflow-y-auto text-slate-300">
{selectedProtocolAnalyzer.protocol.includes('ASTM') ? `/**
 * AbregoTech Parser Rules
 * Target: ${selectedProtocolAnalyzer.name}
 * Version: 2.1.0
 */
export const AstmConfig = {
    protocolFamily: "ASTM_E1381_E1394",
    transport: {
        timeoutMs: 15000,
        retries: 3,
        handshake: ["ENQ", "ACK", "EOT"],
        framing: { start: "\\x02", end: "\\x03", terminator: "\\x0D\\x0A" }
    },
    delimiters: {
        field: "|",
        repeat: "\\\\",
        component: "^",
        escape: "&"
    },
    messageStructure: {
        header: { recordType: "H", fields: [1, 2, 3, 4, 12, 13] },
        patient: { recordType: "P", required: true },
        order: { recordType: "O", mapBarcode: 2 },
        result: {
            recordType: "R",
            mapping: {
                testCode: 2,    // Field index for parameter code
                value: 3,       // Field index for numerical value
                units: 4,       // Field index for units
                flags: 6        // Field index for high/low panic flags
            }
        }
    },
    checksum: "MODULO_256",
    autoAck: true
};` : `/**
 * AbregoTech HL7 Parser Rules
 * Target: ${selectedProtocolAnalyzer.name}
 */
export const Hl7Config = {
    protocolFamily: "HL7_V2",
    versionLimit: "2.5.1",
    transport: {
        mllp: true,
        startBlock: "\\x0B",
        endBlock: "\\x1C\\x0D"
    },
    segments: {
        MSH: { required: true, appAck: true },
        PID: { extract: ["ID", "Name", "Sex", "DOB"] },
        OBR: { extract: ["PlacerOrderNumber", "FillerOrderNumber"] },
        OBX: {
            extract: ["ValueType", "ObservationIdentifier", "ObservationValue", "Units", "References", "AbnormalFlags"]
        }
    }
};`}
                    </div>
                </div>
            </div>
         )}

         {activeSector === 'pipeline' && (
           <div className="space-y-6">
              <div className="flex justify-between items-center">
                 <h2 className="text-3xl font-black text-white uppercase italic">ACE Routing Pipeline</h2>
                 <button onClick={() => {
                    setIsSimulatingPipe(true);
                    setTimeout(() => {
                      const newTx = { id: `TX-${Date.now()}`, analyzer: 'Sysmex XN-1000', step: 'LIS-DB-SYNC', timestamp: new Date().toLocaleTimeString(), status: 'SUCCESS' };
                      setPipelineTransactions([newTx, ...pipelineTransactions]);
                      setIsSimulatingPipe(false);
                    }, 800);
                 }} className="px-8 py-3 bg-teal-500 hover:bg-teal-400 transition text-slate-950 font-black rounded-2xl text-[10px] uppercase flex items-center gap-2 shadow-xl shadow-teal-500/20">{isSimulatingPipe ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />} Simular Flujo Completo</button>
              </div>
              
              <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-8">
                 <div className="flex justify-between items-center relative">
                    <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-800 -translate-y-1/2 z-0"></div>
                    
                    {[
                        { label: 'Analyzer', icon: Cpu, state: 'done' },
                        { label: 'ACE Gateway', icon: Globe, state: 'done' },
                        { label: 'Parser', icon: Binary, state: 'done' },
                        { label: 'Validation Engine', icon: ShieldCheck, state: 'active' },
                        { label: 'PostgreSQL LIS', icon: Database, state: 'pending' }
                    ].map((node, i) => (
                        <div key={i} className="relative z-10 flex flex-col items-center gap-3 bg-slate-900">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-colors ${node.state === 'done' ? 'bg-teal-500/20 border-teal-500 text-teal-400' : node.state === 'active' ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400 animate-pulse' : 'bg-slate-950 border-slate-700 text-slate-500'}`}>
                                <node.icon className="w-6 h-6" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">{node.label}</span>
                        </div>
                    ))}
                 </div>
              </div>

              <div className="space-y-4">
                 <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Pipeline Trace Logs</h3>
                 {pipelineTransactions.map(tx => (
                    <div key={tx.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between animate-in slide-in-from-right-4">
                       <div className="flex items-center gap-4">
                          <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></div>
                          <div><div className="text-xs font-bold text-white">ACE ROUTE: {tx.analyzer} <ArrowRightLeft className="w-3 h-3 inline text-slate-500 mx-1"/> {tx.step}</div><div className="text-[10px] text-slate-500 font-mono mt-1">{tx.id}</div></div>
                       </div>
                       <div className="text-right"><div className="text-[10px] font-black text-emerald-400 uppercase">{tx.status}</div><div className="text-[10px] text-slate-500 font-mono mt-1">{tx.timestamp}</div></div>
                    </div>
                 ))}
                 {pipelineTransactions.length === 0 && (
                     <div className="text-center p-8 border border-slate-800 border-dashed rounded-2xl text-slate-500 text-sm">
                         Sin transacciones recientes en el pipeline visual. Presiona "Simular Flujo".
                     </div>
                 )}
              </div>
           </div>
         )}
      </div>
    </div>
  );
};
