// ─────────────────────────────────────────────────────────
//  ScheduleKeeper — Scriptable Widget
//  Version 2.0 | Supports Lock Screen + Home Screen
// ─────────────────────────────────────────────────────────
//
//  SETUP:
//  1. Install Scriptable from the App Store (free)
//  2. Paste this entire file into a new Scriptable script
//  3. Long-press your lock screen → Customise → Add widget → Scriptable
//  4. Long-press the Scriptable widget → Edit widget
//  5. Set Parameter to: https://YOUR-APP.netlify.app
//
//  WIDGET SIZES SUPPORTED:
//  • Lock screen Circular  → task progress ring
//  • Lock screen Rectangular → top 3 tasks + habit count
//  • Home screen Small     → day summary
//  • Home screen Medium    → tasks + habits grid
// ─────────────────────────────────────────────────────────

const BASE_URL = (args.widgetParameter || "").replace(/\/$/, "");
const SYNC_URL = BASE_URL ? `${BASE_URL}/.netlify/functions/sync` : null;

// ── Design tokens ──────────────────────────────────────────
const C = {
  bg:     new Color("#070b14"),
  text:   new Color("#eef2ff"),
  muted:  new Color("#5c6490"),
  accent: new Color("#fbbf24"),  // amber
  blue:   new Color("#818cf8"),  // indigo
  green:  new Color("#34d399"),  // emerald
  red:    new Color("#fb7185"),  // rose
  purple: new Color("#c084fc"),
};

const CAT_EMOJI = {
  run:"🏃", football:"⚽", game:"🏟", bike:"🚴",
  pilates:"🧘", recovery:"🌿", sauna:"🌡", work:"💼", other:"◈",
};

// ── Helpers ─────────────────────────────────────────────────
function pad2(n) { return String(n).padStart(2, "0"); }
function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;
}
function fmtTime(t) {
  if (!t) return "";
  const [h,m] = t.split(":").map(Number);
  return `${h%12||12}:${pad2(m)}${h>=12?"pm":"am"}`;
}
function truncate(s, n) {
  return s && s.length > n ? s.slice(0, n) + "…" : (s || "");
}

// ── Fetch state ─────────────────────────────────────────────
async function fetchState() {
  if (!SYNC_URL) return null;
  const req = new Request(SYNC_URL);
  req.method = "GET";
  req.timeoutInterval = 8;
  try { return await req.loadJSON(); }
  catch(e) { return null; }
}

// ── Build today's data from state ───────────────────────────
function buildToday(state) {
  if (!state) return null;
  const today = todayISO();
  const now = new Date();
  const curTime = `${pad2(now.getHours())}:${pad2(now.getMinutes())}`;

  const tasks = (state.tasks || [])
    .filter(t => t.date === today && t.category !== "work")
    .sort((a, b) => (a.time || "99:99").localeCompare(b.time || "99:99"));

  const done = tasks.filter(t => t.completed).length;
  const total = tasks.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  const nextTask = tasks.find(t => !t.completed && t.time && t.time > curTime) ||
                   tasks.find(t => !t.completed);

  const dow = now.getDay();
  const habits = (state.habits || []).filter(h => (h.days || []).includes(dow));
  const habitLogs = state.habitLogs || {};
  const habitsDone = habits.filter(h => !!habitLogs[`${h.id}_${today}`]).length;

  return { tasks, done, total, pct, nextTask, habits, habitsDone, today };
}

// ── LOCK SCREEN: Circular ────────────────────────────────────
function buildCircular(d) {
  const w = new ListWidget();
  w.backgroundColor = C.bg;
  w.setPadding(0, 0, 0, 0);
  if (BASE_URL) w.url = SYNC_URL ? `${BASE_URL}?action=completeNext` : BASE_URL;

  const stack = w.addStack();
  stack.layoutVertically();
  stack.centerAlignContent();

  if (!d) {
    const t = stack.addText("⚡");
    t.font = Font.boldSystemFont(18);
    t.textColor = C.blue;
    t.centerAlignText();
    const sub = stack.addText("Set URL");
    sub.font = Font.systemFont(8);
    sub.textColor = C.muted;
    sub.centerAlignText();
    return w;
  }

  // Emoji for primary activity
  const primary = d.nextTask?.category || (d.total > 0 ? "other" : null);
  const emoji = primary ? (CAT_EMOJI[primary] || "📌") : "✅";

  const emojiText = stack.addText(emoji);
  emojiText.font = Font.systemFont(16);
  emojiText.centerAlignText();

  stack.addSpacer(2);

  const num = stack.addText(`${d.done}/${d.total}`);
  num.font = Font.boldSystemFont(12);
  num.textColor = d.pct >= 80 ? C.green : d.pct >= 50 ? C.accent : C.blue;
  num.centerAlignText();

  if (d.habits.length > 0) {
    const hab = stack.addText(`${d.habitsDone}/${d.habits.length} 🔥`);
    hab.font = Font.systemFont(8);
    hab.textColor = C.muted;
    hab.centerAlignText();
  }

  return w;
}

