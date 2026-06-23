import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { COLORS } from "./theme";

/**
 * Warm sunrise backdrop: deep soil base, golden raking light from the lower
 * left, and a vignette. Evokes the brief's "volumetric early-morning light,
 * warm grade with deep reds and golds."
 */
export const Backdrop: React.FC = () => {
  const frame = useCurrentFrame();
  // Slow light sweep across the scene.
  const sweep = interpolate(frame, [0, 240], [-10, 20]);

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ backgroundColor: COLORS.soil }} />
      <AbsoluteFill
        style={{
          background: `radial-gradient(120% 90% at ${30 + sweep}% 85%, ${COLORS.gold}66 0%, ${COLORS.scotchOrange}33 25%, ${COLORS.soilLight}00 60%)`,
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(100% 100% at 50% 50%, transparent 55%, ${COLORS.soil}cc 100%)`,
        }}
      />
    </AbsoluteFill>
  );
};
