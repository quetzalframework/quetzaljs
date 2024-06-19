export class PlatformError extends Error {
  constructor(
    name: string,
  ) {
    let message;
    switch (name) {
      case "deno":
      case "Deno":
        message =
          `The project doesn't run on the Deno environment or runtime, but "useDeno" was enabled. Please run the code on the Deno runtime or disable the "useDeno" flag`;
        break;
      case "bun":
      case "Bun":
        message =
          `The project doesn't run on the Deno environment or runtime, but "useDeno" was enabled. Please run the code on the Deno runtime or disable the "useDeno" flag`;
        break;
      case "node":
      case "Node":
      case "npm":
        message =
          `The project doesn't run on the Deno environment or runtime, but "useDeno" was enabled. Please run the code on the Deno runtime or disable the "useDeno" flag`;
        break;
      default:
        message = `Unknown Platform Error`;
        break;
    }
    super(message);
  }
}