// ── LOCK SCREEN: Rectangular ─────────────────────────────────
function buildRectangular(d) {
  const w = new ListWidget();
  w.backgroundColor = C.bg;
  w.setPadding(8, 10, 8, 10);
  if (BASE_URL) w.url = SYNC_URL ? `${BASE_URL}?action=completeNext` : BASE_URL;

  if (!d) {
    const t = w.addText("⚡ ScheduleKeeper");
    t.font = Font.boldSystemFont(11);
    t.textColor = C.blue;
    const s = w.addText("Set widget URL parameter →");
    s.font = Font.systemFont(9);
    s.textColor = C.muted;
    return w;
  }

  // Header row
  const header = w.addStack();
  header.layoutHorizontally();
  header.centerAlignContent();

  const title = header.addText("⚡ Today");
  title.font = Font.boldSystemFont(10);
  title.textColor = C.blue;

  header.addSpacer();

  const prog = header.addText(`${d.done}/${d.total}`);
  prog.font = Font.boldSystemFont(10);
  prog.textColor = d.pct >= 80 ? C.green : d.pct >= 50 ? C.accent : C.blue;

  w.addSpacer(4);

  // Top 3 tasks
  const show = d.tasks.slice(0, 3);
  for (const task of show) {
    const row = w.addStack();
    row.layoutHorizontally();
    row.spacing = 4;
    row.centerAlignContent();

    const chk = row.addText(task.completed ? "✓" : "·");
    chk.font = Font.boldSystemFont(9);
    chk.textColor = task.completed ? C.green : C.muted;

    const cat = row.addText(CAT_EMOJI[task.category] || "");
    cat.font = Font.systemFont(9);

    const name = row.addText(truncate(task.title, 24));
    name.font = task.completed ? Font.italicSystemFont(9) : Font.systemFont(9);
    name.textColor = task.completed ? C.muted : C.text;
    if (task.completed) name.textOpacity = 0.55;

    if (task.time && !task.completed) {
      row.addSpacer();
      const tm = row.addText(fmtTime(task.time));
      tm.font = Font.systemFont(8);
      tm.textColor = C.muted;
    }
  }

  if (d.habits.length > 0) {
    w.addSpacer(3);
    const hRow = w.addStack();
    hRow.layoutHorizontally();
    const habTxt = hRow.addText(`${d.habitsDone}/${d.habits.length} habits today`);
    habTxt.font = Font.systemFont(8);
    habTxt.textColor = d.habitsDone >= d.habits.length ? C.green :
                       d.habitsDone > 0 ? C.accent : C.muted;
  }

  return w;
}

// ── HOME SCREEN: Small ───────────────────────────────────────
function buildSmall(d) {
  const w = new ListWidget();
  w.backgroundGradient = (() => {
    const g = new LinearGradient();
    g.colors = [new Color("#070b14"), new Color("#0d1020")];
    g.locations = [0, 1];
    g.startPoint = new Point(0, 0);
    g.endPoint = new Point(1, 1);
    return g;
  })();
  w.setPadding(12, 12, 12, 12);
  if (BASE_URL) w.url = SYNC_URL ? `${BASE_URL}?action=completeNext` : BASE_URL;

  if (!d) {
    const t = w.addText("⚡\nScheduleKeeper");
    t.font = Font.boldSystemFont(13);
    t.textColor = C.blue;
    const s = w.addText("\nSet widget\nURL parameter");
    s.font = Font.systemFont(10);
    s.textColor = C.muted;
    return w;
  }

  const topRow = w.addStack();
  topRow.layoutHorizontally();
  const logo = topRow.addText("⚡");
  logo.font = Font.boldSystemFont(13);
  topRow.addSpacer();
  const pctTxt = topRow.addText(`${d.pct}%`);
  pctTxt.font = Font.boldSystemFont(13);
  pctTxt.textColor = d.pct >= 80 ? C.green : d.pct >= 50 ? C.accent : C.blue;

  w.addSpacer(6);

  const bigNum = w.addText(`${d.done}/${d.total}`);
  bigNum.font = Font.boldSystemFont(26);
  bigNum.textColor = C.text;

  const lbl = w.addText("tasks done today");
  lbl.font = Font.systemFont(10);
  lbl.textColor = C.muted;

  w.addSpacer(8);

  if (d.nextTask) {
    const next = w.addText("Next:");
    next.font = Font.boldSystemFont(9);
    next.textColor = C.muted;

    const ntitle = w.addText(truncate(d.nextTask.title, 22));
    ntitle.font = Font.boldSystemFont(11);
    ntitle.textColor = C.blue;

    if (d.nextTask.time) {
      const ntm = w.addText(fmtTime(d.nextTask.time));
      ntm.font = Font.systemFont(9);
      ntm.textColor = C.muted;
    }
  } else if (d.total > 0) {
    const done = w.addText("All done! 🎉");
    done.font = Font.boldSystemFont(12);
    done.textColor = C.green;
  }

  w.addSpacer();

  if (d.habits.length > 0) {
    const habRow = w.addStack();
    habRow.layoutHorizontally();
    const habTxt = habRow.addText(`${d.habitsDone}/${d.habits.length} habits`);
    habTxt.font = Font.systemFont(9);
    habTxt.textColor = d.habitsDone >= d.habits.length ? C.green : C.muted;
  }

  return w;
}

