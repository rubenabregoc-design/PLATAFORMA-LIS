import React, { useState } from 'react';
import { Role, Order, TestResult, Patient, MiddlewareMessageLog, Branch } from '../types';
import {
  Activity, CheckCircle2, Clock, AlertTriangle, ChevronRight, User,
  FileText, ShieldCheck, Sparkles, Filter, Receipt, Cpu
} from 'lucide-react';

export interface ActivityEvent {
  id: string;
  timestamp: string;
  timeAgo: string;
  title: string;
  description: string;
  category: 'ORDER' | 'RESULT' | 'QC' | 'BILLING' | 'INTEGRATION' | 'VALIDATION' | 'MINSA';
  status: 'SUCCESS' | 'WARNING' | 'CRITICAL' | 'INFO';
  actorName: string;
  actorRole: string;
  allowedRoles: Role[];
  orderId?: string;
  patientName?: string;
}

interface RecentActivityWidgetProps {
  currentRole: Role;
  currentUserRoleTitle: string;
  currentBranch: Branch;
  orders: Order[];
  results: TestResult[];
  logs: MiddlewareMessageLog[];
  patients: Patient[];
}

export const RecentActivityWidget: React.FC<RecentActivityWidgetProps> = ({
  currentRole,
  currentUserRoleTitle,
  currentBranch,
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  const allEvents: ActivityEvent[] = [
    {
      id: 'act-1',
      timestamp: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
      timeAgo: 'Hace 3 min',
      title: 'Validación Médica Realizada',
      description: 'Firma digital aplicada en Orden Carlos Mendoza (TM-3109-PA).',
      category: 'VALIDATION',
      status: 'SUCCESS',
      actorName: 'Dra. María Elena Abrego',
      actorRole: 'Jefe de Lab',
      allowedRoles: ['owner', 'lab_chief', 'tech_med', 'ext_doctor', 'patient', 'abregotech_admin'],
      orderId: 'ORD-2026-8902',
      patientName: 'Carlos Mendoza'
    },
    {
      id: 'act-2',
      timestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
      timeAgo: 'Hace 12 min',
      title: 'Alerta de Pánico (Delta Check)',
      description: 'Glucosa 320 mg/dL en Analizador Mindray BS-480. Notificado a urgencias.',
      category: 'RESULT',
      status: 'CRITICAL',
      actorName: 'Mindray BS-480 Auto',
      actorRole: 'Middleware',
      allowedRoles: ['owner', 'lab_chief', 'tech_med', 'abregotech_admin'],
      orderId: 'ORD-2026-8905',
      patientName: 'Ana Lucía Gómez'
    },
    {
      id: 'act-3',
      timestamp: new Date(Date.now() - 24 * 60 * 1000).toISOString(),
      timeAgo: 'Hace 24 min',
      title: 'Factura POS #F-00918 Emitida',
      description: 'Cobro de B/. 45.00 procesado en caja (Perfil Lipídico).',
      category: 'BILLING',
      status: 'SUCCESS',
      actorName: 'Yaritza Ríos',
      actorRole: 'Recepción',
      allowedRoles: ['owner', 'receptionist', 'abregotech_admin'],
      orderId: 'ORD-2026-8905',
      patientName: 'Ana Lucía Gómez'
    },
    {
      id: 'act-4',
      timestamp: new Date(Date.now() - 38 * 60 * 1000).toISOString(),
      timeAgo: 'Hace 38 min',
      title: 'Muestras Recepcionadas',
      description: '3 tubos EDTA con código de barras ingresados en Sede ' + currentBranch.code + '.',
      category: 'ORDER',
      status: 'INFO',
      actorName: 'José Pérez',
      actorRole: 'Técnico Lab',
      allowedRoles: ['owner', 'lab_chief', 'tech_med', 'lab_tech', 'receptionist', 'abregotech_admin'],
      orderId: 'ORD-2026-8906',
      patientName: 'Roberto Icaza'
    },
    {
      id: 'act-5',
      timestamp: new Date(Date.now() - 52 * 60 * 1000).toISOString(),
      timeAgo: 'Hace 52 min',
      title: 'Control QC Sysmex Aprobado',
      description: 'Nivel 2 Hematología pasó reglas Westgard (dentro de 2SD).',
      category: 'QC',
      status: 'SUCCESS',
      actorName: 'Lic. Tomás Batista',
      actorRole: 'Tecnólogo Médico',
      allowedRoles: ['owner', 'lab_chief', 'tech_med', 'abregotech_admin'],
    },
    {
      id: 'act-6',
      timestamp: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
      timeAgo: 'Hace 1h 50m',
      title: 'Notificación MINSA Enviada',
      description: 'Caso Dengue NS1 notificado al portal EPI-MINSA.',
      category: 'MINSA',
      status: 'WARNING',
      actorName: 'LIS Auto-EPI',
      actorRole: 'FHIR Service',
      allowedRoles: ['owner', 'lab_chief', 'abregotech_admin'],
      orderId: 'ORD-2026-8899',
    }
  ];

  const rolePermittedEvents = allEvents.filter((ev) =>
    ev.allowedRoles.includes(currentRole)
  );

  const filteredEvents = rolePermittedEvents
    .filter((ev) => filterCategory === 'ALL' || ev.category === filterCategory)
    .slice(0, 5);

  const getStatusBadge = (status: ActivityEvent['status']) => {
    switch (status) {
      case 'CRITICAL':
        return { bg: 'bg-rose-500/20 text-rose-300 border-rose-500/30', icon: AlertTriangle, color: 'text-rose-400' };
      case 'WARNING':
        return { bg: 'bg-amber-500/20 text-amber-300 border-amber-500/30', icon: Clock, color: 'text-amber-400' };
      case 'SUCCESS':
        return { bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', icon: CheckCircle2, color: 'text-emerald-400' };
      default:
        return { bg: 'bg-teal-500/20 text-teal-300 border-teal-500/30', icon: Activity, color: 'text-teal-400' };
    }
  };

  const CATEGORY_NAMES: Record<string, string> = {
    ALL: 'Todos',
    VALIDATION: 'Validación',
    RESULT: 'Resultados',
    BILLING: 'Facturación',
    ORDER: 'Muestras',
    QC: 'Control Calidad',
    MINSA: 'EPI MINSA'
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-lg mb-6">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-black text-white">Actividad Reciente</h3>
              <span className="text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30 px-2 py-0.5 rounded-full">
                5 Eventos Recientes
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Eventos para <strong className="text-slate-200">{currentUserRoleTitle}</strong> en <span className="text-emerald-300 font-bold">{currentBranch.name}</span>
            </p>
          </div>
        </div>

        {/* Filter Chips */}
        <div className="flex items-center space-x-1 overflow-x-auto py-1">
          {['ALL', 'VALIDATION', 'RESULT', 'BILLING', 'ORDER', 'QC'].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                filterCategory === cat
                  ? 'bg-teal-500 text-slate-950 shadow'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {CATEGORY_NAMES[cat] || cat}
            </button>
          ))}
        </div>
      </div>

      {/* Visual Events List */}
      <div className="mt-3.5 space-y-2.5">
        {filteredEvents.length === 0 ? (
          <div className="p-4 text-center text-xs text-slate-400 bg-slate-950/60 rounded-2xl border border-slate-800">
            No hay actividades recientes en esta categoría.
          </div>
        ) : (
          filteredEvents.map((event) => {
            const statusConfig = getStatusBadge(event.status);
            const StatusIcon = statusConfig.icon;

            return (
              <div
                key={event.id}
                className="bg-slate-950/80 border border-slate-800/80 hover:border-slate-700 rounded-2xl p-3 transition flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div className={`w-9 h-9 rounded-xl ${statusConfig.bg} flex items-center justify-center shrink-0`}>
                    <StatusIcon className={`w-4 h-4 ${statusConfig.color}`} />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-xs text-white truncate group-hover:text-teal-300 transition-colors">
                        {event.title}
                      </span>
                      {event.orderId && (
                        <span className="text-[10px] font-mono bg-slate-800 text-teal-300 px-1.5 py-0.2 rounded shrink-0">
                          {event.orderId}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 truncate mt-0.5">
                      {event.description}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 text-right space-y-0.5 hidden sm:block">
                  <div className="text-[11px] font-bold text-slate-300">{event.actorName}</div>
                  <div className="text-[10px] text-slate-400 font-mono">{event.timeAgo}</div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
