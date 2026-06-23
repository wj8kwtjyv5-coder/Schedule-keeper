# Woolery Forbes — Cinematic AI Video Prompt Pack

**The shot:** Macro on dewy red Jamaican mountain soil at sunrise → camera cranes
up and pulls back as fresh ingredients lift off the earth and orbit in a slow-motion
vortex through volumetric light → the swirl settles toward a rustic wooden table,
leaving clean negative space for the product to be added later.

**Reference grade:** Waitrose & Partners / M&S Food cinematography — macro food
"porn", slow motion, deep shadows, raking golden light, anamorphic flares,
hyper-real texture. Think MJZ / Tom Kuntz food spots, not stock b-roll.

**Format:** ~8s, single continuous move. Render both 9:16 (reel/TikTok) and 16:9
(YouTube/TV). Leave the final 1.5s on the empty table so a product can be comped
or animated in afterward (e.g. via the Remotion layer in this repo).

---

## 1. Google Veo 3 (recommended first try — best physics + native audio)

Paste as a single prompt. Veo responds well to prose + a structured tail.

```
Extreme low-angle macro shot pressed close to dark, rich, dewy red volcanic soil on
a Jamaican mountain farm at sunrise. Thin morning mist drifts low across the ground;
warm golden sunlight rakes from the left, catching individual dewdrops and floating
dust motes. Soft-focus Blue Mountain hills and banana leaves in the deep background.

The camera slowly cranes upward and pulls back. As it rises, fresh organic ingredients
lift off the earth and spiral into a graceful slow-motion tornado, orbiting the frame:
red, orange and green scotch bonnet peppers, sprigs of thyme, whole scallions, pimento
(allspice) berries, knobs of fresh ginger and turmeric root, garlic cloves, and black
peppercorns. Fine soil and spice particles swirl through warm volumetric light beams.

The vortex slows and condenses, ingredients settling gently toward a clean, empty
rustic wooden table standing in the field. The shot holds on the settling particles and
the empty tabletop, composed with open negative space in the center.

Style: photorealistic, cinematic commercial food cinematography, anamorphic lens with
subtle horizontal flares, shallow depth of field, creamy bokeh, volumetric god-rays,
fine film grain, warm color grade with deep reds, golds and earthy browns. Smooth
continuous motion: a low push-in easing into a rising crane-out. Shot on ARRI Alexa,
85mm macro then 35mm anamorphic.

Camera: low macro to high wide, crane up + dolly back, slow motion ~120fps feel.
Lighting: low golden-hour sun, strong volumetrics, deep contrast.
Audio: soft ambient morning birdsong, a low cinematic swell, gentle whoosh as
ingredients lift. No music vocals, no narration.
Duration: 8 seconds.
Negative: text, logos, watermarks, hands, people, packaging, plastic, cartoon,
oversaturation, warped vegetables, extra fingers, jittery motion, fast cuts.
```

Settings: 8s, 9:16 (and a 16:9 pass), highest quality, seed locked once you like a
take so you can iterate on small wording changes without losing the look.

---

## 2. OpenAI Sora

Sora likes vivid, sensory, single-paragraph description with explicit camera language.

```
A cinematic food commercial shot in slow motion. We begin in extreme macro, the lens
inches above dark red, dewy Jamaican mountain soil at sunrise — mist curling low,
golden light raking across the grain of the earth, dewdrops glittering. The camera
performs one continuous move: a slow push-in that blossoms into a rising crane as it
pulls back to reveal the wider farm, Blue Mountains and banana leaves soft behind.
As the camera lifts, fresh ingredients float up from the ground and begin a slow,
elegant orbit — scotch bonnet peppers in red, orange and green, thyme sprigs,
scallions, pimento berries, fresh ginger and turmeric, garlic, black peppercorns —
turning in a gentle tornado of spice dust and soil through shafts of volumetric light.
The swirl decelerates and settles toward a clean, empty rustic wooden table in the
field, leaving calm negative space at the center of the frame. Anamorphic lens, shallow
depth of field, warm grade of deep reds and golds, fine film grain, photoreal,
advertising quality. 8 seconds, no text, no people, no packaging.
```

---

## 3. Runway Gen-4 (great when you drive it with a start frame)

Runway is strongest image-to-video. Generate or shoot a hero macro still of the
dewy red soil first, load it as the **first frame**, then use this motion prompt:

```
Slow cinematic crane up and pull back from extreme macro on dewy red soil to a wide
farm view. Fresh ingredients — scotch bonnet peppers, thyme, scallions, ginger,
turmeric, garlic, pimento berries, peppercorns — rise and orbit in a slow-motion
spice vortex through golden volumetric light, then settle toward an empty rustic
wooden table. Anamorphic, shallow depth of field, warm grade, film grain. Smooth
continuous motion, no cuts.
```

Settings: 9:16, 10s, motion/camera strength mid-high, "cinematic" style. Use the
last frame of a clean-table take as the first frame of a follow-on clip to extend.

---

## 4. Kling 2.1 Master (excellent slow-mo + particle physics)

```
Photorealistic cinematic advert. Extreme macro on dewy red Jamaican mountain soil at
sunrise with low mist and golden raking light. Camera cranes up and dollies back in one
smooth move. Fresh ingredients lift off the earth and spiral in a slow-motion tornado —
red/orange/green scotch bonnet peppers, thyme, scallions, pimento berries, ginger,
turmeric, garlic, black peppercorns — swirling soil and spice particles through
volumetric light beams. The vortex slows and settles toward a clean empty rustic wooden
table, holding on the calm settling particles. Anamorphic lens, shallow depth of field,
warm deep-red and gold grade, fine film grain. 8s, slow motion.

Negative prompt: text, watermark, logo, people, hands, packaging, plastic, deformed
vegetables, oversaturated, low quality, blurry, fast cuts, shaky.
```

Settings: "Professional" mode, 9:16, 10s, high CFG/relevance.

---

## Director's notes (apply to any model)

- **One continuous move.** Specify "single shot, no cuts" every time — the magic is
  the unbroken low-macro-to-rising-wide move. Models drift to cutting; fight it.
- **Slow motion sells it.** Always state slow-mo / high-fps feel; it reads premium and
  hides physics glitches in the flying ingredients.
- **Volumetric light + dew + dust** are the three texture cues that push it from
  "AI" to "advert". Keep all three in the prompt.
- **Protect the ending.** End on the empty table with center negative space — that's
  where the packet goes. You can drop the product in two ways:
  1. Comp a real packshot onto the table in After Effects / DaVinci, or
  2. Use the Remotion project in this repo as the final-second layer (logo + product
     reveal + end card) over the AI footage as a `<Video>` background.
- **Generate 4–6 takes** per model and pick; lock the seed of the winner, then make
  small wording tweaks. Don't expect take one to be the hero.
- **Aspect:** render 9:16 for social and a separate 16:9 pass for YouTube/TV — don't
  crop one from the other, regenerate.
- **Extend past the model's max length** (often 5–10s) by feeding the last frame of a
  clean take as the first frame of the next clip, then editing them together.

## Where to run these

These prompts go into the model's own app/API — I can't execute them from this
session. Fastest routes: Veo 3 via Google Flow / Gemini, Sora via the OpenAI Sora app,
Runway via runwayml.com, Kling via klingai.com. If you get a clip back and want the
product reveal / logo / end card comped on top, bring it here and I'll wire it through
the Remotion layer already in `remotion-woolery-forbes/`.
