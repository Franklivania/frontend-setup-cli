# Core Conventions

These conventions are defaults. Preserve sound repository-specific choices and allow explicit configuration to override them.

## Naming

- CSS classes: lowercase kebab-case with BEM-inspired blocks/elements/modifiers. Examples: `.navbar`, `.navbar__header`, `.navbar__header-bottom`, `.navbar__link--active`.
- React component filenames: kebab-case, for example `navbar.tsx`; exported React components remain PascalCase, for example `Navbar`.
- Non-component modules: kebab-case, for example `format-date.ts`, `backend.service.ts`, `user.schema.ts`.
- Hooks: camelCase names beginning with `use`, for example `useScrollProgress.ts` or `useScrollProgress.js` (follow the repository's extension/naming pattern consistently).
- CSS files: component-aligned names such as `navbar.css` or `navbar.module.css` when CSS Modules are the configured choice.
- Types: shared types can be exposed by `types/index.ts`; keep highly local types next to the module that owns them instead of moving everything into a global type dump.
- Use clear, descriptive names. Do not abbreviate names unless the term is established in the codebase.

## Styling architecture

Default to a hybrid model:

- Shared tokens and app-wide reset, typography, utilities, and global styles live in a dedicated styles area where supported.
- Component styles remain close to the component or in a parallel named stylesheet, according to framework conventions.
- Component-scoped styles should not depend on undocumented global selectors.
- Generic utility classes are allowed only when they are reusable throughout the application. Avoid creating a utility framework for one-off styling.
- Do not require a utility-first CSS framework. If the repository already uses Tailwind or another established styling approach, work with it unless the user asks to change it.
- Respect framework-native file locations. Do not force identical directory trees across frameworks.

## Token model

Use a three-layer token system where practical:

1. **Primitive tokens:** raw palette values, spacing scales, radii, type scales, duration/easing values, and other repeatable measurements.
2. **Semantic tokens:** roles such as text, muted text, page surface, elevated surface, border, focus ring, and feedback states.
3. **Component tokens:** optional values for components with repeated variants or meaningful local design requirements, such as card radius/padding or control height.

Use semantic tokens for application styles and primitive numerical scales for consistency and traceability. Example names:

```css
:root {
  /* Primitive */
  --gray-100: #f5f5f5;
  --gray-900: #171717;
  --space-2: 0.5rem;
  --space-4: 1rem;
  --radius-2: 0.5rem;

  /* Semantic */
  --color-text: var(--gray-900);
  --color-surface: var(--gray-100);
  --color-border: #d4d4d4;

  /* Component-level: add only when useful */
  --card-radius: var(--radius-2);
  --card-padding: var(--space-4);
}
```

The values are illustrative, not universal brand choices. Do not assign a palette without considering supplied design references, brand assets, or product requirements. Include separate token categories as useful: colors, spacing, sizing, containers, typography, radii, shadows/elevation, border widths, z-index layers, animation durations, and easing. Avoid tokenizing every one-off value.

### Themes

- Do not scaffold light/dark themes automatically.
- If the user requests themes or the product requires theme switching, define semantic tokens for each theme and implement the required preference/persistence behavior.
- Theme design is a product decision, not a universal architecture rule.

## Responsive layout and typography

- Use mobile-first CSS on web by default.
- Prefer fluid sizing with `clamp()` for typography and space where it improves smooth scaling; use explicit breakpoints for actual composition/layout changes. This is a hybrid fluid-first system, not a requirement to make every dimension fluid.
- Provide a sensible type scale when no design system exists: display/headings, body, small text, and labels as needed. Define line heights and font weights intentionally.
- Prefer content-driven widths and responsive constraints over fixed device-sized canvases.
- Derive breakpoints from the content/layout requirements when a design is available. If there is no design, use a small documented baseline and adjust it to actual layouts.
- CSS custom properties generally cannot be used as ordinary media-query breakpoint values. Keep canonical breakpoint values in configuration/documentation and write valid explicit media queries.
- Verify narrow, intermediate, and wide layouts where a browser preview or test environment is available. Do not claim visual validation unless it was performed.

## Fonts

- Prefer local font assets when supplied by the project.
- Do not download a font unless the user asks or authorizes it.
- Define font faces centrally and configure the framework's font-loading mechanism where available.
- Prefer WOFF2 for web when appropriate; include only weights/styles actually used.
- Use sensible fallback stacks and font-display/loading behavior to reduce blocking and layout shifts. Match the technique to the framework rather than blindly using `@font-face` everywhere.
- Keep font files and licensing/source details documented when fetched at the user's request.

## Suggested baseline style files

Create these only where useful:

```text
src/styles/
  tokens.css
  reset.css
  typography.css
  utilities.css
  animations.css
  global.css
```

Files can initially be small. If a separate file has no real responsibility yet, omit it instead of creating placeholders. Framework-specific styles may live at a framework-required entry point and import the shared stylesheet set.

## Suggested base directory responsibilities

- `assets/`: project-owned static assets and non-code files, following framework conventions.
- `components/ui/`: reusable primitive interface components, not full page compositions.
- `components/sections/`: reusable or composed page sections when the project needs them, particularly in marketing sites.
- `layout/` or framework-native equivalent: page shells, admin/user layouts, header/footer, navigation frames, and shared structural composition.
- `lib/`: general infrastructure and shared helpers. For API infrastructure, coordinate with `services/` rather than making `lib/` an unstructured catch-all.
- `services/`: API setup, request/client logic, endpoint declarations, backend integrations, and domain service modules when used.
- `hooks/`: reusable framework hooks.
- `store/`: shared client state only when needed.
- `styles/`: shared tokens and global styles where the framework supports this structure.
- `types/`: genuinely shared types, with `index.ts` as a consolidated public export when useful.
- `features/`: optional, only when domain complexity and multiple related modules justify feature ownership.
- `config/` and `constants/`: add only when there are meaningful groups of configuration/constants that benefit from separation.

## Tooling

- Reuse current project tools where they work.
- When formatting/linting is missing and appropriate, propose or configure one formatter/linter setup. Choose Prettier or Biome based on ecosystem and preference; do not install both by default.
- Husky and pre-commit checks are optional and should be proportionate to project size.
- GitHub Actions is out of scope for baseline scaffolding unless requested.
- Do not install linting, testing, state, or styling packages that duplicate current capabilities.

## Documentation

Create or maintain:

- `frontend-architecture.config.json`: machine-readable choices and overrides.
- `ARCHITECTURE.md`: human-readable responsibilities, directory rules, runtime/rendering decisions, motion approach, state/API patterns, scripts, and important deviations.
- `README.md`: project purpose and common commands; do not turn it into a duplicate of the architecture document.

Do not create a file just to satisfy a list if it has no useful content for this project.
