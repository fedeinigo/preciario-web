// src/app/components/ui/toast.ts
type ToastType = "info" | "success" | "error";
type ToastOptions =
  | number
  | {
      type?: ToastType;
      duration?: number;
    };

type ToastBaseFn = (message: string, opts?: ToastOptions) => void;
type ToastSideFn = (message: string, opts?: Omit<ToastOptions, "type"> | number) => void;

type ToastApi = ToastBaseFn & {
  info: ToastSideFn;
  success: ToastSideFn;
  error: ToastSideFn;
};

function resolveOptions(opts?: ToastOptions): { type: ToastType; duration: number } {
  if (typeof opts === "number") return { type: "info", duration: opts };
  return { type: opts?.type ?? "info", duration: opts?.duration ?? 3500 };
}

function createToastEl(message: string, type: ToastType) {
  const el = document.createElement("div");
  const base =
    "pointer-events-auto select-none rounded-md border px-3 py-2 text-[13px] shadow-soft " +
    "animate-[toast-in_160ms_ease-out] will-change-transform flex items-start gap-2";

  const byType: Record<ToastType, string> = {
    info: "bg-white text-slate-800 border-slate-200",
    success: "bg-white text-emerald-800 border-emerald-200",
    error: "bg-white text-rose-800 border-rose-200",
  };

  const iconByType: Record<ToastType, string> = {
    info: "ℹ️",
    success: "✅",
    error: "⚠️",
  };

  el.className = `${base} ${byType[type]}`;

  const icon = document.createElement("span");
  icon.textContent = iconByType[type] ?? "";
  icon.setAttribute("aria-hidden", "true");
  icon.className = "mt-[1px]";

  const text = document.createElement("div");
  text.textContent = message;

  el.appendChild(icon);
  el.appendChild(text);
  return el;
}

function ensureRoot(): HTMLElement | null {
  if (typeof window === "undefined") return null;
  let root = document.getElementById("toast-root");
  if (!root) {
    root = document.createElement("div");
    root.id = "toast-root";
    root.className = "pointer-events-none fixed top-4 right-4 z-[99999] flex flex-col gap-2";
    document.body.appendChild(root);
  }
  return root;
}

const baseToast: ToastBaseFn = (message, opts) => {
  if (typeof window === "undefined") return;
  const root = ensureRoot();
  if (!root) return;

  const { type, duration } = resolveOptions(opts);
  const el = createToastEl(message, type);
  root.appendChild(el);

  const remove = () => {
    el.style.animation = "toast-out 140ms ease-in forwards";
    window.setTimeout(() => el.remove(), 140);
  };
  window.setTimeout(remove, duration);
};

export const toast: ToastApi = Object.assign(baseToast, {
  info: (m: string, msOrOpts?: Omit<ToastOptions, "type"> | number) =>
    baseToast(m, typeof msOrOpts === "number" ? { duration: msOrOpts, type: "info" } : { ...(msOrOpts ?? {}), type: "info" }),
  success: (m: string, msOrOpts?: Omit<ToastOptions, "type"> | number) =>
    baseToast(m, typeof msOrOpts === "number" ? { duration: msOrOpts, type: "success" } : { ...(msOrOpts ?? {}), type: "success" }),
  error: (m: string, msOrOpts?: Omit<ToastOptions, "type"> | number) =>
    baseToast(m, typeof msOrOpts === "number" ? { duration: msOrOpts, type: "error" } : { ...(msOrOpts ?? {}), type: "error" }),
});

/* Animaciones (inyectamos una sola vez) */
(() => {
  if (typeof window === "undefined") return;
  const id = "toast-keyframes";
  if (document.getElementById(id)) return;
  const style = document.createElement("style");
  style.id = id;
  style.textContent = `
@keyframes toast-in { from { transform: translateY(-8px) scale(.98); opacity:.0 } to { transform:none; opacity:1 } }
@keyframes toast-out { to { transform: translateY(-6px) scale(.98); opacity:0 } }
`;
  document.head.appendChild(style);
})();
