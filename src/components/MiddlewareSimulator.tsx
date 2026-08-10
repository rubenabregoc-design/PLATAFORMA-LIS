import React, { useState } from 'react';
import { Analyzer, MiddlewareMessageLog, TestResult, Order } from '../types';
import { Cpu, Wifi, Radio, Send, Play, Terminal, CheckCircle2, AlertCircle, RefreshCw, FileText, ArrowRightLeft } from 'lucide-react';

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
  const [simType, setSimType] = useState<'critical_glucose' | 'normal_cbc' | 'hl7_oru'>('critical_glucose');

  const handleSimulateFrame = () => {
    setIsSimulating(true);

    setTimeout(() => {
      const selectedAn = analyzers.find((a) => a.id === selectedAnalyzerId) || analyzers[0];
      const timestamp = new Date().toISOString();

      if (simType === 'critical_glucose') {
        const rawAstm = `H|\\^&|||VITROS^4600|||||||P|1|${new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14)}\nP|1||||Arosemena^Ricardo\nO|1|BC-882004||^^^GLU_101|R||${new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14)}\nR|1|^^^GLU|340|mg/dL|70-99|HH||F||||${new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14)}\nL|1|N`;

        const newLog: MiddlewareMessageLog = {
          id: `msg-${Date.now()}`,
          tenantId: 'lab-san-jose',
          analyzerId: selectedAn.id,
          analyzerName: selectedAn.name,
          protocol: 'ASTM E1381 / E1394',
          direction: 'INBOUND',
          rawPayload: rawAstm,
          parsedData: {
            sampleBarcode: 'BC-882004',
            orderMatched: 'ORD-2026-00102',
            testCode: 'GLU',
            value: 340,
            unit: 'mg/dL',
            flag: 'CRITICO_ALTO'
          },
          status: 'PROCESADO',
          timestamp
        };

        const newResult: TestResult = {
          id: `res-${Date.now()}`,
          tenantId: 'lab-san-jose',
          orderId: 'ord-1002',
          testId: 'test-glucosa',
          parameterId: 'p-glu',
          parameterName: 'Glucosa Basal',
          unit: 'mg/dL',
          value: '340',
          numericValue: 340,
          flag: 'CRITICO_ALTO',
          refRangeText: '70 - 99',
          source: 'MIDDLEWARE_ASTM',
          analyzerName: selectedAn.name,
          status: 'INGRESADO'
        };

        onNewResultSimulated(newLog, newResult);
      } else if (simType === 'normal_cbc') {
        const rawAstm = `H|\\^&|||Sysmex^XN-1000|||||||P|1|${new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14)}\nP|1||||Pinzón^Gabriela\nO|1|BC-882001||^^^SYSMEX_CBC|R||${new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14)}\nR|1|^^^WBC|7.4|10^3/uL|4.5-11.0|N||F||||${new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14)}\nR|2|^^^HGB|14.0|g/dL|12.0-15.5|N||F||||${new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14)}\nL|1|N`;

        const newLog: MiddlewareMessageLog = {
          id: `msg-${Date.now()}`,
          tenantId: 'lab-san-jose',
          analyzerId: selectedAn.id,
          analyzerName: selectedAn.name,
          protocol: 'ASTM E1381',
          direction: 'INBOUND',
          rawPayload: rawAstm,
          parsedData: {
            sampleBarcode: 'BC-882001',
            orderMatched: 'ORD-2026-00101',
            wbc: 7.4,
            hgb: 14.0
          },
          status: 'PROCESADO',
          timestamp
        };

        const newResult: TestResult = {
          id: `res-${Date.now()}`,
          tenantId: 'lab-san-jose',
          orderId: 'ord-1001',
          testId: 'test-hemograma',
          parameterId: 'p-wbc',
          parameterName: 'Leucocitos (WBC)',
          unit: 'x10^3/µL',
          value: '7.4',
          numericValue: 7.4,
          flag: 'NORMAL',
          refRangeText: '4.5 - 11.0',
          source: 'MIDDLEWARE_ASTM',
          analyzerName: selectedAn.name,
          status: 'INGRESADO'
        };

        onNewResultSimulated(newLog, newResult);
      } else {
        // HL7 ORU
        const rawHl7 = `MSH|^~\\&|MINDRAY_BC5000|LAB_SAN_JOSE|LIS_CORE|ABREGOTECH|20260810103000||ORU^R01|MSG00982|P|2.3.1\nPID|1||8-812-4432||Pinzon^Gabriela||19920514|F\nOBR|1|ORD-2026-00101|BC-882001|HEM01^Hemograma|||20260810102800\nOBX|1|NM|PLT^Plaquetas||240|x10^3/uL|150-450|N|||F`;

        const newLog: MiddlewareMessageLog = {
          id: `msg-${Date.now()}`,
          tenantId: 'lab-san-jose',
          analyzerId: selectedAn.id,
          analyzerName: selectedAn.name,
          protocol: 'HL7 v2.3.1 (ORU^R01)',
          direction: 'INBOUND',
          rawPayload: rawHl7,
          parsedData: {
            hl7EventType: 'ORU^R01',
            patientId: '8-812-4432',
            plt: 240
          },
          status: 'PROCESADO',
          timestamp
        };

        const newResult: TestResult = {
          id: `res-${Date.now()}`,
          tenantId: 'lab-san-jose',
          orderId: 'ord-1001',
          testId: 'test-hemograma',
          parameterId: 'p-plt',
          parameterName: 'Plaquetas (PLT)',
          unit: 'x10^3/µL',
          value: '240',
          numericValue: 240,
          flag: 'NORMAL',
          refRangeText: '150 - 450',
          source: 'MIDDLEWARE_HL7',
          analyzerName: selectedAn.name,
          status: 'INGRESADO'
        };

        onNewResultSimulated(newLog, newResult);
      }

      setIsSimulating(false);
    }, 600);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center space-x-2 text-teal-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Radio className="w-4 h-4 animate-pulse" />
            <span>AbregoTech Middleware TCP/IP & RS-232 Socket Engine</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-100">
            Capa de Integración de Analizadores Clínicos (ASTM & HL7)
          </h1>
          <p className="text-slate-400 text-sm mt-1 max-w-2xl">
            Proceso desacoplado mediante cola de mensajes que escucha equipos en serie/Ethernet, interpreta dialectos propietarios y sincroniza con LIS-Core.
          </p>
        </div>

        <div className="flex items-center space-x-3 bg-slate-800/80 p-3 rounded-xl border border-slate-700/80">
          <Cpu className="w-7 h-7 text-teal-400" />
          <div className="text-xs">
            <div className="text-slate-300 font-bold">3 Analizadores Conectados</div>
            <div className="text-emerald-400">● Socket Engine Listening (Port 5100/6000)</div>
          </div>
        </div>
      </div>

      {/* Analyzer Status & Controls Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {analyzers.map((an) => (
          <div
            key={an.id}
            onClick={() => setSelectedAnalyzerId(an.id)}
            className={`p-4 rounded-xl border transition cursor-pointer ${
              selectedAnalyzerId === an.id
                ? 'bg-slate-900 border-teal-500 text-white ring-2 ring-teal-500/20'
                : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-sm">{an.name}</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                {an.status}
              </span>
            </div>

            <div className="text-xs space-y-1 text-slate-400">
              <div>Protocolo: <strong className="text-slate-200">{an.protocol}</strong></div>
              <div>Conexión: <strong className="text-slate-200">{an.connectionType === 'TCP_IP' ? `${an.ipAddress}:${an.port}` : an.comPort}</strong></div>
              <div>Driver Dialecto: <code className="bg-slate-800 px-1 py-0.5 rounded text-teal-300 text-[11px]">{an.driverId}</code></div>
            </div>
          </div>
        ))}
      </div>

      {/* Simulator Action Controls */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Play className="w-5 h-5 text-teal-600" />
            <h3 className="font-bold text-slate-900 text-sm">Simulador de Envío de Trama por Analizador</h3>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <label className="text-slate-600 font-medium">Tipo de Lectura:</label>
            <select
              value={simType}
              onChange={(e) => setSimType(e.target.value as any)}
              className="bg-slate-100 border border-slate-300 rounded-lg px-2.5 py-1 font-medium focus:ring-2 focus:ring-teal-500"
            >
              <option value="critical_glucose">Vitros 4600 — Glucosa 340 mg/dL (¡ALERTA CRÍTICA!)</option>
              <option value="normal_cbc">Sysmex XN-1000 — Hemograma Completo Normal</option>
              <option value="hl7_oru">Mindray BC-5000 — HL7 ORU^R01 (Plaquetas 240k)</option>
            </select>

            <button
              onClick={handleSimulateFrame}
              disabled={isSimulating}
              className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-4 py-1.5 rounded-lg transition flex items-center space-x-1.5 shadow"
            >
              {isSimulating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span>{isSimulating ? 'Transmitiendo Socket...' : 'Emitir Trama a Middleware'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Terminal and Log Stream */}
      <div className="bg-slate-950 text-slate-100 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
        <div className="bg-slate-900 px-5 py-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-mono text-teal-400">
            <Terminal className="w-4 h-4" />
            <span>SOCKET STREAM & ASTM/HL7 MESSAGE QUEUE LOGS</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('live_terminal')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition ${
                activeTab === 'live_terminal' ? 'bg-teal-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Terminal en Vivo ({logs.length})
            </button>
            <button
              onClick={() => setActiveTab('adapters')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition ${
                activeTab === 'adapters' ? 'bg-teal-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Arquitectura de Adaptadores
            </button>
            <button
              onClick={() => setActiveTab('hl7_his')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition ${
                activeTab === 'hl7_his' ? 'bg-teal-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Interfaz HL7 hacia HIS Externo
            </button>
          </div>
        </div>

        {activeTab === 'live_terminal' && (
          <div className="p-5 font-mono text-xs space-y-4 max-h-[450px] overflow-y-auto">
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

                {/* Raw Payload Display */}
                <div>
                  <div className="text-[10px] text-slate-500 font-semibold mb-1 uppercase tracking-wider">Trama Raw Recibida por Socket:</div>
                  <pre className="bg-slate-950 text-emerald-400 p-3 rounded-lg border border-slate-800/80 whitespace-pre-wrap break-all text-[11px] leading-relaxed">
                    {log.rawPayload}
                  </pre>
                </div>

                {/* Parsed JSON Data */}
                {log.parsedData && (
                  <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60 text-[11px]">
                    <span className="text-slate-400">Datos Mapeados por Parser Dialecto: </span>
                    <code className="text-amber-300">{JSON.stringify(log.parsedData)}</code>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'adapters' && (
          <div className="p-6 text-xs text-slate-300 space-y-4 leading-relaxed font-mono">
            <div className="text-teal-400 font-bold text-sm">-- Configuración de Adaptadores / Drivers por Analizador</div>
            <p>
              Cada analizador en Panamá posee un "dialecto" ASTM/HL7 particular. Por ejemplo, Ortho Vitros envía parámetros de glucosa bajo el código <code className="text-amber-300">GLU_101</code>, mientras que Sysmex transmite <code className="text-amber-300">WBC</code> en bloques R con unidades <code className="text-amber-300">10^3/uL</code>.
            </p>

            <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-teal-300 text-[11px]">
{`// Driver Config Schema (JSON)
{
  "driverId": "ortho-vitros-4600",
  "protocol": "ASTM_E1381",
  "delimiters": { "field": "|", "repeat": "\\\\", "component": "^", "escape": "&" },
  "mappings": [
    { "analyzerCode": "GLU_101", "lisTestId": "test-glucosa", "parameter": "p-glu" },
    { "analyzerCode": "CHOL", "lisTestId": "test-lipidico", "parameter": "p-col" }
  ],
  "checksumValidation": true,
  "ackFrame": "\\x06" // ASCII ACK
}`}
            </pre>
          </div>
        )}

        {activeTab === 'hl7_his' && (
          <div className="p-6 text-xs text-slate-300 space-y-4 leading-relaxed font-mono">
            <div className="text-teal-400 font-bold text-sm">-- Integración HL7 v2.x hacia HIS de Hospitales Terceros</div>
            <p className="text-slate-400">
              El LIS-Core de AbregoTech actúa como sistema de referencia recibiendo admisiones <code className="text-teal-300">ADT^A01</code> y órdenes médicas <code className="text-teal-300">ORM^O01</code> desde el HIS del hospital cliente, y respondiendo con observaciones de laboratorio <code className="text-teal-300">ORU^R01</code> una vez aprobadas por el Jefe de Laboratorio.
            </p>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-slate-300 space-y-2">
              <div className="text-amber-300 font-bold">Ejemplo de Mapeo Interfaz HL7 ORU^R01 (Inmune a variaciones de HIS):</div>
              <pre className="text-emerald-400 text-[11px] whitespace-pre-wrap">
{`MSH|^~\\&|LIS_ABREGOTECH|LAB_SAN_JOSE|HOSPITAL_HIS|PANAMA_HEALTH|20260810103500||ORU^R01|MSG-99201|P|2.3
PID|1||8-812-4432||Pinzon^Gabriela||19920514|F
OBR|1|ORD-2026-00101|BC-882001|HEM01^Hemograma Completo|||20260810073000
OBX|1|NM|WBC^Leucocitos||7.2|10^3/uL|4.5-11.0|N|||F|||20260810084500|TM-3109-PA`}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
