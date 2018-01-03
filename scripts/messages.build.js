const glob = require('glob');
const fs = require('fs');
const path = require('path');

function flattenMessages(nestedMessages, prefix = '') {
  return Object.keys(nestedMessages).reduce((messages, key) => {
    const value = nestedMessages[key];
    const prefixedKey = prefix ? `${prefix}.${key}` : key;
    
    if (typeof value === 'string') {
      messages[prefixedKey] = value;
    } else {
      Object.assign(messages, flattenMessages(value, prefixedKey));
    }
    
    return messages;
  }, {});
}

module.exports = (options) => () => {
  glob(path.resolve(options.CWD + '/src/**/messages/*.json'), (err, matches) => {
    if (err) throw err;
    const translations = new Map;
    const keys = new Set;
    const languages = new Set;
    
    for (const match of matches) {
      const text = fs.readFileSync(match, {encoding: 'utf8'});
      const language = /\/([a-z]{2}).json$/.exec(match)[1];
      const messages = flattenMessages(JSON.parse(text));
      
      if (!languages.has(language)) languages.add(language);
      
      for (const key of Object.keys(messages)) {
        if (!keys.has(key)) keys.add(key);
      }
      
      if (translations.has(language)) {
        translations.set(language, Object.assign({}, translations.get(language), messages));
      } else {
        translations.set(language, messages);
      }
    }
    
    const messages = {};
    
    for (const language of languages) {
      messages[language] = {};
      
      for (const key of keys) {
        messages[language][key] = translations.get(language)[key] || '{{' + key + '}}';
      }
    }
    
    fs.writeFileSync(path.join(options.CWD, 'src', 'common', 'data', 'intl.messages.json'), JSON.stringify(messages, null, 2));
  });
};