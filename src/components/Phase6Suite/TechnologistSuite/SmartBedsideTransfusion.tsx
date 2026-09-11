import React, { useState } from 'react';
import {
  QrCode, ShieldAlert, AlertTriangle, CheckCircle2, Lock, Flame,
  Search, Microscope, FileText, Sparkles, Filter, Droplets, HeartPulse, User, Clock
} from 'lucide-react';

export const SmartBedsideTransfusion: React.FC = () => {
  const [scannedPatientId, setScannedPatientId] = useState('8-812-4432');
  const [scannedUnitCode, setScannedUnitCode] = useState('PGRE-2026-0812');
  const [operatorNurse, setOperatorNurse] = useState('Enf. María Valdés');

  const [verificationStatus, setVerificationStatus] = useState<'IDLE' | 'MATCHED_VERIFIED' | 'MISMATCH_BLOCKED'>('MATCHED_VERIFIED');

  const handleVerifyBedsideMatch = (e: React.FormEvent) => {
    e.preventDefault();

    if (scannedPatientId.trim() === '8-812-4432' && scannedUnitCode.trim() === 'PGRE-2026-0812') {
      setVerificationStatus('MATCHED_VERIFIED');
      window.dispatchEvent(
        new CustomEvent('lis-global-toast', {
          detail: { message: '✓ VERIFICACIÓN A PIE DE CAMA EXITOSA: Paciente y Unidad 100% Compatibles. Transfusión Autorizada.', type: 'success' }
        })
      );
    } else {
      setVerificationStatus('MISMATCH_BLOCKED');
      window.dispatchEvent(
        new CustomEvent('lis-global-toast', {
          detail: { message: '🚨 ALERTA CRÍTICA: INCOMPATIBILIDAD O DIVERGENCIA DETECTADA. TRANSFUSIÓN BLOQUEADA.', type: 'error', duration: 6000 }
        })
      );
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-slate-100">

      {/* Title Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 bg-gradient-to-tr from-rose-600 to-amber-500 rounded-2xl flex items-center justify-center text-slate-950 font-black shadow-lg shadow-rose-600/20">
            <QrCode className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl sm:text-2xl font-black text-white">Smart Bedside Transfusion — Verificación a Pie de Cama</h2>
              <span className="bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase">
                Estándar Ciudad de la Salud Panamá
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Escaneo triple obligatorio por código de barras / QR / RFID (Pulsera Paciente + Unidad ISBT 128 + Firma Operador) para prevenir errores de transfusión.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 bg-slate-950 px-4 py-2.5 rounded-2xl border border-rose-500/30 text-xs font-mono font-bold text-rose-300">
          <ShieldAlert className="w-4 h-4 text-rose-400" />
          <span>Trazabilidad 360° Activa</span>
        </div>
      </div>

      {/* Bedside Scanner Verification Console */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">

        <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
            <QrCode className="w-5 h-5 text-rose-400" />
            <span>Escáner de Verificación de Seguridad Transfusional</span>
          </h3>
          <span className="text-[10px] font-mono text-cyan-300 bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/30">
            Cama: UCI-02 • Sr. Fernando Abrego (O+)
          </span>
        </div>

        <form onSubmit={handleVerifyBedsideMatch} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-slate-300">1. Escanear Pulsera Paciente (Cédula/ID)</label>
            <input
              type="text"
              required
              value={scannedPatientId}
              onChange={(e) => setScannedPatientId(e.target.value)}
              placeholder="Escanee QR de pulsera..."
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white font-mono font-bold focus:outline-none focus:border-rose-400"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-slate-300">2. Escanear Unidad ISBT 128</label>
            <input
              type="text"
              required
              value={scannedUnitCode}
              onChange={(e) => setScannedUnitCode(e.target.value)}
              placeholder="Escanee código ISBT 128..."
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white font-mono font-bold focus:outline-none focus:border-rose-400"
            />
          </div>

          <div className="space-y-1.5 flex flex-col justify-end">
            <button
              type="submit"
              className="w-full py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs transition shadow-lg shadow-rose-600/30 cursor-pointer flex items-center justify-center space-x-2"
            >
              <QrCode className="w-4 h-4" />
              <span>Verificar Compatibilidad A Pie de Cama</span>
            </button>
          </div>
        </form>

        {/* Verification Status Output */}
        {verificationStatus === 'MATCHED_VERIFIED' && (
          <div className="bg-emerald-950/40 border-2 border-emerald-500/60 rounded-3xl p-6 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/40">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-sm font-black text-emerald-300 uppercase tracking-wider">
                  ✓ VERIFICACIÓN DE SEGURIDAD APROBADA
                </h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  El paciente <strong className="text-white">Sr. Fernando Abrego (O+)</strong> y la unidad <strong className="text-rose-300">PGRE-2026-0812 (O+)</strong> son 100% compatibles. Transfusión autorizada.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                window.dispatchEvent(
                  new CustomEvent('lis-global-toast', {
                    detail: { message: '✓ Transfusión Iniciada a Pie de Cama. Monitoreo de signos vitales registrado.', type: 'success' }
                  })
                );
              }}
              className="px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition shadow-lg shadow-emerald-500/30 cursor-pointer shrink-0"
            >
              Iniciar Transfusión Cama UCI-02
            </button>
          </div>
        )}

        {verificationStatus === 'MISMATCH_BLOCKED' && (
          <div className="bg-rose-950/60 border-2 border-rose-500 rounded-3xl p-6 shadow-2xl flex items-center space-x-4 animate-pulse">
            <div className="p-3 bg-rose-500/20 text-rose-400 rounded-2xl border border-rose-500/40">
              <Lock className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-sm font-black text-rose-300 uppercase tracking-wider">
                🚨 TRANSFUSIÓN BLOQUEADA: DIVERGENCIA DETECTADA
              </h4>
              <p className="text-xs text-rose-200 mt-0.5">
                Los datos escaneados no coinciden con la reserva asignada al paciente. Por seguridad del paciente, la unidad no puede ser transfundida.
              </p>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
