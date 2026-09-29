#!/bin/bash
# SPJ Digital Dev Server Watchdog
# Checks every 30s if the dev server is alive. If dead, restarts it.
# Runs in background via setsid -f (survives shell exit).

LOG="/tmp/spj-watchdog.log"
START_SCRIPT="/home/z/my-project/scripts/start-dev.sh"

while true; do
  if ! pgrep -f "next-server" > /dev/null 2>&1; then
    echo "$(date): Server DEAD — restarting..." >> "$LOG"
    bash "$START_SCRIPT" >> "$LOG" 2>&1
    sleep 15
  fi
  sleep 30
done
