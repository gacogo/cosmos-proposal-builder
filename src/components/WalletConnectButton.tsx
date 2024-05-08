import { useWallet } from "../hooks/useWallet";
import { Button, ButtonProps } from "../components/Button";
import { trimAddress } from "../utils/trimAddress";
import { useMemo } from "react";
import { toast } from "react-toastify";

const WalletConnectButton = ({ theme }: { theme: ButtonProps["theme"] }) => {
  const { connectWallet, walletAddress, stargateClient } = useWallet();
  const connectHandler = useMemo(
    () => () => {
      connectWallet()
        .then(console.log)
        .catch(console.error)
        .finally(() => console.log("connect wallet finished"));
    },
    [connectWallet],
  );

  const buttonText = useMemo(() => {
    if (!walletAddress || !stargateClient) return "Connect Wallet";
    try {
      return trimAddress(walletAddress);
    } catch (error) {
      console.error("Invalid wallet address:", error);
      toast.error("Invalid wallet address", { autoClose: 3000 });
      return "Invalid Address";
    }
  }, [walletAddress, connectHandler, stargateClient]);

  const handleClick = () => {
    connectHandler();
  };

  return <Button onClick={handleClick} text={buttonText} theme={theme} />;
};

export { WalletConnectButton };
