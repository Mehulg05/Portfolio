/*
  Lets `npm test` import app modules as they are written: the "@/..." alias from
  tsconfig.json resolves to the repo root, and extensionless relative imports find their
  .ts file. `server-only` resolves to an empty module.
*/
import { register } from "node:module";

register("./test-resolve.mjs", import.meta.url);
