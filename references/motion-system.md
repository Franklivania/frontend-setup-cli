# Motion System

## Engine selection

- **Web default:** GSAP for coordinated timelines, scroll interactions, complex/sequence-based motion, and text reveals.
- **Simple web transitions:** prefer CSS transitions, keyframes, or built-in browser behavior where they are adequate. GSAP is a preferred capability, not a mandate to animate everything.
- **React-based web:** prefer `useGSAP` from `@gsap/react` when available and suitable. Otherwise use an effect/lifecycle hook with explicit scoping and cleanup. Keep browser-only animation code in client components.
- **Astro:** choose plain client scripts or an existing framework island based on the interactivity requirement. Do not add React islands just to use `useGSAP`.
- **Expo:** React Native Reanimated is the preferred engine for complex native motion/gestures. Use native capabilities for simple transitions. Never use GSAP's DOM targeting or web CSS in native components.
- **Tool overrides:** respect the user/project configuration if it selects another library. Prefer native/platform capabilities when they are robust for the requested behavior and let the project owner change engines.

## Attribute vocabulary

Keep stable names for web text units and clipping. Extend the vocabulary only when there is a concrete behavior to support.

```ts
const WORD = "data-motion-word";
const CHAR = "data-motion-char";
const LINE = "data-motion-line";
const CLIP = "data-motion-clip";
const UNIT = "data-motion-unit";
```

Use two different concepts:

- **Target/unit attributes** identify nodes or generated text units, such as `data-motion-word`, `data-motion-char`, `data-motion-line`, `data-motion-clip`, and `data-motion-unit`.
- **Behavior attributes** declare a common preset or behavior, such as `data-motion="fade-up"`, plus optional trigger/stagger metadata when needed.

Use declarative attributes for repeatable patterns and TypeScript/JavaScript for complex timelines and component-specific orchestration. Do not create an elaborate attribute DSL before the project has multiple repeatable patterns.

On Expo, these DOM attributes do not apply. Keep intent consistent, but use native refs, component props, and platform-supported targeting mechanisms instead.

## Shared web helpers

For web projects using the standard motion foundation, generate reusable helpers for `wrapWords`, `wrapChars`, `wrapLines`, clipping/wrapping, selecting `data-motion-unit` elements, initialization, and cleanup. Generate the utilities as a foundation; do not automatically apply text splitting to every heading or paragraph. Apply only to explicit targets.

Implementation requirements:

- Make wrapping idempotent; calling initialization twice must not create duplicate wrappers.
- Preserve whitespace and nested inline markup where possible. Do not blindly split text in inputs, textareas, contenteditable nodes, scripts/styles, code blocks, or dynamic/editor-owned regions.
- Ensure accessible reading order. Text-splitting wrappers must not create repeated screen-reader output; use an accessible original/alternate label strategy where needed and test it.
- Wait until DOM content/layout and fonts are ready before calculating line groups. `offsetTop`-only line detection is fragile when fonts, transforms, layout, or nested inline elements change; use rendered bounds and a reliable re-measure path.
- Recalculate line splits on meaningful container resize, font/layout changes, and content updates. Debounce/raf-throttle expensive work and scope observers to the relevant element.
- Prefer explicit reinitialization when the application knows content changed. Add a narrowly scoped `MutationObserver` only when there is no reliable explicit update signal; do not observe the whole document by default.
- Clean up observers, resize handlers, listeners, GSAP timelines, and ScrollTriggers during teardown/unmount.
- Avoid applying GSAP styles to server-rendered elements before hydration in ways that cause visible mismatches.
- Respect `prefers-reduced-motion` and any app-level motion preference. Provide a sensible static or reduced-motion state.
- Handle React Strict Mode and repeated mount/unmount without leaked timelines or duplicate triggers.

## Central registry vs. component-owned timelines

Use a hybrid approach by default:

- A central registry handles genuinely reusable site-wide presets and attribute-driven behavior.
- A component owns complex or highly specific timelines when the sequence is coupled to its structure or state.
- A centralized registry is not mandatory. For small projects, a small module or component-owned timelines may be simpler.
- Record the decision in `ARCHITECTURE.md` when the motion setup has meaningful trade-offs.

## Timing, triggers, and performance

- Keep durations/easing in tokens or named motion presets where repeated.
- Use scroll triggers only when the experience benefits from scroll-linked behavior; clean them up reliably.
- Avoid animating layout-heavy properties continuously when transforms/opacity can achieve the same effect.
- Do not delay important text/content behind animation if JavaScript fails or reduced motion is requested.
- Dynamically inserted content must be handled through the owning component/framework lifecycle or a narrowly scoped observer.
