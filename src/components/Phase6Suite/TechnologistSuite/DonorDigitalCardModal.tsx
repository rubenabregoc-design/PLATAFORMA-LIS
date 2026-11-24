import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Heart,
  QrCode,
  Award,
  Sparkles,
  Calendar,
  Share2,
  Printer,
  Download,
  ShieldCheck,
  Droplet,
  User,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCw
} from 'lucide-react';
import QRCode from 'qrcode';

export interface DonorDigitalCardProps {
  donor?: {
    id?: string;
    fullName?: string;
    nationalId?: string;
    bloodType?: string;
    rhFactor?: string;
    phenotype?: string;
    gender?: 'M' | 'F';
    lastDonationDate?: string;
    totalDonations?: number;
    eligibilityStatus?: 'ELIGIBLE' | 'TEMPORARY_DEFERRAL' | 'PERMANENT_DEFERRAL';
    deferralReason?: string;
    institution?: string;
  };
  onClose: () => void;
}

export const DonorDigitalCardModal: React.FC<DonorDigitalCardProps> = ({
  donor = {
    id: 'DON-PA-2026-8841',
    fullName: 'Roberto Carlos Mendoza',
    nationalId: '8-765-4321',
    bloodType: 'O',
    rhFactor: 'POS',
    phenotype: 'C+ c+ E- e+ K- (Kell Neg)',
    gender: 'M',
    lastDonationDate: '2026-06-15',
    totalDonations: 6,
    eligibilityStatus: 'ELIGIBLE',
    institution: 'Banco de Sangre CSS • Complejo Metropolitano'
  },
  onClose
}) => {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [isFlipped, setIsFlipped] = useState<boolean>(false);

  const fullName = donor.fullName || 'Donante Altruista';
  const nationalId = donor.nationalId || '8-000-0000';
  const bloodType = donor.bloodType || 'O';
  const rhFactor = donor.rhFactor || 'POS';
  const isPositive = rhFactor.toUpperCase().includes('POS') || rhFactor.includes('+');
  const bloodLabel = `${bloodType} ${isPositive ? 'Rh (+)' : 'Rh (-)'}`;
  const totalDonations = donor.totalDonations || 4;
  const livesSaved = totalDonations * 3;
  const donorCode = donor.id || `DON-PA-${nationalId.replace(/-/g, '').slice(-4)}`;

  // Donor Tier calculation
  const getDonorTier = (count: number) => {
    if (count >= 10) return { name: 'Altruista Platino / Héroe de Vida', color: 'from-amber-400 to-yellow-600', badge: 'PLATINO' };
    if (count >= 6) return { name: 'Altruista de Honor (Oro)', color: 'from-yellow-400 to-amber-500', badge: 'ORO' };
    if (count >= 3) return { name: 'Donante Frecuente (Plata)', color: 'from-slate-300 to-slate-400', badge: 'PLATA' };
    return { name: 'Donante Solidario (Bronce)', color: 'from-amber-700 to-amber-900', badge: 'BRONCE' };
  };
  const tier = getDonorTier(totalDonations);

  // Eligibility calculation (90 days for men, 120 days for women)
  const calculateEligibility = () => {
    if (donor.eligibilityStatus === 'PERMANENT_DEFERRAL') {
      return {
        status: 'PERMANENT_DEFERRAL',
        label: 'Diferimiento Permanente',
        daysLeft: 0,
        color: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
        message: donor.deferralReason || 'Causa médica no elegible.'
      };
    }
    if (donor.eligibilityStatus === 'TEMPORARY_DEFERRAL') {
      return {
        status: 'TEMPORARY_DEFERRAL',
        label: 'Diferimiento Transitorio',
        daysLeft: 14,
        color: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        message: donor.deferralReason || 'En período de recuperación.'
      };
    }

    const intervalDays = donor.gender === 'F' ? 120 : 90;
    if (!donor.lastDonationDate) {
      return {
        status: 'ELIGIBLE',
        label: 'Elegible para Donar Hoy',
        daysLeft: 0,
        color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        message: '¡Listo para salvar hasta 3 vidas hoy mismo!'
      };
    }

    const last = new Date(donor.lastDonationDate).getTime();
    const now = Date.now();
    const diffDays = Math.floor((now - last) / (1000 * 60 * 60 * 24));
    const remaining = intervalDays - diffDays;

    if (remaining <= 0) {
      return {
        status: 'ELIGIBLE',
        label: 'Elegible para Donar Hoy',
        daysLeft: 0,
        color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        message: 'Cumple el período reglamentario de reposo hematológico.'
      };
    } else {
      return {
        status: 'WAITING',
        label: `Próxima Donación en ${remaining} días`,
        daysLeft: remaining,
        color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
        message: `Intervalo MINSA: ${intervalDays} días entre colectas.`
      };
    }
  };
  const eligibility = calculateEligibility();

  // Generate QR Code
  useEffect(() => {
    const payload = JSON.stringify({
      system: 'PLATAFORMA-LIS-PANAMA',
      type: 'DIGITAL_DONOR_CREDENTIAL',
      donorCode,
      cedula: nationalId,
      name: fullName,
      bloodGroup: `${bloodType}${isPositive ? '+' : '-'}`,
      phenotype: donor.phenotype || 'N/A',
      donations: totalDonations,
      eligibility: eligibility.status,
      verified: true
    });

    QRCode.toDataURL(payload, {
      width: 280,
      margin: 1.5,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    })
      .then(url => setQrCodeDataUrl(url))
      .catch(err => console.error('Error generating donor QR:', err));
  }, [donorCode, nationalId, fullName, bloodType, isPositive, totalDonations, eligibility.status]);

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `🩸 *Mi Carnet Digital de Donante Altruista*\n\nSoy donante voluntario grupo *${bloodLabel}* con ${totalDonations} donaciones realizadas y he ayudado a salvar ${livesSaved} vidas en Panamá.\n\n¡Súmate tú también a la donación voluntaria de sangre!`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return typeof document !== 'undefined'
    ? createPortal(
        <div className="fixed inset-0 z-[110] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col text-slate-100">
            
            {/* Modal Top Header */}
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Droplet className="w-5 h-5 text-rose-500 fill-rose-500" />
                <span className="font-black text-sm text-white uppercase tracking-wider">
                  Carnet Digital de Donante Altruista
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setIsFlipped(!isFlipped)}
                  className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs text-slate-300 rounded-xl transition flex items-center gap-1 cursor-pointer"
                  title="Girar carnet"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>{isFlipped ? 'Ver Anverso' : 'Ver Reverso QR'}</span>
                </button>
                <button
                  onClick={onClose}
                  className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body / Digital Card */}
            <div className="p-6 flex flex-col items-center">
              
              {/* Virtual Plastic ID Card (Anverso / Front) */}
              {!isFlipped ? (
                <div className="w-full max-w-[420px] aspect-[1.586] rounded-3xl bg-gradient-to-br from-rose-950 via-slate-900 to-slate-950 border-2 border-rose-500/40 p-5 shadow-2xl relative overflow-hidden flex flex-col justify-between select-none">
                  
                  {/* Decorative Elements */}
                  <div className="absolute -top-16 -right-16 w-44 h-44 bg-rose-600/20 rounded-full blur-3xl pointer-events-none" />
                  <div className="absolute -bottom-16 -left-16 w-44 h-44 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

                  {/* Card Header */}
                  <div className="flex items-start justify-between relative z-10">
                    <div>
                      <div className="text-[9px] font-mono font-black uppercase tracking-widest text-rose-400">
                        REPÚBLICA DE PANAMÁ • MINSA / CSS
                      </div>
                      <div className="text-xs font-black text-white tracking-wide uppercase">
                        Programa Nacional de Sangre
                      </div>
                      <div className="text-[9px] text-slate-400 font-medium">
                        {donor.institution || 'Banco de Sangre Central'}
                      </div>
                    </div>

                    {/* Blood Type Badge */}
                    <div className="bg-gradient-to-tr from-rose-600 to-red-500 text-white px-3.5 py-1.5 rounded-2xl shadow-lg shadow-rose-600/40 text-center border border-rose-400/50">
                      <div className="text-xl font-black leading-tight">{bloodLabel}</div>
                      <div className="text-[8px] font-mono uppercase tracking-wider font-bold opacity-90">ABO / Rh</div>
                    </div>
                  </div>

                  {/* Card Body - Name & Details */}
                  <div className="relative z-10 my-2 space-y-1">
                    <span className="text-[9px] font-mono uppercase text-slate-400 tracking-wider">Donante Voluntario</span>
                    <h3 className="text-lg font-black text-white leading-tight uppercase tracking-tight truncate">
                      {fullName}
                    </h3>
                    <div className="flex items-center gap-4 text-xs font-mono text-slate-300">
                      <div>
                        <span className="text-[9px] text-slate-500 block">CÉDULA / ID</span>
                        <strong className="text-white">{nationalId}</strong>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-500 block">CÓDIGO DIN</span>
                        <strong className="text-cyan-300">{donorCode}</strong>
                      </div>
                      {donor.phenotype && (
                        <div>
                          <span className="text-[9px] text-slate-500 block">FENOTIPO</span>
                          <strong className="text-amber-300 text-[10px]">{donor.phenotype}</strong>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Footer - Gamification & Tier */}
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between relative z-10 text-xs">
                    <div className="flex items-center space-x-2">
                      <div className="p-1.5 bg-amber-500/20 text-amber-300 rounded-xl border border-amber-500/30">
                        <Award className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block font-mono">Nivel de Donante</span>
                        <strong className="text-amber-300 font-extrabold text-[11px]">{tier.badge} • {totalDonations} Colectas</strong>
                      </div>
                    </div>

                    <div className="bg-rose-500/20 border border-rose-500/30 px-2.5 py-1 rounded-xl text-center">
                      <span className="text-[9px] text-rose-300 font-bold block flex items-center gap-1 justify-center">
                        <Heart className="w-2.5 h-2.5 fill-rose-400" />
                        <span>Vidas Salvadas</span>
                      </span>
                      <strong className="text-sm font-black text-white">~{livesSaved}</strong>
                    </div>
                  </div>

                </div>
              ) : (
                /* Virtual Plastic ID Card (Reverso / Back with QR) */
                <div className="w-full max-w-[420px] aspect-[1.586] rounded-3xl bg-slate-950 border-2 border-cyan-500/40 p-5 shadow-2xl relative overflow-hidden flex flex-col justify-between items-center select-none">
                  
                  <div className="w-full flex items-center justify-between text-[9px] font-mono text-slate-400 border-b border-slate-800 pb-1.5">
                    <span className="uppercase tracking-widest text-cyan-400 font-bold">QR DE ADMISIÓN RÁPIDA (FAST-TRACK)</span>
                    <span>VÁLIDO EN TODO PANAMÁ</span>
                  </div>

                  {/* QR Code Container */}
                  <div className="bg-white p-2 rounded-2xl shadow-xl flex items-center justify-center my-1">
                    {qrCodeDataUrl ? (
                      <img
                        src={qrCodeDataUrl}
                        alt="Código QR Donante"
                        className="w-32 h-32 object-contain"
                      />
                    ) : (
                      <div className="w-32 h-32 flex items-center justify-center text-slate-400 text-xs font-mono">
                        Generando QR...
                      </div>
                    )}
                  </div>

                  <div className="text-center space-y-0.5">
                    <div className="text-[10px] font-mono font-bold text-white">
                      Escanee este código en la ventanilla de admisión para registro directo.
                    </div>
                    <div className="text-[8px] text-slate-500 font-mono">
                      Código DIN: {donorCode} • Cédula: {nationalId}
                    </div>
                  </div>

                </div>
              )}

              {/* Eligibility Alert Banner */}
              <div className="w-full mt-5">
                <div className={`p-4 rounded-2xl border ${eligibility.color} flex items-center justify-between gap-3`}>
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-slate-950/40 rounded-xl shrink-0">
                      {eligibility.status === 'ELIGIBLE' ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <Clock className="w-5 h-5 text-cyan-400" />
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-black uppercase tracking-wider">{eligibility.label}</div>
                      <div className="text-[11px] opacity-90 mt-0.5">{eligibility.message}</div>
                    </div>
                  </div>
                  {donor.lastDonationDate && (
                    <span className="text-[10px] font-mono font-bold opacity-80 shrink-0">
                      Última: {donor.lastDonationDate}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-3 gap-2.5 w-full mt-5">
                <button
                  onClick={() => setIsFlipped(!isFlipped)}
                  className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-2xl border border-slate-700 transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>{isFlipped ? 'Ver Anverso' : 'Girar al QR'}</span>
                </button>

                <button
                  onClick={handleShareWhatsApp}
                  className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-2xl shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </button>

                <button
                  onClick={() => window.print()}
                  className="py-2.5 px-3 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-2xl shadow-lg shadow-rose-600/20 transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir</span>
                </button>
              </div>

            </div>

          </div>
        </div>,
        document.body
      )
    : null;
};
