import { backendClient } from "../api/backendClient";
import { UserRole } from "../types";
import { assertNonEmptyString } from "./validation";

const allowedRoles: UserRole[] = ["admin", "doctor", "receptionist", "accountant", "clinician", "frontdesk"];

export const staffService = {
  async updateRole(userId: string, role: UserRole) {
    assertNonEmptyString(userId, "userId");
    if (!allowedRoles.includes(role)) {
      throw new Error("Invalid role.");
    }
    return backendClient.staff.updateRole({ userId, role });
  },
};
