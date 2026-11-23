import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Patient, Order, TestCatalogItem, TestResult, PatientImmediateNotificationRecord, NotificationLogItem, Specimen } from '../../types';
import {
  UserPlus, Search, ShieldCheck, FileText, Plus, CheckCircle2,
  DollarSign, AlertCircle, QrCode, Printer, User, Heart,
  MapPin, Phone, CreditCard, ClipboardList, Clock, X, Calendar,
  Stethoscope, Baby, Zap, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Barcode, Receipt, ArrowRight,
  TrendingUp, Activity, UserSearch, Hash, Scale, Ruler, Shield, Filter, SlidersHorizontal,
  Fingerprint, Info, Smartphone, Globe, BriefcaseMedical, Microscope, Beaker, Droplets, Timer,
  Users, Volume2, Settings2, Sliders, Check, Copy, RotateCw, Sparkles, FileCode, Tag,
  AlertTriangle, Flame, BellRing, PhoneCall, MessageSquare, Send, ShieldAlert,
  Share2, UserCheck, History, ExternalLink, Flag, Camera, Pencil,
  Award, RotateCcw, CheckSquare, Keyboard, BarChart3
} from 'lucide-react';
import { QuickScanCameraModal } from '../Phase6Suite/QuickScanCameraModal';
import { ReceptionTurnManagement, parseFullName } from './ReceptionTurnManagement';
import { turnService, QueueTicket, ReceptionCounter } from '../../utils/turnService';
import { printerService, ThermalPrinterDevice, SpecimenTubeLabel } from '../../utils/printerService';
import { SpecimenTubeLabelCard } from '../SpecimenTubeLabelCard';
import { CriticalNotificationModal } from './CriticalNotificationModal';
import { MOCK_RESULTS } from '../../data/mockData';
import { INSTITUTIONAL_HIS_DOCTORS, InstitutionalDoctor } from '../../data/institutionalDoctors';
import { SupabaseService } from '../../services/SupabaseService';
import { notifyToast } from '../../utils/toastNotification';
import { getTimeBasedGreeting, formatGreetingUserName } from '../../utils/greeting';
import { useLisStore } from '../../store/useLisStore';
import { ImageCompressor } from '../../utils/imageCompressor';
import { formatOrderNumber, generateOrderNumber, generateSampleBarcode } from '../../utils/orderUtils';
import { printDocument, buildPrintFileName } from '../../utils/printDocument';

interface ReceptionDashboardProps {
  patients: Patient[];
  testCatalog: TestCatalogItem[];
  orders: Order[];
  results?: TestResult[];
  onCreateOrder: (newOrder: Order, newPatient?: Patient) => void;
  onOpenPdf: (orderId: string) => void;
}


export const CHRONIC_ALERT_OPTIONS = [
  { id: 'DIABETICO', label: 'Diabético', icon: '🩸', color: 'text-amber-300 border-amber-500/40 bg-amber-500/10' },
  { id: 'HIPERTENSO', label: 'Hipertenso', icon: '❤️', color: 'text-rose-300 border-rose-500/40 bg-rose-500/10' },
  { id: 'ANTICOAGULADO', label: 'Anticoagulado', icon: '⚠️', color: 'text-purple-300 border-purple-500/40 bg-purple-500/10' },
  { id: 'ALERGIA_PENICILINA', label: 'Alergia Penicilina', icon: '🚫', color: 'text-red-300 border-red-500/40 bg-red-500/10' },
  { id: 'ALERGIA_LATEX', label: 'Alergia Látex', icon: '🧤', color: 'text-orange-300 border-orange-500/40 bg-orange-500/10' },
  { id: 'DIFICIL_ACCESO_VENOSO', label: 'Difícil Acceso Venoso', icon: '💉', color: 'text-cyan-300 border-cyan-500/40 bg-cyan-500/10' }
];

export const PANAMA_DISTRICTS_CORREGIMIENTOS: Record<string, string[]> = {
  'Panamá': [
    'San Francisco',
    'Bella Vista',
    'Betania',
    'Ancón',
    'Juan Díaz',
    'Parque Lefevre',
    'Pueblo Nuevo',
    'Calidonia',
    'Santa Ana',
    'San Felipe',
    'El Chorrillo',
    'Curundú',
    'Río Abajo',
    'Don Bosco',
    'Tocumen',
    'Las Mañanitas',
    '24 de Diciembre',
    'Pacora',
    'Pedregal',
    'San Martín',
    'Chilibre',
    'Alcalde Díaz',
    'Las Cumbres',
    'Ernesto Córdoba Campos',
    'Caimitillo',
    'Las Garzas'
  ],
  'San Miguelito': [
    'José Domingo Espinar',
    'Rufina Alfaro',
    'Amelia Denis de Icaza',
    'Belisario Porras',
    'Belisario Frías',
    'Mateo Iturralde',
    'Victoriano Lorenzo',
    'Arnulfo Arias',
    'Omar Torrijos'
  ],
  'Colón': [
    'Barrio Norte',
    'Barrio Sur',
    'Cristóbal',
    'Cristóbal Este',
    'Cativá',
    'Sabanitas',
    'Buena Vista',
    'Limón',
    'Nueva Providencia',
    'San Juan',
    'Santa Rosa',
    'Salamanca',
    'Ciricito',
    'Escobal'
  ],
  'Arraiján': [
    'Arraiján Cabecera',
    'Burunga',
    'Cerro Silvestre',
    'Juan Demóstenes Arosemena',
    'Nuevo Emperador',
    'San Vicente de Bique',
    'Santa Clara',
    'Veracruz',
    'Vista Alegre'
  ],
  'La Chorrera': [
    'Barrio Balboa',
    'Barrio Colón',
    'Guadalupe',
    'Playa Leona',
    'Puerto Caimito',
    'El Coco',
    'Feuillet',
    'Herrera',
    'Hurtado',
    'Iturralde',
    'La Represa',
    'Los Díaz',
    'Mendoza',
    'Obaldía',
    'Santa Rita',
    'Amador'
  ],
  'David (Chiriquí)': [
    'David Cabecera',
    'David Este',
    'David Sur',
    'Las Lomas',
    'Pedregal',
    'San Carlos',
    'Chiriquí',
    'Cochea',
    'Guacá',
    'Bijagual',
    'San Pablo Nuevo',
    'San Pablo Viejo'
  ],
  'Chitré (Herrera)': [
    'Chitré Cabecera',
    'La Arena',
    'Monagrillo',
    'Llano Bonito',
    'San Juan Bautista'
  ],
  'Santiago (Veraguas)': [
    'Santiago Cabecera',
    'Canto del Llano',
    'San Martín de Porres',
    'La Peña',
    'Ponuga',
    'Carlos Santana Ávila',
    'Edwin Fábrega',
    'San Pedro del Espino',
    'Los Algarrobos',
    'Rodrigo Luque'
  ],
  'Penonomé (Coclé)': [
    'Penonomé Cabecera',
    'Cañaveral',
    'Coclé',
    'Chigoré',
    'El Coco',
    'Pajonal',
    'Río Grande',
    'Río Indio',
    'Toabré',
    'Tulú',
    'Victoriano Lorenzo'
  ],
  'Aguadulce (Coclé)': [
    'Aguadulce Cabecera',
    'El Cristo',
    'El Roble',
    'Pocrí',
    'Barrios Unidos'
  ],
  'Boquete (Chiriquí)': [
    'Bajo Boquete',
    'Caldera',
    'Palmira',
    'Alto Boquete',
    'Jaramillo',
    'Los Naranjos'
  ],
  'Bugaba (Chiriquí)': [
    'La Concepción',
    'Asunción',
    'Bugaba',
    'Gómez',
    'San Andrés',
    'Santa Marta',
    'Santa Rosa',
    'Santo Domingo',
    'Sortová'
  ],
  'Las Tablas (Los Santos)': [
    'Las Tablas Cabecera',
    'La Laja',
    'El Cocal',
    'San José',
    'San Miguel',
    'Santo Domingo',
    'El Carate',
    'Sesteadero'
  ],
  'Changuinola (Bocas del Toro)': [
    'Changuinola Cabecera',
    'Almirante',
    'Guabito',
    'El Empalme',
    'Las Tablas',
    'Finca 30',
    'Finca 6'
  ],
  'Chepo': [
    'Chepo Cabecera',
    'Cañita',
    'Chepillo',
    'El Llano',
    'Las Margaritas',
    'Santa Cruz de Chinina',
    'Tortí'
  ],
  'Capira': [
    'Capira Cabecera',
    'Caimito',
    'Campana',
    'Cermeño',
    'Lídice',
    'Villa Carmen',
    'Villa Rosario'
  ],
  'Chame': [
    'Chame Cabecera',
    'Bejuco',
    'Buenos Aires',
    'Cabuya',
    'Chicá',
    'El Líbano',
    'Las Lajas',
    'Nueva Gorgona',
    'Punta Chame',
    'Sajalices',
    'Sorá'
  ],
  'San Carlos': [
    'San Carlos Cabecera',
    'El Espino',
    'El Higo',
    'Guayabito',
    'La Ermita',
    'La Laguna',
    'Las Uvas',
    'Los Llanitos',
    'San José'
  ],
  'La Palma (Darién)': [
    'La Palma Cabecera',
    'Camogantí',
    'Chepigana',
    'Garachiné',
    'Jaqué',
    'Puerto Piña',
    'Río Iglesias',
    'Sambú',
    'Setegantí',
    'Taimatí',
    'Tucutí'
  ]
};

export const EMPTY_PATIENT_DATA = {
  firstName: '',
  secondName: '',
  lastName: '',
  secondLastName: '',
  nationalId: '',
  gender: 'M' as 'M' | 'F',
  dob: '',
  phone: '',
  email: '',
  address: '',
  district: 'Panamá',
  corregimiento: 'San Francisco',
  isPregnant: false,
  gestationalWeeks: '',
  clinicalNotes: '',
  weight: '',
  height: '',
  bloodType: 'O+',
  emergencyContact: '',
  insuranceProvider: 'CSS Panamá',
  doctorId: 'doc-001',
  attendingDoctor: 'Dr. Fernando Arosemena Boyd',
  doctorSpecialty: 'Medicina General',
  doctorLicense: 'M-9812-MINSA',
  isExternalDoctor: false,
  patientOrigin: 'Consulta Externa',
  orderService: 'Laboratorio Clínico',
  subService: 'Ventanilla 1',
  benefitType: 'Particular (100%)',
  clinicalComments: '',
  chronicConditions: [] as string[],
  nationality: 'Panameña'
};

