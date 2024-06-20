/**
 * @typedef {import("../deps.ts").QuetzalConfig} QuetzalConfig
 */

import { Command } from "https://deno.land/x/cliffy@v1.0.0-rc.4/command/mod.ts";

import { serve } from "../src/serve.js";
import { generateConfig } from "../src/cli_funcs/getConfiguration.ts";
import { createBundleOptions } from "../src/cli_funcs/createBundleOptions.ts";
import { createServerOptions } from "../src/cli_funcs/createDevServerOptions.ts";
import { getEntryFile } from "../src/cli_funcs/getEntryFile.ts";
import { watchConfig } from "npm:c12";

export const run = new Command()
  .arguments("[directory]")
  .action(async (options, ...args) => {
    await runCommand(options, args);
  });

/**
 * The Run Command
 * @param options 
 * @param {Array<string | undefined>} args
 */
async function runCommand(options, args) {
  // get cwd
  const cwd = Deno.cwd();

  // load quetzal config
  let appConfig;
  let devServer;

  // watch config for changes
  const config = await watchConfig({
    name: "quetzal",
    defaultConfig: generateConfig(options, args, cwd),
    cwd,
    onWatch: (event) => {
      console.log("[watcher]", event.type, event.path);
    },
    acceptHMR({ _oldConfig, _newConfig, getDiff }) {
      const diff = getDiff();
      if (diff.length === 0) {
        console.log("No config changed detected!");
        return true; // No changes!
      }
    },
    onUpdate({ _oldConfig, newConfig, getDiff }) {
      const diff = getDiff();
      appConfig = newConfig.config ?? generateConfig(options, args, cwd);
      console.log("Config updated:\n" + diff.map(i => i.toJSON()).join("\n"));

      devServer.close(function () {
        console.log("Reloading Server....")
      });

      devServer = createDevServer(cwd, appConfig);
    },
  });

  if (config.config) appConfig = config.config;
  else appConfig = generateConfig(options, args, cwd);

  // get entry file
  devServer = createDevServer(cwd, appConfig);
}

/**
 * Creates the dev server for the Quetzal Application
 * @param {string} cwd The current working directory
 * @param {QuetzalConfig} appConfig The app configuration
 */
function createDevServer(cwd, appConfig) {
  const entry = getEntryFile(cwd, appConfig);

  // create configurations
  const bundleOptions = createBundleOptions(
    appConfig,
    entry,
    true
  );

  const serveOptions = createServerOptions(appConfig, cwd);

  // serve project
  const server = serve(serveOptions, bundleOptions);
  return server.listen(serveOptions.port, () => {
    console.log(`App running on http://localhost:${serveOptions.port}`);
  });
}
