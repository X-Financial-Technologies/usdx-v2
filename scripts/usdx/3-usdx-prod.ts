import { task } from "hardhat/config";
import {
  addContract,
  BaseProposalRequestParams,
  proposeFunctionCall,
} from "../utils/defender-helper";
import {
  PROD_GUARDIAN_USDX,
  SANCTION_ADDRESS,
} from "../../deploy/mainnet_constants";
import { SUCCESS_CHECK } from "../utils/shell";

task("3-USDX-prod", "Deploy USDX from factory contract").setAction(
  async ({}, hre) => {
    const name = "USDXFactory";
    let params: BaseProposalRequestParams = {
      via: PROD_GUARDIAN_USDX,
      viaType: "Gnosis Safe",
    };

    const USDXFactory = await hre.ethers.getContract(name);
    const blocklist = await hre.ethers.getContract("Blocklist");
    const allowlist = await hre.ethers.getContract("Allowlist");
    const network = await hre.run("getCurrentNetwork");
    const abi = await hre.run("getDeployedContractABI", { contract: name });

    let contract = {
      network: network,
      address: USDXFactory.address,
    };

    // Add USDX Factory contract to defender
    await addContract(network, USDXFactory.address, name, abi);
    console.log(SUCCESS_CHECK + "Added USDX Factory to Defender");

    // Propose the deployment in gnosis defender
    params.title = "Deploy USDX";
    params.description = "Deploy USDX token from factory";
    let listData = [blocklist.address, allowlist.address, SANCTION_ADDRESS];
    await proposeFunctionCall({
      contract: contract,
      params: params,
      functionName: "deployUSDX",
      functionInterface: [
        {
          name: "name",
          type: "string",
        },
        {
          name: "ticker",
          type: "string",
        },
        {
          components: [
            {
              name: "blocklist",
              type: "address",
            },
            {
              name: "allowlist",
              type: "address",
            },
            {
              name: "sanctionsList",
              type: "address",
            },
          ],
          name: "listData",
          type: "tuple",
        },
      ],
      functionInputs: ["Ondo U.S. Dollar Yield", "USDX", listData],
    });
    console.log(SUCCESS_CHECK + "Proposed USDX Deployment from factory");
  }
);
