import { copyFileSync } from "node:fs";
import { join } from "node:path";

const distDir = join(process.cwd(), "dist");
copyFileSync(join(distDir, "index.html"), join(distDir, "404.html"));
console.log("Copied dist/index.html -> dist/404.html for GitHub Pages SPA routing");
