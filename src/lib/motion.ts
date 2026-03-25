/**
 * Shared motion tokens — preview CSS animations + export duration math.
 */

/** Smooth deceleration — clean, no overshoot */
export const EASE_OUT = "cubic-bezier(0, 0, 0.2, 1)";

/** @keyframes s-motion-reveal duration */
export const MOTION_REVEAL_MS = 500;
/** @keyframes s-chat-row-enter duration */
export const CHAT_ROW_REVEAL_MS = 400;

export function easeInOutSine(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return 0.5 - 0.5 * Math.cos(Math.PI * x);
}

export const STAGGER_BASE_MS = 200;
export const STAGGER_STEP_MS = 105;

/** Typewriter speed — ms per character */
export const TYPEWRITER_CHAR_MS = 50;
