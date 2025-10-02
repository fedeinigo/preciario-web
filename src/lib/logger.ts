const defaultFormatter = (level: string, message: string, meta?: Record<string, unknown>) => {
  const payload = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...meta,
  };
  return JSON.stringify(payload);
};

function log(level: "info" | "warn" | "error", message: string, meta?: Record<string, unknown>) {
  const formatted = defaultFormatter(level, message, meta);
  if (level === "error") {
    console.error(formatted);
  } else if (level === "warn") {
    console.warn(formatted);
  } else {
    console.log(formatted);
  }
}

export type Logger = {
  info: (message: string, meta?: Record<string, unknown>) => void;
  warn: (message: string, meta?: Record<string, unknown>) => void;
  error: (message: string, meta?: Record<string, unknown>) => void;
  child: (meta: Record<string, unknown>) => Logger;
};

function createLogger(baseMeta: Record<string, unknown> = {}): Logger {
  return {
    info: (message, meta) => log("info", message, { ...baseMeta, ...meta }),
    warn: (message, meta) => log("warn", message, { ...baseMeta, ...meta }),
    error: (message, meta) => log("error", message, { ...baseMeta, ...meta }),
    child: (meta) => createLogger({ ...baseMeta, ...meta }),
  };
}

export const logger = createLogger();
export default logger;
