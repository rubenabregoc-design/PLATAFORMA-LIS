import React, { useState, useMemo, useEffect } from 'react';
import { Patient, Order, TestCatalogItem, TestResult, PatientImmediateNotificationRecord, NotificationLogItem } from '../../types';
import {
  UserPlus, Search, ShieldCheck, FileText, Plus, CheckCircle2,
  DollarSign, AlertCircle, QrCode, Printer, User, Heart,
  MapPin, Phone, CreditCard, ClipboardList, Clock, X, Calendar,
  Stethoscope, Baby, Zap, ChevronDown, Barcode, Receipt, ArrowRight,
  TrendingUp, Activity, UserSearch, Hash, Scale, Ruler, Shield, Filter,
  Fingerprint, Info, Smartphone, Globe, BriefcaseMedical, Microscope, Beaker, Droplets, Timer,
  Users, Volume2, Settings2, Sliders, Check, RotateCw, Sparkles, FileCode, Tag,
  AlertTriangle, Flame, BellRing, PhoneCall, MessageSquare, Send, ShieldAlert,
  Share2, UserCheck, History, ExternalLink, Flag
} from 'lucide-react';
import { ReceptionTurnManagement } from './ReceptionTurnManagement';
import { turnService } from '../../utils/turnService';
import { printerService, ThermalPrinterDevice, SpecimenTubeLabel } from '../../utils/printerService';
import { CriticalNotificationModal } from './CriticalNotificationModal';
import { MOCK_RESULTS } from '../../data/mockData';

interface ReceptionDashboardProps {
  patients: Patient[];
  testCatalog: TestCatalogItem[];
  orders: Order[];
  results?: TestResult[];
  onCreateOrder: (newOrder: Order, newPatient?: Patient) => void;
  onOpenPdf: (orderId: string) => void;
}

