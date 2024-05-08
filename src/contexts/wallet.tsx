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
}

export const WalletContext = createContext<WalletContextValue>({
  walletAddress: null,
  connectWallet: () => Promise.resolve(),
  stargateClient: undefined,
  isLoading: false,
  rpc: null,
});

export const WalletContextProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const stargateClient = useRef<SigningStargateClient | undefined>(undefined);
  const { currentNetworkName, networkConfig, currentChainName } = useNetwork();
  const [currNetName, setCurrNetName] = useState(networkConfig?.chainId);

  const [walletAddress, setWalletAddress] = useState<
    WalletContextValue["walletAddress"]
  >(() => {
    if (window.localStorage.getItem("walletAddress")) {
      return window.localStorage.getItem("walletAddress") || null;
    }
    return null;
  });

  const [rpc, setRpc] = useState<WalletContextValue["rpc"]>(() => {
    if (window.localStorage.getItem("rpc")) {
      return window.localStorage.getItem("rpc") || null;
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState(false);

  const saveAddress = useCallback(({ address }: AccountData) => {
    window.localStorage.setItem("walletAddress", address);
    setWalletAddress(address);
  }, []);

  const handleWalletChange = useCallback(async () => {
    setIsLoading(true);

    if (currentChainName && currentNetworkName && networkConfig) {
      //suspect
      try {
        if (!window.keplr) {
          toast.error("Missing Keplr", {
            position: "top-right",
            autoClose: 30000,
          });
          throw Error("Missing Keplr");
        }
        const { chainId } = await makeChainInfo(networkConfig);

        if (chainId) {
          await window.keplr.enable(chainId);
          const offlineSigner = window.keplr.getOfflineSigner(chainId);
          const accounts = await offlineSigner.getAccounts();
          if (accounts?.[0].address !== walletAddress) {
            saveAddress(accounts[0]);
          }
        }
      } catch (error) {
        setIsLoading(false);
        toast.error(
          "Error  handling wallet change. Reload the page or contact support",
          {
            position: "top-right",
            autoClose: 30000,
          },
        );
        console.error("Error handling wallet change:", error);
      }
    }
  }, [currentChainName, currentNetworkName, walletAddress, saveAddress]);

  const connectWallet = useCallback(async () => {
    setIsLoading(true);

    try {
      if (!networkConfig) {
        toast.error("No network config found", {
          position: "top-right",
          autoClose: 30000,
        });
        throw new Error("No network config found");
      }
      const { chainId, rpc, feeCurrencies } =
        await makeChainInfo(networkConfig);
      setRpc(rpc);

      const { keplr } = window;

      if (!keplr) {
        toast.error("Missing Keplr", {
          position: "top-right",
          autoClose: 30000,
        });
        throw Error("Missing Keplr");
      }
      if (chainId) {
        // setChainInfo(chainInfo);
        await keplr.enable(chainId);
        const offlineSigner = keplr.getOfflineSigner(chainId);
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
          toast.error("Error setting up SigningStargateClient: " + error, {
            position: "top-right",
            autoClose: 30000,
          });
          console.error("Error setting up SigningStargateClient:", error);
          window.localStorage.removeItem("walletAddress");
        }
      }
    } catch (error) {
      console.error("Failed to suggest chain:", error);
      toast.error("Select network first.", {
        position: "top-right",
        autoClose: 30000,
      });
    } finally {
      setIsLoading(false);
    }
  }, [
    currNetName,
    currentNetworkName, // not sure about this
    walletAddress,
    networkConfig,
    saveAddress,
  ]);

  //TODO: Should we try connecting when rpc change as well?
  useEffect(() => {
    if (networkConfig && currNetName !== networkConfig.chainId) {
      setWalletAddress(null);
      stargateClient.current = undefined;
      if (walletAddress) connectWallet();
      setCurrNetName(networkConfig.chainId);
    }
  }, [networkConfig, currNetName, walletAddress, connectWallet]);

  useEffect(() => {
    if (!currentNetworkName && stargateClient.current) {
      stargateClient.current = undefined;
      setWalletAddress(null);
      return;
    }
    if (walletAddress && currentNetworkName && !stargateClient.current) {
      connectWallet();
    }
  }, [walletAddress, currentNetworkName, saveAddress, connectWallet]);

  useEffect(() => {
    window.addEventListener("keplr_keystorechange", handleWalletChange);
    return () => {
      window.removeEventListener("keplr_keystorechange", handleWalletChange);
    };
  }, [handleWalletChange]);

  useEffect(() => {
    if (networkConfig && currNetName && !walletAddress) {
      connectWallet();
    }
  }, [networkConfig, currentNetworkName, walletAddress, connectWallet]);

  useEffect(() => {
    if (!networkConfig && stargateClient.current) {
      stargateClient.current = undefined;
      return;
    }
    if (walletAddress && networkConfig && !stargateClient.current) {
      connectWallet();
    }
  }, [
    walletAddress,
    currentChainName,
    currNetName,
    networkConfig,
    connectWallet,
    saveAddress,
    handleWalletChange,
  ]);

  useEffect(() => {
    if (!networkConfig) {
      setWalletAddress(null);
      setRpc(null);
      setCurrNetName(undefined);
      window.localStorage.removeItem("walletAddress");
      stargateClient.current = undefined;
    }
  }, [currentChainName]); //TODO: wallet only changes upon networ/wallet switcj

  return (
    <WalletContext.Provider
      value={{
        walletAddress,
        connectWallet,
        stargateClient: stargateClient.current,
        isLoading,
        rpc,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};
