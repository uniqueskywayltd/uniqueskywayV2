"use strict";

/* eslint-disable @typescript-eslint/no-require-imports */

const { existsSync } = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const standaloneServer = path.join(__dirname, ".next", "standalone", "server.js");

if (!existsSync(standaloneServer)) {
  console.error(
    "Missing .next/standalone/server.js. Run `npm run build:cpanel` before starting cPanel.",
  );
  process.exit(1);
}

import(pathToFileURL(standaloneServer).href).catch((error) => {
  console.error(error);
  process.exit(1);
});
