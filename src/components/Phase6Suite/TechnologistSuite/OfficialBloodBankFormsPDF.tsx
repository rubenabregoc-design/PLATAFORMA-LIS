import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Printer,
  FileText,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Download,
  Building2,
  Droplet,
  HeartPulse,
  UserCheck,
  QrCode
} from 'lucide-react';
import QRCode from 'qrcode';

export type OfficialFormType = 'F-DON-01' | 'F-TRANS-02' | 'F-HEMO-01';

export interface OfficialBloodBankFormsProps {
  initialForm?: OfficialFormType;
  contextData?: {
    donor?: any;
    patient?: any;
    unit?: any;
    crossmatch?: any;
    reaction?: any;
  };
  onClose: () => void;
}

export const OfficialBloodBankFormsPDF: React.FC<OfficialBloodBankFormsProps> = ({
  initialForm = 'F-TRANS-02',
  contextData = {},
  onClose
}) => {
  const [activeForm, setActiveForm] = useState<OfficialFormType>(initialForm);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  // Default context attributes with realistic fallback values
  const donor = contextData.donor || {
    fullName: 'Roberto Carlos Mendoza',
    nationalId: '8-765-4321',
    age: 32,
    gender: 'M',
    bloodType: 'O',
    rhFactor: 'POS',
    weight: 78.5,
    hemoglobin: 15.2,
    bloodPressure: '120/80',
    pulse: 72,
    temperature: 36.6,
    screeningDate: new Date().toLocaleDateString('es-PA'),
    doctorName: 'Dr. Alejandro Morales',
    doctorLicense: 'MED-4829-PA'
  };

  const patient = contextData.patient || {
    fullName: 'Fernando Abrego Castillo',
    nationalId: '8-812-4432',
    hospitalBed: 'UCI Cama 02 - Complejo Metropolitano',
    bloodType: 'O',
    rhFactor: 'POS',
    diagnosis: 'Shock Hipovolémico por Sangrado Digestivo Alto',
    requestDoctor: 'Dr. Carlos Villalobos (Idon: 6920-PA)'
  };

  const unit = contextData.unit || {
    unitNumber: 'PGRE-2026-0812',
    componentType: 'Concentrado de Glóbulos Rojos (CGR)',
    volumeMl: 300,
    bloodType: 'O',
    rhFactor: 'POS',
    collectionDate: '2026-11-10',
    expiryDate: '2026-12-15',
    storageLocation: 'NEVERA_CGR_01'
  };

  const crossmatch = contextData.crossmatch || {
    method: 'Cruces en Tarjeta de Gel + e-Crossmatch AABB',
    salinePhase: 'NEGATIVO (Compatible)',
    albuminPhase: 'NEGATIVO (Compatible)',
    coombsPhase: 'NEGATIVO (Compatible)',
    raiScreen: 'NEGATIVO (Células Pantalla I, II y III)',
    verdict: 'COMPATIBLE',
    technologistName: 'Lic. Ruben Abrego C.',
    technologistLicense: 'TM-8941-PA'
  };

  const reaction = contextData.reaction || {
    reactionId: 'RAT-PA-2026-004',
    dateTime: new Date().toLocaleString('es-PA'),
    category: 'REACCIÓN FEBRIL NO HEMOLÍTICA (RFNH)',
    severity: 'GRADO 1 (LEVE A MODERADA)',
    imputability: 'PROBABLE',
    transfusedVolumeBeforeStop: '45 mL',
    symptoms: 'Fiebre súbita de 38.6°C (+1.8°C sobre basal), escalofríos moderados, taquicardia sin hipotensión.',
    laboratoryPost: 'Hemólisis en plasma post-transfusión: NEGATIVA. Coombs Directo Post: NEGATIVO. Hemocultivo bolsa: EN PROCESO.',
    reportedBy: 'Dra. Elena Quintero',
    reportedLicense: 'MED-7182-PA'
  };

  // Generate QR for official verification
  useEffect(() => {
    const payload = JSON.stringify({
      rep: 'MINSA-PANAMA',
      form: activeForm,
      id: activeForm === 'F-DON-01' ? donor.nationalId : activeForm === 'F-TRANS-02' ? unit.unitNumber : reaction.reactionId,
      date: new Date().toISOString(),
      institution: 'SISTEMA NACIONAL DE BANCOS DE SANGRE - PLATAFORMA LIS'
    });

    QRCode.toDataURL(payload, { width: 140, margin: 1 })
      .then(url => setQrCodeUrl(url))
      .catch(err => console.error(err));
  }, [activeForm, donor.nationalId, unit.unitNumber, reaction.reactionId]);

  return typeof document !== 'undefined'
    ? createPortal(
        <div className="fixed inset-0 z-[120] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-0 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:overflow-visible">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl min-h-screen sm:min-h-0 sm:max-h-[96vh] rounded-none sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden print:max-h-none print:overflow-visible print:border-none print:shadow-none print:w-full print:bg-white print:rounded-none">
            
            {/* Modal Navigation & Controls (Hidden in Print) */}
            <div className="no-print p-4 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 print:hidden">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-rose-500" />
                <span className="font-black text-sm text-white uppercase tracking-wider">
                  Formatos Oficiales Regulatorios MINSA / CSS Panamá
                </span>
              </div>

              {/* Form Selector Tabs */}
              <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-2xl border border-slate-800 text-xs">
                <button
                  onClick={() => setActiveForm('F-DON-01')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                    activeForm === 'F-DON-01'
                      ? 'bg-rose-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  F-DON-01 (Donación)
                </button>
                <button
                  onClick={() => setActiveForm('F-TRANS-02')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                    activeForm === 'F-TRANS-02'
                      ? 'bg-rose-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  F-TRANS-02 (Compatibilidad)
                </button>
                <button
                  onClick={() => setActiveForm('F-HEMO-01')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                    activeForm === 'F-HEMO-01'
                      ? 'bg-rose-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  F-HEMO-01 (Reacción Adversa)
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow cursor-pointer flex items-center space-x-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir en Carta (8.5" x 11")</span>
                </button>
                <button
                  onClick={onClose}
                  className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Document Body (Single Page US Letter Format) */}
            <div className="flex-1 overflow-y-auto p-2 sm:p-6 bg-slate-800/40 flex justify-center print:p-0 print:bg-white print:overflow-visible">
              <div
                id="official-blood-bank-form"
                data-printable="true"
                className="w-full max-w-[8.5in] bg-white text-slate-900 shadow-2xl p-6 font-sans text-xs space-y-3 print:space-y-2 border border-slate-200 print:border-none single-page-letter print:p-0"
              >
                
                {/* =========================================================================
                    FORM 1: F-DON-01 (Consentimiento Informado y Autoexclusión Donante)
                    ========================================================================= */}
                {activeForm === 'F-DON-01' && (
                  <div className="space-y-2.5">
                    {/* Header */}
                    <div className="border-b-2 border-slate-900 pb-2 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 border-2 border-slate-900 flex items-center justify-center font-black text-rose-700 text-lg">
                          MINSA
                        </div>
                        <div>
                          <span className="text-[9px] font-mono uppercase tracking-widest text-slate-600 font-bold block">
                            REPÚBLICA DE PANAMÁ • MINISTERIO DE SALUD • CSS
                          </span>
                          <h1 className="text-base font-black text-slate-950 uppercase leading-tight">
                            FORMULARIO OFICIAL DE SELECCIÓN Y AUTOEXCLUSIÓN DEL DONANTE DE SANGRE
                          </h1>
                          <span className="text-[10px] font-bold text-rose-800">
                            Programa Nacional de Sangre y Hemoderivados • Cumplimiento Ley 68 de 2003
                          </span>
                        </div>
                      </div>
                      <div className="text-right font-mono text-[10px]">
                        <div className="font-bold text-xs text-rose-900">FORMATO: F-DON-01</div>
                        <div>Versión: 4.2 / Rev. 2026</div>
                        <div>Fecha: {donor.screeningDate}</div>
                      </div>
                    </div>

                    {/* Section 1: Donor Demographics */}
                    <div className="border border-slate-300 p-2 rounded bg-slate-50 text-[10.5px]">
                      <div className="font-bold text-[10px] uppercase text-slate-700 border-b border-slate-300 pb-0.5 mb-1">
                        1. IDENTIFICACIÓN DEL DONANTE
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        <div>
                          <span className="text-[9px] text-slate-500 block">Nombre Completo:</span>
                          <strong className="text-slate-900">{donor.fullName}</strong>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-500 block">Cédula / Pasaporte:</span>
                          <strong className="font-mono text-slate-900">{donor.nationalId}</strong>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-500 block">Edad / Sexo:</span>
                          <strong className="text-slate-900">{donor.age} años • {donor.gender === 'M' ? 'Masculino' : 'Femenino'}</strong>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-500 block">Grupo Sanguíneo:</span>
                          <strong className="text-rose-900 font-mono text-xs">{donor.bloodType} {donor.rhFactor === 'POS' ? 'Rh (+)' : 'Rh (-)'}</strong>
                        </div>
                      </div>
                    </div>

                    {/* Section 2: Physical & Clinical Screening */}
                    <div className="border border-slate-300 p-2 rounded text-[10.5px]">
                      <div className="font-bold text-[10px] uppercase text-slate-700 border-b border-slate-300 pb-0.5 mb-1">
                        2. EXAMEN FÍSICO Y PARÁMETROS HEMATOLÓGICOS (CRITERIOS MINSA)
                      </div>
                      <div className="grid grid-cols-6 gap-2 text-center font-mono">
                        <div className="bg-slate-100 p-1 rounded">
                          <span className="text-[8.5px] text-slate-500 block font-sans">Peso</span>
                          <strong className="text-slate-900">{donor.weight} kg</strong>
                          <span className="text-[7.5px] text-slate-400 block font-sans">(&ge; 50 kg)</span>
                        </div>
                        <div className="bg-slate-100 p-1 rounded">
                          <span className="text-[8.5px] text-slate-500 block font-sans">Hemoglobina</span>
                          <strong className="text-emerald-700">{donor.hemoglobin} g/dL</strong>
                          <span className="text-[7.5px] text-slate-400 block font-sans">(&ge; 12.5 g/dL)</span>
                        </div>
                        <div className="bg-slate-100 p-1 rounded">
                          <span className="text-[8.5px] text-slate-500 block font-sans">Presión Arterial</span>
                          <strong className="text-slate-900">{donor.bloodPressure}</strong>
                          <span className="text-[7.5px] text-slate-400 block font-sans">mmHg</span>
                        </div>
                        <div className="bg-slate-100 p-1 rounded">
                          <span className="text-[8.5px] text-slate-500 block font-sans">Pulso</span>
                          <strong className="text-slate-900">{donor.pulse} lpm</strong>
                          <span className="text-[7.5px] text-slate-400 block font-sans">(50 - 100)</span>
                        </div>
                        <div className="bg-slate-100 p-1 rounded">
                          <span className="text-[8.5px] text-slate-500 block font-sans">Temperatura</span>
                          <strong className="text-slate-900">{donor.temperature}°C</strong>
                          <span className="text-[7.5px] text-slate-400 block font-sans">(&le; 37.5°C)</span>
                        </div>
                        <div className="bg-emerald-100 p-1 rounded text-emerald-900">
                          <span className="text-[8.5px] text-emerald-700 block font-sans">Evaluación</span>
                          <strong className="text-xs">APTO</strong>
                        </div>
                      </div>
                    </div>

                    {/* Section 3: Confidential Self-Exclusion Questionnaire */}
                    <div className="border border-slate-300 p-2 rounded text-[10px] space-y-1">
                      <div className="font-bold uppercase text-slate-700 border-b border-slate-300 pb-0.5">
                        3. CUESTIONARIO EPIDEMIOLÓGICO Y DECLARACIÓN JURADA
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[9px] text-slate-700 leading-snug">
                        <div>
                          <div>• ¿Ha tenido fiebre, gripe o diarrea en los últimos 15 días? <strong>[ NO ]</strong></div>
                          <div>• ¿Ha recibido transfusiones o cirugías en los últimos 12 meses? <strong>[ NO ]</strong></div>
                          <div>• ¿Se ha realizado tatuajes o piercings en los últimos 6 meses? <strong>[ NO ]</strong></div>
                        </div>
                        <div>
                          <div>• ¿Ha viajado a zonas endémicas de Malaria o Chagas recientemente? <strong>[ NO ]</strong></div>
                          <div>• ¿Ha padecido Hepatitis después de los 11 años de edad? <strong>[ NO ]</strong></div>
                          <div>• ¿Mantiene relaciones sexuales con personas de riesgo no protegidas? <strong>[ NO ]</strong></div>
                        </div>
                      </div>
                    </div>

                    {/* Section 4: Legal Informed Consent */}
                    <div className="border border-rose-200 bg-rose-50/50 p-2.5 rounded text-[9.5px] text-slate-800 leading-relaxed text-justify">
                      <strong className="text-rose-900 block text-[10px] uppercase mb-0.5 font-bold">
                        4. CONSENTIMIENTO INFORMADO Y AUTOEXCLUSIÓN CONFIDENCIAL
                      </strong>
                      Yo, el abajo firmante, declaro bajo juramento que toda la información suministrada es verídica. Autorizo la extracción de 450 mL (&plusmn;10%) de mi sangre y la realización de pruebas de tamizaje serológico e inmunohematológico para VIH 1/2, Hepatitis B, Hepatitis C, Sífilis, Chagas y HTLV I/II. Comprendo que tengo el derecho a la autoexclusión confidencial si considero que mi sangre no es segura para transfusión.
                    </div>

                    {/* Signatures & QR */}
                    <div className="pt-3 border-t-2 border-slate-300 grid grid-cols-3 gap-4 items-end text-center text-xs">
                      <div>
                        <div className="border-b border-slate-500 h-8 mb-1"></div>
                        <strong className="block text-[10.5px] text-slate-900">{donor.fullName}</strong>
                        <span className="text-[9px] text-slate-500 font-mono block">Firma del Donante (Céd: {donor.nationalId})</span>
                      </div>

                      <div>
                        <div className="border-b border-slate-500 h-8 mb-1 flex items-end justify-center font-serif italic text-xs text-slate-800">
                          {donor.doctorName}
                        </div>
                        <strong className="block text-[10.5px] text-slate-900">Médico / Tecnólogo Calificador</strong>
                        <span className="text-[9px] text-slate-500 font-mono block">Idoneidad: {donor.doctorLicense}</span>
                      </div>

                      <div className="flex flex-col items-center justify-center">
                        {qrCodeUrl && <img src={qrCodeUrl} alt="QR Validación" className="w-16 h-16" />}
                        <span className="text-[8px] font-mono text-slate-400">Validación Digital MINSA</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* =========================================================================
                    FORM 2: F-TRANS-02 (Certificado Oficial de Compatibilidad Inmunohematológica)
                    ========================================================================= */}
                {activeForm === 'F-TRANS-02' && (
                  <div className="space-y-2.5">
                    {/* Header */}
                    <div className="border-b-2 border-slate-900 pb-2 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 border-2 border-slate-900 flex items-center justify-center font-black text-rose-700 text-lg">
                          MINSA
                        </div>
                        <div>
                          <span className="text-[9px] font-mono uppercase tracking-widest text-slate-600 font-bold block">
                            REPÚBLICA DE PANAMÁ • MINISTERIO DE SALUD
                          </span>
                          <h1 className="text-base font-black text-slate-950 uppercase leading-tight">
                            CERTIFICADO DE COMPATIBILIDAD INMUNOHEMATOLÓGICA PRE-TRANSFUSIONAL
                          </h1>
                          <span className="text-[10px] font-bold text-rose-800">
                            Servicio de Medicina Transfusional & Banco de Sangre • Norma Técnica Nacional
                          </span>
                        </div>
                      </div>
                      <div className="text-right font-mono text-[10px]">
                        <div className="font-bold text-xs text-rose-900">FORMATO: F-TRANS-02</div>
                        <div>Folio: CPR-{unit.unitNumber}</div>
                        <div>Fecha: {new Date().toLocaleDateString('es-PA')}</div>
                      </div>
                    </div>

                    {/* Patient & Request Data */}
                    <div className="border border-slate-300 p-2 rounded bg-slate-50 text-[10.5px]">
                      <div className="font-bold text-[10px] uppercase text-slate-700 border-b border-slate-300 pb-0.5 mb-1">
                        1. DATOS DEL RECEPTOR (PACIENTE)
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <span className="text-[9px] text-slate-500 block">Nombre del Paciente:</span>
                          <strong className="text-slate-900">{patient.fullName}</strong>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-500 block">Cédula / Historia Clínica:</span>
                          <strong className="font-mono text-slate-900">{patient.nationalId}</strong>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-500 block">Grupo y Factor ABO/Rh:</span>
                          <strong className="text-rose-900 font-mono text-xs">{patient.bloodType} {patient.rhFactor === 'POS' ? 'Rh (+)' : 'Rh (-)'}</strong>
                        </div>
                        <div className="col-span-2">
                          <span className="text-[9px] text-slate-500 block">Ubicación / Sala / Cama:</span>
                          <strong className="text-slate-900">{patient.hospitalBed}</strong>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-500 block">Médico Solicitante:</span>
                          <strong className="text-slate-900">{patient.requestDoctor}</strong>
                        </div>
                      </div>
                    </div>

                    {/* Unit Data */}
                    <div className="border border-slate-300 p-2 rounded text-[10.5px]">
                      <div className="font-bold text-[10px] uppercase text-slate-700 border-b border-slate-300 pb-0.5 mb-1">
                        2. DATOS DE LA UNIDAD ASIGNADA (ISBT 128)
                      </div>
                      <div className="grid grid-cols-4 gap-2 font-mono">
                        <div>
                          <span className="text-[9px] text-slate-500 block font-sans">N° Unidad ISBT 128:</span>
                          <strong className="text-rose-900 text-xs">{unit.unitNumber}</strong>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-500 block font-sans">Hemocomponente:</span>
                          <strong className="text-slate-900 font-sans">{unit.componentType}</strong>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-500 block font-sans">Grupo Unidad:</span>
                          <strong className="text-slate-900">{unit.bloodType} {unit.rhFactor === 'POS' ? 'Rh (+)' : 'Rh (-)'}</strong>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-500 block font-sans">Caducidad:</span>
                          <strong className="text-slate-900">{unit.expiryDate}</strong>
                        </div>
                      </div>
                    </div>

                    {/* Immunohematology Protocol & Crossmatch Test Results */}
                    <div className="border border-slate-300 p-2 rounded text-[10px]">
                      <div className="font-bold uppercase text-slate-700 border-b border-slate-300 pb-0.5 mb-1 flex justify-between">
                        <span>3. PRUEBAS DE COMPATIBILIDAD MAYOR & SCREENING DE ANTICUERPOS</span>
                        <span className="font-mono text-cyan-800">Método: {crossmatch.method}</span>
                      </div>
                      <table className="w-full text-center border border-slate-300 mt-1 font-mono text-[9.5px]">
                        <thead className="bg-slate-100 font-bold uppercase text-[8.5px] text-slate-700 border-b border-slate-300">
                          <tr>
                            <th className="p-1">Fase Salina (I.S.)</th>
                            <th className="p-1">Fase Térmica (37°C Alb)</th>
                            <th className="p-1">Fase AGH (Coombs)</th>
                            <th className="p-1">Rastreo Ac Irregulares (RAI)</th>
                            <th className="p-1 bg-emerald-100 text-emerald-950 font-sans">Resultado Final</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          <tr>
                            <td className="p-1.5">{crossmatch.salinePhase}</td>
                            <td className="p-1.5">{crossmatch.albuminPhase}</td>
                            <td className="p-1.5">{crossmatch.coombsPhase}</td>
                            <td className="p-1.5">{crossmatch.raiScreen}</td>
                            <td className="p-1.5 bg-emerald-50 text-emerald-900 font-black font-sans text-xs">
                              ✓ {crossmatch.verdict}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Release Certification */}
                    <div className="bg-emerald-50 border border-emerald-300 p-2 rounded text-[9.5px] text-emerald-950">
                      <strong className="block text-[10px] uppercase font-bold text-emerald-900">
                        LIBERACIÓN Y DESPACHO AUTORIZADO
                      </strong>
                      Se certifica que la unidad descrita ha superado las pruebas de compatibilidad inmunohematológica serológica y electrónica, encontrándose libre de incompatibilidad mayor y con pruebas serológicas no reactivas. Válida para infusión en el paciente indicado.
                    </div>

                    {/* Signatures */}
                    <div className="pt-3 border-t-2 border-slate-300 grid grid-cols-3 gap-4 items-end text-center text-xs">
                      <div>
                        <div className="border-b border-slate-500 h-8 mb-1 flex items-end justify-center font-serif italic text-xs text-slate-800">
                          {crossmatch.technologistName}
                        </div>
                        <strong className="block text-[10.5px] text-slate-900">Tecnólogo Médico Responsable</strong>
                        <span className="text-[9px] text-slate-500 font-mono block">Idoneidad: {crossmatch.technologistLicense}</span>
                      </div>

                      <div>
                        <div className="border-b border-slate-500 h-8 mb-1"></div>
                        <strong className="block text-[10.5px] text-slate-900">Firma Enfermera que Recibe</strong>
                        <span className="text-[9px] text-slate-500 font-mono block">Fecha y Hora de Recepción</span>
                      </div>

                      <div className="flex flex-col items-center justify-center">
                        {qrCodeUrl && <img src={qrCodeUrl} alt="QR Validación" className="w-16 h-16" />}
                        <span className="text-[8px] font-mono text-slate-400">Certificación Digital AABB</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* =========================================================================
                    FORM 3: F-HEMO-01 (Notificación Oficial de Reacción Adversa a la Transfusión)
                    ========================================================================= */}
                {activeForm === 'F-HEMO-01' && (
                  <div className="space-y-2.5">
                    {/* Header */}
                    <div className="border-b-2 border-slate-900 pb-2 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 border-2 border-rose-900 flex items-center justify-center font-black text-rose-700 text-lg">
                          MINSA
                        </div>
                        <div>
                          <span className="text-[9px] font-mono uppercase tracking-widest text-slate-600 font-bold block">
                            REPÚBLICA DE PANAMÁ • MINISTERIO DE SALUD
                          </span>
                          <h1 className="text-base font-black text-rose-950 uppercase leading-tight">
                            NOTIFICACIÓN OFICIAL DE REACCIÓN ADVERSA A LA TRANSFUSIÓN (RAT)
                          </h1>
                          <span className="text-[10px] font-bold text-rose-800">
                            Red Nacional de Hemovigilancia Hospitalaria • Formulario Obligatorio Epidemiológico
                          </span>
                        </div>
                      </div>
                      <div className="text-right font-mono text-[10px]">
                        <div className="font-bold text-xs text-rose-900">FORMATO: F-HEMO-01</div>
                        <div>Caso: {reaction.reactionId}</div>
                        <div>Fecha: {reaction.dateTime}</div>
                      </div>
                    </div>

                    {/* Clinical Details */}
                    <div className="border border-slate-300 p-2 rounded bg-slate-50 text-[10.5px]">
                      <div className="font-bold text-[10px] uppercase text-slate-700 border-b border-slate-300 pb-0.5 mb-1">
                        1. IDENTIFICACIÓN DEL EVENTO TRANSFUSIONAL
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <span className="text-[9px] text-slate-500 block">Paciente:</span>
                          <strong className="text-slate-900">{patient.fullName} ({patient.nationalId})</strong>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-500 block">Unidad Transfundida:</span>
                          <strong className="font-mono text-rose-900">{unit.unitNumber} ({unit.componentType})</strong>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-500 block">Volumen Administrado:</span>
                          <strong className="text-slate-900">{reaction.transfusedVolumeBeforeStop}</strong>
                        </div>
                      </div>
                    </div>

                    {/* Classification */}
                    <div className="border border-rose-300 bg-rose-50/40 p-2 rounded text-[10.5px]">
                      <div className="font-bold text-[10px] uppercase text-rose-900 border-b border-rose-300 pb-0.5 mb-1">
                        2. CLASIFICACIÓN DE LA REACCIÓN SEGÚN HEMOVIGILANCIA MINSA
                      </div>
                      <div className="grid grid-cols-3 gap-2 font-mono">
                        <div>
                          <span className="text-[9px] text-slate-500 block font-sans">Diagnóstico Sospechoso:</span>
                          <strong className="text-rose-950 font-sans">{reaction.category}</strong>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-500 block font-sans">Severidad:</span>
                          <strong className="text-amber-800">{reaction.severity}</strong>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-500 block font-sans">Imputabilidad:</span>
                          <strong className="text-rose-900">{reaction.imputability}</strong>
                        </div>
                      </div>
                    </div>

                    {/* Signs and Symptoms */}
                    <div className="border border-slate-300 p-2 rounded text-[10px] space-y-1">
                      <div className="font-bold uppercase text-slate-700 border-b border-slate-300 pb-0.5">
                        3. MANIFESTACIONES CLÍNICAS Y ACCIONES INMEDIATAS ADOPTADAS
                      </div>
                      <p className="text-slate-800 text-[10px] leading-relaxed">
                        <strong>Signos y Síntomas:</strong> {reaction.symptoms}
                      </p>
                      <p className="text-slate-800 text-[10px] leading-relaxed">
                        <strong>Laboratorio Inmediato:</strong> {reaction.laboratoryPost}
                      </p>
                    </div>

                    {/* Signatures */}
                    <div className="pt-3 border-t-2 border-slate-300 grid grid-cols-3 gap-4 items-end text-center text-xs">
                      <div>
                        <div className="border-b border-slate-500 h-8 mb-1 flex items-end justify-center font-serif italic text-xs text-slate-800">
                          {reaction.reportedBy}
                        </div>
                        <strong className="block text-[10.5px] text-slate-900">Médico que Notifica</strong>
                        <span className="text-[9px] text-slate-500 font-mono block">Idoneidad: {reaction.reportedLicense}</span>
                      </div>

                      <div>
                        <div className="border-b border-slate-500 h-8 mb-1"></div>
                        <strong className="block text-[10.5px] text-slate-900">Coordinador de Hemovigilancia</strong>
                        <span className="text-[9px] text-slate-500 font-mono block">Banco de Sangre Institucional</span>
                      </div>

                      <div className="flex flex-col items-center justify-center">
                        {qrCodeUrl && <img src={qrCodeUrl} alt="QR Validación" className="w-16 h-16" />}
                        <span className="text-[8px] font-mono text-slate-400">Notificación Oficial MINSA</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Footer on each official form */}
                <div className="pt-2 border-t border-slate-300 flex justify-between text-[8px] text-slate-500 font-mono">
                  <span>Documento Médico-Legal Oficial para archivo en Expediente Clínico (Ley 68 de 2003 de la República de Panamá).</span>
                  <span>Página 1 de 1 • PLATAFORMA-LIS Banco de Sangre</span>
                </div>

              </div>
            </div>

          </div>
        </div>,
        document.body
      )
    : null;
};
