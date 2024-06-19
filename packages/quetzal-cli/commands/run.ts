import { Command } from "https://deno.land/x/cliffy@v1.0.0-rc.4/command/mod.ts";
import { existsSync } from "https://deno.land/std@0.224.0/fs/exists.ts";

import { loadConfig } from "npm:c12";

import { SEPARATOR } from "jsr:@std/path/constants";

import { BundleOptions } from "../src/types/options.ts";
import { ServerOptions } from "../src/ServeOptions.ts";
import { serve } from "../src/serve.ts";
import isDeno from "../src/global/isDeno.js";

// deno-lint-ignore resolver-error
import { QuetzalConfig } from "../deps.ts";

export const run = new Command()
  .arguments("[directory]")
  .action(async (options, ...args) => {
    await runCommand(options, args);
  });

async function runCommand(options: any, args: Array<string | undefined>) {
  // get cwd
  const cwd = Deno.cwd();

  // load quetzal config
  let appConfig;
  const { config, configFile } = await loadConfig<QuetzalConfig>({
    name: "quetzal",
    defaultConfig: generateConfig(options, args, cwd),
  });
  if (config) appConfig = config;
  else appConfig = generateConfig(options, args, cwd);
  console.log(config, configFile);

  // get entry file
  const entry = getEntryFile(cwd, appConfig);
  const bundleOptions: BundleOptions = createBundleOptions(appConfig, entry);
  const serveOptions: ServerOptions = createServerOptions(appConfig, cwd);

  const server = serve(serveOptions, bundleOptions);
  server.listen(serveOptions.port, () => {
    console.log(`App running on http://localhost:${serveOptions.port}`);
  });
}

function getEntryFile(
  cwd: string,
  appConfig?: QuetzalConfig,
): string | undefined {
  const srcDir = `${cwd}${SEPARATOR}src`;
  if (existsSync(`${srcDir}${SEPARATOR}main.ts`)) {
    return `${srcDir}${SEPARATOR}main.ts`;
  } else if (existsSync(`${srcDir}${SEPARATOR}app.ts`)) {
    return `${srcDir}${SEPARATOR}app.ts`;
  } else if (appConfig && appConfig?.root) {
    return `${appConfig.root}${SEPARATOR}src${SEPARATOR}main.ts`;
  }
}

function createBundleOptions(
  config: QuetzalConfig,
  entry?: string,
): BundleOptions {
  return {
    mode: config.mode ?? "development",
    entry: entry ?? "./main.ts",
  };
}

function createServerOptions(
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

function generateConfig(
  options: any,
  args: (string | undefined)[],
  cwd: string,
): QuetzalConfig {
  return {
    mode: "development",
    deno: isDeno,
    server: {
      port: 8080,
    },
  };
}
