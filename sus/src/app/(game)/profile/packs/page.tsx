"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
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
    { content: "", hint: "" }
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
        <p className="font-display text-xl text-white">Você precisa estar logado para criar pacotes.</p>
        <button onClick={() => router.push("/profile")} className="bg-white/20 text-white px-4 py-2 rounded-full">
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
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: "content" | "hint", value: string) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!packTitle.trim()) {
      setErrorMsg("Dê um título ao pacote.");
      return;
    }

    const validItems = items.filter(item => item.content.trim() !== "");
    if (validItems.length === 0) {
      setErrorMsg("Adicione pelo menos um item válido.");
      return;
    }

    try {
      await createPack({
        title: packTitle,
        mode: packMode,
        items: validItems
      });
      setIsCreating(false);
      setPackTitle("");
      setItems([{ content: "", hint: "" }]);
      setErrorMsg("");
    } catch (err: any) {
      setErrorMsg(err.message || "Erro ao criar pacote");
    }
  };

  const handleDelete = async (packId: any) => {
    if (confirm("Tem certeza que deseja apagar este pacote?")) {
      await deletePack({ packId });
    }
  };

  return (
    <div className="flex w-full flex-col items-center gap-6 px-4 py-8 pb-20 min-h-dvh">
      <div className="w-full max-w-2xl flex items-center justify-between mb-4">
        <button
          onClick={() => router.push("/profile")}
          className="flex items-center justify-center w-12 h-12 bg-white/20 hover:bg-white/30 text-white rounded-full backdrop-blur-sm transition-all shadow-sm"
        >
          <Icon icon="solar:arrow-left-bold" width={24} height={24} />
        </button>
        <BubbleText text="Meus Pacotes" className="font-display text-4xl sm:text-5xl" />
      </div>

      {!isCreating ? (
        <div className="w-full max-w-2xl flex flex-col gap-4">
          <button
            onClick={() => setIsCreating(true)}
            className="w-full bg-surface-primary hover:bg-surface-primary/90 text-white font-display text-xl py-4 rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2"
          >
            <Icon icon="solar:add-circle-bold" width={24} /> Novo Pacote
          </button>

          {myPacks.length === 0 ? (
            <p className="text-white/70 text-center font-body my-8">
              Você ainda não tem nenhum pacote customizado.
            </p>
          ) : (
            <div className="flex flex-col gap-3 mt-4">
              {myPacks.map((pack: any) => (
                <div key={pack._id} className="bg-white/10 backdrop-blur-md rounded-2xl p-4 flex justify-between items-center border border-white/20">
                  <div>
                    <h3 className="text-white font-display text-xl">{pack.title}</h3>
                    <p className="text-white/60 font-body text-sm">
                      {pack.mode === "word" ? "Palavras" : "Perguntas"} • {pack.items.length} itens
                    </p>
                  </div>
                  <button 
                    onClick={() => handleDelete(pack._id)}
                    className="p-3 text-red-400 hover:bg-red-400/20 rounded-xl transition-all"
                  >
                    <Icon icon="solar:trash-bin-trash-bold" width={24} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="w-full max-w-2xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-2xl text-[#1e1b6e]">Criar Pacote</h3>
            <button type="button" onClick={() => setIsCreating(false)} className="text-gray-400 hover:text-gray-600">
              <Icon icon="solar:close-circle-bold" width={28} />
            </button>
          </div>

          {errorMsg && <p className="text-red-500 font-body text-sm bg-red-50 p-3 rounded-lg">{errorMsg}</p>}

          <div className="flex flex-col gap-1">
            <label className="font-condensed uppercase tracking-wider text-xs text-gray-500">Título do Pacote</label>
            <input 
              type="text" 
              value={packTitle} 
              onChange={(e) => setPackTitle(e.target.value)} 
              placeholder="Ex: Frutas Estranhas"
              className="px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 outline-none focus:border-[#1e1b6e] font-display text-lg"
              maxLength={40}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-condensed uppercase tracking-wider text-xs text-gray-500">Modo de Jogo</label>
            <div className="flex bg-gray-100 rounded-xl p-1">
              <button 
                type="button" 
                onClick={() => setPackMode("word")} 
                className={`flex-1 py-2 rounded-lg font-display text-sm transition-all ${packMode === "word" ? "bg-[#1e1b6e] text-white shadow-md" : "text-gray-500 hover:text-gray-700"}`}
              >
                Palavras
              </button>
              <button 
                type="button" 
                onClick={() => setPackMode("question")} 
                className={`flex-1 py-2 rounded-lg font-display text-sm transition-all ${packMode === "question" ? "bg-[#1e1b6e] text-white shadow-md" : "text-gray-500 hover:text-gray-700"}`}
              >
                Perguntas
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <label className="font-condensed uppercase tracking-wider text-xs text-gray-500">
              Itens do Pacote ({items.length})
            </label>
            
            {items.map((item, index) => (
              <div key={index} className="flex flex-col sm:flex-row gap-2 items-start relative bg-gray-50 p-3 rounded-xl border border-gray-100 pb-10 sm:pb-3">
                <div className="w-full flex-1">
                  <input
                    type="text"
                    value={item.content}
                    onChange={(e) => handleItemChange(index, "content", e.target.value)}
                    placeholder={packMode === "word" ? "Palavra (Ex: Maçã)" : "Pergunta principal"}
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg outline-none focus:border-[#1e1b6e] font-body"
                  />
                </div>
                <div className="w-full flex-1">
                  <input
                    type="text"
                    value={item.hint}
                    onChange={(e) => handleItemChange(index, "hint", e.target.value)}
                    placeholder={packMode === "word" ? "Dica (Ex: Fruta)" : "Pergunta para o Impostor"}
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg outline-none focus:border-[#1e1b6e] font-body"
                  />
                </div>
                {items.length > 1 && (
                  <button 
                    type="button" 
                    onClick={() => handleRemoveItem(index)}
                    className="absolute right-2 bottom-2 sm:relative sm:right-auto sm:bottom-auto p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors"
                  >
                    <Icon icon="solar:trash-bin-trash-bold" width={20} />
                  </button>
                )}
              </div>
            ))}

            <button 
              type="button" 
              onClick={handleAddItem}
              className="flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-200 hover:border-[#1e1b6e] hover:text-[#1e1b6e] rounded-xl font-display text-sm text-gray-500 transition-colors"
            >
              <Icon icon="solar:add-circle-line-duotone" width={20} /> Adicionar Mais um Item
            </button>
          </div>

          <button 
            type="submit"
            className="w-full bg-[#1e1b6e] hover:bg-[#1e1b6e]/90 text-white font-display text-lg py-4 rounded-xl transition-all shadow-md mt-4"
          >
            Salvar Pacote
          </button>
        </form>
      )}
    </div>
  );
}
