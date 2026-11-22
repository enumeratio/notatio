---
name: DecoratedPermutations
domain: Combinatorics
signature: DecoratedPermutations(n)
summary: The permutations of $n$ with each fixed point signed, as a lazy indexed family.
signatures:
  - call: DecoratedPermutations(n)
    description: the one-line lists of the permutations of $1, \dots, n$, a fixed point $j$ written $-j$ or $j$ and every other entry positive, by their absolute values in lexicographic order, $-j$ before $j$.
    library: enumeratio-combinatorics
    type: (integer<0..>) -> indexed_collection<decorated_permutation>
seeAlso:
  - SymmetricGroup
  - SignedPermutations
references:
  - system: oeis
    identity: A000522
catalog:
  - system: oeis
    identity: A000522
    url: https://oeis.org/A000522
  - system: sage
    identity: DecoratedPermutations(n)
grades:
  - name: n
    role: axis
carrier: DecoratedPermutation
---

- A decorated permutation is a permutation whose fixed points each carry one of two decorations, a sign: the list is its one-line notation with a fixed point $j$ written $-j$ or $+j$. They are listed by the permutation of absolute values in lexicographic order, a fixed point's $-j$ before its $+j$; for $n = 2$ they are $(-1, -2), (-1, 2), (1, -2), (1, 2), (2, 1)$.
- There are $\sum_k \binom{n}{k} (n - k)!$ of them, OEIS A000522: $1, 2, 5, 16, 65, 326, \ldots$. Choose the $k$ fixed points and permute the rest without one, then sign the fixed points.
