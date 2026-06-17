"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Modal } from "@/components/ui/Modal";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { spring } from "@/lib/motion";

type Tone = "imp" | "safe" | "info" | "special" | "gold";

const toneColor: Record<Tone, string> = {
  imp: "var(--color-imp)",
  safe: "var(--color-safe)",
  info: "var(--color-info)",
  special: "var(--color-special)",
  gold: "var(--color-gold)",
};

const tabs = [
  { value: "Geral", icon: "solar:compass-bold" },
  { value: "Palavra", icon: "solar:chat-square-like-bold" },
  { value: "Pergunta", icon: "solar:question-circle-bold" },
] as const;

type TabValue = (typeof tabs)[number]["value"];

// ---------------------------------------------------------------------------
// Local "field manual" choreography. Each tab's contents are staggered children;
// the tab CONTENT cross-fades between tabs via AnimatePresence (mode wait).
// ---------------------------------------------------------------------------

const manualContainer = {
  initial: {},
  animate: { transition: { staggerChildren: 0.06, delayChildren: 0.02 } },
  exit: {},
};

const manualItem = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: spring.gentle },
  exit: { opacity: 0 },
};

// ---------------------------------------------------------------------------
// Presentational helpers
// ---------------------------------------------------------------------------

/** 34px tinted glass icon chip — sits left of a section heading. */
function IconChip({ icon, tone }: { icon: string; tone: Tone }) {
  const color = toneColor[tone];
  return (
    <span
      aria-hidden
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--r-pill)] border border-[var(--glass-border)]"
      style={{
        backgroundColor: `color-mix(in srgb, ${color} 18%, var(--glass-2))`,
        color,
        boxShadow: "inset 0 1px 0 rgba(255,255,255,.18)",
      }}
    >
      <Icon icon={icon} width={18} height={18} />
    </span>
  );
}

/** Section heading with a tinted icon chip. */
function SectionHeading({
  icon,
  tone,
  children,
}: {
  icon: string;
  tone: Tone;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <IconChip icon={icon} tone={tone} />
      <h3 className="font-display text-2xl text-[var(--color-text)]">{children}</h3>
    </div>
  );
}

/**
 * A single rule row — a tinted marker (number for steps, dot/icon for tips)
 * with a playful spring-in scale, followed by the rule copy.
 */
function Rule({
  marker,
  tone,
  reduce,
  children,
}: {
  marker: React.ReactNode;
  tone: Tone;
  reduce: boolean | null;
  children: React.ReactNode;
}) {
  const color = toneColor[tone];
  return (
    <li className="flex items-start gap-3">
      <motion.span
        aria-hidden
        initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.4 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={reduce ? { duration: 0.15 } : spring.pop}
        className="tnum mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-[var(--r-pill)] border font-condensed text-xs font-semibold"
        style={{
          color,
          borderColor: `color-mix(in srgb, ${color} 40%, transparent)`,
          backgroundColor: `color-mix(in srgb, ${color} 14%, transparent)`,
        }}
      >
        {marker}
      </motion.span>
      <span className="flex-1 pt-px">{children}</span>
    </li>
  );
}

