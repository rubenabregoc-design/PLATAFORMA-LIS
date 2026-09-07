import React, { useState, useEffect } from 'react';
import {
  X,
  DollarSign,
  CreditCard,
  Smartphone,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  ClipboardCheck,
  Receipt
} from 'lucide-react';
import { SupabaseService } from '../../../services/SupabaseService';
import { useLisStore } from '../../../store/useLisStore';

interface DailyCashClosingModalProps {
  onClose: () => void;
  onComplete: (closingData: any) => void;
}

const DailyCashClosingModal: React.FC<DailyCashClosingModalProps> = ({ onClose, onComplete }) => {
  const [totals, setTotals] = useState<any>(null);
  const [actualCash, setActualCash] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchTotals();
  }, []);

  const fetchTotals = async () => {
    try {
      const data = await SupabaseService.billing.getDailyTotals();
      setTotals(data);
      setActualCash(data.cash);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const difference = actualCash - totals.cash;
      const closingData = {
        branch_id: useLisStore.getState().currentBranch?.id || 'branch-central',
        total_expected: totals.total,
        total_actual: totals.total + difference,
        difference,
        cash_amount: actualCash,
        card_amount: totals.card,
        yappy_amount: totals.yappy,
        insurance_amount: totals.insurance,
        notes,
        status: (difference === 0 ? 'COMPLETED' : 'DISCREPANCY') as any
      };

      const result = await SupabaseService.billing.performCashClosing(closingData);
      onComplete({ ...closingData, id: result.id });
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return null;

  const difference = actualCash - totals.cash;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[150] flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col">
        <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <ClipboardCheck className="text-teal-400" size={24} />
            <div>
              <h3 className="text-lg font-black tracking-tight">Cierre de Caja Diario</h3>
              <p className="text-slate-400 text-[10px] uppercase font-bold">Consolidación de Métodos de Pago</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-8 space-y-8 flex-1 overflow-y-auto">
          {/* Method Breakdown */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Smartphone size={18} /></div>
                <span className="text-xs font-bold text-slate-600">Yappy</span>
              </div>
              <span className="font-black text-slate-800">${totals.yappy.toFixed(2)}</span>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg"><CreditCard size={18} /></div>
                <span className="text-xs font-bold text-slate-600">Tarjetas</span>
              </div>
              <span className="font-black text-slate-800">${totals.card.toFixed(2)}</span>
            </div>
          </div>

          {/* Cash Reconcilliation */}
          <div className="bg-slate-50 p-6 rounded-3xl border-2 border-slate-100 space-y-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg"><DollarSign size={18} /></div>
                <span className="font-black text-slate-700">Efectivo en Sistema</span>
              </div>
              <span className="text-xl font-black text-slate-900">${totals.cash.toFixed(2)}</span>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Efectivo Físico en Caja</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400 text-xl">$</span>
                <input
                  type="number"
                  value={actualCash}
                  onChange={(e) => setActualCash(parseFloat(e.target.value) || 0)}
                  className="w-full p-4 pl-10 bg-white border-2 border-slate-200 rounded-2xl text-2xl font-black text-slate-800 focus:outline-none focus:border-teal-500 transition-all"
                />
              </div>
            </div>

            {difference !== 0 && (
              <div className={`p-4 rounded-2xl border flex items-center gap-3 ${
                difference > 0 ? 'bg-blue-50 border-blue-100 text-blue-700' : 'bg-red-50 border-red-100 text-red-700'
              }`}>
                <AlertCircle size={20} />
                <div className="text-xs font-bold">
                  {difference > 0 ? 'Sobrante en caja:' : 'Faltante en caja:'} ${Math.abs(difference).toFixed(2)}
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Observaciones del Cierre</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detalle cualquier discrepancia o novedad..."
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-100"
              rows={3}
            />
          </div>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <div className="text-center">
            <p className="text-[10px] font-black text-slate-400 uppercase">Total a Liquidar</p>
            <p className="text-xl font-black text-slate-900">${(totals.total + difference).toFixed(2)}</p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-slate-900 text-white px-10 py-3 rounded-2xl font-black text-sm hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 flex items-center gap-2"
          >
            {saving ? 'PROCESANDO...' : (
              <>
                <ShieldCheck size={18} />
                EJECUTAR CIERRE
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DailyCashClosingModal;
