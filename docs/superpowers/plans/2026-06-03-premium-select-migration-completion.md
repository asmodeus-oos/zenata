# PremiumSelect Migration Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the migration of native `<select>` elements to `PremiumSelect` in `Staff.tsx` and `Inventory.tsx` to match the VisionOS/iOS 26 aesthetic.

**Architecture:** Replace native `<select>` and `</select>` with custom `<PremiumSelect>` and `</PremiumSelect>`. Ensure all props are preserved.

**Tech Stack:** React, TypeScript, Tailwind CSS

---

### Task 1: Update Staff.tsx

**Files:**
- Modify: `src/components/Staff.tsx`

- [ ] **Step 1: Add PremiumSelect import**

Add `import { PremiumSelect } from "./ui/PremiumSelect";` to the imports section.

- [ ] **Step 2: Replace native select elements**

Replace all 5 instances of `<select>` and `</select>` with `<PremiumSelect>` and `</PremiumSelect>`.

Locations:
1. Practitioner selection (Line ~1245)
2. Room assignment in shift editor (Line ~1382)
3. Room selection in onboarding wizard (Line ~1840)
4. Primary Role in member edit modal (Line ~2575)
5. Secondary Role in member edit modal (Line ~2594)

- [ ] **Step 3: Verify changes**

Check that the code still compiles and props are correctly passed.

### Task 2: Update Inventory.tsx

**Files:**
- Modify: `src/components/Inventory.tsx`

- [ ] **Step 1: Replace native select in QR scanner**

Replace the camera selector `<select>` and `</select>` at Line ~1135 with `<PremiumSelect>` and `</PremiumSelect>`.

- [ ] **Step 2: Verify changes**

Check that the code still compiles.

### Task 3: Final Verification and Commit

- [ ] **Step 1: Run Type Check**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 2: Commit changes**

```bash
git add src/components/Staff.tsx src/components/Inventory.tsx
git commit -m "feat: implement PremiumSelect in Staff module and complete Inventory module migration"
```
