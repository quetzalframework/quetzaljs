import { Command } from "https://deno.land/x/cliffy@v1.0.0-rc.4/command/mod.ts";

import { BundleOptions } from "../src/types/BundleOptions.ts";
import { ServerOptions } from "../src/types/ServeOptions.ts";
import { serve } from "../src/serve.ts";
import isDeno from "../src/global/isDeno.js";
import { generateConfig, getConfiguration } from "../src/cli_funcs/getConfiguration.ts";
import { createBundleOptions } from "../src/cli_funcs/createBundleOptions.ts";
import { createServerOptions } from "../src/cli_funcs/createDevServerOptions.ts";
import { getEntryFile } from "../src/cli_funcs/getEntryFile.ts";
import { loadConfig, watchConfig } from "npm:c12";
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
  let devServer: any;
  const config = await watchConfig<QuetzalConfig>({
    name: "quetzal",
    defaultConfig: generateConfig(options, args, cwd),
    cwd,
    onWatch: (event) => {
      console.log("[watcher]", event.type, event.path);
    },
    acceptHMR({ oldConfig, newConfig, getDiff }) {
      const diff = getDiff();
      if (diff.length === 0) {
        console.log("No config changed detected!");
        return true; // No changes!
      }
    },
    onUpdate({ oldConfig, newConfig, getDiff }) {
      const diff = getDiff();
      appConfig = newConfig.config ?? generateConfig(options, args, cwd);
      console.log("Config updated:\n" + diff.map((i: any) => i.toJSON()).join("\n"));

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

function createDevServer(cwd: string, appConfig: QuetzalConfig) {
  const entry = getEntryFile(cwd, appConfig);

  // create configurations
  const bundleOptions: BundleOptions = createBundleOptions(
    appConfig,
    entry,
    true
  );

  const serveOptions: ServerOptions = createServerOptions(appConfig, cwd);

  // serve project
  const server = serve(serveOptions, bundleOptions);
  return server.listen(serveOptions.port, () => {
    console.log(`App running on http://localhost:${serveOptions.port}`);
  });
}
