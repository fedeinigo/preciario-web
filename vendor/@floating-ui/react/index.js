const React = require("react");
const ReactDOM = require("react-dom");

function resolveOffset(middleware) {
  if (!Array.isArray(middleware)) return 0;
  const entry = middleware.find((item) => item && item.name === "offset");
  if (!entry) return 0;
  const options = entry.options;
  if (options == null) return 0;
  if (typeof options === "number") return options;
  if (typeof options === "object") {
    if (typeof options.mainAxis === "number") return options.mainAxis;
  }
  return 0;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function basePlacement(placement) {
  if (!placement) return "bottom";
  const [base] = placement.split("-");
  return base;
}

function alignment(placement) {
  if (!placement) return "start";
  const [, align] = placement.split("-");
  return align ?? "start";
}

function useFloating(options = {}) {
  const { open = false, onOpenChange, placement = "bottom-start", middleware = [] } = options;
  const referenceRef = React.useRef(null);
  const floatingRef = React.useRef(null);
  const [position, setPosition] = React.useState({ x: 0, y: 0 });

  const offset = resolveOffset(middleware);

  const update = React.useCallback(() => {
    const reference = referenceRef.current;
    const floating = floatingRef.current;
    if (!reference || !floating) return;

    const referenceRect = reference.getBoundingClientRect();
    const floatingRect = floating.getBoundingClientRect();
    const base = basePlacement(placement);
    const align = alignment(placement);

    let x = referenceRect.left;
    let y = referenceRect.bottom;

    if (base === "top") {
      y = referenceRect.top - floatingRect.height - offset;
    } else if (base === "bottom") {
      y = referenceRect.bottom + offset;
    } else if (base === "left") {
      x = referenceRect.left - floatingRect.width - offset;
      y = referenceRect.top;
    } else if (base === "right") {
      x = referenceRect.right + offset;
      y = referenceRect.top;
    }

    if (base === "top" || base === "bottom") {
      if (align === "end") {
        x = referenceRect.right - floatingRect.width;
      } else if (align === "center") {
        x = referenceRect.left + referenceRect.width / 2 - floatingRect.width / 2;
      } else {
        x = referenceRect.left;
      }
    } else if (base === "left" || base === "right") {
      if (align === "end") {
        y = referenceRect.bottom - floatingRect.height;
      } else if (align === "center") {
        y = referenceRect.top + referenceRect.height / 2 - floatingRect.height / 2;
      } else {
        y = referenceRect.top;
      }
    }

    if (typeof window !== "undefined") {
      const maxX = window.innerWidth - floatingRect.width - 8;
      const maxY = window.innerHeight - floatingRect.height - 8;
      x = clamp(x, 8, Math.max(maxX, 8));
      y = clamp(y, 8, Math.max(maxY, 8));
    }

    setPosition({ x, y });
  }, [placement, offset]);

  React.useLayoutEffect(() => {
    if (!open) return;
    update();
  }, [open, update]);

  React.useLayoutEffect(() => {
    if (!open) return undefined;
    const handle = () => update();
    if (typeof window !== "undefined") {
      window.addEventListener("resize", handle);
      window.addEventListener("scroll", handle, true);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("resize", handle);
        window.removeEventListener("scroll", handle, true);
      }
    };
  }, [open, update]);

  const setReference = React.useCallback(
    (node) => {
      referenceRef.current = node || null;
      if (open) update();
    },
    [open, update],
  );

  const setFloating = React.useCallback(
    (node) => {
      floatingRef.current = node || null;
      if (open) update();
    },
    [open, update],
  );

  const floatingStyles = React.useMemo(
    () => ({
      position: "fixed",
      left: `${position.x}px`,
      top: `${position.y}px`,
      zIndex: 1000,
    }),
    [position],
  );

  const context = React.useMemo(
    () => ({
      open,
      onOpenChange: onOpenChange || (() => {}),
      refs: { reference: referenceRef, floating: floatingRef },
      placement,
    }),
    [open, onOpenChange, placement],
  );

  return {
    refs: {
      reference: referenceRef,
      floating: floatingRef,
      setReference,
      setFloating,
    },
    floatingStyles,
    context,
    update,
    placement,
    x: position.x,
    y: position.y,
  };
}

