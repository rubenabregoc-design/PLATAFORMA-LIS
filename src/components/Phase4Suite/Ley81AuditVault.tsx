import React, { useState, useMemo } from 'react';
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
  Database,
  Eye,
  LogIn,
  LogOut,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Filter,
  UserX,
  Calendar,
  Sparkles,
  ExternalLink,
  Shield,
  Activity,
  Layers,
  LockIcon,
  RefreshCw,
  Info,
  Users,
  Zap,
  Mail,
  Send,
  Clock,
  Bell,
  MailCheck
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

interface Ley81AuditVaultProps {
  tenant: Tenant;
  branch: Branch;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  isoDate: string; // YYYY-MM-DDTHH:mm:ss for filtering
  userId: string;
  userName: string;
  userRole: 'Tecnólogo Médico' | 'Médico Referente' | 'Paciente' | 'Recepcionista' | 'Jefe de Laboratorio' | 'Administrador LIS';
  actionType:
    | 'INICIO_SESION'
    | 'CONSULTA_RESULTADO'
    | 'EXPORTACION_PDF'
    | 'VALIDACION_TECNICA'
    | 'VALIDACION_MEDICA'
    | 'MODIFICACION_CONSENTIMIENTO'
    | 'INTENTO_ACCESO_DENEGADO'
    | 'CAMBIO_TARIFARIO';
  patientId: string;
  patientName: string;
  patientNationalId: string;
  ipAddress: string;
  location: string;
  sha256Hash: string;
  prevHash: string;
  consentLey81Status: 'CONSENTIDO' | 'REVOCADO' | 'REQUIERE_FIRMA' | 'NO_APLICA';
  isAnomaly: boolean;
  details: string;
}

// Timeframe options
type TimeframeOption = '24h' | '7d' | '30d';

