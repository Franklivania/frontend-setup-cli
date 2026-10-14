# Project Profiles

Choose the profile closest to the project and combine profiles when the site genuinely spans them. Profiles tune the scaffolding; they do not force a particular stack or business architecture.

## 1. Landing page

- Optimize for fast rendering, responsive composition, accessible conversion paths, semantic SEO metadata, and maintainable sections.
- `components/sections/` is useful when multiple page blocks need independent styling/reuse; otherwise keep a compact composition.
- Do not create global state, feature modules, route groups, or API layers unless required.
- Load animation work selectively and avoid turning static sections into client-side islands without a need.

## 2. Multi-page marketing website

- Reuse a site shell, navigation, footer, tokens, and section primitives.
- Create shared layouts/routes according to framework conventions.
- Keep page-specific compositions separate from globally reusable UI.
- Avoid a generic CMS/service architecture unless the content source requires it.

## 3. CMS-driven site or blog

- Establish the content provider and content model first: local content files, Astro collections, Sanity, WordPress, or another CMS.
- Separate content retrieval/mapping from presentation components.
- Define types or schemas for content where the framework supports it.
- Plan loading/empty/error/preview states and image handling based on the actual CMS.
- Do not add CMS packages or invent schemas before identifying the configured source.

## 4. SaaS dashboard

- Use explicit route/layout shells for authenticated product areas when needed (for example, user/admin layouts).
- Separate reusable UI primitives from domain-level tables, forms, filters, and data views.
- Add `store/`, `services/`, schemas, query/mutation infrastructure, and domain modules only when their responsibilities exist.
- Treat authentication, permissions, request errors, loading states, and data synchronization as architectural concerns; do not put authorization enforcement only in the UI.
- Feature-oriented directories are optional. Use them if multiple modules for a domain need a cohesive home; otherwise preserve a simpler structure.

## 5. General web application

- Establish routing, rendering model, data sources, form needs, and major domain boundaries before selecting the structure.
- Keep reusable interface components and infrastructure centralized while colocating feature-specific code where useful.
- Add global state only for genuinely shared client state and server caching only where needed.

## 6. Design system or component library

- Prioritize token APIs, component contracts, variant patterns, accessible interaction behavior, and examples.
- Distinguish private implementation files from public exports.
- Avoid application-only assumptions such as routes, page shells, stores, or backend service clients unless the package also includes a demo app.
- Support visual and behavior tests where the tooling exists.

## 7. Experimental / interactive website

- Identify the dominant rendering/interaction approach: scroll storytelling, canvas/WebGL, 3D, shader effects, complex GSAP sequences, or another technique.
- Isolate expensive or browser-specific behavior and load it only where required.
- Establish a reduced-motion fallback and a reasonable baseline when visual effects are unavailable.
- Do not add a rendering engine or animation dependency based on profile name alone; select tools for the specific effect and runtime constraints.

## Scope selection rules

- **Small:** few routes/components and limited state. Keep most responsibilities shallow; skip `features/`, global stores, and unnecessary service layers.
- **Medium:** repeatable shells, many components, API calls, or multiple stateful flows. Split styles, services, hooks, and shared types as responsibilities emerge.
- **Large:** multiple product domains, independently evolving workflows, substantial data flows, or several teams. Consider feature-oriented modules and explicit domain ownership, but document why the complexity is justified.
- Do not use line count alone to decide size. Consider domain boundaries, change patterns, and the number of distinct responsibilities.
