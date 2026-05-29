import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const scanRoots = [
  join(process.cwd(), "src"),
  join(process.cwd(), "tests"),
  join(process.cwd(), "playwright.config.js"),
  join(process.cwd(), "playwright.local.config.js"),
];
const violations = [];
const ignoredDirs = new Set([
  "node_modules",
  "dist",
  "coverage",
  ".git",
  ".idea",
  ".vscode",
]);

function walk(dir) {
  if (!dir) return;
  const info = statSync(dir);
  if (info.isFile()) {
    if (!/\.(js|jsx|mjs|ts|tsx)$/.test(dir)) return;
    const text = readFileSync(dir, "utf8");
    if (text.includes("Authorization") || text.includes("Bearer ")) {
      violations.push(dir);
    }
    return;
  }
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const info = statSync(full);
    if (info.isDirectory()) {
      if (ignoredDirs.has(entry)) continue;
      walk(full);
      continue;
    }
    if (!/\.(js|jsx|mjs|ts|tsx)$/.test(entry)) continue;
    if (full.endsWith("scripts\\assertCookieAuthContract.mjs")) continue;
    const text = readFileSync(full, "utf8");
    if (text.includes("Authorization") || text.includes("Bearer ")) {
      violations.push(full);
    }
  }
}

scanRoots.forEach((target) => {
  try {
    walk(target);
  } catch {
    // ignore missing paths
  }
});

if (violations.length > 0) {
  console.error("[auth-contract] Frontend runtime phải dùng cookie-auth, không dùng Authorization/Bearer:");
  violations.forEach((file) => console.error(` - ${file}`));
  process.exit(1);
}

console.log("[auth-contract] OK");
