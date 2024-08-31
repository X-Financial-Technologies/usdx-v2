import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { parseUnits } from "ethers/lib/utils";
import { BigNumber } from "ethers";
const { ethers } = require("hardhat");

const deploy_USDXPricer: DeployFunction = async function (
  hre: HardhatRuntimeEnvironment
) {
  const { deployments, getNamedAccounts } = hre;
  const { deployer } = await getNamedAccounts();
  const { deploy } = deployments;
  const signers = await ethers.getSigners();

  const guardian = signers[1];
  const managerAdmin = signers[2];

  await deploy("USDX_Pricer", {
    from: deployer,
    contract: "Pricer",
    args: [guardian.address, managerAdmin.address],
    log: true,
  });

  const pricer = await ethers.getContract("USDX_Pricer");

  // Set price to $1
  await pricer.connect(managerAdmin).addPrice(parseUnits("10", 18), "1");
};
deploy_USDXPricer.tags = ["Local", "pricer-USDX"];
export default deploy_USDXPricer;
