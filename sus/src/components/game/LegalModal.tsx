"use client";

import { motion } from "framer-motion";
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
  X,
} from "lucide-react";
import { useI18n } from "@/lib/I18nContext";
import type { Language } from "@/lib/locales";
import { GlassPanel, GlassSection } from "./ui/glass";

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

function getTone(type: LegalModalProps["type"]) {
  return type === "privacy" ? "info" : "special";
}

const HEADER_ICONS: Record<LegalModalProps["type"], LucideIcon> = {
  privacy: ShieldCheck,
  terms: ScrollText,
};

export function LegalModal({ isOpen, onClose, type }: LegalModalProps) {
  const { t, language } = useI18n();

  if (!isOpen) return null;

  const document = DOCUMENTS[language][type];
  const HeaderIcon = HEADER_ICONS[type];
  const tone = getTone(type);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-black/72 backdrop-blur-md"
        onClick={onClose}
      />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-5xl max-h-[92vh]"
      >
        <GlassPanel
          tone={tone}
          className="overflow-hidden rounded-[34px] p-5 sm:p-6"
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/8 text-white/72 transition-all hover:border-white/20 hover:bg-white/14 hover:text-white"
            title={t("close")}
          >
            <X size={20} />
          </button>

          <div className="custom-scrollbar relative z-10 max-h-[calc(92vh-2.5rem)] overflow-y-auto pr-1">
            <div className="space-y-5">
              <section className="relative overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.16),rgba(255,255,255,0.06))] px-5 py-5 shadow-[0_24px_60px_rgba(0,0,0,0.22)] sm:px-6 sm:py-6">
                <div className="absolute inset-y-0 right-[-12%] w-44 rounded-full bg-white/10 blur-3xl" />
                <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                  <div className="max-w-3xl">
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3 py-1.5 font-condensed text-[11px] uppercase tracking-[0.28em] text-white/66">
                      <HeaderIcon size={14} />
                      {document.eyebrow}
                    </div>
                    <h2 className="mt-4 font-display text-3xl text-white sm:text-4xl">
                      {document.title}
                    </h2>
                    <p className="mt-3 max-w-2xl font-body text-sm leading-relaxed text-white/76 sm:text-base">
                      {document.subtitle}
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 text-sm text-white/74 sm:min-w-[240px]">
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3 py-2 font-condensed text-[11px] uppercase tracking-[0.24em] text-white/68">
                      <Clock3 size={14} />
                      {document.updatedAt}
                    </div>
                    <div className="rounded-[22px] border border-white/10 bg-black/12 p-4 text-white/72 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                      <div className="flex items-start gap-3">
                        <Sparkles size={18} className="mt-0.5 shrink-0 text-white/82" />
                        <p className="font-body text-sm leading-relaxed">{document.note}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="grid gap-4 lg:grid-cols-3">
                {document.highlights.map((item) => {
                  const Icon = item.icon;

                  return (
                    <GlassSection
                      key={item.label}
                      className="rounded-[26px] p-4 sm:p-5"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-white shadow-[0_14px_30px_rgba(0,0,0,0.18)]">
                        <Icon size={20} />
                      </div>
                      <p className="mt-4 font-condensed text-[11px] uppercase tracking-[0.24em] text-white/58">
                        {item.label}
                      </p>
                      <p className="mt-2 font-display text-2xl text-white">
                        {item.title}
                      </p>
                      <p className="mt-2 font-body text-sm leading-relaxed text-white/72">
                        {item.text}
                      </p>
                    </GlassSection>
                  );
                })}
              </section>

              <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
                <div className="space-y-4">
                  {document.sections.map((section) => (
                    <GlassSection
                      key={section.id}
                      className="rounded-[28px] p-5 sm:p-6"
                    >
                      <h3 className="font-display text-2xl text-white sm:text-[2rem]">
                        {section.title}
                      </h3>
                      <p className="mt-3 font-body text-sm leading-relaxed text-white/76 sm:text-base">
                        {section.body}
                      </p>
                      {section.bullets && (
                        <ul className="mt-4 space-y-3">
                          {section.bullets.map((bullet) => (
                            <li key={bullet} className="flex items-start gap-3">
                              <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-white/80" />
                              <span className="font-body text-sm leading-relaxed text-white/74 sm:text-[15px]">
                                {bullet}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </GlassSection>
                  ))}
                </div>

                <div className="space-y-4">
                  <GlassSection className="rounded-[28px] p-5">
                    <p className="font-condensed text-[11px] uppercase tracking-[0.24em] text-white/58">
                      {language === "pt" ? "Leitura rapida" : "Quick read"}
                    </p>
                    <div className="mt-4 space-y-3">
                      <div className="rounded-[20px] border border-white/10 bg-white/8 p-4">
                        <p className="font-condensed text-[11px] uppercase tracking-[0.22em] text-white/54">
                          {language === "pt" ? "Jogo social" : "Social play"}
                        </p>
                        <p className="mt-2 font-body text-sm leading-relaxed text-white/74">
                          {language === "pt"
                            ? "Nao use o app para compartilhar dados sensiveis. O jogo foi desenhado para conversa e deducao em grupo."
                            : "Do not use the app to share sensitive data. The game is built for group conversation and deduction."}
                        </p>
                      </div>
                      <div className="rounded-[20px] border border-white/10 bg-white/8 p-4">
                        <p className="font-condensed text-[11px] uppercase tracking-[0.22em] text-white/54">
                          {language === "pt" ? "Conta e perfil" : "Account and profile"}
                        </p>
                        <p className="mt-2 font-body text-sm leading-relaxed text-white/74">
                          {language === "pt"
                            ? "Cadastro e opcional. Sem login, o app ainda usa uma sessao local para identificar seu navegador."
                            : "Sign-in is optional. Without an account, the app still uses a local session to identify your browser."}
                        </p>
                      </div>
                    </div>
                  </GlassSection>

                  <GlassSection className="rounded-[28px] p-5">
                    <div className="flex items-start gap-3">
                      <Lock size={18} className="mt-0.5 shrink-0 text-white/80" />
                      <div>
                        <p className="font-condensed text-[11px] uppercase tracking-[0.24em] text-white/58">
                          {language === "pt" ? "Boas praticas" : "Best practice"}
                        </p>
                        <p className="mt-3 font-body text-sm leading-relaxed text-white/74">
                          {language === "pt"
                            ? "Evite enviar documentos, contatos privados, senhas ou qualquer informacao pessoal sensivel em chats, respostas ou nomes de usuario."
                            : "Avoid posting documents, private contact details, passwords or other sensitive personal information in chat, answers or usernames."}
                        </p>
                      </div>
                    </div>
                  </GlassSection>

                  <GlassSection className="rounded-[28px] p-5">
                    <div className="flex items-start gap-3">
                      <AlertTriangle size={18} className="mt-0.5 shrink-0 text-[#ffd67a]" />
                      <div>
                        <p className="font-condensed text-[11px] uppercase tracking-[0.24em] text-white/58">
                          {language === "pt" ? "Contato e revisao" : "Contact and review"}
                        </p>
                        <p className="mt-3 font-body text-sm leading-relaxed text-white/74">
                          {language === "pt"
                            ? "Se voce precisar tratar questoes de dados, direitos autorais ou moderacao, use os contatos publicos do projeto mostrados no footer."
                            : "If you need to handle data, copyright or moderation matters, use the project's public contact channels shown in the footer."}
                        </p>
                      </div>
                    </div>
                  </GlassSection>
                </div>
              </section>
            </div>
          </div>
        </GlassPanel>
      </motion.div>
    </div>
  );
}
