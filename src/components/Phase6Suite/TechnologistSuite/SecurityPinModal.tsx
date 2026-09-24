import React, { useState } from 'react';
import { Lock, ShieldCheck, X, AlertCircle } from 'lucide-react';
import { SupabaseService } from '../../../services/SupabaseService';

interface SecurityPinModalProps {
  onSuccess: () => void;
  onCancel: () => void;
  actionTitle: string;
}

const SecurityPinModal: React.FC<SecurityPinModalProps> = ({ onSuccess, onCancel, actionTitle }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(false);

    const isValid = await SupabaseService.security.verifyPin(pin);
    if (isValid) {
      onSuccess();
    } else {
      setError(true);
      setPin('');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Lock size={20} className="text-teal-400" />
            <span className="font-bold text-sm uppercase tracking-widest">Firma Electrónica</span>
          </div>
          <button onClick={onCancel} className="text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 text-center" noValidate>
          <ShieldCheck size={48} className="mx-auto text-slate-200 mb-4" />
          <h3 className="text-lg font-black text-slate-800 mb-2">Autorizar Acción</h3>
          <p className="text-xs text-slate-500 mb-6 font-medium uppercase tracking-tight">{actionTitle}</p>

          <div onContextMenu={(e) => e.preventDefault()}>
            <input
              type="password"
              inputMode="numeric"
              autoComplete="new-password"
              value={'•'.repeat(pin.length)}
              onChange={(e) => {
                const rawVal = e.target.value;
                const prevLen = pin.length;
                if (rawVal.length < prevLen) {
                  setPin(pin.slice(0, rawVal.length));
                } else {
                  const added = rawVal.replace(/•/g, '').replace(/\D/g, '');
                  if (added) {
                    setPin((prev) => (prev + added).slice(0, 4));
                  }
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Backspace') {
                  e.preventDefault();
                  setPin((prev) => prev.slice(0, -1));
                }
              }}
              onPaste={(e) => {
                e.preventDefault();
                const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
                if (pasted) {
                  setPin(pasted);
                }
              }}
              placeholder="••••"
              maxLength={4}
              autoFocus
              className={`w-full p-4 bg-slate-100 border-2 rounded-2xl text-center text-2xl font-black tracking-[1em] focus:outline-none transition-all ${
                error ? 'border-red-500 animate-shake' : 'border-transparent focus:border-teal-500'
              }`}
            />
          </div>

          {error && (
            <div className="mt-4 flex items-center justify-center gap-2 text-red-600 text-xs font-bold">
              <AlertCircle size={14} />
              PIN Incorrecto. Intente de nuevo.
            </div>
          )}

          <button
            type="submit"
            disabled={pin.length < 4 || loading}
            className="w-full mt-8 bg-slate-900 text-white py-4 rounded-2xl font-black text-sm hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 disabled:opacity-50"
          >
            {loading ? 'VERIFICANDO...' : 'CONFIRMAR FIRMA'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SecurityPinModal;
