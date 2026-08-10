import React, { useState } from 'react';
import { Tenant, Branch } from '../../types';
import {
  Server,
  Database,
  RefreshCw,
  Zap,
  ShieldCheck,
  AlertTriangle,
  Wifi,
  WifiOff,
  CheckCircle2,
  HardDrive,
  Activity,
  Radio
} from 'lucide-react';

interface HighAvailabilityDisasterRecoveryProps {
  tenant: Tenant;
  branch: Branch;
}

export const HighAvailabilityDisasterRecovery: React.FC<HighAvailabilityDisasterRecoveryProps> = ({
  tenant,
  branch
}) => {
  const [primaryDbStatus, setPrimaryDbStatus] = useState<'ONLINE' | 'SIMULATING_OUTAGE'>('ONLINE');
  const [secondaryReplicaStatus, setSecondaryReplicaStatus] = useState<'SYNCED' | 'PROMOTED_PRIMARY'>('SYNCED');
  const [offlineBufferCount, setOfflineBufferCount] = useState<number>(14);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const handleSimulateOutage = () => {
    if (primaryDbStatus === 'ONLINE') {
      setPrimaryDbStatus('SIMULATING_OUTAGE');
      setSecondaryReplicaStatus('PROMOTED_PRIMARY');
      alert('⚠️ ATENCIÓN: Simulación de caída del Servidor Principal Cloud SQL Panamá (us-east4). El cluster failover automático ha promovido la réplica secundaria en 1.8 segundos sin pérdida de transacciones LIS.');
    } else {
      setPrimaryDbStatus('ONLINE');
      setSecondaryReplicaStatus('SYNCED');
      alert('✓ Servidor Principal Cloud SQL restablecido y resincronizado.');
    }
  };

  const handleSyncOfflineBuffer = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setOfflineBufferCount(0);
      setIsSyncing(false);
      alert('¡Sincronización de buffer local completada! 14 transacciones registradas sin conexión a internet han sido subidas al cluster PostgreSQL.');
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white p-6 rounded-2xl shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="text-cyan-400 text-xs font-bold uppercase tracking-wider mb-1 flex items-center space-x-2">
            <Server className="w-4 h-4 text-cyan-400" />
            <span>Fase 5 — Resiliencia Operativa, Replication High-Availability & Disaster Recovery</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black">
            Cloud SQL Multi-Region Replica & Offline Buffer Sync
          </h1>
          <p className="text-slate-300 text-sm mt-1 max-w-xl">
            Garantía de operación ininterrumpida 24/7 en sedes de laboratorio clínico ante fallas de conectividad o desastres eléctricos.
          </p>
        </div>

        <button
          onClick={handleSimulateOutage}
          className={`px-5 py-3 rounded-xl font-bold text-xs transition shadow-lg flex items-center space-x-2 border ${
            primaryDbStatus === 'ONLINE'
              ? 'bg-amber-600 hover:bg-amber-700 text-white border-amber-400/40'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-400/40'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>
            {primaryDbStatus === 'ONLINE'
              ? 'Simular Caída de Servidor Principal'
              : 'Restablecer Servidor Principal'}
          </span>
        </button>
      </div>

      {/* Cluster Nodes Topology Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Node 1: Primary DB */}
        <div className={`p-6 rounded-2xl border transition shadow-sm space-y-3 ${
          primaryDbStatus === 'ONLINE' ? 'bg-white border-slate-200' : 'bg-red-50 border-red-300'
        }`}>
          <div className="flex items-center justify-between">
            <div className="font-bold text-slate-900 text-sm flex items-center space-x-2">
              <Database className="w-5 h-5 text-indigo-600" />
              <span>Nodo Principal Cloud SQL (us-east4)</span>
            </div>
            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
              primaryDbStatus === 'ONLINE' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-600 text-white animate-pulse'
            }`}>
              {primaryDbStatus === 'ONLINE' ? 'ACTIVO (PRIMARY)' : 'FUERA DE LÍNEA'}
            </span>
          </div>

          <div className="text-xs text-slate-600 space-y-1 font-mono">
            <div>Latencia: {primaryDbStatus === 'ONLINE' ? '12ms' : 'N/A'}</div>
            <div>Replicación: Streaming Wal Logs</div>
            <div>Ubicación: Data Center Principal</div>
          </div>
        </div>

        {/* Node 2: Secondary Replica */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="font-bold text-slate-900 text-sm flex items-center space-x-2">
              <Server className="w-5 h-5 text-teal-600" />
              <span>Réplica Secundaria (southamerica-east1)</span>
            </div>
            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
              secondaryReplicaStatus === 'PROMOTED_PRIMARY'
                ? 'bg-amber-500 text-white font-black animate-pulse'
                : 'bg-emerald-100 text-emerald-800'
            }`}>
              {secondaryReplicaStatus === 'PROMOTED_PRIMARY' ? 'PROMOVIDO A PRINCIPAL' : 'STANDBY HOT-REPLICA'}
            </span>
          </div>

          <div className="text-xs text-slate-600 space-y-1 font-mono">
            <div>Lag de Replicación: &lt; 0.05s</div>
            <div>Failover Automático: Configurado</div>
            <div>Copia de Seguridad: Cada 1 hora</div>
          </div>
        </div>

        {/* Node 3: Edge Local Offline-First Buffer */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="font-bold text-slate-900 text-sm flex items-center space-x-2">
              <HardDrive className="w-5 h-5 text-cyan-600" />
              <span>Buffer Local Sede ({branch.name})</span>
            </div>
            <span className="bg-cyan-100 text-cyan-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
              OFFLINE-FIRST ACTIVE
            </span>
          </div>

          <div className="text-xs text-slate-600 space-y-1">
            <div>Transacciones PENDIENTES en Cola Local: <strong className="text-slate-900 font-mono">{offlineBufferCount}</strong></div>
            <div>Almacenamiento: IndexedDB Criptográfico Local</div>
          </div>

          {offlineBufferCount > 0 && (
            <button
              onClick={handleSyncOfflineBuffer}
              disabled={isSyncing}
              className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 rounded-xl text-xs transition shadow flex items-center justify-center space-x-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Sincronizando Buffer...' : 'Forzar Sincronización Cloud'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
