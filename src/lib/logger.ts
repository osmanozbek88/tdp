import pino from "pino";
import { getEnv } from "@/config";

let loggerInstance: pino.Logger | null = null;

export function getLogger(): pino.Logger {
  if (loggerInstance) return loggerInstance;

  const env = getEnv();

  loggerInstance = pino({
    name: env.APP_NAME,
    level: env.LOG_LEVEL,
    transport: env.LOG_PRETTY
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:yyyy-mm-dd HH:MM:ss.l",
            ignore: "pid,hostname",
          },
        }
      : undefined,
    formatters: {
      bindings: () => ({}),
    },
    serializers: {
      err: pino.stdSerializers.err,
      error: pino.stdSerializers.err,
    },
  });

  return loggerInstance;
}

export type Logger = pino.Logger;
