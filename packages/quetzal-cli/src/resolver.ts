/**
 * Resolving imports in code can be handled in multiple ways.
 *
 * For JSR: Redirecting JSR imports to the respective URLs would be helpful, however the urls do not directly give us the desired file/code, because the default exports are unknown.
 * Therefore, redirecting would be the optimum choice
 *
 * For NPM: Redirecting NPM and JSR imports in a normal node environment would be possible with the help of the `node_modules` directory. However, this isn't going to be possible in Deno.
 * Therefore the compiler will use `node_modules` once it detects that it is a Node environment, and use the following url strategy for
 *
 * Dev vs Prod: In production, the url namespaces will be resolved and then bundled together.
 */

import isDeno from "./global/isDeno.js";

/**
 * Resolver to resolve imports in code to server endpoints for code resolution
 */
export class Resolver {
  code: string;

  private constructor(code: string, options?: object) {
    this.code = code;
  }

  static resolve(code: string, options?: {
    deno?: boolean;
    url?: string;
  }): string {
    return (options?.deno ?? isDeno)
      ? DenoResolver.resolve(code, options?.url)
      : NodeResolver.resolve(code);
  }

  toString() {
    return this.code;
  }
}

interface PlatformResolver {
  npm(): Resolver;
  jsr(): Resolver;
}

class NodeResolver implements Resolver, PlatformResolver {
  code: string;

  private constructor(code: string, options?: object) {
    this.code = code;
  }

  static resolve(code: string): string {
    return new NodeResolver(code).jsr().npm().toString();
  }

  npm() {
    return this;
  }

  jsr() {
    return this;
  }

  toString() {
    return this.code;
  }
}

class DenoResolver implements Resolver, PlatformResolver {
  code: string;
  url: string | undefined;

  private constructor(code: string, url?: string) {
    this.code = code;
    this.url = url;
  }

  static resolve(code: string, url?: string): string {
    return new DenoResolver(code, url).jsr().toString();
  }

  npm() {
    this.code = this.code.replaceAll(
      /from\s+['"]npm:([^'"]+)['"]/g,
      (match, p1): string => {
        const url = `${
          this.url ? (this.url + "/npm") : "https://esm.sh"
        }/${p1}`;
        return match.includes("from '") ? `from '${url}'` : `from "${url}"`;
      },
    );
    return this;
  }

  jsr() {
    this.code = this.code.replaceAll(
      /["']jsr:@([^/]+)\/([^@/";\n]+)(?:@([^/;\n]+))?(?:\/([^\n]+))?["']/g,
      (match, scope, name, version: string = "", path = ""): string => {
        console.log("CASE: ", match, "->", scope, name, version, path, "\n");
        let url = `${
          this.url ? (this.url + "/jsr") : "https://jsr.io"
        }/@${scope}/${name}`;
        if (version !== "") {
          url += `/${version.replace("@", "")}`;
          if (path !== "") {
            url += `/${path}`;
          }
        }
        return match.includes("from '") ? `'${url}'` : `"${url}"`;
      },
    );
    return this;
  }

  toString() {
    return this.code;
  }
}
