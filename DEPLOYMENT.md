# Deployment Guide

## Environments

| Environment | URL | Database |
|-------------|-----|----------|
| Development | http://localhost:3100 | local PostgreSQL |
| Staging | https://staging.guiazmg.com | Staging PostgreSQL |
| Production | https://guiazmg.com | Production PostgreSQL |

## Option 1: Vercel (Recommended for MVP)

1. Push repo to GitHub
2. Import project in Vercel
3. Set environment variables from `.env.production`
4. Set build command: `npm run build`
5. Set framework preset: Next.js
6. Connect database (see Database section)

### Vercel Environment Variables

At minimum, configure these in Vercel:

- `DATABASE_URL` pointing to your external PostgreSQL
- `AUTH_SECRET`
- `AUTH_URL` and `NEXT_PUBLIC_URL` with your production domain
- `NEXT_PUBLIC_APP_URL` with your production domain
- `STORAGE_PROVIDER=s3`, `r2` or `supabase`

Then add the matching storage credentials for the provider you picked.

### Database Options

- **Supabase** (recommended): PostgreSQL + auth + storage in one
  - Create project, copy connection string to `DATABASE_URL`
  - Run `npx prisma migrate deploy` to apply migrations
  - Run `npm run seed:production`

- **Neon**: Serverless PostgreSQL with branching
  - Same process as Supabase for DB

## Option 2: Docker VPS (More Control)

```bash
# Clone on server
git clone https://github.com/your-org/guiazmg.git
cd guiazmg

# Copy production env
cp .env.production .env

# Start services
docker compose -f docker-compose.yml up -d postgres

# Build & start app
npm install
npx prisma generate
npx prisma migrate deploy
npm run seed:production
npm run build
npm run start
```

Recommended: Use PM2 or systemd to keep the process alive.

## Option 3: AWS (Scalable)

- **Compute**: ECS Fargate or EC2 behind ALB
- **Database**: RDS PostgreSQL
- **Storage**: S3 (set `STORAGE_PROVIDER=s3`)
- **CDN**: CloudFront
- **Cache**: ElastiCache Redis

## SSL / HTTPS

- Vercel: automatic
- VPS: use Caddy (auto HTTPS) or Nginx + Certbot
- AWS: ACM certificate on CloudFront/ALB

## Post-Deployment Checklist

- [ ] Domain DNS configured (A/AAAA or CNAME)
- [ ] SSL certificate valid
- [ ] All env vars set in production
- [ ] Database migration deployed (`prisma migrate deploy`)
- [ ] Production seed run
- [ ] Backups configured
- [ ] Monitoring active (Sentry + uptime)
- [ ] Google OAuth configured for production domain
- [ ] Mercado Pago prod credentials (APP_USR)
- [ ] SMTP configured for transactional emails
- [ ] Storage provider configured (`s3`, `r2` or `supabase`) for production
- [ ] Sitemap submitted to Google Search Console
- [ ] `robots.txt` allows production crawlers
