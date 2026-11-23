---
name: AffinePermutation
domain: Combinatorics
signature: AffinePermutation(window)
summary: An affine permutation, as its window $[w(1), \dots, w(n)]$.
catalogCarrier: true
signatures:
  - call: AffinePermutation(window)
    description: An affine permutation of period $n$, as its window $[w(1), \dots, w(n)]$.
    library: enumeratio-combinatorics
    type: (list<integer>) -> affine_permutation
---

- The list is the window of a bijection $w$ of the integers with $w(i + n) = w(i) + n$: its entries have distinct residues mod $n$ and sum to $n(n+1)/2$. The rest is read from the window, $w(i + kn) = w(i) + kn$. The identity is $[1, 2, \dots, n]$.
- `AffinePermutation([0, 3])` has period 2 and takes 1 to 0 and 2 to 3.
- The family [[AffinePermutations]] lists those of a period within a radius.
