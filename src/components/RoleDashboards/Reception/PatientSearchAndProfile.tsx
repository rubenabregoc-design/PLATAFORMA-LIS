import React from 'react';
import { Patient } from '../../../types';
import {
  Search, User, Smartphone, MapPin, Fingerprint, UserSearch, Camera, ShieldCheck, PenTool, QrCode
} from 'lucide-react';
import { MOCK_DOCTORS } from '../../../data/mockData';
import { useToast } from '../../Toast';

interface PatientSearchAndProfileProps {
  patients: Patient[];
  patientSearchTerm: string;
  setPatientSearchTerm: (term: string) => void;
  foundPatient: Patient | null;
  setFoundPatient: (p: Patient | null) => void;
  isSearchDropdownOpen: boolean;
  setIsSearchDropdownOpen: (open: boolean) => void;
  isRegistering: boolean;
  setIsRegistering: (reg: boolean) => void;
  newPatientData: any;
  setNewPatientData: (data: any) => void;
  formErrors: Record<string, boolean>;
  setFormErrors: (errors: any) => void;
  formatCedula: (val: string) => string;
  calculateAge: (dob: string) => string;
  filteredPatientsList: Patient[];
  handleSelectFoundPatient: (p: Patient) => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}

export const PatientSearchAndProfile: React.FC<PatientSearchAndProfileProps> = ({
  patients,
  patientSearchTerm,
  setPatientSearchTerm,
  foundPatient,
  setFoundPatient,
  isSearchDropdownOpen,
  setIsSearchDropdownOpen,
  isRegistering,
  setIsRegistering,
  newPatientData,
  setNewPatientData,
  formErrors,
  setFormErrors,
  formatCedula,
  calculateAge,
  filteredPatientsList,
  handleSelectFoundPatient,
  inputRef
}) => {
  const { toast } = useToast();
  const [showSignaturePad, setShowSignaturePad] = React.useState(false);
  const [isSigned, setIsSigned] = React.useState(false);
  return (
    <div className="w-full lg:w-[300px] xl:w-[340px] flex flex-col shrink-0 min-h-0">
      <div className="bg-slate-900/60 backdrop-blur-3xl border border-white/5 p-6 rounded-[2.5rem] shadow-2xl flex flex-col">
        <div className="mb-6 relative z-30">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Expediente</h3>
            <button
              onClick={() => {
                setIsRegistering(!isRegistering);
                if (!isRegistering) {
                  setFoundPatient(null);
                  setPatientSearchTerm('');
                }
              }}
              className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${isRegistering ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'bg-white/5 text-teal-400 hover:bg-white/10 border border-white/5'}`}
            >
              {isRegistering ? 'Cancelar' : 'Nuevo Registro'}
            </button>
          </div>

          <div className="relative flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-teal-500 absolute left-4 top-3" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Buscar por cédula o nombre..."
                value={patientSearchTerm}
                onChange={(e) => {
                  setPatientSearchTerm(e.target.value);
                  setIsSearchDropdownOpen(true);
                }}
                onFocus={() => setIsSearchDropdownOpen(true)}
                className="w-full bg-slate-950 border-2 border-slate-800 rounded-2xl pl-11 pr-4 py-2.5 text-[10px] text-white focus:border-teal-500/50 outline-none transition-all placeholder:text-slate-700 font-bold"
              />
            </div>

            <button
              onClick={() => {
                toast('Escaneando QR de Pre-Registro...', 'info', 1500);
                setTimeout(() => {
                   handleSelectFoundPatient(patients[0]);
                   toast('Paciente Pre-Registrado Cargado', 'success');
                }, 1600);
              }}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-teal-400 rounded-2xl border border-white/5 transition-all active:scale-95"
              title="Escaneo QR"
            >
              <QrCode className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                toast('Iniciando OCR de Cédula Nativo...', 'info');
              }}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-teal-400 rounded-2xl border border-white/5 transition-all active:scale-95"
              title="Escanear Cédula"
            >
              <Camera className="w-4 h-4" />
            </button>

            {isSearchDropdownOpen && filteredPatientsList.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                {filteredPatientsList.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleSelectFoundPatient(p)}
                    className="w-full flex items-center p-3 hover:bg-white/5 border-b border-white/5 last:border-0 text-left transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center mr-3 text-teal-400 font-black text-[10px]">{p.firstName.charAt(0)}</div>
                    <div>
                      <div className="text-[10px] font-black text-white uppercase">{p.firstName} {p.lastName}</div>
                      <div className="text-[8px] text-slate-500 font-mono">{p.nationalId}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-1">
          {isRegistering ? (
            <div className="space-y-4 animate-in slide-in-from-top-2">
               <div className="flex items-center space-x-3 bg-teal-500/10 p-4 rounded-2xl border border-teal-500/20">
                  <Fingerprint className="w-6 h-6 text-teal-400" />
                  <span className="text-[10px] font-black uppercase text-white leading-none">Nuevo Perfil EHR</span>
               </div>
               <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className={`text-[8px] font-black uppercase ml-1 transition-colors ${formErrors.nationalId ? 'text-rose-500' : 'text-slate-500'}`}>CÉDULA</label>
                    <input
                      type="text"
                      value={newPatientData.nationalId}
                      onChange={e => {
                        setNewPatientData({...newPatientData, nationalId: formatCedula(e.target.value)});
                        if (formErrors.nationalId) setFormErrors((prev: any) => ({...prev, nationalId: false}));
                      }}
                      placeholder="Ej. 8-123-4567"
                      className={`w-full bg-slate-950 border ${formErrors.nationalId ? 'border-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.2)]' : 'border-slate-800'} rounded-lg px-2 py-2 text-[10px] text-white outline-none focus:border-teal-500/50 transition-all`}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className={`text-[8px] font-black uppercase ml-1 transition-colors ${formErrors.dob ? 'text-rose-500' : 'text-slate-500'}`}>F. Nac.</label>
                    <input
                      type="date"
                      value={newPatientData.dob}
                      onChange={e => {
                        setNewPatientData({...newPatientData, dob: e.target.value});
                        if (formErrors.dob) setFormErrors((prev: any) => ({...prev, dob: false}));
                      }}
                      onFocus={(e) => (e.target as any).showPicker?.()}
                      className={`w-full bg-slate-950 border ${formErrors.dob ? 'border-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.2)]' : 'border-slate-800'} rounded-lg px-2 py-2 text-[10px] text-white outline-none focus:border-rose-500/50 transition-all`}
                    />
                  </div>
               </div>
               <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Nombres"
                    value={newPatientData.firstName}
                    onChange={e => {
                      setNewPatientData({...newPatientData, firstName: e.target.value});
                      if (formErrors.firstName) setFormErrors((prev: any) => ({...prev, firstName: false}));
                    }}
                    className={`w-full bg-slate-950 border ${formErrors.firstName ? 'border-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.2)]' : 'border-slate-800'} rounded-lg px-2 py-2 text-[10px] text-white outline-none focus:border-teal-500/50 transition-all`}
                  />
                  <input
                    type="text"
                    placeholder="Apellidos"
                    value={newPatientData.lastName}
                    onChange={e => {
                      setNewPatientData({...newPatientData, lastName: e.target.value});
                      if (formErrors.lastName) setFormErrors((prev: any) => ({...prev, lastName: false}));
                    }}
                    className={`w-full bg-slate-950 border ${formErrors.lastName ? 'border-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.2)]' : 'border-slate-800'} rounded-lg px-2 py-2 text-[10px] text-white outline-none focus:border-teal-500/50 transition-all`}
                  />
               </div>
               <div className="grid grid-cols-2 gap-2">
                  <select value={newPatientData.gender} onChange={e => setNewPatientData({...newPatientData, gender: e.target.value as any})} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-2 text-[10px] text-white outline-none focus:border-teal-500/50 transition-all"><option value="M">MAS</option><option value="F">FEM</option></select>
                  <div className="bg-teal-500/10 border border-teal-500/20 rounded-lg px-2 py-2 text-[10px] text-teal-400 font-black text-center">{calculateAge(newPatientData.dob)}</div>
               </div>
               <div className="grid grid-cols-2 gap-2">
                  <input type="text" placeholder="Sangre" value={newPatientData.bloodType} onChange={e => setNewPatientData({...newPatientData, bloodType: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-2 text-[10px] text-white outline-none focus:border-teal-500/50 transition-all" />
                  <input type="text" placeholder="Celular" value={newPatientData.phone} onChange={e => setNewPatientData({...newPatientData, phone: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-2 text-[10px] text-white outline-none focus:border-teal-500/50 transition-all" />
               </div>
               <div className="grid grid-cols-2 gap-2">
                  <input type="text" placeholder="Peso(kg)" value={newPatientData.weight} onChange={e => setNewPatientData({...newPatientData, weight: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-2 text-[10px] text-white outline-none focus:border-teal-500/50 transition-all" />
                  <input type="text" placeholder="Talla(cm)" value={newPatientData.height} onChange={e => setNewPatientData({...newPatientData, height: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-2 text-[10px] text-white outline-none focus:border-teal-500/50 transition-all" />
               </div>
               <textarea placeholder="Dirección..." value={newPatientData.address} onChange={e => setNewPatientData({...newPatientData, address: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-2 text-[10px] text-white h-16 resize-none outline-none focus:border-teal-500/50 transition-all" />
               <textarea placeholder="Ayuno / Méd..." value={newPatientData.clinicalNotes} onChange={e => setNewPatientData({...newPatientData, clinicalNotes: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-2 text-[10px] text-white h-16 resize-none outline-none focus:border-teal-500/50 transition-all" />

               {/* Paperless Consent Section */}
               <div className="pt-2">
                 <button
                  onClick={() => setShowSignaturePad(true)}
                  className={`w-full p-3 rounded-2xl border-2 flex items-center justify-between transition-all ${isSigned ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400' : 'bg-slate-950 border-white/5 text-slate-500 hover:border-teal-500/30'}`}
                 >
                   <div className="flex items-center space-x-2">
                     {isSigned ? <ShieldCheck className="w-4 h-4" /> : <PenTool className="w-4 h-4" />}
                     <span className="text-[9px] font-black uppercase tracking-widest">{isSigned ? 'Consentimiento Firmado' : 'Firma Consentimiento Ley 81'}</span>
                   </div>
                   {!isSigned && <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>}
                 </button>
               </div>

               {/* Simulated Signature Pad Modal */}
               {showSignaturePad && (
                 <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
                    <div className="bg-slate-900 border border-white/10 rounded-[2.5rem] p-8 max-w-sm w-full space-y-6 shadow-2xl">
                       <div className="text-center space-y-2">
                          <h4 className="text-white font-black uppercase tracking-widest text-sm">Firma del Paciente</h4>
                          <p className="text-[9px] text-slate-500 leading-relaxed uppercase font-bold">Autorizo el tratamiento de mis datos personales según Ley 81 de Panamá.</p>
                       </div>
                       <div className="bg-slate-950 border-2 border-slate-800 rounded-2xl h-48 flex items-center justify-center relative overflow-hidden group cursor-crosshair">
                          <div className="absolute inset-0 opacity-10 flex items-center justify-center pointer-events-none">
                             <PenTool className="w-12 h-12 text-white" />
                          </div>
                          <div className="w-full h-full p-4 flex items-center justify-center" onClick={() => setIsSigned(true)}>
                             {isSigned ? (
                               <div className="text-teal-400 font-mono text-sm italic border-b-2 border-teal-400/50 pb-1">Rubén Abrego ✓</div>
                             ) : (
                               <p className="text-slate-700 text-[8px] uppercase font-black">Toque para firmar (Simulado)</p>
                             )}
                          </div>
                       </div>
                       <div className="grid grid-cols-2 gap-3">
                          <button onClick={() => { setIsSigned(false); setShowSignaturePad(false); }} className="py-3 bg-white/5 hover:bg-white/10 text-slate-400 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all">Cancelar</button>
                          <button onClick={() => { if(isSigned) setShowSignaturePad(false); else toast('Debe firmar para continuar', 'warning'); }} className="py-3 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all">Confirmar</button>
                       </div>
                    </div>
                 </div>
               )}
            </div>
          ) : foundPatient ? (
            <div className="space-y-6 animate-in fade-in flex flex-col">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-slate-950 shadow-xl shrink-0"><User className="w-7 h-7" /></div>
                <div className="min-w-0">
                  <div className="font-black text-white text-base leading-none uppercase truncate mb-1.5">{foundPatient.firstName} <br/> {foundPatient.lastName}</div>
                  <div className="text-[10px] text-teal-400 font-mono font-black italic">Cédula: {foundPatient.nationalId}</div>
                </div>
              </div>
              <div className="flex-1 space-y-3 pt-6 border-t border-white/5 overflow-y-auto">
                 <div className="flex items-center text-[10px] text-slate-400 font-bold bg-white/5 p-3 rounded-2xl"><Smartphone className="w-3.5 h-3.5 mr-3 text-teal-500" /> {foundPatient.phone}</div>
                 <div className="flex items-start text-[10px] text-slate-400 font-bold bg-white/5 p-3 rounded-2xl leading-tight"><MapPin className="w-3.5 h-3.5 mr-3 text-teal-500 shrink-0 mt-0.5" /> <span>{foundPatient.address || 'Panamá'}</span></div>
                 <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white/5 p-2 rounded-xl text-center"><span className="text-[7px] text-slate-600 uppercase block">Nacionalidad</span><span className="text-[9px] text-white font-black">{foundPatient.nationality || 'Panameña'}</span></div>
                    <div className="bg-white/5 p-2 rounded-xl text-center"><span className="text-[7px] text-slate-600 uppercase block">Edad Actual</span><span className="text-[9px] text-white font-black">{calculateAge(foundPatient.dob)}</span></div>
                 </div>
              </div>
            </div>
          ) : (
            <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 bg-slate-950 rounded-full flex items-center justify-center border border-white/5 text-slate-800">
                <UserSearch className="w-8 h-8" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Sin paciente seleccionado</p>
                <p className="text-[8px] text-slate-600 uppercase font-bold mt-1">Busca un expediente o crea uno nuevo</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
