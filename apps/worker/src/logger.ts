import { pino } from "pino";

const isDev = process.env.NODE_ENV !== "production";

/** Structured logs (04 §11). Pretty in dev, JSON in prod. */
export const logger = pino({
  level: process.env.MYOS_LOG_LEVEL ?? (isDev ? "debug" : "info"),
  ...(isDev
    ? {
        transport: {
          target: "pino-pretty",
          options: { colorize: true, translateTime: "SYS:standard" },
        },
      }
    : {}),
});
