import { DeliverTxResponse } from "@cosmjs/stargate";

const blockExplorerUrls: Record<string, string | null> = {
  local: null,
  devnet: "https://devnet.explorer.agoric.net/agoric",
  emerynet: "https://emerynet.explorer.agoric.net/agoric",
  xnet: "https://xnet.explorer.agoric.net/agoric",
  ollinet: "https://ollinet.explorer.agoric.net/agoric",
  main: "https://ping.pub/agoric",
};

// export const getTxUrl = (netName: string, txHash: string) => {
//   if (!blockExplorerUrls[netName]) return null;
//   return `${blockExplorerUrls[netName]}/tx/${txHash}`;
// };
// export const getGovUrl = (netName: string, proposalId: string) => {
//   if (!blockExplorerUrls[netName] || !proposalId) return null;
//   return `${blockExplorerUrls[netName]}/gov/${proposalId}`;
// };

export const getGovUrl = (proposalId: string, explorerUrl: string | null, ) => {
  if (!explorerUrl || !proposalId) return null;
  return `${explorerUrl}/gov/${proposalId}`;
}
export const getTxUrl = (txHash: string, explorerUrl: string | null, ) => {
  if (!explorerUrl) return null;
  return `${explorerUrl}/tx/${txHash}`;
}


export function parseError(error: Error) {
  if (error.message.includes("does not exist on chain")) {
    // @todo, prompt provisionWallet
    return "Account does not exist. Please provision smart wallet.";
  }
  if (error.message.includes("insufficient funds")) {
    const match = error.message.match(
      /(\d+)(uist|ubld) is smaller than (\d+)(uist|ubld)/,
    );
    if (match) {
      const available = BigInt(match[1]) / BigInt(1e6);
      const required = BigInt(match[3]) / BigInt(1e6);
      const currency = match[2].slice(1).toUpperCase();
      return `Insufficient funds. ${required} ${currency} required, only ${available} ${currency} available.`;
    }
  }
  if (error.message.includes(`key: votingparams, value: {"voting_period":"`)) {
    return "Voting period currently only supports nanoseconds (1e-9). Encoding support for 's', 'm', 'h', 'd' will be added soon.";
  }
  if (error.message.includes("proposal title cannot be blank")) {
    return "Proposal title cannot be blank.";
  }
  if (error.message.includes("proposal description cannot be blank")) {
    return "Proposal description cannot be blank.";
  }

  return error.message;
}

export function parseProposal(resp: DeliverTxResponse) {
  const { transactionHash, events } = resp;
  const proposalId = events
    .find((event) => event.type === "submit_proposal")
    ?.attributes.find((attr) => attr.key === "proposal_id")?.value;

  return {
    transactionHash,
    proposalId,
  };
}

// not currently used, no need to show bundleId ?
export function parseBundle(resp: DeliverTxResponse) {
  const { transactionHash, events } = resp;
  const bundleId = events
    .find((event) => event.type === "create_bundle")
    ?.attributes.find((attr) => attr.key === "bundle_id")?.value;

  return {
    transactionHash,
    bundleId,
  };
}
