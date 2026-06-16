import { useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/Modal";

interface SignInModalProps {
  onClose: () => void;
  onSuccess: () => void;
  open: boolean;
}

export default function SignInModal({ onClose, onSuccess, open }: SignInModalProps) {
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
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title={step === "signIn" ? "Entrar na Conta" : "Criar uma Conta"}
    >
      <div className="flex flex-col gap-5">
        <p className="text-[var(--color-text-muted)] font-body text-sm leading-relaxed">
          Com uma conta, você salva seu histórico de partidas e pode criar seus próprios pacotes de palavras e perguntas!
        </p>

        <div className="flex flex-col gap-4">
          <Button
            variant="glass"
            size="game-lg"
            onClick={handleGoogle}
            disabled={isSubmitting}
          >
            <Icon icon="flat-color-icons:google" width={24} height={24} />
            Continuar com Google
          </Button>

          <div className="flex items-center gap-2">
            <div className="h-px bg-[var(--glass-border)] flex-1" />
            <span className="text-sm text-[var(--color-text-muted)] font-body uppercase">ou com email</span>
            <div className="h-px bg-[var(--glass-border)] flex-1" />
          </div>

          <form onSubmit={handlePasswordAuth} className="flex flex-col gap-3">
            <input
              type="email"
              required
              placeholder="Seu melhor email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-14 rounded-full border-2 border-[var(--glass-border)] bg-[var(--glass-1)] px-5 font-body text-lg text-[var(--color-text)] focus:outline-none focus:border-[var(--color-info)] focus:shadow-[var(--ring-focus)] placeholder:text-[var(--color-text-muted)]"
            />
            <input
              type="password"
              required
              placeholder="Senha secreta"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-14 rounded-full border-2 border-[var(--glass-border)] bg-[var(--glass-1)] px-5 font-body text-lg text-[var(--color-text)] focus:outline-none focus:border-[var(--color-info)] focus:shadow-[var(--ring-focus)] placeholder:text-[var(--color-text-muted)]"
            />
            {error && (
              <p className="text-[var(--color-imp)] font-body text-sm text-center font-bold">
                {error}
              </p>
            )}
            <Button
              variant="primary"
              size="game-lg"
              type="submit"
              disabled={isSubmitting || !email || !password}
              className="mt-2"
            >
              {step === "signIn" ? "Entrar" : "Criar Conta"}
            </Button>
          </form>

          <div className="text-center mt-2">
            <button
              onClick={() => setStep(step === "signIn" ? "signUp" : "signIn")}
              className="text-[var(--color-info)] font-body text-sm hover:underline font-bold"
            >
              {step === "signIn"
                ? "Ainda não tem conta? Criar conta."
                : "Já tem uma conta? Entrar."}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
