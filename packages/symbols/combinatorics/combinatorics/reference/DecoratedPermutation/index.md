---
name: DecoratedPermutation
domain: Combinatorics
signature: DecoratedPermutation(entries)
summary: A permutation of $1, \dots, n$ with each fixed point signed, as its one-line list.
catalogCarrier: true
signatures:
  - call: DecoratedPermutation(entries)
    description: A permutation of $1, \dots, n$ with each fixed point signed, as its one-line list.
    library: enumeratio-combinatorics
    type: (list<integer>) -> decorated_permutation
---

- The list is a permutation of $1, \dots, n$ in one-line notation in which a fixed point $j$, an entry $j$ in position $j$, is written $+j$ or $-j$, its decoration, and every other entry is positive; this is the encoding of Sage's `DecoratedPermutation`. Which sign is which colour is a convention.
- `DecoratedPermutation([2, 1, -3])` swaps 1 and 2 and fixes 3 with the minus decoration.
- The family [[DecoratedPermutations]] lists them.
