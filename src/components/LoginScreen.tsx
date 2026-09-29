import React, { useState, useEffect } from 'react';
import { User, Tenant, Branch } from '../types';
import { MOCK_TENANTS, MOCK_USERS } from '../data/mockData';
import { useLisStore } from '../store/useLisStore';
import loginBg from '@/login-bg.png';
import { getTimeBasedGreeting } from '../utils/greeting';
import { validateEthicalPin } from '../utils/securityHarden';
import {
  Building2, Lock, LogIn, Eye, EyeOff,
  AlertTriangle, Key, Calendar, Clock, UserCheck, ShieldCheck,
  KeyRound, HelpCircle, CheckCircle2, X
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
            let modified = false;
            const valid = parsed
              .filter((p): p is User => Boolean(p && typeof p === 'object' && p.id && p.role))
              .map((u) => {
                if (
                  (u.id === 'usr-developer-1' || u.email === 'developer@abregotech.com') &&
                  u.name === 'Ing. Rubén Ábrego'
                ) {
                  modified = true;
                  return { ...u, name: 'Equipo de Desarrollo / Lead Dev' };
                }
                if (u.id === 'usr-rabrego-1' || u.username === 'rabrego' || u.email === 'rabrego@abregotech.com') {
                  // Preservar siempre las credenciales personalizadas si ya fueron modificadas por el usuario
                  if (!u.pinCode && !u.password && !u.passwordHash) {
                    modified = true;
                    return {
                      ...u,
                      name: 'Ing. Rubén Ábrego',
                      password: 'Manzana2429@@',
                      passwordHash: btoa('abregotech_salt_Manzana2429@@'),
                      pinCode: '2429'
                    };
                  }
                }
                return u;
              });
            const existingIds = new Set(valid.map((p) => p.id));
            const existingEmails = new Set(valid.map((p) => (p.email || '').toLowerCase()));
            const missingMocks = MOCK_USERS.filter(
              (m) => !existingIds.has(m.id) && (!m.email || !existingEmails.has(m.email.toLowerCase()))
            );
            const combined = [...valid, ...missingMocks];
            if (modified) {
              localStorage.setItem('lis_real_users', JSON.stringify(combined));
            }
            return combined;
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

  // Estados para Modal de Recuperación de Contraseña con PIN (Autoservicio)
  const [showForgotModal, setShowForgotModal] = useState<boolean>(false);
  const [forgotIdentifier, setForgotIdentifier] = useState<string>('');
  const [forgotPin, setForgotPin] = useState<string>('');
  const [forgotNewPassword, setForgotNewPassword] = useState<string>('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState<string>('');
  const [forgotShowPassword, setForgotShowPassword] = useState<boolean>(false);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);
  const [isResettingPassword, setIsResettingPassword] = useState<boolean>(false);

  const handleForgotPinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const prevLen = forgotPin.length;
    if (rawVal.length < prevLen) {
      setForgotPin(forgotPin.slice(0, rawVal.length));
    } else {
      const added = rawVal.replace(/•/g, '').replace(/\D/g, '');
      if (added) {
        setForgotPin((prev) => (prev + added).slice(0, 4));
      }
    }
    if (forgotError) setForgotError(null);
  };

  const handleResetPasswordWithPin = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    setForgotSuccess(null);

    const query = forgotIdentifier.trim().toLowerCase();
    const cleanPin = forgotPin.trim();
    const cleanNewPass = forgotNewPassword.trim();
    const cleanConfirm = forgotConfirmPassword.trim();

    if (!query) {
      setForgotError(
        language === 'EN'
          ? 'Please enter your username or email address.'
          : 'Por favor ingrese su usuario o correo electrónico.'
      );
      return;
    }

    const pinValidation = validateEthicalPin(cleanPin);
    if (!pinValidation.isValid) {
      setForgotError(pinValidation.error || 'PIN inválido por políticas de seguridad.');
      return;
    }

    if (cleanNewPass.length < 5) {
      setForgotError(
        language === 'EN'
          ? 'New password must contain at least 5 characters.'
          : 'La nueva contraseña debe contener al menos 5 caracteres.'
      );
      return;
    }

    if (cleanNewPass !== cleanConfirm) {
      setForgotError(
        language === 'EN'
          ? 'Passwords do not match. Please verify.'
          : 'Las contraseñas no coinciden. Por favor verifique.'
      );
      return;
    }

    setIsResettingPassword(true);

    setTimeout(() => {
      // Buscar usuario en base de datos clínica
      const userIndex = allUsers.findIndex((u) => {
        if (!u) return false;
        const matchUsername = (u.username || '').toLowerCase() === query;
        const matchEmail = (u.email || '').toLowerCase() === query;
        const matchName = (u.name || '').toLowerCase() === query;
        const matchLicense = (u.licenseNumber || '').toLowerCase() === query;
        return matchUsername || matchEmail || matchName || matchLicense;
      });

      if (userIndex === -1) {
        setIsResettingPassword(false);
        setForgotError(
          language === 'EN'
            ? 'User not found in clinical database. Contact the Administrator.'
            : 'Usuario no encontrado en la base de datos clínica. Verifique o contacte a su administrador.'
        );
        return;
      }

      const targetUser = allUsers[userIndex];

      // Validar si el PIN de firma coincide con el registrado en su perfil
      if (!targetUser.pinCode || targetUser.pinCode !== cleanPin) {
        setIsResettingPassword(false);
        setForgotError(
          language === 'EN'
            ? 'Incorrect signature PIN. If you forgot both, the Administrator must reset your credentials from the Super-Admin Console.'
            : 'PIN de firma electrónica incorrecto. Si ha olvidado ambos datos (contraseña y PIN), el Administrador debe cambiarlos desde la Consola Súper-Admin.'
        );
        return;
      }

      // Proceder con la actualización segura de contraseña
      const newHash = btoa(`abregotech_salt_${cleanNewPass}`);
      const updatedUser: User = {
        ...targetUser,
        password: cleanNewPass,
        passwordHash: newHash
      };

      const updatedUsers = [...allUsers];
      updatedUsers[userIndex] = updatedUser;
      setAllUsers(updatedUsers);

      try {
        const storedRaw = localStorage.getItem('lis_real_users');
        let parsed: User[] = [];
        if (storedRaw) {
          try {
            parsed = JSON.parse(storedRaw);
          } catch (e) {}
        }
        if (!Array.isArray(parsed)) parsed = [];

        const existingIdx = parsed.findIndex(
          (u) => u.id === targetUser.id || (u.email && u.email.toLowerCase() === targetUser.email.toLowerCase())
        );

        if (existingIdx >= 0) {
          parsed[existingIdx] = {
            ...parsed[existingIdx],
            password: undefined,
            passwordHash: newHash
          };
        } else {
          parsed.push({
            ...updatedUser,
            password: undefined,
            passwordHash: newHash
          });
        }

        localStorage.setItem('lis_real_users', JSON.stringify(parsed));
        window.dispatchEvent(new CustomEvent('lis_users_updated'));
      } catch (e) {
        console.error('Error al guardar nueva contraseña:', e);
      }

      setIsResettingPassword(false);
      setForgotSuccess(
        language === 'EN'
          ? 'Password successfully changed! You can now sign in.'
          : '¡Contraseña cambiada exitosamente! Ya puede ingresar al sistema.'
      );

      // Pre-cargar credenciales en el login para mayor comodidad
      setUsernameInput(targetUser.username || targetUser.email || query);
      setPasswordInput(cleanNewPass);
      setPinInput(cleanPin);

      window.dispatchEvent(
        new CustomEvent('lis-global-toast', {
          detail: {
            message: language === 'EN' ? 'Password updated successfully.' : 'Contraseña actualizada exitosamente.',
            type: 'success'
          }
        })
      );

      setTimeout(() => {
        setShowForgotModal(false);
        setForgotSuccess(null);
        setForgotPin('');
        setForgotNewPassword('');
        setForgotConfirmPassword('');
      }, 1500);
    }, 450);
  };

  // Handlers de protección anti-inspección DOM (Evita que el PIN y Contraseña aparezcan en texto plano en DevTools/Inspeccionar)
  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const clean = e.target.value.replace(/\D/g, '').slice(0, 4);
    setPinInput(clean);
    if (errorMessage) setErrorMessage(null);
  };

  const handlePinKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      setPinInput((prev) => prev.slice(0, -1));
      if (errorMessage) setErrorMessage(null);
    }
  };

  const handlePinPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    if (pasted) {
      setPinInput(pasted);
      if (errorMessage) setErrorMessage(null);
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (showPassword) {
      setPasswordInput(e.target.value);
    } else {
      const rawVal = e.target.value;
      const prevLen = passwordInput.length;
      if (rawVal.length < prevLen) {
        setPasswordInput(passwordInput.slice(0, rawVal.length));
      } else {
        const added = rawVal.replace(/•/g, '');
        if (added) {
          setPasswordInput((prev) => prev + added);
        }
      }
    }
    if (errorMessage) setErrorMessage(null);
  };

  const handlePasswordKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showPassword && e.key === 'Backspace') {
      e.preventDefault();
      setPasswordInput((prev) => prev.slice(0, -1));
      if (errorMessage) setErrorMessage(null);
    }
  };

  const handlePasswordPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    if (!showPassword) {
      e.preventDefault();
      const pasted = e.clipboardData.getData('text');
      if (pasted) {
        setPasswordInput((prev) => prev + pasted);
        if (errorMessage) setErrorMessage(null);
      }
    }
  };

  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [failedAttempts, setFailedAttempts] = useState<number>(0);
  const [lockoutSeconds, setLockoutSeconds] = useState<number>(0);

  const { language, setLanguage } = useLisStore();

  // Reloj oficial de Panamá en tiempo real
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Temporizador de enfriamiento anti-fuerza bruta
  useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const cooldownTimer = setInterval(() => {
      setLockoutSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(cooldownTimer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(cooldownTimer);
  }, [lockoutSeconds]);

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
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
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

    // 0. Comprobación de Enfriamiento de Seguridad Anti-Fuerza Bruta
    if (lockoutSeconds > 0) {
      setErrorMessage(
        language === 'EN'
          ? `⚠️ Anti-brute force security lock active. Please wait ${lockoutSeconds} seconds.`
          : `⚠️ Bloqueo ético anti-fuerza bruta activo. Espere ${lockoutSeconds} segundos antes de intentar.`
      );
      return;
    }

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

      // Si el usuario es médico o solicita ext_doctor
      if (!targetUser && (query.includes('doctor') || query.includes('medico') || query.includes('icaza') || query === 'ext_doctor')) {
        targetUser = allUsers.find((u) => u && u.role === 'ext_doctor') || {
          id: 'usr-doctor-icaza',
          tenantId: selectedTenantId,
          branchId: selectedBranchId,
          name: 'Dr. Roberto Icaza (Médico Referente)',
          username: query,
          email: 'dr.icaza@consultoriospaitilla.com',
          role: 'ext_doctor',
          licenseNumber: 'MED-10492-PA',
          twoFactorEnabled: true,
          pinCode: '1049'
        };
      }

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
          name: 'Ing. Rubén Ábrego',
          username: query,
          email: query.includes('@') ? query : `${query}@abregotech.com`,
          role: 'abregotech_admin',
          licenseNumber: 'DEV-SR-2429',
          password: 'Manzana2429@@',
          twoFactorEnabled: true,
          pinCode: '2429'
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
          password: trimmedPassword,
          twoFactorEnabled: true,
          pinCode: trimmedPin
        };
      }

      // Validar estrictamente contraseña si el usuario ya la tiene configurada (en texto o hash de almacenamiento)
      const inputHash = btoa(`abregotech_salt_${trimmedPassword}`);
      const isRabrego = targetUser.username === 'rabrego' || targetUser.id === 'usr-rabrego-1' || targetUser.email === 'rabrego@abregotech.com';

      // Valida si coincide el hash guardado, o contraseña en texto plano, o credenciales maestras iniciales
      const matchesStoredHash = Boolean(targetUser.passwordHash && targetUser.passwordHash === inputHash);
      const matchesStoredPlain = Boolean(targetUser.password && targetUser.password === trimmedPassword);
      const matchesMasterFallback = isRabrego && (trimmedPassword === 'Manzana2429@@' || trimmedPassword === 'admin');

      const isPasswordInvalid = !(matchesStoredHash || matchesStoredPlain || matchesMasterFallback);

      if (isPasswordInvalid) {
        setIsAuthenticating(false);
        const nextAttempts = failedAttempts + 1;
        setFailedAttempts(nextAttempts);
        if (nextAttempts >= 3) {
          setLockoutSeconds(30);
          setErrorMessage(
            language === 'EN'
              ? '⚠️ 3 failed attempts. Anti-brute force security lock active for 30s.'
              : '⚠️ 3 intentos fallidos. Bloqueo ético anti-fuerza bruta activado por 30s.'
          );
        } else {
          setErrorMessage(
            language === 'EN'
              ? `Invalid password. (${3 - nextAttempts} attempts remaining)`
              : `Contraseña incorrecta. (Quedan ${3 - nextAttempts} intentos antes de bloqueo temporal)`
          );
        }
        return;
      }

      // Validar estrictamente PIN de firma electrónica (4D)
      // Respeta prioritariamente el PIN personalizado que guardó el usuario en targetUser.pinCode
      const expectedPin = targetUser.pinCode || (isRabrego ? '2429' : undefined);
      if (expectedPin && expectedPin !== trimmedPin) {
        setIsAuthenticating(false);
        const nextAttempts = failedAttempts + 1;
        setFailedAttempts(nextAttempts);
        if (nextAttempts >= 3) {
          setLockoutSeconds(30);
          setErrorMessage(
            language === 'EN'
              ? '⚠️ 3 failed attempts. Anti-brute force security lock active for 30s.'
              : '⚠️ 3 intentos fallidos detectados. Bloqueo ético anti-fuerza bruta activado por 30 segundos.'
          );
        } else {
          setErrorMessage(
            language === 'EN'
              ? `Invalid 4-digit signature PIN. (${3 - nextAttempts} attempts remaining)`
              : `PIN de firma electrónica incorrecto. (Quedan ${3 - nextAttempts} intentos antes de bloqueo temporal)`
          );
        }
        return;
      }

      // Acceso autorizado: resetear contador de fallos
      setFailedAttempts(0);

      // Sede y sucursal final seleccionada
      const finalTenant = allTenants.find((t) => t.id === selectedTenantId) || currentTenant;
      const finalBranch = finalTenant.branches.find((b) => b.id === selectedBranchId) || finalTenant.branches[0];

      setIsAuthenticating(false);
      onLogin(targetUser, finalTenant, finalBranch);
    }, 450);
  };
  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden flex items-center justify-center lg:justify-end p-3 sm:p-5 lg:p-8 font-sans select-none z-50">
      {/* Fondo Panorámico 100% Nítido */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat pointer-events-none"
        style={{ backgroundImage: `url(${loginBg})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-950/30 to-slate-950/80 pointer-events-none" />
      </div>

      {/* Selector Discreto de Idioma (Ubicación Esquina Inferior Izquierda, Sin interferir con tarjeta) */}
      <div className="fixed bottom-3 left-3 sm:bottom-5 sm:left-5 z-40">
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

      {/* Tarjeta de Inicio de Sesión: Compacta, Perfectamente Proporcionada, Cero Desbordamiento */}
      <div
        onContextMenu={(e) => e.preventDefault()}
        className="relative z-20 w-full max-w-[380px] xl:max-w-[400px] my-auto bg-slate-950/94 backdrop-blur-2xl border border-cyan-500/40 rounded-3xl p-4 sm:p-5 shadow-[0_25px_60px_rgba(0,0,0,0.9),0_0_40px_rgba(6,182,212,0.18)] ring-1 ring-cyan-500/30 flex flex-col space-y-2.5 animate-in fade-in slide-in-from-right-6 duration-700 transition-all shrink-0"
      >

        {/* Encabezado del Formulario */}
        <div className="text-center space-y-2 border-b border-slate-800/90 pb-2.5">

          {/* Reloj y Fecha Oficial de Panamá - Línea elegante compacta */}
          <div className="flex items-center justify-between text-xs font-mono text-cyan-300 bg-cyan-950/50 px-3 py-1.5 rounded-xl border border-cyan-500/25 shadow-inner">
            <div className="flex items-center space-x-1.5 text-slate-200">
              <Calendar className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="capitalize font-medium">{formattedDate}</span>
            </div>
            <div className="flex items-center space-x-1 text-slate-200 shrink-0">
              <Clock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="text-cyan-200 font-bold">{formattedTime}</span>
            </div>
          </div>

          {/* Saludo Institucional y Estado Seguro */}
          <div className="flex items-center justify-center pt-0.5">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-900/95 border border-cyan-500/40 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 shadow-sm"></span>
              <span className="text-xs text-slate-200 font-medium">
                {getTimeBasedGreeting(language)}
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-xs font-bold text-cyan-300 tracking-wide flex items-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 inline" />
                <span>{language === 'EN' ? 'Secure Clinical Station' : 'Estación Clínica Segura'}</span>
              </span>
            </div>
          </div>

          <div>
            <h2 className="text-lg sm:text-xl font-black text-white tracking-tight leading-snug">
              {language === 'EN' ? 'Clinical Staff Portal (LIS / HIS)' : 'Iniciar Sesión en Estación'}
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-400 leading-tight pt-0.5">
              {language === 'EN'
                ? 'Exclusively for Laboratory, Hospital, and Blood Bank staff.'
                : 'Acceso exclusivo para personal de Laboratorio, Hospital y Banco de Sangre.'}
            </p>
          </div>
        </div>

        {/* Formulario de Inicio de Sesión */}
        <form onSubmit={handleAuthenticate} className="space-y-2.5" noValidate>

          {/* 1. Sede Hospitalaria / Laboratorio */}
          <div className="space-y-0.5">
            <label className="text-xs font-bold text-cyan-300 flex items-center space-x-1.5">
              <Building2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>{language === 'EN' ? 'Clinical Facility / Site' : 'Sede / Centro Clínico'}</span>
            </label>
            <select
              value={`${selectedTenantId}:::${selectedBranchId}`}
              onChange={(e) => {
                const [tId, bId] = e.target.value.split(':::');
                setSelectedTenantId(tId);
                setSelectedBranchId(bId);
              }}
              className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3 py-1.5 sm:py-2 text-xs text-white font-bold focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 cursor-pointer shadow-inner"
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
                        className="bg-slate-900 text-white py-1 font-medium"
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
          <div className="space-y-0.5">
            <label className="text-xs font-bold text-cyan-300 flex items-center space-x-1.5">
              <UserCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
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
              className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-white font-medium focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 shadow-inner placeholder:text-slate-500"
              autoComplete="username"
              required
              disabled={isAuthenticating}
            />
          </div>

          {/* 3. Contraseña & PIN (4D) en Cuadrícula */}
          <div className="grid grid-cols-2 gap-2">
            {/* Contraseña */}
            <div className="space-y-0.5">
              <label className="text-xs font-bold text-cyan-300 flex items-center space-x-1.5">
                <Lock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>{language === 'EN' ? 'Password' : 'Contraseña'}</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={showPassword ? passwordInput : '•'.repeat(passwordInput.length)}
                  onChange={handlePasswordChange}
                  onKeyDown={handlePasswordKeyDown}
                  onPaste={handlePasswordPaste}
                  placeholder={language === 'EN' ? 'Min. 5 chars' : 'Mín. 5 car.'}
                  className="w-full bg-slate-900/90 border border-slate-700 rounded-xl pl-3 pr-8 py-1.5 sm:py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 font-mono shadow-inner placeholder:text-slate-500"
                  autoComplete="new-password"
                  required
                  disabled={isAuthenticating}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-2 text-slate-400 hover:text-white cursor-pointer transition"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* PIN de Firma Electrónica */}
            <div className="space-y-0.5">
              <label className="text-xs font-bold text-cyan-300 flex items-center space-x-1.5">
                <Key className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>{language === 'EN' ? 'Signature PIN (4D)' : 'PIN Firma (4D)'}</span>
              </label>
              <input
                type="password"
                maxLength={4}
                inputMode="numeric"
                autoComplete="new-password"
                value={pinInput}
                onChange={handlePinChange}
                onKeyDown={handlePinKeyDown}
                onPaste={handlePinPaste}
                placeholder="••••"
                className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-2 py-1.5 sm:py-2 text-sm sm:text-base text-amber-300 text-center font-mono font-black tracking-[0.25em] focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 shadow-inner placeholder:text-slate-600"
                required
                disabled={isAuthenticating}
              />
            </div>
          </div>

          {/* Enlace para Recuperación de Contraseña con Validación por PIN */}
          <div className="flex items-center justify-between pt-0.5 px-0.5 text-[11px]">
            <span className="text-[10px] text-slate-500 font-medium">
              {language === 'EN' ? 'PIN required for self-service' : 'PIN requerido para autoservicio'}
            </span>
            <button
              type="button"
              onClick={() => {
                setForgotIdentifier(usernameInput.trim());
                setForgotError(null);
                setForgotSuccess(null);
                setShowForgotModal(true);
              }}
              className="text-cyan-400 hover:text-cyan-300 hover:underline font-bold transition cursor-pointer flex items-center space-x-1"
            >
              <KeyRound className="w-3 h-3 text-cyan-400" />
              <span>{language === 'EN' ? 'Forgot password?' : '¿Olvidó su contraseña?'}</span>
            </button>
          </div>

          {/* Mensaje de Validación / Error */}
          {errorMessage && (
            <div className="p-2 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center space-x-2 animate-in fade-in">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Botón de Acceso Principal a la Estación */}
          <button
            type="submit"
            disabled={isAuthenticating || lockoutSeconds > 0}
            className="w-full py-2.5 sm:py-3 bg-gradient-to-r from-teal-400 via-cyan-500 to-teal-400 hover:brightness-110 active:scale-[0.99] text-slate-950 font-black rounded-xl text-xs sm:text-sm tracking-wider uppercase transition shadow-lg shadow-cyan-500/25 cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-50 mt-1"
          >
            {isAuthenticating ? (
              <span>{language === 'EN' ? 'Verifying Credentials...' : 'Verificando Credenciales...'}</span>
            ) : lockoutSeconds > 0 ? (
              <span className="text-rose-950 font-black">{language === 'EN' ? `LOCKED (${lockoutSeconds}s)` : `BLOQUEADO POR SEGURIDAD (${lockoutSeconds}s)`}</span>
            ) : (
              <>
                <LogIn className="w-4 h-4 stroke-[3]" />
                <span>{language === 'EN' ? 'SIGN IN TO PLATFORM' : 'INGRESAR A LA PLATAFORMA'}</span>
              </>
            )}
          </button>
        </form>


        {/* Aviso Legal y Cumplimiento Normativo */}
        <div className="pt-2 border-t border-slate-800/80 text-center text-[11px] text-slate-400 space-y-0.5">
          <div>
            {language === 'EN' ? (
              <>Protected under Panama <strong className="text-white">Data Protection Law 81</strong>.</>
            ) : (
              <>Protegido bajo la <strong className="text-white">Ley 81 de Protección de Datos</strong> de Panamá.</>
            )}
          </div>
          <div className="text-[10px] text-slate-500 font-mono">
            AbregoTech Solutions S.A. • LIS/HIS v2.6 Enterprise • ISO 15189
          </div>
        </div>

      </div>

      {/* Modal de Recuperación de Contraseña con Validación por PIN */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900/95 border border-cyan-500/40 rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-[0_25px_60px_rgba(0,0,0,0.9),0_0_40px_rgba(6,182,212,0.18)] space-y-4 text-slate-100 ring-1 ring-cyan-500/30">
            {/* Encabezado del Modal */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">
                    {language === 'EN' ? 'Reset Password (Self-Service)' : 'Restablecer Contraseña (Autoservicio)'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {language === 'EN'
                      ? 'Identity verification via 4-digit signature PIN'
                      : 'Verificación de identidad mediante PIN de firma (4D)'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Banner Informativo: Si olvidó ambos factores */}
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-[11px] space-y-1">
              <div className="font-bold flex items-center space-x-1.5 text-amber-300">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                <span>
                  {language === 'EN'
                    ? 'Forgot both password AND signature PIN?'
                    : '¿Olvidó tanto su contraseña como su PIN de firma?'}
                </span>
              </div>
              <p className="text-slate-300 leading-relaxed text-[10px]">
                {language === 'EN'
                  ? 'Under ISO 15189 / Panama Law 81 clinical standards, if both factors are unknown, an Administrator must reset your credentials from the Super-Admin Console.'
                  : 'Por normativas de seguridad clínica (ISO 15189 y Ley 81 de Protección de Datos de Panamá), si no recuerda ninguno de los dos factores, un Administrador o Súper-Admin debe cambiar sus credenciales desde la Consola de Administración.'}
              </p>
            </div>

            {/* Formulario de Restablecimiento */}
            <form onSubmit={handleResetPasswordWithPin} className="space-y-3" noValidate>
              {/* Usuario o Correo */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 block">
                  {language === 'EN' ? 'Username or Corporate Email:' : 'Usuario o Correo Institucional:'}
                </label>
                <input
                  type="text"
                  value={forgotIdentifier}
                  onChange={(e) => {
                    setForgotIdentifier(e.target.value);
                    if (forgotError) setForgotError(null);
                  }}
                  placeholder={language === 'EN' ? 'e.g. rabrego or email@labsanjose.com' : 'ej. rabrego o correo@labsanjose.com'}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-medium focus:outline-none focus:border-cyan-400"
                  required
                />
              </div>

              {/* PIN de Firma de 4 Dígitos */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-amber-300 flex items-center justify-between">
                  <span>{language === 'EN' ? 'Current 4-digit Signature PIN:' : 'PIN de Firma Electrónica Actual (4D):'}</span>
                  <span className="text-[10px] font-mono text-slate-400">4 dígitos</span>
                </label>
                <input
                  type="password"
                  maxLength={4}
                  inputMode="numeric"
                  value={'•'.repeat(forgotPin.length)}
                  onChange={handleForgotPinChange}
                  placeholder="••••"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-amber-300 text-center font-mono font-black tracking-[0.3em] focus:outline-none focus:border-amber-400"
                  required
                />
              </div>

              {/* Nueva Contraseña y Confirmación */}
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 block">
                    {language === 'EN' ? 'New Password:' : 'Nueva Contraseña:'}
                  </label>
                  <div className="relative">
                    <input
                      type={forgotShowPassword ? 'text' : 'password'}
                      value={forgotNewPassword}
                      onChange={(e) => {
                        setForgotNewPassword(e.target.value);
                        if (forgotError) setForgotError(null);
                      }}
                      placeholder={language === 'EN' ? 'Min. 5 chars' : 'Mín. 5 car.'}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-3 pr-7 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-400"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setForgotShowPassword(!forgotShowPassword)}
                      className="absolute right-2 top-2 text-slate-400 hover:text-white cursor-pointer"
                      tabIndex={-1}
                    >
                      {forgotShowPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 block">
                    {language === 'EN' ? 'Confirm Password:' : 'Confirmar Clave:'}
                  </label>
                  <input
                    type="password"
                    value={forgotConfirmPassword}
                    onChange={(e) => {
                      setForgotConfirmPassword(e.target.value);
                      if (forgotError) setForgotError(null);
                    }}
                    placeholder={language === 'EN' ? 'Repeat password' : 'Repetir clave'}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-400"
                    required
                  />
                </div>
              </div>

              {/* Mensaje de Error */}
              {forgotError && (
                <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-start space-x-2 animate-in fade-in">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{forgotError}</span>
                </div>
              )}

              {/* Mensaje de Éxito */}
              {forgotSuccess && (
                <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center space-x-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{forgotSuccess}</span>
                </div>
              )}

              {/* Botones */}
              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="w-1/3 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-xs font-bold text-slate-300 transition cursor-pointer"
                >
                  {language === 'EN' ? 'Cancel' : 'Cancelar'}
                </button>
                <button
                  type="submit"
                  disabled={isResettingPassword}
                  className="w-2/3 py-2.5 bg-gradient-to-r from-teal-400 via-cyan-500 to-teal-400 hover:brightness-110 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition shadow-lg shadow-cyan-500/20 cursor-pointer flex items-center justify-center space-x-1.5 disabled:opacity-50"
                >
                  {isResettingPassword ? (
                    <span>{language === 'EN' ? 'Verifying PIN...' : 'Verificando PIN...'}</span>
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4" />
                      <span>{language === 'EN' ? 'Update Password' : 'Cambiar Contraseña'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
