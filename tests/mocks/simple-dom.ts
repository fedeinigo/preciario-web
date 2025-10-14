/* eslint-disable @typescript-eslint/no-explicit-any */

type EventListener = (event: SimpleEvent) => void;

type ListenerEntry = {
  type: string;
  listener: EventListener;
  options?: { capture?: boolean };
};

class SimpleEvent {
  readonly type: string;
  readonly bubbles: boolean;
  readonly cancelable: boolean;
  target: SimpleNode | null = null;
  currentTarget: SimpleNode | null = null;
  defaultPrevented = false;
  propagationStopped = false;
  submitter: SimpleElement | null = null;

  constructor(type: string, options: { bubbles?: boolean; cancelable?: boolean } = {}) {
    this.type = type;
    this.bubbles = options.bubbles ?? false;
    this.cancelable = options.cancelable ?? false;
  }

  stopPropagation() {
    this.propagationStopped = true;
  }

  preventDefault() {
    if (this.cancelable) {
      this.defaultPrevented = true;
    }
  }
}

class SimpleCustomEvent<T = unknown> extends SimpleEvent {
  readonly detail: T;

  constructor(type: string, detail: T, options: { bubbles?: boolean; cancelable?: boolean } = {}) {
    super(type, options);
    this.detail = detail;
  }
}

class SimpleMouseEvent extends SimpleEvent {
  constructor(type: string, options: { bubbles?: boolean; cancelable?: boolean } = {}) {
    super(type, { bubbles: true, cancelable: options.cancelable ?? true });
  }
}

class SimpleKeyboardEvent extends SimpleEvent {
  readonly key: string;
  readonly shiftKey: boolean;

  constructor(type: string, options: { key?: string; shiftKey?: boolean; bubbles?: boolean } = {}) {
    super(type, { bubbles: true, cancelable: true });
    this.key = options.key ?? "";
    this.shiftKey = options.shiftKey ?? false;
  }
}

class SimpleClassList {
  private readonly element: SimpleElement;

  constructor(element: SimpleElement) {
    this.element = element;
  }

  private get classes(): Set<string> {
    const attr = this.element.getAttribute("class");
    if (!attr) {
      return new Set();
    }
    return new Set(attr.split(/\s+/).filter(Boolean));
  }

  private commit(next: Set<string>) {
    this.element.setAttribute("class", Array.from(next).join(" "));
  }

  add(...tokens: string[]) {
    const next = this.classes;
    tokens.forEach((token) => {
      if (token) next.add(token);
    });
    this.commit(next);
  }

  remove(...tokens: string[]) {
    const next = this.classes;
    tokens.forEach((token) => next.delete(token));
    this.commit(next);
  }

  toggle(token: string, force?: boolean) {
    const next = this.classes;
    if (force === true) {
      next.add(token);
      this.commit(next);
      return true;
    }
    if (force === false) {
      next.delete(token);
      this.commit(next);
      return false;
    }
    if (next.has(token)) {
      next.delete(token);
      this.commit(next);
      return false;
    }
    next.add(token);
    this.commit(next);
    return true;
  }

  contains(token: string) {
    return this.classes.has(token);
  }
}

class SimpleNode {
  nodeType: number;
  parentNode: SimpleNode | null = null;
  ownerDocument: SimpleDocument;
  childNodes: SimpleNode[] = [];
  listeners: ListenerEntry[] = [];

  constructor(nodeType: number, ownerDocument: SimpleDocument) {
    this.nodeType = nodeType;
    this.ownerDocument = ownerDocument;
  }

  get firstChild(): SimpleNode | null {
    return this.childNodes[0] ?? null;
  }

  get lastChild(): SimpleNode | null {
    return this.childNodes[this.childNodes.length - 1] ?? null;
  }

  get previousSibling(): SimpleNode | null {
    if (!this.parentNode) return null;
    const index = this.parentNode.childNodes.indexOf(this);
    if (index <= 0) return null;
    return this.parentNode.childNodes[index - 1] ?? null;
  }