export const ReceptionDashboard: React.FC<ReceptionDashboardProps> = ({
  patients,
  testCatalog,
  orders,
  results = MOCK_RESULTS,
  onCreateOrder,
  onOpenPdf
}) => {
  const language = useLisStore((state) => state.language);
  const currentUser = useLisStore((state) => state.currentUser);
  const currentBranch = useLisStore((state) => state.currentBranch);
  const isEn = language === 'EN';

  const [activeSubTab, setActiveSubTab] = useState<'ADMISSION' | 'TURNS' | 'MANAGEMENT' | 'PRINT' | 'PRINTERS'>('ADMISSION');
  const [activeCategory, setActiveCategory] = useState<string>('HEMATOLOGIA');

  // Turn Queue integration state
  const [activeAttendingTurnId, setActiveAttendingTurnId] = useState<string | null>(null);
  const [activeAttendingTicketNumber, setActiveAttendingTicketNumber] = useState<string | null>(null);
  const [activeAttendingPatientName, setActiveAttendingPatientName] = useState<string | null>(null);
  const [printStatusFilter, setPrintStatusFilter] = useState<'ALL' | 'READY' | 'PENDING' | 'PANIC'>('ALL');

  // Printer Management state
  const [autoPrintEnabled, setAutoPrintEnabled] = useState<boolean>(printerService.getAutoPrintEnabled());
  const [printersList, setPrintersList] = useState<ThermalPrinterDevice[]>(printerService.getPrinters());
  const [selectedDefaultPrinterId, setSelectedDefaultPrinterId] = useState<string>(printerService.getDefaultPrinter().id);
  const [isPrinterFormOpen, setIsPrinterFormOpen] = useState<boolean>(false);
  const [editingPrinterId, setEditingPrinterId] = useState<string | null>(null);
  const [printerFormData, setPrinterFormData] = useState<{
    name: string;
    model: string;
    connectionType: ThermalPrinterDevice['connectionType'];
    ipAddress: string;
    port: string;
    location: string;
    branch: string;
    dpi: 203 | 300;
    emulation: ThermalPrinterDevice['emulation'];
    labelWidthMm: string;
    labelHeightMm: string;
    isDefault: boolean;
  }>({
    name: '',
    model: 'Zebra ZD421 Direct Thermal',
    connectionType: 'NETWORK_TCP_9100',
    ipAddress: '',
    port: '9100',
    location: 'Recepción / Flebotomía',
    branch: 'Sede Vía España',
    dpi: 203,
    emulation: 'ZPL',
    labelWidthMm: '50',
    labelHeightMm: '25',
    isDefault: true
  });
  const [lastAutoPrintStatus, setLastAutoPrintStatus] = useState<{
    printerName: string;
    labelsCount: number;
    labels: SpecimenTubeLabel[];
    timestamp: string;
  } | null>(null);
  const [isZplPreviewOpen, setIsZplPreviewOpen] = useState<boolean>(false);
  const [selectedLabelForZpl, setSelectedLabelForZpl] = useState<SpecimenTubeLabel | null>(null);
  const [orderForLabelReprint, setOrderForLabelReprint] = useState<{ order: Order; labels: SpecimenTubeLabel[]; } | null>(null);

  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [testSearchTerm, setTestSearchTerm] = useState('');
  const [foundPatient, setFoundPatient] = useState<Patient | null>(null);
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const [managementSearchTerm, setManagementSearchTerm] = useState('');

  // Critical Alerts & Immediate Notification State
  const [criticalFilter, setCriticalFilter] = useState<'ALL' | 'CRITICAL_ONLY' | 'PENDING' | 'NOTIFIED'>('ALL');
  const [selectedOrderForCriticalModal, setSelectedOrderForCriticalModal] = useState<Order | null>(null);
  const [criticalNotifications, setCriticalNotifications] = useState<Record<string, PatientImmediateNotificationRecord>>({
    'ord-1002': {
      orderId: 'ord-1002',
      orderNumber: '202600102',
      patientId: 'pat-002',
      patientName: 'Ricardo Arosemena Boyd',
      patientNationalId: '8-741-2099',
      patientPhone: '+507 6554-1122',
      doctorName: 'Dra. Carmen Boyd (Endocrinología)',
      flaggedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      flaggedBy: 'Sistema Middleware (Auto-Alerta Pánico)',
      urgencyLevel: 'CRITICO_PANICO',
      status: 'PENDIENTE',
      criticalReason: 'Glucosa en Ayunas: 340 mg/dL [CRÍTICO ALTO - PÁNICO]',
      criticalParameters: [
        { parameterName: 'Glucosa en Ayunas', value: '340', unit: 'mg/dL', refRangeText: '70 - 99', flag: 'CRITICO_ALTO', specimenType: 'Suero' }
      ],
      history: [
        {
          id: 'log-1',
          timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
          action: 'Intento de Contacto Telefónico (No Contesta)',
          user: 'Recepcionista (Ventanilla 1)',
          channel: 'TELEFONO',
          recipientType: 'MEDICO_TRATANTE',
          recipientName: 'Dra. Carmen Boyd',
          recipientContact: '+507 6554-1122',
          outcome: 'Llamada no contestada; programado reintento inmediato.',
          notes: 'Se intentó llamar a consultorio.'
        }
      ]
    },
    'ord-1007': {
      orderId: 'ord-1007',
      orderNumber: '202600107',
      patientId: 'pat-007',
      patientName: 'Alejandro Mendoza Silva',
      patientNationalId: 'PE-982103',
      patientPhone: '+507 6443-8811',
      doctorName: 'Dr. Jorge Mendoza (Salud Ocupacional)',
      flaggedAt: new Date(Date.now() - 75 * 60 * 1000).toISOString(),
      flaggedBy: 'Recepcionista (Admisión URGENCIA)',
      urgencyLevel: 'ALTA_PRIORIDAD',
      status: 'NOTIFICADO',
      criticalReason: 'Orden URGENCIA prioritaria de urgencia con panel completo.',
      criticalParameters: [
        { parameterName: 'Prioridad de Servicio', value: 'URGENTE', unit: 'MinSA', refRangeText: 'Rutina', flag: 'ALTO', specimenType: 'Sangre Total' }
      ],
      history: [
        {
          id: 'log-2',
          timestamp: new Date(Date.now() - 50 * 60 * 1000).toISOString(),
          action: 'Notificación Inmediata Exitosa',
          user: 'Recepcionista (Ventanilla 1)',
          channel: 'TELEFONO',
          recipientType: 'MEDICO_TRATANTE',
          recipientName: 'Dr. Jorge Mendoza',
          recipientContact: '+507 6443-8811',
          outcome: 'Médico confirma recepción y conducta clínica.',
          notes: 'Médico enterado del reporte.'
        }
      ],
      notifiedAt: new Date(Date.now() - 50 * 60 * 1000).toISOString(),
      notifiedBy: 'Recepcionista (Ventanilla 1)',
      channel: 'TELEFONO',
      recipientType: 'MEDICO_TRATANTE',
      recipientName: 'Dr. Jorge Mendoza',
      recipientContact: '+507 6443-8811',
      outcome: 'Médico confirma recepción y conducta clínica.'
    }
  });

  const [isRegistering, setIsRegistering] = useState(false);
  const [isCedulaQrModalOpen, setIsCedulaQrModalOpen] = useState(false);
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false);
  const [cedulaQrRawInput, setCedulaQrRawInput] = useState('8-897-180|Ruben Eliecer|Abrego Castillo||M|PANAMÁ|19950724|PANAMEÑA|20230921|20380921|A01382541');

  const patientSearchInputRef = useRef<HTMLInputElement>(null);
  const testSearchInputRef = useRef<HTMLInputElement>(null);
  const [col2SubTab, setCol2SubTab] = useState<'CATALOG' | 'PREANALYTICS'>('CATALOG');
  const [preanalyticalChecks, setPreanalyticalChecks] = useState<Record<string, boolean>>({
    fasting: true,
    urine: false,
    citrate: false,
    thyroid: false,
    edta: true
  });

  const [newPatientData, setNewPatientData] = useState({ ...EMPTY_PATIENT_DATA });
  const [isCreatingNewOrderForPatient, setIsCreatingNewOrderForPatient] = useState(false);

  // 🩺 Hybrid HIS / External Doctor Dropdown State
  const [isDoctorDropdownOpen, setIsDoctorDropdownOpen] = useState(false);
  const doctorDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (doctorDropdownRef.current && !doctorDropdownRef.current.contains(e.target as Node)) {
        setIsDoctorDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredInstitutionalDoctors = useMemo(() => {
    const query = (newPatientData.attendingDoctor || '').toLowerCase().trim();
    if (!query) return INSTITUTIONAL_HIS_DOCTORS;
    return INSTITUTIONAL_HIS_DOCTORS.filter(doc =>
      doc.name.toLowerCase().includes(query) ||
      doc.specialty.toLowerCase().includes(query) ||
      doc.licenseNumber.toLowerCase().includes(query) ||
      doc.institution.toLowerCase().includes(query)
    );
  }, [newPatientData.attendingDoctor]);

  const matchedInstitutionalDoctor = useMemo(() => {
    return INSTITUTIONAL_HIS_DOCTORS.find(
      doc => doc.name.toLowerCase().trim() === (newPatientData.attendingDoctor || '').toLowerCase().trim()
    );
  }, [newPatientData.attendingDoctor]);

  // ✏️ Order & Clinical Comprehensive In-Place Correction Modal
  const [orderToEdit, setOrderToEdit] = useState<Order | null>(null);
  const [editOrderPatientName, setEditOrderPatientName] = useState('');
  const [editOrderPatientCedula, setEditOrderPatientCedula] = useState('');
  const [editOrderPatientPhone, setEditOrderPatientPhone] = useState('');
  const [editOrderPatientGender, setEditOrderPatientGender] = useState<'M' | 'F'>('M');
  const [editOrderPatientAge, setEditOrderPatientAge] = useState<number>(30);
  const [editOrderDoctorName, setEditOrderDoctorName] = useState('');
  const [editOrderDoctorLicense, setEditOrderDoctorLicense] = useState('');
  const [editOrderPriority, setEditOrderPriority] = useState<'RUTINA' | 'URGENCIA' | 'PRIORITARIA'>('RUTINA');
  const [editOrderServiceOrigin, setEditOrderServiceOrigin] = useState('Consulta Externa');
  const [editOrderInsurance, setEditOrderInsurance] = useState('Particular (100%)');
  const [editOrderPaymentStatus, setEditOrderPaymentStatus] = useState<'PAGADO' | 'PENDIENTE' | 'ASEGURADORA'>('PAGADO');
  const [editOrderClinicalComments, setEditOrderClinicalComments] = useState('');
  const [editOrderTestIds, setEditOrderTestIds] = useState<string[]>([]);
  const [editTestSearchQuery, setEditTestSearchQuery] = useState('');

  const editCalculatedTotal = useMemo(() => {
    return testCatalog
      .filter(t => editOrderTestIds.includes(t.id))
      .reduce((sum, t) => sum + (t.price || 0), 0);
  }, [editOrderTestIds, testCatalog]);

  const editRequiredTubeTypes = useMemo(() => {
    const selected = testCatalog.filter(t => editOrderTestIds.includes(t.id));
    return Array.from(new Set(selected.map(t => (t.tubeType || 'EDTA_MORADO') as string)));
  }, [editOrderTestIds, testCatalog]);

  const handleOpenOrderCorrectionModal = (order: Order) => {
    setOrderToEdit(order);
    setEditOrderPatientName(order.patientName || '');
    setEditOrderPatientCedula(order.patientNationalId || '');
    const linkedPatient = patients.find(p => p.id === order.patientId);
    setEditOrderPatientPhone(order.patientPhone || linkedPatient?.phone || '');
    setEditOrderPatientGender((order.patientGender as any) || linkedPatient?.gender || 'M');
    setEditOrderPatientAge(order.patientAge || (linkedPatient?.dob ? calculateAge(linkedPatient.dob) : 30));
    setEditOrderDoctorName(order.doctorName || 'Dr. Fernando Arosemena Boyd');
    setEditOrderDoctorLicense(order.doctorLicense || 'M-9812-MINSA');
    setEditOrderPriority((order.priority as any) || 'RUTINA');
    setEditOrderServiceOrigin(order.serviceOrigin || 'Consulta Externa');
    setEditOrderInsurance(order.insuranceName || 'Particular (100%)');
    setEditOrderPaymentStatus((order.paymentStatus as any) || 'PAGADO');
    setEditOrderClinicalComments(order.clinicalComments || '');
    setEditOrderTestIds(order.testIds && order.testIds.length > 0 ? [...order.testIds] : []);
    setEditTestSearchQuery('');
  };

  const handleSaveOrderCorrection = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!orderToEdit) return;

    const trimmedName = editOrderPatientName.trim();
    const trimmedCedula = editOrderPatientCedula.trim();
    const trimmedPhone = editOrderPatientPhone.trim();
    const trimmedDoctor = editOrderDoctorName.trim();

    if (!trimmedName || !trimmedCedula) {
      notifyToast('Nombre y Cédula son obligatorios para la orden clínica.', 'warning');
      return;
    }

    if (editOrderTestIds.length === 0) {
      notifyToast('La orden debe contener al menos un análisis clínico.', 'warning');
      return;
    }

    const selectedTests = testCatalog.filter(t => editOrderTestIds.includes(t.id));
    const newTotalAmount = selectedTests.reduce((sum, t) => sum + (t.price || 0), 0);
    const requiredTubeTypes: string[] = Array.from(new Set(selectedTests.map(t => (t.tubeType || 'EDTA_MORADO') as string)));
    const updatedSpecimens: Specimen[] = (requiredTubeTypes.length > 0 ? requiredTubeTypes : ['EDTA_MORADO']).map((tube, idx) => ({
      id: `sp-${orderToEdit.id}-${idx + 1}`,
      orderId: orderToEdit.id,
      barcode: generateSampleBarcode(orderToEdit.orderNumber, idx + 1),
      tubeType: tube,
      status: 'PENDIENTE',
      collectedAt: new Date().toISOString(),
      phlebotomyTime: new Date().toISOString(),
      sampleVolumeMl: tube === 'ORINA' ? 30 : tube === 'HECES' ? 10 : 4.0,
      temperatureCondition: tube === 'HEPARINA_VERDE' ? 'BANO_HIELO' : 'AMBIENTE_20_25',
      isSeparated: tube === 'SUERO_ROJO'
    }));

    // Sincronización de analitos pendientes en caso de que se hayan agregado o removido pruebas
    const oldTestIds = new Set(orderToEdit.testIds || []);
    const newTestIds = new Set(editOrderTestIds);
    const removedTestIds = (orderToEdit.testIds || []).filter(id => !newTestIds.has(id));
    const addedTestIds = editOrderTestIds.filter(id => !oldTestIds.has(id));

    if (removedTestIds.length > 0) {
      useLisStore.getState().setResults(prev => prev.filter(r => !(r.orderId === orderToEdit.id && removedTestIds.includes(r.testId) && r.status === 'PENDIENTE')));
    }

    if (addedTestIds.length > 0) {
      const currentResults = useLisStore.getState().results;
      const existingParamIds = new Set(currentResults.filter(r => r.orderId === orderToEdit.id).map(r => r.parameterId));
      const newAutoResults: TestResult[] = [];

      addedTestIds.forEach(tId => {
        const catTest = testCatalog.find(t => t.id === tId);
        if (catTest && catTest.parameters) {
          catTest.parameters.forEach(param => {
            if (!existingParamIds.has(param.id)) {
              existingParamIds.add(param.id);
              newAutoResults.push({
                id: `res-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                orderId: orderToEdit.id,
                testId: tId,
                parameterId: param.id,
                parameterCode: param.astmParamCode || param.id,
                parameterName: param.name,
                unit: param.unit,
                value: '',
                numericValue: undefined,
                flag: 'PENDIENTE',
                status: 'PENDIENTE',
                refRangeText: param.referenceRanges?.[0] ? `${param.referenceRanges[0].minValue} - ${param.referenceRanges[0].maxValue}` : 'Normal',
                source: 'RECEPCION_POS',
                analyzerName: 'Ingreso Manual / ACE'
              });
            }
          });
        }
      });

      if (newAutoResults.length > 0) {
        useLisStore.getState().addResults(newAutoResults);
      }
    }

    const updatedOrderPayload: Partial<Order> = {
      orderNumber: formatOrderNumber(orderToEdit.orderNumber),
      patientName: trimmedName,
      patientNationalId: trimmedCedula,
      patientPhone: trimmedPhone,
      patientGender: editOrderPatientGender,
      patientAge: Number(editOrderPatientAge) || 30,
      doctorName: trimmedDoctor,
      doctorLicense: editOrderDoctorLicense.trim() || 'M-9812-MINSA',
      priority: editOrderPriority,
      serviceOrigin: editOrderServiceOrigin,
      insuranceName: editOrderInsurance,
      paymentStatus: editOrderPaymentStatus,
      clinicalComments: editOrderClinicalComments.trim(),
      testIds: editOrderTestIds,
      specimens: updatedSpecimens,
      totalAmount: newTotalAmount
    };

    useLisStore.getState().updateOrder(orderToEdit.id, updatedOrderPayload);

    // Actualizar paciente vinculado si existe
    if (orderToEdit.patientId) {
      const existingPat = patients.find(p => p.id === orderToEdit.patientId);
      if (existingPat) {
        const parts = trimmedName.split(' ');
        const newFirst = parts.length > 1 ? parts.slice(0, Math.ceil(parts.length / 2)).join(' ') : trimmedName;
        const newLast = parts.length > 1 ? parts.slice(Math.ceil(parts.length / 2)).join(' ') : existingPat.lastName;
        useLisStore.getState().updatePatient(orderToEdit.patientId, {
          firstName: newFirst,
          lastName: newLast,
          nationalId: trimmedCedula,
          phone: trimmedPhone || existingPat.phone,
          gender: editOrderPatientGender
        });
      }
    }

    if (createdOrderSummary && createdOrderSummary.id === orderToEdit.id) {
      setCreatedOrderSummary({
        ...createdOrderSummary,
        ...updatedOrderPayload
      });
    }

    notifyToast(`✓ Orden ${formatOrderNumber(orderToEdit.orderNumber)} corregida y actualizada con ${editOrderTestIds.length} análisis.`, 'success');
    setOrderToEdit(null);
  };

  const handleStartNewPatientRegistration = () => {
    setIsRegistering(true);
    setFoundPatient(null);
    setPatientSearchTerm('');
    setNewPatientData({ ...EMPTY_PATIENT_DATA });
    setSelectedTestIds([]);
    setIsCreatingNewOrderForPatient(false);
    setTimeout(() => {
      patientSearchInputRef.current?.focus();
    }, 100);
  };

  const handleSavePatientDemographicsOnly = () => {
    if (!newPatientData.firstName || !newPatientData.lastName || !newPatientData.nationalId) {
      notifyToast('Nombre, Apellido y Cédula son obligatorios para guardar el paciente.', 'warning');
      return;
    }
    const newPat: Patient = {
      id: `pat-${Date.now()}`,
      nationalId: newPatientData.nationalId,
      firstName: `${newPatientData.firstName} ${newPatientData.secondName || ''}`.trim(),
      lastName: `${newPatientData.lastName} ${newPatientData.secondLastName || ''}`.trim(),
      gender: newPatientData.gender,
      dob: newPatientData.dob || '1990-01-01',
      phone: newPatientData.phone,
      email: newPatientData.email,
      address: newPatientData.address,
      district: newPatientData.district,
      corregimiento: newPatientData.corregimiento,
      nationality: newPatientData.nationality,
      isPregnant: newPatientData.isPregnant,
      bloodType: newPatientData.bloodType,
      weight: newPatientData.weight || undefined,
      height: newPatientData.height || undefined,
      chronicConditions: newPatientData.chronicConditions,
      clinicalNotes: newPatientData.clinicalNotes
    };
    useLisStore.getState().addPatient(newPat);
    setFoundPatient(newPat);
    setIsRegistering(false);
    notifyToast(`✓ Paciente ${newPat.firstName} ${newPat.lastName} guardado en el expediente clínico.`, 'success');
  };

  // Master Parser for Official Tribunal Electoral de Panamá Cédula QR
  const handleProcessCedulaQr = (rawQrString: string) => {
    const parts = rawQrString.split('|');
    if (parts.length >= 3) {
      const cedula = parts[0]?.trim() || '8-897-180';
      const nombres = parts[1]?.trim() || 'Ruben Eliecer';
      const apellidos = parts[2]?.trim() || 'Abrego Castillo';

      // Determine sex from position 4 or 3
      const rawSex = parts[4]?.trim() || parts[3]?.trim() || 'M';
      const sexo = (rawSex === 'F' || rawSex === 'FEMENINO') ? 'F' : 'M';

      // Parse YYYYMMDD date (e.g. 19950724 -> 1995-07-24)
      let dobFormatted = '1995-07-24';
      const dobRaw = parts[6]?.trim() || parts[4]?.trim() || '19950724';
      if (dobRaw.length === 8 && /^\d{8}$/.test(dobRaw)) {
        dobFormatted = `${dobRaw.slice(0, 4)}-${dobRaw.slice(4, 6)}-${dobRaw.slice(6, 8)}`;
      } else if (dobRaw.includes('-')) {
        dobFormatted = dobRaw;
      }

      const lugarNacimiento = parts[5]?.trim() || 'PANAMÁ';
      const nacionalidad = parts[7]?.trim() || 'PANAMEÑA';
      const documentoSerie = parts[10]?.trim() || 'A01382541';

      setNewPatientData({
        firstName: nombres,
        lastName: apellidos,
        nationalId: cedula,
        gender: sexo,
        dob: dobFormatted,
        phone: '+507 6900-1122',
        email: `${nombres.split(' ')[0].toLowerCase()}.${apellidos.split(' ')[0].toLowerCase()}@gmail.com`,
        address: `Panamá, ${lugarNacimiento}`,
        isPregnant: false,
        clinicalNotes: 'Ninguna / Sin alergias conocidas',
        weight: '70 kg',
        height: '175 cm',
        bloodType: 'O+',
        emergencyContact: 'Familiar Directo (+507 6600-9900)',
        insuranceProvider: 'CSS Panamá',
        nationality: nacionalidad
      });

      setIsRegistering(true);
      setIsCedulaQrModalOpen(false);

      window.dispatchEvent(
        new CustomEvent('lis-global-toast', {
          detail: { message: `✓ Cédula TE Panamá (${cedula}) procesada. Paciente ${nombres} ${apellidos} cargado en el formulario.`, type: 'success', duration: 4000 }
        })
      );
    }
  };

  const [selectedTestIds, setSelectedTestIds] = useState<string[]>([]);
  const [isStat, setIsStat] = useState<boolean>(false);
  const [isFasting, setIsFasting] = useState<boolean>(true);
  const [isPregnant, setIsPregnant] = useState<boolean>(false);
  const [printSearchTerm, setPrintSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [showSuccessDialog, setShowSuccessDialog] = useState<string | null>(null);
  const [createdOrderSummary, setCreatedOrderSummary] = useState<Order | null>(null);
  const [portalAccessCode, setPortalAccessCode] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, boolean>>({});

  // 📜 Patient Historical Orders Isolation & Scope Filtering
  const [showPatientHistoryModal, setShowPatientHistoryModal] = useState<boolean>(false);
  const [managementPeriod, setManagementPeriod] = useState<'TODAY' | 'WEEK' | 'MONTH' | 'PENDING_OVERDUE' | 'ALL'>('TODAY');
  const [managementSort, setManagementSort] = useState<'DATE_DESC' | 'DATE_ASC' | 'ORDER_NUM_ASC' | 'ORDER_NUM_DESC' | 'NAME_ASC' | 'NAME_DESC'>('DATE_DESC');
  const [managementPage, setManagementPage] = useState<number>(1);
  const [managementPageSize, setManagementPageSize] = useState<number>(10);
  const [isReceptionHeaderCollapsed, setIsReceptionHeaderCollapsed] = useState<boolean>(false);
  const [isTopKpiCollapsed, setIsTopKpiCollapsed] = useState<boolean>(false);
  const [isKpiDetailModalOpen, setIsKpiDetailModalOpen] = useState<boolean>(false);

  // 📸 Instant Prescription Attachment State (<0.2s client-side compression)
  const [prescriptionAttachment, setPrescriptionAttachment] = useState<{
    file: File;
    dataUrl: string;
    originalSize: string;
    compressedSize: string;
    ratio: number;
    processingTimeMs: number;
  } | null>(null);
  const [isCompressingPrescription, setIsCompressingPrescription] = useState(false);

  const handlePrescriptionUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressingPrescription(true);
    const startTime = performance.now();

    try {
      const comp = await ImageCompressor.compressImage(file, {
        maxWidth: 1600,
        quality: 0.8,
        format: 'image/webp'
      });
      const durationMs = Math.round(performance.now() - startTime);

      setPrescriptionAttachment({
        file: comp.file,
        dataUrl: comp.dataUrl,
        originalSize: ImageCompressor.formatBytes(comp.originalSizeBytes),
        compressedSize: ImageCompressor.formatBytes(comp.compressedSizeBytes),
        ratio: comp.compressionRatioPercent,
        processingTimeMs: durationMs
      });

      notifyToast(
        `✓ Receta optimizada en ${durationMs}ms: ${ImageCompressor.formatBytes(comp.originalSizeBytes)} ➔ ${ImageCompressor.formatBytes(comp.compressedSizeBytes)} (${comp.compressionRatioPercent}% de ahorro)`,
        'success',
        3500
      );
    } catch (err: any) {
      notifyToast(
        err.message || 'No se pudo procesar la imagen.',
        'error',
        4000
      );
    } finally {
      setIsCompressingPrescription(false);
    }
  };

  // Helper to extract critical and high-priority status for an order
  const getOrderCriticalInfo = (order: Order) => {
    const orderResults = (results || []).filter(r => r.orderId === order.id);
    const panicResults = orderResults.filter(r => r.flag === 'CRITICO_ALTO' || r.flag === 'CRITICO_BAJO');
    const highResults = orderResults.filter(r => r.flag === 'ALTO' || r.flag === 'BAJO');
    const isStatOrder = order.priority === 'URGENCIA' || order.priority === 'URGENTE';
    const customFlag = criticalNotifications[order.id];

    const isPanic = panicResults.length > 0 || customFlag?.urgencyLevel === 'CRITICO_PANICO';
    const isHighPriority = isPanic || highResults.length > 0 || isStatOrder || !!customFlag;

    const relevantCriticalResults = panicResults.length > 0
      ? panicResults
      : (highResults.length > 0 ? highResults : orderResults);

    let summaryText = '';
    if (panicResults.length > 0) {
      summaryText = `${panicResults[0].parameterName}: ${panicResults[0].value} ${panicResults[0].unit} [PÁNICO]`;
    } else if (highResults.length > 0) {
      summaryText = `${highResults[0].parameterName}: ${highResults[0].value} ${highResults[0].unit} [ALTO]`;
    } else if (isStatOrder) {
      summaryText = `Orden ${order.priority} Prioritaria`;
    } else if (customFlag) {
      summaryText = customFlag.criticalReason;
    }

    const notificationStatus = customFlag ? customFlag.status : (isPanic || isStatOrder ? 'PENDIENTE' : undefined);

    return {
      isPanic,
      isHighPriority,
      isStat: isStatOrder,
      criticalResults: relevantCriticalResults,
      panicCount: panicResults.length,
      summaryText,
      notificationRecord: customFlag,
      status: notificationStatus
    };
  };

  // Critical Notification Handlers
  const handleOpenCriticalModal = (order: Order) => {
    setSelectedOrderForCriticalModal(order);
  };

  const handleSaveNotificationRecord = (record: PatientImmediateNotificationRecord) => {
    setCriticalNotifications(prev => ({
      ...prev,
      [record.orderId]: record
    }));
  };

  const handleToggleOrderCriticalFlag = (orderId: string) => {
    const targetOrder = orders.find(o => o.id === orderId);
    if (!targetOrder) return;

    setCriticalNotifications(prev => {
      const existing = prev[orderId];
      if (existing) {
        const next = { ...prev };
        delete next[orderId];
        return next;
      } else {
        const criticalInfo = getOrderCriticalInfo(targetOrder);
        const newRecord: PatientImmediateNotificationRecord = {
          orderId: targetOrder.id,
          orderNumber: targetOrder.orderNumber,
          patientId: targetOrder.patientId,
          patientName: targetOrder.patientName,
          patientNationalId: targetOrder.patientNationalId,
          patientPhone: '+507 6332-9900',
          doctorName: targetOrder.doctorName,
          flaggedAt: new Date().toISOString(),
          flaggedBy: 'Recepcionista (Marcado Manual)',
          urgencyLevel: criticalInfo.isPanic ? 'CRITICO_PANICO' : 'ALTA_PRIORIDAD',
          status: 'PENDIENTE',
          criticalReason: criticalInfo.summaryText || 'Marcado para notificación inmediata por recepción.',
          criticalParameters: criticalInfo.criticalResults.map(r => ({
            parameterName: r.parameterName,
            value: r.value,
            unit: r.unit,
            refRangeText: r.refRangeText,
            flag: r.flag,
            specimenType: r.specimenType
          })),
          history: [
            {
              id: `log-${Date.now()}`,
              timestamp: new Date().toISOString(),
              action: 'Marcado para Notificación Inmediata',
              user: 'Recepcionista (Ventanilla 1)',
              channel: 'TELEFONO',
              recipientType: 'MEDICO_TRATANTE',
              recipientName: targetOrder.doctorName || 'Médico Tratante',
              recipientContact: '+507 6332-9900',
              outcome: 'Paciente agregado a la lista de alerta prioritaria de recepción.'
            }
          ]
        };
        return { ...prev, [orderId]: newRecord };
      }
    });
  };

  // Subscriptions to printerService
  useEffect(() => {
    const updatePrinters = () => {
      setAutoPrintEnabled(printerService.getAutoPrintEnabled());
      setPrintersList(printerService.getPrinters());
      setSelectedDefaultPrinterId(printerService.getDefaultPrinter().id);
    };

    const unsubPrinter = printerService.subscribe(updatePrinters);
    return () => unsubPrinter();
  }, []);

  const selectedTests = useMemo(() =>
    testCatalog.filter(t => selectedTestIds.includes(t.id)),
    [selectedTestIds, testCatalog]
  );

  const totalAmount = useMemo(() =>
    selectedTests.reduce((sum, t) => sum + t.price, 0),
    [selectedTests]
  );

  const calculateAgeNumber = (dob?: string): number => {
    if (!dob) return 0;
    try {
      const birthDate = new Date(dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
      return isNaN(age) ? 0 : Math.max(0, age);
    } catch {
      return 0;
    }
  };

  const isJubilado = useMemo(() => {
    const isBenefitJubilado = (newPatientData.benefitType || '').includes('Jubilado');
    const age = foundPatient ? calculateAgeNumber(foundPatient.dob) : calculateAgeNumber(newPatientData.dob);
    const gender = foundPatient ? foundPatient.gender : newPatientData.gender;
    const isAgeJubilado = age >= (gender === 'F' ? 57 : 62);
    return isBenefitJubilado || isAgeJubilado;
  }, [newPatientData.benefitType, newPatientData.dob, newPatientData.gender, foundPatient]);

  const discountAmount = useMemo(() => {
    return isJubilado ? totalAmount * 0.20 : 0;
  }, [isJubilado, totalAmount]);

  const netPayableAmount = useMemo(() => {
    return Math.max(0, totalAmount - discountAmount);
  }, [totalAmount, discountAmount]);

  // Derived Preanalytical Requirements from Selected Tests (ISO 15189 Quality Control)
  const preanalyticalRequirements = useMemo(() => {
    const reqs: {
      id: string;
      title: string;
      category: string;
      patientPrep: string;
      phlebotomyNote?: string;
      alertLevel: 'INFO' | 'WARNING' | 'CRITICAL';
      tubeType?: string;
      checkKey?: string;
    }[] = [];

    const hasGlucoseOrLipid = selectedTests.some(t =>
      t.name.toLowerCase().includes('gluco') ||
      t.name.toLowerCase().includes('lipid') ||
      t.name.toLowerCase().includes('colesterol') ||
      t.name.toLowerCase().includes('triglic') ||
      t.code.includes('GLU') || t.code.includes('LIP')
    );
    if (hasGlucoseOrLipid) {
      reqs.push({
        id: 'req-fasting',
        title: 'Glucosa & Perfil Lipídico',
        category: 'Bioquímica Clínica',
        patientPrep: 'Ayuno estricto de 8 a 12 horas. Solo se permite beber agua natural. No fumar, no masticar chicle ni ingerir café o té antes de la toma.',
        phlebotomyNote: 'Tubo Suero Rojo/Oro con gel separador. Dejar coagular 20-30 min a temperatura ambiente antes de centrifugar.',
        alertLevel: isFasting ? 'INFO' : 'CRITICAL',
        tubeType: 'SUERO_ROJO',
        checkKey: 'fastingVerified'
      });
    }

    const hasUrinalysis = selectedTests.some(t =>
      t.category === 'URINALISIS' ||
      t.name.toLowerCase().includes('orina') ||
      t.name.toLowerCase().includes('uroan') ||
      t.tubeType === 'ORINA'
    );
    if (hasUrinalysis) {
      reqs.push({
        id: 'req-urine',
        title: 'Uroanálisis Completo (Orina General)',
        category: 'Uroanálisis & Fluidos',
        patientPrep: 'Aseo de la zona genital con agua previa a la micción. Descartar el primer chorro y recolectar el chorro medio en frasco estéril.',
        phlebotomyNote: 'Verificar sellado del frasco y código de barras. Procesar antes de 2 horas tras la emisión o conservar refrigerado (2-8°C).',
        alertLevel: 'INFO',
        tubeType: 'ORINA',
        checkKey: 'firstUrineVerified'
      });
    }

    const hasCoagulation = selectedTests.some(t =>
      t.category === 'COAGULACION' ||
      t.name.toLowerCase().includes('tp') ||
      t.name.toLowerCase().includes('tpt') ||
      t.name.toLowerCase().includes('inr') ||
      t.name.toLowerCase().includes('fibrin') ||
      t.tubeType === 'CITRATO_AZUL'
    );
    if (hasCoagulation) {
      reqs.push({
        id: 'req-coag',
        title: 'Pruebas de Coagulación (TP / TPT / INR)',
        category: 'Hemostasia / Coagulación',
        patientPrep: 'Verificar si el paciente consume medicamentos anticoagulantes (Warfarina, Heparina, Xarelto, Eliquis) e indagar la hora de la última dosis.',
        phlebotomyNote: 'Tubo Celeste (Citrato 3.2%). Llenado exacto hasta la marca de aforo (proporción 9:1 sangre/anticoagulante). Invertir suavemente 3 a 4 veces.',
        alertLevel: 'WARNING',
        tubeType: 'CITRATO_AZUL',
        checkKey: 'anticoagulantNoted'
      });
    }

    const hasThyroid = selectedTests.some(t =>
      t.name.toLowerCase().includes('tsh') ||
      t.name.toLowerCase().includes('t4') ||
      t.name.toLowerCase().includes('tiroid')
    );
    if (hasThyroid) {
      reqs.push({
        id: 'req-thyroid',
        title: 'Perfil Tiroideo (TSH / T4 Libre)',
        category: 'Endocrinología & Hormonas',
        patientPrep: 'La toma de sangre debe realizarse en ayunas a primera hora de la mañana, ANTES de ingerir la pastilla matutina de Levotiroxina (Euthyrox / Synthroid).',
        phlebotomyNote: 'Tubo Suero Rojo/Oro. Proteger de luz solar directa y separar suero prontamente.',
        alertLevel: 'INFO',
        tubeType: 'SUERO_ROJO',
        checkKey: 'thyroidMedsNoted'
      });
    }

    const hasCBC = selectedTests.some(t =>
      t.category === 'HEMATOLOGIA' ||
      t.name.toLowerCase().includes('hemograma') ||
      t.tubeType === 'EDTA_MORADO'
    );
    if (hasCBC) {
      reqs.push({
        id: 'req-cbc',
        title: 'Hemograma Automatizado & Plaquetas',
        category: 'Hematología Clínica',
        patientPrep: 'No requiere ayuno estricto (ayuno ligero de 2 a 4 horas es suficiente). Mantener hidratación adecuada con agua.',
        phlebotomyNote: 'Tubo Morado (EDTA K2/K3). Invertir suavemente de 8 a 10 veces de inmediato tras la punción para evitar microcoágulos en contadores hematológicos.',
        alertLevel: 'INFO',
        tubeType: 'EDTA_MORADO'
      });
    }

    return reqs;
  }, [selectedTests, isFasting]);

  const filteredPatientsList = useMemo(() => {
    if (patientSearchTerm.length < 2) return [];
    const rawMatches = patients.filter(p =>
      p.firstName.toLowerCase().includes(patientSearchTerm.toLowerCase()) ||
      p.lastName.toLowerCase().includes(patientSearchTerm.toLowerCase()) ||
      p.nationalId.includes(patientSearchTerm)
    );

    // Deduplicate by nationalId so each unique patient appears EXACTLY ONCE
    const uniqueMap = new Map<string, Patient>();
    rawMatches.forEach(p => {
      const key = p.nationalId.trim() || p.id;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, p);
      }
    });
    return Array.from(uniqueMap.values());
  }, [patientSearchTerm, patients]);

  const filteredTestsBySearchAndCategory = useMemo(() => {
    return testCatalog.filter(t => {
      const matchesSearch = !testSearchTerm ||
                           t.name.toLowerCase().includes(testSearchTerm.toLowerCase()) ||
                           t.code.toLowerCase().includes(testSearchTerm.toLowerCase());

      if (testSearchTerm) return matchesSearch;
      return t.category === activeCategory && matchesSearch;
    });
  }, [testCatalog, activeCategory, testSearchTerm]);

  // Date & Period Scope Helpers (Isolate today's workflow from historical clutter)
  const isSameDay = (dateStr?: string, referenceDate: Date = new Date()) => {
    if (!dateStr) return false;
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return false;
      return d.getFullYear() === referenceDate.getFullYear() &&
             d.getMonth() === referenceDate.getMonth() &&
             d.getDate() === referenceDate.getDate();
    } catch {
      return false;
    }
  };

  const isThisWeek = (dateStr?: string, referenceDate: Date = new Date()) => {
    if (!dateStr) return false;
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return false;
      const startOfWeek = new Date(referenceDate);
      const day = startOfWeek.getDay() || 7;
      if (day !== 1) startOfWeek.setDate(startOfWeek.getDate() - (day - 1));
      startOfWeek.setHours(0, 0, 0, 0);
      return d >= startOfWeek;
    } catch {
      return false;
    }
  };

  const isThisMonth = (dateStr?: string, referenceDate: Date = new Date()) => {
    if (!dateStr) return false;
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return false;
      return d.getFullYear() === referenceDate.getFullYear() &&
             d.getMonth() === referenceDate.getMonth();
    } catch {
      return false;
    }
  };

  const isPendingOverdue = (order: Order, referenceDate: Date = new Date()) => {
    if (!order.createdAt) return false;
    try {
      const d = new Date(order.createdAt);
      if (isNaN(d.getTime())) return false;
      const startOfToday = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate());
      const isPast = d < startOfToday;
      const isNotDone = order.status !== 'COMPLETADA' && order.status !== 'LIBERADA' && order.status !== 'CANCELADA';
      return isPast && isNotDone;
    } catch {
      return false;
    }
  };

  const ordersTodayCount = useMemo(() => orders.filter(o => isSameDay(o.createdAt)).length, [orders]);
  const ordersWeekCount = useMemo(() => orders.filter(o => isThisWeek(o.createdAt)).length, [orders]);
  const ordersMonthCount = useMemo(() => orders.filter(o => isThisMonth(o.createdAt)).length, [orders]);
  const ordersPendingOverdueCount = useMemo(() => orders.filter(o => isPendingOverdue(o)).length, [orders]);

  // ⏱️ Live Queue & Turn Tickets Synchronization
  const [turnTickets, setTurnTickets] = useState<QueueTicket[]>(() => turnService.getTickets());
  const [turnCounters, setTurnCounters] = useState<ReceptionCounter[]>(() => turnService.getCounters());

  useEffect(() => {
    const updateTurns = () => {
      setTurnTickets(turnService.getTickets());
      setTurnCounters(turnService.getCounters());
    };
    const unsubscribe = turnService.subscribe(updateTurns);
    window.addEventListener('lis:turn-service-updated', updateTurns);
    return () => {
      unsubscribe();
      window.removeEventListener('lis:turn-service-updated', updateTurns);
    };
  }, []);

  const todayTurnTickets = useMemo(() => {
    const todayStr = new Date().toDateString();
    return turnTickets.filter(t => {
      const refDate = t.completedAt || t.attendedAt || t.createdAt;
      if (!refDate) return false;
      return new Date(refDate).toDateString() === todayStr;
    });
  }, [turnTickets]);

  const waitingTurnsCount = useMemo(() => {
    return todayTurnTickets.filter(t => t.status === 'ESPERANDO' || t.status === 'LLAMANDO').length;
  }, [todayTurnTickets]);

  const attendedTurnsCount = useMemo(() => {
    return todayTurnTickets.filter(t => t.status === 'ATENDIDO' || t.status === 'EN_ATENCION').length;
  }, [todayTurnTickets]);

  const activeCountersCount = useMemo(() => {
    return turnCounters.filter(c => c.status === 'ACTIVA').length;
  }, [turnCounters]);

  const kpiStats = useMemo(() => {
    const statTurns = todayTurnTickets.filter(t => t.priority === 'STAT_URGENTE').length;
    const prefTurns = todayTurnTickets.filter(t => t.priority === 'PREFERENCIAL').length;
    const genTurns = todayTurnTickets.filter(t => t.priority === 'NORMAL').length;
    const attendedTurns = todayTurnTickets.filter(t => t.status === 'ATENDIDO').length;
    const inProgressTurns = todayTurnTickets.filter(t => t.status === 'EN_ATENCION' || t.status === 'LLAMANDO').length;
    const waitingTurns = todayTurnTickets.filter(t => t.status === 'ESPERANDO').length;
    const noShowTurns = todayTurnTickets.filter(t => t.status === 'NO_PRESENTO').length;

    const statOrdersToday = orders.filter(o => {
      const isToday = new Date(o.createdAt).toDateString() === new Date().toDateString();
      return isToday && o.isStat;
    }).length;

    return {
      statTurns,
      prefTurns,
      genTurns,
      attendedTurns,
      inProgressTurns,
      waitingTurns,
      noShowTurns,
      statOrdersToday
    };
  }, [todayTurnTickets, orders]);

  const patientHistoryOrders = useMemo(() => {
    if (!foundPatient) return [];
    return orders
      .filter(o => o.patientNationalId === foundPatient.nationalId || o.patientId === foundPatient.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders, foundPatient]);

  const activeOrder = patientHistoryOrders[0];
  const activeOrderTests = useMemo(() => {
    if (!activeOrder?.testIds) return [];
    return activeOrder.testIds.map(tId => {
      const cat = testCatalog.find(t => t.id === tId);
      return cat || { id: tId, name: tId, price: 0, tubeType: 'EDTA_MORADO' };
    });
  }, [activeOrder, testCatalog]);

  // Orders Management Filter with Period, Search, Critical Alerts & Sorting
  const filteredOrdersManagement = useMemo(() => {
    const list = orders.filter(o => {
      // Period filter
      if (managementPeriod === 'TODAY' && !isSameDay(o.createdAt)) return false;
      if (managementPeriod === 'WEEK' && !isThisWeek(o.createdAt)) return false;
      if (managementPeriod === 'MONTH' && !isThisMonth(o.createdAt)) return false;
      if (managementPeriod === 'PENDING_OVERDUE' && !isPendingOverdue(o)) return false;

      const cleanSearch = managementSearchTerm.toLowerCase().trim();
      if (cleanSearch) {
        const matchesName = (o.patientName || '').toLowerCase().includes(cleanSearch);
        const matchesCedula = (o.patientNationalId || '').includes(cleanSearch);
        const matchesOrder = (o.orderNumber || '').includes(cleanSearch);
        const matchesDoctor = (o.doctorName || '').toLowerCase().includes(cleanSearch);
        if (!matchesName && !matchesCedula && !matchesOrder && !matchesDoctor) return false;
      }

      const critInfo = getOrderCriticalInfo(o);
      if (criticalFilter === 'CRITICAL_ONLY') {
        return critInfo.isHighPriority;
      } else if (criticalFilter === 'PENDING') {
        return critInfo.status === 'PENDIENTE' || critInfo.status === 'REINTENTAR';
      } else if (criticalFilter === 'NOTIFIED') {
        return critInfo.status === 'NOTIFICADO';
      }

      return true;
    });

    // Criterio de Ordenamiento
    list.sort((a, b) => {
      if (managementSort === 'DATE_DESC') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (managementSort === 'DATE_ASC') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (managementSort === 'ORDER_NUM_ASC') {
        return (a.orderNumber || '').localeCompare(b.orderNumber || '');
      }
      if (managementSort === 'ORDER_NUM_DESC') {
        return (b.orderNumber || '').localeCompare(a.orderNumber || '');
      }
      if (managementSort === 'NAME_ASC') {
        return (a.patientName || '').localeCompare(b.patientName || '', 'es-PA');
      }
      if (managementSort === 'NAME_DESC') {
        return (b.patientName || '').localeCompare(a.patientName || '', 'es-PA');
      }
      return 0;
    });

    return list;
  }, [managementSearchTerm, orders, criticalFilter, criticalNotifications, results, managementPeriod, managementSort]);

  // Pagination for Orders Management
  const totalManagementOrders = filteredOrdersManagement.length;
  const totalManagementPages = Math.max(1, Math.ceil(totalManagementOrders / managementPageSize));
  const safeManagementPage = Math.min(Math.max(1, managementPage), totalManagementPages);

  const paginatedOrdersManagement = useMemo(() => {
    const start = (safeManagementPage - 1) * managementPageSize;
    return filteredOrdersManagement.slice(start, start + managementPageSize);
  }, [filteredOrdersManagement, safeManagementPage, managementPageSize]);

  const printStats = useMemo(() => {
    const relevant = orders.filter(o => o.status === 'VALIDADA_MED' || o.status === 'EN_PROCESO');
    const ready = relevant.filter(o => o.status === 'VALIDADA_MED').length;
    const pending = relevant.filter(o => o.status === 'EN_PROCESO').length;
    const panic = relevant.filter(o => getOrderCriticalInfo(o).isPanic).length;
    return { total: relevant.length, ready, pending, panic };
  }, [orders]);

  const filteredPrintOrders = useMemo(() => {
    return orders
      .filter(o => o.status === 'VALIDADA_MED' || o.status === 'EN_PROCESO')
      .filter(o => {
        const term = printSearchTerm.trim().toLowerCase();
        const matchesSearch = !term ||
          o.patientName.toLowerCase().includes(term) ||
          o.patientNationalId.toLowerCase().includes(term) ||
          o.orderNumber.toLowerCase().includes(term);

        const crit = getOrderCriticalInfo(o);
        const matchesStatus =
          printStatusFilter === 'ALL'
            ? true
            : printStatusFilter === 'READY'
            ? o.status === 'VALIDADA_MED'
            : printStatusFilter === 'PENDING'
            ? o.status === 'EN_PROCESO'
            : printStatusFilter === 'PANIC'
            ? crit.isPanic
            : true;

        const matchesDate = !dateFilter || o.createdAt.startsWith(dateFilter);
        return matchesSearch && matchesStatus && matchesDate;
      });
  }, [orders, printSearchTerm, printStatusFilter, dateFilter]);

  // Statistics for Critical Alerts (Scoped to selected Period, plus global count)
  const criticalStats = useMemo(() => {
    let criticalCount = 0;
    let pendingCount = 0;
    let notifiedCount = 0;

    const scopedOrders = orders.filter(o => {
      if (managementPeriod === 'TODAY') return isSameDay(o.createdAt);
      if (managementPeriod === 'WEEK') return isThisWeek(o.createdAt);
      if (managementPeriod === 'MONTH') return isThisMonth(o.createdAt);
      if (managementPeriod === 'PENDING_OVERDUE') return isPendingOverdue(o);
      return true;
    });

    scopedOrders.forEach(o => {
      const info = getOrderCriticalInfo(o);
      if (info.isHighPriority) {
        criticalCount++;
        if (info.status === 'PENDIENTE' || info.status === 'REINTENTAR') {
          pendingCount++;
        } else if (info.status === 'NOTIFICADO') {
          notifiedCount++;
        }
      }
    });

    const allCriticalCount = orders.filter(o => getOrderCriticalInfo(o).isHighPriority).length;

    return { criticalCount, pendingCount, notifiedCount, totalOrdersInScope: scopedOrders.length, allCriticalCount };
  }, [orders, criticalNotifications, results, managementPeriod]);

  const handleSelectFoundPatient = (p: Patient) => {
    setFoundPatient(p);
    setPatientSearchTerm(`${p.firstName} ${p.lastName}`);
    setIsSearchDropdownOpen(false);
    setIsRegistering(false);
    setSelectedTestIds([]);
    setIsCreatingNewOrderForPatient(false);
  };

  // Turn Selection Handler from ReceptionTurnManagement module
  const handleSelectPatientFromTurn = (turnData: {
    firstName: string;
    secondName?: string;
    lastName: string;
    secondLastName?: string;
    nationalId: string;
    gender?: 'M' | 'F';
    age?: number;
    ticketId: string;
    ticketNumber: string;
    isStat?: boolean;
    isFasting?: boolean;
    notes?: string;
  }) => {
    setActiveAttendingTurnId(turnData.ticketId);
    setActiveAttendingTicketNumber(turnData.ticketNumber);
    setIsRegistering(true);
    setFoundPatient(null);

    let calculatedDob = '';
    if (turnData.age) {
      const birthYear = new Date().getFullYear() - turnData.age;
      calculatedDob = `${birthYear}-01-01`;
    }

    // Safety normalization: parse and clean any commas or inverted "Apellido, Nombre" format
    const raw = `${turnData.firstName} ${turnData.lastName}`.trim();
    const parsed = parseFullName(raw);

    const firstName = turnData.secondName !== undefined ? turnData.firstName.replace(/,/g, '').trim() : parsed.firstName;
    const secondName = turnData.secondName || parsed.secondName || '';
    const lastName = turnData.secondLastName !== undefined ? turnData.lastName.replace(/,/g, '').trim() : parsed.lastName;
    const secondLastName = turnData.secondLastName || parsed.secondLastName || '';

    setNewPatientData(prev => ({
      ...prev,
      firstName,
      secondName,
      lastName,
      secondLastName,
      nationalId: turnData.nationalId || '',
      gender: turnData.gender || 'M',
      dob: calculatedDob,
      clinicalNotes: turnData.notes || ''
    }));

    const cleanFull = [firstName, secondName, lastName, secondLastName].filter(Boolean).join(' ');
    setPatientSearchTerm(cleanFull);
    setIsStat(turnData.isStat ?? false);
    setIsFasting(turnData.isFasting ?? true);

    setActiveSubTab('ADMISSION');
  };

  const handleCreateOrderSubmit = async () => {
    // 1. Validación Estricta: Si no se seleccionó un paciente existente, validar campos obligatorios
    if (!foundPatient) {
      const cleanFirstName = (newPatientData.firstName || '').trim();
      const cleanLastName = (newPatientData.lastName || '').trim();
      const cleanNationalId = (newPatientData.nationalId || '').trim();

      const errors: Record<string, boolean> = {};
      if (!cleanFirstName) errors.firstName = true;
      if (!cleanLastName) errors.lastName = true;
      if (!cleanNationalId) errors.nationalId = true;

      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        notifyToast.error('Por favor complete los campos obligatorios: Nombre, Apellido y Cédula del paciente.');
        return;
      }
    }

    if (selectedTestIds.length === 0) {
      notifyToast.error('Debe seleccionar al menos un examen de laboratorio para generar la orden.');
      return;
    }

    setFormErrors({});

    let patientToUse = foundPatient;

    const hasTypedName = Boolean(newPatientData.firstName?.trim() && newPatientData.lastName?.trim());

    if (hasTypedName) {
      const fullFirst = `${newPatientData.firstName} ${newPatientData.secondName || ''}`.trim();
      const fullLast = `${newPatientData.lastName} ${newPatientData.secondLastName || ''}`.trim();
      const cleanNationalId = (newPatientData.nationalId || '').trim();

      if (foundPatient) {
        useLisStore.getState().updatePatient(foundPatient.id, {
          firstName: fullFirst,
          lastName: fullLast,
          nationalId: cleanNationalId || foundPatient.nationalId,
          dob: newPatientData.dob || foundPatient.dob,
          gender: newPatientData.gender || foundPatient.gender,
          phone: newPatientData.phone || foundPatient.phone,
          email: newPatientData.email || foundPatient.email,
          address: newPatientData.address || foundPatient.address,
          district: newPatientData.district || foundPatient.district,
          corregimiento: newPatientData.corregimiento || foundPatient.corregimiento,
          weight: newPatientData.weight || foundPatient.weight,
          height: newPatientData.height || foundPatient.height,
        });
        patientToUse = {
          ...foundPatient,
          firstName: fullFirst,
          lastName: fullLast,
          nationalId: cleanNationalId || foundPatient.nationalId,
          phone: newPatientData.phone || foundPatient.phone,
          district: newPatientData.district || foundPatient.district,
          corregimiento: newPatientData.corregimiento || foundPatient.corregimiento,
          weight: newPatientData.weight || foundPatient.weight,
          height: newPatientData.height || foundPatient.height,
        };
      } else {
        patientToUse = {
          id: `p-${Date.now()}`,
          tenantId: 'lab-san-jose',
          firstName: fullFirst,
          lastName: fullLast,
          nationalId: cleanNationalId,
          gender: newPatientData.gender || 'M',
          dob: newPatientData.dob || '',
          phone: newPatientData.phone || '',
          email: newPatientData.email || '',
          address: newPatientData.address || '',
          district: newPatientData.district || 'Panamá',
          corregimiento: newPatientData.corregimiento || 'San Francisco',
          weight: newPatientData.weight || undefined,
          height: newPatientData.height || undefined,
          idType: 'CEDULA' as const,
          dataConsentLey81: true,
          consentDate: new Date().toISOString()
        };
        useLisStore.getState().addPatient(patientToUse);
      }
    } else if (foundPatient) {
      patientToUse = foundPatient;
    }

    if (!patientToUse) {
      notifyToast.error('Por favor complete los datos del paciente (Nombre, Apellido y Cédula).');
      return;
    }

    setFormErrors({});

    const calculatedAge = patientToUse.dob
      ? new Date().getFullYear() - new Date(patientToUse.dob).getFullYear()
      : 30;

    // Group tests by required tubeType to generate physical specimens with distinct barcodes
    const orderUniqueId = `ord-${Date.now()}`;
    const generatedOrderNum = generateOrderNumber();
    const requiredTubeTypes: string[] = Array.from(new Set(selectedTests.map(t => (t.tubeType || 'EDTA_MORADO') as string)));
    const generatedSpecimens: Specimen[] = (requiredTubeTypes.length > 0 ? requiredTubeTypes : ['EDTA_MORADO']).map((tube, idx) => ({
      id: `sp-${Date.now()}-${idx + 1}`,
      orderId: orderUniqueId,
      barcode: generateSampleBarcode(generatedOrderNum, idx + 1),
      tubeType: tube,
      status: 'PENDIENTE',
      collectedAt: new Date().toISOString(),
      phlebotomyTime: new Date().toISOString(),
      sampleVolumeMl: tube === 'ORINA' ? 30 : tube === 'HECES' ? 10 : 4.0,
      temperatureCondition: tube === 'HEPARINA_VERDE' ? 'BANO_HIELO' : 'AMBIENTE_20_25',
      isSeparated: tube === 'SUERO_ROJO'
    }));

    const newOrder: Order = {
      id: orderUniqueId,
      tenantId: 'lab-san-jose',
      branchId: 'branch-via-espana',
      orderNumber: generatedOrderNum,
      patientId: patientToUse.id,
      patientName: `${patientToUse.firstName} ${patientToUse.lastName}`,
      patientNationalId: patientToUse.nationalId,
      patientGender: patientToUse.gender,
      patientAge: Math.max(1, calculatedAge),
      priority: isStat ? 'URGENCIA' : 'RUTINA',
      status: 'TOMADA',
      createdAt: new Date().toISOString(),
      totalAmount,
      paymentStatus: 'PAGADO',
      doctorId: matchedInstitutionalDoctor?.id,
      doctorName: newPatientData.attendingDoctor || 'Dr. Fernando Arosemena Boyd',
      doctorLicense: newPatientData.doctorLicense || matchedInstitutionalDoctor?.licenseNumber || 'M-9812-MINSA',
      insuranceName: newPatientData.insuranceProvider,
      benefitType: newPatientData.benefitType,
      clinicalComments: newPatientData.clinicalComments,
      serviceOrigin: newPatientData.patientOrigin,
      specimens: generatedSpecimens,
      testIds: selectedTestIds
    };

    onCreateOrder(newOrder, foundPatient ? undefined : (patientToUse as Patient));
    setCreatedOrderSummary(newOrder);

    // If order is marked URGENCIA, pre-flag for immediate notification
    if (isStat) {
      setCriticalNotifications(prev => ({
        ...prev,
        [newOrder.id]: {
          orderId: newOrder.id,
          orderNumber: newOrder.orderNumber,
          patientId: newOrder.patientId,
          patientName: newOrder.patientName,
          patientNationalId: newOrder.patientNationalId,
          patientPhone: patientToUse.phone || '+507 6332-9900',
          doctorName: newOrder.doctorName,
          flaggedAt: new Date().toISOString(),
          flaggedBy: 'Admisión Recepción (Urgente)',
          urgencyLevel: 'ALTA_PRIORIDAD',
          status: 'PENDIENTE',
          criticalReason: 'Ingreso urgente marcado para notificación prioritaria inmediata.',
          criticalParameters: [
            { parameterName: 'Urgencia de Ingreso', value: 'Urgente Prioritario', unit: 'MinSA', refRangeText: 'Rutina', flag: 'ALTO' }
          ],
          history: [
            {
              id: `log-${Date.now()}`,
              timestamp: new Date().toISOString(),
              action: 'Pre-Marcado Urgente',
              user: 'Recepcionista (Ventanilla 1)',
              channel: 'TELEFONO',
              recipientType: 'PACIENTE_DIRECTO',
              recipientName: newOrder.patientName,
              recipientContact: patientToUse.phone || '+507 6332-9900',
              outcome: 'Orden urgente registrada; preparada para notificación inmediata de resultados.'
            }
          ]
        }
      }));
    }

    // Synchronous Instant Portal Access Code
    const quickPortalCode = Math.floor(100000 + Math.random() * 900000).toString();
    setPortalAccessCode(quickPortalCode);

    // INSTANT UI CONFIRMATION DIALOG (< 10ms)
    setShowSuccessDialog(newOrder.id);

    // Non-blocking background execution for printing and turn completion
    setTimeout(async () => {
      if (autoPrintEnabled) {
        try {
          const printResult = await printerService.printOrderSpecimenLabels(
            newOrder,
            patientToUse as Patient,
            { autoTriggered: true }
          );
          setLastAutoPrintStatus({
            printerName: printResult.printer.name,
            labelsCount: printResult.labelsCount,
            labels: printResult.labels,
            timestamp: new Date().toLocaleTimeString()
          });
        } catch (err) {
          console.error('Error background printing', err);
        }
      } else {
        const previewLabels = printerService.generateSpecimenLabelsForOrder(newOrder, patientToUse as Patient);
        setLastAutoPrintStatus({
          printerName: printerService.getDefaultPrinter().name,
          labelsCount: previewLabels.length,
          labels: previewLabels,
          timestamp: new Date().toLocaleTimeString()
        });
      }

      if (activeAttendingTurnId) {
        turnService.completeAttention(activeAttendingTurnId, newOrder.id, newOrder.orderNumber);
        setActiveAttendingTurnId(null);
        setActiveAttendingTicketNumber(null);
      }
    }, 0);
  };

  const handleManualPrintLabels = async (order: Order) => {
    const labels = printerService.generateSpecimenLabelsForOrder(order, undefined, testCatalog);
    setOrderForLabelReprint({ order, labels });
    const printResult = await printerService.printOrderSpecimenLabels(order, undefined, { autoTriggered: false });
    notifyToast(`✓ ${printResult.labelsCount} etiqueta(s) preparadas para la orden ${formatOrderNumber(order.orderNumber)}`, 'success');
  };

  const handleToggleAutoPrint = () => {
    const nextVal = !autoPrintEnabled;
    printerService.setAutoPrintEnabled(nextVal);
    setAutoPrintEnabled(nextVal);
  };

  const handleChangeDefaultPrinter = (printerId: string) => {
    printerService.setDefaultPrinter(printerId);
    setSelectedDefaultPrinterId(printerId);
  };

  const calculateAge = (dob: string) => {
    if (!dob) return '---';
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return `${age} Años`;
  };

  const defaultPrinter = printerService.getDefaultPrinter();
  const selectedModalPatient = selectedOrderForCriticalModal
    ? patients.find(p => p.id === selectedOrderForCriticalModal.patientId) || null
    : null;

  // Enterprise Keyboard Shortcuts ([F2] Nuevo, [F3] Editar, [F4] Limpiar, [Alt+S] Guardar, [F9] Búsqueda, [F10] QR, [F12] Historial, [F8] Imprimir)
  useEffect(() => {
    const handleEnterpriseKeyDown = (e: KeyboardEvent) => {
      if (activeSubTab !== 'ADMISSION') return;

      if (e.key === 'F2') {
        e.preventDefault();
        handleStartNewPatientRegistration();
        notifyToast('⚡ [F2] Nuevo Registro de Paciente iniciado.', 'info', 1800);
      } else if (e.key === 'F9') {
        e.preventDefault();
        patientSearchInputRef.current?.focus();
        notifyToast('🔍 [F9] Búsqueda de Paciente enfocada.', 'info', 1800);
      } else if (e.key === 'F10') {
        e.preventDefault();
        setIsCedulaQrModalOpen(true);
        notifyToast('📲 [F10] Escáner de Cédula QR activado.', 'info', 1800);
      } else if (e.key === 'F3') {
        e.preventDefault();
        if (patientHistoryOrders.length > 0) {
          handleOpenOrderCorrectionModal(patientHistoryOrders[0]);
        } else if (orders.length > 0) {
          handleOpenOrderCorrectionModal(orders[0]);
        } else {
          notifyToast('ℹ️ [F3] No hay orden seleccionada para editar.', 'info', 1800);
        }
      } else if (e.key === 'F4') {
        e.preventDefault();
        setSelectedTestIds([]);
        notifyToast('🗑️ [F4] Exámenes seleccionados limpiados.', 'info', 1800);
      } else if (e.altKey && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        if ((foundPatient || isRegistering) && selectedTests.length > 0) {
          handleCreateOrderSubmit();
        } else {
          notifyToast('⚠️ [Alt+S] Complete el paciente y seleccione al menos una prueba.', 'warning', 2500);
        }
      } else if (e.key === 'F8') {
        e.preventDefault();
        if (patientHistoryOrders.length > 0) {
          handleManualPrintLabels(patientHistoryOrders[0]);
        } else if (orders.length > 0) {
          handleManualPrintLabels(orders[0]);
        }
      } else if (e.key === 'F12') {
        e.preventDefault();
        if (foundPatient && patientHistoryOrders.length > 0) {
          setShowPatientHistoryModal(true);
        } else {
          setActiveSubTab('MANAGEMENT');
        }
      }
    };

    window.addEventListener('keydown', handleEnterpriseKeyDown);
    return () => window.removeEventListener('keydown', handleEnterpriseKeyDown);
  }, [activeSubTab, foundPatient, isRegistering, selectedTests, patientHistoryOrders, orders]);

  return (
    <div className="space-y-4 animate-in fade-in duration-500 pb-10 relative z-10 overflow-x-hidden min-h-screen flex flex-col">

      {/* CRITICAL ALERTS TOP SUMMARY BANNER (When critical notifications exist) */}
      {criticalStats.pendingCount > 0 && (
        <div className="bg-gradient-to-r from-rose-950/80 via-slate-900/90 to-rose-950/80 border-2 border-rose-500/50 p-4 rounded-[2rem] shadow-[0_0_50px_rgba(244,63,94,0.2)] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs animate-in slide-in-from-top-2">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500 text-slate-950 flex items-center justify-center font-black animate-pulse shadow-lg shadow-rose-500/30 shrink-0">
              <Flame className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-black text-rose-400 uppercase tracking-tight text-sm">
                  Alerta de Valores Críticos / Pánico
                </span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-black bg-rose-500 text-slate-950">
                  {criticalStats.pendingCount} PENDIENTE(S)
                </span>
              </div>
              <p className="text-slate-300 text-[11px] font-bold">
                Hay órdenes con resultados fuera de rango de alarma que requieren notificación telefónica o digital inmediata al médico o paciente.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => {
                setActiveSubTab('MANAGEMENT');
                setCriticalFilter('PENDING');
              }}
              className="px-4 py-2 bg-rose-500 hover:bg-rose-400 text-slate-950 font-black rounded-xl text-[10px] uppercase tracking-wider transition shadow cursor-pointer flex items-center space-x-1.5"
            >
              <BellRing className="w-3.5 h-3.5" />
              <span>Ver Pendientes de Notificar</span>
            </button>
          </div>
        </div>
      )}

      {/* HEADER WITH INTEGRATED NAVIGATION & STATUS BAR (COLLAPSIBLE) */}
      {(() => {
        const receptionNavTabs = [
          { id: 'ADMISSION', label: isEn ? 'Patient Intake & Admission' : 'Admisión y Registro', shortLabel: isEn ? 'Admission' : 'Admisión', icon: UserPlus },
          { id: 'TURNS', label: isEn ? 'Queue & Calling Display' : 'Turnos y Llamador', shortLabel: isEn ? 'Queue' : 'Turnos', icon: Users },
          { id: 'MANAGEMENT', label: isEn ? 'Orders & Tube Labels' : 'Órdenes y Etiquetas', shortLabel: isEn ? 'Orders' : 'Órdenes', icon: Barcode, badge: criticalStats.pendingCount > 0 ? `${criticalStats.pendingCount} 🚨` : undefined },
          { id: 'PRINT', label: isEn ? 'Result Delivery' : 'Entrega de Resultados', shortLabel: isEn ? 'Delivery' : 'Entrega', icon: ShieldCheck },
          { id: 'PRINTERS', label: isEn ? 'Thermal Printers' : 'Impresoras Térmicas', shortLabel: isEn ? 'Printers' : 'Impresoras', icon: Printer }
        ];
        const greetingDisplayName = formatGreetingUserName(currentUser?.name, isEn ? 'Reception!' : 'Recepción!');

        if (isReceptionHeaderCollapsed) {
          return (
            <div
              onClick={() => setIsReceptionHeaderCollapsed(false)}
              className="flex flex-wrap items-center justify-between gap-2 bg-slate-900/75 backdrop-blur-xl border border-white/10 hover:border-teal-500/40 px-4 py-2 rounded-2xl shadow-lg shrink-0 cursor-pointer transition group/rec-hdr"
              title={isEn ? 'Click or press Expand to show full reception header' : 'Haz clic o presiona Expandir para ver el encabezado completo'}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 bg-gradient-to-tr from-teal-500 to-emerald-400 rounded-xl flex items-center justify-center shadow shrink-0">
                  <UserPlus className="w-3.5 h-3.5 text-slate-950" />
                </div>
                <span className="text-xs font-black text-white uppercase tracking-tight truncate">
                  {isEn ? 'ADMISSION, RECEPTION & QUEUE' : 'ADMISIÓN, RECEPCIÓN Y TURNOS'}
                </span>
                <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-black bg-amber-400/15 border border-amber-400/30 text-amber-300 shrink-0">
                  <span>👋</span>
                  <span>{getTimeBasedGreeting(language)}, {greetingDisplayName}</span>
                </span>
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar max-w-full" onClick={(e) => e.stopPropagation()}>
                {receptionNavTabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveSubTab(tab.id as any)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider transition whitespace-nowrap cursor-pointer ${
                      activeSubTab === tab.id
                        ? 'bg-teal-500 text-slate-950 shadow'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <tab.icon className="w-3.5 h-3.5" />
                    <span>{tab.shortLabel}</span>
                    {tab.badge && (
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white font-mono font-bold">
                        {tab.badge}
                      </span>
                    )}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => setIsReceptionHeaderCollapsed(false)}
                  className="ml-1 text-[11px] text-teal-200 hover:text-white font-black flex items-center gap-1 cursor-pointer transition bg-teal-500/20 hover:bg-teal-500/30 px-2.5 py-1 rounded-xl border border-teal-500/40 shadow-sm shrink-0 active:scale-95"
                  title={isEn ? 'Expand reception header' : 'Expandir encabezado de admisión y turnos'}
                >
                  <ChevronDown className="w-3.5 h-3.5 text-teal-400" />
                  <span>{isEn ? 'Expand' : 'Expandir'}</span>
                </button>
              </div>
            </div>
          );
        }

        return (
          <div className="flex flex-col gap-3 bg-slate-900/60 backdrop-blur-xl border border-white/10 p-4 sm:p-5 rounded-[2rem] shadow-xl shrink-0 min-w-0">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 min-w-0">
              <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
                <div className="w-11 h-11 sm:w-12 sm:h-12 bg-gradient-to-tr from-teal-500 to-emerald-400 rounded-2xl flex items-center justify-center shadow-lg shadow-teal-500/20 shrink-0">
                  <UserPlus className="w-5 h-5 sm:w-6 sm:h-6 text-slate-950" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-tight leading-none truncate">
                      {isEn ? 'PATIENT ADMISSION, RECEPTION & QUEUE SYSTEM' : 'SISTEMA DE ADMISIÓN, RECEPCIÓN Y TURNOS'}
                    </h2>
                    {/* Dynamic Greeting Pill */}
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-400/15 border border-amber-400/30 text-amber-300 shadow-sm flex items-center space-x-1 shrink-0">
                      <span>👋</span>
                      <span>{getTimeBasedGreeting(language)}, {greetingDisplayName}</span>
                    </span>
                    {activeAttendingTicketNumber && (
                      <span className="px-3 py-1 rounded-full text-xs font-mono font-black bg-amber-400 text-slate-950 animate-pulse shadow shrink-0 flex items-center space-x-1.5">
                        <span>{isEn ? 'Attending:' : 'Atendiendo:'} <strong>{activeAttendingTicketNumber}</strong></span>
                        {activeAttendingPatientName && (
                          <>
                            <span>•</span>
                            <span className="font-sans font-bold">{activeAttendingPatientName}</span>
                          </>
                        )}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs font-bold uppercase text-slate-400 mt-1.5">
                    <div className="flex items-center space-x-1.5 text-emerald-400">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                      <span>{isEn ? 'Active Terminal' : 'Terminal Activa'}</span>
                    </div>
                    <span>•</span>
                    <div className="flex items-center space-x-1.5 text-teal-300">
                      <Printer className="w-3.5 h-3.5" />
                      <span>{isEn ? 'Auto-Print:' : 'Impresión Automática:'} {autoPrintEnabled ? (isEn ? 'ENABLED' : 'ACTIVADA') : 'MANUAL'} ({defaultPrinter.name.slice(0, 14)})</span>
                    </div>
                    <span>•</span>
                    <div className="flex items-center space-x-1.5 text-rose-400 font-bold">
                      <Flame className="w-3.5 h-3.5" />
                      <span>{isEn ? 'Critical Alerts:' : 'Alertas Críticas:'} {criticalStats.criticalCount} ({criticalStats.pendingCount} {isEn ? 'Pend.' : 'Pend.'})</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botón Minimizar del Encabezado */}
              <div className="flex items-center justify-end shrink-0">
                <button
                  type="button"
                  onClick={() => setIsReceptionHeaderCollapsed(true)}
                  className="px-3 py-1.5 bg-slate-950/80 hover:bg-slate-800 text-slate-400 hover:text-teal-300 border border-white/10 rounded-xl text-[11px] font-bold transition flex items-center gap-1 cursor-pointer shadow active:scale-95"
                  title={isEn ? 'Minimize reception header for more workspace' : 'Minimizar encabezado para ganar más espacio de trabajo'}
                >
                  <ChevronUp className="w-3.5 h-3.5 text-teal-400" />
                  <span>{isEn ? 'Minimize' : 'Minimizar'}</span>
                </button>
              </div>
            </div>

            <nav className="flex items-center space-x-1.5 p-1.5 bg-slate-950/70 rounded-2xl border border-white/10 overflow-x-auto no-scrollbar shrink-0 max-w-full">
              {receptionNavTabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveSubTab(tab.id as any)}
                  className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer relative ${
                    activeSubTab === tab.id
                      ? 'bg-teal-500 text-slate-950 shadow-lg shadow-teal-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-rose-500 text-white font-mono font-bold animate-pulse shadow">
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        );
      })()}

      {/* SUBTAB 1: ADMISSION FORM */}
      {activeSubTab === 'ADMISSION' ? (
        <div className="flex-1 flex flex-col gap-3 xl:gap-4 min-h-0 min-w-0">

          {/* TOP ENTERPRISE LIVE KPI STRIP (COLLAPSIBLE FOR ZERO SCROLL EFFICIENCY) */}
          {isTopKpiCollapsed ? (
            <div
              onClick={() => setIsTopKpiCollapsed(false)}
              className="bg-slate-900/80 backdrop-blur-xl border border-white/10 hover:border-teal-500/40 px-4 py-2.5 rounded-2xl shadow-lg flex items-center justify-between text-xs shrink-0 cursor-pointer transition relative z-20 group/kpi-bar"
              title="Haz clic aquí o en Expandir para ver las tarjetas completas de indicadores"
            >
              <div className="flex items-center space-x-3.5 flex-wrap gap-y-1">
                <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse inline-block" />
                  <span>Resumen Jornada:</span>
                </span>
                <span className="text-white font-bold"><strong className="text-teal-400 font-mono">{ordersTodayCount}</strong> Órdenes hoy</span>
                <span className="text-slate-600">•</span>
                <span className="text-white font-bold"><strong className="text-cyan-400 font-mono">{attendedTurnsCount}</strong> Atendidos</span>
                <span className="text-slate-600">•</span>
                <span className="text-white font-bold"><strong className="text-amber-300 font-mono">{waitingTurnsCount}</strong> En Fila</span>
                <span className="text-slate-600">•</span>
                <span className="text-white font-bold"><strong className="text-emerald-300 font-mono">{activeCountersCount}/{turnCounters.length}</strong> Ventanillas</span>
              </div>
              <div className="flex items-center space-x-2 shrink-0">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsKpiDetailModalOpen(true);
                  }}
                  className="text-[11px] text-teal-300 hover:text-white font-bold flex items-center space-x-1.5 cursor-pointer transition bg-slate-950 hover:bg-slate-800 px-3 py-1.5 rounded-xl border border-teal-500/30 hover:border-teal-500/60 shadow-sm active:scale-95"
                  title="Abrir ventana completa de detalle de KPIs e indicadores"
                >
                  <BarChart3 className="w-3.5 h-3.5 text-teal-400" />
                  <span>Ver Detalle KPIs</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsTopKpiCollapsed(false);
                  }}
                  className="text-[11px] text-teal-200 hover:text-white font-black flex items-center space-x-1.5 cursor-pointer transition bg-teal-500/20 hover:bg-teal-500/30 px-3 py-1.5 rounded-xl border border-teal-500/40 shadow-sm active:scale-95"
                  title="Expandir tarjetas de indicadores de telemetría"
                >
                  <ChevronDown className="w-3.5 h-3.5 text-teal-400 group-hover/kpi-bar:translate-y-0.5 transition-transform" />
                  <span>Expandir</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="relative group/kpis z-20 flex flex-col gap-2.5 bg-slate-900/60 backdrop-blur-xl border border-white/10 p-3 sm:p-4 rounded-[2rem] shadow-xl shrink-0">
              {/* Header with Title and Control Buttons */}
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></div>
                  <span className="text-[10px] font-black uppercase text-slate-300 tracking-wider">
                    Telemetría Operativa en Tiempo Real • Indicadores de Recepción
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsKpiDetailModalOpen(true);
                    }}
                    className="px-2.5 py-1 bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 hover:text-white border border-teal-500/40 rounded-xl text-[10px] font-black transition flex items-center space-x-1.5 cursor-pointer shadow active:scale-95"
                    title="Abrir ventana completa de detalle de KPIs e indicadores"
                  >
                    <BarChart3 className="w-3.5 h-3.5 text-teal-400" />
                    <span>Ver Detalle KPIs</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsTopKpiCollapsed(true);
                    }}
                    className="px-2.5 py-1 bg-slate-950/80 hover:bg-slate-800 text-slate-400 hover:text-teal-300 border border-white/10 rounded-xl text-[10px] font-bold transition flex items-center space-x-1 cursor-pointer shadow active:scale-95"
                    title="Minimizar resumen para dar más espacio a la admisión"
                  >
                    <ChevronUp className="w-3.5 h-3.5 text-teal-400" />
                    <span>Minimizar</span>
                  </button>
                </div>
              </div>

              {/* 4 KPI Cards Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3.5">
                {/* KPI 1: Órdenes Ingresadas */}
                <div className="bg-slate-950/80 border border-teal-500/30 rounded-2xl p-3 flex items-center justify-between shadow-inner">
                  <div className="min-w-0 flex-1 pr-2">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block truncate">Órdenes Ingresadas Hoy</span>
                    <div className="flex items-baseline space-x-2 mt-0.5">
                      <span className="text-xl sm:text-2xl font-black text-white font-mono">{ordersTodayCount}</span>
                      <span className="text-[10px] text-teal-400 font-bold font-mono uppercase">Órdenes Totales</span>
                    </div>
                    <span className="text-[9.5px] text-slate-400 font-mono mt-1 block truncate">
                      📊 Registro continuo sin límite
                    </span>
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-300 shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                </div>

                {/* KPI 2: Turnos Atendidos (En Vivo) */}
                <div className="bg-slate-950/80 border border-cyan-500/30 rounded-2xl p-3 flex items-center justify-between shadow-inner">
                  <div className="min-w-0 flex-1 pr-2">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block truncate">Turnos Atendidos Hoy</span>
                    <div className="flex items-baseline space-x-1.5 mt-0.5">
                      <span className="text-xl sm:text-2xl font-black text-cyan-300 font-mono">{attendedTurnsCount}</span>
                      <span className="text-[10px] text-cyan-400 font-bold uppercase font-mono">Pacientes</span>
                    </div>
                    <span className="text-[9.5px] text-slate-400 font-mono mt-1 block truncate">
                      {attendedTurnsCount > 0 ? `✓ ${attendedTurnsCount} atenciones en cola` : '⏱️ Esperando atenciones'}
                    </span>
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-300 shrink-0">
                    <Users className="w-4 h-4" />
                  </div>
                </div>

                {/* KPI 3: Turnos en Espera (En Vivo) */}
                <div className="bg-slate-950/80 border border-amber-500/30 rounded-2xl p-3 flex items-center justify-between shadow-inner">
                  <div className="min-w-0 flex-1 pr-2">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block truncate">Turnos en Espera</span>
                    <div className="flex items-baseline space-x-1.5 mt-0.5">
                      <span className={`text-xl sm:text-2xl font-black font-mono ${waitingTurnsCount > 0 ? 'text-amber-300' : 'text-emerald-400'}`}>
                        {waitingTurnsCount}
                      </span>
                      <span className="text-[10px] text-amber-400 font-bold uppercase font-mono">En Fila</span>
                    </div>
                    <button type="button" onClick={() => setActiveSubTab('TURNS')} className="text-[9.5px] text-amber-300 hover:underline font-bold mt-1 block cursor-pointer">
                      Ver Pantalla de Llamado →
                    </button>
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-300 shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>

                {/* KPI 4: Ventanillas / Módulos Operativos (En Vivo) */}
                <div
                  onClick={() => setActiveSubTab('TURNS')}
                  className="bg-slate-950/80 border border-emerald-500/30 hover:border-emerald-500/60 rounded-2xl p-3 flex items-center justify-between shadow-inner cursor-pointer transition group"
                  title="Ver y Gestionar Ventanillas de Atención"
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <span className="text-[10px] font-black uppercase text-slate-400 group-hover:text-emerald-300 tracking-wider block truncate transition">Ventanillas de Atención</span>
                    <div className="flex items-baseline space-x-1.5 mt-0.5">
                      <span className="text-xl sm:text-2xl font-black text-emerald-300 font-mono">{activeCountersCount} / {turnCounters.length}</span>
                      <span className="text-[10px] text-emerald-400 font-bold uppercase font-mono">Activas</span>
                    </div>
                    <span className="text-[9.5px] text-slate-400 font-mono mt-1 block truncate">Sede Vía España [VE-01] • En Línea</span>
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-300 shrink-0 group-hover:scale-105 transition">
                    <Award className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* MAIN 3-COLUMN WORKSTATION */}
          <div className="flex-1 flex flex-col lg:flex-row gap-3 xl:gap-4 min-h-0 min-w-0">

            {/* COLUMN 1: PATIENT EHR & DEMOGRAPHICS (Left) */}
            <div className="w-full lg:w-[340px] xl:w-[380px] 2xl:w-[410px] flex flex-col shrink-0 min-h-0 min-w-0">
              <div className="bg-slate-900/60 backdrop-blur-3xl border border-white/5 p-4 sm:p-5 rounded-[2.5rem] shadow-2xl flex flex-col">
                
                {activeAttendingTicketNumber && (
                  <div className="mb-4 p-3 bg-amber-950/40 border border-amber-500/40 rounded-2xl flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-black text-amber-300 text-sm">{activeAttendingTicketNumber}</span>
                      <span className="text-[10px] text-amber-200">En Atención</span>
                    </div>
                    <button
                      onClick={() => { setActiveAttendingTurnId(null); setActiveAttendingTicketNumber(null); setActiveAttendingPatientName(null); }}
                      className="text-[9px] text-rose-400 hover:underline uppercase font-bold cursor-pointer"
                    >
                      Desvincular
                    </button>
                  </div>
                )}

                {/* Patient Search Input with [F9] Quick Key */}
                <div className="mb-4 relative z-30">
                  <div className="flex items-center justify-between mb-1.5 px-0.5">
                    <label className="text-[11px] font-black text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Search className="w-3.5 h-3.5 text-teal-400" />
                      <span>Buscar Paciente</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">[F9]</span>
                    </label>
                    <span className="text-[10px] text-teal-300 font-bold bg-teal-500/15 px-2 py-0.5 rounded-full border border-teal-500/30">
                      Cédula / Nombre
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative flex-1 group">
                      <Search className="w-4 h-4 text-teal-400 absolute left-3.5 top-3" />
                      <input
                        ref={patientSearchInputRef}
                        type="text"
                        value={patientSearchTerm}
                        onChange={(e) => { setPatientSearchTerm(e.target.value); setIsSearchDropdownOpen(true); }}
                        onFocus={() => setIsSearchDropdownOpen(true)}
                        placeholder="Cédula, pasaporte o nombre..."
                        className="w-full bg-slate-950 border-2 border-slate-800 rounded-2xl pl-10 pr-3 py-2 text-xs sm:text-sm font-bold text-white focus:border-teal-500/50 outline-none transition-all shadow-inner"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleStartNewPatientRegistration()}
                      className="h-10 px-3 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-2xl flex items-center justify-center gap-1 active:scale-95 transition-all shadow-md shadow-teal-500/20 shrink-0 cursor-pointer font-black text-xs"
                      title="Registrar Nuevo Paciente [F2]"
                    >
                      <Plus className="w-4 h-4 stroke-[2.5]" />
                      <span className="hidden sm:inline font-mono text-[10px]">[F2]</span>
                    </button>
                  </div>
                  {isSearchDropdownOpen && filteredPatientsList.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl z-[100] overflow-hidden">
                      {filteredPatientsList.map(p => (
                        <button key={p.id} onClick={() => handleSelectFoundPatient(p)} className="w-full flex items-center justify-between p-4 hover:bg-teal-500 group border-b border-white/5 last:border-0 transition-all text-left cursor-pointer">
                          <div>
                            <div className="text-sm font-black text-white group-hover:text-slate-950 uppercase">{p.firstName} {p.lastName}</div>
                            <div className="text-xs text-slate-400 group-hover:text-slate-900 font-mono mt-0.5">{p.nationalId}</div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-slate-950 transform group-hover:translate-x-1 transition-transform" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Patient Information Display vs Registration Form */}
                {foundPatient && !isRegistering ? (
                  <div className="space-y-4 animate-in fade-in duration-300 max-h-[calc(100vh-320px)] sm:max-h-[68vh] overflow-y-auto custom-scrollbar pr-2.5">
                    <div className="text-center pb-4 border-b border-white/10">
                      <div className="w-14 h-14 bg-gradient-to-tr from-teal-500 to-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-2.5 shadow-lg shadow-teal-500/20 text-slate-950 font-black text-xl">
                        {foundPatient.firstName[0]}{foundPatient.lastName[0]}
                      </div>
                      <h3 className="text-base font-black text-white uppercase tracking-tight">
                        {foundPatient.firstName} {foundPatient.lastName}
                      </h3>
                      <p className="text-xs text-teal-300 font-mono font-bold mt-0.5">CÉDULA: {foundPatient.nationalId}</p>
                      <div className="flex items-center justify-center gap-2 mt-2">
                        <button
                          type="button"
                          onClick={() => {
                            const nameParts = foundPatient.firstName.split(' ');
                            const lastNameParts = foundPatient.lastName.split(' ');
                            setNewPatientData({
                              firstName: nameParts[0] || '',
                              secondName: nameParts.slice(1).join(' ') || '',
                              lastName: lastNameParts[0] || '',
                              secondLastName: lastNameParts.slice(1).join(' ') || '',
                              nationalId: foundPatient.nationalId,
                              gender: foundPatient.gender,
                              dob: foundPatient.dob,
                              phone: foundPatient.phone || '',
                              email: foundPatient.email || '',
                              address: foundPatient.address || '',
                              district: foundPatient.district || 'Panamá',
                              corregimiento: foundPatient.corregimiento || 'San Francisco',
                              isPregnant: false,
                              gestationalWeeks: '',
                              clinicalNotes: '',
                              weight: foundPatient.weight || '',
                              height: foundPatient.height || '',
                              bloodType: foundPatient.bloodType || 'O+',
                              emergencyContact: '',
                              insuranceProvider: (foundPatient.insuranceProvider as any) || 'PARTICULAR',
                              attendingDoctor: 'Dr. Fernando Arosemena Boyd',
                              doctorSpecialty: 'Medicina General',
                              doctorLicense: 'M-9812-MINSA',
                              isExternalDoctor: false,
                              patientOrigin: 'Consulta Externa',
                              orderService: 'Laboratorio Clínico',
                              subService: 'Ventanilla 1',
                              benefitType: 'Particular (100%)',
                              clinicalComments: '',
                              chronicConditions: foundPatient.chronicConditions || ['DIABETICO'],
                              nationality: foundPatient.nationality || 'Panameña'
                            });
                            setIsRegistering(true);
                          }}
                          className="px-2.5 py-1 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 rounded-lg text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                          title="Corregir cédula o datos demográficos de este paciente"
                        >
                          <Pencil className="w-3 h-3 text-amber-400" />
                          <span>Corregir Cédula o Datos [F3]</span>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-slate-950 p-2.5 rounded-xl border border-white/10">
                        <span className="text-slate-400 font-bold block text-[10px] uppercase mb-0.5">Edad / Nacimiento</span>
                        <span className="text-slate-100 font-bold text-xs">{calculateAge(foundPatient.dob)} ({foundPatient.dob})</span>
                      </div>
                      <div className="bg-slate-950 p-2.5 rounded-xl border border-white/10">
                        <span className="text-slate-400 font-bold block text-[10px] uppercase mb-0.5">Sexo Biológico</span>
                        <span className="text-slate-100 font-bold text-xs">{foundPatient.gender === 'M' ? '👨 Masculino' : '👩 Femenino'}</span>
                      </div>
                      <div className="bg-slate-950 p-2.5 rounded-xl border border-white/10">
                        <span className="text-slate-400 font-bold block text-[10px] uppercase mb-0.5">Teléfono Móvil</span>
                        <span className="text-cyan-300 font-mono font-bold text-xs">{foundPatient.phone || '+507 6612-9988'}</span>
                      </div>
                      <div className="bg-slate-950 p-2.5 rounded-xl border border-white/10">
                        <span className="text-slate-400 font-bold block text-[10px] uppercase mb-0.5">Cobertura / Seguro</span>
                        <span className="text-emerald-300 font-bold text-xs">{foundPatient.insuranceProvider || 'Particular (100%)'}</span>
                      </div>
                      <div className="bg-slate-950 p-2.5 rounded-xl border border-white/10 col-span-2">
                        <span className="text-slate-400 font-bold block text-[10px] uppercase mb-0.5">Ubicación MINSA Panamá</span>
                        <span className="text-slate-200 font-bold text-xs">{foundPatient.address || 'Panamá'} • {foundPatient.corregimiento || 'San Francisco'}, {foundPatient.district || 'Distrito Panamá'}</span>
                      </div>
                    </div>

                    {/* Chronic Conditions & Clinical Badges */}
                    <div className="bg-slate-950/90 border border-slate-800 p-2.5 rounded-xl space-y-1.5">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Diagnóstico Permanente / Alertas Clínicas</span>
                      <div className="flex flex-wrap gap-1.5">
                        {CHRONIC_ALERT_OPTIONS.map(opt => {
                          const isActive = (newPatientData.chronicConditions || []).includes(opt.id) || opt.id === 'DIABETICO';
                          return (
                            <span key={opt.id} className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border flex items-center space-x-1 ${isActive ? opt.color : 'bg-slate-900/60 text-slate-500 border-slate-800 opacity-60'}`}>
                              <span>{opt.icon}</span>
                              <span>{opt.label}</span>
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    <div className="p-2.5 bg-teal-500/10 border border-teal-500/20 rounded-xl flex items-center justify-between text-teal-300 text-xs font-bold">
                      <div className="flex items-center space-x-2">
                        <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0" />
                        <span className="text-[11px]">Ley 81 Protección de Datos: Consentimiento Aprobado</span>
                      </div>
                    </div>

                    {/* Patient Historical Orders Trigger */}
                    {patientHistoryOrders.length > 0 && (
                      <div className="pt-2 border-t border-white/10 space-y-2">
                        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-300">
                              <History className="w-3.5 h-3.5 text-amber-400" />
                              <span>Historial de Visitas</span>
                            </div>
                            <span className="px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-teal-300 text-[10px] font-mono font-black">
                              {patientHistoryOrders.length} {patientHistoryOrders.length === 1 ? 'orden previa' : 'órdenes previas'}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowPatientHistoryModal(true)}
                            className="w-full py-2 px-3 bg-slate-900 hover:bg-slate-850 border border-slate-700 hover:border-amber-500/50 rounded-xl text-amber-300 hover:text-white text-xs font-black uppercase tracking-wider flex items-center justify-center space-x-2 transition cursor-pointer shadow-sm group"
                          >
                            <History className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
                            <span>Ver Historial / Modificar Órdenes [F12]</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : isRegistering ? (
                  /* COMPREHENSIVE ENTERPRISE DEMOGRAPHIC REGISTRATION FORM */
                  <div className="space-y-3.5 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                      <span className="text-xs font-black text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
                        <UserPlus className="w-4 h-4 text-teal-400" />
                        <span>{foundPatient ? 'Corregir Datos Paciente' : 'Nuevo Registro de Paciente'}</span>
                      </span>
                      <div className="flex items-center space-x-1">
                        <button
                          type="button"
                          onClick={handleSavePatientDemographicsOnly}
                          className="px-2 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-lg text-[10px] transition cursor-pointer flex items-center space-x-1 shadow-sm"
                          title="Guardar datos del paciente [Alt+S]"
                        >
                          <Check className="w-3 h-3 stroke-[3]" />
                          <span>Guardar</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewPatientData({ ...EMPTY_PATIENT_DATA })}
                          className="text-[10px] text-amber-400 hover:text-amber-300 font-bold px-1.5 py-1 rounded-lg border border-amber-500/30 hover:bg-amber-500/10 transition cursor-pointer flex items-center gap-1"
                          title="Limpiar formulario [F4]"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Limpiar</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsRegistering(false);
                            setFoundPatient(null);
                            setNewPatientData({ ...EMPTY_PATIENT_DATA });
                          }}
                          className="text-xs text-slate-400 hover:text-white uppercase font-bold cursor-pointer px-1.5 py-1"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>

                    {/* CEDULA QR READER BUTTON [F10] */}
                    <div className="flex items-center justify-between gap-2 bg-gradient-to-r from-amber-500/20 via-teal-500/20 to-cyan-500/20 p-2.5 rounded-xl border border-amber-500/40 shadow">
                      <div className="flex items-center space-x-2 text-xs font-bold text-amber-300">
                        <QrCode className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>Cédula TE Panamá</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsCedulaQrModalOpen(true)}
                        className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs transition shadow cursor-pointer flex items-center space-x-1.5"
                      >
                        <QrCode className="w-3.5 h-3.5 text-slate-950" />
                        <span>Escanear QR [F10]</span>
                      </button>
                    </div>

                    <div className="space-y-3.5 max-h-[calc(100vh-320px)] sm:max-h-[68vh] overflow-y-auto custom-scrollbar pr-2.5 text-xs">

                      {/* SECTION 1: NOMBRES Y APELLIDOS SEPARADOS (Enterprise Standard) */}
                      <div className="space-y-2 bg-slate-950/80 p-3 rounded-2xl border border-cyan-500/30">
                        <span className="text-[11px] font-black text-cyan-300 uppercase block tracking-wider">
                          1. Identificación & Nombres
                        </span>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[9.5px] font-black text-slate-300 uppercase block mb-1">Primer Nombre *</label>
                            <input
                              type="text"
                              required
                              placeholder="Ej: Juan"
                              value={newPatientData.firstName}
                              onChange={e => setNewPatientData({ ...newPatientData, firstName: e.target.value })}
                              className={`w-full bg-slate-900 border rounded-xl px-2.5 py-2 text-xs font-bold text-white outline-none ${formErrors.firstName ? 'border-rose-500' : 'border-white/10'}`}
                            />
                          </div>
                          <div>
                            <label className="text-[9.5px] font-black text-slate-300 uppercase block mb-1">Segundo Nombre</label>
                            <input
                              type="text"
                              placeholder="Ej: Carlos"
                              value={newPatientData.secondName || ''}
                              onChange={e => setNewPatientData({ ...newPatientData, secondName: e.target.value })}
                              className="w-full bg-slate-900 border border-white/10 rounded-xl px-2.5 py-2 text-xs font-bold text-white outline-none"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[9.5px] font-black text-slate-300 uppercase block mb-1">Primer Apellido *</label>
                            <input
                              type="text"
                              required
                              placeholder="Ej: Pérez"
                              value={newPatientData.lastName}
                              onChange={e => setNewPatientData({ ...newPatientData, lastName: e.target.value })}
                              className={`w-full bg-slate-900 border rounded-xl px-2.5 py-2 text-xs font-bold text-white outline-none ${formErrors.lastName ? 'border-rose-500' : 'border-white/10'}`}
                            />
                          </div>
                          <div>
                            <label className="text-[9.5px] font-black text-slate-300 uppercase block mb-1">Segundo Apellido</label>
                            <input
                              type="text"
                              placeholder="Ej: Rodríguez"
                              value={newPatientData.secondLastName || ''}
                              onChange={e => setNewPatientData({ ...newPatientData, secondLastName: e.target.value })}
                              className="w-full bg-slate-900 border border-white/10 rounded-xl px-2.5 py-2 text-xs font-bold text-white outline-none"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[9.5px] font-black text-slate-300 uppercase block mb-1">Cédula / Documento *</label>
                          <input
                            type="text"
                            required
                            placeholder="Ej: 8-897-180 / PE-12345"
                            value={newPatientData.nationalId}
                            onChange={e => setNewPatientData({ ...newPatientData, nationalId: e.target.value })}
                            className={`w-full bg-slate-900 border rounded-xl px-3 py-2 text-xs text-white font-mono font-bold outline-none ${formErrors.nationalId ? 'border-rose-500' : 'border-white/10'}`}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[9.5px] font-black text-slate-300 uppercase block mb-1">Fecha Nacimiento *</label>
                            <input
                              type="date"
                              value={newPatientData.dob}
                              onChange={e => setNewPatientData({ ...newPatientData, dob: e.target.value })}
                              className="w-full bg-slate-900 border border-white/10 rounded-xl px-2 py-2 text-xs text-white font-bold outline-none"
                            />
                          </div>

                          <div>
                            <label className="text-[9.5px] font-black text-slate-300 uppercase block mb-1">Sexo Biológico *</label>
                            <select
                              value={newPatientData.gender}
                              onChange={e => setNewPatientData({ ...newPatientData, gender: e.target.value as any })}
                              className="w-full bg-slate-900 border border-white/10 rounded-xl px-2 py-2 text-xs text-white outline-none font-bold"
                            >
                              <option value="M">👨 Masculino</option>
                              <option value="F">👩 Femenino</option>
                            </select>
                          </div>
                        </div>

                        {newPatientData.dob && (
                          <div className="p-2 bg-slate-900 rounded-xl border border-white/5 flex items-center justify-between text-[11px]">
                            <span className="text-slate-400 font-bold uppercase">Edad Calculada:</span>
                            <span className="text-teal-300 font-black font-mono">{calculateAge(newPatientData.dob)}</span>
                          </div>
                        )}

                        {/* Antropometría Opcional (Peso & Talla para fórmulas clínicas: BSA, Cockcroft-Gault, Schwartz, IMC) */}
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <div>
                            <label className="text-[9.5px] font-black text-slate-300 uppercase block mb-1">
                              Peso (kg) <span className="text-slate-500 font-normal normal-case">(opc.)</span>
                            </label>
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              max="400"
                              placeholder="Ej: 70.5"
                              value={(newPatientData.weight || '').replace(/[^\d.,]/g, '')}
                              onChange={e => setNewPatientData({ ...newPatientData, weight: e.target.value })}
                              className="w-full bg-slate-900 border border-white/10 focus:border-cyan-500/50 rounded-xl px-2.5 py-2 text-xs font-mono font-bold text-white outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-[9.5px] font-black text-slate-300 uppercase block mb-1">
                              Talla (cm) <span className="text-slate-500 font-normal normal-case">(opc.)</span>
                            </label>
                            <input
                              type="number"
                              step="0.5"
                              min="0"
                              max="260"
                              placeholder="Ej: 172"
                              value={(newPatientData.height || '').replace(/[^\d.,]/g, '')}
                              onChange={e => setNewPatientData({ ...newPatientData, height: e.target.value })}
                              className="w-full bg-slate-900 border border-white/10 focus:border-cyan-500/50 rounded-xl px-2.5 py-2 text-xs font-mono font-bold text-white outline-none"
                            />
                          </div>
                        </div>

                        {(() => {
                          const wKg = parseFloat(String(newPatientData.weight || '').replace(',', '.'));
                          const hCm = parseFloat(String(newPatientData.height || '').replace(',', '.'));
                          if (wKg > 0 && hCm > 0) {
                            const hM = hCm / 100;
                            const bmi = wKg / (hM * hM);
                            const bsa = Math.sqrt((wKg * hCm) / 3600); // Fórmula Mosteller (m²)
                            return (
                              <div className="p-2 bg-slate-900 rounded-xl border border-cyan-500/20 flex items-center justify-between text-[10.5px] font-mono">
                                <span className="text-slate-300">
                                  IMC: <strong className="text-cyan-300">{bmi.toFixed(1)}</strong> kg/m²
                                </span>
                                <span className="text-slate-600">•</span>
                                <span className="text-slate-300" title="Superficie Corporal (Mosteller) para Depuración de Creatinina 24h">
                                  ASC (BSA): <strong className="text-teal-300">{bsa.toFixed(2)}</strong> m²
                                </span>
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </div>

                      {/* SECTION 2: CONTACTO, MINSA & UBICACIÓN */}
                      <div className="space-y-2 bg-slate-950/80 p-3 rounded-2xl border border-indigo-500/30">
                        <span className="text-[11px] font-black text-indigo-300 uppercase block tracking-wider">
                          2. Contacto & Ubicación MINSA
                        </span>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[9.5px] font-black text-slate-300 uppercase block mb-1">Teléfono (WhatsApp)</label>
                            <input
                              type="text"
                              placeholder="+507 6000-0000"
                              value={newPatientData.phone}
                              onChange={e => setNewPatientData({ ...newPatientData, phone: e.target.value })}
                              className="w-full bg-slate-900 border border-white/10 rounded-xl px-2.5 py-2 text-xs font-mono font-bold text-white outline-none"
                            />
                          </div>

                          <div>
                            <label className="text-[9.5px] font-black text-slate-300 uppercase block mb-1">Correo Electrónico</label>
                            <input
                              type="email"
                              placeholder="correo@ejemplo.com"
                              value={newPatientData.email}
                              onChange={e => setNewPatientData({ ...newPatientData, email: e.target.value })}
                              className="w-full bg-slate-900 border border-white/10 rounded-xl px-2.5 py-2 text-xs font-bold text-white outline-none"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[9.5px] font-black text-slate-300 uppercase block mb-1">Dirección Residencial</label>
                          <input
                            type="text"
                            placeholder="Calle 50, PH Titanium, Apto 12B"
                            value={newPatientData.address}
                            onChange={e => setNewPatientData({ ...newPatientData, address: e.target.value })}
                            className="w-full bg-slate-900 border border-white/10 rounded-xl px-2.5 py-2 text-xs font-bold text-white outline-none"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[9.5px] font-black text-slate-300 uppercase block mb-1">Distrito</label>
                            <select
                              value={newPatientData.district || 'Panamá'}
                              onChange={e => {
                                const selectedDist = e.target.value;
                                const corregList = PANAMA_DISTRICTS_CORREGIMIENTOS[selectedDist] || [];
                                setNewPatientData({
                                  ...newPatientData,
                                  district: selectedDist,
                                  corregimiento: corregList[0] || ''
                                });
                              }}
                              className="w-full bg-slate-900 border border-white/10 rounded-xl px-2 py-2 text-xs text-white outline-none font-bold cursor-pointer"
                            >
                              {Object.keys(PANAMA_DISTRICTS_CORREGIMIENTOS).map(dist => (
                                <option key={dist} value={dist}>{dist}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="text-[9.5px] font-black text-slate-300 uppercase block mb-1">Corregimiento</label>
                            <select
                              value={newPatientData.corregimiento || (PANAMA_DISTRICTS_CORREGIMIENTOS[newPatientData.district || 'Panamá']?.[0] || '')}
                              onChange={e => setNewPatientData({ ...newPatientData, corregimiento: e.target.value })}
                              className="w-full bg-slate-900 border border-white/10 rounded-xl px-2 py-2 text-xs text-white outline-none font-bold cursor-pointer"
                            >
                              {(PANAMA_DISTRICTS_CORREGIMIENTOS[newPatientData.district || 'Panamá'] || PANAMA_DISTRICTS_CORREGIMIENTOS['Panamá'] || []).map(corr => (
                                <option key={corr} value={corr}>{corr}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* SECTION 3: DIAGNÓSTICO PERMANENTE & ALERTAS CLÍNICAS */}
                      <div className="space-y-2 bg-slate-950/80 p-3 rounded-2xl border border-rose-500/30">
                        <span className="text-[11px] font-black text-rose-300 uppercase block tracking-wider">
                          3. Diagnóstico Permanente / Alertas
                        </span>

                        <p className="text-[10px] text-slate-400">
                          Seleccione las alertas médicas que debe visualizar el flebotomista y analista:
                        </p>

                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {CHRONIC_ALERT_OPTIONS.map(opt => {
                            const isChecked = (newPatientData.chronicConditions || []).includes(opt.id);
                            return (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => {
                                  const current = newPatientData.chronicConditions || [];
                                  const next = isChecked ? current.filter(x => x !== opt.id) : [...current, opt.id];
                                  setNewPatientData({ ...newPatientData, chronicConditions: next });
                                }}
                                className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border transition cursor-pointer flex items-center space-x-1 ${
                                  isChecked
                                    ? `${opt.color} shadow-sm ring-1 ring-white/20`
                                    : 'bg-slate-900 text-slate-400 border-white/10 hover:border-white/30'
                                }`}
                              >
                                <span>{opt.icon}</span>
                                <span>{opt.label}</span>
                                {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* SECTION 4: DATOS DE ORDEN, MÉDICO & BENEFICIO */}
                      <div className="space-y-3 bg-slate-950/80 p-3 rounded-2xl border border-emerald-500/30">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-black text-emerald-300 uppercase block tracking-wider">
                            4. Datos de Orden, Médico & Beneficio
                          </span>
                          {matchedInstitutionalDoctor ? (
                            <span className="text-[9px] font-mono font-black text-emerald-300 bg-emerald-500/15 border border-emerald-500/40 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                              <ShieldCheck className="w-3 h-3 text-emerald-400" />
                              <span>HIS Sincronizado</span>
                            </span>
                          ) : (
                            <span className="text-[9px] font-mono font-black text-cyan-300 bg-cyan-500/15 border border-cyan-500/40 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                              <Globe className="w-3 h-3 text-cyan-400" />
                              <span>Médico Externo / Libre</span>
                            </span>
                          )}
                        </div>

                        {/* Hybrid Physician Input & Auto-complete */}
                        <div className="relative" ref={doctorDropdownRef}>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-[9.5px] font-black text-slate-300 uppercase flex items-center gap-1">
                              <Stethoscope className="w-3 h-3 text-teal-400" />
                              <span>Médico Tratante *</span>
                            </label>
                            <span className="text-[9px] font-mono font-bold text-slate-400">
                              {matchedInstitutionalDoctor ? `Idoneidad: ${matchedInstitutionalDoctor.licenseNumber}` : 'Particular / Externo'}
                            </span>
                          </div>

                          <div className="relative">
                            <input
                              type="text"
                              required
                              placeholder="Escriba nombre de médico o elija del HIS..."
                              value={newPatientData.attendingDoctor}
                              onFocus={() => setIsDoctorDropdownOpen(true)}
                              onChange={e => {
                                const val = e.target.value;
                                const matched = INSTITUTIONAL_HIS_DOCTORS.find(d => d.name.toLowerCase() === val.toLowerCase().trim());
                                setNewPatientData(prev => ({
                                  ...prev,
                                  attendingDoctor: val,
                                  doctorId: matched ? matched.id : undefined,
                                  doctorLicense: matched ? matched.licenseNumber : (prev.doctorLicense || ''),
                                  doctorSpecialty: matched ? matched.specialty : prev.doctorSpecialty,
                                  isExternalDoctor: !matched
                                }));
                                setIsDoctorDropdownOpen(true);
                              }}
                              className={`w-full bg-slate-900 border rounded-xl pl-3 pr-8 py-2 text-xs font-bold text-white outline-none transition-all ${
                                matchedInstitutionalDoctor
                                  ? 'border-emerald-500/50 shadow-sm shadow-emerald-500/10'
                                  : 'border-white/10 focus:border-teal-500/50'
                              }`}
                            />
                            <button
                              type="button"
                              tabIndex={-1}
                              onClick={() => setIsDoctorDropdownOpen(prev => !prev)}
                              className="absolute right-2 top-2 text-slate-400 hover:text-white p-0.5 rounded transition cursor-pointer"
                              title="Desplegar médicos institucionales"
                            >
                              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isDoctorDropdownOpen ? 'rotate-180 text-teal-400' : ''}`} />
                            </button>
                          </div>

                          {/* Dropdown list with Institutional Doctors and External Option */}
                          {isDoctorDropdownOpen && (
                            <div className="absolute top-full left-0 right-0 mt-1.5 bg-slate-900/98 backdrop-blur-2xl border-2 border-teal-500/30 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                              <div className="p-2 bg-slate-950/80 border-b border-white/5 flex items-center justify-between text-[10px]">
                                <span className="font-mono font-bold text-teal-300 uppercase">
                                  Plantilla Médica HIS ({filteredInstitutionalDoctors.length})
                                </span>
                                <span className="text-slate-400 text-[9px]">Click para autocompletar</span>
                              </div>

                              <div className="max-h-48 overflow-y-auto custom-scrollbar p-1 space-y-1">
                                {filteredInstitutionalDoctors.map(doc => {
                                  const isSelected = (newPatientData.attendingDoctor || '').toLowerCase().trim() === doc.name.toLowerCase().trim();
                                  return (
                                    <div
                                      key={doc.id}
                                      onClick={() => {
                                        setNewPatientData(prev => ({
                                          ...prev,
                                          doctorId: doc.id,
                                          attendingDoctor: doc.name,
                                          doctorSpecialty: doc.specialty,
                                          doctorLicense: doc.licenseNumber,
                                          isExternalDoctor: false
                                        }));
                                        setIsDoctorDropdownOpen(false);
                                      }}
                                      className={`p-2 rounded-xl transition-all cursor-pointer flex items-center justify-between text-xs select-none ${
                                        isSelected
                                          ? 'bg-teal-500 text-slate-950 font-black'
                                          : 'hover:bg-teal-500/15 text-slate-200'
                                      }`}
                                    >
                                      <div className="min-w-0 pr-2">
                                        <div className="flex items-center gap-1.5">
                                          <span className="font-bold truncate">{doc.name}</span>
                                          <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded ${
                                            isSelected ? 'bg-slate-950 text-teal-300' : 'bg-slate-800 text-teal-300 border border-teal-500/30'
                                          }`}>
                                            {doc.licenseNumber}
                                          </span>
                                        </div>
                                        <div className={`text-[10px] mt-0.5 truncate ${isSelected ? 'text-slate-900' : 'text-slate-400'}`}>
                                          {doc.specialty} • {doc.institution}
                                        </div>
                                      </div>
                                      {isSelected && <Check className="w-4 h-4 text-slate-950 stroke-[3] shrink-0" />}
                                    </div>
                                  );
                                })}

                                {filteredInstitutionalDoctors.length === 0 && (
                                  <div className="p-3 text-center text-xs text-slate-400">
                                    <p className="font-bold text-amber-300">Médico no encontrado en plantilla HIS.</p>
                                    <p className="text-[10px] text-slate-400 mt-0.5">Se registrará como médico externo/particular libre.</p>
                                  </div>
                                )}
                              </div>

                              {/* Footer note for external doctors */}
                              <div className="p-2 bg-slate-950/90 border-t border-white/5 text-[10px] text-slate-400 flex items-center justify-between">
                                <span className="flex items-center gap-1">
                                  <Globe className="w-3 h-3 text-cyan-400" />
                                  <span>¿Médico privado? Escriba libremente el nombre.</span>
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setIsDoctorDropdownOpen(false)}
                                  className="text-[9px] font-bold text-slate-400 hover:text-white px-2 py-0.5 bg-slate-800 rounded-md cursor-pointer"
                                >
                                  Cerrar
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Specialty and Medical License Fields */}
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[9.5px] font-black text-slate-300 uppercase block mb-1">Especialidad</label>
                            <select
                              value={newPatientData.doctorSpecialty || 'Medicina General'}
                              onChange={e => setNewPatientData({ ...newPatientData, doctorSpecialty: e.target.value })}
                              className="w-full bg-slate-900 border border-white/10 rounded-xl px-2 py-2 text-xs text-white outline-none font-bold"
                            >
                              <option value="Medicina General">Medicina General</option>
                              <option value="Endocrinología">Endocrinología</option>
                              <option value="Ginecología / Obstetricia">Ginecología / Obstetricia</option>
                              <option value="Cardiología">Cardiología</option>
                              <option value="Pediatría">Pediatría</option>
                              <option value="Medicina Interna">Medicina Interna</option>
                              <option value="Urología">Urología</option>
                              <option value="Salud Ocupacional">Salud Ocupacional</option>
                              <option value="Reumatología">Reumatología</option>
                              <option value="Cirugía General">Cirugía General</option>
                              <option value="Otra Especialidad">Otra Especialidad</option>
                            </select>
                          </div>

                          <div>
                            <label className="text-[9.5px] font-black text-slate-300 uppercase block mb-1">Idoneidad / Registro</label>
                            <input
                              type="text"
                              placeholder="Ej: MP-6612-PA"
                              value={newPatientData.doctorLicense || ''}
                              onChange={e => setNewPatientData({ ...newPatientData, doctorLicense: e.target.value })}
                              className="w-full bg-slate-900 border border-white/10 rounded-xl px-2.5 py-2 text-xs font-mono font-bold text-white outline-none"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[9.5px] font-black text-slate-300 uppercase block mb-1">Procedencia / Origen</label>
                            <select
                              value={newPatientData.patientOrigin}
                              onChange={e => setNewPatientData({ ...newPatientData, patientOrigin: e.target.value })}
                              className="w-full bg-slate-900 border border-white/10 rounded-xl px-2 py-2 text-xs text-white outline-none font-bold"
                            >
                              <option value="Consulta Externa">Consulta Externa</option>
                              <option value="Urgencias">Urgencias Hospital</option>
                              <option value="Hospitalización / Sala">Hospitalización / Sala</option>
                              <option value="Chequeo Ejecutivo">Chequeo Ejecutivo</option>
                              <option value="Domicilio / Flebotomía">Domicilio / Flebotomía</option>
                            </select>
                          </div>

                          <div>
                            <label className="text-[9.5px] font-black text-slate-300 uppercase block mb-1">Beneficio / Tarifa</label>
                            <select
                              value={newPatientData.benefitType || 'Particular (100%)'}
                              onChange={e => setNewPatientData({ ...newPatientData, benefitType: e.target.value })}
                              className="w-full bg-slate-900 border border-white/10 rounded-xl px-2 py-2 text-xs text-white outline-none font-bold"
                            >
                              <option value="Particular (100%)">Particular (100%)</option>
                              <option value="Jubilado / 3ra Edad (Ley 6 - 20% Desc.)">Jubilado (Ley 6 - 20% Desc.)</option>
                              <option value="CSS">Caja de Seguro Social (CSS)</option>
                              <option value="PALIG">Pan-American Life (Palig)</option>
                              <option value="ASSA">ASSA Seguros</option>
                              <option value="MAPFRE">Mapfre Panamá</option>
                            </select>
                          </div>
                        </div>

                        {/* Gestational check if female */}
                        {newPatientData.gender === 'F' && (
                          <div className="p-2 bg-pink-500/10 border border-pink-500/30 rounded-xl space-y-1.5">
                            <label className="flex items-center space-x-2 text-xs font-bold text-pink-300 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={newPatientData.isPregnant}
                                onChange={e => setNewPatientData({ ...newPatientData, isPregnant: e.target.checked })}
                                className="rounded border-pink-500 text-pink-500 focus:ring-pink-500"
                              />
                              <span>🤰 Paciente Embarazada / Gestante</span>
                            </label>

                            {newPatientData.isPregnant && (
                              <div>
                                <label className="text-[9px] font-black text-pink-300 uppercase block mb-1">Semanas de Gestación</label>
                                <input
                                  type="text"
                                  placeholder="Ej. 14 Semanas (Segundo Trimestre)"
                                  value={newPatientData.gestationalWeeks}
                                  onChange={e => setNewPatientData({ ...newPatientData, gestationalWeeks: e.target.value })}
                                  className="w-full bg-slate-900 border border-pink-500/40 rounded-xl px-2.5 py-1.5 text-xs text-pink-200 font-bold outline-none"
                                />
                              </div>
                            )}
                          </div>
                        )}

                        <div>
                          <label className="text-[9.5px] font-black text-slate-300 uppercase block mb-1">Comentario Clínico / Flebotomía</label>
                          <input
                            type="text"
                            placeholder="Ej. Venas colapsables, paciente suele marearse"
                            value={newPatientData.clinicalComments || ''}
                            onChange={e => setNewPatientData({ ...newPatientData, clinicalComments: e.target.value })}
                            className="w-full bg-slate-900 border border-white/10 rounded-xl px-2.5 py-2 text-xs font-bold text-white outline-none"
                          />
                        </div>
                      </div>

                      {/* Bottom Save Action Button */}
                      <div className="pt-2 border-t border-white/10 shrink-0">
                        <button
                          type="button"
                          onClick={handleSavePatientDemographicsOnly}
                          className="w-full py-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition shadow-lg shadow-teal-500/20 cursor-pointer flex items-center justify-center space-x-2"
                        >
                          <Check className="w-4 h-4 stroke-[3]" />
                          <span>{foundPatient ? 'Guardar Cambios del Paciente' : 'Guardar y Seleccionar Paciente'}</span>
                        </button>
                      </div>

                    </div>
                  </div>
                ) : (
                  /* CLEAN INITIAL PROMPT */
                  <div className="py-10 px-4 text-center space-y-3.5 animate-in fade-in duration-300">
                    <div className="w-16 h-16 bg-slate-950 border border-slate-800 text-teal-400 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
                      <UserSearch className="w-8 h-8 text-teal-400" />
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-xs font-black text-white uppercase tracking-wider">
                        Ningún Paciente Seleccionado
                      </h3>
                      <p className="text-[11px] text-slate-400 leading-relaxed max-w-xs mx-auto">
                        Busque un paciente por Cédula o Nombre en el buscador superior, o presione <strong className="text-teal-400">[F2]</strong> para registrar un paciente nuevo.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleStartNewPatientRegistration()}
                      className="px-4 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs rounded-2xl transition shadow-lg shadow-teal-500/20 cursor-pointer flex items-center space-x-1.5 mx-auto"
                    >
                      <UserPlus className="w-4 h-4 text-slate-950" />
                      <span>+ Registrar Paciente Nuevo [F2]</span>
                    </button>
                  </div>
                )}

              </div>
            </div>

            {/* COLUMN 2: TESTS CATALOG & PREANALYTICAL REQUISITES (Center) */}
            <div className="flex-1 flex flex-col min-h-0 min-w-0">
              <div className="bg-slate-900/60 backdrop-blur-3xl border border-white/5 p-4 sm:p-5 rounded-[2.5rem] shadow-2xl flex-1 flex flex-col space-y-3">
                
                {/* DUAL SUBTAB HEADER (CATÁLOGO vs REQUISITOS PREANALÍTICOS) */}
                <div className="flex items-center justify-between border-b border-white/10 pb-2.5 gap-2">
                  <div className="flex items-center space-x-1.5 bg-slate-950 p-1 rounded-2xl border border-white/10">
                    <button
                      type="button"
                      onClick={() => setCol2SubTab('CATALOG')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer flex items-center space-x-1.5 ${
                        col2SubTab === 'CATALOG'
                          ? 'bg-teal-500 text-slate-950 shadow-md font-black'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Microscope className="w-3.5 h-3.5" />
                      <span>Catálogo de Pruebas</span>
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-black ${col2SubTab === 'CATALOG' ? 'bg-slate-900 text-teal-300' : 'bg-slate-800 text-slate-400'}`}>
                        {selectedTestIds.length}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCol2SubTab('PREANALYTICAL')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer flex items-center space-x-1.5 ${
                        col2SubTab === 'PREANALYTICAL'
                          ? 'bg-cyan-400 text-slate-950 shadow-md font-black'
                          : 'text-slate-400 hover:text-cyan-300'
                      }`}
                    >
                      <ClipboardList className="w-3.5 h-3.5" />
                      <span>Requisitos Preanalíticos</span>
                      {preanalyticalRequirements.length > 0 && (
                        <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-black ${col2SubTab === 'PREANALYTICAL' ? 'bg-slate-900 text-cyan-300' : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'}`}>
                          {preanalyticalRequirements.length}
                        </span>
                      )}
                    </button>
                  </div>

                  {col2SubTab === 'PREANALYTICAL' && (
                    <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-xl flex items-center space-x-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      <span>ISO 15189 Calidad</span>
                    </span>
                  )}
                </div>

                {col2SubTab === 'CATALOG' ? (
                  /* VIEW A: TESTS CATALOG */
                  <div className="flex-1 flex flex-col space-y-3 min-h-0">
                    {/* Search Bar */}
                    <div className="relative w-full">
                      <Search className="w-4 h-4 text-teal-400 absolute left-4 top-3" />
                      <input
                        ref={testSearchInputRef}
                        type="text"
                        value={testSearchTerm}
                        onChange={(e) => setTestSearchTerm(e.target.value)}
                        placeholder="Buscar análisis por código o nombre (ej: Hemograma, Glucosa, Perfil Lipídico)..."
                        className="w-full bg-slate-950 border-2 border-slate-800 rounded-2xl pl-11 pr-10 py-2.5 text-xs sm:text-sm font-bold text-white placeholder-slate-500 outline-none focus:border-teal-500/60 shadow-inner transition-colors"
                      />
                      {testSearchTerm && (
                        <button
                          type="button"
                          onClick={() => setTestSearchTerm('')}
                          className="absolute right-3 top-2.5 p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
                          title="Borrar búsqueda"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Categories Horizontal Carousel */}
                    <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-thin">
                      {[
                        { id: 'HEMATOLOGIA', label: 'Hematología', color: 'bg-rose-500 text-white shadow-rose-500/30' },
                        { id: 'COAGULACION', label: 'Coagulación', color: 'bg-emerald-400 text-slate-950 shadow-emerald-500/30 font-black' },
                        { id: 'QUIMICA', label: 'Química Clínica', color: 'bg-cyan-400 text-slate-950 shadow-cyan-500/30 font-black' },
                        { id: 'URINALISIS', label: 'Uroanálisis', color: 'bg-amber-400 text-slate-950 shadow-amber-500/30 font-black' },
                        { id: 'COPROLOGIA', label: 'Coprología', color: 'bg-yellow-600 text-white shadow-yellow-600/30 font-bold' },
                        { id: 'SEROLOGIA', label: 'Serología', color: 'bg-fuchsia-500 text-white shadow-fuchsia-500/30 font-bold' },
                        { id: 'INMUNOLOGIA', label: 'Inmunología', color: 'bg-indigo-500 text-white shadow-indigo-500/30' },
                        { id: 'MICROBIOLOGIA', label: 'Microbiología', color: 'bg-teal-400 text-slate-950 shadow-teal-500/30 font-black' },
                        { id: 'BANCO_SANGRE', label: 'Banco de Sangre', color: 'bg-red-600 text-white shadow-red-600/30 font-bold' },
                        { id: 'GASOMETRIA_STAT', label: 'Urgencias / STAT', color: 'bg-orange-500 text-white shadow-orange-500/30 font-black' }
                      ].map(cat => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => { setActiveCategory(cat.id); setTestSearchTerm(''); }}
                          className={`px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer whitespace-nowrap ${
                            activeCategory === cat.id && !testSearchTerm
                              ? `${cat.color} shadow-lg font-black`
                              : 'bg-slate-950 text-slate-400 hover:text-white border border-white/5'
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>

                    {/* Tests Grid */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2.5 grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3 gap-2.5 sm:gap-3 max-h-[calc(100vh-340px)] sm:max-h-[66vh] min-h-[440px] min-w-0 content-start">
                      {filteredTestsBySearchAndCategory.map(test => {
                        const isSelected = selectedTestIds.includes(test.id);
                        return (
                          <div
                            key={test.id}
                            onClick={() => {
                              setSelectedTestIds(prev =>
                                prev.includes(test.id) ? prev.filter(id => id !== test.id) : [...prev, test.id]
                              );
                            }}
                            className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-2 select-none ${
                              isSelected
                                ? 'bg-teal-500/10 border-teal-500/50 shadow-lg shadow-teal-500/10 ring-1 ring-teal-500/40'
                                : 'bg-slate-950/60 border-white/5 hover:border-white/20'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <span className="text-xs sm:text-sm font-mono font-black px-2.5 py-0.5 rounded-xl bg-slate-900 text-teal-300 border border-teal-500/40 shadow-sm tracking-wider">
                                {test.code}
                              </span>
                              <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${isSelected ? 'bg-teal-500 border-teal-400 text-slate-950' : 'border-white/10'}`}>
                                {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                              </div>
                            </div>

                            <div>
                              <h4 className="text-sm font-black text-white uppercase tracking-tight leading-snug">{test.name}</h4>
                              <p className="text-[11px] text-slate-300 font-mono font-bold mt-0.5">{test.category} • {test.specimenType}</p>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-white/5">
                              <span className="font-mono font-black text-sm text-teal-300 bg-teal-500/20 px-2 py-0.5 rounded-xl border border-teal-500/30 shadow-sm">${test.price.toFixed(2)}</span>
                              <span className="text-[10px] font-mono font-bold text-slate-400">Entrega: {test.tatHours}h</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  /* VIEW B: PREANALYTICAL REQUISITES & ISO 15189 VALIDATOR */
                  <div className="flex-1 flex flex-col space-y-3.5 overflow-y-auto custom-scrollbar pr-2.5 max-h-[calc(100vh-340px)] sm:max-h-[66vh] min-h-[440px]">
                    <div className="p-3 bg-cyan-950/40 border border-cyan-500/30 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-xl bg-cyan-400 text-slate-950 flex items-center justify-center font-black">
                          <CheckSquare className="w-4 h-4 stroke-[2.5]" />
                        </div>
                        <div>
                          <span className="font-black text-cyan-300 text-xs uppercase block">Control Preanalítico de Calidad ISO 15189</span>
                          <span className="text-[10.5px] text-slate-300 block">Validación de preparación de paciente y requisitos para evitar rechazo de muestras.</span>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-xs font-mono font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shrink-0">
                        ✓ 0 Muestras en Riesgo
                      </span>
                    </div>

                    {/* Preanalytical Checklist for Receptionist */}
                    <div className="bg-slate-950/80 border border-white/10 rounded-2xl p-3.5 space-y-2.5">
                      <span className="text-[11px] font-black uppercase text-slate-300 tracking-wider block">
                        Lista de Verificación con el Paciente
                      </span>

                      <div className="space-y-2 text-xs">
                        <label className="flex items-center space-x-2.5 p-2 rounded-xl bg-slate-900 border border-white/5 cursor-pointer hover:bg-slate-850">
                          <input
                            type="checkbox"
                            checked={preanalyticalChecks.fastingVerified ?? true}
                            onChange={e => setPreanalyticalChecks({ ...preanalyticalChecks, fastingVerified: e.target.checked })}
                            className="rounded border-teal-500 text-teal-500 focus:ring-teal-500 w-4 h-4"
                          />
                          <span className="text-slate-200 font-bold">1. Ayuno verificado con el paciente (8 - 12 horas para glucosa / lípidos)</span>
                        </label>

                        <label className="flex items-center space-x-2.5 p-2 rounded-xl bg-slate-900 border border-white/5 cursor-pointer hover:bg-slate-850">
                          <input
                            type="checkbox"
                            checked={preanalyticalChecks.firstUrineVerified ?? true}
                            onChange={e => setPreanalyticalChecks({ ...preanalyticalChecks, firstUrineVerified: e.target.checked })}
                            className="rounded border-teal-500 text-teal-500 focus:ring-teal-500 w-4 h-4"
                          />
                          <span className="text-slate-200 font-bold">2. Se entregaron frascos estériles e instrucciones de chorro medio</span>
                        </label>

                        <label className="flex items-center space-x-2.5 p-2 rounded-xl bg-slate-900 border border-white/5 cursor-pointer hover:bg-slate-850">
                          <input
                            type="checkbox"
                            checked={preanalyticalChecks.anticoagulantNoted ?? true}
                            onChange={e => setPreanalyticalChecks({ ...preanalyticalChecks, anticoagulantNoted: e.target.checked })}
                            className="rounded border-teal-500 text-teal-500 focus:ring-teal-500 w-4 h-4"
                          />
                          <span className="text-slate-200 font-bold">3. Verificación de terapia anticoagulante (Warfarina / Heparina / Rivaroxabán)</span>
                        </label>

                        <label className="flex items-center space-x-2.5 p-2 rounded-xl bg-slate-900 border border-white/5 cursor-pointer hover:bg-slate-850">
                          <input
                            type="checkbox"
                            checked={preanalyticalChecks.ley81Consent ?? true}
                            onChange={e => setPreanalyticalChecks({ ...preanalyticalChecks, ley81Consent: e.target.checked })}
                            className="rounded border-teal-500 text-teal-500 focus:ring-teal-500 w-4 h-4"
                          />
                          <span className="text-slate-200 font-bold">4. Consentimiento de entrega de resultados y Ley 81 firmado digitalmente</span>
                        </label>
                      </div>
                    </div>

                    {/* Dynamic Preanalytical Requirements */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black uppercase text-slate-300 tracking-wider block">
                          Criterios Preanalíticos: Preparación de Paciente y Flebotomía ({preanalyticalRequirements.length})
                        </span>
                        <span className="text-[10px] text-teal-400 font-bold">
                          Protocolo ISO 15189
                        </span>
                      </div>

                      {preanalyticalRequirements.length === 0 ? (
                        <div className="p-6 bg-slate-950/60 rounded-2xl border border-white/5 text-center text-slate-400 text-xs">
                          Seleccione exámenes en la pestaña "Catálogo de Pruebas" para generar automáticamente las instrucciones de preparación del paciente y flebotomía.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                          {preanalyticalRequirements.map(req => (
                            <div key={req.id} className="p-3.5 bg-slate-950 border border-white/10 rounded-2xl space-y-2.5 shadow-sm">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded-lg bg-slate-900 text-teal-300 border border-teal-500/30">
                                  {req.category}
                                </span>
                                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                                  req.alertLevel === 'CRITICAL' ? 'bg-rose-500 text-slate-950 font-black' : req.alertLevel === 'WARNING' ? 'bg-amber-400 text-slate-950 font-black' : 'bg-cyan-500/20 text-cyan-300'
                                }`}>
                                  {req.alertLevel === 'CRITICAL' ? '⚠️ CRÍTICO' : req.alertLevel === 'WARNING' ? '⚡ PRECAUCIÓN' : 'INFORMACIÓN'}
                                </span>
                              </div>

                              <h5 className="text-xs font-black text-white">{req.title}</h5>

                              {/* Patient preparation instruction */}
                              <div className="p-2.5 bg-slate-900/90 rounded-xl border border-white/5 space-y-1">
                                <div className="text-[10px] font-black uppercase text-teal-300 flex items-center space-x-1">
                                  <span>👤 Preparación del Paciente:</span>
                                </div>
                                <p className="text-[11px] text-slate-200 leading-snug">{req.patientPrep}</p>
                              </div>

                              {/* Technical phlebotomy & tube handling */}
                              {req.phlebotomyNote && (
                                <div className="p-2.5 bg-teal-950/20 rounded-xl border border-teal-500/20 space-y-1">
                                  <div className="text-[10px] font-black uppercase text-teal-400 flex items-center space-x-1">
                                    <span>🧪 Flebotomía & Muestra:</span>
                                  </div>
                                  <p className="text-[10.5px] text-teal-200/90 leading-snug">{req.phlebotomyNote}</p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* COLUMN 3: CART, SUMMARY & EMISSION (Right) */}
            <div className="w-full lg:w-[280px] xl:w-[320px] 2xl:w-[350px] flex flex-col shrink-0 min-h-0 min-w-0">
              <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-white/5 rounded-[2.5rem] p-4 sm:p-5 shadow-2xl flex flex-col relative group">
                <div className="absolute -top-20 -right-20 w-48 h-48 bg-teal-500/5 rounded-full blur-[100px]"></div>

                <div className="flex-1 space-y-3 relative z-10 overflow-y-auto custom-scrollbar pr-2 max-h-[calc(100vh-280px)] sm:max-h-[72vh]">
                  
                  {/* Banner Discreto de Historial si el paciente tiene visitas previas */}
                  {foundPatient && patientHistoryOrders.length > 0 && (
                    <div className="p-2.5 bg-slate-950/90 border border-amber-500/30 rounded-2xl flex items-center justify-between text-xs shadow-sm">
                      <div className="min-w-0 pr-2">
                        <span className="text-[10px] text-amber-300 font-bold block truncate">
                          {patientHistoryOrders.length} {patientHistoryOrders.length === 1 ? 'orden previa' : 'órdenes previas'}
                        </span>
                        <span className="text-[9.5px] text-slate-400 font-mono">
                          Última: {formatOrderNumber(patientHistoryOrders[0].orderNumber)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleOpenOrderCorrectionModal(patientHistoryOrders[0])}
                          className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-[10px] font-bold cursor-pointer transition flex items-center gap-1"
                          title="Corregir datos de la última orden [F3]"
                        >
                          <Pencil className="w-3 h-3 text-amber-400" />
                          <span>[F3]</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowPatientHistoryModal(true)}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-500/30 rounded-lg text-[10px] font-bold cursor-pointer transition flex items-center gap-1"
                          title="Ver historial completo de órdenes de este paciente [F12]"
                        >
                          <History className="w-3 h-3 text-teal-400" />
                          <span>Historial</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Selected Tests Header */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-teal-500/20 rounded-xl flex items-center justify-center text-teal-400 font-black text-xs">
                          {selectedTests.length}
                        </div>
                        <span className="text-xs font-black text-white uppercase tracking-wider">Detalle de Exámenes</span>
                      </div>
                      {selectedTests.length > 0 && (
                        <button onClick={() => setSelectedTestIds([])} className="text-[10px] font-bold text-rose-400 hover:text-rose-300 uppercase cursor-pointer">
                          Limpiar [F4]
                        </button>
                      )}
                    </div>

                    <div className="space-y-1.5 pr-2 max-h-56 overflow-y-auto custom-scrollbar">
                      {selectedTests.map(t => (
                        <div key={t.id} className="flex items-center justify-between p-2.5 bg-slate-950/90 border border-slate-800 rounded-xl animate-in slide-in-from-right-4 transition-all">
                          <div className="min-w-0 flex-1 pr-2">
                            <div className="text-xs font-black text-white uppercase leading-tight truncate">{t.name}</div>
                            <div className="flex items-center space-x-1.5 mt-0.5">
                              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-900 text-teal-300 border border-teal-500/30">{t.tubeType?.split('_')[0] || 'EDTA'}</span>
                              <span className="text-[11px] font-mono font-black text-teal-300">${t.price.toFixed(2)}</span>
                            </div>
                          </div>
                          <button onClick={() => setSelectedTestIds(prev => prev.filter(id => id !== t.id))} className="w-6 h-6 flex items-center justify-center bg-slate-900 hover:bg-rose-500 text-slate-400 hover:text-white rounded-lg transition-all shadow cursor-pointer shrink-0" title="Remover examen">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Toggles & Options */}
                  <div className="space-y-2 pt-1">
                    <button onClick={() => setIsStat(!isStat)} className={`w-full p-2.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${isStat ? 'bg-rose-500/10 border-rose-500/50 shadow-lg' : 'bg-slate-950 border-white/10'}`}>
                      <div className="flex items-center space-x-2">
                        <Zap className={`w-4 h-4 ${isStat ? 'text-rose-500 animate-pulse' : 'text-slate-500'}`} />
                        <div className="text-left">
                          <span className={`text-xs font-black uppercase tracking-wider block ${isStat ? 'text-rose-400' : 'text-slate-300'}`}>Urgente / STAT</span>
                          {isStat && <span className="text-[9px] text-rose-300 font-mono font-bold">🚨 Alerta Crítica</span>}
                        </div>
                      </div>
                      <div className={`w-9 h-5 rounded-full relative transition-colors ${isStat ? 'bg-rose-500' : 'bg-slate-800'}`}>
                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${isStat ? 'left-4' : 'left-0.5'}`}></div>
                      </div>
                    </button>

                    <button onClick={() => setIsFasting(!isFasting)} className={`w-full p-2.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${isFasting ? 'bg-teal-500/10 border-teal-500/50 shadow-lg' : 'bg-slate-950 border-white/10'}`}>
                      <div className="flex items-center space-x-2">
                        <Clock className={`w-4 h-4 ${isFasting ? 'text-teal-400' : 'text-slate-500'}`} />
                        <span className={`text-xs font-black uppercase tracking-wider ${isFasting ? 'text-teal-300' : 'text-slate-300'}`}>Paciente en Ayunas</span>
                      </div>
                      <div className={`w-9 h-5 rounded-full relative transition-colors ${isFasting ? 'bg-teal-500' : 'bg-slate-800'}`}>
                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${isFasting ? 'left-4' : 'left-0.5'}`}></div>
                      </div>
                    </button>

                    {((foundPatient?.gender === 'F') || (newPatientData.gender === 'F')) && (
                      <button onClick={() => setIsPregnant(!isPregnant)} className={`w-full p-2.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${isPregnant ? 'bg-pink-500/15 border-pink-500/50 shadow-lg' : 'bg-slate-950 border-white/10'}`}>
                        <div className="flex items-center space-x-2">
                          <Baby className={`w-4 h-4 ${isPregnant ? 'text-pink-400 animate-pulse' : 'text-slate-500'}`} />
                          <div className="text-left">
                            <span className={`text-xs font-black uppercase tracking-wider block ${isPregnant ? 'text-pink-300' : 'text-slate-300'}`}>Paciente Embarazada</span>
                            {isPregnant && <span className="text-[9px] text-pink-300 font-mono font-bold">🤰 Obstétrico</span>}
                          </div>
                        </div>
                        <div className={`w-9 h-5 rounded-full relative transition-colors ${isPregnant ? 'bg-pink-500' : 'bg-slate-800'}`}>
                          <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${isPregnant ? 'left-4' : 'left-0.5'}`}></div>
                        </div>
                      </button>
                    )}
                  </div>

                  {/* Instant Prescription Attachment */}
                  <div className="p-3 bg-slate-950 border border-indigo-500/30 rounded-2xl space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200 flex items-center space-x-1.5">
                        <Camera className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Foto Receta / Orden</span>
                      </span>
                      {prescriptionAttachment && (
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-black">
                          ⚡ {prescriptionAttachment.processingTimeMs}ms
                        </span>
                      )}
                    </div>

                    {prescriptionAttachment ? (
                      <div className="flex items-center space-x-2.5 bg-slate-900/90 p-2 rounded-xl border border-emerald-500/40">
                        <img
                          src={prescriptionAttachment.dataUrl}
                          alt="Receta Optimizada"
                          className="w-10 h-10 object-cover rounded-lg border border-slate-700 shrink-0"
                        />
                        <div className="flex-1 min-w-0 text-left">
                          <div className="text-[10px] font-bold text-white truncate">
                            {prescriptionAttachment.file.name}
                          </div>
                          <div className="text-[9px] text-slate-400 font-mono mt-0.5">
                            {prescriptionAttachment.originalSize} → <strong className="text-emerald-400 font-bold">{prescriptionAttachment.compressedSize}</strong> (-{prescriptionAttachment.ratio}%)
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setPrescriptionAttachment(null)}
                          className="p-1 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                          title="Eliminar foto"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <label className={`w-full flex items-center justify-center space-x-1.5 py-2 px-2.5 border border-dashed rounded-xl cursor-pointer transition ${
                        isCompressingPrescription
                          ? 'bg-indigo-950/40 border-indigo-500 text-indigo-300 animate-pulse'
                          : 'border-slate-800 hover:border-indigo-400 bg-slate-900/50 hover:bg-slate-900 text-slate-400 hover:text-white'
                      }`}>
                        <Camera className="w-3.5 h-3.5 text-indigo-400" />
                        <span className="text-[11px] font-bold">
                          {isCompressingPrescription ? 'Comprimiendo...' : 'Adjuntar Receta (<0.2 seg)'}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={handlePrescriptionUpload}
                          className="hidden"
                          disabled={isCompressingPrescription}
                        />
                      </label>
                    )}
                  </div>

                  {/* Auto-Print Thermal Status Badge */}
                  <div className="p-2.5 bg-slate-950 border border-teal-500/30 rounded-xl space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200 flex items-center space-x-1.5 text-[11px]">
                        <Printer className="w-3.5 h-3.5 text-teal-400" />
                        <span>Impresión Automática</span>
                      </span>
                      <button
                        onClick={handleToggleAutoPrint}
                        className={`text-[10px] font-black px-2 py-0.5 rounded cursor-pointer ${autoPrintEnabled ? 'bg-teal-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}
                      >
                        {autoPrintEnabled ? 'ACTIVADA' : 'MANUAL'}
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400 truncate">
                      Rotulará en <strong className="text-teal-300 font-mono">{defaultPrinter.name}</strong>.
                    </p>
                  </div>

                </div>

                {/* Total & Submit Button */}
                <div className="pt-3 border-t border-white/10 space-y-2.5 relative z-10 shrink-0">
                  <div className="space-y-1.5 bg-slate-950/80 p-3 rounded-2xl border border-white/5 select-none">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Subtotal Exámenes:</span>
                      <span className="font-semibold text-slate-200 tabular-nums">${totalAmount.toFixed(2)}</span>
                    </div>

                    {isJubilado && discountAmount > 0 && (
                      <div className="flex items-center justify-between text-xs text-emerald-400">
                        <span>Desc. Ley 6 (Jubilado 20%):</span>
                        <span className="font-bold tabular-nums">-${discountAmount.toFixed(2)}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1.5 border-t border-white/10">
                      <span className="text-xs font-black uppercase tracking-wider text-slate-200">Total a Pagar:</span>
                      <div className="px-3 py-0.5 rounded-xl bg-teal-500/15 border border-teal-500/40 text-2xl font-black text-teal-300 tracking-tight tabular-nums select-none shadow-sm">
                        ${netPayableAmount.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleCreateOrderSubmit}
                    disabled={(!foundPatient && !isRegistering) || selectedTests.length === 0}
                    className={`w-full px-4 py-3 sm:py-3.5 rounded-2xl text-xs sm:text-sm font-black uppercase tracking-wider transition-all transform flex items-center justify-center gap-2 shadow-xl select-none ${
                      (!foundPatient && !isRegistering) || selectedTests.length === 0
                        ? 'bg-slate-800/80 text-slate-400 border border-slate-700/60 cursor-not-allowed shadow-none'
                        : isStat
                        ? 'bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 text-white shadow-rose-500/30 hover:-translate-y-0.5 active:scale-95 cursor-pointer'
                        : 'bg-gradient-to-r from-teal-500 via-emerald-400 to-teal-500 hover:brightness-105 text-slate-950 shadow-teal-500/25 hover:-translate-y-0.5 active:scale-95 cursor-pointer'
                    }`}
                    title={
                      !foundPatient && !isRegistering
                        ? 'Primero seleccione o registre un paciente'
                        : selectedTests.length === 0
                        ? 'Seleccione al menos un análisis clínico en el catálogo central para emitir la orden'
                        : 'Confirmar orden clínica e imprimir etiquetas [Alt+S]'
                    }
                  >
                    <CheckCircle2 className={`w-4 h-4 shrink-0 stroke-[2.5] ${((!foundPatient && !isRegistering) || selectedTests.length === 0) ? 'text-slate-400' : ''}`} />
                    <span className="text-center leading-snug">
                      {isStat ? 'Confirmar STAT e Imprimir Tubos' : 'Confirmar Orden e Imprimir'}
                    </span>
                  </button>

                  {selectedTests.length === 0 && (
                    <p className="text-[10px] text-amber-400 font-bold text-center">
                      💡 Seleccione análisis del catálogo para confirmar la orden
                    </p>
                  )}
                </div>

              </div>
            </div>

          </div>

        </div>
      
      ) : activeSubTab === 'TURNS' ? (
        /* SUBTAB 2: PATIENT QUEUE & TURN MANAGEMENT MODULE */
        <ReceptionTurnManagement
          onSelectPatientForAdmission={handleSelectPatientFromTurn}
          activeTicketId={activeAttendingTurnId}
        />
      ) : activeSubTab === 'MANAGEMENT' ? (
        /* SUBTAB 3: MANAGEMENT & LABEL REPRINTING WORKSPACE WITH CRITICAL ALERT FLAGGER & PAGINATION */
        <div className="max-w-6xl mx-auto space-y-4 animate-in fade-in duration-300 pb-20 px-3 sm:px-4">
          
          {/* Top Filter & Control Panel */}
          <div className="bg-slate-900/90 backdrop-blur-xl border-2 border-white/10 rounded-[2rem] p-4 sm:p-5 shadow-2xl space-y-3.5">
            
            {/* Row 1: Period Filter Tabs */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-white/10 pb-3 gap-3">
              <div className="flex items-center space-x-2 flex-wrap gap-y-2">
                <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5 mr-1">
                  <Calendar className="w-3.5 h-3.5 text-teal-400" />
                  Periodo:
                </span>
                <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-2xl border border-white/5 flex-wrap gap-y-1">
                  {[
                    { id: 'TODAY', label: '📅 Hoy', count: ordersTodayCount },
                    { id: 'WEEK', label: '🗓️ Esta Semana', count: ordersWeekCount },
                    { id: 'MONTH', label: '📆 Este Mes', count: ordersMonthCount },
                    { id: 'PENDING_OVERDUE', label: '⚠️ Rezago', count: ordersPendingOverdueCount, alert: true },
                    { id: 'ALL', label: '📚 Todo el Historial', count: orders.length }
                  ].map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setManagementPeriod(p.id as any);
                        setManagementPage(1);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer flex items-center space-x-1.5 ${
                        managementPeriod === p.id
                          ? p.alert
                            ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                            : p.id === 'ALL'
                            ? 'bg-slate-800 text-white shadow-md border border-white/20 font-black'
                            : 'bg-teal-500 text-slate-950 shadow-md font-black'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <span>{p.label}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-black ${
                        managementPeriod === p.id ? 'bg-slate-950 text-white' : 'bg-slate-850 text-slate-400'
                      }`}>
                        {p.count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Scope badge */}
              <div className="text-[11px] text-teal-300 font-mono flex items-center space-x-1.5 bg-teal-500/10 px-3 py-1 rounded-xl border border-teal-500/20 self-start lg:self-auto shrink-0">
                <Clock className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <span>
                  {managementPeriod === 'TODAY' && `Jornada: ${new Date().toLocaleDateString('es-PA', { weekday: 'short', day: 'numeric', month: 'short' })}`}
                  {managementPeriod === 'WEEK' && 'Filtro: Últimos 7 Días'}
                  {managementPeriod === 'MONTH' && `Mes: ${new Date().toLocaleDateString('es-PA', { month: 'long', year: 'numeric' })}`}
                  {managementPeriod === 'PENDING_OVERDUE' && 'Órdenes de días previos sin finalizar'}
                  {managementPeriod === 'ALL' && 'Historial Completo del Sistema'}
                </span>
              </div>
            </div>

            {/* Row 2: Search Input, Sorter Dropdown & Critical Alerts Filter */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              
              {/* Search input */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-teal-400 absolute left-4 top-3" />
                <input
                  type="text"
                  placeholder="Rastrear por Nº Orden, Cédula, Paciente o Médico tratante..."
                  value={managementSearchTerm}
                  onChange={(e) => {
                    setManagementSearchTerm(e.target.value);
                    setManagementPage(1);
                  }}
                  className="bg-slate-950 border border-white/10 rounded-2xl pl-11 pr-4 py-2.5 text-xs text-white placeholder-slate-500 font-bold tracking-tight outline-none focus:border-teal-500 w-full shadow-inner"
                />
              </div>

              {/* Sorter Selector */}
              <div className="flex items-center space-x-2 shrink-0 bg-slate-950 px-3 py-2 rounded-2xl border border-white/10 text-xs">
                <SlidersHorizontal className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <span className="text-slate-400 font-black text-[10.5px] uppercase tracking-wider shrink-0">Ordenar:</span>
                <select
                  value={managementSort}
                  onChange={(e) => {
                    setManagementSort(e.target.value as any);
                    setManagementPage(1);
                  }}
                  className="bg-transparent text-white font-bold text-xs outline-none cursor-pointer pr-1"
                >
                  <option value="DATE_DESC" className="bg-slate-900 text-white">🕒 Más Recientes Primero</option>
                  <option value="DATE_ASC" className="bg-slate-900 text-white">🕒 Más Antiguas Primero</option>
                  <option value="ORDER_NUM_ASC" className="bg-slate-900 text-white">🔢 Nº de Orden (0 → 9)</option>
                  <option value="ORDER_NUM_DESC" className="bg-slate-900 text-white">🔢 Nº de Orden (9 → 0)</option>
                  <option value="NAME_ASC" className="bg-slate-900 text-white">🔤 Paciente (A → Z)</option>
                  <option value="NAME_DESC" className="bg-slate-900 text-white">🔤 Paciente (Z → A)</option>
                </select>
              </div>

              {/* Critical Alert Filters */}
              <div className="flex items-center space-x-1.5 overflow-x-auto pb-0.5 shrink-0">
                {[
                  { id: 'ALL', label: `Todas` },
                  { id: 'CRITICAL_ONLY', label: `🚨 Críticas (${criticalStats.criticalCount})`, highlight: 'rose' },
                  { id: 'PENDING', label: `⏳ Por Notificar (${criticalStats.pendingCount})`, highlight: 'amber' },
                  { id: 'NOTIFIED', label: `✓ Notificadas (${criticalStats.notifiedCount})`, highlight: 'emerald' }
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => {
                      setCriticalFilter(f.id as any);
                      setManagementPage(1);
                    }}
                    className={`px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer whitespace-nowrap ${
                      criticalFilter === f.id
                        ? f.highlight === 'rose'
                          ? 'bg-rose-500 text-slate-950 shadow-lg shadow-rose-500/20 font-black'
                          : f.highlight === 'amber'
                          ? 'bg-amber-500 text-slate-950 shadow-lg font-black'
                          : f.highlight === 'emerald'
                          ? 'bg-emerald-500 text-slate-950 shadow-lg font-black'
                          : 'bg-teal-500 text-slate-950 shadow font-black'
                        : 'bg-slate-950 text-slate-400 hover:text-white border border-white/5'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Row 3: Pagination Header & Page Size Selector */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-2 border-t border-white/10 text-xs text-slate-400 gap-2">
              <div className="flex items-center space-x-2">
                <span className="font-bold">
                  {totalManagementOrders > 0 ? (
                    <>
                      Mostrando <strong className="text-white font-mono">{(safeManagementPage - 1) * managementPageSize + 1}</strong> - <strong className="text-white font-mono">{Math.min(safeManagementPage * managementPageSize, totalManagementOrders)}</strong> de <strong className="text-teal-300 font-mono">{totalManagementOrders}</strong> órdenes
                    </>
                  ) : (
                    '0 órdenes encontradas'
                  )}
                </span>
                {managementSearchTerm && (
                  <button
                    type="button"
                    onClick={() => {
                      setManagementSearchTerm('');
                      setManagementPage(1);
                    }}
                    className="text-[10px] text-rose-400 hover:underline font-bold cursor-pointer ml-1"
                  >
                    (Limpiar búsqueda)
                  </button>
                )}
              </div>

              {/* Items per page selector */}
              <div className="flex items-center space-x-1.5 self-end sm:self-auto">
                <span className="text-[11px] font-bold text-slate-400 uppercase">Mostrar por pág:</span>
                {[10, 25, 50, 100].map(sz => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => {
                      setManagementPageSize(sz);
                      setManagementPage(1);
                    }}
                    className={`px-2 py-0.5 rounded-lg text-[11px] font-mono font-bold transition cursor-pointer ${
                      managementPageSize === sz
                        ? 'bg-teal-500 text-slate-950 font-black shadow'
                        : 'bg-slate-950 text-slate-400 hover:text-white border border-white/5'
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Orders Cards List (Paginated) */}
          <div className="grid grid-cols-1 gap-4">
            {filteredOrdersManagement.length === 0 ? (
              <div className="p-10 text-center bg-slate-900/60 border border-white/10 rounded-3xl space-y-4 shadow-xl">
                <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center bg-slate-950 border border-white/10 shadow-inner">
                  {criticalFilter !== 'ALL' ? (
                    <AlertTriangle className="w-7 h-7 text-rose-400" />
                  ) : managementSearchTerm ? (
                    <Search className="w-7 h-7 text-teal-400" />
                  ) : (
                    <Clock className="w-7 h-7 text-slate-500" />
                  )}
                </div>

                <div className="space-y-1.5 max-w-lg mx-auto">
                  <h4 className="text-base font-black text-white">
                    {criticalFilter !== 'ALL'
                      ? criticalFilter === 'CRITICAL_ONLY'
                        ? 'No hay órdenes críticas en este periodo'
                        : criticalFilter === 'PENDING'
                        ? 'No hay alertas críticas pendientes de notificar en este periodo'
                        : 'No hay alertas críticas notificadas en este periodo'
                      : managementSearchTerm
                      ? `Sin resultados para "${managementSearchTerm}"`
                      : managementPeriod === 'TODAY'
                      ? 'No hay órdenes registradas para el día de hoy'
                      : managementPeriod === 'WEEK'
                      ? 'No hay órdenes registradas en esta semana'
                      : managementPeriod === 'MONTH'
                      ? 'No hay órdenes registradas en este mes'
                      : managementPeriod === 'PENDING_OVERDUE'
                      ? 'No hay órdenes pendientes de días anteriores'
                      : 'No se encontraron órdenes registradas'}
                  </h4>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {criticalFilter !== 'ALL' ? (
                      managementPeriod === 'TODAY' && ordersTodayCount > 0 ? (
                        <span>
                          Hay <strong className="text-teal-300 font-black">{ordersTodayCount} {ordersTodayCount === 1 ? 'orden' : 'órdenes'}</strong> registrada(s) hoy, pero ninguna presenta alertas críticas activas.
                          {criticalStats.allCriticalCount > 0 && (
                            <> Las <strong className="text-rose-400 font-black">{criticalStats.allCriticalCount} órdenes críticas activas</strong> corresponden a días anteriores (Pendientes / Rezago).</>
                          )}
                        </span>
                      ) : (
                        'Ninguna orden del periodo seleccionado coincide con el filtro de alerta crítica activo.'
                      )
                    ) : managementSearchTerm ? (
                      'No se encontró ninguna orden que coincida con el nombre, cédula o número de orden indicado.'
                    ) : managementPeriod === 'TODAY' ? (
                      `Aún no se han generado órdenes en la jornada de hoy (${new Date().toLocaleDateString('es-PA')}). Puedes consultar esta semana, el mes o el historial completo.`
                    ) : managementPeriod === 'PENDING_OVERDUE' ? (
                      '¡Excelente! No hay órdenes de días anteriores pendientes de procesar o entregar.'
                    ) : (
                      'No hay órdenes registradas en el sistema.'
                    )}
                  </p>
                </div>

                {/* Smart Action Buttons */}
                <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
                  {criticalFilter !== 'ALL' && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setCriticalFilter('ALL');
                          setManagementPage(1);
                        }}
                        className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs rounded-xl shadow-lg cursor-pointer transition flex items-center space-x-1.5"
                      >
                        <span>Mostrar Todas ({totalManagementOrders})</span>
                      </button>

                      {managementPeriod === 'TODAY' && criticalStats.allCriticalCount > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setManagementPeriod('PENDING_OVERDUE');
                            setCriticalFilter('CRITICAL_ONLY');
                            setManagementPage(1);
                          }}
                          className="px-4 py-2 bg-rose-500 hover:bg-rose-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-rose-500/20 cursor-pointer transition flex items-center space-x-1.5"
                        >
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Ir a las {criticalStats.allCriticalCount} Críticas en Pendientes</span>
                        </button>
                      )}
                    </>
                  )}

                  {managementSearchTerm && (
                    <button
                      type="button"
                      onClick={() => {
                        setManagementSearchTerm('');
                        setManagementPage(1);
                      }}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-black text-xs rounded-xl border border-white/10 cursor-pointer transition"
                    >
                      Limpiar Búsqueda
                    </button>
                  )}

                  {criticalFilter === 'ALL' && !managementSearchTerm && managementPeriod === 'TODAY' && (
                    <>
                      {ordersWeekCount > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setManagementPeriod('WEEK');
                            setManagementPage(1);
                          }}
                          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-black text-xs rounded-xl border border-white/10 cursor-pointer transition"
                        >
                          Ver Esta Semana ({ordersWeekCount})
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setManagementPeriod('ALL');
                          setManagementPage(1);
                        }}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-black text-xs rounded-xl border border-white/10 cursor-pointer transition"
                      >
                        Ver Todo el Historial ({orders.length})
                      </button>
                    </>
                  )}
                </div>
              </div>
            ) : (
              paginatedOrdersManagement.map(order => {
              const critInfo = getOrderCriticalInfo(order);
              const isNotified = critInfo.status === 'NOTIFICADO';
              const isPending = critInfo.status === 'PENDIENTE' || critInfo.status === 'REINTENTAR';

              return (
                <div
                  key={order.id}
                  className={`bg-slate-900/70 backdrop-blur-3xl border p-5 sm:p-6 rounded-[2.5rem] flex flex-col lg:flex-row lg:items-center justify-between gap-5 transition-all shadow-xl relative overflow-hidden group ${
                    critInfo.isPanic
                      ? 'border-rose-500/40 bg-gradient-to-r from-rose-950/20 via-slate-900/80 to-slate-900/80 ring-1 ring-rose-500/20'
                      : critInfo.isHighPriority
                      ? 'border-amber-500/30 bg-gradient-to-r from-amber-950/15 via-slate-900/80 to-slate-900/80'
                      : 'border-white/5 hover:bg-slate-800/80 hover:border-teal-500/20'
                  }`}
                >
                  {/* Left: Patient & Critical Details */}
                  <div className="flex items-start sm:items-center space-x-4 relative z-10">
                    <div className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center transition-all shadow-inner shrink-0 ${
                      critInfo.isPanic
                        ? 'bg-rose-500/20 border border-rose-500/50 text-rose-400 animate-pulse'
                        : critInfo.isHighPriority
                        ? 'bg-amber-500/20 border border-amber-500/40 text-amber-400'
                        : 'bg-slate-950 border border-white/5 text-teal-400'
                    }`}>
                      {critInfo.isPanic ? (
                        <Flame className="w-6 h-6 stroke-[2.5]" />
                      ) : critInfo.isHighPriority ? (
                        <AlertTriangle className="w-6 h-6" />
                      ) : (
                        <Barcode className="w-6 h-6 mb-0.5" />
                      )}
                    </div>

                    <div className="space-y-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="text-base sm:text-lg font-black text-white uppercase tracking-tight truncate">
                          {order.patientName}
                        </div>

                        {/* Visual Critical Alert Badges */}
                        {critInfo.isPanic ? (
                          <span className="px-2.5 py-1 rounded-full text-xs font-black uppercase bg-rose-500 text-slate-950 flex items-center space-x-1 shadow animate-pulse">
                            <Flame className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>ALERTA CRÍTICA</span>
                          </span>
                        ) : critInfo.isHighPriority ? (
                          <span className="px-2.5 py-1 rounded-full text-xs font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center space-x-1">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>ALTA PRIORIDAD</span>
                          </span>
                        ) : null}

                        <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold border ${order.priority === 'URGENCIA' ? 'bg-rose-500/20 border-rose-500/30 text-rose-400' : 'bg-blue-500/20 border-blue-500/30 text-blue-400'}`}>
                          {order.priority}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                        <div className="text-xs text-teal-300 font-mono font-black uppercase">{formatOrderNumber(order.orderNumber)}</div>
                        {isSameDay(order.createdAt) ? (
                          <span className="px-2 py-0.5 rounded-md bg-teal-500/20 text-teal-300 border border-teal-500/40 text-[10px] font-mono font-black">
                            HOY
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-white/10 text-[10px] font-mono font-bold">
                            {new Date(order.createdAt).toLocaleDateString('es-PA', { day: '2-digit', month: 'short' })}
                            {isPendingOverdue(order) && ' • REZAGO'}
                          </span>
                        )}
                        <div className="h-1.5 w-1.5 rounded-full bg-slate-700"></div>
                        <div className="text-xs text-slate-300 font-bold">Cédula: <span className="text-white font-mono">{order.patientNationalId}</span></div>
                        <div className="h-1.5 w-1.5 rounded-full bg-slate-700"></div>
                        <div className="text-xs text-slate-300 font-bold">{order.testIds.length} Análisis Solicitados</div>
                        {order.doctorName && (
                          <>
                            <div className="h-1.5 w-1.5 rounded-full bg-slate-700"></div>
                            <div className="text-xs text-slate-400 font-bold truncate max-w-[220px]">Méd: <span className="text-slate-200">{order.doctorName}</span></div>
                          </>
                        )}
                      </div>

                      {/* Critical Parameter Detail Snippet */}
                      {critInfo.summaryText && (
                        <div className="pt-1.5 flex flex-wrap items-center gap-2">
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border flex items-center space-x-1.5 ${
                            critInfo.isPanic
                              ? 'bg-rose-950/60 border-rose-500/40 text-rose-200'
                              : 'bg-amber-950/40 border-amber-500/30 text-amber-200'
                          }`}>
                            <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                            <span>{critInfo.summaryText}</span>
                          </span>

                          {isNotified ? (
                            <span className="text-xs font-bold text-emerald-400 flex items-center space-x-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Notificado: {critInfo.notificationRecord?.recipientName}</span>
                            </span>
                          ) : isPending ? (
                            <span className="text-xs font-bold text-rose-400 flex items-center space-x-1 animate-pulse">
                              <Clock className="w-3.5 h-3.5" />
                              <span>Pendiente de Notificación Inmediata</span>
                            </span>
                          ) : null}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions & Flag Toggle */}
                  <div className="flex flex-wrap items-center gap-2 relative z-10 pt-2 lg:pt-0 border-t lg:border-t-0 border-white/5 justify-end">
                    {/* Critical Notification Action Button */}
                    <button
                      onClick={() => handleOpenCriticalModal(order)}
                      className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow ${
                        critInfo.isPanic
                          ? 'bg-rose-500 hover:bg-rose-400 text-slate-950 shadow-rose-500/30 font-black ring-2 ring-rose-400/50 animate-pulse'
                          : critInfo.isHighPriority
                          ? isNotified
                            ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                            : 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-amber-500/20'
                          : 'bg-slate-950 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10'
                      }`}
                    >
                      {critInfo.isPanic ? (
                        <Flame className="w-4 h-4" />
                      ) : critInfo.isHighPriority ? (
                        <BellRing className="w-4 h-4" />
                      ) : (
                        <Flag className="w-4 h-4" />
                      )}
                      <span>
                        {isNotified
                          ? 'Ver Notificación'
                          : critInfo.isHighPriority
                          ? 'Notificar Inmediato'
                          : 'Alerta Inmediata'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenOrderCorrectionModal(order)}
                      className="flex items-center space-x-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-3.5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow hover:border-amber-400"
                      title="Corregir Nombre, Cédula, Teléfono o Médico en esta orden existente"
                    >
                      <Pencil className="w-4 h-4 text-amber-400" />
                      <span>Corregir</span>
                    </button>

                    <button
                      onClick={() => handleManualPrintLabels(order)}
                      className="flex items-center space-x-2 bg-slate-950 hover:bg-white/10 text-white border border-white/10 px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all hover:border-teal-500/30 cursor-pointer shadow"
                    >
                      <Printer className="w-4 h-4 text-teal-400" />
                      <span>Reimprimir Tubos</span>
                    </button>

                    <button
                      onClick={() => onOpenPdf(order.id)}
                      className="h-11 px-4 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-2xl flex items-center justify-center space-x-1.5 font-black text-xs uppercase tracking-wider shadow-lg active:scale-90 transition-all cursor-pointer shrink-0"
                      title="Ver Informe Médico en Tamaño Carta"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Carta</span>
                    </button>
                  </div>
                </div>
              );
            }))}
          </div>

          {/* Pagination Navigation Bar */}
          {totalManagementOrders > 0 && (
            <div className="bg-slate-900/90 backdrop-blur-xl border-2 border-white/10 rounded-2xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl">
              <div className="text-xs text-slate-400 font-bold flex items-center space-x-2">
                <span>
                  Página <strong className="text-white font-mono">{safeManagementPage}</strong> de <strong className="text-teal-300 font-mono">{totalManagementPages}</strong>
                </span>
                <span>•</span>
                <span>Total: <strong className="text-white font-mono">{totalManagementOrders}</strong> órdenes</span>
              </div>

              {totalManagementPages > 1 && (
                <div className="flex items-center space-x-1.5 flex-wrap justify-center">
                  <button
                    type="button"
                    onClick={() => setManagementPage(1)}
                    disabled={safeManagementPage === 1}
                    className="p-2 rounded-xl bg-slate-950 border border-white/10 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition shadow-sm"
                    title="Primera Página"
                  >
                    <ChevronsLeft className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setManagementPage(p => Math.max(1, p - 1))}
                    disabled={safeManagementPage === 1}
                    className="px-3 py-1.5 rounded-xl bg-slate-950 border border-white/10 text-xs font-bold text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition flex items-center space-x-1 shadow-sm"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Anterior</span>
                  </button>

                  {/* Page numbers */}
                  {Array.from({ length: totalManagementPages }).map((_, idx) => {
                    const pageNum = idx + 1;
                    if (pageNum !== 1 && pageNum !== totalManagementPages && Math.abs(pageNum - safeManagementPage) > 2) {
                      if (pageNum === 2 || pageNum === totalManagementPages - 1) {
                        return <span key={pageNum} className="text-slate-600 text-xs font-mono px-1">...</span>;
                      }
                      return null;
                    }
                    return (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => setManagementPage(pageNum)}
                        className={`w-8 h-8 rounded-xl text-xs font-black font-mono transition cursor-pointer shadow-sm ${
                          safeManagementPage === pageNum
                            ? 'bg-teal-500 text-slate-950 shadow-teal-500/20'
                            : 'bg-slate-950 text-slate-400 hover:text-white border border-white/5'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() => setManagementPage(p => Math.min(totalManagementPages, p + 1))}
                    disabled={safeManagementPage === totalManagementPages}
                    className="px-3 py-1.5 rounded-xl bg-slate-950 border border-white/10 text-xs font-bold text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition flex items-center space-x-1 shadow-sm"
                  >
                    <span>Siguiente</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setManagementPage(totalManagementPages)}
                    disabled={safeManagementPage === totalManagementPages}
                    className="p-2 rounded-xl bg-slate-950 border border-white/10 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition shadow-sm"
                    title="Última Página"
                  >
                    <ChevronsRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

        </div>
      ) : activeSubTab === 'PRINT' ? (
        /* SUBTAB 4: PRINT RESULTS WITH ADVANCED SEARCH & FILTERS */
        <div className="space-y-6 pb-20 px-4 animate-in fade-in duration-300">
          {/* SEARCH & FILTERS HEADER FOR ENTREGA DE RESULTADOS */}
          <div className="bg-slate-900/80 backdrop-blur-3xl border border-white/10 p-5 rounded-[2.5rem] shadow-xl space-y-4">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
              
              {/* Search Bar */}
              <div className="relative w-full lg:flex-1">
                <Search className="w-4 h-4 text-teal-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Buscar por Nombre de Paciente, Cédula (ej. 8-415), o N° de Orden (ej. 26101290001)..."
                  value={printSearchTerm}
                  onChange={e => setPrintSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-10 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs sm:text-sm text-white placeholder-slate-500 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition font-sans shadow-inner"
                />
                {printSearchTerm && (
                  <button
                    onClick={() => setPrintSearchTerm('')}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 cursor-pointer"
                    title="Limpiar búsqueda"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Status Filter Chips */}
              <div className="flex items-center space-x-2 overflow-x-auto w-full lg:w-auto pb-1 lg:pb-0">
                {[
                  { id: 'ALL', label: 'Todos', count: printStats.total },
                  { id: 'READY', label: 'Listos para Entrega', count: printStats.ready, color: 'text-emerald-400' },
                  { id: 'PENDING', label: 'En Proceso', count: printStats.pending, color: 'text-amber-400' },
                  { id: 'PANIC', label: '🚨 Pánico / Crítico', count: printStats.panic, color: 'text-rose-400' }
                ].map(filterTab => (
                  <button
                    key={filterTab.id}
                    onClick={() => setPrintStatusFilter(filterTab.id as any)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap flex items-center space-x-1.5 ${
                      printStatusFilter === filterTab.id
                        ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20 font-black'
                        : 'bg-slate-950 text-slate-300 hover:text-white border border-slate-800'
                    }`}
                  >
                    <span>{filterTab.label}</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                      printStatusFilter === filterTab.id ? 'bg-slate-950/40 text-slate-950 font-black' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {filterTab.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Sub-bar with results count */}
            <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 pt-2 border-t border-white/5">
              <span>Mostrando <strong>{filteredPrintOrders.length}</strong> órdenes con resultados de laboratorio</span>
              {printSearchTerm && (
                <span className="text-teal-400 font-mono">Filtro aplicado: &quot;{printSearchTerm}&quot;</span>
              )}
            </div>
          </div>

          {/* Empty State when no results match search */}
          {filteredPrintOrders.length === 0 ? (
            <div className="bg-slate-900/40 border border-slate-800 p-12 rounded-[2.5rem] text-center space-y-3">
              <Search className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-white font-bold text-sm">No se encontraron órdenes para entrega</p>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                No hay órdenes que coincidan con la búsqueda &quot;{printSearchTerm}&quot; o el filtro seleccionado.
              </p>
              {printSearchTerm && (
                <button
                  onClick={() => setPrintSearchTerm('')}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Limpiar Filtros
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
          {filteredPrintOrders.map(order => {
            const critInfo = getOrderCriticalInfo(order);

            return (
              <div
                key={order.id}
                className={`bg-slate-900/60 backdrop-blur-3xl border p-6 rounded-[2.5rem] hover:bg-slate-800/80 transition-all shadow-xl relative overflow-hidden group space-y-4 ${
                  critInfo.isPanic
                    ? 'border-rose-500/50 ring-1 ring-rose-500/30 bg-rose-950/10'
                    : critInfo.isHighPriority
                    ? 'border-amber-500/40 bg-amber-950/10'
                    : 'border-white/5'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${
                      critInfo.isPanic
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse'
                        : critInfo.isHighPriority
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-slate-950 border border-white/5 text-emerald-400'
                    }`}>
                      {critInfo.isPanic ? <Flame className="w-6 h-6" /> : <User className="w-6 h-6" />}
                    </div>
                    <div>
                      <div className="text-base sm:text-lg font-black text-white uppercase tracking-tight leading-snug break-words">{order.patientName}</div>
                      <div className="text-xs text-slate-300 font-mono font-bold mt-0.5">Cédula: {order.patientNationalId} • {order.patientAge} Años</div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end space-y-1">
                    <div className={`px-3 py-1 rounded-full text-xs font-black border ${order.status === 'VALIDADA_MED' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-amber-500/10 border-amber-500/30 text-amber-400'}`}>
                      {order.status === 'VALIDADA_MED' ? 'LISTO' : 'EN PROCESO'}
                    </div>

                    {critInfo.isPanic && (
                      <span className="px-2.5 py-0.5 rounded-md text-xs font-black uppercase bg-rose-500 text-slate-950 animate-pulse shadow">
                        🚨 PÁNICO
                      </span>
                    )}
                  </div>
                </div>

                {/* Critical Alert summary on card */}
                {critInfo.summaryText && (
                  <div className="p-3 bg-slate-950/80 rounded-2xl border border-white/5 flex items-center justify-between text-xs">
                    <span className="text-rose-300 font-bold truncate max-w-[220px]">{critInfo.summaryText}</span>
                    <button
                      onClick={() => handleOpenCriticalModal(order)}
                      className="text-xs text-teal-400 hover:underline uppercase font-bold cursor-pointer"
                    >
                      Ver Aviso
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-white/5">
                  <div className="text-xs sm:text-sm text-teal-300 font-black font-mono">{formatOrderNumber(order.orderNumber)}</div>
                  <div className="flex items-center space-x-2">
                    {critInfo.isHighPriority && (
                      <button
                        onClick={() => handleOpenCriticalModal(order)}
                        className="px-3.5 py-2.5 bg-rose-500/20 hover:bg-rose-500 hover:text-slate-950 text-rose-300 border border-rose-500/40 rounded-xl text-xs font-black uppercase transition cursor-pointer"
                      >
                        Notificación
                      </button>
                    )}
                    <button
                      onClick={() => onOpenPdf(order.id)}
                      className="flex items-center space-x-2 bg-teal-500 hover:bg-teal-400 text-slate-950 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-teal-500/20 transition-all cursor-pointer active:scale-95"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Reporte Carta</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
            </div>
          )}
        </div>
      ) : (
        /* SUBTAB 5: PRINTER FLEET MANAGEMENT SERVICE */
        <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500 pb-20 px-4">
          
          {/* Header Card */}
          <div className="bg-slate-900/60 backdrop-blur-3xl border border-white/5 p-6 rounded-[2.5rem] shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400 shadow-inner">
                <Printer className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-white uppercase tracking-tight">Flota de Impresoras Térmicas de Etiquetas</h3>
                <p className="text-xs text-slate-400">Registra y administra tus impresoras reales (Red TCP/IP 9100, USB o Impresora del Sistema)</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setEditingPrinterId(null);
                  setPrinterFormData({
                    name: '',
                    model: 'Zebra ZD421',
                    connectionType: 'NETWORK_TCP_9100',
                    ipAddress: '',
                    port: '9100',
                    location: 'Ventanilla de Recepción',
                    branch: currentBranch?.name || 'Sede Vía España',
                    dpi: 203,
                    emulation: 'ZPL',
                    labelWidthMm: '50',
                    labelHeightMm: '25',
                    isDefault: printersList.length === 0
                  });
                  setIsPrinterFormOpen(true);
                }}
                className="px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-wider bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition cursor-pointer flex items-center space-x-1.5 shadow-lg shadow-cyan-500/20"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Agregar Impresora</span>
              </button>

              <button
                type="button"
                onClick={handleToggleAutoPrint}
                className={`px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-wider border transition cursor-pointer flex items-center space-x-2 ${
                  autoPrintEnabled
                    ? 'bg-teal-500 text-slate-950 border-teal-400 shadow-lg shadow-teal-500/20'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>Auto-Print: {autoPrintEnabled ? 'ACTIVADO' : 'DESACTIVADO'}</span>
              </button>
            </div>
          </div>

          {/* Printer Devices Grid (Solo impresoras reales configuradas, sin simulación) */}
          {printersList.length === 0 ? (
            <div className="bg-slate-900/70 border border-dashed border-slate-700 rounded-[2rem] p-10 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-950 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mx-auto shadow-inner">
                <Printer className="w-8 h-8" />
              </div>
              <div className="space-y-1 max-w-md mx-auto">
                <h4 className="text-base font-black text-white">No hay impresoras térmicas registradas</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Agrega tu impresora real de etiquetas (Zebra, TSC, Brother, Citizen, Bixolon o impresora de Windows) por <strong className="text-slate-200">IP Red (Puerto 9100)</strong>, <strong className="text-slate-200">USB Local</strong> o <strong className="text-slate-200">Diálogo del Sistema</strong>.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingPrinterId(null);
                  setPrinterFormData({
                    name: '',
                    model: 'Zebra ZD421',
                    connectionType: 'NETWORK_TCP_9100',
                    ipAddress: '',
                    port: '9100',
                    location: 'Ventanilla de Recepción',
                    branch: currentBranch?.name || 'Sede Vía España',
                    dpi: 203,
                    emulation: 'ZPL',
                    labelWidthMm: '50',
                    labelHeightMm: '25',
                    isDefault: true
                  });
                  setIsPrinterFormOpen(true);
                }}
                className="px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 transition cursor-pointer inline-flex items-center space-x-2 shadow-lg shadow-cyan-500/20"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Agregar Primera Impresora</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {printersList.map(printer => {
                const isDefault = printer.id === selectedDefaultPrinterId;
                const connLabel =
                  printer.connectionType === 'NETWORK_TCP_9100'
                    ? `${printer.ipAddress || 'Sin IP'}:${printer.port || 9100}`
                    : printer.connectionType === 'USB_BRIDGE'
                    ? `USB Local${printer.ipAddress ? ` (${printer.ipAddress})` : ''}`
                    : printer.connectionType === 'SYSTEM_PRINT'
                    ? 'Impresora del Sistema (Windows)'
                    : `WebSocket (${printer.ipAddress || 'localhost'})`;

                return (
                  <div
                    key={printer.id}
                    className={`bg-slate-900/80 backdrop-blur-xl border rounded-[2rem] p-6 shadow-xl space-y-4 relative overflow-hidden transition flex flex-col justify-between ${
                      isDefault
                        ? 'border-teal-500/60 ring-2 ring-teal-500/20'
                        : 'border-white/5'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center space-x-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-slate-950 border border-white/5 flex items-center justify-center text-teal-400 shrink-0">
                            <Tag className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-sm font-black text-white uppercase leading-tight truncate">{printer.name}</h4>
                            <span className="text-[10px] text-slate-400 font-mono block truncate">{printer.model}</span>
                          </div>
                        </div>

                        {isDefault ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-teal-500/20 text-teal-300 border border-teal-500/40 shrink-0">
                            PREDETERMINADA
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleChangeDefaultPrinter(printer.id)}
                            className="px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase bg-slate-950 text-slate-400 hover:text-white border border-slate-800 cursor-pointer shrink-0"
                          >
                            Elegir por Defecto
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-slate-950 p-3 rounded-xl border border-white/5">
                          <span className="text-[8px] font-mono text-slate-500 uppercase block">Conexión / IP:</span>
                          <span className="font-mono text-teal-300 text-[11px] font-bold truncate block">
                            {connLabel}
                          </span>
                        </div>
                        <div className="bg-slate-950 p-3 rounded-xl border border-white/5">
                          <span className="text-[8px] font-mono text-slate-500 uppercase block">Emulación &amp; DPI:</span>
                          <span className="font-mono text-white text-[11px] font-bold">
                            {printer.emulation} • {printer.dpi} DPI
                          </span>
                        </div>
                        <div className="bg-slate-950 p-3 rounded-xl border border-white/5">
                          <span className="text-[8px] font-mono text-slate-500 uppercase block">Formato Etiqueta:</span>
                          <span className="font-mono text-emerald-400 text-[11px] font-bold">
                            {printer.labelWidthMm} × {printer.labelHeightMm} mm
                          </span>
                        </div>
                        <div className="bg-slate-950 p-3 rounded-xl border border-white/5">
                          <span className="text-[8px] font-mono text-slate-500 uppercase block">Ubicación:</span>
                          <span className="text-slate-300 text-[10px] truncate block">
                            {printer.location}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-white/5 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="text-slate-500 text-[10px]">{printer.branch}</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingPrinterId(printer.id);
                            setPrinterFormData({
                              name: printer.name,
                              model: printer.model,
                              connectionType: printer.connectionType,
                              ipAddress: printer.ipAddress || '',
                              port: String(printer.port || 9100),
                              location: printer.location,
                              branch: printer.branch,
                              dpi: printer.dpi,
                              emulation: printer.emulation,
                              labelWidthMm: String(printer.labelWidthMm || 50),
                              labelHeightMm: String(printer.labelHeightMm || 25),
                              isDefault: printer.isDefault
                            });
                            setIsPrinterFormOpen(true);
                          }}
                          className="px-2.5 py-1.5 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 font-bold rounded-xl text-[10px] transition cursor-pointer"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            printerService.removePrinter(printer.id);
                            setPrintersList(printerService.getPrinters());
                            setSelectedDefaultPrinterId(printerService.getDefaultPrinter().id);
                            notifyToast(`Impresora "${printer.name}" eliminada.`, 'info');
                          }}
                          className="px-2.5 py-1.5 bg-rose-950/50 hover:bg-rose-900/60 text-rose-300 border border-rose-500/30 font-bold rounded-xl text-[10px] transition cursor-pointer"
                        >
                          Eliminar
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (printer.connectionType === 'SYSTEM_PRINT') {
                              window.print();
                            } else {
                              notifyToast(`✓ Configuración lista para ${printer.name} (${connLabel})`, 'success');
                            }
                          }}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-teal-300 font-bold rounded-xl text-[10px] transition cursor-pointer"
                        >
                          Probar
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

          {/* Modal Agregar / Editar Impresora Térmica Real */}
          {isPrinterFormOpen && typeof document !== 'undefined' && createPortal(
            <div className="fixed inset-0 z-[100020] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
              <div className="bg-slate-900 border border-cyan-500/30 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl text-slate-100">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 flex items-center justify-center">
                      <Printer className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white uppercase">
                        {editingPrinterId ? 'Editar Impresora Térmica' : 'Agregar Impresora Térmica'}
                      </h4>
                      <p className="text-[11px] text-slate-400">Configuración real de hardware de etiquetas</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsPrinterFormOpen(false)}
                    className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-300 block mb-1">Nombre *</label>
                      <input
                        type="text"
                        placeholder="Ej: Zebra ZD421 Recepción"
                        value={printerFormData.name}
                        onChange={(e) => setPrinterFormData({ ...printerFormData, name: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold outline-none focus:border-cyan-400"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-300 block mb-1">Modelo</label>
                      <input
                        type="text"
                        placeholder="Ej: Zebra ZD421 / TSC TTP-244"
                        value={printerFormData.model}
                        onChange={(e) => setPrinterFormData({ ...printerFormData, model: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold outline-none focus:border-cyan-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-300 block mb-1">Tipo de Conexión</label>
                    <select
                      value={printerFormData.connectionType}
                      onChange={(e) => setPrinterFormData({ ...printerFormData, connectionType: e.target.value as ThermalPrinterDevice['connectionType'] })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold outline-none cursor-pointer"
                    >
                      <option value="NETWORK_TCP_9100">Red Local TCP/IP (Puerto Raw 9100)</option>
                      <option value="USB_BRIDGE">USB / Puente Local (Windows)</option>
                      <option value="SYSTEM_PRINT">Impresora del Sistema (Diálogo de Windows)</option>
                      <option value="WEBSOCKET">WebSocket / Agente Local</option>
                    </select>
                  </div>

                  {(printerFormData.connectionType === 'NETWORK_TCP_9100' || printerFormData.connectionType === 'WEBSOCKET') && (
                    <div className="grid grid-cols-3 gap-2.5">
                      <div className="col-span-2">
                        <label className="text-[10px] font-black uppercase text-slate-300 block mb-1">Dirección IP / Host *</label>
                        <input
                          type="text"
                          placeholder="Ej: 192.168.1.105"
                          value={printerFormData.ipAddress}
                          onChange={(e) => setPrinterFormData({ ...printerFormData, ipAddress: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-teal-300 font-mono font-bold outline-none focus:border-cyan-400"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase text-slate-300 block mb-1">Puerto</label>
                        <input
                          type="number"
                          placeholder="9100"
                          value={printerFormData.port}
                          onChange={(e) => setPrinterFormData({ ...printerFormData, port: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-teal-300 font-mono font-bold outline-none focus:border-cyan-400"
                        />
                      </div>
                    </div>
                  )}

                  {printerFormData.connectionType === 'USB_BRIDGE' && (
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-300 block mb-1">Puerto / Nombre Compartido USB</label>
                      <input
                        type="text"
                        placeholder="Ej: USB001 o \\\\PC-RECEPCION\\ZebraZD421"
                        value={printerFormData.ipAddress}
                        onChange={(e) => setPrinterFormData({ ...printerFormData, ipAddress: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-teal-300 font-mono font-bold outline-none focus:border-cyan-400"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-300 block mb-1">Emulación</label>
                      <select
                        value={printerFormData.emulation}
                        onChange={(e) => setPrinterFormData({ ...printerFormData, emulation: e.target.value as ThermalPrinterDevice['emulation'] })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2 py-2 text-xs text-white font-mono font-bold outline-none"
                      >
                        <option value="ZPL">ZPL-II</option>
                        <option value="TSPL">TSPL</option>
                        <option value="EPL">EPL</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-300 block mb-1">DPI</label>
                      <select
                        value={printerFormData.dpi}
                        onChange={(e) => setPrinterFormData({ ...printerFormData, dpi: Number(e.target.value) as 203 | 300 })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2 py-2 text-xs text-white font-mono font-bold outline-none"
                      >
                        <option value={203}>203 DPI</option>
                        <option value={300}>300 DPI</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-300 block mb-1">Ancho (mm)</label>
                      <input
                        type="number"
                        value={printerFormData.labelWidthMm}
                        onChange={(e) => setPrinterFormData({ ...printerFormData, labelWidthMm: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2 py-2 text-xs text-white font-mono font-bold outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-300 block mb-1">Alto (mm)</label>
                      <input
                        type="number"
                        value={printerFormData.labelHeightMm}
                        onChange={(e) => setPrinterFormData({ ...printerFormData, labelHeightMm: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2 py-2 text-xs text-white font-mono font-bold outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-300 block mb-1">Ubicación</label>
                      <input
                        type="text"
                        placeholder="Ej: Box Flebotomía 1"
                        value={printerFormData.location}
                        onChange={(e) => setPrinterFormData({ ...printerFormData, location: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-300 block mb-1">Sede</label>
                      <input
                        type="text"
                        placeholder="Ej: Sede Vía España"
                        value={printerFormData.branch}
                        onChange={(e) => setPrinterFormData({ ...printerFormData, branch: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold outline-none"
                      />
                    </div>
                  </div>

                  <label className="flex items-center gap-2 pt-1 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={printerFormData.isDefault}
                      onChange={(e) => setPrinterFormData({ ...printerFormData, isDefault: e.target.checked })}
                      className="rounded border-slate-700 bg-slate-950 text-teal-500"
                    />
                    <span className="text-xs font-bold text-slate-300">Establecer como impresora predeterminada</span>
                  </label>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsPrinterFormOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const cleanName = printerFormData.name.trim();
                      if (!cleanName) {
                        notifyToast('Ingresa el nombre de la impresora.', 'warning');
                        return;
                      }
                      if (printerFormData.connectionType === 'NETWORK_TCP_9100' && !printerFormData.ipAddress.trim()) {
                        notifyToast('Ingresa la dirección IP de la impresora de red.', 'warning');
                        return;
                      }
                      const payload: Omit<ThermalPrinterDevice, 'id'> = {
                        name: cleanName,
                        model: printerFormData.model.trim() || 'Impresora Térmica',
                        connectionType: printerFormData.connectionType,
                        ipAddress: printerFormData.ipAddress.trim() || undefined,
                        port: Number(printerFormData.port) || 9100,
                        location: printerFormData.location.trim() || 'Recepción',
                        branch: printerFormData.branch.trim() || currentBranch?.name || 'Sede Principal',
                        dpi: printerFormData.dpi,
                        emulation: printerFormData.emulation,
                        status: 'ONLINE',
                        isDefault: printerFormData.isDefault,
                        labelWidthMm: Number(printerFormData.labelWidthMm) || 50,
                        labelHeightMm: Number(printerFormData.labelHeightMm) || 25,
                        remainingLabels: 0,
                        ribbonLevelPct: 100
                      };

                      if (editingPrinterId) {
                        printerService.updatePrinter(editingPrinterId, payload);
                        notifyToast(`✓ Impresora "${cleanName}" actualizada.`, 'success');
                      } else {
                        printerService.addPrinter(payload);
                        notifyToast(`✓ Impresora "${cleanName}" agregada.`, 'success');
                      }
                      setPrintersList(printerService.getPrinters());
                      setSelectedDefaultPrinterId(printerService.getDefaultPrinter().id);
                      setIsPrinterFormOpen(false);
                    }}
                    className="px-5 py-2 rounded-xl text-xs font-black uppercase bg-teal-500 hover:bg-teal-400 text-slate-950 cursor-pointer shadow-lg shadow-teal-500/20"
                  >
                    {editingPrinterId ? 'Guardar Cambios' : 'Guardar Impresora'}
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )}

        </div>
      )}

      {/* CRITICAL NOTIFICATION MODAL */}
      <CriticalNotificationModal
        isOpen={!!selectedOrderForCriticalModal}
        onClose={() => setSelectedOrderForCriticalModal(null)}
        order={selectedOrderForCriticalModal}
        patient={selectedModalPatient}
        criticalResults={selectedOrderForCriticalModal ? getOrderCriticalInfo(selectedOrderForCriticalModal).criticalResults : []}
        notificationRecord={selectedOrderForCriticalModal ? criticalNotifications[selectedOrderForCriticalModal.id] : null}
        onSaveNotification={handleSaveNotificationRecord}
        onToggleFlag={handleToggleOrderCriticalFlag}
      />

      {/* SUCCESS & AUTO-PRINTED LABELS MODAL */}
      {showSuccessDialog && createdOrderSummary && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/98 backdrop-blur-3xl animate-in fade-in duration-300 overflow-y-auto">
          <div className="bg-slate-900 border-2 border-teal-500/40 rounded-[3rem] p-6 sm:p-8 max-w-4xl w-full text-center space-y-6 shadow-[0_0_150px_rgba(20,184,166,0.25)] relative my-auto">
            
            <div className="w-20 h-20 bg-teal-500/20 rounded-[2rem] flex items-center justify-center mx-auto border border-teal-500/40 shadow-inner">
              <CheckCircle2 className="w-10 h-10 text-teal-400 stroke-[3]" />
            </div>

            <div>
              <div className="inline-flex flex-col items-center justify-center px-6 py-2.5 rounded-2xl bg-slate-950 border-2 border-teal-400 text-teal-300 font-mono font-black shadow-lg shadow-teal-500/20 tracking-wider">
                <span className="text-[10px] text-teal-400 font-bold uppercase tracking-widest block mb-0.5">Código Oficial Orden / Muestra</span>
                <span className="text-lg sm:text-xl text-white">{formatOrderNumber(createdOrderSummary.orderNumber)}</span>
              </div>

              {createdOrderSummary.specimens && createdOrderSummary.specimens.length > 0 && (
                <div className="flex flex-wrap items-center justify-center gap-2 pt-3">
                  {createdOrderSummary.specimens.map((sp, idx) => (
                    <span key={sp.id || idx} className="px-3 py-1 bg-slate-950/80 border border-teal-500/40 rounded-xl text-xs font-mono font-bold text-teal-300 shadow-sm">
                      Tubo {idx + 1}: <strong className="text-white font-mono">{sp.barcode}</strong>
                    </span>
                  ))}
                </div>
              )}

              <h2 className="text-2xl font-black text-white tracking-tight uppercase mt-3">
                Ingreso de Paciente Exitoso
              </h2>
              <p className="text-slate-400 text-xs font-bold mt-1">
                {createdOrderSummary.patientName} • Cédula: {createdOrderSummary.patientNationalId}
              </p>
            </div>

            {/* Patient Portal Access Code Section */}
            {portalAccessCode && (
              <div className="bg-slate-950 p-6 rounded-3xl border-2 border-dashed border-teal-500/30 space-y-4">
                <div className="flex items-center justify-center gap-2 text-teal-400">
                  <Globe size={18} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Acceso a Resultados Online</span>
                </div>
                <div className="text-4xl font-black text-white tracking-[0.3em] font-mono">
                  {portalAccessCode}
                </div>
                <p className="text-[9px] text-slate-500 uppercase font-bold">Entregue este código al paciente para consultar en<br/>www.plataforma-lis.com/portal</p>
                <div className="flex justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const patient = patients.find(p => p.id === createdOrderSummary.patientId);
                      const rawPhone = (patient?.phone || '').replace(/[^0-9]/g, '');
                      const finalPhone = rawPhone.startsWith('507') ? rawPhone : (rawPhone ? `507${rawPhone}` : '');
                      const portalUrl = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
                        ? 'https://www.plataforma-lis.com/portal'
                        : `${window.location.origin}/portal`;
                      const smsMsg = `LABORATORIO CLINICO: Estimado(a) ${createdOrderSummary.patientName}, su orden ${formatOrderNumber(createdOrderSummary.orderNumber)} fue ingresada. Codigo de Acceso: ${portalAccessCode}. Consulte en: ${portalUrl}`;
                      window.open(`sms:${finalPhone}?body=${encodeURIComponent(smsMsg)}`, '_blank');
                    }}
                    className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 text-teal-300 px-3 py-1.5 rounded-xl text-[9px] font-black transition-all cursor-pointer"
                  >
                    <Smartphone size={14} /> SMS
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const patient = patients.find(p => p.id === createdOrderSummary.patientId);
                      const rawPhone = (patient?.phone || '').replace(/[^0-9]/g, '');
                      const finalPhone = rawPhone.startsWith('507') ? rawPhone : (rawPhone ? `507${rawPhone}` : '');
                      const labName = ((createdOrderSummary as any).tenantName || 'LABORATORIO CLÍNICO').toUpperCase();
                      const portalUrl = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
                        ? 'https://www.plataforma-lis.com/portal'
                        : `${window.location.origin}/portal`;
                      const msg = `*${labName}*\n\nEstimado(a) *${createdOrderSummary.patientName}*,\nLe confirmamos el ingreso exitoso de su orden médica *${formatOrderNumber(createdOrderSummary.orderNumber)}*.\n\n*Código de Acceso:* ${portalAccessCode}\n*Consulte sus resultados en:* ${portalUrl}\n\n_Le notificaremos cuando sus análisis hayan sido completados._`;
                      window.open(`https://api.whatsapp.com/send?phone=${finalPhone}&text=${encodeURIComponent(msg)}`, '_blank');
                    }}
                    className="flex items-center gap-1.5 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/30 text-emerald-300 px-3 py-1.5 rounded-xl text-[9px] font-black transition-all cursor-pointer"
                  >
                    <Smartphone size={14} /> WHATSAPP
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenOrderCorrectionModal(createdOrderSummary)}
                    className="flex items-center gap-1.5 bg-amber-950/80 hover:bg-amber-900 border border-amber-500/30 text-amber-300 px-3 py-1.5 rounded-xl text-[9px] font-black transition-all cursor-pointer"
                    title="¿Hubo un error en el nombre o datos? Corregir directamente en esta orden"
                  >
                    <Pencil size={14} className="text-amber-400" /> CORREGIR DATOS
                  </button>
                </div>
              </div>
            )}

            {/* Critical Alert Indicator in Success Dialog */}
            {createdOrderSummary.priority === 'URGENCIA' && (
              <div className="p-3 bg-rose-950/50 border border-rose-500/40 rounded-2xl flex items-center justify-between text-left">
                <div className="flex items-center space-x-2.5">
                  <Flame className="w-5 h-5 text-rose-400 animate-pulse shrink-0" />
                  <div>
                    <span className="text-xs font-black text-rose-300 uppercase block">Orden URGENCIA Registrada</span>
                    <span className="text-[10px] text-slate-300">Pre-activada en la lista de notificación inmediata de recepción.</span>
                  </div>
                </div>
                <button
                  onClick={() => handleOpenCriticalModal(createdOrderSummary)}
                  className="px-3 py-1.5 bg-rose-500 text-slate-950 rounded-xl text-[9px] font-black uppercase hover:bg-rose-400 transition cursor-pointer shrink-0"
                >
                  Protocolo
                </button>
              </div>
            )}

            {/* Auto-Print Result Card with Official Clinical Specimen Label Design */}
            {lastAutoPrintStatus && (
              <div className="bg-slate-950/90 p-5 rounded-3xl border border-teal-500/30 text-left space-y-4 shadow-inner">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <div className="flex items-center space-x-2 text-teal-300 font-bold text-xs">
                    <Printer className="w-4 h-4 text-teal-400" />
                    <span>Etiquetas Oficiales de Flebotomía Generadas:</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-slate-400">
                    {lastAutoPrintStatus.printerName}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {lastAutoPrintStatus.labels.map((lbl, idx) => (
                    <SpecimenTubeLabelCard
                      key={lbl.id || idx}
                      label={lbl}
                      tubeIndex={idx + 1}
                      totalTubes={lastAutoPrintStatus.labels.length}
                      onViewZpl={(labelItem) => {
                        setSelectedLabelForZpl(labelItem);
                        setIsZplPreviewOpen(true);
                      }}
                      onPrintSingle={async (labelItem) => {
                        const res = await printerService.printOrderSpecimenLabels(createdOrderSummary, undefined, {
                          customLabels: [labelItem],
                          autoTriggered: false
                        });
                        notifyToast(`✓ Etiqueta ${labelItem.sampleBarcode} enviada a ${res.printer.name}`, 'success');
                      }}
                    />
                  ))}
                </div>

                <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-white/5">
                  <span>{lastAutoPrintStatus.labelsCount} etiqueta(s) listas para rotular tubos primarios.</span>
                  <button
                    onClick={() => printerService.printOrderSpecimenLabels(createdOrderSummary)}
                    className="text-teal-300 hover:text-white font-bold underline flex items-center space-x-1 cursor-pointer"
                  >
                    <RotateCw className="w-3 h-3" />
                    <span>Reimprimir Todas</span>
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => onOpenPdf(createdOrderSummary.id)}
                className="py-3.5 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition cursor-pointer flex items-center justify-center space-x-2"
              >
                <FileText className="w-4 h-4 text-teal-400" />
                <span>Orden Médica</span>
              </button>

              <button
                onClick={() => {
                  setShowSuccessDialog(null);
                  setSelectedTestIds([]);
                  setPatientSearchTerm('');
                  setFoundPatient(null);
                  setNewPatientData({ ...EMPTY_PATIENT_DATA });
                  setIsRegistering(false);
                }}
                className="py-3.5 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-2xl text-xs font-black uppercase tracking-wider transition cursor-pointer shadow-lg shadow-teal-500/20"
              >
                Siguiente Paciente
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 🏷️ REIMPRESIÓN VISUAL DE ETIQUETAS MODAL (React Portal sobre document.body para Cero-Espera en Impresión) */}
      {orderForLabelReprint && typeof document !== 'undefined' && createPortal(
        <div
          id="printable-label-modal-container"
          data-printable-portal="true"
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200 printable-modal-overlay print:static print:p-0 print:m-0 print:bg-white print:block print:inset-auto"
        >
          <div className="bg-slate-900 border-2 border-teal-500/40 rounded-[2.5rem] max-w-5xl w-full p-6 sm:p-7 space-y-5 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] print:border-none print:shadow-none print:p-0 print:m-0 print:max-h-none print:bg-white print:w-full">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4 shrink-0 print:hidden">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400">
                  <Printer className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white uppercase tracking-tight flex items-center gap-2">
                    <span>Reimpresión de Etiquetas de Flebotomía</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/20 border border-teal-500/40 text-teal-300 font-mono font-bold">
                      {orderForLabelReprint.labels.length} {orderForLabelReprint.labels.length === 1 ? 'Tubo' : 'Tubos'}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-300 font-medium mt-0.5">
                    Orden Oficial: <strong className="text-teal-300 font-mono">{formatOrderNumber(orderForLabelReprint.order.orderNumber)}</strong> • {orderForLabelReprint.order.patientName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOrderForLabelReprint(null)}
                className="w-9 h-9 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Labels Grid with Official Clinical Specimen Label Design */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-4 print:overflow-visible print:p-0">
              <div className="specimen-label-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 print:grid-cols-2 print:gap-4">
                {orderForLabelReprint.labels.map((lbl, idx) => (
                  <div key={lbl.id || idx} className="specimen-label-item">
                    <SpecimenTubeLabelCard
                      label={lbl}
                      tubeIndex={idx + 1}
                      totalTubes={orderForLabelReprint.labels.length}
                      onViewZpl={(labelItem) => {
                        setSelectedLabelForZpl(labelItem);
                        setIsZplPreviewOpen(true);
                      }}
                      onPrintSingle={async (labelItem) => {
                        const res = await printerService.printOrderSpecimenLabels(orderForLabelReprint.order, undefined, {
                          customLabels: [labelItem],
                          autoTriggered: false
                        });
                        notifyToast(`✓ Etiqueta ${labelItem.sampleBarcode} enviada a ${res.printer.name}`, 'success');
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 shrink-0 print:hidden">
              <span className="text-xs text-slate-400">
                Formato Oficial de Muestras: <strong className="text-slate-200">Code128 Vectorial • 50 x 30 mm</strong>
              </span>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    printDocument(
                      buildPrintFileName('Etiquetas Flebotomía', orderForLabelReprint.order.patientName, orderForLabelReprint.order.orderNumber)
                    );
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-500/30 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer flex items-center space-x-1.5"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Imprimir en Papel</span>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    const res = await printerService.printOrderSpecimenLabels(orderForLabelReprint.order, undefined, { autoTriggered: false });
                    notifyToast(`✓ ${res.labelsCount} etiqueta(s) enviadas a ${res.printer.name}`, 'success');
                  }}
                  className="px-5 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer shadow-lg shadow-teal-500/20 flex items-center space-x-1.5"
                >
                  <Printer className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Imprimir Todas en Térmica</span>
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ZPL PREVIEW MODAL (React Portal sobre document.body con z-[100050] para garantizar visibilidad) */}
      {isZplPreviewOpen && selectedLabelForZpl && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[100050] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border-2 border-teal-500/40 rounded-3xl max-w-xl w-full p-6 space-y-4 text-slate-200 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400">
                  <FileCode className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white uppercase tracking-tight flex items-center gap-2">
                    <span>Comandos Raw ZPL-II</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 font-mono font-bold">
                      203 DPI • Zebra/TSC
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                    Tubo: <strong className="text-white">{selectedLabelForZpl.sampleBarcode}</strong> • {selectedLabelForZpl.tubeColorName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsZplPreviewOpen(false)}
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <pre className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-72 leading-relaxed select-all">
              {printerService.generateZplPayload(selectedLabelForZpl, 203)}
            </pre>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[10px] text-slate-400 font-mono">
                Longitud: {printerService.generateZplPayload(selectedLabelForZpl, 203).length} bytes
              </span>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    const zpl = printerService.generateZplPayload(selectedLabelForZpl, 203);
                    navigator.clipboard.writeText(zpl);
                    notifyToast('✓ Código ZPL copiado al portapapeles', 'success');
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-500/30 rounded-xl text-xs font-black uppercase transition cursor-pointer flex items-center space-x-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar ZPL</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsZplPreviewOpen(false)}
                  className="px-5 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-xl text-xs font-black uppercase transition cursor-pointer shadow-md shadow-teal-500/20"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 📊 MODAL DETALLADO DE KPIS DE RECEPCIÓN Y JORNADA */}
      {isKpiDetailModalOpen && typeof document !== 'undefined' && createPortal(
        <div
          onClick={() => setIsKpiDetailModalOpen(false)}
          className="fixed inset-0 z-[9999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto custom-scrollbar animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border border-white/10 rounded-3xl max-w-4xl w-full p-6 sm:p-7 shadow-2xl space-y-6 my-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center space-x-3.5">
                <div className="w-12 h-12 rounded-2xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-300 shadow-lg shadow-teal-500/10">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-lg font-black text-white uppercase tracking-tight">
                      Detalle de Métricas & Indicadores Clave (KPIs)
                    </h2>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-teal-500/20 text-teal-300 border border-teal-500/40 font-mono">
                      EN VIVO
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Jornada Operativa en Tiempo Real • Sede Vía España [VE-01] • Laboratorio Clínico San José
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsKpiDetailModalOpen(false)}
                className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
                title="Cerrar (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Top 4 KPI Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3.5 bg-slate-950/80 border border-teal-500/30 rounded-2xl">
                <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                  <span>Órdenes Hoy</span>
                  <FileText className="w-3.5 h-3.5 text-teal-400" />
                </div>
                <div className="text-2xl font-black text-white font-mono mt-1">{ordersTodayCount}</div>
                <div className="text-[10px] text-teal-300 font-medium mt-0.5">
                  {kpiStats.statOrdersToday > 0 ? `🚨 ${kpiStats.statOrdersToday} urgentes (STAT)` : '✓ Registro continuo normal'}
                </div>
              </div>

              <div className="p-3.5 bg-slate-950/80 border border-cyan-500/30 rounded-2xl">
                <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                  <span>Turnos Atendidos</span>
                  <Users className="w-3.5 h-3.5 text-cyan-400" />
                </div>
                <div className="text-2xl font-black text-cyan-300 font-mono mt-1">{attendedTurnsCount}</div>
                <div className="text-[10px] text-cyan-400/90 font-medium mt-0.5">
                  {kpiStats.attendedTurns} completados • {kpiStats.inProgressTurns} en atención
                </div>
              </div>

              <div className="p-3.5 bg-slate-950/80 border border-amber-500/30 rounded-2xl">
                <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                  <span>Turnos en Espera</span>
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <div className={`text-2xl font-black font-mono mt-1 ${waitingTurnsCount > 0 ? 'text-amber-300' : 'text-emerald-400'}`}>
                  {waitingTurnsCount}
                </div>
                <div className="text-[10px] text-amber-300/90 font-medium mt-0.5">
                  {kpiStats.statTurns > 0 ? `🚨 ${kpiStats.statTurns} urgentes en fila` : 'Flujo normal en sala'}
                </div>
              </div>

              <div className="p-3.5 bg-slate-950/80 border border-emerald-500/30 rounded-2xl">
                <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                  <span>Ventanillas Activas</span>
                  <Award className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div className="text-2xl font-black text-emerald-300 font-mono mt-1">{activeCountersCount} / {turnCounters.length}</div>
                <div className="text-[10px] text-emerald-400/90 font-medium mt-0.5">
                  Capacidad: {Math.round((activeCountersCount / Math.max(1, turnCounters.length)) * 100)}% operativa
                </div>
              </div>
            </div>

            {/* Turn Priority & Category Breakdown */}
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase text-slate-300 tracking-wider flex items-center space-x-2">
                <Sliders className="w-4 h-4 text-teal-400" />
                <span>Desglose de Pacientes en Fila por Prioridad Legal y Clínica</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 bg-rose-950/30 border border-rose-500/40 rounded-2xl">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-rose-300 uppercase">🚨 Urgencias (STAT)</span>
                    <span className="text-base font-black font-mono text-rose-200">{kpiStats.statTurns}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Atención prioritaria inmediata según protocolo clínico de emergencia.
                  </p>
                </div>

                <div className="p-3.5 bg-amber-950/30 border border-amber-500/40 rounded-2xl">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-amber-300 uppercase">🛡️ Ley 42 (Preferencial)</span>
                    <span className="text-base font-black font-mono text-amber-200">{kpiStats.prefTurns}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Adultos mayores (+60), embarazadas y personas con discapacidad garantizados por ley.
                  </p>
                </div>

                <div className="p-3.5 bg-teal-950/30 border border-teal-500/30 rounded-2xl">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-teal-300 uppercase">📋 Rutina / General</span>
                    <span className="text-base font-black font-mono text-teal-200">{kpiStats.genTurns}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Atención secuencial por orden de llegada (FIFO).
                  </p>
                </div>
              </div>
            </div>

            {/* Counter / Box Live Monitoring */}
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase text-slate-300 tracking-wider flex items-center space-x-2">
                <Users className="w-4 h-4 text-teal-400" />
                <span>Estado de Ventanillas y Módulos de Flebotomía</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                {turnCounters.map(counter => (
                  <div
                    key={counter.id}
                    className="p-3 bg-slate-950/80 border border-white/5 rounded-2xl flex items-center justify-between"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center space-x-2">
                        <span className={`w-2 h-2 rounded-full ${counter.status === 'ACTIVA' ? 'bg-teal-400 animate-pulse' : counter.status === 'EN_PAUSA' ? 'bg-amber-400' : 'bg-slate-600'}`} />
                        <span className="font-bold text-white text-xs truncate">{counter.name}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                        Personal: <span className="text-slate-300">{counter.assignedStaff || 'Sin asignar'}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                        counter.status === 'ACTIVA'
                          ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                          : counter.status === 'EN_PAUSA'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}>
                        {counter.status}
                      </span>
                      {counter.currentTicketNumber && (
                        <div className="text-[10px] font-mono font-bold text-amber-300 mt-0.5">
                          Turno: {counter.currentTicketNumber}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
              <div className="text-[11px] text-slate-500 flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
                <span>Datos sincronizados en tiempo real con motor de turnos y LISCore</span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsKpiDetailModalOpen(false);
                    setActiveSubTab('TURNS');
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-teal-300 hover:text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 border border-white/5"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Gestionar Turnos & Fila</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsKpiDetailModalOpen(false)}
                  className="px-5 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black rounded-xl text-xs transition cursor-pointer shadow-lg shadow-teal-500/20"
                >
                  Entendido
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 🪪 TRIBUNAL ELECTORAL PANAMA CEDULA QR SCANNER MODAL */}
      {isCedulaQrModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <QrCode className="w-5 h-5 text-amber-400" />
                <h3 className="font-black text-white text-sm uppercase tracking-wider">
                  Lector de Cédula Panameña (Tribunal Electoral)
                </h3>
              </div>
              <button onClick={() => setIsCedulaQrModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-[10px] font-bold text-amber-300 block">💡 ¿Cómo funciona el escáner de Cédula?</span>
                <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                  El reverso de la Cédula Panameña posee un código QR estandarizado por el Tribunal Electoral que contiene los datos del ciudadano. <strong>Al escanear el plástico con la cámara del celular/laptop o la pistola USB, los datos se extraen directamente de la Cédula sin requerir que el paciente esté en la base de datos.</strong>
                </p>
              </div>

              {/* 📹 LIVE OPTICAL WEBCAM / SMARTPHONE CAMERA SCANNER BUTTON */}
              <button
                type="button"
                onClick={() => {
                  setIsCedulaQrModalOpen(false);
                  setIsCameraScannerOpen(true);
                }}
                className="w-full py-3 bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 hover:brightness-110 text-slate-950 font-black text-xs rounded-2xl transition shadow-lg shadow-cyan-500/20 cursor-pointer flex items-center justify-center space-x-2"
              >
                <Camera className="w-4 h-4 text-slate-950" />
                <span>📹 Abrir Cámara del Celular / WebCam (Escáner Óptico en Vivo)</span>
              </button>

              <div className="space-y-1.5 pt-2 border-t border-slate-800">
                <label className="text-xs font-extrabold text-slate-300 block">
                  O Escanear con Pistola Lector 2D USB / Entrada de Trama
                </label>
                <input
                  type="text"
                  value={cedulaQrRawInput}
                  onChange={(e) => setCedulaQrRawInput(e.target.value)}
                  placeholder="Escanee QR de la Cédula..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-amber-300 font-mono font-bold focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCedulaQrModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={() => handleProcessCedulaQr(cedulaQrRawInput)}
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-xs rounded-xl shadow cursor-pointer flex items-center space-x-1.5"
                >
                  <Sparkles className="w-4 h-4 text-slate-950" />
                  <span>Procesar Datos de Cédula</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 📜 HISTORIAL CLÍNICO DEL PACIENTE MODAL (ISOLATED & NON-INTRUSIVE) */}
      {showPatientHistoryModal && foundPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-white/10 rounded-[2.5rem] shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900">
              <div className="flex items-center space-x-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <History className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white flex items-center space-x-2">
                    <span>Historial de Órdenes del Paciente</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-teal-300 font-mono font-black border border-white/5">
                      {patientHistoryOrders.length} {patientHistoryOrders.length === 1 ? 'orden previa' : 'órdenes previas'}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">
                    {foundPatient.fullName} • Cédula/ID: <span className="font-mono text-white font-bold">{foundPatient.nationalId}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPatientHistoryModal(false)}
                className="w-9 h-9 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Info Banner */}
            <div className="px-6 py-3 bg-amber-500/10 border-b border-amber-500/20 text-xs text-amber-200/90 flex items-start space-x-2.5">
              <Info className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
              <span>
                Estas órdenes pertenecen a visitas históricas anteriores. Están aisladas aquí para mantener la admisión de hoy limpia y sin interferencias. Puede replicar los exámenes en una orden nueva con fecha de hoy.
              </span>
            </div>

            {/* Orders List */}
            <div className="p-6 overflow-y-auto space-y-3.5 flex-1 custom-scrollbar">
              {patientHistoryOrders.map((ord) => {
                const ordTests = testCatalog.filter((t) => ord.testIds?.includes(t.id));
                const formattedDate = new Date(ord.createdAt).toLocaleDateString('es-PA', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });
                const isFromToday = isSameDay(ord.createdAt);

                return (
                  <div
                    key={ord.id}
                    className="p-4 bg-slate-950/80 border border-slate-800 hover:border-slate-700 rounded-2xl space-y-3 transition shadow-sm"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-black text-cyan-300 text-sm">{formatOrderNumber(ord.orderNumber)}</span>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                          isFromToday ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {isFromToday ? 'HOY' : formattedDate}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2.5 py-0.5 rounded-full font-mono text-[10px] font-black ${
                          ord.status === 'COMPLETADA' || ord.status === 'VALIDADA_MED'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : ord.status === 'EN_PROCESO'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-slate-800 text-slate-300'
                        }`}>
                          {ord.status}
                        </span>
                        <span className="font-black text-emerald-400 text-xs font-mono">
                          ${ord.totalAmount?.toFixed(2) || '0.00'}
                        </span>
                      </div>
                    </div>

                    <div className="text-xs text-slate-200">
                      <span className="text-slate-400 font-bold block mb-1">Exámenes practicados:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {ordTests.length > 0 ? (
                          ordTests.map((t) => (
                            <span key={t.id} className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300 font-medium">
                              {t.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-500 italic text-xs">Exámenes generales</span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center justify-between pt-2.5 border-t border-slate-900 gap-2">
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => {
                            setShowPatientHistoryModal(false);
                            handleOpenOrderCorrectionModal(ord);
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-black text-xs uppercase flex items-center space-x-1 cursor-pointer transition shadow-sm"
                          title="Modificar o corregir paciente, médico, agregar o quitar exámenes de esta orden"
                        >
                          <Pencil className="w-3.5 h-3.5 text-amber-400" />
                          <span>Modificar</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowPatientHistoryModal(false);
                            onOpenPdf(ord.id);
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 font-black text-xs uppercase flex items-center space-x-1 cursor-pointer transition"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Ver Reporte</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleManualPrintLabels(ord)}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-black text-xs uppercase flex items-center space-x-1 cursor-pointer transition"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Etiquetas</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTestIds(ord.testIds || []);
                          setIsStat(ord.priority === 'URGENCIA' || ord.priority === 'URGENTE');
                          setShowPatientHistoryModal(false);
                          notifyToast(
                            `✓ Exámenes de la orden ${formatOrderNumber(ord.orderNumber)} cargados en caja. La orden se guardará con la fecha de hoy.`,
                            'success',
                            4000
                          );
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs uppercase flex items-center space-x-1.5 cursor-pointer shadow-md transition"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                        <span>Replicar en Orden de Hoy</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/10 bg-slate-950/60 flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">
                Trazabilidad y expediente clínico centralizado
              </span>
              <button
                type="button"
                onClick={() => setShowPatientHistoryModal(false)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-black uppercase tracking-wider cursor-pointer transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 📹 REAL LIVE OPTICAL WEBCAM / SMARTPHONE CAMERA SCANNER MODAL (jsQR) */}
      {isCameraScannerOpen && (
        <QuickScanCameraModal
          isOpen={isCameraScannerOpen}
          onClose={() => setIsCameraScannerOpen(false)}
          onScanSuccess={(scannedCode) => {
            setIsCameraScannerOpen(false);
            handleProcessCedulaQr(scannedCode);
          }}
        />
      )}

      {/* ✏️ ORDER & PATIENT COMPREHENSIVE CORRECTION MODAL */}
      {orderToEdit && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-3 sm:p-5 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border-2 border-amber-500/40 rounded-[2.5rem] max-w-4xl w-full max-h-[92vh] flex flex-col shadow-[0_0_80px_rgba(245,158,11,0.25)] overflow-hidden">
            
            {/* MODAL HEADER */}
            <div className="flex items-center justify-between border-b border-white/10 px-6 sm:px-8 py-4.5 bg-slate-950/60 shrink-0">
              <div className="flex items-center space-x-3.5">
                <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-inner">
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white uppercase tracking-tight flex items-center gap-2">
                    <span>Corrección Integral de la Orden</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono font-bold">
                      {editOrderPriority}
                    </span>
                  </h3>
                  <p className="text-xs text-amber-300 font-mono font-bold">
                    Orden Oficial: {formatOrderNumber(orderToEdit.orderNumber)} • {editOrderTestIds.length} Análisis • ${editCalculatedTotal.toFixed(2)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOrderToEdit(null)}
                className="text-slate-400 hover:text-white cursor-pointer p-1.5 rounded-xl hover:bg-white/5 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* SCROLLABLE FORM BODY */}
            <form onSubmit={handleSaveOrderCorrection} className="p-6 sm:p-8 overflow-y-auto custom-scrollbar space-y-6 text-xs flex-1">
              
              {/* BLOQUE 1: DATOS DEL PACIENTE */}
              <div className="bg-slate-950/80 border border-white/10 rounded-2xl p-4.5 space-y-3.5 shadow-sm">
                <span className="text-xs font-black text-teal-400 uppercase tracking-wider flex items-center gap-2">
                  <User className="w-4 h-4 text-teal-400" />
                  <span>1. Datos de Identificación del Paciente</span>
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-black text-slate-300 uppercase block mb-1">
                      Nombre Completo del Paciente *
                    </label>
                    <input
                      type="text"
                      required
                      value={editOrderPatientName}
                      onChange={(e) => setEditOrderPatientName(e.target.value)}
                      placeholder="Ej: Roberto Gomez"
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm font-black text-white outline-none focus:border-amber-400 transition"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-300 uppercase block mb-1">
                      Cédula / Documento *
                    </label>
                    <input
                      type="text"
                      required
                      value={editOrderPatientCedula}
                      onChange={(e) => setEditOrderPatientCedula(e.target.value)}
                      placeholder="Ej: 8-459-4727"
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2.5 text-xs font-mono font-bold text-white outline-none focus:border-amber-400 transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-black text-slate-300 uppercase block mb-1">
                      Teléfono / WhatsApp
                    </label>
                    <input
                      type="text"
                      value={editOrderPatientPhone}
                      onChange={(e) => setEditOrderPatientPhone(e.target.value)}
                      placeholder="Ej: +507 6600-0000"
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono font-bold text-white outline-none focus:border-amber-400 transition"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-300 uppercase block mb-1">
                      Sexo Biológico
                    </label>
                    <select
                      value={editOrderPatientGender}
                      onChange={(e) => setEditOrderPatientGender(e.target.value as any)}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none focus:border-amber-400 transition"
                    >
                      <option value="M">👨 Masculino</option>
                      <option value="F">👩 Femenino</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-300 uppercase block mb-1">
                      Edad (Años)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="125"
                      value={editOrderPatientAge}
                      onChange={(e) => setEditOrderPatientAge(parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono font-bold text-white outline-none focus:border-amber-400 transition"
                    />
                  </div>
                </div>
              </div>

              {/* BLOQUE 2: MÉDICO TRATANTE, PRIORIDAD & ADMINISTRACIÓN */}
              <div className="bg-slate-950/80 border border-white/10 rounded-2xl p-4.5 space-y-3.5 shadow-sm">
                <span className="text-xs font-black text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-cyan-400" />
                  <span>2. Médico Solicitante, Prioridad & Procedencia</span>
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-black text-slate-300 uppercase block mb-1">
                      Médico Tratante / Solicitante
                    </label>
                    <input
                      type="text"
                      list="correctionDoctorSuggestions"
                      value={editOrderDoctorName}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditOrderDoctorName(val);
                        const match = INSTITUTIONAL_HIS_DOCTORS.find(d => d.name.toLowerCase() === val.toLowerCase());
                        if (match) {
                          setEditOrderDoctorLicense(match.licenseNumber);
                        }
                      }}
                      placeholder="Ej: Dr. Fernando Arosemena Boyd"
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none focus:border-amber-400 transition"
                    />
                    <datalist id="correctionDoctorSuggestions">
                      {INSTITUTIONAL_HIS_DOCTORS.map(doc => (
                        <option key={doc.id} value={doc.name}>
                          {doc.name} - {doc.specialty} ({doc.licenseNumber})
                        </option>
                      ))}
                    </datalist>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-300 uppercase block mb-1">
                      Idoneidad / Licencia Médica
                    </label>
                    <input
                      type="text"
                      value={editOrderDoctorLicense}
                      onChange={(e) => setEditOrderDoctorLicense(e.target.value)}
                      placeholder="Ej: M-9812-MINSA"
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono font-bold text-white outline-none focus:border-amber-400 transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-black text-slate-300 uppercase block mb-1">
                      Prioridad Clínica
                    </label>
                    <select
                      value={editOrderPriority}
                      onChange={(e) => setEditOrderPriority(e.target.value as any)}
                      className={`w-full bg-slate-900 border rounded-xl px-3 py-2 text-xs font-bold outline-none transition ${
                        editOrderPriority === 'URGENCIA'
                          ? 'border-rose-500/60 text-rose-300'
                          : editOrderPriority === 'PRIORITARIA'
                          ? 'border-amber-500/60 text-amber-300'
                          : 'border-white/10 text-white'
                      }`}
                    >
                      <option value="RUTINA">Rutina Estándar</option>
                      <option value="URGENCIA">Urgencia (STAT Crítico)</option>
                      <option value="PRIORITARIA">Prioritaria / Preferencial</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-300 uppercase block mb-1">
                      Servicio / Procedencia
                    </label>
                    <select
                      value={editOrderServiceOrigin}
                      onChange={(e) => setEditOrderServiceOrigin(e.target.value)}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none focus:border-amber-400 transition"
                    >
                      <option value="Consulta Externa">Consulta Externa</option>
                      <option value="Urgencias">Urgencias Hospital</option>
                      <option value="Hospitalización / Sala">Hospitalización / Sala</option>
                      <option value="Atención Domiciliaria">Atención Domiciliaria</option>
                      <option value="Empresarial / Salud Ocupacional">Empresarial / Salud Ocupacional</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-300 uppercase block mb-1">
                      Cobertura / Seguro
                    </label>
                    <select
                      value={editOrderInsurance}
                      onChange={(e) => setEditOrderInsurance(e.target.value)}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none focus:border-amber-400 transition"
                    >
                      <option value="Particular (100%)">Particular (100%)</option>
                      <option value="CSS Panamá">CSS Panamá (Asegurado)</option>
                      <option value="CSS Jubilado">CSS Jubilado / Pensionado</option>
                      <option value="Seguro Privado (Pan American Life)">Seguro Privado (Pan American Life)</option>
                      <option value="Seguro Privado (Blue Cross)">Seguro Privado (Blue Cross)</option>
                      <option value="Seguro Privado (Mapfre)">Seguro Privado (Mapfre)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-black text-slate-300 uppercase block mb-1">
                      Estado de Pago
                    </label>
                    <select
                      value={editOrderPaymentStatus}
                      onChange={(e) => setEditOrderPaymentStatus(e.target.value as any)}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none focus:border-amber-400 transition"
                    >
                      <option value="PAGADO">✓ PAGADO</option>
                      <option value="PENDIENTE">⏳ PENDIENTE DE COBRO</option>
                      <option value="ASEGURADORA">📑 RECLAMO ASEGURADORA</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-black text-slate-300 uppercase block mb-1">
                      Diagnóstico Presuntivo / Comentarios Clínicos
                    </label>
                    <input
                      type="text"
                      value={editOrderClinicalComments}
                      onChange={(e) => setEditOrderClinicalComments(e.target.value)}
                      placeholder="Ej: Control de rutina, paciente en ayuno de 10 horas."
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs font-medium text-white outline-none focus:border-amber-400 transition"
                    />
                  </div>
                </div>
              </div>

              {/* BLOQUE 3: GESTIÓN DE EXÁMENES Y ANÁLISIS DE LABORATORIO */}
              <div className="bg-slate-950/80 border border-teal-500/30 rounded-2xl p-4.5 space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center space-x-2">
                    <Beaker className="w-4 h-4 text-teal-400" />
                    <span className="text-xs font-black text-teal-300 uppercase tracking-wider">
                      3. Análisis Clínicos Asignados ({editOrderTestIds.length})
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 text-xs">
                    <span className="text-slate-400">Total Recalculado:</span>
                    <span className="font-mono font-black text-emerald-400 text-sm">
                      ${editCalculatedTotal.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Chips de exámenes actualmente asignados */}
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase block mb-2">
                    Exámenes en esta orden (Haga clic en la '×' para quitar):
                  </label>
                  <div className="flex flex-wrap gap-2 max-h-44 overflow-y-auto custom-scrollbar p-1">
                    {editOrderTestIds.map((testId) => {
                      const test = testCatalog.find(t => t.id === testId);
                      if (!test) return null;
                      return (
                        <div
                          key={testId}
                          className="inline-flex items-center space-x-2 bg-slate-900 border border-teal-500/40 hover:border-teal-400 px-3 py-1.5 rounded-xl text-xs font-bold text-white transition shadow-sm group"
                        >
                          <span className="text-teal-300">{test.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            ${test.price?.toFixed(2)}
                          </span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono">
                            {test.tubeType || 'EDTA'}
                          </span>
                          <button
                            type="button"
                            onClick={() => setEditOrderTestIds(prev => prev.filter(id => id !== testId))}
                            className="text-rose-400 hover:text-white hover:bg-rose-500/40 p-0.5 rounded-full transition cursor-pointer ml-1"
                            title={`Quitar ${test.name}`}
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                    {editOrderTestIds.length === 0 && (
                      <p className="text-xs text-rose-400 italic py-2">
                        ⚠️ No hay análisis seleccionados. Debe agregar al menos un examen de laboratorio.
                      </p>
                    )}
                  </div>
                </div>

                {/* Buscador reactivo para agregar nuevos exámenes */}
                <div className="relative pt-1 border-t border-white/5">
                  <label className="text-[10px] font-black text-slate-300 uppercase block mb-1">
                    Agregar Exámenes del Catálogo Central:
                  </label>
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={editTestSearchQuery}
                      onChange={(e) => setEditTestSearchQuery(e.target.value)}
                      placeholder="Buscar por nombre, código o sección (ej. Hemograma, Glucosa, Orina, Perfil Lipídico, TP, TTP)..."
                      className="w-full bg-slate-900 border border-white/10 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-teal-400 transition"
                    />
                    {editTestSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setEditTestSearchQuery('')}
                        className="absolute right-2.5 top-2 text-slate-400 hover:text-white cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Resultados desplegables del catálogo */}
                  {editTestSearchQuery.trim().length > 0 && (
                    <div className="absolute left-0 right-0 mt-1 max-h-52 overflow-y-auto bg-slate-900 border border-teal-500/50 rounded-2xl shadow-2xl z-30 custom-scrollbar divide-y divide-white/5">
                      {testCatalog
                        .filter(t => !editOrderTestIds.includes(t.id) && (
                          t.name.toLowerCase().includes(editTestSearchQuery.toLowerCase()) ||
                          t.code.toLowerCase().includes(editTestSearchQuery.toLowerCase()) ||
                          t.category.toLowerCase().includes(editTestSearchQuery.toLowerCase())
                        ))
                        .slice(0, 12)
                        .map(t => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => {
                              setEditOrderTestIds(prev => [...prev, t.id]);
                              setEditTestSearchQuery('');
                            }}
                            className="w-full px-3.5 py-2.5 text-left hover:bg-teal-500/15 flex items-center justify-between text-xs transition cursor-pointer group"
                          >
                            <div>
                              <span className="font-bold text-white group-hover:text-teal-300 block">{t.name}</span>
                              <span className="text-[10px] text-slate-400">{t.code} • {t.category} • Tubo: {t.tubeType || 'EDTA'}</span>
                            </div>
                            <div className="text-right shrink-0 ml-3">
                              <span className="text-xs font-mono font-bold text-emerald-400 block">+${t.price.toFixed(2)}</span>
                              <span className="text-[9px] font-bold text-teal-400 group-hover:underline">Agregar +</span>
                            </div>
                          </button>
                        ))}
                    </div>
                  )}
                </div>

                {/* Tubos Físicos Requeridos Calculados */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/5 text-[11px] text-slate-300">
                  <div className="flex items-center space-x-1.5 text-cyan-400 font-bold">
                    <Droplets className="w-3.5 h-3.5" />
                    <span>Tubos / Muestras Requeridas:</span>
                  </div>
                  {editRequiredTubeTypes.map(tube => (
                    <span key={tube} className="px-2 py-0.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-mono font-bold text-[10px]">
                      {tube}
                    </span>
                  ))}
                </div>
              </div>

              {/* BANNER DE TRAZABILIDAD & ACTUALIZACIÓN INMUTABLE */}
              <div className="p-3.5 bg-slate-950 rounded-2xl border border-white/10 space-y-1">
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider block">
                  ✓ Actualización Integral & Trazabilidad LIS
                </span>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Al confirmar la corrección, el sistema actualizará en cascada los datos del paciente, los análisis solicitados, los tubos físicos para flebotomía, las etiquetas Code128, el total facturado y el informe PDF, manteniendo la integridad del expediente.
                </p>
              </div>

              {/* FOOTER ACTIONS */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/10 shrink-0">
                <button
                  type="button"
                  onClick={() => setOrderToEdit(null)}
                  className="py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold uppercase transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={editOrderTestIds.length === 0}
                  className="py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 rounded-xl text-xs font-black uppercase tracking-wider transition shadow-lg shadow-emerald-500/20 cursor-pointer flex items-center justify-center space-x-2"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Guardar Todos los Cambios</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

