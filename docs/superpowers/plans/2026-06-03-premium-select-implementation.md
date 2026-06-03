# Implement PremiumSelect in Dashboard and Finance Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all native `<select>` elements in Dashboard and Finance modules with the `PremiumSelect` UI component to ensure visual consistency with the VisionOS aesthetic.

**Architecture:** Use `PremiumSelect` as a drop-in replacement. It handles its own internal state for the dropdown menu while proxying `value` and `onChange` to match the native `<select>` API.

**Tech Stack:** React, TypeScript, Tailwind CSS, Lucide icons (within PremiumSelect).

---

### Task 1: Update Dashboard.tsx

**Files:**
- Modify: `src/components/Dashboard.tsx`

- [ ] **Step 1: Import PremiumSelect**

Add the import at the top of the file.

```tsx
import { PremiumSelect } from "./ui/PremiumSelect";
```

- [ ] **Step 2: Replace activity-type-filter select**

```tsx
              <PremiumSelect
                id="activity-type-filter"
                value={activityFilter}
                onChange={(e) => setActivityFilter(e.target.value as any)}
                className="bg-white border border-slate-200 hover:border-slate-350 px-2.5 py-1 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-105 transition-all cursor-pointer shadow-sm"
              >
                <option value="all">All</option>
                <option value="Filling">Filling</option>
                <option value="Extraction">Extraction</option>
                <option value="Prosthetic">Prosthetic</option>
              </PremiumSelect>
```

- [ ] **Step 3: Commit changes**

```bash
git add src/components/Dashboard.tsx
git commit -m "feat(dashboard): replace native select with PremiumSelect for activity filter"
```

---

### Task 2: Update Finance.tsx

**Files:**
- Modify: `src/components/Finance.tsx`

- [ ] **Step 1: Import PremiumSelect**

Add the import at the top of the file.

```tsx
import { PremiumSelect } from "./ui/PremiumSelect";
```

- [ ] **Step 2: Replace settlementSort select**

Find the select with `value={settlementSort}` (around line 538).

```tsx
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5">
              <span className="text-[9px] uppercase font-black text-slate-400">Sort:</span>
              <PremiumSelect
                value={settlementSort}
                onChange={(e) => setSettlementSort(e.target.value as any)}
                className="text-[10px] bg-transparent border-none text-slate-700 font-bold focus:outline-none cursor-pointer"
              >
                <option value="debt-desc">Highest Debt</option>
                <option value="debt-asc">Lowest Debt</option>
                <option value="name">Name A-Z</option>
              </PremiumSelect>
            </div>
```

- [ ] **Step 3: Replace extraSelectedDoctorId select**

Find the select with `value={extraSelectedDoctorId}` (around line 777).

```tsx
              {/* Specific Doctor Selector */}
              {extraCostScope === "Doctor" && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Assign to Doctor</span>
                  <PremiumSelect
                    value={extraSelectedDoctorId}
                    onChange={(e) => setExtraSelectedDoctorId(e.target.value)}
                    className="w-full text-[10px] p-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold bg-white cursor-pointer"
                  >
                    {availableDoctors.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.specialty})</option>
                    ))}
                  </PremiumSelect>
                </div>
              )}
```

- [ ] **Step 4: Commit changes**

```bash
git add src/components/Finance.tsx
git commit -m "feat(finance): replace native selects with PremiumSelect for sorting and doctor attribution"
```

---

### Task 3: Verification

- [ ] **Step 1: Check for compilation errors**

Run: `npm run build` or `tsc --noEmit`
Expected: SUCCESS

- [ ] **Step 2: Final verify**

Verify that `PremiumSelect` is correctly imported and used in both files.
