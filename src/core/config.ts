import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Framework, ProjectProfile, SetupConfig } from "./types.js";

export const CONFIG_FILE = "frontend-architecture.config.json";

export const DEFAULT_CONFIG: SetupConfig = {
  version: 1,
  framework: "auto",
  projectProfile: "auto",
  projectScope: "auto",
  registry: {
    url: null,
    autoSync: false,
    cacheTtlHours: 24,
    schemaVersion: 1
  },
  privacy: {
    telemetry: false,
    uploadProjectFiles: false,
    autoSync: false
  },
  styling: {
    strategy: "hybrid",
    classNaming: "bem-kebab-case",
    componentCss: "colocated-or-parallel",
    tokenModel: ["primitive", "semantic", "component-when-useful"],
    responsiveStrategy: "fluid-first-hybrid",
    breakpoints: "derive-from-layout",
    themes: "only-when-requested-or-required",
    fontPolicy: "prefer-local; download-only-when-requested"
  },
  motion: {
    webDefault: "gsap",
    simpleMotion: "prefer-css-or-native-capabilities",
    reactGsapIntegration: "useGSAP-when-appropriate",
    astroStrategy: "choose-plain-script-or-existing-island",
    expoDefault: "reanimated",
    customEngine: null,
    architecture: "hybrid-registry-and-component-owned",
    generateTextSplitUtilitiesForWeb: true,
    reducedMotion: "required",
    dynamicContent: "explicit-reinitialization-first; scoped-observer-only-if-needed",
    enabled: false
  },
  state: {
    local: "framework-native",
    sharedClient: "zustand-when-needed",
    server: "tanstack-query-when-needed",
    preferFrameworkNativeData: true,
    avoidDuplicateServerState: true
  },
  api: {
    client: "centralized-when-backend-present",
    multipart: true,
    endpointRegistry: "single-file-until-domain-complexity-justifies-splitting",
    typedContracts: true,
    enabled: false
  },
  tooling: {
    formatter: "detect-or-configure-one-of-prettier-or-biome",
    husky: "optional-when-useful",
    githubActions: "out-of-scope-unless-requested",
    reuseExistingDependencies: true
  },
  architecture: {
    featureDirectories: "optional-when-domain-complexity-justifies-them",
    inspectExistingRepository: true,
    createOnlyNeededDirectories: true,
    writeArchitectureDocument: true
  }
};

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function deepMerge<T>(base: T, override: unknown): T {
  if (!isObject(base) || !isObject(override)) return (override === undefined ? base : override) as T;
  const result: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(override)) {
    const baseValue = result[key];
    result[key] = isObject(baseValue) && isObject(value)
      ? deepMerge(baseValue, value)
      : value;
  }
  return result as T;
}

export async function loadConfig(root: string): Promise<SetupConfig> {
  try {
    const raw = await readFile(path.join(root, CONFIG_FILE), "utf8");
    const merged = deepMerge(DEFAULT_CONFIG, JSON.parse(raw) as unknown);
    const motion = (merged as SetupConfig).motion as SetupConfig["motion"] & { webDefault?: string; expoDefault?: string };
    if ((motion.webDefault as string) === "gsap-for-complex-motion") motion.webDefault = "gsap";
    if ((motion.expoDefault as string) === "react-native-reanimated") motion.expoDefault = "reanimated";
    return merged;
  } catch {
    return structuredClone(DEFAULT_CONFIG);
  }
}

export function configureDefaults(input: {
  framework: Framework;
  profile: ProjectProfile;
  motionEnabled: boolean;
  apiEnabled: boolean;
}): SetupConfig {
  const config = structuredClone(DEFAULT_CONFIG);
  config.framework = input.framework;
  config.projectProfile = input.profile;
  config.motion.enabled = input.motionEnabled;
  config.api.enabled = input.apiEnabled;
  return config;
}
