#!/bin/bash
# Stable dev server startup script for SPJ Digital
# Fixes:
#   1. Uses webpack (not Turbopack) — Turbopack crashes silently in sandboxed env
#   2. Binds to 0.0.0.0 so Caddy gateway (port 81) can reverse-proxy to it
#   3. Uses Neon Postgres DB (not local SQLite — schema is postgresql)
#   4. Limits Node heap to 2GB to avoid memory pressure
# Without these flags, the dev server dies after ~30s and Caddy shows the
# Z.ai logo loading page (which is Caddy's default 502 fallback, not our app).

unset DATABASE_URL
export DATABASE_URL="postgresql://neondb_owner:npg_g56mCYBfMkED@ep-delicate-unit-b3u8h0ah-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
export NEXTAUTH_URL="http://localhost:3000"
export NEXTAUTH_SECRET="yqaGBBzXZPBc1zMXRRwrYeI04F7bTIJf7Dgzd1vXWuw="
export NODE_OPTIONS="--max-old-space-size=2048"

cd /home/z/my-project
exec ./node_modules/.bin/next dev -H 0.0.0.0 -p 3000 --webpack
