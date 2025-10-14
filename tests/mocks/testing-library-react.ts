// @ts-nocheck
import * as React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

import {
  SimpleEvent,
  SimpleElement,
  SimpleNode,
  createDomEnvironment,
} from "./simple-dom";

type QueryOptions = {
  name?: string | RegExp;
};

type Role = "button" | "dialog" | "textbox" | "option" | "heading" | "form" | "combobox" | "listbox" | "row" | "cell" | "table" | "presentation";

type RenderResult = {
  container: SimpleElement;
  unmount: () => void;
};

const mounted: Array<{ root: Root; container: SimpleElement }> = [];

function ensureDomReady() {
  if (typeof document === "undefined") {
    createDomEnvironment();
  }
}

function matchText(content: string, matcher: string | RegExp | undefined) {
  if (matcher === undefined) return true;
  if (typeof matcher === "string") {
    return content.trim() === matcher;
  }
  return matcher.test(content.trim());
}

function extractTextExcluding(node: SimpleNode, exclude: SimpleNode): string {
  if (node === exclude) {
    return "";
  }
  if (node instanceof SimpleElement) {
    return node.childNodes.map((child) => extractTextExcluding(child, exclude)).join("");
  }
  if ((node as SimpleTextLike).data !== undefined) {
    return (node as SimpleTextLike).data;
  }
  return "";
}

type SimpleTextLike = { data?: string };

function findLabelText(element: SimpleElement): string | null {
  const ownerDocument = element.ownerDocument;
  if (!ownerDocument) return null;

  // Explicit label via for attribute
  if (element.id) {
    const explicit = ownerDocument.querySelector(`label[for="${element.id}"]`);
    if (explicit instanceof SimpleElement) {
      return explicit.textContent.trim();
    }
  }

  // Implicit label wrapping the control
  let current = element.parentElement;
  while (current) {
    if (current.tagName === "LABEL") {
      return extractTextExcluding(current, element).trim();
    }
    current = current.parentElement;
  }

  return null;
}

function computeAccessibleName(element: SimpleElement): string {
  const ariaLabel = element.getAttribute("aria-label");
  if (ariaLabel) return ariaLabel;
  const labelledBy = element.getAttribute("aria-labelledby");
  if (labelledBy) {
    const label = labelledBy
      .split(/\s+/)
      .map((id) => document.getElementById(id)?.textContent ?? "")
      .join(" ");
    if (label.trim()) return label.trim();
  }
  const labelText = findLabelText(element);
  if (labelText) return labelText;
  return element.textContent.trim();
}

function roleMatches(element: SimpleElement, role: Role): boolean {
  const explicit = element.getAttribute("role");
  if (explicit) {
    return explicit.toLowerCase() === role;
  }

  switch (role) {
    case "button":
      return element.tagName === "BUTTON" || (element.tagName === "INPUT" && ["BUTTON", "SUBMIT"].includes((element.getAttribute("type") ?? "").toUpperCase()));
    case "dialog":
      return element.tagName === "DIALOG";
    case "textbox":
      return (
        (element.tagName === "INPUT" && (element.getAttribute("type") ?? "text").toLowerCase() === "text") ||
        element.tagName === "TEXTAREA"
      );
    case "option":
      return element.tagName === "OPTION";
    case "heading":
      return element.tagName.length === 2 && element.tagName.startsWith("H") && /[1-6]/.test(element.tagName[1]!);
    case "form":
      return element.tagName === "FORM";
    case "combobox":
      return element.tagName === "SELECT";
    case "listbox":
      return element.tagName === "UL" || element.tagName === "OL";
    case "row":
      return element.tagName === "TR";
    case "cell":
      return element.tagName === "TD" || element.tagName === "TH";
    case "table":
      return element.tagName === "TABLE";
    case "presentation":
      return element.tagName === "DIV";
    default:
      return false;
  }
}

