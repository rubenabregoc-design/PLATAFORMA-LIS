import React, { useState } from 'react';
import {
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  CreditCard,
  DollarSign,
  ShieldCheck,
  Send,
  X,
  Sparkles,
  HelpCircle,
  Clock,
  ArrowRight,
  Beaker,
  Lock,
  Activity
} from 'lucide-react';

interface ReflexApprovalPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientName: string;
  patientNationalId: string;
  sampleBarcode: string;
  initialTestName: string;
  initialTestValue: string;
  suggestedReflexTestName: string;
  suggestedReflexCost: number;
  onPaymentApproved: (paymentReceipt: string) => void;
}

export const ReflexApprovalPortalModal: React.FC<ReflexApprovalPortalModalProps> = ({
  isOpen,
  onClose,
  patientName,
  patientNationalId,
  sampleBarcode,
  initialTestName,
  initialTestValue,
  suggestedReflexTestName,
  suggestedReflexCost,
  onPaymentApproved
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'YAPPI' | 'TARJETA' | 'ASEGURADORA'>('YAPPI');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [receiptNumber, setReceiptNumber] = useState('');

  if (!isOpen) return null;

  const handleExecutePayment = () => {
    setIsProcessingPayment(true);
    setTimeout(() => {
      const generatedReceipt = `POS-2026-${Math.floor(100000 + Math.random() * 900000)}`;
      setReceiptNumber(generatedReceipt);
      setIsProcessingPayment(false);
      setPaymentSuccess(true);
      onPaymentApproved(generatedReceipt);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Smartphone Mockup Container */}
      <div className="bg-slate-900 border-2 border-teal-500/40 rounded-[38px] max-w-sm w-full overflow-hidden shadow-2xl relative text-slate-100 font-sans my-auto">

        {/* Smartphone Camera Notch & Top Bar */}
        <div className="bg-slate-950 px-6 py-3 flex justify-between items-center border-b border-slate-800 text-[10px] font-mono text-slate-400">
          <div className="flex items-center space-x-1.5">
            <Smartphone className="w-3.5 h-3.5 text-teal-400" />
            <span>Vista Celular del Paciente</span>
          </div>
          <div className="w-16 h-3 bg-slate-900 rounded-full mx-auto"></div>
          <button onClick={onClose} className="hover:text-white transition cursor-pointer">
            <X size={16} />
          </button>
        </div>

        {/* Content Container */}
        <div className="p-5 space-y-5">

          {/* Header Brand */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center">
                <Activity className="w-4 h-4 text-teal-400 animate-pulse" />
              </div>
              <div>
                <h3 className="font-bold text-xs text-white">Laboratorio San José</h3>
                <p className="text-[10px] text-slate-400">Portal de Pre-Autorización LIS</p>
              </div>
            </div>

            <span className="bg-emerald-500/20 text-emerald-300 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
              Muestra en Lab OK
            </span>
          </div>

          {!paymentSuccess ? (
            <div className="space-y-4">

              {/* Rationale Card */}
              <div className="bg-slate-950/90 border border-slate-800 p-3.5 rounded-2xl space-y-2 text-xs">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                  <span className="font-bold text-slate-300">Detalles del Paciente</span>
                  <span className="font-mono text-[10px] text-teal-400">{sampleBarcode}</span>
                </div>

                <p className="text-white font-bold">{patientName}</p>
                <p className="text-[11px] text-slate-400 font-mono">Cédula: {patientNationalId}</p>

                <div className="bg-slate-900/90 p-2.5 rounded-xl border border-teal-500/30 space-y-1 mt-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">{initialTestName}:</span>
                    <strong className="text-rose-400 font-bold">{initialTestValue} (Elevado)</strong>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight pt-1 border-t border-slate-800">
                    Su resultado sugiere evaluar confirmación diagnóstica sin necesidad de regresar al laboratorio.
                  </p>
                </div>
              </div>

              {/* Suggested Test Card & Price */}
              <div className="p-4 bg-gradient-to-br from-teal-950/40 via-slate-900 to-slate-950 border border-teal-500/40 rounded-2xl space-y-2 shadow-lg">
                <div className="text-[10px] uppercase font-bold text-teal-300 tracking-wider flex items-center space-x-1">
                  <Sparkles size={12} />
                  <span>Examen Confirmatorio Sugerido</span>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-black text-sm text-white">{suggestedReflexTestName}</h4>
                    <p className="text-[10px] text-slate-400">Procesado en la misma muestra de sangre</p>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-black text-emerald-400 font-mono">B/. {suggestedReflexCost.toFixed(2)}</span>
                    <span className="text-[9px] text-slate-500 block">Costo Adicional</span>
                  </div>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-300 block">Seleccionar Método de Pago:</label>
                <div className="grid grid-cols-3 gap-1.5 text-[10px] font-bold">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('YAPPI')}
                    className={`p-2 rounded-xl border transition cursor-pointer text-center ${
                      paymentMethod === 'YAPPI'
                        ? 'bg-teal-500 text-slate-950 border-teal-400 font-black shadow'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    📲 Yappi
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('TARJETA')}
                    className={`p-2 rounded-xl border transition cursor-pointer text-center ${
                      paymentMethod === 'TARJETA'
                        ? 'bg-teal-500 text-slate-950 border-teal-400 font-black shadow'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    💳 Tarjeta
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('ASEGURADORA')}
                    className={`p-2 rounded-xl border transition cursor-pointer text-center ${
                      paymentMethod === 'ASEGURADORA'
                        ? 'bg-teal-500 text-slate-950 border-teal-400 font-black shadow'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    🏥 Seguro
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={handleExecutePayment}
                  disabled={isProcessingPayment}
                  className="w-full py-3 bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-500 hover:from-teal-300 hover:to-emerald-300 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition shadow-lg shadow-teal-500/25 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                >
                  {isProcessingPayment ? (
                    <span>Procesando Pago POS...</span>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      <span>Aprobar y Pagar B/. {suggestedReflexCost.toFixed(2)}</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-[10px] font-bold rounded-xl transition cursor-pointer border border-slate-800"
                >
                  No Autorizar (Entregar solo TSH)
                </button>
              </div>
            </div>
          ) : (
            /* PAYMENT SUCCESS CONFIRMATION STATE */
            <div className="py-6 space-y-4 text-center animate-in zoom-in-95 duration-300">
              <div className="w-16 h-16 bg-emerald-500/20 border-2 border-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-2xl">
                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
              </div>

              <div className="space-y-1">
                <h3 className="font-black text-lg text-white">¡Pago Autorizado con Éxito!</h3>
                <p className="text-xs text-slate-300">Recibo Digital N° <strong className="font-mono text-teal-300">{receiptNumber}</strong></p>
              </div>

              <div className="p-3.5 bg-slate-950 border border-emerald-500/30 rounded-2xl text-left space-y-2 text-xs">
                <div className="flex items-center space-x-2 text-emerald-400 font-bold text-[11px]">
                  <ShieldCheck size={16} />
                  <span>Notificación Enviada al Tecnólogo (Modo 2)</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Su muestra <strong className="text-white font-mono">{sampleBarcode}</strong> ha sido marcada en la estación de laboratorio para **Verificación de Volumen de Suero por el Tecnólogo Médico** antes de ser procesada.
                </p>
              </div>

              <button
                onClick={onClose}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Entendido • Cerrar
              </button>
            </div>
          )}

          {/* Footer Security Badge */}
          <div className="text-center text-[9px] text-slate-500 flex items-center justify-center space-x-1 pt-1 border-t border-slate-800/80">
            <Lock size={12} className="text-teal-400" />
            <span>Pasarela POS Cifrada SSL • AbregoTech LIS</span>
          </div>
        </div>
      </div>
    </div>
  );
};
