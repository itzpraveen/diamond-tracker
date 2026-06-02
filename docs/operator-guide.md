# Diamond Tracker Operator Guide

This guide is for new staff using the Diamond Tracker admin web and mobile app. It explains what each role does, where to find the main screens, and how to move items through vouchers without breaking the item history.

## Core Idea

Every item has one current status. Every handover must be recorded by scanning the item or processing a voucher. The system keeps the status history, current holder, factory, voucher, incidents, and audit trail.

Use the system rule below:

1. Create the item once.
2. Print or scan the item label.
3. Move the item only through the correct next route.
4. Use vouchers for bulk movement.
5. Report incidents immediately when something does not match.

## Main Screens

- Dashboard: daily exceptions, overdue returns, delayed vouchers, factory queue, and recent activity.
- Items: search and filter all items by status, factory, job ID, phone, date, or attention queue.
- Item detail: full item information, photos, current holder, item journey, scan history, incidents, label download, and admin edit.
- Vouchers: create vouchers, scan items into vouchers, process a whole voucher, download voucher Excel, archive or restore vouchers.
- Incidents: open and resolve mismatches, missing items, duplicate scans, damage, or other issues.
- Audit: review scan and handover history.
- Settings: manage factories.
- Users: manage users and roles.

## Roles

### Admin

Admin can manage users, edit item data, perform overrides, archive or restore records, and review all operations. Admin overrides must always include a reason.

### Purchase

Purchase creates the item record.

Typical work:

1. Open Items.
2. Create a new item.
3. Enter customer, phone, item description, source, repair type, weight/value, factory if known, target return date, and photos.
4. Save the item.
5. Download or print the item label.

Initial status: `PURCHASED`.

### Packing

Packing prepares the item for movement.

Typical work:

1. Scan the item label.
2. Confirm the item and cover match the label.
3. Move the item to `PACKED_READY`.

### Dispatch

Dispatch issues packed items to factory.

Typical work:

1. Open Vouchers.
2. Create an `Issue to Factory` voucher.
3. Select the correct factory.
4. Open the voucher.
5. Scan `PACKED_READY` items into the voucher.
6. Confirm issue date and expected return date.
7. Issue the voucher.

Route: Present Location -> Factory.

Target status: `DISPATCHED_TO_FACTORY`.

### Factory

Factory confirms receipt of items sent from present location.

Typical work:

1. Open Vouchers.
2. Create or open a `Receive at Factory` voucher.
3. Select the factory.
4. Scan items that were issued to that factory.
5. Process the voucher.

Route: Present Location -> Factory.

Target status: `RECEIVED_AT_FACTORY`.

### QC / Stock

QC receives items back from factory and moves them to stock or delivery.

Factory receive from QC side:

1. Open Vouchers.
2. Create a `Receive from Factory` voucher.
3. Select the factory.
4. Open the voucher and scan returned items.
5. Process the voucher.

Route: Factory -> Present Location.

Target status: `RECEIVED_AT_SHOP`.

QC to Stock:

1. Open Vouchers.
2. Create a `QC to Stock` voucher.
3. Scan items already received at present location.
4. Process the voucher.

Route: Quality Control -> Stock.

Target status: `ADDED_TO_STOCK`.

QC to Delivery:

1. Open Vouchers.
2. Create a `QC to Delivery` voucher.
3. Scan items already received at present location or added to stock.
4. Process the voucher.

Route: Quality Control -> Delivery.

Target status: `HANDED_TO_DELIVERY`.

### Delivery

Delivery marks the final customer handover.

Typical work:

1. Scan the item.
2. Confirm the customer/item details.
3. Mark the item as `DELIVERED_TO_CUSTOMER`.

## Voucher Routes

Each voucher has one saved route. When processing a voucher, scan or enter only the voucher code; the system uses the route saved on that voucher automatically.

| Voucher route | Source | Destination | Items expected before processing | Target status |
| --- | --- | --- | --- | --- |
| Issue to Factory | Present Location | Factory | `PACKED_READY` | `DISPATCHED_TO_FACTORY` |
| Receive at Factory | Present Location | Factory | `DISPATCHED_TO_FACTORY` | `RECEIVED_AT_FACTORY` |
| Receive from Factory | Factory | Present Location | `DISPATCHED_TO_FACTORY`, `RECEIVED_AT_FACTORY`, or `RETURNED_FROM_FACTORY` | `RECEIVED_AT_SHOP` |
| QC to Stock | Quality Control | Stock | `RECEIVED_AT_SHOP` | `ADDED_TO_STOCK` |
| QC to Delivery | Quality Control | Delivery | `RECEIVED_AT_SHOP` or `ADDED_TO_STOCK` | `HANDED_TO_DELIVERY` |

## Daily Operations Checklist

Start every day from Dashboard.

1. Check Open Incidents.
2. Check Overdue Returns.
3. Check Delayed Vouchers.
4. Check Currently At Factory.
5. Check Awaiting Closure.
6. Open each queue and process the oldest items first.

Recommended order:

1. Resolve incidents.
2. Follow up delayed factory vouchers.
3. Receive returned factory items.
4. Move QC items to stock or delivery.
5. Close delivered or completed work.

## How To Process a Voucher

1. Open Vouchers.
2. Find or create the correct voucher route.
3. Open the voucher.
4. Scan items into the voucher.
5. Check the Voucher Journey panel:
   - Ready for this route: items that can be processed now.
   - Processed or later: items already at the target status or further ahead.
   - Needs review: items that do not match the voucher route.
6. Enter the voucher code in Process Voucher.
7. Click Process Voucher.
8. Confirm the success message and item count.

Do not change the route while processing. A voucher route is fixed when the voucher is created.

## How To Read an Item

Open Items, then open the job ID.

Use these areas:

- Current status badge: where the item is now.
- Holder panel: which role/user currently holds the item.
- Item Journey: the normal chain of custody and which steps are done, current, or pending.
- Latest scans: recent scan events, remarks, and override reasons.
- Details panel: customer, factory, source, repair type, value, weights, voucher number, notes, and photos.

## Incidents

Create an incident immediately for:

- label mismatch
- missing item
- duplicate scan
- damage
- wrong factory
- item in the wrong cover
- item status not matching the physical location

Use a clear description. If photos are available, add them to the item record or incident workflow as applicable.

## Admin Overrides

Only Admin should use overrides.

Use override only when:

- a status was recorded incorrectly
- an item needs to go on hold
- an item must be cancelled
- a manual correction is needed after verification

Every override needs a reason. The reason is stored in the audit history.

## Troubleshooting

### "Item is not at expected status"

The item is not ready for the selected voucher route. Open the item detail and check Item Journey.

Example: `QC to Stock` expects `RECEIVED_AT_SHOP`. If the item is still `RECEIVED_AT_FACTORY`, first process `Receive from Factory`.

### "Voucher factory does not match"

The item or voucher belongs to another factory. Check the item factory and voucher factory before scanning again.

### "Item already in voucher"

The item was already scanned into this voucher. Open the voucher and check the item list.

### "Voucher has no items"

Open the voucher and scan items into it before processing.

### "Factory id required"

The selected route requires a factory. Select a factory when creating the voucher or before scanning items.

## Good Operating Habits

- Always scan. Do not move items physically without updating the system.
- Keep each item in its own labelled cover.
- Use the voucher Excel download for handover records.
- Review delayed vouchers daily.
- Resolve incidents before continuing normal movement.
- Use item detail before admin override.
- Keep factory selection accurate.
