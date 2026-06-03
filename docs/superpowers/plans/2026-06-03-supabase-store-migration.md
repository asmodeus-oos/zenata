# Supabase Store Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor `src/store.ts` to replace Firebase with Supabase for Auth and Realtime Synchronization.

**Architecture:** Use a mapping utility for camelCase/snake_case conversion, query profiles for username resolution during login, and implement a single Supabase Channel for all realtime updates.

**Tech Stack:** React, TypeScript, Zustand, Supabase JS Client.

---

### Task 1: Mapping Utilities & Initial Refactor

**Files:**
- Modify: `src/store.ts`

- [ ] **Step 1: Add Mapping Helpers**
Add `toSnakeCase` and `toCamelCase` utilities at the top of `src/store.ts` (or in a new file, but `store.ts` is already large, I'll keep them there for now or extract if needed).

```typescript
const toSnakeCase = (obj: any): any => {
  if (Array.isArray(obj)) return obj.map(toSnakeCase);
  if (obj === null || typeof obj !== 'object' || obj instanceof Date) return obj;
  return Object.keys(obj).reduce((acc, key) => {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    acc[snakeKey] = toSnakeCase(obj[key]);
    return acc;
  }, {} as any);
};

const toCamelCase = (obj: any): any => {
  if (Array.isArray(obj)) return obj.map(toCamelCase);
  if (obj === null || typeof obj !== 'object' || obj instanceof Date) return obj;
  return Object.keys(obj).reduce((acc, key) => {
    const camelKey = key.replace(/([-_][a-z])/g, group => group.toUpperCase().replace('-', '').replace('_', ''));
    acc[camelKey] = toCamelCase(obj[key]);
    return acc;
  }, {} as any);
};

const TABLE_MAP: Record<string, string> = {
  users: 'profiles',
  patients: 'patients',
  appointments: 'appointments',
  financialRecords: 'financial_records',
  inventory: 'inventory_items',
  activityLogs: 'audit_logs',
};

const REVERSE_TABLE_MAP: Record<string, string> = {
  profiles: 'users',
  patients: 'patients',
  appointments: 'appointments',
  financial_records: 'financialRecords',
  inventory_items: 'inventory',
  audit_logs: 'activityLogs',
};
```

- [ ] **Step 2: Replace Firebase Imports**
Remove all firebase imports and replace with Supabase.

```typescript
import { supabase } from "./supabase";
// Remove firebase/auth, firebase/firestore, ./firebase imports
```

- [ ] **Step 3: Commit**
```bash
git add src/store.ts
git commit -m "refactor(store): add mapping utilities and replace firebase imports"
```

---

### Task 2: Auth Refactor

**Files:**
- Modify: `src/store.ts`

- [ ] **Step 1: Update `login` method**
Modify `login` to resolve username to email then sign in with Supabase.

```typescript
      login: async (username, password, role) => {
        const uLower = username.toLowerCase();
        
        // Resolve email from username
        const { data: profile, error: pError } = await supabase
          .from('profiles')
          .select('email')
          .eq('username', uLower)
          .single();

        if (pError || !profile?.email) {
          // Fallback for bootstrap admin if needed, though Supabase should have it in DB
          return false;
        }

        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: profile.email,
          password
        });

        if (authError || !authData.user) return false;

        // Fetch full profile
        const { data: fullProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authData.user.id)
          .single();

        if (fullProfile) {
          const user = toCamelCase(fullProfile);
          set({ currentUser: user });
          if (!get().isSyncActive) {
            await get().startSupabaseSync();
          }
          return true;
        }
        return false;
      },
```

- [ ] **Step 2: Update `logout` method**
```typescript
      logout: async () => {
        get().stopSupabaseSync();
        await supabase.auth.signOut();
        set({ currentUser: null });
      },
```

- [ ] **Step 3: Commit**
```bash
git add src/store.ts
git commit -m "refactor(store): migrate auth to supabase"
```

---

### Task 3: Realtime Synchronization Implementation

**Files:**
- Modify: `src/store.ts`

- [ ] **Step 1: Replace `startFirestoreSync` with `startSupabaseSync`**
Implement initial hydration and realtime subscription.

```typescript
      startSupabaseSync: async () => {
        if (get().isSyncActive) return;
        set({ isSyncActive: true });

        const tables = Object.values(TABLE_MAP);

        // Initial Hydration
        const results = await Promise.all(
          tables.map(table => supabase.from(table).select('*'))
        );

        const newState: any = {};
        results.forEach((res, index) => {
          const table = tables[index];
          const storeKey = REVERSE_TABLE_MAP[table];
          if (res.data) {
            newState[storeKey] = toCamelCase(res.data);
          }
        });
        set(newState);

        // Realtime Subscription
        const channel = supabase.channel('app-changes')
          .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
            const table = payload.table;
            const storeKey = REVERSE_TABLE_MAP[table];
            if (!storeKey) return;

            set((state: any) => {
              const currentList = state[storeKey] || [];
              const newData = toCamelCase(payload.new || payload.old);
              
              if (payload.eventType === 'INSERT') {
                return { [storeKey]: [newData, ...currentList] };
              } else if (payload.eventType === 'UPDATE') {
                return { [storeKey]: currentList.map((item: any) => item.id === newData.id ? newData : item) };
              } else if (payload.eventType === 'DELETE') {
                return { [storeKey]: currentList.filter((item: any) => item.id !== (payload.old as any).id) };
              }
              return state;
            });
          })
          .subscribe();

        (window as any).__supabaseChannel = channel;
      },
```

- [ ] **Step 2: Update `stopSupabaseSync`**
```typescript
      stopSupabaseSync: () => {
        if (!get().isSyncActive) return;
        set({ isSyncActive: false });
        const channel = (window as any).__supabaseChannel;
        if (channel) {
          supabase.removeChannel(channel);
          (window as any).__supabaseChannel = undefined;
        }
      },
```

- [ ] **Step 3: Commit**
```bash
git add src/store.ts
git commit -m "feat(store): implement supabase realtime sync"
```

---

### Task 4: Outgoing Sync Refactor (`syncDoc`)

**Files:**
- Modify: `src/store.ts`

- [ ] **Step 1: Update `syncDoc` utility**
Replace internal `syncDoc` with Supabase calls.

```typescript
const syncDoc = async (collectionName: string, id: string, data: any, op: string) => {
  if (!useStore.getState().isSyncActive || useStore.getState().offlineSimulated) return;

  const table = TABLE_MAP[collectionName] || collectionName;
  try {
    if (op === 'delete') {
      await supabase.from(table).delete().eq('id', id);
    } else {
      const snakeData = toSnakeCase(data);
      await supabase.from(table).upsert(snakeData);
    }
  } catch (error) {
    console.error(`Supabase sync error (${op}) on ${table}:`, error);
  }
};
```

- [ ] **Step 2: Commit**
```bash
git add src/store.ts
git commit -m "refactor(store): update syncDoc for supabase"
```

---

### Task 5: Final Cleanup & Verification

**Files:**
- Modify: `src/store.ts`

- [ ] **Step 1: Replace all `OperationType` occurrences**
Since `OperationType` was imported from `firebase.ts`, we need to define it or use strings. I'll define it locally to minimize changes.

```typescript
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete'
}
```

- [ ] **Step 2: Clean up initialization logic**
Update the auto-start logic at the bottom of the file.

```typescript
if (typeof window !== "undefined") {
  setTimeout(() => {
    useStore.getState().startSupabaseSync();
  }, 500);
}
```

- [ ] **Step 3: Run Verification**
Check for any remaining Firebase references and verify build if possible.

- [ ] **Step 4: Commit**
```bash
git add src/store.ts
git commit -m "refactor(store): final cleanup and initialization update"
```
