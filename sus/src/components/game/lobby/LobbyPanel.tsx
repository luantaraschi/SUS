"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { Id } from "../../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import ThemePickerDialog from "@/components/game/ThemePickerDialog";
import GlassSelect from "@/components/game/ui/GlassSelect";
import { THEME_ICON_MAP } from "@/lib/themeIcons";
import { spring } from "@/lib/motion";
import CodeBlock from "./CodeBlock";
import Counter from "./Counter";
import { MAX_PLAYERS, MAX_ROUNDS, MIN_PLAYERS, MIN_ROUNDS } from "./useRoomSettings";

type Mode = "word" | "question";
type QuestionMode = "system" | "master";

type PackOption = {
  key: string;
  title: string;
  icon: string;
  source: "default" | "custom";
  count: number;
};

type LobbyPlayer = {
  _id: Id<"players">;
  name: string;
  isHost: boolean;
  status: "connected" | "ready" | "disconnected";
};

type LobbyPanelRoom = {
  settings: {
    maxPlayers: number;
    rounds: number;
    impostorHint: boolean;
    customMasterId?: string;
    customPackId?: string;
    defaultPackKey?: string;
  };
  mode: Mode;
  questionMode?: QuestionMode;
};

export type LobbyPanelProps = {
  room: LobbyPanelRoom;
  code: string;
  codeHidden: boolean;
  copied: boolean;
  codeCopied: boolean;
  playerCount: number;
  numImpostors: number;
  maxImpostors: number;
  packOptions: PackOption[];
  players: LobbyPlayer[];
  isHost: boolean;
  actionError: string;
  isAddingBot: boolean;
  startDisabled: boolean;
  startReadinessMessage: string | null;
  onToggleCodeHidden: () => void;
  onShare: () => void;
  onCopyCode: () => void;
  onChangeMaxPlayers: (delta: number) => void;
  onChangeRounds: (delta: number) => void;
  onChangeImpostors: (delta: number) => void;
  onModeChange: (mode: Mode) => void;
  onQuestionModeChange: (mode: QuestionMode) => void;
  onMasterChange: (playerId: string) => void;
  onPackChange: (packId: string) => void;
  onToggleHint: () => void;
  onAddBot: () => void;
  onStart: () => void;
  onLeave: () => void;
};

