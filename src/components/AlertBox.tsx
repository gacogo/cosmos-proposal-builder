import { coinsUnit } from "../utils/coin";
import { useState } from "react";
import type { Coin } from "../types/bank";

const AMOUNT = 100;

export const AlertBox = ({ coins }: { coins: Coin[] | undefined }) => {
  const [alertBox, setAlertBox] = useState(true);

  return (
    <>
      {(!coins || coinsUnit(coins) < AMOUNT) && alertBox && (
        <div
          className={
            "flex justify-center w-full max-w-7xl px-2 py-2 m-auto bg-white rounded-lg -mb-5"
          }
        >
          <div className={"basis-full"}>
            <div
              className={
                "toast text-center bg-lightblue2 p-4 text-blue font-light rounded-lg flex justify-between items-center"
              }
            >
              <div className={"basis-auto grow pr-4"}>
                You need to have{" "}
                <span className={"text-red font-black"}> {AMOUNT} Token</span>{" "}
                in your wallet to submit this action
              </div>
              <div className={"basis-auto"}>
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 32 32"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className={"cursor-pointer"}
                  onClick={() => setAlertBox(false)}
                >
                  <rect width="32" height="32" rx="6" fill="white" />
                  <path
                    d="M20.5 11.5L11.5 20.5M11.5 11.5L20.5 20.5"
                    stroke="#0F3941"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
