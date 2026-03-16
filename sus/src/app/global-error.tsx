"use client";

import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="pt-BR">
      <body className="min-h-dvh bg-[#180a4a] text-white">
        <main className="flex min-h-dvh items-center justify-center px-4 py-10">
          <div className="w-full max-w-2xl rounded-[32px] border border-white/15 bg-white/10 p-6 text-center shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-md sm:p-8">
            <p className="font-condensed text-sm uppercase tracking-[0.28em] text-white/70">
              Falha de carregamento
            </p>
            <h1 className="mt-3 font-display text-4xl sm:text-5xl">O app encontrou um erro</h1>
            <p className="mx-auto mt-4 max-w-xl font-body text-base text-white/80 sm:text-lg">
              A interface foi protegida para nao cair completamente quando o frontend e o backend
              estiverem fora de sincronizacao. Tente recarregar depois do deploy do Convex.
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={reset}
                className="rounded-full bg-white px-6 py-3 font-display text-lg text-[#180a4a] transition-transform hover:scale-[1.02]"
              >
                Tentar novamente
              </button>
              <Link
                href="/"
                className="rounded-full border border-white/20 px-6 py-3 font-display text-lg text-white transition-colors hover:bg-white/10"
              >
                Voltar para a home
              </Link>
            </div>
            <p className="mt-5 break-words font-mono text-xs text-white/50">
              {error.message || "Erro desconhecido"}
            </p>
          </div>
        </main>
      </body>
    </html>
  );
}
