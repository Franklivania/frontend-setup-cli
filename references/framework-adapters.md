# Framework Adapters

Use the adapter that matches the repository. Framework-native conventions take precedence over identical-looking folder names. All examples are starting points; omit unused directories.

## 1. Next.js App Router

### Structure

```text
src/
  app/
    layout.tsx
    page.tsx
    globals.css             # optional framework entry; can import shared styles
    (marketing)/            # only when shared route/layout behavior justifies it
    (dashboard)/            # only when needed
  components/
    ui/
    sections/               # optional
  layout/                   # reusable application shells, not route files
  lib/
  services/                 # optional
  hooks/                    # optional
  store/                    # optional
  styles/
  types/
```

### Rules

- Respect App Router server/client boundaries. Keep components server-rendered by default and add `'use client'` only where interactive browser APIs, local state, event handlers, or client-only libraries require it.
- Use `src/app/` for routes, layouts, loading/error boundaries, and route-level metadata. Keep reusable UI and domain logic outside the route tree unless route-local ownership is clearer.
- Prefer framework-native loading, mutations, caching, and revalidation when suitable. Use TanStack Query for client-side caching/synchronization requirements that genuinely benefit from it, not automatically for all fetched data.
- Import global CSS through the root layout as the framework requires. Shared tokens/global styles may live in `src/styles/` and be imported by the global style entry.
- Use route groups such as `(marketing)` or `(dashboard)` only when they help organize shared layouts or route concerns. Never create them speculatively.
- Check server/client compatibility before using GSAP or browser DOM helpers; animation code must run on the client. Use `useGSAP` for React components when installed/appropriate, with scoped selectors and cleanup.

## 2. React + Vite

### Structure

```text
src/
  main.tsx
  App.tsx
  components/
    ui/
    sections/               # optional
  layout/
  lib/
  services/                 # optional
  hooks/                     # optional
  store/                     # optional
  styles/
  types/
```

### Rules

- Do not install or impose a router unless the project needs one. If routing is needed, use the requested/established router or suggest React Router.
- Keep `main.tsx` as the composition/bootstrap entry point; avoid pushing product logic into it.
- Use component-scoped CSS or the repository's established style strategy, with shared tokens imported from the common stylesheet entry.
- GSAP can be used in client components. Prefer `useGSAP` where the project uses React and the package is available/appropriate; otherwise use explicit effect cleanup and scope selectors to a component root.
- Choose API/state packages based on actual complexity, not because Vite is present.

## 3. Astro

### Structure

```text
src/
  pages/
  layouts/                   # Astro's native plural directory convention
  components/
  content/                   # only when using Astro content collections/content-driven content
  styles/
  scripts/                   # optional plain JS/TS behavior
  lib/                       # optional
  services/                  # only when browser/server API concerns justify it
  types/                     # optional
```

### Rules

- Prefer `.astro` components and Astro's static-first rendering where they satisfy the request.
- Use `src/pages/` for file-based routes and `src/layouts/` for Astro layouts. Do not force the shared `layout/` name onto this framework.
- Add React or another UI framework only for interactive islands that benefit from it. Avoid hydrating a whole page for a small interactive control.
- Choose island architecture explicitly when interaction scope materially changes the implementation. A clean Astro + client script setup is valid and should not be replaced with React islands by default.
- For browser-only GSAP, initialize in client-side scripts/lifecycle points that run after the target elements exist; clean up listeners and ScrollTriggers. If a React island is used, apply the React adapter's lifecycle practices. Do not introduce React merely to use `useGSAP`.
- Content collections/CMS integrations are conditional on how the site's content is supplied.

## 4. React Native + Expo

### Structure

```text
src/
  app/                       # when using Expo Router; otherwise follow chosen navigation setup
  components/
    ui/
  layout/
  hooks/
  lib/
  services/
  store/                     # only when needed
  styles/
    tokens.ts
  types/
    index.ts
```

### Rules

- Use React Native components and styling. Web CSS files, CSS selectors, browser globals, and DOM mutation helpers do not transfer to Expo.
- `src/app/` is for Expo Router where supported and selected; otherwise honor the configured navigation library and its required route locations.
- Keep cross-platform principles in shared tokens, but implement platform-specific values with native style objects and use `.ios`, `.android`, `.native`, or `.web` files only when a real platform divergence requires them.
- Use React Native Reanimated for complex native motion and gestures. Prefer native capabilities for simple motion where they meet the requirement. Do not use GSAP or DOM selectors in native components.
- Motion targeting should use native refs, props, accessible roles, and `testID` only where it serves testing/targeting; do not pretend `data-*` DOM attributes are available in native views.
- Keep API/state defaults configurable as described in `state-and-api.md`.
- Verify device/simulator behavior only when actually available; do not report an unrun simulator test as completed.

## 5. React Router

React Router is a distinct adapter from plain React + Vite because its route and data conventions affect architecture. Establish whether the project uses Declarative Mode, Data Mode, or Framework Mode by inspecting dependencies/configuration and user instructions.

### Typical structure (Data/Declarative Mode)

```text
src/
  main.tsx
  router.tsx                # or route configuration file appropriate to the mode
  routes/                    # route modules when route count/complexity warrants them
  components/
    ui/
  layout/
  lib/
  services/                 # optional
  hooks/                     # optional
  store/                     # optional
  styles/
  types/
```

### Rules

- Do not force `routes/` if the app has only a few simple routes; keep route definitions next to the router when that is clearer.
- Use React Router's loaders/actions and pending/error UI where they fit the selected mode rather than duplicating the same request lifecycle in component effects.
- In Framework Mode, use its conventions and generated route types, and keep server/client execution boundaries explicit.
- Use root layout shells for shared navigation and page structure. Keep reusable components outside route-only modules.
- Do not install React Router on a plain Vite app unless routing is required or requested.

## 6. Vanilla HTML, CSS, and JavaScript

### Structure

```text
src/
  assets/
  components/                # optional markup templates or modules; no framework assumption
  scripts/
    main.js
  styles/
    tokens.css
    reset.css
    typography.css
    utilities.css
    animations.css
    global.css
  lib/                        # optional
```

### Rules

- Prefer native ES modules and progressive enhancement. Keep markup usable and semantic before JavaScript enhances behavior.
- Do not introduce a UI framework, state library, or GSAP package automatically. GSAP is added when the design or interactions justify it and the user has approved/selected the dependency path.
- Use modular JS by responsibility and avoid one giant script. Keep selectors scoped and stable; data attributes are suitable for behavior and motion targeting.
- CSS tokens, BEM names, fluid typography, and shared styles follow `core-conventions.md`.
- Keep build tooling optional unless the project needs bundling, TypeScript, asset processing, or tests.
