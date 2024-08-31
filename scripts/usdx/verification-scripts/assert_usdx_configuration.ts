import { assert } from "console";
import {
  ADMIN_SLOT,
  ROLLBACK_SLOT,
  IMPLEMENTATION_SLOT,
  BEACON_SLOT,
} from "../../utils/constants";
import {
  assertAgainstBlockchain,
  assertRoleMembers,
  addressFromStorageSlot,
} from "../../utils/helpers";
import USDX_config from "./config";
import { task } from "hardhat/config";
import { FAILURE_CROSS } from "../../utils/shell";

task(
  "check-USDX",
  "Checks if USDX contract has been properly initialized"
).setAction(async ({}, hre) => {
  console.log("hre.network.name ", hre.network.name);
  const ethers = hre.ethers;
  const jsonData = JSON.parse(JSON.stringify(USDX_config.USDX));
  const USDXProxyData = jsonData["USDXProxy"];

  // Assert Proxy Admin slots
  assert(
    (await addressFromStorageSlot(jsonData["USDXProxyAddress"], ADMIN_SLOT)) ==
      USDXProxyData.proxyAdmin,
    FAILURE_CROSS + "proxy admin mismatch"
  );

  assert(
    (await addressFromStorageSlot(
      jsonData["USDXProxyAddress"],
      ROLLBACK_SLOT
    )) == USDXProxyData.rollback,
    FAILURE_CROSS + "proxy rollback mismatch"
  );

  assert(
    (await addressFromStorageSlot(jsonData["USDXProxyAddress"], BEACON_SLOT)) ==
      USDXProxyData.beacon,
    FAILURE_CROSS + "proxy beacon mismatch"
  );

  assert(
    (await addressFromStorageSlot(
      jsonData["USDXProxyAddress"],
      IMPLEMENTATION_SLOT
    )) == USDXProxyData.implementation,
    FAILURE_CROSS + "proxy impl mismatch"
  );

  // Assert USDX Proxy Admin
  const USDXProxyAdminContract = await ethers.getContractAt(
    "ProxyAdmin",
    USDXProxyData.proxyAdmin
  );

  assert(
    (await USDXProxyAdminContract.getProxyAdmin(jsonData.USDXProxyAddress)) ==
      USDXProxyAdminContract.address,
    "getProxyAdmin failed on the proxy admin contract"
  );

  assert(
    (await USDXProxyAdminContract.getProxyImplementation(
      jsonData.USDXProxyAddress
    )) == USDXProxyData.implementation,
    "getProxyImplementation failed on the proxy admin contract"
  );

  assert(
    (await USDXProxyAdminContract.owner()) == jsonData["USDXProxyAdmin"].owner,
    "Proxy admin owner check failed on the proxy admin contract"
  );

  const USDXProxyContract = await ethers.getContractAt(
    "USDX",
    jsonData.USDXProxyAddress
  );

  // Assert Role Members
  const USDXRoleMembers = jsonData["USDXProxyRoleMembers"];
  await assertRoleMembers(
    USDXProxyContract,
    USDXProxyData.DEFAULT_ADMIN_ROLE,
    USDXRoleMembers.defaultAdminRoleMembers
  );

  await assertRoleMembers(
    USDXProxyContract,
    USDXProxyData.BURNER_ROLE,
    USDXRoleMembers.burnerRoleMembers
  );

  await assertRoleMembers(
    USDXProxyContract,
    USDXProxyData.LIST_CONFIGURER_ROLE,
    USDXRoleMembers.listConfigurerRoleMembers
  );

  await assertRoleMembers(
    USDXProxyContract,
    USDXProxyData.MINTER_ROLE,
    USDXRoleMembers.minterRoleMembers
  );

  await assertRoleMembers(
    USDXProxyContract,
    USDXProxyData.PAUSER_ROLE,
    USDXRoleMembers.pauserRoleMembers
  );

  // Assert the storage values for the proxy contract that pertain to
  // implementation contract
  for (const name in USDXProxyData.implementationStorage) {
    await assertAgainstBlockchain(
      USDXProxyContract,
      name,
      USDXProxyData.implementationStorage
    );
  }
});
