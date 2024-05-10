import {
  Bech32Config,
  ChainInfo,
  FeeCurrency,
} from "@keplr-wallet/types";
import { ChainListItem } from "../contexts/chain";
import { capitalize } from "../utils/capitalize";
import { renderDenom } from "../utils/coin";
import { toast } from "react-toastify";

export interface ApiEntry {
  address: string;
  provider?: string;
}

export interface Apis {
  rpc: ApiEntry[];
  rest: ApiEntry[];
  grpc?: ApiEntry[];
}

export type GaspPriceStep = {
  fixed: number;
  low: number;
  average: number;
  high: number;
};

export interface StakeCurrencyEntry {
  stakingTokens: FeeToken[];
}
export interface FeeToken {
  denom: string;
  fixedMinGasPrice?: number;
  lowGasPrice?: number;
  averageGasPrice?: number;
  highGasPrice?: number;
}
export interface FeeEntry {
  feeTokens: FeeToken[];
  gasPriceStep?: GaspPriceStep;
}

export interface NetworkConfig {
  chainName: string;
  chainId: string;
  networkName: string;
  slip44: number;
  fees: FeeEntry;
  bech32Prefix: string;
  apis: Apis;
  logoURIs?: string[];
  staking?: StakeCurrencyEntry;
  explorers?: ExplorerEntry[];
  walletUrl?: string;
}
export interface ExplorerEntry {
  name?: string;
  url: string;
  txPage?: string;
  accountPage?: string;
}

// export const fetchApprovedChains = async (): Promise<Record<string, string>> => {
//   try {
//     const { default: chains } = await import("../chainConfig/index.json");
//     const result = Object.fromEntries(
//       Object.entries(chains).map(([key, value]) => [key, value === true ? key : value])
//     );
//     console.error(" object entries", Object.entries(chains));
//     console.error(" object keys", Object.keys(chains));
//     console.error('mapped object', result);
//     return result;
//     // return Object.entries(chains).map(([key, value]) => key);
//     // return Object.entries(chains).map((value) => value[0])
//   } catch (error) { 
//     console.error("Failed to fetch approved chains:", error);
//     toast.error("Failed to fetch approved chains");
//     return [];
//   }
// };

export type ChainRouter = Record<string, string | boolean>;
// maybe [chainName, chainParent] is the right type
const fetchApprovedChains = async (): Promise<Record<string, string>> => {
  try {
    const { default: chains } = await import("../chainConfig/index.json") as { default: ChainRouter};
    // const approvedChains: Record<string, string> = Object.fromEntries(
    //   Object.entries(chains).map(([key, value]) => [key, value.toString()])
    // );
    const result = Object.fromEntries(
      Object.entries(chains).map(([key, value]) => [key, value === true ? key : value])
    )
    return result as Record<string, string>;
  } catch (error) {
    console.error("Failed to fetch approved chains:", error);
    toast.error("Failed to fetch approved chains");
    return {};
  }
};
//start here 
export const getChainNameFromLocation = async (
  location: string,
): Promise<string | null> => {
  const pathname = location.slice(1);
  return fetchApprovedChains().then((chains) =>
    Object.keys(chains).includes(pathname) ? pathname : null,).catch(() => {throw new Error("Failed to fetch approved chains")});
};

export const fetchNetworksForChain = async (
  chainName: string,
): Promise<string[]> => {
  try {
    const { default: networks } = await import(
      `../chainConfig/${chainName}/index.json`
    );
    return networks;
  } catch (error) {
    console.error(`Failed to fetch networks for chain ${chainName}:`, error);
    toast.error(`Failed to fetch networks for chain ${chainName}`);
    return [];
  }
};

export const generateBech32Config = (bech32Prefix: string): Bech32Config => ({
  bech32PrefixAccAddr: bech32Prefix,
  bech32PrefixAccPub: `${bech32Prefix}pub`,
  bech32PrefixValAddr: `${bech32Prefix}valoper`,
  bech32PrefixValPub: `${bech32Prefix}valoperpub`,
  bech32PrefixConsAddr: `${bech32Prefix}valcons`,
  bech32PrefixConsPub: `${bech32Prefix}valconspub`,
});

