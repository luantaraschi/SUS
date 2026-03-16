"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";
import GameButton from "./GameButton";

interface ShareResultProps {
  title: string;
  text: string;
  url: string;
}

export default function ShareResult({ title, text, url }: ShareResultProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text,
          url,
        });
      } catch {
        fallbackCopy();
      }
    } else {
      fallbackCopy();
    }
  };

  const fallbackCopy = async () => {
    try {
      await navigator.clipboard.writeText(`${title}\n\n${text}\n\nJogue aqui: ${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2 w-full">
      <GameButton
        variant="outline"
        size="lg"
        className="w-full flex justify-center !text-base"
        icon={<Icon icon={copied ? "solar:check-circle-bold" : "solar:share-bold"} width={20} />}
        onClick={handleShare}
      >
        {copied ? "Texto Copiado!" : "Compartilhar Resultado"}
      </GameButton>
    </div>
  );
}
