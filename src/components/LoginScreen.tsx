import React, { useState } from 'react';
import { Role, User, Tenant, Branch } from '../types';
import { MOCK_TENANTS, MOCK_USERS } from '../data/mockData';
import { ROLE_LABELS } from './Header';
import {
  ShieldCheck, Building2, Lock, CheckCircle2, Activity,
  Users, LogIn, Eye, EyeOff, AlertTriangle, Key, Sparkles, HelpCircle,
  Search, Stethoscope, Microscope, FileText, ArrowRight, Zap, Fingerprint, RefreshCw, X
} from 'lucide-react';

interface LoginScreenProps {
  onLogin: (user: User, tenant: Tenant, branch: Branch) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [selectedTenantId, setSelectedTenantId] = useState<string>('lab-san-jose');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('branch-via-espana');
  
  const [portalCategory, setPortalCategory] = useState<'all' | 'lab' | 'doctor' | 'admin'>('lab');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const [isPatientModalOpen, setIsPatientModalOpen] = useState<boolean>(false);
  const [patientCedulaInput, setPatientCedulaInput] = useState<string>('8-812-4432');
  const [patientOrderInput, setPatientOrderInput] = useState<string>('20260810073000');
  const [patientLookupError, setPatientLookupError] = useState<string | null>(null);

