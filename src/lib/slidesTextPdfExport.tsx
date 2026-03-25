"use client";

import type { Style } from "@react-pdf/types";
import type { ReactNode } from "react";
import {
  Document,
  Font,
  Image,
  Page,
  Text,
  View,
  pdf,
} from "@react-pdf/renderer";
import { getChatBubbleList } from "@/lib/chatSlide";
import { slidesSlideToCarouselSlide } from "@/lib/slidesDeckBridge";
import type {
  GlobalStyle,
  SlidesSlide,
  ThemeKey,
} from "@/lib/types";
import { THEMES } from "@/lib/themes";

/** Landscape HD slide — same coordinate space as on-screen deck (1 PDF unit ≈ 1 design px). */
export const SLIDES_PDF_PAGE_W = 1920;
export const SLIDES_PDF_PAGE_H = 1080;

const PAD_X = 96;
const PAD_TOP = 72;
const PAD_BOTTOM = 72;
const INNER_W = SLIDES_PDF_PAGE_W - PAD_X * 2;

const FONT_SANS = "DMSans";
const FONT_MONO = "DMMono";

let fontsRegistered = false;

function registerSlidesPdfFontsOnce(): void {
  if (fontsRegistered) return;
  fontsRegistered = true;
  Font.register({
    family: FONT_SANS,
    src: "https://cdn.jsdelivr.net/fontsource/fonts/dm-sans@latest/latin-400-normal.woff",
    fontWeight: 400,
  });
  Font.register({
    family: FONT_SANS,
    src: "https://cdn.jsdelivr.net/fontsource/fonts/dm-sans@latest/latin-300-normal.woff",
    fontWeight: 300,
  });
  Font.register({
    family: FONT_SANS,
    src: "https://cdn.jsdelivr.net/fontsource/fonts/dm-sans@latest/latin-600-normal.woff",
    fontWeight: 600,
  });
  Font.register({
    family: FONT_SANS,
    src: "https://cdn.jsdelivr.net/fontsource/fonts/dm-sans@latest/latin-700-normal.woff",
    fontWeight: 700,
  });
  Font.register({
    family: FONT_SANS,
    src: "https://cdn.jsdelivr.net/fontsource/fonts/dm-sans@latest/latin-300-italic.woff",
    fontWeight: 300,
    fontStyle: "italic",
  });
  Font.register({
    family: FONT_SANS,
    src: "https://cdn.jsdelivr.net/fontsource/fonts/dm-sans@latest/latin-400-italic.woff",
    fontWeight: 400,
    fontStyle: "italic",
  });
  Font.register({
    family: FONT_MONO,
    src: "https://cdn.jsdelivr.net/fontsource/fonts/dm-mono@latest/latin-400-normal.woff",
    fontWeight: 400,
  });
  Font.register({
    family: FONT_MONO,
    src: "https://cdn.jsdelivr.net/fontsource/fonts/dm-mono@latest/latin-500-normal.woff",
    fontWeight: 700,
  });
  Font.register({
    family: FONT_MONO,
    src: "https://cdn.jsdelivr.net/fontsource/fonts/dm-mono@latest/latin-400-italic.woff",
    fontWeight: 400,
    fontStyle: "italic",
  });
}

function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function themeOf(key: ThemeKey) {
  return THEMES[key] ?? THEMES.dark;
}

function hlSize(globalStyle: GlobalStyle): number {
  return Math.min(
    Math.round(globalStyle.size * (SLIDES_PDF_PAGE_W / 1080)),
    200,
  );
}

function Multiline({
  text,
  style,
}: {
  text: string;
  style?: Style | Style[];
}) {
  const lines = text.split("\n");
  return (
    <>
      {lines.map((line, i) => (
        <Text key={i} style={style}>
          {line.length ? line : " "}
        </Text>
      ))}
    </>
  );
}

/** Parse **bold**, *italic*, `code` into react-pdf <Text> nodes. */
function parseMdPdf(
  text: string,
  baseStyle: Style,
  accentColor?: string,
): ReactNode[] {
  const nodes: ReactNode[] = [];
  const lines = text.split("\n");
  lines.forEach((line, li) => {
    const re = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
    let last = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(line)) !== null) {
      if (m.index > last) {
        nodes.push(
          <Text key={`${li}-t-${last}`} style={baseStyle}>
            {line.slice(last, m.index)}
          </Text>,
        );
      }
      if (m[2] != null) {
        nodes.push(
          <Text
            key={`${li}-b-${m.index}`}
            style={{ ...baseStyle, fontWeight: 700 } as Style}
          >
            {m[2]}
          </Text>,
        );
      } else if (m[3] != null) {
        nodes.push(
          <Text
            key={`${li}-i-${m.index}`}
            style={{ ...baseStyle, fontStyle: "italic" } as Style}
          >
            {m[3]}
          </Text>,
        );
      } else if (m[4] != null) {
        nodes.push(
          <Text
            key={`${li}-c-${m.index}`}
            style={{
              ...baseStyle,
              backgroundColor: accentColor
                ? `${accentColor}22`
                : "rgba(255,255,255,0.1)",
              borderRadius: 4,
              paddingLeft: 5,
              paddingRight: 5,
            } as Style}
          >
            {m[4]}
          </Text>,
        );
      }
      last = m.index + m[0].length;
    }
    if (last < line.length) {
      nodes.push(
        <Text key={`${li}-t-${last}`} style={baseStyle}>
          {line.slice(last)}
        </Text>,
      );
    }
    if (li < lines.length - 1) {
      nodes.push(
        <Text key={`br-${li}`} style={baseStyle}>
          {"\n"}
        </Text>,
      );
    }
  });
  return nodes;
}

