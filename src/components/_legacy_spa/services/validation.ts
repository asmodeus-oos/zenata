export function assertNonEmptyString(value: string, field: string) {
  if (!value || !value.trim()) {
    throw new Error(`${field} is required.`);
  }
}

export function assertPositiveAmount(value: number, field: string) {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${field} must be a positive number.`);
  }
}

export function assertNonNegative(value: number, field: string) {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${field} must be a non-negative number.`);
  }
}

export function assertIsoDate(value: string, field: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`${field} must be in YYYY-MM-DD format.`);
  }
}

export function assertPhone(value: string, field: string) {
  if (!/^[+\d\s\-()]{7,25}$/.test(value)) {
    throw new Error(`${field} has invalid format.`);
  }
}
