import { Crown, Shield, ShieldAlert } from "lucide-react";
import type { Doc } from "../../../../../convex/_generated/dataModel";
import type { GlassTone } from "../../ui/glass";
import type { RoleView } from "@/lib/game-view-types";

export type RoleMeta = {
  tone: GlassTone;
  title: string;
  subtitle: string;
  accentLabel: string;
  /** Short inline guidance shown next to the revealed role. */
  guide: string;
  icon: typeof Shield;
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
  };
}
