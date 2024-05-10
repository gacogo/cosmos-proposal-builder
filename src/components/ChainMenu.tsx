import { useMemo } from "react";
import { capitalize } from "../utils/capitalize";
import { DropdownMenu } from "./DropdownMenu";
import { useNetwork } from "../hooks/useNetwork";
import { useWallet } from "../hooks/useWallet";
import { useChain } from "../hooks/useChain";

const placeholderText = "Select Chain";

const ChainMenu = () => {
  const {availableChains} = useChain();
  const { currentChain, setCurrentChain } = useNetwork();
  const { isLoading: isLoadingWallet, walletAddress } = useWallet();

  const title = currentChain ? capitalize(currentChain.label) : placeholderText;

  const items = useMemo(() => {
    if (availableChains) {
      return availableChains.map((chain) => ({
        label: capitalize(chain.label),
        value: chain,
        onClick: () => {
          setCurrentChain(chain);
        },
      }));
    }
    return [{ label: "Loading...", href: "#", value: "" }];
  }, [availableChains, setCurrentChain]);

  const status = useMemo(() => {
    if (isLoadingWallet) return "loading";
    if (walletAddress && currentChain) return "active";
    if (!walletAddress) return "default";
    return "error";
  }, [isLoadingWallet, walletAddress, currentChain]);

  return <DropdownMenu title={title} label={placeholderText} items={items} status={status} />;
};

export { ChainMenu };