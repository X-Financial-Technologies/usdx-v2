import { task } from "hardhat/config";
import {
  assertAgainstBlockchain,
  assertRoleMembers,
} from "../../utils/helpers";

import USDX_config from "./config";

task(
  "check-USDX-rwaOracle-rateCheck",
  "Checks if USDX RWAOracleRateCheck is configured correctly"
).setAction(async ({}, hre) => {
  console.log("hre.network.name ", hre.network.name);
  const config = USDX_config.rwaOracleRateCheck;
  const rwaOracleRateCheckAddress = config.rwaOracleRateCheckAddress;
  const rwaOracleRateCheckStorage = config.storage;
  const rwaOracleRateCheckContract = await hre.ethers.getContractAt(
    "RWAOracleRateCheck",
    rwaOracleRateCheckAddress
  );

  // Assert role members
  const roleMembers = rwaOracleRateCheckStorage.roleMembers;
  await assertRoleMembers(
    rwaOracleRateCheckContract,
    rwaOracleRateCheckStorage["DEFAULT_ADMIN_ROLE"],
    roleMembers.defaultAdminRoleMembers
  );
  await assertRoleMembers(
    rwaOracleRateCheckContract,
    rwaOracleRateCheckStorage["SETTER_ROLE"],
    roleMembers.setterRoleMembers
  );

  // Check data
  for (const name in rwaOracleRateCheckStorage.oracleData) {
    await assertAgainstBlockchain(
      rwaOracleRateCheckContract,
      name,
      rwaOracleRateCheckStorage.oracleData
    );
  }
});
