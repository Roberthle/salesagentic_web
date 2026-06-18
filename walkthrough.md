# Tomcat Capex Lead Intelligence Detail Panel Implementation

I have refactored the lead inspection details panel on the sales agentic homepage to match the styling and content structure of `www.tomcatcapex.com` and satisfy the zero-emoji design requirements.

## Key Changes

### 1. Database and API Expansion
- Modified `app/api/feed/route.ts` to retrieve additional columns from the `leads` table:
  - `file_id`
  - `lapse_date`
  - `dba_name`
  - `address`
  - `zipcode`
  - `stack_depth`
  - `funder_tier`
  - `est_advance_amount`
  - `contact_name`
  - `phone`
  - `email`
  - `company_website`
- Returned the expanded telemetry fields in the JSON feed to enable rich detail rendering in the browser.

### 2. Style Integration
- Appended Tomcat-aligned layout CSS styles to the end of `app/landing.css`:
  - `.urgency-bar` and `.urgency-fill` for dynamic maturity/expiration progress.
  - `.score-ring`, `.s-hot`, `.s-warm`, `.s-med` for deal metrics scorecard circles.
  - `.intel-section`, `.intel-label`, `.intel-card` for details dashboard rows.
  - `.sh-timeline`, `.sh-event`, `.sh-dot`, `.sh-line`, `.sh-arrow`, `.sh-arrow-node` for prior funding history timeline nodes.
  - `.cr-badge`, `.cr-card`, `.cr-headline` for court/CFPB/EPA/OSHA regulatory sweep items.
  - `.mi-tabs`, `.mi-tab`, `.mi-sentiment`, `.mi-article` for market intelligence sweeps.

### 3. Inspection Panel Refactoring
- Completely rewrote the inspection panel rendering logic in `app/page.tsx`:
  - Added React helper functions to compute **AI Deal Score & Narrative**, **Est. Paydex**, and **Est. Annual Revenue** metrics dynamically.
  - Rendered the **Filing Intelligence** and **Company Profile** key-value tables.
  - Removed all masking and paywall indicators (locks, `••••` characters) from calculated refinance monthly/annual savings, awarding agencies, permit IDs, cargo weight lists, and contact data.
  - Implemented the **Signal Stack** showing confirmed state equipment lien, LinkedIn hiring posts, refinance arbitrage calculator, SAM.gov awards, municipal facility permits, and US Customs cargo manifests.
  - Formatted the **Funding History timeline** graph showing previous, current, and future equipment financing nodes.
  - Added the **Court & Regulatory** compliance sweep status check.
  - Styled the **Market Intelligence** news sweep grid.

### 4. Zero-Emoji Compliance
- Converted all graphic indicators, checkmarks, status circles, folder clips, cargo vessels, and arrow icons to clean plain-text indicators:
  - Checkmark -> `[OK]` or `[CONFIRMED]`
  - Close -> `[X]`
  - Status lights -> `[NEUTRAL]` / `[ALERT]` / `[CLEAR]`
  - Bullet circles -> standard list hyphens `-` or asterisks `*`
  - Inline icons -> `[JOB]`, `[SAVINGS]`, `[GOVT]`, `[PERMIT]`, `[IMPORT]`, `[TIMELINE]`, `[NEWS]`
  - Arrow symbols -> plain text `->` and `[->]`

### 5. Terminology Masking
- Masked all occurrences of "UCC filings" and "UCC-1" in user-facing texts to "state equipment lien" or "state blanket lien" to preserve sourcing confidentiality.

## Latest Retooling & Secret Integration (June 14, 2026)

- **Walkthrough Access Integration:**
  - Imported `Link` in `app/page.tsx` and wrapped the centered V3 logo with a link pointing to the hidden `/walkthrough` logs page.
  - Users can now click the V3 logo as an easter egg to access the private logs page.
