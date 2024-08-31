/**SPDX-License-Identifier: BUSL-1.1

X FINANCIAL TECHNOLOGIES
 
*/
pragma solidity 0.8.16;

// Proxy admin contract used in OZ upgrades plugin
import "contracts/external/openzeppelin/contracts/proxy/ProxyAdmin.sol";
import "contracts/Proxy.sol";
import "contracts/USDX/USDX.sol";
import "contracts/interfaces/IMulticall.sol";

/**
 * @title USDXFactory
 * @author X Financial Technologies
 * @notice This contract serves as a Factory for the upgradable USDX token contract.
 *         Upon calling `deployUSDX` the `guardian` address (set in constructor) will
 *         deploy the following:
 *         1) USDX - The implementation contract, ERC20 contract with the initializer disabled
 *         2) ProxyAdmin - OZ ProxyAdmin contract, used to upgrade the proxy instance.
 *                         @notice Owner is set to `guardian` address.
 *         3) TransparentUpgradeableProxy - OZ, proxy contract. Admin is set to `address(proxyAdmin)`.
 *                                          `_logic' is set to `address(cash)`.
 *
 *         Following the above mentioned deployment, the address of the CashFactory contract will:
 *         i) Grant the `DEFAULT_ADMIN_ROLE` & PAUSER_ROLE to the `guardian` address
 *         ii) Revoke the `MINTER_ROLE`, `PAUSER_ROLE` & `DEFAULT_ADMIN_ROLE` from address(this).
 *         iii) Transfer ownership of the ProxyAdmin to that of the `guardian` address.
 *
 * @notice `guardian` address in constructor is a msig.
 */
contract USDXFactory is IMulticall {
  struct USDXListData {
    address blocklist;
    address allowlist;
    address sanctionsList;
  }

  bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
  bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
  bytes32 public constant DEFAULT_ADMIN_ROLE = bytes32(0);

  address internal immutable guardian;
  USDX public USDXImplementation;
  ProxyAdmin public USDXProxyAdmin;
  TokenProxy public USDXProxy;

  constructor(address _guardian) {
    guardian = _guardian;
  }

  /**
   * @dev This function will deploy an upgradable instance of USDX
   *
   * @param name   The name of the token we want to deploy.
   * @param ticker The ticker for the token we want to deploy.
   *
   * @return address The address of the proxy contract.
   * @return address The address of the proxyAdmin contract.
   * @return address The address of the implementation contract.
   *
   * @notice 1) Will automatically revoke all deployer roles granted to
   *            address(this).
   *         2) Will grant DEFAULT_ADMIN & PAUSER_ROLE(S) to `guardian`
   *            address specified in constructor.
   *         3) Will transfer ownership of the proxyAdmin to guardian
   *            address.
   *
   */
  function deployUSDX(
    string calldata name,
    string calldata ticker,
    USDXListData calldata listData
  ) external onlyGuardian returns (address, address, address) {
    USDXImplementation = new USDX();
    USDXProxyAdmin = new ProxyAdmin();
    USDXProxy = new TokenProxy(
      address(USDXImplementation),
      address(USDXProxyAdmin),
      ""
    );
    USDX USDXProxied = USDX(address(USDXProxy));
    USDXProxied.initialize(
      name,
      ticker,
      listData.blocklist,
      listData.allowlist,
      listData.sanctionsList
    );

    USDXProxied.grantRole(DEFAULT_ADMIN_ROLE, guardian);
    USDXProxied.grantRole(PAUSER_ROLE, guardian);

    USDXProxied.revokeRole(MINTER_ROLE, address(this));
    USDXProxied.revokeRole(PAUSER_ROLE, address(this));
    USDXProxied.revokeRole(DEFAULT_ADMIN_ROLE, address(this));

    USDXProxyAdmin.transferOwnership(guardian);
    assert(USDXProxyAdmin.owner() == guardian);
    emit USDXDeployed(
      address(USDXProxied),
      address(USDXProxyAdmin),
      address(USDXImplementation),
      name,
      ticker,
      listData
    );

    return (
      address(USDXProxied),
      address(USDXProxyAdmin),
      address(USDXImplementation)
    );
  }

  /**
   * @notice Allows for arbitrary batched calls
   *
   * @dev All external calls made through this function will
   *      msg.sender == contract address
   *
   * @param exCallData Struct consisting of
   *       1) target - contract to call
   *       2) data - data to call target with
   *       3) value - eth value to call target with
   */
  function multiexcall(
    ExCallData[] calldata exCallData
  ) external payable override onlyGuardian returns (bytes[] memory results) {
    results = new bytes[](exCallData.length);
    for (uint256 i = 0; i < exCallData.length; ++i) {
      (bool success, bytes memory ret) = address(exCallData[i].target).call{
        value: exCallData[i].value
      }(exCallData[i].data);
      require(success, "Call Failed");
      results[i] = ret;
    }
  }

  /**
   * @dev Event emitted when upgradable USDX is deployed
   *
   * @param proxy             The address for the proxy contract
   * @param proxyAdmin        The address for the proxy admin contract
   * @param implementation    The address for the implementation contract
   */
  event USDXDeployed(
    address proxy,
    address proxyAdmin,
    address implementation,
    string name,
    string ticker,
    USDXListData listData
  );

  modifier onlyGuardian() {
    require(msg.sender == guardian, "USDXFactory: You are not the Guardian");
    _;
  }
}
