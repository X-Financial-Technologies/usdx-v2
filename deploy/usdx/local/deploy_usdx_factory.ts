import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { KYC_REGISTRY, SANCTION_ADDRESS } from "../../mainnet_constants";
const { ethers } = require("hardhat");

const deployAllowList_Factory: DeployFunction = async function (
  hre: HardhatRuntimeEnvironment
) {
  const { deployments, getNamedAccounts } = hre;
  const { save } = deployments;
  const { deployer } = await getNamedAccounts();
  const { deploy } = deployments;
  const signers = await ethers.getSigners();

  const guardian = signers[1];

  await deploy("USDXFactory", {
    from: deployer,
    args: [guardian.address],
    log: true,
  });

  // USDX deps
  const factory = await ethers.getContract("USDXFactory");
  const blocklist = await ethers.getContract("Blocklist");
  const allowlist = await ethers.getContract("Allowlist");

  await factory
    .connect(guardian)
    .deployUSDX("USDX", "USDX", [
      blocklist.address,
      allowlist.address,
      SANCTION_ADDRESS,
    ]);

  const USDXProxy = await factory.USDXProxy();
  const USDXProxyAdmin = await factory.USDXProxyAdmin();
  const USDXImplementation = await factory.USDXImplementation();

  console.log(`\nThe USDX proxy is deployed @: ${USDXProxy}`);
  console.log(`The USDX proxy admin is deployed @: ${USDXProxyAdmin}`);
  console.log(`The USDX Implementation is deployed @: ${USDXImplementation}\n`);

  const USDXArtifact = await deployments.getExtendedArtifact("USDX");
  const paAtrifact = await deployments.getExtendedArtifact("ProxyAdmin");

  let USDXProxied = {
    address: USDXProxy,
    ...USDXArtifact,
  };
  let USDXAdmin = {
    address: USDXProxyAdmin,
    ...USDXProxyAdmin,
  };
  let USDXImpl = {
    address: USDXImplementation,
    ...USDXImplementation,
  };

  await save("USDX", USDXProxied);
  await save("ProxyAdminUSDX", USDXAdmin);
  await save("USDXImplementation", USDXImpl);
};

deployAllowList_Factory.tags = ["Local", "USDX"];
export default deployAllowList_Factory;
