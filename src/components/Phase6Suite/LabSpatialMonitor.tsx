import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import {
  Users,
  Activity,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Zap,
  Sliders,
  ShieldCheck,
  CheckCircle2,
  TrendingDown,
  Sparkles,
  Maximize2,
  Info,
  Microscope,
  Flame,
  Clock,
  Layers,
  ChevronRight,
  MoveHorizontal,
  UserCheck,
  UserPlus,
  UserMinus,
  Check
} from 'lucide-react';

export interface TechnologistStaff {
  id: string;
  name: string;
  role: 'Bioquímico' | 'Tecnólogo Médico' | 'Asistente de Laboratorio' | 'Flebotomista';
  avatarColor: string;
  efficiencyRating: number; // e.g. 1.1x
  currentBenchId: string;
}

export interface LabBenchArea {
  id: string;
  code: string;
  name: string;
  category: 'HEMATOLOGY' | 'CHEMISTRY' | 'COAGULATION' | 'URINALYSIS' | 'MICROBIOLOGY' | 'RECEPTION' | 'STORAGE';
  x: number; // SVG Grid X (0 - 1000)
  y: number; // SVG Grid Y (0 - 600)
  width: number;
  height: number;
  colorTheme: string;
  activeSamplesQueue: number; // Current tubes in backlog
  optimalCapacityPerHour: number; // Max tubes/hr per tech
  analyzers: {
    name: string;
    model: string;
    status: 'ONLINE' | 'BUSY' | 'MAINTENANCE' | 'QC_WARNING';
    utilization: number; // 0 - 100%
  }[];
  avgQueueLatencyMin: number;
}

// Initial Mock Laboratory Bench Map Layout (Grid coordinates 1000 x 580)
const INITIAL_BENCH_AREAS: LabBenchArea[] = [
  {
    id: 'bench-reception',
    code: 'REC-01',
    name: 'Recepción, Triaje & Alícuotas',
    category: 'RECEPTION',
    x: 40,
    y: 40,
    width: 270,
    height: 220,
    colorTheme: '#38bdf8', // Sky
    activeSamplesQueue: 88,
    optimalCapacityPerHour: 100,
    analyzers: [
      { name: 'Clasificador Automático', model: 'Sarstedt HSS-100', status: 'ONLINE', utilization: 78 },
      { name: 'Destapador/Aliquotador', model: 'Cobas p 512', status: 'ONLINE', utilization: 82 }
    ],
    avgQueueLatencyMin: 14
  },
  {
    id: 'bench-hematology',
    code: 'HEM-02',
    name: 'Hematología & Frotis Sanguíneo',
    category: 'HEMATOLOGY',
    x: 350,
    y: 40,
    width: 290,
    height: 220,
    colorTheme: '#a855f7', // Purple
    activeSamplesQueue: 142,
    optimalCapacityPerHour: 110,
    analyzers: [
      { name: 'Hemocitómetro A', model: 'Sysmex XN-1000', status: 'BUSY', utilization: 94 },
      { name: 'Hemocitómetro B', model: 'Mindray BC-6800', status: 'ONLINE', utilization: 72 },
      { name: 'Teñidor de Láminas', model: 'RAL Stainer', status: 'ONLINE', utilization: 60 }
    ],
    avgQueueLatencyMin: 36
  },
  {
    id: 'bench-chemistry',
    code: 'CHM-03',
    name: 'Química Clínica & Inmunoensayos',
    category: 'CHEMISTRY',
    x: 680,
    y: 40,
    width: 280,
    height: 220,
    colorTheme: '#f59e0b', // Amber/Orange
    activeSamplesQueue: 235, // High backlog!
    optimalCapacityPerHour: 130,
    analyzers: [
      { name: 'Módulo Química', model: 'Cobas 6000 c501', status: 'BUSY', utilization: 98 },
      { name: 'Módulo Inmuno', model: 'Cobas e601', status: 'BUSY', utilization: 96 },
      { name: 'Analizador STAT', model: 'Abbott Alinity c', status: 'ONLINE', utilization: 85 }
    ],
    avgQueueLatencyMin: 52
  },
  {
    id: 'bench-coagulation',
    code: 'COA-04',
    name: 'Coagulación & Hemostasia',
    category: 'COAGULATION',
    x: 40,
    y: 300,
    width: 270,
    height: 240,
    colorTheme: '#06b6d4', // Cyan
    activeSamplesQueue: 48,
    optimalCapacityPerHour: 80,
    analyzers: [
      { name: 'Coagulómetro Automatizado', model: 'Stago Compact Max', status: 'ONLINE', utilization: 55 },
      { name: 'Hemostasia Especial', model: 'ACL TOP 500 CTS', status: 'ONLINE', utilization: 40 }
    ],
    avgQueueLatencyMin: 18
  },
  {
    id: 'bench-urinalysis',
    code: 'URI-05',
    name: 'Urianálisis & Parasitología',
    category: 'URINALYSIS',
    x: 350,
    y: 300,
    width: 290,
    height: 240,
    colorTheme: '#10b981', // Emerald
    activeSamplesQueue: 32, // Low backlog
    optimalCapacityPerHour: 90,
    analyzers: [
      { name: 'Analizador Químico Orina', model: 'Sysmex UC-3500', status: 'ONLINE', utilization: 38 },
      { name: 'Sedimento Automatizado', model: 'Iris iRICELL 2000', status: 'ONLINE', utilization: 35 }
    ],
    avgQueueLatencyMin: 11
  },
  {
    id: 'bench-microbiology',
    code: 'MIC-06',
    name: 'Microbiología & Biología Molecular',
    category: 'MICROBIOLOGY',
    x: 680,
    y: 300,
    width: 280,
    height: 240,
    colorTheme: '#ec4899', // Pink
    activeSamplesQueue: 65,
    optimalCapacityPerHour: 60,
    analyzers: [
      { name: 'Identificación & Antibiograma', model: 'bioMérieux VITEK 2', status: 'ONLINE', utilization: 68 },
      { name: 'PCR Multiplex Sindrómico', model: 'BioFire FilmArray 2.0', status: 'BUSY', utilization: 88 },
      { name: 'Hemocultivos Continuos', model: 'BacT/ALERT 3D', status: 'ONLINE', utilization: 62 }
    ],
    avgQueueLatencyMin: 26
  }
];

