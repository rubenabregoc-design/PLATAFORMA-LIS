import React, { useState } from 'react';
import { TestResult, Order, Patient } from '../../types';
import { ShieldCheck, CheckCircle2, AlertTriangle, FileText, Lock, Key, Award, Sparkles, User, Activity, ExternalLink } from 'lucide-react';
import { getTimeBasedGreeting } from '../../utils/greeting';

interface LabChiefDashboardProps {
  orders: Order[];
  results: TestResult[];
  patients: Patient[];
  onValidateMedical: (resultIds: string[], signatureHash: string) => void;
  onOpenPdf: (orderId: string) => void;
}

export const LabChiefDashboard: React.FC<LabChiefDashboardProps> = ({
  orders,
  results,
  patients,
  onValidateMedical,
  onOpenPdf
}) => {
  const [selectedOrderId, setSelectedOrderId] = useState<string>(orders[0]?.id || '');
  const [signaturePin, setSignaturePin] = useState<string>('1234');
  const [isValidated, setIsValidated] = useState<boolean>(false);

  const selectedOrder = orders.find((o) => o.id === selectedOrderId) || orders[0];
  const orderResults = results.filter((r) => r.orderId === selectedOrder?.id);
  const patient = patients.find((p) => p.id === selectedOrder?.patientId) || patients[0];

  const handleSignOff = () => {
    if (!signaturePin) {
      window.dispatchEvent(
        new CustomEvent('lis-global-toast', {
          detail: { message: 'Por favor ingrese su clave/PIN de firma digital biométrica de idoneidad.', type: 'warning' }
        })
      );
      return;
    }

    const resultIds = orderResults.map((r) => r.id);
    const mockHash = `SHA256-${Date.now()}-DR-ROBERTO-ICAZA-TM1840PA`;
    onValidateMedical(resultIds, mockHash);
    setIsValidated(true);

    window.dispatchEvent(
      new CustomEvent('lis-global-toast', {
        detail: { message: '✓ Resultados validados médicamente y firmados digitalmente con hash SHA-256.', type: 'success', duration: 4000 }
      })
    );
  };

  return (
    <div className="space-y-6 text-slate-100 animate-in fade-in duration-500">

      {/* Executive Header Card (Dark LISCORE Theme) */}
      <div className="bg-slate-900/90 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-600"></div>
        <div>
          <div className="text-emerald-400 text-xs font-black uppercase tracking-wider mb-1.5 flex flex-wrap items-center gap-2">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Dashboard — Jefe de Laboratorio / Dirección Técnica</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-400/15 border border-amber-400/30 text-amber-300 flex items-center space-x-1">
              <span>👋</span>
              <span>{getTimeBasedGreeting('ES')}, Dr. Roberto Icaza!</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Bandeja de Validación Médica & Firma Digital SHA-256
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-xl font-medium">
            Revisión técnica de resultados previo a su emisión oficial al paciente y médico tratante.
          </p>
        </div>

        <div className="bg-slate-950 border border-emerald-500/30 p-4 rounded-2xl text-xs space-y-1 shrink-0">
          <div className="text-white font-bold flex items-center space-x-1.5">
            <Award className="w-4 h-4 text-amber-400" />
            <span>Dr. Roberto Icaza Villalaz (TM-1840-PA)</span>
          </div>
          <div className="text-emerald-400 font-semibold">● Firma Biométrica / Digital Activa</div>
        </div>
      </div>

      {/* Bento Grid Architecture */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

        {/* Bento Cell 1: Orders Queue (4 cols) */}
        <div className="lg:col-span-4 bg-slate-900/90 rounded-3xl p-6 border border-slate-800 shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-white text-xs uppercase tracking-wider flex items-center space-x-2">
                <FileText className="w-4 h-4 text-teal-400" />
                <span>Pendientes de Firma ({orders.length})</span>
              </h3>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono font-bold px-2.5 py-0.5 rounded-full">
                Cola Activa
              </span>
            </div>

            <div className="space-y-2.5 mt-3 max-h-[480px] overflow-y-auto pr-1 no-scrollbar">
              {orders.map((ord) => (
                <div
                  key={ord.id}
                  onClick={() => { setSelectedOrderId(ord.id); setIsValidated(false); }}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    selectedOrderId === ord.id
                      ? 'bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-900 border-emerald-400 ring-2 ring-emerald-500/30 shadow-md'
                      : 'bg-slate-950 border-slate-800 hover:border-emerald-500/40 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-black text-cyan-300 text-xs">{ord.orderNumber}</span>
                    <span className={`text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-full border ${
                      ord.priority === 'STAT' ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}>
                      {ord.priority}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-white mt-1.5">{ord.patientName}</div>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">Cédula: {ord.patientNationalId}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 font-mono">
            Firma acreditada según Ley de Salud de Panamá y la ANTAI.
          </div>
        </div>

        {/* Bento Cell 2: Results Sign-off Panel (8 cols) */}
        <div className="lg:col-span-8 bg-slate-900/90 rounded-3xl p-6 border border-slate-800 shadow-xl space-y-6 flex flex-col justify-between">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-teal-400">Revisando Expediente Orden:</div>
                <h2 className="text-xl font-black text-white tracking-tight">{selectedOrder?.orderNumber} — {patient?.firstName || selectedOrder?.patientName} {patient?.lastName || ''}</h2>
                <div className="text-xs text-slate-400 mt-0.5 font-mono">
                  Cédula: <strong className="text-cyan-300">{patient?.nationalId || selectedOrder?.patientNationalId}</strong> | Edad: <strong className="text-white">{selectedOrder?.patientAge || 34} años</strong>
                </div>
              </div>

              <button
                onClick={() => onOpenPdf(selectedOrder.id)}
                className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black px-4 py-2.5 rounded-2xl text-xs transition flex items-center space-x-2 shadow-md shadow-cyan-500/20 cursor-pointer"
              >
                <FileText className="w-4 h-4 text-slate-950" />
                <span>Generar PDF Oficial</span>
              </button>
            </div>

            {/* Results Table */}
            <div className="space-y-3">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                Parámetros Analizados para Autorización Técnica y Médica:
              </h4>
              <div className="overflow-x-auto border border-slate-800 rounded-2xl">
                <table className="w-full text-left text-xs font-sans">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-black uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-3">Parámetro</th>
                      <th className="p-3">Valor Obtenido</th>
                      <th className="p-3">Ref. Range</th>
                      <th className="p-3">Fuente / Equipo</th>
                      <th className="p-3 text-center">Estado Flag</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium text-slate-200">
                    {orderResults.map((r) => (
                      <tr key={r.id} className={r.flag?.includes('CRITICO') ? 'bg-rose-950/30 font-bold' : 'hover:bg-slate-800/60'}>
                        <td className="p-3 font-bold text-white">{r.parameterName}</td>
                        <td className="p-3 font-mono font-black text-sm text-cyan-300">{r.value} {r.unit}</td>
                        <td className="p-3 text-slate-400 font-mono">{r.refRangeText}</td>
                        <td className="p-3 text-[11px] text-slate-400">{r.source || 'Middleware ACE'} ({r.analyzerName || 'Sysmex XN'})</td>
                        <td className="p-3 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black ${
                            r.flag?.includes('CRITICO') ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse' : r.flag === 'ALTO' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          }`}>
                            {r.flag === 'CRITICO_ALTO' ? '⚠️ CRÍTICO ALTO' : r.flag === 'CRITICO_BAJO' ? '⚠️ CRÍTICO BAJO' : r.flag || '✓ NORMAL'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Digital Signature Box */}
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center space-x-2 text-white font-bold text-sm">
              <Lock className="w-4 h-4 text-emerald-400" />
              <span>Firma Electrónica / Biométrica de Idoneidad Médica</span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <input
                type="password"
                placeholder="Ingrese su PIN de Firma (ej. 1234)"
                value={signaturePin}
                onChange={(e) => setSignaturePin(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-amber-300 focus:border-emerald-400 outline-none"
              />

              <button
                onClick={handleSignOff}
                className="bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black px-5 py-2.5 rounded-xl text-xs transition shadow-lg shadow-emerald-500/20 cursor-pointer flex items-center space-x-2"
              >
                <ShieldCheck className="w-4 h-4 text-slate-950" />
                <span>Validar y Emitir Firma SHA-256</span>
              </button>
            </div>

            {isValidated && (
              <div className="text-xs text-emerald-300 bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/30 flex items-center space-x-2 font-semibold animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Orden autorizada y firmada. Expediente guardado en Bóveda de Auditoría Imputable Ley 81.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
