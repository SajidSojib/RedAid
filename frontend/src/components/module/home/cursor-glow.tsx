"use client";

import { useEffect, useRef } from "react";

export function CursorGlow() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const glow = ref.current;
    const section = glow?.parentElement;
    if (!glow || !section) return;

    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return; // ignore touch
      const rect = section.getBoundingClientRect();
      glow.style.transform = `translate(${e.clientX - rect.left}px, ${e.clientY - rect.top}px) translate(-50%, -50%)`;
      glow.style.opacity = "1";
    };
    const leave = () => {
      glow.style.opacity = "0";
    };

    section.addEventListener("pointermove", move);
    section.addEventListener("pointerleave", leave);
    return () => {
      section.removeEventListener("pointermove", move);
      section.removeEventListener("pointerleave", leave);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute top-0 left-0 -z-10 size-64 rounded-full bg-primary/22 opacity-0 blur-3xl transition-[opacity,transform] duration-300 ease-out motion-reduce:hidden"
    />
  );
}
