# Frontend Setup

An offline-first CLI for setting up a consistent frontend foundation without forcing the same architecture onto every framework.

It packages a reusable frontend architecture playbook into an interactive developer workflow: detect the project, choose a profile, preview the plan, generate only relevant files, and document decisions.

Docs: [frontend-setup-cli.pages.dev](https://frontend-setup-cli.pages.dev)

The primary executable is `frontend-setup`, with `setup` as a bin alias. Prefer `npx frontend-setup` so you do not hit the unrelated npm package named `setup`.

## Commands

```sh
# Interactive setup
npx frontend-setup init

# Other package managers
pnpm dlx frontend-setup init
yarn dlx frontend-setup init  # modern Yarn (Berry)
bunx --bun frontend-setup init  # run with Bun instead of Node.js

# Non-interactive setup (framework and profile are explicit)
npx frontend-setup init --yes --framework react-vite --profile landing-page

# Install the selected motion engine packages when desired
npx frontend-setup init --yes --framework react-vite --profile landing-page --motion --motion-engine gsap --install-deps

# Preview changes without writing
npx frontend-setup init --framework astro --profile marketing-site --dry-run

# Check the latest published CLI version
npx frontend-setup update

# Configure and refresh a read-only JSON recipe catalog
npx frontend-setup connect https://frontend-setup-cli.pages.dev/catalog/v1/catalog.json
npx frontend-setup sync

# Verify current project detection and configuration
npx frontend-setup doctor
```

> Modern Yarn uses `yarn dlx`; Yarn Classic users can run the npm `npx` command or install the CLI as a dev dependency. Both `frontend-setup` and `setup` binaries are declared, so package managers can resolve the package-name command consistently. Bun can execute the CLI with its own runtime via `bunx --bun`.
>
> The unqualified command `npx setup init` resolves the separate npm package named `setup`, which is already registered. Use `npx frontend-setup init`, or to invoke the `setup` executable explicitly, `npx --yes --package=frontend-setup setup init`.

## Supported framework adapters

- `next-app-router`
- `react-vite`
- `astro`
- `expo`
- `react-router`
- `vanilla`

## Supported project profiles

- `landing-page`
- `marketing-site`
- `cms-blog`
- `saas-dashboard`
- `general-web-app`
- `design-system`
- `interactive-experimental`

## What `init` does

1. Checks the current directory's framework metadata and package-manager markers.
2. Asks for the framework/profile when detection is ambiguous or the user wants to override it.
3. Chooses a minimal setup plan and previews the files before writing.
4. Creates `frontend-architecture.config.json` and `ARCHITECTURE.md`.
5. Generates a CSS token foundation for web projects, or TypeScript tokens for Expo.
6. Optionally generates the motion foundation appropriate to web or Expo.
7. Preserves existing files by default. `--force` creates backups before replacements.

`init` is an architecture bootstrapper, not a replacement for `create-next-app`, `create-vite`, `create-astro`, `create-expo-app`, or another framework's official project creator. Run it inside an existing project (or after creating the framework shell). It does not install framework dependencies or alter existing app entry files.

When motion is enabled, interactive setup offers to install missing motion packages. Non-interactive runs never install project dependencies unless `--install-deps` is passed explicitly. GSAP and `@gsap/react` use the detected package manager; Expo Reanimated dependencies are installed with the Expo-aware `expo install` command to respect SDK compatibility. CSS/native and custom motion choices do not trigger package installation. The custom engine name is documented but never fetched or executed by the CLI.

## Configuration

The generated `frontend-architecture.config.json` is the machine-readable project config, while `ARCHITECTURE.md` records human-readable decisions. Web motion offers GSAP, CSS/native browser APIs, or a named custom engine; Expo offers Reanimated, React Native's Animated API, or a named custom engine. The defaults can be overridden during setup or by editing the config for your agent workflow.

## Privacy

There is no telemetry or analytics. The CLI inspects only limited local metadata used for framework detection; it does not upload project files or project metadata. Network requests occur only when the user invokes update/catalog commands, and those requests are read-only. After an explicit `connect` and `sync`, `init` displays relevant framework/profile notes from the cached catalog; the notes do not change local scaffold templates. See [PRIVACY.md](./PRIVACY.md).

## Development

```sh
npm install
npm run dev -- init
npm run typecheck
npm test
npm run build
```

## Architecture references

The `references/` directory carries forward the architecture skill: CSS and token conventions, framework adapters, project sizing, GSAP/Reanimated lifecycle rules, state/API defaults, and documentation requirements.
