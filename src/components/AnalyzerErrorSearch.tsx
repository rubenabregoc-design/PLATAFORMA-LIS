import React, { useState } from 'react';
import { Search, AlertTriangle, ChevronRight, BookOpen, ExternalLink, Activity, Terminal, ShieldAlert, Cpu, Wrench, FileCode, Zap } from 'lucide-react';

interface ErrorEntry {
    code: string;
    equip: string;
    system: 'HARDWARE' | 'FLUIDICA' | 'OPTICA' | 'COMUNICACION' | 'SOFTWARE';
    severity: 'CRITICA' | 'MODERADA' | 'MENOR';
    title: string;
    solution: string;
    downtime: string;
    technicalTrace?: string;
}

export const AnalyzerErrorSearch: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [query, setSearchQuery] = useState('');
  const [selectedError, setSelectedError] = useState<ErrorEntry | null>(null);

  const errors: ErrorEntry[] = [
    { 
        code: 'ERR-1002', 
        equip: 'Sysmex XN', 
        system: 'FLUIDICA',
        severity: 'CRITICA',
        title: 'Vacuum Pressure Error (Chamber B)', 
        solution: '1. Apagar equipo. 2. Purgar cámara de vacío. 3. Limpiar el puerto de vacío trasero. 4. Reiniciar el compresor y ejecutar Auto-Wash.',
        downtime: '15-20 min',
        technicalTrace: '[SENSOR_V02] Presión registrada: -0.02MPa (Esperada: -0.05MPa)'
    },
    { 
        code: 'VIT-92', 
        equip: 'Ortho Vitros', 
        system: 'HARDWARE',
        severity: 'CRITICA',
        title: 'MicroSlide Incubator Jam', 
        solution: '1. Interrumpir corrida. 2. Abrir compuerta lateral térmica. 3. Retirar manualmente el slide atascado en el anillo incubador. 4. Resetear brazo robótico (Axis Z).',
        downtime: '10 min',
        technicalTrace: '[AXIS_Z_SERVO] Torque excesivo detectado en motor paso a paso (0x4A).'
    },
    { 
        code: 'MIN-005', 
        equip: 'Mindray BS/BC', 
        system: 'OPTICA',
        severity: 'MODERADA',
        title: 'Halogen Lamp Low Signal', 
        solution: '1. Revisar curva de calibración del fotómetro. 2. Vida útil de lámpara halógena al 5%. Solicitar reemplazo físico al departamento de biomédica. 3. Correr blanco de agua.',
        downtime: 'Preventivo',
        technicalTrace: '[PHOTO_ARRAY] Señal en 340nm < 20.000 unidades AD.'
    },
    { 
        code: 'ACE-TCP-TIMEOUT', 
        equip: 'Generic TCP/IP', 
        system: 'COMUNICACION',
        severity: 'MODERADA',
        title: 'Socket E1381 Timeout (NAK)', 
        solution: '1. Verificar ping de red hacia la IP del analizador. 2. Confirmar que el puerto 5100 está en LISTENING. 3. Reiniciar el Daemon ACE Local. 4. Validar colisión de puertos en el Host.',
        downtime: '2-5 min',
        technicalTrace: '[SOCKET_ERR] ETIMEDOUT 192.168.10.12:5100 (Host did not respond to ENQ within 15000ms)'
    },
    { 
        code: 'HL7-OBX-ERR', 
        equip: 'HL7 Integrations', 
        system: 'SOFTWARE',
        severity: 'MENOR',
        title: 'Malformed OBX Segment', 
        solution: '1. Abrir ACE Driver Studio. 2. Verificar que los delimitadores de componente (^) coincidan con el LIS. 3. El mapeo "TestCode" no existe en el catálogo principal.',
        downtime: '0 min (Soft Error)',
        technicalTrace: '[PARSER_ERR] Missing required field OBX-3 (Observation Identifier) at line 4.'
    }
  ];

  const filtered = errors.filter(e => 
      e.code.toLowerCase().includes(query.toLowerCase()) || 
      e.title.toLowerCase().includes(query.toLowerCase()) ||
      e.equip.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-xl z-[150] flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] w-full max-w-5xl overflow-hidden shadow-2xl flex flex-col md:flex-row h-[85vh]">
        
        {/* LEFT PANEL: Search & List */}
        <div className="w-full md:w-5/12 bg-slate-950/50 flex flex-col border-r border-slate-800">
            <div className="p-6 md:p-8 border-b border-slate-800 bg-slate-900">
               <div className="flex items-center space-x-4 mb-6">
                  <div className="w-12 h-12 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400 shadow-lg">
                     <BookOpen className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                     <h2 className="text-xl font-black text-white uppercase tracking-tight">Base de Errores</h2>
                     <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">ACE Hardware Diagnostics KB</p>
                  </div>
               </div>

               <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Buscar código o modelo..."
                    value={query}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-xs font-mono text-white focus:border-indigo-500 outline-none transition"
                  />
               </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
               {filtered.map(err => (
                 <div 
                    key={err.code} 
                    onClick={() => setSelectedError(err)}
                    className={`p-4 border rounded-2xl cursor-pointer transition-all ${selectedError?.code === err.code ? 'bg-indigo-500/10 border-indigo-500/40' : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`}
                 >
                    <div className="flex items-center justify-between mb-2">
                       <span className={`text-[10px] font-mono font-black px-2 py-0.5 rounded border ${
                           err.severity === 'CRITICA' ? 'text-rose-400 bg-rose-500/10 border-rose-500/20' :
                           err.severity === 'MODERADA' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' :
                           'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                       }`}>{err.code}</span>
                       <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{err.equip}</span>
                    </div>
                    <h3 className="text-white font-bold text-xs tracking-tight line-clamp-1">{err.title}</h3>
                 </div>
               ))}
               {filtered.length === 0 && (
                   <div className="text-center p-8 text-slate-500 text-xs">
                       No se encontraron códigos de error.
                   </div>
               )}
            </div>
        </div>

        {/* RIGHT PANEL: Details */}
        <div className="w-full md:w-7/12 flex flex-col relative bg-slate-900">
            <button onClick={onClose} className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-full transition z-10"><XCircle className="w-5 h-5" /></button>
            
            {selectedError ? (
                <div className="p-8 flex-1 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-right-4">
                    <div className="flex items-center gap-2 text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4">
                        <Wrench className="w-4 h-4" /> Resolución Técnica
                    </div>
                    
                    <h2 className="text-2xl font-black text-white leading-tight mb-2">{selectedError.title}</h2>
                    <p className="text-sm font-mono text-slate-400 mb-8">{selectedError.equip} — Código <span className="text-rose-400">{selectedError.code}</span></p>

                    <div className="grid grid-cols-3 gap-4 mb-8">
                        <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl flex flex-col gap-1">
                            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Subsistema</span>
                            <div className="flex items-center gap-1.5 text-xs font-black text-white"><Cpu className="w-3.5 h-3.5 text-teal-400"/> {selectedError.system}</div>
                        </div>
                        <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl flex flex-col gap-1">
                            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Severidad</span>
                            <div className={`flex items-center gap-1.5 text-xs font-black ${selectedError.severity === 'CRITICA' ? 'text-rose-400' : selectedError.severity === 'MODERADA' ? 'text-amber-400' : 'text-emerald-400'}`}><ShieldAlert className="w-3.5 h-3.5"/> {selectedError.severity}</div>
                        </div>
                        <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl flex flex-col gap-1">
                            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Downtime Est.</span>
                            <div className="flex items-center gap-1.5 text-xs font-black text-indigo-400"><Activity className="w-3.5 h-3.5"/> {selectedError.downtime}</div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-3">
                            <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><FileCode className="w-4 h-4 text-slate-400" /> Procedimiento Operativo Estándar (SOP)</h4>
                            <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-2xl p-5 text-sm text-indigo-100 leading-relaxed">
                                {selectedError.solution.split('. ').map((step, i) => (
                                    <div key={i} className="mb-2 last:mb-0 flex items-start gap-2">
                                        <span className="text-indigo-500 font-bold">{i + 1}.</span>
                                        <span>{step.replace(/^\d+\.\s*/, '')}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {selectedError.technicalTrace && (
                            <div className="space-y-3">
                                <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Terminal className="w-4 h-4 text-slate-400" /> Telemetría ACE Capturada</h4>
                                <pre className="bg-slate-950 border border-slate-800 rounded-2xl p-5 text-[11px] font-mono text-emerald-400 overflow-x-auto">
                                    {selectedError.technicalTrace}
                                </pre>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500">
                    <Zap className="w-16 h-16 text-slate-800 mb-4" />
                    <h3 className="text-lg font-bold text-slate-400">ACE Hardware Diagnostics</h3>
                    <p className="text-xs mt-2 max-w-xs">Selecciona un código de error de la lista para ver el Procedimiento Operativo Estándar (SOP) y la telemetría asociada.</p>
                </div>
            )}

            <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-between items-center text-[9px] font-bold uppercase tracking-widest">
               <span className="text-slate-600">Sincronizado con bases de datos OEM (AbregoTech Cloud)</span>
               <span className="text-indigo-500 flex items-center gap-1 cursor-pointer hover:text-indigo-400 transition">Solicitar Soporte Remoto <ExternalLink className="w-3 h-3" /></span>
            </div>
        </div>
      </div>
    </div>
  );
};