function collectElements(root: SimpleElement): SimpleElement[] {
  const result: SimpleElement[] = [];
  const visit = (node: SimpleElement) => {
    result.push(node);
    node.childNodes.forEach((child) => {
      if (child instanceof SimpleElement) {
        visit(child);
      }
    });
  };
  visit(root);
  return result;
}

function filterByRole(root: SimpleElement, role: Role, options?: QueryOptions): SimpleElement[] {
  return collectElements(root).filter((element) => {
    if (!roleMatches(element, role)) return false;
    if (options?.name !== undefined) {
      return matchText(computeAccessibleName(element), options.name);
    }
    return true;
  });
}

function getByRole(root: SimpleElement, role: Role, options?: QueryOptions): SimpleElement {
  const matches = filterByRole(root, role, options);
  if (matches.length === 0) {
    throw new Error(`No element found with role ${role}`);
  }
  if (matches.length > 1) {
    throw new Error(`Multiple elements found with role ${role}`);
  }
  return matches[0]!;
}

function queryByRole(root: SimpleElement, role: Role, options?: QueryOptions): SimpleElement | null {
  const matches = filterByRole(root, role, options);
  if (matches.length === 0) return null;
  if (matches.length > 1) {
    throw new Error(`Multiple elements found with role ${role}`);
  }
  return matches[0] ?? null;
}

function getByText(root: SimpleElement, text: string | RegExp): SimpleElement {
  const matches = collectElements(root).filter((element) => matchText(element.textContent, text));
  if (matches.length === 0) {
    throw new Error(`No element found with text ${text}`);
  }
  return matches[0]!;
}

function resolveControlForLabel(label: SimpleElement): SimpleElement | null {
  const htmlFor = label.getAttribute("for");
  if (htmlFor) {
    const target = label.ownerDocument.getElementById(htmlFor);
    if (target instanceof SimpleElement) {
      return target;
    }
  }
  const control = label.querySelector("input,select,textarea,button");
  return control;
}

function getByLabelText(root: SimpleElement, text: string | RegExp): SimpleElement {
  const labels = collectElements(root).filter((element) => element.tagName === "LABEL");
  for (const label of labels) {
    const control = resolveControlForLabel(label);
    const labelText = control ? extractTextExcluding(label, control).trim() : label.textContent;
    if (control && matchText(labelText, text)) {
      return control;
    }
  }

  const labelledElements = collectElements(root).filter((element) => {
    const labelledBy = element.getAttribute("aria-labelledby");
    if (!labelledBy) return false;
    return labelledBy.split(/\s+/).some((id) => {
      const label = element.ownerDocument.getElementById(id);
      return label instanceof SimpleElement && matchText(label.textContent, text);
    });
  });

  if (labelledElements.length > 0) {
    return labelledElements[0]!;
  }

  throw new Error(`No element found with label text ${text}`);
}

function getByPlaceholderText(root: SimpleElement, text: string | RegExp): SimpleElement {
  const matches = collectElements(root).filter((element) => {
    const placeholder = element.getAttribute("placeholder");
    if (!placeholder) return false;
    return matchText(placeholder, text);
  });
  if (matches.length === 0) {
    throw new Error(`No element found with placeholder text ${text}`);
  }
  if (matches.length > 1) {
    throw new Error(`Multiple elements found with placeholder text ${text}`);
  }
  return matches[0]!;
}

function findBy<T>(queryFn: () => T, timeout = 2000): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const start = Date.now();
    function attempt() {
      try {
        const result = queryFn();
        resolve(result);
      } catch (error) {
        if (Date.now() - start >= timeout) {
          reject(error);
          return;
        }
        setTimeout(attempt, 20);
      }
    }
    attempt();
  });
}

export function waitFor(callback: () => void, timeout = 2000) {
  return findBy(() => {
    callback();
    return true;
  }, timeout);
}

