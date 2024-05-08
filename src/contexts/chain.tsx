import { createContext, useMemo } from "react";
import { useLocation } from "wouter";
import { fetchAvailableChains } from "../config/chainConfig";
import { useQuery, UseQueryResult, QueryKey } from "@tanstack/react-query";

export type ChainListItem = {
  label: string;
  value: string;
  href: string;
  image: string;
};

export interface ChainContextValue {
  currentChainName: string | null;
  availableChains: ChainListItem[];
}

export const ChainContext = createContext<ChainContextValue>({
  currentChainName: null,
  availableChains: [],
});

export const ChainContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [location] = useLocation();
  const chainName = location.split("/")[1];

  
  const {
    data: chainList = [],
    isLoading,
    error,
  }: UseQueryResult<ChainListItem[], Error> = useQuery<ChainListItem[], Error>({
    queryKey: ["availableChains"] as QueryKey,
    queryFn: () => fetchAvailableChains(),
  });

  const availableChains = chainList.map((chain) => ({
    ...chain,
  }));
  
  const currentChain = useMemo(() => availableChains.find((chain) => chain.value === chainName), [chainName, availableChains]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }
  
  console.log("currentChain", currentChain);
 
  // const currentChain = useMemo(() =>availableChains.map((chain) => chain.value).find((name) => name === chainName), [chainName, availableChains]);
  return (
    <ChainContext.Provider
      value={{
        currentChainName:  currentChain?.value || null,
        availableChains,
      }}
    >
      {children}
    </ChainContext.Provider>
  );
};

/**
 * 
const {
  data: netNames = [],
  isLoading,
  error: queryError,
}: UseQueryResult<string[], Error> = useQuery<string[], Error>({
  queryKey: ["siblingNetworkNames", chainName] as QueryKey,
  queryFn: () => fetchNetworksForChain(chainName as string),
});
 */