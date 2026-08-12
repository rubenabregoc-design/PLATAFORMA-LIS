import React, { useState } from 'react';
import {
  XCircle, AlertTriangle, CheckCircle2, ArrowRight, ArrowLeft,
  Smartphone, MessageSquare, Send, Printer, User, FileText,
  Building2, ShieldAlert, Sparkles, RefreshCw, Check, Clock,
  QrCode, FileCheck, Layers, Droplet, Volume2, ShieldCheck,
  Search, CheckCheck, Lock, ChevronRight, PhoneCall, AlertCircle
} from 'lucide-react';

export interface RejectedSampleItem {
  barcode: string;
  orderNumber: string;
  patientName: string;
  patientPhone: string;
  patientEmail: string;
  testName: string;
  tubeType: string;
  collectionBranch: string;
  phlebotomistName: string;
  collectionTime: string;
}

export interface RejectionReasonOption {
  id: string;
  title: string;
  category: 'HEMOLISIS' | 'VOLUMEN' | 'COAGULO' | 'TUBO' | 'ROTULACION' | 'TEMPERATURA' | 'TIEMPO';
  icon: string;
  technicalDescription: string;
  patientFriendlyExplanation: string;
  recommendedAction: string;
}

export const REJECTION_REASONS: RejectionReasonOption[] = [
  {
    id: 'reason-hemolysis',
    title: 'Hemólisis Severa (Índice HIL 3+ / > 300 mg/dL)',
    category: 'HEMOLISIS',
    icon: '🩸',
    technicalDescription: 'Ruptura de eritrocitos con liberación de hemoglobina al plasma. Interfiere por espectrofotometría y altera Electrolitos (K+ falsamente elevado) y Enzimas.',
    patientFriendlyExplanation: 'Durante la revisión de calidad en el laboratorio, detectamos que los glóbulos rojos de la muestra se rompieron levemente al ser recolectados (hemólisis). Para garantizar un resultado 100% exacto y seguro en sus exámenes, es indispensable tomar una nueva muestra.',
    recommendedAction: 'Solicitar re-toma inmediata con aguja de calibre 21G en brazo contralateral sin torniquete prolongado.'
  },
  {
    id: 'reason-volume',
    title: 'Volumen Insuficiente / Muestra Escasa (Micro-tubo)',
    category: 'VOLUMEN',
    icon: '🧪',
    technicalDescription: 'Volumen menor al menisco mínimo requerido (< 1.5 mL). Altera la proporción muestra/anticoagulante EDTA o Citrato diluyendo erróneamente los analitos.',
    patientFriendlyExplanation: 'La cantidad de muestra obtenida en el tubo fue menor al mínimo requerido por los analizadores automatizados para completar todos los ensayos solicitados. Requerimos una pequeña muestra adicional para completar sus análisis.',
    recommendedAction: 'Re-muestreo prioritario en recepción con tubo de llenado estándar.'
  },
  {
    id: 'reason-clot',
    title: 'Muestra Coagulada / Presencia de Micro-coágulos de Fibrina',
    category: 'COAGULO',
    icon: '🧫',
    technicalDescription: 'Homogeneización insuficiente con anticoagulante. Presencia de fibrina que obstruye las sondas de aspiración del analizador hematológico/coagulación.',
    patientFriendlyExplanation: 'Se detectó la formación de un pequeño micro-coágulo dentro del tubo debido a la rápida reacción natural de la sangre antes de mezclarse con el conservante. Para evitar obstrucción en los equipos y dar un conteo exacto, necesitamos tomar una nueva muestra.',
    recommendedAction: 'Re-toma con agitación por inversión suave de 8 a 10 veces de forma inmediata.'
  },
  {
    id: 'reason-tube',
    title: 'Tubo Incorrecto / Anticoagulante Inadecuado',
    category: 'TUBO',
    icon: '❌',
    technicalDescription: 'Muestra recolectada en tubo EDTA para Química Clínica o Citrato en lugar de Heparina. Quelación de Calcio/Magnesio invalida el perfil.',
    patientFriendlyExplanation: 'La muestra fue recibida en un contenedor distinto al requerido para el tipo de examen especializado ordenado por su médico. Para corregirlo, tomaremos una muestra en el tubo adecuado libre de costo.',
    recommendedAction: 'Verificar catálogo de tubos LIS e indicar tubo con tapón correcto en orden de re-muestreo.'
  },
  {
    id: 'reason-labeling',
    title: 'Error de Rotulación / Datos Discrepantes',
    category: 'ROTULACION',
    icon: '🏷️',
    technicalDescription: 'Código de barras ilegible o discrepancia en el segundo apellido del paciente respecto a la solicitud médica.',
    patientFriendlyExplanation: 'Por protocolo estricto de seguridad del paciente e identificación unívoca ISO 15189, detectamos una discrepancia en el etiquetado del tubo y requerimos validar su identidad con una nueva toma.',
    recommendedAction: 'Impresión de nuevo juego de etiquetas 2D DataMatrix verificadas con documento de identidad.'
  },
  {
    id: 'reason-temp',
    title: 'Cadena de Frío Interrumpida / Temperatura Inadecuada',
    category: 'TEMPERATURA',
    icon: '❄️',
    technicalDescription: 'Temperatura de transporte fuera del rango especificado (> 25°C para muestra refrigerada de Gases o Hormonas sensibles).',
    patientFriendlyExplanation: 'Durante la conservación de la muestra en transporte, la temperatura sufrió una variación que podría alterar la estabilidad de sus hormonas/exámenes. Para proteger su salud, tomaremos una muestra de reemplazo.',
    recommendedAction: 'Re-muestreo con transporte en contenedor térmico auditado con sensor de temperatura digital.'
  }
];

