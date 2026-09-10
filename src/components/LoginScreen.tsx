import React, { useState } from 'react';
import { Role, User, Tenant, Branch } from '../types';
import { MOCK_TENANTS, MOCK_USERS } from '../data/mockData';
import { ROLE_LABELS } from './Header';
import loginBg from '@/login-bg.png';
import {
  ShieldCheck, Building2, Lock, CheckCircle2, Activity,
  Users, LogIn, Eye, EyeOff, AlertTriangle, Key, Sparkles,
  Search, Stethoscope, Microscope, FileText, ArrowRight, Play, Heart, X
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
  const currentBranch = availableBranches.find((b) => b.id === selectedBranchId) || availableBranches[0];

  const handleTenantSelect = (tenantId: string) => {
    setSelectedTenantId(tenantId);
    const tenant = MOCK_TENANTS.find((t) => t.id === tenantId) || MOCK_TENANTS[0];
    if (tenant.branches.length > 0) {
      setSelectedBranchId(tenant.branches[0].id);
    }
  };

  const filteredUsers = MOCK_USERS.filter((u) => {
    const matchesTenant = u.tenantId === selectedTenantId || u.role === 'abregotech_admin';
    const matchesRole = selectedRoleFilter === 'all' || u.role === selectedRoleFilter;
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.licenseNumber && u.licenseNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      ROLE_LABELS[u.role].title.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesTenant && matchesRole && matchesSearch;
  });

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

      const isPasswordValid = passwordInput.trim() === expectedPassword || passwordInput.trim() === '123456';
      const isPinValid = !selectedUser.twoFactorEnabled || pinInput.trim() === expectedPin || pinInput.trim() === '1234';

      if (!isPasswordValid) {
        setIsAuthenticating(false);
        setErrorMessage('Contraseña incorrecta.');
        return;
      }

      if (!isPinValid) {
        setIsAuthenticating(false);
        setPinInput('');
        setErrorMessage('PIN 2FA incorrecto.');
        return;
      }

      setIsAuthenticating(false);
      onLogin(selectedUser, currentTenant, currentBranch);
    }, 300);
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
    <div
      className="h-screen w-screen max-h-screen max-w-full bg-slate-950 text-slate-100 flex flex-col justify-between p-2.5 sm:p-3.5 lg:p-4 relative overflow-hidden font-sans select-none bg-cover bg-no-repeat"
      style={{ backgroundImage: `url(${loginBg})`, backgroundPosition: 'center 25%' }}
    >
      {/* TOP BAR */}
      <div className="relative z-10 flex items-center justify-end w-full shrink-0">
        <div className="px-3 py-1 rounded-full bg-slate-900/80 border border-slate-700/80 text-slate-200 text-xs font-bold flex items-center space-x-1.5 cursor-pointer hover:border-slate-500 backdrop-blur-md transition shadow-md">
          <span className="text-xs">🇵🇦</span>
          <span>ES</span>
          <span className="text-[9px] text-slate-400">▼</span>
        </div>
      </div>

      {/* MAIN 2-COLUMN CONTENT */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-4 items-center my-auto w-full max-w-7xl mx-auto flex-1 py-1">

        {/* LEFT COLUMN: Empty area revealing pristine background image artwork */}
        <div className="hidden lg:flex lg:col-span-7 xl:col-span-7 h-full" />

        {/* RIGHT COLUMN: Glassmorphic Login Box Harmonized with Background Palette */}
        <div className="lg:col-span-5 xl:col-span-5 flex justify-center lg:justify-end h-full items-center">
          <div className="w-full max-w-[430px] h-[83vh] max-h-[740px] min-h-[580px] bg-[#040a21]/90 backdrop-blur-2xl border-2 border-cyan-400/40 rounded-3xl p-6 sm:p-7 shadow-[0_25px_60px_-10px_rgba(0,240,255,0.2)] ring-1 ring-cyan-500/30 relative z-10 flex flex-col justify-between">

            {/* Card Header with Golden Sunset Accent */}
            <div className="text-center space-y-1 border-b border-cyan-500/25 pb-2">
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Bienvenido <span className="text-amber-400">.</span>
              </h2>
              <p className="text-xs text-cyan-200/80 font-medium">
                Inicia sesión para acceder a tu cuenta LIS / HIS
              </p>
            </div>

            {/* Form Controls */}
            <form onSubmit={handleAuthenticate} className="space-y-3">

              {/* Sede */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-cyan-300 flex items-center space-x-1.5">
                  <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Sede / Centro Clínico</span>
                </label>
                <select
                  value={selectedTenantId}
                  onChange={(e) => handleTenantSelect(e.target.value)}
                  className="w-full bg-[#020718] border border-cyan-500/40 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 font-bold focus:outline-none focus:border-cyan-400 cursor-pointer shadow-inner"
                >
                  {MOCK_TENANTS.map((t) => (
                    <option key={t.id} value={t.id} className="bg-slate-900 text-white">
                      {t.name} ({t.branches[0]?.name || 'Central'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Usuario */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-cyan-300 flex items-center space-x-1.5">
                    <Users className="w-3.5 h-3.5 text-amber-400" />
                    <span>Usuario ({filteredUsers.length})</span>
                  </label>

                  <div className="flex items-center gap-1 overflow-x-auto no-scrollbar max-w-[200px]">
                    {LAB_ROLES.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setSelectedRoleFilter(r.id)}
                        className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition shrink-0 cursor-pointer ${
                          selectedRoleFilter === r.id
                            ? 'bg-amber-400 text-slate-950 font-black shadow-md'
                            : 'bg-[#020718] text-slate-300 border border-slate-700'
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-cyan-400/60 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Filtrar..."
                      className="w-full bg-[#020718] border border-cyan-500/40 rounded-xl pl-7 pr-4 py-2 text-xs text-white font-medium placeholder-slate-400 focus:outline-none focus:border-cyan-400 shadow-inner"
                    />
                  </div>

                  <select
                    value={selectedUser?.id || ''}
                    onChange={(e) => {
                      const u = MOCK_USERS.find((usr) => usr.id === e.target.value);
                      if (u) handleUserSelect(u);
                    }}
                    className="w-full bg-[#020718] border border-cyan-500/40 rounded-xl px-2.5 py-2 text-xs text-cyan-300 font-bold focus:outline-none focus:border-cyan-400 cursor-pointer truncate shadow-inner"
                  >
                    {filteredUsers.map((u) => (
                      <option key={u.id} value={u.id} className="bg-slate-900 text-white">
                        {u.name} — {ROLE_LABELS[u.role].title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Contraseña & PIN 2FA */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-cyan-300 flex items-center justify-between">
                    <span className="flex items-center space-x-1">
                      <Lock className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Contraseña</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setPasswordInput(selectedUser?.role === 'abregotech_admin' ? 'admin123' : '123456');
                        setPinInput(selectedUser?.pinCode || '1234');
                      }}
                      className="text-[10px] text-amber-300 hover:text-white font-bold flex items-center space-x-0.5 bg-amber-500/20 px-1.5 py-0.2 rounded border border-amber-400/40"
                      title="Auto-completar credenciales demo"
                    >
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span>Auto</span>
                    </button>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#020718] border border-cyan-500/40 rounded-xl pl-3 pr-7 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono font-bold shadow-inner"
                      required
                      disabled={isAuthenticating}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-cyan-300 flex items-center justify-between">
                    <span className="flex items-center space-x-1">
                      <Key className="w-3.5 h-3.5 text-amber-400" />
                      <span>PIN 2FA</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {selectedUser?.twoFactorEnabled ? 'Req.' : 'Opc.'}
                    </span>
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••"
                    className="w-full bg-[#020718] border border-cyan-500/40 rounded-xl px-3 py-2 text-xs text-amber-300 text-center font-mono font-bold tracking-widest focus:outline-none focus:border-amber-400 shadow-inner"
                    required={selectedUser?.twoFactorEnabled}
                    disabled={isAuthenticating}
                  />
                </div>
              </div>

              {/* Error Banner */}
              {errorMessage && (
                <div className="p-2 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Vibrant Electric Hospital Blue / Cyan Gradient Button */}
              <button
                type="submit"
                disabled={isAuthenticating}
                className="w-full py-3 bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-400 hover:brightness-110 text-slate-950 font-black rounded-full text-xs sm:text-sm tracking-wider uppercase transition shadow-[0_10px_25px_rgba(0,240,255,0.35)] cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-50 mt-1"
              >
                {isAuthenticating ? (
                  <span>Autenticando...</span>
                ) : (
                  <>
                    <ArrowRight className="w-4 h-4 stroke-[3]" />
                    <span>INICIAR SESIÓN</span>
                  </>
                )}
              </button>
            </form>

            {/* Quick Links Row (SaaS Demo + Patient Access) */}
            <div className="pt-2 border-t border-cyan-500/25 flex items-center justify-between text-xs font-bold gap-1">
              <button
                type="button"
                onClick={() => {
                  const demoUser = MOCK_USERS.find(u => u.role === 'owner') || MOCK_USERS[0];
                  onLogin(demoUser, MOCK_TENANTS[0], MOCK_TENANTS[0].branches[0]);
                }}
                className="text-amber-300 hover:text-amber-200 flex items-center space-x-1 cursor-pointer transition"
              >
                <Play className="w-3.5 h-3.5 fill-current text-amber-400" />
                <span>SaaS Demo</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPatientLookupError(null);
                  setIsPatientModalOpen(true);
                }}
                className="text-cyan-300 hover:text-cyan-200 flex items-center space-x-1 cursor-pointer transition"
              >
                <Search className="w-3.5 h-3.5 text-cyan-400" />
                <span>¿Paciente? Ver Resultados</span>
              </button>
            </div>

          </div>
        </div>

      </div>

      {/* BOTTOM FOOTER BAR (High contrast white text) */}
      <div className="relative z-10 flex items-center justify-between w-full pt-1.5 shrink-0">
        <div className="flex items-center space-x-2 bg-slate-950/70 border border-teal-500/30 px-3.5 py-1 rounded-full backdrop-blur-md shadow-md">
          <ShieldCheck className="w-4 h-4 text-cyan-300 drop-shadow" />
          <span className="text-xs font-bold text-white tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
            Cumplimiento normativo | MINSA – CSS – Estándares internacionales
          </span>
        </div>

        <div className="flex items-center space-x-1.5 bg-slate-950/70 border border-slate-700/80 px-3.5 py-1 rounded-full backdrop-blur-md shadow-md text-xs font-black text-white">
          <span className="text-sm">🇵🇦</span>
          <span className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">Panamá</span>
        </div>
      </div>

      {/* PATIENT MODAL */}
      {isPatientModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-2xl flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-cyan-500/30 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-6 relative overflow-hidden text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-500/40 text-teal-300 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Portal de Pacientes</h3>
                  <p className="text-xs text-slate-400">Consulta e impresión de resultados Ley 81</p>
                </div>
              </div>
              <button onClick={() => setIsPatientModalOpen(false)} className="text-slate-500 hover:text-white font-bold p-1 bg-slate-800 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const patientUser = MOCK_USERS.find((u) => u.role === 'patient') || MOCK_USERS[0];
                onLogin(patientUser, currentTenant, currentBranch);
              }}
              className="space-y-4 text-xs"
            >
              <div className="space-y-1">
                <label className="font-bold text-slate-300">N° de Cédula o Pasaporte:</label>
                <input
                  type="text"
                  required
                  value={patientCedulaInput}
                  onChange={(e) => setPatientCedulaInput(e.target.value)}
                  placeholder="ej. 8-812-4432"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-teal-400"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300">N° de Orden o Ticket de Muestra:</label>
                <input
                  type="text"
                  required
                  value={patientOrderInput}
                  onChange={(e) => setPatientOrderInput(e.target.value)}
                  placeholder="ej. ORD-2026-8801"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-teal-400"
                />
              </div>

              <div className="p-3 bg-teal-500/10 border border-teal-500/20 rounded-xl space-y-1.5">
                <div className="text-xs font-bold text-teal-300 flex items-center justify-between">
                  <span className="flex items-center space-x-1">
                    <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                    <span>Prueba Rápida:</span>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const patientUser = MOCK_USERS.find((u) => u.role === 'patient') || MOCK_USERS[0];
                    onLogin(patientUser, currentTenant, currentBranch);
                  }}
                  className="w-full py-2 bg-teal-500/20 hover:bg-teal-500/30 text-teal-200 border border-teal-400/30 rounded-xl font-bold text-xs transition cursor-pointer flex items-center justify-center space-x-1.5"
                >
                  <span>🧪 Entrar como Gabriela Pinzón (Cédula: 8-812-4432)</span>
                  <ArrowRight className="w-3.5 h-3.5 text-teal-300" />
                </button>
              </div>

              {patientLookupError && (
                <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-xl flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{patientLookupError}</span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end space-x-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsPatientModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-teal-400 to-emerald-400 text-slate-950 font-black rounded-xl text-xs transition shadow-lg shadow-teal-500/20 cursor-pointer flex items-center space-x-1.5"
                >
                  <Search className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Buscar e Ingresar a Mis Resultados</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
