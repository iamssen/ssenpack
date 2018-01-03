const fs = require('fs');

module.exports = (options, moduleName, path = '') => {
  return fs.existsSync(`${options.CWD}/node_modules/${moduleName}`)
    ? `${options.CWD}/node_modules/${moduleName}` + path
    : `${options.MODULE_HOME}/node_modules/${moduleName}` + path;
};