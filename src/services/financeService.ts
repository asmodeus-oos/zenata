import { backendClient } from "../api/backendClient";
import { LedgerEntry } from "../types";
import { assertNonEmptyString, assertPositiveAmount } from "./validation";

export const financeService = {
  async addCharge(input: {
    patientId: string;
    relatedTreatmentId: string;
    amount: number;
    createdBy: string;
    notes?: string;
  }): Promise<LedgerEntry> {
    assertNonEmptyString(input.patientId, "patientId");
    assertNonEmptyString(input.relatedTreatmentId, "relatedTreatmentId");
    assertNonEmptyString(input.createdBy, "createdBy");
    assertPositiveAmount(input.amount, "amount");
    return backendClient.finance.createLedgerEntry({
      type: "charge",
      amount: input.amount,
      patientId: input.patientId,
      relatedTreatmentId: input.relatedTreatmentId,
      createdBy: input.createdBy,
      currency: "USD",
      notes: input.notes,
    });
  },

  async addPayment(input: {
    patientId: string;
    relatedTreatmentId: string;
    amount: number;
    createdBy: string;
    notes?: string;
  }): Promise<LedgerEntry> {
    assertNonEmptyString(input.patientId, "patientId");
    assertNonEmptyString(input.relatedTreatmentId, "relatedTreatmentId");
    assertNonEmptyString(input.createdBy, "createdBy");
    assertPositiveAmount(input.amount, "amount");
    return backendClient.finance.createLedgerEntry({
      type: "payment",
      amount: input.amount,
      patientId: input.patientId,
      relatedTreatmentId: input.relatedTreatmentId,
      createdBy: input.createdBy,
      currency: "USD",
      notes: input.notes,
    });
  },

  async addRefund(input: {
    patientId: string;
    relatedTreatmentId: string;
    amount: number;
    createdBy: string;
    notes?: string;
  }): Promise<LedgerEntry> {
    assertNonEmptyString(input.patientId, "patientId");
    assertNonEmptyString(input.relatedTreatmentId, "relatedTreatmentId");
    assertNonEmptyString(input.createdBy, "createdBy");
    assertPositiveAmount(input.amount, "amount");
    return backendClient.finance.createLedgerEntry({
      type: "refund",
      amount: input.amount,
      patientId: input.patientId,
      relatedTreatmentId: input.relatedTreatmentId,
      createdBy: input.createdBy,
      currency: "USD",
      notes: input.notes,
    });
  },

  async getPatientBalance(patientId: string): Promise<number> {
    assertNonEmptyString(patientId, "patientId");
    const entries = await backendClient.finance.listLedgerByPatient({ patientId });
    return entries.reduce((sum, entry) => {
      if (entry.type === "charge") return sum + entry.amount;
      if (entry.type === "payment" || entry.type === "refund") return sum - entry.amount;
      return sum + entry.amount;
    }, 0);
  },
};
