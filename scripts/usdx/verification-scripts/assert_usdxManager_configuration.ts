import {
  assertAgainstBlockchain,
  assertRoleMembers,
} from "../../utils/helpers";
import { task } from "hardhat/config";

import USDX_config from "./config";

task(
  "check-USDX-manager",
  "Checks if USDXManager has been properly initialized"
).setAction(async ({}, hre) => {
  console.log("hre.network.name ", hre.network.name);
  const ethers = hre.ethers;
  const jsonData = JSON.parse(JSON.stringify(USDX_config.USDXManager));
  const USDXManagerStorage = jsonData["storage"];

  const USDXManagerContract = await ethers.getContractAt(
    "USDXManager",
    jsonData.USDXManagerAddress
  );

  // Assert Role Members
  const USDXManagerRoleMembers = jsonData["USDXManagerRoleMembers"];
  await assertRoleMembers(
    USDXManagerContract,
    USDXManagerStorage.DEFAULT_ADMIN_ROLE,
    USDXManagerRoleMembers.defaultAdminRoleMembers
  );

  await assertRoleMembers(
    USDXManagerContract,
    USDXManagerStorage.MANAGER_ADMIN,
    USDXManagerRoleMembers.managerAdminRoleMembers
  );

  await assertRoleMembers(
    USDXManagerContract,
    USDXManagerStorage.PAUSER_ADMIN,
    USDXManagerRoleMembers.pauserAdminRoleMembers
  );

  await assertRoleMembers(
    USDXManagerContract,
    USDXManagerStorage.PRICE_ID_SETTER_ROLE,
    USDXManagerRoleMembers.priceIDSetterRoleMembers
  );

  await assertRoleMembers(
    USDXManagerContract,
    USDXManagerStorage.RELAYER_ROLE,
    USDXManagerRoleMembers.relayerRoleMembers
  );

  await assertRoleMembers(
    USDXManagerContract,
    USDXManagerStorage.TIMESTAMP_SETTER_ROLE,
    USDXManagerRoleMembers.timestampSetterRoleMembers
  );

  // Assert the storage values for the contract
  for (const name in USDXManagerStorage) {
    await assertAgainstBlockchain(
      USDXManagerContract,
      name,
      USDXManagerStorage
    );
  }
});
