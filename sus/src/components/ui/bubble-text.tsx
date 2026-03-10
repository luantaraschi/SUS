"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";

interface BubbleTextProps {
  text: string;
  className?: string;
}

export const BubbleText = ({ text, className }: BubbleTextProps) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <h1
      onMouseLeave={() => setHoveredIndex(null)}
      className={cn("flex justify-center", className)}
    >
      {text.split("").map((char, idx) => {
        const distance = hoveredIndex !== null ? Math.abs(hoveredIndex - idx) : null;
        
        // Base classes for all characters, including the transition effect.
        let classes = "transition-all duration-300 ease-in-out cursor-default inline-block";
        
        // Apply different styles based on the distance from the hovered character.
        switch (distance) {
          case 0: // The character being hovered over.
            classes += " font-black scale-125 text-white";
            break;
          case 1: // Immediate neighbors.
            classes += " font-bold scale-110 text-white/90";
            break;
          case 2: // Second-degree neighbors.
            classes += " font-medium scale-105 text-white/80"; 
            break;
          default:
            // No additional classes for characters further away or when not hovering.
            classes += " font-normal text-white/70";
            break;
        }

        return (
          <span
            key={idx}
            onMouseEnter={() => setHoveredIndex(idx)}
            className={classes}
          >
            {char === " " ? "\u00A0" : char}
          </span>
        );
      })}
    </h1>
  );
};
