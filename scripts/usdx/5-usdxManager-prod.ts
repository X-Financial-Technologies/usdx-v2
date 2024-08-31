import { task } from "hardhat/config";
import {
  BaseProposalRequestParams,
  addContract,
  proposeGrantRole,
  proposeFunctionCall,
} from "../utils/defender-helper";
import { SUCCESS_CHECK } from "../utils/shell";
import {
  PROD_GUARDIAN_USDX,
  PROD_MANAGER_ADMIN_USDX,
  PROD_PAUSER_USDX,
} from "../../deploy/mainnet_constants";
import { keccak256 } from "ethers/lib/utils";

task(
  "5-USDXManager-prod",
  "Grant MINTER_ROLE to USDXManager, and sets the pricer"
).setAction(async ({}, hre) => {
  const name = "USDXManager";
  const USDXManager = await hre.ethers.getContract(name);

  const pricerName = "USDX_Pricer";
  const pricer = await hre.ethers.getContract(pricerName);
  let params: BaseProposalRequestParams = {
    via: PROD_GUARDIAN_USDX,
    viaType: "Gnosis Safe",
  };
  const network = await hre.run("getCurrentNetwork");
  const abi = await hre.run("getDeployedContractABI", { contract: name });
  const pricerAbi = await hre.run("getDeployedContractABI", {
    contract: pricerName,
  });

  // Add USDXManager to defender
  await addContract(network, USDXManager.address, name, abi);
  console.log(SUCCESS_CHECK + "Added USDXManager to defender");

  // Add pricer to defender
  await addContract(network, pricer.address, pricerName, pricerAbi);
  console.log(SUCCESS_CHECK + "Added pricer to defender");

  const USDX = await hre.ethers.getContract("USDX");
  let USDXContract = {
    network: network,
    address: USDX.address,
  };
  params.title = "Grant MINTER_ROLE to USDXManager on USDX";
  params.description = "Grant MINTER_ROLE to USDXManager";
  await proposeGrantRole({
    params: params,
    contract: USDXContract,
    role: keccak256(Buffer.from("MINTER_ROLE", "utf-8")),
    account: USDXManager.address,
  });
  console.log(
    SUCCESS_CHECK + "Grant MINTER_ROLE to CM Proposal submitted to defender"
  );

  // Grant PAUSER_ROLE to PAUSER MSIG
  params.title = "Grant PAUSER_ROLE to pauser on USDX";
  params.description = "Grant PAUSER_ROLE for USDX";
  await proposeGrantRole({
    params: params,
    contract: USDXContract,
    role: keccak256(Buffer.from("PAUSER_ROLE", "utf-8")),
    account: PROD_PAUSER_USDX,
  });
  console.log(
    SUCCESS_CHECK + "Grant PAUSER_ROLE to pauser Proposal submitted to defender"
  );

  // Set Pricer in USDXManager
  let USDXManagerContract = {
    network: network,
    address: USDXManager.address,
  };
  params.title = "Set Pricer in USDXManager";
  params.description = "Set pricer in USDXManager";
  await proposeFunctionCall({
    contract: USDXManagerContract,
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

  // Grant PRICER_ID_SETTER_ROLE to managerAdmin
  params.title = "Grant Manager Admin PRICE_ID_SETTER_ROLE";
  params.description = "Grant Role to managerAdmin";
  await proposeGrantRole({
    params: params,
    contract: USDXManagerContract,
    role: keccak256(Buffer.from("PRICE_ID_SETTER_ROLE", "utf-8")),
    account: PROD_MANAGER_ADMIN_USDX,
  });
  console.log(
    SUCCESS_CHECK + "Grant PRICE_ID_SETTER_ROLE proposed in Defender"
  );

  // Grant TIMESTAMP_SETTER_ROLE to managerAdmin
  params.title = "Grant Manager Admin TIMESTAMP_SETTER_ROLE";
  params.description = "Grant Role to managerAdmin";
  await proposeGrantRole({
    params: params,
    contract: USDXManagerContract,
    role: keccak256(Buffer.from("TIMESTAMP_SETTER_ROLE", "utf-8")),
    account: PROD_MANAGER_ADMIN_USDX,
  });
  console.log(
    SUCCESS_CHECK + "Grant TIMESTAMP_SETTER_ROLE proposed in Defender"
  );

  // Grant PAUSER_ROLE to managerAdmin
  params.title = "Grant Manager Admin PAUSER_ROLE";
  params.description = "Grant Role to managerAdmin";
  await proposeGrantRole({
    params: params,
    contract: USDXManagerContract,
    role: keccak256(Buffer.from("PAUSER_ROLE", "utf-8")),
    account: PROD_PAUSER_USDX,
  });
  console.log(SUCCESS_CHECK + "Grant PAUSER_ROLE proposed in Defender");

  // Grant LIST_CONFIGURER_ROLE to managerAdmin
  params.title = "Grant Manager Admin LIST_CONFIGURER_ROLE";
  params.description = "Grant Role to managerAdmin";
  await proposeGrantRole({
    params: params,
    contract: USDXManagerContract,
    role: keccak256(Buffer.from("LIST_CONFIGURER_ROLE", "utf-8")),
    account: PROD_MANAGER_ADMIN_USDX,
  });
  console.log(
    SUCCESS_CHECK + "Grant LIST_CONFIGURER_ROLE proposed in Defender"
  );

  // Grant RELAYER_ROLE to managerAdmin
  params.title = "Grant Manager Admin RELAYER_ROLE";
  params.description = "Grant Role to managerAdmin";
  await proposeGrantRole({
    params: params,
    contract: USDXManagerContract,
    role: keccak256(Buffer.from("RELAYER_ROLE", "utf-8")),
    account: PROD_MANAGER_ADMIN_USDX,
  });
  console.log(SUCCESS_CHECK + "Grant RELAYER_ROLE proposed in Defender");
});
