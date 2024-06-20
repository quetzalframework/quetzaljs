import { loadConfig } from "npm:c12";
import { QuetzalConfig } from "../../deps.ts";
import isDeno from "../global/isDeno.js";

export async function getConfiguration(
  options: any,
  args: (string | undefined)[],
  cwd: string,
  appConfig: any,
) {
  const { config, configFile } = await loadConfig<QuetzalConfig>({
    name: "quetzal",
    defaultConfig: generateConfig(options, args, cwd),
  });
  if (config) appConfig = config;
  else appConfig = generateConfig(options, args, cwd);
  console.log(config, configFile);
  return appConfig;
}

export function generateConfig(
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
