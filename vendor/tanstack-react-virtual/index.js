import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

const canUseDom = typeof window !== "undefined";

function useIsomorphicLayoutEffect(effect, deps) {
  return canUseDom ? useLayoutEffect(effect, deps) : useEffect(effect, deps);
}

export function useVirtualizer({
  count,
  estimateSize,
  getScrollElement,
  overscan = 5,
}) {
  const baseSizeRef = useRef(null);
  const getBaseSize = useCallback(
    (index = 0) => {
      if (baseSizeRef.current == null) {
        const size = Number(estimateSize(index)) || 0;
        baseSizeRef.current = size;
        return size;
      }
      return baseSizeRef.current;
    },
    [estimateSize],
  );

  const [state, setState] = useState({ scrollOffset: 0, viewportHeight: 0 });

  useIsomorphicLayoutEffect(() => {
    const element = getScrollElement?.();
    if (!element) {
      return undefined;
    }

    const handleScroll = () => {
      setState((prev) => ({ ...prev, scrollOffset: element.scrollTop }));
    };

    const handleResize = () => {
      setState((prev) => ({ ...prev, viewportHeight: element.clientHeight }));
    };

    handleScroll();
    handleResize();

    element.addEventListener("scroll", handleScroll, { passive: true });

    let resizeObserver;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => handleResize());
      resizeObserver.observe(element);
    } else {
      window.addEventListener("resize", handleResize);
    }

    return () => {
      element.removeEventListener("scroll", handleScroll);
      if (resizeObserver) {
        resizeObserver.disconnect();
      } else {
        window.removeEventListener("resize", handleResize);
      }
    };
  }, [getScrollElement]);

  const totalSize = useMemo(() => {
    const baseSize = getBaseSize();
    return Math.max(0, Math.floor(baseSize * Math.max(0, count)));
  }, [count, getBaseSize]);

  const virtualItems = useMemo(() => {
    const baseSize = getBaseSize();
    if (baseSize <= 0 || count === 0) {
      return [];
    }
    const { scrollOffset, viewportHeight } = state;
    const startIndex = Math.max(0, Math.floor(scrollOffset / baseSize) - overscan);
    const endIndex = Math.min(
      count - 1,
      Math.ceil((scrollOffset + viewportHeight) / baseSize) + overscan,
    );

    const items = [];
    for (let index = startIndex; index <= endIndex; index += 1) {
      const start = index * baseSize;
      const size = Number(estimateSize(index)) || baseSize;
      items.push({
        key: index,
        index,
        start,
        size,
        end: start + size,
      });
    }
    return items;
  }, [count, estimateSize, getBaseSize, overscan, state]);

  const scrollToIndex = useCallback(
    (index, options = {}) => {
      const element = getScrollElement?.();
      if (!element) return;
      const baseSize = getBaseSize(index);
      const target = index * baseSize;
      element.scrollTo({ top: target, behavior: options.behavior ?? "auto" });
    },
    [getBaseSize, getScrollElement],
  );

  return {
    getVirtualItems: () => virtualItems,
    getTotalSize: () => totalSize,
    scrollToIndex,
  };
}
