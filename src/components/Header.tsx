import React, { useState, useEffect } from 'react';
import { Role, Tenant, Branch, User } from '../types';
import { useLisStore } from '../store/useLisStore';
import { useHisStore } from '../store/useHisStore';
import {
  Activity, Building2, SlidersHorizontal, LogOut, MapPin, Filter, LayoutDashboard, Receipt, Package, Sparkles, Cpu, AlertTriangle, FileCheck2, BrainCircuit, Shield, ShieldCheck, Truck, Globe, Server, Award, Database, Microscope, FileText, ChevronDown, MoreHorizontal, Lock, Calendar, Target, Wrench, MessageSquare, Droplets, Printer, BarChart3, BookOpen, Files, Archive, Mail, RefreshCw, Calculator, Search, X, Grid, QrCode, HeartPulse, Clock, Menu
} from 'lucide-react';
import { OfflineSyncIndicator } from './OfflineSyncIndicator';
import { SessionInactivityTracker } from './SessionInactivityTracker';
import { getTimeBasedGreeting } from '../utils/greeting';
import { ServerInfrastructureModal } from './Infrastructure/ServerInfrastructureModal';
import {
  ROLE_LABELS_MAP,
  getRoleLabel,
  getTabLabel as getI18nTabLabel,
  getTabDescription,
  getTabExample,
  getBranchName
} from '../utils/i18n';

interface HeaderProps {
  onRoleChange: (role: Role) => void;
  onTenantChange: (tenantId: string) => void;
  onBranchChange: (branchId: string) => void;
  onOpenBranchModal?: () => void;
  onLockSession?: () => void;
  showAllModules: boolean;
  setShowAllModules: (show: boolean) => void;
}

export const ROLE_LABELS = ROLE_LABELS_MAP.ES;
export { getRoleLabel };

