---
name: PrimaryDinversionPairCount
domain: Parking function statistics
signature: PrimaryDinversionPairCount(parkingFunction)
summary: The pairs of cars in rows r < s of the labeled Dyck path with equal areas and the lower label first.
catalog:
  - system: findstat
    identity: St000194
    url: https://www.findstat.org/St000194
    on: ParkingFunction
statOn:
  - ParkingFunction
signatures:
  - call: PrimaryDinversionPairCount(parkingFunction)
    description: The pairs of cars in rows r < s of the labeled Dyck path with equal areas and the lower label first.
    library: enumeratio-combinatorics
    type: (parking_function) -> number
---

- Defined over `ParkingFunction` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `ParkingFunction` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000194. The cars stack by spot, then label; the area of a row is its height less the spot of its car.
