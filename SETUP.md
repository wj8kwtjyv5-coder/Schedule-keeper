# Feliz Dias — Setup

Three steps. Everything after them is automatic.

## 1. Deploy
1. vercel.com → Import Project → connect this repo
2. Add environment variable `ANTHROPIC_API_KEY` (powers the AI Coach)
3. Storage → Create KV Database → Connect (powers sync + Watch workouts)

## 2. Install on your iPhone
1. Open your Vercel URL in **Safari**
2. Share button → **Add to Home Screen** → Add

## 3. Apple Watch sync (one-time, ~2 minutes)
Open the app → **More** tab → **Apple Watch** card → **Set up**.
Pick a path in the guided sheet:

- **Widget sync (recommended)** — install the free Scriptable app, tap "Open in Scriptable" (the script imports itself), add the widget. Your Watch workouts upload every ~15 minutes and the app pulls them in automatically whenever you open it. You also get a lock-screen widget and Watch complication.
- **No extra apps** — one iOS Shortcuts automation ("When any Workout ends" → one *Get Contents of URL* action, URL copied from the app). Runs silently in the background after every workout.

Either way: workouts from **any** app that writes to Apple Health (Strava, Garmin, Nike Run Club, Apple Fitness+) appear as completed sessions with duration, calories and heart rate — no taps, ever.

---

## Power-ups (optional)

### Back Tap "Mark Done"
Shortcuts → new shortcut → *Get Contents of URL* → `https://YOUR-APP.vercel.app/api/sync?action=completeNext` (POST). Then Settings → Accessibility → Touch → Back Tap → Double Tap → select it. Double-tap the back of your phone to tick off your next task — even from the lock screen.

### Watch complication
If you set up the Scriptable widget: iPhone Watch app → Complications → Scriptable → choose *ScheduleKeeper* → set Parameter to your app URL. Circular (progress + level), Rectangular (next task), or Inline styles.

### Morning health data (HRV / resting HR / sleep)
Shortcuts → personal automation at wake time → Health actions (Get HRV, Resting HR, Sleep) → *Open URL*:
`https://YOUR-APP.vercel.app/?hk=1&date=DATE&hrv=HRV&rhr=RHR&sleep=BED-WAKE&sq=QUALITY`

---

## Security note
The sync endpoints are unauthenticated by default (personal-use design). To lock down writes, set a `SK_TOKEN` environment variable in Vercel and append `&k=YOUR_TOKEN` to the workout sync URL.

## How sync works
- App state (tasks, habits, XP) syncs to Vercel KV on every change; widgets read the same endpoint
- Watch workouts: widget/automation → `/api/workout` (KV) → app auto-pulls on open/foreground, dedupes by workout start time
- Everything works offline; changes sync when you're back online
