import { BundleOptions } from "../types/BundleOptions.ts";
import { Options as SWCOptions } from "npm:@swc/types";

declare function createSwcOptions(options: BundleOptions): SWCOptions;

export default createSwcOptions;
