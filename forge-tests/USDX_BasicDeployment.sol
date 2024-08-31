pragma solidity 0.8.16;

import "forge-tests/BaseTestRunner.sol";
import "contracts/USDX/allowlist/AllowlistFactory.sol";
import "forge-tests/helpers/events/USDXManagerEvents.sol";
import "contracts/external/openzeppelin/contracts/proxy/ProxyAdmin.sol";
import "contracts/USDX/USDXManager.sol";
import "contracts/USDX/USDX.sol";
import "contracts/USDX/USDXFactory.sol";
import "contracts/Pricer.sol";
import "contracts/USDX/allowlist/AllowlistUpgradeable.sol";
import "contracts/USDX/blocklist/Blocklist.sol";
import "contracts/Proxy.sol";
import "forge-tests/USDX/allowlist/AllowlistUpgradeable_BasicDeployment.sol";
import "contracts/external/chainalysis/ISanctionsList.sol";
import "forge-tests/helpers/MockSanctionsOracle.sol";

abstract contract USDX_BasicDeployment is
  BaseTestRunner,
  AllowlistUpgradeable_BasicDeployment,
  USDXManagerEvents
{
  Blocklist blocklist;
  ISanctionsList sanctionsList;
  // USDX Contract Array
  USDX USDX; // Proxy with abi of implementation
  TokenProxy USDXProxy;
  ProxyAdmin USDXProxyAdmin;
  USDX USDXImplementation;
  USDXFactory USDXFactory;

  // USDX Manager Contracts
  USDXManager USDXManager;
  Pricer pricerUSDX;
  DeltaCheckHarness oracleCheckHarnessUSDX;

  address[] public accountsTmp;

  function setUp() public virtual override {
    // Heavily order dependent call flow
    _deployAllowlist();
    _deployBlocklist();
    _deploySanctionsList();
    _deployUSDX();
    _deployUSDXPricer();
    _deployUSDXManager();
    _postDeployActions();
  }

  function _deployBlocklist() internal {
    blocklist = new Blocklist();
  }

  function _deploySanctionsList() internal {
    sanctionsList = new MockSanctionsOracle();
  }

  function _deployUSDX() internal {
    USDXFactory = new USDXFactory(guardian);
    USDXFactory.USDXListData memory USDXListData;
    USDXListData.allowlist = address(allowlist);
    USDXListData.blocklist = address(blocklist);
    USDXListData.sanctionsList = address(sanctionsList);

    vm.prank(guardian);
    (address proxy, address proxyAdmin, address implementation) = USDXFactory
      .deployUSDX("USDX", "USDX", USDXListData);

    USDX = USDX(proxy);
    USDXProxy = TokenProxy(payable(proxy));
    USDXProxyAdmin = ProxyAdmin(proxyAdmin);
    USDXImplementation = USDX(implementation);
    vm.prank(guardian);
    USDX.grantRole(keccak256("MINTER_ROLE"), guardian);
  }

  function _deployUSDXPricer() internal {
    oracleCheckHarnessUSDX = new DeltaCheckHarness();
    oracleCheckHarnessUSDX.setPrice(1e18);
    pricerUSDX = new Pricer(
      guardian, // Admin
      address(this) // Price Update operator
    );
    // Add a price
    pricerUSDX.addPrice(1e18, block.timestamp);
  }

  function _deployUSDXManager() internal virtual {
    USDXManager = new USDXManager(
      address(USDC),
      address(USDX),
      managerAdmin,
      pauser,
      assetSender,
      feeRecipient,
      100e6, // minimum deposit amount
      100e18, // minimum redemption amount
      address(blocklist),
      address(sanctionsList)
    );
    vm.startPrank(guardian);
    USDX.grantRole(USDX.MINTER_ROLE(), address(USDXManager));
    vm.stopPrank();

    vm.startPrank(managerAdmin);
    USDXManager.grantRole(USDXManager.PRICE_ID_SETTER_ROLE(), managerAdmin);
    USDXManager.grantRole(USDXManager.TIMESTAMP_SETTER_ROLE(), managerAdmin);
    USDXManager.grantRole(USDXManager.PAUSER_ADMIN(), managerAdmin);

    USDXManager.setPricer(address(pricerUSDX));
    USDXManager.grantRole(USDXManager.RELAYER_ROLE(), relayer);
    vm.stopPrank();
  }

  function _postDeployActions() internal {
    // Set general variables for rwa tests
    _setRwaHub(address(USDXManager));
    _setRwa(address(USDX));
    _setPricer(address(pricerUSDX));
    _setOracleCheckHarness(address(oracleCheckHarnessUSDX));

    // Allowlist
    _addAccountToAllowlistCurrentTerm(guardian);
    _addAccountToAllowlistCurrentTerm(alice);
    _addAccountToAllowlistCurrentTerm(address(rwaHub));

    // Labels
    vm.label(guardian, "guardian");
    vm.label(address(USDC), "USDC");
  }

  /*//////////////////////////////////////////////////////////////
                             Utils
  //////////////////////////////////////////////////////////////*/

  function _addToBlocklist(address user) internal {
    accountsTmp.push(user);
    blocklist.addToBlocklist(accountsTmp);
  }

  function _addToSanctionsList(address user) internal {
    MockSanctionsOracle(address(sanctionsList)).addAddress(user);
  }

  function _initializeUSDXUsersArray() internal {
    for (uint256 i = 0; i < 300; i++) {
      address user = address(new User());
      users.push(user);
      _addAccountToAllowlistCurrentTerm(user);
    }
  }
}
