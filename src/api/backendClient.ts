import { PostgrestError } from "@supabase/supabase-js";
import { supabase } from "../supabase";
import { toSnakeCase, toCamelCase } from "./utils";
import { Appointment, AuditEvent, LedgerEntry, Patient, StockMovement, UserRole } from "../types";

async function handleResponse<T>(promise: PromiseLike<{ data: T | null; error: PostgrestError | null }>): Promise<T> {
  const { data, error } = await promise;
  if (error) {
    throw new Error(`Backend operation failed: ${error.message}`);
  }
  if (data === null) {
    throw new Error("Backend operation failed: No data returned");
  }
  return toCamelCase<T>(data);
}

export const backendClient = {
  patient: {
    create: (payload: Partial<Patient>): Promise<Patient> => 
      handleResponse<Patient>(supabase.from('patients').insert(toSnakeCase(payload)).select().single()),
    update: (payload: { patientId: string; patch: Partial<Patient> }): Promise<Patient> =>
      handleResponse<Patient>(supabase.from('patients').update(toSnakeCase(payload.patch)).eq('id', payload.patientId).select().single()),
  },
  booking: {
    create: (payload: Omit<Appointment, "id">): Promise<Appointment> =>
      handleResponse<Appointment>(supabase.rpc('create_appointment', {
        p_patient_id: payload.patientId,
        p_patient_name: payload.patientName,
        p_patient_phone: payload.patientPhone,
        p_doctor_name: payload.doctorName,
        p_date: payload.date,
        p_time: payload.time,
        p_procedure_type: payload.procedureType,
        p_status: payload.status,
        p_notes: payload.notes,
        p_quick_notes: payload.quickNotes,
        p_attending_clinical_operator: payload.attendingClinicalOperator
      })),
    update: (payload: { appointmentId: string; patch: Partial<Appointment> }): Promise<Appointment> =>
      handleResponse<Appointment>(supabase.from('appointments').update(toSnakeCase(payload.patch)).eq('id', payload.appointmentId).select().single()),
  },
  finance: {
    createLedgerEntry: (payload: Omit<LedgerEntry, "id" | "createdAt" | "immutable">): Promise<LedgerEntry> =>
      handleResponse<LedgerEntry>(supabase.from('financial_records').insert(toSnakeCase({
        ...payload,
        type: 'income'
      })).select().single()),
    listLedgerByPatient: (payload: { patientId: string }): Promise<LedgerEntry[]> =>
      handleResponse<LedgerEntry[]>(supabase.from('financial_records').select('*').eq('patient_id', payload.patientId)),
  },
  inventory: {
    addMovement: (payload: Omit<StockMovement, "id" | "timestamp">): Promise<any> =>
      handleResponse(supabase.from('audit_logs').insert({
        action: 'adjustStock',
        details: JSON.stringify(payload),
        resource_type: 'inventory',
        resource_id: payload.itemId
      }).select().single()),
  },
  staff: {
    updateRole: (payload: { userId: string; role: UserRole }): Promise<any> =>
      handleResponse(supabase.from('profiles').update({ role: payload.role }).eq('id', payload.userId).select().single()),
  },
  audit: {
    append: (payload: Omit<AuditEvent, "id" | "createdAt" | "immutable">): Promise<AuditEvent> =>
      handleResponse<AuditEvent>(supabase.from('audit_logs').insert({
        actor_id: payload.actorId,
        action: payload.action,
        resource_type: payload.resourceType,
        resource_id: payload.resourceId,
        details: JSON.stringify(payload.metadata)
      }).select().single()),
  },
};
