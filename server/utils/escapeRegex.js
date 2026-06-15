const escapeStringRegexp = require('escape-string-regexp');

const escapeRegex = (string) => {
  if (typeof string !== 'string') return '';
  return escapeStringRegexp(string);
};

module.exports = escapeRegex;