export const Ley81AuditVault: React.FC<Ley81AuditVaultProps> = ({ tenant, branch }) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [actionFilter, setActionFilter] = useState<string>('ALL');
  const [timeframe, setTimeframe] = useState<TimeframeOption>('7d');
  const [anomaliesOnly, setAnomaliesOnly] = useState<boolean>(false);
  const [privacyMaskEnabled, setPrivacyMaskEnabled] = useState<boolean>(true);
  const [selectedLogForModal, setSelectedLogForModal] = useState<AuditLogEntry | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);

  // Scheduled Weekly Email Summary State for Lab Manager
  const [scheduleActive, setScheduleActive] = useState<boolean>(true);
  const [managerEmail, setManagerEmail] = useState<string>('gerencia.laboratorio@clinicasanmateo.pa');
  const [scheduledDay, setScheduledDay] = useState<string>('Lunes');
  const [scheduledTime, setScheduledTime] = useState<string>('07:00');
  const [includeSecurityAlerts, setIncludeSecurityAlerts] = useState<boolean>(true);
  const [includeAccessLogs, setIncludeAccessLogs] = useState<boolean>(true);
  const [includeModificationTrail, setIncludeModificationTrail] = useState<boolean>(true);
  const [includeShaHashes, setIncludeShaHashes] = useState<boolean>(true);

  const [schedulerToast, setSchedulerToast] = useState<string | null>(null);
  const [isSendingTestEmail, setIsSendingTestEmail] = useState<boolean>(false);

  const handleSaveSchedule = () => {
    setSchedulerToast(
      `¡Programación de auditoría guardada! Los resúmenes semanales se enviarán cada ${scheduledDay} a las ${scheduledTime} a ${managerEmail}.`
    );
    setTimeout(() => setSchedulerToast(null), 5000);
  };

  const handleSendTestSummary = () => {
    setIsSendingTestEmail(true);
    setTimeout(() => {
      setIsSendingTestEmail(false);
      setSchedulerToast(`📧 ¡Resumen semanal de prueba enviado exitosamente a ${managerEmail}!`);
      setTimeout(() => setSchedulerToast(null), 5000);
    }, 1200);
  };

  // Full rich dataset of audit logs
  const [logs] = useState<AuditLogEntry[]>([
    {
      id: 'aud-101',
      timestamp: '11/08/2026 21:15:02',
      isoDate: '2026-08-11T21:15:02',
      userId: 'usr-3109',
      userName: 'Lic. Sofía Guardia',
      userRole: 'Tecnólogo Médico',
      actionType: 'VALIDACION_TECNICA',
      patientId: 'pat-1',
      patientName: 'Gabriela Pinzón',
      patientNationalId: '8-812-4432',
      ipAddress: '192.168.1.104',
      location: 'Sede Central Panama - Red Interna',
      sha256Hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      prevHash: '8a9f3b112c884019a2e3748291048f0293120192847291048591028471920381',
      consentLey81Status: 'CONSENTIDO',
      isAnomaly: false,
      details: 'Validación técnica de parámetros Hemograma Completo y firma digital de bioseguridad.'
    },
    {
      id: 'aud-102',
      timestamp: '11/08/2026 20:42:18',
      isoDate: '2026-08-11T20:42:18',
      userId: 'usr-10492',
      userName: 'Dr. Roberto Icaza',
      userRole: 'Médico Referente',
      actionType: 'CONSULTA_RESULTADO',
      patientId: 'pat-1',
      patientName: 'Gabriela Pinzón',
      patientNationalId: '8-812-4432',
      ipAddress: '200.46.88.12',
      location: 'Consultorio Privado Hospital Punta Pacífica',
      sha256Hash: 'ca978112ca1bbdcafac231b39a23dac4059104828da31e1136b6cb6d4128f731',
      prevHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      consentLey81Status: 'CONSENTIDO',
      isAnomaly: false,
      details: 'Visualización de resultados de Hematología en expediente clínico desde Portal Médico.'
    },
    {
      id: 'aud-103',
      timestamp: '11/08/2026 19:30:11',
      isoDate: '2026-08-11T19:30:11',
      userId: 'usr-8812',
      userName: 'Gabriela Pinzón',
      userRole: 'Paciente',
      actionType: 'EXPORTACION_PDF',
      patientId: 'pat-1',
      patientName: 'Gabriela Pinzón',
      patientNationalId: '8-812-4432',
      ipAddress: '186.15.201.44',
      location: 'Acceso Móvil Tigo Panamá',
      sha256Hash: '3f786850e387550fdab836ed7e6dc881de23001b51867b3a751e10861a69fd80',
      prevHash: 'ca978112ca1bbdcafac231b39a23dac4059104828da31e1136b6cb6d4128f731',
      consentLey81Status: 'CONSENTIDO',
      isAnomaly: false,
      details: 'Descarga de Informe PDF firmado con código QR de verificación Ley 81.'
    },
    {
      id: 'aud-104',
      timestamp: '11/08/2026 18:10:45',
      isoDate: '2026-08-11T18:10:45',
      userId: 'usr-3109',
      userName: 'Lic. Sofía Guardia',
      userRole: 'Tecnólogo Médico',
      actionType: 'INICIO_SESION',
      patientId: 'N/A',
      patientName: 'N/A',
      patientNationalId: 'N/A',
      ipAddress: '192.168.1.104',
      location: 'Sede Central - Estación Middleware Hematología',
      sha256Hash: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
      prevHash: '3f786850e387550fdab836ed7e6dc881de23001b51867b3a751e10861a69fd80',
      consentLey81Status: 'NO_APLICA',
      isAnomaly: false,
      details: 'Autenticación exitosa mediante credenciales cifradas y token OTP corporativo.'
    },
    {
      id: 'aud-105',
      timestamp: '11/08/2026 03:14:22',
      isoDate: '2026-08-11T03:14:22',
      userId: 'usr-unknown',
      userName: 'Usuario No Identificado (IP Externa)',
      userRole: 'Administrador LIS',
      actionType: 'INTENTO_ACCESO_DENEGADO',
      patientId: 'pat-3',
      patientName: 'Carlos Mendoza',
      patientNationalId: '4-711-9021',
      ipAddress: '190.140.22.91',
      location: 'IP Externa No Autenticada (Ruta Desconocida)',
      sha256Hash: '99818ab721029c812d09121a882038471203912048f712948212948120491029',
      prevHash: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
      consentLey81Status: 'REVOCADO',
      isAnomaly: true,
      details: 'ALERTA SEGURIDAD ANTAI: Intento no autorizado de consulta fuera de horario de expediente sensible sin token válido. Bloqueado automáticamente.'
    },
    {
      id: 'aud-106',
      timestamp: '10/08/2026 16:22:30',
      isoDate: '2026-08-10T16:22:30',
      userId: 'usr-9901',
      userName: 'Dr. Fernando Guardia',
      userRole: 'Jefe de Laboratorio',
      actionType: 'VALIDACION_MEDICA',
      patientId: 'pat-2',
      patientName: 'Ricardo Morales',
      patientNationalId: '8-765-4321',
      ipAddress: '192.168.1.102',
      location: 'Sede Central - Despacho Dirección Médica',
      sha256Hash: 'a872190283401284910284729104829104829104829104829104829104829104',
      prevHash: '99818ab721029c812d09121a882038471203912048f712948212948120491029',
      consentLey81Status: 'CONSENTIDO',
      isAnomaly: false,
      details: 'Aprobación médica y liberación de informe epidemiológico de Perfil Lipídico.'
    },
    {
      id: 'aud-107',
      timestamp: '10/08/2026 14:05:12',
      isoDate: '2026-08-10T14:05:12',
      userId: 'usr-8812',
      userName: 'María Elena González',
      userRole: 'Paciente',
      actionType: 'MODIFICACION_CONSENTIMIENTO',
      patientId: 'pat-1',
      patientName: 'Gabriela Pinzón',
      patientNationalId: '8-812-4432',
      ipAddress: '186.15.201.44',
      location: 'Portal del Paciente - Módulo Privacidad',
      sha256Hash: '7218391028472910482910482910482910482910482910482910482910482910',
      prevHash: 'a872190283401284910284729104829104829104829104829104829104829104',
      consentLey81Status: 'CONSENTIDO',
      isAnomaly: false,
      details: 'Otorgamiento expreso de consentimiento informado conforme al Art. 8 y 14 de la Ley 81 de Panamá.'
    },
    {
      id: 'aud-108',
      timestamp: '10/08/2026 09:12:00',
      isoDate: '2026-08-10T09:12:00',
      userId: 'usr-5521',
      userName: 'Anabel Castillo',
      userRole: 'Recepcionista',
      actionType: 'INICIO_SESION',
      patientId: 'N/A',
      patientName: 'N/A',
      patientNationalId: 'N/A',
      ipAddress: '192.168.1.110',
      location: 'Sede Costa del Este - Caza Muestras',
      sha256Hash: '1283910284729104829104829104829104829104829104829104829104829104',
      prevHash: '7218391028472910482910482910482910482910482910482910482910482910',
      consentLey81Status: 'NO_APLICA',
      isAnomaly: false,
      details: 'Apertura de turno de recepción y facturación de pacientes en módulo POS.'
    },
    {
      id: 'aud-109',
      timestamp: '09/08/2026 17:50:33',
      isoDate: '2026-08-09T17:50:33',
      userId: 'usr-10492',
      userName: 'Dr. Roberto Icaza',
      userRole: 'Médico Referente',
      actionType: 'CONSULTA_RESULTADO',
      patientId: 'pat-4',
      patientName: 'Ernesto Ríos',
      patientNationalId: '3-702-1198',
      ipAddress: '200.46.88.12',
      location: 'Clínica San Fernando - Red Médica',
      sha256Hash: '9182391028472910482910482910482910482910482910482910482910482910',
      prevHash: '1283910284729104829104829104829104829104829104829104829104829104',
      consentLey81Status: 'CONSENTIDO',
      isAnomaly: false,
      details: 'Consulta de panel glucémico e HbA1c para evaluación endocrina.'
    },
    {
      id: 'aud-110',
      timestamp: '09/08/2026 11:30:15',
      isoDate: '2026-08-09T11:30:15',
      userId: 'usr-3109',
      userName: 'Lic. Sofía Guardia',
      userRole: 'Tecnólogo Médico',
      actionType: 'EXPORTACION_PDF',
      patientId: 'pat-2',
      patientName: 'Ricardo Morales',
      patientNationalId: '8-765-4321',
      ipAddress: '192.168.1.104',
      location: 'Sede Central - Estación de Validación',
      sha256Hash: '3819203819203819203819203819203819203819203819203819203819203819',
      prevHash: '9182391028472910482910482910482910482910482910482910482910482910',
      consentLey81Status: 'CONSENTIDO',
      isAnomaly: false,
      details: 'Generación e impresión de informe oficial con sello de agua Ley 81.'
    },
    {
      id: 'aud-111',
      timestamp: '08/08/2026 22:01:40',
      isoDate: '2026-08-08T22:01:40',
      userId: 'usr-unknown',
      userName: 'Intento Anónimo',
      userRole: 'Administrador LIS',
      actionType: 'INTENTO_ACCESO_DENEGADO',
      patientId: 'pat-1',
      patientName: 'Gabriela Pinzón',
      patientNationalId: '8-812-4432',
      ipAddress: '181.197.10.4',
      location: 'IP Bloqueada - Proveedor ISP Desconocido',
      sha256Hash: '4718293019283746501928374650192837465019283746501928374650192837',
      prevHash: '3819203819203819203819203819203819203819203819203819203819203819',
      consentLey81Status: 'REQUIERE_FIRMA',
      isAnomaly: true,
      details: 'ALERTA SEGURIDAD ANTAI: Múltiples reintentos con token expirado intentando acceder a PDF de laboratorio. IP agregada a lista negra.'
    },
    {
      id: 'aud-112',
      timestamp: '08/08/2026 15:10:00',
      isoDate: '2026-08-08T15:10:00',
      userId: 'usr-9901',
      userName: 'Dr. Fernando Guardia',
      userRole: 'Jefe de Laboratorio',
      actionType: 'INICIO_SESION',
      patientId: 'N/A',
      patientName: 'N/A',
      patientNationalId: 'N/A',
      ipAddress: '192.168.1.102',
      location: 'Sede Central - Red Administrativa',
      sha256Hash: '1029384756102938475610293847561029384756102938475610293847561029',
      prevHash: '4718293019283746501928374650192837465019283746501928374650192837',
      consentLey81Status: 'NO_APLICA',
      isAnomaly: false,
      details: 'Inicio de sesión seguro para auditoría de calidad ISO 15189 y revisión Ley 81.'
    },
    {
      id: 'aud-113',
      timestamp: '07/08/2026 14:40:19',
      isoDate: '2026-08-07T14:40:19',
      userId: 'usr-10492',
      userName: 'Dr. Roberto Icaza',
      userRole: 'Médico Referente',
      actionType: 'CONSULTA_RESULTADO',
      patientId: 'pat-5',
      patientName: 'Lucía Bethancourt',
      patientNationalId: '8-991-0023',
      ipAddress: '200.46.88.12',
      location: 'Consultorio Médico Punta Pacífica',
      sha256Hash: '9876543210987654321098765432109876543210987654321098765432109876',
      prevHash: '1029384756102938475610293847561029384756102938475610293847561029',
      consentLey81Status: 'CONSENTIDO',
      isAnomaly: false,
      details: 'Consulta de cultivos microbiológicos y antibiograma para antibioticoterapia.'
    },
    {
      id: 'aud-114',
      timestamp: '06/08/2026 10:00:00',
      isoDate: '2026-08-06T10:00:00',
      userId: 'usr-admin01',
      userName: 'Ing. Carlos Abrego',
      userRole: 'Administrador LIS',
      actionType: 'CAMBIO_TARIFARIO',
      patientId: 'N/A',
      patientName: 'N/A',
      patientNationalId: 'N/A',
      ipAddress: '192.168.1.200',
      location: 'Servidor Central Cloud Run - Panama',
      sha256Hash: '5544332211554433221155443322115544332211554433221155443322115544',
      prevHash: '9876543210987654321098765432109876543210987654321098765432109876',
      consentLey81Status: 'NO_APLICA',
      isAnomaly: false,
      details: 'Actualización en catálogo de pruebas y precios corporativos con trazabilidad auditada.'
    }
  ]);

  // Masking helper function for Ley 81 Privacy compliance
  const maskPatientId = (id: string) => {
    if (!privacyMaskEnabled || !id || id === 'N/A') return id;
    const parts = id.split('-');
    if (parts.length >= 3) {
      return `${parts[0]}-${parts[1]}-****`;
    }
    if (id.length > 4) {
      return id.substring(0, id.length - 4) + '****';
    }
    return id;
  };

  const maskIpAddress = (ip: string) => {
    if (!privacyMaskEnabled || !ip || ip === 'N/A') return ip;
    const parts = ip.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.x.x`;
    }
    return ip;
  };

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Search
      const matchesSearch =
        log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.patientNationalId.includes(searchTerm) ||
        log.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.ipAddress.includes(searchTerm) ||
        log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.sha256Hash.toLowerCase().includes(searchTerm.toLowerCase());

      // Action Filter
      const matchesAction =
        actionFilter === 'ALL' ||
        (actionFilter === 'LOGINS' && (log.actionType === 'INICIO_SESION' || log.actionType === 'INTENTO_ACCESO_DENEGADO')) ||
        (actionFilter === 'ACCESOS' && (log.actionType === 'CONSULTA_RESULTADO' || log.actionType === 'EXPORTACION_PDF')) ||
        (actionFilter === 'VALIDACIONES' && (log.actionType === 'VALIDACION_TECNICA' || log.actionType === 'VALIDACION_MEDICA')) ||
        (actionFilter === 'CONSENTIMIENTO' && log.actionType === 'MODIFICACION_CONSENTIMIENTO') ||
        log.actionType === actionFilter;

      // Anomaly Filter
      const matchesAnomaly = !anomaliesOnly || log.isAnomaly;

      return matchesSearch && matchesAction && matchesAnomaly;
    });
  }, [logs, searchTerm, actionFilter, anomaliesOnly]);

  // Metrics calculation
  const totalLogsCount = logs.length;
  const totalLoginsCount = logs.filter((l) => l.actionType === 'INICIO_SESION').length;
  const totalRecordAccesses = logs.filter((l) => l.actionType === 'CONSULTA_RESULTADO' || l.actionType === 'EXPORTACION_PDF').length;
  const totalAnomalies = logs.filter((l) => l.isAnomaly).length;

  // Ley 81 Quick Widget KPIs
  const accessesTodayCount = useMemo(() => {
    return logs.filter((l) => l.timestamp.includes('11/08/2026') || l.isoDate.startsWith('2026-08-11')).length;
  }, [logs]);

  const modifiedRecordsCount = useMemo(() => {
    return logs.filter((l) =>
      ['VALIDACION_TECNICA', 'VALIDACION_MEDICA', 'MODIFICACION_CONSENTIMIENTO', 'CAMBIO_TARIFARIO'].includes(l.actionType)
    ).length;
  }, [logs]);

  const criticalSecurityAlertsCount = useMemo(() => {
    return logs.filter((l) => l.isAnomaly || l.actionType === 'INTENTO_ACCESO_DENEGADO').length;
  }, [logs]);

  const topActiveUsers = useMemo(() => {
    const userMap: Record<string, { name: string; role: string; count: number }> = {};
    logs.forEach((log) => {
      if (
        log.userName &&
        log.userName !== 'N/A' &&
        !log.userName.includes('No Identificado') &&
        !log.userName.includes('Anónimo')
      ) {
        if (!userMap[log.userName]) {
          userMap[log.userName] = {
            name: log.userName,
            role: log.userRole,
            count: 0
          };
        }
        userMap[log.userName].count += 1;
      }
    });

    return Object.values(userMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);
  }, [logs]);

  // Chart 1 Data: Time series of Logins vs Record Accesses vs PDF Exports over Time
  const timeSeriesData = useMemo(() => {
    if (timeframe === '24h') {
      return [
        { time: '00:00', logins: 0, accesos: 1, pdfs: 0, alertas: 0 },
        { time: '03:00', logins: 0, accesos: 0, pdfs: 0, alertas: 1 },
        { time: '06:00', logins: 2, accesos: 1, pdfs: 0, alertas: 0 },
        { time: '09:00', logins: 8, accesos: 12, pdfs: 5, alertas: 0 },
        { time: '12:00', logins: 6, accesos: 18, pdfs: 9, alertas: 0 },
        { time: '15:00', logins: 5, accesos: 14, pdfs: 7, alertas: 0 },
        { time: '18:00', logins: 4, accesos: 9, pdfs: 4, alertas: 0 },
        { time: '21:00', logins: 1, accesos: 4, pdfs: 2, alertas: 0 }
      ];
    } else if (timeframe === '7d') {
      return [
        { time: '05 Ago', logins: 12, accesos: 22, pdfs: 10, alertas: 0 },
        { time: '06 Ago', logins: 18, accesos: 31, pdfs: 14, alertas: 0 },
        { time: '07 Ago', logins: 15, accesos: 28, pdfs: 11, alertas: 0 },
        { time: '08 Ago', logins: 9, accesos: 14, pdfs: 6, alertas: 1 },
        { time: '09 Ago', logins: 11, accesos: 19, pdfs: 8, alertas: 0 },
        { time: '10 Ago', logins: 24, accesos: 42, pdfs: 21, alertas: 0 },
        { time: '11 Ago', logins: 29, accesos: 55, pdfs: 28, alertas: 1 }
      ];
    } else {
      // 30d
      return [
        { time: 'Semana 1', logins: 85, accesos: 160, pdfs: 78, alertas: 2 },
        { time: 'Semana 2', logins: 92, accesos: 188, pdfs: 94, alertas: 1 },
        { time: 'Semana 3', logins: 110, accesos: 215, pdfs: 108, alertas: 0 },
        { time: 'Semana 4', logins: 128, accesos: 250, pdfs: 132, alertas: 2 }
      ];
    }
  }, [timeframe]);

  // Chart 2 Data: Action Types Breakdown (Donut)
  const actionTypeBreakdownData = useMemo(() => {
    const counts: Record<string, number> = {
      'Consultas Expediente': 0,
      'Inicios de Sesión': 0,
      'Exportación PDF': 0,
      'Validación Técnica/Médica': 0,
      'Consentimiento Ley 81': 0,
      'Alertas / Accesos Denegados': 0
    };

    logs.forEach((l) => {
      if (l.actionType === 'CONSULTA_RESULTADO') counts['Consultas Expediente']++;
      else if (l.actionType === 'INICIO_SESION') counts['Inicios de Sesión']++;
      else if (l.actionType === 'EXPORTACION_PDF') counts['Exportación PDF']++;
      else if (l.actionType === 'VALIDACION_TECNICA' || l.actionType === 'VALIDACION_MEDICA') counts['Validación Técnica/Médica']++;
      else if (l.actionType === 'MODIFICACION_CONSENTIMIENTO') counts['Consentimiento Ley 81']++;
      else if (l.actionType === 'INTENTO_ACCESO_DENEGADO') counts['Alertas / Accesos Denegados']++;
    });

    return [
      { name: 'Consultas Expediente', value: counts['Consultas Expediente'], color: '#0d9488' }, // teal-600
      { name: 'Inicios de Sesión', value: counts['Inicios de Sesión'], color: '#0284c7' }, // sky-600
      { name: 'Exportación PDF', value: counts['Exportación PDF'], color: '#6366f1' }, // indigo-500
      { name: 'Validación Técnica/Médica', value: counts['Validación Técnica/Médica'], color: '#10b981' }, // emerald-500
      { name: 'Consentimiento Ley 81', value: counts['Consentimiento Ley 81'], color: '#f59e0b' }, // amber-500
      { name: 'Alertas / Accesos Denegados', value: counts['Alertas / Accesos Denegados'], color: '#f43f5e' } // rose-500
    ];
  }, [logs]);

  // Chart 3 Data: User Role Access Frequency
  const roleAccessData = useMemo(() => {
    const roleCounts: Record<string, { logins: number; recordAccess: number }> = {
      'Tecnólogo Médico': { logins: 12, recordAccess: 28 },
      'Médico Referente': { logins: 18, recordAccess: 45 },
      'Paciente': { logins: 34, recordAccess: 38 },
      'Recepcionista': { logins: 15, recordAccess: 10 },
      'Jefe de Laboratorio': { logins: 8, recordAccess: 19 },
      'Administrador LIS': { logins: 5, recordAccess: 6 }
    };

    return Object.keys(roleCounts).map((role) => ({
      role,
      IniciosSesion: roleCounts[role].logins,
      ConsultasExpediente: roleCounts[role].recordAccess
    }));
  }, []);

  // Chart 4 Data: Access Pattern by Hour of Day (Heatmap / Hourly Distribution)
  const hourlyAccessPatternData = useMemo(() => {
    return [
      { hour: '00-03h', normales: 2, inusuales: 1 },
      { hour: '04-07h', normales: 12, inusuales: 0 },
      { hour: '08-11h', normales: 88, inusuales: 0 },
      { hour: '12-15h', normales: 74, inusuales: 0 },
      { hour: '16-19h', normales: 46, inusuales: 0 },
      { hour: '20-23h', normales: 18, inusuales: 1 }
    ];
  }, []);

  return (
    <div className="space-y-6 text-slate-800">
      {/* Top Banner & Ley 81 Header */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white p-6 rounded-3xl shadow-xl border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative overflow-hidden">
        {/* Background Subtle Glow */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-2 relative z-10 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 bg-teal-500/20 border border-teal-500/40 text-teal-300 font-bold text-xs rounded-full flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-teal-400" />
              Bóveda BCT Ley 81 • ANTAI Panamá
            </span>
            <span className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-mono font-bold text-[11px] rounded-full flex items-center gap-1">
              <Lock className="w-3.5 h-3.5" />
              Bloque SHA-256 Inmutable
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Tablero de Auditoría Imputable & Control de Accesos
          </h1>

          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            Monitorización en tiempo real conforme a la <strong className="text-teal-300">Ley 81 de 2019 de Panamá (Protección de Datos Personales)</strong>.
            Trazabilidad criptográfica inalterable de inicios de sesión, lecturas de expedientes, descargas de PDF y gestión de consentimientos.
          </p>
        </div>

        {/* Right side status badge */}
        <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0 relative z-10">
          <div className="bg-slate-900/90 border border-teal-500/30 p-4 rounded-2xl backdrop-blur space-y-1.5 text-xs">
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-400 font-medium">Estado del Audit Ledger:</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Integra
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-400 font-medium">Verificación Hash:</span>
              <span className="font-mono text-teal-300 font-bold">SHA-256 Validated</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-400 font-medium">Normativa Titular:</span>
              <span className="text-slate-200 font-bold">ANTAI Res. 2021-04</span>
            </div>
          </div>

          <button
            onClick={() => setIsExportModalOpen(true)}
            className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs transition shadow-lg shadow-teal-500/20 flex items-center justify-center space-x-2 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Generar Reporte Oficial ANTAI</span>
          </button>
        </div>
      </div>

      {/* Anomaly / Suspicious Activity Alert Banner */}
      {totalAnomalies > 0 && (
        <div className="bg-gradient-to-r from-rose-950/90 via-slate-900 to-rose-950/90 border border-rose-500/40 p-4 rounded-2xl text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-400 shrink-0 mt-0.5 sm:mt-0">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
            <div className="space-y-0.5">
              <div className="font-bold text-xs text-rose-300 flex items-center gap-2">
                <span>Detección de Anormalidades de Acceso Ley 81</span>
                <span className="px-2 py-0.5 bg-rose-500 text-white rounded-full font-mono font-black text-[10px]">
                  {totalAnomalies} Evento(s)
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                Se detectaron reintentos de consulta no autorizada a expedientes sensibles desde direcciones IP desconocidas fuera de horario regular.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setAnomaliesOnly(!anomaliesOnly);
              setActionFilter('ALL');
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shrink-0 cursor-pointer ${
              anomaliesOnly
                ? 'bg-rose-500 text-white shadow-md'
                : 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/40'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>{anomaliesOnly ? 'Mostrando Solo Inconsistencias' : 'Filtrar Solo Inconsistencias'}</span>
          </button>
        </div>
      )}

      {/* Executive Quick KPI Widget Panel */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 rounded-3xl p-6 border border-slate-800 text-white shadow-xl space-y-6 relative overflow-hidden">
        {/* Ambient Glow */}
        <div className="absolute top-0 right-1/4 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4 relative z-10">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-teal-500/20 border border-teal-500/30 rounded-2xl text-teal-400 shrink-0">
              <Zap className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                <span>Resumen de KPIs Rápido Ley 81</span>
                <span className="px-2.5 py-0.5 bg-teal-500/20 border border-teal-500/30 text-teal-300 font-mono text-[10px] rounded-full font-extrabold uppercase">
                  Live Audit Vault
                </span>
              </h2>
              <p className="text-slate-400 text-xs">
                Métricas instantáneas de tráfico, trazabilidad de modificaciones, seguridad ANTAI y ranking de usuarios más activos.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <span className="text-slate-400 text-[11px] font-mono">Control PII:</span>
            <button
              onClick={() => setPrivacyMaskEnabled(!privacyMaskEnabled)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5 text-teal-400" />
              <span>{privacyMaskEnabled ? 'Máscara PII Activa' : 'PII Visible (Auditor)'}</span>
            </button>
          </div>
        </div>

        {/* 4 Bento Cells for KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
          {/* Bento Cell 1: Total de Accesos Hoy */}
          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl space-y-3 relative group hover:border-teal-500/50 transition shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                Total Accesos Hoy
              </span>
              <div className="w-9 h-9 rounded-xl bg-teal-500/20 border border-teal-500/30 text-teal-400 flex items-center justify-center shrink-0">
                <LogIn className="w-5 h-5" />
              </div>
            </div>

            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-black font-mono text-white tracking-tight">{accessesTodayCount}</span>
              <span className="text-xs text-teal-400 font-bold">Accesos Registrados</span>
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <span>Logins, Consultas & PDFs</span>
              <span className="text-emerald-400 font-mono font-bold">+100% Hoy</span>
            </div>
          </div>

          {/* Bento Cell 2: Registros Modificados */}
          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl space-y-3 relative group hover:border-emerald-500/50 transition shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                Registros Modificados
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                <FileCheck2 className="w-5 h-5" />
              </div>
            </div>

            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-black font-mono text-white tracking-tight">{modifiedRecordsCount}</span>
              <span className="text-xs text-emerald-400 font-bold">Registros Auditados</span>
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <span>Validaciones y Tarifas</span>
              <span className="text-emerald-400 font-mono font-bold">Inmutables</span>
            </div>
          </div>

          {/* Bento Cell 3: Alertas de Seguridad Críticas */}
          <div
            className={`bg-slate-900/90 border p-4 rounded-2xl space-y-3 relative group transition shadow-sm ${
              criticalSecurityAlertsCount > 0 ? 'border-rose-500/50 bg-rose-950/20' : 'border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                Alertas Críticas Detectadas
              </span>
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  criticalSecurityAlertsCount > 0
                    ? 'bg-rose-500/20 border border-rose-500/40 text-rose-400 animate-pulse'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                <ShieldAlert className="w-5 h-5" />
              </div>
            </div>

            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-black font-mono text-rose-400 tracking-tight">
                {criticalSecurityAlertsCount}
              </span>
              <span className="text-xs text-rose-300 font-bold">Eventos Anómalos</span>
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Reintentos / Denegados</span>
              {criticalSecurityAlertsCount > 0 && (
                <button
                  onClick={() => setAnomaliesOnly(true)}
                  className="text-rose-400 hover:text-rose-300 font-bold underline text-[10px] cursor-pointer"
                >
                  Filtrar Alertas
                </button>
              )}
            </div>
          </div>

          {/* Bento Cell 4: Usuarios con Más Actividad */}
          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl space-y-2.5 relative hover:border-indigo-500/50 transition shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                <Users className="w-3.5 h-3.5 text-indigo-400" />
                <span>Usuarios Más Activos</span>
              </span>
              <span className="text-[10px] bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 px-2 py-0.5 rounded-full font-mono font-bold">
                Ranking
              </span>
            </div>

            <div className="space-y-1.5">
              {topActiveUsers.map((usr, idx) => (
                <div key={usr.name} className="flex items-center justify-between text-xs font-medium">
                  <div className="flex items-center space-x-2 min-w-0">
                    <span className="w-4 h-4 rounded-full bg-slate-800 border border-slate-700 text-teal-400 font-mono text-[9px] font-black flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div className="truncate">
                      <div className="text-white font-bold text-[11px] truncate leading-tight">{usr.name}</div>
                      <div className="text-slate-400 text-[9px] truncate">{usr.role}</div>
                    </div>
                  </div>

                  <div className="shrink-0 text-right font-mono ml-1">
                    <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded-md text-teal-300 font-bold text-[10px]">
                      {usr.count} acc.
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Standard KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Total Eventos Registrados
            </span>
            <div className="text-2xl font-black text-slate-900 font-mono">{totalLogsCount}</div>
            <div className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
              <Shield className="w-3 h-3" /> 100% Firmado SHA-256
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center shrink-0">
            <Hash className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Inicios de Sesión
            </span>
            <div className="text-2xl font-black text-slate-900 font-mono">{totalLoginsCount}</div>
            <div className="text-[10px] text-sky-600 font-bold flex items-center gap-1">
              <LogIn className="w-3 h-3" /> Autenticados por IP / Token
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-200 text-sky-700 flex items-center justify-center shrink-0">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Lecturas / Descargas PDF
            </span>
            <div className="text-2xl font-black text-slate-900 font-mono">{totalRecordAccesses}</div>
            <div className="text-[10px] text-indigo-600 font-bold flex items-center gap-1">
              <FileText className="w-3 h-3" /> Con Consentimiento Activo
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center shrink-0">
            <Eye className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Anonimización Ley 81
            </span>
            <div className="text-xs font-bold text-slate-900 flex items-center gap-1">
              {privacyMaskEnabled ? (
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md font-mono">
                  ACTIVO (PII Protegido)
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-md font-mono">
                  DESACTIVADO (Auditor)
                </span>
              )}
            </div>
            <button
              onClick={() => setPrivacyMaskEnabled(!privacyMaskEnabled)}
              className="text-[11px] text-teal-700 font-bold hover:underline cursor-pointer flex items-center gap-1 mt-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>{privacyMaskEnabled ? 'Mostrar PII Completo' : 'Ocultar PII (Mask)'}</span>
            </button>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
            <LockIcon className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Interactive Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart: Time Series of Logins vs Record Accesses */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Activity className="w-5 h-5 text-teal-600" />
                Frecuencia Temporal de Inicios de Sesión y Acceso a Expedientes
              </h2>
              <p className="text-xs text-slate-500">
                Evolución comparativa de autenticación de usuarios vs lecturas/descargas de datos clínicos
              </p>
            </div>

            {/* Timeframe Selector Buttons */}
            <div className="bg-slate-100 p-1 rounded-xl flex items-center space-x-1 self-start sm:self-auto">
              {(['24h', '7d', '30d'] as TimeframeOption[]).map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    timeframe === tf
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tf === '24h' ? 'Últimas 24h' : tf === '7d' ? 'Últimos 7 días' : 'Últimos 30 días'}
                </button>
              ))}
            </div>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeSeriesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAccesos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorLogins" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorPdfs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px'
                  }}
                  itemStyle={{ padding: '2px 0' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Area
                  type="monotone"
                  dataKey="accesos"
                  name="Consultas Expedientes"
                  stroke="#0d9488"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorAccesos)"
                />
                <Area
                  type="monotone"
                  dataKey="logins"
                  name="Inicios de Sesión"
                  stroke="#0284c7"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorLogins)"
                />
                <Area
                  type="monotone"
                  dataKey="pdfs"
                  name="Descargas PDF"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorPdfs)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Secondary Chart: Action Types Distribution (Donut Chart) */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600" />
              Desglose por Tipo de Acción
            </h2>
            <p className="text-xs text-slate-500">Proporción de eventos de datos Ley 81</p>
          </div>

          <div className="h-56 w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={actionTypeBreakdownData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {actionTypeBreakdownData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '11px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Custom Legend List */}
          <div className="space-y-1.5 text-xs">
            {actionTypeBreakdownData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-[11px]">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-700 font-medium truncate max-w-[150px]">{item.name}</span>
                </div>
                <span className="font-mono font-bold text-slate-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Additional Charts Row: Role Distribution & Access Hour Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Role Access Bar Chart */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-sky-600" />
              Acceso a Datos por Rol de Usuario (RBAC)
            </h2>
            <p className="text-xs text-slate-500">
              Distribución de consultas de expediente e inicios de sesión por perfil Ley 81
            </p>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={roleAccessData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="role" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '11px'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="IniciosSesion" name="Inicios de Sesión" fill="#0284c7" radius={[6, 6, 0, 0]} />
                <Bar dataKey="ConsultasExpediente" name="Consultas de Expediente" fill="#0d9488" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Access Pattern by Hour Chart */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <History className="w-5 h-5 text-amber-600" />
              Patrón de Horario de Consultas (Detección de Horas Fuera de Turno)
            </h2>
            <p className="text-xs text-slate-500">
              Análisis del volumen de consultas por franja horaria para prevenir fugas de datos nocturnas
            </p>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyAccessPatternData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '11px'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="normales" name="Accesos Regulares" fill="#10b981" stackId="a" radius={[0, 0, 0, 0]} />
                <Bar dataKey="inusuales" name="Accesos Inusuales / Alerta" fill="#f43f5e" stackId="a" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Weekly Audit Summary Scheduler Component */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-5 relative overflow-hidden">
        {/* Toast Alert Banner */}
        {schedulerToast && (
          <div className="bg-emerald-950 text-emerald-200 border border-emerald-700/80 p-3.5 rounded-2xl text-xs font-bold flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center space-x-2.5">
              <MailCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{schedulerToast}</span>
            </div>
            <button
              onClick={() => setSchedulerToast(null)}
              className="text-emerald-400 hover:text-white text-xs font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-teal-600 rounded-2xl text-white shadow-md shrink-0">
              <Mail className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                  Programación Automática de Resúmenes Semanales para Gerencia
                </h2>
                <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-800 font-mono text-[10px] font-bold rounded-full uppercase">
                  Ley 81 ANTAI
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Configure el envío automático por correo electrónico del consolidado semanal de trazabilidad y alertas de seguridad al Jefe o Gerente de Laboratorio.
              </p>
            </div>
          </div>

          {/* Toggle Active / Inactive */}
          <div className="flex items-center space-x-3 bg-slate-50 p-2 rounded-2xl border border-slate-200 shrink-0 self-start md:self-auto">
            <span className="text-xs font-bold text-slate-700">Estado del Envío:</span>
            <button
              onClick={() => setScheduleActive(!scheduleActive)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center space-x-1.5 cursor-pointer shadow-sm ${
                scheduleActive
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                  : 'bg-slate-300 text-slate-700 hover:bg-slate-400'
              }`}
            >
              <Bell className="w-3.5 h-3.5" />
              <span>{scheduleActive ? 'ACTIVO (Semanal)' : 'INACTIVO'}</span>
            </button>
          </div>
        </div>

        {/* Configuration Inputs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Email Address Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center space-x-1">
              <Mail className="w-3.5 h-3.5 text-teal-600" />
              <span>Correo del Gerente de Laboratorio:</span>
            </label>
            <input
              type="email"
              value={managerEmail}
              onChange={(e) => setManagerEmail(e.target.value)}
              placeholder="gerencia@laboratorio.pa"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-teal-500 focus:bg-white font-mono"
            />
          </div>

          {/* Day Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              <span>Día de Envío Semanal:</span>
            </label>
            <select
              value={scheduledDay}
              onChange={(e) => setScheduledDay(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-teal-500 focus:bg-white"
            >
              <option value="Lunes">Cada Lunes</option>
              <option value="Martes">Cada Martes</option>
              <option value="Miércoles">Cada Miércoles</option>
              <option value="Jueves">Cada Jueves</option>
              <option value="Viernes">Cada Viernes</option>
              <option value="Sábado">Cada Sábado</option>
              <option value="Domingo">Cada Domingo</option>
            </select>
          </div>

          {/* Time Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>Hora Programada (UTC-5 Panamá):</span>
            </label>
            <input
              type="time"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-teal-500 focus:bg-white font-mono"
            />
          </div>
        </div>

        {/* Content Payload Options (Checkboxes) */}
        <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4 space-y-2.5">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
            Contenido Incluido en el Reporte Resumen:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <label className="flex items-center space-x-2 font-semibold text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={includeSecurityAlerts}
                onChange={(e) => setIncludeSecurityAlerts(e.target.checked)}
                className="w-4 h-4 text-teal-600 border-slate-300 rounded focus:ring-0 cursor-pointer"
              />
              <span>Alertas de Seguridad & Anomalías</span>
            </label>

            <label className="flex items-center space-x-2 font-semibold text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={includeAccessLogs}
                onChange={(e) => setIncludeAccessLogs(e.target.checked)}
                className="w-4 h-4 text-teal-600 border-slate-300 rounded focus:ring-0 cursor-pointer"
              />
              <span>Consultas a Expedientes (PII)</span>
            </label>

            <label className="flex items-center space-x-2 font-semibold text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={includeModificationTrail}
                onChange={(e) => setIncludeModificationTrail(e.target.checked)}
                className="w-4 h-4 text-teal-600 border-slate-300 rounded focus:ring-0 cursor-pointer"
              />
              <span>Registros y Tarifas Modificadas</span>
            </label>

            <label className="flex items-center space-x-2 font-semibold text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={includeShaHashes}
                onChange={(e) => setIncludeShaHashes(e.target.checked)}
                className="w-4 h-4 text-teal-600 border-slate-300 rounded focus:ring-0 cursor-pointer"
              />
              <span>Encadenamiento SHA-256 e IPs</span>
            </label>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="text-[11px] text-slate-500 font-medium">
            {scheduleActive ? (
              <>Próximo envío programado: <strong className="text-slate-800">{scheduledDay} a las {scheduledTime}</strong> a <strong className="text-teal-700">{managerEmail}</strong>.</>
            ) : (
              <span className="text-amber-700 font-bold">⚠️ Envío programado actualmente pausado.</span>
            )}
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={handleSendTestSummary}
              disabled={isSendingTestEmail}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
            >
              <Send className={`w-3.5 h-3.5 text-indigo-600 ${isSendingTestEmail ? 'animate-bounce' : ''}`} />
              <span>{isSendingTestEmail ? 'Enviando...' : 'Enviar Prueba Ahora'}</span>
            </button>

            <button
              onClick={handleSaveSchedule}
              className="px-5 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-xs rounded-xl transition shadow-md shadow-teal-600/20 flex items-center space-x-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-200" />
              <span>Guardar Programación Semanal</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filterable Audit Log Ledger Table */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Database className="w-5 h-5 text-teal-600" />
              Registro Inmutable de Bitácora Cryptographic Audit Trail
            </h2>
            <p className="text-xs text-slate-500">
              Lista detallada de eventos con encadenamiento SHA-256 e IP de origen
            </p>
          </div>

          {/* Controls Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setPrivacyMaskEnabled(!privacyMaskEnabled)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 border ${
                privacyMaskEnabled
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-amber-50 text-amber-800 border-amber-300'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{privacyMaskEnabled ? 'Máscara PII: ACTIVA' : 'Máscara PII: DESACTIVADA'}</span>
            </button>

            <button
              onClick={() => {
                setActionFilter('ALL');
                setSearchTerm('');
                setAnomaliesOnly(false);
              }}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer flex items-center space-x-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Limpiar Filtros</span>
            </button>
          </div>
        </div>

        {/* Filter Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative col-span-1 sm:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Buscar por usuario, cédula de paciente, dirección IP o hash SHA-256..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs font-semibold focus:outline-none focus:border-teal-500"
            />
          </div>

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-teal-500"
          >
            <option value="ALL">Todos los Tipos de Acción</option>
            <option value="LOGINS">Inicios de Sesión / Autenticación</option>
            <option value="ACCESOS">Consultas y Descargas de Expedientes</option>
            <option value="VALIDACIONES">Validaciones Técnica y Médica</option>
            <option value="CONSENTIMIENTO">Cambio Consentimiento Ley 81</option>
            <option value="INTENTO_ACCESO_DENEGADO">Intentos Denegados / Alertas</option>
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-2xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-300 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3">Fecha / Hora</th>
                <th className="p-3">Usuario Auditor / Rol</th>
                <th className="p-3">Acción Registrada</th>
                <th className="p-3">Paciente (Cédula Ley 81)</th>
                <th className="p-3">Origen IP / Ubicación</th>
                <th className="p-3">Firma Criptográfica SHA-256</th>
                <th className="p-3 text-center">Detalle / Inspeccionar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500 font-medium">
                    No se encontraron registros de auditoría que coincidan con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr
                    key={log.id}
                    className={`hover:bg-slate-50 transition ${
                      log.isAnomaly ? 'bg-rose-50/60 hover:bg-rose-100/60' : ''
                    }`}
                  >
                    <td className="p-3 font-mono text-slate-500 whitespace-nowrap text-[11px]">
                      {log.timestamp}
                    </td>

                    <td className="p-3">
                      <div className="font-bold text-slate-900">{log.userName}</div>
                      <div className="text-[10px] text-slate-500">{log.userRole}</div>
                    </td>

                    <td className="p-3 whitespace-nowrap">
                      {log.actionType === 'INICIO_SESION' && (
                        <span className="px-2 py-0.5 bg-sky-100 text-sky-800 border border-sky-200 rounded-md text-[10px] font-bold font-mono inline-flex items-center gap-1">
                          <LogIn className="w-3 h-3" /> INICIO_SESION
                        </span>
                      )}
                      {log.actionType === 'CONSULTA_RESULTADO' && (
                        <span className="px-2 py-0.5 bg-teal-100 text-teal-800 border border-teal-200 rounded-md text-[10px] font-bold font-mono inline-flex items-center gap-1">
                          <Eye className="w-3 h-3" /> CONSULTA_EXPEDIENTE
                        </span>
                      )}
                      {log.actionType === 'EXPORTACION_PDF' && (
                        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-md text-[10px] font-bold font-mono inline-flex items-center gap-1">
                          <FileText className="w-3 h-3" /> EXPORTACION_PDF
                        </span>
                      )}
                      {log.actionType === 'VALIDACION_TECNICA' && (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-md text-[10px] font-bold font-mono inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> VALIDACION_TECNICA
                        </span>
                      )}
                      {log.actionType === 'VALIDACION_MEDICA' && (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-md text-[10px] font-bold font-mono inline-flex items-center gap-1">
                          <FileCheck2 className="w-3 h-3" /> VALIDACION_MEDICA
                        </span>
                      )}
                      {log.actionType === 'MODIFICACION_CONSENTIMIENTO' && (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-800 border border-amber-200 rounded-md text-[10px] font-bold font-mono inline-flex items-center gap-1">
                          <Lock className="w-3 h-3" /> CONSENTIMIENTO_LEY81
                        </span>
                      )}
                      {log.actionType === 'INTENTO_ACCESO_DENEGADO' && (
                        <span className="px-2 py-0.5 bg-rose-100 text-rose-800 border border-rose-300 rounded-md text-[10px] font-bold font-mono inline-flex items-center gap-1">
                          <ShieldAlert className="w-3 h-3 text-rose-600" /> ACCESO_DENEGADO
                        </span>
                      )}
                      {log.actionType === 'CAMBIO_TARIFARIO' && (
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-800 border border-slate-200 rounded-md text-[10px] font-bold font-mono">
                          CAMBIO_TARIFARIO
                        </span>
                      )}
                    </td>

                    <td className="p-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                      {log.patientNationalId === 'N/A' ? (
                        <span className="text-slate-400 font-normal">N/A</span>
                      ) : (
                        <div>
                          <div>{maskPatientId(log.patientNationalId)}</div>
                          <div className="text-[10px] text-slate-500 font-sans font-normal">
                            {privacyMaskEnabled ? 'Paciente Protegido' : log.patientName}
                          </div>
                        </div>
                      )}
                    </td>

                    <td className="p-3 font-mono text-[11px] text-slate-600">
                      <div>{maskIpAddress(log.ipAddress)}</div>
                      <div className="text-[10px] text-slate-400 font-sans truncate max-w-[140px]" title={log.location}>
                        {log.location}
                      </div>
                    </td>

                    <td className="p-3 font-mono text-[10px] text-teal-800 truncate max-w-[120px]" title={log.sha256Hash}>
                      <span className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded font-mono">
                        {log.sha256Hash.substring(0, 14)}...
                      </span>
                    </td>

                    <td className="p-3 text-center whitespace-nowrap">
                      <button
                        onClick={() => setSelectedLogForModal(log)}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold rounded-xl transition shadow cursor-pointer inline-flex items-center space-x-1"
                      >
                        <ExternalLink className="w-3 h-3 text-teal-400" />
                        <span>Ver Bloque</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cryptographic Block Detail Modal */}
      {selectedLogForModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 text-white shadow-2xl space-y-5 relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-500/40 text-teal-300 flex items-center justify-center">
                  <Hash className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Prueba Criptográfica del Bloque de Auditoría</h3>
                  <p className="text-xs text-slate-400">Verificación Catenaria SHA-256 según Ley 81 ANTAI</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedLogForModal(null)}
                className="text-slate-400 hover:text-white font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <div>
                  <span className="text-slate-500 font-bold block text-[10px] uppercase">ID Bloque Auditor</span>
                  <span className="font-mono text-teal-300 font-bold text-sm">{selectedLogForModal.id}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold block text-[10px] uppercase">Marca de Tiempo UTC</span>
                  <span className="font-mono text-slate-200">{selectedLogForModal.timestamp}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold block text-[10px] uppercase">Usuario Auditor</span>
                  <span className="font-bold text-white">{selectedLogForModal.userName}</span>
                  <div className="text-[10px] text-slate-400">{selectedLogForModal.userRole}</div>
                </div>
                <div>
                  <span className="text-slate-500 font-bold block text-[10px] uppercase">Origen IP & Geolocalización</span>
                  <span className="font-mono text-slate-200">{selectedLogForModal.ipAddress}</span>
                  <div className="text-[10px] text-slate-400">{selectedLogForModal.location}</div>
                </div>
              </div>

              {/* SHA-256 Block Details */}
              <div className="space-y-2 bg-slate-950 p-4 rounded-2xl border border-teal-500/30">
                <div>
                  <span className="text-teal-400 font-bold block text-[10px] uppercase flex items-center gap-1">
                    <Key className="w-3 h-3" /> Hash SHA-256 del Bloque Actual
                  </span>
                  <div className="font-mono text-[11px] text-teal-300 break-all bg-slate-900 p-2 rounded-lg border border-teal-500/20 mt-1">
                    {selectedLogForModal.sha256Hash}
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 font-bold block text-[10px] uppercase flex items-center gap-1">
                    <History className="w-3 h-3" /> Hash del Bloque Previo (Encadenamiento Catenario)
                  </span>
                  <div className="font-mono text-[10px] text-slate-400 break-all bg-slate-900 p-2 rounded-lg border border-slate-800 mt-1">
                    {selectedLogForModal.prevHash}
                  </div>
                </div>
              </div>

              {/* Ley 81 Compliance Badges */}
              <div className="p-3 bg-teal-500/10 border border-teal-500/20 rounded-2xl space-y-1">
                <div className="font-bold text-xs text-teal-300 flex items-center justify-between">
                  <span>Cumplimiento Ley 81 Panamá (Artículos 8, 14 y 21)</span>
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono rounded-full">
                    CERTIFICADO
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-normal">
                  {selectedLogForModal.details}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 border-t border-slate-800 pt-3">
              <button
                onClick={() => setSelectedLogForModal(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export ANTAI Certificate Modal */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 text-slate-900 shadow-2xl space-y-5 relative">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
                  <FileCheck2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Exportar Certificación de Auditoría ANTAI</h3>
                  <p className="text-xs text-slate-500">Informe para Inspección Oficial de Datos Personales</p>
                </div>
              </div>

              <button
                onClick={() => setIsExportModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between font-bold">
                  <span>Entidad Certificada:</span>
                  <span className="text-slate-900">{tenant.name}</span>
                </div>
                <div className="flex items-center justify-between font-bold">
                  <span>Sede Operativa:</span>
                  <span className="text-slate-900">{branch.name}</span>
                </div>
                <div className="flex items-center justify-between font-bold">
                  <span>Rango de Período Evaluado:</span>
                  <span className="font-mono text-teal-700">01/08/2026 — 11/08/2026</span>
                </div>
                <div className="flex items-center justify-between font-bold">
                  <span>Registros Criptográficos Auditados:</span>
                  <span className="font-mono text-slate-900">{totalLogsCount} Eventos Inmutables</span>
                </div>
              </div>

              <div className="p-3 bg-teal-50 border border-teal-200 text-teal-900 rounded-xl space-y-1 text-[11px]">
                <div className="font-bold flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-teal-700" />
                  <span>Declaración de Privacidad y Consentimiento Ley 81</span>
                </div>
                <p>
                  El informe resultante genera una huella SHA-256 única válida para auditorías regulatorias ante la Autoridad Nacional de Transparencia y Acceso a la Información (ANTAI).
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 border-t border-slate-100 pt-3">
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Cancelar
              </button>

              <button
                onClick={() => {
                  alert('¡Informe Oficial Certificado de Auditoría Ley 81 generado y descargado exitosamente en PDF!');
                  setIsExportModalOpen(false);
                }}
                className="px-5 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-teal-600/20 flex items-center space-x-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Descargar Informe PDF Firmado</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
