/**SPDX-License-Identifier: BUSL-1.1

X FINANCIAL TECHNOLOGIES
 
*/
pragma solidity 0.8.16;

interface IRWAOracle {
  /// @notice Retrieve RWA price data
  function getPriceData()
    external
    view
    returns (uint256 price, uint256 timestamp);
}
