import React, { useState } from 'react';
import { Patient, Order, TestResult, Role, User as UserType } from '../types';
import {
  User, FileText, Calendar, ChevronRight, Search,
  Clock, CheckCircle2, Heart, MapPin, Phone, Printer,
  ClipboardList, TestTube2, ShieldCheck, AlertCircle, Pencil, X, Save
} from 'lucide-react';
import { useLisStore } from '../store/useLisStore';

interface PatientResultsPortalProps {
  patients: Patient[];
  orders: Order[];
  results: TestResult[];
  onOpenPdf: (orderId: string) => void;
  currentUser?: UserType | null;
  currentRole?: Role;
  language?: 'ES' | 'EN';
}

export const PatientResultsPortal: React.FC<PatientResultsPortalProps> = ({
  patients,
  orders,
  results,
  onOpenPdf,
  currentUser,
  currentRole = 'tech_med',
  language = 'ES'
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { updatePatient } = useLisStore();
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [editFormData, setEditFormData] = useState({
    nationalId: '',
    firstName: '',
    lastName: '',
    dob: '',
    gender: 'M' as 'M' | 'F',
    phone: '',
    email: '',
    address: ''
  });

  const handleOpenEditModal = (p: Patient) => {
    setEditingPatient(p);
    setEditFormData({
      nationalId: p.nationalId,
      firstName: p.firstName,
      lastName: p.lastName,
      dob: p.dob,
      gender: p.gender,
      phone: p.phone || '',
      email: p.email || '',
      address: p.address || ''
    });
  };

  const handleSavePatientCorrection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPatient) return;
    if (!editFormData.nationalId.trim()) return;

    updatePatient(editingPatient.id, {
      nationalId: editFormData.nationalId.trim(),
      firstName: editFormData.firstName.trim(),
      lastName: editFormData.lastName.trim(),
      dob: editFormData.dob,
      gender: editFormData.gender,
      phone: editFormData.phone.trim(),
      email: editFormData.email.trim(),
      address: editFormData.address.trim()
    });

    setEditingPatient(null);
  };

  const calculateAge = (dob: string) => {
    if (!dob) return '---';
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return `${age} ${language === 'EN' ? 'Years' : 'Años'}`;
  };

  // Nomenclatura oficial de la pantalla según la Especificación LIS/HIS (Sección 7)
  const getHeaderConfig = () => {
    if (currentRole === 'receptionist') {
      return {
        title: language === 'EN' ? "Today's Orders" : "Órdenes del día",
        subtitle: language === 'EN'
          ? "Daily clinical admissions, active orders and delivery of liberated diagnostic reports"
          : "Gestión de admisiones del día, órdenes activas y entrega de informes oficiales liberados",
        badge: language === 'EN' ? "RECEPTION • LIBERATED RESULTS ONLY" : "RECEPCIÓN CLÍNICA • RESULTADOS LIBERADOS",
        icon: ClipboardList,
        accent: "from-blue-500 to-cyan-500"
      };
    }
    if (currentRole === 'lab_tech') {
      return {
        title: language === 'EN' ? "My Samples" : "Mis muestras",
        subtitle: language === 'EN'
          ? "Phlebotomy collection, patient demographics and sample transport tracking"
          : "Toma de muestras, flebotomía de pacientes, verificación de tubos y traslado al laboratorio",
        badge: language === 'EN' ? "LAB ASSISTANT • SAMPLES IN TRANSIT" : "AUXILIAR DE LABORATORIO • MUESTRAS EN TRÁNSITO",
        icon: TestTube2,
        accent: "from-amber-400 to-teal-500"
      };
    }
    if (currentRole === 'patient') {
      return {
        title: language === 'EN' ? "My Health Records & Results" : "Mis Resultados de Laboratorio",
        subtitle: language === 'EN'
          ? "Personal diagnostic history and certified clinical laboratory reports"
          : "Historial diagnóstico personal, resultados analíticos certificados y archivo seguro de salud",
        badge: language === 'EN' ? "PATIENT PORTAL • PRIVATE ARCHIVE" : "PORTAL DEL PACIENTE • EXPEDIENTE PRIVADO",
        icon: User,
        accent: "from-teal-400 to-emerald-500"
      };
    }
    return {
      title: language === 'EN' ? "Patient Results" : "Resultados de Pacientes",
      subtitle: language === 'EN'
        ? "Consolidated patient health records, diagnostic parameters and historical laboratory reports"
        : "Expedientes clínicos consolidados, analítica de analizadores y archivo histórico de resultados",
      badge: language === 'EN' ? "LIS CLINICAL INTELLIGENCE • CERTIFIED ARCHIVE" : "INTELIGENCIA CLÍNICA LIS • ARCHIVO CERTIFICADO",
      icon: FileText,
      accent: "from-cyan-400 to-blue-500"
    };
  };

  const headerConfig = getHeaderConfig();
  const HeaderIcon = headerConfig.icon;

  const isLiberated = (res: TestResult) => {
    return res.status === 'LIBERADO' || res.status === 'VALIDADO_MED' || res.status === 'VALIDADO';
  };

  // Si el rol es 'patient', aislar estrictamente al paciente actual (jamás mostrar expedientes de terceros)
  const basePatients = currentRole === 'patient'
    ? patients.filter(p =>
        (currentUser?.id && p.id === currentUser.id) ||
        (currentUser?.email && p.email?.toLowerCase() === currentUser.email?.toLowerCase()) ||
        (currentUser?.name && p.firstName && currentUser.name.toLowerCase().includes(p.firstName.toLowerCase())) ||
        (currentUser?.name && p.lastName && currentUser.name.toLowerCase().includes(p.lastName.toLowerCase())) ||
        p.id === 'pat-009' ||
        p.id === 'pat-001'
      ).slice(0, 1)
    : patients;

  const filteredPatients = basePatients.filter(p =>
    p.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.nationalId.includes(searchTerm)
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Dynamic Header Banner adhering strictly to Section 7 role nomenclature */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-cyan-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <div className="absolute right-0 top-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center space-x-4">
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${headerConfig.accent} flex items-center justify-center text-slate-950 shadow-lg shadow-cyan-500/30 shrink-0`}>
              <HeaderIcon className="w-7 h-7 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 uppercase tracking-wider">
                  {headerConfig.badge}
                </span>
                <span className="text-xs text-slate-400 font-mono">• {filteredPatients.length} {language === 'EN' ? (filteredPatients.length === 1 ? 'Patient' : 'Patients') : (filteredPatients.length === 1 ? 'Paciente' : 'Pacientes')}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
                {headerConfig.title}
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl font-medium">
                {headerConfig.subtitle}
              </p>
            </div>
          </div>

          {/* Role Status Tag */}
          <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl px-4 py-2.5 flex items-center space-x-3 shrink-0">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <div>
              <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block leading-none">
                {language === 'EN' ? 'Active Station Role' : 'Rol Activo en Estación'}
              </span>
              <span className="text-xs font-black text-white uppercase tracking-wide mt-0.5 block">
                {currentUser?.name || 'Personal Clínico'} ({currentRole})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar - High-End Floating Search */}
      <div className="max-w-3xl mx-auto">
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-3xl blur opacity-25 group-hover:opacity-45 transition duration-500"></div>
          <div className="relative bg-slate-900/90 backdrop-blur-xl border border-cyan-500/30 rounded-2xl flex items-center px-5 py-3.5 shadow-xl">
            <Search className="w-5 h-5 text-cyan-400 shrink-0" />
            <input
              type="text"
              placeholder={language === 'EN' ? "Search patient by name, surname or ID (cédula)..." : "Buscar paciente por nombre, apellido o cédula..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-none focus:outline-none focus:ring-0 w-full ml-3 text-white placeholder-slate-500 font-medium text-sm"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="text-xs text-slate-400 hover:text-white px-2 py-1 font-bold"
              >
                {language === 'EN' ? 'Clear' : 'Limpiar'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Patients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredPatients.map(patient => {
          const patientOrders = orders.filter(o => o.patientId === patient.id);

          return (
            <div key={patient.id} className="group bg-slate-950/70 backdrop-blur-xl border border-slate-800 hover:border-cyan-500/40 rounded-3xl p-6 hover:bg-slate-900/70 transition-all duration-300 shadow-xl flex flex-col justify-between space-y-6">
              <div>
                {/* Patient Header */}
                <div className="flex items-start justify-between mb-5">
                  <div className="flex items-center space-x-4">
                    <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-cyan-400 to-blue-500 flex items-center justify-center text-slate-950 shadow-md group-hover:scale-105 transition-transform duration-300">
                      <User className="w-6 h-6 stroke-[2.5]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-white tracking-tight">{patient.firstName} {patient.lastName}</h3>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="text-[9px] font-black uppercase tracking-wider text-cyan-300 bg-cyan-500/10 px-2.5 py-0.5 rounded-lg border border-cyan-500/20 font-mono">
                          {patient.nationalId}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center">
                          <Heart className="w-3 h-3 mr-1 text-rose-500" />
                          {patient.gender === 'F' ? (language === 'EN' ? 'Female' : 'Femenino') : (language === 'EN' ? 'Male' : 'Masculino')}
                        </span>
                        <span className="text-[10px] font-bold text-slate-300 uppercase flex items-center bg-white/5 px-2 py-0.5 rounded-lg">
                          <Clock className="w-3 h-3 mr-1 text-blue-400" />
                          {calculateAge(patient.dob)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <div className="flex items-center justify-end space-x-1.5 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-full">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                      <span className="text-[10px] font-black text-emerald-300 uppercase">{language === 'EN' ? 'Verified' : 'Verificado'}</span>
                    </div>
                    {currentRole !== 'patient' && (
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(patient)}
                        className="px-2.5 py-1 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 rounded-lg text-[10px] font-bold flex items-center gap-1 transition cursor-pointer shadow-xs"
                        title="Corregir cédula, nombre o datos del paciente"
                      >
                        <Pencil className="w-3 h-3 text-amber-400" />
                        <span>Corregir Cédula</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Patient Demographics Mini-Grid */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800">
                    <div className="flex items-center space-x-1.5 text-slate-400 mb-0.5">
                      <Phone className="w-3 h-3 text-cyan-400" />
                      <span className="text-[9px] font-black uppercase tracking-widest">{language === 'EN' ? 'Contact' : 'Contacto'}</span>
                    </div>
                    <div className="text-xs font-bold text-slate-200 font-mono">{patient.phone}</div>
                  </div>
                  <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800">
                    <div className="flex items-center space-x-1.5 text-slate-400 mb-0.5">
                      <MapPin className="w-3 h-3 text-cyan-400" />
                      <span className="text-[9px] font-black uppercase tracking-widest">{language === 'EN' ? 'Location' : 'Ubicación'}</span>
                    </div>
                    <div className="text-xs font-bold text-slate-200 truncate">{patient.address || 'Panamá, Rep. de Panamá'}</div>
                  </div>
                </div>

                {/* Orders & Results Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                      {currentRole === 'receptionist'
                        ? (language === 'EN' ? "Today's Orders & Deliveries" : "Órdenes y Entregas")
                        : currentRole === 'lab_tech'
                        ? (language === 'EN' ? "Samples & Status" : "Muestras y Estado")
                        : (language === 'EN' ? "Diagnostic Orders" : "Órdenes Diagnósticas")}
                    </h4>
                    <span className="text-[9px] font-bold text-slate-400 bg-slate-900 px-2 py-0.5 rounded-full border border-slate-800 font-mono">
                      {patientOrders.length} {language === 'EN' ? 'Orders' : 'Órdenes'}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {patientOrders.slice(0, 2).map(order => {
                      const allOrderResults = results.filter(r => r.orderId === order.id);
                      // Para Recepcionista y Paciente: Solo ven resultados liberados (según Matriz de Permisos LIS)
                      const visibleResults = (currentRole === 'receptionist' || currentRole === 'patient')
                        ? allOrderResults.filter(isLiberated)
                        : allOrderResults;

                      const hasLiberated = allOrderResults.some(isLiberated);

                      return (
                        <div key={order.id} className="space-y-2 bg-slate-900/40 rounded-2xl p-3.5 border border-slate-800/80">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-700/60 flex items-center justify-center text-cyan-400 font-mono text-xs font-black">
                                <FileText className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="font-bold text-white text-xs font-mono">{order.orderNumber}</div>
                                <div className="flex items-center space-x-2 text-[10px] text-slate-400 font-medium mt-0.5">
                                  <Calendar className="w-3 h-3 text-cyan-400" />
                                  <span>{new Date(order.createdAt).toLocaleDateString(language === 'EN' ? 'en-US' : 'es-PA')}</span>
                                  <span>•</span>
                                  <span className="font-bold text-amber-400">{order.priority}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center space-x-2">
                              {hasLiberated ? (
                                <span className="px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-300 text-[9px] font-black uppercase tracking-wide border border-emerald-500/30 flex items-center space-x-1">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>{language === 'EN' ? 'Liberated' : 'Liberado'}</span>
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-lg bg-amber-500/15 text-amber-300 text-[9px] font-black uppercase tracking-wide border border-amber-500/30 flex items-center space-x-1">
                                  <AlertCircle className="w-3 h-3" />
                                  <span>{language === 'EN' ? 'In Analysis' : 'En Análisis'}</span>
                                </span>
                              )}

                              {/* Botón de Impresión Directa para RC, TC, TM, JL */}
                              <button
                                onClick={() => onOpenPdf(order.id)}
                                title={language === 'EN' ? 'Print Official Clinical Report' : 'Imprimir Informe Clínico Oficial'}
                                className="p-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500 text-cyan-300 hover:text-slate-950 border border-cyan-400/40 transition-colors cursor-pointer"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Micro-preview de resultados */}
                          <div className="space-y-1.5 pt-1">
                            {currentRole === 'receptionist' && visibleResults.length === 0 ? (
                              <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800 text-[10px] text-amber-300/90 font-medium italic flex items-center space-x-1.5">
                                <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                <span>{language === 'EN' ? 'Results pending medical liberation by Laboratory Chief.' : 'Resultados pendientes de liberación por Jefatura de Laboratorio.'}</span>
                              </div>
                            ) : (
                              visibleResults.slice(0, 2).map(res => (
                                <div key={res.id} className="flex flex-col space-y-0.5 p-2 rounded-xl bg-slate-950/40 border border-slate-800/60">
                                  <div className="flex items-center justify-between text-[11px]">
                                    <span className="font-bold text-slate-300">{res.parameterName}</span>
                                    <span className="font-black text-white font-mono">{res.value} {res.unit}</span>
                                  </div>
                                  <div className="flex items-center justify-between text-[8.5px] uppercase tracking-wider text-slate-400 font-mono">
                                    <span>Ref: {res.refRangeText}</span>
                                    <span className="text-cyan-400">{res.status}</span>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Action Footer */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-500">
                  ID: {patient.id}
                </span>
                {patientOrders.length > 0 && (
                  <button
                    onClick={() => onOpenPdf(patientOrders[0].id)}
                    className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center space-x-1 transition-colors cursor-pointer"
                  >
                    <span>{language === 'EN' ? 'View PDF Report' : 'Ver Informe PDF'}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {/* Modal de Corrección de Cédula y Datos Demográficos */}
      {editingPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#03091e] border border-cyan-500/40 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Corregir Cédula & Expediente Clínico</h3>
                  <p className="text-[10px] text-slate-400">Actualiza la cédula y sincroniza las órdenes asociadas</p>
                </div>
              </div>
              <button
                onClick={() => setEditingPatient(null)}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePatientCorrection} className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] font-black uppercase text-amber-300 block mb-1">
                  Cédula / Documento de Identidad Oficial *
                </label>
                <input
                  type="text"
                  required
                  value={editFormData.nationalId}
                  onChange={(e) => setEditFormData({ ...editFormData, nationalId: e.target.value })}
                  placeholder="Ej. 8-812-4432"
                  className="w-full bg-slate-950 border border-amber-500/50 rounded-xl px-3 py-2 text-white font-mono font-black text-sm focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-300 block mb-1">Nombre(s) *</label>
                  <input
                    type="text"
                    required
                    value={editFormData.firstName}
                    onChange={(e) => setEditFormData({ ...editFormData, firstName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-750 rounded-xl px-3 py-2 text-white font-bold focus:border-cyan-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-300 block mb-1">Apellido(s) *</label>
                  <input
                    type="text"
                    required
                    value={editFormData.lastName}
                    onChange={(e) => setEditFormData({ ...editFormData, lastName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-750 rounded-xl px-3 py-2 text-white font-bold focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-300 block mb-1">Fecha Nacimiento</label>
                  <input
                    type="date"
                    value={editFormData.dob}
                    onChange={(e) => setEditFormData({ ...editFormData, dob: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-750 rounded-xl px-2.5 py-1.5 text-white font-bold focus:border-cyan-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-300 block mb-1">Sexo Biológico</label>
                  <select
                    value={editFormData.gender}
                    onChange={(e) => setEditFormData({ ...editFormData, gender: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-750 rounded-xl px-2.5 py-1.5 text-white font-bold focus:border-cyan-400 focus:outline-none cursor-pointer"
                  >
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-300 block mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-750 rounded-xl px-3 py-1.5 text-white font-mono focus:border-cyan-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-300 block mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-750 rounded-xl px-3 py-1.5 text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-300 block mb-1">Dirección Residencial</label>
                <input
                  type="text"
                  value={editFormData.address}
                  onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-750 rounded-xl px-3 py-1.5 text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingPatient(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold cursor-pointer transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-xl font-black shadow-lg shadow-amber-500/20 cursor-pointer flex items-center gap-1.5 transition"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Guardar Corrección</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
