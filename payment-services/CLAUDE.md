# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Purpose

Payment Billing Hub - a unified interface for managing connections to multiple billing/payment platforms:

- **Zuora** - Enterprise subscription billing (OAuth: client_id/client_secret)
- **Stripe** - Payment processing and subscriptions (API key)
- **Maxio (Chargify)** - SaaS subscription management (API key + subdomain)

## Build & Development Commands

### Frontend (React + Vite + TypeScript)
```bash
cd frontend
npm install          # Install dependencies
npm run dev          # Development server (hot reload)
npm run build        # Production build (tsc + vite build)
npm run lint         # ESLint
```

### Backend (Go 1.23)
```bash
cd backend
go build ./...                           # Build all packages
go build -o server ./cmd/server          # Build server binary
go run ./cmd/server                      # Run server (requires DATABASE_URL or uses localhost:5432)
```

### Environment Variables
- `DATABASE_URL` - PostgreSQL connection string (default: `postgres://localhost:5432/billing_hub?sslmode=disable`)
- `PORT` - Backend server port (default: `8080`)

## Key Concepts

The Orders API integrates with these platforms using four core concepts:
- **Account/Customer** - The billable entity
- **Subscription** - Recurring billing relationships
- **Payment** - Transaction processing
- **Amendment** - Modifications to subscriptions (upgrades, downgrades, quantity changes)

## Application Architecture

### Tree Structure (Vendor Root Nodes)
The tree view uses a three-tier hierarchy:
1. **Vendor Nodes** (root level) - `vendor-maxio`, `vendor-stripe`, `vendor-zuora`
2. **Connection Nodes** - Individual API connections under each vendor (type: `connection`)
3. **Entity Containers** - Customers, Subscriptions, Products, Invoices under each connection

The "Add Connection" button in the toolbar is only enabled when a vendor node is selected, and the connection dialog is pre-configured for that vendor's platform type.

### Frontend Node Types
- `vendor-*` nodes: Root level vendor groupings (VendorNodes.tsx)
- `connection` nodes: Individual platform connections
- `customers-container`, `products-container`, etc.: Entity groupings
- `customer`, `product`, `subscription`, `invoice`: Individual entities

### Edit vs Create Dialogs
Customer and Product dialogs support both create and edit modes:
- Create mode: Pass `connectionId` only
- Edit mode: Pass `connectionId` + existing entity (`customer` or `product` prop)

### API Endpoints

**Maxio** (`/api/maxio/{connectionId}/...`)
- Customers: GET/POST list, GET/PUT individual
- Products: GET/POST list, GET/PUT individual
- Subscriptions: GET/POST list, GET individual
- Product Families: GET/POST list, GET products by family
- Invoices, Payments: GET list

**Zuora** (`/api/zuora/{connectionId}/...`)
- Accounts: GET list, GET individual (maps to Customers in frontend)
- Subscriptions: GET list, GET individual
- Products: GET list, GET individual (maps to Product Families in frontend)
- Product Rate Plans: GET by product (maps to Products in frontend)
- Invoices, Payments: GET list

### Backend Code Structure
```
backend/
├── cmd/server/main.go           # Entry point, HTTP server setup
└── internal/
    ├── api/
    │   ├── server.go            # Router, Server struct with client caches
    │   ├── handlers.go          # Connection CRUD, tree structure, generic handlers
    │   ├── handlers_maxio.go    # Maxio-specific API handlers
    │   └── handlers_zuora.go    # Zuora-specific API handlers
    ├── db/db.go                 # PostgreSQL connection, migrations
    ├── models/models.go         # Shared types (TreeNode, CreateConnectionRequest, etc.)
    └── platforms/
        ├── maxio/               # Maxio API client + types
        └── zuora/               # Zuora API client + types (OAuth token management)
```

### Frontend Code Structure
```
frontend/src/
├── api.ts                       # All API calls (axios-based)
├── App.tsx                      # Main app, dialogs, tree state management
└── components/
    ├── TreeView.tsx             # Tree rendering, lazy loading, context menus
    ├── Toolbar.tsx              # Top toolbar (Add Connection, Help)
    ├── nodes/                   # Node type handlers (icons, context menus, display names)
    │   ├── index.ts             # Node registry mapping type → handler
    │   ├── VendorNodes.tsx      # vendor-maxio, vendor-stripe, vendor-zuora
    │   ├── PlatformNodes.tsx    # connection nodes
    │   ├── CustomerNodes.tsx    # customers container + customer entities
    │   ├── ProductNodes.tsx     # product-families, product-family, product
    │   └── ...                  # SubscriptionNodes, InvoiceNodes, PaymentNodes
    └── dialogs/                 # Modal dialogs for create/edit operations
```

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
