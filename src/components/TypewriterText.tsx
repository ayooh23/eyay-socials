"use client";

import { useEffect, useState } from "react";

const CHAR_INTERVAL_MS = 50;

export function TypewriterText({
  text,
  active,
  startDelayMs,
  resetKey,
}: {
  text: string;
  active: boolean;
  startDelayMs: number;
  resetKey: string | number;
}) {
  const [shown, setShown] = useState(() => (active ? 0 : text.length));

  useEffect(() => {
    if (!active) {
      setShown(text.length);
      return;
    }
    setShown(0);
    if (text.length === 0) return;

    let cancelled = false;
    let raf = 0;
    let t0 = 0;

    const tick = (now: number) => {
      if (cancelled) return;
      if (t0 === 0) t0 = now;
      const elapsed = now - t0;
      if (elapsed < startDelayMs) {
        raf = requestAnimationFrame(tick);
        return;
      }
      const typed = Math.min(
        text.length,
        Math.floor((elapsed - startDelayMs) / CHAR_INTERVAL_MS) + 1,
      );
      setShown((prev) => (prev === typed ? prev : typed));
      if (typed < text.length) {
        raf = requestAnimationFrame(tick);
      }
    };

    raf = requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [active, text, resetKey, startDelayMs]);

  return <>{text.slice(0, shown)}</>;
}
