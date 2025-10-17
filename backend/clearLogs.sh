#!/bin/bash

LOG_DIR="./logs"
LOG_FILES=("debug.log" "error.log" "info.log" "server.log" "trace.log" "warn.log")

echo "Which log file(s) would you like to clear?"
echo "------------------------------------------"
for i in "${!LOG_FILES[@]}"; do
  echo "$((i+1)). ${LOG_FILES[$i]}"
done
echo "A. All logs"
echo "Q. Quit"
echo "------------------------------------------"

read -p "Enter your choice (e.g. 1 or A): " input

if [[ "$input" =~ ^[Aa]$ ]]; then
  for file in "${LOG_FILES[@]}"; do
    > "$LOG_DIR/$file"
    echo "✅ Cleared $file"

  done
  echo "exiting 0"
  exit 0
elif [[ "$input" =~ ^[Qq]$ ]]; then
  echo "🚫 No logs cleared. Exiting."
  exit 0
fi
echo "seting up choices"
  IFS=', ' read -r -a choices <<< "$input"


for choice in "${choices[@]}"; do
echo "getting ready to clear"
  if [[ "$choice" =~ ^[1-6]$ ]]; then
    index=$((choice-1))
    > "$LOG_DIR/${LOG_FILES[$index]}"
    echo "✅ Cleared ${LOG_FILES[$index]}"
  else
    echo "❌ Invalid choice: $choice"
  fi
done
