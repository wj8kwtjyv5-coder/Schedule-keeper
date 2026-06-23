import { AbsoluteFill, Img, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Backdrop } from "./Backdrop";
import { COLORS, Product } from "./theme";

/**
 * A single product reveal: the packet springs up from the settled "table",
 * with a slow push-in and the product name sliding in beneath it.
 */
export const ProductScene: React.FC<{ product: Product }> = ({ product }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const enter = spring({ frame, fps, config: { damping: 14, stiffness: 80, mass: 0.7 } });
  const scale = interpolate(enter, [0, 1], [0.82, 1]);
  // Subtle continuous push-in across the scene.
  const pushIn = interpolate(frame, [0, durationInFrames], [1, 1.06]);
  const y = interpolate(enter, [0, 1], [80, 0]);

  const nameReveal = interpolate(frame, [10, 28], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const nameY = interpolate(nameReveal, [0, 1], [24, 0]);

  // Gentle exit fade at the tail so transitions feel clean.
  const exit = interpolate(frame, [durationInFrames - 8, durationInFrames], [1, 0.85], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill>
      <Backdrop />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div
          style={{
            transform: `translateY(${y}px) scale(${scale * pushIn})`,
            opacity: enter * exit,
            width: "78%",
            borderRadius: 28,
            overflow: "hidden",
            boxShadow: `0 30px 80px rgba(0,0,0,0.55), 0 0 60px ${product.accent}55`,
          }}
        >
          <Img src={product.image} style={{ width: "100%", display: "block" }} />
        </div>
      </AbsoluteFill>

      <AbsoluteFill
        style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 150 }}
      >
        <div style={{ opacity: nameReveal, transform: `translateY(${nameY}px)`, textAlign: "center" }}>
          <div
            style={{
              display: "inline-block",
              padding: "10px 26px",
              borderRadius: 999,
              background: `${product.accent}cc`,
              color: COLORS.cream,
              fontFamily: "Georgia, serif",
              fontSize: 46,
              fontWeight: 600,
              letterSpacing: 1,
              textShadow: "0 2px 10px rgba(0,0,0,0.4)",
            }}
          >
            {product.name}
          </div>
          <div
            style={{
              marginTop: 14,
              color: COLORS.goldLight,
              fontFamily: "Georgia, serif",
              fontStyle: "italic",
              fontSize: 30,
              textShadow: "0 2px 12px rgba(0,0,0,0.55)",
            }}
          >
            {product.tagline}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
