import { parseClientEnv } from "@/config/env";

export function getClientEnv() {
  return parseClientEnv(process.env);
}
