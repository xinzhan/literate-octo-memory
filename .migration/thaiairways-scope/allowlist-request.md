# Request: temporary Cloudflare allowlisting for a site-structure analysis of thaiairways.com

## Purpose
We are scoping a migration of thaiairways.com to Adobe Experience Manager (Edge Delivery Services).
To do this we run an automated, **read-only** structural analysis. A headless browser visits each public
page once. It records the page's layout and components and takes screenshots of representative
components, so we can size the templates and blocks the new site needs.

At present, Cloudflare bot protection blocks this analysis (HTTP 403, or a "Service Notice – Under
Maintenance" page) after a few pages. That happens even at the pace robots.txt asks for.

## What we'd like allowlisted

| Item | Value |
|---|---|
| Source IP | `54.90.51.39` (AWS us-east-1). **This may change if our analysis environment restarts.** If you prefer not to depend on the IP, see "Alternative" below. |
| User-Agent | `Mozilla/5.0 (compatible; site-scope/1.0; +layout-discovery)`. Every request from the analysis uses this exact string. |
| Host | `www.thaiairways.com` |
| Suggested rule | Cloudflare WAF custom rule: `(ip.src eq 54.90.51.39 and http.user_agent eq "Mozilla/5.0 (compatible; site-scope/1.0; +layout-discovery)")`, with action **Skip** for bot protection (Super Bot Fight Mode / Bot Management), rate limiting and managed rules. The skip options depend on your Cloudflare plan. Note that the free-plan "Bot Fight Mode" cannot be skipped by a custom rule. |
| Window | Please allow about **5 days** from the agreed start date. We'll tell you when we finish, so the rule can be removed. |

**Alternative (IP-independent):** you issue a secret request-header value, for example
`X-Scope-Token: <random value>`, and the rule matches on that header plus the User-Agent. We'll send
the header only on requests to `www.thaiairways.com`.

## What the analysis will and won't do

- **Pages visited:** only the public URLs listed in your robots.txt sitemaps. That's 40,532 pages:
  15,752 across 44 locale sites and 24,780 `/flights/…` route pages.
- **Rate:** one page at a time, at least **5 seconds apart**, following your `Crawl-Delay: 5`.
  That's no more than about 720 page views per hour. Each page also loads its normal assets (images,
  CSS, JS) like a regular visit.
- **Total volume:** about 41,000 page views. That's one pass over every page, plus a few hundred
  revisits for component screenshots and about 60 pages sampled to note which APIs the pages call.
- **robots.txt:** we never navigate to disallowed paths (`/booking/*`, `/*/checkin/*`, `/bin/*`,
  `/app/rop/api/`, URLs with query strings, and so on). Pages we visit may make their own normal
  background calls, just as they do for any visitor.
- **Read-only:** no logins, no form submissions, no bookings, and no interaction beyond scrolling
  to trigger lazy-loaded content.
- **Data kept:** page structure, component screenshots and the names of third-party services the
  pages load. No personal data is collected.

## Contact
<!-- add the requester's name / email / engagement reference before sending -->
