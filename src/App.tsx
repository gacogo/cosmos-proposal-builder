import { useRef } from "react";
import { StdFee } from "@cosmjs/amino";
import { assertIsDeliverTxSuccess, DeliverTxResponse } from "@cosmjs/stargate";
import { EncodeObject } from "@cosmjs/proto-signing";
import { createId } from "@paralleldrive/cuid2";
import { toast, ToastContainer } from "react-toastify";
import { Code, Link } from "./components/inline";
import { BundleForm, BundleFormArgs } from "./components/BundleForm";
import { ProposalForm, ProposalArgs } from "./components/ProposalForm";
import { Nav } from "./components/Nav";
import { Footer } from "./components/Footer";
import { NetworkDropdown } from "./components/NetworkDropdown";
import { WalletConnectButton } from "./components/WalletConnectButton";
import { Tabs } from "./components/Tabs";
import { TxToastMessage } from "./components/TxToastMessage";
import { useNetwork, NetName } from "./hooks/useNetwork";
import { useWallet } from "./hooks/useWallet";
import { compressBundle } from "./lib/compression";
import {
  makeCoreEvalProposalMsg,
  makeTextProposalMsg,
  makeInstallBundleMsg,
  makeFeeObject,
  makeParamChangeProposalMsg,
} from "./lib/messageBuilder";
import { parseError } from "./utils/transactionParser";
import { isValidBundle } from "./utils/validate";

