---
name: HyperbinaryWord
domain: Combinatorics
signature: HyperbinaryWord(digits)
summary: A hyperbinary representation, as its digits 0, 1 or 2, most significant first.
catalogCarrier: true
signatures:
  - call: HyperbinaryWord(digits)
    description: A hyperbinary representation, as its digits 0, 1 or 2, most significant first.
    library: enumeratio-combinatorics
    type: (list<integer>) -> hyperbinary_word
---

- The list holds the digits $d_k, \dots, d_0$, each 0, 1 or 2, of a representation $\sum d_i 2^i$ of some $n$, with $d_k \ne 0$; the empty list represents 0. The list does not hold $n$, which `Element(x, HyperbinaryWords(n))` asks.
- `HyperbinaryWord([1, 2, 0])` is $1 \cdot 4 + 2 \cdot 2 + 0 = 8$.
- The family [[HyperbinaryWords]] lists the representations of $n$.
