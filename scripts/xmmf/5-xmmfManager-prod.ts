import { task } from "hardhat/config";
import {
  BaseProposalRequestParams,
  addContract,
  proposeGrantRole,
  proposeFunctionCall,
} from "../utils/defender-helper";
import { SUCCESS_CHECK } from "../utils/shell";
import {
  PROD_GUARDIAN_XMMF,
  PROD_MANAGER_ADMIN_XMMF,
} from "../../deploy/mainnet_constants";
import { keccak256 } from "ethers/lib/utils";

task(
  "5-XMMFManager-prod",
  "Grant MINTER_ROLE to XMMFManager, and sets the pricer"
).setAction(async ({}, hre) => {
  const name = "XMMFManager";
  const XMMFManager = await hre.ethers.getContract(name);
  let params: BaseProposalRequestParams = {
    via: PROD_GUARDIAN_XMMF,
    viaType: "Gnosis Safe",
  };
  const network = await hre.run("getCurrentNetwork");
  const abi = await hre.run("getDeployedContractABI", { contract: name });

  // Add XMMFManager to defender
  await addContract(network, XMMFManager.address, name, abi);
  console.log(SUCCESS_CHECK + "Added XMMFManager to Defender");

  // Grant MINTER_ROLE to XMMFManager on XMMF
  const XMMF = await hre.ethers.getContract("XMMF");
  let XMMFContract = {
    network: network,
    address: XMMF.address,
  };
  params.title = "Grant MINTER_ROLE to XMMFManager on XMMF";
  params.description = "Grant MINTER_ROLE to XMMFManager on XMMF";
  await proposeGrantRole({
    params: params,
    contract: XMMFContract,
    role: keccak256(Buffer.from("MINTER_ROLE", "utf-8")),
    account: XMMFManager.address,
  });
  console.log(
    SUCCESS_CHECK + "Grant XMMFManager Proposal submitted to Defender"
  );

  // Set Pricer in XMMFManager
  const pricer = await hre.ethers.getContract("Pricer");
  let XMMFManagerContract = {
    network: network,
    address: XMMFManager.address,
  };
  params.title = "Set Pricer";
  params.description = "Set pricer in XMMF Manager";
  await proposeFunctionCall({
    contract: XMMFManagerContract,
    params: params,
    functionName: "setPricer",
    functionInterface: [
      {
        type: "address",
        name: "newPricer",
      },
    ],
    functionInputs: [pricer.address],
  });
  console.log(SUCCESS_CHECK + "SetPricer Proposal submitted to Defender");

  const PRICER_ROLE = keccak256(Buffer.from("PRICE_ID_SETTER_ROLE", "utf-8"));
  params.title = "Grant Manager Admin PRICE_ID_SETTER_ROLE";
  params.description = "Grant Role to managerAdmin";
  await proposeGrantRole({
    params: params,
    contract: XMMFManagerContract,
    role: PRICER_ROLE,
    account: PROD_MANAGER_ADMIN_XMMF,
  });
  console.log(
    SUCCESS_CHECK + "Grant PRICE_ID_SETTER_ROLE proposed in Defender"
  );
});
