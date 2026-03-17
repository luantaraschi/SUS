import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type LabelHTMLAttributes,
} from "react";
import { cn } from "@/lib/utils";

export type GlassTone = "neutral" | "safe" | "impostor" | "special" | "info";

const TONE_CLASS_MAP: Record<GlassTone, string> = {
  neutral: "glass-tone-neutral",
  safe: "glass-tone-safe",
  impostor: "glass-tone-impostor",
  special: "glass-tone-special",
  info: "glass-tone-info",
};

type GlassDivProps = ComponentPropsWithoutRef<"div"> & {
  tone?: GlassTone;
};

export function glassToneClasses(tone: GlassTone = "neutral") {
  return TONE_CLASS_MAP[tone];
}

export function GlassPanel({
  tone = "neutral",
  className,
  ...props
}: GlassDivProps) {
  return (
    <div
      className={cn("glass-panel glass-shell", glassToneClasses(tone), className)}
      {...props}
    />
  );
}

export function GlassSection({
  className,
  ...props
}: ComponentPropsWithoutRef<"div">) {
  return <div className={cn("glass-section", className)} {...props} />;
}

export function GlassField({
  className,
  ...props
}: ComponentPropsWithoutRef<"div">) {
  return <div className={cn("glass-field", className)} {...props} />;
}

export function GlassLabel({
  className,
  ...props
}: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        "font-condensed text-[11px] uppercase tracking-[0.24em] text-white/58 sm:text-xs",
        className
      )}
      {...props}
    />
  );
}

export const GlassInput = forwardRef<
  HTMLInputElement,
  ComponentPropsWithoutRef<"input">
>(function GlassInput({ className, ...props }, ref) {
  return <input ref={ref} className={cn("glass-input", className)} {...props} />;
});

export const GlassTextarea = forwardRef<
  HTMLTextAreaElement,
  ComponentPropsWithoutRef<"textarea">
>(function GlassTextarea({ className, ...props }, ref) {
  return (
    <textarea ref={ref} className={cn("glass-textarea", className)} {...props} />
  );
});

