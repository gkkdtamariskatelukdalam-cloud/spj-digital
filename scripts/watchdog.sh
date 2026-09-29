#!/bin/bash
# Watchdog script — keeps the dev server alive forever.
# Checks every 30 seconds if the dev server is running on port 3000.
# If not running, restarts it via scripts/start-dev.sh
#
# Usage:
#   bash scripts/watchdog.sh          # start watchdog in background
#   bash scripts/watchdog.sh stop     # stop watchdog
#   bash scripts/watchdog.sh status   # check watchdog status

WATCHDOG_PID_FILE="/tmp/spj-watchdog.pid"
DEV_LOG="/tmp/spj-dev-server.log"
PROJECT_DIR="/home/z/my-project"
CHECK_INTERVAL=30  # seconds

case "${1:-start}" in
  stop)
    if [ -f "$WATCHDOG_PID_FILE" ]; then
      PID=$(cat "$WATCHDOG_PID_FILE")
      kill "$PID" 2>/dev/null
      rm -f "$WATCHDOG_PID_FILE"
      echo "Watchdog stopped (PID $PID killed)"
    else
      echo "Watchdog not running"
    fi
    ;;

  status)
    if [ -f "$WATCHDOG_PID_FILE" ]; then
      PID=$(cat "$WATCHDOG_PID_FILE")
      if kill -0 "$PID" 2>/dev/null; then
        echo "Watchdog RUNNING (PID $PID)"
      else
        echo "Watchdog PID file exists but process dead — restarting"
        rm -f "$WATCHDOG_PID_FILE"
      fi
    else
      echo "Watchdog NOT running"
    fi
    # Also check dev server
    cd "$PROJECT_DIR"
    bash scripts/start-dev.sh status 2>/dev/null | head -2
    ;;

  start|*)
    # Check if watchdog already running
    if [ -f "$WATCHDOG_PID_FILE" ]; then
      PID=$(cat "$WATCHDOG_PID_FILE")
      if kill -0 "$PID" 2>/dev/null; then
        echo "Watchdog already running (PID $PID)"
        exit 0
      else
        rm -f "$WATCHDOG_PID_FILE"
      fi
    fi

    # Start watchdog as a detached daemon
    setsid -f bash -c '
      echo $$ > '"$WATCHDOG_PID_FILE"'
      while true; do
        # Check if port 3000 is listening
        if ! ss -tlnp 2>/dev/null | grep -q ":3000"; then
          echo "[$(date)] Dev server not running — restarting..." >> '"$DEV_LOG"'
          cd '"$PROJECT_DIR"'
          bash scripts/start-dev.sh >> '"$DEV_LOG"' 2>&1
          sleep 15  # wait for server to start
        fi
        sleep '"$CHECK_INTERVAL"'
      done
    ' 2>/dev/null

    # Verify it started
    sleep 1
    if [ -f "$WATCHDOG_PID_FILE" ]; then
      PID=$(cat "$WATCHDOG_PID_FILE")
      echo "✓ Watchdog started (PID $PID) — checks every ${CHECK_INTERVAL}s"
      echo "  If dev server dies, watchdog auto-restarts it"
    else
      echo "✗ Failed to start watchdog"
    fi
    ;;
esac
