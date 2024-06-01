import { Options as SWCOptions } from "npm:@swc/types";
import type { RollupOptions } from "npm:rollup";
import { BundleOptions as DenoBundleOptions } from "https://deno.land/x/emit@0.40.0/mod.ts";

export interface BundleOptions {
  mode: "development" | "production";
  entry: string;
  rollupOptions: RollupOptions;
  swcOptions: SWCOptions;
  deno: {
    useDeno: boolean | undefined;
    denoOptions: DenoBundleOptions | undefined;
  } | undefined;
}
