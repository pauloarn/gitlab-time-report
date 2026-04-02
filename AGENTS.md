# AGENTS.md

## Cursor Cloud specific instructions

This is a **client-side React SPA** (no backend) that talks directly to the GitLab GraphQL API and Brasil API from the browser. There are no databases, queues, or backend services to run.

### Running the app

- `pnpm dev` starts the Vite dev server on port 5173 (add `--host 0.0.0.0` if external access is needed).
- The app requires a valid **GitLab personal access token** with `read_api` scope entered at the login screen. Without a real token, the app loads but API calls return 401.
- The secret `GITLAB_API_TOKEN` is configured in the Cloud Agent environment. To test the full flow via `computerUse`, read the token from the environment (`echo $GITLAB_API_TOKEN`) and paste it into the login field.

### Key commands

See `package.json` `scripts` for the full list. The most common:

| Task | Command |
|------|---------|
| Dev server | `pnpm dev` |
| Lint | `pnpm lint` |
| Lint fix | `pnpm lint:fix` |
| Build | `pnpm build` |

### Git hooks

- **pre-commit**: runs `pnpm lint` — commits are blocked if ESLint fails.
- **commit-msg**: enforces Conventional Commits via commitlint. Use `--no-verify` to bypass when necessary.

### Gotchas

- The `esbuild` postinstall script must be allowed to run. The `pnpm.onlyBuiltDependencies` field in `package.json` handles this non-interactively. If you see an "Ignored build scripts: esbuild" warning after `pnpm install`, the build will fail.
- ESLint config uses flat config (ESLint 9). The lint command uses `--ext .ts,.tsx` flags.
- The app is branded "Git Horas" and the UI is in Portuguese (Brazilian).
