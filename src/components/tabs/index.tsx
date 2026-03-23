"use client";

export type MainTab = "carousel" | "proposals" | "docs";

export function MainTabBar({
  value,
  onChange,
}: {
  value: MainTab;
  onChange: (t: MainTab) => void;
}) {
  return (
    <div className="pills" style={{ marginLeft: 14 }}>
      <button
        type="button"
        className={`pill ${value === "carousel" ? "on" : ""}`}
        onClick={() => onChange("carousel")}
      >
        Carousel
      </button>
      <button
        type="button"
        className={`pill ${value === "proposals" ? "on" : ""}`}
        onClick={() => onChange("proposals")}
      >
        Proposals
      </button>
      <button
        type="button"
        className={`pill ${value === "docs" ? "on" : ""}`}
        onClick={() => onChange("docs")}
      >
        Docs
      </button>
    </div>
  );
}
