---
name: SecondaryDinversionPairCount
domain: Parking function statistics
signature: SecondaryDinversionPairCount(parkingFunction)
summary: The pairs of cars in rows r < s with the area of the first one more than the second's and the larger label first.
catalog:
  - system: findstat
    identity: St000195
    url: https://www.findstat.org/St000195
    on: ParkingFunction
statOn:
  - ParkingFunction
signatures:
  - call: SecondaryDinversionPairCount(parkingFunction)
    description: The pairs of cars in rows r < s with the area of the first one more than the second's and the larger label first.
    library: enumeratio-combinatorics
    type: (parking_function) -> number
---

- Defined over `ParkingFunction` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `ParkingFunction` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000195.
