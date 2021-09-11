const { ethers } = require("hardhat");

const main = async () => {
  // ADDRESS TO MINT TO:
  const toAddress = "0xbc501F3D42FC3Ac4c022F64b3DF1ea9De4236cB1";

  const { deployer } = await getNamedAccounts();
  const yourCollectible = await ethers.getContract("YourCollectible", deployer);

  console.log(
    "Transferring Ownership of YourCollectible to " + toAddress + "..."
  );

  await yourCollectible.transferOwnership(toAddress);
};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
