import React from "react";
import { Composition } from "remotion";
import { EmdenShort, EMDEN_FRAMES, EMDEN_FRAMES_ES } from "./videos/emden/Emden";
export const Root: React.FC = () => (<>
  <Composition id="EmdenShort" component={EmdenShort} durationInFrames={EMDEN_FRAMES} fps={30} width={1080} height={1920} defaultProps={{ lang: "en" as const }} />
  <Composition id="EmdenShortES" component={EmdenShort} durationInFrames={EMDEN_FRAMES_ES} fps={30} width={1080} height={1920} defaultProps={{ lang: "es" as const }} />
</>);
