# GL Enterprise coverage map

This demo is built as an engine-first operating model. UI buttons dispatch actions to `GLCoreEngine`; the core checks permissions, validates workflow, applies a domain engine, publishes events and writes audit rows.

## Implemented as working demo engines

- User, auth, role and permission engines: `user_id` remains the identity anchor; phone is contact data.
- Company and vehicle model: companies own users, vehicles, wallets and trust records.
- Transport workflow engine: ordered status transitions, blockers and selected transport history.
- Shipment engine: cargo has separate `shipment_id` records synced from transport evidence.
- GPS, photo proof and document engines: coordinates, photos, hashes, encrypted document metadata and required document confirmation.
- Digital CMR engine: draft/locked CMR records driven by document events.
- Wallet, escrow, payment and revenue engines: held funds, escrow reservation/release/blocking, payment status and platform fee ledger.
- Insurance and dispute engines: claims and locked evidence packs from photos, documents and messages.
- Trust score engine: carrier, client, driver, warehouse, parking and security reputation records.
- Driver time and compliance engines: driver time, tachograph import records, crew plans, double crew and ferry/rail allowance checks.
- Ferry/intermodal engine: DFDS booking identity, ferry status control, ticket document, demo ferry payment, ETA update and driver ferry rest.
- Parking engine: driver reports, credibility and trust penalties for false reports.
- Jobs engine: transport assignment creates driver job records.
- Communication, translation and plate-to-driver engines: transport threads, message translations, license plate lookup and temporary contact context without private phone exposure.
- Security gate engine: pickup/delivery gate checks, blocked entry and audit history.
- Customs agency engine: customs case identity, MRN/SAD/T1/EX document flow, customs status, customs payment and customs agent communication.
- Authority access / road control engine: controlled authority access, road checks, checked document history and audit-only authority control history without wallet/fine exposure.
- API, integration, global expansion and resilience engines: demo API clients/scopes/audit, ERP/GPS/insurance/payment sync records, region rules, service health, backups and emergency-mode readiness.
- Service / workshop / mobile assistance engine: driver breakdown report, nearest provider selection, response time, service document, service payment, ETA update and provider reputation.
- AI Control Agent: risk checks create alerts and can block critical workflow progression.
- Event bus, notification engine and audit log: important actions create events, notifications and read-only audit rows.

## Demo-only boundaries

- No real bank, card, escrow, insurance, GPS, OCR, tachograph, email, SMS, push or ERP provider is connected.
- External integrations are simulated records with audit events.
- AI is rule-based demo logic, not autonomous decision making.
- Storage is local browser state, not production databases.

## Deliberately future-stage

- Real API authentication, rate limiting, replay, partner onboarding and SDKs.
- True document storage, file encryption, digital signatures and legal eCMR provider integration.
- Real payment provider, wallet KYC/KYB and regulated escrow flow.
- Real OCR/plate scanning, GPS provider feeds and tachograph DDD parsing.
- Production microservices, load balancing, regional data residency, backups, disaster recovery and auto-healing.
