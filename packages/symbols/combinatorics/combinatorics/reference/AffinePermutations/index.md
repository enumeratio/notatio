---
name: AffinePermutations
domain: Combinatorics
signature: AffinePermutations(n, radius)
summary: The affine permutations of period $n$ whose radius is at most `radius`, as a lazy indexed family.
signatures:
  - call: AffinePermutations(n, radius)
    description: the windows $[w(1), \dots, w(n)]$ of the affine permutations of period $n$ with $|w(i) - i| \le$ `radius`, in lexicographic order.
    library: enumeratio-combinatorics
    type: (integer<0..>, integer<0..>) -> indexed_collection<affine_permutation>
seeAlso:
  - SymmetricGroup
grades:
  - name: n
    role: axis
  - name: radius
    role: axis
catalog:
  - system: sage
    identity: AffinePermutationGroup(cartan_type) [sage.combinat.affine_permutation.AffinePermutation]
    url: https://doc.sagemath.org/html/en/reference/combinat/sage/combinat/affine_permutation.html
    note: window-notation elements of the affine symmetric group; our grading by the radius, max_i |w(i) - i| at most r, is our own restriction, not part of the sage class
carrier: AffinePermutation
---

- A member is the window of an affine permutation of period $n$ (see [[AffinePermutation]]) whose radius $\max_i |w(i) - i|$ is at most $r$. The radius is the same at every $i$, since $w(i + n) - (i + n) = w(i) - i$, so it is read off the window. The windows are listed lexicographically: for $n = 2$ and $r = 1$ they are $[0, 3], [1, 2], [2, 1]$.
- Each fiber is finite. The counts, $1, 1, \dots$ at $n = 1$ and $2r + 1$ at $n = 2$, are $1, 4, 13, 25$ for $n = 3$ and $r = 0, 1, 2, 3$, and $1, 7, 33$ for $n = 4$ and $r = 0, 1, 2$. They are checked by brute force; no OEIS sequence for them has been matched. The affine permutations in all (no radius) are infinite, the radius being what grades them. Radius $n - 1$ contains the $n!$ permutations of $[n]$.
