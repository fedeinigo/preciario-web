// src/app/components/ui/toast.ts
export function toast(message: string, ms = 3500) {
  if (typeof window === "undefined") return;
  const root = document.getElementById("toast-root");
  if (!root) return;

  const el = document.createElement("div");
  el.className =
    "border shadow-soft bg-white px-3 py-2 rounded-sm text-[13px] text-slate-800";
  el.textContent = message;
  root.appendChild(el);

  const remove = () => el.remove();
  setTimeout(remove, ms);
}
