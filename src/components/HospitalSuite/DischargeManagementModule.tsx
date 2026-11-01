import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  FileCheck2, ShieldCheck, UserCheck, Calendar, Download, Printer,
  FileText, CheckCircle2, Clock, AlertTriangle, ChevronRight, Search,
  Award, HeartPulse, Building2, User, Smartphone, FileSpreadsheet, Lock, XCircle
} from 'lucide-react';
import { useHisStore } from '../../store/useHisStore';
import { useLisStore } from '../../store/useLisStore';

export const DischargeManagementModule: React.FC = () => {
  const { admissions, selectedAdmissionId, dischargePatient } = useHisStore();
  const { currentUser } = useLisStore();

  const activeAdmission = admissions.find((a) => a.id === selectedAdmissionId) || admissions[0];

  const [dischargeType, setDischargeType] = useState<'MEDICA' | 'VOLUNTARIA' | 'TRANSFERENCIA' | 'DEFUNCION'>('MEDICA');
  const [finalDiagnosisIcd10, setFinalDiagnosisIcd10] = useState('J18.9 Neumonía no especificada');
  const [dischargeMeds, setDischargeMeds] = useState('Amoxicilina/Clavulánico 875/125mg VO C/12H por 7 días');
  const [followUpApptDate, setFollowUpApptDate] = useState('2026-08-25');
  const [disabilityDays, setDisabilityDays] = useState('7');
  const [dischargeSummaryNotes, setDischargeMedsNotes] = useState('Paciente evoluciona favorablemente tras 4 días de antibioticoterapia IV. Parámetros de laboratorio estabilizados (Leucocitos 7.2 x10^3/uL, afebril). Se otorga alta médica con indicaciones orales.');

  const [showDischargeSummaryModal, setShowDischargeSummaryModal] = useState(false);

  const handleConfirmDischarge = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeAdmission) {
      dischargePatient(activeAdmission.id, activeAdmission.bedId);
      setShowDischargeSummaryModal(true);
      window.dispatchEvent(
        new CustomEvent('lis-global-toast', {
          detail: { message: `✓ Alta Hospitalaria procesada para ${activeAdmission.patientName}. Cama ${activeAdmission.bedId} liberada para desinfección.`, type: 'success' }
        })
      );
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-slate-100">

      {/* Title Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-2xl flex items-center justify-center text-slate-950 font-black shadow-lg shadow-emerald-500/20">
            <FileCheck2 className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl sm:text-2xl font-black text-white">Gestión de Altas & Egresos Hospitalarios</h2>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase">
                Discharge Management
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Plan de alta clínica, receta de egreso, incapacidad médica (CSS / MINSA), resumen de egreso auditable y liberación automática de cama.
            </p>
          </div>
        </div>

        {/* Selected Patient Banner */}
        {activeAdmission && (
          <div className="bg-slate-950 p-4 rounded-2xl border border-emerald-500/30 flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold text-sm">
              {activeAdmission.patientName.charAt(0)}
            </div>
            <div>
              <div className="text-xs font-black text-white">{activeAdmission.patientName}</div>
              <div className="text-[10px] font-mono text-slate-400">Cama: <strong className="text-cyan-300">{activeAdmission.bedId}</strong> • Estado: <strong className="text-emerald-400">{activeAdmission.status}</strong></div>
            </div>
          </div>
        )}
      </div>

      {/* Discharge Process Form */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">

        <div className="border-b border-slate-800 pb-4 flex items-center justify-between">
          <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-emerald-400" />
            <span>Formulario de Egreso Clínico de Paciente</span>
          </h3>
          <span className="text-[10px] font-mono bg-slate-950 text-slate-400 px-3 py-1 rounded-full border border-slate-800">
            Firma Médica: {currentUser?.name || 'Dr. Roberto Icaza'}
          </span>
        </div>

        <form onSubmit={handleConfirmDischarge} className="space-y-6">

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-300">Tipo de Alta / Egreso</label>
              <select
                value={dischargeType}
                onChange={(e: any) => setDischargeType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-400 font-semibold"
              >
                <option value="MEDICA">Alta Médica Definitiva</option>
                <option value="VOLUNTARIA">Alta Voluntaria (Exoneración de Responsabilidad)</option>
                <option value="TRANSFERENCIA">Traslado / Traslado a Otro Hospital</option>
                <option value="DEFUNCION">Defunción Hospitalaria</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-300">Diagnóstico Principal de Egreso (CIE-10)</label>
              <input
                type="text"
                required
                value={finalDiagnosisIcd10}
                onChange={(e) => setFinalDiagnosisIcd10(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-400 font-mono font-bold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-300">Días de Incapacidad Médica (CSS/MINSA)</label>
              <input
                type="number"
                min={0}
                max={30}
                value={disabilityDays}
                onChange={(e) => setDisabilityDays(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-400 font-mono font-bold"
              />
            </div>

          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-300">Prescripción & Medicamentos al Alta</label>
              <textarea
                rows={3}
                required
                value={dischargeMeds}
                onChange={(e) => setDischargeMeds(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3.5 text-xs text-white focus:outline-none focus:border-emerald-400"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-300">Resumen Clínico de Hospitalización (Epic Style)</label>
              <textarea
                rows={3}
                required
                value={dischargeSummaryNotes}
                onChange={(e) => setDischargeMedsNotes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3.5 text-xs text-white focus:outline-none focus:border-emerald-400"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <div className="text-xs text-slate-400">
              Al procesar el alta, la cama <strong className="text-cyan-300">{activeAdmission?.bedId}</strong> pasará automáticamente a estado <strong className="text-amber-400">DESINFECCION</strong>.
            </div>

            <button
              type="submit"
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs transition shadow-lg shadow-emerald-500/20 cursor-pointer flex items-center space-x-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirmar Alta & Generar Documento</span>
            </button>
          </div>

        </form>
      </div>

      {/* Modal: Epic Discharge Summary Document Viewer */}
      {showDischargeSummaryModal && typeof document !== 'undefined' && createPortal(
        <div
          id="discharge-modal-container"
          data-printable-portal="true"
          className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[99999] flex items-start sm:items-center justify-center p-0 sm:p-4 overflow-y-auto printable-modal-overlay print:static print:block print:p-0 print:m-0 print:bg-white print:w-full print:h-auto print:max-h-none print:overflow-visible print:border-none print:shadow-none print:inset-auto"
        >
          <div className="bg-white rounded-none sm:rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl min-h-screen sm:min-h-0 sm:max-h-[96vh] overflow-y-auto flex flex-col print:static print:block print:p-0 print:m-0 print:w-full print:max-w-full print:h-auto print:min-h-0 print:max-h-none print:overflow-visible print:border-none print:shadow-none print:rounded-none">
            {/* Top Toolbar (no-print) */}
            <div className="bg-slate-900 text-white p-4 px-6 flex items-center justify-between sticky top-0 z-20 no-print border-b border-slate-800 print:hidden">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-white block">Epicrisis Oficial & Alta Hospitalaria</h3>
                  <span className="text-xs text-slate-400 font-mono">Formato Oficial Tamaño Carta (US Letter 8.5" × 11") • Normativa MINSA / CSS</span>
                </div>
              </div>

              <div className="flex items-center space-x-2.5">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-black text-xs rounded-xl transition flex items-center space-x-1.5 shadow-md shadow-teal-600/20 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir en Carta / Guardar PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowDischargeSummaryModal(false)}
                  className="text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition p-2 rounded-xl cursor-pointer"
                  title="Cerrar vista previa"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Documento Imprimible: Epicrisis Oficial */}
            <div
              id="printable-discharge-summary"
              data-printable="true"
              className="p-4 sm:p-6 print:p-0 space-y-2.5 print:space-y-1.5 text-slate-900 font-sans leading-normal max-w-[8.5in] w-full mx-auto bg-white printable-document-page text-xs single-page-letter"
            >
              {/* Header Hospitalario */}
              <div className="border-b-2 border-slate-900 pb-2 flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-10 h-10 rounded-lg bg-teal-900 text-white flex items-center justify-center p-1.5 shadow shrink-0">
                      <svg viewBox="0 0 48 48" fill="none" className="w-full h-full text-teal-300">
                        <circle cx="24" cy="24" r="22" stroke="currentColor" strokeWidth="2.5" fill="#0f766e" />
                        <path d="M24 10v28M14 24h20" stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round" />
                      </svg>
                    </div>
                    <div>
                      <h1 className="text-base sm:text-lg font-black text-slate-950 uppercase leading-none">
                        COMPLEJO HOSPITALARIO & CLÍNICO CENTRAL
                      </h1>
                      <div className="text-[9px] font-black uppercase text-teal-800 tracking-wider mt-0.5">
                        República de Panamá • Ministerio de Salud (MINSA) • Dirección Médica
                      </div>
                      <div className="text-[9px] text-slate-600 font-medium">
                        Departamento de Medicina Interna & Cuidados Hospitalarios
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-right space-y-0.5 shrink-0">
                  <div className="inline-block bg-slate-50 border border-slate-900 rounded-lg px-2.5 py-1 text-right shadow-sm">
                    <span className="text-[8px] font-extrabold text-slate-600 uppercase block tracking-wider leading-none">Folio de Epicrisis</span>
                    <span className="text-xs font-mono font-black text-slate-950 block">
                      EPI-{new Date().getFullYear()}-{activeAdmission?.bedId || 'HOSP-01'}
                    </span>
                  </div>
                  <div className="text-[9px] text-slate-600 font-mono">
                    Fecha Egreso: {new Date().toLocaleDateString('es-PA')}
                  </div>
                </div>
              </div>

              {/* Título Oficial */}
              <div className="text-center py-1 border-b border-slate-300">
                <h2 className="text-sm sm:text-base font-black uppercase tracking-wider text-slate-950 leading-tight">
                  EPICRISIS MÉDICA & RESUMEN DE ALTA HOSPITALARIA
                </h2>
                <div className="text-[10px] text-teal-900 font-bold">
                  Documento Clínico Oficial con Validez Institucional y Médico-Legal
                </div>
              </div>

              {/* Datos Demográficos y de Internamiento */}
              <div className="bg-slate-50 border border-slate-300 rounded-lg p-2 grid grid-cols-2 sm:grid-cols-4 gap-2 avoid-break text-xs">
                <div>
                  <span className="text-[8px] font-bold uppercase text-slate-500 block leading-none">Paciente:</span>
                  <strong className="text-xs text-slate-950 font-black block truncate mt-0.5">{activeAdmission?.patientName}</strong>
                </div>
                <div>
                  <span className="text-[8px] font-bold uppercase text-slate-500 block leading-none">Cédula / Identificación:</span>
                  <span className="font-mono font-bold text-slate-950 text-xs block mt-0.5">{activeAdmission?.patientNationalId}</span>
                </div>
                <div>
                  <span className="text-[8px] font-bold uppercase text-slate-500 block leading-none">Cama / Habitación:</span>
                  <span className="font-mono font-bold text-teal-900 text-xs block mt-0.5">{activeAdmission?.bedId}</span>
                </div>
                <div>
                  <span className="text-[8px] font-bold uppercase text-slate-500 block leading-none">Tipo de Alta:</span>
                  <span className="font-bold text-emerald-800 text-xs block mt-0.5">{dischargeType}</span>
                </div>
              </div>

              {/* Diagnósticos y Justificación */}
              <div className="border border-slate-300 rounded-lg p-2 bg-white space-y-1.5 avoid-break">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <span className="text-[9px] font-black uppercase text-slate-500 block leading-none">Diagnóstico de Ingreso:</span>
                    <strong className="text-xs text-slate-900 block mt-0.5">{(activeAdmission as any)?.initialDiagnosis || (activeAdmission as any)?.diagnosis || 'Ingreso Clínico para Observación'}</strong>
                  </div>
                  <div>
                    <span className="text-[9px] font-black uppercase text-teal-800 block leading-none">Diagnóstico Definitivo (CIE-10):</span>
                    <strong className="text-xs text-slate-950 block mt-0.5">{finalDiagnosisIcd10}</strong>
                  </div>
                </div>
              </div>

              {/* Tratamiento Farmacológico al Alta */}
              <div className="border border-slate-300 rounded-lg p-2 bg-white space-y-1 avoid-break">
                <span className="text-[9px] font-black uppercase text-teal-900 block border-b border-slate-200 pb-0.5">
                  Tratamiento Farmacológico Ambulatorio & Medicamentos al Alta:
                </span>
                <p className="text-slate-800 leading-relaxed font-sans text-xs whitespace-pre-line bg-slate-50 p-2 rounded border border-slate-200">
                  {dischargeMeds}
                </p>
              </div>

              {/* Incapacidad y Recomendaciones */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 avoid-break">
                <div className="p-2 bg-amber-50/80 border border-amber-300 rounded-lg space-y-0.5">
                  <span className="text-[9px] font-black uppercase text-amber-950 block">Incapacidad Médica Otorgada:</span>
                  <div className="text-xs font-black text-amber-900">{disabilityDays} DÍAS DE REPOSO DOMICILIARIO</div>
                  <div className="text-[9px] text-amber-900 leading-tight">
                    Certificación de reposo temporal obligatoria válida ante la CSS y MITRADEL.
                  </div>
                </div>

                <div className="p-2 bg-slate-50 border border-slate-300 rounded-lg space-y-0.5">
                  <span className="text-[9px] font-black uppercase text-slate-700 block">Cita de Control & Signos de Alarma:</span>
                  <div className="text-xs text-slate-900 font-bold">Control por Consulta Externa en 7 días hábiles.</div>
                  <div className="text-[9px] text-slate-600 leading-tight">
                    Acudir de inmediato a urgencias en caso de fiebre persistente &gt; 38.5°C o disnea.
                  </div>
                </div>
              </div>

              {/* Firmas y Sellos Autorizados */}
              <div className="pt-2 border-t-2 border-slate-900 grid grid-cols-2 gap-4 items-end avoid-break signature-block mt-1">
                <div className="space-y-0.5">
                  <div className="h-7 flex items-end">
                    <svg viewBox="0 0 200 45" className="h-7 w-36 text-slate-900" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M 15 35 Q 35 5 65 30 T 115 20 Q 135 40 155 15 T 180 30 M 30 25 Q 75 45 145 25" />
                    </svg>
                  </div>
                  <div className="w-48 border-b-2 border-slate-800 pb-0.5 mb-1">
                    <span className="text-[8px] text-slate-500 font-mono block">Firma y Sello del Médico Tratante</span>
                  </div>
                  <div className="font-black text-xs text-slate-950">Dr. Roberto Icaza Villalaz</div>
                  <div className="text-[10px] text-slate-700 font-medium">Médico Especialista • Medicina Interna</div>
                  <div className="text-[9px] font-mono text-slate-900">
                    Idoneidad MINSA: <strong>4921-MD-PA</strong> • Reg. CTS: <strong>CTS-0912</strong>
                  </div>
                </div>

                <div className="space-y-0.5 text-right">
                  <div className="inline-block bg-slate-50 p-1.5 rounded-lg border border-slate-300 text-left">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-teal-900 text-white rounded flex items-center justify-center font-bold text-[10px]">
                        MINSA
                      </div>
                      <div className="text-[8px] text-slate-600 space-y-0.5">
                        <strong className="text-slate-900 block text-[9px]">Validación Electrónica Ley 81</strong>
                        <div>Documento clínico oficial inalterable incorporado al expediente digital.</div>
                      </div>
                    </div>
                  </div>
                  <div className="text-[8px] text-slate-500 font-mono">
                    Página 1 de 1 • Plataforma HIS/LIS Panamá
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};
