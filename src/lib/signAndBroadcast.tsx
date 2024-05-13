import { assertIsDeliverTxSuccess, DeliverTxResponse } from "@cosmjs/stargate";
import type { SigningStargateClient } from "@cosmjs/stargate";
import type { EncodeObject } from "@cosmjs/proto-signing";
import { createId } from "@paralleldrive/cuid2";
import { toast } from "react-toastify";
// import type { NetName } from "../hooks/useNetwork";
import { makeFeeObject } from "./messageBuilder";
import { parseError } from "../utils/transactionParser";
import { TxToastMessage } from "../components/TxToastMessage";

export const makeSignAndBroadcast =
  (
    stargateClient: SigningStargateClient | undefined,
    walletAddress: string | null,
    explorerUrl: string | null,
  ) =>
  async (
    proposalMsg: EncodeObject,
    type: "bundle" | "proposal" = "proposal",
  ) => {
    if (!stargateClient) {
      toast.error("Network not connected.", { autoClose: 3000 });
      throw new Error("stargateClient not found");
    }
    if (!walletAddress) throw new Error("wallet not connected");
    const toastId = createId();
    toast.loading("Broadcasting transaction...", {
      toastId,
    });
    let txResult: DeliverTxResponse | undefined;
    try {
      const estimate = await stargateClient.simulate(
        walletAddress,
        [proposalMsg],
        undefined,
      );
      const adjustment = 1.3;
      const gas = Math.ceil(estimate * adjustment);
      txResult = await stargateClient.signAndBroadcast(
        walletAddress,
        [proposalMsg],
        makeFeeObject({ gas }),
      );
      assertIsDeliverTxSuccess(txResult);
    } catch (e) {
      toast.update(toastId, {
        render: parseError(e as Error),
        type: "error",
        isLoading: false,
        autoClose: 10000,
      });
      throw e;
    }
    if (txResult && txResult.code === 0) {
      toast.update(toastId, {
        render: ({ closeToast }) => (
          <TxToastMessage
            resp={txResult as DeliverTxResponse}
            explorerUrl={explorerUrl as string}
            closeToast={closeToast as () => void}
            type={type}
          />
        ),
        type: "success",
        isLoading: false,
      });
      return txResult;
    }
  };
