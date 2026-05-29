# Zendenta ERP Production Architecture (Refactor Baseline)

## Architecture Diagram (Text)

React UI (presentation + UX state only)
  -> Domain Services (`src/services/*`)
  -> API Client (`src/api/backendClient.ts`)
  -> Cloud Functions (`functions/src/index.ts`)
  -> Firestore (storage only, no direct client writes to protected collections)
  -> Append-only `auditLogs`, `ledgerEntries`, `stockMovements`

## Security Model

- Authentication required for all protected reads/writes.
- Role-based access is enforced in backend callable functions:
  - `admin`, `doctor`, `receptionist`, `accountant`.
- Firestore rules deny direct client writes for:
  - `patients`, `appointments`, `ledgerEntries`, `stockMovements`, `auditLogs`, `users`.
- App Check initialization added in frontend (`VITE_RECAPTCHA_SITE_KEY`).
- Legacy client-side password bypass paths removed/disabled in the UI and store.

## Financial Correctness Model

- Immutable ledger model introduced (`LedgerEntry`):
  - `payment`, `refund`, `charge`, `adjustment`.
- No in-place mutation of ledger rows.
- Patient balances must be derived by aggregation, never edited directly.
- Backend function `createLedgerEntry` validates positive amount and writes audit event.

## Patient Data Safety Model

- Versioning support fields added (`VersionedRecord<T>`, patient `version` updates in backend).
- `updatePatientRecord` uses transaction and increments version.
- Every patient write emits `auditLogs` event with actor and patch metadata.

## Inventory Integrity Model

- Event-based stock movements introduced (`StockMovement`):
  - `add`, `consume`, `adjust`.
- Inventory state should be derived from movement aggregation.
- Backend function `adjustStock` records immutable movement events.

## Removed / Disabled Insecure Patterns

- Hardcoded emergency bypass in login path removed.
- Anonymous sign-in credential fallback removed from `store.login`.
- Client-side password reset logic disabled.
- Firestore rules no longer allow direct client writes to financial/clinical collections.

## Remaining Migration Work

- Migrate all UI components from legacy `useStore` business mutations to service calls.
- Replace legacy `financialRecords` and `inventory` collection usage with event-sourced aggregations.
- Add server-side file upload pipeline with signed URLs and per-patient ACL.
- Add integration tests for booking conflicts, ledger invariants, and role enforcement.
