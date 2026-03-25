# SINet Launch Runbook

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

