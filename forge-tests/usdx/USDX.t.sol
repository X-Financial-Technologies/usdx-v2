pragma solidity 0.8.16;

import "forge-tests/USDX_BasicDeployment.sol";

contract USDXTest is USDX_BasicDeployment {
  function setUp() public override {
    super.setUp();
    _addAccountToAllowlistCurrentTerm(bob);
    vm.prank(guardian);
    USDX.mint(alice, 1000e18);
  }

  function test_USDX_name() public {
    assertEq(USDX.name(), "USDX");
  }

  function test_USDX_symbol() public {
    assertEq(USDX.symbol(), "USDX");
  }

  function test_USDX_decimals() public {
    assertEq(USDX.decimals(), 18);
  }

  function test_pause() public {
    vm.prank(guardian);
    USDX.pause();
    assertTrue(USDX.paused());
  }

  function test_mint_fail_when_paused() public pausedState {
    vm.expectRevert("ERC20Pausable: token transfer while paused");
    vm.prank(guardian);
    USDX.mint(bob, 10e18);
  }

  function test_burn_fail_when_paused() public pausedState {
    vm.startPrank(guardian);
    USDX.grantRole(USDX.BURNER_ROLE(), guardian);
    vm.expectRevert("ERC20Pausable: token transfer while paused");
    USDX.burn(alice, 10e18);
    vm.stopPrank();
  }

  function test_pause_fail_AC() public {
    vm.expectRevert("ERC20PresetMinterPauser: must have pauser role to pause");
    USDX.pause();
  }

  function test_unpause() public pausedState {
    vm.prank(guardian);
    USDX.unpause();
    assertFalse(USDX.paused());
  }

  function test_unpause_fail_AC() public {
    vm.prank(guardian);
    USDX.pause();
    vm.expectRevert(
      "ERC20PresetMinterPauser: must have pauser role to unpause"
    );
    USDX.unpause();
    assertTrue(USDX.paused());
  }

  function test_transfer_fail_paused() public pausedState {
    vm.expectRevert("ERC20Pausable: token transfer while paused");
    vm.prank(alice);
    USDX.transfer(bob, 1000e18);
  }

  function test_transfer_fail_from_allowlist() public {
    _removeAccountFromAllowlistCurrentTerm(alice);

    vm.expectRevert("USDX: 'from' address not on allowlist");
    vm.prank(alice);
    USDX.transfer(bob, 1000e18);
  }

  function test_transfer_fail_to_allowlist() public {
    _removeAccountFromAllowlistCurrentTerm(bob);

    vm.expectRevert("USDX: 'to' address not on allowlist");
    vm.prank(alice);
    USDX.transfer(bob, 1000e18);
  }

  function test_transfer_fail_sender_allowlist() public {
    vm.prank(alice);
    USDX.approve(charlie, 1000e18);

    vm.expectRevert("USDX: 'sender' address not on allowlist");
    vm.prank(charlie);
    USDX.transferFrom(alice, bob, 1000e18);
  }

  function test_transfer_fail_from_blocklist() public {
    _addToBlocklist(alice);

    vm.expectRevert("USDX: 'from' address blocked");
    vm.prank(alice);
    USDX.transfer(bob, 1000e18);
  }

  function test_transfer_fail_to_blocklist() public {
    _addToBlocklist(bob);

    vm.expectRevert("USDX: 'to' address blocked");
    vm.prank(alice);
    USDX.transfer(bob, 1000e18);
  }

  function test_transfer_fail_sender_blocklist() public {
    _addToBlocklist(charlie);
    _addAccountToAllowlistCurrentTerm(charlie);

    vm.prank(alice);
    USDX.approve(charlie, 1000e18);
    vm.expectRevert("USDX: 'sender' address blocked");
    vm.prank(charlie);
    USDX.transferFrom(alice, bob, 1000e18);
  }

  function test_transfer_fail_from_sanctions() public {
    _addToSanctionsList(alice);

    vm.expectRevert("USDX: 'from' address sanctioned");
    vm.prank(alice);
    USDX.transfer(bob, 1000e18);
  }

  function test_transfer_fail_to_sanctions() public {
    _addToSanctionsList(bob);

    vm.expectRevert("USDX: 'to' address sanctioned");
    vm.prank(alice);
    USDX.transfer(bob, 1000e18);
  }

  function test_transfer_fail_sender_sanctions() public {
    _addToSanctionsList(charlie);
    _addAccountToAllowlistCurrentTerm(charlie);

    vm.prank(alice);
    USDX.approve(charlie, 1000e18);
    vm.expectRevert("USDX: 'sender' address sanctioned");
    vm.prank(charlie);
    USDX.transferFrom(alice, bob, 1000e18);
  }

  function test_burn() public {
    uint256 totalSupply = USDX.totalSupply();
    vm.startPrank(guardian);
    USDX.grantRole(USDX.BURNER_ROLE(), guardian);
    USDX.burn(alice, 1000e18);
    vm.stopPrank();

    assertEq(USDX.totalSupply(), totalSupply - 1000e18);
    assertEq(USDX.balanceOf(alice), 0);
  }

  function test_burn_fail_AC() public {
    vm.expectRevert(_formatACRevert(charlie, USDX.BURNER_ROLE()));
    vm.prank(charlie);
    USDX.burn(alice, 1000e18);
  }

  function test_setSanctionsList_fail_AC() public {
    vm.expectRevert(_formatACRevert(bob, USDX.LIST_CONFIGURER_ROLE()));
    vm.prank(bob);
    USDX.setSanctionsList(charlie);
  }

  function test_setSanctionsList() public {
    ISanctionsList newSanctionsList = new MockSanctionsOracle();
    vm.startPrank(guardian);
    USDX.grantRole(USDX.LIST_CONFIGURER_ROLE(), guardian);
    vm.expectEmit(true, true, true, true);
    emit SanctionsListSet(address(sanctionsList), address(newSanctionsList));
    USDX.setSanctionsList(address(newSanctionsList));
    vm.stopPrank();
    assertEq(address(USDX.sanctionsList()), address(newSanctionsList));
  }

  function test_setBlocklist_fail_AC() public {
    vm.expectRevert(_formatACRevert(bob, USDX.LIST_CONFIGURER_ROLE()));
    vm.prank(bob);
    USDX.setBlocklist(charlie);
  }

  function test_setBlocklist() public {
    Blocklist newBlocklist = new Blocklist();
    vm.startPrank(guardian);
    USDX.grantRole(USDX.LIST_CONFIGURER_ROLE(), guardian);
    vm.expectEmit(true, true, true, true);
    emit BlocklistSet(address(blocklist), address(newBlocklist));
    USDX.setBlocklist(address(newBlocklist));
    vm.stopPrank();
    assertEq(address(USDX.blocklist()), address(newBlocklist));
  }

  function test_setAllowlist_fail_AC() public {
    vm.expectRevert(_formatACRevert(bob, USDX.LIST_CONFIGURER_ROLE()));
    vm.prank(bob);
    USDX.setAllowlist(charlie);
  }

  function test_setAllowlist() public {
    address oldAllowlist = address(USDX.allowlist());
    _deployAllowlist();
    vm.startPrank(guardian);
    USDX.grantRole(USDX.LIST_CONFIGURER_ROLE(), guardian);
    vm.expectEmit(true, true, true, true);
    emit AllowlistSet(oldAllowlist, address(allowlist));
    USDX.setAllowlist(address(allowlist));
    vm.stopPrank();
    assertEq(address(USDX.allowlist()), address(allowlist));
  }

  /*//////////////////////////////////////////////////////////////
                      Modifiers and Events
  //////////////////////////////////////////////////////////////*/

  modifier pausedState() {
    vm.prank(guardian);
    USDX.pause();
    _;
  }

  event SanctionsListSet(address oldSanctionsList, address newSanctionsList);
  event BlocklistSet(address oldBlocklist, address newBlocklist);
  event AllowlistSet(address oldAllowlist, address newAllowlist);
}
