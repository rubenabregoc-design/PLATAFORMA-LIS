import React, { useState, useEffect } from 'react';
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  AlertOctagon,
  TestTube,
  ShieldCheck,
  Zap,
  Info,
  ChevronRight,
  RotateCcw,
  ArrowRight,
  Layers,
  Thermometer,
  FileWarning,
  Activity,
  X,
  Sparkles,
  ExternalLink,
  Flame,
  Check
} from 'lucide-react';
import { Specimen } from '../types';
import {
  evaluateSampleIntegrity,
  SampleIntegrityEvaluation,
  ISO_STABILITY_RULES,
  formatMinutes
} from '../utils/sampleIntegrityEngine';
import { offlineSyncManager } from '../utils/offlineSyncEngine';

interface SampleIntegrityBadgeProps {
  specimen?: Partial<Specimen> & { barcode: string; tubeType?: string };
  phlebotomyTime?: string;
  tubeType?: string;
  barcode?: string;
  isCompact?: boolean;
  showModalOnClick?: boolean;
  onUpdateSpecimen?: (updated: Partial<Specimen>) => void;
}

export const SampleIntegrityBadge: React.FC<SampleIntegrityBadgeProps> = ({
  specimen,
  phlebotomyTime,
  tubeType,
  barcode = 'BC-SAMPLE',
  isCompact = false,
  showModalOnClick = true,
  onUpdateSpecimen
}) => {
  const [now, setNow] = useState<Date>(new Date());
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Update timer tick every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const specObject: Partial<Specimen> & { barcode: string; tubeType?: string } = specimen || {
    barcode,
    tubeType: tubeType || 'SUERO_ROJO',
    phlebotomyTime: phlebotomyTime,
    collectedAt: phlebotomyTime
  };

  const evaluation: SampleIntegrityEvaluation = evaluateSampleIntegrity(specObject, now);

  if (isCompact) {
    return (
      <>
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (showModalOnClick) setIsModalOpen(true);
          }}
          title={`Estado de Integridad ISO 15189: ${evaluation.statusLabel} (${evaluation.elapsedFormatted} desde flebotomía)`}
          className={`inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-md border text-[10px] font-mono font-bold transition-all cursor-pointer ${
            evaluation.status === 'CRITICO_EXPIRADO'
              ? 'bg-rose-500/20 text-rose-300 border-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)] animate-pulse'
              : evaluation.status === 'ALERTA'
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/60'
              : evaluation.status === 'ESTABILIZADO_SEPARADO'
              ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
              : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
          }`}
        >
          <Clock className="w-3 h-3 shrink-0" />
          <span>{evaluation.elapsedFormatted}</span>
          <span className="text-[8px] opacity-75">/ {formatMinutes(evaluation.maxAllowedMinutes)}</span>
          {evaluation.status === 'CRITICO_EXPIRADO' && <AlertOctagon className="w-3 h-3 text-rose-400 shrink-0" />}
        </button>

        {isModalOpen && (
          <SampleIntegrityModal
            specimen={specObject}
            evaluation={evaluation}
            onClose={() => setIsModalOpen(false)}
            onUpdateSpecimen={onUpdateSpecimen}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div
        onClick={() => {
          if (showModalOnClick) setIsModalOpen(true);
        }}
        className={`p-3 rounded-2xl border transition-all cursor-pointer ${
          evaluation.status === 'CRITICO_EXPIRADO'
            ? 'bg-rose-950/30 border-rose-500/60 shadow-[0_0_15px_rgba(244,63,94,0.25)] ring-1 ring-rose-500/30'
            : evaluation.status === 'ALERTA'
            ? 'bg-amber-950/20 border-amber-500/40 shadow-sm'
            : 'bg-slate-900/60 border-white/5 hover:border-teal-500/30'
        }`}
      >
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center space-x-2">
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: evaluation.rule.colorHex }}
            />
            <span className="text-[11px] font-black text-slate-200 uppercase tracking-tight">
              {evaluation.rule.displayName.split('(')[0]}
            </span>
          </div>

          <span className={`text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded-full border ${evaluation.statusBadgeColor}`}>
            {evaluation.statusLabel}
          </span>
        </div>

        {/* Timeline Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] font-mono text-slate-400">
            <span>Flebotomía: <strong className="text-slate-200">{evaluation.elapsedFormatted}</strong> transcurridos</span>
            <span>Límite ISO: <strong className="text-teal-300">{formatMinutes(evaluation.maxAllowedMinutes)}</strong></span>
          </div>
          <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-white/5">
            <div
              className={`h-full transition-all duration-500 ${evaluation.progressBarColor}`}
              style={{ width: `${Math.min(100, Math.round(evaluation.fractionUsed * 100))}%` }}
            />
          </div>
        </div>

        {/* Warning chip if close or expired */}
        {evaluation.deviationSummary && (
          <div className="mt-2 text-[10px] font-mono text-rose-300/90 flex items-start space-x-1.5 bg-rose-500/10 p-1.5 rounded-lg border border-rose-500/20">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
            <span className="line-clamp-2">{evaluation.deviationSummary}</span>
          </div>
        )}
      </div>

      {isModalOpen && (
        <SampleIntegrityModal
          specimen={specObject}
          evaluation={evaluation}
          onClose={() => setIsModalOpen(false)}
          onUpdateSpecimen={onUpdateSpecimen}
        />
      )}
    </>
  );
};

