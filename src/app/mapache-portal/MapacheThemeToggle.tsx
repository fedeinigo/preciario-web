"use client";

import { useEffect } from "react";

export default function MapacheThemeToggle() {
  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    const body = document.body;

    root.classList.add("mapache-theme");
    body.classList.add("mapache-theme");

    return () => {
      root.classList.remove("mapache-theme");
      body.classList.remove("mapache-theme");
    };
  }, []);

  return null;
}
