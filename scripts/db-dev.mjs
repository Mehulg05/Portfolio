/*
  A real Postgres for local development without an account or Docker: PGlite (Postgres
  compiled to WASM) behind a socket server that speaks the wire protocol, so the app's
  postgres.js client connects to it exactly as it would to Neon.

  Data persists in .pglite/, which ignores itself. Delete the folder to start over.
*/
import { mkdir, writeFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";

const PORT = Number(process.env.PGLITE_PORT ?? 5433);
const HOST = "127.0.0.1";
const DATA_DIR = ".pglite";

// A self-ignoring folder keeps local data out of git without touching the root .gitignore.
await mkdir(DATA_DIR, { recursive: true });
await writeFile(`${DATA_DIR}/.gitignore`, "*\n");

const db = await PGlite.create(DATA_DIR);
// The multiplexer lets next dev, the migration script and an inspector share one instance.
const server = new PGLiteSocketServer({ db, port: PORT, host: HOST, maxConnections: 10 });

await server.start();
console.log(`PGlite listening. Use:\n  DATABASE_URL=postgres://postgres:postgres@${HOST}:${PORT}/postgres`);

const shutdown = async () => {
  await server.stop();
  await db.close();
  process.exit(0);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
