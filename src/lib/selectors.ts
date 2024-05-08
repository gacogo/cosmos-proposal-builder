import type { UseQueryResult } from "@tanstack/react-query";
import type { SwingSetParams } from "../types/swingset";
import type { BankBalances, DenomTrace } from "../types/bank";
import { TallyParams, VotingParams, DepositParams } from "../types/gov";
import { objectToArray } from "../utils/object";

export type SelectorFn<T, R> = (
  query: UseQueryResult<T, unknown>,
) => R | undefined;

export const selectStorageCost = (
  query: UseQueryResult<SwingSetParams, unknown>,
) => {
  const { isLoading, data } = query;
  if (isLoading || !data) return undefined;
  const storageByte = data?.beans_per_unit.find((x) => x.key === "storageByte");
  const feeUnit = data?.beans_per_unit.find((x) => x.key === "feeUnit");
  return storageByte && feeUnit
    ? Number(storageByte.beans) / Number(feeUnit.beans)
    : undefined;
};

export const selectBeansPerUnit = (
  query: UseQueryResult<SwingSetParams, unknown>,
) => {
  if (!query?.data) return undefined;
  return query.data?.beans_per_unit;
};

export const selectIstBalance = (
  query: UseQueryResult<BankBalances, unknown>,
) => {
  if (!query?.data) return undefined;
  const itm = (query.data as BankBalances).find((x) => x.denom === "uist");
  return itm ? BigInt(itm.amount) : undefined;
};

// export const selectBldCoins = (
//   query: UseQueryResult<BankBalances, unknown>,
// ) => {
//   if (!query?.data) return undefined;
//   return (query.data as BankBalances).filter((x) => x.denom === "ubld");
// };

export const selectVotingParams = (
  query: UseQueryResult<VotingParams, unknown>,
) => {
  if (!query?.data) return undefined;
  return objectToArray(query.data);
};

export const selectTallyParams = (
  query: UseQueryResult<TallyParams, unknown>,
) => {
  if (!query?.data) return undefined;
  return objectToArray(query.data);
};

export const selectDepsoitParams = (
  query: UseQueryResult<DepositParams, unknown>,
) => {
  if (!query?.data) return undefined;
  return objectToArray(query.data);
};

/** filter bank assets, so only ibc/* assets are returned */
export const selectIbcAssets = (
  query: UseQueryResult<BankBalances, unknown>,
) => {
  if (!query?.data) return undefined;
  return (query.data as BankBalances).filter((x) => x.denom.startsWith("ibc"));
};

export const selectSinglePathDenomTraces = (
  query: UseQueryResult<DenomTrace[], unknown>,
) => {
  if (!query?.data) return undefined;
  function hasOnePath(trace: DenomTrace): boolean {
    const matches = trace.path.match(/channel/g);
    return !matches || matches.length === 1;
  }
  return query.data.filter(hasOnePath);
};

/** denom eg 'uatom' */
export const selectCoins = (
  denom: string,
  query: UseQueryResult<BankBalances, unknown>,
) => {
  if (!query?.data) return undefined;
  return (query.data as BankBalances).filter((x) => x.denom === denom);
};

export const selectBldCoins = selectCoins.bind(null, "ubld");
