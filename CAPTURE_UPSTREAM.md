# Capturing Upstream Changes

Custom changes live on the `my-font-customization` branch. `main` tracks upstream.

## Regular update workflow

```bash
git checkout main
git pull
git checkout my-font-customization
git rebase main
```

## Handling rebase conflicts

Most likely file: `src/vs/workbench/workbench.common.main.ts` (contains the one-line import for font customization).

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
