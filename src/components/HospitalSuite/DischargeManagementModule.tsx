import React, { useState } from 'react';
import {
  FileCheck2, ShieldCheck, UserCheck, Calendar, Download, Printer,
  FileText, CheckCircle2, Clock, AlertTriangle, ChevronRight, Search,
  Award, HeartPulse, Building2, User, Smartphone, FileSpreadsheet, Lock
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
      {showDischargeSummaryModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-800 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <FileText className="w-6 h-6 text-emerald-400" />
                <h3 className="font-black text-white text-base">Resumen Clínico Oficial de Alta Hospitalaria</h3>
              </div>
              <button onClick={() => setShowDischargeSummaryModal(false)} className="text-slate-400 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3 text-xs font-mono">
              <div className="flex justify-between text-slate-400 border-b border-slate-900 pb-2">
                <span>PACIENTE: <strong className="text-white">{activeAdmission?.patientName}</strong></span>
                <span>CÉDULA: <strong className="text-white">{activeAdmission?.patientNationalId}</strong></span>
              </div>

              <div className="grid grid-cols-2 gap-2 border-b border-slate-900 pb-2">
                <div>DIAGNOSTICO EGRESO: <strong className="text-emerald-400 block">{finalDiagnosisIcd10}</strong></div>
                <div>TIPO DE ALTA: <strong className="text-cyan-300 block">{dischargeType}</strong></div>
              </div>

              <div className="border-b border-slate-900 pb-2">
                <span className="text-slate-400 block mb-1">TRATAMIENTO AL ALTA:</span>
                <p className="text-slate-200 font-sans leading-relaxed">{dischargeMeds}</p>
              </div>

              <div>
                <span className="text-slate-400 block mb-1">INCAPACIDAD MÉDICA:</span>
                <p className="text-amber-300 font-bold">{disabilityDays} Días otorgados según normativa MINSA/CSS</p>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => window.print()}
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-2xl transition cursor-pointer flex items-center space-x-1.5 shadow"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Resumen & Recetas</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
