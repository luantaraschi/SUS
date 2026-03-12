"use client";

import ShaderBackground from "@/components/game/ShaderBackground";
import Footer from "@/components/game/Footer";
import { BackgroundProvider, useBackground } from "@/lib/BackgroundContext";

function GameLayoutInner({ children }: { children: React.ReactNode }) {
  const { variant } = useBackground();

  return (
    <div className="relative flex flex-col min-h-dvh">
      <ShaderBackground variant={variant} />
      <main className="relative z-10 flex flex-1 w-full flex-col items-center justify-center px-3 py-4 pb-16 sm:pb-24">
        {children}
      </main>
      <Footer />
    </div>
  );
}

export default function GameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <BackgroundProvider>
      <GameLayoutInner>{children}</GameLayoutInner>
    </BackgroundProvider>
  );
}
