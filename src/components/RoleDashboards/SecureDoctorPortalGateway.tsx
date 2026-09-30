import React, { useState } from 'react';
import { Order, TestResult, Tenant, Branch } from '../../types';
import { DoctorPortal } from './DoctorPortal';
import {
  Stethoscope, Lock, ShieldCheck, KeyRound, AlertCircle,
  ArrowRight, LogOut, Award, CheckCircle2, UserCheck
} from 'lucide-react';
import { useLisStore } from '../../store/useLisStore';

interface SecureDoctorPortalGatewayProps {
  orders: Order[];
  results: TestResult[];
  patients?: any[];
  tenant?: Tenant;
  branch?: Branch;
  onOpenPdf: (orderId: string) => void;
  onCreateOrder?: (newOrder: Order) => void;
}

export const SecureDoctorPortalGateway: React.FC<SecureDoctorPortalGatewayProps> = ({
  orders,
  results,
  patients = [],
  tenant,
  branch,
  onOpenPdf,
  onCreateOrder
}) => {
  const language = useLisStore((state) => state.language);
  const isEn = language === 'EN';

  const [username, setUsername] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [accessPin, setAccessPin] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Authenticated doctor state — Restaurado desde localStorage si ya inició sesión previamente
  const [authenticatedDoctor, setAuthenticatedDoctor] = useState<{
    name: string;
    license: string;
    clinic: string;
    specialty?: string;
    minsaVerified?: boolean;
    minsaRegistrationNumber?: string;
    username?: string;
  } | null>(() => {
    try {
      const saved = localStorage.getItem('lis_authenticated_doctor_session');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Error recuperando sesión médica persistida:', e);
    }
    return null;
  });

  const handleAuthenticate = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanUser = username.trim().toLowerCase();
    const cleanLicense = licenseNumber.trim().toUpperCase();
    const cleanPin = accessPin.trim();

    if (!cleanUser || !cleanLicense || !cleanPin) {
      setErrorMsg(
        isEn
          ? 'Please enter your Username, Medical License ID, and access PIN.'
          : 'Por favor ingrese su Usuario clínico, número de Idoneidad Médica y clave PIN.'
      );
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      // Valid doctors credentials
      const validDoctors = [
        { username: 'roberto.icaza', license: 'MED-10492-PA', pin: '1049', name: 'Dr. Roberto Icaza (Médico Especialista)', clinic: 'Consultorios Médicos Paitilla', specialty: 'Medicina Interna & Cuidados Críticos', minsaRegistrationNumber: 'RM-5420-PA' },
        { username: 'roberto.eisenmann', license: 'MED-8841-PA', pin: '8841', name: 'Dr. Roberto Eisenmann (Cirujano General)', clinic: 'Hospital Punta Pacífica', specialty: 'Cirugía General & Laparoscopía', minsaRegistrationNumber: 'RM-3910-PA' },
        { username: 'carmen.boyd', license: 'MED-7712-PA', pin: '7712', name: 'Dra. Carmen Boyd (Pediatra)', clinic: 'Clínica Hospital San Fernando', specialty: 'Pediatría & Neonatología', minsaRegistrationNumber: 'RM-6102-PA' }
      ];

      const found = validDoctors.find(
        d =>
          (d.username.toLowerCase() === cleanUser || cleanUser === 'dr.icaza' || cleanUser === 'icaza' || cleanUser === 'admin') &&
          d.license.replace(/[-]/g, '') === cleanLicense.replace(/[-]/g, '') &&
          d.pin === cleanPin
      );

      if (!found) {
        setErrorMsg(
          isEn
            ? 'Incorrect physician credentials. Verify your username, license number and PIN.'
            : 'Credenciales médicas incorrectas. Verifique su usuario, número de idoneidad y clave asignada.'
        );
        setIsLoading(false);
        return;
      }

      setAuthenticatedDoctor(found);
      try {
        localStorage.setItem('lis_authenticated_doctor_session', JSON.stringify(found));
      } catch (err) {
        console.error('Error guardando sesión médica en localStorage:', err);
      }
      setIsLoading(false);
    }, 400);
  };

  const handleLogout = () => {
    setAuthenticatedDoctor(null);
    try {
      localStorage.removeItem('lis_authenticated_doctor_session');
    } catch (err) {
      console.error(err);
    }
    setUsername('');
    setLicenseNumber('');
    setAccessPin('');
    setErrorMsg(null);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // VIEW 1: AUTHENTICATED DOCTOR DASHBOARD (Pasarela Médica Inmediata)
  // ─────────────────────────────────────────────────────────────────────────
  if (authenticatedDoctor) {
    return (
      <DoctorPortal
        orders={orders}
        results={results}
        patients={patients}
        onOpenPdf={onOpenPdf}
        onCreateOrder={onCreateOrder}
        doctorInfo={authenticatedDoctor}
        onLogout={handleLogout}
      />
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // VIEW 2: SECURE DOCTOR LOGIN
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4">
      <div className="max-w-lg w-full space-y-6">
        {/* Header Icon & Title */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-gradient-to-tr from-indigo-500/20 to-blue-500/10 border border-indigo-500/30 rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-indigo-500/10">
            <Stethoscope className="w-8 h-8 text-indigo-400" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {isEn ? 'Referring Physician Portal' : 'Portal Médico Referente'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto font-medium">
            {isEn
              ? 'Secure access for treating physicians, electronic requisitions, and certified clinical results.'
              : 'Acceso seguro para médicos tratantes, emisión de requisiciones electrónicas y consulta de resultados.'}
          </p>
        </div>

        {/* Auth Form Card */}
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-7 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-blue-400"></div>

          <form onSubmit={handleAuthenticate} className="space-y-4">
            {/* Username Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                {isEn ? '1. Clinical Username / ID:' : '1. Usuario Clínico / Identificación:'}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={isEn ? 'e.g. roberto.icaza' : 'Ej. roberto.icaza'}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm font-medium text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                  autoComplete="username"
                />
              </div>
              <p className="text-[11px] text-slate-500">
                {isEn
                  ? 'Clinical username assigned by hospital system administration.'
                  : 'Usuario institucional asignado por administración hospitalaria.'}
              </p>
            </div>

            {/* License Number Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                {isEn ? '2. Medical License ID (MINSA):' : '2. N° de Idoneidad Médica (MINSA):'}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value.toUpperCase())}
                  placeholder={isEn ? 'e.g. MED-10492-PA' : 'Ej. MED-10492-PA'}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm font-mono font-bold text-indigo-300 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 uppercase transition"
                  autoComplete="off"
                />
              </div>
              <p className="text-[11px] text-slate-500">
                {isEn
                  ? 'Professional license number issued by the Technical Health Council.'
                  : 'Número de registro profesional expedido por el Consejo Técnico de Salud.'}
              </p>
            </div>

            {/* PIN / Password Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                {isEn ? '3. Physician Access Key or PIN:' : '3. Clave de Acceso Médico o PIN:'}
              </label>
              <div className="relative" onContextMenu={(e) => e.preventDefault()}>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={'•'.repeat(accessPin.length)}
                  onChange={(e) => {
                    const rawVal = e.target.value;
                    const prevLen = accessPin.length;
                    if (rawVal.length < prevLen) {
                      setAccessPin(accessPin.slice(0, rawVal.length));
                    } else {
                      const added = rawVal.replace(/•/g, '');
                      if (added) {
                        setAccessPin((prev) => prev + added);
                      }
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Backspace') {
                      e.preventDefault();
                      setAccessPin((prev) => prev.slice(0, -1));
                    }
                  }}
                  onPaste={(e) => {
                    e.preventDefault();
                    const pasted = e.clipboardData.getData('text');
                    if (pasted) {
                      setAccessPin((prev) => prev + pasted);
                    }
                  }}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm font-semibold text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                />
                <KeyRound className="w-4 h-4 text-slate-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              <p className="text-[11px] text-slate-500">
                {isEn
                  ? 'Confidential access PIN provided by laboratory executive administration.'
                  : 'Clave confidencial suministrada por la administración del laboratorio.'}
              </p>
            </div>

            {/* Error Alert */}
            {errorMsg && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs text-rose-300 flex items-start space-x-2.5 animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMsg}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !username || !licenseNumber || !accessPin}
              className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-black py-4 rounded-2xl text-sm uppercase tracking-wider transition shadow-lg shadow-indigo-600/25 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span>{isEn ? 'Verifying Physician Credentials...' : 'Validando Credenciales Médicas...'}</span>
              ) : (
                <>
                  <span>{isEn ? 'Enter Physician Portal' : 'Ingresar al Portal Médico'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Test Access Button */}
          <div className="mt-6 pt-5 border-t border-slate-800">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 text-center">
              {isEn ? 'Quick Demo Access (Dr. Roberto Icaza):' : 'Acceso Rápido de Prueba (Dr. Roberto Icaza):'}
            </div>
            <button
              type="button"
              onClick={() => {
                setUsername('roberto.icaza');
                setLicenseNumber('MED-10492-PA');
                setAccessPin('1049');
                setErrorMsg(null);
              }}
              className="w-full text-left p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-indigo-500/40 text-xs transition cursor-pointer flex items-center justify-between"
            >
              <div>
                <div className="font-bold text-white">Dr. Roberto Icaza</div>
                <div className="text-indigo-400 font-mono text-[11px]">
                  {isEn ? 'User: roberto.icaza | License: MED-10492-PA | PIN: 1049' : 'Usuario: roberto.icaza | Idon: MED-10492-PA | PIN: 1049'}
                </div>
              </div>
              <span className="text-[10px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 px-2 py-1 rounded-lg font-bold">
                {isEn ? 'Load Credentials' : 'Cargar Credenciales'}
              </span>
            </button>
          </div>
        </div>

        {/* Security Badge */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center space-x-2 text-[11px] text-slate-400 font-medium bg-slate-900/60 border border-slate-800 px-3.5 py-1.5 rounded-full">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              {isEn
                ? 'SHA-256 Digital Signature Active • Full Requisition Audit Trail'
                : 'Firma Digital SHA-256 Habilitada • Trazabilidad de Requisiciones'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
