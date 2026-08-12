import React, { useState } from 'react';
import { Patient, Order, TestResult } from '../types';
import {
  User, FileText, Calendar, ChevronRight, Search,
  Download, Clock, CheckCircle2, Shield, Heart, MapPin, Phone
} from 'lucide-react';

interface PatientResultsPortalProps {
  patients: Patient[];
  orders: Order[];
  results: TestResult[];
  onOpenPdf: (orderId: string) => void;
}

export const PatientResultsPortal: React.FC<PatientResultsPortalProps> = ({
  patients,
  orders,
  results,
  onOpenPdf
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const calculateAge = (dob: string) => {
    if (!dob) return '---';
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return `${age} Años`;
  };

  const filteredPatients = patients.filter(p =>
    p.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.nationalId.includes(searchTerm)
  );

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      {/* Search Bar - Elegant Floating Design */}
      <div className="max-w-2xl mx-auto">
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-teal-500 to-blue-500 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
          <div className="relative bg-slate-900 border border-slate-800 rounded-2xl flex items-center px-6 py-4">
            <Search className="w-5 h-5 text-teal-400 shrink-0" />
            <input
              type="text"
              placeholder="Buscar paciente por nombre, apellido o cédula..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-none focus:ring-0 w-full ml-4 text-white placeholder-slate-500 font-medium"
            />
          </div>
        </div>
      </div>

      {/* Patients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {filteredPatients.map(patient => {
          const patientOrders = orders.filter(o => o.patientId === patient.id);

          return (
            <div key={patient.id} className="group bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[3rem] p-8 hover:bg-slate-800/60 transition-all duration-500 shadow-2xl">
              {/* Patient Header */}
              <div className="flex items-start justify-between mb-8">
                <div className="flex items-center space-x-5">
                  <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-tr from-teal-400 to-emerald-500 flex items-center justify-center text-slate-950 shadow-xl group-hover:scale-110 transition-transform duration-500">
                    <User className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white tracking-tight">{patient.firstName} {patient.lastName}</h3>
                    <div className="flex flex-wrap items-center gap-3 mt-1.5">
                      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-teal-400 bg-teal-400/10 px-3 py-1 rounded-lg border border-teal-500/20">
                        Cédula: {patient.nationalId}
                      </span>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center">
                        <Heart className="w-3.5 h-3.5 mr-1.5 text-rose-500" />
                        {patient.gender === 'F' ? 'Femenino' : 'Masculino'}
                      </span>
                      <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest flex items-center bg-white/5 px-2 py-1 rounded-lg">
                        <Clock className="w-3.5 h-3.5 mr-1.5 text-blue-400" />
                        Edad Actual: {calculateAge(patient.dob)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-black text-slate-400 uppercase tracking-widest">Estado</div>
                  <div className="flex items-center justify-end space-x-1 mt-1">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-[10px] font-black text-emerald-400 uppercase">Verificado</span>
                  </div>
                </div>
              </div>

              {/* Patient Demographics Mini-Grid */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-slate-950/50 rounded-2xl p-4 border border-white/[0.03]">
                  <div className="flex items-center space-x-2 text-slate-500 mb-1">
                    <Phone className="w-3 h-3" />
                    <span className="text-[9px] font-black uppercase tracking-widest">Contacto</span>
                  </div>
                  <div className="text-xs font-bold text-slate-200">{patient.phone}</div>
                </div>
                <div className="bg-slate-950/50 rounded-2xl p-4 border border-white/[0.03]">
                  <div className="flex items-center space-x-2 text-slate-500 mb-1">
                    <MapPin className="w-3 h-3" />
                    <span className="text-[9px] font-black uppercase tracking-widest">Ubicación</span>
                  </div>
                  <div className="text-xs font-bold text-slate-200 truncate">Panamá, Rep. de Panamá</div>
                </div>
              </div>

              {/* Results Summary Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Últimos Resultados</h4>
                  <span className="text-[9px] font-bold text-slate-600 bg-slate-950 px-2 py-0.5 rounded-full border border-white/5">
                    {patientOrders.length} Órdenes
                  </span>
                </div>

                <div className="space-y-3">
                  {patientOrders.slice(0, 1).map(order => {
                    const orderResults = results.filter(r => r.orderId === order.id);
                    return (
                      <div key={order.id} className="space-y-3">
                        <button
                          onClick={() => onOpenPdf(order.id)}
                          className="w-full flex items-center justify-between p-4 rounded-2xl bg-slate-950/30 border border-white/5 hover:border-teal-500/30 hover:bg-slate-950/50 transition-all group/item"
                        >
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-slate-500 group-hover/item:text-teal-400 transition-colors">
                              <FileText className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                              <div className="font-bold text-slate-200 text-xs">{order.orderNumber}</div>
                              <div className="flex items-center space-x-3 mt-0.5">
                                <div className="text-[10px] text-slate-500 font-medium flex items-center">
                                  <Calendar className="w-3 h-3 mr-1" />
                                  {new Date(order.createdAt).toLocaleDateString('es-PA')}
                                </div>
                                <div className="text-[9px] font-black text-amber-500/80 uppercase tracking-tighter">
                                  Edad en Examen: {order.patientAge} Años
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-[9px] font-black uppercase tracking-tighter border border-emerald-500/20">
                              Listo
                            </span>
                            <ChevronRight className="w-4 h-4 text-slate-600 group-hover/item:text-teal-400 group-hover/item:translate-x-1 transition-all" />
                          </div>
                        </button>

                        {/* Micro-preview of results */}
                        <div className="px-2 space-y-2">
                          {orderResults.slice(0, 2).map(res => (
                            <div key={res.id} className="flex flex-col space-y-1 p-2 rounded-xl bg-slate-950/20 border border-white/5">
                              <div className="flex items-center justify-between text-[10px]">
                                <span className="font-bold text-slate-300">{res.parameterName}</span>
                                <span className="font-black text-white font-mono">{res.value} {res.unit}</span>
                              </div>
                              <div className="flex items-center justify-between text-[8px] uppercase tracking-widest text-slate-500">
                                <span>Ref: {res.refRangeText}</span>
                                <span>Muestra: {res.specimenType || 'SANGRE'}</span>
                              </div>
                              {res.interpretation && (
                                <p className="text-[9px] text-teal-500 italic line-clamp-1 border-t border-white/5 pt-1 mt-1">
                                  "{res.interpretation}"
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}

                  {patientOrders.length > 2 && (
                    <button className="w-full py-2.5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-teal-400 transition-colors">
                      Ver historial completo (+{patientOrders.length - 2} más)
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
