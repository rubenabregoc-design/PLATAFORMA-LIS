import React from 'react';
import { TestResult } from '../types';

interface AnalyzerGraphicsProps {
  results: TestResult[];
  compact?: boolean;
}

export const AnalyzerGraphics: React.FC<AnalyzerGraphicsProps> = ({ results }) => {
  // Extract hematological parameters from current results
  const findValue = (keywords: string[], fallback: number): number => {
    for (const kw of keywords) {
      const match = results.find(r => 
        (r.parameterName || '').toLowerCase().includes(kw) || 
        (r.parameterCode || '').toLowerCase().includes(kw)
      );
      if (match) {
        const parsed = parseFloat(String(match.value).replace(/,/g, '.').replace(/[^0-9.]/g, ''));
        if (!isNaN(parsed) && parsed > 0) return parsed;
      }
    }
    return fallback;
  };

  const wbc = findValue(['leucocito', 'wbc'], 7.2);
  const vcm = findValue(['vcm', 'mcv'], 88.0);
  const rdw = findValue(['rdw', 'ade'], 13.2);
  const plt = findValue(['plaqueta', 'plt'], 240);
  const vpm = findValue(['vpm', 'mpv'], 9.6);

  // Generate deterministic points for WBC Scattergram (Fluorescence Cytometry WDF)
  // Scaled for compact viewBox="0 0 170 85"
  const generateWbcPoints = () => {
    const points: Array<{ x: number; y: number; color: string; r: number }> = [];
    
    let seed = Math.round(wbc * 100 + plt);
    const rng = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    // Neutrophils (Amber / Gold: mid-high SSC 85-135, mid SFL 25-55)
    const neutroCount = Math.min(100, Math.max(40, Math.round(wbc * 8)));
    for (let i = 0; i < neutroCount; i++) {
      const u1 = rng();
      const u2 = rng();
      const z0 = Math.sqrt(-2.0 * Math.log(u1 || 0.01)) * Math.cos(2.0 * Math.PI * u2);
      const z1 = Math.sqrt(-2.0 * Math.log(u1 || 0.01)) * Math.sin(2.0 * Math.PI * u2);
      const x = 108 + z0 * 12;
      const y = 42 + z1 * 9;
      if (x >= 70 && x <= 150 && y >= 18 && y <= 65) {
        points.push({ x, y, color: '#d97706', r: 1.2 });
      }
    }

    // Lymphocytes (Blue: low SSC 25-55, low-mid SFL 22-48)
    const lymphCount = Math.min(65, Math.max(28, Math.round(wbc * 4.5)));
    for (let i = 0; i < lymphCount; i++) {
      const u1 = rng();
      const u2 = rng();
      const z0 = Math.sqrt(-2.0 * Math.log(u1 || 0.01)) * Math.cos(2.0 * Math.PI * u2);
      const z1 = Math.sqrt(-2.0 * Math.log(u1 || 0.01)) * Math.sin(2.0 * Math.PI * u2);
      const x = 42 + z0 * 8;
      const y = 34 + z1 * 7;
      if (x >= 18 && x <= 68 && y >= 14 && y <= 56) {
        points.push({ x, y, color: '#2563eb', r: 1.1 });
      }
    }

    // Monocytes (Green: mid SSC 55-80, high SFL 46-68)
    const monoCount = Math.min(32, Math.max(12, Math.round(wbc * 1.8)));
    for (let i = 0; i < monoCount; i++) {
      const u1 = rng();
      const u2 = rng();
      const z0 = Math.sqrt(-2.0 * Math.log(u1 || 0.01)) * Math.cos(2.0 * Math.PI * u2);
      const z1 = Math.sqrt(-2.0 * Math.log(u1 || 0.01)) * Math.sin(2.0 * Math.PI * u2);
      const x = 66 + z0 * 7;
      const y = 56 + z1 * 6;
      if (x >= 48 && x <= 88 && y >= 40 && y <= 72) {
        points.push({ x, y, color: '#059669', r: 1.2 });
      }
    }

    // Eosinophils (Red/Magenta: very high SSC 125-155, mid-low SFL 28-48)
    const eCount = Math.min(22, Math.max(8, Math.round(wbc * 1.1)));
    for (let i = 0; i < eCount; i++) {
      const u1 = rng();
      const u2 = rng();
      const z0 = Math.sqrt(-2.0 * Math.log(u1 || 0.01)) * Math.cos(2.0 * Math.PI * u2);
      const z1 = Math.sqrt(-2.0 * Math.log(u1 || 0.01)) * Math.sin(2.0 * Math.PI * u2);
      const x = 136 + z0 * 8;
      const y = 36 + z1 * 6;
      if (x >= 115 && x <= 162 && y >= 20 && y <= 55) {
        points.push({ x, y, color: '#dc2626', r: 1.2 });
      }
    }

    // Basophils & Ghosts (Purple: low SSC 20-35, low SFL 10-22)
    for (let i = 0; i < 12; i++) {
      const x = 26 + (rng() - 0.5) * 10;
      const y = 16 + (rng() - 0.5) * 8;
      points.push({ x, y, color: '#7c3aed', r: 1.0 });
    }

    return points;
  };

  const wbcPoints = generateWbcPoints();

  // RBC Histogram curve generator (25 fL to 250 fL) in viewBox 170x85
  const generateRbcPath = () => {
    const peakX = 15 + ((Math.min(130, Math.max(60, vcm)) - 25) / 225) * 145;
    const sigma = Math.max(9, rdw * 0.9);

    let d = `M 15 68 `;
    for (let x = 15; x <= 160; x += 3) {
      const fl = 25 + ((x - 15) / 145) * 225;
      const diff = fl - vcm;
      const height = 48 * Math.exp(-0.5 * Math.pow(diff / sigma, 2));
      const y = 68 - height;
      d += `L ${x.toFixed(1)} ${y.toFixed(1)} `;
    }
    d += `L 160 68 Z`;
    return { path: d, peakX };
  };

  // PLT Histogram curve generator (2 fL to 30 fL) in viewBox 170x85
  const generatePltPath = () => {
    const peakX = 15 + ((Math.min(15, Math.max(6, vpm)) - 2) / 28) * 145;
    let d = `M 15 68 `;
    for (let x = 15; x <= 160; x += 3) {
      const fl = 2 + ((x - 15) / 145) * 28;
      let height = 0;
      if (fl > 2) {
        const logVal = Math.log(fl / (vpm * 0.9));
        height = 46 * Math.exp(-0.5 * Math.pow(logVal / 0.42, 2));
      }
      const y = Math.max(16, 68 - height);
      d += `L ${x.toFixed(1)} ${y.toFixed(1)} `;
    }
    d += `L 160 68 Z`;
    return { path: d, peakX };
  };

  const rbcData = generateRbcPath();
  const pltData = generatePltPath();

  return (
    <div className="analyzer-graphics-block avoid-break break-inside-avoid page-break-inside-avoid mt-2 pt-2 border-t border-slate-200">
      {/* Header Compacto de Instrumentación */}
      <div className="flex items-center justify-between mb-1.5 pb-0.5 border-b border-slate-200">
        <div className="flex items-center space-x-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-600 inline-block"></span>
          <span className="font-mono text-[9px] font-black uppercase tracking-wider text-teal-950">
            CITOMETRÍA LÁSER & HISTOGRAMAS (SYSMEX XN / MINDRAY BC)
          </span>
        </div>
        <span className="text-[8px] font-mono text-slate-500 font-semibold">
          633nm • Enfoque Hidrodinámico
        </span>
      </div>

      {/* Grid Compacto de 3 Gráficas */}
      <div className="grid grid-cols-3 gap-2">
        {/* 1. WBC DIFF Scattergram */}
        <div className="bg-white rounded-lg border border-slate-200 p-1.5 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[9px] font-bold text-slate-800 tracking-tight block">
              1. Dispersograma WBC
            </span>
            <span className="text-[8px] font-mono font-bold text-amber-700 bg-amber-50 px-1 rounded">
              {wbc.toFixed(1)} k/µL
            </span>
          </div>

          <div className="relative bg-slate-950 rounded p-0.5 overflow-hidden border border-slate-800">
            <svg viewBox="0 0 170 85" className="w-full h-auto max-h-[75px]">
              {/* Ejes y grilla láser */}
              <line x1="15" y1="72" x2="160" y2="72" stroke="#334155" strokeWidth="0.8" />
              <line x1="15" y1="8" x2="15" y2="72" stroke="#334155" strokeWidth="0.8" />
              <line x1="15" y1="40" x2="160" y2="40" stroke="#1e293b" strokeDasharray="2,2" strokeWidth="0.6" />
              <line x1="88" y1="8" x2="88" y2="72" stroke="#1e293b" strokeDasharray="2,2" strokeWidth="0.6" />

              <text x="88" y="81" fill="#94a3b8" fontSize="5.5" textAnchor="middle" fontFamily="monospace">
                SSC (Granularidad) ➔
              </text>
              <text x="6" y="40" fill="#94a3b8" fontSize="5.5" textAnchor="middle" transform="rotate(-90 6 40)" fontFamily="monospace">
                SFL ➔
              </text>

              {/* Puntos */}
              {wbcPoints.map((pt, idx) => (
                <circle
                  key={idx}
                  cx={pt.x}
                  cy={78 - pt.y}
                  r={pt.r}
                  fill={pt.color}
                  opacity="0.85"
                />
              ))}

              <text x="42" y="44" fill="#93c5fd" fontSize="5.5" fontWeight="bold">Linf</text>
              <text x="64" y="20" fill="#6ee7b7" fontSize="5.5" fontWeight="bold">Mono</text>
              <text x="108" y="36" fill="#fcd34d" fontSize="5.5" fontWeight="bold">Neut</text>
              <text x="136" y="44" fill="#fca5a5" fontSize="5.5" fontWeight="bold">Eos</text>
            </svg>
          </div>

          <div className="flex items-center justify-between text-[7px] font-bold text-slate-500 mt-1 px-0.5">
            <span className="flex items-center gap-0.5"><span className="w-1 h-1 rounded-full bg-blue-600"></span>Linf</span>
            <span className="flex items-center gap-0.5"><span className="w-1 h-1 rounded-full bg-emerald-600"></span>Mono</span>
            <span className="flex items-center gap-0.5"><span className="w-1 h-1 rounded-full bg-amber-500"></span>Neut</span>
            <span className="flex items-center gap-0.5"><span className="w-1 h-1 rounded-full bg-rose-600"></span>Eos</span>
          </div>
        </div>

        {/* 2. Histograma RBC */}
        <div className="bg-white rounded-lg border border-slate-200 p-1.5 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[9px] font-bold text-slate-800 tracking-tight block">
              2. Histograma RBC
            </span>
            <span className="text-[8px] font-mono font-bold text-teal-700 bg-teal-50 px-1 rounded">
              VCM {vcm.toFixed(1)} fL
            </span>
          </div>

          <div className="relative bg-slate-50 rounded p-0.5 overflow-hidden border border-slate-200">
            <svg viewBox="0 0 170 85" className="w-full h-auto max-h-[75px]">
              <line x1="15" y1="68" x2="160" y2="68" stroke="#94a3b8" strokeWidth="0.8" />
              <line x1="15" y1="8" x2="15" y2="68" stroke="#94a3b8" strokeWidth="0.8" />

              {/* Rango normal 80-100 fL */}
              <rect x="50.4" y="14" width="12.9" height="54" fill="#14b8a6" fillOpacity="0.08" />
              <line x1="50.4" y1="14" x2="50.4" y2="68" stroke="#0d9488" strokeDasharray="1.5,1.5" strokeWidth="0.6" />
              <line x1="63.3" y1="14" x2="63.3" y2="68" stroke="#0d9488" strokeDasharray="1.5,1.5" strokeWidth="0.6" />

              <path d={rbcData.path} fill="url(#rbcGradMini)" stroke="#0f766e" strokeWidth="1.4" />
              <defs>
                <linearGradient id="rbcGradMini" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#14b8a6" stopOpacity="0.05" />
                </linearGradient>
              </defs>

              <line
                x1={rbcData.peakX}
                y1="16"
                x2={rbcData.peakX}
                y2="68"
                stroke="#0f172a"
                strokeWidth="0.9"
                strokeDasharray="1.5,1"
              />
              <circle cx={rbcData.peakX} cy="16" r="1.8" fill="#0f172a" />

              <text x="15" y="76" fill="#64748b" fontSize="5.5" textAnchor="middle" fontFamily="monospace">25</text>
              <text x="50" y="76" fill="#64748b" fontSize="5.5" textAnchor="middle" fontFamily="monospace">80</text>
              <text x="64" y="76" fill="#64748b" fontSize="5.5" textAnchor="middle" fontFamily="monospace">100</text>
              <text x="128" y="76" fill="#64748b" fontSize="5.5" textAnchor="middle" fontFamily="monospace">200</text>
              <text x="160" y="76" fill="#64748b" fontSize="5.5" textAnchor="middle" fontFamily="monospace">250</text>
              <text x="88" y="83" fill="#475569" fontSize="5.5" textAnchor="middle" fontFamily="monospace">
                Volumen Eritrocítico (fL) ➔
              </text>
            </svg>
          </div>

          <div className="flex items-center justify-between text-[7.5px] text-slate-500 font-mono mt-1 px-0.5">
            <span>LD: 25</span>
            <span className="text-teal-800 font-bold">RDW: {rdw.toFixed(1)}%</span>
            <span>UD: 250</span>
          </div>
        </div>

        {/* 3. Histograma PLT */}
        <div className="bg-white rounded-lg border border-slate-200 p-1.5 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[9px] font-bold text-slate-800 tracking-tight block">
              3. Histograma PLT
            </span>
            <span className="text-[8px] font-mono font-bold text-indigo-700 bg-indigo-50 px-1 rounded">
              VPM {vpm.toFixed(1)} fL
            </span>
          </div>

          <div className="relative bg-slate-50 rounded p-0.5 overflow-hidden border border-slate-200">
            <svg viewBox="0 0 170 85" className="w-full h-auto max-h-[75px]">
              <line x1="15" y1="68" x2="160" y2="68" stroke="#94a3b8" strokeWidth="0.8" />
              <line x1="15" y1="8" x2="15" y2="68" stroke="#94a3b8" strokeWidth="0.8" />

              {/* Rango normal 7.5 - 11.5 fL */}
              <rect x="43.5" y="14" width="20.7" height="54" fill="#6366f1" fillOpacity="0.08" />
              <line x1="43.5" y1="14" x2="43.5" y2="68" stroke="#4f46e5" strokeDasharray="1.5,1.5" strokeWidth="0.6" />
              <line x1="64.2" y1="14" x2="64.2" y2="68" stroke="#4f46e5" strokeDasharray="1.5,1.5" strokeWidth="0.6" />

              <path d={pltData.path} fill="url(#pltGradMini)" stroke="#4338ca" strokeWidth="1.4" />
              <defs>
                <linearGradient id="pltGradMini" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0.05" />
                </linearGradient>
              </defs>

              <line
                x1={pltData.peakX}
                y1="16"
                x2={pltData.peakX}
                y2="68"
                stroke="#0f172a"
                strokeWidth="0.9"
                strokeDasharray="1.5,1"
              />
              <circle cx={pltData.peakX} cy="16" r="1.8" fill="#0f172a" />

              <text x="15" y="76" fill="#64748b" fontSize="5.5" textAnchor="middle" fontFamily="monospace">2</text>
              <text x="56" y="76" fill="#64748b" fontSize="5.5" textAnchor="middle" fontFamily="monospace">10</text>
              <text x="108" y="76" fill="#64748b" fontSize="5.5" textAnchor="middle" fontFamily="monospace">20</text>
              <text x="160" y="76" fill="#64748b" fontSize="5.5" textAnchor="middle" fontFamily="monospace">30</text>
              <text x="88" y="83" fill="#475569" fontSize="5.5" textAnchor="middle" fontFamily="monospace">
                Volumen Plaquetario (fL) ➔
              </text>
            </svg>
          </div>

          <div className="flex items-center justify-between text-[7.5px] text-slate-500 font-mono mt-1 px-0.5">
            <span>LD: 2</span>
            <span className="text-indigo-800 font-bold">PLT: {Math.round(plt)} k</span>
            <span>UD: 25-30</span>
          </div>
        </div>
      </div>
    </div>
  );
};
