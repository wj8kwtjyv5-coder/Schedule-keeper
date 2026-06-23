import { Composition } from "remotion";
import { Commercial, TOTAL_FRAMES } from "./WooleryForbes/Commercial";
import { FPS, WIDTH, HEIGHT } from "./WooleryForbes/theme";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="Commercial"
      component={Commercial}
      durationInFrames={TOTAL_FRAMES}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
    />
  );
};
