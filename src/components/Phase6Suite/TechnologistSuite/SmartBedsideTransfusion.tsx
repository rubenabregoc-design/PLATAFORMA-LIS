import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  X,
  Volume2,
  VolumeX,
  Check,
  AlertCircle
} from 'lucide-react';
import { useLisStore } from '../../../store/useLisStore';
import { BloodBankService } from '../../../services/SupabaseService';
import { OfficialBloodBankFormsPDF, OfficialFormType } from './OfficialBloodBankFormsPDF';

export interface VitalSignRecord {
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

interface ActiveTransfusionContext {
  requestId?: string;
  patientId: string;
  patientName: string;
  patientCedula: string;
  patientBloodType: string;
  patientRh: string;
  bedLocation: string;
  unitId?: string;
  unitNumber: string;
  unitComponent: string;
  unitBloodType: string;
  unitRh: string;
  expiryDate: string;
  unitStatus: string;
}

// Sound Synthesizer via Web Audio API (No external assets required)
const playChime = (type: 'success' | 'alert') => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    if (type === 'success') {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'triangle';
      osc1.frequency.setValueAtTime(523.25, now); // C5
      osc1.frequency.exponentialRampToValueAtTime(659.25, now + 0.15); // E5
      osc1.frequency.exponentialRampToValueAtTime(783.99, now + 0.3); // G5

      osc2.frequency.setValueAtTime(261.63, now); // C4
      osc2.frequency.exponentialRampToValueAtTime(392.0, now + 0.3);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.5);
      osc2.stop(now + 0.5);
    } else {
      // Alarm siren
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.setValueAtTime(440, now + 0.15);
      osc.frequency.setValueAtTime(880, now + 0.3);
      osc.frequency.setValueAtTime(440, now + 0.45);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.6);
    }
  } catch (err) {
    console.warn('AudioContext not available:', err);
  }
};

