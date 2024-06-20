import { BundleOptions } from "./types/BundleOptions.ts";
import isDeno from "./global/isDeno.js";
import { PlatformError } from "./errors/PlatformError.ts";
import { join } from "node:path";
import { devTranspile, devTranspileCode } from "./bundle.ts";

// @deno-types="npm:@types/express"
import express from "npm:express";
import { ServerOptions } from "./types/ServeOptions.ts";
import { ArrayUtils } from "https://deno.land/x/ts_morph@20.0.0/common/ts_morph_common.js";
import e from "npm:@types/express@4.17.15";

export function serve(options: ServerOptions, bundleOptions?: BundleOptions) {
  if (options.deno && options.deno.useDeno) {
    if (isDeno) {
      // use server with deno options
      return denoServer(options, bundleOptions);
    } else {
      throw new PlatformError("deno");
    }
  } else {
    // use express server
    return genericServer(options, bundleOptions);
  }
}

function denoServer(options: ServerOptions, bundleOptions?: BundleOptions) {
  const handler = async (req: Request): Promise<Response> => {
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
        code,
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
  
  // error handling

  // transpiling
  app.get('/', (req, res) => {
    res.setHeader("Content-Type", "text/html");
    res.send(Deno.readTextFileSync(join(options.dir, "index.html")))
  });
  // deno-lint-ignore no-explicit-any
  app.get(/\.(ts|jsx|tsx)$/, async (req: any, res: any) => {
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
        code,
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

  app.get('/_dev/packages/jsr/*', async (req, res) => {
    // get extra path segments

    const semverRegex = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/;

    let path: string = req.params[0];
    console.log(path);
    const pathSegments = path.split("/");
    let extraPath: string | undefined;
    let useUnderscore = false;
    let baseRequestUrl;

    let requestUrl = `https://jsr.io/${path}`

    // path already complete then fetch and send
    if (pathSegments.length >= 4) {
      if (semverRegex.test(pathSegments[2])) {
      } else {
        
      }
      const data = await fetch(requestUrl).then(async e => await e.text());
      res.setHeader("Content-Type", "application/javascript");
      res.send(data);
      return;
    }

    if (pathSegments.length > 2) {
      // handle version and path
      const regex = /^[0-9]/;
      
      if (semverRegex.test(pathSegments[2])) {
        // version present
        // denote 
        path = pathSegments.slice(0, 3).join('/');
        extraPath = pathSegments.slice(3).join('/');
        console.log(extraPath);
        useUnderscore = true;
      } else {
        // no version, just extra path
        path = pathSegments.slice(0, 2).join('/');
        extraPath = pathSegments.slice(2).join('/');
        console.log(extraPath);
      }
    }
    // perform meta request
    let metaRequestUrl = `https://jsr.io/${path}${useUnderscore ? '_' : '/'}meta.json`;
    const data = await fetch(metaRequestUrl).then(async e => {
      return await e.json();
    })
    if (data.versions) {
      // base meta request
      // get version
      let latest = data.latest;
      console.log(latest);
      if (latest === null || latest === "null") {
        latest = Object.entries(data.versions).filter(e => !e[1].yanked)[0][0];
      }
      // new request url with version
      requestUrl = `https://jsr.io/${pathSegments[0]}/${pathSegments[1]}/${latest}`
      baseRequestUrl = requestUrl;

      if (extraPath) {
        // if there is extra path, append and fetch
        try {
          requestUrl += `/${extraPath}`;
          await fetchFinalCode(requestUrl, baseRequestUrl);
          return;
        } catch (_err) {
          // proceed
        }
      }

      // no extra path, then get export for path
      metaRequestUrl = `https://jsr.io/${pathSegments[0]}/${pathSegments[1]}/${latest}_meta.json`
      const metadata = await fetch(metaRequestUrl).then(async e => {
        return await e.json();
      });
      addExportToUrl(metadata);
      
    } else {
      baseRequestUrl = requestUrl;
      // versioned meta request
      // get export and fetch
      addExportToUrl(data);
    }

    await fetchFinalCode(requestUrl, baseRequestUrl);
    return;

    function addExportToUrl(data?: any) {
      const exportName: string | undefined = extraPath ? data.exports[extraPath] : data.exports["."];
      if (!exportName) {
        throw new Error("JSR File not found");
      } else {
        requestUrl += exportName.replace('.', '');
      }
    }

    async function fetchFinalCode(url: string, baseUrl: string) {
      const finalData = await fetch(url).then(async (e) => await e.text());
      const code = await devTranspileCode(
        bundleOptions ?? {
          entry: url,
          mode: "development",
        }, url, {
        url: baseUrl
      }
      );
      res.setHeader("Content-Type", "application/javascript");
      res.send(code);
    }
  });

  // app.get('/_dev/packages/*', (req, res) => {
  //   res.send("surprise")
  // })

  app.use(express.static(options.dir));

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
