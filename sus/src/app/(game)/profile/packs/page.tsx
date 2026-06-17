"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { BubbleText } from "@/components/ui/bubble-text";
import { Button } from "@/components/ui/button";
import { Burst } from "@/components/ui/Burst";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { staggerContainer, staggerItem, spring } from "@/lib/motion";

export default function PacksPage() {
  const router = useRouter();
  const reduceMotion = useReducedMotion() ?? false;
  const user = useQuery(api.users.current);
  const myPacks = useQuery(api.packs.getMyPacks, user ? {} : "skip");
  const createPack = useMutation(api.packs.createPack);
  const deletePack = useMutation(api.packs.deletePack);

  const [isCreating, setIsCreating] = useState(false);
  const [packTitle, setPackTitle] = useState("");
  const [packMode, setPackMode] = useState<"word" | "question">("word");
  const [items, setItems] = useState<{ content: string; hint: string }[]>([
    { content: "", hint: "" },
  ]);
  const [errorMsg, setErrorMsg] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  // Which pack card has its items expanded (the read affordance).
  const [expandedPackId, setExpandedPackId] = useState<string | null>(null);
  // Pending delete confirmation (inline, no native confirm()).
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  // Signature: a confetti burst on a freshly created pack.
  const [createBurst, setCreateBurst] = useState(0);

  const t = reduceMotion ? { duration: 0 } : spring.gentle;

  if (user === undefined || myPacks === undefined) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <p className="font-display text-2xl text-[var(--color-text)] animate-pulse">Carregando...</p>
      </div>
    );
  }

  if (user === null) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
        <Icon icon="solar:lock-keyhole-bold" width={48} height={48} className="text-[var(--color-text-muted)] opacity-60" />
        <p className="font-display text-xl text-[var(--color-text)]">
          Voce precisa estar logado para criar pacotes.
        </p>
        <motion.button
          onClick={() => router.push("/profile")}
          whileHover={reduceMotion ? undefined : { y: -2, scale: 1.02 }}
          whileTap={reduceMotion ? undefined : { scale: 0.96 }}
          transition={spring.press}
          className="flex h-11 items-center gap-2 rounded-[var(--r-pill)] border border-[var(--glass-border)] bg-[var(--glass-1)] px-6 font-display text-sm uppercase tracking-widest text-[var(--color-text)] backdrop-blur-[var(--blur-md)] transition-[background-color] duration-[var(--t-quick)] hover:bg-[var(--glass-2)] focus-visible:outline-none focus-visible:shadow-[var(--ring-focus)]"
        >
          <Icon icon="solar:arrow-left-bold" width={16} height={16} />
          Voltar ao Perfil
        </motion.button>
      </div>
    );
  }

  const handleAddItem = () => {
    setItems([...items, { content: "", hint: "" }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, itemIndex) => itemIndex !== index));
  };

  const handleItemChange = (
    index: number,
    field: "content" | "hint",
    value: string
  ) => {
    const nextItems = [...items];
    nextItems[index][field] = value;
    setItems(nextItems);
  };

  const resetForm = () => {
    setPackTitle("");
    setPackMode("word");
    setItems([{ content: "", hint: "" }]);
    setErrorMsg("");
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSaving) return;

    if (!packTitle.trim()) {
      setErrorMsg("De um titulo ao pacote.");
      return;
    }

    const validItems = items.filter((item) => item.content.trim() !== "");
    if (validItems.length === 0) {
      setErrorMsg("Adicione pelo menos um item valido.");
      return;
    }

    setIsSaving(true);
    try {
      await createPack({
        title: packTitle,
        mode: packMode,
        items: validItems,
      });
      setIsCreating(false);
      resetForm();
      setCreateBurst((n) => n + 1);
    } catch (error: unknown) {
      setErrorMsg(error instanceof Error ? error.message : "Erro ao criar pacote");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (packId: Id<"customPacks">) => {
    await deletePack({ packId });
    setPendingDeleteId(null);
    setExpandedPackId((cur) => (cur === packId ? null : cur));
  };

  const validItemCount = items.filter((item) => item.content.trim() !== "").length;

  return (
    <div className="flex min-h-dvh w-full flex-col items-center gap-6 px-4 py-8 pb-20">
      {/* Top bar */}
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="flex w-full max-w-2xl items-center justify-between gap-3"
      >
        <motion.button
          variants={staggerItem}
          transition={reduceMotion ? { duration: 0 } : spring.press}
          whileHover={reduceMotion ? undefined : { scale: 1.05, x: -2 }}
          whileTap={reduceMotion ? undefined : { scale: 0.95 }}
          onClick={() => router.push("/profile")}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--r-pill)] border border-[var(--glass-border)] bg-[var(--glass-1)] text-[var(--color-text)] shadow-[var(--shadow-sm)] backdrop-blur-[var(--blur-md)] transition-[background-color] duration-[var(--t-quick)] hover:bg-[var(--glass-2)] focus-visible:outline-none focus-visible:shadow-[var(--ring-focus)]"
          aria-label="Voltar ao perfil"
        >
          <Icon icon="solar:arrow-left-bold" width={22} height={22} />
        </motion.button>
        <motion.div variants={staggerItem} transition={t}>
          <BubbleText text="Meus Pacotes" className="font-display text-3xl tracking-wide sm:text-4xl [text-shadow:0_3px_0_rgba(0,0,0,0.18),0_0_24px_rgba(214,77,194,0.4)]" />
        </motion.div>
        <span
          className="hidden h-11 items-center gap-2 rounded-[var(--r-pill)] border border-[var(--glass-border)] bg-[var(--glass-2)] px-4 font-condensed text-[10px] uppercase tracking-[0.24em] text-[var(--color-text-muted)] sm:inline-flex"
        >
          <Icon icon="solar:folder-with-files-bold" width={15} height={15} className="text-[var(--color-special)]" />
          <span className="tnum">{myPacks.length}</span>
        </span>
      </motion.div>

      <AnimatePresence mode="wait">
        {!isCreating ? (
          <motion.div
            key="list"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
            transition={t}
            className="flex w-full max-w-2xl flex-col gap-4"
          >
            {/* New pack CTA — success burst fires here. */}
            <div className="relative">
              <Burst fire={createBurst} colors={["var(--color-gold)", "var(--color-special)"]} count={14} />
              <motion.div
                whileHover={reduceMotion ? undefined : { y: -2 }}
                whileTap={reduceMotion ? undefined : { scale: 0.97 }}
                transition={spring.press}
              >
                <Button
                  variant="primary"
                  size="game-lg"
                  onClick={() => setIsCreating(true)}
                  className="hover:brightness-110"
                >
                  <Icon icon="solar:add-circle-bold" width={24} height={24} />
                  Novo Pacote
                </Button>
              </motion.div>
            </div>

            {myPacks.length === 0 ? (
              /* Empty state */
              <motion.div
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={t}
                className="mt-2 flex flex-col items-center gap-4 rounded-[var(--r-2xl)] border border-dashed border-[var(--w-28)] bg-[var(--glass-1)] px-6 py-12 text-center backdrop-blur-[var(--blur-md)]"
              >
                <motion.span
                  animate={reduceMotion ? undefined : { y: [0, -6, 0], rotate: [0, -4, 4, 0] }}
                  transition={reduceMotion ? undefined : { duration: 4, ease: "easeInOut", repeat: Infinity }}
                >
                  <Icon icon="solar:folder-open-bold" width={52} height={52} className="text-[var(--color-special)] opacity-70" />
                </motion.span>
                <div className="flex flex-col gap-1.5">
                  <p className="font-display text-lg text-[var(--color-text)]">Crie seu primeiro pack</p>
                  <p className="max-w-xs font-body text-sm text-[var(--color-text-muted)]">
                    Monte suas proprias palavras ou perguntas para usar nas salas.
                  </p>
                </div>
                <motion.button
                  onClick={() => setIsCreating(true)}
                  whileHover={reduceMotion ? undefined : { y: -2, scale: 1.02 }}
                  whileTap={reduceMotion ? undefined : { scale: 0.96 }}
                  transition={spring.press}
                  className="mt-1 flex h-11 items-center gap-2 rounded-[var(--r-pill)] border border-[var(--glass-border)] bg-[var(--glass-2)] px-6 font-display text-sm uppercase tracking-widest text-[var(--color-text)] transition-[background-color] duration-[var(--t-quick)] hover:bg-[var(--w-20)] focus-visible:outline-none focus-visible:shadow-[var(--ring-focus)]"
                >
                  <Icon icon="solar:add-circle-bold" width={16} height={16} />
                  Criar Pacote
                </motion.button>
              </motion.div>
            ) : (
              <motion.div
                variants={staggerContainer}
                initial="initial"
                animate="animate"
                className="mt-2 flex flex-col gap-3"
              >
                {myPacks.map((pack) => {
                  const isExpanded = expandedPackId === pack._id;
                  const isPendingDelete = pendingDeleteId === pack._id;
                  const isWord = pack.mode === "word";
                  const accent = isWord ? "var(--color-info)" : "var(--color-special)";
                  return (
                    <motion.div
                      key={pack._id}
                      variants={staggerItem}
                      transition={t}
                      whileHover={reduceMotion ? undefined : { y: -3 }}
                      className="overflow-hidden rounded-[var(--r-xl)] border border-[var(--glass-border)] bg-[var(--glass-1)] shadow-[var(--shadow-md)] backdrop-blur-[var(--blur-md)] transition-[background-color] duration-[var(--t-quick)] hover:bg-[var(--glass-2)]"
                    >
                      <div className="flex items-center gap-3 p-4">
                        <span
                          aria-hidden
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--r-lg)] border border-[var(--glass-border)]"
                          style={{
                            backgroundColor: `color-mix(in srgb, ${accent} 18%, var(--glass-2))`,
                            color: accent,
                            boxShadow: "inset 0 1px 0 rgba(255,255,255,.18)",
                          }}
                        >
                          <Icon
                            icon={isWord ? "solar:text-square-bold" : "solar:question-circle-bold"}
                            width={22}
                            height={22}
                          />
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            setExpandedPackId((cur) => (cur === pack._id ? null : pack._id))
                          }
                          aria-expanded={isExpanded}
                          className="flex min-w-0 flex-1 flex-col items-start text-left outline-none focus-visible:rounded-[var(--r-sm)] focus-visible:shadow-[var(--ring-focus)]"
                        >
                          <h3 className="truncate font-display text-xl text-[var(--color-text)]">{pack.title}</h3>
                          <p className="font-condensed text-[11px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                            {isWord ? "Palavras" : "Perguntas"} • <span className="tnum">{pack.items.length}</span> itens
                          </p>
                        </button>

                        {/* View/expand toggle. */}
                        <motion.button
                          type="button"
                          onClick={() =>
                            setExpandedPackId((cur) => (cur === pack._id ? null : pack._id))
                          }
                          whileTap={reduceMotion ? undefined : { scale: 0.9 }}
                          transition={spring.press}
                          aria-label={isExpanded ? "Ocultar itens" : "Ver itens"}
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--r-lg)] text-[var(--color-text-muted)] outline-none transition-colors hover:bg-[var(--glass-2)] hover:text-[var(--color-text)] focus-visible:shadow-[var(--ring-focus)]"
                        >
                          <motion.span
                            className="inline-flex"
                            animate={{ rotate: isExpanded ? 180 : 0 }}
                            transition={reduceMotion ? { duration: 0 } : spring.pop}
                          >
                            <Icon icon="solar:alt-arrow-down-bold" width={20} height={20} />
                          </motion.span>
                        </motion.button>

                        {/* Delete affordance — morphs into a confirm pair. */}
                        <AnimatePresence mode="wait" initial={false}>
                          {isPendingDelete ? (
                            <motion.div
                              key="confirm"
                              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
                              transition={spring.pop}
                              className="flex shrink-0 items-center gap-1.5"
                            >
                              <motion.button
                                type="button"
                                onClick={() => void handleDelete(pack._id)}
                                whileTap={reduceMotion ? undefined : { scale: 0.9 }}
                                transition={spring.press}
                                aria-label="Confirmar exclusao"
                                className="flex h-11 w-11 items-center justify-center rounded-[var(--r-lg)] border border-[var(--color-imp)]/50 bg-[var(--color-imp)]/20 text-[var(--color-imp)] outline-none transition-colors hover:bg-[var(--color-imp)]/30 focus-visible:shadow-[var(--ring-focus)]"
                              >
                                <Icon icon="solar:check-circle-bold" width={22} height={22} />
                              </motion.button>
                              <motion.button
                                type="button"
                                onClick={() => setPendingDeleteId(null)}
                                whileTap={reduceMotion ? undefined : { scale: 0.9 }}
                                transition={spring.press}
                                aria-label="Cancelar"
                                className="flex h-11 w-11 items-center justify-center rounded-[var(--r-lg)] text-[var(--color-text-muted)] outline-none transition-colors hover:bg-[var(--glass-2)] hover:text-[var(--color-text)] focus-visible:shadow-[var(--ring-focus)]"
                              >
                                <Icon icon="solar:close-circle-bold" width={22} height={22} />
                              </motion.button>
                            </motion.div>
                          ) : (
                            <motion.button
                              key="delete"
                              type="button"
                              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
                              transition={spring.pop}
                              onClick={() => setPendingDeleteId(pack._id)}
                              whileHover={reduceMotion ? undefined : { scale: 1.08, rotate: -6 }}
                              whileTap={reduceMotion ? undefined : { scale: 0.9 }}
                              aria-label={`Apagar pacote ${pack.title}`}
                              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--r-lg)] text-[var(--color-imp)] outline-none transition-colors hover:bg-[var(--color-imp)]/15 focus-visible:shadow-[var(--ring-focus)]"
                            >
                              <Icon icon="solar:trash-bin-trash-bold" width={22} height={22} />
                            </motion.button>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Expandable item preview. */}
                      <AnimatePresence initial={false}>
                        {isExpanded && (
                          <motion.div
                            key="items"
                            initial={reduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
                            animate={reduceMotion ? { opacity: 1 } : { height: "auto", opacity: 1 }}
                            exit={reduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
                            transition={reduceMotion ? { duration: 0 } : spring.gentle}
                            className="overflow-hidden"
                          >
                            <div className="flex flex-wrap gap-2 border-t border-[var(--glass-border)] px-4 py-3.5">
                              {pack.items.map((item, i) => (
                                <span
                                  key={i}
                                  className="inline-flex items-center gap-1.5 rounded-[var(--r-pill)] border border-[var(--glass-border)] bg-[var(--glass-2)] px-3 py-1.5 font-body text-sm text-[var(--color-text)]"
                                >
                                  {item.content}
                                  {item.hint && (
                                    <span className="font-condensed text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
                                      {item.hint}
                                    </span>
                                  )}
                                </span>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </motion.div>
        ) : (
          /* Create form */
          <motion.form
            key="form"
            onSubmit={handleSubmit}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.98 }}
            transition={t}
            className="flex w-full max-w-2xl flex-col gap-5 rounded-[var(--r-2xl)] border border-[var(--glass-border)] bg-[var(--glass-1)] p-5 shadow-[var(--shadow-lg)] backdrop-blur-[var(--blur-lg)] sm:p-7"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span
                  aria-hidden
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--r-pill)] border border-[var(--glass-border)]"
                  style={{
                    backgroundColor: "color-mix(in srgb, var(--color-special) 18%, var(--glass-2))",
                    color: "var(--color-special)",
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,.18)",
                  }}
                >
                  <Icon icon="solar:add-folder-bold" width={18} height={18} />
                </span>
                <h3 className="font-display text-2xl text-[var(--color-text)]">Criar Pacote</h3>
              </div>
              <motion.button
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  resetForm();
                }}
                whileHover={reduceMotion ? undefined : { scale: 1.08, rotate: 90 }}
                whileTap={reduceMotion ? undefined : { scale: 0.92 }}
                transition={spring.press}
                className="flex h-11 w-11 items-center justify-center rounded-[var(--r-pill)] text-[var(--color-text-muted)] outline-none transition-colors hover:bg-[var(--glass-2)] hover:text-[var(--color-text)] focus-visible:shadow-[var(--ring-focus)]"
                aria-label="Fechar"
              >
                <Icon icon="solar:close-circle-bold" width={26} height={26} />
              </motion.button>
            </div>

            <AnimatePresence>
              {errorMsg && (
                <motion.p
                  key={errorMsg}
                  initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
                  animate={
                    reduceMotion
                      ? { opacity: 1 }
                      : { opacity: 1, y: 0, x: [0, -8, 8, -5, 5, 0] }
                  }
                  exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
                  transition={reduceMotion ? { duration: 0 } : { x: { duration: 0.4 } }}
                  className="rounded-[var(--r-md)] border border-[var(--color-imp)]/40 bg-[var(--color-imp)]/12 p-3 font-body text-sm text-[var(--color-imp)]"
                >
                  {errorMsg}
                </motion.p>
              )}
            </AnimatePresence>

            <label className="flex flex-col gap-2">
              <span className="font-condensed text-xs uppercase tracking-[0.24em] text-[var(--color-text-muted)]">
                Titulo do Pacote
              </span>
              <motion.input
                type="text"
                value={packTitle}
                whileFocus={reduceMotion ? undefined : { scale: 1.01 }}
                transition={spring.gentle}
                onChange={(event) => setPackTitle(event.target.value)}
                placeholder="Ex: Frutas Estranhas"
                className="h-14 rounded-[var(--r-md)] border border-[var(--glass-border)] bg-[var(--glass-2)] px-4 font-display text-lg text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary-1)] focus:bg-[var(--glass-1)] focus-visible:shadow-[var(--ring-focus)] transition-[background-color,border-color] duration-[var(--t-quick)]"
                maxLength={40}
              />
            </label>

            <div className="flex flex-col gap-2">
              <span className="font-condensed text-xs uppercase tracking-[0.24em] text-[var(--color-text-muted)]">
                Modo de Jogo
              </span>
              <SegmentedControl
                aria-label="Modo de jogo"
                tone="primary"
                value={packMode}
                onChange={(v) => setPackMode(v as "word" | "question")}
                options={[
                  {
                    value: "word",
                    label: "Palavras",
                    icon: <Icon icon="solar:text-square-bold" width={16} height={16} />,
                  },
                  {
                    value: "question",
                    label: "Perguntas",
                    icon: <Icon icon="solar:question-circle-bold" width={16} height={16} />,
                  },
                ]}
              />
            </div>

            <div className="flex flex-col gap-3">
              <span className="font-condensed text-xs uppercase tracking-[0.24em] text-[var(--color-text-muted)]">
                Itens do Pacote (<span className="tnum">{items.length}</span>)
              </span>

              <motion.div layout className="flex flex-col gap-3">
                <AnimatePresence initial={false}>
                  {items.map((item, index) => (
                    <motion.div
                      key={index}
                      layout
                      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, height: 0 }}
                      transition={t}
                      className="relative flex flex-col gap-2 rounded-[var(--r-lg)] border border-[var(--glass-border)] bg-[var(--glass-2)] p-3 pr-3 sm:flex-row sm:items-center sm:pr-14"
                    >
                      <input
                        type="text"
                        value={item.content}
                        onChange={(event) => handleItemChange(index, "content", event.target.value)}
                        placeholder={packMode === "word" ? "Palavra (Ex: Maca)" : "Pergunta principal"}
                        className="w-full flex-1 rounded-[var(--r-sm)] border border-[var(--glass-border)] bg-[var(--glass-1)] px-3 py-2.5 font-body text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary-1)] focus-visible:shadow-[var(--ring-focus)] transition-[border-color] duration-[var(--t-quick)]"
                      />
                      <input
                        type="text"
                        value={item.hint}
                        onChange={(event) => handleItemChange(index, "hint", event.target.value)}
                        placeholder={packMode === "word" ? "Dica (Ex: Fruta)" : "Pergunta para o Impostor"}
                        className="w-full flex-1 rounded-[var(--r-sm)] border border-[var(--glass-border)] bg-[var(--glass-1)] px-3 py-2.5 font-body text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary-1)] focus-visible:shadow-[var(--ring-focus)] transition-[border-color] duration-[var(--t-quick)]"
                      />
                      {items.length > 1 && (
                        <motion.button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          whileHover={reduceMotion ? undefined : { scale: 1.1, rotate: -6 }}
                          whileTap={reduceMotion ? undefined : { scale: 0.9 }}
                          transition={spring.press}
                          aria-label="Remover item"
                          className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-[var(--r-md)] text-[var(--color-text-muted)] outline-none transition-colors hover:bg-[var(--color-imp)]/15 hover:text-[var(--color-imp)] focus-visible:shadow-[var(--ring-focus)] sm:relative sm:right-auto sm:top-auto"
                        >
                          <Icon icon="solar:trash-bin-trash-bold" width={18} height={18} />
                        </motion.button>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>

              <motion.button
                type="button"
                onClick={handleAddItem}
                whileHover={reduceMotion ? undefined : { y: -2 }}
                whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                transition={spring.press}
                className="group/add flex h-12 items-center justify-center gap-2 rounded-[var(--r-md)] border border-dashed border-[var(--w-28)] font-display text-sm uppercase tracking-widest text-[var(--color-text-muted)] outline-none transition-[background-color,color] duration-[var(--t-quick)] hover:bg-[var(--glass-1)] hover:text-[var(--color-text)] focus-visible:shadow-[var(--ring-focus)]"
              >
                <motion.span
                  className="inline-flex"
                  whileHover={reduceMotion ? undefined : { rotate: 90 }}
                  transition={spring.press}
                >
                  <Icon icon="solar:add-circle-bold" width={18} height={18} />
                </motion.span>
                Adicionar Mais um Item
              </motion.button>
            </div>

            <motion.div
              whileHover={reduceMotion || validItemCount === 0 ? undefined : { y: -2 }}
              whileTap={reduceMotion ? undefined : { scale: 0.97 }}
              transition={spring.press}
            >
              <Button
                type="submit"
                variant="primary"
                size="game-lg"
                disabled={isSaving}
                className="hover:brightness-110"
              >
                {isSaving ? (
                  <Icon icon="solar:refresh-bold" width={22} height={22} className="animate-spin" />
                ) : (
                  <Icon icon="solar:diskette-bold" width={22} height={22} />
                )}
                {isSaving ? "Salvando..." : "Salvar Pacote"}
              </Button>
            </motion.div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
