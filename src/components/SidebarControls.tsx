"use client";

import type {
  Alignment,
  ChatSpeed,
  GlobalStyle,
  Layout,
  Slide,
} from "@/lib/types";

const LAYOUTS: Layout[] = ["headline", "chat", "stat", "list", "terminal"];

export interface SidebarControlsProps {
  slide: Slide;
  globalStyle: GlobalStyle;
  /** Always patches the slide identified by id (use slide.id from props at event time). */
  onPatchSlide: (slideId: string, patch: Partial<Slide>) => void;
  onChangeGlobal: (patch: Partial<GlobalStyle>) => void;
}

export default function SidebarControls({
  slide,
  globalStyle,
  onPatchSlide,
  onChangeGlobal,
}: SidebarControlsProps) {
  const lay = slide.layout;
  const patch = (p: Partial<Slide>) => onPatchSlide(slide.id, p);

  return (
    <>
      <div className="sb">
        <div className="sbl">layout</div>
        <div className="pills">
          {LAYOUTS.map((v) => (
            <button
              key={v}
              type="button"
              className={`pill ${slide.layout === v ? "on" : ""}`}
              onClick={() => patch({ layout: v })}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div className="sb">
        <div className="sbl">content</div>

        <div className="ctrl">
          <label>eyebrow</label>
          <input
            type="text"
            value={slide.eyebrow}
            placeholder="studio · amsterdam"
            onChange={(e) => patch({ eyebrow: e.target.value })}
          />
        </div>

        <div className={`ctrl ${lay === "chat" || lay === "terminal" ? "hidden" : ""}`}>
          <label>headline</label>
          <textarea
            rows={3}
            value={slide.headline}
            placeholder="Your idea from this morning, built today."
            onChange={(e) => patch({ headline: e.target.value })}
          />
        </div>

        <div
          className={`ctrl ${lay !== "headline" ? "hidden" : ""}`}
        >
          <label>body</label>
          <textarea
            rows={2}
            value={slide.body}
            placeholder="Supporting text…"
            onChange={(e) => patch({ body: e.target.value })}
          />
        </div>

        <div className={lay === "chat" ? "" : "hidden"}>
          <div className="ctrl">
            <label>msg 1 — incoming</label>
            <input
              type="text"
              value={slide.m1}
              placeholder="Ey ay"
              onChange={(e) => patch({ m1: e.target.value })}
            />
          </div>
          <div className="ctrl">
            <label>msg 2 — outgoing</label>
            <input
              type="text"
              value={slide.m2}
              placeholder="What if we built…"
              onChange={(e) => patch({ m2: e.target.value })}
            />
          </div>
          <div className="ctrl">
            <label>msg 3 — incoming (opt)</label>
            <input
              type="text"
              value={slide.m3}
              placeholder="…something that just works"
              onChange={(e) => patch({ m3: e.target.value })}
            />
          </div>
          <div className="ctrl">
            <label>sender names</label>
            <div style={{ display: "flex", gap: 5 }}>
              <input
                type="text"
                style={{ flex: 1 }}
                value={slide.sn1}
                placeholder="Sinyo"
                onChange={(e) => patch({ sn1: e.target.value })}
              />
              <input
                type="text"
                style={{ flex: 1 }}
                value={slide.sn2}
                placeholder="Ayu"
                onChange={(e) => patch({ sn2: e.target.value })}
              />
            </div>
          </div>
          <div className="ctrl">
            <label>animation speed</label>
            <div className="pills">
              {(["normal", "fast", "slow"] as ChatSpeed[]).map((v) => (
                <button
                  key={v}
                  type="button"
                  className={`pill ${slide.chatSpeed === v ? "on" : ""}`}
                  onClick={() => patch({ chatSpeed: v })}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className={lay === "stat" ? "" : "hidden"}>
          <div style={{ display: "flex", gap: 6 }}>
            <div className="ctrl" style={{ flex: 1 }}>
              <label>stat 1</label>
              <input
                type="text"
                value={slide.s1n}
                placeholder="2×"
                onChange={(e) => patch({ s1n: e.target.value })}
              />
            </div>
            <div className="ctrl" style={{ flex: 1 }}>
              <label>label</label>
              <input
                type="text"
                value={slide.s1l}
                placeholder="faster"
                onChange={(e) => patch({ s1l: e.target.value })}
              />
            </div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <div className="ctrl" style={{ flex: 1 }}>
              <label>stat 2</label>
              <input
                type="text"
                value={slide.s2n}
                placeholder="10×"
                onChange={(e) => patch({ s2n: e.target.value })}
              />
            </div>
            <div className="ctrl" style={{ flex: 1 }}>
              <label>label</label>
              <input
                type="text"
                value={slide.s2l}
                placeholder="output"
                onChange={(e) => patch({ s2l: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className={lay === "list" ? "" : "hidden"}>
          <div className="ctrl">
            <label>item 1</label>
            <input
              type="text"
              value={slide.l1}
              onChange={(e) => patch({ l1: e.target.value })}
            />
          </div>
          <div className="ctrl">
            <label>item 2</label>
            <input
              type="text"
              value={slide.l2}
              onChange={(e) => patch({ l2: e.target.value })}
            />
          </div>
          <div className="ctrl">
            <label>item 3</label>
            <input
              type="text"
              value={slide.l3}
              onChange={(e) => patch({ l3: e.target.value })}
            />
          </div>
          <div className="ctrl">
            <label>item 4 (opt)</label>
            <input
              type="text"
              value={slide.l4}
              onChange={(e) => patch({ l4: e.target.value })}
            />
          </div>
        </div>

        <div className={lay === "terminal" ? "" : "hidden"}>
          <div className="ctrl">
            <label>terminal text</label>
            <textarea
              rows={2}
              value={slide.term}
              placeholder="where ideas get built today"
              onChange={(e) => patch({ term: e.target.value })}
            />
          </div>
        </div>

        <div className="ctrl">
          <label>footer / cta</label>
          <input
            type="text"
            value={slide.cta}
            placeholder="eyay.studio"
            onChange={(e) => patch({ cta: e.target.value })}
          />
        </div>
      </div>

      <div className="sb">
        <div className="sbl">this slide</div>
        <div
          style={{
            fontSize: 10,
            color: "var(--text3)",
            lineHeight: 1.5,
            marginBottom: 10,
            fontFamily: "var(--mono)",
          }}
        >
          Color theme and alignment apply only to the selected slide.
        </div>

        <div className="ctrl">
          <label>color theme</label>
          <div className="swatches">
            <button
              type="button"
              title="Dark"
              className={`swatch ${slide.theme === "dark" ? "on" : ""}`}
              style={{ background: "#0a0a0a", border: "2px solid #333" }}
              onClick={() => patch({ theme: "dark" })}
            />
            <button
              type="button"
              title="Light"
              className={`swatch ${slide.theme === "light" ? "on" : ""}`}
              style={{ background: "#f5f5f5" }}
              onClick={() => patch({ theme: "light" })}
            />
            <button
              type="button"
              title="Blue"
              className={`swatch ${slide.theme === "blue" ? "on" : ""}`}
              style={{ background: "#0000FF" }}
              onClick={() => patch({ theme: "blue" })}
            />
            <button
              type="button"
              title="Cream"
              className={`swatch ${slide.theme === "cream" ? "on" : ""}`}
              style={{ background: "#faf8f4" }}
              onClick={() => patch({ theme: "cream" })}
            />
            <button
              type="button"
              title="Midnight"
              className={`swatch ${slide.theme === "midnight" ? "on" : ""}`}
              style={{ background: "#1a1a2e" }}
              onClick={() => patch({ theme: "midnight" })}
            />
            <button
              type="button"
              title="Red"
              className={`swatch ${slide.theme === "red" ? "on" : ""}`}
              style={{ background: "#ef4444" }}
              onClick={() => patch({ theme: "red" })}
            />
          </div>
        </div>

        <div className="ctrl">
          <label>alignment</label>
          <div className="pills">
            {(["left", "center", "right"] as Alignment[]).map((a) => (
              <button
                key={a}
                type="button"
                className={`pill ${(slide.align ?? "left") === a ? "on" : ""}`}
                onClick={() => patch({ align: a })}
              >
                {a}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="sb">
        <div className="sbl">carousel</div>
        <div
          style={{
            fontSize: 10,
            color: "var(--text3)",
            lineHeight: 1.5,
            marginBottom: 10,
            fontFamily: "var(--mono)",
          }}
        >
          Headline size and header/footer toggles apply to every slide.
        </div>

        <div className="ctrl">
          <label>headline size</label>
          <div className="range-row">
            <input
              type="range"
              min={48}
              max={140}
              value={globalStyle.size}
              onChange={(e) =>
                onChangeGlobal({ size: parseInt(e.target.value, 10) })
              }
            />
            <span className="rv">{globalStyle.size}</span>
          </div>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <div className="ctrl" style={{ flex: 1 }}>
            <label>studio tag</label>
            <div className="pills">
              <button
                type="button"
                className={`pill ${globalStyle.showTag ? "on" : ""}`}
                onClick={() => onChangeGlobal({ showTag: true })}
              >
                on
              </button>
              <button
                type="button"
                className={`pill ${!globalStyle.showTag ? "on" : ""}`}
                onClick={() => onChangeGlobal({ showTag: false })}
              >
                off
              </button>
            </div>
          </div>
          <div className="ctrl" style={{ flex: 1 }}>
            <label>slide num</label>
            <div className="pills">
              <button
                type="button"
                className={`pill ${globalStyle.showNum ? "on" : ""}`}
                onClick={() => onChangeGlobal({ showNum: true })}
              >
                on
              </button>
              <button
                type="button"
                className={`pill ${!globalStyle.showNum ? "on" : ""}`}
                onClick={() => onChangeGlobal({ showNum: false })}
              >
                off
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
