import React, { useState, useMemo } from 'react';
import {
  UserPlus, Search, ShieldCheck, FileText, CheckCircle2,
  DollarSign, QrCode, Printer, User, Heart,
  MapPin, Phone, CreditCard, Clock, Calendar,
  Stethoscope, Baby, Zap, ChevronRight, Barcode, Receipt, ArrowRight,
  Activity, Users, Sparkles, AlertTriangle, Layers,
  Building2, SlidersHorizontal, Check, RefreshCw, X, Pill, Eye,
  Radio, HardDrive, Droplets, CheckSquare
} from 'lucide-react';
import { Patient, Order, TestCatalogItem, Tenant, Branch } from '../types';
import { INSTITUTIONAL_HIS_DOCTORS } from '../data/institutionalDoctors';
import { notifyToast } from '../utils/toastNotification';
import { generateOrderNumber, generateSampleBarcode } from '../utils/orderUtils';

interface UnifiedAdmissionWorkspaceProps {
  patients: Patient[];
  testCatalog: TestCatalogItem[];
  orders: Order[];
  onCreateOrder: (newOrder: Order, newPatient?: Patient) => void;
  tenant: Tenant;
  branch?: Branch;
  onNavigateToLis?: () => void;
}

export const CLINICAL_SPECIALTIES = [
  { id: 'MEDICINA_GENERAL', name: 'Medicina General', doctor: 'Dr. Roberto Mendoza', room: 'Consultorio 101', price: 25.00, icon: '🩺' },
  { id: 'PEDIATRIA', name: 'Pediatría & Neonatología', doctor: 'Dra. Elena De León', room: 'Consultorio 102 (Pediátrico)', price: 45.00, icon: '👶' },
  { id: 'GINECOLOGIA', name: 'Ginecología y Obstetricia', doctor: 'Dra. Marcela Chen', room: 'Consultorio 103 (Ginecológico)', price: 50.00, icon: '🌸' },
  { id: 'ODONTOLOGIA', name: 'Odontología Integral', doctor: 'Dr. Carlos Villarreal', room: 'Consultorio Dental 1', price: 35.00, icon: '🦷' },
  { id: 'MEDICINA_INTERNA', name: 'Medicina Interna', doctor: 'Dr. Gabriel Alvarado', room: 'Consultorio 104', price: 50.00, icon: '🫀' },
  { id: 'CARDIOLOGIA', name: 'Cardiología', doctor: 'Dr. Fernando Arango', room: 'Consultorio 105', price: 65.00, icon: '❤️' }
];

export const RADIOLOGY_STUDIES = [
  { id: 'RX_TORAX', name: 'Rayos X de Tórax (PA y Lateral)', category: 'RAYOS_X', room: 'Sala RX 1', price: 30.00, icon: '🩻' },
  { id: 'US_ABDOMINAL', name: 'Ultrasonido Abdominal Completo', category: 'ULTRASONIDO', room: 'Ecografía 1', price: 55.00, icon: '📡' },
  { id: 'US_PELVICO', name: 'Ultrasonido Pélvico / Ginecológico', category: 'ULTRASONIDO', room: 'Ecografía 2', price: 45.00, icon: '📡' },
  { id: 'TAC_CRANEO', name: 'Tomografía Computarizada de Cráneo (TAC)', category: 'TOMOGRAFIA', room: 'Sala Tomografía', price: 120.00, icon: '🧠' },
  { id: 'MAMOGRAFIA', name: 'Mamografía Bilateral Digital', category: 'MAMOGRAFIA', room: 'Sala Mamografía', price: 50.00, icon: '🎗️' }
];

export const POPULAR_LAB_PROFILES = [
  { code: 'HEM', name: 'Hemograma Completo', price: 12.00, tube: 'Tapa Lila (EDTA)', color: 'border-purple-500/50 bg-purple-950/30 text-purple-300' },
  { code: 'GLU', name: 'Glucosa en Ayunas', price: 6.00, tube: 'Tapa Gris / Roja', color: 'border-amber-500/50 bg-amber-950/30 text-amber-300' },
  { code: 'PERF_LIP', name: 'Perfil Lipídico Completo', price: 25.00, tube: 'Tapa Amarilla (Gel)', color: 'border-yellow-500/50 bg-yellow-950/30 text-yellow-300' },
  { code: 'PERF_REN', name: 'Perfil Renal (BUN/Creat/Ác. Úrico)', price: 22.00, tube: 'Tapa Amarilla (Gel)', color: 'border-cyan-500/50 bg-cyan-950/30 text-cyan-300' },
  { code: 'PERF_HEP', name: 'Perfil Hepático (TGO/TGP/Bilirr.)', price: 28.00, tube: 'Tapa Amarilla (Gel)', color: 'border-emerald-500/50 bg-emerald-950/30 text-emerald-300' },
  { code: 'EGO', name: 'Urinálisis General (EGO)', price: 7.00, tube: 'Frasco Orina', color: 'border-teal-500/50 bg-teal-950/30 text-teal-300' },
  { code: 'HBA1C', name: 'Hemoglobina Glicosilada (HbA1c)', price: 20.00, tube: 'Tapa Lila (EDTA)', color: 'border-rose-500/50 bg-rose-950/30 text-rose-300' }
];

