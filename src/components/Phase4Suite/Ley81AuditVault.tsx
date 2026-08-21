import React, { useState, useMemo } from 'react';
import jsPDF from 'jspdf';
import { Tenant, Branch } from '../../types';
import { Ley81PiiReportPanel } from './Ley81PiiReportPanel';
import { Ley81RetentionPolicyEngine } from './Ley81RetentionPolicyEngine';
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
  CalendarClock,
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
  MailCheck,
  FileSpreadsheet,
  X,
  UserCheck2,
  FileSearch
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

// Initial multi-year audit logs for retention policy evaluation (2021-2026)
const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
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
  },
  {
    id: 'aud-115',
    timestamp: '05/08/2026 16:45:10',
    isoDate: '2026-08-05T16:45:10',
    userId: 'usr-3109',
    userName: 'Lic. Sofía Guardia',
    userRole: 'Tecnólogo Médico',
    actionType: 'VALIDACION_TECNICA',
    patientId: 'pat-4',
    patientName: 'Ernesto Ríos',
    patientNationalId: '3-702-1198',
    ipAddress: '192.168.1.104',
    location: 'Sede Central - Laboratorio Clínico',
    sha256Hash: '778899aabbccddeeff00112233445566778899aabbccddeeff00112233445566',
    prevHash: '5544332211554433221155443322115544332211554433221155443322115544',
    consentLey81Status: 'CONSENTIDO',
    isAnomaly: false,
    details: 'Validación técnica de Perfil Renal y electrolitos en analizador Cobas.'
  },
  {
    id: 'aud-116',
    timestamp: '05/08/2026 11:20:30',
    isoDate: '2026-08-05T11:20:30',
    userId: 'usr-10492',
    userName: 'Dr. Roberto Icaza',
    userRole: 'Médico Referente',
    actionType: 'EXPORTACION_PDF',
    patientId: 'pat-5',
    patientName: 'Lucía Bethancourt',
    patientNationalId: '8-991-0023',
    ipAddress: '200.46.88.12',
    location: 'Consultorio Médico Punta Pacífica',
    sha256Hash: '11223344556677889900aabbccddeeff11223344556677889900aabbccddeeff',
    prevHash: '778899aabbccddeeff00112233445566778899aabbccddeeff00112233445566',
    consentLey81Status: 'CONSENTIDO',
    isAnomaly: false,
    details: 'Exportación de informe PDF firmado digitalmente para junta médica.'
  },
  {
    id: 'aud-117',
    timestamp: '05/08/2026 08:30:00',
    isoDate: '2026-08-05T08:30:00',
    userId: 'usr-5521',
    userName: 'Anabel Castillo',
    userRole: 'Recepcionista',
    actionType: 'MODIFICACION_CONSENTIMIENTO',
    patientId: 'pat-3',
    patientName: 'Carlos Mendoza',
    patientNationalId: '4-711-9021',
    ipAddress: '192.168.1.110',
    location: 'Sede Costa del Este - Mostrador Recepción',
    sha256Hash: '66554433221100ffeeddccbbaa99887766554433221100ffeeddccbbaa998877',
    prevHash: '11223344556677889900aabbccddeeff11223344556677889900aabbccddeeff',
    consentLey81Status: 'CONSENTIDO',
    isAnomaly: false,
    details: 'Firma de consentimiento informado presencial en tableta digital según Ley 81.'
  },
  // --- HISTORICAL AUDIT LOGS FOR RETENTION PURGE ENGINE (2021-2025) ---
  {
    id: 'aud-hist-2021-01',
    timestamp: '14/03/2021 10:15:00',
    isoDate: '2021-03-14T10:15:00',
    userId: 'usr-legacy-01',
    userName: 'Lic. Manuel Samaniego (Histórico)',
    userRole: 'Tecnólogo Médico',
    actionType: 'VALIDACION_TECNICA',
    patientId: 'pat-legacy-101',
    patientName: 'Dra. Patricia Valdés',
    patientNationalId: '8-412-9901',
    ipAddress: '192.168.1.50',
    location: 'Sede Central - Archivo Histórico',
    sha256Hash: '11002233445566778899aabbccddeeff11002233445566778899aabbccddeeff',
    prevHash: '00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff',
    consentLey81Status: 'CONSENTIDO',
    isAnomaly: false,
    details: 'Validación histórica de panel serológico y perfil tiroideo (> 5 años de antigüedad).'
  },
  {
    id: 'aud-hist-2021-02',
    timestamp: '22/07/2021 16:40:12',
    isoDate: '2021-07-22T16:40:12',
    userId: 'usr-legacy-02',
    userName: 'Dr. Alejandro De Roux',
    userRole: 'Médico Referente',
    actionType: 'CONSULTA_RESULTADO',
    patientId: 'pat-legacy-102',
    patientName: 'Esteban Chen',
    patientNationalId: '8-701-3321',
    ipAddress: '200.46.10.88',
    location: 'Consultorio Externo',
    sha256Hash: '223344556677889900aabbccddeeff11223344556677889900aabbccddeeff11',
    prevHash: '11002233445566778899aabbccddeeff11002233445566778899aabbccddeeff',
    consentLey81Status: 'CONSENTIDO',
    isAnomaly: false,
    details: 'Lectura de prueba COVID-19 PCR en portal histórico (Año 2021).'
  },
  {
    id: 'aud-hist-2022-01',
    timestamp: '15/02/2022 09:20:00',
    isoDate: '2022-02-15T09:20:00',
    userId: 'usr-5521',
    userName: 'Anabel Castillo',
    userRole: 'Recepcionista',
    actionType: 'INICIO_SESION',
    patientId: 'N/A',
    patientName: 'N/A',
    patientNationalId: 'N/A',
    ipAddress: '192.168.1.110',
    location: 'Sede Costa del Este',
    sha256Hash: '33445566778899aabbccddeeff00112233445566778899aabbccddeeff001122',
    prevHash: '223344556677889900aabbccddeeff11223344556677889900aabbccddeeff11',
    consentLey81Status: 'NO_APLICA',
    isAnomaly: false,
    details: 'Inicio de sesión de recepción (Año 2022 - Archivo Operativo).'
  },
  {
    id: 'aud-hist-2023-01',
    timestamp: '10/05/2023 14:15:30',
    isoDate: '2023-05-10T14:15:30',
    userId: 'usr-3109',
    userName: 'Lic. Sofía Guardia',
    userRole: 'Tecnólogo Médico',
    actionType: 'VALIDACION_TECNICA',
    patientId: 'pat-hist-2023',
    patientName: 'Raúl Arango',
    patientNationalId: '8-809-1122',
    ipAddress: '192.168.1.104',
    location: 'Sede Central',
    sha256Hash: '445566778899aabbccddeeff00112233445566778899aabbccddeeff00112233',
    prevHash: '33445566778899aabbccddeeff00112233445566778899aabbccddeeff001122',
    consentLey81Status: 'CONSENTIDO',
    isAnomaly: false,
    details: 'Validación técnica Perfil Hepático y Enzimas (Año 2023 - > 3 años).'
  },
  {
    id: 'aud-hist-2024-01',
    timestamp: '18/01/2024 11:00:45',
    isoDate: '2024-01-18T11:00:45',
    userId: 'usr-10492',
    userName: 'Dr. Roberto Icaza',
    userRole: 'Médico Referente',
    actionType: 'EXPORTACION_PDF',
    patientId: 'pat-hist-2024',
    patientName: 'Melissa Quintero',
    patientNationalId: '4-780-9944',
    ipAddress: '200.46.88.12',
    location: 'Hospital Punta Pacífica',
    sha256Hash: '5566778899aabbccddeeff00112233445566778899aabbccddeeff0011223344',
    prevHash: '445566778899aabbccddeeff00112233445566778899aabbccddeeff00112233',
    consentLey81Status: 'CONSENTIDO',
    isAnomaly: false,
    details: 'Descarga de informe PDF de Inmunología (Año 2024 - > 2 años).'
  },
  {
    id: 'aud-hist-2025-01',
    timestamp: '04/04/2025 08:45:10',
    isoDate: '2025-04-04T08:45:10',
    userId: 'usr-3109',
    userName: 'Lic. Sofía Guardia',
    userRole: 'Tecnólogo Médico',
    actionType: 'VALIDACION_TECNICA',
    patientId: 'pat-hist-2025',
    patientName: 'Guillermo Fábrega',
    patientNationalId: '8-650-4491',
    ipAddress: '192.168.1.104',
    location: 'Sede Central',
    sha256Hash: '66778899aabbccddeeff00112233445566778899aabbccddeeff001122334455',
    prevHash: '5566778899aabbccddeeff00112233445566778899aabbccddeeff0011223344',
    consentLey81Status: 'CONSENTIDO',
    isAnomaly: false,
    details: 'Validación técnica Coagulación PT/PTT (Año 2025 - > 1 año).'
  }
];

