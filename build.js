#!/usr/bin/env node
/**
 * build.js — produces dist-chrome/ and dist-firefox/ from the shared source files.
 *
 * Usage:
 *   node build.js              # build both
 *   node build.js chrome       # build only chrome
 *   node build.js firefox      # build only firefox
 *
 * No runtime deps. Just copies the right manifest plus background.js, rules.json,
 * and icons/ into each dist directory.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SHARED_FILES = ["background.js", "rules.json"];
const TARGETS = {
  chrome: { manifest: "manifest.chrome.json", out: "dist-chrome" },
  firefox: { manifest: "manifest.firefox.json", out: "dist-firefox" },
};

async function copyIfExists(src, dst) {
  try {
    await fs.copyFile(src, dst);
  } catch (err) {
    if (err.code !== "ENOENT") throw err;
  }
}

async function copyDirIfExists(src, dst) {
  try {
    const stats = await fs.stat(src);
    if (!stats.isDirectory()) return;
    await fs.mkdir(dst, { recursive: true });
    const entries = await fs.readdir(src);
    for (const name of entries) {
      const s = path.join(src, name);
      const d = path.join(dst, name);
      const st = await fs.stat(s);
      if (st.isDirectory()) await copyDirIfExists(s, d);
      else await fs.copyFile(s, d);
    }
  } catch (err) {
    if (err.code !== "ENOENT") throw err;
  }
}

async function build(target) {
  const cfg = TARGETS[target];
  if (!cfg) throw new Error(`Unknown target: ${target}`);

  const outDir = path.join(__dirname, cfg.out);
  await fs.rm(outDir, { recursive: true, force: true });
  await fs.mkdir(outDir, { recursive: true });

  // Manifest → renamed to manifest.json in the dist
  await fs.copyFile(
    path.join(__dirname, cfg.manifest),
    path.join(outDir, "manifest.json")
  );

  // Shared source files
  for (const f of SHARED_FILES) {
    await copyIfExists(path.join(__dirname, f), path.join(outDir, f));
  }

  // Icons (optional — extension loads with default icon if absent)
  await copyDirIfExists(path.join(__dirname, "icons"), path.join(outDir, "icons"));

  console.log(`[build] ${target}: written to ${cfg.out}/`);
}

const arg = process.argv[2];
const targets = arg ? [arg] : Object.keys(TARGETS);
for (const t of targets) {
  await build(t);
}
