import React, { useState } from 'react';
import {
  FileText,
  User,
  Activity,
  Stethoscope,
  Plus,
  Send,
  Microscope,
  Pill,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileCheck2,
  Download,
  Flame,
  ShieldAlert,
  ChevronRight,
  BedDouble,
  Droplets,
  Layers,
  HeartPulse,
  Eye,
  Calendar,
  ShieldCheck,
  Check,
  Thermometer,
  RotateCw,
  ZoomIn,
  Sliders,
  Maximize2
} from 'lucide-react';
import { useHisStore } from '../../store/useHisStore';
import { useLisStore } from '../../store/useLisStore';
import { SoapNote, Order, MedicationOrder, Priority } from '../../types';
import { MOCK_TEST_CATALOG } from '../../data/mockData';
import { INITIAL_TRANSFUSION_CASES } from '../Phase6Suite/TechnologistSuite/TransfusionEvolutionManager';

interface EhrProps {
  onOpenPdf?: (orderId: string) => void;
}

export const ElectronicHealthRecordEHR: React.FC<EhrProps> = ({ onOpenPdf }) => {
  const {
    admissions,
    selectedAdmissionId,
    setSelectedAdmissionId,
    beds,
    soapNotes,
    addSoapNote,
    medicationOrders,
    addMedicationOrder
  } = useHisStore();

  const { orders, results, addOrder, currentUser } = useLisStore();

  // Active admission
  const activeAdmission = admissions.find((a) => a.id === selectedAdmissionId) || admissions[0];
  const activeBed = beds.find((b) => b.id === activeAdmission?.bedId);

  // Sub-tabs in EHR: 6 Comprehensive Clinical Dimensions for Doctor
  const [subTab, setSubTab] = useState<'resumen' | 'soap' | 'meds' | 'lab' | 'imaging' | 'bloodbank'>('resumen');

  // New SOAP note state
  const [subjective, setSubjective] = useState<string>('');
  const [objective, setObjective] = useState<string>('');
  const [assessment, setAssessment] = useState<string>('');
  const [plan, setPlan] = useState<string>('');

  // New Lab Order state
  const [selectedTestIds, setSelectedTestIds] = useState<string[]>(['test-hemograma']);
  const [orderPriority, setOrderPriority] = useState<Priority>('STAT');
  const [labNotes, setLabNotes] = useState<string>('Evaluación urgente de cabecera.');

  // New Med Order state
  const [drugName, setDrugName] = useState<string>('');
  const [dose, setDose] = useState<string>('');
  const [route, setRoute] = useState<MedicationOrder['route']>('INTRAVENOSA');
  const [frequency, setFrequency] = useState<MedicationOrder['frequency']>('CADA_8H');

  // DICOM Viewer Modal state
  const [selectedDicomStudy, setSelectedDicomStudy] = useState<any | null>(null);

  // Filtered lists for this active patient
  const patientSoapNotes = soapNotes.filter(
    (s) => s.admissionId === activeAdmission?.id || s.patientId === activeAdmission?.patientId
  );
  const patientLabOrders = orders.filter(
    (o) => o.patientNationalId === activeAdmission?.patientNationalId || o.patientId === activeAdmission?.patientId
  );
  const patientMeds = medicationOrders.filter(
    (m) => m.admissionId === activeAdmission?.id || m.patientId === activeAdmission?.patientId
  );

  // Transfusion records for this active patient
  const patientTransfusions = INITIAL_TRANSFUSION_CASES.filter(
    (t) =>
      (activeAdmission?.patientNationalId && t.patientNationalId === activeAdmission.patientNationalId) ||
      (activeAdmission?.patientId && t.patientId === activeAdmission.patientId)
  );

  // Imaging studies for this active patient (RIS/PACS) - Strictly patient-specific
  const patientImagingStudies = (
    activeAdmission?.patientNationalId === '8-745-1290'
      ? [
          {
            id: 'img-101',
            accessionNumber: 'RAD-2026-0812',
            modality: 'RX_TORAX',
            modalityName: 'Radiografía de Tórax PA y Lateral Portátil',
            studyDate: '2026-09-07 08:30 AM',
            orderingDoctor: activeAdmission?.admittingDoctorName || 'Dr. Alejandro Icaza',
            radiologist: 'Dr. Fernando Arango (Radiólogo Especialista)',
            status: 'INFORMADO',
            report: 'Silueta cardíaca limítrofe con aumento leve del índice cardiotorácico. Sin signos de congestión venocapilar activa ni derrame pleural. Senos costofrénicos libres.',
            dicomImagesCount: 2
          }
        ]
      : activeAdmission?.patientNationalId === '8-812-4432'
      ? [
          {
            id: 'img-102',
            accessionNumber: 'RAD-2026-0815',
            modality: 'ULTRASONIDO_RENAL',
            modalityName: 'Ultrasonido Renal y Vías Urinarias',
            studyDate: '2026-09-06 16:45 PM',
            orderingDoctor: activeAdmission?.admittingDoctorName || 'Dra. Patricia Boyd',
            radiologist: 'Dra. Marcela Guardia (Radióloga Especialista)',
            status: 'INFORMADO',
            report: 'Riñón derecho con discreto aumento de volumen y pérdida de diferenciación corticomedular en polo inferior, hallazgos compatibles con proceso pielonefrítico agudo. No se observan colecciones perirrenales ni litiasis obstructiva.',
            dicomImagesCount: 16
          }
        ]
      : []
  );

  const handleCreateSoap = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAdmission || !subjective || !assessment) {
      alert('Por favor complete los campos obligatorios de la nota SOAP.');
      return;
    }

    const newNote: SoapNote = {
      id: `soap-${Date.now()}`,
      admissionId: activeAdmission.id,
      patientId: activeAdmission.patientId,
      doctorId: currentUser?.id || 'doc-icaza',
      doctorName: currentUser?.name || 'Dr. Alejandro Icaza',
      doctorLicense: currentUser?.licenseNumber || 'MP-6612-PA',
      timestamp: new Date().toISOString(),
      subjective,
      objective,
      assessment,
      plan
    };

    addSoapNote(newNote);
    setSubjective('');
    setObjective('');
    setAssessment('');
    setPlan('');
    alert('Nota médica SOAP registrada en el expediente clínico.');
  };

  const handleDispatchLabOrder = () => {
    if (!activeAdmission || selectedTestIds.length === 0) return;

    const newOrder: Order = {
      id: `ord-his-${Date.now()}`,
      tenantId: activeAdmission.tenantId,
      branchId: activeAdmission.branchId,
      orderNumber: `HOSP-${Math.floor(1000 + Math.random() * 9000)}`,
      patientId: activeAdmission.patientId,
      patientName: activeAdmission.patientName,
      patientNationalId: activeAdmission.patientNationalId,
      patientGender: 'M',
      patientAge: 48,
      doctorId: currentUser?.id || 'doc-hosp',
      doctorName: activeAdmission.admittingDoctorName,
      priority: orderPriority,
      status: 'REGISTRADA',
      createdAt: new Date().toISOString(),
      totalAmount: 45.00,
      paymentStatus: 'ASEGURADORA',
      serviceOrigin: `${activeAdmission.ward} - Cama ${activeBed?.bedNumber || '01'}`,
      specimens: selectedTestIds.map((tId, idx) => ({
        id: `spc-${Date.now()}-${idx}`,
        orderId: `ord-his-${Date.now()}`,
        barcode: `BC-HOSP-${Math.floor(10000 + Math.random() * 90000)}`,
        tubeType: 'SUERO_ROJO',
        status: 'PENDIENTE'
      })),
      testIds: selectedTestIds
    };

    addOrder(newOrder);
    alert(`¡Orden ${newOrder.orderNumber} enviada al LIS con éxito desde Cama ${activeBed?.bedNumber}!`);
  };

  const handleCreateMedOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAdmission || !drugName || !dose) return;

    const newMed: MedicationOrder = {
      id: `med-${Date.now()}`,
      admissionId: activeAdmission.id,
      patientId: activeAdmission.patientId,
      drugName,
      dose,
      route,
      frequency,
      startDate: new Date().toISOString(),
      orderedBy: activeAdmission.admittingDoctorName,
      status: 'ACTIVA'
    };

    addMedicationOrder(newMed);
    setDrugName('');
    setDose('');
    alert(`Medicamento ${newMed.drugName} prescrito e ingresado al Kardex.`);
  };

  if (!activeAdmission) {
    return (
      <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-3xl">
        <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
        <h3 className="font-bold text-white">No hay admisiones hospitalarias activas</h3>
        <p className="text-xs text-slate-400 mt-1">Realice un ingreso desde el módulo de Triage de Urgencias.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Patient 360 Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Patient Details */}
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <span className="bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-black uppercase px-2.5 py-1 rounded-full">
                {activeAdmission.ward === 'CONSULTA_EXTERNA' ? 'Consulta Externa' : activeAdmission.ward} • {activeAdmission.ward === 'CONSULTA_EXTERNA' ? 'Consultorio 102' : `Cama ${activeBed?.bedNumber || 'S/A'}`}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Cédula: <strong className="text-white">{activeAdmission.patientNationalId}</strong>
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Expediente: <strong className="text-indigo-400">EXP-{activeAdmission.patientNationalId.replace(/-/g, '')}</strong>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {activeAdmission.patientName}
            </h1>

            <div className="text-xs text-slate-300 flex flex-wrap items-center gap-3">
              <span>Médico Tratante: <strong className="text-indigo-300">{activeAdmission.admittingDoctorName}</strong></span>
              <span>• Ingreso: <strong>{new Date(activeAdmission.admissionDate).toLocaleDateString('es-PA')}</strong></span>
              <span>• Tipo Sanguíneo: <strong className="text-rose-400">
                {patientTransfusions.length > 0
                  ? `${patientTransfusions[0].aboGroup} Rh(${patientTransfusions[0].rhFactor === 'POS' ? '+' : '-'})`
                  : activeAdmission.patientNationalId === '8-710-3321'
                  ? 'Sin tipificar (No requerido)'
                  : 'O Rhesus Positivo (O+)'}
              </strong></span>
            </div>

            {/* Diagnosis & Allergies */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[11px] bg-slate-800 text-slate-200 px-3 py-1 rounded-xl border border-slate-700 font-medium">
                DX Activo: <strong className="text-white">{activeAdmission.primaryDiagnosisIcd10}</strong>
              </span>
              {activeAdmission.allergies.map((allg, idx) => (
                <span key={idx} className="text-[11px] bg-rose-500/20 text-rose-300 border border-rose-500/30 px-3 py-1 rounded-xl font-bold flex items-center space-x-1">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Alergia: {allg}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Patient Selector for Doctors */}
          <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl shrink-0 space-y-1.5">
            <label className="text-[10px] font-bold uppercase text-slate-400 block">
              Seleccionar Paciente (Consulta Externa / Urgencias / Hospitalización)
            </label>
            <select
              value={activeAdmission.id}
              onChange={(e) => setSelectedAdmissionId(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
            >
              {admissions.map((adm) => (
                <option key={adm.id} value={adm.id}>
                  [{adm.ward === 'CONSULTA_EXTERNA' ? 'CONSULTA EXTERNA' : adm.ward}] {adm.patientName} ({adm.patientNationalId})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs: Unified 6 Dimensions */}
      <div className="flex flex-wrap border border-slate-800 bg-slate-900 rounded-2xl p-1.5 shadow-lg gap-1.5">
        <button
          onClick={() => setSubTab('resumen')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            subTab === 'resumen' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-400 hover:text-white'
          }`}
        >
          <User className="w-4 h-4 text-indigo-300" />
          <span>Resumen Clínico 360°</span>
        </button>

        <button
          onClick={() => setSubTab('soap')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            subTab === 'soap' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Stethoscope className="w-4 h-4 text-cyan-400" />
          <span>Evolución Médica (Notas SOAP)</span>
        </button>

        <button
          onClick={() => setSubTab('meds')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            subTab === 'meds' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Pill className="w-4 h-4 text-amber-400" />
          <span>Medicamentos & Farmacia ({patientMeds.length})</span>
        </button>

        <button
          onClick={() => setSubTab('lab')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            subTab === 'lab' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Microscope className="w-4 h-4 text-teal-400" />
          <span>Laboratorio LIS ({patientLabOrders.length})</span>
        </button>

        <button
          onClick={() => setSubTab('imaging')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            subTab === 'imaging' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4 text-sky-400" />
          <span>Imágenes RIS / PACS ({patientImagingStudies.length})</span>
        </button>

        <button
          onClick={() => setSubTab('bloodbank')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            subTab === 'bloodbank' ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Droplets className="w-4 h-4 text-rose-300" />
          <span>Banco de Sangre & Transfusiones ({patientTransfusions.length})</span>
        </button>
      </div>

      {/* DIMENSIÓN 1: RESUMEN CLÍNICO 360° */}
      {subTab === 'resumen' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs">
          {/* Col 1: Antecedentes & Constantes */}
          <div className="lg:col-span-6 space-y-4">
            {/* Antecedentes */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-3">
              <h3 className="font-bold text-white text-sm border-b border-slate-800 pb-2.5 flex items-center space-x-2">
                <FileText className="w-4 h-4 text-indigo-400" />
                <span>Antecedentes Clínicos del Paciente</span>
              </h3>

              <div className="space-y-2 text-slate-300">
                <p>
                  <strong className="text-white">Patológicos:</strong> Hipertensión Arterial esencial (estadio 2), Dislipidemia mixta.
                </p>
                <p>
                  <strong className="text-white">Quirúrgicos:</strong> Apendicectomía laparoscópica (2018), Colecistectomía por litiasis vesicular (2021).
                </p>
                <p>
                  <strong className="text-white">Toxicológicos / Hábitos:</strong> No tabaquismo, consumo social de alcohol ocasional, sin drogas ilícitas.
                </p>
                <p>
                  <strong className="text-white">Familiares:</strong> Padre con infarto agudo de miocardio a los 58 años. Madre con diabetes mellitus tipo 2.
                </p>
                <p>
                  <strong className="text-white">Alergias Severas:</strong> {activeAdmission.allergies.join(', ') || 'Sin alergias medicamentosas conocidas'}.
                </p>
              </div>
            </div>

            {/* Constantes Vitales */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-3">
              <h3 className="font-bold text-white text-sm border-b border-slate-800 pb-2.5 flex items-center space-x-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span>Signos Vitales & Monitorización de Cabecera</span>
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-[10px] uppercase text-slate-500 font-bold block">Presión Arterial</span>
                  <strong className="text-white text-sm font-mono">125 / 80</strong>
                  <span className="text-[10px] text-emerald-400 block">mmHg</span>
                </div>

                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-[10px] uppercase text-slate-500 font-bold block">Frec. Cardíaca</span>
                  <strong className="text-white text-sm font-mono">78</strong>
                  <span className="text-[10px] text-emerald-400 block">lpm (Sinusal)</span>
                </div>

                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-[10px] uppercase text-slate-500 font-bold block">Frec. Resp.</span>
                  <strong className="text-white text-sm font-mono">16</strong>
                  <span className="text-[10px] text-emerald-400 block">rpm</span>
                </div>

                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-[10px] uppercase text-slate-500 font-bold block">Temperatura</span>
                  <strong className="text-white text-sm font-mono">36.7</strong>
                  <span className="text-[10px] text-emerald-400 block">°C (Afebril)</span>
                </div>

                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-[10px] uppercase text-slate-500 font-bold block">Saturación SpO2</span>
                  <strong className="text-white text-sm font-mono">98%</strong>
                  <span className="text-[10px] text-emerald-400 block">Aire ambiente</span>
                </div>

                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-[10px] uppercase text-slate-500 font-bold block">Glasgow</span>
                  <strong className="text-white text-sm font-mono">15 / 15</strong>
                  <span className="text-[10px] text-emerald-400 block">Lúcido / Alerta</span>
                </div>
              </div>
            </div>
          </div>

          {/* Col 2: Resumen Integrado (Lab + Transfusiones + Imágenes + Citas) */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-3">
              <h3 className="font-bold text-white text-sm border-b border-slate-800 pb-2.5 flex items-center justify-between">
                <span className="flex items-center space-x-2">
                  <HeartPulse className="w-4 h-4 text-rose-400" />
                  <span>Estado Clínico Transversal Integrado</span>
                </span>
                <span className="text-[10px] text-indigo-400 font-bold">HIS $\leftrightarrow$ LIS $\leftrightarrow$ Banco de Sangre</span>
              </h3>

              <div className="space-y-2.5">
                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-white block">Laboratorio Clínico (LIS)</span>
                    <span className="text-slate-400 text-[11px]">
                      {patientLabOrders.length > 0
                        ? `${patientLabOrders.length} orden(es) analítica(s) en curso con sincronización LIS.`
                        : 'Sin estudios de laboratorio registrados (Consulta médica independiente).'}
                    </span>
                  </div>
                  <button onClick={() => setSubTab('lab')} className="px-3 py-1 bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 rounded-xl font-bold cursor-pointer text-xs">
                    {patientLabOrders.length > 0 ? 'Ver Resultados' : 'Solicitar si Aplica'}
                  </button>
                </div>

                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-white block">Imágenes Diagnósticas (RIS / PACS)</span>
                    <span className="text-slate-400 text-[11px]">
                      {patientImagingStudies.length > 0
                        ? `${patientImagingStudies.length} estudio(s) informado(s) con visor DICOM.`
                        : 'Sin estudios de imagenología registrados para este paciente.'}
                    </span>
                  </div>
                  <button onClick={() => setSubTab('imaging')} className="px-3 py-1 bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 rounded-xl font-bold cursor-pointer text-xs">
                    {patientImagingStudies.length > 0 ? 'Ver Rayos X / TAC' : 'Revisar PACS'}
                  </button>
                </div>

                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-white block">Medicina Transfusional & Banco de Sangre</span>
                    <span className="text-slate-400 text-[11px]">
                      {patientTransfusions.length > 0
                        ? `${patientTransfusions.length} caso(s) en flujo transfusional activo (${patientTransfusions[0].componentRequested.replace(/_/g, ' ')})`
                        : 'Sin solicitudes ni antecedentes de transfusión registrados.'}
                    </span>
                  </div>
                  <button onClick={() => setSubTab('bloodbank')} className="px-3 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 rounded-xl font-bold cursor-pointer text-xs">
                    {patientTransfusions.length > 0 ? 'Ver Sangre' : 'Revisar Inmuno'}
                  </button>
                </div>
              </div>
            </div>

            {/* Próximo Seguimiento y Citas */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-3">
              <h3 className="font-bold text-white text-sm border-b border-slate-800 pb-2.5 flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-indigo-400" />
                <span>Seguimiento Médico & Próximas Citas</span>
              </h3>

              <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-indigo-300 font-bold">
                  <span>Consulta de Control Especializado</span>
                  <span>15 de Octubre 2026 • 10:00 AM</span>
                </div>
                <p className="text-slate-300">Consultorio 304 • Especialidad: Medicina Interna & Cardiología Clínica</p>
                <p className="text-slate-500 text-[11px]">Objetivo: Reevaluación de biomarcadores cardíacos y respuesta a farmacoterapia post-alta.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DIMENSIÓN 2: NOTAS SOAP */}
      {subTab === 'soap' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
              <Plus className="w-4 h-4 text-indigo-400" />
              <h3 className="font-bold text-white text-sm">Nueva Nota de Evolución Diaria (Pase de Visita)</h3>
            </div>

            <form onSubmit={handleCreateSoap} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-300 block mb-1">
                  [S] Subjetivo (Síntomas referidos por el paciente)
                </label>
                <textarea
                  value={subjective}
                  onChange={(e) => setSubjective(e.target.value)}
                  placeholder="Paciente refiere alivio del dolor, tolerancia oral..."
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">
                  [O] Objetivo (Examen físico, constantes vitales y hallazgos)
                </label>
                <textarea
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  placeholder="PA 120/80, afebril, campos pulmonares limpios, abdomen blando..."
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">
                  [A] Análisis (Juicio clínico y evolución del cuadro)
                </label>
                <textarea
                  value={assessment}
                  onChange={(e) => setAssessment(e.target.value)}
                  placeholder="Evolución clínica satisfactoria en respuesta a tratamiento..."
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">
                  [P] Plan (Conducta terapéutica, ajustes y exámenes solicitados)
                </label>
                <textarea
                  value={plan}
                  onChange={(e) => setPlan(e.target.value)}
                  placeholder="1. Continuar antibiótico. 2. Solicitar hemograma de control. 3. Dieta blanda..."
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl shadow-lg shadow-indigo-600/20 transition cursor-pointer"
              >
                Firmar y Guardar Nota SOAP
              </button>
            </form>
          </div>

          <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="font-bold text-white text-sm border-b border-slate-800 pb-3 flex items-center space-x-2">
              <Clock className="w-4 h-4 text-indigo-400" />
              <span>Historial de Evolución Médica ({patientSoapNotes.length})</span>
            </h3>

            <div className="space-y-4 max-h-[550px] overflow-y-auto pr-1">
              {patientSoapNotes.map((note) => (
                <div key={note.id} className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-400 border-b border-slate-900 pb-2">
                    <span className="font-bold text-indigo-300">{note.doctorName} ({note.doctorLicense})</span>
                    <span>{new Date(note.timestamp).toLocaleString('es-PA')}</span>
                  </div>

                  <div className="space-y-1.5 text-slate-300">
                    <p><strong className="text-white">[S]:</strong> {note.subjective}</p>
                    <p><strong className="text-white">[O]:</strong> {note.objective}</p>
                    <p><strong className="text-white">[A]:</strong> {note.assessment}</p>
                    <p><strong className="text-white">[P]:</strong> {note.plan}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* DIMENSIÓN 3: MEDICAMENTOS & FARMACIA (eMAR) */}
      {subTab === 'meds' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="font-bold text-white text-sm border-b border-slate-800 pb-3 flex items-center space-x-2">
              <Pill className="w-4 h-4 text-amber-400" />
              <span>Prescribir Nuevo Medicamento</span>
            </h3>

            <form onSubmit={handleCreateMedOrder} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-300 block mb-1">Fármaco / Principio Activo</label>
                <input
                  type="text"
                  value={drugName}
                  onChange={(e) => setDrugName(e.target.value)}
                  placeholder="Ej: Ceftriaxona, Enoxaparina, Furosemida"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Dosis</label>
                  <input
                    type="text"
                    value={dose}
                    onChange={(e) => setDose(e.target.value)}
                    placeholder="Ej: 1 g, 40 mg"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Vía de Administración</label>
                  <select
                    value={route}
                    onChange={(e) => setRoute(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  >
                    <option value="INTRAVENOSA">Intravenosa (IV)</option>
                    <option value="ORAL">Oral (VO)</option>
                    <option value="SUBCUTANEA">Subcutánea (SC)</option>
                    <option value="INTRAMUSCULAR">Intramuscular (IM)</option>
                    <option value="INHALATORIA">Inhalatoria</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Frecuencia de Dosificación</label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                >
                  <option value="CADA_6H">Cada 6 Horas</option>
                  <option value="CADA_8H">Cada 8 Horas</option>
                  <option value="CADA_12H">Cada 12 Horas</option>
                  <option value="CADA_24H">Cada 24 Horas</option>
                  <option value="STAT_UNICA">STAT Dosis Única</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl shadow-lg shadow-amber-500/20 transition cursor-pointer"
              >
                Agregar a Indicaciones y Kardex
              </button>
            </form>
          </div>

          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="font-bold text-white text-sm border-b border-slate-800 pb-3 flex items-center space-x-2">
              <FileCheck2 className="w-4 h-4 text-emerald-400" />
              <span>Medicamentos Activos en Hoja de Indicaciones ({patientMeds.length})</span>
            </h3>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {patientMeds.map((med) => (
                <div key={med.id} className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl flex items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="font-bold text-white text-sm">{med.drugName} ({med.dose})</div>
                    <div className="text-[11px] text-amber-300">Vía: {med.route} • Frecuencia: {med.frequency}</div>
                    <div className="text-[10px] text-slate-500 mt-1">Prescrito por: {med.orderedBy}</div>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 rounded-full text-[10px] font-black">
                    ACTIVO
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* DIMENSIÓN 4: LABORATORIO CLÍNICO LIS */}
      {subTab === 'lab' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-teal-500/30 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Microscope className="w-5 h-5 text-teal-400" />
                <h3 className="font-bold text-white text-sm">Solicitud Directa de Exámenes de Laboratorio al LIS</h3>
              </div>
              <span className="text-[10px] bg-teal-500/10 text-teal-300 border border-teal-500/30 px-2.5 py-1 rounded-full font-bold">
                Interoperabilidad Nativa HIS $\leftrightarrow$ LIS
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="font-bold text-slate-300 block mb-1">Exámenes del Catálogo LIS</label>
                <select
                  multiple
                  value={selectedTestIds}
                  onChange={(e) => setSelectedTestIds(Array.from(e.target.selectedOptions, (option: HTMLOptionElement) => option.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white h-28 focus:outline-none focus:border-teal-500"
                >
                  {MOCK_TEST_CATALOG.map((item) => (
                    <option key={item.id} value={item.id}>
                      [{item.category}] {item.name} (${item.price.toFixed(2)})
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-slate-500 block mt-1">Presione Ctrl para seleccionar varios exámenes.</span>
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Prioridad de Procesamiento</label>
                <div className="space-y-1.5">
                  {(['STAT', 'URGENTE', 'RUTINA'] as const).map((p) => (
                    <button
                      type="button"
                      key={p}
                      onClick={() => setOrderPriority(p)}
                      className={`w-full p-2 rounded-xl text-left font-bold transition cursor-pointer border ${
                        orderPriority === p
                          ? p === 'STAT'
                            ? 'bg-rose-500 text-white border-rose-600'
                            : 'bg-teal-500 text-slate-950 border-teal-400'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      {p === 'STAT' ? '⚡ STAT (Inmediata / Cuidados Críticos)' : p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col justify-between">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Procedencia Clínica Pre-asignada</label>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-slate-300 font-mono">
                    {activeAdmission.ward} - Cama {activeBed?.bedNumber || '01'}
                  </div>
                </div>

                <button
                  onClick={handleDispatchLabOrder}
                  className="w-full py-3 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black rounded-xl shadow-lg shadow-teal-500/20 transition cursor-pointer flex items-center justify-center space-x-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Emitir Orden al LIS en Tiempo Real</span>
                </button>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="font-bold text-white text-sm border-b border-slate-800 pb-3 flex items-center justify-between">
              <span>Órdenes & Resultados de Laboratorio de este Paciente ({patientLabOrders.length})</span>
              <span className="text-[10px] text-teal-400 font-bold">Sincronización Automática</span>
            </h3>

            {patientLabOrders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-3 rounded-l-xl">N° Orden LIS</th>
                      <th className="p-3">Fecha</th>
                      <th className="p-3">Prioridad</th>
                      <th className="p-3">Estado LIS</th>
                      <th className="p-3">Resultados Analíticos Validados</th>
                      <th className="p-3 rounded-r-xl text-right">Informe Oficial</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 font-medium">
                    {patientLabOrders.map((ord) => {
                      const ordResults = results.filter((r) => r.orderId === ord.id);
                      return (
                        <tr key={ord.id} className="hover:bg-slate-800/40 transition">
                          <td className="p-3 font-mono font-bold text-teal-300">{ord.orderNumber}</td>
                          <td className="p-3 text-slate-400">{new Date(ord.createdAt).toLocaleTimeString('es-PA', { hour: '2-digit', minute: '2-digit' })}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                              ord.priority === 'STAT' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-slate-800 text-slate-300'
                            }`}>
                              {ord.priority}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                              ord.status === 'VALIDADA_MED'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            }`}>
                              {ord.status}
                            </span>
                          </td>
                          <td className="p-3">
                            {ordResults.length > 0 ? (
                              <div className="flex flex-wrap gap-1.5">
                                {ordResults.map((res) => (
                                  <span
                                    key={res.id}
                                    className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border ${
                                      res.flag === 'CRITICO_ALTO' || res.flag === 'CRITICO_BAJO'
                                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                                        : res.flag === 'ALTO' || res.flag === 'BAJO'
                                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                        : 'bg-slate-800 text-slate-300 border-slate-700'
                                    }`}
                                  >
                                    {res.parameterName}: {res.value} {res.unit}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-500 italic text-[11px]">Procesando en analizador...</span>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => onOpenPdf && onOpenPdf(ord.id)}
                              className="px-3 py-1 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 rounded-xl text-[10px] font-bold transition cursor-pointer"
                            >
                              Ver PDF
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                <Microscope className="w-10 h-10 text-teal-400/40 mx-auto" />
                <div className="space-y-1">
                  <p className="font-bold text-white text-sm">Sin Estudios de Laboratorio Registrados</p>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Este paciente no cuenta con órdenes de análisis clínico en el LIS. La consulta médica, evolución SOAP y prescripción farmacológica operan de forma 100% independiente.
                  </p>
                </div>
                <div className="inline-flex items-center space-x-2 px-3 py-1 bg-slate-900 border border-slate-800 rounded-full text-[11px] text-teal-400 font-mono">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
                  <span>Puede emitir una orden arriba si el cuadro clínico lo requiere</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* DIMENSIÓN 5: IMÁGENES DIAGNÓSTICAS RIS / PACS */}
      {subTab === 'imaging' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Layers className="w-5 h-5 text-sky-400" />
                <h3 className="font-bold text-white text-sm">Estudios Radiológicos & Visor DICOM del Paciente</h3>
              </div>
              <span className="text-[10px] bg-sky-500/10 text-sky-300 border border-sky-500/30 px-2.5 py-1 rounded-full font-bold">
                RIS / PACS Hospitalario
              </span>
            </div>

            <div className="space-y-4">
              {patientImagingStudies.length > 0 ? (
                patientImagingStudies.map((study) => (
                  <div key={study.id} className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-3 text-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-900 pb-2">
                      <div>
                        <span className="font-mono text-sky-400 font-bold">{study.accessionNumber}</span>
                        <h4 className="font-bold text-white text-sm">{study.modalityName}</h4>
                        <p className="text-[11px] text-slate-400">Solicitado por: {study.orderingDoctor} • Fecha: {study.studyDate}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-[10px] font-bold">
                          {study.status}
                        </span>
                        <button
                          onClick={() => setSelectedDicomStudy(study)}
                          className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-bold flex items-center space-x-1.5 transition cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Abrir Visor DICOM</span>
                        </button>
                      </div>
                    </div>

                    <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800/80 space-y-1">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Informe Radiológico Oficial ({study.radiologist})</span>
                      <p className="text-slate-200 leading-relaxed italic">"{study.report}"</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                  <Layers className="w-10 h-10 text-sky-400/40 mx-auto" />
                  <div className="space-y-1">
                    <p className="font-bold text-white text-sm">Sin Estudios de Imagenología Registrados</p>
                    <p className="text-xs text-slate-400 max-w-md mx-auto">
                      El episodio clínico actual no ha requerido estudios radiológicos, ultrasonografía ni tomografía (RIS / PACS).
                    </p>
                  </div>
                  <span className="inline-block px-3 py-1 bg-slate-900 border border-slate-800 rounded-full text-[10px] text-slate-400 font-mono">
                    RIS / PACS En Espera de Solicitud Médica
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* DIMENSIÓN 6: BANCO DE SANGRE & TRANSFUSIONES */}
      {subTab === 'bloodbank' && (
        <div className="space-y-6">
          {patientTransfusions.length > 0 ? (
            <div className="bg-slate-900 border border-rose-500/30 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <Droplets className="w-5 h-5 text-rose-500 animate-pulse" />
                  <h3 className="font-bold text-white text-sm">Inmunohematología & Historial Transfusional del Paciente</h3>
                </div>
                <span className="text-[10px] bg-rose-500/10 text-rose-300 border border-rose-500/30 px-2.5 py-1 rounded-full font-bold">
                  Trazabilidad Vena a Vena
                </span>
              </div>

              {/* Inmunohematology Profile */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-center space-y-1">
                  <span className="text-[10px] uppercase text-slate-400 font-bold block">Grupo ABO</span>
                  <span className="text-2xl font-black text-rose-500 font-mono">{patientTransfusions[0].aboGroup}</span>
                  <span className="text-[10px] text-teal-400 block">Directa e Inversa OK</span>
                </div>

                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-center space-y-1">
                  <span className="text-[10px] uppercase text-slate-400 font-bold block">Factor Rh(D)</span>
                  <span className="text-2xl font-black text-white font-mono">{patientTransfusions[0].rhFactor === 'POS' ? 'Positivo (+)' : 'Negativo (-)'}</span>
                  <span className="text-[10px] text-slate-400 block">Fenotipo Confirmado</span>
                </div>

                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-center space-y-1">
                  <span className="text-[10px] uppercase text-slate-400 font-bold block">Anticuerpos Irregulares</span>
                  <span className="text-xl font-black text-teal-400">{patientTransfusions[0].irregularAntibodiesScreening}</span>
                  <span className="text-[10px] text-teal-300 block">PAI Paneles I, II, III</span>
                </div>

                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-center space-y-1">
                  <span className="text-[10px] uppercase text-slate-400 font-bold block">Hemovigilancia</span>
                  <span className="text-xl font-black text-emerald-400">
                    {patientTransfusions[0].hasAdverseReaction ? 'ALERTA REACCIÓN' : 'SEGURO'}
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    {patientTransfusions[0].hasAdverseReaction ? 'Reportado a MINSA' : 'Sin eventos adversos'}
                  </span>
                </div>
              </div>

              {/* Transfusion Records */}
              <div className="space-y-3 pt-2">
                <h4 className="font-bold text-white text-xs">Registro de Unidades & Pruebas Cruzadas de este Paciente ({patientTransfusions.length})</h4>

                <div className="space-y-3">
                  {patientTransfusions.map((trx) => (
                    <div key={trx.id} className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2 text-xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-900 pb-2">
                        <div>
                          <span className="font-mono text-rose-400 font-bold">{trx.caseNumber}</span>
                          <span className="ml-2 text-white font-bold">{trx.componentRequested.replace(/_/g, ' ')} ({trx.unitsRequested} U)</span>
                        </div>
                        <span className="px-2.5 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-full text-[10px] font-bold">
                          Etapa: {trx.currentStage}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-300">
                        <p><strong className="text-white">Unidad Asignada:</strong> <span className="font-mono text-teal-300 font-bold">{trx.assignedUnitCode || 'En proceso'}</span> ({trx.assignedUnitGroup || 'O+'})</p>
                        <p><strong className="text-white">Compatibilidad Cruzada:</strong> <span className="text-emerald-400 font-bold">{trx.crossmatchMajor || 'COMPATIBLE'}</span> (Fase Gel/Coombs)</p>
                        <p><strong className="text-white">Indicación Clínica:</strong> {trx.clinicalIndication}</p>
                        <p><strong className="text-white">Rendimiento:</strong> {trx.postHbHctYield || 'Evaluación post-infusión satisfactoria'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl text-center space-y-4">
              <div className="w-16 h-16 bg-rose-500/10 rounded-2xl border border-rose-500/20 flex items-center justify-center mx-auto text-rose-400">
                <Droplets className="w-8 h-8" />
              </div>
              <div className="space-y-1.5 max-w-lg mx-auto">
                <h3 className="text-lg font-bold text-white">Sin Registros en Banco de Sangre</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Este paciente no cuenta con solicitudes transfusionales, hemocomponentes reservados ni pruebas pretransfusionales (Coombs / Crossmatch) en el Banco de Sangre.
                </p>
                <p className="text-[11px] text-slate-500">
                  En PLATAFORMA-LIS, la atención médica ambulatoria y hospitalaria opera de manera desacoplada: los módulos especializados solo aportan datos cuando existe un requerimiento clínico real.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <span className="px-3 py-1 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 text-xs font-mono">
                  Expediente: EXP-{activeAdmission.patientNationalId.replace(/-/g, '')}
                </span>
                <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs font-medium flex items-center space-x-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Sin antecedentes transfusionales ni reacciones adversas</span>
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL: VISOR DICOM PACS */}
      {selectedDicomStudy && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 max-w-4xl w-full shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-black text-white flex items-center space-x-2">
                  <Layers className="w-5 h-5 text-sky-400" />
                  <span>Visor DICOM Radiológico • {selectedDicomStudy.modalityName}</span>
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  Accession: {selectedDicomStudy.accessionNumber} • Paciente: {activeAdmission.patientName} ({activeAdmission.patientNationalId})
                </p>
              </div>
              <button
                onClick={() => setSelectedDicomStudy(null)}
                className="text-slate-400 hover:text-white p-2 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* DICOM Canvas Simulation */}
            <div className="bg-black rounded-2xl border border-slate-800 h-80 sm:h-96 flex flex-col items-center justify-center relative overflow-hidden">
              <div className="absolute top-4 left-4 text-[10px] font-mono text-slate-400 space-y-1">
                <p>PACIENTE: {activeAdmission.patientName.toUpperCase()}</p>
                <p>CÉDULA: {activeAdmission.patientNationalId}</p>
                <p>MODALIDAD: {selectedDicomStudy.modality}</p>
                <p>SERIES: 1/{selectedDicomStudy.dicomImagesCount}</p>
              </div>

              <div className="text-center space-y-2">
                <Layers className="w-16 h-16 text-sky-500/50 mx-auto animate-pulse" />
                <span className="text-xs font-mono text-slate-400 block">[SERIE DICOM RENDERIZADA EN ALTA RESOLUCIÓN]</span>
                <span className="text-[10px] text-slate-600 block">Ventana mediastínica / parénquima pulmonar 1024x1024</span>
              </div>

              <div className="absolute bottom-4 flex items-center space-x-2 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-xl text-xs text-slate-300">
                <button className="p-1 hover:text-white cursor-pointer"><ZoomIn className="w-4 h-4" /></button>
                <button className="p-1 hover:text-white cursor-pointer"><Sliders className="w-4 h-4" /></button>
                <button className="p-1 hover:text-white cursor-pointer"><RotateCw className="w-4 h-4" /></button>
                <span className="text-[10px] font-mono text-slate-500">W: 400 L: 40</span>
              </div>
            </div>

            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-xs space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Informe Radiológico Oficial</span>
              <p className="text-slate-200 italic leading-relaxed">{selectedDicomStudy.report}</p>
              <span className="text-[10px] text-sky-400 font-bold block pt-1">Firmado digitalmente: {selectedDicomStudy.radiologist}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
