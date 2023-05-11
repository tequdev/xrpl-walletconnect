import {
  ChainsMap,
  ChainData,
} from "../helpers";

export const XRPLMainnetChain: ChainData = {
  name: "XRPL",
  id: "xrpl:0",
  rpc: ["https://xrplcluster.com/", "https://s2.ripple.com:51234/"],
  slip44: 144,
  testnet: false,
}
export const XRPLTestnetChain: ChainData = {
  name: "XRPL Testnet",
  id: "xrpl:1",
  rpc: [
    "https://testnet.xrpl-labs.com",
    "https://s.altnet.rippletest.net:51234/",
  ],
  slip44: 144,
  testnet: true,
}

export const XrplChainData: ChainsMap = {
  "0": XRPLMainnetChain,
  "1": XRPLTestnetChain
};
