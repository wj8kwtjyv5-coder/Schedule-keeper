import { AbsoluteFill, Audio, staticFile } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { IntroScene } from "./IntroScene";
import { ProductScene } from "./ProductScene";
import { EndCard } from "./EndCard";
import { PRODUCTS } from "./theme";

// Scene timing (frames). Exported so the composition duration stays in sync.
export const TIMING = {
  intro: 72,
  product: 38,
  end: 66,
  transition: 15,
};

const SEQUENCE_COUNT = 2 + PRODUCTS.length; // intro + products + end
const TRANSITION_COUNT = SEQUENCE_COUNT - 1;

export const TOTAL_FRAMES =
  TIMING.intro +
  PRODUCTS.length * TIMING.product +
  TIMING.end -
  TRANSITION_COUNT * TIMING.transition;

// Optional soundtrack — drop an mp3 at public/music.mp3 to enable it.
const HAS_MUSIC = false;

export const Commercial: React.FC = () => {
  const t = linearTiming({ durationInFrames: TIMING.transition });
  const fadeTransition = (key: string) => (
    <TransitionSeries.Transition key={key} presentation={fade()} timing={t} />
  );

  return (
    <AbsoluteFill style={{ backgroundColor: "#2b1608" }}>
      {HAS_MUSIC && <Audio src={staticFile("music.mp3")} volume={0.7} />}
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={TIMING.intro}>
          <IntroScene durationInFrames={TIMING.intro} />
        </TransitionSeries.Sequence>

        {PRODUCTS.flatMap((product) => [
          fadeTransition(`t-${product.id}`),
          <TransitionSeries.Sequence key={product.id} durationInFrames={TIMING.product}>
            <ProductScene product={product} />
          </TransitionSeries.Sequence>,
        ])}

        {fadeTransition("t-end")}
        <TransitionSeries.Sequence durationInFrames={TIMING.end}>
          <EndCard />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
