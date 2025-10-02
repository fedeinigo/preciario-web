import Module from "node:module";
import type { Module as ModuleInstance } from "node:module";
import path from "node:path";

type ResolveFn = (
  request: string,
  parent?: ModuleInstance,
  isMain?: boolean,
  options?: {
    paths?: string[];
  },
) => string;

type ModuleWithAlias = typeof Module & {
  __aliasPatched?: boolean;
  _resolveFilename: ResolveFn;
};

const mod = Module as ModuleWithAlias;

if (!mod.__aliasPatched) {
  const originalResolveFilename: ResolveFn = mod._resolveFilename.bind(Module);
  const baseDir = path.resolve(__dirname, "../../src");

  mod._resolveFilename = function resolveFilenameWithAlias(
    request,
    parent,
    isMain,
    options,
  ) {
    if (typeof request === "string" && request.startsWith("@/")) {
      const resolved = path.join(baseDir, request.slice(2));
      return originalResolveFilename(resolved, parent, isMain, options);
    }

    return originalResolveFilename(request, parent, isMain, options);
  };

  mod.__aliasPatched = true;
}