  get nextSibling(): SimpleNode | null {
    if (!this.parentNode) return null;
    const index = this.parentNode.childNodes.indexOf(this);
    if (index === -1 || index >= this.parentNode.childNodes.length - 1) return null;
    return this.parentNode.childNodes[index + 1] ?? null;
  }

  appendChild<T extends SimpleNode>(node: T): T {
    if (node.parentNode) {
      node.parentNode.removeChild(node);
    }
    this.childNodes.push(node);
    node.parentNode = this;
    return node;
  }

  removeChild<T extends SimpleNode>(node: T): T {
    const index = this.childNodes.indexOf(node);
    if (index === -1) {
      throw new Error("The node to be removed is not a child of this node.");
    }
    this.childNodes.splice(index, 1);
    node.parentNode = null;
    return node;
  }

  remove() {
    if (this.parentNode) {
      this.parentNode.removeChild(this);
    }
  }

  insertBefore<T extends SimpleNode>(node: T, referenceNode: SimpleNode | null): T {
    if (referenceNode === null) {
      return this.appendChild(node);
    }
    const refIndex = this.childNodes.indexOf(referenceNode);
    if (refIndex === -1) {
      throw new Error("The node before which the new node is to be inserted is not a child of this node.");
    }
    if (node.parentNode) {
      node.parentNode.removeChild(node);
    }
    this.childNodes.splice(refIndex, 0, node);
    node.parentNode = this;
    return node;
  }

  contains(node: SimpleNode | null): boolean {
    if (!node) return false;
    if (node === this) return true;
    return this.childNodes.some((child) => child.contains(node));
  }

  get textContent(): string | undefined {
    if (this instanceof SimpleElement || this instanceof SimpleText) {
      return (this as unknown as { textContent: string }).textContent;
    }
    return undefined;
  }

  set textContent(_value: string | undefined) {
    // noop for base node; overridden in subclasses
  }

  cloneNode(deep = false): SimpleNode {
    if (this instanceof SimpleText) {
      return new SimpleText(this.data, this.ownerDocument);
    }
    if (this instanceof SimpleElement) {
      const clone = new SimpleElement(this.tagName, this.ownerDocument);
      this.attributes.forEach((value, key) => clone.setAttribute(key, value));
      clone.value = this.value;
      clone.checked = this.checked;
      if (this.tagName === "OPTION") {
        clone.selected = this.selected;
      }
      if (deep) {
        this.childNodes.forEach((child) => clone.appendChild(child.cloneNode(true)));
      }
      return clone;
    }
    const clone = new SimpleNode(this.nodeType, this.ownerDocument);
    if (deep) {
      this.childNodes.forEach((child) => clone.appendChild(child.cloneNode(true)));
    }
    return clone;
  }

  addEventListener(type: string, listener: EventListener, options?: { capture?: boolean }) {
    this.listeners.push({ type, listener, options });
  }

  removeEventListener(type: string, listener: EventListener) {
    this.listeners = this.listeners.filter(
      (entry) => !(entry.type === type && entry.listener === listener),
    );
  }

  dispatchEvent(event: SimpleEvent): boolean {
    event.target = event.target ?? this;

    const invokeListeners = (node: SimpleNode) => {
      const relevant = node.listeners.filter((entry) => entry.type === event.type);
      relevant.forEach((entry) => {
        event.currentTarget = node;
        entry.listener(event);
      });
    };

    const path: SimpleNode[] = [];
    let current: SimpleNode | null = this;
    while (current) {
      path.push(current);
      current = current.parentNode;
    }

    for (const node of path) {
      invokeListeners(node);
      if (event.propagationStopped) break;
    }

    return !event.defaultPrevented;
  }
}

class SimpleText extends SimpleNode {
  data: string;

  constructor(data: string, ownerDocument: SimpleDocument) {
    super(3, ownerDocument);
    this.data = data;
  }

  get textContent() {
    return this.data;
  }

  set textContent(value: string) {
    this.data = value;
  }

