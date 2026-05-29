import { create } from "zustand";
import { persist } from "zustand/middleware";
import { auth, db, handleFirestoreError, OperationType } from "./firebase";
import { signOut } from "firebase/auth";
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot,
  disableNetwork,
  enableNetwork
} from "firebase/firestore";
import { 
  Patient, 
  Appointment, 
  FinancialRecord, 
  User, 
  UserRole, 
  DoctorShift,
  FillingRecord,
  ExtractionRecord,
  CrownProstheticRecord,
  PaymentStatus,
  InventoryItem,
  ActivityLog,
  ClinicSettings
} from "./types";

interface ClinicalState {
  currentUser: User | null;
  users: User[];
  patients: Patient[];
  appointments: Appointment[];
  financialRecords: FinancialRecord[];
  doctorShifts: DoctorShift[];
  inventory: InventoryItem[];
  activityLogs: ActivityLog[];
  clinicSettings: ClinicSettings;
  theme: "light" | "dark";
  setTheme: (theme: "light" | "dark") => void;
  setCurrentUser: (user: User | null) => void;
  
  // Firestore Synchronization State & Handlers
  isSyncActive: boolean;
  startFirestoreSync: () => void;
  stopFirestoreSync: () => void;
  
  // Offline persistence and network status state
  isOnline: boolean;
  offlineSimulated: boolean;
  cacheSizeLimitMB: number;
  toggleNetworkSimulation: () => Promise<void>;
  setCacheSizeLimitMB: (size: number) => void;
  
  // Auth Operations
  login: (username: string, password: string, role: UserRole) => boolean;
  logout: () => void;
  registerStaff: (
    name: string, 
    username: string, 
    role: UserRole, 
    email?: string, 
    phone?: string, 
    password?: string,
    avatarUrl?: string,
    specialty?: string,
    days?: string[],
    hours?: string,
    role2?: UserRole
  ) => void;
  toggleStaffStatus: (userId: string) => void;
  deleteStaff: (userId: string) => void;
  updateUserProfile: (userId: string, updated: Partial<User>) => void;
  changeUserPassword: (userId: string, currentPass: string, newPass: string, masterKeyBypass?: boolean) => boolean;
  adminResetPassword: (userId: string, newPass: string) => void;
  
  // Patient CRUD
  addPatient: (patient: Omit<Patient, "id" | "createdAt" | "fillingRecords" | "extractionRecords" | "prostheticsRecords" | "riskLevel" | "allergies" | "weight" | "height"> & Partial<Pick<Patient, "riskLevel" | "allergies" | "weight" | "height" | "whatsapp">>) => string;
  updatePatient: (id: string, updated: Partial<Patient>) => void;
  deletePatient: (id: string) => void;
  updateOrthoNotes: (patientId: string, notes: string) => void;
  
  // Treatment Logging
  addFillingRecord: (patientId: string, record: Omit<FillingRecord, "id" | "date">) => void;
  addExtractionRecord: (patientId: string, record: Omit<ExtractionRecord, "id" | "date">) => void;
  addProstheticsRecord: (patientId: string, record: Omit<CrownProstheticRecord, "id" | "date" | "sessions" | "remainingAmount" | "paymentStatus">) => void;
  updateProstheticSession: (patientId: string, prostheticId: string, sessionId: string, completed: boolean, notes: string, date?: string) => void;
  updateProstheticLabStatus: (patientId: string, prostheticId: string, status: CrownProstheticRecord["labStatus"]) => void;
  
  // Financial payments ledger
  addClinicalIncomeRecord: (patientId: string, item: {
    procedureName: string;
    totalCost: number;
    paidAmount: number;
    paymentMethod: "Cash" | "Card" | "Bank Transfer";
    notes?: string;
  }) => void;
  addPayment: (patientId: string, prostheticId: string, amount: number, paymentMethod: "Cash" | "Card" | "Bank Transfer") => void;
  addPaymentRecord: (item: FinancialRecord) => void; // internal use
  addExpense: (expense: {
    procedureName: string;
    totalCost: number;
    date: string;
    expenseType: "payroll" | "utility" | "extra";
    expenseCategory: string;
    periodType: "Monthly" | "Daily" | "Specific Day";
    notes?: string;
    doctorId?: string;
  }) => void;

