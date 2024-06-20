import { Resolver } from "../../../packages/quetzal-cli/src/resolver.ts";
import { transformImport } from "../../../packages/quetzal-cli/src/resolvers/main.js";
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

Deno.test({
  name: "SWC Import Resolver Test",
}, async (t) => {
  const codeA = `
    import { something } from "jsr:@astral/astral";
    import { anotherThing } from "jsr:@astral/astral@1.0.0";
    import * as a from "jsr:@a/a@1.0.0/wasm.ts";

    console.log(something);
        `;

  const codeB = `
    import { something } from "jsr:@astral/astral@1.0.0";

    console.log(something);
        `;

  await t.step({
    name: "transformInput Function Tests",
    fn: () => {
      const codeApieces = codeA.trimStart().split("\n").slice(0, 3).map((e) =>
        e.trimStart().split(" ")[e.trimStart().split(" ").length - 1].replace(
          '"',
          "",
        ).replace('";', "")
      );
      const codeBpieces = codeB.trimStart().split("\n").slice(0, 2).map((e) =>
        e.trimStart().split(" ")[e.trimStart().split(" ").length - 1].replace(
          '"',
          "",
        ).replace('";', "")
      );
      codeApieces.forEach((a) => console.log(transformImport(a)));
      codeBpieces.forEach((a) => console.log(transformImport(a)));
    },
  });

  await t.step({
    name: "SWC Import Function Resolver Test",
    fn: () => {
      const resolvedCodeA = Resolver.resolve(codeA);
      assertEquals(
        resolvedCodeA,
        `
    import { something } from "https://jsr.io/@astral/astral";
    import { anotherThing } from "https://jsr.io/@astral/astral/1.0.0";
    import * as a from "https://jsr.io/@a/a/1.0.0/wasm.ts";

    console.log(something);
        `,
      );
      const resolvedCodeB = Resolver.resolve(codeB);
      assertEquals(
        resolvedCodeB,
        `
    import { something } from "https://jsr.io/@astral/astral/1.0.0";

    console.log(something);
        `,
      );
    },
  });
});
