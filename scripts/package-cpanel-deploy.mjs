#!/usr/bin/env node
/**
 * Packages a cPanel-ready deploy artifact:
 *   dist/cpanel-deploy/
 *     server.js          (root launcher)
 *     package.json       (minimal runtime manifest)
 *     .next/standalone/  (built bundle + public + static)
 *
 * Run after: NEXT_PUBLIC_APP_URL=https://uniqueskyway.com/v2 npm run build:cpanel
 */
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const standaloneSrc = path.join(root, ".next", "standalone");
const outDir = path.join(root, "dist", "cpanel-deploy");

if (!existsSync(path.join(standaloneSrc, "server.js"))) {
  console.error("Missing .next/standalone/server.js — run `npm run build:cpanel` first.");
  process.exit(1);
}

rmSync(outDir, { recursive: true, force: true });
mkdirSync(path.join(outDir, ".next"), { recursive: true });

cpSync(path.join(root, "server.js"), path.join(outDir, "server.js"));
cpSync(standaloneSrc, path.join(outDir, ".next", "standalone"), { recursive: true });

writeFileSync(
  path.join(outDir, "package.json"),
  JSON.stringify(
    {
      name: "unique-sky-way-v2-cpanel",
      private: true,
      type: "module",
      engines: { node: ">=20.11.0" },
      scripts: { start: "node server.js" },
    },
    null,
    2,
  ),
);

console.log("✓ cPanel deploy package:", outDir);
console.log("  Upload entire folder to Node Application Root, startup file: server.js");
