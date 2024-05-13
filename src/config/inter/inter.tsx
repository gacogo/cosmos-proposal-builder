import { useMemo, useRef, FormEvent, useState } from "react";
import { toast } from "react-toastify";
import type { CoreEval } from "@agoric/cosmic-proto/swingset/swingset.js";
import { MultiStepProposalForm } from "../../components/MultiStepProposalForm";
import { Tabs } from "../../components/Tabs";
import { useNetwork } from "../../hooks/useNetwork";
import { useWallet } from "../../hooks/useWallet";
import { makeCoreEvalProposalMsg } from "../../lib/messageBuilder";
import { makeSignAndBroadcast } from "../../lib/signAndBroadcast";
import { PSMParameterInputs } from "../../config/inter/components/PSMParameterInputs";
import { VaultParameterInputs } from "../../config/inter/components/VaultParameterInputs";
import { GovDetails } from "../../components/GovDetails";
import { capitalize, firstLetterIsUpperCase } from "../../utils/capitalize";
import { psmJS, psmPermit } from "./addPSM";
import {
  addVaultJs,
  addVaultPermit,
  addOracleJs,
  addOraclePermit,
} from "./addVault";
import { generateFromTemplate } from "./generateFromTemplate";
import { InterLearnMore } from "./components/InterLearnMore";
import {
  EMERYNET_ORACLE_OPERATORS,
  MAINNET_ORACLE_OPERATORS,
} from "./addVault/constants";
import { coinsUnit } from "../../utils/coin.ts";
import { useQuery } from "@tanstack/react-query";
import { accountBalancesQuery } from "../../lib/queries.ts";
import { selectBldCoins } from "../../lib/selectors.ts";

