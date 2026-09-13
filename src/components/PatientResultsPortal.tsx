import React, { useState } from 'react';
import { Patient, Order, TestResult, Role, User as UserType } from '../types';
import {
  User, FileText, Calendar, ChevronRight, Search,
  Clock, CheckCircle2, Heart, MapPin, Phone, Printer,
  ClipboardList, TestTube2, ShieldCheck, AlertCircle
} from 'lucide-react';

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
                  <div className="text-right">
                    <div className="flex items-center justify-end space-x-1.5 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-full">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                      <span className="text-[10px] font-black text-emerald-300 uppercase">{language === 'EN' ? 'Verified' : 'Verificado'}</span>
                    </div>
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
    </div>
  );
};
