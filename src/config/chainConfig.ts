import {
  AppCurrency,
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

export interface StakeEntry {
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
  staking?: StakeEntry;
}

export const fetchApprovedChains = async (): Promise<string[]> => {
  return ["agoric", "cosmoshub", "juno", "osmosis"];
};

export const getChainNameFromLocation = async (
  location: string,
): Promise<string | null> => {
  const pathname = location.slice(1);
  return fetchApprovedChains().then((chains) =>
    chains.includes(pathname) ? pathname : null,
  );
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
  const fetchedConfig: NetworkConfig = await import(
    `../chainConfig/${chainName}/${networkName}/chain.json`
  );
  return fetchedConfig;
};
export const fetchAvailableChains = async (): Promise<ChainListItem[]> => {
  const chainNames = await fetchApprovedChains();
  return chainNames.map((chainName) => ({
    label: capitalize(chainName),
    value: chainName,
    href: `/${chainName}`,
    image: `/logo/${chainName}.svg`,
  }));
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

/* eslint-disable  @typescript-eslint/no-explicit-any */
const memoize = <T extends (...args: any[]) => any>(fn: T) => {
  const cache = new Map<string, ReturnType<T>>();

  return (...args: Parameters<T>): ReturnType<T> => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key) as ReturnType<T>;
    }
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
};
//Thinking chain should be sanitized at this stage so we assume chainName is a valid name
// we do not expect
export const getChainInfo = async (chainName: string) => {
  const networkfForthisChain = await fetchNetworksForChain(chainName);
  //TODO: check networks must be > 0
  if (networkfForthisChain.length === 0) {
    throw new Error(`No networks found for chain ${chainName}`);
  }
  const chainConfig = async (networkName: string) => {
    console.error("current chain name", chainName);
    try {
      const fetchedConfig = await import(
        `../chainConfig/${chainName}/${networkName}/chain.json`
      );
      console.error(" fetchedConfig is ", fetchedConfig.bech32Prefix);

      const bech32Config: Bech32Config = generateBech32Config(
        fetchedConfig.bech32Prefix,
      );
      const stakeCurrency = makeCurrency(
        fetchedConfig.staking?.stakingTokens?.[0]?.denom || "",
      );
      const feeCurrencies = makeCurrency(
        fetchedConfig.fees?.feeTokens?.[0]?.denom || "",
      );
      const currencies = [feeCurrencies, stakeCurrency];
      console.error("currencies are ", currencies);
      const chainInfo: ChainInfo = {
        rpc: fetchedConfig.apis.rpc[0].address,
        rest: fetchedConfig.apis.rest[0].address,
        chainId: fetchedConfig.chainId,
        chainName: fetchedConfig.chainId,
        stakeCurrency,
        feeCurrencies: [feeCurrencies],
        bech32Config: bech32Config,
        bip44: {
          coinType: fetchedConfig.slip44,
        },
        currencies: currencies,
      };
      console.error("chain info is ", chainInfo);
      return chainInfo;
    } catch (error) {
      console.error(
        `Failed to fetch chain info for ${chainName}/${networkName}:`,
        error,
      );
      return null;
    }
  };
  return memoize(chainConfig);
  // const chainInfos = networkfForthisChain.map(chainConfig);
};

export const makeChainInfo = async (networkConfig: NetworkConfig) => {
  let stakeCurrency: FeeCurrency | undefined = undefined;
  const bech32Config: Bech32Config = generateBech32Config(
    networkConfig.bech32Prefix,
  );
  if (!networkConfig.fees) {
    throw new Error("No fees found in network config");
  }
  if (networkConfig.staking?.stakingTokens) {
    stakeCurrency = makeCurrency({
      minimalDenom: networkConfig.staking.stakingTokens[0].denom,
    });
  }

  const feeCurrencies = makeCurrency({
    minimalDenom: networkConfig.fees.feeTokens[0].denom,
  });
  const currencies = [feeCurrencies, stakeCurrency];
  const chainInfo: ChainInfo = {
    rpc: networkConfig.apis.rpc[0].address,
    rest: networkConfig.apis.rest[0].address,
    chainId: networkConfig.chainId,
    chainName: networkConfig.chainName,
    stakeCurrency,
    feeCurrencies: [feeCurrencies],
    bech32Config: bech32Config,
    bip44: {
      coinType: networkConfig.slip44,
    },
    currencies: currencies.filter(
      (
        currency,
      ): currency is AppCurrency & {
        gasPriceStep?: {
          low: number;
          average: number;
          high: number;
        };
      } => currency !== undefined,
    ),
  };
  return chainInfo;
};
