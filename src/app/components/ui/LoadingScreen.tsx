// src/app/components/ui/LoadingScreen.tsx
"use client";

export default function LoadingScreen() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-[60vh] items-center justify-center bg-white text-gray-700"
    >
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[rgb(var(--primary))] border-t-transparent" />
        <p className="text-sm font-medium">Cargando tu sesión…</p>
      </div>
    </div>
  );
}
