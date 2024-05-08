import { useMemo } from "react";
import { capitalize } from "../utils/capitalize";
import { DropdownMenu } from "./DropdownMenu";
import { useChain } from "../hooks/useChain";

const placeholderText = "Select Chain";

const ChainMenu = () => {
  const { currentChainName, availableChains } = useChain();
  const title = currentChainName
    ? capitalize(currentChainName)
    : placeholderText;

  const labelImage = useMemo(() => {
    return currentChainName
      ? availableChains.find((c) => c.value === currentChainName)?.image
      : undefined;
  }, [currentChainName, availableChains]);

  return (
    <DropdownMenu
      title={title}
      label={placeholderText}
      labelImage={labelImage}
      items={availableChains}
      showImage={true}
      buttonStyle=""
      dropdownItemStyle=""
    />
  );
};

export { ChainMenu };
