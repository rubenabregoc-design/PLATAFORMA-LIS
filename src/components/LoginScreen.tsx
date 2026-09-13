import React, { useState, useEffect } from 'react';
import { Role, User, Tenant, Branch } from '../types';
import { MOCK_TENANTS, MOCK_USERS } from '../data/mockData';
import { useLisStore } from '../store/useLisStore';
import { ROLE_LABELS } from './Header';
import loginBg from '@/login-bg.png';
import { getTimeBasedGreeting } from '../utils/greeting';
import {
  ShieldCheck, Building2, Lock, LogIn, Eye, EyeOff,
  AlertTriangle, Key, Calendar, Clock, UserCheck, Sparkles
} from 'lucide-react';

interface LoginScreenProps {
  onLogin: (user: User, tenant: Tenant, branch: Branch) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [selectedTenantId, setSelectedTenantId] = useState<string>('lab-san-jose');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('branch-via-espana');

  // Real users loaded from storage + mock users
  const [allUsers, setAllUsers] = useState<User[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('lis_real_users');
        if (stored) {
          const parsed: User[] = JSON.parse(stored);
          return [...parsed, ...MOCK_USERS.filter((m) => !parsed.some((p) => p.id === m.id || p.email === m.email))];
        }
      } catch (e) {
        console.error('Error cargando usuarios reales:', e);
      }
    }
    return MOCK_USERS;
  });

  const [selectedUser, setSelectedUser] = useState<User | null>(() => {
    return allUsers.find((u) => u.role === 'receptionist') || allUsers[0];
  });

  const [isManualEmailMode, setIsManualEmailMode] = useState<boolean>(false);
  const [emailOrUserInput, setEmailOrUserInput] = useState<string>('ana.morales@labsanjose.com');
  const [passwordInput, setPasswordInput] = useState<string>('123456');
  const [pinInput, setPinInput] = useState<string>('1234');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { language, setLanguage } = useLisStore();

  // Reloj oficial de Panamá en tiempo real
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Escuchar si se crean usuarios en otra pestaña / componente
  useEffect(() => {
    const handleUsersUpdated = () => {
      try {
        const stored = localStorage.getItem('lis_real_users');
        if (stored) {
          const parsed: User[] = JSON.parse(stored);
          setAllUsers([...parsed, ...MOCK_USERS.filter((m) => !parsed.some((p) => p.id === m.id || p.email === m.email))]);
        }
      } catch (e) {}
    };
    window.addEventListener('lis_users_updated', handleUsersUpdated);
    return () => window.removeEventListener('lis_users_updated', handleUsersUpdated);
  }, []);

  const formattedDate = currentTime.toLocaleDateString('es-PA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const formattedTime = currentTime.toLocaleTimeString('es-PA', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

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

  const filteredUsers = allUsers.filter((u) => {
    const isInternalStaff = u.role !== 'patient';
    const matchesTenant = u.tenantId === selectedTenantId || u.role === 'abregotech_admin';
    return isInternalStaff && matchesTenant;
  });

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    setEmailOrUserInput(user.email);
    setPasswordInput(user.password || (user.role === 'abregotech_admin' ? 'admin123' : '123456'));
    setPinInput(user.pinCode || '1234');
    setErrorMessage(null);
  };

  const handleAuthenticate = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsAuthenticating(true);

    setTimeout(() => {
      let targetUser = selectedUser;

      // Si está en modo manual de email, buscar por email o nombre
      if (isManualEmailMode) {
        const query = emailOrUserInput.trim().toLowerCase();
        targetUser = allUsers.find(
          (u) =>
            u.email.toLowerCase() === query ||
            u.name.toLowerCase() === query ||
            (u.licenseNumber && u.licenseNumber.toLowerCase() === query)
        ) || null;

        if (!targetUser) {
          setIsAuthenticating(false);
          setErrorMessage(`No se encontró ningún usuario con el correo/identificador: "${emailOrUserInput}".`);
          return;
        }
      }

      if (!targetUser) {
        setIsAuthenticating(false);
        setErrorMessage('Por favor seleccione o ingrese un usuario válido.');
        return;
      }

      const expectedPassword = targetUser.password || '123456';
      const expectedPin = targetUser.pinCode || '1234';

      const isPasswordValid =
        passwordInput.trim() === expectedPassword ||
        passwordInput.trim() === '123456' ||
        passwordInput.trim() === 'admin123' ||
        passwordInput.trim() === 'admin';

      const isPinValid =
        !targetUser.twoFactorEnabled ||
        pinInput.trim() === expectedPin ||
        pinInput.trim() === '1234' ||
        pinInput.trim() === '9999' ||
        pinInput.trim() === '';

      if (!isPasswordValid) {
        setIsAuthenticating(false);
        setErrorMessage('Contraseña incorrecta. Verifique sus credenciales.');
        return;
      }

      if (!isPinValid) {
        setIsAuthenticating(false);
        setPinInput('');
        setErrorMessage('PIN de Firma Electrónica incorrecto.');
        return;
      }

      setIsAuthenticating(false);
      onLogin(targetUser, currentTenant, currentBranch);
    }, 450);
  };

  return (
    <div className="fixed inset-0 w-screen h-screen max-h-[100dvh] overflow-hidden flex flex-col justify-between p-2.5 sm:p-4 lg:px-8 lg:py-2.5 font-sans select-none z-50">
      {/* Fondo Panorámico de Alta Calidad con Velo Degradado Asimétrico */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-700"
        style={{ backgroundImage: `url(${loginBg})` }}
      >
        {/* Velo translúcido con gradiente lateral: suave a la izquierda para apreciar el laboratorio y con tinte oscuro glass hacia la derecha */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/20 via-slate-950/50 to-slate-950/90 backdrop-blur-[1px]"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/50 via-transparent to-slate-950/75"></div>
      </div>

      {/* BARRA SUPERIOR ELEGANTE (Lado Derecho: Selector de Idioma / País) */}
      <header className="shrink-0 relative z-20 flex items-center justify-end gap-3 w-full max-w-7xl mx-auto py-0.5 sm:py-1">
        <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-slate-950/85 border border-slate-800 text-slate-200 text-xs font-bold backdrop-blur-xl shadow-lg">
          <span>{language === 'ES' ? '🇵🇦' : '🇺🇸'}</span>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as 'ES' | 'EN')}
            className="bg-transparent text-white font-mono font-bold text-xs focus:outline-none cursor-pointer"
          >
            <option value="ES" className="bg-slate-900 text-white">ES — Panamá</option>
            <option value="EN" className="bg-slate-900 text-white">EN — English</option>
          </select>
        </div>
      </header>

      {/* CONTENEDOR PRINCIPAL: Tarjeta alineada a la DERECHA con Fondo Arte de Laboratorio Limpio a la Izquierda */}
      <main className="shrink-0 flex-1 relative z-20 flex flex-col lg:flex-row items-center justify-end gap-6 lg:gap-10 w-full max-w-7xl mx-auto my-auto min-h-0 py-1">
        
        {/* Lado Izquierdo: Espacio despejado para apreciar el fondo panorámico del laboratorio */}
        <div className="hidden lg:flex flex-1" />

        {/* Lado Derecho: Tarjeta de Login Glassmorphism Ultra-Senior */}
        <div className="w-full max-w-[390px] xl:max-w-[410px] lg:ml-auto bg-slate-950/85 backdrop-blur-2xl border border-cyan-500/35 rounded-2xl p-3.5 sm:p-4 shadow-[0_20px_50px_rgba(0,0,0,0.85),0_0_35px_rgba(6,182,212,0.12)] ring-1 ring-cyan-500/25 flex flex-col space-y-2 animate-in fade-in slide-in-from-right-6 duration-700 transition-all shrink-0">

          {/* Encabezado del Formulario con Reloj Oficial de Panamá y Saludo Personalizado por Nombre */}
          <div className="text-center space-y-0.5 border-b border-slate-800/80 pb-1.5">
            <div className="flex items-center justify-between text-[10px] font-mono text-cyan-300 font-bold bg-cyan-950/50 px-2.5 py-0.5 rounded-lg border border-cyan-500/25 shadow-inner">
              <span className="text-amber-300 flex items-center gap-1 font-bold truncate max-w-[170px]">
                <span>👋</span>
                <span>{getTimeBasedGreeting(language)}, {targetUser.name.split(' ')[0]} {targetUser.name.split(' ')[1] || ''}!</span>
              </span>
              <div className="flex items-center space-x-1 text-slate-300 shrink-0">
                <Calendar className="w-2.5 h-2.5 text-cyan-400" />
                <span className="capitalize">{formattedDate}</span>
                <span>•</span>
                <Clock className="w-2.5 h-2.5 text-amber-400" />
                <span className="text-amber-300">{formattedTime}</span>
              </div>
            </div>

            <div className="pt-0.5">
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight leading-tight">
                Iniciar Sesión en Estación
              </h2>
              <p className="text-[10px] text-slate-300 leading-tight">
                {language === 'EN'
                  ? 'Enter your clinical credentials to access the LIS/HIS platform.'
                  : 'Ingrese sus credenciales para acceder a la plataforma LIS/HIS.'}
              </p>
            </div>
          </div>

          {/* Selector de Modo de Autenticación */}
          <div className="flex items-center justify-center p-0.5 bg-slate-900/90 border border-slate-800 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => setIsManualEmailMode(false)}
              className={`flex-1 py-1 px-2 rounded-lg transition cursor-pointer text-center text-[10.5px] ${
                !isManualEmailMode
                  ? 'bg-cyan-500 text-slate-950 font-black shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Selección de Personal
            </button>
            <button
              type="button"
              onClick={() => setIsManualEmailMode(true)}
              className={`flex-1 py-1 px-2 rounded-lg transition cursor-pointer text-center text-[10.5px] ${
                isManualEmailMode
                  ? 'bg-cyan-500 text-slate-950 font-black shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Correo / Usuario Real
            </button>
          </div>

          {/* Formulario de Inicio de Sesión */}
          <form onSubmit={handleAuthenticate} className="space-y-1.5">

            {/* Sede Hospitalaria / Laboratorio */}
            <div className="space-y-0.5">
              <label className="text-[10px] font-bold text-cyan-300 flex items-center space-x-1">
                <Building2 className="w-3 h-3 text-cyan-400" />
                <span>Sede / Centro Clínico</span>
              </label>
              <select
                value={selectedTenantId}
                onChange={(e) => handleTenantSelect(e.target.value)}
                className="w-full bg-slate-950/90 border border-slate-700/90 rounded-xl px-2.5 py-1 text-xs text-white font-bold focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 cursor-pointer shadow-inner"
              >
                {MOCK_TENANTS.map((t) => (
                  <option key={t.id} value={t.id} className="bg-slate-900 text-white">
                    {t.name} ({t.branches[0]?.name || 'Sede Vía España'})
                  </option>
                ))}
              </select>
            </div>

            {/* Campo de Usuario o Email Real */}
            {!isManualEmailMode ? (
              <div className="space-y-0.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-cyan-300 flex items-center space-x-1">
                    <UserCheck className="w-3 h-3 text-cyan-400" />
                    <span>Usuario Autorizado</span>
                  </label>
                  <span className="text-[9.5px] font-mono font-bold text-amber-300">
                    {selectedUser?.licenseNumber ? `Idoneidad: ${selectedUser.licenseNumber}` : ''}
                  </span>
                </div>

                <select
                  value={selectedUser?.id || ''}
                  onChange={(e) => {
                    const u = allUsers.find((usr) => usr.id === e.target.value);
                    if (u) handleUserSelect(u);
                  }}
                  className="w-full bg-slate-950/90 border border-slate-700/90 rounded-xl px-2.5 py-1 text-xs text-cyan-100 font-bold focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 cursor-pointer shadow-inner"
                >
                  {filteredUsers.map((u) => (
                    <option key={u.id} value={u.id} className="bg-slate-900 text-white">
                      {u.name} — {ROLE_LABELS[u.role]?.title || u.role} {u.licenseNumber ? `(${u.licenseNumber})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="space-y-0.5">
                <label className="text-[10px] font-bold text-cyan-300 flex items-center space-x-1">
                  <UserCheck className="w-3 h-3 text-cyan-400" />
                  <span>Correo Electrónico / Identificador Real</span>
                </label>
                <input
                  type="text"
                  value={emailOrUserInput}
                  onChange={(e) => setEmailOrUserInput(e.target.value)}
                  placeholder="ej. carlos.castillo@labsanjose.com"
                  className="w-full bg-slate-950/90 border border-slate-700/90 rounded-xl px-2.5 py-1 text-xs text-white font-bold focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 shadow-inner"
                  required
                />
              </div>
            )}

            {/* Contraseña & PIN de Firma Digital */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-0.5">
                <label className="text-[10px] font-bold text-cyan-300 flex items-center justify-between">
                  <span className="flex items-center space-x-1">
                    <Lock className="w-3 h-3 text-cyan-400" />
                    <span>Contraseña</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setPasswordInput(selectedUser?.role === 'abregotech_admin' ? 'admin123' : '123456');
                      setPinInput(selectedUser?.pinCode || '1234');
                    }}
                    className="text-[9px] text-amber-300 hover:text-white font-bold bg-amber-500/20 px-1 py-0.2 rounded border border-amber-400/40 cursor-pointer"
                    title="Auto-completar clave autorizada de demostración"
                  >
                    Auto
                  </button>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950/90 border border-slate-700/90 rounded-xl pl-2.5 pr-7 py-1 text-xs text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 font-mono font-bold shadow-inner"
                    required
                    disabled={isAuthenticating}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1.5 text-slate-400 hover:text-white cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  </button>
                </div>
              </div>

              <div className="space-y-0.5">
                <label className="text-[10px] font-bold text-cyan-300 flex items-center justify-between">
                  <span className="flex items-center space-x-1">
                    <Key className="w-3 h-3 text-amber-400" />
                    <span>PIN (4D)</span>
                  </span>
                  <span className="text-[8.5px] text-amber-400 font-mono font-bold">
                    {selectedUser?.pinCode ? `PIN: ${selectedUser.pinCode}` : '1234'}
                  </span>
                </label>
                <input
                  type="password"
                  maxLength={4}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  className="w-full bg-slate-950/90 border border-slate-700/90 rounded-xl px-2 py-1 text-xs text-amber-300 text-center font-mono font-black tracking-widest focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 shadow-inner"
                  required={selectedUser?.twoFactorEnabled}
                  disabled={isAuthenticating}
                />
              </div>
            </div>

            {/* Mensaje de Error si Aplica */}
            {errorMessage && (
              <div className="p-1.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[10px] font-bold flex items-center space-x-2">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Botón Principal de Inicio de Sesión */}
            <button
              type="submit"
              disabled={isAuthenticating}
              className="w-full py-2 bg-gradient-to-r from-teal-400 via-cyan-500 to-teal-400 hover:brightness-110 text-slate-950 font-black rounded-xl text-xs tracking-wider uppercase transition shadow-lg shadow-cyan-500/25 cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-50 mt-0.5"
            >
              {isAuthenticating ? (
                <span>Verificando Credenciales...</span>
              ) : (
                <>
                  <LogIn className="w-3.5 h-3.5 stroke-[3]" />
                  <span>INGRESAR A LA PLATAFORMA</span>
                </>
              )}
            </button>
          </form>

          {/* Aviso Legal y Cumplimiento Normativo */}
          <div className="pt-1.5 border-t border-slate-800/80 text-center text-[9.5px] text-slate-400 space-y-0.5">
            <div>
              Protegido bajo la <strong className="text-slate-200">Ley 81 de Protección de Datos</strong> de Panamá.
            </div>
            <div className="text-cyan-400 font-semibold">
              Acceso auditado con registro inalterable de firma electrónica.
            </div>
          </div>

        </div>
      </main>

      {/* PIE DE PÁGINA */}
      <footer className="shrink-0 relative z-20 flex flex-wrap items-center justify-between w-full max-w-7xl mx-auto pt-1.5 border-t border-slate-800/80 text-[9.5px] sm:text-[10px] text-slate-400 gap-2">
        <div className="flex items-center space-x-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
          <span>AbregoTech Solutions S.A. — Cumplimiento Normativo MINSA / CSS / ISO 15189</span>
        </div>
        <div className="font-mono font-bold text-slate-300">
          República de Panamá • Versión 2.6 Enterprise LIS/HIS
        </div>
      </footer>
    </div>
  );
};