const App = () => {
  const { netName } = useNetwork();
  const { walletAddress, stargateClient } = useWallet();
  const proposalFormRef = useRef<HTMLFormElement>(null);
  const corEvalFormRef = useRef<HTMLFormElement>(null);
  const bundleFormRef = useRef<HTMLFormElement>(null);

  async function signAndBroadcast(
    proposalMsg: EncodeObject,
    feeArgs = {},
    type: "bundle" | "proposal"
  ) {
    if (!stargateClient) {
      toast.error("Network not connected.", { autoClose: 3000 });
      throw new Error("stargateClient not found");
    }
    if (!walletAddress) throw new Error("wallet not connected");
    const fee = makeFeeObject(feeArgs);
    const toastId = createId();
    toast.loading("Broadcasting transaction...", {
      toastId,
    });
    let txResult: DeliverTxResponse | undefined;
    try {
      txResult = await stargateClient.signAndBroadcast(
        walletAddress,
        [proposalMsg],
        fee
      );
      assertIsDeliverTxSuccess(txResult);
    } catch (e) {
      toast.update(toastId, {
        render: parseError(e as Error),
        type: "error",
        isLoading: false,
        autoClose: 10000,
      });
    }
    if (txResult && txResult.code === 0) {
      toast.update(toastId, {
        render: ({ closeToast }) => (
          <TxToastMessage
            resp={txResult as DeliverTxResponse}
            netName={netName as NetName}
            closeToast={closeToast as () => void}
            type={type}
          />
        ),
        type: "success",
        isLoading: false,
      });
      if (type === "proposal") {
        proposalFormRef.current?.reset();
        corEvalFormRef.current?.reset();
      }
      if (type === "bundle") bundleFormRef.current?.reset();
    }
  }

  async function handleBundle(vals: BundleFormArgs) {
    if (!walletAddress) {
      toast.error("Wallet not connected.", { autoClose: 3000 });
      throw new Error("wallet not connected");
    }
    if (!isValidBundle(vals.bundle)) throw new Error("Invalid bundle.");
    const { compressedBundle, uncompressedSize } = await compressBundle(
      JSON.parse(vals.bundle)
    );
    const proposalMsg = makeInstallBundleMsg({
      compressedBundle,
      uncompressedSize,
      submitter: walletAddress,
    });
    // @todo gas estiates
    const feeArgs: Partial<StdFee> = { gas: "50000000" };
    await signAndBroadcast(proposalMsg, feeArgs, "bundle");
  }

  function handleProposal(msgType: QueryParams["msgType"]) {
    return async (vals: ProposalArgs) => {
      if (!walletAddress) {
        toast.error("Wallet not connected.", { autoClose: 3000 });
        throw new Error("wallet not connected");
      }
      let proposalMsg;
      const feeArgs: Partial<StdFee> = {};
      if (msgType === "coreEvalProposal") {
        if (!("evals" in vals)) throw new Error("Missing evals");
        proposalMsg = makeCoreEvalProposalMsg({
          ...vals,
          proposer: walletAddress,
        });
        // @todo gas estiates
        // @ts-expect-error gas
        feeArgs.gas = "2500000";
      }
      if (msgType === "textProposal") {
        proposalMsg = makeTextProposalMsg({
          ...vals,
          proposer: walletAddress,
        });
      }
      if (msgType === "parameterChangeProposal") {
        if (vals.msgType !== "parameterChangeProposal") return;
        proposalMsg = makeParamChangeProposalMsg({
          ...vals,
          proposer: walletAddress,
        });
      }
      if (!proposalMsg) throw new Error("Error parsing query or inputs.");

      await signAndBroadcast(proposalMsg, feeArgs, "proposal");
    };
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Nav
        title="Gov Proposal Builder"
        showLogo={true}
        rightContent={
          <>
            <div className="mr-6 relative">
              <NetworkDropdown />
            </div>
            <WalletConnectButton theme="white" />
          </>
        }
      />
      <main className="flex-grow mx-auto max-w-7xl min-w-full py-6 sm:px-6 lg:px-8">
        <Tabs
          tabs={[
            {
              title: "Text Proposal",
              msgType: "textProposal",
              content: (
                <ProposalForm
                  ref={proposalFormRef}
                  handleSubmit={handleProposal("textProposal")}
                  titleDescOnly={true}
                  title="/cosmos.gov.v1beta1.TextProposal"
                  msgType="textProposal"
                  description={
                    <>
                      This is a governance proposal that can be used for
                      signaling support or agreement on a certain topic or idea.
                      Text proposals do not contain any code, and do not
                      directly enact changes after a passing vote.
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
                  ref={corEvalFormRef}
                  handleSubmit={handleProposal("coreEvalProposal")}
                  titleDescOnly={false}
                  title="/agoric.swingset.CoreEvalProposal"
                  msgType="coreEvalProposal"
                  description={
                    <>
                      This is a governance proposal that executes code after a
                      passing vote. The JSON Permit grants{" "}
                      <Link href="https://docs.agoric.com/guides/coreeval/permissions.html">
                        capabilities
                      </Link>{" "}
                      and the JS Script can install and start a contract. These
                      files can be generated with the <Code>agoric run</Code>{" "}
                      command. For more details, see the{" "}
                      <Link href="https://docs.agoric.com/guides/coreeval/">
                        official docs
                      </Link>
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
                  ref={bundleFormRef}
                  title="/agoric.swingset.MsgInstallBundle"
                  handleSubmit={handleBundle}
                  description={
                    <>
                      The install bundle message deploys and installs an
                      external bundle generated during the{" "}
                      <Code>agoric run</Code> process. The resulting
                      installation can be referenced in a{" "}
                      <Link href="https://docs.agoric.com/guides/coreeval/">
                        CoreEval proposal
                      </Link>{" "}
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
                  title="/cosmos.gov.v1.MsgUpdateParams"
                  handleSubmit={handleProposal("parameterChangeProposal")}
                  description="This is a governance proposal to change chain configuration parameters."
                  msgType="parameterChangeProposal"
                />
              ),
            },
          ]}
        />
      </main>
      <Footer />
      <ToastContainer
        autoClose={false}
        position="bottom-right"
        closeOnClick={false}
        closeButton={true}
        bodyClassName="text-sm font-medium text-gray-900"
      />
    </div>
  );
};

export default App;
