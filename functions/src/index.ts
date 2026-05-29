import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();

function assertAuth(request: Parameters<typeof onCall>[0] extends never ? never : any) {
  if (!request.auth?.uid) {
    throw new HttpsError("unauthenticated", "Authentication required.");
  }
}

function roleFromToken(auth: any): string | undefined {
  return auth?.token?.role;
}

function assertRole(auth: any, allowed: string[]) {
  const role = roleFromToken(auth);
  if (!role || !allowed.includes(role)) {
    throw new HttpsError("permission-denied", "Insufficient role.");
  }
}

export const createPatientRecord = onCall(async (request) => {
  assertAuth(request);
  assertRole(request.auth, ["admin", "doctor", "receptionist"]);
  const payload = request.data as any;
  if (!payload?.name || !payload?.phone || !payload?.dob || !payload?.gender) {
    throw new HttpsError("invalid-argument", "Missing required patient fields.");
  }

  const docRef = db.collection("patients").doc();
  const now = admin.firestore.FieldValue.serverTimestamp();
  const patient = {
    ...payload,
    id: docRef.id,
    createdAt: now,
    updatedAt: now,
    version: 1,
  };
  await docRef.set(patient);
  await db.collection("auditLogs").add({
    action: "create_patient",
    actorId: request.auth.uid,
    actorRole: roleFromToken(request.auth),
    resourceType: "patient",
    resourceId: docRef.id,
    createdAt: now,
    immutable: true,
  });
  return { ok: true, data: { ...payload, id: docRef.id } };
});

export const updatePatientRecord = onCall(async (request) => {
  assertAuth(request);
  assertRole(request.auth, ["admin", "doctor"]);
  const { patientId, patch } = request.data as any;
  if (!patientId || typeof patch !== "object") {
    throw new HttpsError("invalid-argument", "Invalid patch payload.");
  }

  const patientRef = db.collection("patients").doc(patientId);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(patientRef);
    if (!snap.exists) {
      throw new HttpsError("not-found", "Patient not found.");
    }
    const data = snap.data() || {};
    const version = Number(data.version || 1) + 1;
    tx.update(patientRef, {
      ...patch,
      version,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    tx.set(db.collection("auditLogs").doc(), {
      action: "update_patient",
      actorId: request.auth.uid,
      actorRole: roleFromToken(request.auth),
      resourceType: "patient",
      resourceId: patientId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      immutable: true,
      metadata: { patchKeys: Object.keys(patch) },
    });
  });

  const updated = await patientRef.get();
  return { ok: true, data: updated.data() };
});

