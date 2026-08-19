import { create } from 'zustand';
import { Analyzer, MiddlewareMessageLog, Order, TestResult, AnalyzerTestMapping, TestCatalogItem, User, Role } from '../types';
import { initialAnalyzers, mockTestCatalog, initialMappings, mockOrders, mockLogs, mockUsers } from '../data/mockData';

interface LISState {
  // Datos Globales
  analyzers: Analyzer[];
  logs: MiddlewareMessageLog[];
  orders: Order[];
  results: TestResult[];
  mappings: AnalyzerTestMapping[];
  testCatalog: TestCatalogItem[];
  
  // Autenticación (Simulada)
  currentUser: User | null;
  currentRole: Role | null;

  // Acciones (Mutators)
  setCurrentUser: (user: User | null, role: Role | null) => void;
  
  // Analizadores
  addAnalyzer: (analyzer: Analyzer) => void;
  updateAnalyzer: (analyzer: Analyzer) => void;
  deleteAnalyzer: (id: string) => void;

  // Mapeos (Homologación)
  addMapping: (mapping: AnalyzerTestMapping) => void;
  updateMapping: (mapping: AnalyzerTestMapping) => void;
  deleteMapping: (id: string) => void;
  resetDefaultMappings: () => void;

  // Middlewares & Resultados
  addMiddlewareLog: (log: MiddlewareMessageLog) => void;
  addTestResult: (result: TestResult) => void;
  simulateResultInjection: (log: MiddlewareMessageLog, result: TestResult) => void;
}

export const useLISStore = create<LISState>((set) => ({
  // Estado Inicial
  analyzers: initialAnalyzers,
  logs: mockLogs || [],
  orders: mockOrders || [],
  results: [],
  mappings: initialMappings || [],
  testCatalog: mockTestCatalog || [],
  currentUser: mockUsers ? mockUsers[0] : null,
  currentRole: mockUsers ? mockUsers[0].role : null,

  // Autenticación
  setCurrentUser: (user, role) => set({ currentUser: user, currentRole: role }),

  // Analizadores
  addAnalyzer: (analyzer) => set((state) => ({ analyzers: [...state.analyzers, analyzer] })),
  updateAnalyzer: (analyzer) => set((state) => ({ 
      analyzers: state.analyzers.map(a => a.id === analyzer.id ? analyzer : a) 
  })),
  deleteAnalyzer: (id) => set((state) => ({ 
      analyzers: state.analyzers.filter(a => a.id !== id) 
  })),

  // Mapeos
  addMapping: (mapping) => set((state) => ({ mappings: [...state.mappings, mapping] })),
  updateMapping: (mapping) => set((state) => ({ 
      mappings: state.mappings.map(m => m.id === mapping.id ? mapping : m) 
  })),
  deleteMapping: (id) => set((state) => ({ 
      mappings: state.mappings.filter(m => m.id !== id) 
  })),
  resetDefaultMappings: () => set({ mappings: initialMappings }),

  // Flujo de Resultados
  addMiddlewareLog: (log) => set((state) => ({ logs: [log, ...state.logs] })),
  addTestResult: (result) => set((state) => ({ results: [result, ...state.results] })),
  simulateResultInjection: (log, result) => set((state) => ({
      logs: [log, ...state.logs],
      results: [result, ...state.results]
  }))
}));
