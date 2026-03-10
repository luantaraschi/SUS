import React, { useState } from "react";
import { Id } from "../../../../convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";

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
    });
  };

  if (myPlayer.status === "ready" || (myRole?.role === "master" && round.questionMain != null)) {
    return (
      <div className="bg-black/80 backdrop-blur-sm fixed inset-0 z-40 flex items-center justify-center p-4 text-center">
        <div className="rounded-3xl p-8 max-w-sm w-full bg-surface-primary/10 border border-surface-primary/20">
          <h2 className="font-display text-2xl text-white mb-4">Aguardando...</h2>
          <div className="grid grid-cols-4 gap-2">
            {players.filter((p) => !p.isBot).map((p) => (
              <div
                key={p._id}
                className={`relative flex items-center justify-center p-2 rounded-lg bg-surface-primary/5 border ${
                  p.status === "ready" || p.role === "master"
                    ? "border-game-safe/30 text-game-safe"
                    : "border-surface-primary/20 text-surface-primary/40 animate-pulse"
                }`}
              >
                <span className="text-2xl">{p.emoji}</span>
              </div>
            ))}
          </div>
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
        <div className="text-xl font-black mb-6 uppercase tracking-wider text-black">
          {roleText}
        </div>

        {myRole?.role === "impostor" ? (
          <div>
            {!myRole.secretContent ? (
              <p className="font-body text-black/70 mb-6">
                Ninguém te deu uma palavra.
                <br />
                Observe, improvise e não se entregue.
              </p>
            ) : (
              <div>
                <p className="font-body text-black/70 mb-2">Palavra de dica:</p>
                <div
                  className={`text-2xl font-display font-black text-game-impostor py-4 px-6 border-2 border-yellow-400 rounded-xl mb-6 transition-all duration-300 ${
                    isRevealing ? "blur-none" : "blur-md select-none"
                  }`}
                >
                  {myRole.secretContent}
                </div>
              </div>
            )}
          </div>
        ) : myRole?.role === "player" ? (
          <div>
            <p className="font-body text-black/70 mb-2">
              {room?.mode === "word" ? "Sua palavra secreta:" : "Sua pergunta:"}
            </p>
            <div
              className={`text-2xl font-display font-black text-game-safe py-4 px-6 border-2 border-game-safe rounded-xl mb-6 transition-all duration-300 ${
                isRevealing ? "blur-none" : "blur-md select-none"
              }`}
            >
              {myRole.secretContent}
            </div>
          </div>
        ) : (
          <div className="text-left mb-6">
            <p className="font-body text-black/70 mb-4 text-center">
              Você não joga — você cria as perguntas.
            </p>
            <div className="mb-4">
              <label className="block text-xs font-bold uppercase text-black/50 mb-1">Pergunta dos jogadores:</label>
              <textarea
                value={masterMain}
                onChange={(e) => setMasterMain(e.target.value)}
                className="w-full rounded-xl bg-black/5 border-none p-3 text-black font-body resize-none h-24"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-black/50 mb-1">Pergunta do impostor:</label>
              <textarea
                value={masterImpostor}
                onChange={(e) => setMasterImpostor(e.target.value)}
                className="w-full rounded-xl bg-black/5 border-none p-3 text-black font-body resize-none h-24"
              />
            </div>
          </div>
        )}

        {(myRole?.role === "player" ||
          (myRole?.role === "impostor" && myRole.secretContent)) && (
          <button
            onPointerDown={() => setIsRevealing(true)}
            onPointerUp={() => setIsRevealing(false)}
            onPointerLeave={() => setIsRevealing(false)}
            className="w-full bg-black/10 hover:bg-black/20 text-black font-condensed font-bold py-3 rounded-full mb-3 transition-colors active:scale-95"
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
