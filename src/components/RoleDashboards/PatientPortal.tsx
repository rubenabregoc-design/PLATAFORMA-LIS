import React, { useState } from 'react';
import { Order, Patient } from '../../types';
import { User, FileText, Download, ShieldCheck, HeartPulse, TrendingUp, Lock, CheckCircle2, History, Award } from 'lucide-react';

interface PatientPortalProps {
  patient: Patient;
  orders: Order[];
  onOpenPdf: (orderId: string) => void;
}

export const PatientPortal: React.FC<PatientPortalProps> = ({ patient, orders, onOpenPdf }) => {
  const [dataConsent, setDataConsent] = useState<boolean>(patient.dataConsentLey81 ?? true);
  const [activeTab, setActiveTab] = useState<'results' | 'trends' | 'privacy'>('results');

  const patientOrders = orders.filter((o) => o.patientId === patient.id || o.patientNationalId === patient.nationalId);

  // Mock historical data points for longitudinal trend chart
  const glucoseTrends = [
    { date: '15 Ene 2026', value: 98, status: 'NORMAL' },
    { date: '12 Mar 2026', value: 104, status: 'ELEVADO' },
    { date: '28 May 2026', value: 92, status: 'NORMAL' },
    { date: '10 Ago 2026', value: 95, status: 'NORMAL' }
  ];

  return (
    <div className="space-y-6">
      {/* Executive Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 via-rose-400 to-rose-600"></div>
        <div>
          <div className="text-rose-700 text-xs font-bold uppercase tracking-wider mb-1.5 flex items-center space-x-2">
            <HeartPulse className="w-4 h-4 text-rose-600" />
            <span>Portal del Paciente / Expediente y Resultados de Laboratorio</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Bienvenido, {patient.firstName} {patient.lastName}
          </h1>
          <p className="text-slate-600 text-xs sm:text-sm mt-1 max-w-xl font-medium">
            Cédula Panameña: <strong className="text-slate-900 font-mono">{patient.nationalId}</strong> | Correo: {patient.email}
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl text-xs flex items-center space-x-3 shrink-0">
          <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0" />
          <div>
            <div className="font-bold text-slate-900">Cumplimiento Ley 81 de Panamá</div>
            <div className="text-slate-500 text-[11px]">Sus datos clínicos están encriptados y protegidos</div>
          </div>
        </div>
      </div>

      {/* Portal Navigation */}
      <div className="flex border border-slate-200/80 bg-white rounded-2xl p-1.5 shadow-sm space-x-2 w-fit">
        <button
          onClick={() => setActiveTab('results')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'results' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Mis Exámenes & Informes PDF</span>
        </button>

        <button
          onClick={() => setActiveTab('trends')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'trends' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Evolución Histórica de Salud</span>
        </button>

        <button
          onClick={() => setActiveTab('privacy')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'privacy' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Privacidad Ley 81 & Permisos</span>
        </button>
      </div>

      {/* TAB 1: RESULTS & PDF DOWNLOAD (Bento Grid) */}
      {activeTab === 'results' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-12 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                <HeartPulse className="w-4 h-4 text-rose-600" />
                <span>Exámenes de Laboratorio Disponibles para Descarga Imputable</span>
              </h3>
              <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-100">
                Firma Electrónica Médica Integrada
              </span>
            </div>

            <div className="space-y-3">
              {patientOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="p-5 rounded-2xl border border-slate-200/80 bg-slate-50/80 flex flex-wrap items-center justify-between gap-4 hover:border-rose-300 transition-all shadow-sm"
                >
                  <div className="space-y-1">
                    <div className="font-bold text-slate-900 text-sm">
                      Orden: <span className="font-mono text-rose-950">{ord.orderNumber}</span>
                    </div>
                    <div className="text-xs text-slate-500">
                      Fecha de atención: {new Date(ord.createdAt).toLocaleDateString('es-PA')} | Sede Vía España
                    </div>
                    <div className="text-xs text-emerald-800 font-bold flex items-center space-x-1.5 pt-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Resultados validados técnicamente por el Laboratorio Clínico San José</span>
                    </div>
                  </div>

                  <button
                    onClick={() => onOpenPdf(ord.id)}
                    className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-5 py-2.5 rounded-2xl text-xs transition shadow-md flex items-center space-x-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Descargar Informe PDF Oficial</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LONGITUDINAL HEALTH TRENDS (Bento Grid) */}
      {activeTab === 'trends' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-12 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-rose-600" />
                <span>Evolución Histórica de Parámetros Clínicos (Glucosa en Suero)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Monitoreo longitudinal de glucemia en ayunas a lo largo del año 2026 (Rango Normal: 70 - 99 mg/dL).
              </p>
            </div>

            {/* SVG Trend Chart */}
            <div className="bg-slate-950 text-white p-6 rounded-3xl space-y-4 border border-slate-800">
              <div className="flex justify-between items-center text-xs text-slate-400 border-b border-slate-800 pb-2">
                <span>Biomarcador: <strong className="text-white">Glucosa en Ayunas</strong></span>
                <span>Unidad: <strong className="text-rose-400">mg/dL</strong></span>
              </div>

              <div className="h-44 relative flex items-end justify-between px-6 pt-6">
                <div className="absolute top-12 left-0 right-0 border-b border-amber-500/40 border-dashed text-[10px] text-amber-400 px-2">
                  Límite Normal (99 mg/dL)
                </div>

                {glucoseTrends.map((t, idx) => {
                  const heightPercent = Math.min(100, Math.max(20, (t.value / 120) * 100));
                  return (
                    <div key={idx} className="flex flex-col items-center space-y-2 z-10">
                      <span className="text-xs font-mono font-bold text-teal-300">{t.value} mg/dL</span>
                      <div
                        style={{ height: `${heightPercent}px` }}
                        className={`w-8 rounded-t-lg transition-all ${
                          t.value > 99 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                      />
                      <span className="text-[10px] text-slate-400 font-mono">{t.date}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: LEY 81 PRIVACY & CONSENT SETTINGS (Bento Grid) */}
      {activeTab === 'privacy' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-12 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-6">
            <div className="flex items-center space-x-3 text-slate-900 border-b border-slate-100 pb-3">
              <Lock className="w-5 h-5 text-rose-600 shrink-0" />
              <div>
                <h3 className="font-bold text-sm">Gestión de Consentimiento Informado (Ley 81 de Protección de Datos)</h3>
                <p className="text-xs text-slate-500">
                  Usted mantiene el control total de quién puede acceder a su expediente de laboratorio.
                </p>
              </div>
            </div>

            <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200/80 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900 text-sm">Estado de Autorización de Datos Clínicos</div>
                  <div className="text-slate-500 text-xs">Permite la consulta por médicos idóneos autorizados en Panamá</div>
                </div>

                <button
                  onClick={() => setDataConsent(!dataConsent)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-sm ${
                    dataConsent ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-800'
                  }`}
                >
                  {dataConsent ? '✓ Consentimiento Otorgado' : 'Consentimiento Revocado'}
                </button>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 space-y-2 text-xs">
              <h4 className="font-bold text-slate-800 flex items-center space-x-1.5">
                <History className="w-4 h-4 text-slate-500" />
                <span>Registro Audit Trail de Accesos a su Expediente:</span>
              </h4>
              <div className="space-y-1.5 text-slate-600 font-mono text-[11px]">
                <div className="p-2.5 bg-slate-50/80 rounded-xl border border-slate-200/80">
                  ● 10/08/2026 10:30 AM — Acceso por Dr. Fernando Guardia (Idoneidad #3109-PA) - Consulta PDF
                </div>
                <div className="p-2.5 bg-slate-50/80 rounded-xl border border-slate-200/80">
                  ● 10/08/2026 09:15 AM — Ingreso técnico Lic. Sofía Guardia (Validación Técnica)
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
