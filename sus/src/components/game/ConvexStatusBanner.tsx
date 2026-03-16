"use client";

import { useConvexConnectionState } from "convex/react";

export default function ConvexStatusBanner() {
  const connectionState = useConvexConnectionState();

  const shouldShow =
    !connectionState.isWebSocketConnected &&
    (connectionState.connectionRetries > 1 ||
      (!connectionState.hasEverConnected && connectionState.hasInflightRequests));

  if (!shouldShow) {
    return null;
  }

  return (
    <div className="pointer-events-none absolute left-1/2 top-4 z-40 w-[min(92vw,720px)] -translate-x-1/2 rounded-2xl border border-red-300/60 bg-red-500/90 px-4 py-3 text-center text-sm text-white shadow-[0_10px_30px_rgba(0,0,0,0.25)] backdrop-blur-sm">
      Conexao com o backend indisponivel. Verifique o deployment ativo do Convex e a variavel <code className="font-mono text-[0.9em]">NEXT_PUBLIC_CONVEX_URL</code>.
    </div>
  );
}
