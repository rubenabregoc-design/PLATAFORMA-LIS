import React, { useState, useEffect, useRef } from 'react';
import { Lock, Clock, ShieldCheck, RefreshCw, AlertTriangle, Play, Sparkles, ChevronDown, X } from 'lucide-react';

interface SessionInactivityTrackerProps {
  onLockSession?: () => void;
  timeoutSeconds?: number; // Default 300 (5 minutes)
}

export const SessionInactivityTracker: React.FC<SessionInactivityTrackerProps> = ({
  onLockSession,
  timeoutSeconds = 300
}) => {
  const [secondsLeft, setSecondsLeft] = useState<number>(timeoutSeconds);
  const [isPopoverOpen, setIsPopoverOpen] = useState<boolean>(false);
  const [lastResetTime, setLastResetTime] = useState<Date>(new Date());
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const lastActivityRef = useRef<number>(Date.now());

  const resetTimer = () => {
    lastActivityRef.current = Date.now();
    setSecondsLeft(timeoutSeconds);
    setLastResetTime(new Date());
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Listen to user activity to reset countdown
  useEffect(() => {
    const handleActivity = () => {
      lastActivityRef.current = Date.now();
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
    events.forEach((evt) => window.addEventListener(evt, handleActivity, { passive: true }));

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - lastActivityRef.current) / 1000);
      const remaining = Math.max(0, timeoutSeconds - elapsed);
      setSecondsLeft(remaining);

      if (remaining === 0 && onLockSession) {
        onLockSession();
      }
    }, 1000);

    return () => {
      events.forEach((evt) => window.removeEventListener(evt, handleActivity));
      clearInterval(interval);
    };
  }, [timeoutSeconds, onLockSession]);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const percent = Math.min(100, Math.max(0, (secondsLeft / timeoutSeconds) * 100));

  // Determine alert level
  const isUrgent = secondsLeft <= 60; // Less than 1 min
  const isWarning = secondsLeft > 60 && secondsLeft <= 120; // 1 to 2 mins

  const getProgressColor = () => {
    if (isUrgent) return 'bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.8)]';
    if (isWarning) return 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.6)]';
    return 'bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.5)]';
  };

  const getBadgeColor = () => {
    if (isUrgent) return 'bg-rose-950/80 border-rose-500/60 text-rose-300 animate-pulse';
    if (isWarning) return 'bg-amber-950/80 border-amber-500/60 text-amber-300';
    return 'bg-slate-900/90 border-white/10 text-slate-300 hover:border-teal-500/40 hover:text-teal-300';
  };

  const handleManualExtend = () => {
    resetTimer();
    showToast('✓ Sesión extendida (+5 minutos de actividad).');
  };

  const handleLockNow = () => {
    setIsPopoverOpen(false);
    if (onLockSession) {
      onLockSession();
    }
  };

  return (
    <div className="relative flex items-center">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-20 right-6 z-[300] bg-slate-900/95 border border-teal-500/50 text-white font-bold text-xs px-4 py-2.5 rounded-2xl shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-2 flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-teal-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Interactive Trigger Button */}
      <button
        onClick={() => setIsPopoverOpen(!isPopoverOpen)}
        title="Temporizador de Auto-Bloqueo de Sesión (5 min)"
        className={`flex items-center space-x-2 px-3 py-1.5 rounded-2xl border text-xs font-bold transition-all cursor-pointer select-none group relative overflow-hidden ${getBadgeColor()}`}
      >
        <div className="flex items-center space-x-1.5 relative z-10">
          <Lock className={`w-3.5 h-3.5 ${isUrgent ? 'text-rose-400 animate-bounce' : isWarning ? 'text-amber-400' : 'text-slate-400 group-hover:text-teal-400'}`} />
          <span className="font-mono font-bold tracking-tight text-[11px]">
            {formatTime(secondsLeft)}
          </span>
          <span className="text-[9px] uppercase tracking-wider opacity-60 hidden xl:inline">
            Bloqueo
          </span>
        </div>

        {/* Micro Progress Bar on Button Bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-950/60 overflow-hidden">
          <div
            className={`h-full transition-all duration-1000 ${getProgressColor()}`}
            style={{ width: `${percent}%` }}
          />
        </div>
      </button>

      {/* Ambient Continuous Header Hairline Progress Bar (Positioned under the button / header) */}
      <div className="absolute -bottom-2.5 left-0 right-0 h-0.5 pointer-events-none hidden sm:block">
        <div
          className={`h-full transition-all duration-1000 rounded-full ${getProgressColor()}`}
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Detailed Popover */}
      {isPopoverOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsPopoverOpen(false)} />
          <div className="absolute right-0 top-full mt-3 w-80 sm:w-96 bg-slate-950/95 border border-slate-800 rounded-3xl p-5 shadow-[0_20px_60px_rgba(0,0,0,0.85)] backdrop-blur-2xl z-50 animate-in fade-in zoom-in-95 duration-200 text-slate-200 space-y-4">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${
                  isUrgent
                    ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                    : isWarning
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                    : 'bg-teal-500/20 text-teal-400 border-teal-500/30'
                }`}>
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">Temporizador de Inactividad</h4>
                  <p className="text-[10px] text-slate-400">Protección de acceso desatendido (Ley 81 / ISO 15189)</p>
                </div>
              </div>
              <button
                onClick={() => setIsPopoverOpen(false)}
                className="w-7 h-7 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Countdown Big Display */}
            <div className={`p-4 rounded-2xl border text-center space-y-2 ${
              isUrgent
                ? 'bg-rose-950/40 border-rose-500/40'
                : isWarning
                ? 'bg-amber-950/40 border-amber-500/40'
                : 'bg-slate-900/90 border-slate-800'
            }`}>
              <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 block">
                Tiempo Restante Antes del Bloqueo:
              </span>
              <div className={`text-4xl font-black font-mono tracking-tight ${
                isUrgent ? 'text-rose-400 animate-pulse' : isWarning ? 'text-amber-300' : 'text-teal-300'
              }`}>
                {formatTime(secondsLeft)}
              </div>
              <span className="text-[11px] text-slate-400 block">
                {isUrgent
                  ? '⚠️ La sesión está por bloquearse. Mueva el cursor o pulse "Extender".'
                  : 'Cualquier interacción (teclado, mouse, escáner) reinicia el tiempo a 5:00 min.'}
              </span>

              {/* High-Resolution Progress Bar */}
              <div className="w-full bg-slate-950 rounded-full h-3 p-0.5 border border-white/10 mt-3 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${getProgressColor()}`}
                  style={{ width: `${percent}%` }}
                />
              </div>
              <div className="flex justify-between text-[9px] font-mono text-slate-500 pt-1">
                <span>0:00 (Bloqueo)</span>
                <span>{Math.round(percent)}% restante</span>
                <span>5:00 (Máximo)</span>
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={handleManualExtend}
                className="px-4 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black rounded-xl text-xs transition flex items-center justify-center space-x-1.5 cursor-pointer shadow"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Extender +5 Min</span>
              </button>

              <button
                onClick={handleLockNow}
                className="px-4 py-2.5 bg-slate-900 hover:bg-rose-950/60 hover:text-rose-300 hover:border-rose-500/40 text-slate-300 border border-slate-800 font-bold rounded-xl text-xs transition flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Bloquear Ahora</span>
              </button>
            </div>

            {/* Compliance Footer */}
            <div className="pt-2 text-[10px] text-slate-400 flex items-center space-x-1.5 border-t border-slate-800/80">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-400 shrink-0" />
              <span>Bloqueo automático obligatorio para proteger datos de salud de pacientes.</span>
            </div>

          </div>
        </>
      )}
    </div>
  );
};
