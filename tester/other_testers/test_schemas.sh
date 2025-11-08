#!/bin/bash

echo "Testing signSchema"
echo "Trying to register with username: $1, password: $2"

curl -X POST http://localhost:5173/api/register \
-H "Content-Type: application/json" \
-d "{
  \"username\": \"$1\",
  \"password\": \"$2\"
}"

echo "Test for SQL injection"

curl -X POST https://localhost:4004/api -d "username=' OR '1'='1" -v -k
curl -X POST https://localhost:4004/api -k --data-urlencode "search=test' UNION SELECT * FROM users --" -v
curl -G https://localhost:4004/api --data-urlencode "search=test' UNION SELECT * FROM users --" -vk
curl -X POST https://localhost:4004/api -k -d "id=1; DROP TABLE users;" -v  

echo "Test for XSS"

curl -X POST https://localhost:4004/api -k -d "comment=<script>alert('xss')</script>" -v
curl -X POST https://localhost:4004/api -d "input=<img src=x onerror=alert('xss')>" -vk

echo "Test for Path Traversal"

curl -X POST https://localhost:4004/api/download --data-urlencode "file=../../../../etc/passwd" -vk

echo "Test for Command Injection"

curl -X POST https://localhost:4004/api -k -d "target=8.8.8.8; cat /etc/passwd" -v
curl -X POST https://localhost:4004/api -d "target=8.8.8.8 && ls /" -vk