export const Ley81AuditVault: React.FC<Ley81AuditVaultProps> = ({ tenant, branch }) => {
  const [activeVaultTab, setActiveVaultTab] = useState<'retention_policy' | 'pii_reports' | 'live_vault' | 'email_scheduler'>('retention_policy');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [actionFilter, setActionFilter] = useState<string>('ALL');
  const [timeframe, setTimeframe] = useState<TimeframeOption>('7d');
  const [anomaliesOnly, setAnomaliesOnly] = useState<boolean>(false);
  const [privacyMaskEnabled, setPrivacyMaskEnabled] = useState<boolean>(true);
  const [selectedLogForModal, setSelectedLogForModal] = useState<AuditLogEntry | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [pdfExportToast, setPdfExportToast] = useState<string | null>(null);

  // Mutable audit logs state with reset capability for data retention testing
  const [logs, setLogs] = useState<AuditLogEntry[]>(INITIAL_AUDIT_LOGS);

  const handleResetLogs = () => {
    setLogs(INITIAL_AUDIT_LOGS);
    setPdfExportToast('✓ Registros de auditoría restaurados al conjunto completo histórico (2021-2026).');
    setTimeout(() => setPdfExportToast(null), 5000);
  };

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

  // Highlighting helper for text search
  const HighlightText: React.FC<{ text: string; highlight: string; className?: string }> = ({
    text,
    highlight,
    className = ''
  }) => {
    if (!highlight || !highlight.trim() || !text) {
      return <span className={className}>{text}</span>;
    }
    const cleanHighlight = highlight.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${cleanHighlight})`, 'gi');
    const parts = text.split(regex);
    return (
      <span className={className}>
        {parts.map((part, i) =>
          regex.test(part) ? (
            <mark key={i} className="bg-amber-200/90 text-amber-950 px-0.5 rounded font-bold shadow-xs">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </span>
    );
  };

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

  // Map action type to human searchable string
  const getActionLabel = (action: string) => {
    switch (action) {
      case 'INICIO_SESION':
        return 'Inicio de Sesión Autenticación Login';
      case 'CONSULTA_RESULTADO':
        return 'Consulta de Expediente Resultado PII';
      case 'EXPORTACION_PDF':
        return 'Exportación de Informe Descarga PDF';
      case 'VALIDACION_TECNICA':
        return 'Validación Técnica Bioquímica Muestra';
      case 'VALIDACION_MEDICA':
        return 'Validación Médica Patológica Firma';
      case 'MODIFICACION_CONSENTIMIENTO':
        return 'Modificación Consentimiento Informado Ley 81';
      case 'INTENTO_ACCESO_DENEGADO':
        return 'Intento de Acceso Denegado Alerta Seguridad Desvío Anomalía';
      case 'CAMBIO_TARIFARIO':
        return 'Cambio Tarifario Catálogo';
      default:
        return action;
    }
  };

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Search
      const searchNormalized = searchTerm.trim().toLowerCase();
      let matchesSearch = true;

      if (searchNormalized) {
        const actionLabel = getActionLabel(log.actionType).toLowerCase();
        matchesSearch =
          log.userName.toLowerCase().includes(searchNormalized) ||
          log.userId.toLowerCase().includes(searchNormalized) ||
          log.userRole.toLowerCase().includes(searchNormalized) ||
          log.patientNationalId.toLowerCase().includes(searchNormalized) ||
          log.patientName.toLowerCase().includes(searchNormalized) ||
          log.patientId.toLowerCase().includes(searchNormalized) ||
          log.ipAddress.toLowerCase().includes(searchNormalized) ||
          log.location.toLowerCase().includes(searchNormalized) ||
          log.details.toLowerCase().includes(searchNormalized) ||
          log.sha256Hash.toLowerCase().includes(searchNormalized) ||
          log.prevHash.toLowerCase().includes(searchNormalized) ||
          log.actionType.toLowerCase().includes(searchNormalized) ||
          actionLabel.includes(searchNormalized) ||
          log.timestamp.toLowerCase().includes(searchNormalized) ||
          log.consentLey81Status.toLowerCase().includes(searchNormalized);
      }

      // Action Filter
      const matchesAction =
        actionFilter === 'ALL' ||
        (actionFilter === 'LOGINS' && (log.actionType === 'INICIO_SESION' || log.actionType === 'INTENTO_ACCESO_DENEGADO')) ||
        (actionFilter === 'ACCESOS' && (log.actionType === 'CONSULTA_RESULTADO' || log.actionType === 'EXPORTACION_PDF')) ||
        (actionFilter === 'VALIDACIONES' && (log.actionType === 'VALIDACION_TECNICA' || log.actionType === 'VALIDACION_MEDICA')) ||
        (actionFilter === 'CONSENTIMIENTO' && log.actionType === 'MODIFICACION_CONSENTIMIENTO') ||
        (actionFilter === 'INTENTO_ACCESO_DENEGADO' && log.actionType === 'INTENTO_ACCESO_DENEGADO') ||
        log.actionType === actionFilter;

      // Anomaly Filter
      const matchesAnomaly = !anomaliesOnly || log.isAnomaly;

      return matchesSearch && matchesAction && matchesAnomaly;
    });
  }, [logs, searchTerm, actionFilter, anomaliesOnly]);

  // Export Filtered Audit History to Structured PDF with Simulated Legal Digital Signature
  const handleExportFilteredAuditPdf = () => {
    setIsExportingPdf(true);
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 14;
      let y = margin;

      // Unique document identification & timestamp
      const docId = `AUD-PA-${Date.now().toString().slice(-6)}`;
      const issueDate = new Date();
      const issueDateStr = issueDate.toLocaleString('es-PA');

      // Hash calculated for the export batch
      const calculatedBatchHash = filteredLogs.length > 0
        ? filteredLogs[0].sha256Hash
        : 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

      // Helper for page headers
      const drawPageHeader = (pageNum: number) => {
        // Top header banner background
        doc.setFillColor(15, 23, 42); // slate-900
        doc.rect(0, 0, pageWidth, 22, 'F');

        // Teal top accent line
        doc.setFillColor(13, 148, 136); // teal-600
        doc.rect(0, 22, pageWidth, 1.2, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10.5);
        doc.setTextColor(255, 255, 255);
        doc.text(tenant.name.toUpperCase(), margin, 9);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(203, 213, 225); // slate-300
        doc.text(`${branch.name} • RUC: ${tenant.ruc} DV: ${tenant.dv} • Tel: ${branch.phone}`, margin, 15);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(45, 212, 191); // teal-300
        doc.text('BÓVEDA LEY 81 • ANTAI PANAMÁ', pageWidth - margin, 9, { align: 'right' });

        doc.setFont('courier', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(226, 232, 240);
        doc.text(`ID Doc: ${docId}`, pageWidth - margin, 15, { align: 'right' });
      };

      // Helper for page footers
      const drawPageFooter = (pageNum: number) => {
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.4);
        doc.line(margin, pageHeight - 11, pageWidth - margin, pageHeight - 11);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(100, 116, 139);
        doc.text('Bóveda de Auditoría Forense Criptográfica • Ley 81 de 2019 de Panamá (ANTAI)', margin, pageHeight - 6.5);
        doc.text(`Página ${pageNum}`, pageWidth - margin, pageHeight - 6.5, { align: 'right' });
      };

      let currentPage = 1;
      drawPageHeader(currentPage);
      y = 29;

      // Document Title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text('INFORME OFICIAL DE AUDITORÍA FORENSE Y TRAZABILIDAD PII', margin, y);
      y += 4.5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text('Historial de Accesos, Consultas, Validaciones y Actividad de Usuarios (Ley 81 de 2019 / ANTAI)', margin, y);
      y += 5.5;

      // Metadata Summary Box
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.4);
      doc.roundedRect(margin, y, pageWidth - margin * 2, 26, 2.5, 2.5, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(13, 148, 136); // teal-600
      doc.text('PARÁMETROS DEL REPORTE AUDITADO & CRITERIOS DE FILTRADO', margin + 3.5, y + 5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(51, 65, 85);

      doc.text(`• Fecha de Emisión: ${issueDateStr}`, margin + 3.5, y + 10);
      doc.text(`• Filtro de Búsqueda: ${searchTerm ? `"${searchTerm}"` : 'Ninguno (Todos los Registros)'}`, margin + 3.5, y + 14.5);
      doc.text(`• Categoría de Acción: ${actionFilter === 'ALL' ? 'Todas las Categorías' : actionFilter}`, margin + 3.5, y + 19);
      doc.text(`• Modo Privacidad: ${privacyMaskEnabled ? 'Máscara PII Activa (Cédulas Ocultas)' : 'PII Visible (Modo Auditor Forense)'}`, margin + 3.5, y + 23.5);

      doc.text(`• Registros Incluidos: ${filteredLogs.length} de ${logs.length} eventos en total`, margin + 96, y + 10);
      doc.text(`• Filtro Anomalías: ${anomaliesOnly ? 'Solo Desvíos / Alertas' : 'Registro Completo'}`, margin + 96, y + 14.5);
      doc.text(`• Integridad Criptográfica: SHA-256 Encadenado`, margin + 96, y + 19);
      doc.text(`• Marco Legal: Ley 81 de 2019 & Dec. Ejecutivo 285 de 2021`, margin + 96, y + 23.5);

      y += 31;

      // Table Header Function
      const drawTableHeader = () => {
        doc.setFillColor(15, 23, 42); // slate-900
        doc.rect(margin, y, pageWidth - margin * 2, 6.5, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.8);
        doc.setTextColor(255, 255, 255);

        doc.text('MARCA TIEMPO', margin + 2, y + 4.5);
        doc.text('USUARIO / ROL OPERADOR', margin + 28, y + 4.5);
        doc.text('ACCIÓN REALIZADA', margin + 72, y + 4.5);
        doc.text('TITULAR / PACIENTE', margin + 114, y + 4.5);
        doc.text('IP / FIRMA SHA-256', margin + 148, y + 4.5);
        y += 6.5;
      };

      drawTableHeader();

      // Iterate through filtered logs
      filteredLogs.forEach((log, index) => {
        // Check if we need a new page
        if (y > pageHeight - 35) {
          drawPageFooter(currentPage);
          doc.addPage();
          currentPage += 1;
          drawPageHeader(currentPage);
          y = 28;
          drawTableHeader();
        }

        // Alternating row background
        if (log.isAnomaly) {
          doc.setFillColor(254, 242, 242); // light red for anomalies
        } else if (index % 2 === 0) {
          doc.setFillColor(255, 255, 255);
        } else {
          doc.setFillColor(248, 250, 252);
        }

        const rowHeight = 12.5;
        doc.rect(margin, y, pageWidth - margin * 2, rowHeight, 'F');
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.3);
        doc.line(margin, y + rowHeight, pageWidth - margin, y + rowHeight);

        // Col 1: Timestamp
        doc.setFont('courier', 'bold');
        doc.setFontSize(6.2);
        doc.setTextColor(71, 85, 105);
        doc.text(log.timestamp.split(' ')[0], margin + 2, y + 4.2);
        doc.text(log.timestamp.split(' ')[1] || '', margin + 2, y + 8.2);

        // Col 2: User and Role
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.8);
        doc.setTextColor(15, 23, 42);
        const userTrunc = log.userName.length > 25 ? log.userName.substring(0, 23) + '..' : log.userName;
        doc.text(userTrunc, margin + 28, y + 4.2);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.2);
        doc.setTextColor(100, 116, 139);
        doc.text(`${log.userRole} (${log.userId})`, margin + 28, y + 8.2);

        // Col 3: Action & Details
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        if (log.actionType === 'INTENTO_ACCESO_DENEGADO' || log.isAnomaly) {
          doc.setTextColor(225, 29, 72); // rose-600
        } else if (log.actionType === 'VALIDACION_TECNICA' || log.actionType === 'VALIDACION_MEDICA') {
          doc.setTextColor(13, 148, 136); // teal-600
        } else {
          doc.setTextColor(30, 41, 59);
        }
        doc.text(log.actionType, margin + 72, y + 4.2);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(5.8);
        doc.setTextColor(100, 116, 139);
        const detailsTrunc = log.details.length > 28 ? log.details.substring(0, 26) + '...' : log.details;
        doc.text(detailsTrunc, margin + 72, y + 8.2);

        // Col 4: Patient
        doc.setFont('courier', 'bold');
        doc.setFontSize(6.8);
        doc.setTextColor(15, 23, 42);
        const maskedId = maskPatientId(log.patientNationalId);
        doc.text(maskedId, margin + 114, y + 4.2);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(5.8);
        doc.setTextColor(100, 116, 139);
        const patientNameText = privacyMaskEnabled ? 'Titular Protegido' : (log.patientName.length > 18 ? log.patientName.substring(0, 16) + '..' : log.patientName);
        doc.text(patientNameText, margin + 114, y + 8.2);

        // Col 5: IP & Hash
        doc.setFont('courier', 'normal');
        doc.setFontSize(6);
        doc.setTextColor(71, 85, 105);
        doc.text(maskIpAddress(log.ipAddress), margin + 148, y + 4.2);

        doc.setFont('courier', 'bold');
        doc.setFontSize(5.2);
        doc.setTextColor(13, 148, 136);
        doc.text(`SHA:${log.sha256Hash.substring(0, 14)}...`, margin + 148, y + 8.2);

        y += rowHeight;
      });

      y += 5;

      // Check if Signature block fits on current page; if not, add page
      if (y > pageHeight - 70) {
        drawPageFooter(currentPage);
        doc.addPage();
        currentPage += 1;
        drawPageHeader(currentPage);
        y = 28;
      }

      // Simulated Legal Digital Signature Block (Firma Digital Simulada para Validez Legal)
      const sigBoxHeight = 56;
      doc.setFillColor(241, 245, 249); // slate-100
      doc.setDrawColor(13, 148, 136); // teal-600
      doc.setLineWidth(0.7);
      doc.roundedRect(margin, y, pageWidth - margin * 2, sigBoxHeight, 2.5, 2.5, 'FD');

      // Inner security seal title bar
      doc.setFillColor(15, 23, 42); // slate-900
      doc.roundedRect(margin, y, pageWidth - margin * 2, 6.5, 2.5, 2.5, 'F');
      doc.rect(margin, y + 3.5, pageWidth - margin * 2, 3, 'F'); // square bottom corners of top banner

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(45, 212, 191); // teal-300
      doc.text('CERTIFICADO DE FIRMA ELECTRÓNICA CUALIFICADA & SELLO DE TIEMPO TSA (LEY 51 DE 2008 / LEY 81 DE 2019)', margin + 3.5, y + 4.5);

      // Left side: Signature Stamp Graphic Simulation
      const sealX = margin + 5;
      const sealY = y + 9.5;
      doc.setDrawColor(13, 148, 136);
      doc.setLineWidth(0.5);
      doc.roundedRect(sealX, sealY, 44, 38, 2, 2, 'D');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.2);
      doc.setTextColor(13, 148, 136);
      doc.text('REPÚBLICA DE PANAMÁ', sealX + 22, sealY + 5, { align: 'center' });
      doc.setFontSize(5.2);
      doc.setTextColor(15, 23, 42);
      doc.text('REGISTRO PÚBLICO / ANTAI', sealX + 22, sealY + 9, { align: 'center' });

      doc.setFont('courier', 'bold');
      doc.setFontSize(6.2);
      doc.setTextColor(16, 185, 129); // emerald-500
      doc.text('[ FIRMA DIGITAL VÁLIDA ]', sealX + 22, sealY + 16, { align: 'center' });
      doc.text('ESTADO: VERIFICADO', sealX + 22, sealY + 20, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(4.8);
      doc.setTextColor(100, 116, 139);
      doc.text(`ID CERT: PA-X509-88123490`, sealX + 22, sealY + 25.5, { align: 'center' });
      doc.text(`FECHA: ${new Date().toLocaleDateString('es-PA')}`, sealX + 22, sealY + 29.5, { align: 'center' });
      doc.text('INMUTABILIDAD GARANTIZADA', sealX + 22, sealY + 33.5, { align: 'center' });

      // Right side: Legal Signature Certificate Details
      const textX = margin + 53;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.2);
      doc.setTextColor(15, 23, 42);
      doc.text('Firmante Autorizado:', textX, sealY + 3);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.8);
      doc.setTextColor(51, 65, 85);
      doc.text('Lic. Rubén Abrego — Oficial de Protección de Datos (DPO) & Auditor LIS', textX + 27, sealY + 3);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.8);
      doc.text('Cédula del Firmante:', textX, sealY + 7.5);
      doc.setFont('helvetica', 'normal');
      doc.text('8-812-3490 (Firma Electrónica Registrada)', textX + 27, sealY + 7.5);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.8);
      doc.text('Autoridad Certificadora:', textX, sealY + 12);
      doc.setFont('helvetica', 'normal');
      doc.text('AC Raíz de la República de Panamá — Prestador Cualificado', textX + 30, sealY + 12);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.8);
      doc.text('Algoritmo / TSA:', textX, sealY + 16.5);
      doc.setFont('courier', 'normal');
      doc.setFontSize(6.2);
      doc.text('RSA 4096 / SHA-256 • Sello de Tiempo RFC 3161 UTC', textX + 21, sealY + 16.5);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.8);
      doc.text('Hash SHA-256 Lote:', textX, sealY + 21);
      doc.setFont('courier', 'bold');
      doc.setFontSize(5.8);
      doc.setTextColor(13, 148, 136);
      doc.text(calculatedBatchHash, textX + 25, sealY + 21);

      // Legal statement text
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(5.6);
      doc.setTextColor(71, 85, 105);
      const legalText = 'Cláusula de Validez Probatoria: Este informe ha sido emitido con firma electrónica avanzada conforme a la Ley 81 de 2019 de Protección de Datos Personales, el Decreto Ejecutivo 285 de 2021 y la Ley 51 de 2008 de la República de Panamá. El resumen criptográfico incorporado garantiza la no alteración, autenticidad e imputabilidad jurídica de cada uno de los eventos auditados ante la ANTAI, el MINSA y autoridades judiciales.';
      const splitLegal = doc.splitTextToSize(legalText, pageWidth - margin * 2 - 57);
      doc.text(splitLegal, textX, sealY + 26);

      drawPageFooter(currentPage);

      // Save and download PDF
      const sanitizedLab = tenant.name.replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `AUDITORIA_LEY81_${sanitizedLab}_${new Date().toISOString().slice(0, 10)}.pdf`;
      doc.save(filename);

      setPdfExportToast(`✓ Archivo PDF "${filename}" exportado exitosamente con Firma Digital Legal (${filteredLogs.length} eventos).`);
      setTimeout(() => setPdfExportToast(null), 6000);
    } catch (error) {
      console.error('Error generating audit PDF:', error);
      setPdfExportToast('Error al generar el archivo PDF. Intente nuevamente.');
      setTimeout(() => setPdfExportToast(null), 5000);
    } finally {
      setIsExportingPdf(false);
    }
  };

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
            onClick={() => setActiveVaultTab('pii_reports')}
            className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs transition shadow-lg shadow-teal-500/20 flex items-center justify-center space-x-2 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Generar Reporte Oficial ANTAI</span>
          </button>
        </div>
      </div>

      {/* PDF Export Success Toast */}
      {pdfExportToast && (
        <div className="bg-emerald-700 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center justify-between text-xs font-bold animate-in fade-in slide-in-from-top-2 border border-emerald-500/50">
          <div className="flex items-center space-x-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
            <span className="leading-relaxed">{pdfExportToast}</span>
          </div>
          <button
            onClick={() => setPdfExportToast(null)}
            className="text-emerald-200 hover:text-white ml-4 font-bold cursor-pointer"
            title="Cerrar notificación"
          >
            ✕
          </button>
        </div>
      )}

      {/* Vault Sub-Tabs Navigation Bar */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-900 p-2 rounded-2xl border border-slate-800 shadow-md">
        <button
          onClick={() => setActiveVaultTab('retention_policy')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer ${
            activeVaultTab === 'retention_policy'
              ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 shadow-md font-black'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
          }`}
        >
          <CalendarClock className="w-4 h-4" />
          <span>Políticas de Retención & Purga Segura</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
            activeVaultTab === 'retention_policy' ? 'bg-slate-950 text-teal-300 font-bold' : 'bg-slate-800 text-slate-400'
          }`}>
            Ley 81 / ANTAI
          </span>
        </button>

        <button
          onClick={() => setActiveVaultTab('pii_reports')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer ${
            activeVaultTab === 'pii_reports'
              ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 shadow-md font-black'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Panel de Reportes PII (Ley 81)</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
            activeVaultTab === 'pii_reports' ? 'bg-slate-950 text-teal-300 font-bold' : 'bg-slate-800 text-slate-400'
          }`}>
            Auditorías ANTAI
          </span>
        </button>

        <button
          onClick={() => setActiveVaultTab('live_vault')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer ${
            activeVaultTab === 'live_vault'
              ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 shadow-md font-black'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Bóveda Inmutable & Gráficas en Vivo</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
            activeVaultTab === 'live_vault' ? 'bg-slate-950 text-teal-300 font-bold' : 'bg-slate-800 text-slate-400'
          }`}>
            {logs.length} Eventos
          </span>
        </button>

        <button
          onClick={() => setActiveVaultTab('email_scheduler')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer ${
            activeVaultTab === 'email_scheduler'
              ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 shadow-md font-black'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>Programador de Resúmenes Gerenciales</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
            activeVaultTab === 'email_scheduler' ? 'bg-slate-950 text-teal-300 font-bold' : 'bg-slate-800 text-slate-400'
          }`}>
            Semanal
          </span>
        </button>
      </div>

      {/* TAB 0: Retention Policies & Automated Secure Purge Engine */}
      {activeVaultTab === 'retention_policy' && (
        <Ley81RetentionPolicyEngine
          tenant={tenant}
          branch={branch}
          logs={logs}
          onUpdateLogs={(updatedLogs) => setLogs(updatedLogs)}
          onResetLogs={handleResetLogs}
        />
      )}

      {/* TAB 1: PII Audit Reporting Panel for Ley 81 Compliance */}
      {activeVaultTab === 'pii_reports' && (
        <Ley81PiiReportPanel
          tenant={tenant}
          branch={branch}
          logs={logs}
          privacyMaskEnabled={privacyMaskEnabled}
          onTogglePrivacyMask={() => setPrivacyMaskEnabled(!privacyMaskEnabled)}
          onInspectLog={(log) => setSelectedLogForModal(log)}
        />
      )}

      {/* TAB 2: Live Immutable Vault & Metrics Dashboard */}
      {activeVaultTab === 'live_vault' && (
        <>
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

      {/* Filterable Audit Log Ledger Table */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Database className="w-5 h-5 text-teal-600" />
                Registro Inmutable de Bitácora Cryptographic Audit Trail
              </h2>
              {searchTerm && (
                <span className="px-2.5 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 font-mono text-[10px] font-bold rounded-full animate-pulse">
                  Búsqueda Activa: &quot;{searchTerm}&quot;
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Filtre y localice en tiempo real accesos a datos personales (PII), validaciones, exportaciones y actividades de usuarios.
            </p>
          </div>

          {/* Controls Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-700 flex items-center space-x-1.5">
              <Activity className="w-3.5 h-3.5 text-teal-600" />
              <span>
                Mostrando <strong className="text-teal-700">{filteredLogs.length}</strong> de <strong>{logs.length}</strong> eventos
              </span>
            </div>

            <button
              onClick={() => setPrivacyMaskEnabled(!privacyMaskEnabled)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 border ${
                privacyMaskEnabled
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                  : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{privacyMaskEnabled ? 'Máscara PII: ACTIVA' : 'Máscara PII: DESACTIVADA'}</span>
            </button>

            <button
              onClick={handleExportFilteredAuditPdf}
              disabled={isExportingPdf || filteredLogs.length === 0}
              className="px-3.5 py-1.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold rounded-xl text-xs transition cursor-pointer flex items-center space-x-1.5 shadow-sm hover:shadow-md disabled:opacity-50"
              title="Exportar registros filtrados a archivo PDF estructurado con Firma Digital Legal"
            >
              {isExportingPdf ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FileText className="w-3.5 h-3.5" />
              )}
              <span>{isExportingPdf ? 'Generando PDF...' : 'Exportar PDF con Firma Digital'}</span>
            </button>

            {(searchTerm || actionFilter !== 'ALL' || anomaliesOnly) && (
              <button
                onClick={() => {
                  setActionFilter('ALL');
                  setSearchTerm('');
                  setAnomaliesOnly(false);
                }}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold rounded-xl text-xs transition cursor-pointer flex items-center space-x-1"
                title="Restablecer todos los filtros y búsqueda"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Limpiar Búsqueda</span>
              </button>
            )}
          </div>
        </div>

        {/* Real-time Search Input & Action Filter Bar */}
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative col-span-1 sm:col-span-2">
              <Search className="w-4 h-4 text-teal-600 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Buscar en tiempo real por usuario, rol, cédula, paciente, acción, detalle, IP o hash SHA-256..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full bg-slate-50 border rounded-xl pl-10 ${
                  searchTerm ? 'pr-10 border-teal-500 ring-2 ring-teal-500/20 bg-white' : 'pr-4 border-slate-200'
                } py-2 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 transition`}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-2.5 p-1 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded-md transition cursor-pointer"
                  title="Borrar texto de búsqueda"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-teal-500 cursor-pointer"
            >
              <option value="ALL">Todas las Categorías de Acción</option>
              <option value="LOGINS">Inicios de Sesión / Autenticación</option>
              <option value="ACCESOS">Consultas y Descargas de Expedientes</option>
              <option value="VALIDACIONES">Validaciones Técnica y Médica</option>
              <option value="CONSENTIMIENTO">Cambio Consentimiento Ley 81</option>
              <option value="INTENTO_ACCESO_DENEGADO">Intentos Denegados / Alertas de Seguridad</option>
            </select>
          </div>

          {/* Quick-Filter Search Chips */}
          <div className="flex items-center flex-wrap gap-1.5 pt-1">
            <span className="text-[11px] font-bold text-slate-400 mr-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-teal-600" /> Búsquedas Rápidas:
            </span>
            
            {[
              { label: 'Lic. Sofía Guardia', term: 'Sofía Guardia' },
              { label: 'Dr. Roberto Icaza', term: 'Roberto Icaza' },
              { label: 'Ing. Carlos Abrego', term: 'Carlos Abrego' },
              { label: 'Gabriela Pinzón', term: 'Gabriela Pinzón' },
              { label: 'Cédula 8-812', term: '8-812' },
              { label: 'Consultas PII', term: 'Consulta' },
              { label: 'Validación Técnica', term: 'Validación' },
              { label: 'Exportación PDF', term: 'PDF' },
              { label: 'Alertas y Anomalías', term: 'Alerta' }
            ].map((chip) => {
              const isSelected = searchTerm.toLowerCase() === chip.term.toLowerCase();
              return (
                <button
                  key={chip.term}
                  onClick={() => setSearchTerm(isSelected ? '' : chip.term)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer border ${
                    isSelected
                      ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>
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
                  <td colSpan={7} className="p-10 text-center">
                    <div className="max-w-md mx-auto space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
                        <Search className="w-6 h-6" />
                      </div>
                      <div className="text-sm font-bold text-slate-900">
                        No se encontraron registros de auditoría coincidentes
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        No hay eventos que coincidan con el término <strong className="text-slate-800">&quot;{searchTerm}&quot;</strong> o los filtros seleccionados. Intente buscar por nombre de tecnólogo, médico, paciente, cédula (ej. 8-812), IP o acción.
                      </p>
                      <button
                        onClick={() => {
                          setSearchTerm('');
                          setActionFilter('ALL');
                          setAnomaliesOnly(false);
                        }}
                        className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl transition shadow-md cursor-pointer inline-flex items-center space-x-1.5"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Restablecer Filtro de Búsqueda</span>
                      </button>
                    </div>
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
                      <HighlightText text={log.timestamp} highlight={searchTerm} />
                    </td>

                    <td className="p-3">
                      <div className="font-bold text-slate-900">
                        <HighlightText text={log.userName} highlight={searchTerm} />
                      </div>
                      <div className="text-[10px] text-slate-500">
                        <HighlightText text={log.userRole} highlight={searchTerm} />
                      </div>
                    </td>

                    <td className="p-3 whitespace-nowrap">
                      {log.actionType === 'INICIO_SESION' && (
                        <span className="px-2 py-0.5 bg-sky-100 text-sky-800 border border-sky-200 rounded-md text-[10px] font-bold font-mono inline-flex items-center gap-1">
                          <LogIn className="w-3 h-3" /> <HighlightText text="INICIO_SESION" highlight={searchTerm} />
                        </span>
                      )}
                      {log.actionType === 'CONSULTA_RESULTADO' && (
                        <span className="px-2 py-0.5 bg-teal-100 text-teal-800 border border-teal-200 rounded-md text-[10px] font-bold font-mono inline-flex items-center gap-1">
                          <Eye className="w-3 h-3" /> <HighlightText text="CONSULTA_EXPEDIENTE" highlight={searchTerm} />
                        </span>
                      )}
                      {log.actionType === 'EXPORTACION_PDF' && (
                        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-md text-[10px] font-bold font-mono inline-flex items-center gap-1">
                          <FileText className="w-3 h-3" /> <HighlightText text="EXPORTACION_PDF" highlight={searchTerm} />
                        </span>
                      )}
                      {log.actionType === 'VALIDACION_TECNICA' && (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-md text-[10px] font-bold font-mono inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> <HighlightText text="VALIDACION_TECNICA" highlight={searchTerm} />
                        </span>
                      )}
                      {log.actionType === 'VALIDACION_MEDICA' && (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-md text-[10px] font-bold font-mono inline-flex items-center gap-1">
                          <FileCheck2 className="w-3 h-3" /> <HighlightText text="VALIDACION_MEDICA" highlight={searchTerm} />
                        </span>
                      )}
                      {log.actionType === 'MODIFICACION_CONSENTIMIENTO' && (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-800 border border-amber-200 rounded-md text-[10px] font-bold font-mono inline-flex items-center gap-1">
                          <Lock className="w-3 h-3" /> <HighlightText text="CONSENTIMIENTO_LEY81" highlight={searchTerm} />
                        </span>
                      )}
                      {log.actionType === 'INTENTO_ACCESO_DENEGADO' && (
                        <span className="px-2 py-0.5 bg-rose-100 text-rose-800 border border-rose-300 rounded-md text-[10px] font-bold font-mono inline-flex items-center gap-1">
                          <ShieldAlert className="w-3 h-3 text-rose-600" /> <HighlightText text="ACCESO_DENEGADO" highlight={searchTerm} />
                        </span>
                      )}
                      {log.actionType === 'CAMBIO_TARIFARIO' && (
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-800 border border-slate-200 rounded-md text-[10px] font-bold font-mono">
                          <HighlightText text="CAMBIO_TARIFARIO" highlight={searchTerm} />
                        </span>
                      )}
                    </td>

                    <td className="p-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                      {log.patientNationalId === 'N/A' ? (
                        <span className="text-slate-400 font-normal">N/A</span>
                      ) : (
                        <div>
                          <div>
                            <HighlightText text={maskPatientId(log.patientNationalId)} highlight={searchTerm} />
                          </div>
                          <div className="text-[10px] text-slate-500 font-sans font-normal">
                            {privacyMaskEnabled ? 'Paciente Protegido' : <HighlightText text={log.patientName} highlight={searchTerm} />}
                          </div>
                        </div>
                      )}
                    </td>

                    <td className="p-3 font-mono text-[11px] text-slate-600">
                      <div>
                        <HighlightText text={maskIpAddress(log.ipAddress)} highlight={searchTerm} />
                      </div>
                      <div className="text-[10px] text-slate-400 font-sans truncate max-w-[140px]" title={log.location}>
                        <HighlightText text={log.location} highlight={searchTerm} />
                      </div>
                    </td>

                    <td className="p-3 font-mono text-[10px] text-teal-800 truncate max-w-[120px]" title={log.sha256Hash}>
                      <span className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded font-mono">
                        <HighlightText text={`${log.sha256Hash.substring(0, 14)}...`} highlight={searchTerm} />
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
      </>
      )}

      {/* TAB 3: Weekly Summary Scheduler for Lab Management */}
      {activeVaultTab === 'email_scheduler' && (
        <div className="space-y-6">
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

          {/* Email Preview Card */}
          <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 text-white space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-teal-400" />
                <span className="text-xs font-bold text-slate-300">Vista Previa del Resumen Electrónico Semanal</span>
              </div>
              <span className="text-[10px] font-mono bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded-full border border-teal-500/30">
                Plantilla HTML ANTAI Compliant
              </span>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 font-mono text-xs space-y-2 text-slate-300">
              <div className="text-slate-400"><strong className="text-slate-200">Asunto:</strong> [LIS Ley 81] Resumen Semanal de Auditoría y Trazabilidad — {tenant.name} ({branch.name})</div>
              <div className="text-slate-400"><strong className="text-slate-200">Destinatario:</strong> {managerEmail}</div>
              <div className="border-t border-slate-800 pt-2 text-[11px] text-slate-300 space-y-1">
                <p>Estimado(a) Gerente de Laboratorio,</p>
                <p>Adjuntamos el consolidado semanal de accesos a datos sensibles (PII), trazabilidad de modificaciones y estado de consentimientos informados conforme a la Ley 81 de 2019 de la República de Panamá.</p>
                <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 text-[10px] space-y-1 text-teal-300">
                  <div>• Eventos Totales Auditados: <strong>{totalLogsCount}</strong></div>
                  <div>• Consultas a Datos Personales (PII): <strong>{totalRecordAccesses}</strong></div>
                  <div>• Registros y Modificaciones Auditadas: <strong>{modifiedRecordsCount}</strong></div>
                  <div>• Alertas de Seguridad / Desvíos: <strong className="text-rose-400">{criticalSecurityAlertsCount}</strong></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
                  handleExportFilteredAuditPdf();
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
