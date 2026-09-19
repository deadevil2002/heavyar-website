# Public website release-candidate verification

Verified 2026-09-19, Asia/Riyadh. This records local/pre-production verification,
not a claim that these changes are published.

## Completed

- 21 website Node regression tests passed.
- Real backend `publicSeoPayload(defaultSeoConfig())` produced 18 resolved pages
  accepted by the website validator.
- Cloudflare Pages advanced Worker compilation passed.
- Arabic and English home layouts: no horizontal overflow at 1920×1080,
  1440×900, 1366×768, 1024×768, 768×1024, 430×932, 390×844 and 360×800.
- Mobile navigation, required email, six GCC country values, optional fields,
  unchecked/checked consent booleans, success, validation and closed states
  passed browser checks using safe intercepted API responses.
- Dedicated Early Access routes expose the working form only with an enabled
  fixture. The observed live config remained OFF.
- Clean and legacy legal routes returned 200. Contact, refund, safety,
  provider-terms and FAQ aliases were fixed and confirmed by HTTP checks.
- Account deletion passed in both languages using mocked Firebase state and an
  intercepted Worker POST. Query UID/email could not authenticate; checkbox and
  exact confirmation were required; request used Bearer authentication and only
  the confirmation body; success signed the UI out.
- All original legal HTML and deletion JavaScript remain byte-identical.
- Hero WebP: approximately 147 KB. Dedicated 1200×630 social image: approximately
  75 KB. No client framework is shipped.
- Related app checks: 340 Worker tests passed (2 emulator-dependent tests skipped),
  4 focused Admin tests passed, Worker/Admin TypeScript and Admin build passed.
- Workspace scans: no new static findings; four pre-existing public Firebase
  API-key flags; no privacy findings. Existing dependency audit remains 0 critical,
  58 high, 46 moderate, 8 low. No dependency-wide upgrades were performed.

## Still required at release

- Publish the exact-origin Worker CORS change and the Admin label polish.
- Publish only the existing `heavyar-website` Pages project, then verify the live
  `heavyar.com` Arabic/English initial HTML, assets, robots, sitemap and legal flow.
- The published SEO endpoint initially returned `SEO_NOT_PUBLISHED`; subsequent
  upstream timeouts exercised conservative noindex fallback. Confirm healthy
  upstream behavior during live verification.
- No new SEO publication has been authorized or performed.
- No real signup confirmation, marketing campaign, payment, native build or
  store submission was triggered by this phase.
- Early Access activation requires separate owner authorization after production
  verification. Campaign sending remains locked.

Browser fixtures prove website request/response behavior, not actual email
delivery. Local asset budgets are not field Core Web Vitals or Lighthouse scores.