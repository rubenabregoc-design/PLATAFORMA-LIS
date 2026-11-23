/**
 * Gestor Inteligente de Red y Conectividad Híbrida (Local LAN vs Cloud Supabase vs Offline)
 * Compatible universalmente con:
 * 1. APK Android (Tablets, móviles de doctores, flebotomistas y pacientes)
 * 2. Aplicación Web de Escritorio (Recepciones, Computadoras de Bioquímica y Hematología)
 */

import { useState, useEffect } from 'react';
import { testDatabaseConnections, DatabaseHealthStatus } from '../lib/supabaseClient';

export type ActiveBackendMode = 'LOCAL_LAN' | 'CLOUD_SUPABASE' | 'OFFLINE';
export type PhysicalConnectionType = 'WIFI' | 'CELLULAR' | 'ETHERNET' | 'UNKNOWN' | 'NONE';

export interface IntelligentNetworkState {
  activeMode: ActiveBackendMode;
  physicalType: PhysicalConnectionType;
  isOnline: boolean;
  latencyMs: number | null;
  statusLabel: string;
  statusDescription: string;
  isLocalAvailable: boolean;
  isCloudAvailable: boolean;
  lastChecked: Date;
}

type NetworkListener = (state: IntelligentNetworkState) => void;

class IntelligentNetworkManager {
  private static instance: IntelligentNetworkManager;
  private listeners: Set<NetworkListener> = new Set();

  private state: IntelligentNetworkState = {
    activeMode: 'LOCAL_LAN',
    physicalType: 'UNKNOWN',
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    latencyMs: null,
    statusLabel: 'Detectando red...',
    statusDescription: 'Comprobando conectividad con el servidor clínico...',
    isLocalAvailable: false,
    isCloudAvailable: false,
    lastChecked: new Date()
  };

  private checkIntervalId: any = null;
  private isChecking: boolean = false;

  private constructor() {
    if (typeof window !== 'undefined') {
      this.updatePhysicalType();

      window.addEventListener('online', () => {
        this.updatePhysicalType();
        this.runHealthCheck();
      });

      window.addEventListener('offline', () => {
        this.state.isOnline = false;
        this.state.activeMode = 'OFFLINE';
        this.state.statusLabel = 'Modo Fuera de Línea';
        this.state.statusDescription = 'Sin conexión de red. Los datos se guardan en el dispositivo.';
        this.notify();
      });

      // Escuchar cambios de interfaz en Android / Chrome
      const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      if (conn) {
        conn.addEventListener('change', () => {
          this.updatePhysicalType();
          this.runHealthCheck();
        });
      }

      // Verificación inicial diferida (100ms) para no bloquear render
      setTimeout(() => this.runHealthCheck(), 100);

      // Verificación periódica cada 15 segundos
      this.checkIntervalId = setInterval(() => this.runHealthCheck(), 15000);
    }
  }

  public static getInstance(): IntelligentNetworkManager {
    if (!IntelligentNetworkManager.instance) {
      IntelligentNetworkManager.instance = new IntelligentNetworkManager();
    }
    return IntelligentNetworkManager.instance;
  }

  private updatePhysicalType() {
    if (typeof navigator === 'undefined' || !navigator.onLine) {
      this.state.physicalType = 'NONE';
      this.state.isOnline = false;
      this.state.activeMode = 'OFFLINE';
      return;
    }

    const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    if (conn) {
      const type = conn.type;
      if (type === 'wifi') this.state.physicalType = 'WIFI';
      else if (type === 'cellular') this.state.physicalType = 'CELLULAR';
      else if (type === 'ethernet') this.state.physicalType = 'ETHERNET';
      else this.state.physicalType = 'UNKNOWN';
    } else {
      this.state.physicalType = 'UNKNOWN';
    }
  }

  public async runHealthCheck(): Promise<IntelligentNetworkState> {
    if (this.isChecking) return this.state;
    this.isChecking = true;

    try {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        this.state = {
          ...this.state,
          activeMode: 'OFFLINE',
          isOnline: false,
          latencyMs: null,
          statusLabel: 'Modo Fuera de Línea',
          statusDescription: 'Dispositivo sin conexión. Operando con caché local.',
          isLocalAvailable: false,
          isCloudAvailable: false,
          lastChecked: new Date()
        };
        this.notify();
        return this.state;
      }

      const health: DatabaseHealthStatus = await testDatabaseConnections();

      let activeMode: ActiveBackendMode = 'OFFLINE';
      let latencyMs: number | null = null;
      let statusLabel = '';
      let statusDescription = '';

      if (health.local) {
        activeMode = 'LOCAL_LAN';
        latencyMs = health.latencyLocalMs;
        statusLabel = 'Red Local (Clínica • LAN)';
        statusDescription = `Conectado al servidor del laboratorio (${latencyMs ?? 5}ms). Máxima velocidad y privacidad.`;
      } else if (health.cloud) {
        activeMode = 'CLOUD_SUPABASE';
        latencyMs = health.latencyCloudMs;
        statusLabel = 'Conectado a la Nube (Supabase)';
        statusDescription = `Acceso remoto vía Internet / Datos (${latencyMs ?? 60}ms). Sincronización en la nube.`;
      } else {
        activeMode = 'OFFLINE';
        statusLabel = 'Modo Autónomo Local';
        statusDescription = 'Servidores no detectados. Guardando en memoria local (IndexedDB).';
      }

      this.state = {
        activeMode,
        physicalType: this.state.physicalType,
        isOnline: activeMode !== 'OFFLINE',
        latencyMs,
        statusLabel,
        statusDescription,
        isLocalAvailable: health.local,
        isCloudAvailable: health.cloud,
        lastChecked: new Date()
      };

      this.notify();
      return this.state;
    } catch {
      return this.state;
    } finally {
      this.isChecking = false;
    }
  }

  public getState(): IntelligentNetworkState {
    return this.state;
  }

  public subscribe(listener: NetworkListener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(fn => {
      try {
        fn(this.state);
      } catch (e) {
        console.error('[IntelligentNetworkManager] Error en listener:', e);
      }
    });
  }
}

export const intelligentNetworkManager = IntelligentNetworkManager.getInstance();

/**
 * Hook de React para usar el estado de red inteligente en cualquier componente
 */
export function useIntelligentNetwork(): IntelligentNetworkState {
  const [state, setState] = useState<IntelligentNetworkState>(() => intelligentNetworkManager.getState());

  useEffect(() => {
    return intelligentNetworkManager.subscribe((newState) => {
      setState(newState);
    });
  }, []);

  return state;
}
