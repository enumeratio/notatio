---
title: Notebook
sidebar: false
aside: false
pageClass: notebook-page
---

<script setup>
import { starters } from "./starters.ts";
const seed = JSON.stringify(starters.basics);
</script>

# Notebook

The notebook is a column of cells that work each other out. Each cell holds one expression and
shows its answer beneath it; a cell that binds a name with `:=` (`r := Sqrt(8)`) lets every
other cell use that name, and editing the definition re-runs everything that reads it. Cells
refer to each other **by name**, never by position, so you can drag one to a new place without
breaking another. The [worksheet](/worksheet/) is the same cells with a screen: a number you
bind gets a slider, and a cell with a free `x` or `z` is drawn.

|                   | notebook                                  | worksheet                                 |
| ----------------- | ----------------------------------------- | ----------------------------------------- |
| a cell is         | one expression and its answer             | one expression and its view               |
| a number you bind | stays a number, edited in the cell        | gets a slider                             |
| a free `x` or `z` | stays symbolic; ask `Plot` to draw it     | drawn on the shared screen                |
| refer to a result | by name                                   | by name                                   |
| kept              | in your browser: reload and it is as left | in your browser: reload and it is as left |

Below is a short starter: an evaluation, a definition (`r := …`) used by the cell after it,
and a plot. Click a cell to edit it and press Enter to run it; **Reset** returns the notebook
to the starter, and **Export** saves it as a Jupyter notebook.

<ClientOnly>
<notatio-notebook :seed="seed" />
</ClientOnly>

For what a cell can say, see the [notebook element](/docs/components/notebook); for the heads
it can call, the [symbol reference](/reference/symbol/). The command-line
[REPL](/docs/cli/repl) runs the same expressions in a terminal.

<style>
/* The notebook wants the width: past VPDoc's centred reading column (same selectors, one
   class more specific), as wide as the viewport allows up to a point. */
.notebook-page .VPDoc:not(.has-sidebar) .container,
.notebook-page .VPDoc:not(.has-sidebar) .content {
  max-width: 1280px;
}
</style>
