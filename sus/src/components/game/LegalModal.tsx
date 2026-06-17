"use client";

import { useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  Clock3,
  Database,
  Eye,
  Gavel,
  Lock,
  ScrollText,
  ShieldCheck,
  Sparkles,
  UserRoundCheck,
} from "lucide-react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  type Variants,
} from "framer-motion";
import { useI18n } from "@/lib/I18nContext";
import type { Language } from "@/lib/locales";
import { spring } from "@/lib/motion";
import { Modal } from "@/components/ui/Modal";

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "terms" | "privacy";
}

type LegalDocument = {
  eyebrow: string;
  title: string;
  subtitle: string;
  updatedAt: string;
  note: string;
  highlights: Array<{
    icon: LucideIcon;
    label: string;
    title: string;
    text: string;
  }>;
  sections: Array<{
    id: string;
    title: string;
    body: string;
    bullets?: string[];
  }>;
};

const DOCUMENTS: Record<Language, Record<LegalModalProps["type"], LegalDocument>> = {
  pt: {
    privacy: {
      eyebrow: "Privacidade",
      title: "Politica de Privacidade",
      subtitle:
        "Este resumo descreve como o SUS lida com dados de sessao, perfil, jogabilidade e suporte na implementacao atual do app.",
      updatedAt: "Atualizado em 17 de marco de 2026",
      note:
        "O texto abaixo reflete o comportamento atual do produto e deve ser revisado juridicamente antes de uso comercial mais amplo.",
      highlights: [
        {
          icon: Database,
          label: "Sessao local",
          title: "Preferencias no navegador",
          text: "Idioma, tema visual, audio e um identificador de sessao ficam no navegador para manter sua experiencia.",
        },
        {
          icon: Eye,
          label: "Dados visiveis na sala",
          title: "Conteudo compartilhado",
          text: "Nome, avatar, mensagens, respostas, votos e resultados podem ser vistos pelos participantes da partida.",
        },
        {
          icon: UserRoundCheck,
          label: "Conta opcional",
          title: "Login so quando faz sentido",
          text: "Voce pode jogar sem conta; login serve para salvar perfil, avatar, preferencias sincronizadas, packs e historico.",
        },
      ],
      sections: [
        {
          id: "escopo",
          title: "1. Escopo e responsavel pelo app",
          body:
            "SUS e um jogo social online multiplayer. Esta politica cobre a experiencia inicial, salas, partidas, perfil, chat, historico e envio de relatos de bug. O projeto e mantido de forma independente e os canais de contato publicos ficam no footer e no repositorio associado ao app.",
        },
        {
          id: "coleta",
          title: "2. Quais dados podem ser coletados",
          body:
            "Os dados tratados dependem de como voce usa o jogo. Parte deles existe apenas no seu navegador; outra parte e sincronizada pelo backend Convex para a partida funcionar.",
          bullets: [
            "No navegador: identificador de sessao, idioma, tema visual e preferencia de audio.",
            "Na sala e na partida: nome exibido, emoji ou avatar, codigo da sala, status do jogador, mensagens do chat, respostas, votos, pontuacao e historico da partida.",
            "Se voce criar conta: email e credenciais por senha ou dados basicos do provedor de login, como Google, incluindo nome, email e imagem quando disponiveis.",
            "No perfil: nome de exibicao, seed do avatar, avatar enviado por upload e preferencias sincronizadas da conta.",
            "Em suporte tecnico: sessionId, rota acessada, informacoes do navegador e mensagem enviada em relatorios de bug.",
          ],
        },
        {
          id: "uso",
          title: "3. Como esses dados sao usados",
          body:
            "Os dados sao usados para criar salas, identificar participantes, sincronizar estados da partida em tempo real, restaurar sua sessao, montar estatisticas basicas, salvar perfil e investigar problemas tecnicos. O app nao precisa desses dados para publicidade comportamental e nao vende dados pessoais a terceiros.",
        },
        {
          id: "compartilhamento",
          title: "4. Compartilhamento e visibilidade",
          body:
            "Tudo o que voce digita durante a partida deve ser tratado como conteudo social visivel a outros jogadores daquela sala. Isso inclui mensagens, respostas e parte dos resultados da rodada.",
          bullets: [
            "Participantes da sala podem ver seu nome, avatar, status, respostas, votos revelados e mensagens relacionadas a partida.",
            "Dados operacionais e de conta podem ser armazenados no Convex e em armazenamento vinculado ao Convex para uploads de avatar.",
            "Se voce optar por login social, o provedor escolhido tambem participa do fluxo de autenticacao.",
          ],
        },
        {
          id: "retencao",
          title: "5. Retencao e seguranca",
          body:
            "Dados locais permanecem no seu navegador ate que voce os limpe. Dados de conta, historico, packs personalizados, preferencias sincronizadas e relatos de bug podem permanecer armazenados enquanto forem necessarios para operacao do app ou ate revisao manual. Nenhum sistema online oferece seguranca absoluta, entao evite compartilhar informacoes sensiveis nas salas, chats ou respostas do jogo.",
        },
        {
          id: "direitos",
          title: "6. Suas escolhas e seus direitos",
          body:
            "Voce pode jogar como visitante, criar conta depois, editar seu perfil e limitar o que compartilha durante a partida. Se precisar solicitar acesso, correcao ou exclusao de dados associados a sua conta, use os contatos publicos do projeto. Para usuarios no Brasil, esses pedidos podem ser avaliados em linha com os direitos previstos na LGPD, especialmente os do artigo 18.",
        },
      ],
    },
    terms: {
      eyebrow: "Termos",
      title: "Termos de Uso",
      subtitle:
        "Estas regras resumem como o SUS deve ser usado na experiencia atual do jogo e definem limites basicos para contas, salas e conteudo compartilhado.",
      updatedAt: "Atualizado em 17 de marco de 2026",
      note:
        "O documento foi redigido para combinar com a implementacao atual do app. Para publicacao formal, ainda vale revisao juridica.",
      highlights: [
        {
          icon: ScrollText,
          label: "Uso social",
          title: "Partidas em grupo",
          text: "SUS foi feito para partidas leves em grupo. A experiencia depende de interacao em tempo real entre jogadores.",
        },
        {
          icon: Gavel,
          label: "Conduta minima",
          title: "Sem abuso ou fraude",
          text: "Nao use o app para fraude, abuso, odio, assedio, spam, automacao maliciosa ou publicacao de conteudo ilegal.",
        },
        {
          icon: ShieldCheck,
          label: "Host modera a sala",
          title: "Controle no lobby",
          text: "Quem hospeda a partida controla inicio, configuracoes e pode remover jogadores ou bots no lobby.",
        },
      ],
      sections: [
        {
          id: "aceite",
          title: "1. Aceite e finalidade do servico",
          body:
            "Ao usar o SUS, voce concorda com estes Termos de Uso e com a Politica de Privacidade exibida no app. O servico existe para partidas sociais online de deducao em grupo e pode ser alterado, pausado ou atualizado sem aviso previo.",
        },
        {
          id: "conduta",
          title: "2. Regras de conduta",
          body:
            "Voce e responsavel pelo que faz dentro da plataforma e pelas informacoes que escolhe compartilhar.",
          bullets: [
            "Respeite outros jogadores e nao publique conteudo ofensivo, ilegal, discriminatorio, sexualmente explicito ou que exponha dados sensiveis de terceiros.",
            "Nao tente burlar regras da sala, explorar falhas, automatizar a jogabilidade de forma abusiva ou interferir indevidamente no funcionamento do app.",
            "Nao se passe por outra pessoa, organizacao ou membro da equipe do projeto.",
          ],
        },
        {
          id: "conteudo",
          title: "3. Conteudo gerado durante o jogo",
          body:
            "Mensagens, respostas, votos revelados, nomes de perfil e avatares podem aparecer para outros participantes da sala porque fazem parte da experiencia central do jogo. Voce mantem responsabilidade pelo conteudo que enviar e concede ao app a permissao necessaria para exibi-lo, processa-lo e armazenar o minimo necessario para operacao da partida e do perfil.",
        },
        {
          id: "contas",
          title: "4. Contas, perfis e salas",
          body:
            "O app permite jogar como visitante e tambem criar conta por email/senha ou login social suportado. Se voce criar conta, e responsavel por manter suas credenciais seguras. O host de cada sala pode alterar configuracoes, iniciar partidas, adicionar ou remover bots e remover participantes no lobby. Entradas durante uma partida podem ser tratadas como espectador ate a rodada seguinte.",
        },
        {
          id: "disponibilidade",
          title: "5. Disponibilidade, testes e limites tecnicos",
          body:
            "O SUS e um projeto independente e pode passar por ajustes, manutencao, reset de dados, mudancas de balanceamento ou indisponibilidades temporarias. Nao ha garantia de disponibilidade continua, ausencia de bugs ou compatibilidade com todos os navegadores e dispositivos.",
        },
        {
          id: "responsabilidade",
          title: "6. Limites de responsabilidade",
          body:
            "Use o app por sua conta e risco. Na medida permitida pela lei aplicavel, o projeto nao se responsabiliza por perdas indiretas, interrupcoes de acesso, conflitos entre jogadores ou danos decorrentes de conteudo inserido por usuarios. O servico nao foi desenhado para armazenamento de dados sensiveis, sigilosos ou de alto risco.",
        },
      ],
    },
  },
  en: {
    privacy: {
      eyebrow: "Privacy",
      title: "Privacy Policy",
      subtitle:
        "This summary explains how SUS currently handles session, profile, gameplay and support data in the live app implementation.",
      updatedAt: "Updated on March 17, 2026",
      note:
        "This text reflects the product's current behavior and should still receive formal legal review before broader commercial use.",
      highlights: [
        {
          icon: Database,
          label: "Local session",
          title: "Browser-side preferences",
          text: "Language, visual theme, audio preference and a session identifier are stored in the browser to keep your experience consistent.",
        },
        {
          icon: Eye,
          label: "Visible in the room",
          title: "Shared gameplay content",
          text: "Name, avatar, chat messages, answers, votes and results can be seen by people participating in the match.",
        },
        {
          icon: UserRoundCheck,
          label: "Optional account",
          title: "Sign in only if needed",
          text: "You can play as a guest; sign-in is mainly used for profile, avatar upload, synced preferences, custom packs and history.",
        },
      ],
      sections: [
        {
          id: "scope",
          title: "1. Scope and app operator",
          body:
            "SUS is an online multiplayer social game. This policy covers the landing area, rooms, matches, profile, chat, history and bug-report flow. The project is maintained independently and its public contact channels are available in the footer and related repository.",
        },
        {
          id: "collection",
          title: "2. What data may be collected",
          body:
            "The data processed depends on how you use the game. Some of it exists only in your browser; some of it is synchronized through Convex so the match can work in real time.",
          bullets: [
            "In the browser: session identifier, language, visual theme and audio preference.",
            "In rooms and matches: display name, emoji or avatar, room code, player status, chat messages, answers, votes, score and match history.",
            "If you create an account: email and password credentials or basic data returned by a supported login provider such as Google, including name, email and image when available.",
            "In your profile: display name, avatar seed, uploaded avatar and synced account preferences.",
            "In support flows: sessionId, current route, browser details and the message sent in bug reports.",
          ],
        },
        {
          id: "usage",
          title: "3. How the data is used",
          body:
            "The data is used to create rooms, identify participants, synchronize the live game state, restore your session, assemble basic stats, save profile settings and investigate technical issues. The app is not built around behavioral advertising and does not sell personal data to third parties.",
        },
        {
          id: "sharing",
          title: "4. Sharing and visibility",
          body:
            "Anything you type during a match should be treated as social content visible to other players in that room. This includes chat messages, answers and part of each round's result flow.",
          bullets: [
            "Room participants can see your name, avatar, status, revealed votes, answers and match-related messages.",
            "Operational and account data may be stored in Convex and in Convex-linked storage for avatar uploads.",
            "If you choose social sign-in, the selected provider also takes part in the authentication flow.",
          ],
        },
        {
          id: "retention",
          title: "5. Retention and security",
          body:
            "Local data stays in your browser until you clear it. Account data, history, custom packs, synced preferences and bug reports may remain stored while needed for app operation or until manual review. No online system can guarantee absolute security, so do not share sensitive information in rooms, chats or game answers.",
        },
        {
          id: "rights",
          title: "6. Your choices and rights",
          body:
            "You can play as a guest, sign in later, edit your profile and choose how much you share during a match. If you need to request access, correction or deletion of account-related data, use the project's public contact channels. For users in Brazil, those requests may be assessed in line with LGPD rights, especially article 18.",
        },
      ],
    },
    terms: {
      eyebrow: "Terms",
      title: "Terms of Use",
      subtitle:
        "These rules summarize how SUS should be used in the current game experience and define basic limits for accounts, rooms and shared content.",
      updatedAt: "Updated on March 17, 2026",
      note:
        "This version was written to match the current app implementation. Formal publication still benefits from legal review.",
      highlights: [
        {
          icon: ScrollText,
          label: "Social play",
          title: "Built for groups",
          text: "SUS is designed for light group matches. The experience depends on real-time interaction between players.",
        },
        {
          icon: Gavel,
          label: "Minimum conduct",
          title: "No abuse or fraud",
          text: "Do not use the app for fraud, abuse, hate, harassment, spam, malicious automation or unlawful content.",
        },
        {
          icon: ShieldCheck,
          label: "Host moderates",
          title: "Lobby control",
          text: "The room host controls the start flow, settings and lobby removals for players or bots.",
        },
      ],
      sections: [
        {
          id: "acceptance",
          title: "1. Acceptance and service purpose",
          body:
            "By using SUS, you agree to these Terms of Use and the Privacy Policy shown in the app. The service exists for online social deduction matches and may change, pause or be updated without prior notice.",
        },
        {
          id: "conduct",
          title: "2. Rules of conduct",
          body:
            "You are responsible for your actions inside the platform and for the information you decide to share.",
          bullets: [
            "Respect other players and do not publish unlawful, offensive, discriminatory, sexually explicit or privacy-invasive content.",
            "Do not try to bypass room rules, exploit bugs, automate gameplay in abusive ways or otherwise interfere with the app's normal operation.",
            "Do not impersonate another person, organization or project team member.",
          ],
        },
        {
          id: "content",
          title: "3. Content created during gameplay",
          body:
            "Messages, answers, revealed votes, profile names and avatars may be shown to other room participants because they are part of the core game experience. You remain responsible for the content you submit and grant the app the permission needed to display it, process it and store the minimum required for match and profile operation.",
        },
        {
          id: "accounts",
          title: "4. Accounts, profiles and rooms",
          body:
            "The app allows guest play and sign-in through email/password or supported social providers. If you create an account, you are responsible for keeping your credentials safe. Each room host may change settings, start matches, add or remove bots and remove participants in the lobby. People who join during an active match may be handled as spectators until the next round.",
        },
        {
          id: "availability",
          title: "5. Availability, testing and technical limits",
          body:
            "SUS is an independent project and may go through adjustments, maintenance windows, data resets, balancing changes or temporary downtime. There is no guarantee of uninterrupted availability, bug-free operation or compatibility with every browser and device.",
        },
        {
          id: "liability",
          title: "6. Liability limits",
          body:
            "Use the app at your own risk. To the extent allowed by applicable law, the project is not responsible for indirect losses, service interruptions, conflicts between players or damages caused by user-submitted content. The service is not designed for storing sensitive, confidential or high-risk data.",
        },
      ],
    },
  },
};

