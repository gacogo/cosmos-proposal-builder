import { ProposalArgs } from "../components/ProposalForm";
import {
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
      if (proposalData.msgType !== "parameterChangeProposal") return null;
      return makeParamChangeProposalMsg({
        ...proposalData,
        proposer,
        denom,
      });
    case "fundCommunityPool":
      if (!("fundAmount" in proposalData))
        throw new Error("Missing fundAmount");
      return makeFundCommunityPool({
        ...proposalData,
        amount: proposalData.fundAmount[0].amount,
        depositor: proposer,
        denom,
      });
    case "installBundle":
      if (
        !("compressedBundle" in proposalData) ||
        !("uncompressedSize" in proposalData)
      ) {
        throw new Error("Missing compressedBundle or uncompressedSize");
      }
      return makeInstallBundleMsg({
        compressedBundle: proposalData.compressedBundle as Uint8Array,
        uncompressedSize: proposalData.uncompressedSize as string, // Cast uncompressedSize to string
        submitter: proposer,
      });
    default:
      return null;
  }
};