  const [selectedUser, setSelectedUser] = useState<User | null>(() => {
    return MOCK_USERS.find((u) => u.role === 'lab_chief') || MOCK_USERS[0];
  });
  
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [pinInput, setPinInput] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showDemoHelp, setShowDemoHelp] = useState<boolean>(true);
  
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const currentTenant = MOCK_TENANTS.find((t) => t.id === selectedTenantId) || MOCK_TENANTS[0];
  const availableBranches = currentTenant.branches;
  const currentBranch = availableBranches.find((b) => b.id === (selectedBranchId || selectedBranchId)) || availableBranches[0];

  const handleTenantSelect = (tenantId: string) => {
    setSelectedTenantId(tenantId);
    const tenant = MOCK_TENANTS.find((t) => t.id === tenantId) || MOCK_TENANTS[0];
    if (tenant.branches.length > 0) {
      setSelectedBranchId(tenant.branches[0].id);
    }
  };

  const filteredUsers = MOCK_USERS.filter((u) => {
    const matchesTenant = u.tenantId === selectedTenantId || u.role === 'abregotech_admin';
    let matchesCategory = true;
    if (portalCategory === 'lab') {
      matchesCategory = ['owner', 'lab_chief', 'tech_med', 'lab_tech', 'receptionist'].includes(u.role);
    } else if (portalCategory === 'doctor') {
      matchesCategory = u.role === 'ext_doctor';
    } else if (portalCategory === 'admin') {
      matchesCategory = u.role === 'abregotech_admin';
    }
    const matchesRole = selectedRoleFilter === 'all' || u.role === selectedRoleFilter;
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.licenseNumber && u.licenseNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      ROLE_LABELS[u.role].title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTenant && matchesCategory && matchesRole && matchesSearch;
  });

  React.useEffect(() => {
    if (filteredUsers.length > 0) {
      const isStillInList = filteredUsers.some(u => u.id === selectedUser?.id);
      if (!isStillInList) {
        setSelectedUser(filteredUsers[0]);
      }
    } else {
      setSelectedUser(null);
    }
  }, [selectedRoleFilter, portalCategory, searchTerm, selectedTenantId]);

  const handleCategoryChange = (category: 'all' | 'lab' | 'doctor' | 'admin') => {
    setPortalCategory(category);
    setSelectedRoleFilter('all');
    setSearchTerm('');
  };

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    setPasswordInput('');
    setPinInput('');
    setErrorMessage(null);
  };

  const handleAuthenticate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) {
      setErrorMessage('Seleccione un usuario.');
      return;
    }
    setErrorMessage(null);
    setIsAuthenticating(true);
    setTimeout(() => {
      const expectedPassword = selectedUser.password || '123456';
      const expectedPin = selectedUser.pinCode || '1234';
      if (passwordInput.trim() !== expectedPassword) {
        setIsAuthenticating(false);
        setErrorMessage('Contraseña incorrecta.');
        return;
      }
      if (selectedUser.twoFactorEnabled && pinInput.trim() !== expectedPin) {
        setIsAuthenticating(false);
        setErrorMessage(`PIN 2FA incorrecto (PIN asignado: ${expectedPin}).`);
        return;
      }
      setIsAuthenticating(false);
      onLogin(selectedUser, currentTenant, currentBranch);
    }, 400);
  };

  const LAB_ROLES = [
    { id: 'all', label: 'Todos' },
    { id: 'lab_chief', label: 'Jefe Lab' },
    { id: 'tech_med', label: 'Tecnólogo' },
    { id: 'lab_tech', label: 'Técnico' },
    { id: 'owner', label: 'Gerente' },
    { id: 'receptionist', label: 'Recepción' },
  ];

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col lg:flex-row relative overflow-hidden font-sans selection:bg-teal-500/30">
      {/* Background Decor */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-teal-500/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[10%] right-[10%] w-[30%] h-[30%] bg-blue-600/5 rounded-full blur-[100px]"></div>
      </div>

      {/* LEFT SIDE: BRANDING (Professional & Modern) */}
      <div className="hidden lg:flex lg:w-5/12 flex-col justify-center p-16 xl:p-24 relative z-10 border-r border-white/5 bg-slate-950/20 backdrop-blur-3xl">
        <div className="space-y-12 animate-in fade-in slide-in-from-left-12 duration-1000">
           <div className="space-y-8">
              <div className="w-20 h-20 bg-teal-500 rounded-3xl flex items-center justify-center shadow-[0_20px_50px_rgba(20,184,166,0.3)] rotate-3">
                 <Activity className="w-10 h-10 text-slate-950 -rotate-3" />
              </div>
              <div className="space-y-4">
                <h1 className="text-6xl font-black text-white tracking-tighter leading-[0.9] uppercase">
                   LOCKED-IN <br/>
                   <span className="text-teal-400 italic">PRECISION.</span>
                </h1>
                <p className="text-slate-400 text-xl font-medium leading-relaxed max-w-sm">
                   El núcleo inteligente para laboratorios clínicos de alta complejidad.
                </p>
              </div>
           </div>

           <div className="space-y-6">
              {[
                { icon: ShieldCheck, title: 'ISO 15189', desc: 'Calidad analítica automatizada.' },
                { icon: Zap, title: 'ASTM / HL7', desc: 'Integración nativa con equipos.' },
                { icon: Lock, title: 'LEY 81', desc: 'Privacidad de datos blindada.' }
              ].map((item, i) => (
                <div key={i} className="flex items-center space-x-4 group">
                   <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-teal-500 group-hover:text-slate-950 transition-all duration-500">
                      <item.icon className="w-5 h-5" />
                   </div>
                   <div>
                      <h4 className="text-white font-black text-xs uppercase tracking-widest">{item.title}</h4>
                      <p className="text-slate-500 text-[10px] mt-1 uppercase font-bold">{item.desc}</p>
                   </div>
                </div>
              ))}
           </div>
        </div>
      </div>

      {/* RIGHT SIDE: LOGIN CONTAINER */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 relative z-10 overflow-y-auto">
        <div className="w-full max-w-[460px] space-y-10 animate-in fade-in zoom-in-95 duration-700 my-auto">

          <div className="text-center lg:text-left space-y-2">
             <div className="lg:hidden w-16 h-16 bg-teal-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl"><Activity className="w-10 h-10 text-slate-950" /></div>
             <h2 className="text-3xl font-black text-white tracking-tight leading-none uppercase">Bienvenido de nuevo</h2>
             <p className="text-slate-500 text-sm font-medium">Ingrese sus credenciales de acceso sanitario.</p>
          </div>

          <div className="bg-slate-900/40 border border-white/5 rounded-[3rem] p-8 sm:p-10 shadow-2xl space-y-8 backdrop-blur-xl">
            <div className="grid grid-cols-3 gap-1.5 p-1.5 bg-slate-950 border border-slate-800 rounded-2xl">
              {[
                { id: 'lab', label: 'Lab', icon: Microscope, color: 'bg-teal-500' },
                { id: 'doctor', label: 'Médico', icon: Stethoscope, color: 'bg-indigo-500' },
                { id: 'admin', label: 'Admin', icon: ShieldCheck, color: 'bg-amber-500' }
              ].map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleCategoryChange(cat.id as any)}
                  className={`py-2.5 rounded-xl text-xs font-black transition flex items-center justify-center space-x-2 cursor-pointer ${
                    portalCategory === cat.id ? `${cat.color} text-slate-950 shadow-lg` : 'text-slate-500 hover:text-slate-200'
                  }`}
                >
                  <cat.icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{cat.label}</span>
                </button>
              ))}
            </div>

            <form onSubmit={handleAuthenticate} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">1. Sede Operativa</label>
                <select
                  value={selectedTenantId}
                  onChange={(e) => handleTenantSelect(e.target.value)}
                  className="w-full bg-slate-950 border-2 border-slate-800 rounded-2xl px-5 py-3 text-xs text-white font-bold focus:border-teal-500 outline-none appearance-none cursor-pointer transition-all shadow-inner"
                >
                  {MOCK_TENANTS.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">2. Usuario Autorizado</label>

                {portalCategory === 'lab' && (
                  <div className="flex flex-wrap gap-1.5 px-1">
                    {LAB_ROLES.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setSelectedRoleFilter(r.id)}
                        className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                          selectedRoleFilter === r.id ? 'bg-white/10 text-teal-400 border border-teal-500/30' : 'bg-slate-950 text-slate-600 border border-transparent hover:border-white/5'
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                )}

                <div className="relative group">
                  <Search className="w-4 h-4 text-slate-600 absolute left-4 top-3.5 group-focus-within:text-teal-500 transition-colors" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Búsqueda por nombre..."
                    className="w-full bg-slate-950 border-2 border-slate-800 rounded-2xl pl-12 pr-4 py-3 text-xs text-white placeholder-slate-800 outline-none focus:border-teal-500 transition-all shadow-inner font-bold"
                  />
                </div>

                <select
                  value={selectedUser?.id || ''}
                  onChange={(e) => {
                    const u = MOCK_USERS.find((usr) => usr.id === e.target.value);
                    if (u) handleUserSelect(u);
                  }}
                  className="w-full bg-slate-950 border-2 border-slate-800 rounded-2xl px-5 py-3 text-xs text-teal-400 font-black outline-none focus:border-teal-500 cursor-pointer shadow-inner"
                >
                  {filteredUsers.map((u) => (
                    <option key={u.id} value={u.id}>{u.name} — {ROLE_LABELS[u.role].title}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">3. Credenciales</label>
                    <button type="button" onClick={() => setShowDemoHelp(!showDemoHelp)} className="text-[9px] font-black text-teal-500/50 hover:text-teal-400 uppercase tracking-widest">
                      {showDemoHelp ? 'Ocultar Demo' : 'Ver Demo'}
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="CONTRASEÑA"
                      className="w-full bg-slate-950 border-2 border-slate-800 rounded-2xl pl-5 pr-12 py-3.5 text-sm text-white outline-none focus:border-teal-500 font-mono tracking-widest shadow-inner"
                      required
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-3.5 text-slate-600 hover:text-teal-400">
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {selectedUser?.twoFactorEnabled && (
                  <div className="space-y-2 animate-in slide-in-from-top-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">4. PIN de Seguridad 2FA</label>
                    <input
                      type="password"
                      maxLength={4}
                      value={pinInput}
                      onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                      placeholder="••••"
                      className="w-full bg-slate-950 border-2 border-slate-800 rounded-2xl px-5 py-3.5 text-xl text-teal-400 text-center font-mono tracking-[1em] outline-none focus:border-emerald-500 shadow-inner"
                      required
                    />
                  </div>
                )}
              </div>

              {showDemoHelp && (
                <div className="p-4 bg-teal-500/5 border border-teal-500/20 rounded-2xl flex items-center justify-between group">
                  <div className="text-[10px] font-black text-teal-400/80 uppercase">
                    Pass: <span className="text-white">123456</span> <span className="mx-2 opacity-30">|</span> PIN: <span className="text-white">1234</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setPasswordInput('123456'); setPinInput('1234'); }}
                    className="px-3 py-1.5 bg-teal-500 text-slate-950 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-lg group-hover:scale-105 transition-transform"
                  >
                    Auto-Fill
                  </button>
                </div>
              )}

              {errorMessage && (
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-black uppercase tracking-tight flex items-center space-x-3 animate-shake">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isAuthenticating}
                className="w-full py-5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black rounded-3xl text-xs uppercase tracking-[0.3em] shadow-[0_20px_40px_rgba(20,184,166,0.2)] transition-all transform hover:-translate-y-1 active:scale-95 flex items-center justify-center space-x-3"
              >
                {isAuthenticating ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <><LogIn className="w-5 h-5 stroke-[2.5]" /><span>Acceder al Núcleo LIS</span></>
                )}
              </button>
            </form>
          </div>

          {/* BOTTOM ACTIONS */}
          <div className="grid grid-cols-1 gap-4 pt-4 border-t border-white/5">
            <button
              onClick={() => setIsPatientModalOpen(true)}
              className="p-5 bg-white/5 border border-white/5 rounded-3xl flex items-center justify-between group hover:border-teal-500/30 transition-all"
            >
              <div className="flex items-center space-x-4 text-left">
                <div className="w-12 h-12 rounded-2xl bg-teal-500/10 flex items-center justify-center text-teal-400 group-hover:bg-teal-500 group-hover:text-slate-950 transition-all"><FileText className="w-6 h-6" /></div>
                <div>
                   <div className="text-xs font-black text-white uppercase tracking-widest">Portal de Pacientes</div>
                   <div className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">Consultar resultados directos</div>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-700 group-hover:text-teal-400 group-hover:translate-x-1 transition-all" />
            </button>

            <div className="text-center text-[10px] text-slate-600 font-black uppercase tracking-[0.4em] flex items-center justify-center space-x-3 opacity-50">
               <ShieldCheck className="w-4 h-4" />
               <span>AbregoTech LIS CORE — Panama</span>
            </div>
          </div>
        </div>
      </div>

      {/* PATIENT MODAL (Modernized) */}
      {isPatientModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-2xl flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-[4rem] max-w-md w-full p-10 shadow-[0_0_100px_rgba(20,184,166,0.15)] space-y-8 relative overflow-hidden">
            <div className="absolute -top-32 -right-32 w-64 h-64 bg-teal-500/10 rounded-full blur-[100px]"></div>

            <div className="flex items-center justify-between border-b border-white/5 pb-6 relative z-10">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-2xl bg-teal-500 flex items-center justify-center text-slate-950 shadow-lg"><FileText className="w-6 h-6" /></div>
                <div>
                  <h3 className="font-black text-white text-xl uppercase tracking-tighter italic">Resultados</h3>
                  <p className="text-[10px] text-teal-500/60 font-black uppercase tracking-widest">Acceso Público Seguro</p>
                </div>
              </div>
              <button onClick={() => setIsPatientModalOpen(false)} className="text-slate-600 hover:text-white transition-colors p-2 bg-white/5 rounded-full"><X className="w-5 h-5" /></button>
            </div>

            <form
              onSubmit={(e) => { e.preventDefault(); onLogin(MOCK_USERS.find(u => u.role === 'patient')!, currentTenant, currentBranch); }}
              className="space-y-6 relative z-10"
            >
              <div className="space-y-2">
                 <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-4">Cédula del Paciente</label>
                 <input type="text" placeholder="Ej. 8-123-4567" className="w-full bg-slate-950 border-2 border-slate-800 rounded-3xl px-6 py-4 text-sm text-white outline-none focus:border-teal-500 shadow-inner font-bold placeholder:text-slate-900" />
              </div>
              <div className="space-y-2">
                 <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-4">N° de Orden / Ticket</label>
                 <input type="text" placeholder="Ej. 20260818040409" className="w-full bg-slate-950 border-2 border-slate-800 rounded-3xl px-6 py-4 text-sm text-white outline-none focus:border-teal-500 shadow-inner font-bold placeholder:text-slate-900" />
              </div>
              <button type="submit" className="w-full py-5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black rounded-3xl text-xs uppercase tracking-[0.4em] shadow-xl transition-all transform active:scale-95">Ver Expediente</button>
            </form>

            <p className="text-[9px] text-center text-slate-600 font-bold leading-relaxed uppercase tracking-tighter">
              Al ingresar, usted acepta los términos de privacidad <br/> bajo la Ley 81 de Panamá.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