const HEADER_ICONS: Record<LegalModalProps["type"], LucideIcon> = {
  privacy: ShieldCheck,
  terms: ScrollText,
};

// ---------------------------------------------------------------------------
// Tone — Privacy tints cyan (--color-info), Terms tints rose (--color-imp).
// Centralizing the tone tokens keeps the two documents visually distinct.
// ---------------------------------------------------------------------------
type ToneTokens = {
  /** Solid accent (hairlines, active states, ghost tints). */
  accent: string;
  /** Faint accent wash for tinted fills (icon discs, header bleed). */
  soft: string;
  /** Stronger accent for hairlines, dashed borders and section underlines. */
  line: string;
};

const TONE: Record<LegalModalProps["type"], ToneTokens> = {
  privacy: {
    accent: "var(--color-info)",
    soft: "color-mix(in srgb, var(--color-info) 14%, transparent)",
    line: "color-mix(in srgb, var(--color-info) 34%, transparent)",
  },
  terms: {
    accent: "var(--color-imp)",
    soft: "color-mix(in srgb, var(--color-imp) 14%, transparent)",
    line: "color-mix(in srgb, var(--color-imp) 34%, transparent)",
  },
};

// Numbered corner tabs for the evidence triptych.
const EVIDENCE_TABS = ["01", "02", "03"] as const;
// Slight diagonal baseline offset per card (px) for the "evidence" feel.
const EVIDENCE_OFFSET = [0, 10, 20] as const;
// Tiny rotate settle each card pins in at.
const EVIDENCE_PIN_ROTATE = [-1.4, 0.8, -0.6] as const;

