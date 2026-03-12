import React, { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import PlayerAvatar from "../PlayerAvatar";

interface DistributingPhaseProps {
  round: any;
  myPlayer: any;
  myRole: any;
  players: any[];
  room: any;
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
  const setMasterQs = useMutation(api.rounds.setMasterQuestions);

  const handleConfirm = () => {
    confirmSeen({
      roundId: round._id,
      playerId: myPlayer._id,
      sessionId,
    });
  };

  const handleConfirmQuestions = () => {
    setMasterQs({
      roundId: round._id,
      sessionId,
      questionMain: masterMain,
      questionImpostor: masterImpostor,
      selectedImpostorId: selectedImpostor === "random" ? undefined : selectedImpostor,
    });
  };

  if (myPlayer.status === "ready" || (myRole?.role === "master" && round.questionMain != null)) {
    return (
      <div className="bg-black/80 backdrop-blur-sm fixed inset-0 z-40 flex items-center justify-center p-4 text-center">
        <div className="rounded-3xl p-8 max-w-sm w-full bg-surface-primary/10 border border-surface-primary/20">
          <h2 className="font-display text-2xl text-white mb-4">Aguardando...</h2>
          <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
            {players.filter((p) => p.status !== "disconnected").map((p) => (
              <div
                key={p._id}
                className="relative flex flex-col items-center justify-center text-center"
              >
                <div className={`relative flex items-center justify-center p-2 rounded-2xl bg-surface-primary/10 border ${p.status === "ready" || p.role === "master"
                    ? "border-game-safe/50"
                    : "border-surface-primary/20 animate-pulse"
                  }`}>
                  <PlayerAvatar name={p.name} avatarSeed={p.emoji} size="sm" hideName />
                  {p.status === "ready" || p.role === "master" ? (
                    <div className="absolute -bottom-2 -right-2 bg-game-safe text-black rounded-full w-5 h-5 flex items-center justify-center text-xs shadow-md">
                      ✓
                    </div>
                  ) : (
                    <div className="absolute -top-2 -right-2 text-white/50 animate-pulse text-sm">
                      ⏳
                    </div>
                  )}
                </div>
                <p className="mt-2 font-condensed text-[11px] uppercase tracking-wider text-white/70 truncate w-14">{p.name}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Se for modo pergunta, e o mestre ainda não tiver escolhido a pergunta, exiba a tela de aguardando para os jogadores
  if (room?.mode === "question" && myRole?.role !== "master" && !round.questionMain) {
    return (
      <div className="bg-black/80 backdrop-blur-sm fixed inset-0 z-40 flex items-center justify-center p-4 text-center">
        <div className="rounded-3xl p-8 max-w-sm w-full bg-surface-primary/10 border border-surface-primary/20">
          <h2 className="font-display text-2xl text-white mb-4">O Mestre está criando a pergunta...</h2>
          <div className="w-12 h-12 border-4 border-game-safe border-t-transparent flex items-center justify-center rounded-full animate-spin mx-auto mt-6" />
        </div>
      </div>
    );
  }

  const roleText =
    myRole?.role === "impostor"
      ? "VOCÊ É O IMPOSTOR"
      : myRole?.role === "master"
        ? "VOCÊ É O MESTRE desta rodada"
        : "VOCÊ É UM JOGADOR";

  const borderColor =
    myRole?.role === "impostor"
      ? "border-game-impostor"
      : myRole?.role === "master"
        ? "border-yellow-400"
        : "border-game-safe";

  return (
    <div className="bg-black/80 backdrop-blur-sm fixed inset-0 z-40 flex items-center justify-center p-4 text-center">
      <div
        className={`rounded-3xl p-8 max-w-sm w-full bg-surface-primary shadow-2xl border-2 ${borderColor}`}
      >
        <div className="text-xl font-black mb-6 uppercase tracking-wider text-white">
          {roleText}
        </div>

        {myRole?.role === "impostor" ? (
          <div>
            {!myRole.secretContent ? (
              <p className="font-body text-white/70 mb-6">
                Ninguém te deu uma palavra.
                <br />
                Observe, improvise e não se entregue.
              </p>
            ) : (
              <div>
                <p className="font-body text-white/70 mb-2">Palavra de dica:</p>
                <div
                  className={`text-2xl font-display font-black text-game-impostor py-4 px-6 border-2 border-yellow-400 rounded-xl mb-6 transition-all duration-300 ${isRevealing ? "blur-none" : "blur-md select-none"
                    }`}
                >
                  {myRole.secretContent}
                </div>
              </div>
            )}
          </div>
        ) : myRole?.role === "player" ? (
          <div>
            <p className="font-body text-white/70 mb-2">
              {room?.mode === "word" ? "Sua palavra secreta:" : "Sua pergunta:"}
            </p>
            <div
              className={`text-2xl font-display font-black text-game-safe py-4 px-6 border-2 border-game-safe rounded-xl mb-6 transition-all duration-300 ${isRevealing ? "blur-none" : "blur-md select-none"
                }`}
            >
              {myRole.secretContent}
            </div>
          </div>
        ) : (
          <div className="text-left mb-6">
            <p className="font-body text-white/70 mb-4 text-center">
              Você não joga — você cria as perguntas.
            </p>
            <div className="mb-4">
              <label className="block text-xs font-bold uppercase text-white/50 mb-1">Pergunta dos jogadores:</label>
              <textarea
                value={masterMain}
                onChange={(e) => setMasterMain(e.target.value)}
                className="w-full rounded-xl bg-white/10 border border-white/20 p-3 text-white placeholder-white/50 font-body resize-none h-24 focus:outline-none focus:ring-2 focus:ring-game-safe"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-white/50 mb-1">Pergunta do impostor:</label>
              <textarea
                value={masterImpostor}
                onChange={(e) => setMasterImpostor(e.target.value)}
                className="w-full rounded-xl bg-white/10 border border-white/20 p-3 text-white placeholder-white/50 font-body resize-none h-24 focus:outline-none focus:ring-2 focus:ring-game-impostor"
              />
            </div>
            <div className="mt-4">
              <label className="block text-xs font-bold uppercase text-white/50 mb-1">Quem é o impostor?</label>
              <select
                value={selectedImpostor}
                onChange={(e) => setSelectedImpostor(e.target.value)}
                className="w-full rounded-xl bg-white/10 border border-white/20 p-3 text-white font-body focus:outline-none focus:ring-2 focus:ring-game-impostor appearance-none"
              >
                <option value="random" className="text-black">Aleatório (Sorteio)</option>
                {players.filter(p => !p.isBot && p._id !== round.masterId).map(p => (
                  <option key={p._id} value={p._id} className="text-black">{p.name}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {(myRole?.role === "player" ||
          (myRole?.role === "impostor" && myRole.secretContent)) && (
            <button
              onPointerDown={() => setIsRevealing(true)}
              onPointerUp={() => setIsRevealing(false)}
              onPointerLeave={() => setIsRevealing(false)}
              className="w-full bg-white/10 hover:bg-white/20 text-white font-condensed font-bold py-3 rounded-full mb-3 transition-colors active:scale-95"
            >
              Segurar para revelar
            </button>
          )}

        {myRole?.role === "master" ? (
          <Button
            onClick={handleConfirmQuestions}
            disabled={!masterMain || !masterImpostor}
            className="w-full"
          >
            ✓ Confirmar perguntas
          </Button>
        ) : (
          <Button onClick={handleConfirm} className="w-full">
            ✓ Entendi
          </Button>
        )}
      </div>
    </div>
  );
}
