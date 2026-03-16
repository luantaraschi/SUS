"use client";

import { motion } from "framer-motion";
import { type ReactNode, useEffect, useRef, useState } from "react";

function SketchyPanelBorder() {
  const containerRef = useRef<HTMLDivElement>(null);
  const strokeRefs = useRef<(SVGRectElement | null)[]>([]);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;

      setDimensions({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let animationFrameId = 0;
    const startTime = performance.now();

    const render = (time: number) => {
      const elapsed = time - startTime;

      strokeRefs.current.forEach((strokeNode, index) => {
        if (!strokeNode) return;
        const phase = elapsed * 0.0007 + index * 0.9;
        const length = strokeNode.getTotalLength() || 1200;
        const dash = length * (0.76 + Math.sin(phase) * 0.08);
        const gap = length * (0.08 + Math.cos(phase * 0.7) * 0.02);
        const offset = (Math.sin(phase * 0.5) * length * 0.06) % length;

        strokeNode.style.strokeDasharray = `${dash} ${gap}`;
        strokeNode.style.strokeDashoffset = String(offset);
        strokeNode.style.opacity = String(0.3 + Math.sin(phase * 1.15) * 0.12 + (index === 0 ? 0.25 : 0));
      });

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  const { width, height } = dimensions;
  const inset = 6;
  const radius = Math.max(24, Math.min(56, Math.min(width, height) * 0.12));

  return (
    <div ref={containerRef} className="absolute inset-0 pointer-events-none z-10" aria-hidden="true">
      {width > 0 && height > 0 && (
        <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} className="absolute inset-0 block overflow-visible">
          <defs>
            <filter id="panel-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {[0, 1, 2].map((index) => {
            const insetOffset = inset + index * 1.4;
            return (
              <rect
                key={index}
                ref={(element) => {
                  strokeRefs.current[index] = element;
                }}
                x={insetOffset}
                y={insetOffset}
                width={Math.max(0, width - insetOffset * 2)}
                height={Math.max(0, height - insetOffset * 2)}
                rx={Math.max(18, radius - index * 4)}
                fill="none"
                stroke="#1a1a2e"
                strokeWidth={index === 0 ? 4.5 : 3}
                filter={index === 0 ? "url(#panel-glow)" : undefined}
              />
            );
          })}
        </svg>
      )}
    </div>
  );
}

interface GameCircleProps {
  children: ReactNode;
  className?: string;
}

export default function GameCircle({ children, className = "" }: GameCircleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.88, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
      className={`relative mx-auto flex w-full max-w-[760px] flex-col overflow-hidden rounded-[44px] bg-white shadow-[0_18px_70px_rgba(0,0,0,0.28)] ${className}`}
    >
      <SketchyPanelBorder />
      <div className="relative z-20 flex h-full w-full flex-col">{children}</div>
    </motion.div>
  );
}
