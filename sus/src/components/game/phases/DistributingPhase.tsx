import { useState } from "react";
import { useMutation } from "convex/react";
import type { Doc, Id } from "../../../../convex/_generated/dataModel";
import { api } from "../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import PlayerAvatar from "../PlayerAvatar";
import PostItBoard from "../PostItBoard";
import { ReactionAnchor } from "../reactions/ReactionAnchor";
import type { PublicPlayer, RoleView, SafeRound } from "@/lib/game-view-types";

interface DistributingPhaseProps {
  round: SafeRound;
  myPlayer: Doc<"players">;
  myRole?: RoleView;
  players: PublicPlayer[];
  room: Doc<"rooms">;
  sessionId: string;
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

  if (myPlayer.status === "ready" || (myRole?.role === "master" && round.questionMain != null)) {
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 p-4 text-center backdrop-blur-sm">
        <div className="w-full max-w-sm rounded-3xl border border-surface-primary/20 bg-surface-primary/10 p-8">
          <h2 className="mb-4 font-display text-2xl text-white">Aguardando...</h2>
          <div className="grid grid-cols-3 gap-4 md:grid-cols-4">
            {players.filter((player) => player.status !== "disconnected").map((player) => {
              const isReady = player.status === "ready";
              return (
                <ReactionAnchor
                  key={player._id}
                  playerId={String(player._id)}
                  className="flex flex-col items-center text-center"
                >
                  <div
                    className={`relative flex items-center justify-center rounded-2xl border bg-surface-primary/10 p-2 ${
                      isReady ? "border-game-safe/50" : "border-surface-primary/20 animate-pulse"
                    }`}
                  >
                    <PlayerAvatar
                      name={player.name}
                      avatarSeed={player.emoji}
                      imageUrl={player.avatarImageUrl}
                      size="sm"
                      hideName
                    />
                    {isReady ? (
                      <div className="absolute -bottom-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-game-safe text-xs text-black shadow-md">
                        ✓
                      </div>
                    ) : (
                      <div className="absolute -right-2 -top-2 text-sm text-white/50 animate-pulse">
                        ⏳
                      </div>
                    )}
                  </div>
                  <p className="mt-2 w-14 truncate font-condensed text-[11px] uppercase tracking-wider text-white/70">
                    {player.name}
                  </p>
                </ReactionAnchor>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (room.mode === "question" && myRole?.role !== "master" && !round.questionMain) {
    return (
      <div className="fixed inset-0 z-40 overflow-hidden bg-black/72 text-center backdrop-blur-sm">
        <PostItBoard roomId={round.roomId} sessionId={sessionId} />
        <div className="pointer-events-none absolute inset-x-0 top-6 z-10 flex justify-center px-4">
          <div className="w-full max-w-lg rounded-[28px] border border-white/10 bg-black/45 px-6 py-4 shadow-[0_18px_50px_rgba(0,0,0,0.32)] backdrop-blur-md">
            <h2 className="font-display text-2xl text-white">O Mestre esta criando a pergunta...</h2>
            <p className="mt-2 font-body text-sm text-white/75">
              Enquanto isso, deixe um recado anonimo no mural.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const roleText =
    myRole?.role === "impostor"
      ? (room.mode === "word" ? "VOCE E O SUS!" : "VOCE E O IMPOSTOR")
      : myRole?.role === "master"
        ? "VOCE E O MESTRE desta rodada"
        : "VOCE E UM JOGADOR";

  const borderColor =
    myRole?.role === "impostor"
      ? "border-game-impostor"
      : myRole?.role === "master"
        ? "border-yellow-400"
        : "border-game-safe";

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
      selectedImpostorId: selectedImpostor === "random" ? undefined : selectedImpostor,
    });
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center overflow-hidden bg-black/80 p-4 text-center backdrop-blur-sm">
      {showMasterBoardBackground && (
        <PostItBoard
          roomId={round.roomId}
          sessionId={sessionId}
          variant="background"
          allowComposer={false}
        />
      )}
      <div className={`relative z-10 w-full max-w-sm rounded-3xl border-2 bg-surface-primary p-8 shadow-2xl ${borderColor}`}>
        <div className="mb-6 text-xl font-black uppercase tracking-wider text-white">{roleText}</div>

        {myRole?.role === "impostor" ? (
          !myRole.secretContent ? (
            <p className="mb-6 font-body text-white/70">
              {room.mode === "word"
                ? "Voce nao sabe a palavra. Observe, improvise e nao se entregue."
                : "Ninguem te deu uma palavra. Observe, improvise e nao se entregue."}
            </p>
          ) : (
            <div>
              <p className="mb-2 font-body text-white/70">
                {room.mode === "word" ? "Dica de contexto:" : "Palavra de dica:"}
              </p>
              <div
                className={`mb-6 rounded-xl border-2 border-yellow-400 px-6 py-4 font-display text-2xl font-black text-game-impostor transition-all duration-300 ${
                  isRevealing ? "blur-none" : "blur-md select-none"
                }`}
              >
                {myRole.secretContent}
              </div>
            </div>
          )
        ) : myRole?.role === "player" ? (
          <div>
            <p className="mb-2 font-body text-white/70">
              {room.mode === "word" ? "Sua palavra secreta:" : "Sua pergunta:"}
            </p>
            <div
              className={`mb-6 rounded-xl border-2 border-game-safe px-6 py-4 font-display text-2xl font-black text-game-safe transition-all duration-300 ${
                isRevealing ? "blur-none" : "blur-md select-none"
              }`}
            >
              {myRole.secretContent}
            </div>
            {room.mode === "word" && (
              <p className="mb-4 text-center font-body text-sm text-white/50">
                Pense em uma palavra relacionada. Nao seja obvio.
              </p>
            )}
          </div>
        ) : (
          <div className="mb-6 text-left">
            <p className="mb-4 text-center font-body text-white/70">
              Voce nao joga. Voce cria as perguntas.
            </p>
            <div className="mb-4">
              <label className="mb-1 block text-xs font-bold uppercase text-white/50">
                Pergunta dos jogadores:
              </label>
              <textarea
                value={masterMain}
                onChange={(event) => setMasterMain(event.target.value)}
                className="h-24 w-full resize-none rounded-xl border border-white/20 bg-white/10 p-3 font-body text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-game-safe"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-white/50">
                Pergunta do impostor:
              </label>
              <textarea
                value={masterImpostor}
                onChange={(event) => setMasterImpostor(event.target.value)}
                className="h-24 w-full resize-none rounded-xl border border-white/20 bg-white/10 p-3 font-body text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-game-impostor"
              />
            </div>
            <div className="mt-4">
              <label className="mb-1 block text-xs font-bold uppercase text-white/50">
                Quem e o impostor?
              </label>
              <select
                value={selectedImpostor}
                onChange={(event) => setSelectedImpostor(event.target.value)}
                className="w-full appearance-none rounded-xl border border-white/20 bg-white/10 p-3 font-body text-white focus:outline-none focus:ring-2 focus:ring-game-impostor"
              >
                <option value="random" className="text-black">
                  Aleatorio (Sorteio)
                </option>
                {players
                  .filter((player) => !player.isBot && player._id !== (round.masterId as Id<"players"> | null))
                  .map((player) => (
                    <option key={player._id} value={player._id} className="text-black">
                      {player.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>
        )}

        {(myRole?.role === "player" || (myRole?.role === "impostor" && myRole.secretContent)) && (
          <button
            onPointerDown={() => setIsRevealing(true)}
            onPointerUp={() => setIsRevealing(false)}
            onPointerLeave={() => setIsRevealing(false)}
            className="mb-3 w-full rounded-full bg-white/10 py-3 font-condensed font-bold text-white transition-colors hover:bg-white/20 active:scale-95"
          >
            Segurar para revelar
          </button>
        )}

        {myRole?.role === "master" ? (
          <Button onClick={handleConfirmQuestions} disabled={!masterMain.trim() || !masterImpostor.trim()} className="w-full">
            ✓ Confirmar perguntas
          </Button>
        ) : (
          <Button onClick={handleConfirm} className="w-full">
            {room.mode === "word" ? "Ja decorei" : "✓ Entendi"}
          </Button>
        )}
      </div>
    </div>
  );
}
