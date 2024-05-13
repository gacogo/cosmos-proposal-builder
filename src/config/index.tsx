import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNetwork } from "../hooks/useNetwork";
import { useWallet } from "../hooks/useWallet";
import { useWatchBundle } from "../hooks/useWatchBundle";
import { accountBalancesQuery } from "../lib/queries";
import { selectCoins } from "../lib/selectors";
import { makeSignAndBroadcast } from "../lib/signAndBroadcast";
import { ProposalArgs, ProposalForm } from "../components/ProposalForm";
import { BundleForm, BundleFormArgs } from "../components/BundleForm";
import { Code } from "../components/inline";
import { FundCommunityPool } from "./proposalTemplates/fundCommunityPool";
import { Tabs } from "../components/Tabs";
import { isValidBundle } from "../utils/validate";
import { compressBundle } from "../lib/compression";
import { AlertBox } from "../components/AlertBox";
import { createProposalMessage } from "../utils/createProposalMessage";
import { toast } from "react-toastify";
import { makeInstallBundleMsg } from "../lib/messageBuilder";
import { enabledProposals } from "./chainConfig";

const ProposalsLandingPage = () => {
  const { networkConfig, currentChain } = useNetwork();
  const { walletAddress, stargateClient, rpc, api } = useWallet();
  const denom = networkConfig?.fees.feeTokens[0].denom;
  const explorerUrl = networkConfig?.explorers?.[0]?.url;

  const [permittedProposals, setPermittedProposals] = useState<
    QueryParams["msgType"][]
  >([]);

  const fetchEnabledProposals = useCallback(async (chainName: string) => {
    try {
      const proposals = await enabledProposals(chainName);
      setPermittedProposals(proposals);
    } catch {
      setPermittedProposals([]);
    }
  }, []);

  // reconfigure permitted proposals when chain changes(not parent chain)
  //TODO: incomplete logic - currently using a workaround for child chains - just inter currently
  useEffect(() => {
    if (currentChain) {
      fetchEnabledProposals(currentChain.value);
    }
  }, [currentChain, fetchEnabledProposals, networkConfig]);

  const watchBundle = useWatchBundle(rpc!, {
    clipboard: window.navigator.clipboard,
  });

  if (!api || !walletAddress) {
    console.error("No api and/or wallet address found. ");
  }
  if (!denom) {
    console.error("No denom found. ");
  }
  if (!explorerUrl) {
    console.error("No explorer url found. ");
  }
  const accountBalances = useQuery(accountBalancesQuery(api!, walletAddress));

  const coinWealth = useMemo(
    () => selectCoins(denom!, accountBalances),
    [accountBalances, denom],
  );
  // const { data: availableFunds = [] } = useQuery(communityPoolQuery(api!));

  const signAndBroadcast = useMemo(
    () =>
      makeSignAndBroadcast(stargateClient, walletAddress, explorerUrl || null),
    [stargateClient, walletAddress, explorerUrl],
  );

  const handleProposal = async (
    msgType: QueryParams["msgType"],
    proposalData: ProposalArgs,
  ) => {
    if (!walletAddress) {
      toast.error("Wallet not connected.", { autoClose: 3000 });
      throw new Error("Wallet not connected");
    }

    const proposalMsg = createProposalMessage(
      msgType,
      proposalData,
      walletAddress,
      denom!,
    );

    if (!proposalMsg) throw new Error("Error parsing query or inputs.");

    try {
      await signAndBroadcast(proposalMsg, "proposal");
    } catch (e) {
      console.error("Error submitting proposal:", e);
      toast.error("Error submitting proposal");
    }
  };

  const handleBundle = async (bundleData: BundleFormArgs) => {
    if (!walletAddress) {
      throw new Error("Wallet not connected");
    }
    if (!isValidBundle(bundleData.bundle)) {
      throw new Error("Invalid bundle.");
    }
    const { compressedBundle, uncompressedSize } = await compressBundle(
      JSON.parse(bundleData.bundle),
    );
    const proposalMsg = makeInstallBundleMsg({
      compressedBundle,
      uncompressedSize,
      submitter: walletAddress,
    });
    if (proposalMsg === null) {
      throw new Error("Error creating proposal message.");
    }
    try {
      const txResponse = await signAndBroadcast(proposalMsg, "bundle");
      if (txResponse) {
        const { endoZipBase64Sha512 } = JSON.parse(bundleData.bundle);
        await watchBundle(endoZipBase64Sha512, txResponse);
      }
    } catch (e) {
      console.error(e);
      toast.error("Error submitting proposal", { autoClose: 3000 });
    }
  };

  const proposalTabs = useMemo(() => {
    const tabs: {
      title: string;
      msgType: QueryParams["msgType"];
      content: ReactNode;
    }[] = [
      {
        title: "Text Proposal",
        msgType: "textProposal",
        content: (
          <ProposalForm
            handleSubmit={(data) => handleProposal("textProposal", data)}
            titleDescOnly={true}
            title="Text Proposal"
            msgType="textProposal"
            governanceForumLink="https://community.agoric.com/c/governance/signaling-proposals/17"
            description={
              <>
                This is a governance proposal that can be used for signaling
                support or agreement on a certain topic or idea. Text proposals
                do not contain any code, and do not directly enact changes after
                a passing vote.
              </>
            }
          />
        ),
      },
      {
        title: "CoreEval Proposal",
        msgType: "coreEvalProposal",
        content: (
          <ProposalForm
            handleSubmit={(data) => handleProposal("coreEvalProposal", data)}
            titleDescOnly={false}
            title="CoreEval Proposal"
            msgType="coreEvalProposal"
            governanceForumLink="https://community.agoric.com/c/governance/core-eval/31"
            description={
              <>
                This is a governance proposal that executes code after a passing
                vote. The JSON Permit grants{" "}
                <a
                  className="cursor-pointer hover:text-gray-900 underline"
                  href="https://docs.agoric.com/guides/coreeval/permissions.html"
                >
                  capabilities
                </a>{" "}
                and the JS Script can start or update a contract. These files
                can be generated with the <Code>agoric run</Code> command. For
                more details, see the{" "}
                <a
                  className="cursor-pointer hover:text-gray-900 underline"
                  href="https://docs.agoric.com/guides/coreeval/"
                >
                  official docs
                </a>
                .
              </>
            }
          />
        ),
      },
      {
        title: "Install Bundle",
        msgType: "installBundle",
        content: (
          <BundleForm
            title="Install Bundle"
            handleSubmit={handleBundle}
            description={
              <>
                The install bundle message deploys and installs an external
                bundle generated during the <Code>agoric run</Code> process. The
                resulting installation can be referenced in a{" "}
                <a
                  className="cursor-pointer hover:text-gray-900 underline"
                  href="https://docs.agoric.com/guides/coreeval/"
                >
                  CoreEval proposal
                </a>{" "}
                that starts or updates a contract.
              </>
            }
          />
        ),
      },
      {
        title: "Parameter Change Proposal",
        msgType: "parameterChangeProposal",
        content: (
          <ProposalForm
            title="Parameter Change Proposal"
            handleSubmit={(data) =>
              handleProposal("parameterChangeProposal", data)
            }
            description="This is a governance proposal to change chain configuration parameters."
            governanceForumLink="https://community.agoric.com/c/governance/parameter-changes/16"
            msgType="parameterChangeProposal"
          />
        ),
      },
      {
        title: "Community Spend Proposal",
        msgType: "communityPoolSpendProposal",
        content: (
          <ProposalForm
            title="Community Spend Proposal"
            handleSubmit={(data) =>
              handleProposal("communityPoolSpendProposal", data)
            }
            description={
              <>
                This governance proposal to spend funds from the community pool.
                The community pool is funded by a portion of the transaction
                fees on the Agoric chain. The proposal must include the
                recipient address and the amount to be sent.
              </>
            }
            msgType="communityPoolSpendProposal"
            governanceForumLink="https://community.agoric.com/c/governance/community-fund/14"
          />
        ),
      },
      {
        title: "Fund Community Pool",
        msgType: "fundCommunityPool",
        content: <FundCommunityPool />,
      },
    ];

    return tabs.filter((tab) =>
      permittedProposals.includes(tab.msgType as QueryParams["msgType"]),
    );
  }, [handleProposal, permittedProposals]);

  return (
    <>
      <AlertBox coins={coinWealth} />
      <Tabs tabs={proposalTabs} />
    </>
  );
};

export default ProposalsLandingPage;
