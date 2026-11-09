---
name: CounterclockwiseRotation
domain: Combinatorial maps
signature: CounterclockwiseRotation(AlternatingSignMatrix)
summary: "The quarter turn counterclockwise: the last column becomes the first row."
catalog:
  - system: findstat
    identity: Mp00003
    url: https://www.findstat.org/Mp00003
    on: AlternatingSignMatrix
mapOn:
  - AlternatingSignMatrix
signatures:
  - call: CounterclockwiseRotation(AlternatingSignMatrix)
    description: "The quarter turn counterclockwise: the last column becomes the first row."
    library: enumeratio-combinatorics
    type: (alternating_sign_matrix) -> alternating_sign_matrix
---

- Takes a `AlternatingSignMatrix` and returns a `AlternatingSignMatrix` — a typed map, so a wrong carrier is a type error rather than a wrong answer.
- FindStat's Mp00003; the inverse is ClockwiseRotation.
