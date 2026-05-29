# Security Specification for Zendenta Dental ERP

## 1. Data Invariants
- Any authenticated clinic personnel can access records. No unauthenticated requests allowed.
- Write access requires email verification (`request.auth.token.email_verified == true`).
- A clinical record or invoice cannot be written with mismatched `ownerId` or invalid UUID shapes.
- Timestamp creations (`createdAt`, `updatedAt`) must strictly match `request.time`.
- Document IDs must match the `isValidId()` format (`^[a-zA-Z0-9_\-]+$`) and have size <= 128.

## 2. The "Dirty Dozen" Rogue Payloads
These payloads attempt to bypass authorization or inject poisoned configurations and must receive `PERMISSION_DENIED`:
1. **Identity Spoofing**: Attempt to write a user record with unauthorized claims or self-assigned role changes.
2. **PII Blanket Scrape**: Read patients list by unauthenticated clients.
3. **Invalid ID Inject**: Trying to create a patient profile with a 1MB malicious ID payload like `pat-AAAA...`.
4. **Incorrect Field Typing**: Writing appointment data with a string for `time` that contains massive HTML payloads.
5. **State Skipping**: Updating appointment status from "Scheduled" straight to "Done" while bypassing normal clinic operations.
6. **Past Backdating**: Setting clinical `createdAt` timestamp to 2010 instead of current transaction time.
7. **Phantom Out-of-Bounds Cost**: Writing negative ledger invoice totals or cost amounts.
8. **Malicious Empty Fields**: Omitting mandatory patient details like `name` and `phone`.
9. **Role Injection on Signup**: Self-assigning `role: "admin"` during onboarding creation block.
10. **Shadow Field Appended**: Appending a shadow state variable like `overrideRole: true` on updates.
11. **Anomalous Large Arrays**: Submitting complex lists with thousands of items to choke Firestore operations.
12. **Locked State Change**: Attempting to alter historic audit log items once written.

## 3. Test Runner Design (`firestore.rules.test.ts`)
The validation engine matches the rules specified in `firestore.rules`.
All tested actions violating validation boundaries fail synchronously with `PERMISSION_DENIED` errors at the Firestore Rules level.