const INITIAL_STAFF: TechnologistStaff[] = [
  { id: 'st-01', name: 'Lic. Elena Morales', role: 'Tecnólogo Médico', avatarColor: '#38bdf8', efficiencyRating: 1.2, currentBenchId: 'bench-reception' },
  { id: 'st-02', name: 'Lic. Roberto Díaz', role: 'Tecnólogo Médico', avatarColor: '#a855f7', efficiencyRating: 1.1, currentBenchId: 'bench-hematology' },
  { id: 'st-03', name: 'Dra. Carmen Valdés', role: 'Bioquímico', avatarColor: '#f59e0b', efficiencyRating: 1.3, currentBenchId: 'bench-chemistry' },
  { id: 'st-04', name: 'Lic. Sofía Guardia', role: 'Tecnólogo Médico', avatarColor: '#06b6d4', efficiencyRating: 1.0, currentBenchId: 'bench-coagulation' },
  { id: 'st-05', name: 'Lic. Marco Paredes', role: 'Asistente de Laboratorio', avatarColor: '#10b981', efficiencyRating: 1.0, currentBenchId: 'bench-urinalysis' },
  { id: 'st-06', name: 'Lic. Aníbal Castillo', role: 'Tecnólogo Médico', avatarColor: '#10b981', efficiencyRating: 1.1, currentBenchId: 'bench-urinalysis' }, // Overstaffed for current load
  { id: 'st-07', name: 'Dr. Fernando Vega', role: 'Bioquímico', avatarColor: '#ec4899', efficiencyRating: 1.2, currentBenchId: 'bench-microbiology' }
];