  get outerHTML() {
    return this.data;
  }
}

class SimpleStyleDeclaration {
  private readonly styles = new Map<string, string>();

  setProperty(property: string, value: string) {
    this.styles.set(property, value);
  }

  getPropertyValue(property: string) {
    return this.styles.get(property) ?? "";
  }

  removeProperty(property: string) {
    this.styles.delete(property);
  }

  toString() {
    return Array.from(this.styles.entries())
      .map(([key, value]) => `${key}: ${value}`)
      .join("; ");
  }
}

class SimpleElement extends SimpleNode {
  tagName: string;
  attributes = new Map<string, string>();
  style = new SimpleStyleDeclaration();
  classList = new SimpleClassList(this);
  private _value = "";
  private _selected = false;
  checked = false;
  disabled = false;
  private datasetCache: Record<string, string> | null = null;

  constructor(tagName: string, ownerDocument: SimpleDocument) {
    super(1, ownerDocument);
    this.tagName = tagName.toUpperCase();
  }

  get id(): string {
    return this.getAttribute("id") ?? "";
  }

  set id(value: string) {
    this.setAttribute("id", value);
  }

  get className(): string {
    return this.getAttribute("class") ?? "";
  }

  set className(value: string) {
    this.setAttribute("class", value);
  }

  setAttribute(name: string, value: string) {
    if (name === "value") {
      this.value = String(value);
      return;
    }
    if (name === "selected" && this.tagName === "OPTION") {
      this.selected = true;
      return;
    }
    this.attributes.set(name, String(value));
    if (name.startsWith("data-")) {
      this.datasetCache = null;
    }
  }

  getAttribute(name: string): string | null {
    const value = this.attributes.get(name);
    return value ?? null;
  }

  removeAttribute(name: string) {
    if (name === "value") {
      this._value = "";
    }
    if (name === "selected" && this.tagName === "OPTION") {
      this.selected = false;
      return;
    }
    this.attributes.delete(name);
    if (name.startsWith("data-")) {
      this.datasetCache = null;
    }
  }

  hasAttribute(name: string) {
    return this.attributes.has(name);
  }

