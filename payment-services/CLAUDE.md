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

## Deployment (r740)

### Target Server
- **Server**: r740.webcentricds.net (Dell PowerEdge R740)
- **IP**: 192.168.1.200
- **Architecture**: linux/amd64 (x86_64)
- **Kubernetes**: k3s cluster

### Docker Registry
- **Registry URL**: `192.168.1.200:5000`
- **Protocol**: HTTP only (no HTTPS/TLS)
- **Container**: registry:2 running on Docker
- **Image naming**: `192.168.1.200:5000/<image-name>:<tag>`

### Kubeconfig
- **Config file**: `~/.kube/config-r740`
- **Always use**: `--kubeconfig ~/.kube/config-r740` with kubectl/helm commands

### Environment Variables
Pre-configured via `/Users/denglish/gitDevelopment/github/davealexenglish/initScripts/davesMac/init_exports.sh`:
- `KUBE_HOST=192.168.1.200`
- `KUBE_USERNAME=denglish`
- `KUBE_KUBECONFIG=~/.kube/config-r740`

### Build & Deploy Commands

```bash
# Run from payment-services directory
cd payment-services

# 1. Build images for linux/amd64 (Dockerfiles are in deployments/docker/)
docker build --platform linux/amd64 -f deployments/docker/Dockerfile.backend -t 192.168.1.200:5000/payment-billing-hub-backend:<VERSION> .
docker build --platform linux/amd64 -f deployments/docker/Dockerfile.frontend -t 192.168.1.200:5000/payment-billing-hub-frontend:<VERSION> .

# 2. Push to registry
docker push 192.168.1.200:5000/payment-billing-hub-backend:<VERSION>
docker push 192.168.1.200:5000/payment-billing-hub-frontend:<VERSION>

# 3. Update values.yaml with new version tags
# Edit deployments/helm/payment-billing-hub/values.yaml:
#   backend.image.tag: "<VERSION>"
#   frontend.image.tag: "<VERSION>"

# 4. Deploy with Helm (release name is "billing-hub" in "billing-hub" namespace)
helm upgrade billing-hub ./deployments/helm/payment-billing-hub \
  --kubeconfig ~/.kube/config-r740 \
  -n billing-hub \
  -f deployments/helm/payment-billing-hub/values.yaml
```

### Important Notes
- Always build with `--platform linux/amd64` (r740 is x86_64, dev Mac may be ARM)
- Registry uses HTTP, not HTTPS
- Dockerfiles are in `deployments/docker/` (not in backend/frontend dirs)
- Helm chart is in `deployments/helm/payment-billing-hub/`
- Build context must be `payment-services/` directory (Dockerfiles reference backend/ and frontend/ subdirs)
- **Versioning**: Increment PATCH version only (0.1.2 → 0.1.3), not minor version
- **Namespace**: Always use `billing-hub` namespace (helm release name is also `billing-hub`)
- **Parallel builds**: Build frontend and backend images in parallel when both need to be built

### Useful Commands

```bash
# Check pod status
kubectl get pods -n billing-hub --kubeconfig ~/.kube/config-r740

# Check logs
kubectl logs -n billing-hub -l app=backend --kubeconfig ~/.kube/config-r740
kubectl logs -n billing-hub -l app=frontend --kubeconfig ~/.kube/config-r740

# List helm releases
helm list -n billing-hub --kubeconfig ~/.kube/config-r740

# Rollback if needed
helm rollback billing-hub <REVISION> -n billing-hub --kubeconfig ~/.kube/config-r740
```
