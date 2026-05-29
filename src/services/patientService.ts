import { backendClient } from "../api/backendClient";
import { Patient } from "../types";
import { assertIsoDate, assertNonEmptyString, assertPhone } from "./validation";

export const patientService = {
  async createPatient(input: Partial<Patient>): Promise<Patient> {
    assertNonEmptyString(input.name || "", "name");
    assertPhone(input.phone || "", "phone");
    assertIsoDate(input.dob || "", "dob");
    assertNonEmptyString(input.gender || "", "gender");
    return backendClient.patient.create(input);
  },

  async updatePatient(patientId: string, patch: Partial<Patient>): Promise<Patient> {
    assertNonEmptyString(patientId, "patientId");
    if (patch.phone) {
      assertPhone(patch.phone, "phone");
    }
    if (patch.dob) {
      assertIsoDate(patch.dob, "dob");
    }
    return backendClient.patient.update({ patientId, patch });
  },
};
