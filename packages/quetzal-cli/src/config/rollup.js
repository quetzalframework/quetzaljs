import swc from "npm:@rollup/plugin-swc";

export default (options) => {
    return {
        plugins: [swc(options)]
    }
}