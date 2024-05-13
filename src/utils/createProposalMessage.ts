import { ProposalArgs } from "../components/ProposalForm";
import {
  makeCommunityPoolSpendProposalMsg,
  makeCoreEvalProposalMsg,
  makeFundCommunityPool,
  makeInstallBundleMsg,
  makeParamChangeProposalMsg,
  makeTextProposalMsg,
} from "../lib/messageBuilder";

export const createProposalMessage = (
  msgType: QueryParams["msgType"],
  proposalData: ProposalArgs,
  proposer: string,
  denom: string,
) => {
  switch (msgType) {
    case "coreEvalProposal":
      if (!("evals" in proposalData)) throw new Error("Missing evals");
      return makeCoreEvalProposalMsg({
        ...proposalData,
        proposer,
        denom,
      });
    case "textProposal":
      return makeTextProposalMsg({
        ...proposalData,
        proposer,
        denom,
      });
    case "parameterChangeProposal":
      if (!("changes" in proposalData)) throw new Error("Missing changes");
      return makeParamChangeProposalMsg({
        ...proposalData,
        proposer,
        denom,
      });
    case "fundCommunityPool":
      if (!("fundAmount" in proposalData))
        throw new Error("Missing fundAmount");
      return makeFundCommunityPool({
        amount: proposalData.fundAmount.amount,
        depositor: proposer,
        denom: proposalData.fundAmount.denom,
      });
    case "communityPoolSpendProposal": {
      if (
        !("spend" in proposalData) ||
        !Array.isArray(proposalData.spend) ||
        proposalData.spend.length === 0
      ) {
        throw new Error("Missing spend");
      }
      const { spend } = proposalData;
      const { recipient, amount } = spend[0];
      return makeCommunityPoolSpendProposalMsg({
        ...proposalData,
        recipient,
        amount,
        proposer,
        denom,
      });
    }
    case "installBundle": {
      if (
        !("compressedBundle" in proposalData) ||
        !("uncompressedSize" in proposalData)
      ) {
        throw new Error("Missing compressedBundle or uncompressedSize");
      }
      return makeInstallBundleMsg({
        compressedBundle: proposalData.compressedBundle as Uint8Array,
        uncompressedSize: proposalData.uncompressedSize as string,
        submitter: proposer,
      });
    }
    default:
      return null;
  }
};
