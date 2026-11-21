/**
 * The conjugate of a composition: the reverse of its complement, the transpose of its ribbon
 * shape. The complement cuts exactly where the composition does not; reversing reads it
 * backwards. `undefined` for a list that is no composition (a part below 1, or not an integer).
 *
 * Hopf's `ConjugateComposition` and the antipode read it, and combinatorics' `TransposeComposition`
 * answers through it, held to its Epsil definition (Complement after Reverse).
 */
export function conjugateComposition(parts: readonly number[]): number[] | undefined {
  if (!parts.every((part) => Number.isInteger(part) && part >= 1)) return undefined;
  const total = parts.reduce((sum, part) => sum + part, 0);
  const cuts = new Set<number>();
  for (let sum = 0, i = 0; i < parts.length - 1; i++) cuts.add((sum += parts[i]!));
  const complement: number[] = [];
  let last = 0;
  for (let position = 1; position < total; position++) {
    if (cuts.has(position)) continue;
    complement.push(position - last);
    last = position;
  }
  if (total > 0) complement.push(total - last);
  return complement.toReversed();
}
