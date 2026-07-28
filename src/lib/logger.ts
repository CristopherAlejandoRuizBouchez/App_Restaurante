type LogLevel = "debug" | "info" | "warn" | "error";
type LogContext = Record<string, unknown>;

function emit(level: LogLevel, message: string, context?: LogContext): void {
  const line = JSON.stringify({
    level,
    message,
    timestamp: new Date().toISOString(),
    ...context,
  });

  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const logger = {
  debug: (m: string, c?: LogContext) => emit("debug", m, c),
  info: (m: string, c?: LogContext) => emit("info", m, c),
  warn: (m: string, c?: LogContext) => emit("warn", m, c),
  error: (m: string, c?: LogContext) => emit("error", m, c),
};
