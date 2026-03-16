"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { Icon } from "@iconify/react";
import { api } from "../../../convex/_generated/api";
import GameCircle from "@/components/game/GameCircle";
import GameButton from "@/components/game/GameButton";
import GameInput from "@/components/game/GameInput";
import PlayerAvatar from "@/components/game/PlayerAvatar";
import HowToPlayModal from "@/components/game/HowToPlayModal";
import SignInModal from "@/components/auth/SignInModal";
import GameSettingsButton from "@/components/game/GameSettingsButton";
import IdentityBar from "@/components/game/IdentityBar";
import { BubbleText } from "@/components/ui/bubble-text";
import { useBackground } from "@/lib/BackgroundContext";
import { useSessionId } from "@/lib/useSessionId";

function randomSeed(): string {
  const seed = Math.random().toString(36).substring(2, 10);
  return seed || crypto.randomUUID().slice(0, 8);
}

const PRESET_AVATARS = [
  "Jasper",
  "Felix",
  "Luna",
  "Oliver",
  "Cleo",
  "Milo",
  "Bella",
  "Zoe",
  "Leo",
  "Lily",
  "Charlie",
  "Lucy",
  "Max",
  "Mia",
  "Finn",
  "Jack",
  "Oscar",
  "Ruby",
  "Chloe",
  "Sam",
  "Daisy",
  "Buster",
  "Coco",
  "Rocky",
];

