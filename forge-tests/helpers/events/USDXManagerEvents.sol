pragma solidity 0.8.16;

contract USDXManagerEvents {
  event ClaimableTimestampSet(
    uint256 indexed claimDate,
    bytes32 indexed depositId
  );
}
