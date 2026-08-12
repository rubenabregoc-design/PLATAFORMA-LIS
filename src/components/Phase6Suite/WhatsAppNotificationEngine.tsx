import React, { useState } from 'react';
import {
  MessageSquare,
  Send,
  Smartphone,
  Bell,
  CheckCircle2,
  AlertTriangle,
  Clock,
  CheckCheck,
  ShieldAlert,
  Search,
  Filter,
  RefreshCw,
  Sparkles,
  FileText,
  User,
  Plus
} from 'lucide-react';

export interface NotificationLog {
  id: string;
  recipientName: string;
  recipientPhone: string;
  recipientType: 'PACIENTE' | 'MEDICO_TRATANTE';
  orderNumber: string;
  type: 'RESULTADO_LISTO' | 'VALOR_CRITICO_PANICO' | 'RECORDATORIO_CITA';
  channel: 'WHATSAPP' | 'SMS';
  messageSnippet: string;
  sentAt: string;
  status: 'ENVIADO' | 'ENTREGADO' | 'LEIDO' | 'FALLIDO';
  securityToken: string;
}

const INITIAL_NOTIF_LOGS: NotificationLog[] = [
  {
    id: 'not-301',
    recipientName: 'Sr. Fernando Abrego',
    recipientPhone: '+507 6612-9988',
    recipientType: 'PACIENTE',
    orderNumber: 'ORD-2026-9041',
    type: 'RESULTADO_LISTO',
    channel: 'WHATSAPP',
    messageSnippet: 'Estimado Sr. Fernando Abrego, sus resultados de Laboratorio LIS Core (ORD-2026-9041) ya están disponibles en su portal paciente.',
    sentAt: '2026-08-12 07:45 AM',
    status: 'LEIDO',
    securityToken: 'TOKEN-9912'
  },
  {
    id: 'not-302',
    recipientName: 'Dr. Roberto Guardia (Médico)',
    recipientPhone: '+507 6230-1100',
    recipientType: 'MEDICO_TRATANTE',
    orderNumber: 'ORD-2026-9042',
    type: 'VALOR_CRITICO_PANICO',
    channel: 'WHATSAPP',
    messageSnippet: '⚠️ ALERTA MÉDICA URGENTE: El paciente Luis Castillo presenta Potasio K+ de 6.8 mEq/L (Valor de Pánico) en Orden ORD-2026-9042.',
    sentAt: '2026-08-12 08:01 AM',
    status: 'ENTREGADO',
    securityToken: 'STAT-8812'
  },
  {
    id: 'not-303',
    recipientName: 'Lic. Ana Lucía Morales',
    recipientPhone: '+507 6554-3322',
    recipientType: 'PACIENTE',
    orderNumber: 'ORD-2026-9038',
    type: 'RESULTADO_LISTO',
    channel: 'SMS',
    messageSnippet: 'LIS Core: Sus exámenes de laboratorio están listos. Descargue su PDF con el PIN: 4091 en https://lis.app/p/4091',
    sentAt: '2026-08-11 05:20 PM',
    status: 'ENTREGADO',
    securityToken: 'PIN-4091'
  }
];

