export interface ServerOptions {
  port?: string;
  host?: string;
  dir: string;
  dev?: boolean;
  deno?: {
    useDeno: boolean | undefined;
  };
}
