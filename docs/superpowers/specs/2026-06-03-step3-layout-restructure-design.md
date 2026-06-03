# Design Spec: Step 3 Layout Restructure

Restyle the custom time picker in Step 3 of the Staff Onboarding Wizard to be more polished and space-efficient, maintaining the 2-column grid structure while improving visual hierarchy and alignment.

## User Goals
- Quickly configure staff shift hours.
- Visual clarity on "From" and "To" boundaries.
- Consistent UI with Task 4 (Step 4) redesign.

## Proposed Changes

### 1. Polished 2-Column Grid
Maintain the existing `grid-cols-1 sm:grid-cols-2` structure but wrap each time picker in a card-like container.

**Visual Updates:**
- Add `bg-white border border-slate-200/60 rounded-2xl p-4 shadow-sm` to each picker column.
- Use a smaller, higher-contrast label: `text-[9px] uppercase font-black text-slate-400 tracking-widest mb-3`.
- Tighter internal spacing for the time controls: `bg-slate-50/50 p-2 rounded-xl border border-slate-100`.

### 2. Time Control Refinement
- **Numbers**: Increase font weight and size slightly for better legibility (`font-black text-base`).
- **Chevrons**: Ensure they are easily clickable (maintaining 44px hit targets if possible, or using clean minimal icons).
- **AM/PM Toggle**: Style as a distinct button within the row: `px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg shadow-3xs`.

### 3. Schedule Roster Alignment
- Ensure the "Weekly Assigned Days" section below the time picker is also aligned within the same visual framework (slate-50 background or consistent padding).

## Architecture & Data Flow
- **State**: Continues to use `wizFromHour`, `wizFromMinute`, `wizFromAmpm`, etc.
- **Handlers**: No changes needed to `incrementHourFunc`, `decrementHourFunc`, etc.
- **Validation**: `isStepValid()` remains unchanged.

## Testing Strategy
- **Visual Check**: Verify "From" and "To" columns are equal height and aligned.
- **Interaction**: Test chevron clicks and wheel scroll on all 4 numeric inputs.
- **Responsiveness**: Verify the grid collapses correctly to 1 column on mobile.
