import React, { useState, useEffect, useRef } from 'react';
import { Analyzer, MiddlewareMessageLog, TestResult, Order } from '../types';
import { Cpu, Wifi, Radio, Send, Play, Terminal, CheckCircle2, AlertCircle, RefreshCw, FileText, ArrowRightLeft, Activity } from 'lucide-react';
import { ASTM_CHARS, parseASTMFrame, parseHL7Message, createSession, createCommEvent, AnalyzerSession, CommEvent, toHexDump } from '../services/AnalyzerCommEngine';

interface MiddlewareSimulatorProps {
  analyzers: Analyzer[];
  logs: MiddlewareMessageLog[];
  orders: Order[];
  onNewResultSimulated: (newLog: MiddlewareMessageLog, newResult: TestResult) => void;
}

export const MiddlewareSimulator: React.FC<MiddlewareSimulatorProps> = ({
  analyzers,
  logs,
  orders,
  onNewResultSimulated
}) => {
  const [selectedAnalyzerId, setSelectedAnalyzerId] = useState<string>(analyzers[0]?.id || '');
  const [activeTab, setActiveTab] = useState<'live_terminal' | 'adapters' | 'hl7_his'>('live_terminal');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simType, setSimType] = useState<'critical_glucose' | 'normal_cbc' | 'hl7_oru' | 'instrumental_finding'>('critical_glucose');

  const [activeSession, setActiveSession] = useState<AnalyzerSession | null>(null);
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [activeSession?.events]);

  const handleStartSimulation = async () => {
    setIsSimulating(true);
    const selectedAn = analyzers.find((a) => a.id === selectedAnalyzerId) || analyzers[0];
    const session = createSession(selectedAn.id, selectedAn.name);
    setActiveSession(session);

    const emitEvent = (type: CommEvent['type'], dir: CommEvent['direction'], msg: string, raw?: string) => {
        const evt = createCommEvent(type, dir, selectedAn.name, msg, { rawHex: raw ? toHexDump(raw) : undefined, protocol: selectedAn.protocol });
        setActiveSession(prev => prev ? { ...prev, events: [...prev.events, evt] } : null);
    };

    // Phase 1: Connection & Handshake
    emitEvent('SYSTEM', 'INTERNAL', `[ENGINE] Inicializando socket TCP hacia ${selectedAn.ipAddress || selectedAn.comPort}...`);
    await new Promise(r => setTimeout(r, 400));
    emitEvent('SYSTEM', 'INTERNAL', `[SOCKET] Conexión establecida en puerto ${selectedAn.port || 5100}`);
    
    // ASTM Protocol handshake if ASTM
    if (selectedAn.protocol.includes('ASTM')) {
       emitEvent('CONTROL', 'IN', `<ENQ> (0x05) Solicitud de transmisión`, ASTM_CHARS.ENQ);
       await new Promise(r => setTimeout(r, 200));
       emitEvent('CONTROL', 'OUT', `<ACK> (0x06) Host listo`, ASTM_CHARS.ACK);
       await new Promise(r => setTimeout(r, 300));
    }

    let rawPayload = '';
    let parsedData: any = {};
    let newResult: Partial<TestResult> = {};
    const timestamp = new Date().toISOString();

    if (simType === 'critical_glucose') {
      rawPayload = `H|\\^&|||VITROS^4600|||||||P|1\nP|1|||Arosemena^Ricardo\nO|1|BC-882004||^^^4531|R||${timestamp.replace(/[-:T.Z]/g, '').slice(0, 14)}\nR|1|^^^4531|340|mg/dL|70-99|HH||F||||${timestamp.replace(/[-:T.Z]/g, '').slice(0, 14)}\nL|1|N`;
      emitEvent('DATA', 'IN', `Trama ASTM E1394 (Glucosa Vitros)`, rawPayload);
      
      const frame = parseASTMFrame(rawPayload);
      parsedData = {
          sampleBarcode: frame?.order.sampleId || 'BC-882004',
          testCode: frame?.results[0]?.code || '4531',
          value: parseFloat(frame?.results[0]?.value || '340'),
          unit: frame?.results[0]?.unit || 'mg/dL',
          flag: 'CRITICO_ALTO'
      };

      newResult = {
          orderId: 'ord-1002', testId: 'test-glucosa', parameterId: 'p-glu', parameterCode: '4531',
          parameterName: 'Glucosa en Ayunas', unit: 'mg/dL', value: '340', numericValue: 340,
          flag: 'CRITICO_ALTO', refRangeText: '70 - 99', analyzerName: selectedAn.name
      };

    } else if (simType === 'instrumental_finding') {
      rawPayload = `H|\\^&|||VITROS^4600|||||||P|1\nP|1|||Pinzon^Gabriela\nO|1|BC-882001||^^^4660|R||${timestamp.replace(/[-:T.Z]/g, '').slice(0, 14)}\nR|1|^^^4660|45|mg/dL|5-40|H||F||||${timestamp.replace(/[-:T.Z]/g, '').slice(0, 14)}\nL|1|N`;
      emitEvent('DATA', 'IN', `Trama ASTM E1394 (Hallazgo Instrumental)`, rawPayload);
      
      parsedData = { sampleBarcode: 'BC-882001', testCode: '4660', value: 45, unit: 'mg/dL', flag: 'ALTO' };
      newResult = {
          orderId: 'ord-1001', testId: 'test-lipidico', parameterId: 'p-tri', parameterCode: '4660',
          parameterName: 'Triglicéridos (Hallazgo Extra)', unit: 'mg/dL', value: '45', numericValue: 45,
          flag: 'ALTO', refRangeText: '5 - 40', analyzerName: selectedAn.name
      };
    } else if (simType === 'normal_cbc') {
      rawPayload = `H|\\^&|||Sysmex^XN-1000|||||||P|1\nP|1||||Pinzón^Gabriela\nO|1|BC-882001||^^^SYSMEX_CBC|R||${timestamp.replace(/[-:T.Z]/g, '').slice(0, 14)}\nR|1|^^^WBC|7.4|10^3/uL|4.5-11.0|N||F\nR|2|^^^HGB|14.0|g/dL|12.0-15.5|N||F\nL|1|N`;
      emitEvent('DATA', 'IN', `Trama ASTM E1381 (Sysmex XN)`, rawPayload);

      parsedData = { sampleBarcode: 'BC-882001', wbc: 7.4, hgb: 14.0 };
      newResult = {
          orderId: 'ord-1001', testId: 'test-hemograma', parameterId: 'p-wbc', parameterName: 'Leucocitos (WBC)',
          unit: 'x10^3/µL', value: '7.4', numericValue: 7.4, flag: 'NORMAL', refRangeText: '4.5 - 11.0', analyzerName: selectedAn.name
      };
    } else {
      rawPayload = `MSH|^~\\&|MINDRAY_BC5000|LAB_SAN_JOSE|LIS_CORE|ABREGOTECH|20260810103000||ORU^R01|MSG00982|P|2.3.1\nPID|1||8-812-4432||Pinzon^Gabriela||19920514|F\nOBR|1|20260810073000|BC-882001|HEM01^Hemograma|||20260810102800\nOBX|1|NM|PLT^Plaquetas||240|x10^3/uL|150-450|N|||F`;
      emitEvent('DATA', 'IN', `Mensaje HL7 ORU^R01 (Mindray)`, rawPayload);

      const hl7Msg = parseHL7Message(rawPayload);
      parsedData = { patientId: hl7Msg?.patientId || '8-812-4432', plt: 240 };
      newResult = {
          orderId: 'ord-1001', testId: 'test-hemograma', parameterId: 'p-plt', parameterName: 'Plaquetas (PLT)',
          unit: 'x10^3/µL', value: '240', numericValue: 240, flag: 'NORMAL', refRangeText: '150 - 450', analyzerName: selectedAn.name
      };
    }

    if (selectedAn.protocol.includes('ASTM')) {
       await new Promise(r => setTimeout(r, 300));
       emitEvent('CONTROL', 'OUT', `<ACK> (0x06) Bloque recibido`, ASTM_CHARS.ACK);
       await new Promise(r => setTimeout(r, 200));
       emitEvent('CONTROL', 'IN', `<EOT> (0x04) Fin de transmisión`, ASTM_CHARS.EOT);
    }

    emitEvent('PARSE', 'INTERNAL', `Parser ${selectedAn.driverId} ejecutado exitosamente.`);

    const newLog: MiddlewareMessageLog = {
      id: `msg-${Date.now()}`,
      tenantId: 'lab-san-jose',
      analyzerId: selectedAn.id,
      analyzerName: selectedAn.name,
      protocol: selectedAn.protocol,
      direction: 'INBOUND',
      rawPayload,
      parsedData,
      status: 'PROCESADO',
      timestamp
    };

    const finalResult: TestResult = {
       ...newResult,
       id: `res-${Date.now()}`,
       tenantId: 'lab-san-jose',
       status: 'INGRESADO',
       source: selectedAn.protocol.includes('HL7') ? 'MIDDLEWARE_HL7' : 'MIDDLEWARE_ASTM'
    } as TestResult;

    setTimeout(() => {
        onNewResultSimulated(newLog, finalResult);
        setActiveSession(prev => prev ? { ...prev, state: 'IDLE', protocolPhase: 'COMPLETE' } : null);
        setIsSimulating(false);
    }, 500);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center space-x-2 text-teal-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Radio className="w-4 h-4 animate-pulse" />
            <span>AbregoTech Analyzer Comm Engine (ACE)</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-100">
            Monitor de Comunicaciones ASTM/HL7 en Tiempo Real
          </h1>
          <p className="text-slate-400 text-sm mt-1 max-w-2xl">
            Inspección profunda de tramas, handshake a nivel de socket y parseo de dialectos propietarios mediante LIS-Core.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {analyzers.map((an) => {
          const isSelected = selectedAnalyzerId === an.id;
          const isOffline = an.status === 'OFFLINE';

          return (
            <div
              key={an.id}
              onClick={() => setSelectedAnalyzerId(an.id)}
              className={`p-4 rounded-xl border transition cursor-pointer relative overflow-hidden ${
                isSelected
                  ? isOffline
                    ? 'bg-slate-900 border-rose-500 text-white ring-2 ring-rose-500/20'
                    : 'bg-slate-900 border-teal-500 text-white ring-2 ring-teal-500/20'
                  : isOffline
                    ? 'bg-rose-50 border-rose-200 hover:border-rose-300 text-slate-900 shadow-sm'
                    : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800 shadow-sm'
              }`}
            >
              {isOffline && !isSelected && (
                <div className="absolute top-0 left-0 w-1 h-full bg-rose-500"></div>
              )}

              <div className="flex items-center justify-between mb-2 relative z-10">
                <span className="font-bold text-sm">{an.name}</span>
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border transition-all ${
                  an.status === 'ONLINE'
                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                    : isOffline
                      ? 'bg-rose-500/20 text-rose-600 border-rose-500/40 animate-pulse'
                      : 'bg-teal-500/10 text-teal-600 border-teal-500/20'
                }`}>
                  {an.status}
                </span>
              </div>

              <div className={`text-xs space-y-1 relative z-10 ${isSelected ? 'text-slate-400' : 'text-slate-500'}`}>
                <div>Protocolo: <strong className={isSelected ? 'text-slate-200' : 'text-slate-700'}>{an.protocol}</strong></div>
                <div>Conexión: <strong className={isSelected ? 'text-slate-200' : 'text-slate-700'}>{an.connectionType === 'TCP_IP' ? \`\${an.ipAddress}:\${an.port}\` : an.comPort}</strong></div>
                <div>Driver Dialecto: <code className={\`px-1 py-0.5 rounded text-[11px] \${isSelected ? 'bg-slate-800 text-teal-300' : 'bg-slate-100 text-teal-700 font-bold'}\`}>{an.driverId}</code></div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-teal-600" />
            <h3 className="font-bold text-slate-900 text-sm">Pruebas de Inyección de ACE</h3>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <label className="text-slate-500 font-black uppercase tracking-tighter">Carga Útil:</label>
            <select
              value={simType}
              onChange={(e) => setSimType(e.target.value as any)}
              className="bg-slate-900 border border-slate-700 text-teal-400 font-bold rounded-xl px-4 py-2 focus:ring-2 focus:ring-teal-500 outline-none transition-all shadow-inner min-w-[300px]"
            >
              <option value="critical_glucose" className="bg-slate-900 text-white">Vitros 4600 — Glucosa 340 mg/dL (CRÍTICO)</option>
              <option value="instrumental_finding" className="bg-slate-900 text-white">Vitros 4600 — Triglicéridos (EXTRA)</option>
              <option value="normal_cbc" className="bg-slate-900 text-white">Sysmex XN-1000 — Hemograma Normal</option>
              <option value="hl7_oru" className="bg-slate-900 text-white">Mindray BC-5000 — HL7 ORU^R01 (PLT 240k)</option>
            </select>

            <button
              onClick={handleStartSimulation}
              disabled={isSimulating}
              className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-4 py-1.5 rounded-lg transition flex items-center space-x-1.5 shadow disabled:opacity-50"
            >
              {isSimulating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span>{isSimulating ? 'Transmitiendo...' : 'Ejecutar Transacción'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="bg-slate-950 text-slate-100 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
        <div className="bg-slate-900 px-5 py-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-mono text-teal-400">
            <Terminal className="w-4 h-4" />
            <span>ACE TERMINAL (PORT 5100/6000)</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('live_terminal')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition ${
                activeTab === 'live_terminal' ? 'bg-teal-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Live Monitor
            </button>
            <button
              onClick={() => setActiveTab('adapters')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition ${
                activeTab === 'adapters' ? 'bg-teal-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Message Logs ({logs.length})
            </button>
          </div>
        </div>

        {activeTab === 'live_terminal' && (
          <div ref={terminalRef} className="p-5 font-mono text-xs space-y-4 max-h-[500px] min-h-[300px] overflow-y-auto">
             {!activeSession || activeSession.events.length === 0 ? (
                 <div className="flex items-center justify-center h-full text-slate-600 italic">
                     Esperando tráfico en la red del laboratorio...
                 </div>
             ) : (
                 activeSession.events.map((evt, idx) => (
                    <div key={evt.id} className="border-l-2 border-slate-800 pl-3 py-1 animate-in slide-in-from-left-2">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-slate-500">{new Date(evt.timestamp).toLocaleTimeString()}</span>
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                evt.type === 'CONTROL' ? 'bg-amber-500/20 text-amber-300' :
                                evt.type === 'DATA' ? 'bg-teal-500/20 text-teal-300' :
                                evt.type === 'SYSTEM' ? 'bg-blue-500/20 text-blue-300' : 'bg-emerald-500/20 text-emerald-300'
                            }`}>{evt.type}</span>
                            <span className={`text-[10px] font-bold ${evt.direction === 'IN' ? 'text-emerald-400' : evt.direction === 'OUT' ? 'text-rose-400' : 'text-slate-400'}`}>
                                {evt.direction === 'IN' ? '← INBOUND' : evt.direction === 'OUT' ? '→ OUTBOUND' : '⚙ INTERNAL'}
                            </span>
                        </div>
                        <div className="text-slate-300">{evt.message}</div>
                        {evt.rawHex && (
                           <pre className="mt-2 p-2 bg-slate-900 border border-slate-800 rounded-md text-[10px] text-teal-500/80 overflow-x-auto whitespace-pre">
                               {evt.rawHex}
                           </pre>
                        )}
                    </div>
                 ))
             )}
          </div>
        )}

        {activeTab === 'adapters' && (
           <div className="p-5 font-mono text-xs space-y-4 max-h-[500px] overflow-y-auto">
             {logs.map((log) => (
               <div key={log.id} className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-3">
                 <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] border-b border-slate-800/80 pb-2">
                   <div className="flex items-center space-x-2">
                     <span className="text-teal-400 font-bold">[{log.analyzerName}]</span>
                     <span className="text-slate-400">({log.protocol})</span>
                     <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded text-[10px] font-bold">
                       {log.status}
                     </span>
                   </div>
                   <span className="text-slate-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
                 </div>
                 <div>
                   <div className="text-[10px] text-slate-500 font-semibold mb-1 uppercase tracking-wider">Trama Raw:</div>
                   <pre className="bg-slate-950 text-emerald-400 p-3 rounded-lg border border-slate-800/80 whitespace-pre-wrap break-all text-[11px] leading-relaxed">
                     {log.rawPayload}
                   </pre>
                 </div>
                 {log.parsedData && (
                   <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60 text-[11px]">
                     <span className="text-slate-400">JSON Resultante: </span>
                     <code className="text-amber-300">{JSON.stringify(log.parsedData)}</code>
                   </div>
                 )}
               </div>
             ))}
           </div>
        )}
      </div>
    </div>
  );
};
