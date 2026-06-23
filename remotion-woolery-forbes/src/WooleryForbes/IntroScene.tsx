import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Backdrop } from "./Backdrop";
import { Particles } from "./Particles";
import { Logo } from "./Logo";
import { COLORS } from "./theme";

/**
 * Opening beat: the swirling spice vortex settles while the brand mark rises —
 * the brief's "vortex slows and condenses ... ready for a product to appear,"
 * rendered as stylized motion graphics.
 */
export const IntroScene: React.FC<{ durationInFrames: number }> = ({ durationInFrames }) => {
  const frame = useCurrentFrame();

  // Vortex goes from full swirl (0) to settled (1) across the scene.
  const settle = interpolate(frame, [0, durationInFrames - 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const tagline = interpolate(frame, [20, 45], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill>
      <Backdrop />
      <Particles count={80} settle={settle} />
      <AbsoluteFill
        style={{ justifyContent: "center", alignItems: "center", flexDirection: "column" }}
      >
        <Logo />
        <div
          style={{
            opacity: tagline,
            marginTop: 26,
            color: COLORS.goldLight,
            fontFamily: "Georgia, serif",
            fontStyle: "italic",
            fontSize: 38,
            letterSpacing: 1,
            textShadow: "0 2px 16px rgba(0,0,0,0.5)",
          }}
        >
          An Authentic Jamaican Experience
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
