# Security Guide

## Headers

All responses include (via `src/proxy.ts`):

- `Content-Security-Policy` — Restricts scripts, styles, fonts, connections
- `X-Content-Type-Options: nosniff` — Prevents MIME sniffing
- `X-Frame-Options: DENY` — Prevents clickjacking
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` — Restricts camera, microphone, geolocation

## Authentication

- Auth.js v5 with credentials + Google OAuth
- JWT stored in HTTP-only, secure cookies
- Sessions validated on every request via proxy (Edge)
- Protected routes: `/dashboard/*`, `/admin/*`, `/agente/*`, `/editor/*`

## Authorization

| Role | Access |
|------|--------|
| `USER` | Dashboard, marketplace, profile |
| `BUSINESS_OWNER` | Dashboard + business management |
| `EDITOR` | Editor panel (approve/reject businesses & reviews) |
| `SALES_AGENT` | Agent CRM |
| `ADMIN` | Full access |

## API Security

| Layer | Mechanism |
|-------|-----------|
| CORS | Whitelist of allowed origins in proxy |
| CSRF | Token-based via `csrf.ts` for state-changing requests |
| Rate Limiting | In-memory limiter via `rate-limit.ts` (per-IP, sliding window) |
| Validation | Zod schemas for all API inputs via `validation.ts` |
| Encryption | AES-256-GCM via `encryption.ts` for sensitive data |

## Production Checklist

- [ ] `AUTH_SECRET` is a long (32+ chars), unique, random string
- [ ] Cookies use `Secure` flag in production (automatic via HTTPS)
- [ ] CORS origin list contains only production domains
- [ ] Rate limits tuned for expected traffic
- [ ] Webhook signatures validated
- [ ] Database credentials use least-privilege user
- [ ] All admin actions logged to `AuditLog`
- [ ] Secrets never committed to git (`.env*` in `.gitignore`)
