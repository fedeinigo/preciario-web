import Module from "node:module";
import path from "node:path";
import assert from "node:assert/strict";
import React from "react";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import type { Session } from "next-auth";

import "../unit/setup-paths";

const noop = () => {};

const moduleOverrides = new Map<string, unknown>();
const moduleWithLoad = Module as unknown as {
  _load: (request: string, parent: NodeModule | undefined, isMain: boolean) => unknown;
};
const originalLoad = moduleWithLoad._load.bind(Module);

moduleWithLoad._load = function patchedLoad(
  request: string,
  parent: NodeModule | undefined,
  isMain: boolean
) {
  if (moduleOverrides.has(request)) {
    return moduleOverrides.get(request);
  }
  if (request.startsWith("@/")) {
    const resolved = path.join(process.cwd(), ".tmp/test-dist/src", request.slice(2));
    return originalLoad.call(this, resolved, parent, isMain);
  }
  return originalLoad.call(this, request, parent, isMain);
};

function withModuleOverrides<T>(overrides: Record<string, unknown>, run: () => Promise<T>) {
  for (const [key, value] of Object.entries(overrides)) {
    moduleOverrides.set(key, value);
  }
  return run().finally(() => {
    for (const key of Object.keys(overrides)) {
      moduleOverrides.delete(key);
    }
  });
}

test("NavbarClient renders a scrollable tablist for mobile viewports", { concurrency: false }, async () => {
  await withModuleOverrides(
    {
      "next/navigation": { useRouter: () => ({ refresh: noop }) },
      "next-auth/react": { __esModule: true, signOut: noop },
      "@/app/components/ui/Modal": { __esModule: true, default: () => null },
      "@/app/components/ui/toast": {
        __esModule: true,
        toast: Object.assign(noop, { success: noop, error: noop, info: noop }),
      },
    },
    async () => {
      const { LanguageProvider } = await import("../../src/app/LanguageProvider");
      const { default: NavbarClient } = await import("../../src/app/components/navbar/NavbarClient");

      const session = {
        user: {
          id: "user-123",
          name: "Mapache PÃ©rez",
          email: "mapache@example.com",
          role: "usuario",
          team: "Mapaches",
        },
        expires: new Date().toISOString(),
      } as const;

      const html = renderToStaticMarkup(
        <LanguageProvider>
          <NavbarClient session={session as unknown as Session} />
        </LanguageProvider>
      );

      assert(html.includes("overflow-x-auto"));
      assert(html.includes("HistÃ³rico"));
      assert(html.includes("EstadÃ­sticas"));
      assert(html.includes("Mapaches"));
    }
  );
});



