import { ServerOptions } from "../types/ServeOptions.ts";
import isDeno from "../global/isDeno.js";
import { QuetzalConfig } from "../../deps.ts";

export function createServerOptions(
  config: QuetzalConfig,
  cwd: string,
): ServerOptions {
  return {
    dir: cwd,
    port: config.server?.port?.toString() ?? "8080",
    deno: {
      useDeno: typeof config.deno === "string"
        ? (isDeno ? true : false)
        : config.deno,
    },
  };
}
