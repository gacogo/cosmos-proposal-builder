import { createContext } from "react";
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

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  const availableChains = chainList.map((chain) => ({
    ...chain,
  }));

  console.error("availableChains", availableChains);

  return (
    <ChainContext.Provider
      value={{
        currentChainName: chainName,
        availableChains,
      }}
    >
      {children}
    </ChainContext.Provider>
  );
};
