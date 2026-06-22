# Volt Calc — Kita-Zuschuss Rechner drop-in build

Builds the standalone React calculator into one self-contained HTML fragment
that drops into a voltsite (Kirby) page. The widget renders inside a **Shadow
DOM** and injects its own stylesheet there, so its Tailwind cannot collide with
the host page's Tailwind (an earlier global-CSS build broke voltsite's sidebar).

## Build

```sh
bun install
bun run ingest                 # newest sources/*.html  ->  src/main.jsx
bun run build                  # src  ->  kita-zuschuss-rechner.droppable.html
```

`bun run ingest path/to/file.html` ingests a specific file instead of the newest
in `sources/`.

## New version from the author

1. Drop the new standalone `.html` into `sources/`.
2. `bun run ingest` (picks the newest file there).
3. `bun run build`.
4. Check the build succeeds and the widget renders (open `dist/index.html`).

If the author changed the Tailwind theme in the HTML `<head>` (fonts/colors),
mirror that into `src/widget.css` — the HTML's `<head>` config is not used.

## Deploy

Paste `kita-zuschuss-rechner.droppable.html` into the voltsite page's **content**
field under the **Raw HTML** (`blank`) template — **not** a kirbytext/Markdown
field, which strips the inline `<script>` and the widget never mounts.

## Layout

| Path | Role |
| --- | --- |
| `sources/` | the author's standalone HTML versions — build input |
| `src/main.jsx` | React source, **generated** by `ingest.mjs` (do not hand-edit) |
| `src/widget.css` | Tailwind + theme — styling source of truth |
| `index.html` | Vite dev entry (`bun run dev`) and single-file build entry |
| `ingest.mjs` | standalone HTML → `src/main.jsx` (CDN glue → ESM imports + Shadow-DOM mount) |
| `build-droppable.mjs` | `dist/index.html` → the drop-in fragment (asserts zero global CSS) |
| `vite.config.mjs` | React + Tailwind + single-file inline build |
| `kita-zuschuss-rechner.droppable.html` | **the deliverable** |
| `dist/` | Vite build output (gitignored) |
| `legacy/` | the previous vanilla calculator + `OLD-CALC-SNIPPET.htm` reference |

## How it works

`ingest.mjs` keeps the author's component logic verbatim and swaps only the glue:
the CDN `const { … } = React;` becomes ESM imports + the CSS imported as a string
(`?inline`), and `ReactDOM.createRoot(#root).render(…)` becomes a Shadow-DOM mount
on `#kita-zuschuss-rechner-root`. Vite (`vite-plugin-singlefile`) inlines
everything into `dist/index.html`; `build-droppable.mjs` strips that to a fragment
(no `<!doctype>`/`<head>`/`<body>`, no global `<style>`) and fails the build if any
global CSS would leak to the host.
