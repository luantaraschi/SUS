"use client";

import { useEffect, useState } from "react";
import { useConvex, useConvexConnectionState } from "convex/react";
import { api } from "../../../convex/_generated/api";

const FRONTEND_VERSION = "2026.03.16-recovery.1";
const FRONTEND_SCHEMA_VERSION = 2;

export default function ConvexStatusBanner() {
  const convex = useConvex();
  const connectionState = useConvexConnectionState();
  const [compatibilityStatus, setCompatibilityStatus] = useState<
    "idle" | "checking" | "ok" | "mismatch" | "server"
  >("idle");

  useEffect(() => {
    if (!connectionState.isWebSocketConnected) {
      return;
    }

    let cancelled = false;

    const probeCompatibility = async () => {
      setCompatibilityStatus("checking");

      try {
        const result = await convex.query(api.meta.getCompatibility, {
          frontendVersion: FRONTEND_VERSION,
          schemaVersion: FRONTEND_SCHEMA_VERSION,
        });

        if (!cancelled) {
          setCompatibilityStatus(result.compatible ? "ok" : "mismatch");
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        const message = error instanceof Error ? error.message : "";
        if (message.includes("Could not find public function")) {
          setCompatibilityStatus("mismatch");
          return;
        }

        setCompatibilityStatus("server");
      }
    };

    void probeCompatibility();

    return () => {
      cancelled = true;
    };
  }, [connectionState.isWebSocketConnected, convex]);

  const transportIssue =
    !connectionState.isWebSocketConnected &&
    (connectionState.connectionRetries > 1 ||
      (!connectionState.hasEverConnected && connectionState.hasInflightRequests));

  if (!transportIssue && compatibilityStatus !== "mismatch" && compatibilityStatus !== "server") {
    return null;
  }

  return (
    <div className="pointer-events-none absolute left-1/2 top-4 z-40 w-[min(92vw,720px)] -translate-x-1/2 rounded-2xl border border-red-300/60 bg-red-500/90 px-4 py-3 text-center text-sm text-white shadow-[0_10px_30px_rgba(0,0,0,0.25)] backdrop-blur-sm">
      {transportIssue ? (
        <>
          Conexao com o backend indisponivel. Verifique o deployment ativo do Convex e a variavel{" "}
          <code className="font-mono text-[0.9em]">NEXT_PUBLIC_CONVEX_URL</code>.
        </>
      ) : compatibilityStatus === "mismatch" ? (
        "Frontend e backend estao em versoes diferentes. Publique primeiro o Convex e depois a Vercel."
      ) : (
        "O backend respondeu com erro inesperado. Verifique as funcoes publicadas e os logs do Convex."
      )}
    </div>
  );
}
