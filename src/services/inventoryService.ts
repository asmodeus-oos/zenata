import { backendClient } from "../api/backendClient";
import { StockMovement } from "../types";
import { assertNonEmptyString, assertPositiveAmount } from "./validation";

export const inventoryService = {
  async addStock(input: {
    itemId: string;
    quantity: number;
    reason: string;
    createdBy: string;
  }): Promise<StockMovement> {
    assertNonEmptyString(input.itemId, "itemId");
    assertPositiveAmount(input.quantity, "quantity");
    assertNonEmptyString(input.reason, "reason");
    assertNonEmptyString(input.createdBy, "createdBy");
    return backendClient.inventory.addMovement({
      itemId: input.itemId,
      type: "add",
      quantity: input.quantity,
      reason: input.reason,
      createdBy: input.createdBy,
    });
  },

  async consumeStock(input: {
    itemId: string;
    quantity: number;
    reason: string;
    createdBy: string;
  }): Promise<StockMovement> {
    assertNonEmptyString(input.itemId, "itemId");
    assertPositiveAmount(input.quantity, "quantity");
    assertNonEmptyString(input.reason, "reason");
    assertNonEmptyString(input.createdBy, "createdBy");
    return backendClient.inventory.addMovement({
      itemId: input.itemId,
      type: "consume",
      quantity: input.quantity,
      reason: input.reason,
      createdBy: input.createdBy,
    });
  },

  async adjustStock(input: {
    itemId: string;
    quantity: number;
    reason: string;
    createdBy: string;
  }): Promise<StockMovement> {
    assertNonEmptyString(input.itemId, "itemId");
    assertNonEmptyString(input.reason, "reason");
    assertNonEmptyString(input.createdBy, "createdBy");
    return backendClient.inventory.addMovement({
      itemId: input.itemId,
      type: "adjust",
      quantity: input.quantity,
      reason: input.reason,
      createdBy: input.createdBy,
    });
  },
};
