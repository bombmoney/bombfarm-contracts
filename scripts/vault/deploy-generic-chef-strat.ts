import hardhat, { ethers, web3 } from "hardhat";
import { addressBook } from "blockchain-addressbook";
import { predictAddresses } from "../../utils/predictAddresses";
import { setCorrectCallFee } from "../../utils/setCorrectCallFee";
import { setPendingRewardsFunctionName } from "../../utils/setPendingRewardsFunctionName";
import { verifyContract } from "../../utils/verifyContract";
import { BeefyChain } from "../../utils/beefyChain";

const registerSubsidy = require("../../utils/registerSubsidy");

const {
  platforms: { pancake, beefyfinance },
  tokens: {
    WBNB: { address: WBNB },
    BTCB: { address: BTCB },
    DKT: { address: DKT },
    CAKE: { address: CAKE },
  },
} = addressBook.bsc;

const shouldVerifyOnEtherscan = false;

const BSHARE = "0x531780FAcE85306877D7e1F05d713D1B50a37F7A";
const BOMB = "0x522348779DCb2911539e76A1042aA922F9C47Ee3";

const want = web3.utils.toChecksumAddress("0x84392649eb0bC1c1532F2180E58Bae4E1dAbd8D6");

const vaultParams = {
  mooName: "BOMBfarm BOMB-BTCB",
  mooSymbol: "bombfarmBOMB-BTCB",
  delay: 7200,
};

const strategyParams = {
  want,
  poolId: 1,
  chef: "0x1083926054069AaD75d7238E9B809b0eF9d94e5B",
  unirouter: pancake.router,
  strategist: "0x0D8e060CA2D847553ec14394ee6B304623E0d1d6", // some address
  keeper: "0x0D8e060CA2D847553ec14394ee6B304623E0d1d6",
  beefyFeeRecipient: "0x0D8e060CA2D847553ec14394ee6B304623E0d1d6",
  outputToNativeRoute: [BSHARE, WBNB],
  outputToLp0Route: [BSHARE, WBNB, BOMB],
  outputToLp1Route: [BSHARE, WBNB, BTCB],
  pendingRewardsFunctionName: "pendingShare", // used for rewardsAvailable(), use correct function name from masterchef
};

const contractNames = {
  vault: "BeefyVaultV6",
  strategy: "StrategyCommonChefLPBsc",
};

async function main() {
  if (
    Object.values(vaultParams).some(v => v === undefined) ||
    Object.values(strategyParams).some(v => v === undefined) ||
    Object.values(contractNames).some(v => v === undefined)
  ) {
    console.error("one of config values undefined");
    return;
  }

  await hardhat.run("compile");

  const Vault = await ethers.getContractFactory(contractNames.vault);
  const Strategy = await ethers.getContractFactory(contractNames.strategy);

  const [deployer] = await ethers.getSigners();

  console.log("Deploying:", vaultParams.mooName);

  const predictedAddresses = await predictAddresses({ creator: deployer.address });

  const vaultConstructorArguments = [
    predictedAddresses.strategy,
    vaultParams.mooName,
    vaultParams.mooSymbol,
    vaultParams.delay,
  ];
  const vault = await Vault.deploy(...vaultConstructorArguments);
  await vault.deployed();

  const strategyConstructorArguments = [
    strategyParams.want,
    strategyParams.poolId,
    strategyParams.chef,
    vault.address,
    strategyParams.unirouter,
    strategyParams.keeper,
    strategyParams.strategist,
    strategyParams.beefyFeeRecipient,
    strategyParams.outputToNativeRoute,
    strategyParams.outputToLp0Route,
    strategyParams.outputToLp1Route,
  ];
  const strategy = await Strategy.deploy(...strategyConstructorArguments);
  await strategy.deployed();

  // add this info to PR
  console.log();
  console.log("Vault:", vault.address);
  console.log("Strategy:", strategy.address);
  console.log("Want:", strategyParams.want);
  console.log("PoolId:", strategyParams.poolId);

  console.log();
  console.log("Running post deployment");

  const verifyContractsPromises: Promise<any>[] = [];
  if (shouldVerifyOnEtherscan) {
    // skip await as this is a long running operation, and you can do other stuff to prepare vault while this finishes
    verifyContractsPromises.push(
      verifyContract(vault.address, vaultConstructorArguments),
      verifyContract(strategy.address, strategyConstructorArguments)
    );
  }
  await setPendingRewardsFunctionName(strategy, strategyParams.pendingRewardsFunctionName);
  await setCorrectCallFee(strategy, hardhat.network.name as BeefyChain);
  console.log();

  await Promise.all(verifyContractsPromises);

  // if (hardhat.network.name === "bsc") {
  //   await registerSubsidy(vault.address, deployer);
  //   await registerSubsidy(strategy.address, deployer);
  // }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
