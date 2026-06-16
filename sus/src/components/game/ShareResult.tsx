"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";

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
      <Button
        variant="glass"
        size="game-lg"
        className="flex justify-center !text-base"
        onClick={handleShare}
      >
        <Icon icon={copied ? "solar:check-circle-bold" : "solar:share-bold"} width={20} />
        {copied ? "Texto Copiado!" : "Compartilhar Resultado"}
      </Button>
    </div>
  );
}
