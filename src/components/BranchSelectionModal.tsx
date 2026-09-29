import React, { useState } from 'react';
import { Tenant, Branch, User } from '../types';
import {
  Building2, MapPin, Phone, ArrowRight,
  ShieldCheck, Sparkles, Building, Activity, Check,
  Key, Lock, Eye, EyeOff, AlertTriangle, CheckCircle2
} from 'lucide-react';
import { useLisStore } from '../store/useLisStore';
import { getRoleLabel, getBranchName } from '../utils/i18n';
import { validateEthicalPin } from '../utils/securityHarden';

interface BranchSelectionModalProps {
  isOpen: boolean;
  currentUser: User;
  currentTenant: Tenant;
  selectedBranchId: string;
  onSelectBranch: (branchId: string) => void;
  onConfirm: (branchId: string) => void;
  onClose?: () => void;
}

export const BranchSelectionModal: React.FC<BranchSelectionModalProps> = ({
  isOpen,
  currentUser,
  currentTenant,
  selectedBranchId,
  onSelectBranch,
  onConfirm,
  onClose
}) => {
  if (!isOpen) return null;

  const language = useLisStore((state) => state.language);
  const setCurrentUser = useLisStore((state) => state.setCurrentUser);
  const isEn = language === 'EN';

  const [modalTab, setModalTab] = useState<'branch' | 'security'>('branch');
  const [activeBranchId, setActiveBranchId] = useState<string>(
    selectedBranchId || currentTenant.branches[0]?.id || ''
  );

  // Estados para Cambio de Contraseña y PIN propio
  const [currentPass, setCurrentPass] = useState<string>('');
  const [newPass, setNewPass] = useState<string>('');
  const [confirmPass, setConfirmPass] = useState<string>('');
  const [showPass, setShowPass] = useState<boolean>(false);
  const [currentPinInput, setCurrentPinInput] = useState<string>('');
  const [newPinInput, setNewPinInput] = useState<string>('');
  const [confirmPinInput, setConfirmPinInput] = useState<string>('');
  const [secError, setSecError] = useState<string | null>(null);
  const [secSuccess, setSecSuccess] = useState<string | null>(null);

  const roleInfo = getRoleLabel(currentUser.role, language);

  const handleSelect = (branchId: string) => {
    setActiveBranchId(branchId);
    onSelectBranch(branchId);
  };

  const handleConfirmAction = () => {
    onConfirm(activeBranchId);
  };

  const handleSelfUpdateSecurity = (e: React.FormEvent) => {
    e.preventDefault();
    setSecError(null);
    setSecSuccess(null);

    const trimmedCurPass = currentPass.trim();
    const trimmedNewPass = newPass.trim();
    const trimmedConfirmPass = confirmPass.trim();
    const trimmedCurPin = currentPinInput.trim();
    const trimmedNewPin = newPinInput.trim();
    const trimmedConfirmPin = confirmPinInput.trim();

    if (!trimmedNewPass && !trimmedNewPin) {
      setSecError(isEn ? 'Please enter a new password or a new 4-digit PIN.' : 'Ingrese una nueva contraseña o un nuevo PIN de 4 dígitos.');
      return;
    }

    // 1. Validar Contraseña Actual si el usuario ingresó nueva contraseña
    if (trimmedNewPass) {
      if (currentUser.password && trimmedCurPass !== currentUser.password && btoa(`abregotech_salt_${trimmedCurPass}`) !== currentUser.passwordHash) {
        setSecError(isEn ? 'Current password is incorrect.' : 'La contraseña actual es incorrecta.');
        return;
      }
      if (trimmedNewPass.length < 5) {
        setSecError(isEn ? 'New password must have at least 5 characters.' : 'La nueva contraseña debe contener al menos 5 caracteres.');
        return;
      }
      if (trimmedNewPass !== trimmedConfirmPass) {
        setSecError(isEn ? 'New passwords do not match.' : 'Las nuevas contraseñas no coinciden.');
        return;
      }
    }

    // 2. Validar PIN Actual si se va a cambiar
    if (trimmedNewPin) {
      if (currentUser.pinCode && trimmedCurPin !== currentUser.pinCode) {
        setSecError(isEn ? 'Current signature PIN is incorrect.' : 'El PIN de firma actual es incorrecto.');
        return;
      }
      const pinValidation = validateEthicalPin(trimmedNewPin);
      if (!pinValidation.isValid) {
        setSecError(pinValidation.error || (isEn ? 'Invalid PIN.' : 'PIN no permitido por políticas de seguridad ética.'));
        return;
      }
      if (trimmedNewPin !== trimmedConfirmPin) {
        setSecError(isEn ? 'New PINs do not match.' : 'Los nuevos PINs no coinciden.');
        return;
      }
    }

    // Guardar cambios en el usuario activo y en almacenamiento local
    const newHash = trimmedNewPass ? btoa(`abregotech_salt_${trimmedNewPass}`) : currentUser.passwordHash;
    const updatedUser: User = {
      ...currentUser,
      password: trimmedNewPass || currentUser.password,
      passwordHash: newHash,
      pinCode: trimmedNewPin || currentUser.pinCode
    };

    setCurrentUser(updatedUser);

    try {
      const stored = localStorage.getItem('lis_real_users');
      let users: User[] = stored ? JSON.parse(stored) : [];
      if (!Array.isArray(users)) users = [];

      const idx = users.findIndex(u => u.id === currentUser.id || u.email === currentUser.email || u.username === currentUser.username);
      if (idx >= 0) {
        users[idx] = {
          ...users[idx],
          password: undefined,
          passwordHash: newHash,
          pinCode: trimmedNewPin || users[idx].pinCode
        };
      } else {
        users.push({
          ...updatedUser,
          password: undefined,
          passwordHash: newHash
        });
      }

      localStorage.setItem('lis_real_users', JSON.stringify(users));
      window.dispatchEvent(new CustomEvent('lis_users_updated'));
    } catch (err) {
      console.error(err);
    }

    setSecSuccess(isEn ? 'Security credentials updated successfully!' : '¡Credenciales de seguridad actualizadas exitosamente!');
    setCurrentPass('');
    setNewPass('');
    setConfirmPass('');
    setCurrentPinInput('');
    setNewPinInput('');
    setConfirmPinInput('');

    window.dispatchEvent(
      new CustomEvent('lis-global-toast', {
        detail: {
          message: isEn ? 'Your credentials have been safely updated.' : 'Tus credenciales de seguridad han sido actualizadas.',
          type: 'success'
        }
      })
    );
  };

  const selectedBranch = currentTenant.branches.find(b => b.id === activeBranchId) || currentTenant.branches[0];

  return (
    <div className="fixed inset-0 z-50 bg-[#020617]/90 backdrop-blur-xl flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-[#03091e]/95 border-2 border-cyan-400/40 rounded-3xl max-w-xl w-full max-h-[85vh] sm:max-h-[88vh] shadow-[0_25px_70px_rgba(0,240,255,0.25)] ring-1 ring-cyan-500/30 relative overflow-hidden flex flex-col">
        
        {/* Glow backdrop decoration matching Hospital Sunset Background */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-cyan-500/20 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-blue-600/20 rounded-full blur-[90px] pointer-events-none"></div>

        {/* Inner Scrollable Container with clipped scrollbar */}
        <div className="overflow-y-auto p-6 sm:p-8 space-y-4 sm:space-y-6 relative z-10 flex-1 custom-scrollbar">
          {/* Modal Header */}
          <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="px-3 py-1 bg-cyan-500/20 border border-cyan-400/40 text-cyan-200 font-bold rounded-full text-[11px] uppercase tracking-wider flex items-center space-x-1.5 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>{isEn ? 'User Profile & Operational Center' : 'Perfil de Usuario & Centro Operativo'}</span>
            </span>

            {onClose && (
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-white text-sm font-bold p-1 rounded-lg transition cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center space-x-2">
            {modalTab === 'branch' ? (
              <>
                <Building2 className="w-7 h-7 text-cyan-400 shrink-0" />
                <span>{isEn ? 'Select Your Operating Branch' : 'Seleccione su Sede de Trabajo'}</span>
              </>
            ) : (
              <>
                <Key className="w-7 h-7 text-amber-400 shrink-0" />
                <span>{isEn ? 'My Security Credentials' : 'Mis Credenciales de Seguridad'}</span>
              </>
            )}
          </h2>

          <p className="text-[11px] sm:text-xs text-slate-300 leading-relaxed">
            {modalTab === 'branch' ? (
              isEn ? (
                <>Hello <strong className="text-white">{currentUser.name}</strong>, your account has access to multiple clinical facilities in <strong className="text-cyan-300">{currentTenant.name}</strong>. Please confirm the branch you will operate from during this clinical session.</>
              ) : (
                <>Hola <strong className="text-white">{currentUser.name}</strong>, tu cuenta tiene acceso a múltiples centros clínicos en <strong className="text-cyan-300">{currentTenant.name}</strong>. Por favor confirma la sede en la que operarás durante esta sesión.</>
              )
            ) : (
              isEn ? (
                <>Manage your personal login password and electronic signature PIN (ISO 15189 / Ley 81). Only administrators can modify roles and organizational assignments.</>
              ) : (
                <>Gestione su contraseña personal de acceso y su PIN de firma electrónica (ISO 15189 y Ley 81). Solo el Súper-Admin puede modificar roles, sedes o cuentas de otros usuarios.</>
              )
            )}
          </p>
        </div>

        {/* User Role Badge Banner */}
        <div className="p-3.5 bg-[#020718] border border-cyan-500/30 rounded-2xl flex items-center justify-between gap-3 text-xs relative z-10 shadow-inner">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 flex items-center justify-center font-bold">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <div className="font-bold text-white text-xs">{currentUser.name}</div>
              <div className="text-[11px] text-slate-400 font-mono">
                {currentUser.username ? `@${currentUser.username} • ` : ''}{currentUser.email}
              </div>
            </div>
          </div>

          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/40 shadow-sm">
            {roleInfo.title}
          </span>
        </div>

        {/* Tab Selector: Sede de Trabajo vs Mis Credenciales */}
        <div className="flex rounded-2xl bg-slate-950 p-1 border border-slate-800 relative z-10">
          <button
            type="button"
            onClick={() => setModalTab('branch')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center space-x-1.5 cursor-pointer ${
              modalTab === 'branch'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>{isEn ? 'Operating Branch' : 'Sede de Trabajo'}</span>
          </button>
          <button
            type="button"
            onClick={() => setModalTab('security')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center space-x-1.5 cursor-pointer ${
              modalTab === 'security'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>{isEn ? 'My Password & PIN' : 'Mi Contraseña & PIN'}</span>
          </button>
        </div>

        {modalTab === 'branch' ? (
          <>
            {/* Branch Cards Selection */}
            <div className="space-y-3 relative z-10">
              <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span>{isEn ? `Available Branches (${currentTenant.branches.length})` : `Sedes Disponibles (${currentTenant.branches.length})`}</span>
                <span className="text-[10px] text-cyan-400 font-mono">{isEn ? 'Required for clinical session' : 'Selección obligatoria de sesión'}</span>
              </label>

              <div className="grid grid-cols-1 gap-2.5 max-h-60 overflow-y-auto pr-1">
                {currentTenant.branches.map((branch: Branch) => {
                  const isSelected = branch.id === activeBranchId;

                  return (
                    <button
                      key={branch.id}
                      type="button"
                      onClick={() => handleSelect(branch.id)}
                      className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden group ${
                        isSelected
                          ? 'bg-[#020718] border-cyan-400 ring-2 ring-cyan-500/40 shadow-xl shadow-cyan-500/20'
                          : 'bg-[#020718]/60 border-slate-800 hover:border-cyan-500/40 hover:bg-[#020718]'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${
                            isSelected
                              ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                              : 'bg-slate-900 border-slate-800 text-slate-500 group-hover:text-slate-300'
                          }`}>
                            <Building className="w-5 h-5" />
                          </div>

                          <div className="space-y-1">
                            <div className="font-bold text-sm text-white flex items-center space-x-2">
                              <span>{getBranchName(branch.name, language)}</span>
                              <span className="px-2 py-0.5 bg-slate-900 text-slate-300 border border-slate-800 rounded text-[10px] font-mono">
                                {branch.code}
                              </span>
                            </div>

                            <div className="text-[11px] text-slate-400 flex items-center space-x-1.5">
                              <MapPin className="w-3.3 h-3.3 text-cyan-400 shrink-0" />
                              <span>{branch.address}</span>
                            </div>

                            <div className="text-[11px] text-slate-400 flex items-center space-x-1.5 font-mono">
                              <Phone className="w-3.3 h-3.3 text-slate-500 shrink-0" />
                              <span>{branch.phone}</span>
                            </div>
                          </div>
                        </div>

                        <div className="shrink-0 pt-0.5">
                          {isSelected ? (
                            <div className="w-6 h-6 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center font-bold shadow-md shadow-cyan-400/40">
                              <Check className="w-4 h-4 stroke-[3]" />
                            </div>
                          ) : (
                            <div className="w-6 h-6 rounded-full border border-slate-700 bg-slate-900 group-hover:border-slate-500"></div>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Branch Summary Footer */}
            {selectedBranch && (
              <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-2xl text-[11px] text-cyan-200 space-y-1 relative z-10">
                <div className="font-bold flex items-center space-x-1.5">
                  <Activity className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{isEn ? 'Active Session Configuration:' : 'Configuración Activa de Sesión:'}</span>
                </div>
                <p className="text-slate-300">
                  {isEn ? (
                    <>Specimens, billing records, and clinical logs will be attributed to: <strong className="text-white font-bold">{getBranchName(selectedBranch.name, language)} ({selectedBranch.code})</strong>.</>
                  ) : (
                    <>Las muestras, facturas y folios fiscales serán atribuidos a: <strong className="text-white font-bold">{selectedBranch.name} ({selectedBranch.code})</strong>.</>
                  )}
                </p>
              </div>
            )}

            {/* Action Controls */}
            <div className="pt-2 flex items-center justify-end space-x-3 border-t border-slate-800 relative z-10">
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  {isEn ? 'Cancel' : 'Cancelar'}
                </button>
              )}

              <button
                type="button"
                onClick={handleConfirmAction}
                className="px-6 py-2.5 bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-400 hover:brightness-110 text-slate-950 font-black rounded-xl text-xs transition shadow-[0_10px_25px_rgba(0,240,255,0.35)] flex items-center space-x-2 cursor-pointer"
              >
                <span>{isEn ? 'Confirm & Enter Clinical Station' : 'Confirmar e Iniciar en esta Sede'}</span>
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </button>
            </div>
          </>
        ) : (
          /* Formulario de Seguridad Personal (Cambiar Contraseña y PIN) */
          <form onSubmit={handleSelfUpdateSecurity} className="space-y-4 relative z-10">
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-[11px] text-amber-200 space-y-1">
              <div className="font-bold flex items-center space-x-1.5 text-amber-300">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>{isEn ? 'Personal Security Settings' : 'Seguridad y Privacidad Personal'}</span>
              </div>
              <p className="text-slate-300 leading-relaxed text-[10.5px]">
                {isEn
                  ? 'As a clinical user, you can update your login password and your 4-digit electronic signature PIN here. Role permissions and branch assignments are exclusively managed by the Super-Admin.'
                  : 'Como usuario clínico, usted puede actualizar su contraseña y su PIN de firma electrónica personal aquí. Los permisos de rol y asignación de sedes son gestionados exclusivamente por el Súper-Admin.'}
              </p>
            </div>

            {/* Sección Contraseña */}
            <div className="p-3.5 bg-[#020718] border border-slate-800 rounded-2xl space-y-3">
              <h4 className="text-xs font-bold text-white flex items-center space-x-1.5">
                <Key className="w-3.5 h-3.5 text-cyan-400" />
                <span>{isEn ? 'Change Login Password' : 'Cambiar Contraseña de Acceso'}</span>
              </h4>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-300 block font-medium">
                  {isEn ? 'Current Password:' : 'Contraseña Actual:'}
                </label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={currentPass}
                    onChange={(e) => setCurrentPass(e.target.value)}
                    placeholder={isEn ? 'Enter current password' : 'Su contraseña actual'}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-400 pr-8"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
                  >
                    {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-300 block font-medium">
                    {isEn ? 'New Password:' : 'Nueva Contraseña:'}
                  </label>
                  <input
                    type="password"
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    placeholder={isEn ? 'Min. 5 chars' : 'Mín. 5 caracteres'}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-300 block font-medium">
                    {isEn ? 'Confirm Password:' : 'Confirmar Clave:'}
                  </label>
                  <input
                    type="password"
                    value={confirmPass}
                    onChange={(e) => setConfirmPass(e.target.value)}
                    placeholder={isEn ? 'Repeat password' : 'Repita la nueva clave'}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>
            </div>

            {/* Sección PIN de Firma Electrónica */}
            <div className="p-3.5 bg-[#020718] border border-slate-800 rounded-2xl space-y-3">
              <h4 className="text-xs font-bold text-amber-300 flex items-center space-x-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>{isEn ? 'Change 4-Digit Electronic Signature PIN' : 'Cambiar PIN de Firma Electrónica (4 Dígitos)'}</span>
              </h4>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 block font-medium">
                    {isEn ? 'Current PIN:' : 'PIN Actual:'}
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    inputMode="numeric"
                    value={currentPinInput}
                    onChange={(e) => setCurrentPinInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="••••"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2 py-2 text-center text-xs text-amber-300 font-mono font-bold tracking-widest focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 block font-medium">
                    {isEn ? 'New PIN:' : 'Nuevo PIN:'}
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    inputMode="numeric"
                    value={newPinInput}
                    onChange={(e) => setNewPinInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="••••"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2 py-2 text-center text-xs text-amber-300 font-mono font-bold tracking-widest focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 block font-medium">
                    {isEn ? 'Confirm PIN:' : 'Confirmar:'}
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    inputMode="numeric"
                    value={confirmPinInput}
                    onChange={(e) => setConfirmPinInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="••••"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2 py-2 text-center text-xs text-amber-300 font-mono font-bold tracking-widest focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>
            </div>

            {/* Mensajes de Alerta */}
            {secError && (
              <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center space-x-2 animate-in fade-in">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{secError}</span>
              </div>
            )}

            {secSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center space-x-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{secSuccess}</span>
              </div>
            )}

            {/* Botón de Guardar */}
            <div className="pt-2 flex items-center justify-end space-x-3 border-t border-slate-800">
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  {isEn ? 'Cancel' : 'Cancelar'}
                </button>
              )}

              <button
                type="submit"
                className="px-6 py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:brightness-110 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition shadow-lg shadow-amber-500/20 flex items-center space-x-2 cursor-pointer"
              >
                <Key className="w-4 h-4" />
                <span>{isEn ? 'Save My Credentials' : 'Guardar Mis Credenciales'}</span>
              </button>
            </div>
          </form>
        )}

        </div>
      </div>
    </div>
  );
};
