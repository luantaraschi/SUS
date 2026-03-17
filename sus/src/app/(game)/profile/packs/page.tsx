"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { BubbleText } from "@/components/ui/bubble-text";

export default function PacksPage() {
  const router = useRouter();
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

  if (user === undefined || myPacks === undefined) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <p className="font-display text-2xl text-white animate-pulse">Carregando...</p>
      </div>
    );
  }

  if (user === null) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4">
        <p className="font-display text-xl text-white">Voce precisa estar logado para criar pacotes.</p>
        <button
          onClick={() => router.push("/profile")}
          className="rounded-full bg-white/20 px-4 py-2 text-white"
        >
          Voltar ao Perfil
        </button>
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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!packTitle.trim()) {
      setErrorMsg("De um titulo ao pacote.");
      return;
    }

    const validItems = items.filter((item) => item.content.trim() !== "");
    if (validItems.length === 0) {
      setErrorMsg("Adicione pelo menos um item valido.");
      return;
    }

    try {
      await createPack({
        title: packTitle,
        mode: packMode,
        items: validItems,
      });
      setIsCreating(false);
      setPackTitle("");
      setItems([{ content: "", hint: "" }]);
      setErrorMsg("");
    } catch (error: unknown) {
      setErrorMsg(error instanceof Error ? error.message : "Erro ao criar pacote");
    }
  };

  const handleDelete = async (packId: Id<"customPacks">) => {
    if (confirm("Tem certeza que deseja apagar este pacote?")) {
      await deletePack({ packId });
    }
  };

  return (
    <div className="flex min-h-dvh w-full flex-col items-center gap-6 px-4 py-8 pb-20">
      <div className="mb-4 flex w-full max-w-2xl items-center justify-between">
        <button
          onClick={() => router.push("/profile")}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-white shadow-sm backdrop-blur-sm transition-all hover:bg-white/30"
        >
          <Icon icon="solar:arrow-left-bold" width={24} height={24} />
        </button>
        <BubbleText text="Meus Pacotes" className="font-display text-4xl sm:text-5xl" />
      </div>

      {!isCreating ? (
        <div className="flex w-full max-w-2xl flex-col gap-4">
          <button
            onClick={() => setIsCreating(true)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-surface-primary py-4 font-display text-xl text-white shadow-lg transition-all hover:bg-surface-primary/90"
          >
            <Icon icon="solar:add-circle-bold" width={24} />
            Novo Pacote
          </button>

          {myPacks.length === 0 ? (
            <p className="my-8 text-center font-body text-white/70">
              Voce ainda nao tem nenhum pacote customizado.
            </p>
          ) : (
            <div className="mt-4 flex flex-col gap-3">
              {myPacks.map((pack) => (
                <div
                  key={pack._id}
                  className="flex items-center justify-between rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-md"
                >
                  <div>
                    <h3 className="font-display text-xl text-white">{pack.title}</h3>
                    <p className="font-body text-sm text-white/60">
                      {pack.mode === "word" ? "Palavras" : "Perguntas"} - {pack.items.length} itens
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(pack._id)}
                    className="rounded-xl p-3 text-red-400 transition-all hover:bg-red-400/20"
                  >
                    <Icon icon="solar:trash-bin-trash-bold" width={24} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="flex w-full max-w-2xl flex-col gap-6 rounded-3xl bg-white p-6 shadow-2xl sm:p-8"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-display text-2xl text-[#1e1b6e]">Criar Pacote</h3>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <Icon icon="solar:close-circle-bold" width={28} />
            </button>
          </div>

          {errorMsg && (
            <p className="rounded-lg bg-red-50 p-3 font-body text-sm text-red-500">
              {errorMsg}
            </p>
          )}

          <div className="flex flex-col gap-1">
            <label className="font-condensed text-xs uppercase tracking-wider text-gray-500">
              Titulo do Pacote
            </label>
            <input
              type="text"
              value={packTitle}
              onChange={(event) => setPackTitle(event.target.value)}
              placeholder="Ex: Frutas Estranhas"
              className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 font-display text-lg outline-none focus:border-[#1e1b6e]"
              maxLength={40}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-condensed text-xs uppercase tracking-wider text-gray-500">
              Modo de Jogo
            </label>
            <div className="flex rounded-xl bg-gray-100 p-1">
              <button
                type="button"
                onClick={() => setPackMode("word")}
                className={`flex-1 rounded-lg py-2 font-display text-sm transition-all ${
                  packMode === "word"
                    ? "bg-[#1e1b6e] text-white shadow-md"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Palavras
              </button>
              <button
                type="button"
                onClick={() => setPackMode("question")}
                className={`flex-1 rounded-lg py-2 font-display text-sm transition-all ${
                  packMode === "question"
                    ? "bg-[#1e1b6e] text-white shadow-md"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Perguntas
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <label className="font-condensed text-xs uppercase tracking-wider text-gray-500">
              Itens do Pacote ({items.length})
            </label>

            {items.map((item, index) => (
              <div
                key={index}
                className="relative flex items-start gap-2 rounded-xl border border-gray-100 bg-gray-50 p-3 pb-10 sm:flex-row sm:pb-3"
              >
                <div className="w-full flex-1">
                  <input
                    type="text"
                    value={item.content}
                    onChange={(event) => handleItemChange(index, "content", event.target.value)}
                    placeholder={
                      packMode === "word"
                        ? "Palavra (Ex: Maca)"
                        : "Pergunta principal"
                    }
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 font-body text-sm outline-none focus:border-[#1e1b6e]"
                  />
                </div>
                <div className="w-full flex-1">
                  <input
                    type="text"
                    value={item.hint}
                    onChange={(event) => handleItemChange(index, "hint", event.target.value)}
                    placeholder={
                      packMode === "word"
                        ? "Dica (Ex: Fruta)"
                        : "Pergunta para o Impostor"
                    }
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 font-body text-sm outline-none focus:border-[#1e1b6e]"
                  />
                </div>
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(index)}
                    className="absolute bottom-2 right-2 rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 sm:relative sm:bottom-auto sm:right-auto"
                  >
                    <Icon icon="solar:trash-bin-trash-bold" width={20} />
                  </button>
                )}
              </div>
            ))}

            <button
              type="button"
              onClick={handleAddItem}
              className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 py-3 font-display text-sm text-gray-500 transition-colors hover:border-[#1e1b6e] hover:text-[#1e1b6e]"
            >
              <Icon icon="solar:add-circle-line-duotone" width={20} />
              Adicionar Mais um Item
            </button>
          </div>

          <button
            type="submit"
            className="mt-4 w-full rounded-xl bg-[#1e1b6e] py-4 font-display text-lg text-white shadow-md transition-all hover:bg-[#1e1b6e]/90"
          >
            Salvar Pacote
          </button>
        </form>
      )}
    </div>
  );
}
