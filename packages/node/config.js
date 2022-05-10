
const config = require("./contract-info.json");

const contract = Object.values(Object.values(Object.values(config)[0])[0].contracts)[0];

// Change the web3 provider here (local node / infura...)
const PROVIDER_ADDRESS = process.env.PROVIDER_ADDRESS ?? "http://localhost:8545";

const { abi: ABI, address: CONTRACT_ADDRESS } = contract;

module.exports = {
  PROVIDER_ADDRESS,
  CONTRACT_ADDRESS,
  ABI,
};