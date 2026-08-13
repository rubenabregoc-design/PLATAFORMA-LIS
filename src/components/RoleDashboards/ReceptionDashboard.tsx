import React, { useState, useMemo } from 'react';
import { Patient, Order, TestCatalogItem, TestPackage, Specimen } from '../../types';
import {
  UserPlus, Search, ShieldCheck, FileText, Plus, CheckCircle2,
  DollarSign, AlertCircle, QrCode, Printer, User, Heart,
  MapPin, Phone, CreditCard, ClipboardList, Clock, X, Calendar,
  Stethoscope, Baby, Zap, ChevronDown, Barcode, Receipt, ArrowRight,
  TrendingUp, Activity, UserSearch, Hash, Scale, Ruler, Shield, Filter,
  Fingerprint, Info, Smartphone, Globe, BriefcaseMedical, Microscope, Beaker, Droplets, Timer
} from 'lucide-react';
import { useToast } from '../Toast';
import { KeyboardShortcuts } from '../KeyboardShortcuts';
import { PatientSearchAndProfile } from './Reception/PatientSearchAndProfile';
import { TestCatalogGrid } from './Reception/TestCatalogGrid';
import { OrderCart } from './Reception/OrderCart';
import { SampleTimeline, TimelineStep } from '../SampleTimeline';
import { TubeLabelPreview } from './Reception/TubeLabelPreview';

interface ReceptionDashboardProps {
  patients: Patient[];
  testCatalog: TestCatalogItem[];
  testPackages: TestPackage[];
  orders: Order[];
  onCreateOrder: (newOrder: Order, newPatient?: Patient) => void;
  onOpenPdf: (orderId: string) => void;
}

