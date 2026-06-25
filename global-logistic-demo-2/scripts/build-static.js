import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const staticEntries = [
  "index.html",
  "manifest.json",
  "styles.css",
  "assets",
  "src",
  "docs"
];

await fs.rm(dist, { recursive: true, force: true });
await fs.mkdir(dist, { recursive: true });

for (const entry of staticEntries) {
  await fs.cp(path.join(root, entry), path.join(dist, entry), { recursive: true });
}

await fs.copyFile(path.join(root, "index.html"), path.join(dist, "404.html"));

console.log(`Static demo build ready: ${dist}`);
