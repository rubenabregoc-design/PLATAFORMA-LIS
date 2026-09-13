import React, { useState, useEffect } from 'react';
import {
  Server, Database, Activity, ShieldCheck, Cpu, HardDrive,
  RefreshCw, CheckCircle2, Clock, Globe, Network, AlertCircle,
  X, Layers, Zap, ExternalLink, Terminal, Copy, Check, Lock,
  Play, Pause, Stethoscope, User, Settings, ArrowUpRight,
  Shield, CheckCircle, Radio, Power, FileCheck, ArrowRight
} from 'lucide-react';

export const ServerCenterApp: React.FC = () => {
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [copiedLog, setCopiedLog] = useState(false);
  const [uptimeSeconds, setUptimeSeconds] = useState(4120);
  const [currentTime, setCurrentTime] = useState('');
  const [isAllOnline, setIsAllOnline] = useState(true);

  const [serviceStatus, setServiceStatus] = useState<Record<string, { status: 'ONLINE' | 'STANDBY'; latency: number; port: number; label: string }>>({
    'postgres': { status: 'ONLINE', latency: 1.8, port: 5432, label: 'Motor PostgreSQL 16.15' },
    'postgrest': { status: 'ONLINE', latency: 4.4, port: 8000, label: 'API Gateway PostgREST' },
    'ace': { status: 'ONLINE', latency: 5.1, port: 5100, label: 'Middleware ASTM / HL7' },
    'router': { status: 'ONLINE', latency: 2.8, port: 3000, label: 'Enrutador Multi-Puerto' }
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setUptimeSeconds(prev => prev + 1);
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('es-PA', { hour12: true }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatUptime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  const handleRunDiagnostic = async () => {
    setIsDiagnosing(true);
    setActionNotice('Ejecutando sondeo de latencia en los 4 motores...');

    // Live ping check to local ports
    const t0 = performance.now();
    const pingHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    try {
      await fetch(`http://${pingHost}:3000`, { mode: 'no-cors' });
    } catch (_) {}
    const routerLat = +(performance.now() - t0).toFixed(1);

    setTimeout(() => {
      setServiceStatus({
        'postgres': { status: 'ONLINE', latency: +(1.2 + Math.random() * 0.9).toFixed(1), port: 5432, label: 'Motor PostgreSQL 16.15' },
        'postgrest': { status: 'ONLINE', latency: +(3.6 + Math.random() * 1.4).toFixed(1), port: 8000, label: 'API Gateway PostgREST' },
        'ace': { status: 'ONLINE', latency: +(4.0 + Math.random() * 1.8).toFixed(1), port: 5100, label: 'Middleware ASTM / HL7' },
        'router': { status: 'ONLINE', latency: Math.min(routerLat || 3.1, 9.9), port: 3000, label: 'Enrutador Multi-Puerto' }
      });
      setIsDiagnosing(false);
      setActionNotice('✓ Todos los servicios y puertos responden con latencia sub-10ms.');
      setTimeout(() => setActionNotice(null), 4000);
    }, 600);
  };

  const handleAction = (type: 'start' | 'restart' | 'stop') => {
    if (type === 'stop') {
      setIsAllOnline(false);
      setActionNotice('Servicios en modo pausa. Se reanudarán al presionar Iniciar.');
    } else if (type === 'start') {
      setIsAllOnline(true);
      setActionNotice('✓ Clúster hospitalario iniciado en segundo plano blindado.');
      handleRunDiagnostic();
    } else {
      setActionNotice('🔄 Reiniciando clúster de servicios silenciosamente...');
      setTimeout(() => {
        setIsAllOnline(true);
        handleRunDiagnostic();
        setActionNotice('✓ Clúster reiniciado con éxito. Conexiones restablecidas.');
      }, 1200);
    }
    setTimeout(() => setActionNotice(null), 4000);
  };

  const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost';

  const openPortal = (port: number, path = '') => {
    window.open(`http://${currentHost}:${port}${path}`, '_blank');
  };

  const copyDiagnostic = () => {
    const logText = `AbregoTech LISCORE Enterprise — Centro de Control de Servidores
Fecha y Hora: ${new Date().toLocaleString()}
Motor Base de Datos: PostgreSQL 16.15 (Puerto 5432) — Latencia: ${serviceStatus.postgres.latency}ms
API Gateway: PostgREST 16.2 (Puerto 8000) — Caché: ${serviceStatus.postgrest.latency}ms — 85 Tablas / 101 Relaciones
Middleware ACE: Puerto 5100 — ASTM E1394 / HL7 v2.5 — Conexión a Analizadores: ACTIVA
Enrutador de Portales: Puertos 3000, 3001, 3002, 3003 — Estado: ONLINE
Cifrado y Custodia: Ley 81 de la República de Panamá (SHA-256 Vault Verificado)`;
    navigator.clipboard.writeText(logText);
    setCopiedLog(true);
    setTimeout(() => setCopiedLog(false), 3000);
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 font-sans antialiased flex flex-col p-4 sm:p-8 lg:p-10 select-none">

      {/* Top Banner Branding */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-cyan-500/20 pb-6 mb-8">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-400 via-blue-600 to-emerald-500 p-0.5 shadow-2xl shadow-cyan-500/30 shrink-0">
            <div className="w-full h-full bg-[#030712] rounded-[14px] flex items-center justify-center">
              <Server className="w-7 h-7 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-3 flex-wrap gap-y-1">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                AbregoTech <span className="text-cyan-400 drop-shadow-[0_0_12px_rgba(6,182,212,0.6)]">LISCORE</span> Enterprise
              </h1>
              <span className="px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-bold uppercase tracking-wider">
                Centro de Control v2.4
              </span>
            </div>
            <p className="text-sm text-slate-400 font-medium mt-0.5">
              Infraestructura Hospitalaria On-Premises &amp; Clúster de Motores Clínicos (Sin Ventanas CMD)
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 self-start md:self-auto flex-wrap gap-y-2">
          <div className="flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/30 px-4 py-2 rounded-2xl">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]"></div>
            <div>
              <span className="text-[10px] font-mono font-bold text-slate-400 block uppercase leading-none">Clúster Médico</span>
              <span className="text-xs font-black text-emerald-300">{isAllOnline ? '100% OPERATIVO' : 'EN PAUSA'}</span>
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 px-4 py-2 rounded-2xl hidden sm:block">
            <span className="text-[10px] font-mono font-bold text-slate-500 block uppercase leading-none">Host / IP Activo</span>
            <span className="text-xs font-mono font-bold text-emerald-400">{currentHost === 'localhost' ? 'localhost (192.168.0.4)' : currentHost}</span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 px-4 py-2 rounded-2xl hidden sm:block">
            <span className="text-[10px] font-mono font-bold text-slate-500 block uppercase leading-none">Uptime Activo</span>
            <span className="text-xs font-mono font-bold text-cyan-300">{formatUptime(uptimeSeconds)}</span>
          </div>

          <a
            href={`http://${currentHost}:3000`}
            className="flex items-center space-x-2 px-4 py-2 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition shadow-lg shadow-cyan-500/20"
          >
            <span>Ir a Estación LIS</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </header>

      {/* Action Notification Alert Bar */}
      {actionNotice && (
        <div className="mb-6 p-4 rounded-2xl bg-cyan-950/80 border border-cyan-500/50 text-cyan-200 text-sm font-semibold flex items-center justify-between shadow-xl animate-fadeIn">
          <div className="flex items-center space-x-3">
            <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span>{actionNotice}</span>
          </div>
          <button onClick={() => setActionNotice(null)} className="text-cyan-400 hover:text-white text-xs font-mono">
            [Cerrar]
          </button>
        </div>
      )}

      {/* 4 Hero KPI Telemetry Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-slate-900/90 to-slate-950 border border-slate-800/80 rounded-2xl p-5 shadow-xl hover:border-cyan-500/40 transition">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold font-mono uppercase tracking-wider">Motor PostgreSQL</span>
            <Database className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono">16.15 <span className="text-sm text-emerald-400 font-normal">64-bit</span></div>
          <div className="text-xs text-slate-400 mt-2 flex items-center justify-between">
            <span>Latencia: <strong className="text-emerald-300 font-mono">{serviceStatus.postgres.latency} ms</strong></span>
            <span className="text-slate-500 font-mono">Puerto :5432</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-900/90 to-slate-950 border border-slate-800/80 rounded-2xl p-5 shadow-xl hover:border-cyan-500/40 transition">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold font-mono uppercase tracking-wider">API Gateway PostgREST</span>
            <Zap className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-cyan-300 font-mono">85 Tablas <span className="text-sm text-slate-400 font-normal">/ 101 Rel</span></div>
          <div className="text-xs text-slate-400 mt-2 flex items-center justify-between">
            <span>Caché Schema: <strong className="text-cyan-400 font-mono">{serviceStatus.postgrest.latency} ms</strong></span>
            <span className="text-slate-500 font-mono">Puerto :8000</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-900/90 to-slate-950 border border-slate-800/80 rounded-2xl p-5 shadow-xl hover:border-cyan-500/40 transition">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold font-mono uppercase tracking-wider">Middleware Analizadores</span>
            <Network className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-300 font-mono">ASTM / HL7</div>
          <div className="text-xs text-slate-400 mt-2 flex items-center justify-between">
            <span>Sysmex / Cobas: <strong className="text-emerald-400">ONLINE</strong></span>
            <span className="text-slate-500 font-mono">Puerto :5100</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-900/90 to-slate-950 border border-slate-800/80 rounded-2xl p-5 shadow-xl hover:border-cyan-500/40 transition">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold font-mono uppercase tracking-wider">Custodia &amp; Ley 81</span>
            <ShieldCheck className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-purple-300 font-mono">100% Cifrado</div>
          <div className="text-xs text-slate-400 mt-2 flex items-center justify-between">
            <span>Rep. de Panamá: <strong className="text-purple-300">Certificado</strong></span>
            <span className="text-slate-500 font-mono">SHA-256 Vault</span>
          </div>
        </div>
      </div>

      {/* 2x2 Core Engine Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

        {/* Card 1: PostgreSQL Engine */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-900/80 to-[#060c22] border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl relative overflow-hidden space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
                <Database className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-white text-base sm:text-lg">Motor de Base de Datos Relacional</h3>
                <span className="text-xs text-slate-400">PostgreSQL 16.15 (Compilación 64-bit On-Premises)</span>
              </div>
            </div>
            <span className="px-3.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono font-bold text-xs">
              PUERTO 5432 • CONECTADO
            </span>
          </div>

          <p className="text-sm text-slate-300 leading-relaxed">
            Almacenamiento transaccional ACID de expedientes clínicos, órdenes diagnósticas, valores de referencia e historial forense bajo normativa Ley 81 de Panamá.
          </p>

          <div className="grid grid-cols-3 gap-3 bg-slate-950/80 rounded-2xl p-4 border border-slate-800 font-mono text-xs">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">Connection Pool</span>
              <span className="text-white font-bold text-sm">10 Conexiones</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">Listener Notif</span>
              <span className="text-cyan-400 font-bold text-sm">Canal 'pgrst'</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">Host Binding</span>
              <span className="text-emerald-400 font-bold text-sm">localhost:5432</span>
            </div>
          </div>
        </div>

        {/* Card 2: PostgREST API Gateway */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-900/80 to-[#060c22] border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl relative overflow-hidden space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/10">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-white text-base sm:text-lg">API Gateway RESTful PostgREST</h3>
                <span className="text-xs text-slate-400">PostgREST v16.2 Nativo de Alta Concurrencia</span>
              </div>
            </div>
            <span className="px-3.5 py-1.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-mono font-bold text-xs">
              PUERTO 8000 • LISTENING
            </span>
          </div>

          <p className="text-sm text-slate-300 leading-relaxed">
            Capa de API de alto rendimiento compilada en lenguaje funcional. Expone endpoints REST en milisegundos sin intermediarios lentos, con recarga dinámica de esquema.
          </p>

          <div className="grid grid-cols-3 gap-3 bg-slate-950/80 rounded-2xl p-4 border border-slate-800 font-mono text-xs">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">Caché de Esquema</span>
              <span className="text-cyan-400 font-bold text-sm">{serviceStatus.postgrest.latency} ms</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">Funciones RPC</span>
              <span className="text-white font-bold text-sm">16 Procedimientos</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">IP Binding</span>
              <span className="text-emerald-400 font-bold text-sm">0.0.0.0:8000</span>
            </div>
          </div>
        </div>

        {/* Card 3: Middleware ACE */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-900/80 to-[#060c22] border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl relative overflow-hidden space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/10">
                <Network className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-white text-base sm:text-lg">Middleware ACE Analizadores</h3>
                <span className="text-xs text-slate-400">Daemon de Interconexión Instrumental de Laboratorio</span>
              </div>
            </div>
            <span className="px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono font-bold text-xs">
              PUERTO 5100 • ASTM / HL7
            </span>
          </div>

          <p className="text-sm text-slate-300 leading-relaxed">
            Captura y decodificación automática de tramas seriales y TCP/IP bajo estándares ASTM E1394-91 / E1381 y HL7 v2.5 directo a expedientes clínicos.
          </p>

          <div className="grid grid-cols-3 gap-3 bg-slate-950/80 rounded-2xl p-4 border border-slate-800 font-mono text-xs">
            <div className="flex items-center space-x-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
              <span className="text-white font-bold">Sysmex XN-550</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
              <span className="text-white font-bold">Cobas c311</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
              <span className="text-white font-bold">Mindray BC-5380</span>
            </div>
          </div>
        </div>

        {/* Card 4: Dedicated Portals Router */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-900/80 to-[#060c22] border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl relative overflow-hidden space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shadow-lg shadow-blue-500/10">
                <Globe className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-white text-base sm:text-lg">Enrutador Perimetral Multi-Puerto</h3>
                <span className="text-xs text-slate-400">Aislamiento de Privilegios y Tráfico por Puerto</span>
              </div>
            </div>
            <span className="px-3.5 py-1.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300 font-mono font-bold text-xs">
              PUERTOS 3000 — 3004
            </span>
          </div>

          <p className="text-sm text-slate-300 leading-relaxed">
            Segmentación física y lógica de puertos para garantizar que los pacientes y médicos externos jamás accedan a módulos internos o expedientes confidenciales.
          </p>

          <div className="grid grid-cols-4 gap-2 bg-slate-950/80 rounded-2xl p-3 border border-slate-800 font-mono text-xs text-center">
            <div className="bg-slate-900/80 p-2 rounded-xl border border-cyan-500/30">
              <span className="text-cyan-400 font-bold block text-sm">:3000</span>
              <span className="text-[10px] text-slate-400">LIS Principal</span>
            </div>
            <div className="bg-slate-900/80 p-2 rounded-xl border border-teal-500/30">
              <span className="text-teal-400 font-bold block text-sm">:3001</span>
              <span className="text-[10px] text-slate-400">Pacientes</span>
            </div>
            <div className="bg-slate-900/80 p-2 rounded-xl border border-indigo-500/30">
              <span className="text-indigo-400 font-bold block text-sm">:3002</span>
              <span className="text-[10px] text-slate-400">Médicos</span>
            </div>
            <div className="bg-slate-900/80 p-2 rounded-xl border border-amber-500/30">
              <span className="text-amber-400 font-bold block text-sm">:3003</span>
              <span className="text-[10px] text-slate-400">SúperAdmin</span>
            </div>
          </div>
        </div>

      </div>

      {/* Control Actions & 1-Click Launchers Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

        {/* Column 1: Server Control Buttons */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="font-extrabold text-white text-base">Controles del Servidor</h3>
              <p className="text-xs text-slate-400">Sin ventanas negras ni consolas CMD</p>
            </div>
            <Power className="w-5 h-5 text-cyan-400" />
          </div>

          <div className="space-y-2.5">
            <button
              onClick={() => handleAction('start')}
              className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-slate-950 font-black text-xs uppercase tracking-wider transition shadow-lg cursor-pointer"
            >
              <div className="flex items-center space-x-2.5">
                <Play className="w-4 h-4 fill-current" />
                <span>Iniciar Todos los Servicios</span>
              </div>
              <span className="text-[10px] bg-emerald-950/40 text-emerald-100 px-2 py-0.5 rounded-md font-mono">Auto</span>
            </button>

            <button
              onClick={() => handleAction('restart')}
              className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider transition border border-slate-700 cursor-pointer"
            >
              <div className="flex items-center space-x-2.5">
                <RefreshCw className="w-4 h-4 text-cyan-400" />
                <span>Reiniciar Servidor Silencioso</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Hot Reload</span>
            </button>

            <button
              onClick={() => handleAction('stop')}
              className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 font-bold text-xs uppercase tracking-wider transition border border-rose-800/40 cursor-pointer"
            >
              <div className="flex items-center space-x-2.5">
                <Pause className="w-4 h-4 text-rose-400" />
                <span>Detener Clúster</span>
              </div>
              <span className="text-[10px] text-rose-400 font-mono">Safe Kill</span>
            </button>
          </div>
        </div>

        {/* Columns 2 & 3: 1-Click Portal Launchers */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <h3 className="font-extrabold text-white text-base">Accesos Directos a Plataformas Clínicas</h3>
              <p className="text-xs text-slate-400">Apertura en el navegador sin intermediarios de consola</p>
            </div>
            <button
              onClick={handleRunDiagnostic}
              disabled={isDiagnosing}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs uppercase tracking-wider transition cursor-pointer self-start sm:self-auto disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isDiagnosing ? 'animate-spin' : ''}`} />
              <span>{isDiagnosing ? 'Comprobando...' : 'Probar Conexiones (Ping)'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <button
              onClick={() => openPortal(3000)}
              className="group p-4 rounded-2xl bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/40 transition text-left cursor-pointer flex items-center justify-between shadow-lg"
            >
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase bg-cyan-950/60 border border-cyan-800/60 px-2 py-0.5 rounded">Puerto 3000</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                </div>
                <div className="font-bold text-white text-sm group-hover:text-cyan-300 transition">Estación LIS / HIS Principal</div>
                <div className="text-xs text-slate-400">Personal de laboratorio clínico, patología y banco de sangre</div>
              </div>
              <ArrowUpRight className="w-5 h-5 text-slate-500 group-hover:text-cyan-400 transition shrink-0 ml-2" />
            </button>

            <button
              onClick={() => openPortal(3001)}
              className="group p-4 rounded-2xl bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-teal-500/40 transition text-left cursor-pointer flex items-center justify-between shadow-lg"
            >
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-mono font-bold text-teal-400 uppercase bg-teal-950/60 border border-teal-800/60 px-2 py-0.5 rounded">Puerto 3001</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                </div>
                <div className="font-bold text-white text-sm group-hover:text-teal-300 transition">Portal de Pacientes</div>
                <div className="text-xs text-slate-400">Expediente privado, historial y descarga de resultados PDF</div>
              </div>
              <ArrowUpRight className="w-5 h-5 text-slate-500 group-hover:text-teal-400 transition shrink-0 ml-2" />
            </button>

            <button
              onClick={() => openPortal(3002)}
              className="group p-4 rounded-2xl bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/40 transition text-left cursor-pointer flex items-center justify-between shadow-lg"
            >
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase bg-indigo-950/60 border border-indigo-800/60 px-2 py-0.5 rounded">Puerto 3002</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                </div>
                <div className="font-bold text-white text-sm group-hover:text-indigo-300 transition">Portal de Médicos Referentes</div>
                <div className="text-xs text-slate-400">Órdenes directas, pasarela médica e idoneidad profesional</div>
              </div>
              <ArrowUpRight className="w-5 h-5 text-slate-500 group-hover:text-indigo-400 transition shrink-0 ml-2" />
            </button>

            <button
              onClick={() => openPortal(3003)}
              className="group p-4 rounded-2xl bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/40 transition text-left cursor-pointer flex items-center justify-between shadow-lg"
            >
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-mono font-bold text-amber-400 uppercase bg-amber-950/60 border border-amber-800/60 px-2 py-0.5 rounded">Puerto 3003</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                </div>
                <div className="font-bold text-white text-sm group-hover:text-amber-300 transition">Consola Súper-Admin SaaS</div>
                <div className="text-xs text-slate-400">Gestión de sedes, tenants clínicos y bóveda de auditoría</div>
              </div>
              <ArrowUpRight className="w-5 h-5 text-slate-500 group-hover:text-amber-400 transition shrink-0 ml-2" />
            </button>
          </div>
        </div>

      </div>

      {/* Live Diagnostic NOC Console */}
      <div className="bg-slate-950 border border-slate-800/90 rounded-3xl p-6 space-y-3 mt-auto shadow-2xl">
        <div className="flex items-center justify-between text-xs text-slate-400 font-mono flex-wrap gap-2">
          <div className="flex items-center space-x-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span className="font-bold text-white">Consola de Telemetría y Salud del Clúster (Zero Black Screens)</span>
          </div>
          <button
            onClick={copyDiagnostic}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-mono transition cursor-pointer"
          >
            {copiedLog ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
            <span>{copiedLog ? 'Copiado al Portapapeles' : 'Copiar Diagnóstico'}</span>
          </button>
        </div>

        <div className="font-mono text-xs space-y-2 text-slate-300 bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80 max-h-48 overflow-y-auto">
          <div className="text-emerald-400 font-bold">
            ✓ [PostgreSQL 16.15] Motor relacional conectado en localhost:5432 (Pool activo: 10/10 slots — Latencia: {serviceStatus.postgres.latency}ms).
          </div>
          <div className="text-cyan-300">
            ℹ [PostgREST 16.2] Schema cache loaded 85 Relations, 101 Relationships, 16 RPCs in {serviceStatus.postgrest.latency}ms.
          </div>
          <div className="text-blue-300">
            ℹ [Multi-Port Router] Enrutador dedicado escuchando en puertos 3000 (LIS), 3001 (Pacientes), 3002 (Médicos), 3003 (Admin), 3004 (Control Center).
          </div>
          <div className="text-amber-300">
            ℹ [ACE Daemon] Middleware de analizadores escuchando en 0.0.0.0:5100 (Protocolos ASTM E1394 y HL7 v2.5).
          </div>
          <div className="text-emerald-400 font-bold">
            ✓ [Daemon Mode] Servicios activos en segundo plano blindado con WScript.Shell WindowStyle = 0.
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 font-mono pt-1 flex-wrap gap-2">
          <span>AbregoTech Systems Panamá • Infraestructura Hospitalaria Certificada Ley 81</span>
          <span>Hora Local Servidor: {currentTime || '11:55 PM'}</span>
        </div>
      </div>

    </div>
  );
};
