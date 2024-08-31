/**SPDX-License-Identifier: BUSL-1.1

X FINANCIAL TECHNOLOGIES
 
*/

import "contracts/external/openzeppelin/contracts/token/IERC20.sol";

pragma solidity 0.8.16; // latest available for using OZ

interface IWXMMF is IERC20 {
  function wrap(uint256 _XMMFAmount) external;

  function unwrap(uint256 _wXMMFAmount) external;

  function getwXMMFByXMMF(uint256 _XMMFAmount) external view returns (uint256);

  function getXMMFbywXMMF(uint256 _wXMMFAmount) external view returns (uint256);
}
