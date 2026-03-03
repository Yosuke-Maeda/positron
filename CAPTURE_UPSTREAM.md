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