export const LabSpatialMonitor: React.FC = () => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [benches, setBenches] = useState<LabBenchArea[]>(INITIAL_BENCH_AREAS);
  const [staffList, setStaffList] = useState<TechnologistStaff[]>(INITIAL_STAFF);
  const [selectedBenchId, setSelectedBenchId] = useState<string>('bench-chemistry');
  const [isSimulatingLiveFlow, setIsSimulatingLiveFlow] = useState<boolean>(true);
  const [notificationToast, setNotificationToast] = useState<string | null>(null);
  const [hoveredBenchId, setHoveredBenchId] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setNotificationToast(msg);
    setTimeout(() => setNotificationToast(null), 4000);
  };

  // Helper to calculate workload & capacity for a bench given currently stationed staff
  const calculateBenchLoad = (bench: LabBenchArea, staff: TechnologistStaff[]) => {
    const assigned = staff.filter((s) => s.currentBenchId === bench.id);
    const staffCount = assigned.length;
    // Total effective capacity = staffCount * optimalCapacityPerHour * avg efficiency
    const effectiveStaffPower = assigned.reduce((acc, s) => acc + s.efficiencyRating, 0) || 0.3;
    const totalEffectiveCapacity = bench.optimalCapacityPerHour * effectiveStaffPower;
    
    // Load percentage = (backlog / (capacity / 1 hr equivalent)) * 100
    const loadPercentage = Math.round((bench.activeSamplesQueue / Math.max(10, totalEffectiveCapacity)) * 100);

    let status: 'OPTIMAL' | 'MODERATE' | 'OVERLOAD' | 'UNDERUTILIZED' = 'OPTIMAL';
    if (loadPercentage > 115) status = 'OVERLOAD';
    else if (loadPercentage > 85) status = 'MODERATE';
    else if (loadPercentage < 45) status = 'UNDERUTILIZED';

    return {
      staffCount,
      assignedStaff: assigned,
      effectiveCapacity: Math.round(totalEffectiveCapacity),
      loadPercentage,
      status
    };
  };

  // Periodic subtle fluctuation to simulate live tube throughput
  useEffect(() => {
    if (!isSimulatingLiveFlow) return;

    const interval = setInterval(() => {
      setBenches((prev) =>
        prev.map((b) => {
          // Dynamic jitter: chemistry and hematology get incoming tubes faster
          const incoming = b.category === 'CHEMISTRY' ? Math.floor(Math.random() * 5) : Math.floor(Math.random() * 3);
          const staffCount = staffList.filter((s) => s.currentBenchId === b.id).length;
          const processed = Math.min(b.activeSamplesQueue, Math.floor(staffCount * (b.optimalCapacityPerHour / 60) * 1.5 + Math.random() * 2));
          const newQueue = Math.max(8, b.activeSamplesQueue + incoming - processed);
          return {
            ...b,
            activeSamplesQueue: newQueue,
            avgQueueLatencyMin: Math.max(5, Math.round(newQueue / (Math.max(1, staffCount) * 1.5)))
          };
        })
      );
    }, 4000);

    return () => clearInterval(interval);
  }, [isSimulatingLiveFlow, staffList]);

  // Reallocate staff action
  const handleMoveStaff = (staffId: string, targetBenchId: string) => {
    const staffMember = staffList.find((s) => s.id === staffId);
    const targetBench = benches.find((b) => b.id === targetBenchId);
    if (!staffMember || !targetBench) return;

    setStaffList((prev) =>
      prev.map((s) => (s.id === staffId ? { ...s, currentBenchId: targetBenchId } : s))
    );

    showToast(`✓ ${staffMember.name} reasignado exitosamente a "${targetBench.name}". Carga recalculada.`);
  };

  // Smart Auto-Balance algorithm: Identifies highest overload bench and moves staff from lowest underutilized bench
  const handleAutoRebalance = () => {
    // Calculate loads
    const benchStats = benches.map((b) => ({
      bench: b,
      ...calculateBenchLoad(b, staffList)
    }));

    const overloaded = benchStats
      .filter((bs) => bs.loadPercentage > 100)
      .sort((a, b) => b.loadPercentage - a.loadPercentage);

    const underutilized = benchStats
      .filter((bs) => bs.staffCount > 1 && bs.loadPercentage < 65)
      .sort((a, b) => a.loadPercentage - b.loadPercentage);

    if (overloaded.length === 0 || underutilized.length === 0) {
      showToast('ℹ️ El flujo espacial del laboratorio ya se encuentra equilibrado.');
      return;
    }

    const recipient = overloaded[0];
    const donor = underutilized[0];
    const candidateStaff = donor.assignedStaff[donor.assignedStaff.length - 1];

    if (candidateStaff) {
      handleMoveStaff(candidateStaff.id, recipient.bench.id);
      showToast(`⚡ Rebalanceo Inteligente: ${candidateStaff.name} transferido de ${donor.bench.code} a ${recipient.bench.code} para mitigar cuello de botella.`);
    }
  };

  // D3 Spatial Floor Plan Rendering Engine
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous render

    const width = 1000;
    const height = 580;

    // Define defs for patterns & filters
    const defs = svg.append('defs');

    // Subtle Architectural Grid pattern
    const pattern = defs
      .append('pattern')
      .attr('id', 'floor-grid')
      .attr('width', 20)
      .attr('height', 20)
      .attr('patternUnits', 'userSpaceOnUse');

    pattern
      .append('rect')
      .attr('width', 20)
      .attr('height', 20)
      .attr('fill', '#090d16');

    pattern
      .append('path')
      .attr('d', 'M 20 0 L 0 0 0 20')
      .attr('fill', 'none')
      .attr('stroke', '#1e293b')
      .attr('stroke-width', 0.5)
      .attr('opacity', 0.6);

    // Glow Filter for overloaded zones
    const filter = defs.append('filter').attr('id', 'glow-overload').attr('x', '-20%').attr('y', '-20%').attr('width', '140%').attr('height', '140%');
    filter.append('feGaussianBlur').attr('stdDeviation', '6').attr('result', 'blur');
    filter.append('feComposite').attr('in', 'SourceGraphic').attr('in2', 'blur').attr('operator', 'over');

    // Background Container
    svg
      .append('rect')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', 'url(#floor-grid)')
      .attr('rx', 24);

    // Architectural Room Boundaries & Hallways
    const hallwayGroup = svg.append('g').attr('class', 'hallways');

    // Central Sample Transport Corridor
    hallwayGroup
      .append('line')
      .attr('x1', 320)
      .attr('y1', 20)
      .attr('x2', 320)
      .attr('y2', 560)
      .attr('stroke', '#334155')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '6,6');

    hallwayGroup
      .append('line')
      .attr('x1', 655)
      .attr('y1', 20)
      .attr('x2', 655)
      .attr('y2', 560)
      .attr('stroke', '#334155')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '6,6');

    hallwayGroup
      .append('line')
      .attr('x1', 20)
      .attr('y1', 280)
      .attr('x2', 980)
      .attr('y2', 280)
      .attr('stroke', '#334155')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '6,6');

    // Conduit Flow animated particles between benches
    const conduits = svg.append('g').attr('class', 'pneumatic-conduits');

    // Path 1: Reception -> Hematology
    conduits
      .append('path')
      .attr('d', 'M 310 150 L 350 150')
      .attr('stroke', '#38bdf8')
      .attr('stroke-width', 3)
      .attr('stroke-dasharray', '4,4')
      .attr('opacity', 0.8);

    // Path 2: Reception -> Chemistry
    conduits
      .append('path')
      .attr('d', 'M 640 150 L 680 150')
      .attr('stroke', '#f59e0b')
      .attr('stroke-width', 3)
      .attr('stroke-dasharray', '4,4')
      .attr('opacity', 0.8);

    // Render Bench Modules
    const benchGroup = svg.append('g').attr('class', 'benches');

    benches.forEach((bench) => {
      const { staffCount, assignedStaff, loadPercentage, status } = calculateBenchLoad(bench, staffList);
      const isSelected = selectedBenchId === bench.id;
      const isHovered = hoveredBenchId === bench.id;

      // Color scheme based on load status
      let borderColor = '#334155';
      let fillColor = '#0f172a';
      let statusTextColor = '#34d399';
      let badgeLabel = 'ÓPTIMO';

      if (status === 'OVERLOAD') {
        borderColor = '#f43f5e';
        fillColor = '#3b0d1e';
        statusTextColor = '#fb7185';
        badgeLabel = 'SOBRECARGA';
      } else if (status === 'MODERATE') {
        borderColor = '#f59e0b';
        fillColor = '#2d1a08';
        statusTextColor = '#fbbf24';
        badgeLabel = 'MODERADO';
      } else if (status === 'UNDERUTILIZED') {
        borderColor = '#10b981';
        fillColor = '#062d22';
        statusTextColor = '#6ee7b7';
        badgeLabel = 'CAPACIDAD LIBRE';
      }

      const g = benchGroup
        .append('g')
        .attr('class', `bench-item-${bench.id}`)
        .style('cursor', 'pointer')
        .on('click', () => setSelectedBenchId(bench.id))
        .on('mouseenter', () => setHoveredBenchId(bench.id))
        .on('mouseleave', () => setHoveredBenchId(null));

      // Overload Glow Pulse Effect
      if (status === 'OVERLOAD') {
        g.append('rect')
          .attr('x', bench.x - 4)
          .attr('y', bench.y - 4)
          .attr('width', bench.width + 8)
          .attr('height', bench.height + 8)
          .attr('rx', 22)
          .attr('fill', 'none')
          .attr('stroke', '#f43f5e')
          .attr('stroke-width', 2)
          .attr('filter', 'url(#glow-overload)')
          .attr('opacity', 0.6);
      }

      // Bench Card Body
      g.append('rect')
        .attr('x', bench.x)
        .attr('y', bench.y)
        .attr('width', bench.width)
        .attr('height', bench.height)
        .attr('rx', 18)
        .attr('fill', fillColor)
        .attr('stroke', isSelected ? '#38bdf8' : isHovered ? '#64748b' : borderColor)
        .attr('stroke-width', isSelected ? 3 : 1.5)
        .attr('opacity', 0.95);

      // Top Header Pill
      g.append('rect')
        .attr('x', bench.x + 12)
        .attr('y', bench.y + 12)
        .attr('width', 60)
        .attr('height', 20)
        .attr('rx', 6)
        .attr('fill', '#1e293b');

      g.append('text')
        .attr('x', bench.x + 42)
        .attr('y', bench.y + 26)
        .attr('text-anchor', 'middle')
        .attr('font-size', '10px')
        .attr('font-family', 'monospace')
        .attr('font-weight', 'bold')
        .attr('fill', '#e2e8f0')
        .text(bench.code);

      // Status Badge Tag (Right)
      g.append('rect')
        .attr('x', bench.x + bench.width - 100)
        .attr('y', bench.y + 12)
        .attr('width', 88)
        .attr('height', 20)
        .attr('rx', 6)
        .attr('fill', status === 'OVERLOAD' ? '#e11d48' : status === 'MODERATE' ? '#d97706' : '#059669');

      g.append('text')
        .attr('x', bench.x + bench.width - 56)
        .attr('y', bench.y + 26)
        .attr('text-anchor', 'middle')
        .attr('font-size', '9px')
        .attr('font-family', 'monospace')
        .attr('font-weight', '900')
        .attr('fill', '#ffffff')
        .text(`${loadPercentage}% ${badgeLabel}`);

      // Bench Title
      g.append('text')
        .attr('x', bench.x + 14)
        .attr('y', bench.y + 52)
        .attr('font-size', '12px')
        .attr('font-weight', 'bold')
        .attr('fill', '#ffffff')
        .text(bench.name.length > 28 ? bench.name.slice(0, 26) + '...' : bench.name);

      // Load Metrics Row
      g.append('text')
        .attr('x', bench.x + 14)
        .attr('y', bench.y + 78)
        .attr('font-size', '10px')
        .attr('font-family', 'monospace')
        .attr('fill', '#94a3b8')
        .text(`Colas: `);

      g.append('text')
        .attr('x', bench.x + 50)
        .attr('y', bench.y + 78)
        .attr('font-size', '12px')
        .attr('font-family', 'monospace')
        .attr('font-weight', 'bold')
        .attr('fill', '#ffffff')
        .text(`${bench.activeSamplesQueue} tubos`);

      g.append('text')
        .attr('x', bench.x + 140)
        .attr('y', bench.y + 78)
        .attr('font-size', '10px')
        .attr('font-family', 'monospace')
        .attr('fill', '#94a3b8')
        .text(`Demora: `);

      g.append('text')
        .attr('x', bench.x + 190)
        .attr('y', bench.y + 78)
        .attr('font-size', '12px')
        .attr('font-family', 'monospace')
        .attr('font-weight', 'bold')
        .attr('fill', status === 'OVERLOAD' ? '#fb7185' : '#38bdf8')
        .text(`~${bench.avgQueueLatencyMin}m`);

      // Heatmap Capacity Progress Bar
      const barX = bench.x + 14;
      const barY = bench.y + 92;
      const barW = bench.width - 28;
      const barH = 7;

      g.append('rect')
        .attr('x', barX)
        .attr('y', barY)
        .attr('width', barW)
        .attr('height', barH)
        .attr('rx', 3.5)
        .attr('fill', '#1e293b');

      const fillW = Math.min(barW, (barW * loadPercentage) / 100);
      g.append('rect')
        .attr('x', barX)
        .attr('y', barY)
        .attr('width', Math.max(4, fillW))
        .attr('height', barH)
        .attr('rx', 3.5)
        .attr('fill', status === 'OVERLOAD' ? '#f43f5e' : status === 'MODERATE' ? '#f59e0b' : '#10b981');

      // Analyzers Mini Rack section
      const rackY = bench.y + 112;
      g.append('text')
        .attr('x', bench.x + 14)
        .attr('y', rackY)
        .attr('font-size', '9px')
        .attr('font-family', 'monospace')
        .attr('font-weight', 'bold')
        .attr('fill', '#64748b')
        .text('ANALIZADORES EN LÍNEA:');

      bench.analyzers.forEach((an, aIdx) => {
        const itemY = rackY + 12 + aIdx * 16;
        if (itemY > bench.y + bench.height - 50) return; // Prevent overflow

        // Status led
        g.append('circle')
          .attr('cx', bench.x + 18)
          .attr('cy', itemY - 3)
          .attr('r', 3)
          .attr('fill', an.status === 'BUSY' ? '#f59e0b' : an.status === 'ONLINE' ? '#34d399' : '#f43f5e');

        g.append('text')
          .attr('x', bench.x + 28)
          .attr('y', itemY)
          .attr('font-size', '9px')
          .attr('fill', '#cbd5e1')
          .text(`${an.model} (${an.utilization}%)`);
      });

      // Staff Avatars & Stationed Technicians Tray (Bottom of bench)
      const techTrayY = bench.y + bench.height - 36;
      g.append('line')
        .attr('x1', bench.x + 14)
        .attr('y1', techTrayY)
        .attr('x2', bench.x + bench.width - 14)
        .attr('y2', techTrayY)
        .attr('stroke', '#1e293b')
        .attr('stroke-width', 1);

      g.append('text')
        .attr('x', bench.x + 14)
        .attr('y', techTrayY + 22)
        .attr('font-size', '10px')
        .attr('font-family', 'monospace')
        .attr('fill', '#94a3b8')
        .text(`Personal (${staffCount}):`);

      assignedStaff.forEach((st, sIdx) => {
        const avX = bench.x + 95 + sIdx * 24;
        if (avX > bench.x + bench.width - 20) return;

        // Avatar circle
        g.append('circle')
          .attr('cx', avX)
          .attr('cy', techTrayY + 18)
          .attr('r', 9)
          .attr('fill', st.avatarColor)
          .attr('stroke', '#0f172a')
          .attr('stroke-width', 2);

        // First initial letter
        g.append('text')
          .attr('x', avX)
          .attr('y', techTrayY + 21)
          .attr('text-anchor', 'middle')
          .attr('font-size', '8px')
          .attr('font-weight', 'bold')
          .attr('fill', '#090d16')
          .text(st.name.charAt(0));
      });
    });
  }, [benches, staffList, selectedBenchId, hoveredBenchId]);

  // Selected Bench details
  const selectedBench = benches.find((b) => b.id === selectedBenchId) || benches[0];
  const selectedBenchMetrics = calculateBenchLoad(selectedBench, staffList);

  // Bench under-load summary metrics
  const totalTubesInLab = benches.reduce((acc, b) => acc + b.activeSamplesQueue, 0);
  const overloadedBenchesCount = benches.filter((b) => calculateBenchLoad(b, staffList).status === 'OVERLOAD').length;

  return (
    <div className="space-y-6 text-slate-100 animate-in fade-in duration-500">
      {/* Toast Banner */}
      {notificationToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[250] bg-slate-900/95 border border-teal-500/60 text-white font-bold text-xs px-6 py-3.5 rounded-2xl shadow-[0_10px_35px_rgba(20,184,166,0.35)] backdrop-blur-xl flex items-center space-x-3 animate-in fade-in slide-in-from-top-4">
          <Sparkles className="w-4 h-4 text-teal-400 animate-pulse" />
          <span>{notificationToast}</span>
        </div>
      )}

      {/* Spatial Monitor Top Bar */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/60 border border-indigo-500/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-indigo-400 text-xs font-black uppercase tracking-widest">
              <Layers className="w-4 h-4" />
              <span>Plano Espacial & Balanceo de Carga de Personal (D3 Engine)</span>
            </div>
            <h2 className="text-xl sm:text-3xl font-black text-white tracking-tight flex items-center space-x-3">
              <Microscope className="w-7 h-7 text-indigo-400" />
              <span>Monitor Espacial del Laboratorio & Reasignación Dinámica</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              Supervise en tiempo real la topología de mesones, analizadores y flujo de muestras. Identifique áreas sobrecargadas y <strong>reasigne personal técnico con un solo clic</strong> para evitar retrasos en el TAT.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {/* Auto-rebalance button */}
            <button
              onClick={handleAutoRebalance}
              className="px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-teal-500 hover:from-indigo-400 hover:to-teal-400 text-slate-950 font-black rounded-2xl text-xs transition shadow-lg shadow-indigo-500/20 flex items-center space-x-2 cursor-pointer"
            >
              <Zap className="w-4 h-4" />
              <span>Sugerencia Auto-Rebalanceo</span>
            </button>

            {/* Toggle live flow simulation */}
            <button
              onClick={() => setIsSimulatingLiveFlow(!isSimulatingLiveFlow)}
              className={`px-3 py-2.5 rounded-2xl text-xs font-bold transition flex items-center space-x-2 border cursor-pointer ${
                isSimulatingLiveFlow
                  ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>{isSimulatingLiveFlow ? 'Flujo Cinético Activo' : 'Pausado'}</span>
            </button>
          </div>
        </div>

        {/* Quick KPI counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/10 text-xs">
          <div className="bg-slate-900/60 border border-white/5 p-3 rounded-2xl">
            <span className="text-[10px] text-slate-400 font-mono block uppercase">Muestras Totales en Mesones:</span>
            <span className="text-xl font-black text-white font-mono">{totalTubesInLab} tubos</span>
          </div>

          <div className="bg-slate-900/60 border border-white/5 p-3 rounded-2xl">
            <span className="text-[10px] text-slate-400 font-mono block uppercase">Mesones en Sobrecarga:</span>
            <span className={`text-xl font-black font-mono ${overloadedBenchesCount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {overloadedBenchesCount} {overloadedBenchesCount === 1 ? 'Área' : 'Áreas'}
            </span>
          </div>

          <div className="bg-slate-900/60 border border-white/5 p-3 rounded-2xl">
            <span className="text-[10px] text-slate-400 font-mono block uppercase">Tecnólogos en Turno:</span>
            <span className="text-xl font-black text-teal-300 font-mono">{staffList.length} Especialistas</span>
          </div>

          <div className="bg-slate-900/60 border border-white/5 p-3 rounded-2xl">
            <span className="text-[10px] text-slate-400 font-mono block uppercase">Rendimiento Operativo:</span>
            <span className="text-xl font-black text-indigo-300 font-mono">92.4% OEE</span>
          </div>
        </div>
      </div>

      {/* Main Layout: D3 Floor Plan (Left) + Reallocation Drawer (Right) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Left Col: D3 Spatial Canvas (8 Cols) */}
        <div className="xl:col-span-8 bg-slate-900/90 border border-slate-800 p-5 rounded-3xl shadow-xl space-y-3 flex flex-col justify-between" ref={containerRef}>
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-ping" />
              <h3 className="font-bold text-white text-sm">Plano Arquitectónico & Ocupación de Mesones</h3>
              <span className="text-[10px] text-slate-400 font-mono bg-slate-950 px-2 py-0.5 rounded-lg border border-slate-800">
                Haga clic en un mesón para reasignar personal
              </span>
            </div>

            {/* Map legend */}
            <div className="hidden sm:flex items-center space-x-3 text-[10px] font-mono">
              <span className="flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-slate-400">&lt;85% Normal</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="text-slate-400">85-115% Moderado</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span className="text-rose-400 font-bold">&gt;115% Sobrecarga</span>
              </span>
            </div>
          </div>

          {/* D3 SVG Canvas wrapper */}
          <div className="w-full overflow-x-auto rounded-2xl border border-slate-800/80 bg-slate-950/60 p-1 flex items-center justify-center">
            <svg
              ref={svgRef}
              viewBox="0 0 1000 580"
              className="w-full h-auto max-h-[580px] select-none"
            />
          </div>

          <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 font-mono">
            <span>Red neumática activa: Flujo automatizado entre Recepción, Química y Hematología.</span>
            <span className="text-indigo-400">D3 SVG Renderer v7.9</span>
          </div>
        </div>

        {/* Right Col: Staff Reallocation & Bench Control Drawer (4 Cols) */}
        <div className="xl:col-span-4 bg-slate-900/90 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-6 flex flex-col justify-between">
          
          {/* Bench Profile Header */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-black text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-xl border border-indigo-500/30">
                {selectedBench.code} • {selectedBench.category}
              </span>
              <span
                className={`text-[10px] font-mono font-black px-2.5 py-1 rounded-full ${
                  selectedBenchMetrics.status === 'OVERLOAD'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : selectedBenchMetrics.status === 'MODERATE'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                }`}
              >
                {selectedBenchMetrics.loadPercentage}% DE CAPACIDAD
              </span>
            </div>

            <h3 className="text-lg font-black text-white">{selectedBench.name}</h3>

            {/* Bench Specific Metrics Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-mono">Muestras en Espera:</span>
                <span className="text-lg font-black text-white font-mono">{selectedBench.activeSamplesQueue}</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-mono">Tiempo de Espera:</span>
                <span className={`text-lg font-black font-mono ${selectedBenchMetrics.status === 'OVERLOAD' ? 'text-rose-400' : 'text-teal-300'}`}>
                  ~{selectedBench.avgQueueLatencyMin} min
                </span>
              </div>
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-mono">Personal Asignado:</span>
                <span className="text-lg font-black text-indigo-300 font-mono">{selectedBenchMetrics.staffCount} tecnólogos</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-mono">Capacidad Máxima:</span>
                <span className="text-lg font-black text-emerald-400 font-mono">{selectedBenchMetrics.effectiveCapacity} tubos/h</span>
              </div>
            </div>
          </div>

          {/* Assigned Staff List in this bench */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-300 flex items-center justify-between">
              <span>Personal Estacionado en este Mesón ({selectedBenchMetrics.staffCount}):</span>
            </div>

            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {selectedBenchMetrics.assignedStaff.length === 0 ? (
                <div className="p-4 bg-rose-950/20 border border-rose-500/30 rounded-2xl text-xs text-rose-300 text-center">
                  ⚠️ No hay personal asignado a este mesón. Riesgo de cuello de botella crítico.
                </div>
              ) : (
                selectedBenchMetrics.assignedStaff.map((staff) => (
                  <div
                    key={staff.id}
                    className="p-2.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center space-x-2.5">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black text-slate-950 font-mono shrink-0"
                        style={{ backgroundColor: staff.avatarColor }}
                      >
                        {staff.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-white leading-tight">{staff.name}</div>
                        <div className="text-[10px] text-slate-400">{staff.role} • Factor {staff.efficiencyRating}x</div>
                      </div>
                    </div>

                    {/* Reassign dropdown or action */}
                    <select
                      onChange={(e) => handleMoveStaff(staff.id, e.target.value)}
                      value={staff.currentBenchId}
                      className="bg-slate-900 border border-slate-700 text-[10px] font-bold text-teal-300 rounded-xl px-2 py-1 focus:outline-none focus:border-teal-500"
                    >
                      <option value={selectedBench.id}>Estacionado Aquí</option>
                      {benches
                        .filter((b) => b.id !== selectedBench.id)
                        .map((target) => (
                          <option key={target.id} value={target.id}>
                            Mover a {target.code}
                          </option>
                        ))}
                    </select>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Reinforce: Move Staff from another bench to this bench */}
          <div className="space-y-2 pt-3 border-t border-slate-800">
            <div className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
              <UserPlus className="w-3.5 h-3.5 text-teal-400" />
              <span>Reforzar Mesón: Reasignar personal disponible desde otra área</span>
            </div>

            <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
              {staffList
                .filter((s) => s.currentBenchId !== selectedBench.id)
                .map((availableStaff) => {
                  const originBench = benches.find((b) => b.id === availableStaff.currentBenchId);
                  return (
                    <div
                      key={availableStaff.id}
                      className="p-2 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between text-xs hover:border-slate-700 transition"
                    >
                      <div>
                        <span className="font-bold text-slate-200 block">{availableStaff.name}</span>
                        <span className="text-[9px] text-slate-400 font-mono">En: {originBench?.name.slice(0, 20)}...</span>
                      </div>

                      <button
                        onClick={() => handleMoveStaff(availableStaff.id, selectedBench.id)}
                        className="px-2.5 py-1 bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/40 rounded-lg text-[10px] font-black transition cursor-pointer flex items-center space-x-1"
                      >
                        <span>Reasignar Aquí</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