export const NAVIGATION_TABS = [
  // 🔬 LIS (Laboratorio Clínico)
  { id: 'dashboard', label: 'Dashboard Principal', icon: LayoutDashboard, category: 'lis', desc: 'Vista ejecutiva y métricas en tiempo real.' },
  { id: 'reception', label: 'Admisión & Recepción', icon: Receipt, category: 'lis', desc: 'Módulo de admisión, registro de pacientes, toma de órdenes y etiquetado.' },
  { id: 'validation', label: 'Resultados & Validación', icon: Microscope, category: 'lis', desc: 'Consola de ingreso y firma técnica/médica de analitos.', example: 'Firma electrónica Ley 81' },
  { id: 'tm_workbench', label: 'Estación TM (Bancada)', icon: Activity, category: 'lis', desc: 'Bancada técnica de trabajo para tecnólogos.' },
  { id: 'lis_workstation', label: 'Estación 3D de Validación', icon: Sparkles, category: 'lis', desc: 'Validación tridimensional clínica de muestras.' },
  { id: 'patient_results', label: 'Expedientes & Muestras', icon: FileText, category: 'lis', desc: 'Historial completo de muestras y órdenes del paciente.' },
  { id: 'test_catalog', label: 'Catálogo LIS & Pruebas', icon: BookOpen, category: 'lis', desc: 'Definición de pruebas, perfiles, valores de referencia y tubos.' },
  { id: 'qc', label: 'Control Calidad QC', icon: SlidersHorizontal, category: 'lis', desc: 'Gráficas Levey-Jennings y reglas de Westgard.' },
  { id: 'middleware', label: 'Middleware ASTM', icon: Sparkles, category: 'lis', desc: 'Consola de comunicación bidireccional ASTM E1381/E1394.' },
  { id: 'homologation', label: 'Analizadores Clínicos', icon: SlidersHorizontal, category: 'lis', desc: 'Mapeo de códigos de analitos de equipos al catálogo.' },
  { id: 'drivers', label: 'Controladores ASTM / HL7', icon: Cpu, category: 'lis', desc: 'Controladores de red TCP/IP y RS232 para equipos de lab.' },
  { id: 'phlebotomy', label: 'Flebotomía GPS', icon: Truck, category: 'lis', desc: 'Ruteo y toma de muestras a domicilio en tiempo real.' },
  { id: 'pathology', label: 'Patología Anatómica', icon: Microscope, category: 'lis', desc: 'Gestión de biopsias, citología e histopatología.' },
  { id: 'batch_reporting', label: 'Emisión Masiva de Reportes PDF', icon: Files, category: 'lis', desc: 'Generación e impresión masiva de reportes de laboratorio.' },
  { id: 'lis_hil', label: 'Preanalítica HIL', icon: Droplets, category: 'lis', desc: 'Evaluación de índices de Hemólisis, Ictericia y Lipemia.', example: 'Ej: Muestra Lipémica 2+' },
  { id: 'lis_panic', label: 'Registro de Pánicos', icon: AlertTriangle, category: 'lis', desc: 'Bitácora obligatoria de notificación de valores críticos.', example: 'Ej: Notificado a Médico' },
  { id: 'lis_alerts_center', label: 'Centro de Alertas & Pánicos', icon: ShieldCheck, category: 'lis', desc: 'Consola unificada de gestión de pánicos ISO 15189.' },
  { id: 'lis_calculators', label: 'Calculadoras Clínicas', icon: Calculator, category: 'lis', desc: 'Calculadoras para eGFR, LDL Martin-Hopkins, HOMA-IR y De Ritis.' },
  { id: 'lis_telemetry', label: 'Telemetría de Analizadores', icon: BrainCircuit, category: 'lis', desc: 'Monitoreo de telemetría de equipos y gráficas de evolución.' },
  { id: 'delta', label: 'Delta Check & Pánicos', icon: AlertTriangle, category: 'lis', desc: 'Monitoreo de variaciones de pánico y significancia clínica Delta Check.', example: 'Ej: Variación Delta > 20%' },
  { id: 'lis_referrals', label: 'Remisión & Derivación de Muestras', icon: Truck, category: 'lis', desc: 'Remisión, valijas térmicas y derivación a Laboratorios de Referencia Externa y Ruteo.', example: 'Ej: Remisiones / Gorgas' },

  // 🏥 HIS (Suite Hospitalaria)
  { id: 'his_command', label: 'Centro de Mando Hospitalario', icon: Building2, category: 'his', desc: 'Centro de mando operativo, ocupación y alertas.' },
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

  // 🩸 BANCO DE SANGRE (Medicina Transfusional)
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
  { id: 'blood_bedside', label: 'Transfusión a Pie de Cama', icon: QrCode, category: 'bloodbank', desc: 'Verificación a pie de cama por escaneo triple de código QR.' },
  { id: 'blood_hemovigilance', label: 'Hemovigilancia Eventos', icon: ShieldCheck, category: 'bloodbank', desc: 'Notificación de reacciones adversas transfusionales.' },
  { id: 'blood_waste', label: 'Desechos Biológicos', icon: Wrench, category: 'bloodbank', desc: 'Descarte seguro de unidades reactivas o vencidas.' },
  { id: 'blood_chemical_waste', label: 'Desechos Químicos', icon: Wrench, category: 'bloodbank', desc: 'Tratamiento de efluentes y reactivos agotados.' },
  { id: 'blood_manifest', label: 'Manifiesto Descarte PDF', icon: Printer, category: 'bloodbank', desc: 'Generación de manifiestos reglamentarios MINSA.' },
  { id: 'label_studio', label: 'Etiquetas ISBT 128', icon: Printer, category: 'bloodbank', desc: 'Impresión de códigos de barras ISBT 128 homologados.' },
  { id: 'routing', label: 'Remisión & Ruteo Inter-Sedes', icon: Truck, category: 'bloodbank', desc: 'Remisión de muestras, valijas térmicas y logística inter-sucursales.', example: 'Ej: Remisiones / Traslados' },

  // 💼 GESTIÓN & BI (Administración)
  { id: 'billing', label: 'Facturación POS & DGI', icon: Receipt, category: 'bi', desc: 'Caja POS, facturación electrónica e integración DGI Panamá.' },
  { id: 'inventory', label: 'Inventario Reactivos FEFO', icon: Package, category: 'bi', desc: 'Kardex de insumos con semaforización FEFO y lotes.' },
  { id: 'executive', label: 'Analítica BI & Ejecutivo', icon: BrainCircuit, category: 'bi', desc: 'Tableros ejecutivos, costos por prueba e ingresos.' },
  { id: 'productivity', label: 'Productividad & Métricas', icon: BarChart3, category: 'bi', desc: 'Tiempos de respuesta (TAT) y carga por sección.' },
  { id: 'minsa', label: 'Reportes MINSA', icon: FileCheck2, category: 'bi', desc: 'Exportación de boletines epidemiológicos obligatorios.' },
  { id: 'audit', label: 'Auditoría Ley 81', icon: ShieldCheck, category: 'bi', desc: 'Bitácora inalterable de accesos y protección de PII.' },
  { id: 'cmms', label: 'Mantenimiento CMMS', icon: Wrench, category: 'bi', desc: 'Mantenimiento preventivo y correctivo de equipos.' },
  { id: 'eqa', label: 'PEEC / Control Calidad EQA', icon: Target, category: 'bi', desc: 'Evaluación externa de calidad y comparaciones interlaboratorios.' },
  { id: 'whatsapp', label: 'Notificaciones WhatsApp', icon: MessageSquare, category: 'bi', desc: 'Envío automático de resultados en PDF por WhatsApp.' },
  { id: 'fhir', label: 'FHIR Interoperabilidad', icon: Globe, category: 'bi', desc: 'Servidor FHIR REST API para integración de datos.' },
  { id: 'ha_dr', label: 'Alta Disponibilidad & Contingencia (HA/DR)', icon: Server, category: 'bi', desc: 'Clúster activo-pasivo y réplica de contingencia.' },
  { id: 'accreditation', label: 'Acreditación ISO 15189', icon: Award, category: 'bi', desc: 'Gestión documental y evidencias de auditoría ISO.' },
  { id: 'schema', label: 'Base de Datos & Esquemas', icon: Database, category: 'bi', desc: 'Visor de modelos E-R y diccionario de datos PostgreSQL.' },
  { id: 'superadmin', label: 'Consola Súper-Admin', icon: Shield, category: 'bi', desc: 'Control maestro de clientes, sedes, catálogo LIS, valores de referencia, HIS y banco de sangre.', example: 'Ej: Superadmin / AbregoTech' },
];

const ALL_MODULE_TABS = NAVIGATION_TABS.map(t => t.id);

