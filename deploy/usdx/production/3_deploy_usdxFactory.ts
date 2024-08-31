import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { KYC_REGISTRY, PROD_GUARDIAN_OMMF } from "../../mainnet_constants";
const { ethers } = require("hardhat");

const deployUSDX_Factory: DeployFunction = async function (
  hre: HardhatRuntimeEnvironment
) {
  const { deployments, getNamedAccounts } = hre;
  const { deployer } = await getNamedAccounts();
  const { deploy } = deployments;

  // Deploy the factory
  await deploy("USDXFactory", {
    from: deployer,
    args: [PROD_GUARDIAN_OMMF],
    log: true,
  });
};

deployUSDX_Factory.tags = ["Prod-USDX-Factory", "Prod-USDX-3"];
export default deployUSDX_Factory;
