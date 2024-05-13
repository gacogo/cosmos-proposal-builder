import { useMemo } from "react";
import { capitalize } from "../utils/capitalize";
import { DropdownMenu } from "./DropdownMenu";
import { useNetwork } from "../hooks/useNetwork";
import { useWallet } from "../hooks/useWallet";

const placeholderText = "Select Network";

const NetworkDropdown = () => {
  const {
    currentChain,
    currentNetworkName,
    siblingNetworkNames,
    setCurrentNetworkName,
  } = useNetwork();
  const {
    isLoading: isLoadingWallet,
    stargateClient,
    walletAddress,
  } = useWallet();

  const title = currentNetworkName
    ? capitalize(currentNetworkName)
    : placeholderText;

  const items = useMemo(() => {
    if (currentChain && siblingNetworkNames) {
      return [
        {
          label: "Reset Network",
          value: null,
          onClick: () => {
            setCurrentNetworkName(null);
          },
        },
        ...siblingNetworkNames.map((network) => ({
          label: capitalize(network),
          value: network,
          onClick: () => {
            setCurrentNetworkName(network);
          },
        })),
      ];
    }
    return [{ label: "Loading...", value: "" }];
  }, [currentChain, siblingNetworkNames, setCurrentNetworkName]);

  const status = useMemo(() => {
    if (isLoadingWallet) return "loading";
    if (stargateClient && currentChain && currentNetworkName) return "active";
    if (!walletAddress || !currentChain) return "default";
    return "error";
  }, [
    isLoadingWallet,
    currentChain,
    stargateClient,
    walletAddress,
    currentNetworkName,
  ]);

  return (
    <DropdownMenu
      title={title}
      label={placeholderText}
      items={items}
      status={status}
    />
  );
};

export { NetworkDropdown };
