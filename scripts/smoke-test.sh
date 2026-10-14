#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-${SMOKE_BASE_URL:-http://localhost:3000}}"
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

check_redirect() {
  local name="$1"
  local path="$2"
  local expected_dest="$3"

  local headers
  headers=$(curl -s -I "${BASE_URL}${path}" 2>/dev/null || echo "")
  local status
  status=$(echo "$headers" | grep -i "^HTTP" | awk '{print $2}' | tail -n1 || echo "000")
  local loc
  loc=$(echo "$headers" | grep -i "^location:" | awk '{print $2}' | tr -d '\r\n' || echo "")

  # Accept 301 (or Next.js permanent 308 / 307) pointing to expected destination
  if [[ ("$status" = "301" || "$status" = "308" || "$status" = "307") && "$loc" == *"$expected_dest"* ]]; then
    echo "✓ ${name} (${path}) → ${status} redirect to ${loc}"
    PASS=$((PASS + 1))
  else
    echo "✗ ${name} (${path}) → ${status} Location: '${loc}' (expected redirect to ${expected_dest})"
    FAIL=$((FAIL + 1))
  fi
}

check_transparency_404_noindex() {
  local headers
  headers=$(curl -s -I "${BASE_URL}/transparency" 2>/dev/null || echo "")
  local status
  status=$(echo "$headers" | grep -i "^HTTP" | awk '{print $2}' | tail -n1 || echo "000")
  local x_robots
  x_robots=$(echo "$headers" | grep -i "^x-robots-tag:" | tr -d '\r\n' || echo "")

  local body
  body=$(curl -s "${BASE_URL}/transparency" 2>/dev/null || echo "")
  local has_meta_noindex=false
  if echo "$body" | grep -qi "noindex"; then
    has_meta_noindex=true
  fi

  if [ "$status" = "404" ] && { [[ "$x_robots" == *"noindex"* ]] || [ "$has_meta_noindex" = true ]; }; then
    echo "✓ /transparency returns 404 with noindex protection (status: ${status}, x-robots-tag: '${x_robots:-meta-tag}')"
    PASS=$((PASS + 1))
  else
    echo "✗ /transparency check failed: status=${status}, x-robots-tag='${x_robots}', meta_noindex=${has_meta_noindex}"
    FAIL=$((FAIL + 1))
  fi
}

check_admin_auth_redirect() {
  local headers
  headers=$(curl -s -I "${BASE_URL}/admin/audit" 2>/dev/null || echo "")
  local status
  status=$(echo "$headers" | grep -i "^HTTP" | awk '{print $2}' | tail -n1 || echo "000")
  local loc
  loc=$(echo "$headers" | grep -i "^location:" | awk '{print $2}' | tr -d '\r\n' || echo "")

  if [[ "$loc" == *"/admin/login"* && ("$loc" == *"next=%2Fadmin%2Faudit"* || "$loc" == *"next=/admin/audit"*) ]]; then
    echo "✓ Signed-out /admin/audit redirects to login with return target (${status} → ${loc})"
    PASS=$((PASS + 1))
  else
    echo "✗ Signed-out /admin/audit failed: status=${status}, location='${loc}' (expected /admin/login?next=%2Fadmin%2Faudit)"
    FAIL=$((FAIL + 1))
  fi
}

check_no_placeholder() {
  local pages=("/" "/about" "/sectors" "/news" "/contact" "/membership" "/chapters" "/student-network" "/gallery")
  local found=false
  for p in "${pages[@]}"; do
    local body
    body=$(curl -s "${BASE_URL}${p}" 2>/dev/null || echo "")
    if echo "$body" | grep -q "______"; then
      echo "✗ Public page ${p} contains illegal '______' placeholder"
      found=true
      FAIL=$((FAIL + 1))
    fi
  done
  if [ "$found" = false ]; then
    echo "✓ No public pages contain '______' placeholder"
    PASS=$((PASS + 1))
  fi
}