export const ALLOWED_TABS_PER_ROLE: Record<Role, string[]> = {
  owner: ALL_MODULE_TABS,
  lab_chief: ALL_MODULE_TABS.filter(t => t !== 'superadmin'),
  abregotech_admin: ALL_MODULE_TABS,

  // 🔬 Tecnólogo Médico (TM): Acceso total a analítica LIS, Banco de Sangre, Validación y Calidad QC
  tech_med: [
    'dashboard', 'reception', 'validation', 'tm_workbench', 'lis_workstation', 'patient_results',
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
    'dashboard', 'reception', 'patient_results', 'phlebotomy', 'lis_hil', 'lis_panic',
    'inventory', 'label_studio', 'routing', 'blood_donors', 'shifts'
  ],

  // 💼 Recepcionista / Admisión
  receptionist: [
    'dashboard', 'reception', 'patient_results', 'billing', 'shifts', 'whatsapp', 'blood_donors'
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
  const [isMoreSuitesDropdownOpen, setIsMoreSuitesDropdownOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isServerHealthModalOpen, setIsServerHealthModalOpen] = useState<boolean>(false);

  const {
    currentRole,
    currentUser,
    currentBranch,
    activeTab,
    setActiveTab,
    logout,
    isSyncing,
    isDemoMode,
    toggleDemoMode,
    language,
    setLanguage
  } = useLisStore();

  // Clean User Name & Initials (extract clean name from mock titles like "Ing. Rubén Abrego (Senior Lead Developer & Architect)")
  const rawUserName = currentUser?.name || 'Licda. Ana Morales';
  const cleanUserName = (rawUserName.includes('(') ? rawUserName.split('(')[0].trim() : rawUserName).replace('Ruben Abrego', 'Rubén Ábrego');
  const userInitials = (() => {
    const withoutTitles = cleanUserName.replace(/^(Ing\.|Licda\.|Lic\.|Dr\.|Dra\.|Sr\.|Sra\.)\s*/i, '').trim();
    const parts = withoutTitles.split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return withoutTitles.substring(0, 2).toUpperCase() || 'RÁ';
  })();

  const allowedTabIds = showAllModules
    ? NAVIGATION_TABS.map((t) => t.id)
    : ALLOWED_TABS_PER_ROLE[currentRole || 'lab_tech'] || ['dashboard'];

  const visibleTabs = NAVIGATION_TABS.filter((t) => allowedTabIds.includes(t.id));

  const getTabLabel = (tab: { id: string; label: string }) => {
    // 1. Nomenclatura oficial por rol para 'patient_results' (Sección 7 Especificación LIS/HIS)
    if (tab.id === 'patient_results') {
      if (language === 'EN') {
        if (currentRole === 'receptionist') return "Today's Orders";
        if (currentRole === 'lab_tech') return "My Samples";
        return "Patient Results";
      } else {
        if (currentRole === 'receptionist') return 'Órdenes del día';
        if (currentRole === 'lab_tech') return 'Mis muestras';
        return 'Resultados de Pacientes';
      }
    }

    return getI18nTabLabel(tab.id, tab.label, language);
  };

  const greeting = getTimeBasedGreeting(language);

  const DOMAIN_CATEGORIES = [
    {
      id: 'lis',
      label: language === 'EN' ? 'LIS Laboratory' : 'Laboratorio LIS',
      shortLabel: 'LIS',
      icon: Microscope,
      count: visibleTabs.filter(t => t.category === 'lis').length
    },
    {
      id: 'his',
      label: language === 'EN' ? 'HIS Hospital' : 'Hospital HIS',
      shortLabel: 'HIS',
      icon: Activity,
      count: visibleTabs.filter(t => t.category === 'his').length
    },
    {
      id: 'bloodbank',
      label: language === 'EN' ? 'Blood Bank' : 'Banco Sangre',
      shortLabel: language === 'EN' ? 'Blood' : 'Sangre',
      icon: Droplets,
      count: visibleTabs.filter(t => t.category === 'bloodbank').length
    },
    {
      id: 'bi',
      label: language === 'EN' ? 'BI & Management' : 'Gestión & BI',
      shortLabel: language === 'EN' ? 'BI' : 'Gestión',
      icon: BrainCircuit,
      count: visibleTabs.filter(t => t.category === 'bi').length
    }
  ];

  // Primary suites directly accessible on laptops: LIS, HIS, Banco de Sangre
  const primaryCategories = DOMAIN_CATEGORIES.slice(0, 3);
  // Secondary suite (Gestión & BI) grouped with Unified Catalog
  const secondaryCategories = DOMAIN_CATEGORIES.slice(3);
  const isSecondaryActive = secondaryCategories.some(c => 
    visibleTabs.some(t => t.category === c.id && t.id === activeTab)
  );
  const activeSecondary = secondaryCategories.find(c => 
    visibleTabs.some(t => t.category === c.id && t.id === activeTab)
  );
  const secondaryTotalCount = secondaryCategories.reduce((acc, c) => acc + c.count, 0);

  // Filter modules based on Category AND Search Query
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
        card: 'bg-[#020e2e]/90 hover:bg-[#03133d] border-cyan-500/30 hover:border-cyan-400 text-slate-100 hover:shadow-cyan-500/20 hover:shadow-lg',
        iconBg: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30',
        badge: 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30',
        label: '🔬 LIS'
      };
    }
    if (category === 'his') {
      return {
        card: 'bg-[#0c0d36]/90 hover:bg-[#12134a] border-indigo-500/30 hover:border-indigo-400 text-slate-100 hover:shadow-indigo-500/20 hover:shadow-lg',
        iconBg: 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30',
        badge: 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30',
        label: '🏥 HIS'
      };
    }
    if (category === 'bloodbank') {
      return {
        card: 'bg-[#2a0815]/90 hover:bg-[#3b0b1e] border-rose-500/30 hover:border-rose-400 text-slate-100 hover:shadow-rose-500/20 hover:shadow-lg',
        iconBg: 'bg-rose-500/20 text-rose-400 border border-rose-500/30',
        badge: 'bg-rose-500/15 text-rose-300 border border-rose-500/30',
        label: language === 'EN' ? '🩸 BLOOD BANK' : '🩸 BANCO SANGRE'
      };
    }
    return {
      card: 'bg-[#261502]/90 hover:bg-[#382003] border-amber-500/30 hover:border-amber-400 text-slate-100 hover:shadow-amber-500/20 hover:shadow-lg',
      iconBg: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
      badge: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
      label: language === 'EN' ? '💼 BI & MANAGEMENT' : '💼 GESTIÓN & BI'
    };
  };

  // Keyboard Shortcuts: Escape to close, Ctrl+K or Cmd+K to open search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveCategoryMenu(null);
        setIsMoreSuitesDropdownOpen(false);
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setActiveCategoryMenu((prev) => (prev ? null : 'all'));
        setIsMoreSuitesDropdownOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <header className="bg-[#050814]/90 backdrop-blur-2xl text-white border-b border-white/[0.08] sticky top-0 z-40 shadow-[0_4px_25px_rgba(0,0,0,0.7)] w-full select-none">
      {/* Top Navbar Row */}
      <div className="w-full px-3 sm:px-4 md:px-5 lg:px-6 h-14 sm:h-15 flex items-center justify-between gap-2 max-w-[1920px] mx-auto">

        {/* Brand Logo & Mobile Menu Trigger */}
        <div className="flex items-center space-x-2.5 shrink-0">
          {/* Mobile Menu Trigger Button (< lg) */}
          <button
            onClick={() => {
              setSearchQuery('');
              setActiveCategoryMenu(isMenuOpen ? null : 'all');
            }}
            className="flex lg:hidden items-center justify-center w-8 h-8 rounded-xl bg-slate-900 border border-white/10 text-slate-300 hover:text-white hover:bg-slate-800 transition-all cursor-pointer shadow-sm"
            title={language === 'EN' ? "Open Clinical Modules Menu" : "Abrir Menú de Módulos Clínicos"}
          >
            {isMenuOpen ? <X className="w-4 h-4 text-cyan-300" /> : <Menu className="w-4 h-4 text-cyan-300" />}
          </button>

          {/* Platform Logo */}
          <div className="flex items-center space-x-2.5 cursor-pointer group shrink-0" onClick={() => setActiveTab('dashboard')}>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-500 to-indigo-600 p-[1px] shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all group-hover:shadow-[0_0_20px_rgba(6,182,212,0.5)] shrink-0">
              <div className="w-full h-full bg-[#050814] rounded-[11px] flex items-center justify-center">
                <Activity className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-extrabold tracking-tight text-sm sm:text-base text-white">
                  LIS<span className="text-cyan-400">CORE</span>
                </span>
                <span className="px-1.5 py-0.2 rounded text-[8px] font-mono font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/25 tracking-wider hidden sm:inline">
                  PRO
                </span>
              </div>
              <span className="text-[8.5px] font-mono text-slate-400 font-medium tracking-wider leading-none mt-0.5 hidden xs:inline">
                {language === 'EN' ? 'CLINICAL SUITE' : 'PLATAFORMA CLÍNICA'}
              </span>
            </div>
          </div>
        </div>

        {/* Floating Luxury Glass Navigation Rail (Desktop & Laptop lg+) */}
        <nav className="hidden lg:flex items-center space-x-1 bg-slate-900/60 backdrop-blur-md border border-white/[0.08] rounded-xl p-1 shadow-inner shrink-0">

          {/* Botón: Dashboard Principal */}
          <button
            onClick={() => { setActiveTab('dashboard'); setActiveCategoryMenu(null); setIsMoreSuitesDropdownOpen(false); }}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'dashboard'
                ? 'bg-gradient-to-b from-cyan-500/20 to-blue-600/10 border border-cyan-400/40 text-cyan-200 font-semibold shadow-[0_2px_12px_-2px_rgba(6,182,212,0.25),inset_0_1px_0_rgba(255,255,255,0.15)]'
                : 'text-slate-300 hover:text-white hover:bg-white/[0.05] font-medium'
            }`}
            title={language === 'EN' ? "Executive Dashboard" : "Dashboard Principal"}
          >
            <LayoutDashboard className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'dashboard' ? 'text-cyan-400' : 'text-slate-400'}`} />
            <span>{language === 'EN' ? 'Dashboard' : 'Principal'}</span>
          </button>

          {/* Divisor Visual */}
          <div className="h-4 w-px bg-white/[0.08] mx-0.5 shrink-0" />

          {/* 1. MODO LAPTOP / PANTALLAS ESTÁNDAR (< 2xl): 3 Suites Principales (LIS, HIS, Sangre) + Desplegable "Más Suites" (Gestión & Catálogo) */}
          <div className="flex 2xl:hidden items-center space-x-1 relative">
            {primaryCategories.map((category) => {
              const CategoryIcon = category.icon;
              const isCategoryActive = activeTab !== 'dashboard' && visibleTabs.some(t => t.category === category.id && t.id === activeTab);
              const isCategoryOpen = isMenuOpen && activeCategoryMenu === category.id;

              return (
                <button
                  key={`primary-${category.id}`}
                  onClick={() => {
                    setSearchQuery('');
                    setIsMoreSuitesDropdownOpen(false);
                    setActiveCategoryMenu((prev) => (prev === category.id ? null : category.id));
                  }}
                  className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    isCategoryOpen
                      ? 'bg-cyan-500/30 text-white font-semibold border border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                      : isCategoryActive
                      ? 'bg-gradient-to-b from-cyan-500/20 to-blue-600/10 border border-cyan-400/40 text-cyan-200 font-semibold shadow-[0_2px_12px_-2px_rgba(6,182,212,0.25)]'
                      : 'text-slate-300 hover:text-white hover:bg-white/[0.05] font-medium'
                  }`}
                  title={`Suite ${category.label} (${category.count})`}
                >
                  <CategoryIcon className={`w-3.5 h-3.5 shrink-0 ${isCategoryActive || isCategoryOpen ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span>{category.shortLabel}</span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md ${
                    isCategoryActive || isCategoryOpen
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30'
                      : 'bg-white/[0.05] text-slate-400 border border-white/[0.06]'
                  }`}>
                    {category.count}
                  </span>
                </button>
              );
            })}

            {/* Desplegable Agrupador: "Más Suites" (Gestión & BI + Catálogo Unificado) */}
            <div className="relative">
              <button
                onClick={() => setIsMoreSuitesDropdownOpen((prev) => !prev)}
                className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  isMoreSuitesDropdownOpen
                    ? 'bg-cyan-500/30 text-white font-semibold border border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                    : isSecondaryActive
                    ? 'bg-gradient-to-b from-amber-500/20 to-orange-600/10 border border-amber-400/40 text-amber-200 font-semibold shadow-[0_2px_12px_-2px_rgba(245,158,11,0.25)]'
                    : 'text-slate-300 hover:text-white hover:bg-white/[0.05] font-medium'
                }`}
                title={language === 'EN' ? "Management, Analytics & Complete Clinical Catalog" : "Gestión, Analítica BI y Catálogo Clínico Completo"}
              >
                {activeSecondary ? (
                  <BrainCircuit className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                ) : (
                  <Grid className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                )}
                <span>
                  {activeSecondary ? activeSecondary.shortLabel : (language === 'EN' ? 'More Suites' : 'Más Suites')}
                </span>
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md ${
                  isSecondaryActive
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                    : 'bg-white/[0.05] text-slate-400 border border-white/[0.06]'
                }`}>
                  {activeSecondary ? activeSecondary.count : secondaryTotalCount}
                </span>
                <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isMoreSuitesDropdownOpen ? 'rotate-180 text-cyan-400' : ''}`} />
              </button>

              {/* Menú Flotante Desplegable */}
              {isMoreSuitesDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setIsMoreSuitesDropdownOpen(false)}
                  />
                  <div className="absolute top-full mt-2 left-0 min-w-[260px] bg-slate-950/95 border border-white/10 rounded-2xl p-2 shadow-[0_20px_50px_rgba(0,0,0,0.95)] backdrop-blur-2xl z-40 flex flex-col space-y-1 ring-1 ring-white/5 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-2.5 py-1 text-[9px] font-mono uppercase tracking-widest text-slate-400 border-b border-slate-800">
                      {language === 'EN' ? 'CLINICAL SUITES' : 'SUITES CLÍNICAS'}
                    </div>

                    {secondaryCategories.map((cat) => {
                      const CatIcon = cat.icon;
                      const isCatActive = activeTab !== 'dashboard' && visibleTabs.some(t => t.category === cat.id && t.id === activeTab);
                      return (
                        <button
                          key={cat.id}
                          onClick={() => {
                            setSearchQuery('');
                            setIsMoreSuitesDropdownOpen(false);
                            setActiveCategoryMenu(cat.id);
                          }}
                          className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                            isCatActive
                              ? 'bg-amber-500/20 text-amber-200 border border-amber-400/40'
                              : 'text-slate-200 hover:bg-white/[0.05] hover:text-white'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <CatIcon className="w-4 h-4 text-amber-400" />
                            <span>{cat.label}</span>
                          </div>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-300">
                            {cat.count}
                          </span>
                        </button>
                      );
                    })}

                    <div className="h-px bg-slate-800 my-1" />

                    {/* Acceso al Catálogo Completo */}
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setIsMoreSuitesDropdownOpen(false);
                        setActiveCategoryMenu('all');
                      }}
                      className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-cyan-300 bg-cyan-950/30 hover:bg-cyan-900/40 border border-cyan-500/30 transition-all cursor-pointer"
                    >
                      <div className="flex items-center space-x-2">
                        <Grid className="w-4 h-4 text-cyan-400" />
                        <span>❖ {language === 'EN' ? 'Unified Catalog' : 'Catálogo Unificado'}</span>
                      </div>
                      <span className="text-[9.5px] font-mono bg-cyan-500/20 text-cyan-200 px-1.5 py-0.5 rounded-full border border-cyan-400/30">
                        {visibleTabs.length} (⌘K)
                      </span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* 2. MODO PANTALLAS GRANDES (2xl+ >= 1536px): Todas las Píldoras Expandidas */}
          <div className="hidden 2xl:flex items-center space-x-1">
            {DOMAIN_CATEGORIES.map((category) => {
              const CategoryIcon = category.icon;
              const isCategoryActive = activeTab !== 'dashboard' && visibleTabs.some(t => t.category === category.id && t.id === activeTab);
              const isCategoryOpen = isMenuOpen && activeCategoryMenu === category.id;

              return (
                <button
                  key={category.id}
                  onClick={() => {
                    setSearchQuery('');
                    setActiveCategoryMenu((prev) => (prev === category.id ? null : category.id));
                  }}
                  className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    isCategoryOpen
                      ? 'bg-cyan-500/30 text-white font-semibold border border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                      : isCategoryActive
                      ? 'bg-gradient-to-b from-cyan-500/20 to-blue-600/10 border border-cyan-400/40 text-cyan-200 font-semibold shadow-[0_2px_12px_-2px_rgba(6,182,212,0.25)]'
                      : 'text-slate-300 hover:text-white hover:bg-white/[0.05] font-medium'
                  }`}
                  title={`Suite ${category.label} (${category.count})`}
                >
                  <CategoryIcon className={`w-3.5 h-3.5 shrink-0 ${isCategoryActive || isCategoryOpen ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span>{category.shortLabel}</span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md ${
                    isCategoryActive || isCategoryOpen
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30'
                      : 'bg-white/[0.05] text-slate-400 border border-white/[0.06]'
                  }`}>
                    {category.count}
                  </span>
                </button>
              );
            })}

            {/* Divisor Visual hacia el Catálogo Completo */}
            <div className="h-4 w-px bg-white/[0.08] mx-0.5 shrink-0" />

            {/* Botón Catálogo Unificado */}
            <button
              onClick={() => {
                setSearchQuery('');
                setActiveCategoryMenu(isMenuOpen && activeCategoryMenu === 'all' ? null : 'all');
              }}
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                isMenuOpen && activeCategoryMenu === 'all'
                  ? 'bg-cyan-500/30 text-white border border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                  : 'text-cyan-300 hover:text-white hover:bg-white/[0.05]'
              }`}
              title={language === 'EN' ? "View full clinical catalog (Ctrl+K)" : "Ver catálogo clínico completo (Ctrl+K)"}
            >
              <Grid className="w-3.5 h-3.5 shrink-0 text-cyan-400" />
              <span>❖ {language === 'EN' ? 'Catalog' : 'Catálogo'} ({visibleTabs.length})</span>
              <span className="text-[9px] font-mono opacity-70 bg-slate-800 px-1 py-0.2 rounded border border-white/10">⌘K</span>
            </button>
          </div>
        </nav>

        {/* Right Controls: Unified Luxury Hub */}
        <div className="flex items-center space-x-2 shrink-0 ml-auto">

          {/* Group 1: Environment & Network Telemetry */}
          <div className="flex items-center space-x-1.5">

            {/* Mode Switcher (Producción / Demo) */}
            {(currentRole === 'abregotech_admin' || (currentRole as string) === 'superadmin') && (
              <button
                onClick={() => {
                  const nextMode = !isDemoMode;
                  toggleDemoMode();
                  useHisStore.getState().setHisDemoMode(nextMode);
                }}
                title={
                  isDemoMode
                    ? (language === 'EN' ? "Demo Mode active. Click to switch to PRODUCTION." : "Modo Demostración activo. Clic para cambiar a PRODUCCIÓN.")
                    : (language === 'EN' ? "Production Mode active. Click to switch to DEMO." : "Modo Producción activo. Clic para alternar a DEMO.")
                }
                className={`h-8 px-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
                  isDemoMode
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
                    : 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/15'
                }`}
              >
                <span className={`w-2 h-2 rounded-full shrink-0 ${isDemoMode ? 'bg-amber-400' : 'bg-emerald-400 shadow-[0_0_6px_#34d399]'}`} />
                <span className="font-mono text-[11px] tracking-wide">
                  {isDemoMode ? 'DEMO' : 'PROD'}
                </span>
              </button>
            )}

            {/* Offline Sync Indicator */}
            <OfflineSyncIndicator />

            {/* Language Selector */}
            <div className="h-8 flex items-center bg-slate-900/60 border border-white/[0.08] hover:border-white/[0.18] rounded-xl px-2 gap-1.5 shadow-sm text-xs font-medium text-slate-300 transition-colors">
              <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={language}
                onChange={(e) => {
                  const newLang = e.target.value as 'ES' | 'EN';
                  setLanguage(newLang);
                  window.dispatchEvent(
                    new CustomEvent('lis-global-toast', {
                      detail: {
                        message: newLang === 'ES' ? '🇪🇸 Idioma cambiado a Español.' : '🇺🇸 Language switched to English.',
                        type: 'info',
                        duration: 3000
                      }
                    })
                  );
                }}
                className="bg-transparent text-slate-200 font-mono text-[11px] font-bold focus:outline-none cursor-pointer"
              >
                <option value="ES" className="bg-slate-900 text-white">🇵🇦 ES</option>
                <option value="EN" className="bg-slate-900 text-white">🇺🇸 EN</option>
              </select>
            </div>
          </div>

          {/* Group 2: Executive Clinical Identity & Security Station */}
          <div className="flex items-center bg-slate-900/70 border border-white/[0.08] hover:border-cyan-500/30 rounded-xl p-1 gap-1 shadow-sm backdrop-blur-md transition-colors">
            
            {/* User Info (Click opens branch selector) */}
            <button
              onClick={onOpenBranchModal}
              title={`${rawUserName} • ${getBranchName(currentBranch?.name, language)} (${language === 'EN' ? 'Click to change branch' : 'Clic para cambiar sede'})`}
              className="flex items-center gap-2 px-2 py-0.5 rounded-lg hover:bg-white/[0.04] transition-colors text-left cursor-pointer"
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 text-white font-bold text-[11px] flex items-center justify-center shadow-sm shrink-0 border border-white/20">
                {userInitials}
              </div>
              <div className="hidden md:flex flex-col min-w-0 max-w-[120px] xl:max-w-[150px]">
                <span className="text-xs font-semibold text-slate-100 truncate leading-tight" title={cleanUserName}>
                  {cleanUserName}
                </span>
                <span className="text-[10px] text-cyan-400/90 font-medium truncate leading-tight mt-0.5">
                  {getBranchName(currentBranch?.name, language)}
                </span>
              </div>
            </button>

            {/* Separador vertical sutil */}
            <div className="h-4 w-px bg-white/[0.08] mx-0.5" />

            {/* Lock Session Button */}
            {onLockSession && (
              <button
                onClick={onLockSession}
                title={language === 'EN' ? "Lock Station" : "Bloquear Estación"}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-amber-300 hover:bg-amber-500/10 transition-colors cursor-pointer shrink-0"
              >
                <Lock className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Logout Button */}
            <button
              onClick={logout}
              title={language === 'EN' ? "Sign Out" : "Cerrar Sesión"}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </header>

      {/* Senior Enterprise Viewport-Centered Mega Console & Mobile Sheet */}
      {isMenuOpen && (
        <>
          {/* Opaque Dark Backdrop Overlay */}
          <div
            className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200"
            onClick={() => setActiveCategoryMenu(null)}
          />

          {/* Modal / Mobile Drawer Container */}
          <div className="fixed inset-0 sm:inset-auto sm:top-18 sm:left-1/2 sm:-translate-x-1/2 sm:w-[min(1060px,94vw)] sm:max-h-[82vh] bg-[#020817] sm:border-2 sm:border-cyan-500/40 sm:rounded-3xl p-3.5 sm:p-5 shadow-[0_25px_90px_rgba(0,0,0,0.98)] ring-1 ring-cyan-500/30 z-50 flex flex-col space-y-3 animate-in fade-in sm:zoom-in-95 duration-200">

            {/* Top Toolbar inside Mega Console */}
            <div className="bg-[#030b26] p-3 sm:p-3.5 rounded-2xl border border-cyan-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-inner">

              {/* Category Title & Badge */}
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 border border-cyan-400/40 text-cyan-300 shadow-md">
                  <Grid className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <span>
                      {activeCategoryMenu === 'all'
                        ? (language === 'EN' ? 'LIS-CORE Unified Clinical Catalog' : 'Catálogo Clínico Unificado LIS-CORE')
                        : `${language === 'EN' ? 'Suite' : 'Suite'} ${DOMAIN_CATEGORIES.find(c => c.id === activeCategoryMenu)?.label || (language === 'EN' ? 'Specialized' : 'Especializada')}`}
                    </span>
                    <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 px-2 py-0.2 rounded-full text-[9.5px] font-mono font-bold">
                      {filteredModules.length} {language === 'EN' ? 'Modules' : 'Módulos'}
                    </span>
                  </h3>
                  <p className="text-[9.5px] text-slate-400 font-medium">
                    {language === 'EN'
                      ? 'Direct access to hospital, analytical and administrative modules'
                      : 'Acceso directo a módulos hospitalarios, analíticos y administrativos'}
                  </p>
                </div>
              </div>

              {/* Instant Search Bar & Close Button */}
              <div className="flex items-center gap-2 flex-1 sm:max-w-xs ml-auto w-full sm:w-auto">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-cyan-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={language === 'EN' ? 'Search module (e.g. HIL, Panics, EHR)...' : 'Buscar módulo (ej. HIL, Pánicos, EHR)...'}
                    className="w-full bg-[#010514] border border-cyan-500/40 rounded-full pl-8 pr-7 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 shadow-inner"
                    autoFocus
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <button
                  onClick={() => setActiveCategoryMenu(null)}
                  className="w-8 h-8 rounded-full bg-slate-900 border border-slate-700 text-slate-400 hover:text-white hover:border-cyan-400 flex items-center justify-center shrink-0 cursor-pointer"
                  title={language === 'EN' ? 'Close (Esc)' : 'Cerrar (Esc)'}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Category Filter Pills Bar */}
            <div className="bg-[#010514] p-1.5 rounded-xl border border-white/10 flex items-center gap-1.5 overflow-x-auto no-scrollbar shadow-inner shrink-0">
              <button
                onClick={() => setActiveCategoryMenu('all')}
                className={`px-3 py-1 rounded-lg text-[10.5px] font-black uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer ${
                  activeCategoryMenu === 'all'
                    ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-black shadow-md shadow-cyan-500/30'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {language === 'EN' ? `All (${visibleTabs.length})` : `Todos (${visibleTabs.length})`}
              </button>

              {DOMAIN_CATEGORIES.map((cat) => {
                const CatIcon = cat.icon;
                const isSelected = activeCategoryMenu === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategoryMenu(cat.id)}
                    className={`px-2.5 sm:px-3 py-1 rounded-lg text-[10.5px] font-bold uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer flex items-center space-x-1.5 ${
                      isSelected
                        ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-black shadow-md shadow-cyan-500/30'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    <CatIcon className={`w-3 h-3 ${isSelected ? 'text-slate-950' : 'text-cyan-400'}`} />
                    <span>{cat.label}</span>
                    <span className={`text-[9.5px] font-mono px-1 rounded-full ${isSelected ? 'bg-slate-950/20 text-slate-950' : 'bg-cyan-500/20 text-cyan-300'}`}>
                      {cat.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Responsive Module Grid (High density, cards never cut off) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 overflow-y-auto max-h-[calc(100vh-210px)] sm:max-h-[52vh] p-1 pb-4 no-scrollbar">
              {filteredModules.length === 0 ? (
                <div className="col-span-full py-12 text-center space-y-2">
                  <Search className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-xs font-bold text-slate-400">
                    {language === 'EN'
                      ? `No modules found matching "${searchQuery}"`
                      : `No se encontraron módulos con "${searchQuery}"`}
                  </p>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-[11px] text-cyan-400 underline font-bold cursor-pointer"
                  >
                    {language === 'EN' ? 'Clear search' : 'Limpiar búsqueda'}
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
                      className={`p-2.5 sm:p-3 rounded-xl border transition-all text-left cursor-pointer group flex flex-col justify-between space-y-1.5 ${style.card}`}
                    >
                      <div className="flex items-start space-x-2.5">
                        <div className={`p-2 rounded-lg shrink-0 ${style.iconBg} group-hover:scale-105 transition-transform`}>
                          <SubIcon className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1 mb-0.5">
                            <h4 className="text-xs font-extrabold leading-tight truncate">{getTabLabel(tab)}</h4>
                            {!isSubActive && style.label && (
                              <span className={`text-[7.5px] font-mono font-bold px-1.5 py-0.2 rounded-full uppercase shrink-0 ${style.badge}`}>
                                {style.label}
                              </span>
                            )}
                          </div>
                          {tab.desc && (
                            <p className={`text-[9.5px] line-clamp-1 leading-snug font-medium ${isSubActive ? 'text-slate-900 font-bold' : 'text-slate-400 group-hover:text-slate-200'}`}>
                              {getTabDescription(tab.id, tab.desc, language)}
                            </p>
                          )}
                        </div>
                      </div>

                      {tab.example && (
                        <span className={`text-[8.5px] font-mono font-bold tracking-tight truncate px-1.5 py-0.2 rounded self-start ${isSubActive ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-950/80 text-amber-300 border border-amber-500/20'}`}>
                          {getTabExample(tab.id, tab.example, language)}
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

      {/* Modal Interactivo de Salud y Telemetría de Servidores AbregoTech */}
      <ServerInfrastructureModal
        isOpen={isServerHealthModalOpen}
        onClose={() => setIsServerHealthModalOpen(false)}
      />

      {/* 📱 Native Mobile Bottom Navigation Bar (< lg, Thumb-friendly, iOS/Android ergonomics) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#02071a]/95 backdrop-blur-2xl border-t border-cyan-500/20 px-2 py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] shadow-[0_-8px_30px_rgba(0,0,0,0.9)] flex items-center justify-around select-none">
        {/* Tab 1: Inicio / Dashboard */}
        <button
          onClick={() => { setActiveTab('dashboard'); setActiveCategoryMenu(null); }}
          className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all cursor-pointer active:scale-95 ${
            activeTab === 'dashboard' && !isMenuOpen
              ? 'text-cyan-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className={`p-1.5 rounded-xl transition-all ${activeTab === 'dashboard' && !isMenuOpen ? 'bg-cyan-500/20 text-cyan-400 shadow-[0_0_12px_rgba(0,240,255,0.4)] ring-1 ring-cyan-400/40' : 'text-slate-400'}`}>
            <LayoutDashboard className="w-4 h-4" />
          </div>
          <span className={`text-[9px] uppercase tracking-wider mt-0.5 ${activeTab === 'dashboard' && !isMenuOpen ? 'font-black text-cyan-400' : 'font-bold text-slate-400'}`}>
            {language === 'EN' ? 'Home' : 'Inicio'}
          </span>
        </button>

        {/* Tab 2: LIS (Laboratorio) */}
        <button
          onClick={() => { setActiveTab('dashboard'); setActiveCategoryMenu(null); }}
          className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all cursor-pointer active:scale-95 ${
            visibleTabs.some(t => t.category === 'lis' && t.id === activeTab) && !isMenuOpen
              ? 'text-cyan-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className={`p-1.5 rounded-xl transition-all ${visibleTabs.some(t => t.category === 'lis' && t.id === activeTab) && !isMenuOpen ? 'bg-cyan-500/20 text-cyan-400 shadow-[0_0_12px_rgba(0,240,255,0.4)] ring-1 ring-cyan-400/40' : 'text-slate-400'}`}>
            <Microscope className="w-4 h-4" />
          </div>
          <span className={`text-[9px] uppercase tracking-wider mt-0.5 ${visibleTabs.some(t => t.category === 'lis' && t.id === activeTab) && !isMenuOpen ? 'font-black text-cyan-400' : 'font-bold text-slate-400'}`}>
            LIS
          </span>
        </button>

        {/* Tab 3: HIS (Hospital) */}
        <button
          onClick={() => { setActiveTab('his_command'); setActiveCategoryMenu(null); }}
          className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all cursor-pointer active:scale-95 ${
            visibleTabs.some(t => t.category === 'his' && t.id === activeTab) && !isMenuOpen
              ? 'text-indigo-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className={`p-1.5 rounded-xl transition-all ${visibleTabs.some(t => t.category === 'his' && t.id === activeTab) && !isMenuOpen ? 'bg-indigo-500/20 text-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.4)] ring-1 ring-indigo-400/40' : 'text-slate-400'}`}>
            <Activity className="w-4 h-4" />
          </div>
          <span className={`text-[9px] uppercase tracking-wider mt-0.5 ${visibleTabs.some(t => t.category === 'his' && t.id === activeTab) && !isMenuOpen ? 'font-black text-indigo-400' : 'font-bold text-slate-400'}`}>
            HIS
          </span>
        </button>

        {/* Tab 4: Banco (Sangre) */}
        <button
          onClick={() => { setActiveTab('bloodbank'); setActiveCategoryMenu(null); }}
          className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all cursor-pointer active:scale-95 ${
            visibleTabs.some(t => t.category === 'bloodbank' && t.id === activeTab) && !isMenuOpen
              ? 'text-rose-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className={`p-1.5 rounded-xl transition-all ${visibleTabs.some(t => t.category === 'bloodbank' && t.id === activeTab) && !isMenuOpen ? 'bg-rose-500/20 text-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.4)] ring-1 ring-rose-400/40' : 'text-slate-400'}`}>
            <Droplets className="w-4 h-4" />
          </div>
          <span className={`text-[9px] uppercase tracking-wider mt-0.5 ${visibleTabs.some(t => t.category === 'bloodbank' && t.id === activeTab) && !isMenuOpen ? 'font-black text-rose-400' : 'font-bold text-slate-400'}`}>
            {language === 'EN' ? 'Blood' : 'Banco'}
          </span>
        </button>

        {/* Tab 5: Módulos Clínicos (Catálogo Completo) */}
        <button
          onClick={() => {
            setSearchQuery('');
            setActiveCategoryMenu(isMenuOpen ? null : 'all');
          }}
          className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all cursor-pointer active:scale-95 ${
            isMenuOpen
              ? 'text-cyan-300'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className={`p-1.5 rounded-xl transition-all ${isMenuOpen ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 shadow-[0_0_15px_rgba(0,240,255,0.6)]' : 'bg-white/5 text-cyan-400 border border-cyan-500/30'}`}>
            <Grid className={`w-4 h-4 ${isMenuOpen ? 'text-slate-950' : 'text-cyan-400'}`} />
          </div>
          <span className={`text-[9px] uppercase tracking-wider mt-0.5 ${isMenuOpen ? 'font-black text-cyan-300' : 'font-bold text-slate-400'}`}>
            {language === 'EN' ? 'Modules' : 'Módulos'}
          </span>
        </button>
      </div>
    </>
  );
};