  get dataset(): Record<string, string> {
    if (this.datasetCache) {
      return this.datasetCache;
    }
    const entries: Record<string, string> = {};
    this.attributes.forEach((value, key) => {
      if (key.startsWith("data-")) {
        const prop = key
          .slice(5)
          .split("-")
          .map((part, index) => (index === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)))
          .join("");
        entries[prop] = value;
      }
    });
    this.datasetCache = entries;
    return entries;
  }

  focus() {
    this.ownerDocument.activeElement = this;
  }

  blur() {
    if (this.ownerDocument.activeElement === this) {
      this.ownerDocument.activeElement = null;
    }
  }

  click() {
    const event = new SimpleMouseEvent("click", { bubbles: true });
    const shouldContinue = this.dispatchEvent(event);
    if (!shouldContinue) {
      return;
    }

    const tag = this.tagName;
    const typeAttr = (this.getAttribute("type") ?? (tag === "BUTTON" ? "submit" : "")).toLowerCase();
    const isButton = tag === "BUTTON";
    const isInput = tag === "INPUT";
    const normalizedType = typeAttr || (isButton ? "submit" : "");

    const triggersSubmit =
      (isButton && normalizedType !== "button" && normalizedType !== "reset" && normalizedType !== "menu") ||
      (isInput && (normalizedType === "submit" || normalizedType === "image"));

    if (!triggersSubmit) {
      return;
    }

    const formId = this.getAttribute("form");
    let form: SimpleElement | null = null;
    if (formId) {
      form = this.ownerDocument.getElementById(formId);
    }
    if (!form) {
      form = this.closest("form");
    }
    if (form && form.tagName === "FORM") {
      form.requestSubmit(this);
    }
  }

  submit() {
    if (this.tagName === "FORM") {
      this.requestSubmit();
    }
  }

  requestSubmit(submitter?: SimpleElement | null) {
    if (this.tagName !== "FORM") {
      const form = this.closest("form");
      if (form) {
        form.requestSubmit(submitter ?? this);
      }
      return;
    }
    const submitEvent = new SimpleEvent("submit", { bubbles: true, cancelable: true });
    submitEvent.submitter = submitter ?? null;
    this.dispatchEvent(submitEvent);
  }

  scrollIntoView() {
    // noop for test environment
  }

  get textContent(): string {
    return this.childNodes.map((child) => child.textContent ?? "").join("");
  }

  set textContent(value: string) {
    this.childNodes = [];
    if (value) {
      this.appendChild(new SimpleText(value, this.ownerDocument));
    }
    if (this.tagName === "OPTION" && !this.attributes.has("value")) {
      this._value = value;
    }
  }

  get innerHTML(): string {
    return this.childNodes
      .map((child) => {
        if (child instanceof SimpleText) {
          return child.data;
        }
        if (child instanceof SimpleElement) {
          return child.outerHTML;
        }
        return "";
      })
      .join("");
  }

  set innerHTML(value: string) {
    // Minimal implementation: treat as text content
    this.childNodes = [];
    if (value) {
      this.appendChild(new SimpleText(value, this.ownerDocument));
    }
  }

  get outerHTML(): string {
    const attrs = Array.from(this.attributes.entries())
      .map(([key, value]) => ` ${key}="${value}"`)
      .join("");
    const content = this.childNodes
      .map((child) => {
        if (child instanceof SimpleText) {
          return child.data;
        }
        if (child instanceof SimpleElement) {
          return child.outerHTML;
        }
        return "";
      })
      .join("");
    return `<${this.tagName.toLowerCase()}${attrs}>${content}</${this.tagName.toLowerCase()}>`;
  }

  get parentElement(): SimpleElement | null {
    return this.parentNode instanceof SimpleElement ? this.parentNode : null;
  }

  get value(): string {
    if (this.tagName === "OPTION" && !this.attributes.has("value")) {
      return this._value || this.textContent;
    }
    return this._value;
  }

  set value(next: string) {
    const stringValue = String(next);
    this._value = stringValue;
    if (this.tagName === "OPTION") {
      this.attributes.set("value", stringValue);
      const parent = this.parentElement;
      if (parent && parent.tagName === "SELECT" && this.selected) {
        parent._value = stringValue;
      }
    }
    if (this.tagName === "SELECT") {
      this.options.forEach((option) => {
        option.selected = option.value === stringValue;
      });
    }
  }

  get selected(): boolean {
    return this._selected;
  }

  set selected(next: boolean) {
    this._selected = next;
    if (this.tagName === "OPTION") {
      if (next) {
        this.attributes.set("selected", "");
        const parent = this.parentElement;
        if (parent && parent.tagName === "SELECT") {
          parent._value = this.value;
        }
      } else {
        this.attributes.delete("selected");
      }
    }
  }

  get options(): SimpleElement[] {
    if (this.tagName !== "SELECT") {
      return [];
    }
    return this.childNodes.filter(
      (child): child is SimpleElement => child instanceof SimpleElement && child.tagName === "OPTION",
    );
  }

  querySelectorAll(selector: string): SimpleElement[] {
    const selectors = selector.split(",").map((s) => s.trim()).filter(Boolean);
    const results: SimpleElement[] = [];

    const match = (element: SimpleElement, sel: string) => {
      if (sel.startsWith("#")) {
        return element.id === sel.slice(1);
      }
      if (sel.startsWith(".")) {
        return element.classList.contains(sel.slice(1));
      }
      const attrMatch = sel.match(/^\[(.+?)=['\"]?(.*?)['\"]?\]$/);
      if (attrMatch) {
        const [, attr, value] = attrMatch;
        return element.getAttribute(attr) === value;
      }
      return element.tagName.toLowerCase() === sel.toLowerCase();
    };

    const matchesSelector = (element: SimpleElement, sel: string) => match(element, sel);

    const visit = (node: SimpleNode) => {
      node.childNodes.forEach((child) => {
        if (child instanceof SimpleElement) {
          if (selectors.some((sel) => matchesSelector(child, sel))) {
            results.push(child);
          }
          visit(child);
        }
      });
    };

    visit(this);
    return results;
  }

  querySelector(selector: string): SimpleElement | null {
    return this.querySelectorAll(selector)[0] ?? null;
  }

  matches(selector: string): boolean {
    const selectors = selector.split(",").map((s) => s.trim()).filter(Boolean);
    return selectors.some((sel) => {
      if (sel.startsWith("#")) {
        return this.id === sel.slice(1);
      }
      if (sel.startsWith(".")) {
        return this.classList.contains(sel.slice(1));
      }
      const attrMatch = sel.match(/^\[(.+?)=['\"]?(.*?)['\"]?\]$/);
      if (attrMatch) {
        const [, attr, value] = attrMatch;
        return this.getAttribute(attr) === value;
      }
      return this.tagName.toLowerCase() === sel.toLowerCase();
    });
  }

  closest(selector: string): SimpleElement | null {
    let current: SimpleNode | null = this;
    while (current) {
      if (current instanceof SimpleElement && current.matches(selector)) {
        return current;
      }
      current = current.parentNode;
    }
    return null;
  }

  getElementsByTagName(tagName: string): SimpleElement[] {
    return this.querySelectorAll(tagName);
  }

  getElementsByClassName(className: string): SimpleElement[] {
    return this.querySelectorAll(`.${className}`);
  }
}

class SimpleDocument extends SimpleNode {
  documentElement: SimpleElement;
  body: SimpleElement;
  head: SimpleElement;
  activeElement: SimpleElement | null = null;
  defaultView: SimpleWindow | null = null;

  constructor() {
    super(9, undefined as unknown as SimpleDocument);
    this.ownerDocument = this;
    this.documentElement = new SimpleElement("html", this);
    this.head = new SimpleElement("head", this);
    this.body = new SimpleElement("body", this);
    this.documentElement.appendChild(this.head);
    this.documentElement.appendChild(this.body);
    this.appendChild(this.documentElement);
  }

  createElement(tagName: string): SimpleElement {
    return new SimpleElement(tagName, this);
  }

  createElementNS(_namespace: string, tagName: string): SimpleElement {
    return this.createElement(tagName);
  }

  createTextNode(data: string): SimpleText {
    return new SimpleText(data, this);
  }

  createDocumentFragment(): SimpleDocumentFragment {
    return new SimpleDocumentFragment(this);
  }

  getElementById(id: string): SimpleElement | null {
    const visit = (node: SimpleNode): SimpleElement | null => {
      for (const child of node.childNodes) {
        if (child instanceof SimpleElement) {
          if (child.id === id) {
            return child;
          }
          const match = visit(child);
          if (match) return match;
        }
      }
      return null;
    };
    return visit(this);
  }

  querySelector(selector: string): SimpleElement | null {
    return this.documentElement.querySelector(selector);
  }

  querySelectorAll(selector: string): SimpleElement[] {
    return this.documentElement.querySelectorAll(selector);
  }
}

class SimpleLocalStorage {
  private readonly store = new Map<string, string>();

  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null;
  }

  setItem(key: string, value: string) {
    this.store.set(key, String(value));
  }

  removeItem(key: string) {
    this.store.delete(key);
  }

  clear() {
    this.store.clear();
  }
}

class SimpleWindow {
  document: SimpleDocument;
  localStorage = new SimpleLocalStorage();
  private listeners: ListenerEntry[] = [];

  constructor(document: SimpleDocument) {
    this.document = document;
    document.defaultView = this;
  }

  addEventListener(type: string, listener: EventListener) {
    this.listeners.push({ type, listener });
  }

  removeEventListener(type: string, listener: EventListener) {
    this.listeners = this.listeners.filter(
      (entry) => !(entry.type === type && entry.listener === listener),
    );
  }

  dispatchEvent(event: SimpleEvent) {
    event.target = event.target ?? (this.document.body as unknown as SimpleNode);
    this.listeners
      .filter((entry) => entry.type === event.type)
      .forEach((entry) => {
        event.currentTarget = null;
        entry.listener(event);
      });
  }

  setTimeout(handler: (...args: unknown[]) => void, timeout = 0, ...args: unknown[]): NodeJS.Timeout {
    return setTimeout(handler, timeout, ...args);
  }

  clearTimeout(id: NodeJS.Timeout) {
    clearTimeout(id);
  }

  requestAnimationFrame(callback: (time: number) => void): NodeJS.Timeout {
    return this.setTimeout(() => callback(Date.now()), 16);
  }

  cancelAnimationFrame(id: NodeJS.Timeout) {
    this.clearTimeout(id);
  }

  getComputedStyle(_element: SimpleElement) {
    return {
      getPropertyValue: () => "",
    } as const;
  }
}

export function createDomEnvironment() {
  const document = new SimpleDocument();
  const window = new SimpleWindow(document);

  const globalTarget = globalThis as Record<string, unknown>;

  globalTarget.window = window;
  globalTarget.document = document;
  globalTarget.HTMLElement = SimpleElement;
  globalTarget.HTMLInputElement = SimpleElement;
  globalTarget.HTMLSelectElement = SimpleElement;
  globalTarget.HTMLTextAreaElement = SimpleElement;
  globalTarget.HTMLIFrameElement = SimpleElement;
  globalTarget.Node = SimpleNode;
  globalTarget.Text = SimpleText;
  globalTarget.Event = SimpleEvent;
  globalTarget.MouseEvent = SimpleMouseEvent;
  globalTarget.KeyboardEvent = SimpleKeyboardEvent;
  globalTarget.CustomEvent = SimpleCustomEvent;
  globalTarget.Document = SimpleDocument;
  globalTarget.requestAnimationFrame = window.requestAnimationFrame.bind(window);
  globalTarget.cancelAnimationFrame = window.cancelAnimationFrame.bind(window);
  globalTarget.getComputedStyle = window.getComputedStyle.bind(window);
  globalTarget.localStorage = window.localStorage;
  globalTarget.navigator = globalTarget.navigator ?? { userAgent: "node.js" };
  globalTarget.MutationObserver =
    globalTarget.MutationObserver ??
    class {
      constructor(public readonly callback: MutationCallback) {}
      observe() {}
      disconnect() {}
      takeRecords(): MutationRecord[] { return []; }
    };
  globalTarget.ResizeObserver =
    globalTarget.ResizeObserver ??
    class {
      constructor(public readonly callback: ResizeObserverCallback) {}
      observe() {}
      unobserve() {}
      disconnect() {}
    };

  const windowTarget = window as unknown as Record<string, unknown>;
  windowTarget.HTMLElement = SimpleElement;
  windowTarget.HTMLInputElement = SimpleElement;
  windowTarget.HTMLSelectElement = SimpleElement;
  windowTarget.HTMLTextAreaElement = SimpleElement;
  windowTarget.HTMLIFrameElement = SimpleElement;
  windowTarget.Node = SimpleNode;
  windowTarget.Text = SimpleText;
  windowTarget.Event = SimpleEvent;
  windowTarget.MouseEvent = SimpleMouseEvent;
  windowTarget.KeyboardEvent = SimpleKeyboardEvent;
  windowTarget.CustomEvent = SimpleCustomEvent;
  windowTarget.MutationObserver = globalTarget.MutationObserver;
  windowTarget.ResizeObserver = globalTarget.ResizeObserver;

  if (!SimpleElement.prototype.scrollIntoView) {
    SimpleElement.prototype.scrollIntoView = () => {};
  }

  return { window, document };
}

class SimpleDocumentFragment extends SimpleNode {
  constructor(ownerDocument: SimpleDocument) {
    super(11, ownerDocument);
  }
}

export { SimpleElement, SimpleEvent, SimpleDocumentFragment, SimpleNode, SimpleText };
