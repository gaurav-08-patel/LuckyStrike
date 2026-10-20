export const parseDbBooleanFlag = (value: unknown): boolean => {
  // Keep real booleans unchanged.
  if (typeof value === "boolean") {
    return value;
  }

  // DB drivers may return tinyint flags as numbers (1 / 0).
  if (typeof value === "number") {
    return value === 1;
  }

  // Some environments return flags as strings ("1", "0", "true", "false").
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["1", "true", "yes"].includes(normalized)) {
      return true;
    }
    if (["0", "false", "no", ""].includes(normalized)) {
      return false;
    }
  }

  // Safe default: if we are not sure, treat as false (not admin / not verified).
  return false;
};
