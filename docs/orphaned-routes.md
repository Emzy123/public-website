# Orphaned & Unlinked Routes Audit Report

**Date:** October 13, 2026  
**Auditor:** Full-Stack & Product Architecture  
**Status:** Phase 2 Documentation Milestone (No public page code altered)

---

## Executive Summary

During the structural cleanup of the SINet public navigation (Phase 2), 8 routes were removed or excluded from the primary header and footer hierarchies. These routes fall into three distinct operational categories:

1. **Legacy Investment Solicitation Pages** (`/empires`, `/blueprint`, `/transparency`, `/impact`): Built around the discontinued "5 Mega Empires" and fixed 6-week investment cycle narrative.
2. **Feature-Flagged Catalog & Partner Pages** (`/products`, `/partners`): Production-ready components safely gated behind `FEATURE_FLAGS` awaiting verified institutional data.
3. **Redundant Intake Form Pages** (`/waitlist`, `/connect`): Superseded by the unified `/contact` (with 7 topics) and `/join` cohort notification workflows.

Below is the route-by-route audit detailing current contents, risk factors, data sources, and recommended dispositions.

---

## Detailed Route-by-Route Breakdown

### 1. `/empires`
- **Current Headline:** *"The 5 Mega Empires — Building Africa's Economic Future"*
- **Data Source:** CMS document `empires-page` (`DEFAULT_EMPIRES_PAGE`).
- **Core Issues:**
  - Depicts five sectors: *Food & Processing*, *Tech & Innovation*, *Fashion & Creative*, *Real Estate*, and *Agriculture*.
  - Directly contradicts the adopted **3 Pillars** framework (*Agriculture*, *Trade & Goods Distribution*, *Real Estate*).
  - Contains forward-looking construction claims (*"2 manufacturing plants under construction"*, *"5,000-bed student hostel estate"*) without CEO/legal substantiation.
- **Recommended Disposition:**
  - Permanently redirect (301) to `/sectors`.
  - In Phase 4, archive `empires-page` CMS collection in admin.

---

### 2. `/blueprint`
- **Current Headline:** *"The SINet Blueprint — How the Trade-to-Asset Model Works"*
- **Data Source:** CMS document `blueprint` (`DEFAULT_BLUEPRINT`).
- **Core Issues:**
  - Promotes a rigid 3-step cycle: *"Choose Your Entry (₦50k - ₦1M+)"* → *"6-Week Cycle"* → *"Reinvest or Withdraw"*.
  - Heavily relies on unregulated investment solicitation language that conflicts with the brand shift toward a sustainable business and community ecosystem.
  - Testimonial claims: *"I started with ₦50,000. Six weeks later, I had ₦60,000."*
- **Recommended Disposition:**
  - Deprecate in favor of `/about` and `/sectors`.
  - Redirect (301) `/blueprint` to `/sectors`.

---

### 3. `/transparency`
- **Current Headline:** *"Transparency & Governance — The No-Fail Commitment"*
- **Data Source:** CMS document `transparency` (`DEFAULT_TRANSPARENCY`).
- **Core Issues:**
  - Promotes "No-Fail Commitment" and guarantees that present regulatory and compliance exposure under Nigerian securities law.
  - FAQ answers questions on return guarantees, capital protection, and investment risks rather than institutional chapter records or student governance.
- **Recommended Disposition:**
  - Rewrite as true institutional governance (audited chapter statements, leadership conduct, student records), or permanently redirect to `/about`.
  - Retire all "No-Fail" guarantee claims immediately.

---

### 4. `/impact`
- **Current Headline:** *"From Certificate to Capital — Impact & The Student Movement"*
- **Data Source:** CMS document `impact` (`DEFAULT_IMPACT`).
- **Core Issues:**
  - Mentions *"₦50,000 Minimum"*, *"6 Weeks to first returns"*, *"5 Empires"*.
  - Duplicates copy already consolidated into the new `/about` page origin story.
- **Recommended Disposition:**
  - Redirect (301) to `/about`.

---

### 5. `/products`
- **Current Headline:** *"Products Across Our Three Pillars"*
- **Data Source:** CMS document `products-page` (`DEFAULT_PRODUCTS_PAGE`).
- **Controlled By:** `FEATURE_FLAGS.showProducts: false` in `src/lib/site-config.ts`.
- **Status & Readiness:**
  - Clean component using the 3 pillars (`catalogPillarLabel`).
  - Gated safely until operations provides real verified SKUs, wholesale grain inventory, or properties.
- **Recommended Disposition:**
  - Retain behind feature flag. Enable navigation link once verified items are published in Admin.

---

### 6. `/partners`
- **Current Headline:** *"Strategic Partners Across Our Pillars"*
- **Data Source:** CMS document `partners-page` (`DEFAULT_PARTNERS_PAGE`).
- **Controlled By:** `FEATURE_FLAGS.showPartners: false` in `src/lib/site-config.ts`.
- **Status & Readiness:**
  - Clean component structured across pillars.
  - Gated safely until signed institutional MoUs are ready to be named publicly.
- **Recommended Disposition:**
  - Retain behind feature flag. Enable once official partner roster is signed off.

---

### 7. `/waitlist`
- **Current Headline:** *"Join the Waitlist — Pan-African Ecosystem Waitlist"*
- **Data Source:** CMS document `waitlist-page`, `/api/waitlist`.
- **Core Issues:**
  - Form requires obsolete investment fields (`userType: 'investor'`, `investmentInterest: '50000' | '100000+'`).
  - Duplicates the new `/join` priority notification modal and `/api/applications/notify`.
- **Recommended Disposition:**
  - Redirect (301) `/waitlist` to `/membership`.

---

### 8. `/connect`
- **Current Headline:** *"Connect With SINet"*
- **Data Source:** CMS document `connect`, `ConnectClient.tsx`.
- **Core Issues:**
  - Redundant secondary contact channel with duplicate inquiry fields and legacy investment dropdowns.
  - Confuses users who visit `/contact`.
- **Recommended Disposition:**
  - Redirect (301) `/connect` to `/contact`.

---

## Action Plan & Routing Matrix

| Route | Current Status | Issues / Conflicting Narrative | Recommended Action (Phase 3/4) |
| :--- | :--- | :--- | :--- |
| `/empires` | Orphaned | "5 Mega Empires", unverified plant claims | 301 Redirect $\rightarrow$ `/sectors` |
| `/blueprint` | Orphaned | 6-week fixed cycle, guaranteed returns copy | 301 Redirect $\rightarrow$ `/sectors` |
| `/transparency` | Orphaned | "No-Fail Commitment", investment guarantees | Replace with chapter governance or 301 to `/about` |
| `/impact` | Orphaned | Certificate-to-capital, 6-week claims | 301 Redirect $\rightarrow$ `/about` |
| `/products` | Gated (`showProducts: false`) | Awaiting real product SKUs | Keep feature flag until live inventory ready |
| `/partners` | Gated (`showPartners: false`) | Awaiting signed MoUs | Keep feature flag until roster approved |
| `/waitlist` | Orphaned | Redundant legacy investor waitlist | 301 Redirect $\rightarrow$ `/membership` |
| `/connect` | Orphaned | Redundant duplicate of `/contact` | 301 Redirect $\rightarrow$ `/contact` |

> [!NOTE]
> Per project ground rules, no public pages were modified or broken with dev banners. The publish warnings and redirects will be implemented cleanly in the server redirect configuration and Admin CMS phase.
