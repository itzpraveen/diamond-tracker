# Operator Guide

This guide defines standard operating procedures for each role. All handovers must be performed by scanning the label and recording the next status.

## Global Rules

- One item = one plastic cover + one sticker label.
- Never mix items between covers or batches.
- Every handover must scan and update status; no skipping.
- Any mismatch or damage must be reported as an Incident immediately.
- Overrides require Admin role and a mandatory reason.
- Audit records are immutable.

## Roles

### Admin
- Manage users and roles.
- Perform overrides (ON_HOLD, CANCELLED, or forced transitions) with reason.
- Review audit log and incidents.

### Purchase
- Create job with item description, weight, value, and photos.
- Print or share label PDF.
- Initial status: PURCHASED.

### Packing
- Scan job label.
- Verify item matches label and cover.
- Update status to PACKED_READY.

### Dispatch
- Create/select batch for the month.
- Scan-add PACKED_READY items to batch.
- Dispatch batch to factory (all items move to DISPATCHED_TO_FACTORY).

### Factory
- Receive items from dispatch (RECEIVED_AT_FACTORY).
- Return items (RETURNED_FROM_FACTORY).

### QC/Stock
- Receive items back at shop (RECEIVED_AT_SHOP).
- Decide next action: ADDED_TO_STOCK or HANDED_TO_DELIVERY.

### Delivery
- Scan item at delivery and mark DELIVERED_TO_CUSTOMER.

## Incidents

- Report immediately if any label mismatch, missing item, damage, or duplicate scan.
- Include description and photos if available.
- Track resolution with notes.
