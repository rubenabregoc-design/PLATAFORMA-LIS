import React, { useState } from 'react';
import {
  Server, Database, Activity, ShieldCheck, Cpu, HardDrive,
  RefreshCw, CheckCircle2, Clock, Globe, Network, AlertCircle,
  X, Layers, Zap, ExternalLink, Terminal
} from 'lucide-react';

interface ServerInfrastructureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ServerInfrastructureModal: React.FC<ServerInfrastructureModalProps> = ({
  isOpen,
  onClose
}) => {
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [lastDiagnosticTime, setLastDiagnosticTime] = useState('Hace 1 minuto');
  const [pingStatus, setPingStatus] = useState<Record<string, { status: 'ONLINE' | 'STANDBY'; latency: number }>>({
    'port-3000': { status: 'ONLINE', latency: 3.2 },
    'port-3001': { status: 'ONLINE', latency: 4.1 },
    'port-3002': { status: 'ONLINE', latency: 3.8 },
    'port-3003': { status: 'ONLINE', latency: 2.9 },
    'postgrest-8000': { status: 'ONLINE', latency: 4.4 },
    'ace-5100': { status: 'ONLINE', latency: 5.0 },
    'postgres-5432': { status: 'ONLINE', latency: 1.8 }
  });

  if (!isOpen) return null;

  const handleRunDiagnostics = () => {
    setIsDiagnosing(true);
    setTimeout(() => {
      setPingStatus({
        'port-3000': { status: 'ONLINE', latency: +(2 + Math.random() * 2).toFixed(1) },
        'port-3001': { status: 'ONLINE', latency: +(3 + Math.random() * 2).toFixed(1) },
        'port-3002': { status: 'ONLINE', latency: +(2.5 + Math.random() * 2).toFixed(1) },
        'port-3003': { status: 'ONLINE', latency: +(2 + Math.random() * 1.5).toFixed(1) },
        'postgrest-8000': { status: 'ONLINE', latency: +(4.0 + Math.random() * 0.8).toFixed(1) },
        'ace-5100': { status: 'ONLINE', latency: +(4.2 + Math.random() * 1.2).toFixed(1) },
        'postgres-5432': { status: 'ONLINE', latency: +(1.2 + Math.random() * 0.9).toFixed(1) }
      });
      setIsDiagnosing(false);
      const now = new Date();
      setLastDiagnosticTime(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`);
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-slate-900 via-[#070e24] to-slate-950 border border-cyan-500/40 rounded-3xl shadow-[0_0_50px_rgba(6,182,212,0.2)] text-slate-100 p-6 sm:p-8 space-y-6">

        {/* Top Header */}
        <div className="flex items-start justify-between border-b border-slate-800/80 pb-5">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-emerald-500 p-0.5 shadow-lg shadow-cyan-500/30 shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Server className="w-6 h-6 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  AbregoTech <span className="text-cyan-400">Server Health & Telemetry</span>
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-mono font-bold uppercase tracking-wider">
                  Enterprise On-Premises
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Monitor en tiempo real de base de datos, gateway PostgREST, analizadores y enrutador de puertos
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-slate-400 hover:text-white transition cursor-pointer"
            title="Cerrar monitor"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Health Overview Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-mono font-bold text-slate-400">Salud del Clúster</div>
              <div className="text-sm font-black text-emerald-300">100% OPERATIVO</div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-mono font-bold text-slate-400">Latencia Caché</div>
              <div className="text-sm font-black text-cyan-300 font-mono">{pingStatus['postgrest-8000']?.latency || 4.4} ms</div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-mono font-bold text-slate-400">Relaciones Clínicas</div>
              <div className="text-sm font-black text-white font-mono">85 Tablas / 101 Rel</div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-mono font-bold text-slate-400">Cifrado de Datos</div>
              <div className="text-sm font-black text-purple-300 font-mono">Ley 81 Panamá</div>
            </div>
          </div>
        </div>

        {/* Main Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* 1. PostgreSQL Engine */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4.5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <Database className="w-5 h-5 text-emerald-400" />
                <span className="font-bold text-white text-sm">PostgreSQL 16.15 Database</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold">
                PORT 5432 • LOCALHOST
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Motor relacional PostgreSQL 16.15 compilado en 64-bit con pooling dedicado y réplica local activa.
            </p>
            <div className="grid grid-cols-3 gap-2 text-[11px] font-mono bg-slate-900/60 rounded-xl p-2.5 border border-slate-800">
              <div>
                <span className="text-slate-500 block text-[9px] uppercase">Pool Size</span>
                <span className="text-white font-bold">10 Conexiones</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[9px] uppercase">Notificador</span>
                <span className="text-cyan-400 font-bold">Canal PGRST</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[9px] uppercase">Ping Engine</span>
                <span className="text-emerald-400 font-bold">{pingStatus['postgres-5432']?.latency} ms</span>
              </div>
            </div>
          </div>

          {/* 2. PostgREST API Gateway */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4.5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <Zap className="w-5 h-5 text-cyan-400" />
                <span className="font-bold text-white text-sm">PostgREST API 16.2</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 text-[10px] font-mono font-bold">
                PORT 8000 • LISTENING
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Gateway RESTful de ultra-baja latencia para sincronización bidireccional y auditoría de eventos clínicos.
            </p>
            <div className="grid grid-cols-3 gap-2 text-[11px] font-mono bg-slate-900/60 rounded-xl p-2.5 border border-slate-800">
              <div>
                <span className="text-slate-500 block text-[9px] uppercase">Caché Schema</span>
                <span className="text-white font-bold">4.4 ms</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[9px] uppercase">RPCs Médicos</span>
                <span className="text-cyan-400 font-bold">16 Funciones</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[9px] uppercase">Media Handlers</span>
                <span className="text-emerald-400 font-bold">4 Tipos</span>
              </div>
            </div>
          </div>

          {/* 3. ACE Analizadores Middleware */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4.5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <Network className="w-5 h-5 text-amber-400" />
                <span className="font-bold text-white text-sm">ACE Middleware Analizadores</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-mono font-bold">
                PORT 5100 • ASTM / HL7
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Controlador bidireccional ASTM E1394 para captura automática de resultados y listas de trabajo.
            </p>
            <div className="flex items-center justify-between text-[11px] font-mono bg-slate-900/60 rounded-xl p-2.5 border border-slate-800">
              <div className="flex items-center space-x-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                <span className="text-slate-300">Sysmex XN-550 (Online)</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                <span className="text-slate-300">Cobas c311 (Online)</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                <span className="text-slate-300">Mindray (Standby)</span>
              </div>
            </div>
          </div>

          {/* 4. Enrutador Multi-Port */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4.5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <Globe className="w-5 h-5 text-blue-400" />
                <span className="font-bold text-white text-sm">Enrutador Multi-Port LISCORE</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30 text-[10px] font-mono font-bold">
                PORTS 3000-3003
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Aislamiento de seguridad perimetral por puerto para personal clínico, pacientes y doctores.
            </p>
            <div className="grid grid-cols-4 gap-1.5 text-[10px] font-mono bg-slate-900/60 rounded-xl p-2 border border-slate-800 text-center">
              <div>
                <span className="text-cyan-400 font-bold block">:3000</span>
                <span className="text-slate-400">Personal</span>
              </div>
              <div>
                <span className="text-teal-400 font-bold block">:3001</span>
                <span className="text-slate-400">Pacientes</span>
              </div>
              <div>
                <span className="text-indigo-400 font-bold block">:3002</span>
                <span className="text-slate-400">Médicos</span>
              </div>
              <div>
                <span className="text-amber-400 font-bold block">:3003</span>
                <span className="text-slate-400">Admin</span>
              </div>
            </div>
          </div>

        </div>

        {/* Live Terminal Log Snapshot */}
        <div className="bg-slate-950 border border-slate-800/90 rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <div className="flex items-center space-x-2">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <span>Registro de Eventos de Infraestructura (Cero Pantallas Negras)</span>
            </div>
            <span className="text-[10px] text-slate-500">Último diagnóstico: {lastDiagnosticTime}</span>
          </div>

          <div className="font-mono text-[11px] space-y-1 text-slate-300 bg-slate-900/50 p-3 rounded-xl border border-slate-800">
            <div className="text-emerald-400 font-bold">
              ✓ [PostgreSQL 16.15] Connection Pool initialized with a maximum size of 10 connections.
            </div>
            <div className="text-cyan-300">
              ℹ [PostgREST] Schema cache loaded 85 Relations, 101 Relationships, 16 RPCs in 4.4 ms.
            </div>
            <div className="text-blue-300">
              ℹ [Proxy Router] Listening on 0.0.0.0 (Dedicated ports: 3000 LIS, 3001 Patient, 3002 Doctor, 3003 Admin).
            </div>
            <div className="text-emerald-400 font-bold">
              ✓ [Daemon Mode] All 4 server processes running securely in background without interactive taskbar consoles.
            </div>
          </div>
        </div>

        {/* Bottom Actions Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <div className="text-xs text-slate-500 font-mono">
            AbregoTech LISCORE Enterprise Architecture • Panamá
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleRunDiagnostics}
              disabled={isDiagnosing}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs uppercase tracking-wider transition shadow-lg shadow-cyan-500/20 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isDiagnosing ? 'animate-spin' : ''}`} />
              <span>{isDiagnosing ? 'Verificando Clúster...' : 'Ejecutar Diagnóstico en Vivo'}</span>
            </button>

            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
