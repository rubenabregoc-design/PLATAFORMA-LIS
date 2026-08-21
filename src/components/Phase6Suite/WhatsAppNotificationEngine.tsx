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
  Plus,
  SlidersHorizontal,
  Settings,
  Edit3,
  Trash2,
  Check,
  ExternalLink,
  ShieldCheck,
  Layers,
  Lock,
  PhoneCall,
  Activity,
  ChevronRight,
  Info,
  Copy,
  Code,
  Tag,
  BookOpen,
  FileCheck,
  CheckSquare,
  Share2
} from 'lucide-react';
import { useLisStore } from '../../store/useLisStore';

export type TriggerEventType =
  | 'RESULTADO_CRITICO'
  | 'VALIDACION_MEDICA_FINAL'
  | 'VALIDACION_TECNICA'
  | 'MUESTRA_RECHAZADA'
  | 'MUESTRA_RECEPCIONADA'
  | 'RECORDATORIO_PREANALITICO';

export interface MessageTemplate {
  id: string;
  code: string;
  name: string;
  category: TriggerEventType | 'GENERAL';
  header: string;
  body: string;
  footer?: string;
  metaStatus: 'APROBADA' | 'EN_REVISION' | 'LOCAL';
  isDefault?: boolean;
  variables: string[];
  lastModified?: string;
}

export interface NotificationRule {
  id: string;
  name: string;
  triggerEvent: TriggerEventType;
  eventDescription: string;
  enabled: boolean;
  priority: 'STAT_URGENTE' | 'ALTA' | 'ESTANDAR';
  templateId?: string;
  recipients: {
    patient: boolean;
    attendingDoctor: boolean;
    emergencyContact: boolean;
    labSupervisor: boolean;
  };
  channels: {
    whatsapp: boolean;
    smsFallback: boolean;
  };
  deliveryWindow: 'INMEDIATO_24_7' | 'HORARIO_HABIL';
  template: {
    header: string;
    body: string;
    includePdfLink: boolean;
    requirePinAuth: boolean;
    disclaimerLey81: boolean;
  };
  autoReadBackRequired: boolean; // Exige confirmación o acuse de recibo del médico
}

export interface NotificationLog {
  id: string;
  recipientName: string;
  recipientPhone: string;
  recipientType: 'PACIENTE' | 'MEDICO_TRATANTE' | 'SUPERVISOR_LAB';
  orderNumber: string;
  type: TriggerEventType | 'RECORDATORIO_CITA';
  channel: 'WHATSAPP' | 'SMS';
  messageSnippet: string;
  sentAt: string;
  status: 'ENVIADO' | 'ENTREGADO' | 'LEIDO' | 'FALLIDO';
  securityToken: string;
  acknowledgedByDoctor?: boolean;
}

export interface DynamicVariableDef {
  key: string;
  label: string;
  category: 'PACIENTE' | 'ORDEN' | 'RESULTADOS' | 'LABORATORIO' | 'SEGURIDAD';
  description: string;
  exampleValue: string;
}

export const DYNAMIC_VARIABLES: DynamicVariableDef[] = [
  {
    key: '{patientName}',
    label: 'Nombre Paciente',
    category: 'PACIENTE',
    description: 'Nombre y apellido del paciente registrado',
    exampleValue: 'Elena de Icaza'
  },
  {
    key: '{patientId}',
    label: 'Cédula / Documento',
    category: 'PACIENTE',
    description: 'Cédula de identidad personal o pasaporte',
    exampleValue: '8-745-1290'
  },
  {
    key: '{orderId}',
    label: 'Número de Orden',
    category: 'ORDEN',
    description: 'Código de orden de laboratorio (ej. ORD-2026-9045)',
    exampleValue: 'ORD-2026-9045'
  },
  {
    key: '{orderDate}',
    label: 'Fecha de Orden',
    category: 'ORDEN',
    description: 'Fecha de registro de la solicitud',
    exampleValue: '21/08/2026'
  },
  {
    key: '{doctorName}',
    label: 'Médico Tratante',
    category: 'ORDEN',
    description: 'Nombre del médico prescriptor o solicitante',
    exampleValue: 'Dr. Alexis Morales (Cardiología)'
  },
  {
    key: '{resultValue}',
    label: 'Valor del Resultado',
    category: 'RESULTADOS',
    description: 'Valor cuantitativo o cualitativo del análisis',
    exampleValue: '6.8 mEq/L'
  },
  {
    key: '{parameterName}',
    label: 'Nombre de la Prueba',
    category: 'RESULTADOS',
    description: 'Nombre del analito o parámetro analizado',
    exampleValue: 'Potasio Sérico (K+)'
  },
  {
    key: '{referenceRange}',
    label: 'Rango de Referencia',
    category: 'RESULTADOS',
    description: 'Valores normales o de referencia biológica',
    exampleValue: '3.5 - 5.0 mEq/L'
  },
  {
    key: '{branchName}',
    label: 'Sucursal del Laboratorio',
    category: 'LABORATORIO',
    description: 'Nombre de la sede o sucursal de atención',
    exampleValue: 'Sede Central Vía España'
  },
  {
    key: '{portalUrl}',
    label: 'Enlace Portal Paciente',
    category: 'SEGURIDAD',
    description: 'URL protegida con token para descarga de PDF',
    exampleValue: 'https://lis.laboratorio.pa/p/ORD-9045?token=SEC-8921'
  },
  {
    key: '{securityPin}',
    label: 'PIN de Seguridad',
    category: 'SEGURIDAD',
    description: 'Código PIN de 4 dígitos para apertura del PDF',
    exampleValue: '4091'
  },
  {
    key: '{rejectionReason}',
    label: 'Motivo de Rechazo',
    category: 'RESULTADOS',
    description: 'Causa preanalítica (hemólisis, coagulación, etc.)',
    exampleValue: 'Muestra Hemolizada Grado 4 (No analizable)'
  },
  {
    key: '{estimatedTime}',
    label: 'Tiempo Estimado Entrega',
    category: 'ORDEN',
    description: 'Horario programado para disponibilidad de resultados',
    exampleValue: '2 horas (11:30 AM)'
  }
];

