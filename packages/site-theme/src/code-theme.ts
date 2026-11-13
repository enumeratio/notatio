// The code block themes: the site's code tokens (theme/styles/tokens.css) as Shiki themes, so a
// highlighted block uses the palette. Shiki writes colors inline at build, hence the literals;
// keep them equal to the --code-* tokens.

interface Palette {
  ink: string;
  comment: string;
  keyword: string;
  string: string;
  number: string;
  function: string;
  ground: string;
}

const theme = (name: string, type: "light" | "dark", c: Palette) => ({
  name,
  type,
  colors: { "editor.foreground": c.ink, "editor.background": c.ground },
  tokenColors: [
    { scope: ["comment", "punctuation.definition.comment"], settings: { foreground: c.comment, fontStyle: "italic" } },
    {
      scope: ["keyword", "storage", "storage.type", "storage.modifier", "keyword.operator.new", "entity.name.tag"],
      settings: { foreground: c.keyword },
    },
    { scope: ["string", "string.quoted", "markup.inline.raw", "markup.inserted"], settings: { foreground: c.string } },
    {
      scope: ["constant.numeric", "constant.language", "constant.other", "support.constant", "variable.other.constant"],
      settings: { foreground: c.number },
    },
    {
      scope: ["entity.name.function", "support.function", "meta.function-call", "entity.other.attribute-name"],
      settings: { foreground: c.function },
    },
    {
      scope: ["entity.name.type", "entity.name.class", "support.type", "support.class"],
      settings: { foreground: c.ink },
    },
    { scope: ["markup.heading", "markup.bold"], settings: { foreground: c.ink, fontStyle: "bold" } },
    { scope: ["markup.italic"], settings: { fontStyle: "italic" } },
    { scope: ["markup.deleted", "invalid"], settings: { foreground: c.keyword } },
  ],
});

export const codeThemes = {
  light: theme("notatio-paper", "light", {
    ink: "#2a2924",
    comment: "#6b675d",
    keyword: "#8a3324",
    string: "#2b6a3c",
    number: "#7a5200",
    function: "#1f3f95",
    ground: "#f4f2e9",
  }),
  dark: theme("notatio-slate", "dark", {
    ink: "#dedacf",
    comment: "#928e84",
    keyword: "#f08c6f",
    string: "#84c995",
    number: "#e0b25a",
    function: "#a9bcff",
    ground: "#1b1e25",
  }),
};
