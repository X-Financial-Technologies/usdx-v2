pragma solidity 0.8.16;

import {PROD_CONSTANTS_USDX} from "forge-tests/postDeploymentConfig/prod_constants.t.sol";
import "forge-tests/USDX_BasicDeployment.sol";

contract ASSERT_FORK_USDX_PROD is PROD_CONSTANTS_USDX, USDX_BasicDeployment {
  /**
   * @notice INPUT ADDRESSES TO CHECK CONFIG OF BELOW
   *
   * USDX Deployment: 7/11/23
   * Passing on block: 17673284
   */
  address USDX_to_check = 0x96F6eF951840721AdBF46Ac996b59E0235CB985C;
  address USDXManager_to_check = 0x25A103A1D6AeC5967c1A4fe2039cdc514886b97e;

  bytes32 impl_slot =
    bytes32(uint256(keccak256("eip1967.proxy.implementation")) - 1);
  bytes32 admin_slot = bytes32(uint256(keccak256("eip1967.proxy.admin")) - 1);

  function setUp() public override {
    USDX = USDX(USDX_to_check);
    allowlist = AllowlistUpgradeable(address(USDX.allowlist()));
    blocklist = Blocklist(address(USDX.blocklist()));
    sanctionsList = ISanctionsList(USDX.sanctionsList());

    USDXManager = USDXManager(USDXManager_to_check);
    pricerUSDX = Pricer(address(USDXManager.pricer()));
  }

  function test_print_block() public view {
    console.log("The Current Block #: ", block.number);
  }

  function test_fork_assert_USDX_manager() public {
    /**
     * Check USDX Manager
     * 1) Assert Role member count
     * 2) Assert Role
     */
    assertEq(
      USDXManager.getRoleMemberCount(USDXManager.DEFAULT_ADMIN_ROLE()),
      1
    );
    assertEq(
      USDXManager.getRoleMember(USDXManager.DEFAULT_ADMIN_ROLE(), 0),
      PROD_CONSTANTS_USDX.USDXhub_default_admin
    );
    assertEq(USDXManager.getRoleMemberCount(USDXManager.MANAGER_ADMIN()), 1);
    assertEq(
      USDXManager.getRoleMember(USDXManager.MANAGER_ADMIN(), 0),
      PROD_CONSTANTS_USDX.USDXhum_manager_admin
    );
    assertEq(USDXManager.getRoleMemberCount(USDXManager.PAUSER_ADMIN()), 1);
    assertEq(
      USDXManager.getRoleMember(USDXManager.PAUSER_ADMIN(), 0),
      PROD_CONSTANTS_USDX.USDXhub_pauser_admin
    );

    assertEq(
      USDXManager.getRoleMemberCount(USDXManager.PRICE_ID_SETTER_ROLE()),
      1
    );
    assertEq(
      USDXManager.getRoleMember(USDXManager.PRICE_ID_SETTER_ROLE(), 0),
      PROD_CONSTANTS_USDX.USDXhub_price_id_setter_role
    );

    assertEq(USDXManager.getRoleMemberCount(USDXManager.RELAYER_ROLE()), 1);
    assertEq(
      USDXManager.getRoleMember(USDXManager.RELAYER_ROLE(), 0),
      PROD_CONSTANTS_USDX.USDXhub_relayer_role
    );
    // USDX specific role
    assertEq(
      USDXManager.getRoleMemberCount(USDXManager.TIMESTAMP_SETTER_ROLE()),
      1
    );
    assertEq(
      USDXManager.getRoleMember(USDXManager.TIMESTAMP_SETTER_ROLE(), 0),
      PROD_CONSTANTS_USDX.USDXhub_timestamp_setter_role
    );

    // // ASSERT USDX Manager config
    assertEq(USDXManager.assetSender(), PROD_CONSTANTS_USDX.asset_sender);
    assertEq(USDXManager.assetRecipient(), PROD_CONSTANTS_USDX.asset_recipient);
    assertEq(USDXManager.feeRecipient(), PROD_CONSTANTS_USDX.fee_recipient);
    assertEq(address(USDXManager.rwa()), PROD_CONSTANTS_USDX.USDX_asset);
    assertEq(address(USDXManager.collateral()), PROD_CONSTANTS_USDX.collateral);
    assertEq(address(USDXManager.pricer()), PROD_CONSTANTS_USDX.USDX_pricer);
    assertEq(
      USDXManager.minimumDepositAmount(),
      PROD_CONSTANTS_USDX.min_deposit_amt
    );
    assertEq(
      USDXManager.minimumRedemptionAmount(),
      PROD_CONSTANTS_USDX.min_redeem_amt
    );
    assertEq(USDXManager.mintFee(), PROD_CONSTANTS_USDX.mint_fee);
    assertEq(USDXManager.redemptionFee(), PROD_CONSTANTS_USDX.redeem_fee);
    assertEq(
      USDXManager.BPS_DENOMINATOR(),
      PROD_CONSTANTS_USDX.bps_denominator
    );
    assertEq(address(USDXManager.blocklist()), PROD_CONSTANTS_USDX.block_list);
    assertEq(
      address(USDXManager.sanctionsList()),
      PROD_CONSTANTS_USDX.sanctions_list
    );
    assertEq(
      USDXManager.decimalsMultiplier(),
      PROD_CONSTANTS_USDX.decimals_multiplier
    );
  }

  function test_fork_assert_USDX_token_proxy() public {
    // Assert Proxy Setup
    bytes32 impl = vm.load(address(USDX), impl_slot);
    bytes32 admin = vm.load(address(USDX), admin_slot);
    assertEq(impl, PROD_CONSTANTS_USDX.USDX_impl_bytes);
    assertEq(admin, PROD_CONSTANTS_USDX.USDX_proxy_admin_bytes);

    // Assert that the owner of the proxy admin is correct
    assertEq(
      ProxyAdmin(address(uint160(uint256(admin)))).owner(),
      PROD_CONSTANTS_USDX.USDX_pa_owner
    );

    /**
     * Assert Token Roles
     * 1) Assert Role count
     * 2) Assert Role membership
     */
    assertEq(USDX.getRoleMemberCount(USDX.DEFAULT_ADMIN_ROLE()), 1);
    assertEq(
      USDX.getRoleMember(USDX.DEFAULT_ADMIN_ROLE(), 0),
      PROD_CONSTANTS_USDX.USDX_default_admin
    );
    assertEq(USDX.getRoleMemberCount(USDX.MINTER_ROLE()), 1);
    assertEq(
      USDX.getRoleMember(USDX.MINTER_ROLE(), 0),
      PROD_CONSTANTS_USDX.USDX_minter_role
    );

    assertEq(USDX.getRoleMemberCount(USDX.PAUSER_ROLE()), 2);
    assertEq(
      USDX.getRoleMember(USDX.PAUSER_ROLE(), 0),
      PROD_CONSTANTS_USDX.USDX_default_admin
    );
    assertEq(
      USDX.getRoleMember(USDX.PAUSER_ROLE(), 1),
      PROD_CONSTANTS_USDX.USDX_pauser_role
    );

    /// @notice BURNER_ROLE - Not granted by default
    // assertEq(USDX.getRoleMemberCount(USDX.BURNER_ROLE()), 1);
    // assertEq(
    //   USDX.getRoleMember(USDX.BURNER_ROLE(), 0),
    //   PROD_CONSTANTS_USDX.USDX_pauser_role
    // );

    assertEq(USDX.getRoleMemberCount(USDX.LIST_CONFIGURER_ROLE()), 1);
    assertEq(
      USDX.getRoleMember(USDX.LIST_CONFIGURER_ROLE(), 0),
      PROD_CONSTANTS_USDX.USDX_list_config_role
    );

    // Assert Token config
    assertEq(address(USDX.allowlist()), PROD_CONSTANTS_USDX.USDX_allowlist);
    assertEq(address(USDX.blocklist()), PROD_CONSTANTS_USDX.USDX_blocklist);
    assertEq(
      address(USDX.sanctionsList()),
      PROD_CONSTANTS_USDX.USDX_sanctionslist
    );
    assertEq(USDX.paused(), PROD_CONSTANTS_USDX.paused);
    assertEq(USDX.decimals(), PROD_CONSTANTS_USDX.decimals);
    assertEq(USDX.name(), PROD_CONSTANTS_USDX.name);
    assertEq(USDX.symbol(), PROD_CONSTANTS_USDX.symbol);
  }

  function test_fork_assert_USDX_allowlist_proxy() public {
    // Assert Proxy setup
    bytes32 impl = vm.load(address(allowlist), impl_slot);
    bytes32 admin = vm.load(address(allowlist), admin_slot);
    assertEq(impl, PROD_CONSTANTS_USDX.allow_impl_bytes);
    assertEq(admin, PROD_CONSTANTS_USDX.allow_proxy_admin_bytes);

    // Assert that the owner of the proxy admin is correct
    assertEq(
      ProxyAdmin(address(uint160(uint256(admin)))).owner(),
      PROD_CONSTANTS_USDX.allow_pa_owner
    );

    /**
     * Assert Token Roles
     * 1) Assert Role count
     * 2) Assert Role membership
     */
    assertEq(allowlist.getRoleMemberCount(allowlist.DEFAULT_ADMIN_ROLE()), 1);
    assertEq(
      allowlist.getRoleMember(allowlist.DEFAULT_ADMIN_ROLE(), 0),
      PROD_CONSTANTS_USDX.allow_default_admin
    );
    assertEq(allowlist.getRoleMemberCount(allowlist.ALLOWLIST_ADMIN()), 1);
    assertEq(
      allowlist.getRoleMember(allowlist.ALLOWLIST_ADMIN(), 0),
      PROD_CONSTANTS_USDX.allow_allowlist_admin
    );
    assertEq(allowlist.getRoleMemberCount(allowlist.ALLOWLIST_SETTER()), 1);
    assertEq(
      allowlist.getRoleMember(allowlist.ALLOWLIST_SETTER(), 0),
      PROD_CONSTANTS_USDX.allow_allowlist_setter
    );
  }

  function test_fork_assert_blocklist() public {
    assertEq(blocklist.owner(), PROD_CONSTANTS_USDX.block_owner);
  }

  function test_fork_assert_pricer() public {
    assertEq(pricerUSDX.getRoleMemberCount(pricerUSDX.DEFAULT_ADMIN_ROLE()), 1);
    assertEq(
      pricerUSDX.getRoleMember(pricerUSDX.DEFAULT_ADMIN_ROLE(), 0),
      PROD_CONSTANTS_USDX.pricer_default_admin
    );
    assertEq(pricerUSDX.getRoleMemberCount(pricerUSDX.PRICE_UPDATE_ROLE()), 1);
    assertEq(
      pricerUSDX.getRoleMember(pricerUSDX.PRICE_UPDATE_ROLE(), 0),
      PROD_CONSTANTS_USDX.pricer_price_update_role
    );
  }
}
