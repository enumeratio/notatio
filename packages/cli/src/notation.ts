// Every package's notation entry, by manifest name, as the manifest's `NOTATIONS` lists them
// (tests/notation.test.ts holds the two together). Imported statically: the entries are light,
// and a session's engine needs all of them when it's constructed.

import { notation as analytic } from "@notatio/analytic/notation";
import type { PackageNotation } from "@notatio/boxes";
import { notation as braid } from "@notatio/braid/notation";
import { notation as combinatorics } from "@notatio/combinatorics/notation";
import { notation as diagram } from "@notatio/diagram/notation";
import { notation as groupalgebra } from "@notatio/groupalgebra/notation";
import { notation as hecke } from "@notatio/hecke/notation";
import { notation as hopf } from "@notatio/hopf/notation";
import { notation as hypercomplex } from "@notatio/hypercomplex/notation";
import { notation as incidence } from "@notatio/incidence/notation";
import { notation as modular } from "@notatio/modular/notation";
import { notation as numberTheory } from "@notatio/number-theory/notation";
import { notation as numerals } from "@notatio/numerals/notation";
import { notation as quiver } from "@notatio/quiver/notation";
import { notation as residues } from "@notatio/residues/notation";
import { notation as structures } from "@notatio/structures/notation";

export const NOTATION_ENTRIES: Readonly<Record<string, PackageNotation>> = {
  analytic,
  braid,
  combinatorics,
  diagram,
  groupalgebra,
  hecke,
  hopf,
  hypercomplex,
  incidence,
  modular,
  "number-theory": numberTheory,
  numerals,
  quiver,
  residues,
  structures,
};
