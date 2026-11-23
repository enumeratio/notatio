---
name: FactoradicNumerals
domain: Combinatorics
signature: FactoradicNumerals(n)
summary: The factoradic numerals of $n$ digits, as a lazy indexed family.
signatures:
  - call: FactoradicNumerals(n)
    description: the numerals of $n$ digits in the factorial base, the digit at place $k$ at most $k$, in order of value.
    library: enumeratio-combinatorics
    type: (integer<0..>) -> indexed_collection<factoradic_numeral>
seeAlso:
  - FactorialNumerals
  - LehmerCodes
  - SymmetricGroup
references:
  - system: oeis
    identity: A001563
  - system: wikipedia
    identity: Factorial number system
grades:
  - name: n
    role: axis
carrier: FactoradicNumeral
---

- A numeral is the digits $d_{n-1}, \dots, d_0$, most significant first, with $0 \le d_k \le k$ (so $d_0 = 0$), as [[FactorialNumerals]] writes a number: no leading 0, except that $0$ is `[0]`. Its value is $\sum d_k k!$. They are listed by value, which is their lexicographic order, so for $n = 3$ they are $(1,0,0), (1,1,0), (2,0,0), (2,1,0)$, the values 2 to 5.
- The numerals of $n \ge 2$ digits are the values from $(n-1)!$ to $n! - 1$, so there are $n! - (n-1)!$ of them: $1, 4, 18, 96, 600, \ldots$ for $n = 2, 3, 4, \ldots$, OEIS A001563 shifted by one place ($(n-1) \cdot (n-1)!$). There is one numeral of 1 digit, $[0]$, and none of 0. The numerals with leading zeros allowed, $n!$ of them, are the [[LehmerCodes]].
