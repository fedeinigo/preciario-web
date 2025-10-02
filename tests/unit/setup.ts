import Module from "node:module";
import path from "node:path";

const originalResolveFilename = (Module as unknown as {
  _resolveFilename: (
    request: string,
    parent: NodeModule | null | undefined,
    isMain: boolean,
    options?: unknown
  ) => string;
})._resolveFilename;

(Module as unknown as {
  _resolveFilename: typeof originalResolveFilename;
})._resolveFilename = function (request, parent, isMain, options) {
  if (request.startsWith("@/")) {
    const resolved = path.resolve(process.cwd(), ".tmp/test-dist/src", request.slice(2));
    return originalResolveFilename.call(this, resolved, parent, isMain, options);
  }
  return originalResolveFilename.call(this, request, parent, isMain, options);
};