export const WhatsAppNotificationEngine: React.FC = () => {
  const [logs, setLogs] = useState<NotificationLog[]>(INITIAL_NOTIF_LOGS);
  const [selectedChannel, setSelectedChannel] = useState<string>('TODOS');
  const [selectedType, setSelectedType] = useState<string>('TODOS');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Simulated Send Test State
  const [testPhone, setTestPhone] = useState<string>('+507 6612-9988');
  const [testPatient, setTestPatient] = useState<string>('Sra. Elena de Icaza');
  const [testType, setTestType] = useState<'RESULTADO_LISTO' | 'VALOR_CRITICO_PANICO'>('RESULTADO_LISTO');

  const filteredLogs = logs.filter(l => {
    if (selectedChannel !== 'TODOS' && l.channel !== selectedChannel) return false;
    if (selectedType !== 'TODOS' && l.type !== selectedType) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return l.recipientName.toLowerCase().includes(term) || l.orderNumber.toLowerCase().includes(term);
    }
    return true;
  });

  const handleSendTestNotification = (e: React.FormEvent) => {
    e.preventDefault();
    const isPanic = testType === 'VALOR_CRITICO_PANICO';
    const newLog: NotificationLog = {
      id: `not-${Date.now()}`,
      recipientName: testPatient,
      recipientPhone: testPhone,
      recipientType: isPanic ? 'MEDICO_TRATANTE' : 'PACIENTE',
      orderNumber: `ORD-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      type: testType,
      channel: 'WHATSAPP',
      messageSnippet: isPanic
        ? `⚠️ ALERTA MÉDICA LIS: ${testPatient} presenta valor crítico. Notificación prioritaria enviada a WhatsApp.`
        : `Estimado(a) ${testPatient}, sus resultados de laboratorio LIS Core ya han sido validados por la Jefatura Médica.`,
      sentAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'ENTREGADO',
      securityToken: `TOK-${Math.floor(1000 + Math.random() * 9000)}`
    };

    setLogs(prev => [newLog, ...prev]);
    alert(`¡Notificación simulada de WhatsApp enviada con éxito a ${testPhone}!`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-950 border border-emerald-500/30 p-6 sm:p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden backdrop-blur-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="text-emerald-400 text-xs font-black uppercase tracking-[0.2em] mb-2 flex items-center space-x-2">
              <MessageSquare className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span>Motor de Notificaciones Automáticas por WhatsApp Business & SMS</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Avisos de Resultados & Alertas Críticas por WhatsApp
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-2 max-w-2xl leading-relaxed">
              Envío inmediato de notificaciones al momento de la validación médica final, enlaces con token temporal cifrado y transmisión prioritaria de valores de pánico al médico tratante.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono text-xs font-bold px-4 py-2.5 rounded-2xl flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span>API WhatsApp Business: CONECTADA</span>
            </span>
          </div>
        </div>

        {/* Counter KPI Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-white/10">
          <div className="bg-slate-950/60 border border-white/5 p-4 rounded-2xl space-y-1">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Mensajes Enviados Hoy</div>
            <div className="text-2xl font-black font-mono text-white">{logs.length} Notificaciones</div>
            <div className="text-[10px] text-teal-400 font-bold">100% Entregados</div>
          </div>

          <div className="bg-slate-950/60 border border-white/5 p-4 rounded-2xl space-y-1">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Lecturas Confirmadas</div>
            <div className="text-2xl font-black font-mono text-emerald-400">
              {logs.filter(l => l.status === 'LEIDO').length} Confirmaciones
            </div>
            <div className="text-[10px] text-emerald-400 font-bold">Doble Check Azul</div>
          </div>

          <div className="bg-slate-950/60 border border-white/5 p-4 rounded-2xl space-y-1">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Alertas de Pánico Enviadas</div>
            <div className="text-2xl font-black font-mono text-rose-400">
              {logs.filter(l => l.type === 'VALOR_CRITICO_PANICO').length} Alertas Médicas
            </div>
            <div className="text-[10px] text-rose-400 font-bold">Tiempo Promedio: 1.2s</div>
          </div>

          <div className="bg-slate-950/60 border border-white/5 p-4 rounded-2xl space-y-1">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tasa de Apertura PDF</div>
            <div className="text-2xl font-black font-mono text-indigo-300">94.8%</div>
            <div className="text-[10px] text-indigo-400 font-bold">Descarga Directa en Móvil</div>
          </div>
        </div>
      </div>

      {/* Main Grid: Send Test & Logs Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Test Message Dispatcher */}
        <div className="lg:col-span-1 bg-slate-900/90 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4">
          <h3 className="font-bold text-white text-sm flex items-center space-x-2">
            <Smartphone className="w-4 h-4 text-emerald-400" />
            <span>Simulador de Envío por WhatsApp</span>
          </h3>

          <form onSubmit={handleSendTestNotification} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-300 block mb-1">Nombre Destinatario:</label>
              <input
                type="text"
                value={testPatient}
                onChange={(e) => setTestPatient(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                required
              />
            </div>

            <div>
              <label className="font-bold text-slate-300 block mb-1">Número WhatsApp (+507):</label>
              <input
                type="text"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
                required
              />
            </div>

            <div>
              <label className="font-bold text-slate-300 block mb-1">Tipo de Notificación:</label>
              <select
                value={testType}
                onChange={(e) => setTestType(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-bold"
              >
                <option value="RESULTADO_LISTO">Resultado de Exámenes Listo (Paciente)</option>
                <option value="VALOR_CRITICO_PANICO">Alerta de Valor Crítico (Médico Tratante)</option>
              </select>
            </div>

            <div className="bg-emerald-950/20 border border-emerald-500/30 p-3 rounded-2xl space-y-1">
              <div className="text-[10px] text-emerald-400 font-bold uppercase">Vista Previa de Plantilla:</div>
              <p className="text-[11px] text-slate-300 italic">
                {testType === 'RESULTADO_LISTO'
                  ? `Hola ${testPatient}, sus exámenes de laboratorio LIS Core ya están disponibles para descargar.`
                  : `⚠️ ALERTA MÉDICA URGENTE LIS Core: El paciente ${testPatient} presenta resultado en rango crítico.`}
              </p>
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3 rounded-2xl transition shadow-lg flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Enviar WhatsApp de Prueba</span>
            </button>
          </form>
        </div>

        {/* Logs Table */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="font-bold text-white text-base flex items-center space-x-2">
              <Bell className="w-5 h-5 text-emerald-400" />
              <span>Bitácora de Envíos WhatsApp & SMS en Tiempo Real</span>
            </h3>

            <div className="flex items-center space-x-2">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-xs font-bold text-slate-200 rounded-xl px-3 py-1.5"
              >
                <option value="TODOS">Todos los Tipos</option>
                <option value="RESULTADO_LISTO">Resultado Listo</option>
                <option value="VALOR_CRITICO_PANICO">Valor Crítico</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 text-[10px] font-black uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3">Destinatario / Teléfono</th>
                  <th className="p-3">Orden / Tipo</th>
                  <th className="p-3">Mensaje Transmitido</th>
                  <th className="p-3 text-center">Hora</th>
                  <th className="p-3 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-3">
                      <div className="font-bold text-white">{log.recipientName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{log.recipientPhone}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-mono text-teal-300 font-extrabold">{log.orderNumber}</div>
                      <span className={`text-[9px] font-bold ${
                        log.type === 'VALOR_CRITICO_PANICO' ? 'text-rose-400' : 'text-emerald-400'
                      }`}>
                        {log.type}
                      </span>
                    </td>
                    <td className="p-3 max-w-xs">
                      <div className="text-slate-300 text-[11px] truncate">{log.messageSnippet}</div>
                      <div className="text-[9px] text-slate-500 font-mono">Token: {log.securityToken}</div>
                    </td>
                    <td className="p-3 text-center font-mono text-slate-400">
                      {log.sentAt}
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border flex items-center justify-center space-x-1 ${
                        log.status === 'LEIDO'
                          ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                          : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                      }`}>
                        <CheckCheck className="w-3 h-3" />
                        <span>{log.status}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