function SegmentedToggle<T extends string>({
  options,
  value,
  onChange,
  disabled,
  layoutId,
}: {
  options: Array<{ value: T; label: string }>;
  value: T;
  onChange: (value: T) => void;
  disabled: boolean;
  layoutId: string;
}) {
  return (
    <div className="relative isolate flex rounded-[var(--r-pill)] border border-[var(--glass-border)] bg-[var(--glass-1)] p-1">
      {options.map((option) => {
        const active = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            disabled={disabled}
            aria-pressed={active}
            className={`relative z-10 rounded-[var(--r-pill)] px-6 py-2.5 font-display text-sm uppercase tracking-widest transition-colors duration-[var(--t-quick)] focus-visible:outline-none focus-visible:shadow-[var(--ring-focus)] disabled:cursor-not-allowed sm:px-7 sm:text-base ${
              active ? "text-white" : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            }`}
          >
            {option.label}
            {active && (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 -z-10 rounded-[var(--r-pill)] bg-[linear-gradient(180deg,var(--color-primary-1),var(--color-primary-2))] shadow-[var(--shadow-sm)]"
                transition={spring.pop}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

/**
 * The main lobby panel: room code, settings, mode/theme, player guidance and
 * the host actions. Rendered once and reused across the mobile and desktop
 * layouts of the room page.
 */
export default function LobbyPanel({
  room,
  code,
  codeHidden,
  copied,
  codeCopied,
  playerCount,
  numImpostors,
  maxImpostors,
  packOptions,
  players,
  isHost,
  actionError,
  isAddingBot,
  startDisabled,
  startReadinessMessage,
  onToggleCodeHidden,
  onShare,
  onCopyCode,
  onChangeMaxPlayers,
  onChangeRounds,
  onChangeImpostors,
  onModeChange,
  onQuestionModeChange,
  onMasterChange,
  onPackChange,
  onToggleHint,
  onAddBot,
  onStart,
  onLeave,
}: LobbyPanelProps) {
  const reduceMotion = useReducedMotion();
  const [isThemeDialogOpen, setIsThemeDialogOpen] = useState(false);

  const selectedPackValue = room.settings.customPackId
    ? `custom:${room.settings.customPackId}`
    : `default:${room.settings.defaultPackKey || "classico"}`;
  const selectedPack = packOptions.find(
    (pack) => (pack.source === "default" ? `default:${pack.key}` : `custom:${pack.key}`) === selectedPackValue
  );
  const showPackPicker = packOptions.length > 0 && !(room.mode === "question" && room.questionMode === "master");
  const belowMinimum = playerCount < MIN_PLAYERS;
  const roomFull = playerCount >= room.settings.maxPlayers;

  const handlePackSelection = (value: string) => {
    onPackChange(value);
    setIsThemeDialogOpen(false);
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto pr-1">
        <div className="flex min-h-full flex-col items-center gap-5 pb-2">
          <CodeBlock
            code={code.toUpperCase()}
            hidden={codeHidden}
            copied={codeCopied}
            linkCopied={copied}
            onToggleHidden={onToggleCodeHidden}
            onCopyCode={onCopyCode}
            onShare={onShare}
          />

          <div className="flex flex-wrap justify-center gap-x-5 gap-y-4 sm:gap-x-8">
            <Counter
              label="Jogadores"
              value={room.settings.maxPlayers}
              onDecrement={() => onChangeMaxPlayers(-1)}
              onIncrement={() => onChangeMaxPlayers(1)}
              disableDecrement={!isHost || room.settings.maxPlayers <= Math.max(MIN_PLAYERS, playerCount)}
              disableIncrement={!isHost || room.settings.maxPlayers >= MAX_PLAYERS}
            />
            <Counter
              label="Rodadas"
              value={room.settings.rounds}
              onDecrement={() => onChangeRounds(-1)}
              onIncrement={() => onChangeRounds(1)}
              disableDecrement={!isHost || room.settings.rounds <= MIN_ROUNDS}
              disableIncrement={!isHost || room.settings.rounds >= MAX_ROUNDS}
            />
            <Counter
              label="Impostores"
              value={numImpostors}
              onDecrement={() => onChangeImpostors(-1)}
              onIncrement={() => onChangeImpostors(1)}
              disableDecrement={!isHost || numImpostors <= 1}
              disableIncrement={!isHost || numImpostors >= maxImpostors}
            />
          </div>

          <SegmentedToggle
            layoutId="modeIndicator"
            value={room.mode}
            onChange={onModeChange}
            disabled={!isHost}
            options={[
              { value: "word", label: "Palavra" },
              { value: "question", label: "Pergunta" },
            ]}
          />

          {showPackPicker && (
            <button
              type="button"
              onClick={() => setIsThemeDialogOpen(true)}
              className="flex w-full max-w-[420px] items-center justify-between rounded-[var(--r-md)] border border-[var(--glass-border)] bg-[var(--glass-1)] px-4 py-3 transition-[background-color,transform] duration-[var(--t-quick)] hover:bg-[var(--glass-2)] active:scale-[0.99] focus-visible:outline-none focus-visible:shadow-[var(--ring-focus)]"
            >
              <span className="flex min-w-0 items-center gap-3">
                <Icon
                  icon={THEME_ICON_MAP[selectedPack?.icon ?? "star"] ?? "solar:star-bold"}
                  width={20}
                  height={20}
                  className="shrink-0 text-[var(--color-special)]"
                />
                <span className="truncate font-body text-base text-[var(--color-text)]">
                  {selectedPack?.title ?? "Clássico"}
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-2">
                <span className="hidden font-condensed text-[11px] uppercase tracking-[0.22em] text-[var(--color-text-muted)] sm:inline">
                  Tema
                </span>
                <Icon icon="solar:alt-arrow-down-bold" width={16} height={16} className="text-[var(--color-text-muted)]" />
              </span>
            </button>
          )}

          {showPackPicker && (
            <ThemePickerDialog
              open={isThemeDialogOpen}
              onOpenChange={setIsThemeDialogOpen}
              selectedPackValue={selectedPackValue}
              packOptions={packOptions}
              isHost={isHost}
              onSelectPack={handlePackSelection}
            />
          )}

          {room.mode === "word" && (
            <button
              type="button"
              onClick={onToggleHint}
              disabled={!isHost}
              aria-pressed={room.settings.impostorHint}
              className="flex items-center gap-3 focus-visible:outline-none disabled:cursor-not-allowed"
            >
              <span
                className={`relative h-7 w-12 rounded-[var(--r-pill)] transition-colors duration-[var(--t-quick)] sm:h-8 sm:w-14 ${
                  room.settings.impostorHint ? "bg-[var(--color-safe)]" : "bg-[var(--glass-2)]"
                } ${!isHost ? "opacity-50" : ""}`}
              >
                <span
                  className={`absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-white shadow-[var(--shadow-sm)] transition-transform duration-[var(--t-quick)] sm:h-7 sm:w-7 ${
                    room.settings.impostorHint ? "translate-x-5 sm:translate-x-6" : ""
                  }`}
                />
              </span>
              <span className="font-condensed text-xs uppercase tracking-[0.18em] text-[var(--color-text-muted)] sm:text-sm">
                Dica do Impostor
              </span>
            </button>
          )}

          {room.mode === "question" && (
            <div className="flex w-full max-w-[420px] flex-col items-center gap-3 rounded-[var(--r-lg)] border border-[var(--glass-border)] bg-[var(--glass-1)] px-4 py-4">
              <span className="font-condensed text-xs uppercase tracking-[0.22em] text-[var(--color-text-muted)] sm:text-sm">
                Tipo de Pergunta
              </span>
              <SegmentedToggle
                layoutId="questionModeIndicator"
                value={room.questionMode === "master" ? "master" : "system"}
                onChange={onQuestionModeChange}
                disabled={!isHost}
                options={[
                  { value: "system", label: "Prontas" },
                  { value: "master", label: "Mestre Cria" },
                ]}
              />

              {room.questionMode === "master" && (
                <div className="flex w-full flex-col items-center gap-2">
                  <span className="font-condensed text-[11px] uppercase tracking-[0.22em] text-[var(--color-text-muted)] sm:text-sm">
                    Quem será o Mestre?
                  </span>
                  <GlassSelect
                    ariaLabel="Selecionar mestre da rodada"
                    value={String(room.settings.customMasterId || players.find((player) => player.isHost)?._id || "")}
                    onChange={onMasterChange}
                    disabled={!isHost}
                    tone="special"
                    className="w-full max-w-[260px]"
                    options={players
                      .filter((player) => player.status !== "disconnected")
                      .map((player) => ({
                        value: String(player._id),
                        label: `${player.name}${player.isHost ? " (Host)" : ""}`,
                      }))}
                  />
                </div>
              )}
            </div>
          )}

          {/* Player count + empty-state guidance */}
          <div className="flex w-full max-w-[420px] flex-col items-center gap-2">
            <p className="text-center font-body text-sm text-[var(--color-text-muted)] sm:text-base">
              <span className="tnum font-display text-[var(--color-text)]">{playerCount}</span>{" "}
              jogador{playerCount !== 1 ? "es" : ""} na sala
            </p>

            <AnimatePresence initial={false}>
              {belowMinimum && (
                <motion.div
                  key="empty-state"
                  initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={spring.gentle}
                  className="flex w-full flex-col items-center gap-2.5 rounded-[var(--r-lg)] border border-dashed border-[var(--w-28)] bg-[var(--glass-1)] px-4 py-4 text-center"
                >
                  <Icon icon="solar:users-group-rounded-bold" width={26} height={26} className="text-[var(--color-warn)]" />
                  <p className="font-body text-sm text-[var(--color-text)]">
                    Faltam jogadores para começar{" "}
                    <span className="text-[var(--color-text-muted)]">(mínimo {MIN_PLAYERS}).</span>
                  </p>
                  {isHost ? (
                    <p className="font-body text-xs text-[var(--color-text-muted)]">
                      Adicione bots ou compartilhe o código para começar.
                    </p>
                  ) : (
                    <p className="font-body text-xs text-[var(--color-text-muted)]">
                      Aguarde mais jogadores entrarem na sala.
                    </p>
                  )}
                  {isHost && (
                    <Button
                      variant="safe"
                      size="game-sm"
                      onClick={onAddBot}
                      disabled={isAddingBot || roomFull}
                      className="!w-auto px-5"
                    >
                      <Icon icon="solar:add-circle-bold" width={18} height={18} />
                      Adicionar Bot
                    </Button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {isHost && !belowMinimum && !roomFull && (
              <button
                type="button"
                onClick={onAddBot}
                disabled={isAddingBot}
                className="flex items-center gap-1.5 rounded-[var(--r-pill)] border border-[var(--glass-border)] bg-[var(--glass-1)] px-4 py-2 font-display text-xs uppercase tracking-widest text-[var(--color-text)] transition-[background-color,transform] duration-[var(--t-quick)] hover:bg-[var(--glass-2)] active:scale-[0.96] focus-visible:outline-none focus-visible:shadow-[var(--ring-focus)] disabled:opacity-50 sm:text-sm"
              >
                <Icon
                  icon={isAddingBot ? "solar:refresh-bold" : "solar:add-circle-bold"}
                  width={16}
                  height={16}
                  className={isAddingBot ? "animate-spin" : ""}
                />
                Adicionar Bot
              </button>
            )}

            {startReadinessMessage && (
              <p className="text-center font-body text-xs text-[var(--color-imp)] sm:text-sm">{startReadinessMessage}</p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-auto flex w-full flex-col gap-2 border-t border-[var(--glass-border)] pt-4">
        <AnimatePresence initial={false}>
          {actionError && (
            <motion.p
              key={actionError}
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-center font-body text-xs text-[var(--color-imp)] sm:text-sm"
            >
              {actionError}
            </motion.p>
          )}
        </AnimatePresence>
        {isHost && (
          <Button variant="primary" size="game-lg" onClick={onStart} disabled={startDisabled}>
            <Icon icon="solar:play-bold" width={20} height={20} />
            Iniciar
          </Button>
        )}
        <Button variant="glass" size="game-lg" onClick={onLeave}>
          <Icon icon="solar:arrow-left-bold" width={20} height={20} />
          Voltar
        </Button>
      </div>
    </div>
  );
}
