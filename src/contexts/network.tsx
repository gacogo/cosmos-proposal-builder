import { ReactNode, createContext, useEffect, useMemo, useState } from "react";
import { useSearch } from "wouter/use-location";
import { toast } from "react-toastify";
import {
  fetchChainConfig,
  fetchNetworksForChain,
  NetworkConfig,
} from "../config/chainConfig";
import { useChain } from "../hooks/useChain";

export interface NetworkContextValue {
  currentChainName: string | null;
  currentNetworkName: string | null;
  siblingNetworkNames: string[];
  networkConfig: NetworkConfig | null;
  error: string | null;
  api: string | undefined;
}

export const NetworkContext = createContext<NetworkContextValue>({
  currentChainName: null,
  currentNetworkName: null,
  siblingNetworkNames: [],
  networkConfig: null,
  error: null,
  api: undefined,
});

export const NetworkContextProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [currentNetworkName, setCurrentNetworkName] = useState<string | null>(
    null,
  );
  const [error, setError] = useState<NetworkContextValue["error"]>(null);
  const [networkConfig, setNetworkConfig] =
    useState<NetworkContextValue["networkConfig"]>(null);
  const [siblingNetworkNames, setSiblingNetworkNames] = useState<
    NetworkContextValue["siblingNetworkNames"]
  >([]);
  const { currentChainName } = useChain();
  const [chainName, setChainName] =
    useState<NetworkContextValue["currentChainName"]>(currentChainName);
  const search = useSearch();
  const selectedNetwork = useMemo(
    () => new URLSearchParams(search).get("network") ?? null,
    [search],
  );

  useEffect(() => {
    if (currentChainName) {
      fetchNetworksForChain(currentChainName)
        .then(setSiblingNetworkNames)
        .then(() => setChainName(currentChainName))
        .catch(() => {
          setSiblingNetworkNames([]);
          setError("Failed to fetch network configuration.");
          toast.error("Failed to fetch network configuration.", {
            position: "bottom-center",
            autoClose: 300,
          });
        });
    }
  }, [currentChainName, chainName]);

  useEffect(() => {
    const newNetwork =
      selectedNetwork && siblingNetworkNames.includes(selectedNetwork)
        ? selectedNetwork
        : null;
    if (newNetwork !== currentNetworkName) {
      setCurrentNetworkName(newNetwork);
    }
  }, [selectedNetwork, chainName]);

  useEffect(() => {
    if (currentNetworkName && currentChainName) {
      fetchChainConfig(currentChainName, currentNetworkName)
        .then(setNetworkConfig)
        .catch(() => {
          setNetworkConfig(null);
          setError("Failed to fetch network configuration.");
          toast.error("Failed to fetch network configuration.", {
            position: "bottom-center",
            autoClose: 300,
          });
        });
    }
  }, [currentNetworkName, chainName]);

  console.error("networkConfig", networkConfig);

  const restApi = useMemo(() => {
    if (currentNetworkName === "local") return "http://localhost:1317";
    return networkConfig?.apis.rest[0].address;
  }, [networkConfig, currentNetworkName]);

  return (
    <NetworkContext.Provider
      value={{
        currentChainName,
        currentNetworkName,
        siblingNetworkNames,
        networkConfig,
        error,
        api: restApi,
      }}
    >
      {children}
    </NetworkContext.Provider>
  );
};
