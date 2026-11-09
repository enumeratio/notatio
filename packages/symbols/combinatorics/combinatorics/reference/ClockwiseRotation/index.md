---
name: ClockwiseRotation
domain: Combinatorial maps
signature: ClockwiseRotation(AlternatingSignMatrix)
summary: "The quarter turn clockwise: the first column becomes the first row, read from the bottom."
catalog:
  - system: findstat
    identity: Mp00004
    url: https://www.findstat.org/Mp00004
    on: AlternatingSignMatrix
mapOn:
  - AlternatingSignMatrix
signatures:
  - call: ClockwiseRotation(AlternatingSignMatrix)
    description: "The quarter turn clockwise: the first column becomes the first row, read from the bottom."
    library: enumeratio-combinatorics
    type: (alternating_sign_matrix) -> alternating_sign_matrix
---

- Takes a `AlternatingSignMatrix` and returns a `AlternatingSignMatrix` — a typed map, so a wrong carrier is a type error rather than a wrong answer.
- FindStat's Mp00004; the inverse is CounterclockwiseRotation.
