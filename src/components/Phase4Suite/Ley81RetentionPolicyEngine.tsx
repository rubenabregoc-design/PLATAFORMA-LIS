import React, { useState, useMemo } from 'react';
import jsPDF from 'jspdf';
import { Tenant, Branch } from '../../types';
import { AuditLogEntry } from './Ley81AuditVault';
import {
  ShieldCheck,
  Calendar,
  Clock,
  Trash2,
  HardDrive,
  Sliders,
  AlertTriangle,
  CheckCircle2,
  FileCheck,
  Lock,
  RefreshCw,
  Download,
  Info,
  CalendarClock,
  Sparkles,
  FileText,
  Key,
  Database,
  Mail,
  Shield,
  Search,
  Check,
  RotateCcw,
  Layers,
  Zap,
  Play
} from 'lucide-react';

export interface RetentionPolicyConfig {
  id: string;
  name: string;
  category: 'GENERAL' | 'CLINICAL' | 'SECURITY' | 'CONSENT' | 'ACCESS';
  description: string;
  retentionYears: number;
  retentionDays: number;
  minRetentionLawArticle: string;
  autoDeleteEnabled: boolean;
  legalHoldExemption: boolean;
  sanitizationStandard: 'NIST_800_88' | 'DOD_5220_22M' | 'ANTAI_PSEUDONYMIZATION';
}

export interface AutomatedScheduleConfig {
  enabled: boolean;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY';
  executionTime: string; // e.g. '03:00'
  dayOfWeek?: string; // e.g. 'Domingo'
  dayOfMonth?: number; // e.g. 1
  cutoffMode: 'ROLLING_PERIOD' | 'EXACT_DATE';
  rollingYears: number;
  exactCutoffDate: string; // YYYY-MM-DD
  storageThresholdPercent: number; // e.g. 85%
  storageThresholdTrigger: boolean;
  notifyDpoEmail: boolean;
  dpoEmail: string;
  generateCertificatePdf: boolean;
  lastExecutionTimestamp?: string;
  nextExecutionTimestamp: string;
}

export interface PurgeExecutionRecord {
  id: string;
  timestamp: string;
  executedBy: string;
  userRole: string;
  cutoffDate: string;
  policyApplied: string;
  sanitizationStandard: string;
  recordsDeletedCount: number;
  recordsRetainedCount: number;
  storageReclaimedKB: number;
  batchHashBefore: string;
  batchHashAfter: string;
  destructionCertificateId: string;
  status: 'COMPLETADO_EXITOSO' | 'PARCIAL' | 'FALLIDO';
  notes: string;
}

interface Ley81RetentionPolicyEngineProps {
  tenant: Tenant;
  branch: Branch;
  logs: AuditLogEntry[];
  onUpdateLogs: (newLogs: AuditLogEntry[]) => void;
  onResetLogs: () => void;
}

