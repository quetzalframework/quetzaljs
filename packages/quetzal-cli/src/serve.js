/**
 * @typedef {import("./types/BundleOptions.ts").BundleOptions} BundleOptions
 * @typedef {import("./types/ServeOptions.ts").ServerOptions} ServerOptions
 * @typedef {import("./types/Server.ts").QServer} QServer
 */

import isDeno from "./global/isDeno.js";
import { PlatformError } from "./errors/PlatformError.ts";
import { join } from "node:path";
import { devBundleCode, devTranspile } from "./bundle.ts";

// @deno-types="npm:@types/express"
import express from "npm:express";

/**
 * Creates a server for the given Quetzal Application
 *
 * Depending on whether the settings have been configured for Deno or
 * @param {ServerOptions} options The Server Options to configure the server with
 * @param {BundleOptions} [bundleOptions] Optional Bundle Options to configure bundling and transpilation of the application and its dependencies
 * @returns {import("npm:@types/express").Express | QServer} The built server
 */
export function serve(options, bundleOptions) {
  if (options.deno && options.deno.useDeno) {
    if (isDeno) {
      /**
       * use server with deno options
       * @type {import("npm:@types/express").Express}
       */
      return denoServer(options, bundleOptions);
    } else {
      throw new PlatformError("deno");
    }
  } else {
    /**
     * use express server
     * @type {QServer}
     */
    return genericServer(options, bundleOptions);
  }
}

/**
 * Initialises a server using the Deno API
 * @param {ServerOptions} options The server options used to configure this server
 * @param {BundleOptions} [bundleOptions] The optional bundle options to configure bundling and transpilation of the application and its dependencies
 * @returns {QServer} A Server object with Express-compatible API
 */
function denoServer(options, bundleOptions) {
  /** @type {(req: Request) => Promise<Response>} */
  const handler = async (req) => {
    // get pathname
    const url = new URL(req.url);
    const pathname = url.pathname;

    /** Get file path @type {string} */
    const filePath = join(options.dir, pathname);

    // configure bundle options
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
        // return index
        return new Response(
          Deno.readTextFileSync(join(filePath, "index.html")),
          {
            headers: {
              "content-type": "text/html",
            },
          },
        );
      }
      // transpile code
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
      // console error
      console.error("Error transpiling TypeScript file:", error);

      // TODO: Render error page
      throw createError({
        status: 500,
        message: "Error transpiling TypeScript file",
        name: "Compilation Error",
      });
    }
  };
  return {
    listen: (
      port,
      onListen,
      onAbort,
    ) => {
      const server = Deno.serve(
        { port, hostname: options.host, onListen },
        handler,
      );
      server.finished.then(onAbort);
      return {
        close: (onEnd) => {
          server.shutdown();
          onEnd();
        },
      };
    },
  };
}

/**
 * Initialises a server using the Express API
 * @param {ServerOptions} options The server options used to configure this server
 * @param {BundleOptions} [bundleOptions] The optional bundle options to configure bundling and transpilation of the application and its dependencies
 * @returns {import("npm:@types/express").Express} An Express Server Object
 */
