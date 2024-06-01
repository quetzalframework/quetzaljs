// In order to run the given code, we will need to be able to bundle and then render in the browser
// In order to make a compatible and iso-platform solution, Vite is not going to be used (for now)

// Instead, we will use swc to transpile each file during development, and serve using the given runtime
// For production we will use swc and rollup to bundle and minify the application for deployment
// Code splitting will also be performed
import * as swc from "npm:@swc/core";
import swcOptions from "./config/swc.js";
import rollupOptions from "./config/rollup.js";
import { rollup } from "npm:rollup";

import { BundleOptions } from "./types/options.ts";

export async function bundle(options: BundleOptions) {
  if (options.mode === "development") {
    return await devBundle(options);
  } else {
    return await prodBundle(options);
  }
}

/**
 * The Dev Bundler/Transformer used to bundle code for a development server for Quetzal
 * @param options - The options used to configure the Quetzal Bundler
 */
async function devBundle(options: BundleOptions): Promise<string> {
  if (options.useDeno) {
    const { code } = await bundle();
  } else {
    // invoke swc compiler
    options.swcOptions = { ...options.swcOptions, ...swcOptions };
    const output = await swc.transformFile(options.entry, swcOptions);
    return output.code;
  }
}

async function prodBundle(options: BundleOptions) {
  // invoke rollup bundler and minifier to compile and bundle code
  // use swc plugin for transpiling
  options.swcOptions = { ...options.swcOptions, ...swcOptions };
  options.rollupOptions = {
    ...options.rollupOptions,
    ...rollupOptions(options.swcOptions),
  };
}
