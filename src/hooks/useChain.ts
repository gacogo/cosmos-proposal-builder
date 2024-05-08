import { useContext } from "react";
import { ChainContext } from "../contexts/chain";

export const useChain = () => useContext(ChainContext);
