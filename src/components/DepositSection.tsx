import React, { useMemo, useRef } from "react";
import { UseQueryResult, useQueries, useQuery } from "@tanstack/react-query";
import { useNetwork } from "../hooks/useNetwork";
import { useWallet } from "../hooks/useWallet";
import {
  accountBalancesQuery,
  depositParamsQuery,
  votingParamsQuery,
} from "../lib/queries";
import type { DepositParams, VotingParams } from "../types/gov";
import { renderCoins, coinsUnit } from "../utils/coin";
import moment from "moment";
import { WalletConnectButton } from "./WalletConnectButton.tsx";
import { NetworkDropdown } from "./NetworkDropdown.tsx";
import { selectCoins } from "../lib/selectors.ts";

export const DepositSection: React.FC<unknown> = () => {
  const { networkConfig } = useNetwork();
  const { walletAddress, api } = useWallet();
  const depositRef = useRef<HTMLInputElement>(null);
  const denom = networkConfig?.fees.feeTokens[0].denom || "ubld";
  const { minDeposit, votingPeriod } = useQueries({
    queries: [depositParamsQuery(api!), votingParamsQuery(api!)],
    combine: (
      results: [
        UseQueryResult<DepositParams, unknown>,
        UseQueryResult<VotingParams, unknown>,
      ],
    ) => {
      const [deposit, voting] = results;
      return {
        minDeposit: deposit.data?.min_deposit,
        votingPeriod: voting.data?.voting_period,
      };
    },
  });

  const accountBalances = useQuery(accountBalancesQuery(api!, walletAddress));
  const coins = useMemo(
    () => selectCoins(denom, accountBalances),
    [accountBalances, denom],
  );
  const renderTime = (time: string | undefined) => {
    const onlyNumberTime = String(time).slice(0, -1);
    const duration = moment.duration(onlyNumberTime, "seconds");
    let formattedTime = "";
    if (duration.asSeconds() < 86400) {
      if (duration.asSeconds() <= 60) {
        formattedTime = duration.asSeconds() + " seconds";
      } else {
        formattedTime = duration.asMinutes() + " minutes";
      }
    }
    if (duration.asSeconds() >= 86400) {
      formattedTime = duration.asDays() + " days";
    }
    return formattedTime;
  };

  return (
    <div className="sm:grid sm:grid-cols-1 sm:items-start sm:gap-1.5 sm:py-3">
      <label htmlFor="description" className="text-sm font-medium text-blue">
        Deposit
      </label>
      <div className="">
        <input
          type="number"
          min="0"
          step="1" // ensures integer
          name="deposit"
          id="deposit"
          ref={depositRef}
          defaultValue={minDeposit ? coinsUnit(minDeposit) : ""}
          className="block w-full rounded-md border-0 py-3 text-gray-900 shadow-sm ring-1 ring-inset ring-light placeholder:text-gray-400 focus:ring-1 focus:ring-inset focus:ring-red max-w-[250px]"
        />

        <div className="mt-[10px] text-sm text-blue bg-whiteMod p-[20px] rounded-md">
          <div className={`flex items-center border-b pb-3 mb-3`}>
            <div className={`basis-auto pr-3`}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="12"
                viewBox="0 0 18 12"
                fill="none"
              >
                <path
                  d="M18 11.398V0.599915H7.25653V11.398H18ZM10.8414 4.20305H14.4207V7.80053H10.8358L10.8414 4.20305Z"
                  fill="#0F3941"
                />
                <path
                  d="M0 4.19745H3.57926V7.79492H0V4.19745Z"
                  fill="#0F3941"
                />
              </svg>
            </div>
            <div className={`basis-auto grow`}>
              <div className={"flex justify-between items-center"}>
                <div className={"basis-auto"}>
                  <span>
                    A proposal requires{" "}
                    {api ? (
                      <span className="font-semibold">
                        {minDeposit
                          ? renderCoins(minDeposit) + " "
                          : "Unavailable "}
                      </span>
                    ) : (
                      <span>network </span>
                    )}
                    to enter voting period.
                  </span>
                </div>
                <div className={"basis-auto"}>
                  {!api && <NetworkDropdown />}
                </div>
              </div>
            </div>
          </div>

          <div className={`flex items-center border-b pb-3 mb-3`}>
            <div className={`basis-auto pr-3`}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
              >
                <path
                  d="M10.7564 10.7564C13.1522 10.4357 15 8.38361 15 5.9C15 3.1938 12.8062 1 10.1 1C7.61639 1 5.56434 2.84777 5.24359 5.24359M10.8 10.1C10.8 12.8062 8.6062 15 5.9 15C3.1938 15 1 12.8062 1 10.1C1 7.3938 3.1938 5.2 5.9 5.2C8.6062 5.2 10.8 7.3938 10.8 10.1Z"
                  stroke="#0F3941"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className={`basis-auto grow`}>
              <div className={"flex justify-between items-center"}>
                <div className={"basis-auto"}>
                  <span>
                    Current balance:{" "}
                    {coins && (
                      <span className="font-semibold">
                        {renderCoins(coins)}
                      </span>
                    )}
                  </span>
                </div>
                <div className={"basis-auto"}>
                  {!walletAddress && <WalletConnectButton theme={"white"} />}
                </div>
              </div>
            </div>
          </div>

          <div className={`flex items-center`}>
            <div className={`basis-auto pr-3`}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="15"
                height="15"
                viewBox="0 0 15 15"
                fill="none"
              >
                <path
                  d="M7.5 3.6V7.5L10.1 8.8M14 7.5C14 11.0899 11.0899 14 7.5 14C3.91015 14 1 11.0899 1 7.5C1 3.91015 3.91015 1 7.5 1C11.0899 1 14 3.91015 14 7.5Z"
                  stroke="#0F3941"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className={`basis-auto grow`}>
              <span>
                Voting Period:{" "}
                <span className="font-semibold">
                  {renderTime(votingPeriod) || "Unavailable"}
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
