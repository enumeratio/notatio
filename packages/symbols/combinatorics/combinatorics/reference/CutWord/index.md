---
name: CutWord
domain: Combinatorial maps
signature: CutWord(IntegerComposition)
summary: A composition of n as the binary word of length n - 1 marking where it is cut.
mapOn:
  - IntegerComposition
signatures:
  - call: CutWord(IntegerComposition)
    description: A composition of n as the binary word of length n - 1 marking where it is cut.
    library: enumeratio-combinatorics
    type: (composition) -> binary_word
laws:
  - inverse: IntegerComposition
---

- Takes a `IntegerComposition` and returns a `BinaryWord` — a typed map, so a wrong carrier is a type error rather than a wrong answer.
- Not order-preserving: IntegerCompositions lists compositions lex on their parts, while BinaryWords(n - 1) through IntegerComposition(word) gives them in their cut words' order.
