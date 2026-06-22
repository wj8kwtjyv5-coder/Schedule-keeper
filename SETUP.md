# ScheduleKeeper v3 — Setup Guide

## Step 1: Deploy to Vercel
1. Connect your GitHub repo to Vercel (vercel.com → Import Project)
2. Add environment variable: `ANTHROPIC_API_KEY` (for the AI Coach)
3. Your app URL will be something like: https://your-name.vercel.app

## Step 2: Install as iPhone Home Screen App
1. Open your Vercel URL in Safari (must be Safari, not Chrome)
2. Tap the Share button (box with arrow pointing up)
3. Scroll down → "Add to Home Screen"
4. Tap "Add"
5. The app icon appears on your home screen — tap it to open full-screen

## Step 3 (Simplest): Workout Auto-Sync via iOS Shortcuts
No extra apps needed — uses iOS Shortcuts built-in to your iPhone.

1. In the app, go to Settings → "iPhone & Apple Watch" → tap **Import Shortcut**
2. Add the shortcut to the Shortcuts app when prompted
3. iOS will run it automatically after every Apple Watch workout ends
4. Workouts appear as completed tasks in your Today view immediately

This works with ALL workout apps that write to Apple Health (Strava, Garmin, Nike Run Club, Apple Fitness+, etc.).

## Step 4: Lock Screen Widget (Scriptable)
1. Download **Scriptable** from the App Store (free)
2. In the app, go to Settings → "iPhone & Apple Watch" → tap **Open in Scriptable**
3. Scriptable opens with the widget script pre-loaded — tap the save button
4. Add the widget to your lock screen:
   - Long-press your lock screen → Customise
   - Tap "Add widgets" below the time
   - Find Scriptable → choose Rectangular (shows tasks) or Circular (shows progress)
5. Long-press the widget → Edit widget
6. Set **Script** = ScheduleKeeper
7. Set **Parameter** = https://your-name.vercel.app
8. Done! The widget refreshes automatically.

Alternatively, you can add the script manually:
- Open Scriptable → tap the + button → paste the entire contents of `widget.js` → name it "ScheduleKeeper"

## Step 4b: Apple Watch Complication (Scriptable — no Shortcuts app needed)
Scriptable natively supports Apple Watch complications — the same script runs on Watch.

1. Make sure Scriptable is installed on your iPhone (Step 4 above)
2. The "ScheduleKeeper" script with the `widget.js` code must be set up (Step 4)
3. On your iPhone, open the **Watch** app
4. Tap **My Watch** → **Complications**
5. Choose a complication slot (e.g. top or bottom of watch face)
6. Find **Scriptable** in the list
7. Tap the Scriptable complication → select **ScheduleKeeper** script
8. Choose your preferred complication style:
   - **Circular** — shows done/total tasks + XP level number
   - **Rectangular** — shows next task title and time
   - **Inline** — slim top-row text: `⚡ 2/5 · Lv3`
9. Set **Parameter** = https://your-name.vercel.app
10. The complication appears on your Watch face and refreshes automatically

**Tap the Watch complication** to open ScheduleKeeper directly on your Watch (via iPhone).

No iPhone Shortcuts app needed — Scriptable handles everything.

## Step 5: Back Tap "Mark Done" (No unlock needed!)
This lets you double-tap the back of your iPhone to mark your next task complete.

1. Open the **Shortcuts** app
2. Tap + to create a new shortcut
3. Add action: "Get contents of URL"
   - URL: https://your-name.vercel.app/api/sync?action=completeNext
   - Method: POST
4. Add action: "Show notification" with text: "Task marked done ✅"
5. Name it "Mark Task Done"
6. Go to Settings → Accessibility → Touch → Back Tap
7. Choose Double Tap → select "Mark Task Done"

Now double-tap the back of your iPhone from ANY screen (even lock screen!) to tick off your next task.

## Step 6: Lock Screen Shortcut Buttons (iPhone 14+)
You can add 2 extra shortcut buttons to the lock screen:

1. Long-press lock screen → Customise → Lock Screen
2. Tap the bottom-left or bottom-right icon area
3. Choose "Shortcuts" → select "Mark Task Done"
4. Second button: create another Shortcut that opens your app URL

## How Sync Works
- Every time you tick a task or habit in the app, it syncs to Vercel KV
- The Scriptable widget and Watch complication read from the same Vercel endpoint
- Widget refreshes every time you tap/view it + every ~15 minutes automatically
- Works offline too — changes sync when you're back online

## Tip: AI Coach
The app includes an AI Coach powered by Anthropic Claude (Marcos Llorente philosophy).
- Tap the 🤖 Coach button in the nav bar
- Use quick prompts: Match cancelled, Game tomorrow, Tired, Grounding, Cold therapy...
- The Coach works offline instantly for common scenarios
- For novel requests, it calls the Vercel `/api/coach` endpoint (requires `ANTHROPIC_API_KEY`)
