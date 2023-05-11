export interface ChainData {
  name: string;
  id: string;
  rpc: string[];
  slip44: number;
}
export interface ChainsMap {
  [reference: string]: ChainData;
}

