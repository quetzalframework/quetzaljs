import type { ConfigLayerMeta, DefineConfig, UserInputConfig } from 'npm:c12';

/**
 * The Configuration type for Quetzal, Gotten from the quetzal config file
 * 
 */
export interface QuetzalConfig extends UserInputConfig {
    /** The root of the quetzal configuration */
    root?: string;

    plugins?: object[];

    mode?: 'development' | 'production'

    deno?: boolean | "detect";

    build?: {
        outDir?: string,
        transpile?: 'deno' | 'swc' | 'detect',
        bundle?: 'deno' | 'rollup' | 'detect'
    };

    dev?: {
        transpile?: 'deno' | 'swc' | 'detect',
        bundle?: 'deno' | 'rollup' | 'detect'
    };

    server?: {
        port?: number,
        host?: string,
    }

    denoOptions?: object
    swcOptions?: object
    rollupOptions?: object
}