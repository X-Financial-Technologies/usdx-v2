import { task, types } from "hardhat/config";
import { addContract } from "../utils/defender-helper";
import { SUCCESS_CHECK } from "../utils/shell";

task("4-save-USDX-prod", "Save USDX and Add to Defender").setAction(
  async ({}, hre) => {
    const { save } = hre.deployments;
    const USDXFactory = await hre.ethers.getContract("USDXFactory");
    const USDXProxy = await USDXFactory.USDXProxy();
    const USDXPa = await USDXFactory.USDXProxyAdmin();

    const USDXArtifact = await hre.deployments.getExtendedArtifact("USDX");
    const paAtrifact = await hre.deployments.getExtendedArtifact("ProxyAdmin");

    let USDXProxied = {
      address: USDXProxy,
      ...USDXArtifact,
    };
    let USDXAdmin = {
      address: USDXPa,
      ...paAtrifact,
    };

    await save("USDX", USDXProxied);
    await save("ProxyAdminUSDX", USDXAdmin);

    const abiUSDX = await hre.run("getDeployedContractABI", {
      contract: "USDX",
    });
    const abiPA = await hre.run("getDeployedContractABI", {
      contract: "ProxyAdminUSDX",
    });

    const network = await hre.run("getCurrentNetwork");

    await addContract(network, USDXProxy, "USDX Proxy", abiUSDX);
    console.log(SUCCESS_CHECK + "Added USDX Proxy to Defender");
    await addContract(network, USDXPa, "USDX Proxy Admin", abiPA);
    console.log(SUCCESS_CHECK + "Added USDX Proxy Admin to Defender");
  }
);
