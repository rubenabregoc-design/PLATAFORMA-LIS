import React from 'react';
import { CheckCircle2, Clock, Beaker, Zap, Activity } from 'lucide-react';

export interface TimelineStep {
  id: string;
  label: string;
  time: string;
  status: 'completed' | 'current' | 'pending';
  icon: any;
}

interface SampleTimelineProps {
  steps: TimelineStep[];
}

export const SampleTimeline: React.FC<SampleTimelineProps> = ({ steps }) => {
  return (
    <div className="flex items-center justify-between w-full max-w-lg mx-auto relative px-4">
      {/* Background Line */}
      <div className="absolute top-1/2 left-10 right-10 h-0.5 bg-slate-800 -translate-y-1/2 z-0"></div>

      {steps.map((step, i) => {
        const Icon = step.icon;
        const isActive = step.status === 'completed' || step.status === 'current';
        const isCurrent = step.status === 'current';

        return (
          <div key={step.id} className="relative z-10 flex flex-col items-center group">
            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${
              step.status === 'completed' ? 'bg-emerald-500 border-emerald-500 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.3)]' :
              step.status === 'current' ? 'bg-slate-900 border-teal-500 text-teal-400 animate-pulse ring-4 ring-teal-500/10' :
              'bg-slate-950 border-slate-800 text-slate-600'
            }`}>
              {step.status === 'completed' ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
            </div>

            <div className="absolute top-10 flex flex-col items-center min-w-[80px]">
               <span className={`text-[8px] font-black uppercase tracking-widest text-center ${isActive ? 'text-white' : 'text-slate-600'}`}>
                 {step.label}
               </span>
               <span className="text-[7px] font-mono text-slate-500 mt-0.5">{step.time}</span>
            </div>

            {/* Connecting progress line */}
            {i < steps.length - 1 && step.status === 'completed' && (
              <div className="absolute top-4 left-8 w-[calc(100%+24px)] h-0.5 bg-emerald-500 z-[-1]"></div>
            )}
          </div>
        );
      })}

      {/* Stability Warning Float */}
      <div className="absolute -top-12 right-4 flex items-center space-x-2 bg-slate-900 border border-white/10 px-3 py-1.5 rounded-full shadow-2xl">
         <div className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></div>
         <span className="text-[8px] font-black uppercase text-slate-400 tracking-tighter">Estabilidad Crítica detectada en Glucosa</span>
      </div>
    </div>
  );
};
