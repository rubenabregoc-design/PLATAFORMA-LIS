import React, { useState } from 'react';
import { Role, Tenant, Branch, User } from '../types';
import { useLisStore } from '../store/useLisStore';
import {
  Activity, Building2, SlidersHorizontal, LogOut, MapPin, Filter, LayoutDashboard, Receipt, Package, Sparkles, Cpu, AlertTriangle, FileCheck2, BrainCircuit, ShieldCheck, Truck, Globe, Server, Award, Database, Microscope, FileText, ChevronDown, MoreHorizontal, Lock, Calendar, Target, Wrench, MessageSquare, Droplets, Printer, BarChart3, BookOpen, Files, Archive, Mail, RefreshCw, Calculator, Search, X, Grid, QrCode, HeartPulse, Clock
} from 'lucide-react';
import { OfflineSyncIndicator } from './OfflineSyncIndicator';
import { SessionInactivityTracker } from './SessionInactivityTracker';

interface HeaderProps {
  onRoleChange: (role: Role) => void;
  onTenantChange: (tenantId: string) => void;
  onBranchChange: (branchId: string) => void;
  onOpenBranchModal?: () => void;
  onLockSession?: () => void;
  showAllModules: boolean;
  setShowAllModules: (show: boolean) => void;
}

export const ROLE_LABELS: Record<Role, { title: string; color: string; desc: string }> = {
  owner: { title: 'Dueño / Gerente', color: 'bg-amber-500/15 text-amber-300 border-amber-500/30', desc: 'Finanzas, métricas, gerencia' },
  lab_chief: { title: 'Jefe de Laboratorio', color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30', desc: 'Validación médica final, QC' },
  tech_med: { title: 'Tecnólogo Médico', color: 'bg-blue-500/15 text-blue-300 border-blue-500/30', desc: 'Validación técnica, analizadores' },
  lab_tech: { title: 'Técnico de Lab', color: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30', desc: 'Recepción, código de barras' },
  receptionist: { title: 'Recepcionista', color: 'bg-purple-500/15 text-purple-300 border-purple-500/30', desc: 'Registro, órdenes, cobros' },
  ext_doctor: { title: 'Médico Referente', color: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30', desc: 'Portal médico externo' },
  patient: { title: 'Paciente / Cliente', color: 'bg-rose-500/15 text-rose-300 border-rose-500/30', desc: 'Portal personal' },
  abregotech_admin: { title: 'Admin AbregoTech', color: 'bg-slate-700/60 text-slate-200 border-slate-600', desc: 'Súper-admin SaaS' }
};

export const NAVIGATION_TABS = [
  // 🔬 LIS (Laboratorio Clínico - 18 Módulos)
  { id: 'dashboard', label: 'Dashboard Principal', icon: LayoutDashboard, category: 'lis', desc: 'Vista ejecutiva y métricas en tiempo real.' },
  { id: 'validation', label: 'Resultados & Validación', icon: Microscope, category: 'lis', desc: 'Consola de ingreso y firma técnica/médica de analitos.', example: 'Firma electrónica Ley 81' },
  { id: 'tm_workbench', label: 'Estación TM (Bancada)', icon: Activity, category: 'lis', desc: 'Bancada técnica de trabajo para tecnólogos.' },
  { id: 'lis_workstation', label: 'Workstation 3D Validación', icon: Sparkles, category: 'lis', desc: 'Validación tridimensional clínica de muestras.' },
  { id: 'patient_results', label: 'Expedientes & Muestras', icon: FileText, category: 'lis', desc: 'Historial completo de muestras y órdenes del paciente.' },
  { id: 'test_catalog', label: 'Catálogo LIS & Pruebas', icon: BookOpen, category: 'lis', desc: 'Definición de pruebas, perfiles, valores de referencia y tubos.' },
  { id: 'qc', label: 'Control Calidad QC', icon: SlidersHorizontal, category: 'lis', desc: 'Gráficas Levey-Jennings y reglas de Westgard.' },
  { id: 'middleware', label: 'Middleware ASTM', icon: Sparkles, category: 'lis', desc: 'Consola de comunicación bidireccional ASTM E1381/E1394.' },
  { id: 'homologation', label: 'Analizadores Clínicos', icon: SlidersHorizontal, category: 'lis', desc: 'Mapeo de códigos de analitos de equipos al catálogo.' },
  { id: 'drivers', label: 'Drivers ASTM / HL7', icon: Cpu, category: 'lis', desc: 'Controladores de red TCP/IP y RS232 para equipos de lab.' },
  { id: 'phlebotomy', label: 'Flebotomía GPS', icon: Truck, category: 'lis', desc: 'Ruteo y toma de muestras a domicilio en tiempo real.' },
  { id: 'pathology', label: 'Patología Anatómica', icon: Microscope, category: 'lis', desc: 'Gestión de biopsias, citología e histopatología.' },
  { id: 'batch_reporting', label: 'Batch Reporting PDF', icon: Files, category: 'lis', desc: 'Generación e impresión masiva de reportes de laboratorio.' },
  { id: 'lis_hil', label: 'Preanalítica HIL', icon: Droplets, category: 'lis', desc: 'Evaluación de índices de Hemólisis, Ictericia y Lipemia.', example: 'Ej: Muestra Lipémica 2+' },
  { id: 'lis_panic', label: 'Registro de Pánicos', icon: AlertTriangle, category: 'lis', desc: 'Bitácora obligatoria de notificación de valores críticos.', example: 'Ej: Notificado a Médico' },
  { id: 'lis_alerts_center', label: 'Centro de Alertas & Pánicos', icon: ShieldCheck, category: 'lis', desc: 'Consola unificada de gestión de pánicos ISO 15189.' },
  { id: 'lis_calculators', label: 'Calculadoras Clínicas', icon: Calculator, category: 'lis', desc: 'Calculadoras para eGFR, LDL Martin-Hopkins, HOMA-IR y De Ritis.' },
  { id: 'lis_telemetry', label: 'Telemetría de Analizadores', icon: BrainCircuit, category: 'lis', desc: 'Monitoreo de telemetría de equipos y gráficas de evolución.' },
  { id: 'delta', label: 'Delta Check & Pánicos', icon: AlertTriangle, category: 'lis', desc: 'Monitoreo de variaciones de pánico y significancia clínica Delta Check.', example: 'Ej: Variación Delta > 20%' },
  { id: 'lis_referrals', label: 'Remisión & Derivación de Muestras', icon: Truck, category: 'lis', desc: 'Remisión, valijas térmicas y derivación a Laboratorios de Referencia Externa y Ruteo.', example: 'Ej: Remisiones / Gorgas' },

  // 🏥 HIS (Suite Hospitalaria)
  { id: 'his_command', label: 'Command Center Hospitalario', icon: Building2, category: 'his', desc: 'Centro de mando operativo, ocupación y alertas.' },
  { id: 'his_triage', label: 'Urgencias & Triage', icon: Activity, category: 'his', desc: 'Clasificación Triage Manchester / ESI en urgencias.' },
  { id: 'his_beds', label: 'Censo & Mapa de Camas (ADT)', icon: Building2, category: 'his', desc: 'Gestión visual de camas hospitalarias, traslados e ingresos.' },
  { id: 'his_ehr', label: 'Historia Clínica EHR', icon: FileText, category: 'his', desc: 'Expediente clínico electrónico unificado.' },
  { id: 'his_cpoe', label: 'Órdenes Médicas CPOE & CDS', icon: HeartPulse, category: 'his', desc: 'Prescripción electrónica unificada con soporte a decisiones clínicas (CDS).' },
  { id: 'his_kardex', label: 'Kardex Enfermería eMAR', icon: ShieldCheck, category: 'his', desc: 'Administración electrónica de medicamentos eMAR y signos vitales.' },
  { id: 'his_icu', label: 'UCI / Cuidados Críticos', icon: Activity, category: 'his', desc: 'Monitoreo hemodinámico, ventilación mecánica y escalas RASS/Glasgow.' },
  { id: 'his_operating', label: 'Quirófanos & Anestesia AIMS', icon: Wrench, category: 'his', desc: 'Programación de cirugías, riesgo ASA y recuperación PACU.' },
  { id: 'his_maternity', label: 'Maternidad & Neonatos', icon: Award, category: 'his', desc: 'Control obstétrico, partos y tamizaje neonatal.' },
  { id: 'his_ris_pacs', label: 'Radiología RIS / PACS', icon: Globe, category: 'his', desc: 'Visor DICOM e integración con equipos de imagenología.' },
  { id: 'his_pharmacy', label: 'Farmacia Hospitalaria', icon: Package, category: 'his', desc: 'Dispensación dosis unitaria e inventario de farmacia.' },
  { id: 'his_discharge', label: 'Gestión de Altas & Egresos', icon: FileCheck2, category: 'his', desc: 'Plan de alta, resumen clínico de egreso e incapacidades.' },
  { id: 'his_console', label: 'Consola Integración HL7', icon: Server, category: 'his', desc: 'Motor de mensajería HL7 v2.x / v3 / FHIR R4.' },
  { id: 'shifts', label: 'Turnos & Citas', icon: Calendar, category: 'his', desc: 'Agenda médica y gestión de turnos de atención.' },

  // 🩸 BANCO DE SANGRE (Medicina Transfusional - 17 Módulos)
  { id: 'bloodbank', label: 'Centro Banco de Sangre', icon: Droplets, category: 'bloodbank', desc: 'Panel central de medicina transfusional y serología.' },
  { id: 'blood_donors', label: 'Cuestionario Donantes', icon: FileText, category: 'bloodbank', desc: 'Entrevista, signos vitales y elegibilidad de donantes.' },
  { id: 'blood_deferral', label: 'Diferimiento e Inaptitud', icon: AlertTriangle, category: 'bloodbank', desc: 'Registro de diferimientos temporales y permanentes.' },
  { id: 'blood_apheresis', label: 'Aféresis & Extracción', icon: Activity, category: 'bloodbank', desc: 'Procedimientos de plaquetoféresis y sangría total.' },
  { id: 'blood_drives', label: 'Colectas Extramuros', icon: Truck, category: 'bloodbank', desc: 'Organización de jornadas extramuros de donación.' },
  { id: 'blood_fractionation', label: 'Fraccionamiento Componentes', icon: Package, category: 'bloodbank', desc: 'Separación en Glóbulos Rojos, Plasma y Plaquetas.' },
  { id: 'blood_serology', label: 'Tamizaje Serológico & NAT', icon: ShieldCheck, category: 'bloodbank', desc: 'Pruebas infecciosas (VIH, VHB, VHC, NAT) con bloqueo en 0ms.' },
  { id: 'blood_cold_chain', label: 'Cadena de Frío IoT', icon: Server, category: 'bloodbank', desc: 'Monitoreo de temperatura en tiempo real en congeladores.' },
  { id: 'blood_logistics', label: 'Logística Hemocomponentes', icon: Truck, category: 'bloodbank', desc: 'Despacho, transporte y recepción de unidades.' },
  { id: 'blood_crossmatch', label: 'Inmuno & Crossmatch', icon: Microscope, category: 'bloodbank', desc: 'Pruebas cruzadas, Coombs directo/indirecto y rastreo.' },
  { id: 'blood_bedside', label: 'Transfusión Smart Bedside', icon: QrCode, category: 'bloodbank', desc: 'Verificación a pie de cama por escaneo triple de código QR.' },
  { id: 'blood_hemovigilance', label: 'Hemovigilancia Eventos', icon: ShieldCheck, category: 'bloodbank', desc: 'Notificación de reacciones adversas transfusionales.' },
  { id: 'blood_waste', label: 'Desechos Biológicos', icon: Wrench, category: 'bloodbank', desc: 'Descarte seguro de unidades reactivas o vencidas.' },
  { id: 'blood_chemical_waste', label: 'Desechos Químicos', icon: Wrench, category: 'bloodbank', desc: 'Tratamiento de efluentes y reactivos agotados.' },
  { id: 'blood_manifest', label: 'Manifiesto Descarte PDF', icon: Printer, category: 'bloodbank', desc: 'Generación de manifiestos reglamentarios MINSA.' },
  { id: 'label_studio', label: 'Etiquetas ISBT 128', icon: Printer, category: 'bloodbank', desc: 'Impresión de códigos de barras ISBT 128 homologados.' },
  { id: 'routing', label: 'Remisión & Ruteo Inter-Sedes', icon: Truck, category: 'bloodbank', desc: 'Remisión de muestras, valijas térmicas y logística inter-sucursales.', example: 'Ej: Remisiones / Traslados' },

  // 💼 GESTIÓN & BI (Administración - 13 Módulos)
  { id: 'billing', label: 'Facturación POS & DGI', icon: Receipt, category: 'bi', desc: 'Caja POS, facturación electrónica e integración DGI Panamá.' },
  { id: 'inventory', label: 'Inventario Reactivos FEFO', icon: Package, category: 'bi', desc: 'Kardex de insumos con semaforización FEFO y lotes.' },
  { id: 'executive', label: 'Analítica BI & Ejecutivo', icon: BrainCircuit, category: 'bi', desc: 'Tableros ejecutivos, costos por prueba e ingresos.' },
  { id: 'productivity', label: 'Productividad & Métricas', icon: BarChart3, category: 'bi', desc: 'Tiempos de respuesta (TAT) y carga por sección.' },
  { id: 'minsa', label: 'Reportes MINSA', icon: FileCheck2, category: 'bi', desc: 'Exportación de boletines epidemiológicos obligatorios.' },
  { id: 'audit', label: 'Auditoría Ley 81', icon: ShieldCheck, category: 'bi', desc: 'Bitácora inalterable de accesos y protección de PII.' },
  { id: 'cmms', label: 'Mantenimiento CMMS', icon: Wrench, category: 'bi', desc: 'Mantenimiento preventivo y correctivo de equipos.' },
  { id: 'eqa', label: 'PEEC / Control Calidad EQA', icon: Target, category: 'bi', desc: 'Evaluación externa de calidad y comparaciones interlaboratorios.' },
  { id: 'whatsapp', label: 'WhatsApp LIS Engine', icon: MessageSquare, category: 'bi', desc: 'Envío automático de resultados en PDF por WhatsApp.' },
  { id: 'fhir', label: 'FHIR Interoperabilidad', icon: Globe, category: 'bi', desc: 'Servidor FHIR REST API para integración de datos.' },
  { id: 'ha_dr', label: 'Alta Disponibilidad HA/DR', icon: Server, category: 'bi', desc: 'Clúster activo-pasivo y réplica de contingencia.' },
  { id: 'accreditation', label: 'Acreditación ISO 15189', icon: Award, category: 'bi', desc: 'Gestión documental y evidencias de auditoría ISO.' },
  { id: 'schema', label: 'Base de Datos & Esquemas', icon: Database, category: 'bi', desc: 'Visor de modelos E-R y diccionario de datos PostgreSQL.' },
];

const ALL_MODULE_TABS = NAVIGATION_TABS.map(t => t.id);

export const ALLOWED_TABS_PER_ROLE: Record<Role, string[]> = {
  owner: ALL_MODULE_TABS,
  lab_chief: ALL_MODULE_TABS,
  abregotech_admin: ALL_MODULE_TABS,

  // 🔬 Tecnólogo Médico (TM): Acceso total a analítica LIS, Banco de Sangre, Validación y Calidad QC
  tech_med: [
    'dashboard', 'validation', 'tm_workbench', 'lis_workstation', 'patient_results',
    'test_catalog', 'qc', 'middleware', 'homologation', 'drivers', 'phlebotomy',
    'pathology', 'batch_reporting', 'lis_hil', 'lis_panic', 'lis_alerts_center',
    'lis_calculators', 'lis_telemetry', 'delta', 'lis_referrals',
    'bloodbank', 'blood_donors', 'blood_deferral', 'blood_apheresis', 'blood_drives',
    'blood_fractionation', 'blood_cold_chain', 'blood_logistics', 'blood_crossmatch',
    'blood_hemovigilance', 'blood_waste', 'blood_chemical_waste', 'blood_manifest',
    'label_studio', 'routing', 'his_ehr', 'his_console', 'his_triage', 'his_ris_pacs',
    'shifts', 'inventory', 'cmms', 'eqa', 'minsa', 'accreditation'
  ],

  // 🔬 Técnico de Laboratorio / Flebotomista
  lab_tech: [
    'dashboard', 'patient_results', 'phlebotomy', 'lis_hil', 'lis_panic',
    'inventory', 'label_studio', 'routing', 'blood_donors', 'shifts'
  ],

  // 💼 Recepcionista / Admisión
  receptionist: [
    'dashboard', 'patient_results', 'billing', 'shifts', 'whatsapp', 'blood_donors'
  ],

  // 🩺 Médico Referente
  ext_doctor: [
    'dashboard', 'patient_results', 'batch_reporting', 'his_ehr'
  ],

  // 👤 Paciente / Cliente
  patient: [
    'dashboard', 'patient_results'
  ]
};


export const Header: React.FC<HeaderProps> = ({
  onOpenBranchModal,
  onLockSession,
  showAllModules,
}) => {
  const [activeCategoryMenu, setActiveCategoryMenu] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const {
    currentRole,
    currentUser,
    currentBranch,
    activeTab,
    setActiveTab,
    logout,
    isSyncing,
    isDemoMode,
    language,
    setLanguage
  } = useLisStore();

  const allowedTabIds = showAllModules
    ? NAVIGATION_TABS.map((t) => t.id)
    : ALLOWED_TABS_PER_ROLE[currentRole || 'lab_tech'] || ['dashboard'];

  const visibleTabs = NAVIGATION_TABS.filter((t) => allowedTabIds.includes(t.id));

  const getTabLabel = (tab: { id: string; label: string }) => {
    if (tab.id === 'patient_results') {
      if (currentRole === 'receptionist') return 'Órdenes del día';
      if (currentRole === 'lab_tech') return 'Mis muestras';
      if (currentRole === 'tech_med' || currentRole === 'lab_chief') return 'Resultados de Pacientes';
    }
    return tab.label;
  };

  const DOMAIN_CATEGORIES = [
    { id: 'lis', label: 'Laboratorio LIS', icon: Microscope, count: visibleTabs.filter(t => t.category === 'lis').length },
    { id: 'his', label: 'Hospital HIS', icon: Activity, count: visibleTabs.filter(t => t.category === 'his').length },
    { id: 'bloodbank', label: 'Banco Sangre', icon: Droplets, count: visibleTabs.filter(t => t.category === 'bloodbank').length },
    { id: 'bi', label: 'Gestión & BI', icon: BrainCircuit, count: visibleTabs.filter(t => t.category === 'bi').length }
  ];

  // Filter modules inside the Mega-Menu Panel based on Category AND Search Query
  const filteredModules = visibleTabs.filter((tab) => {
    const matchesCategory =
      !activeCategoryMenu ||
      activeCategoryMenu === 'all' ||
      tab.category === activeCategoryMenu ||
      (tab.id === 'dashboard' && activeCategoryMenu === 'lis');

    const matchesSearch =
      !searchQuery.trim() ||
      tab.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tab.desc && tab.desc.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (tab.id && tab.id.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesSearch;
  });

  const isMenuOpen = activeCategoryMenu !== null;

  const getModuleCardStyles = (category: string, isSubActive: boolean) => {
    if (isSubActive) {
      if (category === 'lis') return {
        card: 'bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-400 text-slate-950 font-black border-cyan-300 shadow-lg shadow-cyan-500/40 ring-2 ring-cyan-300',
        iconBg: 'bg-slate-950/20 text-slate-950',
        badge: 'bg-slate-950/30 text-slate-950'
      };
      if (category === 'his') return {
        card: 'bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 text-white font-black border-indigo-300 shadow-lg shadow-indigo-500/40 ring-2 ring-indigo-300',
        iconBg: 'bg-slate-950/20 text-white',
        badge: 'bg-slate-950/30 text-white'
      };
      if (category === 'bloodbank') return {
        card: 'bg-gradient-to-r from-rose-500 via-red-500 to-rose-500 text-white font-black border-rose-300 shadow-lg shadow-rose-500/40 ring-2 ring-rose-300',
        iconBg: 'bg-slate-950/20 text-white',
        badge: 'bg-slate-950/30 text-white'
      };
      return {
        card: 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-slate-950 font-black border-amber-300 shadow-lg shadow-amber-500/40 ring-2 ring-amber-300',
        iconBg: 'bg-slate-950/20 text-slate-950',
        badge: 'bg-slate-950/30 text-slate-950'
      };
    }

    if (category === 'lis') {
      return {
        card: 'bg-gradient-to-br from-[#020e2e]/90 via-[#03133d] to-[#01081a] border-cyan-500/30 hover:border-cyan-400 text-slate-100 hover:shadow-cyan-500/20 hover:shadow-lg',
        iconBg: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30',
        badge: 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30',
        label: '🔬 LIS'
      };
    }
    if (category === 'his') {
      return {
        card: 'bg-gradient-to-br from-[#0c0d36]/90 via-[#12134a] to-[#05061c] border-indigo-500/30 hover:border-indigo-400 text-slate-100 hover:shadow-indigo-500/20 hover:shadow-lg',
        iconBg: 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30',
        badge: 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30',
        label: '🏥 HIS'
      };
    }
    if (category === 'bloodbank') {
      return {
        card: 'bg-gradient-to-br from-[#2a0815]/90 via-[#3b0b1e] to-[#120208] border-rose-500/30 hover:border-rose-400 text-slate-100 hover:shadow-rose-500/20 hover:shadow-lg',
        iconBg: 'bg-rose-500/20 text-rose-400 border border-rose-500/30',
        badge: 'bg-rose-500/15 text-rose-300 border border-rose-500/30',
        label: '🩸 BANCO SANGRE'
      };
    }
    return {
      card: 'bg-gradient-to-br from-[#261502]/90 via-[#382003] to-[#120a01] border-amber-500/30 hover:border-amber-400 text-slate-100 hover:shadow-amber-500/20 hover:shadow-lg',
      iconBg: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
      badge: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
      label: '💼 GESTIÓN & BI'
    };
  };

  return (
    <header className="bg-[#03091e]/95 backdrop-blur-3xl text-white border-b border-cyan-500/30 sticky top-0 z-40 shadow-[0_10px_30px_rgba(0,0,0,0.85)] w-full">
      <div className="w-full px-2 sm:px-4 h-16 sm:h-20 flex items-center justify-between gap-1.5 sm:gap-2.5 max-w-[1920px] mx-auto">

        {/* Brand Logo */}
        <div className="flex items-center space-x-2 shrink-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-tr from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(0,240,255,0.4)] rotate-3">
            <Activity className="w-4.5 h-4.5 text-slate-950 -rotate-3" />
          </div>
          <span className="font-black tracking-tighter text-base sm:text-lg text-white">LIS<span className="text-cyan-400 drop-shadow-[0_0_10px_rgba(0,240,255,0.5)]">CORE</span></span>
        </div>

        {/* Floating Luxury Glass Navigation Bar (Adaptive Responsive Layout) */}
        <nav className="hidden md:flex items-center space-x-1.5 bg-[#02071a]/85 backdrop-blur-3xl border border-white/10 rounded-full p-1.5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_10px_30px_rgba(0,0,0,0.8)] shrink-0">

          {/* Direct Dashboard Pill */}
          <button
            onClick={() => { setActiveTab('dashboard'); setActiveCategoryMenu(null); }}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'dashboard'
                ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-black shadow-[0_0_15px_rgba(0,240,255,0.4)]'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <LayoutDashboard className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'dashboard' ? 'text-slate-950' : 'text-cyan-400'}`} />
            <span className="uppercase tracking-wider whitespace-nowrap">Dashboard</span>
          </button>

          {/* Suite Category Pills (Ultra-wide screens 1536px+) */}
          <div className="hidden 2xl:flex items-center space-x-1">
            {DOMAIN_CATEGORIES.map((category) => {
              const CategoryIcon = category.icon;
              const isCategoryActive = visibleTabs.some(t => t.category === category.id && t.id === activeTab);
              const isOpen = activeCategoryMenu === category.id;

              return (
                <button
                  key={category.id}
                  onClick={() => {
                    setSearchQuery('');
                    setActiveCategoryMenu(isOpen ? null : category.id);
                  }}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    isOpen || isCategoryActive
                      ? 'bg-gradient-to-r from-cyan-500/30 via-blue-500/20 to-cyan-500/30 text-cyan-200 border border-cyan-400/60 shadow-[0_0_15px_rgba(0,240,255,0.3)]'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <CategoryIcon className={`w-3.5 h-3.5 shrink-0 ${(isOpen || isCategoryActive) ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(0,240,255,0.6)]' : 'text-cyan-400'}`} />
                  <span className="uppercase tracking-wider whitespace-nowrap">{category.label}</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-cyan-400 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                </button>
              );
            })}
          </div>

          {/* Unified Mega Launcher Button (Shown on 100% Zoom Desktop Screens < 1536px) */}
          <button
            onClick={() => {
              setSearchQuery('');
              setActiveCategoryMenu(isMenuOpen ? null : 'all');
            }}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              isMenuOpen
                ? 'bg-cyan-400 text-slate-950 shadow-[0_0_20px_rgba(0,240,255,0.5)]'
                : 'bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-cyan-500/20 text-cyan-200 border border-cyan-400/40 hover:bg-cyan-500/30'
            }`}
          >
            <Grid className="w-3.5 h-3.5 text-cyan-400" />
            <span className="uppercase tracking-wider">❖ Módulos LIS-CORE ({visibleTabs.length})</span>
            <ChevronDown className={`w-3.5 h-3.5 text-cyan-400 shrink-0 transition-transform duration-300 ${isMenuOpen ? 'rotate-180' : ''}`} />
          </button>
        </nav>

        {/* Right Controls: Timer, User Profile Badge, Lock & Logout */}
        <div className="flex items-center space-x-1 sm:space-x-1.5 shrink-0 ml-auto">
          
          {isDemoMode && (
            <div className="hidden xl:flex items-center space-x-1 px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded-full animate-pulse">
               <Sparkles className="w-3 h-3 text-amber-400" />
               <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest">Demo</span>
            </div>
          )}

          {isSyncing && (
            <div className="flex items-center gap-1 px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/20 rounded-full animate-pulse">
               <RefreshCw className="w-3 h-3 text-cyan-400 animate-spin" />
               <span className="text-[9px] font-black text-cyan-400 uppercase tracking-tighter">Sync</span>
            </div>
          )}

          {/* Offline Sync */}
          <OfflineSyncIndicator />

          {/* Interactive Language Selector Dropdown (ES / EN) */}
          <div className="flex items-center bg-slate-900 border border-slate-700/80 rounded-full px-2.5 py-1 gap-1 shadow-md text-xs font-bold text-white shrink-0 cursor-pointer hover:border-cyan-400 transition-colors">
            <Globe className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <select
              value={language}
              onChange={(e) => {
                const newLang = e.target.value as 'ES' | 'EN';
                setLanguage(newLang);
                window.dispatchEvent(
                  new CustomEvent('lis-global-toast', {
                    detail: {
                      message: newLang === 'ES' ? '🇪🇸 Idioma cambiado a Español (Panamá).' : '🇺🇸 Language switched to English (US).',
                      type: 'info',
                      duration: 3000
                    }
                  })
                );
              }}
              className="bg-transparent text-white font-mono font-bold text-xs focus:outline-none cursor-pointer pr-1"
            >
              <option value="ES" className="bg-slate-900 text-white">🇵🇦 ES</option>
              <option value="EN" className="bg-slate-900 text-white">🇺🇸 EN</option>
            </select>
          </div>

          {/* Quick Punch Clock / Marcaje Turno Button (ALL ROLES) */}
          <button
            onClick={() => setActiveTab('punch_clock')}
            title="Marcaje Digital de Entrada y Salida de Turno (Biométrico / PIN)"
            className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-slate-900 border border-emerald-500/40 hover:bg-emerald-500/20 hover:border-emerald-400 text-emerald-300 transition-all cursor-pointer font-extrabold text-xs shrink-0 shadow-md shadow-emerald-500/10"
          >
            <Clock className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="uppercase tracking-wider text-[11px]">Marcaje Turno</span>
          </button>

          {/* Inactivity Countdown Timer */}
          <SessionInactivityTracker onLockSession={onLockSession} timeoutSeconds={300} />

          <div className="h-5 w-px bg-white/10 hidden sm:block"></div>

          {/* Compact Responsive User Profile Badge */}
          <div
            onClick={onOpenBranchModal}
            className="hidden md:flex items-center bg-[#02071a]/95 border border-cyan-500/40 rounded-full px-2.5 py-1 gap-2 shadow-lg shrink-0 cursor-pointer hover:border-cyan-400 transition-colors"
            title="Click para cambiar de Sede / Sucursal"
          >
            <div className="flex flex-col text-right min-w-0">
              <span className="text-xs font-black text-white uppercase tracking-tight leading-none truncate max-w-[90px] lg:max-w-[120px] xl:max-w-[160px]">
                {currentUser?.name || 'Lic. Sofía Guardia'}
              </span>
              <span className="text-[9px] text-cyan-300 font-bold uppercase tracking-wider opacity-90 truncate max-w-[90px] lg:max-w-[120px] xl:max-w-[160px] mt-0.5">
                {currentBranch?.name || 'Sede Vía España'}
              </span>
            </div>
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-500 text-slate-950 font-black text-xs flex items-center justify-center shadow-md shrink-0">
              {ROLE_LABELS[currentUser?.role || 'owner']?.title?.charAt(0) || 'D'}
            </div>
          </div>

          <div className="h-8 w-px bg-white/5 hidden md:block"></div>

          {/* Lock Session Button */}
          {onLockSession && (
            <button
              onClick={onLockSession}
              title="Bloquear Estación Manualmente"
              className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-2xl bg-slate-900 border border-white/10 hover:bg-amber-500/20 hover:border-amber-500/50 hover:text-amber-400 transition-all cursor-pointer group shrink-0"
            >
              <Lock className="w-4 h-4 text-slate-400 group-hover:text-amber-400 transition-transform" />
            </button>
          )}

          {/* Logout Button */}
          <button
            onClick={logout}
            title="Cerrar Sesión"
            className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-2xl bg-slate-900 border border-white/10 hover:bg-rose-500/20 hover:border-rose-500/50 hover:text-rose-400 transition-all cursor-pointer group shrink-0"
          >
            <LogOut className="w-4 h-4 text-slate-400 group-hover:text-rose-400 transition-transform" />
          </button>
        </div>
      </div>

      {/* Senior Enterprise Viewport-Centered Mega Dropdown Console */}
      {isMenuOpen && (
        <>
          {/* Opaque Dark Backdrop Overlay */}
          <div
            className="fixed inset-0 z-40 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200"
            onClick={() => setActiveCategoryMenu(null)}
          ></div>

          {/* Viewport-Centered Solid Opaque Mega Console Box */}
          <div className="fixed top-16 sm:top-20 left-1/2 -translate-x-1/2 w-[min(940px,95vw)] max-h-[85vh] bg-[#020817] border-2 border-cyan-500/40 rounded-3xl p-4 sm:p-6 shadow-[0_25px_90px_rgba(0,0,0,0.98)] ring-1 ring-cyan-500/30 z-50 flex flex-col space-y-4 animate-in fade-in zoom-in-95 duration-200">

            {/* Top Toolbar inside Mega Console (Solid Dark Wrapper) */}
            <div className="bg-[#030b26] p-3.5 sm:p-4 rounded-2xl border border-cyan-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-inner">

              {/* Category Title & Badge */}
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 border border-cyan-400/40 text-cyan-300 shadow-md">
                  <Grid className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <span>
                      {activeCategoryMenu === 'all'
                        ? 'Consola Unificada LIS-CORE'
                        : `Suite ${DOMAIN_CATEGORIES.find(c => c.id === activeCategoryMenu)?.label || 'Especializada'}`}
                    </span>
                    <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold">
                      {filteredModules.length} Módulos
                    </span>
                  </h3>
                  <p className="text-[10px] text-slate-400 font-medium">Seleccione el módulo clínico o administrativo para navegar</p>
                </div>
              </div>

              {/* Instant Search Bar */}
              <div className="flex items-center gap-2 flex-1 sm:max-w-xs ml-auto">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-cyan-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar módulo o función..."
                    className="w-full bg-[#010514] border border-cyan-500/40 rounded-full pl-9 pr-8 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 shadow-inner"
                    autoFocus
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <button
                  onClick={() => setActiveCategoryMenu(null)}
                  className="w-8 h-8 rounded-full bg-slate-900 border border-slate-700 text-slate-400 hover:text-white hover:border-cyan-400 flex items-center justify-center shrink-0 cursor-pointer"
                  title="Cerrar (Esc)"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Category Filter Pills Bar (Solid Background Container) */}
            <div className="bg-[#010514] p-1.5 rounded-2xl border border-white/10 flex items-center gap-1.5 overflow-x-auto no-scrollbar shadow-inner">
              <button
                onClick={() => setActiveCategoryMenu('all')}
                className={`px-3.5 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer ${
                  activeCategoryMenu === 'all'
                    ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-black shadow-md shadow-cyan-500/30'
                    : 'bg-slate-900/90 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                Todos los Módulos ({visibleTabs.length})
              </button>

              {DOMAIN_CATEGORIES.map((cat) => {
                const CatIcon = cat.icon;
                const isSelected = activeCategoryMenu === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategoryMenu(cat.id)}
                    className={`px-3.5 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer flex items-center space-x-1.5 ${
                      isSelected
                        ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-black shadow-md shadow-cyan-500/30'
                        : 'bg-slate-900/90 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    <CatIcon className={`w-3.5 h-3.5 ${isSelected ? 'text-slate-950' : 'text-cyan-400'}`} />
                    <span>{cat.label}</span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-slate-950/20 text-slate-950' : 'bg-cyan-500/20 text-cyan-300'}`}>
                      {cat.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Module Grid (Solid High-Contrast Cards, Smooth Scroll & Bottom Padding) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[50vh] sm:max-h-[55vh] overflow-y-auto no-scrollbar p-1 pb-4">
              {filteredModules.length === 0 ? (
                <div className="col-span-full py-12 text-center space-y-2">
                  <Search className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-xs font-bold text-slate-400">No se encontraron módulos con "<span className="text-cyan-400">{searchQuery}</span>"</p>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-[11px] text-cyan-400 underline font-bold cursor-pointer"
                  >
                    Limpiar búsqueda
                  </button>
                </div>
              ) : (
                filteredModules.map((tab) => {
                  const SubIcon = tab.icon;
                  const isSubActive = activeTab === tab.id;
                  const style = getModuleCardStyles(tab.category, isSubActive);

                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id);
                        setActiveCategoryMenu(null);
                      }}
                      className={`p-3.5 rounded-2xl border transition-all text-left cursor-pointer group flex flex-col justify-between space-y-2 ${style.card}`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`p-2.5 rounded-xl shrink-0 ${style.iconBg} group-hover:scale-110 transition-transform`}>
                          <SubIcon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <h4 className="text-xs font-extrabold leading-tight truncate">{getTabLabel(tab)}</h4>
                            {!isSubActive && style.label && (
                              <span className={`text-[8px] font-mono font-bold px-1.5 py-0.2 rounded-full uppercase shrink-0 ${style.badge}`}>
                                {style.label}
                              </span>
                            )}
                          </div>
                          {tab.desc && (
                            <p className={`text-[10px] line-clamp-2 leading-relaxed font-medium ${isSubActive ? 'text-slate-900' : 'text-slate-400 group-hover:text-slate-200'}`}>
                              {tab.desc}
                            </p>
                          )}
                        </div>
                      </div>

                      {tab.example && (
                        <span className={`text-[9px] font-mono font-bold tracking-tight truncate px-2 py-0.5 rounded-md self-start ${isSubActive ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-950/80 text-amber-300 border border-amber-500/20'}`}>
                          {tab.example}
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}

      {/* Mobile / Tablet Horizontal Scroller */}
      <div className="lg:hidden border-t border-white/5 px-3 py-2 bg-[#020617]/90 overflow-x-auto no-scrollbar flex items-center space-x-2">
        <button
          onClick={() => { setActiveTab('dashboard'); setActiveCategoryMenu(null); }}
          className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all shrink-0 ${
            activeTab === 'dashboard' ? 'bg-cyan-400 text-slate-950 shadow-md' : 'bg-white/5 text-slate-400 hover:text-white'
          }`}
        >
          Dashboard
        </button>

        <button
          onClick={() => {
            setSearchQuery('');
            setActiveCategoryMenu(isMenuOpen ? null : 'all');
          }}
          className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider whitespace-nowrap flex items-center space-x-1.5 transition-all shrink-0 ${
            isMenuOpen ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm' : 'bg-white/5 text-slate-300 hover:text-white'
          }`}
        >
          <Grid className="w-3 h-3 text-cyan-400" />
          <span>Módulos ({visibleTabs.length})</span>
        </button>
      </div>
    </header>
  );
};
