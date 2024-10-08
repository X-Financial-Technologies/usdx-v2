/**SPDX-License-Identifier: BUSL-1.1

X FINANCIAL TECHNOLOGIES
 
*/

import "contracts/external/openzeppelin/contracts/token/IERC20.sol";

pragma solidity 0.8.16; // latest available for using OZ

interface IXMMF is IERC20 {
  function getPooledCashByShares(uint256) external view returns (uint256);

  function getSharesByPooledCash(uint256) external view returns (uint256);

  function submit(address _referral) external payable returns (uint256);
}
