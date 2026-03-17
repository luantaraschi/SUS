"use client";

import { Select } from "@base-ui/react/select";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { glassToneClasses, type GlassTone } from "./glass";

type GlassSelectOption = {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
};

interface GlassSelectProps {
  value: string | null;
  onChange: (value: string) => void;
  options: GlassSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  name?: string;
  className?: string;
  tone?: GlassTone;
  ariaLabel?: string;
}

export default function GlassSelect({
  value,
  onChange,
  options,
  placeholder = "Selecionar",
  disabled = false,
  name,
  className,
  tone = "neutral",
  ariaLabel,
}: GlassSelectProps) {
  return (
    <Select.Root
      name={name}
      value={value}
      disabled={disabled}
      onValueChange={(nextValue) => {
        if (typeof nextValue === "string") {
          onChange(nextValue);
        }
      }}
    >
      <Select.Trigger
        aria-label={ariaLabel}
        className={cn(
          "glass-panel glass-field flex min-h-12 w-full items-center justify-between gap-3 rounded-[20px] px-4 py-3 text-left text-sm text-white shadow-[0_16px_40px_rgba(0,0,0,0.22)] transition-all duration-200 hover:border-white/24 hover:bg-white/12 focus-visible:ring-2 focus-visible:ring-white/25 disabled:cursor-not-allowed disabled:opacity-50 data-[popup-open]:border-white/30 data-[popup-open]:bg-white/14 sm:text-base",
          glassToneClasses(tone),
          className
        )}
      >
        <Select.Value placeholder={placeholder}>
          {(selectedValue: string | null) =>
            options.find((option) => option.value === selectedValue)?.label ?? placeholder
          }
        </Select.Value>
        <Select.Icon className="shrink-0 text-white/58 transition-transform duration-200 data-[popup-open]:rotate-180">
          <ChevronDown size={18} />
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Positioner sideOffset={10} align="start" className="z-[90]">
          <Select.Popup
            className={cn(
              "glass-panel glass-shell overflow-hidden rounded-[24px] border border-white/14 bg-white/[0.12] text-white shadow-[0_30px_80px_rgba(0,0,0,0.42)] backdrop-blur-2xl transition-all duration-200 ease-out data-[starting-style]:scale-95 data-[starting-style]:opacity-0 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 motion-reduce:transition-none",
              glassToneClasses(tone)
            )}
            style={{
              width: "min(24rem, calc(var(--anchor-width) + 4rem))",
              minWidth: "var(--anchor-width)",
            }}
          >
            <Select.List className="custom-scrollbar max-h-72 overflow-y-auto p-2">
              {options.map((option) => (
                <Select.Item
                  key={option.value}
                  value={option.value}
                  label={option.label}
                  disabled={option.disabled}
                  className="flex cursor-pointer items-center justify-between gap-3 rounded-[18px] border border-transparent px-3.5 py-3 text-left outline-none transition-all duration-150 hover:border-white/10 hover:bg-white/8 data-[highlighted]:border-white/14 data-[highlighted]:bg-white/12 data-[selected]:bg-white/14 data-[disabled]:pointer-events-none data-[disabled]:opacity-40"
                >
                  <div className="min-w-0">
                    <Select.ItemText className="block truncate font-body text-sm text-white sm:text-base">
                      {option.label}
                    </Select.ItemText>
                    {option.description && (
                      <span className="mt-0.5 block text-xs text-white/52">
                        {option.description}
                      </span>
                    )}
                  </div>

                  <Select.ItemIndicator className="shrink-0 text-game-safe">
                    <Check size={16} />
                  </Select.ItemIndicator>
                </Select.Item>
              ))}
            </Select.List>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  );
}
