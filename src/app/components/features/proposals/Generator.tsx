// src/app/components/features/proposals/Generator.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { ItemFormData } from "@/app/components/ui/ItemForm";

import { useLanguage, useTranslations } from "@/app/LanguageProvider";

import {
  countryIdFromName,
  subsidiaryIdFromName,
  autoSubsidiaryForCountry,
  getCompanyCountryOptions,
} from "./lib/catalogs";
import { createProposal, type CreateProposalPayload } from "./lib/storage";
import type { UIItem } from "./lib/types";

import {
  createCatalogItem,
  updateCatalogItem,
  deleteCatalogItem,
} from "./lib/items";
import { locales, defaultLocale, type Locale } from "@/lib/i18n/config";
import { normalizeSearchText } from "@/lib/normalize-search-text";

import {
  isWppAuth,
  isWppMarketing,
  isWppUtility,
  isMinutesIn,
  isMinutesOut,
  isWiserPro,
} from "./lib/itemKinds";

import GeneratorMainCard, {
  type GeneratorMainCardProps,
} from "./components/generator/GeneratorMainCard";
import { type PipedriveSyncMode } from "./components/generator/PipedriveCard";
import WhatsAppCalculatorCard from "./components/generator/WhatsAppCalculatorCard";
import GeneratorModalStack, {
  type ConfirmResetState,
  type ItemFormState,
  type MinutesState,
  type ProposalCreatedState,
  type SummaryState,
  type WhatsAppState,
  type WiserState,
} from "./components/generator/GeneratorModalStack";
import { FilialesSidebar, GlossarySidebar } from "./components/Sidebars";

import { useFiliales } from "./hooks/useFiliales";
import useCatalogData from "./hooks/useCatalogData";
import { useGlossary } from "./hooks/useGlossary";
import { useProposalTotals } from "./hooks/useProposalTotals";
import { useWhatsAppModal } from "./hooks/useWhatsAppModal";
import { useMinutesModal } from "./hooks/useMinutesModal";
import { useWiserModal } from "./hooks/useWiserModal";
import { toast } from "@/app/components/ui/toast";
import {
  isProposalError,
  type ProposalError,
  type ProposalErrorCode,
} from "./lib/errors";
import type { WppKind } from "./components/WhatsAppModal";
import type { MinutesKind } from "./components/MinutesModal";

function extractDealIdFromLink(s: string): string | null {
  if (!s) return null;
  const t = s.trim();
  const onlyNum = /^(\d+)$/.exec(t);
  if (onlyNum) return onlyNum[1];
  const m = t.match(/\/deal\/(\d+)/i);
  if (m) return m[1];
  return null;
}

function computeUnitNet(unitPrice: number, discountPct?: number) {
  const pct = Math.max(0, Math.min(100, Number(discountPct ?? 0)));
  return Math.max(0, unitPrice * (1 - pct / 100));
}

const RAW_ONE_SHOT_RATE = Number(
  process.env.NEXT_PUBLIC_PROPOSALS_ONESHOT_RATE ??
    process.env.NEXT_PUBLIC_ONESHOT_RATE ??
    50
);
const ONE_SHOT_RATE = Number.isFinite(RAW_ONE_SHOT_RATE) && RAW_ONE_SHOT_RATE > 0 ? RAW_ONE_SHOT_RATE : 50;

type Props = {
  isAdmin: boolean;
  canViewSku: boolean;
  userId: string;
  userEmail: string;
  onSaved: (id: string) => void;
};

type SortKey = "popular" | "sku" | "unitPrice" | "name" | "category";
type SortDir = "asc" | "desc";

