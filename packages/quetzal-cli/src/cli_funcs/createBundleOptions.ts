import { BundleOptions } from "../types/BundleOptions.ts";
import isDeno from "../global/isDeno.js";
import { QuetzalConfig } from "../../deps.ts";

export function createBundleOptions(
  config: QuetzalConfig,
  entry?: string,
  dev: boolean = false,
): BundleOptions {
  if (dev) return createDevBundleOptions(config, entry);
  else return createProdBundleOptions(config, entry);
}

export function createDevBundleOptions(
  config: QuetzalConfig,
  entry?: string,
): BundleOptions {
  return {
    mode: config.mode ?? "development",
    entry: entry ?? "./main.ts",
    deno: {
      useDeno: typeof config.deno === "string"
        ? (isDeno ? true : false)
        : config.deno,
    },
  };
}

function createProdBundleOptions(
  config: QuetzalConfig,
  entry?: string,
): BundleOptions {
  return {
    mode: config.mode ?? "production",
    entry: entry ?? "./main.ts",
    deno: {
      useDeno: typeof config.deno === "string"
        ? (isDeno ? true : false)
        : config.deno,
    },
  };
}
