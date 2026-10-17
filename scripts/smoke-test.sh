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

# 8b. Auth Provider Leak Smoke Check (OTP and Magic Link)
check_otp_provider_error_leak() {
  local mode="$1"
  local response
  response=$(curl -s -X POST "${BASE_URL}/api/auth/request-otp" \
    -H "Content-Type: application/json" \
    -H "Origin: ${BASE_URL}" \
    -d "{\"email\":\"smoke-leak-test@sinet.africa\",\"mode\":\"${mode}\"}" 2>/dev/null || echo "")

  local leak=false
  for forbidden in "resend" "@gmail.com" "testing emails"; do
    if echo "$response" | grep -qi "$forbidden"; then
      leak=true
      break
    fi
  done

  if [ "$leak" = false ]; then
    echo "✓ /api/auth/request-otp (${mode}) never leaks provider text into response body"
    PASS=$((PASS + 1))
  else
    echo "✗ /api/auth/request-otp (${mode}) leaked forbidden provider string in: $response"
    FAIL=$((FAIL + 1))
  fi
}
check_otp_provider_error_leak "otp"
check_otp_provider_error_leak "magic_link"

# 8c. Route Advert & Flyer Suppression Check
check_adverts_suppressed() {
  local target_path="$1"
  local html
  html=$(curl -s -L "${BASE_URL}${target_path}" 2>/dev/null || echo "")
  if echo "$html" | grep -q "Featured announcements" || echo "$html" | grep -q "flyer-modal-title" || echo "$html" | grep -q "sinet-advert-strip"; then
    echo "✗ Advert spotlight strip or flyer modal leaked onto suppressed route: ${target_path}"
    FAIL=$((FAIL + 1))
  else
    echo "✓ Adverts and flyers correctly suppressed on ${target_path}"
    PASS=$((PASS + 1))
  fi
}
check_adverts_suppressed "/sign-in"
check_adverts_suppressed "/join"
check_adverts_suppressed "/portal"
check_adverts_suppressed "/verify"
check_adverts_suppressed "/verify/sample-cert-001"
check_adverts_suppressed "/dashboard"
check_adverts_suppressed "/admin"

# 8d. Join Role Deep Links Check (Content & Neutral Picker Assertions)
check_join_role_deep_link() {
  local role="$1"
  local expected_text="$2"
  local html
  html=$(curl -s -L "${BASE_URL}/join?role=${role}" 2>/dev/null || echo "")

  local decoded_html
  decoded_html=$(echo "$html" | sed 's/&amp;/\&/g')

  if echo "$decoded_html" | grep -qi "$expected_text"; then
    echo "✓ /join?role=${role} displays expected role content ('${expected_text}')"
    PASS=$((PASS + 1))
  else
    echo "✗ /join?role=${role} missing expected role content ('${expected_text}')"
    FAIL=$((FAIL + 1))
  fi
}

check_join_neutral_picker() {
  local target_path="$1"
  local html
  html=$(curl -s -L "${BASE_URL}${target_path}" 2>/dev/null || echo "")

  if echo "$html" | grep -qi "Registration is Closed at the Moment" || echo "$html" | grep -qi "neutral-role-picker-prompt" || echo "$html" | grep -qi "Choose an available role"; then
    echo "✓ ${target_path} renders neutral role picker / generic view (no auto-preselection)"
    PASS=$((PASS + 1))
  else
    echo "✗ ${target_path} failed to render neutral role picker / generic view"
    FAIL=$((FAIL + 1))
  fi

  if echo "$html" | grep -qi "Volunteer Applications are Closed" || echo "$html" | grep -qi "<script>"; then
    echo "✗ ${target_path} leaked volunteer preselection or malicious script tag!"
    FAIL=$((FAIL + 1))
  fi
}