function mergeProps(target, source) {
  const result = { ...target };
  for (const key in source) {
    const value = source[key];
    const existing = target[key];
    if (typeof existing === "function" && typeof value === "function") {
      result[key] = (...args) => {
        existing(...args);
        value(...args);
      };
    } else if (key.startsWith("on") && typeof value === "function") {
      result[key] = value;
    } else if (value !== undefined) {
      result[key] = value;
    }
  }
  return result;
}

function useClick(context, options = {}) {
  const { open, onOpenChange } = context;
  const { event = "onClick", toggle = true, enabled = true } = options;
  return {
    getReferenceProps(userProps = {}) {
      if (!enabled) return userProps;
      return mergeProps(userProps, {
        [event]: (eventObj) => {
          if (typeof userProps[event] === "function") userProps[event](eventObj);
          if (toggle) {
            onOpenChange(!open);
          } else {
            onOpenChange(true);
          }
        },
      });
    },
  };
}

function useDismiss(context, options = {}) {
  const { open, onOpenChange, refs } = context;
  const { escapeKey = true, outsidePress = true, enabled = true } = options;

  React.useEffect(() => {
    if (!enabled || !open || !outsidePress) return undefined;
    function handle(event) {
      const floating = refs.floating.current;
      const reference = refs.reference.current;
      if (!floating) return;
      if (floating.contains(event.target)) return;
      if (reference && reference.contains(event.target)) return;
      onOpenChange(false);
    }
    document.addEventListener("mousedown", handle);
    document.addEventListener("touchstart", handle);
    return () => {
      document.removeEventListener("mousedown", handle);
      document.removeEventListener("touchstart", handle);
    };
  }, [enabled, open, outsidePress, onOpenChange, refs.floating, refs.reference]);

  return {
    getFloatingProps(userProps = {}) {
      if (!enabled) return userProps;
      const nextProps = { ...userProps };
      const existingKeyDown = userProps.onKeyDown;
      nextProps.onKeyDown = (event) => {
        if (typeof existingKeyDown === "function") existingKeyDown(event);
        if (escapeKey && event.key === "Escape") {
          onOpenChange(false);
        }
      };
      return nextProps;
    },
  };
}

function useRole(context, options = {}) {
  const { role = "dialog" } = options;
  return {
    getFloatingProps(userProps = {}) {
      return { ...userProps, role };
    },
  };
}

function useInteractions(handlers) {
  return {
    getReferenceProps(userProps = {}) {
      return handlers.reduce((props, handler) => {
        if (handler && typeof handler.getReferenceProps === "function") {
          return handler.getReferenceProps(props);
        }
        return props;
      }, userProps);
    },
    getFloatingProps(userProps = {}) {
      return handlers.reduce((props, handler) => {
        if (handler && typeof handler.getFloatingProps === "function") {
          return handler.getFloatingProps(props);
        }
        return props;
      }, userProps);
    },
  };
}

function FloatingPortal({ children }) {
  const [container, setContainer] = React.useState(null);

  React.useEffect(() => {
    if (typeof document === "undefined") return;
    const node = document.createElement("div");
    node.setAttribute("data-floating-ui-portal", "");
    document.body.appendChild(node);
    setContainer(node);
    return () => {
      document.body.removeChild(node);
    };
  }, []);

  if (container == null) return null;
  return ReactDOM.createPortal(children, container);
}

function FloatingFocusManager({ context, children, initialFocus = null, returnFocus = true }) {
  const contentRef = React.useRef(null);

  React.useLayoutEffect(() => {
    if (!context.open) return undefined;
    const previouslyFocused = typeof document !== "undefined" ? document.activeElement : null;
    const focusTarget =
      (initialFocus && initialFocus.current) ||
      (contentRef.current && contentRef.current.querySelector("[data-autofocus='true']")) ||
      contentRef.current;
    if (focusTarget && typeof focusTarget.focus === "function") {
      focusTarget.focus();
    }
    return () => {
      if (returnFocus && previouslyFocused && typeof previouslyFocused.focus === "function") {
        previouslyFocused.focus();
      }
    };
  }, [context.open, initialFocus, returnFocus]);

  return React.createElement("div", { ref: contentRef }, children);
}

function offset(options) {
  return { name: "offset", options };
}

function flip() {
  return { name: "flip" };
}

function shift() {
  return { name: "shift" };
}

module.exports = {
  useFloating,
  useClick,
  useDismiss,
  useRole,
  useInteractions,
  FloatingPortal,
  FloatingFocusManager,
  offset,
  flip,
  shift,
};
