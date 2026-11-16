import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const extensions = [".ts", ".tsx", "/index.ts"];

function withExtension(file) {
  if (path.extname(file) && existsSync(file)) return file;
  for (const extension of extensions) if (existsSync(file + extension)) return file + extension;
  return null;
}

export async function resolve(specifier, context, next) {
  // Next bundles this marker package; under plain Node it is an empty module.
  if (specifier === "server-only") return { url: "data:text/javascript,", shortCircuit: true };
  // Next ships CJS entry points without an "exports" map entry Node can find from ESM.
  if (/^next\/[a-z-]+$/.test(specifier)) return next(`${specifier}.js`, context);
  let file = null;
  if (specifier.startsWith("@/")) file = withExtension(path.join(root, specifier.slice(2)));
  else if (specifier.startsWith(".") && context.parentURL?.startsWith("file:")) {
    file = withExtension(path.resolve(path.dirname(fileURLToPath(context.parentURL)), specifier));
  }
  return next(file ? pathToFileURL(file).href : specifier, context);
}
