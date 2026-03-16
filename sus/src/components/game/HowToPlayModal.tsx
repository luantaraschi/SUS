"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";

const tabs = ["Geral", "Palavra", "Pergunta"] as const;

export default function HowToPlayModal({ onClose }: { onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("Geral");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="custom-scrollbar relative max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-[32px] border border-[var(--panel-border)] bg-[var(--panel-surface)] p-6 text-[var(--panel-text)] shadow-2xl sm:p-8"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--panel-muted)] text-[var(--panel-soft-text)] transition-colors hover:bg-[var(--control-surface-muted)] hover:text-[var(--panel-text)]"
          aria-label="Fechar como jogar"
        >
          <Icon icon="solar:close-circle-bold" width={28} height={28} />
        </button>

        <div className="mt-2 mb-6 flex gap-1 rounded-full bg-[var(--panel-muted)] p-1">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`flex-1 rounded-full px-4 py-2 font-condensed text-xs uppercase tracking-[0.24em] transition-colors ${
                activeTab === tab
                  ? "bg-surface-primary text-white"
                  : "text-[var(--panel-soft-text)] hover:text-[var(--panel-text)]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="space-y-6 font-body text-[15px] leading-relaxed text-[var(--panel-soft-text)]">
          {activeTab === "Geral" && (
            <>
              <section>
                <h3 className="mb-2 font-display text-2xl text-[var(--panel-text)]">
                  O que e o SUS?
                </h3>
                <p>
                  O SUS e um jogo de deducao social para grupos. Um jogador entre voces
                  e o <span className="font-display text-[var(--panel-text)]">impostor</span>
                  , e ninguem sabe quem e, exceto ele mesmo.
                </p>
              </section>

              <section>
                <h3 className="mb-3 font-display text-2xl text-[var(--panel-text)]">
                  Como funciona
                </h3>
                <ol className="space-y-2 pl-5">
                  <li className="list-decimal">O dono da sala configura e inicia a partida.</li>
                  <li className="list-decimal">
                    Cada jogador recebe uma informacao secreta no proprio dispositivo.
                  </li>
                  <li className="list-decimal">
                    A rodada comeca: observem, respondam e blefem.
                  </li>
                  <li className="list-decimal">
                    Ao final, todos votam em quem acham que e o impostor.
                  </li>
                  <li className="list-decimal">
                    O impostor vence se nao for descoberto. O grupo vence se acertar.
                  </li>
                </ol>
              </section>
            </>
          )}

          {activeTab === "Palavra" && (
            <>
              <section>
                <h3 className="mb-2 font-display text-2xl text-[var(--panel-text)]">
                  Modo Palavra
                </h3>
                <p>
                  Todos os jogadores recebem a mesma palavra secreta, exceto o
                  impostor, que nao recebe nada.
                </p>
                <p className="mt-3">
                  O impostor precisa fingir que sabe a palavra sem entrega-la. Os
                  outros precisam provar que sabem sem facilitar demais para o
                  impostor adivinhar.
                </p>
              </section>

              <section className="rounded-[24px] border border-[var(--control-border)] bg-[var(--control-surface-muted)] p-4">
                <h4 className="mb-1 font-display text-xl text-[var(--panel-text)]">
                  Dica do impostor
                </h4>
                <p>
                  Quando ativada pelo dono da sala, o impostor recebe uma palavra de
                  dica relacionada a palavra principal. Ele ainda nao sabe a palavra
                  exata, mas ganha uma pista para blefar melhor.
                </p>
              </section>

              <section>
                <h3 className="mb-3 font-display text-2xl text-[var(--panel-text)]">
                  Dicas para jogar
                </h3>
                <ul className="space-y-2 pl-5">
                  <li className="list-disc">
                    Seja especifico o suficiente para provar que sabe, mas vago o
                    suficiente para nao entregar.
                  </li>
                  <li className="list-disc">
                    Observe quem esta sendo generico demais: pode ser o impostor.
                  </li>
                  <li className="list-disc">
                    O impostor deve arriscar respostas plausiveis, nao obvias.
                  </li>
                </ul>
              </section>
            </>
          )}

          {activeTab === "Pergunta" && (
            <>
              <section>
                <h3 className="mb-2 font-display text-2xl text-[var(--panel-text)]">
                  Modo Pergunta
                </h3>
                <p>
                  Todos recebem uma pergunta, mas o impostor recebe uma pergunta
                  diferente, pensada para produzir uma resposta parecida com a dos
                  outros.
                </p>
                <p className="mt-3">
                  Todos digitam suas respostas no app. Quando todos estiverem prontos,
                  as respostas aparecem simultaneamente na tela.
                </p>
              </section>

              <section className="rounded-[24px] border border-[var(--control-border)] bg-[var(--control-surface-muted)] p-4">
                <h4 className="mb-1 font-display text-xl text-[var(--panel-text)]">
                  Modo automatico
                </h4>
                <p>
                  A plataforma escolhe automaticamente a pergunta dos jogadores e a
                  pergunta do impostor.
                </p>
              </section>

              <section className="rounded-[24px] border border-[var(--control-border)] bg-[var(--control-surface-muted)] p-4">
                <h4 className="mb-1 font-display text-xl text-[var(--panel-text)]">
                  Modo mestre
                </h4>
                <p>
                  Um jogador e nomeado mestre da rodada pelo dono da sala. O mestre
                  cria as duas perguntas e nao participa como jogador, apenas observa
                  a rodada.
                </p>
              </section>

              <section>
                <h3 className="mb-3 font-display text-2xl text-[var(--panel-text)]">
                  Dicas para jogar
                </h3>
                <ul className="space-y-2 pl-5">
                  <li className="list-disc">
                    Respostas muito longas ou muito curtas podem denunciar o
                    impostor.
                  </li>
                  <li className="list-disc">
                    O impostor deve calibrar o tom e o estilo das respostas dos
                    outros.
                  </li>
                  <li className="list-disc">
                    Na discussao, preste atencao em quem muda de assunto rapido
                    demais.
                  </li>
                </ul>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
