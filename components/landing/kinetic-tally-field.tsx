"use client";

import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";

const COLS = 7;
const ROWS = 4;
const TOTAL = COLS * ROWS;

export function KineticTallyField() {
  const containerRef = useRef<HTMLDivElement>(null);
  const strokeRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [tallied, setTallied] = useState(false);

  const mouseRef = useRef({ x: 0.5, y: 0.5, active: false });
  const talliedRef = useRef(false);

  useEffect(() => {
    talliedRef.current = tallied;
  }, [tallied]);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const tick = (time: number) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();

      // Skip work when scrolled off screen
      if (rect.bottom < 0 || rect.top > window.innerHeight) return;

      for (let i = 0; i < TOTAL; i++) {
        const el = strokeRefs.current[i];
        if (!el) continue;

        const col = i % COLS;
        const row = Math.floor(i / COLS);
        const normX = (col + 0.5) / COLS;
        const normY = (row + 0.5) / ROWS;

        // Subtle idle wave so the composition breathes quietly at rest
        const idleAngle = Math.sin(time * 1.1 + col * 0.45 + row * 0.35) * 6;
        const idleScaleY = 0.92 + Math.cos(time * 0.9 + col * 0.5) * 0.08;

        let targetAngle = idleAngle;
        let targetScaleY = idleScaleY;

        if (mouseRef.current.active) {
          const dx = mouseRef.current.x - normX;
          const dy = mouseRef.current.y - normY;
          const dist = Math.hypot(dx, dy);
          const influence = Math.max(0, 1 - dist * 1.65);

          // Strokes lean smoothly toward the pointer
          const pointerAngle = Math.atan2(dy, dx) * (180 / Math.PI) * 0.38;
          targetAngle = idleAngle * (1 - influence) + pointerAngle * influence;
          targetScaleY = idleScaleY + influence * 0.28;
        }

        // Clicking snaps every 5th-style group into a crisp diagonal tally slash
        if (talliedRef.current) {
          const isFifth = (i + 1) % 5 === 0;
          targetAngle = isFifth ? -52 : 0;
          targetScaleY = isFifth ? 1.35 : 0.95;
        }

        const currentRot = Number(el.dataset.rot || 0);
        const currentSy = Number(el.dataset.sy || 1);
        const nextRot = currentRot + (targetAngle - currentRot) * 0.14;
        const nextSy = currentSy + (targetScaleY - currentSy) * 0.14;

        el.dataset.rot = String(nextRot);
        el.dataset.sy = String(nextSy);
        el.style.transform = `rotate(${nextRot.toFixed(2)}deg) scaleY(${nextSy.toFixed(3)})`;
      }
    };

    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
    };
  }, []);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseRef.current = {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
      active: true,
    };
  };

  const handlePointerLeave = () => {
    mouseRef.current.active = false;
  };

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onClick={() => setTallied((prev) => !prev)}
      role="button"
      tabIndex={0}
      aria-label="Interactive register tally field. Click or move pointer to interact."
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setTallied((prev) => !prev);
        }
      }}
      className="w-full h-full min-h-[240px] sm:min-h-[280px] p-4 sm:p-6 flex flex-col justify-center cursor-pointer select-none"
    >
      <div className="grid grid-cols-7 gap-3 sm:gap-4 flex-1 items-center justify-items-center py-2">
        {Array.from({ length: TOTAL }).map((_, i) => {
          const isGroupSlash = (i + 1) % 5 === 0;
          return (
            <div
              key={i}
              ref={(el) => {
                strokeRefs.current[i] = el;
              }}
              className={`w-[3px] sm:w-1 rounded-full transition-colors duration-200 ${
                tallied && isGroupSlash
                  ? "h-12 sm:h-14 bg-[#18181B] dark:bg-[#EDEDED]"
                  : "h-9 sm:h-11 bg-[#18181B]/75 dark:bg-[#EDEDED]/75"
              }`}
              style={{ willChange: "transform" }}
            />
          );
        })}
      </div>
    </div>
  );
}
