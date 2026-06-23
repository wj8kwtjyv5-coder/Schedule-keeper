import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { SPICE_COLORS } from "./theme";

type ParticlesProps = {
  count?: number;
  // 0 = full swirling vortex, 1 = settled / calm.
  settle?: number;
};

// A deterministic pseudo-random generator so every render is frame-accurate.
const rand = (seed: number) => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/**
 * Stylized spice "tornado" — swirling coloured particles that spiral inward and
 * settle. This is a motion-graphics evocation of the brief's ingredient vortex,
 * not photoreal footage.
 */
export const Particles: React.FC<ParticlesProps> = ({ count = 70, settle = 0 }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const cx = width / 2;
  const cy = height * 0.55;

  return (
    <AbsoluteFill>
      {new Array(count).fill(0).map((_, i) => {
        const seed = i + 1;
        const baseRadius = interpolate(rand(seed), [0, 1], [120, Math.min(width, height) * 0.6]);
        // Vortex contracts as it settles.
        const radius = baseRadius * (1 - 0.45 * settle);
        const speed = interpolate(rand(seed * 2), [0, 1], [0.4, 1.6]) * (1 - 0.7 * settle);
        const angle = rand(seed * 3) * Math.PI * 2 + (frame / 30) * speed * Math.PI;

        const x = cx + Math.cos(angle) * radius;
        // Particles drift downward and ease to rest as they settle.
        const drift = settle * interpolate(rand(seed * 5), [0, 1], [80, 320]);
        const y = cy + Math.sin(angle) * radius * 0.55 + drift;

        const size = interpolate(rand(seed * 7), [0, 1], [4, 14]);
        const color = SPICE_COLORS[i % SPICE_COLORS.length];
        const opacity =
          interpolate(rand(seed * 11), [0, 1], [0.35, 0.9]) * (1 - 0.35 * settle);

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: size,
              height: size,
              borderRadius: "50%",
              backgroundColor: color,
              opacity,
              filter: "blur(0.5px)",
              boxShadow: `0 0 ${size}px ${color}`,
              transform: "translate(-50%, -50%)",
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};
