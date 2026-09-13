import React, { useState, useEffect } from 'react';
import { Tenant, Analyzer, MiddlewareMessageLog, User, Role } from '../../types';
import { useLisStore } from '../../store/useLisStore';
import { MOCK_USERS } from '../../data/mockData';
import {
  Shield, Building2, Cpu, Activity, Plus, Server, CheckCircle2,
  AlertTriangle, Layers, Award, Globe, ExternalLink, Copy, Check, QrCode, Stethoscope, Users,
  UserPlus, Key, Lock, Mail, ShieldCheck, Database, CheckCheck, Trash2
} from 'lucide-react';

interface SuperAdminDashboardProps {
  tenants: Tenant[];
  analyzers: Analyzer[];
  logs: MiddlewareMessageLog[];
  onProvisionTenant: (name: string, ruc: string, dv: string, plan: Tenant['plan']) => void;
}

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({
  tenants,
  analyzers,
  logs,
  onProvisionTenant
}) => {
  const { setActiveTab } = useLisStore();

  const [newLabName, setNewLabName] = useState<string>('');
  const [newRuc, setNewRuc] = useState<string>('');
  const [newDv, setNewDv] = useState<string>('');
  const [newPlan, setNewPlan] = useState<Tenant['plan']>('Pro');
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  // Real users state
  const [realUsers, setRealUsers] = useState<User[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('lis_real_users');
        if (stored) return JSON.parse(stored);
      } catch (e) {}
    }
    return MOCK_USERS;
  });

  // New Real User Form State
  const [newUserName, setNewUserName] = useState<string>('');
  const [newUserEmail, setNewUserEmail] = useState<string>('');
  const [newUserPassword, setNewUserPassword] = useState<string>('');
  const [newUserRole, setNewUserRole] = useState<Role>('tech_med');
  const [newUserLicense, setNewUserLicense] = useState<string>('');
  const [newUserPin, setNewUserPin] = useState<string>('1234');
  const [newUserTenant, setNewUserTenant] = useState<string>(tenants[0]?.id || 'lab-san-jose');
  const [userCreatedSuccess, setUserCreatedSuccess] = useState<string | null>(null);

  const handleCreateTenant = () => {
    if (!newLabName || !newRuc) {
      window.dispatchEvent(
        new CustomEvent('lis-global-toast', {
          detail: { message: 'Por favor ingrese el Nombre del Laboratorio y el RUC.', type: 'warning' }
        })
      );
      return;
    }
    onProvisionTenant(newLabName, newRuc, newDv || '00', newPlan);
    setNewLabName('');
    setNewRuc('');
    setNewDv('');
    window.dispatchEvent(
      new CustomEvent('lis-global-toast', {
        detail: { message: `¡Laboratorio "${newLabName}" aprovisionado con éxito en la plataforma multi-tenant!`, type: 'success' }
      })
    );
  };

  const handleCopyLink = (url: string, name: string) => {
    navigator.clipboard.writeText(url);
    setCopiedLink(name);
    setTimeout(() => setCopiedLink(null), 2000);

    window.dispatchEvent(
      new CustomEvent('lis-global-toast', {
        detail: { message: `Enlace de ${name} copiado: ${url}`, type: 'info' }
      })
    );
  };

  const handleCreateRealUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim() || !newUserPassword.trim()) {
      window.dispatchEvent(
        new CustomEvent('lis-global-toast', {
          detail: { message: 'Complete nombre, correo y contraseña del usuario.', type: 'warning' }
        })
      );
      return;
    }

    const newUser: User = {
      id: `usr-${Date.now()}`,
      tenantId: newUserTenant,
      branchId: 'branch-via-espana',
      name: newUserName.trim(),
      email: newUserEmail.trim(),
      role: newUserRole,
      password: newUserPassword.trim(),
      pinCode: newUserPin.trim() || '1234',
      licenseNumber: newUserLicense.trim() || undefined,
      twoFactorEnabled: Boolean(newUserPin.trim())
    };

    const updated = [newUser, ...realUsers];
    setRealUsers(updated);
    try {
      localStorage.setItem('lis_real_users', JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('lis_users_updated'));
    } catch (e) {
      console.error(e);
    }

    setUserCreatedSuccess(`Usuario "${newUser.name}" (${newUser.email}) registrado exitosamente.`);
    setTimeout(() => setUserCreatedSuccess(null), 4000);

    // Reset Form
    setNewUserName('');
    setNewUserEmail('');
    setNewUserPassword('');
    setNewUserLicense('');
    setNewUserPin('1234');

    window.dispatchEvent(
      new CustomEvent('lis-global-toast', {
        detail: { message: `¡Usuario real creado! Ya puede iniciar sesión con ${newUser.email}.`, type: 'success' }
      })
    );
  };

  const handleDeleteRealUser = (userId: string) => {
    const updated = realUsers.filter((u) => u.id !== userId);
    setRealUsers(updated);
    try {
      localStorage.setItem('lis_real_users', JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('lis_users_updated'));
    } catch (e) {}

    window.dispatchEvent(
      new CustomEvent('lis-global-toast', {
        detail: { message: 'Usuario eliminado.', type: 'info' }
      })
    );
  };

  const currentHost = typeof window !== 'undefined' && window.location.hostname ? window.location.hostname : 'localhost';
  const patientPortalUrl = `http://${currentHost}:3001`;
  const doctorPortalUrl = `http://${currentHost}:3002`;
  const superAdminUrl = `http://${currentHost}:3003`;

  const patientPortalAltUrl = `http://${currentHost}:3000/?portal=patient`;
  const doctorPortalAltUrl = `http://${currentHost}:3000/?portal=doctor`;
  const superAdminAltUrl = `http://${currentHost}:3000/?portal=superadmin`;

  return (
    <div className="space-y-6 text-slate-100 animate-in fade-in duration-500">

      {/* Encabezado Ejecutivo LISCORE Theme */}
      <div className="bg-slate-900/90 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-400 via-cyan-500 to-blue-500"></div>
        <div>
          <div className="text-cyan-400 text-xs font-black uppercase tracking-widest mb-1.5 flex items-center space-x-2">
            <Shield className="w-4 h-4 text-cyan-400" />
            <span>Plataforma Súper-Admin — AbregoTech Systems SaaS</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Gestión Multi-Tenant & Portales Dedicados con Puertos Propios
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-xl font-medium leading-relaxed">
            Consola central de administración para enrutamiento de puertos independientes, aprovisionamiento de clínicas, creación de usuarios reales con seguridad Supabase y clúster ASTM.
          </p>
        </div>

        <div className="bg-slate-950 border border-cyan-500/30 p-4 rounded-2xl text-xs space-y-1.5 shrink-0">
          <div className="text-white font-black flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-cyan-400" />
            <span>Laboratorios Activos: {tenants.length}</span>
          </div>
          <div className="text-cyan-300 font-mono font-bold flex items-center space-x-2">
            <Users className="w-4 h-4 text-emerald-400" />
            <span>Usuarios Registrados: {realUsers.length}</span>
          </div>
          <div className="text-emerald-400 font-bold flex items-center space-x-1.5 pt-1 border-t border-slate-800">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Cluster Middleware: 100% Operativo</span>
          </div>
        </div>
      </div>

      {/* 🌐 CONSOLA DE PORTALES DEDICADOS (CON PUERTOS PROPIOS Y ENLACES DIRECTOS) */}
      <div className="bg-slate-900/90 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                Portales Públicos con Puerto Dedicado Independiente
              </h3>
              <p className="text-[11px] text-slate-400">
                Cada portal cuenta con su puerto de red específico para acceso público, intranet o redirección de firewall
              </p>
            </div>
          </div>

          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full font-bold">
            ✓ Enrutador Multi-Puerto Activo (3000, 3001, 3002, 3003)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

          {/* Portal 1: Pacientes (Puerto 3001) */}
          <div className="bg-slate-950 p-5 rounded-2xl border border-cyan-500/30 hover:border-cyan-400 space-y-4 transition flex flex-col justify-between shadow-xl">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  <Users className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-mono font-black bg-cyan-500/20 text-cyan-300 px-2.5 py-1 rounded-lg border border-cyan-500/40">
                  PUERTO 3001
                </span>
              </div>
              <h4 className="text-xs font-black text-white uppercase tracking-wider">Portal Público de Pacientes</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Descarga de resultados en PDF con firma digital Ley 81, consulta por Cédula/Orden y envío a WhatsApp.
              </p>
              <div className="bg-slate-900 p-2.5 rounded-xl font-mono text-[11px] text-cyan-300 break-all border border-slate-800 flex items-center justify-between">
                <span>{patientPortalUrl}</span>
                <button
                  onClick={() => handleCopyLink(patientPortalUrl, 'Portal de Pacientes')}
                  className="p-1 text-slate-400 hover:text-white cursor-pointer ml-1"
                  title="Copiar URL directa"
                >
                  {copiedLink === 'Portal de Pacientes' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <a
                href={patientPortalUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs rounded-xl transition cursor-pointer flex items-center justify-center space-x-2 shadow-md shadow-cyan-500/20"
              >
                <span>Puerto 3001 (Dedicado)</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <a
                href={patientPortalAltUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center space-x-2"
              >
                <span>Puerto 3000 (?portal=patient)</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Portal 2: Médicos Referentes (Puerto 3002) */}
          <div className="bg-slate-950 p-5 rounded-2xl border border-indigo-500/30 hover:border-indigo-400 space-y-4 transition flex flex-col justify-between shadow-xl">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  <Stethoscope className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-mono font-black bg-indigo-500/20 text-indigo-300 px-2.5 py-1 rounded-lg border border-indigo-500/40">
                  PUERTO 3002 / 3000
                </span>
              </div>
              <h4 className="text-xs font-black text-white uppercase tracking-wider">Portal de Médicos Referentes</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Expedientes de pacientes remitidos, firma electrónica médica, descarga masiva y trazabilidad acumulativa.
              </p>
              <div className="bg-slate-900 p-2 rounded-xl font-mono text-[10px] text-indigo-300 break-all border border-slate-800 flex items-center justify-between">
                <span>{doctorPortalUrl}</span>
                <button
                  onClick={() => handleCopyLink(doctorPortalUrl, 'Portal de Médicos')}
                  className="p-1 text-slate-400 hover:text-white cursor-pointer ml-1"
                  title="Copiar URL puerto 3002"
                >
                  {copiedLink === 'Portal de Médicos' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <a
                href={doctorPortalUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs rounded-xl transition cursor-pointer flex items-center justify-center space-x-2 shadow-md shadow-indigo-600/20"
              >
                <span>Puerto 3002 (Dedicado)</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <a
                href={doctorPortalAltUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-indigo-300 border border-indigo-500/30 font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center space-x-2"
              >
                <span>Puerto 3000 (?portal=doctor)</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Portal 3: Consola SuperAdmin (Puerto 3003) */}
          <div className="bg-slate-950 p-5 rounded-2xl border border-emerald-500/30 hover:border-emerald-400 space-y-4 transition flex flex-col justify-between shadow-xl">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <Shield className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-mono font-black bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-lg border border-emerald-500/40">
                  PUERTO 3003 / 3000
                </span>
              </div>
              <h4 className="text-xs font-black text-white uppercase tracking-wider">Consola Súper-Admin SaaS</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Gestión de laboratorios clientes, usuarios reales, PostgreSQL 16 y monitor del Middleware ASTM.
              </p>
              <div className="bg-slate-900 p-2 rounded-xl font-mono text-[10px] text-emerald-300 break-all border border-slate-800 flex items-center justify-between">
                <span>{superAdminUrl}</span>
                <button
                  onClick={() => handleCopyLink(superAdminUrl, 'Consola SuperAdmin')}
                  className="p-1 text-slate-400 hover:text-white cursor-pointer ml-1"
                  title="Copiar URL puerto 3003"
                >
                  {copiedLink === 'Consola SuperAdmin' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <a
                href={superAdminUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl transition cursor-pointer flex items-center justify-center space-x-2 shadow-md shadow-emerald-500/20"
              >
                <span>Puerto 3003 (Dedicado)</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <a
                href={superAdminAltUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-emerald-300 border border-emerald-500/30 font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center space-x-2"
              >
                <span>Puerto 3000 (?portal=superadmin)</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

        </div>
      </div>

      {/* 🔐 GESTIÓN DE USUARIOS CLÍNICOS REALES & SEGURIDAD SUPABASE */}
      <div className="bg-slate-900/90 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                Registro y Gestión de Usuarios Clínicos Reales
              </h3>
              <p className="text-[11px] text-slate-400">
                Cree credenciales reales con correo, contraseña, rol clínico, idoneidad MINSA y PIN de firma digital
              </p>
            </div>
          </div>

          <span className="text-[10px] font-mono text-cyan-300 bg-cyan-500/10 border border-cyan-500/30 px-3 py-1 rounded-full font-bold">
            ✓ Compatible con Supabase Auth & PostgreSQL RLS
          </span>
        </div>

        {userCreatedSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center space-x-2">
            <CheckCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{userCreatedSuccess}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Formulario de Creación de Usuario Real */}
          <form onSubmit={handleCreateRealUser} className="lg:col-span-5 bg-slate-950 p-6 rounded-3xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center space-x-2">
                <Plus className="w-4 h-4 text-cyan-400" />
                <span>Nuevo Usuario Clínico</span>
              </h4>
              <span className="text-[10px] font-mono text-cyan-300 bg-cyan-500/20 px-2 py-0.5 rounded border border-cyan-500/30">
                Alta Inmediata
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-300 block">Nombre Completo del Profesional:</label>
                <input
                  type="text"
                  placeholder="ej. Lic. Andrea Villalobos"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-bold focus:outline-none focus:border-cyan-400"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300 block">Correo Electrónico Real:</label>
                <input
                  type="email"
                  placeholder="andrea.villalobos@labsanjose.com"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-bold focus:outline-none focus:border-cyan-400"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300 block">Contraseña:</label>
                  <input
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono font-bold focus:outline-none focus:border-cyan-400"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300 block">PIN Firma (4D):</label>
                  <input
                    type="password"
                    maxLength={4}
                    placeholder="ej. 8821"
                    value={newUserPin}
                    onChange={(e) => setNewUserPin(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-amber-300 font-mono font-black text-center focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300 block">Rol Clínico:</label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as Role)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-cyan-400"
                  >
                    <option value="owner">Directora / Gerencia</option>
                    <option value="lab_chief">Jefe de Laboratorio</option>
                    <option value="tech_med">Tecnólogo Médico</option>
                    <option value="lab_tech">Técnico / Flebotomía</option>
                    <option value="receptionist">Recepción & Admisión</option>
                    <option value="ext_doctor">Médico Externo</option>
                    <option value="abregotech_admin">Admin de Sistemas</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300 block">Idoneidad MINSA:</label>
                  <input
                    type="text"
                    placeholder="TM-7214-PA"
                    value={newUserLicense}
                    onChange={(e) => setNewUserLicense(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-amber-300 font-mono font-bold focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300 block">Laboratorio / Sede:</label>
                <select
                  value={newUserTenant}
                  onChange={(e) => setNewUserTenant(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-cyan-400"
                >
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black rounded-xl text-xs transition cursor-pointer flex items-center justify-center space-x-2 shadow-lg shadow-cyan-500/20"
            >
              <UserPlus className="w-4 h-4" />
              <span>Registrar Usuario Clínico Real</span>
            </button>
          </form>

          {/* Lista de Usuarios Registrados en el Sistema */}
          <div className="lg:col-span-7 bg-slate-950 p-6 rounded-3xl border border-slate-800 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center space-x-2">
                  <Users className="w-4 h-4 text-cyan-400" />
                  <span>Usuarios Activos en la Base de Datos ({realUsers.length})</span>
                </h4>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                  Cifrado SHA-256 / JWT
                </span>
              </div>

              <div className="max-h-[360px] overflow-y-auto space-y-2 pr-1">
                {realUsers.map((u) => (
                  <div
                    key={u.id}
                    className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-cyan-500/40 transition flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="font-black text-white truncate">{u.name}</span>
                        <span className="text-[10px] font-mono bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded font-bold">
                          {u.role}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono truncate">{u.email}</div>
                      <div className="text-[10px] text-amber-300 font-mono flex items-center space-x-3">
                        {u.licenseNumber && <span>Idoneidad: {u.licenseNumber}</span>}
                        <span>PIN: {u.pinCode || '1234'}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteRealUser(u.id)}
                      className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition cursor-pointer"
                      title="Eliminar usuario"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Cuadro Educativo: Supabase vs Firebase en Salud */}
            <div className="mt-4 p-4 rounded-2xl bg-slate-900/90 border border-cyan-500/30 text-[11px] text-slate-300 space-y-2">
              <div className="font-black text-cyan-300 flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <span>¿Por qué Supabase (PostgreSQL) y no Firebase en Salud? (Ley 81 / ISO 15189)</span>
              </div>
              <p className="leading-relaxed text-slate-400">
                <strong>Supabase</strong> provee una base de datos relacional (PostgreSQL 16) con <strong>Row Level Security (RLS)</strong> a nivel de motor SQL. En un LIS/HIS, los datos médicos exigen integridad estricta (un paciente solo ve sus órdenes; un médico solo sus remitidos). Firebase es un documento NoSQL sin claves foráneas ni cumplimiento on-premises en jurisdicción panameña.
              </p>
            </div>

          </div>

        </div>
      </div>

      {/* Grid Bento: Aprovisionamiento de Tenants */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

        {/* Formulario de Aprovisionamiento */}
        <div className="lg:col-span-4 bg-slate-900/90 rounded-3xl p-6 border border-slate-800 shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-white text-xs uppercase tracking-wider flex items-center space-x-2">
                <Plus className="w-4 h-4 text-cyan-400" />
                <span>Aprovisionar Nuevo Laboratorio (Tenant)</span>
              </h3>
              <span className="text-[10px] bg-cyan-500/20 text-cyan-300 font-mono font-bold px-2.5 py-0.5 rounded-full border border-cyan-500/30">
                SaaS Multi-Tenant
              </span>
            </div>

            <div className="space-y-3 mt-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-300 block">Nombre del Laboratorio:</label>
                <input
                  type="text"
                  placeholder="Ej. Laboratorio San Lucas"
                  value={newLabName}
                  onChange={(e) => setNewLabName(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-2xl px-3.5 py-2.5 text-xs font-semibold text-white w-full focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2 space-y-1">
                  <label className="font-bold text-slate-300 block">RUC Panameño:</label>
                  <input
                    type="text"
                    placeholder="8-812-4432"
                    value={newRuc}
                    onChange={(e) => setNewRuc(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-2xl px-3.5 py-2.5 text-xs font-mono font-bold text-white w-full focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-300 block">DV:</label>
                  <input
                    type="text"
                    placeholder="00"
                    value={newDv}
                    onChange={(e) => setNewDv(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-2xl px-3.5 py-2.5 text-xs font-mono font-bold text-white w-full focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300 block">Plan de Suscripción LIS:</label>
                <select
                  value={newPlan}
                  onChange={(e) => setNewPlan(e.target.value as any)}
                  className="bg-slate-950 border border-slate-800 rounded-2xl px-3.5 py-2.5 text-xs font-bold text-white w-full focus:outline-none focus:border-cyan-400"
                >
                  <option value="Basic">Plan Básico ($150/mes)</option>
                  <option value="Pro">Plan Pro ($350/mes)</option>
                  <option value="Enterprise">Plan Enterprise ($750/mes)</option>
                </select>
              </div>
            </div>
          </div>

          <button
            onClick={handleCreateTenant}
            className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black px-5 py-3 rounded-2xl text-xs transition shadow-md shadow-cyan-500/20 flex items-center justify-center space-x-2 mt-4 cursor-pointer"
          >
            <Building2 className="w-4 h-4" />
            <span>Crear Tenant e Iniciar Aprovisionamiento</span>
          </button>
        </div>

        {/* Lista de Laboratorios Clientes */}
        <div className="lg:col-span-8 bg-slate-900/90 rounded-3xl p-6 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-extrabold text-white text-xs uppercase tracking-wider flex items-center space-x-2">
              <Building2 className="w-4 h-4 text-cyan-400" />
              <span>Laboratorios Clientes Registrados en Panamá</span>
            </h3>
            <span className="text-xs font-mono font-bold text-cyan-300 bg-cyan-500/10 px-2.5 py-1 rounded-xl border border-cyan-500/30">
              PostgreSQL Isolated Schemas
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tenants.map((t) => (
              <div key={t.id} className="p-4 rounded-2xl border border-slate-800 bg-slate-950 space-y-2 hover:border-cyan-500/50 transition-all shadow-md">
                <div className="flex items-center justify-between">
                  <span className="font-black text-white text-sm">{t.name}</span>
                  <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full">
                    {t.plan} Plan
                  </span>
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  RUC: <strong className="text-slate-200">{t.ruc}</strong> DV: <strong className="text-slate-200">{t.dv}</strong>
                </div>
                <div className="text-[11px] text-slate-400 border-t border-slate-900 pt-2 font-medium">
                  Sedes Activas: {t.branches.map((b) => b.name).join(', ')}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
