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

task("3-wXMMF-prod", "Deploy WXMMF from factory Contract").setAction(
  async ({}, hre) => {
    const name = "WXMMFFactory";
    let params: BaseProposalRequestParams = {
      via: PROD_GUARDIAN_XMMF,
      viaType: "Gnosis Safe",
    };

    const wXMMFFactory = await hre.ethers.getContract(name);
    const network = await hre.run("getCurrentNetwork");
    const abi = await hre.run("getDeployedContractABI", { contract: name });

    let contract = {
      network: network,
      address: wXMMFFactory.address,
    };

    const XMMF = await hre.ethers.getContract("XMMF");

    await addContract(network, wXMMFFactory.address, name, abi);
    console.log(SUCCESS_CHECK + "Added Cash Factory to Defender");

    // Propose the deployment in gnosis defender
    params.title = "Deploy WXMMF";
    params.description = "Deploy WXMMF token from factory";
    await proposeFunctionCall({
      contract: contract,
      params: params,
      functionName: "deployWXMMF",
      functionInterface: [
        {
          type: "string",
          name: "name",
        },
        {
          type: "string",
          name: "ticker",
        },
        {
          type: "address",
          name: "XMMFAddress",
        },
        {
          type: "address",
          name: "registry",
        },
        {
          type: "uint256",
          name: "requirementGroup",
        },
      ],
      functionInputs: [
        "Wrapped XMMF",
        "WXMMF",
        XMMF.address,
        PROD_KYC_REGISTRY,
        PROD_XMMF_KYC_GROUP,
      ],
    });
    console.log(SUCCESS_CHECK + "Proposed WXMMF Deployment from factory");
  }
);
