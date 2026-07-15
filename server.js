import { existsSync } from "node:fs";

const standaloneServer = new URL("./.next/standalone/server.js", import.meta.url);

if (!existsSync(standaloneServer)) {
  console.error(
    "Missing .next/standalone/server.js. Run `npm run build:cpanel` before starting cPanel.",
  );
  process.exit(1);
}

await import(standaloneServer.href);
