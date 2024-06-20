import { Options as SWCOptions } from "npm:@swc/types";
import type { RollupOptions } from "npm:rollup";
import { BundleOptions as DenoBundleOptions } from "jsr:@deno/emit";

export interface BundleOptions {
  mode: "development" | "production";
  entry: string;
  rollupOptions?: RollupOptions;
  swcOptions?: SWCOptions;
  jsx?: boolean;
  deno?: {
    useDeno: boolean | undefined;
    denoOptions?: DenoBundleOptions | undefined;
  };
}
