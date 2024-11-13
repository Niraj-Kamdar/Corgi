// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CorgiCoin is ERC20, Ownable {
    uint256 public constant TOTAL_SUPPLY = 100_000_000_000 * 10**18; // 100 billion tokens with 18 decimals

    constructor() ERC20("CorgiCoin", "CORGI") Ownable(msg.sender) {
        _mint(msg.sender, TOTAL_SUPPLY);
    }

    function burn(uint256 amount) public {
        _burn(msg.sender, amount);
    }
}