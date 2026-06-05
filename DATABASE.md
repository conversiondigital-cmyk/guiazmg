# Database Guide

## Schema

52 models covering:

- **Users & Auth**: User, Account, Session, VerificationToken
- **Businesses**: Profile, ProfileMembership, ProfileBadge, ProfileAnalyticsDaily, ProfileHour, Review
- **Categories**: Category, Subcategory
- **Locations**: Country, State, City, Municipality, Neighborhood
- **Payments**: Payment
- **Marketplace**: MarketplaceCategory, MarketplaceListing, SellerReview
- **CRM**: Lead, LeadEvent, SalesAgent, SalesCommission
- **Marketing**: PromotionCoupon, Referral, Coupon
- **Content**: SeoLandingPage and app content pages
- **Notifications**: Notification
- **Infrastructure**: SearchLog, EmailLog, IdempotencyKey, AuditLog

## Migrations

```bash
# Create a migration after schema changes
npm run db:migrate

# Deploy migrations (production)
npm run db:migrate:deploy

# Push schema directly (dev only, avoid in shared/prod DBs)
npm run db:push -- --accept-data-loss
```

**Never modify production manually.** Always use Prisma Migrate.

## Seeds

| Command | What it creates |
|---------|----------------|
| `npm run seed:base` | Municipalities, categories, neighborhoods, plans, boosts, coupons, badges, admin user |
| `npm run seed:demo` | Sample businesses for testing |
| `npm run seed:production` | Admin user + membership plans for production deploy |

## Backup

```bash
# Manual backup
npm run backup:daily

# Automated (cron)
0 2 * * * cd /app && npm run backup:daily    # daily at 2am
0 2 * * 0 cd /app && npm run backup:weekly   # weekly Sunday
0 2 1 * * cd /app && npm run backup:monthly  # monthly 1st
```

Backups stored in `./backups/daily|weekly|monthly` with retention:
- Daily: 30 days
- Weekly: 12 weeks
- Monthly: 12 months

### Restore

```bash
bash scripts/backup.sh restore ./backups/daily/guiazmg_20260301_020000.sql.gz
```

## Optimization

- pg_trgm GIN index on `businesses.search_vector` for full-text search
- Indexes on all foreign keys and frequently queried columns
- Use `select` and `include` carefully — avoid N+1 queries
- Paginate all list endpoints
- Use `EXPLAIN ANALYZE` for slow queries
