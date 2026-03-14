# ScheduleKeeper v2 — Setup Guide

## Step 1: Deploy to Netlify
1. Connect your GitHub repo to Netlify (or drag the folder to netlify.com/drop)
   ⚠️  For the lock screen widget sync to work, use Git-connected deploy (not drag-and-drop)
   because the sync API uses Netlify Blobs which requires a connected project.
2. Your app URL will be something like: https://your-name.netlify.app

## Step 2: Install as iPhone Home Screen App
1. Open your Netlify URL in Safari (must be Safari, not Chrome)
2. Tap the Share button (box with arrow pointing up)
3. Scroll down → "Add to Home Screen"
4. Tap "Add"
5. The app icon appears on your home screen — tap it to open full-screen

## Step 3: Lock Screen Widget (Scriptable)
1. Download **Scriptable** from the App Store (free)
2. Open Scriptable → tap the + button to create a new script
3. Paste the entire contents of `widget.js` into the script
4. Name it "ScheduleKeeper"
5. Add the widget to your lock screen:
   - Long-press your lock screen → Customise
   - Tap "Add widgets" below the time
   - Find Scriptable → choose Rectangular (shows tasks) or Circular (shows progress)
6. Long-press the widget → Edit widget
7. Set **Script** = ScheduleKeeper
8. Set **Parameter** = https://your-name.netlify.app
9. Done! The widget refreshes automatically.

## Step 4: Back Tap "Mark Done" (No unlock needed!)
This lets you double-tap the back of your iPhone to mark your next task complete.

1. Open the **Shortcuts** app
2. Tap + to create a new shortcut
3. Add action: "Get contents of URL"
   - URL: https://your-name.netlify.app/.netlify/functions/sync?action=completeNext
   - Method: POST
4. Add action: "Show notification" with text: "Task marked done ✅"
5. Name it "Mark Task Done"
6. Go to Settings → Accessibility → Touch → Back Tap
7. Choose Double Tap → select "Mark Task Done"

Now double-tap the back of your iPhone from ANY screen (even lock screen!) to tick off your next task.

## Step 5: Lock Screen Shortcut Buttons (iPhone 14+)
You can add 2 extra shortcut buttons to the lock screen:

1. Long-press lock screen → Customise → Lock Screen
2. Tap the bottom-left or bottom-right icon area
3. Choose "Shortcuts" → select "Mark Task Done"
4. Second button: create another Shortcut that opens your app URL

## How Sync Works
- Every time you tick a task or habit in the app, it syncs to Netlify Blobs
- The Scriptable widget reads from the same Netlify endpoint
- Widget refreshes every time you tap/view it + every ~15 minutes automatically
- Works offline too — changes sync when you're back online

## Tip: Coach → Lock Screen shortcut
You can create a Shortcut that POSTs a specific message to Coach:
- URL: https://your-name.netlify.app/.netlify/functions/sync
- This lets you trigger pre-set commands from the lock screen