  // Appointment CRUD
  addAppointment: (appointment: Omit<Appointment, "id">) => void;
  updateAppointment: (id: string, updated: Partial<Appointment>) => void;
  deleteAppointment: (id: string) => void;

  // Inventory Operations
  addInventoryItem: (item: Omit<InventoryItem, "id">) => void;
  updateInventoryItem: (id: string, updated: Partial<InventoryItem>) => void;
  deleteInventoryItem: (id: string) => void;

  // Activity Log and Settings
  addActivityLog: (action: string, details: string) => void;
  updateClinicSettings: (settings: Partial<ClinicSettings>) => void;

  // Doctor Shifts Operations
  addDoctorShift: (shift: DoctorShift) => void;
  updateDoctorShift: (index: number, updated: DoctorShift) => void;
  deleteDoctorShift: (index: number) => void;
  syncShiftsWithStaff: () => void;

  // Emergency keys
  emergencyReset: () => void;
}

// Default Seed Data - Clean Production Baseline
const initialUsers: User[] = [
  { 
    id: "usr-1", 
    name: "Dr. Alexander Thorne", 
    username: "admin", 
    role: "admin", 
    password: "owner123", 
    isActive: true, 
    email: "alexander.thorne@zendenta.com", 
    phone: "+1 (555) 123-4567",
    avatarUrl: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=150&q=80",
    specialty: "Practice Owner & Specialist",
    days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    hours: "09:00 AM - 05:00 PM"
  }
];

const initialShifts: DoctorShift[] = [
  { 
    name: "Dr. Alexander Thorne", 
    specialty: "Practice Owner & Specialist", 
    days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], 
    hours: "09:00 AM - 05:00 PM", 
    isAvailable: true 
  }
];

const initialPatients: Patient[] = [];
const initialInventory: InventoryItem[] = [];
const initialLogs: ActivityLog[] = [];

const initialSettings: ClinicSettings = {
  name: "New Dental Practice",
  logo: "https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&w=120&q=80",
  address: "Enter Practice Address",
  phone: "+1 000-000-0000",
  social: "practice.web"
};

const initialAppointments: Appointment[] = [];
const initialFinancials: FinancialRecord[] = [];

const syncDoc = async (collectionName: string, id: string, data: any, op: OperationType) => {
  const backendOnlyCollections = new Set([
    "patients",
    "appointments",
    "financialRecords",
    "ledgerEntries",
    "stockMovements",
    "inventory",
    "users",
    "auditLogs",
  ]);

  if (backendOnlyCollections.has(collectionName)) {
    console.warn(
      `[Firestore Sync] Blocked client direct write (${op}) for ${collectionName}/${id}. Use backend callable functions instead.`,
    );
    return;
  }

  if (!auth.currentUser) return;
  if (!useStore.getState().isSyncActive) return;

  try {
    const docRef = doc(db, collectionName, id);
    if (op === OperationType.DELETE) {
      await deleteDoc(docRef);
    } else {
      await setDoc(docRef, data);
    }
  } catch (error) {
    if (error instanceof Error && (error.message.includes("permission") || error.message.includes("PERMISSION_DENIED"))) {
      handleFirestoreError(error, op, `${collectionName}/${id}`);
    } else {
      console.warn(`Firestore background sync (${op}) skipped:`, error);
    }
  }
};

