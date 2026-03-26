# Feliz Dias — Apple Watch App Setup

Direct sync from your Apple Watch to Feliz Dias. No Shortcuts. No middleman.

## What it does
- Reads HRV, resting HR, sleep, and workouts **directly from the Watch**
- POSTs to your Feliz Dias `/api/health` endpoint automatically at **6:30am every day**
- Shows recovery %, next session, and a manual "Sync now" button on your wrist

## Requirements
- Mac with Xcode 15+
- Apple Watch (Series 4+ recommended for HRV)
- Apple Developer account (free works for personal device)

## Setup (5 minutes)

### 1. Create the Xcode project
```
Xcode → File → New → Project
Platform: watchOS
Template: App
Product Name: FelizDias
Bundle Identifier: com.yourname.feliz-dias
```

### 2. Replace the generated files
Copy the 3 Swift files from this folder into your Xcode project:
- `FelizDiasWatchApp.swift` → replaces the generated App file
- `HealthSyncManager.swift` → new file
- `ContentView.swift` → replaces the generated ContentView

### 3. Set your app URL
Open `FelizDiasWatchApp.swift` and edit line 12:
```swift
static let apiBase = "https://YOUR-APP.vercel.app"  // ← paste your URL here
```

### 4. Add HealthKit capability
```
Xcode → select your target → Signing & Capabilities
→ + Capability → HealthKit
→ check "Clinical Health Records" is NOT checked (not needed)
```

### 5. Build & install on Watch
```
Xcode → select your Watch as destination → ▶ Build & Run
```
The app installs directly on the Watch.

### 6. Grant permissions
Open the app on your Watch once → it will prompt for HealthKit access → Allow All.

**Done.** The Watch now syncs health data to Feliz Dias every morning at 6:30am automatically.

---

## Manual sync
Open the app on your Watch → tap **"Sync now"** at any time.

## Troubleshooting
- **No data in app:** Open Health app on iPhone → check HRV/sleep data exists first
- **Sync failed:** Verify your Vercel URL in `FelizDiasWatchApp.swift` is correct
- **Background not firing:** watchOS throttles background tasks — open the app once daily to keep it active
- **Build error on HKSampleQueryDescriptor:** Requires watchOS 8+ deployment target (set in project settings)

## Data sent to API
```json
{
  "date": "2026-03-26",
  "hrv": 52.3,
  "resting_hr": 54,
  "sleep_hours": 7.8,
  "sleep_quality": "good",
  "workouts": [
    { "type": "Running", "start_time": "06:15", "duration_min": 32, "calories": 380 }
  ]
}
```
This matches the existing `/api/health` format exactly — no backend changes needed.
