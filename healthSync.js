// ScheduleKeeper — Apple Watch Health Sync
// Reads HealthKit data from iPhone (synced from Apple Watch) and POSTs to ScheduleKeeper.
//
// ── SETUP ────────────────────────────────────────────────────────────────────
// 1. Install Scriptable from the App Store (free)
// 2. Create a new script in Scriptable and paste this entire file
// 3. Replace SITE_URL with your Netlify URL
// 4. Run it once manually to grant HealthKit permissions
// 5. Set up automatic daily sync:
//    a. Open iOS Shortcuts app
//    b. Automation → New Automation → Time of Day (e.g. 06:00, daily)
//    c. Action: "Run Script" in Scriptable → choose "HealthSync"
//    d. Turn OFF "Ask Before Running" → Done
//    That's it. Runs silently every morning — no tapping needed.
//
// ── WHAT IT SYNCS ────────────────────────────────────────────────────────────
// • Resting heart rate (from Watch)
// • HRV — Heart Rate Variability (from Watch overnight)
// • Sleep duration & quality (from Sleep app / Watch)
// • Workouts from past 24h (type, duration, calories, avg HR)
//
// ─────────────────────────────────────────────────────────────────────────────

const SITE_URL = "https://YOUR-SITE.netlify.app"; // ← change this
const HEALTH_ENDPOINT = `${SITE_URL}/.netlify/functions/health`;

// ── Helpers ───────────────────────────────────────────────────────────────────
const today = () => new Date().toISOString().slice(0, 10);
const dayAgo = (n = 1) => new Date(Date.now() - n * 86400000);

// ── Main ─────────────────────────────────────────────────────────────────────
async function run() {
  const now = new Date();
  const yesterday = dayAgo(1);
  const twoDaysAgo = dayAgo(2);

  const payload = { date: today() };

  // ── Resting Heart Rate ────────────────────────────────────────────────────
  try {
    const hrSamples = await Health.findQuantitySamples("RestingHeartRate", {
      startDate: twoDaysAgo,
      endDate: now,
    });
    if (hrSamples.length > 0) {
      // Use most recent reading
      const latest = hrSamples.sort((a, b) => b.startDate - a.startDate)[0];
      payload.resting_hr = Math.round(latest.quantity);
    }
  } catch (e) {
    console.log("Resting HR unavailable:", e.message);
  }

  // ── HRV (Heart Rate Variability - SDNN) ───────────────────────────────────
  try {
    const hrvSamples = await Health.findQuantitySamples("HeartRateVariabilitySDNN", {
      startDate: twoDaysAgo,
      endDate: now,
    });
    if (hrvSamples.length > 0) {
      const latest = hrvSamples.sort((a, b) => b.startDate - a.startDate)[0];
      payload.hrv = Math.round(latest.quantity * 1000) / 10; // convert to ms, 1dp
    }
  } catch (e) {
    console.log("HRV unavailable:", e.message);
  }

  // ── Sleep Analysis ────────────────────────────────────────────────────────
  try {
    const sleepSamples = await Health.findCategorySamples("SleepAnalysis", {
      startDate: yesterday,
      endDate: now,
    });
    // Filter for "Asleep" stages (value 1 = AsleepCore, 2 = AsleepDeep, 3 = AsleepREM, 0 = InBed)
    const asleepStages = sleepSamples.filter(s => s.value >= 1);
    if (asleepStages.length > 0) {
      const totalMs = asleepStages.reduce((sum, s) => {
        return sum + (s.endDate.getTime() - s.startDate.getTime());
      }, 0);
      const hours = Math.round((totalMs / 3600000) * 10) / 10;
      payload.sleep_hours = hours;
      payload.sleep_quality = hours >= 7.5 ? "good" : hours >= 6 ? "ok" : "poor";
    }
  } catch (e) {
    console.log("Sleep unavailable:", e.message);
  }

  // ── Workouts ──────────────────────────────────────────────────────────────
  try {
    const workouts = await Health.findWorkouts({
      startDate: yesterday,
      endDate: now,
    });
    payload.workouts = workouts.map(w => {
      const durationMin = Math.round(w.duration / 60);
      const calories = w.totalEnergyBurned ? Math.round(w.totalEnergyBurned) : null;
      const startHour = String(w.startDate.getHours()).padStart(2, "0");
      const startMin = String(w.startDate.getMinutes()).padStart(2, "0");
      return {
        type: w.workoutActivityType,
        start_time: `${startHour}:${startMin}`,
        duration_min: durationMin,
        calories,
        avg_hr: null, // populated below if available
        max_hr: null,
      };
    });

    // Try to get heart rate for each workout window
    for (let i = 0; i < payload.workouts.length; i++) {
      const w = workouts[i];
      try {
        const hrDuring = await Health.findQuantitySamples("HeartRate", {
          startDate: w.startDate,
          endDate: w.endDate,
        });
        if (hrDuring.length > 0) {
          const hrs = hrDuring.map(s => s.quantity);
          payload.workouts[i].avg_hr = Math.round(hrs.reduce((a, b) => a + b, 0) / hrs.length);
          payload.workouts[i].max_hr = Math.round(Math.max(...hrs));
        }
      } catch {}
    }
  } catch (e) {
    console.log("Workouts unavailable:", e.message);
    payload.workouts = [];
  }

  // ── Send to ScheduleKeeper ─────────────────────────────────────────────────
  const req = new Request(HEALTH_ENDPOINT);
  req.method = "POST";
  req.headers = { "Content-Type": "application/json" };
  req.body = JSON.stringify(payload);

  try {
    const res = await req.loadJSON();
    if (res.ok) {
      const readiness = res.readiness ?? "—";
      const notify = new Notification();
      notify.title = "ScheduleKeeper";
      notify.body = `Health synced ✅  Readiness: ${readiness}%  HR: ${payload.resting_hr ?? "—"}bpm  HRV: ${payload.hrv ?? "—"}ms`;
      notify.schedule();
    }
  } catch (e) {
    // Silently fail — don't interrupt user's morning
    console.log("Sync failed:", e.message);
  }
}

await run();
