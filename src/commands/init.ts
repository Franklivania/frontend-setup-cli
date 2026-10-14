import * as p from "@clack/prompts";
import path from "node:path";
import { access } from "node:fs/promises";
import { applyPlan } from "../core/apply.js";
import { createInstallPlan, hasPackageManifest, installDependencies, missingMotionDependencies } from "../core/dependencies.js";
import { loadConfig } from "../core/config.js";
import { detectProject, frameworkLabel } from "../core/detect.js";
import { getCatalogGuidance, readCachedCatalog } from "../core/registry.js";
import { FRAMEWORKS, PROFILES, type Framework, type InitOptions, type MotionEngine, type PackageManager, type ProjectProfile } from "../core/types.js";
import { buildPlannedFiles } from "../templates/generate.js";

const PACKAGE_MANAGERS: Exclude<PackageManager, "unknown">[] = ["npm", "pnpm", "yarn", "bun"];

function isFramework(value: string | undefined): value is Framework {
  return value !== undefined && FRAMEWORKS.some((framework) => framework.value === value);
}

function isProfile(value: string | undefined): value is ProjectProfile {
  return value !== undefined && PROFILES.some((profile) => profile.value === value);
}

function inferProfile(framework: Framework): ProjectProfile {
  if (framework === "astro" || framework === "vanilla") return "landing-page";
  return "general-web-app";
}

function motionDefault(framework: Framework, profile: ProjectProfile): boolean {
  if (framework === "expo") return profile === "interactive-experimental";
  return ["landing-page", "marketing-site", "interactive-experimental"].includes(profile);
}

function apiDefault(profile: ProjectProfile, framework: Framework): boolean {
  return framework !== "vanilla" && ["saas-dashboard", "general-web-app"].includes(profile);
}

function defaultMotionEngine(framework: Framework, config: Awaited<ReturnType<typeof loadConfig>>): MotionEngine {
  if (framework === "expo") {
    return config.motion.expoDefault === "native" || config.motion.expoDefault === "custom"
      ? config.motion.expoDefault
      : "reanimated";
  }
  return config.motion.webDefault === "css" || config.motion.webDefault === "custom"
    ? config.motion.webDefault
    : "gsap";
}

function validateMotionEngine(framework: Framework, engine: MotionEngine): void {
  if (framework === "expo" && engine !== "reanimated" && engine !== "native" && engine !== "custom") {
    throw new Error("React Native + Expo supports --motion-engine reanimated, native, or custom.");
  }
  if (framework !== "expo" && engine !== "gsap" && engine !== "css" && engine !== "custom") {
    throw new Error("Web frameworks support --motion-engine gsap, css, or custom.");
  }
}

async function fileExists(file: string): Promise<boolean> {
  try { await access(file); return true; } catch { return false; }
}

