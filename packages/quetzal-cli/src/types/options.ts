import { Options as SWCOptions } from "npm:@swc/types";
import type { RollupOptions } from "npm:rollup";

export interface BundleOptions {
  mode: 'development' | 'production';
  entry: string;
  rollupOptions: RollupOptions;
  swcOptions: SWCOptions;
}
