/**
 * AbregoTech LIS — Modular Analyzer Driver Registry & Cassette Package Engine
 * 
 * Manages instrument-specific protocol dialects, timing profiles,
 * inbound parsing rules, outbound order formatting strategies,
 * and hot-pluggable Driver Cassettes (.acedriver / .json).
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { sysmexXnDriver } from './sysmex-xn.js';
import { rocheCobasDriver } from './roche-cobas.js';
import { mindrayBcDriver } from './mindray-bc.js';
import { stagoStaDriver } from './stago-sta.js';
import { orthoVitrosDriver } from './ortho-vitros.js';
import { abbottAlinityDriver } from './abbott-alinity.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directory for user-uploaded Cassettes (.acedriver / .json)
export const CASSETTES_DIR = path.join(__dirname, 'cassettes');
if (!fs.existsSync(CASSETTES_DIR)) {
  fs.mkdirSync(CASSETTES_DIR, { recursive: true });
}

// Built-in Core Drivers
const BUILT_IN_DRIVERS = new Map([
  ['sysmex-xn', sysmexXnDriver],
  ['roche-cobas', rocheCobasDriver],
  ['mindray-bc', mindrayBcDriver],
  ['stago-sta', stagoStaDriver],
  ['ortho-vitros', orthoVitrosDriver],
  ['abbott-alinity', abbottAlinityDriver]
]);

// Dynamic Cassettes Cache
const CASSETTES = new Map();

export function loadCassettes() {
  try {
    if (!fs.existsSync(CASSETTES_DIR)) return;
    const files = fs.readdirSync(CASSETTES_DIR);
    for (const file of files) {
      if (file.endsWith('.json') || file.endsWith('.acedriver')) {
        try {
          const filePath = path.join(CASSETTES_DIR, file);
          const content = fs.readFileSync(filePath, 'utf8');
          const cassette = JSON.parse(content);
          const id = cassette.id || cassette.cassetteId || path.basename(file, path.extname(file));
          CASSETTES.set(id, {
            ...cassette,
            id,
            isCassette: true,
            filePath
          });
        } catch (e) {
          console.error(`[CASSETTE] Error cargando cassette ${file}:`, e.message);
        }
      }
    }
  } catch (err) {
    console.error(`[CASSETTE] Error leyendo directorio de cassettes:`, err.message);
  }
}

// Initial load of installed cassettes
loadCassettes();

/**
 * Saves and installs a new Analyzer Driver Cassette (.acedriver)
 */
export function saveDriverCassette(cassetteData) {
  if (!cassetteData || !cassetteData.name) {
    throw new Error('El cassette debe tener al menos un nombre');
  }

  const cassetteId = (cassetteData.id || cassetteData.cassetteId || cassetteData.name.toLowerCase().replace(/[^a-z0-9]/g, '-')).trim();
  const normalized = {
    packageVersion: cassetteData.packageVersion || '1.0.0',
    id: cassetteId,
    name: cassetteData.name,
    modelMatch: cassetteData.modelMatch || cassetteData.name,
    manufacturer: cassetteData.manufacturer || 'Generico',
    category: cassetteData.category || 'QUIMICA',
    protocol: cassetteData.protocol || 'ASTM_E1381',
    defaultPort: Number(cassetteData.defaultPort || cassetteData.transport?.defaultPort) || 5100,
    ackDelayMs: Number(cassetteData.ackDelayMs || cassetteData.transport?.ackDelayMs) || 0,
    orderStrategy: cassetteData.orderStrategy || cassetteData.orderProfile?.orderStrategy || 'MULTI_O_RECORDS',
    testPrefix: cassetteData.testPrefix !== undefined ? cassetteData.testPrefix : (cassetteData.orderProfile?.testPrefix || '^^^'),
    barcodePrefix: cassetteData.barcodePrefix || cassetteData.orderProfile?.barcodePrefix || '',
    repeatDelimiter: cassetteData.repeatDelimiter || cassetteData.orderProfile?.repeatDelimiter || '\\',
    profileCode: cassetteData.profileCode || 'ALL',
    testMapping: cassetteData.testMapping || {},
    flagMapping: cassetteData.flagMapping || {},
    installedAt: new Date().toISOString(),
    isCassette: true
  };

  const targetPath = path.join(CASSETTES_DIR, `${cassetteId}.acedriver`);
  fs.writeFileSync(targetPath, JSON.stringify(normalized, null, 2), 'utf8');
  CASSETTES.set(cassetteId, { ...normalized, filePath: targetPath });
  console.log(`[CASSETTE] ✓ Nuevo Cassette de Analizador instalado: ${normalized.name} (${targetPath})`);
  return normalized;
}

/**
 * Resolves a driver configuration for a given analyzer.
 * Checks installed cassettes first, then built-in drivers, and falls back to generic.
 */
export function getAnalyzerDriver(analyzerConfig) {
  const driverId = analyzerConfig.driverId || analyzerConfig.id || '';
  const searchName = (analyzerConfig.name || '').toLowerCase();

  // 1. Check in Installed Cassettes
  for (const [key, cassette] of CASSETTES) {
    if (
      driverId.toLowerCase() === key.toLowerCase() ||
      driverId.toLowerCase().includes(key.toLowerCase()) ||
      searchName.includes((cassette.modelMatch || key).toLowerCase())
    ) {
      return { ...cassette, ...analyzerConfig };
    }
  }

  // 2. Check in Built-in Drivers
  for (const [key, driver] of BUILT_IN_DRIVERS) {
    if (
      driverId.toLowerCase().includes(key) ||
      searchName.includes(driver.modelMatch.toLowerCase())
    ) {
      return { ...driver, ...analyzerConfig };
    }
  }

  // 3. Generic Fallback Driver
  return {
    id: analyzerConfig.id || 'generic-driver',
    name: analyzerConfig.name || 'Generic Analyzer',
    protocol: analyzerConfig.protocol || 'ASTM_E1381',
    ackDelayMs: analyzerConfig.ackDelayMs || 0,
    orderStrategy: analyzerConfig.orderStrategy || 'MULTI_O_RECORDS',
    repeatDelimiter: analyzerConfig.repeatDelimiter || '\\',
    testPrefix: analyzerConfig.testPrefix !== undefined ? analyzerConfig.testPrefix : '^^^',
    barcodePrefix: analyzerConfig.barcodePrefix || '',
    testMapping: analyzerConfig.testMapping || {},
    ...analyzerConfig
  };
}

/**
 * Lists all available drivers (both built-in and user-installed cassettes)
 */
export function listAvailableDrivers() {
  const result = [];

  // Add built-ins
  for (const d of BUILT_IN_DRIVERS.values()) {
    result.push({
      id: d.id,
      name: d.name,
      manufacturer: d.manufacturer,
      protocol: d.protocol,
      orderStrategy: d.orderStrategy,
      category: d.category,
      isCassette: false
    });
  }

  // Add installed cassettes
  for (const c of CASSETTES.values()) {
    result.push({
      id: c.id,
      name: c.name,
      manufacturer: c.manufacturer,
      protocol: c.protocol,
      orderStrategy: c.orderStrategy,
      category: c.category,
      isCassette: true,
      packageVersion: c.packageVersion
    });
  }

  return result;
}
