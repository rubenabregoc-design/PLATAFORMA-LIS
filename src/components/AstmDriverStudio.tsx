import React, { useState } from 'react';
import { Analyzer, TestCatalogItem, TestResult, MiddlewareMessageLog } from '../types';
import { Cpu, Terminal, Play, RefreshCw, CheckCircle2, AlertTriangle, ArrowRightLeft, Code2, Database, Sliders } from 'lucide-react';

interface AstmDriverStudioProps {
  analyzers: Analyzer[];
  testCatalog: TestCatalogItem[];
  onTestSimulated?: (rawFrame: string, parsedResults: any) => void;
}

export const AstmDriverStudio: React.FC<AstmDriverStudioProps> = ({
  analyzers,
  testCatalog
}) => {
  const [selectedAnalyzerId, setSelectedAnalyzerId] = useState<string>(analyzers[0]?.id || '');
  const [activeSubTab, setActiveSubTab] = useState<'mapping' | 'bidirectional' | 'checksum'>('mapping');

  // Mapping Matrix state
  const [mappings, setMappings] = useState([
    { id: 'm1', analyzerCode: 'WBC', lisParameter: 'Hemograma — Leucocitos (WBC)', unit: '10^3/uL', multiplier: 1.0, status: 'ACTIVO' },
    { id: 'm2', analyzerCode: 'RBC', lisParameter: 'Hemograma — Eritrocitos (RBC)', unit: '10^6/uL', multiplier: 1.0, status: 'ACTIVO' },
    { id: 'm3', analyzerCode: 'HGB', lisParameter: 'Hemograma — Hemoglobina', unit: 'g/dL', multiplier: 1.0, status: 'ACTIVO' },
    { id: 'm4', analyzerCode: 'HCT', lisParameter: 'Hemograma — Hematocrito', unit: '%', multiplier: 1.0, status: 'ACTIVO' },
    { id: 'm5', analyzerCode: 'PLT', lisParameter: 'Hemograma — Plaquetas', unit: '10^3/uL', multiplier: 1.0, status: 'ACTIVO' },
    { id: 'm6', analyzerCode: 'GLU_V', lisParameter: 'Química — Glucosa en Suero', unit: 'mg/dL', multiplier: 1.0, status: 'ACTIVO' },
    { id: 'm7', analyzerCode: 'CREA_V', lisParameter: 'Química — Creatinina', unit: 'mg/dL', multiplier: 1.0, status: 'ACTIVO' }
  ]);

  const [newAnalyzerCode, setNewAnalyzerCode] = useState('');
  const [newLisParam, setNewLisParam] = useState('');

  // Host Query Simulator State
  const [queryBarcode, setQueryBarcode] = useState('BC-8823101');
  const [hostQueryLogs, setHostQueryLogs] = useState<string[]>([]);
  const [isSimulatingHostQuery, setIsSimulatingHostQuery] = useState(false);

  // Checksum calculator state
  const [testPayload, setTestPayload] = useState('1H|\\^&|||Sysmex^XN-1000|||||||P|1|20260810100000');

  const selectedAnalyzer = analyzers.find((a) => a.id === selectedAnalyzerId) || analyzers[0];

  // Function to calculate ASTM Modulo 256 Checksum
  const calculateAstmChecksum = (str: string) => {
    let sum = 0;
    for (let i = 0; i < str.length; i++) {
      sum += str.charCodeAt(i);
    }
    const checksum = (sum % 256).toString(16).toUpperCase().padStart(2, '0');
    return checksum;
  };

  const handleAddMapping = () => {
    if (!newAnalyzerCode || !newLisParam) {
      alert('Ingrese el código del analizador y el parámetro LIS.');
      return;
    }
    setMappings([
      ...mappings,
      {
        id: `m-${Date.now()}`,
        analyzerCode: newAnalyzerCode.trim(),
        lisParameter: newLisParam.trim(),
        unit: 'mg/dL',
        multiplier: 1.0,
        status: 'ACTIVO'
      }
    ]);
    setNewAnalyzerCode('');
    setNewLisParam('');
  };

  const handleRunHostQuery = () => {
    setIsSimulatingHostQuery(true);
    setHostQueryLogs([]);

    const steps = [
      `[10:35:01.002] 🟢 ANALIZADOR (${selectedAnalyzer.name}) -> HOST: <ENQ> (0x05) [Iniciando sesión TCP/Serial]`,
      `[10:35:01.015] 🔵 LIS-CORE HOST -> ANALIZADOR: <ACK> (0x06) [Conexión aceptada, esperando trama Host-Query]`,
      `[10:35:01.050] 🟢 ANALIZADOR -> HOST: <STX>1H|\\^&|||${selectedAnalyzer.model}|||||||P|1<CR><ETX>4A<CR><LF>`,
      `[10:35:01.080] 🟢 ANALIZADOR -> HOST: <STX>2Q|1|^${queryBarcode}||ALL||||||||O<CR><ETX>7C<CR><LF> (SOLICITUD WORKLIST)`,
      `[10:35:01.110] 🔵 LIS-CORE -> CONSULTANDO POSTGRESQL TENANT... Muestra "${queryBarcode}" encontrada para Hemograma Completo.`,
      `[10:35:01.150] 🔵 LIS-CORE HOST -> ANALIZADOR: <STX>3O|1|${queryBarcode}||^HEMOGRAMA_COMPLETE|||||||N<CR><ETX>B2<CR><LF> (RESPUESTA WORKLIST)`,
      `[10:35:01.200] 🟢 ANALIZADOR -> HOST: <ACK> (0x06) [Worklist recibida por el analizador]`,
      `[10:35:04.500] 🟢 ANALIZADOR -> HOST: <STX>4R|1|^WBC^Leucocitos|7.8|10^3/uL|4.0-10.0|N||F<CR><ETX>E1<CR><LF> (ENVÍO RESULTADO)`,
      `[10:35:04.530] 🟢 ANALIZADOR -> HOST: <STX>5R|2|^RBC^Eritrocitos|4.65|10^6/uL|4.2-5.4|N||F<CR><ETX>F3<CR><LF>`,
      `[10:35:04.560] 🟢 ANALIZADOR -> HOST: <STX>6R|3|^HGB^Hemoglobina|14.2|g/dL|12.0-16.0|N||F<CR><ETX>12<CR><LF>`,
      `[10:35:04.600] 🟢 ANALIZADOR -> HOST: <STX>7L|1|N<CR><ETX>03<CR><LF> (FIN DE TRANSMISIÓN)`,
      `[10:35:04.620] 🔵 LIS-CORE HOST -> ANALIZADOR: <ACK> (0x06) & <EOT> (0x04) [Resultados auto-ingresados en LIS para validación técnica]`
    ];

    steps.forEach((step, idx) => {
      setTimeout(() => {
        setHostQueryLogs((prev) => [...prev, step]);
        if (idx === steps.length - 1) {
          setIsSimulatingHostQuery(false);
        }
      }, (idx + 1) * 350);
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-950 text-white p-6 rounded-2xl shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="text-teal-400 text-xs font-bold uppercase tracking-wider mb-1 flex items-center space-x-2">
            <Cpu className="w-4 h-4" />
            <span>Fase 2 — Drivers de Analizadores & Mapeo de Dialectos ASTM Panamá</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black">
            Estudio de Analizadores ASTM E1381/E1394
          </h1>
          <p className="text-slate-400 text-sm mt-1 max-w-xl">
            Soporte nativo para analizadores de hematología y química clínica líderes en Panamá (Sysmex XN-1000, Ortho Vitros, Mindray).
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl text-xs space-y-1">
          <div className="text-teal-400 font-bold">Analizador Seleccionado:</div>
          <select
            value={selectedAnalyzerId}
            onChange={(e) => setSelectedAnalyzerId(e.target.value)}
            className="bg-slate-800 text-white font-bold text-xs p-1 rounded border border-slate-700"
          >
            {analyzers.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ({a.protocol})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-xl p-1.5 shadow-sm space-x-2">
        <button
          onClick={() => setActiveSubTab('mapping')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-xs font-bold transition ${
            activeSubTab === 'mapping' ? 'bg-teal-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Matriz de Mapeo Parámetro Machine ↔ LIS</span>
        </button>

        <button
          onClick={() => setActiveSubTab('bidirectional')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-xs font-bold transition ${
            activeSubTab === 'bidirectional' ? 'bg-teal-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ArrowRightLeft className="w-4 h-4" />
          <span>Simulador Host Query Bidireccional</span>
        </button>

        <button
          onClick={() => setActiveSubTab('checksum')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-xs font-bold transition ${
            activeSubTab === 'checksum' ? 'bg-teal-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Code2 className="w-4 h-4" />
          <span>Calculadora de Checksum ASTM (Mod 256)</span>
        </button>
      </div>

      {/* TAB 1: PARAMETER MAPPING MATRIX */}
      {activeSubTab === 'mapping' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Tabla de Mapeo de Códigos ({selectedAnalyzer.name})
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Traduce los identificadores del analizador físico a las pruebas del Catálogo LIS del Laboratorio San José.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="Cód. Analizador (ej. ALT_3)"
                value={newAnalyzerCode}
                onChange={(e) => setNewAnalyzerCode(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-mono"
              />
              <input
                type="text"
                placeholder="Parámetro LIS"
                value={newLisParam}
                onChange={(e) => setNewLisParam(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs"
              />
              <button
                onClick={handleAddMapping}
                className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition"
              >
                + Mapear
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-3">Código Analizador Machine</th>
                  <th className="p-3">Parámetro Mapeado en LIS</th>
                  <th className="p-3">Unidades</th>
                  <th className="p-3">Factor Multiplicador</th>
                  <th className="p-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {mappings.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold text-teal-700">{m.analyzerCode}</td>
                    <td className="p-3 text-slate-900">{m.lisParameter}</td>
                    <td className="p-3 text-slate-600">{m.unit}</td>
                    <td className="p-3 font-mono">{m.multiplier.toFixed(2)}</td>
                    <td className="p-3">
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {m.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: HOST QUERY BIDIRECTIONAL SIMULATION */}
      {activeSubTab === 'bidirectional' && (
        <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-teal-400 text-sm flex items-center space-x-2">
                <ArrowRightLeft className="w-5 h-5" />
                <span>Simulador de Intercambio Bidireccional Host-Query (ASTM E1394)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                El analizador lee el código de barras del tubo y consulta al LIS sobre los exámenes pendientes sin intervención manual.
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="text"
                value={queryBarcode}
                onChange={(e) => setQueryBarcode(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-teal-300 font-mono text-xs px-3 py-2 rounded-xl"
                placeholder="Código de Barras Tubo"
              />
              <button
                onClick={handleRunHostQuery}
                disabled={isSimulatingHostQuery}
                className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition flex items-center space-x-2 shadow"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>{isSimulatingHostQuery ? 'Simulando Protocolo...' : 'Iniciar Host Query'}</span>
              </button>
            </div>
          </div>

          {/* Terminal Console */}
          <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl font-mono text-xs space-y-2 h-80 overflow-y-auto">
            {hostQueryLogs.length === 0 ? (
              <div className="text-slate-600 italic">
                Presione "Iniciar Host Query" para ver el handshake socket TCP/Serial paso a paso entre el {selectedAnalyzer.name} y el LIS-Core.
              </div>
            ) : (
              hostQueryLogs.map((log, idx) => (
                <div
                  key={idx}
                  className={log.includes('LIS-CORE') ? 'text-teal-300' : 'text-emerald-400'}
                >
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: ASTM CHECKSUM CALCULATOR */}
      {activeSubTab === 'checksum' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
          <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
            <Code2 className="w-5 h-5 text-teal-600" />
            <span>Calculadora de Suma de Verificación ASTM (Modulo 256 Checksum)</span>
          </h3>

          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-700 block">
              Payload ASCII del Registro ASTM (Entre &lt;STX&gt; y &lt;ETX&gt;):
            </label>
            <textarea
              value={testPayload}
              onChange={(e) => setTestPayload(e.target.value)}
              rows={3}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 font-mono text-xs focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="bg-slate-900 text-white p-5 rounded-xl space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Checksum Calculado (Hexadecimal):</span>
              <span className="font-mono text-2xl font-black text-teal-400">
                {calculateAstmChecksum(testPayload)}
              </span>
            </div>

            <div className="text-[11px] text-slate-400 border-t border-slate-800 pt-3">
              Fórmula ASTM E1381: Modulo 256 de la suma de los valores decimales ASCII de todos los caracteres desde STX (excluido) hasta ETX (incluido), formateado en 2 caracteres hexadecimales en mayúsculas.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
