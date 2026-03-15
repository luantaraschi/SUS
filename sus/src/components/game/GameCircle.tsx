"use client";

import { motion } from "framer-motion";
import { ReactNode, useEffect, useRef, useState } from "react";

function sketchyCirclePath(cx: number, cy: number, r: number, wobble = 4, points = 80): string {
  const pts: [number, number][] = [];
  for (let i = 0; i <= points; i++) {
    const angle = (i / points) * Math.PI * 2;
    const noise =
      Math.sin(angle * 3 + 0.5) * wobble * 0.6 +
      Math.sin(angle * 7 + 1.2) * wobble * 0.3 +
      Math.sin(angle * 13 + 2.1) * wobble * 0.1;
    const radius = r + noise;
    pts.push([cx + Math.cos(angle) * Math.max(0, radius), cy + Math.sin(angle) * Math.max(0, radius)]);
  }
  return "M " + pts.map(p => `${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(" L ") + " Z";
}

function SketchyCircleBorder() {
  const containerRef = useRef<HTMLDivElement>(null);
  const pathRefs = useRef<(SVGPathElement | null)[]>([]);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let animationFrameId: number;
    const startTime = performance.now();

    const render = (time: number) => {
      const timestamp = time - startTime;
      
      pathRefs.current.forEach((pathNode, i) => {
        if (!pathNode) return;
        const phase = timestamp * 0.0008 + (i * Math.PI * 2) / 3;
        const len = pathNode.getTotalLength() || 1000;
        
        const dashLen = len * (0.82 + Math.sin(phase * 1.1) * 0.12);
        const gapLen  = len * (0.06 + Math.sin(phase * 0.7 + 1) * 0.04);
        const offset  = (Math.sin(phase * 0.5) * len * 0.08) % len;
        
        pathNode.style.strokeDasharray  = `${dashLen} ${gapLen}`;
        pathNode.style.strokeDashoffset = String(offset);
        pathNode.style.opacity = String(0.25 + Math.sin(phase * 1.3) * 0.15 + (i === 0 ? 0.4 : 0));
      });

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  const { width, height } = dimensions;
  const cx = width / 2;
  const cy = height / 2;
  const r = Math.max(0, Math.min(width, height) / 2 - 5);

  return (
    <div ref={containerRef} className="absolute inset-0 pointer-events-none z-10" aria-hidden="true">
      {width > 0 && height > 0 && (
        <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} className="absolute inset-0 block overflow-visible">
          <defs>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {[0, 1, 2].map((i) => (
            <path
              key={i}
              ref={(el) => {
                pathRefs.current[i] = el;
              }}
              d={sketchyCirclePath(cx, cy, r, 5 + i * 2, 100)}
              fill="none"
              stroke="#1a1a2e"
              strokeWidth={i === 0 ? 4.5 : 3}
              strokeLinecap="round"
              strokeLinejoin="round"
              filter={i === 0 ? "url(#glow)" : undefined}
            />
          ))}
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
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
      className={`relative mx-auto flex aspect-square w-full min-w-[440px] max-w-[700px] flex-col items-center justify-center rounded-full bg-white shadow-[0_8px_40px_rgba(0,0,0,0.18)] flex-shrink-0 ${className}`}
    >
      <SketchyCircleBorder />
      <div className="relative z-20 flex w-full h-full flex-col items-center justify-center">
        {children}
      </div>
    </motion.div>
  );
}
