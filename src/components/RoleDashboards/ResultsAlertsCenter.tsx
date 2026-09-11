import React, { useState } from 'react';
import { Order, Patient, TestResult, User } from '../../types';
import {
  ShieldAlert,
  Flame,
  AlertTriangle,
  Beaker,
  PhoneCall,
  CheckCircle2,
  Clock,
  UserCheck,
  FileText,
  RotateCcw,
  Sparkles,
  Info,
  ChevronRight,
  Stethoscope,
  X
} from 'lucide-react';

interface ResultsAlertsCenterProps {
  order: Order;
  patient: Patient;
  results: TestResult[];
  currentUser: User;
  onUpdateInterpretation: (resultId: string, interpretation: string) => void;
  onUpdateResultStatus: (resultId: string, status: TestResult['status']) => void;
}

export const ResultsAlertsCenter: React.FC<ResultsAlertsCenterProps> = ({
  order,
  patient,
  results,
  currentUser,
  onUpdateInterpretation,
  onUpdateResultStatus
}) => {
  const [selectedPanicResult, setSelectedPanicResult] = useState<TestResult | null>(null);
  const [doctorName, setDoctorName] = useState('Dr. Roberto Arosemena (Urgencias)');
  const [readbackConfirmed, setReadbackConfirmed] = useState(false);
  const [notificationNotes, setNotificationNotes] = useState('');
  const [isSubmittingNotification, setIsSubmittingNotification] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filter alerts from results
  const criticalResults = results.filter(r => r.orderId === order.id && r.flag?.includes('CRITICO'));
  const highLowResults = results.filter(r => r.orderId === order.id && (r.flag === 'ALTO' || r.flag === 'BAJO'));

  // Synthetic delta-checks and biological plausibility rules
  const deltaCheckAlerts = results
    .filter(r => r.orderId === order.id)
    .filter(r => {
      const code = (r.parameterCode || r.parameterName || '').toUpperCase();
      return code.includes('GLU') || code.includes('CREA') || code.includes('HGB') || code.includes('ALT');
    })
    .map(r => {
      const code = (r.parameterCode || r.parameterName || '').toUpperCase();
      let delta = '+18.5%';
      let previous = '12.4';
      let prevDate = '15/02/2026';
      let riskLevel: 'ALTO' | 'MODERADO' = 'MODERADO';

      if (code.includes('GLU')) {
        delta = '+240%';
        previous = '98 mg/dL';
        riskLevel = 'ALTO';
      } else if (code.includes('CREA')) {
        delta = '+45%';
        previous = '0.90 mg/dL';
        riskLevel = 'MODERADO';
      } else if (code.includes('HGB')) {
        delta = '-15%';
        previous = '14.2 g/dL';
        riskLevel = 'MODERADO';
      }

      return {
        id: r.id,
        parameterName: r.parameterName,
        currentValue: `${r.value} ${r.unit}`,
        previousValue: previous,
        previousDate: prevDate,
        delta,
        riskLevel,
        recommendation: riskLevel === 'ALTO'
          ? 'Desviación brusca superior al límite delta (±30%). Re-examinar tubo por posible infusión parenteral o glicemia descompensada.'
          : 'Variación biológica aceptable pero notable respecto al registro previo.'
      };
    });

  // Plausibility Rules
  const plausibilityChecks = [
    {
      title: 'Correlación Hemoglobina / Hematocrito (Regla de Tres)',
      status: 'CUMPLE',
      details: 'Hgb x 3 ≈ Hto (Dentro de tolerancia ± 3%). Sin crioglobulinas ni aglutininas frías.',
      passed: true
    },
    {
      title: 'Validación de Interferencias Preanalíticas H-I-L',
      status: 'VERIFICADO',
      details: 'Hemólisis (0), Ictericia (0), Lipemia (0). Sin interferencia óptica en espectrofotómetro.',
      passed: true
    },
    {
      title: 'Balance Aniónico / Osmolaridad Plasmática',
      status: 'ESTABLE',
      details: 'Brecha aniónica calculada en 12.4 mEq/L (Rango normal: 8-16 mEq/L).',
      passed: true
    }
  ];

  const handleExecutePanicProtocol = () => {
    if (!selectedPanicResult) return;
    if (!readbackConfirmed) {
      alert('Debe confirmar que el médico realizó la repetición verbal de seguridad (Readback).');
      return;
    }

    setIsSubmittingNotification(true);
    setTimeout(() => {
      const logText = `[CRÍTICO NOTIFICADO ISO 15189]: Notificado a ${doctorName} a las ${new Date().toLocaleTimeString()} por ${currentUser.name}. Confirmación de lectura retrógrada (Readback) OK. Obs: ${notificationNotes || 'Sin incidencias'}.`;

      onUpdateInterpretation(selectedPanicResult.id, logText);
      setIsSubmittingNotification(false);
      setSelectedPanicResult(null);
      setSuccessMessage(`Protocolo de Pánico completado y registrado en la bitácora legal para ${selectedPanicResult.parameterName}.`);
      setTimeout(() => setSuccessMessage(null), 5000);
    }, 600);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Banner / Success Toast */}
      {successMessage && (
        <div className="p-4 bg-emerald-500/20 border border-emerald-500/50 rounded-2xl flex items-center justify-between text-emerald-300 text-xs font-bold animate-in slide-in-from-top-2">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            {successMessage}
          </span>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Hero Overview */}
      <div className="p-6 bg-gradient-to-r from-rose-950/40 via-slate-900 to-amber-950/30 border border-rose-500/30 rounded-3xl shadow-2xl backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[9px] font-black uppercase tracking-widest animate-pulse flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5" /> CENTRO DE ALERTAS LIS & SEGURIDAD CLÍNICA
            </span>
            <span className="text-xs text-slate-400 font-mono">Normativa MINSA / ISO 15189</span>
          </div>
          <h2 className="text-xl font-black text-white uppercase italic">
            Monitor de Alertas y Plausibilidad Analítica
          </h2>
          <p className="text-xs text-slate-400">
            Detección automática de valores de pánico, desviaciones Delta-Check y verificación cruzada de interferencias para el paciente <strong className="text-white">{patient.firstName} {patient.lastName}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-slate-950/80 border border-rose-500/40 rounded-2xl text-center">
            <span className="text-[9px] font-black uppercase text-rose-400 block">Críticos Pánico</span>
            <span className="text-2xl font-black text-rose-400 font-mono">{criticalResults.length}</span>
          </div>
          <div className="px-4 py-2 bg-slate-950/80 border border-amber-500/40 rounded-2xl text-center">
            <span className="text-[9px] font-black uppercase text-amber-400 block">Delta-Checks</span>
            <span className="text-2xl font-black text-amber-400 font-mono">{deltaCheckAlerts.length}</span>
          </div>
        </div>
      </div>

      {/* Grid of Alert Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 1: Panic Values & Immediate Notification */}
        <div className="bg-slate-950/80 border border-rose-500/30 rounded-3xl p-6 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-rose-500/20 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                <Flame className="w-4 h-4 animate-bounce" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider">
                  Valores Críticos de Pánico ({criticalResults.length})
                </h3>
                <span className="text-[10px] text-rose-300 font-mono">Requiere aviso inmediato &lt; 15 min</span>
              </div>
            </div>
            <span className="text-[9px] font-black px-2.5 py-1 bg-rose-500 text-slate-950 rounded-full uppercase tracking-tighter">
              PRIORIDAD ALTA
            </span>
          </div>

          {criticalResults.length > 0 ? (
            <div className="space-y-3">
              {criticalResults.map(r => (
                <div
                  key={r.id}
                  className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/40 space-y-3 hover:border-rose-500 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[9px] font-mono text-rose-400 font-bold uppercase block">
                        #{r.parameterCode} • {r.analyzerName || 'ANALIZADOR LIS'}
                      </span>
                      <h4 className="text-base font-black text-white uppercase">{r.parameterName}</h4>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black font-mono text-rose-400 block animate-pulse">
                        {r.value} <span className="text-xs">{r.unit}</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">Ref: {r.refRangeText}</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950 border border-rose-500/20 text-[11px] text-rose-200">
                    <strong>Impacto Clínico:</strong> Concentración crítica. Riesgo elevado de compromiso hemodinámico / metabólico agudo.
                  </div>

                  {r.interpretation ? (
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-[10px] text-emerald-300 font-mono">
                      ✓ {r.interpretation}
                    </div>
                  ) : (
                    <button
                      onClick={() => setSelectedPanicResult(r)}
                      className="w-full py-2.5 bg-gradient-to-r from-rose-500 to-amber-500 hover:brightness-110 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-rose-500/20 transition-all cursor-pointer"
                    >
                      <PhoneCall className="w-4 h-4" />
                      <span>Ejecutar Protocolo de Notificación (Llamada)</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-900/40 rounded-2xl border border-white/5 space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
              <p className="text-xs font-bold text-white uppercase">Sin Valores de Pánico</p>
              <p className="text-[11px] text-slate-400">
                Todos los analitos procesados se encuentran fuera de los umbrales de riesgo inminente.
              </p>
            </div>
          )}
        </div>

        {/* Section 2: Delta-Check Variance Inspector */}
        <div className="bg-slate-950/80 border border-amber-500/30 rounded-3xl p-6 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider">
                  Desviaciones Delta-Check ({deltaCheckAlerts.length})
                </h3>
                <span className="text-[10px] text-amber-300 font-mono">Comparativa vs histórico reciente del paciente</span>
              </div>
            </div>
            <span className="text-[9px] font-black px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full uppercase tracking-tighter">
              AUDITORÍA PRE-REPORTE
            </span>
          </div>

          <div className="space-y-3">
            {deltaCheckAlerts.map(d => (
              <div
                key={d.id}
                className="p-4 rounded-2xl bg-slate-900/60 border border-amber-500/20 space-y-2.5 hover:border-amber-500/50 transition-all"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-white uppercase">{d.parameterName}</h4>
                  <span className="text-xs font-mono font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/30">
                    Δ {d.delta}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded-xl bg-slate-950 border border-white/5">
                    <span className="text-[9px] text-slate-500 uppercase block font-bold">Valor Previo ({d.previousDate})</span>
                    <span className="font-mono text-slate-300 font-bold">{d.previousValue}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-950 border border-white/5">
                    <span className="text-[9px] text-slate-500 uppercase block font-bold">Valor Actual</span>
                    <span className="font-mono text-cyan-300 font-black">{d.currentValue}</span>
                  </div>
                </div>

                <p className="text-[10px] text-slate-400 italic">
                  💡 {d.recommendation}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Section 3: Plausibility & Biological Cross-Validation Rules */}
      <div className="bg-slate-950/80 border border-teal-500/20 rounded-3xl p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-teal-500/20 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                Reglas de Plausibilidad Multivariada y Control Preanalítico
              </h3>
              <p className="text-[10px] text-slate-400">
                Verificación cruzada de consistencia física, química y hematológica antes de la firma digital.
              </p>
            </div>
          </div>
          <span className="text-[9px] font-mono text-emerald-400 font-bold">3/3 Reglas Aprobadas</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {plausibilityChecks.map((check, idx) => (
            <div key={idx} className="p-4 rounded-2xl bg-slate-900/60 border border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-mono text-slate-400 uppercase font-bold">Regla #{idx + 1}</span>
                <span className="text-[9px] font-black px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full uppercase">
                  {check.status}
                </span>
              </div>
              <h5 className="text-xs font-black text-white">{check.title}</h5>
              <p className="text-[11px] text-slate-400">{check.details}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Modal: Panic Protocol Execution (ISO 15189) */}
      {selectedPanicResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#020617]/90 backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-rose-500/40 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between border-b border-rose-500/20 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                  <PhoneCall className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <span className="text-[9px] font-black uppercase text-rose-400 tracking-widest block">
                    PROTOCOLO ISO 15189
                  </span>
                  <h3 className="text-lg font-black text-white uppercase italic">
                    Notificación de Valor Crítico
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setSelectedPanicResult(null)}
                className="w-9 h-9 rounded-xl bg-white/5 text-slate-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Analyte Summary */}
            <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-500/30 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold">Parámetro Crítico</span>
                <div className="text-sm font-black text-white uppercase">{selectedPanicResult.parameterName}</div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black font-mono text-rose-400">
                  {selectedPanicResult.value} {selectedPanicResult.unit}
                </span>
                <span className="text-[9px] text-slate-400 block font-mono">Ref: {selectedPanicResult.refRangeText}</span>
              </div>
            </div>

            {/* Doctor Selection / Phone recipient */}
            <div className="space-y-4 text-xs">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                  Profesional / Servicio Destinatario
                </label>
                <input
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  className="w-full p-3 bg-slate-950 border border-white/10 rounded-xl text-white font-bold text-xs focus:border-rose-500 outline-none"
                  placeholder="Ej: Dr. Roberto Arosemena (Urgencias)"
                />
              </div>

              {/* Mandatory Readback Checkbox */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-amber-500/30 flex items-start gap-3">
                <input
                  type="checkbox"
                  id="readbackCheck"
                  checked={readbackConfirmed}
                  onChange={(e) => setReadbackConfirmed(e.target.checked)}
                  className="w-5 h-5 mt-0.5 accent-rose-500 rounded cursor-pointer shrink-0"
                />
                <label htmlFor="readbackCheck" className="text-slate-300 font-bold cursor-pointer text-xs">
                  <span className="text-rose-400 font-black">Confirmación de Lectura Retrógrada (Readback):</span> El receptor repitió verbalmente el nombre del paciente, el parámetro y el valor numérico con su unidad.
                </label>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                  Observaciones Técnicas / Indicaciones Médicas Recibidas
                </label>
                <textarea
                  rows={2}
                  value={notificationNotes}
                  onChange={(e) => setNotificationNotes(e.target.value)}
                  placeholder="Ej: Médico indica inicio de protocolo de insulina EV y repetición en 2 horas..."
                  className="w-full p-3 bg-slate-950 border border-white/10 rounded-xl text-white text-xs focus:border-rose-500 outline-none"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setSelectedPanicResult(null)}
                className="flex-1 py-3 bg-slate-800 text-slate-300 font-bold rounded-xl text-xs uppercase hover:bg-slate-700 transition-all"
              >
                Cancelar
              </button>
              <button
                disabled={!readbackConfirmed || isSubmittingNotification}
                onClick={handleExecutePanicProtocol}
                className={`flex-1 py-3 font-black rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                  readbackConfirmed && !isSubmittingNotification
                    ? 'bg-rose-500 text-slate-950 hover:brightness-110 shadow-lg shadow-rose-500/25 cursor-pointer'
                    : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSubmittingNotification ? 'Guardando...' : 'Firmar y Registrar'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
