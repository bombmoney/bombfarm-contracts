const registerSubsidy = require("../utils/registerSubsidy");
const contractAddressGenerator = require("../utils/predictAddresses").contractAddressGenerator;

const { addressBook } = require("blockchain-addressbook")
const { DAI: { address: DAI }, QUICK: { address: QUICK }, WMATIC: { address: WMATIC }, ETH: { address: ETH } } = addressBook.polygon.tokens;
const { quickswap, beefyfinance } = addressBook.polygon.platforms;

let vaultParams = {
    mooName: "Moo Quick DAI-ETH",
    mooSymbol: "mooquickDAI-ETH",
    delay: 21600,
}

let strategyParams = {
    want: "0x4a35582a710e1f4b2030a3f826da20bfb6703c09",
    rewardPool: "0x785AaCd49c1Aa3ca573F2a32Bb90030A205b8147",
    unirouter: quickswap.router,
    strategist: "0x530115e78F7BC2fE235666651f9113DB9cecE5A2", // some address
    keeper: beefyfinance.keeper,
    beefyFeeRecipient: beefyfinance.beefyFeeRecipient,
    outputToNativeRoute: [QUICK, WMATIC],
    outputToLp0Route: [QUICK, ETH],
    outputToLp1Route: [QUICK, ETH, DAI]
};

const contractNames = {
    vault: "BeefyVaultV6",
    strategy: "StrategyCommonRewardPoolLP"
}

module.exports = async ({
    ethers,
    deployments
}) => {
    const { deploy } = deployments;
    const [deployer] = await ethers.getSigners();

    console.log(`Deployer: ${deployer.address}\n`);

    let contractAddress = await contractAddressGenerator(deployer);

    strategyParams.vault = (await contractAddress.next()).value;
    vaultParams.strategy = (await contractAddress.next()).value;

    //console.log(vaultParams);
    const vaultDeployResult = await deploy(`${vaultParams.mooName} Vault`, {
        from: deployer.address,
        contract: contractNames.vault,
        args: [vaultParams.strategy, vaultParams.mooName, vaultParams.mooSymbol, vaultParams.delay],
        log: true,
        skipIfAlreadyDeployed: true
    });

    //console.log(strategyParams);
    const strategy = await deploy(`${vaultParams.mooName} Strategy`, {
        from: deployer.address,
        contract: contractNames.strategy,
        args: [
            strategyParams.want,
            strategyParams.rewardPool,
            strategyParams.vault,
            strategyParams.unirouter,
            strategyParams.keeper,
            strategyParams.strategist,
            strategyParams.beefyFeeRecipient,
            strategyParams.outputToNativeRoute,
            strategyParams.outputToLp0Route,
            strategyParams.outputToLp1Route],
        log: true,
        skipIfAlreadyDeployed: true
    });
//    console.log(`Strategy deployed to: ${strategy.address}`);
    console.log();
};