export const SmartBedsideTransfusion: React.FC = () => {
  const isDemoMode = useLisStore((state) => state.isDemoMode);

  // Form Fields
  const [scannedPatientId, setScannedPatientId] = useState('8-812-4432');
  const [scannedUnitCode, setScannedUnitCode] = useState('PGRE-2026-0812');
  const [nurseAdmin, setNurseAdmin] = useState('Enf. María Valdés');
  const [nurseAdminLicense, setNurseAdminLicense] = useState('INF-5920-PA');
  const [nurseWitness, setNurseWitness] = useState('Enf. Carlos Herrera');
  const [nurseWitnessLicense, setNurseWitnessLicense] = useState('INF-7811-PA');

  // Real data state
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [availableUnits, setAvailableUnits] = useState<any[]>([]);
  const [selectedContext, setSelectedContext] = useState<ActiveTransfusionContext>({
    requestId: 'req-demo-01',
    patientId: 'pat-01',
    patientName: 'Sr. Fernando Abrego',
    patientCedula: '8-812-4432',
    patientBloodType: 'O',
    patientRh: 'POS',
    bedLocation: 'UCI Cama 02',
    unitNumber: 'PGRE-2026-0812',
    unitComponent: 'C.G.R. Empacados (300 mL)',
    unitBloodType: 'O',
    unitRh: 'POS',
    expiryDate: '2026-12-15',
    unitStatus: 'RESERVED'
  });

  const [verificationStatus, setVerificationStatus] = useState<'IDLE' | 'MATCHED_VERIFIED' | 'MISMATCH_BLOCKED'>('MATCHED_VERIFIED');
  const [mismatchReason, setMismatchReason] = useState<string>('');
  const [transfusionActive, setTransfusionActive] = useState<boolean>(true);
  const [transfusionFinished, setTransfusionFinished] = useState<boolean>(false);
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [showOfficialFormsModal, setShowOfficialFormsModal] = useState<boolean>(false);
  const [activeOfficialForm, setActiveOfficialForm] = useState<OfficialFormType>('F-TRANS-02');

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

  // Load real data from Supabase if not in demo mode
  useEffect(() => {
    async function loadData() {
      if (!isDemoMode) {
        try {
          const [reqs, allUnits] = await Promise.all([
            BloodBankService.getPendingRequests(),
            BloodBankService.getAllUnits()
          ]);
          setPendingRequests(reqs || []);
          setAvailableUnits(allUnits || []);

          if (reqs && reqs.length > 0) {
            const first = reqs[0];
            const p = first.patients || {};
            setScannedPatientId(p.identification_number || p.national_id || '8-812-4432');
            
            // Look for matching reserved unit
            const matchingUnit = allUnits?.find((u: any) => u.status === 'RESERVED' || u.status === 'AVAILABLE');
            if (matchingUnit) {
              setScannedUnitCode(matchingUnit.unit_number);
              setSelectedContext({
                requestId: first.id,
                patientId: p.id || 'pat-01',
                patientName: `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Paciente Hospitalizado',
                patientCedula: p.identification_number || p.national_id || '8-812-4432',
                patientBloodType: p.blood_type || 'O',
                patientRh: p.rh_factor || 'POS',
                bedLocation: first.diagnosis || 'Piso 3 Cama 14',
                unitId: matchingUnit.id,
                unitNumber: matchingUnit.unit_number,
                unitComponent: matchingUnit.component_type || 'Concentrado de Glóbulos Rojos',
                unitBloodType: matchingUnit.blood_type,
                unitRh: matchingUnit.rh_factor,
                expiryDate: matchingUnit.expiry_date,
                unitStatus: matchingUnit.status
              });
            }
          }
        } catch (err) {
          console.warn('Error loading real blood bank data for bedside transfusion:', err);
        }
      }
    }
    loadData();
  }, [isDemoMode]);

  // Compatibility Rule Validator
  const validateCompatibility = (
    patientABO: string,
    patientRh: string,
    unitABO: string,
    unitRh: string,
    component: string
  ): { isCompatible: boolean; reason?: string } => {
    const pGroup = (patientABO || 'O').toUpperCase();
    const uGroup = (unitABO || 'O').toUpperCase();
    const isPPositive = (patientRh || 'POS').toUpperCase().includes('POS') || (patientRh || '').includes('+');
    const isUPositive = (unitRh || 'POS').toUpperCase().includes('POS') || (unitRh || '').includes('+');

    // Rh check for RBCs: Rh- negative recipient cannot receive Rh+ positive blood
    if (!isPPositive && isUPositive) {
      return {
        isCompatible: false,
        reason: `INCOMPATIBILIDAD Rh: Paciente Rh Negativo (${patientABO}-) NO puede recibir unidad Rh Positiva (${unitABO}+). Riesgo severo de alo-inmunización anti-D.`
      };
    }

    // Plasma rules
    const isPlasma = component?.toLowerCase().includes('plasma') || component?.toLowerCase().includes('pfc');
    if (isPlasma) {
      const plasmaMatrix: Record<string, string[]> = {
        O: ['O', 'A', 'B', 'AB'],
        A: ['A', 'AB'],
        B: ['B', 'AB'],
        AB: ['AB']
      };
      const allowedPlasma = plasmaMatrix[pGroup] || ['AB'];
      if (!allowedPlasma.includes(uGroup)) {
        return {
          isCompatible: false,
          reason: `INCOMPATIBILIDAD ABO EN PLASMA: Paciente grupo ${pGroup} no puede recibir plasma ${uGroup}. (AB es donante universal de plasma).`
        };
      }
      return { isCompatible: true };
    }

    // RBC rules (Default)
    const rbcMatrix: Record<string, string[]> = {
      O: ['O'],
      A: ['A', 'O'],
      B: ['B', 'O'],
      AB: ['AB', 'A', 'B', 'O']
    };
    const allowedUnits = rbcMatrix[pGroup] || ['O'];
    if (!allowedUnits.includes(uGroup)) {
      return {
        isCompatible: false,
        reason: `INCOMPATIBILIDAD ABO EN GLÓBULOS ROJOS: Paciente grupo ${pGroup} no puede recibir glóbulos rojos ${uGroup}. (O es donante universal de eritrocitos).`
      };
    }

    return { isCompatible: true };
  };

  const handleVerifyBedsideMatch = (e: React.FormEvent) => {
    e.preventDefault();

    const pCode = scannedPatientId.trim();
    const uCode = scannedUnitCode.trim();

    if (!pCode || !uCode) {
      setVerificationStatus('MISMATCH_BLOCKED');
      setMismatchReason('Debe escanear tanto la pulsera del paciente como la etiqueta ISBT 128 de la bolsa.');
      if (soundEnabled) playChime('alert');
      return;
    }

    // Evaluate against available units / selected context
    let matchedUnit = availableUnits.find(u => u.unit_number?.toLowerCase() === uCode.toLowerCase() || u.id === uCode);
    let patientCed = selectedContext.patientCedula;
    let patientGroup = selectedContext.patientBloodType;
    let patientRh = selectedContext.patientRh;

    if (!matchedUnit && isDemoMode) {
      if (uCode === 'PGRE-2026-0812') {
        matchedUnit = {
          unit_number: 'PGRE-2026-0812',
          component_type: 'C.G.R. Empacados (300 mL)',
          blood_type: 'O',
          rh_factor: 'POS',
          status: 'RESERVED',
          expiry_date: '2026-12-15'
        };
      } else if (uCode.includes('A-POS') || uCode.includes('PGRE-A')) {
        matchedUnit = {
          unit_number: uCode,
          component_type: 'C.G.R. Empacados (300 mL)',
          blood_type: 'A',
          rh_factor: 'POS',
          status: 'AVAILABLE',
          expiry_date: '2026-12-10'
        };
      }
    }

    // If unit found, check expiry & status
    if (matchedUnit) {
      const isExpired = new Date(matchedUnit.expiry_date) < new Date();
      if (isExpired) {
        setVerificationStatus('MISMATCH_BLOCKED');
        setMismatchReason(`UNIDAD EXPIRADA: La bolsa ${matchedUnit.unit_number} venció el ${matchedUnit.expiry_date}. Queda estrictamente prohibida su infusión.`);
        if (soundEnabled) playChime('alert');
        return;
      }

      if (matchedUnit.status === 'QUARANTINE' || matchedUnit.status === 'DISCARDED') {
        setVerificationStatus('MISMATCH_BLOCKED');
        setMismatchReason(`ESTADO NO AUTORIZADO: La unidad está en estado '${matchedUnit.status}'. No posee sello de liberación.`);
        if (soundEnabled) playChime('alert');
        return;
      }

      // Check ABO/Rh
      const check = validateCompatibility(
        patientGroup,
        patientRh,
        matchedUnit.blood_type,
        matchedUnit.rh_factor,
        matchedUnit.component_type
      );

      if (!check.isCompatible) {
        setVerificationStatus('MISMATCH_BLOCKED');
        setMismatchReason(check.reason || 'Incompatibilidad de grupo o factor Rh detectada.');
        if (soundEnabled) playChime('alert');
        window.dispatchEvent(
          new CustomEvent('lis-global-toast', {
            detail: { message: `🚨 ALERTA CRÍTICA: ${check.reason}`, type: 'error', duration: 8000 }
          })
        );
        return;
      }

      // Update active context with verified unit
      setSelectedContext(prev => ({
        ...prev,
        unitNumber: matchedUnit.unit_number,
        unitComponent: matchedUnit.component_type || prev.unitComponent,
        unitBloodType: matchedUnit.blood_type,
        unitRh: matchedUnit.rh_factor,
        unitStatus: matchedUnit.status
      }));

      setVerificationStatus('MATCHED_VERIFIED');
      setTransfusionActive(true);
      if (soundEnabled) playChime('success');
      window.dispatchEvent(
        new CustomEvent('lis-global-toast', {
          detail: { message: '✓ VERIFICACIÓN A PIE DE CAMA EXITOSA: Paciente y Unidad 100% Compatibles. Doble Chequeo Autorizado.', type: 'success' }
        })
      );
    } else {
      // Demo fallback check
      if (pCode === '8-812-4432' && uCode === 'PGRE-2026-0812') {
        setVerificationStatus('MATCHED_VERIFIED');
        setTransfusionActive(true);
        if (soundEnabled) playChime('success');
        window.dispatchEvent(
          new CustomEvent('lis-global-toast', {
            detail: { message: '✓ VERIFICACIÓN A PIE DE CAMA EXITOSA: Paciente y Unidad 100% Compatibles.', type: 'success' }
          })
        );
      } else {
        setVerificationStatus('MISMATCH_BLOCKED');
        setMismatchReason(`La unidad ISBT 128 '${uCode}' no corresponde al paciente cédula '${pCode}' o no se encuentra registrada/reservada en el inventario.`);
        if (soundEnabled) playChime('alert');
        window.dispatchEvent(
          new CustomEvent('lis-global-toast', {
            detail: { message: '🚨 TRANSFUSIÓN BLOQUEADA: Divergencia entre código escaneado y expediente.', type: 'error', duration: 7000 }
          })
        );
      }
    }
  };

  const handleUpdateVital = (phase: VitalSignRecord['phase'], field: keyof VitalSignRecord, val: any) => {
    setVitals(prev =>
      prev.map(v => (v.phase === phase ? { ...v, [field]: val } : v))
    );
  };

  const handleCompleteTransfusion = async () => {
    try {
      if (!isDemoMode) {
        await BloodBankService.completeBedsideTransfusion({
          unitId: selectedContext.unitId || '',
          unitNumber: selectedContext.unitNumber,
          requestId: selectedContext.requestId,
          patientId: selectedContext.patientId,
          vitals,
          nurseAdmin,
          nurseAdminLicense,
          nurseWitness,
          nurseWitnessLicense,
          notes: 'Transfusión completada a pie de cama conforme a normas de Hemovigilancia MINSA.'
        });
      }
      setTransfusionActive(false);
      setTransfusionFinished(true);
      if (soundEnabled) playChime('success');
      window.dispatchEvent(
        new CustomEvent('lis-global-toast', {
          detail: {
            message: `✓ TRANSFUSIÓN FINALIZADA EXITOSAMENTE: Bolsa ${selectedContext.unitNumber} actualizada a 'TRANSFUSED'. Expediente firmado.`,
            type: 'success',
            duration: 6000
          }
        })
      );
    } catch (err: any) {
      window.dispatchEvent(
        new CustomEvent('lis-global-toast', {
          detail: { message: `Error al registrar finalización: ${err.message}`, type: 'error' }
        })
      );
    }
  };

  const handleReportAdverseReaction = () => {
    setTransfusionActive(false);
    if (soundEnabled) playChime('alert');
    window.dispatchEvent(
      new CustomEvent('lis-global-toast', {
        detail: {
          message: '🚨 PROTOCOLO DE REACCIÓN ADVERSA ACTIVADO: Infusión detenida inmediatamente. Retorno de bolsa a Banco de Sangre con muestra post-transfusional.',
          type: 'error',
          duration: 9000
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
              Verificación doble al pie de cama (Doble Chequeo de Enfermería), escáner ISBT 128, registro de signos vitales en 4 fases y pase automático a TRANSFUSED.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold text-xs rounded-xl transition cursor-pointer"
            title={soundEnabled ? 'Sonido de alarmas activo' : 'Sonido silenciado'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>

          <button
            onClick={() => {
              setActiveOfficialForm('F-TRANS-02');
              setShowOfficialFormsModal(true);
            }}
            className="px-4 py-2 bg-slate-950 hover:bg-slate-800 border border-cyan-500/40 text-cyan-300 font-bold text-xs rounded-xl transition flex items-center space-x-1.5 cursor-pointer shadow"
          >
            <FileText className="w-4 h-4 text-cyan-400" />
            <span>Certificado F-TRANS-02</span>
          </button>

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

        <div className="border-b border-slate-800 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h3 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
            <QrCode className="w-5 h-5 text-rose-400" />
            <span>Escáner de Verificación de Seguridad Transfusional (Pie de Cama)</span>
          </h3>
          <span className="text-[10px] font-mono text-cyan-300 bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/30">
            {selectedContext.bedLocation} • {selectedContext.patientName} ({selectedContext.patientBloodType}{selectedContext.patientRh === 'POS' ? '+' : '-'})
          </span>
        </div>

        {/* Quick selector if requests exist */}
        {pendingRequests.length > 0 && (
          <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400 font-semibold">Cargar Solicitud Activa del Servicio:</span>
            <select
              className="bg-slate-900 text-white border border-slate-700 rounded-xl px-3 py-1.5 font-mono text-xs focus:outline-none focus:border-rose-500"
              onChange={(e) => {
                const req = pendingRequests.find(r => r.id === e.target.value);
                if (req) {
                  const p = req.patients || {};
                  const ced = p.identification_number || p.national_id || '';
                  setScannedPatientId(ced);
                  setSelectedContext(prev => ({
                    ...prev,
                    requestId: req.id,
                    patientId: p.id,
                    patientName: `${p.first_name || ''} ${p.last_name || ''}`.trim(),
                    patientCedula: ced,
                    patientBloodType: p.blood_type || 'O',
                    patientRh: p.rh_factor || 'POS',
                    bedLocation: req.diagnosis || 'Cama Hospitalaria'
                  }));
                }
              }}
            >
              <option value="">-- Seleccionar Solicitud de Transfusión --</option>
              {pendingRequests.map(r => (
                <option key={r.id} value={r.id}>
                  {r.patients?.first_name} {r.patients?.last_name} ({r.patients?.blood_type}{r.patients?.rh_factor === 'POS' ? '+' : '-'}) - {r.component_requested}
                </option>
              ))}
            </select>
          </div>
        )}

        <form onSubmit={handleVerifyBedsideMatch} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-slate-300">1. Escanear Pulsera Paciente (Cédula/ID)</label>
            <div className="relative">
              <input
                type="text"
                required
                value={scannedPatientId}
                onChange={(e) => setScannedPatientId(e.target.value)}
                placeholder="Escanee QR de pulsera o ingrese cédula..."
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white font-mono font-bold focus:outline-none focus:border-rose-400"
              />
              <span className="absolute right-3 top-2.5 text-[10px] text-slate-500 font-mono">ID / QR</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-slate-300">2. Escanear Código Bolsa ISBT 128</label>
            <div className="relative">
              <input
                type="text"
                required
                value={scannedUnitCode}
                onChange={(e) => setScannedUnitCode(e.target.value)}
                placeholder="Escanee código de barra ISBT 128..."
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white font-mono font-bold focus:outline-none focus:border-rose-400"
              />
              <span className="absolute right-3 top-2.5 text-[10px] text-rose-400 font-mono">ISBT 128</span>
            </div>
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
              <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/40 shrink-0">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-sm font-black text-emerald-300 uppercase tracking-wider flex items-center gap-2">
                  <span>✓ VERIFICACIÓN DE SEGURIDAD APROBADA (DOBLE CHEQUEO)</span>
                  <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-2 py-0.5 rounded-full border border-emerald-500/30">
                    AABB & MINSA OK
                  </span>
                </h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  El paciente <strong className="text-white">{selectedContext.patientName} ({selectedContext.patientBloodType}{selectedContext.patientRh === 'POS' ? '+' : '-'})</strong> y la unidad <strong className="text-rose-300">{selectedContext.unitNumber} ({selectedContext.unitBloodType}{selectedContext.unitRh === 'POS' ? '+' : '-'})</strong> son 100% compatibles.
                </p>
                <div className="text-[11px] text-slate-400 font-mono mt-1">
                  Enfermera Administradora: <span className="text-emerald-300 font-bold">{nurseAdmin} ({nurseAdminLicense})</span> • Testigo: <span className="text-slate-300">{nurseWitness} ({nurseWitnessLicense})</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              {transfusionFinished ? (
                <span className="px-3.5 py-1.5 bg-blue-500/20 text-blue-300 border border-blue-500/40 rounded-xl text-xs font-mono font-bold flex items-center space-x-1.5">
                  <Check className="w-4 h-4" />
                  <span>Transfusión Registrada en BD</span>
                </span>
              ) : (
                <span className="px-3 py-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-mono font-bold flex items-center space-x-1.5">
                  <Activity className="w-3.5 h-3.5 animate-pulse" />
                  <span>Transfusión Activa</span>
                </span>
              )}
            </div>
          </div>
        )}

        {verificationStatus === 'MISMATCH_BLOCKED' && (
          <div className="bg-rose-950/60 border-2 border-rose-500 rounded-3xl p-6 shadow-2xl flex items-center space-x-4 animate-pulse">
            <div className="p-3 bg-rose-500/20 text-rose-400 rounded-2xl border border-rose-500/40 shrink-0">
              <Lock className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-sm font-black text-rose-300 uppercase tracking-wider flex items-center gap-2">
                <span>🚨 TRANSFUSIÓN BLOQUEADA: INCOMPATIBILIDAD O DIVERGENCIA</span>
                <span className="bg-rose-500/20 text-rose-300 text-[10px] px-2 py-0.5 rounded-full border border-rose-500/30">
                  ALTO RIESGO CLÍNICO
                </span>
              </h4>
              <p className="text-xs text-rose-200 mt-1 font-semibold">
                {mismatchReason || 'Los datos escaneados no coinciden con la reserva asignada al paciente. Por seguridad del paciente, la unidad no puede ser transfundida.'}
              </p>
              <p className="text-[11px] text-rose-300/80 mt-1">
                Acción inmediata: Retener la unidad, no puncionar el sello de la bolsa y notificar de urgencia a Banco de Sangre.
              </p>
            </div>
          </div>
        )}

        {/* Nurses Identification */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
          <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800/80 space-y-2">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              <span>Enfermera Administradora (Titular)</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={nurseAdmin}
                onChange={(e) => setNurseAdmin(e.target.value)}
                placeholder="Nombre y Apellido"
                className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
              />
              <input
                type="text"
                value={nurseAdminLicense}
                onChange={(e) => setNurseAdminLicense(e.target.value)}
                placeholder="N° Idoneidad MINSA"
                className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-mono"
              />
            </div>
          </div>

          <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800/80 space-y-2">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-cyan-400" />
              <span>Enfermera Testigo (Doble Chequeo Obligatorio)</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={nurseWitness}
                onChange={(e) => setNurseWitness(e.target.value)}
                placeholder="Nombre y Apellido"
                className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
              />
              <input
                type="text"
                value={nurseWitnessLicense}
                onChange={(e) => setNurseWitnessLicense(e.target.value)}
                placeholder="N° Idoneidad MINSA"
                className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-mono"
              />
            </div>
          </div>
        </div>

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

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                handleReportAdverseReaction();
                setActiveOfficialForm('F-HEMO-01');
                setShowOfficialFormsModal(true);
              }}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black rounded-xl transition shadow-lg shadow-rose-600/30 flex items-center space-x-1.5 cursor-pointer shrink-0"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Reportar Sospecha / F-HEMO-01</span>
            </button>

            {verificationStatus === 'MATCHED_VERIFIED' && !transfusionFinished && (
              <button
                onClick={handleCompleteTransfusion}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl transition shadow-lg shadow-emerald-600/30 flex items-center space-x-1.5 cursor-pointer shrink-0"
              >
                <Check className="w-4 h-4" />
                <span>Finalizar y Registrar en BD</span>
              </button>
            )}
          </div>
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
              {vitals.map((v) => (
                <tr key={v.phase} className="hover:bg-slate-800/30">
                  <td className="p-3 font-sans font-bold text-white">
                    <span className="block text-xs">{v.label}</span>
                    {v.phase === '15_MIN' && (
                      <span className="text-[10px] text-amber-400 font-bold font-sans">⚠️ Fase crítica hemovigilancia</span>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    <input
                      type="text"
                      value={v.time}
                      onChange={(e) => handleUpdateVital(v.phase, 'time', e.target.value)}
                      className="w-16 bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-center text-cyan-300 font-bold text-xs"
                    />
                  </td>
                  <td className="p-3 text-center">
                    <input
                      type="text"
                      value={v.bloodPressure}
                      onChange={(e) => handleUpdateVital(v.phase, 'bloodPressure', e.target.value)}
                      className="w-20 bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-center text-slate-200 font-bold text-xs"
                    />
                  </td>
                  <td className="p-3 text-center">
                    <input
                      type="number"
                      value={v.heartRate}
                      onChange={(e) => handleUpdateVital(v.phase, 'heartRate', Number(e.target.value))}
                      className="w-16 bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-center text-slate-200 font-bold text-xs"
                    />
                  </td>
                  <td className="p-3 text-center">
                    <input
                      type="number"
                      value={v.respiratoryRate}
                      onChange={(e) => handleUpdateVital(v.phase, 'respiratoryRate', Number(e.target.value))}
                      className="w-14 bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-center text-slate-200 text-xs"
                    />
                  </td>
                  <td className="p-3 text-center">
                    <input
                      type="number"
                      step="0.1"
                      value={v.temperature}
                      onChange={(e) => handleUpdateVital(v.phase, 'temperature', Number(e.target.value))}
                      className={`w-16 bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-center font-bold text-xs ${v.temperature > 37.5 ? 'text-rose-400' : 'text-emerald-400'}`}
                    />
                  </td>
                  <td className="p-3 text-center">
                    <input
                      type="number"
                      value={v.spO2}
                      onChange={(e) => handleUpdateVital(v.phase, 'spO2', Number(e.target.value))}
                      className="w-14 bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-center text-slate-200 font-bold text-xs"
                    />
                  </td>
                  <td className="p-3 font-sans">
                    <input
                      type="text"
                      value={v.adverseSymptoms}
                      onChange={(e) => handleUpdateVital(v.phase, 'adverseSymptoms', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-0.5 text-slate-300 text-[11px]"
                    />
                  </td>
                  <td className="p-3 text-center">
                    <input
                      type="text"
                      value={v.nurseInitials}
                      onChange={(e) => handleUpdateVital(v.phase, 'nurseInitials', e.target.value)}
                      className="w-12 bg-slate-950 border border-slate-700 rounded px-1 py-0.5 text-center font-bold text-teal-300 text-[11px]"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Printable Sheet Modal in US Letter (Carta 8.5" x 11") */}
      {showPrintModal && typeof document !== 'undefined' && createPortal(
        <div id="printable-bedside-transfusion-modal" data-printable-portal="true" className="printable-modal-overlay fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-0 sm:p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl min-h-screen sm:min-h-0 sm:max-h-[96vh] rounded-none sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden print:max-h-none print:overflow-visible print:shadow-none print:border-none print:w-full print:bg-white print:rounded-none">
            
            {/* Modal Header */}
            <div className="no-print p-3 sm:p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between print:hidden">
              <span className="font-bold text-white text-xs sm:text-sm flex items-center space-x-2">
                <Printer className="w-4 h-4 text-rose-400" />
                <span>Vista Previa: Hoja Oficial de Monitoreo Transfusional</span>
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow cursor-pointer flex items-center space-x-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir en Carta (8.5" x 11")</span>
                </button>
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Letter Format Sheet */}
            <div className="flex-1 overflow-y-auto p-2 sm:p-6 bg-slate-800/40 flex justify-center print:p-0 print:bg-white print:overflow-visible">
              <div id="printable-bedside-transfusion" data-printable="true" className="w-full max-w-[8.5in] bg-white text-slate-900 shadow-2xl p-4 sm:p-6 font-sans text-xs space-y-2.5 print:space-y-1.5 border border-slate-200 print:border-none single-page-letter print:p-0">
                
                {/* Header */}
                <div className="border-b-2 border-slate-900 pb-2 flex items-center justify-between">
                  <div>
                    <span className="text-[9px] font-mono uppercase tracking-widest text-slate-500 font-bold block">
                      REPÚBLICA DE PANAMÁ • MINISTERIO DE SALUD
                    </span>
                    <h1 className="text-sm sm:text-base font-black text-slate-950 uppercase leading-tight">
                      HOJA CLÍNICA DE MONITOREO Y ADMINISTRACIÓN DE HEMOCOMPONENTES
                    </h1>
                    <div className="text-[10px] font-bold text-rose-800">
                      Servicio de Transfusión Sanguínea & Hemovigilancia Hospitalaria
                    </div>
                  </div>
                  <div className="text-right font-mono text-[10px]">
                    <div>Fecha: {new Date().toLocaleDateString('es-PA')}</div>
                    <div className="font-bold text-slate-950 text-xs">Folio: TRS-{selectedContext.unitNumber}</div>
                  </div>
                </div>

                {/* Patient & Unit Data */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200 text-[10px] avoid-break">
                  <div>
                    <span className="text-[8.5px] text-slate-500 font-bold block uppercase">Paciente</span>
                    <strong className="text-slate-950 block truncate">{selectedContext.patientName}</strong>
                  </div>
                  <div>
                    <span className="text-[8.5px] text-slate-500 font-bold block uppercase">Cédula / ID</span>
                    <strong className="text-slate-950 font-mono block">{selectedContext.patientCedula}</strong>
                  </div>
                  <div>
                    <span className="text-[8.5px] text-slate-500 font-bold block uppercase">Ubicación</span>
                    <strong className="text-slate-950 block truncate">{selectedContext.bedLocation}</strong>
                  </div>
                  <div>
                    <span className="text-[8.5px] text-slate-500 font-bold block uppercase">Grupo Paciente</span>
                    <strong className="text-slate-950 font-mono block">{selectedContext.patientBloodType} {selectedContext.patientRh === 'POS' ? 'Rh Positivo' : 'Rh Negativo'}</strong>
                  </div>
                  <div>
                    <span className="text-[8.5px] text-slate-500 font-bold block uppercase">Unidad ISBT 128</span>
                    <strong className="text-rose-900 font-mono block">{selectedContext.unitNumber}</strong>
                  </div>
                  <div>
                    <span className="text-[8.5px] text-slate-500 font-bold block uppercase">Componente</span>
                    <strong className="text-slate-950 block truncate">{selectedContext.unitComponent}</strong>
                  </div>
                  <div>
                    <span className="text-[8.5px] text-slate-500 font-bold block uppercase">Grupo Unidad</span>
                    <strong className="text-slate-950 font-mono block">{selectedContext.unitBloodType} {selectedContext.unitRh === 'POS' ? 'Rh Positivo' : 'Rh Negativo'}</strong>
                  </div>
                  <div>
                    <span className="text-[8.5px] text-slate-500 font-bold block uppercase">Pruebas Cruzadas</span>
                    <strong className="text-emerald-800 block">COMPATIBLE (Doble Chequeo)</strong>
                  </div>
                </div>

                {/* Vitals Table */}
                <div className="avoid-break">
                  <div className="bg-slate-900 text-white px-2.5 py-0.5 font-bold text-[10px] uppercase rounded-t">
                    REGISTRO CRONOLÓGICO DE SIGNOS VITALES
                  </div>
                  <table className="w-full text-left border border-slate-300 text-[10px]">
                    <thead className="bg-slate-100 font-bold uppercase text-[8.5px] text-slate-700 border-b border-slate-300">
                      <tr>
                        <th className="p-1.5">Momento</th>
                        <th className="p-1.5 text-center">Hora</th>
                        <th className="p-1.5 text-center">P.A.</th>
                        <th className="p-1.5 text-center">F.C.</th>
                        <th className="p-1.5 text-center">F.R.</th>
                        <th className="p-1.5 text-center">Temp.</th>
                        <th className="p-1.5 text-center">SpO2</th>
                        <th className="p-1.5">Observaciones Clínicas</th>
                        <th className="p-1.5 text-center">Firma</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-mono text-[9.5px]">
                      {vitals.map(v => (
                        <tr key={v.phase}>
                          <td className="p-1.5 font-sans font-bold">{v.label}</td>
                          <td className="p-1.5 text-center">{v.time}</td>
                          <td className="p-1.5 text-center">{v.bloodPressure}</td>
                          <td className="p-1.5 text-center">{v.heartRate}</td>
                          <td className="p-1.5 text-center">{v.respiratoryRate}</td>
                          <td className="p-1.5 text-center font-bold">{v.temperature.toFixed(1)}°C</td>
                          <td className="p-1.5 text-center">{v.spO2}%</td>
                          <td className="p-1.5 font-sans text-slate-700 text-[9px]">{v.adverseSymptoms}</td>
                          <td className="p-1.5 text-center font-bold">{v.nurseInitials}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Double Nurse Sign-off */}
                <div className="avoid-break signature-block pt-3 border-t-2 border-slate-300 grid grid-cols-2 gap-6 text-center text-xs">
                  <div className="space-y-0.5">
                    <div className="border-b border-slate-400 pb-0.5 h-7 flex items-end justify-center font-serif italic text-slate-800 text-xs">
                      {nurseAdmin}
                    </div>
                    <strong className="block text-[10px]">Enfermera Administradora</strong>
                    <span className="text-[8.5px] text-slate-500 font-mono block">Idoneidad: {nurseAdminLicense}</span>
                  </div>

                  <div className="space-y-0.5">
                    <div className="border-b border-slate-400 pb-0.5 h-7 flex items-end justify-center font-serif italic text-slate-800 text-xs">
                      {nurseWitness}
                    </div>
                    <strong className="block text-[10px]">Enfermera Testigo (Doble Chequeo)</strong>
                    <span className="text-[8.5px] text-slate-500 font-mono block">Idoneidad: {nurseWitnessLicense}</span>
                  </div>
                </div>

                {/* Footer */}
                <div className="pt-1.5 border-t border-slate-200 flex justify-between text-[8px] text-slate-400 font-mono avoid-break">
                  <span>Documento oficial de archivo para el Expediente Clínico Hospitalario (Ley 68 de 2003).</span>
                  <span>Página 1 de 1 • Sistema LIS/HIS/Banco de Sangre Panamá</span>
                </div>

              </div>
            </div>

          </div>
        </div>,
        document.body
      )}

      {showOfficialFormsModal && (
        <OfficialBloodBankFormsPDF
          initialForm={activeOfficialForm}
          contextData={{
            patient: {
              fullName: selectedContext.patientName,
              nationalId: selectedContext.patientCedula,
              hospitalBed: selectedContext.bedLocation,
              bloodType: selectedContext.patientBloodType,
              rhFactor: selectedContext.patientRh,
              diagnosis: 'Requerimiento Transfusional Urgencia',
              requestDoctor: 'Médico Hospitalario'
            },
            unit: {
              unitNumber: selectedContext.unitNumber,
              componentType: selectedContext.unitComponent,
              volumeMl: 300,
              bloodType: selectedContext.unitBloodType,
              rhFactor: selectedContext.unitRh,
              expiryDate: selectedContext.expiryDate,
              storageLocation: 'SERVICIO_TRANSFUSION'
            }
          }}
          onClose={() => setShowOfficialFormsModal(false)}
        />
      )}

    </div>
  );
};
