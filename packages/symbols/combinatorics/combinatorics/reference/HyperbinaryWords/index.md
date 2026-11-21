---
name: HyperbinaryWords
domain: Combinatorics
signature: HyperbinaryWords(n)
summary: The hyperbinary representations of $n$, sums of powers of 2 each used at most twice, as a lazy indexed family.
signatures:
  - call: HyperbinaryWords(n)
    description: the digit lists, most significant first, of the ways to write $n$ as $\sum d_i 2^i$ with each $d_i$ in $\{0, 1, 2\}$.
    library: enumeratio-combinatorics
    type: (integer<0..>) -> indexed_collection<hyperbinary_word>
seeAlso:
  - FactorialNumerals
references:
  - system: oeis
    identity: A002487
  - system: wikipedia
    identity: Stern's diatomic series
grades:
  - name: n
    role: axis
carrier: HyperbinaryWord
---

- A representation is the digits $d_k, \dots, d_0$, most significant first, each 0, 1 or 2 with $d_k \ne 0$ and $\sum d_i 2^i = n$; 0 is the empty word. They are listed by the last digit first (0 before 1 before 2), then by the rest in the same way, so the representations of 4 are $(1, 0, 0)$, $(2, 0)$ and $(1, 2)$.
- The count is Stern's diatomic sequence, $b(n) = s(n+1)$, OEIS A002487: $1, 1, 2, 1, 3, 2, 3, 1, 4, 3, 5, \ldots$, from $b(2m+1) = b(m)$ and $b(2m) = b(m) + b(m-1)$.
