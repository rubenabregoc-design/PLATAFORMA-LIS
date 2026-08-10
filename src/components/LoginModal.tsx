import React, { useState } from 'react';
import { Role, User, Tenant } from '../types';
import {
  Shield, Building2, UserCheck, Lock, KeyRound, CheckCircle2,
  Sparkles, ArrowRight, X, ChevronRight, Stethoscope, UserPlus,
  Cpu, Activity, Receipt, Award, Users, ShieldAlert, SlidersHorizontal
} from 'lucide-react';
import { MOCK_USERS } from '../data/mockData';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRole: Role;
  onSelectUserAndRole: (user: User) => void;
  currentTenant: Tenant;
}

export const ROLE_DETAILS: Record<
  Role,
  {
    title: string;
    category: string;
    badgeBg: string;
    icon: any;
    desc: string;
    modulesCount: number;
    modulesList: string[];
  }
> = {
  owner: {
    title: 'Dueño / Gerente General',
    category: 'Dirección & Finanzas',
    badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    icon: Building2,
    desc: 'Acceso a métricas de facturación, BI Ejecutiva, auditoría y administración de sedes.',
    modulesCount: 7,
    modulesList: ['Dashboard Gerencial', 'BI Ejecutiva AI', 'Facturación POS', 'Inventario', 'Modelo DB', 'Ruteo Sedes', 'Auditoría Ley 81']
  },
  lab_chief: {
    title: 'Jefe de Laboratorio',
    category: 'Validación Técnica & QC',
    badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    icon: Shield,
    desc: 'Firma digital SHA-256, validación médica final, control Westgard y reportes MINSA.',
    modulesCount: 7,
    modulesList: ['Bandeja de Firma', 'QC Westgard', 'Middleware ASTM', 'Alertas Pánico', 'EPI MINSA', 'ISO 15189', 'Auditoría Ley 81']
  },
  tech_med: {
    title: 'Tecnólogo Médico',
    category: 'Procesamiento e Instrumental',
    badgeBg: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    icon: Cpu,
    desc: 'Validación técnica de muestras, interfaz directa de analizadores Sysmex/Vitros y Westgard.',
    modulesCount: 6,
    modulesList: ['Procesamiento Muestras', 'Middleware ASTM', 'Drivers Analizadores', 'QC Westgard', 'Alertas Pánico', 'Inventario']
  },
  lab_tech: {
    title: 'Técnico de Laboratorio',
    category: 'Flebotomía y Muestras',
    badgeBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    icon: Activity,
    desc: 'Recepción de tubos, escaneo de código de barras, gradillas y cadena de custodia.',
    modulesCount: 4,
    modulesList: ['Recepción de Tubos', 'Escaneo Barcode', 'Drivers ASTM', 'Inventario Muestras']
  },
  receptionist: {
    title: 'Recepcionista',
    category: 'Admisión & Caja POS',
    badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    icon: UserPlus,
    desc: 'Registro de pacientes con Cédula panameña, creación de órdenes y facturación DGI.',
    modulesCount: 3,
    modulesList: ['Admisión Pacientes', 'Facturación POS & DGI', 'Inventario Reactivos']
  },
  ext_doctor: {
    title: 'Médico Referente Externo',
    category: 'Portal Médico Clínico',
    badgeBg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
    icon: Stethoscope,
    desc: 'Requisiciones electrónicas CIE-10 y descarga de informes de laboratorio firmados.',
    modulesCount: 2,
    modulesList: ['Órdenes de Pacientes', 'Requisición CIE-10']
  },
  patient: {
    title: 'Paciente / Cliente',
    category: 'Portal Personal',
    badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    icon: Users,
    desc: 'Consulta de resultados de laboratorio en PDF, tendencias de salud y gestión Ley 81.',
    modulesCount: 3,
    modulesList: ['Mis Exámenes PDF', 'Tendencias de Salud', 'Privacidad Ley 81']
  },
  abregotech_admin: {
    title: 'Administrador AbregoTech',
    category: 'Super Admin SaaS',
    badgeBg: 'bg-slate-700/80 text-slate-100 border-slate-500',
    icon: ShieldAlert,
    desc: 'Súper-administrador SaaS: aprovisionamiento multi-tenant, FHIR API y HA & Cluster.',
    modulesCount: 15,
    modulesList: ['Aprovisionamiento Tenants', 'Todos los Módulos LIS', 'HA & Cluster', 'FHIR API']
  }
};

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  currentRole,
  onSelectUserAndRole,
  currentTenant
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden relative text-slate-100">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800/80 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-teal-500/20 text-teal-400 rounded-2xl border border-teal-500/30">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-black uppercase tracking-wider text-teal-400">Autenticación RBAC</span>
                <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700">
                  {currentTenant.name}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Iniciar Sesión & Selección de Rol de Trabajo
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body - Grid of Accounts */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 text-xs text-slate-300 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-teal-400 shrink-0" />
              <span>
                Seleccione un perfil de usuario para ingresar al sistema. Cada rol habilita sus <strong>módulos de trabajo específicos</strong> y mantiene aislada la seguridad del LIS.
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {MOCK_USERS.map((usr) => {
              const details = ROLE_DETAILS[usr.role];
              const Icon = details.icon;
              const isCurrent = currentRole === usr.role;

              return (
                <div
                  key={usr.id}
                  onClick={() => {
                    onSelectUserAndRole(usr);
                    onClose();
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 relative group ${
                    isCurrent
                      ? 'bg-gradient-to-br from-slate-850 to-slate-900 border-teal-500 shadow-lg ring-1 ring-teal-500/30'
                      : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80'
                  }`}
                >
                  {isCurrent && (
                    <div className="absolute top-3 right-3 flex items-center space-x-1 text-[10px] bg-teal-500 text-slate-950 font-black px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Sesión Activa</span>
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2.5 rounded-xl border ${details.badgeBg}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-white text-sm flex items-center space-x-1.5">
                          <span>{usr.name}</span>
                          {usr.licenseNumber && (
                            <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                              {usr.licenseNumber}
                            </span>
                          )}
                        </div>
                        <div className="text-xs font-semibold text-slate-400">{details.title}</div>
                      </div>
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-2">{details.desc}</p>
                  </div>

                  {/* Modules summary badge list */}
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-1.5 text-slate-300 text-[11px] font-medium overflow-hidden">
                      <SlidersHorizontal className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                      <span className="truncate">
                        Módulos ({details.modulesCount}): {details.modulesList.slice(0, 3).join(', ')}...
                      </span>
                    </div>

                    <div className="text-teal-400 group-hover:translate-x-1 transition-transform shrink-0">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 text-xs text-slate-400 flex items-center justify-between">
          <span className="font-mono text-[11px]">AbregoTech LIS-Core Security Engine — SSL 256-bit</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition"
          >
            Cerrar Ventana
          </button>
        </div>
      </div>
    </div>
  );
};
