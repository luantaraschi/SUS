"use client";

import { useMutation, useQuery } from "convex/react";
import type { Doc } from "../../../../convex/_generated/dataModel";
import { api } from "../../../../convex/_generated/api";
import PlayerAvatar from "../PlayerAvatar";
import PhaseIndicator from "../PhaseIndicator";
import { motion } from "framer-motion";
import type { PublicPlayer, RoleView, SafeRound } from "@/lib/game-view-types";

interface SpeakingPhaseProps {
  round: SafeRound;
  players: PublicPlayer[];
  myPlayer: Doc<"players">;
  myRole?: RoleView;
  room: Doc<"rooms">;
  sessionId: string;
}

export function SpeakingPhase({
  round,
  players,
  myPlayer,
  myRole,
  room,
  sessionId,
}: SpeakingPhaseProps) {
  const speakingState = useQuery(api.rounds.getSpeakingState, {
    roundId: round._id,
  });
  const passTurn = useMutation(api.rounds.passTurn);
  const requestVoting = useMutation(api.rounds.requestVoting);

  const isHost = myPlayer.isHost;
  const isImpostor = myRole?.isImpostor ?? false;

  if (!speakingState) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-surface-primary border-t-transparent" />
      </div>
    );
  }

  const { speakingOrder, currentSpeakerIndex, votingRequestedBy } =
    speakingState;
  const currentSpeakerId = speakingOrder[currentSpeakerIndex];
  const isMyTurn = currentSpeakerId === myPlayer._id;

  const currentSpeaker = players.find((p) => p._id === currentSpeakerId);
  const orderedPlayers = speakingOrder
    .map((id) => players.find((p) => p._id === id))
    .filter(Boolean) as PublicPlayer[];

  const humanActive = players.filter(
    (p) => p.status !== "disconnected" && !p.isBot
  );
  const majority = Math.ceil(humanActive.length / 2);
  const hasRequestedVoting = votingRequestedBy.includes(myPlayer._id);

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-5xl flex-col px-4 py-6">
      <PhaseIndicator
        currentPhase="speaking"
        mode="word"
        className="mb-4 justify-center"
      />

      {/* Private reminder pinned at top */}
      <div
        className={`mx-auto mb-6 w-full max-w-md rounded-2xl border-2 px-5 py-3 text-center ${
          isImpostor
            ? "border-game-impostor/50 bg-game-impostor/10"
            : "border-game-safe/50 bg-game-safe/10"
        }`}
      >
        {isImpostor ? (
          <>
            <p className="font-display text-lg font-black uppercase text-game-impostor">
              Voce e o SUS!
            </p>
            {myRole?.secretContent && (
              <p className="mt-1 font-body text-sm text-white/60">
                Dica de contexto: {myRole.secretContent}
              </p>
            )}
          </>
        ) : (
          <>
            <p className="font-condensed text-xs uppercase tracking-widest text-white/50">
              Sua palavra
            </p>
            <p className="mt-1 font-display text-2xl font-black text-game-safe">
              {myRole?.secretContent ?? "???"}
            </p>
          </>
        )}
      </div>

      {/* Current speaker indicator */}
      <div className="mb-6 text-center">
        <p className="font-condensed text-sm uppercase tracking-[0.3em] text-white/60">
          Vez de
        </p>
        <p className="mt-1 font-display text-3xl text-white">
          {currentSpeaker?.name ?? "..."}
        </p>
      </div>

      {/* Speaking order list */}
      <div className="mx-auto grid w-full max-w-3xl grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {orderedPlayers.map((player, index) => {
          const isCurrent = index === currentSpeakerIndex;
          const isMe = player._id === myPlayer._id;

          return (
            <motion.div
              key={player._id}
              animate={
                isCurrent
                  ? {
                      boxShadow: [
                        "0 0 0px rgba(0,184,235,0)",
                        "0 0 20px rgba(0,184,235,0.5)",
                        "0 0 0px rgba(0,184,235,0)",
                      ],
                    }
                  : {}
              }
              transition={
                isCurrent
                  ? { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
                  : {}
              }
              className={`flex flex-col items-center rounded-[24px] border px-4 py-4 text-center backdrop-blur-sm transition-all ${
                isCurrent
                  ? "border-game-info/60 bg-game-info/15 scale-105"
                  : isMe
                    ? "border-game-safe/30 bg-white/10 opacity-80"
                    : "border-white/10 bg-black/15 opacity-50"
              }`}
            >
              <PlayerAvatar
                name={player.name}
                avatarSeed={player.emoji}
                imageUrl={player.avatarImageUrl}
                isHost={player.isHost}
                isBot={player.isBot}
                size="md"
                hideName
              />
              <p className="mt-2 max-w-[100px] truncate font-display text-sm text-white">
                {player.name}
              </p>
              {isCurrent && (
                <span className="mt-1 font-condensed text-[10px] uppercase tracking-widest text-game-info">
                  Falando
                </span>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Action buttons */}
      <div className="mx-auto mt-8 flex w-full max-w-md flex-col items-center gap-4">
        {isMyTurn ? (
          <button
            onClick={() =>
              void passTurn({
                roundId: round._id,
                playerId: myPlayer._id,
                sessionId,
              })
            }
            className="w-full rounded-full bg-game-info px-8 py-4 font-display text-lg font-black uppercase tracking-wider text-white shadow-lg transition-all hover:brightness-110 active:scale-95"
          >
            Ja falei
          </button>
        ) : (
          <div className="w-full rounded-full bg-white/10 px-8 py-4 text-center font-display text-lg font-black uppercase tracking-wider text-white/40">
            Aguardando {currentSpeaker?.name ?? "..."}
          </div>
        )}

        <div className="flex w-full flex-col items-center gap-2">
          <button
            onClick={() =>
              void requestVoting({
                roundId: round._id,
                playerId: myPlayer._id,
                sessionId,
              })
            }
            disabled={hasRequestedVoting && !isHost}
            className={`w-full rounded-full border px-6 py-3 font-display text-sm font-black uppercase tracking-wider transition-all ${
              hasRequestedVoting && !isHost
                ? "border-game-warning/30 bg-game-warning/10 text-game-warning/60 cursor-not-allowed"
                : "border-game-warning/50 bg-game-warning/15 text-game-warning hover:bg-game-warning/25 active:scale-95"
            }`}
          >
            {isHost
              ? "Iniciar Votacao (Host)"
              : hasRequestedVoting
                ? "Voto registrado"
                : "Iniciar Votacao"}
          </button>
          <p className="font-condensed text-xs uppercase tracking-widest text-white/40">
            {votingRequestedBy.length}/{majority} votos para ir a votacao
          </p>
        </div>
      </div>
    </div>
  );
}