export const UnifiedAdmissionWorkspace: React.FC<UnifiedAdmissionWorkspaceProps> = ({
  patients,
  testCatalog,
  orders,
  onCreateOrder,
  tenant,
  branch,
  onNavigateToLis
}) => {
  // ── Mode & Module Licensing State ──────────────────────────────────────────
  const [admissionMode, setAdmissionMode] = useState<'CENTRALIZED' | 'INDIVIDUAL_LIS' | 'INDIVIDUAL_HIS' | 'INDIVIDUAL_RIS' | 'INDIVIDUAL_PHARMACY'>('CENTRALIZED');

  // Dynamic modules toggle for simulation and demonstration
  const [activeModules, setActiveModules] = useState<{
    laboratory_lis: boolean;
    medical_consultation: boolean;
    radiology_ris: boolean;
    pharmacy_pos: boolean;
  }>({
    laboratory_lis: tenant.modules?.laboratory_lis ?? true,
    medical_consultation: tenant.modules?.medical_consultation ?? true,
    radiology_ris: tenant.modules?.radiology_ris ?? true,
    pharmacy_pos: tenant.modules?.pharmacy_pos ?? true
  });

  const [showLicensingSimulator, setShowLicensingSimulator] = useState<boolean>(false);

  // ── Patient Identification State ─────────────────────────────────────────
  const [searchNationalId, setSearchNationalId] = useState<string>('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const [patientForm, setPatientForm] = useState({
    firstName: '',
    lastName: '',
    nationalId: '',
    gender: 'M' as 'M' | 'F',
    age: 30,
    phone: '',
    email: '',
    insuranceType: 'PARTICULAR' as 'PARTICULAR' | 'CSS' | 'PRIVADO',
    priority: 'NORMAL' as 'NORMAL' | 'LEY_42_PREFERENCIAL' | 'STAT_URGENTE',
    isFasting: true,
    fastingHours: 8
  });

  // ── Selected Services for Admission ───────────────────────────────────────
  // 1. Laboratorio LIS
  const [includeLab, setIncludeLab] = useState<boolean>(true);
  const [selectedLabTests, setSelectedLabTests] = useState<{ code: string; name: string; price: number; tube: string }[]>([
    POPULAR_LAB_PROFILES[0], // Hemograma por defecto
    POPULAR_LAB_PROFILES[1]  // Glucosa por defecto
  ]);
  const [referringDoctor, setReferringDoctor] = useState<string>(INSTITUTIONAL_HIS_DOCTORS[0]?.name || 'Dr. Roberto Mendoza');

  // 2. Consulta Médica HIS
  const [includeConsultation, setIncludeConsultation] = useState<boolean>(false);
  const [selectedSpecialtyId, setSelectedSpecialtyId] = useState<string>('MEDICINA_GENERAL');
  const [consultationReason, setConsultationReason] = useState<string>('Evaluación de rutina y chequeo general');

  // 3. Radiología RIS/PACS
  const [includeRadiology, setIncludeRadiology] = useState<boolean>(false);
  const [selectedRadiologyId, setSelectedRadiologyId] = useState<string>('RX_TORAX');

  // 4. Farmacia
  const [includePharmacy, setIncludePharmacy] = useState<boolean>(false);
  const [pharmacyItemsNote, setPharmacyItemsNote] = useState<string>('Retiro de medicamentos recetados');
  const [pharmacyEstimatedAmount, setPharmacyEstimatedAmount] = useState<number>(18.50);

  // ── Ticket / Admission Confirmation Modal ────────────────────────────────
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState<boolean>(false);
  const [lastGeneratedAdmission, setLastGeneratedAdmission] = useState<{
    admissionNumber: string;
    patientName: string;
    nationalId: string;
    date: string;
    services: string[];
    labOrderNumber?: string;
    totalAmount: number;
    ticketTurn: string;
  } | null>(null);

  // ── Patient Quick Search Autocomplete ────────────────────────────────────
  const searchResults = useMemo(() => {
    const q = searchNationalId.trim().toLowerCase();
    if (!q || q.length < 2) return [];
    return patients.filter(p =>
      p.nationalId.toLowerCase().includes(q) ||
      p.fullName.toLowerCase().includes(q)
    ).slice(0, 5);
  }, [searchNationalId, patients]);

  const handleSelectExistingPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setSearchNationalId(patient.nationalId);
    setPatientForm({
      firstName: patient.fullName.split(' ')[0] || '',
      lastName: patient.fullName.split(' ').slice(1).join(' ') || '',
      nationalId: patient.nationalId,
      gender: patient.gender as 'M' | 'F',
      age: patient.age,
      phone: patient.phone || '',
      email: patient.email || '',
      insuranceType: 'PARTICULAR',
      priority: patient.age >= 60 ? 'LEY_42_PREFERENCIAL' : 'NORMAL',
      isFasting: true,
      fastingHours: 8
    });
    notifyToast.info(`Paciente cargado: ${patient.fullName} (${patient.nationalId})`, 2500);
  };

  const handleResetForm = () => {
    setSelectedPatient(null);
    setSearchNationalId('');
    setPatientForm({
      firstName: '',
      lastName: '',
      nationalId: '',
      gender: 'M',
      age: 30,
      phone: '',
      email: '',
      insuranceType: 'PARTICULAR',
      priority: 'NORMAL',
      isFasting: true,
      fastingHours: 8
    });
    setSelectedLabTests([POPULAR_LAB_PROFILES[0], POPULAR_LAB_PROFILES[1]]);
    setIncludeConsultation(false);
    setIncludeRadiology(false);
    setIncludePharmacy(false);
  };

  // ── Calculations ─────────────────────────────────────────────────────────
  const selectedSpecialtyObj = useMemo(() => {
    return CLINICAL_SPECIALTIES.find(s => s.id === selectedSpecialtyId) || CLINICAL_SPECIALTIES[0];
  }, [selectedSpecialtyId]);

  const selectedRadiologyObj = useMemo(() => {
    return RADIOLOGY_STUDIES.find(r => r.id === selectedRadiologyId) || RADIOLOGY_STUDIES[0];
  }, [selectedRadiologyId]);

  const labTotal = useMemo(() => {
    if (!includeLab || !activeModules.laboratory_lis) return 0;
    return selectedLabTests.reduce((sum, t) => sum + t.price, 0);
  }, [includeLab, activeModules.laboratory_lis, selectedLabTests]);

  const consultationTotal = useMemo(() => {
    if (!includeConsultation || !activeModules.medical_consultation) return 0;
    return selectedSpecialtyObj.price;
  }, [includeConsultation, activeModules.medical_consultation, selectedSpecialtyObj]);

  const radiologyTotal = useMemo(() => {
    if (!includeRadiology || !activeModules.radiology_ris) return 0;
    return selectedRadiologyObj.price;
  }, [includeRadiology, activeModules.radiology_ris, selectedRadiologyObj]);

  const pharmacyTotal = useMemo(() => {
    if (!includePharmacy || !activeModules.pharmacy_pos) return 0;
    return pharmacyEstimatedAmount;
  }, [includePharmacy, activeModules.pharmacy_pos, pharmacyEstimatedAmount]);

  const totalBillAmount = labTotal + consultationTotal + radiologyTotal + pharmacyTotal;

  // Active services count
  const activeServicesCount = (includeLab && activeModules.laboratory_lis ? 1 : 0) +
    (includeConsultation && activeModules.medical_consultation ? 1 : 0) +
    (includeRadiology && activeModules.radiology_ris ? 1 : 0) +
    (includePharmacy && activeModules.pharmacy_pos ? 1 : 0);

  // ── Submit / Generate Unified Admission ──────────────────────────────────
  const handleConfirmAdmission = () => {
    const fullName = `${patientForm.firstName.trim()} ${patientForm.lastName.trim()}`.trim();
    if (!fullName || !patientForm.nationalId.trim()) {
      notifyToast.error('Por favor complete el nombre y documento del paciente antes de admitir.');
      return;
    }

    if (activeServicesCount === 0) {
      notifyToast.error('Debe seleccionar al menos un servicio (Laboratorio, Consulta, Rayos X o Farmacia).');
      return;
    }

    const patientId = selectedPatient?.id || `pat-${Date.now()}`;
    const newPatientObj: Patient = selectedPatient || {
      id: patientId,
      fullName,
      nationalId: patientForm.nationalId.trim(),
      gender: patientForm.gender,
      age: patientForm.age,
      birthDate: new Date(Date.now() - patientForm.age * 365.25 * 24 * 3600 * 1000).toISOString().split('T')[0],
      phone: patientForm.phone || '+507 6000-0000',
      email: patientForm.email || 'paciente@salud.pa',
      createdAt: new Date().toISOString()
    };

    let generatedLabOrderNumber: string | undefined = undefined;

    // 1. Si incluye Laboratorio (LIS), crear la Orden Clínica Real en el LIS
    if (includeLab && activeModules.laboratory_lis && selectedLabTests.length > 0) {
      generatedLabOrderNumber = generateOrderNumber(orders.length + 1);
      const testCodes = selectedLabTests.map(t => t.code);

      const newOrder: Order = {
        id: `ord-${Date.now()}`,
        orderNumber: generatedLabOrderNumber,
        sampleBarcode: generateSampleBarcode(patientForm.nationalId),
        patientId: newPatientObj.id,
        patientName: newPatientObj.fullName,
        patientAge: newPatientObj.age,
        patientGender: newPatientObj.gender,
        patientNationalId: newPatientObj.nationalId,
        referringDoctor: referringDoctor,
        tests: testCodes,
        status: 'PENDING',
        priority: patientForm.priority === 'STAT_URGENTE' ? 'STAT' : 'ROUTINE',
        totalAmount: labTotal,
        paid: false,
        paymentStatus: 'PENDING',
        branchId: branch?.id || 'branch-via-espana',
        tenantId: tenant.id,
        createdAt: new Date().toISOString()
      };

      onCreateOrder(newOrder, selectedPatient ? undefined : newPatientObj);
    }

    // 2. Generar el registro de la admisión unificada
    const turnLetter = patientForm.priority === 'STAT_URGENTE' ? 'URG' : patientForm.priority === 'LEY_42_PREFERENCIAL' ? 'PREF' : 'ADM';
    const turnNumber = `${turnLetter}-${Math.floor(100 + Math.random() * 900)}`;

    const servicesList: string[] = [];
    if (includeLab && activeModules.laboratory_lis) servicesList.push(`Laboratorio (${selectedLabTests.length} pruebas)`);
    if (includeConsultation && activeModules.medical_consultation) servicesList.push(`Consulta Médica (${selectedSpecialtyObj.name})`);
    if (includeRadiology && activeModules.radiology_ris) servicesList.push(`Radiología (${selectedRadiologyObj.name})`);
    if (includePharmacy && activeModules.pharmacy_pos) servicesList.push('Farmacia');

    const admissionSummary = {
      admissionNumber: `ADM-${Date.now().toString().slice(-6)}`,
      patientName: fullName,
      nationalId: patientForm.nationalId.trim(),
      date: new Date().toLocaleString(),
      services: servicesList,
      labOrderNumber: generatedLabOrderNumber,
      totalAmount: totalBillAmount,
      ticketTurn: turnNumber
    };

    setLastGeneratedAdmission(admissionSummary);
    setIsConfirmationModalOpen(true);
    notifyToast.success(`✓ Admisión ${admissionSummary.admissionNumber} generada. Paciente enrutado exitosamente.`, 5000);
  };

  const isSoloLis = activeModules.laboratory_lis &&
    !activeModules.medical_consultation &&
    !activeModules.radiology_ris &&
    !activeModules.pharmacy_pos;

  return (
    <div className="space-y-6">

      {/* ── TOP BANNER: ADMISSION HUB & MODULAR LICENSING ───────────────────── */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-indigo-950/40 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <span className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-400">
                <UserPlus className="w-5 h-5" />
              </span>
              <h2 className="text-2xl font-black text-white tracking-tight">
                {isSoloLis ? 'Admisión de Pacientes (Laboratorio Clínico LIS)' : 'Ventanilla Única & Admisión de Pacientes'}
              </h2>
            </div>
            <p className="text-xs text-slate-400">
              {isSoloLis
                ? 'Registro directo de pacientes, toma de órdenes de análisis, tubos requeridos y flebotomía.'
                : 'Punto de entrada unificado para Consultas Médicas, Laboratorio (LIS), Rayos X (RIS) y Farmacia.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Mode switch */}
            <div className="bg-slate-950 p-1 rounded-2xl border border-slate-800 flex items-center gap-1">
              <button
                type="button"
                onClick={() => setAdmissionMode('CENTRALIZED')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  admissionMode === 'CENTRALIZED'
                    ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Ventanilla Única</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAdmissionMode('INDIVIDUAL_LIS');
                  setIncludeLab(true);
                  setIncludeConsultation(false);
                  setIncludeRadiology(false);
                  setIncludePharmacy(false);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  admissionMode === 'INDIVIDUAL_LIS'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Droplets className="w-3.5 h-3.5" />
                <span>Solo Laboratorio</span>
              </button>
            </div>

            {/* Modular License Toggle Button */}
            <button
              type="button"
              onClick={() => setShowLicensingSimulator(!showLicensingSimulator)}
              className="px-3.5 py-2 bg-slate-800/90 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-bold rounded-xl border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
              title="Configurar qué módulos tiene contratados este cliente"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
              <span>Planes & Módulos</span>
            </button>
          </div>
        </div>

        {/* ── LICENSING SIMULATOR PANEL (Si no compran todo) ───────────────── */}
        {showLicensingSimulator && (
          <div className="mt-5 pt-4 border-t border-slate-800/80 bg-slate-950/70 p-4 rounded-2xl border border-amber-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-amber-400 font-bold text-xs">Simulador de Licencia Modular (Feature Flags):</span>
                <span className="text-[10px] text-slate-400 font-mono">Prueba cómo se adapta la pantalla según los módulos que compre el cliente</span>
              </div>
              <button onClick={() => setShowLicensingSimulator(false)} className="text-slate-500 hover:text-white text-xs">✕</button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <label className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between cursor-pointer hover:border-teal-500/50 transition">
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <span>🔬</span> Laboratorio (LIS)
                </div>
                <input
                  type="checkbox"
                  checked={activeModules.laboratory_lis}
                  onChange={(e) => setActiveModules(prev => ({ ...prev, laboratory_lis: e.target.checked }))}
                  className="rounded accent-teal-500"
                />
              </label>

              <label className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between cursor-pointer hover:border-teal-500/50 transition">
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <span>🩺</span> Consultas (HIS)
                </div>
                <input
                  type="checkbox"
                  checked={activeModules.medical_consultation}
                  onChange={(e) => setActiveModules(prev => ({ ...prev, medical_consultation: e.target.checked }))}
                  className="rounded accent-teal-500"
                />
              </label>

              <label className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between cursor-pointer hover:border-teal-500/50 transition">
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <span>🩻</span> Rayos X (RIS/PACS)
                </div>
                <input
                  type="checkbox"
                  checked={activeModules.radiology_ris}
                  onChange={(e) => setActiveModules(prev => ({ ...prev, radiology_ris: e.target.checked }))}
                  className="rounded accent-teal-500"
                />
              </label>

              <label className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between cursor-pointer hover:border-teal-500/50 transition">
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <span>💊</span> Farmacia POS
                </div>
                <input
                  type="checkbox"
                  checked={activeModules.pharmacy_pos}
                  onChange={(e) => setActiveModules(prev => ({ ...prev, pharmacy_pos: e.target.checked }))}
                  className="rounded accent-teal-500"
                />
              </label>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ── LEFT & CENTER: PATIENT FORM & SERVICES (8 Cols) ────────────────── */}
        <div className="lg:col-span-8 space-y-6">

          {/* 1. SECCIÓN: IDENTIFICACIÓN DEL PACIENTE */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center text-xs font-black">1</span>
                <h3 className="font-bold text-sm text-white">Datos del Paciente</h3>
              </div>
              <button
                type="button"
                onClick={handleResetForm}
                className="text-xs text-slate-400 hover:text-white transition flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" /> Limpiar
              </button>
            </div>

            {/* Quick Search / Auto-fill bar */}
            <div className="relative">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Búsqueda Rápida por Cédula o Nombre:
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchNationalId}
                  onChange={(e) => setSearchNationalId(e.target.value)}
                  placeholder="Ej: 8-765-4321 o Nombre del paciente..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-teal-500 transition"
                />
              </div>

              {/* Autocomplete Dropdown */}
              {searchResults.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-slate-950 border border-slate-700 rounded-2xl shadow-2xl z-30 overflow-hidden divide-y divide-slate-800">
                  {searchResults.map(p => (
                    <button
                      type="button"
                      key={p.id}
                      onClick={() => handleSelectExistingPatient(p)}
                      className="w-full p-3 text-left hover:bg-slate-900 flex items-center justify-between text-xs transition cursor-pointer"
                    >
                      <div>
                        <div className="font-bold text-white">{p.fullName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">Cédula: {p.nationalId} • {p.age} años • {p.gender === 'M' ? 'Masculino' : 'Femenino'}</div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 font-bold border border-teal-500/30">
                        Cargar Paciente ↵
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Nombres *
                </label>
                <input
                  type="text"
                  value={patientForm.firstName}
                  onChange={(e) => setPatientForm(prev => ({ ...prev, firstName: e.target.value }))}
                  placeholder="Ej: Carlos"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Apellidos *
                </label>
                <input
                  type="text"
                  value={patientForm.lastName}
                  onChange={(e) => setPatientForm(prev => ({ ...prev, lastName: e.target.value }))}
                  placeholder="Ej: Castillo"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Cédula / Documento *
                </label>
                <input
                  type="text"
                  value={patientForm.nationalId}
                  onChange={(e) => setPatientForm(prev => ({ ...prev, nationalId: e.target.value }))}
                  placeholder="Ej: 8-842-1920"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none focus:border-teal-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Sexo
                </label>
                <select
                  value={patientForm.gender}
                  onChange={(e) => setPatientForm(prev => ({ ...prev, gender: e.target.value as 'M' | 'F' }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-teal-500 cursor-pointer"
                >
                  <option value="M">Masculino</option>
                  <option value="F">Femenino</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Edad (Años)
                </label>
                <input
                  type="number"
                  min="0"
                  max="120"
                  value={patientForm.age}
                  onChange={(e) => setPatientForm(prev => ({ ...prev, age: parseInt(e.target.value, 10) || 0 }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Teléfono Móvil
                </label>
                <input
                  type="tel"
                  value={patientForm.phone}
                  onChange={(e) => setPatientForm(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+507 6000-0000"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Prioridad / Ley 42
                </label>
                <select
                  value={patientForm.priority}
                  onChange={(e) => setPatientForm(prev => ({ ...prev, priority: e.target.value as any }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-teal-500 cursor-pointer"
                >
                  <option value="NORMAL">Atención Normal</option>
                  <option value="LEY_42_PREFERENCIAL">Ley 42: Preferencial</option>
                  <option value="STAT_URGENTE">Urgencia STAT</option>
                </select>
              </div>
            </div>
          </div>

          {/* 2. SECCIÓN: SERVICIOS POR DEPARTAMENTO */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center text-xs font-black">2</span>
                <h3 className="font-bold text-sm text-white">Servicios a Admitir en esta Visita</h3>
              </div>
              <span className="text-[11px] text-slate-400">
                {activeServicesCount} {activeServicesCount === 1 ? 'departamento seleccionado' : 'departamentos seleccionados'}
              </span>
            </div>

            {/* 🔬 BLOQUE 1: LABORATORIO CLÍNICO (LIS) */}
            {activeModules.laboratory_lis && (
              <div className={`p-5 rounded-3xl border transition-all ${
                includeLab ? 'bg-slate-900 border-purple-500/40 ring-1 ring-purple-500/20 shadow-xl' : 'bg-slate-900/40 border-slate-800 opacity-60'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="check-lab"
                      checked={includeLab}
                      onChange={(e) => setIncludeLab(e.target.checked)}
                      className="w-4 h-4 rounded accent-purple-500 cursor-pointer"
                    />
                    <label htmlFor="check-lab" className="text-sm font-black text-white flex items-center gap-2 cursor-pointer">
                      <span className="p-1 rounded bg-purple-500/20 text-purple-400">🔬</span>
                      Laboratorio Clínico (LIS)
                    </label>
                  </div>
                  <span className="text-xs font-bold font-mono text-purple-400">
                    Subtotal: ${labTotal.toFixed(2)}
                  </span>
                </div>

                {includeLab && (
                  <div className="space-y-4 pt-2 border-t border-slate-800">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 block mb-1">Médico Remitente:</label>
                        <select
                          value={referringDoctor}
                          onChange={(e) => setReferringDoctor(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-purple-500 cursor-pointer"
                        >
                          {INSTITUTIONAL_HIS_DOCTORS.map(doc => (
                            <option key={doc.id} value={doc.name}>{doc.name} — {doc.specialty}</option>
                          ))}
                          <option value="Particular / Ambulatorio">Particular (Sin orden médica)</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                          <input
                            type="checkbox"
                            checked={patientForm.isFasting}
                            onChange={(e) => setPatientForm(prev => ({ ...prev, isFasting: e.target.checked }))}
                            className="rounded accent-purple-500"
                          />
                          <span>En Ayuno</span>
                        </label>
                        {patientForm.isFasting && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-400 text-[10px]">Horas:</span>
                            <input
                              type="number"
                              min="0"
                              max="24"
                              value={patientForm.fastingHours}
                              onChange={(e) => setPatientForm(prev => ({ ...prev, fastingHours: parseInt(e.target.value, 10) || 0 }))}
                              className="w-14 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-center font-mono text-xs text-white"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                        Pruebas y Perfiles Frecuentes:
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {POPULAR_LAB_PROFILES.map(test => {
                          const isSelected = selectedLabTests.some(t => t.code === test.code);
                          return (
                            <button
                              type="button"
                              key={test.code}
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedLabTests(prev => prev.filter(t => t.code !== test.code));
                                } else {
                                  setSelectedLabTests(prev => [...prev, test]);
                                }
                              }}
                              className={`p-2.5 rounded-xl border text-left flex items-center justify-between text-xs transition cursor-pointer ${
                                isSelected
                                  ? `${test.color} ring-1 ring-purple-500/30`
                                  : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300'
                              }`}
                            >
                              <div>
                                <div className="font-bold">{test.name}</div>
                                <div className="text-[10px] opacity-70 font-mono">{test.tube}</div>
                              </div>
                              <div className="font-mono font-bold">${test.price.toFixed(2)}</div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 🩺 BLOQUE 2: CONSULTA MÉDICA (HIS) */}
            {activeModules.medical_consultation && (
              <div className={`p-5 rounded-3xl border transition-all ${
                includeConsultation ? 'bg-slate-900 border-indigo-500/40 ring-1 ring-indigo-500/20 shadow-xl' : 'bg-slate-900/40 border-slate-800 opacity-60'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="check-consult"
                      checked={includeConsultation}
                      onChange={(e) => setIncludeConsultation(e.target.checked)}
                      className="w-4 h-4 rounded accent-indigo-500 cursor-pointer"
                    />
                    <label htmlFor="check-consult" className="text-sm font-black text-white flex items-center gap-2 cursor-pointer">
                      <span className="p-1 rounded bg-indigo-500/20 text-indigo-400">🩺</span>
                      Consulta Médica (Especialidades HIS)
                    </label>
                  </div>
                  <span className="text-xs font-bold font-mono text-indigo-400">
                    Subtotal: ${consultationTotal.toFixed(2)}
                  </span>
                </div>

                {includeConsultation && (
                  <div className="space-y-4 pt-2 border-t border-slate-800">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                        Seleccione Especialidad Médica:
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {CLINICAL_SPECIALTIES.map(spec => (
                          <button
                            type="button"
                            key={spec.id}
                            onClick={() => setSelectedSpecialtyId(spec.id)}
                            className={`p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                              selectedSpecialtyId === spec.id
                                ? 'bg-indigo-950/40 border-indigo-500/50 ring-1 ring-indigo-500/30 text-white'
                                : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300'
                            }`}
                          >
                            <div>
                              <div className="text-lg mb-1">{spec.icon}</div>
                              <div className="font-bold text-xs">{spec.name}</div>
                              <div className="text-[10px] text-slate-400">{spec.doctor}</div>
                            </div>
                            <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono">
                              <span className="text-indigo-400">{spec.room}</span>
                              <span className="font-bold text-white">${spec.price.toFixed(2)}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-1">Motivo de Consulta / Síntomas:</label>
                      <input
                        type="text"
                        value={consultationReason}
                        onChange={(e) => setConsultationReason(e.target.value)}
                        placeholder="Ej: Dolor de cabeza, control rutinario, fiebre..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 🩻 BLOQUE 3: RADIOLOGÍA E IMAGENOLOGÍA (RIS/PACS) */}
            {activeModules.radiology_ris && (
              <div className={`p-5 rounded-3xl border transition-all ${
                includeRadiology ? 'bg-slate-900 border-cyan-500/40 ring-1 ring-cyan-500/20 shadow-xl' : 'bg-slate-900/40 border-slate-800 opacity-60'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="check-rad"
                      checked={includeRadiology}
                      onChange={(e) => setIncludeRadiology(e.target.checked)}
                      className="w-4 h-4 rounded accent-cyan-500 cursor-pointer"
                    />
                    <label htmlFor="check-rad" className="text-sm font-black text-white flex items-center gap-2 cursor-pointer">
                      <span className="p-1 rounded bg-cyan-500/20 text-cyan-400">🩻</span>
                      Radiología & Imagenología (RIS / PACS)
                    </label>
                  </div>
                  <span className="text-xs font-bold font-mono text-cyan-400">
                    Subtotal: ${radiologyTotal.toFixed(2)}
                  </span>
                </div>

                {includeRadiology && (
                  <div className="space-y-4 pt-2 border-t border-slate-800">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                        Estudio Radiológico Requerido:
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {RADIOLOGY_STUDIES.map(study => (
                          <button
                            type="button"
                            key={study.id}
                            onClick={() => setSelectedRadiologyId(study.id)}
                            className={`p-3 rounded-2xl border text-left transition cursor-pointer flex items-center justify-between ${
                              selectedRadiologyId === study.id
                                ? 'bg-cyan-950/40 border-cyan-500/50 ring-1 ring-cyan-500/30 text-white'
                                : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="text-base">{study.icon}</span>
                              <div>
                                <div className="font-bold text-xs">{study.name}</div>
                                <div className="text-[10px] text-slate-400">{study.room}</div>
                              </div>
                            </div>
                            <span className="font-mono font-bold text-xs">${study.price.toFixed(2)}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 💊 BLOQUE 4: FARMACIA & DISPENSACIÓN */}
            {activeModules.pharmacy_pos && (
              <div className={`p-5 rounded-3xl border transition-all ${
                includePharmacy ? 'bg-slate-900 border-emerald-500/40 ring-1 ring-emerald-500/20 shadow-xl' : 'bg-slate-900/40 border-slate-800 opacity-60'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="check-pharm"
                      checked={includePharmacy}
                      onChange={(e) => setIncludePharmacy(e.target.checked)}
                      className="w-4 h-4 rounded accent-emerald-500 cursor-pointer"
                    />
                    <label htmlFor="check-pharm" className="text-sm font-black text-white flex items-center gap-2 cursor-pointer">
                      <span className="p-1 rounded bg-emerald-500/20 text-emerald-400">💊</span>
                      Farmacia & Dispensación
                    </label>
                  </div>
                  <span className="text-xs font-bold font-mono text-emerald-400">
                    Subtotal: ${pharmacyTotal.toFixed(2)}
                  </span>
                </div>

                {includePharmacy && (
                  <div className="space-y-3 pt-2 border-t border-slate-800 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 block mb-1">Detalle de medicamentos / Receta:</label>
                        <input
                          type="text"
                          value={pharmacyItemsNote}
                          onChange={(e) => setPharmacyItemsNote(e.target.value)}
                          placeholder="Ej: Antibióticos, analgésicos o retiro de receta previa..."
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 block mb-1">Monto Estimado ($ USD):</label>
                        <input
                          type="number"
                          step="0.01"
                          value={pharmacyEstimatedAmount}
                          onChange={(e) => setPharmacyEstimatedAmount(parseFloat(e.target.value) || 0)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

        {/* ── RIGHT COLUMN: SUMMARY, DISPATCH & CONFIRMATION (4 Cols) ───────── */}
        <div className="lg:col-span-4 space-y-6">

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 sticky top-24">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Receipt className="w-4 h-4 text-teal-400" /> Resumen de Admisión
              </h3>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                {branch?.code || 'VE-01'}
              </span>
            </div>

            {/* Patient Header Preview */}
            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
              <div className="text-[10px] text-slate-500 uppercase font-bold">Paciente:</div>
              <div className="font-bold text-xs text-white truncate">
                {patientForm.firstName || patientForm.lastName ? `${patientForm.firstName} ${patientForm.lastName}` : 'Nombre del paciente no ingresado'}
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                {patientForm.nationalId || 'Cédula no ingresada'} • {patientForm.age} años
              </div>
            </div>

            {/* Breakdown by Service */}
            <div className="space-y-2 text-xs">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Desglose por Servicio:</div>

              {includeLab && activeModules.laboratory_lis && (
                <div className="p-2.5 rounded-xl bg-purple-950/20 border border-purple-500/20 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span>🔬</span>
                    <div>
                      <div className="font-bold text-white">Laboratorio Clínico</div>
                      <div className="text-[10px] text-slate-400">{selectedLabTests.length} pruebas</div>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-purple-300">${labTotal.toFixed(2)}</span>
                </div>
              )}

              {includeConsultation && activeModules.medical_consultation && (
                <div className="p-2.5 rounded-xl bg-indigo-950/20 border border-indigo-500/20 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span>🩺</span>
                    <div>
                      <div className="font-bold text-white">Consulta Médica</div>
                      <div className="text-[10px] text-slate-400">{selectedSpecialtyObj.name}</div>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-indigo-300">${consultationTotal.toFixed(2)}</span>
                </div>
              )}

              {includeRadiology && activeModules.radiology_ris && (
                <div className="p-2.5 rounded-xl bg-cyan-950/20 border border-cyan-500/20 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span>🩻</span>
                    <div>
                      <div className="font-bold text-white">Radiología (RIS)</div>
                      <div className="text-[10px] text-slate-400">{selectedRadiologyObj.name}</div>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-cyan-300">${radiologyTotal.toFixed(2)}</span>
                </div>
              )}

              {includePharmacy && activeModules.pharmacy_pos && (
                <div className="p-2.5 rounded-xl bg-emerald-950/20 border border-emerald-500/20 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span>💊</span>
                    <div>
                      <div className="font-bold text-white">Farmacia</div>
                      <div className="text-[10px] text-slate-400">Dispensación</div>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-emerald-300">${pharmacyTotal.toFixed(2)}</span>
                </div>
              )}

              {activeServicesCount === 0 && (
                <div className="p-4 rounded-xl border border-dashed border-slate-800 text-center text-slate-500 text-xs">
                  Ningún servicio seleccionado
                </div>
              )}
            </div>

            {/* Total Balance */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <span className="text-sm font-black text-white">TOTAL A FACTURAR:</span>
              <span className="text-xl font-black font-mono text-teal-400">
                ${totalBillAmount.toFixed(2)}
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="button"
              onClick={handleConfirmAdmission}
              className="w-full py-3.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black rounded-2xl text-xs uppercase shadow-xl shadow-teal-500/20 transition cursor-pointer flex items-center justify-center gap-2 active:scale-98"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Confirmar Admisión & Emitir Órdenes</span>
            </button>

            <div className="text-[10px] text-slate-500 text-center">
              Enruta automáticamente las muestras al LIS y los turnos a las salas de espera.
            </div>
          </div>

        </div>

      </div>

      {/* ── CONFIRMATION / PRINT TICKET MODAL ──────────────────────────────── */}
      {isConfirmationModalOpen && lastGeneratedAdmission && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/20 border border-teal-500/30 text-teal-400 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-white uppercase italic tracking-tight">
                ¡Admisión Generada con Éxito!
              </h3>
              <p className="text-xs text-slate-400">
                El paciente ha sido admitido y los departamentos recibieron la notificación en tiempo real.
              </p>
            </div>

            {/* Ticket Card Style */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-500">TICKET DE TURNO:</span>
                <span className="text-lg font-black text-teal-400">{lastGeneratedAdmission.ticketTurn}</span>
              </div>

              <div>
                <span className="text-slate-500 text-[10px] block">PACIENTE:</span>
                <span className="font-bold text-white text-sm">{lastGeneratedAdmission.patientName}</span>
                <span className="text-slate-400 text-[10px] block">Cédula: {lastGeneratedAdmission.nationalId}</span>
              </div>

              {lastGeneratedAdmission.labOrderNumber && (
                <div className="p-2.5 rounded-xl bg-purple-950/30 border border-purple-500/30 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-purple-300 font-bold">ORDEN DE LABORATORIO:</div>
                    <div className="font-bold text-white">{lastGeneratedAdmission.labOrderNumber}</div>
                  </div>
                  <Barcode className="w-8 h-8 text-purple-400" />
                </div>
              )}

              <div>
                <span className="text-slate-500 text-[10px] block mb-1">SERVICIOS ADMITIDOS:</span>
                <ul className="space-y-1">
                  {lastGeneratedAdmission.services.map((svc, idx) => (
                    <li key={idx} className="flex items-center gap-1.5 text-slate-300 text-[11px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span>
                      <span>{svc}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between font-bold">
                <span className="text-slate-400">TOTAL:</span>
                <span className="text-emerald-400 text-sm">${lastGeneratedAdmission.totalAmount.toFixed(2)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer transition"
              >
                <Printer className="w-4 h-4 text-slate-300" />
                <span>Imprimir Ticket</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsConfirmationModalOpen(false);
                  handleResetForm();
                }}
                className="py-2.5 px-3 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer transition shadow-md shadow-teal-500/20"
              >
                <span>Nueva Admisión ↵</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
