# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Purpose

This repository contains documentation and reference materials for payment platform APIs used at Sinch. The focus is on understanding and comparing three billing/payment platforms:

- **Zuora** - Enterprise subscription billing
- **Stripe** - Payment processing and subscriptions
- **Maxio (Chargify)** - SaaS subscription management

## Key Concepts

The Orders API integrates with these platforms using four core concepts:
- **Account/Customer** - The billable entity
- **Subscription** - Recurring billing relationships
- **Payment** - Transaction processing
- **Amendment** - Modifications to subscriptions (upgrades, downgrades, quantity changes)

## Reference Materials

### OpenAPI Specifications (sibling directories)

```
~/gitDevelopment/github/davealexenglish/payments/
├── stripe/openapi/openapi/
│   └── spec3.yaml                              # Main Stripe spec
├── zuora/
│   ├── zuora-openapi-for-otc.yaml              # Order-to-Cash (recommended)
│   └── zuora_openapi.yaml                      # Full API
└── chargify/
    └── maxio-advanced-billing-openapi31yaml.yaml
```

### Documentation

- `docs/api-comparisons.html` - Side-by-side comparison of Account, Subscription, Payment, and Amendment concepts across all three platforms

## External Documentation

- Zuora: https://developer.zuora.com/
- Stripe: https://stripe.com/docs/api
- Maxio: https://developers.maxio.com/
