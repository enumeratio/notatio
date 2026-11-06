---
name: FiniteCartanTypes
domain: Collections
signature: FiniteCartanTypes(rank)
summary: The irreducible finite Cartan types of a rank, as a lazy indexed family in FindStat's order.
signatures:
  - call: FiniteCartanTypes(rank)
    library: enumeratio-combinatorics
    description: the irreducible finite Cartan types of the given rank, ordered by letter.
    type: (integer<0..>) -> indexed_collection<cartan_type>
enumerate:
  expr: FiniteCartanTypes(4)
seeAlso:
  - CartanType
  - WeylGroupOrder
  - CoxeterNumber
grades:
  - name: rank
    role: axis
carrier: CartanType
---

- The types of rank $n$ are $A_n$ for $n \ge 1$, $B_n$ for $n \ge 2$, $C_n$ for $n \ge 3$, $D_n$ for $n \ge 4$, $E_n$ for $n = 6, 7, 8$, $F_4$ and $G_2$, ordered by letter: FindStat's collection `Finite Cartan types`. $C_2$ is $B_2$ and $B_1$, $C_1$ are $A_1$, so they are left out.
- An element is written `CartanType(Tuple("A", 3))`: the letter and the rank, FindStat's `['A', 3]`.
