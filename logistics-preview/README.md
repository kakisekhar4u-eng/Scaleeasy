# Scaleezy Logistics: Vercel preview

A static, browser-only demo of Scaleezy Logistics, matching Product Spec v0.1. It shows the phase 1 product: bring-your-own-courier booking on Delhivery, Shiprocket and Xpressbees.

## Deploy

Upload this folder to a Vercel project. Use Framework Preset "Other" and Output Directory `.`. No build step and no environment variables are needed.

## What the demo covers

- Setup: business, GSTIN and pickup address, or one tap to load a sample boutique.
- Couriers: connect Delhivery, Shiprocket (with Ekart and Shadowfax behind it) and Xpressbees by pasting credentials, with a simulated connection test. Blue Dart, direct Ekart and Shadowfax accounts, and ONDC are listed as coming soon.
- Ship a parcel: pickup PIN to delivery PIN, package presets, size-based (volumetric, divisor 5000) billed weight, prepaid or cash on delivery. Results show every connected courier that covers the route with price, arrival date and cheapest or fastest tags. Couriers that can't take the parcel are listed with the reason.
- Book: customer details, then a tracking number and a 4 x 6 inch test label that prints at label size.
- Shipments: filters (needs action, to pick up, on the way, delivered, returns, closed), search, and the cash on delivery still owed by couriers.
- Shipment detail: pickup scheduling, a tracking link (copy or WhatsApp), cancel before pickup, a timeline in Scaleezy's standard statuses with each courier's own status text, and failed-delivery decisions (try again, update details, return to me).
- Customer tracking page at `#/track/<tracking number>`.
- Demo controls on each shipment stand in for courier updates: next update, fail delivery, report lost, mark cash paid out.

## Limits

- Couriers, prices, coverage and tracking numbers are simulated. Nothing is sent anywhere.
- Data is saved in this browser's localStorage only. Customer tracking links open only in the same browser.
- Courier credentials typed into the connect screens are not stored.
- PIN-to-region names are approximate, from the first digits of the PIN.
- Labels say "Not valid for shipping".
