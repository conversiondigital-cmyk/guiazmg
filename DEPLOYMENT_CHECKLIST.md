# Deployment Checklist

## Pre-Deployment

- [ ] All environment variables configured
- [ ] Database migrations applied
- [ ] Build passes (`pnpm build`)
- [ ] TypeScript errors: 0
- [ ] ESLint errors: 0

## Security

- [ ] HTTPS enabled (reverse proxy nginx/caddy/cloudflare)
- [ ] Rate limiting active
- [ ] CORS configured
- [ ] Database password changed from default
- [ ] AUTH_SECRET changed from default
- [ ] Mercado Pago keys set to PRODUCTION (not TEST)
- [ ] Google OAuth configured with production URLs

## SEO

- [ ] Robots.txt configured
- [ ] Sitemap generated and submitted to Google Search Console
- [ ] Google Analytics (or similar) configured
- [ ] Meta tags verified on key pages
- [ ] Schema.org JSON-LD verified with Google Rich Results Test

## Monitoring

- [ ] Error tracking configured (Sentry or similar)
- [ ] Uptime monitoring configured
- [ ] Database backup schedule configured (daily)
- [ ] File backup schedule configured (weekly)

## Performance

- [ ] Images optimized
- [ ] Caching headers configured
- [ ] Database indexes verified
- [ ] Lighthouse score > 80

## Production Runbook

### Starting the application

```bash
docker compose up -d
```

### Viewing logs

```bash
docker compose logs -f app
```

### Database backup

```bash
docker exec guiazmg-postgres pg_dump -U root guiazmg > backup_$(date +%Y%m%d).sql
```

### Database restore

```bash
cat backup.sql | docker exec -i guiazmg-postgres psql -U root guiazmg
```

### Updating

```bash
git pull
docker compose build
docker compose up -d
```
