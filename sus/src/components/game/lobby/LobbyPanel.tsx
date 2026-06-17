"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { Id } from "../../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Switch } from "@/components/ui/Switch";
import { Burst } from "@/components/ui/Burst";
import ThemePickerDialog from "@/components/game/ThemePickerDialog";
import GlassSelect from "@/components/game/ui/GlassSelect";
import { THEME_ICON_MAP } from "@/lib/themeIcons";
import { spring, staggerContainer, staggerItem } from "@/lib/motion";
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
  isStartingGame: boolean;
  startDisabled: boolean;
  /** A changing value fires the launch celebration (Burst + panel settle). */
  launchKey: number;
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

/** Hairline divider used between the grouped counters (inset, not a border). */
const consoleDivider = "hidden h-12 w-px self-center bg-[var(--glass-border)] sm:block";

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
  isStartingGame,
  startDisabled,
  launchKey,
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
  const questionMode: QuestionMode = room.questionMode === "master" ? "master" : "system";

  const handlePackSelection = (value: string) => {
    onPackChange(value);
    setIsThemeDialogOpen(false);
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto pr-1">
        {/* Launch settle: a single confident scale dip on the whole stack when
            the game is armed (driven by launchKey, no key= so the panel stays
            mounted and scroll/dialog state is preserved). */}
        <motion.div
          initial={false}
          animate={
            reduceMotion || launchKey === 0
              ? { scale: 1 }
              : { scale: [1, 0.985, 1], transition: { duration: 0.4, ease: "easeOut" } }
          }
          className="flex min-h-full origin-center flex-col"
        >
        {/* The briefing assembles top-to-bottom. */}
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="flex min-h-full flex-1 flex-col items-center gap-5 pb-2"
        >
          {/* Mission-control eyebrow */}
          <motion.span
            variants={staggerItem}
            className="font-condensed text-[11px] uppercase tracking-[0.28em] text-[var(--text-dim)]"
          >
            Briefing da Sala
          </motion.span>

          <motion.div variants={staggerItem} className="w-full">
            <CodeBlock
              code={code.toUpperCase()}
              hidden={codeHidden}
              copied={codeCopied}
              linkCopied={copied}
              onToggleHidden={onToggleCodeHidden}
              onCopyCode={onCopyCode}
              onShare={onShare}
            />
          </motion.div>

          {/* Console: the three steppers read as one instrument cluster. */}
          <motion.div
            variants={staggerItem}
            className="flex w-full max-w-[460px] items-stretch justify-center gap-3 rounded-[var(--r-lg)] border border-[var(--glass-border)] bg-[var(--glass-1)] px-3 py-3 shadow-[var(--shadow-sm)] sm:gap-0 sm:px-5"
          >
            <div className="flex flex-1 justify-center sm:px-2">
              <Counter
                label="Jogadores"
                value={room.settings.maxPlayers}
                onDecrement={() => onChangeMaxPlayers(-1)}
                onIncrement={() => onChangeMaxPlayers(1)}
                disableDecrement={!isHost || room.settings.maxPlayers <= Math.max(MIN_PLAYERS, playerCount)}
                disableIncrement={!isHost || room.settings.maxPlayers >= MAX_PLAYERS}
              />
            </div>
            <span aria-hidden className={consoleDivider} />
            <div className="flex flex-1 justify-center sm:px-2">
              <Counter
                label="Rodadas"
                value={room.settings.rounds}
                onDecrement={() => onChangeRounds(-1)}
                onIncrement={() => onChangeRounds(1)}
                disableDecrement={!isHost || room.settings.rounds <= MIN_ROUNDS}
                disableIncrement={!isHost || room.settings.rounds >= MAX_ROUNDS}
              />
            </div>
            <span aria-hidden className={consoleDivider} />
            <div className="flex flex-1 justify-center sm:px-2">
              <Counter
                label="Impostores"
                value={numImpostors}
                onDecrement={() => onChangeImpostors(-1)}
                onIncrement={() => onChangeImpostors(1)}
                disableDecrement={!isHost || numImpostors <= 1}
                disableIncrement={!isHost || numImpostors >= maxImpostors}
                accent="imp"
              />
            </div>
          </motion.div>

          <motion.div variants={staggerItem} className="w-full max-w-[420px]">
            <SegmentedControl
              aria-label="Modo de jogo"
              tone="primary"
              value={room.mode}
              onChange={(v) => onModeChange(v as Mode)}
              options={[
                {
                  value: "word",
                  label: "Palavra",
                  icon: <Icon icon="solar:document-text-bold" width={18} height={18} />,
                },
                {
                  value: "question",
                  label: "Pergunta",
                  icon: <Icon icon="solar:question-circle-bold" width={18} height={18} />,
                },
              ]}
            />
          </motion.div>

          {showPackPicker && (
            <motion.button
              variants={staggerItem}
              type="button"
              onClick={() => setIsThemeDialogOpen(true)}
              className="flex w-full max-w-[420px] items-center justify-between rounded-[var(--r-md)] border border-[var(--glass-border)] bg-[var(--glass-1)] px-4 py-3 shadow-[var(--shadow-sm)] transition-[background-color,transform] duration-[var(--t-quick)] hover:bg-[var(--glass-2)] active:scale-[0.99] focus-visible:outline-none focus-visible:shadow-[var(--ring-focus)]"
            >
              <span className="flex min-w-0 items-center gap-3">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={selectedPack?.icon ?? "star"}
                    initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.7 }}
                    transition={reduceMotion ? { duration: 0.12 } : spring.pop}
                    className="flex shrink-0"
                  >
                    <Icon
                      icon={THEME_ICON_MAP[selectedPack?.icon ?? "star"] ?? "solar:star-bold"}
                      width={20}
                      height={20}
                      className="text-[var(--color-special)]"
                    />
                  </motion.span>
                </AnimatePresence>
                <span className="truncate font-body text-base text-[var(--color-text)]">
                  {selectedPack?.title ?? "Clássico"}
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-2">
                <span className="hidden font-condensed text-[11px] uppercase tracking-[0.22em] text-[var(--color-text-muted)] sm:inline">
                  Tema
                </span>
                <motion.span
                  animate={{ rotate: isThemeDialogOpen ? 180 : 0 }}
                  transition={reduceMotion ? { duration: 0 } : { duration: 0.18, ease: "easeOut" }}
                  className="flex"
                >
                  <Icon icon="solar:alt-arrow-down-bold" width={16} height={16} className="text-[var(--color-text-muted)]" />
                </motion.span>
              </span>
            </motion.button>
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
            <motion.div variants={staggerItem} className="flex items-center gap-3">
              <Switch
                aria-label="Dica do Impostor"
                tone="safe"
                checked={room.settings.impostorHint}
                onCheckedChange={onToggleHint}
                disabled={!isHost}
              />
              <span className="font-condensed text-xs uppercase tracking-[0.18em] text-[var(--color-text-muted)] sm:text-sm">
                Dica do Impostor
              </span>
            </motion.div>
          )}

          {room.mode === "question" && (
            <motion.div
              variants={staggerItem}
              className="flex w-full max-w-[420px] flex-col items-center gap-3 rounded-[var(--r-lg)] border border-[var(--glass-border)] bg-[var(--glass-1)] px-4 py-4 shadow-[var(--shadow-sm)]"
            >
              <span className="font-condensed text-xs uppercase tracking-[0.22em] text-[var(--color-text-muted)] sm:text-sm">
                Tipo de Pergunta
              </span>
              <SegmentedControl
                aria-label="Tipo de pergunta"
                tone="info"
                value={questionMode}
                onChange={(v) => onQuestionModeChange(v as QuestionMode)}
                options={[
                  {
                    value: "system",
                    label: "Prontas",
                    icon: <Icon icon="solar:document-text-bold" width={18} height={18} />,
                  },
                  {
                    value: "master",
                    label: "Mestre Cria",
                    icon: <Icon icon="solar:question-circle-bold" width={18} height={18} />,
                  },
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
            </motion.div>
          )}

          {/* Player count + empty-state guidance */}
          <motion.div variants={staggerItem} className="flex w-full max-w-[420px] flex-col items-center gap-2">
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
                  className="flex w-full flex-col items-center gap-2.5 rounded-[var(--r-lg)] border border-dashed border-[var(--glass-border)] bg-[var(--glass-1)] px-4 py-4 text-center"
                >
                  <motion.span
                    initial={false}
                    animate={reduceMotion ? { rotate: 0 } : { rotate: [0, -6, 6, 0] }}
                    transition={reduceMotion ? { duration: 0 } : { duration: 0.6, ease: "easeInOut", delay: 0.2 }}
                    className="flex"
                  >
                    <Icon icon="solar:users-group-rounded-bold" width={26} height={26} className="text-[var(--color-warn)]" />
                  </motion.span>
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
                      <Icon
                        icon={isAddingBot ? "solar:refresh-bold" : "solar:add-circle-bold"}
                        width={18}
                        height={18}
                        className={isAddingBot ? "animate-spin" : ""}
                      />
                      Adicionar Bot
                    </Button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence initial={false}>
              {isHost && !belowMinimum && !roomFull && (
                <motion.button
                  key="add-bot-pill"
                  initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={spring.gentle}
                  type="button"
                  onClick={onAddBot}
                  disabled={isAddingBot}
                  whileTap={reduceMotion ? undefined : { scale: 0.96 }}
                  className="flex items-center gap-1.5 rounded-[var(--r-pill)] border border-[var(--glass-border)] bg-[var(--glass-1)] px-4 py-2 font-display text-xs uppercase tracking-widest text-[var(--color-text)] transition-[background-color,transform] duration-[var(--t-quick)] hover:bg-[var(--glass-2)] focus-visible:outline-none focus-visible:shadow-[var(--ring-focus)] disabled:opacity-50 sm:text-sm"
                >
                  <Icon
                    icon={isAddingBot ? "solar:refresh-bold" : "solar:add-circle-bold"}
                    width={16}
                    height={16}
                    className={isAddingBot ? "animate-spin" : ""}
                  />
                  Adicionar Bot
                </motion.button>
              )}
            </AnimatePresence>

            {startReadinessMessage && (
              <p className="text-center font-body text-xs text-[var(--color-imp)] sm:text-sm">{startReadinessMessage}</p>
            )}
          </motion.div>
        </motion.div>
        </motion.div>
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
          // Signature "arm the game": a gold-led Burst erupts from the button
          // center on launch; a calm ready-pulse breathes while it can fire.
          <div className="relative">
            <Burst
              fire={launchKey}
              colors={["var(--color-gold)", "var(--color-primary-1)", "var(--color-special)"]}
              count={18}
            />
            <motion.div
              animate={
                reduceMotion || startDisabled
                  ? { scale: 1 }
                  : { scale: [1, 1.012, 1] }
              }
              transition={
                reduceMotion || startDisabled
                  ? { duration: 0 }
                  : { duration: 2.4, ease: "easeInOut", repeat: Infinity }
              }
            >
              <Button variant="primary" size="game-lg" onClick={onStart} disabled={startDisabled}>
                {isStartingGame ? (
                  <>
                    <Icon icon="solar:refresh-bold" width={20} height={20} className="animate-spin" />
                    Iniciando...
                  </>
                ) : (
                  <>
                    <Icon icon="solar:play-bold" width={20} height={20} />
                    Iniciar
                  </>
                )}
              </Button>
            </motion.div>
          </div>
        )}
        <Button variant="glass" size="game-lg" onClick={onLeave}>
          <Icon icon="solar:arrow-left-bold" width={20} height={20} />
          Voltar
        </Button>
      </div>
    </div>
  );
}
