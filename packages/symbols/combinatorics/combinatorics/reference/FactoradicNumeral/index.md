---
name: FactoradicNumeral
domain: Combinatorics
signature: FactoradicNumeral(digits)
summary: A factoradic numeral, as its digits, most significant first.
catalogCarrier: true
signatures:
  - call: FactoradicNumeral(digits)
    description: A factoradic numeral, as its digits, most significant first.
    library: enumeratio-combinatorics
    type: (list<integer>) -> factoradic_numeral
---

- The list holds the digits of a number in the factorial base, most significant first: the digit at place $k$ (counting from 0 at the end) is at most $k$, so the last digit is always 0. It is written as [[FactorialNumerals]] writes it, with no leading 0 except in the numeral $0$, `[0]`.
- `FactoradicNumeral([1, 0, 0, 0])` is $1 \cdot 3! = 6$.
- The list does not hold how many digits the family has: `Element(x, FactoradicNumerals(n))` asks.
- The family [[FactoradicNumerals]] lists the numerals of $n$ digits.
