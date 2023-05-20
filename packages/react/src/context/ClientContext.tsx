import Client from "@walletconnect/sign-client";
import { PairingTypes, SessionTypes } from "@walletconnect/types";
import { Web3Modal } from "@web3modal/standalone";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { getAppMetadata, getSdkError } from "@walletconnect/utils";
import { DEFAULT_LOGGER, DEFAULT_XRPL_METHODS } from "../constants";
import { getRequiredNamespaces } from "../helpers/namespaces";
import { ChainData } from "@xrpl-walletconnect/core";

/**
 * Types
 */
interface IContext {
  client: Client | undefined;
  session: SessionTypes.Struct | undefined;
  connect: (pairing?: { topic: string }) => Promise<void>;
  disconnect: () => Promise<void>;
  isInitializing: boolean;
  chains: string[];
  relayerRegion: string;
  pairings: PairingTypes.Struct[];
  accounts: string[];
  setChains: any;
  setRelayerRegion: any;
  signTransaction: (
    chainId: string,
    tx_json: Record<string, any>,
    options?: {
      autofill?: boolean;
      submit?: boolean;
    }
  ) => Promise<{
    tx_json: Record<string, any>;
  }>;
  signTransactionFor: (
    chainId: string,
    tx_signer: string,
    tx_json: Record<string, any>,
    options?: {
      autofill?: boolean;
      submit?: boolean;
    }
  ) => Promise<{
    tx_json: Record<string, any>;
  }>;
}

/**
 * Context
 */
export const ClientContext = createContext<IContext>({} as IContext);

/**
 * Provider
 */
