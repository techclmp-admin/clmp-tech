# CLMP Subscription Plans — Single Source of Truth

> **Canonical plan IDs (lowercase):** `trial`, `free`, `standard`, `enterprise`
>
> All code, database, Stripe products, and feature flags MUST use these exact IDs.

---

## Plan Tiers

| Plan | DB Value | Display Name | Monthly Price (CAD) | Yearly Price (CAD) | Max Projects | Max Users |
|------|----------|-------------|--------------------|--------------------|-------------|-----------|
| Trial | `trial` | Trial | Free | — | 1 | 5 |
| Free | `free` | Free | $0 | — | 1 | 5 |
| Standard | `standard` | Standard | $400 | $3,840 (20% off) | 10 | 25 |
| Enterprise | `enterprise` | Enterprise | $1,200 | $11,520 (20% off) | 20 | 100 |

### Pricing Notes
- **Standard**: 25% early-adopter discount for the first 12 months
- **Enterprise**: Annual agreement recommended
- Prices are flat monthly fees (NOT per-project)
- All prices in Canadian Dollars (CAD)

---

## Plan Lifecycle

```
New User Signup
      │
      ▼
   ┌──────┐   30 days    ┌──────┐
   │ Trial │ ──────────▶  │ Free │
   └──────┘  (auto)       └──────┘
      │                      │
      │   Stripe checkout    │   Stripe checkout
      ▼                      ▼
 ┌──────────┐          ┌──────────┐
 │ Standard │          │ Standard │
 └──────────┘          └──────────┘
      │
      │   Upgrade via Stripe
      ▼
 ┌────────────┐
 │ Enterprise │
 └────────────┘
      │
      │   Cancel subscription
      ▼
   ┌──────┐
   │ Free │
   └──────┘
```

- **Trial → Free**: Automatic after 30 days (`trial_end_date` expires)
- **Free → Standard/Enterprise**: User completes Stripe checkout
- **Standard → Enterprise**: User upgrades via Stripe billing portal
- **Any paid → Free**: User cancels subscription

---

## Feature Availability

| Feature | Free | Trial | Standard | Enterprise |
|---------|------|-------|----------|------------|
| Project Management | ✓ | ✓ | ✓ | ✓ |
| Task Management | ✓ | ✓ | ✓ | ✓ |
| Team Collaboration | ✓ | ✓ | ✓ | ✓ |
| Kanban Board | ✓ | ✓ | ✓ | ✓ |
| File Management | ✓ | ✓ | ✓ | ✓ |
| Weather Widget | ✓ | ✓ | ✓ | ✓ |
| Calendar View | ✓ | ✓ | ✓ | ✓ |
| Budget & Finance | | | ✓ | ✓ |
| Gantt Chart | | | ✓ | ✓ |
| Chat Rooms | | | ✓ | ✓ |
| OBC Compliance | | | ✓ | ✓ |
| Permit Tracking | | | ✓ | ✓ |
| Inspection Tracking | | | ✓ | ✓ |
| Project Templates | | | ✓ | ✓ |
| Reports & Analytics | | | ✓ | ✓ |
| AI Risk Management | | | | ✓ |
| QuickBooks Integration | | | | ✓ |
| Sage 50 Integration | | | | ✓ |
| Priority Support + SLA | | | | ✓ |
| Dedicated Account Manager | | | | ✓ |
| API Access | | | | ✓ |

> **Note:** Trial has the same feature access as Free — the only difference is the 30-day countdown.

---

## Database Schema

### `profiles` table (primary source for subscription state)
```sql
subscription_plan   TEXT  CHECK (IN ('trial', 'free', 'standard', 'enterprise'))
subscription_status TEXT  CHECK (IN ('active', 'pending', 'suspended', 'cancelled', 'canceled'))
trial_end_date      TIMESTAMPTZ
```

### `subscriptions` table (Stripe subscription details)
```sql
user_id               UUID UNIQUE
plan                  TEXT        -- same canonical IDs: trial, free, standard, enterprise
status                TEXT        -- active, canceled, past_due, etc.
stripe_subscription_id TEXT
stripe_customer_id    TEXT
stripe_price_id       TEXT
current_period_start  TIMESTAMPTZ
current_period_end    TIMESTAMPTZ
```

### `global_feature_settings` / `global_sidebar_settings`
```sql
requires_subscription  TEXT[]  -- e.g. ARRAY['standard', 'enterprise']
```

---

## Stripe Mapping

| Stripe Lookup Key | Plan ID | Billing |
|-------------------|---------|---------|
| `price_standard_monthly` | `standard` | Monthly |
| `price_standard_yearly` | `standard` | Yearly |
| `price_enterprise_monthly` | `enterprise` | Monthly |
| `price_enterprise_yearly` | `enterprise` | Yearly |

**Plan name derivation** (in edge functions):
```
lookup_key → remove "price_" prefix → remove "_monthly" / "_yearly" suffix → plan ID
```

---

## Code Locations

| What | File |
|------|------|
| Plan limits & features | `src/hooks/useSubscription.tsx` |
| Pricing page (homepage) | `src/components/PricingSection.tsx` |
| Billing page plans | `src/components/SubscriptionManager.tsx` |
| Upgrade modal | `src/components/SubscriptionUpgradeModal.tsx` |
| Stripe product setup | `supabase/functions/stripe-setup-products/index.ts` |
| Stripe checkout | `supabase/functions/stripe-checkout/index.ts` |
| Stripe verify session | `supabase/functions/stripe-verify-session/index.ts` |
| Stripe webhook | `supabase/functions/stripe-webhook/index.ts` |
| Feature flags (DB seed) | `supabase/migrations/20260119214112_*.sql` |
| Feature flags (hook) | `src/hooks/useProjectFeatures.tsx` |
| CHECK constraint | `supabase/migrations/20260221000000_standardize_subscription_plans.sql` |

---

## Rules for Contributors

1. **Plan IDs are always lowercase**: `trial`, `free`, `standard`, `enterprise`
2. **Display names are Title Case**: Trial, Free, Standard, Enterprise
3. **Never use** `professional`, `pro`, `business`, or `basic` — these are legacy names
4. **Pricing is flat monthly** — never show "per project" in the UI
5. **Trial and Free have identical limits** (1 project, 5 users)
6. **Feature flag arrays** use the canonical plan IDs: `ARRAY['standard', 'enterprise']`
7. **Stripe lookup keys** follow the pattern: `price_{plan}_{interval}` (e.g. `price_standard_monthly`)
8. **Webhook fallback** plan should be `free`, never `basic`
