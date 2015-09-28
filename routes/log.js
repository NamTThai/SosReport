var winston = require('winston');
var log = new (winston.Logger)({
  transports: [
    new (winston.transports.File)({
      name: 'info-file',
      filename: './logs/info.log',
      level: 'info'
    }),
    new (winston.transports.Console)({
      level: 'debug'
    }),
    new (winston.transports.File)({
      name: 'error-file',
      filename: './logs/error.log',
      level: 'error'
    })
  ]
});

module.exports = log;
