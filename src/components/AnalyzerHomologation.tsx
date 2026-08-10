import React, { useState } from 'react';
import { Analyzer, AnalyzerTestMapping, ReferenceRange, TestCatalogItem, Role, User } from '../types';
import {
  SlidersHorizontal, Cpu, ShieldCheck, Plus, Search, CheckCircle2,
  XCircle, Edit3, Trash2, ArrowRightLeft, Sparkles, Download, Upload,
  RefreshCw, BookOpen, AlertCircle, FileCode, Check, Layers, Zap, Info,
  AlertTriangle, ArrowUpRight, ArrowDownRight, Activity, Filter, UserCheck
} from 'lucide-react';

interface AnalyzerHomologationProps {
  currentUser: User;
  currentRole: Role;
  analyzers: Analyzer[];
  testCatalog: TestCatalogItem[];
  mappings: AnalyzerTestMapping[];
  onAddMapping: (mapping: AnalyzerTestMapping) => void;
  onUpdateMapping: (mapping: AnalyzerTestMapping) => void;
  onDeleteMapping: (id: string) => void;
  onResetDefaultMappings?: () => void;
}

export const AnalyzerHomologation: React.FC<AnalyzerHomologationProps> = ({
  currentUser,
  currentRole,
  analyzers,
  testCatalog,
  mappings,
  onAddMapping,
  onUpdateMapping,
  onDeleteMapping,
  onResetDefaultMappings
}) => {
  // Check if role is admin
  const isAdmin = currentRole === 'abregotech_admin';

  // Selected Analyzer State
  const [selectedAnalyzerId, setSelectedAnalyzerId] = useState<string>(
    analyzers[0]?.id || 'an-vitros-01'
  );

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterActiveOnly, setFilterActiveOnly] = useState<boolean>(false);

  // Main Mapping Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingMapping, setEditingMapping] = useState<AnalyzerTestMapping | null>(null);

  // Range Manager Sub-Modal State
  const [rangeManagerMapping, setRangeManagerMapping] = useState<AnalyzerTestMapping | null>(null);
  const [isRangeModalOpen, setIsRangeModalOpen] = useState<boolean>(false);

  // Form inputs for Main Mapping
  const [formData, setFormData] = useState({
    lisTestCode: 'GLU',
    lisTestName: 'Glucosa Basal',
    astmAnalyzerCode: '',
    sampleType: 'Suero',
    multiplierFactor: 1.0,
    unit: 'mg/dL',
    isActive: true,
    notes: ''
  });

  // Form inputs for Reference Range Rule
  const [rangeForm, setRangeForm] = useState<Omit<ReferenceRange, 'id'>>({
    gender: 'Ambos',
    minAgeYears: 0,
    maxAgeYears: 120,
    minValue: 70,
    maxValue: 99,
    panicLowValue: 50,
    panicHighValue: 400,
    unit: 'mg/dL',
    interpretation: 'Población General Adulta'
  });

  // Translation & Range Simulator State
  const [testAstmCode, setTestAstmCode] = useState<string>('Glu-Hexo-123');
  const [testRawValue, setTestRawValue] = useState<string>('125.0');
  const [patientGender, setPatientGender] = useState<'Masculino' | 'Femenino'>('Masculino');
  const [patientAge, setPatientAge] = useState<number>(35);
  const [simulationResult, setSimulationResult] = useState<any | null>(null);

  const selectedAnalyzer = analyzers.find((a) => a.id === selectedAnalyzerId) || analyzers[0];

  // Mappings for current analyzer
  const currentAnalyzerMappings = mappings.filter(
    (m) => m.analyzerId === selectedAnalyzerId
  );

  // Filtered by search term
  const filteredMappings = currentAnalyzerMappings.filter((m) => {
    const matchesSearch =
      m.lisTestCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.lisTestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.astmAnalyzerCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.notes && m.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesActive = !filterActiveOnly || m.isActive;
    return matchesSearch && matchesActive;
  });

  // Open modal for new mapping
  const handleOpenAddModal = () => {
    setEditingMapping(null);
    setFormData({
      lisTestCode: testCatalog[0]?.parameters[0]?.astmParamCode || 'GLU',
      lisTestName: testCatalog[0]?.name || 'Glucosa Basal',
      astmAnalyzerCode: '',
      sampleType: 'Suero',
      multiplierFactor: 1.0,
      unit: 'mg/dL',
      isActive: true,
      notes: ''
    });
    setIsModalOpen(true);
  };

  // Open modal for editing
  const handleOpenEditModal = (mapping: AnalyzerTestMapping) => {
    setEditingMapping(mapping);
    setFormData({
      lisTestCode: mapping.lisTestCode,
      lisTestName: mapping.lisTestName,
      astmAnalyzerCode: mapping.astmAnalyzerCode,
      sampleType: mapping.sampleType,
      multiplierFactor: mapping.multiplierFactor,
      unit: mapping.unit,
      isActive: mapping.isActive,
      notes: mapping.notes || ''
    });
    setIsModalOpen(true);
  };

  // Open Range Manager Modal
  const handleOpenRangeManager = (mapping: AnalyzerTestMapping) => {
    setRangeManagerMapping(mapping);
    setRangeForm({
      gender: 'Ambos',
      minAgeYears: 0,
      maxAgeYears: 120,
      minValue: 70,
      maxValue: 99,
      panicLowValue: 50,
      panicHighValue: 400,
      unit: mapping.unit || 'mg/dL',
      interpretation: 'Adulto General'
    });
    setIsRangeModalOpen(true);
  };

  // Handle LIS Test Selection in Form
  const handleLisTestChange = (code: string) => {
    let foundName = code;
    let foundUnit = 'mg/dL';

    testCatalog.forEach((t) => {
      t.parameters.forEach((p) => {
        if (p.astmParamCode === code) {
          foundName = p.name;
          foundUnit = p.unit;
        }
      });
    });

    setFormData((prev) => ({
      ...prev,
      lisTestCode: code,
      lisTestName: foundName,
      unit: foundUnit
    }));
  };

  // Save Mapping
  const handleSaveMapping = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.astmAnalyzerCode.trim()) return;

    if (editingMapping) {
      const updated: AnalyzerTestMapping = {
        ...editingMapping,
        lisTestCode: formData.lisTestCode,
        lisTestName: formData.lisTestName,
        astmAnalyzerCode: formData.astmAnalyzerCode.trim(),
        sampleType: formData.sampleType,
        multiplierFactor: Number(formData.multiplierFactor) || 1.0,
        unit: formData.unit,
        isActive: formData.isActive,
        notes: formData.notes,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser.name
      };
      onUpdateMapping(updated);
    } else {
      const newMapping: AnalyzerTestMapping = {
        id: `map-${Date.now()}`,
        tenantId: selectedAnalyzer.tenantId,
        analyzerId: selectedAnalyzer.id,
        analyzerName: selectedAnalyzer.name,
        lisTestCode: formData.lisTestCode,
        lisTestName: formData.lisTestName,
        astmAnalyzerCode: formData.astmAnalyzerCode.trim(),
        sampleType: formData.sampleType,
        multiplierFactor: Number(formData.multiplierFactor) || 1.0,
        unit: formData.unit,
        referenceRanges: [
          {
            id: `rr-${Date.now()}`,
            gender: 'Ambos',
            minAgeYears: 0,
            maxAgeYears: 120,
            minValue: 70,
            maxValue: 99,
            panicLowValue: 50,
            panicHighValue: 400,
            unit: formData.unit,
            interpretation: 'Rango Predeterminado Adultos'
          }
        ],
        isActive: true,
        notes: formData.notes,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser.name
      };
      onAddMapping(newMapping);
    }

    setIsModalOpen(false);
  };

  // Add Reference Range to Currently Managed Mapping
  const handleAddRangeRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rangeManagerMapping) return;

    const newRule: ReferenceRange = {
      id: `rr-${Date.now()}`,
      gender: rangeForm.gender,
      minAgeYears: Number(rangeForm.minAgeYears) || 0,
      maxAgeYears: Number(rangeForm.maxAgeYears) || 120,
      minValue: Number(rangeForm.minValue),
      maxValue: Number(rangeForm.maxValue),
      panicLowValue: rangeForm.panicLowValue !== undefined ? Number(rangeForm.panicLowValue) : undefined,
      panicHighValue: rangeForm.panicHighValue !== undefined ? Number(rangeForm.panicHighValue) : undefined,
      unit: rangeForm.unit || rangeManagerMapping.unit,
      interpretation: rangeForm.interpretation
    };

    const updatedRanges = [...(rangeManagerMapping.referenceRanges || []), newRule];
    const updatedMapping: AnalyzerTestMapping = {
      ...rangeManagerMapping,
      referenceRanges: updatedRanges,
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser.name
    };

    onUpdateMapping(updatedMapping);
    setRangeManagerMapping(updatedMapping);
  };

  // Remove Reference Range Rule
  const handleRemoveRangeRule = (ruleId: string) => {
    if (!rangeManagerMapping) return;

    const updatedRanges = (rangeManagerMapping.referenceRanges || []).filter((r) => r.id !== ruleId);
    const updatedMapping: AnalyzerTestMapping = {
      ...rangeManagerMapping,
      referenceRanges: updatedRanges,
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser.name
    };

    onUpdateMapping(updatedMapping);
    setRangeManagerMapping(updatedMapping);
  };

  // Load Factory Preset Template for Selected Analyzer
  const handleLoadFactoryTemplate = () => {
    if (!selectedAnalyzer) return;

    const factoryPresets: Record<string, Array<Omit<AnalyzerTestMapping, 'id' | 'tenantId' | 'analyzerId' | 'analyzerName'>>> = {
      'an-vitros-01': [
        {
          lisTestCode: 'GLU', lisTestName: 'Glucosa Basal', astmAnalyzerCode: 'Glu-Hexo-123', sampleType: 'Suero', multiplierFactor: 1.0, unit: 'mg/dL', isActive: true, notes: 'Ortho Vitros 4600 Manual v4.2 - Hexoquinasa', updatedAt: new Date().toISOString(), updatedBy: currentUser.name,
          referenceRanges: [
            { id: 'rr-glu-p', gender: 'Ambos', minAgeYears: 0, maxAgeYears: 12, minValue: 60, maxValue: 100, panicLowValue: 45, panicHighValue: 300, unit: 'mg/dL', interpretation: 'Pediátrico (0-12 a)' },
            { id: 'rr-glu-a', gender: 'Ambos', minAgeYears: 13, maxAgeYears: 120, minValue: 70, maxValue: 99, panicLowValue: 50, panicHighValue: 400, unit: 'mg/dL', interpretation: 'Adultos Ayunas' }
          ]
        },
        {
          lisTestCode: 'CREA', lisTestName: 'Creatinina Sérica', astmAnalyzerCode: 'Crea-Jaffe-456', sampleType: 'Suero', multiplierFactor: 1.0, unit: 'mg/dL', isActive: true, notes: 'Ortho Vitros 4600 Manual - Jaffé Cinético', updatedAt: new Date().toISOString(), updatedBy: currentUser.name,
          referenceRanges: [
            { id: 'rr-crea-m', gender: 'Masculino', minAgeYears: 18, maxAgeYears: 120, minValue: 0.74, maxValue: 1.35, panicLowValue: 0.30, panicHighValue: 5.00, unit: 'mg/dL', interpretation: 'Varones Adultos' },
            { id: 'rr-crea-f', gender: 'Femenino', minAgeYears: 18, maxAgeYears: 120, minValue: 0.59, maxValue: 1.04, panicLowValue: 0.30, panicHighValue: 4.50, unit: 'mg/dL', interpretation: 'Mujeres Adultas' }
          ]
        },
        {
          lisTestCode: 'CHOL', lisTestName: 'Colesterol Total', astmAnalyzerCode: 'Chol-Enz-789', sampleType: 'Suero', multiplierFactor: 1.0, unit: 'mg/dL', isActive: true, notes: 'Ortho Vitros CHOD-PAP Enzymatic', updatedAt: new Date().toISOString(), updatedBy: currentUser.name,
          referenceRanges: [
            { id: 'rr-chol-1', gender: 'Ambos', minAgeYears: 0, maxAgeYears: 120, minValue: 120, maxValue: 200, panicHighValue: 300, unit: 'mg/dL', interpretation: 'NCEP ATPIII Deseable' }
          ]
        }
      ],
      'an-sysmex-01': [
        {
          lisTestCode: 'WBC', lisTestName: 'Leucocitos (WBC)', astmAnalyzerCode: 'Sys-WBC-001', sampleType: 'Sangre Total EDTA', multiplierFactor: 1.0, unit: 'x10^3/µL', isActive: true, notes: 'Sysmex XN Series ASTM E1394 Sec 4.1', updatedAt: new Date().toISOString(), updatedBy: currentUser.name,
          referenceRanges: [
            { id: 'rr-wbc-1', gender: 'Ambos', minAgeYears: 0, maxAgeYears: 120, minValue: 4.5, maxValue: 11.0, panicLowValue: 2.0, panicHighValue: 30.0, unit: 'x10^3/µL', interpretation: 'Recuento General' }
          ]
        },
        {
          lisTestCode: 'HGB', lisTestName: 'Hemoglobina (HGB)', astmAnalyzerCode: 'Sys-HGB-002', sampleType: 'Sangre Total EDTA', multiplierFactor: 1.0, unit: 'g/dL', isActive: true, notes: 'SLS-Hemoglobina Libre de Cianuro', updatedAt: new Date().toISOString(), updatedBy: currentUser.name,
          referenceRanges: [
            { id: 'rr-hgb-m', gender: 'Masculino', minAgeYears: 18, maxAgeYears: 120, minValue: 13.8, maxValue: 17.2, panicLowValue: 7.0, panicHighValue: 20.0, unit: 'g/dL', interpretation: 'Masculino Adulto' },
            { id: 'rr-hgb-f', gender: 'Femenino', minAgeYears: 18, maxAgeYears: 120, minValue: 12.1, maxValue: 15.1, panicLowValue: 7.0, panicHighValue: 19.0, unit: 'g/dL', interpretation: 'Femenino Adulto' }
          ]
        }
      ]
    };

    const presets = factoryPresets[selectedAnalyzer.id] || factoryPresets['an-vitros-01'];

    presets.forEach((p) => {
      const exists = currentAnalyzerMappings.some((m) => m.astmAnalyzerCode === p.astmAnalyzerCode);
      if (!exists) {
        onAddMapping({
          ...p,
          id: `map-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          tenantId: selectedAnalyzer.tenantId,
          analyzerId: selectedAnalyzer.id,
          analyzerName: selectedAnalyzer.name
        });
      }
    });
  };

  // Run Translation & Automatic Range Classification Simulation
  const handleSimulateTranslation = () => {
    if (!testAstmCode.trim()) return;

    // 1. Search mapping
    const match = currentAnalyzerMappings.find(
      (m) => m.astmAnalyzerCode.toLowerCase() === testAstmCode.trim().toLowerCase()
    );

    const valNum = parseFloat(testRawValue) || 0;

    if (!match) {
      setSimulationResult({
        success: false,
        message: `⚠️ Código de trama no registrado: '${testAstmCode}' no tiene homologación activa para ${selectedAnalyzer.name}. El middleware generará alerta de error.`
      });
      return;
    }

    // 2. Multiplier factor calculation
    const convertedVal = parseFloat((valNum * match.multiplierFactor).toFixed(2));

    // 3. Match Reference Range Rule by Gender & Age
    const ranges = match.referenceRanges || [];
    const matchedRule = ranges.find((r) => {
      const genderMatch = r.gender === 'Ambos' || r.gender === patientGender;
      const minAge = r.minAgeYears !== undefined ? r.minAgeYears : 0;
      const maxAge = r.maxAgeYears !== undefined ? r.maxAgeYears : 120;
      const ageMatch = patientAge >= minAge && patientAge <= maxAge;
      return genderMatch && ageMatch;
    }) || ranges[0]; // fallback to first range if no exact demographic match

    // 4. Automatic Classification logic
    let flagStatus: 'NORMAL' | 'ALTO' | 'BAJO' | 'PANICO_ALTO' | 'PANICO_BAJO' = 'NORMAL';
    let astmFlag = 'N';
    let flagColorClass = 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300';
    let statusLabel = 'NORMAL (Normoglicemia / Valor en Rango)';
    let badgeText = 'Normal';

    if (matchedRule) {
      const { minValue, maxValue, panicLowValue, panicHighValue } = matchedRule;

      if (panicHighValue !== undefined && convertedVal >= panicHighValue) {
        flagStatus = 'PANICO_ALTO';
        astmFlag = 'HH';
        flagColorClass = 'bg-rose-600/30 border-rose-500 text-rose-200 animate-pulse font-black';
        statusLabel = '🚨 ¡CRÍTICO ALTO / VALOR DE PÁNICO!';
        badgeText = 'Crítico / Pánico Alto (HH)';
      } else if (panicLowValue !== undefined && convertedVal <= panicLowValue) {
        flagStatus = 'PANICO_BAJO';
        astmFlag = 'LL';
        flagColorClass = 'bg-rose-600/30 border-rose-500 text-rose-200 animate-pulse font-black';
        statusLabel = '🚨 ¡CRÍTICO BAJO / VALOR DE PÁNICO!';
        badgeText = 'Crítico / Pánico Bajo (LL)';
      } else if (convertedVal > maxValue) {
        flagStatus = 'ALTO';
        astmFlag = 'H';
        flagColorClass = 'bg-amber-500/20 border-amber-500/40 text-amber-300 font-bold';
        statusLabel = '⚠️ ALTO (Elevado sobre rango normal)';
        badgeText = 'Alto (H ↑)';
      } else if (convertedVal < minValue) {
        flagStatus = 'BAJO';
        astmFlag = 'L';
        flagColorClass = 'bg-sky-500/20 border-sky-500/40 text-sky-300 font-bold';
        statusLabel = 'ℹ️ BAJO (Por debajo del rango normal)';
        badgeText = 'Bajo (L ↓)';
      }
    }

    setSimulationResult({
      success: true,
      match,
      rawValue: testRawValue,
      convertedValue: convertedVal,
      matchedRule,
      flagStatus,
      astmFlag,
      flagColorClass,
      statusLabel,
      badgeText,
      patientDemographics: `${patientGender}, ${patientAge} años`
    });
  };

  // Export Mappings to JSON
  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(currentAnalyzerMappings, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `Homologacion_${selectedAnalyzer.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 bg-teal-500/20 border border-teal-500/40 text-teal-300 font-bold rounded-full text-[11px] uppercase tracking-wider flex items-center space-x-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                <span>Módulo Exclusivo Súper-Admin LIS</span>
              </span>
              <span className="px-2.5 py-1 bg-slate-800 text-slate-300 font-mono text-[10px] rounded-full">
                ASTM E1394 / HL7 v2.5 / Clasificación Automática
              </span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2">
              <SlidersHorizontal className="w-7 h-7 text-teal-400" />
              <span>Homologación de Analizadores y Rangos de Referencia</span>
            </h2>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              Mapea los códigos de pruebas LIS con las tramas del analizador (<code className="text-amber-300 font-bold font-mono">ASTM/HL7</code>) y define los <strong className="text-teal-300">Límites de Referencia y Valores de Pánico por Sexo y Edad</strong> para la clasificación automática instantánea.
            </p>
          </div>

          {/* Top Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleLoadFactoryTemplate}
              className="px-3.5 py-2 bg-slate-950 hover:bg-slate-800 border border-teal-500/30 text-teal-300 font-bold rounded-xl text-xs transition flex items-center space-x-1.5 cursor-pointer shadow-sm"
            >
              <Zap className="w-4 h-4 text-teal-400" />
              <span>Cargar Plantilla con Rangos</span>
            </button>

            <button
              onClick={handleExportJSON}
              className="px-3.5 py-2 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-300 font-bold rounded-xl text-xs transition flex items-center space-x-1.5 cursor-pointer shadow-sm"
            >
              <Download className="w-4 h-4 text-slate-400" />
              <span>Exportar JSON</span>
            </button>

            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black rounded-xl text-xs transition shadow-lg shadow-teal-500/20 flex items-center space-x-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-slate-950 stroke-[3]" />
              <span>Nueva Homologación</span>
            </button>
          </div>
        </div>
      </div>

      {/* Analyzer Selector Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {analyzers.map((an) => {
          const isSelected = an.id === selectedAnalyzerId;
          const mappedCount = mappings.filter((m) => m.analyzerId === an.id).length;

          return (
            <button
              key={an.id}
              onClick={() => setSelectedAnalyzerId(an.id)}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                isSelected
                  ? 'bg-slate-900 border-teal-400 ring-2 ring-teal-500/30 shadow-xl'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                    isSelected ? 'bg-teal-500/20 border-teal-400 text-teal-300' : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}>
                    <Cpu className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-white flex items-center space-x-1.5">
                      <span>{an.name}</span>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      {an.model}
                    </div>
                  </div>
                </div>

                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase font-mono ${
                  an.status === 'ONLINE' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'
                }`}>
                  {an.protocol}
                </span>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center space-x-1">
                  <Layers className="w-3.5 h-3.5 text-teal-400" />
                  <span><strong>{mappedCount}</strong> Pruebas Mapeadas</span>
                </span>
                <span className="font-mono text-slate-500">
                  {an.connectionType === 'TCP_IP' ? `IP: ${an.ipAddress || '192.168.1.10'}` : `COM: ${an.comPort || 'COM1'}`}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Workspace Grid: Left Column (Mapping Table + Ranges), Right Column (Live ASTM + Demographics Simulator) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column - Mappings Table (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Table Header Controls */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por código LIS, trama ASTM o nombre de prueba..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-400"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-2 text-slate-500 hover:text-slate-300 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filter Toggle */}
            <div className="flex items-center space-x-2 shrink-0">
              <label className="text-xs text-slate-400 font-medium flex items-center space-x-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filterActiveOnly}
                  onChange={(e) => setFilterActiveOnly(e.target.checked)}
                  className="rounded border-slate-800 bg-slate-950 text-teal-500 focus:ring-0 cursor-pointer"
                />
                <span>Solo Activas ({filteredMappings.length})</span>
              </label>
            </div>
          </div>

          {/* Mappings Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 font-mono uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Código LIS / Prueba</th>
                    <th className="py-3 px-4">Trama Manual ASTM</th>
                    <th className="py-3 px-4">Rangos de Referencia & Pánico</th>
                    <th className="py-3 px-4">Estado</th>
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredMappings.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500 text-xs">
                        <div className="max-w-xs mx-auto space-y-2">
                          <AlertCircle className="w-8 h-8 text-slate-600 mx-auto" />
                          <p>No hay homologaciones para {selectedAnalyzer?.name}.</p>
                          <button
                            onClick={handleLoadFactoryTemplate}
                            className="px-3 py-1.5 bg-teal-500/20 text-teal-300 border border-teal-500/40 rounded-xl font-bold text-xs hover:bg-teal-500/30 transition cursor-pointer"
                          >
                            ⚡ Cargar Plantilla con Rangos
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredMappings.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-800/40 transition">
                        {/* LIS Test */}
                        <td className="py-3 px-4">
                          <div className="font-bold text-white flex items-center space-x-1.5">
                            <span className="px-2 py-0.5 bg-teal-500/20 border border-teal-500/40 text-teal-300 rounded font-mono text-[11px]">
                              {m.lisTestCode}
                            </span>
                            <span>{m.lisTestName}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            {m.sampleType} • Factor: {m.multiplierFactor}x
                          </div>
                        </td>

                        {/* ASTM Analyzer Code */}
                        <td className="py-3 px-4 font-mono">
                          <div className="inline-flex items-center space-x-1 bg-amber-500/10 border border-amber-500/30 text-amber-300 px-2.5 py-1 rounded-lg text-xs font-bold">
                            <FileCode className="w-3.5 h-3.5 text-amber-400" />
                            <span>{m.astmAnalyzerCode}</span>
                          </div>
                        </td>

                        {/* Reference Ranges Badges */}
                        <td className="py-3 px-4">
                          <div className="space-y-1">
                            {!m.referenceRanges || m.referenceRanges.length === 0 ? (
                              <span className="text-[10px] text-slate-500 italic flex items-center space-x-1">
                                <AlertTriangle className="w-3 h-3 text-amber-400" />
                                <span>Sin rangos configurados</span>
                              </span>
                            ) : (
                              m.referenceRanges.map((rr) => (
                                <div
                                  key={rr.id}
                                  className="inline-flex flex-wrap items-center gap-1.5 text-[10px] bg-slate-950 border border-slate-800 px-2 py-1 rounded-lg mr-1 mb-1"
                                >
                                  <span className="font-bold text-teal-400">
                                    [{rr.gender}]
                                  </span>
                                  <span className="text-white font-mono font-bold">
                                    {rr.minValue} – {rr.maxValue} {rr.unit}
                                  </span>
                                  {rr.panicHighValue !== undefined && (
                                    <span className="text-rose-400 font-mono font-bold">
                                      (Pánico: &gt;{rr.panicHighValue})
                                    </span>
                                  )}
                                </div>
                              ))
                            )}

                            <button
                              onClick={() => handleOpenRangeManager(m)}
                              className="text-[10px] font-bold text-teal-400 hover:text-teal-300 underline block mt-0.5 cursor-pointer"
                            >
                              ⚙️ Administrar Rangos ({m.referenceRanges?.length || 0})
                            </button>
                          </div>
                        </td>

                        {/* Active Status */}
                        <td className="py-3 px-4">
                          <button
                            onClick={() =>
                              onUpdateMapping({
                                ...m,
                                isActive: !m.isActive,
                                updatedAt: new Date().toISOString()
                              })
                            }
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase cursor-pointer flex items-center space-x-1 ${
                              m.isActive
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            }`}
                          >
                            {m.isActive ? (
                              <>
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                <span>Activa</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3 h-3 text-rose-400" />
                                <span>Inactiva</span>
                              </>
                            )}
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end space-x-1">
                            <button
                              onClick={() => {
                                setTestAstmCode(m.astmAnalyzerCode);
                                handleSimulateTranslation();
                              }}
                              title="Probar en simulador"
                              className="p-1.5 hover:bg-slate-800 text-teal-400 rounded-lg transition cursor-pointer"
                            >
                              <Zap className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleOpenEditModal(m)}
                              title="Editar mapeo"
                              className="p-1.5 hover:bg-slate-800 text-slate-300 rounded-lg transition cursor-pointer"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => onDeleteMapping(m.id)}
                              title="Eliminar mapeo"
                              className="p-1.5 hover:bg-slate-800 text-rose-400 rounded-lg transition cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column - Live ASTM & Demographics Simulator (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl relative overflow-hidden">
            <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
              <Sparkles className="w-5 h-5 text-teal-400" />
              <div>
                <h3 className="font-bold text-sm text-white">Probador de Traducción & Clasificación</h3>
                <p className="text-[10px] text-slate-400">Simula la evaluación automática del middleware LIS</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  Código Manual Trama Analizador:
                </label>
                <input
                  type="text"
                  value={testAstmCode}
                  onChange={(e) => setTestAstmCode(e.target.value)}
                  placeholder="ej. Glu-Hexo-123 o Sys-WBC-001"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-amber-300 font-mono font-bold focus:outline-none focus:border-teal-400"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  Valor Numérico Entrante de Muestra:
                </label>
                <input
                  type="text"
                  value={testRawValue}
                  onChange={(e) => setTestRawValue(e.target.value)}
                  placeholder="ej. 125.0"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-teal-400"
                />
              </div>

              {/* Patient Demographics Input */}
              <div className="grid grid-cols-2 gap-2 bg-slate-950 p-2.5 rounded-2xl border border-slate-800">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">
                    Sexo Paciente:
                  </label>
                  <select
                    value={patientGender}
                    onChange={(e) => setPatientGender(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-teal-300 font-bold focus:outline-none"
                  >
                    <option value="Masculino">Masculino</option>
                    <option value="Femenino">Femenino</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">
                    Edad Paciente:
                  </label>
                  <input
                    type="number"
                    value={patientAge}
                    onChange={(e) => setPatientAge(Number(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white font-mono focus:outline-none"
                  />
                </div>
              </div>

              <button
                onClick={handleSimulateTranslation}
                className="w-full py-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black rounded-xl transition shadow-md shadow-teal-500/20 flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <ArrowRightLeft className="w-4 h-4" />
                <span>Simular y Clasificar LIS</span>
              </button>
            </div>

            {/* Simulation Result Output */}
            {simulationResult && (
              <div className={`p-4 rounded-2xl border text-xs space-y-3 ${
                simulationResult.success
                  ? 'bg-slate-950 border-teal-500/40 text-slate-200'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-200'
              }`}>
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-bold text-slate-300 flex items-center space-x-1.5">
                    <Activity className="w-4 h-4 text-teal-400" />
                    <span>Resultado Evaluación LIS</span>
                  </span>
                  {simulationResult.success && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${simulationResult.flagColorClass}`}>
                      {simulationResult.badgeText}
                    </span>
                  )}
                </div>

                {!simulationResult.success ? (
                  <p className="text-[11px] leading-relaxed">{simulationResult.message}</p>
                ) : (
                  <div className="space-y-2 font-mono text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Prueba LIS:</span>
                      <span className="font-bold text-white">{simulationResult.match.lisTestCode} ({simulationResult.match.lisTestName})</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-400">Valor Convertido:</span>
                      <span className="font-bold text-emerald-300">{simulationResult.convertedValue} {simulationResult.match.unit}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-400">Demografía:</span>
                      <span className="text-slate-300">{simulationResult.patientDemographics}</span>
                    </div>

                    {simulationResult.matchedRule && (
                      <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 space-y-1">
                        <div className="text-[10px] text-teal-400 font-bold uppercase font-sans">
                          Rango Aplicado: {simulationResult.matchedRule.interpretation || 'Estándar'}
                        </div>
                        <div className="flex justify-between text-[10px]">
                          <span>Normoglicemia/Rango:</span>
                          <span className="text-white font-bold">{simulationResult.matchedRule.minValue} – {simulationResult.matchedRule.maxValue} {simulationResult.matchedRule.unit}</span>
                        </div>
                        {simulationResult.matchedRule.panicHighValue !== undefined && (
                          <div className="flex justify-between text-[10px] text-rose-400">
                            <span>Umbral Pánico Alto:</span>
                            <span className="font-bold">&gt; {simulationResult.matchedRule.panicHighValue}</span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className={`p-2.5 rounded-xl border text-center text-xs ${simulationResult.flagColorClass}`}>
                      {simulationResult.statusLabel}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick Manual Info Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-2 text-xs">
            <div className="font-bold text-slate-200 flex items-center space-x-1.5">
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span>Estándares de Referencia LIS</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              El middleware LIS asigna automáticamente banderas ASTM (<code className="text-emerald-300 font-mono">N</code>, <code className="text-amber-300 font-mono">H</code>, <code className="text-sky-300 font-mono">L</code>, <code className="text-rose-300 font-mono">HH</code>, <code className="text-rose-300 font-mono">LL</code>) evaluando la muestra entrante contra estos rangos según el expediente demográfico del paciente.
            </p>
          </div>
        </div>
      </div>

      {/* Modal 1: Add/Edit Mapping */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <SlidersHorizontal className="w-5 h-5 text-teal-400" />
                <h3 className="font-bold text-base text-white">
                  {editingMapping ? 'Editar Homologación' : 'Nueva Homologación de Analizador'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-500 hover:text-slate-300 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveMapping} className="space-y-4 text-xs">
              {/* LIS Test Code Selection */}
              <div className="space-y-1">
                <label className="font-bold text-slate-300">Prueba en Catálogo LIS:</label>
                <select
                  value={formData.lisTestCode}
                  onChange={(e) => handleLisTestChange(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-teal-300 font-bold focus:outline-none focus:border-teal-400 cursor-pointer"
                >
                  {testCatalog.map((t) =>
                    t.parameters.map((p) => (
                      <option key={p.id} value={p.astmParamCode} className="bg-slate-900 text-white">
                        {p.astmParamCode} — {p.name} ({t.name})
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* ASTM Manual Code Input */}
              <div className="space-y-1">
                <label className="font-bold text-slate-300">
                  Código Manual ASTM/HL7 en el Analizador:
                </label>
                <input
                  type="text"
                  required
                  value={formData.astmAnalyzerCode}
                  onChange={(e) => setFormData({ ...formData, astmAnalyzerCode: e.target.value })}
                  placeholder="ej. Glu-Hexo-123 o WBC-5DIFF-001"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-amber-300 font-mono font-bold focus:outline-none focus:border-teal-400"
                />
              </div>

              {/* Sample Type & Unit */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Tipo de Muestra:</label>
                  <select
                    value={formData.sampleType}
                    onChange={(e) => setFormData({ ...formData, sampleType: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="Suero">Suero</option>
                    <option value="Sangre Total EDTA">Sangre Total EDTA</option>
                    <option value="Plasma Heparina">Plasma Heparina</option>
                    <option value="Orina 24h">Orina 24h</option>
                    <option value="LCR">LCR</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Factor Multiplicador:</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.multiplierFactor}
                    onChange={(e) => setFormData({ ...formData, multiplierFactor: parseFloat(e.target.value) || 1.0 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none"
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="font-bold text-slate-300">Notas / Referencia Manual:</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="ej. Según página 42 del Manual Ortho Vitros v4.2"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-slate-200 focus:outline-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end space-x-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black rounded-xl text-xs transition shadow-lg shadow-teal-500/20 cursor-pointer"
                >
                  Guardar Homologación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Manage Reference Ranges Modal */}
      {isRangeModalOpen && rangeManagerMapping && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <SlidersHorizontal className="w-5 h-5 text-teal-400" />
                <div>
                  <h3 className="font-bold text-base text-white">
                    Rangos de Referencia para {rangeManagerMapping.lisTestCode} ({rangeManagerMapping.lisTestName})
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Trama ASTM: {rangeManagerMapping.astmAnalyzerCode} • {rangeManagerMapping.analyzerName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsRangeModalOpen(false)}
                className="text-slate-500 hover:text-slate-300 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {/* List of Existing Rules */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
                <Layers className="w-4 h-4 text-teal-400" />
                <span>Reglas Configuradas para esta Prueba ({rangeManagerMapping.referenceRanges?.length || 0})</span>
              </h4>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {(!rangeManagerMapping.referenceRanges || rangeManagerMapping.referenceRanges.length === 0) ? (
                  <p className="text-xs text-slate-500 italic p-3 bg-slate-950 rounded-xl border border-slate-800">
                    No hay reglas de referencia definidas. Agrega la primera regla a continuación.
                  </p>
                ) : (
                  rangeManagerMapping.referenceRanges.map((rr) => (
                    <div
                      key={rr.id}
                      className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="font-bold text-white flex items-center space-x-2">
                          <span className="px-2 py-0.5 bg-teal-500/20 text-teal-300 rounded font-mono text-[10px]">
                            {rr.gender}
                          </span>
                          <span>Edad: {rr.minAgeYears ?? 0} a {rr.maxAgeYears ?? 120} años</span>
                          {rr.interpretation && (
                            <span className="text-[10px] text-slate-400 font-sans font-normal">
                              ({rr.interpretation})
                            </span>
                          )}
                        </div>
                        <div className="text-slate-300 font-mono text-[11px] flex items-center space-x-3">
                          <span>
                            Normal: <strong className="text-emerald-400">{rr.minValue} – {rr.maxValue} {rr.unit}</strong>
                          </span>
                          {rr.panicHighValue !== undefined && (
                            <span className="text-rose-400 font-bold">
                              Pánico Alto: &gt; {rr.panicHighValue}
                            </span>
                          )}
                          {rr.panicLowValue !== undefined && (
                            <span className="text-rose-400 font-bold">
                              Pánico Bajo: &lt; {rr.panicLowValue}
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => handleRemoveRangeRule(rr.id)}
                        className="p-1.5 hover:bg-slate-800 text-rose-400 rounded-lg transition cursor-pointer"
                        title="Eliminar regla"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Add New Range Rule Form */}
            <form onSubmit={handleAddRangeRule} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3 text-xs">
              <div className="font-bold text-slate-200 flex items-center space-x-1.5 border-b border-slate-800 pb-2">
                <Plus className="w-4 h-4 text-teal-400" />
                <span>Agregar Nueva Regla de Referencia</span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Género / Sexo:</label>
                  <select
                    value={rangeForm.gender}
                    onChange={(e) => setRangeForm({ ...rangeForm, gender: e.target.value as any })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none"
                  >
                    <option value="Ambos">Ambos</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Femenino">Femenino</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-300 block mb-1">Edad Mín (Años):</label>
                  <input
                    type="number"
                    value={rangeForm.minAgeYears}
                    onChange={(e) => setRangeForm({ ...rangeForm, minAgeYears: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-300 block mb-1">Edad Máx (Años):</label>
                  <input
                    type="number"
                    value={rangeForm.maxAgeYears}
                    onChange={(e) => setRangeForm({ ...rangeForm, maxAgeYears: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Mínimo Normal:</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={rangeForm.minValue}
                    onChange={(e) => setRangeForm({ ...rangeForm, minValue: parseFloat(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-emerald-400 font-mono font-bold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-300 block mb-1">Máximo Normal:</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={rangeForm.maxValue}
                    onChange={(e) => setRangeForm({ ...rangeForm, maxValue: parseFloat(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-emerald-400 font-mono font-bold focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Pánico Bajo (&lt; Crítico):</label>
                  <input
                    type="number"
                    step="0.01"
                    value={rangeForm.panicLowValue ?? ''}
                    onChange={(e) => setRangeForm({ ...rangeForm, panicLowValue: e.target.value !== '' ? parseFloat(e.target.value) : undefined })}
                    placeholder="ej. 50"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-rose-300 font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-300 block mb-1">Pánico Alto (&gt; Crítico):</label>
                  <input
                    type="number"
                    step="0.01"
                    value={rangeForm.panicHighValue ?? ''}
                    onChange={(e) => setRangeForm({ ...rangeForm, panicHighValue: e.target.value !== '' ? parseFloat(e.target.value) : undefined })}
                    placeholder="ej. 400"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-rose-300 font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Descripción / Interpretación:</label>
                <input
                  type="text"
                  value={rangeForm.interpretation || ''}
                  onChange={(e) => setRangeForm({ ...rangeForm, interpretation: e.target.value })}
                  placeholder="ej. Adultos Normoglicemia o Varones 18-65a"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black rounded-xl text-xs transition cursor-pointer"
                >
                  + Guardar Regla de Referencia
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
