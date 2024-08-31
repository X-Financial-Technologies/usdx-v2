import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import {
  PROD_ASSET_SENDER_USDX,
  PROD_FEE_RECIPIENT_USDX,
  PROD_MANAGER_ADMIN_USDX,
  PROD_ORACLE,
  PROD_PAUSER_USDX,
  SANCTION_ADDRESS,
  USDC_MAINNET,
  ZERO_ADDRESS,
} from "../../mainnet_constants";
import { parseUnits } from "ethers/lib/utils";
const { ethers } = require("hardhat");

const deploy_USDXManager: DeployFunction = async function (
  hre: HardhatRuntimeEnvironment
) {
  const { deployments, getNamedAccounts } = hre;
  const { deployer } = await getNamedAccounts();
  const { deploy } = deployments;

  const factoryUSDX = await ethers.getContract("USDXFactory");
  const factoryAllow = await ethers.getContract("AllowlistFactory");
  const blocklist = await ethers.getContract("Blocklist");

  const USDXAddress = await factoryUSDX.USDXProxy();
  const allowlistAddress = await factoryAllow.allowlistProxy();

  if (USDXAddress == ZERO_ADDRESS) {
    throw new Error("USDX Token not deployed through factory!");
  }

  await deploy("USDXManager", {
    from: deployer,
    args: [
      USDC_MAINNET, // _collateral
      USDXAddress, // _rwa
      PROD_MANAGER_ADMIN_USDX, // managerAdmin
      PROD_PAUSER_USDX, // pauser
      PROD_ASSET_SENDER_USDX, // _assetSender
      PROD_FEE_RECIPIENT_USDX, // _feeRecipient
      parseUnits("500", 6), // _minimumDepositAmount
      parseUnits("500", 18), // _minimumRedemptionAmount
      blocklist.address, // blocklist
      SANCTION_ADDRESS, // sanctionsList
    ],
    log: true,
  });
};
deploy_USDXManager.tags = ["Prod-USDXManager", "Prod-USDX-4"];
export default deploy_USDXManager;
