import {
  createContext,
  useEffect,
  useState,
  useRef,
  ReactNode,
  useCallback,
} from "react";
import { Decimal } from "@cosmjs/math";
import { SigningStargateClient } from "@cosmjs/stargate";
import { AccountData } from "@keplr-wallet/types";
import { registry } from "../lib/messageBuilder";
import { toast } from "react-toastify";
import { useNetwork } from "../hooks/useNetwork";
import { makeChainInfo } from "../config/chainConfig";

interface WalletContextValue {
  walletAddress: string | null;
  connectWallet: () => Promise<void>;
  stargateClient: SigningStargateClient | undefined;
  isLoading: boolean;
  rpc: string | null;
  api: string | null;
}

export const WalletContext = createContext<WalletContextValue>({
  walletAddress: null,
  connectWallet: () => Promise.resolve(),
  stargateClient: undefined,
  isLoading: false,
  rpc: null,
  api: null,
});
export const WalletContextProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const stargateClient = useRef<SigningStargateClient | undefined>(undefined);
  const { networkConfig, currentChain } = useNetwork();
  const [api, setApi] = useState<WalletContextValue["api"]>(null);
  const [walletAddress, setWalletAddress] = useState<
    WalletContextValue["walletAddress"]
  >(() => {
    if (window.localStorage.getItem("walletAddress")) {
      return window.localStorage.getItem("walletAddress") || null;
    }
    return null;
  });
  const [rpc, setRpc] = useState<WalletContextValue["rpc"]>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currChain, setCurrChain] = useState<string | undefined>(
    networkConfig?.chainId,
  );

  const saveAddress = useCallback(({ address }: AccountData) => {
    window.localStorage.setItem("walletAddress", address);
    setWalletAddress(address);
  }, []);

  const removeAddress = useCallback(() => {
    window.localStorage.removeItem("walletAddress");
    setWalletAddress(null);
  }, []);

  const connectWallet = useCallback(async () => {
    setIsLoading(true);

    if (!window.keplr) {
      toast.error("Keplr not found", {
        position: "top-right",
        autoClose: 3000,
      });
      throw Error("Missing Keplr");
    }

    try {
      if (!networkConfig || !currentChain) {
        toast.error("No network config or current chain found", {
          position: "top-right",
          autoClose: 3000,
        });
        throw new Error("No network config or current chain found");
      }

      const { chainId, rpc, rest, feeCurrencies } =
        await makeChainInfo(networkConfig);

      if (chainId) {
        console.error("chain id is ", chainId);
        setRpc(rpc);
        setApi(rest);
        await window.keplr.enable(chainId);
        const offlineSigner = window.keplr.getOfflineSigner(chainId);
        const accounts = await offlineSigner.getAccounts();
        if (accounts?.[0].address !== walletAddress) {
          saveAddress(accounts[0]);
        }

        try {
          stargateClient.current =
            await SigningStargateClient.connectWithSigner(rpc, offlineSigner, {
              registry,
              gasPrice: {
                denom: feeCurrencies[0].coinMinimalDenom,
                amount: Decimal.fromUserInput("500000", 0),
              },
            });
        } catch (error) {
          console.error("Error setting up SigningStargateClient:", error);
          removeAddress();
        }
      }
    } catch (error) {
      console.error("Failed to suggest chain:", error);
      toast.error("Failed to suggest chain " + error, {
        position: "top-right",
        autoClose: 3000,
      });
      stargateClient.current = undefined;
      removeAddress();
    } finally {
      setIsLoading(false);
    }
  }, [networkConfig, currentChain, saveAddress, removeAddress]);

  useEffect(() => {
    if (networkConfig) {
      if (currChain !== networkConfig.chainId) {
        stargateClient.current = undefined;
        setRpc(null);
        setApi(null);
        removeAddress();
        setCurrChain(networkConfig.chainId);
      }
    } else {
      stargateClient.current = undefined;
      setRpc(null);
      setApi(null);
      removeAddress();
      setCurrChain(undefined);
    }
  }, [currentChain, currChain, removeAddress]);

  useEffect(() => {
    if (
      networkConfig &&
      walletAddress &&
      (!stargateClient.current || currChain !== networkConfig.chainId)
    ) {
      connectWallet();
      setCurrChain(networkConfig.chainId);
    }
  }, [networkConfig, walletAddress, stargateClient, currChain, connectWallet]);

  useEffect(() => {
    if (stargateClient.current && (!currChain || !networkConfig)) {
      stargateClient.current = undefined;
      setRpc(null);
      setApi(null);
      removeAddress();
    }
  }, [stargateClient, currChain, networkConfig, removeAddress]);

  return (
    <WalletContext.Provider
      value={{
        walletAddress,
        connectWallet,
        stargateClient: stargateClient.current,
        isLoading,
        rpc,
        api,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};