const INITIAL_TEMPLATES: MessageTemplate[] = [
  {
    id: 'tpl-critico-panic',
    code: 'TPL_PANIC_ALERT_V2',
    name: 'Alerta de Valor Crítico / Pánico a Médico',
    category: 'RESULTADO_CRITICO',
    header: '🚨 *ALERTA MÉDICA URGENTE - LIS CORE* 🚨',
    body: 'Estimado(a) Dr.(a) {doctorName}:\nSe reporta un *VALOR CRÍTICO DE PÁNICO* para el paciente *{patientName}* (Cédula: {patientId}).\n• Prueba: {parameterName}\n• Resultado: *{resultValue}* (Ref: {referenceRange})\n• Orden: {orderId}\n• Sucursal: {branchName}\n⚠️ Por favor confirme la recepción de esta alerta respondiendo a este mensaje o contactando al laboratorio.',
    footer: 'Acreditación ISO 15189 • Ley 81 de Protección de Datos',
    metaStatus: 'APROBADA',
    isDefault: true,
    variables: ['{doctorName}', '{patientName}', '{patientId}', '{parameterName}', '{resultValue}', '{referenceRange}', '{orderId}', '{branchName}'],
    lastModified: '2026-08-20'
  },
  {
    id: 'tpl-validacion-final',
    code: 'TPL_FINAL_REPORT_DELIVERY',
    name: 'Entrega de Resultados Oficiales Validados',
    category: 'VALIDACION_MEDICA_FINAL',
    header: '📄 *Laboratorio Clínico LIS Core - Resultados Listos*',
    body: 'Estimado(a) *{patientName}*:\nLe informamos que sus exámenes de laboratorio correspondientes a la orden *{orderId}* han sido *validados y firmados electrónicamente* por la Jefatura Médica en la {branchName}.\n\nPuede consultar y descargar su informe oficial en PDF protegido con su Cédula ({patientId}) en el siguiente enlace:\n🔗 {portalUrl}\n\n_Acreditación ISO 15189 • Confidencialidad Ley 81_',
    footer: 'LIS Core Healthcare Services',
    metaStatus: 'APROBADA',
    isDefault: true,
    variables: ['{patientName}', '{orderId}', '{branchName}', '{patientId}', '{portalUrl}'],
    lastModified: '2026-08-19'
  },
  {
    id: 'tpl-muestra-rechazada',
    code: 'TPL_SAMPLE_REJECTED_INCIDENCE',
    name: 'Incidencia Preanalítica / Muestra Rechazada',
    category: 'MUESTRA_RECHAZADA',
    header: '⚠️ *Aviso Importante de Calidad de Muestra - LIS Core*',
    body: 'Estimado(a) *{patientName}*:\nPara garantizar la máxima exactitud en sus análisis de la orden *{orderId}*, nuestro equipo de calidad ha detectado una incidencia técnica en su muestra: *{rejectionReason}*.\n\nLe solicitamos acercarse a {branchName} para una nueva toma de muestra *sin costo adicional*.\n_Disculpe los inconvenientes._',
    footer: 'Departamento de Aseguramiento de Calidad LIS',
    metaStatus: 'APROBADA',
    isDefault: true,
    variables: ['{patientName}', '{orderId}', '{rejectionReason}', '{branchName}'],
    lastModified: '2026-08-18'
  },
  {
    id: 'tpl-muestra-recepcionada',
    code: 'TPL_SAMPLE_IN_PROCESS',
    name: 'Confirmación de Recepción y Toma de Muestra',
    category: 'MUESTRA_RECEPCIONADA',
    header: '🧪 *Muestras Recibidas en Laboratorio Clínico*',
    body: 'Hola *{patientName}*, confirmamos que sus muestras para la orden *{orderId}* ya están en proceso analítico en la {branchName}.\nTiempo estimado de entrega: *{estimatedTime}*.\nLe notificaremos por este medio en cuanto sus resultados estén validados.',
    footer: 'Atención al Paciente LIS Core',
    metaStatus: 'APROBADA',
    isDefault: true,
    variables: ['{patientName}', '{orderId}', '{branchName}', '{estimatedTime}'],
    lastModified: '2026-08-15'
  },
  {
    id: 'tpl-avance-tecnico',
    code: 'TPL_STAT_TECH_PROGRESS',
    name: 'Avance Técnico Parcial Urgente (Hospital / Guardia)',
    category: 'VALIDACION_TECNICA',
    header: '🔬 *Avance Técnico Parcial - LIS Core*',
    body: 'Dr.(a) {doctorName}: Se han validado técnicamente parámetros urgentes de la orden *{orderId}* ({patientName}).\n• {parameterName}: *{resultValue}*\nPendiente validación médica final.',
    footer: 'LIS Core Emergency Fast Track',
    metaStatus: 'APROBADA',
    isDefault: true,
    variables: ['{doctorName}', '{orderId}', '{patientName}', '{parameterName}', '{resultValue}'],
    lastModified: '2026-08-10'
  },
  {
    id: 'tpl-recordatorio-preanalitico',
    code: 'TPL_FASTING_PREP_REMINDER',
    name: 'Recordatorio de Ayuno e Indicaciones Preanalíticas',
    category: 'RECORDATORIO_PREANALITICO',
    header: '⏰ *Recordatorio de Preparación para Exámenes de Laboratorio*',
    body: 'Hola *{patientName}*:\nLe recordamos las indicaciones para su toma de muestra programada para el día *{orderDate}* en {branchName}.\n• Requiere ayuno estricto de 8 a 12 horas (solo agua permitida).\n• Evitar ejercicio físico intenso y bebidas alcohólicas la noche previa.\nCualquier consulta estamos a su disposición.',
    footer: 'Indicaciones Preanalíticas ISO 15189',
    metaStatus: 'LOCAL',
    isDefault: false,
    variables: ['{patientName}', '{orderDate}', '{branchName}'],
    lastModified: '2026-08-12'
  }
];

const DEFAULT_RULES: NotificationRule[] = [
  {
    id: 'rule-stat-panic',
    name: 'Alerta Inmediata de Resultados Críticos / Pánico',
    triggerEvent: 'RESULTADO_CRITICO',
    eventDescription: 'Se activa en el instante en que el analizador o tecnólogo ingresa un valor en rango crítico de pánico.',
    enabled: true,
    priority: 'STAT_URGENTE',
    templateId: 'tpl-critico-panic',
    recipients: {
      patient: false,
      attendingDoctor: true,
      emergencyContact: false,
      labSupervisor: true
    },
    channels: {
      whatsapp: true,
      smsFallback: true
    },
    deliveryWindow: 'INMEDIATO_24_7',
    template: {
      header: '🚨 *ALERTA MÉDICA URGENTE - LIS CORE* 🚨',
      body: 'Estimado(a) Dr.(a) {doctorName}:\nSe reporta un *VALOR CRÍTICO DE PÁNICO* para el paciente *{patientName}* (Cédula: {patientId}).\n• Prueba: {parameterName}\n• Resultado: *{resultValue}* (Ref: {referenceRange})\n• Orden: {orderId}\n• Sucursal: {branchName}\n⚠️ Por favor confirme la recepción de esta alerta respondiendo a este mensaje o contactando al laboratorio.',
      includePdfLink: true,
      requirePinAuth: true,
      disclaimerLey81: true
    },
    autoReadBackRequired: true
  },
  {
    id: 'rule-final-validation',
    name: 'Entrega de Resultados por Validación Médica Final',
    triggerEvent: 'VALIDACION_MEDICA_FINAL',
    eventDescription: 'Se dispara cuando el Médico Jefe valida y firma digitalmente la orden completa.',
    enabled: true,
    priority: 'ESTANDAR',
    templateId: 'tpl-validacion-final',
    recipients: {
      patient: true,
      attendingDoctor: true,
      emergencyContact: false,
      labSupervisor: false
    },
    channels: {
      whatsapp: true,
      smsFallback: false
    },
    deliveryWindow: 'INMEDIATO_24_7',
    template: {
      header: '📄 *Laboratorio Clínico LIS Core - Resultados Listos*',
      body: 'Estimado(a) *{patientName}*:\nLe informamos que sus exámenes de laboratorio correspondientes a la orden *{orderId}* han sido *validados y firmados electrónicamente* por la Jefatura Médica en la {branchName}.\n\nPuede consultar y descargar su informe oficial en PDF protegido con su Cédula ({patientId}) en el siguiente enlace:\n🔗 {portalUrl}\n\n_Acreditación ISO 15189 • Confidencialidad Ley 81_',
      includePdfLink: true,
      requirePinAuth: true,
      disclaimerLey81: true
    },
    autoReadBackRequired: false
  },
  {
    id: 'rule-sample-rejected',
    name: 'Notificación de Muestra Rechazada / Incidencia Preanalítica',
    triggerEvent: 'MUESTRA_RECHAZADA',
    eventDescription: 'Se dispara cuando una muestra es marcada como coagulada, hemolizada severa o insuficiente.',
    enabled: true,
    priority: 'ALTA',
    templateId: 'tpl-muestra-rechazada',
    recipients: {
      patient: true,
      attendingDoctor: true,
      emergencyContact: false,
      labSupervisor: false
    },
    channels: {
      whatsapp: true,
      smsFallback: true
    },
    deliveryWindow: 'HORARIO_HABIL',
    template: {
      header: '⚠️ *Aviso Importante de Calidad de Muestra - LIS Core*',
      body: 'Estimado(a) *{patientName}*:\nPara garantizar la máxima exactitud en sus análisis de la orden *{orderId}*, nuestro equipo de calidad ha detectado una incidencia técnica en su muestra: *{rejectionReason}*.\n\nLe solicitamos acercarse a {branchName} para una nueva toma de muestra *sin costo adicional*.\n_Disculpe los inconvenientes._',
      includePdfLink: false,
      requirePinAuth: false,
      disclaimerLey81: true
    },
    autoReadBackRequired: false
  },
  {
    id: 'rule-sample-received',
    name: 'Confirmación de Recepción y Toma de Muestra',
    triggerEvent: 'MUESTRA_RECEPCIONADA',
    eventDescription: 'Notifica al paciente que sus tubos ingresaron al área analítica y proporciona tiempo estimado.',
    enabled: false,
    priority: 'ESTANDAR',
    templateId: 'tpl-muestra-recepcionada',
    recipients: {
      patient: true,
      attendingDoctor: false,
      emergencyContact: false,
      labSupervisor: false
    },
    channels: {
      whatsapp: true,
      smsFallback: false
    },
    deliveryWindow: 'HORARIO_HABIL',
    template: {
      header: '🧪 *Muestras Recibidas en Laboratorio Clínico*',
      body: 'Hola *{patientName}*, confirmamos que sus muestras para la orden *{orderId}* ya están en proceso analítico en la {branchName}.\nTiempo estimado de entrega: *{estimatedTime}*.\nLe notificaremos por este medio en cuanto sus resultados estén validados.',
      includePdfLink: false,
      requirePinAuth: false,
      disclaimerLey81: false
    },
    autoReadBackRequired: false
  },
  {
    id: 'rule-technical-validation',
    name: 'Validación Técnica Parcial (Médico de Urgencias / Hospital)',
    triggerEvent: 'VALIDACION_TECNICA',
    eventDescription: 'Envía avances parciales de resultados validados técnicamente para pacientes de Urgencias/STAT.',
    enabled: false,
    priority: 'ALTA',
    templateId: 'tpl-avance-tecnico',
    recipients: {
      patient: false,
      attendingDoctor: true,
      emergencyContact: false,
      labSupervisor: false
    },
    channels: {
      whatsapp: true,
      smsFallback: false
    },
    deliveryWindow: 'INMEDIATO_24_7',
    template: {
      header: '🔬 *Avance Técnico Parcial - LIS Core*',
      body: 'Dr.(a) {doctorName}: Se han validado técnicamente parámetros urgentes de la orden *{orderId}* ({patientName}).\n• {parameterName}: *{resultValue}*\nPendiente validación médica final.',
      includePdfLink: true,
      requirePinAuth: true,
      disclaimerLey81: true
    },
    autoReadBackRequired: false
  }
];

