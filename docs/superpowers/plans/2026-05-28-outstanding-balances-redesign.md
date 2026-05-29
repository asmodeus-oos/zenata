# Outstanding Patient Balances Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the Outstanding Patient Balances Workspace for better design, layout, and responsiveness.

**Architecture:** Use a responsive Tailwind grid with a hybrid card design (minimalist header + status-driven actions).

**Tech Stack:** React, Tailwind CSS, Lucide Icons.

---

### Task 1: Responsive Grid & Container Setup

**Files:**
- Modify: `src/components/Finance.tsx`

- [ ] **Step 1: Update the grid container for responsiveness**

Modify the grid container to support 1, 2, and 3 columns based on breakpoints.

```tsx
// Inside src/components/Finance.tsx
// Find the grid container for filteredSettlements.map
<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
```

- [ ] **Step 2: Commit changes**

```bash
# Redesign checkpoint
```

### Task 2: Implement Hybrid Card Header & Avatar

**Files:**
- Modify: `src/components/Finance.tsx`

- [ ] **Step 1: Replace existing card content with new Hybrid Header**

Implement the left-aligned avatar/name/ID and right-aligned Balance Due.

```tsx
// Inside the filteredSettlements.map loop in src/components/Finance.tsx
// Replace the internal content of the card motion.div
<div className="flex items-center justify-between gap-3 relative z-10 px-0.5">
  <div className="flex items-center gap-3 min-w-0">
    {/* Initials Avatar */}
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-xs shrink-0 shadow-sm border ${
      isHighDebt ? 'bg-rose-50 text-rose-700 border-rose-100' : 'bg-amber-50 text-amber-700 border-amber-100'
    }`}>
      {p.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
    </div>
    <div className="min-w-0">
      <h4 className="text-[14px] font-black text-slate-900 truncate tracking-tight">{p.name}</h4>
      <div className="flex items-center gap-1.5 mt-0.5">
        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">ID: {p.id.substring(0, 8)}</span>
        <span className="w-1 h-1 rounded-full bg-slate-200"></span>
        <span className="text-[9px] text-slate-500 font-bold uppercase">{calculateAge(p.dob)}Y • {p.gender[0]}</span>
      </div>
    </div>
  </div>
  <div className="text-right shrink-0">
    <div className={`text-lg font-black font-mono leading-none ${isHighDebt ? 'text-rose-600' : 'text-amber-600'}`}>
      ${p.totalOwed.toLocaleString()}
    </div>
    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mt-1">Uncollected</span>
  </div>
</div>
```

### Task 3: Sidebar Status & Segmented Progress Bar

**Files:**
- Modify: `src/components/Finance.tsx`

- [ ] **Step 1: Add the vertical sidebar indicator**

Add the absolute positioned 4px bar on the left edge.

```tsx
// Inside src/components/Finance.tsx, inside the filteredSettlements.map card div
<div className={`absolute top-0 left-0 bottom-0 w-1 ${isHighDebt ? 'bg-rose-500' : 'bg-amber-500'} z-20`} />
```

- [ ] **Step 2: Implement the segmented progress bar**

Add the 3-segment bar below the header.

```tsx
// Inside src/components/Finance.tsx, inside the filteredSettlements.map card
<div className="flex gap-1 mt-4 mb-4">
  <span className={`flex-1 h-1 rounded-full ${isHighDebt ? 'bg-rose-500' : 'bg-amber-500'}`}></span>
  <span className="flex-1 h-1 rounded-full bg-slate-100"></span>
  <span className="flex-1 h-1 rounded-full bg-slate-100"></span>
</div>
```

### Task 4: Clinical Context & Actions

**Files:**
- Modify: `src/components/Finance.tsx`

- [ ] **Step 1: Implement the italicized clinical context block**

```tsx
// Inside src/components/Finance.tsx, inside the filteredSettlements.map card
<div className="bg-slate-50 border border-slate-150/50 p-3.5 rounded-2xl mb-5">
  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Outstanding Treatment Context</span>
  <p className="text-[11px] font-bold text-slate-600 leading-relaxed italic line-clamp-2">
    "{p.oweDetails || "Pending financial settlement for clinical restorative work."}"
  </p>
</div>
```

- [ ] **Step 2: Add Dual Action Buttons**

Implement "Call Patient" and "Settle $[Amount]".

```tsx
// Inside src/components/Finance.tsx, inside the filteredSettlements.map card
<div className="flex items-center gap-2 mt-auto">
  <button className="flex-1 py-2.5 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-2">
    <Phone size={12} className="text-slate-400" />
    <span>Call Patient</span>
  </button>
  <button className="flex-[2] py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-md shadow-blue-100 flex items-center justify-center gap-2">
    <CreditCard size={12} />
    <span>Settle ${p.totalOwed.toLocaleString()}</span>
  </button>
</div>
```

### Task 5: Mobile & Responsive Polish

**Files:**
- Modify: `src/components/Finance.tsx`

- [ ] **Step 1: Adjust card padding for mobile**

Modify the card container `div` padding.

```tsx
// Inside src/components/Finance.tsx
// Change the card container padding from p-5 to p-4 sm:p-5
className="group bg-white border border-slate-200/80 rounded-[28px] p-4 sm:p-5 hover:shadow-xl hover:border-blue-200/60 transition-all cursor-pointer flex flex-col justify-between gap-4 relative overflow-hidden"
```

- [ ] **Step 2: Ensure ID truncation and layout safety**

Verify `truncate`, `min-w-0`, and `shrink-0` classes are correctly applied in the final implementation.
