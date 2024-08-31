import { task } from "hardhat/config";
import {
  addContract,
  BaseProposalRequestParams,
  proposeFunctionCall,
} from "../utils/defender-helper";
import {
  PROD_GUARDIAN_XMMF,
  PROD_KYC_REGISTRY,
  PROD_XMMF_KYC_GROUP,
} from "../../deploy/mainnet_constants";
import { SUCCESS_CHECK } from "../utils/shell";
import { BigNumber } from "ethers";

task("1-XMMF-prod", "Deploy XMMF from factory contract").setAction(
  async ({}, hre) => {
    // Setup Params
    const name = "XMMFFactory";
    let params: BaseProposalRequestParams = {
      via: PROD_GUARDIAN_XMMF,
      viaType: "Gnosis Safe",
    };

    const XMMFFactory = await hre.ethers.getContract(name);
    const network = await hre.run("getCurrentNetwork");
    const abi = await hre.run("getDeployedContractABI", { contract: name });

    let contract = {
      network: network,
      address: XMMFFactory.address,
    };

    // Add XMMF Factory contract to defender
    await addContract(network, XMMFFactory.address, name, abi);
    console.log(SUCCESS_CHECK + "Added Cash Factory to Defender");

    // Propose the deployment in gnosis defender
    params.title = "Deploy XMMF";
    params.description = "Deploy XMMF token from factory";
    await proposeFunctionCall({
      contract: contract,
      params: params,
      functionName: "deployXMMF",
      functionInterface: [
        {
          name: "registry",
          type: "address",
        },
        {
          name: "requirementGroup",
          type: "uint256",
        },
      ],
      functionInputs: [PROD_KYC_REGISTRY, PROD_XMMF_KYC_GROUP],
    });
    console.log(SUCCESS_CHECK + "Proposed XMMF Deployment from factory");
  }
);
