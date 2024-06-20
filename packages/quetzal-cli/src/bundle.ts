// In order to run the given code, we will need to be able to bundle and then render in the browser
// In order to make a compatible and iso-platform solution, Vite is not going to be used (for now)

// Instead, we will use swc to transpile each file during development, and serve using the given runtime
// For production we will use swc and rollup to bundle and minify the application for deployment
// Code splitting will also be performed
import * as swc from "npm:@swc/core";
//@deno-types="./config/swc.d.ts"
import swcOptions from "./config/swc.js";
import rollupOptions from "./config/rollup.js";
import denoOptions from "./config/deno.js";
import { rollup } from "npm:rollup";
import { readFileSync } from "node:fs";
import { dirname } from "node:path";
import {
  bundle as denoBundle,
  transpile as denoTranspile,
} from "jsr:@deno/emit";
import { Resolver } from "./resolver.ts";

import { BundleOptions } from "./types/BundleOptions.ts";

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
  if (options.deno && options.deno.useDeno) {
    const { code } = await denoBundle(
      await readFileSync(options.entry, { encoding: "utf8" }),
    );
    return code;
  } else {
    // invoke swc compiler
    options.swcOptions = { ...options.swcOptions, ...swcOptions(options) };
    const output = await swc.transformFile(options.entry, options.swcOptions);
    return output.code;
  }
}

export async function devTranspile(
  options: BundleOptions,
): Promise<string> {
  if (options.deno && options.deno.useDeno) {
    console.log("Deno used:", options.entry);
    const code = await denoTranspile(options.entry);
    return Resolver.resolve(Array.from(code.values())[0], {
      url: '/_dev/packages',
      deno: true
    });
  } else {
    console.log("SWC Used:", options.entry);
    // invoke swc compiler
    options.swcOptions = { ...options.swcOptions, ...swcOptions(options) };
    const source = Resolver.resolve(Deno.readTextFileSync(options.entry), {
      url: '/_dev/packages',
    });
    const output = await swc.transform(source, options.swcOptions);
    return output.code;
  }
}

export async function devTranspileCode(
  options: BundleOptions,
  entry: string,
  tcOptions: {
    url: string
  }
): Promise<string> {
    if (!entry) throw new Error("Entry must be specified when running this");
    console.log("Deno used:", entry);
    const code = await denoTranspile(entry, {
      importMap: {
        baseUrl: '.',
        imports: {
          '.': tcOptions.url
        }
      }
    });
    return Resolver.resolve(Array.from(code.values())[0], {
      url: '/_dev/packages',
      deno: true
    });
}

export async function devBundleCode(
  options: BundleOptions,
  entry: string,
  tcOptions: {
    url: string
  }
): Promise<string> {
  if (!entry) throw new Error("Entry must be specified when running this");
  console.log("Deno used:", entry);
  const code = await denoBundle(entry, {
    importMap: {
      baseUrl: '.',
      imports: {
        '.': tcOptions.url
      }
    }
  });
  return Resolver.resolve(code.code, {
    url: '/_dev/packages',
    deno: true
  });
}

async function prodBundle(options: BundleOptions) {
  // invoke rollup bundler and minifier to compile and bundle code
  if (options.deno && options.deno.useDeno) {
    const optionsWithoutSwc = rollupOptions();
    optionsWithoutSwc.plugins.pop();

    options.rollupOptions = {
      ...options.rollupOptions,
      ...optionsWithoutSwc,
    };
  } else {
    // use swc plugin for transpiling
    options.swcOptions = { ...options.swcOptions, ...swcOptions(options) };
    options.rollupOptions = {
      ...options.rollupOptions,
      ...rollupOptions(options.swcOptions),
    };
  }
  const bundle = await rollup(options.rollupOptions);
  const { output } = await bundle.generate({
    dir: dirname(),
  });

  for (const chunkOrAsset of output) {
  }

  if (bundle) {
    // closes the bundle
    await bundle.close();
  }
}
