#!/bin/bash

echo "Testing signSchema"
echo "Trying to register with username: $1, password: $2"

curl -X POST http://localhost:5173/api/register \
-H "Content-Type: application/json" \
-d "{
  \"username\": \"$1\",
  \"password\": \"$2\"
}"

echo ""

