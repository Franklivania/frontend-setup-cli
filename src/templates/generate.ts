import path from "node:path";
import { loadConfig } from "../core/config.js";
import type { Framework, MotionEngine, ProjectProfile, SetupConfig, PlannedFile } from "../core/types.js";
import { ANIMATIONS_CSS, GLOBAL_CSS, RESET_CSS, TOKENS_CSS, TYPOGRAPHY_CSS } from "./web-styles.js";
import { EXPO_TOKENS_TS } from "./expo-tokens.js";
import { API_SETUP_TS } from "./api-setup-template.js";
import { TEXT_SPLITTING_TS } from "./text-splitting-ts.js";
import { TEXT_SPLITTING_JS } from "./text-splitting-js.js";

const REACT_FRAMEWORKS_FOR_DOCS = new Set<Framework>(["next-app-router", "react-vite", "react-router"]);

function json(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function profileDescription(profile: ProjectProfile): string {
  const descriptions: Record<ProjectProfile, string> = {
    "landing-page": "A focused page with a clear conversion or communication goal.",
    "marketing-site": "A multi-page site with reusable layouts, page sections, and consistent content presentation.",
    "cms-blog": "A content-oriented site with CMS or editorial data feeding reusable page templates.",
    "saas-dashboard": "A product interface with data workflows, and potentially authentication and permissions.",
    "general-web-app": "A general-purpose application whose architecture should grow around its domain rather than a preset feature tree.",
    "design-system": "A reusable component and token foundation with explicit variants and usage documentation.",
    "interactive-experimental": "A visually expressive experience with careful performance, accessibility, and motion lifecycle handling."
  };
  return descriptions[profile];
}

function architectureDocument(input: {
  framework: Framework;
  profile: ProjectProfile;
  packageManager: string;
  motion: boolean;
  motionEngine: MotionEngine;
  api: boolean;
  config: SetupConfig;
}): string {
  const frameworkNotes: Record<Framework, string> = {
    "next-app-router": "Keep route entry points and Server/Client Component decisions under src/app. Import global styles from the root layout. Use route groups only when they represent real layout or navigation boundaries. Do not mark a whole subtree as client-side without a requirement.",
    "react-vite": "Keep the application entry small. Import src/styles/global.css from the existing entry file (usually src/main.tsx); do not replace an existing entry just to add the import.",
    astro: "Prefer .astro components and static rendering first. Import the global stylesheet from the root layout. Add a hydrated island only where interactive browser behavior requires it; do not introduce React solely to host animation.",
    expo: "Use native components, StyleSheet, platform-supported font loading, and the selected native motion adapter. The web CSS and DOM text-splitting helpers do not apply. Keep shared design intent in TypeScript tokens, not CSS variables.",
    "react-router": "Keep route configuration and data-loading behavior consistent with the selected React Router mode. Keep route components thin and move reusable page structure to components or layout only when needed.",
    vanilla: "Use native ES modules and progressive enhancement. Link src/styles/global.css from the HTML entry and keep DOM-specific scripts explicit. Do not add a framework or state library without a concrete requirement."
  };
  const motionNotes = input.motion
    ? input.framework === "expo"
      ? input.motionEngine === "native"
        ? "Motion foundation enabled with the React Native Animated API. Prefer platform-native capabilities for simple transitions. If interaction complexity or gesture coordination outgrows it, switch to Reanimated through the project configuration. Do not use DOM selectors, CSS keyframes, or GSAP DOM manipulation in native components."
        : input.motionEngine === "custom"
          ? `Motion foundation enabled with the custom native engine '${input.config.motion.customEngine ?? "not named"}'. Keep all motion native, check Expo SDK compatibility, and do not introduce DOM or web CSS animation assumptions.`
          : "Motion foundation enabled with React Native Reanimated for complex native motion and gestures. Prefer platform-native capabilities for simple transitions. Do not use DOM selectors, CSS keyframes, or GSAP DOM manipulation in native components."
      : input.motionEngine === "css"
        ? "Motion foundation enabled with CSS and native browser capabilities. Use the data-motion attributes and provided keyframes for simple self-contained effects. Add a timeline library only when sequencing, scroll-linked behavior, or dynamic text motion requires it. For Astro and Vanilla, keep scripts framework-free; do not add React islands only to animate content. Respect reduced-motion preferences."
        : input.motionEngine === "custom"
          ? `Motion foundation enabled with the custom web engine '${input.config.motion.customEngine ?? "not named"}'. Use the project's existing installation and documentation; keep data-motion-* selectors stable, observe reduced-motion preferences, and follow framework lifecycle cleanup rules.`
          : "Motion foundation enabled with GSAP for coordinated timelines, scroll-driven animation, and text animation; keep simple state transitions in CSS. Prefer useGSAP in React integrations and explicitly scope cleanup. For Astro, decide between plain scripts and an existing island instead of hydrating a framework solely for animation. Use the data-motion-* attributes as stable hooks and respect reduced-motion preferences."
    : "Motion foundation is not enabled. Add motion utilities only when the interface has a real interaction or design requirement; do not install animation dependencies speculatively.";
  const apiNotes = input.api
    ? "API foundation enabled. Keep request transport and error normalization in services/api. Keep endpoint paths in the endpoint registry and domain operations in service modules. Multipart requests must not manually set the Content-Type boundary. Add authentication and token handling only according to the application's actual security model."
    : "API infrastructure is not scaffolded. Add services/api only when the project needs a backend or external API.";

  return [
    "# Architecture Notes",
    "",
    "## Setup profile",
    "",
    `- **Framework:** ${input.framework}`,
    `- **Project profile:** ${input.profile}`,
    `- **Package manager detected:** ${input.packageManager}`,
    `- **Profile intent:** ${profileDescription(input.profile)}`,
    "",
    "## Framework-specific rules",
    "",
    frameworkNotes[input.framework],
    "",
    "## Shared conventions",
    "",
    "- CSS class names use lowercase BEM-inspired kebab-case: .navbar, .navbar__header, .navbar__header-bottom, .navbar__link--active.",
    "- Component filenames use kebab-case (for example, navbar.tsx); React component exports remain PascalCase. Hook names use camelCase (for example, useScrollProgress).",
    "- Use shared generic utilities only when they are genuinely reusable across the application.",
    "- Keep primitive tokens, semantic tokens, and component tokens separate. Component tokens are introduced when a component has meaningful variants or repeated design requirements.",
    "- Responsive typography is fluid-first using clamp(); use explicit breakpoints where composition actually changes. Derive breakpoints from content/layout rather than device labels alone.",
    "- Use local font assets when supplied, optimize the required weights, and avoid downloading fonts unless requested.",
    "- Themes are added only when requested or required by the product.",
    "- Prefer framework-native data loading where it fits. Use Zustand for shared client state and TanStack Query for server state only when the use case justifies them. Avoid duplicating server state in multiple stores.",
    "- Keep feature-based directories optional. Start with the smallest useful structure and add domain boundaries when complexity warrants them.",
    "",
    "## Styling foundation",
    "",
    input.framework === "expo"
      ? "The token foundation is in src/styles/tokens.ts. Consume these values through StyleSheet or the chosen styling adapter; do not introduce CSS files into the native styling path."
      : "The token foundation is in src/styles/tokens.css, with reset and typography rules separated by responsibility. Import src/styles/global.css from the framework's existing global CSS entry. Do not overwrite an existing app entry merely to attach the stylesheet.",
    "",
    "## Motion",
    "",
    motionNotes,
    "",
    "## API layer",
    "",
    apiNotes,
    "",
    "## Configuration",
    "",
    "The machine-readable defaults are in frontend-architecture.config.json. Explicit project decisions and existing sound conventions take precedence over these defaults. Update that configuration and this document when material choices change.",
    "",
    "## Dependency installation",
    "",
    input.motion && input.motionEngine === "custom"
      ? `Custom engine '${input.config.motion.customEngine ?? "not named"}' is recorded for this project. The CLI will not install unknown or unverified packages; follow the tool's official setup instructions.`
      : input.motion && input.framework === "expo" && input.motionEngine === "reanimated"
        ? "The selected Reanimated setup may require react-native-reanimated and react-native-worklets. Use the project's Expo-aware package-manager command (expo install) so versions remain compatible with the installed SDK."
        : input.motion && input.framework !== "expo" && input.motionEngine === "gsap" && REACT_FRAMEWORKS_FOR_DOCS.has(input.framework)
          ? "The selected GSAP setup uses gsap and @gsap/react. Install only missing packages with the existing package manager if dependency installation was skipped."
          : input.motion && input.framework !== "expo" && input.motionEngine === "gsap"
            ? "The selected GSAP setup uses gsap. Install it with the existing package manager if dependency installation was skipped."
            : "No animation package is required for the selected native/CSS motion path. Add external libraries only when a concrete interaction requires them.",
    "",
    "## Privacy and network behavior",
    "",
    "This setup does not enable telemetry or upload project files. Framework detection uses limited local metadata. Catalog synchronization, if configured, is read-only and downloads JSON data only.",
    ""
  ].join("\n");
}

function motionAttributesFile(framework: Framework): { path: string; content: string } {
  if (framework === "vanilla") {
    return {
      path: "src/scripts/motion-attributes.js",
      content: `// Stable data-attribute names used by the motion system.\nexport const WORD = "data-motion-word";\nexport const CHAR = "data-motion-char";\nexport const LINE = "data-motion-line";\nexport const CLIP = "data-motion-clip";\nexport const UNIT = "data-motion-unit";\nexport const MOTION = "data-motion";\nexport const TRIGGER = "data-motion-trigger";\n`
    };
  }
  return {
    path: "src/lib/motion/attributes.ts",
    content: `/** Stable selectors; framework-specific animation logic lives beside the consuming component. */\nexport const WORD = "data-motion-word";\nexport const CHAR = "data-motion-char";\nexport const LINE = "data-motion-line";\nexport const CLIP = "data-motion-clip";\nexport const UNIT = "data-motion-unit";\nexport const MOTION = "data-motion";\nexport const TRIGGER = "data-motion-trigger";\n`
  };
}

export async function buildPlannedFiles(input: {
  root: string;
  framework: Framework;
  profile: ProjectProfile;
  packageManager: string;
  motion: boolean;
  motionEngine?: MotionEngine;
  motionPackage?: string;
  api: boolean;
}): Promise<PlannedFile[]> {
  const motionEngine: MotionEngine = input.motionEngine ?? (input.framework === "expo" ? "reanimated" : "gsap");
  if (input.framework === "expo" && motionEngine !== "reanimated" && motionEngine !== "native" && motionEngine !== "custom") {
    throw new Error("Expo supports the reanimated, native, or custom motion engine.");
  }
  if (input.framework !== "expo" && motionEngine !== "gsap" && motionEngine !== "css" && motionEngine !== "custom") {
    throw new Error("Web frameworks support the gsap, css, or custom motion engine.");
  }
  const config = await loadConfig(input.root);
  config.framework = input.framework;
  config.projectProfile = input.profile;
  config.motion.enabled = input.motion;
  if (input.framework === "expo") config.motion.expoDefault = motionEngine as "reanimated" | "native" | "custom";
  else config.motion.webDefault = motionEngine as "gsap" | "css" | "custom";
  config.motion.customEngine = input.motion && motionEngine === "custom"
    ? input.motionPackage?.trim() || config.motion.customEngine || "custom (configure manually)"
    : null;
  config.api.enabled = input.api;
  const files: PlannedFile[] = [
    {
      path: "frontend-architecture.config.json",
      content: json(config),
      reason: "Records configurable architecture defaults and project-specific choices.",
      category: "config"
    },
    {
      path: "ARCHITECTURE.md",
      content: architectureDocument({ ...input, motionEngine, config }),
      reason: "Documents responsibilities, framework boundaries, and setup decisions.",
      category: "documentation"
    }
  ];

  if (input.framework === "expo") {
    files.push({
      path: "src/styles/tokens.ts",
      content: EXPO_TOKENS_TS,
      reason: "Provides a native TypeScript token foundation; web CSS is not used in the native styling path.",
      category: "styles"
    });
  } else {
    files.push(
      { path: "src/styles/tokens.css", content: TOKENS_CSS, reason: "Primitive and semantic CSS tokens with responsive typography, layout, radius, elevation, and motion values.", category: "styles" },
      { path: "src/styles/reset.css", content: RESET_CSS, reason: "Small baseline reset with focus-visible and reduced-motion defaults.", category: "styles" },
      { path: "src/styles/typography.css", content: TYPOGRAPHY_CSS, reason: "Fluid typography defaults and local-font insertion point.", category: "styles" },
      { path: "src/styles/global.css", content: `${GLOBAL_CSS}${input.motion ? '@import "./animations.css";\n' : ""}`, reason: "Single shared stylesheet entry to import from the framework's existing entry point.", category: "styles" }
    );
    if (input.motion) {
      files.push({ path: "src/styles/animations.css", content: ANIMATIONS_CSS, reason: motionEngine === "gsap" ? "Reusable CSS keyframes for small effects alongside GSAP for coordinated motion." : "Reusable self-contained CSS keyframes for the selected motion setup.", category: "motion" });
    }
  }

  if (input.motion) {
    if (input.framework !== "expo") {
      files.push(
        { ...motionAttributesFile(input.framework), reason: "Centralizes the data-motion-* selector vocabulary without forcing a global animation registry.", category: "motion" },
        {
          path: input.framework === "vanilla" ? "src/scripts/text-splitting.js" : "src/lib/motion/text-splitting.ts",
          content: input.framework === "vanilla" ? TEXT_SPLITTING_JS : TEXT_SPLITTING_TS,
          reason: "Adds reusable word, character, and line splitting helpers with explicit reset for dynamic content.",
          category: "motion"
        },
        {
          path: input.framework === "vanilla" ? "src/scripts/motion-usage.md" : "src/lib/motion/README.md",
          content: `# Motion utilities\n\nSelected engine: ${motionEngine}. Use word/character/line splitting only for text that requires it. Call the helper after fonts and layout are ready. Call resetTextSplit(element) before replacing dynamic text or remeasuring after a layout change. Use explicit reinitialization first; add a scoped observer only when the content source requires it.\n\n${motionEngine === "gsap" ? "For React, scope GSAP timelines to the component lifecycle and prefer useGSAP when appropriate." : motionEngine === "custom" ? `Use the project's selected engine (${input.motionPackage ?? "custom"}) and follow its framework integration documentation.` : "For simple effects, use the generated CSS keyframes and native browser capabilities; avoid adding a timeline library until the interaction requires it."} For Astro, use plain scripts unless an existing island is justified. This helper is DOM-only and must not be used in Expo. Respect reduced-motion preferences and avoid splitting interactive controls or content marked data-motion-ignore.\n`,
          reason: "Documents initialization timing, cleanup, dynamic content, and framework lifecycle constraints.",
          category: "motion"
        }
      );
    }
    if (input.framework === "expo") {
      files.push({
        path: "src/lib/motion/README.md",
        content: `# Native motion\n\nSelected engine: ${motionEngine}. ${motionEngine === "reanimated" ? "Use React Native Reanimated for complex native motion and gestures." : motionEngine === "native" ? "Use React Native's Animated API for native transitions and coordinated interactions." : `Use the selected compatible native engine (${input.motionPackage ?? "custom"}) and follow its Expo setup requirements.`} Prefer platform-native capabilities for simple transitions. Shared naming intent may be reused, but DOM selectors, CSS keyframes, and GSAP DOM manipulation do not apply here. Check the installed Expo SDK and Reanimated version before adding or changing native dependencies.\n`,
        reason: "Documents the native animation boundary without installing a package or modifying Expo configuration.",
        category: "motion"
      });
    }
  }

  if (input.api) {
    files.push(
      { path: "src/services/api/api-setup.ts", content: API_SETUP_TS, reason: "Provides typed requests, normalized errors, auth hooks, and JSON/multipart helpers.", category: "services" },
      { path: "src/services/api/api-init.ts", content: `export { ApiError, createApiClient } from "./api-setup.js";\nexport type { ApiClient, ApiClientOptions, ApiErrorPayload } from "./api-setup.js";\n`, reason: "Single import surface for initializing and using the API client.", category: "services" },
      { path: "src/services/api/endpoints.ts", content: `/** Add real endpoint paths here; do not invent routes before the backend contract exists. */\nexport const endpoints = {} as const;\n`, reason: "Creates the endpoint registry without inventing backend routes.", category: "services" }
    );
  }

  return files.map((file) => ({ ...file, path: path.normalize(file.path) }));
}
