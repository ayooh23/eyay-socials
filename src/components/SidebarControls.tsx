"use client";

import { newChatRowId } from "@/lib/chatSlide";
import type {
  Alignment,
  ChatRow,
  ChatSpeed,
  GlobalStyle,
  Layout,
  M3Pick,
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
  const chatRows = slide.chatRows ?? [];

  const updateChatRow = (id: string, part: Partial<ChatRow>) => {
    patch({
      chatRows: chatRows.map((r) => (r.id === id ? { ...r, ...part } : r)),
    });
  };
  const removeChatRow = (id: string) => {
    patch({ chatRows: chatRows.filter((r) => r.id !== id) });
  };
  const addChatRow = () => {
    patch({
      chatRows: [
        ...chatRows,
        { id: newChatRowId(), role: "in", text: "" },
      ],
    });
  };

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
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 6,
              }}
            >
              <label style={{ marginBottom: 0, flex: 1 }}>messages</label>
              <button
                type="button"
                className="btn btn-p btn-sm"
                onClick={addChatRow}
              >
                + add
              </button>
            </div>
            {chatRows.length === 0 ? (
              <div
                style={{
                  fontSize: 10,
                  color: "var(--text3)",
                  lineHeight: 1.5,
                  fontFamily: "var(--mono)",
                  marginBottom: 10,
                }}
              >
                List empty — classic fields below, or + add to start a custom
                thread.
              </div>
            ) : null}
            {chatRows.map((row, i) => (
              <div
                key={row.id}
                className="ctrl"
                style={{ marginBottom: 8 }}
              >
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    gap: 6,
                    marginBottom: 4,
                  }}
                >
                  <span
                    className="rv"
                    style={{ minWidth: 16, textAlign: "left" }}
                  >
                    {i + 1}
                  </span>
                  <div className="pills">
                    <button
                      type="button"
                      className={`pill ${row.role === "in" ? "on" : ""}`}
                      onClick={() => updateChatRow(row.id, { role: "in" })}
                    >
                      in
                    </button>
                    <button
                      type="button"
                      className={`pill ${row.role === "out" ? "on" : ""}`}
                      onClick={() => updateChatRow(row.id, { role: "out" })}
                    >
                      out
                    </button>
                  </div>
                  <button
                    type="button"
                    className="btn btn-g btn-sm"
                    onClick={() => removeChatRow(row.id)}
                    aria-label="Delete message"
                  >
                    × delete
                  </button>
                </div>
                <input
                  type="text"
                  value={row.text}
                  placeholder="Message…"
                  onChange={(e) =>
                    updateChatRow(row.id, { text: e.target.value })
                  }
                />
              </div>
            ))}
            {chatRows.length === 0 ? (
              <>
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
                  <label>msg 3 — lead-in (Sinyo, before variant)</label>
                  <input
                    type="text"
                    value={slide.m3Lead}
                    placeholder="Yeah — I'm thinking…"
                    onChange={(e) => patch({ m3Lead: e.target.value })}
                  />
                </div>
                <div className="ctrl">
                  <label>msg 3 — active variant</label>
                  <div className="pills">
                    {([0, 1, 2] as const satisfies readonly M3Pick[]).map(
                      (v) => (
                        <button
                          key={v}
                          type="button"
                          className={`pill ${slide.m3Pick === v ? "on" : ""}`}
                          onClick={() => patch({ m3Pick: v })}
                        >
                          {v === 0 ? "A" : v === 1 ? "B" : "C"}
                        </button>
                      ),
                    )}
                  </div>
                </div>
                <div className="ctrl">
                  <label>msg 3 — line A</label>
                  <input
                    type="text"
                    value={slide.m3}
                    placeholder="…something that just works"
                    onChange={(e) => patch({ m3: e.target.value })}
                  />
                </div>
                <div className="ctrl">
                  <label>msg 3 — line B</label>
                  <input
                    type="text"
                    value={slide.m3b}
                    placeholder="Alternate line…"
                    onChange={(e) => patch({ m3b: e.target.value })}
                  />
                </div>
                <div className="ctrl">
                  <label>msg 3 — line C</label>
                  <input
                    type="text"
                    value={slide.m3c}
                    placeholder="Another option…"
                    onChange={(e) => patch({ m3c: e.target.value })}
                  />
                </div>
              </>
            ) : null}
          </div>
          <div className="ctrl">
            <label>name above incoming bubbles (msg 1, lead-in, variant)</label>
            <input
              type="text"
              value={slide.sn1}
              placeholder="Sinyo"
              onChange={(e) => patch({ sn1: e.target.value })}
            />
          </div>
          <div className="ctrl">
            <label>name above outgoing bubble (msg 2)</label>
            <input
              type="text"
              value={slide.sn2}
              placeholder="Ayu"
              onChange={(e) => patch({ sn2: e.target.value })}
            />
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

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
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
          <div className="ctrl" style={{ flex: 1 }}>
            <label>slide circles</label>
            <div className="pills">
              <button
                type="button"
                className={`pill ${globalStyle.showDots ? "on" : ""}`}
                onClick={() => onChangeGlobal({ showDots: true })}
              >
                on
              </button>
              <button
                type="button"
                className={`pill ${!globalStyle.showDots ? "on" : ""}`}
                onClick={() => onChangeGlobal({ showDots: false })}
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
