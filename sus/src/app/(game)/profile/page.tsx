"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useSessionId } from "@/lib/useSessionId";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { BubbleText } from "@/components/ui/bubble-text";
import { useAuthActions } from "@convex-dev/auth/react";
import GameButton from "@/components/game/GameButton";
import PlayerAvatar from "@/components/game/PlayerAvatar";

export default function ProfilePage() {
  const router = useRouter();
  const sessionId = useSessionId();
  const { signOut } = useAuthActions();

  const user = useQuery(api.users.current);
  const histories = useQuery(api.history.getPlayerHistory, sessionId ? { sessionId } : "skip");

  if (!sessionId || histories === undefined) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <p className="font-display text-2xl text-white animate-pulse">Carregando perfil...</p>
      </div>
    );
  }

  const handleLogout = () => {
    void signOut();
    router.push("/");
  };

  const totalGames = histories.length;
  const impostorGames = histories.filter((h: any) => h.wasImpostor > 0).length;
  const crewGames = totalGames - impostorGames;
  const crewWins = histories.filter((h: any) => h.wasImpostor === 0 && h.correctVotes > 0).length;
  const wins = histories.filter((h: any) => h.finalRank === 1).length;

  return (
    <div className="flex w-full flex-col items-center gap-6 px-4 py-8 pb-20">
      {/* Botão Voltar */}
      <div className="w-full max-w-2xl flex items-center justify-between">
        <button
          onClick={() => router.push("/")}
          className="flex items-center justify-center w-12 h-12 bg-white/20 hover:bg-white/30 text-white rounded-full backdrop-blur-sm transition-all shadow-sm"
        >
          <Icon icon="solar:arrow-left-bold" width={24} height={24} />
        </button>

        {user && (
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-red-500/80 hover:bg-red-500 text-white px-4 py-2 rounded-full backdrop-blur-sm transition-all shadow-sm font-display tracking-widest text-sm uppercase"
          >
            Sair da Conta
          </button>
        )}
      </div>

      {/* Header */}
      <div className="flex flex-col items-center gap-4">
        <PlayerAvatar 
          name={user?.name || "Visitante"} 
          avatarSeed={user?.image || "default"} 
          size="2xl" 
          hideName 
        />
        <BubbleText 
          text={user?.name || "Visitante"} 
          className="font-display text-5xl sm:text-6xl tracking-wide drop-shadow-[0_3px_6px_rgba(0,0,0,0.3)]"
        />
        {!user && (
          <p className="text-white/60 font-body text-center max-w-sm">
            Crie uma conta para sincronizar seu histórico entre dispositivos!
          </p>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 w-full max-w-2xl mt-4">
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
          <Icon icon="solar:gamepad-bold" width={32} height={32} className="text-blue-300 mb-2" />
          <span className="text-3xl font-display text-white">{totalGames}</span>
          <span className="text-xs font-condensed uppercase tracking-widest text-white/70">Partidas</span>
        </div>
        
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
          <Icon icon="solar:medal-star-bold" width={32} height={32} className="text-yellow-400 mb-2" />
          <span className="text-3xl font-display text-white">{wins}</span>
          <span className="text-xs font-condensed uppercase tracking-widest text-white/70">Vitórias</span>
        </div>

        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
          <Icon icon="solar:ghost-bold" width={32} height={32} className="text-red-400 mb-2" />
          <span className="text-3xl font-display text-white">{impostorGames}</span>
          <span className="text-xs font-condensed uppercase tracking-widest text-white/70">Vezes Impostor</span>
        </div>

        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
          <Icon icon="solar:magnifer-bold" width={32} height={32} className="text-green-400 mb-2" />
          <span className="text-3xl font-display text-white">{crewWins}</span>
          <span className="text-xs font-condensed uppercase tracking-widest text-white/70">Acertos (Tripulante)</span>
        </div>
      </div>

      {user && (
        <button
          onClick={() => router.push("/profile/packs")}
          className="w-full max-w-2xl bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md text-white font-display text-lg py-4 rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2 mt-2"
        >
          <Icon icon="solar:folder-with-files-bold" width={24} /> Meus Pacotes Customizados
        </button>
      )}

      {/* Histórico Recente */}
      <div className="w-full max-w-2xl bg-white rounded-3xl p-5 sm:p-8 mt-4 shadow-2xl">
        <h3 className="font-display text-2xl text-[#1e1b6e] mb-6 flex items-center gap-2">
          <Icon icon="solar:history-bold" width={28} height={28} />
          Últimas Partidas
        </h3>

        {histories.length === 0 ? (
          <div className="text-center py-8 text-gray-400 font-body">
            Nenhuma partida registrada ainda.
            <br />
            Jogue uma partida até o final para salvar seu histórico!
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {histories.map((game: any, i: number) => (
              <div 
                key={i}
                className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-2xl p-4 hover:border-gray-200 transition-colors"
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-display text-lg text-gray-800">
                      Sala {game.roomCode}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-gray-200 text-gray-600 text-[10px] font-condensed uppercase tracking-wider">
                      {game.mode}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500 font-body">
                    {new Date(game.playedAt).toLocaleDateString()} • {game.totalPlayers} jogadores
                  </span>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <span className={`font-display text-xl ${game.finalRank === 1 ? "text-yellow-500" : "text-gray-400"}`}>
                    {game.finalRank}º Lugar
                  </span>
                  <span className="text-xs font-condensed uppercase tracking-widest text-gray-400">
                    {game.wasImpostor > 0 ? "Fui Impostor" : "Fui Tripulante"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
