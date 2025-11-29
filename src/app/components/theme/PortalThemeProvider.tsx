"use client";

import { useEffect } from "react";

export type PortalType = "directo" | "mapache" | "marketing" | "partner";

interface PortalThemeProviderProps {
  portal: PortalType;
  children?: React.ReactNode;
}

export default function PortalThemeProvider({ portal, children }: PortalThemeProviderProps) {
  useEffect(() => {
    if (typeof document === "undefined") return;
    
    const root = document.documentElement;
    const body = document.body;
    
    root.classList.remove("mapache-theme", "marketing-theme");
    body.classList.remove("mapache-theme", "marketing-theme");
    
    root.setAttribute("data-portal", portal);
    
    if (portal === "mapache") {
      root.classList.add("mapache-theme");
      body.classList.add("mapache-theme");
    } else if (portal === "marketing") {
      root.classList.add("marketing-theme");
      body.classList.add("marketing-theme");
    }
    
    return () => {
      root.removeAttribute("data-portal");
      root.classList.remove("mapache-theme", "marketing-theme");
      body.classList.remove("mapache-theme", "marketing-theme");
    };
  }, [portal]);

  return <>{children}</>;
}

export function usePortalTheme(): PortalType {
  if (typeof document === "undefined") return "directo";
  
  const portal = document.documentElement.getAttribute("data-portal");
  if (portal === "mapache" || portal === "marketing" || portal === "partner") {
    return portal;
  }
  return "directo";
}

export function getPortalFromTheme(): PortalType {
  if (typeof document === "undefined") return "directo";
  
  const html = document.documentElement;
  if (html.classList.contains("mapache-theme")) return "mapache";
  if (html.classList.contains("marketing-theme")) return "marketing";
  if (html.getAttribute("data-portal") === "partner") return "partner";
  return "directo";
}
