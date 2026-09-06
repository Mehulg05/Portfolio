/*
  The Rive runtime fetches its wasm from unpkg.com by default. This site has no other
  third-party runtime dependency, and a blocked or slow CDN would leave an empty plate
  in the contact section, so the wasm is served from our own origin instead.

  Copied at build time rather than committed, so the binary can never drift out of sync
  with the installed runtime version — a mismatch fails at load, not at review.
*/
import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const from = join(root, "node_modules", "@rive-app", "canvas-lite", "rive.wasm");
const to = join(root, "public", "rive.wasm");

mkdirSync(join(root, "public"), { recursive: true });
copyFileSync(from, to);
console.log("copied rive.wasm ->", to);
