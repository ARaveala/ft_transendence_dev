#!/bin/bash

# Set paths
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
FRONTEND="$SCRIPT_DIR/../../frontend/shared/api-protocols.ts"
BACKEND="$SCRIPT_DIR/../../backend/shared/apiProtocols.js"

# Temp files
FRONT_BLOCK="frontend_block.tmp"
BACK_BLOCK="backend_block.tmp"
FRONT_KEYS="frontend_keys.txt"
BACK_KEYS="backend_keys.txt"
MISSING_KEYS="missing_keys.txt"
MISSING_BLOCKS="missing_blocks.tmp"

# Extract API_PROTOCOL blocks
sed -n '/API_PROTOCOL *= *{/,/^};/p' "$FRONTEND" > "$FRONT_BLOCK"
sed -n '/API_PROTOCOL *= *{/,/^};/p' "$BACKEND" > "$BACK_BLOCK"

# Extract keys from each block
grep -o '^[[:space:]]*[A-Z0-9_]\+:' "$FRONT_BLOCK" | sed 's/^[[:space:]]*//' | cut -d: -f1 | sort -u > "$FRONT_KEYS"
grep -o '^[[:space:]]*[A-Z0-9_]\+:' "$BACK_BLOCK" | sed 's/^[[:space:]]*//' | cut -d: -f1 | sort -u > "$BACK_KEYS"

# Compare keys
comm -23 "$FRONT_KEYS" "$BACK_KEYS" > "$MISSING_KEYS"

# Extract missing blocks from frontend
> "$MISSING_BLOCKS"
while read -r key; do
  awk "/^ *$key: *\{/,/^ *\},?/" "$FRONT_BLOCK" >> "$MISSING_BLOCKS"
  echo "," >> "$MISSING_BLOCKS"
done < "$MISSING_KEYS"

# Insert missing blocks before closing };
if grep -q '};' "$BACKEND"; then
  sed -i "/};/e cat $MISSING_BLOCKS" "$BACKEND"
  echo "✅ Added $(wc -l < "$MISSING_KEYS") missing keys to backend."
else
  echo "❌ Could not find closing }; in backend file."
fi

# Cleanup
rm -f "$FRONT_BLOCK" "$BACK_BLOCK" "$FRONT_KEYS" "$BACK_KEYS" "$MISSING_KEYS" "$MISSING_BLOCKS"


###!/bin/bash
##
### Paths to your files
##SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
##FRONTEND_FILE="$SCRIPT_DIR/../../frontend/shared/api-protocols.ts"
##BACKEND_FILE="$SCRIPT_DIR/apiProtocols.js"
##TEMP_FRONTEND_BLOCK="frontend_block.tmp"
##TEMP_BACKEND_BLOCK="backend_block.tmp"
##TEMP_MISSING_KEYS="missing_keys.tmp"
##TEMP_MISSING_BLOCKS="missing_blocks.tmp"
##
### Extract API_PROTOCOL block from frontend
##awk '/API_PROTOCOL *= *\{/,/\} *as *const/' "$FRONTEND_FILE" > "$TEMP_FRONTEND_BLOCK"
##
### Extract API_PROTOCOL block from backend
##awk '/API_PROTOCOL *= *\{/,/\}/' "$BACKEND_FILE" > "$TEMP_BACKEND_BLOCK"
##
### Extract keys from each block
##grep -E '^[[:space:]]*[A-Z0-9_]+:' "$TEMP_FRONTEND_BLOCK" | cut -d: -f1 | tr -d ' ' | sort > frontend_keys.txt
##grep -E '^[[:space:]]*[A-Z0-9_]+:' "$TEMP_BACKEND_BLOCK" | cut -d: -f1 | tr -d ' ' | sort > backend_keys.txt
##
### Find missing keys
##comm -23 frontend_keys.txt backend_keys.txt > "$TEMP_MISSING_KEYS"
##
### Extract missing blocks from frontend
##> "$TEMP_MISSING_BLOCKS"
##while read -r key; do
##  awk "/$key: *\{/,/^\s*\},?/" "$TEMP_FRONTEND_BLOCK" >> "$TEMP_MISSING_BLOCKS"
##  echo "," >> "$TEMP_MISSING_BLOCKS"
##done < "$TEMP_MISSING_KEYS"
##
### Insert missing blocks into backend before closing };
##if grep -q '};' "$BACKEND_FILE"; then
##  sed -i "/};/e cat $TEMP_MISSING_BLOCKS" "$BACKEND_FILE"
##  echo "✅ Synced missing keys from frontend to backend."
##else
##  echo "❌ Could not find closing }; in backend file."
##fi
##
### Cleanup
##rm -f "$TEMP_FRONTEND_BLOCK" "$TEMP_BACKEND_BLOCK" "$TEMP_MISSING_KEYS" "$TEMP_MISSING_BLOCKS" frontend_keys.txt backend_keys.txt
##