"use client";

import { useState } from "react";
import { useI18n } from "@/lib/I18nContext";
import { Heart, Copy, Check } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SupportModal({ isOpen, onClose }: SupportModalProps) {
  const { t, language } = useI18n();
  const [copied, setCopied] = useState(false);
  
  const pixKey = "998f5509-a89d-4b95-8ae2-9bb00ca3c8ce";
  const pixCopyPasteCode = "00020126880014BR.GOV.BCB.PIX0136998f5509-a89d-4b95-8ae2-9bb00ca3c8ce0226Muito obrigado pelo apoio!5204000053039865802BR5925Luan Antoni Taraschi Ramo6009SAO PAULO62140510qcsVJz4z986304252C";

  if (!isOpen) return null;

  const handleCopyPix = async () => {
    try {
      await navigator.clipboard.writeText(pixCopyPasteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-md bg-[#200268]/95 backdrop-blur-xl border-[3px] border-[#D64DC2]/50 rounded-[32px] shadow-2xl p-6 md:p-8 animate-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/5 hover:bg-white/20 flex items-center justify-center text-white font-londrina text-xl transition-all hover:scale-105"
          title={t('close')}
        >
          X
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#FF577B]/20 text-[#FF577B] mb-4">
            <Heart size={32} fill="currentColor" />
          </div>
          <h2 className="font-londrina text-4xl text-white tracking-widest">{t('supportTitle')}</h2>
          <p className="font-balsamiq text-white/80 mt-2 text-lg leading-relaxed">
            {t('supportMessage')}
          </p>
        </div>

        <div className="space-y-6">
          {/* PIX Section - Only for PT */}
          {language === 'pt' && (
            <div className="bg-white/5 rounded-2xl p-4 border border-white/10 flex flex-col items-center">
              <div className="bg-white rounded-xl flex items-center justify-center mb-4 p-3 shadow-inner">
                <QRCodeSVG 
                  value={pixCopyPasteCode} 
                  size={160} 
                  level="M" 
                  includeMargin={false} 
                />
              </div>
              
              <div className="w-full">
                <label className="font-oswald text-white/60 text-sm uppercase tracking-wider mb-2 block text-center">
                  {t('pixKey')}
                </label>
                <div className="flex bg-black/40 rounded-full border border-white/10 overflow-hidden mb-4">
                  <input 
                    type="text" 
                    readOnly 
                    value={pixKey}
                    className="flex-1 bg-transparent px-4 py-3 font-mono text-sm text-center text-white/90 outline-none"
                  />
                  <button 
                    onClick={handleCopyPix}
                    className="bg-[#4DDBA8] hover:bg-[#3bc291] text-[#200268] font-londrina px-6 transition-colors flex items-center gap-2"
                  >
                    {copied ? <Check size={18} /> : <Copy size={18} />}
                    {copied ? t('pixKeyCopied') : "Copia e Cola"}
                  </button>
                </div>

                {/* Botão Nubank */}
                <a 
                  href="https://nubank.com.br/cobrar/12kdqf/69b978ef-7b9c-468e-b001-28e6b786f0ad" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block text-center bg-purple-600 hover:bg-purple-700 text-white w-full rounded-full py-3 font-londrina text-xl tracking-wide transition-colors shadow-md"
                >
                  Pagar com link Nubank
                </a>
              </div>
            </div>
          )}

          {/* PayPal Section */}
          <button 
            onClick={() => window.open("https://paypal.com", "_blank")}
            className="w-full bg-[#00B8EB] hover:bg-[#009ac7] text-[#200268] font-londrina text-2xl py-4 rounded-full transition-transform hover:scale-[1.02] flex items-center justify-center gap-3"
          >
            {t('donatePayPal')}
          </button>

          {/* Optional: Donor Code Hook */}
          <div className="pt-4 border-t border-white/10">
            <label className="font-oswald text-white/60 text-sm uppercase tracking-wider mb-2 block">
              {t('donorCode')}
            </label>
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder={t('donorCodePlaceholder')}
                className="flex-1 bg-black/40 border border-white/10 rounded-full px-4 py-2 font-balsamiq text-white outline-none focus:border-[#D64DC2]"
              />
              <button className="bg-white/10 hover:bg-white/20 text-white font-londrina px-4 rounded-full transition-colors">
                OK
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