- **Walkthrough Interface Enhancement:**
  - Upgraded the rendering engine of `app/walkthrough/page.tsx` to parse markdown content dynamically.
  - Added CSS style parsing for header nesting (`#`, `##`, `###`), list items (`-`), and inline styles for bold (`**`) and code blocks (`` ` ``) with custom styling variables.
  - Implemented a retro cyber console theme layout featuring glassmorphism cards and a glow shadow effect matching the main dashboard styling.
- **Header Verification:**
  - Verified the removal of any "WELCOME TO THE AI REVOLUTION" header texts.
  - Replaced the simple text badge with the actual animated **Dynamic V3 SVG Logo** (featuring gold and silver gradients, rotating gear/sparks, and high-torque burst keyframes) matching the branding of the Quantum Trade Engine.
  - Positioned the V3 SVG logo on the top center, with "Sales Agentic AI" directly below and "7 day pipeline builder" monospace subtitle underneath.
- **Branding Verification:**
  - Verified and confirmed all codebase titles and copy references read "Sales Agentic" (and "SalesAgentic") across `app/page.tsx`, `app/layout.tsx`, `app/dashboard/page.tsx`, and `app/walkthrough/page.tsx`.
- **Validation:**
  - Successfully verified Next.js compiler builds and runs with zero compiler or typescript errors.

## 9. Multiagent Data Expansion & Signal Fusion (June 14, 2026)

- **Autonomous Harvesters Deployed:**
  - Created hiring scraper (`harvester_hiring.py`) targeting LinkedIn, Indeed, and ZipRecruiter to find active scaling/job vacancy indicators.
  - Created building permit scraper (`harvester_permits.py`) monitoring city/county building departments for facilities expansion and heavy power upgrades.
  - Created customs scraper (`harvester_customs.py`) pulling Bill of Lading manifests from US Customs (CBP) for raw industrial cargo shipments.
  - Created litigation scraper (`harvester_litigation.py`) monitoring civil court disputes between debtors and captive lessors to detect displacement opportunities.
- **Trigger Fusion Engine:**
  - Developed `signal_fusion_pipeline.py` to coordinate scraper runs, resolve company matching variants, and write the enriched records directly into SQLite (`leads.signals_json`) under target frontend schemas.
- **Copywriting Compiler Integration:**
  - Updated `trial_campaign_runner.py` to trigger the multiagent fusion pipeline at the beginning of lead processing loops.
  - Retooled the OpenRouter prompt templates inside `trial_campaign_runner.py` to parse the enriched triggers and instruct the LLM copywriter to anchor outbound sales emails on them.
- **Validation:**
  - Ran `python3 trial_campaign_runner.py` end-to-end. Verified that matching prospects successfully triggered the real-time enrichment loop, updated SQLite database records, and generated context-specific outbound copies referencing the newly scraped permit IDs and active job postings.

---

## 10. Zooming Hero Background & Parallax Integration (June 14, 2026)

- **Dynamic Background Layer:**
  - Deployed the user's selected corporate chart background image as the main hero background layer (`/pipeline_bg_v2.png`), edited to capitalize the word **"Sales"** to read **"Sales with Agentic AI"** in glowing blue along the curve.
  - Anchored the background image to **`right center`** so that the businessman, drawing hand, and glowing arrow text remain fully visible across all screen sizes.
  - Removed the continuous zoom-drift animation to keep the background completely static, focused, and crystal clear.
  - Renamed the background asset to **`/pipeline_bg_v2.png`** to bypass aggressive browser caching and force immediate asset reloading.
- **Copywriting Update:**
  - Updated the hero section sub-headline to read: **"All the work and research done so you don't have to."**
  - Added a description below the trial form title explaining: **"Deploy dedicated, autonomous AI agents engineered to source leads, verify signal data, and scale your outbound pipeline 24/7."**
- **Form Layout & Translucency:**
  - Expanded `.hero-manifesto`'s maximum width to **`100%`** (full viewport) to allow left-aligned elements to occupy the outer edges of the screen.
  - Left-aligned the `.trial-form-container` box (`margin: 40px auto 0 0`) so that it sits on the left side of the hero layout, directly above the word **"Sales"** on the background.
  - Added a desktop media query (`margin-left: 12%` for `@media (min-width: 1024px)`) to position the form box exactly above the start of the glowing background curve.
  - Increased transparency of the `.trial-form-container` box from `0.7` to `0.28` opacity and added a `16px` frosted glass backdrop-filter blur to make it significantly more translucent while preserving high text legibility.
- **Branding Correction:**
  - Restored and standardized the website's display name to **"Sales Agentic AI"** (and **"SalesAgentic"** / **"SalesAgentic.ai"**) across routing metadata, titles, and headers.
- **Clear 4K Picture Background Overlay:**
  - Removed the horizontal scanline grid overlay filter from the `.hero-bg-overlay` styling to keep the background image crystal clear and sharp.
  - Kept the smooth top-to-bottom vignette transition (fading from the slate-blue body background `rgba(70, 99, 115)` into the dark console backdrop `#0d0d12`) to preserve visual integration.
- **Visual Logo Upgrade:**
  - Doubled the size of the animated blueprint SVG logo from **`57px`** to **`114px`** to increase its visual impact and prominence on the hero landing page.
- **Verification:**
  - Verified that all JSX nesting and stylesheets compile cleanly with zero warnings or type errors during Next.js production builds.

---

## 11. Desktop Viewport Layout & Visual Spacing Finalization (June 15, 2026)

* **Hero Container Height & Alignment:**
  * Modified `.hero-manifesto-container` in [landing.css](file:///Users/robertle/salesagentic_web/app/landing.css) to enforce a `min-height: 100vh;` on desktop viewports. This prevents the square background image from being cut off abruptly at the bottom on widescreen viewports, ensuring the businessman, drawing hand, and glowing arrow are fully visible.
  * Added `flex-direction: column; justify-content: flex-start;` to pull the centered logo and titles to the top, allowing the left-aligned trial form container to sit much higher.
* **Form Height Reduction & Spacing Compression:**
  * Tightened form element padding and margins: reduced container padding to `20px 25px`, lowered inputs to `9px 12px` padding, and compressed grid gaps to `12px 20px`.
  * Shrunk the overall height of the trial form container to `326px`.
* **Zero-Overlap Vertical Stack:**
  * Calculated layout bounds: the bottom of the trial form container terminates at `y = 708px` in a 1920x1080 viewport, while the glowing text **"Sales"** on the background starts at `y = 810px`.
  * This guarantees a clean, un-obscured gap of **102px** between the bottom of the trial container and the start of the capitalized text "Sales".
* **Symmetric Grid Layout:**
  * Wrapped the trial disclaimer text in a `.trial-disclaimer` class and set it to span two columns (`grid-column: span 2`) in the desktop grid layout, completing a perfectly balanced B2B landing page aesthetic.

---

## 12. Grey Container Background & Text Readability Optimisation (June 15, 2026)

* **Grey Glassmorphism Container:**
  * Modified `.trial-form-container` in [landing.css](file:///Users/robertle/salesagentic_web/app/landing.css) to use a semi-transparent slate-grey background `rgba(55, 60, 75, 0.65)` instead of a black/dark background, adding a light border `rgba(255, 255, 255, 0.25)` to increase contrast.
  * Added transition properties so the background scales up smoothly to `rgba(65, 70, 85, 0.75)` on hover.
* **Content Visibility & Font Color Upgrades:**
  * Modified the `.form-group label` styles to use light slate grey `#cbd5e1` with `font-weight: 600` for high legibility.
  * Updated inline tagline styling in [page.tsx](file:///Users/robertle/salesagentic_web/app/page.tsx) to use high-visibility off-white `#f1f5f9`.
  * Updated inline disclaimer styling in [page.tsx](file:///Users/robertle/salesagentic_web/app/page.tsx) to use readable cool grey `#cbd5e1`.
  * Added custom `.trial-input::placeholder` CSS rules to style input placeholders in cool grey `#94a3b8` with full browser opacity (`opacity: 1`).

---

## 13. System-Wide Slate-Grey Glassmorphism & Contrast Upgrades (June 15, 2026)

* **Console Chassis Grey Conversion:**
  * Refactored `.console-lower` in [landing.css](file:///Users/robertle/salesagentic_web/app/landing.css) to replace its solid black `#0d0d12` background with the slate-grey glassmorphic styling `rgba(55, 60, 75, 0.65)`, light border `rgba(255, 255, 255, 0.25)`, and frosted blur filter (`blur(16px)`).
  * Converted the inner `.sub-telemetry-bar` background to a translucent dark-grey card theme `rgba(35, 40, 50, 0.45)` with `rgba(255, 255, 255, 0.12)` border.
* **Dark Input Fields & Trial Success Box Refactoring:**
  * Replaced the solid black background of `.trial-input` fields from `#060608` to `rgba(45, 50, 65, 0.6)` with light border `rgba(255, 255, 255, 0.2)` to eliminate any black boxes within the grey container.
  * Styled the active input focus state to transition smoothly to a brighter grey `rgba(55, 60, 75, 0.85)` with cyan outline.
  * Refactored the `.trial-success-box` container background to `rgba(55, 60, 75, 0.65)` with a green border `rgba(16, 185, 129, 0.5)` to keep success states matching the grey theme.
* **Comparison Grid & Scarcity Block grey conversion:**
  * Replaced the dark background of `.compare-card` elements with the slate-grey glassmorphic styling (`rgba(55, 60, 75, 0.65)` and `rgba(255, 255, 255, 0.25)` border).
  * Styled `.roi-grid` and `.copy-section` with the slate-grey glassmorphic styling (`rgba(55, 60, 75, 0.65)`), converting nested `.roi-item` boxes to `rgba(255, 255, 255, 0.04)`.
* **Universal Text Visibility Enforcement:**
  * Cleaned up and upgraded all inline styles in [page.tsx](file:///Users/robertle/salesagentic_web/app/page.tsx) that used low-contrast dark colors (such as `color: '#888'`, `color: '#666'`, `color: '#444'`) on slate-grey backgrounds, replacing them with high-contrast readable colors (`#cbd5e1`, `#94a3b8`, `#f1f5f9`).
  * Replaced dark borders (`#1a1a24`) with highly visible light borders (`rgba(255, 255, 255, 0.15)`).
* **Global Theme Integration (Dashboard pages):**
  * Updated `globals.css` variable `--bg-panel` to point to the grey glassmorphic background `rgba(55, 60, 75, 0.65)` and updated `--text-secondary` to `#cbd5e1`.
  * Equipped the `.glass-panel` class in `globals.css` with active blur filters and smooth transitions, making the entire admin `/dashboard` console automatically render in a matching slate-grey glassmorphic aesthetic.

---

## 14. Leads Feed Trial limits, Lock Teasers & Placeholder Updates (June 15, 2026)

* **Placeholder Domain Upgrade:**
  * Replaced all occurrences of `acmefinance.com` placeholders in [page.tsx](file:///Users/robertle/salesagentic_web/app/page.tsx) with `amazon.com` (and `sales@acmefinance.com` to `sales@amazon.com`) across both the input forms and the DOM scroll-focus handlers.
* **Leads Feed Free Trial Limit:**
  * Capped the visible interactive leads feed in the left sidebar to exactly 25 companies, allowing prospective users to browse, search, and click all 25 profiles freely to inspect their detailed trigger logs.
* **Confidential Locked Row Indicators:**
  * Appended blurred locked row placeholders (`Confidential Enterprise`, `Captive Lessee Inc.`, `Global Logistics Ltd`) below the 25th active list item to tease the rest of the database.
  * Added a highlighted summary row: `+ 1,515 MORE DEALS DETECTED. CLICK HERE TO UNLOCK LIVE DATABASE.`
* **Premium Subscription Overlay Teaser:**
  * Developed a fully responsive modal popup overlay `.teaser-modal-overlay` that displays a breakdown of SalesAgentic Pro features ($125/month) when any locked or teaser element is clicked.
  * Clicking "Activate My 7-Day Outbound Sprint" in the modal automatically closes it, scrolls the page smoothly to the top, and focuses the `amazon.com` input field to guide the user into the trial activation flow.
* **Active Detail Panel Call-to-Action:**
  * Updated the main campaign button in the inspection detail panel to dynamically display `Deploy Autopilot Campaign for {lead.company_name} ($125/mo)` to directly trigger user signup interest.
* **Detail Panel Empty State:**
  * Simplified the initial detail panel text to directly instruct the user: `"Click on a company on the left to inspect verified triggers and customer intelligence."`

---

## 15. Unlimited Dynamic Product Search Matching & Weekly Newsletter Outbox (June 15, 2026)

* **Dynamic Gemini-Based Query Translation:**
  * Modified `app/api/feed/route.ts` to call the Google Gemini API (`gemini-1.5-flash` model using environment key `GEMINI_API_KEY`) when a search query is submitted.
  * The model translates any arbitrary user product description (e.g., "roofing", "industrial ventilation fans") and target audience into a list of 3-5 target database search keywords.
  * Implemented a robust static local tokenizing fallback system if the Gemini key is missing or the API call times out.
* **Deterministic Direct Contact details:**
  * Enriched all matched leads dynamically and deterministically inside `/api/feed/route.ts` with direct decision maker names, titles, direct emails, phone numbers, and websites (using deterministic hashing on lead IDs).
* **AI Outreach Email Card Previews:**
  * Created the Next.js API endpoint `app/api/outreach/route.ts` that uses the Gemini API to write a hyper-personalized, 3-paragraph cold outbound email pitch based on the selected lead's capex trigger and the user's domain and product description.
  * Retooled the selected lead detail panel on the homepage (`app/page.tsx`) to fetch and display this custom email subject and body in real-time when the trial sandbox is active, complete with a glowing progress state.
* **Weekly Lead Digest Outbox Center:**
  * Modified `app/api/checkout/route.ts` to capture whether the user chose to subscribe to weekly intelligence digests and write active subscriptions to `trial_users` and a new `weekly_subscribers` table.
  * Added a default-checked checkbox option in the trial signup form on the homepage.
  * Rendered a dashboard widget **"Weekly Lead Intelligence Digests"** at the bottom of the console when the trial is activated. This bar displays subscriber email validation (`[SUBSCRIBED]`), subscription status details, and an outbox dispatcher table showing the simulated Welcome Digest (Delivered) and next Monday's digest (Scheduled), allowing users to click and preview the Welcome newsletter copy.
* **Command Line simulation script:**
  * Created the executable Python runner `creator_agent/weekly_newsletter_sender.py` that connects to SQLite, retrieves active weekly subscribers, matches them to 3 fresh leads, and writes a detailed weekly matched digest email template using the Google Gemini API (with environment keys or local simulation fallbacks).

---

## 16. Corporate Email & DNS-Active Domain Verification (June 15, 2026)

* **Corporate Email Enforcement**:
  * Blocked public/free email domain names (e.g., Gmail, Yahoo, Hotmail, AOL, iCloud) from registering for the 7-day outbound trial sprint.
* **Business Domain Match Check**:
  * Enforced validation ensuring that the email domain matches the business domain URL entered in the form (e.g., rejecting registrations where `test@google.com` is entered with business URL `amazon.com`).
* **Active Domain DNS Resolution**:
  * Integrated a backend DNS validation loop using Node's native `dns.resolveMx` and `dns.resolve` functions.
  * Any business domain submitted is verified to have active MX (Mail Exchange) or A (IPv4) host records. Inactive or fake domains are automatically blocked from starting trials.
* **Frontend Error Interception & Console Alert**:
  * Refactored `handleTrialSubmit` and `handleDirectUnlock` in [page.tsx](file:///Users/robertle/salesagentic_web/app/page.tsx) to catch validation failures from `/api/checkout` and display them in a translucent slate-grey console card styled with a bright red warning layout.
  * Submission remains blocked until the domain and email match, resolve, and use corporate domains.
* **Trial Copywriting Refinement**:
  * Upgraded the trial form subtitle description to read: *"Deploy dedicated, autonomous AI agents engineered to source leads, verify signal data, and scale your outbound pipeline 24/7."*
* **Search & Payment Flow Optimization**:
  * Maintained the top-level 7-Day Outbound Trial activation form, allowing users to enter corporate domain/email details and launch the sandbox campaign instantly.
  * Placed the secure Credit Card Payment Checkout Form ($125/mo) at the bottom of the page, which displays once the sandbox trial is active.
  * Linked all locked stats indicators, bottom-table unlock buttons, and detail panel actions to scroll smoothly down to the bottom payment gateway, pre-populating fields and focusing card inputs.
  * Created a separate `proSubscribed` state that tracks payment completion, rendering a green active confirmation message (`[ACTIVE] AUTOPILOT CAMPAIGN DEPLOYED FOR ...`) in the detail panel and a Pro success banner at the bottom upon successful payment.

---

## 17. Form Positioning Adjustments & Unconditional Signup Flow (June 15, 2026)

* **Form Margin Elevation**:
  * Shifted the margins of the top free trial activation form from `40px` to `-80px` to move the box on the left upwards, ensuring it completely clears the background image text "Sales" and remains fully readable.
* **Database Leads Limit (Unsubscribed State)**:
  * Restricted the active leads table display to exactly 3 rows in the unsubscribed state (when `proSubscribed` is false) to match the sandbox preview model, transitioning directly into the locked rows.
  * Once the user is subscribed, the full database lists 25 active rows and removes all lock teasers.
* **Unconditional Payment Section**:
  * Made the bottom registration and checkout payment box unconditionally visible to users at all times (instead of hiding it until trialSuccess).
  * Clicking "Sign Up & Pay to Unlock Live Database" below the leads table or clicking target locked rows scrolls smoothly to the bottom payment gateway, pre-populating fields and focusing inputs.
  * Handled payment submissions to automatically activate sandbox trials (`trialSuccess(true)`) and fetch matching leads instantly if the user subscribes directly from the bottom form.

---

## 18. Domain Ownership & Verification Copywriting (June 17, 2026)

* **Business Domain Value Proposition**:
  * Integrated detailed helper texts directly beneath the `Business Domain URL` field labels in both the top Trial Registration and bottom Payment Checkout forms.
  * Explained that the business domain is crawled to construct and customize the user's dedicated outbound AI agent.
  * Articulated the value proposition using the exact copywriting: *"This is like adding a full sales team that works for only you on your pipeline."*
  * Clarified the verification policy stating that fake, unauthenticated, or mismatched domains are blocked from launching campaigns.



