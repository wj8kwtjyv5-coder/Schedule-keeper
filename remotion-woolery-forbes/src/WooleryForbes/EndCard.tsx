import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Backdrop } from "./Backdrop";
import { Logo } from "./Logo";
import { COLORS } from "./theme";

const Badge: React.FC<{ label: string; delay: number }> = ({ label, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame: frame - delay, fps, config: { damping: 18, stiffness: 110 } });
  return (
    <div
      style={{
        opacity: enter,
        transform: `translateY(${interpolate(enter, [0, 1], [16, 0])}px)`,
        padding: "10px 22px",
        border: `1px solid ${COLORS.goldLight}88`,
        borderRadius: 999,
        color: COLORS.goldLight,
        fontFamily: "Georgia, serif",
        fontSize: 28,
        letterSpacing: 0.5,
      }}
    >
      {label}
    </div>
  );
};

export const EndCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logoIn = spring({ frame, fps, config: { damping: 16 } });

  return (
    <AbsoluteFill>
      <Backdrop />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", flexDirection: "column" }}>
        <div style={{ opacity: logoIn, transform: `scale(${interpolate(logoIn, [0, 1], [0.9, 1])})` }}>
          <Logo />
        </div>
        <div
          style={{
            display: "flex",
            gap: 14,
            flexWrap: "wrap",
            justifyContent: "center",
            maxWidth: "80%",
            marginTop: 46,
          }}
        >
          <Badge label="100% Natural Goodness" delay={12} />
          <Badge label="Suitable for Vegetarians" delay={22} />
          <Badge label="Handcrafted with Care" delay={32} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
