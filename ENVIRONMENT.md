# Environment Variables

## Required

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `AUTH_SECRET` | Encryption secret (min 32 chars) |
| `AUTH_URL` | Public URL of the app |
| `NEXT_PUBLIC_URL` | Public URL for client components |

## Auth (Optional)

- `AUTH_GOOGLE_ID` — Google OAuth client ID
- `AUTH_GOOGLE_SECRET` — Google OAuth client secret

## Payments

| Variable | Required | Description |
|----------|----------|-------------|
| `MERCADO_PAGO_ACCESS_TOKEN` | Yes | Mercado Pago access token (TEST_ or APP_USR_) |
| `MERCADO_PAGO_PUBLIC_KEY` | Yes | Mercado Pago public key |
| `MERCADO_PAGO_WEBHOOK_SECRET` | Yes | Webhook secret for signature validation |
| `STRIPE_SECRET_KEY` | No | Stripe secret key (optional alternative) |
| `STRIPE_PUBLIC_KEY` | No | Stripe publishable key |
| `STRIPE_WEBHOOK_SECRET` | No | Stripe webhook signing secret |

## SMTP (for Email)

| Variable | Required | Description |
|----------|----------|-------------|
| `SMTP_HOST` | No | SMTP server hostname |
| `SMTP_PORT` | No | SMTP port (default: 587) |
| `SMTP_USER` | No | SMTP username |
| `SMTP_PASS` | No | SMTP password |
| `SMTP_FROM` | No | From address (default: noreply@guiazmg.com) |

## Storage

| Variable | Default | Description |
|----------|---------|-------------|
| `STORAGE_PROVIDER` | `local` | One of: local, s3, r2, supabase |
| `S3_ACCESS_KEY_ID` | — | AWS/R2 access key |
| `S3_SECRET_ACCESS_KEY` | — | AWS/R2 secret key |
| `S3_BUCKET` | `guiazmg` | S3 bucket name |
| `S3_REGION` | `us-east-1` | AWS region |
| `S3_PUBLIC_URL` | — | Public CDN URL |
| `S3_ENDPOINT` | — | Custom endpoint (for R2) |
| `SUPABASE_URL` | — | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | — | Supabase service role key |
| `SUPABASE_STORAGE_BUCKET` | `guiazmg` | Supabase storage bucket |

## Production Notes

- On Vercel, set `DATABASE_URL` to your external PostgreSQL provider.
- In production, `STORAGE_PROVIDER` must be `s3`, `r2` or `supabase`.
- Do not rely on local filesystem uploads in production.

## Monitoring

- `SENTRY_DSN` — Sentry project DSN (optional)

## Cache

- `REDIS_URL` — Redis connection string (optional, falls back to in-memory)

## Environment Files

| File | Environment | Used In |
|------|-------------|---------|
| `.env` | Local dev | Loaded by Next.js by default |
| `.env.development` | Development | `NODE_ENV=development` |
| `.env.staging` | Staging | Deployed staging |
| `.env.production` | Production | Deployed production |