function DotsRow({
  index,
  total,
  color,
}: {
  index: number;
  total: number;
  color: string;
}) {
  const parts: string[] = [];
  for (let i = 0; i < total; i++) {
    parts.push(i === index ? "●" : "·");
  }
  return (
    <Text
      style={{
        fontFamily: FONT_MONO,
        fontSize: 14,
        color,
        opacity: 0.45,
        letterSpacing: 4,
      }}
    >
      {parts.join(" ")}
    </Text>
  );
}

const HEADER_H = 56;
const FOOTER_H = 48;
const BODY_H = SLIDES_PDF_PAGE_H - PAD_TOP - HEADER_H - FOOTER_H - PAD_BOTTOM;

function SlidePage({
  slide,
  globalStyle,
  slideIndex,
  totalSlides,
  children,
  bodyJustify = "center",
}: {
  slide: SlidesSlide;
  globalStyle: GlobalStyle;
  slideIndex: number;
  totalSlides: number;
  children: ReactNode;
  bodyJustify?: "center" | "flex-start" | "flex-end";
}) {
  const t = themeOf((slide.theme ?? "dark") as ThemeKey);

  return (
    <Page
      size={{ width: SLIDES_PDF_PAGE_W, height: SLIDES_PDF_PAGE_H }}
      wrap={false}
      style={{
        backgroundColor: t.bg,
        paddingLeft: PAD_X,
        paddingRight: PAD_X,
        paddingTop: PAD_TOP,
        paddingBottom: PAD_BOTTOM,
        flexDirection: "column",
      }}
    >
      {/* header */}
      <View
        style={{
          height: HEADER_H,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        {globalStyle.showTag ? (
          <Text
            style={{
              fontFamily: FONT_MONO,
              fontSize: 26,
              color: t.text,
              opacity: 0.3,
              letterSpacing: 1.6,
              textTransform: "uppercase",
            }}
          >
            eyay.studio
          </Text>
        ) : (
          <View />
        )}
        {globalStyle.showNum ? (
          <Text
            style={{
              fontFamily: FONT_MONO,
              fontSize: 26,
              color: t.text,
              opacity: 0.22,
            }}
          >
            {pad2(slideIndex + 1)} / {pad2(totalSlides)}
          </Text>
        ) : (
          <View />
        )}
      </View>

      {/* body — fixed height, content aligned via justifyContent */}
      <View
        style={{
          height: BODY_H,
          justifyContent: bodyJustify,
          overflow: "hidden",
        }}
      >
        <View style={{ width: INNER_W }}>{children}</View>
      </View>

      {/* footer */}
      <View
        style={{
          height: FOOTER_H,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Text
          style={{
            fontFamily: FONT_MONO,
            fontSize: 22,
            color: t.muted,
            opacity: 0.36,
            letterSpacing: 1.2,
          }}
        >
          {slide.cta || ""}
        </Text>
      </View>
    </Page>
  );
}

function renderSlideInner(
  slide: SlidesSlide,
  globalStyle: GlobalStyle,
): { node: ReactNode; bodyJustify?: "center" | "flex-start" | "flex-end" } {
  const t = themeOf((slide.theme ?? "dark") as ThemeKey);
  const fs = hlSize(globalStyle);
  const sub = Math.min(Math.round(fs * 0.72), 140);
  const bodyFs = Math.round(19 * (SLIDES_PDF_PAGE_W / 1080));
  const listFs = Math.round(21 * (SLIDES_PDF_PAGE_W / 1080));
  const ta =
    slide.align === "center"
      ? "center"
      : slide.align === "right"
        ? "right"
        : "left";

  const eyebrow = (marginBottom = 18) =>
    slide.eyebrow ? (
      <Text
        style={{
          fontFamily: FONT_MONO,
          fontSize: 26,
          color: t.muted,
          letterSpacing: 2,
          textTransform: "uppercase",
          opacity: 0.85,
          marginBottom,
          textAlign: ta,
        }}
      >
        {slide.eyebrow}
      </Text>
    ) : null;

  const bar = (marginBottom = 28) => (
    <View
      style={{
        width: 72,
        height: 5,
        backgroundColor: t.accent,
        marginBottom,
        alignSelf:
          slide.align === "center"
            ? "center"
            : slide.align === "right"
              ? "flex-end"
              : "flex-start",
      }}
    />
  );

  switch (slide.layout) {
    case "title":
      return {
        node: (
          <>
            {eyebrow()}
            {bar()}
            <Multiline
              text={slide.headline}
              style={{
                fontFamily: FONT_SANS,
                fontWeight: 600,
                fontSize: fs,
                color: t.text,
                lineHeight: 1.05,
                letterSpacing: -1.2,
                textAlign: ta,
              }}
            />
            {slide.body ? (
              <View style={{ marginTop: 18 }}>
                <Multiline
                  text={slide.body}
                  style={{
                    fontFamily: FONT_SANS,
                    fontWeight: 300,
                    fontSize: bodyFs,
                    color: t.muted,
                    lineHeight: 1.55,
                    textAlign: ta,
                  }}
                />
              </View>
            ) : null}
          </>
        ),
      };
    case "content":
      return {
        node: (
          <>
            {eyebrow()}
            {bar()}
            {slide.headline ? (
              <View style={{ marginBottom: 20 }}>
                <Multiline
                  text={slide.headline}
                  style={{
                    fontFamily: FONT_SANS,
                    fontWeight: 600,
                    fontSize: sub,
                    color: t.text,
                    lineHeight: 1.12,
                    textAlign: ta,
                  }}
                />
              </View>
            ) : null}
            {slide.body ? (
              <Multiline
                text={slide.body}
                style={{
                  fontFamily: FONT_SANS,
                  fontWeight: 300,
                  fontSize: bodyFs,
                  color: t.muted,
                  lineHeight: 1.55,
                  textAlign: ta,
                }}
              />
            ) : null}
          </>
        ),
      };
    case "bullets": {
      const items = [slide.l1, slide.l2, slide.l3, slide.l4].filter(Boolean);
      return {
        node: (
          <>
            {eyebrow()}
            {bar()}
            {slide.headline ? (
              <View style={{ marginBottom: 18 }}>
                <Multiline
                  text={slide.headline}
                  style={{
                    fontFamily: FONT_SANS,
                    fontWeight: 600,
                    fontSize: Math.min(sub, 120),
                    color: t.text,
                    lineHeight: 1.12,
                    textAlign: ta,
                  }}
                />
              </View>
            ) : null}
            <View style={{ marginTop: 4 }}>
              {items.map((it, i) => (
                <View
                  key={i}
                  style={{
                    flexDirection: "row",
                    marginBottom: 14,
                    alignItems: "flex-start",
                  }}
                >
                  <View
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 5,
                      backgroundColor: t.accent,
                      marginTop: 10,
                      marginRight: 16,
                      opacity: 0.55,
                    }}
                  />
                  <Text
                    style={{
                      flex: 1,
                      fontFamily: FONT_SANS,
                      fontWeight: 300,
                      fontSize: listFs,
                      color: t.text,
                      lineHeight: 1.4,
                      opacity: 0.88,
                    }}
                  >
                    {it}
                  </Text>
                </View>
              ))}
            </View>
            {slide.body?.trim() ? (
              <View style={{ marginTop: 28 }}>
                <Multiline
                  text={slide.body}
                  style={{
                    fontFamily: FONT_SANS,
                    fontWeight: 600,
                    fontSize: Math.min(sub, 110),
                    color: t.text,
                    lineHeight: 1.1,
                    textAlign: ta,
                  }}
                />
              </View>
            ) : null}
          </>
        ),
      };
    }
    case "quote":
      return {
        node: (
          <>
            {slide.headline ? (
              <View style={{ marginBottom: 24 }}>
                <Multiline
                  text={slide.headline}
                  style={{
                    fontFamily: FONT_SANS,
                    fontWeight: 400,
                    fontStyle: "italic",
                    fontSize: Math.min(fs, 168),
                    color: t.text,
                    lineHeight: 1.15,
                    textAlign: ta,
                  }}
                />
              </View>
            ) : null}
            {slide.body ? (
              <Multiline
                text={slide.body}
                style={{
                  fontFamily: FONT_SANS,
                  fontWeight: 300,
                  fontSize: bodyFs,
                  color: t.muted,
                  lineHeight: 1.5,
                  textAlign: ta,
                }}
              />
            ) : null}
          </>
        ),
      };
    case "stat": {
      const sts = [
        slide.s1n ? { n: slide.s1n, l: slide.s1l } : null,
        slide.s2n ? { n: slide.s2n, l: slide.s2l } : null,
      ].filter(Boolean) as { n: string; l: string }[];
      const statNum = Math.round(100 * (SLIDES_PDF_PAGE_W / 1080));
      return {
        node: (
          <>
            {eyebrow()}
            {bar()}
            {slide.headline ? (
              <View style={{ marginBottom: 24 }}>
                <Multiline
                  text={slide.headline}
                  style={{
                    fontFamily: FONT_SANS,
                    fontWeight: 600,
                    fontSize: Math.min(sub, 110),
                    color: t.text,
                    lineHeight: 1.12,
                    textAlign: ta,
                  }}
                />
              </View>
            ) : null}
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 56,
                justifyContent: slide.align === "center" ? "center" : "flex-start",
              }}
            >
              {sts.map((st, i) => (
                <View key={i} style={{ minWidth: 200 }}>
                  <Text
                    style={{
                      fontFamily: FONT_SANS,
                      fontWeight: 700,
                      fontSize: statNum,
                      color: t.accent,
                      lineHeight: 1,
                    }}
                  >
                    {st.n}
                  </Text>
                  <Text
                    style={{
                      fontFamily: FONT_MONO,
                      fontSize: 20,
                      color: t.muted,
                      marginTop: 8,
                      letterSpacing: 1.2,
                      textTransform: "uppercase",
                      opacity: 0.75,
                    }}
                  >
                    {st.l}
                  </Text>
                </View>
              ))}
            </View>
          </>
        ),
      };
    }
    case "split": {
      const hasImg = Boolean(slide.splitImageDataUrl?.trim());
      return {
        bodyJustify: "center",
        node: (
          <View
            style={{
              flexDirection: "row",
              gap: 40,
              alignItems: "center",
            }}
          >
            <View style={{ width: "48%", minHeight: 280 }}>
              {hasImg ? (
                <Image
                  src={slide.splitImageDataUrl}
                  style={{
                    width: "100%",
                    height: 280,
                    objectFit: "cover",
                    borderRadius: 12,
                  }}
                />
              ) : (
                <View
                  style={{
                    height: 280,
                    borderWidth: 2,
                    borderStyle: "solid",
                    borderColor: t.stroke,
                    borderRadius: 12,
                    justifyContent: "center",
                    alignItems: "center",
                    opacity: 0.85,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: FONT_MONO,
                      fontSize: 22,
                      color: t.muted,
                      letterSpacing: 1.6,
                      textTransform: "uppercase",
                      opacity: 0.45,
                    }}
                  >
                    {slide.imageHint || "Image"}
                  </Text>
                </View>
              )}
            </View>
            <View style={{ width: "48%" }}>
              {slide.eyebrow ? (
                <Text
                  style={{
                    fontFamily: FONT_MONO,
                    fontSize: 26,
                    color: t.muted,
                    marginBottom: 14,
                    textAlign: ta,
                  }}
                >
                  {slide.eyebrow}
                </Text>
              ) : null}
              {slide.headline ? (
                <View style={{ marginBottom: 14 }}>
                  <Multiline
                    text={slide.headline}
                    style={{
                      fontFamily: FONT_SANS,
                      fontWeight: 600,
                      fontSize: sub,
                      color: t.text,
                      lineHeight: 1.12,
                      textAlign: ta,
                    }}
                  />
                </View>
              ) : null}
              {slide.body ? (
                <Multiline
                  text={slide.body}
                  style={{
                    fontFamily: FONT_SANS,
                    fontWeight: 300,
                    fontSize: bodyFs,
                    color: t.muted,
                    lineHeight: 1.5,
                    textAlign: ta,
                  }}
                />
              ) : null}
            </View>
          </View>
        ),
      };
    }
    case "terminal": {
      const line = slide.term || "where ideas get built today";
      const prompt = slide.termPrompt || "eyay";
      const termFs = Math.round(26 * (SLIDES_PDF_PAGE_W / 1080));
      return {
        node: (
          <>
            {eyebrow(14)}
            <View
              style={{
                backgroundColor: t.term,
                paddingTop: 28,
                paddingBottom: 28,
                paddingLeft: 34,
                paddingRight: 34,
                borderRadius: 14,
              }}
            >
              <Text
                style={{
                  fontFamily: FONT_MONO,
                  fontSize: termFs,
                  color: t.termT,
                  lineHeight: 1.75,
                }}
              >
                <Text style={{ color: t.accent }}>{">"} {prompt}: </Text>
                {parseMdPdf(
                  line,
                  { fontFamily: FONT_MONO, fontSize: termFs, color: t.termT },
                  t.accent,
                )}
              </Text>
            </View>
          </>
        ),
      };
    }
    case "chat": {
      const bubbles = getChatBubbleList(slidesSlideToCarouselSlide(slide));
      const bFs = Math.round(28 * (SLIDES_PDF_PAGE_W / 1080) * 0.82);
      return {
        bodyJustify: "flex-end",
        node: (
          <>
            {eyebrow(14)}
            <View style={{ gap: 16 }}>
              {bubbles.map((b) => (
                <View
                  key={b.key}
                  style={{
                    alignSelf: b.d === "out" ? "flex-end" : "flex-start",
                    maxWidth: "72%",
                  }}
                >
                  <Text
                    style={{
                      fontFamily: FONT_MONO,
                      fontSize: 16,
                      color: t.muted,
                      marginBottom: 4,
                      opacity: 0.75,
                    }}
                  >
                    {b.nm}
                  </Text>
                  <View
                    style={{
                      backgroundColor: b.d === "in" ? t.bIn : t.bOut,
                      paddingTop: 16,
                      paddingBottom: 16,
                      paddingLeft: 22,
                      paddingRight: 22,
                      borderRadius: 20,
                    }}
                  >
                    <Multiline
                      text={b.txt}
                      style={{
                        fontFamily: FONT_SANS,
                        fontSize: bFs,
                        color: b.d === "in" ? t.bInT : t.bOutT,
                        lineHeight: 1.35,
                      }}
                    />
                  </View>
                  <Text
                    style={{
                      fontFamily: FONT_MONO,
                      fontSize: 14,
                      color: t.muted,
                      marginTop: 4,
                      opacity: 0.4,
                      textAlign: b.d === "out" ? "right" : "left",
                    }}
                  >
                    {b.time}
                  </Text>
                </View>
              ))}
            </View>
          </>
        ),
      };
    }
    case "cases": {
      const K = SLIDES_PDF_PAGE_W / 1080;
      const titleFs = Math.round(28 * K);
      const clientFs = Math.round(14 * K);
      const tagFs = Math.round(10 * K);
      const descFs = Math.round(14 * K);
      const resultFs = Math.round(12 * K);
      const bubbleFs = Math.round(14 * K);
      const termCaseFs = Math.round(13 * K);
      const colGap = Math.round(32 * K);
      const colW = Math.floor((INNER_W - colGap) / 2);
      const hasImg = Boolean(slide.splitImageDataUrl?.trim());
      const caseBubbles = getChatBubbleList(slidesSlideToCarouselSlide(slide));
      const caseTermLine = slide.term || "";
      const casePrompt = slide.termPrompt || "eyay";
      return {
        bodyJustify: "flex-start",
        node: (
          <>
            {/* title row */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "baseline",
                gap: Math.round(14 * K),
                marginBottom: Math.round(4 * K),
              }}
            >
              <Text
                style={{
                  fontFamily: FONT_SANS,
                  fontWeight: 700,
                  fontSize: titleFs,
                  color: t.text,
                  lineHeight: 1.1,
                }}
              >
                {slide.headline}
              </Text>
              {slide.caseClient ? (
                <Text
                  style={{
                    fontFamily: FONT_SANS,
                    fontWeight: 300,
                    fontSize: clientFs,
                    color: t.muted,
                  }}
                >
                  {slide.caseClient}
                </Text>
              ) : null}
            </View>
            {/* tag */}
            {slide.eyebrow ? (
              <Text
                style={{
                  fontFamily: FONT_MONO,
                  fontSize: tagFs,
                  color: t.accent,
                  letterSpacing: 1.2,
                  textTransform: "uppercase",
                  marginBottom: Math.round(14 * K),
                }}
              >
                {slide.eyebrow}
              </Text>
            ) : null}
            {/* two equal columns */}
            <View style={{ flexDirection: "row", gap: colGap }}>
              {/* LEFT: image + description + result */}
              <View style={{ width: colW, flexShrink: 0 }}>
                {hasImg ? (
                  <Image
                    src={slide.splitImageDataUrl}
                    style={{
                      width: colW,
                      height: Math.round(colW * (9 / 16)),
                      objectFit: "cover",
                      borderRadius: Math.round(10 * K),
                      marginBottom: Math.round(14 * K),
                    }}
                  />
                ) : (
                  <View
                    style={{
                      width: colW,
                      height: Math.round(colW * (9 / 16)),
                      borderWidth: 2,
                      borderStyle: "solid",
                      borderColor: t.stroke,
                      borderRadius: Math.round(10 * K),
                      justifyContent: "center",
                      alignItems: "center",
                      opacity: 0.7,
                      marginBottom: Math.round(14 * K),
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: FONT_MONO,
                        fontSize: Math.round(11 * K),
                        color: t.muted,
                        letterSpacing: 1,
                        textTransform: "uppercase",
                      }}
                    >
                      {slide.imageHint || "Visual"}
                    </Text>
                  </View>
                )}
                {slide.body ? (
                  <View style={{ marginBottom: Math.round(12 * K) }}>
                    <Multiline
                      text={slide.body}
                      style={{
                        fontFamily: FONT_SANS,
                        fontWeight: 300,
                        fontSize: descFs,
                        color: t.muted,
                        lineHeight: 1.5,
                      }}
                    />
                  </View>
                ) : null}
                {slide.caseResult ? (
                  <View
                    style={{
                      borderTopWidth: 1,
                      borderTopColor: t.stroke,
                      paddingTop: Math.round(8 * K),
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: FONT_MONO,
                        fontSize: resultFs,
                        color: t.text,
                        opacity: 0.88,
                      }}
                    >
                      {slide.caseResult}
                    </Text>
                  </View>
                ) : null}
              </View>
              {/* RIGHT: chat + terminal */}
              <View
                style={{
                  width: colW,
                  flexShrink: 0,
                  justifyContent: "flex-end",
                }}
              >
                {caseBubbles.length > 0 ? (
                  <View style={{ gap: Math.round(10 * K), marginBottom: Math.round(12 * K) }}>
                    {caseBubbles.map((b) => (
                      <View
                        key={b.key}
                        style={{
                          alignSelf: b.d === "out" ? "flex-end" : "flex-start",
                          maxWidth: "85%",
                        }}
                      >
                        <Text
                          style={{
                            fontFamily: FONT_MONO,
                            fontSize: Math.round(8 * K),
                            color: t.muted,
                            marginBottom: 2,
                            opacity: 0.7,
                          }}
                        >
                          {b.nm}
                        </Text>
                        <View
                          style={{
                            backgroundColor: b.d === "in" ? t.bIn : t.bOut,
                            paddingTop: Math.round(8 * K),
                            paddingBottom: Math.round(8 * K),
                            paddingLeft: Math.round(12 * K),
                            paddingRight: Math.round(12 * K),
                            borderRadius: Math.round(14 * K),
                          }}
                        >
                          <Multiline
                            text={b.txt}
                            style={{
                              fontFamily: FONT_SANS,
                              fontSize: bubbleFs,
                              color: b.d === "in" ? t.bInT : t.bOutT,
                              lineHeight: 1.35,
                            }}
                          />
                        </View>
                      </View>
                    ))}
                  </View>
                ) : null}
                {caseTermLine ? (
                  <View
                    style={{
                      backgroundColor: t.term,
                      paddingTop: Math.round(10 * K),
                      paddingBottom: Math.round(10 * K),
                      paddingLeft: Math.round(14 * K),
                      paddingRight: Math.round(14 * K),
                      borderRadius: Math.round(8 * K),
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: FONT_MONO,
                        fontSize: termCaseFs,
                        color: t.termT,
                        lineHeight: 1.6,
                      }}
                    >
                      <Text style={{ color: t.accent }}>{">"} {casePrompt}: </Text>
                      {parseMdPdf(
                        caseTermLine,
                        { fontFamily: FONT_MONO, fontSize: termCaseFs, color: t.termT },
                        t.accent,
                      )}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>
          </>
        ),
      };
    }
    case "financial": {
      const rows = slide.financialRows ?? [];
      const tf = Math.round(13 * (SLIDES_PDF_PAGE_W / 1080) * 0.88);
      const th = Math.round(10 * (SLIDES_PDF_PAGE_W / 1080) * 0.78);
      const foot = Math.round(10 * (SLIDES_PDF_PAGE_W / 1080) * 0.72);
      return {
        bodyJustify: "flex-start",
        node: (
          <>
            {eyebrow()}
            {bar(22)}
            {slide.headline ? (
              <View style={{ marginBottom: 18 }}>
                <Multiline
                  text={slide.headline}
                  style={{
                    fontFamily: FONT_SANS,
                    fontWeight: 600,
                    fontSize: Math.min(sub, 112),
                    color: t.text,
                    textAlign: ta,
                  }}
                />
              </View>
            ) : null}
            <View
              style={{
                borderBottomWidth: 1,
                borderBottomColor: t.stroke,
                flexDirection: "row",
                paddingBottom: 10,
                marginBottom: 4,
              }}
            >
              <Text
                style={{
                  width: "22%",
                  fontFamily: FONT_MONO,
                  fontSize: th,
                  color: t.muted,
                  letterSpacing: 1.2,
                  textTransform: "uppercase",
                }}
              >
                Label
              </Text>
              <Text
                style={{
                  width: "38%",
                  fontFamily: FONT_MONO,
                  fontSize: th,
                  color: t.muted,
                  letterSpacing: 1.2,
                  textTransform: "uppercase",
                }}
              >
                Description
              </Text>
              <Text
                style={{
                  width: "18%",
                  fontFamily: FONT_MONO,
                  fontSize: th,
                  color: t.muted,
                  textAlign: "right",
                  letterSpacing: 1.2,
                  textTransform: "uppercase",
                }}
              >
                Qty
              </Text>
              <Text
                style={{
                  width: "22%",
                  fontFamily: FONT_MONO,
                  fontSize: th,
                  color: t.muted,
                  textAlign: "right",
                  letterSpacing: 1.2,
                  textTransform: "uppercase",
                }}
              >
                Price
              </Text>
            </View>
            {rows.map((r) => (
              <View
                key={r.id}
                style={{
                  flexDirection: "row",
                  borderBottomWidth: 1,
                  borderBottomColor: t.stroke,
                  paddingTop: 12,
                  paddingBottom: 12,
                }}
              >
                <Text
                  style={{
                    width: "22%",
                    fontFamily: FONT_SANS,
                    fontWeight: 300,
                    fontSize: tf,
                    color: t.text,
                  }}
                >
                  {r.label}
                </Text>
                <Text
                  style={{
                    width: "38%",
                    fontFamily: FONT_SANS,
                    fontWeight: 300,
                    fontSize: tf,
                    color: t.muted,
                  }}
                >
                  {r.description}
                </Text>
                <Text
                  style={{
                    width: "18%",
                    fontFamily: FONT_MONO,
                    fontSize: tf - 2,
                    color: t.text,
                    textAlign: "right",
                  }}
                >
                  {r.qty}
                </Text>
                <Text
                  style={{
                    width: "22%",
                    fontFamily: FONT_MONO,
                    fontSize: tf,
                    color: t.text,
                    textAlign: "right",
                  }}
                >
                  {r.price}
                </Text>
              </View>
            ))}
            {slide.financialVatNote?.trim() ? (
              <Text
                style={{
                  fontFamily: FONT_MONO,
                  fontSize: foot,
                  color: t.muted,
                  marginTop: 14,
                  letterSpacing: 0.5,
                }}
              >
                {slide.financialVatNote}
              </Text>
            ) : null}
            {slide.financialPaymentTerms?.trim() ? (
              <Text
                style={{
                  fontFamily: FONT_MONO,
                  fontSize: foot,
                  color: t.muted,
                  marginTop: 8,
                }}
              >
                Payment terms: {slide.financialPaymentTerms}
              </Text>
            ) : null}
          </>
        ),
      };
    }
    case "team": {
      const K = SLIDES_PDF_PAGE_W / 1080;
      const p1Items = [slide.l1, slide.l2].filter(Boolean);
      const p2Items = [slide.l3, slide.l4].filter(Boolean);
      const cardW = Math.floor((INNER_W - Math.round(40 * K)) / 2);
      return {
        node: (
          <>
            {eyebrow()}
            {bar()}
            {slide.headline ? (
              <View style={{ marginBottom: 24 }}>
                <Multiline text={slide.headline} style={{ fontFamily: FONT_SANS, fontWeight: 600, fontSize: sub, color: t.text, lineHeight: 1.12, textAlign: ta }} />
              </View>
            ) : null}
            <View style={{ flexDirection: "row", gap: Math.round(40 * K) }}>
              {[{ name: slide.sn1 || "Person 1", role: slide.s1l, items: p1Items }, { name: slide.sn2 || "Person 2", role: slide.s2l, items: p2Items }].map((p, ci) => (
                <View key={ci} style={{ width: cardW, borderWidth: 1, borderColor: t.stroke, borderRadius: Math.round(12 * K), paddingTop: Math.round(24 * K), paddingBottom: Math.round(24 * K), paddingLeft: Math.round(28 * K), paddingRight: Math.round(28 * K) }}>
                  <Text style={{ fontFamily: FONT_SANS, fontWeight: 700, fontSize: Math.round(22 * K), color: t.text, marginBottom: 4 }}>{p.name}</Text>
                  {p.role ? <Text style={{ fontFamily: FONT_MONO, fontSize: Math.round(10 * K), color: t.accent, letterSpacing: 1, textTransform: "uppercase", marginBottom: Math.round(16 * K) }}>{p.role}</Text> : null}
                  {p.items.map((it, i) => (
                    <View key={i} style={{ flexDirection: "row", marginBottom: 8, alignItems: "flex-start" }}>
                      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: t.accent, marginTop: 7, marginRight: 12, opacity: 0.55 }} />
                      <Text style={{ flex: 1, fontFamily: FONT_SANS, fontWeight: 300, fontSize: Math.round(14 * K), color: t.text, lineHeight: 1.5 }}>{it}</Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
            {slide.body?.trim() ? (
              <Text style={{ fontFamily: FONT_SANS, fontWeight: 400, fontStyle: "italic", fontSize: Math.round(16 * K), color: t.muted, marginTop: Math.round(24 * K), textAlign: "center" }}>{slide.body}</Text>
            ) : null}
          </>
        ),
      };
    }
    case "pillars": {
      const K = SLIDES_PDF_PAGE_W / 1080;
      const pillars = [
        { title: slide.p1title, body: slide.p1body },
        { title: slide.p2title, body: slide.p2body },
        { title: slide.p3title, body: slide.p3body },
      ].filter((p) => p.title || p.body);
      const colW = pillars.length ? Math.floor((INNER_W - Math.round(36 * K) * (pillars.length - 1)) / pillars.length) : INNER_W;
      return {
        node: (
          <>
            {eyebrow()}
            {bar()}
            {slide.headline ? (
              <View style={{ marginBottom: 24 }}>
                <Multiline text={slide.headline} style={{ fontFamily: FONT_SANS, fontWeight: 600, fontSize: sub, color: t.text, lineHeight: 1.12, textAlign: ta }} />
              </View>
            ) : null}
            <View style={{ flexDirection: "row", gap: Math.round(36 * K) }}>
              {pillars.map((p, i) => (
                <View key={i} style={{ width: colW }}>
                  {p.title ? <Text style={{ fontFamily: FONT_SANS, fontWeight: 700, fontSize: Math.round(20 * K), color: t.text, marginBottom: 10, lineHeight: 1.2 }}>{p.title}</Text> : null}
                  {p.body ? <Multiline text={p.body} style={{ fontFamily: FONT_SANS, fontWeight: 300, fontSize: Math.round(14 * K), color: t.muted, lineHeight: 1.55 }} /> : null}
                </View>
              ))}
            </View>
          </>
        ),
      };
    }
    case "grid": {
      const K = SLIDES_PDF_PAGE_W / 1080;
      const items = slide.gridItems ?? [];
      const cols = items.length <= 3 ? items.length || 1 : Math.min(items.length, 3);
      const tileGap = Math.round(20 * K);
      const tileW = Math.floor((INNER_W - tileGap * (cols - 1)) / cols);
      return {
        bodyJustify: "flex-start",
        node: (
          <>
            {eyebrow()}
            {bar()}
            {slide.headline ? (
              <View style={{ marginBottom: 22 }}>
                <Multiline text={slide.headline} style={{ fontFamily: FONT_SANS, fontWeight: 600, fontSize: sub, color: t.text, lineHeight: 1.12, textAlign: ta }} />
              </View>
            ) : null}
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: tileGap }}>
              {items.map((it) => (
                <View key={it.id} style={{ width: tileW, borderWidth: 1, borderColor: t.stroke, borderRadius: Math.round(10 * K), paddingTop: Math.round(18 * K), paddingBottom: Math.round(18 * K), paddingLeft: Math.round(22 * K), paddingRight: Math.round(22 * K) }}>
                  <Text style={{ fontFamily: FONT_SANS, fontWeight: 700, fontSize: Math.round(16 * K), color: t.text, marginBottom: 6 }}>{it.title}</Text>
                  {it.description ? <Text style={{ fontFamily: FONT_SANS, fontWeight: 300, fontSize: Math.round(12 * K), color: t.muted, lineHeight: 1.5 }}>{it.description}</Text> : null}
                </View>
              ))}
            </View>
          </>
        ),
      };
    }
    case "comparison": {
      const K = SLIDES_PDF_PAGE_W / 1080;
      const cols = slide.compColumns ?? [];
      const rows = slide.compRows ?? [];
      const hi = slide.compHighlight ?? -1;
      const totalCols = cols.length + 1;
      const cW = Math.floor(INNER_W / totalCols);
      const hFs = Math.round(10 * K);
      const cFs = Math.round(12 * K);
      return {
        bodyJustify: "flex-start",
        node: (
          <>
            {eyebrow()}
            {bar()}
            {slide.headline ? (
              <View style={{ marginBottom: 22 }}>
                <Multiline text={slide.headline} style={{ fontFamily: FONT_SANS, fontWeight: 600, fontSize: sub, color: t.text, lineHeight: 1.12, textAlign: ta }} />
              </View>
            ) : null}
            <View style={{ borderBottomWidth: 1, borderBottomColor: t.stroke, flexDirection: "row", paddingBottom: 10, marginBottom: 4 }}>
              <View style={{ width: cW }} />
              {cols.map((c, ci) => (
                <Text key={ci} style={{ width: cW, fontFamily: FONT_MONO, fontSize: hFs, color: ci === hi ? t.accent : t.muted, fontWeight: ci === hi ? 700 : 400, letterSpacing: 1, textTransform: "uppercase" }}>{c}</Text>
              ))}
            </View>
            {rows.map((r) => (
              <View key={r.id} style={{ flexDirection: "row", borderBottomWidth: 1, borderBottomColor: t.stroke, paddingTop: 12, paddingBottom: 12 }}>
                <Text style={{ width: cW, fontFamily: FONT_MONO, fontSize: hFs, color: t.muted, letterSpacing: 0.6, textTransform: "uppercase" }}>{r.label}</Text>
                {cols.map((_, ci) => (
                  <Text key={ci} style={{ width: cW, fontFamily: FONT_SANS, fontSize: cFs, fontWeight: ci === hi ? 600 : 300, color: ci === hi ? t.text : t.muted }}>{(r.cells ?? [])[ci] ?? ""}</Text>
                ))}
              </View>
            ))}
          </>
        ),
      };
    }
    case "process": {
      const K = SLIDES_PDF_PAGE_W / 1080;
      const steps = [slide.l1, slide.l2, slide.l3, slide.l4].filter(Boolean);
      const stepW = steps.length ? Math.floor(INNER_W / steps.length) : INNER_W;
      return {
        node: (
          <>
            {eyebrow()}
            {bar()}
            {slide.headline ? (
              <View style={{ marginBottom: 28 }}>
                <Multiline text={slide.headline} style={{ fontFamily: FONT_SANS, fontWeight: 600, fontSize: sub, color: t.text, lineHeight: 1.12, textAlign: ta }} />
              </View>
            ) : null}
            <View style={{ flexDirection: "row" }}>
              {steps.map((st, i) => (
                <View key={i} style={{ width: stepW, alignItems: "center" }}>
                  <View style={{ width: Math.round(40 * K), height: Math.round(40 * K), borderRadius: Math.round(20 * K), backgroundColor: t.accent, justifyContent: "center", alignItems: "center", marginBottom: Math.round(12 * K) }}>
                    <Text style={{ fontFamily: FONT_SANS, fontWeight: 700, fontSize: Math.round(16 * K), color: t.bg }}>{String(i + 1)}</Text>
                  </View>
                  <Text style={{ fontFamily: FONT_SANS, fontWeight: 600, fontSize: Math.round(14 * K), color: t.text, lineHeight: 1.35, textAlign: "center" }}>{st}</Text>
                </View>
              ))}
            </View>
            {slide.body?.trim() ? (
              <View style={{ marginTop: 24 }}>
                <Multiline text={slide.body} style={{ fontFamily: FONT_SANS, fontWeight: 300, fontSize: Math.round(12 * K), color: t.muted, lineHeight: 1.55, textAlign: ta }} />
              </View>
            ) : null}
            {slide.financialPaymentTerms?.trim() ? (
              <Text style={{ fontFamily: FONT_MONO, fontSize: Math.round(10 * K), color: t.muted, marginTop: 12, opacity: 0.7 }}>Payment terms: {slide.financialPaymentTerms}</Text>
            ) : null}
          </>
        ),
      };
    }
    case "packages": {
      const K = SLIDES_PDF_PAGE_W / 1080;
      const cards = slide.packageCards ?? [];
      const cardGap = Math.round(20 * K);
      const cardW = cards.length ? Math.floor((INNER_W - cardGap * (cards.length - 1)) / cards.length) : INNER_W;
      return {
        bodyJustify: "flex-start",
        node: (
          <>
            {eyebrow()}
            {bar()}
            {slide.headline ? (
              <View style={{ marginBottom: 24 }}>
                <Multiline text={slide.headline} style={{ fontFamily: FONT_SANS, fontWeight: 600, fontSize: sub, color: t.text, lineHeight: 1.12, textAlign: ta }} />
              </View>
            ) : null}
            <View style={{ flexDirection: "row", gap: cardGap }}>
              {cards.map((c) => (
                <View key={c.id} style={{ width: cardW, borderWidth: c.recommended ? 2 : 1, borderColor: c.recommended ? t.accent : t.stroke, borderRadius: Math.round(12 * K), paddingTop: Math.round(24 * K), paddingBottom: Math.round(24 * K), paddingLeft: Math.round(22 * K), paddingRight: Math.round(22 * K) }}>
                  {c.recommended ? <Text style={{ fontFamily: FONT_MONO, fontSize: Math.round(8 * K), color: t.accent, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 8 }}>Recommended</Text> : null}
                  <Text style={{ fontFamily: FONT_SANS, fontWeight: 700, fontSize: Math.round(18 * K), color: t.text, marginBottom: 6 }}>{c.name}</Text>
                  {c.price ? <Text style={{ fontFamily: FONT_SANS, fontWeight: 700, fontSize: Math.round(24 * K), color: t.accent, marginBottom: 4 }}>{c.price}</Text> : null}
                  {c.duration ? <Text style={{ fontFamily: FONT_MONO, fontSize: Math.round(10 * K), color: t.muted, marginBottom: Math.round(14 * K), letterSpacing: 0.5 }}>{c.duration}</Text> : null}
                  {c.items ? <Multiline text={c.items} style={{ fontFamily: FONT_SANS, fontWeight: 300, fontSize: Math.round(12 * K), color: t.muted, lineHeight: 1.6 }} /> : null}
                </View>
              ))}
            </View>
          </>
        ),
      };
    }
    case "ending":
      return {
        node: (
          <>
            {slide.eyebrow ? (
              <Text
                style={{
                  fontFamily: FONT_MONO,
                  fontSize: 26,
                  color: t.muted,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  opacity: 0.85,
                  marginBottom: 18,
                  textAlign: "left",
                }}
              >
                {slide.eyebrow}
              </Text>
            ) : null}
            <View
              style={{
                width: 72,
                height: 5,
                backgroundColor: t.accent,
                marginBottom: 28,
                alignSelf: "flex-start",
              }}
            />
            {slide.headline ? (
              <Multiline
                text={slide.headline}
                style={{
                  fontFamily: FONT_SANS,
                  fontWeight: 600,
                  fontSize: fs,
                  color: t.text,
                  lineHeight: 1.05,
                  textAlign: "left",
                  letterSpacing: -1.2,
                }}
              />
            ) : null}
            {(() => {
              const endItems = [slide.l1, slide.l2, slide.l3, slide.l4].filter(Boolean);
              return endItems.length > 0 ? (
                <View style={{ marginTop: 22 }}>
                  {endItems.map((it, i) => (
                    <View key={i} style={{ flexDirection: "row", marginBottom: 12, alignItems: "flex-start" }}>
                      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: t.accent, marginTop: 8, marginRight: 16, opacity: 0.55 }} />
                      <Text style={{ flex: 1, fontFamily: FONT_SANS, fontWeight: 300, fontSize: listFs, color: t.text, lineHeight: 1.4, opacity: 0.88 }}>{it}</Text>
                    </View>
                  ))}
                </View>
              ) : null;
            })()}
            {slide.body ? (
              <View style={{ marginTop: 28 }}>
                <Multiline
                  text={slide.body}
                  style={{
                    fontFamily: FONT_SANS,
                    fontWeight: 300,
                    fontSize: bodyFs,
                    color: t.muted,
                    lineHeight: 1.55,
                    textAlign: "left",
                  }}
                />
              </View>
            ) : null}
          </>
        ),
      };
    case "blank":
    default:
      return { node: <View /> };
  }
}

function SlidesDeckPdfDocument({
  slides,
  globalStyle,
}: {
  slides: SlidesSlide[];
  globalStyle: GlobalStyle;
}) {
  return (
    <Document>
      {slides.map((slide, i) => {
        const { node, bodyJustify } = renderSlideInner(slide, globalStyle);
        return (
          <SlidePage
            key={slide.id}
            slide={slide}
            globalStyle={globalStyle}
            slideIndex={i}
            totalSlides={slides.length}
            bodyJustify={bodyJustify ?? "center"}
          >
            {node}
          </SlidePage>
        );
      })}
    </Document>
  );
}

/**
 * Vector/text PDF (same stack as proposal + docs text exports): `@react-pdf/renderer`, DM Sans + DM Mono.
 * One page per slide, **1920 × 1080** landscape (design px = PDF points).
 */
export async function exportSlidesDeckPdf(
  slides: SlidesSlide[],
  globalStyle: GlobalStyle,
  onProgress: (label: string, pct: number) => void,
): Promise<void> {
  if (!slides.length) return;
  registerSlidesPdfFontsOnce();
  onProgress("building PDF…", 12);
  const blob = await pdf(
    <SlidesDeckPdfDocument slides={slides} globalStyle={globalStyle} />,
  ).toBlob();
  onProgress("saving…", 92);
  downloadBlob(blob, "eyay-slides.pdf");
  onProgress("done ✓", 100);
}