export async function runInit(options: InitOptions): Promise<void> {
  const root = path.resolve(options.cwd);
  const detection = await detectProject(root);
  const existingConfig = await loadConfig(root);
  const existingConfigurationFile = await fileExists(path.join(root, "frontend-architecture.config.json"));
  const existingArchitectureFile = await fileExists(path.join(root, "ARCHITECTURE.md"));
  const cachedCatalog = await readCachedCatalog(root);

  p.intro("Frontend Setup · architecture bootstrap");
  p.log.info(`Working directory: ${root}`);
  p.log.info(`Package manager: ${options.packageManager ?? detection.packageManager}${detection.packageManagerSource === "unknown" && !options.packageManager ? " (not detected)" : ""}`);
  if (detection.frameworkLabel) p.log.info(`Framework detected: ${detection.frameworkLabel}`);
  if (cachedCatalog) p.log.info(`Community catalog cache: ${cachedCatalog.catalogVersion}`);
  for (const warning of detection.warnings) p.log.warn(warning);
  p.log.message("Privacy: setup reads limited local metadata. It does not scan application source files or upload project files or metadata.");

  let framework: Framework;
  let profile: ProjectProfile;
  let motion: boolean;
  let motionEngine: MotionEngine;
  let api: boolean;

  if (options.framework) {
    framework = options.framework;
  } else if (options.yes && isFramework(existingConfig.framework) && existingConfigurationFile) {
    framework = existingConfig.framework;
  } else if (options.yes && detection.framework) {
    framework = detection.framework;
  } else if (options.yes) {
    throw new Error("Framework could not be detected in non-interactive mode. Pass --framework <name>.");
  } else {
    const initialFramework = isFramework(existingConfig.framework) && existingConfigurationFile
      ? existingConfig.framework
      : detection.framework ?? "react-vite";
    const selected = await p.select({
      message: "Choose the framework adapter",
      options: FRAMEWORKS.map((item) => ({ value: item.value, label: item.label, hint: item.hint })),
      initialValue: initialFramework
    });
    if (p.isCancel(selected)) { p.cancel("Setup cancelled; no files were changed."); return; }
    framework = selected as Framework;
  }

  const initialProfile = existingConfigurationFile && isProfile(existingConfig.projectProfile)
    ? existingConfig.projectProfile
    : inferProfile(framework);
  if (options.profile) {
    profile = options.profile;
  } else if (options.yes) {
    profile = initialProfile;
  } else {
    const selected = await p.select({
      message: "What are you building?",
      options: PROFILES.map((item) => ({ value: item.value, label: item.label, hint: item.hint })),
      initialValue: initialProfile
    });
    if (p.isCancel(selected)) { p.cancel("Setup cancelled; no files were changed."); return; }
    profile = selected as ProjectProfile;
  }

  const communityGuidance = getCatalogGuidance(cachedCatalog, framework, profile);
  if (communityGuidance.length) {
    p.note(communityGuidance.map((item) => `• ${item}`).join("\n"), `Community guidance · ${cachedCatalog?.catalogVersion ?? "cached catalog"}`);
  }

  const defaultMotion = existingConfigurationFile ? existingConfig.motion.enabled : motionDefault(framework, profile);
  if (options.motion !== undefined) motion = options.motion;
  else if (options.yes) motion = defaultMotion;
  else {
    const selected = await p.confirm({
      message: framework === "expo" ? "Include native motion conventions?" : "Include the motion foundation (data-motion selectors, reduced-motion rules, and animation helpers)?",
      initialValue: defaultMotion
    });
    if (p.isCancel(selected)) { p.cancel("Setup cancelled; no files were changed."); return; }
    motion = selected;
  }

  motionEngine = options.motionEngine ?? defaultMotionEngine(framework, existingConfig);
  if (motion) {
    if (options.motionEngine) {
      validateMotionEngine(framework, options.motionEngine);
    } else if (!options.yes) {
      const choices = framework === "expo"
        ? [
            { value: "reanimated", label: "React Native Reanimated", hint: "Recommended for complex native motion and gestures" },
            { value: "native", label: "React Native Animated API", hint: "No additional animation dependency" },
            { value: "custom", label: "Another native motion tool", hint: "Bring a compatible library and configure it yourself" }
          ]
        : [
            { value: "gsap", label: "GSAP", hint: "Recommended for timelines, scroll triggers, and text motion" },
            { value: "css", label: "CSS and native browser APIs", hint: "No animation dependency; suitable for self-contained effects" },
            { value: "custom", label: "Another motion tool", hint: "Bring your preferred library and configure it yourself" }
          ];
      const selected = await p.select({
        message: "Choose the motion engine",
        options: choices,
        initialValue: motionEngine
      });
      if (p.isCancel(selected)) { p.cancel("Setup cancelled; no files were changed."); return; }
      motionEngine = selected as MotionEngine;
      validateMotionEngine(framework, motionEngine);
    } else {
      validateMotionEngine(framework, motionEngine);
    }
  }

  let motionPackage = options.motionPackage?.trim() || existingConfig.motion.customEngine || "";
  if (motion && motionEngine === "custom" && !motionPackage) {
    if (options.yes) {
      throw new Error("A custom motion engine was selected. Pass --motion-package <package-or-engine-name> to document it.");
    }
    const answer = await p.text({
      message: "Which motion library or implementation should this project use?",
      placeholder: framework === "expo" ? "e.g. react-native-skia" : "e.g. motion, framer-motion, or an internal engine",
      validate(value) {
        if (!value.trim()) return "Enter a library or implementation name, or choose a standard engine.";
        if (value.length > 160) return "Keep the engine name under 160 characters.";
        return undefined;
      }
    });
    if (p.isCancel(answer)) { p.cancel("Setup cancelled; no files were changed."); return; }
    motionPackage = answer.trim();
  }
  if (motionEngine !== "custom") motionPackage = "";

  const defaultApi = existingConfigurationFile ? existingConfig.api.enabled : apiDefault(profile, framework);
  if (options.api !== undefined) api = options.api;
  else if (options.yes) api = defaultApi;
  else {
    const selected = await p.confirm({
      message: "Scaffold a typed API request layer with JSON/multipart handling and an endpoint registry?",
      initialValue: defaultApi
    });
    if (p.isCancel(selected)) { p.cancel("Setup cancelled; no files were changed."); return; }
    api = selected;
  }

  if (framework === "vanilla" && api) {
    p.log.warn("The initial API scaffold is TypeScript-first. API scaffolding was disabled for the Vanilla JS adapter; use a JavaScript-specific service recipe when required.");
    api = false;
  }

  const manager = options.packageManager ?? detection.packageManager;
  const missingPackages = motion
    ? missingMotionDependencies(framework, motionEngine, detection.detectedDependencies)
    : [];
  let installDeps = options.installDependencies ?? false;
  if (missingPackages.length > 0 && options.installDependencies === undefined && !options.yes && await hasPackageManifest(root)) {
    const selected = await p.confirm({
      message: `Install missing motion dependencies (${missingPackages.join(", ")}) using this project's package manager?`,
      initialValue: true
    });
    if (p.isCancel(selected)) { p.cancel("Setup cancelled; no files were changed."); return; }
    installDeps = selected;
  }

  if (installDeps && missingPackages.length === 0) {
    p.log.info("The selected motion dependencies are already present, or the selected engine does not require extra packages.");
    installDeps = false;
  }
  if (installDeps && !(await hasPackageManifest(root))) {
    throw new Error("Dependency installation requires an existing package.json. Create the framework project first, then rerun setup init.");
  }

  let selectedManager = manager;
  if (installDeps && selectedManager === "unknown") {
    if (options.yes) {
      throw new Error("The package manager could not be detected. Pass --package-manager npm|pnpm|yarn|bun with --install-deps.");
    }
    const selected = await p.select({
      message: "Which package manager should install the dependencies?",
      options: PACKAGE_MANAGERS.map((value) => ({ value, label: value })),
      initialValue: "npm"
    });
    if (p.isCancel(selected)) { p.cancel("Setup cancelled; no files were changed."); return; }
    selectedManager = selected as PackageManager;
  }
  if (selectedManager === "unknown" && options.packageManager) selectedManager = options.packageManager;

  const installPlan = installDeps
    ? createInstallPlan(framework, missingPackages, selectedManager)
    : null;

  const files = await buildPlannedFiles({
    root,
    framework,
    profile,
    packageManager: selectedManager,
    motion,
    motionEngine,
    ...(motionPackage ? { motionPackage } : {}),
    api
  });

  const existingPaths = new Set<string>();
  for (const file of files) {
    if (await fileExists(path.join(root, file.path))) existingPaths.add(file.path);
  }

  const preview = files.map((file) => {
    const state = existingPaths.has(file.path) ? (options.force ? "replace + backup" : "preserve existing") : "create";
    return `${state.padEnd(20)} ${file.path}\n  ${file.reason}`;
  }).join("\n\n");
  p.note(`${preview || "No files planned."}${installPlan ? `\n\ninstall dependencies  ${installPlan.display}` : ""}`, "Setup plan");
  if (existingPaths.size && !options.force) {
    p.log.warn("Existing files will be preserved. Pass --force to replace them after a timestamped backup is created under .setup/backups/.");
    if ((existingConfigurationFile || existingArchitectureFile) && options.force === false) {
      p.log.warn("Existing architecture/config files are preserved as-is. Review the preview before forcing changes so project-specific settings are not lost.");
    }
  }

  if (options.dryRun) {
    p.outro("Dry run complete. No files or dependencies were changed.");
    return;
  }

  if (!options.yes) {
    const confirmed = await p.confirm({ message: "Apply this setup plan?", initialValue: true });
    if (p.isCancel(confirmed) || !confirmed) { p.cancel("No files were changed."); return; }
  }

  const result = await applyPlan(root, files, options.force);
  if (result.written.length) p.log.success(`Created ${result.written.length} file(s):\n${result.written.map((file) => `  + ${file}`).join("\n")}`);
  if (result.skipped.length) p.log.warn(`Preserved ${result.skipped.length} existing file(s):\n${result.skipped.map((file) => `  = ${file}`).join("\n")}`);
  if (result.backedUp.length) p.log.info(`Backups created:\n${result.backedUp.map((file) => `  ↳ ${file}`).join("\n")}`);

  if (installPlan) {
    const spin = p.spinner();
    spin.start(`Installing ${installPlan.packages.join(", ")}`);
    try {
      await installDependencies(root, installPlan);
      spin.stop("Motion dependencies installed");
    } catch (error) {
      spin.stop("Motion dependency installation failed");
      throw error;
    }
  }

  p.outro("Setup complete. Review ARCHITECTURE.md. Import src/styles/global.css from the framework's existing global entry; existing entry files are not rewritten automatically.");
}
