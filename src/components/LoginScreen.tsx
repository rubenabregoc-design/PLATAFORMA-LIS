import React, { useState } from 'react';
import { Role, User, Tenant, Branch } from '../types';
import { MOCK_TENANTS, MOCK_USERS, MOCK_PATIENTS } from '../data/mockData';
import { useLisStore } from '../store/useLisStore';
import { ROLE_LABELS } from './Header';
import {
  ShieldCheck, Building2, Lock, CheckCircle2, Activity,
  Users, LogIn, Eye, EyeOff, AlertTriangle, Key, Sparkles, HelpCircle,
  Search, Stethoscope, Microscope, UserCircle, Heart, Shield, FileText, ArrowRight, Play
} from 'lucide-react';

interface LoginScreenProps {
  onLogin: (user: User, tenant: Tenant, branch: Branch) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const { setDemoMode } = useLisStore();
  const [selectedTenantId, setSelectedTenantId] = useState<string>('lab-san-jose');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('branch-via-espana');
  
  // Category Portal Selection: 'lab' (Laboratorio Staff), 'doctor' (Médicos Externos), 'admin' (AbregoTech Admin)
  const [portalCategory, setPortalCategory] = useState<'all' | 'lab' | 'doctor' | 'admin'>('lab');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Patient Results Modal State
  const [isPatientModalOpen, setIsPatientModalOpen] = useState<boolean>(false);
  const [patientCedulaInput, setPatientCedulaInput] = useState<string>('8-812-4432');
  const [patientOrderInput, setPatientOrderInput] = useState<string>('ORD-2026-8801');
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

  // Filter users by portal category and search term
  const filteredUsers = MOCK_USERS.filter((u) => {
    const matchesTenant = u.tenantId === selectedTenantId || u.role === 'abregotech_admin';
    
    // Category mapping
    let matchesCategory = true;
    if (portalCategory === 'lab') {
      matchesCategory = ['owner', 'lab_chief', 'tech_med', 'lab_tech', 'receptionist'].includes(u.role);
    } else if (portalCategory === 'doctor') {
      matchesCategory = u.role === 'ext_doctor';
    } else if (portalCategory === 'admin') {
      matchesCategory = u.role === 'abregotech_admin';
    }

    // Role filter
    const matchesRole = selectedRoleFilter === 'all' || u.role === selectedRoleFilter;

    // Search query
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.licenseNumber && u.licenseNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      ROLE_LABELS[u.role].title.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesTenant && matchesCategory && matchesRole && matchesSearch;
  });

  // Auto-select first user in filtered list when filters change
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
    
    // Auto select first user matching category
    const categoryUsers = MOCK_USERS.filter((u) => {
      if (category === 'lab') return ['owner', 'lab_chief', 'tech_med', 'lab_tech', 'receptionist'].includes(u.role);
      if (category === 'doctor') return u.role === 'ext_doctor';
      if (category === 'admin') return u.role === 'abregotech_admin';
      return true;
    });

    if (categoryUsers.length > 0) {
      setSelectedUser(categoryUsers[0]);
    }
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

      const isPasswordValid = passwordInput.trim() === expectedPassword;
      const isPinValid = !selectedUser.twoFactorEnabled || pinInput.trim() === expectedPin;

      if (!isPasswordValid) {
        setIsAuthenticating(false);
        setErrorMessage('Contraseña incorrecta.');
        return;
      }

      if (!isPinValid) {
        setIsAuthenticating(false);
        setErrorMessage(`PIN 2FA incorrecto (PIN asignado: ${expectedPin}).`);
        return;
      }