function genericServer(options, bundleOptions) {
  /** The base express application @type {import("npm:@types/express").Express} */
  const app = express();

  app.set("view engine", "ejs");

  // Middleware to parse JSON bodies
  app.use(express.json());

  // index html file
  app.get("/", (_req, res) => {
    res.setHeader("Content-Type", "text/html");
    res.send(Deno.readTextFileSync(join(options.dir, "index.html")));
  });

  // jsr package serving/configuration
  app.get("/_dev/packages/jsr/*", async (req, res) => {
    // semver regex
    const semverRegex =
      /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/;

    /** Get the path segments @type {string} */
    let path = req.params[0];
    const pathSegments = path.split("/");

    /** Any extra paths parsed @type {string | undefined} */
    let extraPath;
    let useUnderscore = false;
    /** Base url for the `fetchFinalCode` function @type {string} */
    let baseRequestUrl;

    let requestUrl = `https://jsr.io/${path}`;

    // path already complete then fetch and send
    if (pathSegments.length >= 4) {
      if (semverRegex.test(pathSegments[2])) {
        await fetchFinalCode(
          requestUrl,
          `https://jsr.io/${pathSegments[0]}/${pathSegments[1]}/${
            pathSegments[2]
          }`,
        );
      } else {
        const baseTempRequestUrl = `https://jsr.io/${pathSegments[0]}/${
          pathSegments[1]
        }`;
        const tempMetaRequestUrl = baseTempRequestUrl + "/meta.json";
        const latest = getSemver(
          await fetch(tempMetaRequestUrl).then(async (e) => await e.json()),
        );
        const tempRequestUrl = baseTempRequestUrl +
          `/${latest}/${pathSegments.slice(2).join("/")}`;
        await fetchFinalCode(tempRequestUrl, baseTempRequestUrl);
      }
      console.log("Bypassed");

      return;
    }

    if (pathSegments.length > 2) {
      // handle version and path

      if (semverRegex.test(pathSegments[2])) {
        // version present
        // denote
        path = pathSegments.slice(0, 3).join("/");
        extraPath = pathSegments.slice(3).join("/");
        console.log(extraPath);
        useUnderscore = true;
      } else {
        // no version, just extra path
        path = pathSegments.slice(0, 2).join("/");
        extraPath = pathSegments.slice(2).join("/");
        console.log(extraPath);
      }
    }
    // perform meta request
    let metaRequestUrl = `https://jsr.io/${path}${
      useUnderscore ? "_" : "/"
    }meta.json`;
    const data = await fetch(metaRequestUrl).then(async (e) => {
      return await e.json();
    });
    if (data.versions) {
      // base meta request
      // get version
      const latest = getSemver(data);
      // new request url with version
      requestUrl = `https://jsr.io/${pathSegments[0]}/${
        pathSegments[1]
      }/${latest}`;
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
      metaRequestUrl = `https://jsr.io/${pathSegments[0]}/${
        pathSegments[1]
      }/${latest}_meta.json`;
      const metadata = await fetch(metaRequestUrl).then(async (e) => {
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

    /**
     * Get Semver Version from Fetched JSON Object
     * @param {any} data The object
     * @returns {string} The semver version
     */
    function getSemver(data) {
      let latest = data.latest;
      console.log(latest);
      if (latest === null || latest === "null") {
        latest = Object.entries(data.versions).filter((e) =>
          !e[1].yanked
        )[0][0];
      }
      return latest;
    }

    /**
     * Get export from
     * @param {any} data
     */
    function addExportToUrl(data) {
      /** @type {string | undefined} */
      const exportName = extraPath
        ? data.exports[extraPath]
        : data.exports["."];
      if (!exportName) {
        throw new Error("JSR File not found");
      } else {
        requestUrl += exportName.replace(".", "");
      }
    }

    /**
     * Fetch final code, bundle and send to server
     * @param {string} url The url to fetch the code to transpile/bundle
     * @param {string} baseUrl The base url to use as reference for imports
     */
    async function fetchFinalCode(url, baseUrl) {
      const code = await devBundleCode(url, { url: baseUrl });
      res.setHeader("Content-Type", "application/javascript");
      res.send(code);
    }
  });

  app.get(/\.(ts|jsx|tsx)$/, async (req, res) => {
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

  app.use(express.static(options.dir));

  app.get("*", (_req, res) => {
    res.status(500).send("Something broke!");
  });

  app.use((err, _req, res, _next) => {
    console.error(err.stack);
    res.status(500).send("Something broke!");
  });

  return app;
}

/**
 * Creates error in opinionated way
 * @param {Object} options
 * @param {number} [options.status]
 * @param {string} [options.message]
 * @param {string} [options.name]
 * @returns {Error}
 */
function createError(
  options,
) {
  return new ServerError(
    options.status ?? 500,
    options.message ?? "An unknown error has occured",
    options.name ?? "Unknown Error",
  );
}

/**
 * Server Error class
 */
class ServerError extends Error {
  /** @type {number} */
  status;

  /**
   * Constructor for a server error
   * @param {number} status
   * @param {string} message
   * @param {string} [name]
   */
  constructor(
    status,
    message,
    name,
  ) {
    super(message);
    this.status = status;
    if (name) this.name = name;
  }
}
