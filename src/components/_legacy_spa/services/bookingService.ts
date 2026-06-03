import { backendClient } from "../api/backendClient";
import { Appointment } from "../types";
import { assertIsoDate, assertNonEmptyString, assertPhone } from "./validation";

export const bookingService = {
  async createAppointment(input: Omit<Appointment, "id">): Promise<Appointment> {
    assertNonEmptyString(input.patientId, "patientId");
    assertNonEmptyString(input.patientName, "patientName");
    assertPhone(input.patientPhone, "patientPhone");
    assertNonEmptyString(input.doctorName, "doctorName");
    assertIsoDate(input.date, "date");
    assertNonEmptyString(input.time, "time");
    return backendClient.booking.create(input);
  },

  async updateAppointment(appointmentId: string, patch: Partial<Appointment>): Promise<Appointment> {
    assertNonEmptyString(appointmentId, "appointmentId");
    if (patch.date) assertIsoDate(patch.date, "date");
    return backendClient.booking.update({ appointmentId, patch });
  },
};
