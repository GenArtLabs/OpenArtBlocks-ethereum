const { PROVIDER_ADDRESS, CONTRACT_ADDRESS, ABI } = require('./config');
const { parse } = require('./parse_script');
const { getStaticImagePath } = require('./render');

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
const HTML_p5 = readFileSync('templates/p5.html').toString();
const HTML_svg = readFileSync('templates/svg.html').toString();
const HTML = [HTML_p5, HTML_svg];

// SOME WEB3 STUFF TO CONNECT TO SMART CONTRACT
// const provider = new Web3.providers.WebsocketProvider(PROVIDER_ADDRESS);
const provider = new Web3.providers.HttpProvider(PROVIDER_ADDRESS);
const web3infura = new Web3(provider);
const contract = new web3infura.eth.Contract(ABI, CONTRACT_ADDRESS);

contract.getPastEvents('Mint', {fromBlock: 0}).then(events => {
  events.forEach(event => {
    // check if uploaded to ipfs
    console.log(event.raw);
  });
});


contract.events.Mint({}).on('data', function(event){
  // upload to ipfs
  const [_, to, tokenIndex] = event.raw.topics;
  console.log(to, tokenIndex);
})

function injectHTML(script, hash, html) {
  return html.replace('{{INJECT_SCRIPT_HERE}}', script).replace('{{INJECT_HASH_HERE}}', hash);
}

let infos = null;

async function refreshInfos() {
  const res = await contract.methods.script().call();
  const js = await parse(res.slice(1));
  infos = {
    count: 100,// TODO
    string: js,
    html: HTML[Number(res[0])] ?? null,
    lastUpdated: new Date(),
  };
}
refreshInfos();

const TIMEOUT = 15 * 60 * 1000;
async function refreshIfNeeded() {
  if (!infos || new Date() - infos.lastUpdated > TIMEOUT) await refreshInfos();
}

async function getScript() {
  await refreshIfNeeded();
  return infos.string;
}

async function getCount() {
  await refreshIfNeeded();
  return infos.count;
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
    name: `Pinguin chelou #${id}`,
    description: 'Une oeuvre generative qualitative de Squirelo pour le Valou Club',
    tokenID: id,
    token_hash: tokenHash,
    image: `${HOST}/${id}`,
    animation_url: `${HOST}/live/${id}`,
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
  const html = injectHTML(script, tokenHash, infos.html);

  return res.setHeader('Content-type', 'text/html').send(html);
}

const getImage = async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.sendStatus(404);

  const tokenHash = await getTokenHash(id);
  if (!tokenHash) return res.sendStatus(404);

  const count = await getCount();
  if (count == undefined) return res.sendStatus(404);

  const script = await getScript();
  const path = await getStaticImagePath(script, tokenHash, count);

  return res.sendFile(path, { root: __dirname });
}

module.exports = { getMetadata, getLive, getImage };
