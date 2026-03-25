import type { ChatRow, Slide } from "@/lib/types";

/** Above this length (or if the text contains a newline), bubble text may wrap. */
export const CHAT_BUBBLE_WRAP_CHARS = 38;

export function newChatRowId(): string {
  return `cr-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function legacyToChatRows(s: Slide): ChatRow[] {
  const rows: ChatRow[] = [];
  if (s.m1?.trim())
    rows.push({ id: newChatRowId(), role: "in", text: s.m1 });
  if (s.m2?.trim())
    rows.push({ id: newChatRowId(), role: "out", text: s.m2 });
  if ((s.m3Lead ?? "").trim())
    rows.push({
      id: newChatRowId(),
      role: "in",
      text: (s.m3Lead ?? "").trim(),
    });
  const m3 = resolvedM3(s);
  if (m3.trim())
    rows.push({ id: newChatRowId(), role: "in", text: m3 });
  return rows;
}

/** Fill `chatRows` from classic m1–m3 fields (used only when storage had no `chatRows` key). */
export function migrateChatSlide(s: Slide): Slide {
  if (s.layout !== "chat") return s;
  const fromLegacy = legacyToChatRows(s);
  if (fromLegacy.length > 0) return { ...s, chatRows: fromLegacy };
  return { ...s, chatRows: s.chatRows ?? [] };
}

export type ChatBubbleVM = {
  key: string;
  txt: string;
  d: "in" | "out";
  nm: string;
  time: string;
};

function formatChatTime(index: number): string {
  const m = 1 + index * 3;
  const sec = (23 + index * 17) % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

export function getChatBubbleList(slide: Slide): ChatBubbleVM[] {
  const snIncoming = (slide.sn1 ?? "").trim() || "Sinyo";
  const snOutgoing = (slide.sn2 ?? "").trim() || "Ayu";
  const fromRows = (slide.chatRows ?? []).filter((r) => r.text.trim());
  if (fromRows.length > 0) {
    return fromRows.map((r, i) => ({
      key: r.id,
      txt: r.text,
      d: r.role,
      nm: r.role === "out" ? snOutgoing : snIncoming,
      time: formatChatTime(i),
    }));
  }

  const m3Shown = resolvedM3(slide);
  const legacy: (ChatBubbleVM | null)[] = [
    slide.m1
      ? {
          key: "legacy-m1",
          txt: slide.m1,
          d: "in",
          nm: snIncoming,
          time: formatChatTime(0),
        }
      : null,
    slide.m2
      ? {
          key: "legacy-m2",
          txt: slide.m2,
          d: "out",
          nm: snOutgoing,
          time: formatChatTime(1),
        }
      : null,
    (slide.m3Lead ?? "").trim()
      ? {
          key: "legacy-m3lead",
          txt: (slide.m3Lead ?? "").trim(),
          d: "in",
          nm: snIncoming,
          time: formatChatTime(2),
        }
      : null,
    m3Shown
      ? {
          key: "legacy-m3",
          txt: m3Shown,
          d: "in",
          nm: snIncoming,
          time: formatChatTime(3),
        }
      : null,
  ];
  return legacy.filter(Boolean) as ChatBubbleVM[];
}

export function resolvedM3(
  slide: Pick<Slide, "m3" | "m3b" | "m3c" | "m3Pick">,
): string {
  const opts = [slide.m3, slide.m3b, slide.m3c];
  const pick = slide.m3Pick ?? 0;
  const chosen = opts[pick];
  if (chosen != null && chosen.trim() !== "") return chosen;
  const fallback = opts.find((o) => o != null && o.trim() !== "");
  return fallback ?? "";
}

export function chatBubbleShouldWrap(txt: string): boolean {
  return txt.includes("\n") || txt.length > CHAT_BUBBLE_WRAP_CHARS;
}
