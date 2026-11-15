// B(a, b) = Γ(a)Γ(b)/Γ(a+b) where a + b is a pole of Γ and a and b are not.

/**
 * Is B(a, b) exactly 0? Γ(a) and Γ(b) are finite (neither is a non-positive integer) and Γ(a + b)
 * is a pole, so the quotient vanishes: B(−5/2, 1/2) = Γ(−5/2)Γ(1/2)/Γ(−2) = 0. Two non-integers
 * summing to an integer is the only way to get here, and the sum must be non-positive to be a pole.
 */
export const betaIsZero = (a: number, b: number): boolean => {
  const sum = a + b;
  return Number.isInteger(sum) && sum <= 0 && Number.isFinite(a) && Number.isFinite(b) && !Number.isInteger(a);
};

/** The same test as `betaIsZero`, as the source of a JavaScript function of (a, b) for compiled code. */
export const BETA_IS_ZERO_SOURCE =
  "(a, b) => Number.isInteger(a + b) && a + b <= 0 && Number.isFinite(a) && Number.isFinite(b) && !Number.isInteger(a)";