export const ReceptionDashboard: React.FC<ReceptionDashboardProps> = ({
  patients,
  testCatalog,
  testPackages,
  orders,
  onCreateOrder,
  onOpenPdf
}) => {
  const { toast } = useToast();
  const patientInputRef = React.useRef<HTMLInputElement>(null);

  const formatCedula = (val: string) => {
    const clean = val.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    if (clean.length <= 1) return clean;
    if (clean.length <= 5) return `${clean.slice(0, 1)}-${clean.slice(1)}`;
    if (clean.length <= 9) return `${clean.slice(0, 1)}-${clean.slice(1, 5)}-${clean.slice(5)}`;
    return `${clean.slice(0, 1)}-${clean.slice(1, 5)}-${clean.slice(5, 10)}`;
  };

  const [activeSubTab, setActiveSubTab] = useState<'ADMISSION' | 'MANAGEMENT' | 'PRINT'>('ADMISSION');
  const [activeCategory, setActiveCategory] = useState<string>('HEMATOLOGIA');

  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [testSearchTerm, setTestSearchTerm] = useState('');
  const [foundPatient, setFoundPatient] = useState<Patient | null>(patients[0]);
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const [managementSearchTerm, setManagementSearchTerm] = useState('');

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
  const [selectedPackageIds, setSelectedPackageIds] = useState<string[]>([]);
  const [isStat, setIsStat] = useState<boolean>(false);
  const [isFasting, setIsFasting] = useState<boolean>(true);
  const [printSearchTerm, setPrintSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [showSuccessDialog, setShowSuccessDialog] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, boolean>>({});

  const selectedTests = useMemo(() =>
    testCatalog.filter(t => selectedTestIds.includes(t.id)),
    [selectedTestIds, testCatalog]
  );

  const selectedPackages = useMemo(() =>
    testPackages.filter(p => selectedPackageIds.includes(p.id)),
    [selectedPackageIds, testPackages]
  );

  const totalAmount = useMemo(() => {
    const testsSum = selectedTests.reduce((sum, t) => sum + t.price, 0);
    const packagesSum = selectedPackages.reduce((sum, p) => sum + p.price, 0);
    return testsSum + packagesSum;
  }, [selectedTests, selectedPackages]);

  const filteredPatientsList = useMemo(() => {
    if (patientSearchTerm.length < 2) return [];
    return patients.filter(p =>
      p.firstName.toLowerCase().includes(patientSearchTerm.toLowerCase()) ||
      p.lastName.toLowerCase().includes(patientSearchTerm.toLowerCase()) ||
      p.nationalId.includes(patientSearchTerm)
    );
  }, [patientSearchTerm, patients]);

  const filteredTestsBySearchAndCategory = useMemo(() => {
    const normalize = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const term = normalize(testSearchTerm);

    return testCatalog.filter(t => {
      const name = normalize(t.name);
      const code = normalize(t.code);
      const matchesSearch = !term || name.includes(term) || code.includes(term);
      if (testSearchTerm) return matchesSearch;
      return t.category === activeCategory && matchesSearch;
    });
  }, [testCatalog, activeCategory, testSearchTerm]);

  const filteredOrdersManagement = useMemo(() => {
    return orders.filter(o =>
      o.patientName.toLowerCase().includes(managementSearchTerm.toLowerCase()) ||
      o.patientNationalId.includes(managementSearchTerm) ||
      o.orderNumber.includes(managementSearchTerm)
    );
  }, [managementSearchTerm, orders]);

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

  const handleSelectFoundPatient = (p: Patient) => {
    setFoundPatient(p);
    setPatientSearchTerm(`${p.firstName} ${p.lastName}`);
    setIsSearchDropdownOpen(false);
    setIsRegistering(false);
  };

  const handleCreateOrderSubmit = () => {
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
      toast('Por favor complete los datos obligatorios marcados en rojo.', 'error');
      return;
    }

    setFormErrors({});

    const calculatedAgeValue = new Date().getFullYear() - new Date(patientToUse.dob).getFullYear();

    const allTestIds = Array.from(new Set([
      ...selectedTestIds,
      ...selectedPackages.flatMap(p => p.testIds)
    ]));

    const allTests = testCatalog.filter(t => allTestIds.includes(t.id));
    const uniqueTubeTypes = Array.from(new Set(allTests.map(t => t.tubeType))) as string[];

    // SMART BARCODE GENERATOR LOGIC
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = (now.getTime() - start.getTime()) + ((start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000);
    const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24)).toString().padStart(3, '0');
    const dailySeq = (orders.length + 1).toString().padStart(3, '0');

    const calculateChecksum = (code: string) => {
      let sum = 0;
      for (let i = 0; i < code.length; i++) {
        const digit = parseInt(code[i]);
        sum += (i % 2 === 0) ? digit * 3 : digit;
      }
      return (10 - (sum % 10)) % 10;
    };

    const generatedSpecimens: Specimen[] = uniqueTubeTypes.map((tube, idx) => {
      const testsForThisTube = allTests
        .filter(t => t.tubeType === tube)
        .map(t => t.id);

      const tubeSuffix = (idx + 1).toString().padStart(2, '0');
      const baseBarcode = `${year}${dayOfYear}${dailySeq}${tubeSuffix}`;
      const checksum = calculateChecksum(baseBarcode);
      const smartBarcode = `${baseBarcode}${checksum}`;

      return {
        id: `sp-${Date.now()}-${idx}`,
        orderId: `ord-${Date.now()}`,
        barcode: smartBarcode,
        tubeType: tube,
        testIds: testsForThisTube,
        status: 'PENDIENTE'
      };
    });

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      tenantId: 'lab-san-jose',
      branchId: 'branch-via-espana',
      orderNumber: `ORD-2026-${Math.floor(10000 + Math.random() * 90000)}`,
      patientId: patientToUse.id,
      patientName: `${patientToUse.firstName} ${patientToUse.lastName}`,
      patientNationalId: patientToUse.nationalId,
      patientGender: patientToUse.gender,
      patientAge: calculatedAgeValue,
      priority: isStat ? 'STAT' : 'RUTINA',
      status: 'TOMADA',
      createdAt: new Date().toISOString(),
      totalAmount,
      paymentStatus: 'PAGADO',
      specimens: generatedSpecimens,
      testIds: allTestIds
    };

    onCreateOrder(newOrder, foundPatient ? undefined : (patientToUse as Patient));
    setShowSuccessDialog(newOrder.id);
    toast(`¡Orden ${newOrder.orderNumber} registrada exitosamente!`, 'success');
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

  return (
    <div className="space-y-4 animate-in fade-in duration-500 pb-10 relative z-10 overflow-x-hidden min-h-screen flex flex-col">
      <KeyboardShortcuts
        onSearchPatient={() => { setActiveSubTab('ADMISSION'); patientInputRef.current?.focus(); }}
        onConfirmOrder={handleCreateOrderSubmit}
        onSwitchTab={(tab) => setActiveSubTab(tab as any)}
      />

      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900/40 backdrop-blur-xl border border-white/5 p-4 rounded-[2rem] shadow-xl shrink-0">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 bg-teal-500 rounded-xl flex items-center justify-center shadow-lg"><UserPlus className="w-5 h-5 text-slate-950" /></div>
          <div>
            <h2 className="text-base font-black text-white uppercase italic tracking-tight leading-none">LISCORE ADMISIÓN</h2>
            <div className="flex items-center space-x-2 text-[8px] font-black uppercase text-slate-500 mt-1">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
               <span>Terminal Activa Pro</span>
            </div>
          </div>
        </div>

        <nav className="flex items-center space-x-1 p-1 bg-slate-950/50 rounded-xl border border-white/5">
          {[
            { id: 'ADMISSION', label: 'Nuevo Registro', icon: UserPlus },
            { id: 'MANAGEMENT', label: 'Etiquetas', icon: Barcode },
            { id: 'PRINT', label: 'Resultados', icon: ShieldCheck }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${activeSubTab === tab.id ? 'bg-teal-500 text-slate-950 shadow-lg' : 'text-slate-500 hover:text-white'}`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {activeSubTab === 'ADMISSION' ? (
        <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0">
          <PatientSearchAndProfile
            patients={patients}
            patientSearchTerm={patientSearchTerm}
            setPatientSearchTerm={setPatientSearchTerm}
            foundPatient={foundPatient}
            setFoundPatient={setFoundPatient}
            isSearchDropdownOpen={isSearchDropdownOpen}
            setIsSearchDropdownOpen={setIsSearchDropdownOpen}
            isRegistering={isRegistering}
            setIsRegistering={setIsRegistering}
            newPatientData={newPatientData}
            setNewPatientData={setNewPatientData}
            formErrors={formErrors}
            setFormErrors={setFormErrors}
            formatCedula={formatCedula}
            calculateAge={calculateAge}
            filteredPatientsList={filteredPatientsList}
            handleSelectFoundPatient={handleSelectFoundPatient}
            inputRef={patientInputRef}
          />

          <TestCatalogGrid
            testSearchTerm={testSearchTerm}
            setTestSearchTerm={setTestSearchTerm}
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
            selectedTestIds={selectedTestIds}
            setSelectedTestIds={setSelectedTestIds}
            selectedPackageIds={selectedPackageIds}
            setSelectedPackageIds={setSelectedPackageIds}
            filteredTests={filteredTestsBySearchAndCategory}
            packages={testPackages}
          />

          <OrderCart
            selectedTests={selectedTests}
            setSelectedTestIds={setSelectedTestIds}
            selectedPackages={selectedPackages}
            setSelectedPackageIds={setSelectedPackageIds}
            isStat={isStat}
            setIsStat={setIsStat}
            isFasting={isFasting}
            setIsFasting={setIsFasting}
            totalAmount={totalAmount}
            handleCreateOrderSubmit={handleCreateOrderSubmit}
            foundPatient={foundPatient}
            isRegistering={isRegistering}
          />
        </div>
      ) : activeSubTab === 'MANAGEMENT' ? (
        /* MANAGEMENT WORKSPACE */
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20 px-4">
          <div className="relative bg-slate-900 border-2 border-white/5 rounded-[2rem] flex items-center px-8 py-5 shadow-2xl">
            <Search className="w-6 h-6 text-teal-400 shrink-0" />
            <input type="text" placeholder="Rastrear por UID, Nombre o Cédula..." value={managementSearchTerm} onChange={(e) => setManagementSearchTerm(e.target.value)} className="bg-transparent border-none focus:ring-0 w-full ml-6 text-xl text-white placeholder-slate-700 font-black tracking-tighter" />
          </div>
          <div className="grid grid-cols-1 gap-6">
             {filteredOrdersManagement.map(order => {
               const timelineSteps: TimelineStep[] = [
                 { id: '1', label: 'Registro', time: '08:10 AM', status: 'completed', icon: UserPlus },
                 { id: '2', label: 'Toma', time: '08:25 AM', status: order.status !== 'REGISTRADA' ? 'completed' : 'current', icon: Droplets },
                 { id: '3', label: 'Proceso', time: '09:00 AM', status: (order.status === 'EN_PROCESO' || order.status.includes('VALIDADA')) ? 'completed' : 'pending', icon: Beaker },
                 { id: '4', label: 'Validado', time: '10:15 AM', status: order.status.includes('VALIDADA') ? 'completed' : 'pending', icon: ShieldCheck }
               ];

               return (
                 <div key={order.id} className="bg-slate-900/60 backdrop-blur-3xl border border-white/5 p-6 rounded-[2.5rem] flex flex-col gap-8 hover:bg-slate-800/80 hover:border-teal-500/20 transition-all shadow-xl group relative overflow-hidden">
                   <div className="flex flex-wrap items-center justify-between gap-6 relative z-10">
                     <div className="flex items-center space-x-6">
                       <div className="w-14 h-14 rounded-2xl bg-slate-950 border border-white/5 flex flex-col items-center justify-center text-teal-400 group-hover:scale-110 transition-all shadow-inner">
                         <Barcode className="w-6 h-6 mb-0.5" />
                         <span className="text-[7px] font-black uppercase text-slate-600">Barcode</span>
                       </div>
                       <div>
                         <div className="flex items-center space-x-3 mb-1">
                            <div className="text-xl font-black text-white uppercase tracking-tighter leading-tight">{order.patientName}</div>
                            <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black border ${order.priority === 'STAT' ? 'bg-rose-500/20 border-rose-500/30 text-rose-400' : 'bg-blue-500/20 border-blue-500/30 text-blue-400'}`}>
                              {order.priority}
                            </span>
                         </div>
                         <div className="flex items-center space-x-4">
                            <div className="text-[10px] text-teal-400 font-mono font-black uppercase tracking-widest">{order.orderNumber}</div>
                            <div className="h-1 w-1 rounded-full bg-slate-700"></div>
                            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Cédula: <span className="text-slate-300 font-mono">{order.patientNationalId}</span></div>
                            <div className="h-1 w-1 rounded-full bg-slate-700"></div>
                            <div className="flex items-center space-x-1.5 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                               <Timer className="w-3 h-3 text-amber-500" />
                               <span className="text-[8px] font-black text-amber-400 uppercase">Estabilidad: 01h 45m</span>
                            </div>
                         </div>
                       </div>
                     </div>

                     <div className="flex items-center space-x-3">
                       <button
                         onClick={() => {
                           const patient = patients.find(p => p.id === order.patientId);
                           const message = `Hola ${patient?.firstName}, su orden ${order.orderNumber} está en fase de ${order.status.replace('_', ' ')}.`;
                           window.open(`https://wa.me/${patient?.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
                         }}
                         className="flex items-center space-x-2 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 border border-emerald-500/20 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                       >
                         <Smartphone className="w-4 h-4" />
                         <span>Notificar WA</span>
                       </button>
                       <button onClick={() => alert('Generando barras...')} className="flex items-center space-x-2 bg-slate-950 hover:bg-white/10 text-white border border-white/10 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:border-teal-500/30">
                         <Barcode className="w-4 h-4 text-teal-400" />
                         <span>Etiquetas</span>
                       </button>
                       <button onClick={() => onOpenPdf(order.id)} className="w-10 h-10 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-xl flex items-center justify-center shadow-lg active:scale-90 transition-all">
                         <ArrowRight className="w-5 h-5 stroke-[3]" />
                       </button>
                     </div>
                   </div>

                   <div className="pt-4 pb-6 border-t border-white/5">
                      <SampleTimeline steps={timelineSteps} />
                   </div>
                 </div>
               );
             })}
          </div>
        </div>
      ) : (
        /* PRINT TAB: ENTERPRISE GRID */
        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-8 animate-in fade-in duration-700 pb-20 px-4">
           {filteredPrintOrders.map(order => (
             <div key={order.id} className="bg-slate-900/60 backdrop-blur-3xl border border-white/5 p-8 rounded-[3rem] hover:bg-slate-800/80 transition-all shadow-xl relative overflow-hidden group">
               <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl group-hover:bg-emerald-500/10 transition-colors"></div>

               <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-white/5 flex items-center justify-center text-emerald-400 shadow-inner group-hover:scale-110 transition-transform">
                      <User className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-xl font-black text-white uppercase leading-[1.1] tracking-tighter truncate max-w-[180px] group-hover:text-emerald-400 transition-colors">{order.patientName}</div>
                      <div className="flex items-center space-x-2 mt-1.5">
                        <div className="px-2 py-0.5 bg-slate-950 rounded text-[9px] font-black text-slate-500 font-mono tracking-widest border border-white/5">Cédula: {order.patientNationalId}</div>
                        <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded">{order.patientAge} Años</span>
                      </div>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-[8px] font-black border ${order.status === 'VALIDADA_MED' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-amber-500/10 border-amber-500/30 text-amber-400'}`}>
                    {order.status === 'VALIDADA_MED' ? 'LISTO' : 'EN PROCESO'}
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-3 mb-8">
                  <div className="bg-slate-950/50 rounded-2xl p-4 border border-white/[0.03]">
                    <div className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1.5 flex items-center"><Calendar className="w-3 h-3 mr-1.5 text-emerald-500" /> Fecha Toma</div>
                    <div className="text-[11px] font-bold text-slate-200">{new Date(order.createdAt).toLocaleDateString('es-PA', { day: '2-digit', month: '2-digit', year: 'numeric' })}</div>
                  </div>
                  <div className="bg-slate-950/50 rounded-2xl p-4 border border-white/[0.03]">
                    <div className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1.5 flex items-center"><Microscope className="w-3 h-3 mr-1.5 text-emerald-500" /> Servicios</div>
                    <div className="text-[11px] font-bold text-slate-200">{order.testIds.length} Análisis Solicitados</div>
                  </div>
               </div>

               <div className="flex items-center justify-between pt-6 border-t border-white/5">
                 <div className="text-[10px] text-teal-400 font-black font-mono tracking-tighter uppercase">{order.orderNumber}</div>
                 <button onClick={() => onOpenPdf(order.id)} className="flex items-center space-x-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-emerald-500/20 active:scale-95 transition-all transform hover:-translate-y-1"><Printer className="w-4 h-4 stroke-[3]" /><span>Resultados</span></button>
               </div>
             </div>
           ))}
        </div>
      )}

      {/* Success Modal */}
      {showSuccessDialog && (() => {
        const order = orders.find(o => o.id === showSuccessDialog);
        if (!order) return null;

        return (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/98 backdrop-blur-3xl animate-in fade-in duration-500 overflow-y-auto">
            <div className="bg-slate-900 border border-white/10 rounded-[4rem] p-10 max-w-4xl w-full text-center space-y-10 shadow-[0_0_150px_rgba(20,184,166,0.2)] my-auto">
               <div className="flex flex-col md:flex-row gap-10 items-start">
                  <div className="flex-1 space-y-8">
                     <div className="w-24 h-20 bg-teal-500/20 rounded-[2.25rem] flex items-center justify-center mx-auto border border-teal-500/30">
                        <CheckCircle2 className="w-12 h-12 text-teal-400 stroke-[3]" />
                     </div>
                     <div>
                        <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic leading-none">Ingreso Exitoso</h2>
                        <p className="text-slate-500 text-[9px] font-bold uppercase tracking-[0.4em] mt-6">Sincronizado con Núcleo LISCORE</p>
                     </div>

                     <div className="space-y-4">
                        <div className="text-left bg-slate-950/50 p-6 rounded-[2.5rem] border border-white/5 space-y-4">
                           <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5 pb-2">Resumen de Toma de Muestra</div>
                           <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                 <div className="text-[8px] font-black text-teal-500 uppercase tracking-tighter">Total Tubos</div>
                                 <div className="text-2xl font-black text-white">{order.specimens.length}</div>
                              </div>
                              <div className="space-y-1">
                                 <div className="text-[8px] font-black text-amber-500 uppercase tracking-tighter">Ayuno</div>
                                 <div className="text-2xl font-black text-white">{isFasting ? 'SI' : 'NO'}</div>
                              </div>
                           </div>
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <button onClick={() => toast('Imprimiendo etiquetas...', 'info')} className="p-6 bg-slate-950 border border-white/5 rounded-[2rem] hover:bg-teal-500 hover:text-slate-950 transition-all flex flex-col items-center group relative overflow-hidden shadow-2xl">
                           <Barcode className="w-8 h-8 mb-4 text-teal-400 group-hover:text-slate-950 relative z-10" />
                           <span className="text-[9px] font-black uppercase tracking-[0.3em] relative z-10">Imprimir Todo</span>
                        </button>
                        <button onClick={() => toast('Imprimiendo ticket de caja...', 'info')} className="p-6 bg-slate-950 border border-white/5 rounded-[2rem] hover:bg-teal-500 hover:text-slate-950 transition-all flex flex-col items-center group relative overflow-hidden shadow-2xl">
                           <Receipt className="w-8 h-8 mb-4 text-teal-400 group-hover:text-slate-950 relative z-10" />
                           <span className="text-[9px] font-black uppercase tracking-[0.3em] relative z-10">Ticket Caja</span>
                        </button>
                     </div>
                  </div>

                  <div className="flex-1 space-y-6">
                     <div className="text-left px-4">
                        <h3 className="text-xs font-black text-white uppercase tracking-[0.3em]">Identificación de Tubos</h3>
                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter mt-1">Coloque las etiquetas según el color del tapón</p>
                     </div>
                     <div className="grid grid-cols-1 gap-4 max-h-[500px] overflow-y-auto px-4 pb-4 custom-scrollbar">
                        {order.specimens.map(specimen => (
                           <TubeLabelPreview
                              key={specimen.id}
                              specimen={specimen}
                              order={order}
                              testsInTube={testCatalog.filter(t => order.testIds.includes(t.id) && t.tubeType === specimen.tubeType)}
                           />
                        ))}
                     </div>
                  </div>
               </div>

               <button
                  onClick={() => { setShowSuccessDialog(null); setSelectedTestIds([]); setSelectedPackageIds([]); setPatientSearchTerm(''); setFoundPatient(null); }}
                  className="w-full py-6 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.4em] transition-all transform active:scale-95 shadow-2xl"
               >
                  Siguiente Registro
               </button>
            </div>
          </div>
        );
      })()}

    </div>
  );
};
