"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useSessionId } from "@/lib/useSessionId";
import { useBackground } from "@/lib/BackgroundContext";
import GameCircle from "@/components/game/GameCircle";
import GameButton from "@/components/game/GameButton";
import GameInput from "@/components/game/GameInput";
import PlayerAvatar from "@/components/game/PlayerAvatar";
import HowToPlayModal from "@/components/game/HowToPlayModal";
import SignInModal from "@/components/auth/SignInModal";
import Footer from "@/components/game/Footer";
import { BubbleText } from "@/components/ui/bubble-text";
import { Icon } from "@iconify/react";

// Gera uma seed aleatória para o avatar
function randomSeed(): string {
  const seed = Math.random().toString(36).substring(2, 10);
  return seed || crypto.randomUUID().slice(0, 8);
}

const PRESET_AVATARS = [
  "Jasper", "Felix", "Luna", "Oliver", "Cleo",
  "Milo", "Bella", "Zoe", "Leo", "Lily",
  "Charlie", "Lucy", "Max", "Mia", "Finn",
  "Jack", "Oscar", "Ruby", "Chloe", "Sam",
  "Daisy", "Buster", "Coco", "Rocky"
];

export default function HomePage() {
  const router = useRouter();
  const sessionId = useSessionId();
  const { setVariant, flashInvalid } = useBackground();
  
  const user = useQuery(api.users.current);
  const linkSession = useMutation(api.users.linkSession);

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [anonNumber] = useState(() => Math.floor(Math.random() * 900) + 100);
  const [avatarSeed, setAvatarSeed] = useState(() => randomSeed());
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showSignIn, setShowSignIn] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [shakeCircle, setShakeCircle] = useState(false);

  const createRoom = useMutation(api.rooms.createRoom);
  const joinRoom = useMutation(api.rooms.joinRoom);
  const roomExists = useQuery(
    api.rooms.checkRoomExists,
    code.length === 4 ? { code: code.toUpperCase() } : "skip"
  );

  useEffect(() => {
    if (code.length < 4) {
      setVariant("default");
    } else if (roomExists === true) {
      setVariant("valid");
    } else if (roomExists === false) {
      setVariant("default");
    }
  }, [code, roomExists, setVariant]);

  const displayName = name || `Anônimo${anonNumber}`;

  // Troca o avatar por um aleatório com animação de spin
  const handleShuffleAvatar = useCallback(() => {
    setSpinning(true);
    setAvatarSeed(randomSeed());
    setTimeout(() => setSpinning(false), 400);
  }, []);

  const handleJoin = useCallback(async () => {
    if (!sessionId || code.length !== 4) return;
    setLoading(true);
    setError("");
    try {
      await joinRoom({
        code: code.toUpperCase(),
        playerName: displayName,
        playerEmoji: avatarSeed, // reutiliza o campo emoji para guardar a seed
        sessionId,
      });
      router.push(`/room/${code.toUpperCase()}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao entrar na sala.");
      flashInvalid();
      setShakeCircle(true);
      setTimeout(() => setShakeCircle(false), 500);
    } finally {
      setLoading(false);
    }
  }, [sessionId, code, displayName, avatarSeed, joinRoom, router, flashInvalid]);

  const handleCreate = useCallback(async () => {
    if (!sessionId) return;
    setLoading(true);
    setError("");
    try {
      const result = await createRoom({
        hostName: displayName,
        hostEmoji: avatarSeed, // reutiliza o campo emoji para guardar a seed
        mode: "word",
        sessionId,
      });
      router.push(`/room/${result.code}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao criar sala.");
    } finally {
      setLoading(false);
    }
  }, [sessionId, displayName, avatarSeed, createRoom, router]);

  if (!sessionId) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <p className="font-display text-2xl text-white animate-pulse">Carregando…</p>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col items-center gap-4 relative">
      {/* Botão de Conta Superior Direito */}
      <div className="absolute top-4 right-4 z-50">
        {user ? (
          <button
            onClick={() => router.push("/profile")}
            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-full backdrop-blur-sm transition-all shadow-sm"
          >
            <PlayerAvatar name={user.name || "Conta"} avatarSeed={user.image || "default"} size="sm" hideName />
            <span className="font-display tracking-widest text-sm hidden sm:inline">Perfil</span>
          </button>
        ) : (
          <button
            onClick={() => setShowSignIn(true)}
            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-full backdrop-blur-sm transition-all shadow-sm"
          >
            <Icon icon="solar:user-circle-bold" width={24} height={24} />
            <span className="font-display tracking-widest text-sm hidden sm:inline">Criar Conta</span>
          </button>
        )}
      </div>

      {/* Logo */}
      <BubbleText 
        text="SUS" 
        className="font-display text-6xl tracking-wide drop-shadow-[0_3px_6px_rgba(0,0,0,0.3)] sm:text-7xl mt-8 sm:mt-12"
      />

      {/* Avatar preview + botão shuffle */}
      <div className="z-20 -mb-28 sm:-mb-32 relative flex flex-col items-center mt-4">
        <button
          onClick={() => setIsAvatarModalOpen(true)}
          className="relative transition-transform hover:scale-105 active:scale-95 focus:outline-none"
          style={{
            transition: "transform 0.4s ease",
            transform: spinning ? "rotate(360deg)" : "rotate(0deg)",
          }}
        >
          <PlayerAvatar
            name={displayName}
            avatarSeed={avatarSeed}
            isHost
            size="2xl"
            hideName
          />
        </button>

        <button
          onClick={handleShuffleAvatar}
          className="absolute bottom-2 -right-2 sm:bottom-4 sm:-right-0 flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-[#1e1b6e] border-4 sm:border-[5px] border-white text-white shadow-xl hover:scale-110 active:scale-95 transition-all"
          title="Trocar Avatar"
        >
          <Icon icon="solar:refresh-bold" width={28} height={28} className="sm:w-[32px] sm:h-[32px]" />
        </button>
      </div>

      <div className={`w-full flex flex-col items-center justify-center ${shakeCircle ? "animate-shake" : ""}`}>
        <GameCircle className="pt-20 pb-10 sm:pt-28 sm:pb-16 shadow-[0_12px_60px_rgba(0,0,0,0.3)]">
          <div className="flex w-full max-w-[340px] sm:max-w-[380px] flex-col items-center gap-3 sm:gap-4 px-4 sm:px-6">
            <GameInput
              value={name}
              onChange={setName}
              placeholder={`Anônimo${anonNumber}`}
              variant="text"
              maxLength={20}
            />

            <GameInput
              value={code}
              onChange={(v) => setCode(v.toUpperCase())}
              placeholder="Código"
              variant="code"
              maxLength={4}
              state={error ? "error" : code.length === 4 && roomExists === true ? "focus" : "default"}
            />

            {error && (
              <p className="font-body text-sm text-game-impostor text-center">
                {error}
              </p>
            )}

            {/* Separador visual inputs / botões */}
            <div className="w-full border-t border-gray-200 my-1" />

            <div className="flex w-full flex-col gap-3">
              <GameButton
                variant="outline"
                size="lg"
                icon={<Icon icon="solar:login-2-bold" width={20} height={20} />}
                disabled={code.length !== 4 || loading}
                onClick={handleJoin}
                className={
                  code.length !== 4 || loading
                    ? "!bg-[#e5e7eb] !text-[#9ca3af] !border-[#e5e7eb] !shadow-none !opacity-100 hover:!shadow-none"
                    : "!bg-[#1e1b6e] !text-white !border-[#1e1b6e] !shadow-[0_4px_0_rgba(0,0,0,0.3)] hover:!brightness-110 !opacity-100"
                }
              >
                Entrar
              </GameButton>

              <GameButton
                variant="filled"
                size="lg"
                icon={<Icon icon="solar:add-circle-bold" width={20} height={20} />}
                disabled={loading}
                onClick={handleCreate}
              >
                Criar Sala
              </GameButton>

              <GameButton
                variant="outline"
                size="lg"
                icon={<Icon icon="solar:book-2-bold" width={20} height={20} />}
                onClick={() => setShowHowToPlay(true)}
              >
                Como Jogar
              </GameButton>
            </div>
          </div>
        </GameCircle>
      </div>

      {/* Modal de Seleção de Avatar */}
      {isAvatarModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl text-surface-primary">Escolha seu Avatar</h2>
              <button 
                onClick={() => setIsAvatarModalOpen(false)}
                className="p-1 rounded-full hover:bg-gray-100 text-surface-primary/60 hover:text-surface-primary transition-colors"
              >
                <Icon icon="solar:close-circle-bold" width={32} height={32} />
              </button>
            </div>
            
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 overflow-y-auto max-h-[50vh] p-2 custom-scrollbar">
              {PRESET_AVATARS.map((seed) => (
                <button
                  key={seed}
                  onClick={() => {
                    setAvatarSeed(seed);
                    setIsAvatarModalOpen(false);
                  }}
                  className={`transition-all hover:scale-110 active:scale-95 flex justify-center items-center ${
                    avatarSeed === seed ? "ring-4 ring-[#1e1b6e] rounded-full scale-105" : ""
                  }`}
                >
                  <PlayerAvatar name={displayName} avatarSeed={seed} size="md" hideName />
                </button>
              ))}
            </div>
            
            <div className="pt-3 border-t border-gray-100 mt-1">
              <GameButton 
                variant="outline" 
                size="md" 
                onClick={() => {
                  setAvatarSeed(randomSeed());
                  setIsAvatarModalOpen(false);
                }} 
                className="!text-base !h-12 w-full !mb-0"
              >
                <div className="flex items-center gap-2">
                  <Icon icon="solar:refresh-bold" width={20} height={20} />
                  <span>Gerar Aleatório</span>
                </div>
              </GameButton>
            </div>
          </div>
        </div>
      )}

      {/* Modal Como Jogar */}
      {showHowToPlay && (
        <HowToPlayModal onClose={() => setShowHowToPlay(false)} />
      )}

      {/* Modal Autenticação */}
      {showSignIn && (
        <SignInModal 
          onClose={() => setShowSignIn(false)} 
          onSuccess={() => {
            setShowSignIn(false);
            if (sessionId) {
              linkSession({ sessionId }).catch(console.error);
            }
          }} 
        />
      )}
    </div>
  );
}