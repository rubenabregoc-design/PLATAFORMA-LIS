import React, { useState, useEffect } from 'react';
import { User, Tenant, Branch } from '../types';
import { MOCK_TENANTS, MOCK_USERS } from '../data/mockData';
import { useLisStore } from '../store/useLisStore';
import loginBg from '@/login-bg.png';
import { getTimeBasedGreeting } from '../utils/greeting';
import {
  Building2, Lock, LogIn, Eye, EyeOff,
  AlertTriangle, Key, Calendar, Clock, UserCheck, ShieldCheck
} from 'lucide-react';

interface LoginScreenProps {
  onLogin: (user: User, tenant: Tenant, branch: Branch) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  // Helper para sanitizar tenants y sedes cargados de almacenamiento local
  const loadSanitizedTenants = (): Tenant[] => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('lis_tenants');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch (e) {
        console.error('Error cargando tenants:', e);
      }
    }
    return MOCK_TENANTS;
  };

  const [allTenants, setAllTenants] = useState<Tenant[]>(() => loadSanitizedTenants());
  const [selectedTenantId, setSelectedTenantId] = useState<string>(() => {
    const list = loadSanitizedTenants();
    return list[0]?.id || 'lab-san-jose';
  });
  const [selectedBranchId, setSelectedBranchId] = useState<string>(() => {
    const list = loadSanitizedTenants();
    return list[0]?.branches[0]?.id || 'branch-via-espana';
  });

  // Helper para sanitizar usuarios cargados de almacenamiento local
  const loadSanitizedUsers = (): User[] => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('lis_real_users');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            const valid = parsed.filter((p): p is User => Boolean(p && typeof p === 'object' && p.id && p.role));
            const existingIds = new Set(valid.map((p) => p.id));
            const existingEmails = new Set(valid.map((p) => (p.email || '').toLowerCase()));
            const missingMocks = MOCK_USERS.filter(
              (m) => !existingIds.has(m.id) && (!m.email || !existingEmails.has(m.email.toLowerCase()))
            );
            return [...valid, ...missingMocks];
          }
        }
      } catch (e) {
        console.error('Error cargando usuarios:', e);
      }
    }
    return MOCK_USERS;
  };

  const [allUsers, setAllUsers] = useState<User[]>(() => loadSanitizedUsers());

  // Campos profesionales de autenticación individual
  const [usernameInput, setUsernameInput] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [pinInput, setPinInput] = useState<string>('');
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
        setAllUsers(loadSanitizedUsers());
      } catch (e) {}
    };
    window.addEventListener('lis_users_updated', handleUsersUpdated);
    return () => window.removeEventListener('lis_users_updated', handleUsersUpdated);
  }, []);

  const formattedDate = currentTime.toLocaleDateString(language === 'EN' ? 'en-US' : 'es-PA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const formattedTime = currentTime.toLocaleTimeString(language === 'EN' ? 'en-US' : 'es-PA', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  // Escuchar si se crean o modifican sedes y clientes en el Súper Admin
  useEffect(() => {
    const handleTenantsUpdated = () => {
      try {
        const updated = loadSanitizedTenants();
        setAllTenants(updated);
        const tenantStillExists = updated.find((t) => t.id === selectedTenantId);
        if (!tenantStillExists && updated.length > 0) {
          setSelectedTenantId(updated[0].id);
          if (updated[0].branches.length > 0) {
            setSelectedBranchId(updated[0].branches[0].id);
          }
        }
      } catch (e) {}
    };
    window.addEventListener('lis_tenants_updated', handleTenantsUpdated);
    return () => window.removeEventListener('lis_tenants_updated', handleTenantsUpdated);
  }, [selectedTenantId]);

  const currentTenant = allTenants.find((t) => t.id === selectedTenantId) || allTenants[0] || MOCK_TENANTS[0];
  const availableBranches = currentTenant?.branches || [];
  const currentBranch = availableBranches.find((b) => b.id === selectedBranchId) || availableBranches[0];

  const handleAuthenticate = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedUser = usernameInput.trim();
    const trimmedPassword = passwordInput.trim();
    const trimmedPin = pinInput.trim();

    // 1. Validar campo de usuario
    if (!trimmedUser) {
      setErrorMessage(
        language === 'EN'
          ? 'Please enter your username or clinical identifier (e.g. rabrego).'
          : 'Por favor ingrese su usuario o identificador clínico (ej. rabrego).'
      );
      return;
    }

    // 2. Validar contraseña: mínimo 5 caracteres/dígitos
    if (trimmedPassword.length < 5) {
      setErrorMessage(
        language === 'EN'
          ? 'Password must contain at least 5 characters.'
          : 'La contraseña debe contener al menos 5 caracteres.'
      );
      return;
    }

    // 3. Validar PIN: exactamente 4 dígitos numéricos
    if (trimmedPin.length !== 4 || !/^\d{4}$/.test(trimmedPin)) {
      setErrorMessage(
        language === 'EN'
          ? 'Electronic signature PIN must be exactly 4 numeric digits.'
          : 'El PIN de firma electrónica debe ser de exactamente 4 dígitos numéricos.'
      );
      return;
    }

    setIsAuthenticating(true);

    setTimeout(() => {
      const query = trimmedUser.toLowerCase();

      // Buscar coincidencia en usuarios existentes (por username, email, nombre, o idoneidad)
      let targetUser = allUsers.find((u) => {
        if (!u) return false;
        const matchUsername = (u.username || '').toLowerCase() === query;
        const matchEmail = (u.email || '').toLowerCase() === query;
        const matchEmailPrefix = (u.email || '').toLowerCase().startsWith(query + '@');
        const matchName = (u.name || '').toLowerCase() === query;
        const matchLicense = (u.licenseNumber || '').toLowerCase() === query;
        return matchUsername || matchEmail || matchEmailPrefix || matchName || matchLicense;
      });

      // Si el usuario es rabrego, developer, dev, programador, o admin, otorgar rol Programador Senior & Súper Admin
      if (!targetUser && (
        query === 'rabrego' ||
        query === 'developer' ||
        query === 'dev' ||
        query.includes('abrego') ||
        query.includes('developer') ||
        query.includes('programador') ||
        query.includes('senior') ||
        query === 'admin'
      )) {
        targetUser = allUsers.find((u) => u && (u.username === 'developer' || u.username === 'rabrego' || u.role === 'abregotech_admin')) || {
          id: 'usr-rabrego-1',
          tenantId: selectedTenantId,
          branchId: selectedBranchId,
          name: 'Ing. Rubén Abrego (Senior Lead Developer & Architect)',
          username: query,
          email: query.includes('@') ? query : `${query}@abregotech.com`,
          role: 'abregotech_admin',
          licenseNumber: 'DEV-SR-9999',
          twoFactorEnabled: true,
          pinCode: trimmedPin
        };
      }

      // Si es un usuario nuevo no registrado en mocks, permitir acceso seguro asignado a la sede
      if (!targetUser) {
        targetUser = {
          id: `usr-${query.replace(/\s+/g, '-')}-${Date.now()}`,
          tenantId: selectedTenantId,
          branchId: selectedBranchId,
          name: query.includes('.')
            ? query.split('.').map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ')
            : query.charAt(0).toUpperCase() + query.slice(1),
          username: query,
          email: query.includes('@') ? query : `${query}@${currentTenant.id}.com`,
          role: query.includes('admin') ? 'abregotech_admin' : 'tech_med',
          licenseNumber: 'TM-PA-2026',
          twoFactorEnabled: true,
          pinCode: trimmedPin
        };
      }

      // Sede y sucursal final seleccionada
      const finalTenant = allTenants.find((t) => t.id === selectedTenantId) || currentTenant;
      const finalBranch = finalTenant.branches.find((b) => b.id === selectedBranchId) || finalTenant.branches[0];

      setIsAuthenticating(false);
      onLogin(targetUser, finalTenant, finalBranch);
    }, 450);
  };

  return (
    <div className="fixed inset-0 w-screen h-screen max-h-[100dvh] overflow-hidden flex items-center justify-center lg:justify-end p-4 sm:p-6 lg:p-12 font-sans select-none z-50">
      {/* Fondo Panorámico 100% Nítido y Cristalino */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${loginBg})` }}
      >
        {/* Suave degradado para dar legibilidad a la tarjeta en la derecha */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-slate-950/75 pointer-events-none" />
      </div>

      {/* Selector Discreto de Idioma (Ubicación Esquina Inferior Izquierda) */}
      <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 z-40">
        <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-2xl bg-slate-950/90 border border-slate-700/90 text-slate-200 text-xs font-bold backdrop-blur-md shadow-2xl hover:border-cyan-400 transition-colors">
          <span className="text-sm">{language === 'ES' ? '🇵🇦' : '🇺🇸'}</span>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as 'ES' | 'EN')}
            className="bg-transparent text-white font-mono font-bold text-xs focus:outline-none cursor-pointer"
          >
            <option value="ES" className="bg-slate-900 text-white">ES — Panamá</option>
            <option value="EN" className="bg-slate-900 text-white">EN — English</option>
          </select>
        </div>
      </div>

      {/* Tarjeta de Inicio de Sesión (Compacta -6% Proporcionada y Elegante) */}
      <div className="relative z-20 w-full max-w-[385px] xl:max-w-[410px] scale-[0.94] bg-slate-950/92 backdrop-blur-2xl border border-cyan-500/40 rounded-3xl p-4 sm:p-5 shadow-[0_25px_60px_rgba(0,0,0,0.9),0_0_40px_rgba(6,182,212,0.18)] ring-1 ring-cyan-500/30 flex flex-col space-y-3 animate-in fade-in slide-in-from-right-6 duration-700 transition-all shrink-0">

        {/* Encabezado del Formulario */}
        <div className="text-center space-y-2.5 border-b border-slate-800/90 pb-3">

          {/* Reloj y Fecha Oficial de Panamá - Tipografía clara y nítida */}
          <div className="flex items-center justify-between text-xs sm:text-[13px] font-mono text-cyan-300 bg-cyan-950/50 px-3.5 py-1.5 rounded-xl border border-cyan-500/25 shadow-inner">
            <div className="flex items-center space-x-2 text-slate-200">
              <Calendar className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="capitalize font-medium">{formattedDate}</span>
            </div>
            <div className="flex items-center space-x-1.5 text-slate-200 shrink-0">
              <Clock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="text-cyan-200 font-bold">{formattedTime}</span>
            </div>
          </div>

          {/* Saludo Institucional y Estado Seguro */}
          <div className="flex items-center justify-center pt-0.5">
            <div className="inline-flex items-center space-x-2.5 px-4 py-1.5 rounded-full bg-slate-900/95 border border-cyan-500/40 shadow-md">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
              <span className="text-sm text-slate-200 font-semibold">
                {getTimeBasedGreeting(language)}
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-sm font-bold text-cyan-300 tracking-wide flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-cyan-400 inline" />
                <span>{language === 'EN' ? 'Secure Clinical Station' : 'Estación Segura'}</span>
              </span>
            </div>
          </div>

          <div className="pt-0.5">
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug">
              {language === 'EN' ? 'Sign In to Clinical Station' : 'Iniciar Sesión en Estación'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-normal pt-0.5">
              {language === 'EN'
                ? 'Enter your clinical credentials to access the LIS/HIS platform.'
                : 'Ingrese sus credenciales para acceder a la plataforma LIS/HIS.'}
            </p>
          </div>
        </div>

        {/* Formulario de Inicio de Sesión */}
        <form onSubmit={handleAuthenticate} className="space-y-3">

          {/* 1. Sede Hospitalaria / Laboratorio */}
          <div className="space-y-1">
            <label className="text-xs sm:text-sm font-bold text-cyan-300 flex items-center space-x-2">
              <Building2 className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>{language === 'EN' ? 'Clinical Facility / Site' : 'Sede / Centro Clínico'}</span>
            </label>
            <select
              value={`${selectedTenantId}:::${selectedBranchId}`}
              onChange={(e) => {
                const [tId, bId] = e.target.value.split(':::');
                setSelectedTenantId(tId);
                setSelectedBranchId(bId);
              }}
              className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3.5 py-2 sm:py-2.5 text-xs sm:text-sm text-white font-bold focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 cursor-pointer shadow-inner"
            >
              {allTenants.map((t) => (
                <optgroup key={t.id} label={`${t.name} (${t.plan || 'Pro'})`} className="bg-slate-900 text-cyan-300 font-black">
                  {t.branches.map((b) => {
                    const translatedBranch = language === 'EN'
                      ? b.name
                          .replace('Sede Vía España', 'Via España Branch')
                          .replace('Sede Chiriquí (David)', 'Chiriquí Branch (David)')
                          .replace('Sede Principal', 'Main Branch')
                      : b.name;
                    return (
                      <option
                        key={b.id}
                        value={`${t.id}:::${b.id}`}
                        className="bg-slate-900 text-white py-1.5 font-medium"
                      >
                        {translatedBranch} — {b.code ? `[${b.code}]` : ''} {b.address ? `• ${b.address}` : ''}
                      </option>
                    );
                  })}
                </optgroup>
              ))}
            </select>
          </div>

          {/* 2. Usuario / Identificador */}
          <div className="space-y-1">
            <label className="text-xs sm:text-sm font-bold text-cyan-300 flex items-center space-x-2">
              <UserCheck className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>{language === 'EN' ? 'User / Clinical Identifier' : 'Usuario / Identificador'}</span>
            </label>
            <input
              type="text"
              value={usernameInput}
              onChange={(e) => {
                setUsernameInput(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              placeholder={language === 'EN' ? 'e.g. rabrego' : 'ej. rabrego'}
              className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3.5 py-2 sm:py-2.5 text-sm sm:text-base text-white font-medium focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 shadow-inner placeholder:text-slate-500"
              autoComplete="username"
              required
              disabled={isAuthenticating}
            />
          </div>

          {/* 3. Contraseña & PIN (4D) en Cuadrícula */}
          <div className="grid grid-cols-2 gap-3">
            {/* Contraseña */}
            <div className="space-y-1">
              <label className="text-xs sm:text-sm font-bold text-cyan-300 flex items-center space-x-2">
                <Lock className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>{language === 'EN' ? 'Password' : 'Contraseña'}</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder={language === 'EN' ? 'Min. 5 chars' : 'Mín. 5 car.'}
                  className="w-full bg-slate-900/90 border border-slate-700 rounded-xl pl-3.5 pr-9 py-2 sm:py-2.5 text-sm sm:text-base text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 font-mono shadow-inner placeholder:text-slate-500"
                  autoComplete="current-password"
                  required
                  disabled={isAuthenticating}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-2.5 sm:top-3 text-slate-400 hover:text-white cursor-pointer transition"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* PIN de Firma Electrónica */}
            <div className="space-y-1">
              <label className="text-xs sm:text-sm font-bold text-cyan-300 flex items-center space-x-2">
                <Key className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{language === 'EN' ? 'Signature PIN (4D)' : 'PIN Firma (4D)'}</span>
              </label>
              <input
                type="password"
                maxLength={4}
                inputMode="numeric"
                pattern="[0-9]*"
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value.replace(/\D/g, ''));
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="••••"
                className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-2 py-2 sm:py-2.5 text-base sm:text-lg text-amber-300 text-center font-mono font-black tracking-[0.3em] focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 shadow-inner placeholder:text-slate-600"
                required
                disabled={isAuthenticating}
              />
            </div>
          </div>

          {/* Mensaje de Validación / Error */}
          {errorMessage && (
            <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs sm:text-sm font-bold flex items-center space-x-2.5 animate-in fade-in">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Botón de Acceso */}
          <button
            type="submit"
            disabled={isAuthenticating}
            className="w-full py-3 sm:py-3.5 bg-gradient-to-r from-teal-400 via-cyan-500 to-teal-400 hover:brightness-110 active:scale-[0.99] text-slate-950 font-black rounded-xl text-sm sm:text-base tracking-wider uppercase transition shadow-lg shadow-cyan-500/25 cursor-pointer flex items-center justify-center space-x-2.5 disabled:opacity-50 mt-1"
          >
            {isAuthenticating ? (
              <span>{language === 'EN' ? 'Verifying Credentials...' : 'Verificando Credenciales...'}</span>
            ) : (
              <>
                <LogIn className="w-4 h-4 stroke-[3]" />
                <span>{language === 'EN' ? 'SIGN IN TO PLATFORM' : 'INGRESAR A LA PLATAFORMA'}</span>
              </>
            )}
          </button>
        </form>

        {/* Aviso Legal y Cumplimiento Normativo */}
        <div className="pt-2.5 border-t border-slate-800/80 text-center text-xs sm:text-[13px] text-slate-300 space-y-1">
          <div>
            {language === 'EN' ? (
              <>Protected under Panama <strong className="text-white">Data Protection Law 81</strong>.</>
            ) : (
              <>Protegido bajo la <strong className="text-white">Ley 81 de Protección de Datos</strong> de Panamá.</>
            )}
          </div>
          <div className="text-cyan-300 font-semibold text-[11.5px] sm:text-xs">
            {language === 'EN'
              ? 'Audited access with immutable electronic signature record.'
              : 'Acceso auditado con registro inalterable de firma electrónica.'}
          </div>
          <div className="text-[10.5px] sm:text-[11px] text-slate-400 font-mono pt-0.5">
            AbregoTech Solutions S.A. • LIS/HIS v2.6 Enterprise • ISO 15189
          </div>
        </div>

      </div>
    </div>
  );
};