//TODO define enabled proposals for inter as a workaround
const Inter = () => {
  const { currentNetworkName: netName } = useNetwork();
  const { walletAddress, stargateClient, api } = useWallet();
  const psmFormRef = useRef<HTMLFormElement>(null);
  const vaultFormRef = useRef<HTMLFormElement>(null);

  const accountBalances = useQuery(accountBalancesQuery(api!, walletAddress));
  const bldCoins = useMemo(
    () => selectBldCoins(accountBalances),
    [accountBalances],
  );

  const signAndBroadcast = useMemo(
    () => makeSignAndBroadcast(stargateClient, walletAddress, netName!),
    [stargateClient, walletAddress, netName],
  );

  const handlePsmSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const formData = psmFormRef.current?.data();

    if (!walletAddress) {
      toast.error("Wallet not connected.", { autoClose: 3000 });
      return;
    }
    if (!netName) {
      toast.error("Network not selected.", { autoClose: 3000 });
      return;
    }

    if (formData) {
      const denom = formData.get("denom") as string;
      const decimalPlaces = formData.get("decimalPlaces") as string;
      const keyword = formData.get("keyword") as string;
      const proposedName = formData.get("proposedName") as string;
      if (!denom || !denom.startsWith("ibc/")) {
        toast.error("Invalid IBC Denom.", { autoClose: 3000 });
        return;
      }
      if (!keyword || !firstLetterIsUpperCase(keyword)) {
        toast.error("Invalid Issuer Keyword.", { autoClose: 3000 });
        return;
      }
      if (isNaN(parseInt(decimalPlaces))) {
        toast.error("Invalid Decimal Places.", { autoClose: 3000 });
        return;
      }
      if (!proposedName) {
        toast.error("Proposed Name not provided.", { autoClose: 3000 });
        return;
      }

      const generatedAddPsm = generateFromTemplate<AddPSMParams>(psmJS, {
        denom,
        decimalPlaces: Number(decimalPlaces),
        keyword,
        proposedName,
      });

      const evals: CoreEval[] = [
        { jsonPermits: psmPermit, jsCode: generatedAddPsm },
      ];

      const title = (formData.get("title") as string) || "";
      const description = (formData.get("description") as string) || "";
      const depositBld = (formData.get("deposit") as string) || "";
      const deposit = Number(depositBld) * 1_000_000;

      const proposalMsg = makeCoreEvalProposalMsg({
        evals,
        title,
        description,
        deposit,
        proposer: walletAddress as string,
        denom,
      });

      try {
        await signAndBroadcast(proposalMsg, "proposal");
        psmFormRef.current?.reset();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleVaultSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const formData = vaultFormRef.current?.data();

    if (!walletAddress) {
      toast.error("Wallet not connected.", { autoClose: 3000 });
      return;
    }
    if (!netName) {
      toast.error("Network not selected.", { autoClose: 3000 });
      return;
    }

    if (formData) {
      const denom = formData.get("denom") as string;
      const decimalPlaces = formData.get("decimalPlaces") as string;
      const issuerName = formData.get("issuerName") as string;

      if (!denom || !denom.startsWith("ibc/")) {
        toast.error("Invalid IBC Denom.", { autoClose: 3000 });
        return;
      }
      if (isNaN(parseInt(decimalPlaces))) {
        toast.error("Invalid Decimal Places.", { autoClose: 3000 });
        return;
      }
      if (!issuerName) {
        toast.error("Issuer Name not provided.", { autoClose: 3000 });
        return;
      }

      const templateParams = {
        denom,
        decimalPlaces: Number(decimalPlaces),
        issuerName,
        keyword: capitalize(issuerName),
        oracleBrand: issuerName,
        proposedName: issuerName,
        oracleAddresses:
          netName === "mainnet"
            ? MAINNET_ORACLE_OPERATORS
            : EMERYNET_ORACLE_OPERATORS,
      };
      const generatedAddVaultJs = generateFromTemplate<AddVaultParams>(
        addVaultJs,
        templateParams,
      );
      const generatedAddOracleJs = generateFromTemplate<AddVaultParams>(
        addOracleJs,
        templateParams,
      );

      const evals: CoreEval[] = [
        { jsonPermits: addOraclePermit, jsCode: generatedAddOracleJs },
        { jsonPermits: addVaultPermit, jsCode: generatedAddVaultJs },
      ];

      const title = (formData.get("title") as string) || "";
      const description = (formData.get("description") as string) || "";
      const depositBld = (formData.get("deposit") as string) || "";
      const deposit = Number(depositBld) * 1_000_000;

      const proposalMsg = makeCoreEvalProposalMsg({
        evals,
        title,
        description,
        deposit,
        proposer: walletAddress as string,
        denom,
      });

      try {
        await signAndBroadcast(proposalMsg, "proposal");
        vaultFormRef.current?.reset();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const [alertBox, setAlertBox] = useState(true);

  return (
    <>
      {(!bldCoins || coinsUnit(bldCoins) < 100) && alertBox && (
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
                <span className={"text-red font-black"}>100 Token</span> in your
                wallet to submit this action
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
      <Tabs
        tabs={[
          {
            title: "Add PSM",
            msgType: "addPSM",
            content: (
              <MultiStepProposalForm
                ref={psmFormRef}
                handleSubmit={handlePsmSubmit}
                titleDescOnly={true}
                title="Add PSM"
                description={
                  <>
                    The PSM (Parity Stability Module) is a smart contract that
                    mints IST in exchange for approved stablecoins at a 1-to-1
                    ratio. <InterLearnMore />
                  </>
                }
                tabs={[
                  {
                    title: "Asset Details",
                    content: <PSMParameterInputs />,
                  },
                  {
                    title: "Proposal Details",
                    content: (
                      <GovDetails governanceForumLink="https://community.agoric.com/tags/c/inter-protocol/5/psm" />
                    ),
                  },
                ]}
              />
            ),
          },
          {
            title: "Add Vault Collateral Type",
            msgType: "addVault",
            content: (
              <MultiStepProposalForm
                ref={vaultFormRef}
                handleSubmit={handleVaultSubmit}
                titleDescOnly={false}
                title="Add Vault Collateral Type"
                description={
                  <>
                    Vaults allow users to mint IST by using their assets as
                    collateral. The Add Vault proposal enables a new collateral
                    type to be used for opening vaults. <InterLearnMore />
                  </>
                }
                tabs={[
                  {
                    title: "Asset Details",
                    content: <VaultParameterInputs />,
                  },
                  {
                    title: "Proposal Details",
                    content: (
                      <GovDetails governanceForumLink="https://community.agoric.com/c/inter-protocol/vaults-collateral-discussion/30" />
                    ),
                  },
                ]}
              />
            ),
          },
        ]}
      />
    </>
  );
};

export { Inter };
