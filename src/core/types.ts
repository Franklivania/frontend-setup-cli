export const FRAMEWORKS = [
  { value: "next-app-router", label: "Next.js App Router", hint: "Server/client boundaries and App Router layouts" },
  { value: "react-vite", label: "React + Vite", hint: "Client-side React application" },
  { value: "astro", label: "Astro", hint: "Static-first pages and selective hydration" },
  { value: "expo", label: "React Native + Expo", hint: "Native components and Reanimated" },
  { value: "react-router", label: "React Router", hint: "Route-oriented React application" },
  { value: "vanilla", label: "Vanilla HTML, CSS and JavaScript", hint: "Native web platform, no framework" }
] as const;

export const PROFILES = [
  { value: "landing-page", label: "Landing page", hint: "One focused conversion journey" },
  { value: "marketing-site", label: "Multi-page marketing website", hint: "Shared layouts, pages and content sections" },
  { value: "cms-blog", label: "CMS-driven site or blog", hint: "Content templates and rendering" },
  { value: "saas-dashboard", label: "SaaS dashboard", hint: "Authenticated product interface and data workflows" },
  { value: "general-web-app", label: "General web application", hint: "Product functionality without a narrower profile" },
  { value: "design-system", label: "Design system or component library", hint: "Tokens, primitives, variants and documentation" },
  { value: "interactive-experimental", label: "Experimental / interactive website", hint: "Rich interaction and coordinated motion" }
] as const;

export type Framework = typeof FRAMEWORKS[number]["value"];
export type ProjectProfile = typeof PROFILES[number]["value"];
export type PackageManager = "npm" | "pnpm" | "yarn" | "bun" | "unknown";
export type WebMotionEngine = "gsap" | "css" | "custom";
export type ExpoMotionEngine = "reanimated" | "native" | "custom";
export type MotionEngine = WebMotionEngine | ExpoMotionEngine;

export interface DetectionResult {
  root: string;
  hasPackageJson: boolean;
  framework: Framework | null;
  frameworkLabel: string | null;
  packageManager: PackageManager;
  packageManagerSource: "packageManager-field" | "lockfile" | "unknown";
  detectedDependencies: string[];
  detectedConfigs: string[];
  warnings: string[];
}

export interface SetupConfig {
  version: number;
  framework: Framework | "auto";
  projectProfile: ProjectProfile | "auto";
  projectScope: "small" | "medium" | "large" | "auto";
  registry: {
    url: string | null;
    autoSync: boolean;
    cacheTtlHours: number;
    schemaVersion: number;
  };
  privacy: {
    telemetry: false;
    uploadProjectFiles: false;
    autoSync: false;
  };
  styling: {
    strategy: "hybrid";
    classNaming: "bem-kebab-case";
    componentCss: "colocated-or-parallel";
    tokenModel: string[];
    responsiveStrategy: "fluid-first-hybrid";
    breakpoints: "derive-from-layout";
    themes: "only-when-requested-or-required";
    fontPolicy: "prefer-local; download-only-when-requested";
  };
  motion: {
    webDefault: WebMotionEngine;
    simpleMotion: "prefer-css-or-native-capabilities";
    reactGsapIntegration: "useGSAP-when-appropriate";
    astroStrategy: "choose-plain-script-or-existing-island";
    expoDefault: ExpoMotionEngine;
    customEngine: string | null;
    architecture: "hybrid-registry-and-component-owned";
    generateTextSplitUtilitiesForWeb: boolean;
    reducedMotion: "required";
    dynamicContent: "explicit-reinitialization-first; scoped-observer-only-if-needed";
    enabled: boolean;
  };
  state: {
    local: "framework-native";
    sharedClient: "zustand-when-needed";
    server: "tanstack-query-when-needed";
    preferFrameworkNativeData: boolean;
    avoidDuplicateServerState: boolean;
  };
  api: {
    client: "centralized-when-backend-present";
    multipart: boolean;
    endpointRegistry: "single-file-until-domain-complexity-justifies-splitting";
    typedContracts: boolean;
    enabled: boolean;
  };
  tooling: {
    formatter: "detect-or-configure-one-of-prettier-or-biome";
    husky: "optional-when-useful";
    githubActions: "out-of-scope-unless-requested";
    reuseExistingDependencies: boolean;
  };
  architecture: {
    featureDirectories: "optional-when-domain-complexity-justifies-them";
    inspectExistingRepository: true;
    createOnlyNeededDirectories: true;
    writeArchitectureDocument: true;
  };
}

export interface InitOptions {
  cwd: string;
  yes: boolean;
  dryRun: boolean;
  force: boolean;
  framework?: Framework;
  profile?: ProjectProfile;
  motion?: boolean;
  api?: boolean;
  installDependencies?: boolean;
  motionEngine?: MotionEngine;
  motionPackage?: string;
  packageManager?: PackageManager;
  tooling?: boolean;
}

export interface PlannedFile {
  path: string;
  content: string;
  reason: string;
  category: "config" | "documentation" | "styles" | "motion" | "services";
}
