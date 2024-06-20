import { Command } from "https://deno.land/x/cliffy@v1.0.0-rc.4/command/mod.ts";

import { BundleOptions } from "../src/types/BundleOptions.ts";
import { ServerOptions } from "../src/types/ServeOptions.ts";
import { serve } from "../src/serve.ts";
import isDeno from "../src/global/isDeno.js";
import { getConfiguration } from "../src/cli_funcs/getConfiguration.ts";
import { createBundleOptions } from "../src/cli_funcs/createBundleOptions.ts";
import { createServerOptions } from "../src/cli_funcs/createDevServerOptions.ts";
import { getEntryFile } from "../src/cli_funcs/getEntryFile.ts";

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
  appConfig = await getConfiguration(options, args, cwd, appConfig);

  // get entry file
  const entry = getEntryFile(cwd, appConfig);

  // create configurations
  const bundleOptions: BundleOptions = createBundleOptions(
    appConfig,
    entry,
    true,
  );
  const serveOptions: ServerOptions = createServerOptions(appConfig, cwd);

  // serve project
  const server = serve(serveOptions, bundleOptions);
  server.listen(serveOptions.port, () => {
    console.log(`App running on http://localhost:${serveOptions.port}`);
  });
}