export const fetchChainConfig = async (
  chainName: string,
  networkName: string,
): Promise<NetworkConfig> => {
  console.error("fetchChainConfig", chainName, networkName);
  console.error(`../chainConfig/${chainName}/${networkName}/chain.json`);
  const fetchedConfig: NetworkConfig = await import(
    `../chainConfig/${chainName}/${networkName}/chain.json`
  );
  console.log("fetchedConfig", fetchedConfig);
  return fetchedConfig;
};
export const fetchAvailableChains = async (): Promise<ChainListItem[]> => {
  try {
  const chainNames = await fetchApprovedChains();
  return Object.entries(chainNames).map(([chainName, chainParent]) => ({
    label: capitalize(chainName),
    value: chainName,
    parent: chainParent as string,
    href: `/${chainName}`,
    image: `/logo/${chainName}.svg`,
  }));
} catch (error) {
  console.error("Failed to fetch available chains:", error);
  toast.error("Failed to fetch available chains");
  return [];
}
  // return chainNames.map((chainName) =>({
  //   label: capitalize(chainName),
  //   value: chainName,
  //   // chainParent: typeof chainName[1] === 'string'? chainName[1] : null,
  //   href: `/${chainName}`,
  //   image: `/logo/${chainName}.svg`,
  // }));
};


export const memoize = <T>(fn: (...args: any[]) => T): ((...args: any[]) => T) => {
  const cache = new Map<string, T>();
  return (...args: any[]) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
};

export const makeCurrency = ({
  minimalDenom,
  exponent,
  gasPriceStep,
}: {
  minimalDenom: string;
  exponent?: number;
  gasPriceStep?: GaspPriceStep;
}): FeeCurrency => {
  const feeCurrency: FeeCurrency = {
    coinDenom: renderDenom(minimalDenom),
    coinMinimalDenom: minimalDenom,
    coinDecimals: exponent || 6,
    gasPriceStep: gasPriceStep || { low: 0, average: 0, high: 0 },
  };
  return feeCurrency;
};

export const stableCurrency = makeCurrency({minimalDenom: "uist", exponent: 6});


//TODO: return only the rpc and rest enpoints that are live
export const makeChainInfo = memoize(async (networkConfig: NetworkConfig): Promise<ChainInfo> => {
  let stakeCurrency: FeeCurrency | undefined = undefined;
  const { chainName, apis, networkName, chainId, bech32Prefix, fees, slip44, staking } = networkConfig;
  // const rpcAddr = rpcAddrs[index];
  // const rpc = rpcAddr.match(/:\/\//) ? rpcAddr : `http://${rpcAddr}`;
  const {rpc, rest } = apis;
  const restIndex = Math.floor(Math.random() * (rest ? rest.length : 1));
  const rpcIndex = Math.floor(Math.random() * (rpc ? rpc.length : 1));
  const restAddr = rest[restIndex].address;
  const rpcAddr = rpc[rpcIndex].address;
  const rpcendpoint = rpcAddr.match(/:\/\//) ? rpcAddr : `http://${rpcAddr}`;
  const restendpoint = restAddr.match(/:\/\//) ? restAddr : `http://${restAddr}`;
  // const restendpoint = rest[restIndex].address.match(/:\/\//) ? rest[restIndex].address : `http://${rest[restIndex].address}`;
  // const rpcendpoint = rpc[rpcIndex].address.match(/:\/\//) ? rpc[rpcIndex].address : `http://${rpc[rpcIndex].address}`;
  const bech32Config: Bech32Config = generateBech32Config(bech32Prefix);
  if (!fees) {
    throw new Error("No fees found in network config");
  }
  if (staking?.stakingTokens) {
    stakeCurrency = makeCurrency({
      minimalDenom: staking.stakingTokens[0].denom,
    });
  }

  const feeCurrencies = makeCurrency({
    minimalDenom: fees.feeTokens[0].denom,
  });
  const currencies = [feeCurrencies, stakeCurrency, stableCurrency];
  const chainInfo: ChainInfo = {
    rpc: rpcendpoint,
    rest: restendpoint,
    chainId: chainName === "agoric"  ||networkName === "mainnet" ? chainId : chainName,
    // chainId: chainId, // try using chainName here
    chainName: `${chainName} ${networkName}`,
    stakeCurrency: stakeCurrency,
    feeCurrencies: [feeCurrencies, stableCurrency],
    bech32Config: bech32Config,
    bip44: {
      coinType: slip44
    },
    currencies: currencies.filter((currency): currency is FeeCurrency => !!currency
    ),
    features: ["stargate", "ibc-transfer"],
  };
  return chainInfo;
});

export const enabledProposals = async (chainName: string) => {
  const {default: proposals} = await import(`../chainConfig/${chainName}/enabledProposalTypes.json`);
  const enabledNames = Object.entries(proposals)
  .filter(([key, value]) => value === true)
  .map(([key]) => key) as QueryParams["msgType"][];  
  console.error('enabled proposals are ', enabledNames);

  return enabledNames;
}