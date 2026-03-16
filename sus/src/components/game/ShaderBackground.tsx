"use client";

import { useEffect, useState } from "react";

type BackgroundVariant = "default" | "valid" | "invalid";

interface ShaderBackgroundProps {
  variant?: BackgroundVariant;
  themeId?: string;
  animated?: boolean;
}

const VARIANT_STYLES: Record<
  BackgroundVariant,
  { overlayA: string; overlayB: string; overlayC: string; fallback: string }
> = {
  default: {
    overlayA: "radial-gradient(circle at 20% 24%, rgba(250,250,57,0.32), transparent 42%)",
    overlayB: "radial-gradient(circle at 82% 18%, rgba(255,137,64,0.28), transparent 34%)",
    overlayC: "radial-gradient(circle at 76% 78%, rgba(214,77,194,0.22), transparent 32%)",
    fallback:
      "radial-gradient(circle at 24% 22%, #ff9adf 0%, #d64dc2 26%, #5b1ad0 62%, #18004c 100%)",
  },
  valid: {
    overlayA: "radial-gradient(circle at 18% 26%, rgba(77,219,168,0.28), transparent 38%)",
    overlayB: "radial-gradient(circle at 82% 18%, rgba(0,184,235,0.22), transparent 34%)",
    overlayC: "radial-gradient(circle at 72% 76%, rgba(96,43,255,0.24), transparent 32%)",
    fallback:
      "radial-gradient(circle at 24% 22%, #90ffd8 0%, #4ddba8 26%, #00b8eb 60%, #1d115a 100%)",
  },
  invalid: {
    overlayA: "radial-gradient(circle at 20% 26%, rgba(255,87,123,0.32), transparent 40%)",
    overlayB: "radial-gradient(circle at 84% 18%, rgba(209,41,119,0.26), transparent 34%)",
    overlayC: "radial-gradient(circle at 74% 78%, rgba(129,0,176,0.24), transparent 32%)",
    fallback:
      "radial-gradient(circle at 24% 22%, #ff8ea7 0%, #ff577b 28%, #c11d8b 62%, #30063d 100%)",
  },
};

export default function ShaderBackground({
  variant = "default",
  themeId = "classico",
  animated = true,
}: ShaderBackgroundProps) {
  const [canAnimate, setCanAnimate] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const widthQuery = window.matchMedia("(min-width: 1024px)");
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const sync = () => {
      setCanAnimate(animated && themeId === "classico" && widthQuery.matches && !motionQuery.matches);
    };

    sync();
    widthQuery.addEventListener("change", sync);
    motionQuery.addEventListener("change", sync);
    return () => {
      widthQuery.removeEventListener("change", sync);
      motionQuery.removeEventListener("change", sync);
    };
  }, [animated, themeId]);

  const colors = VARIANT_STYLES[variant];

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[-1] overflow-hidden"
      aria-hidden="true"
      style={{ background: colors.fallback }}
    >
      <div
        className="absolute inset-0 opacity-90"
        style={{
          background: `var(--bg-base), ${colors.overlayA}, ${colors.overlayB}, ${colors.overlayC}`,
        }}
      />
      <div
        className={`absolute -left-[12%] top-[-14%] h-[48vh] w-[42vw] rounded-full blur-3xl ${
          canAnimate ? "animate-[background-float-a_18s_ease-in-out_infinite]" : ""
        }`}
        style={{ background: "var(--bg-blob-1)" }}
      />
      <div
        className={`absolute right-[-8%] top-[8%] h-[42vh] w-[34vw] rounded-full blur-3xl ${
          canAnimate ? "animate-[background-float-b_20s_ease-in-out_infinite]" : ""
        }`}
        style={{ background: "var(--bg-blob-2)" }}
      />
      <div
        className={`absolute bottom-[-10%] left-[18%] h-[40vh] w-[44vw] rounded-full blur-3xl ${
          canAnimate ? "animate-[background-float-a_24s_ease-in-out_infinite]" : ""
        }`}
        style={{ background: "var(--bg-blob-3)" }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(10,5,25,0.08)_100%)]" />
    </div>
  );
}
