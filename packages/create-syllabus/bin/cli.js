#!/usr/bin/env node
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const templateDir = resolve(__dirname, "../../../templates/default");
const targetName = process.argv[2] ?? "my-syllabus-app";
const targetDir = resolve(process.cwd(), targetName);

if (existsSync(targetDir)) {
  console.error(`Error: ${targetDir} already exists`);
  process.exit(1);
}

const ignore = new Set(["node_modules", ".next", ".env.local", "pnpm-lock.yaml"]);

function copyRecursive(src, dest) {
  mkdirSync(dest, { recursive: true });
  for (const entry of readdirSync(src, { withFileTypes: true })) {
    if (ignore.has(entry.name)) continue;
    const from = join(src, entry.name);
    const to = join(dest, entry.name);
    if (entry.isDirectory()) copyRecursive(from, to);
    else cpSync(from, to);
  }
}

console.log(`Creating Syllabus app in ${targetDir}...`);
copyRecursive(templateDir, targetDir);

const pkgPath = join(targetDir, "package.json");
const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
pkg.name = targetName;
writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);

console.log("\nDone! Next steps:");
console.log(`  cd ${targetName}`);
console.log("  cp .env.example .env.local");
console.log("  pnpm install");
console.log("  pnpm dev");
