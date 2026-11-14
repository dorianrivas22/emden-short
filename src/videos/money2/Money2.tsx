// "The Money Stove" v2 (Germany 1923) on the kit engine, built to research/GUIA_NUMERICA_20.md:
// living camera, dense lit sets, channel-style characters, captions 1-2 words at ~67 % height.
import React, { useEffect } from "react";
import { AbsoluteFill, staticFile, useCurrentFrame, continueRender, delayRender } from "remotion";
import { StageView } from "../kit/Stage";
import { World, layersAt, flashAt, WORDS, FPS, FRAMES, VOICE_END } from "./shots";

export const MONEY2_FRAMES = FRAMES;
const make = () => new World();

type W = { w: string; s: number; e: number };
const chunksOf = (words: W[]) => {
  const out: { text: string; s: number }[] = []; let cur: W[] = [];
  const push = () => { if (cur.length) out.push({ text: cur.map((w) => w.w).join(" "), s: cur[0].s }); cur = []; };
  for (const w of words) {
    cur.push(w);
    const short = w.w.replace(/[^A-Za-z]/g, "").length <= 3;
    if (/[.,!?]$/.test(w.w) || cur.length >= 2 || (!short && cur.length === 1 && w.w.length > 7)) push();
  }
  push(); return out;
};
const CHUNKS = chunksOf(WORDS);
const Captions: React.FC<{ t: number }> = ({ t }) => {
  let c = -1; for (let k = 0; k < CHUNKS.length; k++) if (CHUNKS[k].s - 0.03 <= t) c = k;
  if (c < 0 || t > VOICE_END + 0.25) return null;
  const pop = Math.min(1, (t - CHUNKS[c].s + 0.03) / 0.07);
  return (
    <div style={{ position: "absolute", left: 40, right: 40, top: 1920 * 0.66, textAlign: "center", fontFamily: "CapFont", fontSize: 80, color: "#fff",
      WebkitTextStroke: "11px #111", paintOrder: "stroke fill", textShadow: "0 6px 12px rgba(0,0,0,0.4)", transform: `scale(${0.9 + 0.1 * pop})`, letterSpacing: 0.5 }}>
      {CHUNKS[c].text}
    </div>
  );
};

export const Money2Short: React.FC = () => {
  const f = useCurrentFrame(), t = f / FPS;
  useEffect(() => {
    const h = delayRender("font");
    const ff = new FontFace("CapFont", `url(${staticFile("Inter-Black.otf")})`);
    ff.load().then((x) => { document.fonts.add(x); continueRender(h); }).catch(() => continueRender(h));
  }, []);
  const white = flashAt(f);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {layersAt(f).map((l, k) => <StageView key={k ? "over" : "base"} make={make} i={l.i} t={t} frame={f} alpha={l.alpha} />)}
      {white > 0 && <AbsoluteFill style={{ background: "#fff", opacity: white }} />}
      <Captions t={t} />
    </AbsoluteFill>
  );
};
