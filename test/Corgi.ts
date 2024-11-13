import {
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("CorgiCoin", function () {
  // We define a fixture to reuse the same setup in every test
  async function deployCorgiCoinFixture() {
    // Get the signers (accounts)
    const [owner, addr1, addr2] = await hre.ethers.getSigners();

    const CorgiCoin = await hre.ethers.getContractFactory("CorgiCoin");
    const corgiCoin = await CorgiCoin.deploy();

    // Calculate total supply with 18 decimals
    const TOTAL_SUPPLY = 100_000_000_000n * 10n**18n; // 100 billion tokens

    return { corgiCoin, owner, addr1, addr2, TOTAL_SUPPLY };
  }

  describe("Deployment", function () {
    it("Should set the right token name", async function () {
      const { corgiCoin } = await loadFixture(deployCorgiCoinFixture);
      expect(await corgiCoin.name()).to.equal("CorgiCoin");
    });

    it("Should set the right token symbol", async function () {
      const { corgiCoin } = await loadFixture(deployCorgiCoinFixture);
      expect(await corgiCoin.symbol()).to.equal("CORGI");
    });

    it("Should assign the total supply of tokens to the owner", async function () {
      const { corgiCoin, owner, TOTAL_SUPPLY } = await loadFixture(deployCorgiCoinFixture);
      const ownerBalance = await corgiCoin.balanceOf(owner.address);
      expect(ownerBalance).to.equal(TOTAL_SUPPLY);
    });

    it("Should set the right owner", async function () {
      const { corgiCoin, owner } = await loadFixture(deployCorgiCoinFixture);
      expect(await corgiCoin.owner()).to.equal(owner.address);
    });
  });

  describe("Transactions", function () {
    it("Should transfer tokens between accounts", async function () {
      const { corgiCoin, owner, addr1, addr2 } = await loadFixture(deployCorgiCoinFixture);
      
      // Transfer 50 tokens from owner to addr1
      const transferAmount = 50n * 10n**18n;
      await expect(corgiCoin.transfer(addr1.address, transferAmount))
        .to.changeTokenBalances(
          corgiCoin,
          [owner, addr1],
          [-transferAmount, transferAmount]
        );

      // Transfer 20 tokens from addr1 to addr2
      const transferAmount2 = 20n * 10n**18n;
      await expect(corgiCoin.connect(addr1).transfer(addr2.address, transferAmount2))
        .to.changeTokenBalances(
          corgiCoin,
          [addr1, addr2],
          [-transferAmount2, transferAmount2]
        );
    });

    it("Should emit Transfer events", async function () {
      const { corgiCoin, owner, addr1 } = await loadFixture(deployCorgiCoinFixture);
      
      const transferAmount = 50n * 10n**18n;
      await expect(corgiCoin.transfer(addr1.address, transferAmount))
        .to.emit(corgiCoin, "Transfer")
        .withArgs(owner.address, addr1.address, transferAmount);
    });

    it("Should fail if sender doesn't have enough tokens", async function () {
      const { corgiCoin, owner, addr1 } = await loadFixture(deployCorgiCoinFixture);
      const initialOwnerBalance = await corgiCoin.balanceOf(owner.address);

      // Try to send more tokens than available
      await expect(
        corgiCoin.connect(addr1).transfer(owner.address, 1)
      ).to.be.reverted;

      // Owner balance shouldn't have changed
      expect(await corgiCoin.balanceOf(owner.address)).to.equal(initialOwnerBalance);
    });
  });

  describe("Allowances", function () {
    it("Should update allowances on approval", async function () {
      const { corgiCoin, owner, addr1 } = await loadFixture(deployCorgiCoinFixture);
      const approveAmount = 100n * 10n**18n;

      await expect(corgiCoin.approve(addr1.address, approveAmount))
        .to.emit(corgiCoin, "Approval")
        .withArgs(owner.address, addr1.address, approveAmount);

      expect(await corgiCoin.allowance(owner.address, addr1.address))
        .to.equal(approveAmount);
    });

    it("Should transfer tokens using transferFrom", async function () {
      const { corgiCoin, owner, addr1, addr2 } = await loadFixture(deployCorgiCoinFixture);
      const approveAmount = 100n * 10n**18n;
      const transferAmount = 50n * 10n**18n;

      // Approve addr1 to spend owner's tokens
      await corgiCoin.approve(addr1.address, approveAmount);

      // addr1 transfers tokens from owner to addr2
      await expect(
        corgiCoin.connect(addr1).transferFrom(owner.address, addr2.address, transferAmount)
      ).to.changeTokenBalances(
        corgiCoin,
        [owner, addr2],
        [-transferAmount, transferAmount]
      );
    });
  });

  describe("Burning", function () {
    it("Should burn tokens", async function () {
      const { corgiCoin, owner } = await loadFixture(deployCorgiCoinFixture);
      const burnAmount = 1000n * 10n**18n;
      
      const initialSupply = await corgiCoin.totalSupply();
      
      await expect(corgiCoin.burn(burnAmount))
        .to.emit(corgiCoin, "Transfer")
        .withArgs(owner.address, "0x0000000000000000000000000000000000000000", burnAmount);

      expect(await corgiCoin.totalSupply()).to.equal(initialSupply - burnAmount);
    });

    it("Should fail to burn more tokens than balance", async function () {
      const { corgiCoin, addr1 } = await loadFixture(deployCorgiCoinFixture);
      
      // Try to burn tokens without having any
      await expect(
        corgiCoin.connect(addr1).burn(1)
      ).to.be.reverted;
    });
  });
});