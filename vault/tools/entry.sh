#!/usr/bin/env sh
set -e

# 1) start vault server in dev (background)
vault server -dev \
  -dev-root-token-id="${VAULT_DEV_ROOT_TOKEN:-myroot}" \
  -dev-listen-address="0.0.0.0:8200" &
VAULT_PID=$!

# 2) wait for it to answer
export VAULT_ADDR="http://127.0.0.1:8200"
for i in $(seq 1 20); do
  sleep 0.5
  vault status >/dev/null 2>&1 && break
done

# 3) run agent (foreground) so container stays up
vault agent -config=/vault/config/agent.hcl

# 4) if agent exits, stop vault
kill $VAULT_PID 2>/dev/null || true
wait $VAULT_PID 2>/dev/null || true
