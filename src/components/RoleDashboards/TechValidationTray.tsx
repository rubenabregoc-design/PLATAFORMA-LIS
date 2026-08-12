import React, { useState } from 'react';
import { TestResult, Order } from '../../types';
import {
  CheckCircle2, AlertCircle, Edit3, Save, Printer,
  RotateCcw, ShieldCheck, Search, Filter, ChevronRight, X
} from 'lucide-react';

interface TechValidationTrayProps {
  results: TestResult[];
  orders: Order[];
  onUpdateResultValue: (resultId: string, newValue: string) => void;
  onValidateTechnical: (resultId: string) => void;
  onUnvalidateTechnical?: (resultId: string) => void;
  onPreliminaryValidate?: (resultId: string) => void;
  onPrintOrder?: (orderId: string) => void;
}

export const TechValidationTray: React.FC<TechValidationTrayProps> = ({
  results,
  orders,
  onUpdateResultValue,
  onValidateTechnical,
  onPrintOrder
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState<string>('');
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'CRITICAL'>('ALL');

  const filteredResults = results.filter(r => {
    if (filter === 'PENDING') return r.status === 'PENDIENTE';
    if (filter === 'CRITICAL') return r.flag?.includes('CRITICO');
    return true;
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Search & Filter Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-4 top-3.5" />
          <input
            type="text"
            placeholder="Buscar por orden, paciente o parámetro..."
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-11 pr-4 py-3 text-sm text-white focus:outline-none focus:border-teal-500/50"
          />
        </div>

        <div className="flex items-center space-x-2 p-1 bg-slate-900 border border-slate-800 rounded-2xl shrink-0">
          {[
            { id: 'ALL', label: 'Todos' },
            { id: 'PENDING', label: 'Pendientes' },
            { id: 'CRITICAL', label: 'Críticos' }
          ].map(btn => (
            <button
              key={btn.id}
              onClick={() => setFilter(btn.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                filter === btn.id ? 'bg-teal-500 text-slate-950 shadow-lg' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Validation Workspace */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[1000px]">
            <thead>
              <tr className="bg-slate-950/50 text-slate-500 border-b border-slate-800 font-black uppercase tracking-[0.15em] text-[10px]">
                <th className="px-6 py-5">Paciente / Orden</th>
                <th className="px-6 py-5">Análisis</th>
                <th className="px-6 py-5 text-center">Valor</th>
                <th className="px-6 py-5">Referencia</th>
                <th className="px-6 py-5 text-center">Estado</th>
                <th className="px-6 py-5 text-right">Acciones Técnicas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredResults.map((res) => {
                const order = orders.find(o => o.id === res.orderId);
                const isCritical = res.flag?.includes('CRITICO');
                const isEditing = editingId === res.id;

                return (
                  <tr key={res.id} className={`group hover:bg-white/[0.02] transition-colors ${isCritical ? 'bg-rose-500/[0.03]' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="font-black text-white text-sm truncate max-w-[180px]">{order?.patientName}</div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">{order?.orderNumber}</div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-300">{res.parameterName}</div>
                      <div className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded w-fit mt-1 font-mono">{res.source}</div>
                    </td>

                    <td className="px-6 py-4 text-center">
                      {isEditing ? (
                        <input
                          type="text"
                          value={tempValue}
                          autoFocus
                          onChange={(e) => setTempValue(e.target.value)}
                          className="bg-slate-950 border border-teal-500/50 rounded-lg px-2 py-1 text-sm font-mono text-center w-20 text-teal-400 focus:outline-none"
                        />
                      ) : (
                        <div className={`text-base font-black font-mono ${isCritical ? 'text-rose-400' : 'text-white'}`}>
                          {res.value} <span className="text-[10px] font-normal text-slate-500">{res.unit}</span>
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <div className="text-[11px] text-slate-500 font-mono italic">{res.refRangeText}</div>
                    </td>

                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter border ${
                        res.status === 'VALIDADO_TEC'
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                          : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                      }`}>
                        {res.status.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        {isEditing ? (
                          <button
                            onClick={() => { onUpdateResultValue(res.id, tempValue); setEditingId(null); }}
                            className="p-2 bg-emerald-500 text-slate-950 rounded-xl hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => { setEditingId(res.id); setTempValue(res.value); }}
                            className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
                            title="Editar Valor"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          className="p-2 text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-xl transition-all"
                          title="Validación Preliminar"
                        >
                          <ShieldCheck className="w-4 h-4 opacity-50" />
                        </button>

                        {res.status === 'VALIDADO_TEC' ? (
                          <button
                            className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
                            title="Desvalidar"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => onValidateTechnical(res.id)}
                            className="p-2 bg-teal-500/10 text-teal-400 border border-teal-500/20 hover:bg-teal-500 hover:text-slate-950 rounded-xl transition-all"
                            title="Validar"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          onClick={() => onPrintOrder && onPrintOrder(res.orderId)}
                          className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
                          title="Imprimir"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
