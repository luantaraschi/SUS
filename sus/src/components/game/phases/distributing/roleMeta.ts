import { Crown, Shield, ShieldAlert } from "lucide-react";
import type { Doc } from "../../../../../convex/_generated/dataModel";
import type { GlassTone } from "../../ui/glass";
import type { RoleView } from "@/lib/game-view-types";

/**
 * Role "temperature" — drives the dossier seal theming (color, finial, throb).
 * - impostor: hot, off-axis, heartbeat throb on the seal.
 * - player:   calm, square, safe-green.
 * - master:   ceremonial, special + gold accents (crown finial, double-rule).
 */
export type RoleTemperature = "impostor" | "player" | "master";

export type RoleMeta = {
  tone: GlassTone;
  title: string;
  subtitle: string;
  accentLabel: string;
  /** Short inline guidance shown next to the revealed role. */
  guide: string;
  icon: typeof Shield;
  /** Role temperature for seal theming. */
  temperature: RoleTemperature;
  /** Tiny centered eyebrow above the hero title. */
  eyebrow: string;
  /** One quiet inline "briefing" guidance line under the hero. */
  briefing: string;
  /** Primary themed CSS color token (e.g. "var(--color-imp)"). */
  accentVar: string;
};

/**
 * Per-role copy + visual tone for the reveal card. Adapts to word vs question
 * mode so the impostor / player / master each get a short, on-point guide.
 */
export function getRoleMeta(
  role: NonNullable<RoleView>["role"] | undefined,
  mode: Doc<"rooms">["mode"]
): RoleMeta {
  if (role === "impostor") {
    return {
      tone: "impostor",
      title: mode === "word" ? "VOCE E O SUS" : "VOCE E O IMPOSTOR",
      subtitle:
        mode === "word"
          ? "Observe o grupo, improvise e proteja seu blefe."
          : "Leia o ambiente, responda com calma e nao se entregue.",
      accentLabel: "Papel secreto",
      guide:
        mode === "word"
          ? "Voce nao recebeu a palavra. Blefe e descubra."
          : "Responda como se soubesse. Blefe e descubra.",
      icon: ShieldAlert,
      temperature: "impostor",
      eyebrow: "Dossie lacrado",
      briefing:
        mode === "word"
          ? "Mantenha a calma. Ninguem pode saber que e voce."
          : "Aja com naturalidade. A mesa esta te observando.",
      accentVar: "var(--color-imp)",
    };
  }

  if (role === "master") {
    return {
      tone: "special",
      title: "VOCE E O MESTRE DA RODADA",
      subtitle:
        "Voce nao joga. Sua funcao e desenhar a rodada e observar a mesa.",
      accentLabel: "Controle da rodada",
      guide: "Voce observa e julga; nao joga esta rodada.",
      icon: Crown,
      temperature: "master",
      eyebrow: "Credencial cerimonial",
      briefing: "Conduza a rodada e leia cada reacao da mesa.",
      accentVar: "var(--color-special)",
    };
  }

  return {
    tone: "safe",
    title: "VOCE E UM JOGADOR",
    subtitle:
      mode === "word"
        ? "Guarde a palavra, pense em pistas inteligentes e nao entregue demais."
        : "Leia a pergunta, responda com personalidade e compare as reacoes depois.",
    accentLabel: "Informacao privada",
    guide: "De pistas que provem que voce sabe, sem entregar.",
    icon: Shield,
    temperature: "player",
    eyebrow: "Credencial verificada",
    briefing:
      mode === "word"
        ? "Prove que voce sabe a palavra sem dize-la."
        : "Responda com personalidade e compare as reacoes depois.",
    accentVar: "var(--color-safe)",
  };
}
