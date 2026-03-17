"use client";

import type { RefObject } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { Icon } from "@iconify/react";
import { THEME_ICON_MAP } from "@/lib/themeIcons";
import { cn } from "@/lib/utils";

type ThemePackOption = {
  key: string;
  title: string;
  icon: string;
  source: "default" | "custom";
  count: number;
};

type ThemePickerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedPackValue: string;
  packOptions: ThemePackOption[];
  isHost: boolean;
  onSelectPack: (value: string) => void;
  triggerRef?: RefObject<HTMLElement | null>;
};

export default function ThemePickerDialog({
  open,
  onOpenChange,
  selectedPackValue,
  packOptions,
  isHost,
  onSelectPack,
  triggerRef,
}: ThemePickerDialogProps) {
  const systemPackOptions = packOptions.filter((pack) => pack.source === "default");
  const customPackOptions = packOptions.filter((pack) => pack.source === "custom");

  const renderPackCard = (pack: ThemePackOption) => {
    const value =
      pack.source === "default" ? `default:${pack.key}` : `custom:${pack.key}`;
    const isSelected = selectedPackValue === value;

    return (
      <button
        key={value}
        type="button"
        disabled={!isHost}
        aria-pressed={isSelected}
        onClick={() => {
          if (!isHost) return;
          onSelectPack(value);
        }}
        className={cn(
          "flex min-h-28 flex-col items-start justify-between rounded-[24px] border px-4 py-4 text-left transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-game-info/60 disabled:cursor-default disabled:opacity-65",
          isSelected
            ? "border-surface-primary bg-surface-primary text-white shadow-[0_18px_38px_rgba(32,2,104,0.24)]"
            : "border-[var(--control-border)] bg-[var(--control-surface)] text-[var(--control-text)] shadow-[0_12px_28px_rgba(32,2,104,0.12)]",
          isHost && !isSelected && "hover:-translate-y-0.5 hover:border-surface-primary/60 hover:bg-[var(--panel-muted)]"
        )}
      >
        <div className="flex w-full items-start justify-between gap-3">
          <span
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-2xl border",
              isSelected
                ? "border-white/20 bg-white/10"
                : "border-[var(--control-border)] bg-[var(--panel-muted)]"
            )}
          >
            <Icon
              icon={THEME_ICON_MAP[pack.icon] ?? "solar:star-bold"}
              width={20}
              height={20}
            />
          </span>

          <span
            className={cn(
              "rounded-full px-2.5 py-1 font-condensed text-[11px] uppercase tracking-[0.22em]",
              isSelected ? "bg-white/12 text-white/80" : "bg-[var(--panel-muted)] text-[var(--panel-soft-text)]"
            )}
          >
            {pack.count}
          </span>
        </div>

        <div className="mt-4 flex w-full items-end justify-between gap-3">
          <span className="font-body text-base leading-tight">{pack.title}</span>
          <span
            className={cn(
              "font-condensed text-[11px] uppercase tracking-[0.2em]",
              isSelected ? "text-white/72" : "text-[var(--panel-soft-text)]"
            )}
          >
            {pack.source === "default" ? "Oficial" : "Meu pack"}
          </span>
        </div>
      </button>
    );
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md transition-opacity duration-200 data-[starting-style]:opacity-0 data-[ending-style]:opacity-0 motion-reduce:transition-none" />
        <Dialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4">
          <Dialog.Popup
            finalFocus={triggerRef ?? true}
            className="w-full max-w-5xl rounded-[32px] border border-[var(--panel-border)] bg-[var(--panel-surface)] p-5 text-[var(--panel-text)] shadow-[0_28px_80px_rgba(0,0,0,0.32)] transition-all duration-200 ease-out data-[starting-style]:scale-95 data-[starting-style]:opacity-0 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 motion-reduce:transition-none motion-reduce:data-[starting-style]:scale-100 motion-reduce:data-[ending-style]:scale-100 sm:p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <Dialog.Title className="font-display text-3xl text-[var(--panel-text)] sm:text-4xl">
                  Escolha um Tema
                </Dialog.Title>
                <p className="mt-1 font-body text-sm text-[var(--panel-soft-text)] sm:text-base">
                  Selecione um tema oficial ou um pack customizado para a próxima rodada.
                </p>
              </div>

              <Dialog.Close
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--panel-muted)] text-[var(--panel-soft-text)] transition-colors hover:bg-[var(--control-surface-muted)] hover:text-[var(--panel-text)]"
                aria-label="Fechar seletor de temas"
              >
                <Icon icon="solar:close-circle-bold" width={28} height={28} />
              </Dialog.Close>
            </div>

            <div className="custom-scrollbar mt-6 max-h-[70vh] overflow-y-auto pr-1">
              <section className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-condensed text-[11px] uppercase tracking-[0.26em] text-[var(--panel-soft-text)] sm:text-xs">
                    Temas oficiais
                  </span>
                  <span className="font-body text-sm text-[var(--panel-soft-text)]">
                    {systemPackOptions.length} opções
                  </span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {systemPackOptions.map(renderPackCard)}
                </div>
              </section>

              {customPackOptions.length > 0 && (
                <section className="mt-6 flex flex-col gap-3 border-t border-[var(--control-border)] pt-6">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-condensed text-[11px] uppercase tracking-[0.26em] text-[var(--panel-soft-text)] sm:text-xs">
                      Meus packs
                    </span>
                    <span className="font-body text-sm text-[var(--panel-soft-text)]">
                      {customPackOptions.length} opções
                    </span>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {customPackOptions.map(renderPackCard)}
                  </div>
                </section>
              )}
            </div>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
