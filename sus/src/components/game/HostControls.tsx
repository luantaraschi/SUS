"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import type { Doc } from "../../../convex/_generated/dataModel";
import { api } from "../../../convex/_generated/api";

interface HostControlsProps {
  room: Doc<"rooms">;
  sessionId: string;
  onBackToLobby: () => Promise<void>;
  isReturningToLobby: boolean;
}

export function HostControls({
  room,
  sessionId,
  onBackToLobby,
  isReturningToLobby,
}: HostControlsProps) {
  const [showConfirm, setShowConfirm] = useState<"restart" | "lobby" | null>(null);
  const restartRound = useMutation(api.rooms.restartRound);

  const handleRestart = () => {
    void restartRound({ roomId: room._id, sessionId });
    setShowConfirm(null);
  };

  const handleBackToLobby = () => {
    setShowConfirm(null);
    void onBackToLobby();
  };

  return (
    <>
      <div className="fixed right-4 top-4 z-50 flex gap-2">
        <button
          onClick={() => setShowConfirm("restart")}
          disabled={isReturningToLobby}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white/70 backdrop-blur-sm transition-all hover:bg-black/60 hover:text-white"
          title="Recomecar Rodada"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
            <path d="M16 21h5v-5" />
          </svg>
        </button>
        <button
          onClick={() => setShowConfirm("lobby")}
          disabled={isReturningToLobby}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white/70 backdrop-blur-sm transition-all hover:bg-black/60 hover:text-white"
          title="Voltar ao Lobby"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        </button>
      </div>

      {/* Confirmation dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-3xl border border-white/10 bg-surface-primary p-6 text-center shadow-2xl">
            <h3 className="mb-2 font-display text-xl text-white">
              {showConfirm === "restart" ? "Recomecar Rodada?" : "Voltar ao Lobby?"}
            </h3>
            <p className="mb-6 font-body text-sm text-white/70">
              {showConfirm === "restart"
                ? "A rodada atual sera reiniciada do zero. Novos impostores serao sorteados."
                : "A partida sera cancelada e todos voltarao ao lobby."}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(null)}
                disabled={isReturningToLobby}
                className="flex-1 rounded-full border border-white/20 bg-white/10 py-3 font-display text-sm font-bold text-white transition-all hover:bg-white/20"
              >
                Cancelar
              </button>
              <button
                disabled={isReturningToLobby}
                onClick={showConfirm === "restart" ? handleRestart : handleBackToLobby}
                className="flex-1 rounded-full bg-game-impostor py-3 font-display text-sm font-bold text-white transition-all hover:bg-game-impostor/80"
              >
                {showConfirm === "lobby" && isReturningToLobby ? "Voltando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
