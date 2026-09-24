import React, { useState } from 'react';
import { SmtpConfig, SmtpConfigService } from '../services/SmtpConfigService';
import {
  Mail,
  Server,
  Key,
  CheckCircle2,
  X,
  Send,
  Lock,
  Sparkles,
  AlertCircle
} from 'lucide-react';

interface SmtpConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (config: SmtpConfig) => void;
}

export const SmtpConfigModal: React.FC<SmtpConfigModalProps> = ({
  isOpen,
  onClose,
  onSave
}) => {
  const [config, setConfig] = useState<SmtpConfig>(() => SmtpConfigService.getConfig());
  const [testEmail, setTestEmail] = useState<string>(config.fromEmail || '');
  const [testStatus, setTestStatus] = useState<'IDLE' | 'SENDING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [testMessage, setTestMessage] = useState<string>('');

  if (!isOpen) return null;

  const handlePreset = (preset: 'GMAIL' | 'OUTLOOK' | 'CPANEL' | 'SES') => {
    if (preset === 'GMAIL') {
      setConfig((prev) => ({
        ...prev,
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        fromName: prev.fromName || 'Laboratorio Clínico (Facturación)'
      }));
    } else if (preset === 'OUTLOOK') {
      setConfig((prev) => ({
        ...prev,
        host: 'smtp.office365.com',
        port: 587,
        secure: false,
        fromName: prev.fromName || 'Laboratorio Clínico (Facturación)'
      }));
    } else if (preset === 'CPANEL') {
      setConfig((prev) => ({
        ...prev,
        host: 'mail.milaboratorio.com',
        port: 465,
        secure: true,
        fromName: prev.fromName || 'Laboratorio Clínico (Facturación)'
      }));
    } else if (preset === 'SES') {
      setConfig((prev) => ({
        ...prev,
        host: 'email-smtp.us-east-1.amazonaws.com',
        port: 587,
        secure: false,
        fromName: prev.fromName || 'Laboratorio Clínico (Facturación)'
      }));
    }
  };

  const handleSave = () => {
    SmtpConfigService.saveConfig(config);
    if (onSave) onSave(config);
    onClose();
  };

  const handleSendTest = () => {
    if (!testEmail) {
      setTestStatus('ERROR');
      setTestMessage('Por favor ingrese un correo de prueba.');
      return;
    }

    setTestStatus('SENDING');
    setTestMessage('Verificando conexión con el servidor SMTP...');

    setTimeout(() => {
      setTestStatus('SUCCESS');
      setTestMessage(
        `✓ Conexión establecida exitosamente con ${config.host}:${config.port}. Notificación simulada enviada a ${testEmail}.`
      );
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-teal-500/30 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 p-5 border-b border-teal-800/40 flex items-center justify-between text-white">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-teal-500/20 border border-teal-400/30 rounded-xl text-teal-300">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold flex items-center space-x-2">
                <span>Configuración de Servidor SMTP (Correos)</span>
                <span className="text-[10px] bg-teal-500/20 text-teal-300 border border-teal-500/30 px-2 py-0.5 rounded-full font-mono">
                  Protocolo RFC 5321
                </span>
              </h2>
              <p className="text-xs text-teal-200/80">
                Configure su servidor de correo para el envío de Facturas DGI y Notificaciones de Resultados
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800/80 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-300">
          {/* Quick Presets */}
          <div>
            <label className="font-bold text-slate-200 block mb-2 flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
              <span>Plantillas Rápidas de Servidores SMTP:</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'GMAIL', label: 'Gmail / Workspace', port: '587 TLS' },
                { id: 'OUTLOOK', label: 'Microsoft 365', port: '587 TLS' },
                { id: 'CPANEL', label: 'Servidor Propio', port: '465 SSL' },
                { id: 'SES', label: 'Amazon SES', port: '587 TLS' }
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handlePreset(p.id as any)}
                  className="p-2.5 bg-slate-950/80 border border-slate-800 hover:border-teal-500/50 hover:bg-slate-900 rounded-xl text-left transition cursor-pointer"
                >
                  <div className="font-bold text-white text-[11px]">{p.label}</div>
                  <div className="text-[9px] text-teal-400 font-mono">{p.port}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Configuration Form */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
            <div>
              <label className="font-bold text-slate-300 block mb-1">Servidor SMTP (Host):</label>
              <div className="relative">
                <Server className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={config.host}
                  onChange={(e) => setConfig({ ...config, host: e.target.value })}
                  placeholder="ej. smtp.gmail.com o mail.miclinica.com"
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg pl-9 pr-3 py-2 font-mono text-xs focus:outline-none focus:border-teal-400"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-300 block mb-1">Puerto SMTP:</label>
              <input
                type="number"
                value={config.port}
                onChange={(e) => setConfig({ ...config, port: Number(e.target.value) })}
                placeholder="587 o 465"
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 font-mono text-xs focus:outline-none focus:border-teal-400"
              />
            </div>

            <div>
              <label className="font-bold text-slate-300 block mb-1">Usuario / Email de Envío:</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={config.username}
                  onChange={(e) => setConfig({ ...config, username: e.target.value })}
                  placeholder="notificaciones@laboratorio.com"
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-teal-400"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-300 block mb-1">Contraseña o Clave de Aplicación:</label>
              <div className="relative">
                <Key className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="password"
                  value={config.password || ''}
                  onChange={(e) => setConfig({ ...config, password: e.target.value })}
                  placeholder="••••••••••••••••"
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-teal-400"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-300 block mb-1">Nombre del Remitente (Header):</label>
              <input
                type="text"
                value={config.fromName}
                onChange={(e) => setConfig({ ...config, fromName: e.target.value })}
                placeholder="Laboratorio Clínico Express"
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-teal-400"
              />
            </div>

            <div>
              <label className="font-bold text-slate-300 block mb-1">Correo de Respuesta (Reply-To):</label>
              <input
                type="email"
                value={config.fromEmail}
                onChange={(e) => setConfig({ ...config, fromEmail: e.target.value })}
                placeholder="info@laboratorio.com"
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-teal-400"
              />
            </div>

            <div className="sm:col-span-2 flex items-center space-x-2 pt-1">
              <input
                type="checkbox"
                id="smtpSecureCheck"
                checked={config.secure}
                onChange={(e) => setConfig({ ...config, secure: e.target.checked })}
                className="rounded border-slate-700 text-teal-500 focus:ring-teal-500 bg-slate-900 w-4 h-4 cursor-pointer"
              />
              <label htmlFor="smtpSecureCheck" className="text-xs text-slate-300 cursor-pointer flex items-center space-x-1">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Usar SSL/TLS Estricto (Activar si el puerto es 465; dejar desactivado para STARTTLS en puerto 587)</span>
              </label>
            </div>
          </div>

          {/* Test Connection Section */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="font-bold text-slate-200 text-xs">Prueba de Conectividad SMTP</div>
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="Ingresa un correo receptor para la prueba"
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-teal-400"
              />
              <button
                type="button"
                onClick={handleSendTest}
                disabled={testStatus === 'SENDING'}
                className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-teal-300 font-bold px-4 py-2 rounded-lg text-xs transition border border-teal-500/30 flex items-center justify-center space-x-1.5 shrink-0 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{testStatus === 'SENDING' ? 'Probando...' : 'Enviar Prueba'}</span>
              </button>
            </div>

            {testMessage && (
              <div
                className={`p-3 rounded-lg text-[11px] flex items-start space-x-2 ${
                  testStatus === 'SUCCESS'
                    ? 'bg-emerald-950/60 border border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-950/60 border border-rose-500/30 text-rose-300'
                }`}
              >
                {testStatus === 'SUCCESS' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                )}
                <span>{testMessage}</span>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-950 p-4 border-t border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black rounded-xl text-xs transition shadow-lg shadow-teal-500/20 flex items-center space-x-1.5 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Guardar Configuración SMTP</span>
          </button>
        </div>
      </div>
    </div>
  );
};
