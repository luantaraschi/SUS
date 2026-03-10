import { useState } from "react";
import { Icon } from "@iconify/react";

export default function HowToPlayModal({ onClose }: { onClose: () => void }) {
  const tabs = ["Geral", "Palavra", "Pergunta"];
  const [activeTab, setActiveTab] = useState("Geral");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-3xl bg-white p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botão fechar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <Icon icon="solar:close-circle-bold" width={32} height={32} />
        </button>

        {/* Tabs */}
        <div className="bg-[#1e1b6e]/10 rounded-full p-1 flex gap-1 mb-6 mt-2">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-4 py-1.5 font-black uppercase tracking-wider text-xs transition-colors rounded-full ${
                activeTab === tab
                  ? "bg-[#1e1b6e] text-white"
                  : "text-[#1e1b6e]/50 hover:text-[#1e1b6e]/80"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Conteúdo */}
        <div className="flex flex-col">
          {activeTab === "Geral" && (
            <div className="animate-in fade-in duration-200">
              <h3 className="font-display text-lg font-black text-gray-800 mb-2">O que é o SUS?</h3>
              <p className="font-body text-sm text-gray-600 leading-relaxed mb-3">
                O SUS é um jogo de dedução social para grupos. Um jogador entre vocês é o <span className="font-black text-gray-800">impostor</span> — e ninguém sabe quem é, exceto ele mesmo.
              </p>

              <h3 className="font-display text-lg font-black text-gray-800 mt-6 mb-2">Como funciona:</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600 font-body mb-3">
                <li>O dono da sala configura e inicia a partida</li>
                <li>Cada jogador recebe uma informação secreta no próprio dispositivo</li>
                <li>A rodada começa — observem, respondam, blefem</li>
                <li>Ao final, todos <span className="font-black text-gray-800">votam</span> em quem acham que é o impostor</li>
                <li>O impostor vence se não for descoberto. O grupo vence se acertar</li>
              </ol>
            </div>
          )}

          {activeTab === "Palavra" && (
            <div className="animate-in fade-in duration-200">
              <h3 className="font-display text-lg font-black text-gray-800 mb-2">Como funciona:</h3>
              <p className="font-body text-sm text-gray-600 leading-relaxed mb-3">
                Todos os jogadores recebem a <span className="font-black text-gray-800">mesma palavra secreta</span> — exceto o impostor, que não recebe nada.
              </p>
              <p className="font-body text-sm text-gray-600 leading-relaxed mb-6">
                O impostor precisa fingir que sabe a palavra sem entregá-la. Os outros precisam provar que sabem sem facilitar demais para o impostor adivinhar.
              </p>

              <div className="bg-[#1e1b6e]/10 rounded-2xl p-4 mb-6">
                <h4 className="font-display text-base font-black text-gray-800 mb-1">Dica do Impostor <span className="text-xs font-body font-normal text-gray-500">(opcional)</span></h4>
                <p className="font-body text-sm text-gray-600 leading-relaxed">
                  Quando ativada pelo dono da sala, o impostor recebe uma <span className="font-black text-gray-800">palavra de dica</span> relacionada à palavra principal. Ele ainda não sabe a palavra exata, mas tem uma pista para blefar melhor.
                </p>
              </div>

              <h3 className="font-display text-lg font-black text-gray-800 mb-2">Dicas para jogar:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 font-body mb-3">
                <li>Seja específico o suficiente para provar que sabe, mas vago o suficiente para não entregar</li>
                <li>Observe quem está sendo genérico demais — pode ser o impostor</li>
                <li>O impostor deve arriscar respostas plausíveis, não óbvias</li>
              </ul>
            </div>
          )}

          {activeTab === "Pergunta" && (
            <div className="animate-in fade-in duration-200">
              <h3 className="font-display text-lg font-black text-gray-800 mb-2">Como funciona:</h3>
              <p className="font-body text-sm text-gray-600 leading-relaxed mb-3">
                Todos recebem uma <span className="font-black text-gray-800">pergunta</span>, mas o impostor recebe uma <span className="font-black text-gray-800">pergunta diferente</span> — pensada para produzir uma resposta parecida com a dos outros.
              </p>
              <p className="font-body text-sm text-gray-600 leading-relaxed mb-6">
                Todos digitam suas respostas no app. Quando todos estiverem prontos, as respostas aparecem simultaneamente na tela.
              </p>

              <div className="bg-[#1e1b6e]/10 rounded-2xl p-4 mb-3">
                <h4 className="font-display text-base font-black text-gray-800 mb-1">Modo Automático</h4>
                <p className="font-body text-sm text-gray-600 leading-relaxed">
                  A plataforma escolhe automaticamente a pergunta dos jogadores e a pergunta do impostor.
                </p>
              </div>

              <div className="bg-[#1e1b6e]/10 rounded-2xl p-4 mb-6">
                <h4 className="font-display text-base font-black text-gray-800 mb-1">Modo Mestre</h4>
                <p className="font-body text-sm text-gray-600 leading-relaxed">
                  Um jogador é nomeado <span className="font-black text-gray-800">mestre da rodada</span> pelo dono da sala. O mestre cria as duas perguntas e não participa como jogador — apenas observa a rodada.
                </p>
              </div>

              <h3 className="font-display text-lg font-black text-gray-800 mb-2">Dicas para jogar:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 font-body mb-3">
                <li>Respostas muito longas ou muito curtas podem denunciar o impostor</li>
                <li>O impostor deve calibrar o tom e o estilo das respostas dos outros</li>
                <li>Na discussão, preste atenção em quem muda de assunto rápido demais</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
