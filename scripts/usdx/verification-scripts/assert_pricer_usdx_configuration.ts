import { task } from "hardhat/config";
import {
  assertAgainstBlockchain,
  assertRoleMembers,
} from "../../utils/helpers";

import USDX_config from "./config";

task(
  "check-USDX-pricer",
  "Checks if USDX pricer is configured correctly"
).setAction(async ({}, hre) => {
  console.log("hre.network.name ", hre.network.name);
  const jsonData = JSON.parse(JSON.stringify(USDX_config.USDX_pricer));
  const USDXPricerStorage = jsonData["storage"];
  const USDXPricerContract = await hre.ethers.getContractAt(
    "Pricer",
    jsonData.USDXPricerAddress
  );

  // Assert role members
  const USDXPricerRoleMembers = jsonData["USDXPricerRoleMembers"];
  await assertRoleMembers(
    USDXPricerContract,
    USDXPricerStorage.DEFAULT_ADMIN_ROLE,
    USDXPricerRoleMembers.defaultAdminRoleMembers
  );
  await assertRoleMembers(
    USDXPricerContract,
    USDXPricerStorage.PRICE_UPDATE_ROLE,
    USDXPricerRoleMembers.priceUpdateRoleMembers
  );

  // Check data
  for (const name in USDXPricerStorage) {
    await assertAgainstBlockchain(USDXPricerContract, name, USDXPricerStorage);
  }
});
