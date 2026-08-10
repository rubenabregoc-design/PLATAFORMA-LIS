import React, { useState } from 'react';
import { Tenant, Branch, User } from '../types';
import { ROLE_LABELS } from './Header';
import {
  Building2, MapPin, Phone, CheckCircle2, ArrowRight,
  ShieldCheck, Sparkles, Building, Activity, Check, Radio
} from 'lucide-react';

interface BranchSelectionModalProps {
  isOpen: boolean;
  currentUser: User;
  currentTenant: Tenant;
  selectedBranchId: string;
  onSelectBranch: (branchId: string) => void;
  onConfirm: (branchId: string) => void;
  onClose?: () => void;
}

export const BranchSelectionModal: React.FC<BranchSelectionModalProps> = ({
  isOpen,
  currentUser,
  currentTenant,
  selectedBranchId,
  onSelectBranch,
  onConfirm,
  onClose
}) => {
  if (!isOpen) return null;

  const [activeBranchId, setActiveBranchId] = useState<string>(
    selectedBranchId || currentTenant.branches[0]?.id || ''
  );

  const roleInfo = ROLE_LABELS[currentUser.role] || { title: currentUser.role, color: 'bg-teal-500/15 text-teal-300' };

  const handleSelect = (branchId: string) => {
    setActiveBranchId(branchId);
    onSelectBranch(branchId);
  };

  const handleConfirmAction = () => {
    onConfirm(activeBranchId);
  };

  const selectedBranch = currentTenant.branches.find(b => b.id === activeBranchId) || currentTenant.branches[0];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative overflow-hidden space-y-6">
        
        {/* Glow backdrop decoration */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-teal-500/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-emerald-500/10 rounded-full blur-[90px] pointer-events-none"></div>

        {/* Modal Header */}
        <div className="space-y-2 relative z-10">
          <div className="flex items-center justify-between">
            <span className="px-3 py-1 bg-teal-500/20 border border-teal-500/40 text-teal-300 font-bold rounded-full text-[11px] uppercase tracking-wider flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
              <span>Confirmación de Sede Operativa</span>
            </span>

            {onClose && (
              <button
                onClick={onClose}
                className="text-slate-500 hover:text-slate-300 text-sm font-bold p-1 rounded-lg transition cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          <h2 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2">
            <Building2 className="w-7 h-7 text-teal-400 shrink-0" />
            <span>Seleccione su Sede de Trabajo</span>
          </h2>

          <p className="text-xs text-slate-400 leading-relaxed">
            Hola <strong className="text-white">{currentUser.name}</strong>, tu cuenta tiene acceso a múltiples centros clínicos en <strong className="text-teal-300">{currentTenant.name}</strong>. Por favor confirma la sede en la que operarás durante esta sesión.
          </p>
        </div>

        {/* User Role Badge Banner */}
        <div className="p-3.5 bg-slate-950/90 border border-slate-800 rounded-2xl flex items-center justify-between gap-3 text-xs relative z-10">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-500/20 border border-teal-500/40 text-teal-300 flex items-center justify-center font-bold">
              <ShieldCheck className="w-4 h-4 text-teal-400" />
            </div>
            <div>
              <div className="font-bold text-white text-xs">{currentUser.name}</div>
              <div className="text-[11px] text-slate-400 font-mono">{currentUser.email}</div>
            </div>
          </div>

          <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${roleInfo.color}`}>
            {roleInfo.title}
          </span>
        </div>

        {/* Branch Cards Selection */}
        <div className="space-y-3 relative z-10">
          <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
            <span>Sedes Disponibles ({currentTenant.branches.length})</span>
            <span className="text-[10px] text-teal-400 font-mono">Selección obligatoria de sesión</span>
          </label>

          <div className="grid grid-cols-1 gap-2.5 max-h-60 overflow-y-auto pr-1">
            {currentTenant.branches.map((branch: Branch) => {
              const isSelected = branch.id === activeBranchId;

              return (
                <button
                  key={branch.id}
                  type="button"
                  onClick={() => handleSelect(branch.id)}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden group ${
                    isSelected
                      ? 'bg-slate-950 border-teal-400 ring-2 ring-teal-500/30 shadow-xl'
                      : 'bg-slate-950/50 border-slate-800 hover:border-slate-700 hover:bg-slate-950'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${
                        isSelected
                          ? 'bg-teal-500/20 border-teal-400 text-teal-300'
                          : 'bg-slate-900 border-slate-800 text-slate-500 group-hover:text-slate-300'
                      }`}>
                        <Building className="w-5 h-5" />
                      </div>

                      <div className="space-y-1">
                        <div className="font-bold text-sm text-white flex items-center space-x-2">
                          <span>{branch.name}</span>
                          <span className="px-2 py-0.5 bg-slate-900 text-slate-300 border border-slate-800 rounded text-[10px] font-mono">
                            {branch.code}
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-400 flex items-center space-x-1.5">
                          <MapPin className="w-3 h-3 text-teal-400 shrink-0" />
                          <span>{branch.address}</span>
                        </div>

                        <div className="text-[11px] text-slate-400 flex items-center space-x-1.5 font-mono">
                          <Phone className="w-3 h-3 text-slate-500 shrink-0" />
                          <span>{branch.phone}</span>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 pt-0.5">
                      {isSelected ? (
                        <div className="w-6 h-6 rounded-full bg-teal-500 text-slate-950 flex items-center justify-center font-bold shadow-md shadow-teal-500/30">
                          <Check className="w-4 h-4 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full border border-slate-700 bg-slate-900 group-hover:border-slate-500"></div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Branch Summary Footer */}
        {selectedBranch && (
          <div className="p-3 bg-teal-500/10 border border-teal-500/20 rounded-2xl text-[11px] text-teal-300 space-y-1 relative z-10">
            <div className="font-bold flex items-center space-x-1.5">
              <Activity className="w-3.5 h-3.5 text-teal-400" />
              <span>Configuración Activa de Sesión:</span>
            </div>
            <p className="text-slate-300">
              Las muestras, facturas y folios fiscales serán atribuidos a: <strong className="text-white font-bold">{selectedBranch.name} ({selectedBranch.code})</strong>.
            </p>
          </div>
        )}

        {/* Action Controls */}
        <div className="pt-2 flex items-center justify-end space-x-3 border-t border-slate-800 relative z-10">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition cursor-pointer"
            >
              Cancelar
            </button>
          )}

          <button
            type="button"
            onClick={handleConfirmAction}
            className="px-6 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black rounded-xl text-xs transition shadow-lg shadow-teal-500/20 flex items-center space-x-2 cursor-pointer"
          >
            <span>Confirmar e Iniciar en esta Sede</span>
            <ArrowRight className="w-4 h-4 stroke-[3]" />
          </button>
        </div>

      </div>
    </div>
  );
};
