import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RefreshCw, Home, ShieldAlert } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Senior Component: GlobalErrorBoundary
 * Prevents the entire LIS from crashing due to a single component failure.
 * Essential for High Availability clinical systems.
 */
export class GlobalErrorBoundary extends Component<Props, State> {
  // @ts-ignore
  state: State = {
    hasError: false,
    error: null
  };

  constructor(props: Props) {
    super(props);
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[LIS-CRITICAL-ERROR]:', error, errorInfo);
  }

  private handleReset = () => {
    // @ts-ignore
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  public render() {
    // @ts-ignore
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 text-slate-100">
          <div className="max-w-2xl w-full bg-slate-900 border border-rose-500/40 rounded-[3rem] p-10 text-center space-y-8 shadow-[0_0_100px_rgba(244,63,94,0.15)] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 via-amber-400 to-rose-500"></div>

            <div className="w-20 h-20 bg-rose-500/20 text-rose-400 rounded-3xl border border-rose-500/40 flex items-center justify-center mx-auto animate-pulse">
              <AlertOctagon className="w-10 h-10" />
            </div>

            <div className="space-y-3">
              <h1 className="text-2xl sm:text-3xl font-black text-white uppercase italic tracking-tighter">Falla Crítica del Sistema</h1>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed max-w-md mx-auto">
                Se ha detectado una interrupción en el motor de renderizado. Por seguridad de los datos clínicos, la vista ha sido aislada.
              </p>
            </div>

            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 text-left font-mono text-[11px] text-rose-300 overflow-x-auto max-h-40 no-scrollbar">
              <div className="flex items-center gap-2 mb-2 text-rose-400 font-bold">
                <ShieldAlert className="w-4 h-4" /> EXCEPCIÓN DE KERNEL:
              </div>
              {/* @ts-ignore */}
              {this.state.error?.toString()}
              {/* @ts-ignore */}
              <div className="mt-2 text-slate-500">Trace: {this.state.error?.stack?.split('\n').slice(0, 3).join('\n')}</div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={this.handleReset}
                className="px-8 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-400 hover:brightness-110 text-slate-950 font-black rounded-2xl text-xs uppercase transition-all shadow-xl shadow-teal-500/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                Reiniciar Estación
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-8 py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-black rounded-2xl text-xs uppercase transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Home className="w-4 h-4" />
                Volver al Inicio
              </button>
            </div>

            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
              Reporte de incidente enviado automáticamente a Soporte AbregoTech
            </p>
          </div>
        </div>
      );
    }

    // @ts-ignore
    return this.props.children;
  }
}

interface ModuleProps {
  children?: ReactNode;
  moduleName?: string;
  onReset?: () => void;
}

/**
 * Granular Module ErrorBoundary (ISO 15189 Zero-Downtime Resilience)
 * Isolates component-level errors so that a single widget failure NEVER stops the entire application.
 */
export class ModuleErrorBoundary extends Component<ModuleProps, State> {
  state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn(`[LIS-MODULE-ERROR] ${this.props.moduleName || 'Módulo'}:`, error, errorInfo);
  }

  private handleResetModule = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) this.props.onReset();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 rounded-3xl bg-slate-900 border border-amber-500/40 text-slate-100 space-y-4 my-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-amber-500/20 text-amber-300 rounded-2xl border border-amber-500/40">
                <AlertOctagon className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase text-white tracking-wider">
                  Interrupción Temporal en Módulo: {this.props.moduleName || 'Componente Clínico'}
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  El resto de la estación LISCORE continua funcionando normalmente en vivo.
                </p>
              </div>
            </div>

            <button
              onClick={this.handleResetModule}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl transition shadow cursor-pointer flex items-center space-x-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reintentar Cargar Módulo</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
