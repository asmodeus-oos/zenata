import { create } from "zustand";
import { persist } from "zustand/middleware";
import { auth, db, handleFirestoreError, OperationType } from "./firebase";
import { signOut, signInAnonymously } from "firebase/auth";
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
  startFirestoreSync: () => Promise<void>;
  stopFirestoreSync: () => void;
  
  // Offline persistence and network status state
  isOnline: boolean;
  offlineSimulated: boolean;
  cacheSizeLimitMB: number;
  toggleNetworkSimulation: () => Promise<void>;
  setCacheSizeLimitMB: (size: number) => void;
  
  // Auth Operations
  login: (username: string, password: string, role: UserRole) => Promise<boolean>;
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
    assignedRoom?: string,
    days?: string[],
    hours?: string,
    role2?: UserRole,
    gender?: "Male" | "Female",
    doctorId?: string
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
    receiptFileName?: string;
    receiptFileContent?: string;
    doctorId?: string;
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
const initialUsers: User[] = [];

const initialShifts: DoctorShift[] = [];

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

// Event-driven readiness system for Firestore
let firestoreReadyPromise: Promise<void> | null = null;
let resolveFirestoreReady: (() => void) | null = null;

const getFirestoreReady = () => {
  if (!firestoreReadyPromise) {
    firestoreReadyPromise = new Promise((resolve) => {
      resolveFirestoreReady = resolve;
    });
  }
  return firestoreReadyPromise;
};

const syncDoc = async (collectionName: string, id: string, data: any, op: OperationType) => {
  // Allow sync if we have ANY auth state (including anonymous)
  if (!auth.currentUser) {
    try {
      await signInAnonymously(auth);
    } catch (e) {
      console.warn("Auto-anonymous login for sync failed:", e);
      return;
    }
  }
  
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
      startFirestoreSync: async () => {
        // Ensure we have a session to read Firestore
        if (!auth.currentUser) {
          try {
            await signInAnonymously(auth);
          } catch (e) {
            console.warn("Sync failed: Could not establish gateway session.", e);
            if (resolveFirestoreReady) resolveFirestoreReady();
            return;
          }
        }

        if (get().isSyncActive) return;
        set({ isSyncActive: true });

        const unsubscribes: (() => void)[] = [];

        // Optimized Network Awareness
        const handleOnline = () => { 
          if (!get().offlineSimulated) {
            set({ isOnline: true });
            enableNetwork(db).catch(() => {});
          }
        };
        const handleOffline = () => {
          set({ isOnline: false });
          disableNetwork(db).catch(() => {});
        };

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

        // Parallel Real-time Synchronization
        collections.forEach(col => {
          const unsub = onSnapshot(collection(db, col), { includeMetadataChanges: true }, (snapshot) => {
            if (snapshot.empty && seeds[col].length > 0) {
              seeds[col].forEach(item => setDoc(doc(db, col, item.id), item).catch(() => {}));
            } else {
              const list: any[] = [];
              snapshot.forEach(doc => list.push(doc.data()));
              set({ [col]: list } as any);
            }
            // Resolve readiness promise when the critical 'users' collection is initialized
            if (col === "users") {
              if (resolveFirestoreReady) resolveFirestoreReady();
            }
          });
          unsubscribes.push(unsub);
        });

        // Clinic Settings Sync
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
      
      login: async (username, password, role) => {
        const uLower = username.toLowerCase();
        
        // Step 1: Ensure sync is active and await the readiness promise
        if (!get().isSyncActive) {
          await get().startFirestoreSync();
        }

        // Block login evaluation until the users collection has been definitively synced
        await getFirestoreReady();

        let found = get().users.find(u => u.username.toLowerCase() === uLower && u.role === role && u.isActive);
        
        // Step 2: Fallback - if still not found in snapshot, the snapshot might be filtered or delayed.
        if (!found) return false;
        
        // Step 3: Password verification
        if (found.password && found.password !== password) return false;
        
        // Step 4: System Bootstrap - Push owner record if it exists locally but cloud was empty
        if (found.id === "usr-1" || found.role === "admin") {
           syncDoc("users", found.id, found, OperationType.UPDATE);
        }

        set({ currentUser: found });
        return true;
      },
      
      logout: () => {
        get().stopFirestoreSync();
        set({ currentUser: null });
        signOut(auth).catch(() => {});
      },

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
          doctorShifts: state.doctorShifts.map(s => s.name.toLowerCase() === target.name.toLowerCase() ? { ...s, name: safe.name || s.name, specialty: safe.specialty || s.specialty, assignedRoom: safe.assignedRoom || s.assignedRoom, days: safe.days || s.days, hours: safe.hours || s.hours } : s)
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
        const financial: FinancialRecord = { 
          id: `rc-${Date.now()}`, 
          patientId, 
          patientName: get().patients.find(p => p.id === patientId)?.name || "Patient", 
          procedureName: item.procedureName, 
          totalCost: item.totalCost, 
          paidAmount: item.paidAmount, 
          remainingAmount: remaining, 
          paymentStatus: status, 
          date: new Date().toISOString().split("T")[0], 
          paymentMethod: item.paymentMethod, 
          receiptNo: `REC-${Date.now()}`, 
          notes: item.notes, 
          type: "income",
          receiptFileName: item.receiptFileName,
          receiptFileContent: item.receiptFileContent,
          doctorId: item.doctorId
        };
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
              return { ...pr, paidAmount: nPaid, remainingAmount: nRem, paymentStatus: (nRem <= 0 ? "Fully Paid" : "Partially Paid") as PaymentStatus };
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

      emergencyReset: () => set({ currentUser: null, users: initialUsers, patients: initialPatients, appointments: initialAppointments, financialRecords: initialFinancials, doctorShifts: initialShifts, inventory: initialInventory, activityLogs: initialLogs, clinicSettings: initialSettings })
    }),
    {
      name: "zendenta-erp-storage-v4",
      partialize: (state) => {
        const { currentUser, isSyncActive, users, ...rest } = state;
        return rest;
      }
    }
  )
);

// INITIALIZATION: Start background sync to ensure users/credentials are available
// even before the first login attempt on a new device.
if (typeof window !== "undefined") {
  // Use a small delay to ensure Firebase is fully initialized
  setTimeout(() => {
    useStore.getState().startFirestoreSync();
  }, 500);
}

