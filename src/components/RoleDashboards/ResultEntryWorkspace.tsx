import React, { useState } from 'react';
import { Order, TestResult, Patient, Analyzer } from '../../types';
import {
  User, FileText, CheckCircle2, AlertTriangle, ShieldCheck,
  Printer, RotateCcw, Save, Trash2, Plus, Info, Lock,
  History, MessageSquare, Paperclip, Barcode, ChevronRight, Search, X,
  Microscope, Beaker, Mic, MicOff, Zap
} from 'lucide-react';

interface ResultEntryWorkspaceProps {
  order: Order;
  patient: Patient;
  results: TestResult[];
  analyzers: Analyzer[];
  onUpdateResultValue: (resultId: string, newValue: string) => void;
  onUpdateInterpretation: (resultId: string, interpretation: string) => void;
  onValidateTechnical: (resultId: string) => void;
  onOpenPdf: (orderId: string) => void;
}

export const ResultEntryWorkspace: React.FC<ResultEntryWorkspaceProps> = ({
  order,
  patient,
  results,
  onUpdateResultValue,
  onUpdateInterpretation,
  onValidateTechnical,
  onOpenPdf
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState<string>('');
  const [editingInterpId, setEditingInterpId] = useState<string | null>(null);
  const [tempInterp, setTempInterp] = useState<string>('');
  const [selectedResults, setSelectedResults] = useState<string[]>([]);
  const [isListening, setIsListening] = useState<string | null>(null);

  const patientResults = results.filter(r => r.orderId === order.id);

  const startVoiceDictation = (resId: string) => {
    setIsListening(resId);
    setTimeout(() => {
      onUpdateInterpretation(resId, (results.find(r => r.id === resId)?.interpretation || '') + ' [Dictado: Paciente presenta valores consistentes con cuadro clínico reportado.]');
      setIsListening(null);
    }, 2500);
  };

  const getDeltaCheck = (currentRes: TestResult) => {
    // Find previous result for same patient and same parameter
    const allPatientResults = results.filter(r =>
      r.parameterId === currentRes.parameterId &&
      r.orderId !== currentRes.orderId &&
      r.status === 'VALIDADO_MED'
    );

    if (allPatientResults.length === 0) return null;

    // Sort by order ID (simulation of date)
    const lastRes = allPatientResults[0];
    const diff = Math.abs((currentRes.numericValue || 0) - (lastRes.numericValue || 0));
    const percentChange = lastRes.numericValue ? (diff / lastRes.numericValue) * 100 : 0;

    if (percentChange > 20) {
      return {
        previousValue: lastRes.value,
        change: percentChange.toFixed(1),
        isSignificant: true
      };
    }
    return null;
  };

  const getFlagStyle = (flag?: string) => {
    if (flag?.includes('CRITICO')) return 'bg-rose-500/20 text-rose-400 border-rose-500/30 font-black';
    if (flag === 'ALTO' || flag === 'BAJO') return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    return 'text-slate-300';
  };

  const toggleSelect = (id: string) => {
    setSelectedResults(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleBulkValidate = () => {
    if (selectedResults.length === 0) {
      alert('Seleccione resultados para validar.');
      return;
    }
    selectedResults.forEach(id => onValidateTechnical(id));
    setSelectedResults([]);
    alert(`${selectedResults.length} resultados validados técnicamente.`);
  };

  return (
    <div className="flex flex-col min-h-[80vh] pb-32 space-y-6 animate-in fade-in duration-700 relative">

      {/* 1. Demographics Header - Glass Panel */}
      <div className="bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-6 shadow-2xl flex flex-wrap items-center justify-between gap-6 relative z-10">
        <div className="flex items-center space-x-5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-400 to-emerald-500 flex items-center justify-center text-slate-950 shadow-lg">
            <User className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center space-x-3">
              <h2 className="text-xl font-black text-white tracking-tight">{patient.firstName} {patient.lastName}</h2>
              <span className="px-2.5 py-0.5 rounded-lg bg-slate-800 text-teal-400 font-mono text-[10px] font-bold border border-teal-500/20">
                {order.orderNumber}
              </span>
            </div>
            <div className="flex items-center space-x-4 mt-1 text-[11px] font-bold uppercase tracking-widest text-slate-500">
              <span>{patient.nationalId}</span>
              <span className="w-1 h-1 rounded-full bg-slate-700"></span>
              <span>{order.patientAge} Años</span>
              <span className="w-1 h-1 rounded-full bg-slate-700"></span>
              <span className="text-slate-400">{patient.gender === 'F' ? 'Femenino' : 'Masculino'}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-0.5">Procedencia</div>
            <div className="text-xs font-bold text-white uppercase">{order.doctorName || 'Particular'}</div>
          </div>
          <div className="h-10 w-px bg-white/5"></div>
          <div className="text-right">
            <div className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-0.5">Prioridad</div>
            <span className={`text-[10px] font-black px-3 py-1 rounded-full border ${order.priority === 'STAT' ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' : 'bg-blue-500/10 border-blue-500/30 text-blue-400'}`}>
              {order.priority}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Main Entry Table Workspace */}
      <div className="bg-slate-900/40 border border-white/5 rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl relative z-10">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[1200px]">
            <thead>
              <tr className="bg-slate-950/80 backdrop-blur-md text-slate-500 border-b border-white/5 font-black uppercase tracking-[0.2em] text-[9px]">
                <th className="px-6 py-5 w-16 text-center">
                  <input
                    type="checkbox"
                    onChange={(e) => setSelectedResults(e.target.checked ? patientResults.map(r => r.id) : [])}
                    className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-teal-500 focus:ring-0"
                  />
                </th>
                <th className="px-4 py-5">Examen / Muestra</th>
                <th className="px-4 py-5 text-center">Resultado</th>
                <th className="px-4 py-5 text-center w-24">Unidad</th>
                <th className="px-4 py-5">Referencia</th>
                <th className="px-4 py-5">Interpretación Clínica</th>
                <th className="px-4 py-5 text-center">Estado</th>
                <th className="px-4 py-5 text-right pr-8">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-medium">
              <tr className="bg-teal-500/5">
                <td colSpan={8} className="px-6 py-2 text-[10px] font-black text-teal-400 uppercase tracking-[0.3em]">MESA DE TRABAJO TÉCNICA</td>
              </tr>

              {patientResults.map((res) => {
                const isEditingValue = editingId === res.id;
                const isEditingInterp = editingInterpId === res.id;
                const flagClass = getFlagStyle(res.flag);
                const isSelected = selectedResults.includes(res.id);

                return (
                  <tr key={res.id} className={`group transition-colors ${isSelected ? 'bg-teal-500/5' : 'hover:bg-white/[0.02]'}`}>
                    <td className="px-6 py-4 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(res.id)}
                        className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-teal-500 focus:ring-0"
                      />
                    </td>
                    <td className="px-4 py-4">
                       <div className="font-black text-slate-200">{res.parameterName}</div>
                       <div className="flex items-center space-x-3 mt-0.5">
                         <div className="flex items-center space-x-1">
                            <Beaker className="w-3 h-3 text-teal-500/50" />
                            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter">{res.specimenType || 'SANGRE TOTAL'}</span>
                         </div>
                         {(() => {
                           const delta = getDeltaCheck(res);
                           if (!delta) return null;
                           return (
                             <div className="flex items-center space-x-1 bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.5 rounded animate-pulse">
                               <Zap className="w-2.5 h-2.5 text-rose-500" />
                               <span className="text-[7px] font-black text-rose-400 uppercase">Delta: {delta.change}% (Prev: {delta.previousValue})</span>
                             </div>
                           );
                         })()}
                       </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      {isEditingValue ? (
                        <div className="flex items-center justify-center">
                          <input
                            type="text"
                            autoFocus
                            value={tempValue}
                            onChange={(e) => setTempValue(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && (onUpdateResultValue(res.id, tempValue), setEditingId(null))}
                            className="bg-slate-950 border border-teal-500/50 rounded-lg px-3 py-1.5 text-sm font-mono text-teal-400 w-24 text-center focus:outline-none shadow-[0_0_15px_rgba(20,184,166,0.2)]"
                          />
                        </div>
                      ) : (
                        <button
                          onClick={() => { setEditingId(res.id); setTempValue(res.value); }}
                          className={`text-sm font-black font-mono px-4 py-1.5 rounded-xl border border-transparent transition-all mx-auto block hover:border-white/10 ${flagClass}`}
                        >
                          {res.value}
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-4 text-slate-500 font-mono text-center">{res.unit}</td>
                    <td className="px-4 py-4 text-slate-400 font-mono text-[11px] italic whitespace-nowrap">{res.refRangeText}</td>
                    <td className="px-4 py-4 max-w-[250px]">
                      <div className="flex items-start gap-2">
                        <div className="flex-1">
                          {isEditingInterp ? (
                            <textarea
                              autoFocus
                              value={tempInterp}
                              onChange={(e) => setTempInterp(e.target.value)}
                              onBlur={() => {
                                onUpdateInterpretation(res.id, tempInterp);
                                setEditingInterpId(null);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  onUpdateInterpretation(res.id, tempInterp);
                                  setEditingInterpId(null);
                                }
                              }}
                              className="w-full bg-slate-950 border border-teal-500/50 rounded-xl p-2 text-[10px] text-slate-200 focus:outline-none h-12 resize-none shadow-[0_0_10px_rgba(20,184,166,0.1)]"
                            />
                          ) : (
                            <div
                              onClick={() => { setEditingInterpId(res.id); setTempInterp(res.interpretation || ''); }}
                              className="text-[10px] text-slate-500 italic hover:text-teal-400 transition-colors cursor-text line-clamp-2 bg-white/5 p-2 rounded-xl border border-transparent hover:border-white/5"
                            >
                              {res.interpretation || 'Añadir interpretación técnica...'}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => startVoiceDictation(res.id)}
                          className={`p-2 rounded-xl transition-all ${isListening === res.id ? 'bg-rose-500 text-white animate-pulse' : 'bg-slate-800 text-slate-400 hover:text-teal-400'}`}
                          title="Dictado por Voz"
                        >
                          {isListening === res.id ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-full border ${res.status === 'VALIDADO_TEC' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-amber-500/10 border-amber-500/30 text-amber-400'}`}>
                        {res.status.split('_')[0]}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right pr-8">
                      <div className="flex items-center justify-end space-x-2 opacity-30 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 bg-slate-800 rounded-lg hover:text-teal-400 transition-all"><History className="w-4 h-4" /></button>
                        <button className="p-2 bg-slate-800 rounded-lg hover:text-blue-400 transition-all"><Lock className="w-4 h-4" /></button>
                        <button className="p-2 bg-slate-800 rounded-lg hover:text-white transition-all"><Printer className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Global Floating Action Bar */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 flex items-center bg-[#020617]/90 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] px-8 py-5 shadow-[0_25px_60px_rgba(0,0,0,0.8)] z-[100] gap-6 border-b-4 border-b-teal-500/20">
        {[
          { icon: Save, label: 'Guardar', color: 'bg-emerald-500', text: 'text-slate-950', action: () => alert('Cambios guardados.') },
          { icon: Plus, label: '+ Pruebas', color: 'bg-teal-500', text: 'text-slate-950', action: () => alert('Apertura de Catálogo...') },
          { icon: RotateCcw, label: 'Retorno', color: 'bg-indigo-500/80', text: 'text-white', action: () => setSelectedResults([]) },
          { icon: Trash2, label: 'Rechazo', color: 'bg-rose-500', text: 'text-white', action: () => alert('Resultado rechazado.') },
          { icon: MessageSquare, label: 'Notas', color: 'bg-blue-400', text: 'text-slate-950', action: () => alert('Notas de la orden...') },
          { icon: Paperclip, label: 'Adjuntos', color: 'bg-cyan-500', text: 'text-slate-950', action: () => alert('Archivos adjuntos...') },
          { icon: CheckCircle2, label: 'Validar', color: 'bg-emerald-400', text: 'text-slate-950', action: handleBulkValidate },
          { icon: Printer, label: 'Imprimir', color: 'bg-slate-700', text: 'text-white', action: () => onOpenPdf(order.id) },
          { icon: Barcode, label: 'Etiquetas', color: 'bg-slate-200', text: 'text-slate-950', action: () => alert('Imprimiendo etiquetas...') },
        ].map((btn, i) => (
          <button
            key={i}
            onClick={btn.action}
            className="flex flex-col items-center group transition-all"
          >
            <div className={`w-12 h-12 rounded-full ${btn.color} ${btn.text} flex items-center justify-center shadow-xl transform group-hover:scale-110 group-hover:-translate-y-2 transition-all duration-300 ring-4 ring-slate-900 group-hover:ring-white/10`}>
              <btn.icon className="w-5 h-5 stroke-[2.5]" />
            </div>
            <span className="text-[9px] font-black uppercase tracking-[0.1em] text-slate-400 mt-2.5 group-hover:text-teal-400 transition-colors">{btn.label}</span>
          </button>
        ))}
      </div>

    </div>
  );
};
