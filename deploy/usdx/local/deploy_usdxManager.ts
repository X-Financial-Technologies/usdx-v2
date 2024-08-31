import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import {
  PROD_ORACLE,
  SANCTION_ADDRESS,
  USDC_MAINNET,
} from "../../mainnet_constants";
import { keccak256, parseUnits } from "ethers/lib/utils";
import { BigNumber } from "ethers";
const { ethers } = require("hardhat");

const deploy_USDXManager: DeployFunction = async function (
  hre: HardhatRuntimeEnvironment
) {
  const { deployments, getNamedAccounts } = hre;
  const { deployer } = await getNamedAccounts();
  const { deploy } = deployments;
  const signers = await ethers.getSigners();

  const guardian = signers[1];
  const managerAdmin = signers[2];
  const pauser = signers[3];
  const assetSender = signers[4];
  const feeRecipient = signers[5];
  const instantMintAdmin = signers[6];
  const relayer = signers[7];

  const USDX = await ethers.getContract("USDX");
  const blocklist = await ethers.getContract("Blocklist");

  await deploy("USDXManager", {
    from: deployer,
    args: [
      USDC_MAINNET,
      USDX.address,
      managerAdmin.address,
      pauser.address,
      assetSender.address,
      feeRecipient.address,
      parseUnits("1000", 6),
      parseUnits("10", 18),
      blocklist.address,
      SANCTION_ADDRESS,
    ],
    log: true,
  });

  const USDXManager = await ethers.getContract("USDXManager");
  const pricer = await ethers.getContract("USDX_Pricer");

  // Grant minting role to USDX manager
  await USDX
    .connect(guardian)
    .grantRole(
      keccak256(Buffer.from("MINTER_ROLE", "utf-8")),
      USDXManager.address
    );

  // Grant sub-roles to managerAdmin
  await USDXManager
    .connect(managerAdmin)
    .grantRole(
      keccak256(Buffer.from("PRICE_ID_SETTER_ROLE", "utf-8")),
      managerAdmin.address
    );
  await USDXManager
    .connect(managerAdmin)
    .grantRole(
      keccak256(Buffer.from("TIMESTAMP_SETTER_ROLE", "utf-8")),
      managerAdmin.address
    );
  await USDXManager
    .connect(managerAdmin)
    .grantRole(
      keccak256(Buffer.from("PAUSER_ADMIN", "utf-8")),
      managerAdmin.address
    );
  await USDXManager
    .connect(managerAdmin)
    .grantRole(
      keccak256(Buffer.from("RELAYER_ROLE", "utf-8")),
      relayer.address
    );
  await USDXManager.connect(managerAdmin).setPricer(pricer.address);
};

deploy_USDXManager.tags = ["Local", "USDXManager"];
deploy_USDXManager.dependencies = ["USDX"];
export default deploy_USDXManager;
