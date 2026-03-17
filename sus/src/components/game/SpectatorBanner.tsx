"use client";

export function SpectatorBanner() {
  return (
    <div className="fixed left-0 right-0 top-0 z-40 bg-game-warning/90 px-4 py-2 text-center backdrop-blur-sm">
      <p className="font-condensed text-sm font-bold uppercase tracking-wider text-black">
        Voce esta como espectador — sera incluido na proxima rodada
      </p>
    </div>
  );
}
