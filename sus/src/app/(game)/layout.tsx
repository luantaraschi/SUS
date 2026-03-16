"use client";

import ConvexStatusBanner from "@/components/game/ConvexStatusBanner";
import ShaderBackground from "@/components/game/ShaderBackground";
import Footer from "@/components/game/Footer";
import { useBackground } from "@/lib/BackgroundContext";
import { usePathname } from "next/navigation";

function GameLayoutInner({ children }: { children: React.ReactNode }) {
  const { variant, themeId, backgroundAnimationEnabled } = useBackground();
  const pathname = usePathname();
  const usesFixedShell = pathname === "/" || /^\/room\/[^/]+$/.test(pathname);

  return (
    <div className="relative flex flex-col min-h-dvh">
      <ShaderBackground
        variant={variant}
        themeId={themeId}
        animated={backgroundAnimationEnabled}
      />
      <ConvexStatusBanner />
      <main
        className={`relative z-10 flex w-full flex-1 flex-col items-center justify-start px-3 py-3 sm:px-4 sm:py-4 ${
          usesFixedShell ? "overflow-hidden pb-[88px]" : ""
        }`}
      >
        {children}
      </main>
      <Footer fixed={usesFixedShell} />
    </div>
  );
}

export default function GameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <GameLayoutInner>{children}</GameLayoutInner>;
}