check_join_staff_invitation_only() {
  local html
  html=$(curl -s -L "${BASE_URL}/join?role=staff" 2>/dev/null || echo "")

  local has_neutral=0
  local has_note=0
  local leaks_staff_closed=0

  if echo "$html" | grep -qi "Registration is Closed at the Moment" || echo "$html" | grep -qi "neutral-role-picker-prompt" || echo "$html" | grep -qi "Applications Closed"; then
    has_neutral=1
  fi

  if echo "$html" | grep -qi "Staff positions are by invitation. Choose an open role below."; then
    has_note=1
  fi

  if echo "$html" | grep -qi "Staff Applications are Closed" || echo "$html" | grep -qi "Staff Admissions Closed"; then
    leaks_staff_closed=1
  fi

  if [ "$has_neutral" -eq 1 ] && [ "$has_note" -eq 1 ] && [ "$leaks_staff_closed" -eq 0 ]; then
    echo "✓ /join?role=staff renders neutral picker with invitation note without staff preselection"
    PASS=$((PASS + 1))
  else
    echo "✗ /join?role=staff failed invitation-only assertion (neutral: $has_neutral, note: $has_note, leaks_staff_closed: $leaks_staff_closed)"
    FAIL=$((FAIL + 1))
  fi
}

check_join_role_deep_link "ambassador" "Campus Ambassador"
check_join_role_deep_link "volunteer" "Volunteer"
check_join_role_deep_link "community-member" "Community Member"
check_join_role_deep_link "partnership-interest" "Partnership & Enterprise"
check_join_staff_invitation_only
check_join_neutral_picker "/join?role=garbage"
check_join_neutral_picker "/join?role=%3Cscript%3Ealert(1)%3C%2Fscript%3E"

# 8e. Chapter Join Buttons & No "Campaign Not Found" Internal Resolution
check_chapter_join_links() {
  local chapters_html
  chapters_html=$(curl -s -L "${BASE_URL}/chapters" 2>/dev/null || echo "")
  local chapter_detail_html
  chapter_detail_html=$(curl -s -L "${BASE_URL}/chapters/fulokoja" 2>/dev/null || echo "")

  local broken_links_found=0
  if echo "$chapters_html" | grep -q "/join/student-network" || echo "$chapter_detail_html" | grep -q "/join/student-network"; then
    echo "✗ Hard-coded /join/student-network link found on chapter pages"
    broken_links_found=1
  fi
  if echo "$chapters_html" | grep -q "/join/campus-ambassadors-2026" || echo "$chapter_detail_html" | grep -q "/join/campus-ambassadors-2026"; then
    echo "✗ Hard-coded /join/campus-ambassadors-2026 link found on chapter pages"
    broken_links_found=1
  fi

  if [ "$broken_links_found" -eq 0 ]; then
    echo "✓ No hard-coded /join/<slug> broken paths found on /chapters or /chapters/[slug]"
    PASS=$((PASS + 1))
  else
    FAIL=$((FAIL + 1))
  fi

  # Check that role+chapter routed join targets resolve without "Campaign Not Found"
  local test_paths=(
    "/join?role=community-member&chapter=fulokoja"
    "/join?role=ambassador&chapter=fulokoja"
    "/join/student-network"
    "/join/campus-ambassadors-2026"
  )
  for target_path in "${test_paths[@]}"; do
    local res_html
    res_html=$(curl -s -L "${BASE_URL}${target_path}" 2>/dev/null || echo "")
    if echo "$res_html" | grep -qi "Campaign Not Found"; then
      echo "✗ ${target_path} resolved to 'Campaign Not Found'!"
      FAIL=$((FAIL + 1))
    else
      echo "✓ ${target_path} resolves without 'Campaign Not Found'"
      PASS=$((PASS + 1))
    fi
  done
}
check_chapter_join_links


# 9. Admin API Authentication Barriers (unauthenticated must return 401)
check "Admin content API requires auth" "GET" "/api/admin/content/about" "401"
check "Admin media API requires auth" "GET" "/api/admin/media" "401"
check "Admin submissions API requires auth" "GET" "/api/admin/submissions" "401"
check "Admin applications API requires auth" "GET" "/api/admin/applications" "401"
check "Admin posts API requires auth" "GET" "/api/admin/posts" "401"
check "Admin audit API requires auth" "GET" "/api/admin/audit" "401"
check "Admin adverts legal approval requires auth" "POST" "/api/admin/content/adverts/legal-approval" "401"
check "Admin announcements POST requires auth" "POST" "/api/admin/announcements" "401"
check "Admin announcements PATCH requires auth" "PATCH" "/api/admin/announcements/ann-smoke-test-id" "401"
check "Admin capacity audit requires auth" "GET" "/api/admin/capacity-audit" "401"

echo ""
echo "=========================================================="
echo "Results: ${PASS} passed, ${FAIL} failed"
echo "=========================================================="

if [ "$FAIL" -gt 0 ]; then
  echo "Smoke tests failed. Review output above."
  exit 1
fi
