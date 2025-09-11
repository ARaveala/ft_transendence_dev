const fs = require('fs');
const path = require('path');

const logDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);

const logFile = path.join(logDir, 'app.log');

function log(label, message) {
  const entry = `[${label}] ${message}\n`;
  fs.appendFileSync(logFile, entry);
}

module.exports = {log};