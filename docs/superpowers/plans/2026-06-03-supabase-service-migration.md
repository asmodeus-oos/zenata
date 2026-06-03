# Service & Component Supabase Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor APIs, Domain Services, and App entry point to use Supabase instead of Firebase.

**Architecture:** Extraction of data mapping utilities, refactoring `backendClient.ts` to use Supabase (Tables + RPCs), and updating `App.tsx` auth/sync orchestration.

**Tech Stack:** Supabase, React, TypeScript, Zustand.

---

### Task 1: Extract Mapping Utilities

**Files:**
- Create: `src/api/utils.ts`
- Modify: `src/store.ts`

- [ ] **Step 1: Create utility file with `toSnakeCase` and `toCamelCase`**

```typescript
export const toSnakeCase = (obj: any): any => {
  if (Array.isArray(obj)) return obj.map(toSnakeCase);
  if (obj === null || typeof obj !== "object" || obj instanceof Date) return obj;
  return Object.keys(obj).reduce((acc, key) => {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    acc[snakeKey] = toSnakeCase(obj[key]);
    return acc;
  }, {} as any);
};

export const toCamelCase = (obj: any): any => {
  if (Array.isArray(obj)) return obj.map(toCamelCase);
  if (obj === null || typeof obj !== "object" || obj instanceof Date) return obj;
  return Object.keys(obj).reduce((acc, key) => {
    const camelKey = key.replace(/([-_][a-z])/g, group => group.toUpperCase().replace("-", "").replace("_", ""));
    acc[camelKey] = toCamelCase(obj[key]);
    return acc;
  }, {} as any);
};
```

- [ ] **Step 2: Update `src/store.ts` to import these utilities**

Remove local definitions and import from `./api/utils`.

- [ ] **Step 3: Commit**

```bash
git add src/api/utils.ts src/store.ts
git commit -m "refactor: extract supabase mapping utilities"
```

### Task 2: Refactor `backendClient.ts`

**Files:**
- Modify: `src/api/backendClient.ts`

- [ ] **Step 1: Replace Firebase imports with Supabase and Utils**

```typescript
import { supabase } from "../supabase";
import { toSnakeCase, toCamelCase } from "./utils";
import { Appointment, AuditEvent, LedgerEntry, Patient, StockMovement, UserRole } from "../types";
```

- [ ] **Step 2: Implement `handleResponse` helper**

```typescript
async function handleResponse<T>(promise: Promise<{ data: T | null; error: any }>): Promise<T> {
  const { data, error } = await promise;
  if (error) {
    throw new Error(`Backend operation failed: ${error.message}`);
  }
  if (data === null) {
    throw new Error("Backend operation failed: No data returned");
  }
  return toCamelCase(data);
}
```

- [ ] **Step 3: Refactor exported `backendClient` methods**

Update all methods to use `supabase.from(...)` or `supabase.rpc(...)`.

```typescript
export const backendClient = {
  patient: {
    create: (payload: Partial<Patient>) => 
      handleResponse(supabase.from('patients').insert(toSnakeCase(payload)).select().single()),
    update: (payload: { patientId: string; patch: Partial<Patient> }) =>
      handleResponse(supabase.from('patients').update(toSnakeCase(payload.patch)).eq('id', payload.patientId).select().single()),
  },
  booking: {
    create: (payload: Omit<Appointment, "id">) =>
      handleResponse(supabase.rpc('create_appointment', {
        p_patient_id: payload.patientId,
        p_patient_name: payload.patientName,
        p_patient_phone: payload.patientPhone,
        p_doctor_name: payload.doctorName,
        p_date: payload.date,
        p_time: payload.time,
        p_procedure_type: payload.procedureType,
        p_status: payload.status,
        p_notes: payload.notes,
        p_quick_notes: payload.quickNotes,
        p_attending_clinical_operator: payload.attendingClinicalOperator
      })),
    update: (payload: { appointmentId: string; patch: Partial<Appointment> }) =>
      handleResponse(supabase.from('appointments').update(toSnakeCase(payload.patch)).eq('id', payload.appointmentId).select().single()),
  },
  finance: {
    createLedgerEntry: (payload: Omit<LedgerEntry, "id" | "createdAt" | "immutable">) =>
      handleResponse(supabase.from('financial_records').insert(toSnakeCase({
        ...payload,
        type: 'income' // Mapping LedgerEntry to financial_records
      })).select().single()),
    listLedgerByPatient: (payload: { patientId: string }) =>
      handleResponse(supabase.from('financial_records').select('*').eq('patient_id', payload.patientId)),
  },
  inventory: {
    addMovement: (payload: Omit<StockMovement, "id" | "timestamp">) =>
      handleResponse(supabase.from('audit_logs').insert({
        action: 'adjustStock',
        details: JSON.stringify(payload),
        resource_type: 'inventory',
        resource_id: payload.itemId
      }).select().single()),
  },
  staff: {
    updateRole: (payload: { userId: string; role: UserRole }) =>
      handleResponse(supabase.from('profiles').update({ role: payload.role }).eq('id', payload.userId).select().single()),
  },
  audit: {
    append: (payload: Omit<AuditEvent, "id" | "createdAt" | "immutable">) =>
      handleResponse(supabase.from('audit_logs').insert({
        actor_id: payload.actorId,
        action: payload.action,
        resource_type: payload.resourceType,
        resource_id: payload.resourceId,
        details: JSON.stringify(payload.metadata)
      }).select().single()),
  },
};
```

- [ ] **Step 4: Commit**

```bash
git add src/api/backendClient.ts
git commit -m "refactor: migrate backendClient to supabase"
```

### Task 3: Refactor `App.tsx`

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Update imports**

Remove `firebase/auth`, `firebase/functions`, and `./firebase`.
Import `supabase` from `./supabase`.

- [ ] **Step 2: Update Auth Observer**

Replace `onAuthStateChanged` with `supabase.auth.onAuthStateChange`.

- [ ] **Step 3: Update Sync method names**

Rename `startFirestoreSync` -> `startSupabaseSync` and `stopFirestoreSync` -> `stopSupabaseSync`.

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx
git commit -m "refactor: migrate App auth and sync to supabase"
```

### Task 4: Audit Domain Services

- [ ] **Step 1: Verify `src/services/bookingService.ts` and others**

Ensure they still work correctly with the refactored `backendClient`.

- [ ] **Step 2: Commit (if changes needed)**

```bash
git commit -m "refactor: finalize domain services migration"
```
