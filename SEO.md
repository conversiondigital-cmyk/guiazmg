# SEO Guide

## Architecture

- **Dynamic sitemap** (`/sitemap.xml`): includes all active businesses, categories, municipalities, neighborhoods, marketplace listings, and SEO landing pages
- **Robots.txt** served at `/robots.txt`
- **Canonical URLs** via `NEXT_PUBLIC_URL`
- **JSON-LD structured data** on business profiles (Schema.org LocalBusiness)
- **SEO landing pages** via `[...seoSlug]` catch-all route (`/dentistas-zapopan`, `/restaurantes-guadalajara`)

## URL Structure

| Pattern | Example |
|---------|---------|
| Home | `guiazmg.com` |
| Search | `guiazmg.com/search?q=dentista` |
| Category | `guiazmg.com/categoria/dentistas` |
| Municipality | `guiazmg.com/municipio/zapopan` |
| SEO Landing | `guiazmg.com/dentistas-zapopan` |
| Neighborhood | `guiazmg.com/zapopan/la-estancia` |
| Business | `guiazmg.com/negocio/dentalcare-zapopan` |
| Marketplace | `guiazmg.com/marketplace/servicios/lavado-de-coche` |

## Sitemap Routes

1. Static: `/`, `/search`, `/marketplace`, `/feed`, `/planes`
2. Categories: all active categories
3. Municipalities: all active municipalities
4. SEO Landings: every category × every municipality combination
5. Neighborhoods: all neighborhoods with parent municipality
6. Businesses: all active, non-deleted businesses
7. Marketplace: all active, non-deleted listings

## Google Search Console

1. Verify domain ownership
2. Submit sitemap: `https://guiazmg.com/sitemap.xml`
3. Submit robots.txt: `https://guiazmg.com/robots.txt`
4. Monitor Core Web Vitals

## Optimization Tips

- Keep business titles under 60 chars for SERP
- Each SEO landing page has unique H1, meta description
- Business profiles include Schema.org LocalBusiness markup
- Images use descriptive alt text
- Internal linking between related categories and neighborhoods
