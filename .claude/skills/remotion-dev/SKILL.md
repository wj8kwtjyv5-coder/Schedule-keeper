---
name: remotion-dev
description: Develop Remotion video projects — create compositions, animate with interpolate/spring, sequence clips, and render programmatic videos using React.
---

# Remotion Development

Remotion lets you create videos programmatically with React. Every frame is a React component rendered at a specific point in time.

## Core Concepts

### Video Configuration

```tsx
import { useVideoConfig, useCurrentFrame } from "remotion";

export const MyComp = () => {
  const { width, height, fps, durationInFrames } = useVideoConfig();
  const frame = useCurrentFrame();
  // frame goes from 0 to durationInFrames - 1
};
```

### Registering Compositions

In `src/Root.tsx` (or wherever you call `registerRoot`):

```tsx
import { Composition } from "remotion";
import { MyComp } from "./MyComp";

export const RemotionRoot = () => (
  <>
    <Composition
      id="MyComp"
      component={MyComp}
      durationInFrames={150}
      fps={30}
      width={1920}
      height={1080}
      defaultProps={{}}
    />
  </>
);
```

## Animation

### `interpolate`

Maps a frame range to an output range with optional clamping and easing:

```tsx
import { interpolate, useCurrentFrame } from "remotion";

const frame = useCurrentFrame();

const opacity = interpolate(frame, [0, 30], [0, 1], {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
});
```

### `spring`

Physics-based animation — smooth, natural motion:

```tsx
import { spring, useCurrentFrame, useVideoConfig } from "remotion";

const frame = useCurrentFrame();
const { fps } = useVideoConfig();

const scale = spring({
  frame,
  fps,
  config: { damping: 10, stiffness: 100, mass: 0.5 },
  from: 0,
  to: 1,
});
```

## Layout Components

### `AbsoluteFill`

Full-frame positioned container (equivalent to `position: absolute; inset: 0`):

```tsx
import { AbsoluteFill } from "remotion";

<AbsoluteFill style={{ backgroundColor: "white" }}>
  {/* content */}
</AbsoluteFill>
```

### `Sequence`

Offsets child content in time. Children only render between `from` and `from + durationInFrames`:

```tsx
import { Sequence } from "remotion";

<Sequence from={0} durationInFrames={60}>
  <Title />
</Sequence>
<Sequence from={60} durationInFrames={90}>
  <MainContent />
</Sequence>
```

### `Series`

Stacks sequences back-to-back automatically:

```tsx
import { Series } from "remotion";

<Series>
  <Series.Sequence durationInFrames={60}><Title /></Series.Sequence>
  <Series.Sequence durationInFrames={90}><Body /></Series.Sequence>
</Series>
```

## Media

### Video

```tsx
import { Video, staticFile } from "remotion";

<Video src={staticFile("video.mp4")} startFrom={0} endAt={90} />
```

### Audio

```tsx
import { Audio, staticFile } from "remotion";

<Audio src={staticFile("music.mp3")} startFrom={0} volume={0.8} />
```

### Images

```tsx
import { Img, staticFile } from "remotion";

<Img src={staticFile("image.png")} />
```

Place all static assets in the `public/` folder and reference them with `staticFile("filename")`.

## Transitions (with `@remotion/transitions`)

```tsx
import { TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { linearTiming } from "@remotion/transitions";

<TransitionSeries>
  <TransitionSeries.Sequence durationInFrames={60}>
    <SceneA />
  </TransitionSeries.Sequence>
  <TransitionSeries.Transition
    presentation={fade()}
    timing={linearTiming({ durationInFrames: 30 })}
  />
  <TransitionSeries.Sequence durationInFrames={60}>
    <SceneB />
  </TransitionSeries.Sequence>
</TransitionSeries>
```

## Project Setup

```bash
# New project
npx create-video@latest

# Dev server (preview in browser)
npm run dev   # or: npx remotion studio

# Render a composition to file
npx remotion render <CompositionId> out/video.mp4

# Render a still
npx remotion still <CompositionId> out/frame.png --frame=0
```

## Props & `calculateMetadata`

Use `calculateMetadata` when the duration depends on dynamic data:

```tsx
import { Composition } from "remotion";

<Composition
  id="Dynamic"
  component={DynamicComp}
  calculateMetadata={async ({ props }) => ({
    durationInFrames: props.items.length * 60,
    fps: 30,
    width: 1920,
    height: 1080,
  })}
  defaultProps={{ items: [] }}
/>
```

## Best Practices

- **Keep components pure**: `useCurrentFrame` is the only time source; avoid `Date.now()` or random values — they break frame-accurate rendering.
- **Use `delayRender`/`continueRender`** for async data fetching inside compositions.
- **Prefer `spring` over raw `interpolate`** for UI motion — it looks more natural.
- **Extract constants**: define `fps`, composition `id`, and default durations as named constants, not magic numbers.
- **Type props** with TypeScript `z.infer<typeof mySchema>` using Remotion's built-in Zod integration for the Studio props editor.

```tsx
import { z } from "zod";
import { zColor } from "@remotion/zod-types";

export const mySchema = z.object({
  title: z.string().default("Hello"),
  color: zColor().default("#fff"),
});
```
