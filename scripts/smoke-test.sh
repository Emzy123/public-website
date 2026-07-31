#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${SMOKE_BASE_URL:-http://localhost:3000}"
PASS=0
FAIL=0

check() {
  local name="$1"
  local method="$2"
  local path="$3"
  local expected_status="$4"

  local status
  status=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" "${BASE_URL}${path}" 2>/dev/null || echo "000")

  if [ "$status" = "$expected_status" ]; then
    echo "✓ ${name} (${method} ${path}) → ${status}"
    PASS=$((PASS + 1))
  else
    echo "✗ ${name} (${method} ${path}) → ${status} (expected ${expected_status})"
    FAIL=$((FAIL + 1))
  fi
}

echo "Smoke testing ${BASE_URL}"
echo ""

# Homepage
check "Homepage" "GET" "/" "200"

# API routes
check "Waitlist CSRF token" "GET" "/api/waitlist" "200"
check "Contact rejects GET" "GET" "/api/contact" "405"
check "Academy rejects GET" "GET" "/api/academy" "405"

# Key pages
check "Waitlist page" "GET" "/waitlist" "200"
check "Contact page" "GET" "/contact" "200"
check "About page" "GET" "/about" "200"
check "Sectors page" "GET" "/sectors" "200"

# Admin API (unauthenticated should 401)
check "Admin content API requires auth" "GET" "/api/admin/content/about" "401"
check "Admin media API requires auth" "GET" "/api/admin/media" "401"
check "Admin submissions API requires auth" "GET" "/api/admin/submissions" "401"
check "Admin login rejects GET" "GET" "/api/admin/auth/login" "405"

echo ""
echo "Results: ${PASS} passed, ${FAIL} failed"

if [ "$FAIL" -gt 0 ]; then
  echo "Hint: start the server first with 'npm run dev' or 'npm run start'"
  exit 1
fi