export const createAppointment = onCall(async (request) => {
  assertAuth(request);
  assertRole(request.auth, ["admin", "doctor", "receptionist"]);
  const payload = request.data as any;
  const { doctorName, date, time } = payload || {};
  if (!doctorName || !date || !time) {
    throw new HttpsError("invalid-argument", "Missing scheduling fields.");
  }

  const conflict = await db
    .collection("appointments")
    .where("doctorName", "==", doctorName)
    .where("date", "==", date)
    .where("time", "==", time)
    .where("status", "in", ["Scheduled", "Waiting", "In chair", "In Chair"])
    .limit(1)
    .get();

  if (!conflict.empty) {
    throw new HttpsError("already-exists", "Double booking conflict detected.");
  }

  const appointmentRef = db.collection("appointments").doc();
  await appointmentRef.set({
    ...payload,
    id: appointmentRef.id,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  return { ok: true, data: { ...payload, id: appointmentRef.id } };
});

export const updateAppointment = onCall(async (request) => {
  assertAuth(request);
  assertRole(request.auth, ["admin", "doctor", "receptionist"]);
  const { appointmentId, patch } = request.data as any;
  if (!appointmentId || typeof patch !== "object") {
    throw new HttpsError("invalid-argument", "Invalid appointment patch.");
  }
  await db.collection("appointments").doc(appointmentId).update({
    ...patch,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  return { ok: true, data: { appointmentId, ...patch } };
});

export const createLedgerEntry = onCall(async (request) => {
  assertAuth(request);
  assertRole(request.auth, ["admin", "accountant"]);
  const payload = request.data as any;
  if (!payload?.type || !payload?.patientId || !payload?.relatedTreatmentId || !payload?.amount) {
    throw new HttpsError("invalid-argument", "Invalid ledger payload.");
  }
  if (Number(payload.amount) <= 0) {
    throw new HttpsError("invalid-argument", "Ledger amount must be positive.");
  }

  const ref = db.collection("ledgerEntries").doc();
  const now = admin.firestore.FieldValue.serverTimestamp();
  const entry = {
    id: ref.id,
    type: payload.type,
    amount: Number(payload.amount),
    patientId: payload.patientId,
    relatedTreatmentId: payload.relatedTreatmentId,
    createdBy: request.auth.uid,
    createdAt: now,
    immutable: true,
    currency: payload.currency || "USD",
    notes: payload.notes || "",
  };
  await ref.set(entry);
  await db.collection("auditLogs").add({
    action: "create_ledger_entry",
    actorId: request.auth.uid,
    actorRole: roleFromToken(request.auth),
    resourceType: "ledger",
    resourceId: ref.id,
    createdAt: now,
    immutable: true,
  });
  return { ok: true, data: { ...entry, createdAt: new Date().toISOString() } };
});

export const listLedgerByPatient = onCall(async (request) => {
  assertAuth(request);
  assertRole(request.auth, ["admin", "accountant", "doctor"]);
  const patientId = request.data?.patientId;
  if (!patientId) {
    throw new HttpsError("invalid-argument", "patientId is required.");
  }
  const snap = await db.collection("ledgerEntries").where("patientId", "==", patientId).get();
  const rows = snap.docs.map((doc) => doc.data());
  return { ok: true, data: rows };
});

export const adjustStock = onCall(async (request) => {
  assertAuth(request);
  assertRole(request.auth, ["admin", "doctor", "accountant"]);
  const payload = request.data as any;
  if (!payload?.itemId || !payload?.type || !payload?.reason || !payload?.createdBy) {
    throw new HttpsError("invalid-argument", "Invalid stock movement payload.");
  }
  const qty = Number(payload.quantity);
  if (!Number.isFinite(qty)) {
    throw new HttpsError("invalid-argument", "Quantity must be numeric.");
  }
  const ref = db.collection("stockMovements").doc();
  const movement = {
    id: ref.id,
    itemId: payload.itemId,
    type: payload.type,
    quantity: qty,
    reason: payload.reason,
    createdBy: payload.createdBy,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  };
  await ref.set(movement);
  return { ok: true, data: { ...movement, timestamp: new Date().toISOString() } };
});

export const updateStaffRole = onCall(async (request) => {
  assertAuth(request);
  assertRole(request.auth, ["admin"]);
  const { userId, role } = request.data as any;
  if (!userId || !role) {
    throw new HttpsError("invalid-argument", "Invalid role update payload.");
  }
  await db.collection("users").doc(userId).update({ role, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
  return { ok: true, data: { userId, role } };
});

export const appendAuditEvent = onCall(async (request) => {
  assertAuth(request);
  const payload = request.data as any;
  if (!payload?.action || !payload?.resourceType || !payload?.resourceId) {
    throw new HttpsError("invalid-argument", "Invalid audit payload.");
  }
  const ref = db.collection("auditLogs").doc();
  const event = {
    id: ref.id,
    actorId: request.auth.uid,
    actorRole: roleFromToken(request.auth),
    action: payload.action,
    resourceType: payload.resourceType,
    resourceId: payload.resourceId,
    metadata: payload.metadata || {},
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    immutable: true,
  };
  await ref.set(event);
  return { ok: true, data: { ...event, createdAt: new Date().toISOString() } };
});
