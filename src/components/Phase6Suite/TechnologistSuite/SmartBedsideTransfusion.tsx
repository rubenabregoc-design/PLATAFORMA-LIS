import React, { useState } from 'react';
import {
  QrCode,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Flame,
  Search,
  Microscope,
  FileText,
  Sparkles,
  Filter,
  Droplets,
  HeartPulse,
  User,
  Clock,
  Printer,
  Activity,
  UserCheck,
  X
} from 'lucide-react';

interface VitalSignRecord {
  phase: 'BASAL' | '15_MIN' | '60_MIN' | 'POST';
  label: string;
  time: string;
  bloodPressure: string;
  heartRate: number;
  respiratoryRate: number;
  temperature: number;
  spO2: number;
  adverseSymptoms: string;
  nurseInitials: string;
}

export const SmartBedsideTransfusion: React.FC = () => {
  const [scannedPatientId, setScannedPatientId] = useState('8-812-4432');
  const [scannedUnitCode, setScannedUnitCode] = useState('PGRE-2026-0812');
  const [nurseAdmin, setNurseAdmin] = useState('Enf. María Valdés');
  const [nurseAdminLicense, setNurseAdminLicense] = useState('INF-5920-PA');
  const [nurseWitness, setNurseWitness] = useState('Enf. Carlos Herrera');
  const [nurseWitnessLicense, setNurseWitnessLicense] = useState('INF-7811-PA');

  const [verificationStatus, setVerificationStatus] = useState<'IDLE' | 'MATCHED_VERIFIED' | 'MISMATCH_BLOCKED'>('MATCHED_VERIFIED');
  const [transfusionActive, setTransfusionActive] = useState<boolean>(true);
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);

  // 4-Phase Vital Signs Protocol mandated by Panama Transfusion Standards
  const [vitals, setVitals] = useState<VitalSignRecord[]>([
    {
      phase: 'BASAL',
      label: '1. Basal (Pre-Transfusión)',
      time: '08:30',
      bloodPressure: '120/80',
      heartRate: 76,
      respiratoryRate: 16,
      temperature: 36.5,
      spO2: 98,
      adverseSymptoms: 'Ninguno / Paciente estable',
      nurseInitials: 'M.V.'
    },
    {
      phase: '15_MIN',
      label: '2. A los 15 Minutos (Crítico)',
      time: '08:45',
      bloodPressure: '122/82',
      heartRate: 78,
      respiratoryRate: 17,
      temperature: 36.6,
      spO2: 98,
      adverseSymptoms: 'Sin escalofríos, sin prurito, sin fiebre',
      nurseInitials: 'M.V.'
    },
    {
      phase: '60_MIN',
      label: '3. A los 60 Minutos',
      time: '09:30',
      bloodPressure: '125/80',
      heartRate: 75,
      respiratoryRate: 16,
      temperature: 36.7,
      spO2: 99,
      adverseSymptoms: 'Tolerancia hemodinámica adecuada',
      nurseInitials: 'M.V.'
    },
    {
      phase: 'POST',
      label: '4. Post-Transfusión (Finalización)',
      time: '11:15',
      bloodPressure: '120/78',
      heartRate: 72,
      respiratoryRate: 16,
      temperature: 36.6,
      spO2: 99,
      adverseSymptoms: 'Transfusión completada sin incidencias',
      nurseInitials: 'M.V.'
    }
  ]);

  const handleVerifyBedsideMatch = (e: React.FormEvent) => {
    e.preventDefault();

    if (scannedPatientId.trim() === '8-812-4432' && scannedUnitCode.trim() === 'PGRE-2026-0812') {
      setVerificationStatus('MATCHED_VERIFIED');
      window.dispatchEvent(
        new CustomEvent('lis-global-toast', {
          detail: { message: '✓ VERIFICACIÓN A PIE DE CAMA EXITOSA: Paciente y Unidad 100% Compatibles. Transfusión Autorizada.', type: 'success' }
        })
      );
    } else {
      setVerificationStatus('MISMATCH_BLOCKED');
      window.dispatchEvent(
        new CustomEvent('lis-global-toast', {
          detail: { message: '🚨 ALERTA CRÍTICA: INCOMPATIBILIDAD O DIVERGENCIA DETECTADA. TRANSFUSIÓN BLOQUEADA.', type: 'error', duration: 6000 }
        })
      );
    }
  };

  const handleReportAdverseReaction = () => {
    setTransfusionActive(false);
    window.dispatchEvent(
      new CustomEvent('lis-global-toast', {
        detail: {
          message: '🚨 PROTOCOLO DE REACCIÓN ADVERSA ACTIVADO: Transfusión suspendida. Retorno de bolsa a Banco de Sangre y aviso inmediato a Hemovigilancia.',
          type: 'error',
          duration: 8000
        }
      })
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-slate-100 font-sans">

      {/* Title Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 bg-gradient-to-tr from-rose-600 to-amber-500 rounded-2xl flex items-center justify-center text-slate-950 font-black shadow-lg shadow-rose-600/20">
            <QrCode className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl sm:text-2xl font-black text-white">Smart Bedside Transfusion & Monitoreo Transfusional</h2>
              <span className="bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase">
                Normativa MINSA Transfusión Segura
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Verificación doble al pie de cama (Doble Chequeo de Enfermería), registro de signos vitales en 4 fases y Hoja Oficial de Monitoreo Transfusional para expediente clínico.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={() => setShowPrintModal(true)}
            className="px-4 py-2 bg-slate-950 hover:bg-slate-800 border border-rose-500/40 text-rose-300 font-bold text-xs rounded-xl transition flex items-center space-x-1.5 cursor-pointer shadow"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Hoja de Transfusión (Carta)</span>
          </button>
        </div>
      </div>

      {/* Bedside Scanner Verification Console */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">

        <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
            <QrCode className="w-5 h-5 text-rose-400" />
            <span>Escáner de Verificación de Seguridad Transfusional</span>
          </h3>
          <span className="text-[10px] font-mono text-cyan-300 bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/30">
            Cama: UCI-02 • Sr. Fernando Abrego (O+)
          </span>
        </div>

        <form onSubmit={handleVerifyBedsideMatch} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-slate-300">1. Escanear Pulsera Paciente (Cédula/ID)</label>
            <input
              type="text"
              required
              value={scannedPatientId}
              onChange={(e) => setScannedPatientId(e.target.value)}
              placeholder="Escanee QR de pulsera..."
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white font-mono font-bold focus:outline-none focus:border-rose-400"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-slate-300">2. Escanear Unidad ISBT 128</label>
            <input
              type="text"
              required
              value={scannedUnitCode}
              onChange={(e) => setScannedUnitCode(e.target.value)}
              placeholder="Escanee código ISBT 128..."
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white font-mono font-bold focus:outline-none focus:border-rose-400"
            />
          </div>

          <div className="space-y-1.5 flex flex-col justify-end">
            <button
              type="submit"
              className="w-full py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs transition shadow-lg shadow-rose-600/30 cursor-pointer flex items-center justify-center space-x-2"
            >
              <QrCode className="w-4 h-4" />
              <span>Verificar Compatibilidad A Pie de Cama</span>
            </button>
          </div>
        </form>

        {/* Verification Status Output */}
        {verificationStatus === 'MATCHED_VERIFIED' && (
          <div className="bg-emerald-950/40 border-2 border-emerald-500/60 rounded-3xl p-6 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/40">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-sm font-black text-emerald-300 uppercase tracking-wider">
                  ✓ VERIFICACIÓN DE SEGURIDAD APROBADA (DOBLE CHEQUEO)
                </h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  El paciente <strong className="text-white">Sr. Fernando Abrego (O+)</strong> y la unidad <strong className="text-rose-300">PGRE-2026-0812 (O+)</strong> son 100% compatibles.
                </p>
                <div className="text-[11px] text-slate-400 font-mono mt-1">
                  Enfermera Administradora: <span className="text-emerald-300 font-bold">{nurseAdmin} ({nurseAdminLicense})</span> • Testigo: <span className="text-slate-300">{nurseWitness} ({nurseWitnessLicense})</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <span className="px-3 py-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-mono font-bold flex items-center space-x-1.5">
                <Activity className="w-3.5 h-3.5 animate-pulse" />
                <span>Transfusión Activa</span>
              </span>
            </div>
          </div>
        )}

        {verificationStatus === 'MISMATCH_BLOCKED' && (
          <div className="bg-rose-950/60 border-2 border-rose-500 rounded-3xl p-6 shadow-2xl flex items-center space-x-4 animate-pulse">
            <div className="p-3 bg-rose-500/20 text-rose-400 rounded-2xl border border-rose-500/40">
              <Lock className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-sm font-black text-rose-300 uppercase tracking-wider">
                🚨 TRANSFUSIÓN BLOQUEADA: DIVERGENCIA DETECTADA
              </h4>
              <p className="text-xs text-rose-200 mt-0.5">
                Los datos escaneados no coinciden con la reserva asignada al paciente. Por seguridad del paciente, la unidad no puede ser transfundida.
              </p>
            </div>
          </div>
        )}

      </div>

      {/* 4-Moment Vital Signs Clinical Monitoring Log */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-black text-white flex items-center space-x-2">
              <HeartPulse className="w-5 h-5 text-rose-400" />
              <span>Monitoreo Hemodinámico y Registro de Signos Vitales (4 Fases MINSA)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Protocolo mandatorio para detección precoz de reacciones hemolíticas agudas, choque anafiláctico y TRALI.
            </p>
          </div>

          <button
            onClick={handleReportAdverseReaction}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black rounded-xl transition shadow-lg shadow-rose-600/30 flex items-center space-x-1.5 cursor-pointer shrink-0"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Reportar Sospecha de Reacción Transfusional</span>
          </button>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-3">Fase de Monitoreo</th>
                <th className="p-3 text-center">Hora</th>
                <th className="p-3 text-center">T.A. (mmHg)</th>
                <th className="p-3 text-center">F.C. (lpm)</th>
                <th className="p-3 text-center">F.R. (rpm)</th>
                <th className="p-3 text-center">Temp. (°C)</th>
                <th className="p-3 text-center">SpO2 (%)</th>
                <th className="p-3">Evaluación Clínica / Síntomas</th>
                <th className="p-3 text-center">Firma Enf.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 font-mono">
              {vitals.map((v, idx) => (
                <tr key={v.phase} className="hover:bg-slate-800/30">
                  <td className="p-3 font-sans font-bold text-white">
                    <span className="block text-xs">{v.label}</span>
                    {v.phase === '15_MIN' && (
                      <span className="text-[10px] text-amber-400 font-bold font-sans">⚠️ Fase crítica hemovigilancia</span>
                    )}
                  </td>
                  <td className="p-3 text-center text-cyan-300 font-bold">{v.time}</td>
                  <td className="p-3 text-center text-slate-200 font-bold">{v.bloodPressure}</td>
                  <td className="p-3 text-center text-slate-200 font-bold">{v.heartRate}</td>
                  <td className="p-3 text-center text-slate-200">{v.respiratoryRate}</td>
                  <td className={`p-3 text-center font-bold ${v.temperature > 37.5 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {v.temperature.toFixed(1)}°C
                  </td>
                  <td className="p-3 text-center text-slate-200 font-bold">{v.spO2}%</td>
                  <td className="p-3 font-sans text-slate-300 text-[11px]">{v.adverseSymptoms}</td>
                  <td className="p-3 text-center">
                    <span className="px-2 py-0.5 bg-slate-950 rounded border border-slate-700 font-bold text-teal-300 text-[11px]">
                      {v.nurseInitials}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Printable Sheet Modal in US Letter (Carta 8.5" x 11") */}
      {showPrintModal && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-3xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between print:hidden">
              <span className="font-bold text-white text-sm flex items-center space-x-2">
                <Printer className="w-4 h-4 text-rose-400" />
                <span>Vista Previa: Hoja Oficial de Monitoreo Transfusional</span>
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow cursor-pointer flex items-center space-x-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir en Carta (8.5" x 11")</span>
                </button>
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Letter Format Sheet */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-800/40 flex justify-center print:p-0 print:bg-white print:overflow-visible">
              <div className="w-full max-w-[8.5in] bg-white text-slate-900 shadow-2xl p-8 rounded-2xl print:shadow-none print:rounded-none print:p-6 print:w-full font-sans text-xs space-y-5 border border-slate-200 print:border-none">
                
                {/* Header */}
                <div className="border-b-2 border-slate-900 pb-3 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 font-bold block">
                      REPÚBLICA DE PANAMÁ • MINISTERIO DE SALUD
                    </span>
                    <h1 className="text-base font-black text-slate-950 uppercase">
                      HOJA CLÍNICA DE MONITOREO Y ADMINISTRACIÓN DE HEMOCOMPONENTES
                    </h1>
                    <div className="text-xs font-bold text-rose-800">
                      Servicio de Transfusión Sanguínea & Hemovigilancia Hospitalaria
                    </div>
                  </div>
                  <div className="text-right font-mono text-xs">
                    <div>Fecha: {new Date().toLocaleDateString('es-PA')}</div>
                    <div className="font-bold text-slate-950">Folio: TRS-2026-0812</div>
                  </div>
                </div>

                {/* Patient & Unit Data */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold block uppercase">Paciente</span>
                    <strong className="text-slate-950">Sr. Fernando Abrego</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold block uppercase">Cédula</span>
                    <strong className="text-slate-950 font-mono">8-812-4432</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold block uppercase">Ubicación</span>
                    <strong className="text-slate-950">Piso 4 - UCI (Cama 02)</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold block uppercase">Grupo Paciente</span>
                    <strong className="text-slate-950 font-mono">O Rh Positivo</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold block uppercase">Unidad ISBT 128</span>
                    <strong className="text-rose-900 font-mono">PGRE-2026-0812</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold block uppercase">Componente</span>
                    <strong className="text-slate-950">C.G.R. Empacados (300 mL)</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold block uppercase">Grupo Unidad</span>
                    <strong className="text-slate-950 font-mono">O Rh Positivo</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold block uppercase">Pruebas Cruzadas</span>
                    <strong className="text-emerald-800">COMPATIBLE (Sello Banco)</strong>
                  </div>
                </div>

                {/* Vitals Table */}
                <div>
                  <div className="bg-slate-900 text-white px-3 py-1 font-bold text-[11px] uppercase rounded-t">
                    REGISTRO CRONOLÓGICO DE SIGNOS VITALES
                  </div>
                  <table className="w-full text-left border border-slate-300 text-xs">
                    <thead className="bg-slate-100 font-bold uppercase text-[9px] text-slate-700 border-b border-slate-300">
                      <tr>
                        <th className="p-2">Momento</th>
                        <th className="p-2 text-center">Hora</th>
                        <th className="p-2 text-center">P.A.</th>
                        <th className="p-2 text-center">F.C.</th>
                        <th className="p-2 text-center">F.R.</th>
                        <th className="p-2 text-center">Temp.</th>
                        <th className="p-2 text-center">SpO2</th>
                        <th className="p-2">Observaciones Clínicas</th>
                        <th className="p-2 text-center">Firma</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                      {vitals.map(v => (
                        <tr key={v.phase}>
                          <td className="p-2 font-sans font-bold">{v.label}</td>
                          <td className="p-2 text-center">{v.time}</td>
                          <td className="p-2 text-center">{v.bloodPressure}</td>
                          <td className="p-2 text-center">{v.heartRate}</td>
                          <td className="p-2 text-center">{v.respiratoryRate}</td>
                          <td className="p-2 text-center font-bold">{v.temperature.toFixed(1)}°C</td>
                          <td className="p-2 text-center">{v.spO2}%</td>
                          <td className="p-2 font-sans text-slate-700 text-[10px]">{v.adverseSymptoms}</td>
                          <td className="p-2 text-center font-bold">{v.nurseInitials}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Double Nurse Sign-off */}
                <div className="pt-6 border-t-2 border-slate-300 grid grid-cols-2 gap-8 text-center text-xs">
                  <div className="space-y-1">
                    <div className="border-b border-slate-400 pb-1 h-10 flex items-end justify-center font-serif italic text-slate-800">
                      {nurseAdmin}
                    </div>
                    <strong className="block text-[11px]">Enfermera Administradora</strong>
                    <span className="text-[10px] text-slate-500 font-mono block">Idoneidad: {nurseAdminLicense}</span>
                  </div>

                  <div className="space-y-1">
                    <div className="border-b border-slate-400 pb-1 h-10 flex items-end justify-center font-serif italic text-slate-800">
                      {nurseWitness}
                    </div>
                    <strong className="block text-[11px]">Enfermera Testigo (Doble Chequeo)</strong>
                    <span className="text-[10px] text-slate-500 font-mono block">Idoneidad: {nurseWitnessLicense}</span>
                  </div>
                </div>

                {/* Footer */}
                <div className="pt-2 border-t border-slate-200 flex justify-between text-[9px] text-slate-400 font-mono">
                  <span>Documento oficial de archivo para el Expediente Clínico Hospitalario (Ley 68 de 2003).</span>
                  <span>Página 1 de 1 • Sistema LIS/HIS/Banco de Sangre Panamá</span>
                </div>

              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
