const hardhat = require("hardhat");

const ethers = hardhat.ethers;

const config = {
  minDelay: 86400,
  proposers: ["0x49707808908f0C2450B3F2672E012eDBf49eD808"],
  executors: ["0x49707808908f0C2450B3F2672E012eDBf49eD808", "0x0D8e060CA2D847553ec14394ee6B304623E0d1d6"],
};

async function main() {
  await hardhat.run("compile");

  const TimelockController = await ethers.getContractFactory("TimelockController");

  const controller = await TimelockController.deploy(config.minDelay, config.proposers, config.executors);
  await controller.deployed();

  console.log(`Deployed to: ${controller.address}`);

  // await hardhat.run("verify:verify", {
  //   address: controller.address,
  //   constructorArguments: Object.values(config),
  // });
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