// ---------------------------------------------------------------------------
// Local motion variants (component-scoped — globals/motion.ts are read-only)
// ---------------------------------------------------------------------------
const dossierBody: Variants = {
  animate: { transition: { staggerChildren: 0.09, delayChildren: 0.04 } },
};

const dossierRow: Variants = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: spring.gentle },
};

// whileInView observes the INTERNAL scroll container (not the page viewport),
// so reveals + the signature sweep fire as the user scrolls the dossier — not
// all at once on open. framer-motion accepts the scroll ref as the IO root.
type ViewRoot = React.RefObject<HTMLDivElement | null>;

// ---------------------------------------------------------------------------
// HighlighterSweep — SIGNATURE moment. A tone-colored bar swipes left→right
// across the section title as it enters the viewport (~450ms), settling into a
// short accent underline. Reduced motion: static underline, no sweep.
// ---------------------------------------------------------------------------
function HighlighterTitle({
  id,
  title,
  accent,
  reduce,
  root,
}: {
  id: string;
  title: string;
  accent: string;
  reduce: boolean;
  root: ViewRoot;
}) {
  return (
    <div className="relative inline-block">
      <h3
        id={`dossier-${id}`}
        className="relative z-10 font-display text-2xl text-white sm:text-[2rem]"
      >
        {title}
      </h3>

      {/* The sweep bar — clipped to the title box, swipes across once. */}
      {!reduce && (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-[0.12em] top-[0.18em] z-0 origin-left rounded-[var(--r-xs)]"
          style={{
            backgroundColor: accent,
            opacity: 0.26,
            mixBlendMode: "screen",
          }}
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: [0, 1, 1, 0] }}
          viewport={{ once: true, amount: 0.7, root }}
          transition={{
            duration: 0.45,
            ease: [0.16, 1, 0.3, 1],
            times: [0, 0.45, 0.7, 1],
          }}
        />
      )}

      {/* The accent underline left behind after the sweep. Static when reduced. */}
      <motion.span
        aria-hidden
        className="absolute -bottom-1 left-0 z-10 h-[2px] origin-left rounded-full"
        style={{ backgroundColor: accent, width: "100%" }}
        initial={reduce ? false : { scaleX: 0, opacity: 0 }}
        whileInView={reduce ? undefined : { scaleX: 1, opacity: 1 }}
        viewport={{ once: true, amount: 0.7, root }}
        transition={{ delay: 0.32, duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// SpineList — bullets as a vertical list with a tinted spine line that draws
// (scaleY 0→1) and bullets that stagger in alongside it.
// ---------------------------------------------------------------------------
function SpineList({
  bullets,
  accent,
  reduce,
  root,
}: {
  bullets: string[];
  accent: string;
  reduce: boolean;
  root: ViewRoot;
}) {
  return (
    <div className="relative mt-4 pl-5">
      {/* Tinted spine */}
      <motion.span
        aria-hidden
        className="absolute left-1 top-1 bottom-1 w-[2px] origin-top rounded-full"
        style={{ backgroundColor: accent, opacity: 0.5 }}
        initial={reduce ? false : { scaleY: 0 }}
        whileInView={reduce ? undefined : { scaleY: 1 }}
        viewport={{ once: true, amount: 0.3, root }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      />
      <motion.ul
        className="space-y-3"
        variants={reduce ? undefined : dossierBody}
        initial={reduce ? false : "initial"}
        whileInView={reduce ? undefined : "animate"}
        viewport={{ once: true, amount: 0.2, root }}
      >
        {bullets.map((bullet) => (
          <motion.li
            key={bullet}
            className="flex items-start gap-3"
            variants={reduce ? undefined : dossierRow}
          >
            <span
              className="mt-[7px] h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: accent }}
            />
            <span className="font-body text-sm leading-relaxed text-white/74 sm:text-[15px]">
              {bullet}
            </span>
          </motion.li>
        ))}
      </motion.ul>
    </div>
  );
}

export function LegalModal({ isOpen, onClose, type }: LegalModalProps) {
  const { language } = useI18n();
  const reduce = useReducedMotion() ?? false;

  const document = DOCUMENTS[language][type];
  const HeaderIcon = HEADER_ICONS[type];
  const tone = TONE[type];

  // Active TOC chip — synced via scroll spy on section reveal.
  const [activeId, setActiveId] = useState<string>(document.sections[0]?.id ?? "");

  // Reading-progress bar bound to the internal scroll container.
  const scrollRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ container: scrollRef });
  const progressX = useSpring(scrollYProgress, {
    stiffness: 180,
    damping: 30,
    restDelta: 0.001,
  });

  const scrollToSection = (id: string) => {
    setActiveId(id);
    const container = scrollRef.current;
    const target = container?.querySelector<HTMLElement>(`#dossier-card-${id}`);
    if (!container || !target) return;
    container.scrollTo({
      top: target.offsetTop - 16,
      behavior: reduce ? "auto" : "smooth",
    });
  };

  return (
    <Modal open={isOpen} onClose={onClose} size="lg">
      {/* Reading-progress bar — slim, tone-colored, pinned above the doc. */}
      <div className="relative -mx-1 mb-4 h-[3px] overflow-hidden rounded-full bg-white/10">
        <motion.div
          className="h-full origin-left rounded-full"
          style={{ backgroundColor: tone.accent, scaleX: reduce ? 1 : progressX }}
        />
      </div>

      {/* TOC chip-rail — pills 1..6 with a sliding active highlight (layoutId). */}
      <nav
        aria-label={language === "pt" ? "Sumario do dossie" : "Dossier contents"}
        className="mb-4 flex flex-wrap gap-2"
      >
        {document.sections.map((section, i) => {
          const isActive = activeId === section.id;
          return (
            <button
              key={section.id}
              type="button"
              onClick={() => scrollToSection(section.id)}
              aria-current={isActive ? "true" : undefined}
              className="relative flex h-10 min-w-10 items-center justify-center rounded-[var(--r-pill)] px-3 font-condensed text-[12px] uppercase tracking-[0.18em] transition-[color,transform] duration-[var(--t-quick)] ease-[var(--ease-out)] hover:scale-[1.04] active:scale-95 focus-visible:outline-none focus-visible:shadow-[var(--ring-focus)] motion-reduce:transition-none motion-reduce:hover:scale-100"
              style={{ color: isActive ? "#0b0518" : "rgba(255,255,255,0.6)" }}
            >
              {isActive && (
                <motion.span
                  layoutId={`dossier-toc-${type}`}
                  className="absolute inset-0 rounded-[var(--r-pill)]"
                  style={{ backgroundColor: tone.accent }}
                  transition={
                    reduce
                      ? { duration: 0 }
                      : { type: "spring", stiffness: 480, damping: 34 }
                  }
                />
              )}
              <span className="relative z-10">{i + 1}</span>
            </button>
          );
        })}
      </nav>

      {/* Internal scroll container — owns scroll progress + sticky aside. */}
      <motion.div
        ref={scrollRef}
        className="custom-scrollbar max-h-[64vh] space-y-5 overflow-y-auto pr-1"
        variants={reduce ? undefined : dossierBody}
        initial={reduce ? false : "initial"}
        animate="animate"
      >
        {/* (1) Capa do dossie — asymmetric header with a wax-seal medallion. */}
        <motion.section
          variants={reduce ? undefined : dossierRow}
          className="relative overflow-hidden rounded-[var(--r-xl)] border bg-[linear-gradient(135deg,rgba(255,255,255,0.16),rgba(255,255,255,0.05))] px-5 py-6 shadow-[var(--shadow-md)] sm:px-6"
          style={{ borderColor: tone.line }}
        >
          {/* Tone wash bleeding from the seal side. */}
          <div
            className="absolute inset-y-0 right-[-14%] w-52 rounded-full blur-3xl"
            style={{ backgroundColor: tone.soft }}
          />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-5">
              {/* Wax-seal medallion — gold→tone gradient disc, breaks the rect. */}
              <motion.div
                aria-hidden
                className="relative grid h-20 w-20 shrink-0 place-items-center rounded-[var(--r-pill)] shadow-[var(--shadow-md)]"
                style={{
                  background: `radial-gradient(circle at 32% 28%, var(--color-gold), ${
                    type === "privacy" ? "var(--color-info)" : "var(--color-imp)"
                  })`,
                }}
                initial={reduce ? false : { scale: 0.6, rotate: -14, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                transition={reduce ? { duration: 0 } : { ...spring.pop, delay: 0.12 }}
              >
                {/* Inner ring */}
                <span className="absolute inset-[6px] rounded-[var(--r-pill)] border border-white/40" />
                <span className="absolute inset-[10px] rounded-[var(--r-pill)] border border-black/15" />
                <HeaderIcon size={30} className="relative text-[#1a0a2e]" strokeWidth={2.2} />
              </motion.div>

              <div className="max-w-2xl">
                <div
                  className="inline-flex items-center gap-2 rounded-[var(--r-pill)] border px-3 py-1.5 font-condensed text-[11px] uppercase tracking-[0.28em]"
                  style={{ borderColor: tone.line, color: tone.accent }}
                >
                  <Sparkles size={13} />
                  {language === "pt" ? "Dossie" : "Dossier"} · {document.eyebrow}
                </div>
                <h2 className="mt-3 font-display text-3xl text-white sm:text-4xl">
                  {document.title}
                </h2>
                <p className="mt-3 font-body text-sm leading-relaxed text-white/76 sm:text-base">
                  {document.subtitle}
                </p>
              </div>
            </div>

            {/* Carimbo — a rotated "date stamp" with updatedAt + note. */}
            <motion.div
              className="shrink-0 self-end lg:self-center"
              initial={reduce ? false : { rotate: 0, opacity: 0, scale: 0.9 }}
              animate={{ rotate: -3.5, opacity: 1, scale: 1 }}
              transition={reduce ? { duration: 0 } : { ...spring.gentle, delay: 0.24 }}
            >
              <div
                className="max-w-[260px] rounded-[var(--r-md)] border-2 border-dashed p-3 text-center"
                style={{ borderColor: tone.line }}
              >
                <div className="flex items-center justify-center gap-1.5 font-condensed text-[10px] uppercase tracking-[0.24em]" style={{ color: tone.accent }}>
                  <Clock3 size={12} />
                  {document.updatedAt}
                </div>
                <p className="mt-2 font-body text-[11px] leading-relaxed text-white/60">
                  {document.note}
                </p>
              </div>
            </motion.div>
          </div>
        </motion.section>

        {/* (2) Evidence triptych — varied tones, diagonal offset, corner tabs. */}
        <motion.section
          variants={reduce ? undefined : dossierRow}
          className="grid gap-4 lg:grid-cols-3"
        >
          {document.highlights.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.article
                key={item.label}
                initial={
                  reduce ? false : { opacity: 0, y: 16, rotate: EVIDENCE_PIN_ROTATE[i] * 3 }
                }
                whileInView={
                  reduce ? undefined : { opacity: 1, y: 0, rotate: EVIDENCE_PIN_ROTATE[i] }
                }
                viewport={{ once: true, amount: 0.3, root: scrollRef }}
                transition={reduce ? { duration: 0 } : { ...spring.pop, delay: i * 0.08 }}
                whileHover={reduce ? undefined : { y: -4, rotate: 0 }}
                whileTap={reduce ? undefined : { scale: 0.96 }}
                className="group glass-section relative rounded-[var(--r-lg)] p-4 shadow-[var(--shadow-sm)] sm:p-5"
                style={{
                  marginTop: EVIDENCE_OFFSET[i],
                  borderColor: tone.line,
                  transitionProperty: "box-shadow",
                  transitionDuration: "var(--t-quick)",
                }}
              >
                {/* Numbered corner tab */}
                <span
                  className="absolute right-3 top-3 font-condensed text-[11px] font-bold tracking-[0.18em]"
                  style={{ color: tone.accent }}
                >
                  {EVIDENCE_TABS[i]}
                </span>

                {/* Tinted icon disc — nudges on hover */}
                <motion.div
                  className="grid h-12 w-12 place-items-center rounded-[var(--r-md)] border text-white"
                  style={{ backgroundColor: tone.soft, borderColor: tone.line }}
                  whileHover={reduce ? undefined : { rotate: -6, scale: 1.06 }}
                  transition={spring.press}
                >
                  <Icon size={20} style={{ color: tone.accent }} />
                </motion.div>

                <p
                  className="mt-4 font-condensed text-[11px] uppercase tracking-[0.24em]"
                  style={{ color: "rgba(255,255,255,0.58)" }}
                >
                  {item.label}
                </p>
                <p className="mt-2 font-display text-2xl text-white">{item.title}</p>
                <p className="mt-2 font-body text-sm leading-relaxed text-white/72">
                  {item.text}
                </p>

                {/* Hover shadow growth via box-shadow only (no transition:all). */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 rounded-[var(--r-lg)] opacity-0 transition-opacity duration-[var(--t-quick)] ease-[var(--ease-out)] group-hover:opacity-100 motion-reduce:transition-none"
                  style={{ boxShadow: "var(--shadow-md)" }}
                />
              </motion.article>
            );
          })}
        </motion.section>

        {/* (3) + (4) Sections + sticky "Leitura rapida" post-its. */}
        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
          {/* Section cards — ghost numeral + tone-hairline title + spine list. */}
          <div className="space-y-4">
            {document.sections.map((section, i) => (
              <motion.article
                key={section.id}
                id={`dossier-card-${section.id}`}
                className="glass-section relative overflow-hidden rounded-[var(--r-lg)] p-5 sm:p-6"
                initial={reduce ? false : { opacity: 0, y: 18 }}
                whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25, root: scrollRef }}
                transition={reduce ? { duration: 0 } : { ...spring.gentle }}
                onViewportEnter={() => setActiveId(section.id)}
              >
                {/* Large ghost numeral, top-right */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute -right-2 -top-6 select-none font-display text-[7rem] leading-none text-white/[0.06]"
                >
                  {i + 1}
                </span>

                {/* Title on a tone hairline */}
                <div
                  className="relative border-b pb-3"
                  style={{ borderColor: tone.line }}
                >
                  <HighlighterTitle
                    id={section.id}
                    title={section.title}
                    accent={tone.accent}
                    reduce={reduce}
                    root={scrollRef}
                  />
                </div>

                <p className="relative mt-3 font-body text-sm leading-relaxed text-white/76 sm:text-base">
                  {section.body}
                </p>

                {section.bullets && (
                  <SpineList
                    bullets={section.bullets}
                    accent={tone.accent}
                    reduce={reduce}
                    root={scrollRef}
                  />
                )}
              </motion.article>
            ))}
          </div>

          {/* Tilted post-it notes — sticky on lg+. */}
          <div className="space-y-5 lg:sticky lg:top-2 lg:self-start">
            <PostIt
              tilt={-2}
              accent={tone.accent}
              line={tone.line}
              reduce={reduce}
              root={scrollRef}
              eyebrow={language === "pt" ? "Leitura rapida" : "Quick read"}
              icon={Sparkles}
            >
              <div className="space-y-3">
                <div>
                  <p className="font-condensed text-[11px] uppercase tracking-[0.22em] text-white/54">
                    {language === "pt" ? "Jogo social" : "Social play"}
                  </p>
                  <p className="mt-1.5 font-body text-sm leading-relaxed text-white/74">
                    {language === "pt"
                      ? "Nao use o app para compartilhar dados sensiveis. O jogo foi desenhado para conversa e deducao em grupo."
                      : "Do not use the app to share sensitive data. The game is built for group conversation and deduction."}
                  </p>
                </div>
                <div>
                  <p className="font-condensed text-[11px] uppercase tracking-[0.22em] text-white/54">
                    {language === "pt" ? "Conta e perfil" : "Account and profile"}
                  </p>
                  <p className="mt-1.5 font-body text-sm leading-relaxed text-white/74">
                    {language === "pt"
                      ? "Cadastro e opcional. Sem login, o app ainda usa uma sessao local para identificar seu navegador."
                      : "Sign-in is optional. Without an account, the app still uses a local session to identify your browser."}
                  </p>
                </div>
              </div>
            </PostIt>

            <PostIt
              tilt={1.5}
              accent={tone.accent}
              line={tone.line}
              reduce={reduce}
              root={scrollRef}
              eyebrow={language === "pt" ? "Boas praticas" : "Best practice"}
              icon={Lock}
            >
              <p className="font-body text-sm leading-relaxed text-white/74">
                {language === "pt"
                  ? "Evite enviar documentos, contatos privados, senhas ou qualquer informacao pessoal sensivel em chats, respostas ou nomes de usuario."
                  : "Avoid posting documents, private contact details, passwords or other sensitive personal information in chat, answers or usernames."}
              </p>
            </PostIt>

            <PostIt
              tilt={-1.5}
              accent={tone.accent}
              line={tone.line}
              reduce={reduce}
              root={scrollRef}
              eyebrow={language === "pt" ? "Contato e revisao" : "Contact and review"}
              icon={AlertTriangle}
              iconColor="var(--color-gold)"
            >
              <p className="font-body text-sm leading-relaxed text-white/74">
                {language === "pt"
                  ? "Se voce precisar tratar questoes de dados, direitos autorais ou moderacao, use os contatos publicos do projeto mostrados no footer."
                  : "If you need to handle data, copyright or moderation matters, use the project's public contact channels shown in the footer."}
              </p>
            </PostIt>
          </div>
        </section>
      </motion.div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// PostIt — a tilted note card that straightens slightly on hover.
// ---------------------------------------------------------------------------
function PostIt({
  tilt,
  accent,
  line,
  reduce,
  root,
  eyebrow,
  icon: Icon,
  iconColor,
  children,
}: {
  tilt: number;
  accent: string;
  line: string;
  reduce: boolean;
  root: ViewRoot;
  eyebrow: string;
  icon: LucideIcon;
  iconColor?: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      className="post-it-paper glass-section rounded-[var(--r-md)] p-4"
      style={{ borderColor: line }}
      initial={reduce ? false : { opacity: 0, y: 14, rotate: tilt * 2.4 }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0, rotate: tilt }}
      viewport={{ once: true, amount: 0.3, root }}
      transition={reduce ? { duration: 0 } : spring.gentle}
      whileHover={reduce ? undefined : { rotate: 0, y: -3 }}
    >
      <div className="flex items-start gap-2.5">
        <Icon
          size={16}
          className="mt-0.5 shrink-0"
          style={{ color: iconColor ?? accent }}
        />
        <div className="min-w-0">
          <p className="font-condensed text-[11px] uppercase tracking-[0.24em] text-white/58">
            {eyebrow}
          </p>
          <div className="mt-2">{children}</div>
        </div>
      </div>
    </motion.div>
  );
}
