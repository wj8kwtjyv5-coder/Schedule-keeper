# Woolery Forbes — Remotion Commercial

A ~8-second vertical (1080×1920) product commercial for the **Woolery Forbes**
Jamaican spice range, built with [Remotion](https://www.remotion.dev/).

## What it does

The piece follows the creative brief as **stylized motion graphics**:

1. **Intro** — a swirling spice-particle "vortex" settles over a warm
   sunrise-soil backdrop while the brand mark rises into frame.
2. **Product reveals** — each packet (Jerk, Curry, All Purpose, Chicken,
   Seafood) springs up with a slow push-in, its name and tagline sliding in.
3. **End card** — the logo with the brand's promises (100% Natural Goodness,
   Suitable for Vegetarians, Handcrafted with Care).

## Run it

```bash
cd remotion-woolery-forbes
npm install
npm run dev      # opens Remotion Studio to preview/scrub
npm run render   # renders out/woolery-forbes.mp4
npm run still    # renders a single frame (out/frame.png)
```

## Structure

| File | Purpose |
| --- | --- |
| `src/Root.tsx` | Registers the `Commercial` composition (size, fps, duration). |
| `src/WooleryForbes/Commercial.tsx` | Sequences intro → products → end card with fade transitions. |
| `src/WooleryForbes/theme.ts` | Palette, format constants, product list. |
| `src/WooleryForbes/IntroScene.tsx` | Vortex-settles + logo reveal. |
| `src/WooleryForbes/ProductScene.tsx` | Single product reveal. |
| `src/WooleryForbes/EndCard.tsx` | Logo + brand-promise badges. |
| `src/WooleryForbes/Particles.tsx` | Deterministic swirling spice particles. |
| `src/WooleryForbes/Backdrop.tsx` | Warm sunrise gradient + vignette. |
| `public/products/*.png` | Product images. |

## Notes & next steps

- **Photoreal footage is out of scope for Remotion.** The brief's dewy-soil,
  drifting-mist, ingredient-tornado *footage* needs a generative video model
  (Sora / Veo / Runway / Kling). Generate that clip there, drop it in
  `public/` and render it as a `<Video>` background layer behind the intro to
  get the cinematic look — the product/logo/end-card layers here composite on top.
- The current product images are **Instagram screenshots** (they include the
  app UI). Swap in clean, transparent-background packshots in
  `public/products/` for a polished result.
- To add music, place an mp3 at `public/music.mp3` and set `HAS_MUSIC = true`
  in `Commercial.tsx`.
