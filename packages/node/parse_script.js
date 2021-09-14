const base85 = require('base85');
const { promisify } = require('util');
const { unzip } = require('zlib');

// Standard zlib deflate
const zlib = promisify(unzip);

// Base85 standard alphabet, with delimiters
const b85 = raw => base85.decode(raw, 'ascii85');

const utf8 = raw => raw.toString('utf8');

const MAGICK = {
  0: [b85, utf8],
  1: [b85, zlib, utf8],
};

const parse = async raw => {
  if (Number.isNaN(Number.parseInt(raw[0]))) return raw;
  
  const m = raw[0];
  let result = raw.slice(1);
  for (f of MAGICK[m]) {
    result = await f(result);
  }
  return result;
}

module.exports = { parse };