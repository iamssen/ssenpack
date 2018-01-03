const fs = require('fs');
const path = require('path');
const semver = require('semver');
const getPackageJson = require('package-json');

module.exports = (options) => () => {
  Promise
    .all(Object.keys(options.libs.entry).map(name => {
      const {group} = options.libs.entry[name];
      const groupDir = group ? group + '/' : '';
      
      const dir = path.join(options.CWD, 'dist', 'libs', groupDir + name);
      const nextPackageJson = JSON.parse(fs.readFileSync(dir + '/package.json', 'utf8').toString());
      
      return getPackageJson(groupDir + name)
        .then(currentPackageJson => {
          return {
            name,
            group,
            currentPackageJson,
            nextPackageJson,
          };
        })
        .catch(err => {
          return {
            name,
            group,
            currentPackageJson: {version: '0.0.0'},
            nextPackageJson,
          };
        });
    }))
    .then(result => {
      return result.filter(({nextPackageJson, currentPackageJson}) => {
        return semver.gt(nextPackageJson.version, currentPackageJson.version);
      });
    })
    .then(result => {
      if (result.length > 0) {
        console.log(result.reduce((commands, {group, name}) => {
          commands.push('cd ' + path.join(options.CWD, 'dist', 'libs', group || '', name));
          commands.push('npm publish');
          return commands;
        }, []).join(';\n'));
      } else {
        console.log('echo There is no library to update.');
      }
    })
    .catch(err => {
    
    });
};