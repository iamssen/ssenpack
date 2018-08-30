const os = require('os');
const fs = require('fs');

module.exports = () => {
  if (process.platform !== 'linux') {
    return false;
  }
  
  if (os.release().includes('Microsoft')) {
    return true;
  }
  
  try {
    return fs.readFileSync('/proc/version', 'utf8').includes('Microsoft');
  } catch (err) {
    return false;
  }
};