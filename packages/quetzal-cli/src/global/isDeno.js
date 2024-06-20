import isNode from "./isNode.js";

export default typeof Deno !== "undefined" && !isNode;
