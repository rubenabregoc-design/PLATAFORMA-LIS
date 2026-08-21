import React, { useState } from 'react';
import {
  Flame,
  CheckSquare,
  Activity,
  AlertOctagon,
  Microscope,
  FlaskConical,
  Sparkles,
  LayoutDashboard
} from 'lucide-react';
import { StatPendingQueue } from './StatPendingQueue';
import { AnalyticalValidationWorkstation } from './AnalyticalValidationWorkstation';
import { InternalQualityControlQC } from './InternalQualityControlQC';
import { CriticalPanicManagement } from './CriticalPanicManagement';
import { SpecializedLaboratorySections } from './SpecializedLaboratorySections';
import { ReagentsHilPreanalytics } from './ReagentsHilPreanalytics';

export const TechnologistMasterSuite: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'stat_queue' | 'validation' | 'qc' | 'critical' | 'sections' | 'reagents'>('stat_queue');

  const tabs = [
    {
      id: 'stat_queue' as const,
      label: 'Cola de Pendientes STAT & Validación Rápida',
      shortLabel: '🚨 Cola STAT & Rápida',
      icon: Flame,
      badge: 'Prioridad Urgente'
    },
    {
      id: 'validation' as const,
      label: 'Validación Analítica & Delta Check',
      shortLabel: '1. Validación & Delta',
      icon: CheckSquare,
      badge: '6 Calc Clínicas'
    },
    {
      id: 'qc' as const,
      label: 'Control de Calidad (QC) & Westgard',
      shortLabel: '2. QC & Westgard',
      icon: Activity,
      badge: 'Levey-Jennings'
    },
    {
      id: 'critical' as const,
      label: 'Valores Críticos & Read-Back',
      shortLabel: '3. Valores Críticos',
      icon: AlertOctagon,
      badge: 'SLA 15min'
    },
    {
      id: 'sections' as const,
      label: 'Módulos Especializados',
      shortLabel: '4. Hema / Micro / Orina',
      icon: Microscope,
      badge: 'Contador + CLSI'
    },
    {
      id: 'reagents' as const,
      label: 'Reactivos & Índices HIL',
      shortLabel: '5. Reactivos & HIL',
      icon: FlaskConical,
      badge: 'Preanalítica'
    }
  ];

  return (
    <div className="space-y-6" id="technologist-master-suite">
      {/* Top Main Navigation Bar for the Modules */}
      <div className="bg-slate-900/95 border border-slate-800/90 rounded-3xl p-3 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-thin">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 rounded-2xl transition-all duration-300 flex items-center space-x-3 shrink-0 cursor-pointer text-left border ${
                  isActive
                    ? 'bg-gradient-to-r from-teal-500/20 to-emerald-500/10 border-teal-400 text-white shadow-lg shadow-teal-500/10'
                    : 'bg-slate-950/50 border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <div className={`p-2 rounded-xl transition ${
                  isActive ? 'bg-teal-500 text-slate-950 font-black' : 'bg-slate-900 text-slate-400'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-black tracking-wide flex items-center space-x-2">
                    <span>{tab.shortLabel}</span>
                  </div>
                  <span className="text-[10px] text-teal-300/80 font-mono">
                    {tab.badge}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Render Active Sub-Suite */}
      <div className="transition-all duration-300">
        {activeTab === 'stat_queue' && <StatPendingQueue />}
        {activeTab === 'validation' && <AnalyticalValidationWorkstation />}
        {activeTab === 'qc' && <InternalQualityControlQC />}
        {activeTab === 'critical' && <CriticalPanicManagement />}
        {activeTab === 'sections' && <SpecializedLaboratorySections />}
        {activeTab === 'reagents' && <ReagentsHilPreanalytics />}
      </div>
    </div>
  );
};
