import React from "react";
import { Composition } from "remotion";
import { EmdenShort, EMDEN_FRAMES, EMDEN_FRAMES_ES } from "./videos/emden/Emden";
import { SewersShort, SEWERS_FRAMES } from "./videos/sewers/Sewers";
import { RatsShort, RATS_FRAMES } from "./videos/rats/Rats";
export const Root: React.FC = () => (<>
  <Composition id="EmdenShort" component={EmdenShort} durationInFrames={EMDEN_FRAMES} fps={30} width={1080} height={1920} defaultProps={{ lang: "en" as const }} />
  <Composition id="EmdenShortES" component={EmdenShort} durationInFrames={EMDEN_FRAMES_ES} fps={30} width={1080} height={1920} defaultProps={{ lang: "es" as const }} />
  <Composition id="SewersShort" component={SewersShort} durationInFrames={SEWERS_FRAMES.en} fps={30} width={1080} height={1920} defaultProps={{ lang: "en" as const }} />
  <Composition id="SewersShortES" component={SewersShort} durationInFrames={SEWERS_FRAMES.es} fps={30} width={1080} height={1920} defaultProps={{ lang: "es" as const }} />
  <Composition id="RatsShort" component={RatsShort} durationInFrames={RATS_FRAMES.en} fps={30} width={1080} height={1920} defaultProps={{ lang: "en" as const }} />
  <Composition id="RatsShortES" component={RatsShort} durationInFrames={RATS_FRAMES.es} fps={30} width={1080} height={1920} defaultProps={{ lang: "es" as const }} />
</>);
