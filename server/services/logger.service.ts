import winston from "winston";

const { combine, timestamp, printf, colorize, json } = winston.format;

const customFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let metaString = "";
  if (Object.keys(metadata).length > 0) {
    metaString = ` ${JSON.stringify(metadata)}`;
  }
  return `[${timestamp}] ${level}: ${message}${metaString}`;
});

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: combine(
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    process.env.NODE_ENV === "production" ? json() : combine(colorize(), customFormat)
  ),
  transports: [
    new winston.transports.Console()
  ]
});

// Stream support for express middleware
export const loggerStream = {
  write: (message: string) => {
    logger.info(message.trim());
  }
};
