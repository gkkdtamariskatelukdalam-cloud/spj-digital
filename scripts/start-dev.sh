#!/bin/bash
# Stable dev server startup script for SPJ Digital
#
# CRITICAL: Uses `setsid -f` to launch the dev server as a true daemon
# (PPID=1, own session, own process group). Without this, the dev server
# dies ~30s after the launching shell exits — and when it dies, Caddy
# gateway shows its built-in Z.ai logo loading page (NOT our app).
#
# Other stability fixes:
#   1. --webpack (not Turbopack) — Turbopack crashes silently in sandbox
#   2. -H 0.0.0.0 — bind all interfaces so Caddy gateway (port 81) can proxy
#   3. DATABASE_URL=Neon Postgres (not local SQLite — schema is postgresql)
#   4. NODE_OPTIONS=--max-old-space-size=2048 — limit heap to avoid OOM
#
# Usage:
#   bash scripts/start-dev.sh          # launch dev server as daemon
#   bash scripts/start-dev.sh stop     # stop running dev server
#   bash scripts/start-dev.sh status   # check if running

LOG_FILE="/tmp/spj-dev-server.log"

unset DATABASE_URL
export DATABASE_URL="postgresql://neondb_owner:npg_g56mCYBfMkED@ep-delicate-unit-b3u8h0ah-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
export NEXTAUTH_URL="http://localhost:3000"
export NEXTAUTH_SECRET="yqaGBBzXZPBc1zMXRRwrYeI04F7bTIJf7Dgzd1vXWuw="
export NODE_OPTIONS="--max-old-space-size=2048"

cd /home/z/my-project

case "${1:-start}" in
  stop)
    echo "Stopping dev server..."
    pkill -9 -f "next-server" 2>/dev/null
    pkill -9 -f "next dev" 2>/dev/null
    sleep 2
    if pgrep -f "next-server" > /dev/null; then
      echo "Failed to stop"
    else
      echo "Dev server stopped"
    fi
    ;;

  status)
    if pgrep -f "next-server" > /dev/null; then
      PID=$(pgrep -f "next-server" | head -1)
      echo "Dev server RUNNING (PID $PID)"
      # Check if port 3000 is listening
      if ss -tlnp 2>/dev/null | grep -q ":3000"; then
        echo "Port 3000: LISTENING"
      else
        echo "Port 3000: NOT listening"
      fi
    else
      echo "Dev server NOT running"
    fi
    ;;

  start|"")
    # Stop any existing instance first
    pkill -9 -f "next-server" 2>/dev/null
    pkill -9 -f "next dev" 2>/dev/null
    sleep 2

    # Launch dev server as a TRUE DAEMON via setsid -f:
    #   - setsid creates a new session (own SID, own PGID)
    #   - -f forks the child and exits setsid immediately
    #   - The child's PPID becomes 1 (init/tini), so it survives the
    #     parent shell exit (sandbox orchestrator cleanup only kills
    #     processes in the bash's own process group/session)
    #   - stdin from /dev/null, stdout/stderr to log file
    setsid -f bash -c "
      exec ./node_modules/.bin/next dev -H 0.0.0.0 -p 3000 --webpack
    " < /dev/null > "$LOG_FILE" 2>&1

    echo "Dev server launched as daemon. Logs: $LOG_FILE"
    echo "Waiting for compile (15-20s)..."
    sleep 15

    if pgrep -f "next-server" > /dev/null; then
      PID=$(pgrep -f "next-server" | head -1)
      echo "✓ Dev server running (PID $PID, parent PID $(ps -o ppid= -p $PID | tr -d ' '))"
      echo "✓ Access via: http://localhost:3000 (direct) or http://localhost:81 (Caddy gateway / Preview Panel)"
    else
      echo "✗ Dev server failed to start. Check logs: $LOG_FILE"
      tail -20 "$LOG_FILE" 2>/dev/null
      exit 1
    fi
    ;;

  *)
    echo "Usage: $0 {start|stop|status}"
    exit 1
    ;;
esac
