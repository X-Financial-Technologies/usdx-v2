import { task, types } from "hardhat/config";
import { addContract } from "../utils/defender-helper";
import { SUCCESS_CHECK } from "../utils/shell";

task("4-save-wXMMF-prod", "Safe WXMMF Contract and Add to Defender").setAction(
  async ({}, hre) => {
    const { save } = hre.deployments;
    const wXMMFFactory = await hre.ethers.getContract("WXMMFFactory");
    const wXMMFProxy = await wXMMFFactory.wXMMFProxy();
    const wXMMFProxyAdmin = await wXMMFFactory.wXMMFProxyAdmin();

    const wXMMFArtifact = await hre.deployments.getExtendedArtifact("WXMMF");
    const paArtifact = await hre.deployments.getExtendedArtifact("ProxyAdmin");

    let wXMMF = {
      address: wXMMFProxy,
      ...wXMMFArtifact,
    };
    let proxyAdmin = {
      address: wXMMFProxyAdmin,
      ...paArtifact,
    };

    await save("WXMMF", wXMMF);
    await save("ProxyAdminWXMMF", proxyAdmin);

    const abiWXMMF = await hre.run("getDeployedContractABI", {
      contract: "WXMMF",
    });
    const abiPA = await hre.run("getDeployedContractABI", {
      contract: "ProxyAdminWXMMF",
    });

    const network = await hre.run("getCurrentNetwork");

    await addContract(network, wXMMFProxy, "WXMMF Proxy", abiWXMMF);
    console.log(SUCCESS_CHECK + "Added WXMMF Proxy to defender");
    await addContract(network, wXMMFProxyAdmin, "WXMMF Proxy Admin", abiPA);
    console.log(SUCCESS_CHECK + "Added XMMF Proxy Admin to defender");
  }
);
