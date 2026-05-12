# Capturing Upstream Changes

Custom changes live on the `font-customisation` branch. `main` tracks upstream.

Scope: workbench UI font customization (`workbench.*` settings) and notebook
Markdown font customization (`notebookMarkdown.*` settings). Both are
centralized in `src/vs/workbench/contrib/positronFontCustomization/`. The
notebook Markdown values are mirrored into the stock keys
(`notebook.markup.fontFamily`, `notebook.markup.fontSize`,
`notebook.markdown.lineHeight`) and injected as
`--vscode-positronNotebook-markdown-*` CSS variables consumed by
`positronNotebook/browser/notebookCells/Markdown.css`.

## Regular update workflow

```bash
git checkout main
git pull
git checkout font-customisation
git rebase main
```

## Handling rebase conflicts

Most likely file: `src/vs/workbench/workbench.common.main.ts` (contains the
one-line import for the font customization contribution).

Other files touched by this branch are Positron-specific or additive (low
upstream conflict risk):

- `src/vs/workbench/contrib/positronFontCustomization/` (entire directory)
- `src/vs/workbench/contrib/positronNotebook/browser/notebookCells/Markdown.css`
  (CSS variable references added to `.positron-markdown-rendered`)
- `build/lib/stylelint/vscode-known-variables.json` (additive list of
  allowed CSS variable names)

```bash
# resolve conflict markers in the file, then:
git add <conflicted-file>
git rebase --continue
```

## Production build (after rebase)

```bash
NODE_OPTIONS="--max-old-space-size=8192" npx gulp vscode-darwin-arm64-min
```

If `-min` fails due to the name mangler (protected-to-public field error), fall back to:

```bash
NODE_OPTIONS="--max-old-space-size=8192" npx gulp vscode-darwin-arm64
```

The non-min build skips mangling and minification. Slightly larger app, functionally identical.
`NODE_OPTIONS` increases the heap limit from the default ~4GB to 8GB to avoid OOM during compilation.

Output lands at `../VSCode-darwin-arm64/`. Rename and move the app:

```bash
mv ../VSCode-darwin-arm64/Positron.app "/Applications/Positron (test).app"
```

Don't run alongside the official Positron - they share the same user data (`~/.positron/`).
