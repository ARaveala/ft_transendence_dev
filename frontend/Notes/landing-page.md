# Registration & Sign in

## New user registration
1. Frontend → Backend
    * POST /register with {username, password}
2. Backend → Frontend
    * If invalid (username taken, weak password, etc.) → 400 Bad Request with error
    * If valid →
        * Create user in DB
        * Log them in by returning JWT, e.g. (status: registered??, user_id: , jwt:)
        * Only Access token or both access token and refresh token ???


## Sign in
1. Frontend → Backend
    * POST /login with {username, password}
2. Backend → Frontend
    * If invalid credentials → 401 Unauthorized.
    * If valid credentials + no 2FA → respond with JWT
    * If valid credentials + 2FA required → respond with status: "2FA_required" and method: "TOTP"
3. Frontend → Backend (only if 2Fa required)
    * POST /login/2fa with {username, code}
4. Backend → Frontend
    * If code invalid → 401 Unauthorized
    * If valid → return JWT



