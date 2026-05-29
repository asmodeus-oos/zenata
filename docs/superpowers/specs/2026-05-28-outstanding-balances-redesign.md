# Design Spec: Outstanding Patient Balances Workspace Redesign

**Date:** 2026-05-28
**Topic:** Outstanding Patient Balances Workspace Redesign
**Status:** Approved

## 1. Objective
Redesign the "Outstanding Patient Balances Workspace" in the Finance component for better visual hierarchy, clarity, and full responsiveness across all screen sizes.

## 2. Design: Hybrid A+C
The approved design combines the minimalist hierarchy of Option A with the status-driven actionability of Option C.

### 2.1 Card Anatomy
- **Sidebar Status Indicator:** A vertical 4px bar on the left edge, color-coded by debt level (e.g., rose for high debt, amber for standard debt).
- **Header:**
  - Left: Patient initials avatar, Name, Patient ID, and Age/Gender metadata.
  - Right: High-contrast Balance Due amount (using a monospaced font for numerical clarity).
- **Status/Progress Tracking:** A subtle segmented progress bar to visualize settlement status.
- **Clinical Context:** A dedicated section for "Outstanding Treatment Context" using italicized text for a personal, "sticky-note" feel.
- **Primary Actions:** Dual prominent buttons:
  - "Call Patient" (Secondary action)
  - "Settle $[Amount]" (Primary high-visibility action)

### 2.2 Responsive Behavior
- **Layout:**
  - **Desktop (1280px+):** 3-column grid.
  - **Tablet (768px - 1024px):** 2-column grid.
  - **Mobile (Below 768px):** 1-column stack.
- **Card Scaling:**
  - Padding reduces from `p-5` to `p-4` or `p-3` on mobile.
  - Dual action buttons may stack vertically on very small viewports if necessary.
  - Text truncation for long names or IDs to prevent layout overflow.

## 3. Architecture & Implementation
- **Component:** `src/components/Finance.tsx`
- **Data Source:** Existing `filteredSettlements` mapping logic.
- **Styling:** Tailwind CSS for layout and responsiveness.
- **Icons:** Continue using `lucide-react`.

## 4. Success Criteria
- [ ] Cards are visually distinct and high-signal.
- [ ] Grid scales correctly from 1 to 3 columns based on viewport.
- [ ] Dual-action buttons are easily accessible on all devices.
- [ ] Performance remains stable with large debtor lists.
