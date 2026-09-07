import React, { useState } from 'react';
import GrowthChartPortal from './GrowthChartPortal';
import {
  Dna,
  FileDown,
  ShieldCheck,
  Lock,
  User,
  Calendar,
  ArrowRight,
  Download,
  Activity,
  CheckCircle2,
  X,
  MessageSquare,
  Send,
  Heart,
  Baby
} from 'lucide-react';
import { SupabaseService } from '../../services/SupabaseService';

const PatientPortalView: React.FC = () => {
  const [code, setCode] = useState('');
  const [order, setOrder] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackData, setFeedbackData] = useState({
    type: 'SUGGESTION' as any,
    category: 'TECHNICAL' as any,
    subject: '',
    message: ''
  });
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [showGrowthChart, setShowGrowthChart] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await SupabaseService.patientPortal.getResultsByCode(code);
      setOrder(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const submitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await SupabaseService.feedback.submitFeedback({
        tenant_id: order.tenant_id,
        patient_id: order.patient_id,
        order_id: order.id,
        type: feedbackData.type,
        category: feedbackData.category,
        subject: feedbackData.subject,
        message: feedbackData.message,
        status: 'PENDING',
        resolution_notes: null
      });
      setFeedbackSent(true);
      setTimeout(() => { setShowFeedback(false); setFeedbackSent(false); }, 3000);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  if (order) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans p-4 md:p-12">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-slate-900 text-white rounded-2xl shadow-xl">
                <Dna size={24} />
              </div>
              <h1 className="text-2xl font-black text-slate-800 tracking-tight">Portal de Resultados</h1>
            </div>
            <button onClick={() => setOrder(null)} className="text-slate-400 hover:text-slate-600 font-black text-xs uppercase tracking-widest">Cerrar Sesión</button>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 pb-8 mb-8">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Orden N°</p>
                <h2 className="text-3xl font-black text-slate-800">{order.order_number}</h2>
                <div className="flex items-center gap-2 text-slate-500 text-sm font-medium pt-2">
                  <Calendar size={16} />
                  <span>Realizado el: {new Date(order.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              <button className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-sm flex items-center gap-3 hover:bg-slate-800 transition-all shadow-xl shadow-slate-200">
                <FileDown size={20} />
                DESCARGAR RESULTADO (PDF)
              </button>
            </div>

            <div className="space-y-4">
              <h3 className="font-black text-slate-800 text-xs uppercase tracking-widest px-1">Resumen de Pruebas Procesadas</h3>
              <div className="grid grid-cols-1 gap-3">
                {order.test_results?.map((res: any) => (
                  <div key={res.id} className="p-5 rounded-2xl border border-slate-100 bg-slate-50 flex items-center justify-between group hover:border-teal-400 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-white text-teal-600 rounded-xl shadow-sm"><Activity size={20} /></div>
                      <div>
                        <p className="font-black text-slate-800 text-sm">{res.parameter_name}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">{res.test_code}</p>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-4">
                      <div>
                        <p className="font-black text-lg text-slate-900">{res.value} <span className="text-[10px] text-slate-400 font-normal">{res.unit}</span></p>
                        <p className="text-[10px] text-emerald-500 font-black uppercase">Validado</p>
                      </div>
                      <CheckCircle2 className="text-emerald-500" size={20} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-blue-600 rounded-[2rem] p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-blue-500/20">
            <div className="text-center md:text-left">
              <h4 className="text-xl font-black">¿Necesita ayuda con sus resultados?</h4>
              <p className="text-blue-100 text-xs mt-2 font-medium">Contamos con asesoría técnica disponible para explicar sus valores.</p>
            </div>
            <button className="bg-white text-blue-600 px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg">Contactar Soporte</button>
          </div>

          <div className="flex justify-center pt-8 gap-8">
            <button
              onClick={() => setShowGrowthChart(true)}
              className="flex items-center gap-2 text-teal-600 hover:text-teal-700 text-xs font-black uppercase tracking-widest transition-colors"
            >
              <Baby size={16} />
              Curva de Crecimiento
            </button>
            <button
              onClick={() => setShowFeedback(true)}
              className="flex items-center gap-2 text-slate-400 hover:text-slate-600 text-xs font-black uppercase tracking-widest transition-colors"
            >
              <MessageSquare size={16} />
              Enviar Queja o Sugerencia
            </button>
          </div>
        </div>

        {/* Growth Chart Modal */}
        {showGrowthChart && (
          <GrowthChartPortal
            patient={{...order.patients, dob: order.patients.dob}}
            onClose={() => setShowGrowthChart(false)}
          />
        )}

        {/* Feedback Modal */}
        {showFeedback && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
            <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-lg w-full overflow-hidden flex flex-col">
              <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <Heart className="text-rose-400" size={24} />
                  <h3 className="text-lg font-black tracking-tight">Su opinión es vital</h3>
                </div>
                <button onClick={() => setShowFeedback(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={24} /></button>
              </div>

              <div className="p-8">
                {feedbackSent ? (
                  <div className="text-center py-12 space-y-4">
                    <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-xl">
                      <CheckCircle2 size={40} />
                    </div>
                    <h4 className="text-xl font-black text-slate-800">¡Gracias por su mensaje!</h4>
                    <p className="text-slate-500 text-sm font-medium leading-relaxed">Su retroalimentación ha sido registrada bajo los protocolos de calidad ISO 15189.</p>
                  </div>
                ) : (
                  <form onSubmit={submitFeedback} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Tipo</label>
                        <select
                          value={feedbackData.type}
                          onChange={e => setFeedbackData({...feedbackData, type: e.target.value as any})}
                          className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold"
                        >
                          <option value="SUGGESTION">Sugerencia</option>
                          <option value="COMPLAINT">Queja</option>
                          <option value="INQUIRY">Inquietud</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Categoría</label>
                        <select
                          value={feedbackData.category}
                          onChange={e => setFeedbackData({...feedbackData, category: e.target.value as any})}
                          className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold"
                        >
                          <option value="TECHNICAL">Resultados / Técnicos</option>
                          <option value="ATTENTION">Atención / Trato</option>
                          <option value="TAT">Tiempo de Espera</option>
                          <option value="BILLING">Facturación</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Asunto</label>
                      <input
                        type="text"
                        required
                        value={feedbackData.subject}
                        onChange={e => setFeedbackData({...feedbackData, subject: e.target.value})}
                        className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Mensaje Detallado</label>
                      <textarea
                        required
                        value={feedbackData.message}
                        onChange={e => setFeedbackData({...feedbackData, message: e.target.value})}
                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold min-h-[120px]"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl disabled:opacity-50 flex items-center justify-center gap-3"
                    >
                      <Send size={18} />
                      {loading ? 'ENVIANDO...' : 'ENVIAR MENSAJE'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full">
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-slate-900 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-2xl rotate-3">
            <Dna className="text-white" size={40} />
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-2">PLATAFORMA-LIS</h1>
          <p className="text-slate-500 font-bold text-sm uppercase tracking-widest">Portal Seguro de Pacientes</p>
        </div>

        <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-slate-100 relative overflow-hidden">
          <form onSubmit={handleLogin} className="space-y-6 relative z-10">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Código de Acceso (6 Caracteres)</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="X7A2B9"
                  maxLength={6}
                  className="w-full p-5 pl-12 bg-slate-50 border-2 border-slate-100 rounded-3xl text-2xl font-black tracking-[0.5em] text-slate-800 placeholder:opacity-30 focus:outline-none focus:border-slate-900 transition-all uppercase"
                />
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-xs font-bold animate-shake">
                <X size={18} />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={code.length < 6 || loading}
              className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black text-sm uppercase tracking-widest hover:bg-slate-800 transition-all shadow-2xl shadow-slate-200 flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loading ? 'VERIFICANDO...' : (
                <>
                  <span>Consultar Resultados</span>
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          {/* Background decoration */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-slate-50 rounded-full"></div>
        </div>

        <div className="mt-12 text-center space-y-6">
          <div className="flex items-center justify-center gap-6">
            <div className="flex items-center gap-2 text-slate-400">
              <ShieldCheck size={16} />
              <span className="text-[10px] font-black uppercase">AES-256 Encrypted</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <User size={16} />
              <span className="text-[10px] font-black uppercase">Identity Verified</span>
            </div>
          </div>
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
            Este portal cumple con los estándares internacionales de seguridad de datos de salud y la Ley 81 de Panamá.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PatientPortalView;
