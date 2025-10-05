interface ScrollToOptions {
  behavior?: ScrollBehavior;
}

export interface VirtualItem {
  key: number;
  index: number;
  start: number;
  size: number;
  end: number;
}

export interface UseVirtualizerOptions {
  count: number;
  estimateSize: (index: number) => number;
  getScrollElement: () => HTMLElement | null | undefined;
  overscan?: number;
}

export interface Virtualizer {
  getVirtualItems: () => VirtualItem[];
  getTotalSize: () => number;
  scrollToIndex: (index: number, options?: ScrollToOptions) => void;
}

export declare function useVirtualizer(options: UseVirtualizerOptions): Virtualizer;
