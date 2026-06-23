import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "./theme";

// The floral flourish above the wordmark on the packaging.
const Flourish: React.FC<{ color: string }> = ({ color }) => (
  <div style={{ display: "flex", gap: 6, alignItems: "center", justifyContent: "center" }}>
    <div style={{ width: 60, height: 2, background: color, opacity: 0.6 }} />
    <div style={{ color, fontSize: 34, letterSpacing: 4 }}>✺</div>
    <div style={{ width: 60, height: 2, background: color, opacity: 0.6 }} />
  </div>
);

export const Logo: React.FC<{ color?: string }> = ({ color = COLORS.cream }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const reveal = spring({ frame, fps, config: { damping: 16, stiffness: 90, mass: 0.6 } });
  const y = interpolate(reveal, [0, 1], [30, 0]);
  const letterSpacing = interpolate(reveal, [0, 1], [2, 14]);

  return (
    <div style={{ opacity: reveal, transform: `translateY(${y}px)`, textAlign: "center" }}>
      <Flourish color={color} />
      <div
        style={{
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontSize: 76,
          fontWeight: 600,
          color,
          letterSpacing,
          marginTop: 14,
          textShadow: "0 4px 24px rgba(0,0,0,0.45)",
        }}
      >
        WOOLERY FORBES
      </div>
    </div>
  );
};