export const ReceptionDashboard: React.FC<ReceptionDashboardProps> = ({
  patients,
  testCatalog,
  orders,
  results = MOCK_RESULTS,
  onCreateOrder,
  onOpenPdf
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'ADMISSION' | 'TURNS' | 'MANAGEMENT' | 'PRINT' | 'PRINTERS'>('ADMISSION');
  const [activeCategory, setActiveCategory] = useState<string>('HEMATOLOGIA');

  // Turn Queue integration state
  const [activeAttendingTurnId, setActiveAttendingTurnId] = useState<string | null>(null);
  const [activeAttendingTicketNumber, setActiveAttendingTicketNumber] = useState<string | null>(null);

  // Printer Management state
  const [autoPrintEnabled, setAutoPrintEnabled] = useState<boolean>(printerService.getAutoPrintEnabled());
  const [printersList, setPrintersList] = useState<ThermalPrinterDevice[]>(printerService.getPrinters());
  const [selectedDefaultPrinterId, setSelectedDefaultPrinterId] = useState<string>(printerService.getDefaultPrinter().id);
  const [lastAutoPrintStatus, setLastAutoPrintStatus] = useState<{
    printerName: string;
    labelsCount: number;
    labels: SpecimenTubeLabel[];
    timestamp: string;
  } | null>(null);
  const [isZplPreviewOpen, setIsZplPreviewOpen] = useState<boolean>(false);
  const [selectedLabelForZpl, setSelectedLabelForZpl] = useState<SpecimenTubeLabel | null>(null);

  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [testSearchTerm, setTestSearchTerm] = useState('');
  const [foundPatient, setFoundPatient] = useState<Patient | null>(patients[0]);
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const [managementSearchTerm, setManagementSearchTerm] = useState('');

  // Critical Alerts & Immediate Notification State
  const [criticalFilter, setCriticalFilter] = useState<'ALL' | 'CRITICAL_ONLY' | 'PENDING' | 'NOTIFIED'>('ALL');
  const [selectedOrderForCriticalModal, setSelectedOrderForCriticalModal] = useState<Order | null>(null);
  const [criticalNotifications, setCriticalNotifications] = useState<Record<string, PatientImmediateNotificationRecord>>({
    'ord-1002': {
      orderId: 'ord-1002',
      orderNumber: 'ORD-2026-00102',
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
      orderNumber: 'ORD-2026-00107',
      patientId: 'pat-007',
      patientName: 'Alejandro Mendoza Silva',
      patientNationalId: 'PE-982103',
      patientPhone: '+507 6443-8811',
      doctorName: 'Dr. Jorge Mendoza (Salud Ocupacional)',
      flaggedAt: new Date(Date.now() - 75 * 60 * 1000).toISOString(),
      flaggedBy: 'Recepcionista (Admisión STAT)',
      urgencyLevel: 'ALTA_PRIORIDAD',
      status: 'NOTIFICADO',
      criticalReason: 'Orden STAT prioritaria de urgencia con panel completo.',
      criticalParameters: [
        { parameterName: 'Prioridad de Servicio', value: 'STAT URGENTE', unit: 'MinSA', refRangeText: 'Rutina', flag: 'ALTO', specimenType: 'Sangre Total' }
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
  const [newPatientData, setNewPatientData] = useState({
    firstName: '',
    lastName: '',
    nationalId: '',
    gender: 'M' as 'M' | 'F',
    dob: '',
    phone: '',
    email: '',
    address: '',
    isPregnant: false,
    clinicalNotes: '',
    weight: '',
    height: '',
    bloodType: '',
    emergencyContact: '',
    insuranceProvider: '',
    nationality: 'Panameña'
  });

  const [selectedTestIds, setSelectedTestIds] = useState<string[]>(['test-hemograma']);
  const [isStat, setIsStat] = useState<boolean>(false);
  const [isFasting, setIsFasting] = useState<boolean>(true);
  const [printSearchTerm, setPrintSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [showSuccessDialog, setShowSuccessDialog] = useState<string | null>(null);
  const [createdOrderSummary, setCreatedOrderSummary] = useState<Order | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, boolean>>({});

  // Helper to extract critical and high-priority status for an order
  const getOrderCriticalInfo = (order: Order) => {
    const orderResults = (results || []).filter(r => r.orderId === order.id);
    const panicResults = orderResults.filter(r => r.flag === 'CRITICO_ALTO' || r.flag === 'CRITICO_BAJO');
    const highResults = orderResults.filter(r => r.flag === 'ALTO' || r.flag === 'BAJO');
    const isStatOrder = order.priority === 'STAT' || order.priority === 'URGENTE';
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

  const filteredPatientsList = useMemo(() => {
    if (patientSearchTerm.length < 2) return [];
    return patients.filter(p =>
      p.firstName.toLowerCase().includes(patientSearchTerm.toLowerCase()) ||
      p.lastName.toLowerCase().includes(patientSearchTerm.toLowerCase()) ||
      p.nationalId.includes(patientSearchTerm)
    );
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

  // Orders Management Filter with Critical Alerts filter
  const filteredOrdersManagement = useMemo(() => {
    return orders.filter(o => {
      const matchesSearch = o.patientName.toLowerCase().includes(managementSearchTerm.toLowerCase()) ||
                            o.patientNationalId.includes(managementSearchTerm) ||
                            o.orderNumber.includes(managementSearchTerm);

      if (!matchesSearch) return false;

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
  }, [managementSearchTerm, orders, criticalFilter, criticalNotifications, results]);

  const filteredPrintOrders = useMemo(() => {
    return orders
      .filter(o => o.status === 'VALIDADA_MED' || o.status === 'EN_PROCESO')
      .filter(o => {
        const matchesSearch = o.patientName.toLowerCase().includes(printSearchTerm.toLowerCase()) ||
                             o.patientNationalId.includes(printSearchTerm) ||
                             o.orderNumber.includes(printSearchTerm);
        const matchesDate = !dateFilter || o.createdAt.startsWith(dateFilter);
        return matchesSearch && matchesDate;
      });
  }, [orders, printSearchTerm, dateFilter]);

  // Overall Statistics for Critical Alerts
  const criticalStats = useMemo(() => {
    let criticalCount = 0;
    let pendingCount = 0;
    let notifiedCount = 0;

    orders.forEach(o => {
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

    return { criticalCount, pendingCount, notifiedCount };
  }, [orders, criticalNotifications, results]);

  const handleSelectFoundPatient = (p: Patient) => {
    setFoundPatient(p);
    setPatientSearchTerm(`${p.firstName} ${p.lastName}`);
    setIsSearchDropdownOpen(false);
    setIsRegistering(false);
  };

  // Turn Selection Handler from ReceptionTurnManagement module
  const handleSelectPatientFromTurn = (turnData: {
    firstName: string;
    lastName: string;
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

    setNewPatientData(prev => ({
      ...prev,
      firstName: turnData.firstName,
      lastName: turnData.lastName,
      nationalId: turnData.nationalId || '',
      gender: turnData.gender || 'M',
      dob: calculatedDob,
      clinicalNotes: turnData.notes || ''
    }));

    setPatientSearchTerm(`${turnData.firstName} ${turnData.lastName}`);
    setIsStat(turnData.isStat ?? false);
    setIsFasting(turnData.isFasting ?? true);

    setActiveSubTab('ADMISSION');
  };

  const handleCreateOrderSubmit = async () => {
    const patientToUse = foundPatient || {
      id: `p-${Date.now()}`,
      tenantId: 'lab-san-jose',
      ...newPatientData,
      idType: 'CEDULA' as const,
      dataConsentLey81: true,
      consentDate: new Date().toISOString()
    };

    const errors: Record<string, boolean> = {};
    if (!patientToUse.firstName) errors.firstName = true;
    if (!patientToUse.lastName) errors.lastName = true;
    if (!patientToUse.dob) errors.dob = true;
    if (!patientToUse.nationalId) errors.nationalId = true;

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      alert('Por favor complete los datos obligatorios marcados en rojo.');
      return;
    }

    setFormErrors({});

    const calculatedAge = new Date().getFullYear() - new Date(patientToUse.dob).getFullYear();

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      tenantId: 'lab-san-jose',
      branchId: 'branch-via-espana',
      orderNumber: `ORD-2026-${Math.floor(10000 + Math.random() * 90000)}`,
      patientId: patientToUse.id,
      patientName: `${patientToUse.firstName} ${patientToUse.lastName}`,
      patientNationalId: patientToUse.nationalId,
      patientGender: patientToUse.gender,
      patientAge: calculatedAge,
      priority: isStat ? 'STAT' : 'RUTINA',
      status: 'TOMADA',
      createdAt: new Date().toISOString(),
      totalAmount,
      paymentStatus: 'PAGADO',
      specimens: [{ id: `sp-${Date.now()}`, orderId: `ord-${Date.now()}`, barcode: `BC-${Date.now()}`, tubeType: 'EDTA', status: 'PENDIENTE' }],
      testIds: selectedTestIds
    };

    onCreateOrder(newOrder, foundPatient ? undefined : (patientToUse as Patient));
    setCreatedOrderSummary(newOrder);

    // If order is marked STAT, pre-flag for immediate notification
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
          flaggedBy: 'Admisión Recepción (Urgencia STAT)',
          urgencyLevel: 'ALTA_PRIORIDAD',
          status: 'PENDIENTE',
          criticalReason: 'Ingreso urgente STAT marcado para notificación prioritaria inmediata.',
          criticalParameters: [
            { parameterName: 'Urgencia de Ingreso', value: 'STAT Prioritario', unit: 'MinSA', refRangeText: 'Rutina', flag: 'ALTO' }
          ],
          history: [
            {
              id: `log-${Date.now()}`,
              timestamp: new Date().toISOString(),
              action: 'Pre-Marcado Urgencia STAT',
              user: 'Recepcionista (Ventanilla 1)',
              channel: 'TELEFONO',
              recipientType: 'PACIENTE_DIRECTO',
              recipientName: newOrder.patientName,
              recipientContact: patientToUse.phone || '+507 6332-9900',
              outcome: 'Orden STAT registrada; preparada para notificación inmediata de resultados.'
            }
          ]
        }
      }));
    }

    // AUTOMATIC SPECIMEN LABEL PRINTING SERVICE TRIGGER
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
        console.error('Error triggering auto print', err);
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

    setShowSuccessDialog(newOrder.id);
  };

  const handleManualPrintLabels = async (order: Order) => {
    const printResult = await printerService.printOrderSpecimenLabels(order, undefined, { autoTriggered: false });
    alert(`✓ ${printResult.labelsCount} etiqueta(s) enviadas a imprimir en ${printResult.printer.name}`);
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

      {/* HEADER WITH INTEGRATED NAVIGATION & STATUS BAR */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900/40 backdrop-blur-xl border border-white/5 p-4 rounded-[2rem] shadow-xl shrink-0">
        
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 bg-teal-500 rounded-xl flex items-center justify-center shadow-lg">
            <UserPlus className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-black text-white uppercase italic tracking-tight leading-none">LISCORE ADMISIÓN & TURNOS</h2>
              {activeAttendingTicketNumber && (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-black bg-amber-500 text-slate-950 animate-pulse">
                  Atendiendo: {activeAttendingTicketNumber}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-3 text-[8px] font-black uppercase text-slate-500 mt-1">
              <div className="flex items-center space-x-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                <span>Terminal Activa Pro</span>
              </div>
              <span>•</span>
              <div className="flex items-center space-x-1 text-teal-400">
                <Printer className="w-2.5 h-2.5" />
                <span>Auto-Print: {autoPrintEnabled ? 'ACTIVADO' : 'MANUAL'} ({defaultPrinter.name.slice(0, 15)}...)</span>
              </div>
              <span>•</span>
              <div className="flex items-center space-x-1 text-rose-400 font-bold">
                <Flame className="w-2.5 h-2.5" />
                <span>Alertas Críticas: {criticalStats.criticalCount} ({criticalStats.pendingCount} Pend.)</span>
              </div>
            </div>
          </div>
        </div>

        <nav className="flex items-center space-x-1 p-1 bg-slate-950/50 rounded-xl border border-white/5 overflow-x-auto">
          {[
            { id: 'ADMISSION', label: 'Nuevo Registro', icon: UserPlus },
            { id: 'TURNS', label: 'Gestión de Turnos', icon: Users },
            { id: 'MANAGEMENT', label: 'Etiquetas & Órdenes', icon: Barcode, badge: criticalStats.pendingCount > 0 ? `${criticalStats.pendingCount} 🚨` : undefined },
            { id: 'PRINT', label: 'Resultados', icon: ShieldCheck },
            { id: 'PRINTERS', label: 'Impresoras', icon: Printer }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap cursor-pointer relative ${
                activeSubTab === tab.id
                  ? 'bg-teal-500 text-slate-950 shadow-lg'
                  : 'text-slate-500 hover:text-white'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[8px] bg-rose-500 text-white font-mono font-bold animate-pulse">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* SUBTAB 1: ADMISSION FORM */}
      {activeSubTab === 'ADMISSION' ? (
        <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0">

          {/* COLUMN 1: PATIENT EHR (Left) */}
          <div className="w-full lg:w-[300px] xl:w-[340px] flex flex-col shrink-0 min-h-0">
            <div className="bg-slate-900/60 backdrop-blur-3xl border border-white/5 p-6 rounded-[2.5rem] shadow-2xl flex flex-col">
              
              {activeAttendingTicketNumber && (
                <div className="mb-4 p-3 bg-amber-950/40 border border-amber-500/40 rounded-2xl flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-black text-amber-300 text-sm">{activeAttendingTicketNumber}</span>
                    <span className="text-[10px] text-amber-200">En Atención</span>
                  </div>
                  <button
                    onClick={() => { setActiveAttendingTurnId(null); setActiveAttendingTicketNumber(null); }}
                    className="text-[9px] text-rose-400 hover:underline uppercase font-bold"
                  >
                    Desvincular
                  </button>
                </div>
              )}

              <div className="mb-6 relative z-30">
                <div className="relative group">
                  <Search className="w-4 h-4 text-teal-500 absolute left-4 top-3.5" />
                  <input
                    type="text"
                    value={patientSearchTerm}
                    onChange={(e) => { setPatientSearchTerm(e.target.value); setIsSearchDropdownOpen(true); }}
                    onFocus={() => setIsSearchDropdownOpen(true)}
                    placeholder="ID o Nombre..."
                    className="w-full bg-slate-950 border-2 border-slate-800 rounded-2xl pl-11 pr-12 py-3 text-[10px] font-bold text-white focus:border-teal-500/50 outline-none transition-all shadow-inner"
                  />
                  <button onClick={() => { setIsRegistering(true); setFoundPatient(null); setPatientSearchTerm(''); }} className="absolute right-2 top-2 bg-teal-500 text-slate-950 p-2 rounded-xl active:scale-90 transition-transform cursor-pointer"><Plus className="w-4 h-4 stroke-[3]" /></button>
                </div>
                {isSearchDropdownOpen && filteredPatientsList.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl z-[100] overflow-hidden">
                    {filteredPatientsList.map(p => (
                      <button key={p.id} onClick={() => handleSelectFoundPatient(p)} className="w-full flex items-center justify-between p-4 hover:bg-teal-500 group border-b border-white/5 last:border-0 transition-all text-left cursor-pointer">
                        <div><div className="text-xs font-black text-white group-hover:text-slate-950 uppercase">{p.firstName} {p.lastName}</div><div className="text-[9px] text-slate-500 group-hover:text-slate-900 font-mono mt-0.5">{p.nationalId}</div></div>
                        <ArrowRight className="w-4 h-4 text-slate-700 group-hover:text-slate-950 transform group-hover:translate-x-1 transition-transform" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {foundPatient && !isRegistering ? (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="text-center pb-6 border-b border-white/5">
                    <div className="w-16 h-16 bg-gradient-to-tr from-teal-500 to-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-teal-500/20 text-slate-950 font-black text-xl">{foundPatient.firstName[0]}{foundPatient.lastName[0]}</div>
                    <h3 className="text-sm font-black text-white uppercase tracking-tight">{foundPatient.firstName} {foundPatient.lastName}</h3>
                    <p className="text-[10px] text-teal-400 font-mono font-bold mt-1">CÉDULA: {foundPatient.nationalId}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-[10px]">
                    <div className="bg-slate-950 p-3 rounded-2xl border border-white/5"><span className="text-slate-600 font-black block text-[8px] uppercase">Edad</span><span className="text-slate-200 font-bold">{calculateAge(foundPatient.dob)}</span></div>
                    <div className="bg-slate-950 p-3 rounded-2xl border border-white/5"><span className="text-slate-600 font-black block text-[8px] uppercase">Sexo</span><span className="text-slate-200 font-bold">{foundPatient.gender === 'M' ? 'Masculino' : 'Femenino'}</span></div>
                  </div>
                  <div className="p-4 bg-teal-500/10 border border-teal-500/20 rounded-2xl flex items-center justify-between text-teal-300 text-[10px] font-bold">
                    <div className="flex items-center space-x-2"><ShieldCheck className="w-4 h-4 text-teal-400" /><span>Ley 81 Panamá: Consentimiento OK</span></div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3"><span className="text-[10px] font-black text-teal-400 uppercase tracking-widest">Nuevo Paciente</span><button onClick={() => { setIsRegistering(false); setFoundPatient(patients[0]); }} className="text-[9px] text-slate-500 hover:text-white uppercase font-bold">Cancelar</button></div>
                  <div className="space-y-3 text-xs">
                    <div><label className="text-[8px] font-black text-slate-500 uppercase">Nombre</label><input type="text" value={newPatientData.firstName} onChange={e => setNewPatientData({ ...newPatientData, firstName: e.target.value })} className={`w-full bg-slate-950 border rounded-xl px-3 py-2 text-[10px] text-white outline-none ${formErrors.firstName ? 'border-rose-500' : 'border-white/10'}`} /></div>
                    <div><label className="text-[8px] font-black text-slate-500 uppercase">Apellido</label><input type="text" value={newPatientData.lastName} onChange={e => setNewPatientData({ ...newPatientData, lastName: e.target.value })} className={`w-full bg-slate-950 border rounded-xl px-3 py-2 text-[10px] text-white outline-none ${formErrors.lastName ? 'border-rose-500' : 'border-white/10'}`} /></div>
                    <div><label className="text-[8px] font-black text-slate-500 uppercase">Cédula / Pasaporte</label><input type="text" value={newPatientData.nationalId} onChange={e => setNewPatientData({ ...newPatientData, nationalId: e.target.value })} className={`w-full bg-slate-950 border rounded-xl px-3 py-2 text-[10px] text-white font-mono outline-none ${formErrors.nationalId ? 'border-rose-500' : 'border-white/10'}`} /></div>
                    <div className="grid grid-cols-2 gap-2">
                      <div><label className="text-[8px] font-black text-slate-500 uppercase">F. Nacimiento</label><input type="date" value={newPatientData.dob} onChange={e => setNewPatientData({ ...newPatientData, dob: e.target.value })} className="w-full bg-slate-950 border border-white/10 rounded-xl px-2 py-2 text-[10px] text-white outline-none" /></div>
                      <div><label className="text-[8px] font-black text-slate-500 uppercase">Sexo</label><select value={newPatientData.gender} onChange={e => setNewPatientData({ ...newPatientData, gender: e.target.value as any })} className="w-full bg-slate-950 border border-white/10 rounded-xl px-2 py-2 text-[10px] text-white outline-none"><option value="M">M</option><option value="F">F</option></select></div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* COLUMN 2: TEST CATALOG SELECTION (Center) */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="bg-slate-900/60 backdrop-blur-3xl border border-white/5 p-6 rounded-[2.5rem] shadow-2xl flex-1 flex flex-col space-y-4">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-teal-500 absolute left-4 top-3" />
                  <input
                    type="text"
                    value={testSearchTerm}
                    onChange={(e) => setTestSearchTerm(e.target.value)}
                    placeholder="Buscar análisis por código o nombre..."
                    className="w-full bg-slate-950 border border-white/10 rounded-2xl pl-11 pr-4 py-2.5 text-xs text-white placeholder-slate-600 outline-none focus:border-teal-500"
                  />
                </div>

                <div className="flex items-center space-x-1.5 overflow-x-auto pb-1">
                  {['HEMATOLOGIA', 'QUIMICA', 'INMUNOLOGIA', 'URINALISIS', 'COAGULACION'].map(cat => (
                    <button
                      key={cat}
                      onClick={() => { setActiveCategory(cat); setTestSearchTerm(''); }}
                      className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition cursor-pointer whitespace-nowrap ${
                        activeCategory === cat && !testSearchTerm
                          ? 'bg-teal-500 text-slate-950 shadow'
                          : 'bg-slate-950 text-slate-400 hover:text-white border border-white/5'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tests Grid */}
              <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 min-h-[300px]">
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
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-2 select-none ${
                        isSelected
                          ? 'bg-teal-500/10 border-teal-500/50 shadow-lg shadow-teal-500/10 ring-1 ring-teal-500/40'
                          : 'bg-slate-950/60 border-white/5 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <span className="text-[8px] font-mono font-black px-1.5 py-0.5 rounded bg-slate-900 text-teal-300 border border-white/5">
                          {test.code}
                        </span>
                        <div className={`w-4 h-4 rounded-md flex items-center justify-center border ${isSelected ? 'bg-teal-500 border-teal-400 text-slate-950' : 'border-white/10'}`}>
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-xs font-black text-white uppercase line-clamp-1">{test.name}</h4>
                        <p className="text-[9px] text-slate-500 font-mono mt-0.5">{test.category} • {test.specimenType}</p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[10px]">
                        <span className="font-mono font-black text-teal-400">${test.price.toFixed(2)}</span>
                        <span className="text-[8px] text-slate-500">TAT: {test.tatHours}h</span>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          </div>

          {/* COLUMN 3: CART & AUTO-PRINT SUMMARY (Right) */}
          <div className="w-full lg:w-[280px] xl:w-[320px] flex flex-col shrink-0 min-h-0">
            <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-white/5 rounded-[2.5rem] p-6 shadow-2xl flex flex-col relative group">
              <div className="absolute -top-20 -right-20 w-48 h-48 bg-teal-500/5 rounded-full blur-[100px]"></div>
              
              <div className="flex-1 space-y-4 relative z-10 overflow-y-auto">
                
                {/* Selected Tests Header */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-teal-500/20 rounded-lg flex items-center justify-center text-teal-400 font-black text-xs">
                        {selectedTests.length}
                      </div>
                      <span className="text-[11px] font-black text-white uppercase tracking-widest">Orden Paciente</span>
                    </div>
                    {selectedTests.length > 0 && (
                      <button onClick={() => setSelectedTestIds([])} className="text-[8px] font-black text-rose-500/40 hover:text-rose-500 uppercase cursor-pointer">
                        Limpiar
                      </button>
                    )}
                  </div>

                  <div className="space-y-1.5 pr-1 max-h-36 overflow-y-auto">
                    {selectedTests.map(t => (
                      <div key={t.id} className="flex items-center justify-between p-2 bg-white/[0.03] border border-white/5 rounded-xl animate-in slide-in-from-right-4 transition-all text-xs">
                        <div className="min-w-0 flex-1 pr-2">
                          <div className="text-[9px] font-black text-white uppercase truncate">{t.name}</div>
                          <div className="text-[8px] text-teal-400 font-mono mt-0.5">${t.price.toFixed(2)}</div>
                        </div>
                        <button onClick={() => setSelectedTestIds(prev => prev.filter(id => id !== t.id))} className="w-5 h-5 flex items-center justify-center bg-slate-950 hover:bg-rose-500 text-slate-700 hover:text-white rounded-lg transition-all shadow cursor-pointer">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Toggles & Options */}
                <div className="space-y-2 pt-1">
                  <button onClick={() => setIsStat(!isStat)} className={`w-full p-3 rounded-2xl border flex items-center justify-between transition-all cursor-pointer ${isStat ? 'bg-rose-500/10 border-rose-500/50 shadow-lg' : 'bg-slate-950 border-white/5'}`}>
                    <div className="flex items-center space-x-2.5">
                      <Zap className={`w-4 h-4 ${isStat ? 'text-rose-500 animate-pulse' : 'text-slate-700'}`} />
                      <div className="text-left">
                        <span className={`text-[9px] font-black uppercase tracking-widest block ${isStat ? 'text-rose-400' : 'text-slate-500'}`}>Urgencia STAT</span>
                        {isStat && <span className="text-[8px] text-rose-300 font-mono">🚨 Alerta Crítica Activada</span>}
                      </div>
                    </div>
                    <div className={`w-8 h-4 rounded-full relative transition-colors ${isStat ? 'bg-rose-500' : 'bg-slate-800'}`}>
                      <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${isStat ? 'left-4' : 'left-0.5'}`}></div>
                    </div>
                  </button>

                  <button onClick={() => setIsFasting(!isFasting)} className={`w-full p-3 rounded-2xl border flex items-center justify-between transition-all cursor-pointer ${isFasting ? 'bg-teal-500/10 border-teal-500/50 shadow-lg' : 'bg-slate-950 border-white/5'}`}>
                    <div className="flex items-center space-x-2.5">
                      <Clock className={`w-4 h-4 ${isFasting ? 'text-teal-400' : 'text-slate-700'}`} />
                      <span className={`text-[9px] font-black uppercase tracking-widest ${isFasting ? 'text-teal-400' : 'text-slate-500'}`}>Paciente Ayunas</span>
                    </div>
                    <div className={`w-8 h-4 rounded-full relative transition-colors ${isFasting ? 'bg-teal-500' : 'bg-slate-800'}`}>
                      <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${isFasting ? 'left-4' : 'left-0.5'}`}></div>
                    </div>
                  </button>
                </div>

                {/* Auto-Print Feature Badge */}
                <div className="p-3 bg-slate-950 border border-teal-500/30 rounded-2xl space-y-1 text-[10px]">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-300 flex items-center space-x-1.5">
                      <Printer className="w-3.5 h-3.5 text-teal-400" />
                      <span>Impresión Automática</span>
                    </span>
                    <button
                      onClick={handleToggleAutoPrint}
                      className={`text-[8px] font-black px-2 py-0.5 rounded cursor-pointer ${autoPrintEnabled ? 'bg-teal-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}
                    >
                      {autoPrintEnabled ? 'ACTIVADA' : 'DESACTIVADA'}
                    </button>
                  </div>
                  <p className="text-[9px] text-slate-500">
                    Al confirmar, rotula tubos en <strong className="text-teal-300 font-mono">{defaultPrinter.name.slice(0, 16)}</strong>.
                  </p>
                </div>

              </div>

              {/* Total & Submit Button */}
              <div className="pt-3 border-t border-white/10 space-y-3 relative z-10 shrink-0">
                <div className="flex flex-col items-center">
                  <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-0.5 text-center w-full">Monto Total de Servicio</span>
                  <div className="flex items-center justify-center">
                    <span className="text-sm font-black text-teal-500/80 mr-1">$</span>
                    <span className="text-3xl font-black text-white tracking-tighter">{totalAmount.toFixed(2)}</span>
                  </div>
                </div>
                <button
                  onClick={handleCreateOrderSubmit}
                  disabled={(!foundPatient && !isRegistering) || selectedTests.length === 0}
                  className={`w-full py-3.5 rounded-3xl text-[10px] font-black uppercase tracking-[0.25em] shadow-2xl transition-all transform hover:-translate-y-0.5 active:scale-95 flex items-center justify-center space-x-2 disabled:opacity-30 disabled:grayscale cursor-pointer ${
                    isStat ? 'bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-rose-500/25' : 'bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 shadow-teal-500/25'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 stroke-[3]" />
                  <span>{isStat ? 'Confirmar STAT e Imprimir' : 'Confirmar e Imprimir'}</span>
                </button>
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
        /* SUBTAB 3: MANAGEMENT & LABEL REPRINTING WORKSPACE WITH CRITICAL ALERT FLAGGER */
        <div className="max-w-5xl mx-auto space-y-5 animate-in fade-in duration-500 pb-20 px-4">
          
          {/* Search & Critical Filter Bar */}
          <div className="bg-slate-900/80 backdrop-blur-xl border-2 border-white/5 rounded-[2rem] p-4 shadow-2xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-teal-400 absolute left-4 top-3" />
                <input
                  type="text"
                  placeholder="Rastrear por UID, Nombre o Cédula..."
                  value={managementSearchTerm}
                  onChange={(e) => setManagementSearchTerm(e.target.value)}
                  className="bg-slate-950 border border-white/10 rounded-2xl pl-11 pr-4 py-2.5 text-xs text-white placeholder-slate-600 font-bold tracking-tight outline-none focus:border-teal-500 w-full"
                />
              </div>

              {/* Critical Alert Filters */}
              <div className="flex items-center space-x-1.5 overflow-x-auto pb-1">
                {[
                  { id: 'ALL', label: `Todas (${orders.length})` },
                  { id: 'CRITICAL_ONLY', label: `🚨 Críticas (${criticalStats.criticalCount})`, highlight: 'rose' },
                  { id: 'PENDING', label: `⏳ Por Notificar (${criticalStats.pendingCount})`, highlight: 'amber' },
                  { id: 'NOTIFIED', label: `✓ Notificadas (${criticalStats.notifiedCount})`, highlight: 'emerald' }
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setCriticalFilter(f.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition cursor-pointer whitespace-nowrap ${
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
          </div>

          {/* Orders Cards List */}
          <div className="grid grid-cols-1 gap-4">
            {filteredOrdersManagement.map(order => {
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
                        <Flame className="w-5 h-5 stroke-[2.5]" />
                      ) : critInfo.isHighPriority ? (
                        <AlertTriangle className="w-5 h-5" />
                      ) : (
                        <Barcode className="w-5 h-5 mb-0.5" />
                      )}
                      <span className="text-[7px] font-black uppercase text-slate-500">
                        {critInfo.isPanic ? 'PÁNICO' : critInfo.isHighPriority ? 'ALERTA' : 'LIS'}
                      </span>
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="text-base font-black text-white uppercase tracking-tight truncate">
                          {order.patientName}
                        </div>

                        {/* Visual Critical Alert Badges */}
                        {critInfo.isPanic ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-rose-500 text-slate-950 flex items-center space-x-1 shadow animate-pulse">
                            <Flame className="w-3 h-3 stroke-[2.5]" />
                            <span>ALERTA CRÍTICA</span>
                          </span>
                        ) : critInfo.isHighPriority ? (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center space-x-1">
                            <AlertTriangle className="w-3 h-3" />
                            <span>ALTA PRIORIDAD</span>
                          </span>
                        ) : null}

                        <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black border ${order.priority === 'STAT' ? 'bg-rose-500/20 border-rose-500/30 text-rose-400' : 'bg-blue-500/20 border-blue-500/30 text-blue-400'}`}>
                          {order.priority}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                        <div className="text-[10px] text-teal-400 font-mono font-black uppercase">{order.orderNumber}</div>
                        <div className="h-1 w-1 rounded-full bg-slate-700"></div>
                        <div className="text-[10px] text-slate-400 font-bold">Cédula: <span className="text-slate-300 font-mono">{order.patientNationalId}</span></div>
                        <div className="h-1 w-1 rounded-full bg-slate-700"></div>
                        <div className="text-[10px] text-slate-400 font-bold">{order.testIds.length} Análisis</div>
                        {order.doctorName && (
                          <>
                            <div className="h-1 w-1 rounded-full bg-slate-700"></div>
                            <div className="text-[10px] text-slate-400 font-bold truncate max-w-[200px]">Méd: <span className="text-slate-300">{order.doctorName}</span></div>
                          </>
                        )}
                      </div>

                      {/* Critical Parameter Detail Snippet */}
                      {critInfo.summaryText && (
                        <div className="pt-1 flex flex-wrap items-center gap-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center space-x-1 ${
                            critInfo.isPanic
                              ? 'bg-rose-950/60 border-rose-500/40 text-rose-200'
                              : 'bg-amber-950/40 border-amber-500/30 text-amber-200'
                          }`}>
                            <AlertCircle className="w-3 h-3 text-rose-400" />
                            <span>{critInfo.summaryText}</span>
                          </span>

                          {isNotified ? (
                            <span className="text-[9px] font-bold text-emerald-400 flex items-center space-x-1">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Notificado: {critInfo.notificationRecord?.recipientName} ({new Date(critInfo.notificationRecord?.notifiedAt || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})</span>
                            </span>
                          ) : isPending ? (
                            <span className="text-[9px] font-bold text-rose-400 flex items-center space-x-1 animate-pulse">
                              <Clock className="w-3 h-3" />
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
                      className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer shadow ${
                        critInfo.isPanic
                          ? 'bg-rose-500 hover:bg-rose-400 text-slate-950 shadow-rose-500/30 font-black ring-2 ring-rose-400/50 animate-pulse'
                          : critInfo.isHighPriority
                          ? isNotified
                            ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                            : 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-amber-500/20'
                          : 'bg-slate-950 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10'
                      }`}
                    >
                      {critInfo.isPanic ? (
                        <Flame className="w-3.5 h-3.5" />
                      ) : critInfo.isHighPriority ? (
                        <BellRing className="w-3.5 h-3.5" />
                      ) : (
                        <Flag className="w-3.5 h-3.5" />
                      )}
                      <span>
                        {isNotified
                          ? 'Ver Registro de Notificación'
                          : critInfo.isHighPriority
                          ? 'Notificar Inmediato'
                          : 'Marcar Alerta Inmediata'}
                      </span>
                    </button>

                    <button
                      onClick={() => handleManualPrintLabels(order)}
                      className="flex items-center space-x-2 bg-slate-950 hover:bg-white/10 text-white border border-white/10 px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all hover:border-teal-500/30 cursor-pointer shadow"
                    >
                      <Printer className="w-3.5 h-3.5 text-teal-400" />
                      <span>Reimprimir</span>
                    </button>

                    <button
                      onClick={() => onOpenPdf(order.id)}
                      className="w-10 h-10 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition-all cursor-pointer shrink-0"
                    >
                      <ArrowRight className="w-5 h-5 stroke-[3]" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      ) : activeSubTab === 'PRINT' ? (
        /* SUBTAB 4: PRINT RESULTS GRID WITH CRITICAL ALERT BADGES */
        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6 animate-in fade-in duration-500 pb-20 px-4">
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
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-inner ${
                      critInfo.isPanic
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse'
                        : critInfo.isHighPriority
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-slate-950 border border-white/5 text-emerald-400'
                    }`}>
                      {critInfo.isPanic ? <Flame className="w-5 h-5" /> : <User className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="text-base font-black text-white uppercase tracking-tight truncate max-w-[170px]">{order.patientName}</div>
                      <div className="text-[9px] text-slate-500 font-mono">Cédula: {order.patientNationalId} • {order.patientAge} Años</div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end space-y-1">
                    <div className={`px-2.5 py-0.5 rounded-full text-[8px] font-black border ${order.status === 'VALIDADA_MED' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-amber-500/10 border-amber-500/30 text-amber-400'}`}>
                      {order.status === 'VALIDADA_MED' ? 'LISTO' : 'EN PROCESO'}
                    </div>

                    {critInfo.isPanic && (
                      <span className="px-2 py-0.5 rounded-md text-[8px] font-black uppercase bg-rose-500 text-slate-950 animate-pulse">
                        🚨 PÁNICO
                      </span>
                    )}
                  </div>
                </div>

                {/* Critical Alert summary on card */}
                {critInfo.summaryText && (
                  <div className="p-2.5 bg-slate-950/80 rounded-xl border border-white/5 flex items-center justify-between text-[10px]">
                    <span className="text-rose-300 font-bold truncate max-w-[200px]">{critInfo.summaryText}</span>
                    <button
                      onClick={() => handleOpenCriticalModal(order)}
                      className="text-[9px] text-teal-400 hover:underline uppercase font-bold cursor-pointer"
                    >
                      Aviso
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-white/5">
                  <div className="text-[10px] text-teal-400 font-black font-mono">{order.orderNumber}</div>
                  <div className="flex items-center space-x-2">
                    {critInfo.isHighPriority && (
                      <button
                        onClick={() => handleOpenCriticalModal(order)}
                        className="px-3 py-2 bg-rose-500/20 hover:bg-rose-500 hover:text-slate-950 text-rose-300 border border-rose-500/40 rounded-xl text-[9px] font-black uppercase transition cursor-pointer"
                      >
                        Notificación
                      </button>
                    )}
                    <button
                      onClick={() => onOpenPdf(order.id)}
                      className="flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider shadow-lg transition-all cursor-pointer active:scale-95"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Imprimir</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
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
                <p className="text-xs text-slate-400">Servicio de impresión automática de flebotomía con emulación Zebra ZPL-II / TSPL</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
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

          {/* Printer Devices Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {printersList.map(printer => {
              const isDefault = printer.id === selectedDefaultPrinterId;
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
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-950 border border-white/5 flex items-center justify-center text-teal-400">
                          <Tag className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-white uppercase leading-tight">{printer.name}</h4>
                          <span className="text-[10px] text-slate-400 font-mono">{printer.model}</span>
                        </div>
                      </div>

                      {isDefault ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-teal-500/20 text-teal-300 border border-teal-500/40">
                          PREDETERMINADA
                        </span>
                      ) : (
                        <button
                          onClick={() => handleChangeDefaultPrinter(printer.id)}
                          className="px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase bg-slate-950 text-slate-400 hover:text-white border border-slate-800 cursor-pointer"
                        >
                          Elegir por Defecto
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-slate-950 p-3 rounded-xl border border-white/5">
                        <span className="text-[8px] font-mono text-slate-500 uppercase block">Conexión / IP:</span>
                        <span className="font-mono text-teal-300 text-[11px] font-bold">
                          {printer.ipAddress ? `${printer.ipAddress}:${printer.port}` : printer.connectionType}
                        </span>
                      </div>
                      <div className="bg-slate-950 p-3 rounded-xl border border-white/5">
                        <span className="text-[8px] font-mono text-slate-500 uppercase block">Emulación & DPI:</span>
                        <span className="font-mono text-white text-[11px] font-bold">
                          {printer.emulation} • {printer.dpi} DPI
                        </span>
                      </div>
                      <div className="bg-slate-950 p-3 rounded-xl border border-white/5">
                        <span className="text-[8px] font-mono text-slate-500 uppercase block">Rollo Etiquetas:</span>
                        <span className="font-mono text-emerald-400 text-[11px] font-bold">
                          {printer.remainingLabels} restantes
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

                  <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                    <span className="text-slate-500 text-[10px]">{printer.branch}</span>
                    <button
                      onClick={async () => {
                        const mockOrder: Order = {
                          id: 'test-print',
                          tenantId: 'lab-san-jose',
                          branchId: 'branch-via-espana',
                          orderNumber: `ORD-TEST-${Math.floor(1000 + Math.random() * 9000)}`,
                          patientId: 'p-test',
                          patientName: 'PACIENTE PRUEBA TÉRMICA',
                          patientNationalId: '8-000-0000',
                          patientGender: 'M',
                          patientAge: 35,
                          priority: 'STAT',
                          status: 'TOMADA',
                          createdAt: new Date().toISOString(),
                          totalAmount: 45,
                          paymentStatus: 'PAGADO',
                          specimens: [],
                          testIds: ['test-hemograma', 'test-quimica']
                        };
                        await printerService.printOrderSpecimenLabels(mockOrder, undefined, { targetPrinterId: printer.id });
                        alert(`✓ Prueba de impresión enviada exitosamente a ${printer.name}`);
                      }}
                      className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-teal-300 font-bold rounded-xl text-[10px] transition cursor-pointer"
                    >
                      Test de Impresión
                    </button>
                  </div>

                </div>
              );
            })}
          </div>

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
          <div className="bg-slate-900 border-2 border-teal-500/40 rounded-[3rem] p-8 max-w-xl w-full text-center space-y-6 shadow-[0_0_150px_rgba(20,184,166,0.25)] relative my-auto">
            
            <div className="w-20 h-20 bg-teal-500/20 rounded-[2rem] flex items-center justify-center mx-auto border border-teal-500/40 shadow-inner">
              <CheckCircle2 className="w-10 h-10 text-teal-400 stroke-[3]" />
            </div>

            <div>
              <span className="px-3 py-1 rounded-full text-[9px] font-mono font-black bg-teal-500/20 text-teal-300 border border-teal-500/40 uppercase">
                {createdOrderSummary.orderNumber}
              </span>
              <h2 className="text-2xl font-black text-white tracking-tight uppercase mt-2">
                Ingreso de Paciente Exitoso
              </h2>
              <p className="text-slate-400 text-xs font-bold mt-1">
                {createdOrderSummary.patientName} • Cédula: {createdOrderSummary.patientNationalId}
              </p>
            </div>

            {/* Critical Alert Indicator in Success Dialog */}
            {createdOrderSummary.priority === 'STAT' && (
              <div className="p-3 bg-rose-950/50 border border-rose-500/40 rounded-2xl flex items-center justify-between text-left">
                <div className="flex items-center space-x-2.5">
                  <Flame className="w-5 h-5 text-rose-400 animate-pulse shrink-0" />
                  <div>
                    <span className="text-xs font-black text-rose-300 uppercase block">Orden STAT Registrada</span>
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

            {/* Auto-Print Result Card */}
            {lastAutoPrintStatus && (
              <div className="bg-slate-950/90 p-5 rounded-3xl border border-teal-500/30 text-left space-y-3 shadow-inner">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <div className="flex items-center space-x-2 text-teal-300 font-bold text-xs">
                    <Printer className="w-4 h-4 text-teal-400" />
                    <span>Etiquetas de Flebotomía Generadas:</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-slate-400">
                    {lastAutoPrintStatus.printerName}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {lastAutoPrintStatus.labels.map((lbl) => (
                    <div
                      key={lbl.id}
                      className="p-3 bg-slate-900 border rounded-2xl flex flex-col justify-between space-y-2 relative overflow-hidden"
                      style={{ borderColor: `${lbl.tubeColorHex}50` }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded text-white" style={{ backgroundColor: `${lbl.tubeColorHex}40` }}>
                          {lbl.sampleBarcode}
                        </span>
                        <div className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: lbl.tubeColorHex }} />
                      </div>

                      <div>
                        <div className="text-[10px] font-black text-white uppercase truncate">{lbl.tubeColorName}</div>
                        <div className="text-[9px] text-slate-400 font-mono truncate">{lbl.testsList.join(', ')}</div>
                      </div>

                      <div className="flex items-center justify-between text-[8px] text-slate-500 pt-1 border-t border-white/5">
                        <span>Code128 Barcode</span>
                        <button
                          onClick={() => {
                            setSelectedLabelForZpl(lbl);
                            setIsZplPreviewOpen(true);
                          }}
                          className="text-teal-400 hover:underline uppercase font-bold cursor-pointer"
                        >
                          Ver ZPL
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1">
                  <span>{lastAutoPrintStatus.labelsCount} etiqueta(s) listas para rotular tubos primarios.</span>
                  <button
                    onClick={() => printerService.printOrderSpecimenLabels(createdOrderSummary)}
                    className="text-teal-300 hover:text-white font-bold underline flex items-center space-x-1 cursor-pointer"
                  >
                    <RotateCw className="w-3 h-3" />
                    <span>Reimprimir</span>
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
                  setSelectedTestIds(['test-hemograma']);
                  setPatientSearchTerm('');
                  setFoundPatient(patients[0]);
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

      {/* ZPL PREVIEW MODAL */}
      {isZplPreviewOpen && selectedLabelForZpl && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 space-y-4 text-slate-200">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center space-x-2">
                <FileCode className="w-5 h-5 text-teal-400" />
                <h4 className="text-sm font-black text-white">Comandos Raw ZPL-II (Zebra Thermal)</h4>
              </div>
              <button onClick={() => setIsZplPreviewOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <pre className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-60 leading-relaxed">
              {printerService.generateZplPayload(selectedLabelForZpl, 203)}
            </pre>

            <div className="flex justify-end">
              <button
                onClick={() => setIsZplPreviewOpen(false)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

