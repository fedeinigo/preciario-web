"use client";

import { useEffect } from "react";

export default function MapacheThemeToggle() {
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.classList.add("mapache-theme");

    return () => {
      document.body.classList.remove("mapache-theme");
    };
  }, []);

  return null;
}
