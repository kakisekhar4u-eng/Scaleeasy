# Scaleeasy — Full Folder Structure (Foundation + Module 1 built, Modules 2–10 scaffolded)

Generated from `Scaleeasy_Handbook_BuildReady_v2_2.md`, Chapter 4 folder structure.

## Status legend

- ✅ **Built** — real, working code
- 🟡 **Scaffolded** — correct file/folder in the right place, with a `// TODO` and a pointer to the handbook section that has the real content

## Full tree

```
scaleeasy/
├── package.json
├── .env.example
├── apps/
│   ├── api/                                       Node/Express backend
│   │   ├── package.json
│   │   └── src/
│   │       ├── index.js                            ✅ wires every module's router
│   │       ├── core/
│   │       │   ├── eventBus.js                      ✅ Ch.5
│   │       │   └── connectorLayer.js                 ✅ Ch.6
│   │       ├── db/
│   │       │   ├── client.js                        ✅
│   │       │   └── migrations/
│   │       │       ├── 001_shared_foundations.sql     ✅
│   │       │       ├── 002_module1_customers.sql       ✅
│   │       │       ├── 003_module_inventory.sql        ✅
│   │       │       ├── 004_module_marketing.sql        ✅
│   │       │       ├── 005_module_catalog.sql          ✅
│   │       │       ├── 006_module_checkout.sql         ✅
│   │       │       ├── 007_module_boutique.sql         ✅
│   │       │       ├── 008_module_orders.sql           ✅
│   │       │       ├── 009_module_logistics.sql        ✅
│   │       │       ├── 010_module_intelligence.sql     ✅
│   │       │       └── 011_module_connectors.sql       ✅ (no new tables — see file)
│   │       ├── shared/utils/logger.js                ✅
│   │       └── modules/
│   │           ├── customers/     (Module 1)          ✅ routes.js, service.js, events.js
│   │           ├── inventory/     (Module 2)           ✅ routes.js, service.js, events.js
│   │           ├── marketing/     (Module 3)           ✅ routes.js, service.js, events.js
│   │           ├── catalog/       (Module 4)           ✅ routes.js, publicRoutes.js (no-auth), service.js
│   │           ├── checkout/      (Module 5)           ✅ routes.js, service.js, events.js
│   │           ├── boutique/      (Module 6 + 6A)       ✅ routes.js, publicRoutes.js, service.js, events.js
│   │           ├── orders/        (Module 7)            ✅ routes.js, service.js, events.js
│   │           ├── logistics/     (Module 8)            ✅ routes.js, webhookRoutes.js, service.js, events.js
│   │           ├── intelligence/  (Module 9)            ✅ routes.js, service.js, events.js
│   │           └── connectors/    (Module 10)           ✅ routes.js, service.js, events.js
│   └── web/                                        React frontend
│       └── src/
│           ├── shared/
│           │   ├── components/    Card, Snapshot, NextBestAction,
│           │   │                  StatusBadge, QuickActions           🟡 (Ch.10)
│           │   ├── hooks/
│           │   └── utils/
│           └── modules/
│               ├── customers/     (Module 1)          ✅ pages/CustomerProfilePage.jsx, services/customerApi.js
│               ├── inventory/     (Module 2)           ✅ pages/ProductProfilePage.jsx, services/productApi.js
│               ├── marketing/     (Module 3)           ✅ pages/CampaignBuilderPage.jsx, services/campaignApi.js
│               ├── catalog/       (Module 4)           ✅ pages/PublicCatalogPage.jsx, services/publicCatalogApi.js
│               ├── checkout/      (Module 5)           ✅ pages/CheckoutPage.jsx, services/checkoutApi.js
│               ├── boutique/      (Module 6 + 6A)       ✅ pages/BlueprintPage.jsx, StandaloneTryOnPage.jsx
│               ├── orders/        (Module 7)            ✅ pages/OrdersListPage.jsx, services/orderApi.js
│               ├── logistics/     (Module 8)            ✅ pages/ShipmentStatusPage.jsx, services/shipmentApi.js
│               ├── intelligence/  (Module 9)            ✅ pages/DashboardPage.jsx, services/intelligenceApi.js
│               └── connectors/    (Module 10)           ✅ pages/ConnectorsPage.jsx, services/connectorApi.js
```

## Note on Module 6A (AI Style Studio)

The handbook doesn't give Style Studio its own top-level folder — its APIs live under `/customers/:id/style-studio` and `/customers/:id/looks`, so its backend code belongs inside `modules/boutique/` (or `modules/customers/`) rather than a separate folder. Build it there when you get to Module 6.

## Note on the Catalog ↔ tryon2buy pipeline (added when building Module 4)

This is the actual purpose of the AI layer + tryon2buy connector working together, not two separate features:

1. A product gets uploaded (through Module 2's endpoint today — could be any path later) → emits `ProductCreated`
2. Module 4 (Catalog) reacts to that event automatically: tryon2buy renders a clean catalog photo from the raw uploaded image, and the AI layer writes a description — neither requires a human to trigger them (text description generation defaults to free rule-based templates — see `core/aiEngine.js` — tryon2buy's image rendering is the one part of this pipeline with a real, unavoidable cost)
3. That same rendered image doubles as the garment reference for **two different try-on surfaces**:
   - Module 6A: try-on inside the logged-in customer's Scaleeasy profile
   - `modules/boutique/publicRoutes.js`: a **standalone, no-login try-on page** any visitor can use directly, or a store can `<iframe>` into their own external website
4. A simple in-process poller (`apps/api/src/index.js`) checks every 10 seconds for tryon2buy jobs that have finished rendering — documented as an MVP-only approach, same limitation as the Event Bus (Ch.5): fine for one server, needs a real job queue before running multiple instances

This is decoupled deliberately: Catalog doesn't need Inventory's full stock-tracking workflow to trigger rendering — only that a product row exists.

## Empty folders and Git

Git doesn't track empty folders, so every empty `components/`, `hooks/`, `pages/`, `services/` folder has a `.gitkeep` placeholder file in it — that's normal, leave it there until you add real files.

## Build order

**All 10 modules are built.** Every route, migration, and event listener described above is real, working code — not placeholders — with one honest exception: the shared frontend components (`Card`, `Snapshot`, `NextBestAction`, `StatusBadge`, `QuickActions`) were scaffolded early on and never individually filled in, since each page ended up styling itself directly rather than needing them. Safe to build those out later if you want shared styling consistency, or just leave them — nothing depends on them being real.

**What "done" means here, honestly:** this is a complete, correctly-wired backend + a working page per module, following the handbook's architecture exactly, including every fix from the earlier audit. It is **not** yet: a stitched-together app with real navigation and login (Phase 6 in the Master Build Guide covers what's left), tested against real traffic, or running anywhere live. See the Master Build Guide for what happens next.
