import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { PROD_ORACLE, PROD_GUARDIAN_USDX } from "../../mainnet_constants";
const { ethers } = require("hardhat");

const deploy_USDXPricer: DeployFunction = async function (
  hre: HardhatRuntimeEnvironment
) {
  const { deployments, getNamedAccounts } = hre;
  const { deployer } = await getNamedAccounts();
  const { deploy } = deployments;

  await deploy("USDX_Pricer", {
    from: deployer,
    contract: "USDXPricer",
    args: [PROD_GUARDIAN_USDX, PROD_GUARDIAN_USDX],
    log: true,
  });
};

deploy_USDXPricer.tags = ["Prod-USDX-Pricer", "Prod-USDX-5"];
export default deploy_USDXPricer;
