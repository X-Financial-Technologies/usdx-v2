import { task, types } from "hardhat/config";
import { addContract } from "../utils/defender-helper";
import { SUCCESS_CHECK } from "../utils/shell";

task("2-save-cash-prod", "Save XMMF Contract and Add to Defender").setAction(
  async ({}, hre) => {
    const { save } = hre.deployments;
    const XMMFFactory = await hre.ethers.getContract("XMMFFactory");
    const XMMFProxy = await XMMFFactory.XMMFProxy();
    const XMMFProxyAdmin = await XMMFFactory.XMMFProxyAdmin();

    const XMMFArtifact = await hre.deployments.getExtendedArtifact("XMMF");
    const paArtifact = await hre.deployments.getExtendedArtifact("ProxyAdmin");

    let XMMF = {
      address: XMMFProxy,
      ...XMMFArtifact,
    };
    let proxyAdmin = {
      address: XMMFProxyAdmin,
      ...paArtifact,
    };

    await save("XMMF", XMMF);
    await save("ProxyAdminXMMF", proxyAdmin);

    const abiXMMF = await hre.run("getDeployedContractABI", {
      contract: "XMMF",
    });
    const abiPA = await hre.run("getDeployedContractABI", {
      contract: "ProxyAdminXMMF",
    });

    const network = await hre.run("getCurrentNetwork");

    await addContract(network, XMMFProxy, "XMMF Proxy", abiXMMF);
    console.log(SUCCESS_CHECK + "Added XMMF Proxy to defender");
    await addContract(network, XMMFProxyAdmin, "XMMF Proxy Admin", abiPA);
    console.log(SUCCESS_CHECK + "Added XMMF Proxy Admin to defender");
  }
);
