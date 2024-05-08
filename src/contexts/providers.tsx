import { FC, PropsWithChildren } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ChainContextProvider } from "./chain";
import { NetworkContextProvider } from "./network";
import { WalletContextProvider } from "./wallet";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

const queryClient = new QueryClient();

const ContextProviders: FC<PropsWithChildren> = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <ChainContextProvider>
        <NetworkContextProvider>
          <WalletContextProvider>{children}</WalletContextProvider>
        </NetworkContextProvider>
      </ChainContextProvider>
      <ReactQueryDevtools />
    </QueryClientProvider>
  );
};
export { ContextProviders };
