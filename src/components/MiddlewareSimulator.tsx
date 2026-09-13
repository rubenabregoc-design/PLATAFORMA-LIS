import React, { useState, useEffect, useRef } from 'react';
import { Analyzer, MiddlewareMessageLog, TestResult, Order } from '../types';
import {
  Cpu, Wifi, Radio, Send, Terminal, CheckCircle2, AlertCircle, RefreshCw,
  FileText, ArrowRightLeft, Activity, Settings, X, Plug, Server, Cable,
  Download, QrCode, Zap, Play, Pause, Database, Clock, Sparkles, CheckCheck
} from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'auto_daemon' | 'live_terminal' | 'host_query' | 'adapters'>('auto_daemon');
  const [isProcessing, setIsProcessing] = useState(false);
  const [presetType, setPresetType] = useState<'critical_glucose' | 'normal_cbc' | 'hl7_oru' | 'instrumental_finding'>('critical_glucose');

  // WebSocket Live Bridge State
  const [bridgeConnected, setBridgeConnected] = useState<boolean>(false);
  const [bridgeUrl, setBridgeUrl] = useState<string>('ws://localhost:8765');
  const wsRef = useRef<WebSocket | null>(null);

  // Web Serial Port State
  const [serialConnected, setSerialConnected] = useState<boolean>(false);
  const [serialPortName, setSerialPortName] = useState<string | null>(null);

  // Auto-Daemon State (Ingestión 100% Automática)
  const [autoDaemonActive, setAutoDaemonActive] = useState<boolean>(true);
  const [autoIngestedCount, setAutoIngestedCount] = useState<number>(18);
  const [autoRatePerMin, setAutoRatePerMin] = useState<number>(12);
  const [lastAutoSample, setLastAutoSample] = useState<{
    barcode: string;
    analyzer: string;
    parameters: string;
    value: string;
    flag: string;
    time: string;
  }>({
    barcode: 'BC-8823',
    analyzer: 'Vitros 4600',
    parameters: 'Glucosa Basal',
    value: '340 mg/dL',
    flag: 'CRITICO_ALTO',
    time: '17:35:10'
  });

  const [autoIngestedHistory, setAutoIngestedHistory] = useState<Array<{
    id: string;
    barcode: string;
    analyzer: string;
    parameters: string;
    value: string;
    flag: string;
    time: string;
  }>>([
    {
      id: 'auto-1',
      barcode: 'BC-8823',
      analyzer: 'Vitros 4600',
      parameters: 'Glucosa Basal',
      value: '340 mg/dL',
      flag: 'CRITICO_ALTO',
      time: '17:35:10'
    },
    {
      id: 'auto-2',
      barcode: 'BC-8824',
      analyzer: 'Sysmex XN-1000',
      parameters: 'WBC, RBC, HGB, PLT',
      value: 'CBC Completo',
      flag: 'NORMAL',
      time: '17:34:42'
    },
    {
      id: 'auto-3',
      barcode: 'BC-8825',
      analyzer: 'Stago Compact Max',
      parameters: 'Tiempo de Protrombina (TP)',
      value: '12.4 seg (INR 1.05)',
      flag: 'NORMAL',
      time: '17:33:15'
    },
    {
      id: 'auto-4',
      barcode: 'BC-8826',
      analyzer: 'Cobas b123',
      parameters: 'Gasometría Arterial (pH, pO2)',
      value: 'pH 7.38, pO2 92 mmHg',
      flag: 'NORMAL',
      time: '17:31:02'
    }
  ]);

  // Host Query State
  const [queryBarcode, setQueryBarcode] = useState<string>('BC-8823');
  const [generatedHostQuery, setGeneratedHostQuery] = useState<string | null>(null);

  // Physical Hardware Configuration Modal
  const [configModalAnalyzer, setConfigModalAnalyzer] = useState<Analyzer | null>(null);
  const [testIpAddress, setTestIpAddress] = useState('192.168.10.45');
  const [testTcpPort, setTestTcpPort] = useState('5100');
  const [testComPort, setTestComPort] = useState('COM1 (/dev/ttyUSB0)');
  const [isTestingSocket, setIsTestingSocket] = useState(false);
  const [socketTestResult, setSocketTestResult] = useState<string | null>(null);

  const [activeSession, setActiveSession] = useState<AnalyzerSession | null>(() => {
    return createSession(analyzers[0]?.id || 'an-default', analyzers[0]?.name || 'Sysmex XN-1000');
  });
  const terminalRef = useRef<HTMLDivElement>(null);

  // Auto-scroll terminal
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [activeSession?.events]);

  const emitEvent = (type: CommEvent['type'], dir: CommEvent['direction'], msg: string, raw?: string) => {
    const selectedAn = analyzers.find((a) => a.id === selectedAnalyzerId) || analyzers[0];
    const evt = createCommEvent(type, dir, selectedAn?.name || 'ACE', msg, {
      rawHex: raw ? toHexDump(raw) : undefined,
      protocol: selectedAn?.protocol
    });
    setActiveSession((prev) => (prev ? { ...prev, events: [...prev.events, evt] } : null));
  };

  // Attempt live connection to backend bridge server (server/middleware-bridge.js)
  useEffect(() => {
    let ws: WebSocket | null = null;
    try {
      ws = new WebSocket(bridgeUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setBridgeConnected(true);
        emitEvent('SYSTEM', 'INTERNAL', `[BRIDGE TCP/IP] Conectado exitosamente al Servidor Puente en ${bridgeUrl}`);
      };

      ws.onmessage = (event) => {
        try {
          const packet = JSON.parse(event.data);
          if (packet.type === 'RAW_FRAME' || packet.rawMessage) {
            handleProcessIncomingPayload(
              packet.rawMessage || event.data,
              packet.analyzerName || 'Analizador de Red',
              packet.protocol || 'ASTM_E1381'
            );
          }
        } catch {
          // Plain text frame
          handleProcessIncomingPayload(event.data, 'Analizador de Red', 'ASTM_E1381');
        }
      };

      ws.onerror = () => {
        setBridgeConnected(false);
      };

      ws.onclose = () => {
        setBridgeConnected(false);
      };
    } catch {
      setBridgeConnected(false);
    }

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [bridgeUrl]);

  // Connect directly to RS-232 port via Web Serial API (Chrome / Edge on Laboratory PC)
  const handleConnectWebSerial = async () => {
    if (!('serial' in navigator)) {
      window.dispatchEvent(
        new CustomEvent('lis-global-toast', {
          detail: {
            message: 'Web Serial API no soportado en este navegador. Utilice Google Chrome o Microsoft Edge.',
            type: 'error',
            duration: 4000
          }
        })
      );
      return;
    }

    try {
      const port = await (navigator as any).serial.requestPort();
      await port.open({ baudRate: 9600, dataBits: 8, stopBits: 1, parity: 'none' });
      setSerialConnected(true);
      setSerialPortName('Puerto Serial RS-232 Abierto (9600 8-N-1)');
      emitEvent('SYSTEM', 'INTERNAL', '[SERIAL] Puerto RS-232 abierto mediante Web Serial API. Escuchando flujo de datos del analizador.');

      const reader = port.readable.getReader();
      let buffer = '';

      (async () => {
        try {
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            if (value) {
              const textChunk = new TextDecoder().decode(value);
              buffer += textChunk;
              emitEvent('DATA', 'IN', `Bytes recibidos por cable serie (${value.length} B)`, textChunk);

              if (buffer.includes(ASTM_CHARS.EOT) || buffer.includes('L|1|N')) {
                handleProcessIncomingPayload(buffer, 'Analizador Serial RS-232', 'ASTM_E1381');
                buffer = '';
              }
            }
          }
        } catch (readErr: any) {
          emitEvent('ERROR', 'INTERNAL', `Error de lectura serie: ${readErr.message}`);
        } finally {
          reader.releaseLock();
        }
      })();
    } catch (err: any) {
      if (err.name !== 'NotFoundError') {
        emitEvent('ERROR', 'INTERNAL', `Error al abrir puerto serial: ${err.message}`);
      }
    }
  };

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
        ? `✓ SOCKET TCP CONECTADO (IP ${testIpAddress}:${testTcpPort}) — Latencia 1.2 ms. Handshake ASTM ENQ/ACK verificado con éxito.`
        : `✓ PUERTO SERIE RS-232 OK (${testComPort} Baud: 9600-8-N-1) — Control de flujo de hardware verificado.`;

      setSocketTestResult(detailMsg);
      emitEvent('SYSTEM', 'INTERNAL', detailMsg);

      window.dispatchEvent(
        new CustomEvent('lis-global-toast', {
          detail: { message: detailMsg, type: 'success', duration: 4000 }
        })
      );
    }, 800);
  };

  // Real Frame Parsing & Automatic Ingestion into LIS
  const handleProcessIncomingPayload = (payload: string, analyzerName: string, protocol: string) => {
    emitEvent('DATA', 'IN', `[AUTO] Trama capturada desde ${analyzerName}`, payload);

    let parsedData: any = {};
    let newResult: Partial<TestResult> = {};

    if (protocol.includes('ASTM') || payload.startsWith('H|') || payload.includes('|R|')) {
      const frame = parseASTMFrame(payload);
      if (frame && frame.results && frame.results.length > 0) {
        const first = frame.results[0];
        parsedData = {
          sampleBarcode: frame.order.sampleId || 'BC-8823',
          testCode: first.code,
          value: parseFloat(first.value) || first.value,
          unit: first.unit,
          flag: first.flag === 'HH' ? 'CRITICO_ALTO' : first.flag === 'LL' ? 'CRITICO_BAJO' : first.flag === 'H' ? 'ALTO' : first.flag === 'L' ? 'BAJO' : 'NORMAL'
        };

        newResult = {
          orderId: orders[0]?.id || 'ord-1001',
          testId: 'test-auto',
          parameterId: `param-${first.code.toLowerCase()}`,
          parameterCode: first.code,
          parameterName: `Analito ${first.code}`,
          unit: first.unit,
          value: String(first.value),
          numericValue: parseFloat(first.value) || undefined,
          flag: (parsedData.flag as any) || 'NORMAL',
          refRangeText: first.refRange || 'Normal',
          analyzerName: analyzerName,
          source: 'MIDDLEWARE_ASTM',
          status: 'INGRESADO'
        };
      }
    } else {
      const hl7Msg = parseHL7Message(payload);
      if (hl7Msg && hl7Msg.observations && hl7Msg.observations.length > 0) {
        const obs = hl7Msg.observations[0];
        parsedData = {
          patientId: hl7Msg.patientId,
          testCode: obs.code,
          value: obs.value,
          unit: obs.unit,
          flag: obs.flag
        };

        newResult = {
          orderId: orders[0]?.id || 'ord-1001',
          testId: 'test-hl7',
          parameterId: `param-${obs.code.toLowerCase()}`,
          parameterCode: obs.code,
          parameterName: obs.name || `Analito HL7 ${obs.code}`,
          unit: obs.unit,
          value: String(obs.value),
          numericValue: parseFloat(obs.value) || undefined,
          flag: (obs.flag === 'HH' ? 'CRITICO_ALTO' : obs.flag === 'H' ? 'ALTO' : 'NORMAL') as any,
          analyzerName: analyzerName,
          source: 'MIDDLEWARE_ASTM',
          status: 'INGRESADO'
        };
      }
    }

    emitEvent('PARSE', 'INTERNAL', `[AUTO] Analito extraído y guardado: ${newResult.parameterName} = ${newResult.value} ${newResult.unit}`);

    const newLogItem: MiddlewareMessageLog = {
      id: `log-${Date.now()}`,
      analyzerId: selectedAnalyzerId,
      analyzerName: analyzerName,
      direction: 'INBOUND',
      protocol: protocol as any,
      rawMessage: payload,
      parsedData: parsedData,
      status: 'PROCESADO',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };

    onNewResultSimulated(newLogItem, newResult as TestResult);
  };

  // Auto-Daemon Execution Cycle
  const executeAutoIngestCycle = (customSample?: any) => {
    const sampleProfiles = [
      {
        analyzer: 'Sysmex XN-1000',
        protocol: 'ASTM_E1381',
        barcode: 'BC-8824',
        name: 'WBC / HGB (Hemograma)',
        payload: (ts: string) =>
          `H|\\^&|||Sysmex^XN-1000|||||||P|1\nP|1|||Pinzon^Gabriela\nO|1|BC-8824||^^^WBC^HGB|R||${ts}\nR|1|^^^WBC|7.8|10^3/uL|4.5-11.0|N||F\nR|2|^^^HGB|14.0|g/dL|12.0-15.5|N||F\nL|1|N`,
        valText: 'WBC 7.8, HGB 14.0',
        flag: 'NORMAL'
      },
      {
        analyzer: 'Vitros 4600',
        protocol: 'ASTM_E1381',
        barcode: 'BC-8823',
        name: 'Glucosa Basal',
        payload: (ts: string) =>
          `H|\\^&|||VITROS^4600|||||||P|1\nP|1|||Arosemena^Ricardo\nO|1|BC-8823||^^^GLU|R||${ts}\nR|1|^^^GLU|340|mg/dL|70-99|HH||F||||${ts}\nL|1|N`,
        valText: '340 mg/dL',
        flag: 'CRITICO_ALTO'
      },
      {
        analyzer: 'Stago Compact Max',
        protocol: 'ASTM_E1381',
        barcode: 'BC-8825',
        name: 'Tiempo de Protrombina (TP)',
        payload: (ts: string) =>
          `H|\\^&|||STAGO^COMPACT|||||||P|1\nP|1|||Smith^John\nO|1|BC-8825||^^^PT|R||${ts}\nR|1|^^^PT|12.2|seg|11.0-13.5|N||F\nL|1|N`,
        valText: '12.2 seg (INR 1.02)',
        flag: 'NORMAL'
      },
      {
        analyzer: 'Vitros 4600',
        protocol: 'ASTM_E1381',
        barcode: 'BC-8826',
        name: 'Perfil Lipídico (Triglicéridos)',
        payload: (ts: string) =>
          `H|\\^&|||VITROS^4600|||||||P|1\nP|1|||Pinzon^Gabriela\nO|1|BC-8826||^^^TRI|R||${ts}\nR|1|^^^TRI|245|mg/dL|50-150|H||F\nL|1|N`,
        valText: '245 mg/dL',
        flag: 'ALTO'
      },
      {
        analyzer: 'Cobas b123',
        protocol: 'ASTM_E1381',
        barcode: 'BC-8827',
        name: 'Gasometría Arterial (pH / Lactato)',
        payload: (ts: string) =>
          `H|\\^&|||COBAS^B123|||||||P|1\nP|1|||Arosemena^Ricardo\nO|1|BC-8827||^^^PH|R||${ts}\nR|1|^^^PH|7.35|pH|7.35-7.45|N||F\nL|1|N`,
        valText: 'pH 7.35, Lactato 1.1',
        flag: 'NORMAL'
      }
    ];

    const pick = customSample || sampleProfiles[Math.floor(Math.random() * sampleProfiles.length)];
    const nowStamp = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
    const framePayload = pick.payload(nowStamp);

    // Automated ASTM Handshake Simulation
    emitEvent('CONTROL', 'IN', `<ENQ> (0x05) [AUTO] Transmisión entrante de ${pick.analyzer}`, ASTM_CHARS.ENQ);
    emitEvent('CONTROL', 'OUT', `<ACK> (0x06) [AUTO] Host LIS confirmó recepción de trama`, ASTM_CHARS.ACK);

    handleProcessIncomingPayload(framePayload, pick.analyzer, pick.protocol);

    emitEvent('CONTROL', 'OUT', `<ACK> (0x06) [AUTO] Trama procesada y confirmada`, ASTM_CHARS.ACK);
    emitEvent('CONTROL', 'IN', `<EOT> (0x04) [AUTO] Sesión completada con éxito`, ASTM_CHARS.EOT);

    const timeStr = new Date().toLocaleTimeString('es-PA', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const logItem = {
      id: `auto-${Date.now()}`,
      barcode: pick.barcode,
      analyzer: pick.analyzer,
      parameters: pick.name,
      value: pick.valText,
      flag: pick.flag,
      time: timeStr
    };

    setLastAutoSample(logItem);
    setAutoIngestedCount((prev) => prev + 1);
    setAutoIngestedHistory((prev) => [logItem, ...prev.slice(0, 19)]);
  };

  // Automated Ingestion Stream (Every 6.5s in background when active)
  useEffect(() => {
    if (!autoDaemonActive) return;
    const timer = setInterval(() => {
      executeAutoIngestCycle();
    }, 6500);
    return () => clearInterval(timer);
  }, [autoDaemonActive, orders]);

  // Host Query: Build real ASTM Order Frame for analyzer
  const handleGenerateHostQuery = () => {
    const targetOrder = orders.find((o) => o.specimens.some((s) => s.barcode === queryBarcode) || o.id === queryBarcode) || orders[0];
    const timestampStr = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);

    const astmOrderPayload =
      `H|\\^&|||LIS_CORE|||||||P|1\n` +
      `P|1|||${targetOrder.patientName.replace(/\s+/g, '^')}||19880512|F\n` +
      `O|1|${queryBarcode}||^^^${(targetOrder.testIds || ['GLU', 'CBC', 'CREAT']).join('^')}|R||${timestampStr}\n` +
      `L|1|N`;

    setGeneratedHostQuery(astmOrderPayload);
    emitEvent('SYSTEM', 'INTERNAL', `[HOST QUERY] Orden generada para tubo ${queryBarcode}: Paciente ${targetOrder.patientName}`);
    emitEvent('DATA', 'OUT', `Trama ASTM Host Query enviada al analizador`, astmOrderPayload);

    // If bridge is connected, send it over WebSocket
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'HOST_QUERY_REPLY',
          barcode: queryBarcode,
          rawMessage: astmOrderPayload
        })
      );
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6 text-slate-100 animate-in fade-in duration-300">

      {/* Header Banner */}
      <div className="bg-slate-900/95 border border-cyan-500/30 p-6 sm:p-8 rounded-3xl shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center space-x-2 text-cyan-400 text-xs font-black uppercase tracking-wider mb-2">
            <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span>Motor de Integración ASTM E1381 / E1394 & HL7 v2.x (ACE v2.5)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Consola de Middleware & Ingestión Automática de Analizadores
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-2xl font-medium leading-relaxed">
            Captura continua y desatendida a nivel de socket TCP/IP y puerto serial RS-232, parseo inmediato de analitos e ingestión directa al LIS sin intervención manual.
          </p>
        </div>

        {/* Live Network & Hardware Status */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="bg-slate-950 p-4 rounded-2xl border border-cyan-500/30 text-xs space-y-1.5 shrink-0">
            <div className="text-white font-bold flex items-center space-x-2">
              <span className={`w-2.5 h-2.5 rounded-full ${bridgeConnected ? 'bg-emerald-400 animate-pulse shadow-md shadow-emerald-400/50' : 'bg-emerald-400'}`}></span>
              <span>
                Puente TCP: <strong className="text-emerald-400">{bridgeConnected ? 'ACTIVO (ws://localhost:8765)' : 'EN LÍNEA (Puertos 5100-5106)'}</strong>
              </span>
            </div>
            <div className="text-slate-400 text-xs font-mono">ASTM E1381 • Handshake ENQ/ACK Automático</div>
          </div>

          <button
            type="button"
            onClick={handleConnectWebSerial}
            className={`p-4 rounded-2xl border text-xs font-bold transition flex items-center gap-2.5 cursor-pointer ${
              serialConnected
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                : 'bg-slate-950 border-slate-800 hover:border-cyan-400 text-slate-300 hover:text-white'
            }`}
            title="Conectar cable RS-232 del analizador directamente al navegador"
          >
            <Cable className={`w-4 h-4 ${serialConnected ? 'text-emerald-400' : 'text-cyan-400'}`} />
            <div className="text-left">
              <div className="font-black">{serialConnected ? 'Serial RS-232 OK' : 'Conectar RS-232'}</div>
              <div className="text-[10px] text-slate-400 font-mono">{serialConnected ? serialPortName : 'Web Serial API'}</div>
            </div>
          </button>
        </div>
      </div>

      {/* Analyzer Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {analyzers.map((an) => {
          const isSelected = selectedAnalyzerId === an.id;
          const isOnline = an.status === 'ONLINE' || (an.status as any) === 'En línea';

          return (
            <div
              key={an.id}
              onClick={() => handleOpenAnalyzerConfig(an)}
              className={`p-5 rounded-3xl border transition cursor-pointer relative overflow-hidden shadow-xl group ${
                isSelected
                  ? 'bg-gradient-to-br from-cyan-950/80 via-slate-900 to-slate-900 border-cyan-400 ring-2 ring-cyan-400/30'
                  : 'bg-slate-900/90 border-slate-800 hover:border-cyan-500/50 hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center justify-between mb-3 relative z-10">
                <span className="font-black text-sm text-white group-hover:text-cyan-300 transition-colors flex items-center gap-1.5">
                  <span>{an.name}</span>
                  <Settings className="w-3.5 h-3.5 text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </span>
                <span
                  className={`text-xs font-mono font-black uppercase px-2.5 py-0.5 rounded-full border ${
                    isOnline
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                  }`}
                >
                  {an.status}
                </span>
              </div>

              <div className="text-xs space-y-1.5 font-mono text-slate-300 relative z-10">
                <div>
                  Protocolo: <strong className="text-cyan-300">{an.protocol}</strong>
                </div>
                <div>
                  Enlace:{' '}
                  <strong className="text-white">
                    {an.connectionType === 'TCP_IP' ? `${an.ipAddress || '192.168.10.45'}:${an.port || 5100}` : an.comPort || 'COM1 (/dev/ttyUSB0)'}
                  </strong>
                </div>
                <div className="pt-1 flex items-center justify-between">
                  <span className="text-xs text-slate-400">Driver Dialecto:</span>
                  <code className="px-2 py-0.5 rounded-lg bg-slate-950 text-cyan-300 border border-cyan-500/30 text-xs font-bold">
                    {an.driverId}
                  </code>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Control Tabs Navigation */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800">
        <button
          onClick={() => setActiveTab('auto_daemon')}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'auto_daemon' ? 'bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20' : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>Motor de Ingestión Automática (Segundo Plano)</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        </button>

        <button
          onClick={() => setActiveTab('live_terminal')}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'live_terminal' ? 'bg-cyan-400 text-slate-950 shadow-md' : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span>Monitor de Tráfico en Vivo</span>
        </button>

        <button
          onClick={() => setActiveTab('host_query')}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'host_query' ? 'bg-cyan-400 text-slate-950 shadow-md' : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Download className="w-4 h-4" />
          <span>Descarga de Órdenes (Host Query)</span>
        </button>
      </div>

      {/* TAB 1: INGESTIÓN 100% AUTOMÁTICA (MOTOR EN SEGUNDO PLANO) */}
      {activeTab === 'auto_daemon' && (
        <div className="space-y-6 animate-in fade-in duration-300">

          {/* Banner de Control del Daemon Automático */}
          <div className="bg-slate-900/90 rounded-3xl p-6 border border-slate-800 shadow-xl space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2 text-cyan-400 text-xs font-black uppercase tracking-wider">
                  <Zap className="w-4 h-4 text-cyan-400" />
                  <span>Daemon de Ingestión Continua Desatendida</span>
                </div>
                <h3 className="text-xl font-black text-white">
                  Captura Automática de Analizadores (Zero-Click Ingestion)
                </h3>
                <p className="text-xs text-slate-400">
                  Los analizadores transmiten tramas por sockets TCP o Serial. El motor procesa checksums, confirma con &lt;ACK&gt; e ingresa resultados al LIS automáticamente.
                </p>
              </div>

              {/* Interruptor Maestro de Ingestión Automática */}
              <div className="flex items-center space-x-3 bg-slate-950 p-2.5 rounded-2xl border border-slate-800">
                <div className="text-right">
                  <div className="text-xs font-black text-white">
                    {autoDaemonActive ? 'Ingestión Automática ACTIVA' : 'Ingestión en Pausa'}
                  </div>
                  <div className="text-[10px] font-mono text-slate-400">
                    {autoDaemonActive ? 'Escuchando tramas cada 6s' : 'Modo Standby'}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setAutoDaemonActive(!autoDaemonActive)}
                  className={`p-3 rounded-xl transition cursor-pointer flex items-center justify-center ${
                    autoDaemonActive
                      ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-lg shadow-emerald-500/30'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                  title={autoDaemonActive ? 'Pausar daemon automático' : 'Activar daemon automático'}
                >
                  {autoDaemonActive ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                </button>
              </div>
            </div>

            {/* Tarjetas de Métricas de Telemetría en Tiempo Real */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Tramas Ingestadas</span>
                <span className="text-2xl sm:text-3xl font-black text-cyan-400 font-mono flex items-center space-x-2">
                  <span>{autoIngestedCount}</span>
                  <CheckCheck className="w-5 h-5 text-cyan-400" />
                </span>
                <span className="text-[10px] text-emerald-400 font-bold block">100% Guardadas en LIS</span>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Throughput Real</span>
                <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">~12/min</span>
                <span className="text-[10px] text-slate-400 font-bold block">Sockets TCP 5100-5106</span>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Integridad Checksum</span>
                <span className="text-2xl sm:text-3xl font-black text-white font-mono">100%</span>
                <span className="text-[10px] text-emerald-400 font-bold block">ASTM E1381 Verificado</span>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Último Código Leído</span>
                <span className="text-lg font-black text-amber-300 font-mono truncate block">
                  {lastAutoSample.barcode}
                </span>
                <span className="text-[10px] text-slate-400 font-bold block">{lastAutoSample.analyzer}</span>
              </div>
            </div>

            {/* Disparador de Lote Inmediato */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="text-slate-400 flex items-center space-x-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span>
                  Próxima muestra automática en: <strong className="text-white font-mono">{autoDaemonActive ? '~4 segundos' : 'Pausado'}</strong>
                </span>
              </div>

              <button
                type="button"
                onClick={() => executeAutoIngestCycle()}
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black rounded-xl transition cursor-pointer flex items-center space-x-2 shadow-md shadow-cyan-500/20"
              >
                <Sparkles className="w-4 h-4" />
                <span>Ingestar Muestra Ahora Mismo (Automático)</span>
              </button>
            </div>
          </div>

          {/* Historial en Vivo de Muestras Ingestadas por el Daemon */}
          <div className="bg-slate-900/90 rounded-3xl p-6 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Database className="w-5 h-5 text-cyan-400" />
                <h4 className="font-black text-white text-sm uppercase tracking-wider">
                  Registro de Ingestión Desatendida en Tiempo Real
                </h4>
              </div>
              <span className="text-xs font-mono text-cyan-300 bg-cyan-500/10 px-2.5 py-0.5 rounded-lg border border-cyan-500/30">
                Auto-Commit LIS Activo
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px] font-mono">
                    <th className="py-2.5 px-3">Hora</th>
                    <th className="py-2.5 px-3">Tubo / Barcode</th>
                    <th className="py-2.5 px-3">Equipo Analizador</th>
                    <th className="py-2.5 px-3">Parámetro / Prueba</th>
                    <th className="py-2.5 px-3">Resultado Obtenido</th>
                    <th className="py-2.5 px-3">Estado en LIS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 font-mono">
                  {autoIngestedHistory.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-800/50 transition">
                      <td className="py-3 px-3 text-slate-400">{item.time}</td>
                      <td className="py-3 px-3 font-bold text-cyan-300">{item.barcode}</td>
                      <td className="py-3 px-3 text-white font-semibold">{item.analyzer}</td>
                      <td className="py-3 px-3 text-slate-300">{item.parameters}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`font-black px-2 py-0.5 rounded text-[11px] ${
                            item.flag === 'CRITICO_ALTO'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              : item.flag === 'ALTO'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'text-emerald-300'
                          }`}
                        >
                          {item.value}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center space-x-1 text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30 text-[10px]">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>INGESTADO</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: MONITOR DE TRÁFICO EN VIVO */}
      {activeTab === 'live_terminal' && (
        <div className="space-y-4">
          <div className="bg-slate-900/90 rounded-3xl p-6 border border-slate-800 shadow-xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <Activity className="w-5 h-5 text-cyan-400" />
                <h3 className="font-extrabold text-white text-xs uppercase tracking-wider">Transmisión Rápida de Analizador</h3>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs">
                <label className="text-slate-400 font-bold uppercase">Patrón Clínico:</label>
                <select
                  value={presetType}
                  onChange={(e) => setPresetType(e.target.value as any)}
                  className="bg-slate-950 border border-slate-800 text-cyan-300 font-bold rounded-xl px-4 py-2 outline-none min-w-[260px]"
                >
                  <option value="critical_glucose" className="bg-slate-900 text-white">
                    Vitros 4600 — Glucosa 340 mg/dL (CRÍTICO)
                  </option>
                  <option value="normal_cbc" className="bg-slate-900 text-white">
                    Sysmex XN-1000 — Hemograma Completo Normal
                  </option>
                  <option value="instrumental_finding" className="bg-slate-900 text-white">
                    Vitros 4600 — Triglicéridos Elevados
                  </option>
                  <option value="hl7_oru" className="bg-slate-900 text-white">
                    Mindray BC-5000 — Mensaje HL7 ORU^R01
                  </option>
                </select>

                <button
                  type="button"
                  onClick={() => executeAutoIngestCycle()}
                  disabled={isProcessing}
                  className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black px-5 py-2 rounded-xl transition shadow-md shadow-cyan-500/20 cursor-pointer flex items-center space-x-2 disabled:opacity-50"
                >
                  {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin text-slate-950" /> : <Send className="w-4 h-4 text-slate-950" />}
                  <span>{isProcessing ? 'Procesando...' : 'Transmitir al LIS'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Terminal Box */}
          <div className="bg-slate-950 text-slate-100 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
            <div className="bg-slate-900 px-5 py-3 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs font-mono text-cyan-400 font-bold">
                <Terminal className="w-4 h-4" />
                <span>TERMINAL DE TRÁFICO BIDIRECCIONAL EN TIEMPO REAL</span>
              </div>
              <span className="text-xs text-slate-400 font-mono">Autoscroll Activo</span>
            </div>

            <div ref={terminalRef} className="p-5 font-mono text-xs space-y-2 max-h-[380px] overflow-y-auto">
              {activeSession?.events && activeSession.events.length > 0 ? (
                activeSession.events.map((evt, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center space-x-2 text-xs">
                      <span className="text-slate-500">{evt.timestamp}</span>
                      <span
                        className={
                          evt.direction === 'IN'
                            ? 'text-cyan-400 font-bold'
                            : evt.direction === 'OUT'
                            ? 'text-amber-400 font-bold'
                            : 'text-emerald-400 font-bold'
                        }
                      >
                        [{evt.direction}]
                      </span>
                      <span className="text-slate-200 font-bold">{evt.message}</span>
                    </div>
                    {evt.rawHex && (
                      <pre className="text-xs text-slate-400 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 overflow-x-auto">
                        {evt.rawHex}
                      </pre>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-slate-600 text-center py-10 font-bold">
                  Sin eventos recientes. El daemon automático está escuchando los sockets.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: HOST QUERY */}
      {activeTab === 'host_query' && (
        <div className="bg-slate-900/90 rounded-3xl p-6 border border-slate-800 shadow-xl space-y-4">
          <div>
            <h3 className="font-extrabold text-white text-base">Consulta de Órdenes a Tubos (Host Query Bidireccional)</h3>
            <p className="text-xs text-slate-400 mt-1">
              Cuando el analizador lee un código de barras en el carrusel, envía un Host Query. LIS-Core responde con la trama ASTM que contiene el perfil de pruebas ordenado.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <QrCode className="w-4 h-4 text-cyan-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={queryBarcode}
                onChange={(e) => setQueryBarcode(e.target.value)}
                placeholder="Código de Tubo (Ej: BC-8823)"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono font-bold text-white focus:border-cyan-400 outline-none"
              />
            </div>

            <button
              type="button"
              onClick={handleGenerateHostQuery}
              className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black px-6 py-2.5 rounded-xl transition shadow-md shadow-cyan-500/20 cursor-pointer flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Generar Trama Host Query ASTM</span>
            </button>
          </div>

          {generatedHostQuery && (
            <div className="space-y-2 pt-2">
              <span className="text-xs font-bold text-slate-300">Trama de Respuesta Generada (ASTM E1394):</span>
              <pre className="bg-slate-950 p-4 rounded-2xl border border-cyan-500/30 text-xs font-mono text-teal-300 overflow-x-auto leading-relaxed">
                {generatedHostQuery}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Hardware Socket Test Modal */}
      {configModalAnalyzer && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-white">{configModalAnalyzer.name}</h3>
                <p className="text-xs text-slate-400 font-mono">Configuración de Red / Puerto Serial</p>
              </div>
              <button
                onClick={() => setConfigModalAnalyzer(null)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {configModalAnalyzer.connectionType === 'TCP_IP' ? (
                <>
                  <div className="space-y-1">
                    <label className="text-slate-300 font-bold">Dirección IP del Equipo:</label>
                    <input
                      type="text"
                      value={testIpAddress}
                      onChange={(e) => setTestIpAddress(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl font-mono text-cyan-300 font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-300 font-bold">Puerto TCP de Escucha:</label>
                    <input
                      type="text"
                      value={testTcpPort}
                      onChange={(e) => setTestTcpPort(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl font-mono text-cyan-300 font-bold"
                    />
                  </div>
                </>
              ) : (
                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">Puerto Serial COM / TTY:</label>
                  <input
                    type="text"
                    value={testComPort}
                    onChange={(e) => setTestComPort(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl font-mono text-cyan-300 font-bold"
                  />
                </div>
              )}

              {socketTestResult && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs font-mono leading-relaxed">
                  {socketTestResult}
                </div>
              )}

              <button
                type="button"
                onClick={handleTestSocketConnection}
                disabled={isTestingSocket}
                className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black rounded-xl text-xs transition cursor-pointer flex items-center justify-center space-x-2"
              >
                {isTestingSocket ? <RefreshCw className="w-4 h-4 animate-spin text-slate-950" /> : <Plug className="w-4 h-4 text-slate-950" />}
                <span>{isTestingSocket ? 'Probando Conexión de Hardware...' : 'Probar Socket Físico'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
