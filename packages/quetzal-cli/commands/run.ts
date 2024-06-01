import { Command } from "https://deno.land/x/cliffy@v1.0.0-rc.4/command/mod.ts";

export const run = new Command()
  .action((options, ...args) => {
    runCommand(options, args);
  });

function runCommand(options: any, args: string[]) {
}