export const PRESET_SAMPLE_DATABASE: RejectedSampleItem[] = [
  {
    barcode: 'BAR-CARD-01',
    orderNumber: 'ORD-2026-9001',
    patientName: 'Gonzalo A. Ríos',
    patientPhone: '+507 6612-9011',
    patientEmail: 'g.rios@gmail.com',
    testName: 'Troponina I Ultrasensible + CK-MB Masa STAT',
    tubeType: 'Tubo Heparina de Litio (Tapón Verde)',
    collectionBranch: 'Sede Costa del Este (Box 2)',
    phlebotomistName: 'Lic. Camilo Soto (Toma Muestras)',
    collectionTime: '2026-08-12 08:30 AM'
  },
  {
    barcode: 'BAR-COAG-03',
    orderNumber: 'ORD-2026-9003',
    patientName: 'Esteban M. Castillo',
    patientPhone: '+507 6511-2233',
    patientEmail: 'ecastillo@hotmail.com',
    testName: 'Tiempo de Tromboplastina (TTPa) + TP Quirúrgico',
    tubeType: 'Tubo Citrato de Sodio 3.2% (Tapón Azul)',
    collectionBranch: 'Sede Vía España Central',
    phlebotomistName: 'T.M. Andrea Morales',
    collectionTime: '2026-08-12 08:45 AM'
  },
  {
    barcode: 'BAR-HEM-04',
    orderNumber: 'ORD-2026-9004',
    patientName: 'Lucía R. Vega',
    patientPhone: '+507 6789-4455',
    patientEmail: 'lucia.vega@yahoo.com',
    testName: 'Hemograma Completo + Conteo de Plaquetas STAT',
    tubeType: 'Tubo EDTA K2 (Tapón Morado Pediátrico)',
    collectionBranch: 'Sede Transístmica',
    phlebotomistName: 'Lic. Jorge Pineda',
    collectionTime: '2026-08-12 09:00 AM'
  },
  {
    barcode: 'BAR-BIO-05',
    orderNumber: 'ORD-2026-9005',
    patientName: 'Héctor J. Paredes',
    patientPhone: '+507 6223-8899',
    patientEmail: 'hparedes@empresa.com',
    testName: 'Perfil Hepático Completo & Electrolitos',
    tubeType: 'Tubo Gel Separador / Suero (Tapón Amarillo)',
    collectionBranch: 'Sede David (Chiriquí)',
    phlebotomistName: 'Dra. María Elena D.',
    collectionTime: '2026-08-12 09:10 AM'
  }
];

export interface RejectedSampleWizardProps {
  embeddedMode?: boolean;
  initialBarcode?: string;
  onComplete?: (rejectionData: any) => void;
  onClose?: () => void;
}

