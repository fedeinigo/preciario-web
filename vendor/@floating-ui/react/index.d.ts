import * as React from "react";

export interface FloatingContext {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  refs: {
    reference: React.MutableRefObject<HTMLElement | null>;
    floating: React.MutableRefObject<HTMLElement | null>;
  };
  placement: string;
}

export interface FloatingInteraction {
  getReferenceProps?: <T>(props?: T) => T;
  getFloatingProps?: <T>(props?: T) => T;
}

export interface UseFloatingReturn {
  refs: {
    reference: React.MutableRefObject<HTMLElement | null>;
    floating: React.MutableRefObject<HTMLElement | null>;
    setReference: (node: HTMLElement | null) => void;
    setFloating: (node: HTMLElement | null) => void;
  };
  floatingStyles: React.CSSProperties;
  context: FloatingContext;
  update: () => void;
  placement: string;
  x: number;
  y: number;
}

export interface UseFloatingOptions {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  placement?: string;
  middleware?: Array<{ name: string; options?: unknown }>;
}

export function useFloating(options?: UseFloatingOptions): UseFloatingReturn;

export function useClick(
  context: FloatingContext,
  options?: { enabled?: boolean; toggle?: boolean; event?: string },
): FloatingInteraction;

export function useDismiss(
  context: FloatingContext,
  options?: { enabled?: boolean; escapeKey?: boolean; outsidePress?: boolean },
): FloatingInteraction;

export function useRole(
  context: FloatingContext,
  options?: { role?: string },
): FloatingInteraction;

export function useInteractions(handlers: FloatingInteraction[]): {
  getReferenceProps: <T>(props?: T) => T;
  getFloatingProps: <T>(props?: T) => T;
};

export function FloatingPortal(props: { children: React.ReactNode }): React.ReactPortal | null;

export function FloatingFocusManager(props: {
  context: FloatingContext;
  children: React.ReactNode;
  initialFocus?: React.RefObject<HTMLElement | null> | null;
  returnFocus?: boolean;
}): React.ReactElement | null;

export function offset(value: number | { mainAxis?: number }): { name: string; options: unknown };
export function flip(): { name: string };
export function shift(): { name: string };
