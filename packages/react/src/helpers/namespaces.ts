import { ProposalTypes } from "@walletconnect/types";
import {
  DEFAULT_XRPL_METHODS,
  DEFAULT_XRPL_EVENTS,
} from "../constants";

const getNamespacesFromChains = (chains: string[]) => {
  const supportedNamespaces: string[] = [];
  chains.forEach((chainId) => {
    const [namespace] = chainId.split(":");
    if (!supportedNamespaces.includes(namespace)) {
      supportedNamespaces.push(namespace);
    }
  });

  return supportedNamespaces;
};

const getSupportedMethodsByNamespace = (namespace: string) => {
  switch (namespace) {
    case "xrpl":
      return Object.values(DEFAULT_XRPL_METHODS);
    default:
      throw new Error(`No default methods for namespace: ${namespace}`);
  }
};

const getSupportedEventsByNamespace = (namespace: string) => {
  switch (namespace) {
    case "xrpl":
      return Object.values(DEFAULT_XRPL_EVENTS || {});
    default:
      throw new Error(`No default events for namespace: ${namespace}`);
  }
};

export const getRequiredNamespaces = (
  chains: string[]
): ProposalTypes.RequiredNamespaces => {
  const selectedNamespaces = getNamespacesFromChains(chains);
  console.log("selected namespaces:", selectedNamespaces);

  return Object.fromEntries(
    selectedNamespaces.map((namespace) => [
      namespace,
      {
        methods: getSupportedMethodsByNamespace(namespace),
        chains: chains.filter((chain) => chain.startsWith(namespace)),
        events: getSupportedEventsByNamespace(namespace) as any[],
      },
    ])
  );
};
