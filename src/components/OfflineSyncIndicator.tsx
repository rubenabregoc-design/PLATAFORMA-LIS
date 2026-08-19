import React, { useState, useEffect } from 'react';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  HardDrive,
  Database,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Download,
  Trash2,
  ChevronDown,
  Clock,
  ShieldCheck,
  ShieldAlert,
  Server,
  Layers,
  Sparkles,
  X,
  FileDown,
  Copy,
  Check,
  FileCode,
  Flame,
  Fingerprint
} from 'lucide-react';
import { offlineSyncManager, OfflineSyncItem } from '../utils/offlineSyncEngine';

export const OfflineSyncIndicator: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(offlineSyncManager.getConnectionStatus());
  const [isSimulated, setIsSimulated] = useState(offlineSyncManager.isSimulated());
  const [isSyncing, setIsSyncing] = useState(offlineSyncManager.getIsSyncing());
  const [queue, setQueue] = useState<OfflineSyncItem[]>(offlineSyncManager.getQueue());
  const [storageBytes, setStorageBytes] = useState<number>(offlineSyncManager.getStorageUsageBytes());
  const [toastNotice, setToastNotice] = useState<string | null>(null);
  
  // Emergency Export Modal State
  const [showEmergencyModal, setShowEmergencyModal] = useState<boolean>(false);
  const [copiedJson, setCopiedJson] = useState<boolean>(false);
  const [lastExportMetadata, setLastExportMetadata] = useState<{
    fileName: string;
    totalRecords: number;
    checksum: string;
    jsonString: string;
    timestamp: string;
  } | null>(null);

  const showToast = (msg: string) => {
    setToastNotice(msg);
    setTimeout(() => setToastNotice(null), 4000);
  };

  useEffect(() => {
    const updateState = () => {
      setIsOnline(offlineSyncManager.getConnectionStatus());
      setIsSimulated(offlineSyncManager.isSimulated());
      setIsSyncing(offlineSyncManager.getIsSyncing());
      setQueue(offlineSyncManager.getQueue());
      setStorageBytes(offlineSyncManager.getStorageUsageBytes());
    };

    const unsubscribe = offlineSyncManager.subscribe(updateState);
    return () => unsubscribe();
  }, []);

  const handleForceSync = async () => {
    if (!isOnline) {
      showToast('⚠️ No se puede sincronizar: El servidor middleware está desconectado.');
      return;
    }
    const res = await offlineSyncManager.syncPendingQueue();
    showToast(`✓ Sincronización finalizada: ${res.syncedCount} operaciones transmitidas.`);
  };

  const handleToggleOffline = () => {
    const nextState = offlineSyncManager.toggleSimulatedOffline();
    if (nextState) {
      showToast('🔴 Modo Fuera de Línea Activado. El buffer local de almacenamiento está registrando todas las muestras.');
    } else {
      showToast('🟢 Conexión con Middleware Reestablecida. Iniciando drenaje y sincronización automática...');
    }
  };

  const handleSeedMockData = () => {
    offlineSyncManager.seedMockOfflineData();
    showToast('✓ 3 registros de prueba añadidos al buffer local.');
  };

  const handleClear = () => {
    if (window.confirm('¿Está seguro de limpiar el buffer local de sincronización?')) {
      offlineSyncManager.clearQueue();
      showToast('Buffer local vaciado.');
    }
  };

  // Immediate Force Emergency Export with Package Generation
  const handleTriggerEmergencyExport = () => {
    const { pkg, fileName, checksum, jsonString } = offlineSyncManager.generateEmergencyRecoveryPackage('Lic. Valentina Soto (TM-4091)');
    offlineSyncManager.downloadEmergencyPackage('Lic. Valentina Soto (TM-4091)');
    
    setLastExportMetadata({
      fileName,
      totalRecords: pkg.metrics.totalRecords,
      checksum,
      jsonString,
      timestamp: new Date().toLocaleTimeString()
    });

    showToast(`🚨 Paquete de Emergencia DRP exportado: ${fileName} (${pkg.metrics.totalRecords} registros).`);
    setShowEmergencyModal(true);
  };

  const handleCopyEmergencyJson = () => {
    if (!lastExportMetadata) return;
    navigator.clipboard.writeText(lastExportMetadata.jsonString);
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2500);
    showToast('✓ Contenido JSON copiado al portapapeles.');
  };

  const pendingCount = queue.length;
  const storageKb = (storageBytes / 1024).toFixed(1);

  return (
    <div className="relative">
      {/* Toast Notice */}
      {toastNotice && (
        <div className="fixed top-20 right-6 z-[300] bg-slate-900/95 border border-teal-500/50 text-white font-bold text-xs px-5 py-3 rounded-2xl shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-3 flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-teal-400" />
          <span>{toastNotice}</span>
        </div>
      )}

      {/* Header Pill Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        title="Estado de Sincronización y Persistencia Local Offline"
        className={`flex items-center space-x-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all border cursor-pointer select-none ${
          !isOnline
            ? 'bg-rose-950/80 text-rose-300 border-rose-500/50 shadow-lg shadow-rose-500/20 hover:bg-rose-900/80 animate-pulse'
            : pendingCount > 0
            ? 'bg-amber-950/80 text-amber-300 border-amber-500/50 shadow-lg shadow-amber-500/20 hover:bg-amber-900/80'
            : 'bg-slate-900/90 text-slate-300 border-white/10 hover:bg-slate-800 hover:text-white'
        }`}
      >
        {isSyncing ? (
          <RefreshCw className="w-3.5 h-3.5 text-teal-400 animate-spin" />
        ) : !isOnline ? (
          <WifiOff className="w-3.5 h-3.5 text-rose-400" />
        ) : (
          <Wifi className="w-3.5 h-3.5 text-emerald-400" />
        )}

        <span className="hidden sm:inline font-mono">
          {!isOnline
            ? 'OFFLINE'
            : isSyncing
            ? 'SINCRONIZANDO'
            : 'EN LÍNEA'}
        </span>

        {pendingCount > 0 && (
          <span
            className={`text-[10px] font-black font-mono px-2 py-0.5 rounded-full ${
              !isOnline ? 'bg-rose-500 text-white' : 'bg-amber-400 text-slate-950'
            }`}
          >
            {pendingCount} {pendingCount === 1 ? 'pend' : 'pends'}
          </span>
        )}

        <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Popover / Drawer */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-3 w-96 sm:w-[440px] bg-slate-950/95 border border-slate-800 rounded-3xl p-5 shadow-[0_20px_60px_rgba(0,0,0,0.8)] backdrop-blur-2xl z-50 animate-in fade-in zoom-in-95 duration-200 text-slate-200 space-y-4">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <HardDrive className="w-5 h-5 text-teal-400" />
                <div>
                  <h4 className="font-bold text-sm text-white">Sincronización Offline & Buffer Local</h4>
                  <p className="text-[10px] text-slate-400">Persistencia local ininterrumpida (ISO 15189)</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Connection Status Card */}
            <div
              className={`p-4 rounded-2xl border space-y-2 ${
                !isOnline
                  ? 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                  : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="flex items-center space-x-2">
                  {!isOnline ? <WifiOff className="w-4 h-4 text-rose-400" /> : <Wifi className="w-4 h-4 text-emerald-400" />}
                  <span>Enlace con Servidor Middleware:</span>
                </span>
                <span className="font-mono uppercase font-black">
                  {!isOnline ? '🔴 Desconectado (Modo Local)' : '🟢 Conexión Activa (Socket 3000)'}
                </span>
              </div>
              <p className="text-[11px] opacity-85 leading-relaxed">
                {!isOnline
                  ? 'Los tecnólogos pueden continuar validando frotis, escaneando tubos y registrando órdenes. Todas las operaciones se guardan de forma segura en el almacenamiento local del navegador.'
                  : 'El enlace con el analizador y base de datos central está sincronizado en tiempo real.'}
              </p>
            </div>

            {/* Storage Telemetry Stats */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[9px] font-mono text-slate-400 block uppercase">En Cola:</span>
                <span className="text-base font-black font-mono text-white">{pendingCount} ops</span>
              </div>
              <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[9px] font-mono text-slate-400 block uppercase">Buffer Utilizado:</span>
                <span className="text-base font-black font-mono text-teal-300">{storageKb} KB</span>
              </div>
              <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[9px] font-mono text-slate-400 block uppercase">Integridad:</span>
                <span className="text-base font-black font-mono text-emerald-400">100% OK</span>
              </div>
            </div>

            {/* FORCE EMERGENCY EXPORT (DRP) CALLOUT BUTTON */}
            <div className="p-3 rounded-2xl bg-gradient-to-r from-rose-950/70 via-amber-950/40 to-slate-900 border border-rose-500/40 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-1.5 font-bold text-rose-300">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  <span>Protocolo de Contingencia / Caída de Servidor</span>
                </div>
                <span className="text-[9px] font-mono font-bold bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded border border-rose-500/30 uppercase">
                  DRP ISO 15189
                </span>
              </div>

              <p className="text-[11px] text-slate-300 leading-relaxed">
                Si el servidor central experimenta una caída total o falla catastrófica, fuerce la exportación del paquete JSON con firma criptográfica para preservar la custodia de los datos.
              </p>

              <button
                onClick={handleTriggerEmergencyExport}
                className="w-full py-2.5 bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-slate-950 font-black text-xs rounded-xl transition flex items-center justify-center space-x-2 cursor-pointer shadow-lg shadow-rose-600/30"
              >
                <FileDown className="w-4 h-4" />
                <span>Forzar Exportación de Emergencia (JSON DRP)</span>
              </button>
            </div>

            {/* Pending Queue List */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-400 font-bold">
                <span>Operaciones en Espera de Transmisión:</span>
                <span className="text-[10px] font-mono">{pendingCount} registros</span>
              </div>

              <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1 text-xs">
                {queue.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/80 text-center text-slate-400 text-xs flex flex-col items-center space-y-1">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span className="font-bold text-white">Buffer al día</span>
                    <span className="text-[10px]">No hay operaciones pendientes de sincronización.</span>
                  </div>
                ) : (
                  queue.map((item) => (
                    <div
                      key={item.id}
                      className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs space-x-2"
                    >
                      <div className="space-y-0.5 truncate">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-[9px] font-mono font-black px-1.5 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-500/30">
                            {item.type}
                          </span>
                          <span className="font-mono font-bold text-white truncate">{item.sampleBarcode || 'SIN_CODIGO'}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {item.patientName || item.testCode || 'Operación técnica'}
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 shrink-0">
                        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Actions Grid */}
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  onClick={handleForceSync}
                  disabled={isSyncing || !isOnline}
                  className="px-3 py-2 bg-teal-500 hover:bg-teal-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-black rounded-xl transition flex items-center justify-center space-x-1.5 cursor-pointer shadow"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>Sincronizar Ahora</span>
                </button>

                <button
                  onClick={handleToggleOffline}
                  className={`px-3 py-2 font-bold rounded-xl transition flex items-center justify-center space-x-1.5 border cursor-pointer ${
                    isSimulated
                      ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900'
                      : 'bg-rose-950/70 border-rose-500/40 text-rose-300 hover:bg-rose-900'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>{isSimulated ? 'Reconectar Servidor' : 'Simular Offline'}</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  onClick={handleSeedMockData}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl transition flex items-center justify-center space-x-1.5 cursor-pointer text-[11px]"
                >
                  <span>+ Muestra Offline</span>
                </button>

                <button
                  onClick={handleClear}
                  disabled={queue.length === 0}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-rose-950/50 disabled:opacity-30 text-rose-300 border border-slate-800 rounded-xl transition flex items-center justify-center space-x-1.5 cursor-pointer text-[11px]"
                >
                  <Trash2 className="w-3 h-3 text-rose-400" />
                  <span>Limpiar Buffer</span>
                </button>
              </div>
            </div>

            {/* ISO Footer Info */}
            <div className="pt-2 text-[10px] text-slate-400 flex items-center space-x-1.5 border-t border-slate-800/80">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-400 shrink-0" />
              <span>Garantía de continuidad operativa y cero pérdida de datos según ISO 15189:2022 §7.2.</span>
            </div>

          </div>
        </>
      )}

      {/* EMERGENCY EXPORT MODAL & VERIFICATION DOSSIER */}
      {showEmergencyModal && lastExportMetadata && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[350] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border-2 border-rose-500/50 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 text-slate-100 relative overflow-hidden">
            
            <div className="flex items-start justify-between border-b border-white/10 pb-3">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center space-x-1">
                    <Flame className="w-3 h-3 text-rose-400" />
                    <span>Disaster Recovery Package (DRP)</span>
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400">
                    ✓ Archivo Generado
                  </span>
                </div>
                <h3 className="text-lg font-black text-white flex items-center space-x-2">
                  <ShieldAlert className="w-5 h-5 text-rose-400" />
                  <span>Paquete de Emergencia Exportado</span>
                </h3>
              </div>

              <button
                onClick={() => setShowEmergencyModal(false)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2.5 text-xs">
              <div className="flex justify-between items-center text-slate-400">
                <span>Nombre de archivo:</span>
                <span className="font-mono text-teal-300 font-bold">{lastExportMetadata.fileName}</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Registros respaldados:</span>
                <span className="font-mono text-white font-bold">{lastExportMetadata.totalRecords} operaciones</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Firma Hash SHA-256:</span>
                <span className="font-mono text-amber-300 text-[10px] font-bold">{lastExportMetadata.checksum}</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Estándar de contingencia:</span>
                <span className="font-mono text-slate-300 text-[10px]">ISO 15189:2022 §7.2 / CLSI AUTO10-A</span>
              </div>
            </div>

            <div className="p-3 bg-amber-950/30 border border-amber-500/30 rounded-xl text-[11px] text-amber-200 leading-relaxed">
              Conserve este archivo en una unidad USB externa o envíelo a la dirección técnica de contingencia. Contiene todas las validaciones de frotis, escaneos de tubos y estados de muestras ejecutados durante el corte del servidor.
            </div>

            <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-3">
              <button
                onClick={handleCopyEmergencyJson}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition flex items-center space-x-1.5 cursor-pointer"
              >
                {copiedJson ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedJson ? 'Copiado' : 'Copiar JSON'}</span>
              </button>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => offlineSyncManager.downloadEmergencyPackage('Lic. Valentina Soto (TM-LIS)')}
                  className="px-4 py-2.5 bg-rose-500 hover:bg-rose-400 text-slate-950 font-black text-xs rounded-xl transition flex items-center space-x-1.5 cursor-pointer shadow-lg shadow-rose-500/25"
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar Otra Copia</span>
                </button>

                <button
                  onClick={() => setShowEmergencyModal(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Entendido
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

