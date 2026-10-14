import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { detectProject } from "../src/core/detect.js";
import { getCatalogGuidance, parseCatalog } from "../src/core/registry.js";
import { buildPlannedFiles } from "../src/templates/generate.js";
import { applyPlan } from "../src/core/apply.js";
import { createInstallPlan, missingMotionDependencies } from "../src/core/dependencies.js";

async function temporaryDirectory(): Promise<string> {
  return mkdtemp(path.join(os.tmpdir(), "frontend-setup-test-"));
}

test("detects a React + Vite project and honors packageManager", async () => {
  const root = await temporaryDirectory();
  try {
    await writeFile(path.join(root, "package.json"), JSON.stringify({
      packageManager: "pnpm@9.0.0",
      dependencies: { react: "^19.0.0" },
      devDependencies: { vite: "^6.0.0" }
    }));
    await writeFile(path.join(root, "pnpm-lock.yaml"), "lockfileVersion: '9.0'\n");
    const result = await detectProject(root);
    assert.equal(result.framework, "react-vite");
    assert.equal(result.packageManager, "pnpm");
    assert.equal(result.packageManagerSource, "packageManager-field");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("warns when package-manager markers disagree", async () => {
  const root = await temporaryDirectory();
  try {
    await writeFile(path.join(root, "package.json"), JSON.stringify({ dependencies: { astro: "^5.0.0" } }));
    await writeFile(path.join(root, "pnpm-lock.yaml"), "lockfileVersion: '9.0'\n");
    await writeFile(path.join(root, "yarn.lock"), "# yarn lockfile\n");
    const result = await detectProject(root);
    assert.equal(result.framework, "astro");
    assert.equal(result.packageManager, "unknown");
    assert.ok(result.warnings.some((warning) => warning.includes("Multiple package-manager lockfiles")));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("plans CSS tokens for web and TypeScript tokens for Expo", async () => {
  const root = await temporaryDirectory();
  try {
    const web = await buildPlannedFiles({ root, framework: "react-vite", profile: "landing-page", packageManager: "npm", motion: true, api: false });
    assert.ok(web.some((file) => file.path === "src/styles/tokens.css"));
    assert.ok(web.some((file) => file.path === "src/styles/animations.css"));
    assert.ok(web.some((file) => file.path === "src/lib/motion/attributes.ts"));

    const expo = await buildPlannedFiles({ root, framework: "expo", profile: "general-web-app", packageManager: "bun", motion: true, api: false });
    assert.ok(expo.some((file) => file.path === "src/styles/tokens.ts"));
    assert.ok(!expo.some((file) => file.path.endsWith(".css")));
    assert.ok(!expo.some((file) => file.path.includes("motion/attributes")));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("API foundation includes multipart handling without a hard-coded endpoint contract", async () => {
  const root = await temporaryDirectory();
  try {
    const files = await buildPlannedFiles({ root, framework: "next-app-router", profile: "saas-dashboard", packageManager: "pnpm", motion: false, api: true });
    const apiSetup = files.find((file) => file.path === "src/services/api/api-setup.ts");
    const endpoints = files.find((file) => file.path === "src/services/api/endpoints.ts");
    assert.ok(apiSetup?.content.includes("multipart<T>"));
    assert.ok(apiSetup?.content.includes('headers.delete("Content-Type")'));
    assert.ok(endpoints?.content.includes("do not invent routes"));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("catalog validation accepts schema version 1 and rejects unknown root fields", () => {
  const valid = parseCatalog({ schemaVersion: 1, catalogVersion: "2026.10.0", frameworks: {}, profiles: {}, recipes: [] });
  assert.equal(valid.catalogVersion, "2026.10.0");
  assert.throws(() => parseCatalog({ schemaVersion: 1, catalogVersion: "x", installScript: "do something" }), /not supported/);
  assert.throws(() => parseCatalog({ schemaVersion: 2, catalogVersion: "x" }), /schemaVersion/);
});

test("catalog guidance is scoped, bounded plain text and never treats remote data as code", () => {
  const catalog = parseCatalog({
    schemaVersion: 1,
    catalogVersion: "2026.10.1",
    frameworks: { astro: { guidance: ["Prefer .astro components for static content.", "Avoid control\u001b[31m characters.", "x".repeat(281), 42] } },
    profiles: { "marketing-site": { guidance: ["Use content-driven breakpoints.", "Prefer .astro components for static content."] } },
    recipes: [{ script: "this is data only" }]
  });
  assert.deepEqual(getCatalogGuidance(catalog, "astro", "marketing-site"), [
    "Prefer .astro components for static content.",
    "Avoid control [31m characters.",
    "Use content-driven breakpoints."
  ]);
  assert.deepEqual(getCatalogGuidance(catalog, "vanilla", "general-web-app"), []);
});


test("motion dependency plans respect framework and selected engine", () => {
  assert.deepEqual(missingMotionDependencies("react-vite", "gsap", ["react", "vite", "gsap"]), ["@gsap/react"]);
  assert.deepEqual(missingMotionDependencies("astro", "css", ["astro"]), []);
  assert.deepEqual(missingMotionDependencies("expo", "reanimated", ["expo", "react-native-reanimated"]), ["react-native-worklets"]);
  assert.deepEqual(missingMotionDependencies("expo", "custom", ["expo"]), []);
  assert.equal(createInstallPlan("react-vite", ["gsap", "@gsap/react"], "pnpm")?.display, "pnpm add gsap @gsap/react");
  assert.equal(createInstallPlan("expo", ["react-native-worklets"], "bun")?.display, "bun expo install react-native-worklets");
});

test("allows CSS/native/custom motion overrides in generated configuration", async () => {
  const root = await temporaryDirectory();
  try {
    const css = await buildPlannedFiles({ root, framework: "react-vite", profile: "landing-page", packageManager: "npm", motion: true, motionEngine: "css", api: false });
    const config = css.find((file) => file.path === "frontend-architecture.config.json")?.content ?? "{}";
    assert.equal(JSON.parse(config).motion.webDefault, "css");
    assert.ok(css.find((file) => file.path === "src/styles/animations.css")?.content.includes('[data-motion="rise-in"]'));

    const custom = await buildPlannedFiles({ root, framework: "expo", profile: "general-web-app", packageManager: "bun", motion: true, motionEngine: "custom", motionPackage: "react-native-skia", api: false });
    const customConfig = custom.find((file) => file.path === "frontend-architecture.config.json")?.content ?? "{}";
    assert.equal(JSON.parse(customConfig).motion.expoDefault, "custom");
    assert.equal(JSON.parse(customConfig).motion.customEngine, "react-native-skia");
    assert.ok(custom.some((file) => file.path === "src/lib/motion/README.md" && file.content.includes("react-native-skia")));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("applyPlan preserves existing files by default and backs up only when forced", async () => {
  const root = await temporaryDirectory();
  try {
    await mkdir(path.join(root, "src"), { recursive: true });
    await writeFile(path.join(root, "src", "keep.css"), "original\n");
    const plan = [{ path: "src/keep.css", content: "changed\n", reason: "test", category: "styles" as const }];
    const safe = await applyPlan(root, plan, false);
    assert.deepEqual(safe.skipped, ["src/keep.css"]);
    assert.equal(await readFile(path.join(root, "src", "keep.css"), "utf8"), "original\n");

    const forced = await applyPlan(root, plan, true);
    assert.deepEqual(forced.written, ["src/keep.css"]);
    assert.equal(await readFile(path.join(root, "src", "keep.css"), "utf8"), "changed\n");
    assert.equal(forced.backedUp.length, 1);
    const backupPath = path.join(root, forced.backedUp[0]!);
    assert.equal(await readFile(backupPath, "utf8"), "original\n");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});


test("refuses to write generated files through a symlink that escapes the project root", async () => {
  if (process.platform === "win32") return; // Directory symlinks commonly require elevated privileges on Windows.
  const root = await temporaryDirectory();
  const outside = await temporaryDirectory();
  try {
    await symlink(outside, path.join(root, "src"), "dir");
    const plan = [{ path: "src/escaped.css", content: "unsafe\n", reason: "security test", category: "styles" as const }];
    await assert.rejects(() => applyPlan(root, plan, false), /symlink outside the project root/);
    await assert.rejects(() => readFile(path.join(outside, "escaped.css"), "utf8"));
  } finally {
    await rm(root, { recursive: true, force: true });
    await rm(outside, { recursive: true, force: true });
  }
});
