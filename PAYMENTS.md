# Payments Guide

## Mercado Pago (Primary)

### Setup

1. Create a Mercado Pago account (business)
2. Get credentials: Dashboard → Your integrations → Credentials
3. Set env vars:

```
MERCADO_PAGO_ACCESS_TOKEN=APP_USR-xxx
MERCADO_PAGO_PUBLIC_KEY=APP_USR-xxx
MERCADO_PAGO_WEBHOOK_SECRET=your-webhook-secret
```

### Webhook

Configure webhook URL in Mercado Pago dashboard:
`https://guiazmg.com/api/webhooks/mercadopago`

Events: `payment`, `merchant_order`

### Idempotency

All payment webhooks use idempotency keys to prevent duplicate processing.
See `src/lib/idempotency.ts`.

## Stripe (Alternative)

### Setup

1. Create Stripe account
2. Get API keys: Dashboard → Developers
3. Set env vars:

```
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_PUBLIC_KEY=pk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

### Webhook

`https://guiazmg.com/api/webhooks/stripe`

Events: `checkout.session.completed`, `invoice.paid`, `customer.subscription.updated`

## Payment Models

| Model | Purpose |
|-------|---------|
| `Payment` | Generic payment record (all providers) |
| `MercadoPagoPayment` | MP-specific data (preference_id, status, etc.) |
| `Invoice` | Billing invoice |
| `Transaction` | Credit/debit transaction log |

## Testing

### Mercado Pago Test Cards

| Card | Number | Result |
|------|--------|--------|
| Approved | `5031 7557 3453 0604` | Payment approved |
| Declined | `5031 7557 3453 0604` (use specific amount) | Payment declined |
| Pending | depends on amount | Payment pending |

Use `TEST-` credentials in development/staging.

### Stripe Test Cards

| Card | Number | Result |
|------|--------|--------|
| Success | `4242 4242 4242 4242` | Payment succeeds |
| Decline | `4000 0000 0000 0002` | Payment declined |

Use `sk_test_` / `pk_test_` credentials in development/staging.
