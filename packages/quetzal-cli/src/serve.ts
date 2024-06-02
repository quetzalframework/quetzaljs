import { BundleOptions } from "./types/options.ts";
import isDeno from "./global/isDeno.js";
import { PlatformError } from "./errors/PlatformError.ts";

// @deno-types="npm:@types/express"
import express from "npm:express";

interface ServeOptions {
    port: string | undefined;
    host: string | undefined;
    dir: string;
    dev: boolean;
    deno: {
        useDeno: boolean | undefined;
    } | undefined;
}

async function serve(options: ServeOptions) {
    if (options.deno && options.deno.useDeno) {
        if (isDeno) {
            return await denoServer(options);
        } else {
            throw new PlatformError("deno");
        }
    } else {
        return await genericServer(options);
    }
}

async function denoServer(options: ServeOptions) {
  // implement server for code
}


function genericServer(options: ServeOptions) {
    const app = express();
    const port = 3000;

    app.set('view engine', 'ejs');
    
    // Middleware to parse JSON bodies
    app.use(express.json());
    app.use(express.static(options.dir));
    
    // error handling
    
    // Start the server
    app.listen(port, () => {
      console.log(`App running on http://localhost:${port}`);
    });
}
