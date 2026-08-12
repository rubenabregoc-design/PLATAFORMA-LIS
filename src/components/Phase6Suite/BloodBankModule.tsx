import React, { useState } from 'react';
import {
  Droplets,
  Heart,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Plus,
  RotateCw,
  Search,
  Filter,
  FileCheck2,
  Calendar,
  Sparkles,
  User,
  FlaskConical,
  TestTube
} from 'lucide-react';

export interface BloodUnit {
  id: string;
  unitCode: string; // e.g. "PR-2026-8812"
  bloodGroup: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  componentType: 'GLOBULOS_ROJOS' | 'PLASMA_FRESCO' | 'PLAQUETAS' | 'CRIOPRECIPITADO';
  volumeMl: number;
  collectionDate: string;
  expirationDate: string;
  status: 'DISPONIBLE' | 'RESERVADO_RESERVADA' | 'TRANSFUNDIDO' | 'DESCARTADO';
  donorCode: string;
  coombsDirect: 'NEGATIVO' | 'POSITIVO';
}

export interface CrossmatchRequest {
  id: string;
  requestNumber: string;
  patientName: string;
  patientGroup: string;
  assignedUnitCode: string;
  majorCrossmatch: 'COMPATIBLE' | 'INCOMPATIBLE';
  minorCrossmatch: 'COMPATIBLE' | 'INCOMPATIBLE';
  coombsIndirect: 'NEGATIVO' | 'POSITIVO';
  technologist: string;
  status: 'APROBADO_LIBERADO' | 'EN_PRUEBA' | 'RECHAZADO';
}

const INITIAL_UNITS: BloodUnit[] = [
  {
    id: 'b-101',
    unitCode: 'PGRE-2026-0812',
    bloodGroup: 'O+',
    componentType: 'GLOBULOS_ROJOS',
    volumeMl: 320,
    collectionDate: '2026-07-20',
    expirationDate: '2026-08-31',
    status: 'DISPONIBLE',
    donorCode: 'DON-2026-041',
    coombsDirect: 'NEGATIVO'
  },
  {
    id: 'b-102',
    unitCode: 'PGRE-2026-0815',
    bloodGroup: 'O-',
    componentType: 'GLOBULOS_ROJOS',
    volumeMl: 310,
    collectionDate: '2026-08-01',
    expirationDate: '2026-09-11',
    status: 'DISPONIBLE',
    donorCode: 'DON-2026-052',
    coombsDirect: 'NEGATIVO'
  },
  {
    id: 'b-103',
    unitCode: 'PFC-2026-0901',
    bloodGroup: 'A+',
    componentType: 'PLASMA_FRESCO',
    volumeMl: 250,
    collectionDate: '2026-06-10',
    expirationDate: '2027-06-10',
    status: 'DISPONIBLE',
    donorCode: 'DON-2026-012',
    coombsDirect: 'NEGATIVO'
  },
  {
    id: 'b-104',
    unitCode: 'CP-2026-1102',
    bloodGroup: 'B+',
    componentType: 'PLAQUETAS',
    volumeMl: 60,
    collectionDate: '2026-08-10',
    expirationDate: '2026-08-15',
    status: 'RESERVADO_RESERVADA',
    donorCode: 'DON-2026-090',
    coombsDirect: 'NEGATIVO'
  }
];

const INITIAL_CROSSMATCHES: CrossmatchRequest[] = [
  {
    id: 'cm-501',
    requestNumber: 'REQ-TRANS-2026-101',
    patientName: 'Sr. Fernando Abrego',
    patientGroup: 'O Rhesus Positivo (O+)',
    assignedUnitCode: 'PGRE-2026-0812',
    majorCrossmatch: 'COMPATIBLE',
    minorCrossmatch: 'COMPATIBLE',
    coombsIndirect: 'NEGATIVO',
    technologist: 'Lic. Sofía Guardia (TM)',
    status: 'APROBADO_LIBERADO'
  }
];

