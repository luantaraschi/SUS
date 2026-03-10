"use client";

import { useState, useEffect } from "react";
import { ShaderGradientCanvas, ShaderGradient } from "@shadergradient/react";

type BackgroundVariant = "default" | "valid" | "invalid";

interface ShaderBackgroundProps {
  variant?: BackgroundVariant;
}

const gradientConfigs: Record<
  BackgroundVariant,
  { color1: string; color2: string; color3: string }
> = {
  default: {
    color1: "#D64DC2", // Magenta
    color2: "#902EED", // Roxo profundo
    color3: "#FAFA39", // Amarelo brilhante
  },
  valid: {
    color1: "#4DDBA8", // Verde
    color2: "#602BFF", // Roxo
    color3: "#00B8EB", // Ciano
  },
  invalid: {
    color1: "#FF577B", // Rosa/vermelho
    color2: "#8100B0", // Roxo escuro
    color3: "#D12977", // Magenta escuro
  },
};

export default function ShaderBackground({
  variant = "default",
}: ShaderBackgroundProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const colors = gradientConfigs[variant];

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
