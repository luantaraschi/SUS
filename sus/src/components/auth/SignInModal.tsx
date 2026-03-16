import { useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { Icon } from "@iconify/react";
import GameButton from "@/components/game/GameButton";

interface SignInModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function SignInModal({ onClose, onSuccess }: SignInModalProps) {
  const { signIn } = useAuthActions();
  const [step, setStep] = useState<"signIn" | "signUp">("signIn");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogle = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      void signIn("google", { redirectTo: "/" });
    } catch {
      setError("Erro ao autenticar com o Google.");
      setIsSubmitting(false);
    }
  };

  const handlePasswordAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const flow = step === "signIn" ? "signIn" : "signUp";
      await signIn("password", { email, password, flow });
      onSuccess();
    } catch {
      if (step === "signUp") {
        setError("Erro ao criar conta. Talvez o email já esteja em uso?");
      } else {
        setError("Email ou senha inválidos.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col gap-5 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-3xl text-[#1e1b6e]">
            {step === "signIn" ? "Entrar na Conta" : "Criar uma Conta"}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 text-[#1e1b6e]/60 hover:text-[#1e1b6e] transition-colors"
          >
            <Icon icon="solar:close-circle-bold" width={32} height={32} />
          </button>
        </div>

        <p className="text-gray-600 font-body text-sm leading-relaxed">
          Com uma conta, você salva seu histórico de partidas e pode criar seus próprios pacotes de palavras e perguntas!
        </p>

        <div className="flex flex-col gap-4">
          <GameButton
            variant="outline"
            size="lg"
            icon={<Icon icon="flat-color-icons:google" width={24} height={24} />}
            onClick={handleGoogle}
            disabled={isSubmitting}
            className="!bg-white !text-black !border-gray-200"
          >
            Continuar com Google
          </GameButton>

          <div className="flex items-center gap-2">
            <div className="h-px bg-gray-200 flex-1" />
            <span className="text-sm text-gray-400 font-body uppercase">ou com email</span>
            <div className="h-px bg-gray-200 flex-1" />
          </div>

          <form onSubmit={handlePasswordAuth} className="flex flex-col gap-3">
            <input
              type="email"
              required
              placeholder="Seu melhor email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-14 rounded-full border-2 border-gray-200 px-5 font-body text-lg focus:outline-none focus:border-[#1e1b6e] focus:ring-4 focus:ring-[#1e1b6e]/20 transition-all placeholder:text-gray-400"
            />
            <input
              type="password"
              required
              placeholder="Senha secreta"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-14 rounded-full border-2 border-gray-200 px-5 font-body text-lg focus:outline-none focus:border-[#1e1b6e] focus:ring-4 focus:ring-[#1e1b6e]/20 transition-all placeholder:text-gray-400"
            />
            {error && (
              <p className="text-red-500 font-body text-sm text-center font-bold">
                {error}
              </p>
            )}
            <GameButton
              variant="filled"
              size="lg"
              type="submit"
              disabled={isSubmitting || !email || !password}
              className="mt-2"
            >
              {step === "signIn" ? "Entrar" : "Criar Conta"}
            </GameButton>
          </form>

          <div className="text-center mt-2">
            <button
              onClick={() => setStep(step === "signIn" ? "signUp" : "signIn")}
              className="text-[#1e1b6e] font-body text-sm hover:underline font-bold"
            >
              {step === "signIn"
                ? "Ainda não tem conta? Criar conta."
                : "Já tem uma conta? Entrar."}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