      setIsAuthenticating(false);
      onLogin(selectedUser, currentTenant, currentBranch);
    }, 400);
  };

  // Sub-roles for laboratory
  const LAB_ROLES = [
    { id: 'all', label: 'Todos' },
    { id: 'lab_chief', label: 'Jefe Lab' },
    { id: 'tech_med', label: 'Tecnólogo' },
    { id: 'lab_tech', label: 'Técnico' },
    { id: 'owner', label: 'Gerente' },
    { id: 'receptionist', label: 'Recepción' },
  ];

  return (
    <div className="min-h-screen bg-[#0b1329] text-slate-100 flex flex-col items-center justify-start sm:justify-center p-4 sm:p-6 relative overflow-y-auto font-sans">
      {/* Soft Background Glow Effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none"></div>

      {/* Main Login Box */}
      <div className="w-full max-w-lg bg-slate-900/95 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 space-y-5 my-auto">
        
        {/* Header */}
        <div className="text-center space-y-1 border-b border-slate-800/80 pb-4">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-400 to-emerald-400 p-0.5 shadow-lg shadow-teal-500/20 mb-1">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Activity className="w-6 h-6 text-teal-400" />
            </div>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            AbregoTech LIS
          </h1>
          <p className="text-xs text-slate-400">
            Portal de Acceso por Perfil Sanitario
          </p>
        </div>

        {/* Category Portal Selector (Laboratorio vs Médicos vs Súper Admin) */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
            <span>Tipo de Usuario / Portal Staff</span>
            <span className="text-[10px] text-teal-400 font-mono">Seleccione su área</span>
          </label>
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-2xl">
            <button
              type="button"
              onClick={() => handleCategoryChange('lab')}
              className={`py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                portalCategory === 'lab'
                  ? 'bg-teal-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Microscope className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Laboratorio</span>
            </button>

            <button
              type="button"
              onClick={() => handleCategoryChange('doctor')}
              className={`py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                portalCategory === 'doctor'
                  ? 'bg-indigo-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Médicos</span>
            </button>

            <button
              type="button"
              onClick={() => handleCategoryChange('admin')}
              className={`py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                portalCategory === 'admin'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-slate-950" />
              <span className="truncate">Súper Admin</span>
            </button>
          </div>
        </div>

        {/* Main Authentication Form */}
        <form onSubmit={handleAuthenticate} className="space-y-4">
          
          {/* 1. Sede Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
              <span className="flex items-center space-x-1.5">
                <Building2 className="w-3.5 h-3.5 text-teal-400" />
                <span>1. Sede o Centro Clínico</span>
              </span>
            </label>
            <select
              value={selectedTenantId}
              onChange={(e) => handleTenantSelect(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 font-medium focus:outline-none focus:border-teal-400 cursor-pointer"
            >
              {MOCK_TENANTS.map((t) => (
                <option key={t.id} value={t.id} className="bg-slate-900 text-white">
                  {t.name} ({t.branches[0]?.name || 'Central'})
                </option>
              ))}
            </select>
          </div>

          {/* 2. User Filter & Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                <span>2. Usuario ({filteredUsers.length})</span>
              </label>
            </div>

            {/* Sub-Role Chips (Flex Wrap - No Horizontal Clipping) */}
            {portalCategory === 'lab' && (
              <div className="flex flex-wrap gap-1 py-0.5">
                {LAB_ROLES.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setSelectedRoleFilter(r.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                      selectedRoleFilter === r.id
                        ? 'bg-teal-500 text-slate-950 shadow'
                        : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            )}

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nombre o idoneidad..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-2 text-slate-500 hover:text-slate-300 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Dropdown User Selector */}
            <select
              value={selectedUser?.id || ''}
              onChange={(e) => {
                const u = MOCK_USERS.find((usr) => usr.id === e.target.value);
                if (u) handleUserSelect(u);
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-emerald-300 font-bold focus:outline-none focus:border-emerald-400 cursor-pointer"
            >
              {filteredUsers.length === 0 ? (
                <option value="" disabled className="text-slate-500">
                  Sin usuarios coincidentes
                </option>
              ) : (
                filteredUsers.map((u) => (
                  <option key={u.id} value={u.id} className="bg-slate-900 text-white">
                    {u.name} — {ROLE_LABELS[u.role].title} {u.licenseNumber ? `(${u.licenseNumber})` : ''}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Selected User Badge */}
          {selectedUser && (
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
              <div>
                <div className="font-bold text-white flex items-center space-x-1.5">
                  <span>{selectedUser.name}</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                </div>
                <div className="text-[11px] text-teal-400 font-medium">
                  {ROLE_LABELS[selectedUser.role].title} {selectedUser.licenseNumber && `• ${selectedUser.licenseNumber}`}
                </div>
              </div>
              <span className="text-[10px] bg-slate-900 text-slate-400 px-2 py-0.5 rounded font-mono">
                {currentBranch.code}
              </span>
            </div>
          )}

          {/* 3. Password Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
              <span className="flex items-center space-x-1.5">
                <Lock className="w-3.5 h-3.5 text-teal-400" />
                <span>3. Contraseña</span>
              </span>
              <button
                type="button"
                onClick={() => setShowDemoHelp(!showDemoHelp)}
                className="text-[11px] text-teal-400 hover:underline flex items-center space-x-1"
              >
                <HelpCircle className="w-3 h-3" />
                <span>{showDemoHelp ? 'Ocultar datos' : 'Ver datos prueba'}</span>
              </button>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Ingresa tu contraseña"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-white focus:outline-none focus:border-teal-400 font-mono"
                required
                disabled={isAuthenticating}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* 4. PIN 2FA Input (Only if required/enabled) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
              <span className="flex items-center space-x-1.5">
                <Key className="w-3.5 h-3.5 text-emerald-400" />
                <span>PIN de Seguridad 2FA (4 dígitos)</span>
              </span>
              <span className="text-[10px] text-slate-500">
                {selectedUser?.twoFactorEnabled ? 'Requerido' : 'Opcional'}
              </span>
            </label>
            <input
              type="password"
              maxLength={4}
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
              placeholder="••••"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white text-center font-mono tracking-widest focus:outline-none focus:border-emerald-400"
              required={selectedUser?.twoFactorEnabled}
              disabled={isAuthenticating}
            />
          </div>

          {/* Demo Helper Box */}
          {showDemoHelp && (
            <div className="p-3 bg-teal-500/10 border border-teal-500/20 rounded-xl text-[11px] text-teal-300 space-y-1.5">
              <div className="font-bold flex items-center justify-between">
                <span className="flex items-center space-x-1">
                  <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                  <span>Credenciales sugeridas:</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setPasswordInput(selectedUser?.role === 'abregotech_admin' ? 'admin123' : '123456');
                    setPinInput(selectedUser?.pinCode || '1234');
                  }}
                  className="px-2 py-0.5 bg-teal-500/20 hover:bg-teal-500/30 text-teal-200 border border-teal-400/30 rounded text-[10px] font-bold cursor-pointer transition"
                >
                  ⚡ Auto-completar
                </button>
              </div>
              <p>Contraseña: <strong className="text-white font-mono">{selectedUser?.role === 'abregotech_admin' ? 'admin123' : '123456'}</strong></p>
              <p>PIN 2FA: <strong className="text-white font-mono">{selectedUser?.pinCode || '1234'}</strong></p>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isAuthenticating}
            className="w-full py-3.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black rounded-xl text-xs transition shadow-lg shadow-teal-500/20 cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {isAuthenticating ? (
              <span>Autenticando usuario...</span>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Ingresar al Sistema LIS</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setDemoMode(true);
              const demoUser = MOCK_USERS.find(u => u.role === 'owner') || MOCK_USERS[0];
              onLogin(demoUser, MOCK_TENANTS[0], MOCK_TENANTS[0].branches[0]);
            }}
            className="w-full py-3 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 font-black rounded-xl text-[10px] uppercase tracking-[0.2em] transition flex items-center justify-center space-x-2 shadow-inner"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Exploración Rápida (SaaS Demo)</span>
          </button>
        </form>

        {/* Patient Direct Access Banner */}
        <div className="pt-2 border-t border-slate-800/80">
          <div className="p-3.5 bg-slate-950/90 border border-teal-500/30 rounded-2xl flex items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-teal-500/20 border border-teal-500/40 text-teal-300 flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-xs text-white flex items-center space-x-1.5">
                  <span>¿Eres Paciente?</span>
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-[9px] font-mono">
                    Acceso Libre
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">Consulta y descarga tus resultados clínicos con Cédula y Orden.</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setPatientLookupError(null);
                setIsPatientModalOpen(true);
              }}
              className="px-3 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black rounded-xl text-xs transition shadow-md shadow-teal-500/20 flex items-center space-x-1 cursor-pointer shrink-0"
            >
              <Search className="w-3.5 h-3.5 stroke-[3]" />
              <span>Ver Resultados</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 text-center text-[11px] text-slate-500 flex items-center justify-center space-x-1.5 border-t border-slate-800/80">
          <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
          <span>AbregoTech LIS • Acceso Cifrado Ley 81</span>
        </div>
      </div>

      {/* Patient Result Search Modal */}
      {isPatientModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full max-h-[calc(100vh-2rem)] overflow-y-auto p-6 shadow-2xl space-y-5 relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-teal-500/20 border border-teal-500/40 text-teal-300 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Consulta de Resultados para Pacientes</h3>
                  <p className="text-[10px] text-slate-400">Portal Público de Descarga Directa</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPatientModalOpen(false)}
                className="text-slate-500 hover:text-slate-300 font-bold text-sm cursor-pointer"
              >
                ✕
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

              {/* Quick Demo Access Link */}
              <div className="p-3 bg-teal-500/10 border border-teal-500/20 rounded-xl space-y-1.5">
                <div className="text-[11px] font-bold text-teal-300 flex items-center justify-between">
                  <span className="flex items-center space-x-1">
                    <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                    <span>Prueba Rápida de Acceso Directo:</span>
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
                <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px] rounded-xl flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{patientLookupError}</span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end space-x-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsPatientModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black rounded-xl text-xs transition shadow-lg shadow-teal-500/20 cursor-pointer flex items-center space-x-1.5"
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
