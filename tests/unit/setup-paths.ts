import Module from "node:module";
import path from "node:path";

const moduleWithResolve = Module as typeof Module & {
  _resolveFilename: (
    request: string,
    parent: NodeModule | undefined,
    isMain: boolean,
    options: unknown
  ) => string;
};

const originalResolveFilename = moduleWithResolve._resolveFilename.bind(Module);

moduleWithResolve._resolveFilename = function resolveWithAlias(
  request,
  parent,
  isMain,
  options
) {
  if (typeof request === "string" && request.startsWith("@/")) {
    const mapped = path.join(process.cwd(), ".tmp/test-dist/src", request.slice(2));
    return originalResolveFilename(mapped, parent, isMain, options);
  }
  return originalResolveFilename(request, parent, isMain, options);
};
