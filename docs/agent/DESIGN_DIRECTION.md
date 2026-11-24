# SINet design direction (approved 2026-11-24 09:40 WAT)

Goal: look and behave like a serious organisation's platform. No gamification.
References: myACCA, IEEE, GitHub dashboard (Oct-Nov 2026), Paystack (May 2026), Stripe, Linear, Vercel, ALX, Carbon, Polaris, GOV.UK.

## Member home, top to bottom
1. Greeting with real name + ONE primary action that changes with the member's situation
2. Membership strip: photo, member ID, tier, chapter, status, valid until, Digital ID, good-standing letter
3. One "action needed" notice, only when there is one
4. Joining/application steps, only while unfinished
5. Upcoming events + programme applications
6. Official announcements (real CMS only)
7. Chapter
8. Open opportunities
9. Help

Sidebar: Home, Membership & ID, Events, Programmes, Chapter, News, Community, Settings. Bottom bar on mobile.
QR opens public verification page: minimal details + time checked.

## Remove
Streaks, points, levels, achievement walls, Pulse as landing, emoji in UI, gradients, coloured icon tiles, heavy shadows, large radii, confetti, leaderboards, playful labels, mascots.
Keep only real credentials: verified member, tier, chapter officer, programme alumnus, delegate.
Hide empty sections; never show seeded or fake data.

## System
- shadcn/ui + Tailwind tokens + Radix; Lucide icons
- Inter; neutral greys + one brand colour; ink #0A0A0F header/footer kept
- Colour only for status, always with a text label
- 6-8px radius, flat cards, no shadows
- Real photography only
- Brand rules in BRAND.md still apply (transparent logos, compact lockup in header)