// ── HOME SCREEN: Medium ──────────────────────────────────────
function buildMedium(d) {
  const w = new ListWidget();
  w.backgroundGradient = (() => {
    const g = new LinearGradient();
    g.colors = [new Color("#070b14"), new Color("#0c0e1d")];
    g.locations = [0, 1];
    g.startPoint = new Point(0, 0);
    g.endPoint = new Point(1, 1);
    return g;
  })();
  w.setPadding(14, 14, 14, 14);
  if (BASE_URL) w.url = BASE_URL;  // fallback if row tap not supported

  if (!d) {
    const t = w.addText("⚡ ScheduleKeeper — Set widget URL parameter");
    t.font = Font.systemFont(11);
    t.textColor = C.muted;
    return w;
  }

  // Header
  const hdr = w.addStack();
  hdr.layoutHorizontally();
  hdr.centerAlignContent();

  const hdrTitle = hdr.addText("⚡ ScheduleKeeper");
  hdrTitle.font = Font.boldSystemFont(12);
  hdrTitle.textColor = C.blue;

  hdr.addSpacer();

  const hdrProg = hdr.addText(`${d.done}/${d.total} done · ${d.pct}%`);
  hdrProg.font = Font.boldSystemFont(11);
  hdrProg.textColor = d.pct >= 80 ? C.green : d.pct >= 50 ? C.accent : C.blue;

  w.addSpacer(10);

  // Tasks column + Habits column
  const cols = w.addStack();
  cols.layoutHorizontally();
  cols.spacing = 12;

  // Tasks (left)
  const taskCol = cols.addStack();
  taskCol.layoutVertically();
  taskCol.spacing = 4;

  const taskHdr = taskCol.addText("TASKS");
  taskHdr.font = Font.boldSystemFont(8);
  taskHdr.textColor = C.muted;

  const show = d.tasks.slice(0, 5);
  for (const task of show) {
    const row = taskCol.addStack();
    row.layoutHorizontally();
    row.spacing = 4;
    row.centerAlignContent();
    if (BASE_URL && task.id) row.url = `${BASE_URL}?action=complete&taskId=${task.id}`;

    const chk = row.addText(task.completed ? "✓ " : "○ ");
    chk.font = Font.boldSystemFont(9);
    chk.textColor = task.completed ? C.green : C.muted;

    const name = row.addText(truncate(task.title, 20));
    name.font = Font.systemFont(9);
    name.textColor = task.completed ? C.muted : C.text;
    if (task.completed) name.textOpacity = 0.5;
  }

  cols.addSpacer();

  // Habits (right)
  const habCol = cols.addStack();
  habCol.layoutVertically();
  habCol.spacing = 5;
  habCol.size = new Size(80, 0);

  const habHdr = habCol.addText("HABITS");
  habHdr.font = Font.boldSystemFont(8);
  habHdr.textColor = C.muted;

  const today = todayISO();
  const habitLogs = (d.habits.length > 0) ? {} : {};
  for (const h of d.habits.slice(0, 6)) {
    const row = habCol.addStack();
    row.layoutHorizontally();
    row.spacing = 4;
    row.centerAlignContent();
    if (BASE_URL && h.id) row.url = `${BASE_URL}?action=toggleHabit&habitId=${h.id}`;

    const chk = row.addText(h.done ? "✓" : "·");
    chk.font = Font.boldSystemFont(9);
    chk.textColor = h.done ? C.green : C.muted;

    const name = row.addText(truncate((h.emoji||"") + " " + h.title, 10));
    name.font = Font.systemFont(9);
    name.textColor = h.done ? C.muted : C.text;
    if (h.done) name.textOpacity = 0.6;
  }

  return w;
}

// ── Main ─────────────────────────────────────────────────────
const state = await fetchState();

// Annotate habits with today's done status
if (state && state.habits && state.habitLogs) {
  const today = todayISO();
  state.habits = state.habits.map(h => ({
    ...h,
    done: !!state.habitLogs[`${h.id}_${today}`]
  }));
}

const d = buildToday(state);

let widget;
switch (config.widgetFamily) {
  case "accessoryCircular":    widget = buildCircular(d);    break;
  case "accessoryRectangular": widget = buildRectangular(d); break;
  case "small":                widget = buildSmall(d);       break;
  case "medium":               widget = buildMedium(d);      break;
  default:
    // Preview mode (running in-app) — show medium
    widget = buildMedium(d);
    await widget.presentMedium();
    break;
}

if (config.runsInWidget) Script.setWidget(widget);
Script.complete();
