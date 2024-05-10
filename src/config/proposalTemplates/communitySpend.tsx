import { toast } from "react-toastify";
import { useNetwork } from "../../hooks/useNetwork";
import { useWallet } from "../../hooks/useWallet";
import { makeCommunityPoolSpendProposalMsg } from "../../lib/messageBuilder";
import { makeSignAndBroadcast } from "../../lib/signAndBroadcast";
import { renderDenom } from "../../utils/coin";
import { useState } from "react";
import { DepositSection } from "../../components/DepositSection";
import { Button } from "../../components/Button";
import { useQueries, UseQueryResult } from "@tanstack/react-query";
import { depositParamsQuery, votingParamsQuery } from "../../lib/queries";
import { DepositParams, VotingParams } from "../../types/gov";

interface CommunitySpendProposalFormProps {
  onSubmit: (proposalData: CommunitySpendProposal) => Promise<void>;
}

interface CommunitySpendProposal {
  title: string;
  description: string;
  recipient: string;
  amount: number;
  deposit: number;
}

const CommunitySpendProposalForm: React.FC<CommunitySpendProposalFormProps> = ({
  onSubmit,
}) => {
  const { networkConfig } = useNetwork();
  const { walletAddress, stargateClient, api } = useWallet();
  const denom = networkConfig?.fees.feeTokens[0].denom;
  const signAndBroadcast = makeSignAndBroadcast(
    stargateClient,
    walletAddress,
   networkConfig?.explorers?.[0]?.url || null,
  );

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!walletAddress) {
      throw new Error("Wallet not connected");
    }

    if (!denom) {
      toast.error("No denom provided", { autoClose: 3000 });
      throw new Error("No denom provided");
    }

    const { minDeposit } = useQueries({
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

    const proposalData: CommunitySpendProposal = {
      title,
      description,
      recipient,
      amount: Number(amount),
      deposit: Number(minDeposit),
    };

    const proposalMsg = makeCommunityPoolSpendProposalMsg({
      proposer: walletAddress,
      recipient,
      amount: proposalData.amount,
      denom,
      title: proposalData.title,
      description: proposalData.description,
      deposit: proposalData.deposit,
    });

    try {
      await signAndBroadcast(proposalMsg, "proposal");
      await onSubmit(proposalData as CommunitySpendProposal);
    } catch (e) {
      console.error(e);
      toast.error("Error submitting proposal", { autoClose: 3000 });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-12 sm:space-y-16">
        <div>
          <h2 className="text-[28px] font-semibold text-blue">
            Community Spend Proposal
          </h2>
          <p className="mt-4 text-sm text-grey">
            This governance proposal to spend funds from the community pool. The
            proposal specifies the recipient address and the amount to be spent.
          </p>

          <div className="mt-[30px] border-t border-dotted border-lightgrey py-[20px] sm:border-t sm:pb-0">
            <div className="grid grid-cols-2 gap-[10px] pt-[20px]">
              <label htmlFor="title" className="text-sm font-medium text-blue">
                Title
              </label>
              <input
                type="text"
                name="title"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="col-span-2 mt-0 block w-full rounded-md border-0 py-1.5 text-grey shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                placeholder="Proposal Title"
              />
            </div>
            <div className="grid grid-cols-2 gap-[10px] pt-[20px]">
              <label
                htmlFor="description"
                className="text-sm font-medium text-blue"
              >
                Description
              </label>
              <textarea
                name="description"
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="col-span-2 mt-0 block w-full rounded-md border-0 py-1.5 text-grey shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                placeholder="Proposal Description"
              ></textarea>
            </div>
            <div className="grid grid-cols-2 gap-[10px] pt-[20px]">
              <label
                htmlFor="recipient"
                className="text-sm font-medium text-blue"
              >
                Recipient
              </label>
              <input
                type="text"
                name="recipient"
                id="recipient"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="col-span-2 mt-0 block w-full rounded-md border-0 py-1.5 text-grey shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                placeholder="Recipient Address"
              />
            </div>
            <div className="grid grid-cols-2 gap-[10px] pt-[20px]">
              <div className="flex items-center">
                <label
                  htmlFor="amount"
                  className="text-sm font-medium text-blue"
                >
                  Amount
                </label>
                <span className="ml-2 text-sm text-gray-500">
                  { denom && renderDenom(denom as string) }
                </span>
              </div>
              <input
                type="text"
                name="amount"
                id="amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="col-span-2 mt-0 block w-full rounded-md border-0 py-1.5 text-grey shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                placeholder="Amount to Spend"
              />
            </div>
            <DepositSection />
          </div>
        </div>
      </div>
      <div className="mt-6 flex items-center justify-end gap-x-32">
          <Button
            type="submit"
            Icon={null}
            text="Sign & Submit"
            theme="red"
            layoutStyle="flex w-1/4"
          />
      </div>
    </form>
  );
};

const CommunitySpend: React.FC = () => {
  const handleProposalSubmit = async (proposalData: CommunitySpendProposal) => {
    console.log("Proposal submitted:", proposalData);
  };

  return (
    <div>
      <CommunitySpendProposalForm onSubmit={handleProposalSubmit} />
    </div>
  );
};

export { CommunitySpend };