export default function HomePage() {
  const router = useRouter();
  const sessionId = useSessionId();
  const { setVariant, flashInvalid } = useBackground();

  const profile = useQuery(api.profiles.current);
  const linkSession = useMutation(api.users.linkSession);
  const createRoom = useMutation(api.rooms.createRoom);
  const joinRoom = useMutation(api.rooms.joinRoom);

  const [guestName, setGuestName] = useState("");
  const [code, setCode] = useState("");
  const [anonNumber] = useState(() => Math.floor(Math.random() * 900) + 100);
  const [guestAvatarSeed, setGuestAvatarSeed] = useState(() => randomSeed());
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showSignIn, setShowSignIn] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [shakePanel, setShakePanel] = useState(false);

  const roomExists = useQuery(
    api.rooms.checkRoomExists,
    code.length === 4 ? { code: code.toUpperCase() } : "skip"
  );

  useEffect(() => {
    if (code.length < 4) {
      setVariant("default");
      return;
    }

    if (roomExists === true) {
      setVariant("valid");
      return;
    }

    setVariant("default");
  }, [code, roomExists, setVariant]);

  const isLoggedIn = profile !== null && profile !== undefined;
  const displayName = isLoggedIn ? profile.displayName : guestName || `Anonimo${anonNumber}`;
  const avatarSeed = isLoggedIn ? profile.avatarSeed : guestAvatarSeed;
  const avatarImageUrl = isLoggedIn ? profile.avatarUrl : null;

  const handleShuffleAvatar = useCallback(() => {
    setSpinning(true);
    setGuestAvatarSeed(randomSeed());
    window.setTimeout(() => setSpinning(false), 400);
  }, []);

  const handleJoin = useCallback(async () => {
    if (!sessionId || code.length !== 4) return;

    setLoading(true);
    setError("");

    try {
      await joinRoom({
        code: code.toUpperCase(),
        playerName: displayName,
        playerEmoji: avatarSeed,
        playerAvatarImageUrl: avatarImageUrl ?? undefined,
        sessionId,
      });
      router.push(`/room/${code.toUpperCase()}`);
    } catch (joinError) {
      setError(joinError instanceof Error ? joinError.message : "Erro ao entrar na sala.");
      flashInvalid();
      setShakePanel(true);
      window.setTimeout(() => setShakePanel(false), 500);
    } finally {
      setLoading(false);
    }
  }, [avatarImageUrl, avatarSeed, code, displayName, flashInvalid, joinRoom, router, sessionId]);

  const handleCreate = useCallback(async () => {
    if (!sessionId) return;

    setLoading(true);
    setError("");

    try {
      const result = await createRoom({
        hostName: displayName,
        hostEmoji: avatarSeed,
        hostAvatarImageUrl: avatarImageUrl ?? undefined,
        mode: "word",
        sessionId,
      });
      router.push(`/room/${result.code}`);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Erro ao criar sala.");
    } finally {
      setLoading(false);
    }
  }, [avatarImageUrl, avatarSeed, createRoom, displayName, router, sessionId]);

  if (!sessionId || profile === undefined) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <p className="font-display text-2xl text-white animate-pulse">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-[calc(100dvh-8rem)] w-full flex-col items-center justify-center gap-4 pb-16 pt-2 sm:gap-5 sm:pb-20">
      <div className="absolute right-4 top-4 z-50 flex items-center gap-2">
        <GameSettingsButton sessionId={sessionId} />
        {isLoggedIn ? (
          <button
            onClick={() => router.push("/profile")}
            className="flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-white shadow-sm backdrop-blur-sm transition-all hover:bg-white/30"
          >
            <PlayerAvatar
              name={profile.displayName}
              avatarSeed={profile.avatarSeed}
              imageUrl={profile.avatarUrl}
              size="sm"
              hideName
            />
            <span className="hidden font-display text-sm tracking-widest sm:inline">Perfil</span>
          </button>
        ) : (
          <button
            onClick={() => setShowSignIn(true)}
            className="flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-white shadow-sm backdrop-blur-sm transition-all hover:bg-white/30"
          >
            <Icon icon="solar:user-circle-bold" width={24} height={24} />
            <span className="hidden font-display text-sm tracking-widest sm:inline">Criar Conta</span>
          </button>
        )}
      </div>

      <BubbleText
        text="SUS"
        className="mt-4 font-display text-6xl tracking-wide drop-shadow-[0_3px_6px_rgba(0,0,0,0.3)] sm:mt-8 sm:text-7xl"
      />

      <div className="relative z-20 -mb-12 flex flex-col items-center sm:-mb-14">
        <button
          onClick={() => {
            if (isLoggedIn) {
              router.push("/profile");
            } else {
              setIsAvatarModalOpen(true);
            }
          }}
          className="relative transition-transform hover:scale-105 active:scale-95 focus:outline-none"
          style={{
            transition: "transform 0.4s ease",
            transform: spinning ? "rotate(360deg)" : "rotate(0deg)",
          }}
        >
          <PlayerAvatar
            name={displayName}
            avatarSeed={avatarSeed}
            imageUrl={avatarImageUrl}
            isHost
            size="2xl"
            hideName
          />
        </button>

        {isLoggedIn ? (
          <button
            onClick={() => router.push("/profile")}
            className="mt-3 rounded-full border border-white/30 bg-white/15 px-4 py-2 text-xs font-condensed uppercase tracking-[0.24em] text-white/80 backdrop-blur-sm transition-colors hover:bg-white/25"
          >
            Editar no perfil
          </button>
        ) : (
          <button
            onClick={handleShuffleAvatar}
            className="absolute -right-1 bottom-2 flex h-14 w-14 items-center justify-center rounded-full border-4 border-white bg-[#1e1b6e] text-white shadow-xl transition-all hover:scale-110 active:scale-95 sm:bottom-4 sm:right-0 sm:h-16 sm:w-16 sm:border-[5px]"
            title="Trocar Avatar"
          >
            <Icon icon="solar:refresh-bold" width={28} height={28} className="sm:h-8 sm:w-8" />
          </button>
        )}
      </div>

      <div className={`flex w-full justify-center ${shakePanel ? "animate-shake" : ""}`}>
        <GameCircle className="min-h-[500px] max-w-[660px] px-5 pb-8 pt-20 sm:min-h-[540px] sm:px-8 sm:pb-10 sm:pt-24">
          <div className="flex h-full w-full flex-col items-center justify-center">
            <div className="flex w-full max-w-[430px] flex-col items-center gap-4">
              <div className="w-full">
                <GameInput
                  value={displayName}
                  onChange={isLoggedIn ? () => undefined : setGuestName}
                  placeholder={`Anonimo${anonNumber}`}
                  variant="text"
                  maxLength={20}
                  readOnly={isLoggedIn}
                />
                {isLoggedIn && (
                  <p className="mt-2 text-center font-body text-xs text-surface-primary/55">
                    O nome e a foto usados nas salas vem do seu perfil.
                  </p>
                )}
              </div>

              <GameInput
                value={code}
                onChange={(value) => setCode(value.toUpperCase())}
                placeholder="Codigo"
                variant="code"
                maxLength={4}
                state={error ? "error" : code.length === 4 && roomExists === true ? "focus" : "default"}
              />

              {error && (
                <p className="text-center font-body text-sm text-game-impostor">{error}</p>
              )}

              <div className="my-2 h-px w-full bg-surface-primary/12" />

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
          </div>
        </GameCircle>
      </div>

      {isAvatarModalOpen && !isLoggedIn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="flex w-full max-w-md flex-col gap-4 rounded-3xl bg-white p-5 shadow-2xl animate-in fade-in zoom-in duration-200 sm:p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl text-surface-primary">Escolha seu Avatar</h2>
              <button
                onClick={() => setIsAvatarModalOpen(false)}
                className="rounded-full p-1 text-surface-primary/60 transition-colors hover:bg-gray-100 hover:text-surface-primary"
              >
                <Icon icon="solar:close-circle-bold" width={32} height={32} />
              </button>
            </div>

            <div className="grid max-h-[50vh] grid-cols-4 gap-3 overflow-y-auto p-2 sm:grid-cols-5 custom-scrollbar">
              {PRESET_AVATARS.map((seed) => (
                <button
                  key={seed}
                  onClick={() => {
                    setGuestAvatarSeed(seed);
                    setIsAvatarModalOpen(false);
                  }}
                  className={`flex items-center justify-center transition-all hover:scale-110 active:scale-95 ${
                    guestAvatarSeed === seed ? "scale-105 rounded-full ring-4 ring-[#1e1b6e]" : ""
                  }`}
                >
                  <PlayerAvatar name={displayName} avatarSeed={seed} size="md" hideName />
                </button>
              ))}
            </div>

            <div className="mt-1 border-t border-gray-100 pt-3">
              <GameButton
                variant="outline"
                size="md"
                onClick={() => {
                  setGuestAvatarSeed(randomSeed());
                  setIsAvatarModalOpen(false);
                }}
                className="!mb-0 !h-12 !text-base"
              >
                <div className="flex items-center gap-2">
                  <Icon icon="solar:refresh-bold" width={20} height={20} />
                  <span>Gerar Aleatorio</span>
                </div>
              </GameButton>
            </div>
          </div>
        </div>
      )}

      {showHowToPlay && <HowToPlayModal onClose={() => setShowHowToPlay(false)} />}

      {showSignIn && (
        <SignInModal
          onClose={() => setShowSignIn(false)}
          onSuccess={() => {
            setShowSignIn(false);
            if (!sessionId) return;
            void linkSession({ sessionId });
          }}
        />
      )}

      <IdentityBar
        name={displayName}
        avatarSeed={avatarSeed}
        imageUrl={avatarImageUrl}
        statusLabel={isLoggedIn ? "Conta" : "Convidado"}
        detailLabel={isLoggedIn ? "Perfil sincronizado" : `Sessao local ${sessionId.slice(0, 8)}`}
      />
    </div>
  );
}
