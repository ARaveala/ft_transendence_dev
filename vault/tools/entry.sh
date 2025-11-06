#!/usr/bin/env sh
set -e

# start vault server in dev (background)
vault server -dev \
  -dev-root-token-id="${VAULT_DEV_ROOT_TOKEN:-myroot}" \
  -dev-listen-address="0.0.0.0:8200" &
VAULT_PID=$!

# wait for vault to answer
export VAULT_ADDR="http://127.0.0.1:8200"
export VAULT_API_ADDR="http://127.0.0.1:8200"
for i in $(seq 1 20); do
  sleep 0.5
  vault status >/dev/null 2>&1 && break
done

export VAULT_TOKEN="${VAULT_DEV_ROOT_TOKEN:-myroot}"

if [ "${VAULT_SEED:-true}" = "true" ]; then
  # only create if missing
  if ! vault kv get -format=json secret/app >/dev/null 2>&1; then
    vault kv put secret/app \
      JWT_SECRET="${JWT_SECRET:-dev_jwt_secret}" \
      DB_USER="${DB_USER:-devuser}" \
      DB_PASS="${DB_PASS:-devpass}" \
      API_KEY_PAYMENT="${API_KEY_PAYMENT:-apikeypayment}"
  fi
fi

# run agent (foreground) so container stays up
vault agent -config=/vault/config/agent.hcl

# if agent exits, stop vault
kill $VAULT_PID 2>/dev/null || true
wait $VAULT_PID 2>/dev/null || true
