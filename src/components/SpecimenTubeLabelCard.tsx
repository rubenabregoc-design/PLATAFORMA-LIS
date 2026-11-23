import React from 'react';
import { User, Contact, Calendar, Droplets, Syringe, Building2, CalendarDays } from 'lucide-react';
import { SpecimenTubeLabel } from '../utils/printerService';
import { generateCode128Svg } from '../utils/code128';

interface SpecimenTubeLabelCardProps {
  label: SpecimenTubeLabel;
  tubeIndex?: number;
  totalTubes?: number;
  onViewZpl?: (label: SpecimenTubeLabel) => void;
  onPrintSingle?: (label: SpecimenTubeLabel) => void;
  compact?: boolean;
}

/**
 * Deduce standard clinical laboratory section based on tube type or tests.
 */
function getClinicalArea(label: SpecimenTubeLabel): string {
  const tube = (label.tubeType || '').toUpperCase();
  const tests = (label.testsList || []).join(' ').toUpperCase();

  if (tube.includes('LAVENDER') || tube.includes('EDTA') || tests.includes('HEMO') || tests.includes('CBC') || tests.includes('VSG') || tests.includes('FALCEM')) {
    return 'HEMATOLOGÍA';
  }
  if (tube.includes('BLUE') || tube.includes('CITRATE') || tests.includes('PT') || tests.includes('PTT') || tests.includes('FIBRIN')) {
    return 'COAGULACIÓN';
  }
  if (tube.includes('GOLD') || tube.includes('SST') || tube.includes('RED') || tube.includes('SUERO') || tests.includes('GLU') || tests.includes('CREAT') || tests.includes('LIPID')) {
    return 'QUÍMICA CLÍNICA';
  }
  if (tube.includes('GREEN') || tube.includes('HEPARIN')) {
    return 'GASES / ELECTROLITOS';
  }
  if (tube.includes('GRAY') || tube.includes('FLUORIDE')) {
    return 'METABOLISMO';
  }
  if (tube.includes('URINE') || tests.includes('ORINA')) {
    return 'URIANÁLISIS';
  }
  if (tube.includes('STOOL') || tests.includes('HECES')) {
    return 'COPROLOGÍA';
  }
  return 'LABORATORIO CLÍNICO';
}

/**
 * Maps tube types to the high-contrast banner gradient & background.
 */
function getTubeBannerStyle(label: SpecimenTubeLabel): { background: string; textColor: string } {
  const tube = (label.tubeType || '').toUpperCase();
  const hex = label.tubeColorHex || '#8b5cf6';

  if (tube.includes('LAVENDER') || tube.includes('EDTA') || hex.includes('8b5cf6') || hex.includes('a855f7')) {
    return {
      background: 'linear-gradient(90deg, #4c1d95 0%, #6d28d9 50%, #581c87 100%)',
      textColor: '#ffffff'
    };
  }
  if (tube.includes('BLUE') || tube.includes('CITRATE') || hex.includes('38bdf8') || hex.includes('0284c7')) {
    return {
      background: 'linear-gradient(90deg, #0369a1 0%, #0284c7 50%, #075985 100%)',
      textColor: '#ffffff'
    };
  }
  if (tube.includes('GOLD') || tube.includes('SST') || tube.includes('SUERO') || hex.includes('eab308') || hex.includes('f59e0b')) {
    return {
      background: 'linear-gradient(90deg, #92400e 0%, #b45309 50%, #78350f 100%)',
      textColor: '#ffffff'
    };
  }
  if (tube.includes('GREEN') || tube.includes('HEPARIN') || hex.includes('10b981')) {
    return {
      background: 'linear-gradient(90deg, #065f46 0%, #047857 50%, #064e3b 100%)',
      textColor: '#ffffff'
    };
  }
  if (tube.includes('GRAY') || tube.includes('FLUORIDE') || hex.includes('94a3b8')) {
    return {
      background: 'linear-gradient(90deg, #334155 0%, #475569 50%, #1e293b 100%)',
      textColor: '#ffffff'
    };
  }
  if (tube.includes('URINE') || hex.includes('f97316')) {
    return {
      background: 'linear-gradient(90deg, #c2410c 0%, #ea580c 50%, #9a3412 100%)',
      textColor: '#ffffff'
    };
  }
  if (tube.includes('STOOL') || hex.includes('84cc16')) {
    return {
      background: 'linear-gradient(90deg, #3f6212 0%, #4d7c0f 50%, #365314 100%)',
      textColor: '#ffffff'
    };
  }

  return {
    background: hex,
    textColor: '#ffffff'
  };
}

