import { toast } from "react-toastify";
import { ProposalForm, ProposalArgs } from "../../components/ProposalForm";
import { useNetwork } from "../../hooks/useNetwork";
import { useWallet } from "../../hooks/useWallet";
import { makeCommunityPoolSpendProposalMsg } from "../../lib/messageBuilder";
import { makeSignAndBroadcast } from "../../lib/signAndBroadcast";
import { renderDenom } from "../../utils/coin";

interface CommunitySpendProps {
  onSubmit: (proposalData: ProposalArgs) => Promise<void>;
}

const CommunitySpend = ({ onSubmit }: CommunitySpendProps) => {
  const { currentNetworkName: networkName, networkConfig } = useNetwork();
  const { walletAddress, stargateClient } = useWallet();
  const denom = networkConfig?.fees.feeTokens[0].denom;

  const signAndBroadcast = makeSignAndBroadcast(
    stargateClient,
    walletAddress,
    networkName!,
  );

  const handleProposal = async (proposalData: ProposalArgs) => {
    if (!walletAddress) {
      throw new Error("Wallet not connected");
    }

    if (proposalData.msgType !== "communityPoolSpendProposal") {
      throw new Error("Invalid proposal type");
    }

    const { spend } = proposalData;
    if (!spend || spend.length === 0) {
      toast.error("No community pool spend data provided", { autoClose: 3000 });
      throw new Error("No community pool spend data provided");
    }
    if (!denom) {
      toast.error("No denom provided", { autoClose: 3000 });
      throw new Error("No denom provided");
    }

    const { recipient, amount } = spend[0];
    const proposalMsg = makeCommunityPoolSpendProposalMsg({
      proposer: walletAddress,
      recipient,
      amount,
      denom: denom,
      title: proposalData.title,
      description: proposalData.description,
      deposit: proposalData.deposit,
    });

    try {
      await signAndBroadcast(proposalMsg, "proposal");
      onSubmit(proposalData);
    } catch (e) {
      console.error(e);
      toast.error("Error submitting proposal", { autoClose: 3000 });
    }
  };

  return (
    <ProposalForm
      title="Community Spend Proposal"
      description={
        <>
          This governance proposal to spend funds from the community pool. The
          proposal specifies the recipient address and the amount to be spent.
        </>
      }
      handleSubmit={handleProposal}
      titleDescOnly={true}
      msgType="communityPoolSpendProposal"
      governanceForumLink="https://community.agoric.com/c/governance/community-fund/14"
      denom={denom ? renderDenom(denom) : "...loading"}
    />
  );
};

export { CommunitySpend };
