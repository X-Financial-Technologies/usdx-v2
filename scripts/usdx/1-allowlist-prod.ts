import { task } from "hardhat/config";
import {
  addContract,
  BaseProposalRequestParams,
  proposeFunctionCall,
} from "../utils/defender-helper";
import { PROD_GUARDIAN_USDX } from "../../deploy/mainnet_constants";
import { SUCCESS_CHECK } from "../utils/shell";

task("1-USDX-prod", "Deploy OMMF from factory contract").setAction(
  async ({}, hre) => {
    const name = "AllowlistFactory";
    let params: BaseProposalRequestParams = {
      via: PROD_GUARDIAN_USDX,
      viaType: "Gnosis Safe",
    };

    const USDXFactory = await hre.ethers.getContract(name);
    const network = await hre.run("getCurrentNetwork");
    const abi = await hre.run("getDeployedContractABI", { contract: name });

    let contract = {
      network: network,
      address: USDXFactory.address,
    };

    // Add USDX Factory contract to defender
    await addContract(network, USDXFactory.address, name, abi);
    console.log(SUCCESS_CHECK + "Added Allowlist Factory to Defender");

    // Propose the deployment in gnosis defender
    params.title = "Deploy Allowlist";
    params.description = "Deploy Allowlist from factory";
    await proposeFunctionCall({
      contract: contract,
      params: params,
      functionName: "deployAllowlist",
      functionInterface: [
        {
          name: "admin",
          type: "address",
        },
        {
          name: "setter",
          type: "address",
        },
      ],
      functionInputs: [PROD_GUARDIAN_USDX, PROD_GUARDIAN_USDX],
    });
    console.log(SUCCESS_CHECK + "Propose Allowlist deploy from factory");
  }
);
