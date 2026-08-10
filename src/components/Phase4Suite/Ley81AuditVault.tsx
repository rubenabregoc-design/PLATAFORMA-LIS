import React, { useState } from 'react';
import { Tenant, Branch } from '../../types';
import {
  ShieldCheck,
  Lock,
  Search,
  Download,
  FileCheck2,
  Key,
  UserCheck,
  History,
  ShieldAlert,
  Hash,
  Database
} from 'lucide-react';

interface Ley81AuditVaultProps {
  tenant: Tenant;
  branch: Branch;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: string;
  actionType: 'CONSULTA_RESULTADO' | 'VALIDACION_TECNICA' | 'VALIDACION_MEDICA' | 'MODIFICACION_CONSENTIMIENTO' | 'EXPORTACION_PDF' | 'CAMBIO_TARIFARIO';
  patientId: string;
  patientNationalId: string;
  ipAddress: string;
  sha256Hash: string;
  details: string;
}

export const Ley81AuditVault: React.FC<Ley81AuditVaultProps> = ({ tenant, branch }) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [actionFilter, setActionFilter] = useState<string>('ALL');

  const [logs, setLogs] = useState<AuditLogEntry[]>([
    {
      id: 'aud-001',
      timestamp: '10/08/2026 11:20:14',
      userId: 'usr-3109',
      userName: 'Lic. Sofía Guardia',
      userRole: 'Tecnólogo Médico',
      actionType: 'VALIDACION_TECNICA',
      patientId: 'pat-1',
      patientNationalId: '8-812-4432',
      ipAddress: '192.168.1.104',
      sha256Hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      details: 'Validación técnica de parámetros Hemograma Completo y firma digital técnica.'
    },
    {
      id: 'aud-002',
      timestamp: '10/08/2026 11:05:40',
      userId: 'usr-10492',
      userName: 'Dr. Roberto Icaza',
      userRole: 'Médico Referente',
      actionType: 'CONSULTA_RESULTADO',
      patientId: 'pat-1',
      patientNationalId: '8-812-4432',
      ipAddress: '200.46.88.12',
      sha256Hash: 'ca978112ca1bbdcafac231b39a23dac4059104828da31e1136b6cb6d4128f731',
      details: 'Visualización de informe PDF de laboratorio desde Portal Médico Externo.'
    },
    {
      id: 'aud-003',
      timestamp: '10/08/2026 10:48:22',
      userId: 'usr-8812',
      userName: 'María Elena González',
      userRole: 'Paciente',
      actionType: 'MODIFICACION_CONSENTIMIENTO',
      patientId: 'pat-1',
      patientNationalId: '8-812-4432',
      ipAddress: '186.15.201.44',
      sha256Hash: '3f786850e387550fdab836ed7e6dc881de23001b51867b3a751e10861a69fd80',
      details: 'Otorgamiento de consentimiento informado Ley 81 para intercambio de datos clínicos.'
    },
    {
      id: 'aud-004',
      timestamp: '10/08/2026 10:15:00',
      userId: 'usr-9901',
      userName: 'Dr. Fernando Guardia',
      userRole: 'Jefe de Laboratorio',
      actionType: 'VALIDACION_MEDICA',
      patientId: 'pat-2',
      patientNationalId: '8-765-4321',
      ipAddress: '192.168.1.102',
      sha256Hash: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
      details: 'Validación médica definitiva y liberación de informe para entrega inmediata.'
    }
  ]);

  const filteredLogs = logs.filter((l) => {
    const matchesSearch =
      l.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.patientNationalId.includes(searchTerm) ||
      l.details.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction = actionFilter === 'ALL' || l.actionType === actionFilter;
    return matchesSearch && matchesAction;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white p-6 rounded-2xl shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="text-teal-400 text-xs font-bold uppercase tracking-wider mb-1 flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-teal-400" />
            <span>Fase 4 — Bóveda de Auditoría Imputable (Ley 81 de Protección de Datos Personales & ANTAI)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black">
            Cryptographic Audit Trail Ledger SHA-256
          </h1>
          <p className="text-slate-300 text-sm mt-1 max-w-xl">
            Registro encadenado inalterable de cada acceso, modificación, validación y consulta a expedientes clínicos en Panamá.
          </p>
        </div>

        <div className="bg-slate-900/90 border border-teal-500/40 p-4 rounded-xl text-xs space-y-1">
          <div className="text-teal-300 font-bold flex items-center space-x-1">
            <Lock className="w-4 h-4 text-emerald-400" />
            <span>Firmas SHA-256 Imputables: OK</span>
          </div>
          <div className="text-slate-400">Certificación ANTAI Panamá</div>
        </div>
      </div>

      {/* Filters & Export */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Buscar por usuario, cédula de paciente o detalle..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2 text-xs font-semibold"
            />
          </div>

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-700 w-full sm:w-auto"
          >
            <option value="ALL">Todas las Acciones</option>
            <option value="CONSULTA_RESULTADO">Consulta de Resultados</option>
            <option value="VALIDACION_TECNICA">Validación Técnica</option>
            <option value="VALIDACION_MEDICA">Validación Médica</option>
            <option value="MODIFICACION_CONSENTIMIENTO">Cambio Consentimiento Ley 81</option>
          </select>

          <button
            onClick={() => alert('Exportando Informe Oficial de Auditoría de Protección de Datos para Inspección Ley 81 / ANTAI...')}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-xl text-xs transition shadow flex items-center space-x-2 shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>Exportar Bitácora Certificada PDF</span>
          </button>
        </div>

        {/* Audit Log Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 border-b font-bold uppercase tracking-wider">
              <tr>
                <th className="p-3">Fecha / Hora</th>
                <th className="p-3">Usuario / Rol</th>
                <th className="p-3">Acción Registrada</th>
                <th className="p-3">Cédula Paciente</th>
                <th className="p-3">Hash Criptográfico SHA-256</th>
                <th className="p-3">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="p-3 font-mono text-slate-500 whitespace-nowrap">{log.timestamp}</td>
                  <td className="p-3">
                    <div className="font-bold text-slate-900">{log.userName}</div>
                    <div className="text-[10px] text-slate-500">{log.userRole}</div>
                  </td>
                  <td className="p-3">
                    <span className="bg-slate-200 text-slate-800 text-[10px] font-bold px-2 py-0.5 rounded-md font-mono">
                      {log.actionType}
                    </span>
                  </td>
                  <td className="p-3 font-mono font-bold text-slate-900">{log.patientNationalId}</td>
                  <td className="p-3 font-mono text-[10px] text-teal-800 truncate max-w-[120px]" title={log.sha256Hash}>
                    {log.sha256Hash.substring(0, 16)}...
                  </td>
                  <td className="p-3 text-slate-600 text-[11px]">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