/**
 * Format timestamp into DD/MM/YYYY HH:MM AM/PM
 */
function formatCollectionTime(timestamp?: string): string {
  try {
    const d = timestamp ? new Date(timestamp) : new Date();
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    const strHours = String(hours).padStart(2, '0');
    return `${day}/${month}/${year} ${strHours}:${minutes} ${ampm}`;
  } catch {
    return '09/11/2026 10:24 AM';
  }
}

export const SpecimenTubeLabelCard: React.FC<SpecimenTubeLabelCardProps> = ({
  label,
  tubeIndex,
  onViewZpl,
  onPrintSingle,
  compact = false
}) => {
  const barcodeValue = label.sampleBarcode || label.orderNumber || '2026111657725.1';
  const bannerStyle = getTubeBannerStyle(label);
  const clinicalArea = getClinicalArea(label);
  const formattedDate = formatCollectionTime(label.collectionTimestamp);
  const branchName = (label.branchName && label.branchName.trim().length > 0)
    ? label.branchName.toUpperCase()
    : 'LABORATORIO CLÍNICO SAN FERNANDO';

  // Generate authentic Code 128 SVG barcode
  const { svgPath, totalWidth, totalHeight } = generateCode128Svg(barcodeValue, 46, 1.6);

  const testsSummary = label.testsList && label.testsList.length > 0
    ? label.testsList.join(', ')
    : 'RUTINA GENERAL';

  return (
    <div className="flex flex-col space-y-2 w-full max-w-md mx-auto group">
      {/* Outer Label Container: Pure White, Rounded [1.75rem], Crisp 3px Blue Border */}
      <div
        className="bg-white rounded-[1.75rem] border-[3px] border-[#0284c7] shadow-xl overflow-hidden relative select-none font-sans text-slate-900 transition-all hover:shadow-2xl"
        style={{
          boxShadow: '0 10px 25px -5px rgba(2, 132, 199, 0.2), 0 8px 10px -6px rgba(2, 132, 199, 0.15)'
        }}
      >
        {/* 1. TOP HEADER: PURE WHITE BACKGROUND */}
        <div className="bg-white px-3.5 pt-3 pb-2 flex items-center justify-between">
          {/* Left: Brand Logo & Title in Deep Navy */}
          <div className="flex items-center space-x-2.5">
            {/* Medical Logo Icon with Gradient & Head dot */}
            <svg className="w-9 h-9 shrink-0" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Head Circle */}
              <circle cx="50" cy="18" r="11" fill="#10b981" />
              {/* Stylized M Arch Body */}
              <path
                d="M15 80 V48 C15 36 28 36 34 46 L50 68 L66 46 C72 36 85 36 85 48 V80"
                stroke="url(#labLogoGradWhiteBg)"
                strokeWidth="15"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <defs>
                <linearGradient id="labLogoGradWhiteBg" x1="15" y1="40" x2="85" y2="80" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#a855f7" />
                  <stop offset="0.5" stopColor="#06b6d4" />
                  <stop offset="1" stopColor="#3b82f6" />
                </linearGradient>
              </defs>
            </svg>

            {/* Vertical Navy Divider */}
            <div className="w-[2px] h-7 bg-[#03254c] mx-0.5" />

            {/* Typography in Deep Navy */}
            <div className="flex flex-col leading-none">
              <span className="text-[13px] sm:text-[14px] font-black tracking-wider text-[#03254c] uppercase font-sans">
                Laboratorio
              </span>
              <span className="text-[13px] sm:text-[14px] font-black tracking-wider text-[#03254c] uppercase font-sans mt-0.5">
                Clínico
              </span>
            </div>
          </div>

          {/* Right: Pill Badge (White background, Crisp Blue Outline, Navy Text) */}
          <div className="flex items-center space-x-2 px-3 py-1 rounded-full border-[2px] border-[#0284c7] bg-white shadow-sm">
            <span className="text-[11px] sm:text-xs font-black text-[#03254c]">
              Tubo {tubeIndex ? `#:` : '#:'}
            </span>
            <span className="text-xs sm:text-[13px] font-black font-mono tracking-tight text-[#03254c]">
              {barcodeValue}
            </span>
            <div
              className="w-4 h-4 rounded-full border border-slate-300 shadow-sm shrink-0 ml-1"
              style={{ backgroundColor: label.tubeColorHex || '#a855f7' }}
              title={label.tubeColorName}
            />
          </div>
        </div>

        {/* 2. TUBE COLOR BANNER & TESTS STRIP (Rounded Pill Inside Card) */}
        <div className="px-3">
          <div
            className="rounded-2xl px-4 py-1.5 text-center shadow-sm"
            style={{ background: bannerStyle.background, color: bannerStyle.textColor }}
          >
            <div className="text-[13px] sm:text-[15px] font-black uppercase tracking-wider leading-tight drop-shadow-sm">
              {label.tubeColorName || 'TUBO PRIMARIO'}
            </div>
            <div className="text-[10px] sm:text-[11px] font-bold tracking-tight opacity-95 truncate mt-0.5">
              {testsSummary}
            </div>
          </div>
        </div>

        {/* 3. PATIENT & SAMPLE DETAILS (4 Rows with White Blue-Outlined Pills) */}
        <div className="p-3 space-y-1.5 bg-white text-slate-800">
          {/* Row 1: Nombre */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1.5 w-20 shrink-0 text-[#03254c]">
              <User className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="text-[11px] font-black uppercase">Nombre:</span>
            </div>
            <div className="flex-1 border-[1.5px] border-[#0284c7] bg-white rounded-full px-3 py-0.5 font-bold text-[#03254c] text-[11px] sm:text-xs truncate shadow-sm">
              {label.patientName || 'PACIENTE GENERAL'}
            </div>
          </div>

          {/* Row 2: Cédula & Edad */}
          <div className="grid grid-cols-12 gap-2 items-center">
            {/* Cédula */}
            <div className="col-span-7 flex items-center space-x-1.5">
              <div className="flex items-center space-x-1 w-16 shrink-0 text-[#03254c]">
                <Contact className="w-3.5 h-3.5 stroke-[2.5]" />
                <span className="text-[11px] font-black uppercase">Cédula:</span>
              </div>
              <div className="flex-1 border-[1.5px] border-[#0284c7] bg-white rounded-full px-2.5 py-0.5 font-bold text-[#03254c] text-[11px] sm:text-xs font-mono truncate shadow-sm">
                {label.patientNationalId || 'N/A'}
              </div>
            </div>

            {/* Edad */}
            <div className="col-span-5 flex items-center space-x-1">
              <div className="flex items-center space-x-1 shrink-0 text-[#03254c]">
                <Calendar className="w-3 h-3 stroke-[2.5]" />
                <span className="text-[11px] font-black uppercase">Edad:</span>
              </div>
              <div className="flex-1 border-[1.5px] border-[#0284c7] bg-white rounded-full px-2 py-0.5 font-bold text-[#03254c] text-[11px] sm:text-xs text-center shadow-sm">
                {label.patientAge || 30} AÑOS
              </div>
            </div>
          </div>

          {/* Row 3: Área de la Prueba & Sexo */}
          <div className="grid grid-cols-12 gap-2 items-center">
            {/* Área de la Prueba */}
            <div className="col-span-8 flex items-center space-x-1.5">
              <div className="flex items-center space-x-1 shrink-0 text-[#03254c]">
                <Droplets className="w-3.5 h-3.5 stroke-[2.5] text-[#0284c7]" />
                <span className="text-[10px] sm:text-[11px] font-black uppercase whitespace-nowrap">Área de la Prueba:</span>
              </div>
              <div className="flex-1 border-[1.5px] border-[#0284c7] bg-white rounded-full px-2.5 py-0.5 font-bold text-[#03254c] text-[10px] sm:text-[11px] truncate shadow-sm">
                {clinicalArea}
              </div>
            </div>

            {/* Sexo */}
            <div className="col-span-4 flex items-center space-x-1">
              <div className="flex items-center space-x-1 shrink-0 text-[#03254c]">
                <span className="text-xs font-black">⚥</span>
                <span className="text-[11px] font-black uppercase">Sexo:</span>
              </div>
              <div className="flex-1 border-[1.5px] border-[#0284c7] bg-white rounded-full px-2 py-0.5 font-bold text-[#03254c] text-[11px] sm:text-xs text-center shadow-sm uppercase">
                {label.patientGender === 'F' ? 'F' : 'M'}
              </div>
            </div>
          </div>

          {/* Row 4: Flebotomista */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1.5 w-24 shrink-0 text-[#03254c]">
              <Syringe className="w-3.5 h-3.5 stroke-[2.5] text-[#0284c7]" />
              <span className="text-[10px] sm:text-[11px] font-black uppercase whitespace-nowrap">Flebotomista:</span>
            </div>
            <div className="flex-1 border-[1.5px] border-[#0284c7] bg-white rounded-full px-3 py-0.5 font-bold text-[#03254c] text-[11px] sm:text-xs truncate shadow-sm">
              {label.operatorName || 'LIC. FLEBOTOMÍA (BOX 1)'}
            </div>
          </div>
        </div>

        {/* 4. BARCODE AREA (Authentic Code128 Vector + Human Readable Number) */}
        <div className="px-4 py-1 bg-white flex flex-col items-center justify-center">
          <svg
            className="w-full max-w-[290px] h-11 overflow-visible"
            viewBox={`0 0 ${totalWidth} ${totalHeight}`}
            preserveAspectRatio="none"
          >
            <path d={svgPath} fill="#000000" />
          </svg>
          <div className="text-sm sm:text-base font-black font-mono tracking-[0.25em] text-slate-950 mt-0.5">
            {barcodeValue}
          </div>
        </div>

        {/* 5. FOOTER (White Background, Fecha y Hora + Sede + Decorative Curved Wave) */}
        <div className="bg-white border-t border-slate-200 px-3.5 py-2 flex items-center justify-between text-[#03254c] relative overflow-hidden">
          {/* Left: Fecha y Hora de Toma */}
          <div className="flex items-center space-x-1.5 z-10">
            <CalendarDays className="w-4 h-4 text-[#0284c7] shrink-0" />
            <div className="flex flex-col leading-tight">
              <span className="text-[8px] sm:text-[9px] font-bold text-slate-600 uppercase">
                Fecha y Hora de Toma:
              </span>
              <span className="text-[10px] sm:text-[11px] font-black text-[#03254c] font-mono">
                {formattedDate}
              </span>
            </div>
          </div>

          {/* Vertical Divider */}
          <div className="w-[1.5px] h-7 bg-[#03254c]/30 mx-2 z-10 shrink-0" />

          {/* Right: Sede del Laboratorio */}
          <div className="flex items-center space-x-1.5 z-10 flex-1 min-w-0">
            <Building2 className="w-4 h-4 text-[#0284c7] shrink-0" />
            <div className="flex flex-col leading-tight min-w-0">
              <span className="text-[8px] sm:text-[9px] font-bold text-slate-600 uppercase">
                Sede del Laboratorio:
              </span>
              <span className="text-[10px] sm:text-[11px] font-black text-[#03254c] truncate">
                {branchName}
              </span>
            </div>
          </div>

          {/* Decorative Corner Swoosh Curve in Blue/Purple Gradient */}
          <svg
            className="absolute -right-2 -bottom-2 w-16 h-16 pointer-events-none opacity-90 z-0"
            viewBox="0 0 100 100"
            fill="none"
          >
            <path
              d="M0 100 C35 75 55 55 75 25 C88 8 96 0 100 0 V100 H0 Z"
              fill="url(#swooshGradWhite)"
            />
            <defs>
              <linearGradient id="swooshGradWhite" x1="0" y1="100" x2="100" y2="0" gradientUnits="userSpaceOnUse">
                <stop stopColor="#0284c7" />
                <stop offset="0.6" stopColor="#2563eb" />
                <stop offset="1" stopColor="#7c3aed" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      {/* Optional Interactive Controls (Screen Only) */}
      {!compact && (onViewZpl || onPrintSingle) && (
        <div className="flex items-center justify-between px-2 text-[10px] font-mono font-bold text-slate-400 print:hidden">
          <span>Code128 • 50x30mm Térmica</span>
          <div className="flex items-center space-x-2">
            {onViewZpl && (
              <button
                type="button"
                onClick={() => onViewZpl(label)}
                className="text-teal-400 hover:text-teal-300 hover:underline uppercase transition cursor-pointer"
              >
                Ver ZPL
              </button>
            )}
            {onPrintSingle && (
              <button
                type="button"
                onClick={() => onPrintSingle(label)}
                className="px-2 py-0.5 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 rounded-lg text-[9px] font-black uppercase transition cursor-pointer"
              >
                Imprimir
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
