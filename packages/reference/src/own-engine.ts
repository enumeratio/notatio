// Its own module so a script can name the set without loading the records' reader (`./node.ts`).

/** Packages whose heads need their own engine (statistics over the carriers): the bare-vs-ours
 * provenance comparison (scripts/provenance.ts) can't classify a head whose examples take a
 * carrier-typed argument (`Permutation(...)`, `SetPartition(...)`, …) -- a bare engine doesn't
 * understand the constructor, so the comparison never runs and a genuine override reads as
 * unclassified. Each such package's own entries test runs its examples directly instead. */
export const OWN_ENGINE = new Set(["statistics"]);
