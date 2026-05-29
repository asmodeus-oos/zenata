import { httpsCallable } from "firebase/functions";
import { auth, functions } from "../firebase";
import { Appointment, AuditEvent, LedgerEntry, Patient, StockMovement, UserRole } from "../types";

type BackendEnvelope<T> = {
  ok: boolean;
  data: T;
};

function assertAuthenticated() {
  if (!auth.currentUser) {
    throw new Error("Unauthenticated request. Please sign in first.");
  }
}

async function callBackend<TReq, TRes>(name: string, payload: TReq): Promise<TRes> {
  assertAuthenticated();
  const callable = httpsCallable<TReq, BackendEnvelope<TRes>>(functions, name);
  const response = await callable(payload);
  if (!response.data.ok) {
    throw new Error(`Backend operation failed: ${name}`);
  }
  return response.data.data;
}

export const backendClient = {
  patient: {
    create: (payload: Partial<Patient>) => callBackend<typeof payload, Patient>("createPatientRecord", payload),
    update: (payload: { patientId: string; patch: Partial<Patient> }) =>
      callBackend<typeof payload, Patient>("updatePatientRecord", payload),
  },
  booking: {
    create: (payload: Omit<Appointment, "id">) =>
      callBackend<typeof payload, Appointment>("createAppointment", payload),
    update: (payload: { appointmentId: string; patch: Partial<Appointment> }) =>
      callBackend<typeof payload, Appointment>("updateAppointment", payload),
  },
  finance: {
    createLedgerEntry: (payload: Omit<LedgerEntry, "id" | "createdAt" | "immutable">) =>
      callBackend<typeof payload, LedgerEntry>("createLedgerEntry", payload),
    listLedgerByPatient: (payload: { patientId: string }) =>
      callBackend<typeof payload, LedgerEntry[]>("listLedgerByPatient", payload),
  },
  inventory: {
    addMovement: (payload: Omit<StockMovement, "id" | "timestamp">) =>
      callBackend<typeof payload, StockMovement>("adjustStock", payload),
  },
  staff: {
    updateRole: (payload: { userId: string; role: UserRole }) =>
      callBackend<typeof payload, { userId: string; role: UserRole }>("updateStaffRole", payload),
  },
  audit: {
    append: (payload: Omit<AuditEvent, "id" | "createdAt" | "immutable">) =>
      callBackend<typeof payload, AuditEvent>("appendAuditEvent", payload),
  },
};
