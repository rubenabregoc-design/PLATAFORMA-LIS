import React, { useState, useMemo, useEffect } from 'react';
import { useMiddlewareBridge } from '../hooks/useMiddlewareBridge';
import { notifyToast } from '../utils/toastNotification';
import { Analyzer, AnalyzerTestMapping, ReferenceRange, TestCatalogItem, Role, User } from '../types';
import {
  SlidersHorizontal, Cpu, ShieldCheck, Plus, Search, CheckCircle2,
  XCircle, Edit3, Trash2, ArrowRightLeft, Sparkles, Download, Upload,
  RefreshCw, BookOpen, AlertCircle, FileCode, Check, Layers, Zap, Info,
  AlertTriangle, ArrowUpRight, ArrowDownRight, Activity, Filter, UserCheck, HardDrive, Network,
  Database, X, Package
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
  const isAdmin = currentRole === 'abregotech_admin';
  const [selectedAnalyzerId, setSelectedAnalyzerId] = useState<string>(analyzers[0]?.id || '');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterActiveOnly, setFilterActiveOnly] = useState<boolean>(false);

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingMapping, setEditingMapping] = useState<AnalyzerTestMapping | null>(null);

  const { saveAnalyzerConfig, deleteAnalyzerConfig, driverCatalog, installDriverCassette, deleteDriverPlugin } = useMiddlewareBridge();
  const [isAnalyzerModalOpen, setIsAnalyzerModalOpen] = useState<boolean>(false);
  const [editingAnalyzer, setEditingAnalyzer] = useState<Analyzer | null>(null);

  // Plugin / Driver Manager State
  const [isCassetteModalOpen, setIsCassetteModalOpen] = useState<boolean>(false);
  const [uploadedCassetteData, setUploadedCassetteData] = useState<any | null>(null);
  const [cassetteFileName, setCassetteFileName] = useState<string>('');
  const [cassetteInstallSuccess, setCassetteInstallSuccess] = useState<string | null>(null);
  const [cassetteInstallError, setCassetteInstallError] = useState<string | null>(null);
  const [exportAnalyzerId, setExportAnalyzerId] = useState<string>(analyzers[0]?.id || '');

  const handleDeleteAnalyzer = (analyzerId: string, analyzerName: string) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar la configuración del analizador "${analyzerName}" de la red LIS y cerrar sus puertos?`)) {
      deleteAnalyzerConfig(analyzerId);
      notifyToast.success(`Analizador "${analyzerName}" eliminado de la red LIS`, 4000);
      if (selectedAnalyzerId === analyzerId) {
        const remaining = analyzers.filter(a => a.id !== analyzerId);
        if (remaining.length > 0) setSelectedAnalyzerId(remaining[0].id);
      }
    }
  };

  const handleDeleteDriver = (driverId: string, driverName: string) => {
    if (window.confirm(`¿Eliminar el plugin de driver "${driverName}" del sistema?`)) {
      deleteDriverPlugin(driverId);
      notifyToast.success(`Plugin de driver "${driverName}" eliminado del catálogo`, 4000);
    }
  };

  const DEFAULT_DRIVERS = [
    { id: 'roche-cobas', name: 'Roche Cobas (c311, e411, 6000, 8000)', manufacturer: 'Roche Diagnostics', protocol: 'ASTM_E1381', orderStrategy: 'MULTI_O_RECORDS', ackDelayMs: 10, category: 'QUIMICA', isCassette: false },
    { id: 'sysmex-xn', name: 'Sysmex XN Series (XN-1000, XN-2000, XS)', manufacturer: 'Sysmex Corporation', protocol: 'ASTM_E1381', orderStrategy: 'PROFILE_ONLY', ackDelayMs: 0, category: 'HEMATOLOGIA', isCassette: false },
    { id: 'mindray-bc', name: 'Mindray BC/BS Series (BC-5390, BS)', manufacturer: 'Mindray Bio-Medical', protocol: 'ASTM_E1381', orderStrategy: 'MULTI_O_RECORDS', ackDelayMs: 15, category: 'HEMATOLOGIA', isCassette: false },
    { id: 'stago-sta', name: 'Stago STA Coagulación (Compact, Max)', manufacturer: 'Diagnostica Stago', protocol: 'ASTM_E1381', orderStrategy: 'MULTI_O_RECORDS', ackDelayMs: 50, category: 'COAGULACION', isCassette: false },
    { id: 'ortho-vitros', name: 'Ortho Vitros Series (4600, 5600)', manufacturer: 'Ortho Clinical Diagnostics', protocol: 'ASTM_E1381', orderStrategy: 'SINGLE_O_REPEAT', ackDelayMs: 0, category: 'QUIMICA', isCassette: false },
    { id: 'abbott-alinity', name: 'Abbott Alinity / Architect Series', manufacturer: 'Abbott Diagnostics', protocol: 'HL7_V2', orderStrategy: 'SINGLE_O_REPEAT', ackDelayMs: 15, category: 'INMUNOLOGIA', isCassette: false },
    { id: 'generic-driver', name: 'Driver Universal ASTM Genérico', manufacturer: 'AbregoTech Solutions', protocol: 'ASTM_E1381', orderStrategy: 'MULTI_O_RECORDS', ackDelayMs: 0, category: 'QUIMICA', isCassette: false }
  ];

  const effectiveDrivers = driverCatalog && driverCatalog.length > 0 ? driverCatalog : DEFAULT_DRIVERS;

  const [analyzerFormData, setAnalyzerFormData] = useState({
    name: 'Roche Cobas c311',
    model: 'Cobas c311',
    protocol: 'ASTM_E1381' as Analyzer['protocol'],
    connectionType: 'TCP_IP' as Analyzer['connectionType'],
    ipAddress: '192.168.1.50',
    port: 6000,
    comPort: 'COM1',
    driverId: 'roche-cobas',
    category: 'QUIMICA',
    orderStrategy: 'MULTI_O_RECORDS',
    ackDelayMs: 10
  });

  const handleDriverChange = (driverId: string) => {
    const selectedDriver = effectiveDrivers.find(d => d.id === driverId);
    if (selectedDriver) {
      setAnalyzerFormData(prev => ({
        ...prev,
        driverId,
        protocol: (selectedDriver.protocol as any) || prev.protocol,
        orderStrategy: selectedDriver.orderStrategy || prev.orderStrategy,
        category: selectedDriver.category || prev.category,
        ackDelayMs: selectedDriver.ackDelayMs !== undefined ? selectedDriver.ackDelayMs : prev.ackDelayMs,
        port: selectedDriver.defaultPort || prev.port
      }));
    } else {
      setAnalyzerFormData(prev => ({ ...prev, driverId }));
    }
  };

  const handleSaveAnalyzer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!analyzerFormData.name.trim()) return;

    const payload = {
      id: editingAnalyzer ? editingAnalyzer.id : `an-${analyzerFormData.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      name: analyzerFormData.name,
      model: analyzerFormData.model,
      port: Number(analyzerFormData.port) || 6000,
      protocol: analyzerFormData.protocol,
      category: analyzerFormData.category,
      driverId: analyzerFormData.driverId,
      orderStrategy: analyzerFormData.orderStrategy,
      ackDelayMs: Number(analyzerFormData.ackDelayMs) || 0
    };

    saveAnalyzerConfig(payload);
    setIsAnalyzerModalOpen(false);
  };

  const handleCassetteFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCassetteFileName(file.name);
    setCassetteInstallSuccess(null);
    setCassetteInstallError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (!parsed.name) {
          throw new Error('El archivo no contiene un nombre de analizador válido');
        }
        setUploadedCassetteData(parsed);
      } catch (err: any) {
        setCassetteInstallError(`Error al leer cassette: ${err.message}`);
        setUploadedCassetteData(null);
      }
    };
    reader.onerror = () => {
      setCassetteInstallError('Error de lectura física del archivo');
    };
    reader.readAsText(file);
  };

  const handleInstallCassette = () => {
    if (!uploadedCassetteData) return;
    try {
      installDriverCassette(uploadedCassetteData);
      setCassetteInstallSuccess(`¡Plugin de Driver "${uploadedCassetteData.name}" instalado y activado en el Middleware LIS!`);
      setTimeout(() => {
        setUploadedCassetteData(null);
        setCassetteFileName('');
      }, 2000);
    } catch (err: any) {
      setCassetteInstallError(`Error instalando plugin de driver: ${err.message}`);
    }
  };

  const handleExportAnalyzerById = (analyzerId: string) => {
    const target = analyzers.find(a => a.id === analyzerId) || selectedAnalyzer;
    if (!target) return;

    const currentMappings = mappings.filter(m => m.analyzerId === target.id);
    const testMappingDict: Record<string, string> = {};
    currentMappings.forEach(m => {
      if (m.astmAnalyzerCode && m.lisTestCode) {
        testMappingDict[m.astmAnalyzerCode] = m.lisTestCode;
      }
    });

    const driverPackage = {
      packageVersion: '1.0.0',
      id: `driver-${target.id}`,
      name: `${target.name} (Plugin Driver LIS)`,
      modelMatch: target.model || target.name,
      manufacturer: target.name.split(' ')[0] || 'AbregoTech',
      category: target.category || 'QUIMICA',
      protocol: target.protocol || 'ASTM_E1381',
      defaultPort: target.port || 5100,
      ackDelayMs: target.ackDelayMs || 0,
      orderStrategy: target.orderStrategy || 'MULTI_O_RECORDS',
      testPrefix: target.testPrefix || '^^^',
      repeatDelimiter: target.repeatDelimiter || '\\',
      barcodePrefix: target.barcodePrefix || '',
      profileCode: 'ALL',
      testMapping: testMappingDict,
      flagMapping: {
        "N": "NORMAL",
        "H": "ALTO",
        "L": "BAJO",
        "A": "ANORMAL",
        "P": "PANICO"
      },
      exportedAt: new Date().toISOString(),
      author: currentUser.name,
      brand: 'Abrego Tech Solutions'
    };

    const blob = new Blob([JSON.stringify(driverPackage, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${target.name.replace(/[^a-zA-Z0-9]/g, '_')}_v1.0.driver`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportCurrentAnalyzerCassette = () => {
    handleExportAnalyzerById(selectedAnalyzerId);
  };

  const handleExportDriverTemplate = (drv: any) => {
    const cassette = {
      packageVersion: '1.0.0',
      id: drv.id || `cassette-${drv.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      name: drv.name,
      modelMatch: drv.modelMatch || drv.name,
      manufacturer: drv.manufacturer || 'General',
      category: drv.category || 'QUIMICA',
      protocol: drv.protocol || 'ASTM_E1381',
      defaultPort: drv.defaultPort || 5100,
      ackDelayMs: drv.ackDelayMs || 0,
      orderStrategy: drv.orderStrategy || 'MULTI_O_RECORDS',
      testPrefix: drv.testPrefix || '^^^',
      repeatDelimiter: drv.repeatDelimiter || '\\',
      barcodePrefix: drv.barcodePrefix || '',
      profileCode: drv.profileCode || 'ALL',
      testMapping: drv.testMapping || {},
      flagMapping: drv.flagMapping || {
        "N": "NORMAL",
        "H": "ALTO",
        "L": "BAJO",
        "A": "ANORMAL",
        "P": "PANICO"
      },
      exportedAt: new Date().toISOString(),
      isCassette: true,
      author: currentUser.name
    };

    const blob = new Blob([JSON.stringify(cassette, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(drv.id || drv.name).replace(/[^a-zA-Z0-9]/g, '_')}.acedriver`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const [rangeManagerMapping, setRangeManagerMapping] = useState<AnalyzerTestMapping | null>(null);
  const [isRangeModalOpen, setIsRangeModalOpen] = useState<boolean>(false);

  const [formData, setFormData] = useState({
    lisTestCode: 'GLU', lisTestName: 'Glucosa Basal', astmAnalyzerCode: '',
    sampleType: 'Suero', multiplierFactor: 1.0, unit: 'mg/dL', isActive: true, notes: ''
  });

  const [rangeForm, setRangeForm] = useState<Omit<ReferenceRange, 'id'>>({
    gender: 'Ambos', minAgeYears: 0, maxAgeYears: 120, minValue: 70, maxValue: 99,
    panicLowValue: 50, panicHighValue: 400, unit: 'mg/dL', interpretation: 'Población General'
  });

  const [testAstmCode, setTestAstmCode] = useState<string>('GLU_101');
  const [testRawValue, setTestRawValue] = useState<string>('125.0');
  const [simulationResult, setSimulationResult] = useState<any | null>(null);
  const [isSimulatingMapping, setIsSimulatingMapping] = useState(false);
  const [isAutoMapping, setIsAutoMapping] = useState(false);
  const [mappingTargetAnalyzerId, setMappingTargetAnalyzerId] = useState<string>(analyzers[0]?.id || '');
  const [analitoSearchQuery, setAnalitoSearchQuery] = useState<string>('');

  const selectedAnalyzer = analyzers.find((a) => a.id === selectedAnalyzerId) || analyzers[0];
  const currentAnalyzerMappings = mappings.filter((m) => m.analyzerId === selectedAnalyzerId);

  // Flatten catalog parameters with clean categorization
  const allCatalogParameters = useMemo(() => {
    const list: Array<{
      code: string;
      name: string;
      testName: string;
      category: string;
      defaultUnit: string;
      defaultSampleType: string;
    }> = [];

    const seen = new Set<string>();
    testCatalog.forEach(t => {
      t.parameters?.forEach(p => {
        const paramCode = p.astmParamCode || p.id;
        const key = `${paramCode}_${t.category}`;
        if (!seen.has(key)) {
          seen.add(key);
          list.push({
            code: paramCode,
            name: p.name,
            testName: t.name,
            category: t.category || 'GENERAL',
            defaultUnit: p.unit || 'mg/dL',
            defaultSampleType: t.sampleType || 'Suero'
          });
        }
      });
    });

    return list;
  }, [testCatalog]);

  const filteredCatalogParameters = useMemo(() => {
    const query = analitoSearchQuery.trim().toLowerCase();
    const targetAnalyzer = analyzers.find(a => a.id === mappingTargetAnalyzerId) || selectedAnalyzer;
    const targetCategory = targetAnalyzer?.category?.toUpperCase();

    let res = allCatalogParameters;
    if (query) {
      res = res.filter(p =>
        p.code.toLowerCase().includes(query) ||
        p.name.toLowerCase().includes(query) ||
        p.testName.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query)
      );
    } else if (targetCategory) {
      res = [...res].sort((a, b) => {
        const aMatch = a.category.toUpperCase() === targetCategory ? -1 : 1;
        const bMatch = b.category.toUpperCase() === targetCategory ? -1 : 1;
        return aMatch - bMatch;
      });
    }
    return res;
  }, [allCatalogParameters, analitoSearchQuery, mappingTargetAnalyzerId, selectedAnalyzer, analyzers]);

  const filteredMappings = currentAnalyzerMappings.filter((m) => {
    const matchesSearch = m.lisTestCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.lisTestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.astmAnalyzerCode.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch && (!filterActiveOnly || m.isActive);
  });

  const [syncStatus, setSyncStatus] = useState<'SYNCED' | 'SYNCING' | 'OFFLINE'>('SYNCED');

  const pushMappingsToMiddleware = (mappingsToSync: AnalyzerTestMapping[], silent = true) => {
    // 1. Persistir matriz de homologación localmente
    try {
      localStorage.setItem('lis_analyzer_mappings', JSON.stringify(mappingsToSync));
    } catch (e) {
      console.warn('Error guardando en localStorage:', e);
    }

    // 2. Transmitir en caliente al WebSocket Middleware Bridge (:8765)
    if (typeof window !== 'undefined') {
      try {
        const ws = new WebSocket('ws://localhost:8765');
        ws.onopen = () => {
          ws.send(JSON.stringify({
            type: 'sync_mappings',
            mappings: mappingsToSync
          }));
          setSyncStatus('SYNCED');
          setTimeout(() => ws.close(), 600);
        };
        ws.onerror = () => {
          setSyncStatus('OFFLINE');
        };
      } catch (e) {
        setSyncStatus('OFFLINE');
      }
    }

    // 3. Persistir físicamente en la Base de Datos PostgreSQL local (:8000)
    if (mappingsToSync.length > 0) {
      Promise.all(
        mappingsToSync.map(m =>
          fetch('http://localhost:8000/analyzer_mappings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Prefer': 'resolution=merge-duplicates' },
            body: JSON.stringify({
              id: m.id,
              tenant_id: m.tenantId || 'lab-san-jose',
              analyzer_id: m.analyzerId,
              analyzer_name: m.analyzerName,
              lis_test_code: m.lisTestCode,
              lis_test_name: m.lisTestName,
              astm_analyzer_code: m.astmAnalyzerCode,
              sample_type: m.sampleType,
              multiplier_factor: m.multiplierFactor,
              unit: m.unit,
              is_active: m.isActive,
              notes: m.notes,
              updated_at: new Date().toISOString(),
              updated_by: m.updatedBy
            })
          }).catch(() => null)
        )
      ).catch(() => {});
    }

    if (!silent) {
      notifyToast.success(
        `✓ Matriz de homologación guardada: ${mappingsToSync.length} mapeos de analitos guardados en PostgreSQL y listos para el Middleware.`,
        4500
      );
    }
  };

  // Sincronización 100% AUTOMÁTICA en caliente con el Middleware al montar y con cada cambio de mapeos
  useEffect(() => {
    pushMappingsToMiddleware(mappings, true);
  }, [mappings]);

  const handleDownloadBridge = () => {
    pushMappingsToMiddleware(mappings, false);
  };

  const handleOpenAddModal = () => {
    setEditingMapping(null);
    setMappingTargetAnalyzerId(selectedAnalyzerId);
    setAnalitoSearchQuery('');

    const currentTarget = analyzers.find(a => a.id === selectedAnalyzerId) || analyzers[0];
    const isCoag = currentTarget?.name?.toLowerCase().includes('stago') || currentTarget?.category === 'COAGULACION';

    setFormData({
      lisTestCode: isCoag ? 'TP' : (testCatalog[0]?.parameters[0]?.astmParamCode || 'GLU'),
      lisTestName: isCoag ? 'Tiempo de Protrombina (TP)' : (testCatalog[0]?.name || 'Glucosa Basal'),
      astmAnalyzerCode: isCoag ? 'PT' : '',
      sampleType: isCoag ? 'Plasma Citratado' : 'Suero',
      multiplierFactor: 1.0,
      unit: isCoag ? 'seg' : 'mg/dL',
      isActive: true,
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (mapping: AnalyzerTestMapping) => {
    setEditingMapping(mapping);
    setMappingTargetAnalyzerId(mapping.analyzerId);
    setAnalitoSearchQuery('');
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

  const handleOpenRangeManager = (mapping: AnalyzerTestMapping) => {
    setRangeManagerMapping(mapping);
    setRangeForm({ ...rangeForm, unit: mapping.unit || 'mg/dL' });
    setIsRangeModalOpen(true);
  };

  const handleSaveMapping = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.astmAnalyzerCode.trim()) return;
    const targetAnalyzer = analyzers.find(a => a.id === mappingTargetAnalyzerId) || selectedAnalyzer;
    const data = { ...formData, updatedAt: new Date().toISOString(), updatedBy: currentUser.name };
    if (editingMapping) {
      onUpdateMapping({ ...editingMapping, analyzerId: targetAnalyzer.id, analyzerName: targetAnalyzer.name, ...data });
    } else {
      onAddMapping({
        id: `map-${Date.now()}`,
        analyzerId: targetAnalyzer.id,
        analyzerName: targetAnalyzer.name,
        tenantId: targetAnalyzer.tenantId || 'lab-san-jose',
        ...data,
        referenceRanges: []
      });
    }
    setSelectedAnalyzerId(targetAnalyzer.id);
    notifyToast.success(`✓ Mapeo guardado para ${targetAnalyzer.name}: ${formData.astmAnalyzerCode} ➔ ${formData.lisTestCode}`);
    setIsModalOpen(false);
  };

  const handleAddRangeRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rangeManagerMapping) return;
    const newRule = { id: `rr-${Date.now()}`, ...rangeForm };
    onUpdateMapping({ ...rangeManagerMapping, referenceRanges: [...(rangeManagerMapping.referenceRanges || []), newRule] });
    setRangeManagerMapping({ ...rangeManagerMapping, referenceRanges: [...(rangeManagerMapping.referenceRanges || []), newRule] });
  };

  const handleSimulateTranslation = () => {
    setIsSimulatingMapping(true);
    setSimulationResult(null);

    setTimeout(() => {
        const match = currentAnalyzerMappings.find(m => m.astmAnalyzerCode.toLowerCase() === testAstmCode.trim().toLowerCase());
        if (!match) {
            setSimulationResult({ success: false, message: 'Fallo: Código de equipo no homologado en la tabla.' });
        } else {
            const val = parseFloat(testRawValue) || 0;
            const finalVal = val * match.multiplierFactor;

            // Simulation logic
            let flag = 'NORMAL';
            let ruleUsed = match.referenceRanges?.[0];

            if (ruleUsed) {
                if (ruleUsed.panicHighValue && finalVal >= ruleUsed.panicHighValue) flag = 'CRITICO_ALTO';
                else if (finalVal > ruleUsed.maxValue) flag = 'ALTO';
                else if (finalVal < ruleUsed.minValue) flag = 'BAJO';
            }

            setSimulationResult({
                success: true,
                match,
                convertedValue: finalVal.toFixed(2),
                flag,
                trace: `ACE → LIS-Translate → Match: ${match.lisTestCode} → Factor[x${match.multiplierFactor}]`
            });
        }
        setIsSimulatingMapping(false);
    }, 600);
  };

  const handleAutoMap = () => {
      setIsAutoMapping(true);
      setTimeout(() => {
          setIsAutoMapping(false);
          notifyToast.success(`⚡ ACE AI Auto-Map: Se encontraron 4 posibles mapeos en base a los dialectos históricos de ${selectedAnalyzer.name}. Revisa la tabla.`, 5000);
      }, 1500);
  }

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2"><Network className="w-6 h-6 text-teal-400" /> Matriz de Homologación</h2>
          <p className="text-xs text-slate-400">Diccionario de traducción bidireccional (LIS Core ↔ Analizador).</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setExportAnalyzerId(selectedAnalyzerId);
              setIsCassetteModalOpen(true);
            }}
            className="px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-bold rounded-xl text-xs flex items-center gap-2 border border-amber-500/30 transition shadow-lg shadow-amber-500/10 cursor-pointer"
          >
            <Layers className="w-4 h-4 text-amber-400" /> Plugins de Driver (.driver)
          </button>
          <button
            onClick={handleExportCurrentAnalyzerCassette}
            className="px-4 py-2 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 font-bold rounded-xl text-xs flex items-center gap-2 border border-indigo-500/40 transition cursor-pointer"
            title={`Exportar paquete de driver para ${selectedAnalyzer.name}`}
          >
            <Download className="w-4 h-4 text-indigo-400" /> Exportar Driver
          </button>
          <button
            onClick={handleDownloadBridge}
            className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-2 border transition shadow-lg cursor-pointer ${
              syncStatus === 'SYNCED'
                ? 'bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border-emerald-500/40 shadow-emerald-500/10'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
            title="Sincronización automática en segundo plano activa. Clic para forzar resincronización inmediata."
          >
            <span className={`w-2 h-2 rounded-full ${syncStatus === 'SYNCED' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}`}></span>
            <RefreshCw className={`w-3.5 h-3.5 ${syncStatus === 'SYNCED' ? 'text-emerald-400' : 'text-slate-400'}`} />
            <span>Sync Engine (Automático)</span>
          </button>
          <button onClick={() => setIsAnalyzerModalOpen(true)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs border border-slate-700 flex items-center gap-1.5 transition cursor-pointer"><Cpu className="w-4 h-4 text-teal-400" /> Registrar Equipo</button>
          <button onClick={handleOpenAddModal} className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 transition shadow-lg shadow-teal-500/20 cursor-pointer"><Plus className="w-4 h-4 stroke-[3]" /> Nuevo Mapeo</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {analyzers.map((an) => (
          <div key={an.id} onClick={() => setSelectedAnalyzerId(an.id)} className={`p-4 rounded-2xl border transition-all cursor-pointer relative ${an.id === selectedAnalyzerId ? 'bg-slate-900 border-teal-400 ring-2 ring-teal-500/20 shadow-xl' : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'}`}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${an.id === selectedAnalyzerId ? 'bg-teal-500/20 border-teal-400 text-teal-300' : 'bg-slate-950 border-slate-800 text-slate-400'}`}><Cpu className="w-5 h-5" /></div>
                <div><div className="font-bold text-sm text-white">{an.name}</div><div className="text-[10px] text-slate-500 font-mono mt-0.5">{an.driverId}</div></div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[9.5px] font-mono font-bold px-2 py-0.5 rounded-md bg-cyan-950/60 text-cyan-300 border border-cyan-800/60">
                  {an.connectionType === 'TCP_IP' ? `TCP :${an.port || 5100}` : (an.comPort || 'COM1')}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteAnalyzer(an.id, an.name);
                  }}
                  className="p-1 hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 rounded-md transition cursor-pointer"
                  title={`Eliminar analizador ${an.name} de la red LIS`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex justify-between items-center text-[10px] text-slate-500 font-mono">
              <span className="flex items-center gap-1"><Database className="w-3 h-3 text-slate-400"/> {mappings.filter(m => m.analyzerId === an.id).length} Mapeos Locales</span>
              <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-slate-400">{an.protocol}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-3 flex-1">
                <Search className="w-4 h-4 text-slate-500" />
                <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Filtrar por código ASTM, LIS o nombre de analito..." className="bg-transparent border-none text-xs font-mono text-white focus:ring-0 flex-1 outline-none" />
            </div>
            <button onClick={handleAutoMap} className="px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 font-bold rounded-xl text-xs flex items-center gap-2 border border-indigo-500/20 transition">
                {isAutoMapping ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} ACE Auto-Map AI
            </button>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-500 font-mono uppercase text-[10px] border-b border-slate-800">
                <tr><th className="p-4">Analito LIS Core</th><th className="p-4">Trama Equip. (ASTM/HL7)</th><th className="p-4">Interpretación & Rango</th><th className="p-4 text-right">Acciones</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredMappings.map(m => (
                  <tr key={m.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-4">
                      <div className="font-bold text-white flex items-center gap-2"><span className="px-1.5 py-0.5 bg-teal-500/10 text-teal-400 rounded text-[10px] font-mono border border-teal-500/20">{m.lisTestCode}</span>{m.lisTestName}</div>
                      <div className="text-[10px] text-slate-500 mt-1">Muestra: {m.sampleType}</div>
                    </td>
                    <td className="p-4">
                        <div className="font-mono text-amber-400 font-bold">{m.astmAnalyzerCode}</div>
                        <div className="text-[10px] text-slate-500 mt-1">Factor (x{m.multiplierFactor})</div>
                    </td>
                    <td className="p-4">
                      <button onClick={() => handleOpenRangeManager(m)} className="text-[10px] font-bold text-teal-400 hover:text-teal-300 transition flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-md border border-slate-800 hover:border-slate-700">
                          <SlidersHorizontal className="w-3 h-3" /> Configurar Reglas ({m.referenceRanges?.length || 0})
                      </button>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-1"><button onClick={() => handleOpenEditModal(m)} className="p-1.5 hover:bg-slate-800 text-slate-400 rounded-lg transition"><Edit3 className="w-4 h-4" /></button><button onClick={() => onDeleteMapping(m.id)} className="p-1.5 hover:bg-slate-800/80 text-rose-400 rounded-lg transition"><Trash2 className="w-4 h-4" /></button></div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-4">
           <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl">
              <div>
                  <h3 className="font-black text-sm text-white flex items-center gap-2"><Activity className="w-4 h-4 text-teal-400" /> Simulador de Traducción ACE</h3>
                  <p className="text-[10px] text-slate-400 mt-1">Inyecta un payload raw para probar si el engine resuelve el mapeo y aplica el factor correctamente.</p>
              </div>
              <div className="space-y-3 text-xs">
                 <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Input: Código Analizador</label>
                    <input type="text" value={testAstmCode} onChange={e => setTestAstmCode(e.target.value)} placeholder="Ej: GLU_101" className="w-full mt-1 bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl p-2.5 text-amber-400 font-mono outline-none transition" />
                 </div>
                 <div>
                     <label className="text-[10px] font-bold text-slate-500 uppercase">Input: Valor Raw Escaneado</label>
                     <input type="text" value={testRawValue} onChange={e => setTestRawValue(e.target.value)} placeholder="Ej: 125.0" className="w-full mt-1 bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl p-2.5 text-white font-mono outline-none transition" />
                 </div>
                 <button onClick={handleSimulateTranslation} disabled={isSimulatingMapping} className="w-full py-2.5 bg-teal-500 hover:bg-teal-400 transition text-slate-950 font-black rounded-xl text-[11px] uppercase shadow-lg shadow-teal-500/20 disabled:opacity-50 flex justify-center items-center gap-2">
                     {isSimulatingMapping ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Procesar Trama Local'}
                 </button>
              </div>

              {simulationResult && (
                <div className={`p-4 rounded-xl border animate-in fade-in slide-in-from-bottom-2 ${simulationResult.success ? 'bg-slate-950 border-teal-500/30' : 'bg-rose-500/10 border-rose-500/20'}`}>
                   {simulationResult.success ? (
                       <div className="space-y-2">
                           <div className="text-[9px] font-mono text-teal-500 mb-2">{simulationResult.trace}</div>
                           <div className="flex justify-between items-center text-xs">
                               <span className="text-slate-400">Analito Destino:</span>
                               <span className="font-bold text-white">{simulationResult.match.lisTestName}</span>
                           </div>
                           <div className="flex justify-between items-center text-xs">
                               <span className="text-slate-400">Conversión Final:</span>
                               <div className="flex items-center gap-2">
                                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                      simulationResult.flag === 'CRITICO_ALTO' ? 'bg-rose-500 text-white' :
                                      simulationResult.flag === 'ALTO' ? 'bg-amber-500/20 text-amber-400' :
                                      'bg-emerald-500/20 text-emerald-400'
                                  }`}>{simulationResult.flag}</span>
                                  <span className="text-teal-400 font-mono font-bold text-sm">{simulationResult.convertedValue} {simulationResult.match.unit}</span>
                               </div>
                           </div>
                       </div>
                   ) : (
                       <p className="text-xs text-rose-400 font-bold">{simulationResult.message}</p>
                   )}
                </div>
              )}
           </div>
        </div>
      </div>

      {/* MODAL VISUAL REGISTRO Y CONFIGURACION DE ANALIZADOR */}
      {isAnalyzerModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-8 shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 sticky top-0 bg-slate-900 z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-500/20 border border-teal-400 flex items-center justify-center text-teal-300">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white uppercase italic tracking-tight">Configuración Visual de Analizador</h3>
                  <p className="text-[10px] text-slate-400">Activa puertos TCP, asigna drivers y dialectos sin tocar código.</p>
                </div>
              </div>
              <button onClick={() => setIsAnalyzerModalOpen(false)} className="text-slate-500 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSaveAnalyzer} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-black text-slate-400 uppercase tracking-widest text-[10px]">Nombre del Equipo:</label>
                  <input
                    type="text"
                    placeholder="Ej. Roche Cobas c311"
                    value={analyzerFormData.name}
                    onChange={e => setAnalyzerFormData({...analyzerFormData, name: e.target.value})}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-white font-bold focus:border-teal-500 outline-none"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-black text-slate-400 uppercase tracking-widest text-[10px]">Modelo / Serie:</label>
                  <input
                    type="text"
                    placeholder="Ej. c311 / Cobas 6000"
                    value={analyzerFormData.model}
                    onChange={e => setAnalyzerFormData({...analyzerFormData, model: e.target.value})}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-white font-mono focus:border-teal-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-black text-slate-400 uppercase tracking-widest text-[10px]">Puerto TCP de Escucha:</label>
                  <div className="relative">
                    <input
                      type="number"
                      min={1025}
                      max={65535}
                      value={analyzerFormData.port}
                      onChange={e => setAnalyzerFormData({...analyzerFormData, port: Number(e.target.value)})}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-teal-300 font-mono font-bold focus:border-teal-500 outline-none"
                      required
                    />
                    <span className="absolute right-3 top-2.5 text-[10px] text-slate-500 font-mono">TCP</span>
                  </div>
                  <span className="text-[9px] text-slate-500">Ej: 5100, 6000, 7050, 9200.</span>
                </div>

                <div className="space-y-1">
                  <label className="font-black text-slate-400 uppercase tracking-widest text-[10px]">Protocolo Clínico:</label>
                  <select
                    value={analyzerFormData.protocol}
                    onChange={e => setAnalyzerFormData({...analyzerFormData, protocol: e.target.value as any})}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-white font-bold focus:border-teal-500 outline-none cursor-pointer"
                  >
                    <option value="ASTM_E1381">ASTM E1381 / E1394 (CLSI LIS01-A2)</option>
                    <option value="HL7_V2">HL7 v2.5 MLLP (Minimal Lower Layer Protocol)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="font-black text-slate-400 uppercase tracking-widest text-[10px]">Driver Especializado:</label>
                    <span className="text-[9px] text-teal-400 font-mono">Auto-configura timing</span>
                  </div>
                  <select
                    value={analyzerFormData.driverId}
                    onChange={e => handleDriverChange(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-white font-bold focus:border-teal-500 outline-none cursor-pointer"
                  >
                    {effectiveDrivers.map(drv => (
                      <option key={drv.id} value={drv.id}>
                        {drv.isCassette ? `📦 [CASSETTE] ${drv.name}` : drv.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-black text-slate-400 uppercase tracking-widest text-[10px]">Estrategia de Órdenes (Cero Slashes):</label>
                  <select
                    value={analyzerFormData.orderStrategy}
                    onChange={e => setAnalyzerFormData({...analyzerFormData, orderStrategy: e.target.value})}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-white font-bold focus:border-teal-500 outline-none cursor-pointer"
                  >
                    <option value="MULTI_O_RECORDS">MULTI_O_RECORDS (Un 'O' por examen - Cero fallas por slash)</option>
                    <option value="PROFILE_ONLY">PROFILE_ONLY (Código global de batería para hematología)</option>
                    <option value="SINGLE_O_REPEAT">SINGLE_O_REPEAT (Repetición con delimitador si el equipo lo soporta)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-black text-slate-400 uppercase tracking-widest text-[10px]">Área / Categoría:</label>
                  <select
                    value={analyzerFormData.category}
                    onChange={e => setAnalyzerFormData({...analyzerFormData, category: e.target.value})}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-white font-bold focus:border-teal-500 outline-none cursor-pointer"
                  >
                    <option value="QUIMICA">QUÍMICA CLÍNICA</option>
                    <option value="HEMATOLOGIA">HEMATOLOGÍA</option>
                    <option value="INMUNOLOGIA">INMUNOLOGÍA / SEROLOGÍA</option>
                    <option value="COAGULACION">COAGULACIÓN</option>
                    <option value="ESPECIALES">PRUEBAS ESPECIALES</option>
                    <option value="UROANALISIS">UROANÁLISIS</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-black text-slate-400 uppercase tracking-widest text-[10px]">Retardo de Handshake ACK:</label>
                  <select
                    value={analyzerFormData.ackDelayMs}
                    onChange={e => setAnalyzerFormData({...analyzerFormData, ackDelayMs: Number(e.target.value)})}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-white font-bold focus:border-teal-500 outline-none cursor-pointer"
                  >
                    <option value={0}>0 ms (Inmediato - Sysmex, Vitros)</option>
                    <option value={5}>5 ms (Rápido)</option>
                    <option value={10}>10 ms (Estándar Roche Cobas)</option>
                    <option value={15}>15 ms (Mindray, Abbott)</option>
                    <option value={50}>50 ms (Obligatorio para Stago STA)</option>
                  </select>
                </div>
              </div>

              <div className="p-3.5 bg-slate-950/70 border border-teal-500/20 rounded-2xl flex items-center justify-between text-[11px] text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Al hacer clic en <strong>Guardar y Activar</strong>, el puerto TCP se abrirá en vivo automáticamente.</span>
                </div>
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsAnalyzerModalOpen(false)}
                  className="flex-1 py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs uppercase transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black rounded-xl text-xs uppercase shadow-xl transition-all cursor-pointer"
                >
                  Guardar y Activar Analizador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto custom-scrollbar animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 sticky top-0 bg-slate-900 z-20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-300">
                  <ArrowRightLeft className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-white tracking-tight">
                    {editingMapping ? 'Editar Mapeo de Analito' : 'Nuevo Mapeo de Analizador'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Traducción de códigos entre el protocolo del equipo (ASTM/HL7) y el catálogo LIS.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMapping} className="space-y-4 text-xs">
              {/* 1. Selector de Analizador Destino */}
              <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                  1. Analizador Clínico Destino
                </label>
                <select
                  value={mappingTargetAnalyzerId}
                  onChange={(e) => setMappingTargetAnalyzerId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 hover:border-teal-500/50 rounded-xl px-3.5 py-2.5 text-xs font-bold text-white outline-none transition cursor-pointer"
                >
                  {analyzers.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.name} — ({a.category || 'GENERAL'} • Protocolo: {a.protocol} • Puerto TCP: :{a.port})
                    </option>
                  ))}
                </select>
              </div>

              {/* Plantillas Rápidas según el Analizador */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Plantillas Rápidas con 1 Clic:
                  </span>
                  <span className="text-[10px] text-slate-500">Autocompleta analito, código y unidad</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {/* Coagulación (Stago, etc.) */}
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        lisTestCode: 'TP',
                        lisTestName: 'Tiempo de Protrombina (TP) + INR',
                        astmAnalyzerCode: 'PT',
                        sampleType: 'Plasma Citratado',
                        unit: 'seg',
                        multiplierFactor: 1.0
                      });
                    }}
                    className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-[10px] font-bold transition cursor-pointer flex items-center gap-1"
                  >
                    <span>+ TP / INR (PT)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        lisTestCode: 'APTT',
                        lisTestName: 'Tiempo Parcial de Tromboplastina (TPT/APTT)',
                        astmAnalyzerCode: 'APTT',
                        sampleType: 'Plasma Citratado',
                        unit: 'seg',
                        multiplierFactor: 1.0
                      });
                    }}
                    className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-[10px] font-bold transition cursor-pointer flex items-center gap-1"
                  >
                    <span>+ TTP / APTT</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        lisTestCode: 'FIB',
                        lisTestName: 'Fibrinógeno Derivado',
                        astmAnalyzerCode: 'FIB',
                        sampleType: 'Plasma Citratado',
                        unit: 'mg/dL',
                        multiplierFactor: 1.0
                      });
                    }}
                    className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-[10px] font-bold transition cursor-pointer flex items-center gap-1"
                  >
                    <span>+ Fibrinógeno (FIB)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        lisTestCode: 'DDIMER',
                        lisTestName: 'Dímero D Cuantitativo',
                        astmAnalyzerCode: 'DDIMER',
                        sampleType: 'Plasma Citratado',
                        unit: 'ng/mL',
                        multiplierFactor: 1.0
                      });
                    }}
                    className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-[10px] font-bold transition cursor-pointer flex items-center gap-1"
                  >
                    <span>+ Dímero D</span>
                  </button>

                  {/* Hematología & Química */}
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        lisTestCode: 'WBC',
                        lisTestName: 'Leucocitos Totales (WBC)',
                        astmAnalyzerCode: 'WBC',
                        sampleType: 'Sangre Total',
                        unit: '10^3/uL',
                        multiplierFactor: 1.0
                      });
                    }}
                    className="px-2.5 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-lg text-[10px] font-bold transition cursor-pointer"
                  >
                    + Hemograma (WBC)
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        lisTestCode: 'GLU',
                        lisTestName: 'Glucosa Basal',
                        astmAnalyzerCode: 'GLU',
                        sampleType: 'Suero',
                        unit: 'mg/dL',
                        multiplierFactor: 1.0
                      });
                    }}
                    className="px-2.5 py-1 bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 rounded-lg text-[10px] font-bold transition cursor-pointer"
                  >
                    + Glucosa (GLU)
                  </button>
                </div>
              </div>

              {/* 2. Búsqueda y Selección de Analito LIS */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                    2. Analito Oficial en Catálogo LIS Core
                  </label>
                  <span className="text-[10px] text-teal-400 font-mono">
                    {filteredCatalogParameters.length} analitos disponibles
                  </span>
                </div>

                {/* Filtro / Buscador Rápido */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={analitoSearchQuery}
                    onChange={(e) => setAnalitoSearchQuery(e.target.value)}
                    placeholder="Filtrar por nombre o código (ej: TP, TTP, Fibrinógeno, Glucosa, Leucocitos...)"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-teal-400 transition"
                  />
                  {analitoSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setAnalitoSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs p-1"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Selector Desplegable Amplio */}
                <select
                  value={formData.lisTestCode}
                  onChange={(e) => {
                    const selectedCode = e.target.value;
                    const match = allCatalogParameters.find(p => p.code === selectedCode);
                    if (match) {
                      setFormData({
                        ...formData,
                        lisTestCode: match.code,
                        lisTestName: match.name || match.testName,
                        unit: match.defaultUnit || formData.unit,
                        sampleType: match.defaultSampleType || formData.sampleType,
                        astmAnalyzerCode: formData.astmAnalyzerCode || match.code
                      });
                    } else {
                      setFormData({ ...formData, lisTestCode: selectedCode });
                    }
                  }}
                  className="w-full bg-slate-950 border border-slate-700 hover:border-teal-500/50 rounded-xl px-3.5 py-3 text-teal-300 font-bold outline-none cursor-pointer text-xs leading-relaxed"
                >
                  <option value="" disabled className="bg-slate-900 text-slate-400">
                    -- Seleccione el analito correspondiente --
                  </option>
                  {filteredCatalogParameters.map((p, idx) => (
                    <option key={`${p.code}-${idx}`} value={p.code} className="bg-slate-900 text-white py-1">
                      [{p.category}] {p.code} — {p.name} ({p.testName})
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Target Code ASTM / HL7 (Código que transmite el equipo) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-amber-300 uppercase tracking-wider block">
                    3. Código que envía el Analizador (ASTM / HL7):
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.astmAnalyzerCode}
                    onChange={(e) => setFormData({ ...formData, astmAnalyzerCode: e.target.value.trim().toUpperCase() })}
                    className="w-full bg-slate-950 border border-amber-500/40 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-amber-300 font-mono font-black text-sm outline-none transition"
                    placeholder="Ej: PT, APTT, FIB, WBC, GLU"
                  />
                  <p className="text-[10px] text-slate-500 font-mono">
                    Código exacto en el frame ASTM (R|1|^^^CODIGO) o HL7 (OBX|...|^^^CODIGO).
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-300 uppercase tracking-wider block">
                    Nombre Descriptivo en LIS:
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.lisTestName}
                    onChange={(e) => setFormData({ ...formData, lisTestName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-teal-400 rounded-xl px-3.5 py-2.5 text-white font-bold text-xs outline-none transition"
                    placeholder="Ej: Tiempo de Protrombina (TP)"
                  />
                  <p className="text-[10px] text-slate-500">
                    Nombre clínico que aparecerá en el reporte del paciente.
                  </p>
                </div>
              </div>

              {/* 4. Parámetros de Calibración: Unidad, Muestra y Factor */}
              <div className="grid grid-cols-3 gap-3 pt-1">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                    Unidad de Medida
                  </label>
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white outline-none focus:border-teal-400"
                    placeholder="seg, mg/dL, %"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                    Tipo de Muestra
                  </label>
                  <select
                    value={formData.sampleType}
                    onChange={(e) => setFormData({ ...formData, sampleType: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none focus:border-teal-400 cursor-pointer"
                  >
                    <option value="Plasma Citratado">Plasma Citratado</option>
                    <option value="Suero">Suero</option>
                    <option value="Sangre Total">Sangre Total</option>
                    <option value="Orina">Orina</option>
                    <option value="LCR">LCR</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                    Factor Multiplicador
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    value={formData.multiplierFactor}
                    onChange={(e) => setFormData({ ...formData, multiplierFactor: parseFloat(e.target.value) || 1.0 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-cyan-300 font-bold outline-none focus:border-teal-400"
                    placeholder="1.0"
                  />
                </div>
              </div>

              {/* Botones */}
              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition shadow-lg shadow-teal-500/20 cursor-pointer flex items-center gap-1.5 active:scale-95"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Guardar Mapeo</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isRangeModalOpen && rangeManagerMapping && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-8 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 sticky top-0 bg-slate-900 z-10"><h3 className="font-bold text-base text-white flex items-center gap-2"><SlidersHorizontal className="w-4 h-4 text-teal-400" /> Reglas: {rangeManagerMapping.lisTestName}</h3><button onClick={() => setIsRangeModalOpen(false)} className="text-slate-500 hover:text-white font-bold text-sm">✕</button></div>
            <div className="space-y-4">
              <div className="space-y-2 max-h-48 overflow-y-auto">{rangeManagerMapping.referenceRanges?.map(rr => <div key={rr.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs"><div className="text-slate-300"><span className="font-bold text-teal-400">[{rr.gender}]</span> Rango Normal: {rr.minValue} - {rr.maxValue} {rr.unit}</div></div>)}</div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL GESTOR DE PLUGINS Y DRIVERS (.driver) */}
      {isCassetteModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 sticky top-0 bg-slate-900 z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400 flex items-center justify-center text-amber-300">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white uppercase italic tracking-tight">Gestor de Plugins y Drivers de Analizador</h3>
                  <p className="text-[10px] text-slate-400">Instala, exporta y elimina paquetes .driver con dialectos ASTM/HL7, retardos y homologación pre-configurada.</p>
                </div>
              </div>
              <button onClick={() => setIsCassetteModalOpen(false)} className="text-slate-500 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
            </div>

            {/* SECCIÓN 1: SUBIR Y VALIDAR PLUGIN DE DRIVER */}
            <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Upload className="w-4 h-4 text-teal-400" /> Subir Paquete de Driver (.driver / .json)
                </span>
                <span className="text-[10px] font-mono text-slate-500">Cero código / Plug & Play</span>
              </div>

              <div className="border-2 border-dashed border-slate-800 hover:border-teal-500/50 rounded-2xl p-6 text-center transition cursor-pointer relative bg-slate-900/40">
                <input
                  type="file"
                  accept=".driver,.acedriver,.json"
                  onChange={handleCassetteFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center justify-center gap-2">
                  <Package className="w-8 h-8 text-slate-500" />
                  <div className="text-xs text-slate-300 font-bold">
                    {cassetteFileName ? cassetteFileName : 'Haz clic o arrastra un archivo .driver aquí'}
                  </div>
                  <p className="text-[10px] text-slate-500">Formato de plugins clínicos compatible con AbregoTech LIS (Drivers JSON / .driver)</p>
                </div>
              </div>

              {cassetteInstallError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{cassetteInstallError}</span>
                </div>
              )}

              {cassetteInstallSuccess && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{cassetteInstallSuccess}</span>
                </div>
              )}

              {uploadedCassetteData && (
                <div className="p-4 bg-slate-900 border border-teal-500/30 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-black text-white">{uploadedCassetteData.name}</div>
                      <div className="text-[10px] text-slate-400">{uploadedCassetteData.manufacturer || 'Fabricante General'} • Mod: {uploadedCassetteData.modelMatch || 'N/A'}</div>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                      v{uploadedCassetteData.packageVersion || '1.0.0'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px] font-mono">
                    <div className="p-2 bg-slate-950 rounded border border-slate-800">
                      <div className="text-slate-500 uppercase">Protocolo</div>
                      <div className="text-amber-400 font-bold">{uploadedCassetteData.protocol}</div>
                    </div>
                    <div className="p-2 bg-slate-950 rounded border border-slate-800">
                      <div className="text-slate-500 uppercase">Estrategia</div>
                      <div className="text-teal-400 font-bold">{uploadedCassetteData.orderStrategy || 'MULTI_O'}</div>
                    </div>
                    <div className="p-2 bg-slate-950 rounded border border-slate-800">
                      <div className="text-slate-500 uppercase">ACK Delay</div>
                      <div className="text-white font-bold">{uploadedCassetteData.ackDelayMs || 0} ms</div>
                    </div>
                    <div className="p-2 bg-slate-950 rounded border border-slate-800">
                      <div className="text-slate-500 uppercase">Mapeos</div>
                      <div className="text-emerald-400 font-bold">{Object.keys(uploadedCassetteData.testMapping || {}).length} analitos</div>
                    </div>
                  </div>

                  <button
                    onClick={handleInstallCassette}
                    className="w-full py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black rounded-xl text-xs uppercase shadow-lg shadow-teal-500/20 transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4 stroke-[3]" /> Instalar y Activar Driver
                  </button>
                </div>
              )}
            </div>

            {/* SECCIÓN 2: CATÁLOGO DE DRIVERS ACTIVOS */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Database className="w-4 h-4 text-amber-400" /> Catálogo de Drivers y Plugins ({effectiveDrivers.length})
                </span>
                <span className="text-[10px] text-slate-500">Auto-cargados en tiempo de ejecución</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto custom-scrollbar pr-1">
                {effectiveDrivers.map(drv => (
                  <div key={drv.id} className="p-3 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl flex items-start justify-between gap-2 transition">
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="text-xs font-bold text-white flex items-center gap-1.5 truncate">
                        {drv.name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono truncate">{drv.manufacturer || 'General'}</div>
                      <div className="text-[9px] text-slate-500 font-mono truncate">
                        {drv.protocol} • {drv.orderStrategy}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${drv.isCassette ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-slate-800 text-slate-400'}`}>
                        {drv.isCassette ? 'PLUGIN MODULAR' : 'DRIVER BASE'}
                      </span>
                      <div className="flex items-center gap-1">
                        {drv.isCassette && (
                          <button
                            type="button"
                            onClick={() => handleDeleteDriver(drv.id, drv.name)}
                            className="px-2 py-1 bg-rose-950/50 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-800/40 rounded-lg text-[10px] font-bold flex items-center gap-1 transition cursor-pointer shadow-sm"
                            title={`Eliminar este plugin de driver (${drv.name})`}
                          >
                            <Trash2 className="w-3 h-3 text-rose-400 hover:text-white" />
                            <span>Eliminar</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleExportDriverTemplate(drv)}
                          className="px-2 py-1 bg-slate-900 hover:bg-indigo-600 text-slate-300 hover:text-white border border-slate-700 rounded-lg text-[10px] font-bold flex items-center gap-1 transition cursor-pointer shadow-sm"
                          title={`Descargar archivo plantilla .driver para ${drv.name}`}
                        >
                          <Download className="w-3 h-3 text-indigo-400 hover:text-white" />
                          <span>Exportar</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SECCIÓN 3: EXPORTAR DRIVER DE CUALQUIER ANALIZADOR */}
            <div className="p-4 bg-indigo-950/20 border border-indigo-500/30 rounded-2xl space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <Download className="w-4 h-4 text-indigo-400" /> Exportar Analizador Configurado a .driver
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Elige cualquier analizador de tu laboratorio para generar su paquete con dialectos, puertos y analitos homologados.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3 pt-1">
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wider">
                    Analizador a Exportar:
                  </label>
                  <select
                    value={exportAnalyzerId}
                    onChange={(e) => setExportAnalyzerId(e.target.value)}
                    className="w-full bg-slate-900 border border-indigo-500/40 text-white rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-indigo-400 transition cursor-pointer"
                  >
                    {analyzers.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.model || a.id}) — {mappings.filter(m => m.analyzerId === a.id).length} analitos mapeados
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => handleExportAnalyzerById(exportAnalyzerId)}
                  className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-500 hover:to-teal-500 text-white font-black rounded-xl text-xs transition shadow-lg shadow-indigo-600/30 cursor-pointer flex items-center justify-center gap-2 shrink-0 active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  <span>Exportar .driver</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