/** A bordered callout card with a tinted accent rail + icon chip. */
function Callout({
  icon,
  tone,
  title,
  children,
}: {
  icon: string;
  tone: Tone;
  title: string;
  reduce?: boolean | null;
  children: React.ReactNode;
}) {
  const color = toneColor[tone];
  return (
    <motion.section
      variants={manualItem}
      className="relative overflow-hidden rounded-[var(--r-lg)] border p-4 pl-5"
      style={{
        borderColor: `color-mix(in srgb, ${color} 30%, var(--glass-border))`,
        backgroundColor: `color-mix(in srgb, ${color} 8%, var(--glass-1))`,
      }}
    >
      {/* Left accent rail. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-3 left-1.5 w-[3px] rounded-[var(--r-pill)]"
        style={{ backgroundColor: color }}
      />
      <div className="mb-1.5 flex items-center gap-2.5">
        <span
          aria-hidden
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[var(--r-pill)]"
          style={{
            color,
            backgroundColor: `color-mix(in srgb, ${color} 18%, transparent)`,
          }}
        >
          <Icon icon={icon} width={16} height={16} />
        </span>
        <h4 className="font-display text-xl text-[var(--color-text)]">{title}</h4>
      </div>
      <div className="font-body text-[15px] leading-relaxed text-[var(--color-text-muted)]">
        {children}
      </div>
    </motion.section>
  );
}

// ---------------------------------------------------------------------------

export default function HowToPlayModal({ onClose, open }: { onClose: () => void; open: boolean }) {
  const reduce = useReducedMotion();
  const [activeTab, setActiveTab] = useState<TabValue>("Geral");

  return (
    <Modal open={open} onClose={onClose} size="lg" title="Manual de campo">
      {/* Briefing eyebrow — sets the "field manual" tone. */}
      <p className="-mt-1 mb-4 font-condensed text-xs uppercase tracking-[0.28em] text-[var(--color-text-muted)]">
        Briefing · como jogar o SUS
      </p>

      {/* Sliding-pill tab selector. */}
      <div className="mb-6">
        <SegmentedControl
          aria-label="Secoes do manual"
          tone="info"
          value={activeTab}
          onChange={(v) => setActiveTab(v as TabValue)}
          options={tabs.map((t) => ({
            value: t.value,
            label: t.value,
            icon: (
              <motion.span
                className="inline-flex"
                animate={
                  reduce ? undefined : { scale: activeTab === t.value ? 1.05 : 1 }
                }
                transition={spring.pop}
              >
                <Icon icon={t.icon} width={16} height={16} />
              </motion.span>
            ),
          }))}
        />
      </div>

      {/* Tab content — cross-fades between tabs, then staggers its sections in. */}
      <div className="font-body text-[15px] leading-relaxed text-[var(--color-text-muted)]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeTab}
            variants={manualContainer}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.18 }}
            className="space-y-6"
          >
            {activeTab === "Geral" && (
              <>
                <motion.section variants={manualItem} className="space-y-2.5">
                  <SectionHeading icon="solar:question-circle-bold" tone="info">
                    O que e o SUS?
                  </SectionHeading>
                  <p>
                    O SUS e um jogo de deducao social para grupos. Um jogador entre voces
                    e o{" "}
                    <span className="font-display text-[var(--color-imp)]">impostor</span>
                    , e ninguem sabe quem e, exceto ele mesmo.
                  </p>
                </motion.section>

                <motion.section variants={manualItem} className="space-y-3">
                  <SectionHeading icon="solar:routing-2-bold" tone="special">
                    Como funciona
                  </SectionHeading>
                  <ol className="space-y-2.5">
                    <Rule marker="1" tone="special" reduce={reduce}>
                      O dono da sala configura e inicia a partida.
                    </Rule>
                    <Rule marker="2" tone="special" reduce={reduce}>
                      Cada jogador recebe uma informacao secreta no proprio dispositivo.
                    </Rule>
                    <Rule marker="3" tone="special" reduce={reduce}>
                      A rodada comeca: observem, respondam e blefem.
                    </Rule>
                    <Rule marker="4" tone="special" reduce={reduce}>
                      Ao final, todos votam em quem acham que e o impostor.
                    </Rule>
                    <Rule marker="5" tone="special" reduce={reduce}>
                      O impostor vence se nao for descoberto. O grupo vence se acertar.
                    </Rule>
                  </ol>
                </motion.section>
              </>
            )}

            {activeTab === "Palavra" && (
              <>
                <motion.section variants={manualItem} className="space-y-2.5">
                  <SectionHeading icon="solar:chat-square-like-bold" tone="info">
                    Modo Palavra
                  </SectionHeading>
                  <p>
                    Todos os jogadores recebem a mesma palavra secreta, exceto o
                    impostor, que nao recebe nada.
                  </p>
                  <p>
                    O impostor precisa fingir que sabe a palavra sem entrega-la. Os
                    outros precisam provar que sabem sem facilitar demais para o
                    impostor adivinhar.
                  </p>
                </motion.section>

                <Callout
                  icon="solar:lightbulb-bolt-bold"
                  tone="imp"
                  title="Dica do impostor"
                  reduce={reduce}
                >
                  Quando ativada pelo dono da sala, o impostor recebe uma palavra de
                  dica relacionada a palavra principal. Ele ainda nao sabe a palavra
                  exata, mas ganha uma pista para blefar melhor.
                </Callout>

                <motion.section variants={manualItem} className="space-y-3">
                  <SectionHeading icon="solar:star-shine-bold" tone="safe">
                    Dicas para jogar
                  </SectionHeading>
                  <ul className="space-y-2.5">
                    <Rule
                      marker={<Icon icon="solar:check-circle-bold" width={13} height={13} />}
                      tone="safe"
                      reduce={reduce}
                    >
                      Seja especifico o suficiente para provar que sabe, mas vago o
                      suficiente para nao entregar.
                    </Rule>
                    <Rule
                      marker={<Icon icon="solar:check-circle-bold" width={13} height={13} />}
                      tone="safe"
                      reduce={reduce}
                    >
                      Observe quem esta sendo generico demais: pode ser o impostor.
                    </Rule>
                    <Rule
                      marker={<Icon icon="solar:check-circle-bold" width={13} height={13} />}
                      tone="safe"
                      reduce={reduce}
                    >
                      O impostor deve arriscar respostas plausiveis, nao obvias.
                    </Rule>
                  </ul>
                </motion.section>
              </>
            )}

            {activeTab === "Pergunta" && (
              <>
                <motion.section variants={manualItem} className="space-y-2.5">
                  <SectionHeading icon="solar:question-circle-bold" tone="info">
                    Modo Pergunta
                  </SectionHeading>
                  <p>
                    Todos recebem uma pergunta, mas o impostor recebe uma pergunta
                    diferente, pensada para produzir uma resposta parecida com a dos
                    outros.
                  </p>
                  <p>
                    Todos digitam suas respostas no app. Quando todos estiverem prontos,
                    as respostas aparecem simultaneamente na tela.
                  </p>
                </motion.section>

                <Callout
                  icon="solar:magic-stick-3-bold"
                  tone="info"
                  title="Modo automatico"
                  reduce={reduce}
                >
                  A plataforma escolhe automaticamente a pergunta dos jogadores e a
                  pergunta do impostor.
                </Callout>

                <Callout
                  icon="solar:crown-bold"
                  tone="gold"
                  title="Modo mestre"
                  reduce={reduce}
                >
                  Um jogador e nomeado mestre da rodada pelo dono da sala. O mestre
                  cria as duas perguntas e nao participa como jogador, apenas observa
                  a rodada.
                </Callout>

                <motion.section variants={manualItem} className="space-y-3">
                  <SectionHeading icon="solar:star-shine-bold" tone="safe">
                    Dicas para jogar
                  </SectionHeading>
                  <ul className="space-y-2.5">
                    <Rule
                      marker={<Icon icon="solar:check-circle-bold" width={13} height={13} />}
                      tone="safe"
                      reduce={reduce}
                    >
                      Respostas muito longas ou muito curtas podem denunciar o
                      impostor.
                    </Rule>
                    <Rule
                      marker={<Icon icon="solar:check-circle-bold" width={13} height={13} />}
                      tone="safe"
                      reduce={reduce}
                    >
                      O impostor deve calibrar o tom e o estilo das respostas dos
                      outros.
                    </Rule>
                    <Rule
                      marker={<Icon icon="solar:check-circle-bold" width={13} height={13} />}
                      tone="safe"
                      reduce={reduce}
                    >
                      Na discussao, preste atencao em quem muda de assunto rapido
                      demais.
                    </Rule>
                  </ul>
                </motion.section>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </Modal>
  );
}
