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

# API routes — GET issues CSRF tokens (200), not 405
check "Waitlist CSRF token" "GET" "/api/waitlist" "200"
check "Contact CSRF token" "GET" "/api/contact" "200"
check "Academy CSRF token" "GET" "/api/academy" "200"
check "Admin login CSRF token" "GET" "/api/admin/auth/login" "200"
check "Health" "GET" "/api/health" "200"

# Key pages & redirects
check "Waitlist redirect" "GET" "/waitlist" "308"
check "Contact page" "GET" "/contact" "200"
check "About page" "GET" "/about" "200"
check "Sectors page" "GET" "/sectors" "200"
check "Membership page" "GET" "/membership" "200"
check "Gallery page" "GET" "/gallery" "200"
check "News page" "GET" "/news" "200"
check "RSS feed" "GET" "/feed.xml" "200"
check "Campus Chapters page" "GET" "/chapters" "200"
check "Student Network page" "GET" "/student-network" "200"

# Admin API (unauthenticated should 401)
check "Admin content API requires auth" "GET" "/api/admin/content/about" "401"
check "Admin media API requires auth" "GET" "/api/admin/media" "401"
check "Admin submissions API requires auth" "GET" "/api/admin/submissions" "401"
check "Admin applications API requires auth" "GET" "/api/admin/applications" "401"
check "Admin posts API requires auth" "GET" "/api/admin/posts" "401"
check "Admin audit API requires auth" "GET" "/api/admin/audit" "401"

echo ""
echo "Results: ${PASS} passed, ${FAIL} failed"

if [ "$FAIL" -gt 0 ]; then
  echo "Hint: start the server first with 'npm run dev' or 'npm run start'"
  exit 1
fi
