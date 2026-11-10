import { zetaGLSL } from "./shader.ts";

// The library cut at its top-level declarations: a declaration starts on a line that begins in column 0
// with a type (or `const`), and the comment lines above it travel with it.
const DECL = /^(?:const\s+)?(?:float|int|uint|bool|void|[ib]?vec[234]|mat[234])\s+(\w+)\s*[(=;[]/;
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
 * The library declarations `code` reaches: those it names and, transitively, those those name. Each
 * comes after what it uses, since GLSL declares a name before its first use, and otherwise in library
 * order. `code` is the whole host text, so a host that reads module state a kernel writes
 * (`uncertain`, for the portrait's hatching) names it and keeps it.
 */
export function reachableGLSL(code: string): string {
  const decls = (library ??= split(zetaGLSL));
  const byName = new Map(decls.map((d) => [d.name, d]));
  const wanted = new Set<string>();
  const want = (name: string) => {
    if (wanted.has(name)) return;
    const d = byName.get(name);
    if (!d) return;
    wanted.add(name);
    for (const u of d.uses) want(u);
  };
  for (const id of new Set(code.replace(/\/\/.*$/gm, "").match(IDENT) ?? [])) want(id);
  const placed = new Set<string>();
  const out: string[] = [];
  const place = (d: Decl) => {
    if (placed.has(d.name)) return;
    placed.add(d.name);
    for (const u of d.uses) {
      const dep = byName.get(u);
      if (dep) place(dep);
    }
    out.push(d.text);
  };
  for (const d of decls) if (wanted.has(d.name)) place(d);
  return out.join("\n");
}

/** `host` with the library declarations it reaches in front of it. */
export const withGLSL = (host: string): string => {
  const lib = reachableGLSL(host);
  return lib === "" ? host : `${lib}\n${host}`;
};
