# ScheduleKeeper — Claude Code Memory

This project uses the **claude-mem** persistent memory plugin via OpenClaw.

## Setup

The claude-mem worker runs on `http://127.0.0.1:37777` and is configured in `~/.claude/settings.json`.

To check worker status:
```bash
curl http://127.0.0.1:37777/api/health
```

## Plugin Details

- Plugin: claude-mem v10.6.2
- Provider: Claude Max Plan (CLI authentication)
- Settings: `~/.claude-mem/settings.json`
- Logs: `~/.claude-mem/logs/`
