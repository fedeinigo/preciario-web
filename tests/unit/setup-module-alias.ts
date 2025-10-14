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
  const testMocksDir = path.resolve(__dirname, "../mocks");
  const modalStubPath = path.join(testMocksDir, "modal");
  const modalRealPath = path.join(baseDir, "app/components/ui/Modal");

  const aliasMap = new Map<string, string>([
    ["@testing-library/react", path.join(testMocksDir, "testing-library-react")],
    ["@testing-library/user-event", path.join(testMocksDir, "testing-library-user-event")],
    ["next/navigation", path.join(testMocksDir, "next-navigation")],
    ["next-auth/react", path.join(testMocksDir, "next-auth-react")],
    ["next/dynamic", path.join(testMocksDir, "next-dynamic")],
    ["@/app/components/ui/Modal", modalStubPath],
  ]);

  mod._resolveFilename = function resolveFilenameWithAlias(
    request,
    parent,
    isMain,
    options,
  ) {
    const normalizedRequest =
      typeof request === "string" ? request.replace(/\\/g, "/") : request;

    if (
      typeof normalizedRequest === "string" &&
      normalizedRequest.replace(/\\/g, "/").startsWith(modalRealPath.replace(/\\/g, "/"))
    ) {
      return originalResolveFilename(modalStubPath, parent, isMain, options);
    }

    const aliasTarget = aliasMap.get(request);
    if (aliasTarget) {
      return originalResolveFilename(aliasTarget, parent, isMain, options);
    }
    if (typeof request === "string" && request.startsWith("@/")) {
      const resolved = path.join(baseDir, request.slice(2));
      return originalResolveFilename(resolved, parent, isMain, options);
    }

    return originalResolveFilename(request, parent, isMain, options);
  };

  mod.__aliasPatched = true;
}
