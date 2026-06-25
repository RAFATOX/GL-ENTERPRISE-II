# GL Core Engine module map

The demo is intentionally split by responsibility. UI modules render state and call
`GLCoreEngine.dispatchAction(...)`; business rules live in core/domain engines.

- `core/` - constants, state store, seed data and `GLCoreEngine`.
- `authority/` - controlled authority access and road control history.
- `customs/` - customs agency clearance, documents and customs payments.
- `permissions/` - role based permission checks.
- `workflow/` - transport status transitions, validations and blockers.
- `events/` - synchronous event bus.
- `audit/` - read-only audit records generated from events.
- `auth/`, `users/`, `companies/` - identity, account status and company membership.
- `transports/` - central transport object helpers.
- `ferry/` - ferry and intermodal booking/status/payment/ETA demo logic.
- `service/` - workshop, mobile service and roadside assistance flow.
- `gps/`, `photos/`, `documents/` - operational evidence.
- `shipments/` - separate `shipment_id` identity and evidence sync for cargo.
- `payments/`, `wallets/`, `escrow/`, `revenue/` - payment status, held funds, wallet ledger and platform fees.
- `disputes/` - dispute lifecycle and locked evidence packs.
- `cmr/` - digital CMR draft/lock records driven by document events.
- `trust/`, `parking/`, `driver-time/` - reputation, live parking reports and legal driver time.
- `compliance/` - tachograph, driver time, double crew and ferry/rail demo checks.
- `jobs/` - driver work records created from transport events.
- `communication/`, `translation/`, `plate-to-driver/`, `security/` - transport chat, demo translations, license plate lookup and gate controls.
- `api/`, `integrations/`, `global-expansion/`, `resilience/` - API audit, external sync records, region rules, backups, health checks and emergency-mode readiness.
- `ai-control/` - AI Control Agent risk checks.
- `notifications/` - role-routed notifications from event types.
- `ui/` - rendering and event delegation only.
