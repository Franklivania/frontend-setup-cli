export const TOKENS_CSS = `/* Frontend Setup: replace starter values with your design-system values. */
:root {
  /* Primitive color scale */
  --gray-0: #ffffff;
  --gray-50: #f8fafc;
  --gray-100: #f1f5f9;
  --gray-200: #e2e8f0;
  --gray-300: #cbd5e1;
  --gray-400: #94a3b8;
  --gray-500: #64748b;
  --gray-600: #475569;
  --gray-700: #334155;
  --gray-800: #1e293b;
  --gray-900: #0f172a;
  --gray-950: #020617;

  /* Accent primitives: project palette goes here */
  --accent-50: #eef2ff;
  --accent-100: #e0e7ff;
  --accent-500: #6366f1;
  --accent-600: #4f46e5;
  --accent-700: #4338ca;

  /* Semantic colors */
  --color-text: var(--gray-900);
  --color-text-muted: var(--gray-600);
  --color-surface: var(--gray-0);
  --color-surface-muted: var(--gray-50);
  --color-border: var(--gray-200);
  --color-accent: var(--accent-600);
  --color-accent-hover: var(--accent-700);
  --color-focus-ring: var(--accent-500);
  --color-success: #15803d;
  --color-warning: #a16207;
  --color-danger: #b91c1c;

  /* Typography */
  --font-sans: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --font-mono: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
  --text-xs: clamp(0.72rem, 0.69rem + 0.12vw, 0.78rem);
  --text-sm: clamp(0.82rem, 0.79rem + 0.14vw, 0.9rem);
  --text-base: clamp(0.96rem, 0.92rem + 0.18vw, 1.05rem);
  --text-lg: clamp(1.12rem, 1.04rem + 0.35vw, 1.3rem);
  --text-xl: clamp(1.3rem, 1.18rem + 0.55vw, 1.6rem);
  --text-2xl: clamp(1.55rem, 1.32rem + 1vw, 2.1rem);
  --text-3xl: clamp(1.9rem, 1.52rem + 1.65vw, 2.8rem);
  --text-display: clamp(2.4rem, 1.5rem + 4vw, 5.5rem);
  --line-height-tight: 1.08;
  --line-height-heading: 1.2;
  --line-height-body: 1.6;
  --font-weight-regular: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;

  /* Spacing scale */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.25rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-10: 2.5rem;
  --space-12: 3rem;
  --space-16: 4rem;
  --space-20: 5rem;
  --space-section: clamp(3.5rem, 7vw, 7.5rem);

  /* Layout */
  --container-sm: 40rem;
  --container-md: 48rem;
  --container-lg: 64rem;
  --container-xl: 80rem;
  --container-wide: 90rem;
  --page-gutter: clamp(1rem, 4vw, 3rem);

  /* Radius and elevation */
  --radius-xs: 0.25rem;
  --radius-sm: 0.375rem;
  --radius-md: 0.625rem;
  --radius-lg: 1rem;
  --radius-xl: 1.5rem;
  --radius-pill: 999px;
  --shadow-sm: 0 1px 2px rgb(15 23 42 / 0.06);
  --shadow-card: 0 8px 28px rgb(15 23 42 / 0.08);
  --shadow-popover: 0 16px 48px rgb(15 23 42 / 0.14);

  /* Motion */
  --duration-instant: 100ms;
  --duration-fast: 160ms;
  --duration-normal: 260ms;
  --duration-slow: 420ms;
  --ease-standard: cubic-bezier(0.2, 0, 0, 1);
  --ease-enter: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-exit: cubic-bezier(0.7, 0, 0.84, 0);
}
`;

export const RESET_CSS = `/* Small, predictable baseline. Avoid opinionated resets that break native controls. */
*,
*::before,
*::after {
  box-sizing: border-box;
}

html {
  -webkit-text-size-adjust: 100%;
  text-size-adjust: 100%;
  text-rendering: optimizeLegibility;
  scroll-behavior: smooth;
}

body,
h1,
h2,
h3,
h4,
p,
figure,
blockquote,
dl,
dd {
  margin: 0;
}

img,
picture,
video,
canvas,
svg {
  display: block;
  max-width: 100%;
}

button,
input,
select,
textarea {
  font: inherit;
}

button {
  cursor: pointer;
}

button:disabled {
  cursor: not-allowed;
}

:focus-visible {
  outline: 2px solid var(--color-focus-ring, currentColor);
  outline-offset: 3px;
}

@media (prefers-reduced-motion: reduce) {
  html:focus-within {
    scroll-behavior: auto;
  }

  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
  }
}
`;

export const TYPOGRAPHY_CSS = `/* Local font faces belong here when font assets are supplied. */
html {
  font-family: var(--font-sans);
  font-size: 100%;
  color: var(--color-text);
  background: var(--color-surface);
}

body {
  min-width: 320px;
  font-size: var(--text-base);
  line-height: var(--line-height-body);
  font-weight: var(--font-weight-regular);
  color: var(--color-text);
  background: var(--color-surface);
  font-synthesis: none;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

h1,
h2,
h3,
h4,
h5,
h6 {
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-heading);
  letter-spacing: -0.025em;
  text-wrap: balance;
}

h1 { font-size: var(--text-3xl); }
h2 { font-size: var(--text-2xl); }
h3 { font-size: var(--text-xl); }
p { text-wrap: pretty; }
small { font-size: var(--text-sm); }
code, pre, kbd, samp { font-family: var(--font-mono); }
`;

export const GLOBAL_CSS = `/* Import this file from the framework's global stylesheet entry. */
@import "./tokens.css";
@import "./reset.css";
@import "./typography.css";
`;

export const ANIMATIONS_CSS = `/* Use these native CSS effects for simple motion. Add a timeline engine only when needed. */
[data-motion-clip] {
  display: inline-block;
  overflow: clip;
  vertical-align: bottom;
}

[data-motion-unit] {
  display: inline-block;
}

@keyframes setup-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes setup-rise-in {
  from { opacity: 0; transform: translate3d(0, 0.75rem, 0); }
  to { opacity: 1; transform: translate3d(0, 0, 0); }
}

@keyframes setup-scale-in {
  from { opacity: 0; transform: scale(0.97); }
  to { opacity: 1; transform: scale(1); }
}

[data-motion="fade-in"] { animation: setup-fade-in var(--duration-normal) var(--ease-enter) both; }
[data-motion="rise-in"] { animation: setup-rise-in var(--duration-slow) var(--ease-enter) both; }
[data-motion="scale-in"] { animation: setup-scale-in var(--duration-normal) var(--ease-enter) both; }

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
`;