export function ClientContextProvider({
  projectId,
  relayUrl,
  metadata,
  defaultChains = [],
  children,
}: {
  projectId: string;
  relayUrl: string;
  metadata: {
    name: string;
    description: string;
    url: string;
    icons: string[];
    verifyUrl?: string;
  };
  defaultChains?: ChainData['id'][];
  children: ReactNode | ReactNode[];
}) {
  const [client, setClient] = useState<Client>();
  const [pairings, setPairings] = useState<PairingTypes.Struct[]>([]);
  const [session, setSession] = useState<SessionTypes.Struct>();

  const [isInitializing, setIsInitializing] = useState(false);
  const prevRelayerValue = useRef<string>("");

  const [accounts, setAccounts] = useState<string[]>([]);
  const [chains, setChains] = useState<string[]>(defaultChains);
  const [relayerRegion, setRelayerRegion] = useState<string>(relayUrl);

  /**
   * Web3Modal Config
   */
  const web3Modal = useMemo(
    () =>
      new Web3Modal({
        projectId,
        themeMode: "light",
        walletConnectVersion: 2,
      }),
    [projectId]
  );

  const reset = useCallback(() => {
    setSession(undefined);
    setAccounts([]);
    setChains(defaultChains);
    setRelayerRegion(relayUrl);
  }, [defaultChains, relayUrl]);

  const onSessionConnected = useCallback((_session: SessionTypes.Struct) => {
    const allNamespaceAccounts = Object.values(_session.namespaces)
      .map((namespace) => namespace.accounts)
      .flat();
    const allNamespaceChains = Object.keys(_session.namespaces);

    setSession(_session);
    setChains(allNamespaceChains);
    setAccounts(allNamespaceAccounts);
  }, []);

  const connect = useCallback(
    async (pairing: any) => {
      if (typeof client === "undefined") {
        throw new Error("WalletConnect is not initialized");
      }
      console.log("connect, pairing topic is:", pairing?.topic);
      try {
        const requiredNamespaces = getRequiredNamespaces(chains);
        console.log(
          "requiredNamespaces config for connect:",
          requiredNamespaces
        );

        const { uri, approval } = await client.connect({
          pairingTopic: pairing?.topic,
          requiredNamespaces,
        });

        // Open QRCode modal if a URI was returned (i.e. we're not connecting an existing pairing).
        if (uri) {
          // Create a flat array of all requested chains across namespaces.
          const standaloneChains = Object.values(requiredNamespaces)
            .map((namespace) => namespace.chains)
            .flat() as string[];

          web3Modal.openModal({ uri, standaloneChains });
        }

        const session = await approval();
        console.log("Established session:", session);
        onSessionConnected(session);
        // Update known pairings after session is connected.
        setPairings(client.pairing.getAll({ active: true }));
      } catch (e) {
        console.error(e);
        // ignore rejection
      } finally {
        // close modal in case it was open
        web3Modal.closeModal();
      }
    },
    [chains, client, onSessionConnected, web3Modal]
  );

  const disconnect = useCallback(async () => {
    if (typeof client === "undefined") {
      throw new Error("WalletConnect is not initialized");
    }
    if (typeof session === "undefined") {
      throw new Error("Session is not connected");
    }

    try {
      await client.disconnect({
        topic: session.topic,
        reason: getSdkError("USER_DISCONNECTED"),
      });
    } catch (error) {
      console.error("SignClient.disconnect failed:", error);
    } finally {
      // Reset app state after disconnect.
      reset();
    }
  }, [client, reset, session]);

  const _subscribeToEvents = useCallback(
    async (_client: Client) => {
      if (typeof _client === "undefined") {
        throw new Error("WalletConnect is not initialized");
      }

      _client.on("session_ping", (args) => {
        console.log("EVENT", "session_ping", args);
      });

      _client.on("session_event", (args) => {
        console.log("EVENT", "session_event", args);
      });

      _client.on("session_update", ({ topic, params }) => {
        console.log("EVENT", "session_update", { topic, params });
        const { namespaces } = params;
        const _session = _client.session.get(topic);
        const updatedSession = { ..._session, namespaces };
        onSessionConnected(updatedSession);
      });

      _client.on("session_delete", () => {
        console.log("EVENT", "session_delete");
        reset();
      });
    },
    [onSessionConnected, reset]
  );

  const _checkPersistedState = useCallback(
    async (_client: Client) => {
      if (typeof _client === "undefined") {
        throw new Error("WalletConnect is not initialized");
      }
      // populates existing pairings to state
      setPairings(_client.pairing.getAll({ active: true }));
      console.log(
        "RESTORED PAIRINGS: ",
        _client.pairing.getAll({ active: true })
      );

      if (typeof session !== "undefined") return;
      // populates (the last) existing session to state
      if (_client.session.length) {
        const lastKeyIndex = _client.session.keys.length - 1;
        const _session = _client.session.get(
          _client.session.keys[lastKeyIndex]
        );
        console.log("RESTORED SESSION:", _session);
        onSessionConnected(_session);
        return _session;
      }
    },
    [session, onSessionConnected]
  );

  const createClient = useCallback(async () => {
    try {
      setIsInitializing(true);

      const _client = await Client.init({
        logger: DEFAULT_LOGGER,
        relayUrl: relayerRegion,
        projectId,
        metadata: getAppMetadata() || metadata,
      });

      setClient(_client);
      prevRelayerValue.current = relayerRegion;
      await _subscribeToEvents(_client);
      await _checkPersistedState(_client);
    } finally {
      setIsInitializing(false);
    }
  }, [
    _checkPersistedState,
    _subscribeToEvents,
    metadata,
    projectId,
    relayerRegion,
  ]);

  useEffect(() => {
    if (!client) {
      createClient();
    } else if (prevRelayerValue.current !== relayerRegion) {
      client.core.relayer.restartTransport(relayerRegion);
      prevRelayerValue.current = relayerRegion;
    }
  }, [createClient, relayerRegion, client]);

  const signTransaction = useCallback(
    (
      chainId: string,
      tx_json: Record<string, any>,
      options?: { autofill?: boolean; submit?: boolean }
    ) => {
      const result = client!.request<{ tx_json: Record<string, any> }>({
        chainId,
        topic: session!.topic,
        request: {
          method: DEFAULT_XRPL_METHODS.XRPL_SIGN_TRANSACTION,
          params: {
            tx_json,
            autofill: options?.autofill,
            submit: options?.submit,
          },
        },
      });
      return result;
    },
    [client, session]
  );
  const signTransactionFor = useCallback(
    (
      tx_signer: string,
      chainId: string,
      tx_json: Record<string, any>,
      options?: { autofill?: boolean; submit?: boolean }
    ) => {
      const result = client!.request<{ tx_json: Record<string, any> }>({
        chainId,
        topic: session!.topic,
        request: {
          method: DEFAULT_XRPL_METHODS.XRPL_SIGN_TRANSACTION_FOR,
          params: {
            tx_signer,
            tx_json,
            autofill: options?.autofill,
            submit: options?.submit,
          },
        },
      });
      return result;
    },
    [client, session]
  );

  const value = useMemo(
    () => ({
      pairings,
      isInitializing,
      accounts,
      chains,
      relayerRegion,
      client,
      session,
      connect,
      disconnect,
      setChains,
      setRelayerRegion,
      signTransaction,
      signTransactionFor,
    }),
    [
      pairings,
      isInitializing,
      accounts,
      chains,
      relayerRegion,
      client,
      session,
      connect,
      disconnect,
      setChains,
      setRelayerRegion,
      signTransaction,
      signTransactionFor,
    ]
  );

  return (
    <ClientContext.Provider
      value={{
        ...value,
      }}
    >
      {children}
    </ClientContext.Provider>
  );
}

export function useWalletConnectClient() {
  const context = useContext(ClientContext);
  if (context === undefined) {
    throw new Error(
      "useWalletConnectClient must be used within a ClientContextProvider"
    );
  }
  return context;
}
