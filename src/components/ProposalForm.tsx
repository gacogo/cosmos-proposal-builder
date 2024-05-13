import {
  useRef,
  useState,
  useImperativeHandle,
  forwardRef,
  FormEvent,
  ReactNode,
} from "react";
import { CodeInputGroup } from "./CodeInputGroup";
import { CoreEval } from "@agoric/cosmic-proto/swingset/swingset.js";
import { Button } from "./Button";
import { ParamChange } from "cosmjs-types/cosmos/params/v1beta1/params";
import { ParameterChangeFormSection } from "./ParameterChangeForm";
import { DepositSection } from "./DepositSection";
import { paramOptions } from "../config/agoric/params";
import type { ParameterChangeTypeOption } from "../types/form";
import { TitleDescriptionInputs } from "./TitleDescriptionInputs";
import { renderDenom } from "../utils/coin";

const COIN_UNITS = 1_000_000;

type BaseProposalArgs = {
  deposit: string | number;
  description: string;
  title: string;
};

export type FundCommunityPoolProposal = {
  msgType: "fundCommunityPool";
  fundAmount: { amount: string | number; denom: string };
};

export type ProposalArgs = BaseProposalArgs & ProposalDetail;

export type QueryType = ReturnType<(typeof paramOptions)[number]["query"]>;
export type SelectorReturnType = ReturnType<
  (typeof paramOptions)[number]["selector"]
>;

export type ProposalDetail =
  | { msgType: "textProposal" }
  | { msgType: "coreEvalProposal"; evals: CoreEval[] }
  | { msgType: "parameterChangeProposal"; changes: ParamChange[] }
  | {
      msgType: "communityPoolSpendProposal";
      spend: { recipient: string; amount: number; denom: string }[];
    }
  | FundCommunityPoolProposal;

interface ProposalFormProps {
  title?: string;
  description?: string | ReactNode;
  handleSubmit: (proposal: ProposalArgs) => void;
  titleDescOnly?: boolean;
  msgType: QueryParams["msgType"];
  governanceForumLink: string;
  denom?: string;
}

interface ProposalFormMethods {
  reset: () => void;
}

const ProposalForm = forwardRef<ProposalFormMethods, ProposalFormProps>(
  (
    { title, description, handleSubmit, msgType, governanceForumLink, denom },
    ref,
  ) => {
    const [evals, setEvals] = useState<CoreEval[]>([]);
    const formRef = useRef<HTMLFormElement>(null);
    const codeInputRef = useRef<{ reset: () => void } | null>(null);
    const paramChangeRef = useRef<{
      getChanges: () => ParamChange[];
      reset: () => void;
    } | null>(null);

    useImperativeHandle(ref, () => ({
      reset: () => {
        formRef.current?.reset();
        codeInputRef.current?.reset();
        paramChangeRef.current?.reset();
        setEvals([]);
      },
    }));

    const onSubmit = (e: FormEvent) => {
      e.preventDefault();
      if (formRef?.current) {
        const formData = new FormData(formRef.current);
        if (formData) {
          const title = (formData.get("title") as string) || "";
          const description = (formData.get("description") as string) || "";
          const depositBld = (formData.get("deposit") as string) || "";
          const deposit = Number(depositBld) * 1_000_000;
          const args: BaseProposalArgs = { title, description, deposit };
          if (msgType === "coreEvalProposal" && evals.length) {
            return handleSubmit({ ...args, msgType, evals });
          } else if (msgType == "textProposal") {
            return handleSubmit({ ...args, msgType });
          } else if (msgType === "parameterChangeProposal") {
            const changes = paramChangeRef.current?.getChanges();
            if (!Array.isArray(changes)) throw new Error("No changes");
            return handleSubmit({ ...args, msgType, changes });
          } else if (msgType === "communityPoolSpendProposal") {
            const recipient = (formData.get("recipient") as string) || "";
            const requestedAmount = (formData.get("amount") as string) || "";
            const spend: {
              recipient: string;
              amount: number;
              denom: string;
            }[] = [
              {
                recipient,
                amount: Number(requestedAmount) * COIN_UNITS,
                denom: denom!,
              },
            ];
            return handleSubmit({
              ...args,
              msgType,
              spend,
            });
          }
        }
        throw new Error("Error reading form data.");
      }
    };

    return (
      <form ref={formRef} className="" onSubmit={onSubmit}>
        <div className="space-y-12 sm:space-y-16">
          <div>
            <h2 className="text-[28px] font-semibold text-blue">{title}</h2>
            <p className="mt-4 text-sm text-grey">{description}</p>

            <div className="mt-[30px] border-t border-dotted border-lightgrey py-[20px] sm:border-t sm:pb-0">
              {msgType === "parameterChangeProposal" && (
                <ParameterChangeFormSection<QueryType, SelectorReturnType>
                  ref={paramChangeRef}
                  options={
                    paramOptions as unknown as ParameterChangeTypeOption<
                      QueryType,
                      SelectorReturnType
                    >[]
                  }
                />
              )}

              {msgType !== "fundCommunityPool" && (
                <TitleDescriptionInputs
                  communityForumLink={governanceForumLink}
                />
              )}
              {msgType === "fundCommunityPool" && (
                <div className="grid grid-cols-2 gap-[10px] pt-[20px]">
                  <div className="flex items-center">
                    <label
                      htmlFor="fundAmount"
                      className="text-sm font-medium text-blue"
                    >
                      Amount
                    </label>
                    {denom && (
                      <span className="ml-2 text-sm text-gray-500">
                        ({renderDenom(denom)})
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    name="fundAmount"
                    id="fundAmount"
                    className="col-span-2 mt-0 block w-full rounded-md border-0 py-1.5 text-grey shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                    placeholder="Amount to fund the community pool"
                  />
                </div>
              )}
              {msgType === "communityPoolSpendProposal" && (
                <>
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
                      {denom && (
                        <span className="ml-2 text-sm text-gray-500">
                          ({renderDenom(denom)})
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      name="amount"
                      id="amount"
                      className="col-span-2 mt-0 block w-full rounded-md border-0 py-1.5 text-grey shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                      placeholder="Amount to Spend"
                    />
                  </div>
                </>
              )}

              {msgType === "coreEvalProposal" && (
                <div className="grid grid-cols-2 gap-[10px] pt-[20px]">
                  <label
                    htmlFor="description"
                    className="text-sm font-medium text-blue"
                  >
                    Core Eval Files
                  </label>
                  <div className="col-span-2 mt-0">
                    <CodeInputGroup
                      ref={codeInputRef}
                      onPairsChange={setEvals}
                    />
                  </div>
                </div>
              )}

              {msgType !== "fundCommunityPool" && <DepositSection />}
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
  },
);

export { ProposalForm };