export default function Generator({ isAdmin, canViewSku, userId, userEmail, onSaved }: Props) {
  const { locale } = useLanguage();
  const generatorT = useTranslations("proposals.generator");
  const toastT = useTranslations("proposals.generator.toast");
  const confirmResetT = useTranslations("proposals.generator.confirmReset");
  const errorsT = useTranslations("proposals.generator.errors");
  const proposalErrorsT = useTranslations("proposals.errors");
  const pipedriveT = useTranslations("proposals.generator.pipedrive");
  const companyT = useTranslations("proposals.generator.company");
  const filtersT = useTranslations("proposals.generator.filters");
  const orderT = useTranslations("proposals.generator.order");
  const actionsT = useTranslations("proposals.generator.actions");
  const totalsT = useTranslations("proposals.generator.totals");
  const pipedriveExample = pipedriveT("exampleLink");
  const emptyValue = generatorT("emptyValue");
  const countryMessages = useTranslations("proposals.countries");
  const countryOptions = useMemo(
    () => getCompanyCountryOptions((name) => countryMessages(name)),
    [countryMessages]
  );

  const [companyName, setCompanyName] = useState("");
  const [country, setCountry] = useState("");
  const [subsidiary, setSubsidiary] = useState("");

  const [pipedriveLink, setPipedriveLink] = useState("");
  const [pipedriveDealId, setPipedriveDealId] = useState<string>("");
  const [pipedriveMode, setPipedriveMode] = useState<PipedriveSyncMode>("sync");

  const resolveProposalActionError = React.useCallback(
    (error: ProposalError) =>
      error.kind === "message" ? error.message : proposalErrorsT(error.code),
    [proposalErrorsT]
  );

  const resolveProposalErrorMessage = React.useCallback(
    (error: unknown, fallbackCode: ProposalErrorCode) => {
      if (isProposalError(error)) {
        return resolveProposalActionError(error);
      }
      if (error instanceof Error && error.message) {
        return error.message;
      }
      return proposalErrorsT(fallbackCode);
    },
    [proposalErrorsT, resolveProposalActionError]
  );

  const handleCatalogError = React.useCallback(
    (error: ProposalError) => {
      toast.error(resolveProposalActionError(error));
    },
    [resolveProposalActionError]
  );

  const { items, setItems, mutateItems, popularity, loading: catalogLoading } = useCatalogData(
    locale,
    handleCatalogError
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [sortKey, setSortKey] = useState<SortKey>("popular");
  const [sortDir] = useState<SortDir>("desc");

  const handlePipedriveChange = React.useCallback((next: string) => {
    setPipedriveLink(next);
    setPipedriveDealId(extractDealIdFromLink(next) ?? "");
  }, []);

  const handlePipedriveModeChange = React.useCallback((mode: PipedriveSyncMode) => {
    setPipedriveMode(mode);
    if (mode !== "sync") {
      setPipedriveLink("");
      setPipedriveDealId("");
    }
  }, []);

  const handleCountryChange = React.useCallback((value: string) => {
    setCountry(value);
    setSubsidiary(autoSubsidiaryForCountry(value));
  }, []);

  const handleCategoryChange = React.useCallback((value: string) => {
    setCategoryFilter(value);
  }, []);

  const handleSearchChange = React.useCallback((value: string) => {
    setSearchTerm(value);
  }, []);

  const handleSortChange = React.useCallback((value: string) => {
    setSortKey(value as SortKey);
  }, []);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, categoryFilter, sortKey, sortDir]);

  const {
    filiales,
    load: loadFiliales,
    addFilial,
    editFilialTitle,
    removeFilial,
    addCountry,
    editCountry,
    removeCountry,
  } = useFiliales();

  const { glossary, load: loadGlossary, addLink, editLink, removeLink } = useGlossary();

  useEffect(() => {
    loadFiliales().then((result) => {
      if (!result.ok) {
        toast.error(resolveProposalActionError(result.error));
      }
    });
    loadGlossary().then((result) => {
      if (!result.ok) {
        toast.error(resolveProposalActionError(result.error));
      }
    });
  }, [loadFiliales, loadGlossary, resolveProposalActionError]);

  const [openSummary, setOpenSummary] = useState(false);
  const [creatingDoc, setCreatingDoc] = useState(false);

  const [createdUrl, setCreatedUrl] = useState<string | null>(null);
  const [showCreated, setShowCreated] = useState(false);

  const [itemFormOpen, setItemFormOpen] = useState(false);
  const [itemFormMode, setItemFormMode] = useState<"create" | "edit">("create");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingInitial, setEditingInitial] =
    useState<ItemFormData | undefined>(undefined);

  const {
    state: whatsappModalState,
    start: openWhatsAppModal,
    updateForm: updateWhatsAppForm,
    close: closeWhatsAppModal,
    submit: submitWhatsAppModal,
  } = useWhatsAppModal({ resolveErrorMessage: resolveProposalErrorMessage });

  const {
    state: minutesModalState,
    start: openMinutesModal,
    updateForm: updateMinutesForm,
    close: closeMinutesModal,
    submit: submitMinutesModal,
  } = useMinutesModal({ resolveErrorMessage: resolveProposalErrorMessage });

  const {
    state: wiserModalState,
    start: openWiserModal,
    close: closeWiserModal,
    confirm: confirmWiserModal,
  } = useWiserModal();

  const normalizedItems = useMemo(
    () =>
      items.map((it) => ({
        original: it,
        normalizedName: normalizeSearchText(it.name),
        normalizedDescription: normalizeSearchText(it.description),
        normalizedSku: normalizeSearchText(it.sku),
      })),
    [items]
  );

  const normalizedQuery = useMemo(
    () => normalizeSearchText(searchTerm),
    [searchTerm]
  );

  const filteredEntries = useMemo(
    () =>
      normalizedItems.filter((entry) => {
        const matchesText =
          !normalizedQuery ||
          entry.normalizedName.includes(normalizedQuery) ||
          entry.normalizedDescription.includes(normalizedQuery) ||
          entry.normalizedSku.includes(normalizedQuery);
        const matchesCat =
          !categoryFilter || entry.original.category === categoryFilter;
        return matchesText && matchesCat;
      }),
    [normalizedItems, normalizedQuery, categoryFilter]
  );

  const filtered = useMemo(
    () => filteredEntries.map((entry) => entry.original),
    [filteredEntries]
  );

  const ordered = useMemo(() => {
    const arr = [...filtered];
    const dir = sortDir === "asc" ? 1 : -1;
    arr.sort((a, b) => {
      switch (sortKey) {
        case "sku":
          return a.sku.localeCompare(b.sku) * dir;
        case "unitPrice":
          return (a.unitPrice - b.unitPrice) * dir;
        case "name":
          return a.name.localeCompare(b.name) * dir;
        case "category":
          return a.category.localeCompare(b.category) * dir;
        case "popular":
        default: {
          const pa = popularity[a.dbId ?? a.id] ?? 0;
          const pb = popularity[b.dbId ?? b.id] ?? 0;
          return (pa - pb) * -1;
        }
      }
    });
    return arr;
  }, [filtered, sortKey, sortDir, popularity]);

  const { selectedItems, totalAmount, totalHours } = useProposalTotals(items);
  const estimatedOneShot = Math.max(0, Math.round(totalHours * ONE_SHOT_RATE));

  const openCreateForm = React.useCallback(() => {
    setItemFormMode("create");
    setEditingId(null);
    setEditingInitial({
      sku: "",
      devHours: 1,
      unitPrice: 100,
      translations: Object.fromEntries(
        locales.map((code) => [code, { name: "", description: "", category: "" }])
      ) as ItemFormData["translations"],
    });
    setItemFormOpen(true);
  }, []);

  const openEditForm = React.useCallback((it: UIItem) => {
    setItemFormMode("edit");
    setEditingId(it.id);
    setEditingInitial({
      sku: it.sku,
      devHours: it.devHours,
      unitPrice: it.unitPrice,
      translations: it.translations,
    });
    setItemFormOpen(true);
  }, []);

  const handleSaveItem = React.useCallback(
    async (data: ItemFormData) => {
      try {
        if (itemFormMode === "create") {
          const created = await createCatalogItem(locale, data);
          mutateItems((prev) => [created, ...prev]);
          toast.success(toastT("itemCreated"));
        } else if (itemFormMode === "edit" && editingId != null) {
          const current = items.find((i) => i.id === editingId);
          if (current?.dbId) {
            await updateCatalogItem(current.dbId, data);
            mutateItems((prev) =>
              prev.map((item) =>
                item.id === editingId
                  ? {
                      ...item,
                      sku: data.sku?.trim() || item.sku,
                      devHours: data.devHours,
                      unitPrice: data.unitPrice,
                      translations: data.translations,
                      name: data.translations[locale].name,
                      description: data.translations[locale].description,
                      category:
                        data.translations[locale]?.category ??
                        data.translations[defaultLocale].category,
                    }
                  : item
              )
            );
            toast.success(toastT("itemUpdated"));
          }
        }
      } catch (e) {
        const fallback: ProposalErrorCode =
          itemFormMode === "create"
            ? "catalog.createFailed"
            : "catalog.updateFailed";
        const msg = resolveProposalErrorMessage(e, fallback);
        toast.error(toastT("itemSaveError", { message: msg }));
      } finally {
        setItemFormOpen(false);
      }
    },
    [
      editingId,
      itemFormMode,
      items,
      locale,
      mutateItems,
      resolveProposalErrorMessage,
      toastT,
    ]
  );

  const generate = React.useCallback(() => {
    if (catalogLoading) return;
    if (selectedItems.length === 0) {
      toast.info(toastT("selectItems"));
      return;
    }
    if (!companyName || !country || !subsidiary) {
      toast.info(toastT("fillCompany"));
      return;
    }
    if (pipedriveMode === "create") {
      toast.error(pipedriveT("notAvailable"));
      return;
    }

    if (pipedriveMode === "sync") {
      const id = extractDealIdFromLink(pipedriveLink);
      if (!pipedriveLink || !id) {
        toast.error(toastT("pipedriveLinkRequired", { example: pipedriveExample }));
        return;
      }
      setPipedriveDealId(id);
    } else {
      setPipedriveDealId("");
    }
    setOpenSummary(true);
  }, [
    catalogLoading,
    selectedItems,
    toastT,
    companyName,
    country,
    subsidiary,
    pipedriveMode,
    pipedriveLink,
    pipedriveExample,
    pipedriveT,
    setPipedriveDealId,
    setOpenSummary,
  ]);

  const [confirmReset, setConfirmReset] = useState(false);

  const doReset = React.useCallback(() => {
    setCompanyName("");
    setCountry("");
    setSubsidiary("");
    setPipedriveLink("");
    setPipedriveDealId("");
    setPipedriveMode("sync");
    setSearchTerm("");
    setCategoryFilter("");
    setPage(1);
    setItems((prev) =>
      prev.map((i) => ({ ...i, selected: false, quantity: 1, discountPct: 0 }))
    );
    setOpenSummary(false);
    toast.info(toastT("reset"));
  }, [setItems, toastT]);

  const idToDbId = useMemo(() => {
    const m = new Map<string, string>();
    for (const it of items) {
      m.set(it.id, it.dbId ?? it.id);
    }
    return m;
  }, [items]);

  const finalizeProposal = React.useCallback(async () => {
    setCreatingDoc(true);
    try {
      const requestItems = selectedItems.map((it) => {
        const dbId = idToDbId.get(it.id);
        if (!dbId) {
          throw new Error(errorsT("missingItemDbId", { id: it.id }));
        }
        const unitNet =
          it.unitNet !== undefined
            ? it.unitNet
            : computeUnitNet(it.unitPrice, it.discountPct);
        return {
          itemId: dbId,
          sku: it.sku,
          name: it.name,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          unitNet,
          devHours: it.devHours,
        };
      });

      const createPayload: CreateProposalPayload = {
        companyName,
        country,
        countryId: countryIdFromName(country),
        subsidiary,
        subsidiaryId: subsidiaryIdFromName(subsidiary),
        totals: {
          monthly: totalAmount,
          hours: totalHours,
          oneShot: estimatedOneShot,
        },
        items: requestItems,
        pipedrive:
          pipedriveMode === "sync" && (pipedriveLink || pipedriveDealId)
            ? {
                link: pipedriveLink || undefined,
                dealId: pipedriveDealId || undefined,
              }
            : undefined,
        userId,
        userEmail,
      };

      const creation = await createProposal(createPayload);
      const createdProposal = creation.proposal;
      const docUrl = creation.doc?.url ?? createdProposal.docUrl ?? "";
      const docId = creation.doc?.id ?? createdProposal.docId ?? undefined;
      if (!docUrl) {
        throw new Error(errorsT("missingDocumentUrl"));
      }
      const hourlyRate = creation.meta?.hourlyRate ?? 50;
      const rawOneShot = (createdProposal as { oneShot?: unknown }).oneShot;
      const proposalOneShot = Number(
        typeof rawOneShot === "undefined"
          ? Math.round(totalHours * hourlyRate)
          : rawOneShot
      );

      try {
        if (pipedriveDealId) {
          const pipedriveItems = selectedItems
            .map((i) => ({
              sku: i.sku,
              quantity: Number(i.quantity) || 0,
              unitNet:
                i.unitNet !== undefined
                  ? Number(i.unitNet)
                  : Number(computeUnitNet(i.unitPrice, i.discountPct)),
            }))
            .filter((l) => l.sku && l.quantity > 0);

          if (pipedriveItems.length > 0 && docUrl) {
            console.log("[sync] items ->", {
              len: pipedriveItems.length,
              sample: pipedriveItems.slice(0, 3),
            });

            const syncRes = await fetch("/api/pipedrive/sync", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                dealId: pipedriveDealId,
                proposalUrl: docUrl,
                oneShot: proposalOneShot,
                items: pipedriveItems,
                docId,
              }),
            });

            const syncJson = await syncRes.json().catch(() => ({}));
            if (!syncRes.ok) {
              console.error("Pipedrive sync error:", syncJson);
              toast.error(toastT("pipedriveSyncFailed"));
            } else {
              toast.success(toastT("pipedriveSyncSuccess"));
            }
          }
        }
      } catch (err) {
        console.error(err);
        toast.error(toastT("pipedriveSyncUnavailable"));
      }

      setOpenSummary(false);
      setCreatedUrl(createdProposal.docUrl ?? docUrl);
      setShowCreated(true);
      toast.success(toastT("proposalCreated"));
      if (createdProposal?.id) {
        onSaved(createdProposal.id);
      }
    } catch (e) {
      const msg = resolveProposalErrorMessage(e, "proposal.saveFailed");
      toast.error(toastT("proposalCreationError", { message: msg }));
    } finally {
      setCreatingDoc(false);
    }
  }, [
    companyName,
    country,
    subsidiary,
    errorsT,
    idToDbId,
    pipedriveDealId,
    pipedriveLink,
    pipedriveMode,
    resolveProposalErrorMessage,
    selectedItems,
    setOpenSummary,
    setCreatedUrl,
    setShowCreated,
    toastT,
    totalAmount,
    totalHours,
    estimatedOneShot,
    userEmail,
    userId,
    onSaved
  ]);

  const applyWhatsApp = React.useCallback(async () => {
    try {
      const result = await submitWhatsAppModal({ subsidiary, country });
      if (!result) return;
      const { itemId, pricing } = result;
      setItems((prev) =>
        prev.map((i) =>
          i.id === itemId
            ? {
                ...i,
                selected: true,
                quantity: pricing.totalQty,
                unitPrice: pricing.unitPrice,
                devHours: 0,
                discountPct: 0,
              }
            : i
        )
      );
      toast.success(toastT("whatsAppApplied"));
    } catch (message) {
      if (message) {
        toast.error(String(message));
      }
    }
  }, [country, setItems, submitWhatsAppModal, subsidiary, toastT]);

  const applyMinutes = React.useCallback(async () => {
    try {
      const result = await submitMinutesModal({ subsidiary, country });
      if (!result) return;
      const { itemId, pricing } = result;
      setItems((prev) =>
        prev.map((i) =>
          i.id === itemId
            ? {
                ...i,
                selected: true,
                quantity: pricing.totalQty,
                unitPrice: pricing.unitPrice,
                devHours: 0,
                discountPct: 0,
              }
            : i
        )
      );
      toast.success(toastT("minutesApplied"));
    } catch (message) {
      if (message) {
        toast.error(String(message));
      }
    }
  }, [country, setItems, submitMinutesModal, subsidiary, toastT]);

  const applyWiser = React.useCallback(() => {
    const itemId = confirmWiserModal();
    if (!itemId) return;
    setItems((prev) =>
      prev.map((i) =>
        i.id === itemId
          ? {
              ...i,
              selected: true,
              quantity: 1,
              unitPrice: 0,
              devHours: 0,
              discountPct: 0,
            }
          : i
      )
    );
    toast.success(toastT("wiserApplied"));
  }, [confirmWiserModal, setItems, toastT]);

  const handleToggleItem = React.useCallback(
    (item: UIItem, checked: boolean) => {
      if (!checked) {
        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, selected: false } : i))
        );
        return;
      }
      if (isWppUtility(item.name) || isWppMarketing(item.name) || isWppAuth(item.name)) {
        const nextKind: WppKind = isWppUtility(item.name)
          ? "utility"
          : isWppMarketing(item.name)
          ? "marketing"
          : "auth";
        openWhatsAppModal(item.id, nextKind, country || "");
        return;
      }
      if (isMinutesOut(item.name) || isMinutesIn(item.name)) {
        const nextKind: MinutesKind = isMinutesOut(item.name) ? "out" : "in";
        openMinutesModal(item.id, nextKind, country || "");
        return;
      }
      if (isWiserPro(item.name)) {
        openWiserModal(item.id);
        return;
      }
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, selected: true } : i))
      );
    },
    [country, openMinutesModal, openWhatsAppModal, openWiserModal, setItems]
  );

  const onDeleteItem = React.useCallback(
    async (itemId: string) => {
      const target = items.find((i) => i.id === itemId);
      if (!target) return;
      try {
        if (target.dbId) await deleteCatalogItem(target.dbId);
        mutateItems((prev) => prev.filter((i) => i.id !== itemId));
        toast.success(toastT("itemDeleted"));
      } catch (e) {
        const msg = resolveProposalErrorMessage(e, "catalog.deleteFailed");
        toast.error(toastT("itemDeleteError", { message: msg }));
      }
    },
    [items, mutateItems, resolveProposalErrorMessage, toastT]
  );

  const availableCategories = useMemo(
    () => Array.from(new Set(items.map((i) => i.category))).sort(),
    [items]
  );

  const existingSkus = useMemo(
    () => items.map((i) => i.sku).filter(Boolean),
    [items]
  );

  const handleQuantityChange = React.useCallback(
    (itemId: string, qty: number) => {
      setItems((prev) =>
        prev.map((i) => (i.id === itemId ? { ...i, quantity: qty } : i))
      );
    },
    [setItems]
  );

  const handleDiscountChange = React.useCallback(
    (itemId: string, pct: number) => {
      setItems((prev) =>
        prev.map((i) =>
          i.id === itemId
            ? {
                ...i,
                discountPct: Math.max(0, Math.min(100, Number(pct) || 0)),
              }
            : i
        )
      );
    },
    [setItems]
  );

  const handlePageSizeChange = React.useCallback(
    (next: number) => {
      setPageSize(next);
      setPage(1);
    },
    []
  );

  const changePage = React.useCallback((next: number) => {
    setPage(next);
  }, []);

  const requestReset = React.useCallback(() => {
    setConfirmReset(true);
  }, []);

  const closeItemForm = React.useCallback(() => {
    setItemFormOpen(false);
  }, []);

  const summaryState: SummaryState = {
    open: openSummary,
    creating: creatingDoc,
    onClose: () => setOpenSummary(false),
    onGenerate: finalizeProposal,
    companyName,
    country,
    subsidiary,
    selectedItems,
    totalHours,
    totalAmount,
    oneShot: estimatedOneShot,
  };

  const confirmResetState: ConfirmResetState = {
    open: confirmReset,
    title: confirmResetT("title"),
    message: confirmResetT("message"),
    confirmLabel: confirmResetT("confirm"),
    cancelLabel: confirmResetT("cancel"),
    onCancel: () => setConfirmReset(false),
    onConfirm: () => {
      setConfirmReset(false);
      doReset();
    },
  };

  const whatsappState: WhatsAppState = {
    open: whatsappModalState.open,
    kind: whatsappModalState.kind,
    form: whatsappModalState.form,
    billingSubsidiary: subsidiary,
    onChange: updateWhatsAppForm,
    onApply: applyWhatsApp,
    onClose: closeWhatsAppModal,
    error: whatsappModalState.error,
    applying: whatsappModalState.applying,
  };

  const minutesState: MinutesState = {
    open: minutesModalState.open,
    kind: minutesModalState.kind,
    form: minutesModalState.form,
    billingSubsidiary: subsidiary,
    onChange: updateMinutesForm,
    onApply: applyMinutes,
    onClose: closeMinutesModal,
    error: minutesModalState.error,
    applying: minutesModalState.applying,
  };

  const wiserState: WiserState = {
    open: wiserModalState.open,
    onConfirm: applyWiser,
    onClose: closeWiserModal,
  };

  const itemFormState: ItemFormState | undefined = isAdmin
    ? {
        open: itemFormOpen,
        mode: itemFormMode,
        initial: editingInitial,
        onClose: closeItemForm,
        onSave: handleSaveItem,
        existingSkus,
      }
    : undefined;

  const proposalCreatedState: ProposalCreatedState = {
    open: showCreated && !!createdUrl,
    url: createdUrl ?? "",
    onClose: () => setShowCreated(false),
  };

  const itemsTableProps = useMemo<GeneratorMainCardProps["itemsTable"]>(
    () => ({
      items: ordered,
      isAdmin,
      showSku: canViewSku,
      onToggle: handleToggleItem,
      onChangeQty: handleQuantityChange,
      onChangeDiscountPct: handleDiscountChange,
      onEdit: openEditForm,
      onDelete: onDeleteItem,
      page,
      pageSize,
      onPageChange: changePage,
      onPageSizeChange: handlePageSizeChange,
      locale: locale as Locale,
    }),
    [
      ordered,
      isAdmin,
      canViewSku,
      handleToggleItem,
      handleQuantityChange,
      handleDiscountChange,
      openEditForm,
      onDeleteItem,
      page,
      pageSize,
      changePage,
      handlePageSizeChange,
      locale,
    ]
  );

  const mainCardProps = useMemo<GeneratorMainCardProps>(
    () => ({
      heading: generatorT("heading"),
      pipedrive: {
        value: pipedriveLink,
        dealId: pipedriveDealId,
        example: pipedriveExample,
        onChange: handlePipedriveChange,
        mode: pipedriveMode,
        onModeChange: handlePipedriveModeChange,
        t: pipedriveT,
      },
      company: {
        companyName,
        onCompanyNameChange: setCompanyName,
        country,
        onCountryChange: handleCountryChange,
        subsidiary,
        emptyValue,
        countryOptions,
        t: companyT,
      },
      toolbar: {
        isAdmin,
        categoryFilter,
        onCategoryChange: handleCategoryChange,
        searchTerm,
        onSearchTermChange: handleSearchChange,
        sortKey,
        onSortChange: handleSortChange,
        onAddItem: openCreateForm,
        onGenerate: generate,
        onReset: requestReset,
        disabled: catalogLoading || pipedriveMode === "create",
        actionsT,
        filtersT,
        orderT,
        availableCategories,
        resetTitle: confirmResetT("title"),
      },
      itemsTable: itemsTableProps,
      totals: {
        label: totalsT("monthly"),
        amount: totalAmount,
      },
    }),
    [
      actionsT,
      availableCategories,
      catalogLoading,
      categoryFilter,
      companyName,
      companyT,
      countryOptions,
      confirmResetT,
      country,
      emptyValue,
      filtersT,
      generate,
      generatorT,
      handleCategoryChange,
      handleCountryChange,
      handlePipedriveChange,
      handlePipedriveModeChange,
      handleSearchChange,
      handleSortChange,
      isAdmin,
      itemsTableProps,
      openCreateForm,
      orderT,
      pipedriveDealId,
      pipedriveExample,
      pipedriveLink,
      pipedriveMode,
      pipedriveT,
      requestReset,
      searchTerm,
      setCompanyName,
      sortKey,
      subsidiary,
      totalsT,
      totalAmount,
    ]
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-slate-50 p-6">
      <div className="mx-auto max-w-[1800px]">
        <div className="grid grid-cols-1 xl:grid-cols-[300px_minmax(0,1fr)_300px] gap-6">
          <aside className="hidden xl:block">
            <div className="space-y-6">
              <GlossarySidebar
                isAdmin={isAdmin}
                glossary={glossary}
                addLink={addLink}
                editLink={editLink}
                removeLink={removeLink}
              />
              <FilialesSidebar
                isAdmin={isAdmin}
                filiales={filiales}
                addFilial={addFilial}
                editFilialTitle={editFilialTitle}
                removeFilial={removeFilial}
                addCountry={addCountry}
                editCountry={editCountry}
                removeCountry={removeCountry}
              />
            </div>
          </aside>

          <section className="space-y-6">
            <GeneratorMainCard {...mainCardProps} />

            <GeneratorModalStack
              summary={summaryState}
              confirmReset={confirmResetState}
              whatsapp={whatsappState}
              minutes={minutesState}
              wiser={wiserState}
              itemForm={itemFormState}
              showItemForm={isAdmin}
              proposalCreated={proposalCreatedState}
            />
          </section>

          <aside className="hidden xl:block">
            <WhatsAppCalculatorCard
              subsidiary={subsidiary}
              defaultCountry={country}
              resolveErrorMessage={resolveProposalErrorMessage}
            />
          </aside>
        </div>
      </div>
    </div>
  );
}