export const useStore = create<ClinicalState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      users: initialUsers,
      patients: initialPatients,
      appointments: initialAppointments,
      financialRecords: initialFinancials,
      doctorShifts: initialShifts,
      inventory: initialInventory,
      activityLogs: initialLogs,
      clinicSettings: initialSettings,
      theme: "light",
      setTheme: (theme) => set({ theme }),
      setCurrentUser: (user) => set({ currentUser: user }),
      
      isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
      offlineSimulated: false,
      cacheSizeLimitMB: 1000,
      
      toggleNetworkSimulation: async () => {
        const isCurrentlySimulated = get().offlineSimulated;
        try {
          if (isCurrentlySimulated) {
            await enableNetwork(db);
            set({ offlineSimulated: false, isOnline: typeof navigator !== "undefined" ? navigator.onLine : true });
          } else {
            await disableNetwork(db);
            set({ offlineSimulated: true, isOnline: false });
          }
        } catch (err) {
          console.error("Failed to toggle network state simulation:", err);
        }
      },
      setCacheSizeLimitMB: (size) => set({ cacheSizeLimitMB: size }),
      
      isSyncActive: false,
      startFirestoreSync: () => {
        if (!auth.currentUser) return;
        if (get().isSyncActive) return;
        set({ isSyncActive: true });

        const unsubscribes: (() => void)[] = [];

        const handleOnline = () => { if (!get().offlineSimulated) set({ isOnline: true }); };
        const handleOffline = () => set({ isOnline: false });
        if (typeof window !== "undefined") {
          window.addEventListener("online", handleOnline);
          window.addEventListener("offline", handleOffline);
          unsubscribes.push(() => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
          });
        }

        const collections = ["users", "patients", "appointments", "financialRecords", "inventory", "activityLogs"];
        const seeds: Record<string, any[]> = {
          users: initialUsers,
          patients: initialPatients,
          appointments: initialAppointments,
          financialRecords: initialFinancials,
          inventory: initialInventory,
          activityLogs: initialLogs
        };

        collections.forEach(col => {
          const unsub = onSnapshot(collection(db, col), (snapshot) => {
            if (snapshot.empty) {
              seeds[col].forEach(item => setDoc(doc(db, col, item.id), item).catch(() => {}));
            } else {
              const list: any[] = [];
              snapshot.forEach(doc => list.push(doc.data()));
              set({ [col]: list } as any);
            }
          });
          unsubscribes.push(unsub);
        });

        const unsubSettings = onSnapshot(doc(db, "clinicSettings", "global"), (snapshot) => {
          if (!snapshot.exists()) {
            setDoc(doc(db, "clinicSettings", "global"), initialSettings).catch(() => {});
          } else {
            set({ clinicSettings: snapshot.data() as ClinicSettings });
          }
        });
        unsubscribes.push(unsubSettings);

        (window as any).__firestoreUnsubs = unsubscribes;
      },
      stopFirestoreSync: () => {
        if (!get().isSyncActive) return;
        set({ isSyncActive: false });
        const unsubs = (window as any).__firestoreUnsubs;
        if (Array.isArray(unsubs)) {
          unsubs.forEach((unsub: any) => { try { unsub(); } catch (e) {} });
          (window as any).__firestoreUnsubs = undefined;
        }
      },
      
      login: (username, password, role) => {
        const uLower = username.toLowerCase();
        const found = get().users.find(u => u.username.toLowerCase() === uLower && u.role === role && u.isActive);
        if (!found) return false;
        if (!auth.currentUser && found.password && found.password !== password) return false;
        set({ currentUser: found });
        get().startFirestoreSync();
        return true;
      },
      
      logout: () => {
        get().stopFirestoreSync();
        set({ currentUser: null });
        signOut(auth).catch(() => {});
      },

      registerStaff: (name, username, role, email = "", phone = "", _password = "", avatarUrl = "", specialty = "", days = [], hours = "", role2?: UserRole) => {
        const id = `usr-${Date.now()}`;
        const newU: User = { id, name, username, role, role2, isActive: true, email, phone, avatarUrl, specialty, days, hours };
        const isClinical = role === "clinician" || role === "doctor" || role2 === "clinician" || role2 === "doctor";
        set(state => ({ 
          users: [...state.users, newU],
          doctorShifts: isClinical 
            ? [...state.doctorShifts, { name, specialty: specialty || "Clinician", days, hours, isAvailable: true }]
            : state.doctorShifts
        }));
        syncDoc("users", id, newU, OperationType.CREATE);
      },

      deleteStaff: (userId) => {
        if (userId === "usr-1") return;
        const target = get().users.find(u => u.id === userId);
        if (!target) return;
        set(state => ({
          users: state.users.filter(u => u.id !== userId),
          doctorShifts: state.doctorShifts.filter(s => s.name.toLowerCase() !== target.name.toLowerCase())
        }));
        syncDoc("users", userId, null, OperationType.DELETE);
      },

      toggleStaffStatus: (userId) => {
        if (userId === "usr-1") return;
        set(state => ({
          users: state.users.map(u => u.id === userId ? { ...u, isActive: !u.isActive } : u)
        }));
        const updated = get().users.find(u => u.id === userId);
        if (updated) syncDoc("users", userId, updated, OperationType.UPDATE);
      },

      updateUserProfile: (userId, updated) => {
        const target = get().users.find(u => u.id === userId);
        if (!target) return;
        let safe = { ...updated };
        if (userId === "usr-1") { delete safe.role; delete safe.isActive; }
        set(state => ({
          users: state.users.map(u => u.id === userId ? { ...u, ...safe } : u),
          currentUser: state.currentUser?.id === userId ? { ...state.currentUser, ...safe } : state.currentUser,
          doctorShifts: state.doctorShifts.map(s => s.name.toLowerCase() === target.name.toLowerCase() ? { ...s, name: safe.name || s.name, specialty: safe.specialty || s.specialty } : s)
        }));
        const final = get().users.find(u => u.id === userId);
        if (final) syncDoc("users", userId, final, OperationType.UPDATE);
      },

      changeUserPassword: (userId, currentPass, newPass, masterKeyBypass = false) => {
        const user = get().users.find(u => u.id === userId);
        if (!user) return false;
        if (!masterKeyBypass && user.password && user.password !== currentPass) return false;
        set(state => ({
          users: state.users.map(u => u.id === userId ? { ...u, password: newPass } : u),
          currentUser: state.currentUser?.id === userId ? { ...state.currentUser, password: newPass } : state.currentUser
        }));
        const final = get().users.find(u => u.id === userId);
        if (final) syncDoc("users", userId, final, OperationType.UPDATE);
        return true;
      },

      adminResetPassword: (userId, newPass) => {
        set(state => ({
          users: state.users.map(u => u.id === userId ? { ...u, password: newPass } : u),
          currentUser: state.currentUser?.id === userId ? { ...state.currentUser, password: newPass } : state.currentUser
        }));
        const final = get().users.find(u => u.id === userId);
        if (final) syncDoc("users", userId, final, OperationType.UPDATE);
      },

      addPatient: (data) => {
        const id = `pat-${Date.now()}`;
        const newP: Patient = { ...data, id, createdAt: new Date().toISOString(), orthoNotes: data.orthoNotes || "", fillingRecords: [], extractionRecords: [], prostheticsRecords: [], riskLevel: data.riskLevel || "Low", allergies: data.allergies || "None", weight: data.weight || "N/A", height: data.height || "N/A" };
        set(state => ({ patients: [newP, ...state.patients] }));
        syncDoc("patients", id, newP, OperationType.CREATE);
        return id;
      },

      updatePatient: (id, updated) => {
        set(state => ({ patients: state.patients.map(p => p.id === id ? { ...p, ...updated } : p) }));
        const p = get().patients.find(pat => pat.id === id);
        if (p) syncDoc("patients", id, p, OperationType.UPDATE);
      },

      deletePatient: (id) => {
        set(state => ({ patients: state.patients.filter(p => p.id !== id), appointments: state.appointments.filter(a => a.patientId !== id), financialRecords: state.financialRecords.filter(f => f.patientId !== id) }));
        syncDoc("patients", id, null, OperationType.DELETE);
      },

      updateOrthoNotes: (patientId, notes) => {
        set(state => ({ patients: state.patients.map(p => p.id === patientId ? { ...p, orthoNotes: notes } : p) }));
        const p = get().patients.find(pat => pat.id === patientId);
        if (p) syncDoc("patients", patientId, p, OperationType.UPDATE);
      },

      addFillingRecord: (patientId, record) => {
        const id = `fill-${Date.now()}`;
        const newR: FillingRecord = { ...record, id, date: new Date().toISOString().split("T")[0] };
        set(state => {
          const patient = state.patients.find(p => p.id === patientId);
          const financial: FinancialRecord = { id: `rc-${Date.now()}`, patientId, patientName: patient?.name || "Patient", procedureName: `${record.material} Filling (Tooth ${record.toothNumber})`, totalCost: record.cost, paidAmount: record.cost, remainingAmount: 0, paymentStatus: "Fully Paid", date: newR.date, paymentMethod: "Cash", receiptNo: `REC-${Date.now()}` };
          return { patients: state.patients.map(p => p.id === patientId ? { ...p, fillingRecords: [...p.fillingRecords, newR] } : p), financialRecords: [financial, ...state.financialRecords] };
        });
        const p = get().patients.find(pat => pat.id === patientId);
        if (p) syncDoc("patients", patientId, p, OperationType.UPDATE);
      },

      addExtractionRecord: (patientId, record) => {
        const id = `ext-${Date.now()}`;
        const newR: ExtractionRecord = { ...record, id, date: new Date().toISOString().split("T")[0] };
        set(state => {
          const patient = state.patients.find(p => p.id === patientId);
          const financial: FinancialRecord = { id: `rc-${Date.now()}`, patientId, patientName: patient?.name || "Patient", procedureName: `${record.type} Extraction (Tooth ${record.toothNumber})`, totalCost: record.cost, paidAmount: record.cost, remainingAmount: 0, paymentStatus: "Fully Paid", date: newR.date, paymentMethod: "Card", receiptNo: `REC-${Date.now()}` };
          return { patients: state.patients.map(p => p.id === patientId ? { ...p, extractionRecords: [...p.extractionRecords, newR] } : p), financialRecords: [financial, ...state.financialRecords] };
        });
        const p = get().patients.find(pat => pat.id === patientId);
        if (p) syncDoc("patients", patientId, p, OperationType.UPDATE);
      },

      addProstheticsRecord: (patientId, record) => {
        const id = `prost-${Date.now()}`;
        const remaining = record.totalCost - record.paidAmount;
        const status: PaymentStatus = remaining <= 0 ? "Fully Paid" : record.paidAmount > 0 ? "Partially Paid" : "Unpaid";
        const newR: CrownProstheticRecord = { ...record, id, remainingAmount: remaining, paymentStatus: status, date: new Date().toISOString().split("T")[0], sessions: [ { id: `sess-${Date.now()}-1`, stage: "Preparation", date: new Date().toISOString().split("T")[0], completed: true, notes: "Prep completed." } ] };
        set(state => {
          const patient = state.patients.find(p => p.id === patientId);
          const financial: FinancialRecord = { id: `rc-${Date.now()}`, patientId, patientName: patient?.name || "Patient", procedureName: `${record.prostheticType} (Tooth ${record.toothNumber})`, totalCost: record.totalCost, paidAmount: record.paidAmount, remainingAmount: remaining, paymentStatus: status, date: newR.date, paymentMethod: "Bank Transfer", receiptNo: `REC-${Date.now()}` };
          return { patients: state.patients.map(p => p.id === patientId ? { ...p, prostheticsRecords: [...p.prostheticsRecords, newR] } : p), financialRecords: [financial, ...state.financialRecords] };
        });
        const p = get().patients.find(pat => pat.id === patientId);
        if (p) syncDoc("patients", patientId, p, OperationType.UPDATE);
      },

      updateProstheticSession: (pId, prostId, sId, completed, notes, date) => {
        set(state => ({ patients: state.patients.map(p => p.id !== pId ? p : { ...p, prostheticsRecords: p.prostheticsRecords.map(pr => pr.id !== prostId ? pr : { ...pr, sessions: pr.sessions.map(s => s.id !== sId ? s : { ...s, completed, notes, date: date || (completed && !s.date ? new Date().toISOString().split("T")[0] : s.date) }) }) }) }));
        const p = get().patients.find(pat => pat.id === pId);
        if (p) syncDoc("patients", pId, p, OperationType.UPDATE);
      },

      updateProstheticLabStatus: (pId, prostId, status) => {
        set(state => ({ patients: state.patients.map(p => p.id !== pId ? p : { ...p, prostheticsRecords: p.prostheticsRecords.map(pr => pr.id !== prostId ? pr : { ...pr, labStatus: status }) }) }));
        const p = get().patients.find(pat => pat.id === pId);
        if (p) syncDoc("patients", pId, p, OperationType.UPDATE);
      },

      addClinicalIncomeRecord: (patientId, item) => {
        const remaining = Math.max(0, item.totalCost - item.paidAmount);
        const status: PaymentStatus = remaining <= 0 ? "Fully Paid" : item.paidAmount > 0 ? "Partially Paid" : "Unpaid";
        const financial: FinancialRecord = { id: `rc-${Date.now()}`, patientId, patientName: get().patients.find(p => p.id === patientId)?.name || "Patient", procedureName: item.procedureName, totalCost: item.totalCost, paidAmount: item.paidAmount, remainingAmount: remaining, paymentStatus: status, date: new Date().toISOString().split("T")[0], paymentMethod: item.paymentMethod, receiptNo: `REC-${Date.now()}`, notes: item.notes, type: "income" };
        set(state => ({ financialRecords: [financial, ...state.financialRecords] }));
        syncDoc("financialRecords", financial.id, financial, OperationType.CREATE);
      },

      addPayment: (pId, prostId, amount, method) => {
        set(state => {
          let pName = "Patient", proc = "Payment", t = 0, rem = 0;
          const updatedP = state.patients.map(p => {
            if (p.id !== pId) return p;
            pName = p.name;
            return { ...p, prostheticsRecords: p.prostheticsRecords.map(pr => {
              if (pr.id !== prostId) return pr;
              const nPaid = pr.paidAmount + amount;
              const nRem = Math.max(0, pr.totalCost - nPaid);
              proc = `${pr.prostheticType} (Tooth ${pr.toothNumber})`; t = pr.totalCost; rem = nRem;
              return { ...pr, paidAmount: nPaid, remainingAmount: nRem, paymentStatus: nRem <= 0 ? "Fully Paid" : "Partially Paid" };
            })};
          });
          const receipt: FinancialRecord = { id: `rc-${Date.now()}`, patientId: pId, patientName: pName, procedureName: proc, totalCost: amount, paidAmount: amount, remainingAmount: 0, paymentStatus: "Fully Paid", date: new Date().toISOString().split("T")[0], paymentMethod: method, receiptNo: `REC-${Date.now()}`, notes: `Installment (Total: $${t}, Rem: $${rem})` };
          return { patients: updatedP, financialRecords: [receipt, ...state.financialRecords] };
        });
        const p = get().patients.find(pat => pat.id === pId);
        if (p) syncDoc("patients", pId, p, OperationType.UPDATE);
      },

      addPaymentRecord: (item) => set(state => ({ financialRecords: [item, ...state.financialRecords] })),

      addExpense: (expense) => {
        const id = `exp-${Date.now()}`;
        const newE: FinancialRecord = { id, patientId: "N/A", patientName: "Expense", procedureName: expense.procedureName, totalCost: expense.totalCost, paidAmount: expense.totalCost, remainingAmount: 0, paymentStatus: "Fully Paid", date: expense.date, paymentMethod: "Bank Transfer", receiptNo: `EXP-${Date.now()}`, notes: expense.notes, type: "expense", expenseCategory: expense.expenseCategory, expenseType: expense.expenseType, periodType: expense.periodType, doctorId: expense.doctorId };
        set(state => ({ financialRecords: [newE, ...state.financialRecords] }));
        syncDoc("financialRecords", id, newE, OperationType.CREATE);
      },

      addAppointment: (app) => {
        const id = `app-${Date.now()}`;
        const newA = { ...app, id };
        set(state => ({ appointments: [newA, ...state.appointments] }));
        syncDoc("appointments", id, newA, OperationType.CREATE);
      },

      updateAppointment: (id, updated) => {
        const app = get().appointments.find(a => a.id === id);
        if (!app) return;
        if (updated.status === "Completed") {
          const p = get().patients.find(pat => pat.id === app.patientId);
          if (p) {
            const sess = { id: `sess-${Date.now()}`, date: app.date, time: app.time, procedureType: app.procedureType, doctorName: app.doctorName, notes: updated.notes || app.notes || "Completed.", quickNotes: app.quickNotes || "" };
            get().updatePatient(p.id, { sessions: [...(p.sessions || []), sess] });
          }
          get().deleteAppointment(id);
        } else {
          set(state => ({ appointments: state.appointments.map(a => a.id === id ? { ...a, ...updated } : a) }));
          const ref = get().appointments.find(a => a.id === id);
          if (ref) syncDoc("appointments", id, ref, OperationType.UPDATE);
        }
      },

      deleteAppointment: (id) => {
        set(state => ({ appointments: state.appointments.filter(a => a.id !== id) }));
        syncDoc("appointments", id, null, OperationType.DELETE);
      },

      addInventoryItem: (item) => {
        const id = `inv-${Date.now()}`;
        const newI = { ...item, id };
        set(state => ({ inventory: [...state.inventory, newI] }));
        syncDoc("inventory", id, newI, OperationType.CREATE);
      },

      updateInventoryItem: (id, updated) => {
        set(state => ({ inventory: state.inventory.map(i => i.id === id ? { ...i, ...updated } : i) }));
        const item = get().inventory.find(i => i.id === id);
        if (item) syncDoc("inventory", id, item, OperationType.UPDATE);
      },

      deleteInventoryItem: (id) => {
        set(state => ({ inventory: state.inventory.filter(i => i.id !== id) }));
        syncDoc("inventory", id, null, OperationType.DELETE);
      },

      addActivityLog: (action, details) => {
        const id = `log-${Date.now()}`;
        const newL = { id, timestamp: new Date().toISOString(), user: get().currentUser?.name || "System", action, details };
        set(state => ({ activityLogs: [newL, ...state.activityLogs].slice(0, 50) }));
        syncDoc("activityLogs", id, newL, OperationType.CREATE);
      },

      updateClinicSettings: (settings) => {
        set(state => ({ clinicSettings: { ...state.clinicSettings, ...settings } }));
        syncDoc("clinicSettings", "global", get().clinicSettings, OperationType.UPDATE);
      },

      addDoctorShift: (shift) => set(state => ({ doctorShifts: [...state.doctorShifts, shift] })),
      updateDoctorShift: (idx, updated) => set(state => ({ doctorShifts: state.doctorShifts.map((s, i) => i === idx ? updated : s) })),
      deleteDoctorShift: (idx) => set(state => ({ doctorShifts: state.doctorShifts.filter((_, i) => i !== idx) })),
      syncShiftsWithStaff: () => {
        const names = new Set(get().users.map(u => u.name.toLowerCase()));
        set(state => ({ doctorShifts: state.doctorShifts.filter(s => names.has(s.name.toLowerCase())) }));
      },

      emergencyReset: () => set({ currentUser: initialUsers[0], users: initialUsers, patients: initialPatients, appointments: initialAppointments, financialRecords: initialFinancials, doctorShifts: initialShifts, inventory: initialInventory, activityLogs: initialLogs, clinicSettings: initialSettings })
    }),
    {
      name: "zendenta-erp-storage",
      partialize: (state) => {
        const { currentUser, isSyncActive, ...rest } = state;
        return rest;
      }
    }
  )
);
