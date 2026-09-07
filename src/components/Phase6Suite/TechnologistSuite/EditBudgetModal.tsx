import React, { useState } from 'react';
import { X, Save, Target, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { SupabaseService } from '../../../services/SupabaseService';

interface EditBudgetModalProps {
  month: number;
  year: number;
  initialBudget: any;
  onClose: () => void;
  onComplete: () => void;
}

const EditBudgetModal: React.FC<EditBudgetModalProps> = ({ month, year, initialBudget, onClose, onComplete }) => {
  const [revenue, setRevenue] = useState(initialBudget.projected_revenue || 0);
  const [expenses, setExpenses] = useState(initialBudget.projected_expenses || 0);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await SupabaseService.billing.updateBudget({
        month,
        year,
        projected_revenue: revenue,
        projected_expenses: expenses,
        notes: `Presupuesto actualizado vía Dashboard`
      });
      onComplete();
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[150] flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-md w-full overflow-hidden">
        <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Target className="text-teal-400" size={24} />
            <div>
              <h3 className="text-lg font-black tracking-tight">Ajustar Presupuesto</h3>
              <p className="text-slate-400 text-[10px] uppercase font-bold">{new Date(year, month-1).toLocaleString('es-PA', { month: 'long', year: 'numeric' })}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={24} /></button>
        </div>

        <div className="p-8 space-y-6">
          <div className="space-y-4">
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Ingresos Proyectados ($)</label>
            <div className="relative">
              <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="number"
                value={revenue}
                onChange={e => setRevenue(parseFloat(e.target.value) || 0)}
                className="w-full p-4 pl-12 bg-slate-50 border-2 border-slate-100 rounded-2xl text-xl font-black text-slate-800 focus:outline-none focus:border-teal-500 transition-all"
              />
            </div>
          </div>

          <div className="space-y-4">
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Gastos Proyectados ($)</label>
            <div className="relative">
              <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="number"
                value={expenses}
                onChange={e => setExpenses(parseFloat(e.target.value) || 0)}
                className="w-full p-4 pl-12 bg-slate-50 border-2 border-slate-100 rounded-2xl text-xl font-black text-slate-800 focus:outline-none focus:border-red-500 transition-all"
              />
            </div>
          </div>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-3 text-slate-500 font-black text-xs uppercase tracking-widest hover:bg-slate-100 rounded-xl transition-all">Cancelar</button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-slate-900 text-white px-10 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 flex items-center gap-2"
          >
            <Save size={18} />
            {saving ? 'GUARDANDO...' : 'GUARDAR CAMBIOS'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditBudgetModal;
