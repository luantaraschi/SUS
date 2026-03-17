"use client";

import { useI18n } from "@/lib/I18nContext";

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'terms' | 'privacy';
}

export function LegalModal({ isOpen, onClose, type }: LegalModalProps) {
  const { t } = useI18n();

  if (!isOpen) return null;

  const title = type === 'terms' ? t('termsTitle') : t('privacyTitle');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-2xl max-h-[80vh] flex flex-col bg-[#200268]/90 backdrop-blur-md border-[3px] border-white/20 rounded-3xl shadow-2xl p-[var(--spacing-md)] overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header (Fixed) */}
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <h2 className="font-londrina text-3xl text-white">{title}</h2>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white font-londrina text-xl transition-colors"
            title={t('close')}
          >
            X
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar">
          <div className="font-balsamiq text-white/90 space-y-6 pb-6">
            
            <section>
              <h3 className="text-2xl font-londrina mb-4 text-white">1. Introdução</h3>
              <p className="leading-relaxed">
                {t('legalPlaceholder')}
              </p>
            </section>

            <section>
              <h3 className="text-2xl font-londrina mb-4 text-white">2. Coleta de Dados</h3>
              <ul className="list-disc ml-6 space-y-2">
                <li>Dados de sessão são armazenados localmente e no Convex de forma anônima.</li>
                <li>Qualquer dado inserido (respostas) fica visível aos jogadores da sala.</li>
                <li>Não vendemos seus dados para terceiros.</li>
              </ul>
            </section>

            <br/><br/><br/><br/><br/><br/>
            {/* Spacer to simulate scrolling content */}
            <p className="text-center opacity-50 italic">Fim do documento.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
