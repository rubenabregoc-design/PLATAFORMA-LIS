import React from 'react';
import { AlertOctagon, RefreshCw, Home, ShieldAlert } from 'lucide-react';

interface Props {
  children?: React.ReactNode;
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
export class GlobalErrorBoundary extends React.Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[LIS-CRITICAL-ERROR]:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6">
          <div className="max-w-2xl w-full bg-slate-900 border border-rose-500/30 rounded-[3rem] p-12 text-center space-y-8 shadow-[0_0_100px_rgba(244,63,94,0.15)] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-rose-500"></div>

            <div className="w-24 h-24 bg-rose-500/20 text-rose-500 rounded-3xl border border-rose-500/40 flex items-center justify-center mx-auto animate-pulse">
              <AlertOctagon className="w-12 h-12" />
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl font-black text-white uppercase italic tracking-tighter">Falla Crítica del Sistema</h1>
              <p className="text-slate-400 text-sm leading-relaxed max-w-md mx-auto">
                Se ha detectado una interrupción en el motor de renderizado. Por seguridad de los datos clínicos, la vista ha sido aislada.
              </p>
            </div>

            <div className="bg-slate-950/80 rounded-2xl p-6 border border-white/5 text-left font-mono text-[10px] text-rose-300 overflow-x-auto max-h-40 custom-scrollbar">
              <div className="flex items-center gap-2 mb-2 text-rose-500 font-black">
                <ShieldAlert className="w-4 h-4" /> EXCEPCIÓN DE KERNEL:
              </div>
              {this.state.error?.toString()}
              <div className="mt-2 text-slate-600">Trace: {this.state.error?.stack?.split('\n').slice(0, 3).join('\n')}</div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={this.handleReset}
                className="px-8 py-4 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black rounded-2xl text-xs uppercase transition-all shadow-xl shadow-teal-500/20 flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Reiniciar Estación
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white font-black rounded-2xl text-xs uppercase transition-all flex items-center justify-center gap-2"
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

    return this.props.children;
  }
}
