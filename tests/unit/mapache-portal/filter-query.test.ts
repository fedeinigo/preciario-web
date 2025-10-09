import "../setup-module-alias";
import "../setup";

import assert from "node:assert/strict";
import test from "node:test";

import {
  createFilterQueryString,
  normalizeQueryString,
  parseQueryParamList,
} from "@/app/mapache-portal/utils/filter-query";
import {
  createDefaultFiltersState,
  createDefaultTaskFilterState,
} from "@/app/mapache-portal/filters";
import type { MapacheNeedFromTeam } from "@/app/mapache-portal/types";

test("parseQueryParamList normalizes values", () => {
  const result = parseQueryParamList(["QUOTE", "SCOPE", "quote", ""]);
  assert.deepEqual(result, ["QUOTE", "SCOPE", "quote"]);
});

test("createFilterQueryString removes existing filter params", () => {
  const searchParams = new URLSearchParams(
    "status=OLD&needs=QUOTE&foo=bar&limit=50",
  );

  const activeFilter = { ...createDefaultTaskFilterState(), status: "PENDING" };
  const needs: MapacheNeedFromTeam[] = ["QUOTE", "SCOPE"];
  const advancedFilters = {
    ...createDefaultFiltersState(),
    needFromTeam: needs,
  };

  const query = createFilterQueryString(
    searchParams,
    activeFilter,
    advancedFilters,
  );
  assert.equal(
    query,
    "foo=bar&limit=50&needs=QUOTE&needs=SCOPE&status=PENDING",
  );
});

test("normalizeQueryString sorts keys lexicographically", () => {
  const unordered = "b=2&a=1&b=1";
  const normalized = normalizeQueryString(unordered);
  assert.equal(normalized, "a=1&b=1&b=2");
});
