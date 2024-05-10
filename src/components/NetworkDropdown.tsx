import { useMemo } from "react";
import { capitalize } from "../utils/capitalize";
import { DropdownMenu } from "./DropdownMenu";
import { useNetwork } from "../hooks/useNetwork";
import { useWallet } from "../hooks/useWallet";
// import { useSearch } from "wouter/use-location";

const placeholderText = "Select Network";

const NetworkDropdown = () => {
  const { currentChain, currentNetworkName, siblingNetworkNames, networkConfig, setCurrentChain,location, setLocation, setCurrentNetworkName,  resetNetworks } = useNetwork();
  const { isLoading: isLoadingWallet, stargateClient, walletAddress } = useWallet();
  // const selectedNetwork = useMemo(() => {
  //   const searchParams = new URLSearchParams(search).get('location') ?? "";
  //   return currentChain ? searchParams.set('network', currentChain).toString() : searchParams.delete('network').toString();
  // }, [location, currentChain]);
  // const selectedNetwork = useMemo(
  //   () => new URLSearchParams(search).get("network") ?? null,
  //   [search],
  // );

  const title = currentNetworkName ? capitalize(currentNetworkName) : placeholderText;

  // const items = useMemo(() => {
  //   if (currentChain && siblingNetworkNames) {
  //     return siblingNetworkNames.map((network) => ({
  //       label: capitalize(network),
  //       href: `${window.location.pathname}?${`network=${network}`}`,
  //     }));
  //   }
  //   return [{ label: "Loading...", href: "#", value: "" }];
  // }, [currentChain, siblingNetworkNames, resetNetworks]);

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
    return [{ label: "Loading...", href: "#", value: "" }];
  }, [currentChain, siblingNetworkNames, setCurrentNetworkName]);

  const status = useMemo(() => {
    if (isLoadingWallet) return "loading";
    if (stargateClient && currentChain && currentNetworkName) return "active";
    if (!walletAddress || !currentChain) return "default";
    return "error";
  }, [isLoadingWallet, stargateClient, walletAddress, currentNetworkName]);

  return (
    <DropdownMenu title={title} label={placeholderText} items={items} status={status} />
  );
};

export { NetworkDropdown };