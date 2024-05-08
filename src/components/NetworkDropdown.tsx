import { useMemo } from "react";
import { capitalize } from "../utils/capitalize";
import { DropdownMenu } from "./DropdownMenu";
import { useSearch } from "wouter/use-location";
import { useNetwork } from "../hooks/useNetwork";
import { useWallet } from "../hooks/useWallet";

const placeholderText = "Select Network";

const NetworkDropdown = () => {
  const searchString = useSearch();
  const {
    currentChainName: chain,
    currentNetworkName: networkName,
    networkConfig,
    siblingNetworkNames,
  } = useNetwork();

  const {
    isLoading: isLoadingWallet,
    stargateClient,
    walletAddress,
  } = useWallet();

  const title = networkName ? capitalize(networkName) : placeholderText;

  const items = useMemo(() => {
    if (siblingNetworkNames) {
      return siblingNetworkNames.map((network) => ({
        label: capitalize(network),
        value: network,
        href: `/${chain}?${new URLSearchParams({
          network,
        }).toString()}`,
      }));
    }

    return [{ label: "Loading...", href: "#", value: "" }];
  }, [searchString, networkConfig, siblingNetworkNames]); // should search string be a dependency? - fix this

  const status = useMemo(() => {
    if (isLoadingWallet) return "loading";
    if (stargateClient && chain && networkName) return "active";
    if (!walletAddress || !chain) return "default";
    return "error";
  }, [isLoadingWallet, stargateClient, walletAddress, networkName]);

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
