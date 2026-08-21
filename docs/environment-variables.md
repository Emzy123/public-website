# Environment Variables Guide

## Quick Start (local development)

Only **4 variables** are needed to run the app locally:

| Variable | Value |
|---|---|
| `NODE_ENV` | `development` |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` |
| `MONGODB_URI` | `mongodb://127.0.0.1:27017` |
| `MONGODB_DB` | `sinet` |

To access `/admin`, add these **3 more**:

| Variable | Value |
|---|---|
| `ADMIN_EMAIL` | Any email, e.g. `admin@sinet.africa` |
| `ADMIN_PASSWORD_HASH` | Run `npx tsx scripts/hash-admin-password.ts "your-password"` and paste the output |
| `ADMIN_SESSION_SECRET` | Any random string, 32+ characters (run `openssl rand -base64 32`) |

Everything else is optional for local dev. Features that depend on missing keys will fail gracefully with descriptive error messages.

---

## Full Variable Reference

### Core (required)

| Variable | How to get it |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | Your deployment URL. Use `http://localhost:3000` locally. |
| `MONGODB_URI` | Your MongoDB connection string. Local: `mongodb://127.0.0.1:27017`. Atlas: copy from [MongoDB Atlas](https://cloud.mongodb.com) → Database → Connect → Drivers. |
| `MONGODB_DB` | Database name, e.g. `sinet`. |

### Admin Authentication (required for `/admin`)

| Variable | How to get it |
|---|---|
| `ADMIN_EMAIL` | The email address used to log in to the admin panel. |
| `ADMIN_PASSWORD_HASH` | Run `npx tsx scripts/hash-admin-password.ts "your-password"` in the project root. Copy the full output (format: `salt:hash`). |
| `ADMIN_SESSION_SECRET` | Generate with `openssl rand -base64 32`. Must be 32+ characters. |
| `ADMIN_NOTIFY_EMAIL` | Optional. Email address to receive notifications when new submissions arrive. |

### Security: reCAPTCHA (required for waitlist form)

| Variable | How to get it |
|---|---|
| `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` | Go to [Google reCAPTCHA Admin](https://www.google.com/recaptcha/admin) → Register a new site → choose reCAPTCHA v2 (checkbox) → copy **Site Key**. |
| `RECAPTCHA_SECRET_KEY` | Same page as above → copy **Secret Key**. |

### Security: CSRF (required in production)

| Variable | How to get it |
|---|---|
| `CSRF_SECRET` | Generate with `openssl rand -base64 32`. Must be 32+ characters. |

### Rate Limiting (required in production)

| Variable | How to get it |
|---|---|
| `UPSTASH_REDIS_REST_URL` | Sign up at [Upstash](https://console.upstash.com) → Create a Redis database → copy **REST URL** from the dashboard. |
| `UPSTASH_REDIS_REST_TOKEN` | Same Upstash dashboard → copy **REST Token**. |

### Email: Resend (required for email features)

| Variable | How to get it |
|---|---|
| `EMAIL_SERVICE` | Set to `resend`. |
| `RESEND_API_KEY` | Sign up at [Resend](https://resend.com) → API Keys → Create API Key → copy it. |
| `RESEND_AUDIENCE_ID` | Resend dashboard → Audiences → Create or select an audience → copy its ID from the URL. |
| `RESEND_FROM_EMAIL` | Format: `"SINet <noreply@yourdomain.com>"`. The domain must be verified in Resend → Domains. |
| `RESEND_CONTACT_TO_EMAIL` | The inbox where contact form submissions are forwarded. |

### MongoDB Direct Connection (optional)

| Variable | How to get it |
|---|---|
| `MONGODB_URI_DIRECT` | Only needed if SRV/DNS resolution fails on your network. Copy your Atlas connection string and change `mongodb+srv://` to `mongodb://`, add `:27017` after the hostname, and append `?tls=true&directConnection=true&authSource=admin`. |

### Analytics & Social (optional)

| Variable | How to get it |
|---|---|
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | [Google Analytics](https://analytics.google.com) → Admin → Data Streams → select stream → copy **Measurement ID** (starts with `G-`). |
| `NEXT_PUBLIC_FACEBOOK_PIXEL_ID` | [Meta Events Manager](https://business.facebook.com/events_manager) → select pixel → copy **Pixel ID**. |
| `NEXT_PUBLIC_SOCIAL_X_URL` | Your X/Twitter profile URL. |
| `NEXT_PUBLIC_SOCIAL_LINKEDIN_URL` | Your LinkedIn page URL. |
| `NEXT_PUBLIC_SOCIAL_FACEBOOK_URL` | Your Facebook page URL. |

### Reserved (not currently used)

These are placeholders for future email provider adapters. No action needed.

- `MAILCHIMP_API_KEY`, `MAILCHIMP_LIST_ID`
- `CONVERTKIT_API_KEY`, `CONVERTKIT_FORM_ID`
- `SENDGRID_API_KEY`, `SENDGRID_LIST_ID`
