/** Coerce Postgres/driver bigint values (often returned as strings) to bigint. */
export function coerceBigInt(value: bigint | number | string | null | undefined): bigint {
  if (value == null || value === "") return 0n;
  if (typeof value === "bigint") return value;
  if (typeof value === "number") {
    if (!Number.isFinite(value) || !Number.isInteger(value)) {
      throw new Error(`Invalid bigint number: ${value}`);
    }
    return BigInt(value);
  }
  const trimmed = String(value).trim();
  if (!/^-?\d+$/.test(trimmed)) {
    throw new Error(`Invalid bigint string: ${value}`);
  }
  return BigInt(trimmed);
}
