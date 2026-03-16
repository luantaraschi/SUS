"use client";

import { useSyncExternalStore } from "react";
import { ShaderGradientCanvas, ShaderGradient } from "@shadergradient/react";

type BackgroundVariant = "default" | "valid" | "invalid";

interface ShaderBackgroundProps {
  variant?: BackgroundVariant;
  themeId?: string;
  animated?: boolean;
}

const gradientConfigs: Record<
  BackgroundVariant,
  { color1: string; color2: string; color3: string; fallback: string }
> = {
  default: {
    color1: "#D64DC2",
    color2: "#902EED",
    color3: "#FAFA39",
    fallback: "radial-gradient(circle at 30% 20%, #ff8bd4 0%, #d64dc2 35%, #4d16ba 70%, #16003f 100%)",
  },
  valid: {
    color1: "#4DDBA8",
    color2: "#602BFF",
    color3: "#00B8EB",
    fallback: "radial-gradient(circle at 30% 20%, #7cf0c7 0%, #4ddba8 30%, #00b8eb 65%, #2a1078 100%)",
  },
  invalid: {
    color1: "#FF577B",
    color2: "#8100B0",
    color3: "#D12977",
    fallback: "radial-gradient(circle at 30% 20%, #ff7f9a 0%, #ff577b 30%, #d12977 65%, #41004f 100%)",
  },
};

function StaticBackground({ background }: { background: string }) {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-[-1]"
      style={{
        background,
      }}
      aria-hidden="true"
    />
  );
}

export default function ShaderBackground({
  variant = "default",
  themeId = "classico",
  animated = true,
}: ShaderBackgroundProps) {
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false
  );

  if (!mounted) return null;

  const colors = gradientConfigs[variant];
  if (!animated || themeId !== "classico") {
    return <StaticBackground background={colors.fallback} />;
  }

  return (
    <ShaderGradientCanvas
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: -1,
        pointerEvents: "none",
      }}
      pixelDensity={1.5}
      fov={45}
    >
      <ShaderGradient
        animate="on"
        type="sphere"
        shader="defaults"
        color1={colors.color1}
        color2={colors.color2}
        color3={colors.color3}
        uSpeed={0.3}
        uStrength={1.2}
        uDensity={0.9}
        uFrequency={5.5}
        uAmplitude={7}
        uTime={0}
        cAzimuthAngle={98}
        cPolarAngle={41}
        cDistance={1.5}
        cameraZoom={17.2}
        positionX={0}
        positionY={0}
        positionZ={0}
        rotationX={0}
        rotationY={0}
        rotationZ={140}
        brightness={1.4}
        envPreset="city"
        lightType="3d"
        grain="on"
        reflection={0.5}
        wireframe={false}
        range="disabled"
        rangeStart={0}
        rangeEnd={40}
      />
    </ShaderGradientCanvas>
  );
}
