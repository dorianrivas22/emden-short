import React from "react";
import { Composition } from "remotion";
import { EmdenShort, EMDEN_FRAMES, EMDEN_FRAMES_ES } from "./videos/emden/Emden";
import { SewersShort, SEWERS_FRAMES } from "./videos/sewers/Sewers";
import { RatsShort, RATS_FRAMES } from "./videos/rats/Rats";
import { MoneyShort, MONEY_FRAMES } from "./videos/inflation/Money";
import { KitTest, TEST_FRAMES } from "./videos/money2/Test";
import { Money2Short, MONEY2_FRAMES } from "./videos/money2/Money2";
export const Root: React.FC = () => (<>
  <Composition id="EmdenShort" component={EmdenShort} durationInFrames={EMDEN_FRAMES} fps={30} width={1080} height={1920} defaultProps={{ lang: "en" as const }} />
  <Composition id="EmdenShortES" component={EmdenShort} durationInFrames={EMDEN_FRAMES_ES} fps={30} width={1080} height={1920} defaultProps={{ lang: "es" as const }} />
  <Composition id="SewersShort" component={SewersShort} durationInFrames={SEWERS_FRAMES.en} fps={30} width={1080} height={1920} defaultProps={{ lang: "en" as const }} />
  <Composition id="SewersShortES" component={SewersShort} durationInFrames={SEWERS_FRAMES.es} fps={30} width={1080} height={1920} defaultProps={{ lang: "es" as const }} />
  <Composition id="RatsShort" component={RatsShort} durationInFrames={RATS_FRAMES.en} fps={30} width={1080} height={1920} defaultProps={{ lang: "en" as const }} />
  <Composition id="RatsShortES" component={RatsShort} durationInFrames={RATS_FRAMES.es} fps={30} width={1080} height={1920} defaultProps={{ lang: "es" as const }} />
  <Composition id="MoneyShort" component={MoneyShort} durationInFrames={MONEY_FRAMES} fps={30} width={1080} height={1920} />
  <Composition id="KitTest" component={KitTest} durationInFrames={TEST_FRAMES} fps={30} width={1080} height={1920} />
  <Composition id="Money2Short" component={Money2Short} durationInFrames={MONEY2_FRAMES} fps={30} width={1080} height={1920} />
</>);
