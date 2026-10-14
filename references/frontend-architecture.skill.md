---
name: frontend-architecture
description: Establish or adapt maintainable frontend architecture for Next.js App Router, React with Vite, Astro, React Native with Expo, React Router, and vanilla HTML/CSS/JavaScript. Use when bootstrapping a frontend project, restructuring an existing frontend, defining design tokens and CSS conventions, or setting up responsive styling, motion, state, and API infrastructure.
---

# Frontend Architecture Skill

Set up frontend projects using the user's established conventions while adapting to the selected framework, project profile, and existing repository. Prefer simple, explicit architecture over boilerplate. Defaults are configurable, not mandatory where the project has a sound reason to differ.

## Required workflow

1. **Determine the mode.** For a new application, bootstrap using the requested framework and profile. For an existing repository, inspect its package/configuration files, directory tree, installed dependencies, routes, styling approach, state/data flow, tests, and current conventions before making changes.
2. **Resolve configuration.** Read `frontend-architecture.config.json` if it exists and read `ARCHITECTURE.md` if present. Explicit project instructions and existing valid choices override defaults. If no configuration exists, infer framework and profile from the repo and user request. Use `assets/frontend-architecture.config.json` as the configurable baseline only when creating a new setup; do not overwrite an existing configuration.
3. **Choose an adapter and profile.** Supported adapters: Next.js App Router, React + Vite, Astro, React Native + Expo, React Router, and vanilla HTML/CSS/JavaScript. Supported profiles: landing page, multi-page marketing site, CMS-driven site/blog, SaaS dashboard, general web application, design system/component library, and experimental/interactive website. Consult `references/framework-adapters.md` and `references/project-profiles.md`.
4. **Plan only consequential decisions.** Choose sensible defaults without asking about every directory or dependency. Surface a short choice when a decision materially changes the architecture and cannot be inferred, such as Astro islands vs. framework embedding, a central GSAP registry vs. component-owned timelines, or a chosen router's operating mode. When the user expects direct implementation, make a reasoned choice and document it instead of blocking on questions.
5. **Adapt; do not blindly scaffold.** Create only folders, providers, dependencies, tokens, utilities, and configuration that are useful to the chosen scope. In a new project, create the structure directly. In an existing project, preserve established conventions unless the task requires change. Avoid migrations or broad renames unrelated to the task.
6. **Implement the architecture.** Apply the core rules in `references/core-conventions.md`, the state/API defaults in `references/state-and-api.md`, and the motion contract in `references/motion-system.md`. Follow the selected framework adapter.
7. **Document decisions.** Create or update root `frontend-architecture.config.json` and `ARCHITECTURE.md`. The config records explicit choices; `ARCHITECTURE.md` explains responsibilities, structure, commands, and significant deviations. Do not copy template placeholders into finished documentation.
8. **Verify.** Run available lint, typecheck, tests, and production build commands that are appropriate and feasible. Validate responsive and accessibility concerns in code; do not claim browser/device testing unless actually performed. Report what was created, what was reused, checks actually run, any failures, and consequential choices.

## Non-negotiable principles

- Use the smallest architecture that meets the current requirements and leaves a clear growth path.
- Prefer robust native/framework capabilities when they fit well. Allow projects to configure alternatives.
- Inspect before editing; do not treat the default template as more authoritative than a sound existing codebase.
- Keep CSS class names lowercase kebab-case and BEM-inspired by default: `.navbar`, `.navbar__header`, `.navbar__header-bottom`, `.navbar__link--active`.
- Use shared generic utilities only when they are genuinely reusable across the application. Component-specific styles and behaviors stay with the component where the framework allows it.
- Keep design tokens, semantic styling, responsive rules, and animation behavior intentional and centralized.
- On web, GSAP is the preferred engine for coordinated timelines, scroll-triggered sequences, complex motion, and text animation. Use CSS or platform-native capabilities for simple interactions when they are sufficient. On Expo, use React Native Reanimated for complex native motion; never carry DOM/GSAP DOM manipulation into native code.
- Respect accessibility, reduced motion, dynamic content, framework lifecycle, cleanup, and performance.
- Do not introduce feature-based architecture, themes, global state, animation frameworks, formatting tools, or folders solely because a template contains them.

## Reference loading

Read only the references relevant to the current task:

- `references/core-conventions.md` — naming, styles, tokens, typography, fonts, files, and documentation.
- `references/framework-adapters.md` — framework-specific structure and boundaries.
- `references/project-profiles.md` — how scope influences architecture depth.
- `references/motion-system.md` — GSAP/Reanimated/CSS motion, data attributes, text splitting, lifecycle, and dynamic content.
- `references/state-and-api.md` — state management, fetching, services, endpoint declarations, and types.
- `references/config-and-docs.md` — configuration precedence and the contents of `ARCHITECTURE.md`.

## Completion checklist

- [ ] Framework and project profile identified correctly.
- [ ] Existing conventions and dependencies inspected before editing, unless bootstrapping a new app.
- [ ] Configuration and architecture documentation match the actual implementation.
- [ ] Class/file naming is consistent and no unnecessary folders or packages were added.
- [ ] Responsive typography and style tokens are appropriate to the project; themes exist only when requested or required.
- [ ] Animation code matches the framework and cleans up correctly.
- [ ] State and API infrastructure are no more complex than necessary.
- [ ] Relevant lint, typecheck, test, and build commands have been run where available; failures are reported accurately.
