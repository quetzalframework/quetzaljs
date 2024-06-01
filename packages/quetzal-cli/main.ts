import { Command } from "https://deno.land/x/cliffy@v1.0.0-rc.4/command/mod.ts";
import version from "./gen/version.ts";
import { run } from "./commands/run.ts";
import { build } from "./commands/build.ts";

const main = new Command()
  .name("quetzal-deno")
  .version(version)
  .description("Command Line Tool for the Quetzal Framework/Library (in Deno)")
  .command("run", run)
  .command("build", build)
  .default("run");

await main
  .parse(Deno.args);
