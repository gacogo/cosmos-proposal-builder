import { useMemo, useRef } from "react";
import { ProposalArgs, ProposalForm } from "../../components/ProposalForm";
import { makeSignAndBroadcast } from "../../lib/signAndBroadcast";
import { useNetwork } from "../../hooks/useNetwork";
import { useWallet } from "../../hooks/useWallet";
import { toast } from "react-toastify";
import { renderDenom } from "../../utils/coin";
import { makeFundCommunityPool } from "../../lib/messageBuilder";

const FundCommunityPool = () => {
  const { currentNetworkName: netName, networkConfig } = useNetwork();
  const { walletAddress, stargateClient } = useWallet();
  // console.error('chain info frome template is ', chainInfo);
  console.error("stargate client from template is ", stargateClient);
  const denom = networkConfig?.fees.feeTokens[0].denom;
  const proposalFormRef = useRef<HTMLFormElement>(null);
  const signAndBroadcast = useMemo(
    () => makeSignAndBroadcast(stargateClient, walletAddress, netName!),
    [stargateClient, walletAddress, netName],
  );

  const handleProposal = async (vals: ProposalArgs) => {
    if (!walletAddress) {
      toast.error("Wallet not connected.", { autoClose: 3000 });
      throw new Error("wallet not connected");
    }
    if (vals.msgType === "fundCommunityPool") {
      const { fundAmount } = vals;
      if (!fundAmount || fundAmount.length === 0) {
        throw new Error("No community pool spend data provided");
      }
      const { amount } = fundAmount[0];
      const proposalMsg = makeFundCommunityPool({
        depositor: walletAddress,
        amount,
        denom: denom!,
      });

      try {
        await signAndBroadcast(proposalMsg, "proposal");
        proposalFormRef.current?.reset();
      } catch (e) {
        console.error(e);
        toast.error("Error submitting proposal", { autoClose: 3000 });
      }
    }
  };

  return (
    <ProposalForm
      ref={proposalFormRef}
      handleSubmit={handleProposal}
      titleDescOnly={true}
      title="Fund Community Pool"
      msgType="fundCommunityPool"
      governanceForumLink="https://community.agoric.com/c/governance/community-fund/14"
      description={<>Amount you're sending to the community pool</>}
      denom={denom ? renderDenom(denom) : "...loading"}
    />
  );
};
export { FundCommunityPool };
