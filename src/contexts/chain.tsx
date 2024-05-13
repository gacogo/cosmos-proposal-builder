
import { createContext, useMemo } from "react";
import { useLocation } from "wouter";
import { fetchAvailableChains } from "../config/chainConfig";
import { useQuery, UseQueryResult, QueryKey } from "@tanstack/react-query";

export type ChainListItem = {
  label: string;
  value: string;
  href: string;
  parent: ChainListItem["value"];
  image: string;
};

export interface ChainContextValue {
  currentChain: ChainListItem | null;
  availableChains: ChainListItem[];
  location: string | null;
  setLocation: (location: string) => void;
}

export const ChainContext = createContext<ChainContextValue>({
  currentChain: null,
  availableChains: [],
  location: null,
  setLocation: () => {},
});

export const ChainContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [location, setLocation] = useLocation();
  const chainName = location.split("/")[1];

  const {
    data: chainList = [],
    isLoading: isLoadingChains,
    error,
  }: UseQueryResult<ChainListItem[], Error> = useQuery<ChainListItem[], Error>({
    queryKey: ["availableChains"] as QueryKey,
    queryFn: () => fetchAvailableChains(),
  });

  const currentChain: ChainListItem | undefined = useMemo(
    () => chainList.find((chain) => chain.value === chainName),
    [chainName, chainList],
  );
  if (isLoadingChains) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <ChainContext.Provider
      value={{
        currentChain: currentChain || null,
        availableChains: chainList,
        location,
        setLocation,
      }}
    >
      {children}
    </ChainContext.Provider>
  );
};
