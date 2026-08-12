import React, { useState, useMemo } from 'react';
import { Patient, Order, TestCatalogItem } from '../../types';
import {
  UserPlus, Search, ShieldCheck, FileText, Plus, CheckCircle2,
  DollarSign, AlertCircle, QrCode, Printer, User, Heart,
  MapPin, Phone, CreditCard, ClipboardList, Clock, X, Calendar,
  Stethoscope, Baby, Zap, ChevronDown, Barcode, Receipt, ArrowRight,
  TrendingUp, Activity, UserSearch, Hash, Scale, Ruler, Shield, Filter,
  Fingerprint, Info, Smartphone, Globe, BriefcaseMedical, Microscope, Beaker, Droplets, Timer
} from 'lucide-react';

interface ReceptionDashboardProps {
  patients: Patient[];
  testCatalog: TestCatalogItem[];
  orders: Order[];
  onCreateOrder: (newOrder: Order, newPatient?: Patient) => void;
  onOpenPdf: (orderId: string) => void;
}

export const ReceptionDashboard: React.FC<ReceptionDashboardProps> = ({
  patients,
  testCatalog,
  orders,
  onCreateOrder,
  onOpenPdf
}) => {
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

      // If there is a search term, search in all categories.
      // If search is empty, only show the active category.
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
    setShowSuccessDialog(newOrder.id);
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
        /* 3-COLUMN WORKSPACE: FORCED HORIZONTAL ON LG+ */
        <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0">

          {/* COLUMN 1: PATIENT EHR (Left) */}
          <div className="w-full lg:w-[300px] xl:w-[340px] flex flex-col shrink-0 min-h-0">
            <div className="bg-slate-900/60 backdrop-blur-3xl border border-white/5 p-6 rounded-[2.5rem] shadow-2xl flex flex-col">
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
                  <button onClick={() => { setIsRegistering(true); setFoundPatient(null); setPatientSearchTerm(''); }} className="absolute right-2 top-2 bg-teal-500 text-slate-950 p-2 rounded-xl active:scale-90 transition-transform"><Plus className="w-4 h-4 stroke-[3]" /></button>
                </div>
                {isSearchDropdownOpen && filteredPatientsList.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl z-[100] overflow-hidden">
                    {filteredPatientsList.map(p => (
                      <button key={p.id} onClick={() => handleSelectFoundPatient(p)} className="w-full flex items-center justify-between p-4 hover:bg-teal-500 group border-b border-white/5 last:border-0 transition-all text-left">
                        <div className="font-black text-white text-[10px] group-hover:text-slate-950 uppercase">{p.firstName} {p.lastName}</div>
                        <ArrowRight className="w-4 h-4 text-teal-400 group-hover:text-slate-950" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto pr-1">
                {isRegistering ? (
                  <div className="space-y-4 animate-in slide-in-from-top-2">
                     <div className="flex items-center space-x-3 bg-teal-500/10 p-4 rounded-2xl border border-teal-500/20">
                        <Fingerprint className="w-6 h-6 text-teal-400" />
                        <span className="text-[10px] font-black uppercase text-white leading-none">Nuevo Perfil EHR</span>
                     </div>
                     <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className={`text-[8px] font-black uppercase ml-1 transition-colors ${formErrors.nationalId ? 'text-rose-500' : 'text-slate-500'}`}>CÉDULA</label>
                          <input
                            type="text"
                            value={newPatientData.nationalId}
                            onChange={e => {
                              setNewPatientData({...newPatientData, nationalId: e.target.value});
                              if (formErrors.nationalId) setFormErrors(prev => ({...prev, nationalId: false}));
                            }}
                            className={`w-full bg-slate-950 border ${formErrors.nationalId ? 'border-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.2)]' : 'border-slate-800'} rounded-lg px-2 py-2 text-[10px] text-white outline-none focus:border-teal-500/50 transition-all`}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className={`text-[8px] font-black uppercase ml-1 transition-colors ${formErrors.dob ? 'text-rose-500' : 'text-slate-500'}`}>F. Nac.</label>
                          <input
                            type="date"
                            value={newPatientData.dob}
                            onChange={e => {
                              setNewPatientData({...newPatientData, dob: e.target.value});
                              if (formErrors.dob) setFormErrors(prev => ({...prev, dob: false}));
                            }}
                            onFocus={(e) => (e.target as any).showPicker?.()}
                            className={`w-full bg-slate-950 border ${formErrors.dob ? 'border-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.2)]' : 'border-slate-800'} rounded-lg px-2 py-2 text-[10px] text-white outline-none focus:border-rose-500/50 transition-all`}
                          />
                        </div>
                     </div>
                     <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Nombres"
                          value={newPatientData.firstName}
                          onChange={e => {
                            setNewPatientData({...newPatientData, firstName: e.target.value});
                            if (formErrors.firstName) setFormErrors(prev => ({...prev, firstName: false}));
                          }}
                          className={`w-full bg-slate-950 border ${formErrors.firstName ? 'border-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.2)]' : 'border-slate-800'} rounded-lg px-2 py-2 text-[10px] text-white outline-none focus:border-teal-500/50 transition-all`}
                        />
                        <input
                          type="text"
                          placeholder="Apellidos"
                          value={newPatientData.lastName}
                          onChange={e => {
                            setNewPatientData({...newPatientData, lastName: e.target.value});
                            if (formErrors.lastName) setFormErrors(prev => ({...prev, lastName: false}));
                          }}
                          className={`w-full bg-slate-950 border ${formErrors.lastName ? 'border-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.2)]' : 'border-slate-800'} rounded-lg px-2 py-2 text-[10px] text-white outline-none focus:border-teal-500/50 transition-all`}
                        />
                     </div>
                     <div className="grid grid-cols-2 gap-2">
                        <select value={newPatientData.gender} onChange={e => setNewPatientData({...newPatientData, gender: e.target.value as any})} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-2 text-[10px] text-white outline-none focus:border-teal-500/50"><option value="M">MAS</option><option value="F">FEM</option></select>
                        <div className="bg-teal-500/10 border border-teal-500/20 rounded-lg px-2 py-2 text-[10px] text-teal-400 font-black text-center">{calculateAge(newPatientData.dob)}</div>
                     </div>
                     <div className="grid grid-cols-2 gap-2">
                        <input type="text" placeholder="Sangre" value={newPatientData.bloodType} onChange={e => setNewPatientData({...newPatientData, bloodType: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-2 text-[10px] text-white outline-none focus:border-teal-500/50" />
                        <input type="text" placeholder="Celular" value={newPatientData.phone} onChange={e => setNewPatientData({...newPatientData, phone: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-2 text-[10px] text-white outline-none focus:border-teal-500/50" />
                     </div>
                     <div className="grid grid-cols-2 gap-2">
                        <input type="text" placeholder="Peso(kg)" value={newPatientData.weight} onChange={e => setNewPatientData({...newPatientData, weight: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-2 text-[10px] text-white outline-none focus:border-teal-500/50" />
                        <input type="text" placeholder="Talla(cm)" value={newPatientData.height} onChange={e => setNewPatientData({...newPatientData, height: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-2 text-[10px] text-white outline-none focus:border-teal-500/50" />
                     </div>
                     <textarea placeholder="Dirección..." value={newPatientData.address} onChange={e => setNewPatientData({...newPatientData, address: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-2 text-[10px] text-white h-16 resize-none outline-none focus:border-teal-500/50 transition-all" />
                     <textarea placeholder="Ayuno / Méd..." value={newPatientData.clinicalNotes} onChange={e => setNewPatientData({...newPatientData, clinicalNotes: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-2 text-[10px] text-white h-16 resize-none outline-none focus:border-teal-500/50 transition-all" />
                  </div>
                ) : foundPatient && (
                  <div className="space-y-6 animate-in fade-in flex flex-col">
                    <div className="flex items-center space-x-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-slate-950 shadow-xl shrink-0"><User className="w-7 h-7" /></div>
                      <div className="min-w-0">
                        <div className="font-black text-white text-base leading-none uppercase truncate mb-1.5">{foundPatient.firstName} <br/> {foundPatient.lastName}</div>
                        <div className="text-[10px] text-teal-400 font-mono font-black italic">Cédula: {foundPatient.nationalId}</div>
                      </div>
                    </div>
                    <div className="flex-1 space-y-3 pt-6 border-t border-white/5 overflow-y-auto">
                       <div className="flex items-center text-[10px] text-slate-400 font-bold bg-white/5 p-3 rounded-2xl"><Smartphone className="w-3.5 h-3.5 mr-3 text-teal-500" /> {foundPatient.phone}</div>
                       <div className="flex items-start text-[10px] text-slate-400 font-bold bg-white/5 p-3 rounded-2xl leading-tight"><MapPin className="w-3.5 h-3.5 mr-3 text-teal-500 shrink-0 mt-0.5" /> <span>{foundPatient.address || 'Panamá'}</span></div>
                       <div className="grid grid-cols-2 gap-2">
                          <div className="bg-white/5 p-2 rounded-xl text-center"><span className="text-[7px] text-slate-600 uppercase block">Nacionalidad</span><span className="text-[9px] text-white font-black">{foundPatient.nationality || 'Panameña'}</span></div>
                          <div className="bg-white/5 p-2 rounded-xl text-center"><span className="text-[7px] text-slate-600 uppercase block">Edad Actual</span><span className="text-[9px] text-white font-black">{calculateAge(foundPatient.dob)}</span></div>
                       </div>
                    </div>
                    <div className="mt-auto bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 rounded-2xl flex items-center justify-between">
                       <div className="flex items-center space-x-2"><ShieldCheck className="w-4 h-4 text-emerald-400" /><span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Validado LIS</span></div>
                       <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* COLUMN 2: ANALYSIS ENGINE (Center) - Widest */}
          <div className="flex-1 flex flex-col shrink-0 min-h-0 min-w-0">
            <div className="bg-slate-900/40 backdrop-blur-3xl border border-white/5 p-6 rounded-[2.5rem] shadow-2xl flex flex-col space-y-6">
              <div className="bg-slate-950/80 p-5 rounded-[2.5rem] border border-white/10 shadow-2xl space-y-4">
                <div className="relative">
                  <Search className="w-5 h-5 text-teal-500 absolute left-4 top-3.5" />
                  <input type="text" placeholder="Localizar análisis por nombre o código..." value={testSearchTerm} onChange={(e) => setTestSearchTerm(e.target.value)} className="w-full bg-slate-900/50 border-2 border-slate-800 rounded-2xl pl-12 pr-6 py-3 text-[11px] font-black text-white focus:border-teal-500/50 outline-none transition-all placeholder:text-slate-700 shadow-inner" />
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {['HEMATOLOGIA', 'QUIMICA', 'INMUNOLOGIA', 'URINALISIS', 'COAGULACION'].map(category => (
                    <button key={category} onClick={() => { setActiveCategory(category); setTestSearchTerm(''); }} className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${activeCategory === category ? 'bg-teal-500 border-teal-400 text-slate-950 shadow-lg scale-105' : 'bg-slate-900 border-white/5 text-slate-500 hover:text-white'}`}>{category}</button>
                  ))}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-4 pb-20 -mx-4">
                <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6 py-4">
                  {filteredTestsBySearchAndCategory.map(test => {
                    const isSelected = selectedTestIds.includes(test.id);
                    const requiresFasting = test.category === 'QUIMICA' || test.category === 'INMUNOLOGIA';
                    return (
                      <button key={test.id} onClick={() => setSelectedTestIds(prev => isSelected ? prev.filter(id => id !== test.id) : [...prev, test.id])} className={`flex items-center pl-4 pr-6 py-4 rounded-[2rem] border-2 transition-all duration-500 relative group overflow-hidden ${isSelected ? 'bg-teal-500/10 border-teal-500/60 shadow-xl scale-[1.04] z-10 ring-1 ring-inset ring-teal-500/30' : 'bg-slate-950/40 border-white/5 hover:border-white/10'}`}>
                        <div className={`w-11 h-11 rounded-2xl flex-shrink-0 flex items-center justify-center mr-4 transition-all ${isSelected ? 'bg-teal-500 text-slate-950 shadow-lg' : 'bg-slate-900 text-slate-700 shadow-inner'}`}><Activity className="w-6 h-6" /></div>
                        <div className="flex-1 min-w-0 text-left pr-2">
                          <div className={`text-[11px] xl:text-[12px] font-black uppercase leading-tight tracking-normal mb-1 truncate ${isSelected ? 'text-white' : 'text-slate-400'}`}>{test.name}</div>

                          <div className="flex items-center space-x-3 mb-1.5">
                            <div className="text-[8px] text-slate-600 font-black uppercase tracking-widest opacity-60">Ref: {test.code}</div>
                            <div className="h-1 w-1 rounded-full bg-slate-800"></div>
                            <div className="flex items-center text-[7px] font-black uppercase text-teal-500/70 tracking-tighter">
                               <Beaker className="w-2.5 h-2.5 mr-1" /> {test.specimenType}
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            {requiresFasting && (
                              <span className="text-[7px] font-black bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded border border-amber-500/20 uppercase tracking-tighter flex items-center">
                                <Timer className="w-2.5 h-2.5 mr-1" /> Requiere Ayuno
                              </span>
                            )}
                            <span className="text-[7px] font-black bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/20 uppercase tracking-tighter flex items-center">
                              <Clock className="w-2.5 h-2.5 mr-1" /> TAT: {test.tatHours}h
                            </span>
                          </div>
                        </div>
                        <div className={`text-[11px] font-black font-mono flex-shrink-0 ml-3 ${isSelected ? 'text-teal-400' : 'text-slate-700'}`}>${test.price.toFixed(2)}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* COLUMN 3: CART (Right) */}
          <div className="w-full lg:w-[280px] xl:w-[320px] flex flex-col shrink-0 min-h-0">
            <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-white/5 rounded-[2.5rem] p-6 shadow-2xl flex flex-col relative group">
               <div className="absolute -top-20 -right-20 w-48 h-48 bg-teal-500/5 rounded-full blur-[100px]"></div>
               <div className="flex-1 space-y-6 relative z-10 overflow-y-auto">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                       <div className="flex items-center space-x-2"><div className="w-6 h-6 bg-teal-500/20 rounded-lg flex items-center justify-center text-teal-400 font-black text-xs">{selectedTests.length}</div><span className="text-[11px] font-black text-white uppercase tracking-widest">Orden Paciente</span></div>
                       {selectedTests.length > 0 && <button onClick={() => setSelectedTestIds([])} className="text-[8px] font-black text-rose-500/40 hover:text-rose-500 uppercase">Limpiar</button>}
                    </div>
                    <div className="space-y-2 pr-1">
                       {selectedTests.map(t => (
                         <div key={t.id} className="flex items-center justify-between p-3 bg-white/[0.03] border border-white/5 rounded-2xl animate-in slide-in-from-right-4 transition-all">
                            <div className="min-w-0 flex-1 pr-2"><div className="text-[9px] font-black text-white uppercase truncate">{t.name}</div><div className="text-[8px] text-teal-400 font-mono mt-0.5">${t.price.toFixed(2)}</div></div>
                            <button onClick={() => setSelectedTestIds(prev => prev.filter(id => id !== t.id))} className="w-6 h-6 flex items-center justify-center bg-slate-950 hover:bg-rose-500 text-slate-700 hover:text-white rounded-lg transition-all shadow-xl"><X className="w-3.5 h-3.5" /></button>
                         </div>
                       ))}
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                     <button onClick={() => setIsStat(!isStat)} className={`w-full p-4 rounded-2xl border flex items-center justify-between transition-all ${isStat ? 'bg-rose-500/10 border-rose-500/50 shadow-lg' : 'bg-slate-950 border-white/5'}`}>
                        <div className="flex items-center space-x-3"><Zap className={`w-4 h-4 ${isStat ? 'text-rose-500 animate-pulse' : 'text-slate-700'}`} /><span className={`text-[10px] font-black uppercase tracking-widest ${isStat ? 'text-rose-400' : 'text-slate-500'}`}>Urgencia STAT</span></div>
                        <div className={`w-10 h-5 rounded-full relative transition-colors ${isStat ? 'bg-rose-500' : 'bg-slate-800'}`}><div className={`absolute top-0.5 w-2 h-2 rounded-full bg-white transition-all ${isStat ? 'left-5' : 'left-1'}`}></div></div>
                     </button>
                     <button onClick={() => setIsFasting(!isFasting)} className={`w-full p-4 rounded-2xl border flex items-center justify-between transition-all ${isFasting ? 'bg-teal-500/10 border-teal-500/50 shadow-lg' : 'bg-slate-950 border-white/5'}`}>
                        <div className="flex items-center space-x-3"><Clock className={`w-4 h-4 ${isFasting ? 'text-teal-400' : 'text-slate-700'}`} /><span className={`text-[10px] font-black uppercase tracking-widest ${isFasting ? 'text-teal-400' : 'text-slate-500'}`}>Paciente Ayunas</span></div>
                        <div className={`w-10 h-5 rounded-full relative transition-colors ${isFasting ? 'bg-teal-500' : 'bg-slate-800'}`}><div className={`absolute top-0.5 w-2 h-2 rounded-full bg-white transition-all ${isFasting ? 'left-5' : 'left-1'}`}></div></div>
                     </button>
                  </div>
               </div>

               <div className="pt-6 border-t border-white/10 space-y-6 relative z-10 shrink-0">
                  <div className="flex flex-col items-center">
                     <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1 text-center w-full">Monto Total de Servicio</span>
                     <div className="flex items-center justify-center"><span className="text-lg font-black text-teal-500/80 mr-1">$</span><span className="text-5xl font-black text-white tracking-tighter">{totalAmount.toFixed(2)}</span></div>
                  </div>
                  <button onClick={handleCreateOrderSubmit} disabled={!foundPatient && !isRegistering} className={`w-full py-5 rounded-3xl text-[10px] font-black uppercase tracking-[0.4em] shadow-2xl transition-all transform hover:-translate-y-1 active:scale-95 flex items-center justify-center space-x-3 disabled:opacity-30 disabled:grayscale ${isStat ? 'bg-gradient-to-r from-rose-500 to-red-600 text-white' : 'bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950'}`}>
                    <CheckCircle2 className="w-6 h-6 stroke-[3]" />
                    <span>Confirmar Ingreso</span>
                  </button>
               </div>
            </div>
          </div>

        </div>
      ) : activeSubTab === 'MANAGEMENT' ? (
        /* MANAGEMENT WORKSPACE */
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20 px-4">
          <div className="relative bg-slate-900 border-2 border-white/5 rounded-[2rem] flex items-center px-8 py-5 shadow-2xl">
            <Search className="w-6 h-6 text-teal-400 shrink-0" />
            <input type="text" placeholder="Rastrear por UID, Nombre o Cédula..." value={managementSearchTerm} onChange={(e) => setManagementSearchTerm(e.target.value)} className="bg-transparent border-none focus:ring-0 w-full ml-6 text-xl text-white placeholder-slate-700 font-black tracking-tighter" />
          </div>
          <div className="grid grid-cols-1 gap-4">
             {filteredOrdersManagement.map(order => (
               <div key={order.id} className="bg-slate-900/60 backdrop-blur-3xl border border-white/5 p-6 rounded-[2.5rem] flex flex-wrap items-center justify-between gap-6 hover:bg-slate-800/80 hover:border-teal-500/20 transition-all shadow-xl group relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                 <div className="flex items-center space-x-6 relative z-10">
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
                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{order.testIds.length} Análisis</div>
                     </div>
                   </div>
                 </div>
                 <div className="flex items-center space-x-4 relative z-10">
                   <div className="text-right mr-4 hidden sm:block">
                      <div className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">Registro</div>
                      <div className="text-[10px] font-bold text-slate-400">{new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                   </div>
                   <button onClick={() => alert('Generando barras...')} className="flex items-center space-x-3 bg-slate-950 hover:bg-white/10 text-white border border-white/10 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all hover:border-teal-500/30"><Barcode className="w-4 h-4 text-teal-400" /><span>Etiquetas</span></button>
                   <button onClick={() => onOpenPdf(order.id)} className="w-12 h-12 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition-all"><ArrowRight className="w-6 h-6 stroke-[3]" /></button>
                 </div>
               </div>
             ))}
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
      {showSuccessDialog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/98 backdrop-blur-3xl animate-in fade-in duration-500">
          <div className="bg-slate-900 border border-white/10 rounded-[4rem] p-10 max-w-lg w-full text-center space-y-10 shadow-[0_0_150px_rgba(20,184,166,0.2)]">
             <div className="w-24 h-20 bg-teal-500/20 rounded-[2.25rem] flex items-center justify-center mx-auto border border-teal-500/30">
                <CheckCircle2 className="w-12 h-12 text-teal-400 stroke-[3]" />
             </div>
             <div><h2 className="text-3xl font-black text-white tracking-tighter uppercase italic leading-none">Ingreso Exitoso</h2><p className="text-slate-500 text-[9px] font-bold uppercase tracking-[0.4em] mt-6">Sincronizado con Núcleo LISCORE</p></div>
             <div className="grid grid-cols-2 gap-4">
                <button onClick={() => alert('Generando barras...')} className="p-6 bg-slate-950 border border-white/5 rounded-[2rem] hover:bg-teal-500 hover:text-slate-950 transition-all flex flex-col items-center group relative overflow-hidden shadow-2xl"><Barcode className="w-8 h-8 mb-4 text-teal-400 group-hover:text-slate-950 relative z-10" /><span className="text-[9px] font-black uppercase tracking-[0.3em] relative z-10">Generar Barras</span></button>
                <button onClick={() => alert('Imprimiendo ticket...')} className="p-6 bg-slate-950 border border-white/5 rounded-[2rem] hover:bg-teal-500 hover:text-slate-950 transition-all flex flex-col items-center group relative overflow-hidden shadow-2xl"><Receipt className="w-8 h-8 mb-4 text-teal-400 group-hover:text-slate-950 relative z-10" /><span className="text-[9px] font-black uppercase tracking-[0.3em] relative z-10">Ticket Muestra</span></button>
             </div>
             <button onClick={() => { setShowSuccessDialog(null); setSelectedTestIds([]); setPatientSearchTerm(''); setFoundPatient(null); }} className="w-full py-6 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.4em] transition-all transform active:scale-95 shadow-2xl">Siguiente Registro</button>
          </div>
        </div>
      )}

    </div>
  );
};