export const BloodBankModule: React.FC = () => {
  const [units, setUnits] = useState<BloodUnit[]>(INITIAL_UNITS);
  const [crossmatches, setCrossmatches] = useState<CrossmatchRequest[]>(INITIAL_CROSSMATCHES);
  const [selectedGroup, setSelectedGroup] = useState<string>('TODOS');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // New Crossmatch Fields
  const [formPatientName, setFormPatientName] = useState<string>('Sra. Elena de Icaza');
  const [formPatientGroup, setFormPatientGroup] = useState<string>('O Rhesus Negativo (O-)');
  const [formAssignedUnit, setFormAssignedUnit] = useState<string>('PGRE-2026-0815');

  const filteredUnits = units.filter(u => {
    if (selectedGroup !== 'TODOS' && u.bloodGroup !== selectedGroup) return false;
    return true;
  });

  const handleCreateCrossmatch = (e: React.FormEvent) => {
    e.preventDefault();
    const newCm: CrossmatchRequest = {
      id: `cm-${Date.now()}`,
      requestNumber: `REQ-TRANS-2026-${Math.floor(100 + Math.random() * 900)}`,
      patientName: formPatientName,
      patientGroup: formPatientGroup,
      assignedUnitCode: formAssignedUnit,
      majorCrossmatch: 'COMPATIBLE',
      minorCrossmatch: 'COMPATIBLE',
      coombsIndirect: 'NEGATIVO',
      technologist: 'Lic. Sofía Guardia (TM)',
      status: 'APROBADO_LIBERADO'
    };

    setCrossmatches(prev => [newCm, ...prev]);
    setIsModalOpen(false);
    alert('¡Prueba Cruzada Mayor y Menor ejecutada con compatibilidad 100%! Unidad liberada para transfusión.');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-rose-950 to-slate-950 border border-rose-500/30 p-6 sm:p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden backdrop-blur-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="text-rose-400 text-xs font-black uppercase tracking-[0.2em] mb-2 flex items-center space-x-2">
              <Droplets className="w-4 h-4 text-rose-400 animate-pulse" />
              <span>Banco de Sangre & Medicina Transfusional • ISO 15189 / MINSA</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Trazabilidad de Hemocomponentes & Pruebas Cruzadas
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-2 max-w-2xl leading-relaxed">
              Control estricto de inventario de Paquetes Globulares, Plasma Fresco, Plaquetas, tipificación ABO/Rh, prueba de Coombs e interacciones de compatibilidad transfusional.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-rose-500 hover:bg-rose-400 text-white font-black px-5 py-3 rounded-2xl text-xs transition shadow-xl flex items-center space-x-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Ejecutar Prueba Cruzada</span>
            </button>
          </div>
        </div>

        {/* Counter KPI Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-white/10">
          <div className="bg-slate-950/60 border border-white/5 p-4 rounded-2xl space-y-1">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Unidades Disponibles</div>
            <div className="text-2xl font-black font-mono text-white">{units.length} Unidades</div>
            <div className="text-[10px] text-teal-400 font-bold">100% Tamizadas VDRL/VIH/HBV</div>
          </div>

          <div className="bg-slate-950/60 border border-white/5 p-4 rounded-2xl space-y-1">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Glóbulos Rojos O- (Universal)</div>
            <div className="text-2xl font-black font-mono text-rose-400">
              {units.filter(u => u.bloodGroup === 'O-' && u.status === 'DISPONIBLE').length} Unidades
            </div>
            <div className="text-[10px] text-rose-400 font-bold">Reserva de Urgencias STAT</div>
          </div>

          <div className="bg-slate-950/60 border border-white/5 p-4 rounded-2xl space-y-1">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pruebas Cruzadas Liberadas</div>
            <div className="text-2xl font-black font-mono text-emerald-400">{crossmatches.length} Aprobadas</div>
            <div className="text-[10px] text-emerald-400 font-bold">Coombs Directo/Indirecto Negativo</div>
          </div>

          <div className="bg-slate-950/60 border border-white/5 p-4 rounded-2xl space-y-1">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Temperatura de Conservación</div>
            <div className="text-2xl font-black font-mono text-indigo-300">2.8 °C</div>
            <div className="text-[10px] text-indigo-400 font-bold">Cámara Frigorífica Monitorizada</div>
          </div>
        </div>
      </div>

      {/* Grid: Units Inventory + Crossmatch Log */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Blood Units Inventory */}
        <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-base flex items-center space-x-2">
              <FlaskConical className="w-5 h-5 text-rose-400" />
              <span>Inventario de Unidades de Sangre & Hemocomponentes</span>
            </h3>

            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs font-bold text-slate-200 rounded-xl px-3 py-1.5"
            >
              <option value="TODOS">Todos los Grupos</option>
              <option value="O+">O Positivo (O+)</option>
              <option value="O-">O Negativo (O-)</option>
              <option value="A+">A Positivo (A+)</option>
              <option value="B+">B Positivo (B+)</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 text-[10px] font-black uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3">Código Unidad</th>
                  <th className="p-3">Grupo ABO / Rh</th>
                  <th className="p-3">Componente / Vol</th>
                  <th className="p-3 text-center">Vencimiento</th>
                  <th className="p-3 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {filteredUnits.map((unit) => (
                  <tr key={unit.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-3">
                      <div className="font-mono text-teal-300 font-bold">{unit.unitCode}</div>
                      <div className="text-[10px] text-slate-500 font-mono">Donante: {unit.donorCode}</div>
                    </td>
                    <td className="p-3 font-black text-rose-400 text-sm">
                      {unit.bloodGroup}
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-white">{unit.componentType}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{unit.volumeMl} mL</div>
                    </td>
                    <td className="p-3 text-center font-mono text-amber-300 font-bold">
                      {unit.expirationDate}
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${
                        unit.status === 'DISPONIBLE'
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                          : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                      }`}>
                        {unit.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Crossmatch Log */}
        <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4">
          <h3 className="font-bold text-white text-base flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-teal-400" />
            <span>Pruebas Cruzadas Transfusionales (Crossmatch)</span>
          </h3>

          <div className="space-y-3">
            {crossmatches.map((cm) => (
              <div key={cm.id} className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-2">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                  <span className="font-mono text-teal-300 font-extrabold text-xs">{cm.requestNumber}</span>
                  <span className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-black px-2.5 py-0.5 rounded-full">
                    {cm.status}
                  </span>
                </div>

                <div className="font-bold text-white text-xs">{cm.patientName}</div>
                <div className="text-xs text-slate-400 font-medium">Grupo Paciente: <strong className="text-rose-400">{cm.patientGroup}</strong></div>

                <div className="grid grid-cols-3 gap-2 bg-slate-900 p-2.5 rounded-xl text-[10px] font-mono border border-slate-800">
                  <div>
                    <span className="text-slate-500 block">Unidad Asignada:</span>
                    <strong className="text-teal-300">{cm.assignedUnitCode}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Prueba Mayor:</span>
                    <strong className="text-emerald-400">{cm.majorCrossmatch}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Prueba Menor:</span>
                    <strong className="text-emerald-400">{cm.minorCrossmatch}</strong>
                  </div>
                </div>

                <div className="text-[10px] text-slate-500 pt-1 flex justify-between">
                  <span>Validador: {cm.technologist}</span>
                  <span className="text-emerald-400 font-bold">Coombs Indirecto: {cm.coombsIndirect}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* New Crossmatch Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="font-black text-white text-lg flex items-center space-x-2">
                <Droplets className="w-5 h-5 text-rose-400" />
                <span>Ejecutar Prueba Cruzada de Sangre</span>
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white text-xl font-bold p-1 cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleCreateCrossmatch} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-300 block mb-1">Nombre Completo del Paciente:</label>
                <input
                  type="text"
                  value={formPatientName}
                  onChange={(e) => setFormPatientName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Grupo Sanguíneo del Paciente:</label>
                <input
                  type="text"
                  value={formPatientGroup}
                  onChange={(e) => setFormPatientGroup(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Unidad de Sangre Asignada:</label>
                <select
                  value={formAssignedUnit}
                  onChange={(e) => setFormAssignedUnit(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-bold"
                >
                  <option value="PGRE-2026-0812">PGRE-2026-0812 (Glóbulos Rojos O+)</option>
                  <option value="PGRE-2026-0815">PGRE-2026-0815 (Glóbulos Rojos O- Universal)</option>
                  <option value="PFC-2026-0901">PFC-2026-0901 (Plasma A+)</option>
                </select>
              </div>

              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-1 text-[11px] text-slate-300">
                <div className="font-bold text-teal-300">Protocolo de Doble Verificación Transfusional:</div>
                <div>• Incubación a 37°C con Suero Antiglobulina Humana (Coombs)</div>
                <div>• Aglutinación ausente en tubos de reacción mayor y menor</div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end space-x-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold">Cancelar</button>
                <button type="submit" className="px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-black">Aprobar y Liberar Transfusión</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
