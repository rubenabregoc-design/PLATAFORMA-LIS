import React, { useState } from 'react';
import { TestResult, Order, Patient } from '../../types';
import { ShieldCheck, CheckCircle2, AlertTriangle, FileText, Lock, Key, Award, Sparkles, User, Activity } from 'lucide-react';

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
  const [signaturePin, setSignaturePin] = useState<string>('');
  const [isValidated, setIsValidated] = useState<boolean>(false);

  const selectedOrder = orders.find((o) => o.id === selectedOrderId) || orders[0];
  const orderResults = results.filter((r) => r.orderId === selectedOrder?.id);
  const patient = patients.find((p) => p.id === selectedOrder?.patientId) || patients[0];

  const handleSignOff = () => {
    if (!signaturePin) {
      alert('Por favor ingrese su clave/PIN de firma digital biométrica de idoneidad.');
      return;
    }

    const resultIds = orderResults.map((r) => r.id);
    const mockHash = `SHA256-${Date.now()}-LIC-CASTILLO-TM3109PA`;
    onValidateMedical(resultIds, mockHash);
    setIsValidated(true);
    alert('¡Resultados validados médicamente y firmados digitalmente exitosamente!');
  };

  return (
    <div className="space-y-6">
      {/* Executive Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600"></div>
        <div>
          <div className="text-emerald-700 text-xs font-bold uppercase tracking-wider mb-1.5 flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Dashboard — Jefe de Laboratorio / Dirección Técnica</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Bandeja de Validación Médica & Firma Digital SHA-256
          </h1>
          <p className="text-slate-600 text-xs sm:text-sm mt-1 max-w-xl font-medium">
            Revisión técnica de resultados previo a su emisión oficial al paciente y médico tratante.
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl text-xs space-y-1 shrink-0">
          <div className="text-slate-900 font-bold flex items-center space-x-1.5">
            <Award className="w-4 h-4 text-amber-600" />
            <span>Lic. Carlos Castillo (TM-3109-PA)</span>
          </div>
          <div className="text-emerald-700 font-semibold">Firma Biométrica / Digital Activa</div>
        </div>
      </div>

      {/* Bento Grid Architecture */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Bento Cell 1: Orders Queue (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                <FileText className="w-4 h-4 text-teal-600" />
                <span>Pendientes de Firma ({orders.length})</span>
              </h3>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full">
                Cola Activa
              </span>
            </div>

            <div className="space-y-2.5 mt-3 max-h-[480px] overflow-y-auto pr-1">
              {orders.map((ord) => (
                <div
                  key={ord.id}
                  onClick={() => { setSelectedOrderId(ord.id); setIsValidated(false); }}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    selectedOrderId === ord.id
                      ? 'bg-emerald-50/80 border-emerald-600 ring-2 ring-emerald-500/20 shadow-sm'
                      : 'bg-slate-50/80 border-slate-200/80 hover:border-slate-300 hover:bg-slate-100/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-900 text-xs">{ord.orderNumber}</span>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      ord.priority === 'STAT' ? 'bg-rose-100 text-rose-800' : 'bg-slate-200 text-slate-800'
                    }`}>
                      {ord.priority}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-slate-800 mt-1.5">{ord.patientName}</div>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">Cédula: {ord.patientNationalId}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500">
            Firma acreditada según Ley de Salud de Panamá y la ANTAI.
          </div>
        </div>

        {/* Bento Cell 2: Results Sign-off Panel (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-6 flex flex-col justify-between">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-teal-700">Revisando Expediente Orden:</div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">{selectedOrder?.orderNumber} — {patient?.firstName} {patient?.lastName}</h2>
                <div className="text-xs text-slate-600 mt-0.5">
                  Cédula: <strong className="font-mono text-slate-900">{patient?.nationalId}</strong> | Edad: <strong>{selectedOrder?.patientAge} años</strong>
                </div>
              </div>

              <button
                onClick={() => onOpenPdf(selectedOrder.id)}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2.5 rounded-2xl text-xs transition flex items-center space-x-2 shadow-sm"
              >
                <FileText className="w-4 h-4 text-teal-400" />
                <span>Generar PDF Oficial</span>
              </button>
            </div>

            {/* Results Table */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Parámetros Analizados para Autorización Técnica y Médica:
              </h4>
              <div className="overflow-x-auto border border-slate-200/80 rounded-2xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 border-b font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-3">Parámetro</th>
                      <th className="p-3">Valor Obtenido</th>
                      <th className="p-3">Ref. Range</th>
                      <th className="p-3">Fuente / Equipo</th>
                      <th className="p-3">Estado Flag</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {orderResults.map((r) => (
                      <tr key={r.id} className={r.flag?.includes('CRITICO') ? 'bg-rose-50/80 font-bold' : 'hover:bg-slate-50/50'}>
                        <td className="p-3 font-bold text-slate-900">{r.parameterName}</td>
                        <td className="p-3 font-mono text-sm">{r.value} {r.unit}</td>
                        <td className="p-3 text-slate-500 font-mono">{r.refRangeText}</td>
                        <td className="p-3 text-[11px] text-slate-600">{r.source} ({r.analyzerName || 'Manual'})</td>
                        <td className="p-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                            r.flag?.includes('CRITICO') ? 'bg-rose-600 text-white' : r.flag === 'ALTO' ? 'bg-amber-500 text-white' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {r.flag || 'NORMAL'}
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
          <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200/80 space-y-4">
            <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm">
              <Lock className="w-4 h-4 text-emerald-600" />
              <span>Firma Electrónica / Biométrica de Idoneidad Médica</span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <input
                type="password"
                placeholder="Ingrese su PIN de Firma (ej. 1234)"
                value={signaturePin}
                onChange={(e) => setSignaturePin(e.target.value)}
                className="bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />

              <button
                onClick={handleSignOff}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition flex items-center space-x-2 shadow-sm"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Validar y Emitir Firma SHA-256</span>
              </button>
            </div>

            {isValidated && (
              <div className="text-xs text-emerald-800 bg-emerald-100/80 p-3 rounded-xl border border-emerald-300 flex items-center space-x-2 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Orden autorizada y firmada. Expediente guardado en Bóveda de Auditoría Imputable Ley 81.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
