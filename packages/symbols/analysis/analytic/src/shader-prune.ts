import { zetaWGSL } from "./shader.ts";

// The library cut at its top-level declarations: a declaration starts on a line that begins with
// a keyword in column 0, and the comment lines above it travel with it.
const DECL = /^(?:fn|const|var<private>|struct)\s+(\w+)/;
const IDENT = /[A-Za-z_]\w*/g;

type Decl = { readonly name: string; readonly text: string; readonly uses: ReadonlySet<string> };

const split = (library: string): Decl[] => {
  const decls: Decl[] = [];
  let pending: string[] = [];
  let current: { name: string; lines: string[] } | undefined;
  const close = () => {
    if (!current) return;
    const text = current.lines.join("\n");
    const uses = new Set(text.replace(/\/\/.*$/gm, "").match(IDENT) ?? []);
    uses.delete(current.name);
    decls.push({ name: current.name, text, uses });
    current = undefined;
  };
  for (const line of library.split("\n")) {
    const m = DECL.exec(line);
    if (m) {
      close();
      current = { name: m[1], lines: [...pending, line] };
      pending = [];
    } else if (current && /^(\s|\}|$)/.test(line)) {
      current.lines.push(line); // a body line or the closing brace
    } else if (line.startsWith("//")) {
      close();
      pending.push(line);
    } else {
      close();
      pending = [];
    }
  }
  close();
  return decls;
};

let library: Decl[] | undefined;

/**
 * The library declarations `code` reaches, in library order: those it names and, transitively, those
 * those name. `code` is the whole host text, so a host that reads module state a kernel writes
 * (`uncertain`, for the portrait's hatching) names it and keeps it.
 */
export function reachableWGSL(code: string): string {
  const decls = (library ??= split(zetaWGSL));
  const seen = new Set<string>();
  const byName = new Map(decls.map((d) => [d.name, d]));
  const visit = (name: string) => {
    if (seen.has(name)) return;
    const d = byName.get(name);
    if (!d) return;
    seen.add(name);
    for (const u of d.uses) visit(u);
  };
  for (const id of new Set(code.replace(/\/\/.*$/gm, "").match(IDENT) ?? [])) visit(id);
  return decls
    .filter((d) => seen.has(d.name))
    .map((d) => d.text)
    .join("\n");
}

/** `host` with the library declarations it reaches in front of it. */
export const withWGSL = (host: string): string => {
  const lib = reachableWGSL(host);
  return lib === "" ? host : `${lib}\n${host}`;
};
