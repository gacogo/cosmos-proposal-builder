import { toast } from "react-toastify";
import { DeliverTxResponse } from "@cosmjs/stargate";
import { ArrowTopRightOnSquareIcon } from "@heroicons/react/20/solid";
import { ClipboardDocumentIcon } from "@heroicons/react/20/solid";
import { XMarkIcon } from "@heroicons/react/20/solid";
import { getTxUrl, getGovUrl, parseProposal } from "../utils/transactionParser";

export function TxToastMessage({
  resp,
  explorerUrl,
  closeToast = () => {},
  type,
}: {
  resp: DeliverTxResponse;
  explorerUrl: string | null;
  closeToast: () => void;
  type: "bundle" | "proposal";
}) {
  const { proposalId, transactionHash } = parseProposal(resp);
  console.error("proposalId", proposalId, "transactionHash", transactionHash)
  console.error("explorerUrl", explorerUrl)
  const txUrl = getTxUrl(transactionHash, explorerUrl );
  const govUrl = getGovUrl(proposalId as string, explorerUrl);
  const txString = txUrl ? (
    <a
      className="text-sm text-blue-500 hover:text-blue-700 underline"
      target="_blank"
      rel="noopener noreferrer"
      href={txUrl}
    >
      View Transaction{" "}
      <ArrowTopRightOnSquareIcon className="inline-block w-4 h-4" />
    </a>
  ) : (
    <>
      <span
        className="text-sm text-blue-500 hover:text-blue-700 underline cursor-pointer"
        onClick={async () => {
          await window.navigator.clipboard.writeText(transactionHash);
          toast.info("Copied to clipboard!", {
            position: "bottom-center",
            autoClose: 3000,
            hideProgressBar: true,
          });
        }}
      >
        Copy Tx Hash <ClipboardDocumentIcon className="inline-block w-4 h-4" />
      </span>
    </>
  );
  const voteString = govUrl ? (
    <a
      className="text-sm text-blue-500 hover:text-blue-700 underline ml-3"
      target="_blank"
      rel="noopener noreferrer"
      href={govUrl || ""}
    >
      Vote <ArrowTopRightOnSquareIcon className="inline-block w-4 h-4" />
    </a>
  ) : null;

  return (
    <div className="flex items-start pointer-events-auto">
      <div className="ml-3 w-0 flex-1 pt-0.5">
        <p className="text-sm font-medium text-gray-900">
          {type === "proposal"
            ? `Proposal ${proposalId} Submitted!`
            : "Bundle Submitted!"}
        </p>
        <span className="mt-1 text-sm text-gray-500">
          {txString} {voteString}
        </span>
      </div>
      <div className="ml-4 flex flex-shrink-0">
        <button
          type="button"
          className="inline-flex rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
          onClick={closeToast}
        >
          <span className="sr-only">Close</span>
          <XMarkIcon className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
