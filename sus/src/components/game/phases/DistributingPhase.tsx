import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useMutation } from "convex/react";
import type { Doc, Id } from "../../../../convex/_generated/dataModel";
import { api } from "../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import PlayerAvatar from "../PlayerAvatar";
import PostItBoard from "../PostItBoard";
import { ReactionAnchor } from "../reactions/ReactionAnchor";
import GlassSelect from "../ui/GlassSelect";
import {
  GlassField,
  GlassLabel,
  GlassPanel,
  GlassSection,
  GlassTextarea,
  type GlassTone,
  glassToneClasses,
} from "../ui/glass";
import type { PublicPlayer, RoleView, SafeRound } from "@/lib/game-view-types";
import {
  Check,
  CircleDashed,
  Clock3,
  Crown,
  Eye,
  EyeOff,
  Shield,
  ShieldAlert,
  Sparkles,
} from "lucide-react";

interface DistributingPhaseProps {
  round: SafeRound;
  myPlayer: Doc<"players">;
  myRole?: RoleView;
  players: PublicPlayer[];
  room: Doc<"rooms">;
  sessionId: string;
}

function getRoleMeta(
  role: NonNullable<RoleView>["role"] | undefined,
  mode: Doc<"rooms">["mode"]
): {
  tone: GlassTone;
  title: string;
  subtitle: string;
  accentLabel: string;
  icon: typeof Shield;
} {
  if (role === "impostor") {
    return {
      tone: "impostor",
      title: mode === "word" ? "VOCE E O SUS" : "VOCE E O IMPOSTOR",
      subtitle:
        mode === "word"
          ? "Observe o grupo, improvise e proteja seu blefe."
          : "Leia o ambiente, responda com calma e nao se entregue.",
      accentLabel: "Papel secreto",
      icon: ShieldAlert,
    };
  }

  if (role === "master") {
    return {
      tone: "special",
      title: "VOCE E O MESTRE DA RODADA",
      subtitle: "Voce nao joga. Sua funcao e desenhar a rodada e observar a mesa.",
      accentLabel: "Controle da rodada",
      icon: Crown,
    };
  }

  return {
    tone: "safe",
    title: "VOCE E UM JOGADOR",
    subtitle:
      mode === "word"
        ? "Guarde a palavra, pense em pistas inteligentes e nao entregue demais."
        : "Leia a pergunta, responda com personalidade e compare as reacoes depois.",
    accentLabel: "Informacao privada",
    icon: Shield,
  };
}

