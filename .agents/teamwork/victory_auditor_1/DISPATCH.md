## 2026-09-30T13:38:14Z

You are teamwork_preview_victory_auditor.
Your working directory is: C:\Users\Soporte\Documents\Oopsy\.agents\teamwork\victory_auditor_1
Project root: C:\Users\Soporte\Documents\Oopsy

<original_task>
This is a single self-contained fix; keep it small and focused.

Integrate Google Analytics (GA4) tracking and Google Search engine discovery (SEO, sitemap, robots.txt, and structured metadata) into the Oopsy modeling agency web application as a proof-of-concept.

Working directory: C:\Users\Soporte\Documents\Oopsy
Integrity mode: development

## Requirements

### R1. Google Analytics Integration
Implement Google Analytics 4 (GA4) event and pageview tracking across the application. The measurement ID must be driven through environment variables without hardcoded keys.

### R2. Google Search Engine Indexing & SEO Readiness
Configure full Google Search discovery and indexing for the modeling agency site. This includes dynamic or static sitemap generation (`sitemap.xml`), crawler directives (`robots.txt`), Google Site Verification tag support via environment variables, standard SEO/OpenGraph meta tags, and structured JSON-LD data describing the agency.

### R3. Proof-of-Concept Fault Tolerance & Documentation
Ensure the site builds and runs cleanly when analytics keys or verification tokens are absent or placeholders, without throwing client-side runtime errors or breaking page loads. Document all required environment variables in `.env.example`.

## Acceptance Criteria

### Build & Code Quality
- [ ] `npm run build` completes successfully with exit code 0 and zero TypeScript or linting errors.
- [ ] Required environment variables are documented in an `.env.example` file.

### SEO & Search Console Verification
- [ ] Accessing `/sitemap.xml` yields a valid XML document containing canonical URLs for the site.
- [ ] Accessing `/robots.txt` returns valid robots directives pointing to the sitemap.
- [ ] The root page contains `<meta name="google-site-verification" ...>` reading from the environment variable when provided.
- [ ] The rendered HTML contains valid JSON-LD (`<script type="application/ld+json">`) structured data representing an Organization/ProfessionalService for the agency.

### Analytics Verification
- [ ] When `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set, the Google tag script (`googletagmanager.com/gtag/js`) is present in the rendered HTML document.
- [ ] When `NEXT_PUBLIC_GA_MEASUREMENT_ID` is absent or empty, the application renders normally without unhandled JavaScript exceptions or console errors.
</original_task>

Conduct an independent 3-phase victory audit (timeline inspection, cheating detection, independent verification against all requirements and acceptance criteria). Report your structured verdict (CONFIRMED or REJECTED) and write your detailed audit report to C:\Users\Soporte\Documents\Oopsy\.agents\teamwork\victory_auditor_1\audit_report.md. When complete, send a message back with your verdict and findings.