const INITIAL_NOTIF_LOGS: NotificationLog[] = [
  {
    id: 'not-301',
    recipientName: 'Sr. Fernando Abrego',
    recipientPhone: '+507 6612-9988',
    recipientType: 'PACIENTE',
    orderNumber: 'ORD-2026-9041',
    type: 'VALIDACION_MEDICA_FINAL',
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
    type: 'RESULTADO_CRITICO',
    channel: 'WHATSAPP',
    messageSnippet: '🚨 ALERTA MÉDICA URGENTE: El paciente Luis Castillo presenta Potasio K+ de 6.8 mEq/L (Valor de Pánico) en Orden ORD-2026-9042.',
    sentAt: '2026-08-12 08:01 AM',
    status: 'LEIDO',
    securityToken: 'STAT-8812',
    acknowledgedByDoctor: true
  },
  {
    id: 'not-303',
    recipientName: 'Lic. Ana Lucía Morales',
    recipientPhone: '+507 6554-3322',
    recipientType: 'PACIENTE',
    orderNumber: 'ORD-2026-9038',
    type: 'VALIDACION_MEDICA_FINAL',
    channel: 'SMS',
    messageSnippet: 'LIS Core: Sus exámenes de laboratorio están listos. Descargue su PDF con el PIN: 4091 en https://lis.app/p/4091',
    sentAt: '2026-08-11 05:20 PM',
    status: 'ENTREGADO',
    securityToken: 'PIN-4091'
  }
];

