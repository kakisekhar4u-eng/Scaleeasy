# Scaleezy Logistics: Vercel preview

A static, browser-only demo of Scaleezy Logistics, matching Product Spec v0.1. It shows the phase 1 product: bring-your-own-courier booking on Delhivery, Shiprocket and Xpressbees, with owner, staff and Scaleezy admin roles.

## Deploy

Upload this folder to a Vercel project, or import the repo with Root Directory `logistics-preview`. Use Framework Preset "Other". No build step and no environment variables are needed.

## Roles

Use the "view as" picker at the top (phone) or in the sidebar (desktop) to switch roles. This picker exists only in the demo; the live product signs each person in with their own role.

- Owner: everything below, plus courier connections, business details, pickup addresses, the team, returning failed parcels and cash on delivery owed by couriers.
- Staff: compare and book, labels, pickups, tracking links, cancel before pickup, and try again or update details on failed deliveries. Courier accounts are view only.
- Scaleezy admin: a separate console with an overview, all sellers (suspend or reactivate), courier health and the courier call log with an audit log. Customer names, addresses and phones never appear here. One seller is the demo business in this browser; the other five are made-up examples.

## What the seller side covers

- Setup: business, owner name, GSTIN and pickup address, or one tap to load a sample boutique with an owner and one staff member.
- Couriers: connect Delhivery, Shiprocket (with Ekart and Shadowfax behind it) and Xpressbees by pasting credentials, with a simulated connection test. Blue Dart, direct Ekart and Shadowfax accounts, and ONDC are listed as coming soon.
- Ship a parcel: pickup PIN to delivery PIN, package presets, size-based (volumetric, divisor 5000) billed weight, prepaid or cash on delivery. Results show every connected courier that covers the route with price, arrival date and cheapest or fastest tags, and list the couriers that can't take the parcel with the reason.
- Book: customer details, then a tracking number and a 4 x 6 inch test label that prints at label size.
- Shipments: filters, search, and who booked each parcel.
- Shipment detail: pickup scheduling, a tracking link (copy or WhatsApp), cancel before pickup, a timeline in Scaleezy's standard statuses with each courier's own status text, and failed-delivery decisions.
- Customer tracking page at `#track-<tracking number>`.
- Demo controls on each shipment stand in for courier updates.

## Limits

- Couriers, prices, coverage, courier health figures and tracking numbers are simulated. Nothing is sent anywhere.
- Data is saved in this browser's localStorage only. Customer tracking links open only in the same browser.
- Courier credentials typed into the connect screens are not stored.
- PIN-to-region names are approximate, from the first digits of the PIN.
- Labels say "Not valid for shipping".
