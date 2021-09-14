const base85 = require('base85');
const { promisify } = require('util');
const { unzip } = require('zlib');

// An easy way to reduce gas costs is to compress the js code;
// You can use this tool to do so
// https://gchq.github.io/CyberChef/#recipe=Zlib_Deflate('Dynamic%20Huffman%20Coding')To_Base85('!-u',true)Find_/_Replace(%7B'option':'Regex','string':'%5E'%7D,'1',false,false,false,false)
// This will compress your data and add a prefix to show how it was encoded
// Don't forget to prefix the script once more with the character corresponding
// to your type of script (0: p5, 1: svg...), as seen in api.js


// Standard zlib inflate
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