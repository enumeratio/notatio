/** The widest gap at which a value agrees with its reference: `tolerance` relative to the larger of
 * the two sizes, so a tiny value is held to its own digits (`1.9e-55` is not `1.9e-55 + 1.4e-55i`).
 * Only a reference of exactly 0 keeps a floor of 1, where a relative bound has nothing to measure.
 * The one rule for the known check (`@notatio/reference`) and the oracle comparers. */
export const agreementBound = (tolerance: number, size: number, referenceSize: number): number =>
  tolerance * (referenceSize === 0 ? Math.max(size, 1) : Math.max(size, referenceSize));
