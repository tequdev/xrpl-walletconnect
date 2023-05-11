import {
  ChainsMap,
  ChainData,
} from "./types";

export const mainnet: ChainData = {
  name: "XRPL",
  id: "xrpl:0",
  rpc: ["https://xrplcluster.com/", "https://s2.ripple.com:51234/"],
  slip44: 144,
}
export const testnet: ChainData = {
  name: "XRPL Testnet",
  id: "xrpl:1",
  rpc: [
    "https://testnet.xrpl-labs.com",
    "https://s.altnet.rippletest.net:51234/",
  ],
  slip44: 144,
}
export const devnet: ChainData = {
  name: "XRPL Devnet",
  id: "xrpl:2",
  rpc: [
    "https://s.devnet.rippletest.net:51234/",
  ],
  slip44: 144,
}

export const networks: ChainsMap = {
  "0": mainnet,
  "1": testnet,
  "2": devnet
};
