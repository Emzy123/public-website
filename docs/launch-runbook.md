# SINet Launch Runbook

## NODE_ENV security behavior

- `NODE_ENV=development`
  - Security checks are still active (origin/CSRF/reCAPTCHA/rate limits).
  - API errors include actionable `details` fields for local troubleshooting.
- `NODE_ENV=production`
  - Strict mode is enforced for API configuration.
  - Missing required env vars return hard failures with generic error messages.

## Pre-redeploy full-scale test (recommended)

### Local (automated)

```bash
npm install
npm run lint
npm run build
npm test
```

### Local (runtime smoke)

- Start prod server locally:

```bash
npx next start -p 3010
```

- Verify API routes respond:
  - `GET http://localhost:3010/api/waitlist` returns `{ csrfToken: ... }`
  - `GET http://localhost:3010/api/contact` returns `405`
  - `GET http://localhost:3010/api/academy` returns `405`

- With **real production env values** set (MongoDB, reCAPTCHA, CSRF, Resend):
  - Submit one waitlist form (expect redirect to `/waitlist/success`)
  - Submit one contact form (expect DB insert + email notification)
  - Submit one academy interest form (expect DB insert)

### Vercel Preview (production-like)

- Set the same env vars you intend for production in the Preview environment.
- Deploy Preview and run the checks in **T-24h** and **T-0** below:
  - Forms (waitlist/contact/academy)
  - DB inserts
  - Email delivery
  - GA4 realtime (events)
  - Vercel logs for 4xx/5xx spikes

## T-24h Checklist

- Confirm Vercel production build is green.
- Confirm all required production env vars are set.
- Validate MongoDB network access and credentials.
- Validate Resend API key, sender identity, and recipient inbox.
- Run form checks (waitlist, contact, academy) on production preview.
- Validate analytics real-time event flow in GA4.
- Confirm domain and SSL are valid.

## T-0 Go-Live

- Promote latest stable deployment to production.
- Validate homepage and primary CTA render after cache warm-up.
- Submit one controlled waitlist + contact + academy event.
- Confirm DB inserts and email delivery.
- Confirm social share links and OG preview response.

## T+1h Monitoring

- Check Vercel logs for 4xx/5xx spikes.
- Check API route response trends (`/api/waitlist`, `/api/contact`, `/api/academy`).
- Verify no excessive 429 responses.
- Verify GA4 receives `waitlist_submit`, `contact_submit`, `academy_interest_submit`, and `cta_click`.

## T+24h Review

- Summarize launch metrics:
  - waitlist submissions
  - contact submissions
  - academy interest submissions
  - top referral channels
- Review user feedback and prioritize quick fixes.
- Capture known issues and create backlog tickets.

## Final QA Matrix

- Chrome, Edge, Safari (desktop).
- Mobile viewport checks (iOS + Android sizes).
- Keyboard navigation and visible focus states.
- Image loading and layout stability.
- Error path checks:
  - invalid form fields
  - rate-limit behavior (429)
  - temporary provider failure fallback.

