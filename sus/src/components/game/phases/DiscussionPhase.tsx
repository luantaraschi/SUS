import type { Doc } from "../../../../convex/_generated/dataModel";
import PlayerAvatar from "../PlayerAvatar";
import PhaseIndicator from "../PhaseIndicator";
import Timer from "../Timer";
import type { PublicPlayer, SafeRound } from "@/lib/game-view-types";

interface DiscussionPhaseProps {
  round: SafeRound;
  players: PublicPlayer[];
  myPlayer: Doc<"players">;
}

function getAvatarStatus(status: "connected" | "ready" | "disconnected") {
  return status === "connected" ? "online" : status === "ready" ? "ready" : "disconnected";
}

export function DiscussionPhase({
  round,
  players,
  myPlayer,
}: DiscussionPhaseProps) {
  const visiblePlayers = players.filter((player) => player.status !== "disconnected");

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-5xl flex-col items-center justify-center px-4 py-10">
      <PhaseIndicator currentPhase="discussion" className="mb-6 justify-center" />

      <div className="w-full rounded-[36px] border border-white/10 bg-black/25 p-6 text-center shadow-[0_24px_70px_rgba(0,0,0,0.3)] backdrop-blur-md sm:p-8">
        <p className="font-condensed text-sm uppercase tracking-[0.3em] text-white/60">
          Fase de discussao
        </p>
        <Timer endsAt={round.phaseEndsAt} className="mt-4 justify-center" />
        <p className="mx-auto mt-3 max-w-2xl font-body text-base text-white/80 sm:text-lg">
          Conversem, comparem respostas e tentem descobrir quem esta blefando antes da votacao.
        </p>
      </div>

      <div className="mt-8 grid w-full max-w-5xl grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {visiblePlayers.map((player) => (
          <div
            key={player._id}
            className={`rounded-[24px] border px-4 py-5 text-center backdrop-blur-sm ${
              player._id === myPlayer._id
                ? "border-game-safe/40 bg-white/16"
                : "border-white/10 bg-black/15"
            }`}
          >
            <PlayerAvatar
              name={player.name}
              avatarSeed={player.emoji}
              imageUrl={player.avatarImageUrl}
              isHost={player.isHost}
              isBot={player.isBot}
              status={getAvatarStatus(player.status)}
              size="md"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
