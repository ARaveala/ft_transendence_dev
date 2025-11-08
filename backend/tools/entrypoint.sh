#!/usr/bin/env sh
set -e

# Normalise the file to prevent CRLF endings
# tr -d '\r' < "$SECRETS_FILE" > "$SECRETS_FILE.tmp" && mv "$SECRETS_FILE.tmp" "$SECRETS_FILE"

echo "[entrypoint] Waiting for secrets file: $SECRETS_FILE"
# Wait up to 60s for file to be created and contain JWT_SECRET (add others if needed)
for i in $(seq 1 60); do
  if [ -s "$SECRETS_FILE" ] && grep -q '^JWT_SECRET=' "$SECRETS_FILE"; then
    echo "[entrypoint] Secrets file is present and populated."
    break
  fi
  sleep 1
done

if ! [ -s "$SECRETS_FILE" ]; then
  echo "[entrypoint][WARN] $SECRETS_FILE not found or empty after wait; starting anyway."
else
  set -a
  . "$SECRETS_FILE"
  set +a
fi

exec node server.js