interface SampleIntegrityModalProps {
  specimen: Partial<Specimen> & { barcode: string; tubeType?: string };
  evaluation: SampleIntegrityEvaluation;
  onClose: () => void;
  onUpdateSpecimen?: (updated: Partial<Specimen>) => void;
}

export const SampleIntegrityModal: React.FC<SampleIntegrityModalProps> = ({
  specimen,
  evaluation,
  onClose,
  onUpdateSpecimen
}) => {
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleMarkCentrifuged = () => {
    const nowIso = new Date().toISOString();
    if (onUpdateSpecimen) {
      onUpdateSpecimen({
        ...specimen,
        centrifugedAt: nowIso,
        isSeparated: true,
        status: 'EN_ANALIZADOR'
      });
    }
    offlineSyncManager.enqueue({
      type: 'SAMPLE_INTEGRITY_ACTION',
      sampleBarcode: evaluation.barcode,
      payload: {
        action: 'CENTRIFUGED_SEPARATED',
        timestamp: nowIso,
        tubeType: evaluation.rule.tubeType
      }
    });
    showToast('✓ Muestra marcada como CENTRIFUGADA & SEPARADA. Estabilidad sellada y guardada en buffer.');
  };

  const handleMarkInAnalyzer = () => {
    const nowIso = new Date().toISOString();
    if (onUpdateSpecimen) {
      onUpdateSpecimen({
        ...specimen,
        processedAt: nowIso,
        status: 'EN_ANALIZADOR'
      });
    }
    offlineSyncManager.enqueue({
      type: 'SAMPLE_INTEGRITY_ACTION',
      sampleBarcode: evaluation.barcode,
      payload: {
        action: 'LOADED_INTO_ANALYZER',
        timestamp: nowIso,
        tubeType: evaluation.rule.tubeType
      }
    });
    showToast('✓ Muestra cargada al analizador. Tiempo preanalítico sellado en buffer.');
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-300">
      <div className="bg-slate-900 border border-white/10 rounded-[2.5rem] max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden text-slate-100">
        
        {/* Background glow */}
        <div
          className="absolute -top-24 -right-24 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ backgroundColor: evaluation.rule.colorHex }}
        />

        {/* Header */}
        <div className="flex items-start justify-between border-b border-white/10 pb-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-teal-500/10 text-teal-400 border border-teal-500/20">
                Protocolo Preanalítico ISO 15189:2022
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                Código Tubo: <strong className="text-white">{evaluation.barcode}</strong>
              </span>
            </div>
            <h2 className="text-xl font-black tracking-tight text-white flex items-center space-x-2">
              <TestTube className="w-5 h-5 text-teal-400" />
              <span>Estado de Integridad de la Muestra</span>
            </h2>
            <p className="text-xs text-slate-400">
              Rastreo cinético de estabilidad desde la flebotomía hasta la entrada al analizador.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toast alert inside modal */}
        {toast && (
          <div className="p-3 bg-teal-500/20 border border-teal-500 text-teal-200 text-xs font-mono rounded-xl animate-in fade-in">
            {toast}
          </div>
        )}

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-white/5 space-y-1">
            <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Flebotomía</div>
            <div className="text-lg font-black text-white font-mono">{evaluation.elapsedFormatted}</div>
            <div className="text-[8px] text-slate-400">Tiempo transcurrido</div>
          </div>

          <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-white/5 space-y-1">
            <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Ventana ISO</div>
            <div className="text-lg font-black text-teal-400 font-mono">{formatMinutes(evaluation.maxAllowedMinutes)}</div>
            <div className="text-[8px] text-slate-400">Tolerancia máx.</div>
          </div>

          <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-white/5 space-y-1">
            <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Remanente</div>
            <div className={`text-lg font-black font-mono ${evaluation.status === 'CRITICO_EXPIRADO' ? 'text-rose-400' : 'text-emerald-400'}`}>
              {evaluation.remainingFormatted}
            </div>
            <div className="text-[8px] text-slate-400">Antes de degradación</div>
          </div>

          <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-white/5 space-y-1">
            <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Consumo Ventana</div>
            <div className="text-lg font-black text-amber-400 font-mono">
              {Math.round(evaluation.fractionUsed * 100)}%
            </div>
            <div className="text-[8px] text-slate-400">Índice cinético</div>
          </div>
        </div>

        {/* Progress Bar with Milestones */}
        <div className="bg-slate-950/80 p-4 rounded-2xl border border-white/5 space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-slate-300 flex items-center space-x-1.5">
              <Activity className="w-4 h-4 text-teal-400" />
              <span>Cinética Preanalítica (ISO / CLSI GP44-A4)</span>
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black font-mono border ${evaluation.statusBadgeColor}`}>
              {evaluation.statusLabel}
            </span>
          </div>

          <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-white/10 p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-700 ${evaluation.progressBarColor}`}
              style={{ width: `${Math.min(100, Math.round(evaluation.fractionUsed * 100))}%` }}
            />
          </div>

          {/* Timeline Nodes */}
          <div className="grid grid-cols-3 text-[10px] font-mono text-slate-400 pt-1">
            <div className="text-left">
              <div className="font-bold text-slate-200">1. Flebotomía</div>
              <div className="text-[9px] text-slate-500">0 min (Extracción)</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-slate-200">2. Transporte & Recepción</div>
              <div className="text-[9px] text-teal-400">~{evaluation.transitMinutes} min</div>
            </div>
            <div className="text-right">
              <div className="font-bold text-slate-200">3. Centrifugación/Análisis</div>
              <div className="text-[9px] text-amber-400">Límite {formatMinutes(evaluation.maxAllowedMinutes)}</div>
            </div>
          </div>
        </div>

        {/* ISO Standard Reference & Tube Specs */}
        <div className="bg-slate-800/40 p-4 rounded-2xl border border-white/5 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-300">Normativa Técnica:</span>
            <span className="font-mono text-teal-400 font-bold">{evaluation.rule.isoStandardRef}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-300">Guía CLSI:</span>
            <span className="font-mono text-slate-400">{evaluation.rule.clsiGuideline}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-300">Analitos Críticos Vulnerables:</span>
            <span className="font-mono text-rose-300">{evaluation.rule.criticalAnalytesAffected.join(', ')}</span>
          </div>
        </div>

        {/* Biological Degradation Risk Table */}
        <div className="space-y-2">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>Mecanismos de Degradación Biológica Preanalítica</span>
          </h4>

          <div className="space-y-2">
            {evaluation.activeBiases.map((bias, idx) => (
              <div key={idx} className="bg-slate-950/60 p-3 rounded-xl border border-white/5 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200">{bias.analyte}</span>
                  <span className="text-[9px] font-mono px-2 py-0.2 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    Riesgo Preanalítico
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">{bias.biasDescription}</p>
                <div className="text-[10px] text-amber-400 font-mono">
                  Impacto Clínico: <span className="text-slate-300 font-sans">{bias.clinicalImpact}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Bar for Technologists */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-white/10">
          <div className="text-[11px] text-slate-400 flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0" />
            <span>Acción Técnica Inmediata:</span>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <button
              onClick={handleMarkCentrifuged}
              className="px-3.5 py-2 rounded-xl bg-teal-500/20 text-teal-300 hover:bg-teal-500/30 border border-teal-500/40 text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Registrar Centrifugación</span>
            </button>
            <button
              onClick={handleMarkInAnalyzer}
              className="px-3.5 py-2 rounded-xl bg-teal-500 text-slate-950 hover:bg-teal-400 text-xs font-black transition flex items-center space-x-1.5 cursor-pointer shadow-lg shadow-teal-500/20"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Cargar al Analizador</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
