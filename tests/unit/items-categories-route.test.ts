import "./setup-module-alias";
import assert from "node:assert/strict";
import { describe, it, mock } from "node:test";

import { POST } from "@/app/api/items/categories/route";
import prisma from "@/lib/prisma";
import * as authModule from "@/lib/auth";

describe("POST /api/items/categories", () => {
  it("rejects users without superadmin role", async () => {
    mock.method(authModule, "auth", async () => ({
      user: { role: "usuario" },
    }) as never);

    try {
      const response = await POST(
        new Request("https://example.com/api/items/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "Nueva" }),
        }),
      );

      assert.equal(response.status, 403);
      const payload = (await response.json()) as { ok: boolean };
      assert.equal(payload.ok, false);
    } finally {
      mock.restoreAll();
    }
  });

  it("prevents duplicates using normalized comparison", async () => {
    mock.method(authModule, "auth", async () => ({
      user: { role: "superadmin" },
    }) as never);

    const itemCategoryDelegate = prisma.itemCategory as unknown as {
      findMany: typeof prisma.itemCategory.findMany;
      create: typeof prisma.itemCategory.create;
    };
    const translationDelegate = prisma.itemTranslation as unknown as {
      findMany: typeof prisma.itemTranslation.findMany;
    };
    const itemDelegate = prisma.item as unknown as {
      findMany: typeof prisma.item.findMany;
    };

    const originalCategoryFindMany = itemCategoryDelegate.findMany;
    const originalCategoryCreate = itemCategoryDelegate.create;
    const originalTranslationFindMany = translationDelegate.findMany;
    const originalItemFindMany = itemDelegate.findMany;

    let findManyCalls = 0;
    itemCategoryDelegate.findMany = (async () => {
      findManyCalls += 1;
      return [{ normalizedName: "nueva categoria" }];
    }) as typeof itemCategoryDelegate.findMany;
    translationDelegate.findMany = (async () => []) as typeof translationDelegate.findMany;
    itemDelegate.findMany = (async () => []) as typeof itemDelegate.findMany;
    itemCategoryDelegate.create = (async () => {
      throw new Error("create should not be called when duplicate exists");
    }) as typeof itemCategoryDelegate.create;

    try {
      const response = await POST(
        new Request("https://example.com/api/items/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "  NUEVA   CATEGORIA  " }),
        }),
      );

      assert.equal(response.status, 409);
      const payload = (await response.json()) as { ok: boolean };
      assert.equal(payload.ok, false);
      assert.equal(findManyCalls, 1);
    } finally {
      itemCategoryDelegate.findMany = originalCategoryFindMany;
      itemCategoryDelegate.create = originalCategoryCreate;
      translationDelegate.findMany = originalTranslationFindMany;
      itemDelegate.findMany = originalItemFindMany;
      mock.restoreAll();
    }
  });

  it("creates a category after sanitizing spaces", async () => {
    mock.method(authModule, "auth", async () => ({
      user: { role: "superadmin" },
    }) as never);

    const itemCategoryDelegate = prisma.itemCategory as unknown as {
      findMany: typeof prisma.itemCategory.findMany;
      create: typeof prisma.itemCategory.create;
    };
    const translationDelegate = prisma.itemTranslation as unknown as {
      findMany: typeof prisma.itemTranslation.findMany;
    };
    const itemDelegate = prisma.item as unknown as {
      findMany: typeof prisma.item.findMany;
    };

    const originalCategoryFindMany = itemCategoryDelegate.findMany;
    const originalCategoryCreate = itemCategoryDelegate.create;
    const originalTranslationFindMany = translationDelegate.findMany;
    const originalItemFindMany = itemDelegate.findMany;

    itemCategoryDelegate.findMany = (async () => []) as typeof itemCategoryDelegate.findMany;
    translationDelegate.findMany = (async () => []) as typeof translationDelegate.findMany;
    itemDelegate.findMany = (async () => []) as typeof itemDelegate.findMany;

    const createCalls: Array<{ name: string; normalizedName: string }> = [];
    itemCategoryDelegate.create = (async (args) => {
      const data = (args as { data: { name: string; normalizedName: string } }).data;
      createCalls.push(data);
      return { name: data.name };
    }) as typeof itemCategoryDelegate.create;

    try {
      const response = await POST(
        new Request("https://example.com/api/items/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "  Nueva   Categoria  " }),
        }),
      );

      assert.equal(response.status, 201);
      const payload = (await response.json()) as { ok: boolean; name: string };
      assert.equal(payload.ok, true);
      assert.equal(payload.name, "Nueva Categoria");

      assert.equal(createCalls.length, 1);
      const data = createCalls[0];
      assert.equal(data.name, "Nueva Categoria");
      assert.equal(data.normalizedName, "nueva categoria");
    } finally {
      itemCategoryDelegate.findMany = originalCategoryFindMany;
      itemCategoryDelegate.create = originalCategoryCreate;
      translationDelegate.findMany = originalTranslationFindMany;
      itemDelegate.findMany = originalItemFindMany;
      mock.restoreAll();
    }
  });
});

