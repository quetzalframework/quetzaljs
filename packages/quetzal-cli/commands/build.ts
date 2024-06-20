import { Command } from "https://deno.land/x/cliffy@v1.0.0-rc.4/command/mod.ts";

import { getConfiguration } from "../src/cli_funcs/getConfiguration.ts";
import { getEntryFile } from "../src/cli_funcs/getEntryFile.ts";
import { BundleOptions } from "../src/types/BundleOptions.ts";
import { createBundleOptions } from "../src/cli_funcs/createBundleOptions.ts";

export const build = new Command()
  .arguments("[directory]")
  .action(async (options, ...args) => {
    await buildCommand(options, args);
  });

async function buildCommand(options: void, args: [(string | undefined)?]) {
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
    false,
  );

  // bundle and build assets
  // write them to provided output directory

  // finish
}
