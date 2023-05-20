# XRPL WalletConnect library for React Native

## Document

https://docs.walletconnect.com/2.0/advanced/rpc-reference/xrpl-rpc

## usase

```jsx
import { testnet } from "@xrpl-walletconnect/core";
import { ClientContextProvider } from "@xrpl-walletconnect/react";

const App = () => {
  return (
    <ClientContextProvider
      projectId={projectId}
      metadata={walletConnectMetadata}
      relayUrl={relayUrl}
      defaultChains={[testnet.id]}
    >
      <Component />
    </ClientContextProvider>
  );
};
```

```jsx
import { useWalletConnectClient } from "@xrpl-walletconnect/react";
import { mainnet, testnet, devnet } from "@xrpl-walletconnect/core";

const Component = ({ children }) => {
  const { accounts, connect, disconnect, chains, setChains, signTransaction } =
    useWalletConnectClient();

  const testTransaction = () => {
    signTransaction(chains[0], {
      TransactionType: "AccountSet",
      Account: accounts[0],
    });
  };

  return (
    <>
      <button onClick={connect}>Connect</button>
      <button onClick={disconnect}>Disconnect</button>
      {accounts.length > 0 && (
        <button onClick={testTransaction}>Sign Transaction</button>
      )}
    </>
  );
};
```