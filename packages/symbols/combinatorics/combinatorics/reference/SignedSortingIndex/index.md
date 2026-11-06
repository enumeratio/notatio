---
name: SignedSortingIndex
domain: Permutation statistics
signature: SignedSortingIndex(p)
summary: The sum, over the signed transpositions that sort p by moving n, then n - 1, and so on into place, of j - i - 1 when i < 0 and j - i otherwise.
signatures:
  - call: SignedSortingIndex(p)
    description: The sum, over the signed transpositions that sort p by moving n, then n - 1, and so on into place, of j - i - 1 when i < 0 and j - i otherwise.
    library: enumeratio-combinatorics
    type: (signed_permutation) -> number
catalog:
  - system: findstat
    identity: St001821
    url: https://www.findstat.org/St001821
    on: SignedPermutation
statOn:
  - SignedPermutation
---

- Defined over `SignedPermutation` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `SignedPermutation` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001821. The fold carries the total and the word, as SortingIndex does.
