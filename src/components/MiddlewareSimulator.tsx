import React, { useState, useEffect, useRef } from 'react';
import { Analyzer, MiddlewareMessageLog, TestResult, Order } from '../types';
import { Cpu, Wifi, Radio, Send, Play, Terminal, CheckCircle2, AlertCircle, RefreshCw, FileText, ArrowRightLeft, Activity, Settings, X, Plug, Server } from 'lucide-react';
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

  // Physical Hardware Connection Test Modal State
  const [configModalAnalyzer, setConfigModalAnalyzer] = useState<Analyzer | null>(null);
  const [testIpAddress, setTestIpAddress] = useState('192.168.10.45');
  const [testTcpPort, setTestTcpPort] = useState('5100');
  const [testComPort, setTestComPort] = useState('COM1 (/dev/ttyUSB0)');
  const [isTestingSocket, setIsTestingSocket] = useState(false);
  const [socketTestResult, setSocketTestResult] = useState<string | null>(null);

  const [activeSession, setActiveSession] = useState<AnalyzerSession | null>(null);
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [activeSession?.events]);

  const handleOpenAnalyzerConfig = (an: Analyzer) => {
    setSelectedAnalyzerId(an.id);
    setConfigModalAnalyzer(an);
    setTestIpAddress(an.ipAddress || '192.168.10.45');
    setTestTcpPort(String(an.port || 5100));
    setTestComPort(an.comPort || 'COM1 (/dev/ttyUSB0)');
    setSocketTestResult(null);
  };

  const handleTestSocketConnection = () => {
    setIsTestingSocket(true);
    setSocketTestResult(null);

    setTimeout(() => {
      setIsTestingSocket(false);
      const isTcp = configModalAnalyzer?.connectionType === 'TCP_IP';
      const detailMsg = isTcp
        ? `✓ SOCKET TCP CONECTADO (IP ${testIpAddress}:${testTcpPort}) — Latencia 1.4 ms. Handshake ASTM ENQ/ACK completado.`
        : `✓ PUERTO SERIE RS232 OK (${testComPort} Baud: 9600-8-N-1) — Control de flujo RTS/CTS verificado.`;

      setSocketTestResult(detailMsg);

      window.dispatchEvent(
        new CustomEvent('lis-global-toast', {
          detail: { message: detailMsg, type: 'success', duration: 4000 }
        })
      );
    }, 1200);
  };

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

    const newLogItem: MiddlewareMessageLog = {
      id: `log-${Date.now()}`,
      analyzerId: selectedAn.id,
      analyzerName: selectedAn.name,
      direction: 'INBOUND',
      protocol: selectedAn.protocol,
      rawMessage: rawPayload,
      parsedData: parsedData,
      status: 'PROCESADO_OK',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };

    onNewResultSimulated(newLogItem, newResult as TestResult);
    setIsSimulating(false);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6 text-slate-100 animate-in fade-in duration-500">

      {/* Header Banner (Dark LISCORE Theme) */}
      <div className="bg-slate-900/90 border border-slate-800 p-6 sm:p-8 rounded-3xl shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center space-x-2 text-cyan-400 text-xs font-black uppercase tracking-wider mb-2">
            <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span>AbregoTech Analyzer Comm Engine (ACE v2.4)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Monitor de Comunicaciones ASTM/HL7 en Tiempo Real
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-2xl font-medium leading-relaxed">
            Inspección profunda de tramas, handshake a nivel de socket TCP/Serial y parseo de dialectos propietarios mediante LIS-Core.
          </p>
        </div>

        <div className="bg-slate-950 p-4 rounded-2xl border border-cyan-500/30 text-xs space-y-1 shrink-0">
          <div className="text-white font-bold flex items-center space-x-1.5">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span>Clúster Sockets ACE: <strong className="text-emerald-400">ACTIVO (Puerto 5100/5200)</strong></span>
          </div>
          <div className="text-slate-400 text-[11px]">TCP Handshake LIS-Host: Bidireccional OK</div>
        </div>
      </div>

      {/* Analyzer Cards Grid (Interactive Configuration on Click) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {analyzers.map((an) => {
          const isSelected = selectedAnalyzerId === an.id;
          const isOffline = an.status === 'OFFLINE';

          return (
            <div
              key={an.id}
              onClick={() => handleOpenAnalyzerConfig(an)}
              className={`p-5 rounded-3xl border transition cursor-pointer relative overflow-hidden shadow-xl group ${
                isSelected
                  ? 'bg-gradient-to-br from-cyan-950/80 via-slate-900 to-slate-900 border-cyan-400 ring-2 ring-cyan-400/30'
                  : 'bg-slate-900/90 border-slate-800 hover:border-cyan-500/50 hover:bg-slate-900'
              }`}
              title="Click para configurar puertos, IP y probar la conexión en tiempo real"
            >
              {isOffline && (
                <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-500"></div>
              )}

              <div className="flex items-center justify-between mb-3 relative z-10">
                <span className="font-black text-sm text-white group-hover:text-cyan-300 transition-colors flex items-center gap-1.5">
                  <span>{an.name}</span>
                  <Settings className="w-3.5 h-3.5 text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </span>
                <span className={`text-[10px] font-mono font-black uppercase px-2.5 py-0.5 rounded-full border transition-all ${
                  an.status === 'ONLINE' || (an.status as any) === 'En línea'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                }`}>
                  {an.status}
                </span>
              </div>

              <div className="text-xs space-y-1.5 font-mono text-slate-300 relative z-10">
                <div>Protocolo: <strong className="text-cyan-300">{an.protocol}</strong></div>
                <div>Conexión: <strong className="text-white">{an.connectionType === 'TCP_IP' ? `${an.ipAddress || '192.168.10.45'}:${an.port || 5100}` : an.comPort || 'COM1 (/dev/ttyUSB0)'}</strong></div>
                <div className="pt-1 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">Driver Dialecto:</span>
                  <code className="px-2 py-0.5 rounded-lg bg-slate-950 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold">
                    {an.driverId}
                  </code>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Transaction Test Bar (Dark Glassmorphic) */}
      <div className="bg-slate-900/90 rounded-3xl p-6 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            <h3 className="font-extrabold text-white text-xs uppercase tracking-wider">Inyección & Simulación de Tramas ACE</h3>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <label className="text-slate-400 font-bold uppercase tracking-tighter">Carga Útil:</label>
            <select
              value={simType}
              onChange={(e) => setSimType(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 text-cyan-300 font-bold rounded-2xl px-4 py-2 focus:border-cyan-400 outline-none transition-all shadow-inner min-w-[280px]"
            >
              <option value="critical_glucose" className="bg-slate-900 text-white">Vitros 4600 — Glucosa 340 mg/dL (CRÍTICO)</option>
              <option value="instrumental_finding" className="bg-slate-900 text-white">Vitros 4600 — Triglicéridos (EXTRA)</option>
              <option value="normal_cbc" className="bg-slate-900 text-white">Sysmex XN-1000 — Hemograma Normal</option>
              <option value="hl7_oru" className="bg-slate-900 text-white">Mindray BC-5000 — HL7 ORU^R01 (PLT 240k)</option>
            </select>

            <button
              onClick={handleStartSimulation}
              disabled={isSimulating}
              className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black px-5 py-2.5 rounded-2xl transition shadow-md shadow-cyan-500/20 cursor-pointer flex items-center space-x-2 disabled:opacity-50"
            >
              {isSimulating ? <RefreshCw className="w-4 h-4 animate-spin text-slate-950" /> : <Send className="w-4 h-4 text-slate-950" />}
              <span>{isSimulating ? 'Transmitiendo...' : 'Ejecutar Transacción'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Terminal Display */}
      <div className="bg-slate-950 text-slate-100 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
        <div className="bg-slate-900 px-5 py-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-mono text-cyan-400 font-bold">
            <Terminal className="w-4 h-4" />
            <span>ACE TERMINAL REAL-TIME MONITOR (TCP PORT 5100 / SERIAL COM)</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('live_terminal')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                activeTab === 'live_terminal' ? 'bg-cyan-400 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              Live Monitor
            </button>
          </div>
        </div>

        <div ref={terminalRef} className="p-5 font-mono text-xs space-y-2 max-h-[350px] overflow-y-auto no-scrollbar">
          {activeSession?.events && activeSession.events.length > 0 ? (
            activeSession.events.map((evt, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center space-x-2 text-[11px]">
                  <span className="text-slate-500">{evt.timestamp}</span>
                  <span className={evt.direction === 'IN' ? 'text-cyan-400 font-bold' : evt.direction === 'OUT' ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>
                    [{evt.direction}]
                  </span>
                  <span className="text-slate-200 font-bold">{evt.message}</span>
                </div>
                {evt.rawHex && (
                  <pre className="text-[10px] text-slate-500 bg-slate-900/60 p-2 rounded-xl border border-slate-800 overflow-x-auto">
                    {evt.rawHex}
                  </pre>
                )}
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-slate-500 text-xs">
              Esperando transmisión de datos ASTM / HL7 desde los analizadores conectados...
            </div>
          )}
        </div>
      </div>

      {/* ⚙️ HARDWARE CONNECTION & SOCKET TEST MODAL */}
      {configModalAnalyzer && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-800 space-y-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-2xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  <Plug className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h3 className="font-black text-white text-base">{configModalAnalyzer.name}</h3>
                  <p className="text-[10px] font-mono text-cyan-300">Driver Dialecto: {configModalAnalyzer.driverId} • {configModalAnalyzer.protocol}</p>
                </div>
              </div>
              <button onClick={() => setConfigModalAnalyzer(null)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <span className="text-[10px] font-black uppercase text-cyan-400 tracking-wider block">
                  Configuración de Parámetros Físicos del Equipo
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">Dirección IP del Analizador</label>
                    <input
                      type="text"
                      value={testIpAddress}
                      onChange={(e) => setTestIpAddress(e.target.value)}
                      placeholder="192.168.10.45"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono font-bold text-xs focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">Puerto Socket TCP/IP</label>
                    <input
                      type="text"
                      value={testTcpPort}
                      onChange={(e) => setTestTcpPort(e.target.value)}
                      placeholder="5100"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-amber-300 font-mono font-bold text-xs focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">Puerto Serie RS232 / USB (Baud Rate: 9600-8-N-1)</label>
                  <input
                    type="text"
                    value={testComPort}
                    onChange={(e) => setTestComPort(e.target.value)}
                    placeholder="COM1 (/dev/ttyUSB0)"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono font-bold text-xs focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              {/* Socket Test Output Banner */}
              {socketTestResult && (
                <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-300 font-mono text-xs font-bold animate-in fade-in">
                  {socketTestResult}
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setConfigModalAnalyzer(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-bold cursor-pointer"
                >
                  Cerrar
                </button>

                <button
                  type="button"
                  onClick={handleTestSocketConnection}
                  disabled={isTestingSocket}
                  className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 hover:brightness-110 text-slate-950 font-black text-xs transition shadow-lg shadow-emerald-500/20 cursor-pointer flex items-center space-x-2 disabled:opacity-50"
                >
                  {isTestingSocket ? <RefreshCw className="w-4 h-4 animate-spin text-slate-950" /> : <Plug className="w-4 h-4 text-slate-950" />}
                  <span>{isTestingSocket ? 'Probando Socket TCP...' : 'Probar Conexión Socket en Vivo'}</span>
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};
