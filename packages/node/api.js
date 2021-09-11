const { PROVIDER_ADDRESS, CONTRACT_ADDRESS, ABI } = require('./config.js');
const Web3 = require('web3');
const { readFileSync } = require('fs');

const HOST = process.env.HOST ?? `http://localhost:${process.env.PORT || 3333}`;

function traits(hash) {
  return [
    // generate metadata here
    {
      trait_type: 'Background',
      value: 'gray',
    },
  ];
}

// TODO manage multiple script types (contract.scriptType)
const HTML = readFileSync('template_p5.html').toString();

// SOME WEB3 STUFF TO CONNECT TO SMART CONTRACT
const provider = new Web3.providers.HttpProvider(PROVIDER_ADDRESS);
const web3infura = new Web3(provider);
const contract = new web3infura.eth.Contract(ABI, CONTRACT_ADDRESS);

function injectHTML(script, hash) {
  return HTML.replace('{{INJECT_SCRIPT_HERE}}', script).replace('{{INJECT_HASH_HERE}}', hash);
}

let script = null;

async function refreshScript() {
  const res = contract.methods.script().call();
  script = {
    string: res,
    lastUpdated: new Date(),
  };
}
refreshScript();

const TIMEOUT = 15 * 60 * 1000;
async function getScript() {
  if (!script || new Date() - script.lastUpdated > TIMEOUT) await refreshScript();
  return script.string;
}

async function getTokenHash(id) {

  if (tokenHashes[id] === undefined) {

    const totalSupply = await contract.methods.totalSupply().call();

    if (id >= totalSupply || id < 0) return null;

    tokenHashes[id] = await contract.methods.tokenHash(id).call();
  }
  return tokenHashes[id];

}


const tokenHashes = {};

const getMetadata = async (req, res) => {

  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.sendStatus(404);

  const tokenHash = await getTokenHash(id);
  if (!tokenHash) return res.sendStatus(404);

  const attributes = traits(tokenHash)
  // CHECK OPENSEA METADATA STANDARD DOCUMENTATION https://docs.opensea.io/docs/metadata-standards
  let metadata = {
    name: 'CordialToken',
    description: 'Token description',
    tokenId: id,
    tokenHash,
    image: 'https://www.thefamouspeople.com/profiles/images/george-sand-5.jpg',
    external_url: HOST,
    attributes,
  };

  res.json(metadata);
}

const getLive = async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.sendStatus(404);

  const tokenHash = await getTokenHash(id);
  if (!tokenHash) return res.sendStatus(404);

  const script = await getScript();
  const html = injectHTML(script, tokenHash);

  return res.setHeader('Content-type', 'text/html').send(html);
}

module.exports = { getMetadata, getLive };