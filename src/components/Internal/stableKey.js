// JSON with sorted keys, for "has this changed?" checks: Firestore does not
// keep map key order, so plain JSON.stringify would see differences that
// are not there.
export const stableKey = (value) =>
  JSON.stringify(value, (_, v) =>
    v && typeof v === "object" && !Array.isArray(v)
      ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, v[k]]))
      : v
  );
