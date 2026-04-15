import { cpSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(fileURLToPath(new URL("..", import.meta.url)));
const src = join(root, "posters");
const dst = join(root, "public", "posters");

if (!existsSync(src)) {
  console.warn("sync-posters: ./posters not found, skipping.");
  process.exit(0);
}

mkdirSync(dst, { recursive: true });
cpSync(src, dst, { recursive: true });
console.log("sync-posters: copied ./posters → ./public/posters");
