export default (options) => {
  return {
    jsc: {
      parser: {
        syntax: options.entry.endsWith(".jsx") || options.entry.endsWith(".js")
          ? "ecmascript"
          : "typescript",
        jsx: options.entry.endsWith(".jsx"),
        tsx: options.entry.endsWith(".tsx"),
      },
    },
  };
};
