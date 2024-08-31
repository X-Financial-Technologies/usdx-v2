pragma solidity 0.8.16;

import "forge-tests/USDX_BasicDeployment.sol";
import "forge-tests/rwaHub/Minting.t.sol";
import "forge-tests/rwaHub/Redemption.t.sol";
import "forge-tests/rwaHub/Setters.t.sol";
import "forge-tests/rwaHub/OffChainRedemption.t.sol";

contract Test_USDX_Manager is
  USDX_BasicDeployment,
  Test_RWAHub_Redemptions,
  Test_RWAHub_Setters,
  Test_RWAHub_Minting,
  Test_OffChainRedemption_Manager
{
  function setUp() public override {
    super.setUp();
    _setRWAHubOffChainRedemptions(address(USDXManager));
  }

  function _initializeUsersArray()
    internal
    virtual
    override(Test_RWAHub_Redemptions, Test_RWAHub_Minting)
  {
    _initializeUSDXUsersArray();
  }

  // Adds user to blocklist
  function _restrictUser(
    address user
  ) internal override(Test_RWAHub_Setters, Test_RWAHub_Minting) {
    _addToBlocklist(user);
  }

  // Expects blocklist revert
  function _expectOpinionatedRestrictionRevert()
    internal
    override(Test_RWAHub_Setters, Test_RWAHub_Minting)
  {
    vm.expectRevert(IBlocklistClient.BlockedAccount.selector);
  }

  // Hook that allows us to set the claimable timestamp without duplicating all
  // the minting tests.
  function _preClaimStep() internal override {
    vm.prank(managerAdmin);
    USDXManager.setClaimableTimestamp(block.timestamp, depositIds);
  }

  function test_claimMint_fail_timestamp_not_set() public {
    _rwaHubDeposit(alice, 1_000_000e6);
    depositIds.push(FIRST_DEPOSIT_ID);
    priceIds.push(1);

    vm.prank(managerAdmin);
    rwaHub.setPriceIdForDeposits(depositIds, priceIds);
    vm.expectRevert(IUSDXManager.ClaimableTimestampNotSet.selector);
    USDXManager.claimMint(depositIds);
  }

  function test_claimMint_fail_not_yet_claimable() public {
    _rwaHubDeposit(alice, 1_000_000e6);
    depositIds.push(FIRST_DEPOSIT_ID);
    priceIds.push(1);

    vm.startPrank(managerAdmin);
    rwaHub.setPriceIdForDeposits(depositIds, priceIds);
    USDXManager.setClaimableTimestamp(block.timestamp + 100, depositIds);
    vm.stopPrank();

    vm.expectRevert(IUSDXManager.MintNotYetClaimable.selector);
    USDXManager.claimMint(depositIds);
  }

  function test_claimMint() public {
    _rwaHubDeposit(alice, 1_000_000e6);
    depositIds.push(FIRST_DEPOSIT_ID);
    priceIds.push(1);

    vm.startPrank(managerAdmin);
    rwaHub.setPriceIdForDeposits(depositIds, priceIds);
    USDXManager.setClaimableTimestamp(block.timestamp + 100, depositIds);
    vm.stopPrank();

    vm.warp(block.timestamp + 100);
    USDXManager.claimMint(depositIds);
    assertEq(USDX.balanceOf(alice), 1_000_000e18);
  }

  function test_setClaimableTimestamp_fail_timestamp_in_past() public {
    _rwaHubDeposit(alice, 1_000_000e6);
    depositIds.push(FIRST_DEPOSIT_ID);
    depositIds.push(SECOND_DEPOSIT_ID);
    vm.prank(managerAdmin);
    vm.expectRevert(IUSDXManager.ClaimableTimestampInPast.selector);
    USDXManager.setClaimableTimestamp(block.timestamp - 1, depositIds);
  }

  function test_setClaimableTimestamp_fail_AC() public {
    _rwaHubDeposit(alice, 1_000_000e6);
    depositIds.push(FIRST_DEPOSIT_ID);
    vm.expectRevert(_formatACRevert(bob, USDXManager.TIMESTAMP_SETTER_ROLE()));
    vm.prank(bob);
    USDXManager.setClaimableTimestamp(block.timestamp, depositIds);
  }

  function test_setClaimableTimestamp() public {
    _rwaHubDeposit(alice, 1_000_000e6);
    depositIds.push(FIRST_DEPOSIT_ID);
    vm.prank(managerAdmin);
    vm.expectEmit(true, true, true, true);
    emit ClaimableTimestampSet(block.timestamp + 100, FIRST_DEPOSIT_ID);
    USDXManager.setClaimableTimestamp(block.timestamp + 100, depositIds);
    assertEq(
      USDXManager.depositIdToClaimableTimestamp(FIRST_DEPOSIT_ID),
      block.timestamp + 100
    );
  }

  function test_setSanctionsList_fail_AC() public {
    vm.expectRevert(_formatACRevert(bob, USDXManager.MANAGER_ADMIN()));
    vm.prank(bob);
    USDXManager.setSanctionsList(charlie);
  }

  function test_setBlocklist_fail_AC() public {
    vm.expectRevert(_formatACRevert(bob, USDXManager.MANAGER_ADMIN()));
    vm.prank(bob);
    USDXManager.setBlocklist(charlie);
  }

  function test_requestSubscription_fail_blocklist() public {
    _addToBlocklist(alice);
    uint256 amount = 100e6;
    _seedWithCollateral(alice, amount);
    vm.startPrank(alice);
    USDC.approve(address(USDXManager), amount);
    vm.expectRevert(IBlocklistClient.BlockedAccount.selector);
    rwaHub.requestSubscription(amount);
    vm.stopPrank();
  }

  function test_requestSubscription_fail_sanctions() public {
    uint256 amount = 100e6;
    _seedWithCollateral(alice, amount);
    _addToSanctionsList(alice);
    vm.startPrank(alice);
    USDC.approve(address(USDXManager), amount);
    vm.expectRevert(ISanctionsListClient.SanctionedAccount.selector);
    rwaHub.requestSubscription(amount);
    vm.stopPrank();
  }

  function test_claimRedemption_fail_blocklist() public {
    uint256 amount = 100e18;
    rwaHubRequestRedemption(alice, amount);
    _addToBlocklist(alice);

    grantApprovalToHub((amount * 1e18) / 1e30);
    vm.startPrank(alice);
    redemptionIds.push(FIRST_REDEMPTION_ID);
    vm.expectRevert(IBlocklistClient.BlockedAccount.selector);
    rwaHub.claimRedemption(redemptionIds);
    vm.stopPrank();
  }

  function test_claimRedemption_fail_sanctions() public {
    uint256 amount = 100e18;
    rwaHubRequestRedemption(alice, amount);
    _addToSanctionsList(alice);

    grantApprovalToHub((amount * 1e18) / 1e30);
    vm.startPrank(alice);
    redemptionIds.push(FIRST_REDEMPTION_ID);
    vm.expectRevert(ISanctionsListClient.SanctionedAccount.selector);
    rwaHub.claimRedemption(redemptionIds);
    vm.stopPrank();
  }
}
