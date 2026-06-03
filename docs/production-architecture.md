# Zendenta ERP Production Architecture (Refactor Baseline)

## Architecture Diagram (Text)

React UI (presentation + UX state only)
  -> Domain Services (`src/services/*`)
  -> API Client (`src/api/backendClient.ts`)
  -> Supabase (storage only, no direct client writes to protected tables)
  -> Append-only `auditLogs`, `ledgerEntries`, `stockMovements`

## Security Model

- Authentication required for all protected reads/writes.
- Role-based access is enforced in Postgres RLS and Edge Functions:
  - `admin`, `doctor`, `receptionist`, `accountant`.
- Supabase Policies (RLS) deny direct client writes for:
  - `patients`, `appointments`, `ledgerEntries`, `stockMovements`, `auditLogs`, `users`.
- App Check initialization replaced with Supabase Auth protection.
- Legacy client-side password bypass paths removed/disabled in the UI and store.

## Financial Correctness Model

- Immutable ledger model introduced (`LedgerEntry`):
  - `payment`, `refund`, `charge`, `adjustment`.
- No in-place mutation of ledger rows.
- Patient balances must be derived by aggregation, never edited directly.
- Database Trigger validates positive amount and writes audit event.

## Patient Data Safety Model

- Versioning support fields added (`VersionedRecord<T>`, patient `version` updates in backend).
- `updatePatientRecord` uses transaction and increments version.
- Every patient write emits `auditLogs` event with actor and patch metadata.

## Inventory Integrity Model

- Event-based stock movements introduced (`StockMovement`):
  - `add`, `consume`, `adjust`.
- Inventory state should be derived from movement aggregation.
- Database Function `adjustStock` records immutable movement events.

## Removed / Disabled Insecure Patterns

- Hardcoded emergency bypass in login path removed.
- Anonymous sign-in credential fallback removed from `store.login`.
- Client-side password reset logic disabled.
- Supabase Policies no longer allow direct client writes to financial/clinical tables.

## Remaining Migration Work

- Migrate all UI components from legacy `useStore` business mutations to service calls.
- Replace legacy `financialRecords` and `inventory` collection usage with event-sourced aggregations.
- Add server-side file upload pipeline with signed URLs and per-patient ACL.
- Add integration tests for booking conflicts, ledger invariants, and role enforcement.
