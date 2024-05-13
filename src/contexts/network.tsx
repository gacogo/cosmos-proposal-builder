import {
  ReactNode,
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { toast } from "react-toastify";
import {
  fetchChainConfig,
  fetchNetworksForChain,
  NetworkConfig,
} from "../config/chainConfig";
import { useChain } from "../hooks/useChain";
import { ChainListItem } from "./chain";
import { useSearch } from "wouter/use-location";

export interface NetworkListItem {
  label: string;
  value: string;
  parent: string;
  image: string;
}

export interface NetworkContextValue {
  currentChain: ChainListItem | null;
  currentNetworkName: string | null;
  siblingNetworkNames: string[];
  networkConfig: NetworkConfig | null;
  error: string | null;
  api: string | undefined;
  resetNetworks: (chain: string) => void;
  setCurrentChain: (chain: ChainListItem) => void;
  location: string | null;
  setLocation: (location: string) => void;
  setCurrentNetworkName: (network: string | null) => void;
}

export const NetworkContext = createContext<NetworkContextValue>({
  location: null,
  currentChain: null,
  currentNetworkName: null,
  siblingNetworkNames: [],
  networkConfig: null,
  error: null,
  api: undefined,
  resetNetworks: () => {},
  setCurrentChain: () => {},
  setLocation: () => {},
  setCurrentNetworkName: () => {},
});

export const NetworkContextProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [error, setError] = useState<NetworkContextValue["error"]>(null);
  const [networkConfig, setNetworkConfig] =
    useState<NetworkContextValue["networkConfig"]>(null);
  const [siblingNetworkNames, setSiblingNetworkNames] = useState<
    NetworkContextValue["siblingNetworkNames"]
  >([]);
  const { availableChains, currentChain, location, setLocation } = useChain();
  const [chainItem, setCurrentChain] = useState<ChainListItem | null>(
    currentChain,
  );

  const search = useSearch();
  const selectedNetwork = useMemo(
    () => new URLSearchParams(search).get("network") ?? null,
    [search],
  );

  const handleError = useCallback((message: string) => {
    setError(message);
    toast.error(message, {
      position: "bottom-center",
      autoClose: 300,
    });
  }, []);

  const fetchNetworks = useCallback(
    async (chainName: string) => {
      try {
        const networks = await fetchNetworksForChain(chainName);
        setSiblingNetworkNames(networks);
      } catch (error) {
        setSiblingNetworkNames([]);
        handleError("Failed to fetch network configuration.");
      }
    },
    [handleError],
  );

  const chainConfig = useCallback(
    async (chainName: string, networkName: string) => {
      try {
        const config = await fetchChainConfig(chainName, networkName);
        setNetworkConfig(config);
      } catch (error) {
        setNetworkConfig(null);
        handleError("Failed to fetch network configuration.");
      }
    },
    [handleError],
  );

  useEffect(() => {
    if (location) {
      const chainName = location.split("/")[1];
      const chain = availableChains.find((chain) => chain.value === chainName);
      if (chain) {
        setCurrentChain(chain);
        fetchNetworks(chain.parent);
      }
    }
    return;
  }, [location, availableChains, fetchNetworks]);

  useEffect(() => {
    if (selectedNetwork && currentChain) {
      chainConfig(currentChain.parent, selectedNetwork);
    }
  }, [selectedNetwork, currentChain, chainConfig]);

  const restApi = useMemo(() => {
    if (selectedNetwork === "local") return "http://localhost:1317";
    return networkConfig?.apis.rest[0].address;
  }, [networkConfig, selectedNetwork]);

  const resetNetworks = useCallback(
    (chain: string) => {
      const newChain = availableChains.find((c) => c.value === chain);
      if (newChain) {
        setCurrentChain(newChain);
        fetchNetworks(newChain.parent);
        setLocation(`/${chain}`);
      }
    },
    [availableChains, fetchNetworks, setLocation],
  );

  const setChain = useCallback(
    (chain: ChainListItem) => {
      setCurrentChain(chain);
      setLocation(`/${chain.value}`);
    },
    [setLocation],
  );

  const networkContextValue = useMemo(
    () => ({
      location,
      setLocation,
      currentChain: chainItem,
      currentNetworkName: selectedNetwork,
      siblingNetworkNames,
      networkConfig,
      error,
      api: restApi,
      resetNetworks,
      setCurrentChain: setChain,
      setCurrentNetworkName: (networkName: string | null) => {
        const newSearch = new URLSearchParams(search);
        if (networkName) {
          newSearch.set("network", networkName);
        } else {
          newSearch.delete("network");
        }
        setLocation(`${location?.split("?")[0] || ""}?${newSearch.toString()}`);
      },
    }),
    [
      location,
      setLocation,
      chainItem,
      selectedNetwork,
      siblingNetworkNames,
      networkConfig,
      error,
      restApi,
      resetNetworks,
      setChain,
      search,
    ],
  );
  return (
    <NetworkContext.Provider value={networkContextValue}>
      {children}
    </NetworkContext.Provider>
  );
};