export const RejectedSampleWizard: React.FC<RejectedSampleWizardProps> = ({
  embeddedMode = true,
  initialBarcode = 'BAR-CARD-01',
  onComplete,
  onClose
}) => {
  // Wizard Step State (1: Sample Selection, 2: Reason Classification, 3: Notification Preview, 4: Confirmation)
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Selected Sample State
  const [selectedBarcode, setSelectedBarcode] = useState<string>(initialBarcode);
  const [sampleDatabase, setSampleDatabase] = useState<RejectedSampleItem[]>(PRESET_SAMPLE_DATABASE);
  const [customSearchBarcode, setCustomSearchBarcode] = useState<string>('');

  // Rejection Details State
  const [selectedReasonId, setSelectedReasonId] = useState<string>('reason-hemolysis');
  const [rejectionSeverity, setRejectionSeverity] = useState<'CRITICA' | 'ALTA' | 'MODERADA'>('CRITICA');
  const [technicalObservations, setTechnicalObservations] = useState<string>(
    'Verificado en espectrofotómetro pre-analítico: Índice de Hemólisis HIL 3+ (380 mg/dL). Ruptura eritrocitaria severa. Imposibilita cuantificación exacta de enzima cardiaca.'
  );

  // Notification customization
  const [includeHomePhlebotomyLink, setIncludeHomePhlebotomyLink] = useState<boolean>(true);
  const [waMessageEditable, setWaMessageEditable] = useState<string>('');

  // Dispatch & Confirmation State
  const [isDispatching, setIsDispatching] = useState<boolean>(false);
  const [isDispatchedSuccess, setIsDispatchedSuccess] = useState<boolean>(false);
  const [reSamplingOrderCode, setReSamplingOrderCode] = useState<string>('');
  const [waDeliveryStatus, setWaDeliveryStatus] = useState<'PENDING' | 'SENT' | 'DELIVERED' | 'READ'>('PENDING');

  const currentSample = sampleDatabase.find(s => s.barcode === selectedBarcode) || sampleDatabase[0];
  const currentReason = REJECTION_REASONS.find(r => r.id === selectedReasonId) || REJECTION_REASONS[0];

  // Auto-generate WhatsApp message template when entering Step 3
  const updateWhatsAppTemplate = (reasonObj = currentReason, sampleObj = currentSample) => {
    const msg = `🏥 *LABORATORIO CLÍNICO LIS CORE*
_Notificación de Calidad y Servicio al Paciente (ISO 15189)_

Estimado/a *${sampleObj.patientName}*:

Queremos informarle que, durante la verificación de calidad estricta realizada en nuestro laboratorio para su orden *${sampleObj.orderNumber}* (${sampleObj.testName}):

⚠️ *Motivo Técnico de Re-muestreo:*
${reasonObj.patientFriendlyExplanation}

✨ *¿Qué debemos hacer a continuación?*
Para su total tranquilidad y seguridad médica, requerimos tomar una *nueva muestra de reemplazo (100% gratuita y prioritaria)*.

📍 *Opciones disponibles:*
1. Presentarse en cualquiera de nuestras sedes con atención preferencial sin hacer fila (Caja STAT Re-muestreo).
2. Solicitar atención a domicilio gratuita respondiendo a este mensaje o en el siguiente enlace:
🔗 https://lis.app/re-muestreo/${sampleObj.barcode}?token=STAT-2026

🎫 *Su Código QR de Atención Prioritaria:* RE-MUESTREO-${sampleObj.orderNumber}

Agradecemos su comprensión. Nuestro compromiso es entregarle resultados con el más alto rigor científico.

_Laboratorio Clínico Central • Tel: +507 800-5472_`;

    setWaMessageEditable(msg);
  };

  const handleNextToStep2 = () => {
    setCurrentStep(2);
  };

  const handleNextToStep3 = () => {
    updateWhatsAppTemplate(currentReason, currentSample);
    setCurrentStep(3);
  };

  const handleNextToStep4 = () => {
    setCurrentStep(4);
  };

  const handleFinalSubmitAndDispatch = () => {
    setIsDispatching(true);

    setTimeout(() => {
      setIsDispatching(false);
      setIsDispatchedSuccess(true);
      const newOrderCode = `ORD-RE-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      setReSamplingOrderCode(newOrderCode);
      setWaDeliveryStatus('SENT');

      // Simulate delivery after 2 seconds
      setTimeout(() => {
        setWaDeliveryStatus('DELIVERED');
      }, 2000);

      // Simulate read after 4 seconds
      setTimeout(() => {
        setWaDeliveryStatus('READ');
      }, 4000);

      if (onComplete) {
        onComplete({
          sampleBarcode: selectedBarcode,
          reSamplingOrderCode: newOrderCode,
          reason: currentReason,
          technologist: 'Lic. Valentina Soto (TM-4091)',
          patientPhone: currentSample.patientPhone,
          dispatchedAt: new Date().toISOString()
        });
      }
    }, 1500);
  };

  const resetWizard = () => {
    setCurrentStep(1);
    setIsDispatchedSuccess(false);
    setWaDeliveryStatus('PENDING');
  };

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-8 shadow-2xl animate-fadeIn">
      {/* HEADER BAR WITH TITLE & CLOSE BUTTON */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center space-x-3">
          <span className="p-3 bg-rose-500/20 text-rose-400 border border-rose-500/40 rounded-2xl shrink-0">
            <XCircle className="w-6 h-6" />
          </span>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-black text-white">Asistente de Gestión de Muestras Rechazadas</h2>
              <span className="bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full flex items-center space-x-1">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                <span>Protocolo Pre-Analítico ISO 15189</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Clasificación técnica del rechazo y notificación automática en tiempo real a Recepción Central y al Paciente vía WhatsApp.
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer self-start sm:self-center"
          >
            <XCircle className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* WIZARD STEPPER PROGRESS BAR */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {[
          { step: 1, label: '1. Seleccionar Muestra', icon: Search },
          { step: 2, label: '2. Causa del Rechazo', icon: AlertTriangle },
          { step: 3, label: '3. Notificaciones LIS & WhatsApp', icon: Smartphone },
          { step: 4, label: '4. Orden & Firma Digital', icon: FileCheck }
        ].map((s) => {
          const Icon = s.icon;
          const isActive = currentStep === s.step;
          const isDone = currentStep > s.step;

          return (
            <div
              key={s.step}
              className={`p-3 rounded-2xl border text-xs font-bold transition flex items-center space-x-2 ${
                isActive
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500 shadow-lg shadow-rose-500/20'
                  : isDone
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/40'
                  : 'bg-slate-950 text-slate-500 border-slate-800'
              }`}
            >
              <div className={`w-6 h-6 rounded-xl flex items-center justify-center font-mono text-[11px] font-black shrink-0 ${
                isActive
                  ? 'bg-rose-500 text-slate-950'
                  : isDone
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-slate-800 text-slate-400'
              }`}>
                {isDone ? <Check className="w-3.5 h-3.5" /> : s.step}
              </div>
              <span className="truncate">{s.label}</span>
            </div>
          );
        })}
      </div>

      {/* STEP 1: SAMPLE SELECTION & PRESETS */}
      {currentStep === 1 && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-black text-white flex items-center space-x-2">
                  <Search className="w-4 h-4 text-rose-400" />
                  <span>Paso 1: Identificación y Selección de Muestra en Mesón</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Escanee el código de barras del tubo o seleccione una muestra preseteada de la lista de trabajo activa.
                </p>
              </div>

              {/* SEARCH BARCODE INPUT */}
              <div className="flex items-center space-x-2 w-full sm:w-72">
                <input
                  type="text"
                  value={customSearchBarcode}
                  onChange={(e) => setCustomSearchBarcode(e.target.value)}
                  placeholder="Escanear o ingresar # de tubo..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            {/* PRESET SAMPLES GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {sampleDatabase.map((sample) => {
                const isSelected = selectedBarcode === sample.barcode;

                return (
                  <div
                    key={sample.barcode}
                    onClick={() => setSelectedBarcode(sample.barcode)}
                    className={`p-4 rounded-2xl border transition cursor-pointer flex flex-col justify-between space-y-3 ${
                      isSelected
                        ? 'bg-rose-950/40 border-rose-500 shadow-xl ring-1 ring-rose-500'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30 text-xs">
                            #{sample.barcode}
                          </span>
                          <span className="font-mono text-xs text-slate-400">{sample.orderNumber}</span>
                        </div>
                        <h4 className="text-sm font-black text-white mt-1">{sample.patientName}</h4>
                        <p className="text-xs text-slate-300 font-bold mt-0.5">{sample.testName}</p>
                      </div>

                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        isSelected ? 'border-rose-400 bg-rose-500 text-slate-950' : 'border-slate-700'
                      }`}>
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </div>

                    <div className="text-[11px] font-mono text-slate-400 space-y-0.5 bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
                      <div>🧪 {sample.tubeType}</div>
                      <div>📍 {sample.collectionBranch} • {sample.collectionTime}</div>
                      <div>📱 WhatsApp: <strong className="text-emerald-400">{sample.patientPhone}</strong></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ACTIVE SELECTED SAMPLE DETAIL SUMMARY */}
          {currentSample && (
            <div className="bg-gradient-to-r from-rose-950/50 via-slate-900 to-slate-900 border border-rose-500/40 p-5 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-mono font-bold text-rose-400 uppercase tracking-wider block">
                  Muestra Seleccionada para Inicio de Protocolo de Rechazo:
                </span>
                <div className="text-base font-black text-white">
                  #{currentSample.barcode} • {currentSample.patientName}
                </div>
                <p className="text-xs text-slate-300">
                  {currentSample.testName} ({currentSample.tubeType})
                </p>
              </div>

              <button
                onClick={handleNextToStep2}
                className="w-full sm:w-auto px-6 py-3 bg-rose-500 hover:bg-rose-400 text-slate-950 font-black rounded-2xl text-xs transition shadow-lg shadow-rose-500/20 flex items-center justify-center space-x-2 cursor-pointer shrink-0"
              >
                <span>Continuar a Causa Técnica</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* STEP 2: TECHNICAL REJECTION CAUSE CLASSIFICATION */}
      {currentStep === 2 && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 space-y-5">
            <div>
              <h3 className="text-sm font-black text-white flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Paso 2: Clasificación de la Causa Técnica del Rechazo (ISO 15189 §7.3.4)</span>
              </h3>
              <p className="text-xs text-slate-400">
                Seleccione la causa primaria fundada. Esta justificación quedará registrada en la auditoría inalterable del LIS.
              </p>
            </div>

            {/* REJECTION REASONS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {REJECTION_REASONS.map((reason) => {
                const isSelected = selectedReasonId === reason.id;

                return (
                  <div
                    key={reason.id}
                    onClick={() => {
                      setSelectedReasonId(reason.id);
                      setTechnicalObservations(reason.technicalDescription);
                    }}
                    className={`p-4 rounded-2xl border transition cursor-pointer flex flex-col justify-between space-y-2 ${
                      isSelected
                        ? 'bg-rose-950/50 border-rose-500 ring-1 ring-rose-500 shadow-xl'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <span className="text-2xl">{reason.icon}</span>
                      {isSelected && (
                        <span className="bg-rose-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full">
                          SELECCIONADA
                        </span>
                      )}
                    </div>

                    <div>
                      <h4 className="text-xs font-black text-white">{reason.title}</h4>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                        {reason.technicalDescription}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 text-[10px] text-amber-400 font-mono">
                      Acción: {reason.recommendedAction}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* SEVERITY LEVEL & OBSERVATIONS FORM */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-3 border-t border-slate-800">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 block">Nivel de Incidencia Pre-analítica:</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['CRITICA', 'ALTA', 'MODERADA'] as const).map((sev) => (
                    <button
                      key={sev}
                      type="button"
                      onClick={() => setRejectionSeverity(sev)}
                      className={`py-2 rounded-xl text-xs font-bold transition border ${
                        rejectionSeverity === sev
                          ? 'bg-rose-500 text-slate-950 border-rose-400 font-black'
                          : 'bg-slate-900 text-slate-400 border-slate-800'
                      }`}
                    >
                      {sev}
                    </button>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-2 space-y-2">
                <label className="text-xs font-bold text-slate-300 block">Observaciones Técnicas del Tecnólogo Médico:</label>
                <textarea
                  rows={3}
                  value={technicalObservations}
                  onChange={(e) => setTechnicalObservations(e.target.value)}
                  placeholder="Ingrese detalles espectrofotométricos o visuales del tubo..."
                  className="w-full bg-slate-900 border border-slate-700 text-white text-xs p-3 rounded-2xl focus:outline-none focus:border-rose-500 font-mono"
                ></textarea>
              </div>
            </div>
          </div>

          {/* NAVIGATION BUTTONS */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setCurrentStep(1)}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-2xl text-xs transition flex items-center space-x-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver a Muestra</span>
            </button>

            <button
              onClick={handleNextToStep3}
              className="px-6 py-3 bg-rose-500 hover:bg-rose-400 text-slate-950 font-black rounded-2xl text-xs transition shadow-lg shadow-rose-500/20 flex items-center space-x-2 cursor-pointer"
            >
              <span>Generar Notificaciones LIS & WhatsApp</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: AUTOMATED MULTICHANNEL NOTIFICATIONS PREVIEW */}
      {currentStep === 3 && (
        <div className="space-y-6 animate-fadeIn">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* RECEPTION INTERNAL NOTIFICATION TICKET */}
            <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 space-y-4">
              <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
                <span className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl">
                  <Building2 className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-sm font-black text-white">1. Notificación Interna A Recepción Central</h3>
                  <p className="text-[11px] text-slate-400">Ticket LIS emitido automáticamente al módulo de Toma de Muestras</p>
                </div>
              </div>

              <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-3 font-mono text-xs">
                <div className="flex justify-between text-amber-400 font-bold">
                  <span>🚨 ORDEN DE RE-MUESTREO STAT</span>
                  <span className="bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30">PRIORITARIO</span>
                </div>

                <div className="space-y-1 text-slate-300 border-b border-slate-800 pb-2">
                  <div>Tubo Original: <strong className="text-white">#{currentSample.barcode}</strong></div>
                  <div>Paciente: <strong className="text-white">{currentSample.patientName}</strong></div>
                  <div>Examen: <strong className="text-white">{currentSample.testName}</strong></div>
                  <div>Sede Origen: <strong className="text-white">{currentSample.collectionBranch}</strong></div>
                </div>

                <div className="space-y-1 text-rose-300">
                  <div className="font-bold text-slate-400">Motivo del Rechazo:</div>
                  <div>• {currentReason.title}</div>
                  <div>• {technicalObservations}</div>
                </div>

                <div className="pt-2 border-t border-slate-800 text-[11px] text-emerald-400">
                  ✓ Asignación automática: <strong>Caja 01 STAT / Domicilio Gratuito</strong>
                </div>
              </div>
            </div>

            {/* WHATSAPP PATIENT MESSAGE LIVE PREVIEW */}
            <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 space-y-4">
              <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
                <span className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
                  <MessageSquare className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-sm font-black text-white">2. Vista Previa Mensaje WhatsApp Paciente</h3>
                  <p className="text-[11px] text-slate-400">Mensaje adaptado al lenguaje del paciente (Explicativo & Amigable)</p>
                </div>
              </div>

              {/* WHATSAPP MOCK CHAT BUBBLE */}
              <div className="bg-[#0b141a] p-4 rounded-2xl border border-emerald-900/50 space-y-3">
                <div className="flex items-center justify-between text-[11px] font-mono text-emerald-400">
                  <span>📱 Destinatario: {currentSample.patientPhone}</span>
                  <span className="bg-emerald-500/20 text-emerald-300 text-[9px] px-2 py-0.5 rounded">Plantilla ISO 15189</span>
                </div>

                <textarea
                  rows={9}
                  value={waMessageEditable}
                  onChange={(e) => setWaMessageEditable(e.target.value)}
                  className="w-full bg-[#111b21] border border-[#202c33] text-slate-100 text-xs p-3 rounded-xl focus:outline-none focus:border-emerald-500 font-sans leading-relaxed"
                ></textarea>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="linkCheck"
                    checked={includeHomePhlebotomyLink}
                    onChange={(e) => setIncludeHomePhlebotomyLink(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                  />
                  <label htmlFor="linkCheck" className="text-[11px] text-slate-300 cursor-pointer">
                    Incluir enlace directo para agendar Toma a Domicilio Gratuita
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* NAVIGATION BUTTONS */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setCurrentStep(2)}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-2xl text-xs transition flex items-center space-x-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver a Causa Técnica</span>
            </button>

            <button
              onClick={handleNextToStep4}
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-2xl text-xs transition shadow-lg shadow-emerald-500/20 flex items-center space-x-2 cursor-pointer"
            >
              <span>Aprobar & Ir a Firma Digital</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: CONFIRMATION, DIGITAL SIGNATURE & AUDIT DISPATCH */}
      {currentStep === 4 && (
        <div className="space-y-6 animate-fadeIn">
          {!isDispatchedSuccess ? (
            <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 space-y-6">
              <div>
                <h3 className="text-sm font-black text-white flex items-center space-x-2">
                  <FileCheck className="w-4 h-4 text-emerald-400" />
                  <span>Paso 4: Confirmación Final y Firma Digital del Tecnólogo Médico</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Firme digitalmente para autorizar la orden de re-muestreo y disparar las notificaciones automáticas.
                </p>
              </div>

              {/* REJECTION SUMMARY CARD */}
              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                <div className="space-y-1">
                  <div className="text-slate-400">Muestra Rechazada: <strong className="text-amber-400">#{currentSample.barcode}</strong></div>
                  <div className="text-slate-400">Paciente: <strong className="text-white">{currentSample.patientName}</strong></div>
                  <div className="text-slate-400">Teléfono WhatsApp: <strong className="text-emerald-400">{currentSample.patientPhone}</strong></div>
                </div>

                <div className="space-y-1">
                  <div className="text-slate-400">Causa Técnica: <strong className="text-rose-400">{currentReason.title}</strong></div>
                  <div className="text-slate-400">Tecnólogo Médico: <strong className="text-white">Lic. Valentina Soto (TM-4091)</strong></div>
                  <div className="text-slate-400">Auditoría ISO 15189: <strong className="text-emerald-400">SHA-256 Hash Automático</strong></div>
                </div>
              </div>

              {/* DIGITAL SIGNATURE MOCK BOX */}
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-300">Firma Digital del Tecnólogo Responsable:</span>
                  <span className="text-[10px] font-mono text-emerald-400">TM-4091 Verificado</span>
                </div>
                <div className="h-16 bg-slate-950 border border-dashed border-slate-700 rounded-xl flex items-center justify-center font-mono text-xs text-slate-500">
                  ✍️ Lic. Valentina Soto • SHA256: 8f93a1a3e3518e9060b86a07...
                </div>
              </div>

              {/* DISPATCH ACTION BUTTON */}
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => setCurrentStep(3)}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-2xl text-xs transition flex items-center space-x-2 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Volver a Notificaciones</span>
                </button>

                <button
                  onClick={handleFinalSubmitAndDispatch}
                  disabled={isDispatching}
                  className="px-8 py-3.5 bg-gradient-to-r from-rose-500 via-rose-600 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-slate-950 font-black rounded-2xl text-xs transition shadow-xl shadow-rose-500/20 flex items-center space-x-2 cursor-pointer disabled:opacity-50"
                >
                  {isDispatching ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Emitiendo Orden & Enviando WhatsApp...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Emitir Re-Muestreo & Despachar WhatsApp</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* SUCCESS DISPLAY */
            <div className="bg-slate-950 p-8 rounded-3xl border border-emerald-500/40 text-center space-y-6 animate-fadeIn">
              <div className="w-16 h-16 bg-emerald-500/20 border-2 border-emerald-400 rounded-full flex items-center justify-center mx-auto text-emerald-400">
                <CheckCircle2 className="w-10 h-10 animate-bounce" />
              </div>

              <div className="space-y-2">
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-mono font-bold px-3 py-1 rounded-full">
                  PROCESO COMPLETADO EXITOSAMENTE
                </span>
                <h3 className="text-xl font-black text-white">
                  Muestra #{currentSample.barcode} Registrada como Rechazada
                </h3>
                <p className="text-xs text-slate-300 max-w-lg mx-auto">
                  Se ha generado la Orden de Re-muestreo STAT <strong className="text-amber-400">{reSamplingOrderCode}</strong> y notificado en tiempo real a Recepción Central.
                </p>
              </div>

              {/* WHATSAPP DELIVERY STATUS TICKER */}
              <div className="max-w-md mx-auto bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Estado Notificación WhatsApp:</span>
                  <span className={`font-bold flex items-center space-x-1 ${
                    waDeliveryStatus === 'READ' ? 'text-cyan-400' : waDeliveryStatus === 'DELIVERED' ? 'text-emerald-400' : 'text-amber-400'
                  }`}>
                    <CheckCheck className="w-4 h-4" />
                    <span>{waDeliveryStatus === 'READ' ? 'LEÍDO POR PACIENTE' : waDeliveryStatus === 'DELIVERED' ? 'ENTREGADO' : 'ENVIADO'}</span>
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 text-left">
                  📱 Enviado a: <strong className="text-white">{currentSample.patientPhone}</strong> ({currentSample.patientName})
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={resetWizard}
                  className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl text-xs transition cursor-pointer"
                >
                  Registrar Otro Rechazo
                </button>

                {onClose && (
                  <button
                    onClick={onClose}
                    className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-2xl text-xs transition cursor-pointer"
                  >
                    Finalizar y Volver al Workbench
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
