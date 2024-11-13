import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const CorgiModule = buildModule("CorgiModule", (m) => {
  const corgiCoin = m.contract("CorgiCoin");
  
  return { corgiCoin };
});

export default CorgiModule;