check_sitemap_absent() {
  local route="$1"
  local sitemap_content
  sitemap_content=$(curl -s "${BASE_URL}/sitemap-0.xml" 2>/dev/null || curl -s "${BASE_URL}/sitemap.xml" 2>/dev/null || echo "")

  if echo "$sitemap_content" | grep -q "<loc>[^<]*${route}[^<]*</loc>"; then
    echo "✗ Sitemap check: ${route} found in sitemap (expected absent)"
    FAIL=$((FAIL + 1))
  else
    echo "✓ Sitemap check: ${route} is absent from sitemap.xml"
    PASS=$((PASS + 1))
  fi
}

echo "=========================================================="
echo "SINet End-to-End Smoke Test Suite: ${BASE_URL}"
echo "=========================================================="
echo ""

# 1. Homepage
check "Homepage" "GET" "/" "200"

# 2. Key Pages
check "Contact page" "GET" "/contact" "200"
check "About page" "GET" "/about" "200"
check "Sectors page" "GET" "/sectors" "200"
check "Membership page" "GET" "/membership" "200"
check "Gallery page" "GET" "/gallery" "200"
check "News page" "GET" "/news" "200"
check "RSS feed" "GET" "/feed.xml" "200"
check "Campus Chapters page" "GET" "/chapters" "200"
check "Student Network page" "GET" "/student-network" "200"

# 3. Canonical Redirects (301 / 308)
check_redirect "/blueprint redirect" "/blueprint" "/sectors"
check_redirect "/empires redirect" "/empires" "/sectors"
check_redirect "/impact redirect" "/impact" "/about"
check_redirect "/connect redirect" "/connect" "/contact"
check_redirect "/waitlist redirect" "/waitlist" "/membership"

# 4. 404 & Noindex Header Protection
check_transparency_404_noindex

# 5. Admin Page Unauthenticated Redirect
check_admin_auth_redirect

# 6. Public Pages Placeholder Check (no "______")
check_no_placeholder

# 7. Sitemap Exclusions Check
check_sitemap_absent "/blueprint"
check_sitemap_absent "/transparency"

# 8. CSRF Token API Endpoints
check "Waitlist CSRF token" "GET" "/api/waitlist" "200"
check "Contact CSRF token" "GET" "/api/contact" "200"
check "Academy CSRF token" "GET" "/api/academy" "200"
check "Admin login CSRF token" "GET" "/api/admin/auth/login" "200"
check "Health" "GET" "/api/health" "200"

# 8b. Auth Provider Leak Smoke Check
check_otp_provider_error_leak() {
  local response
  response=$(curl -s -X POST "${BASE_URL}/api/auth/request-otp" \
    -H "Content-Type: application/json" \
    -H "Origin: ${BASE_URL}" \
    -d '{"email":"smoke-leak-test@sinet.africa","mode":"otp"}' 2>/dev/null || echo "")

  local leak=false
  for forbidden in "resend" "@gmail.com" "testing emails"; do
    if echo "$response" | grep -qi "$forbidden"; then
      leak=true
      break
    fi
  done

  if [ "$leak" = false ]; then
    echo "✓ /api/auth/request-otp never leaks provider text into response body"
    PASS=$((PASS + 1))
  else
    echo "✗ /api/auth/request-otp leaked forbidden provider string in: $response"
    FAIL=$((FAIL + 1))
  fi
}
check_otp_provider_error_leak

# 9. Admin API Authentication Barriers (unauthenticated must return 401)
check "Admin content API requires auth" "GET" "/api/admin/content/about" "401"
check "Admin media API requires auth" "GET" "/api/admin/media" "401"
check "Admin submissions API requires auth" "GET" "/api/admin/submissions" "401"
check "Admin applications API requires auth" "GET" "/api/admin/applications" "401"
check "Admin posts API requires auth" "GET" "/api/admin/posts" "401"
check "Admin audit API requires auth" "GET" "/api/admin/audit" "401"

echo ""
echo "=========================================================="
echo "Results: ${PASS} passed, ${FAIL} failed"
echo "=========================================================="

if [ "$FAIL" -gt 0 ]; then
  echo "Smoke tests failed. Review output above."
  exit 1
fi
