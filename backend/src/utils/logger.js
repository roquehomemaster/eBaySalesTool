const { createLogger, format, transports } = require('winston');

const level = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'info');

const logger = createLogger({
  level,
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.printf(({ timestamp, level, message, stack }) => {
      const msg = typeof message === 'string' ? message : JSON.stringify(message);
      return `${timestamp} [${level.toUpperCase()}] ${stack ? stack : msg}`;
    })
  ),
  transports: [new transports.Console()],
});

module.exports = logger;