export function DistributingPhase({
  round,
  myPlayer,
  myRole,
  players,
  room,
  sessionId,
}: DistributingPhaseProps) {
  const [isRevealing, setIsRevealing] = useState(false);
  const [masterMain, setMasterMain] = useState("");
  const [masterImpostor, setMasterImpostor] = useState("");
  const [selectedImpostor, setSelectedImpostor] = useState("random");
  const confirmSeen = useMutation(api.rounds.confirmSeen);
  const setMasterQuestions = useMutation(api.rounds.setMasterQuestions);
  const showMasterBoardBackground =
    room.mode === "question" &&
    myRole?.role === "master" &&
    round.questionMain == null;

  const roleMeta = getRoleMeta(myRole?.role, room.mode);
  const RoleIcon = roleMeta.icon;

  const impostorOptions = useMemo(
    () => [
      { value: "random", label: "Aleatorio (Sorteio)" },
      ...players
        .filter(
          (player) =>
            !player.isBot &&
            player._id !== (round.masterId as Id<"players"> | null)
        )
        .map((player) => ({
          value: String(player._id),
          label: player.name,
        })),
    ],
    [players, round.masterId]
  );

  if (
    myPlayer.status === "ready" ||
    (myRole?.role === "master" && round.questionMain != null)
  ) {
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center overflow-hidden bg-black/80 p-4 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-4xl"
        >
          <GlassPanel tone="info" className="rounded-[36px] p-6 sm:p-8">
            <div className="relative z-10">
              <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/14 bg-white/10 shadow-[0_20px_45px_rgba(0,0,0,0.2)]">
                  <Clock3 size={28} className="text-sky-100" />
                </div>
                <p className="mt-4 font-condensed text-xs uppercase tracking-[0.34em] text-white/56">
                  Preparando rodada
                </p>
                <h2 className="mt-3 font-display text-3xl text-white sm:text-4xl">
                  Distribuindo papeis
                </h2>
                <p className="mt-3 max-w-xl font-body text-sm leading-relaxed text-white/72 sm:text-base">
                  Cada jogador precisa conferir a propria tela. Quem ja confirmou aparece marcado abaixo.
                </p>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {players
                  .filter((player) => player.status !== "disconnected")
                  .map((player) => {
                    const isReady = player.status === "ready";

                    return (
                      <ReactionAnchor
                        key={player._id}
                        playerId={String(player._id)}
                        className="h-full"
                      >
                        <GlassSection
                          className={cn(
                            "h-full rounded-[24px] p-4 transition-all duration-200",
                            isReady
                              ? "border-emerald-300/18 bg-emerald-400/10"
                              : "border-white/10 bg-white/6"
                          )}
                        >
                          <div className="flex flex-col items-center text-center">
                            <div
                              className={cn(
                                "mb-3 flex h-8 min-w-8 items-center justify-center rounded-full border px-2 text-[10px] uppercase tracking-[0.22em]",
                                isReady
                                  ? "border-emerald-300/20 bg-emerald-300/16 text-emerald-50"
                                  : "border-white/10 bg-white/8 text-white/52"
                              )}
                            >
                              {isReady ? "Pronto" : "Lendo"}
                            </div>
                            <PlayerAvatar
                              name={player.name}
                              avatarSeed={player.emoji}
                              imageUrl={player.avatarImageUrl}
                              size="sm"
                              hideName
                            />
                            <p className="mt-3 w-full truncate font-body text-sm text-white/88">
                              {player.name}
                            </p>
                            <div className="mt-3 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/8">
                              {isReady ? (
                                <Check size={16} className="text-emerald-200" />
                              ) : (
                                <CircleDashed
                                  size={16}
                                  className="animate-spin text-white/45"
                                />
                              )}
                            </div>
                          </div>
                        </GlassSection>
                      </ReactionAnchor>
                    );
                  })}
              </div>
            </div>
          </GlassPanel>
        </motion.div>
      </div>
    );
  }

  if (room.mode === "question" && myRole?.role !== "master" && !round.questionMain) {
    return (
      <div className="fixed inset-0 z-40 overflow-hidden bg-black/72 text-center backdrop-blur-sm">
        <PostItBoard roomId={round.roomId} sessionId={sessionId} />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,184,235,0.12),transparent_38%),radial-gradient(circle_at_bottom,rgba(214,77,194,0.18),transparent_44%)]" />
        <div className="pointer-events-none absolute inset-x-0 top-6 z-10 flex justify-center px-4">
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-2xl"
          >
            <GlassPanel tone="info" className="rounded-[32px] px-6 py-5">
              <div className="relative z-10 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-white/14 bg-white/10">
                  <Sparkles size={24} className="text-sky-100" />
                </div>
                <p className="mt-4 font-condensed text-xs uppercase tracking-[0.32em] text-white/56">
                  Modo mestre
                </p>
                <h2 className="mt-3 font-display text-3xl text-white">
                  O mestre esta criando a pergunta
                </h2>
                <p className="mx-auto mt-3 max-w-lg font-body text-sm leading-relaxed text-white/72 sm:text-base">
                  Enquanto isso, deixe um recado anonimo no mural. A rodada continua assim que ele confirmar.
                </p>
              </div>
            </GlassPanel>
          </motion.div>
        </div>
      </div>
    );
  }

  const handleConfirm = () => {
    void confirmSeen({
      roundId: round._id,
      playerId: myPlayer._id,
      sessionId,
    });
  };

  const handleConfirmQuestions = () => {
    void setMasterQuestions({
      roundId: round._id,
      sessionId,
      questionMain: masterMain,
      questionImpostor: masterImpostor,
      selectedImpostorId:
        selectedImpostor === "random" ? undefined : (selectedImpostor as Id<"players">),
    });
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center overflow-hidden bg-black/80 p-4 backdrop-blur-md">
      {showMasterBoardBackground && (
        <PostItBoard
          roomId={round.roomId}
          sessionId={sessionId}
          variant="background"
          allowComposer={false}
        />
      )}

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_26%),radial-gradient(circle_at_bottom,rgba(214,77,194,0.16),transparent_36%)]" />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-2xl"
      >
        <GlassPanel
          tone={roleMeta.tone}
          className="rounded-[36px] px-5 py-6 sm:px-7 sm:py-8"
        >
          <div className="relative z-10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    "flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-white/14 bg-white/10 shadow-[0_18px_40px_rgba(0,0,0,0.18)]",
                    roleMeta.tone === "impostor" && "text-rose-100",
                    roleMeta.tone === "safe" && "text-emerald-100",
                    roleMeta.tone === "special" && "text-amber-100"
                  )}
                >
                  <RoleIcon size={24} />
                </div>

                <div>
                  <p className="font-condensed text-[11px] uppercase tracking-[0.28em] text-white/56">
                    {roleMeta.accentLabel}
                  </p>
                  <h2 className="mt-1 font-display text-2xl text-white sm:text-[2rem]">
                    {roleMeta.title}
                  </h2>
                </div>
              </div>

              <div className="self-start rounded-full border border-white/10 bg-white/8 px-3 py-1.5 font-condensed text-[11px] uppercase tracking-[0.22em] text-white/62">
                Rodada em preparo
              </div>
            </div>

            <p className="mt-5 max-w-xl font-body text-sm leading-relaxed text-white/72 sm:text-base">
              {roleMeta.subtitle}
            </p>

            {myRole?.role === "impostor" ? (
              !myRole.secretContent ? (
                <GlassSection className="mt-6 rounded-[28px] p-5 text-left sm:p-6">
                  <p className="font-condensed text-[11px] uppercase tracking-[0.24em] text-white/52">
                    Sua situacao
                  </p>
                  <p className="mt-3 font-body text-base leading-relaxed text-white/84">
                    {room.mode === "word"
                      ? "Voce nao recebeu a palavra. Leia o clima da mesa, absorva o contexto e blefe com precisao."
                      : "Voce recebeu a pergunta alternativa. Responda como se estivesse totalmente no contexto."}
                  </p>
                </GlassSection>
              ) : (
                <GlassSection className="mt-6 rounded-[28px] p-5 sm:p-6">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-condensed text-[11px] uppercase tracking-[0.24em] text-white/52">
                        {room.mode === "word" ? "Dica de contexto" : "Pergunta do impostor"}
                      </p>
                      <p className="mt-2 font-body text-sm text-white/68">
                        O conteudo fica borrado ate voce pressionar o botao abaixo.
                      </p>
                    </div>
                    <div className="rounded-full border border-rose-300/16 bg-rose-300/12 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-rose-50">
                      Sus
                    </div>
                  </div>

                  <div
                    className={cn(
                      "mt-5 rounded-[24px] border border-white/10 bg-black/18 px-5 py-6 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition-all duration-300",
                      isRevealing ? "blur-none" : "blur-md select-none"
                    )}
                  >
                    <p className="font-display text-2xl text-white sm:text-3xl">
                      {myRole.secretContent}
                    </p>
                  </div>
                </GlassSection>
              )
            ) : myRole?.role === "player" ? (
              <GlassSection className="mt-6 rounded-[28px] p-5 sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-condensed text-[11px] uppercase tracking-[0.24em] text-white/52">
                      {room.mode === "word" ? "Sua palavra secreta" : "Sua pergunta"}
                    </p>
                    <p className="mt-2 font-body text-sm text-white/68">
                      Revele so para voce e memorize antes de confirmar.
                    </p>
                  </div>
                  <div className="rounded-full border border-emerald-300/16 bg-emerald-300/12 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-emerald-50">
                    Seguro
                  </div>
                </div>

                <div
                  className={cn(
                    "mt-5 rounded-[24px] border border-white/10 bg-black/18 px-5 py-6 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition-all duration-300",
                    isRevealing ? "blur-none" : "blur-md select-none"
                  )}
                >
                  <p className="font-display text-2xl text-white sm:text-3xl">
                    {myRole.secretContent}
                  </p>
                </div>

                {room.mode === "word" && (
                  <p className="mt-4 text-center font-body text-sm text-white/56">
                    Pense em uma pista relacionada. Seja especifico sem entregar demais.
                  </p>
                )}
              </GlassSection>
            ) : (
              <GlassSection className="mt-6 rounded-[28px] p-5 text-left sm:p-6">
                <div className="grid gap-4">
                  <div>
                    <GlassLabel htmlFor="master-main-question">
                      Pergunta dos jogadores
                    </GlassLabel>
                    <GlassField className="mt-2 rounded-[22px]">
                      <GlassTextarea
                        id="master-main-question"
                        value={masterMain}
                        onChange={(event) => setMasterMain(event.target.value)}
                        placeholder="Ex.: Qual resposta parece correta sem ser obvia?"
                      />
                    </GlassField>
                  </div>

                  <div>
                    <GlassLabel htmlFor="master-impostor-question">
                      Pergunta do impostor
                    </GlassLabel>
                    <GlassField className="mt-2 rounded-[22px]">
                      <GlassTextarea
                        id="master-impostor-question"
                        value={masterImpostor}
                        onChange={(event) => setMasterImpostor(event.target.value)}
                        placeholder="Crie uma pergunta diferente, mas capaz de gerar resposta parecida."
                      />
                    </GlassField>
                  </div>

                  <div>
                    <GlassLabel htmlFor="master-impostor-select">
                      Quem e o impostor?
                    </GlassLabel>
                    <div className="mt-2">
                      <GlassSelect
                        ariaLabel="Selecionar impostor da rodada"
                        value={selectedImpostor}
                        onChange={setSelectedImpostor}
                        options={impostorOptions}
                        tone="special"
                        className="rounded-[22px]"
                      />
                    </div>
                  </div>
                </div>
              </GlassSection>
            )}

            {(myRole?.role === "player" ||
              (myRole?.role === "impostor" && myRole.secretContent)) && (
              <button
                type="button"
                onPointerDown={() => setIsRevealing(true)}
                onPointerUp={() => setIsRevealing(false)}
                onPointerLeave={() => setIsRevealing(false)}
                onPointerCancel={() => setIsRevealing(false)}
                className="group relative mt-5 w-full overflow-hidden rounded-[22px] border border-white/12 bg-white/8 px-4 py-4 text-left text-white transition-all duration-200 hover:bg-white/12"
              >
                <span
                  className={cn(
                    "pointer-events-none absolute inset-y-0 left-0 rounded-[inherit] bg-white/14 transition-[width] duration-700",
                    isRevealing ? "w-full" : "w-0"
                  )}
                />
                <span className="relative flex items-center justify-between gap-4">
                  <span>
                    <span className="block font-condensed text-[11px] uppercase tracking-[0.24em] text-white/54">
                      Privado
                    </span>
                    <span className="mt-1 block font-display text-xl">
                      {isRevealing ? "Solte para esconder" : "Segure para revelar"}
                    </span>
                  </span>
                  <span className="flex h-11 w-11 items-center justify-center rounded-full border border-white/12 bg-white/8">
                    {isRevealing ? <EyeOff size={18} /> : <Eye size={18} />}
                  </span>
                </span>
              </button>
            )}

            {myRole?.role === "master" ? (
              <Button
                onClick={handleConfirmQuestions}
                disabled={!masterMain.trim() || !masterImpostor.trim()}
                className={cn(
                  "mt-5 h-[52px] w-full rounded-[22px] border border-white/10 bg-white text-[15px] font-semibold text-[#1a0b3d] shadow-[0_16px_36px_rgba(255,255,255,0.16)] transition-transform hover:-translate-y-0.5 hover:bg-white disabled:border-white/8 disabled:bg-white/20 disabled:text-white/42",
                  glassToneClasses(roleMeta.tone)
                )}
              >
                Confirmar perguntas
              </Button>
            ) : (
              <Button
                onClick={handleConfirm}
                className="mt-5 h-[52px] w-full rounded-[22px] border border-white/10 bg-white text-[15px] font-semibold text-[#1a0b3d] shadow-[0_16px_36px_rgba(255,255,255,0.16)] transition-transform hover:-translate-y-0.5 hover:bg-white"
              >
                {room.mode === "word" ? "Ja decorei" : "Entendi"}
              </Button>
            )}
          </div>
        </GlassPanel>
      </motion.div>
    </div>
  );
}
