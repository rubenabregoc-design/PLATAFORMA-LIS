import React, { useState } from 'react';
import { ReagentInventory, Tenant, Branch } from '../../types';
import { Package, AlertTriangle, Calendar, Plus, RefreshCw, ShieldAlert, CheckCircle2, ThermometerSnowflake } from 'lucide-react';

interface ReagentInventoryModuleProps {
  tenant: Tenant;
  branch: Branch;
}

export const ReagentInventoryModule: React.FC<ReagentInventoryModuleProps> = ({
  tenant,
  branch
}) => {
  const [reagents, setReagents] = useState<ReagentInventory[]>([
    {
      id: 'reag-01',
      tenantId: tenant.id,
      name: 'Kit de Glucosa HK (Roche Vitros 5600)',
      code: 'REA-GLU-001',
      lotNumber: 'LOT-2026-9901',
      expirationDate: '2026-11-15',
      quantityRemaining: 450,
      unit: 'Determinaciones',
      testsPerUnit: 500,
      minAlertThreshold: 100,
      associatedTest: 'Química — Glucosa'
    },
    {
      id: 'reag-02',
      tenantId: tenant.id,
      name: 'Reactivo Hemograma Sysmex Cellpack DCL',
      code: 'REA-HEM-002',
      lotNumber: 'LOT-2026-4412',
      expirationDate: '2026-08-25', // Expiring soon!
      quantityRemaining: 80,
      unit: 'Litros',
      testsPerUnit: 1000,
      minAlertThreshold: 150,
      associatedTest: 'Hemograma Completo'
    },
    {
      id: 'reag-03',
      tenantId: tenant.id,
      name: 'Calibrador de Química Multicontrol Nivel 1 & 2',
      code: 'CAL-QC-003',
      lotNumber: 'LOT-2026-0031',
      expirationDate: '2027-02-10',
      quantityRemaining: 1200,
      unit: 'Viales',
      testsPerUnit: 100,
      minAlertThreshold: 200,
      associatedTest: 'Control de Calidad Westgard'
    }
  ]);

  const [newName, setNewName] = useState('');
  const [newLot, setNewLot] = useState('');
  const [newExp, setNewExp] = useState('');
  const [newQty, setNewQty] = useState(500);

  const handleAddReagent = () => {
    if (!newName || !newLot || !newExp) {
      alert('Por favor complete el nombre del reactivo, lote y fecha de vencimiento.');
      return;
    }

    const newReagent: ReagentInventory = {
      id: `reag-${Date.now()}`,
      tenantId: tenant.id,
      name: newName,
      code: `REA-NEW-${Math.floor(100 + Math.random() * 900)}`,
      lotNumber: newLot,
      expirationDate: newExp,
      quantityRemaining: newQty,
      unit: 'Determinaciones',
      testsPerUnit: newQty,
      minAlertThreshold: 100,
      associatedTest: 'Laboratorio General'
    };

    setReagents([...reagents, newReagent]);
    setNewName('');
    setNewLot('');
    setNewExp('');
    alert(`¡Reactivo ${newName} registrado en el inventario de la sede ${branch.name}!`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white p-6 rounded-2xl shadow-xl border border-blue-800/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="text-blue-300 text-xs font-bold uppercase tracking-wider mb-1 flex items-center space-x-2">
            <ThermometerSnowflake className="w-4 h-4 text-blue-400" />
            <span>Fase 3 — Control de Cadena de Frío, Lotes & Inventario de Reactivos</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black">
            Gestión de Reactivos, Calibradores & Trazabilidad de Lotes
          </h1>
          <p className="text-blue-100 text-sm mt-1 max-w-xl">
            Sede: <strong className="text-white">{branch.name}</strong> | Monitoreo en tiempo real de pruebas restantes y alertas tempranas de caducidad.
          </p>
        </div>

        <div className="bg-slate-900/80 border border-blue-500/40 p-4 rounded-xl text-xs space-y-1">
          <div className="text-blue-300 font-bold">Lotes en Stock: {reagents.length}</div>
          <div className="text-emerald-400 font-semibold">● Almacenamiento Réfrigerado 2°C - 8°C: OK</div>
        </div>
      </div>

      {/* Add New Reagent */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
          <Plus className="w-5 h-5 text-blue-600" />
          <span>Ingresar Nuevo Lote de Reactivo / Calibrador</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <input
            type="text"
            placeholder="Nombre Reactivo / Kit (ej. Perfil Lipídico Roche)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-semibold"
          />

          <input
            type="text"
            placeholder="N° de Lote Fabricante"
            value={newLot}
            onChange={(e) => setNewLot(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-mono"
          />

          <input
            type="date"
            value={newExp}
            onChange={(e) => setNewExp(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-mono"
          />

          <input
            type="number"
            placeholder="Pruebas / Cantidad"
            value={newQty}
            onChange={(e) => setNewQty(Number(e.target.value))}
            className="bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-semibold"
          />
        </div>

        <button
          onClick={handleAddReagent}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition shadow flex items-center space-x-2"
        >
          <Package className="w-4 h-4" />
          <span>Registrar Lote en Sistema</span>
        </button>
      </div>

      {/* Reagent Inventory Cards */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-900 text-sm">Existencias Actuales en Refrigeradores de Laboratorio</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {reagents.map((r) => {
            const isLow = r.quantityRemaining < r.minAlertThreshold;
            const expDate = new Date(r.expirationDate);
            const today = new Date();
            const daysToExp = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
            const isExpiringSoon = daysToExp <= 30;

            return (
              <div
                key={r.id}
                className={`p-5 rounded-2xl border transition space-y-3 ${
                  isLow || isExpiringSoon ? 'bg-amber-50/80 border-amber-300' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-bold text-slate-900 text-sm block">{r.name}</span>
                    <span className="text-xs text-slate-500 font-mono">Lote: {r.lotNumber}</span>
                  </div>
                  {(isLow || isExpiringSoon) && (
                    <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1">
                      <AlertTriangle className="w-3 h-3 text-amber-600" />
                      <span>{isLow ? 'STOCK BAJO' : 'PRÓXIMO A VENCER'}</span>
                    </span>
                  )}
                </div>

                <div className="space-y-1 text-xs text-slate-700">
                  <div className="flex justify-between">
                    <span>Restantes:</span>
                    <strong className="font-mono text-slate-900">{r.quantityRemaining} {r.unit}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Fecha Caducidad:</span>
                    <strong className={`font-mono ${isExpiringSoon ? 'text-red-700' : 'text-slate-900'}`}>
                      {r.expirationDate} ({daysToExp} días)
                    </strong>
                  </div>
                </div>

                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${Math.min(100, (r.quantityRemaining / r.testsPerUnit) * 100)}%` }}
                    className={`h-full ${isLow ? 'bg-amber-500' : 'bg-emerald-500'}`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