export const WhatsAppNotificationEngine: React.FC = () => {
  const { orders, patients, currentTenant, currentBranch } = useLisStore();

  const [activeSubTab, setActiveSubTab] = useState<'RULES' | 'TEMPLATES' | 'SIMULATOR' | 'LOGS' | 'SETTINGS'>('TEMPLATES');
  const [rules, setRules] = useState<NotificationRule[]>(DEFAULT_RULES);
  const [templates, setTemplates] = useState<MessageTemplate[]>(INITIAL_TEMPLATES);
  const [logs, setLogs] = useState<NotificationLog[]>(INITIAL_NOTIF_LOGS);

  // Template Management State
  const [selectedTemplateCategory, setSelectedTemplateCategory] = useState<string>('TODAS');
  const [templateSearchQuery, setTemplateSearchQuery] = useState<string>('');
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState<boolean>(false);
  const [previewTemplate, setPreviewTemplate] = useState<MessageTemplate | null>(INITIAL_TEMPLATES[0]);

  // Rule Edit Modal State
  const [editingRule, setEditingRule] = useState<NotificationRule | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Log filter state
  const [selectedType, setSelectedType] = useState<string>('TODOS');
  const [selectedChannel, setSelectedChannel] = useState<string>('TODOS');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Simulator State
  const [simRuleId, setSimRuleId] = useState<string>(DEFAULT_RULES[0].id);
  const [simRecipientPhone, setSimRecipientPhone] = useState<string>('+507 6612-9988');
  const [simSelectedPatientId, setSimSelectedPatientId] = useState<string>(patients[0]?.id || 'p-1');
  const [simSelectedOrderId, setSimSelectedOrderId] = useState<string>(orders[0]?.id || 'ord-1');
  const [simCustomDoctor, setSimCustomDoctor] = useState<string>('Dr. Alexis Morales (Cardiología)');
  const [simCustomParam, setSimCustomParam] = useState<string>('Potasio Sérico (K+)');
  const [simCustomVal, setSimCustomVal] = useState<string>('6.8 mEq/L');
  const [simCustomRef, setSimCustomRef] = useState<string>('3.5 - 5.0 mEq/L');
  const [simFeedbackToast, setSimFeedbackToast] = useState<string | null>(null);

  const selectedPatient = patients.find(p => p.id === simSelectedPatientId) || patients[0];
  const selectedOrder = orders.find(o => o.id === simSelectedOrderId) || orders[0];

  // Helper to extract variables used in a text
  const extractVariables = (text: string): string[] => {
    const matches = text.match(/\{[a-zA-Z0-9_]+\}/g);
    return matches ? Array.from(new Set(matches)) : [];
  };

  // Helper to toggle rule enabled
  const handleToggleRule = (ruleId: string) => {
    setRules(prev =>
      prev.map(r => (r.id === ruleId ? { ...r, enabled: !r.enabled } : r))
    );
    showSaveFeedback('Estado de regla actualizado.');
  };

  const handleOpenEditRule = (rule: NotificationRule) => {
    setEditingRule(JSON.parse(JSON.stringify(rule)));
    setIsEditModalOpen(true);
  };

  const handleSaveRule = () => {
    if (!editingRule) return;
    setRules(prev => prev.map(r => (r.id === editingRule.id ? editingRule : r)));
    setIsEditModalOpen(false);
    setEditingRule(null);
    showSaveFeedback('Configuración de regla guardada con éxito.');
  };

  // Template CRUD Operations
  const handleOpenCreateTemplate = () => {
    const newTpl: MessageTemplate = {
      id: `tpl-${Date.now()}`,
      code: `TPL_CUSTOM_${Math.floor(1000 + Math.random() * 9000)}`,
      name: 'Nueva Plantilla Personalizada',
      category: 'VALIDACION_MEDICA_FINAL',
      header: '📄 *Laboratorio Clínico LIS Core*',
      body: 'Estimado(a) *{patientName}*:\nSu orden *{orderId}* está lista en {branchName}.\nConsulte aquí: {portalUrl}',
      footer: 'LIS Core • ISO 15189',
      metaStatus: 'LOCAL',
      isDefault: false,
      variables: ['{patientName}', '{orderId}', '{branchName}', '{portalUrl}'],
      lastModified: new Date().toISOString().split('T')[0]
    };
    setEditingTemplate(newTpl);
    setIsTemplateModalOpen(true);
  };

  const handleOpenEditTemplate = (tpl: MessageTemplate) => {
    setEditingTemplate(JSON.parse(JSON.stringify(tpl)));
    setIsTemplateModalOpen(true);
  };

  const handleDuplicateTemplate = (tpl: MessageTemplate) => {
    const duplicated: MessageTemplate = {
      ...JSON.parse(JSON.stringify(tpl)),
      id: `tpl-${Date.now()}`,
      code: `${tpl.code}_COPIA`,
      name: `${tpl.name} (Copia)`,
      isDefault: false,
      metaStatus: 'LOCAL',
      lastModified: new Date().toISOString().split('T')[0]
    };
    setTemplates(prev => [duplicated, ...prev]);
    showSaveFeedback(`Plantilla "${tpl.name}" duplicada exitosamente.`);
  };

  const handleDeleteTemplate = (tplId: string) => {
    const tpl = templates.find(t => t.id === tplId);
    if (tpl?.isDefault) {
      alert('No se pueden eliminar las plantillas predeterminadas del sistema.');
      return;
    }
    if (window.confirm(`¿Está seguro de eliminar la plantilla "${tpl?.name}"?`)) {
      setTemplates(prev => prev.filter(t => t.id !== tplId));
      if (previewTemplate?.id === tplId) {
        setPreviewTemplate(templates.find(t => t.id !== tplId) || null);
      }
      showSaveFeedback('Plantilla eliminada correctamente.');
    }
  };

  const handleSaveTemplate = () => {
    if (!editingTemplate) return;
    const computedVariables = extractVariables(`${editingTemplate.header} ${editingTemplate.body}`);
    const updated: MessageTemplate = {
      ...editingTemplate,
      variables: computedVariables,
      lastModified: new Date().toISOString().split('T')[0]
    };

    setTemplates(prev => {
      const exists = prev.some(t => t.id === updated.id);
      if (exists) {
        return prev.map(t => (t.id === updated.id ? updated : t));
      }
      return [updated, ...prev];
    });

    // Also update any linked rule if the body changed
    setRules(prev =>
      prev.map(r => {
        if (r.templateId === updated.id) {
          return {
            ...r,
            template: {
              ...r.template,
              header: updated.header,
              body: updated.body
            }
          };
        }
        return r;
      })
    );

    setPreviewTemplate(updated);
    setIsTemplateModalOpen(false);
    setEditingTemplate(null);
    showSaveFeedback(`Plantilla "${updated.name}" guardada y sincronizada.`);
  };

  const handleCopyTemplateText = (tpl: MessageTemplate) => {
    const fullText = `${tpl.header}\n\n${tpl.body}${tpl.footer ? `\n\n_${tpl.footer}_` : ''}`;
    navigator.clipboard.writeText(fullText);
    showSaveFeedback('Texto de plantilla copiado al portapapeles.');
  };

  const handleRestoreDefaults = () => {
    if (window.confirm('¿Desea restaurar las reglas y plantillas a los valores por defecto del laboratorio?')) {
      setRules(DEFAULT_RULES);
      setTemplates(INITIAL_TEMPLATES);
      showSaveFeedback('Reglas y plantillas restauradas a valores predeterminados.');
    }
  };

  const showSaveFeedback = (msg: string) => {
    setSaveSuccessMsg(msg);
    setTimeout(() => setSaveSuccessMsg(null), 3500);
  };

  const showSimToast = (msg: string) => {
    setSimFeedbackToast(msg);
    setTimeout(() => setSimFeedbackToast(null), 4000);
  };

  // Robust dynamic tag substitution supporting both {patientName} and {paciente_nombre} notations
  const resolveTemplateVariables = (rawText: string): string => {
    const pName = selectedPatient ? `${selectedPatient.firstName} ${selectedPatient.lastName}` : 'Elena de Icaza';
    const pId = selectedPatient?.nationalId || '8-745-1290';
    const ordNum = selectedOrder?.orderNumber || 'ORD-2026-9045';
    const ordDate = selectedOrder?.createdAt ? new Date(selectedOrder.createdAt).toLocaleDateString() : '21/08/2026';
    const docName = selectedOrder?.doctorName || simCustomDoctor;
    const branchName = currentBranch?.name || 'Sede Central Vía España';
    const pin = '4091';
    const portal = `https://lis.laboratorio.pa/p/${ordNum}?token=SEC-${Math.floor(1000 + Math.random() * 9000)}`;

    let text = rawText;

    // Patient
    text = text.replace(/\{(patientName|paciente_nombre|patient_name)\}/gi, pName);
    text = text.replace(/\{(patientId|paciente_cedula|patient_id|cedula)\}/gi, pId);

    // Order
    text = text.replace(/\{(orderId|orden_numero|order_id|order_number)\}/gi, ordNum);
    text = text.replace(/\{(orderDate|fecha_orden|order_date)\}/gi, ordDate);
    text = text.replace(/\{(doctorName|medico_tratante|doctor_name)\}/gi, docName);
    text = text.replace(/\{(branchName|sucursal_nombre|branch_name|sucursal)\}/gi, branchName);

    // Results & Tests
    text = text.replace(/\{(resultValue|resultado_valor|result_value|valor)\}/gi, simCustomVal);
    text = text.replace(/\{(parameterName|parametro_nombre|parameter_name|prueba)\}/gi, simCustomParam);
    text = text.replace(/\{(referenceRange|rango_referencia|reference_range|referencia)\}/gi, simCustomRef);
    text = text.replace(/\{(unit|unidad)\}/gi, '');
    text = text.replace(/\{(rejectionReason|motivo_rechazo|rejection_reason)\}/gi, 'Muestra Hemolizada Grado 4 (No analizable)');
    text = text.replace(/\{(estimatedTime|tiempo_estimado|estimated_time)\}/gi, '2 horas (11:30 AM)');

    // Security & URLs
    text = text.replace(/\{(portalUrl|enlace_portal_paciente|portal_url|link)\}/gi, portal);
    text = text.replace(/\{(securityPin|pin_seguridad|pin)\}/gi, pin);
    text = text.replace(/\{(resumen_parametros)\}/gi, 'Troponina I, Dímero-D');

    return text;
  };

  // Helper to build simulated message text from rule template
  const getRenderedMessage = (rule: NotificationRule) => {
    const combined = `${rule.template.header}\n\n${rule.template.body}`;
    return resolveTemplateVariables(combined);
  };

  const handleTriggerSimulation = (e: React.FormEvent) => {
    e.preventDefault();
    const activeRule = rules.find(r => r.id === simRuleId) || rules[0];
    const isPanic = activeRule.triggerEvent === 'RESULTADO_CRITICO';
    const recipientType = isPanic
      ? 'MEDICO_TRATANTE'
      : activeRule.recipients.attendingDoctor && !activeRule.recipients.patient
      ? 'MEDICO_TRATANTE'
      : 'PACIENTE';

    const pName = selectedPatient ? `${selectedPatient.firstName} ${selectedPatient.lastName}` : 'Elena de Icaza';
    const ordNum = selectedOrder?.orderNumber || 'ORD-2026-9045';
    const renderedMsg = getRenderedMessage(activeRule);

    const newLog: NotificationLog = {
      id: `not-${Date.now()}`,
      recipientName: isPanic ? simCustomDoctor : pName,
      recipientPhone: simRecipientPhone,
      recipientType: recipientType,
      orderNumber: ordNum,
      type: activeRule.triggerEvent,
      channel: activeRule.channels.whatsapp ? 'WHATSAPP' : 'SMS',
      messageSnippet: renderedMsg,
      sentAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'ENTREGADO',
      securityToken: `SEC-${Math.floor(1000 + Math.random() * 9000)}`,
      acknowledgedByDoctor: isPanic ? false : undefined
    };

    setLogs(prev => [newLog, ...prev]);
    showSimToast(`📲 ¡Disparo automático ejecutado exitosamente! Mensaje enviado a ${simRecipientPhone}`);
  };

  const filteredLogs = logs.filter(l => {
    if (selectedChannel !== 'TODOS' && l.channel !== selectedChannel) return false;
    if (selectedType !== 'TODOS' && l.type !== selectedType) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        l.recipientName.toLowerCase().includes(term) ||
        l.orderNumber.toLowerCase().includes(term) ||
        l.messageSnippet.toLowerCase().includes(term)
      );
    }
    return true;
  });

  const filteredTemplates = templates.filter(t => {
    if (selectedTemplateCategory !== 'TODAS' && t.category !== selectedTemplateCategory) return false;
    if (templateSearchQuery) {
      const q = templateSearchQuery.toLowerCase();
      return (
        t.name.toLowerCase().includes(q) ||
        t.code.toLowerCase().includes(q) ||
        t.body.toLowerCase().includes(q) ||
        t.variables.some(v => v.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const activeRulesCount = rules.filter(r => r.enabled).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Toast Feedback */}
      {saveSuccessMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center space-x-3 border border-emerald-400/40 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-5 h-5 text-emerald-200" />
          <span className="text-xs font-bold">{saveSuccessMsg}</span>
        </div>
      )}

      {simFeedbackToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-teal-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center space-x-3 border border-teal-400/40 animate-in slide-in-from-bottom-5">
          <Send className="w-5 h-5 text-teal-200" />
          <span className="text-xs font-bold">{simFeedbackToast}</span>
        </div>
      )}

      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-950 border border-emerald-500/30 p-6 sm:p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden backdrop-blur-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="text-emerald-400 text-xs font-black uppercase tracking-[0.2em] flex items-center space-x-2">
              <MessageSquare className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span>Motor de Notificaciones & Plantillas Dinámicas • LIS Core</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Gestor de Plantillas & Notificaciones WhatsApp
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Personaliza los avisos clínicos y mensajes automáticos mediante variables dinámicas como <code className="bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono text-[11px] font-bold">&#123;patientName&#125;</code>, <code className="bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono text-[11px] font-bold">&#123;orderId&#125;</code> y <code className="bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono text-[11px] font-bold">&#123;resultValue&#125;</code>.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <button
              onClick={handleOpenCreateTemplate}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-4 py-2.5 rounded-2xl flex items-center space-x-2 text-xs transition shadow-lg shadow-emerald-500/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Plantilla</span>
            </button>
            <div className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono text-xs font-bold px-3.5 py-2 rounded-2xl flex items-center space-x-2 shadow-inner">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
              <span>Meta API: ACTIVA</span>
            </div>
          </div>
        </div>

        {/* Counter KPI Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-white/10">
          <div className="bg-slate-950/60 border border-white/5 p-4 rounded-2xl space-y-1">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Plantillas Registradas</div>
            <div className="text-2xl font-black font-mono text-emerald-400">{templates.length} Plantillas</div>
            <div className="text-[10px] text-emerald-300 font-bold">13 Variables Dinámicas</div>
          </div>

          <div className="bg-slate-950/60 border border-white/5 p-4 rounded-2xl space-y-1">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Reglas Automatizadas</div>
            <div className="text-2xl font-black font-mono text-teal-300">{activeRulesCount} Reglas Activas</div>
            <div className="text-[10px] text-teal-400 font-bold">Disparo por Evento Clínico</div>
          </div>

          <div className="bg-slate-950/60 border border-white/5 p-4 rounded-2xl space-y-1">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Alertas STAT Enviadas</div>
            <div className="text-2xl font-black font-mono text-rose-400">
              {logs.filter(l => l.type === 'RESULTADO_CRITICO').length} Críticos
            </div>
            <div className="text-[10px] text-rose-300 font-bold">Tiempo Promedio: 1.2s</div>
          </div>

          <div className="bg-slate-950/60 border border-white/5 p-4 rounded-2xl space-y-1">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Seguridad & Cifrado</div>
            <div className="text-2xl font-black font-mono text-indigo-300">Ley 81</div>
            <div className="text-[10px] text-indigo-400 font-bold">Token & PIN Temporal</div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/80 p-2 rounded-2xl border border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveSubTab('TEMPLATES')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition flex items-center space-x-2 cursor-pointer ${
              activeSubTab === 'TEMPLATES'
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Gestor de Plantillas ({templates.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('RULES')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition flex items-center space-x-2 cursor-pointer ${
              activeSubTab === 'RULES'
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Disparadores de Órdenes</span>
          </button>

          <button
            onClick={() => setActiveSubTab('SIMULATOR')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition flex items-center space-x-2 cursor-pointer ${
              activeSubTab === 'SIMULATOR'
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Simulador en Vivo</span>
          </button>

          <button
            onClick={() => setActiveSubTab('LOGS')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition flex items-center space-x-2 cursor-pointer ${
              activeSubTab === 'LOGS'
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Bitácora ({logs.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('SETTINGS')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition flex items-center space-x-2 cursor-pointer ${
              activeSubTab === 'SETTINGS'
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Parámetros API</span>
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleRestoreDefaults}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition flex items-center space-x-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Valores Predeterminados</span>
          </button>
        </div>
      </div>

      {/* SECTION: TEMPLATES MANAGER */}
      {activeSubTab === 'TEMPLATES' && (
        <div className="space-y-6">
          {/* Variables Reference Quick Bar */}
          <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-3xl shadow-xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2 text-xs font-black text-white">
                <Tag className="w-4 h-4 text-emerald-400" />
                <span>Variables Dinámicas Disponibles para Personalización</span>
              </div>
              <span className="text-[10px] text-slate-400">
                Haz clic en cualquier variable para insertarla o copiarla al portapapeles.
              </span>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {DYNAMIC_VARIABLES.map(v => (
                <button
                  key={v.key}
                  onClick={() => {
                    navigator.clipboard.writeText(v.key);
                    showSaveFeedback(`Variable ${v.key} copiada al portapapeles.`);
                  }}
                  className="bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/40 px-3 py-1.5 rounded-xl text-left transition flex items-center space-x-2 group cursor-pointer"
                  title={`${v.description} (Ejemplo: ${v.exampleValue})`}
                >
                  <code className="text-emerald-400 font-mono text-[11px] font-bold group-hover:text-emerald-300">
                    {v.key}
                  </code>
                  <span className="text-[10px] text-slate-400 font-medium">({v.label})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Templates Grid & Preview Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Templates List */}
            <div className="lg:col-span-7 space-y-4">
              {/* Filter & Search Toolbar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Buscar por nombre, código o variable..."
                    value={templateSearchQuery}
                    onChange={(e) => setTemplateSearchQuery(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-xs text-white pl-8 pr-3 py-1.5 rounded-xl font-medium focus:border-emerald-500/50"
                  />
                </div>

                <select
                  value={selectedTemplateCategory}
                  onChange={(e) => setSelectedTemplateCategory(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-xs font-bold text-slate-200 rounded-xl px-3 py-1.5"
                >
                  <option value="TODAS">Todas las Categorías</option>
                  <option value="RESULTADO_CRITICO">Resultados Críticos (Pánico)</option>
                  <option value="VALIDACION_MEDICA_FINAL">Validación Médica Final</option>
                  <option value="MUESTRA_RECHAZADA">Muestra Rechazada</option>
                  <option value="MUESTRA_RECEPCIONADA">Muestra Recepcionada</option>
                  <option value="VALIDACION_TECNICA">Validación Técnica Parcial</option>
                  <option value="RECORDATORIO_PREANALITICO">Recordatorios Preanalíticos</option>
                </select>
              </div>

              {/* Templates Cards List */}
              <div className="space-y-3">
                {filteredTemplates.map((tpl) => {
                  const isSelected = previewTemplate?.id === tpl.id;
                  const isCritical = tpl.category === 'RESULTADO_CRITICO';

                  return (
                    <div
                      key={tpl.id}
                      onClick={() => setPreviewTemplate(tpl)}
                      className={`p-5 rounded-3xl border transition cursor-pointer relative overflow-hidden ${
                        isSelected
                          ? 'bg-slate-900 border-emerald-500/60 shadow-xl ring-1 ring-emerald-500/30'
                          : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                              isCritical
                                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            }`}
                          >
                            {tpl.category.replace(/_/g, ' ')}
                          </span>

                          <span className="font-mono text-[10px] text-slate-400 font-bold">{tpl.code}</span>

                          {tpl.metaStatus === 'APROBADA' ? (
                            <span className="bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 text-[9px] px-2 py-0.5 rounded-md font-bold flex items-center space-x-1">
                              <Check className="w-2.5 h-2.5" />
                              <span>Meta Aprobada</span>
                            </span>
                          ) : (
                            <span className="bg-amber-950/60 text-amber-400 border border-amber-500/30 text-[9px] px-2 py-0.5 rounded-md font-bold">
                              Local LIS
                            </span>
                          )}
                        </div>

                        <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleCopyTemplateText(tpl)}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                            title="Copiar texto de plantilla"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDuplicateTemplate(tpl)}
                            className="p-1.5 text-slate-400 hover:text-teal-300 hover:bg-slate-800 rounded-lg transition"
                            title="Duplicar plantilla"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEditTemplate(tpl)}
                            className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition"
                            title="Editar plantilla"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          {!tpl.isDefault && (
                            <button
                              onClick={() => handleDeleteTemplate(tpl.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                              title="Eliminar plantilla"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <h3 className="font-bold text-white text-sm mb-1">{tpl.name}</h3>

                      <p className="text-slate-400 text-xs line-clamp-2 leading-relaxed font-sans mb-3">
                        {tpl.body}
                      </p>

                      {/* Variables Tags */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-800/80">
                        <span className="text-[10px] text-slate-500 font-bold">Variables ({tpl.variables.length}):</span>
                        {tpl.variables.map(v => (
                          <span
                            key={v}
                            className="bg-slate-950 text-teal-300 border border-teal-500/20 text-[10px] px-2 py-0.5 rounded-md font-mono font-medium"
                          >
                            {v}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Live Interactive Mobile Preview */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl shadow-xl flex flex-col items-center justify-center sticky top-4">
                <div className="w-full flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Smartphone className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold text-white text-xs">Previsualización en Vivo de Plantilla</span>
                  </div>
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono font-bold">
                    WhatsApp Web / App
                  </span>
                </div>

                {/* Phone Simulator */}
                <div className="w-full max-w-sm bg-slate-950 rounded-[2.5rem] p-4 border-4 border-slate-800 shadow-2xl relative">
                  {/* Speaker Notch */}
                  <div className="w-24 h-3.5 bg-slate-800 rounded-full mx-auto mb-3"></div>

                  {/* Header */}
                  <div className="bg-emerald-800 text-white p-3 rounded-2xl flex items-center space-x-3 mb-3 shadow">
                    <div className="w-9 h-9 rounded-full bg-emerald-700 border border-emerald-500/40 flex items-center justify-center text-white font-black text-xs">
                      LIS
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-white truncate">Laboratorio Clínico LIS Core</div>
                      <div className="text-[10px] text-emerald-200 flex items-center space-x-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-300"></span>
                        <span>Cuenta Oficial • WhatsApp Business</span>
                      </div>
                    </div>
                    <ShieldCheck className="w-4 h-4 text-emerald-300" />
                  </div>

                  {/* WhatsApp Message Bubble */}
                  <div className="bg-[#0b141a] rounded-2xl p-3 min-h-[300px] flex flex-col justify-end space-y-2 text-slate-200">
                    {previewTemplate ? (
                      <div className="bg-[#005c4b] text-white p-3.5 rounded-2xl rounded-tr-none text-xs space-y-2 shadow-md leading-relaxed whitespace-pre-wrap font-sans">
                        <div className="font-bold text-emerald-100">{previewTemplate.header}</div>
                        <div>
                          {resolveTemplateVariables(previewTemplate.body)}
                        </div>
                        {previewTemplate.footer && (
                          <div className="text-[10px] text-emerald-200/70 border-t border-emerald-600/40 pt-1.5 mt-1.5">
                            {previewTemplate.footer}
                          </div>
                        )}
                        <div className="flex items-center justify-end space-x-1 text-[9px] text-emerald-200/80 pt-1">
                          <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          <CheckCheck className="w-3.5 h-3.5 text-sky-400" />
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-slate-500 text-xs py-8">
                        Selecciona una plantilla para ver su simulación.
                      </div>
                    )}
                  </div>

                  {/* Phone Bottom Notch */}
                  <div className="w-32 h-1 bg-slate-700 rounded-full mx-auto mt-4"></div>
                </div>

                {previewTemplate && (
                  <div className="w-full mt-4 pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
                    <button
                      onClick={() => handleOpenEditTemplate(previewTemplate)}
                      className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-bold transition flex items-center space-x-1.5 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Editar Plantilla</span>
                    </button>

                    <button
                      onClick={() => {
                        setSimRuleId(rules.find(r => r.triggerEvent === previewTemplate.category)?.id || rules[0].id);
                        setActiveSubTab('SIMULATOR');
                      }}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-teal-300 rounded-xl font-bold transition flex items-center space-x-1.5 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Simular Envío Real</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION: RULES DISPATCH CONFIGURATION */}
      {activeSubTab === 'RULES' && (
        <div className="space-y-4">
          <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-400">
            <div className="flex items-center space-x-2">
              <Info className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Asocia qué plantilla de mensaje se utiliza para cada evento clínico y define los destinatarios autorizados bajo la normativa ISO 15189.
              </span>
            </div>
            <div className="flex items-center space-x-2 font-mono text-[11px] text-emerald-400 font-bold shrink-0">
              <ShieldCheck className="w-4 h-4" />
              <span>Tokens Protegidos con Cifrado AES-256</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {rules.map((rule) => {
              const isPanic = rule.triggerEvent === 'RESULTADO_CRITICO';
              const isFinal = rule.triggerEvent === 'VALIDACION_MEDICA_FINAL';

              return (
                <div
                  key={rule.id}
                  className={`bg-slate-900/90 border rounded-3xl p-5 sm:p-6 transition shadow-xl relative overflow-hidden ${
                    rule.enabled
                      ? isPanic
                        ? 'border-rose-500/40 bg-slate-900/95'
                        : isFinal
                        ? 'border-emerald-500/40 bg-slate-900/95'
                        : 'border-slate-700 hover:border-slate-600'
                      : 'border-slate-800 opacity-60 bg-slate-950/40'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left: Info */}
                    <div className="space-y-2 max-w-2xl">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                            isPanic
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                              : isFinal
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : 'bg-teal-500/10 text-teal-300 border-teal-500/30'
                          }`}
                        >
                          {rule.triggerEvent.replace(/_/g, ' ')}
                        </span>

                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                            rule.priority === 'STAT_URGENTE'
                              ? 'bg-red-500/20 text-red-300'
                              : rule.priority === 'ALTA'
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-blue-500/20 text-blue-300'
                          }`}
                        >
                          Prioridad: {rule.priority}
                        </span>

                        <span className="text-xs text-slate-500 font-mono">
                          {rule.deliveryWindow === 'INMEDIATO_24_7' ? '⏱ 24/7 Inmediato' : '⏰ Horario Hábil'}
                        </span>
                      </div>

                      <h3 className="text-base sm:text-lg font-black text-white flex items-center space-x-2">
                        <span>{rule.name}</span>
                        {isPanic && <AlertTriangle className="w-4 h-4 text-rose-400 animate-pulse" />}
                      </h3>

                      <p className="text-xs text-slate-400 leading-relaxed">{rule.eventDescription}</p>

                      {/* Recipient & Channel Chips */}
                      <div className="flex flex-wrap items-center gap-2 pt-2">
                        <div className="text-[11px] font-bold text-slate-400">Destinatarios:</div>
                        {rule.recipients.patient && (
                          <span className="bg-slate-800 text-teal-300 border border-teal-500/30 px-2.5 py-1 rounded-xl text-[10px] font-bold flex items-center space-x-1">
                            <User className="w-3 h-3" />
                            <span>Paciente</span>
                          </span>
                        )}
                        {rule.recipients.attendingDoctor && (
                          <span className="bg-slate-800 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-xl text-[10px] font-bold flex items-center space-x-1">
                            <PhoneCall className="w-3 h-3" />
                            <span>Médico Tratante</span>
                          </span>
                        )}
                        {rule.recipients.labSupervisor && (
                          <span className="bg-slate-800 text-purple-300 border border-purple-500/30 px-2.5 py-1 rounded-xl text-[10px] font-bold flex items-center space-x-1">
                            <Activity className="w-3 h-3" />
                            <span>Supervisor de Guardia</span>
                          </span>
                        )}

                        <div className="h-3 w-px bg-slate-700 mx-1"></div>

                        <div className="text-[11px] font-bold text-slate-400">Canal:</div>
                        {rule.channels.whatsapp && (
                          <span className="bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-lg text-[10px] font-bold">
                            WhatsApp Business
                          </span>
                        )}
                        {rule.channels.smsFallback && (
                          <span className="bg-blue-950/60 text-blue-300 border border-blue-500/40 px-2 py-0.5 rounded-lg text-[10px] font-bold">
                            SMS Failover
                          </span>
                        )}
                        {rule.autoReadBackRequired && (
                          <span className="bg-rose-950/60 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded-lg text-[10px] font-bold flex items-center space-x-1">
                            <CheckCheck className="w-3 h-3" />
                            <span>Exige Acuse de Recibo</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right: Controls */}
                    <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-800">
                      {/* Active Switch */}
                      <button
                        onClick={() => handleToggleRule(rule.id)}
                        className={`flex items-center space-x-2 px-3.5 py-2 rounded-2xl font-black text-xs transition cursor-pointer ${
                          rule.enabled
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 hover:bg-emerald-500/30'
                            : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
                        }`}
                      >
                        <span className={`w-2.5 h-2.5 rounded-full ${rule.enabled ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`}></span>
                        <span>{rule.enabled ? 'DISPARO ACTIVO' : 'DESACTIVADO'}</span>
                      </button>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setSimRuleId(rule.id);
                            setActiveSubTab('SIMULATOR');
                          }}
                          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition flex items-center space-x-1 cursor-pointer"
                          title="Probar en simulador"
                        >
                          <Send className="w-3.5 h-3.5 text-teal-400" />
                          <span className="hidden sm:inline">Probar</span>
                        </button>

                        <button
                          onClick={() => handleOpenEditRule(rule)}
                          className="px-3 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-black transition flex items-center space-x-1.5 shadow-lg shadow-emerald-500/10 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Editar Regla</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION: SIMULATOR & TEST SENDER */}
      {activeSubTab === 'SIMULATOR' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Form: Configuration */}
          <div className="lg:col-span-6 bg-slate-900/90 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-base flex items-center space-x-2">
                <Smartphone className="w-5 h-5 text-emerald-400" />
                <span>Simulador de Disparos de WhatsApp</span>
              </h3>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-1 rounded-full font-bold">
                Meta Cloud Sandbox
              </span>
            </div>

            <form onSubmit={handleTriggerSimulation} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-300 block mb-1.5">Regla / Evento a Disparar:</label>
                <select
                  value={simRuleId}
                  onChange={(e) => setSimRuleId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white font-bold"
                >
                  {rules.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.triggerEvent})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-300 block mb-1.5">Paciente de Prueba:</label>
                  <select
                    value={simSelectedPatientId}
                    onChange={(e) => setSimSelectedPatientId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                  >
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.firstName} {p.lastName} ({p.nationalId})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-300 block mb-1.5">Orden Clínica:</label>
                  <select
                    value={simSelectedOrderId}
                    onChange={(e) => setSimSelectedOrderId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
                  >
                    {orders.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.orderNumber} - {o.priority} ({o.status})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1.5">Número WhatsApp Destinatario (+507):</label>
                <input
                  type="text"
                  value={simRecipientPhone}
                  onChange={(e) => setSimRecipientPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono text-sm"
                  placeholder="+507 6612-9988"
                  required
                />
              </div>

              {/* Conditional inputs if panic rule selected */}
              {rules.find(r => r.id === simRuleId)?.triggerEvent === 'RESULTADO_CRITICO' && (
                <div className="bg-rose-950/20 border border-rose-500/30 p-3.5 rounded-2xl space-y-3">
                  <div className="text-[11px] font-bold text-rose-300 uppercase flex items-center space-x-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                    <span>Parámetros de Alerta Crítica (Pánico)</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Prueba / Analito:</label>
                      <input
                        type="text"
                        value={simCustomParam}
                        onChange={(e) => setSimCustomParam(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white text-[11px]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Valor Crítico:</label>
                      <input
                        type="text"
                        value={simCustomVal}
                        onChange={(e) => setSimCustomVal(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-rose-300 font-mono font-bold text-[11px]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Médico Tratante / Contacto:</label>
                    <input
                      type="text"
                      value={simCustomDoctor}
                      onChange={(e) => setSimCustomDoctor(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white text-[11px]"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3.5 rounded-2xl transition shadow-lg shadow-emerald-500/20 flex items-center justify-center space-x-2 text-xs cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Disparar Notificación Automática</span>
              </button>
            </form>
          </div>

          {/* Right Phone Mockup: WhatsApp Live Preview */}
          <div className="lg:col-span-6 bg-slate-900/90 border border-slate-800 p-6 rounded-3xl shadow-xl flex flex-col items-center justify-center">
            <div className="w-full max-w-sm bg-slate-950 rounded-[2.5rem] p-4 border-4 border-slate-800 shadow-2xl relative">
              {/* Phone Speaker Notch */}
              <div className="w-24 h-4 bg-slate-800 rounded-full mx-auto mb-3"></div>

              {/* WhatsApp App Header */}
              <div className="bg-emerald-800 text-white p-3 rounded-2xl flex items-center space-x-3 mb-3 shadow">
                <div className="w-9 h-9 rounded-full bg-emerald-700 border border-emerald-500/40 flex items-center justify-center text-white font-black text-xs">
                  LIS
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-white truncate">Laboratorio Clínico LIS Core</div>
                  <div className="text-[10px] text-emerald-200 flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-300"></span>
                    <span>Cuenta Verificada • Bot Oficial</span>
                  </div>
                </div>
                <ShieldCheck className="w-4 h-4 text-emerald-300" />
              </div>

              {/* Chat Message Bubble */}
              <div className="bg-[#0b141a] rounded-2xl p-3 min-h-[280px] flex flex-col justify-end space-y-2 text-slate-200">
                <div className="bg-[#005c4b] text-white p-3.5 rounded-2xl rounded-tr-none text-xs space-y-2 shadow-md leading-relaxed whitespace-pre-wrap font-sans">
                  {getRenderedMessage(rules.find(r => r.id === simRuleId) || rules[0])}

                  <div className="flex items-center justify-end space-x-1 text-[9px] text-emerald-200/80 pt-1">
                    <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <CheckCheck className="w-3.5 h-3.5 text-sky-400" />
                  </div>
                </div>
              </div>

              {/* Phone Home Bar */}
              <div className="w-32 h-1 bg-slate-700 rounded-full mx-auto mt-4"></div>
            </div>
            <div className="text-center text-[11px] text-slate-400 mt-4">
              Previsualización renderizada en tiempo real según plantilla y variables dinámicas.
            </div>
          </div>
        </div>
      )}

      {/* SECTION: TRANSMISSION LOGS & AUDIT */}
      {activeSubTab === 'LOGS' && (
        <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="font-bold text-white text-base flex items-center space-x-2">
              <Bell className="w-5 h-5 text-emerald-400" />
              <span>Bitácora de Envíos WhatsApp & SMS en Tiempo Real</span>
            </h3>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar paciente, orden..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-xs text-white pl-8 pr-3 py-1.5 rounded-xl font-medium"
                />
              </div>

              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-xs font-bold text-slate-200 rounded-xl px-3 py-1.5"
              >
                <option value="TODOS">Todos los Disparadores</option>
                <option value="RESULTADO_CRITICO">Valores Críticos (Pánico)</option>
                <option value="VALIDACION_MEDICA_FINAL">Validación Médica Final</option>
                <option value="MUESTRA_RECHAZADA">Muestra Rechazada</option>
                <option value="MUESTRA_RECEPCIONADA">Muestra Recepcionada</option>
              </select>

              <select
                value={selectedChannel}
                onChange={(e) => setSelectedChannel(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-xs font-bold text-slate-200 rounded-xl px-3 py-1.5"
              >
                <option value="TODOS">Todos los Canales</option>
                <option value="WHATSAPP">WhatsApp Business</option>
                <option value="SMS">SMS</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 text-[10px] font-black uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3">Destinatario / Teléfono</th>
                  <th className="p-3">Tipo / Disparador</th>
                  <th className="p-3">Orden</th>
                  <th className="p-3">Mensaje Transmitido</th>
                  <th className="p-3 text-center">Hora</th>
                  <th className="p-3 text-center">Estado de Entrega</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500 text-xs">
                      No se encontraron registros con los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => {
                    const isPanic = log.type === 'RESULTADO_CRITICO';

                    return (
                      <tr key={log.id} className="hover:bg-slate-800/40 transition">
                        <td className="p-3">
                          <div className="font-bold text-white flex items-center space-x-1.5">
                            <span>{log.recipientName}</span>
                            {log.recipientType === 'MEDICO_TRATANTE' && (
                              <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-bold">
                                Médico
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">{log.recipientPhone}</div>
                        </td>

                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${
                              isPanic
                                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            }`}
                          >
                            {log.type.replace(/_/g, ' ')}
                          </span>
                        </td>

                        <td className="p-3 font-mono font-bold text-teal-300">{log.orderNumber}</td>

                        <td className="p-3 max-w-xs">
                          <div className="text-slate-300 text-[11px] line-clamp-2">{log.messageSnippet}</div>
                          <div className="text-[9px] text-slate-500 font-mono mt-0.5">Token: {log.securityToken}</div>
                        </td>

                        <td className="p-3 text-center font-mono text-slate-400">{log.sentAt}</td>

                        <td className="p-3 text-center">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-black border inline-flex items-center space-x-1 ${
                              log.status === 'LEIDO'
                                ? 'bg-sky-500/15 text-sky-300 border-sky-500/30'
                                : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                            }`}
                          >
                            <CheckCheck className="w-3 h-3 text-sky-400" />
                            <span>{log.status}</span>
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION: SETTINGS */}
      {activeSubTab === 'SETTINGS' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4">
            <h3 className="font-bold text-white text-base flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span>Configuración de Meta WhatsApp Business Cloud API</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-300 block mb-1">WhatsApp Business Account ID (WABA):</label>
                <input
                  type="text"
                  disabled
                  value="WABA-9912048-LISCORE-PANAMA"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-400 font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Número Emisor del Laboratorio:</label>
                <input
                  type="text"
                  disabled
                  value="+507 6612-9988 (LIS Core Notifier)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-emerald-300 font-mono font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Webhook de Confirmación de Lectura (Double Check):</label>
                <input
                  type="text"
                  disabled
                  value="https://api.laboratoriolab.com/webhooks/whatsapp/read-receipts"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-400 font-mono text-[11px]"
                />
              </div>
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4">
            <h3 className="font-bold text-white text-base flex items-center space-x-2">
              <Lock className="w-5 h-5 text-indigo-400" />
              <span>Protección de Datos & Cumplimiento Ley 81</span>
            </h3>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1">
                <div className="font-bold text-white flex items-center space-x-1.5">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Cifrado de Enlaces PDF (Token Expirable)</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Los enlaces enviados caducan automáticamente a los 30 días de su emisión y requieren validación del PIN o Cédula del paciente.
                </p>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1">
                <div className="font-bold text-white flex items-center space-x-1.5">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Opt-In / Consentimiento de Mensajería</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Se registra la aceptación de envío de resultados por mensajería instantánea en el momento de la admisión en Recepción.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TEMPLATE EDIT / CREATE MODAL */}
      {isTemplateModalOpen && editingTemplate && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto space-y-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                    Editor de Plantillas de Mensajes
                  </span>
                  <h3 className="text-lg font-black text-white">{editingTemplate.name}</h3>
                </div>
              </div>
              <button
                onClick={() => setIsTemplateModalOpen(false)}
                className="text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800 hover:bg-slate-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Nombre Descriptivo de la Plantilla:</label>
                  <input
                    type="text"
                    value={editingTemplate.name}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-bold"
                    placeholder="Ej. Entrega de Resultados Urgencias"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-300 block mb-1">Código Identificador (Meta API):</label>
                  <input
                    type="text"
                    value={editingTemplate.code}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, code: e.target.value.toUpperCase().replace(/\s+/g, '_') })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-emerald-300 font-mono font-bold"
                    placeholder="TPL_CUSTOM_NAME"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Categoría / Evento Asociado:</label>
                  <select
                    value={editingTemplate.category}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, category: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-bold"
                  >
                    <option value="RESULTADO_CRITICO">Resultado Crítico (Pánico)</option>
                    <option value="VALIDACION_MEDICA_FINAL">Validación Médica Final</option>
                    <option value="MUESTRA_RECHAZADA">Muestra Rechazada</option>
                    <option value="MUESTRA_RECEPCIONADA">Muestra Recepcionada</option>
                    <option value="VALIDACION_TECNICA">Validación Técnica Parcial</option>
                    <option value="RECORDATORIO_PREANALITICO">Recordatorio Preanalítico</option>
                    <option value="GENERAL">General / Informativo</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-300 block mb-1">Estado de Aprobación Meta:</label>
                  <select
                    value={editingTemplate.metaStatus}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, metaStatus: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-bold"
                  >
                    <option value="APROBADA">Aprobada en Meta Business Manager</option>
                    <option value="EN_REVISION">En Revisión por Meta</option>
                    <option value="LOCAL">Borrador / Local LIS</option>
                  </select>
                </div>
              </div>

              {/* Header */}
              <div>
                <label className="font-bold text-slate-300 block mb-1">Encabezado del Mensaje (Header):</label>
                <input
                  type="text"
                  value={editingTemplate.header}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, header: e.target.value })}
                  placeholder="Encabezado del mensaje con emojis..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-bold"
                />
              </div>

              {/* Body */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-300 block">Cuerpo del Mensaje (Body):</label>
                  <span className="text-[10px] text-emerald-400 font-mono">
                    Usa *negrita*, _cursiva_ y variables dinámicas
                  </span>
                </div>

                <textarea
                  rows={6}
                  value={editingTemplate.body}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, body: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white font-mono text-[11px] leading-relaxed"
                />

                {/* Variable Inserter Toolbar */}
                <div className="space-y-1.5 bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
                  <div className="flex items-center space-x-1.5 text-[10px] text-slate-400 font-bold">
                    <Sparkles className="w-3 h-3 text-emerald-400" />
                    <span>Insertar variable dinámica en el cursor:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {DYNAMIC_VARIABLES.map(v => (
                      <button
                        key={v.key}
                        type="button"
                        onClick={() => {
                          setEditingTemplate({
                            ...editingTemplate,
                            body: editingTemplate.body + ' ' + v.key
                          });
                        }}
                        className="bg-slate-800 hover:bg-slate-700 text-teal-300 text-[10px] px-2 py-0.5 rounded-md font-mono transition cursor-pointer"
                        title={v.description}
                      >
                        {v.key}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div>
                <label className="font-bold text-slate-300 block mb-1">Pie de Mensaje (Footer Opcional):</label>
                <input
                  type="text"
                  value={editingTemplate.footer || ''}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, footer: e.target.value })}
                  placeholder="Ej. Acreditación ISO 15189 • LIS Core"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-300 text-xs"
                />
              </div>

              {/* Live Preview Inside Modal */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                  <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Previsualización de Sustitución en Tiempo Real</span>
                </div>
                <div className="bg-[#005c4b] text-white p-3 rounded-xl text-xs space-y-1 font-sans whitespace-pre-wrap">
                  <div className="font-bold">{editingTemplate.header}</div>
                  <div>{resolveTemplateVariables(editingTemplate.body)}</div>
                  {editingTemplate.footer && (
                    <div className="text-[10px] text-emerald-200/70 border-t border-emerald-600/30 pt-1 mt-1">
                      {editingTemplate.footer}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 border-t border-slate-800 pt-4">
              <button
                type="button"
                onClick={() => setIsTemplateModalOpen(false)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveTemplate}
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-black transition shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                Guardar Plantilla
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT RULE MODAL */}
      {isEditModalOpen && editingRule && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                  Configuración del Disparador
                </span>
                <h3 className="text-lg font-black text-white">{editingRule.name}</h3>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800 hover:bg-slate-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Template Association Dropdown */}
              <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 space-y-2">
                <label className="font-bold text-white block">Plantilla de Mensaje Vinculada:</label>
                <select
                  value={editingRule.templateId || ''}
                  onChange={(e) => {
                    const selTpl = templates.find(t => t.id === e.target.value);
                    if (selTpl) {
                      setEditingRule({
                        ...editingRule,
                        templateId: selTpl.id,
                        template: {
                          ...editingRule.template,
                          header: selTpl.header,
                          body: selTpl.body
                        }
                      });
                    }
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-emerald-300 font-bold"
                >
                  <option value="">-- Personalizado (Sin Plantilla Guardada) --</option>
                  {templates.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Event & Priority */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Evento Disparador:</label>
                  <select
                    value={editingRule.triggerEvent}
                    onChange={(e) =>
                      setEditingRule({ ...editingRule, triggerEvent: e.target.value as TriggerEventType })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-bold"
                  >
                    <option value="RESULTADO_CRITICO">Resultado Crítico / Valor de Pánico</option>
                    <option value="VALIDACION_MEDICA_FINAL">Validación Médica Final</option>
                    <option value="VALIDACION_TECNICA">Validación Técnica Parcial</option>
                    <option value="MUESTRA_RECHAZADA">Muestra Rechazada / Incidencia</option>
                    <option value="MUESTRA_RECEPCIONADA">Muestra Recepcionada en Proceso</option>
                    <option value="RECORDATORIO_PREANALITICO">Recordatorio Preanalítico</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-300 block mb-1">Nivel de Prioridad:</label>
                  <select
                    value={editingRule.priority}
                    onChange={(e) =>
                      setEditingRule({ ...editingRule, priority: e.target.value as any })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-bold"
                  >
                    <option value="STAT_URGENTE">STAT / Urgente Inmediato</option>
                    <option value="ALTA">Alta Prioridad</option>
                    <option value="ESTANDAR">Estándar</option>
                  </select>
                </div>
              </div>

              {/* Recipients Selection */}
              <div>
                <label className="font-bold text-slate-300 block mb-2">Destinatarios que Reciben el Mensaje:</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <label className="flex items-center space-x-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingRule.recipients.patient}
                      onChange={(e) =>
                        setEditingRule({
                          ...editingRule,
                          recipients: { ...editingRule.recipients, patient: e.target.checked }
                        })
                      }
                      className="rounded border-slate-700 text-emerald-500 focus:ring-0"
                    />
                    <span className="text-slate-200 font-bold">Paciente</span>
                  </label>

                  <label className="flex items-center space-x-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingRule.recipients.attendingDoctor}
                      onChange={(e) =>
                        setEditingRule({
                          ...editingRule,
                          recipients: { ...editingRule.recipients, attendingDoctor: e.target.checked }
                        })
                      }
                      className="rounded border-slate-700 text-emerald-500 focus:ring-0"
                    />
                    <span className="text-slate-200 font-bold">Médico Tratante</span>
                  </label>

                  <label className="flex items-center space-x-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingRule.recipients.labSupervisor}
                      onChange={(e) =>
                        setEditingRule({
                          ...editingRule,
                          recipients: { ...editingRule.recipients, labSupervisor: e.target.checked }
                        })
                      }
                      className="rounded border-slate-700 text-emerald-500 focus:ring-0"
                    />
                    <span className="text-slate-200 font-bold">Supervisor de Guardia</span>
                  </label>
                </div>
              </div>

              {/* Channels & Delivery Window */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Ventana de Entrega:</label>
                  <select
                    value={editingRule.deliveryWindow}
                    onChange={(e) =>
                      setEditingRule({ ...editingRule, deliveryWindow: e.target.value as any })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                  >
                    <option value="INMEDIATO_24_7">Inmediato 24/7 (Cualquier hora)</option>
                    <option value="HORARIO_HABIL">Solo en Horario Hábil (07:00 - 19:00)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-300 block mb-1">Acuse de Recibo / Confirmación:</label>
                  <select
                    value={editingRule.autoReadBackRequired ? 'YES' : 'NO'}
                    onChange={(e) =>
                      setEditingRule({ ...editingRule, autoReadBackRequired: e.target.value === 'YES' })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                  >
                    <option value="NO">No requerir confirmación</option>
                    <option value="YES">Exigir Acuse de Recibo (Read-back obligatorio)</option>
                  </select>
                </div>
              </div>

              {/* Template Editor */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-300 block">Plantilla del Mensaje de WhatsApp:</label>
                  <span className="text-[10px] text-emerald-400 font-mono">Variables dinámicas: &#123;...&#125;</span>
                </div>

                <input
                  type="text"
                  value={editingRule.template.header}
                  onChange={(e) =>
                    setEditingRule({
                      ...editingRule,
                      template: { ...editingRule.template, header: e.target.value }
                    })
                  }
                  placeholder="Encabezado del mensaje..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-bold"
                />

                <textarea
                  rows={6}
                  value={editingRule.template.body}
                  onChange={(e) =>
                    setEditingRule({
                      ...editingRule,
                      template: { ...editingRule.template, body: e.target.value }
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white font-mono text-[11px] leading-relaxed"
                />

                {/* Variable helper tags */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-slate-400 font-bold">Insertar variable:</span>
                  {DYNAMIC_VARIABLES.map((v) => (
                    <button
                      key={v.key}
                      type="button"
                      onClick={() => {
                        setEditingRule({
                          ...editingRule,
                          template: {
                            ...editingRule.template,
                            body: editingRule.template.body + ' ' + v.key
                          }
                        });
                      }}
                      className="bg-slate-800 hover:bg-slate-700 text-teal-300 text-[10px] px-2 py-0.5 rounded-md font-mono transition cursor-pointer"
                      title={v.description}
                    >
                      {v.key}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 border-t border-slate-800 pt-4">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveRule}
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-black transition shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                Guardar Configuración de Regla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