export function render(element: React.ReactElement): RenderResult {
  ensureDomReady();
  const container = document.createElement("div") as unknown as SimpleElement;
  const body = document.body as unknown as SimpleElement;
  body.appendChild(container);
  const root = createRoot(container as unknown as HTMLElement);
  act(() => {
    root.render(element);
  });
  mounted.push({ root, container });
  return {
    container,
    unmount: () => {
      act(() => {
        root.unmount();
      });
      container.parentNode?.removeChild(container);
      const index = mounted.findIndex((entry) => entry.root === root);
      if (index !== -1) {
        mounted.splice(index, 1);
      }
    },
  };
}

export function cleanup() {
  while (mounted.length > 0) {
    const entry = mounted.pop();
    if (!entry) continue;
    act(() => {
      entry.root.unmount();
    });
    entry.container.parentNode?.removeChild(entry.container);
  }
  const body = document.body as unknown as SimpleElement;
  [...body.childNodes].forEach((child) => {
    if (child instanceof SimpleElement && child.tagName === "DIV") {
      child.parentNode?.removeChild(child);
    }
  });
}

function createWithin(root: SimpleElement) {
  return {
    getByRole: (role: Role, options?: QueryOptions) => getByRole(root, role, options),
    queryByRole: (role: Role, options?: QueryOptions) => queryByRole(root, role, options),
    findByRole: (role: Role, options?: QueryOptions) => findBy(() => getByRole(root, role, options)),
    getByText: (text: string | RegExp) => getByText(root, text),
    getByLabelText: (text: string | RegExp) => getByLabelText(root, text),
    findByLabelText: (text: string | RegExp) => findBy(() => getByLabelText(root, text)),
    getByPlaceholderText: (text: string | RegExp) => getByPlaceholderText(root, text),
    findByPlaceholderText: (text: string | RegExp) => findBy(() => getByPlaceholderText(root, text)),
  };
}

export const within = (element: SimpleElement) => createWithin(element);

const bodyElement = () => document.body as unknown as SimpleElement;

export const screen = createWithin(bodyElement()) as ReturnType<typeof createWithin> & {
  findByText: (text: string | RegExp) => Promise<SimpleElement>;
  findByRole: (role: Role, options?: QueryOptions) => Promise<SimpleElement>;
  queryByRole: (role: Role, options?: QueryOptions) => SimpleElement | null;
  findByLabelText: (text: string | RegExp) => Promise<SimpleElement>;
  findByPlaceholderText: (text: string | RegExp) => Promise<SimpleElement>;
};

screen.findByText = (text: string | RegExp) => findBy(() => getByText(bodyElement(), text));
screen.findByRole = (role: Role, options?: QueryOptions) => findBy(() => getByRole(bodyElement(), role, options));
screen.queryByRole = (role: Role, options?: QueryOptions) => queryByRole(bodyElement(), role, options);
screen.findByLabelText = (text: string | RegExp) => findBy(() => getByLabelText(bodyElement(), text));
screen.findByPlaceholderText = (text: string | RegExp) => findBy(() => getByPlaceholderText(bodyElement(), text));

class UserEventApi {
  async click(element: SimpleElement) {
    await act(async () => {
      if (typeof (element as any).click === "function") {
        (element as any).click();
        await Promise.resolve();
        return;
      }
      element.dispatchEvent(new SimpleEvent("click", { bubbles: true, cancelable: true }));
      await Promise.resolve();
    });
  }

  async type(element: SimpleElement & { value: string }, text: string) {
    await act(async () => {
      element.value = text;
      element.dispatchEvent(new SimpleEvent("input", { bubbles: true }));
      element.dispatchEvent(new SimpleEvent("change", { bubbles: true }));
    });
  }

  async selectOptions(element: SimpleElement & { value: string }, value: string) {
    await act(async () => {
      element.value = value;
      element.dispatchEvent(new SimpleEvent("change", { bubbles: true }));
    });
  }
}

export const userEvent = {
  setup() {
    return new UserEventApi();
  },
};

export { getByRole, getByText, queryByRole };
