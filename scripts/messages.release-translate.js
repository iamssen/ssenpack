const glob = require('glob');
const fs = require('fs');
const path = require('path');

module.exports = (options) => () => {
  const translateFile = path.join(options.CWD, 'src', 'messages.translate.json');
  
  if (fs.existsSync(translateFile)) {
    const translation = JSON.parse(fs.readFileSync(translateFile, {encoding: 'utf8'}));
    
    glob(path.resolve(options.CWD + '/src/**/messages/*.json'), (err, jsonFiles) => {
      for (const json of jsonFiles) {
        const locale = path.basename(json, '.json');
        const translationMessages = translation[locale];
        
        fs.readFile(json, {encoding: 'utf8'}, (err, text) => {
          let changed = false;
          const data = JSON.parse(text);
          
          function search(target, paths = []) {
            Object.keys(target).forEach(k => {
              const id = [...paths, k].join('.');
              
              if (typeof target[k] === 'string') {
                if (translationMessages[id] !== target[k]) {
                  console.log(`Apply translation "${id}": ${target[k]} → ${translationMessages[id]}`);
                  target[k] = translationMessages[id];
                  changed = true;
                }
              } else if (Object.keys(target[k]).length > 0) {
                search(target[k], [...paths, k]);
              }
            });
          }
          
          search(data);
          
          if (changed) {
            const text = JSON.stringify(data, null, 2);
            fs.writeFileSync(json, text, {encoding: 'utf8'});
            console.log(`😀 Applied translation: ${json}`);
          }
        });
      }
    });
  } else {
    console.error('❓ No translate file.', translateFile);
  }
};