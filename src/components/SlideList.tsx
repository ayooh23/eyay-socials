"use client";

import { useState } from "react";
import type { Slide } from "@/lib/types";
import { THEMES } from "@/lib/themes";

function layoutGlyph(layout: Slide["layout"]) {
  if (layout === "terminal") return "▶";
  if (layout === "chat") return "💬";
  if (layout === "stat") return "#";
  if (layout === "list") return "≡";
  return "H";
}

export interface SlideListProps {
  slides: Slide[];
  cur: number;
  onSelect: (index: number) => void;
  onDelete: (index: number) => void;
  onReorder: (from: number, to: number) => void;
  onAdd: () => void;
}

export default function SlideList({
  slides,
  cur,
  onSelect,
  onDelete,
  onReorder,
  onAdd,
}: SlideListProps) {
  const [dragFrom, setDragFrom] = useState<number | null>(null);

  return (
    <div className="sb">
      <div className="sbl">slides</div>
      <div className="slide-list">
        {slides.map((s, i) => {
          const thumb = THEMES[s.theme ?? "dark"];
          return (
          <div
            key={s.id}
            role="button"
            tabIndex={0}
            className={`sli ${i === cur ? "on" : ""} ${dragFrom === i ? "sli-dragging" : ""}`}
            draggable
            onDragStart={() => setDragFrom(i)}
            onDragEnd={() => setDragFrom(null)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (dragFrom !== null) onReorder(dragFrom, i);
              setDragFrom(null);
            }}
            onClick={() => onSelect(i)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect(i);
              }
            }}
          >
            <span className="sli-n">{String(i + 1).padStart(2, "0")}</span>
            <div
              className="sli-m"
              style={{ background: thumb.bg, color: thumb.text }}
            >
              {layoutGlyph(s.layout)}
            </div>
            <span className="sli-t">
              {s.headline.replace(/\n/g, " ") || s.layout}
            </span>
            {slides.length > 1 ? (
              <button
                type="button"
                className="sli-d"
                aria-label="Delete slide"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(i);
                }}
              >
                ×
              </button>
            ) : null}
          </div>
        );
        })}
      </div>
      <button
        type="button"
        className="btn btn-g btn-w btn-sm"
        style={{ marginTop: 8 }}
        onClick={onAdd}
      >
        + add slide
      </button>
    </div>
  );
}