export const Ley81RetentionPolicyEngine: React.FC<Ley81RetentionPolicyEngineProps> = ({
  tenant,
  branch,
  logs,
  onUpdateLogs,
  onResetLogs
}) => {
  // --- STATE: CURRENT DATE CONTEXT ---
  const currentSystemDate = '2026-08-20';

  // --- PRESET RETENTION POLICIES ---
  const [retentionPolicies, setRetentionPolicies] = useState<RetentionPolicyConfig[]>([
    {
      id: 'pol-minsa-clinical',
      name: 'Validaciones Bioquímicas & Médicas (MINSA Estándar)',
      category: 'CLINICAL',
      description: 'Expedientes analíticos y validaciones de tecnólogos según Res. MINSA sobre trazabilidad de análisis clínicos.',
      retentionYears: 5,
      retentionDays: 1825,
      minRetentionLawArticle: 'Art. 34 Ley 81 / Res. MINSA 1420',
      autoDeleteEnabled: true,
      legalHoldExemption: true,
      sanitizationStandard: 'NIST_800_88'
    },
    {
      id: 'pol-antai-consent',
      name: 'Consentimientos Informados & Revocaciones Titular',
      category: 'CONSENT',
      description: 'Trazabilidad de otorgamiento, modificaciones y firmas de titulares según Ley 81 de Protección de Datos.',
      retentionYears: 10,
      retentionDays: 3650,
      minRetentionLawArticle: 'Art. 8, 14 y 21 Ley 81 (ANTAI)',
      autoDeleteEnabled: false,
      legalHoldExemption: true,
      sanitizationStandard: 'NIST_800_88'
    },
    {
      id: 'pol-access-reads',
      name: 'Consultas de Resultados & Descargas de PDF (PII)',
      category: 'ACCESS',
      description: 'Registros de visualización y exportación de datos sensibles por médicos, pacientes y personal autorizado.',
      retentionYears: 3,
      retentionDays: 1095,
      minRetentionLawArticle: 'Art. 28 Ley 81 / ISO 15189',
      autoDeleteEnabled: true,
      legalHoldExemption: true,
      sanitizationStandard: 'NIST_800_88'
    },
    {
      id: 'pol-security-alerts',
      name: 'Incidentes de Seguridad & Intentos de Acceso Denegados',
      category: 'SECURITY',
      description: 'Alertas de seguridad cibernética, intentos no autorizados y anomalías detectadas en la bóveda.',
      retentionYears: 7,
      retentionDays: 2555,
      minRetentionLawArticle: 'Art. 36 Ley 81 / Res. ANTAI 2021-04',
      autoDeleteEnabled: true,
      legalHoldExemption: true,
      sanitizationStandard: 'NIST_800_88'
    },
    {
      id: 'pol-routine-logins',
      name: 'Inicios de Sesión & Autenticación de Rutina',
      category: 'GENERAL',
      description: 'Eventos de inicio/cierre de sesión del personal de laboratorio en terminales LIS y puestos POS.',
      retentionYears: 1,
      retentionDays: 365,
      minRetentionLawArticle: 'Políticas Internas de Seguridad LIS',
      autoDeleteEnabled: true,
      legalHoldExemption: false,
      sanitizationStandard: 'NIST_800_88'
    }
  ]);

  // --- ACTIVE GLOBAL / CUSTOM CUTOFF MODE ---
  const [cutoffMode, setCutoffMode] = useState<'PRESET_RULE' | 'EXACT_DATE' | 'CATEGORY_BASED'>('PRESET_RULE');
  const [selectedPresetYears, setSelectedPresetYears] = useState<number>(5); // 5 years standard
  const [customCutoffDate, setCustomCutoffDate] = useState<string>('2024-08-20'); // 2 years back from 2026-08-20
  const [preserveLegalHold, setPreserveLegalHold] = useState<boolean>(true);
  const [sanitizationStandard, setSanitizationStandard] = useState<'NIST_800_88' | 'DOD_5220_22M' | 'ANTAI_PSEUDONYMIZATION'>('NIST_800_88');

  // --- AUTOMATED SCHEDULER CONFIGURATION ---
  const [schedulerConfig, setSchedulerConfig] = useState<AutomatedScheduleConfig>({
    enabled: true,
    frequency: 'MONTHLY',
    executionTime: '03:00',
    dayOfMonth: 1,
    dayOfWeek: 'Domingo',
    cutoffMode: 'ROLLING_PERIOD',
    rollingYears: 5,
    exactCutoffDate: '2021-08-20',
    storageThresholdPercent: 80,
    storageThresholdTrigger: true,
    notifyDpoEmail: true,
    dpoEmail: 'dpo.privacidad@clinicasanmateo.pa',
    generateCertificatePdf: true,
    lastExecutionTimestamp: '01/08/2026 03:00:15 UTC',
    nextExecutionTimestamp: '01/09/2026 03:00:00 UTC'
  });

  // --- PURGE AUDIT LOGS (HISTORY OF PURGES) ---
  const [purgeHistory, setPurgeHistory] = useState<PurgeExecutionRecord[]>([
    {
      id: 'PURGE-2026-0801',
      timestamp: '01/08/2026 03:00:15',
      executedBy: 'Cron Programado Automático (Daemon LIS)',
      userRole: 'Sistema / DPO Autorizado',
      cutoffDate: '2021-08-01',
      policyApplied: 'Política Estándar MINSA / Ley 81 (Logs > 5 Años)',
      sanitizationStandard: 'NIST SP 800-88 Rev. 1 (Borrado Criptográfico)',
      recordsDeletedCount: 1420,
      recordsRetainedCount: 38450,
      storageReclaimedKB: 18450,
      batchHashBefore: '7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
      batchHashAfter: '9e107d9d372bb6826bd81d3542a419d6ec433630f61d40014f20a59028a84d22',
      destructionCertificateId: 'CERT-DEST-PA-884102',
      status: 'COMPLETADO_EXITOSO',
      notes: 'Ejecución automática sin incidentes. Exenciones legales retenidas satisfactoriamente.'
    },
    {
      id: 'PURGE-2026-0501',
      timestamp: '01/05/2026 03:00:10',
      executedBy: 'Cron Programado Automático (Daemon LIS)',
      userRole: 'Sistema / DPO Autorizado',
      cutoffDate: '2021-05-01',
      policyApplied: 'Política Estándar MINSA / Ley 81 (Logs > 5 Años)',
      sanitizationStandard: 'NIST SP 800-88 Rev. 1 (Borrado Criptográfico)',
      recordsDeletedCount: 980,
      recordsRetainedCount: 37030,
      storageReclaimedKB: 12740,
      batchHashBefore: '3b41d6f83912048f0293120192847291048591028471920381e3b0c44298fc1c',
      batchHashAfter: '7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
      destructionCertificateId: 'CERT-DEST-PA-881903',
      status: 'COMPLETADO_EXITOSO',
      notes: 'Limpieza periódica trimestral de logs antiguos con verificación de cadena criptográfica.'
    }
  ]);

  // --- UI CONTROLS & MODALS ---
  const [activeTab, setActiveTab] = useState<'policy_config' | 'scheduler' | 'purge_history' | 'dry_run_simulator'>('policy_config');
  const [isPurgeModalOpen, setIsPurgeModalOpen] = useState<boolean>(false);
  const [purgeConfirmationCode, setPurgeConfirmationCode] = useState<string>('');
  const [isExecutingPurge, setIsExecutingPurge] = useState<boolean>(false);
  const [purgeExecutionStep, setPurgeExecutionStep] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'warning' | 'info' } | null>(null);
  const [selectedCertificateRecord, setSelectedCertificateRecord] = useState<PurgeExecutionRecord | null>(null);
  const [searchTermHistory, setSearchTermHistory] = useState<string>('');

  // Helper Toast Trigger
  const triggerToast = (text: string, type: 'success' | 'warning' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 5500);
  };

  // --- CALCULATE EFFECTIVE CUTOFF DATE BASED ON SELECTED MODE ---
  const calculatedCutoffDate = useMemo(() => {
    if (cutoffMode === 'EXACT_DATE') {
      return customCutoffDate;
    }
    if (cutoffMode === 'PRESET_RULE') {
      // Calculate date = 2026-08-20 minus selectedPresetYears
      const currentYear = 2026;
      const targetYear = currentYear - selectedPresetYears;
      return `${targetYear}-08-20`;
    }
    // CATEGORY_BASED default fallback
    return '2021-08-20';
  }, [cutoffMode, customCutoffDate, selectedPresetYears]);

  // --- EVALUATE LOGS ELIGIBLE FOR PURGE (SIMULATION / DRY RUN) ---
  const { eligibleLogs, retainedLogs, logsWithLegalHold, estimatedStorageKB } = useMemo(() => {
    const eligible: AuditLogEntry[] = [];
    const retained: AuditLogEntry[] = [];
    const legalHolds: AuditLogEntry[] = [];

    logs.forEach((log) => {
      // Extract ISO date
      const logIso = log.isoDate || log.timestamp;
      const logDateOnly = logIso.slice(0, 10);

      // Check if under legal hold / anomaly
      const isHold = (log.isAnomaly || log.actionType === 'INTENTO_ACCESO_DENEGADO' || log.consentLey81Status === 'REVOCADO') && preserveLegalHold;

      if (cutoffMode === 'CATEGORY_BASED') {
        // Find matching policy
        let matchedPolicy: RetentionPolicyConfig | undefined;
        if (log.actionType === 'VALIDACION_TECNICA' || log.actionType === 'VALIDACION_MEDICA') {
          matchedPolicy = retentionPolicies.find((p) => p.category === 'CLINICAL');
        } else if (log.actionType === 'MODIFICACION_CONSENTIMIENTO') {
          matchedPolicy = retentionPolicies.find((p) => p.category === 'CONSENT');
        } else if (log.actionType === 'CONSULTA_RESULTADO' || log.actionType === 'EXPORTACION_PDF') {
          matchedPolicy = retentionPolicies.find((p) => p.category === 'ACCESS');
        } else if (log.actionType === 'INTENTO_ACCESO_DENEGADO' || log.isAnomaly) {
          matchedPolicy = retentionPolicies.find((p) => p.category === 'SECURITY');
        } else {
          matchedPolicy = retentionPolicies.find((p) => p.category === 'GENERAL');
        }

        const policyYears = matchedPolicy ? matchedPolicy.retentionYears : 5;
        const categoryCutoff = `${2026 - policyYears}-08-20`;

        if (isHold && matchedPolicy?.legalHoldExemption) {
          legalHolds.push(log);
          retained.push(log);
        } else if (logDateOnly < categoryCutoff && matchedPolicy?.autoDeleteEnabled) {
          eligible.push(log);
        } else {
          retained.push(log);
        }
      } else {
        // Global or exact date cutoff
        if (isHold) {
          legalHolds.push(log);
          retained.push(log);
        } else if (logDateOnly < calculatedCutoffDate) {
          eligible.push(log);
        } else {
          retained.push(log);
        }
      }
    });

    const storageKB = eligible.length * 1.35; // approx 1.35 KB per encrypted audit block

    return {
      eligibleLogs: eligible,
      retainedLogs: retained,
      logsWithLegalHold: legalHolds,
      estimatedStorageKB: Math.round(storageKB * 10) / 10
    };
  }, [logs, cutoffMode, calculatedCutoffDate, preserveLegalHold, retentionPolicies]);

  // --- SAVE POLICY CONFIG ---
  const handleSavePolicies = () => {
    triggerToast('✓ Políticas de retención y plazos legales actualizados correctamente.', 'success');
  };

  // --- SAVE SCHEDULER CONFIG ---
  const handleSaveScheduler = () => {
    triggerToast(
      `✓ Programador automático guardado. Próxima ejecución: ${schedulerConfig.nextExecutionTimestamp}. Destinatario DPO: ${schedulerConfig.dpoEmail}`,
      'success'
    );
  };

  // --- EXECUTE SECURE PURGE NOW ---
  const handleExecuteSecurePurge = () => {
    if (purgeConfirmationCode.trim() !== 'PURGAR-LEY81') {
      triggerToast('Código de confirmación incorrecto. Ingrese "PURGAR-LEY81" para autorizar.', 'warning');
      return;
    }

    if (eligibleLogs.length === 0) {
      triggerToast('No hay registros más antiguos que la fecha de corte seleccionada para purgar.', 'info');
      setIsPurgeModalOpen(false);
      return;
    }

    setIsExecutingPurge(true);
    setPurgeExecutionStep('1/4: Verificando excepciones de retención legal (Legal Holds y ANTAI)...');

    setTimeout(() => {
      setPurgeExecutionStep('2/4: Generando resumen catenario SHA-256 de cierre del lote auditado...');
      setTimeout(() => {
        setPurgeExecutionStep(`3/4: Aplicando estándar de sanitización ${sanitizationStandard} (Destrucción Segura)...`);
        setTimeout(() => {
          setPurgeExecutionStep('4/4: Emitiendo Certificado Criptográfico de Destrucción...');
          setTimeout(() => {
            // Perform actual purge in state
            const certificateId = `CERT-DEST-PA-${Date.now().toString().slice(-6)}`;
            const dateStr = new Date().toLocaleString('es-PA');

            const newPurgeRecord: PurgeExecutionRecord = {
              id: `PURGE-${Date.now().toString().slice(-6)}`,
              timestamp: dateStr,
              executedBy: 'Lic. Rubén Abrego (DPO & Auditor LIS)',
              userRole: 'Oficial de Protección de Datos (DPO)',
              cutoffDate: calculatedCutoffDate,
              policyApplied:
                cutoffMode === 'PRESET_RULE'
                  ? `Regla General (${selectedPresetYears} Años - Corte < ${calculatedCutoffDate})`
                  : cutoffMode === 'EXACT_DATE'
                  ? `Fecha Exacta (Corte < ${customCutoffDate})`
                  : 'Matriz Granular por Categorías',
              sanitizationStandard:
                sanitizationStandard === 'NIST_800_88'
                  ? 'NIST SP 800-88 Rev. 1 (Borrado Criptográfico)'
                  : sanitizationStandard === 'DOD_5220_22M'
                  ? 'DoD 5220.22-M (Sobreescritura 3 Pasos)'
                  : 'Anonimización Irreversible ANTAI',
              recordsDeletedCount: eligibleLogs.length,
              recordsRetainedCount: retainedLogs.length,
              storageReclaimedKB: estimatedStorageKB,
              batchHashBefore: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
              batchHashAfter: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
              destructionCertificateId: certificateId,
              status: 'COMPLETADO_EXITOSO',
              notes: `Purga manual ejecutada conforme a la Ley 81 de Panamá. Se preservaron ${logsWithLegalHold.length} registros con Legal Hold.`
            };

            // Update purge history
            setPurgeHistory([newPurgeRecord, ...purgeHistory]);

            // Update active logs list
            onUpdateLogs(retainedLogs);

            setIsExecutingPurge(false);
            setIsPurgeModalOpen(false);
            setPurgeConfirmationCode('');
            setSelectedCertificateRecord(newPurgeRecord);

            triggerToast(
              `✓ Purga segura completada: ${eligibleLogs.length} registros destruidos irreversiblemente (${estimatedStorageKB} KB liberados). Certificado ${certificateId} emitido.`,
              'success'
            );
          }, 600);
        }, 600);
      }, 600);
    }, 600);
  };

  // --- GENERATE CERTIFICATE PDF ---
  const handleDownloadCertificatePdf = (record: PurgeExecutionRecord) => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      let y = margin;

      // Outer security frame
      doc.setDrawColor(13, 148, 136); // teal-600
      doc.setLineWidth(0.8);
      doc.roundedRect(margin, margin, pageWidth - margin * 2, pageHeight - margin * 2, 4, 4, 'D');

      // Top Security Header Banner
      doc.setFillColor(15, 23, 42); // slate-900
      doc.roundedRect(margin + 1, margin + 1, pageWidth - margin * 2 - 2, 24, 3, 3, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(45, 212, 191); // teal-300
      doc.text('REPÚBLICA DE PANAMÁ • AUTORIDAD NACIONAL DE TRANSPARENCIA (ANTAI)', pageWidth / 2, y + 8, { align: 'center' });

      doc.setFontSize(8);
      doc.setTextColor(226, 232, 240); // slate-200
      doc.text('CERTIFICADO OFICIAL DE DESTRUCCIÓN CRIPTOGRÁFICA & RETENCIÓN DE DATOS', pageWidth / 2, y + 14, { align: 'center' });
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text('Conforme a la Ley 81 de 2019, Decreto Ejecutivo 285 de 2021 y Estándar NIST SP 800-88 Rev. 1', pageWidth / 2, y + 19, { align: 'center' });

      y += 30;

      // Certificate Identification Box
      doc.setFillColor(241, 245, 249); // slate-100
      doc.setDrawColor(203, 213, 225); // slate-300
      doc.setLineWidth(0.4);
      doc.roundedRect(margin + 5, y, pageWidth - margin * 2 - 10, 22, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.text('FOLIO DE CERTIFICADO:', margin + 9, y + 6);
      doc.setFont('courier', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(13, 148, 136);
      doc.text(record.destructionCertificateId, margin + 46, y + 6);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.text('FECHA Y HORA UTC:', margin + 110, y + 6);
      doc.setFont('courier', 'normal');
      doc.text(record.timestamp, margin + 143, y + 6);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text('ENTIDAD / LABORATORIO:', margin + 9, y + 12);
      doc.setFont('helvetica', 'normal');
      doc.text(`${tenant.name} — ${branch.name}`, margin + 50, y + 12);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text('AUTORIZADO POR:', margin + 9, y + 18);
      doc.setFont('helvetica', 'normal');
      doc.text(`${record.executedBy} (${record.userRole})`, margin + 39, y + 18);

      y += 28;

      // Summary Table of Purged Elements
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text('1. RESUMEN DE LA POLÍTICA Y VOLUMETRÍA DE PURGA', margin + 5, y);
      y += 4;

      const col1 = margin + 5;
      const col2 = margin + 80;
      const boxW = pageWidth - margin * 2 - 10;

      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(col1, y, boxW, 40, 2, 2, 'FD');

      const items = [
        ['Política de Retención Aplicada:', record.policyApplied],
        ['Fecha de Corte Límite (Cutoff Date):', record.cutoffDate],
        ['Estándar de Sanitización / Borrado:', record.sanitizationStandard],
        ['Registros de Auditoría Eliminados:', `${record.recordsDeletedCount} Eventos Inmutables`],
        ['Registros Activos Conservados:', `${record.recordsRetainedCount} Eventos Vigentes`],
        ['Espacio en Almacenamiento Reclamado:', `${record.storageReclaimedKB} KB (~${(record.storageReclaimedKB / 1024).toFixed(2)} MB)`],
        ['Estado de Ejecución del Proceso:', record.status]
      ];

      let rowY = y + 5;
      items.forEach(([label, val]) => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(51, 65, 85);
        doc.text(label, col1 + 4, rowY);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(15, 23, 42);
        doc.text(val, col2, rowY);
        rowY += 5;
      });

      y += 46;

      // Cryptographic Evidence Section
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text('2. EVIDENCIA CRIPTOGRÁFICA DE CIERRE & SELLADO DE CADENA', margin + 5, y);
      y += 4;

      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(margin + 5, y, boxW, 30, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.2);
      doc.setTextColor(71, 85, 105);
      doc.text('HASH SHA-256 PREVIO A LA PURGA (INTEGRIDAD DE ORIGEN):', margin + 9, y + 6);
      doc.setFont('courier', 'normal');
      doc.setFontSize(6.8);
      doc.setTextColor(15, 23, 42);
      doc.text(record.batchHashBefore, margin + 9, y + 10);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.2);
      doc.setTextColor(71, 85, 105);
      doc.text('HASH SHA-256 POST-PURGA (NUEVA CABEZA DE CADENA VIGENTE):', margin + 9, y + 17);
      doc.setFont('courier', 'bold');
      doc.setFontSize(6.8);
      doc.setTextColor(13, 148, 136);
      doc.text(record.batchHashAfter, margin + 9, y + 21);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.2);
      doc.setTextColor(71, 85, 105);
      doc.text('MÉTODO DE DESTRUCCIÓN: Cero lógico + Sobreescritura criptográfica irreversible de llaves de vector.', margin + 9, y + 27);

      y += 36;

      // Legal Statement & Signature Block
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text('3. DECLARACIÓN JURADA DE CUMPLIMIENTO REGULATORIO', margin + 5, y);
      y += 4;

      doc.setFillColor(241, 245, 249);
      doc.roundedRect(margin + 5, y, boxW, 55, 2, 2, 'FD');

      doc.setFont('helvetica', 'italic');
      doc.setFontSize(6.5);
      doc.setTextColor(51, 65, 85);
      const legalNotice =
        'Por medio del presente documento, se certifica que la eliminación de registros de auditoría descrita se ha llevado a cabo de manera automatizada y segura en cumplimiento estricto del Artículo 34 de la Ley 81 de 2019 sobre el principio de limitación del plazo de conservación de datos personales, el Decreto Ejecutivo 285 de 2021 y las directrices de la ANTAI. Ningún registro con presunción de litigio, investigación de bioseguridad o alerta de acceso denegado (Legal Hold) fue afectado. Este documento goza de presunción de autenticidad e inalterabilidad probatoria ante cualquier ente fiscalizador o judicial.';
      const splitNotice = doc.splitTextToSize(legalNotice, boxW - 10);
      doc.text(splitNotice, margin + 10, y + 6);

      // Signature Seal
      const sigY = y + 26;
      doc.setDrawColor(13, 148, 136);
      doc.setLineWidth(0.6);
      doc.roundedRect(margin + 10, sigY, 65, 24, 1.5, 1.5, 'D');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(13, 148, 136);
      doc.text('REPÚBLICA DE PANAMÁ', margin + 42.5, sigY + 5, { align: 'center' });
      doc.setFontSize(5.5);
      doc.setTextColor(15, 23, 42);
      doc.text('OFICIAL DE PROTECCIÓN DE DATOS (DPO)', margin + 42.5, sigY + 9, { align: 'center' });
      doc.setFont('courier', 'bold');
      doc.setFontSize(6.2);
      doc.setTextColor(16, 185, 129);
      doc.text('[ FIRMADO ELECTRÓNICAMENTE ]', margin + 42.5, sigY + 15, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(5);
      doc.setTextColor(100, 116, 139);
      doc.text(`ID CERT TSA: TSA-PA-${record.id}`, margin + 42.5, sigY + 20, { align: 'center' });

      // Right Side of Signature Block
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(15, 23, 42);
      doc.text('Diligenciado por:', margin + 82, sigY + 6);
      doc.setFont('helvetica', 'normal');
      doc.text('Lic. Rubén Abrego — DPO Registrado ANTAI', margin + 106, sigY + 6);

      doc.setFont('helvetica', 'bold');
      doc.text('Cédula / Id:', margin + 82, sigY + 11);
      doc.setFont('helvetica', 'normal');
      doc.text('8-812-3490 (Cualificado)', margin + 100, sigY + 11);

      doc.setFont('helvetica', 'bold');
      doc.text('Algoritmo TSA:', margin + 82, sigY + 16);
      doc.setFont('courier', 'normal');
      doc.text('RFC 3161 / SHA-256 Catenario', margin + 104, sigY + 16);

      doc.setFont('helvetica', 'bold');
      doc.text('Sello Criptográfico:', margin + 82, sigY + 21);
      doc.setFont('courier', 'bold');
      doc.setTextColor(13, 148, 136);
      doc.text(record.batchHashAfter.slice(0, 24) + '...', margin + 110, sigY + 21);

      // Footer
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Documento generado automáticamente por el Módulo de Retención Ley 81 del LIS • ${tenant.name} • ${new Date().toISOString()}`,
        pageWidth / 2,
        pageHeight - 8,
        { align: 'center' }
      );

      const filename = `CERTIFICADO_DESTRUCCION_LEY81_${record.destructionCertificateId}.pdf`;
      doc.save(filename);
      triggerToast(`✓ Certificado Oficial "${filename}" descargado exitosamente.`, 'success');
    } catch (err) {
      console.error('Error generating destruction certificate PDF:', err);
      triggerToast('Error al generar el certificado PDF.', 'warning');
    }
  };

  return (
    <div className="space-y-6 text-slate-800 animate-in fade-in duration-300">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white p-6 rounded-3xl shadow-xl border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative overflow-hidden">
        {/* Subtle Ambient Glow */}
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-2 relative z-10 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 bg-teal-500/20 border border-teal-500/40 text-teal-300 font-bold text-xs rounded-full flex items-center gap-1.5">
              <CalendarClock className="w-4 h-4 text-teal-400" />
              Motor de Políticas de Retención • Ley 81 de 2019
            </span>
            <span className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-mono font-bold text-[11px] rounded-full flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              NIST SP 800-88 Sanitization
            </span>
            <span className="px-3 py-1 bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-mono text-[11px] rounded-full font-bold">
              Art. 34 (Conservación Límite)
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Políticas de Retención & Purga Criptográfica Programada
          </h2>

          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            Configure plazos legales de conservación para cada categoría de eventos de auditoría (MINSA, ANTAI e ISO 15189),
            programe tareas automatizadas de borrado seguro con estándares criptográficos y emita certificados oficiales con validez probatoria.
          </p>
        </div>

        {/* Quick KPI & Action Button */}
        <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0 relative z-10">
          <div className="bg-slate-900/90 border border-teal-500/30 p-3.5 rounded-2xl space-y-1 text-xs">
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-400">Total Logs en Bóveda:</span>
              <span className="font-mono text-teal-300 font-bold">{logs.length} Eventos</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-400">Candidatos a Purga (&lt; {calculatedCutoffDate}):</span>
              <span className="font-mono text-amber-400 font-bold">{eligibleLogs.length} Eventos</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-400">Próxima Purga Programada:</span>
              <span className="text-emerald-400 font-bold font-mono text-[11px]">
                {schedulerConfig.enabled ? schedulerConfig.nextExecutionTimestamp.slice(0, 10) : 'Pausada'}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setIsPurgeModalOpen(true)}
              className="flex-1 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-black px-4 py-2.5 rounded-xl text-xs transition shadow-lg shadow-rose-900/30 flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Ejecutar Purga Manual</span>
            </button>

            <button
              onClick={onResetLogs}
              title="Restaurar registros históricos de demostración (2021-2026)"
              className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition flex items-center justify-center cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 text-teal-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Feedback Toast */}
      {toastMessage && (
        <div
          className={`px-5 py-3 rounded-2xl shadow-xl flex items-center justify-between text-xs font-bold animate-in fade-in slide-in-from-top-2 border ${
            toastMessage.type === 'success'
              ? 'bg-emerald-800 text-white border-emerald-500/50'
              : toastMessage.type === 'warning'
              ? 'bg-amber-800 text-white border-amber-500/50'
              : 'bg-slate-800 text-white border-slate-600'
          }`}
        >
          <div className="flex items-center space-x-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
            <span className="leading-relaxed">{toastMessage.text}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-white/80 hover:text-white ml-4 font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Navigation Sub-Tabs inside Retention Module */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-900 p-2 rounded-2xl border border-slate-800 shadow-md">
        <button
          onClick={() => setActiveTab('policy_config')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer ${
            activeTab === 'policy_config'
              ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 shadow-md font-black'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>1. Políticas & Plazos de Retención</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-950 text-teal-300 font-bold">
            {retentionPolicies.length} Reglas
          </span>
        </button>

        <button
          onClick={() => setActiveTab('scheduler')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer ${
            activeTab === 'scheduler'
              ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 shadow-md font-black'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>2. Programador Automático (Daemon Cron)</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
            schedulerConfig.enabled ? 'bg-emerald-950 text-emerald-300' : 'bg-slate-800 text-slate-400'
          }`}>
            {schedulerConfig.enabled ? 'ACTIVO' : 'PAUSADO'}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('dry_run_simulator')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer ${
            activeTab === 'dry_run_simulator'
              ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 shadow-md font-black'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>3. Simulador de Impacto (Dry Run)</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-950 text-amber-300 font-bold">
            {eligibleLogs.length} a Purgar
          </span>
        </button>

        <button
          onClick={() => setActiveTab('purge_history')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer ${
            activeTab === 'purge_history'
              ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 shadow-md font-black'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          <span>4. Bitácora de Purgas & Certificados</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-950 text-teal-300 font-bold">
            {purgeHistory.length} Certificados
          </span>
        </button>
      </div>

      {/* --- TAB 1: RETENTION POLICIES CONFIGURATION MATRIX --- */}
      {activeTab === 'policy_config' && (
        <div className="space-y-6">
          {/* Quick Selection Mode Bar */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <span>Modo de Definición de Retención & Fecha de Corte</span>
                  <span className="px-2.5 py-0.5 bg-teal-50 text-teal-800 border border-teal-200 text-[11px] font-mono font-bold rounded-full">
                    Regulación ANTAI
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Seleccione el criterio para determinar qué registros de auditoría superan la vida útil legal y deben ser purgados.
                </p>
              </div>

              <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl">
                <button
                  onClick={() => setCutoffMode('PRESET_RULE')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    cutoffMode === 'PRESET_RULE' ? 'bg-white text-teal-900 shadow-xs font-black' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Plazo Fijo (Años)
                </button>
                <button
                  onClick={() => setCutoffMode('EXACT_DATE')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    cutoffMode === 'EXACT_DATE' ? 'bg-white text-teal-900 shadow-xs font-black' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Fecha de Corte Específica
                </button>
                <button
                  onClick={() => setCutoffMode('CATEGORY_BASED')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    cutoffMode === 'CATEGORY_BASED' ? 'bg-white text-teal-900 shadow-xs font-black' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Matriz por Categoría
                </button>
              </div>
            </div>

            {/* Mode-Specific Interactive Controls */}
            {cutoffMode === 'PRESET_RULE' && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  { years: 1, label: '1 Año (Operativo Corto)', note: 'Optimización de almacenamiento interno', date: '2025-08-20' },
                  { years: 3, label: '3 Años (Estándar Privacidad)', note: 'Auditoría regular de consultas PII', date: '2023-08-20' },
                  { years: 5, label: '5 Años (MINSA / Ley 81 Oficial)', note: 'Plazo legal recomendado expediente clínico', date: '2021-08-20', recommended: true },
                  { years: 10, label: '10 Años (Alta Complejidad)', note: 'Laboratorios de referencia y banco de sangre', date: '2016-08-20' }
                ].map((item) => (
                  <div
                    key={item.years}
                    onClick={() => setSelectedPresetYears(item.years)}
                    className={`p-4 rounded-2xl border-2 transition cursor-pointer space-y-2 relative ${
                      selectedPresetYears === item.years
                        ? 'border-teal-600 bg-teal-50/70 shadow-sm ring-2 ring-teal-600/20'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                    }`}
                  >
                    {item.recommended && (
                      <span className="absolute -top-2.5 right-3 bg-teal-700 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Recomendado MINSA
                      </span>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="font-black text-sm text-slate-900">{item.label}</span>
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          selectedPresetYears === item.years ? 'border-teal-600 bg-teal-600 text-white' : 'border-slate-300'
                        }`}
                      >
                        {selectedPresetYears === item.years && <Check className="w-2.5 h-2.5" />}
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-600">{item.note}</p>
                    <div className="text-[10px] font-mono text-teal-800 font-bold bg-white px-2 py-1 rounded-lg border border-teal-200">
                      Fecha límite: &lt; {item.date}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {cutoffMode === 'EXACT_DATE' && (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-700 block flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-teal-600" />
                    Seleccionar Fecha Límite de Conservación (Corte Específico)
                  </span>
                  <p className="text-[11px] text-slate-500">
                    Se purgarán irreversiblemente todos los registros cuya marca de tiempo sea anterior a la fecha seleccionada.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="date"
                    value={customCutoffDate}
                    max={currentSystemDate}
                    onChange={(e) => setCustomCutoffDate(e.target.value)}
                    className="px-4 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none shadow-xs"
                  />
                  <div className="text-xs font-mono font-bold text-teal-800 bg-teal-100 px-3 py-2 rounded-xl">
                    Corte: &lt; {customCutoffDate}
                  </div>
                </div>
              </div>
            )}

            {cutoffMode === 'CATEGORY_BASED' && (
              <div className="p-3 bg-teal-50 border border-teal-200 text-teal-900 rounded-2xl text-xs flex items-center gap-2.5">
                <Info className="w-4 h-4 text-teal-700 shrink-0" />
                <span>
                  Modo Activo: Se aplicarán plazos independientes para cada categoría según la matriz inferior (ej. 5 años para validaciones, 10 años para consentimientos, 1 año para logins de rutina).
                </span>
              </div>
            )}

            {/* Safeguards & Sanitization Method Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              {/* Preservación de Legal Hold */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <Shield className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-black text-slate-900">
                      Preservación Obligatoria de Legal Hold / Anomalías
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-normal">
                    Excluye automáticamente de la purga cualquier evento con alerta de seguridad ANTAI, intento de acceso no autorizado o bajo investigación legal ({logsWithLegalHold.length} eventos protegidos).
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                  <input
                    type="checkbox"
                    checked={preserveLegalHold}
                    onChange={(e) => setPreserveLegalHold(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {/* Estándar de Sanitización */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                    <Key className="w-4 h-4 text-teal-600" />
                    Estándar de Sanitización Criptográfica
                  </span>
                  <span className="text-[10px] font-mono text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full font-bold">
                    Irreversible
                  </span>
                </div>

                <select
                  value={sanitizationStandard}
                  onChange={(e) => setSanitizationStandard(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                >
                  <option value="NIST_800_88">NIST SP 800-88 Rev. 1 — Borrado Criptográfico & Sobreescritura</option>
                  <option value="DOD_5220_22M">DoD 5220.22-M — Sobreescritura de 3 Pasos con Patrón Aleatorio</option>
                  <option value="ANTAI_PSEUDONYMIZATION">Pseudonimización Irreversible ANTAI (Conservar Métricas Agregadas)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Granular Retention Rules Table */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <span>Matriz de Políticas de Retención por Categoría de Evento</span>
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-mono rounded-full font-bold">
                    ISO 15189 / ANTAI
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  Configure los años de conservación mínima exigidos por el marco legal de la República de Panamá.
                </p>
              </div>

              <button
                onClick={handleSavePolicies}
                className="px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-black rounded-xl transition shadow-md shadow-teal-600/20 flex items-center space-x-1.5 cursor-pointer shrink-0"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Guardar Políticas de Retención</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                    <th className="p-3.5 rounded-l-xl">Categoría de Evento Auditado</th>
                    <th className="p-3.5">Fundamento Legal</th>
                    <th className="p-3.5">Retención Exigida</th>
                    <th className="p-3.5">Purga Automática</th>
                    <th className="p-3.5">Exención Legal Hold</th>
                    <th className="p-3.5 rounded-r-xl text-right">Estándar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {retentionPolicies.map((policy) => (
                    <tr key={policy.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900">{policy.name}</div>
                        <div className="text-[11px] text-slate-500 max-w-sm">{policy.description}</div>
                      </td>
                      <td className="p-3.5 font-mono text-[11px] text-teal-800 font-bold">
                        <span className="bg-teal-50 border border-teal-200 px-2 py-1 rounded-lg inline-block">
                          {policy.minRetentionLawArticle}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center space-x-2">
                          <select
                            value={policy.retentionYears}
                            onChange={(e) => {
                              const yrs = parseInt(e.target.value, 10);
                              setRetentionPolicies(
                                retentionPolicies.map((p) =>
                                  p.id === policy.id ? { ...p, retentionYears: yrs, retentionDays: yrs * 365 } : p
                                )
                              );
                            }}
                            className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:ring-1 focus:ring-teal-500"
                          >
                            <option value={1}>1 Año</option>
                            <option value={2}>2 Años</option>
                            <option value={3}>3 Años</option>
                            <option value={5}>5 Años (MINSA)</option>
                            <option value={7}>7 Años</option>
                            <option value={10}>10 Años</option>
                            <option value={15}>15 Años (Permanente)</option>
                          </select>
                          <span className="text-[10px] text-slate-400 font-mono">({policy.retentionDays} días)</span>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <input
                          type="checkbox"
                          checked={policy.autoDeleteEnabled}
                          onChange={(e) => {
                            setRetentionPolicies(
                              retentionPolicies.map((p) =>
                                p.id === policy.id ? { ...p, autoDeleteEnabled: e.target.checked } : p
                              )
                            );
                          }}
                          className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500 cursor-pointer"
                        />
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            policy.legalHoldExemption ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {policy.legalHoldExemption ? 'PROTEGIDO' : 'NO APLICA'}
                        </span>
                      </td>
                      <td className="p-3.5 text-right font-mono text-[10px] text-slate-600">
                        {policy.sanitizationStandard}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 2: AUTOMATED DAEMON SCHEDULER --- */}
      {activeTab === 'scheduler' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Scheduler Settings Panel */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-teal-600" />
                  <span>Programación del Demonio de Purga Automática</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Ejecuta tareas nocturnas en segundo plano para limpiar eventos de auditoría que excedan la política de retención.
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={schedulerConfig.enabled}
                  onChange={(e) => setSchedulerConfig({ ...schedulerConfig, enabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-12 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Frecuencia de Ejecución Automática</label>
                <select
                  value={schedulerConfig.frequency}
                  onChange={(e) => setSchedulerConfig({ ...schedulerConfig, frequency: e.target.value as any })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                >
                  <option value="DAILY">Diario (Todos los días en horario nocturno)</option>
                  <option value="WEEKLY">Semanal (Una vez por semana los domingos)</option>
                  <option value="MONTHLY">Mensual (El primer día de cada mes)</option>
                  <option value="QUARTERLY">Trimestral (Fin de cada trimestre)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Hora de Ejecución (Off-Peak UTC)</label>
                <input
                  type="time"
                  value={schedulerConfig.executionTime}
                  onChange={(e) => setSchedulerConfig({ ...schedulerConfig, executionTime: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Modo de Ventana de Corte</label>
                <select
                  value={schedulerConfig.cutoffMode}
                  onChange={(e) => setSchedulerConfig({ ...schedulerConfig, cutoffMode: e.target.value as any })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                >
                  <option value="ROLLING_PERIOD">Ventana Móvil Dinámica (Logs más antiguos de X Años)</option>
                  <option value="EXACT_DATE">Fecha Específica Fija</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  {schedulerConfig.cutoffMode === 'ROLLING_PERIOD' ? 'Plazo Móvil (Años)' : 'Fecha Fija'}
                </label>
                {schedulerConfig.cutoffMode === 'ROLLING_PERIOD' ? (
                  <select
                    value={schedulerConfig.rollingYears}
                    onChange={(e) => setSchedulerConfig({ ...schedulerConfig, rollingYears: parseInt(e.target.value, 10) })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  >
                    <option value={1}>1 Año</option>
                    <option value={3}>3 Años</option>
                    <option value={5}>5 Años (MINSA)</option>
                    <option value={7}>7 Años</option>
                    <option value={10}>10 Años</option>
                  </select>
                ) : (
                  <input
                    type="date"
                    value={schedulerConfig.exactCutoffDate}
                    onChange={(e) => setSchedulerConfig({ ...schedulerConfig, exactCutoffDate: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                )}
              </div>
            </div>

            {/* Storage Quota Auto-Trigger */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <HardDrive className="w-4 h-4 text-teal-600" />
                  <span className="text-xs font-bold text-slate-900">
                    Disparador de Emergencia por Cuota de Almacenamiento
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={schedulerConfig.storageThresholdTrigger}
                  onChange={(e) => setSchedulerConfig({ ...schedulerConfig, storageThresholdTrigger: e.target.checked })}
                  className="w-4 h-4 text-teal-600 rounded cursor-pointer"
                />
              </div>

              <p className="text-[11px] text-slate-500 leading-normal">
                Si el volumen de logs encriptados excede el porcentaje asignado, se forzará una purga preventiva de los registros más antiguos.
              </p>

              <div className="flex items-center space-x-3">
                <input
                  type="range"
                  min={50}
                  max={95}
                  step={5}
                  value={schedulerConfig.storageThresholdPercent}
                  onChange={(e) => setSchedulerConfig({ ...schedulerConfig, storageThresholdPercent: parseInt(e.target.value, 10) })}
                  className="flex-1 accent-teal-600 cursor-pointer"
                />
                <span className="text-xs font-mono font-bold text-teal-800 bg-white px-3 py-1 rounded-lg border border-slate-200">
                  {schedulerConfig.storageThresholdPercent}% de Cuota
                </span>
              </div>
            </div>

            {/* DPO Notification & Automated Certificate */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-bold text-slate-900">
                    Notificación y Emisión Automática de Certificado al DPO
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={schedulerConfig.notifyDpoEmail}
                  onChange={(e) => setSchedulerConfig({ ...schedulerConfig, notifyDpoEmail: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600 block">Correo del Oficial de Protección de Datos (DPO)</label>
                <input
                  type="email"
                  value={schedulerConfig.dpoEmail}
                  onChange={(e) => setSchedulerConfig({ ...schedulerConfig, dpoEmail: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleSaveScheduler}
                className="px-5 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-black text-xs rounded-xl transition shadow-md shadow-teal-600/20 flex items-center space-x-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Guardar Parámetros del Cron</span>
              </button>
            </div>
          </div>

          {/* Status & Next Run Execution Card */}
          <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 text-white space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
                <div className="p-2 bg-teal-500/20 rounded-xl text-teal-400">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">Estado del Demonio LIS</h4>
                  <p className="text-[10px] text-slate-400">Daemon de Purga Criptográfica en la Nube</p>
                </div>
              </div>

              <div className="space-y-2.5 text-xs font-mono">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 flex items-center justify-between">
                  <span className="text-slate-400">Estado de Operación:</span>
                  <span className={`font-bold flex items-center gap-1 ${schedulerConfig.enabled ? 'text-emerald-400' : 'text-slate-500'}`}>
                    <span className={`w-2 h-2 rounded-full ${schedulerConfig.enabled ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                    {schedulerConfig.enabled ? 'ACTIVO / LISTO' : 'PAUSADO'}
                  </span>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-1">
                  <span className="text-slate-400 text-[10px] uppercase block">Última Purga Automática:</span>
                  <span className="text-slate-200 font-bold text-xs">{schedulerConfig.lastExecutionTimestamp}</span>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-teal-500/30 space-y-1">
                  <span className="text-teal-400 text-[10px] uppercase block">Próxima Ejecución Programada:</span>
                  <span className="text-teal-300 font-bold text-xs">{schedulerConfig.nextExecutionTimestamp}</span>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-1">
                  <span className="text-slate-400 text-[10px] uppercase block">Destinatario DPO Registrado:</span>
                  <span className="text-slate-300 text-[11px] truncate block">{schedulerConfig.dpoEmail}</span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-teal-500/10 border border-teal-500/20 rounded-2xl text-[11px] text-teal-200 space-y-1">
              <div className="font-bold flex items-center gap-1 text-teal-300">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Garantía de Auditoría ANTAI</span>
              </div>
              <p>
                Cada corrida automática genera un registro inmutable en la bitácora criptográfica con el resumen SHA-256 de inicio y cierre.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 3: DRY RUN SIMULATOR & IMPACT VISUALIZER --- */}
      {activeTab === 'dry_run_simulator' && (
        <div className="space-y-6">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">Total en Bóveda</span>
                <Database className="w-4 h-4 text-slate-400" />
              </div>
              <div className="text-2xl font-black font-mono text-slate-900">{logs.length}</div>
              <p className="text-[11px] text-slate-500">Registros inmutables actualmente almacenados</p>
            </div>

            <div className="bg-rose-50 p-5 rounded-3xl border border-rose-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-rose-700">
                <span className="text-xs font-bold uppercase tracking-wider">Candidatos a Purga</span>
                <Trash2 className="w-4 h-4 text-rose-600" />
              </div>
              <div className="text-2xl font-black font-mono text-rose-900">{eligibleLogs.length}</div>
              <p className="text-[11px] text-rose-700 font-medium">Anteriores a la fecha de corte ({calculatedCutoffDate})</p>
            </div>

            <div className="bg-emerald-50 p-5 rounded-3xl border border-emerald-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-emerald-700">
                <span className="text-xs font-bold uppercase tracking-wider">Registros Retenidos</span>
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-black font-mono text-emerald-900">{retainedLogs.length}</div>
              <p className="text-[11px] text-emerald-700 font-medium">Vigentes o con exención Legal Hold activa</p>
            </div>

            <div className="bg-teal-50 p-5 rounded-3xl border border-teal-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-teal-700">
                <span className="text-xs font-bold uppercase tracking-wider">Espacio a Liberar</span>
                <HardDrive className="w-4 h-4 text-teal-600" />
              </div>
              <div className="text-2xl font-black font-mono text-teal-900">{estimatedStorageKB} KB</div>
              <p className="text-[11px] text-teal-700 font-medium">Optimización de almacenamiento en base de datos</p>
            </div>
          </div>

          {/* Detailed Dry Run Table */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  <span>Simulación de Purga: Lista Previa de Registros Afectados</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Inspeccione con precisión qué eventos se eliminarán irreversiblemente si se ejecuta la purga en este momento.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPurgeModalOpen(true)}
                  disabled={eligibleLogs.length === 0}
                  className={`px-4 py-2 text-xs font-black rounded-xl transition flex items-center space-x-1.5 cursor-pointer ${
                    eligibleLogs.length > 0
                      ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-900/20'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Ejecutar Purga de {eligibleLogs.length} Registros</span>
                </button>
              </div>
            </div>

            {eligibleLogs.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                <h4 className="font-bold text-sm text-slate-800">No hay registros que requieran purga</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Todos los eventos auditados en la bóveda están dentro del período de vigencia legal conforme a la política seleccionada (&lt; {calculatedCutoffDate}).
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                      <th className="p-3 rounded-l-xl">ID Bloque</th>
                      <th className="p-3">Fecha y Hora</th>
                      <th className="p-3">Usuario Auditor</th>
                      <th className="p-3">Acción Auditada</th>
                      <th className="p-3">Titular / Paciente</th>
                      <th className="p-3">Huella SHA-256</th>
                      <th className="p-3 rounded-r-xl text-right">Destino Simulado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                    {eligibleLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-rose-50/50 transition">
                        <td className="p-3 font-mono font-bold text-slate-900">{log.id}</td>
                        <td className="p-3 font-mono text-slate-600">{log.timestamp}</td>
                        <td className="p-3">
                          <div className="font-bold text-slate-900">{log.userName}</div>
                          <div className="text-[10px] text-slate-400">{log.userRole}</div>
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-mono text-[10px] font-bold">
                            {log.actionType}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="font-semibold text-slate-800">{log.patientName}</div>
                          <div className="text-[10px] font-mono text-slate-400">{log.patientNationalId}</div>
                        </td>
                        <td className="p-3 font-mono text-[10px] text-slate-400 truncate max-w-[120px]">
                          {log.sha256Hash.slice(0, 14)}...
                        </td>
                        <td className="p-3 text-right">
                          <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded-full font-bold text-[10px]">
                            BORRADO SEGURO NIST
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- TAB 4: PURGE AUDIT LOGS & CERTIFICATE VAULT --- */}
      {activeTab === 'purge_history' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-teal-600" />
                  <span>Bitácora de Certificados de Destrucción Criptográfica</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Trazabilidad inalterable de cada proceso de purga ejecutado, con folios oficiales para auditorías ANTAI y MINSA.
                </p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar por folio o fecha..."
                  value={searchTermHistory}
                  onChange={(e) => setSearchTermHistory(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="space-y-3">
              {purgeHistory
                .filter(
                  (rec) =>
                    rec.destructionCertificateId.toLowerCase().includes(searchTermHistory.toLowerCase()) ||
                    rec.timestamp.includes(searchTermHistory) ||
                    rec.policyApplied.toLowerCase().includes(searchTermHistory.toLowerCase())
                )
                .map((record) => (
                  <div
                    key={record.id}
                    className="p-5 bg-slate-50/80 hover:bg-slate-50 border border-slate-200 rounded-2xl transition space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-sm text-slate-900">
                              {record.destructionCertificateId}
                            </span>
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[10px]">
                              {record.status}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500">
                            Ejecutado el {record.timestamp} por <strong className="text-slate-700">{record.executedBy}</strong>
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDownloadCertificatePdf(record)}
                        className="px-3.5 py-1.5 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl transition shadow-xs flex items-center space-x-1.5 cursor-pointer shrink-0"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Descargar Certificado PDF</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Política Aplicada</span>
                        <span className="text-slate-800 font-medium">{record.policyApplied}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Fecha de Corte</span>
                        <span className="text-slate-800 font-mono font-bold">&lt; {record.cutoffDate}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Registros Destruidos</span>
                        <span className="text-rose-700 font-bold font-mono">{record.recordsDeletedCount} Eventos</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Espacio Liberado</span>
                        <span className="text-teal-700 font-bold font-mono">{record.storageReclaimedKB} KB</span>
                      </div>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-slate-200 font-mono text-[10px] text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="truncate">
                        <strong className="text-slate-800">Hash SHA-256 Cierre:</strong> {record.batchHashAfter}
                      </div>
                      <span className="text-slate-400 shrink-0">{record.sanitizationStandard}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* --- CONFIRMATION & EXECUTION MODAL FOR SECURE PURGE --- */}
      {isPurgeModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 text-slate-900 shadow-2xl space-y-5 relative animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-2.5">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Autorización de Purga Criptográfica</h3>
                  <p className="text-xs text-slate-500">Destrucción Segura Conforme a la Ley 81 de Panamá</p>
                </div>
              </div>

              {!isExecutingPurge && (
                <button
                  onClick={() => {
                    setIsPurgeModalOpen(false);
                    setPurgeConfirmationCode('');
                  }}
                  className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            {isExecutingPurge ? (
              <div className="py-8 space-y-4 text-center">
                <div className="w-12 h-12 rounded-full border-4 border-rose-600 border-t-transparent animate-spin mx-auto" />
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-slate-900">Ejecutando Borrado Criptográfico...</h4>
                  <p className="text-xs font-mono text-rose-700 font-bold">{purgeExecutionStep}</p>
                </div>
                <p className="text-[11px] text-slate-400">
                  Por favor no cierre esta ventana mientras se recalcula la cadena catenaria SHA-256.
                </p>
              </div>
            ) : (
              <div className="space-y-4 text-xs text-slate-700">
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-2">
                  <div className="font-bold text-rose-900 flex items-center gap-1.5">
                    <Trash2 className="w-4 h-4 text-rose-700" />
                    <span>Resumen de la Operación de Destrucción</span>
                  </div>
                  <ul className="space-y-1 text-rose-800 text-[11px]">
                    <li>• Registros a ser purgados: <strong>{eligibleLogs.length} eventos inmutables</strong></li>
                    <li>• Fecha límite de corte: <strong>Anteriores a {calculatedCutoffDate}</strong></li>
                    <li>• Registros protegidos por Legal Hold: <strong>{logsWithLegalHold.length} (no se eliminarán)</strong></li>
                    <li>• Estándar de sanitización: <strong>{sanitizationStandard}</strong></li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <label className="font-bold text-slate-800 block">
                    Para confirmar, escriba <span className="font-mono text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">PURGAR-LEY81</span>:
                  </label>
                  <input
                    type="text"
                    value={purgeConfirmationCode}
                    onChange={(e) => setPurgeConfirmationCode(e.target.value)}
                    placeholder="PURGAR-LEY81"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end space-x-2 border-t border-slate-100 pt-3">
                  <button
                    onClick={() => {
                      setIsPurgeModalOpen(false);
                      setPurgeConfirmationCode('');
                    }}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
                  >
                    Cancelar
                  </button>

                  <button
                    onClick={handleExecuteSecurePurge}
                    disabled={purgeConfirmationCode.trim() !== 'PURGAR-LEY81' || eligibleLogs.length === 0}
                    className={`px-5 py-2 font-black text-xs rounded-xl transition flex items-center space-x-1.5 cursor-pointer ${
                      purgeConfirmationCode.trim() === 'PURGAR-LEY81' && eligibleLogs.length > 0
                        ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-900/30'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Confirmar & Purgar Irreversiblemente</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
