import React, { useState, useEffect } from 'react';
import { Tenant, Branch } from '../../types';
import {
  Server,
  Database,
  RefreshCw,
  Zap,
  ShieldCheck,
  AlertTriangle,
  HardDrive,
  Clock,
  Play,
  Pause,
  CheckCircle2,
  Download,
  FileCheck2,
  Sparkles,
  Layers,
  Activity,
  FileText,
  RotateCcw,
  CloudDownload,
  ShieldAlert,
  Calendar,
  Check,
  Copy,
  Sliders,
  Cloud,
  Folder,
  Save
} from 'lucide-react';

interface HighAvailabilityDisasterRecoveryProps {
  tenant: Tenant;
  branch: Branch;
}

export interface BackupRecord {
  id: string;
  timestamp: string;
  type: 'AUTOMÁTICO (CRON 24H)' | 'MANUAL';
  status: 'COMPLETADO' | 'EN_PROCESO' | 'FALLIDO';
  sizeMB: number;
  recordsCount: number;
  hashSHA256: string;
  destinationBucket: string;
  durationSeconds: number;
}

export const HighAvailabilityDisasterRecovery: React.FC<HighAvailabilityDisasterRecoveryProps> = ({
  tenant,
  branch
}) => {
  // Existing HADR State
  const [primaryDbStatus, setPrimaryDbStatus] = useState<'ONLINE' | 'SIMULATING_OUTAGE'>('ONLINE');
  const [secondaryReplicaStatus, setSecondaryReplicaStatus] = useState<'SYNCED' | 'PROMOTED_PRIMARY'>('SYNCED');
  const [offlineBufferCount, setOfflineBufferCount] = useState<number>(14);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Simulated Cron Job & Backup Service State
  const [isCronActive, setIsCronActive] = useState<boolean>(true);
  const [cronExpression, setCronExpression] = useState<string>('0 2 * * *'); // Default 02:00 AM
  const [cronIntervalHours, setCronIntervalHours] = useState<number>(24);
  const [nextScheduledTime, setNextScheduledTime] = useState<string>('12/08/2026 02:00:00');
  const [timeToNextSeconds, setTimeToNextSeconds] = useState<number>(14820); // ~4h 07m countdown simulation
  const [isBackupRunning, setIsBackupRunning] = useState<boolean>(false);
  const [backupProgress, setBackupProgress] = useState<number>(0);
  const [backupStageText, setBackupStageText] = useState<string>('');
  const [showRestoreModal, setShowRestoreModal] = useState<boolean>(false);
  const [selectedBackupForRestore, setSelectedBackupForRestore] = useState<BackupRecord | null>(null);
  const [isRestoring, setIsRestoring] = useState<boolean>(false);
  const [restoreSuccessMessage, setRestoreSuccessMessage] = useState<string | null>(null);

  // Admin Backup Schedule & Target Destination Configuration
  const [scheduledBackupTime, setScheduledBackupTime] = useState<string>('02:00');
  const [storageDestination, setStorageDestination] = useState<'CLOUD' | 'LOCAL' | 'HYBRID'>('HYBRID');
  const [localStoragePath, setLocalStoragePath] = useState<string>('/mnt/nas_laboratorio/backups/lis_daily/');
  const [cloudBucketPath, setCloudBucketPath] = useState<string>('gs://lis-backups-panama-prod/');
  const [retentionYears, setRetentionYears] = useState<number>(5);
  const [configToastMessage, setConfigToastMessage] = useState<string | null>(null);

  // Backup History Ledger
  const [backupHistory, setBackupHistory] = useState<BackupRecord[]>([
    {
      id: 'bkp-20260811-001',
      timestamp: '11/08/2026 00:00:00',
      type: 'AUTOMÁTICO (CRON 24H)',
      status: 'COMPLETADO',
      sizeMB: 1420.5,
      recordsCount: 21540,
      hashSHA256: 'a7f893bc01d29e8401a90184b2c8901f492a83e0d8492019482019e0839201a4',
      destinationBucket: 'gs://lis-backups-panama-prod/2026-08-11/clinical_records_full.dmp',
      durationSeconds: 38
    },
    {
      id: 'bkp-20260810-001',
      timestamp: '10/08/2026 00:00:00',
      type: 'AUTOMÁTICO (CRON 24H)',
      status: 'COMPLETADO',
      sizeMB: 1412.2,
      recordsCount: 21200,
      hashSHA256: '99b8201a48291029e8401a90184b2c8901f492a83e0d8492019482019e083920',
      destinationBucket: 'gs://lis-backups-panama-prod/2026-08-10/clinical_records_full.dmp',
      durationSeconds: 41
    },
    {
      id: 'bkp-20260809-001',
      timestamp: '09/08/2026 00:00:00',
      type: 'AUTOMÁTICO (CRON 24H)',
      status: 'COMPLETADO',
      sizeMB: 1398.8,
      recordsCount: 20890,
      hashSHA256: '88a10293847291029e8401a90184b2c8901f492a83e0d8492019482019e08392',
      destinationBucket: 'gs://lis-backups-panama-prod/2026-08-09/clinical_records_full.dmp',
      durationSeconds: 36
    },
    {
      id: 'bkp-20260808-001',
      timestamp: '08/08/2026 00:00:00',
      type: 'AUTOMÁTICO (CRON 24H)',
      status: 'COMPLETADO',
      sizeMB: 1385.0,
      recordsCount: 20500,
      hashSHA256: '77c0192837465019283746501928374650192837465019283746501928374650',
      destinationBucket: 'gs://lis-backups-panama-prod/2026-08-08/clinical_records_full.dmp',
      durationSeconds: 40
    }
  ]);

  // Simulated Timer ticker for Cron Countdown
  useEffect(() => {
    if (!isCronActive) return;

    const timer = setInterval(() => {
      setTimeToNextSeconds((prev) => {
        if (prev <= 1) {
          // Trigger automatic simulated backup
          runSimulatedBackup('AUTOMÁTICO (CRON 24H)');
          return cronIntervalHours * 3600;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isCronActive, cronIntervalHours]);

  // Format countdown seconds to HH:MM:SS
  const formatCountdown = (totalSec: number) => {
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;
    return `${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;
  };

  // Run Simulated Backup Procedure
  const runSimulatedBackup = (type: 'AUTOMÁTICO (CRON 24H)' | 'MANUAL' = 'MANUAL') => {
    if (isBackupRunning) return;

    setIsBackupRunning(true);
    setBackupProgress(5);
    setBackupStageText('Iniciando snapshot incremental de base de datos Cloud SQL...');

    setTimeout(() => {
      setBackupProgress(30);
      setBackupStageText('Extrayendo registros clínicos, resultados de laboratorio y audit logs Ley 81...');
    }, 700);

    setTimeout(() => {
      setBackupProgress(65);
      setBackupStageText('Generando archivo de respaldo comprimido y cifrado AES-256...');
    }, 1400);

    setTimeout(() => {
      setBackupProgress(85);
      setBackupStageText('Calculando firma de integridad SHA-256 y transmitiendo a GCS Multi-Region...');
    }, 2100);

    setTimeout(() => {
      setBackupProgress(100);
      setBackupStageText('¡Respaldo completado con éxito!');

      const now = new Date();
      const timestampStr = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
      const datePathStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;

      let calculatedDestination = `gs://lis-backups-panama-prod/${datePathStr}/clinical_records_full.dmp`;
      if (storageDestination === 'LOCAL') {
        calculatedDestination = `[NAS Local] ${localStoragePath}${datePathStr}/clinical_records_full.dmp`;
      } else if (storageDestination === 'CLOUD') {
        calculatedDestination = `[Cloud GCS] ${cloudBucketPath}${datePathStr}/clinical_records_full.dmp`;
      } else {
        calculatedDestination = `[Híbrido] NAS: ${localStoragePath} | Cloud: ${cloudBucketPath}${datePathStr}/clinical_records_full.dmp`;
      }

      const newBackup: BackupRecord = {
        id: `bkp-${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}-${Math.floor(100 + Math.random() * 900)}`,
        timestamp: timestampStr,
        type,
        status: 'COMPLETADO',
        sizeMB: 1428.4,
        recordsCount: 21685,
        hashSHA256: Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
        destinationBucket: calculatedDestination,
        durationSeconds: 32
      };

      setBackupHistory((prev) => [newBackup, ...prev]);

      setTimeout(() => {
        setIsBackupRunning(false);
        setBackupProgress(0);
      }, 800);
    }, 2800);
  };

  // Save Admin Backup Schedule & Destination Configuration
  const handleSaveAdminBackupConfig = () => {
    const [h, m] = scheduledBackupTime.split(':');
    const newCron = `${m || '0'} ${h || '2'} * * *`;
    setCronExpression(newCron);
    setNextScheduledTime(`12/08/2026 ${scheduledBackupTime}:00`);

    const destLabel =
      storageDestination === 'HYBRID'
        ? 'Híbrido (Servidor Local NAS + Nube Multi-Región)'
        : storageDestination === 'LOCAL'
        ? `Servidor Local / NAS (${localStoragePath})`
        : `Servidor en la Nube (${cloudBucketPath})`;

    setConfigToastMessage(
      `✓ Configuración guardada: Ejecución diaria fijada a las ${scheduledBackupTime} (Cron: ${newCron}). Destino: ${destLabel}.`
    );

    setTimeout(() => {
      setConfigToastMessage(null);
    }, 6000);
  };

  // Restore Simulation Handler
  const handleRestoreBackup = () => {
    if (!selectedBackupForRestore) return;
    setIsRestoring(true);
    setRestoreSuccessMessage(null);

    setTimeout(() => {
      setIsRestoring(false);
      setRestoreSuccessMessage(
        `✓ Prueba de restauración Disaster Recovery ejecutada con éxito. Verificados ${selectedBackupForRestore.recordsCount.toLocaleString()} registros clínicos. Hash SHA-256 verificado.`
      );
    }, 2000);
  };

  // Last Backup Info
  const lastBackup = backupHistory[0] || null;

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
    <div className="space-y-6 text-slate-800">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white p-6 rounded-3xl shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 relative z-10 max-w-2xl">
          <div className="text-cyan-400 text-xs font-bold uppercase tracking-wider flex items-center space-x-2">
            <Server className="w-4 h-4 text-cyan-400" />
            <span>Fase 5 — Resiliencia Operativa, Replication High-Availability & Disaster Recovery</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Cloud SQL Multi-Region Replica & Backup Cron Automático
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            Garantía de operación ininterrumpida 24/7 en sedes de laboratorio clínico ante fallas de conectividad o desastres eléctricos. Respaldo automatizado de registros clínicos cada 24 horas.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0 relative z-10">
          <button
            onClick={handleSimulateOutage}
            className={`px-5 py-3 rounded-2xl font-bold text-xs transition shadow-lg flex items-center justify-center space-x-2 border cursor-pointer ${
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
      </div>

      {/* Cluster Nodes Topology Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Node 1: Primary DB */}
        <div
          className={`p-6 rounded-3xl border transition shadow-sm space-y-3 ${
            primaryDbStatus === 'ONLINE' ? 'bg-white border-slate-200' : 'bg-red-50 border-red-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="font-bold text-slate-900 text-sm flex items-center space-x-2">
              <Database className="w-5 h-5 text-indigo-600" />
              <span>Nodo Principal Cloud SQL (us-east4)</span>
            </div>
            <span
              className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                primaryDbStatus === 'ONLINE' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-600 text-white animate-pulse'
              }`}
            >
              {primaryDbStatus === 'ONLINE' ? 'ACTIVO (PRIMARY)' : 'FUERA DE LÍNEA'}
            </span>
          </div>

          <div className="text-xs text-slate-600 space-y-1 font-mono">
            <div>Latencia: {primaryDbStatus === 'ONLINE' ? '12ms' : 'N/A'}</div>
            <div>Replicación: Streaming WAL Logs</div>
            <div>Ubicación: Data Center Principal</div>
          </div>
        </div>

        {/* Node 2: Secondary Replica */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="font-bold text-slate-900 text-sm flex items-center space-x-2">
              <Server className="w-5 h-5 text-teal-600" />
              <span>Réplica Secundaria (southamerica-east1)</span>
            </div>
            <span
              className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                secondaryReplicaStatus === 'PROMOTED_PRIMARY'
                  ? 'bg-amber-500 text-white font-black animate-pulse'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {secondaryReplicaStatus === 'PROMOTED_PRIMARY' ? 'PROMOVIDO A PRINCIPAL' : 'STANDBY HOT-REPLICA'}
            </span>
          </div>

          <div className="text-xs text-slate-600 space-y-1 font-mono">
            <div>Lag de Replicación: &lt; 0.05s</div>
            <div>Failover Automático: Configurado</div>
            <div>Copia de Seguridad: Cada 24 horas (Cron)</div>
          </div>
        </div>

        {/* Node 3: Edge Local Offline-First Buffer */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
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
            <div>
              Transacciones PENDIENTES en Cola Local:{' '}
              <strong className="text-slate-900 font-mono">{offlineBufferCount}</strong>
            </div>
            <div>Almacenamiento: IndexedDB Criptográfico Local</div>
          </div>

          {offlineBufferCount > 0 && (
            <button
              onClick={handleSyncOfflineBuffer}
              disabled={isSyncing}
              className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 rounded-xl text-xs transition shadow flex items-center justify-center space-x-2 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Sincronizando Buffer...' : 'Forzar Sincronización Cloud'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Prominent Section: Simulated Cron Job Service & Last Backup Status */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="p-2 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-700">
                <Clock className="w-5 h-5" />
              </span>
              <h2 className="text-lg font-black text-slate-900">
                Servidor de Cron Job & Servicio de Respaldos Automáticos (24h)
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              Programador de tareas periódicas en segundo plano para respaldos comprimidos y cifrados de registros clínicos
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Cron Status Indicator */}
            <div className="flex items-center space-x-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-xs font-bold text-slate-600">Estado del Cron:</span>
              <button
                onClick={() => setIsCronActive(!isCronActive)}
                className={`px-3 py-1 rounded-lg text-xs font-black transition cursor-pointer flex items-center space-x-1.5 ${
                  isCronActive
                    ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/20'
                    : 'bg-amber-500 text-white shadow-sm'
                }`}
              >
                {isCronActive ? (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>PROGRAMADOR ACTIVO</span>
                  </>
                ) : (
                  <>
                    <Pause className="w-3.5 h-3.5 fill-current" />
                    <span>PROGRAMADOR PAUSADO</span>
                  </>
                )}
              </button>
            </div>

            {/* Run Backup Now Button */}
            <button
              onClick={() => runSimulatedBackup('MANUAL')}
              disabled={isBackupRunning}
              className="px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black rounded-xl text-xs transition shadow-md shadow-teal-500/20 flex items-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isBackupRunning ? 'animate-spin' : ''}`} />
              <span>{isBackupRunning ? 'Ejecutando Respaldo...' : 'Ejecutar Respaldo Manual Ahora'}</span>
            </button>
          </div>
        </div>

        {/* Live Progress Bar when Backup is running */}
        {isBackupRunning && (
          <div className="p-4 bg-teal-50/80 border border-teal-300 rounded-2xl space-y-2 animate-pulse">
            <div className="flex items-center justify-between text-xs font-bold text-teal-900">
              <span className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-teal-600 animate-spin" />
                <span>{backupStageText}</span>
              </span>
              <span className="font-mono text-teal-700">{backupProgress}%</span>
            </div>
            <div className="w-full bg-teal-200 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-teal-500 to-emerald-500 h-full transition-all duration-300"
                style={{ width: `${backupProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Split Grid: Left = Estado del Último Respaldo, Right = Configuración del Cron Job */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card: Estado del Último Respaldo */}
          <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Estado del Último Respaldo</h3>
                  <p className="text-[10px] text-slate-400">Verificado & Almacenado en GCS Multi-Region</p>
                </div>
              </div>

              {lastBackup && (
                <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono font-bold text-[10px] rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {lastBackup.status}
                </span>
              )}
            </div>

            {lastBackup ? (
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 space-y-0.5">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Fecha y Hora</span>
                    <div className="font-mono font-bold text-teal-300 text-sm">{lastBackup.timestamp}</div>
                  </div>

                  <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 space-y-0.5">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Tipo de Disparo</span>
                    <div className="font-bold text-emerald-400 text-xs">{lastBackup.type}</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/80 text-center">
                    <span className="text-[9px] text-slate-400 font-bold block">Tamaño</span>
                    <span className="font-mono font-black text-white text-xs">{lastBackup.sizeMB.toFixed(1)} MB</span>
                  </div>

                  <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/80 text-center">
                    <span className="text-[9px] text-slate-400 font-bold block">Registros Clin.</span>
                    <span className="font-mono font-black text-teal-300 text-xs">{lastBackup.recordsCount.toLocaleString()}</span>
                  </div>

                  <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/80 text-center">
                    <span className="text-[9px] text-slate-400 font-bold block">Duración</span>
                    <span className="font-mono font-black text-indigo-300 text-xs">{lastBackup.durationSeconds}s</span>
                  </div>
                </div>

                <div className="space-y-1 font-mono text-[10px]">
                  <div className="text-slate-400 flex items-center justify-between">
                    <span>Bucket Destino:</span>
                    <span className="text-slate-300 truncate max-w-[220px]">{lastBackup.destinationBucket}</span>
                  </div>
                  <div className="text-slate-400 flex items-center justify-between">
                    <span>Firma SHA-256:</span>
                    <span className="text-teal-400 truncate max-w-[220px]">{lastBackup.hashSHA256}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-slate-500 text-xs">No hay respaldos registrados.</div>
            )}
          </div>

          {/* Card: Configuración del Cron Job & Countdown */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center space-x-2">
                <Sliders className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-sm text-slate-900">Programación de Frecuencia (Cron Service)</h3>
              </div>
              <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 font-mono font-bold text-[10px] rounded-md">
                Linux Crontab Syntax
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700">Expresión Cron Activa:</span>
                <span className="px-2.5 py-1 bg-slate-900 text-teal-400 font-mono font-bold text-xs rounded-lg">
                  {cronExpression}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700">Intervalo de Respaldo:</span>
                <select
                  value={cronIntervalHours}
                  onChange={(e) => {
                    const hours = Number(e.target.value);
                    setCronIntervalHours(hours);
                    setCronExpression(hours === 24 ? '0 0 * * *' : hours === 12 ? '0 */12 * * *' : '0 */6 * * *');
                    setTimeToNextSeconds(hours * 3600);
                  }}
                  className="bg-white border border-slate-300 font-bold text-slate-800 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-indigo-500"
                >
                  <option value={24}>Cada 24 Horas (Recomendado MINSA / Ley 81)</option>
                  <option value={12}>Cada 12 Horas (Turnos Dobles)</option>
                  <option value={6}>Cada 6 Horas (Alta Densidad de Muestras)</option>
                </select>
              </div>

              {/* Countdown Card */}
              <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center justify-between">
                  <span>Próximo Disparo Automático (Cuenta Regresiva):</span>
                  <span className="text-slate-400 font-mono">{nextScheduledTime}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="font-mono text-xl font-black text-indigo-600">
                    {isCronActive ? formatCountdown(timeToNextSeconds) : 'PAUSADO'}
                  </div>
                  <span className="text-[10px] px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md font-bold">
                    Servicio daemon activo
                  </span>
                </div>
              </div>

              <div className="p-2.5 bg-amber-50 border border-amber-200 text-amber-900 text-[11px] rounded-xl flex items-start space-x-2">
                <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Los respaldos automáticos cada 24h son almacenados en buckets de retención inmutable (WORM) por un período mínimo de 5 años según exigencia del Minsitero de Salud y la Ley 81 de Panamá.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Full Admin Configuration Panel for Hora Exacta & Destino de Almacenamiento */}
        <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 shadow-xl space-y-5 relative overflow-hidden">
          {/* Toast Notification Banner */}
          {configToastMessage && (
            <div className="bg-emerald-950 text-emerald-200 border border-emerald-700/80 p-3.5 rounded-2xl text-xs font-bold flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{configToastMessage}</span>
              </div>
              <button
                onClick={() => setConfigToastMessage(null)}
                className="text-emerald-400 hover:text-white text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* Panel Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-indigo-500/20 border border-indigo-500/30 rounded-2xl text-indigo-400 shrink-0">
                <Sliders className="w-6 h-6 text-indigo-400" />
              </div>
              <div>
                <h2 className="text-base font-black text-white tracking-tight flex items-center gap-2">
                  <span>Configuración Administrador: Hora de Ejecución y Destino de Almacenamiento</span>
                  <span className="px-2.5 py-0.5 bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-mono text-[10px] rounded-full font-extrabold uppercase">
                    Admin Policy
                  </span>
                </h2>
                <p className="text-slate-400 text-xs">
                  Establezca el horario exacto del día para los respaldos automatizados y determine si la copia se almacena localmente en NAS, en la nube o en arquitectura híbrida.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column: Configuración de Hora Exacta del Día */}
            <div className="bg-slate-950/80 border border-slate-800/80 p-5 rounded-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <label className="text-xs font-extrabold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-teal-400" />
                  <span>1. Hora Exacta de Ejecución Diaria</span>
                </label>
                <span className="text-[10px] bg-slate-800 text-teal-300 px-2 py-0.5 rounded font-mono font-bold">
                  Sintaxis Cron: {cronExpression}
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="flex-1">
                    <label className="text-[11px] text-slate-400 font-bold block mb-1">
                      Hora del Día (UTC-5 Panamá):
                    </label>
                    <input
                      type="time"
                      value={scheduledBackupTime}
                      onChange={(e) => setScheduledBackupTime(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 text-teal-300 rounded-xl px-3.5 py-2 text-sm font-mono font-black focus:outline-none focus:border-teal-400"
                    />
                  </div>

                  <div className="flex-1">
                    <label className="text-[11px] text-slate-400 font-bold block mb-1">
                      Política de Retención:
                    </label>
                    <select
                      value={retentionYears}
                      onChange={(e) => setRetentionYears(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-teal-400"
                    >
                      <option value={5}>5 Años (Exigencia MINSA / Ley 81)</option>
                      <option value={10}>10 Años (Largo Plazo Legal)</option>
                      <option value={3}>3 Años (Estándar Básico)</option>
                    </select>
                  </div>
                </div>

                {/* Preset Fast Selection Buttons */}
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Horarios Frecuentes de Bajo Tráfico (Presets):
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setScheduledBackupTime('01:00')}
                      className={`px-2.5 py-1.5 rounded-xl border transition text-[11px] cursor-pointer ${
                        scheduledBackupTime === '01:00'
                          ? 'bg-teal-500/20 border-teal-500 text-teal-300 font-black'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      01:00 AM (Bajo Tráfico)
                    </button>
                    <button
                      type="button"
                      onClick={() => setScheduledBackupTime('02:00')}
                      className={`px-2.5 py-1.5 rounded-xl border transition text-[11px] cursor-pointer ${
                        scheduledBackupTime === '02:00'
                          ? 'bg-teal-500/20 border-teal-500 text-teal-300 font-black'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      02:00 AM (Recomendado)
                    </button>
                    <button
                      type="button"
                      onClick={() => setScheduledBackupTime('03:00')}
                      className={`px-2.5 py-1.5 rounded-xl border transition text-[11px] cursor-pointer ${
                        scheduledBackupTime === '03:00'
                          ? 'bg-teal-500/20 border-teal-500 text-teal-300 font-black'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      03:00 AM (Madrugada)
                    </button>
                    <button
                      type="button"
                      onClick={() => setScheduledBackupTime('23:00')}
                      className={`px-2.5 py-1.5 rounded-xl border transition text-[11px] cursor-pointer ${
                        scheduledBackupTime === '23:00'
                          ? 'bg-teal-500/20 border-teal-500 text-teal-300 font-black'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      11:00 PM (Cierre Turno)
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Destino del Almacenamiento (Local vs Nube vs Híbrido) */}
            <div className="bg-slate-950/80 border border-slate-800/80 p-5 rounded-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <label className="text-xs font-extrabold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
                  <HardDrive className="w-4 h-4 text-indigo-400" />
                  <span>2. Destino del Almacenamiento</span>
                </label>
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded font-mono font-bold">
                  Target Storage
                </span>
              </div>

              {/* 3 Target Storage Cards */}
              <div className="grid grid-cols-3 gap-2">
                {/* Option A: Nube */}
                <button
                  type="button"
                  onClick={() => setStorageDestination('CLOUD')}
                  className={`p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between space-y-2 ${
                    storageDestination === 'CLOUD'
                      ? 'bg-indigo-500/20 border-indigo-500 text-white shadow-md'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <Cloud className={`w-5 h-5 ${storageDestination === 'CLOUD' ? 'text-indigo-400' : 'text-slate-500'}`} />
                    <span className="text-[9px] font-mono font-bold uppercase">Cloud</span>
                  </div>
                  <div>
                    <div className="font-bold text-xs text-white">Servidor Nube</div>
                    <div className="text-[9px] text-slate-400 leading-tight mt-0.5">Bucket GCS Multi-Región</div>
                  </div>
                </button>

                {/* Option B: Servidor Local / NAS */}
                <button
                  type="button"
                  onClick={() => setStorageDestination('LOCAL')}
                  className={`p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between space-y-2 ${
                    storageDestination === 'LOCAL'
                      ? 'bg-cyan-500/20 border-cyan-500 text-white shadow-md'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <HardDrive className={`w-5 h-5 ${storageDestination === 'LOCAL' ? 'text-cyan-400' : 'text-slate-500'}`} />
                    <span className="text-[9px] font-mono font-bold uppercase">Local</span>
                  </div>
                  <div>
                    <div className="font-bold text-xs text-white">Servidor Local</div>
                    <div className="text-[9px] text-slate-400 leading-tight mt-0.5">NAS / SAN Físico Sede</div>
                  </div>
                </button>

                {/* Option C: Híbrido */}
                <button
                  type="button"
                  onClick={() => setStorageDestination('HYBRID')}
                  className={`p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between space-y-2 ${
                    storageDestination === 'HYBRID'
                      ? 'bg-emerald-500/20 border-emerald-500 text-white shadow-md'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <RefreshCw className={`w-5 h-5 ${storageDestination === 'HYBRID' ? 'text-emerald-400' : 'text-slate-500'}`} />
                    <span className="text-[9px] font-mono font-bold uppercase">Recomendado</span>
                  </div>
                  <div>
                    <div className="font-bold text-xs text-white">Híbrido (Ambos)</div>
                    <div className="text-[9px] text-slate-400 leading-tight mt-0.5">NAS Local + Nube GCS</div>
                  </div>
                </button>
              </div>

              {/* Path inputs based on selection */}
              <div className="space-y-2 pt-1 text-xs font-mono">
                {(storageDestination === 'LOCAL' || storageDestination === 'HYBRID') && (
                  <div>
                    <label className="text-[10px] text-cyan-300 font-bold block mb-1 flex items-center space-x-1">
                      <Folder className="w-3 h-3 text-cyan-400" />
                      <span>Ruta de Servidor Local / NAS Sede ({branch.name}):</span>
                    </label>
                    <input
                      type="text"
                      value={localStoragePath}
                      onChange={(e) => setLocalStoragePath(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 text-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                )}

                {(storageDestination === 'CLOUD' || storageDestination === 'HYBRID') && (
                  <div>
                    <label className="text-[10px] text-indigo-300 font-bold block mb-1 flex items-center space-x-1">
                      <Cloud className="w-3 h-3 text-indigo-400" />
                      <span>Bucket de Servidor en la Nube (GCS Multi-Region):</span>
                    </label>
                    <input
                      type="text"
                      value={cloudBucketPath}
                      onChange={(e) => setCloudBucketPath(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 text-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-400"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Action Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800">
            <div className="text-[11px] text-slate-400 font-medium">
              Estado de la política: Respaldo diario programado a las <strong className="text-teal-300">{scheduledBackupTime}</strong> en destino <strong className="text-indigo-300">{storageDestination}</strong>.
            </div>

            <button
              onClick={handleSaveAdminBackupConfig}
              className="px-6 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black text-xs rounded-xl transition shadow-lg shadow-teal-500/20 flex items-center space-x-2 cursor-pointer shrink-0"
            >
              <Save className="w-4 h-4 text-slate-950" />
              <span>Guardar Configuración de Respaldo</span>
            </button>
          </div>
        </div>

        {/* History Table of Past Backups */}
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-2">
              <FileCheck2 className="w-4 h-4 text-teal-600" />
              <span>Historial de Copias de Seguridad Generadas</span>
            </h3>

            <button
              onClick={() => {
                setSelectedBackupForRestore(backupHistory[0]);
                setShowRestoreModal(true);
              }}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Ejecutar Prueba de Restauración (DR Drill)</span>
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-300 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3">ID Respaldo</th>
                  <th className="p-3">Fecha y Hora</th>
                  <th className="p-3">Tipo</th>
                  <th className="p-3">Estado</th>
                  <th className="p-3">Tamaño</th>
                  <th className="p-3">Registros Clin.</th>
                  <th className="p-3">Firma SHA-256</th>
                  <th className="p-3 text-center">Restaurar / Verificar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {backupHistory.map((bkp) => (
                  <tr key={bkp.id} className="hover:bg-slate-50 transition">
                    <td className="p-3 font-mono font-bold text-slate-900">{bkp.id}</td>
                    <td className="p-3 font-mono text-slate-600 whitespace-nowrap">{bkp.timestamp}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                          bkp.type === 'AUTOMÁTICO (CRON 24H)'
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'bg-teal-100 text-teal-800'
                        }`}
                      >
                        {bkp.type}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-full inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        {bkp.status}
                      </span>
                    </td>
                    <td className="p-3 font-mono">{bkp.sizeMB.toFixed(1)} MB</td>
                    <td className="p-3 font-mono font-bold text-teal-700">{bkp.recordsCount.toLocaleString()}</td>
                    <td className="p-3 font-mono text-[10px] text-slate-500 truncate max-w-[120px]">
                      {bkp.hashSHA256}
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => {
                          setSelectedBackupForRestore(bkp);
                          setShowRestoreModal(true);
                        }}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[11px] rounded-lg transition cursor-pointer inline-flex items-center space-x-1"
                      >
                        <RotateCcw className="w-3 h-3 text-indigo-600" />
                        <span>Verificar</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Disaster Recovery Restore Modal */}
      {showRestoreModal && selectedBackupForRestore && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 border border-slate-200 relative">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-9 h-9 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    Prueba de Restauración Disaster Recovery
                  </h3>
                  <p className="text-[10px] text-slate-500">Verificación de Integridad de Copia de Seguridad</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowRestoreModal(false);
                  setRestoreSuccessMessage(null);
                }}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 font-mono">
                <div>
                  <strong className="text-slate-900">ID de Respaldo:</strong> {selectedBackupForRestore.id}
                </div>
                <div>
                  <strong className="text-slate-900">Fecha:</strong> {selectedBackupForRestore.timestamp}
                </div>
                <div>
                  <strong className="text-slate-900">Registros Incluidos:</strong>{' '}
                  {selectedBackupForRestore.recordsCount.toLocaleString()}
                </div>
                <div className="truncate">
                  <strong className="text-slate-900">Bucket:</strong> {selectedBackupForRestore.destinationBucket}
                </div>
              </div>

              {restoreSuccessMessage ? (
                <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl space-y-1 text-xs">
                  <div className="font-bold flex items-center space-x-1.5 text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Verificación Completada Exitosamente</span>
                  </div>
                  <p className="text-[11px] text-emerald-700">{restoreSuccessMessage}</p>
                </div>
              ) : (
                <p className="text-slate-600">
                  Esta acción simula la descarga y descompresión en un entorno sandbox del archivo de respaldo para garantizar que el plan de continuidad de negocio (DRP) sea 100% funcional.
                </p>
              )}
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  setShowRestoreModal(false);
                  setRestoreSuccessMessage(null);
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Cerrar
              </button>

              {!restoreSuccessMessage && (
                <button
                  onClick={handleRestoreBackup}
                  disabled={isRestoring}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition shadow-md shadow-indigo-600/20 flex items-center space-x-2 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRestoring ? 'animate-spin' : ''}`} />
                  <span>{isRestoring ? 'Verificando Snapshot...' : 'Ejecutar Verificación DRP'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
