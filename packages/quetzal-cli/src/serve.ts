import { BundleOptions } from "./types/options.ts";
import isDeno from "./global/isDeno.js";
import { PlatformError } from "./errors/PlatformError.ts";
import { join } from "node:path";
import * as swc from "npm:@swc/core";
import { devTranspile } from "./bundle.ts";

// @deno-types="npm:@types/express"
import express from "npm:express";
import { ServerOptions } from "./ServeOptions.ts";

export function serve(options: ServerOptions, bundleOptions?: BundleOptions) {
  if (options.deno && options.deno.useDeno) {
    if (isDeno) {
      return denoServer(options, bundleOptions);
    } else {
      throw new PlatformError("deno");
    }
  } else {
    return genericServer(options, bundleOptions);
  }
}

function denoServer(options: ServerOptions, bundleOptions?: BundleOptions) {
  let handler = async (req: Request): Promise<Response> => {
    console.log(req.url, req.headers, await req.text());
    const url = new URL(req.url);
    const pathname = url.pathname;
    const filePath: string = join(options.dir, pathname);
    bundleOptions = bundleOptions
      ? {
        ...bundleOptions,
        ...{
          entry: filePath,
          mode: "development",
        },
      }
      : {
        entry: filePath,
        mode: "development",
      };
    try {
      if (pathname === "/") {
        return new Response(
          Deno.readTextFileSync(join(filePath, "index.html")),
          {
            headers: {
              "content-type": "text/html",
            },
          },
        );
      }
      const code = await devTranspile(
        bundleOptions ?? {
          entry: filePath,
          mode: "development",
        },
      );
      return new Response(
        code instanceof Map
          ? Object.entries(code)[Object.entries(code).length - 1][1]
          : code,
        {
          headers: {
            "content-type": "application/javascript",
          },
        },
      );
    } catch (error) {
      console.error("Error transpiling TypeScript file:", error);
      throw createError({
        status: 500,
        message: "Error transpiling TypeScript file",
        name: "Compilation Error",
      });
    }
  };
  return {
    listen: (
      port: number,
      onListen?: () => void,
      onAbort?: () => void,
    ): void => {
      const server = Deno.serve(
        { port, hostname: options.host, onListen },
        handler,
      );
      server.finished.then(onAbort);
    },
  };
}

function genericServer(options: ServerOptions, bundleOptions?: BundleOptions) {
  const app = express();
  const port = 3000;

  app.set("view engine", "ejs");

  // Middleware to parse JSON bodies
  app.use(express.json());
  app.use(express.static(options.dir));
  // error handling

  // transpiling
  app.get(["*.ts", "*.jsx", "*.tsx"], async (req, res) => {
    const filePath = join(options.dir, req.path);
    try {
      const code = await devTranspile(
        bundleOptions ?? {
          entry: filePath,
          mode: "development",
        },
      );
      res.setHeader("Content-Type", "application/javascript");
      res.send(
        code instanceof Map
          ? Object.entries(code)[Object.entries(code).length - 1][1]
          : code,
      );
    } catch (error) {
      console.error("Error transpiling TypeScript file:", error);
      throw createError({
        status: 500,
        message: "Error transpiling TypeScript file",
        name: "Compilation Error",
      });
    }
  });

  return app;
}

function createError(
  options: { status?: number; message?: string; name?: string },
): Error {
  return new ServerError(
    options.status ?? 500,
    options.message ?? "An unknown error has occured",
    options.name ?? "Unknown Error",
  );
}

class ServerError extends Error {
  status: number;

  constructor(
    status: number,
    message: string,
    name?: string,
  ) {
    super(message);
    this.status = status;
    if (name) this.name = name;
  }
}
