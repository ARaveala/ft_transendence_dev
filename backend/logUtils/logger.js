const fs = require('fs');
const path = require('path');

const logDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);

const logFile = path.join(logDir, 'app.log');

function log(label, message) {
  const entry = `[${label}] ${message}\n`;
  fs.appendFileSync(logFile, entry);
}

const pino = require('pino');
const transport = pino.transport;

// this just shows how  levels are categorized
const customLevels = {
  trace: 15,
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
  fatal: 60
};

const logger = pino(
  {
    level: 'debug', // capture all levels
    base: null      // removes pid and hostname globally
  },
  transport({
    targets: [
      // Terminal output (pretty, all levels)
      {
        level: 'debug',
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname'
        }
      },
	{
		level: 'debug',
		target: 'pino-pretty',
		options: {
			colorize: false,
			translateTime: 'yyyy-mm-dd HH:MM:ss',
			ignore: 'pid,hostname',
			destination: './logs/server.log'
        }
      },

      // Separate debug.log
      {
        level: 'debug',
        target: 'pino-pretty',
		options: {
			colorize: false,
			translateTime: 'yyyy-mm-dd HH:MM:ss',
			ignore: 'pid,hostname',
			destination: './logs/debug.log'
		}
//        options: { destination: './logs/debug.log' }
      },

      // Separate info.log
      {
        level: 'info',
        target: 'pino-pretty',
		options: {
			colorize: false,
			translateTime: 'yyyy-mm-dd HH:MM:ss',
			ignore: 'pid,hostname',
			destination: './logs/info.log'
		}
		//        options: { destination: './logs/info.log' }
      },

      // Separate warn.log
      {
        level: 'warn',
        target: 'pino-pretty',
		options: {
			colorize: false,
			translateTime: 'yyyy-mm-dd HH:MM:ss',
			ignore: 'pid,hostname',
			destination: './logs/warn.log'
		}
		//        options: { destination: './logs/warn.log' }
      },

      // Separate error.log
      {
        level: 'error',
        target: 'pino-pretty',
		options: {
			colorize: false,
			translateTime: 'yyyy-mm-dd HH:MM:ss',
			ignore: 'pid,hostname',
			destination: './logs/error.log'
		}
		//       options: { destination: './logs/error.log' }
      }
    ]
  })
);

//module.exports = logger;


//const pino = require('pino');
//const transport = pino.transport;
//
//const logger = pino(
//  {
//    level: 'info',
//    base: undefined // removes pid and hostname globally
//  },
//  transport({
//    targets: [
//      {
//        level: 'info',
//        target: 'pino-pretty',
//        options: {
//          colorize: true,
//          translateTime: 'SYS:standard',
//          ignore: 'pid,hostname'
//        }
//      },
//      {
//        level: 'info',
//        target: 'pino-pretty',
//        options: {
//          colorize: false,
//          translateTime: 'yyyy-mm-dd HH:MM:ss',
//          ignore: 'pid,hostname',
//          destination: './logs/server.log'
//        }
//      }
//    ]
//  })
//);
module.exports = {log, logger};