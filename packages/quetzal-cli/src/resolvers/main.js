export function transformImport(importString) {
  if (importString.startsWith("jsr:")) {
    return transformJsrImport(importString);
  } else if (importString.startsWith("npm:")) {
    return transformNpmImport(importString);
  } else {
    return importString; // No transformation needed
  }
}

/**
 * @param {string} importString
 * @returns string
 */
function transformJsrImport(importString) {
  const base = "https://jsr.io/";
  const parts = importString.slice(4); // Remove 'jsr:' prefix
  let url = base;
  let segment = parts.slice(1);
  let [before, after] = segment.split("@");
  url += `@${before}`;
  if (after) url += `/${after}`;
  return url;
}

function transformNpmImport(importString) {
  const base = "https://esm.sh/";
  const parts = importString.slice(4); // Remove 'npm:' prefix
  return base + parts;
}
