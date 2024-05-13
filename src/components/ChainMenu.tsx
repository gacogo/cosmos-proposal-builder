import { useMemo } from "react";
import { capitalize } from "../utils/capitalize";
import { DropdownMenu } from "./DropdownMenu";
import { useNetwork } from "../hooks/useNetwork";
import { useWallet } from "../hooks/useWallet";
import { useChain } from "../hooks/useChain";

const placeholderText = "Select Chain";

const ChainMenu = () => {
  const { availableChains } = useChain();
  const { currentChain, setCurrentChain } = useNetwork();
  const { isLoading: isLoadingWallet, walletAddress } = useWallet();

  const title = currentChain ? capitalize(currentChain.label) : placeholderText;
  const labelImage = useMemo(
    () => (currentChain ? currentChain.image : undefined),
    [currentChain],
  );

  const items = useMemo(() => {
    if (availableChains) {
      return availableChains.map(({ label, value, image, href, parent }) => ({
        label,
        value,
        image,
        onClick: () => {
          setCurrentChain({ value, label, image, href, parent });
        },
      }));
    }
    return [{ label: "Loading...", value: "" }];
  }, [availableChains, setCurrentChain]);

  console.error("items", items);
  const status = useMemo(() => {
    if (isLoadingWallet) return "loading";
    if (walletAddress && currentChain) return "active";
    if (!walletAddress) return "default";
    return "error";
  }, [isLoadingWallet, walletAddress, currentChain]);

  return (
    <DropdownMenu
      title={title}
      label={placeholderText}
      labelImage={labelImage}
      items={items}
      status={status}
      showImage={true}
    />
  );
};

export { ChainMenu };
