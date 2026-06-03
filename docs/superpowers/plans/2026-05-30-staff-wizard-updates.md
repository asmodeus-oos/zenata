# Staff Wizard Updates Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refine the Staff Onboarding Wizard with gender and doctorId fields, improved validation, and refined initial states.

**Architecture:** Update the central `useStore` to handle new staff fields and enhance the `Staff` component's wizard logic with step validation and UI refinements.

**Tech Stack:** React, Zustand, TypeScript, Lucide React, Motion.

---

### Task 1: Update Store Types and Logic

**Files:**
- Modify: `src/store.ts`

- [ ] **Step 1: Update `registerStaff` interface definition**

Modify `src/store.ts` around line 59:
```typescript
  registerStaff: (
    name: string,
    username: string,
    role: UserRole,
    email?: string,
    phone?: string,
    password?: string,
    avatarUrl?: string,
    specialty?: string,
    assignedRoom?: string,
    days?: string[],
    hours?: string,
    role2?: UserRole,
    gender?: "Male" | "Female",
    doctorId?: string
  ) => void;
```

- [ ] **Step 2: Update `registerStaff` implementation**

Modify `src/store.ts` around line 295:
```typescript
      registerStaff: (name, username, role, email = "", phone = "", _password = "", avatarUrl = "", specialty = "", assignedRoom = "", days = [], hours = "", role2?: UserRole, gender?: "Male" | "Female", doctorId?: string) => {
        const id = `usr-${Date.now()}`;
        const newU: User = { id, name, username, role, role2, isActive: true, email, phone, avatarUrl, specialty, assignedRoom, days, hours, gender, doctorId };
        const isClinical = role === "clinician" || role === "doctor" || role2 === "clinician" || role2 === "doctor";
        set(state => ({
          users: [...state.users, newU],
          doctorShifts: isClinical
            ? [...state.doctorShifts, { name, specialty: specialty || "Clinician", assignedRoom, days, hours, isAvailable: true }]
            : state.doctorShifts
        }));
        syncDoc("users", id, newU, OperationType.CREATE);
      },
```

---

### Task 2: Update Component State and Wizard Logic

**Files:**
- Modify: `src/components/Staff.tsx`

- [ ] **Step 1: Add new wizard state variables and change initial `wizRole2`**

Modify `src/components/Staff.tsx` around line 98:
```typescript
  const [wizRole, setWizRole] = useState<UserRole>("user");
  const [wizRole2, setWizRole2] = useState<"none" | UserRole>("clinician");
  const [wizGender, setWizGender] = useState<"Male" | "Female">("Female");
  const [wizDoctorId, setWizDoctorId] = useState("");
```

- [ ] **Step 2: Implement `isStepValid()` helper**

Add `isStepValid` in `src/components/Staff.tsx` before the return (around line 530):
```typescript
  const isStepValid = () => {
    if (wizardStep === 1) return wizName.trim() !== "" && wizUsername.trim() !== "";
    if (wizardStep === 2) return true;
    if (wizardStep === 3) return wizDays.length > 0;
    if (wizardStep === 4) return true;
    return true;
  };
```

- [ ] **Step 3: Update `handleRegisterWizard`**

Update `handleRegisterWizard` in `src/components/Staff.tsx` around line 414:
```typescript
  const handleRegisterWizard = (e: React.FormEvent) => {
    e.preventDefault();
    if (wizardStep !== 4) return;
    
    if (!wizName || !wizUsername) {
      alert("Please ensure Name and Username are populated.");
      return;
    }

    const duplicated = users.some(u => u.username.toLowerCase() === wizUsername.toLowerCase());
    if (duplicated) {
      alert("Error: That username identifier is already taken by another personnel.");
      return;
    }

    const combinedWizHours = `${wizFromHour}:${wizFromMinute} ${wizFromAmpm} - ${wizToHour}:${wizToMinute} ${wizToAmpm}`;

    registerStaff(
      wizName,
      wizUsername,
      wizRole,
      wizEmail,
      wizPhone,
      wizPassword || wizUsername,
      wizAvatarUrl,
      wizSpecialty || (wizRole === "clinician" ? "Dentist Specialist" : wizRole === "admin" ? "Practice Admin" : "Receptionist Office Clerk"),
      wizRoom,
      wizDays,
      combinedWizHours,
      wizRole2 === "none" ? undefined : wizRole2,
      wizGender,
      wizDoctorId
    );

    // Reset onboarding form
    setWizName("");
    setWizUsername("");
    setWizRole("user");
    setWizRole2("clinician");
    setWizGender("Female");
    setWizDoctorId("");
    setWizEmail("");
    setWizPhone("");
    setWizPassword("");
    setWizSpecialty("");
    setWizDays(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]);
    setWizHours("09:00 AM - 05:00 PM");
    setWizFromHour("09");
    setWizFromMinute("00");
    setWizFromAmpm("AM");
    setWizToHour("05");
    setWizToMinute("00");
    setWizToAmpm("PM");
    setWizardStep(1);
    setActiveTab("directory");

    alert(`Success: "${wizName}" has been successfully registered into Zendenta.`);
  };
```

- [ ] **Step 4: Update "Continue" button in footer**

Update the button in `src/components/Staff.tsx` around line 1430:
```typescript
              {wizardStep < 4 ? (
                <button
                  type="button"
                  onClick={() => setWizardStep(prev => prev + 1)}
                  disabled={!isStepValid()}
                  className="px-8 h-12 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white font-bold text-[13px] rounded-xl flex items-center gap-2 transition-all cursor-pointer active:scale-95 shadow-md shadow-slate-200"
                >
                  <span>Continue</span>
                  <ArrowRight size={16} />
                </button>
              ) : (
```
