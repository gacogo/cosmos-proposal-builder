import { useContext } from "react";
import { NetworkContext } from "../contexts/network";

export const useNetwork = () => {
  return useContext(NetworkContext);
};
